import React from 'react';
import { PlacementConfig } from './types';

interface PlacementControlsProps {
  value: PlacementConfig;
  onChange: (config: PlacementConfig) => void;
}

const PlacementControls: React.FC<PlacementControlsProps> = ({ value, onChange }) => {
  const update = (partial: Partial<PlacementConfig>) => onChange({ ...value, ...partial });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium">Placement & Scale</label>
        <button
          onClick={() => onChange({ scale: 80, posX: 50, posY: 50 })}
          className="text-[10px] text-primary hover:text-primary/80 transition-colors"
        >
          Reset
        </button>
      </div>

      <div>
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
          <span>Scale</span><span>{value.scale}%</span>
        </div>
        <input type="range" min="10" max="200" value={value.scale}
          onChange={e => update({ scale: parseInt(e.target.value) })}
          className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
      </div>

      <div>
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
          <span>Horizontal</span><span>{value.posX}%</span>
        </div>
        <input type="range" min="0" max="100" value={value.posX}
          onChange={e => update({ posX: parseInt(e.target.value) })}
          className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
      </div>

      <div>
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
          <span>Vertical</span><span>{value.posY}%</span>
        </div>
        <input type="range" min="0" max="100" value={value.posY}
          onChange={e => update({ posY: parseInt(e.target.value) })}
          className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
      </div>
    </div>
  );
};

export default PlacementControls;
