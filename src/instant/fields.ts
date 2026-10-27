import type { Field, Step, SuggestionSet } from "./types";

// Field building blocks shared by the product definitions. Products relabel them so the form
// speaks the product's language ("Membership plans" for a gym, "Services" for a salon).
export const F = {
  text: (id: string, label: string, o: Partial<Field> = {}): Field => ({ id, label, type: "text", max: 60, ...o }),
  area: (id: string, label: string, o: Partial<Field> = {}): Field => ({ id, label, type: "textarea", max: 800, ...o }),
  phone: (id: string, label: string, o: Partial<Field> = {}): Field => ({ id, label, type: "phone", placeholder: "10-digit mobile number", ...o }),
  email: (id: string, label: string, o: Partial<Field> = {}): Field => ({ id, label, type: "email", ...o }),
  url: (id: string, label: string, o: Partial<Field> = {}): Field => ({ id, label, type: "url", placeholder: "https://", ...o }),
  date: (id: string, label: string, o: Partial<Field> = {}): Field => ({ id, label, type: "date", ...o }),
  time: (id: string, label: string, o: Partial<Field> = {}): Field => ({ id, label, type: "time", ...o }),
  num: (id: string, label: string, o: Partial<Field> = {}): Field => ({ id, label, type: "number", ...o }),
  select: (id: string, label: string, options: string[], o: Partial<Field> = {}): Field => ({ id, label, type: "select", options, ...o }),
  chips: (id: string, label: string, options: string[], o: Partial<Field> = {}): Field => ({ id, label, type: "chips", options, ...o }),
  days: (id: string, label: string): Field => ({ id, label, type: "days" }),
  photo: (id: string, label: string, o: Partial<Field> = {}): Field => ({ id, label, type: "photo", ...o }),
  gallery: (id: string, label: string, max = 8, o: Partial<Field> = {}): Field => ({ id, label, type: "gallery", max, ...o }),
  list: (id: string, label: string, itemLabel: string, item: Field[], max = 12, o: Partial<Field> = {}): Field => ({ id, label, type: "list", itemLabel, item, max, ...o }),
  toggle: (id: string, label: string, o: Partial<Field> = {}): Field => ({ id, label, type: "toggle", ...o }),
};

export interface CelebrationLabels {
  recipient?: string; sender?: string; date?: string; age?: boolean; ageLabel?: string; messageSuggestions?: string[]; extra?: Field[];
  /** Message lines grouped by recipient and language; shows a picker instead of the plain list. */
  messageSets?: SuggestionSet[];
  /** Greeting lines the card can open with; the first is the card's own default. Shows quick picks under a "Greeting line" box. */
  headlines?: string[];
}
export function celebrationSteps(l: CelebrationLabels): Step[] {
  return [
    {
      title: "Who's it for?",
      fields: [
        F.text("recipient", l.recipient ?? "Their name", { required: true, max: 24, placeholder: "e.g. Priya" }),
        F.text("sender", l.sender ?? "Your name", { required: true, max: 24, placeholder: "e.g. Rahul" }),
        ...(l.headlines?.length ? [F.text("headline", "Greeting line (optional)", { max: 28, placeholder: l.headlines[0], options: l.headlines, help: "The big words at the top. Pick one or write your own." })] : []),
        ...(l.date ? [F.date("date", l.date)] : []),
        ...(l.age ? [F.num("age", l.ageLabel ?? "Turning (optional)", { max: 3 })] : []),
        ...(l.extra ?? []),
      ],
    },
    { title: "Your message", hint: "Write it the way you'd say it, or tap a line below to start. You can change every word.", fields: [F.area("message", "Message", { required: true, max: 700, suggestions: l.messageSuggestions, suggestionSets: l.messageSets })] },
    { title: "Photos together", hint: "Add a caption to each photo. Skip if you don't have any.", fields: [F.gallery("memories", "Photos", 8)] },
    { title: "Finishing touches", fields: [F.phone("sender_whatsapp", "Your WhatsApp, so they can reply (optional)"), F.toggle("music", "Play music when they open it")] },
  ];
}

export interface FestivalLabels { suggestions: string[]; to?: boolean }
export function festivalSteps(l: FestivalLabels): Step[] {
  return [
    {
      title: "Your greeting",
      fields: [
        F.text("sender", "From", { required: true, max: 40, placeholder: "e.g. The Sharma Family" }),
        ...(l.to !== false ? [F.text("recipient", "To (optional)", { max: 30, placeholder: "Leave empty to send to everyone" })] : []),
        F.area("message", "Message", { required: true, max: 400, suggestions: l.suggestions }),
      ],
    },
    { title: "Photos (optional)", hint: "A family photo makes it personal. The background picture sits behind the greeting; remove it for a plain card.", fields: [F.photo("photo", "Family photo"), F.photo("cover", "Background picture")] },
    { title: "Finishing touches", fields: [F.phone("sender_whatsapp", "Your WhatsApp, for replies (optional)"), F.toggle("music", "Play festive chimes when opened")] },
  ];
}

export interface EventLabels { hosts: string; hostsPlaceholder: string; tagline: string; scheduleTitle?: string; story?: string; dress?: boolean; rsvpLabel?: string }
export function eventSteps(l: EventLabels): Step[] {
  return [
    {
      title: "The event",
      fields: [
        F.text("hosts", l.hosts, { required: true, max: 50, placeholder: l.hostsPlaceholder }),
        F.text("tagline", "Headline", { max: 60, placeholder: l.tagline }),
        F.date("date", "Date", { required: true }),
        F.time("time", "Time"),
      ],
    },
    { title: "Venue", fields: [F.text("venue", "Venue name", { required: true, max: 60 }), F.area("address", "Address", { max: 200 }), F.url("maps_url", "Google Maps link (optional)")] },
    {
      title: l.scheduleTitle ?? "Programme",
      hint: "Add each function or session. Leave empty for a single event.",
      fields: [F.list("schedule", l.scheduleTitle ?? "Programme", "item", [F.text("name", "Name", { max: 40 }), F.date("date", "Date"), F.time("time", "Time"), F.text("place", "Where", { max: 50 })], 10)],
    },
    { title: "Details", fields: [F.area("story", l.story ?? "A few words for your guests", { max: 800 }), ...(l.dress ? [F.text("dress_code", "Dress code (optional)", { max: 50 })] : [])] },
    { title: "Photos", hint: "The cover is the big picture at the top. Guests can tap any photo to see it full screen.", fields: [F.photo("cover", "Cover photo"), F.gallery("gallery", "More photos", 8)] },
    { title: "RSVP", fields: [F.phone("rsvp_whatsapp", l.rsvpLabel ?? "WhatsApp for RSVPs", { required: true }), F.toggle("rsvp_form", "Also collect RSVPs in a list I can see")] },
  ];
}

export interface BusinessLabels {
  nameLabel: string; namePlaceholder: string;
  servicesTitle: string; serviceLabel: string; priceHint?: string;
  highlightsTitle: string; highlightOptions: string[];
  teamTitle?: string; leadTitle: string;
  /** Optional extra sections (schools, stays and shops use them). Each label turns its section on. */
  extras?: { notice?: string; stats?: boolean; brands?: string; how?: string; faq?: boolean };
}
export function businessSteps(l: BusinessLabels): Step[] {
  return [
    {
      title: "Basics",
      fields: [
        F.text("name", l.nameLabel, { required: true, max: 32, placeholder: l.namePlaceholder }),
        F.text("tagline", "One line about you", { max: 120 }),
        F.text("area", "Area", { max: 40, placeholder: "e.g. Vijay Nagar" }),
        F.text("city", "City", { max: 30, placeholder: "e.g. Indore" }),
        F.photo("logo", "Logo (optional)"),
      ],
    },
    {
      title: "Contact & hours",
      fields: [
        F.phone("phone", "Phone for calls", { required: true }),
        F.phone("whatsapp", "WhatsApp number", { required: true, help: "Visitors' messages come here, already written for them." }),
        F.area("address", "Address", { max: 200 }),
        F.url("maps_url", "Google Maps link (optional)"),
        F.days("open_days", "Open on"),
        F.time("opens", "Opens at"),
        F.time("closes", "Closes at"),
      ],
    },
    {
      title: l.servicesTitle,
      hint: "Each item gets its own WhatsApp button with a ready-written enquiry.",
      fields: [F.list("services", l.servicesTitle, l.serviceLabel, [F.text("name", "Name", { max: 40 }), F.text("price", "Price", { max: 20, placeholder: l.priceHint ?? "e.g. 999 or 'From ₹499'" }), F.area("note", "Details", { max: 160 })], 12)],
    },
    { title: l.highlightsTitle, fields: [F.chips("highlights", l.highlightsTitle, l.highlightOptions, { max: 12 })] },
    ...(l.teamTitle ? [{ title: l.teamTitle, fields: [F.list("team", l.teamTitle, "person", [F.text("name", "Name", { max: 40 }), F.text("role", "Role", { max: 50 }), F.photo("photo", "Photo")], 8)] }] : []),
    { title: "Photos", hint: "The cover is the big photo at the top. Sample photos are there so you can see the look: swap in your own.", fields: [F.photo("cover", "Cover photo"), F.gallery("gallery", "More photos", 10)] },
    ...(l.extras ? [extraStep(l.extras)] : []),
    {
      title: "Offer & reviews",
      fields: [
        F.text("offer", l.leadTitle, { max: 50, help: "The button visitors tap to leave their number." }),
        F.text("offer_note", "Offer details", { max: 120 }),
        F.text("rating", "Google rating (optional)", { max: 4, placeholder: "4.8" }),
        F.text("reviews_count", "Number of reviews", { max: 6 }),
        F.list("reviews", "Reviews", "review", [F.text("name", "Name", { max: 40 }), F.area("text", "What they said", { max: 300 })], 6),
      ],
    },
  ];
}

function extraStep(x: NonNullable<BusinessLabels["extras"]>): Step {
  return {
    title: "More sections",
    hint: "Each section shows only when it has something in it. Leave one empty to hide it.",
    fields: [
      ...(x.notice ? [F.text("notice", x.notice, { max: 90, help: "A ribbon at the very top of your page." })] : []),
      ...(x.stats ? [F.list("stats", "Numbers to show off", "number", [F.text("value", "Number", { max: 12, placeholder: "e.g. 1,200+" }), F.text("label", "What it counts", { max: 30, placeholder: "e.g. happy customers" })], 4)] : []),
      ...(x.brands ? [F.area("brands", x.brands, { max: 300, help: "Separate with commas." })] : []),
      ...(x.how ? [F.list("how", x.how, "step", [F.text("title", "Step", { max: 40 }), F.text("text", "Details", { max: 120 })], 4)] : []),
      ...(x.faq ? [F.list("faqs", "Questions customers ask", "question", [F.text("q", "Question", { max: 90 }), F.area("a", "Answer", { max: 300 })], 8)] : []),
    ],
  };
}

export interface MenuLabels { nameLabel: string; namePlaceholder: string; itemLabel: string; categories: string[]; diet: boolean; orderLabel: string }
export function menuSteps(l: MenuLabels): Step[] {
  return [
    { title: "Basics", fields: [F.text("name", l.nameLabel, { required: true, max: 32, placeholder: l.namePlaceholder }), F.text("tagline", "One line about you", { max: 100 }), F.text("area", "Area / city", { max: 50 }), F.photo("logo", "Logo (optional)"), F.photo("cover", "Cover photo (optional)")] },
    { title: "Contact & hours", fields: [F.phone("whatsapp", "WhatsApp for orders", { required: true }), F.phone("phone", "Phone for calls"), F.area("address", "Address", { max: 200 }), F.url("maps_url", "Google Maps link (optional)"), F.days("open_days", "Open on"), F.time("opens", "Opens at"), F.time("closes", "Closes at")] },
    {
      title: "Your " + l.itemLabel + "s",
      hint: "Group them with a category. Customers add items and send the order on WhatsApp.",
      fields: [F.list("items", "Items", l.itemLabel, [
        F.select("category", "Category", l.categories),
        F.text("name", "Name", { max: 40 }),
        F.text("price", "Price", { max: 12, placeholder: "e.g. 240" }),
        F.text("desc", "Description", { max: 100 }),
        ...(l.diet ? [F.select("diet", "Type", ["Veg", "Non-veg", "Egg", "Jain"])] : []),
        F.photo("photo", "Photo (optional)"),
      ], 60)],
    },
    { title: "Ordering", fields: [F.text("order_note", l.orderLabel, { max: 100, placeholder: "e.g. Free delivery above ₹300 within 3 km" })] },
  ];
}

export interface ProfileLabels { titleLabel: string; titlePlaceholder: string; expTitle?: string; workTitle?: string; skillsTitle?: string; company?: boolean }
export function profileSteps(l: ProfileLabels): Step[] {
  return [
    { title: "About you", fields: [F.text("name", "Full name", { required: true, max: 40 }), F.text("title", l.titleLabel, { max: 60, placeholder: l.titlePlaceholder }), ...(l.company ? [F.text("company", "Company", { max: 40 })] : []), F.text("location", "City", { max: 40 }), F.photo("photo", "Your photo"), F.area("about", "About", { max: 600 })] },
    { title: "Contact & links", fields: [F.phone("whatsapp", "WhatsApp"), F.phone("phone", "Phone"), F.email("email", "Email"), F.list("links", "Links", "link", [F.text("label", "Label", { max: 30, placeholder: "LinkedIn" }), F.url("url", "Link")], 10)] },
    ...(l.expTitle ? [{ title: l.expTitle, fields: [F.list("experience", l.expTitle, "entry", [F.text("role", "Role / degree", { max: 50 }), F.text("org", "Organisation", { max: 50 }), F.text("period", "When", { max: 25, placeholder: "2022 – now" }), F.area("note", "Details", { max: 240 })], 10)] }] : []),
    ...(l.skillsTitle ? [{ title: l.skillsTitle, fields: [F.text("skills", l.skillsTitle, { max: 300, help: "Separate with commas." })] }] : []),
    ...(l.workTitle ? [{ title: l.workTitle, fields: [F.list("projects", l.workTitle, "item", [F.text("title", "Title", { max: 50 }), F.area("note", "Details", { max: 200 }), F.url("url", "Link (optional)"), F.photo("photo", "Image (optional)")], 12)] }] : []),
  ];
}
