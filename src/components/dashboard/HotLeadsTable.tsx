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
        <div className="bento-card h-full w-full flex flex-col overflow-hidden">
            <h3 className="mb-4 text-sm font-bold flex items-center gap-2 text-zinc-100 shrink-0">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500/10 text-red-500 ring-1 ring-red-500/20">
                    <Flame size={14} fill="currentColor" />
                </span>
                Hot Leads
                <span className="text-xs font-normal text-zinc-500 ml-2">有望見込み客の行動分析</span>
            </h3>

            <div className="w-full overflow-x-auto rounded-lg border border-zinc-800/50 flex-1 custom-scrollbar">
                <table className="w-full min-w-[1200px] text-sm text-left border-separate border-spacing-0" style={{ width: '100%' }}>
                    {/* Table Header */}
                    <thead className="bg-zinc-900/80 text-zinc-500 sticky top-0 z-10 backdrop-blur-sm">
                        <tr>
                            <th className="py-4 px-4 font-semibold text-[10px] tracking-wider uppercase border-b border-zinc-800 whitespace-nowrap w-[120px]">ランク</th>
                            <th className="py-4 px-4 font-semibold text-[10px] tracking-wider uppercase border-b border-zinc-800 whitespace-nowrap text-right w-[100px]">スコア</th>
                            <th className="py-4 px-6 font-semibold text-[10px] tracking-wider uppercase border-b border-zinc-800 whitespace-nowrap">リード情報</th>
                            <th className="py-4 px-4 font-semibold text-[10px] tracking-wider uppercase border-b border-zinc-800 whitespace-nowrap w-[25%]">行動インサイト</th>
                            <th className="py-4 px-4 font-semibold text-[10px] tracking-wider uppercase border-b border-zinc-800 whitespace-nowrap w-[150px]">リスク検知</th>
                            <th className="py-4 px-4 font-semibold text-[10px] tracking-wider uppercase border-b border-zinc-800 whitespace-nowrap w-[160px]">日時 / デバイス</th>
                            <th className="py-4 px-4 font-semibold text-[10px] tracking-wider uppercase border-b border-zinc-800 whitespace-nowrap text-right w-[80px]">詳細</th>
                        </tr>
                    </thead>

                    {/* Table Body */}
                    <tbody className="divide-y divide-zinc-800/50">
                        {leads.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-20 text-center text-zinc-500">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-zinc-800/30 flex items-center justify-center">
                                            <Clock size={32} className="opacity-10" />
                                        </div>
                                        <div className="text-sm font-medium">データがまだありません</div>
                                        <div className="text-xs opacity-50">サイトへのアクセスをお待ちしています</div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            leads.map((lead) => {
                                const rank = lead.maturity_rank || 'Cold';

                                // Rank Styling
                                let rankBadge = "bg-zinc-800/50 text-zinc-400 border-zinc-800";
                                let rankIcon = null;
                                let rowGlow = "";

                                if (rank === 'Hot') {
                                    rankBadge = "bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_15px_-5px_#ef444433]";
                                    rankIcon = <Flame size={12} fill="currentColor" />;
                                    rowGlow = "shadow-[inset_3px_0_0_0_#ef4444]";
                                } else if (rank === 'Warm') {
                                    rankBadge = "bg-amber-500/10 text-amber-500 border-amber-500/20";
                                    rowGlow = "shadow-[inset_3px_0_0_0_#f59e0b]";
                                }

                                // Lead Info
                                const leadInfo = lead.data?.email || lead.data?.name || lead.data?.company || 'Anonymous';
                                const hasName = !!(lead.data?.email || lead.data?.name || lead.data?.company);

                                // Behavior Flags
                                const flags = lead.behavior_flags || {};

                                return (
                                    <tr
                                        key={lead.id}
                                        className={`group hover:bg-zinc-800/20 transition-all cursor-pointer ${rank === 'Hot' ? 'bg-red-500/[0.02]' : rank === 'Warm' ? 'bg-amber-500/[0.01]' : ''}`}
                                        onClick={() => setSelectedLead(lead)}
                                    >
                                        {/* Rank */}
                                        <td className={`py-5 px-4 align-middle transition-all ${rowGlow}`}>
                                            <span className={`inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-md text-[10px] font-black border tracking-tighter ${rankBadge} whitespace-nowrap uppercase`}>
                                                {rankIcon}
                                                {rank}
                                            </span>
                                        </td>

                                        {/* Score */}
                                        <td className="py-5 px-4 text-right align-middle">
                                            <div className="text-lg font-bold text-zinc-100 font-mono tracking-tighter">
                                                {lead.total_score || 0}
                                            </div>
                                        </td>

                                        {/* Lead Info */}
                                        <td className="py-5 px-6 align-middle">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold border transition-colors ${hasName ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-zinc-900 text-zinc-600 border-zinc-800'}`}>
                                                    {leadInfo.slice(0, 1).toUpperCase()}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className={`font-bold text-sm truncate ${hasName ? 'text-zinc-200' : 'text-zinc-500 italic'}`}>
                                                        {leadInfo}
                                                    </div>
                                                    <div className="text-[10px] text-zinc-500 font-mono mt-1 flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                        <span className="px-1.5 py-0.5 rounded bg-zinc-800/50 border border-zinc-700/50">ID</span>
                                                        <span className="truncate">{lead.ip_address || lead.id.slice(0, 8)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Sent Data */}
                                        <td className="py-5 px-4 align-middle">
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(lead.data || {}).length === 0 ? (
                                                    <span className="text-xs text-zinc-700 italic">No data</span>
                                                ) : (
                                                    Object.entries(lead.data || {}).slice(0, 2).map(([key, value]) => {
                                                        const displayKey = key.startsWith('box-') ? '回答' : key;
                                                        return (
                                                            <div key={key} className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-900/50 border border-zinc-800 text-[10px] whitespace-nowrap max-w-[150px]">
                                                                <span className="text-zinc-500 font-medium">{displayKey}:</span>
                                                                <span className="text-zinc-300 truncate font-semibold">{String(value)}</span>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                                {Object.keys(lead.data || {}).length > 2 && (
                                                    <span className="text-[10px] font-bold text-zinc-600 self-center px-1.5 py-0.5 rounded border border-zinc-800/50 bg-zinc-900/30">+{Object.keys(lead.data || {}).length - 2} items</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Risk/Behavior Flags */}
                                        <td className="py-5 px-4 align-middle">
                                            <div className="flex flex-wrap gap-2">
                                                {flags.rage && (
                                                    <div title="Rage Click Detected" className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-900/10 text-red-500 border border-red-500/20 whitespace-nowrap">
                                                        <MousePointerClick size={10} />
                                                        <span className="text-[10px] font-black uppercase tracking-tighter">Rage</span>
                                                    </div>
                                                )}
                                                {flags.long_idle && (
                                                    <div title="Long Idle Detected" className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-900/10 text-amber-500 border border-amber-500/20 whitespace-nowrap">
                                                        <Hourglass size={10} />
                                                        <span className="text-[10px] font-black uppercase tracking-tighter">Idle</span>
                                                    </div>
                                                )}
                                                {flags.pasted && (
                                                    <div title="Paste Detected" className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-900/10 text-blue-500 border border-blue-500/20 whitespace-nowrap">
                                                        <Clipboard size={10} />
                                                        <span className="text-[10px] font-black uppercase tracking-tighter">Paste</span>
                                                    </div>
                                                )}
                                                {!flags.pasted && !flags.long_idle && !flags.rage && (
                                                    <span className="text-xs text-zinc-800">-</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Date/Device */}
                                        <td className="py-5 px-4 align-middle whitespace-nowrap">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="text-[11px] text-zinc-300 font-bold bg-zinc-800/30 px-2 py-0.5 rounded inline-block w-fit">
                                                    {new Date(lead.created_at).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-1">
                                                    {lead.device_category === 'mobile' ? <Smartphone size={12} className="text-zinc-600" /> :
                                                        lead.device_category === 'tablet' ? <Tablet size={12} className="text-zinc-600" /> : <Monitor size={12} className="text-zinc-600" />}
                                                    <span>{lead.device_category || 'Desktop'}</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Action */}
                                        <td className="py-5 px-4 text-right align-middle">
                                            <div className="inline-flex items-center justify-center p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 group-hover:text-indigo-400 group-hover:border-indigo-500/30 group-hover:bg-indigo-500/5 transition-all">
                                                <ChevronRight size={18} />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
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
