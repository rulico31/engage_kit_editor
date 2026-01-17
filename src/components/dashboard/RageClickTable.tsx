import React from 'react';
import type { RageClickStat } from '../../lib/dashboardService';

interface Props {
    data: RageClickStat[];
}

export const RageClickTable: React.FC<Props> = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="p-4 text-center text-zinc-500 bg-zinc-900/30 rounded-lg border border-zinc-700/30">
                Rage Clicks detected: None
            </div>
        );
    }

    return (
        <div className="overflow-hidden bg-zinc-900/30 rounded-lg border border-zinc-700/30">
            <div className="p-4 border-b border-zinc-700/50 bg-zinc-800/30">
                <h3 className="text-sm font-semibold text-zinc-200">Rage Click Targets</h3>
                <p className="text-xs text-zinc-500 mt-1">ユーザーが苛立ち、連打している要素のランキング</p>
            </div>
            <table className="min-w-full divide-y divide-zinc-700/50">
                <thead className="bg-zinc-800/50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                            Element Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                            Type
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                            Clicks
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-700/50">
                    {data.map((item, idx) => (
                        <tr key={`${item.targetNodeId}-${idx}`} className="hover:bg-zinc-800/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-200">
                                {item.nodeName}
                                {item.targetNodeId === null && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                                        Empty Space
                                    </span>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                                {item.targetNodeType || 'background'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                <span className="font-bold text-red-400">{item.count}</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
