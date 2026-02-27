import { scoreColor } from '../../utils/formatters';

interface ScoreBadgeProps {
    score: number;
    size?: 'sm' | 'md' | 'lg';
}

export function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
    const color = scoreColor(score);
    const sizes = {
        sm: 'text-[10px] px-2 py-0.5 rounded-md',
        md: 'text-xs px-2.5 py-1 rounded-lg',
        lg: 'text-sm px-3.5 py-1.5 rounded-xl'
    };

    return (
        <span
            className={`inline-flex items-center font-mono font-bold shadow-sm ${sizes[size]}`}
            style={{
                color: '#FFFFFF',
                backgroundColor: color,
                boxShadow: `0 2px 10px -2px ${color}60`
            }}
        >
            {score}
        </span>
    );
}
