import React, { useState } from 'react';
import { GeneratedImage, BackgroundConfig, PlacementConfig } from '../types';
import BackgroundSelector from '../BackgroundSelector';
import PlacementControls from '../PlacementControls';
import BackgroundCompositor, { compositeToCanvas, loadImage } from '../BackgroundCompositor';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const ASPECT_RATIOS = [
  { name: '1:1 (Square)', value: '1/1' },
  { name: '4:5 (Vertical)', value: '4/5' },
  { name: '9:16 (Full Screen)', value: '9/16' },
  { name: '16:9 (Landscape)', value: '16/9' },
  { name: '3:2', value: '3/2' },
];

const RESOLUTION_OPTIONS = [
  { name: 'Standard (1024px)', value: 1024 },
  { name: 'HD (2048px)', value: 2048 },
  { name: '4K (3840px)', value: 3840 },
];

interface Props {
  images: GeneratedImage[];
  productName: string;
}

const BackgroundStudioView: React.FC<Props> = ({ images, productName }) => {
  const [selectedImage, setSelectedImage] = useState<GeneratedImage>(images[0]);
  const [background, setBackground] = useState<BackgroundConfig>({ type: 'preset', value: '', label: '' });
  const [placement, setPlacement] = useState<PlacementConfig>({ scale: 80, posX: 50, posY: 50 });
  const [aspectRatio, setAspectRatio] = useState('1/1');
  const [resolution, setResolution] = useState(2048);
  const [downloading, setDownloading] = useState(false);

  const downloadAll = async () => {
    if (!background.value) return;
    setDownloading(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('background_studio');
      for (const img of images) {
        const productImg = await loadImage(img.url);
        let bgImg: HTMLImageElement | null = null;
        if (background.type !== 'solid' && background.value !== 'transparent') bgImg = await loadImage(background.value);
        const canvas = document.createElement('canvas');
        compositeToCanvas(canvas, bgImg, productImg, background, placement, aspectRatio, resolution);
        const blob = await new Promise<Blob>((res, rej) => {
          canvas.toBlob(b => b ? res(b) : rej(new Error('toBlob failed')), 'image/png');
        });
        folder?.file(`${productName}_${img.angle.replace(/\s+/g, '_')}_studio.png`, blob);
      }
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${productName}_studio.zip`);
    } catch (err) { console.error('Download failed:', err); }
    finally { setDownloading(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1 space-y-6 bg-muted/30 p-4 rounded-xl border border-border">
        <BackgroundSelector value={background} onChange={setBackground} />
        <div className="border-t border-border pt-4">
          <PlacementControls value={placement} onChange={setPlacement} />
        </div>
        <div className="border-t border-border pt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium mb-2">Aspect Ratio</label>
            <select className="w-full bg-background border border-border rounded-md p-2 text-sm"
              value={aspectRatio} onChange={e => setAspectRatio(e.target.value)}>
              {ASPECT_RATIOS.map(o => <option key={o.value} value={o.value}>{o.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-2">Resolution</label>
            <select className="w-full bg-background border border-border rounded-md p-2 text-sm"
              value={resolution} onChange={e => setResolution(parseInt(e.target.value))}>
              {RESOLUTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.name}</option>)}
            </select>
          </div>
        </div>
        <button onClick={downloadAll} disabled={downloading || !background.value}
          className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground py-2.5 rounded-lg font-medium transition-colors">
          {downloading ? 'Zipping...' : 'Download All with Background'}
        </button>
      </div>

      <div className="lg:col-span-2">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">{selectedImage.angle}</h3>
          <p className="text-xs text-muted-foreground">
            {background.value ? `Background: ${background.label || background.value}` : 'Select a background to start'}
          </p>
        </div>
        {background.value ? (
          <BackgroundCompositor
            productImageUrl={selectedImage.url} background={background} placement={placement}
            aspectRatio={aspectRatio} resolution={Math.min(resolution, 1024)} />
        ) : (
          <div className="w-full rounded-2xl overflow-hidden shadow-lg flex items-center justify-center bg-muted"
            style={{ aspectRatio: aspectRatio.replace('/', ' / ') }}>
            <p className="text-sm text-muted-foreground">Choose a background from the sidebar</p>
          </div>
        )}
      </div>

      <div className="lg:col-span-1">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Select Angle</h3>
        <div className="grid grid-cols-3 lg:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto pr-1">
          {images.map(img => (
            <div key={img.id} onClick={() => setSelectedImage(img)}
              className={`relative cursor-pointer rounded-xl overflow-hidden aspect-square transition-all
                ${selectedImage.id === img.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-95' : 'hover:scale-105'}`}
              style={{ background: 'repeating-conic-gradient(hsl(var(--muted)) 0% 25%, hsl(var(--background)) 0% 50%) 50% / 10px 10px' }}>
              <img src={img.url} alt={img.angle} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BackgroundStudioView;
