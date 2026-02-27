import { usePullRequests } from '../hooks/usePullRequests';
import { RiskBadge } from '../components/ui/RiskBadge';
import { Avatar } from '../components/ui/Avatar';
import type { RiskLevel } from '../types';
import { timeAgo, riskColor } from '../utils/formatters';
import { AlertTriangle, ListFilter, ArrowUpRight } from 'lucide-react';

const STATE_BADGE: Record<string, { color: string; bg: string; label: string }> = {
    open: { color: '#22C55E', bg: '#F0FDF4', label: 'Open' },
    closed: { color: '#EF4444', bg: '#FEF2F2', label: 'Closed' },
    merged: { color: '#8B5CF6', bg: '#F5F3FF', label: 'Merged' },
};

export function PullRequests() {
    const { pullRequests, stateFilter, setStateFilter, riskFilter, setRiskFilter } = usePullRequests();

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto">
            {/* Top Controls */}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl shadow-sm border border-slate-50">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                        <ListFilter className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-900 leading-none">Risk Filters</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Refine assessment view</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex gap-1 p-1 bg-slate-50 rounded-2xl border border-slate-100">
                        {(['all', 'open', 'merged', 'closed'] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => setStateFilter(s)}
                                className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${stateFilter === s ? 'bg-white text-slate-900 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    <div className="h-6 w-px bg-slate-100 mx-2" />

                    <div className="flex gap-1 p-1 bg-slate-50 rounded-2xl border border-slate-100">
                        {(['all', 'critical', 'high', 'medium', 'low'] as const).map((r) => (
                            <button
                                key={r}
                                onClick={() => setRiskFilter(r as RiskLevel | 'all')}
                                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${riskFilter === r ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                {/* Main List */}
                <div className="lg:col-span-3 space-y-4">
                    {pullRequests.map((pr) => {
                        const badge = STATE_BADGE[pr.state];
                        const rColor = riskColor(pr.riskLevel);
                        return (
                            <div
                                key={pr.id}
                                className="group relative bg-white p-6 rounded-3xl shadow-sm border border-slate-50 flex items-center gap-6 transition-all hover:shadow-xl hover:-translate-y-0.5"
                            >
                                {/* Lateral Risk Bar */}
                                <div
                                    className="absolute left-0 top-6 bottom-6 w-1.5 rounded-r-full overflow-hidden transition-all group-hover:w-2"
                                    style={{ backgroundColor: rColor, opacity: 0.8 }}
                                />

                                <div className="flex-1 min-w-0 ml-2">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span
                                            className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border"
                                            style={{ color: badge.color, backgroundColor: badge.bg, borderColor: `${badge.color}20` }}
                                        >
                                            {badge.label}
                                        </span>
                                        <span className="text-xs font-bold text-slate-400">#{pr.prNumber}</span>
                                    </div>

                                    <h3 className="text-base font-bold text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors truncate">
                                        {pr.title}
                                    </h3>

                                    <div className="flex items-center gap-4 mt-3">
                                        <div className="flex items-center gap-2">
                                            <Avatar src={pr.authorAvatar} name={pr.authorName} size="sm" />
                                            <span className="text-xs font-bold text-slate-500">{pr.authorName}</span>
                                        </div>
                                        <div className="h-1 w-1 rounded-full bg-slate-200" />
                                        <span className="text-[11px] font-medium text-slate-400">{timeAgo(pr.githubCreatedAt)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 flex-shrink-0">
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1.5">Risk Profile</p>
                                        <RiskBadge level={pr.riskLevel} />
                                    </div>
                                    <button className="p-3 rounded-2xl bg-slate-50 text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                        <ArrowUpRight className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Sidebar Alerts */}
                <div className="space-y-6 sticky top-8">
                    <div className="p-6 bg-red-50/50 rounded-3xl border border-red-100 order-last lg:order-none">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-8 w-8 rounded-xl bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-red-900">Critical items</h3>
                        </div>
                        <p className="text-[11px] leading-relaxed text-red-800 font-medium font-serif opacity-70 italic mb-4">The following pull requests have elevated risk scores and require senior architect review before merging.</p>
                        <div className="space-y-3">
                            {pullRequests.filter(p => p.riskLevel === 'critical').map(p => (
                                <div key={p.id} className="flex items-center gap-3 p-3 bg-white/80 rounded-2xl border border-red-200/50 cursor-pointer hover:shadow-sm transition-all">
                                    <Avatar src={p.authorAvatar} name={p.authorName} size="sm" />
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-red-900 truncate">#{p.prNumber}</p>
                                        <p className="text-[10px] font-medium text-red-700/60 truncate italic">{p.title}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 bg-white rounded-3xl border border-slate-50 shadow-sm overflow-hidden relative">
                        <div className="absolute -top-4 -right-4 h-24 w-24 bg-blue-50 rounded-full blur-3xl opacity-50" />
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Metrics Hub</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500">Auto-Approval Rate</span>
                                <span className="text-xs font-mono font-bold text-blue-600">62%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500">Avg Risk Score</span>
                                <span className="text-xs font-mono font-bold text-amber-500">42/100</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
