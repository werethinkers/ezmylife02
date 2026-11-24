import React, { useState, useEffect, useRef } from 'react';

export const highlightText = (text: string | number, keywords: string[], highlightEnabled: boolean): React.ReactNode => {
    if (!highlightEnabled || !keywords || keywords.length === 0 || typeof text !== 'string' || !text) {
        return text;
    }
    // Regex to match whole words, case-insensitively
    const regex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
    return (
        <>
            {text.split(regex).map((part, i) =>
                i % 2 === 1 ? <mark key={i} className="bg-yellow-200 rounded-sm px-1">{part}</mark> : part
            )}
        </>
    );
};

export const EditableContent = ({ value, onUpdate, keywords, highlightEnabled, as = 'input', placeholder = "Click to edit" }: { value: string | number, onUpdate: (newValue: any) => void, keywords: string[], highlightEnabled: boolean, as?: 'input' | 'textarea', placeholder?: string }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            if (as === 'textarea') {
                const el = inputRef.current as HTMLTextAreaElement;
                el.style.height = 'auto';
                el.style.height = `${el.scrollHeight}px`;
            }
        }
    }, [isEditing, as]);

    const handleBlur = () => {
        if (String(currentValue).trim() !== String(value).trim()) {
            onUpdate(currentValue);
        }
        setIsEditing(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setCurrentValue(e.target.value);
        if (as === 'textarea') {
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && as !== 'textarea') {
            handleBlur();
        }
    };

    if (isEditing) {
        const Component = as;
        return (
            <Component
                ref={inputRef as any}
                value={currentValue}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="w-full p-2 bg-blue-50 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm resize-none"
                rows={as === 'textarea' ? 3 : undefined}
            />
        );
    }
    
    return (
        <div
            onClick={() => setIsEditing(true)}
            className="prose prose-sm max-w-none text-zinc-800 p-2 rounded-md hover:bg-yellow-50 cursor-pointer transition-colors min-h-[42px] w-full break-words"
            role="button"
            tabIndex={0}
            data-is-editable="true"
        >
            {value ? highlightText(value, keywords, highlightEnabled) : <span className="text-zinc-600 italic">{placeholder}</span>}
        </div>
    );
};
