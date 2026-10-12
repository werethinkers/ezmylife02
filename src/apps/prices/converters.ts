// Display prices (credits per use). Converters run in the browser, so they cost the minimum:
// 1 credit, which covers 30 minutes of use (see UsageGate). No server instructions.
export const converters: Record<string, number> = {
  "jpg-to-pdf": 1,
  "pdf-to-jpg": 1,
  "merge-pdf": 1,
  "split-pdf": 1,
  "rotate-pdf": 1,
  "pdf-to-text": 1,
  "heic-to-jpg": 1,
  "webp-to-jpg": 1,
  "png-to-jpg": 1,
  "image-to-webp": 1,
};
