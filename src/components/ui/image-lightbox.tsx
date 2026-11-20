import { useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Adapted from 21st.dev "Image Preview": a full-size viewer over a dimmed page, here with
// previous/next for a set of pictures (arrow keys too) and an animated picture as the trailer.
export function ImageLightbox({
  images,
  index,
  onIndexChange,
  onClose,
  label,
}: {
  images: { src: string; alt: string }[];
  index: number | null;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  label: string;
}) {
  const open = index !== null && images.length > 0;
  const i = index ?? 0;
  const go = (d: 1 | -1) => onIndexChange((i + d + images.length) % images.length);

  useEffect(() => {
    if (!open || images.length < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const arrow = "absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border-2 border-ink bg-card text-ink shadow-block-sm transition hover:bg-sun";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/85 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none sm:p-10"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <DialogPrimitive.Title className="sr-only">{label}</DialogPrimitive.Title>
          {open && (
            <img
              key={images[i].src}
              src={images[i].src}
              alt={images[i].alt}
              className="max-h-full max-w-full rounded-2xl border-2 border-ink bg-card object-contain shadow-block data-[state=open]:animate-in"
            />
          )}
          {images.length > 1 && (
            <>
              <button type="button" aria-label="Previous picture" onClick={() => go(-1)} className={cn(arrow, "left-3 sm:left-6")}>
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button type="button" aria-label="Next picture" onClick={() => go(1)} className={cn(arrow, "right-3 sm:right-6")}>
                <ChevronRight className="h-5 w-5" />
              </button>
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border-2 border-ink bg-card px-3 py-1 text-xs font-bold">
                {i + 1} / {images.length}
              </p>
            </>
          )}
          <DialogPrimitive.Close className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink bg-card shadow-block-sm transition hover:bg-sun sm:right-6 sm:top-6">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
