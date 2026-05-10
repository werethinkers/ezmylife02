// Lazy-loaded ffmpeg.wasm transcoder: webm -> mp4 (AAC).
// Best-effort; returns null on any failure so callers can fall back gracefully.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ffmpegInstance: any | null = null;
let loadingPromise: Promise<unknown> | null = null;

const FFMPEG_VERSION = "0.12.10";
const UTIL_VERSION = "0.12.1";
const CORE_VERSION = "0.12.6";

async function getFFmpeg() {
  if (ffmpegInstance) return ffmpegInstance;
  if (loadingPromise) {
    await loadingPromise;
    return ffmpegInstance;
  }
  loadingPromise = (async () => {
    // Dynamic ESM import from CDN — avoids npm install.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const ffmpegMod = await import(/* @vite-ignore */ `https://esm.sh/@ffmpeg/ffmpeg@${FFMPEG_VERSION}`);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const utilMod = await import(/* @vite-ignore */ `https://esm.sh/@ffmpeg/util@${UTIL_VERSION}`);
    const FFmpeg = ffmpegMod.FFmpeg;
    const toBlobURL = utilMod.toBlobURL;
    const ff = new FFmpeg();
    const baseURL = `https://esm.sh/@ffmpeg/core@${CORE_VERSION}/dist/umd`;
    await ff.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegInstance = ff;
    // expose util for the writer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ffmpegInstance as any).__fetchFile = utilMod.fetchFile;
  })();
  await loadingPromise;
  loadingPromise = null;
  return ffmpegInstance;
}

export async function transcodeWebmToMp4(blob: Blob): Promise<Blob | null> {
  try {
    const ff = await getFFmpeg();
    if (!ff) return null;
    const inName = `in-${Date.now()}.webm`;
    const outName = `out-${Date.now()}.mp4`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await (ff as any).__fetchFile(blob);
    await ff.writeFile(inName, data);
    // -vn: no video; encode audio as AAC at 128k into mp4 container.
    await ff.exec(["-i", inName, "-vn", "-c:a", "aac", "-b:a", "128k", outName]);
    const out = await ff.readFile(outName);
    try { await ff.deleteFile(inName); } catch { /* ignore */ }
    try { await ff.deleteFile(outName); } catch { /* ignore */ }
    // out is Uint8Array
    const u8 = out as Uint8Array;
    const ab = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer;
    return new Blob([ab], { type: "audio/mp4" });
  } catch (e) {
    console.warn("[audioTranscode] webm->mp4 failed:", e);
    return null;
  }
}
