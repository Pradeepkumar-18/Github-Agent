import { useParams } from 'react-router-dom';
import { useEvaluation } from '../hooks/useEvaluation';
import { useCommits } from '../hooks/useCommits';
import { Avatar } from '../components/ui/Avatar';
import { StatusDot } from '../components/ui/StatusDot';
import { formatDate, scoreColor } from '../utils/formatters';
import { ChevronRight, GitBranch, FileText, Minus, CheckCircle, Lightbulb, AlertCircle, ShieldCheck, Cpu } from 'lucide-react';

function ScoreBar({ label, score }: { label: string; score: number }) {
    const color = scoreColor(score);
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
                <span className="text-xs font-bold font-mono" style={{ color }}>{score}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${score}%`, backgroundColor: color }}
                />
            </div>
        </div>
    );
}

export function CommitDetail() {
    const { sha } = useParams();
    const { commits } = useCommits();
    const commit = commits.find((c) => c.sha === sha);
    const { evaluation } = useEvaluation(commit?.id ?? null);

    if (!commit || !evaluation) return (
        <div className="flex flex-col items-center justify-center h-full text-slate-300">
            <Cpu className="h-12 w-12 mb-4 opacity-10 animate-pulse" />
            <p className="font-bold uppercase tracking-widest text-[10px]">Analyzing commit metadata...</p>
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full items-start max-w-[1600px] mx-auto">
            {/* Left: Commit Context */}
            <div className="space-y-6">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                        <ShieldCheck className="h-32 w-32" />
                    </div>
                    <div className="flex items-center gap-3 mb-6">
                        <code className="text-[10px] font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl uppercase tracking-tighter">
                            {commit.sha}
                        </code>
                        <StatusDot status={commit.evaluationStatus} label />
                    </div>

                    <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-4 leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
                        {commit.message}
                    </h1>

                    <div className="flex items-center gap-4 mb-8">
                        <Avatar src={commit.authorAvatar} name={commit.authorName} size="md" />
                        <div>
                            <p className="text-sm font-bold text-slate-700 leading-tight">{commit.authorName}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">{formatDate(commit.committedAt)}</p>
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-2 mb-4">
                            <GitBranch className="h-4 w-4 text-slate-400" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Impact Details</p>
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Files</p>
                                <p className="text-sm font-bold text-slate-700">{commit.changedFiles}</p>
                            </div>
                            <div className="border-x border-slate-200 px-6">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Additions</p>
                                <p className="text-sm font-bold text-green-600">+{commit.additions}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Deletions</p>
                                <p className="text-sm font-bold text-red-500">-{commit.deletions}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* File Analysis Placeholder */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-50 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5" /> Component breakdown
                        </h3>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {['src/services/auth.ts', 'src/utils/security.ts', 'package.json'].map(file => (
                            <div key={file} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors cursor-pointer group">
                                <span className="text-xs font-mono text-slate-600 group-hover:text-blue-600 transition-colors">{file}</span>
                                <ChevronRight className="h-4 w-4 text-slate-200 group-hover:text-slate-400 transition-all" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: AI Evaluation */}
            <div className="space-y-6 lg:sticky lg:top-8">
                <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 border-t-4 border-t-blue-600 relative overflow-hidden">
                    <div className="absolute top-4 right-4 animate-pulse">
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100">Live Intel</span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mb-8 tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
                        Code Intelligence Report
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                        <div className="flex items-center justify-center p-6 bg-slate-50 rounded-3xl border border-slate-100 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
                            <div className="relative flex items-center justify-center h-28 w-28">
                                <svg className="h-full w-full -rotate-90">
                                    <circle cx="56" cy="56" r="48" fill="transparent" stroke="#E2E8F0" strokeWidth="8" />
                                    <circle
                                        cx="56"
                                        cy="56"
                                        r="48"
                                        fill="transparent"
                                        stroke={scoreColor(evaluation.overallScore)}
                                        strokeWidth="8"
                                        strokeDasharray={301.6}
                                        strokeDashoffset={301.6 - (evaluation.overallScore / 100) * 301.6}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute flex flex-col items-center">
                                    <span className="text-2xl font-black text-slate-800">{evaluation.overallScore}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <ScoreBar label="Security" score={evaluation.securityScore} />
                            <ScoreBar label="Maintainability" score={evaluation.maintainabilityScore} />
                            <ScoreBar label="Quality" score={evaluation.qualityScore} />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <AlertCircle className="h-3.5 w-3.5" /> Issues Detected
                            </p>
                            <div className="space-y-2">
                                {evaluation.issues.map((issue, idx) => (
                                    <div key={idx} className="flex gap-3 p-4 bg-red-50/50 rounded-2xl border border-red-100/30 transition-all hover:bg-red-50">
                                        <Minus className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-red-900 leading-tight">{issue}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Lightbulb className="h-3.5 w-3.5" /> Suggestions
                            </p>
                            <div className="space-y-2">
                                {evaluation.suggestions.map((sug, idx) => (
                                    <div key={idx} className="flex gap-3 p-4 bg-green-50/50 rounded-2xl border border-green-100/30 transition-all hover:bg-green-50">
                                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs font-bold text-green-900 leading-relaxed">{sug}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
