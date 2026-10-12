import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Loader2, Bot } from "lucide-react";
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
const HIDE_PREFIXES = ["/tool/", "/auth", "/admin", "/bulk/", "/p/", "/create", "/my-pages"];

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
            "✅ Got it! Your request is **registered with the EZYOURLIFE team**. We'll build or update the app and email you within **24-48 hours**.\n\nMeanwhile, want to explore [240+ live apps](/ai-apps)?",
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
      {/* Floating launcher */}
      <motion.button
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.3 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-[84px] right-3 md:bottom-6 md:right-6 z-[60] h-12 w-12 md:h-14 md:w-14 rounded-full border-2 border-ink bg-sun shadow-[3px_3px_0_0_hsl(var(--ink))]"
        aria-label="Open EZYOURLIFE Assistant"
      >
        <span className="flex h-full w-full items-center justify-center rounded-full">
          {open ? (
            <X className="h-6 w-6 text-foreground" />
          ) : (
            <Sparkles className="h-6 w-6 text-ink" />
          )}
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
