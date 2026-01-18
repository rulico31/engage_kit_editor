import React from 'react';
import {
    ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

interface ItemScatterProps {
    data: Array<{
        nodeId: string;
        nodeName: string; // 表示用名前
        avgDuration: number; // 検討時間 (X軸)
        avgHesitation: number; // 迷い指数/離脱率など (Y軸)
        sampleCount: number; // バブルのサイズ用 (Z軸相当)
    }>;
    onNodeClick?: (nodeId: string) => void;
}

export const ItemScatterPlot: React.FC<ItemScatterProps> = ({ data, onNodeClick }) => {
    // データがない場合の対応
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-zinc-500">データが十分にありません</div>;
    }

    // 象限の色分けなどを表現するためのCustom Tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;
            return (
                <div className="bg-zinc-800 border border-zinc-700 p-3 rounded shadow-xl text-xs z-50">
                    <p className="font-bold text-white mb-1">{d.nodeName}</p>
                    <p className="text-zinc-400">平均検討時間: <span className="text-white">{d.avgDuration.toFixed(1)}s</span></p>
                    <p className="text-zinc-400">迷い指数: <span className="text-white">{d.avgHesitation.toFixed(0)}</span></p>
                    <p className="text-zinc-400">サンプル数: <span className="text-white">{d.sampleCount}</span></p>
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {/* Quadrant Background Labels */}
            <div className="absolute top-2 right-2 text-rose-500/30 text-xs font-bold pointer-events-none">要改善 (長時間・高ストレス)</div>
            <div className="absolute bottom-2 left-2 text-emerald-500/30 text-xs font-bold pointer-events-none">良好 (短時間・低ストレス)</div>

            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                        type="number"
                        dataKey="avgDuration"
                        name="平均検討時間"
                        unit="s"
                        stroke="#71717a"
                        fontSize={12}
                        label={{ value: '平均検討時間 (秒)', position: 'bottom', offset: 0, fill: '#71717a', fontSize: 11 }}
                    />
                    <YAxis
                        type="number"
                        dataKey="avgHesitation"
                        name="迷い指数"
                        stroke="#71717a"
                        fontSize={12}
                        label={{ value: '迷い指数 (Stress)', angle: -90, position: 'insideLeft', fill: '#71717a', fontSize: 11 }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Items" data={data} onClick={(d) => onNodeClick && onNodeClick(d.nodeId)} cursor="pointer">
                        {data.map((entry, index) => {
                            // 色判定: 迷いが高いほど赤く
                            let fill = "#3b82f6"; // default blue
                            if (entry.avgHesitation > 60) fill = "#ef4444"; // red
                            else if (entry.avgHesitation > 30) fill = "#f59e0b"; // yellow
                            else fill = "#10b981"; // green

                            return <Cell key={`cell-${index}`} fill={fill} fillOpacity={0.7} stroke={fill} strokeWidth={1} />;
                        })}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
};
