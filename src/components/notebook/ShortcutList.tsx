import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { 
  ShortcutItemData,
  SpeechRecognition, 
  SpeechRecognitionStatic, 
  SpeechRecognitionErrorEvent,
  SpeechRecognitionEvent
} from './types';
import { CopyIcon, CheckIcon, SearchIcon, MicrophoneIcon } from './icons';

interface CustomWindow extends Window {
  SpeechRecognition: SpeechRecognitionStatic;
  webkitSpeechRecognition: SpeechRecognitionStatic;
}
declare const window: CustomWindow;

interface ShortcutListProps {
  shortcuts: Map<string, ShortcutItemData[]>;
  onDeleteShortcut?: (key: string) => void;
  onEditShortcut?: (oldKey: string, newKey: string, newValue: string, category: string) => void;
}

interface EnrichedShortcutItem {
    key: string;
    value: string;
    sheetName: string;
    category: string;
}

const getTagColor = (tagName: string): string => {
  const colors = [
    'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300',
    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
  ];
  if (!tagName) return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % colors.length);
  return colors[index];
};

const SEARCH_RESULT_LIMIT = 100;
const INITIAL_LIST_LIMIT = 100;
const ALL_CATEGORIES = "All";

const ShortcutItem: React.FC<{ item: EnrichedShortcutItem; onCopy: (item: EnrichedShortcutItem) => void; isCopied: boolean; onDelete?: (key: string) => void; onEdit?: (oldKey: string, newKey: string, newValue: string, category: string) => void; }> = React.memo(({ item, onCopy, isCopied, onDelete, onEdit }) => {
    const categoryTag = item.category;
    const [keyCopied, setKeyCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editKey, setEditKey] = useState(item.key);
    const [editValue, setEditValue] = useState(item.value);

    const handleCopyShortcutKey = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(item.key);
        setKeyCopied(true);
        setTimeout(() => setKeyCopied(false), 1500);
    };

    const handleSaveEdit = () => {
        if (!editKey.trim() || !editValue.trim()) return;
        onEdit?.(item.key, editKey.trim(), editValue.trim(), item.category);
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditKey(item.key);
        setEditValue(item.value);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <li className="p-3 bg-white dark:bg-slate-900/50 rounded-lg shadow-sm border-2 border-sky-400 dark:border-sky-600">
                <div className="space-y-2">
                    <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Shortcut Key</label>
                        <input
                            type="text"
                            value={editKey}
                            onChange={(e) => setEditKey(e.target.value)}
                            className="w-full mt-1 px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Expansion Text</label>
                        <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            rows={3}
                            className="w-full mt-1 px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-y"
                        />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button onClick={handleCancelEdit} className="px-3 py-1 text-xs font-medium rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                        <button onClick={handleSaveEdit} className="px-3 py-1 text-xs font-medium rounded bg-sky-600 text-white hover:bg-sky-700 transition-colors">Save</button>
                    </div>
                </div>
            </li>
        );
    }

    return (
        <li className="p-3 bg-white dark:bg-slate-900/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700/50">
            <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <code className="font-mono font-bold text-sky-600 dark:text-sky-400 break-words">{item.key}</code>
                        {categoryTag && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getTagColor(categoryTag)}`}>
                                {categoryTag}
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold uppercase tracking-wider" title="Synced to browser extension">
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            Synced
                        </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug break-words whitespace-pre-wrap">
                        {item.value}
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleCopyShortcutKey}
                        className="flex-shrink-0 p-2 rounded-full text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                        aria-label={`Copy shortcut key ${item.key}`}
                        title={keyCopied ? 'Key copied!' : 'Copy shortcut key'}
                    >
                        {keyCopied ? (
                            <CheckIcon className="w-4 h-4 text-green-500" />
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                        )}
                    </button>
                    {onEdit && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex-shrink-0 p-2 rounded-full text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors"
                            aria-label={`Edit shortcut ${item.key}`}
                            title="Edit shortcut"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                    )}
                    <button
                        onClick={() => onCopy(item)}
                        className="flex-shrink-0 p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        aria-label={`Copy text for ${item.key}`}
                        title={isCopied ? 'Copied!' : 'Copy expansion'}
                    >
                        {isCopied ? (
                            <CheckIcon className="w-5 h-5 text-green-500" />
                        ) : (
                            <CopyIcon className="w-5 h-5" />
                        )}
                    </button>
                    {onDelete && (
                        <button
                            onClick={() => onDelete(item.key)}
                            className="flex-shrink-0 p-2 rounded-full text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors"
                            aria-label={`Delete shortcut ${item.key}`}
                            title="Delete shortcut"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </li>
    );
});

export const ShortcutList: React.FC<ShortcutListProps> = ({ shortcuts, onDeleteShortcut }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState<boolean>(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const availableCategories = useMemo(() => [ALL_CATEGORIES, ...Array.from(shortcuts.keys())], [shortcuts]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set([ALL_CATEGORIES]));
  
  const allShortcutsFlat = useMemo<EnrichedShortcutItem[]>(() => {
    const flatList: EnrichedShortcutItem[] = [];
    shortcuts.forEach((sheetItems, sheetName) => {
        sheetItems.forEach((item: ShortcutItemData) => {
            flatList.push({
                key: item.key,
                value: item.value,
                category: item.category,
                sheetName: sheetName
            });
        });
    });
    for (let i = flatList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [flatList[i], flatList[j]] = [flatList[j], flatList[i]];
    }
    return flatList;
  }, [shortcuts]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => {
        const newSelection = new Set(prev);
        if (category === ALL_CATEGORIES) {
            return new Set([ALL_CATEGORIES]);
        }
        newSelection.delete(ALL_CATEGORIES);
        if (newSelection.has(category)) {
            newSelection.delete(category);
        } else {
            newSelection.add(category);
        }
        if (newSelection.size === 0 || newSelection.size === availableCategories.length - 1) {
            return new Set([ALL_CATEGORIES]);
        }
        return newSelection;
    });
  };

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      setSpeechRecognitionSupported(true);
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.lang = 'hi-IN';
      recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === 'not-allowed') {
          alert('Microphone access was denied.');
        }
        setIsListening(false);
      };
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
      };
      recognitionRef.current = recognition;
    }
    return () => { recognitionRef.current?.stop(); };
  }, []);
  
  const handleToggleListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || !speechRecognitionSupported) return;
    if (isListening) {
      recognition.stop();
    } else {
      setSearchQuery('');
      recognition.start();
    }
  }, [isListening, speechRecognitionSupported]);

  const handleCopy = useCallback((item: EnrichedShortcutItem) => {
    navigator.clipboard.writeText(item.value);
    const uniqueId = item.key + item.sheetName;
    setCopiedKey(uniqueId);
    setTimeout(() => setCopiedKey(currentKey => (currentKey === uniqueId ? null : currentKey)), 2000);
  }, []);

  const displayData = useMemo<EnrichedShortcutItem[]>(() => {
    let filtered = allShortcutsFlat;
    if (!selectedCategories.has(ALL_CATEGORIES)) {
      filtered = filtered.filter(item => selectedCategories.has(item.sheetName));
    }
    const lowerCaseQuery = searchQuery.trim().toLowerCase();
    if (lowerCaseQuery) {
      filtered = filtered.filter(
        (item) =>
          item.key.toLowerCase().includes(lowerCaseQuery) ||
          item.value.toLowerCase().includes(lowerCaseQuery) ||
          item.category.toLowerCase().includes(lowerCaseQuery)
      );
    }
    const limit = lowerCaseQuery ? SEARCH_RESULT_LIMIT : INITIAL_LIST_LIMIT;
    return filtered.slice(0, limit);
  }, [searchQuery, allShortcutsFlat, selectedCategories]);

  if (shortcuts.size === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-100 dark:bg-slate-800 rounded-lg">
        <p className="text-slate-500">No shortcuts available.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[40rem] lg:h-auto lg:max-h-[calc(100vh-10rem)] bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <SearchIcon className="w-5 h-5 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="Search all shortcuts or use voice..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-12 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
            aria-label="Search available shortcuts"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            {speechRecognitionSupported && (
                <button
                    onClick={handleToggleListening}
                    type="button"
                    className={`p-1.5 rounded-full transition-colors ${
                    isListening
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                    aria-label={isListening ? 'Stop voice search' : 'Start voice search'}
                >
                    <MicrophoneIcon className="w-5 h-5" />
                </button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
            {availableCategories.map(category => (
                <button
                    key={category}
                    onClick={() => handleCategoryToggle(category)}
                    className={`px-3 py-1 text-sm font-medium rounded-full transition-colors border ${
                        selectedCategories.has(category)
                            ? 'bg-sky-600 text-white border-sky-600'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                    }`}
                >
                    {category}
                </button>
            ))}
        </div>
      </div>
      
      {displayData.length > 0 ? (
        <div className="overflow-y-auto p-2 sm:p-4">
          <ul className="space-y-3">
            {displayData.map((item) => {
              const uniqueId = item.key + item.sheetName;
              return (
                <ShortcutItem 
                    key={uniqueId}
                    item={item}
                    onCopy={handleCopy}
                    isCopied={copiedKey === uniqueId}
                    onDelete={onDeleteShortcut}
                />
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-center p-4">
            <p className="text-slate-500 text-center">
                {searchQuery.trim().length > 0
                    ? "No shortcuts match your search."
                    : "No shortcuts to display."
                }
            </p>
        </div>
      )}
    </div>
  );
};
