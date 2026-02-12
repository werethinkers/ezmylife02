import React, { useState } from 'react';
import { CheckCircle, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
import installChrome from '@/assets/install-step-chrome.jpg';
import installFirefox from '@/assets/install-step-firefox.jpg';
import extensionPreview from '@/assets/extension-popup-preview.jpg';

type BrowserInfo = {
  name: string;
  icon: React.ReactNode;
  supported: boolean;
  manualSteps: string[];
  extensionFolder: string;
  color: string;
};

const STEP_IMAGES: Record<string, string[]> = {
  chrome: [installChrome, installChrome, installChrome, installChrome],
  brave: [installChrome, installChrome, installChrome, installChrome],
  edge: [installChrome, installChrome, installChrome, installChrome],
  opera: [installChrome, installChrome, installChrome, installChrome],
  firefox: [installFirefox, installFirefox, installFirefox, installFirefox],
};

interface InstallationGuideProps {
  browserKey: string;
  browser: BrowserInfo;
  isPrimary?: boolean;
}

const InstallationGuide: React.FC<InstallationGuideProps> = ({ browserKey, browser, isPrimary }) => {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const images = STEP_IMAGES[browserKey] || STEP_IMAGES.chrome;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-slate-300">Installation Steps:</h4>
      <ol className="space-y-3">
        {browser.manualSteps.map((step, i) => (
          <li key={i} className="space-y-2">
            <button
              onClick={() => setExpandedStep(expandedStep === i ? null : i)}
              className="flex gap-3 text-sm text-slate-400 w-full text-left hover:text-slate-200 transition-colors group"
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              <span className="flex-1">{step}</span>
              <span className="flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
                {expandedStep === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </button>
            {expandedStep === i && images[i] && (
              <div className="ml-9 rounded-lg overflow-hidden border border-slate-700/60 bg-slate-900/50">
                <img
                  src={images[i]}
                  alt={`Step ${i + 1}: ${step}`}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
            )}
          </li>
        ))}
      </ol>

      {/* Extension preview */}
      {isPrimary && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-purple-400" />
            Extension Preview
          </h4>
          <div className="rounded-lg overflow-hidden border border-slate-700/60 bg-slate-900/50 max-w-[280px]">
            <img
              src={extensionPreview}
              alt="Extension popup preview showing shortcuts list"
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallationGuide;
