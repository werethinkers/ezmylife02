/* My Business: the whole business in one tab. Sections on the left (a bar at the bottom on phones),
   a New button everywhere, search across everything, and panels that link every record to the next. */

import { useContext, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { CalendarPlus, Cloud, HardDrive, Loader2, Menu, Plus, ReceiptIndianRupee, Search, ShoppingBag, Truck, UserPlus, Wallet } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { PageSeo } from "@/components/seo/PageSeo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { BusinessProvider, useBusiness } from "@/business/useBusiness";
import type { ModuleId } from "@/business/types";
import { list } from "@/business/engine";
import { duesList, overview } from "@/business/reports";
import { bizType } from "@/business/catalog";
import { inr } from "@/business/format";
import { NavCtx, type FormOpen, type Target } from "./ui";
import { FormHost } from "./forms";
import { DetailHost } from "./details";
import { MODULE_ICONS, MODULE_NAMES, phoneBar, visibleModules } from "./modules";
import { Appointments, Bills, Customers, Dues, Leads, Orders, Overview, Reminders } from "./sectionsSell";
import { Marketing, Money, Purchases, Reports, SettingsSection, Staff, Stock, Taxes, Website } from "./sectionsRun";

export default function BusinessAppPage() {
  return (
    <BusinessProvider>
      <PageSeo title="My Business | EZYOURLIFE" description="Run your business in one tab: orders, bills, payments, stock, GST and reminders." path="/business/app" noindex />
      <BusinessApp />
    </BusinessProvider>
  );
}

function BusinessApp() {
  const { ready, db, error, workspaces, select, store, saving, refresh } = useBusiness();
  const [params, setParams] = useSearchParams();
  const [target, setTarget] = useState<Target | null>(null);
  const [form, setForm] = useState<FormOpen | null>(null);
  const [menu, setMenu] = useState(false);
  const section = (params.get("s") ?? "overview") as ModuleId;
  const nav = useMemo(() => ({
    open: (t: Target) => setTarget(t),
    form: (f: FormOpen) => setForm(f),
    go: (s: string) => { setTarget(null); setMenu(false); setParams(s === "overview" ? {} : { s }); window.scrollTo({ top: 0 }); },
  }), [setParams]);

  if (!ready) return <Shell><div className="grid min-h-[50vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin" /></div></Shell>;
  if (error) return <Shell><div className="mx-auto max-w-lg p-8"><div className="rounded-xl border-2 border-ink bg-coral p-4 text-center"><p className="font-bold">Could not open your business</p><p className="mt-1 text-sm">{error}</p><Button className="mt-4" onClick={() => void refresh()}>Try again</Button></div></div></Shell>;
  if (!db) return <Navigate to="/business" replace />;

  const s = db.ws.settings;
  const mods = visibleModules(s);
  const current = mods.includes(section) ? section : "overview";
  const names = MODULE_NAMES(s);
  const t = bizType(db.ws.type_id);

  return (
    <NavCtx.Provider value={nav}>
      <Shell>
        <div className="mx-auto flex max-w-[1400px] gap-6 px-4 pb-28 pt-4 lg:pb-10">
          <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-60 shrink-0 flex-col overflow-y-auto lg:flex">
            <Switcher />
            <Sections current={current} onGo={nav.go} />
            <StoreNote mode={store.mode} saving={saving} />
          </aside>
          <main className="min-w-0 flex-1">
            <TopBar onMenu={() => setMenu(true)} typeName={t?.name} />
            <div className="mt-5">
              {current === "overview" && <Overview db={db} />}
              {current === "orders" && <Orders db={db} />}
              {current === "appointments" && <Appointments db={db} />}
              {current === "leads" && <Leads db={db} />}
              {current === "customers" && <Customers db={db} />}
              {current === "bills" && <Bills db={db} />}
              {current === "dues" && <Dues db={db} />}
              {current === "stock" && <Stock db={db} />}
              {current === "purchases" && <Purchases db={db} />}
              {current === "money" && <Money db={db} />}
              {current === "taxes" && <Taxes db={db} />}
              {current === "staff" && <Staff db={db} />}
              {current === "reminders" && <Reminders db={db} />}
              {current === "marketing" && <Marketing db={db} />}
              {current === "website" && <Website db={db} cloud={store.mode === "cloud"} />}
              {current === "reports" && <Reports db={db} />}
              {current === "settings" && <SettingsSection key={db.ws.id} db={db} />}
            </div>
          </main>
        </div>

        <nav aria-label="Main sections" className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-card lg:hidden">
          <div className="mx-auto grid max-w-lg grid-cols-5">
            {phoneBar(s).slice(0, 2).map((m) => <BarItem key={m} m={m} label={names[m]} active={current === m} onGo={nav.go} />)}
            <div className="grid place-items-center"><NewMenu round /></div>
            {phoneBar(s).slice(2, 4).map((m) => <BarItem key={m} m={m} label={names[m]} active={current === m} onGo={nav.go} />)}
          </div>
        </nav>

        <Sheet open={menu} onOpenChange={setMenu}>
          <SheetContent side="left" className="w-[85vw] max-w-xs overflow-y-auto border-ink bg-background">
            <SheetHeader><SheetTitle className="sr-only">Sections</SheetTitle></SheetHeader>
            <Switcher />
            <Sections current={current} onGo={nav.go} />
            <StoreNote mode={store.mode} saving={saving} />
          </SheetContent>
        </Sheet>

        <DetailHost target={target} onClose={() => setTarget(null)} />
        <FormHost form={form} onClose={() => setForm(null)} />
      </Shell>
    </NavCtx.Provider>
  );

  function Switcher() {
    if (!db) return null;
    return (
      <div className="mb-4 rounded-2xl border-2 border-ink bg-sun p-3 shadow-block-sm">
        <p className="text-xs font-bold uppercase tracking-wider">{t?.name ?? "My Business"}</p>
        {workspaces.length > 1 ? (
          <select className="mt-1 w-full rounded-lg border-2 border-ink bg-card px-2 py-1 font-display text-base font-bold" value={db.ws.id} onChange={(e) => select(e.target.value)} aria-label="Switch business">
            {workspaces.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        ) : <p className="font-display text-lg font-bold leading-tight">{db.ws.name}</p>}
        <Link to="/business?new=1" className="mt-1 inline-block text-xs font-semibold underline">Add another business</Link>
      </div>
    );
  }
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background"><Navbar />{children}</div>;
}

function Sections({ current, onGo }: { current: ModuleId; onGo: (s: string) => void }) {
  const { db } = useBusiness();
  const counts = useMemo(() => {
    if (!db) return {} as Partial<Record<ModuleId, number>>;
    const o = overview(db.recs, db.ws.settings);
    return { reminders: o.reminders.length, dues: duesList(db.recs).length, orders: o.website.length || undefined, leads: o.leadsOpen || undefined } as Partial<Record<ModuleId, number>>;
  }, [db]);
  if (!db) return null;
  const names = MODULE_NAMES(db.ws.settings);
  return (
    <ul className="space-y-0.5">
      {visibleModules(db.ws.settings).map((m) => {
        const Icon = MODULE_ICONS[m];
        const n = counts[m];
        return (
          <li key={m}>
            <button type="button" onClick={() => onGo(m)} aria-current={current === m ? "page" : undefined}
              className={cn("flex w-full items-center gap-2.5 rounded-xl border-2 px-3 py-2 text-left text-[15px] font-semibold", current === m ? "border-ink bg-ink text-cream" : "border-transparent hover:border-ink hover:bg-card")}>
              <Icon className="h-[18px] w-[18px] shrink-0" /><span className="flex-1">{names[m]}</span>
              {!!n && <span className={cn("rounded-full px-1.5 text-xs", current === m ? "bg-cream text-ink" : "bg-sun text-ink")}>{n}</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function StoreNote({ mode, saving }: { mode: "local" | "cloud"; saving: boolean }) {
  return (
    <div className="mt-4 rounded-xl border-2 border-dashed border-ink/30 p-3 text-xs">
      <p className="flex items-center gap-1.5 font-semibold">{mode === "cloud" ? <Cloud className="h-4 w-4" /> : <HardDrive className="h-4 w-4" />}{saving ? "Saving…" : mode === "cloud" ? "Saved in your account" : "Saved on this device"}</p>
      {mode === "local" && <p className="mt-1"><Link to="/auth" state={{ from: "/business/app" }} className="underline">Sign in</Link> to keep it safe, use it on any phone and put your website live.</p>}
      <p className="mt-1 text-muted-foreground">Entering your data is free.</p>
    </div>
  );
}

function BarItem({ m, label, active, onGo }: { m: ModuleId; label: string; active: boolean; onGo: (s: string) => void }) {
  const Icon = MODULE_ICONS[m];
  return (
    <button type="button" onClick={() => onGo(m)} aria-current={active ? "page" : undefined} className={cn("flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold", active ? "text-ink" : "text-ink/60")}>
      <Icon className={cn("h-5 w-5", active && "scale-110")} /><span className="max-w-full truncate px-1">{label}</span>
    </button>
  );
}

function NewMenu({ round }: { round?: boolean }) {
  const { db } = useBusiness();
  const nav = useContextNav();
  if (!db) return null;
  const s = db.ws.settings;
  const has = (m: ModuleId) => s.modules.includes(m);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {round ? <button type="button" className="-mt-6 grid h-14 w-14 place-items-center rounded-full border-2 border-ink bg-pink shadow-block" aria-label="New"><Plus className="h-7 w-7" /></button>
          : <Button><Plus /> New</Button>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl border-2 border-ink">
        {has("appointments") && <DropdownMenuItem onSelect={() => nav.form({ kind: "appointment" })}><CalendarPlus className="mr-2 h-4 w-4" /> Book {s.labels.order.toLowerCase()}</DropdownMenuItem>}
        {has("orders") && <DropdownMenuItem onSelect={() => nav.form({ kind: "order" })}><ShoppingBag className="mr-2 h-4 w-4" /> New {s.labels.order.toLowerCase()}</DropdownMenuItem>}
        <DropdownMenuItem onSelect={() => nav.form({ kind: "sale" })}><ReceiptIndianRupee className="mr-2 h-4 w-4" /> New bill</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => nav.form({ kind: "payment" })}><Wallet className="mr-2 h-4 w-4" /> Got paid</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => nav.form({ kind: "expense" })}><Wallet className="mr-2 h-4 w-4" /> Spent money</DropdownMenuItem>
        {has("purchases") && <DropdownMenuItem onSelect={() => nav.form({ kind: "purchase" })}><Truck className="mr-2 h-4 w-4" /> Bought stock</DropdownMenuItem>}
        {has("leads") && <DropdownMenuItem onSelect={() => nav.form({ kind: "lead" })}><UserPlus className="mr-2 h-4 w-4" /> New enquiry</DropdownMenuItem>}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => nav.form({ kind: "customer" })}>Add {s.labels.customer.toLowerCase()}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => nav.form({ kind: "product" })}>Add {s.labels.product.toLowerCase()}</DropdownMenuItem>
        {has("staff") && <DropdownMenuItem onSelect={() => nav.form({ kind: "staff" })}>Add staff</DropdownMenuItem>}
        <DropdownMenuItem onSelect={() => nav.form({ kind: "reminder" })}>Add reminder</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const useContextNav = () => useContext(NavCtx);

function TopBar({ onMenu, typeName }: { onMenu: () => void; typeName?: string }) {
  const { db } = useBusiness();
  const nav = useContextNav();
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(false);
  const hits = useMemo(() => {
    if (!db || q.trim().length < 2) return [];
    const w = q.trim().toLowerCase();
    const out: { t: Target; label: string; sub: string }[] = [];
    for (const c of list(db.recs, "customer")) if (`${c.data.name} ${c.data.phone ?? ""}`.toLowerCase().includes(w)) out.push({ t: { t: "customer", id: c.id }, label: c.data.name, sub: db.ws.settings.labels.customer });
    for (const b of list(db.recs, "bill")) if (`${b.data.number} ${b.data.customer_name}`.toLowerCase().includes(w)) out.push({ t: { t: "bill", id: b.id }, label: `${b.data.number} · ${b.data.customer_name}`, sub: `Bill ${inr(b.data.total)}` });
    for (const o of list(db.recs, "order")) if (`${o.data.number} ${o.data.customer_name}`.toLowerCase().includes(w)) out.push({ t: { t: "order", id: o.id }, label: `${o.data.number} · ${o.data.customer_name}`, sub: db.ws.settings.labels.order });
    for (const p of list(db.recs, "product")) if (p.data.name.toLowerCase().includes(w)) out.push({ t: { t: "product", id: p.id }, label: p.data.name, sub: inr(p.data.price) });
    for (const m of list(db.recs, "material")) if (m.data.name.toLowerCase().includes(w)) out.push({ t: { t: "material", id: m.id }, label: m.data.name, sub: "Material" });
    for (const l of list(db.recs, "lead")) if (`${l.data.name} ${l.data.want}`.toLowerCase().includes(w)) out.push({ t: { t: "lead", id: l.id }, label: l.data.name, sub: "Enquiry" });
    for (const x of list(db.recs, "supplier")) if (x.data.name.toLowerCase().includes(w)) out.push({ t: { t: "supplier", id: x.id }, label: x.data.name, sub: "Supplier" });
    for (const x of list(db.recs, "staff")) if (x.data.name.toLowerCase().includes(w)) out.push({ t: { t: "staff", id: x.id }, label: x.data.name, sub: "Staff" });
    return out.slice(0, 10);
  }, [db, q]);
  if (!db) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="icon" className="lg:hidden" onClick={onMenu} aria-label="All sections"><Menu /></Button>
      <div className="min-w-0 lg:hidden"><p className="truncate font-display font-bold leading-tight">{db.ws.name}</p><p className="truncate text-xs text-muted-foreground">{typeName}</p></div>
      <div className="relative order-last w-full lg:order-none lg:ml-auto lg:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="h-10 pl-9" placeholder="Find a customer, bill, order or item" value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setTimeout(() => setFocus(false), 150)} aria-label="Search" />
        {focus && hits.length > 0 && (
          <ul className="absolute right-0 z-30 mt-1 w-full overflow-hidden rounded-xl border-2 border-ink bg-card shadow-block">
            {hits.map((h, i) => <li key={i}><button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { nav.open(h.t); setQ(""); }} className="flex w-full justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-sun"><b className="truncate">{h.label}</b><span className="shrink-0 text-muted-foreground">{h.sub}</span></button></li>)}
          </ul>
        )}
      </div>
      <div className="hidden lg:block"><NewMenu /></div>
    </div>
  );
}
