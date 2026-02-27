import { useParams, useNavigate } from 'react-router-dom';
import { useRepositories } from '../hooks/useRepositories';
import { useCommits } from '../hooks/useCommits';
import { usePullRequests } from '../hooks/usePullRequests';
import { ScoreBadge } from '../components/ui/ScoreBadge';
import { StatusDot } from '../components/ui/StatusDot';
import { GitCommit, GitPullRequest, Activity, ExternalLink, ShieldCheck, Globe, Clock, Star } from 'lucide-react';
import { scoreColor, timeAgo } from '../utils/formatters';
import { useState } from 'react';

function CircularHealth({ score, size = 160 }: { score: number; size?: number }) {
    const color = scoreColor(score);
    const radius = (size / 2) - 10;
    const circum = 2 * Math.PI * radius;
    const offset = circum - (score / 100) * circum;

    return (
        <div className="relative flex items-center justify-center p-4 bg-white rounded-3xl shadow-sm border border-slate-50" style={{ width: size + 40, height: size + 40 }}>
            {/* Decorative inner glow */}
            <div className="absolute inset-4 rounded-full shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]" />

            <svg width={size} height={size} className="transform -rotate-90 drop-shadow-sm">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke="#F1F5F9" strokeWidth="12" />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={color}
                    strokeWidth="12"
                    strokeDasharray={circum}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-black tracking-tight font-display" style={{ color: '#0F172A' }}>{score}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Health</span>
            </div>
        </div>
    );
}

export function RepositoryDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { repositories } = useRepositories();
    const { commits } = useCommits(id);
    const { pullRequests } = usePullRequests(id);
    const [activeTab, setActiveTab] = useState<'commits' | 'prs' | 'activity'>('commits');

    const repo = repositories.find((r) => r.id === id);

    if (!repo) return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <ShieldCheck className="h-12 w-12 mb-4 opacity-20" />
            <p className="font-bold uppercase tracking-widest text-xs">Repository not found</p>
        </div>
    );

    return (
        <div className="space-y-8 max-w-[1400px]">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Left: Score Card */}
                <CircularHealth score={repo.healthScore} />

                {/* Right: Info */}
                <div className="flex-1 space-y-6 pt-2">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-black tracking-tight text-slate-900" style={{ fontFamily: 'Syne, sans-serif' }}>{repo.name}</h1>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border border-slate-100 ${repo.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                                    {repo.status}
                                </span>
                            </div>
                            <p className="text-slate-500 font-medium max-w-2xl text-base">{repo.description}</p>
                        </div>
                        <button className="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all shadow-sm">
                            <ExternalLink className="h-5 w-5 text-slate-400" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-2xl bg-white border border-slate-50 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><Globe className="h-3 w-3" /> Language</p>
                            <p className="text-sm font-bold text-slate-700">{repo.language}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white border border-slate-50 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><Clock className="h-3 w-3" /> Activity</p>
                            <p className="text-sm font-bold text-slate-700">{timeAgo(repo.lastActivityAt)}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white border border-slate-50 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><Star className="h-3 w-3" /> Stars</p>
                            <p className="text-sm font-bold text-slate-700">{repo.stars.toLocaleString()}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white border border-slate-50 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><ShieldCheck className="h-3 w-3" /> Score</p>
                            <ScoreBadge score={repo.healthScore} size="sm" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="space-y-4">
                <div className="flex gap-1 p-1 bg-slate-100/50 rounded-2xl w-fit border border-slate-100">
                    {[
                        { id: 'commits', icon: GitCommit, label: 'Analysis' },
                        { id: 'prs', icon: GitPullRequest, label: 'Pull Requests' },
                        { id: 'activity', icon: Activity, label: 'Health Journal' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === tab.id
                                ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <tab.icon className="h-4 w-4" strokeWidth={2.5} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="bg-white rounded-3xl border border-slate-50 shadow-sm overflow-hidden min-h-[400px]">
                    {activeTab === 'commits' && (
                        <div className="divide-y divide-slate-50">
                            {commits.map((commit) => (
                                <div
                                    key={commit.id}
                                    className="p-5 flex items-center gap-6 hover:bg-slate-50 cursor-pointer transition-colors"
                                    onClick={() => navigate(`/commits/${commit.sha}`)}
                                >
                                    <code className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase tracking-tighter">
                                        {commit.shortSha}
                                    </code>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-700 truncate">{commit.message}</p>
                                        <p className="text-[11px] font-medium text-slate-400 mt-1">
                                            {commit.authorName} • {timeAgo(commit.committedAt)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-6 flex-shrink-0">
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-0.5">Coverage</p>
                                            <p className="text-xs font-bold text-slate-500">92.4%</p>
                                        </div>
                                        <StatusDot status={commit.evaluationStatus} label />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'prs' && (
                        <div className="divide-y divide-slate-50">
                            {pullRequests.map((pr) => (
                                <div key={pr.id} className="p-5 flex items-center gap-6 hover:bg-slate-50 transition-colors">
                                    <div className="p-2 rounded-xl bg-violet-50 text-violet-500">
                                        <GitPullRequest className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-700">#{pr.prNumber} {pr.title}</p>
                                        <p className="text-[11px] font-medium text-slate-400 mt-1">
                                            {pr.authorName} • {pr.state} • {timeAgo(pr.githubCreatedAt)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`text-[10px] font-bold uppercase py-1 px-3 rounded-full ${pr.riskLevel === 'critical' ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-slate-50 text-slate-400'}`}>
                                            {pr.riskLevel} Risk
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'activity' && (
                        <div className="p-12 text-center">
                            <Activity className="h-12 w-12 mx-auto mb-4 text-slate-200" />
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Health Timeline</h3>
                            <p className="text-xs text-slate-300 mt-2 max-w-xs mx-auto font-medium italic">Journal history is currently being aggregated from git metadata...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
