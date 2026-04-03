import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useCommits } from '../hooks/useCommits';
import { useRepositories } from '../hooks/useRepositories';
import { StatusDot } from '../components/ui/StatusDot';
import { Avatar } from '../components/ui/Avatar';
import { timeAgo } from '../utils/formatters';
import { Search, ArrowUpRight, RefreshCw, AlertCircle, GitCommit, ChevronLeft, Calendar, Layout, Download } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const today = new Date().toISOString().slice(0, 10);
const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

export function CommitList() {
    const { repoId } = useParams<{ repoId: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();
    
    const [since] = useState(sixMonthsAgo);
    const [until] = useState(today);

    const {
        commits,
        search, setSearch,
        statusFilter, setStatusFilter,
        fetchLoading, error,
        fetchFromGitHub,
    } = useCommits(repoId);


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
            showToast(`Successfully synchronized ${res.fetched} commits.`, 'success');
        } catch { /* error handled by hook */ }
    };

    if (!selectedRepo) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                <AlertCircle className="h-12 w-12 mb-4 opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest">Repository not found</p>
                <Link to="/commits" className="mt-4 text-blue-500 font-bold hover:underline">Back to Commit Hub</Link>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        <Link to="/commits" className="hover:text-blue-500 transition-colors">Commits</Link>
                        <ChevronLeft className="h-3 w-3 rotate-180" />
                        <span className="text-slate-900">{selectedRepo.name}</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
                        Engineering History
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <button className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-400 hover:text-blue-500 transition-all active:scale-95">
                        <Download size={20} />
                    </button>
                    <button
                        onClick={handleFetch}
                        disabled={fetchLoading}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 disabled:opacity-50 ${isGitlab ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-100' : 'bg-slate-900 hover:bg-black shadow-slate-100'}`}
                    >
                        <RefreshCw className={`h-4 w-4 ${fetchLoading ? 'animate-spin' : ''}`} />
                        {fetchLoading ? 'Syncing...' : `Sync History`}
                    </button>
                </div>
            </div>

            {/* Content Explorer */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                {/* Filters Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-6">
                            <Layout className="h-4 w-4 text-blue-500" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Filter Suite</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Evaluation Status</label>
                                <div className="flex flex-col gap-1.5 p-1.5 bg-slate-50/50 rounded-2xl border border-slate-100">
                                    {(['all', 'completed', 'pending', 'processing'] as const).map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setStatusFilter(s)}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-left flex items-center justify-between ${statusFilter === s ? 'bg-white text-slate-900 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            {s}
                                            {statusFilter === s && <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date Range (Sync Only)</label>
                                <div className="p-4 bg-slate-50/30 rounded-2xl border border-slate-100 space-y-3">
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase">
                                        <Calendar size={12} /> Last 6 Months
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium italic">Synchronization is targetted at your most recent architectural shifts.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-6 bg-red-50 border border-red-100 rounded-[32px] animate-in zoom-in duration-300">
                            <AlertCircle className="h-5 w-5 text-red-500 mb-2" />
                            <p className="text-xs font-bold text-red-900 uppercase tracking-widest mb-1">Sync Error</p>
                            <p className="text-[10px] text-red-700 font-medium leading-relaxed">{error}</p>
                        </div>
                    )}
                </div>

                {/* Main Commit Feed */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="relative group mb-6">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Find specific commits, authors, or messages..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full pl-12 pr-6 py-5 bg-white border border-slate-100 rounded-[32px] text-sm font-medium shadow-sm transition-all focus:ring-4 focus:ring-blue-50 focus:border-blue-300 outline-none placeholder:text-slate-300"
                        />
                    </div>

                    {commits.length === 0 ? (
                        <div className="bg-white p-20 rounded-[48px] border border-dashed border-slate-200 flex flex-col items-center">
                            <GitCommit className="h-10 w-10 text-slate-200 mb-4" />
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No commits found</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/30 border-b border-slate-50 text-left">
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Identity / SHA</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Architectural Context</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                                            <th className="px-8 py-5 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {commits.map((commit) => (
                                            <tr
                                                key={commit.id || commit.sha}
                                                onClick={() => navigate(`/commits/detail/${commit.sha}`)}
                                                className="group hover:bg-slate-50/80 transition-all cursor-pointer"
                                            >

                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <code className="px-2 py-1 rounded bg-slate-100 text-[10px] font-black text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                            {commit.sha.slice(0, 7)}
                                                        </code>
                                                        <div className="flex items-center gap-2">
                                                            <Avatar src={commit.authorAvatar} name={commit.authorName} size="sm" />
                                                            <span className="text-xs font-bold text-slate-600">{commit.authorName}</span>
                                                        </div>

                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 max-w-md">
                                                    <p className="text-sm font-bold text-slate-800 truncate mb-1 group-hover:text-blue-600 transition-colors">
                                                        {commit.message}
                                                    </p>

                                                    <span className="text-[10px] font-medium text-slate-400 italic">Committed {timeAgo(commit.committedAt)}</span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex justify-center">
                                                        <StatusDot status={commit.evaluationStatus} label />
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="inline-flex items-center justify-center p-2 rounded-xl bg-slate-50 text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                                                        <ArrowUpRight size={16} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
