
# Virasat v2 — Personalized Family Keepsake

Reframing Virasat from "publishable book" to **a private, personal keepsake for the storyteller's children**. Adds media (photos/videos/voice clips), a typing path for non-speakers, a much richer voice recorder UX, one-click PDF, and full admin visibility.

---

## 1. Database & Storage

### Migration — recreate `virasat_sessions` (was dropped) + add media table

```sql
-- Sessions (recreated, with extra fields for personalization)
CREATE TABLE public.virasat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'in_progress', -- in_progress | completed
  book_style text NOT NULL DEFAULT 'emotional', -- emotional | factual | legacy
  input_mode text NOT NULL DEFAULT 'voice',    -- voice | write | mixed
  child_name text,                              -- "Mere bachche Aarav ke naam"
  father_name text,
  history jsonb NOT NULL DEFAULT '[]'::jsonb,   -- [{role, text, audio_path?, media_ids?[]}]
  current_question text,
  question_count int NOT NULL DEFAULT 0,
  book_content text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.virasat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sessions" ON public.virasat_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all sessions" ON public.virasat_sessions
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Moderators view all sessions" ON public.virasat_sessions
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'moderator'));

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.virasat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Media attached to a session (per-question or chapter)
CREATE TABLE public.virasat_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.virasat_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  question_index int,           -- which Q&A this attaches to (null = general)
  chapter text,                 -- optional chapter slug for book layout
  media_type text NOT NULL,     -- image | video | audio
  storage_path text NOT NULL,   -- path in 'virasat-media' bucket
  caption text,
  duration_seconds numeric,     -- for audio/video
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.virasat_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own media" ON public.virasat_media
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all media" ON public.virasat_media
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Moderators view all media" ON public.virasat_media
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'moderator'));

-- Private bucket for media
INSERT INTO storage.buckets (id, name, public)
  VALUES ('virasat-media', 'virasat-media', false);

-- Storage policies: users can RW their own folder (path prefix = user_id)
CREATE POLICY "Users upload own virasat media" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'virasat-media' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Users read own virasat media" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'virasat-media' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Users delete own virasat media" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'virasat-media' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Admins read all virasat media" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'virasat-media' AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator'))
  );
```

> Using a private bucket and signed URLs keeps the keepsake personal — only the storyteller (and admins) can see it. Good fit for "for their kids" framing.

---

## 2. Voice Recorder v2 (`src/components/virasat/VoiceRecorder.tsx`)

Rebuild with:

- **Live waveform**: `MediaRecorder` + `AudioContext` `AnalyserNode` → animated bars on canvas.
- **Mic level meter**: RMS bar above the stop button.
- **Live transcript**: existing Web Speech transcript, now shown in a **larger, scrollable panel** with interim vs final styling.
- **Duration HH:MM:SS** ticking while recording.
- **Retake flow**: after stopping, show **Preview** state with:
  - Playback of the captured audio (HTML `<audio controls>`)
  - Editable transcript textarea
  - Buttons: **Use this** / **Retake** / **Discard**
- **Saves audio clip** to `virasat-media` bucket on "Use this", attaches `audio_path` to the corresponding history message.
- Fallback messaging when SpeechRecognition unavailable, with a clear "Switch to typing" CTA that toggles the parent into write mode.

API stays `onTranscript(text, audioBlob?)` — backwards compatible.

---

## 3. Written input mode (`src/components/virasat/WrittenInput.tsx`)

- Large, calm textarea ("Likhiye apni yaad…") with placeholder rotating prompts.
- Same flow: text → `refineResponse` → next AI question → saved to history.
- Toggle button on the welcome screen and inside the interview header: **🎙 Bolna / ✍️ Likhna**. Per-message mode is allowed (`input_mode = 'mixed'`).

---

## 4. Media attachments (`src/components/virasat/MediaAttacher.tsx`)

Inline below each AI question:
- **+ Photo** (image/*), **+ Video** (video/*, ≤50MB), **+ Voice clip** (uses VoiceRecorder in audio-only mode).
- Drag-drop supported.
- Uploads to `virasat-media/{user_id}/{session_id}/{uuid}.{ext}`.
- Inserts into `virasat_media` with `question_index` = current Q.
- Thumbnails appear in the conversation bubble; click to preview.

---

## 5. Book generation, now personalized & illustrated

### Edge function `virasat-ai` updates
- `generateBook` accepts `child_name`, `father_name`, and `media_summaries` (an array of `{question_index, type, caption}`). System prompt emphasizes:
  - Direct address to child by name.
  - Reference attached photos/clips with captions like *"(Yahan us din ki tasveer lagi hai — chhat par.)"*.
  - **Not** a publication; a private letter/keepsake. Remove publication-style framing.
- `book` response now also returns `chapters: [{slug, title, body}]` (parsed) so the UI can interleave media.

### `BookView.tsx`
- Renders chapters and inserts each chapter's attached media inline (image gallery, embedded `<video>`, `<audio>`).
- New header card: **"Ek tohfa — {childName} ke liye, {fatherName} se"**.
- Action bar: **Download PDF**, **Share with family**, **Print**.

---

## 6. One-click PDF download

Add `jspdf` + `html2canvas` (lighter than puppeteer route). New util `src/components/virasat/lib/pdfExport.ts`:

```ts
export async function exportVirasatToPdf(rootEl: HTMLElement, fileName: string) {
  const canvas = await html2canvas(rootEl, { scale: 2, useCORS: true, backgroundColor: '#fdfaf6' });
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  // paginate canvas across A4 pages
  ...
  pdf.save(fileName);
}
```

- Triggered from BookView's **Download PDF** button (replaces `window.print()`).
- Includes embedded photos (already in DOM); videos render as a poster frame + a short caption "Video: open digital book to play".
- Filename: `Virasat-{childName or 'Mere-Bachche'}.pdf`.

---

## 7. Admin panel — Virasat archive

New tab in `src/pages/AdminDashboard.tsx`: **"Virasat"** (icon `BookHeart`), gated on `!isViewOnly` for download but viewable by moderators.

New component `src/components/admin/VirasatArchive.tsx`:
- Table of all `virasat_sessions` (user email, status, question_count, book_style, updated_at).
- Row click → Drawer with:
  - **Transcripts**: full conversation history with per-turn audio playback (signed URLs).
  - **Media gallery**: thumbnails of all attached photos/videos/voice clips.
  - **Generated book**: rendered `BookView` (read-only) + Download PDF.
- Uses service-side queries via existing admin RLS (admin/moderator SELECT policies above).

---

## 8. Page flow (`src/pages/Virasat.tsx`) updates

- Welcome step adds two inputs: **child's name** and optional **your name**, plus a **mode toggle** (Voice / Write).
- Interview screen: input area swaps between `VoiceRecorder` and `WrittenInput` based on toggle; `MediaAttacher` always available.
- Save logic extended to persist `child_name`, `father_name`, `input_mode`, and per-message `audio_path` / `media_ids` after each turn (already debounced through `saveSession`).
- Resume card unchanged but now also restores names and mode.

---

## 9. Files created / edited

**New**
- `supabase/migrations/<timestamp>_virasat_v2.sql`
- `src/components/virasat/WrittenInput.tsx`
- `src/components/virasat/MediaAttacher.tsx`
- `src/components/virasat/lib/pdfExport.ts`
- `src/components/admin/VirasatArchive.tsx`

**Edited**
- `src/components/virasat/VoiceRecorder.tsx` (waveform/duration/retake/preview/audio upload)
- `src/components/virasat/BookView.tsx` (personalization header, media inline, PDF button)
- `src/components/virasat/services/virasatService.ts` (extra params for `generateBook`)
- `src/pages/Virasat.tsx` (names, mode toggle, media wiring)
- `supabase/functions/virasat-ai/index.ts` (personalization + media-aware prompt)
- `src/pages/AdminDashboard.tsx` (new Virasat tab)
- `src/integrations/supabase/types.ts` (auto-regenerated after migration)
- `package.json` (`jspdf`, `html2canvas`)

---

## 10. Notes & limitations

- Video file size capped at ~50MB client-side (Supabase Storage default per-upload limit on the free tier; the bucket is private so no CDN concerns).
- PDF rendering of videos is a poster frame only (PDF doesn't play video); the digital book remains the canonical experience.
- Web Speech API live transcript stays Chrome-best; the **Write** mode is a first-class fallback so non-Chrome users (and quiet households) are fully covered.
- Admin can view all media via signed URLs but cannot edit the content — read-only by design to respect the family's keepsake.

