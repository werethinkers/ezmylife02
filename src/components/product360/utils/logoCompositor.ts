import { LogoPosition } from '../types';

export const loadImg = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const PRODUCT_FRAME_RATIO = 0.65;

export const compositeWithLogo = (
  canvas: HTMLCanvasElement,
  productImg: HTMLImageElement,
  logoImg: HTMLImageElement | null,
  logoPos: LogoPosition,
  aspectRatio: string,
  resolution: number,
) => {
  const [aw, ah] = aspectRatio.split('/').map(Number);
  const ratio = aw / ah;
  let w: number, h: number;
  if (ratio >= 1) { w = resolution; h = Math.round(resolution / ratio); }
  else { h = resolution; w = Math.round(resolution * ratio); }

  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);

  const frameSize = Math.min(w, h) * PRODUCT_FRAME_RATIO;
  const pAspect = productImg.width / productImg.height;
  let pw: number, ph: number;
  if (pAspect >= 1) { pw = frameSize; ph = frameSize / pAspect; }
  else { ph = frameSize; pw = frameSize * pAspect; }
  const px = (w - pw) / 2;
  const py = (h - ph) / 2;
  ctx.drawImage(productImg, px, py, pw, ph);

  if (logoImg) {
    const logoW = w * logoPos.scale;
    const lAspect = logoImg.width / logoImg.height;
    const logoH = logoW / lAspect;
    const lx = w * logoPos.x - logoW / 2;
    const ly = h * logoPos.y - logoH / 2;
    ctx.drawImage(logoImg, lx, ly, logoW, logoH);
  }
};
