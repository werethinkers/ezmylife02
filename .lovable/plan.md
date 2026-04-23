

# Remove Cloud Run Tools + Add Virasat (Father's Legacy Storyteller)

Two parts: a small cleanup, plus the full Virasat tool with persistence, pre-generation review, and near-instant turn-taking.

---

## Part 1: Remove all `*.run.app` tools (keep Pi7)

In `src/data/tools.tsx`, the `toolUrls` map has ~40 Cloud Run entries. **All will be removed:**

`ai-invoice-generator`, `jain-audio-stream`, `jain-video-stream`, `jaingyan-ai`, `advance-ai-bot`, `shastra-pdf-reader`, `jain-encyclopedia`, `jain-panchang`, `shastra-multi-pdf-ai-bot`, `quiz`, `image-creator`, `storybook-creator`, `advance-text-extractor`, `create-3d-images`, `sketchflow-ai`, `speedy-notebook` (the cloud run one — native `/notebook` stays), `rich-editor`, `pdf-chart-image-extractor`, `shastra-hover-dictionary`, `html-editor`, `wrong-written-words`, `book-editor`, `book-editor-html`, `ocr`, `dictionary-extractor-ai`, `pdf-profile-extractor`, `pdf-metadata-ai-analyst`, `soul-mirror`, `cognimap`, `ai-data-analysis`, `kundkund-ebook-bot`, `kundkund-mindmap`, `jain-ganit`, `jainbhugol-maps`, `interactive-videos`, `smart-diagram-ai`, `auto-text-extractor`.

**Kept untouched:** all Pi7 tools, ToolFK ID photo, native React tools, DB-catalog tools, AI Invoice Generator (`tool-1` native version stays).

I'll also remove their corresponding entries from the `tools` array (so they don't appear in browse/search) and clean `expandedTools.tsx` if any references remain.

---

## Part 2: Add Virasat — A Father's Legacy

A premium native tool at `/virasat` for fathers to record life stories in podcast style; AI generates a heartfelt book for their children.

### Improvements over the original AI Studio app

| Original | Virasat on EZYOURLIFE |
|---|---|
| State lost on refresh | Every Q&A persisted instantly to Supabase |
| Hard 15-question cap | Unlimited; AI progresses chapter-by-chapter; user clicks "Done" when ready |
| Book generated blindly | **Bird's-eye Review screen first** — see all stories, edit/delete, change style, see chapter outline |
| ~3-5s gap between turns | <2s gap (parallel refine + nextQ + TTS pre-fetch) |
| Auto-restart only | "Pause" button so user can think before next question |
| In-browser only Gemini key | DB-backed key rotation via edge function |

### Routes & files

**New route:** `/virasat` (wrapped in `PremiumRoute`, like Startup Analyser).

**New files:**
- `src/pages/Virasat.tsx` — shell with modes: `welcome → interview → review → generating → book`
- `src/components/virasat/VoiceRecorder.tsx` — ported from upload (Web Speech API, hi-IN, with Pause button added)
- `src/components/virasat/BookView.tsx` — ported from upload (ReactMarkdown chapter renderer)
- `src/components/virasat/ReviewPanel.tsx` — **new** bird's-eye view
- `src/components/virasat/lib/audio.ts` — ported PCM player
- `src/components/virasat/services/virasatService.ts` — wraps edge-function calls
- `supabase/functions/virasat-ai/index.ts` — single edge function with action-based routing
- New SQL migration

**Edited files:**
- `src/App.tsx` — add `/virasat` route
- `src/data/tools.tsx` — remove `*.run.app` tools (Part 1)
- `supabase/config.toml` — register `virasat-ai` function
- `src/components/Navbar.tsx` — add "Virasat" link for premium users (optional)

### Edge function (`virasat-ai`) actions

Single endpoint, switched by `action` field in body. All use the existing **DB-backed Gemini key rotation** pattern (same as `notebook-ai`).

| action | model | purpose |
|---|---|---|
| `next_question` | gemini-2.5-flash | uses `SYSTEM_INSTRUCTION` from uploaded `gemini.ts`; returns next conversational question |
| `refine_response` | gemini-2.5-flash | cleans raw Hindi/Hinglish transcript into narrative prose |
| `tts` | gemini-2.5-flash-preview-tts | returns base64 PCM (voice: Kore) |
| `chapter_outline` | gemini-2.5-flash | for Review screen — produces ordered list of chapter titles + 1-line synopsis |
| `generate_book` | gemini-2.5-pro | uses full conversation verbatim; sticks strictly to user's stories; returns markdown book |

The system prompt and book-generation prompts come **directly from the uploaded `services/gemini.ts`** (preserved verbatim so the warmth/tone is unchanged).

### Database migration

```sql
CREATE TABLE public.virasat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Meri Kahani',
  book_style text NOT NULL DEFAULT 'emotional',  -- emotional|factual|legacy
  conversation jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{role,text,createdAt}]
  chapter_outline jsonb,
  book_content text,
  status text NOT NULL DEFAULT 'recording', -- recording|reviewing|generating|done
  question_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE virasat_sessions ENABLE ROW LEVEL SECURITY;

-- Owner CRUD
CREATE POLICY "owner_all" ON virasat_sessions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Admin/moderator read-only
CREATE POLICY "admin_read" ON virasat_sessions FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator'));

CREATE INDEX idx_virasat_user ON virasat_sessions(user_id, updated_at DESC);

-- Register in catalog
INSERT INTO tools_catalog (id, name, description, category, source, is_live, is_premium, dedicated_route, display_order)
VALUES ('virasat', 'Virasat — A Father''s Legacy',
        'Record your life stories by voice; AI turns them into a beautiful book for your children.',
        'AI Agent', 'native', true, true, '/virasat', 5);
```

### Persistence flow (no data loss)

```
User answers → onTranscript fires
   ├─→ append {role:'user', text:refined} to local state
   ├─→ debounced upsert (300ms) to virasat_sessions.conversation
   └─→ also save question_count + status
On every chapter advance → save current_chapter
On revisit /virasat → query for status≠'done' session → show "Continue your story" card
```

### Bird's-eye Review screen (before book generation)

Triggered by clicking "Bas itna hi, ab review karein" instead of the old "make book" button.

```
┌────────────────────────────────────────┐
│  📖 Aapki kahani ka jaiza               │
├────────────────────────────────────────┤
│  Style: ⦿ Dil se  ○ Sahi yaadein  ○ Seekh │
│                                         │
│  AI Chapter Outline (preview)           │
│  ─────────────────────────────          │
│  1. Bachpan       — "Aapka pehla ghar…"│
│  2. Jawaani        — "Naye sapne…"      │
│  3. Sangharsh     — "Mushkil samay…"   │
│  4. Parivaar      — "Pyaar mila…"      │
│  5. Mere bachche  — "Beta, yaad rakhna"│
│                                         │
│  Your Stories (24 recorded)             │
│  ─────────────────────────────          │
│  ☑ Q: "Bachpan ki yaad?"               │
│     A: "Mere papa ne mujhe…" [edit][❌]  │
│  ☑ Q: "Sabse mushkil pal?"             │
│     A: "Jab pitaji nahi rahe…" [edit][❌]│
│  ☑ … (all 24 listed)                   │
│                                         │
│  [← Aur stories add karein]            │
│  [✨ Kitaab banayein]                   │
└────────────────────────────────────────┘
```

User can: change style, delete weak answers, edit refined text, see chapter preview before committing. Hitting "Kitaab banayein" calls `generate_book`.

### Sub-2-second turn-taking

```
User stops speaking
  ├─ Parallel batch (Promise.all):
  │     ├─ refineResponse(raw)
  │     ├─ getNextQuestion(history + raw)   ← uses raw, not refined, for speed
  │     └─ Pre-fetch TTS for next question (kicked off as soon as nextQ resolves)
  ├─ Save to DB (fire-and-forget, non-blocking)
  ├─ Render next question (~1-1.5s)
  ├─ Show "Pause" button + auto-resume countdown (2s)
  └─ Play TTS, then auto-restart mic (unless user paused)
```

### Unlimited but progressive

Question limit removed. The AI's system instruction is augmented to track which **life chapter** it's currently exploring (childhood → youth → struggle → family → wisdom → message-to-child) and only advances when 2-4 follow-ups in the current chapter are done. The user always sees a "Bas itna hi, review karein" button to stop whenever they want — even at question 5 or question 200.

### Story-grounded book

The `generate_book` prompt (taken verbatim from uploaded `gemini.ts`) already enforces **STRICT FIDELITY: "Do not add any external facts, stories, or events that the user did not mention."** I'll keep this unchanged and pass the full refined conversation history.

---

## Files Changed/Created

| File | Action |
|---|---|
| `src/data/tools.tsx` | Remove all `*.run.app` URL entries + their tool array entries |
| `src/pages/Virasat.tsx` | **New** — main shell |
| `src/components/virasat/VoiceRecorder.tsx` | **New** — ported with Pause button |
| `src/components/virasat/BookView.tsx` | **New** — ported markdown renderer |
| `src/components/virasat/ReviewPanel.tsx` | **New** — bird's-eye review |
| `src/components/virasat/lib/audio.ts` | **New** — PCM player |
| `src/components/virasat/services/virasatService.ts` | **New** — edge fn wrapper + persistence |
| `supabase/functions/virasat-ai/index.ts` | **New** — 5 actions, DB key rotation |
| Migration | `virasat_sessions` table + RLS + catalog row |
| `src/App.tsx` | Add `/virasat` premium route |
| `supabase/config.toml` | Register `virasat-ai` function (verify_jwt = true) |

## Limitations

- Web Speech API STT is best on Chrome; Safari/Firefox fall back gracefully but may lose some Hindi accuracy. Optional MediaRecorder + server-side transcription path can be added later if needed.
- Gemini TTS first call adds ~500ms latency on a fresh question; we pre-fetch the next question's audio while the user is still answering to keep the perceived gap under 2s.
- Removing ~40 `*.run.app` tools will reduce the visible tool count immediately; the catalog database tools and Pi7 image tools remain.

