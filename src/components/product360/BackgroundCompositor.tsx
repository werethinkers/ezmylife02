import React, { useRef, useEffect, useCallback } from 'react';
import { BackgroundConfig, PlacementConfig } from './types';

interface BackgroundCompositorProps {
  productImageUrl: string;
  background: BackgroundConfig;
  placement: PlacementConfig;
  aspectRatio: string;
  resolution: number;
  className?: string;
}

export const compositeToCanvas = (
  canvas: HTMLCanvasElement,
  bgImage: HTMLImageElement | null,
  productImage: HTMLImageElement,
  background: BackgroundConfig,
  placement: PlacementConfig,
  aspectRatio: string,
  resolution: number
): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const [rW, rH] = aspectRatio.split('/').map(Number);
  const w = resolution;
  const h = Math.round(w * (rH / rW));
  canvas.width = w;
  canvas.height = h;

  if (background.value === 'transparent') {
    ctx.clearRect(0, 0, w, h);
  } else if (background.type === 'solid') {
    ctx.fillStyle = background.value;
    ctx.fillRect(0, 0, w, h);
  } else if (bgImage) {
    const bgRatio = bgImage.width / bgImage.height;
    const canvasRatio = w / h;
    let sx = 0, sy = 0, sw = bgImage.width, sh = bgImage.height;
    if (bgRatio > canvasRatio) {
      sw = bgImage.height * canvasRatio;
      sx = (bgImage.width - sw) / 2;
    } else {
      sh = bgImage.width / canvasRatio;
      sy = (bgImage.height - sh) / 2;
    }
    ctx.drawImage(bgImage, sx, sy, sw, sh, 0, 0, w, h);
  }

  const scale = placement.scale / 100;
  const imgRatio = productImage.width / productImage.height;
  const canvasRatio = w / h;

  let drawW: number, drawH: number;
  if (imgRatio > canvasRatio) {
    drawW = w * 0.8 * scale;
    drawH = drawW / imgRatio;
  } else {
    drawH = h * 0.8 * scale;
    drawW = drawH * imgRatio;
  }

  const x = (w - drawW) * (placement.posX / 100);
  const y = (h - drawH) * (placement.posY / 100);
  ctx.drawImage(productImage, x, y, drawW, drawH);
};

export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

const BackgroundCompositor: React.FC<BackgroundCompositorProps> = ({
  productImageUrl, background, placement, aspectRatio, resolution, className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const render = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const productImg = await loadImage(productImageUrl);
      let bgImg: HTMLImageElement | null = null;
      if (background.type !== 'solid' && background.value !== 'transparent') {
        bgImg = await loadImage(background.value);
      }
      compositeToCanvas(canvas, bgImg, productImg, background, placement, aspectRatio, resolution);
    } catch (err) { console.error('Compositor render error:', err); }
  }, [productImageUrl, background, placement, aspectRatio, resolution]);

  useEffect(() => { render(); }, [render]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-auto rounded-xl shadow-lg ${className}`}
      style={{ aspectRatio: aspectRatio.replace('/', ' / ') }}
    />
  );
};

export default BackgroundCompositor;
