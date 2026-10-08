import type { Family, Product } from "./types";

// Copy for each product's promotional page (/make/:productId). Written per family, then
// personalised with the product's own name, so all 104 pages read as their own page.
interface FamilyPromo {
  eyebrow: string;
  features: { icon: string; title: string; text: string }[];
  steps: [string, string][];
  faqs: [string, string][];
  audience: string;
}

const PERSONAL_FAQ: [string, string][] = [
  ["Do they need to install an app?", "No. It opens in any phone browser straight from WhatsApp, Instagram or SMS."],
  ["Can I change it after sending?", "Yes. Edit it any time from My Pages. The link stays the same and updates are free."],
  ["Who can see it?", "Only people you send the link to. Personal pages are hidden from Google and other search engines."],
];
const BUSINESS_FAQ: [string, string][] = [
  ["Do I need a domain or hosting?", "No. Your page is hosted for a year on its own ezyourlife.com link, with a free QR code."],
  ["How do customers reach me?", "Every button opens WhatsApp or the phone dialler with your number, and enquiries are saved in My Pages."],
  ["Will it show on Google?", "Yes. Business pages are search-friendly, with your name, area and services in the page details."],
  ["Can I update prices or timings later?", "Yes, as often as you like. Changes go live on the same link and are free."],
];

const P: Record<Family, FamilyPromo> = {
  celebration: {
    eyebrow: "Personal surprise page",
    audience: "for someone special",
    features: [
      { icon: "🎁", title: "A real surprise", text: "They tap a gift box to open it, with confetti and a reveal made for the moment." },
      { icon: "📸", title: "Your photos and words", text: "Add memories, a heartfelt message and their name in big, beautiful type." },
      { icon: "🎵", title: "Music and motion", text: "A soft tune and gentle animations make it feel like a gift, not a link." },
      { icon: "💬", title: "Made for WhatsApp", text: "Send it in one tap. They can reply to you on WhatsApp straight from the page." },
    ],
    steps: [["Pick a style", "Choose the look that fits them."], ["Add your touch", "Their name, your message, a few photos."], ["Send the link", "Pay once and share it on WhatsApp in seconds."]],
    faqs: PERSONAL_FAQ,
  },
  festival: {
    eyebrow: "Festival greeting",
    audience: "for family, friends and customers",
    features: [
      { icon: "✨", title: "Festive design", text: "Colours, motifs and animation made for the festival, ready in a minute." },
      { icon: "✍️", title: "Your message, your name", text: "Write your own wishes or start from a warm ready-made line." },
      { icon: "📤", title: "Send to everyone", text: "One link for every group and contact, plus a Status-sized image." },
      { icon: "💸", title: "Costs less than a sweet box", text: "A beautiful greeting for the price of a cup of tea." },
    ],
    steps: [["Pick a design", "Each one is made for the festival."], ["Add your wishes", "Your name and a short message."], ["Share everywhere", "WhatsApp, Status, Instagram and SMS."]],
    faqs: PERSONAL_FAQ,
  },
  event: {
    eyebrow: "Digital invitation",
    audience: "for your guests",
    features: [
      { icon: "📅", title: "Every detail in one place", text: "Date, time, venue, schedule and dress code, beautifully laid out." },
      { icon: "📍", title: "Map and calendar", text: "Guests get directions in one tap and can add the date to their calendar." },
      { icon: "✅", title: "RSVPs on WhatsApp", text: "Guests reply with a tap, and every RSVP is saved for you in My Pages." },
      { icon: "🔁", title: "Change plans freely", text: "Update a time or venue and every guest sees it on the same link." },
    ],
    steps: [["Pick a theme", "Traditional, modern or minimal."], ["Add the details", "Hosts, date, venue and schedule."], ["Invite everyone", "Share the link and track RSVPs."]],
    faqs: [["How do guests RSVP?", "They tap RSVP on the invitation, enter their name and number, and it reaches you on WhatsApp and in My Pages."], ...PERSONAL_FAQ.slice(0, 2), ["Who can see it?", "Only people with the link. Invitations are hidden from search engines."]],
  },
  business: {
    eyebrow: "Website for your business",
    audience: "for your customers",
    features: [
      { icon: "📱", title: "A real website in minutes", text: "Services, prices, photos, reviews, timings and location, built for phones." },
      { icon: "💬", title: "Enquiries on WhatsApp", text: "Call, WhatsApp and directions buttons stay on screen, and every lead is saved." },
      { icon: "🔎", title: "Found on Google", text: "Search-friendly page details with your name, area and services." },
      { icon: "🔳", title: "QR code included", text: "Print it on your counter, flyers and visiting cards." },
    ],
    steps: [["Pick a design", "Made for your kind of business."], ["Add your details", "Services, prices, photos and timings."], ["Go live", "Your own link and QR code, hosted for a year."]],
    faqs: BUSINESS_FAQ,
  },
  menu: {
    eyebrow: "QR menu and catalogue",
    audience: "for your customers",
    features: [
      { icon: "📋", title: "Your full list, tidy", text: "Sections, prices, photos, veg and bestseller tags, easy to scroll." },
      { icon: "🛒", title: "Orders on WhatsApp", text: "Customers pick items and send the order to your WhatsApp in one tap." },
      { icon: "🔳", title: "Table and counter QR", text: "Download a print-ready QR poster for tables, counters and packaging." },
      { icon: "✏️", title: "Change prices anytime", text: "No reprinting. Update an item and the QR shows it instantly." },
    ],
    steps: [["Pick a style", "Restaurant, cafe, shop or catalogue."], ["Add your items", "Names, prices and photos."], ["Print the QR", "Customers scan, browse and order."]],
    faqs: [["Can customers order from it?", "Yes. They add items to a list and send it to your WhatsApp with their name and number."], ...BUSINESS_FAQ.slice(0, 1), ...BUSINESS_FAQ.slice(3)],
  },
  profile: {
    eyebrow: "Personal profile page",
    audience: "for clients, recruiters and contacts",
    features: [
      { icon: "🪪", title: "Look professional", text: "Your photo, title, skills and work, on a clean page with your name." },
      { icon: "📇", title: "Save contact in one tap", text: "People save you to their phone contacts straight from the page." },
      { icon: "🔗", title: "All your links", text: "LinkedIn, Instagram, portfolio, email and WhatsApp in one place." },
      { icon: "🔳", title: "QR for events", text: "Share at meetings and events by letting people scan your QR." },
    ],
    steps: [["Pick a layout", "Card, resume or portfolio."], ["Add your details", "About you, your work and links."], ["Share it", "One link for your bio, email and WhatsApp."]],
    faqs: [["Is it better than a PDF?", "It opens instantly on any phone, always shows your latest details, and lets people contact you in one tap."], ...BUSINESS_FAQ.slice(0, 1), ["Will it show on Google?", "Yes. Profile pages can be found by your name, which helps clients and recruiters find you."]],
  },
};

export function promoFor(p: Product) {
  const f = P[p.family];
  return { ...f, headline: p.name, pitch: p.description || p.tagline };
}
