import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { type ThinkingTimeStat } from '../../lib/dashboardService';

interface ThinkingTimeChartProps {
    data: ThinkingTimeStat[];
}

const COLORS = {
    intuitive: '#4CAF50', // Green
    normal: '#2196F3',    // Blue
    hesitation: '#FF9800',// Orange
    noise: '#9E9E9E'      // Grey
};

const LABELS = {
    intuitive: '直感 (Intuitive)',
    normal: '通常 (Normal)',
    hesitation: '迷い (Hesitation)',
    noise: 'ノイズ (Noise)'
};

export const ThinkingTimeChart: React.FC<ThinkingTimeChartProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="chart-no-data">データがありません</div>;
    }

    // noiseを除外して表示する場合（オプション）
    const chartData = data.filter(d => d.pattern !== 'noise');

    return (
        <div className="chart-wrapper">
            <h3 className="chart-title">思考時間パターン (Thinking Time)</h3>
            <div className="chart-subtitle">ユーザーがアクションを起こすまでの「迷い」の割合</div>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                // ラベル表示ロジック
                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                                const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                                return percent > 0.05 ? (
                                    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                                        {`${(percent * 100).toFixed(0)}%`}
                                    </text>
                                ) : null;
                            }}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="count"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[entry.pattern] || '#8884d8'} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: number, name: string, props: any) => {
                                const label = LABELS[props.payload.pattern as keyof typeof LABELS] || name;
                                return [`${value}回`, label];
                            }}
                        />
                        <Legend formatter={(value, entry: any) => LABELS[entry.payload.pattern as keyof typeof LABELS] || value} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="chart-legend-note">
                <ul className="legend-note-list">
                    <li><strong>⚡ 直感 (&lt;3s)</strong>: 即答。確信度が高い状態。</li>
                    <li><strong>🤔 通常 (3-15s)</strong>: 一般的な思考・読み込み時間。</li>
                    <li><strong>😰 迷い (&gt;15s)</strong>: 悩み、離脱リスクが高い状態。</li>
                </ul>
            </div>
        </div>
    );
};
