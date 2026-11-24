
import React from 'react';

interface MermaidDiagramProps {
    code: string | undefined;
    title: string;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ code, title }) => {
    const diagramCode = code || '';
    const hasContent = diagramCode && !diagramCode.includes("Information not");

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200 page-break-avoid mt-8">
            <h3 className="text-2xl font-bold text-center mb-6 text-zinc-800">{title}</h3>
            {hasContent ? (
                <div className="mermaid text-center p-4 border rounded-lg bg-zinc-50 shadow-inner min-h-[200px] flex items-center justify-center">
                    {diagramCode}
                </div>
            ) : (
                <div className="text-center text-zinc-500 py-8">
                    <p>No diagram available for this section.</p>
                </div>
            )}
        </div>
    );
};
