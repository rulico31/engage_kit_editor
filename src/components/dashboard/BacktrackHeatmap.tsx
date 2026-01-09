import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { type BacktrackStat } from '../../lib/dashboardService';

interface BacktrackHeatmapProps {
    data: BacktrackStat[];
}

export const BacktrackHeatmap: React.FC<BacktrackHeatmapProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="chart-no-data">データがありません</div>;
    }

    // 表示用にデータを整形（最大10件）
    const chartData = data.slice(0, 10).map(d => ({
        path: `${d.fromPage} → ${d.toPage}`,
        count: d.count
    }));

    return (
        <div className="chart-wrapper">
            <h3 className="chart-title">バックトラッキング多発ルート</h3>
            <div className="chart-subtitle">ユーザーが「戻る」を選択した箇所（迷いや再確認の兆候）</div>

            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="path" type="category" width={150} style={{ fontSize: '12px' }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#E91E63" barSize={20} radius={[0, 4, 4, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={`rgba(233, 30, 99, ${1 - index * 0.05})`} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
