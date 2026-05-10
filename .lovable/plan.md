## Goal
Add narration controls (Play / Pause / Repeat) for the current Virasat question, and a toggle to view the same question in Hindi (Devanagari) script.

## Changes

### 1. `src/pages/Virasat.tsx` — Question card controls
Right under the current question bubble (around line 446–456), add a small toolbar with three icon buttons:

- **Play / Pause** — toggles narration of `currentQuestion`. If nothing is playing, calls TTS (using the existing `prefetchedNextAudio` if available, else `generateSpeech`) and plays via `playPCMAudio`. If playing, pauses (suspends the AudioContext). Resumes on next click.
- **Repeat** — stops current playback, re-fetches/plays narration from the start.
- **हिन्दी / Hinglish toggle** — switches the displayed question between the original Romanized text and the Devanagari Hindi version. Toggle state is per-question; default = Hinglish (current behavior). Narration always uses the original Hinglish (Gemini TTS sounds best on it) — only the on-screen text changes.

### 2. Narration state management
Replace the current fire-and-forget `playPCMAudio(...).catch(...)` in `startInterview` and `handleTranscript` with a small controller:

```ts
type NarrationState = "idle" | "loading" | "playing" | "paused";
```
Stored in a `useRef` holding `{ ctx: AudioContext, source: AudioBufferSourceNode }` so Pause/Resume work. Auto-play on new question stays enabled in voice mode (unchanged behavior); the new buttons just expose manual control.

### 3. `src/components/virasat/lib/audio.ts` — Pause-capable playback
Extend `playPCMAudio` to return a controller `{ pause(), resume(), stop(), onEnded }` instead of just a Promise. Keep a wrapper for backward compatibility.

### 4. Hindi (Devanagari) translation
Add a new action `translate` in `supabase/functions/virasat-ai/index.ts` that takes `{ text, target: "hi" }` and returns `{ text: "<Devanagari>" }` using Gemini 2.5 Flash with a strict prompt: "Convert this Romanized Hindi to Devanagari Hindi script. Output only the Devanagari text, nothing else."

Add a matching helper in `src/components/virasat/services/virasatService.ts`:
```ts
export async function translateToHindi(text: string): Promise<string>
```

In `Virasat.tsx`, cache translations in a `Map<string, string>` keyed by the original question so toggling is instant after the first fetch. Lazy-load the translation only when the user first clicks the हिन्दी toggle for a given question.

### 5. Visual style
- Buttons match the existing warm palette (`hsl(25_40%_45%)`), small pill icon buttons placed just below the question card with a subtle border.
- Show a tiny spinner inside the Play button while TTS is loading, and a small "हिन्दी अनुवाद हो रहा है…" placeholder during first-time translation.

## Out of scope
- No changes to the welcome screen, review, generating, or book modes.
- No change to question generation logic (questions are still authored in Hinglish by the model).
- No change to the recorder, written input, media attacher, or saving logic.
