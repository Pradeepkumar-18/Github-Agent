import { useState } from 'react';
import { usePullRequests } from '../hooks/usePullRequests';
import { useRepositories } from '../hooks/useRepositories';
import { RiskBadge } from '../components/ui/RiskBadge';
import { Avatar } from '../components/ui/Avatar';
import type { RiskLevel } from '../types';
import { timeAgo, riskColor } from '../utils/formatters';
import { AlertTriangle, ListFilter, ArrowUpRight, RefreshCw, AlertCircle, GitPullRequest, Search } from 'lucide-react';

const today = new Date().toISOString().slice(0, 10);
const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const STATE_BADGE: Record<string, { color: string; bg: string; label: string }> = {
    open: { color: '#22C55E', bg: '#F0FDF4', label: 'Open' },
    closed: { color: '#EF4444', bg: '#FEF2F2', label: 'Closed' },
    merged: { color: '#8B5CF6', bg: '#F5F3FF', label: 'Merged' },
};

export function PullRequests() {
    const [selectedRepoId, setSelectedRepoId] = useState('');
    const [since, setSince] = useState(sixMonthsAgo);
    const [until, setUntil] = useState(today);
    const [fetchResult, setFetchResult] = useState<{ fetched: number; upserted: number } | null>(null);

    const { pullRequests, search, setSearch, stateFilter, setStateFilter, riskFilter, setRiskFilter, fetchLoading, error, fetchFromGitHub } =
        usePullRequests(selectedRepoId || undefined);

    const { repositories } = useRepositories();
    const selectedRepo = repositories.find(r => (r._id ?? r.id) === selectedRepoId);
    const isGitlab = selectedRepo?.provider === 'gitlab';

    const handleFetch = async () => {
        if (!selectedRepoId) return;
        try {
            const res = await fetchFromGitHub({
                repositoryId: selectedRepoId,
                since: new Date(since).toISOString(),
                until: new Date(until + 'T23:59:59').toISOString(),
            });
            setFetchResult(res);
        } catch { /* error shown via hook */ }
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">

            {/* ── Fetch Panel ─────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                    Import pull requests / merge requests from {isGitlab ? 'GitLab' : 'GitHub'}
                </p>
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex flex-col gap-1 min-w-[200px]">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Repository</label>
                        <select
                            value={selectedRepoId}
                            onChange={(e) => { setSelectedRepoId(e.target.value); setFetchResult(null); }}
                            className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-slate-700"
                        >
                            <option value="">— Select a repository —</option>
                            {repositories.map(r => (
                                <option key={String(r._id ?? r.id)} value={String(r._id ?? r.id)}>
                                    {r.fullName} {r.provider === 'gitlab' ? '🦊' : '🐙'}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Since</label>
                        <input type="date" value={since} onChange={(e) => setSince(e.target.value)} max={until}
                            className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-slate-700" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Until</label>
                        <input type="date" value={until} onChange={(e) => setUntil(e.target.value)} min={since} max={today}
                            className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-slate-700" />
                    </div>
                    <button
                        onClick={handleFetch}
                        disabled={!selectedRepoId || fetchLoading}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isGitlab ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        <RefreshCw className={`h-4 w-4 ${fetchLoading ? 'animate-spin' : ''}`} />
                        {fetchLoading ? 'Fetching…' : `Fetch from ${isGitlab ? 'GitLab' : 'GitHub'}`}
                    </button>
                </div>
                {fetchResult && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
                        <GitPullRequest className="h-4 w-4" />
                        Fetched <strong>{fetchResult.fetched}</strong> PRs/MRs — <strong>{fetchResult.upserted}</strong> new stored.
                    </div>
                )}
                {error && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                        <AlertCircle className="h-4 w-4" />{error}
                    </div>
                )}
            </div>

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
                <div className="lg:col-span-3 space-y-4">
                    {/* Search Input */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder={`Search in ${pullRequests.length} pull requests...`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full pl-11 pr-4 py-4 bg-white border border-slate-100 rounded-3xl text-sm font-medium shadow-sm transition-all outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 placeholder:text-slate-400"
                        />
                    </div>

                    {/* Main List */}
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
