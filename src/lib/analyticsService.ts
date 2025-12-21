// src/lib/analyticsService.ts
import { supabase } from './supabaseClient';

export interface PageFunnelData {
    pageId: string;
    pageName: string;
    views: number;
    reachRate: number; // 到達率 (%)
    dropOffRate: number; // 離脱率 (%)
}

export interface FunnelAnalytics {
    totalSessions: number;
    pages: PageFunnelData[];
}

/**
 * プロジェクトのファネル分析データを取得
 */
export async function getFunnelData(projectId: string): Promise<FunnelAnalytics> {
    try {
        // analytics_logsからpage_viewイベントを取得
        const { data: logs, error } = await supabase
            .from('analytics_logs')
            .select('event_type, metadata, created_at')
            .eq('project_id', projectId)
            .eq('event_type', 'page_view')
            .order('created_at', { ascending: true });

        if (error) throw error;

        if (!logs || logs.length === 0) {
            return { totalSessions: 0, pages: [] };
        }

        // ページごとのビュー数を集計
        const pageViewCounts: Record<string, { count: number; name: string }> = {};

        logs.forEach((log) => {
            const pageId = log.metadata?.pageId;
            const pageName = log.metadata?.pageName || pageId || 'Unknown';

            if (pageId) {
                if (!pageViewCounts[pageId]) {
                    pageViewCounts[pageId] = { count: 0, name: pageName };
                }
                pageViewCounts[pageId].count++;
            }
        });

        // ページ順序を取得（メタデータから）
        const pageOrder = Object.keys(pageViewCounts);

        // 全体のセッション数（最初のページのビュー数）
        const totalSessions = pageOrder.length > 0 ? pageViewCounts[pageOrder[0]].count : 0;

        // ファネルデータ計算
        const pages: PageFunnelData[] = pageOrder.map((pageId, index) => {
            const views = pageViewCounts[pageId].count;
            const reachRate = totalSessions > 0 ? (views / totalSessions) * 100 : 0;

            // 離脱率 = (現在のビュー数 - 次のページのビュー数) / 現在のビュー数
            const nextPageViews = index < pageOrder.length - 1
                ? pageViewCounts[pageOrder[index + 1]].count
                : 0;
            const dropOffRate = views > 0 ? ((views - nextPageViews) / views) * 100 : 0;

            return {
                pageId,
                pageName: pageViewCounts[pageId].name,
                views,
                reachRate: Math.round(reachRate * 10) / 10,
                dropOffRate: Math.round(dropOffRate * 10) / 10
            };
        });

        return {
            totalSessions,
            pages
        };
    } catch (error) {
        console.error('Error fetching funnel data:', error);
        return { totalSessions: 0, pages: [] };
    }
}
