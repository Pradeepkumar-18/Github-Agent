import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { usePullRequests } from '../hooks/usePullRequests';
import { useRepositories } from '../hooks/useRepositories';
import { RiskBadge } from '../components/ui/RiskBadge';
import { Avatar } from '../components/ui/Avatar';
import type { RiskLevel } from '../types';
import { timeAgo, riskColor } from '../utils/formatters';
import { ListFilter, ArrowUpRight, RefreshCw, AlertCircle, GitPullRequest, Search, ChevronLeft, GitMerge, CheckCircle, XCircle } from 'lucide-react';


const today = new Date().toISOString().slice(0, 10);
const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const STATE_BADGE: Record<string, { color: string; bg: string; icon: any; label: string }> = {
    open: { color: '#3B82F6', bg: '#EFF6FF', icon: GitPullRequest, label: 'Open' },
    closed: { color: '#EF4444', bg: '#FEF2F2', icon: XCircle, label: 'Closed' },
    merged: { color: '#8B5CF6', bg: '#F5F3FF', icon: GitMerge, label: 'Merged' },
};

export function PullRequestList() {
    const { repoId } = useParams<{ repoId: string }>();
    const navigate = useNavigate();
    const [since] = useState(sixMonthsAgo);
    const [until] = useState(today);
    const [fetchResult, setFetchResult] = useState<{ fetched: number; upserted: number } | null>(null);


    const { pullRequests, search, setSearch, stateFilter, setStateFilter, riskFilter, setRiskFilter, fetchLoading, error, fetchFromGitHub } =
        usePullRequests(repoId);

    const { repositories } = useRepositories();
    const selectedRepo = repositories.find(r => (r._id ?? r.id) === repoId);
    const isGitlab = selectedRepo?.provider === 'gitlab';

    const handleFetch = async () => {
        if (!repoId) return;
        try {
            const res = await fetchFromGitHub({
                repositoryId: repoId,
                since: new Date(since).toISOString(),
                until: new Date(until + 'T23:59:59').toISOString(),
            });
            setFetchResult(res);
        } catch { /* error shown via hook */ }
    };

    if (!selectedRepo) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                <AlertCircle className="h-12 w-12 mb-4 opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest">Repository not found</p>
                <Link to="/pull-requests" className="mt-4 text-blue-500 font-bold hover:underline">Back to Hub</Link>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        <Link to="/pull-requests" className="hover:text-blue-500 transition-colors">Pull Requests</Link>
                        <ChevronLeft className="h-3 w-3 rotate-180" />
                        <span className="text-slate-900">{selectedRepo.name}</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
                        Architectural Feed
                    </h1>
                </div>

                <button
                    onClick={handleFetch}
                    disabled={fetchLoading}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 disabled:opacity-50 ${isGitlab ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-100' : 'bg-slate-900 hover:bg-black shadow-slate-100'}`}
                >
                    <RefreshCw className={`h-4 w-4 ${fetchLoading ? 'animate-spin' : ''}`} />
                    {fetchLoading ? 'Syncing...' : `Sync with ${isGitlab ? 'GitLab' : 'GitHub'}`}
                </button>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                {/* Left Sidebar: Filters & Actions */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-6">
                            <ListFilter className="h-4 w-4 text-blue-500" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Refine View</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['all', 'open', 'merged', 'closed'] as const).map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setStateFilter(s)}
                                            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${stateFilter === s ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Risk Level</label>
                                <div className="flex flex-col gap-2">
                                    {(['all', 'critical', 'high', 'medium', 'low'] as const).map((r) => (
                                        <button
                                            key={r}
                                            onClick={() => setRiskFilter(r as RiskLevel | 'all')}
                                            className={`w-full px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-left transition-all border flex items-center justify-between group ${riskFilter === r ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}
                                        >
                                            {r}
                                            <div className={`h-1.5 w-1.5 rounded-full ${riskFilter === r ? 'bg-blue-500' : 'bg-slate-200 group-hover:bg-slate-300'}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {fetchResult && (
                        <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-[32px] animate-in zoom-in duration-300">
                            <CheckCircle className="h-5 w-5 text-emerald-500 mb-2" />
                            <p className="text-xs font-bold text-emerald-900 uppercase tracking-widest mb-1">Update Success</p>
                            <p className="text-[10px] text-emerald-700 font-medium leading-relaxed">
                                Identified {fetchResult.fetched} items. {fetchResult.upserted} new assessments added to the hub.
                            </p>
                        </div>
                    )}
                    {error && (
                        <div className="p-6 bg-red-50 border border-red-100 rounded-[32px] animate-in zoom-in duration-300">
                            <AlertCircle className="h-5 w-5 text-red-500 mb-2" />
                            <p className="text-xs font-bold text-red-900 uppercase tracking-widest mb-1">Sync Error</p>
                            <p className="text-[10px] text-red-700 font-medium leading-relaxed">{error}</p>
                        </div>
                    )}
                </div>


                {/* Right Column: Main List */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="relative group mb-6">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by title, number, or author..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full pl-12 pr-6 py-5 bg-white border border-slate-100 rounded-[32px] text-sm font-medium shadow-sm transition-all focus:ring-4 focus:ring-blue-50 focus:border-blue-300 outline-none placeholder:text-slate-300"
                        />
                    </div>

                    {pullRequests.length === 0 ? (
                        <div className="bg-white p-20 rounded-[48px] border border-dashed border-slate-200 flex flex-col items-center">
                            <GitPullRequest className="h-10 w-10 text-slate-200 mb-4" />
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No pull requests found</p>
                        </div>
                    ) : (
                        pullRequests.map((pr) => {
                            const badge = STATE_BADGE[pr.state] || STATE_BADGE.open;
                            const rColor = riskColor(pr.riskLevel);
                            const Icon = badge.icon;
                            return (
                                <div
                                    key={pr._id || pr.id}
                                    onClick={() => navigate(`/pull-requests/detail/${pr._id || pr.id}`)}
                                    className="group relative bg-white p-7 rounded-[32px] shadow-sm border border-slate-50 flex items-center gap-6 transition-all hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-1 cursor-pointer overflow-hidden"
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 opacity-80" style={{ backgroundColor: rColor }} />
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5`} style={{ backgroundColor: badge.bg, color: badge.color }}>
                                                <Icon size={10} />
                                                {badge.label}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-300">#{pr.prNumber}</span>
                                        </div>

                                        <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-3 group-hover:text-blue-600 transition-colors truncate">
                                            {pr.title}
                                        </h3>

                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <Avatar src={pr.authorAvatar} name={pr.authorName} size="sm" />
                                                <span className="text-xs font-bold text-slate-500">{pr.authorName}</span>
                                            </div>
                                            <div className="h-1 w-1 rounded-full bg-slate-100" />
                                            <span className="text-[11px] font-medium text-slate-400 italic">{timeAgo(pr.githubCreatedAt)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8 flex-shrink-0">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">Assessment</p>
                                            <RiskBadge level={pr.riskLevel} />
                                        </div>
                                        <div className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all">
                                            <ArrowUpRight size={20} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
