import { formatDistanceToNow, format } from 'date-fns';

export function timeAgo(dateStr: string): string {
    try {
        return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
        return dateStr;
    }
}

export function formatDate(dateStr: string): string {
    try {
        return format(new Date(dateStr), 'MMM d, yyyy HH:mm');
    } catch {
        return dateStr;
    }
}

export function truncateCommitMessage(msg: string, length = 72): string {
    if (msg.length <= length) return msg;
    return msg.slice(0, length) + '…';
}

export function formatDiff(additions: number, deletions: number): string {
    return `+${additions.toLocaleString()} / -${deletions.toLocaleString()}`;
}

export function scoreColor(score: number): string {
    if (score >= 80) return '#22C55E';
    if (score >= 60) return '#EAB308';
    if (score >= 40) return '#F97316';
    return '#EF4444';
}

export function riskColor(level: string): string {
    const map: Record<string, string> = {
        low: '#22C55E',
        medium: '#EAB308',
        high: '#F97316',
        critical: '#EF4444',
    };
    return map[level] ?? '#94A3B8';
}

export function languageColor(lang: string): string {
    const map: Record<string, string> = {
        TypeScript: '#3178C6',
        JavaScript: '#F7DF1E',
        Python: '#3776AB',
        Go: '#00ADD8',
        PHP: '#777BB4',
        Rust: '#CE422B',
        Java: '#ED8B00',
    };
    return map[lang] ?? '#64748B';
}
