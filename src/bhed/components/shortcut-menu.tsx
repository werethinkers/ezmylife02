import { useRef, useState, type KeyboardEvent } from "react";
import { matchShortcuts, phraseFor, type Shortcut } from "@/bhed/lib/shortcuts";

type Field = HTMLInputElement | HTMLTextAreaElement;

type MenuState = {
  query: string;
  start: number;
  end: number;
  active: number;
  left: number;
  top: number;
  maxHeight: number;
};

function placeMenu(el: Field): Pick<MenuState, "left" | "top" | "maxHeight"> {
  const box = el.getBoundingClientRect();
  const margin = 8;
  const below = window.innerHeight - box.bottom - margin;
  const above = box.top - margin;
  const openUp = below < 180 && above > below;
  const maxHeight = Math.max(120, Math.min(280, (openUp ? above : below) - 6));
  return {
    left: Math.max(margin, Math.min(box.left, window.innerWidth - 340)),
    top: openUp ? Math.max(margin, box.top - 6 - maxHeight) : box.bottom + 6,
    maxHeight,
  };
}

export function useShortcuts(commit: (next: string) => void) {
  const field = useRef<Field | null>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const matches = menu ? matchShortcuts(menu.query) : [];

  const refresh = () => {
    const el = field.current;
    if (!el) return;
    const text = el.value;
    const caret = el.selectionStart ?? text.length;
    const before = text.slice(0, caret);
    const found = before.match(/(?:^|\s)\/([^\s]*)$/);
    if (!found) {
      setMenu(null);
      return;
    }
    const query = found[1] ?? "";
    const start = caret - query.length - 1;
    const spot = placeMenu(el);
    setMenu((prev) => ({
      ...spot,
      query,
      start,
      end: caret,
      active: prev && prev.query === query ? prev.active : 0,
    }));
  };

  const pick = (index: number) => {
    const el = field.current;
    if (!el || !menu) return;
    const item = matchShortcuts(menu.query)[index];
    if (!item) return;
    const phrase = phraseFor(item);
    const text = el.value;
    const next = text.slice(0, menu.start) + phrase + text.slice(menu.end);
    const caret = menu.start + phrase.length;
    commit(next);
    setMenu(null);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  };

  const onKeyDown = (event: KeyboardEvent<Field>) => {
    if (!menu || event.nativeEvent.isComposing) return;
    const list = matchShortcuts(menu.query);
    if (!list.length) {
      if (event.key === "Escape") setMenu(null);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setMenu({ ...menu, active: (menu.active + 1) % list.length });
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setMenu({ ...menu, active: (menu.active - 1 + list.length) % list.length });
    } else if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      pick(Math.min(menu.active, list.length - 1));
    } else if (event.key === "Escape") {
      event.preventDefault();
      setMenu(null);
    }
  };

  return {
    setField: (node: Field | null) => {
      field.current = node;
    },
    onKeyDown,
    onBlur: () => {
      window.setTimeout(() => setMenu(null), 150);
    },
    refresh,
    menu: menu ? <ShortcutList state={menu} matches={matches} onPick={pick} /> : null,
  };
}

function ShortcutList({
  state,
  matches,
  onPick,
}: {
  state: MenuState;
  matches: Shortcut[];
  onPick: (index: number) => void;
}) {
  return (
    <div
      className="shortcut-menu"
      style={{ left: state.left, top: state.top, maxHeight: state.maxHeight }}
      role="listbox"
    >
      {matches.length === 0 ? (
        <p className="px-3 py-2 text-sm text-muted-foreground">{state.query ? "No shortcut" : "Type after /"}</p>
      ) : (
        matches.map((item, index) => (
          <button
            key={item.key}
            type="button"
            role="option"
            aria-selected={index === state.active}
            className={index === state.active ? "is-active" : undefined}
            onMouseDown={(event) => {
              event.preventDefault();
              onPick(index);
            }}
          >
            <span className="shortcut-key">/{item.key}</span>
            <span className="shortcut-phrase">{phraseFor(item).replace(/\s+/g, " ")}</span>
          </button>
        ))
      )}
    </div>
  );
}

export function bindField(
  setField: (node: Field | null) => void,
  extra: { current: HTMLTextAreaElement | null },
) {
  return (node: HTMLTextAreaElement | null) => {
    setField(node);
    extra.current = node;
  };
}
