import { useState } from "react";
import { Send, Loader2, Pencil } from "lucide-react";
import { motion } from "framer-motion";

interface WrittenInputProps {
  onSubmit: (text: string) => void;
  isProcessing: boolean;
}

const PLACEHOLDERS = [
  "Likhiye apni yaad...",
  "Jo dil mein hai, bas likh dijiye...",
  "Koi aisi baat jo aap apne bachche ko batana chahein...",
  "Koi yaad, koi seekh, koi sapna...",
];

export default function WrittenInput({ onSubmit, isProcessing }: WrittenInputProps) {
  const [text, setText] = useState("");
  const placeholder = PLACEHOLDERS[Math.floor(Date.now() / 5000) % PLACEHOLDERS.length];

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || isProcessing) return;
    onSubmit(trimmed);
    setText("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3 w-full max-w-2xl mx-auto"
    >
      <div className="relative">
        <Pencil
          size={18}
          className="absolute left-4 top-4 text-[hsl(25_15%_55%)]"
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
          placeholder={placeholder}
          disabled={isProcessing}
          rows={4}
          className="w-full pl-11 pr-4 py-4 rounded-2xl border-2 border-[hsl(25_40%_45%/0.15)] bg-white text-[hsl(25_30%_15%)] placeholder:text-[hsl(25_15%_55%/0.7)] focus:border-[hsl(25_40%_45%)] focus:outline-none transition-colors text-base leading-relaxed resize-none shadow-sm"
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-[hsl(25_15%_55%)]">
          Tip: Cmd/Ctrl + Enter se bhejein
        </p>
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isProcessing}
          className="flex items-center gap-2 px-6 py-3 bg-[hsl(25_40%_45%)] text-white rounded-full font-medium shadow-md hover:bg-[hsl(25_40%_40%)] hover:scale-105 transition-all disabled:opacity-40 disabled:hover:scale-100"
        >
          {isProcessing ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Send size={18} />
          )}
          Bhejein
        </button>
      </div>
    </motion.div>
  );
}
