import type { ToolEntry } from "../toolsDatabase";

// Phase 2: file converters (src/apps/defs/converters.ts). Everything runs in the browser.
export const converters: ToolEntry[] = [
  { id: "jpg-to-pdf", name: "JPG to PDF", description: "Put photos or scans into one PDF, one picture per page, in the order you choose", category: "PDF & Files", alsoIn: ["Image Tools"], toolType: ["Converters", "File Management"], source: "featured", isLive: true },
  { id: "pdf-to-jpg", name: "PDF to JPG", description: "Turn each PDF page into a JPG image at screen, clear or print sharpness", category: "PDF & Files", toolType: ["Converters", "File Management"], source: "featured", isLive: true },
  { id: "merge-pdf", name: "Merge PDF", description: "Join several PDFs into one file in the order you set, without uploading them", category: "PDF & Files", toolType: ["Converters", "File Management"], source: "featured", isLive: true },
  { id: "split-pdf", name: "Split PDF", description: "Keep only the pages you need from a PDF, or save every page as its own PDF", category: "PDF & Files", toolType: ["Converters", "File Management"], source: "featured", isLive: true },
  { id: "rotate-pdf", name: "Rotate PDF", description: "Turn sideways or upside-down PDF pages the right way up, all pages or only some", category: "PDF & Files", toolType: ["Converters", "File Management"], source: "featured", isLive: true },
  { id: "pdf-to-text", name: "PDF to Text", description: "Copy all the text out of a PDF page by page, or save it as a .txt file", category: "PDF & Files", toolType: ["Converters", "Text Tools"], source: "featured", isLive: true },
  { id: "heic-to-jpg", name: "HEIC to JPG", description: "Turn iPhone HEIC photos into ordinary JPGs that every website and form accepts", category: "PDF & Files", alsoIn: ["Image Tools"], toolType: ["Converters", "Image Tools"], source: "featured", isLive: true },
  { id: "webp-to-jpg", name: "WebP to JPG", description: "Turn WebP pictures saved from websites into JPGs that open and upload everywhere", category: "PDF & Files", alsoIn: ["Image Tools"], toolType: ["Converters", "Image Tools"], source: "featured", isLive: true },
  { id: "png-to-jpg", name: "PNG to JPG", description: "Shrink PNG screenshots into JPGs, with transparent areas filled white or black", category: "PDF & Files", alsoIn: ["Image Tools"], toolType: ["Converters", "Image Tools"], source: "featured", isLive: true },
  { id: "image-to-webp", name: "Image to WebP", description: "Make JPG and PNG photos lighter for websites by saving them as smaller WebP files", category: "PDF & Files", alsoIn: ["Image Tools"], toolType: ["Converters", "Image Tools"], source: "featured", isLive: true },
];
