export type AngleName =
  | "Front" | "Front-Right" | "Right" | "Back-Right" | "Back" | "Back-Left"
  | "Left" | "Front-Left" | "Top" | "Bottom" | "Intelligent Detail Close-Up";

export interface AngleResult {
  angle: AngleName;
  status: "pending" | "done" | "failed";
  /** data URL (data:image/png;base64,...) of the original returned angle */
  url?: string;
  /** transparent-bg version (white removed) */
  transparentUrl?: string;
  error?: string;
}

export const DEFAULT_ANGLES: AngleName[] = [
  "Front", "Front-Right", "Right", "Back", "Left", "Front-Left",
];
export const OPTIONAL_ANGLES: AngleName[] = [
  "Back-Right", "Back-Left", "Top", "Bottom", "Intelligent Detail Close-Up",
];
