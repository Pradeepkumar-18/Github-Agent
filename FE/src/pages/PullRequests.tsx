import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRepositories } from '../hooks/useRepositories';
import { RepositoryCard } from '../components/ui/RepositoryCard';
import { Search, GitPullRequest, LayoutGrid, List, Sparkles } from 'lucide-react';

export function PullRequests() {
    const { repositories, loading } = useRepositories();
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    const filteredRepos = repositories.filter(r => 
        r.name.toLowerCase().includes(search.toLowerCase()) || 
        r.fullName.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-slate-300">
                <Sparkles className="h-10 w-10 animate-pulse mb-4 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">Loading Repository Hub...</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Hero Section */}
            <div className="relative overflow-hidden p-12 bg-slate-900 rounded-[48px] shadow-2xl text-white">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <GitPullRequest size={300} />
                </div>
                
                <div className="relative z-10 max-w-2xl space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 backdrop-blur-sm">
                        <Sparkles size={12} className="text-blue-400" />
                        Architectural Command Center
                    </div>
                    <h1 className="text-5xl font-black tracking-tight leading-[1.1]" style={{ fontFamily: 'Syne, sans-serif' }}>
                        Pull Request Hub
                    </h1>
                    <p className="text-slate-400 text-lg font-medium leading-relaxed">
                        Select a repository below to begin your architectural review. Access integrated risk assessments, discussion threads, and direct merge capabilities.
                    </p>
                </div>
            </div>

            {/* Hub Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                        <LayoutGrid className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Connected Repositories</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {filteredRepos.length} active foundations identified
                        </p>
                    </div>
                </div>

                <div className="relative group w-full md:w-96">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search repositories..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-100 rounded-2xl text-xs font-bold shadow-sm transition-all outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 placeholder:text-slate-300 uppercase tracking-widest"
                    />
                </div>
            </div>

            {/* Repository Grid */}
            {filteredRepos.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-32 bg-slate-50 rounded-[64px] border border-dashed border-slate-200">
                    <List className="h-10 w-10 text-slate-200 mb-4" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No matching repositories found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
                    {filteredRepos.map(repo => (
                        <RepositoryCard 
                            key={repo._id || repo.id} 
                            repo={repo} 
                            onClick={() => navigate(`/pull-requests/repository/${repo._id || repo.id}`)}
                        />
                    ))}
                </div>
            )}

            {/* Context Notice */}
            <div className="p-8 bg-blue-50/50 rounded-[40px] border border-blue-100/50 flex items-start gap-4">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                    <Sparkles size={16} />
                </div>
                <div className="space-y-1">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-900">Pro Tip</h4>
                    <p className="text-xs text-blue-800 leading-relaxed font-medium opacity-80">
                        Clicking "Explore PRs" on a repository card will open its full architectural feed, including live synchronization controls and risk assessment summaries for the last 180 days.
                    </p>
                </div>
            </div>
        </div>
    );
}
