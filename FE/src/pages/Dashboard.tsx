import analyticsData from '../mock/analytics.json';
import { useCommits } from '../hooks/useCommits';
import { useRepositories } from '../hooks/useRepositories';
import { MetricCard } from '../components/ui/MetricCard';
import { StatusDot } from '../components/ui/StatusDot';
import { Avatar } from '../components/ui/Avatar';
import { ScoreBadge } from '../components/ui/ScoreBadge';
import { riskColor, truncateCommitMessage } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts';
import { GitBranch, GitCommit, GitPullRequest, AlertTriangle } from 'lucide-react';

const { kpis, commitActivity, riskDistribution, developerLeaderboard } = analyticsData;

const CARD_STYLE = {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
    border: '1px solid #F1F5F9',
};

export function Dashboard() {
    const { commits } = useCommits();
    const { repositories } = useRepositories();
    const navigate = useNavigate();

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto">
            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Repositories" value={kpis.totalRepositories} icon={GitBranch} subtitle={`${kpis.activeRepositories} active`} accentColor="#2563EB" />
                <MetricCard title="Commits This Week" value={kpis.totalCommitsThisWeek} icon={GitCommit} accentColor="#0EA5E9" />
                <MetricCard title="Open Pull Requests" value={kpis.openPullRequests} icon={GitPullRequest} accentColor="#8B5CF6" />
                <MetricCard title="Critical Risks" value={kpis.criticalRiskItems} icon={AlertTriangle} accentColor="#EF4444" critical subtitle="Immediate Priority" />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Commit Activity */}
                <div style={{ ...CARD_STYLE }} className="lg:col-span-2 hover-card">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-base font-bold tracking-tight" style={{ color: '#0F172A', fontFamily: 'Syne, sans-serif' }}>
                                Engineering Velocity
                            </h2>
                            <p className="text-xs font-medium" style={{ color: '#64748B' }}>Combined metrics for commits and pull requests</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> <span className="text-[10px] font-bold text-slate-400 uppercase">Commits</span></div>
                            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-400" /> <span className="text-[10px] font-bold text-slate-400 uppercase">PRs</span></div>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={commitActivity} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                            <defs>
                                <linearGradient id="cgCommits" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="cgPRs" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }} tickFormatter={(v) => v.slice(5).replace('-', '/')} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#FFFFFF', border: 'none', borderRadius: 12, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: 12, fontWeight: 600 }}
                                cursor={{ stroke: '#E2E8F0', strokeWidth: 1 }}
                            />
                            <Area type="monotone" dataKey="commits" stroke="#2563EB" strokeWidth={3} fill="url(#cgCommits)" name="Commits" />
                            <Area type="monotone" dataKey="prs" stroke="#8B5CF6" strokeWidth={3} fill="url(#cgPRs)" name="PRs" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Risk Distribution */}
                <div style={{ ...CARD_STYLE }} className="hover-card">
                    <h2 className="text-base font-bold tracking-tight mb-8" style={{ color: '#0F172A', fontFamily: 'Syne, sans-serif' }}>
                        Risk Distribution
                    </h2>
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                            <Pie
                                data={riskDistribution}
                                dataKey="count"
                                nameKey="level"
                                cx="50%"
                                cy="45%"
                                innerRadius={60}
                                outerRadius={85}
                                paddingAngle={5}
                                cornerRadius={4}
                            >
                                {riskDistribution.map((entry) => (
                                    <Cell key={entry.level} fill={entry.color} />
                                ))}
                            </Pie>
                            <Legend
                                verticalAlign="bottom"
                                formatter={(value) => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{value}</span>}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#FFFFFF', border: 'none', borderRadius: 12, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: 12, fontWeight: 600 }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Commits */}
                <div style={CARD_STYLE} className="hover-card">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-base font-bold tracking-tight" style={{ color: '#0F172A', fontFamily: 'Syne, sans-serif' }}>
                            Recent Security Checks
                        </h2>
                        <button className="text-[11px] font-bold text-blue-600 uppercase tracking-wider hover:underline" onClick={() => navigate('/commits')}>View All</button>
                    </div>
                    <div className="space-y-1">
                        {commits.slice(0, 5).map((commit) => {
                            const repo = repositories.find((r) => r.id === commit.repositoryId);
                            return (
                                <div
                                    key={commit.id}
                                    className="flex items-center gap-4 p-3.5 rounded-xl cursor-pointer transition-all hover:bg-slate-50 group"
                                    onClick={() => navigate(`/commits/${commit.sha}`)}
                                >
                                    <Avatar src={commit.authorAvatar} name={commit.authorName} size="md" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <code className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-tighter transition-colors group-hover:bg-blue-100 group-hover:text-blue-600">{commit.shortSha}</code>
                                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>{repo?.name}</span>
                                        </div>
                                        <p className="text-sm font-semibold truncate mt-1" style={{ color: '#334155' }}>
                                            {truncateCommitMessage(commit.message, 50)}
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <StatusDot status={commit.evaluationStatus} label />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Developer Leaderboard */}
                <div style={CARD_STYLE} className="hover-card">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-base font-bold tracking-tight" style={{ color: '#0F172A', fontFamily: 'Syne, sans-serif' }}>
                            Top Contributors
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quality score</p>
                    </div>
                    <div className="space-y-3">
                        {developerLeaderboard.map((dev, idx) => (
                            <div key={dev.name} className="flex items-center gap-4 p-3 rounded-xl transition-all hover:bg-slate-50">
                                <span className="text-xs font-bold w-6 text-slate-300 font-mono italic">
                                    #{idx + 1}
                                </span>
                                <Avatar src={dev.avatar} name={dev.name} size="md" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold" style={{ color: '#1E293B' }}>{dev.name}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5 text-slate-400">{dev.commits} contributions</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <ScoreBadge score={dev.averageScore} size="sm" />
                                    <div
                                        className="h-1.5 w-1.5 rounded-full"
                                        style={{ backgroundColor: riskColor(dev.riskLevel), boxShadow: `0 0 8px ${riskColor(dev.riskLevel)}60` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
