import { isNativeApp } from "@/lib/nativeApp";
import { downloadBlob } from "../lib/files";

const asFile = (blob: Blob, name: string) => new File([blob], name, { type: blob.type || "application/pdf" });

/** True when this phone can hand a PDF file to WhatsApp, Mail and other apps. */
export function canShareFile(blob: Blob, name: string): boolean {
  try {
    return typeof navigator !== "undefined" && !!navigator.canShare?.({ files: [asFile(blob, name)] });
  } catch {
    return false;
  }
}

/** Opens the phone's share sheet with the PDF. Returns false when it could not. */
export async function shareFile(blob: Blob, name: string, title: string): Promise<boolean> {
  if (!canShareFile(blob, name)) return false;
  try {
    await navigator.share({ files: [asFile(blob, name)], title });
    return true;
  } catch (e) {
    // Closing the share sheet is not an error.
    return (e as DOMException)?.name === "AbortError";
  }
}

/** Saves the PDF. In the iPhone app a download link does nothing, so the share sheet ("Save to Files") is used. */
export async function saveFile(blob: Blob, name: string, title: string) {
  if (isNativeApp() && (await shareFile(blob, name, title))) return;
  downloadBlob(blob, name);
}
