import { useNavigate } from 'react-router-dom';
import { useCommits } from '../hooks/useCommits';
import { useRepositories } from '../hooks/useRepositories';
import { StatusDot } from '../components/ui/StatusDot';
import { Avatar } from '../components/ui/Avatar';
import { Search, ArrowRight, Download, Calendar } from 'lucide-react';
import { timeAgo } from '../utils/formatters';

export function Commits() {
    const { commits, search, setSearch, statusFilter, setStatusFilter } = useCommits();
    const { repositories } = useRepositories();
    const navigate = useNavigate();

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full max-w-lg group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
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
                        <Calendar className="h-4.5 w-4.5" />
                    </button>
                    <button className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-400 hover:text-blue-500 transition-all">
                        <Download className="h-4.5 w-4.5" />
                    </button>
                </div>
            </div>

            {/* Commit List / Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-50 overflow-hidden">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-bottom border-slate-100">
                            <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Commit / Meta</th>
                            <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Repository</th>
                            <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Author</th>
                            <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Engineering Check</th>
                            <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Activity</th>
                            <th className="px-6 py-4 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {commits.map((commit) => {
                            const repo = repositories.find(r => r.id === commit.repositoryId);
                            return (
                                <tr
                                    key={commit.id}
                                    className="group hover:bg-slate-50 transition-colors cursor-pointer"
                                    onClick={() => navigate(`/commits/${commit.sha}`)}
                                >
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <code className="text-[10px] font-bold bg-slate-100 text-slate-400 px-2 py-1 rounded transition-colors group-hover:bg-blue-100 group-hover:text-blue-600">
                                                {commit.shortSha}
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
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
