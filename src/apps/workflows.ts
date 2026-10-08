// Role templates for the Workspace Builder: an ordered set of real apps for a goal, and which
// shared details matter for it. Every id must exist in tools_catalog (missing/non-live ids
// are skipped at render time).

export interface WorkflowStep {
  toolId: string;
  why: string;
}

export interface RoleTemplate {
  id: string;
  emoji: string;
  label: string;
  goal: string;
  /** Show the client/engagement panel (for people who serve clients). */
  usesClient: boolean;
  /** Show this month's revenue/expense numbers. */
  usesMoney: boolean;
  steps: WorkflowStep[];
}

export const ROLES: RoleTemplate[] = [
  {
    id: "gst-accountant", emoji: "🧾", label: "GST Accountant / CA", usesClient: true, usesMoney: true,
    goal: "Bill a client, track their costs, estimate GST/TDS, check profit and send the engagement letter — entering client details once.",
    steps: [
      { toolId: "tool-1", why: "Raise the GST invoice — client and items carry forward" },
      { toolId: "auto-text-extractor", why: "Snap the client's bills into a table" },
      { toolId: "tool-2", why: "Log this month's expenses" },
      { toolId: "tool-4", why: "GST & TDS from the invoice and expense totals" },
      { toolId: "tool-3", why: "Profit for the month, pre-filled" },
      { toolId: "tool-6", why: "Engagement letter with the client's details" },
      { toolId: "tool-8", why: "Reply to a GST notice for this client" },
      { toolId: "tool-5", why: "Chase an overdue fee" },
    ],
  },
  {
    id: "founder", emoji: "🚀", label: "Founder / Startup", usesClient: false, usesMoney: true,
    goal: "Validate the idea, plan launch marketing, hire the first people and paper the deals.",
    steps: [
      { toolId: "startup-analyser", why: "Investor-style analysis of the business" },
      { toolId: "cognimap", why: "Pressure-test the big decision" },
      { toolId: "tool-18", why: "A lead magnet to collect early users" },
      { toolId: "tool-16", why: "Launch campaign plan and messages" },
      { toolId: "html-editor", why: "A simple landing page" },
      { toolId: "tool-28", why: "Job post for the first hire" },
      { toolId: "tool-29", why: "Interview guide and scorecard" },
      { toolId: "tool-6", why: "Contract for a vendor or freelancer" },
    ],
  },
  {
    id: "retail", emoji: "🏪", label: "Shop owner / Retailer", usesClient: false, usesMoney: true,
    goal: "Keep stock in check, order from suppliers, run offers and look after customers.",
    steps: [
      { toolId: "tool-25", why: "See what needs reordering" },
      { toolId: "tool-22", why: "Purchase order to the supplier" },
      { toolId: "tool-26", why: "Rate suppliers on price and delivery" },
      { toolId: "tool-1", why: "Bill a customer" },
      { toolId: "tool-12", why: "Three offers with the maths done" },
      { toolId: "tool-19", why: "Check a discount won't eat your margin" },
      { toolId: "tool-13", why: "Reply to Google reviews" },
      { toolId: "tool-39", why: "Collect and act on feedback" },
    ],
  },
  {
    id: "food", emoji: "🍛", label: "Restaurant / Food business", usesClient: false, usesMoney: true,
    goal: "Cut wastage, keep the kitchen safe and stocked, roster staff and win reviews.",
    steps: [
      { toolId: "tool-21", why: "Log wastage and see what it costs" },
      { toolId: "tool-25", why: "Stock levels and reorder points" },
      { toolId: "tool-22", why: "Order from suppliers" },
      { toolId: "tool-10", why: "Kitchen safety protocol" },
      { toolId: "tool-27", why: "Quality checklist" },
      { toolId: "tool-33", why: "Weekly shift roster" },
      { toolId: "tool-35", why: "Attendance for payroll" },
      { toolId: "tool-13", why: "Reply to Zomato / Google reviews" },
    ],
  },
  {
    id: "marketer", emoji: "📣", label: "Marketer / Agency", usesClient: true, usesMoney: false,
    goal: "Plan a month of content for a client and produce the posts, captions and visuals.",
    steps: [
      { toolId: "tool-15", why: "4-week content calendar" },
      { toolId: "content-idea-generator", why: "Fresh post ideas" },
      { toolId: "social-post-generator", why: "Write the posts" },
      { toolId: "caption-generator", why: "Captions" },
      { toolId: "hashtag-generator", why: "Hashtags" },
      { toolId: "image-creator", why: "Original visuals" },
      { toolId: "thumbnail-maker", why: "YouTube thumbnails" },
      { toolId: "tool-16", why: "Paid campaign plan" },
    ],
  },
  {
    id: "hr", emoji: "🧑‍💼", label: "HR / People manager", usesClient: false, usesMoney: false,
    goal: "Hire, onboard, track attendance, run payroll and review performance.",
    steps: [
      { toolId: "tool-28", why: "Write the job post" },
      { toolId: "pdf-profile-extractor", why: "Shortlist from resume PDFs" },
      { toolId: "tool-29", why: "Interview guide" },
      { toolId: "tool-35", why: "Daily attendance" },
      { toolId: "tool-34", why: "Monthly payroll" },
      { toolId: "tool-30", why: "Salary breakup" },
      { toolId: "tool-36", why: "Performance review" },
      { toolId: "tool-31", why: "Warning letter, when needed" },
    ],
  },
  {
    id: "student", emoji: "🎓", label: "Student", usesClient: false, usesMoney: false,
    goal: "Turn notes and textbooks into a study plan, flashcards and practice quizzes.",
    steps: [
      { toolId: "study-planner", why: "Plan the weeks before the exam" },
      { toolId: "ocr", why: "Photos of notes → text" },
      { toolId: "dictionary-extractor-ai", why: "Key terms from a chapter" },
      { toolId: "kundkund-mindmap", why: "Mind map of the chapter" },
      { toolId: "flashcard-maker", why: "Flashcards" },
      { toolId: "quiz-maker", why: "Practice quiz" },
      { toolId: "assignment-tracker", why: "Track assignments" },
      { toolId: "bibliography-generator", why: "References for the project" },
    ],
  },
  {
    id: "teacher", emoji: "👩‍🏫", label: "Teacher", usesClient: false, usesMoney: false,
    goal: "Plan lessons and make engaging material — quizzes, video checkpoints, diagrams, stories.",
    steps: [
      { toolId: "lesson-planner", why: "Lesson plan" },
      { toolId: "smart-diagram-ai", why: "Diagram for the board" },
      { toolId: "interactive-videos", why: "Quiz checkpoints on a YouTube lesson" },
      { toolId: "quiz-maker", why: "Class quiz" },
      { toolId: "storybook-creator", why: "A story that teaches the value" },
      { toolId: "grade-calculator", why: "Grades" },
    ],
  },
  {
    id: "creator", emoji: "🎬", label: "Content creator", usesClient: false, usesMoney: false,
    goal: "From idea to published video: script, thumbnail, caption and hashtags.",
    steps: [
      { toolId: "content-idea-generator", why: "Video ideas" },
      { toolId: "video-script-writer", why: "Script" },
      { toolId: "thumbnail-maker", why: "Thumbnail" },
      { toolId: "caption-generator", why: "Caption" },
      { toolId: "hashtag-generator", why: "Hashtags" },
      { toolId: "content-workflow", why: "The whole flow for the next post" },
    ],
  },
];

/** Tools that read the shared client / numbers (shown with a "pre-filled" badge). */
export const CONTEXT_AWARE = new Set(["tool-1", "tool-2", "tool-3", "tool-4", "tool-6", "tool-8", "tool-5", "tool-9", "tool-14", "tool-11", "tool-22", "tool-15", "tool-16"]);
