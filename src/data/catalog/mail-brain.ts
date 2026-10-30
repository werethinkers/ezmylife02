import type { ToolEntry } from "../toolsDatabase";

// Mail Brain: has its own page (src/pages/MailDesk.tsx at /mail-brain), so it is a catalogue row with a dedicatedRoute and no app definition.
// It is charged per fetch by the mail-desk function (tool ids mail-desk-12 and mail-desk-25), see docs/mail-desk.md.
export const mailBrainTools: ToolEntry[] = [
  { id: "mail-brain", name: "Mail Brain", description: "Connect Gmail and get each mail read for you: a summary, tasks, reminders and a reply draft. 0.08 credits a mail, and you see the price first.", category: "Customer Service", alsoIn: ["Marketing & Sales"], toolType: ["Productivity", "AI & Automation", "Communication"], source: "featured", isLive: true, dedicatedRoute: "/mail-brain", placements: ["home-new", "home-strip"] },
];
