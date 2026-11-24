import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bot, Check, Copy, Inbox, Loader2, Mail, Pencil, Play, Plus, Reply, RefreshCw, Send, Sparkles, Trash2, Wallet, X,
} from "lucide-react";
import { ModernPage } from "@/components/modern/ModernPage";
import { CONTAINER } from "@/components/modern/styles";
import { SEOHead } from "@/components/SEOHead";
import { seoFor } from "@/lib/seo/pages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRun } from "@/apps/lib/api";
import { callFunction } from "@/lib/credits";
import { emitCreditPrompt, handleCreditError } from "@/lib/creditPrompt";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* Mail Brain. Reading your mails here is free. You pay only when you press Fetch, and the
   price (0.08 credits a mail, rounded up to whole credits) is shown before anything is taken. */

/* eslint-disable @typescript-eslint/no-explicit-any */
const table = (name: string) => supabase.from(name as any) as any;

interface Account {
  id: string; email: string; is_default: boolean; include_in_fetch: boolean; display_name: string | null; sign_off: string | null;
  reply_lang: "same" | "en" | "hi"; read_updates: boolean; connected: boolean; last_synced_at: string | null; last_fetched_at: string | null;
}
interface MailRow {
  id: string; account_id: string; from_name: string | null; from_email: string | null; subject: string | null; received_at: string;
  kind: string | null; summary: string | null; reply_label: string | null; ai_done: boolean;
}
interface TaskRow { id: string; account_id: string; mail_id: string | null; title: string; kind: string; due: string | null; done: boolean }
interface DraftRow { id: string; mail_id: string; body: string }
interface Quote {
  mails: number; credits: number; balance: number; balance_after: number; enough: boolean;
  accounts: { account_id: string; email: string; mails: number; needs_scope: boolean; connected: boolean }[];
  first_scopes: { scope: string; mails: number; credits: number }[];
}
interface AutoTask {
  id: string; task_type: "auto_reply_all"; name: string; is_active: boolean; reply_mode: "fixed" | "ai";
  reply_template_or_prompt: string; skip_automated: boolean; last_run_at: string | null; created_at: string;
}
interface AutoLog {
  id: string; task_id: string; sender_name: string | null; sender_email: string; subject: string | null;
  draft_reply: string; status: "pending" | "sent" | "skipped"; created_at: string;
}

const TABS = ["Today", "Mails", "Tasks", "Replies", "Automation", "Accounts"] as const;
type Tab = (typeof TABS)[number];
const SCOPE_NAMES: Record<string, string> = { "30d": "Last 30 days", "6m": "Last 6 months", all: "Everything" };
const KIND_NAMES: Record<string, string> = { person: "From a person", update: "Update", promo: "Promotion", social: "Social", forum: "Forum", notice: "Notice", sent: "Sent" };
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;
const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const dayTime = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
/** Gmail stores either a text/plain or a text/html body in the same column; this is how the server
 * (supabase/functions/_shared/mailDesk.ts, cleanBody) already tells the two apart. */
const looksLikeHtml = (s: string) => /<\w+[^>]*>/.test(s);

const MailDesk = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>("Today");
  const [fetchOpen, setFetchOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const synced = useRef(false);
  const inited = useRef(false);

  const accounts = useQuery({
    queryKey: ["mail-desk", "accounts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!inited.current) {
        await callFunction("mail-desk", { action: "init" });
        inited.current = true;
      }
      const { data, error } = await table("mail_desk_accounts").select("*").order("is_default", { ascending: false }).order("created_at");
      if (error) throw error;
      return data as Account[];
    },
  });
  const mails = useQuery({
    queryKey: ["mail-desk", "mails", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await table("mail_desk_mails").select("id,account_id,from_name,from_email,subject,received_at,kind,summary,reply_label,ai_done")
        .not("segmented_at", "is", null).order("received_at", { ascending: false }).limit(300);
      if (error) throw error;
      return data as MailRow[];
    },
  });
  const tasks = useQuery({
    queryKey: ["mail-desk", "tasks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await table("mail_desk_tasks").select("*").order("done").order("due", { nullsFirst: false }).limit(300);
      if (error) throw error;
      return data as TaskRow[];
    },
  });
  const drafts = useQuery({
    queryKey: ["mail-desk", "drafts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await table("mail_desk_drafts").select("id,mail_id,body").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data as DraftRow[];
    },
  });
  const autoTasks = useQuery({
    queryKey: ["mail-desk", "auto-tasks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await table("mail_brain_tasks").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as AutoTask[];
    },
  });
  const autoQueue = useQuery({
    queryKey: ["mail-desk", "auto-queue", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await table("mail_brain_task_logs").select("id,task_id,sender_name,sender_email,subject,draft_reply,status,created_at")
        .eq("status", "pending").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data as AutoLog[];
    },
  });

  const refreshAll = useCallback(() => qc.invalidateQueries({ queryKey: ["mail-desk"] }), [qc]);
  const accts = useMemo(() => accounts.data ?? [], [accounts.data]);
  const byId = useMemo(() => new Map(accts.map((a) => [a.id, a])), [accts]);

  // Coming back from Google.
  useEffect(() => {
    if (params.get("connected")) toast.success("Gmail connected. Checking for mails is free.");
    const err = params.get("error");
    if (err) toast.error(err === "denied" ? "Gmail was not connected." : "Could not connect Gmail. Please try again.");
    if (params.get("connected") || err) setParams({}, { replace: true });
  }, [params, setParams]);

  /** Brings new mails in from Gmail. Free. */
  const checkGmail = useCallback(async (list: Account[], quiet = false) => {
    const targets = list.filter((a) => a.connected);
    if (!targets.length) return;
    setBusy("sync");
    try {
      let added = 0;
      for (const a of targets) {
        for (let i = 0; i < 60; i++) {
          const r = await callFunction<{ added: number; more: boolean }>("mail-desk", { action: "sync", account_id: a.id });
          added += r.added;
          if (!r.more) break;
        }
      }
      if (!quiet) toast.success(added ? `${plural(added, "new mail")} brought in. Reading them costs credits only when you press Fetch.` : "No new mails.");
    } catch (e) {
      if (!(await handleCreditError(e)) && !quiet) toast.error(e instanceof Error ? e.message : "Could not reach Gmail.");
    } finally {
      setBusy(null);
      refreshAll();
    }
  }, [refreshAll]);

  useEffect(() => {
    if (accounts.data && !synced.current) {
      synced.current = true;
      void checkGmail(accounts.data, true);
    }
  }, [accounts.data, checkGmail]);

  const connect = async () => {
    setBusy("connect");
    try {
      const r = await callFunction<{ url: string }>("mail-desk", { action: "connect" });
      window.location.href = r.url;
    } catch (e) {
      setBusy(null);
      if (!(await handleCreditError(e))) toast.error(e instanceof Error ? e.message : "Could not start connecting Gmail.");
    }
  };

  const openTasks = (tasks.data ?? []).filter((t) => !t.done);
  const needReply = (mails.data ?? []).filter((m) => m.reply_label === "needs_reply");

  return (
    <ModernPage section="apps">
      <SEOHead {...seoFor("/mail-brain", "")} />
      <main className={cn(CONTAINER, "py-8")}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mail Brain</p>
            <h1 className="font-display text-3xl font-bold tracking-tight">Your mail, read for you</h1>
            <p className="mt-1 max-w-xl text-muted-foreground">Looking at your mail, tasks and replies is free. You pay only when you press Fetch, and you see the price first.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => void checkGmail(accts)} disabled={!!busy || !accts.some((a) => a.connected)}>
              {busy === "sync" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} Check Gmail (free)
            </Button>
            <Button onClick={() => setFetchOpen(true)} disabled={!accts.some((a) => a.connected)}>
              <Inbox className="mr-2 h-4 w-4" /> Fetch
            </Button>
          </div>
        </div>

        <nav aria-label="Mail Brain sections" className="mt-6 flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              aria-current={tab === t ? "page" : undefined}
              className={cn(
                "rounded-full border-2 px-3.5 py-1.5 text-[15px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                tab === t ? "border-ink bg-ink text-cream" : "border-ink bg-card hover:bg-sand",
              )}
            >
              {t}
              {t === "Tasks" && openTasks.length > 0 && <span className="ml-1.5 rounded-full bg-sun px-1.5 text-xs text-ink">{openTasks.length}</span>}
              {t === "Replies" && needReply.length > 0 && <span className="ml-1.5 rounded-full bg-pink px-1.5 text-xs text-ink">{needReply.length}</span>}
              {t === "Automation" && (autoQueue.data ?? []).length > 0 && <span className="ml-1.5 rounded-full bg-sun px-1.5 text-xs text-ink">{(autoQueue.data ?? []).length}</span>}
            </button>
          ))}
        </nav>

        <div className="mt-6">
          {accounts.isLoading && <p className="text-muted-foreground">Loading…</p>}
          {accounts.isError && <p className="rounded-xl border-2 border-ink bg-coral p-4">Mail Brain could not load. Please refresh the page.</p>}
          {accounts.data && tab === "Today" && <Today accts={accts} mails={mails.data ?? []} tasks={openTasks} needReply={needReply} onTab={setTab} onFetch={() => setFetchOpen(true)} onConnect={connect} />}
          {accounts.data && tab === "Mails" && <Mails mails={mails.data ?? []} byId={byId} multi={accts.length > 1} />}
          {accounts.data && tab === "Tasks" && <Tasks tasks={tasks.data ?? []} byId={byId} multi={accts.length > 1} onChange={refreshAll} />}
          {accounts.data && tab === "Replies" && <Replies drafts={drafts.data ?? []} mails={mails.data ?? []} />}
          {accounts.data && tab === "Automation" && <Automation tasks={autoTasks.data ?? []} queue={autoQueue.data ?? []} onChange={refreshAll} />}
          {accounts.data && tab === "Accounts" && <Accounts accts={accts} busy={busy} onConnect={connect} onChange={refreshAll} />}
        </div>
      </main>

      <FetchDialog open={fetchOpen} onOpenChange={setFetchOpen} onDone={refreshAll} />
    </ModernPage>
  );
};

/* ---------- Today ---------- */
function Today({ accts, mails, tasks, needReply, onTab, onFetch, onConnect }: {
  accts: Account[]; mails: MailRow[]; tasks: TaskRow[]; needReply: MailRow[]; onTab: (t: Tab) => void; onFetch: () => void; onConnect: () => void;
}) {
  const anyConnected = accts.some((a) => a.connected);
  if (!anyConnected) {
    return (
      <div className="rounded-2xl border-2 border-ink bg-sun p-6 shadow-block">
        <h2 className="text-xl font-bold">Connect your Gmail to begin</h2>
        <p className="mt-1 max-w-xl">We can only read your mail (we cannot send or delete anything). Bringing your mails in is free. {accts[0] && <>Your sign-up Gmail is <b>{accts[0].email}</b>.</>}</p>
        <Button className="mt-4" onClick={onConnect}><Mail className="mr-2 h-4 w-4" /> Connect Gmail</Button>
      </div>
    );
  }
  const stat = (n: number, label: string, colour: string, to: Tab) => (
    <button type="button" onClick={() => onTab(to)} className={cn("rounded-2xl border-2 border-ink p-5 text-left shadow-block transition-transform hover:-translate-y-0.5", colour)}>
      <p className="text-3xl font-bold">{n}</p>
      <p className="font-semibold">{label}</p>
    </button>
  );
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {stat(needReply.length, "mails waiting for your reply", "bg-pink", "Replies")}
        {stat(tasks.length, "open tasks", "bg-sun", "Tasks")}
        {stat(mails.length, "mails read", "bg-teal", "Mails")}
      </div>
      <div className="rounded-2xl border-2 border-ink bg-card p-5">
        <h2 className="text-lg font-bold">Next up</h2>
        {tasks.length === 0 ? (
          <p className="mt-2 text-muted-foreground">{mails.length ? "No open tasks. Nice." : "Nothing read yet. Press Fetch to have your mails read."}</p>
        ) : (
          <ul className="mt-2 divide-y-2 divide-sand">
            {tasks.slice(0, 5).map((t) => (
              <li key={t.id} className="flex justify-between gap-3 py-2"><span>{t.title}</span><span className="shrink-0 text-sm text-muted-foreground">{t.due ? day(t.due) : ""}</span></li>
            ))}
          </ul>
        )}
        {!mails.length && <Button className="mt-4" onClick={onFetch}><Inbox className="mr-2 h-4 w-4" /> Fetch</Button>}
      </div>
    </div>
  );
}

/* ---------- Mails ---------- */
function Mails({ mails, byId, multi }: { mails: MailRow[]; byId: Map<string, Account>; multi: boolean }) {
  const [filter, setFilter] = useState<"all" | "reply" | "people">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const shown = mails.filter((m) => (filter === "reply" ? m.reply_label === "needs_reply" : filter === "people" ? m.kind === "person" : true));
  const openMail = openId ? mails.find((m) => m.id === openId) ?? null : null;
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1">
        {([["all", "All"], ["reply", "Needs a reply"], ["people", "From people"]] as const).map(([k, l]) => (
          <button key={k} type="button" onClick={() => setFilter(k)} aria-pressed={filter === k}
            className={cn("rounded-full border-2 px-3 py-1 text-sm font-semibold", filter === k ? "border-ink bg-ink text-cream" : "border-ink bg-card hover:bg-sand")}>{l}</button>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-ink p-6 text-muted-foreground">{mails.length ? "Nothing matches." : "No mails read yet. Press Fetch to read your mails."}</p>
      ) : (
        <ul className="space-y-2">
          {shown.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => setOpenId(m.id)}
                className="w-full rounded-xl border-2 border-ink bg-card p-4 text-left transition hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-bold">{m.from_name || m.from_email}</p>
                  <p className="text-sm text-muted-foreground">{day(m.received_at)}{multi && byId.get(m.account_id) ? ` · ${byId.get(m.account_id)!.email}` : ""}</p>
                </div>
                <p className="text-[15px]">{m.subject || "(no subject)"}</p>
                {m.summary && <p className="mt-1 text-sm text-muted-foreground">{m.summary}</p>}
                <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-semibold">
                  <span className="rounded-full border-2 border-ink px-2 py-0.5">{KIND_NAMES[m.kind ?? ""] ?? "Mail"}</span>
                  {m.reply_label === "needs_reply" && <span className="rounded-full border-2 border-ink bg-pink px-2 py-0.5">Needs a reply</span>}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <MailDetailDrawer mail={openMail} onClose={() => setOpenId(null)} />
    </div>
  );
}

/** Slide-in panel from the right with the full mail. The body isn't in the list query (it can run
 * to 20,000 characters per mail), so it's fetched by id only once a mail is opened. Sheet (Radix
 * Dialog underneath) already closes on Escape or an outside click, and draws its own × button. */
function MailDetailDrawer({ mail, onClose }: { mail: MailRow | null; onClose: () => void }) {
  const body = useQuery({
    queryKey: ["mail-desk", "mail-body", mail?.id],
    enabled: !!mail,
    queryFn: async () => {
      const { data, error } = await table("mail_desk_mails").select("body").eq("id", mail!.id).single();
      if (error) throw error;
      return ((data as { body: string | null }).body ?? "").trim();
    },
  });
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const { busy: drafting, run: runDraft } = useRun("mail-brain-draft-reply");

  useEffect(() => {
    setReplying(false);
    setReplyText("");
  }, [mail?.id]);

  const draftWithAi = async () => {
    if (!mail) return;
    const out = await runDraft<string>({
      inputs: {
        "From the sender": mail.from_name ? `${mail.from_name} <${mail.from_email}>` : mail.from_email ?? "",
        Subject: mail.subject || "",
        Body: body.data || mail.summary || "",
      },
      action: "generate",
    });
    if (out) setReplyText(out);
  };

  const sendReply = async () => {
    if (!mail || !replyText.trim()) return;
    setSending(true);
    try {
      await callFunction("send-mail-brain-reply", { mail_id: mail.id, body: replyText.trim() });
      toast.success("Reply sent");
      setReplying(false);
      setReplyText("");
    } catch (e) {
      if (!(await handleCreditError(e))) toast.error(e instanceof Error ? e.message : "Could not send that reply.");
    } finally {
      setSending(false);
    }
  };

  const replySubject = mail && (/^re:/i.test(mail.subject || "") ? mail.subject : `Re: ${mail.subject || ""}`);

  return (
    <Sheet open={!!mail} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col overflow-y-auto border-l-2 border-ink sm:max-w-2xl">
        {mail && (
          <>
            <SheetHeader className="space-y-1.5 text-left">
              <SheetTitle className="font-display text-xl">{mail.subject || "(no subject)"}</SheetTitle>
              <SheetDescription asChild>
                <div className="space-y-0.5 text-sm">
                  <p className="font-semibold text-foreground">{mail.from_name ? `${mail.from_name} <${mail.from_email}>` : mail.from_email || "Unknown sender"}</p>
                  <p>{dayTime(mail.received_at)}</p>
                </div>
              </SheetDescription>
            </SheetHeader>

            <div className="mt-5 flex-1 border-t-2 border-ink pt-5">
              {body.isLoading ? (
                <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading the full mail…</p>
              ) : body.data ? (
                looksLikeHtml(body.data) ? (
                  <iframe title="Mail content" sandbox="" srcDoc={body.data} className="h-[65vh] w-full rounded-xl border-2 border-ink bg-white" />
                ) : (
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{body.data}</p>
                )
              ) : (
                <p className="text-muted-foreground">{mail.summary || "No content was stored for this mail."}</p>
              )}
            </div>

            <div className="mt-5 border-t-2 border-ink pt-5">
              {!replying ? (
                <Button variant="outline" onClick={() => setReplying(true)} disabled={!mail.from_email} title={mail.from_email ? undefined : "This mail has no reply address"}>
                  <Reply className="mr-2 h-4 w-4" /> Reply
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    <p><span className="font-semibold text-foreground">To</span> {mail.from_name ? `${mail.from_name} <${mail.from_email}>` : mail.from_email}</p>
                    <p><span className="font-semibold text-foreground">Subject</span> {replySubject}</p>
                  </div>
                  <Textarea
                    rows={6}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply…"
                    className="border-2 border-ink focus-visible:ring-ring"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => void draftWithAi()} disabled={drafting}>
                      {drafting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />} Draft with AI
                    </Button>
                    <Button type="button" size="sm" onClick={() => void sendReply()} disabled={sending || !replyText.trim()}>
                      {sending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />} Send Reply
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => { setReplying(false); setReplyText(""); }}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ---------- Tasks ---------- */
function Tasks({ tasks, byId, multi, onChange }: { tasks: TaskRow[]; byId: Map<string, Account>; multi: boolean; onChange: () => void }) {
  const toggle = async (t: TaskRow) => {
    const { error } = await table("mail_desk_tasks").update({ done: !t.done }).eq("id", t.id);
    if (error) toast.error("Could not save that.");
    onChange();
  };
  if (!tasks.length) return <p className="rounded-2xl border-2 border-dashed border-ink p-6 text-muted-foreground">No tasks yet. They appear when your mails are read.</p>;
  return (
    <ul className="space-y-2">
      {tasks.map((t) => (
        <li key={t.id} className="flex items-start gap-3 rounded-xl border-2 border-ink bg-card p-4">
          <Checkbox checked={t.done} onCheckedChange={() => void toggle(t)} aria-label={`Mark done: ${t.title}`} className="mt-1" />
          <div className="min-w-0 flex-1">
            <p className={cn("font-semibold", t.done && "text-muted-foreground line-through")}>{t.title}</p>
            <p className="text-sm text-muted-foreground">
              {t.kind === "follow_up" ? "Follow-up" : t.kind === "minutes" ? "From a meeting" : t.kind === "reminder" ? "Reminder" : "Ask"}
              {t.due ? ` · ${day(t.due)}` : ""}{multi && byId.get(t.account_id) ? ` · ${byId.get(t.account_id)!.email}` : ""}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Replies ---------- */
function Replies({ drafts, mails }: { drafts: DraftRow[]; mails: MailRow[] }) {
  const byMail = new Map(mails.map((m) => [m.id, m]));
  const [copied, setCopied] = useState<string | null>(null);
  if (!drafts.length) return <p className="rounded-2xl border-2 border-dashed border-ink p-6 text-muted-foreground">No reply drafts yet. Nothing is ever sent for you; copy a draft and send it from Gmail.</p>;
  return (
    <ul className="space-y-3">
      {drafts.map((d) => {
        const m = byMail.get(d.mail_id);
        return (
          <li key={d.id} className="rounded-xl border-2 border-ink bg-card p-4">
            <p className="font-bold">To {m?.from_name || m?.from_email || "sender"}</p>
            <p className="text-sm text-muted-foreground">Re: {m?.subject || "(no subject)"}</p>
            <p className="mt-2 whitespace-pre-wrap rounded-lg bg-sand p-3 text-[15px]">{d.body}</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="outline" onClick={async () => { await navigator.clipboard.writeText(d.body); setCopied(d.id); setTimeout(() => setCopied(null), 1500); }}>
                {copied === d.id ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />} {copied === d.id ? "Copied" : "Copy"}
              </Button>
              {m?.from_email && (
                <Button size="sm" variant="outline" asChild>
                  <a href={`mailto:${m.from_email}?subject=${encodeURIComponent("Re: " + (m.subject ?? ""))}&body=${encodeURIComponent(d.body)}`}>Open in your mail app</a>
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- Accounts and one Gmail's profile ---------- */
function Accounts({ accts, busy, onConnect, onChange }: { accts: Account[]; busy: string | null; onConnect: () => void; onChange: () => void }) {
  const save = async (id: string, patch: Partial<Account>) => {
    const { error } = await table("mail_desk_accounts").update(patch).eq("id", id);
    if (error) toast.error("Could not save that.");
    onChange();
  };
  const remove = async (a: Account) => {
    if (!window.confirm(`Remove ${a.email} and all its mails from Mail Brain?`)) return;
    const { error } = await table("mail_desk_accounts").delete().eq("id", a.id);
    if (error) toast.error("Could not remove it.");
    onChange();
  };
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {accts.map((a) => (
          <div key={a.id} className="rounded-2xl border-2 border-ink bg-card p-5 shadow-block">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-bold">{a.email}</p>
                <p className="text-sm text-muted-foreground">{a.is_default ? "Your sign-up Gmail" : "Added Gmail"} · {a.connected ? "connected" : "not connected"}</p>
              </div>
              {!a.is_default && <Button size="icon" variant="ghost" aria-label={`Remove ${a.email}`} onClick={() => void remove(a)}><Trash2 className="h-4 w-4" /></Button>}
            </div>
            {!a.connected ? (
              <Button className="mt-3" size="sm" onClick={onConnect} disabled={busy === "connect"}>Connect this Gmail</Button>
            ) : (
              <Button className="mt-3" size="sm" variant="outline" onClick={onConnect} disabled={busy === "connect"}>
                Allow sending replies
              </Button>
            )}
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-3"><Label htmlFor={`inc-${a.id}`}>Include when I press Fetch</Label><Switch id={`inc-${a.id}`} checked={a.include_in_fetch} onCheckedChange={(v) => void save(a.id, { include_in_fetch: v })} /></div>
              <div className="flex items-center justify-between gap-3"><Label htmlFor={`upd-${a.id}`}>Also read "Updates" mails (bills, alerts)</Label><Switch id={`upd-${a.id}`} checked={a.read_updates} onCheckedChange={(v) => void save(a.id, { read_updates: v })} /></div>
              <div><Label htmlFor={`name-${a.id}`}>Name on replies</Label><Input id={`name-${a.id}`} defaultValue={a.display_name ?? ""} onBlur={(e) => e.target.value !== (a.display_name ?? "") && void save(a.id, { display_name: e.target.value })} /></div>
              <div><Label htmlFor={`sign-${a.id}`}>Sign-off</Label><Input id={`sign-${a.id}`} placeholder="Regards, …" defaultValue={a.sign_off ?? ""} onBlur={(e) => e.target.value !== (a.sign_off ?? "") && void save(a.id, { sign_off: e.target.value })} /></div>
              <div>
                <Label htmlFor={`lang-${a.id}`}>Reply language</Label>
                <select id={`lang-${a.id}`} value={a.reply_lang} onChange={(e) => void save(a.id, { reply_lang: e.target.value as Account["reply_lang"] })}
                  className="mt-1 h-10 w-full rounded-md border-2 border-ink bg-background px-3 text-sm">
                  <option value="same">Same as the mail</option><option value="en">English</option><option value="hi">Hindi</option>
                </select>
              </div>
            </div>
          </div>
        ))}
        <button type="button" onClick={onConnect} disabled={busy === "connect"} className="flex min-h-[10rem] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink p-5 font-semibold hover:bg-card">
          <Plus className="h-6 w-6" /> Add another Gmail
        </button>
      </div>

      <div className="rounded-2xl border-2 border-ink bg-sun p-5">
        <h2 className="text-lg font-bold">What it costs</h2>
        <p className="mt-1">0.08 credits per mail, added up and rounded up to whole credits (at least 1). So 30 mails = 3 credits, 100 = 8, 1,000 = 80. Bringing mails in from Gmail and looking at them is free. If a run fails, nothing is charged.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm"><Link to="/credits"><Wallet className="mr-1.5 h-4 w-4" /> Credits and payments</Link></Button>
          <Button asChild variant="outline" size="sm"><Link to="/subscription">Subscription</Link></Button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Automation: tasks that draft replies, and the queue waiting for your review ---------- */
function Automation({ tasks, queue, onChange }: { tasks: AutoTask[]; queue: AutoLog[]; onChange: () => void }) {
  const [editing, setEditing] = useState<AutoTask | "new" | null>(null);
  const [running, setRunning] = useState(false);
  const [actingOn, setActingOn] = useState<string | null>(null);

  const runNow = async () => {
    setRunning(true);
    try {
      const r = await callFunction<{ drafted: number; skipped: number; errors: string[] }>("run-mail-brain-tasks", {});
      if (r.drafted) toast.success(`${plural(r.drafted, "reply")} drafted — review them below.`);
      else toast.success("No new mail to reply to right now.");
      if (r.errors?.length) toast.error(r.errors[0]);
    } catch (e) {
      if (!(await handleCreditError(e))) toast.error(e instanceof Error ? e.message : "Could not run the automation.");
    } finally {
      setRunning(false);
      onChange();
    }
  };

  const toggleActive = async (t: AutoTask) => {
    const { error } = await table("mail_brain_tasks").update({ is_active: !t.is_active }).eq("id", t.id);
    if (error) toast.error("Could not save that.");
    onChange();
  };
  const remove = async (t: AutoTask) => {
    if (!window.confirm(`Delete "${t.name}"? Anything still waiting for your review from it will be removed too.`)) return;
    const { error } = await table("mail_brain_tasks").delete().eq("id", t.id);
    if (error) toast.error("Could not delete that.");
    onChange();
  };

  const sendQueued = async (log: AutoLog) => {
    setActingOn(log.id);
    try {
      await callFunction("send-mail-brain-reply", { task_log_id: log.id });
      toast.success("Sent");
    } catch (e) {
      if (!(await handleCreditError(e))) toast.error(e instanceof Error ? e.message : "Could not send that reply.");
    } finally {
      setActingOn(null);
      onChange();
    }
  };
  const discardQueued = async (log: AutoLog) => {
    setActingOn(log.id);
    const { error } = await table("mail_brain_task_logs").update({ status: "skipped" }).eq("id", log.id);
    if (error) toast.error("Could not discard that.");
    setActingOn(null);
    onChange();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Automation</h2>
          <p className="max-w-xl text-sm text-muted-foreground">Tasks draft replies for you around the clock. Nothing is ever sent on its own — every draft waits below until you tap Send.</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="outline" onClick={() => void runNow()} disabled={running || !tasks.some((t) => t.is_active)}>
            {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />} Run now
          </Button>
          <Button onClick={() => setEditing("new")}><Plus className="mr-2 h-4 w-4" /> Add Task</Button>
        </div>
      </div>

      {queue.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-bold">Waiting for your review ({queue.length})</h3>
          <ul className="space-y-2">
            {queue.map((log) => (
              <li key={log.id} className="rounded-xl border-2 border-ink bg-card p-4">
                <p className="font-bold">To {log.sender_name || log.sender_email}</p>
                <p className="text-sm text-muted-foreground">Re: {log.subject || "(no subject)"}</p>
                <p className="mt-2 whitespace-pre-wrap rounded-lg bg-sand p-3 text-[15px]">{log.draft_reply}</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" disabled={actingOn === log.id} onClick={() => void sendQueued(log)}>
                    {actingOn === log.id ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />} Send
                  </Button>
                  <Button size="sm" variant="outline" disabled={actingOn === log.id} onClick={() => void discardQueued(log)}>
                    <X className="mr-1.5 h-4 w-4" /> Discard
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="font-bold">Tasks</h3>
        {tasks.length === 0 ? (
          <p className="rounded-2xl border-2 border-dashed border-ink p-6 text-muted-foreground">No tasks yet. Add one to start drafting replies automatically.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {tasks.map((t) => (
              <div key={t.id} className="rounded-2xl border-2 border-ink bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{t.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {t.reply_mode === "ai" ? "AI smart reply" : "Fixed message"} · {t.last_run_at ? `last ran ${dayTime(t.last_run_at)}` : "never run yet"}
                    </p>
                  </div>
                  <span className={cn("shrink-0 rounded-full border-2 border-ink px-2 py-0.5 text-xs font-bold", t.is_active ? "bg-lime" : "bg-card")}>{t.is_active ? "Active" : "Paused"}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(t)}><Pencil className="mr-1.5 h-4 w-4" /> Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => void toggleActive(t)}>{t.is_active ? "Pause" : "Resume"}</Button>
                  <Button size="sm" variant="ghost" aria-label={`Delete ${t.name}`} onClick={() => void remove(t)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && <TaskDialog task={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onChange(); }} />}
    </div>
  );
}

function TaskDialog({ task, onClose, onSaved }: { task: AutoTask | null; onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState(task?.name ?? "Auto-reply to all emails");
  const [replyMode, setReplyMode] = useState<"fixed" | "ai">(task?.reply_mode ?? "fixed");
  const [text, setText] = useState(task?.reply_template_or_prompt ?? "");
  const [skipAutomated, setSkipAutomated] = useState(task?.skip_automated ?? true);
  const [isActive, setIsActive] = useState(task?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!text.trim()) { toast.error(replyMode === "fixed" ? "Write the reply to send." : "Write an instruction for the AI."); return; }
    if (!name.trim()) { toast.error("Give the task a name."); return; }
    setSaving(true);
    try {
      const patch = { name: name.trim(), reply_mode: replyMode, reply_template_or_prompt: text.trim(), skip_automated: skipAutomated, is_active: isActive };
      const { error } = task
        ? await table("mail_brain_tasks").update(patch).eq("id", task.id)
        : await table("mail_brain_tasks").insert({ user_id: user!.id, task_type: "auto_reply_all", ...patch });
      if (error) throw error;
      toast.success(task ? "Saved" : "Task added");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save that.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg border-2 border-ink">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Bot className="h-5 w-5" /> {task ? "Edit task" : "Add a task"}</DialogTitle>
          <DialogDescription>Replies are drafted for your review — nothing sends until you approve it.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="task-type">Task type</Label>
            <select id="task-type" value="auto_reply_all" disabled className="mt-1 h-10 w-full rounded-md border-2 border-ink bg-background px-3 text-sm opacity-70">
              <option value="auto_reply_all">Auto-Reply to All Emails</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">The first task type — more are coming later.</p>
          </div>
          <div>
            <Label htmlFor="task-name">Name</Label>
            <Input id="task-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Reply mode</Label>
            <div className="mt-1 flex gap-2">
              <button type="button" onClick={() => setReplyMode("fixed")} className={cn("flex-1 rounded-xl border-2 border-ink px-3 py-2 text-sm font-semibold", replyMode === "fixed" ? "bg-ink text-cream" : "bg-card")}>
                Fixed message
              </button>
              <button type="button" onClick={() => setReplyMode("ai")} className={cn("flex-1 rounded-xl border-2 border-ink px-3 py-2 text-sm font-semibold", replyMode === "ai" ? "bg-ink text-cream" : "bg-card")}>
                AI smart reply
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="task-text">{replyMode === "fixed" ? "Reply message" : "Instruction for the AI (tone, what to say)"}</Label>
            <Textarea
              id="task-text"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="border-2 border-ink"
              placeholder={replyMode === "fixed" ? "Thanks for your email — I'll get back to you soon." : "Polite, tell them I'll respond within 24 hours."}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="task-skip">Skip no-reply, newsletters and promotions, and reply once per thread</Label>
            <Switch id="task-skip" checked={skipAutomated} onCheckedChange={setSkipAutomated} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="task-active">Active</Label>
            <Switch id="task-active" checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => void save()} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Fetch: quote first, then pay by reading ---------- */
function FetchDialog({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; onDone: () => void }) {
  const [choices, setChoices] = useState<Quote["first_scopes"]>([]);
  const [scope, setScope] = useState<string>("new");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ read: number; credits: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const stop = useRef(false);

  const load = useCallback(async (sc: string) => {
    setLoading(true);
    try {
      const q = await callFunction<Quote>("mail-desk", { action: "quote", scope: sc });
      setQuote(q);
      if (sc === "new") setChoices(q.accounts.some((a) => a.needs_scope) ? q.first_scopes : []);
    } catch (e) {
      if (!(await handleCreditError(e))) setMessage(e instanceof Error ? e.message : "Could not work out the price.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) { setScope("new"); setQuote(null); setChoices([]); setProgress(null); setMessage(null); void load("new"); }
  }, [open, load]);

  const needsScope = choices.length > 0;

  const run = async () => {
    stop.current = false;
    setRunning(true);
    setMessage(null);
    let read = 0, credits = 0;
    setProgress({ read, credits });
    try {
      for (let i = 0; i < 400 && !stop.current; i++) {
        const r = await callFunction<{ processed: number; remaining: number; credits_charged?: number; done: boolean; busy?: boolean }>("mail-desk", { action: "process", scope });
        read += r.processed;
        credits += r.credits_charged ?? 0;
        setProgress({ read, credits });
        if (r.processed) emitCreditPrompt({ kind: "charged" });
        if (r.done || r.busy || r.processed === 0) break;
      }
      setMessage(stop.current ? `Stopped. You paid ${credits} credits for ${plural(read, "mail")} read so far.` : `Done. ${plural(read, "mail")} read for ${credits} credits.`);
    } catch (e) {
      if (!(await handleCreditError(e))) setMessage((e as { message?: string })?.message ?? "Something went wrong. Nothing more was charged.");
    } finally {
      setRunning(false);
      onDone();
      void load(scope);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !running && onOpenChange(o)}>
      <DialogContent className="max-w-lg border-2 border-ink">
        <DialogHeader>
          <DialogTitle>Fetch and read my mails</DialogTitle>
          <DialogDescription>You see the price first. Nothing is taken until you press the button below.</DialogDescription>
        </DialogHeader>

        {loading && !quote && <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Working out the price…</p>}

        {quote && needsScope && !progress && (
          <fieldset className="space-y-2">
            <legend className="mb-1 font-semibold">How far back should we read? (first time only)</legend>
            {choices.map((o) => (
              <label key={o.scope} className={cn("flex cursor-pointer items-center justify-between gap-3 rounded-xl border-2 border-ink p-3", scope === o.scope && "bg-sun")}>
                <span className="flex items-center gap-2"><input type="radio" name="scope" checked={scope === o.scope} onChange={() => { setScope(o.scope); void load(o.scope); }} />{SCOPE_NAMES[o.scope]}</span>
                <span className="text-sm">{plural(o.mails, "mail")} · <b>{o.credits || 0} credits</b></span>
              </label>
            ))}
          </fieldset>
        )}

        {quote && !needsScope && (
          <div className="rounded-xl border-2 border-ink bg-sun p-4">
            {quote.mails === 0 ? (
              <p className="font-semibold">Nothing new to read right now.</p>
            ) : (
              <>
                <p className="text-lg font-bold">{plural(quote.mails, "mail")} → {quote.credits} credits</p>
                <p className="text-sm">You have {quote.balance} credits. After this you will have {Math.max(0, quote.balance_after)}.</p>
              </>
            )}
          </div>
        )}
        {quote && needsScope && scope !== "new" && quote.mails > 0 && (
          <div className="rounded-xl border-2 border-ink bg-sun p-4">
            <p className="text-lg font-bold">{plural(quote.mails, "mail")} → {quote.credits} credits</p>
            <p className="text-sm">You have {quote.balance} credits. After this you will have {Math.max(0, quote.balance_after)}.</p>
          </div>
        )}
        {quote && !quote.enough && quote.mails > 0 && (
          <p className="rounded-xl border-2 border-ink bg-coral p-3 text-sm">You need {quote.credits - quote.balance} more credits. <Link to="/credits" className="font-bold underline">Buy credits</Link></p>
        )}

        {progress && <p className="font-semibold" aria-live="polite">{running ? "Reading… " : ""}{plural(progress.read, "mail")} read · {progress.credits} credits used</p>}
        {message && <p className="text-sm" role="status">{message}</p>}

        <div className="flex justify-end gap-2">
          {running ? (
            <Button variant="outline" onClick={() => { stop.current = true; }}>Stop</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>{progress ? "Close" : "Cancel"}</Button>
              {!progress && quote && quote.mails > 0 && quote.enough && !(needsScope && scope === "new") && (
                <Button onClick={() => void run()}>Fetch for {quote.credits} credits</Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MailDesk;
