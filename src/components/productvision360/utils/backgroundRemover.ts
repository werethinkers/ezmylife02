// Removes a near-white background from an image and returns a transparent PNG data URL.
// Runs entirely client-side via canvas. Tunable luminance threshold.
export async function removeWhiteBackground(
  dataUrl: string,
  opts: { threshold?: number; feather?: number } = {},
): Promise<string> {
  const threshold = opts.threshold ?? 240;
  const feather = opts.feather ?? 10;
  const img = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i], g = px[i + 1], b = px[i + 2];
    const min = Math.min(r, g, b);
    if (min >= threshold) {
      px[i + 3] = 0;
    } else if (min >= threshold - feather) {
      const alpha = 1 - (min - (threshold - feather)) / feather;
      px[i + 3] = Math.round(px[i + 3] * alpha);
    }
  }
  ctx.putImageData(data, 0, 0);
  return canvas.toDataURL("image/png");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
