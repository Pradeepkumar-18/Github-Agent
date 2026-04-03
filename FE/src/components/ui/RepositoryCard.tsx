import React from 'react';
import { GitBranch, Star, Activity, ChevronRight, Github, Gitlab, Zap } from 'lucide-react';
import type { Repository } from '../../types';

interface RepositoryCardProps {
    repo: Repository;
    onClick: () => void;
    actionLabel?: string;
}

export const RepositoryCard: React.FC<RepositoryCardProps> = ({ repo, onClick, actionLabel = 'Explore PRs' }) => {
    const isGitlab = repo.provider === 'gitlab';

    
    // Health score color
    const getHealthColor = (score: number) => {
        if (score >= 80) return 'text-emerald-500 bg-emerald-50';
        if (score >= 50) return 'text-amber-500 bg-amber-50';
        return 'text-red-500 bg-red-50';
    };

    return (
        <div 
            onClick={onClick}
            className="group relative bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 transition-all hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1.5 cursor-pointer overflow-hidden active:scale-95"
        >
            {/* Background Decoration */}
            <div className={`absolute -right-4 -top-4 p-8 opacity-5 transition-transform group-hover:scale-110 group-hover:rotate-12 duration-500
                ${isGitlab ? 'text-orange-600' : 'text-slate-900'}
            `}>
                {isGitlab ? <Gitlab size={120} /> : <Github size={120} />}
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl shadow-inner ${isGitlab ? 'bg-orange-50 text-orange-500' : 'bg-slate-50 text-slate-900'}`}>
                            {isGitlab ? <Gitlab size={24} /> : <Github size={24} />}
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-1 group-hover:text-blue-600 transition-colors">
                                {repo.name}
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{repo.language || 'Unknown Language'}</p>
                        </div>
                    </div>
                    <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-white/50 backdrop-blur-sm ${getHealthColor(repo.healthScore)}`}>
                        <Zap size={10} className="fill-current" />
                        Score: {repo.healthScore}
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Open PRs</p>
                        <div className="flex items-center gap-1.5">
                            <GitBranch size={14} className="text-slate-400" />
                            <span className="text-sm font-black text-slate-700">{repo.openPRs}</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Stars</p>
                        <div className="flex items-center gap-1.5">
                            <Star size={14} className="text-slate-400 fill-slate-50" />
                            <span className="text-sm font-black text-slate-700">{repo.stars}</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Activity</p>
                        <div className="flex items-center gap-1.5">
                            <Activity size={14} className="text-slate-400" />
                            <span className="text-sm font-black text-slate-700">{repo.totalCommits}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[150px]">
                        {repo.fullName}
                    </span>
                    <div className="flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-widest hover:translate-x-1 transition-transform">
                        {actionLabel}
                        <ChevronRight size={14} strokeWidth={3} />
                    </div>

                </div>
            </div>
        </div>
    );
};
