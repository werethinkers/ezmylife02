
import React from 'react';
import type { StructuredData, SourcedDataPoint } from '../types';
import { SourcedDataPointDisplay } from './SourcedDataPointDisplay';
import { ExecutiveSummary } from './ExecutiveSummary';
import { LegalAnalysis } from './LegalAnalysis';
import { TeamDisplay } from './TeamDisplay';

const SectionHeader = ({ title }: { title: string }) => (
    <tr className="bg-zinc-700 text-white page-break-avoid" data-is-editable="false">
        <th colSpan={2} className="p-3 text-left font-bold text-lg sticky top-0 z-[1]">{title}</th>
    </tr>
);

const DetailRow: React.FC<{
    label: string;
    points: SourcedDataPoint[] | undefined;
    path: (string | number)[];
    onUpdate: (path: (string | number)[], value: any) => void;
    keywords: string[];
    highlightEnabled: boolean;
}> = ({ label, points, path, onUpdate, keywords, highlightEnabled }) => (
    <tr className="border-b border-zinc-200 bg-white hover:bg-zinc-50 page-break-avoid">
        <td className="p-3 font-semibold text-zinc-700 w-1/3 align-top" data-is-editable="false">{label}</td>
        <td className="p-3 w-2/3" data-is-editable="true">
            {points && points.length > 0 ? (
                <div className="flex flex-col gap-2 divide-y divide-zinc-100">
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
                <p className="text-zinc-500 italic">No data available.</p>
            )}
        </td>
    </tr>
);

interface ICNoteProps {
    data: StructuredData;
    onUpdate: (path: (string | number)[], value: any) => void;
    keywords: string[];
    highlightEnabled: boolean;
}

export const ICNote: React.FC<ICNoteProps> = ({ data, onUpdate, keywords, highlightEnabled }) => {
    if (!data) return <div className="text-center p-8">Loading report...</div>;

    const commonProps = { onUpdate, keywords, highlightEnabled };
    const createPath = (field: keyof StructuredData) => ['structuredData', field];
    
    const mermaidCode = data.pictorial_technology_definition?.[0]?.value;

    return (
        <div className="page-break-before">
            <h2 className="text-3xl font-bold text-center mb-6 text-zinc-800">IC Note: {data.name}</h2>
            <div className="overflow-x-auto rounded-lg shadow-sm border border-zinc-300">
                <table className="min-w-full">
                    <thead className="bg-zinc-800 text-white no-print">
                        <tr>
                            <th className="p-3 text-left font-bold w-1/3">Section</th>
                            <th className="p-3 text-left font-bold w-2/3">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        <SectionHeader title="Executive Summary" />
                        <tr>
                            <td colSpan={2} className="p-0 sm:p-2 bg-zinc-50" data-is-editable="true">
                                <ExecutiveSummary data={data.executiveSummaryData} companyName={data.name} {...commonProps} />
                            </td>
                        </tr>

                        <SectionHeader title="Market" />
                        <DetailRow label="Market Analysis" points={data.market_analysis} path={createPath('market_analysis')} {...commonProps} />

                        <SectionHeader title="Problem & Solution" />
                        <DetailRow label="Problem In-Detail" points={data.problem_in_detail} path={createPath('problem_in_detail')} {...commonProps} />
                        <DetailRow label="Solution In-Detail" points={data.solution_in_detail} path={createPath('solution_in_detail')} {...commonProps} />
                        
                        <SectionHeader title="Product & Technology" />
                        <DetailRow label="Products Analysis" points={data.products_analysis} path={createPath('products_analysis')} {...commonProps} />
                        <DetailRow label="USP / MOAT" points={data.usp_moat} path={createPath('usp_moat')} {...commonProps} />
                        <DetailRow label="Intellectual Property" points={data.ip_summary} path={createPath('ip_summary')} {...commonProps} />

                        <SectionHeader title="Pictorial Technology Definition" />
                        <tr className="border-b border-zinc-200 bg-white page-break-avoid">
                             <td colSpan={2} className="p-4" data-is-editable="true">
                                {mermaidCode && !mermaidCode.includes("Information not") ? (
                                     <div className="mermaid text-center p-4 border rounded-lg bg-zinc-50 shadow-inner">
                                        {mermaidCode}
                                    </div>
                                ) : (
                                    <p className="text-zinc-500 italic text-center">No diagram available.</p>
                                )}
                             </td>
                        </tr>
                        
                        <SectionHeader title="Business Overview" />
                        <DetailRow label="Competition Summary" points={data.competition_summary} path={createPath('competition_summary')} {...commonProps} />
                        <DetailRow label="Traction" points={data.traction_summary} path={createPath('traction_summary')} {...commonProps} />
                        <DetailRow label="Business Model" points={data.business_model} path={createPath('business_model')} {...commonProps} />
                        
                        <SectionHeader title="Team" />
                         <tr>
                            <td colSpan={2} className="p-4 bg-zinc-50" data-is-editable="true">
                                <TeamDisplay founders={data.executiveSummaryData.team?.founders} {...commonProps} />
                            </td>
                        </tr>
                        
                        <SectionHeader title="Financials & Investment" />
                        <DetailRow label="Past Fundraises" points={data.fundraises_summary} path={createPath('fundraises_summary')} {...commonProps} />
                        <DetailRow label="Investment Required" points={data.investment_required} path={createPath('investment_required')} {...commonProps} />
                        <DetailRow label="Use of Investments" points={data.use_of_investments} path={createPath('use_of_investments')} {...commonProps} />
                        <DetailRow label="Financial Plan" points={data.financial_plan_summary} path={createPath('financial_plan_summary')} {...commonProps} />

                        <SectionHeader title="Analysis & Conclusion" />
                        <DetailRow label="Expert Opinion" points={data.expert_opinion} path={createPath('expert_opinion')} {...commonProps} />
                        <DetailRow label="Exit Plan" points={data.exit_plan_summary} path={createPath('exit_plan_summary')} {...commonProps} />
                        <DetailRow label="Investment Risk" points={data.investment_risk} path={createPath('investment_risk')} {...commonProps} />
                        <DetailRow label="Investment Rationale" points={data.investment_rationale} path={createPath('investment_rationale')} {...commonProps} />
                        <DetailRow label="Conclusion" points={data.conclusion} path={createPath('conclusion')} {...commonProps} />
                        <DetailRow label="Future Roadmap" points={data.future_roadmap} path={createPath('future_roadmap')} {...commonProps} />

                        <SectionHeader title="Legal & Compliance" />
                        <tr>
                             <td colSpan={2} className="p-4 bg-zinc-50" data-is-editable="true">
                                <LegalAnalysis
                                    founderIssues={data.executiveSummaryData.legal_analysis?.founder_legal_issues}
                                    companyIssues={data.executiveSummaryData.legal_analysis?.company_legal_issues}
                                    {...commonProps}
                                />
                             </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};
