import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRepositories } from '../hooks/useRepositories';
import { RepositoryCard } from '../components/ui/RepositoryCard';
import { Search, GitCommit, AlertCircle, RefreshCw } from 'lucide-react';

export function Commits() {
    const { repositories, loading, error } = useRepositories();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');


    const filteredRepos = repositories.filter(repo =>
        repo.name.toLowerCase().includes(search.toLowerCase()) ||
        repo.fullName.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                <RefreshCw className="h-10 w-10 mb-4 animate-spin opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest text-slate-300">Loading Repositories...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 bg-red-50 border border-red-100 rounded-[32px] flex items-center gap-4 text-red-700">
                <AlertCircle className="h-6 w-6" />
                <p className="text-sm font-bold uppercase tracking-widest">Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Hub Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-2xl border border-blue-100">
                        <GitCommit className="h-4 w-4 text-blue-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Architectural Ledger</span>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
                        Commit Hub
                    </h1>
                    <p className="text-slate-400 font-medium max-w-xl text-lg leading-relaxed">
                        Select a repository to explore its engineering trajectory, audit check-ins, and monitor code intelligence evaluations.
                    </p>
                </div>

                <div className="relative group w-full md:w-96">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search repository hub..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="block w-full pl-12 pr-6 py-5 bg-white border border-slate-100 rounded-[32px] text-sm font-medium shadow-sm transition-all focus:ring-4 focus:ring-blue-50 focus:border-blue-300 outline-none placeholder:text-slate-300"
                    />
                </div>
            </div>


            {/* Repository Grid */}
            {filteredRepos.length === 0 ? (
                <div className="bg-white p-24 rounded-[48px] border border-dashed border-slate-200 flex flex-col items-center text-center">
                    <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                        <GitCommit className="h-10 w-10 text-slate-200" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No Repositories Match</h3>
                    <p className="text-slate-400 text-sm max-w-xs">Adjust your search or add a new repository in Settings to begin tracking commits.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredRepos.map(repo => (
                        <RepositoryCard 
                            key={repo._id || repo.id} 
                            repo={repo} 
                            onClick={() => navigate(`/commits/repository/${repo._id || repo.id}`)}
                            actionLabel="Explore History" 
                        />
                    ))}

                </div>
            )}
        </div>
    );
}

