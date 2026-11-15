import { cn } from "@/lib/utils";

/** The striped cloth over a shop door, with a scalloped edge. Colour is any CSS colour. */
export function Awning({ color, className }: { color: string; className?: string }) {
  return (
    <div aria-hidden className={cn("relative h-9 border-2 border-b-0 border-ink", className)} style={{ borderRadius: "14px 14px 0 0" }}>
      <div
        className="absolute inset-0"
        style={{
          borderRadius: "12px 12px 0 0",
          background: `repeating-linear-gradient(90deg, ${color} 0 18px, hsl(var(--card)) 18px 36px)`,
        }}
      />
      <div
        className="absolute -bottom-[9px] left-[-2px] right-[-2px] h-[10px]"
        style={{ background: `radial-gradient(circle at 9px 0, ${color} 0 8px, transparent 9px) 0 0 / 36px 10px, radial-gradient(circle at 27px 0, hsl(var(--card)) 0 8px, transparent 9px) 0 0 / 36px 10px` }}
      />
    </div>
  );
}
