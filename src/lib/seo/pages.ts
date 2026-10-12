// What search engines see for each fixed page of the site: title, description and a short readable text.
//
// One list, read in three places, so they always agree:
// - the page itself sets its title and description from here (seoFor),
// - the build writes a static HTML page for each entry (scripts/prerender-pages.mjs), and lists it in the sitemap,
// - a signed-in-only page shows this text to signed-out visitors instead of bouncing them to /auth (ProtectedRoute).
//
// Adding a public page: add one entry here and use seoFor() on the page. App pages (/tool/<id>), the
// "AI tool for" and "AI for" pages and /make/<id> pages are generated from their own data and need nothing here.
// "{count}" is replaced with the live app count ("240+"). Internal labels for apps never go in this text.

export interface SitePage {
  path: string;
  /** Under ~60 characters shows in full on Google. Must be unique. */
  title: string;
  /** About 120 to 160 characters. Must be unique. */
  description: string;
  h1: string;
  /** Plain sentences for the static page and the signed-out intro. */
  text: string[];
  /** Only signed-in members can use the page; signed-out visitors see the text and a sign-in button. */
  signedIn?: boolean;
  /** Links shown on the static page, as [label, path]. */
  links?: [string, string][];
}

const MAIN_LINKS: [string, string][] = [
  ["Business apps", "/ai-apps"],
  ["Websites", "/websites"],
  ["Cards and invites", "/cards"],
  ["Prices and credits", "/credits"],
  ["Find apps by business type or job", "/explore"],
];

export const SITE_PAGES: SitePage[] = [
  {
    path: "/",
    title: "EZYOURLIFE: {count} AI apps, websites and cards for business",
    description: "Business apps, websites and cards for small businesses in India. {count} AI apps for bills, customers, staff and photos. Pay only for results, 100 free credits.",
    h1: "Run your whole business from one place",
    text: [
      "EZYOURLIFE is an app store for small businesses in India. {count} AI apps make bills, letters, posts, photos and plans in your browser, with nothing to install.",
      "You pay in credits, and only when an app gives you a result. New accounts start with 100 free credits, and credit packs start at ₹10.",
      "You can also make a business website, a QR menu, a digital visiting card or a wedding invitation, pay once, and share one link on WhatsApp.",
    ],
    links: MAIN_LINKS,
  },
  {
    path: "/ai-apps",
    title: "{count} AI apps for small business, no sign-up to browse",
    description: "Browse {count} AI apps for bills, customers, staff, photos and content. Try any app in your browser and pay only for results. 100 free credits to start.",
    h1: "Business apps",
    text: [
      "Every app on EZYOURLIFE, sorted by what you need done: run your business, photos and content, and smart helpers.",
      "Open any app without signing up to see what it does. Sign in when you are ready to use it.",
    ],
    links: MAIN_LINKS,
  },
  {
    path: "/explore",
    title: "Find AI apps by business type or job | EZYOURLIFE",
    description: "Pick your type of business or the job you need done, and see the EZYOURLIFE apps that fit. Pay only for results, credit packs from ₹10.",
    h1: "Find apps for your work",
    text: ["Pick your type of business or the job you need done. We show the apps that fit."],
    links: MAIN_LINKS,
  },
  {
    path: "/credits",
    title: "Prices and credits: pay only for what you use | EZYOURLIFE",
    description: "EZYOURLIFE apps use credits only when they give you a result. Packs from ₹10, no monthly plan, and 100 free credits to start. Failed runs are never charged.",
    h1: "Pay only for what you use",
    text: [
      "Apps are paid with credits. Buy a pack from ₹10, and an app uses its credits only when it gives you a result.",
      "New accounts get 100 free credits. There is no monthly plan. Websites and cards are paid once, on their own page.",
    ],
    links: MAIN_LINKS,
  },
  {
    path: "/about",
    title: "About EZYOURLIFE: the AI app store for small business",
    description: "What is EZYOURLIFE? An AI app store with {count} live apps for bills, customers, staff, photos and content, built in India. Meet the founders and read our mission.",
    h1: "AI shouldn't feel complicated. It should feel useful.",
    text: [
      "EZYOURLIFE puts {count} AI apps in one place, so a shop owner, a freelancer or a student can get real work done without learning a new tool for every job.",
      "Every app runs in your browser. You pay only for results. Write to us at support@ezyourlife.com.",
    ],
    links: MAIN_LINKS,
  },
  {
    path: "/websites",
    title: "Business websites, QR menus and visiting cards | EZYOURLIFE",
    description: "Pick a ready-made website for your gym, salon, clinic, shop or kitchen. Add your details, see it live, pay once and share one link. QR menus and visiting cards too.",
    h1: "Make a website",
    text: [
      "A website stays online. You get one link to put on WhatsApp, Google and your shop board, with call and WhatsApp buttons built in.",
      "Pick a design, add your details, see it live, and pay once.",
    ],
    links: MAIN_LINKS,
  },
  {
    path: "/cards",
    title: "Wedding invitations and festival cards online",
    description: "Digital invitations, festival greetings and birthday surprises with music, photos and RSVPs. Make one in minutes, pay once and share it on WhatsApp.",
    h1: "Send a card or invite",
    text: ["A card is made for one moment. Add names, a photo and your message, pay once, and send the link on WhatsApp."],
    links: MAIN_LINKS,
  },
  {
    path: "/create",
    title: "Websites, cards and invites made in minutes | EZYOURLIFE",
    description: "Ready-made business websites, QR menus, wedding invitations and birthday surprises. Preview it live, pay once and share one link on WhatsApp.",
    h1: "Websites, cards and invites",
    text: ["Ready-made designs for your business and your celebrations. Add your details, see it live, pay once and share one link."],
    links: MAIN_LINKS,
  },
  {
    path: "/kit",
    title: "Your business online for ₹999 | EZYOURLIFE",
    description: "A published website, a digital visiting card and 3,000 credits for business apps. One payment of ₹999, no subscription.",
    h1: "Everything for ₹999",
    text: ["One payment of ₹999 gets your business a published website, a digital visiting card and 3,000 credits for business apps. No subscription."],
    links: MAIN_LINKS,
  },
  {
    path: "/refund-policy",
    title: "Cancellation and refund policy | EZYOURLIFE",
    description: "Read the EZYOURLIFE cancellation and refund policy: how to ask for a refund, when refunds are given and how long they take.",
    h1: "Cancellation and refund policy",
    text: ["How cancellations and refunds work on EZYOURLIFE, and how long a refund takes to reach you."],
    links: [["Contact support", "/about#contact"]],
  },
  {
    path: "/startup-analyser",
    title: "AI Startup Analyser: competitors, numbers and team | EZYOURLIFE",
    description: "Describe a startup and get competitor analysis, financial projections, a team assessment and an investor-ready report, made by AI in minutes.",
    h1: "AI Startup Analyser",
    text: [
      "Describe a startup idea or company and get a full report: competitors, market, financial projections, team strengths and risks.",
      "Ask follow-up questions in chat, and download the report to share with partners or investors.",
    ],
    signedIn: true,
  },
  {
    path: "/notebook",
    title: "Speedy Notebook: AI writing with shortcuts | EZYOURLIFE",
    description: "Write faster with Speedy Notebook: shortcuts that expand as you type, smart autocomplete, speech-to-text and AI help to analyse your documents.",
    h1: "Speedy Notebook",
    text: [
      "A notebook that writes with you. Type a short shortcut and it expands into a full line, speak to type, and let AI complete or check your text.",
      "Your shortcuts also work in the EZYOURLIFE browser extension and on your phone.",
    ],
    signedIn: true,
  },
  {
    path: "/promptmaster",
    title: "Prompt Master: build better AI prompts | EZYOURLIFE",
    description: "Build clear AI prompts for images, videos, stories and text. Pick subject, style, lighting and motion, then save your favourites as shortcuts.",
    h1: "Prompt Master",
    text: ["Build a clear prompt for any AI tool by picking the subject, style, lighting, camera and motion. Save the prompts you like as shortcuts."],
    signedIn: true,
  },
  {
    path: "/meet-nudge",
    title: "Meet Nudge: scan business cards at events | EZYOURLIFE",
    description: "Capture contacts at events: scan business cards with AI, keep every contact in one list, and follow up on time. Made for networking and trade fairs.",
    h1: "Meet Nudge",
    text: ["Scan a business card and the contact is saved with name, number and company. Keep every event's contacts in one list and get a nudge to follow up."],
    signedIn: true,
  },
  {
    path: "/virasat",
    title: "Virasat: turn your life stories into a keepsake book",
    description: "Record or write your life stories and turn them into a personalised keepsake book your children and grandchildren will treasure.",
    h1: "Virasat",
    text: ["Speak or write the stories of your life, one at a time. Virasat turns them into a beautiful keepsake book for your family."],
    signedIn: true,
  },
  {
    path: "/tools/productvision-360",
    title: "ProductVision 360: product photos from every angle",
    description: "Upload one product photo and get a clean set of product angles with new backgrounds, ready for your shop, Amazon or Instagram. Failed angles are free.",
    h1: "Catalogue-ready product angles in one click",
    text: ["Upload a single product photo. ProductVision 360 makes a clean, multi-angle product set, swaps backgrounds, and gives you a pack ready to publish."],
    signedIn: true,
  },
  {
    path: "/get-extension",
    title: "EZYOURLIFE browser extension for Chrome, Edge and Firefox",
    description: "Use your EZYOURLIFE shortcuts on any website. The browser extension works in Chrome, Firefox, Brave and Edge, including ChatGPT and Gemini.",
    h1: "Get the browser extension",
    text: ["Install the EZYOURLIFE extension and your shortcuts expand on any website you type in, including ChatGPT, Gemini and email."],
    signedIn: true,
  },
  {
    path: "/mobile-shortcuts",
    title: "Use your EZYOURLIFE shortcuts on your phone",
    description: "Set up your EZYOURLIFE text shortcuts on Android and iPhone so they expand in WhatsApp, email and every app you type in.",
    h1: "Shortcuts on mobile",
    text: ["Use the shortcuts you made in Speedy Notebook on your phone, in WhatsApp, email and every app."],
    signedIn: true,
  },
];

const BY_PATH = new Map(SITE_PAGES.map((p) => [p.path, p]));

export const sitePage = (path: string): SitePage | undefined => BY_PATH.get(path);

export const withCount = (s: string, count: string) => s.split("{count}").join(count);

/** Title and description for a page, ready for <PageSeo> or <SEOHead>. */
export function seoFor(path: string, count: string) {
  const p = BY_PATH.get(path);
  if (!p) throw new Error(`No search text for ${path}; add it to src/lib/seo/pages.ts`);
  const title = withCount(p.title, count);
  return { path, title: title.includes("EZYOURLIFE") ? title : `${title} | EZYOURLIFE`, description: withCount(p.description, count) };
}

/** Words that are only for the team and must never appear in public text (Abhi, 12 Oct 2026). */
export const INTERNAL_WORDS = /\b(flagship|complex|hero)\b/i;

/** "AI tool for" and "AI for" pages with fewer matching apps than this are kept out of search. */
export const MIN_LANDING_APPS = 3;
