import type { ToolEntry } from "../toolsDatabase";

// Phase 2: exam and ID photo presets (src/apps/defs/exam-presets.ts). Rules from the official pages listed there.
export const examPresets: ToolEntry[] = [
  { id: "nta-photo-signature", name: "NEET, JEE & CUET Photo and Signature", description: "Photo and signature JPGs inside the KB limits of NTA forms for NEET UG, JEE Main and CUET UG", category: "Image Tools", alsoIn: ["For Students"], toolType: ["Photo ID & Passport", "Signature Tools"], source: "featured", isLive: true },
  { id: "sbi-clerk-photo-signature", name: "SBI Clerk Photo, Signature & Thumb", description: "Photo, signature, left thumb and declaration at the exact sizes in the SBI Junior Associates 2026 notice", category: "Image Tools", alsoIn: ["For Students"], toolType: ["Photo ID & Passport", "Signature Tools"], source: "featured", isLive: true },
  { id: "gate-photo-signature", name: "GATE 2027 Photo and Signature", description: "GATE 2027 photo and signature inside the pixel, shape and KB limits set by IIT Madras", category: "Image Tools", alsoIn: ["For Students"], toolType: ["Photo ID & Passport", "Signature Tools"], source: "featured", isLive: true },
  { id: "us-visa-photo", name: "US Visa Photo", description: "Square US visa photo for the online form: 600 to 1200 pixels, JPG, under 240 KB", category: "Image Tools", toolType: ["Photo ID & Passport", "Image Tools"], source: "featured", isLive: true },
  { id: "oci-photo-signature", name: "OCI Card Photo and Signature", description: "Square photo and 1:3 signature for the OCI card online form, inside its pixel limits", category: "Image Tools", toolType: ["Photo ID & Passport", "Signature Tools"], source: "featured", isLive: true },
  { id: "india-evisa-photo", name: "India e-Visa Photo", description: "Square photo for the Indian e-Visa form, JPG between 10 KB and 1 MB", category: "Image Tools", toolType: ["Photo ID & Passport", "Image Tools"], source: "featured", isLive: true },
];
