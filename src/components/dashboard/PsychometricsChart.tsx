import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { type InputAnalyticsStat } from '../../lib/dashboardService';

interface PsychometricsChartProps {
    data: InputAnalyticsStat[];
}

export const PsychometricsChart: React.FC<PsychometricsChartProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="chart-no-data">データがありません</div>;
    }

    // 平均スコアの計算（全アイテム）
    const totalItems = data.length;
    const avgScores = {
        exploration: data.reduce((a, b) => a + b.avgExploration, 0) / totalItems,
        reversal: data.reduce((a, b) => a + b.avgReversal, 0) / totalItems,
        confidence: data.reduce((a, b) => a + b.avgConfidence, 0) / totalItems,
        hesitation: data.reduce((a, b) => a + b.avgHesitation, 0) / totalItems,
    };

    const chartData = [
        { name: '探索 (Exploration)', score: avgScores.exploration, fill: '#FF9800' },
        { name: '転換 (Reversal)', score: avgScores.reversal, fill: '#F44336' },
        { name: '確信 (Confidence)', score: avgScores.confidence, fill: '#4CAF50' },
        { name: '総合迷い (Hesitation)', score: avgScores.hesitation, fill: '#607D8B' },
    ];

    // 迷いスコアが高い順トップ5
    const topHesitations = [...data].sort((a, b) => b.avgHesitation - a.avgHesitation).slice(0, 5);

    return (
        <div className="chart-wrapper">
            <h3 className="chart-title">入力心理分析 (Psychometrics)</h3>

            <div className="chart-row">
                <div className="chart-col">
                    <h4 className="chart-subtitle">全体の心理傾向 (平均スコア)</h4>
                    <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer>
                            <BarChart data={chartData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" domain={[0, 100]} />
                                <YAxis dataKey="name" type="category" width={120} style={{ fontSize: '12px' }} />
                                <Tooltip formatter={(value: number) => value.toFixed(1)} />
                                <Bar dataKey="score" fill="#8884d8" barSize={20}>
                                    {/* 個別色指定はdata内で指定してもBarChartの仕様上Cellが必要だが、単純化のため単色またはCellマップ */}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-col">
                    <h4 className="chart-subtitle">⚠️ 迷いが発生している入力項目 TOP 5</h4>
                    <table className="simple-table">
                        <thead>
                            <tr>
                                <th>項目名</th>
                                <th>迷い指数</th>
                                <th>転換(書き直し)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topHesitations.map((item) => (
                                <tr key={item.nodeId}>
                                    <td title={item.nodeName}>{item.nodeName}</td>
                                    <td>
                                        <span className={`score-badge ${item.avgHesitation > 60 ? 'high' : item.avgHesitation > 30 ? 'mid' : 'low'}`}>
                                            {item.avgHesitation.toFixed(0)}
                                        </span>
                                    </td>
                                    <td>{item.avgReversal.toFixed(0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="chart-hint">※「転換」が高い項目は、回答方針を変えたか、書きにくさを感じている箇所です。</p>
                </div>
            </div>
        </div>
    );
};
