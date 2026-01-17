import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { getNodeLabel } from '../../lib/dashboardService';

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
                const mapped = data.map((d: any) => ({
                    ...d,
                    node_name: d.metadata?.node_name || d.metadata?.item_name || getNodeLabel({ id: d.node_id, data: d.metadata, type: d.metadata?.nodeType })
                }));
                setEvents(mapped);
            }
            setLoading(false);
        };

        if (sessionId) fetchTimeline();
    }, [sessionId]);

    const getEventIcon = (type: string, meta: any) => {
        if (type === 'page_view') return '🏁';
        if (type === 'input_paste') return '📋';
        if (type === 'input_correction') return '✏️';
        if (type === 'input_abandonment') return '💨';
        if (type === 'idle_hesitation') return '🤔';
        if (type === 'rage_click') return '😡';
        if (type === 'score_change') return '💎';
        if (type === 'interaction') return '👆';
        return '🔹';
    };

    const getTimeLabel = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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

                            return (
                                <div key={ev.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    {/* Icon */}
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 
                    ${isSignificant ? 'bg-indigo-100 border-indigo-400' : 'bg-white border-slate-300'}`}>
                                        <span className="text-lg">{getEventIcon(ev.event_type, ev.metadata)}</span>
                                    </div>

                                    {/* Card */}
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 shadow-sm bg-white">
                                        <div className="flex items-center justify-between space-x-2 mb-1">
                                            <div className="font-bold text-slate-900 text-sm">
                                                {ev.event_type === 'score_change' ? 'スコア変動' :
                                                    ev.event_type === 'input_corrected' ? '入力修正' :
                                                        ev.event_type}
                                            </div>
                                            <time className="font-caveat font-medium text-xs text-indigo-500">{getTimeLabel(ev.created_at)}</time>
                                        </div>
                                        <div className="text-slate-500 text-xs">
                                            {ev.node_name && <div className="mb-1 font-semibold text-slate-700">{ev.node_name}</div>}
                                            {ev.event_type === 'score_change' && (
                                                <div className="text-pink-600 font-bold">+{ev.metadata?.delta}pt (累計: {ev.metadata?.total})</div>
                                            )}
                                            {ev.event_type === 'input_paste' && (
                                                <div>ペースト検知 (長さ: {ev.metadata?.length})</div>
                                            )}
                                            {JSON.stringify(ev.metadata).slice(0, 100)}...
                                        </div>
                                    </div>
                                </div>
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
