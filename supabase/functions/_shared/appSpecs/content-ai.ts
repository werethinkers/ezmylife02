// Thinking, chat, text-from-image and picture apps.
// credits is the default price; the page copy of it is in src/apps/prices/content-ai.ts.
import { type AppSpec } from "./base.ts";

export const contentAi: Record<string, AppSpec> = {
  "cognimap": { kind: "doc", credits: 2, system: "You are a clear-thinking coach who applies mental models rigorously but in plain language.", task: "Analyse the user's problem or decision through 6 mental models (first principles, inversion, second-order thinking, opportunity cost, circle of competence, and one other that fits best). For each: what the model says here, key insight, and one action. Finish with a decision summary and the single next step." },
  "advance-ai-bot": { kind: "chat", credits: 1, system: "You are a helpful, accurate assistant. Answer clearly and concisely with Markdown. If you are not sure, say so instead of guessing." },
  "ocr": { kind: "vision", credits: 1, maxImages: 3, system: "You transcribe text from images exactly.", task: "Transcribe all text in the image(s) exactly as written, preserving line breaks and reading order. Keep the original language and script. Render tables as Markdown tables. Do not summarise or correct. If text is unreadable, write [illegible]." },
  "advance-text-extractor": { kind: "vision", credits: 2, maxImages: 6, system: "You convert document images into clean, structured Markdown.", task: "Extract the full content of the document image(s) as structured Markdown: headings, paragraphs, bullet lists and tables (as Markdown tables). Preserve numbers exactly. Keep the original language. After the content, add a short 'Key details' list (dates, amounts, names) found in it." },
  "auto-text-extractor": { kind: "vision", credits: 2, maxImages: 4, system: "You extract fields from business documents accurately. Never guess missing values; use empty strings.", task: 'Identify the document type (invoice, receipt, bill, business card, ID card, form, other) and extract its fields. Return JSON: {"document_type": "...", "fields": [{"label": "...", "value": "..."}], "line_items": [{"description": "", "quantity": "", "rate": "", "amount": ""}]}. Include totals, taxes (GST), dates and IDs when present.' },
  "image-creator": { kind: "image", credits: 12, system: "" },
  "create-3d-images": { kind: "image", credits: 12, system: "" },
  "sketchflow-ai": { kind: "image", credits: 12, system: "" },
};
