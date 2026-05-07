import React, { useRef } from 'react';
import { BackgroundConfig } from './types';

import bg1 from '@/assets/product360-backgrounds/izzhaar_black_with_sparkle_background.png';
import bg2 from '@/assets/product360-backgrounds/izzhaar_curtain_style_background.png';
import bg3 from '@/assets/product360-backgrounds/izzhaar_curtain_sytle_with_table_background.png';
import bg4 from '@/assets/product360-backgrounds/izzhaar_og_teal_background.png';
import bg5 from '@/assets/product360-backgrounds/izzhaar_orange_sparkle_background.png';
import bg6 from '@/assets/product360-backgrounds/izzhaar_red_background.png';
import bg7 from '@/assets/product360-backgrounds/izzhaar_simple_table_background.png';
import bg8 from '@/assets/product360-backgrounds/izzhaar_table_with_asthetich_room_background.png';
import bg9 from '@/assets/product360-backgrounds/izzhaar_vase_and_sparkle_lights_background.png';

const PRESET_BACKGROUNDS: { label: string; url: string }[] = [
  { label: 'Black Sparkle', url: bg1 },
  { label: 'Curtain', url: bg2 },
  { label: 'Curtain & Table', url: bg3 },
  { label: 'Teal', url: bg4 },
  { label: 'Orange Sparkle', url: bg5 },
  { label: 'Red', url: bg6 },
  { label: 'Simple Table', url: bg7 },
  { label: 'Aesthetic Room', url: bg8 },
  { label: 'Vase & Lights', url: bg9 },
];

const SOLID_SWATCHES = [
  { label: 'White', hex: '#FFFFFF' },
  { label: 'Black', hex: '#000000' },
  { label: 'Light Gray', hex: '#F3F4F6' },
  { label: 'Cream', hex: '#FFFDD0' },
  { label: 'Sky Blue', hex: '#87CEEB' },
  { label: 'Blush', hex: '#FFB6C1' },
];

type Tab = 'presets' | 'solid' | 'custom';

interface BackgroundSelectorProps {
  value: BackgroundConfig;
  onChange: (config: BackgroundConfig) => void;
}

const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({ value, onChange }) => {
  const [activeTab, setActiveTab] = React.useState<Tab>(value.type === 'solid' ? 'solid' : value.type === 'custom' ? 'custom' : 'presets');
  const [customHex, setCustomHex] = React.useState(value.type === 'solid' ? value.value : '#FFFFFF');
  const fileRef = useRef<HTMLInputElement>(null);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'presets', label: 'Presets' },
    { key: 'solid', label: 'Solid Color' },
    { key: 'custom', label: 'Upload' },
  ];

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChange({ type: 'custom', value: reader.result as string, label: file.name });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium">Background</label>
      <div className="flex gap-1 bg-muted rounded-lg p-0.5">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 text-[10px] py-1.5 rounded-md font-medium transition-colors ${activeTab === t.key ? 'bg-background shadow-sm' : 'hover:bg-muted/70'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'presets' && (
        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
          {PRESET_BACKGROUNDS.map(bg => (
            <button
              key={bg.label}
              onClick={() => onChange({ type: 'preset', value: bg.url, label: bg.label })}
              className={`relative rounded-lg overflow-hidden aspect-square border-2 transition-all ${value.type === 'preset' && value.value === bg.url ? 'border-primary ring-1 ring-primary' : 'border-transparent hover:border-muted-foreground'}`}
            >
              <img src={bg.url} alt={bg.label} className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-black/60 text-[8px] text-white py-0.5 text-center">{bg.label}</div>
            </button>
          ))}
        </div>
      )}

      {activeTab === 'solid' && (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {SOLID_SWATCHES.map(s => (
              <button
                key={s.hex}
                onClick={() => { setCustomHex(s.hex); onChange({ type: 'solid', value: s.hex, label: s.label }); }}
                className={`w-8 h-8 rounded-full border-2 transition-all ${value.type === 'solid' && value.value === s.hex ? 'border-primary scale-110' : 'border-border'}`}
                style={{ backgroundColor: s.hex }}
                title={s.label}
              />
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={customHex}
              onChange={e => { setCustomHex(e.target.value); onChange({ type: 'solid', value: e.target.value }); }}
              className="w-8 h-8 rounded cursor-pointer border-0"
            />
            <input
              type="text"
              value={customHex}
              onChange={e => { setCustomHex(e.target.value); onChange({ type: 'solid', value: e.target.value }); }}
              className="flex-1 bg-background border border-border rounded-md px-2 py-1 text-xs font-mono"
              placeholder="#FFFFFF"
            />
          </div>
        </div>
      )}

      {activeTab === 'custom' && (
        <div className="space-y-2">
          <input ref={fileRef} type="file" accept="image/*" onChange={handleCustomUpload} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-border rounded-lg py-4 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            {value.type === 'custom' ? `✓ ${value.label || 'Custom background'}` : 'Click to upload background'}
          </button>
          {value.type === 'custom' && (
            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
              <img src={value.value} alt="Custom" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => onChange({ type: 'solid', value: 'transparent', label: 'None (Transparent)' })}
        className={`w-full text-[10px] py-1.5 rounded-md border transition-colors ${value.value === 'transparent' ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground'}`}
      >
        ✕ No Background (Transparent)
      </button>
    </div>
  );
};

export default BackgroundSelector;
