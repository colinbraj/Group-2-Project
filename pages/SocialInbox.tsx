import React, { useState, useEffect } from 'react';
import { SocialComment, ReplyStatus } from '../types';
import { CommentCard } from '../components/CommentCard';
import {
    fetchInboxComments,
    fetchCommentsByStatus,
    approveReply,
    updateReplyStatus,
    subscribeToComments,
    requestReplyRegeneration
} from '../services/socialCommentsService';
import {
    Inbox,
    Sparkles,
    Check,
    Send,
    AlertCircle,
    Search,
    Filter,
    RefreshCw,
    X,
    Copy,
    CheckCircle
} from 'lucide-react';

type TabFilter = 'inbox' | 'approved' | 'sent' | 'all';

const TABS: { id: TabFilter; label: string; icon: React.ReactNode; statuses: ReplyStatus[] }[] = [
    { id: 'inbox', label: 'Inbox', icon: <Inbox size={16} />, statuses: ['new', 'suggested'] },
    { id: 'approved', label: 'Approved', icon: <Check size={16} />, statuses: ['approved'] },
    { id: 'sent', label: 'Sent', icon: <Send size={16} />, statuses: ['sent'] },
    { id: 'all', label: 'All', icon: <Filter size={16} />, statuses: ['new', 'suggested', 'approved', 'sent', 'failed'] },
];

export const SocialInbox: React.FC = () => {
    const [comments, setComments] = useState<SocialComment[]>([]);
    const [activeTab, setActiveTab] = useState<TabFilter>('inbox');
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingComment, setEditingComment] = useState<SocialComment | null>(null);
    const [editedReply, setEditedReply] = useState('');
    const [copiedInModal, setCopiedInModal] = useState(false);

    // Load comments based on tab
    useEffect(() => {
        loadComments();
    }, [activeTab]);

    // Subscribe to realtime updates
    useEffect(() => {
        const subscription = subscribeToComments((payload) => {
            console.log('Realtime update:', payload);
            loadComments(); // Refresh on updates
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const loadComments = async () => {
        setIsLoading(true);
        try {
            const tab = TABS.find(t => t.id === activeTab);
            const data = await fetchCommentsByStatus(tab?.statuses || ['new', 'suggested']);
            setComments(data);
        } catch (error) {
            console.error('Failed to load comments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (comment: SocialComment) => {
        setEditingComment(comment);
        setEditedReply(comment.approved_reply || comment.ai_suggested_reply || '');
        setCopiedInModal(false);
    };

    const handleSaveEdit = async () => {
        if (!editingComment) return;
        try {
            await approveReply(editingComment.id, editedReply);
            setEditingComment(null);
            setEditedReply('');
            loadComments();
        } catch (error) {
            console.error('Failed to save edit:', error);
        }
    };

    const handleDismiss = async (id: string) => {
        try {
            // Mark as 'sent' to indicate it's been handled/skipped
            await updateReplyStatus(id, 'sent');
            loadComments();
        } catch (error) {
            console.error('Failed to dismiss:', error);
        }
    };

    const handleRegenerate = async (comment: SocialComment) => {
        try {
            // Clear AI reply and reset status to 'new' so n8n Flow 2 will regenerate
            await requestReplyRegeneration(comment.id);

            // Show feedback to user
            alert('✨ Regeneration requested!\n\nThe AI will generate a new reply within the next minute. Please refresh the page later to see the updated suggestion.');

            // Reload comments to show the updated status
            loadComments();
        } catch (error) {
            console.error('Failed to request regeneration:', error);
            alert('Failed to request regeneration. Please try again.');
        }
    };

    const handleCopyInModal = async () => {
        if (!editedReply) return;
        try {
            await navigator.clipboard.writeText(editedReply);
            setCopiedInModal(true);
            setTimeout(() => setCopiedInModal(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Filter comments by search
    const filteredComments = comments.filter(comment => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            comment.message.toLowerCase().includes(query) ||
            comment.author?.toLowerCase().includes(query) ||
            comment.ai_suggested_reply?.toLowerCase().includes(query)
        );
    });

    const getTabCount = (tabId: TabFilter) => {
        const tab = TABS.find(t => t.id === tabId);
        if (!tab || tabId !== activeTab) return null;
        return comments.length;
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Social Inbox</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Manage comments and replies from Facebook & Instagram
                    </p>
                </div>
                <button
                    onClick={loadComments}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
                >
                    <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-fit mb-4">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                        {getTabCount(tab.id) !== null && (
                            <span className="ml-1 px-1.5 py-0.5 bg-slate-200 rounded text-xs">
                                {getTabCount(tab.id)}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search comments, authors, or replies..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
            </div>

            {/* Comments Grid */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <RefreshCw size={24} className="animate-spin text-slate-400" />
                    </div>
                ) : filteredComments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <Inbox size={48} className="mb-4" />
                        <p className="text-lg font-medium">No comments found</p>
                        <p className="text-sm">
                            {activeTab === 'inbox'
                                ? 'New comments will appear here when n8n syncs them'
                                : 'No comments in this category'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
                        {filteredComments.map(comment => (
                            <CommentCard
                                key={comment.id}
                                comment={comment}
                                onEdit={handleEdit}
                                onDismiss={handleDismiss}
                                onRegenerate={handleRegenerate}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingComment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="font-semibold text-slate-900">Edit Reply</h3>
                            <button
                                onClick={() => setEditingComment(null)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Original Comment */}
                            <div className="mb-4">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Original Comment</label>
                                <div className="bg-slate-50 rounded-lg p-3">
                                    <p className="text-sm text-slate-700">{editingComment.message}</p>
                                </div>
                            </div>

                            {/* Reply Editor */}
                            <div className="mb-4">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Your Reply</label>
                                <textarea
                                    value={editedReply}
                                    onChange={(e) => setEditedReply(e.target.value)}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                                    placeholder="Write your reply..."
                                />
                            </div>

                            {/* AI Suggestion hint */}
                            {editingComment.ai_suggested_reply && editedReply !== editingComment.ai_suggested_reply && (
                                <button
                                    onClick={() => setEditedReply(editingComment.ai_suggested_reply || '')}
                                    className="flex items-center gap-1.5 text-xs text-purple-600 mb-4 hover:underline"
                                >
                                    <Sparkles size={12} />
                                    Use AI suggestion
                                </button>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setEditingComment(null)}
                                    className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCopyInModal}
                                    disabled={!editedReply.trim()}
                                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2 ${copiedInModal
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-blue-500 text-white hover:bg-blue-600'
                                        }`}
                                >
                                    {copiedInModal ? (
                                        <>
                                            <CheckCircle size={16} />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={16} />
                                            Copy Reply
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={!editedReply.trim()}
                                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <Check size={16} />
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
