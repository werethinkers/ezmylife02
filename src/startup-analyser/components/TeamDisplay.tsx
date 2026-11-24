

import React, { useState, useEffect, useRef } from 'react';
import type { FounderDetail, OtherPosition } from '../types';
import { LinkedinIcon } from './icons';
import { highlightText } from './EditableContent';

const EditableContentDisplay = ({ value, onUpdate, keywords, highlightEnabled, as = 'input', label }: { value: string; onUpdate: (newValue: string) => void; keywords: string[]; highlightEnabled: boolean; as?: 'input' | 'textarea'; label: string }) => {
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
        if (currentValue.trim() !== value.trim()) {
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
    
    if (isEditing) {
        const InputComponent = as;
        return (
            <div className="mb-3">
                <label className="text-xs font-bold text-zinc-500 uppercase">{label}</label>
                <InputComponent
                    ref={inputRef as any}
                    value={currentValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full p-2 border rounded-md bg-blue-50 resize-none"
                    rows={as === 'textarea' ? 5 : undefined}
                />
            </div>
        );
    }

    return (
        <div className="mb-3" onClick={() => setIsEditing(true)}>
            <label className="text-xs font-bold text-zinc-500 uppercase">{label}</label>
            <div className="w-full p-2 border-b-2 border-transparent hover:bg-yellow-50 cursor-pointer rounded-md transition-colors min-h-[44px] whitespace-pre-wrap">
                {highlightText(value, keywords, highlightEnabled)}
            </div>
        </div>
    );
};

const OtherPositionCard: React.FC<{ position: OtherPosition, founderPath: (string|number)[], positionIndex: number, onUpdate: (path: (string|number)[], value: any) => void, keywords: string[], highlightEnabled: boolean }> = ({ position, founderPath, positionIndex, onUpdate, keywords, highlightEnabled }) => {
    const companyName = position.company_name?.[0]?.value || 'N/A';
    const companyDetails = position.company_details?.[0]?.value || 'N/A';
    const positionHeld = position.position_held?.[0]?.value || 'N/A';

    const createPath = (field: string) => [...founderPath, 'other_positions', positionIndex, field, 0, 'value'];

    return (
        <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200">
            <EditableContentDisplay label="Company Name" value={companyName} onUpdate={(val) => onUpdate(createPath('company_name'), val)} keywords={keywords} highlightEnabled={highlightEnabled} />
            <EditableContentDisplay label="Position Held" value={positionHeld} onUpdate={(val) => onUpdate(createPath('position_held'), val)} keywords={keywords} highlightEnabled={highlightEnabled} />
            <EditableContentDisplay label="Company Details" as="textarea" value={companyDetails} onUpdate={(val) => onUpdate(createPath('company_details'), val)} keywords={keywords} highlightEnabled={highlightEnabled} />
        </div>
    );
};


const FounderCard: React.FC<{ founder: FounderDetail, path: (string|number)[], onUpdate: (path: (string|number)[], value: any) => void, keywords: string[], highlightEnabled: boolean }> = ({ founder, path, onUpdate, keywords, highlightEnabled }) => {
    const name = founder.name?.[0]?.value || 'N/A';
    const title = founder.title?.[0]?.value || 'N/A';
    const background = founder.background?.map(p => p.value).join('\n\n') || 'Information not publicly available.';
    const linkedinUrl = founder.linkedin_url?.[0]?.value;

    const commonProps = { keywords, highlightEnabled };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200 flex flex-col h-full page-break-avoid">
            <div className="flex-grow">
                <EditableContentDisplay label="Name" value={name} onUpdate={(val) => onUpdate([...path, 'name', 0, 'value'], val)} {...commonProps} />
                <EditableContentDisplay label="Title" value={title} onUpdate={(val) => onUpdate([...path, 'title', 0, 'value'], val)} {...commonProps} />
                <EditableContentDisplay label="Background" as="textarea" value={background} onUpdate={(val) => onUpdate([...path, 'background', 0, 'value'], val)} {...commonProps} />

                {founder.other_positions && founder.other_positions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-zinc-200">
                        <h4 className="text-sm font-bold text-zinc-600 uppercase tracking-wider mb-3">Other Directorships</h4>
                        <div className="space-y-4">
                            {founder.other_positions.map((pos, index) => (
                                <OtherPositionCard 
                                    key={index}
                                    position={pos}
                                    founderPath={path}
                                    positionIndex={index}
                                    onUpdate={onUpdate}
                                    keywords={keywords}
                                    highlightEnabled={highlightEnabled}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {linkedinUrl && linkedinUrl !== 'Information not publicly available' && (
                <a 
                  href={linkedinUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="mt-4 pt-4 border-t border-zinc-200 inline-flex items-center gap-2 text-blue-700 hover:text-blue-800 font-semibold transition-colors group"
                >
                    <LinkedinIcon className="w-5 h-5 text-blue-700" />
                    <span className="group-hover:underline">View LinkedIn Profile</span>
                </a>
            )}
        </div>
    );
};


export const TeamDisplay: React.FC<{ founders: FounderDetail[] | undefined, onUpdate: (path: (string|number)[], value: any) => void, keywords: string[], highlightEnabled: boolean }> = ({ founders, onUpdate, keywords, highlightEnabled }) => {
    if (!founders || founders.length === 0) {
        return <p className="text-center text-zinc-500 py-8">Team information not available.</p>;
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {founders.map((founder, i) => (
                <FounderCard 
                    key={i} 
                    founder={founder} 
                    path={['structuredData', 'executiveSummaryData', 'team', 'founders', i]} 
                    onUpdate={onUpdate}
                    keywords={keywords}
                    highlightEnabled={highlightEnabled}
                />
            ))}
        </div>
    );
};