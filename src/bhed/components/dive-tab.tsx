import { useState } from "react";
import { ChevronDown, ChevronRight, MoreHorizontal } from "lucide-react";
import { leafCount } from "@/bhed/lib/tree";
import { useBhed } from "@/bhed/lib/store";
import { useShortcuts } from "@/bhed/components/shortcut-menu";
import { depthLabel, displayTitle, excerpt, type BhedNode } from "@/bhed/lib/types";
import { cn } from "@/lib/utils";

const ghost =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full px-3 text-sm text-ink hover:bg-muted";

function TabMenu({
  node,
  index,
  siblingCount,
}: {
  node: BhedNode;
  index: number;
  siblingCount: number;
}) {
  const moveNode = useBhed((state) => state.moveNode);
  const duplicateNode = useBhed((state) => state.duplicateNode);
  const removeNode = useBhed((state) => state.removeNode);
  const [confirm, setConfirm] = useState(false);
  return (
    <details className="relative" onClick={(event) => event.stopPropagation()}>
      <summary className={cn(ghost, "w-11 list-none px-0")} aria-label="More">
        <MoreHorizontal className="size-4" />
      </summary>
      <div className="menu-pop absolute right-0 z-20 mt-1 w-44 rounded-xl bg-card p-1">
        <button type="button" className={cn(ghost, "w-full justify-start")} disabled={index === 0} onClick={() => moveNode(node.id, -1)}>
          Move up
        </button>
        <button
          type="button"
          className={cn(ghost, "w-full justify-start")}
          disabled={index === siblingCount - 1}
          onClick={() => moveNode(node.id, 1)}
        >
          Move down
        </button>
        <button type="button" className={cn(ghost, "w-full justify-start")} onClick={() => duplicateNode(node.id)}>
          Duplicate
        </button>
        <button
          type="button"
          className={cn(ghost, "w-full justify-start text-primary")}
          onClick={() => {
            if (!confirm) {
              setConfirm(true);
              return;
            }
            removeNode(node.id);
          }}
        >
          {confirm ? "Confirm delete" : "Delete"}
        </button>
      </div>
    </details>
  );
}

function RowPicture({ node, label }: { node: BhedNode; label: string }) {
  const urls = useBhed((state) => state.urls);
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState({ left: 16, top: 16, maxHeight: 420 });
  const item = node.media.find((media) => media.kind === "image" || media.kind === "video");
  const url = item ? urls[item.id] : undefined;
  if (!item || !url) return null;
  const show = (target: HTMLElement) => {
    const box = target.getBoundingClientRect();
    const margin = 12;
    const width = Math.min(window.innerWidth - margin * 2, 576);
    const below = window.innerHeight - box.bottom - margin;
    const above = box.top - margin;
    const left = Math.max(margin, Math.min(box.left, window.innerWidth - width - margin));
    if (below < 160 && above < 160) {
      setPlace({ left: Math.max(margin, (window.innerWidth - width) / 2), top: margin, maxHeight: window.innerHeight - margin * 2 });
    } else if (below >= above) {
      setPlace({ left, top: box.bottom + 8, maxHeight: Math.max(120, below - 8) });
    } else {
      const maxHeight = Math.max(120, above - 8);
      setPlace({ left, top: Math.max(margin, box.top - 8 - maxHeight), maxHeight });
    }
    setOpen(true);
  };
  return (
    <>
      <span
        className="row-thumb"
        onMouseEnter={(event) => show(event.currentTarget)}
        onMouseLeave={() => setOpen(false)}
        onClick={(event) => {
          event.stopPropagation();
          if (open) setOpen(false);
          else show(event.currentTarget);
        }}
      >
        {item.kind === "video" ? (
          <video src={url} muted playsInline />
        ) : (
          <img src={url} alt="" />
        )}
      </span>
      {open && (
        <span
          className="row-preview"
          style={{ left: place.left, top: place.top, ["--preview-max" as string]: `${place.maxHeight}px` }}
          role="img"
          aria-label={label}
        >
          {item.kind === "video" ? (
            <video src={url} controls playsInline />
          ) : (
            <img src={url} alt={label} />
          )}
        </span>
      )}
    </>
  );
}

export function AddCount({
  label,
  hidden = false,
  onAdd,
}: {
  label: string;
  hidden?: boolean;
  onAdd: (count: number, names?: string[]) => void;
}) {
  const [count, setCount] = useState("8");
  const [namesOpen, setNamesOpen] = useState(false);
  const [names, setNames] = useState("");
  const shortcuts = useShortcuts(setNames);
  if (hidden) return null;
  const listed = names
    .split(/[,\n]/)
    .map((name) => name.trim())
    .filter(Boolean);
  return (
    <form
      className="add-count"
      onSubmit={(event) => {
        event.preventDefault();
        if (namesOpen && listed.length > 0) {
          onAdd(listed.length, listed.slice(0, 200));
          setNames("");
          return;
        }
        const total = Math.floor(Number(count));
        if (!Number.isFinite(total) || total < 1) return;
        onAdd(Math.min(200, total));
      }}
    >
      <input
        type="number"
        min={1}
        max={200}
        inputMode="numeric"
        aria-label={`How many ${label}`}
        value={count}
        onChange={(event) => setCount(event.target.value)}
      />
      <button type="submit" className="h-11 text-sm font-semibold text-muted-foreground underline">
        Add {namesOpen && listed.length > 0 ? `${listed.length} ${label}` : label}
      </button>
      <button
        type="button"
        className="h-11 text-sm font-semibold text-muted-foreground underline"
        aria-expanded={namesOpen}
        onClick={() => setNamesOpen((open) => !open)}
      >
        {namesOpen ? "Close names" : "Names"}
      </button>
      {namesOpen && (
        <>
          <textarea
            ref={shortcuts.setField}
            className="add-names"
            rows={3}
            value={names}
            placeholder="Name one, name two, name three"
            aria-label={`Comma-separated ${label} names`}
            onChange={(event) => {
              setNames(event.target.value);
              shortcuts.refresh();
            }}
            onKeyDown={shortcuts.onKeyDown}
            onKeyUp={shortcuts.refresh}
            onClick={shortcuts.refresh}
            onBlur={shortcuts.onBlur}
          />
          {shortcuts.menu}
        </>
      )}
    </form>
  );
}

export function DiveTab({
  node,
  depth,
  index,
  siblingCount,
  onOpen,
  number,
  presenting = false,
}: {
  node: BhedNode;
  depth: number;
  index: number;
  siblingCount: number;
  onOpen: (id: string) => void;
  number: string;
  showMedia?: boolean;
  presenting?: boolean;
}) {
  const toggleCollapsed = useBhed((state) => state.toggleCollapsed);
  const patchNode = useBhed((state) => state.patchNode);
  const titleShortcuts = useShortcuts((title) => patchNode(node.id, { title }));
  const here = node.children.length;
  let leaves = 0;
  for (const child of node.children) leaves += leafCount(child);
  const branched = leaves > here;
  const label = displayTitle(node.title);
  const blurb = excerpt(node.body, 110);
  const hasChildren = node.children.length > 0;
  return (
    <div className="tab-stack">
      <article className="tab-row">
        <span className="row-no" aria-hidden>
          {number}
        </span>
        {hasChildren && !presenting ? (
          <button
            type="button"
            className="row-fold"
            aria-expanded={!node.collapsed}
            aria-label={node.collapsed ? `Expand ${label}` : `Collapse ${label}`}
            onClick={() => toggleCollapsed(node.id)}
          >
            {node.collapsed ? <ChevronRight className="size-5" /> : <ChevronDown className="size-5" />}
          </button>
        ) : (
          <span className="row-fold" aria-hidden />
        )}
        <RowPicture node={node} label={label} />
        <div className="tab-open">
          <button type="button" className="row-open" onClick={() => onOpen(node.id)}>
            <span className={cn("text-xs font-semibold tracking-wide", depth === 1 ? "text-bhed" : "text-prabhed")}>{depthLabel(depth)}</span>
          </button>
          {presenting ? (
            <button type="button" className="row-title" onClick={() => onOpen(node.id)}>
              {label}
            </button>
          ) : (
            <>
              <input
                  ref={titleShortcuts.setField}
                className="row-title"
                value={node.title}
                aria-label={`Heading for ${label}`}
                onChange={(event) => {
                  patchNode(node.id, { title: event.target.value });
                  titleShortcuts.refresh();
                }}
                onKeyDown={titleShortcuts.onKeyDown}
                onKeyUp={titleShortcuts.refresh}
                onClick={titleShortcuts.refresh}
                onBlur={titleShortcuts.onBlur}
              />
              {titleShortcuts.menu}
            </>
          )}
          {blurb && (
            <button type="button" className="row-open" onClick={() => onOpen(node.id)}>
              <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{blurb}</span>
            </button>
          )}
        </div>
        {here > 0 && (
          <span className="row-counts">
            <span className={cn("count-badge", branched ? "count-bhed" : "count-prabhed")} title={branched ? `${here} भेद` : `${here} प्रभेद`}>
              {here}
            </span>
            {branched && (
              <span className="count-badge count-prabhed" title={`${leaves} प्रभेद`}>
                {leaves}
              </span>
            )}
          </span>
        )}
        {!presenting && <TabMenu node={node} index={index} siblingCount={siblingCount} />}
      </article>
      {hasChildren && !node.collapsed && (
        <div className="tab-children">
          {node.children.map((child, childIndex) => (
            <DiveTab
              key={child.id}
              node={child}
              depth={depth + 1}
              index={childIndex}
              siblingCount={node.children.length}
              number={`${number}.${childIndex + 1}`}
              onOpen={onOpen}
              presenting={presenting}
            />
          ))}
        </div>
      )}
    </div>
  );
}
