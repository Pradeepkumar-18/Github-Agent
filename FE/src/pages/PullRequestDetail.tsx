import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { useEvaluation } from '../hooks/useEvaluation';
import { usePullRequest } from '../hooks/usePullRequests';
import { Avatar } from '../components/ui/Avatar';
import { RiskBadge } from '../components/ui/RiskBadge';
import { formatDate, scoreColor } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import { pullRequestsApi } from '../api/pullRequests.api';
import { Modal } from '../components/ui/Modal';
import { PRDiscussion } from '../components/PRDiscussion';
import { ChevronRight, GitPullRequest, FileText, Minus, CheckCircle, Lightbulb, AlertCircle, Cpu, GitBranch, MessageSquare, RefreshCw, Check, Loader2, GitMerge, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';


import Prism from 'prismjs';


// Load Prism languages
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markdown';

// Load Prism theme
import 'prismjs/themes/prism-tomorrow.css';

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

function getLanguageFromFilename(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const map: Record<string, string> = {
        ts: 'typescript',
        tsx: 'typescript',
        js: 'javascript',
        jsx: 'javascript',
        py: 'python',
        go: 'go',
        json: 'json',
        css: 'css',
        md: 'markdown',
        html: 'markup',
    };
    return map[ext] || 'javascript';
}

function DiffViewer({ patch, filename }: { patch?: string; filename: string }) {
    if (!patch) return <div className="p-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest text-center italic">No diff available</div>;

    const lang = getLanguageFromFilename(filename);
    const lines = patch.split('\n');

    return (
        <div className="font-mono text-[11px] leading-relaxed overflow-x-auto bg-[#1e1e1e] rounded-xl p-4 text-slate-300 shadow-inner border border-slate-800">
            {lines.map((line, idx) => {
                let bgColor = 'transparent';
                let textColor = 'inherit';
                let content = line;

                // Handle diff markers
                if (line.startsWith('+') && !line.startsWith('+++')) {
                    bgColor = 'rgba(34, 197, 94, 0.15)';
                    content = line.substring(1);
                } else if (line.startsWith('-') && !line.startsWith('---')) {
                    bgColor = 'rgba(239, 68, 68, 0.15)';
                    content = line.substring(1);
                } else if (line.startsWith('@@')) {
                    textColor = '#818cf8';
                }

                // Highlight the content part
                const highlighted = Prism.highlight(
                    content,
                    Prism.languages[lang] || Prism.languages.javascript,
                    lang
                );

                return (
                    <div
                        key={idx}
                        style={{ backgroundColor: bgColor, color: textColor }}
                        className={`whitespace-pre px-2 -mx-2 transition-colors duration-200 ${line.startsWith('+') ? 'border-l-2 border-green-500/50' : line.startsWith('-') ? 'border-l-2 border-red-500/50' : ''}`}
                    >
                        <span className="opacity-15 inline-block w-8 select-none pr-2 text-right border-r border-white/5 mr-3 font-mono">
                            {idx + 1}
                        </span>
                        <span dangerouslySetInnerHTML={{ __html: highlighted }} />
                    </div>
                );
            })}
        </div>
    );
}

const STATE_BADGE: Record<string, { color: string; bg: string; label: string }> = {
    open: { color: '#22C55E', bg: '#F0FDF4', label: 'Open' },
    closed: { color: '#EF4444', bg: '#FEF2F2', label: 'Closed' },
    merged: { color: '#8B5CF6', bg: '#F5F3FF', label: 'Merged' },
};

export function PullRequestDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { pullRequest, files, loading, filesLoading, error } = usePullRequest(id || '');
    const { evaluation } = useEvaluation(pullRequest?._id ?? pullRequest?.id ?? null);
    const [merging, setMerging] = useState(false);
    const [showMergeModal, setShowMergeModal] = useState(false);
    const [mergeMessage, setMergeMessage] = useState('');
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [closeReason, setCloseReason] = useState('');
    const [closing, setClosing] = useState(false);


    const handleMerge = async () => {
        if (!pullRequest || !id) return;
        setMerging(true);
        setShowMergeModal(false);
        try {
            console.log('Attempting merge for PR ID:', id, 'with message:', mergeMessage);
            const res = await pullRequestsApi.merge(id, mergeMessage);
            if (res.success) {
                showToast('PR Successfully Merged!', 'success');
                // Local update to avoid full re-fetch
                pullRequest.state = 'merged';
                pullRequest.mergedAt = new Date().toISOString();
            } else {
                showToast('Merge failed: Provider returned no success.', 'error');
            }
        } catch (err: any) {
            showToast(`Merge failed: ${err.message}`, 'error');
        } finally {
            setMerging(false);
            setMergeMessage(''); // Clear message after action
        }
    };


    const handleClose = async () => {
        if (!pullRequest || !id) return;
        setClosing(true);
        try {
            await pullRequestsApi.close(id, closeReason);
            showToast('PR Closed Successfully', 'success');
            pullRequest.state = 'closed';
            setShowCloseModal(false);
        } catch (err: any) {
            showToast(`Failed to close PR: ${err.message}`, 'error');
        } finally {
            setClosing(false);
        }
    };






    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 text-slate-300">
            <Cpu className="h-10 w-10 mb-4 opacity-20 animate-pulse" />
            <p className="font-bold uppercase tracking-widest text-[10px]">Loading pull request…</p>
        </div>
    );

    if (error || !pullRequest) return (
        <div className="flex flex-col items-center justify-center h-64 text-slate-300">
            <AlertCircle className="h-10 w-10 mb-4 opacity-20" />
            <p className="font-bold uppercase tracking-widest text-[10px]">{error ?? 'Pull request not found'}</p>
            <button onClick={() => navigate('/pull-requests')} className="mt-4 text-xs text-blue-500 hover:underline">← Back to Pull Requests</button>
        </div>
    );

    const badge = STATE_BADGE[pullRequest.state] || STATE_BADGE.open;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full items-start max-w-[1600px] mx-auto">
            {/* Left: PR Context */}
            <div className="space-y-6">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none select-none">
                        <GitPullRequest className="h-32 w-32" />
                    </div>

                    <div className="flex items-center justify-between gap-3 mb-6">
                        <div className="flex items-center gap-3">
                            <span
                                className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border"
                                style={{ color: badge.color, backgroundColor: badge.bg, borderColor: `${badge.color}20` }}
                            >
                                {badge.label}
                            </span>
                            <span className="text-xs font-bold text-slate-400">#{pullRequest.prNumber}</span>
                        </div>

                        {pullRequest.state?.toLowerCase() === 'open' && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowCloseModal(true)}
                                    disabled={merging || closing}
                                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-white text-slate-400 border border-slate-200 hover:border-red-200 hover:text-red-500 hover:bg-red-50 active:scale-95 disabled:opacity-50"
                                >
                                    <XCircle className="h-3.5 w-3.5" />
                                    Decline & Close
                                </button>
                                <button
                                    onClick={() => setShowMergeModal(true)}
                                    disabled={merging || closing}
                                    className={`relative z-10 flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
                                        ${merging ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-black hover:shadow-blue-200/50 hover:ring-2 hover:ring-blue-500/20'}
                                    `}
                                >
                                    {merging ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                    {merging ? 'Merging...' : 'Verify & Merge'}
                                </button>
                            </div>
                        )}



                    </div>


                    <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-4 leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
                        {pullRequest.title}
                    </h1>

                    <div className="flex items-center gap-4 mb-8">
                        <Avatar src={pullRequest.authorAvatar} name={pullRequest.authorName} size="md" />
                        <div>
                            <p className="text-sm font-bold text-slate-700 leading-tight">{pullRequest.authorName}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">{formatDate(pullRequest.githubCreatedAt)}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <GitBranch className="h-4 w-4 text-slate-400" />
                        <span className="text-xs font-mono font-bold text-slate-600">{pullRequest.headBranch}</span>
                        <ChevronRight className="h-3 w-3 text-slate-300" />
                        <span className="text-xs font-mono font-bold text-slate-600">{pullRequest.baseBranch}</span>
                    </div>

                    <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <FileText className="h-4 w-4 text-slate-400" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Impact Details</p>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Files</p>
                                <p className="text-sm font-bold text-slate-700">{pullRequest.changedFiles}</p>
                            </div>
                            <div className="text-center border-l border-slate-100 px-4">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Commits</p>
                                <p className="text-sm font-bold text-slate-700">{pullRequest.commitsCount}</p>
                            </div>
                            <div className="text-center border-l border-slate-100 px-4">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Additions</p>
                                <p className="text-sm font-bold text-green-600">+{pullRequest.additions}</p>
                            </div>
                            <div className="text-center border-l border-slate-100 px-4">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Deletions</p>
                                <p className="text-sm font-bold text-red-500">-{pullRequest.deletions}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description placeholder */}
                {pullRequest.body && (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-50 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <MessageSquare className="h-3.5 w-3.5" /> Description
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="prose prose-slate prose-sm max-w-none text-slate-600 leading-relaxed">
                                <ReactMarkdown>{pullRequest.body}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                )}

                {/* Discussion Thread */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-50">
                    <PRDiscussion prId={id || ''} />
                </div>

                {/* File Changes */}
                <div className="space-y-4 pt-4">

                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-2">
                        <FileText className="h-4 w-4" /> Changed Files ({files.length})
                    </h3>
                    {filesLoading ? (
                        <div className="p-12 text-center text-slate-300 bg-white rounded-3xl border border-slate-50">
                            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 opacity-20" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Loading diffs…</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {files.map((file, idx) => (
                                <div key={idx} className="bg-white rounded-3xl shadow-sm border border-slate-50 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/10">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${file.status === 'added' ? 'bg-green-100 text-green-700' :
                                                    file.status === 'removed' ? 'bg-red-100 text-red-700' :
                                                        'bg-blue-100 text-blue-700'
                                                }`}>
                                                {file.status}
                                            </span>
                                            <span className="text-xs font-mono font-bold text-slate-600">{file.filename}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-[10px] font-mono font-bold">
                                            <span className="text-green-600">+{file.additions}</span>
                                            <span className="text-red-500">-{file.deletions}</span>
                                        </div>
                                    </div>
                                    <div className="p-2">
                                        <DiffViewer patch={file.patch} filename={file.filename} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right: AI Evaluation */}
            <div className="space-y-6 lg:sticky lg:top-8">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-50">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
                            Risk Assessment
                        </h2>
                        <RiskBadge level={pullRequest.riskLevel} />
                    </div>

                    {evaluation ? (
                        <div className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="flex items-center justify-center p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                    <div className="relative flex items-center justify-center h-28 w-28">
                                        <svg className="h-full w-full -rotate-90">
                                            <circle cx="56" cy="56" r="48" fill="transparent" stroke="#E2E8F0" strokeWidth="8" />
                                            <circle
                                                cx="56" cy="56" r="48" fill="transparent"
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
                                                <p className="text-xs font-bold text-red-900 leading-tight">{issue}</p>
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
                    ) : (
                        /* Phase 3 pending state */
                        <div className="flex flex-col items-center justify-center text-center gap-4 py-12">
                            <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
                                <Cpu className="h-8 w-8 text-slate-300 animate-pulse" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500">AI Risk Analysis Pending</p>
                                <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                                    Full code intelligence analysis will be available in Phase 3 when the AI evaluation engine is active.
                                </p>
                            </div>
                            <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-widest">
                                Status: {pullRequest.evaluationStatus}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <Modal
                isOpen={showMergeModal}
                onClose={() => setShowMergeModal(false)}
                onConfirm={handleMerge}
                title="Merge Pull Request"
                confirmLabel="Confirm Merge"
                isLoading={merging}
            >
                <div className="space-y-4">
                    <p className="font-serif italic opacity-70">
                        You are about to merge this pull request from <strong>{pullRequest.headBranch}</strong> into <strong>{pullRequest.baseBranch}</strong>.
                    </p>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <GitMerge className="h-5 w-5 text-slate-400" />
                        <div className="flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Integration Point</p>
                            <p className="text-xs font-mono font-bold text-slate-700 truncate">{pullRequest.baseBranch}</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Merge Message (Optional)</label>
                        <textarea
                            value={mergeMessage}
                            onChange={(e) => setMergeMessage(e.target.value)}
                            placeholder={`Merging PR #${pullRequest.prNumber} via Architect Dashboard...`}
                            className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 outline-none transition-all placeholder:text-slate-300 min-h-[100px]"
                        />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                        This action is permanent. Integrating this code will trigger standard post-merge CI/CD pipelines on the Git provider.
                    </p>

                </div>
            </Modal>

            <Modal
                isOpen={showCloseModal}
                onClose={() => setShowCloseModal(false)}
                onConfirm={handleClose}
                title="Decline & Close PR"
                confirmLabel="Confirm Decline"
                confirmVariant="danger"
                isLoading={closing}
            >
                <div className="space-y-4">
                    <p className="text-slate-500 text-xs">
                        Provide an architectural rationale for declining this request. This will be posted as a comment before closing.
                    </p>
                    <textarea
                        value={closeReason}
                        onChange={(e) => setCloseReason(e.target.value)}
                        placeholder="e.g. Architectural mismatch, duplicate effort, or fails security review..."
                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-300 outline-none transition-all placeholder:text-slate-300 min-h-[120px]"
                    />
                    <div className="flex items-center gap-2 text-red-500/70 p-2">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">This action cannot be undone from the dashboard.</p>
                    </div>
                </div>
            </Modal>
        </div>
    );
}


