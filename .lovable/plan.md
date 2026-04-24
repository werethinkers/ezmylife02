
# Virasat: Build Fix + Resume Card + Podcast Playback Controls

Three connected fixes for `/virasat`:

## 1. Fix the build error (blocking)

`src/pages/Virasat.tsx` line 236 passes `canonicalUrl="..."` to `<SEOHead>`, but `SEOHeadProps` only has `path`. The component already builds the canonical URL internally from `path`.

**Fix:** Replace `canonicalUrl="https://ezyourlife.com/virasat"` with `path="/virasat"`.

## 2. Rich "Continue your story" card on /virasat

Today the welcome screen only shows a small "Pichli kahani jaari rakhein" button when an unfinished session exists. It doesn't show **what** that session contains. I'll upgrade it to a proper card that loads the latest unfinished `virasat_sessions` row and previews:

- Title (`Meri Kahani` or session title)
- Story count (`{question_count} kahaniyan`)
- Status badge (`Recording` / `Reviewing`)
- Last updated (relative — "3 din pehle")
- The **last question asked** (italic preview, last `model` message)
- Two buttons: **Resume** (primary) and **Start fresh** (ghost — keeps the existing welcome path)

Implementation:
- Extend the existing `useEffect` query to also fetch `title`, `question_count`, `status`, `conversation` (just last message)
- New `ContinueStoryCard` block rendered above the "Shuru Karein" button when `hasResume` is set
- "Resume" calls existing `resumeSession()` (already wired correctly — fetches full row, restores conversation, sets correct mode)
- "Start fresh" simply hides the card (sets `hasResume=null`) so the user can click "Shuru Karein"; we won't delete the old session — they can come back later

No DB changes needed (all fields already exist in `virasat_sessions`).

## 3. Podcast playback controls (play / pause / seek / replay) for each TTS

Currently `playPCMAudio` plays once and that's it — there's no way to re-listen to a question, pause mid-question, or scrub. I'll add full audio controls.

### Approach: switch from raw WebAudio buffer to a WAV Blob + HTMLAudioElement

Web Audio's `AudioBufferSourceNode` is one-shot — perfect for "play once" but bad for pause/seek. HTMLAudioElement gives us native `play`, `pause`, `currentTime`, `duration`, and `timeupdate` events for free, and works on every browser.

Steps in `src/components/virasat/lib/audio.ts`:

- Add a new helper `pcmBase64ToWavBlobUrl(base64)` that wraps the existing 24kHz mono Int16 PCM in a WAV header (44 bytes) and returns a `URL.createObjectURL(blob)`.
- Keep `playPCMAudio` working as before for the auto-play after each question (so the existing flow doesn't change), but also export the new helper.
- Add `stopPlayback()` to also revoke any active object URL.

### New `PodcastPlayer` component (`src/components/virasat/PodcastPlayer.tsx`)

Sticky / inline mini-player with:

- ▶︎ / ⏸ play-pause button
- Progress bar (slider — uses our existing `@/components/ui/slider`) with click-to-seek
- Current time / duration text (`0:04 / 0:18`)
- ↻ Replay button (jumps to 0 and plays)
- Optional: 1× / 1.25× / 1.5× speed toggle (cheap to add via `audio.playbackRate`)

Internals:
- Takes a `base64` PCM string as prop (from the `tts` action) plus the question text (for an aria-label / caption)
- Builds the WAV blob URL once via `useMemo`, revokes on unmount
- Uses a hidden `<audio ref>` plus react state for `playing`, `currentTime`, `duration` driven by `play/pause/timeupdate/loadedmetadata` events
- When the user starts playing the player **manually**, we call `stopPlayback()` from `lib/audio.ts` first so it doesn't fight the auto-play
- When the user is **scrubbing or playing manually**, `autoStartMic` is paused (we set `isPaused=true` upstream) so the mic doesn't start while they're listening — it resumes when they hit play on the recorder

### Wiring in `src/pages/Virasat.tsx`

- Add state: `lastQuestionAudio: string | null` (base64) and update it whenever we get audio from `virasatService.tts(...)` — both for the intro and the prefetch path
- Render `<PodcastPlayer audioBase64={lastQuestionAudio} questionText={currentQuestion} />` inside the interview card, just below the question text
- The auto-play behavior continues to use the fast `playPCMAudio` path (no change in latency for the hands-free flow)
- The user can use the player to **re-listen** to the current question or pause it before moving to the next step (mic only starts when audio finishes auto-play OR when user releases pause)

## Files Changed/Created

| File | Action |
|---|---|
| `src/pages/Virasat.tsx` | Fix `canonicalUrl` → `path`. Add rich resume card. Track `lastQuestionAudio`. Render `<PodcastPlayer>` below the question. |
| `src/components/virasat/lib/audio.ts` | Add `pcmBase64ToWavBlobUrl()` helper. Keep existing `playPCMAudio` / `stopPlayback`. |
| **NEW** `src/components/virasat/PodcastPlayer.tsx` | Play/pause/seek/replay/speed mini-player using HTMLAudioElement |
| **NEW** `src/components/virasat/ContinueStoryCard.tsx` | Resume preview card (title, count, status, last question, two buttons) |

No edge-function changes, no migrations, no new dependencies.

## Limitations

- Pausing the mini-player mid-question doesn't "rewind" the conversation state — it only controls audio playback of that one question. The user can still proceed to record their answer at any time.
- WAV header overhead (44 bytes) is negligible vs. the PCM payload.
- Speed toggle (1.25×/1.5×) only affects local playback rate; it does not retrigger Gemini TTS.
- If the browser blocks autoplay (rare in same-gesture flow we already use), the user can still hit ▶︎ on the new player to listen.
