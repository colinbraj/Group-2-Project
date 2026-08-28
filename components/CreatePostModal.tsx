import React, { useState } from 'react';
import { Platform, ScheduledPost } from '../types';
import { triggerCreatePost, POST_TONES, POST_GOALS } from '../services/n8nService';
import { schedulePost, saveAsDraft, fetchScheduledPosts } from '../services/scheduledPostsService';
import { X, Sparkles, Facebook, Instagram, Loader2, RefreshCw, Calendar, Check, Edit3 } from 'lucide-react';

interface CreatePostModalProps {
    onClose: () => void;
    onSuccess?: () => void;
}

type Step = 'configure' | 'review';

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose, onSuccess }) => {
    // Step management
    const [currentStep, setCurrentStep] = useState<Step>('configure');

    // Configuration step state
    const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['facebook', 'instagram']);
    const [selectedGoal, setSelectedGoal] = useState('engagement');
    const [selectedTone, setSelectedTone] = useState('professional');
    const [additionalContext, setAdditionalContext] = useState('');
    const [scheduleDateTime, setScheduleDateTime] = useState('');

    // Review step state
    const [generatedPost, setGeneratedPost] = useState<ScheduledPost | null>(null);
    const [editedContent, setEditedContent] = useState<Record<Platform, string>>({ facebook: '', instagram: '' });
    const [isEditing, setIsEditing] = useState(false);

    // Loading states
    const [isGenerating, setIsGenerating] = useState(false);
    const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const togglePlatform = (platform: Platform) => {
        if (selectedPlatforms.includes(platform)) {
            if (selectedPlatforms.length > 1) {
                setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
            }
        } else {
            setSelectedPlatforms([...selectedPlatforms, platform]);
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);

        try {
            const result = await triggerCreatePost(
                selectedPlatforms,
                selectedGoal,
                selectedTone,
                additionalContext
            );

            if (result.success) {
                // Fetch the most recent post to get the generated content
                const posts = await fetchScheduledPosts();
                const latestDraft = posts.find(p => p.status === 'draft');

                if (latestDraft) {
                    setGeneratedPost(latestDraft);
                    setEditedContent({
                        facebook: latestDraft.content.facebook || '',
                        instagram: latestDraft.content.instagram || ''
                    });
                    setCurrentStep('review');
                } else {
                    setError('Post was generated but could not be fetched. Please refresh and check the calendar.');
                }
            } else {
                setError(result.error || 'Failed to generate post');
            }
        } catch (err) {
            setError('Failed to connect to n8n. Check your configuration.');
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRegenerateImage = async () => {
        if (!generatedPost) return;
        setIsRegeneratingImage(true);
        setError(null);

        try {
            // Re-trigger the workflow to regenerate
            const result = await triggerCreatePost(
                selectedPlatforms,
                selectedGoal,
                selectedTone,
                additionalContext + '\n\n[Regenerating image - create a different visual style]'
            );

            if (result.success) {
                const posts = await fetchScheduledPosts();
                const latestDraft = posts.find(p => p.status === 'draft' && p.id !== generatedPost.id);

                if (latestDraft) {
                    setGeneratedPost(latestDraft);
                    // Keep edited text, just update image
                    if (latestDraft.image_url) {
                        setGeneratedPost(prev => prev ? { ...prev, image_url: latestDraft.image_url } : latestDraft);
                    }
                }
            }
        } catch (err) {
            setError('Failed to regenerate image');
        } finally {
            setIsRegeneratingImage(false);
        }
    };

    const handleScheduleNow = async () => {
        if (!generatedPost || !scheduleDateTime) return;
        setIsSaving(true);
        setError(null);

        try {
            // First save any content edits
            if (isEditing) {
                await saveAsDraft(generatedPost.id, editedContent, selectedPlatforms);
            }

            // Then schedule
            await schedulePost(generatedPost.id, new Date(scheduleDateTime).toISOString());
            onSuccess?.();
            onClose();
        } catch (err) {
            setError('Failed to schedule post');
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAsDraft = async () => {
        if (!generatedPost) return;
        setIsSaving(true);

        try {
            if (isEditing) {
                await saveAsDraft(generatedPost.id, editedContent, selectedPlatforms);
            }
            onSuccess?.();
            onClose();
        } catch (err) {
            setError('Failed to save draft');
        } finally {
            setIsSaving(false);
        }
    };

    // Configure Step
    const renderConfigureStep = () => (
        <>
            <div className="p-6 space-y-5">
                {/* Platform Selection */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Platforms
                    </label>
                    <div className="flex gap-3">
                        <button
                            onClick={() => togglePlatform('facebook')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${selectedPlatforms.includes('facebook')
                                ? 'bg-blue-50 border-blue-300 text-blue-700'
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            <Facebook size={18} />
                            Facebook
                        </button>
                        <button
                            onClick={() => togglePlatform('instagram')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${selectedPlatforms.includes('instagram')
                                ? 'bg-pink-50 border-pink-300 text-pink-700'
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            <Instagram size={18} />
                            Instagram
                        </button>
                    </div>
                </div>

                {/* Goal Selection */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Post Goal
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {POST_GOALS.map(goal => (
                            <button
                                key={goal.id}
                                onClick={() => setSelectedGoal(goal.id)}
                                className={`text-left px-3 py-2 rounded-lg border transition-all ${selectedGoal === goal.id
                                    ? 'bg-purple-50 border-purple-300'
                                    : 'bg-white border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                <div className={`text-sm font-medium ${selectedGoal === goal.id ? 'text-purple-700' : 'text-slate-700'}`}>
                                    {goal.label}
                                </div>
                                <div className="text-xs text-slate-500">{goal.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tone Selection */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Tone
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {POST_TONES.map(tone => (
                            <button
                                key={tone.id}
                                onClick={() => setSelectedTone(tone.id)}
                                className={`px-3 py-1.5 rounded-full text-sm border transition-all ${selectedTone === tone.id
                                    ? 'bg-purple-100 border-purple-300 text-purple-700'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                {tone.emoji} {tone.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Additional Context */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Additional Context (Optional)
                    </label>
                    <textarea
                        value={additionalContext}
                        onChange={(e) => setAdditionalContext(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm resize-none"
                        placeholder="Add any specific details, topics, or keywords you want included..."
                    />
                </div>

                {/* Schedule Time */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        <Calendar size={14} className="inline mr-1" />
                        Schedule For
                    </label>
                    <input
                        type="datetime-local"
                        value={scheduleDateTime}
                        onChange={(e) => setScheduleDateTime(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                        min={new Date().toISOString().slice(0, 16)}
                    />
                    <p className="text-xs text-slate-500 mt-1">Leave empty to save as draft</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                        {error}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating || selectedPlatforms.length === 0}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2 shadow-md transition-colors"
                    style={{ backgroundColor: (isGenerating || selectedPlatforms.length === 0) ? '#94a3b8' : '#9333ea', color: '#ffffff' }}
                >
                    {isGenerating ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles size={16} />
                            Generate with AI
                        </>
                    )}
                </button>
            </div>
        </>
    );

    // Review Step
    const renderReviewStep = () => (
        <>
            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                {/* Success indicator */}
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
                    <Check size={18} />
                    <span className="text-sm font-medium">Content generated! Review and edit as needed.</span>
                </div>

                {/* Generated Image */}
                {generatedPost?.image_url && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Generated Image
                        </label>
                        <div className="relative">
                            <img
                                src={generatedPost.image_url}
                                alt="Generated"
                                className="w-full rounded-lg border border-slate-200"
                            />
                            <button
                                onClick={handleRegenerateImage}
                                disabled={isRegeneratingImage}
                                className="absolute top-2 right-2 px-3 py-1.5 bg-white/90 hover:bg-white border border-slate-200 rounded-lg text-sm font-medium flex items-center gap-1 shadow-sm"
                            >
                                <RefreshCw size={14} className={isRegeneratingImage ? 'animate-spin' : ''} />
                                {isRegeneratingImage ? 'Regenerating...' : 'Regenerate'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Generated Content */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-slate-700">
                            Content
                        </label>
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                        >
                            <Edit3 size={12} />
                            {isEditing ? 'Done Editing' : 'Edit Content'}
                        </button>
                    </div>

                    {selectedPlatforms.map(platform => (
                        <div key={platform} className="mb-3">
                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                                {platform === 'facebook' ? <Facebook size={12} /> : <Instagram size={12} />}
                                {platform}
                            </div>
                            {isEditing ? (
                                <textarea
                                    value={editedContent[platform]}
                                    onChange={(e) => setEditedContent(prev => ({ ...prev, [platform]: e.target.value }))}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm resize-none"
                                />
                            ) : (
                                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg whitespace-pre-wrap">
                                    {editedContent[platform] || generatedPost?.content[platform] || 'No content'}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Schedule Time (editable) */}
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <label className="block text-sm font-medium text-purple-900 mb-2">
                        <Calendar size={14} className="inline mr-1" />
                        Schedule For
                    </label>
                    <input
                        type="datetime-local"
                        value={scheduleDateTime}
                        onChange={(e) => setScheduleDateTime(e.target.value)}
                        className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                        min={new Date().toISOString().slice(0, 16)}
                    />
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                        {error}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                <button
                    onClick={() => setCurrentStep('configure')}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm"
                >
                    ← Back
                </button>
                <button
                    onClick={handleSaveAsDraft}
                    disabled={isSaving}
                    className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium text-sm"
                >
                    Save as Draft
                </button>
                <button
                    onClick={handleScheduleNow}
                    disabled={isSaving || !scheduleDateTime}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ backgroundColor: (!scheduleDateTime || isSaving) ? '#94a3b8' : '#9333ea' }}
                >
                    {isSaving ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Calendar size={16} />
                            Schedule Post
                        </>
                    )}
                </button>
            </div>
        </>
    );

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50">
                    <div className="flex items-center gap-2">
                        <Sparkles size={20} className="text-purple-600" />
                        <h3 className="font-semibold text-slate-900">
                            {currentStep === 'configure' ? 'Create AI Post' : 'Review & Schedule'}
                        </h3>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Step indicator */}
                        <div className="flex items-center gap-2 text-xs">
                            <span className={`px-2 py-1 rounded ${currentStep === 'configure' ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                1. Configure
                            </span>
                            <span className="text-slate-300">→</span>
                            <span className={`px-2 py-1 rounded ${currentStep === 'review' ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                2. Review
                            </span>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {currentStep === 'configure' ? renderConfigureStep() : renderReviewStep()}
            </div>
        </div>
    );
};
