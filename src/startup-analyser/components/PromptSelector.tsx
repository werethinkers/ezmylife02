
import React from 'react';
import type { Prompt } from '../types';
import { SparklesIcon } from './icons';

interface PromptSelectorProps {
  prompts: Prompt[];
  onSelect: (promptText: string) => void;
  disabled: boolean;
}

export const PromptSelector: React.FC<PromptSelectorProps> = ({ prompts, onSelect, disabled }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {prompts.map((prompt, index) => (
        <button
          key={index}
          onClick={() => onSelect(prompt.text)}
          disabled={disabled}
          className={`flex items-start text-left p-4 border rounded-lg transition-all transform hover:scale-[1.02] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            disabled
              ? 'bg-gray-100 text-gray-600 cursor-not-allowed border-gray-300'
              : 'bg-white text-gray-800 hover:bg-blue-50 hover:border-blue-400 border-gray-400'
          }`}
        >
          <SparklesIcon className={`w-5 h-5 mr-3 flex-shrink-0 mt-1 ${disabled ? 'text-gray-600' : 'text-blue-600'}`} />
          <div>
            <p className="font-semibold">{prompt.title}</p>
            <p className={`text-sm ${disabled ? 'text-gray-600' : 'text-gray-700'}`}>{prompt.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
};
