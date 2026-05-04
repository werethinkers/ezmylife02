import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ToolMedia {
  id: string;
  kind: "video" | "image" | "gif";
  url: string;
  poster_url: string | null;
  alt: string | null;
}

interface Props {
  toolId: string;
  className?: string;
  autoPlay?: boolean;
}

export const ToolMediaCarousel = ({ toolId, className, autoPlay = true }: Props) => {
  const [media, setMedia] = useState<ToolMedia[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("tool_media")
        .select("id, kind, url, poster_url, alt")
        .eq("tool_id", toolId)
        .order("sort_order", { ascending: true });
      if (alive) setMedia((data as ToolMedia[]) ?? []);
    })();
    return () => { alive = false; };
  }, [toolId]);

  useEffect(() => {
    if (!autoPlay || media.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % media.length), 4500);
    return () => clearInterval(t);
  }, [autoPlay, media.length]);

  if (media.length === 0) return null;
  const item = media[idx];

  return (
    <div className={`relative overflow-hidden rounded-xl border border-border/50 bg-muted ${className ?? ""}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="aspect-video w-full"
        >
          {item.kind === "video" ? (
            <video src={item.url} poster={item.poster_url ?? undefined} muted loop autoPlay playsInline className="w-full h-full object-cover" />
          ) : (
            <img src={item.url} alt={item.alt ?? ""} className="w-full h-full object-cover" loading="lazy" />
          )}
        </motion.div>
      </AnimatePresence>

      {media.length > 1 && (
        <>
          <Button size="icon" variant="secondary" className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 opacity-80" onClick={() => setIdx((i) => (i - 1 + media.length) % media.length)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 opacity-80" onClick={() => setIdx((i) => (i + 1) % media.length)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {media.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-white" : "w-1.5 bg-white/50"}`} />
            ))}
          </div>
        </>
      )}
      {item.kind === "video" && (
        <div className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1">
          <PlayCircle className="h-4 w-4" />
        </div>
      )}
    </div>
  );
};

export default ToolMediaCarousel;
