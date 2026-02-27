import React from 'react';
import type { FinancialProjections } from '../types';
import { EditableContent, highlightText } from './EditableContent';

interface FinancialProjectionsTableProps {
    projections: FinancialProjections;
    onUpdate: (path: (string | number)[], value: any) => void;
    keywords: string[];
    highlightEnabled: boolean;
}

const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A';
    // Format large numbers into millions or billions for readability
    if (Math.abs(value) >= 1_000_000_000) {
        return `$${(value / 1_000_000_000).toFixed(2)}B`;
    }
    if (Math.abs(value) >= 1_000_000) {
        return `$${(value / 1_000_000).toFixed(2)}M`;
    }
     if (Math.abs(value) >= 1_000) {
        return `$${(value / 1_000).toFixed(2)}K`;
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

export const FinancialProjectionsTable: React.FC<FinancialProjectionsTableProps> = ({ projections, onUpdate, keywords, highlightEnabled }) => {
    if (!projections || !projections.headers || projections.headers.length === 0 || !projections.rows || projections.rows.length === 0) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-2xl font-bold text-center mb-4 text-gray-800">Financial Projections</h3>
                <p className="text-center text-gray-500 py-8">Financial projection data not available.</p>
            </div>
        );
    }

    const handleValueUpdate = (rowIndex: number, valueIndex: number, newValue: string) => {
        const numericValue = parseFloat(newValue.replace(/[^0-9.-]+/g, ""));
        onUpdate(['structuredData', 'financial_projections', 'rows', rowIndex, 'values', valueIndex], isNaN(numericValue) ? null : numericValue);
    };

    const handleMetricUpdate = (rowIndex: number, newValue: string) => {
        onUpdate(['structuredData', 'financial_projections', 'rows', rowIndex, 'metric'], newValue);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 page-break-avoid">
            <h3 className="text-2xl font-bold text-center mb-6 text-gray-800">Financial Projections</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border">
                    <thead className="bg-gray-100">
                        <tr>
                            {projections.headers.map((header, index) => (
                                <th key={index} className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                    {highlightText(header, keywords, highlightEnabled)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {projections.rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800 w-1/3">
                                    <EditableContent
                                        value={row.metric}
                                        onUpdate={(newValue) => handleMetricUpdate(rowIndex, newValue)}
                                        keywords={keywords}
                                        highlightEnabled={highlightEnabled}
                                        placeholder="Metric Name"
                                    />
                                </td>
                                {row.values.map((value, valueIndex) => (
                                    <td key={valueIndex} className="px-6 py-4 whitespace-nowrap text-gray-600">
                                        <EditableContent
                                            value={formatCurrency(value)}
                                            onUpdate={(newValue) => handleValueUpdate(rowIndex, valueIndex, newValue)}
                                            keywords={keywords}
                                            highlightEnabled={highlightEnabled}
                                            placeholder="Enter Value"
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             {projections.source && projections.source.sourceDetail && projections.source.sourceDetail !== 'N/A' && (
                <p className="text-xs text-gray-500 mt-3 text-right">
                    Source: {projections.source.sourceType.replace(/_/g, ' ')} ({projections.source.sourceDetail})
                </p>
            )}
        </div>
    );
};
