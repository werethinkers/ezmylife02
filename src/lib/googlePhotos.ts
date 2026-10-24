// Pick photos from the person's Google Photos with Google's Picker API.
// Google no longer lets apps browse a whole library (Library API scopes were removed on 31 Mar 2025).
// Instead the person chooses photos inside Google's own screen and we receive only those.
// Flow: sign in (one scope) -> create session -> person picks in Google Photos -> poll -> download -> delete session.
// Docs: docs/google-photos.md
import { supabase } from "@/integrations/supabase/client";

const SCOPE = "https://www.googleapis.com/auth/photospicker.mediaitems.readonly";
const API = "https://photospicker.googleapis.com/v1";
const GIS_SRC = "https://accounts.google.com/gsi/client";
const MAX_EDGE = 2048;

/** The OAuth Web client id. Without it the "From Google Photos" buttons stay hidden, so nothing is ever a dead button. */
export const googlePhotosClientId = (): string =>
  String((import.meta.env as Record<string, string | undefined>).VITE_GOOGLE_PHOTOS_CLIENT_ID ?? "").trim();
export const isGooglePhotosEnabled = (): boolean => googlePhotosClientId() !== "";

export class GooglePhotosError extends Error {
  constructor(message: string, readonly code: "cancelled" | "auth" | "timeout" | "network" | "empty" = "network") {
    super(message);
  }
}

type TokenResponse = { access_token?: string; expires_in?: number | string; error?: string; error_description?: string };
type TokenClient = { requestAccessToken: (o?: { prompt?: string }) => void };
type GoogleGlobal = {
  accounts: {
    oauth2: {
      initTokenClient: (c: {
        client_id: string;
        scope: string;
        callback: (r: TokenResponse) => void;
        error_callback?: (e: { type?: string; message?: string }) => void;
      }) => TokenClient;
    };
  };
};

let gisPromise: Promise<GoogleGlobal> | null = null;
/** Loads Google's sign-in script once. Safe to call early (the picker does, so the first click is fast). */
export function loadGoogleSignIn(): Promise<GoogleGlobal> {
  const w = window as unknown as { google?: GoogleGlobal };
  if (w.google?.accounts?.oauth2) return Promise.resolve(w.google);
  if (gisPromise) return gisPromise;
  gisPromise = new Promise<GoogleGlobal>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = GIS_SRC;
    s.async = true;
    s.onload = () => (w.google?.accounts?.oauth2 ? resolve(w.google) : reject(new GooglePhotosError("Google sign-in didn't load.", "network")));
    s.onerror = () => { gisPromise = null; reject(new GooglePhotosError("Couldn't reach Google. Check your connection and try again.", "network")); };
    document.head.appendChild(s);
  });
  return gisPromise;
}

let cached: { token: string; until: number } | null = null;
/** An access token for this one scope. Kept in memory only (never stored) for as long as Google says it lasts. */
export async function getGooglePhotosToken(): Promise<string> {
  if (cached && cached.until > Date.now() + 30_000) return cached.token;
  const google = await loadGoogleSignIn();
  return new Promise<string>((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: googlePhotosClientId(),
      scope: SCOPE,
      callback: (r) => {
        if (!r.access_token) {
          const denied = r.error === "access_denied";
          return reject(new GooglePhotosError(denied ? "Google Photos access was not allowed." : r.error_description || "Google sign-in failed.", denied ? "cancelled" : "auth"));
        }
        cached = { token: r.access_token, until: Date.now() + Number(r.expires_in ?? 3000) * 1000 };
        resolve(r.access_token);
      },
      error_callback: (e) => reject(new GooglePhotosError(e.type === "popup_closed" ? "Sign-in was closed." : e.message || "Google sign-in failed.", e.type === "popup_closed" ? "cancelled" : "auth")),
    });
    client.requestAccessToken({ prompt: cached ? "" : "consent" });
  });
}

export type PickerSession = { id: string; pickerUri: string; pollMs: number; timeoutMs: number };
type RawSession = { id: string; pickerUri: string; mediaItemsSet?: boolean; pollingConfig?: { pollInterval?: string; timeoutIn?: string } };
type PickedItem = { id: string; mimeType?: string; type?: string; mediaFile?: { baseUrl?: string; mimeType?: string; filename?: string } };

const seconds = (d: string | undefined, fallback: number) => {
  const n = parseFloat(d ?? "");
  return Number.isFinite(n) && n > 0 ? n * 1000 : fallback;
};

async function api<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  } catch {
    throw new GooglePhotosError("Couldn't reach Google Photos. Check your connection and try again.", "network");
  }
  if (res.status === 401 || res.status === 403) {
    cached = null;
    throw new GooglePhotosError("Google Photos didn't accept the sign-in. Please try again.", "auth");
  }
  if (!res.ok) throw new GooglePhotosError(`Google Photos returned an error (${res.status}).`, "network");
  return (res.status === 204 ? ({} as T) : await res.json()) as T;
}

export async function createPickerSession(token: string, maxItems: number): Promise<PickerSession> {
  const s = await api<RawSession>(token, "/sessions", { method: "POST", body: JSON.stringify({ pickingConfig: { maxItemCount: String(Math.max(1, Math.min(2000, maxItems))) } }) });
  return { id: s.id, pickerUri: s.pickerUri, pollMs: seconds(s.pollingConfig?.pollInterval, 3000), timeoutMs: seconds(s.pollingConfig?.timeoutIn, 5 * 60_000) };
}

/** Waits until the person finishes choosing in Google Photos. */
export async function waitForPicks(token: string, session: PickerSession, signal: AbortSignal): Promise<void> {
  const deadline = Date.now() + session.timeoutMs;
  while (!signal.aborted) {
    if (Date.now() > deadline) throw new GooglePhotosError("That took too long. Please start again.", "timeout");
    await new Promise((r) => setTimeout(r, session.pollMs));
    if (signal.aborted) break;
    const s = await api<RawSession>(token, `/sessions/${encodeURIComponent(session.id)}`);
    if (s.mediaItemsSet) return;
  }
  throw new GooglePhotosError("Cancelled.", "cancelled");
}

async function listPicked(token: string, sessionId: string): Promise<PickedItem[]> {
  const out: PickedItem[] = [];
  let pageToken = "";
  do {
    const q = `?sessionId=${encodeURIComponent(sessionId)}&pageSize=100${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`;
    const r = await api<{ mediaItems?: PickedItem[]; nextPageToken?: string }>(token, `/mediaItems${q}`);
    out.push(...(r.mediaItems ?? []));
    pageToken = r.nextPageToken ?? "";
  } while (pageToken);
  return out;
}

export async function deletePickerSession(token: string, sessionId: string): Promise<void> {
  try { await api(token, `/sessions/${encodeURIComponent(sessionId)}`, { method: "DELETE" }); } catch { /* best effort: the session expires by itself */ }
}

async function fetchBytes(token: string, url: string): Promise<Blob> {
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new GooglePhotosError("Couldn't download a photo from Google.", "network");
    return await res.blob();
  } catch (e) {
    if (e instanceof GooglePhotosError) throw e;
    // Browsers may block this cross-site request (CORS). Fall back to our own function, which makes the same request server-side.
    const { data, error } = await supabase.functions.invoke("google-photos-fetch", { body: { url, token } });
    if (error || !(data instanceof Blob) || data.size === 0) throw new GooglePhotosError("Couldn't download a photo from Google.", "network");
    return data;
  }
}

/** Downloads the chosen photos as ordinary File objects, so every existing upload path can take them unchanged. */
export async function downloadPicks(token: string, sessionId: string, max: number): Promise<File[]> {
  const items = (await listPicked(token, sessionId)).filter((i) => (i.mediaFile?.mimeType ?? i.mimeType ?? "").startsWith("image/") && i.mediaFile?.baseUrl).slice(0, max);
  if (!items.length) throw new GooglePhotosError("No photos were chosen. Pick at least one photo (videos can't be used here).", "empty");
  // A width and height are required by Google; asking for them also returns a plain JPEG, even for iPhone HEIC photos.
  const files = await Promise.all(items.map(async (it, i) => {
    const blob = await fetchBytes(token, `${it.mediaFile!.baseUrl}=w${MAX_EDGE}-h${MAX_EDGE}`);
    const type = blob.type.startsWith("image/") ? blob.type : "image/jpeg";
    return new File([blob], `google-photo-${i + 1}.jpg`, { type });
  }));
  return files;
}
