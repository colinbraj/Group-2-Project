import React, { useState } from 'react';
import { SocialComment } from '../types';
import { Facebook, Instagram, Copy, Edit3, X, Sparkles, Clock, Send, AlertCircle, Loader2, RefreshCw, CheckCircle, Check } from 'lucide-react';

interface CommentCardProps {
    comment: SocialComment;
    onEdit: (comment: SocialComment) => void;
    onDismiss: (id: string) => void;
    onRegenerate?: (comment: SocialComment) => Promise<void>;
}

const STATUS_CONFIG = {
    new: { label: 'New', color: 'bg-blue-100 text-blue-700', icon: Clock },
    suggested: { label: 'AI Suggested', color: 'bg-purple-100 text-purple-700', icon: Sparkles },
    approved: { label: 'Approved', color: 'bg-amber-100 text-amber-700', icon: Check },
    sent: { label: 'Sent', color: 'bg-emerald-100 text-emerald-700', icon: Send },
    failed: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

function formatTimeAgo(dateString: string | null): string {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

export const CommentCard: React.FC<CommentCardProps> = ({
    comment,
    onEdit,
    onDismiss,
    onRegenerate,
}) => {
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const statusConfig = STATUS_CONFIG[comment.reply_status];
    const StatusIcon = statusConfig.icon;
    const PlatformIcon = comment.platform === 'facebook' ? Facebook : Instagram;
    const platformColor = comment.platform === 'facebook' ? 'text-blue-600' : 'text-pink-600';

    const handleCopyReply = async () => {
        const replyText = comment.approved_reply || comment.ai_suggested_reply || '';
        if (!replyText) return;

        try {
            await navigator.clipboard.writeText(replyText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleRegenerate = async () => {
        if (!onRegenerate) return;
        setIsRegenerating(true);
        try {
            await onRegenerate(comment);
        } finally {
            setIsRegenerating(false);
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center`}>
                        <span className="text-sm font-semibold text-slate-600">
                            {(comment.author || 'U')[0].toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{comment.author || 'Unknown User'}</span>
                            <PlatformIcon size={14} className={platformColor} />
                        </div>
                        <span className="text-xs text-slate-400">{formatTimeAgo(comment.created_at)}</span>
                    </div>
                </div>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                    <StatusIcon size={12} />
                    {statusConfig.label}
                </div>
            </div>

            {/* Original Comment */}
            <div className="bg-slate-50 rounded-lg p-3 mb-3">
                <p className="text-sm text-slate-700 leading-relaxed">{comment.message}</p>
            </div>

            {/* AI Suggested Reply */}
            {comment.ai_suggested_reply && (
                <div className="mb-3">
                    <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles size={14} className="text-purple-500" />
                        <span className="text-xs font-medium text-purple-700">AI Suggested Reply</span>
                        {comment.ai_confidence && (
                            <span className="text-[10px] text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded">
                                {Math.round(comment.ai_confidence * 100)}% confidence
                            </span>
                        )}
                    </div>
                    <div className="bg-purple-50/50 border border-purple-100 rounded-lg p-3">
                        <p className="text-sm text-slate-700 leading-relaxed">
                            {comment.approved_reply || comment.ai_suggested_reply}
                        </p>
                    </div>
                </div>
            )}

            {/* Actions - Copy Paste Workflow */}
            {(comment.reply_status === 'new' || comment.reply_status === 'suggested') && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    {comment.ai_suggested_reply && (
                        <button
                            onClick={handleCopyReply}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${copied
                                ? 'bg-emerald-500 text-white'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                                }`}
                        >
                            {copied ? (
                                <>
                                    <CheckCircle size={14} />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy size={14} />
                                    Copy Reply
                                </>
                            )}
                        </button>
                    )}
                    {onRegenerate && (
                        <button
                            onClick={handleRegenerate}
                            disabled={isRegenerating}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={isRegenerating ? 'animate-spin' : ''} />
                            {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                        </button>
                    )}
                    <button
                        onClick={() => onEdit(comment)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-200 transition-colors"
                    >
                        <Edit3 size={14} />
                        Edit Response
                    </button>
                    <button
                        onClick={() => onDismiss(comment.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 text-xs font-medium rounded-lg hover:bg-slate-100 hover:text-slate-600 transition-colors ml-auto"
                    >
                        <X size={14} />
                        Dismiss
                    </button>
                </div>
            )}

            {/* Approved/Edited status with Copy button */}
            {comment.reply_status === 'approved' && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-amber-600">
                        <Clock size={14} />
                        <span>Ready to copy & paste</span>
                    </div>
                    <button
                        onClick={handleCopyReply}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ml-auto ${copied
                            ? 'bg-emerald-500 text-white'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                    >
                        {copied ? (
                            <>
                                <CheckCircle size={14} />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Copy size={14} />
                                Copy Reply
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Sent status */}
            {comment.reply_status === 'sent' && comment.sent_at && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-emerald-600">
                    <Check size={14} />
                    <span>Sent {formatTimeAgo(comment.sent_at)}</span>
                </div>
            )}
        </div>
    );
};
