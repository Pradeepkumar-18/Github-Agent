import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRepositories } from '../hooks/useRepositories';
import type { Repository } from '../types';
import { languageColor, scoreColor, timeAgo } from '../utils/formatters';
import { Search, GitCommit, MoreHorizontal } from 'lucide-react';

function HealthBar({ score }: { score: number }) {
    const color = scoreColor(score);
    return (
        <div className="mt-5">
            <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Project Quality</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ color: '#FFF', backgroundColor: color }}>{score}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden bg-slate-100">
                <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${score}%`, backgroundColor: color }}
                />
            </div>
        </div>
    );
}

function RepoCard({ repo }: { repo: Repository }) {
    const navigate = useNavigate();
    const inactive = repo.status === 'inactive';

    return (
        <div
            className={`group relative rounded-2xl bg-white p-6 cursor-pointer transition-all duration-300 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 ${inactive ? 'bg-slate-50/50' : ''}`}
            onClick={() => navigate(`/repositories/${repo.id}`)}
        >
            <div className="absolute top-4 right-4 text-slate-300 group-hover:text-blue-500 transition-colors">
                <MoreHorizontal className="h-4 w-4" />
            </div>

            <div className="flex items-start gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                    <GitCommit className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <h3 className="text-base font-bold tracking-tight text-slate-900 truncate">{repo.name}</h3>
                    <span className="text-[11px] font-medium text-slate-400 truncate block">{repo.fullName}</span>
                </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-500 line-clamp-2 min-h-[32px]">{repo.description}</p>

            <HealthBar score={repo.healthScore} />

            <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-slate-50">
                <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-300 uppercase mb-0.5">Commits</p>
                    <p className="text-xs font-bold text-slate-700">{repo.totalCommits.toLocaleString()}</p>
                </div>
                <div className="text-center border-x border-slate-50">
                    <p className="text-[10px] font-bold text-slate-300 uppercase mb-0.5">PRs</p>
                    <p className="text-xs font-bold text-slate-700">{repo.openPRs}</p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-300 uppercase mb-0.5">Stars</p>
                    <p className="text-xs font-bold text-slate-700">{repo.stars}</p>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ color: languageColor(repo.language), backgroundColor: `${languageColor(repo.language)}15` }}>
                    {repo.language}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 italic">{timeAgo(repo.lastActivityAt)}</span>
            </div>
        </div>
    );
}

export function Repositories() {
    const { repositories, search, setSearch } = useRepositories();
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    const filtered = repositories.filter((r) =>
        statusFilter === 'all' ? true : r.status === statusFilter
    );

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="relative w-full max-w-lg group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search projects by name or language..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white text-sm font-medium rounded-2xl shadow-sm border border-slate-100 outline-none focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-400"
                    />
                </div>

                <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
                    {(['all', 'active', 'inactive'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${statusFilter === s ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map((repo) => <RepoCard key={repo.id} repo={repo} />)}
            </div>
        </div>
    );
}
