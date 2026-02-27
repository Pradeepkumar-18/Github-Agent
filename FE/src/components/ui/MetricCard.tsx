import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    accentColor?: string;
    critical?: boolean;
    subtitle?: string;
}

export function MetricCard({ title, value, icon: Icon, accentColor = '#2563EB', critical, subtitle }: MetricCardProps) {
    return (
        <div
            className={`relative rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 group ${critical ? 'animate-pulse-glow bg-red-50/30' : 'bg-white'}`}
        >
            <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl" style={{ backgroundColor: `${accentColor}10` }}>
                    <Icon className="h-5 w-5 transition-transform group-hover:scale-110" style={{ color: accentColor }} />
                </div>
                {subtitle && <span className="text-[10px] font-bold uppercase tracking-wider opacity-60" style={{ color: '#64748B' }}>{subtitle}</span>}
            </div>

            <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] mb-1 block" style={{ color: '#94A3B8' }}>
                    {title}
                </span>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold tracking-tight font-display" style={{ color: '#0F172A' }}>
                        {value}
                    </span>
                </div>
            </div>

            {/* Decorative accent dot */}
            <div className="absolute top-3 right-3 h-1.5 w-1.5 rounded-full opacity-20" style={{ backgroundColor: accentColor }} />
        </div>
    );
}
