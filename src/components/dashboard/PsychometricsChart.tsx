import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { type InputAnalyticsStat } from '../../lib/dashboardService';
import { DashboardDetailModal } from './DashboardDetailModal';
import { useState } from 'react';

interface PsychometricsChartProps {
    data: InputAnalyticsStat[];
}

export const PsychometricsChart: React.FC<PsychometricsChartProps> = ({ data }) => {
    const [showModal, setShowModal] = useState(false);
    const hasData = data && data.length > 0;

    // 平均スコアの計算（全アイテム）
    let avgScores = {
        exploration: 0,
        reversal: 0,
        confidence: 0,
        hesitation: 0,
    };

    let chartData = [
        { name: '探索 (Exploration)', score: 0, fill: '#FF9800' },
        { name: '転換 (Reversal)', score: 0, fill: '#F44336' },
        { name: '確信 (Confidence)', score: 0, fill: '#4CAF50' },
        { name: '総合迷い (Hesitation)', score: 0, fill: '#607D8B' },
    ];

    let topHesitations: InputAnalyticsStat[] = [];

    if (hasData) {
        const totalItems = data.length;
        avgScores = {
            exploration: data.reduce((a, b) => a + b.avgExploration, 0) / totalItems,
            reversal: data.reduce((a, b) => a + b.avgReversal, 0) / totalItems,
            confidence: data.reduce((a, b) => a + b.avgConfidence, 0) / totalItems,
            hesitation: data.reduce((a, b) => a + b.avgHesitation, 0) / totalItems,
        };

        chartData = [
            { name: '探索 (Exploration)', score: avgScores.exploration, fill: '#FF9800' },
            { name: '転換 (Reversal)', score: avgScores.reversal, fill: '#F44336' },
            { name: '確信 (Confidence)', score: avgScores.confidence, fill: '#4CAF50' },
            { name: '総合迷い (Hesitation)', score: avgScores.hesitation, fill: '#607D8B' },
        ];

        // 迷いスコアが高い順トップ5
        topHesitations = [...data].sort((a, b) => b.avgHesitation - a.avgHesitation).slice(0, 5);
    }

    return (
        <div className="chart-wrapper">
            <h3 className="chart-title">入力心理分析 (Psychometrics)</h3>

            <div className="chart-row">
                <div className="chart-col">
                    <h4 className="chart-subtitle">全体の心理傾向 (平均スコア分布)</h4>
                    <p className="chart-description-text" style={{ fontSize: '11px', color: '#a1a1aa', marginBottom: '8px' }}>
                        ※探索・転換・確信・迷いの4指標で、ユーザーの回答時の心理状態を可視化します。
                    </p>
                    <div style={{ width: '100%', height: 250, position: 'relative' }}>
                        {hasData ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" domain={[0, 100]} />
                                    <YAxis dataKey="name" type="category" width={120} style={{ fontSize: '12px' }} />
                                    <Tooltip
                                        formatter={(value: number) => value.toFixed(1)}
                                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Bar dataKey="score" fill="#8884d8" barSize={20}>
                                        {/* 個別色指定はdata内で指定してもBarChartの仕様上Cellが必要だが、単純化のため単色またはCellマップ */}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                color: '#71717a',
                                fontSize: '14px'
                            }}>
                                データがありません
                            </div>
                        )}
                    </div>
                </div>

                <div className="chart-col">
                    <h4 className="chart-subtitle flex items-center justify-between">
                        <span>⚠️ 迷いが発生している入力項目 TOP 5</span>
                    </h4>
                    <table className="simple-table">
                        <thead>
                            <tr>
                                <th>項目名</th>
                                <th>迷い指数</th>
                                <th>サンプル数</th>
                                <th>転換(修正回数)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {hasData && topHesitations.length > 0 ? (
                                topHesitations.map((item) => (
                                    <tr key={item.nodeId}>
                                        <td title={item.nodeName}>{item.nodeName}</td>
                                        <td>
                                            <span className={`score-badge ${item.avgHesitation > 60 ? 'high' : item.avgHesitation > 30 ? 'mid' : 'low'}`}>
                                                {item.avgHesitation.toFixed(0)}
                                            </span>
                                        </td>
                                        <td style={{ color: '#a1a1aa' }}>
                                            {item.sampleCount}
                                        </td>
                                        <td>
                                            {(item.nodeType === 'text_input' || item.nodeName.includes('テキスト'))
                                                ? (item.rawReversalCount !== undefined ? item.rawReversalCount.toFixed(1) : (item.avgReversal / 20).toFixed(1))
                                                : '-'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', color: '#71717a', padding: '20px' }}>
                                        データがありません
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <p className="chart-hint">※「転換」が高い項目は、回答方針を変えたか、書きにくさを感じている（書き直しが多い）箇所です。</p>
                    {hasData && (
                        <div className="mt-4 flex justify-start">
                            <button
                                onClick={() => setShowModal(true)}
                                style={{
                                    backgroundColor: '#27272a',
                                    color: '#ffffff',
                                    border: '1px solid #3f3f46',
                                    padding: '6px 16px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    cursor: 'pointer'
                                }}
                                className="font-medium hover:opacity-80 transition-opacity"
                            >
                                すべて見る
                            </button>
                        </div>
                    )}
                </div>
            </div>


            <DashboardDetailModal
                title="迷いが発生している入力項目 (全件)"
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                data={data} // 全データを渡す
                type="hesitation"
            />
        </div >
    );
};
