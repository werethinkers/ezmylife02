// Seed phrases for programmatic "AI tool for X" landing pages.
// These drive sitemap entries and the /ai-tool-for/:query route.

export const USE_CASE_SEEDS = [
  "accounting","ad-copy","affiliate-marketing","amazon-listing","analytics","animation","app-development",
  "architecture","art","article-writing","astrology","audio-editing","audit","automation","b2b-sales",
  "background-removal","banking","blog-writing","book-writing","brainstorming","brand-design","budgeting",
  "business-plan","business-proposal","calendar","captions","case-study","catering","chatbot","checklist",
  "coding","cold-email","college-application","compliance","construction","consulting","content-calendar",
  "content-creation","content-strategy","contract","copywriting","cover-letter","customer-service",
  "customer-support","data-analysis","data-entry","data-visualization","debate","design","developer",
  "diet-plan","digital-marketing","dropshipping","ebook","ecommerce","editing","education","email",
  "email-marketing","engineering","entrepreneurs","essay-writing","etsy","event-planning","exam-prep",
  "facebook-ads","family-trees","fashion","finance","fitness","flashcards","flyer-design","food-blog",
  "freelancers","fundraising","game-design","gift-ideas","goal-setting","grade-school","grammar",
  "graphic-design","grocery-list","hashtags","health","hiring","homework","hospitality","hotel-management",
  "hr","ielts","image-editing","image-generation","insurance","instagram","interior-design","interview-prep",
  "inventory","invoice","journalism","kids","kindergarten","language-learning","law-firms","lawyers",
  "lead-generation","legal-research","lesson-planning","linkedin","logo-design","manufacturing","marketing",
  "math","mba","medical","meditation","meeting-notes","menu-design","mental-health","mind-mapping","mobile-app",
  "music","newsletter","nonprofits","note-taking","nursing","nutrition","office","online-business",
  "operations","outreach","painting","parenting","payroll","pdf","pharmacy","photography","photo-editing",
  "pitch-deck","podcast","portfolio","poster-design","powerpoint","presentation","pricing","product-description",
  "product-design","product-management","productivity","programming","project-management","proofreading",
  "psychology","public-speaking","purchase-order","python","quiz","quotes","real-estate","recipe",
  "recruiting","reels","report-writing","research","restaurant","resume","retail","sales","saas",
  "scheduling","school","scriptwriting","sem","seo","shopify","short-video","slides","small-business",
  "social-media","software-testing","spa","spanish","speaking","speech-writing","spreadsheet","startup",
  "stock-trading","storyboard","storytelling","students","study-plan","summarize","supply-chain","survey",
  "tax","teachers","teaching","testing","thesis","tiktok","trading","translation","travel","tutoring",
  "twitter","ui-design","ux-design","video-editing","video-script","virtual-assistant","wallpaper","web-design",
  "web-development","wedding-planning","whatsapp","wholesale","wordpress","worksheets","writing","yoga","youtube"
];

export const INDUSTRY_SEEDS = [
  "accounting","advertising","aerospace","agriculture","architecture","automotive","banking","beauty",
  "biotech","construction","consulting","ecommerce","education","energy","engineering","entertainment",
  "events","fashion","finance","fitness","food-and-beverage","gaming","government","healthcare",
  "hospitality","hr","insurance","interior-design","law","logistics","manufacturing","marketing",
  "media","music","nonprofits","pharmaceutical","photography","real-estate","recruiting","restaurants",
  "retail","saas","sales","schools","software","sports","startups","telecom","tourism","transportation",
  "travel","universities","wellness"
];

export function humanize(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

interface Matchable { name: string; description?: string | null; category?: string | null; tool_types?: string[] | null; toolType?: string[] | null }

/** Apps whose name, description or category has a word of the slug. Used by the pages and by the static pages the build writes. */
export function landingMatches<T extends Matchable>(slug: string, tools: T[]): T[] {
  const tokens = slug.toLowerCase().split("-").filter((t) => t.length > 2);
  // A word must start a word in the app's text ("art" finds "artwork", not "start"); plurals also find the singular.
  const words = (tokens.length ? tokens : [slug.toLowerCase()]).map((w) => (w.length > 4 ? w.replace(/s$/, "") : w));
  const res = words.map((w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  return tools.filter((t) => {
    const hay = [t.name, t.description, t.category, ...(t.tool_types ?? t.toolType ?? [])].join("\n").toLowerCase();
    return res.some((re) => re.test(hay));
  });
}

/** Title and description of an /ai-tool-for/<slug> page. Shared with the static page the build writes. */
export function useCaseSeo(slug: string, matches: number) {
  const human = humanize(slug);
  const low = human.toLowerCase();
  return {
    title: `AI tools for ${low}: apps that do the work | EZYOURLIFE`,
    description: `${matches ? `${matches} AI apps` : "AI apps"} for ${low} on EZYOURLIFE. Runs in your browser, pay only for results, credit packs from ₹10 and 100 free credits to start.`,
    keywords: `ai tool for ${low}, best ai for ${low}, ${low} ai app, ai app for ${low}`,
  };
}

/** Title and description of an /ai-for/<slug> page. */
export function industrySeo(slug: string) {
  const low = humanize(slug).toLowerCase();
  return {
    title: `AI apps for ${low} businesses | EZYOURLIFE`,
    description: `AI apps for ${low} businesses on EZYOURLIFE: bills, customers, staff and content. Runs in your browser, pay only for results, packs from ₹10, 100 free credits.`,
    keywords: `ai for ${low}, ai tools for ${low}, ${low} ai software, ${low} automation`,
  };
}
