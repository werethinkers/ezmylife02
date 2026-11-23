import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Loader2, Bot, MessageCircle, ArrowUpRight } from "lucide-react";
import { HELP_WHATSAPP, HELP_WHATSAPP_LABEL } from "@/components/WhatsAppFab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Markdown } from "@/components/common/Markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/smart-assistant`;
const HIDE_PREFIXES = ["/tool/", "/auth", "/admin", "/bulk/", "/p/", "/create", "/my-pages", "/developer/preview/"];

// Hides the lead-capture block the assistant appends; the rest is rendered as safe Markdown.
const visibleText = (text: string) => text.replace(/<<<LEAD>>>[\s\S]*?<<<END>>>/g, "").trim();

const extractLead = (text: string) => {
  const m = text.match(/<<<LEAD>>>([\s\S]*?)<<<END>>>/);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
};

export const SmartAssistantChatbot = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  // The small sheet with the two ways to get help (WhatsApp, or ask the assistant).
  const [menu, setMenu] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hey! 👋 I'm the **EZYOURLIFE Assistant**. Tell me the problem you're trying to solve and I'll suggest the right AI app — or get our team to build it for you in 24-48 hrs. No signup needed.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [submittedLeads, setSubmittedLeads] = useState<Set<string>>(new Set());
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const hidden = HIDE_PREFIXES.some((p) => location.pathname.startsWith(p));
  if (hidden) return null;

  const submitLead = async (lead: any) => {
    const key = `${lead.email}|${lead.description}`;
    if (submittedLeads.has(key)) return;
    setSubmittedLeads((prev) => new Set(prev).add(key));
    try {
      const { error } = await supabase.functions.invoke("submit-tool-request", {
        body: { ...lead, source: "smart-assistant" },
      });
      if (error) throw error;
      toast.success("Request registered! Check your email shortly.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "✅ Got it! Your request is **registered with the EZYOURLIFE team**. We'll build or update the app and email you within **24-48 hours**.\n\nMeanwhile, want to explore [440+ live apps](/ai-apps)?",
        },
      ]);
    } catch (e: any) {
      toast.error(e.message || "Could not submit request");
    }
  };

  const stream = async (history: Message[]) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: history }),
    });
    if (!resp.ok || !resp.body) {
      const j = await resp.json().catch(() => ({}));
      throw new Error(j.error || "Failed to reach assistant");
    }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let acc = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf("\n")) !== -1) {
        let line = buf.slice(0, nl);
        buf = buf.slice(nl + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (json === "[DONE]") continue;
        try {
          const p = JSON.parse(json);
          const c = p.choices?.[0]?.delta?.content;
          if (c) {
            acc += c;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant" && prev.length > history.length) {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: acc } : m,
                );
              }
              return [...prev, { role: "assistant", content: acc }];
            });
          }
        } catch { /* partial */ }
      }
    }
    const lead = extractLead(acc);
    if (lead?.email && lead?.name && lead?.description) {
      await submitLead(lead);
    }
  };

  const send = async () => {
    if (!input.trim() || busy) return;
    const text = input.trim();
    setInput("");
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setBusy(true);
    try {
      await stream(next);
    } catch (e: any) {
      toast.error(e.message || "Assistant error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* One help button: opens a small sheet with WhatsApp and the assistant. */}
      {menu && <button type="button" aria-label="Close help" className="fixed inset-0 z-[58] cursor-default" onClick={() => setMenu(false)} />}
      <AnimatePresence>
        {menu && !open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-[140px] right-3 z-[60] w-[min(300px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border-2 border-ink bg-card shadow-[5px_5px_0_0_hsl(var(--ink))] md:bottom-24 md:right-6"
            role="menu"
            aria-label="Get help"
          >
            <a
              role="menuitem"
              href={`https://wa.me/${HELP_WHATSAPP}?text=${encodeURIComponent("Hi Ezyourlife, I need help")}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenu(false)}
              className="flex items-center gap-3 border-b-2 border-ink bg-teal px-4 py-3 text-ink hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-card">
                <MessageCircle className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block font-display text-[15px] font-extrabold">Chat on WhatsApp</span>
                <span className="block text-[13px] font-bold">{HELP_WHATSAPP_LABEL}</span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
            </a>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenu(false);
                setOpen(true);
              }}
              className="flex w-full items-center gap-3 bg-sun px-4 py-3 text-left text-ink hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-card">
                <Sparkles className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block font-display text-[15px] font-extrabold">Ask the assistant</span>
                <span className="block text-[13px] font-semibold">Tell it what you need, get the right app</span>
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.3 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => (open ? setOpen(false) : setMenu((v) => !v))}
        aria-expanded={open || menu}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[60] h-12 w-12 md:h-14 md:w-14 rounded-full border-2 border-ink bg-sun shadow-[3px_3px_0_0_hsl(var(--ink))]"
        aria-label={open || menu ? "Close help" : "Get help: WhatsApp or the assistant"}
      >
        {!open && !menu && <span className="help-ring" aria-hidden />}
        <span className="flex h-full w-full items-center justify-center rounded-full">
          {open || menu ? <X className="h-6 w-6 text-foreground" /> : <MessageCircle className="h-6 w-6 text-ink" />}
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-36 md:bottom-24 right-3 sm:right-6 z-[60] w-[calc(100vw-1.5rem)] sm:w-[400px] h-[560px] max-h-[70vh] md:max-h-[78vh] rounded-2xl border-2 border-ink bg-card shadow-[6px_6px_0_0_hsl(var(--ink))]"
          >
            <div className="flex h-full flex-col rounded-[14px] bg-card overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b-2 border-ink bg-sun">
                <div className="h-9 w-9 rounded-xl border-2 border-ink bg-card flex items-center justify-center">
                  <Bot className="h-5 w-5 text-ink" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm leading-none">EZYOURLIFE Assistant</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Always free · No signup
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/70"
                      }`}
                    >
                      {m.role === "user" ? (
                        <span className="whitespace-pre-wrap">{m.content}</span>
                      ) : (
                        <Markdown className="text-sm prose-p:my-1">{visibleText(m.content)}</Markdown>
                      )}
                    </div>
                  </div>
                ))}
                {busy && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex justify-start">
                    <div className="bg-muted/70 rounded-2xl px-4 py-2.5 flex gap-1">
                      <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" />
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="p-3 border-t border-border/50 flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe your problem or ask for an app…"
                  disabled={busy}
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={busy || !input.trim()}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SmartAssistantChatbot;
