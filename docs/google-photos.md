# Google Photos picker

"From Google Photos" buttons let people bring their own photos into cards and tools without downloading them first.

**Where:** instant cards (single photo and gallery fields, `src/instant/builder/FieldInput.tsx`), Virasat media attacher, Passport Photo Maker. To add it elsewhere, drop in `<GooglePhotosButton max={n} onFiles={(files) => ...} />` from `src/components/GooglePhotosPicker.tsx`. It hands back normal `File`s, so reuse the page's existing upload code.

**How it works:** Google removed library-wide access in March 2025. The Picker API shows Google's own photo screen; we only receive the photos the person chooses. Scope used: `photospicker.mediaitems.readonly` only. Sign-in is client-side (Google Identity Services), the token stays in memory, the session is deleted after import. Photos are requested at 2048px (always JPEG), then go through the normal `shrinkImage` / upload path.

**Switch it on (one-time, by the owner of the Google account):**
1. Google Cloud Console: create or pick a project, enable **Google Photos Picker API**.
2. OAuth consent screen: add the scope `.../auth/photospicker.mediaitems.readonly`; add test users until verification is approved.
3. Credentials, OAuth client ID, type **Web application**. Authorized JavaScript origins: `https://ezyourlife.com`, `https://ezmylife02.lovable.app`, `http://localhost:8080` (or the dev port).
4. Set `VITE_GOOGLE_PHOTOS_CLIENT_ID` to that client id (it is public, not a secret) in the Lovable project environment, then Publish. Until it is set, the buttons are hidden.
5. Deploy the `google-photos-fetch` function (fallback used only if the browser blocks the direct Google download).

**Not tested against live Google yet** (needs the client id). First check after enabling: pick one photo in a card and one in a gallery on a phone and a laptop. If the direct download is blocked by CORS the fallback function takes over; if neither works the dialog shows an error.
