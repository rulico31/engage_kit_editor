import React, { useState, useEffect } from 'react';
import { getFunnelData, type FunnelAnalytics } from '../lib/analyticsService';
import './AnalyticsDashboard.css';

interface AnalyticsDashboardProps {
    projectId: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ projectId }) => {
    const [analytics, setAnalytics] = useState<FunnelAnalytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, [projectId]);

    const loadAnalytics = async () => {
        setIsLoading(true);
        const data = await getFunnelData(projectId);
        setAnalytics(data);
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
        </div>
    );
};
