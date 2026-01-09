import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface EngagementDistributionProps {
    data: { range: string; count: number }[];
}

const COLORS = {
    '0-20 (Cold)': '#607D8B',      // Grey
    '21-50 (Warm)': '#FFC107',     // Amber
    '51-80 (Hot)': '#FF5722',      // Deep Orange
    '81+ (Super Hot)': '#E91E63'   // Pink
};

export const EngagementDistribution: React.FC<EngagementDistributionProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="chart-no-data">データがありません</div>;
    }

    return (
        <div className="chart-wrapper">
            <h3 className="chart-title">エンゲージメントスコア分布</h3>
            <div className="chart-subtitle">獲得リードの温度感（スコア帯別の人数）</div>

            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="range" style={{ fontSize: '12px' }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" name="人数" radius={[4, 4, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[entry.range as keyof typeof COLORS] || '#8884d8'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
