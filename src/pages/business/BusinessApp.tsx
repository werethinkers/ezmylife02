/* My Business: the whole business in one tab. Sections on the left (a bar at the bottom on phones),
   a New button everywhere, search across everything, and panels that link every record to the next.
   A dedicated app shell: no marketing promo bar or footer, just a slim header, so it reads as a
   focused workspace rather than a dashboard embedded in the landing site. */

import { useContext, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { CalendarPlus, Cloud, HardDrive, LogOut, Loader2, Menu, Moon, Plus, ReceiptIndianRupee, Search, ShoppingBag, Sun, Truck, UserPlus, Wallet } from "lucide-react";
import { ModernPage } from "@/components/modern/ModernPage";
import { useModernTheme } from "@/components/modern/theme";
import { CONTAINER } from "@/components/modern/styles";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/lib/supabase";
import { PageSeo } from "@/components/seo/PageSeo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { BusinessProvider, useBusiness } from "@/business/useBusiness";
import type { ModuleId } from "@/business/types";
import { list } from "@/business/engine";
import { duesList, overview } from "@/business/reports";
import { bizType } from "@/business/catalog";
import { inr } from "@/business/format";
import { NavCtx, Input, softBorder, UNBOUNDED, type FormOpen, type Target } from "./ui";
import { FormHost } from "./forms";
import { DetailHost } from "./details";
import { MODULE_ICONS, MODULE_NAMES, SECTION_GROUPS, phoneBar, visibleModules } from "./modules";
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
  const { dark } = useModernTheme();
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
  if (error) return <Shell><div className="mx-auto max-w-lg p-8"><div className="rounded-2xl border-[1.5px] border-[#111111] bg-coral p-4 text-center shadow-[4px_4px_0_#111111]"><p className="font-bold">Could not open your business</p><p className="mt-1 text-sm">{error}</p><Button className="mt-4" onClick={() => void refresh()}>Try again</Button></div></div></Shell>;
  if (!db) return <Navigate to="/business" replace />;

  const s = db.ws.settings;
  const mods = visibleModules(s);
  const current = mods.includes(section) ? section : "overview";
  const names = MODULE_NAMES(s);
  const t = bizType(db.ws.type_id);

  return (
    <NavCtx.Provider value={nav}>
      <Shell>
        <div className={cn(CONTAINER, "flex gap-6 pb-28 pt-6 lg:pb-10")}>
          <aside className="sticky top-[3.5rem] hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 flex-col overflow-y-auto pb-6 pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/10 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 lg:flex">
            <Switcher />
            <Sections current={current} onGo={nav.go} />
            <StoreNote mode={store.mode} saving={saving} />
          </aside>
          <main className="min-w-0 flex-1">
            <TopBar onMenu={() => setMenu(true)} typeName={t?.name} />
            <div className="mt-6">
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

        <nav aria-label="Main sections" className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-[#16161A]/95 lg:hidden">
          <div className="mx-auto grid max-w-lg grid-cols-5">
            {phoneBar(s).slice(0, 2).map((m) => <BarItem key={m} m={m} label={names[m]} active={current === m} onGo={nav.go} />)}
            <div className="grid place-items-center"><NewMenu round /></div>
            {phoneBar(s).slice(2, 4).map((m) => <BarItem key={m} m={m} label={names[m]} active={current === m} onGo={nav.go} />)}
          </div>
        </nav>

        <Sheet open={menu} onOpenChange={setMenu}>
          <SheetContent side="left" className={cn("ez-modern biz-app w-[85vw] max-w-xs overflow-y-auto border-black/10 bg-[#FAF7F2] dark:border-white/10 dark:bg-[#0D0D0F]", dark && "dark")}>
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
      <div className="mb-4 rounded-2xl bg-gradient-to-br from-[#18181B] via-[#111111] to-[#1F1523] p-4 text-white">
        <span className="inline-flex items-center rounded-full border border-white/15 bg-[#C8E967] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#111111]">{t?.name ?? "My business"}</span>
        {workspaces.length > 1 ? (
          <select className="mt-2 w-full rounded-lg border border-white/15 bg-white/10 px-2 py-1.5 font-display text-base font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F472D0]" value={db.ws.id} onChange={(e) => select(e.target.value)} aria-label="Switch business">
            {workspaces.map((w) => <option key={w.id} value={w.id} className="text-[#111111]">{w.name}</option>)}
          </select>
        ) : <p style={UNBOUNDED} className="mt-2 text-lg font-bold leading-tight">{db.ws.name}</p>}
        <Link to="/business?new=1" className="mt-2 inline-block rounded-full text-xs font-semibold text-white/70 underline-offset-2 hover:text-white hover:underline">+ Add another business</Link>
      </div>
    );
  }
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <ModernPage section={null} chrome={false} className="biz-app">
      <div className="relative min-h-screen bg-[#FAF7F2] dark:bg-[#0D0D0F]">
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_70%_45%_at_92%_-8%,rgba(244,114,208,0.14),transparent)] dark:bg-[radial-gradient(ellipse_70%_45%_at_92%_-8%,rgba(244,114,208,0.08),transparent)]" />
        <BizHeader />
        {children}
      </div>
    </ModernPage>
  );
}

function BizHeader() {
  const { dark, toggle } = useModernTheme();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-black/10 bg-[#FAF7F2]/90 backdrop-blur dark:border-white/10 dark:bg-[#0D0D0F]/90">
      <div className={cn(CONTAINER, "flex h-14 items-center justify-between gap-4")}>
        <Link to="/" aria-label="EZYOURLIFE home" className="flex items-center gap-2">
          <span aria-hidden style={UNBOUNDED} className="flex h-8 w-8 items-center justify-center rounded-lg border-[1.5px] border-[#111111] bg-[#F472D0] text-sm font-bold text-[#111111]">EZ</span>
          <span className="hidden text-sm font-semibold text-foreground/70 sm:inline">My business</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-foreground/70 transition hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" aria-label="Your account" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111111] text-sm font-bold text-white dark:bg-white dark:text-[#111111]">
                  {(user.email || "U").charAt(0).toUpperCase()}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={cn("ez-modern biz-app w-56 rounded-2xl border border-black/10 bg-white p-2 shadow-lg dark:border-white/10 dark:bg-[#16161A]", dark && "dark")}>
                <div className="px-2 py-1.5"><p className="truncate text-sm font-bold">{user.email}</p></div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/">Back to EZYOURLIFE</Link></DropdownMenuItem>
                <DropdownMenuItem onClick={() => void authService.signOut().then(() => { window.location.href = "/"; })} className="text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" /> Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth" state={{ from: "/business/app" }} className="rounded-full border-[1.5px] border-[#111111] bg-[#111111] px-4 py-1.5 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-[#111111]">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
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
  const visible = new Set(visibleModules(db.ws.settings));
  return (
    <nav className="space-y-2.5">
      {SECTION_GROUPS.map((group) => {
        const items = group.items.filter((m) => visible.has(m));
        if (!items.length) return null;
        return (
          <div key={group.label}>
            <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{group.label}</p>
            <ul className="space-y-0.5">
              {items.map((m) => {
                const Icon = MODULE_ICONS[m];
                const n = counts[m];
                return (
                  <li key={m}>
                    <button type="button" onClick={() => onGo(m)} aria-current={current === m ? "page" : undefined}
                      className={cn("flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[15px] font-semibold transition-colors", current === m ? "bg-[#111111] text-white dark:bg-white dark:text-[#111111]" : "text-foreground/80 hover:bg-black/[0.04] dark:hover:bg-white/5")}>
                      <Icon className="h-[18px] w-[18px] shrink-0" /><span className="flex-1">{names[m]}</span>
                      {!!n && <span className={cn("rounded-full px-1.5 text-xs", current === m ? "bg-white/20" : "bg-[#C8E967] text-[#111111]")}>{n}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function StoreNote({ mode, saving }: { mode: "local" | "cloud"; saving: boolean }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-black/20 bg-black/[0.03] p-3 text-xs dark:border-white/20 dark:bg-white/[0.04]">
      <p className="flex items-center gap-1.5 font-semibold">{mode === "cloud" ? <Cloud className="h-4 w-4" /> : <HardDrive className="h-4 w-4" />}{saving ? "Saving…" : mode === "cloud" ? "Saved in your account" : "Saved on this device"}</p>
      {mode === "local" && <p className="mt-1"><Link to="/auth" state={{ from: "/business/app" }} className="underline">Sign in</Link> to keep it safe, use it on any phone and put your website live.</p>}
      <p className="mt-1 text-muted-foreground">Entering your data is free.</p>
    </div>
  );
}

function BarItem({ m, label, active, onGo }: { m: ModuleId; label: string; active: boolean; onGo: (s: string) => void }) {
  const Icon = MODULE_ICONS[m];
  return (
    <button type="button" onClick={() => onGo(m)} aria-current={active ? "page" : undefined} className={cn("flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold", active ? "text-[#111111] dark:text-white" : "text-foreground/50")}>
      <Icon className={cn("h-5 w-5", active && "scale-110")} /><span className="max-w-full truncate px-1">{label}</span>
    </button>
  );
}

function NewMenu({ round }: { round?: boolean }) {
  const { db } = useBusiness();
  const nav = useContextNav();
  const { dark } = useModernTheme();
  if (!db) return null;
  const s = db.ws.settings;
  const has = (m: ModuleId) => s.modules.includes(m);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {round ? (
          <button type="button" className="-mt-6 grid h-14 w-14 place-items-center rounded-full border-[1.5px] border-[#111111] bg-[#F472D0] shadow-[3px_3px_0_#111111]" aria-label="New"><Plus className="h-7 w-7 text-[#111111]" /></button>
        ) : (
          <button type="button" className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-[#111111] bg-[#F472D0] px-5 py-2 text-sm font-semibold text-[#111111] shadow-[3px_3px_0_#111111] transition-transform hover:-translate-y-0.5"><Plus className="h-4 w-4" /> New</button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={cn("ez-modern biz-app w-56 rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-[#16161A]", dark && "dark")}>
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
      <button type="button" onClick={onMenu} aria-label="All sections" className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white lg:hidden dark:bg-[#16161A]", softBorder)}><Menu className="h-4 w-4" /></button>
      <div className="min-w-0 lg:hidden"><p style={UNBOUNDED} className="truncate font-bold leading-tight">{db.ws.name}</p><p className="truncate text-xs text-muted-foreground">{typeName}</p></div>
      <div className="relative order-last w-full lg:order-none lg:ml-auto lg:max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="h-10 rounded-full pl-10" placeholder="Find a customer, bill, order or item" value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setTimeout(() => setFocus(false), 150)} aria-label="Search" />
        {focus && hits.length > 0 && (
          <ul className={cn("absolute right-0 z-30 mt-1 w-full overflow-hidden rounded-2xl bg-white shadow-lg dark:bg-[#16161A]", softBorder)}>
            {hits.map((h, i) => <li key={i}><button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { nav.open(h.t); setQ(""); }} className="flex w-full justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-black/[0.04] dark:hover:bg-white/5"><b className="truncate">{h.label}</b><span className="shrink-0 text-muted-foreground">{h.sub}</span></button></li>)}
          </ul>
        )}
      </div>
      <div className="hidden lg:block"><NewMenu /></div>
    </div>
  );
}
