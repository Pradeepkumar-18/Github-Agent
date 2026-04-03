import React, { useState, useEffect, useCallback } from 'react';
import { Avatar } from './ui/Avatar';
import { formatDate } from '../utils/formatters';
import { pullRequestsApi } from '../api/pullRequests.api';
import type { PRComment } from '../types';
import { MessageSquare, Send, RefreshCw, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useToast } from '../context/ToastContext';

interface PRDiscussionProps {
    prId: string;
}

export const PRDiscussion: React.FC<PRDiscussionProps> = ({ prId }) => {
    const [comments, setComments] = useState<PRComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [newComment, setNewComment] = useState('');
    const { showToast } = useToast();

    const fetchComments = useCallback(async () => {
        try {
            const data = await pullRequestsApi.getComments(prId);
            setComments(data);
        } catch (err) {
            console.error('Failed to fetch comments:', err);
        } finally {
            setLoading(false);
        }
    }, [prId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmitting(true);
        try {
            await pullRequestsApi.postComment(prId, newComment);
            setNewComment('');
            showToast('Comment posted!', 'success');
            await fetchComments();
        } catch (err: any) {
            showToast(`Failed to post comment: ${err.message}`, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-300">
                <RefreshCw className="h-6 w-6 animate-spin opacity-20 mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Loading discussion…</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 px-2">
                <MessageSquare className="h-4 w-4 text-slate-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Discussion Thread ({comments.length})
                </h3>
            </div>

            <div className="space-y-4">
                {comments.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                        <p className="text-xs font-bold text-slate-400 italic">No comments yet. Start the conversation!</p>
                    </div>
                ) : (
                    comments.map((comment, idx) => (
                        <div key={idx} className="flex gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                            <Avatar src={comment.authorAvatar} name={comment.authorName} size="sm" />
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-slate-700">{comment.authorName}</span>
                                    <span className="text-[10px] font-bold text-slate-400">{formatDate(comment.createdAt)}</span>
                                </div>
                                <div className="p-4 bg-white rounded-2xl rounded-tl-none border border-slate-100 shadow-sm prose prose-slate prose-sm max-w-none text-slate-600">
                                    <ReactMarkdown>{comment.body}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Comment Input */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-3 p-6 bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <MessageSquare className="h-24 w-24 text-white" />
                </div>
                
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 relative z-10">Add Your Decision / Comment</p>
                
                <div className="relative z-10">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write your rationale here... (Markdown supported)"
                        className="w-full bg-slate-800/50 border border-slate-700 text-white p-4 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-slate-500 min-h-[100px]"
                        disabled={submitting}
                    />
                </div>

                <div className="flex justify-end relative z-10">
                    <button
                        type="submit"
                        disabled={submitting || !newComment.trim()}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        {submitting ? 'Posting...' : 'Post Comment'}
                    </button>
                </div>
            </form>
        </div>
    );
};
