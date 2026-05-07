/**
 * Removes the white background from an image using flood-fill + erosion + feathering.
 */
export const removeWhiteBackground = (imageUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Could not get canvas context')); return; }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;

      const threshold = 220;
      const isBackground = new Uint8Array(width * height);
      const queue: number[] = [];

      const isWhitish = (idx: number): boolean => {
        const p = idx * 4;
        if (data[p + 3] < 10) return true;
        return data[p] >= threshold && data[p + 1] >= threshold && data[p + 2] >= threshold;
      };

      const tryEnqueue = (x: number, y: number) => {
        const idx = y * width + x;
        if (isBackground[idx]) return;
        if (isWhitish(idx)) { isBackground[idx] = 1; queue.push(x, y); }
      };

      for (let x = 0; x < width; x++) { tryEnqueue(x, 0); tryEnqueue(x, height - 1); }
      for (let y = 0; y < height; y++) { tryEnqueue(0, y); tryEnqueue(width - 1, y); }

      let head = 0;
      while (head < queue.length) {
        const x = queue[head++];
        const y = queue[head++];
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) tryEnqueue(nx, ny);
          }
        }
      }

      const eroded = new Uint8Array(isBackground);
      const erosionRadius = 2;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          if (isBackground[idx]) continue;
          let nearBg = false;
          for (let dy = -erosionRadius; dy <= erosionRadius && !nearBg; dy++) {
            for (let dx = -erosionRadius; dx <= erosionRadius && !nearBg; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = x + dx, ny = y + dy;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                if (isBackground[ny * width + nx]) {
                  const p = idx * 4;
                  const brightness = (data[p] + data[p + 1] + data[p + 2]) / 3;
                  if (brightness > 200) nearBg = true;
                }
              }
            }
          }
          if (nearBg) eroded[idx] = 1;
        }
      }
      for (let i = 0; i < eroded.length; i++) isBackground[i] = eroded[i];

      const featherRadius = 3;
      const sigma = featherRadius / 2;
      const gaussWeights: number[][] = [];
      for (let dy = -featherRadius; dy <= featherRadius; dy++) {
        const row: number[] = [];
        for (let dx = -featherRadius; dx <= featherRadius; dx++) {
          row.push(Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma)));
        }
        gaussWeights.push(row);
      }

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          const p = idx * 4;
          if (isBackground[idx]) {
            data[p + 3] = 0;
          } else {
            let bgWeight = 0, totalWeight = 0, hasBgNeighbor = false;
            for (let dy = -featherRadius; dy <= featherRadius; dy++) {
              for (let dx = -featherRadius; dx <= featherRadius; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                  const w = gaussWeights[dy + featherRadius][dx + featherRadius];
                  totalWeight += w;
                  if (isBackground[ny * width + nx]) { bgWeight += w; hasBgNeighbor = true; }
                }
              }
            }
            if (hasBgNeighbor && totalWeight > 0) {
              const bgRatio = bgWeight / totalWeight;
              const brightness = (data[p] + data[p + 1] + data[p + 2]) / 3;
              if (brightness > 220) {
                const alpha = Math.round((1 - bgRatio) * ((255 - brightness) / 35) * 255);
                data[p + 3] = Math.max(0, Math.min(255, alpha));
              } else if (brightness > 180) {
                const alpha = Math.round(255 * (1 - bgRatio * 0.5));
                data[p + 3] = Math.max(0, Math.min(255, alpha));
              } else {
                const alpha = Math.round(255 * (1 - bgRatio * 0.15));
                data[p + 3] = Math.max(0, Math.min(255, alpha));
              }
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (err) => { console.error('Image load error:', err); reject(err); };
    img.src = imageUrl;
  });
};
