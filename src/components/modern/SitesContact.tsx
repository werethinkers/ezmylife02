import { useState } from "react";
import { SITES_CONTACT } from "@/data/siteWatch";
import { cn } from "@/lib/utils";
import { BTN_OUTLINE, BTN_PRIMARY, CARD } from "./styles";

/**
 * "Need one customised for your venture?" with WhatsApp and email, in the modern look. Same
 * behaviour as <SitesCta> (src/components/sites), which the Site Watch page keeps.
 */
export function SitesContact() {
  const [shown, setShown] = useState<null | "wa" | "em">(null);
  const [copied, setCopied] = useState(false);
  const wa = shown === "wa";
  const label = wa ? "WhatsApp" : "Email";
  const value = wa ? SITES_CONTACT.whatsapp || "[WhatsApp number]" : SITES_CONTACT.email || "[team email]";
  const href = wa ? (SITES_CONTACT.whatsapp ? `https://wa.me/${SITES_CONTACT.whatsapp.replace(/\D/g, "")}` : "") : SITES_CONTACT.email ? `mailto:${SITES_CONTACT.email}` : "";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* the text is selectable */
    }
  };
  return (
    <div className={cn(CARD, "p-6 md:p-8")}>
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div className="max-w-xl">
          <h3 className="font-display text-xl font-bold">Need one customised for your venture?</h3>
          <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
            Please contact the team. Tell us about your sites and we will tailor Site Watch with your own branding, roles and detections.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setShown("wa")} className={cn(BTN_PRIMARY, "bg-emerald-600 hover:bg-emerald-700")}>
            Chat on WhatsApp
          </button>
          <button type="button" onClick={() => setShown("em")} className={BTN_OUTLINE}>
            Email the team
          </button>
        </div>
      </div>
      {shown && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</span>
            <br />
            <code className="font-mono">{value}</code>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={copy} className={cn(BTN_OUTLINE, "px-3 py-1.5 text-xs")}>
              {copied ? "Copied" : "Copy"}
            </button>
            {href && (
              <a target="_blank" rel="noopener noreferrer" href={href} className={cn(BTN_PRIMARY, "px-3 py-1.5 text-xs")}>
                Open
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
