import type { RiskLevel } from '../../types';
import { riskColor } from '../../utils/formatters';

interface RiskBadgeProps {
    level: RiskLevel;
    score?: number;
}

export function RiskBadge({ level, score }: RiskBadgeProps) {
    const color = riskColor(level);

    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
            style={{ color, backgroundColor: `${color}10`, border: `1px solid ${color}20` }}
        >
            <span className="h-1.5 w-1.5 rounded-full shadow-sm" style={{ backgroundColor: color }} />
            {level}
            {score !== undefined && <span className="ml-1 px-1.5 py-0.5 rounded-md bg-white opacity-90 border border-slate-100" style={{ color: '#475569' }}>{score}</span>}
        </span>
    );
}
