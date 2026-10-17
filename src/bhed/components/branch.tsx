import { useRef, useState, type MouseEvent } from "react";
import {
  AlignCenter,
  AlignLeft,
  Bold,
  ChevronDown,
  ImagePlus,
  Italic,
  MoreHorizontal,
  Underline,
} from "lucide-react";
import { toast } from "sonner";
import { RichText } from "@/bhed/lib/markdown";
import { isImportFile } from "@/bhed/lib/impex";
import { AddCount } from "@/bhed/components/dive-tab";
import { bindField, useShortcuts } from "@/bhed/components/shortcut-menu";
import { useBhed } from "@/bhed/lib/store";
import {
  coverOf,
  depthLabel,
  displayTitle,
  excerpt,
  type BhedNode,
  type MediaRef,
  type TabStyle,
} from "@/bhed/lib/types";
import { cn } from "@/lib/utils";

const quietBtn =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border-2 border-ink bg-background px-3 text-sm text-ink hover:bg-muted disabled:opacity-40";
const ghostBtn =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full px-3 text-sm text-ink hover:bg-muted disabled:opacity-40";
const pressed = "bg-ink text-background hover:bg-ink";

function titleClass(style: TabStyle, prominent: boolean) {
  return cn(
    "w-full bg-transparent font-display text-balance outline-none",
    style.italic && "italic",
    style.underline && "underline decoration-ink underline-offset-4",
    style.align === "center" ? "text-center" : "text-left",
    style.weight === "bold" ? "font-bold" : style.weight === "regular" ? "font-normal" : "font-semibold",
    style.tone === "accent" ? "text-primary" : style.tone === "quiet" ? "text-muted-foreground" : "text-ink",
    prominent
      ? style.size === "lg"
        ? "text-4xl"
        : style.size === "sm"
          ? "text-2xl"
          : "text-3xl"
      : style.size === "lg"
        ? "text-2xl"
        : style.size === "sm"
          ? "text-base"
          : "text-lg",
  );
}

function FormatBar({ node }: { node: BhedNode }) {
  const patchNode = useBhed((state) => state.patchNode);
  const style = node.style;
  const setStyle = (partial: Partial<TabStyle>) => patchNode(node.id, { style: partial });
  return (
    <div className="flex flex-wrap items-center gap-1">
      <button
        type="button"
        aria-label="Bold"
        aria-pressed={style.weight === "bold"}
        className={cn(ghostBtn, "w-11 px-0", style.weight === "bold" && pressed)}
        onClick={() => setStyle({ weight: style.weight === "bold" ? "medium" : "bold" })}
      >
        <Bold className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Italic"
        aria-pressed={style.italic}
        className={cn(ghostBtn, "w-11 px-0", style.italic && pressed)}
        onClick={() => setStyle({ italic: !style.italic })}
      >
        <Italic className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Underline"
        aria-pressed={style.underline}
        className={cn(ghostBtn, "w-11 px-0", style.underline && pressed)}
        onClick={() => setStyle({ underline: !style.underline })}
      >
        <Underline className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Align left"
        aria-pressed={style.align === "start"}
        className={cn(ghostBtn, "w-11 px-0", style.align === "start" && pressed)}
        onClick={() => setStyle({ align: "start" })}
      >
        <AlignLeft className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Align center"
        aria-pressed={style.align === "center"}
        className={cn(ghostBtn, "w-11 px-0", style.align === "center" && pressed)}
        onClick={() => setStyle({ align: "center" })}
      >
        <AlignCenter className="size-4" />
      </button>
      {(["sm", "md", "lg"] as const).map((size) => (
        <button
          key={size}
          type="button"
          aria-label={`Size ${size}`}
          aria-pressed={style.size === size}
          className={cn(ghostBtn, "w-11 px-0 font-semibold", style.size === size && pressed)}
          onClick={() => setStyle({ size })}
        >
          {size === "sm" ? "S" : size === "md" ? "M" : "L"}
        </button>
      ))}
      {(
        [
          ["ink", "bg-ink"],
          ["accent", "bg-pink"],
          ["quiet", "bg-quiet"],
        ] as const
      ).map(([tone, dot]) => (
        <button
          key={tone}
          type="button"
          aria-label={`${tone} text`}
          aria-pressed={style.tone === tone}
          className={cn(ghostBtn, "w-11 px-0", style.tone === tone && "bg-muted")}
          onClick={() => setStyle({ tone })}
        >
          <span className={cn("size-3 rounded-full", dot)} />
        </button>
      ))}
      {(
        [
          ["none", "Plain"],
          ["wash", "Wash"],
          ["rule", "Rule"],
        ] as const
      ).map(([mark, label]) => (
        <button
          key={mark}
          type="button"
          aria-pressed={style.mark === mark}
          className={cn(ghostBtn, style.mark === mark && pressed)}
          onClick={() => setStyle({ mark })}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function CoverThumb({ item, url, className }: { item: MediaRef; url: string; className?: string }) {
  if (item.kind === "video") {
    return (
      <video
        src={url}
        muted
        playsInline
        preload="metadata"
        className={cn("media-frame pointer-events-none object-cover", className)}
        onLoadedData={(event) => {
          const video = event.currentTarget;
          if (video.currentTime < 0.05) video.currentTime = 0.1;
        }}
      />
    );
  }
  return <img src={url} alt="" className={cn("media-frame object-cover", className)} />;
}

function MediaBlock({ node }: { node: BhedNode }) {
  const urls = useBhed((state) => state.urls);
  const removeMedia = useBhed((state) => state.removeMedia);
  const makeCover = useBhed((state) => state.makeCover);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [light, setLight] = useState(false);
  const active = node.media.find((item) => item.id === activeId) ?? node.media[0] ?? null;
  if (!node.media.length || !active) return null;
  const activeUrl = urls[active.id];

  return (
    <div className="mt-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {node.media.map((item) => {
          const url = urls[item.id];
          const selected = item.id === active.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-label={item.name}
              aria-pressed={selected}
              onClick={() => setActiveId(item.id)}
              className={cn(
                "size-16 shrink-0 overflow-hidden rounded-lg bg-muted",
                selected && "outline outline-2 outline-offset-2 outline-ink",
              )}
            >
              {url && (item.kind === "image" || item.kind === "video") ? (
                <CoverThumb item={item} url={url} className="size-16" />
              ) : (
                <span className="flex size-16 items-center justify-center px-1 text-center text-xs text-muted-foreground">
                  {item.kind}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {activeUrl && active.kind === "image" && (
        <button type="button" className="mt-2 block max-w-full" onClick={() => setLight(true)} aria-label="Enlarge image">
          <img src={activeUrl} alt={active.name} className="media-frame max-h-80 rounded-lg object-contain" />
        </button>
      )}
      {activeUrl && active.kind === "video" && (
        <video src={activeUrl} controls playsInline className="media-frame mt-2 max-h-80 w-full rounded-lg bg-ink" />
      )}
      {activeUrl && active.kind === "audio" && <audio src={activeUrl} controls className="mt-2 w-full" />}
      {activeUrl && active.kind === "file" && (
        <a href={activeUrl} download={active.name} className="mt-2 inline-flex h-11 items-center text-sm underline">
          {active.name}
        </a>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {(active.kind === "image" || active.kind === "video") && (
          <button type="button" className={quietBtn} onClick={() => makeCover(node.id, active.id)}>
            Use as cover
          </button>
        )}
        <button type="button" className={quietBtn} onClick={() => void removeMedia(node.id, active.id)}>
          Remove
        </button>
      </div>
      {light && activeUrl && active.kind === "image" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={active.name}
          onClick={() => setLight(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setLight(false);
          }}
        >
          <img src={activeUrl} alt={active.name} className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </div>
  );
}

function NodeMenu({
  node,
  parentId,
  index,
  siblingCount,
  prominent,
}: {
  node: BhedNode;
  parentId: string | null;
  index: number;
  siblingCount: number;
  prominent: boolean;
}) {
  const goDeeper = useBhed((state) => state.goDeeper);
  const moveNode = useBhed((state) => state.moveNode);
  const duplicateNode = useBhed((state) => state.duplicateNode);
  const removeNode = useBhed((state) => state.removeNode);
  const [confirm, setConfirm] = useState(false);
  if (!parentId) return null;

  const close = (target: HTMLButtonElement) => {
    const details = target.closest("details");
    if (details) details.open = false;
  };

  return (
    <details className="relative">
      <summary aria-label={`Actions for ${displayTitle(node.title)}`} className={cn(ghostBtn, "w-11 list-none px-0")}>
        <MoreHorizontal className="size-4" />
      </summary>
      <div className="menu-pop absolute right-0 z-20 mt-1 w-48 rounded-xl bg-card p-1">
        {!prominent && (
          <button
            type="button"
            className={cn(ghostBtn, "w-full justify-start")}
            onClick={(event) => {
              close(event.currentTarget);
              goDeeper(node.id);
            }}
          >
            Go deeper
          </button>
        )}
        <button
          type="button"
          className={cn(ghostBtn, "w-full justify-start")}
          disabled={index <= 0}
          onClick={(event) => {
            close(event.currentTarget);
            moveNode(node.id, -1);
          }}
        >
          Move earlier
        </button>
        <button
          type="button"
          className={cn(ghostBtn, "w-full justify-start")}
          disabled={index >= siblingCount - 1}
          onClick={(event) => {
            close(event.currentTarget);
            moveNode(node.id, 1);
          }}
        >
          Move later
        </button>
        <button
          type="button"
          className={cn(ghostBtn, "w-full justify-start")}
          onClick={(event) => {
            close(event.currentTarget);
            duplicateNode(node.id);
          }}
        >
          Duplicate
        </button>
        <button
          type="button"
          className={cn(ghostBtn, "w-full justify-start text-primary")}
          onClick={(event) => {
            if (!confirm) {
              setConfirm(true);
              return;
            }
            close(event.currentTarget);
            removeNode(node.id);
          }}
        >
          {confirm ? "Confirm delete" : "Delete"}
        </button>
      </div>
    </details>
  );
}

export function Branch({
  node,
  depth,
  parentId,
  index,
  siblingCount,
  prominent = false,
  mindz = false,
  showMedia = false,
}: {
  node: BhedNode;
  depth: number;
  parentId: string | null;
  index: number;
  siblingCount: number;
  prominent?: boolean;
  mindz?: boolean;
  showMedia?: boolean;
}) {
  const urls = useBhed((state) => state.urls);
  const selectedId = useBhed((state) => state.selectedId);
  const setSelected = useBhed((state) => state.setSelected);
  const patchNode = useBhed((state) => state.patchNode);
  const toggleCollapsed = useBhed((state) => state.toggleCollapsed);
  const addChild = useBhed((state) => state.addChild);
  const addChildren = useBhed((state) => state.addChildren);
  const addMediaFiles = useBhed((state) => state.addMediaFiles);
  const goDeeper = useBhed((state) => state.goDeeper);
  const fileRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const titleShortcuts = useShortcuts((title) => patchNode(node.id, { title }));
  const bodyShortcuts = useShortcuts((body) => patchNode(node.id, { body }));
  const [writing, setWriting] = useState(false);
  const [hot, setHot] = useState(false);
  const cover = coverOf(node);
  const coverUrl = cover ? urls[cover.id] : undefined;
  const extraVisual = node.media.filter((item) => item.kind === "image" || item.kind === "video").length;
  const blurb = excerpt(node.body);
  const page = prominent && mindz;

  const takeFiles = async (files: File[]) => {
    if (!files.length) return;
    const outlines = files.filter(isImportFile);
    const media = files.filter((file) => !isImportFile(file));
    if (outlines[0]) {
      try {
        await useBhed.getState().importFile(outlines[0]);
        toast.success("Imported as a new chart");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not import that file");
      }
    }
    if (!media.length) return;
    try {
      await addMediaFiles(node.id, media);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add that file");
    }
  };

  const wrap = (before: string, after = before) => {
    const el = bodyRef.current;
    const value = node.body;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const next = value.slice(0, start) + before + value.slice(start, end) + after + value.slice(end);
    patchNode(node.id, { body: next });
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.selectionStart = start + before.length;
      el.selectionEnd = end + before.length;
    });
  };

  const keepSelection = (event: MouseEvent) => event.preventDefault();

  return (
    <article
      id={`bhed-${node.id}`}
      data-node-id={node.id}
      data-selected={selectedId === node.id ? "true" : "false"}
      data-hot={hot ? "true" : "false"}
      onPaste={(event) => {
        const files = [...event.clipboardData.files];
        if (!files.length) return;
        event.preventDefault();
        void takeFiles(files);
      }}
      onDragOver={(event) => {
        if (![...event.dataTransfer.types].includes("Files")) return;
        event.preventDefault();
        event.stopPropagation();
        setHot(true);
      }}
      onDragLeave={() => setHot(false)}
      onDrop={(event) => {
        const files = [...event.dataTransfer.files];
        if (!files.length) return;
        event.preventDefault();
        event.stopPropagation();
        setHot(false);
        void takeFiles(files);
      }}
      onClick={() => setSelected(node.id)}
      className={cn(
        "relative min-w-0",
        prominent ? "scroll-mt-4" : "sheet rounded-2xl p-2",
        !prominent && node.style.mark === "wash" && "bg-pink/30",
        !prominent && node.style.mark !== "wash" && "bg-card",
        !prominent && node.style.mark === "rule" && "border-l-4 border-l-pink",
        prominent && node.style.mark === "wash" && "rounded-2xl bg-pink/30 p-3",
      )}
    >
      <div className={cn("absolute right-1 top-1 z-10", prominent && "right-0 top-0")}>
        <NodeMenu node={node} parentId={parentId} index={index} siblingCount={siblingCount} prominent={prominent} />
      </div>

      {node.collapsed && !page ? (
        <button
          type="button"
          className={cn("w-full py-2 text-left", parentId ? "px-2 pr-12" : "px-1")}
          aria-expanded={false}
          onClick={() => {
            setSelected(node.id);
            toggleCollapsed(node.id);
          }}
        >
          <p className="text-xs text-muted-foreground">{depthLabel(depth)}</p>
          <div className="mt-2 flex items-start gap-3">
            {showMedia && cover && coverUrl && (
              <span className="relative shrink-0">
                <CoverThumb item={cover} url={coverUrl} className="size-20 rounded-lg" />
                {extraVisual > 1 && (
                  <span className="absolute bottom-1 right-1 rounded bg-ink px-1 text-xs text-background">
                    +{extraVisual - 1}
                  </span>
                )}
              </span>
            )}
            <span className="min-w-0">
              <span className={cn(titleClass(node.style, prominent), "block")}>{displayTitle(node.title)}</span>
              {blurb && <span className="mt-1 line-clamp-3 block text-sm leading-relaxed text-muted-foreground">{blurb}</span>}
              {!cover && node.media.length > 0 && (
                <span className="mt-2 block text-sm text-muted-foreground">
                  {node.media.length} attachment{node.media.length === 1 ? "" : "s"}
                </span>
              )}
            </span>
          </div>
        </button>
      ) : (
        <div className={cn("px-2 py-2", parentId && "pr-12", page && "bg-white px-4")}>
          {!page && <p className="text-xs text-muted-foreground">{depthLabel(depth)}</p>}
          {!page && (
          <div className="mt-1 flex items-start gap-3">
            {showMedia && cover && coverUrl && !prominent && (
              <CoverThumb item={cover} url={coverUrl} className="size-16 shrink-0 rounded-lg" />
            )}
            <input
              ref={titleShortcuts.setField}
              aria-label="Title"
              value={node.title}
              placeholder={`Name this ${depthLabel(depth)}`}
              onChange={(event) => {
                patchNode(node.id, { title: event.target.value });
                titleShortcuts.refresh();
              }}
              onKeyDown={titleShortcuts.onKeyDown}
              onKeyUp={titleShortcuts.refresh}
              onClick={titleShortcuts.refresh}
              onBlur={titleShortcuts.onBlur}
              className={titleClass(node.style, prominent)}
            />
            {titleShortcuts.menu}
          </div>
          )}
          {!page && (
          <div className="mt-3">
            <details>
              <summary className={cn(ghostBtn, "list-none")}>Format</summary>
              <div className="mt-2">
                <FormatBar node={node} />
              </div>
            </details>
          </div>
          )}
          {(writing || !page) && (
          <div className="mt-3">
            {writing ? (
              <>
                {page && (
                  <div className="mb-2">
                    <FormatBar node={node} />
                  </div>
                )}
                <div className="mb-2 flex flex-wrap gap-1">
                  <button type="button" className={ghostBtn} onMouseDown={keepSelection} onClick={() => wrap("**")}>
                    Bold
                  </button>
                  <button type="button" className={ghostBtn} onMouseDown={keepSelection} onClick={() => wrap("*")}>
                    Italic
                  </button>
                  <button type="button" className={ghostBtn} onMouseDown={keepSelection} onClick={() => wrap("\n- ", "")}>
                    List
                  </button>
                  <button type="button" className={cn(ghostBtn, pressed)} onClick={() => setWriting(false)}>
                    Done
                  </button>
                </div>
                <textarea
                  ref={bindField(bodyShortcuts.setField, bodyRef)}
                  value={node.body}
                  rows={prominent ? 4 : 3}
                  placeholder="Notes, in plain words. **bold** and *italic* work."
                  onChange={(event) => {
                    patchNode(node.id, { body: event.target.value });
                    bodyShortcuts.refresh();
                  }}
                  onKeyDown={bodyShortcuts.onKeyDown}
                  onKeyUp={bodyShortcuts.refresh}
                  onClick={bodyShortcuts.refresh}
                  onBlur={bodyShortcuts.onBlur}
                  className="w-full resize-y rounded-lg border-2 border-ink bg-background p-3 text-sm leading-relaxed text-ink outline-none"
                />
                {bodyShortcuts.menu}
              </>
            ) : (
              <div
                className="cursor-text rounded-lg px-1"
                onClick={(event) => {
                  if ((event.target as HTMLElement).closest("a")) return;
                  setWriting(true);
                }}
              >
                {node.body.trim() ? (
                  <RichText text={node.body} />
                ) : (
                  <p className="text-sm text-muted-foreground">Write a note…</p>
                )}
              </div>
            )}
          </div>
          )}
          {page && !writing && node.body.trim() && (
            <div
              className={cn(
                "mindz-note mx-1 mb-2 w-auto cursor-text text-left",
                node.style.italic && "italic",
                node.style.underline && "underline",
                node.style.align === "center" && "text-center",
                node.style.weight === "bold" && "font-bold",
                node.style.tone === "accent" && "text-primary",
                node.style.tone === "quiet" && "text-muted-foreground",
              )}
              onClick={() => setWriting(true)}
            >
              <RichText text={node.body} />
            </div>
          )}
          {!page && showMedia && <MediaBlock node={node} />}
          {page && (
            <details className="px-1">
              <summary className={cn(ghostBtn, "list-none")}>
                Media{node.media.length > 0 ? ` (${node.media.length})` : ""}
              </summary>
              <div className="pb-2">
                <button type="button" className={ghostBtn} onClick={() => fileRef.current?.click()}>
                  <ImagePlus className="size-4" />
                  Add media
                </button>
                <MediaBlock node={node} />
              </div>
            </details>
          )}
          {!prominent && node.children.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {node.children.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  className={quietBtn}
                  onClick={() => goDeeper(child.id)}
                >
                  {displayTitle(child.title)}
                </button>
              ))}
            </div>
          )}
          <div className={cn("mt-3 flex flex-wrap gap-2", page && "mt-1 px-1")}>
            {!page && (
            <button type="button" className={quietBtn} onClick={() => fileRef.current?.click()}>
              <ImagePlus className="size-4" />
              Add media
            </button>
            )}
            {page && (
              <button type="button" className={ghostBtn} onClick={() => setWriting((value) => !value)}>
                {writing ? "Done" : "Topic note"}
              </button>
            )}
            {!prominent && (
              <>
                <button type="button" className={quietBtn} onClick={() => addChild(node.id)}>
                  Add {depthLabel(depth + 1)}
                </button>
                <AddCount label={depthLabel(depth + 1)} onAdd={(count, names) => addChildren(node.id, count, names)} />
                <button type="button" className={quietBtn} onClick={() => goDeeper(node.id)}>
                  Go deeper
                </button>
                <button type="button" className={ghostBtn} onClick={() => toggleCollapsed(node.id)}>
                  <ChevronDown className="size-4 rotate-180" />
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {!prominent && node.collapsed && node.children.length > 0 && (
        <button
          type="button"
          className={cn("mx-2 mb-2 h-11 text-sm font-semibold", depth + 1 === 1 ? "text-bhed" : "text-prabhed")}
          onClick={() => goDeeper(node.id)}
        >
          <span className="tabular-nums">{node.children.length}</span> {depthLabel(depth + 1)}
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        multiple
        className="sr-only"
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          event.target.value = "";
          void takeFiles(files);
        }}
      />
    </article>
  );
}
