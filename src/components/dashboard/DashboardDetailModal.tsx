import React from 'react';
import { X } from 'lucide-react';
import "../DashboardView.css"; // Re-use dashboard styles

interface DashboardDetailModalProps {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    data: any[];
    type: 'dropout' | 'hesitation';
    onItemClick?: (id: string) => void;
}

export const DashboardDetailModal: React.FC<DashboardDetailModalProps> = ({
    title,
    isOpen,
    onClose,
    data,
    type,
    onItemClick
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative animate-fade-in">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        style={{
                            backgroundColor: '#27272a',
                            color: '#ffffff',
                            border: '1px solid #3f3f46',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                        className="p-1 hover:opacity-80 transition-opacity flex items-center justify-center"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 custom-scrollbar">
                    {type === 'dropout' && (
                        <table className="leads-table w-full">
                            <thead className="sticky top-0 bg-zinc-900 z-10">
                                <tr>
                                    <th className="text-left py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">アイテム名</th>
                                    <th className="text-left py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">インタラクション</th>
                                    <th className="text-left py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">UU</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {data.map((stat) => {
                                    const maxInteractions = Math.max(...data.map(s => s.interaction_count));
                                    const percentage = maxInteractions > 0 ? (stat.interaction_count / maxInteractions) * 100 : 0;
                                    return (
                                        <tr
                                            key={stat.id}
                                            onClick={() => onItemClick && onItemClick(stat.id)}
                                            className="clickable-row group hover:bg-zinc-800/50 transition-colors cursor-pointer"
                                        >
                                            <td className="py-3 px-2 text-zinc-300 relative">
                                                <div className="relative z-10 font-medium">{stat.name}</div>
                                            </td>
                                            <td className="py-3 px-2 relative">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden max-w-[100px]">
                                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percentage}%` }} />
                                                    </div>
                                                    <div className="text-zinc-300 font-mono text-sm w-12 text-right">{stat.interaction_count}</div>
                                                    <div className="text-zinc-500 text-xs w-10">({percentage.toFixed(0)}%)</div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 text-zinc-400 font-mono">{stat.unique_users}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}

                    {type === 'hesitation' && (
                        <table className="leads-table w-full">
                            <thead className="sticky top-0 bg-zinc-900 z-10">
                                <tr>
                                    <th className="text-left py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">項目名</th>
                                    <th className="text-left py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">迷い指数</th>
                                    <th className="text-left py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">サンプル数</th>
                                    <th className="text-left py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">転換(修正回数)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {data.map((item) => (
                                    <tr key={item.nodeId} className="group hover:bg-zinc-800/50 transition-colors">
                                        <td className="py-3 px-2 text-zinc-300 font-medium">{item.nodeName}</td>
                                        <td className="py-3 px-2">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${item.avgHesitation > 60 ? 'bg-red-500/20 text-red-400' :
                                                item.avgHesitation > 30 ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {item.avgHesitation.toFixed(1)}
                                            </span>
                                        </td>
                                        <td className="py-3 px-2 text-zinc-500 font-mono">
                                            {item.sampleCount}
                                        </td>
                                        <td className="py-3 px-2 text-zinc-400 font-mono">
                                            {(item.nodeType === 'text_input' || item.nodeName.includes('テキスト'))
                                                ? (item.rawReversalCount !== undefined ? item.rawReversalCount.toFixed(1) : (item.avgReversal / 20).toFixed(1))
                                                : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="p-4 border-t border-zinc-800 flex justify-end">
                    <button
                        onClick={onClose}
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
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
};
