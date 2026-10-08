// AI-generated tool icons mapped by toolId or category
import audioStreamIcon from "@/assets/tool-icons/audio-stream.png";
import videoStreamIcon from "@/assets/tool-icons/video-stream.png";
import aiBotIcon from "@/assets/tool-icons/ai-bot.png";
import pdfReaderIcon from "@/assets/tool-icons/pdf-reader.png";
import notebookIcon from "@/assets/tool-icons/notebook.png";
import startupAnalyserIcon from "@/assets/tool-icons/startup-analyser.png";
import promptmasterIcon from "@/assets/tool-icons/promptmaster.png";
import meetNudgeIcon from "@/assets/tool-icons/meet-nudge.png";
import imageToolsIcon from "@/assets/tool-icons/image-tools.png";
import encyclopediaIcon from "@/assets/tool-icons/encyclopedia.png";
import quizIcon from "@/assets/tool-icons/quiz.png";
import imageCreatorIcon from "@/assets/tool-icons/image-creator.png";
import storybookIcon from "@/assets/tool-icons/storybook.png";
import textExtractorIcon from "@/assets/tool-icons/text-extractor.png";
import mindmapIcon from "@/assets/tool-icons/mindmap.png";
import contentCreationIcon from "@/assets/tool-icons/content-creation.png";
import calendarIcon from "@/assets/tool-icons/calendar.png";
import codeEditorIcon from "@/assets/tool-icons/code-editor.png";
import dataAnalysisIcon from "@/assets/tool-icons/data-analysis.png";
import videoCreatorIcon from "@/assets/tool-icons/video-creator.png";

// Direct toolId → icon mapping
const toolIdIconMap: Record<string, string> = {
  // Core tools
  "advance-ai-bot": aiBotIcon,
  "quiz": quizIcon,
  "image-creator": imageCreatorIcon,
  "storybook-creator": storybookIcon,
  "advance-text-extractor": textExtractorIcon,
  "create-3d-images": imageCreatorIcon,
  "sketchflow-ai": mindmapIcon,
  "speedy-notebook": notebookIcon,
  "promptmaster-ai": promptmasterIcon,
  "startup-analyser": startupAnalyserIcon,
  "rich-editor": codeEditorIcon,
  "pdf-chart-image-extractor": pdfReaderIcon,
  "html-editor": codeEditorIcon,
  "wrong-written-words": textExtractorIcon,
  "book-editor": storybookIcon,
  "book-editor-html": storybookIcon,
  "ocr": textExtractorIcon,
  "dictionary-extractor-ai": encyclopediaIcon,
  "pdf-profile-extractor": pdfReaderIcon,
  "pdf-metadata-ai-analyst": dataAnalysisIcon,
  "soul-mirror": aiBotIcon,
  "cognimap": mindmapIcon,
  "ai-data-analysis": dataAnalysisIcon,
  "interactive-videos": videoStreamIcon,
  "smart-diagram-ai": mindmapIcon,
  "auto-text-extractor": textExtractorIcon,
  "meet-nudge": meetNudgeIcon,

  // Content Creation tools
  "social-post-generator": contentCreationIcon,
  "caption-generator": contentCreationIcon,
  "hashtag-generator": contentCreationIcon,
  "content-idea-generator": contentCreationIcon,
  "video-script-writer": videoCreatorIcon,
  "content-workflow": contentCreationIcon,
  "thumbnail-maker": imageCreatorIcon,
  "video-maker": videoCreatorIcon,

  // Education tools
  "quiz-maker": quizIcon,
  "grade-calculator": quizIcon,
  "study-planner": calendarIcon,
  "flashcard-maker": quizIcon,
  "assignment-tracker": calendarIcon,
  "bibliography-generator": encyclopediaIcon,
  "exam-scheduler": calendarIcon,
  "lesson-planner": calendarIcon,
};

// Category-based fallback icons for Image Tools (many variants share the same icon)
const categoryIconMap: Record<string, string> = {
  "Image Tools": imageToolsIcon,
  "For Students": quizIcon,
  "For Teachers": quizIcon,
  "Content Creation": contentCreationIcon,
  "Popular": aiBotIcon,
  "Research": pdfReaderIcon,
  "Lab": dataAnalysisIcon,
  "AI Agent": aiBotIcon,
  "Content": storybookIcon,
  "Modern Science": mindmapIcon,
  "Networking": meetNudgeIcon,
};

/**
 * Get the AI-generated icon URL for a tool
 * Falls back to category icon, then returns null
 */
export const getToolIconUrl = (toolId: string, category?: string): string | null => {
  if (toolIdIconMap[toolId]) {
    return toolIdIconMap[toolId];
  }
  if (category && categoryIconMap[category]) {
    return categoryIconMap[category];
  }
  return null;
};

export { toolIdIconMap, categoryIconMap };
