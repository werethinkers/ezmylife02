import { useCallback, useEffect, useState, ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ToolSectionProps {
  title: string;
  emoji: string;
  direction?: "ltr" | "rtl";
  children: ReactNode[];
}

export const ToolSection = ({ title, emoji, children }: ToolSectionProps) => {
  const isMobile = useIsMobile();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: isMobile ? "center" : "start",
    dragFree: !isMobile,
    direction: "ltr",
  });

  const [current, setCurrent] = useState(1);
  const total = children.length;

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrent(emblaApi.selectedScrollSnap() + 1);
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  const prev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const next = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (total === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <span>{emoji}</span> {title}
          </h2>
          <span className="text-sm text-muted-foreground tabular-nums">
            {current}/{total}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={prev} className="h-9 w-9 rounded-full">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={next} className="h-9 w-9 rounded-full">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex gap-5">
          {children.map((child, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[100%] sm:w-[58%] md:w-[46%] lg:w-[38%] xl:w-[30%]"
            >
              {child}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ToolSection;
