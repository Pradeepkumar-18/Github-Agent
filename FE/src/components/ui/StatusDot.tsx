import type { EvalStatus } from '../../types';

interface StatusDotProps {
    status: EvalStatus;
    label?: boolean;
}

const STATUS_CONFIG: Record<EvalStatus, { color: string; bg: string; label: string; animate?: string }> = {
    completed: { color: '#10B981', bg: '#D1FAE5', label: 'Verified' },
    pending: { color: '#F59E0B', bg: '#FEF3C7', label: 'Queued', animate: 'animate-pulse-dot' },
    processing: { color: '#3B82F6', bg: '#DBEAFE', label: 'Processing', animate: 'animate-spin-slow' },
    failed: { color: '#EF4444', bg: '#FEE2E2', label: 'Critical Failure' },
};

export function StatusDot({ status, label = false }: StatusDotProps) {
    const config = STATUS_CONFIG[status];

    return (
        <span className={`inline-flex items-center ${label ? 'px-2 py-0.5 rounded-full border shadow-sm' : ''}`}
            style={label ? { color: config.color, backgroundColor: config.bg, borderColor: `${config.color}20` } : {}}>
            <span
                className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${config.animate ?? ''}`}
                style={{ backgroundColor: config.color }}
            />
            {label && (
                <span className="text-[10px] font-bold uppercase tracking-wider ml-1.5">
                    {config.label}
                </span>
            )}
        </span>
    );
}
