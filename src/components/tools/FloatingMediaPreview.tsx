import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface Media {
  kind: "video" | "image" | "gif";
  url: string;
  poster_url: string | null;
}

const cache = new Map<string, Media | null>();

interface Props {
  toolId: string;
  visible: boolean;
}

export const FloatingMediaPreview = ({ toolId, visible }: Props) => {
  const [media, setMedia] = useState<Media | null | undefined>(cache.get(toolId));

  useEffect(() => {
    if (cache.has(toolId)) { setMedia(cache.get(toolId)); return; }
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("tool_media")
        .select("kind, url, poster_url")
        .eq("tool_id", toolId)
        .order("sort_order", { ascending: true })
        .limit(1)
        .maybeSingle();
      const m = (data as Media | null) ?? null;
      cache.set(toolId, m);
      if (alive) setMedia(m);
    })();
    return () => { alive = false; };
  }, [toolId]);

  if (!media) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute -top-2 right-2 z-20 w-48 aspect-video rounded-lg overflow-hidden border border-border/60 shadow-2xl bg-background"
          style={{ pointerEvents: "none" }}
        >
          {media.kind === "video" ? (
            <video src={media.url} poster={media.poster_url ?? undefined} muted loop autoPlay playsInline className="w-full h-full object-cover" />
          ) : (
            <img src={media.url} alt="" className="w-full h-full object-cover" />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingMediaPreview;
