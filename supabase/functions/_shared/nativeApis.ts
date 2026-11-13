// The older apps that have their own server function (not the shared ai-app), made runnable through the
// public API (and so the iPhone keyboard and Siri). Each entry says which function runs it, what it is
// charged as (the same charge ids and prices as on the website) and how to turn the API's boxes into that
// function's request. The API calls the function with the service key, which billed() treats as a trusted
// internal call, and charges the person itself around it (see `charged()` in api/index.ts).
// ProductVision 360 charges per angle inside its own function, so it is handed the person's id instead.
import type { ApiField } from "./apiCatalog.ts";

export interface NativeApp {
  /** Server function that does the work. */
  fn: string;
  /** What the run is charged as (a tool_pricing id). */
  charge: string;
  /** Price used only when tool_pricing has no row yet. */
  credits: number;
  isImage?: boolean;
  /** The function charges by itself (per item) and is given the person's id. */
  selfCharging?: boolean;
  mode: "form" | "image" | "images";
  intro: string;
  cta?: string;
  fields: ApiField[];
  build: (inputs: Record<string, string>) => Record<string, unknown>;
}

const list = (s: string | undefined) => (s ?? "").split(/[,\n]/).map((x) => x.trim()).filter(Boolean);
const num = (s: string | undefined, d: number, min: number, max: number) => {
  const n = Number(String(s ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.max(min, Math.min(max, Math.round(n))) : d;
};

export const NATIVE_APPS: Record<string, NativeApp> = {
  "social-post-generator": {
    fn: "content-generator", charge: "social-post-generator", credits: 2, mode: "form",
    intro: "A ready-to-post social media post for the platform you pick, with emojis and the right length.",
    fields: [
      { key: "topic", label: "What the post is about", type: "text", required: true, placeholder: "Diwali offer: 20% off all sarees" },
      { key: "platform", label: "Platform", type: "select", options: ["Instagram", "LinkedIn", "Facebook", "X (Twitter)", "WhatsApp status"], default: "Instagram" },
      { key: "tone", label: "Tone", type: "select", options: ["Friendly", "Professional", "Funny", "Inspiring", "Urgent"], default: "Friendly" },
    ],
    build: (i) => {
      const platform = i.platform || "Instagram";
      const charLimit = /twitter|x \(/i.test(platform) ? 280 : /linkedin/i.test(platform) ? 3000 : 2200;
      return { type: "social-post", topic: i.topic, platform, tone: i.tone || "Friendly", charLimit };
    },
  },
  "caption-generator": {
    fn: "content-generator", charge: "caption-generator", credits: 2, mode: "form",
    intro: "Several caption options for a photo or post, in the style you want.",
    fields: [
      { key: "description", label: "What's in the photo or post", type: "text", required: true, placeholder: "New café opening in Vijay Nagar" },
      { key: "style", label: "Style", type: "select", options: ["Fun", "Professional", "Short", "Storytelling", "Hinglish"], default: "Fun" },
      { key: "count", label: "How many", type: "number", default: "5" },
      { key: "keywords", label: "Words to include", type: "text", placeholder: "coffee, Indore" },
    ],
    build: (i) => ({ type: "captions", description: i.description, style: i.style || "Fun", count: num(i.count, 5, 1, 10), keywords: list(i.keywords) }),
  },
  "hashtag-generator": {
    fn: "content-generator", charge: "hashtag-generator", credits: 2, mode: "form",
    intro: "A mix of popular and niche hashtags for your post.",
    fields: [
      { key: "topic", label: "Post topic", type: "text", required: true, placeholder: "Home bakery in Indore" },
      { key: "count", label: "How many", type: "number", default: "20" },
    ],
    build: (i) => ({ type: "hashtags", topic: i.topic, count: num(i.count, 20, 5, 30) }),
  },
  "content-idea-generator": {
    fn: "content-generator", charge: "content-idea-generator", credits: 2, mode: "form",
    intro: "Fresh content ideas for your niche, each with a hook and the best time to post.",
    fields: [
      { key: "niche", label: "Your niche", type: "text", required: true, placeholder: "Fitness for working women" },
      { key: "format", label: "Format", type: "select", options: ["Any", "Reel", "Carousel", "Story", "Video", "Blog"], default: "Any" },
      { key: "count", label: "How many", type: "number", default: "5" },
    ],
    build: (i) => ({ type: "content-ideas", niche: i.niche, format: i.format && i.format !== "Any" ? i.format : undefined, count: num(i.count, 5, 1, 15) }),
  },
  "video-script-writer": {
    fn: "content-generator", charge: "video-script-writer", credits: 2, mode: "form",
    intro: "A timed video script with hook, main points and call to action.",
    fields: [
      { key: "topic", label: "Video topic", type: "text", required: true, placeholder: "3 ways to save tax in 2026" },
      { key: "duration", label: "Length (seconds)", type: "number", default: "60" },
      { key: "style", label: "Style", type: "select", options: ["Educational", "Funny", "Storytelling", "Product demo", "Talking head"], default: "Educational" },
      { key: "keyPoints", label: "Key points", type: "text", placeholder: "80C, NPS, health insurance" },
    ],
    build: (i) => ({ type: "video-script", topic: i.topic, duration: num(i.duration, 60, 15, 600), style: i.style || "Educational", keyPoints: list(i.keyPoints) }),
  },
  "startup-analyser": {
    fn: "startup-analyser", charge: "startup-analyser-flash", credits: 10, mode: "form",
    intro: "A full investment analysis of a startup: market, team, model, risks and a verdict.",
    fields: [
      { key: "companyName", label: "Company", type: "text", required: true, placeholder: "Zepto" },
      { key: "companyWebsite", label: "Website", type: "text", placeholder: "zeptonow.com" },
      { key: "pitchDeckText", label: "Pitch or notes", type: "textarea", placeholder: "Paste the pitch, or a few lines about it" },
    ],
    build: (i) => ({ companyName: i.companyName, companyWebsite: i.companyWebsite ?? "", pitchDeckText: i.pitchDeckText ?? "" }),
  },
  "speedy-notebook": {
    fn: "notebook-ai", charge: "speedy-notebook", credits: 2, mode: "form",
    intro: "Ask anything and get a clear written answer, ready to paste.",
    fields: [{ key: "prompt", label: "What you want written", type: "textarea", required: true, placeholder: "A polite reminder to a client about an overdue payment" }],
    build: (i) => ({ action: "generate", prompt: i.prompt }),
  },
  "thumbnail-maker": {
    fn: "ai-app", charge: "thumbnail-maker-img", credits: 31, isImage: true, mode: "image",
    intro: "An eye-catching video thumbnail made by AI from your title.",
    fields: [
      { key: "prompt", label: "Video title or idea", type: "text", required: true, placeholder: "I tried 7 street foods in Indore" },
      { key: "style", label: "Style", type: "select", options: ["Bold", "Minimal", "Cinematic", "Cartoon", "Photo-real"], default: "Bold" },
    ],
    build: (i) => ({ tool_id: "thumbnail-maker", prompt: i.prompt, style: i.style || "Bold", aspect: "16:9" }),
  },
  "video-maker": {
    fn: "video-generator", charge: "video-keyframe", credits: 31, isImage: true, mode: "image",
    intro: "A preview frame for your video idea, made by AI.",
    fields: [{ key: "prompt", label: "Video idea", type: "text", required: true, placeholder: "Sunrise over Rajwada, slow pan" }],
    build: (i) => ({ prompt: i.prompt, duration: 5, aspectRatio: "16:9", resolution: "720p" }),
  },
  "productvision-360": {
    fn: "productvision-angles", charge: "productvision-angle", credits: 27, isImage: true, selfCharging: true, mode: "images",
    intro: "Studio photos of your product from new angles, made from one photo. Each angle is charged separately.",
    fields: [
      { key: "photo", label: "Product photo", type: "image", required: true, help: "Copy a product photo first, then tap here" },
      { key: "angles", label: "Angles", type: "select", options: ["Front-Right", "Front", "Right", "Back", "Left", "Front-Left", "All six"], default: "Front-Right" },
    ],
    build: (i) => {
      const photo = i.photo ?? "";
      const m = photo.match(/^data:([^;]+);base64,(.*)$/s);
      const angles = i.angles === "All six" ? undefined : [i.angles || "Front-Right"];
      return { imageBase64: m ? m[2] : photo, mimeType: m ? m[1] : "image/jpeg", angles };
    },
  },
};

/** A website app that runs in the browser, run on the server through ai-app with its AI spec (appSpecs/extras.ts). */
function aiDoc(id: string, intro: string, fields: ApiField[], charge = id): NativeApp {
  return { fn: "ai-app", charge, credits: 2, mode: "form", intro, fields, build: (inputs) => ({ tool_id: id, inputs }) };
}

Object.assign(NATIVE_APPS, {
  "tool-1": aiDoc("tool-1", "A GST tax invoice with every sum worked out, ready to send.", [
    { key: "Business", label: "Business name", type: "text", profile: "businessName" },
    { key: "Business GSTIN", label: "Your GSTIN", type: "text", profile: "gstin" },
    { key: "Business address", label: "Your address", type: "text", profile: "address" },
    { key: "Customer", label: "Customer", type: "text", required: true, placeholder: "Rahul Traders" },
    { key: "Customer GSTIN", label: "Customer GSTIN", type: "text" },
    { key: "Items", label: "Items (qty, rate, GST %)", type: "rows", required: true, placeholder: "2 x Steel chair @ 1500, GST 18%" },
    { key: "Invoice number", label: "Invoice number", type: "text" },
  ], "tool-1-ai"),
  "tool-2": aiDoc("tool-2", "Your expenses sorted into categories with totals and where to save.", [
    { key: "Expenses", label: "Expenses", type: "textarea", required: true, placeholder: "Rent 15000, groceries 6200, petrol 3000…" },
    { key: "Period", label: "Period", type: "text", placeholder: "November 2026" },
  ], "tool-2-ai"),
  "tool-3": aiDoc("tool-3", "Profit, margin, markup and break-even from your numbers.", [
    { key: "Selling price", label: "Selling price per unit (₹)", type: "money", required: true },
    { key: "Cost price", label: "Cost per unit (₹)", type: "money", required: true },
    { key: "Quantity", label: "Units sold", type: "number" },
    { key: "Fixed costs", label: "Fixed costs (₹)", type: "money" },
  ], "tool-3-ai"),
  "tool-4": aiDoc("tool-4", "Your income tax under the new and old regime, with the working.", [
    { key: "Income", label: "Yearly income (₹)", type: "money", required: true },
    { key: "Deductions", label: "Deductions (80C, HRA, 80D…)", type: "text", placeholder: "80C 150000, 80D 25000" },
    { key: "Financial year", label: "Financial year", type: "text", placeholder: "2026-27" },
  ], "tool-4-ai"),
  "tool-6": aiDoc("tool-6", "An agreement drafted with numbered clauses under Indian law.", [
    { key: "Agreement type", label: "Agreement type", type: "text", required: true, placeholder: "Service agreement" },
    { key: "Parties", label: "Parties", type: "text", required: true, placeholder: "ABC Pvt Ltd and Rahul Sharma" },
    { key: "Scope and payment", label: "Scope, dates and payment", type: "textarea", placeholder: "Website design, 3 months, ₹60,000 in 3 parts" },
    { key: "City", label: "City for disputes", type: "text", profile: "city" },
  ]),
  "tool-28": aiDoc("tool-28", "A job post for your opening, plus a short WhatsApp version.", [
    { key: "Role", label: "Role", type: "text", required: true, placeholder: "Sales executive" },
    { key: "Business", label: "Business", type: "text", profile: "businessName" },
    { key: "Location", label: "Location", type: "text", profile: "city" },
    { key: "Salary", label: "Salary", type: "text" },
    { key: "Requirements", label: "Requirements", type: "text" },
  ]),
  "tool-30": aiDoc("tool-30", "Your salary broken down into take-home pay, PF, tax and allowances.", [
    { key: "Salary", label: "CTC or gross salary", type: "text", required: true, placeholder: "12 lakh CTC" },
    { key: "State", label: "State", type: "text", profile: "state" },
  ], "tool-30-ai"),
  "quiz": aiDoc("quiz", "A multiple-choice quiz with answers and explanations.", [
    { key: "Topic", label: "Topic", type: "text", required: true, placeholder: "Photosynthesis" },
    { key: "Questions", label: "Number of questions", type: "number", default: "10" },
    { key: "Level", label: "Level", type: "select", options: ["Easy", "Medium", "Hard"], default: "Medium" },
  ]),
  "quiz-maker": aiDoc("quiz-maker", "A multiple-choice quiz with an answer key, ready to share.", [
    { key: "Topic", label: "Topic", type: "text", required: true, placeholder: "Indian freedom struggle" },
    { key: "Questions", label: "Number of questions", type: "number", default: "10" },
    { key: "Level", label: "Level", type: "select", options: ["Easy", "Medium", "Hard"], default: "Medium" },
  ]),
  "grade-calculator": aiDoc("grade-calculator", "Percentage, CGPA and grade from your marks, with the working.", [
    { key: "Marks", label: "Subjects and marks", type: "textarea", required: true, placeholder: "Maths 86/100, Physics 78/100, Chemistry 91/100" },
    { key: "Credits", label: "Credits or weights", type: "text" },
    { key: "Target", label: "Target", type: "text" },
  ], "grade-calculator-ai"),
  "study-planner": aiDoc("study-planner", "A day-by-day study plan up to your exam.", [
    { key: "Subjects", label: "Subjects", type: "text", required: true },
    { key: "Exam date", label: "Exam date", type: "text", required: true },
    { key: "Hours per day", label: "Hours per day", type: "number", default: "4" },
  ]),
  "flashcard-maker": aiDoc("flashcard-maker", "Flashcards on any topic, front and back.", [
    { key: "Topic", label: "Topic", type: "text", required: true },
    { key: "Cards", label: "Number of cards", type: "number", default: "15" },
  ]),
  "assignment-tracker": aiDoc("assignment-tracker", "Your assignments in a tracker sorted by due date, with this week's plan.", [
    { key: "Assignments", label: "Assignments and due dates", type: "textarea", required: true },
  ], "assignment-tracker-ai"),
  "bibliography-generator": aiDoc("bibliography-generator", "References formatted in APA, MLA or the style you need.", [
    { key: "Sources", label: "Sources", type: "textarea", required: true, placeholder: "Book title, author, year…" },
    { key: "Style", label: "Style", type: "select", options: ["APA 7", "MLA 9", "Chicago", "Harvard", "IEEE"], default: "APA 7" },
  ], "bibliography-generator-ai"),
  "exam-scheduler": aiDoc("exam-scheduler", "A preparation timetable around your exam dates.", [
    { key: "Exams", label: "Exams and dates", type: "textarea", required: true },
  ]),
  "lesson-planner": aiDoc("lesson-planner", "A lesson plan with timings, activity and homework.", [
    { key: "Topic", label: "Topic", type: "text", required: true },
    { key: "Grade", label: "Class / grade", type: "text", required: true },
    { key: "Duration", label: "Duration (minutes)", type: "number", default: "40" },
  ]),
});

/** Turns what a native function answered into the API's usual { output, image } shape. */
export function nativeOutput(id: string, data: Record<string, unknown>): Record<string, unknown> {
  // Startup Analyser streams its report (OpenAI-style server-sent events): join the pieces.
  if (typeof data.output === "string" && /^data:\s*\{/m.test(data.output)) {
    let text = "";
    for (const line of data.output.split("\n")) {
      const m = line.match(/^data:\s*(\{.*\})\s*$/);
      if (!m) continue;
      try {
        const d = JSON.parse(m[1]);
        text += d.choices?.[0]?.delta?.content ?? d.choices?.[0]?.message?.content ?? d.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      } catch { /* a partial line */ }
    }
    return { output: text.trim() };
  }
  if (id === "productvision-360" && Array.isArray(data.images)) {
    const images = (data.images as Array<{ angle: string; mimeType: string; base64: string }>).map((im) => ({ angle: im.angle, image: `data:${im.mimeType};base64,${im.base64}` }));
    return { output: images.map((im) => im.angle).join(", "), image: images[0]?.image, images, credits_charged: data.credits_charged };
  }
  if (typeof data.videoUrl === "string") return { output: "", image: data.videoUrl };
  if (typeof data.image === "string") return { output: "", image: data.image };
  if (typeof data.text === "string") return { output: data.text };
  const { error: _e, success: _s, ...rest } = data;
  return { output: rest.output ?? rest };
}
