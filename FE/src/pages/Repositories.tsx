import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRepositories } from '../hooks/useRepositories';
import { useToast } from '../context/ToastContext';
import type { Repository } from '../types';
import { languageColor, scoreColor, timeAgo } from '../utils/formatters';
import { Search, GitCommit, MoreHorizontal, Plus, X, Loader2, AlertCircle } from 'lucide-react';

// ─── Health Bar ───────────────────────────────────────────────
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

// ─── Repo Card ────────────────────────────────────────────────
function RepoCard({ repo }: { repo: Repository }) {
    const navigate = useNavigate();
    const inactive = repo.status === 'inactive';

    return (
        <div
            className={`group relative rounded-2xl bg-white p-6 cursor-pointer transition-all duration-300 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 ${inactive ? 'bg-slate-50/50' : ''}`}
            onClick={() => navigate(`/repositories/${repo._id ?? repo.id}`)}
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
                    <p className="text-xs font-bold text-slate-700">{(repo as any).stars ?? '—'}</p>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ color: languageColor(repo.language), backgroundColor: `${languageColor(repo.language)}15` }}>
                    {repo.language || 'Unknown'}
                </span>
                <div className="flex items-center gap-2">
                    <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${repo.provider === 'gitlab'
                                ? 'bg-orange-50 text-orange-600'
                                : 'bg-blue-50 text-blue-600'
                            }`}
                    >
                        {repo.provider === 'gitlab' ? '🦊 GitLab' : '🐙 GitHub'}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 italic">
                        {repo.lastActivityAt ? timeAgo(repo.lastActivityAt) : 'No activity'}
                    </span>
                </div>
            </div>
        </div>
    );
}

// ─── Add Repository Modal ─────────────────────────────────────
function AddRepoModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const { createRepository } = useRepositories();
    const [provider, setProvider] = useState<'github' | 'gitlab'>('github');
    const [owner, setOwner] = useState('');
    const [repo, setRepo] = useState('');
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await createRepository({ owner: owner.trim(), repo: repo.trim(), token: token.trim(), provider });
            showToast(`Successfully connected ${owner}/${repo}`, 'success');
            onCreated();
            onClose();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Failed to create repository';
            setError(msg);
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const isGitlab = provider === 'gitlab';
    const accentClass = isGitlab ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700';
    const tokenPlaceholder = isGitlab ? 'glpat-xxxxxxxxxxxxxxxxxxxx' : 'ghp_xxxxxxxxxxxxxxxxxxxx';
    const tokenHint = isGitlab
        ? 'GitLab → Settings → Access Tokens → scope: api'
        : 'GitHub → Settings → Developer settings → PAT (classic) → scope: repo';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900">Add Repository</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Provider toggle */}
                <div className="flex bg-slate-100 p-1 rounded-xl mb-5">
                    {(['github', 'gitlab'] as const).map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => setProvider(p)}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${provider === p
                                ? (p === 'gitlab' ? 'bg-orange-500 text-white shadow' : 'bg-blue-600 text-white shadow')
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {p === 'github' ? '🐙 GitHub' : '🦊 GitLab'}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-700">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Owner</label>
                        <input
                            type="text"
                            placeholder="e.g. octocat"
                            value={owner}
                            onChange={(e) => setOwner(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Repository Name</label>
                        <input
                            type="text"
                            placeholder="e.g. hello-world"
                            value={repo}
                            onChange={(e) => setRepo(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Personal Access Token</label>
                        <input
                            type="password"
                            placeholder={tokenPlaceholder}
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                        />
                        <p className="mt-1 text-[11px] text-slate-400">{tokenHint}</p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full flex items-center justify-center gap-2 py-3 text-white rounded-xl font-semibold text-sm disabled:opacity-60 transition-colors ${accentClass}`}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        {loading ? 'Connecting…' : 'Add Repository'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────
export function Repositories() {
    const { repositories, search, setSearch, loading, error, refetch } = useRepositories();
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [showModal, setShowModal] = useState(false);

    const filtered = repositories.filter((r) =>
        statusFilter === 'all' ? true : r.status === statusFilter
    );

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto">
            {showModal && (
                <AddRepoModal onClose={() => setShowModal(false)} onCreated={refetch} />
            )}

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

                <div className="flex items-center gap-3">
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

                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-2xl hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Plus className="h-4 w-4" /> Add Repo
                    </button>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="rounded-2xl bg-white shadow-sm border border-slate-100 p-6 animate-pulse">
                            <div className="h-6 bg-slate-100 rounded-lg w-3/4 mb-3" />
                            <div className="h-4 bg-slate-100 rounded-lg w-1/2 mb-4" />
                            <div className="h-3 bg-slate-100 rounded-lg w-full" />
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                    <GitCommit className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="font-semibold">No repositories found</p>
                    <p className="text-sm mt-1">Click "Add Repo" to connect your first GitHub repository.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filtered.map((repo) => <RepoCard key={String(repo._id ?? repo.id)} repo={repo} />)}
                </div>
            )}
        </div>
    );
}
