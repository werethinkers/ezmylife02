
import React from 'react';
import type { ExecutiveSummaryData, SourcedDataPoint, IPOExample, AcquisitionExample, SecondarySaleExample } from '../types';
import { SourcedDataPointDisplay } from './SourcedDataPointDisplay';
import { MermaidDiagram } from './MermaidDiagram';

const SectionHeader = ({ title }: { title: string }) => (
    <tr className="bg-primary text-primary-foreground page-break-avoid">
        <th colSpan={2} className="p-3 text-left font-bold text-lg sticky top-0 z-[1]">{title}</th>
    </tr>
);

const DetailRow = ({ label, points, path, onUpdate, keywords, highlightEnabled }: { label:string, points: SourcedDataPoint[] | undefined, path: (string|number)[], onUpdate: (path: (string|number)[], value: any) => void, keywords: string[], highlightEnabled: boolean }) => (
    <tr className="border-b border-zinc-200 bg-white hover:bg-zinc-50 page-break-avoid">
        <td className="p-3 font-semibold text-zinc-700 w-1/3 align-top">{label}</td>
        <td className="p-3 w-2/3">
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

const IPOExamplesDisplay = ({ examples, path, onUpdate, keywords, highlightEnabled }: { examples: IPOExample[], path: (string|number)[], onUpdate: (path: (string|number)[], value: any) => void, keywords: string[], highlightEnabled: boolean }) => {
    if (!examples || examples.length === 0) {
        return <p className="text-zinc-500 italic">No data available.</p>;
    }
    return (
        <div className="flex flex-col gap-4">
            {examples.map((example, index) => (
                <div key={index} className="p-3 border rounded-lg bg-zinc-50/50 space-y-2">
                    <div className="grid grid-cols-[auto,1fr] items-start gap-x-3">
                        <strong className="text-zinc-600 text-sm pt-2">Company:</strong>
                        <SourcedDataPointDisplay point={example.company_name?.[0]} onUpdate={(newValue) => onUpdate([...path, index, 'company_name', 0, 'value'], newValue)} keywords={keywords} highlightEnabled={highlightEnabled} />
                    </div>
                    <div className="grid grid-cols-[auto,1fr] items-start gap-x-3">
                        <strong className="text-zinc-600 text-sm pt-2">Year:</strong>
                        <SourcedDataPointDisplay point={example.year?.[0]} onUpdate={(newValue) => onUpdate([...path, index, 'year', 0, 'value'], newValue)} keywords={keywords} highlightEnabled={highlightEnabled} />
                    </div>
                </div>
            ))}
        </div>
    );
};

const AcquisitionExamplesDisplay = ({ examples, path, onUpdate, keywords, highlightEnabled }: { examples: AcquisitionExample[], path: (string|number)[], onUpdate: (path: (string|number)[], value: any) => void, keywords: string[], highlightEnabled: boolean }) => {
    if (!examples || examples.length === 0) {
        return <p className="text-zinc-500 italic">No data available.</p>;
    }
    return (
        <div className="flex flex-col gap-4">
            {examples.map((example, index) => (
                <div key={index} className="p-3 border rounded-lg bg-zinc-50/50 space-y-2">
                     <div className="grid grid-cols-[auto,1fr] items-start gap-x-3">
                        <strong className="text-zinc-600 text-sm pt-2">Company:</strong>
                        <SourcedDataPointDisplay point={example.company_name?.[0]} onUpdate={(newValue) => onUpdate([...path, index, 'company_name', 0, 'value'], newValue)} keywords={keywords} highlightEnabled={highlightEnabled} />
                    </div>
                    <div className="grid grid-cols-[auto,1fr] items-start gap-x-3">
                        <strong className="text-zinc-600 text-sm pt-2">Acquirer:</strong>
                        <SourcedDataPointDisplay point={example.acquirer?.[0]} onUpdate={(newValue) => onUpdate([...path, index, 'acquirer', 0, 'value'], newValue)} keywords={keywords} highlightEnabled={highlightEnabled} />
                    </div>
                    <div className="grid grid-cols-[auto,1fr] items-start gap-x-3">
                        <strong className="text-zinc-600 text-sm pt-2">Year:</strong>
                        <SourcedDataPointDisplay point={example.year?.[0]} onUpdate={(newValue) => onUpdate([...path, index, 'year', 0, 'value'], newValue)} keywords={keywords} highlightEnabled={highlightEnabled} />
                    </div>
                </div>
            ))}
        </div>
    );
};

const SecondarySaleExamplesDisplay = ({ examples, path, onUpdate, keywords, highlightEnabled }: { examples: SecondarySaleExample[], path: (string|number)[], onUpdate: (path: (string|number)[], value: any) => void, keywords: string[], highlightEnabled: boolean }) => {
    if (!examples || examples.length === 0) {
        return <p className="text-zinc-500 italic">No data available.</p>;
    }
    return (
        <div className="flex flex-col gap-4">
            {examples.map((example, index) => (
                <div key={index} className="p-3 border rounded-lg bg-zinc-50/50 space-y-2">
                    <SourcedDataPointDisplay point={example.details?.[0]} onUpdate={(newValue) => onUpdate([...path, index, 'details', 0, 'value'], newValue)} keywords={keywords} highlightEnabled={highlightEnabled} />
                </div>
            ))}
        </div>
    );
};


export const ExecutiveSummary: React.FC<{ data: ExecutiveSummaryData, companyName: string, onUpdate: (path: (string|number)[], value: any) => void, keywords: string[], highlightEnabled: boolean, mermaidCode?: string }> = ({ data, companyName, onUpdate, keywords, highlightEnabled, mermaidCode }) => {
    if (!data) return <div className="text-center p-8">Loading summary...</div>;
    
    const {
        startup_overview, product_market_fit, financial_snapshot,
        team, competitive_landscape, deal_evaluation
    } = data;

    const createPath = (section: string, field: string) => ['structuredData', 'executiveSummaryData', section, field];

    const commonProps = { onUpdate, keywords, highlightEnabled };

    return (
        <div>
            <h2 className="text-3xl font-bold text-center mb-6 text-zinc-800">Executive Summary - {companyName}</h2>
            <div className="overflow-x-auto rounded-lg shadow-sm border border-zinc-300">
                <table className="min-w-full">
                    <thead className="bg-primary text-primary-foreground no-print">
                        <tr>
                            <th className="p-3 text-left font-bold w-1/3">Section</th>
                            <th className="p-3 text-left font-bold w-2/3">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        <SectionHeader title="Startup Overview" />
                        <DetailRow label="Name" points={startup_overview.name} path={createPath('startup_overview', 'name')} {...commonProps} />
                        <DetailRow label="Website" points={startup_overview.website} path={createPath('startup_overview', 'website')} {...commonProps} />
                        <DetailRow label="Founding Year" points={startup_overview.founding_year} path={createPath('startup_overview', 'founding_year')} {...commonProps} />
                        <DetailRow label="Location" points={startup_overview.location} path={createPath('startup_overview', 'location')} {...commonProps} />
                        <DetailRow label="Sector / Subsector" points={startup_overview.sector_subsector} path={createPath('startup_overview', 'sector_subsector')} {...commonProps} />
                        <DetailRow label="Investment Ask" points={startup_overview.investment_ask} path={createPath('startup_overview', 'investment_ask')} {...commonProps} />
                        <DetailRow label="Investment Committed" points={startup_overview.investment_committed} path={createPath('startup_overview', 'investment_committed')} {...commonProps} />
                        <DetailRow label="Investment Remaining" points={startup_overview.investment_remaining} path={createPath('startup_overview', 'investment_remaining')} {...commonProps} />
                        <DetailRow label="Stage" points={startup_overview.stage} path={createPath('startup_overview', 'stage')} {...commonProps} />
                        <DetailRow label="Date of Review" points={startup_overview.date_of_review} path={createPath('startup_overview', 'date_of_review')} {...commonProps} />
                        <DetailRow label="Author" points={startup_overview.author_name} path={createPath('startup_overview', 'author_name')} {...commonProps} />

                        <SectionHeader title="Product / Market Fit" />
                        <DetailRow label="Brief Overview" points={product_market_fit.brief_overview} path={createPath('product_market_fit', 'brief_overview')} {...commonProps} />
                        <DetailRow label="Technology Definition" points={product_market_fit.definition_of_tech} path={createPath('product_market_fit', 'definition_of_tech')} {...commonProps} />
                        <DetailRow label="Problem" points={product_market_fit.problem} path={createPath('product_market_fit', 'problem')} {...commonProps} />
                        <DetailRow label="Products Being Sold" points={product_market_fit.products_being_sold} path={createPath('product_market_fit', 'products_being_sold')} {...commonProps} />
                        <DetailRow label="Solution" points={product_market_fit.solution} path={createPath('product_market_fit', 'solution')} {...commonProps} />
                        <DetailRow label="Unique Selling Point" points={product_market_fit.unique_selling_point} path={createPath('product_market_fit', 'unique_selling_point')} {...commonProps} />
                        <DetailRow label="IP / Defensibility" points={product_market_fit.product_ip_defense} path={createPath('product_market_fit', 'product_ip_defense')} {...commonProps} />
                        <DetailRow label="Target Customer" points={product_market_fit.target_customer} path={createPath('product_market_fit', 'target_customer')} {...commonProps} />
                        <DetailRow label="Market Size" points={product_market_fit.market_size} path={createPath('product_market_fit', 'market_size')} {...commonProps} />
                        <DetailRow label="History of Tech in India" points={product_market_fit.history_of_tech_in_india} path={createPath('product_market_fit', 'history_of_tech_in_india')} {...commonProps} />

                        <SectionHeader title="Financial Snapshot" />
                        <DetailRow label="Revenue / MRR / ARR" points={financial_snapshot.revenue_mrr_arr} path={createPath('financial_snapshot', 'revenue_mrr_arr')} {...commonProps} />
                        <DetailRow label="Use of Funds" points={financial_snapshot.use_of_funds} path={createPath('financial_snapshot', 'use_of_funds')} {...commonProps} />

                        <SectionHeader title="Team" />
                        {team.founders?.map((founder, index) => (
                            <React.Fragment key={index}>
                                <tr className="bg-zinc-100 page-break-avoid">
                                    <td colSpan={2} className="p-2 font-bold text-zinc-800 text-base">
                                        Founder #{index + 1}
                                    </td>
                                </tr>
                                <DetailRow label="Name" points={founder.name} path={[...createPath('team', 'founders'), index, 'name']} {...commonProps} />
                                <DetailRow label="Title" points={founder.title} path={[...createPath('team', 'founders'), index, 'title']} {...commonProps} />
                                <DetailRow label="Background" points={founder.background} path={[...createPath('team', 'founders'), index, 'background']} {...commonProps} />
                                <DetailRow label="LinkedIn Profile" points={founder.linkedin_url} path={[...createPath('team', 'founders'), index, 'linkedin_url']} {...commonProps} />
                            </React.Fragment>
                        ))}
                        <DetailRow label="Team Gaps" points={team.team_gaps} path={createPath('team', 'team_gaps')} {...commonProps} />
                        
                        <SectionHeader title="Competitive Landscape" />
                        <DetailRow label="Key Competitors" points={competitive_landscape.key_competitors_summary} path={createPath('competitive_landscape', 'key_competitors_summary')} {...commonProps} />

                        <SectionHeader title="Deal Evaluation" />
                        <DetailRow label="Strengths" points={deal_evaluation.strengths} path={createPath('deal_evaluation', 'strengths')} {...commonProps} />
                        <DetailRow label="Risks & Concerns" points={deal_evaluation.risks_concerns} path={createPath('deal_evaluation', 'risks_concerns')} {...commonProps} />
                        <DetailRow label="Potential Failure Points" points={deal_evaluation.potential_failure_points} path={createPath('deal_evaluation', 'potential_failure_points')} {...commonProps} />
                         <tr className="border-b border-zinc-200 bg-white hover:bg-zinc-50 page-break-avoid">
                            <td className="p-3 font-semibold text-zinc-700 w-1/3 align-top">Exit Examples (IPO)</td>
                            <td className="p-3 w-2/3">
                                <IPOExamplesDisplay examples={deal_evaluation.exit_options_ipo} path={createPath('deal_evaluation', 'exit_options_ipo')} {...commonProps} />
                            </td>
                        </tr>
                        <tr className="border-b border-zinc-200 bg-white hover:bg-zinc-50 page-break-avoid">
                            <td className="p-3 font-semibold text-zinc-700 w-1/3 align-top">Exit Examples (Acquisition)</td>
                            <td className="p-3 w-2/3">
                                <AcquisitionExamplesDisplay examples={deal_evaluation.exit_options_acquisition} path={createPath('deal_evaluation', 'exit_options_acquisition')} {...commonProps} />
                            </td>
                        </tr>
                        <tr className="border-b border-zinc-200 bg-white hover:bg-zinc-50 page-break-avoid">
                            <td className="p-3 font-semibold text-zinc-700 w-1/3 align-top">Exit Examples (Secondary Sale)</td>
                            <td className="p-3 w-2/3">
                                <SecondarySaleExamplesDisplay examples={deal_evaluation.exit_options_secondary_sale} path={createPath('deal_evaluation', 'exit_options_secondary_sale')} {...commonProps} />
                            </td>
                        </tr>
                        <DetailRow label="VC Fit" points={deal_evaluation.vc_fit} path={createPath('deal_evaluation', 'vc_fit')} {...commonProps} />
                        <DetailRow label="Next Action" points={deal_evaluation.next_action} path={createPath('deal_evaluation', 'next_action')} {...commonProps} />
                    </tbody>
                </table>
            </div>
            {mermaidCode && <MermaidDiagram code={mermaidCode} title="Pictorial Technology Definition" />}
        </div>
    );
};
