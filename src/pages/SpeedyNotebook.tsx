import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import type { 
  ShortcutMap,
  ShortcutItemData,
  SpeechRecognition, 
  SpeechRecognitionStatic,
  SpeechRecognitionErrorEvent,
  SpeechRecognitionEvent
} from '@/components/notebook/types';
import { fetchDictionary } from '@/components/notebook/shortcutService';
import { ShortcutList } from '@/components/notebook/ShortcutList';
import { AutocompleteMenu, AutocompleteSuggestion } from '@/components/notebook/AutocompleteMenu';
import { 
    MicrophoneIcon, DownloadIcon, AnalyzeIcon, BackIcon, BoldIcon, ItalicIcon, 
    UnderlineIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon, AlignJustifyIcon, 
    IndentIcon, OutdentIcon, SearchIcon, CloseIcon, UndoIcon, RedoIcon, TableIcon, SelectAllIcon,
    RowInsertAboveIcon, RowInsertBelowIcon, ColumnInsertLeftIcon, ColumnInsertRightIcon,
    RowDeleteIcon, ColumnDeleteIcon, MergeCellsIcon, DeleteTableIcon, InformationIcon,
    SparklesIcon, LightbulbIcon, LoaderIcon, RefreshIcon, CopyIcon, PasteIcon, AddIcon,
    BotIcon, SendIcon, QuestionMarkCircleIcon, FileImportIcon, CheckIcon, MagicWandIcon
} from '@/components/notebook/icons';
import { supabase } from '@/integrations/supabase/client';
import { handleCreditError, emitCreditPrompt } from '@/lib/creditPrompt';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.png';
import { useWorkspace } from '@/apps/lib/workspace';
import { docFromBlocks } from '@/apps/output/buildDoc';
import { blocksFromElement, blocksToMarkdown } from '@/apps/output/fromElement';
import { makePdf } from '@/apps/output/render';
import { saveFile } from '@/apps/output/save';
import { downloadWord } from '@/apps/lib/files';

interface CustomWindow extends Window {
  SpeechRecognition: SpeechRecognitionStatic;
  webkitSpeechRecognition: SpeechRecognitionStatic;
  find?: (string: string, caseSensitive?: boolean, backwards?: boolean, wrapAround?: boolean, wholeWord?: boolean, searchInFrames?: boolean, showDialog?: boolean) => boolean;
}
declare const window: CustomWindow;

const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const autoCorrectText = (textToCorrect: string, shortcuts: ShortcutMap): string => {
    if (!textToCorrect || shortcuts.size === 0) return textToCorrect;
    const firstPassParts: string[] = [];
    const parts = textToCorrect.split(/(\s+)/);
    let i = 0;
    while (i < parts.length) {
        const word1 = parts[i];
        if (i + 2 < parts.length && word1 && !/\s+/.test(word1)) {
            const whitespace = parts[i + 1];
            const word2 = parts[i + 2];
            if (whitespace && /\s+/.test(whitespace) && word2 && !/\s+/.test(word2)) {
                const potentialKey = `${word1} ${word2}`;
                if (shortcuts.has(potentialKey.toLowerCase())) {
                    firstPassParts.push(shortcuts.get(potentialKey.toLowerCase())!);
                    i += 3; 
                    continue;
                }
            }
        }
        firstPassParts.push(word1);
        i++;
    }
    const textAfterFirstPass = firstPassParts.join('');
    if (!textAfterFirstPass) return '';
    const finalParts = textAfterFirstPass.split(/(\s+)/);
    return finalParts.map(part => shortcuts.get(part.toLowerCase()) || part).join('');
};

const createLinkifiedFragment = (text: string): DocumentFragment => {
    const fragment = document.createDocumentFragment();
    const masterRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|((?:https?:\/\/|www\.)[^\s]+)|((?:\+|00)?(?:91)?[-\s]?[6-9]\d{9})/g;
    let lastIndex = 0;
    let match;
    while ((match = masterRegex.exec(text)) !== null) {
        const index = match.index;
        let matchedText = match[0];
        if (index > lastIndex) {
            fragment.appendChild(document.createTextNode(text.substring(lastIndex, index)));
        }
        let suffix = "";
        if (match[2]) {
             const trailingMatch = matchedText.match(/[.,!?;:"')\]}]+$/);
             if (trailingMatch) {
                 suffix = trailingMatch[0];
                 matchedText = matchedText.slice(0, -suffix.length);
             }
        }
        const a = document.createElement('a');
        a.className = "text-blue-600 dark:text-blue-400 hover:underline cursor-pointer";
        a.contentEditable = "false";
        if (match[1]) {
            a.href = `mailto:${matchedText}`;
        } else if (match[2]) {
            let href = matchedText;
            if (!href.startsWith('http')) href = 'http://' + href;
            a.href = href;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
        } else if (match[3]) {
            const cleanPhone = matchedText.replace(/[^\d+]/g, '');
            a.href = `tel:${cleanPhone}`;
        }
        a.innerText = matchedText;
        fragment.appendChild(a);
        if (suffix) {
            fragment.appendChild(document.createTextNode(suffix));
        }
        lastIndex = index + match[0].length;
    }
    if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
    }
    return fragment;
};

// Helper to call notebook-ai edge function
// Each AI action is one charged "speedy-notebook" run on the server; sign-in / top-up dialogs
// are opened by the shared credit prompt.
const callNotebookAI = async (prompt: string, config?: { responseMimeType?: string }) => {
    const { data, error } = await supabase.functions.invoke('notebook-ai', {
        body: { action: 'generate', prompt, config },
    });
    if (error) {
        if (await handleCreditError(error)) throw new NotebookCreditsError();
        throw error;
    }
    emitCreditPrompt({ kind: 'charged' });
    return data?.text || '';
};

class NotebookCreditsError extends Error {
    constructor() { super('credits'); }
}

// Toolbar Component
interface EditorToolbarProps {
  onCommand: (command: string, value?: string) => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  clearSearch: () => void;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ onCommand, onSearch, searchQuery, clearSearch }) => {
    const fonts = ['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Noto Sans Devanagari', 'Mangal'];
    const fontSizes = [
        { name: 'Small', value: '2' },
        { name: 'Normal', value: '3' },
        { name: 'Large', value: '5' },
        { name: 'Huge', value: '7' },
    ];
    const handleCommandMouseDown = (e: React.MouseEvent, command: string, value?: string) => {
        e.preventDefault();
        onCommand(command, value);
    };
    const handleColorChange = (command: string, value: string) => {
      onCommand(command, value);
    };

    return (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 p-2 rounded-t-lg bg-slate-100 dark:bg-slate-800 border-x-2 border-t-2 border-b border-slate-300 dark:border-slate-700">
            <div className="flex items-center rounded-md border border-slate-300 dark:border-slate-600">
                <button title="Bold" onMouseDown={(e) => handleCommandMouseDown(e, 'bold')} className="p-2 rounded-l-md hover:bg-slate-200 dark:hover:bg-slate-700"><BoldIcon className="w-5 h-5" /></button>
                <button title="Italic" onMouseDown={(e) => handleCommandMouseDown(e, 'italic')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 border-x border-slate-300 dark:border-slate-600"><ItalicIcon className="w-5 h-5" /></button>
                <button title="Underline" onMouseDown={(e) => handleCommandMouseDown(e, 'underline')} className="p-2 rounded-r-md hover:bg-slate-200 dark:hover:bg-slate-700"><UnderlineIcon className="w-5 h-5" /></button>
            </div>
            <div className="flex items-center rounded-md border border-slate-300 dark:border-slate-600">
                <button title="Undo" onMouseDown={(e) => handleCommandMouseDown(e, 'undo')} className="p-2 rounded-l-md hover:bg-slate-200 dark:hover:bg-slate-700"><UndoIcon className="w-5 h-5" /></button>
                <button title="Redo" onMouseDown={(e) => handleCommandMouseDown(e, 'redo')} className="p-2 rounded-r-md hover:bg-slate-200 dark:hover:bg-slate-700 border-l border-slate-300 dark:border-slate-600"><RedoIcon className="w-5 h-5" /></button>
            </div>
            <div className="flex items-center rounded-md border border-slate-300 dark:border-slate-600">
                <button title="Select All" onMouseDown={(e) => handleCommandMouseDown(e, 'selectAll')} className="p-2 rounded-l-md hover:bg-slate-200 dark:hover:bg-slate-700"><SelectAllIcon className="w-5 h-5" /></button>
                <button title="Copy" onMouseDown={(e) => handleCommandMouseDown(e, 'copy')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 border-x border-slate-300 dark:border-slate-600"><CopyIcon className="w-5 h-5" /></button>
                <button title="Paste" onMouseDown={(e) => handleCommandMouseDown(e, 'paste')} className="p-2 rounded-r-md hover:bg-slate-200 dark:hover:bg-slate-700"><PasteIcon className="w-5 h-5" /></button>
            </div>
            <div className="flex items-center gap-2">
                <select onChange={(e) => onCommand('fontName', e.target.value)} title="Font Family" className="p-1 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm">
                    {fonts.map(font => <option key={font} value={font} style={{fontFamily: font}}>{font}</option>)}
                </select>
                <select onChange={(e) => onCommand('fontSize', e.target.value)} defaultValue="3" title="Font Size" className="p-1 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm">
                     {fontSizes.map(size => <option key={size.value} value={size.value}>{size.name}</option>)}
                </select>
            </div>
            <div className="flex items-center rounded-md border border-slate-300 dark:border-slate-600">
                <label title="Font Color" className="p-2 flex items-center rounded-l-md hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer relative">
                    <input type="color" className="w-full h-full absolute inset-0 opacity-0 cursor-pointer" onInput={(e) => handleColorChange('foreColor', (e.target as HTMLInputElement).value)} />
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M0 20h24v4H0v-4z M11 3L5.5 17h2.25l1.12-3h6.25l1.12 3h2.25L13 3h-2z M12 5.98L13.87 11h-3.74L12 5.98z"></path></svg>
                </label>
                <label title="Highlight Color" className="p-2 flex items-center rounded-r-md hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer border-l border-slate-300 dark:border-slate-600 relative">
                    <input type="color" defaultValue="#FFFF00" className="w-full h-full absolute inset-0 opacity-0 cursor-pointer" onInput={(e) => handleColorChange('backColor', (e.target as HTMLInputElement).value)} />
                     <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M16.56 8.94L7.62 0 6.21 1.41l2.38 2.38-5.15 5.15c-1.56 1.56-1.56 4.09 0 5.66l2.83 2.83c.78.78 1.8.78 2.58 0l10.28-10.28-2.16-2.16zM5.21 19.21c-.78-.78-.78-2.05 0-2.83l5.15-5.15 2.83 2.83-5.15 5.15c-.78.78-2.05.78-2.83 0z"></path></svg>
                </label>
            </div>
            <div className="flex items-center rounded-md border border-slate-300 dark:border-slate-600">
                <button title="Align Left" onMouseDown={(e) => handleCommandMouseDown(e, 'justifyLeft')} className="p-2 rounded-l-md hover:bg-slate-200 dark:hover:bg-slate-700"><AlignLeftIcon className="w-5 h-5" /></button>
                <button title="Align Center" onMouseDown={(e) => handleCommandMouseDown(e, 'justifyCenter')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 border-x border-slate-300 dark:border-slate-600"><AlignCenterIcon className="w-5 h-5" /></button>
                <button title="Align Right" onMouseDown={(e) => handleCommandMouseDown(e, 'justifyRight')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700"><AlignRightIcon className="w-5 h-5" /></button>
                <button title="Justify" onMouseDown={(e) => handleCommandMouseDown(e, 'justifyFull')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 border-l border-slate-300 dark:border-slate-600"><AlignJustifyIcon className="w-5 h-5" /></button>
                <button title="Indent" onMouseDown={(e) => handleCommandMouseDown(e, 'indent')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 border-x border-slate-300 dark:border-slate-600"><IndentIcon className="w-5 h-5" /></button>
                <button title="Outdent" onMouseDown={(e) => handleCommandMouseDown(e, 'outdent')} className="p-2 rounded-r-md hover:bg-slate-200 dark:hover:bg-slate-700"><OutdentIcon className="w-5 h-5" /></button>
            </div>
            <div className="flex items-center rounded-md border border-slate-300 dark:border-slate-600">
                <button title="Insert Table" onMouseDown={(e) => handleCommandMouseDown(e, 'insertTable')} className="p-2 rounded-l-md hover:bg-slate-200 dark:hover:bg-slate-700"><TableIcon className="w-5 h-5" /></button>
                <button title="Insert File Content" onMouseDown={(e) => handleCommandMouseDown(e, 'openFileModal')} className="p-2 rounded-r-md hover:bg-slate-200 dark:hover:bg-slate-700 border-l border-slate-300 dark:border-slate-600"><FileImportIcon className="w-5 h-5" /></button>
            </div>
             <div className="relative flex items-center ml-auto">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                    <SearchIcon className="w-4 h-4 text-slate-400" />
                </span>
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => onSearch(e.target.value)}
                    className="w-40 pl-7 pr-7 py-1 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm"
                    aria-label="Search in editor"
                />
                {searchQuery && (
                    <button onClick={clearSearch} className="absolute inset-y-0 right-0 flex items-center pr-2" aria-label="Clear search">
                        <CloseIcon className="w-4 h-4 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"/>
                    </button>
                )}
            </div>
        </div>
    );
};

// Table Toolbar
interface TableToolbarProps {
  position: { top: number; left: number };
  onCommand: (command: string) => void;
}

const TableToolbar: React.FC<TableToolbarProps> = ({ position, onCommand }) => {
    const handleMouseDown = (e: React.MouseEvent, command: string) => {
        e.preventDefault();
        onCommand(command);
    };
    return (
        <div 
            className="absolute z-10 flex items-center gap-1 p-1 rounded-md bg-slate-200 dark:bg-slate-700 shadow-lg border border-slate-300 dark:border-slate-600"
            style={{ top: `${position.top}px`, left: `${position.left}px` }}
            onMouseDown={(e) => e.preventDefault()}
        >
            <button title="Insert Row Above" onMouseDown={(e) => handleMouseDown(e, 'insertRowAbove')} className="p-1.5 rounded hover:bg-slate-300 dark:hover:bg-slate-600"><RowInsertAboveIcon className="w-5 h-5" /></button>
            <button title="Insert Row Below" onMouseDown={(e) => handleMouseDown(e, 'insertRowBelow')} className="p-1.5 rounded hover:bg-slate-300 dark:hover:bg-slate-600"><RowInsertBelowIcon className="w-5 h-5" /></button>
            <button title="Insert Column Left" onMouseDown={(e) => handleMouseDown(e, 'insertColumnLeft')} className="p-1.5 rounded hover:bg-slate-300 dark:hover:bg-slate-600"><ColumnInsertLeftIcon className="w-5 h-5" /></button>
            <button title="Insert Column Right" onMouseDown={(e) => handleMouseDown(e, 'insertColumnRight')} className="p-1.5 rounded hover:bg-slate-300 dark:hover:bg-slate-600"><ColumnInsertRightIcon className="w-5 h-5" /></button>
            <div className="w-px h-5 bg-slate-300 dark:bg-slate-500 mx-1"></div>
            <button title="Delete Row" onMouseDown={(e) => handleMouseDown(e, 'deleteRow')} className="p-1.5 rounded hover:bg-slate-300 dark:hover:bg-slate-600 text-red-600"><RowDeleteIcon className="w-5 h-5" /></button>
            <button title="Delete Column" onMouseDown={(e) => handleMouseDown(e, 'deleteColumn')} className="p-1.5 rounded hover:bg-slate-300 dark:hover:bg-slate-600 text-red-600"><ColumnDeleteIcon className="w-5 h-5" /></button>
            <div className="w-px h-5 bg-slate-300 dark:bg-slate-500 mx-1"></div>
            <button title="Merge Cells" onMouseDown={(e) => handleMouseDown(e, 'mergeCells')} className="p-1.5 rounded hover:bg-slate-300 dark:hover:bg-slate-600"><MergeCellsIcon className="w-5 h-5" /></button>
            <div className="w-px h-5 bg-slate-300 dark:bg-slate-500 mx-1"></div>
            <button title="Delete Table" onMouseDown={(e) => handleMouseDown(e, 'deleteTable')} className="p-1.5 rounded hover:bg-slate-300 dark:hover:bg-slate-600 text-red-600"><DeleteTableIcon className="w-5 h-5" /></button>
        </div>
    );
};

// AI Toolbar
interface AIToolbarProps {
  position: { top: number; left: number };
  onRewrite: () => void;
  onSuggest: () => void;
  onSearch: () => void;
  onReplace: (text: string) => void;
  onClose: () => void;
  selectedText: string;
  isLoading: boolean;
  suggestions: string[] | null;
}

const AIToolbar: React.FC<AIToolbarProps> = ({ position, onRewrite, onSuggest, onSearch, onReplace, onClose, selectedText, isLoading, suggestions }) => {
    const isSingleWord = useMemo(() => selectedText.trim().split(/\s+/).length === 1, [selectedText]);
    const toolbarRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) onClose();
        };
        document.addEventListener('mousedown', handleClickOutside, true);
        return () => document.removeEventListener('mousedown', handleClickOutside, true);
    }, [onClose]);
    
    return (
        <div ref={toolbarRef} className="absolute z-10" style={{ top: `${position.top}px`, left: `${position.left}px`, transform: 'translateX(-50%)' }} onMouseDown={(e) => e.preventDefault()}>
            <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 p-1 rounded-md bg-slate-800 shadow-lg border border-slate-700 text-white">
                    {isLoading ? (
                        <div className="flex items-center gap-2 px-3 py-1"><LoaderIcon className="w-4 h-4 animate-spin" /><span className="text-sm">Processing...</span></div>
                    ) : suggestions ? null : (
                        <>
                            {isSingleWord ? (
                                <button onClick={onSuggest} className="flex items-center gap-1.5 px-3 py-1 text-sm rounded hover:bg-slate-700"><LightbulbIcon className="w-4 h-4" /> Suggest Words</button>
                            ) : (
                                <button onClick={onRewrite} className="flex items-center gap-1.5 px-3 py-1 text-sm rounded hover:bg-slate-700"><SparklesIcon className="w-4 h-4" /> Rephrase</button>
                            )}
                            <div className="w-px h-5 bg-slate-600"></div>
                            <button onClick={onSearch} className="flex items-center gap-1.5 px-3 py-1 text-sm rounded hover:bg-slate-700"><SearchIcon className="w-4 h-4" /> Search</button>
                        </>
                    )}
                </div>
                {suggestions && !isLoading && (
                    <div className="mt-2 w-72 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg overflow-hidden">
                        <div className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b">Suggestions</div>
                        <ul className="divide-y divide-slate-200 dark:divide-slate-700 max-h-60 overflow-y-auto">
                            {suggestions.map((suggestion, index) => (
                                <li key={index}><button onClick={() => onReplace(suggestion)} className="w-full text-left px-3 py-2 text-sm hover:bg-sky-50 dark:hover:bg-sky-900/50 transition-colors">{suggestion}</button></li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

// Analysis Modal
const AnalysisModal: React.FC<{ isOpen: boolean; onClose: () => void; results: { term: string, definition: string }[] | null }> = ({ isOpen, onClose, results }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
             <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                 <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-sky-600 dark:text-sky-400">Analysis Results</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <div className="p-4 overflow-y-auto">
                    {results && results.length > 0 ? (
                        <div className="space-y-4">
                            {results.map((item, idx) => (
                                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 capitalize">{item.term}</h3>
                                    <p className="text-slate-600 dark:text-slate-300 mt-1">{item.definition}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <p className="text-slate-500 text-center">No dictionary terms found in the text.</p>
                    )}
                </div>
             </div>
        </div>
    );
};

// Shortcut Generator Modal
const ShortcutGeneratorModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onAddShortcuts: (newShortcuts: ShortcutItemData[]) => void; 
    existingShortcuts: Map<string, ShortcutItemData[]>;
}> = ({ isOpen, onClose, onAddShortcuts, existingShortcuts }) => {
    const [inputText, setInputText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedShortcuts, setGeneratedShortcuts] = useState<ShortcutItemData[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [loadingKeyIndex, setLoadingKeyIndex] = useState<number | null>(null);
    const [hasSelection, setHasSelection] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const uniqueCategories = useMemo(() => {
        const cats = new Set<string>(['General', 'Email', 'Phone', 'Address', 'Code', 'Message', 'Task', 'Prompt', 'Work', 'Personal']);
        existingShortcuts.forEach(list => list.forEach(item => {
            if (item.category) cats.add(item.category);
        }));
        return Array.from(cats).sort();
    }, [existingShortcuts]);

    useEffect(() => {
        const handleSelectionChange = () => {
            if (textareaRef.current) {
                const { selectionStart, selectionEnd } = textareaRef.current;
                setHasSelection(selectionEnd > selectionStart);
            }
        };
        const el = textareaRef.current;
        if (el) {
            el.addEventListener('select', handleSelectionChange);
            el.addEventListener('click', handleSelectionChange);
            el.addEventListener('keyup', handleSelectionChange);
        }
        return () => {
            if (el) {
                el.removeEventListener('select', handleSelectionChange);
                el.removeEventListener('click', handleSelectionChange);
                el.removeEventListener('keyup', handleSelectionChange);
            }
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleGenerate = async (mode: 'all' | 'selection' = 'all') => {
        let textToProcess = inputText;
        if (mode === 'selection' && textareaRef.current) {
            const { selectionStart, selectionEnd } = textareaRef.current;
            textToProcess = inputText.substring(selectionStart, selectionEnd);
        }
        if (!textToProcess.trim()) return;
        setIsGenerating(true);
        try {
             let sampleItems: string[] = [];
             for (const list of existingShortcuts.values()) {
                 for (const item of list) {
                     sampleItems.push(`${item.key}: ${item.value.substring(0, 30)}...`);
                     if (sampleItems.length > 20) break;
                 }
                 if (sampleItems.length > 20) break;
             }
             const isSelectionMode = mode === 'selection';
             const taskDescription = isSelectionMode 
                ? "Task: Treat the Input Text as a SINGLE shortcut value. Generate ONE shortcut object."
                : "Task: Treat every paragraph in the input text as a DISTINCT shortcut value.";

             const prompt = `You are an expert shortcut generator.
             Sample of existing shortcuts:
             ${sampleItems.join("\n")}
             ${taskDescription}
             For each item: generate a unique key, assign a category, provide logic field.
             Input Text: "${textToProcess}"
             Return ONLY a JSON array of objects with properties: key, value, category, logic.`;
             
             const responseText = await callNotebookAI(prompt, { responseMimeType: 'application/json' });
             const data = JSON.parse(responseText || '[]');
             if (Array.isArray(data)) {
                 const newItems = data as ShortcutItemData[];
                 if (mode === 'selection') {
                     setGeneratedShortcuts(prev => {
                         const next = [...prev, ...newItems];
                         const newIndicesSet = new Set(selectedIndices);
                         newItems.forEach((_, i) => newIndicesSet.add(prev.length + i));
                         setSelectedIndices(newIndicesSet);
                         return next;
                     });
                 } else {
                     setGeneratedShortcuts(newItems);
                     setSelectedIndices(new Set(newItems.map((_, i) => i)));
                 }
             }
        } catch (e) {
            if (!(e instanceof NotebookCreditsError)) {
                console.error(e);
                toast.error("Failed to generate shortcuts.");
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSuggestKey = async (index: number) => {
        const item = generatedShortcuts[index];
        setLoadingKeyIndex(index);
        try {
             const prompt = `Suggest a short, memorable shortcut key for: "${item.value}" Category: "${item.category}". Return ONLY the key string.`;
             const newKey = (await callNotebookAI(prompt)).trim() || item.key;
             handleUpdateShortcut(index, 'key', newKey);
        } catch (e) { console.error(e); }
        finally { setLoadingKeyIndex(null); }
    };

    const handleUpdateShortcut = (index: number, field: keyof ShortcutItemData, value: string) => {
        const updated = [...generatedShortcuts];
        updated[index] = { ...updated[index], [field]: value };
        setGeneratedShortcuts(updated);
    };

    const handleAddSelected = () => {
        const toAdd = generatedShortcuts.filter((_, i) => selectedIndices.has(i));
        onAddShortcuts(toAdd);
        onClose();
        setInputText('');
        setGeneratedShortcuts([]);
        setSelectedIndices(new Set());
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
                 <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-sky-600 dark:text-sky-400">AI Shortcut Creator</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    <div className={`flex flex-col p-4 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 transition-all ${generatedShortcuts.length > 0 ? 'h-1/3 md:h-full md:w-1/3' : 'h-full w-full'}`}>
                        <p className="text-sm text-slate-500 mb-2 font-medium">1. Paste content here:</p>
                        <textarea ref={textareaRef} className="flex-1 w-full p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-900 resize-none font-mono text-sm" placeholder="Paste text, codes, emails..." value={inputText} onChange={e => setInputText(e.target.value)} />
                        <div className="flex flex-col gap-2 mt-4">
                            <button onClick={() => handleGenerate('all')} disabled={!inputText.trim() || isGenerating} className="w-full px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:opacity-50 flex items-center justify-center gap-2">
                                {isGenerating ? <LoaderIcon className="w-5 h-5 animate-spin"/> : <MagicWandIcon className="w-5 h-5"/>} Process All
                            </button>
                            <button onClick={() => handleGenerate('selection')} disabled={!hasSelection || isGenerating} className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
                                {isGenerating ? <LoaderIcon className="w-5 h-5 animate-spin"/> : <AddIcon className="w-5 h-5"/>} Add Selection as Single
                            </button>
                        </div>
                    </div>
                    {generatedShortcuts.length > 0 && (
                        <div className="flex-1 flex flex-col h-2/3 md:h-full md:w-2/3 bg-slate-50 dark:bg-slate-900/50">
                            <div className="p-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">Generated ({generatedShortcuts.length})</span>
                                <button onClick={() => { setGeneratedShortcuts([]); setSelectedIndices(new Set()); }} className="text-xs text-red-500 hover:text-red-700 px-2 py-1">Clear</button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {generatedShortcuts.map((item, idx) => (
                                    <div key={idx} className="flex gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                                        <div className="flex items-start pt-2">
                                            <input type="checkbox" checked={selectedIndices.has(idx)} onChange={(e) => {
                                                const newSet = new Set(selectedIndices);
                                                if (e.target.checked) newSet.add(idx); else newSet.delete(idx);
                                                setSelectedIndices(newSet);
                                            }} className="w-5 h-5 text-sky-600 rounded" />
                                        </div>
                                        <div className="flex-1 space-y-2 min-w-0">
                                            <div className="flex gap-2 flex-wrap">
                                                <div className="flex-1 min-w-[120px]">
                                                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">Key</label>
                                                    <div className="flex gap-1">
                                                        <input type="text" value={item.key} onChange={(e) => handleUpdateShortcut(idx, 'key', e.target.value)} className="flex-1 p-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm font-mono font-bold text-sky-600 bg-slate-50 dark:bg-slate-800" />
                                                        <button onClick={() => handleSuggestKey(idx)} disabled={loadingKeyIndex === idx} className="p-1.5 text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-700 rounded border border-slate-200 dark:border-slate-600">
                                                            {loadingKeyIndex === idx ? <LoaderIcon className="w-4 h-4 animate-spin"/> : <SparklesIcon className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-[120px]">
                                                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">Category</label>
                                                    <input type="text" list={`cat-${idx}`} value={item.category} onChange={(e) => handleUpdateShortcut(idx, 'category', e.target.value)} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm bg-slate-50 dark:bg-slate-800" />
                                                    <datalist id={`cat-${idx}`}>{uniqueCategories.map(c => <option key={c} value={c} />)}</datalist>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">Value</label>
                                                <textarea value={item.value} onChange={(e) => handleUpdateShortcut(idx, 'value', e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded text-sm h-20 resize-y bg-slate-50 dark:bg-slate-800 font-mono" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between items-center">
                                <span className="text-sm text-slate-500">{selectedIndices.size} selected</span>
                                <button onClick={handleAddSelected} disabled={selectedIndices.size === 0} className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 shadow-md disabled:opacity-50 font-medium">Add Selected to Session</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


const SpeedyNotebook: React.FC = () => {
  const { user } = useAuth();
  const { profile: wsProfile } = useWorkspace();
  const navigate = useNavigate();
  const [shortcuts, setShortcuts] = useState<Map<string, ShortcutItemData[]>>(new Map());
  const [flatShortcutsMap, setFlatShortcutsMap] = useState<ShortcutMap>(new Map());
  const [dictionary, setDictionary] = useState<ShortcutMap>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [editorSearchQuery, setEditorSearchQuery] = useState('');
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<{term: string, definition: string}[] | null>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [aiToolbar, setAiToolbar] = useState<{ visible: boolean; position: { top: number; left: number }; text: string; } | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[] | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [autocomplete, setAutocomplete] = useState<{
      isOpen: boolean;
      suggestions: AutocompleteSuggestion[];
      position: { top: number; left: number };
      selectedIndex: number;
      matchStart: number;
      prefix: string;
  }>({ isOpen: false, suggestions: [], position: { top: 0, left: 0 }, selectedIndex: 0, matchStart: 0, prefix: '' });
  const [isDictating, setIsDictating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const dictationRecognition = useRef<SpeechRecognition | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadDone = useRef(false);
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  // Load saved session
  useEffect(() => {
    if (!user) return;
    const loadSession = async () => {
      const { data } = await supabase
        .from('notebook_sessions')
        .select('editor_content, session_shortcuts')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        // Restore shortcuts regardless of editor ref state
        if (data.session_shortcuts && Array.isArray(data.session_shortcuts)) {
          const sessionShortcuts = (data.session_shortcuts as unknown) as ShortcutItemData[];
          if (sessionShortcuts.length > 0) {
            const newMap = new Map<string, ShortcutItemData[]>();
            newMap.set('AI Generated', sessionShortcuts);
            setShortcuts(newMap);
            shortcutsRef.current = newMap;
            
            const newFlat = new Map<string, string>();
            sessionShortcuts.forEach(item => newFlat.set(item.key.toLowerCase(), item.value));
            setFlatShortcutsMap(newFlat);
          }
        }
        // Set editor content when ref is available
        if (editorRef.current) {
          editorRef.current.innerHTML = data.editor_content || '';
        }
      }
      initialLoadDone.current = true;
    };
    loadSession();
  }, [user]);

  // Auto-save (debounced)
  const saveSession = useCallback(() => {
    if (!user || !editorRef.current || !initialLoadDone.current) return;
    
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus('unsaved');
    
    saveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      const editorContent = editorRef.current?.innerHTML || '';
      const aiGenerated = shortcutsRef.current.get('AI Generated') || [];
      
      const { error } = await supabase
        .from('notebook_sessions')
        .upsert({
          user_id: user.id,
          editor_content: editorContent,
          session_shortcuts: JSON.parse(JSON.stringify(aiGenerated)),
        }, { onConflict: 'user_id' });
      
      if (!error) setSaveStatus('saved');
      else console.error('Save error:', error);
    }, 1500);
  }, [user]);

  // Load dictionary only (no predefined shortcuts - users create their own)
  useEffect(() => {
    const load = async () => {
        setIsLoading(true);
        try {
            const d = await fetchDictionary();
            setDictionary(d);
        } catch (e) { console.error("Failed to load dictionary", e); }
        finally { setIsLoading(false); }
    };
    load();
  }, []);

  const onCommand = (command: string, value?: string) => {
      if (command === 'openFileModal') {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'text/plain';
          input.onchange = (e: Event) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => { document.execCommand('insertText', false, ev.target?.result as string); };
                  reader.readAsText(file);
              }
          };
          input.click();
      } else if (command === 'insertTable') {
          const table = '<table border="1" style="border-collapse:collapse;width:100%"><tr><td style="padding:8px;border:1px solid #ccc">&nbsp;</td><td style="padding:8px;border:1px solid #ccc">&nbsp;</td></tr><tr><td style="padding:8px;border:1px solid #ccc">&nbsp;</td><td style="padding:8px;border:1px solid #ccc">&nbsp;</td></tr></table><br>';
          document.execCommand('insertHTML', false, table);
      } else {
        document.execCommand(command, false, value);
      }
      editorRef.current?.focus();
  };
  
  const handleAutoCorrectAll = () => {
      if (!editorRef.current) return;
      const textNodes: Text[] = [];
      const walker = document.createTreeWalker(editorRef.current, NodeFilter.SHOW_TEXT, null);
      let currentNode = walker.nextNode();
      while (currentNode) { textNodes.push(currentNode as Text); currentNode = walker.nextNode(); }
      textNodes.forEach(textNode => {
          const originalText = textNode.nodeValue || "";
          const expandedText = autoCorrectText(originalText, flatShortcutsMap);
          const fragment = createLinkifiedFragment(expandedText);
          if (fragment.childNodes.length === 1 && fragment.firstChild?.nodeType === Node.TEXT_NODE && fragment.firstChild.textContent === originalText) return;
          textNode.parentNode?.replaceChild(fragment, textNode);
      });
      saveSession();
  };

  const handleAnalyze = () => {
      if (!editorRef.current || dictionary.size === 0) return;
      const text = editorRef.current.innerText;
      const words = text.split(/[\s,.!?;:"'()]+/);
      const uniqueWords = new Set(words.map(w => w.toLowerCase()));
      const results: {term: string, definition: string}[] = [];
      uniqueWords.forEach(word => {
          if (dictionary.has(word)) results.push({ term: word, definition: dictionary.get(word)! });
      });
      setAnalysisResults(results);
      setIsAnalysisModalOpen(true);
  };
  
  const handleAddGeneratedShortcuts = (newItems: ShortcutItemData[]) => {
      const newMap = new Map(shortcuts);
      const existing = newMap.get('AI Generated') || [];
      const updatedShortcuts = [...existing, ...newItems];
      newMap.set('AI Generated', updatedShortcuts);
      setShortcuts(newMap);
      // Update ref IMMEDIATELY so saveSession reads the correct data
      shortcutsRef.current = newMap;
      
      const newFlat = new Map(flatShortcutsMap);
      newItems.forEach(item => newFlat.set(item.key.toLowerCase(), item.value));
      setFlatShortcutsMap(newFlat);
      
      // Direct save instead of relying on debounced saveSession
      if (user) {
        const editorContent = editorRef.current?.innerHTML || '';
        supabase
          .from('notebook_sessions')
          .upsert({
            user_id: user.id,
            editor_content: editorContent,
            session_shortcuts: JSON.parse(JSON.stringify(updatedShortcuts)),
          }, { onConflict: 'user_id' })
          .then(({ error }) => {
            if (error) console.error('Save shortcuts error:', error);
            else setSaveStatus('saved');
          });
      }
  };

  const handleDeleteShortcut = useCallback((key: string) => {
      const newMap = new Map(shortcuts);
      const existing = newMap.get('AI Generated') || [];
      const filtered = existing.filter(item => item.key !== key);
      if (filtered.length > 0) {
        newMap.set('AI Generated', filtered);
      } else {
        newMap.delete('AI Generated');
      }
      setShortcuts(newMap);
      shortcutsRef.current = newMap;
      
      // Remove from flat map
      setFlatShortcutsMap(prev => {
        const newFlat = new Map(prev);
        newFlat.delete(key.toLowerCase());
        return newFlat;
      });
      
      // Direct save
      if (user) {
        const editorContent = editorRef.current?.innerHTML || '';
        supabase
          .from('notebook_sessions')
          .upsert({
            user_id: user.id,
            editor_content: editorContent,
            session_shortcuts: JSON.parse(JSON.stringify(filtered)),
          }, { onConflict: 'user_id' })
          .then(({ error }) => {
            if (error) console.error('Delete shortcut error:', error);
            else setSaveStatus('saved');
          });
      }
  }, [shortcuts, user]);

  const handleEditShortcut = useCallback((oldKey: string, newKey: string, newValue: string, category: string) => {
      const newMap = new Map(shortcuts);
      const sheetName = 'AI Generated';
      const existing = newMap.get(sheetName) || [];
      const updated = existing.map(item => 
          item.key === oldKey ? { ...item, key: newKey, value: newValue } : item
      );
      newMap.set(sheetName, updated);
      setShortcuts(newMap);
      shortcutsRef.current = newMap;

      // Update flat map
      setFlatShortcutsMap(prev => {
        const newFlat = new Map(prev);
        if (oldKey.toLowerCase() !== newKey.toLowerCase()) {
          newFlat.delete(oldKey.toLowerCase());
        }
        newFlat.set(newKey.toLowerCase(), newValue);
        return newFlat;
      });

      // Persist
      if (user) {
        const editorContent = editorRef.current?.innerHTML || '';
        supabase
          .from('notebook_sessions')
          .upsert({
            user_id: user.id,
            editor_content: editorContent,
            session_shortcuts: JSON.parse(JSON.stringify(updated)),
          }, { onConflict: 'user_id' })
          .then(({ error }) => {
            if (error) console.error('Edit shortcut error:', error);
            else setSaveStatus('saved');
          });
      }
  }, [shortcuts, user]);

  const notesDoc = () => {
      if (!editorRef.current || !editorRef.current.innerText.trim()) { toast.info('Write something first.'); return null; }
      const { title, blocks } = blocksFromElement(editorRef.current);
      return docFromBlocks({ appName: 'Speedy Notebook', template: 'document', title: title || 'My notes', blocks, profile: wsProfile, fileName: `notes-${new Date().toISOString().slice(0, 10)}` });
  };
  const handlePdf = async () => {
      const doc = notesDoc();
      if (!doc) return;
      try {
          const { blob } = await makePdf(doc);
          await saveFile(blob, `${doc.fileName}.pdf`, 'Speedy Notebook');
      } catch {
          toast.error('The PDF could not be made on this device.');
      }
  };
  const handleWord = () => {
      const doc = notesDoc();
      if (doc) downloadWord(blocksToMarkdown(doc.title, doc.blocks), doc.fileName, 'Speedy Notebook');
  };

  const handleDownload = () => {
      if (!editorRef.current) return;
      const text = editorRef.current.innerText;
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'notes.txt';
      a.click();
      URL.revokeObjectURL(url);
  };

  const handleInput = useCallback(() => {
      saveSession();
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) { setAutocomplete(prev => ({ ...prev, isOpen: false })); return; }
      const range = selection.getRangeAt(0);
      const textNode = range.startContainer;
      if (textNode.nodeType !== Node.TEXT_NODE) { setAutocomplete(prev => ({ ...prev, isOpen: false })); return; }
      const text = textNode.textContent || '';
      const cursorOffset = range.startOffset;
      const textBeforeCursor = text.slice(0, cursorOffset);
      const lastWordMatch = textBeforeCursor.match(/(\S+)$/);

      if (lastWordMatch) {
          const query = lastWordMatch[1].toLowerCase();
          if (query.length >= 2) {
              const matches: AutocompleteSuggestion[] = [];
              flatShortcutsMap.forEach((value, key) => { if (key.startsWith(query)) matches.push({ key, value }); });
              if (matches.length > 0) {
                  const rect = range.getBoundingClientRect();
                  let left = rect.left;
                  if (left + 320 > window.innerWidth) left = window.innerWidth - 330;
                  let top = rect.bottom + 5;
                  if (top + 250 > window.innerHeight) top = rect.top - 255;
                  setAutocomplete({ isOpen: true, suggestions: matches.slice(0, 10), position: { top, left }, selectedIndex: 0, matchStart: lastWordMatch.index!, prefix: lastWordMatch[1] });
                  return;
              }
          }
      }
      setAutocomplete(prev => ({ ...prev, isOpen: false }));
  }, [flatShortcutsMap, saveSession]);

  const insertSuggestion = (suggestion: AutocompleteSuggestion) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      const textNode = range.startContainer;
      if (textNode.nodeType === Node.TEXT_NODE && textNode.textContent) {
           const cursorOffset = range.startOffset;
           range.setStart(textNode, cursorOffset - autocomplete.prefix.length);
           range.setEnd(textNode, cursorOffset);
           range.deleteContents();
           const textNodeToInsert = document.createTextNode(suggestion.value + ' ');
           range.insertNode(textNodeToInsert);
           range.setStartAfter(textNodeToInsert);
           range.setEndAfter(textNodeToInsert);
           selection.removeAllRanges();
           selection.addRange(range);
           setAutocomplete(prev => ({ ...prev, isOpen: false }));
           saveSession();
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (autocomplete.isOpen) {
          if (e.key === 'ArrowDown') { e.preventDefault(); setAutocomplete(prev => ({ ...prev, selectedIndex: (prev.selectedIndex + 1) % prev.suggestions.length })); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setAutocomplete(prev => ({ ...prev, selectedIndex: (prev.selectedIndex - 1 + prev.suggestions.length) % prev.suggestions.length })); }
          else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertSuggestion(autocomplete.suggestions[autocomplete.selectedIndex]); }
          else if (e.key === 'Escape') { setAutocomplete(prev => ({ ...prev, isOpen: false })); }
      }
      if (e.key === ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const selection = window.getSelection();
          if (!selection || selection.rangeCount === 0) return;
          const range = selection.getRangeAt(0);
          const node = range.startContainer;
          if (node.nodeType === Node.TEXT_NODE && node.textContent) {
              const text = node.textContent;
              const cursorOffset = range.startOffset;
              const textBefore = text.slice(0, cursorOffset);
              const match = textBefore.match(/([^\s]+)$/);
              if (match) {
                  const key = match[1];
                  const lowerKey = key.toLowerCase();
                  if (flatShortcutsMap.has(lowerKey)) {
                      e.preventDefault();
                      const expansion = flatShortcutsMap.get(lowerKey)!;
                      const newRange = document.createRange();
                      newRange.setStart(node, cursorOffset - key.length);
                      newRange.setEnd(node, cursorOffset);
                      newRange.deleteContents();
                      const fragment = createLinkifiedFragment(expansion + ' ');
                      const lastChild = fragment.lastChild;
                      newRange.insertNode(fragment);
                      if (lastChild) { newRange.setStartAfter(lastChild); newRange.setEndAfter(lastChild); }
                      selection.removeAllRanges();
                      selection.addRange(newRange);
                      if (autocomplete.isOpen) setAutocomplete(prev => ({ ...prev, isOpen: false }));
                  }
              }
          }
      }
  };

  const handleAiAction = async (action: 'rewrite' | 'suggest' | 'search') => {
    if (!aiToolbar) return;
    setIsAiLoading(true);
    try {
        let prompt = "";
        let config: { responseMimeType?: string } | undefined = undefined;
        
        if (action === 'search') {
             prompt = `Explain or provide context for: "${aiToolbar.text}". Provide a concise answer.`;
        } else if (action === 'rewrite') {
            prompt = `Rephrase the following text in 3 different ways. Keep same language.
            Styles: 1. Professional 2. Concise 3. Persuasive
            Text: "${aiToolbar.text}"
            Return ONLY a JSON array of strings.`;
            config = { responseMimeType: 'application/json' };
        } else if (action === 'suggest') {
            prompt = `Suggest 5 synonyms for: "${aiToolbar.text}". Same language. Return only a JSON array of strings.`;
            config = { responseMimeType: 'application/json' };
        }

        const responseText = await callNotebookAI(prompt, config);

        if (action === 'search') {
            setAiSuggestions([responseText]);
        } else {
             try {
                const suggestions = JSON.parse(responseText || '[]');
                if (Array.isArray(suggestions)) {
                    setAiSuggestions(suggestions.map((s: unknown) => String(s)));
                } else {
                    setAiSuggestions([String(responseText)]);
                }
             } catch {
                 setAiSuggestions([String(responseText)]);
             }
        }
    } catch (e) {
        if (e instanceof NotebookCreditsError) {
            setAiSuggestions(["Sign in or add credits to use AI tools in the notebook."]);
        } else {
            console.error(e);
            setAiSuggestions(["Error processing request."]);
        }
    } finally {
        setIsAiLoading(false);
    }
  };

  const toggleDictation = () => {
    if (isDictating) {
        dictationRecognition.current?.stop();
        setIsDictating(false);
    } else {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.lang = 'hi-IN';
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.onresult = (event) => {
                 let finalTranscript = '';
                 for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
                 }
                 if (finalTranscript) document.execCommand('insertText', false, finalTranscript + ' ');
            };
            recognition.onend = () => setIsDictating(false);
            recognition.start();
            dictationRecognition.current = recognition;
            setIsDictating(true);
        } else {
            toast.error("Voice typing is not supported in this browser. Try Chrome or Edge.");
        }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-slate-900">
        <div className="text-center">
          <LoaderIcon className="w-10 h-10 animate-spin text-sky-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">Loading Speedy NoteBook...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        <SEOHead
          title="Speedy Notebook - AI-Powered Writing Tool with Shortcuts"
          description="Speedy Notebook by EZYOURLIFE — an AI writing tool with auto-expanding shortcuts, smart autocomplete, speech-to-text, and document analysis. Boost your writing speed."
          path="/notebook"
          keywords="speedy notebook, ai writing tool, text shortcuts, ai autocomplete, ezyourlife notebook, productivity writing"
          jsonLd={[
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Speedy Notebook",
              applicationCategory: "ProductivityApplication",
              operatingSystem: "Web",
              description: "AI-powered writing tool with auto-expanding shortcuts, smart autocomplete, and speech-to-text.",
              url: "https://ezyourlife.com/notebook",
              offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
              publisher: { "@type": "Organization", name: "EZYOURLIFE", url: "https://ezyourlife.com" },
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://ezyourlife.com" },
                { "@type": "ListItem", position: 2, name: "Speedy Notebook", item: "https://ezyourlife.com/notebook" },
              ],
            },
          ]}
        />
        <header className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 z-20">
             <div className="flex items-center gap-3">
                 <button onClick={() => navigate('/ai-apps')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" title="Back to AI Apps">
                     <BackIcon className="w-5 h-5" />
                 </button>
                 <a href="https://www.ezmy.life" target="_blank" rel="noopener noreferrer" className="flex items-center transition-opacity hover:opacity-80">
                     <img src={logo} alt="EzMyLife Logo" className="h-10 w-auto" />
                 </a>
                 <div className="flex flex-col">
                    <h1 className="text-xl font-bold text-sky-600 hidden md:block leading-none">EzMyLife Speedy NoteBook</h1>
                    <h1 className="text-xl font-bold text-sky-600 md:hidden leading-none">EzMyLife</h1>
                 </div>
             </div>
             <div className="flex items-center gap-2">
                 <span className={`text-xs px-2 py-1 rounded ${saveStatus === 'saved' ? 'text-green-600 bg-green-50 dark:bg-green-900/30' : saveStatus === 'saving' ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30' : 'text-slate-400'}`}>
                     {saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'saving' ? 'Saving...' : 'Unsaved'}
                 </span>
                 <button onClick={toggleDictation} className={`p-2 rounded-full transition-colors ${isDictating ? 'bg-red-100 text-red-600 animate-pulse' : 'text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-300'}`} title="Voice Input">
                     <MicrophoneIcon className="w-5 h-5" />
                 </button>
                 <button onClick={handleAnalyze} className="p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-full" title="Analyze All">
                     <AnalyzeIcon className="w-5 h-5" />
                 </button>
                 <button onClick={handleAutoCorrectAll} className="p-2 text-sm bg-sky-100 text-sky-700 rounded hover:bg-sky-200 dark:bg-sky-900 dark:text-sky-300 dark:hover:bg-sky-800 hidden sm:inline-flex items-center" title="Auto Correct All">
                     <CheckIcon className="w-4 h-4 mr-1" /> Fix All
                 </button>
                 <button onClick={() => void handlePdf()} className="px-2 py-1 text-xs font-semibold text-slate-700 border border-slate-300 hover:bg-slate-100 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700 rounded" title="Save as PDF">PDF</button>
                 <button onClick={handleWord} className="px-2 py-1 text-xs font-semibold text-slate-700 border border-slate-300 hover:bg-slate-100 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700 rounded" title="Save as Word">Word</button>
                 <button onClick={handleDownload} className="p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-full" title="Download as text">
                     <DownloadIcon className="w-5 h-5" />
                 </button>
             </div>
        </header>

        <main className="flex-1 flex overflow-hidden">
             <div className="flex-1 flex flex-col p-2 sm:p-4 min-w-0 relative">
                 <EditorToolbar 
                    onCommand={onCommand} 
                    onSearch={(q) => { setEditorSearchQuery(q); if (window.find && q) window.find(q); }} 
                    searchQuery={editorSearchQuery} 
                    clearSearch={() => setEditorSearchQuery('')} 
                 />
                 <div 
                    ref={editorRef}
                    className="flex-1 border-x border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-8 outline-none overflow-y-auto"
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    onMouseUp={() => {
                        const selection = window.getSelection();
                        if (selection && selection.toString().trim().length > 0 && selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            const rect = range.getBoundingClientRect();
                            if (editorRef.current?.contains(selection.anchorNode)) {
                                setAiToolbar({ visible: true, position: { top: rect.top - 50, left: rect.left + rect.width / 2 }, text: selection.toString() });
                                setAiSuggestions(null); 
                            }
                        } else {
                            setAiToolbar(null);
                        }
                    }}
                 ></div>
                 
                 {autocomplete.isOpen && (
                    <AutocompleteMenu 
                        suggestions={autocomplete.suggestions}
                        position={autocomplete.position}
                        selectedIndex={autocomplete.selectedIndex}
                        onSelect={insertSuggestion}
                    />
                 )}
                 
                 {aiToolbar && (
                    <AIToolbar 
                        position={aiToolbar.position}
                        onRewrite={() => handleAiAction('rewrite')}
                        onSuggest={() => handleAiAction('suggest')}
                        onSearch={() => handleAiAction('search')}
                        onReplace={(text) => { document.execCommand('insertText', false, text); setAiToolbar(null); saveSession(); }}
                        onClose={() => setAiToolbar(null)}
                        selectedText={aiToolbar.text}
                        isLoading={isAiLoading}
                        suggestions={aiSuggestions}
                    />
                 )}
             </div>
             
             <div className="hidden lg:flex w-80 border-l border-slate-200 dark:border-slate-800 flex-col bg-slate-50 dark:bg-slate-900">
                  <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">My Saved Shortcuts</h2>
                    <p className="text-xs text-slate-500 mt-1">{(shortcuts.get('AI Generated') || []).length} shortcut(s)</p>
                  </div>
                  <ShortcutList shortcuts={shortcuts} onDeleteShortcut={handleDeleteShortcut} onEditShortcut={handleEditShortcut} />
              </div>
        </main>
        
        <div className="fixed bottom-6 right-6 flex flex-col gap-4 z-50">
            <button onClick={() => setIsGeneratorOpen(true)} className="p-4 bg-purple-600 text-white rounded-full shadow-xl hover:bg-purple-700 hover:scale-105 transition-all" title="AI Shortcut Creator">
                <MagicWandIcon className="w-6 h-6" />
            </button>
        </div>
        
        <AnalysisModal isOpen={isAnalysisModalOpen} onClose={() => setIsAnalysisModalOpen(false)} results={analysisResults} />
        <ShortcutGeneratorModal isOpen={isGeneratorOpen} onClose={() => setIsGeneratorOpen(false)} onAddShortcuts={handleAddGeneratedShortcuts} existingShortcuts={shortcuts} />
    </div>
  );
};

export default SpeedyNotebook;
