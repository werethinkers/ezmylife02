import { useEffect, useMemo, useRef, useState } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { edgePath, ellipsize, layoutScene } from "@/bhed/lib/layout";
import type { BhedNode, MapStyle } from "@/bhed/lib/types";
import { cn } from "@/lib/utils";

function toneFill(tone: "ink" | "accent" | "quiet") {
  if (tone === "accent") return "var(--color-accent)";
  if (tone === "quiet") return "var(--color-quiet)";
  return "var(--color-ink)";
}

export function MindMap({
  root,
  mapStyle,
  selectedId,
  onSelect,
  onToggle,
}: {
  root: BhedNode;
  mapStyle: MapStyle;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const scene = useMemo(() => layoutScene(root, mapStyle), [root, mapStyle]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const next = Math.min(1, (el.clientWidth - 24) / scene.width, (el.clientHeight - 24) / scene.height);
    setScale(Math.max(0.28, Number.isFinite(next) ? next : 1));
  }, [scene.width, scene.height, mapStyle, root.id]);

  return (
    <div className="relative h-full min-h-0">
      <div ref={wrapRef} className="map-scroll h-full overflow-auto">
        <svg
          width={Math.max(1, scene.width * scale)}
          height={Math.max(1, scene.height * scale)}
          viewBox={`0 0 ${scene.width} ${scene.height}`}
          role="img"
          aria-label="Mind map"
          className="block"
        >
          {scene.edges.map((edge, index) => (
            <path
              key={index}
              d={edgePath(edge, scene.kind)}
              fill="none"
              stroke="var(--color-line-strong)"
              strokeWidth={1.5}
            />
          ))}
          {scene.nodes.map((node) => {
            const selected = node.id === selectedId;
            const label = ellipsize(node.title, node.w);
            const rx = scene.kind === "icicle" ? 8 : 12;
            return (
              <g
                key={node.id}
                role="button"
                tabIndex={0}
                aria-label={node.title}
                className="cursor-pointer"
                onClick={() => onSelect(node.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(node.id);
                  }
                }}
              >
                <title>{node.title}</title>
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.w}
                  height={node.h}
                  rx={rx}
                  fill={node.mark === "wash" ? "var(--color-accent-soft)" : "var(--color-paper-2)"}
                  stroke={selected ? "var(--color-accent)" : "var(--color-line-strong)"}
                  strokeWidth={selected ? 2.5 : 1}
                />
                {node.mark === "rule" && (
                  <rect x={node.x} y={node.y} width={4} height={node.h} fill="var(--color-accent)" />
                )}
                {label && (
                  <text
                    x={node.x + 12}
                    y={node.y + node.h / 2}
                    dominantBaseline="middle"
                    fill={toneFill(node.tone)}
                    fontFamily="Source Sans 3, sans-serif"
                    fontSize={14}
                    fontStyle={node.italic ? "italic" : "normal"}
                    fontWeight={node.weight === "bold" ? 700 : node.weight === "regular" ? 400 : 600}
                  >
                    {label}
                  </text>
                )}
                {node.hasMedia && (
                  <circle cx={node.x + node.w - 12} cy={node.y + 12} r={3.5} fill="var(--color-accent)" />
                )}
                {node.childCount > 0 && (
                  <g
                    role="button"
                    tabIndex={0}
                    aria-label={
                      node.folded
                        ? `Expand ${node.title}, ${node.childCount} folded`
                        : `Fold ${node.title}`
                    }
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggle(node.id);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        onToggle(node.id);
                      }
                    }}
                  >
                    <circle
                      cx={node.x + node.w - 2}
                      cy={node.y + node.h / 2}
                      r={11}
                      fill={node.folded ? (node.depth === 1 ? "var(--color-bhed)" : "var(--color-prabhed)") : "var(--color-paper)"}
                      stroke="var(--color-line-strong)"
                    />
                    <text
                      x={node.x + node.w - 2}
                      y={node.y + node.h / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={node.folded ? "var(--color-paper)" : "var(--color-ink)"}
                      fontFamily="Source Sans 3, sans-serif"
                      fontSize={node.folded ? 11 : 14}
                      fontWeight={700}
                    >
                      {node.folded ? node.childCount : "−"}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="absolute bottom-3 right-3 flex gap-1">
        <button
          type="button"
          aria-label="Zoom out"
          className="inline-flex size-11 items-center justify-center rounded-full border-2 border-ink bg-card text-ink"
          onClick={() => setScale((value) => Math.max(0.28, value / 1.15))}
        >
          <ZoomOut className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Zoom in"
          className="inline-flex size-11 items-center justify-center rounded-full border-2 border-ink bg-card text-ink"
          onClick={() => setScale((value) => Math.min(2.2, value * 1.15))}
        >
          <ZoomIn className="size-4" />
        </button>
        <button
          type="button"
          className={cn(
            "inline-flex h-11 items-center rounded-full border-2 border-ink bg-card px-3 text-sm text-ink",
          )}
          onClick={() => {
            const el = wrapRef.current;
            if (!el) return;
            const next = Math.min(1, (el.clientWidth - 24) / scene.width, (el.clientHeight - 24) / scene.height);
            setScale(Math.max(0.28, next));
          }}
        >
          Fit
        </button>
      </div>
    </div>
  );
}
