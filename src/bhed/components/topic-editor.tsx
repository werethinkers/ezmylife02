import { useRef, useState, type MouseEvent } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, X } from "lucide-react";
import { RichText } from "@/bhed/lib/markdown";
import { useShortcuts, bindField } from "@/bhed/components/shortcut-menu";
import { useBhed } from "@/bhed/lib/store";
import type { BhedNode, MediaRef } from "@/bhed/lib/types";
import { cn } from "@/lib/utils";

const ghost =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full px-3 text-sm text-ink hover:bg-muted disabled:opacity-40";

function FitMedia({ item, url }: { item: MediaRef; url: string }) {
  if (item.kind === "video") {
    return <video src={url} controls playsInline className="media-fit" />;
  }
  if (item.kind === "audio") {
    return <audio src={url} controls className="w-full max-w-md" />;
  }
  if (item.kind === "file") {
    return (
      <a href={url} download={item.name} className="text-sm text-background underline">
        {item.name}
      </a>
    );
  }
  return <img src={url} alt={item.name} className="media-fit" />;
}

function Enlarge({ item, url, onClose }: { item: MediaRef; url: string; onClose: () => void }) {
  return (
    <div className="media-lightbox" role="dialog" aria-label={`Enlarged ${item.name}`}>
      <div className="flex items-center justify-between gap-3 px-3 py-2 text-background">
        <p className="min-w-0 truncate text-sm">{item.name}</p>
        <button type="button" className="inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm" onClick={onClose}>
          <X className="size-4" />
          Close
        </button>
      </div>
      <div className="grid min-h-0 flex-1 place-items-center px-3 pb-4">
        {item.kind === "video" ? (
          <video src={url} controls autoPlay playsInline className="media-enlarge" />
        ) : (
          <img src={url} alt={item.name} className="media-enlarge" />
        )}
      </div>
    </div>
  );
}

export function MediaSlider({ node }: { node: BhedNode }) {
  const urls = useBhed((state) => state.urls);
  const removeMedia = useBhed((state) => state.removeMedia);
  const [index, setIndex] = useState(0);
  const [enlarged, setEnlarged] = useState(false);
  const items = node.media;
  if (!items.length) {
    return <p className="px-1 text-sm text-muted-foreground">No media on this topic yet.</p>;
  }
  const safe = Math.min(index, items.length - 1);
  const item = items[safe]!;
  const url = urls[item.id];
  const canEnlarge = Boolean(url) && (item.kind === "image" || item.kind === "video");
  return (
    <div className="media-slider">
      <div className="media-stage">
        {url ? <FitMedia item={item} url={url} /> : <p className="text-sm text-background">This file is still loading.</p>}
      </div>
      <div className="flex items-center justify-between gap-2 px-2 py-1">
        <button type="button" className={ghost} aria-label="Previous media" disabled={safe === 0} onClick={() => setIndex(safe - 1)}>
          <ChevronLeft className="size-4" />
        </button>
        <p className="min-w-0 truncate text-sm text-muted-foreground">
          <span className="tabular-nums">
            {safe + 1} / {items.length}
          </span>
          <span className="ml-2">{item.name}</span>
        </p>
        <button
          type="button"
          className={ghost}
          aria-label="Next media"
          disabled={safe >= items.length - 1}
          onClick={() => setIndex(safe + 1)}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div className="flex justify-end gap-1 px-2 pb-2">
        {canEnlarge && (
          <button type="button" className={ghost} onClick={() => setEnlarged(true)}>
            Enlarge
          </button>
        )}
        <button type="button" className={ghost} onClick={() => void removeMedia(node.id, item.id)}>
          Remove
        </button>
      </div>
      {enlarged && url && <Enlarge item={item} url={url} onClose={() => setEnlarged(false)} />}
    </div>
  );
}

export function TopicEditor({
  node,
  showMedia,
  onToggleMedia,
}: {
  node: BhedNode;
  showMedia: boolean;
  onToggleMedia: () => void;
}) {
  const patchNode = useBhed((state) => state.patchNode);
  const addMediaFiles = useBhed((state) => state.addMediaFiles);
  const [writing, setWriting] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const titleShortcuts = useShortcuts((title) => patchNode(node.id, { title }));
  const bodyShortcuts = useShortcuts((body) => patchNode(node.id, { body }));

  const keep = (event: MouseEvent) => event.preventDefault();
  const wrap = (before: string, after = before) => {
    const el = bodyRef.current;
    const value = node.body;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    patchNode(node.id, {
      body: value.slice(0, start) + before + value.slice(start, end) + after + value.slice(end),
    });
    requestAnimationFrame(() => {
      el?.focus();
      if (!el) return;
      el.selectionStart = start + before.length;
      el.selectionEnd = end + before.length;
    });
  };

  return (
    <div className="grid gap-3">
      <textarea
        ref={titleShortcuts.setField}
        aria-label="Title"
        value={node.title}
        rows={1}
        placeholder="Name this topic"
        onChange={(event) => {
          patchNode(node.id, { title: event.target.value });
          titleShortcuts.refresh();
        }}
        onKeyDown={titleShortcuts.onKeyDown}
        onKeyUp={titleShortcuts.refresh}
        onClick={titleShortcuts.refresh}
        onBlur={titleShortcuts.onBlur}
        className="topic-title"
      />
      {titleShortcuts.menu}
      {writing ? (
        <div>
          <div className="mb-2 flex flex-wrap gap-1">
            <button type="button" className={ghost} onMouseDown={keep} onClick={() => wrap("**")}>
              Bold
            </button>
            <button type="button" className={ghost} onMouseDown={keep} onClick={() => wrap("*")}>
              Italic
            </button>
            <button type="button" className={ghost} onMouseDown={keep} onClick={() => wrap("\n- ", "")}>
              List
            </button>
            <button type="button" className={cn(ghost, "bg-ink text-background hover:bg-ink")} onClick={() => setWriting(false)}>
              Done
            </button>
          </div>
          <textarea
            ref={bindField(bodyShortcuts.setField, bodyRef)}
            value={node.body}
            rows={4}
            placeholder="Write the note. Bold and italic stay when you press Done."
            onChange={(event) => {
              patchNode(node.id, { body: event.target.value });
              bodyShortcuts.refresh();
            }}
            onKeyDown={bodyShortcuts.onKeyDown}
            onKeyUp={bodyShortcuts.refresh}
            onClick={bodyShortcuts.refresh}
            onBlur={bodyShortcuts.onBlur}
            className="w-full resize-y rounded-xl border-2 border-ink bg-card p-3 text-sm leading-relaxed outline-none"
          />
          {bodyShortcuts.menu}
        </div>
      ) : (
        <button type="button" className="rounded-xl px-1 text-left" onClick={() => setWriting(true)}>
          {node.body.trim() ? <RichText text={node.body} /> : <p className="text-sm text-muted-foreground">Write a note…</p>}
        </button>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" className={ghost} aria-pressed={showMedia} onClick={onToggleMedia}>
          {showMedia ? "Hide media" : "Show media"}
          {node.media.length > 0 ? ` (${node.media.length})` : ""}
        </button>
        <button type="button" className={ghost} onClick={() => fileRef.current?.click()}>
          <ImagePlus className="size-4" />
          Add media
        </button>
      </div>
      {showMedia && <MediaSlider node={node} />}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*,audio/*,.pdf,.txt"
        multiple
        className="sr-only"
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          event.target.value = "";
          if (files.length) {
            void addMediaFiles(node.id, files);
            if (!showMedia) onToggleMedia();
          }
        }}
      />
    </div>
  );
}
