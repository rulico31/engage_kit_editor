import React, { useState } from 'react';
import type { LeadData } from '../../lib/dashboardService';
import { MicroJourneyModal } from './MicroJourneyModal';
import { ChevronRight, Flame, Clock, Smartphone, Tablet, Monitor, MousePointerClick, Hourglass, Clipboard } from 'lucide-react';

interface HotLeadsTableProps {
    leads: LeadData[];
}

export const HotLeadsTable: React.FC<HotLeadsTableProps> = ({ leads }) => {
    const [selectedLead, setSelectedLead] = useState<LeadData | null>(null);

    return (
        <div className="bento-card h-full p-6 bg-[#18181b] w-full">
            <h3 className="mb-4 text-base font-bold flex items-center gap-2 text-zinc-100">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500/10 text-red-500">
                    <Flame size={14} fill="currentColor" />
                </span>
                Hot Leads
                <span className="text-xs font-normal text-zinc-500 ml-2">有望見込み客の行動分析</span>
            </h3>

            <div className="w-full min-w-full overflow-x-auto rounded-lg border border-zinc-800/50">
                <div role="table" className="min-w-[1000px] w-full text-sm text-left">
                    <div role="rowgroup" className="bg-zinc-900/50 text-zinc-500 border-b border-zinc-800 font-medium text-xs tracking-wider uppercase">
                        <div role="row" className="grid grid-cols-[60px_60px_1.5fr_2.5fr_1fr_1.2fr_50px] items-center">
                            <div role="columnheader" className="py-3 px-2 pl-6 whitespace-nowrap">ランク</div>
                            <div role="columnheader" className="py-3 px-2 whitespace-nowrap">スコア</div>
                            <div role="columnheader" className="py-3 px-2 whitespace-nowrap">リード情報</div>
                            <div role="columnheader" className="py-3 px-2 whitespace-nowrap">送信データ</div>
                            <div role="columnheader" className="py-3 px-2 whitespace-nowrap">行動インサイト</div>
                            <div role="columnheader" className="py-3 px-2 whitespace-nowrap">発生日時 / デバイス</div>
                            <div role="columnheader" className="py-3 px-2 pr-4 text-right whitespace-nowrap">詳細</div>
                        </div>
                    </div>
                    <div role="rowgroup" className="divide-y divide-zinc-800">
                        {leads.length === 0 ? (
                            <div role="row" className="p-12 text-center text-zinc-500 text-xs">
                                <div className="flex flex-col items-center gap-2">
                                    <Clock size={24} className="opacity-20" />
                                    <span>データがまだありません</span>
                                </div>
                            </div>
                        ) : (
                            leads.map((lead) => {
                                const rank = lead.maturity_rank || 'Cold';

                                // Rank Styling
                                let rankStyle = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                                let rankIcon = null;
                                if (rank === 'Hot') {
                                    rankStyle = "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]";
                                    rankIcon = <Flame size={10} fill="currentColor" />;
                                } else if (rank === 'Warm') {
                                    rankStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                                }

                                // Lead Info
                                const leadInfo = lead.data?.email || lead.data?.name || lead.data?.company || 'Anonymous';
                                const hasName = !!(lead.data?.email || lead.data?.name || lead.data?.company);

                                // Behavior Flags
                                const flags = lead.behavior_flags || {};

                                return (
                                    <div key={lead.id} role="row" className="grid grid-cols-[60px_60px_1.5fr_2.5fr_1fr_1.2fr_50px] group hover:bg-zinc-900/80 transition-colors items-start">
                                        <div role="cell" className="py-4 px-2 pl-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${rankStyle}`}>
                                                {rankIcon}
                                                {rank}
                                            </span>
                                        </div>
                                        <div role="cell" className="py-4 px-2">
                                            <div className="text-base font-bold text-zinc-200 font-mono">
                                                {lead.total_score || 0}
                                                <span className="text-xs text-zinc-600 font-normal ml-1">pt</span>
                                            </div>
                                        </div>
                                        <div role="cell" className="py-4 px-2 overflow-hidden">
                                            <div className={`font-medium text-sm truncate ${hasName ? 'text-zinc-200' : 'text-zinc-500 italic'}`}>
                                                {leadInfo}
                                            </div>
                                            <div className="text-xs text-zinc-600 font-mono mt-1.5 opacity-60 group-hover:opacity-100 transition-opacity space-y-1">
                                                <div>ID: {lead.id.slice(0, 8)}</div>
                                                {lead.ip_address && (
                                                    <div className="flex items-center gap-1">
                                                        <span>IP: {lead.ip_address}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div role="cell" className="py-4 px-2 overflow-hidden">
                                            <div className="space-y-1.5 max-h-20 overflow-y-auto no-scrollbar">
                                                {Object.entries(lead.data || {}).length === 0 ? (
                                                    <span className="text-xs text-zinc-700">-</span>
                                                ) : (
                                                    Object.entries(lead.data || {}).map(([key, value]) => {
                                                        const displayKey = key.startsWith('box-') ? '回答' : key;
                                                        return (
                                                            <div key={key} className="flex items-start gap-2 text-xs">
                                                                <span className="text-zinc-500 shrink-0 font-medium">{displayKey}:</span>
                                                                <span className="text-zinc-300 break-words line-clamp-2" title={String(value)}>{String(value)}</span>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                        <div role="cell" className="py-4 px-2">
                                            <div className="flex flex-wrap gap-2">
                                                {flags.pasted && (
                                                    <div title="テキストペースト検知" className="p-1.5 rounded-md bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-help">
                                                        <Clipboard size={14} />
                                                    </div>
                                                )}
                                                {flags.long_idle && (
                                                    <div title="長時間の検討・迷い" className="p-1.5 rounded-md bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-help">
                                                        <Hourglass size={14} />
                                                    </div>
                                                )}
                                                {flags.rage && (
                                                    <div title="レイジクリック検知 (ストレス)" className="p-1.5 rounded-md bg-red-900/20 text-red-400 hover:text-red-300 transition-colors cursor-help border border-red-500/20">
                                                        <MousePointerClick size={14} />
                                                    </div>
                                                )}
                                                {!flags.pasted && !flags.long_idle && !flags.rage && (
                                                    <span className="text-xs text-zinc-700">-</span>
                                                )}
                                            </div>
                                        </div>
                                        <div role="cell" className="py-4 px-2">
                                            <div className="text-sm text-zinc-400 font-medium">
                                                {new Date(lead.created_at).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div className="mt-1.5 flex items-center gap-2 text-xs text-zinc-500">
                                                {lead.device_category === 'mobile' ? <Smartphone size={12} /> :
                                                    lead.device_category === 'tablet' ? <Tablet size={12} /> : <Monitor size={12} />}
                                                <span className="capitalize">{lead.device_category || 'Desktop'}</span>
                                            </div>
                                        </div>
                                        <div role="cell" className="py-4 px-2 pr-4 text-right">
                                            <button
                                                className="group/btn p-2.5 rounded-full hover:bg-violet-500/10 text-zinc-600 hover:text-violet-400 transition-all active:scale-95 inline-flex"
                                                onClick={() => setSelectedLead(lead)}
                                                title="詳細ログを見る"
                                            >
                                                <ChevronRight size={18} className="transition-transform group-hover/btn:translate-x-0.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {selectedLead && (
                <MicroJourneyModal
                    sessionId={selectedLead.session_id}
                    leadId={selectedLead.id}
                    onClose={() => setSelectedLead(null)}
                />
            )}
        </div>
    );
};
