import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCommits } from '../hooks/useCommits';
import { useRepositories } from '../hooks/useRepositories';
import { StatusDot } from '../components/ui/StatusDot';
import { Avatar } from '../components/ui/Avatar';
import { Search, ArrowRight, Download, RefreshCw, AlertCircle, GitCommit } from 'lucide-react';
import { timeAgo } from '../utils/formatters';

// Default date range: past 6 months → today
const today = new Date().toISOString().slice(0, 10);
const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

export function Commits() {
    const [selectedRepoId, setSelectedRepoId] = useState('');
    const [since, setSince] = useState(sixMonthsAgo);
    const [until, setUntil] = useState(today);
    const [fetchResult, setFetchResult] = useState<{ fetched: number; upserted: number } | null>(null);

    const {
        commits,
        search, setSearch,
        statusFilter, setStatusFilter,
        loading, fetchLoading, error,
        fetchFromGitHub,
    } = useCommits(selectedRepoId || undefined);

    const { repositories } = useRepositories();
    const navigate = useNavigate();

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
                    Import commits from {isGitlab ? 'GitLab' : 'GitHub'}
                </p>
                <div className="flex flex-wrap gap-3 items-end">
                    {/* Repository selector */}
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

                    {/* Since date */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Since</label>
                        <input
                            type="date"
                            value={since}
                            onChange={(e) => setSince(e.target.value)}
                            max={until}
                            className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-slate-700"
                        />
                    </div>

                    {/* Until date */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Until</label>
                        <input
                            type="date"
                            value={until}
                            onChange={(e) => setUntil(e.target.value)}
                            min={since}
                            max={today}
                            className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-slate-700"
                        />
                    </div>

                    {/* Fetch button */}
                    <button
                        onClick={handleFetch}
                        disabled={!selectedRepoId || fetchLoading}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isGitlab ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        <RefreshCw className={`h-4 w-4 ${fetchLoading ? 'animate-spin' : ''}`} />
                        {fetchLoading ? 'Fetching…' : `Fetch from ${isGitlab ? 'GitLab' : 'GitHub'}`}
                    </button>
                </div>

                {/* Fetch result banner */}
                {fetchResult && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
                        <GitCommit className="h-4 w-4" />
                        Fetched <strong>{fetchResult.fetched}</strong> commits — <strong>{fetchResult.upserted}</strong> new stored.
                    </div>
                )}

                {/* Error banner */}
                {error && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                    </div>
                )}
            </div>

            {/* ── Search & Status Filter ───────────────────── */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full max-w-lg group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search commits, authors, or messages..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white text-sm font-medium rounded-2xl shadow-sm border border-slate-100 outline-none focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-400"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
                        {(['all', 'completed', 'pending', 'processing'] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                    <button className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-400 hover:text-blue-500 transition-all">
                        <Download className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* ── Commit Table ──────────────────────────────── */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-50 overflow-hidden">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Commit / Meta</th>
                            <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Repository</th>
                            <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Author</th>
                            <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Engineering Check</th>
                            <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Activity</th>
                            <th className="px-6 py-4 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="text-center py-16 text-slate-400 text-sm">
                                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                                    Loading commits…
                                </td>
                            </tr>
                        ) : commits.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-16">
                                    <GitCommit className="h-8 w-8 text-slate-200 mx-auto mb-3" />
                                    <p className="text-sm font-semibold text-slate-400">No commits yet</p>
                                    <p className="text-xs text-slate-300 mt-1">
                                        Select a repository, choose a date range, and click "Fetch from GitHub" above.
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            commits.map((commit) => {
                                const repo = repositories.find(r => (r._id ?? r.id) === commit.repositoryId || r.id === commit.repositoryId);
                                return (
                                    <tr
                                        key={commit.id ?? commit.sha}
                                        className="group hover:bg-slate-50 transition-colors cursor-pointer"
                                        onClick={() => navigate(`/commits/${commit.sha}`)}
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <code className="text-[10px] font-bold bg-slate-100 text-slate-400 px-2 py-1 rounded transition-colors group-hover:bg-blue-100 group-hover:text-blue-600">
                                                    {commit.shortSha ?? commit.sha.slice(0, 7)}
                                                </code>
                                                <p className="text-sm font-bold text-slate-700 truncate max-w-sm">{commit.message}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            {repo && (
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-600">{repo.name}</span>
                                                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">{repo.language}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <Avatar src={commit.authorAvatar} name={commit.authorName} size="sm" />
                                                <span className="text-xs font-bold text-slate-600">{commit.authorName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <StatusDot status={commit.evaluationStatus} label />
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-xs font-medium text-slate-400">{timeAgo(commit.committedAt)}</span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <ArrowRight className="h-4 w-4 text-slate-200 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
