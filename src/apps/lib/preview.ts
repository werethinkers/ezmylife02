import { createContext, useContext } from "react";

/*
 * Test runs of a developer AI app before it is approved.
 *
 * The preview pages register the version being tested for a tool id; runApp (./api.ts) then sends
 * `preview_version_id` to the dev-app-run function, which runs that version for free for its developer
 * (or an admin), with a daily limit, and keeps the run for the admin to read. Live apps never register one.
 */

const versions = new Map<string, string>();

export const setPreviewVersion = (toolId: string, versionId: string | null) => {
  if (versionId) versions.set(toolId, versionId);
  else versions.delete(toolId);
};

export const previewVersionFor = (toolId: string): string | undefined => versions.get(toolId);

/** Fired after every successful test run, so the page can refresh "test runs left today". */
export const PREVIEW_RUN_EVENT = "ez:preview-run";

/** What the embedded preview posts to the page around it after each test run (see DeveloperPreviewEmbed). */
export const PREVIEW_MESSAGE = "ez:preview-run";

/** Present while an app is shown as a preview: the shell shows its name and a "price set at approval" tag. */
export interface PreviewInfo {
  name: string;
  category?: string | null;
}
export const PreviewContext = createContext<PreviewInfo | null>(null);
export const usePreview = () => useContext(PreviewContext);
