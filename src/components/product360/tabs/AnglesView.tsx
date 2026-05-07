import React, { useState } from 'react';
import { GeneratedImage } from '../types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface AnglesViewProps {
  images: GeneratedImage[];
  productName: string;
}

const ASPECT_RATIOS = [
  { label: '📦 E-commerce', options: [
    { name: '1:1 (Square)', value: '1/1' },
    { name: '4:5 (Vertical)', value: '4/5' },
  ]},
  { label: '📱 Social Media', options: [
    { name: '1:1', value: '1/1' },
    { name: '4:5', value: '4/5' },
    { name: '9:16', value: '9/16' },
  ]},
  { label: '🖥️ Banners', options: [
    { name: '16:9', value: '16/9' },
    { name: '3:2', value: '3/2' },
    { name: '4:3', value: '4/3' },
  ]},
];

const RESOLUTION_OPTIONS = [
  { name: 'Standard (1024px)', value: 1024 },
  { name: 'HD (2048px)', value: 2048 },
  { name: '4K (3840px)', value: 3840 },
];

const AnglesView: React.FC<AnglesViewProps> = ({ images, productName }) => {
  const originalImage = images.find(img => img.angle === 'Original');
  const generatedImages = images.filter(img => img.angle !== 'Original');
  const [selectedImage, setSelectedImage] = useState<GeneratedImage>(generatedImages[0] || originalImage!);
  const [aspectRatio, setAspectRatio] = useState('1/1');
  const [resolution, setResolution] = useState(2048);
  const [posX, setPosX] = useState(50);
  const [posY, setPosY] = useState(50);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!originalImage) return <div className="text-foreground p-4">Error: Original image not found.</div>;

  const downloadAll = async () => {
    setIsDownloading(true);
    const zip = new JSZip();
    const folder = zip.folder("product_images");

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not create canvas context');

      const [ratioW, ratioH] = aspectRatio.split('/').map(Number);
      const canvasWidth = resolution;
      const canvasHeight = canvasWidth * (ratioH / ratioW);
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ratioLabel = aspectRatio.replace('/', '-');

      const promises = images.map(img => new Promise<void>((resolve, reject) => {
        const imageObj = new Image();
        imageObj.crossOrigin = 'anonymous';
        imageObj.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const padding = 0.1;
          const maxImgWidth = canvas.width * (1 - padding * 2);
          const maxImgHeight = canvas.height * (1 - padding * 2);
          const imgRatio = imageObj.width / imageObj.height;
          const canvasRatio = maxImgWidth / maxImgHeight;
          let drawWidth, drawHeight;
          if (imgRatio > canvasRatio) { drawWidth = maxImgWidth; drawHeight = drawWidth / imgRatio; }
          else { drawHeight = maxImgHeight; drawWidth = drawHeight * imgRatio; }
          const x = (canvas.width - drawWidth) * (posX / 100);
          const y = (canvas.height - drawHeight) * (posY / 100);
          ctx.drawImage(imageObj, x, y, drawWidth, drawHeight);
          canvas.toBlob(blob => {
            if (blob) { folder?.file(`${productName}_${img.angle.replace(/\s+/g, '_')}_${ratioLabel}.png`, blob); resolve(); }
            else reject(new Error('toBlob failed'));
          }, 'image/png');
        };
        imageObj.onerror = reject;
        imageObj.src = img.url;
      }));

      await Promise.all(promises);
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${productName}_${ratioLabel}.zip`);
    } catch (e) {
      console.error("Download failed", e);
      alert("Bulk download failed. Please try again.");
    } finally { setIsDownloading(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1 space-y-6 bg-muted/30 p-4 rounded-xl border border-border">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Frame Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-2 text-foreground">Aspect Ratio</label>
              <select className="w-full bg-background border border-border rounded-md p-2 text-sm text-foreground"
                value={aspectRatio} onChange={e => setAspectRatio(e.target.value)}>
                {ASPECT_RATIOS.map(group => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map(opt => <option key={opt.name + opt.value} value={opt.value}>{opt.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-2 text-foreground">Resolution</label>
              <select className="w-full bg-background border border-border rounded-md p-2 text-sm text-foreground"
                value={resolution} onChange={e => setResolution(parseInt(e.target.value))}>
                {RESOLUTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.name}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-medium text-foreground">Image Position</label>
              <div>
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1"><span>Horizontal</span><span>{posX}%</span></div>
                <input type="range" min="0" max="100" value={posX} onChange={e => setPosX(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1"><span>Vertical</span><span>{posY}%</span></div>
                <input type="range" min="0" max="100" value={posY} onChange={e => setPosY(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
              </div>
            </div>
          </div>
        </div>
        <div className="pt-4 border-t border-border">
          <button onClick={downloadAll} disabled={isDownloading}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground py-2.5 rounded-lg font-medium transition-colors">
            {isDownloading ? 'Zipping...' : 'Download All'}
          </button>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">{selectedImage.angle}</h3>
        </div>
        <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl"
          style={{ aspectRatio: aspectRatio.replace('/', ' / '), background: 'repeating-conic-gradient(hsl(var(--muted)) 0% 25%, hsl(var(--background)) 0% 50%) 50% / 20px 20px' }}>
          <img src={selectedImage.url} alt={selectedImage.angle}
            className="w-full h-full object-contain"
            style={{ objectPosition: `${posX}% ${posY}%`, transform: 'scale(0.95)' }}
            referrerPolicy="no-referrer" />
        </div>
      </div>

      <div className="lg:col-span-1">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">All Angles</h3>
        <div className="grid grid-cols-3 lg:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto pr-2">
          {generatedImages.map(image => (
            <div key={image.id} onClick={() => setSelectedImage(image)}
              className={`relative cursor-pointer rounded-xl overflow-hidden aspect-square transition-all
                ${selectedImage.id === image.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-95' : 'hover:scale-105'}`}
              style={{ background: 'repeating-conic-gradient(hsl(var(--muted)) 0% 25%, hsl(var(--background)) 0% 50%) 50% / 10px 10px' }}>
              <img src={image.url} alt={image.angle} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end justify-center p-2">
                <span className="text-[10px] text-white font-medium">{image.angle}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnglesView;
