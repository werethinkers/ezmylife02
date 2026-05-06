import { useState } from "react";
import { Play } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export interface ToolMediaItem {
  id: string;
  kind: string; // 'image' | 'video' | 'gif'
  url: string;
  alt: string | null;
  poster_url?: string | null;
}

export const ToolGallery = ({ items }: { items: ToolMediaItem[] }) => {
  const [openItem, setOpenItem] = useState<ToolMediaItem | null>(null);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 px-6 py-10 text-center text-sm text-muted-foreground">
        No previews available yet.
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory -mx-4 px-4 scrollbar-thin">
        {items.map((m) => {
          const isVideo = m.kind === "video";
          const thumb = isVideo ? m.poster_url || "" : m.url;
          return (
            <button
              key={m.id}
              onClick={() => setOpenItem(m)}
              className="relative shrink-0 snap-start w-44 sm:w-56 aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-muted to-card border border-border/60 hover:border-primary/50 transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {thumb ? (
                <img src={thumb} alt={m.alt || ""} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  {isVideo ? "Video" : "Image"}
                </div>
              )}
              {isVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-[1px]">
                  <div className="h-12 w-12 rounded-full bg-primary/90 flex items-center justify-center shadow-lg shadow-primary/30">
                    <Play className="h-5 w-5 text-primary-foreground fill-current ml-0.5" />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <Dialog open={!!openItem} onOpenChange={(v) => !v && setOpenItem(null)}>
        <DialogContent className="max-w-3xl p-2 bg-background/95 border-border/60">
          {openItem?.kind === "video" ? (
            <video src={openItem.url} controls autoPlay poster={openItem.poster_url || undefined} className="w-full max-h-[80vh] rounded-lg" />
          ) : openItem ? (
            <img src={openItem.url} alt={openItem.alt || ""} className="w-full max-h-[80vh] object-contain rounded-lg" />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ToolGallery;
