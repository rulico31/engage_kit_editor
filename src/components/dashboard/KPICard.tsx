import React from 'react';

interface KPICardProps {
    title: string;
    value: string;
    unit?: string;
    icon?: React.ReactNode;
}

export const KPICard: React.FC<KPICardProps> = ({
    title,
    value,
    unit,
    icon
}) => {
    return (
        <div className="bento-card h-full group hover:border-zinc-700 transition-all justify-between">
            <div className="flex justify-between items-start z-10 w-full">
                <div>
                    <h3 className="text-zinc-400 text-sm font-medium tracking-wide mb-1">{title}</h3>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
                        {unit && <span className="text-sm text-zinc-500 font-medium">{unit}</span>}
                    </div>
                </div>
                {icon && <div className="p-2 bg-white/5 rounded-lg text-zinc-400 group-hover:text-white transition-colors">{icon}</div>}
            </div>
        </div>
    );
};
