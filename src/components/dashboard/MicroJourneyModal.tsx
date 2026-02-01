import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { getNodeLabel } from '../../lib/dashboardService';
import { useProjectStore } from '../../stores/useProjectStore';
import { formatLogMessage } from '../../lib/analytics';
import type { AnalyticsEventType } from '../../lib/analytics';
import type { NodeGraph, PlacedItemType } from '../../types';

interface PageWithLogics {
    id: string;
    name: string;
    placedItems: (PlacedItemType & { displayName?: string })[];
    allItemLogics?: Record<string, NodeGraph>;
}

interface Props {
    sessionId: string;
    leadId: string;
    onClose: () => void;
}

interface TimelineEvent {
    id: string;
    event_type: string;
    created_at: string;
    metadata: any;
    node_name?: string;
}

export const MicroJourneyModal: React.FC<Props> = ({ sessionId, leadId, onClose }) => {
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const projectMeta = useProjectStore(state => state.projectMeta);

    // プロジェクトデータから全ノードの現在の名称マップを作成
    const currentNodeNames = useMemo(() => {
        const map = new Map<string, string>();
        if (!projectMeta?.data?.pages) return map;

        Object.values(projectMeta.data.pages).forEach((pageRaw: any) => {
            const page = pageRaw as PageWithLogics;

            // Placed Items
            page.placedItems.forEach(item => {
                const label = item.data?.customName || item.displayName || item.name;
                if (label) map.set(item.id, label);
            });

            // Logic Nodes
            if (page.allItemLogics) {
                Object.values(page.allItemLogics).forEach((graphRaw: any) => {
                    const graph = graphRaw as NodeGraph;
                    if (graph.nodes) {
                        graph.nodes.forEach(node => {
                            const label = node.data?.customName || node.data?.label || node.data?.name;
                            if (label) map.set(node.id, label);
                        });
                    }
                });
            }
        });
        return map;
    }, [projectMeta]);

    useEffect(() => {
        const fetchTimeline = async () => {
            setLoading(true);
            // セッションIDに紐づく全ての分析ログを取得
            const { data, error } = await supabase
                .from('analytics_logs')
                .select('*')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true }); // 時系列順

            if (error) {
                console.error("Failed to fetch timeline:", error);
            } else if (data) {
                const mapped = data.map((d: any) => {
                    // 1. まず現在のプロジェクト設定にある名前を最優先 (Custom Name > DisplayName > Name)
                    const currentName = d.node_id ? currentNodeNames.get(d.node_id) : undefined;

                    // 2. なければログのメタデータ (Custom Name優先)
                    // 3. 最後に getNodeLabel のフォールバック
                    const resolvedName = currentName ||
                        d.metadata?.customName ||
                        d.metadata?.custom_name ||
                        d.metadata?.node_name ||
                        d.metadata?.item_name ||
                        getNodeLabel({ id: d.node_id, data: d.metadata, type: d.metadata?.nodeType });

                    return {
                        ...d,
                        node_name: resolvedName
                    };
                });
                setEvents(mapped);
            }
            setLoading(false);
        };

        if (sessionId) fetchTimeline();
    }, [sessionId, currentNodeNames]);

    const getEventIcon = (type: string) => {
        const icons: Record<string, string> = {
            'page_view': '👀',
            'session_start': '🚀',
            'node_execution': '⚡',
            'lead_submit': '✅',
            'input_paste': '📋',
            'input_correction': '✏️',
            'input_abandonment': '⚠️',
            'idle_hesitation': '⏱️',
            'rage_click': '😡',
            'score_change': '📈',
            'logic_branch': '🔀',
            'interaction': '👆',
            'exit_context': '🚪',
            'error': '❌'
        };
        return icons[type] || '🔹';
    };

    const getTimeLabel = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    // アイドル時間を計算（秒単位）
    const getIdleTime = (currentTime: string, previousTime: string): number => {
        const currentMs = new Date(currentTime).getTime();
        const previousMs = new Date(previousTime).getTime();
        return Math.floor((currentMs - previousMs) / 1000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">マイクロ・ジャーニー (行動タイムライン)</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">

                        {loading && <div className="text-center py-4 text-gray-500">ログを読み込み中...</div>}

                        {!loading && events.length === 0 && (
                            <div className="text-center py-4 text-gray-500">ログが見つかりませんでした</div>
                        )}

                        {events.map((ev, idx) => {
                            const isSignificant = ['input_paste', 'idle_hesitation', 'rage_click', 'score_change'].includes(ev.event_type);
                            const prevEvent = idx > 0 ? events[idx - 1] : null;
                            const idleSeconds = prevEvent ? getIdleTime(ev.created_at, prevEvent.created_at) : 0;
                            const showIdleTime = idleSeconds >= 3;

                            return (
                                <React.Fragment key={ev.id}>
                                    {/* アイドル時間インジケーター */}
                                    {showIdleTime && (
                                        <div className="relative flex items-center justify-center my-2">
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-xs text-amber-700">
                                                <span>⏱️</span>
                                                <span className="font-semibold">{idleSeconds}秒 停止</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active ${['node_execution', 'logic_branch', 'exit_context'].includes(ev.event_type) ? 'opacity-80 scale-95' : ''}`}>
                                        {/* Icon */}
                                        <div className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full border-2 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 
                                            ${isSignificant ? 'bg-indigo-100 border-indigo-400' :
                                                ['node_execution', 'logic_branch'].includes(ev.event_type) ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-300'}`}>
                                            <span className={`${['node_execution', 'logic_branch'].includes(ev.event_type) ? 'text-sm' : 'text-lg'}`}>{getEventIcon(ev.event_type)}</span>
                                        </div>

                                        {/* Card */}
                                        <div className={`w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-3 md:p-4 rounded border shadow-sm 
                                            ${['node_execution', 'logic_branch'].includes(ev.event_type) ? 'bg-slate-50/50 border-slate-100' : 'bg-white border-slate-200'}`}>
                                            {(() => {
                                                const { title: fallbackTitle, details, emoji: fallbackEmoji } = formatLogMessage(ev.event_type as AnalyticsEventType, {
                                                    ...ev.metadata,
                                                    node_name: ev.node_name,
                                                    pageName: ev.node_name // page_view用
                                                });

                                                const isSystemNode = ['node_execution', 'logic_branch'].includes(ev.event_type);

                                                // DBに保存されたメッセージがあればそれを使う（メッセージ保存方式）
                                                const title = ev.metadata?.display_title || fallbackTitle;
                                                const emoji = ev.metadata?.display_emoji || fallbackEmoji;

                                                return (
                                                    <>
                                                        <div className="flex items-center justify-between space-x-2 mb-1">
                                                            <div className="font-bold text-slate-400 text-[9px] uppercase tracking-wider">
                                                                {ev.event_type}
                                                            </div>
                                                            <time className="font-caveat font-medium text-[10px] text-indigo-400">{getTimeLabel(ev.created_at)}</time>
                                                        </div>

                                                        {/* 人間が読みやすい要約 (共通の翻訳ロジックを使用) */}
                                                        <div className={`${isSystemNode ? 'text-slate-500 text-xs' : 'text-slate-800 text-sm font-medium'} mb-1 leading-relaxed`}>
                                                            <span className="mr-1.5">{emoji}</span>
                                                            {title}
                                                        </div>

                                                        {details && !isSystemNode && (
                                                            <div className="text-slate-500 text-[10px] mb-2 font-mono italic">
                                                                {details}
                                                            </div>
                                                        )}

                                                        {/* 詳細トグル */}
                                                        <details className="text-slate-400 text-[10px] mt-2 pt-2 border-t border-slate-100/50">
                                                            <summary className="cursor-pointer hover:text-indigo-600 transition-colors">Raw Data</summary>
                                                            <div className="mt-2 p-2 bg-slate-50/50 rounded font-mono text-[9px] overflow-auto max-h-32 text-slate-500">
                                                                {JSON.stringify(ev.metadata, null, 2)}
                                                            </div>
                                                        </details>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 text-right">
                    <span className="text-xs text-gray-400">Session ID: {sessionId}</span>
                </div>
            </div>
        </div>
    );
};
