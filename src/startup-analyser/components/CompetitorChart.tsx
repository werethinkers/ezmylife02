
import React, { useEffect, useRef } from 'react';
import type { ChartData } from '../types';

// Let Chart.js be available on the window object
declare global {
    interface Window {
        Chart: any;
    }
}

interface CompetitorChartProps {
    data: ChartData;
    title: string;
}

export const CompetitorChart: React.FC<CompetitorChartProps> = ({ data, title }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const chartRef = useRef<any | null>(null);

    useEffect(() => {
        if (!canvasRef.current || !data || !data.datasets) return;

        // Destroy previous chart instance if it exists
        if (chartRef.current) {
            chartRef.current.destroy();
        }

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        const chartOptions: any = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: title,
                    font: {
                        size: 16
                    }
                },
            },
        };
        
        // Only apply scales for chart types that use them
        if (data.type === 'bar' || data.type === 'line') {
            chartOptions.scales = {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value: number | string) {
                            if (typeof value === 'number') {
                               if (value >= 1_000_000_000) return '$' + (value / 1_000_000_000) + 'B';
                               if (value >= 1_000_000) return '$' + (value / 1_000_000) + 'M';
                               if (value >= 1_000) return '$' + (value / 1_000) + 'K';
                               return '$' + value;
                            }
                            return value;
                        }
                    }
                }
            };
        }
        
        // For pie/donut charts, we might want to show percentages in tooltips
        if(data.type === 'pie' || data.type === 'donut') {
            chartOptions.plugins.tooltip = {
                callbacks: {
                    label: function(context: any) {
                        let label = context.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed !== null) {
                            label += context.parsed + '%';
                        }
                        return label;
                    }
                }
            }
        }


        chartRef.current = new window.Chart(ctx, {
            type: data.type || 'bar',
            data: {
                labels: data.labels,
                datasets: data.datasets,
            },
            options: chartOptions
        });

        // Cleanup function
        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, [data, title]);

    if (!data || !data.datasets || data.datasets.every(ds => !ds.data || ds.data.length === 0)) {
        return (
            <div className="relative h-96 w-full flex items-center justify-center bg-gray-50 rounded-lg">
                 <div className="text-center p-4">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
                    <p className="text-sm text-gray-500">Data for this chart is not available.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="relative h-96 w-full">
            <canvas ref={canvasRef}></canvas>
        </div>
    );
};
