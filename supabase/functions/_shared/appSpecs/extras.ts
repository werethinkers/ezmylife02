// Bulk mode for apps whose single-use version runs in the browser, and picture steps inside other apps (priced at cost).
// credits is the default price; the page copy of it is in src/apps/prices/extras.ts.
import { type AppSpec, BIZ, LEGAL_NOTE, LITE } from "./base.ts";

export const extras: Record<string, AppSpec> = {
  "tool-6": { kind: "doc", credits: 2, system: BIZ, task: `Draft the agreement described in the inputs (type, parties, dates, scope, payment). Use numbered clauses: parties, definitions, scope, term, payment, confidentiality, IP, termination, dispute resolution (Indian law, the city given), signatures. ${LEGAL_NOTE}` },
  "tool-28": { kind: "doc", credits: 1, model: LITE, system: BIZ, task: "Write a job post for the role: title, about the business, responsibilities, requirements, salary/benefits if given, location, how to apply. Then a 2-line WhatsApp version." },
  "quiz-maker": { kind: "doc", credits: 1, model: LITE, system: "You are a teacher who writes clear, accurate quiz questions.", task: "Write the quiz requested (topic, number of questions, level). Multiple-choice with 4 options each; mark the answer and give a one-line explanation. End with an answer key." },
  "quiz": { kind: "doc", credits: 1, model: LITE, system: "You are a teacher who writes clear, accurate quiz questions.", task: "Write the quiz requested (topic, number of questions, level). Multiple-choice with 4 options each; mark the answer and give a one-line explanation. End with an answer key." },
  "lesson-planner": { kind: "doc", credits: 1, model: LITE, system: "You are an experienced teacher in India.", task: "Write a lesson plan: objectives, materials, warm-up, teaching steps with timings, activity, assessment, homework — fitted to the grade and duration given." },
  "flashcard-maker": { kind: "doc", credits: 1, model: LITE, system: "You make accurate study flashcards.", task: "Make the number of flashcards requested on the topic as a Markdown table with columns Front | Back." },
  "study-planner": { kind: "doc", credits: 1, model: LITE, system: "You are a study coach.", task: "Make a day-by-day study plan as a Markdown table up to the exam date, covering the subjects in the hours per day given, with revision days and one rest day a week." },
  "exam-scheduler": { kind: "doc", credits: 1, model: LITE, system: "You are a study coach.", task: "Turn the exam list into a preparation timetable (Markdown table) with revision blocks before each exam and a checklist for exam day." },
  "storybook-illustration": { kind: "image", credits: 12, system: "" },
  "thumbnail-maker": { kind: "image", credits: 12, system: "", chargeId: "thumbnail-maker-img" },
};
