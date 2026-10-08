
import React, { useState, useEffect, useRef } from 'react';
import type { SourcedDataPoint, SourceType } from '../types';
import { DocumentTextIcon, GlobeAltIcon, BrainCircuitIcon } from './icons';

declare global {
    interface Window {
        showdown: any;
    }
}

const SourceIcon = ({ sourceType }: { sourceType: SourceType }) => {
    switch (sourceType) {
        case 'pitch_deck':
            return <DocumentTextIcon className="w-4 h-4 text-purple-600 flex-shrink-0" />;
        case 'web_search':
            return <GlobeAltIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />;
        case 'model_knowledge':
            return <BrainCircuitIcon className="w-4 h-4 text-green-600 flex-shrink-0" />;
        default:
            return null;
    }
};

const formatSourceDetail = (detail: string, type: SourceType) => {
    if (type === 'web_search' && detail.startsWith('http')) {
        return <a href={detail} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">{detail}</a>;
    }
    return <span className="break-words">{detail}</span>;
}

const highlightMarkdownWithMarks = (text: string, keywords: string[], highlightEnabled: boolean): string => {
    if (!highlightEnabled || !keywords || keywords.length === 0 || !text) {
        return text;
    }
    const pattern = `\\b(${keywords.map(k => k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})\\b`;
    const regex = new RegExp(pattern, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
};

export const SourcedDataPointDisplay: React.FC<{ point: SourcedDataPoint; onUpdate: (newValue: string) => void; keywords: string[]; highlightEnabled: boolean; }> = ({ point, onUpdate, keywords, highlightEnabled }) => {
    // Defensive check to prevent crashes on malformed data from the AI
    if (!point || typeof point !== 'object') {
        return null; 
    }

    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(point.value || '');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const sourceType = point.sourceType || 'model_knowledge'; // Default to prevent crash

    useEffect(() => {
        setEditText(point.value || '');
    }, [point.value]);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [isEditing]);
    
    const handleSave = () => {
        onUpdate(editText);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            setEditText(point.value);
            setIsEditing(false);
        }
    }

    const convertMarkdownToHtml = (markdownText: string) => {
        if (!markdownText) return { __html: '' };
        
        // Escape any HTML in the AI text first so only Markdown formatting and highlights render.
        const escaped = markdownText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const highlightedText = highlightMarkdownWithMarks(escaped, keywords, highlightEnabled);

        if (!window.showdown) {
            return { __html: highlightedText.replace(/\n/g, '<br />') };
        }
        const converter = new window.showdown.Converter({
            simpleLineBreaks: true,
            ghCodeBlocks: false,
        });
        return { __html: converter.makeHtml(highlightedText) };
    };

    if (isEditing) {
        return (
            <div className="pt-2 flex items-start gap-3 w-full first:pt-0">
                 <div className="relative group flex-shrink-0 mt-1">
                    <SourceIcon sourceType={sourceType} />
                </div>
                <textarea
                    ref={textareaRef}
                    value={editText}
                    onChange={(e) => {
                        setEditText(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className="w-full p-2 border rounded-md font-sans text-sm bg-blue-50 resize-none"
                />
            </div>
        );
    }

    return (
        <div className="pt-2 flex items-start gap-3 w-full first:pt-0 cursor-pointer group" onClick={() => setIsEditing(true)}>
            <div className="relative group flex-shrink-0 mt-1">
                <SourceIcon sourceType={sourceType} />
                <div className="absolute bottom-full mb-2 w-max max-w-xs p-2 text-xs text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 -translate-x-1/2 left-1/2">
                    <p className="font-semibold capitalize">{sourceType.replace(/_/g, ' ')}</p>
                    {point.sourceDetail && point.sourceDetail !== "N/A" && (
                       <div className="font-normal mt-1 opacity-90">{formatSourceDetail(point.sourceDetail, sourceType)}</div>
                    )}
                </div>
            </div>
            <div 
                className="prose prose-sm max-w-none text-gray-800 flex-grow prose-ul:my-0 prose-li:my-0.5 group-hover:bg-yellow-100 rounded p-1 transition-colors"
                dangerouslySetInnerHTML={convertMarkdownToHtml(point.value || '')}
            />
        </div>
    );
};
