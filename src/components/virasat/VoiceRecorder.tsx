import { useState, useEffect, useCallback, useRef } from "react";
import { Mic, Square, Loader2, Play, Pause, Check, RotateCcw, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface VoiceRecorderProps {
  onTranscript: (text: string, audioPath?: string) => void;
  isProcessing: boolean;
  sessionId?: string | null;
  onRequestWrite?: () => void;
}

type RecorderState = "idle" | "recording" | "preview" | "processing";

const formatTime = (s: number) => {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};

export default function VoiceRecorder({ onTranscript, isProcessing, sessionId, onRequestWrite }: VoiceRecorderProps) {
  const { user } = useAuth();
  const [state, setState] = useState<RecorderState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [editableTranscript, setEditableTranscript] = useState("");

  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const sttUnsupportedRef = useRef(false);
  const transcriptRef = useRef("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const tickRef = useRef<number | null>(null);

  // Setup speech recognition once
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      sttUnsupportedRef.current = true;
      setError("Aapke phone ka browser live transcript support nahi karta. Aap audio record kar sakte hain ya likh sakte hain.");
      return;
    }
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "hi-IN";
    r.maxAlternatives = 1;

    r.onresult = (event: any) => {
      let finalT = transcriptRef.current;
      let interimT = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalT += t;
        else interimT += t;
      }
      transcriptRef.current = finalT;
      setTranscript(finalT);
      setInterim(interimT);
    };
    r.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("Mic access nahi mila. Settings mein permission den.");
        isRecordingRef.current = false;
      } else if (event.error === "network") {
        setError("Internet dikkat — voice text ke liye net chahiye.");
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        // Don't surface every transient error on mobile; just log and let onend restart
        console.warn("[STT] transient error:", event.error);
      }
    };
    r.onend = () => {
      // Mobile browsers (esp. Android Chrome) end recognition every ~10s of silence.
      // Auto-restart while we're still actively recording.
      if (isRecordingRef.current) {
        const tryRestart = (attempt = 0) => {
          try { r.start(); } catch (e: any) {
            if (attempt < 3 && /InvalidStateError|already started/i.test(String(e?.name || e?.message || ""))) {
              setTimeout(() => tryRestart(attempt + 1), 250);
            }
          }
        };
        tryRestart();
      }
    };
    r.onnomatch = () => { /* keep engine alive on Android */ };
    r.onaudiostart = () => { /* no-op */ };
    recognitionRef.current = r;

    return () => {
      try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Waveform animation
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLen = analyser.frequencyBinCount;
    const data = new Uint8Array(bufferLen);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(data);
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const bars = 48;
      const step = Math.floor(bufferLen / bars);
      const barW = w / bars - 2;
      for (let i = 0; i < bars; i++) {
        const v = data[i * step] / 255;
        const barH = Math.max(2, v * h * 0.9);
        ctx.fillStyle = `hsl(25 ${40 + v * 30}% ${50 - v * 10}%)`;
        ctx.fillRect(i * (barW + 2), (h - barH) / 2, barW, barH);
      }
    };
    draw();
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript("");
    setInterim("");
    transcriptRef.current = "";
    setDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Audio analyser for waveform
      const ac = new AudioContext();
      const source = ac.createMediaStreamSource(stream);
      const analyser = ac.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioContextRef.current = ac;
      analyserRef.current = analyser;

      // MediaRecorder for audio capture
      const mime = MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";
      const mr = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        audioBlobRef.current = blob;
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };
      mr.start();
      mediaRecorderRef.current = mr;

      // Mark recording BEFORE starting recognition so onend's auto-restart sees it.
      isRecordingRef.current = true;

      // Start recognition with retry — Android Chrome can throw InvalidStateError
      // if a previous session hasn't fully released yet.
      const startStt = (attempt = 0) => {
        const rec = recognitionRef.current;
        if (!rec) return;
        try { rec.start(); } catch (e: any) {
          if (attempt < 3 && /InvalidStateError|already started/i.test(String(e?.name || e?.message || ""))) {
            setTimeout(() => startStt(attempt + 1), 250);
          }
        }
      };
      startStt();

      setState("recording");
      startTimeRef.current = Date.now();
      tickRef.current = window.setInterval(() => {
        setDuration((Date.now() - startTimeRef.current) / 1000);
      }, 200);

      requestAnimationFrame(drawWaveform);
    } catch (e) {
      console.error(e);
      setError("Mic shuru nahi ho paya. Permission check karein.");
    }
  }, [drawWaveform]);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    try { mediaRecorderRef.current?.stop(); } catch { /* ignore */ }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    audioContextRef.current?.close().catch(() => { /* ignore */ });
    audioContextRef.current = null;
    analyserRef.current = null;

    setEditableTranscript(transcriptRef.current.trim());
    setState("preview");
  }, []);

  const discard = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    audioBlobRef.current = null;
    setTranscript("");
    setInterim("");
    setEditableTranscript("");
    transcriptRef.current = "";
    setDuration(0);
    setState("idle");
  }, [audioUrl]);

  const togglePlay = useCallback(() => {
    if (!audioElRef.current) return;
    if (isPlaying) audioElRef.current.pause();
    else audioElRef.current.play().catch(() => { /* ignore */ });
  }, [isPlaying]);

  const useThis = useCallback(async () => {
    const finalText = editableTranscript.trim();
    if (!finalText) {
      setError("Koi text nahi mila. Phir se record karein ya likhein.");
      return;
    }
    setState("processing");

    let audioPath: string | undefined;
    let mediaRowId: string | undefined;
    const blob = audioBlobRef.current;
    const isNativeMp4 = !!blob && (blob.type.includes("mp4") || blob.type.includes("m4a"));

    // Best-effort upload of the audio clip if we have a session
    if (blob && sessionId && user) {
      try {
        const ext = isNativeMp4 ? "mp4" : "webm";
        const path = `${user.id}/${sessionId}/voice-${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("virasat-media")
          .upload(path, blob, { contentType: blob.type || (isNativeMp4 ? "audio/mp4" : "audio/webm") });
        if (!upErr) {
          audioPath = path;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: row } = await (supabase as any).from("virasat_media").insert({
            session_id: sessionId,
            user_id: user.id,
            media_type: "audio",
            storage_path: path,
            duration_seconds: duration,
            mp4_storage_path: isNativeMp4 ? path : null,
            transcode_status: isNativeMp4 ? "done" : "pending",
          }).select("id").single();
          mediaRowId = row?.id;
        }
      } catch (e) {
        console.error("Audio upload failed (continuing):", e);
      }
    }

    // Fire-and-forget: transcode webm -> mp4 in background after we hand off the transcript.
    if (blob && !isNativeMp4 && audioPath && mediaRowId && user && sessionId) {
      const rowId = mediaRowId;
      (async () => {
        try {
          const { transcodeWebmToMp4 } = await import("./lib/audioTranscode");
          const mp4Blob = await transcodeWebmToMp4(blob);
          if (!mp4Blob) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any).from("virasat_media").update({ transcode_status: "failed" }).eq("id", rowId);
            return;
          }
          const mp4Path = `${user.id}/${sessionId}/voice-${crypto.randomUUID()}.mp4`;
          const { error: upErr } = await supabase.storage
            .from("virasat-media")
            .upload(mp4Path, mp4Blob, { contentType: "audio/mp4" });
          if (upErr) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any).from("virasat_media").update({ transcode_status: "failed" }).eq("id", rowId);
            return;
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from("virasat_media").update({
            mp4_storage_path: mp4Path,
            transcode_status: "done",
          }).eq("id", rowId);
        } catch (e) {
          console.warn("[VoiceRecorder] background mp4 transcode failed:", e);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from("virasat_media").update({ transcode_status: "failed" }).eq("id", rowId);
        }
      })();
    }

    onTranscript(finalText, audioPath);
    discard();
  }, [editableTranscript, sessionId, user, duration, onTranscript, discard]);

  // Keep audio element in sync
  useEffect(() => {
    const a = audioElRef.current;
    if (!a) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnded);
    };
  }, [audioUrl]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg text-sm font-medium border border-destructive/20 flex items-center gap-3">
          <span>{error}</span>
          {onRequestWrite && (
            <button onClick={onRequestWrite} className="underline font-bold">
              Likhne par jaayein
            </button>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        {state === "idle" && !isProcessing && (
          <motion.div key="idle" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex flex-col items-center gap-3">
            <button
              onClick={startRecording}
              className="w-20 h-20 bg-[hsl(25_40%_45%)] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[hsl(25_40%_40%)] transition-all hover:scale-105 active:scale-95"
            >
              <Mic size={32} />
            </button>
            <p className="text-[hsl(25_15%_55%)] font-medium text-sm">Mic dabaiye, baat shuru kijiye</p>
          </motion.div>
        )}

        {state === "recording" && (
          <motion.div key="rec" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3 w-full max-w-xl">
            <div className="flex items-center gap-3 px-4 py-1.5 bg-red-500/10 rounded-full">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-red-500">REC</span>
              <span className="text-sm font-mono font-bold text-red-600 tabular-nums">{formatTime(duration)}</span>
            </div>

            <canvas ref={canvasRef} width={480} height={56} className="w-full max-w-md h-14 rounded-lg bg-[hsl(25_40%_45%/0.05)]" />

            <div className="w-full max-w-md min-h-[60px] px-4 py-3 bg-white rounded-xl border border-[hsl(25_40%_45%/0.1)] text-center">
              <p className="text-[hsl(25_30%_15%)] text-base leading-relaxed">
                {transcript || <span className="text-[hsl(25_15%_55%)] italic">Bolna shuru kijiye...</span>}
                {interim && <span className="text-[hsl(25_15%_55%)] italic"> {interim}</span>}
              </p>
            </div>

            <button
              onClick={stopRecording}
              className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
            >
              <Square size={26} fill="currentColor" />
            </button>
            <p className="text-xs text-[hsl(25_15%_55%)]">Ruk-ne ke liye dabaiye</p>
          </motion.div>
        )}

        {state === "preview" && (
          <motion.div key="preview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3 w-full max-w-xl">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-widest text-[hsl(25_40%_45%)]">Sun lijiye</span>
              <span className="text-sm font-mono text-[hsl(25_15%_55%)] tabular-nums">{formatTime(duration)}</span>
            </div>

            {audioUrl && (
              <div className="flex items-center gap-3 w-full max-w-md bg-white border border-[hsl(25_40%_45%/0.15)] rounded-full px-4 py-2 shadow-sm">
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-[hsl(25_40%_45%)] text-white flex items-center justify-center hover:bg-[hsl(25_40%_40%)] transition-colors flex-shrink-0"
                >
                  {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                </button>
                <audio ref={audioElRef} src={audioUrl} controls className="w-full h-8" />
              </div>
            )}

            <textarea
              value={editableTranscript}
              onChange={(e) => setEditableTranscript(e.target.value)}
              rows={3}
              placeholder="Transcript yahan hai — sudhar bhi sakte hain..."
              className="w-full max-w-md px-4 py-3 rounded-xl border border-[hsl(25_40%_45%/0.15)] bg-white text-[hsl(25_30%_15%)] text-base focus:border-[hsl(25_40%_45%)] focus:outline-none resize-none"
            />

            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                onClick={useThis}
                className="flex items-center gap-2 px-5 py-2.5 bg-[hsl(25_40%_45%)] text-white rounded-full font-medium shadow-md hover:bg-[hsl(25_40%_40%)] transition-colors"
              >
                <Check size={16} /> Yahi rakhiye
              </button>
              <button
                onClick={() => { discard(); startRecording(); }}
                className="flex items-center gap-2 px-5 py-2.5 border border-[hsl(25_40%_45%)] text-[hsl(25_40%_45%)] rounded-full font-medium hover:bg-[hsl(25_40%_45%/0.05)] transition-colors"
              >
                <RotateCcw size={16} /> Phir record karein
              </button>
              <button
                onClick={discard}
                className="flex items-center gap-2 px-4 py-2.5 text-[hsl(25_15%_55%)] hover:text-red-500 rounded-full font-medium transition-colors"
              >
                <Trash2 size={16} /> Mitao
              </button>
            </div>
          </motion.div>
        )}

        {(state === "processing" || (state === "idle" && isProcessing)) && (
          <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
            <div className={cn("w-16 h-16 rounded-full flex items-center justify-center bg-[hsl(25_40%_45%/0.1)]")}>
              <Loader2 className="animate-spin text-[hsl(25_40%_45%)]" size={28} />
            </div>
            <p className="text-[hsl(25_15%_55%)] font-medium text-sm">Soch raha hoon...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
