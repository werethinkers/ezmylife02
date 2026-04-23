import { useState, useEffect, useCallback, useRef } from "react";
import { Mic, Square, Loader2, Pause, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  isProcessing: boolean;
  isPaused: boolean;
  onTogglePause: () => void;
  autoStart?: boolean;
}

export default function VoiceRecorder({
  onTranscript,
  isProcessing,
  isPaused,
  onTogglePause,
  autoStart = false,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef("");
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsRecording(false);
      const final = transcriptRef.current.trim();
      if (final) onTranscriptRef.current(final);
      transcriptRef.current = "";
      setTranscript("");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setError("Aapka browser voice recording support nahi karta. Kripya Chrome use karein.");
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "hi-IN";

    rec.onresult = (event: any) => {
      let cur = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        cur += event.results[i][0].transcript;
      }
      transcriptRef.current = cur;
      setTranscript(cur);
    };
    rec.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") setError("Mic access nahi mila. Settings mein allow karein.");
      else if (event.error !== "no-speech" && event.error !== "aborted") setError("Kuch gadbad hui. Phir se try karein.");
      setIsRecording(false);
    };
    rec.onend = () => setIsRecording(false);
    recognitionRef.current = rec;

    return () => {
      try { rec.stop(); } catch {}
    };
  }, []);

  const startRecording = useCallback(() => {
    setError(null);
    if (!recognitionRef.current) {
      setError("Voice recognition taiyaar nahi hai. Refresh karein.");
      return;
    }
    setTranscript("");
    transcriptRef.current = "";
    try {
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (e: any) {
      if (e?.message?.includes("already started")) setIsRecording(true);
      else setError("Mic shuru nahi ho pa raha. Refresh karein.");
    }
  }, []);

  // Auto-start when autoStart toggles true (after AI finishes speaking)
  useEffect(() => {
    if (autoStart && !isRecording && !isProcessing && !isPaused) {
      const t = setTimeout(() => startRecording(), 200);
      return () => clearTimeout(t);
    }
  }, [autoStart, isRecording, isProcessing, isPaused, startRecording]);

  return (
    <div className="flex flex-col items-center gap-6">
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg text-sm border border-destructive/20">
          {error}
        </div>
      )}
      <AnimatePresence mode="wait">
        {isRecording ? (
          <motion.div key="rec" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex flex-col items-center gap-4">
            <div className="relative">
              <motion.div animate={{ scale: [1, 1.25, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute inset-0 bg-primary/20 rounded-full -z-10" />
              <button onClick={stopRecording} className="w-24 h-24 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition">
                <Square size={36} fill="currentColor" />
              </button>
            </div>
            <p className="text-muted-foreground font-medium animate-pulse">Papa, main sun raha hoon...</p>
            <div className="max-w-md text-center px-4 min-h-[3rem]">
              <p className="text-foreground/80 italic line-clamp-3">{transcript || "Bolna shuru kijiye..."}</p>
            </div>
          </motion.div>
        ) : isProcessing ? (
          <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={36} />
            </div>
            <p className="text-muted-foreground font-medium">Soch raha hoon...</p>
          </motion.div>
        ) : isPaused ? (
          <motion.div key="paused" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
            <button onClick={onTogglePause} className="w-24 h-24 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition">
              <Play size={36} />
            </button>
            <p className="text-muted-foreground font-medium">Aaram se. Jab ready ho, click karein.</p>
          </motion.div>
        ) : (
          <motion.div key="idle" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
            <button onClick={startRecording} className="w-24 h-24 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform">
              <Mic size={36} />
            </button>
            <p className="text-muted-foreground font-medium">Mic par click karke baat kijiye</p>
          </motion.div>
        )}
      </AnimatePresence>

      {(isRecording || autoStart) && !isProcessing && (
        <Button variant="outline" size="sm" onClick={onTogglePause} className="gap-2">
          {isPaused ? <><Play className="h-4 w-4" /> Resume</> : <><Pause className="h-4 w-4" /> Pause</>}
        </Button>
      )}
    </div>
  );
}
