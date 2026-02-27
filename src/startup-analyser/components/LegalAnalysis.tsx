import React from 'react';
import type { SourcedDataPoint } from '../types';
import { SourcedDataPointDisplay } from './SourcedDataPointDisplay';
import { ScaleIcon } from './icons';

interface LegalAnalysisProps {
    founderIssues: SourcedDataPoint[] | undefined;
    companyIssues: SourcedDataPoint[] | undefined;
    onUpdate: (path: (string | number)[], value: any) => void;
    keywords: string[];
    highlightEnabled: boolean;
}

const IssueSection: React.FC<{
    title: string;
    points: SourcedDataPoint[] | undefined;
    path: (string | number)[];
    onUpdate: (path: (string | number)[], value: any) => void;
    keywords: string[];
    highlightEnabled: boolean;
}> = ({ title, points, path, onUpdate, keywords, highlightEnabled }) => (
    <div className="mb-8 page-break-avoid">
        <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            {points && points.length > 0 && points.some(p => p.value && !p.value.includes("No publicly available information")) ? (
                <div className="flex flex-col gap-2 divide-y divide-gray-100">
                    {points.map((point, index) => (
                        <SourcedDataPointDisplay
                            key={index}
                            point={point}
                            onUpdate={(newValue) => onUpdate([...path, index, 'value'], newValue)}
                            keywords={keywords}
                            highlightEnabled={highlightEnabled}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-gray-500 italic p-4 text-center">No legal issues found or data is not publicly available.</p>
            )}
        </div>
    </div>
);

export const LegalAnalysis: React.FC<LegalAnalysisProps> = ({ founderIssues, companyIssues, onUpdate, keywords, highlightEnabled }) => {
    return (
        <div data-editable-container>
            <div className="flex items-center justify-center gap-3 mb-6">
                <ScaleIcon className="w-8 h-8 text-orange-500" />
                <h2 className="text-3xl font-bold text-center text-gray-800">Legal & Compliance Analysis</h2>
            </div>
            
            <IssueSection
                title="Founder Legal History"
                points={founderIssues}
                path={['structuredData', 'executiveSummaryData', 'legal_analysis', 'founder_legal_issues']}
                onUpdate={onUpdate}
                keywords={keywords}
                highlightEnabled={highlightEnabled}
            />

            <IssueSection
                title="Company Legal History"
                points={companyIssues}
                path={['structuredData', 'executiveSummaryData', 'legal_analysis', 'company_legal_issues']}
                onUpdate={onUpdate}
                keywords={keywords}
                highlightEnabled={highlightEnabled}
            />
        </div>
    );
};