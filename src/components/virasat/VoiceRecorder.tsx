import { useState, useEffect, useCallback, useRef } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  isProcessing: boolean;
}

export default function VoiceRecorder({ onTranscript, isProcessing }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef("");
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { console.error(e); }
      setIsRecording(false);
      const finalTranscript = transcriptRef.current.trim();
      if (finalTranscript) onTranscriptRef.current(finalTranscript);
      transcriptRef.current = "";
      setTranscript("");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Aapka browser voice recording support nahi karta. Kripya Chrome use karein.");
      return;
    }
    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = "hi-IN";

    recognitionInstance.onresult = (event: any) => {
      let currentTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      transcriptRef.current = currentTranscript;
      setTranscript(currentTranscript);
    };

    recognitionInstance.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        setError("Mic access nahi mila. Kripya settings mein allow karein.");
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        setError("Kuch gadbad hui. Kripya phir se koshish karein.");
      }
      setIsRecording(false);
    };

    recognitionInstance.onend = () => setIsRecording(false);
    recognitionRef.current = recognitionInstance;

    return () => {
      try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    };
  }, []);

  const startRecording = useCallback(() => {
    setError(null);
    if (!recognitionRef.current) {
      setError("Voice recognition taiyaar nahi hai.");
      return;
    }
    setTranscript("");
    transcriptRef.current = "";
    try {
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (e) {
      console.error(e);
      if (e instanceof Error && e.message.includes("already started")) {
        setIsRecording(true);
      } else {
        setError("Mic shuru nahi ho pa raha. Kripya page refresh karein.");
      }
    }
  }, []);

  return (
    <div className="flex flex-col items-center gap-6">
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg text-sm font-medium border border-destructive/20">
          {error}
        </div>
      )}
      <AnimatePresence mode="wait">
        {isRecording ? (
          <motion.div key="recording" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex flex-col items-center gap-4">
            <div className="relative">
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute inset-0 bg-red-100 rounded-full -z-10" />
              <button onClick={stopRecording} className="w-20 h-20 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors">
                <Square size={32} fill="currentColor" />
              </button>
            </div>
            <p className="text-[hsl(25_15%_55%)] font-medium animate-pulse">Papa, main sun raha hoon...</p>
            <div className="max-w-md text-center px-4">
              <p className="text-[hsl(25_30%_15%)] italic opacity-70 line-clamp-3">{transcript || "Bolna shuru kijiye..."}</p>
            </div>
          </motion.div>
        ) : isProcessing ? (
          <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
            <div className={cn("w-20 h-20 rounded-full flex items-center justify-center", "bg-[hsl(25_40%_45%/0.1)]")}>
              <Loader2 className="animate-spin text-[hsl(25_40%_45%)]" size={32} />
            </div>
            <p className="text-[hsl(25_15%_55%)] font-medium">Soch raha hoon...</p>
          </motion.div>
        ) : (
          <motion.div key="idle" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
            <button onClick={startRecording} className="w-20 h-20 bg-[hsl(25_40%_45%)] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[hsl(25_40%_40%)] transition-all hover:scale-105 active:scale-95">
              <Mic size={32} />
            </button>
            <p className="text-[hsl(25_15%_55%)] font-medium">Mic par click karke baat kijiye</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
