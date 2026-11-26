// Crops a generated image to an exact aspect ratio. Neither the Lovable gateway nor Gemini can be
// relied on to honour a requested ratio (gateway: undocumented passthrough; direct Gemini: this
// project's keys have no image-generation quota — see ai-app/index.ts), so this guarantees the
// ratio the caller asked for regardless of what the model actually returned, instead of depending
// on an upstream behaviour nothing here can control.
import { Image } from "jsr:@matmen/imagescript@^3.20.2";

const RATIO: Record<string, [number, number]> = {
  "1:1": [1, 1],
  "16:9": [16, 9],
  "9:16": [9, 16],
  "4:3": [4, 3],
  "3:4": [3, 4],
  "3:2": [3, 2],
  "2:3": [2, 3],
  "21:9": [21, 9],
};

/** btoa(String.fromCharCode(...bytes)) blows the call-stack on anything but tiny arrays; this
 *  encodes in chunks instead. */
function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}

/** Center-crops a data: URL to the given ratio (e.g. "16:9"). Returns the input unchanged if the
 *  ratio is unrecognised, already matches closely enough, or anything about decoding/cropping
 *  fails — an uncropped image beats losing the whole generation over a cosmetic mismatch. */
export async function cropToAspect(dataUrl: string, aspectRatio: string): Promise<string> {
  const target = RATIO[aspectRatio];
  const match = dataUrl.match(/^data:([^;]+);base64,([\s\S]*)$/);
  if (!target || !match) return dataUrl;
  try {
    const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
    const img = await Image.decode(bytes);
    const [rw, rh] = target;
    const targetRatio = rw / rh;
    const currentRatio = img.width / img.height;
    if (Math.abs(currentRatio - targetRatio) / targetRatio < 0.005) return dataUrl; // close enough already
    let cropW = img.width;
    let cropH = img.height;
    if (currentRatio > targetRatio) cropW = Math.round(img.height * targetRatio);
    else cropH = Math.round(img.width / targetRatio);
    const x = Math.floor((img.width - cropW) / 2);
    const y = Math.floor((img.height - cropH) / 2);
    img.crop(x, y, cropW, cropH);
    const out = await img.encodePNG();
    console.log(`[cropImage] cropped to ${aspectRatio}: now ${img.width}x${img.height}`);
    return `data:image/png;base64,${toBase64(out)}`;
  } catch (e) {
    console.error("[cropImage] failed, returning uncropped:", e instanceof Error ? e.message : String(e));
    return dataUrl;
  }
}
