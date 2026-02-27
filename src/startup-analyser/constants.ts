
import type { Prompt } from './types';

export const prompts: Prompt[] = [
  {
    title: "Summarize Document",
    description: "Get a concise summary of the entire document in a few key bullet points.",
    text: "Provide a concise summary of this document in three to five bullet points. Focus on the main purpose, key findings, and conclusions."
  },
  {
    title: "Extract Key Takeaways",
    description: "Identify the most important insights and information from the text.",
    text: "Extract the top 5 most important takeaways from this document. What are the critical pieces of information someone should know after reading this?"
  },
  {
    title: "Find Action Items",
    description: "List all tasks, suggestions, or actions mentioned in the document.",
    text: "Identify and list all explicit action items, tasks, or recommendations mentioned in this document. If none are found, state that clearly."
  },
  {
    title: "Identify Main Topics",
    description: "Understand the primary subjects and themes discussed.",
    text: "What are the main topics and themes discussed throughout this document? List them and provide a brief one-sentence explanation for each."
  },
  {
    title: "Analyze Sentiment",
    description: "Determine the overall tone of the document (Positive, Negative, Neutral).",
    text: "Analyze the overall sentiment of this document. Is it positive, negative, or neutral? Provide a brief justification for your answer based on the text."
  },
  {
    title: "Generate Questions",
    description: "Create potential questions a reader might have after finishing.",
    text: "Generate 3-5 insightful questions that a critical reader might have after finishing this document. These questions should stimulate further thought or discussion."
  },
];
