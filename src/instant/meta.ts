import type { Content, Product } from "./types";
import { greetingOf } from "./util";

/** Title and one-line description used for a published page's tab title and link previews. */
export function describe(p: Product, c: Content) {
  switch (p.family) {
    case "celebration": return { title: `${greetingOf(p.opts.greeting, c)}${String(greetingOf(p.opts.greeting, c)).includes(c.recipient) ? "" : " " + c.recipient} 🎉`, desc: `${c.sender} made something special for you. Tap to open your surprise.` };
    case "festival": return { title: `${p.opts.greeting} from ${c.sender}`, desc: String(c.message ?? "").slice(0, 150) };
    case "event": return { title: `${c.hosts} | ${p.name}`, desc: [c.tagline, c.venue].filter(Boolean).join(" · ") || "You're invited. View the invitation and RSVP." };
    case "business": return { title: `${c.name}${c.area ? ` | ${c.area}` : ""}${c.city ? `, ${c.city}` : ""}`, desc: String(c.tagline || `${p.opts.noun} in ${c.city ?? ""}`) };
    case "menu": return { title: `${c.name} | Menu`, desc: String(c.tagline || "See the menu and order on WhatsApp.") };
    default: return { title: `${c.name}${c.title ? ` | ${c.title}` : ""}`, desc: String(c.about ?? "").slice(0, 150) };
  }
}
