import React, { useState } from 'react';
import { GeneratedAssets } from './types';
import AnglesView from './tabs/AnglesView';
import BackgroundStudioView from './tabs/BackgroundStudioView';

interface ResultsViewerProps {
  assets: GeneratedAssets;
  productImage: File;
}

const ResultsViewer: React.FC<ResultsViewerProps> = ({ assets, productImage }) => {
  const [activeTab, setActiveTab] = useState<'angles' | 'studio'>('angles');
  const productName = productImage.name.split('.')[0];

  const tabs = [
    { key: 'angles' as const, label: '📐 Angles & Framing' },
    { key: 'studio' as const, label: '🎨 Background Studio' },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl shadow-lg w-full">
      <div className="flex border-b border-border px-4 pt-4">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-2 sm:p-6">
        {activeTab === 'angles'
          ? <AnglesView images={assets.images} productName={productName} />
          : <BackgroundStudioView images={assets.images} productName={productName} />}
      </div>
    </div>
  );
};

export default ResultsViewer;
