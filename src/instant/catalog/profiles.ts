import type { Content, Product, Theme } from "../types";
import { profileSteps, type ProfileLabels } from "../fields";
import { ten } from "../themes";
import { PROFILE_STOCK, shot, stockPhoto } from "../stock";

interface Def {
  id: string; name: string; glyph: string; price: number; themes: Theme[]; tagline: string; popular?: boolean;
  labels: ProfileLabels; layout: "resume" | "portfolio" | "links" | "card";
  cta: string; wa: string;
  sample: Content;
}

const make = (d: Def): Product => ({
  id: d.id, family: "profile", category: "profiles", name: d.name, glyph: d.glyph, price: d.price, popular: d.popular, tagline: d.tagline,
  description: `${d.tagline} One link for your bio, WhatsApp and email signature, with a QR for your visiting card.`,
  themes: d.themes, steps: profileSteps(d.labels), titleField: "name",
  sample: withStock(d.id, { whatsapp: "9000000000", phone: "9000000000", ...d.sample }),
  whatsapp: { contact: d.wa }, share: "👋 Here's my page, {name}:\n{link}",
  opts: { layout: d.layout, cta: d.cta, expTitle: d.labels.expTitle, workTitle: d.labels.workTitle, skillsTitle: d.labels.skillsTitle }, indexable: true,
});

/** Sample portrait and work pictures, so the preview looks like a real person's page. */
function withStock(id: string, c: Content): Content {
  const st = PROFILE_STOCK[id];
  if (!st) return c;
  const work = st.work ?? [];
  const projects = Array.isArray(c.projects) ? c.projects.map((p: Content, i: number) => (work[i] ? { ...p, photo: stockPhoto(shot(work[i]), 900) } : p)) : c.projects;
  return { ...c, photo: stockPhoto(shot(st.photo), 900), ...(projects ? { projects } : {}) };
}

const ex = (role: string, org: string, period: string, note = "") => ({ role, org, period, note });
const pj = (title: string, note: string, url = "") => ({ title, note, url });
const ln = (label: string, url: string) => ({ label, url });

export const PROFILES: Product[] = [
  make({ id: "digital-visiting-card", name: "Digital Visiting Card", glyph: "📇", price: 99, popular: true, themes: ten("people", "navy", "ink", "paper", "luxury"), layout: "card",
    tagline: "Your visiting card as a link: save contact, WhatsApp, call, socials.",
    labels: { titleLabel: "Designation", titlePlaceholder: "Founder & CEO", company: true },
    cta: "Save contact", wa: "Hi {name}, we just met. This is ",
    sample: { name: "Ananya Rao", title: "Founder & CEO", company: "Kraft Corner", location: "Indore", email: "ananya@example.com", about: "Building a home-decor brand for Indian artisans. Always happy to talk about craft, retail and D2C.", links: [ln("LinkedIn", "linkedin.com/in/ananya"), ln("Instagram", "instagram.com/kraftcorner"), ln("Website", "kraftcorner.in")] } }),
  make({ id: "resume", name: "Online Resume / CV", glyph: "📄", price: 99, popular: true, themes: ten("people", "paper", "ink", "navy"), layout: "resume",
    tagline: "A clean, shareable CV recruiters can open on their phone.",
    labels: { titleLabel: "Headline", titlePlaceholder: "Product Designer · 5 years", expTitle: "Experience & education", skillsTitle: "Skills" },
    cta: "Contact me", wa: "Hi {name}, I saw your resume and would like to talk about an opportunity.",
    sample: { name: "Aditya Sharma", title: "Software Engineer · Backend & Cloud", location: "Bengaluru", email: "aditya@example.com", about: "Backend engineer who likes boring, reliable systems. 4 years building payments and logistics platforms in Go and Python.", experience: [ex("Software Engineer II", "Razorpay", "2023 – now", "Payments reconciliation, 40M txns/day"), ex("Software Engineer", "Delhivery", "2021 – 2023", "Route optimisation services"), ex("B.Tech, Computer Science", "VIT Vellore", "2017 – 2021", "CGPA 8.9")], skills: "Go, Python, PostgreSQL, Kafka, AWS, Kubernetes, System design", links: [ln("GitHub", "github.com/aditya"), ln("LinkedIn", "linkedin.com/in/aditya")] } }),
  make({ id: "portfolio", name: "Portfolio", glyph: "🖼️", price: 149, themes: ten("makers", "studio", "paper", "creator"), layout: "portfolio",
    tagline: "Show your best work with images, links and a hire-me button.",
    labels: { titleLabel: "What you do", titlePlaceholder: "Brand & UI Designer", workTitle: "Selected work", skillsTitle: "Services" },
    cta: "Hire me", wa: "Hi {name}, I saw your portfolio and have a project in mind.",
    sample: { name: "Ritika Jain", title: "Brand & UI Designer", location: "Indore · Remote", email: "ritika@example.com", about: "I design brands and apps for small businesses that want to look as good as they are.", projects: [pj("Brew Lane Cafe", "Brand identity, menu and packaging"), pj("FinBuddy app", "Onboarding redesign, +32% sign-ups"), pj("Kraft Corner", "E-commerce site and photography")], skills: "Branding, UI design, Packaging, Social media kits", links: [ln("Behance", "behance.net/ritika"), ln("Instagram", "instagram.com/ritika.designs")] } }),
  make({ id: "freelancer-profile", name: "Freelancer Profile", glyph: "🧑‍💻", price: 99, themes: ten("makers", "ink", "paper", "creator"), layout: "portfolio",
    tagline: "Your services, past clients and a one-tap WhatsApp to hire you.",
    labels: { titleLabel: "What you do", titlePlaceholder: "Video editor & motion designer", workTitle: "Recent projects", skillsTitle: "Services", expTitle: "Clients" },
    cta: "Hire me", wa: "Hi {name}, I found your profile and have a project for you.",
    sample: { name: "Kabir Khan", title: "Video Editor & Motion Designer", location: "Mumbai · Remote", email: "kabir@example.com", about: "Reels, YouTube and brand films that people watch to the end. 200+ videos delivered for creators and D2C brands.", projects: [pj("Creator channel (1.2M subs)", "Weekly long-form edits"), pj("D2C skincare launch", "6 ads, 3.1x ROAS")], skills: "Reels, YouTube editing, Motion graphics, Colour grading", experience: [ex("Ongoing", "3 YouTube creators", "2024 – now")], links: [ln("YouTube showreel", "youtube.com/@kabir")] } }),
  make({ id: "student-profile", name: "Student Profile", glyph: "🎒", price: 49, themes: ten("young", "paper", "lilac", "ink"), layout: "resume",
    tagline: "For internships and college applications.",
    labels: { titleLabel: "Course & year", titlePlaceholder: "B.Com, 2nd year", expTitle: "Education & activities", workTitle: "Projects", skillsTitle: "Skills" },
    cta: "Contact me", wa: "Hi {name}, I saw your profile and would like to talk about an internship.",
    sample: { name: "Sneha Patel", title: "BBA, 3rd year · Marketing", location: "Indore", email: "sneha@example.com", about: "Marketing student who has run Instagram for two college fests. Looking for a summer internship in digital marketing.", experience: [ex("BBA (Marketing)", "IPS Academy", "2024 – 2027", "CGPA 8.4"), ex("Social media head", "Zephyr College Fest", "2025", "Grew followers 3x in 6 weeks")], projects: [pj("Cafe social media plan", "Content calendar and 12 posts")], skills: "Canva, Instagram, Excel, Public speaking", links: [ln("LinkedIn", "linkedin.com/in/sneha")] } }),
  make({ id: "creator-bio-link", name: "Creator Bio Link", glyph: "🔗", price: 49, popular: true, themes: ten("young", "creator", "ink", "fun"), layout: "links",
    tagline: "One link for your Instagram bio: links, collabs, WhatsApp.",
    labels: { titleLabel: "Your niche", titlePlaceholder: "Food creator · Indore" },
    cta: "Collab with me", wa: "Hi {name}, I'd love to collaborate with you!",
    sample: { name: "Foodie Indori", title: "Food creator · 240K on Instagram", location: "Indore", email: "collabs@example.com", about: "Finding the best poha, jalebi and everything in between.", links: [ln("Instagram", "instagram.com/foodieindori"), ln("YouTube", "youtube.com/@foodieindori"), ln("Sarafa food guide (PDF)", "foodieindori.in/guide"), ln("Collab rate card", "foodieindori.in/rates")] } }),
  make({ id: "photographer-portfolio", name: "Photographer Portfolio", glyph: "📸", price: 149, themes: ten("makers", "studio", "luxury", "paper"), layout: "portfolio",
    tagline: "Full-bleed photos, packages and date enquiries.",
    labels: { titleLabel: "What you shoot", titlePlaceholder: "Wedding & portrait photographer", workTitle: "Galleries", skillsTitle: "Shoots I do" },
    cta: "Check my date", wa: "Hi {name}, I loved your work. Are you available on my date?",
    sample: { name: "Frames by Kabir", title: "Wedding & Portrait Photographer", location: "Indore · Travels", email: "hello@example.com", about: "Candid weddings and honest portraits. I'd rather capture a real laugh than a perfect pose.", projects: [pj("Ritika & Aman", "Udaipur, 2026"), pj("Maternity · Neha", "Studio session")], skills: "Weddings, Pre-wedding, Maternity, Portraits", links: [ln("Instagram", "instagram.com/framesbykabir")] } }),
  make({ id: "designer-portfolio", name: "Designer Portfolio", glyph: "🎨", price: 149, themes: ten("makers", "paper", "studio", "lilac"), layout: "portfolio",
    tagline: "Case studies with images and a clear hire-me button.",
    labels: { titleLabel: "Discipline", titlePlaceholder: "Product designer", workTitle: "Case studies", skillsTitle: "Tools & skills", expTitle: "Experience" },
    cta: "Hire me", wa: "Hi {name}, I saw your portfolio. Can we talk about a project?",
    sample: { name: "Ira Kapoor", title: "Product Designer", location: "Pune", email: "ira@example.com", about: "I make complicated fintech flows feel obvious.", projects: [pj("Loan application, redesigned", "Drop-off down 41%"), pj("Design system for a neobank", "120 components, 3 platforms")], experience: [ex("Senior Product Designer", "Fintech startup", "2023 – now")], skills: "Figma, Prototyping, Research, Design systems", links: [ln("Dribbble", "dribbble.com/ira")] } }),
  make({ id: "consultant-profile", name: "Consultant Profile", glyph: "🧭", price: 149, themes: ten("people", "navy", "paper", "pro"), layout: "resume",
    tagline: "Credentials, services and a book-a-call button.",
    labels: { titleLabel: "Expertise", titlePlaceholder: "Fundraising advisor for startups", expTitle: "Experience", skillsTitle: "How I help", company: true },
    cta: "Book a call", wa: "Hi {name}, I'd like to book a call about my business.",
    sample: { name: "Arjun Mehra", title: "Investment & Strategy Advisor", company: "Northstar Advisory", location: "Indore", email: "advisor@example.com", about: "I help founders raise capital and plan for growth. Former VP Investments at a GIFT City AIF.", experience: [ex("Partner", "Northstar Advisory", "2024 – now"), ex("VP, Investments", "Category III AIF, GIFT City", "2022 – 2024")], skills: "Fundraising, Financial models, Pitch decks, Strategic alliances", links: [ln("LinkedIn", "linkedin.com/in/example")] } }),
  make({ id: "speaker-profile", name: "Speaker Profile", glyph: "🎙️", price: 149, themes: ten("people", "ink", "navy", "creator"), layout: "portfolio",
    tagline: "Talks, topics and booking enquiries for event organisers.",
    labels: { titleLabel: "Speaker title", titlePlaceholder: "Keynote speaker on AI & small business", workTitle: "Talks", skillsTitle: "Topics", expTitle: "Where I've spoken" },
    cta: "Invite me to speak", wa: "Hi {name}, we'd like to invite you to speak at our event.",
    sample: { name: "Dr. Meera Iyer", title: "Keynote speaker on AI for small business", location: "Bengaluru", email: "speaking@example.com", about: "I help business owners understand AI without the jargon. 120+ talks across India.", projects: [pj("AI won't take your job. Your competitor will.", "Keynote, 40 min"), pj("Hands-on: AI for marketing", "Workshop, 2 hrs")], experience: [ex("TEDx", "Indore", "2025"), ex("Nasscom Product Conclave", "Bengaluru", "2024")], skills: "AI, MSMEs, Marketing, Productivity", links: [ln("Talk video", "youtube.com/@meera")] } }),
];
