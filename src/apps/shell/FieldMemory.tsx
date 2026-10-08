import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { History, X } from "lucide-react";
import { useAppStore } from "../lib/store";
import { useWorkspace } from "../lib/workspace";
import { useWorkContext } from "../lib/context";
import {
  MEMORY_INITIAL, describeField, forget, isEditable, kindOf, remember, rememberClient, setFieldValue, suggestionsFor,
  type ClientRecord, type MemoryData,
} from "../lib/memory";

type Editable = HTMLInputElement | HTMLTextAreaElement;
interface Open { el: Editable; kind: string; items: string[]; rect: DOMRect; active: number }

export function useFieldMemory() {
  return useAppStore<MemoryData>("_memory", MEMORY_INITIAL);
}

const CLIENT_KINDS = ["client_gstin", "client_address", "client_email", "client_phone"] as const;

/** Fields in the same form as `el`, keyed by kind. */
function siblings(el: Editable): Map<string, Editable[]> {
  const scope = el.closest("form") ?? el.closest("[data-ez-memory]") ?? el.ownerDocument.body;
  const map = new Map<string, Editable[]>();
  scope.querySelectorAll("input,textarea").forEach((n) => {
    if (!isEditable(n)) return;
    const k = kindOf(describeField(n));
    if (!k) return;
    map.set(k, [...(map.get(k) ?? []), n]);
  });
  return map;
}

/**
 * Wrap any app with this. It remembers what the person types into each kind of field and offers
 * it back, in this app and every other one. Picking a saved client fills that client's details.
 */
export function FieldMemory({ children, className }: { children: ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const { data: mem, update, signedIn } = useFieldMemory();
  const { profile } = useWorkspace();
  const { merge } = useWorkContext();
  const [open, setOpen] = useState<Open | null>(null);
  const memRef = useRef(mem); memRef.current = mem;
  const profileRef = useRef(profile); profileRef.current = profile;
  const openRef = useRef(open); openRef.current = open;

  const show = useCallback((el: Editable) => {
    const m = memRef.current;
    if (!m.enabled) return setOpen(null);
    const kind = kindOf(describeField(el));
    if (!kind) return setOpen(null);
    const items = suggestionsFor(kind, el.value, m, profileRef.current);
    if (!items.length) return setOpen(null);
    setOpen({ el, kind, items, rect: el.getBoundingClientRect(), active: -1 });
  }, []);

  const save = useCallback((el: Editable) => {
    if (!memRef.current.enabled) return;
    const v = el.value.trim();
    const kind = kindOf(describeField(el));
    if (!kind || !v) return;
    update((prev) => {
      let next = remember({ ...MEMORY_INITIAL, ...prev }, kind, v);
      // A client name saved with the details typed next to it becomes a reusable client record.
      const sib = siblings(el);
      const name = sib.get("client")?.[0]?.value.trim();
      if (name) {
        const rec: Omit<ClientRecord, "usedAt"> = { client: name };
        for (const k of CLIENT_KINDS) {
          const val = sib.get(k)?.[0]?.value.trim() ?? (k === "client_gstin" && sib.get("gstin")?.length === 1 && !sib.get("business") ? sib.get("gstin")![0].value.trim() : "");
          if (val) rec[k] = val;
        }
        next = rememberClient(next, rec);
      }
      return next;
    });
  }, [update]);

  const pick = useCallback((o: Open, value: string) => {
    setFieldValue(o.el, value);
    if (o.kind === "client") {
      const rec = memRef.current.clients.find((r) => r.client.toLowerCase() === value.toLowerCase());
      if (rec) {
        const sib = siblings(o.el);
        for (const k of CLIENT_KINDS) {
          const target = sib.get(k)?.[0];
          if (target && !target.value.trim() && rec[k]) setFieldValue(target, rec[k]!);
        }
        // Other apps (tax, profit, contract) pick the client up from the shared context.
        merge({ client: { name: rec.client, gstin: rec.client_gstin, address: rec.client_address, email: rec.client_email, phone: rec.client_phone } });
      }
    }
    setOpen(null);
  }, [merge]);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const onFocus = (e: FocusEvent) => { if (isEditable(e.target)) show(e.target); };
    const onInput = (e: Event) => { if (isEditable(e.target) && e.isTrusted) show(e.target); };
    const onBlur = (e: FocusEvent) => { if (isEditable(e.target)) { save(e.target); setTimeout(() => { if (openRef.current?.el === e.target) setOpen(null); }, 150); } };
    const onKey = (e: KeyboardEvent) => {
      const o = openRef.current;
      if (!o || e.target !== o.el) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const d = e.key === "ArrowDown" ? 1 : -1;
        setOpen({ ...o, active: (o.active + d + o.items.length) % o.items.length });
      } else if (e.key === "Enter" && o.active >= 0) {
        e.preventDefault(); pick(o, o.items[o.active]);
      } else if (e.key === "Escape") setOpen(null);
    };
    node.addEventListener("focusin", onFocus);
    node.addEventListener("input", onInput);
    node.addEventListener("focusout", onBlur);
    node.addEventListener("keydown", onKey);
    return () => { node.removeEventListener("focusin", onFocus); node.removeEventListener("input", onInput); node.removeEventListener("focusout", onBlur); node.removeEventListener("keydown", onKey); };
  }, [show, save, pick]);

  // Keep the list attached to its field while the page scrolls.
  useEffect(() => {
    if (!open) return;
    const move = () => setOpen((o) => (o ? { ...o, rect: o.el.getBoundingClientRect() } : o));
    window.addEventListener("scroll", move, true); window.addEventListener("resize", move);
    return () => { window.removeEventListener("scroll", move, true); window.removeEventListener("resize", move); };
  }, [open?.el]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={root} className={className} data-ez-memory="">
      {children}
      {open && createPortal(
        <div
          role="listbox"
          aria-label="Your saved entries"
          className="fixed z-[70] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl"
          style={{ left: Math.max(8, Math.min(open.rect.left, window.innerWidth - Math.min(open.rect.width, 420) - 8)), top: Math.min(open.rect.bottom + 4, window.innerHeight - 60), width: Math.min(Math.max(open.rect.width, 240), 420) }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <p className="flex items-center gap-1.5 px-3 pt-2 pb-1 text-[11px] font-medium text-muted-foreground"><History className="h-3 w-3" /> From your earlier entries</p>
          <ul className="max-h-60 overflow-y-auto pb-1">
            {open.items.map((v, i) => {
              const rec = open.kind === "client" ? mem.clients.find((r) => r.client.toLowerCase() === v.toLowerCase()) : undefined;
              return (
                <li key={v} role="option" aria-selected={i === open.active} className={"group flex items-center gap-2 px-3 py-2 text-sm cursor-pointer " + (i === open.active ? "bg-muted" : "hover:bg-muted/70")} onClick={() => pick(open, v)}>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{v}</span>
                    {rec && (rec.client_gstin || rec.client_address) && <span className="block truncate text-[11px] text-muted-foreground">{[rec.client_gstin, rec.client_address].filter(Boolean).join(" · ")} · fills their details</span>}
                  </span>
                  <button type="button" aria-label={`Forget ${v}`} className="shrink-0 rounded p-1 text-muted-foreground opacity-60 hover:bg-background hover:opacity-100" onClick={(e) => { e.stopPropagation(); update((p) => forget({ ...MEMORY_INITIAL, ...p }, open.kind, v)); setOpen((o) => (o ? { ...o, items: o.items.filter((x) => x !== v) } : o)); }}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between border-t border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground">
            <span>{signedIn ? "Saved to your account. Only you see it." : "Saved on this device. Sign in to keep it everywhere."}</span>
            <button type="button" className="font-medium hover:text-foreground" onClick={() => { update({ enabled: false }); setOpen(null); }}>Turn off</button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
