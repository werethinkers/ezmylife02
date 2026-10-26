import { useLocation } from "react-router-dom";
import { MessageCircle } from "lucide-react";

/** The help number people can message on WhatsApp. One place, so it is easy to change. */
export const HELP_WHATSAPP = "918878083486";
export const HELP_WHATSAPP_LABEL = "88780 83486";

// Screens that belong to the team or to a task in progress keep the corner clear.
const HIDE_ON = [/^\/admin/, /^\/auth/, /^\/oauth/, /^\/tool\//, /^\/create\//];

/**
 * Help button, on every public page. It pulses gently and wiggles now and then (both stop
 * for people who prefer less motion). It sits at the bottom left; the assistant button
 * keeps the bottom right.
 */
export function WhatsAppFab() {
  const { pathname } = useLocation();
  if (HIDE_ON.some((r) => r.test(pathname))) return null;
  const href = `https://wa.me/${HELP_WHATSAPP}?text=${encodeURIComponent("Hi Ezyourlife, I need help")}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Get help on WhatsApp, ${HELP_WHATSAPP_LABEL}`}
      className="wa-fab fixed bottom-[84px] left-3 z-[55] flex items-center gap-2.5 rounded-full border-2 border-ink bg-teal py-1.5 pl-1.5 pr-4 text-ink shadow-block-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:bottom-6 md:left-6 md:py-2 md:pl-2 md:pr-5"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-card md:h-10 md:w-10">
        <MessageCircle className="h-5 w-5" aria-hidden />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-display text-[12px] font-extrabold md:text-[13px]">Need help?</span>
        <span className="hidden text-[13px] font-bold md:block">WhatsApp {HELP_WHATSAPP_LABEL}</span>
      </span>
    </a>
  );
}
