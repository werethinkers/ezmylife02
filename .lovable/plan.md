## Goal

Persist every Storyteller voice answer in Virasat as a true `.mp4` (AAC) file in the `virasat-media` bucket so admins can play/download it from the Virasat Archive — while keeping the original `.webm` as a guaranteed-playable fallback.

## Approach

Use **best-effort transcoding** in the browser:
1. Always upload the original webm (zero risk of data loss).
2. After upload, lazily load `ffmpeg.wasm` and convert the same blob to `audio/mp4` (AAC). Upload the mp4 alongside, link it to the same `virasat_media` row.
3. Admin Archive prefers `.mp4` URL when present, falls back to webm.

If transcode fails (old browser, OOM, ffmpeg load error), we silently keep just the webm — user flow is never blocked.

## Changes

### 1. Database (migration)
Add two nullable columns to `virasat_media`:
- `mp4_storage_path text` — path of the converted mp4 in the same bucket
- `transcode_status text` — `pending` | `done` | `failed` (default `pending`)

No RLS changes needed (existing admin SELECT + user ALL policies cover them).

### 2. New helper `src/components/virasat/lib/audioTranscode.ts`
- `transcodeWebmToMp4(blob: Blob): Promise<Blob | null>` 
- Lazy-imports `@ffmpeg/ffmpeg` + `@ffmpeg/util` from a CDN ESM URL (no npm install needed; same pattern as the project's other CDN libs per `mem://technical/external-libraries-cdn`).
- Single shared FFmpeg instance, loaded on first call.
- Runs `-i in.webm -c:a aac -b:a 128k out.mp4`, returns the mp4 Blob.
- Catches all errors, returns `null` on failure.

### 3. `src/components/virasat/VoiceRecorder.tsx`
In `useThis()`, after the existing webm upload + `virasat_media` insert succeeds:
- Fire-and-forget `transcodeWebmToMp4(audioBlobRef.current)` in the background (doesn't block `onTranscript`).
- On success: upload mp4 to `${user.id}/${sessionId}/voice-<uuid>.mp4`, then `update` the same `virasat_media` row with `mp4_storage_path` + `transcode_status: 'done'`.
- On failure: `update` row with `transcode_status: 'failed'`.

User experience is unchanged — the conversion happens silently after the answer is submitted.

### 4. `src/components/admin/VirasatArchive.tsx`
- Extend `MediaItem` with `mp4_storage_path`, `transcode_status`.
- When generating signed URLs for audio items, prefer `mp4_storage_path` if present; otherwise use `storage_path`.
- Show a tiny "MP4" / "WEBM" badge next to each audio entry so admin knows the format.
- Add a small "Download" link next to the audio player using the signed URL.
- Same logic applies to the per-turn `audio_path` map in the transcript view: extend the lookup to fetch the mp4 path from `virasat_media` joined by `storage_path` match (one query, mapping webm path → mp4 path).

### Out of scope
- Re-transcoding existing webm recordings already in storage (only new recordings get mp4).
- Saving AI narration TTS as mp4 (user confirmed: only user voice answers).
- Server-side conversion / edge function (chose client-side per your selection).

### Technical notes
- ffmpeg.wasm core is ~25MB; loaded only the first time a user finishes recording, then cached for the session.
- Conversion of a typical 30-second answer takes 2–4s on desktop, 5–10s on mobile.
- iOS Safari already records to `audio/mp4` natively — for those clips we'll detect the mime and skip transcoding (just upload as `.mp4` directly and mark `transcode_status: 'done'`).
