import React, { useState, useEffect } from 'react';
import { getFunnelData, type FunnelAnalytics } from '../lib/analyticsService';
import { fetchExtendedStats, type ExtendedStats } from '../lib/dashboardService';
import './AnalyticsDashboard.css';

interface AnalyticsDashboardProps {
    projectId: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ projectId }) => {
    const [analytics, setAnalytics] = useState<FunnelAnalytics | null>(null);
    const [extendedStats, setExtendedStats] = useState<ExtendedStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, [projectId]);

    const loadAnalytics = async () => {
        setIsLoading(true);
        const [funnelData, extendedData] = await Promise.all([
            getFunnelData(projectId),
            fetchExtendedStats(projectId)
        ]);
        setAnalytics(funnelData);
        setExtendedStats(extendedData);
        setIsLoading(false);
    };

    const exportCSV = () => {
        if (!analytics || analytics.totalSessions === 0) {
            alert('エクスポートするデータがありません');
            return;
        }

        // CSVヘッダー
        const headers = ['ページ名', '表示回数', '到達率(%)', '離脱率(%)'];

        // CSVデータ行
        const rows = analytics.pages.map(page => [
            page.pageName,
            page.views.toString(),
            page.reachRate.toString(),
            page.dropOffRate.toString()
        ]);

        // CSV文字列生成
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // UTF-8 BOM付きでBlob作成（Excel対応）
        const bom = '\uFEFF';
        const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });

        // ダウンロード
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        link.download = `analytics-${projectId}-${timestamp}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (isLoading) {
        return <div className="analytics-loading">読み込み中...</div>;
    }

    if (!analytics || analytics.totalSessions === 0) {
        return (
            <div className="analytics-empty">
                <p>まだ分析データがありません</p>
                <p className="analytics-hint">プロジェクトが公開され、訪問者が来ると分析データが表示されます</p>
            </div>
        );
    }

    const maxViews = Math.max(...analytics.pages.map(p => p.views));

    return (
        <div className="analytics-dashboard">
            <div className="analytics-summary">
                <div className="analytics-metric">
                    <div className="metric-label">総セッション数</div>
                    <div className="metric-value">{analytics.totalSessions}</div>
                </div>
                <div className="analytics-metric">
                    <div className="metric-label">ページ数</div>
                    <div className="metric-value">{analytics.pages.length}</div>
                </div>
                <button
                    className="analytics-export-btn"
                    onClick={exportCSV}
                    title="CSVエクスポート"
                >
                    📊 CSV出力
                </button>
            </div>

            <div className="analytics-funnel">
                <h3 className="funnel-title">ページファネル</h3>
                <div className="funnel-chart">
                    {analytics.pages.map((page, index) => {
                        const barWidth = maxViews > 0 ? (page.views / maxViews) * 100 : 0;

                        return (
                            <div key={page.pageId} className="funnel-row">
                                <div className="funnel-step-number">{index + 1}</div>
                                <div className="funnel-info">
                                    <div className="funnel-page-name">{page.pageName}</div>
                                    <div className="funnel-bar-container">
                                        <div
                                            className="funnel-bar"
                                            style={{ width: `${barWidth}%` }}
                                        >
                                            <span className="funnel-bar-label">
                                                {page.views} 回 ({page.reachRate}%)
                                            </span>
                                        </div>
                                    </div>
                                    {page.dropOffRate > 0 && (
                                        <div className="funnel-dropoff">
                                            離脱率: {page.dropOffRate}%
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>


            {/* Drop-off Factors Section */}
            {
                extendedStats && (
                    <div className="analytics-section">
                        <h3 className="section-title">離脱要因分析</h3>
                        <div className="dropoff-grid">
                            {/* Item Drop-off */}
                            <div className="dropoff-card">
                                <h4>離脱発生アイテム (Top 10)</h4>
                                {extendedStats.dropOffByItem.length > 0 ? (
                                    <table className="dropoff-table">
                                        <thead>
                                            <tr>
                                                <th>アイテム名</th>
                                                <th>タイプ</th>
                                                <th>離脱数</th>
                                                <th>割合</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {extendedStats.dropOffByItem.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="item-name" title={item.nodeId || ''}>
                                                        {item.nodeName === 'unknown' ? '不明な要素' : item.nodeName}
                                                    </td>
                                                    <td className="item-type badge">{item.nodeType}</td>
                                                    <td>{item.count}</td>
                                                    <td>{item.percentage.toFixed(1)}%</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="no-data">データがありません</p>
                                )}
                            </div>

                            {/* Type Drop-off */}
                            <div className="dropoff-card">
                                <h4>アイテムタイプ別離脱傾向</h4>
                                {extendedStats.dropOffByType.length > 0 ? (
                                    <div className="type-distribution">
                                        {extendedStats.dropOffByType.map((type, idx) => (
                                            <div key={idx} className="type-row">
                                                <span className="type-label">{type.nodeType}</span>
                                                <div className="type-bar-wrapper">
                                                    <div
                                                        className="type-bar"
                                                        style={{ width: `${type.percentage}%` }}
                                                    ></div>
                                                </div>
                                                <span className="type-count">{type.count} ({type.percentage.toFixed(1)}%)</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="no-data">データがありません</p>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
