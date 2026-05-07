// Composites a (transparent) product image onto a chosen background, with optional logo.
export interface CompositeOptions {
  background: { kind: "color"; color: string } | { kind: "image"; src: string };
  productSrc: string;       // transparent PNG
  productScale?: number;    // 0..1, fraction of canvas height
  productX?: number;        // 0..1 center
  productY?: number;        // 0..1 center
  logo?: {
    src: string;
    scale: number;          // 0..1 fraction of canvas width
    x: number;              // 0..1
    y: number;              // 0..1
    opacity?: number;
  };
  width?: number;
  height?: number;
}

export async function compositeImage(opts: CompositeOptions): Promise<string> {
  const W = opts.width ?? 1024;
  const H = opts.height ?? 1024;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  if (opts.background.kind === "color") {
    ctx.fillStyle = opts.background.color;
    ctx.fillRect(0, 0, W, H);
  } else {
    const bg = await loadImage(opts.background.src);
    drawCover(ctx, bg, W, H);
  }

  const product = await loadImage(opts.productSrc);
  const scale = opts.productScale ?? 0.85;
  const targetH = H * scale;
  const targetW = (product.naturalWidth / product.naturalHeight) * targetH;
  const cx = (opts.productX ?? 0.5) * W;
  const cy = (opts.productY ?? 0.55) * H;
  ctx.drawImage(product, cx - targetW / 2, cy - targetH / 2, targetW, targetH);

  if (opts.logo) {
    const logo = await loadImage(opts.logo.src);
    const lW = W * opts.logo.scale;
    const lH = (logo.naturalHeight / logo.naturalWidth) * lW;
    const lx = opts.logo.x * W - lW / 2;
    const ly = opts.logo.y * H - lH / 2;
    ctx.globalAlpha = opts.logo.opacity ?? 1;
    ctx.drawImage(logo, lx, ly, lW, lH);
    ctx.globalAlpha = 1;
  }

  return canvas.toDataURL("image/png");
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, W: number, H: number) {
  const ir = img.naturalWidth / img.naturalHeight;
  const cr = W / H;
  let dw = W, dh = H, dx = 0, dy = 0;
  if (ir > cr) {
    dh = H; dw = H * ir; dx = (W - dw) / 2;
  } else {
    dw = W; dh = W / ir; dy = (H - dh) / 2;
  }
  ctx.drawImage(img, dx, dy, dw, dh);
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
