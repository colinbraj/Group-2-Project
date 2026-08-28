import React, { useState, useEffect } from 'react';
import { ScheduledPost, Platform } from '../types';
import { CHANNEL_ICONS } from '../constants';
import { ChevronLeft, ChevronRight, ChevronDown, Plus, Sparkles, Facebook, Instagram, Calendar as CalendarIcon, Trash2, Edit3, Save, RefreshCw, Image } from 'lucide-react';
import { PostModal } from '../components/PostModal';
import { CreatePostModal } from '../components/CreatePostModal';
import { fetchScheduledPosts, subscribeToPostChanges, schedulePost, deleteScheduledPost, saveAsDraft } from '../services/scheduledPostsService';

// Platform icon helper
const getPlatformIcon = (platform: Platform) => {
  if (platform === 'facebook') return <Facebook size={14} className="text-blue-600" />;
  if (platform === 'instagram') return <Instagram size={14} className="text-pink-600" />;
  return null;
};

export const Calendar: React.FC = () => {
  // Issue 1 Fix: Use current date instead of hardcoded 2023
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<ScheduledPost | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [scheduleDateTime, setScheduleDateTime] = useState<string>('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState<Record<Platform, string>>({ facebook: '', instagram: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);
  const [isDraftsExpanded, setIsDraftsExpanded] = useState(false);

  // Handle scheduling a draft post
  const handleSchedulePost = async () => {
    if (!editingPost || !scheduleDateTime) return;

    setIsScheduling(true);
    try {
      await schedulePost(editingPost.id, new Date(scheduleDateTime).toISOString());
      await loadPosts();
      setIsModalOpen(false);
      setEditingPost(undefined);
      setScheduleDateTime('');
    } catch (error) {
      console.error('Failed to schedule post:', error);
      alert('Failed to schedule post. Please try again.');
    } finally {
      setIsScheduling(false);
    }
  };

  // Handle deleting a post
  const handleDeletePost = async (postId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    const confirmMessage = 'Are you sure you want to delete this post? This action cannot be undone.';
    if (!window.confirm(confirmMessage)) return;

    setIsDeleting(true);
    try {
      await deleteScheduledPost(postId);
      await loadPosts();
      setIsModalOpen(false);
      setEditingPost(undefined);
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Start editing a post
  const handleStartEdit = () => {
    if (!editingPost) return;
    setEditedContent({
      facebook: editingPost.content.facebook || '',
      instagram: editingPost.content.instagram || ''
    });
    setIsEditMode(true);
  };

  // Save edited content
  const handleSaveContent = async () => {
    if (!editingPost) return;
    setIsSaving(true);
    try {
      await saveAsDraft(editingPost.id, editedContent, editingPost.platforms);
      await loadPosts();
      setIsEditMode(false);
      // Update the local editingPost with new content
      setEditingPost(prev => prev ? { ...prev, content: editedContent } : undefined);
    } catch (error) {
      console.error('Failed to save content:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Regenerate image (placeholder - would need n8n endpoint)
  const handleRegenerateImage = async () => {
    if (!editingPost) return;
    setIsRegeneratingImage(true);
    try {
      // For now, show a message - actual implementation would call n8n
      alert('Image regeneration would be triggered here. This requires the n8n workflow to support image-only regeneration.');
      // TODO: Implement actual regeneration via n8n endpoint
    } catch (error) {
      console.error('Failed to regenerate image:', error);
      alert('Failed to regenerate image.');
    } finally {
      setIsRegeneratingImage(false);
    }
  };

  // Issue 2 Fix: Load posts from scheduledPostsService
  useEffect(() => {
    loadPosts();
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    const subscription = subscribeToPostChanges((payload) => {
      console.log('Realtime post update:', payload);
      loadPosts();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const data = await fetchScheduledPosts();
      setPosts(data);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calendar Logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0(Sun) - 6(Sat)

  // Adjust validation to start on Monday (0) -> Sunday (6)
  // Native getDay: Sun(0), Mon(1)...Sat(6)
  // We want Mon(0)...Sun(6)
  const startDayPadding = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getPostsForDay = (day: number): ScheduledPost[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return posts.filter(post => {
      if (!post.schedule_at) return false;
      const postDate = new Date(post.schedule_at).toISOString().split('T')[0];
      return postDate === dateStr;
    });
  };

  const handleCreatePost = (date?: string) => {
    setEditingPost(undefined);
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleEditPost = (post: ScheduledPost, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPost(post);
    setIsModalOpen(true);
  };

  // Get post display title from content
  const getPostTitle = (post: ScheduledPost): string => {
    // Get first non-empty content
    const content = post.content.facebook || post.content.instagram || '';
    // Truncate to reasonable length
    return content.length > 40 ? content.substring(0, 40) + '...' : content || 'Untitled Post';
  };

  // Get post status display
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-emerald-100 text-emerald-700';
      case 'scheduled':
        return 'bg-amber-100 text-amber-700';
      case 'draft':
        return 'bg-slate-100 text-slate-600';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  // Check if day is today
  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  // Get all draft posts (unscheduled)
  const draftPosts = posts.filter(post => post.status === 'draft');

  return (
    <div className="h-full overflow-y-auto">
      <div className="min-h-full pb-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Publishing Calendar</h1>
          <div className="flex items-center gap-4">
            <div className="flex bg-white rounded-lg border border-slate-200 p-1">
              <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded"><ChevronLeft size={20} className="text-slate-500" /></button>
              <span className="px-4 font-medium text-slate-700 min-w-[140px] text-center">
                {monthNames[month]} {year}
              </span>
              <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded"><ChevronRight size={20} className="text-slate-500" /></button>
            </div>
            <button
              type="button"
              onClick={() => setIsAIModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm text-sm font-semibold transition-colors"
              style={{ backgroundColor: '#9333ea', color: '#ffffff' }}
            >
              <Sparkles size={16} />
              AI Post
            </button>
            <button
              onClick={() => handleCreatePost()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg shadow-sm hover:bg-slate-800 text-sm font-medium"
            >
              <Plus size={16} />
              Create Post
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          {/* Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {weekDays.map(day => (
              <div key={day} className="py-3 text-center text-xs font-semibold text-slate-500 uppercase">
                {day}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 flex-1 auto-rows-fr">
            {/* Padding Days */}
            {Array.from({ length: startDayPadding }).map((_, i) => (
              <div key={`pad-${i}`} className="bg-slate-50/50 border-r border-b border-slate-100 p-2" />
            ))}

            {/* Actual Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayPosts = getPostsForDay(day);

              return (
                <div
                  key={day}
                  onClick={() => handleCreatePost(dateStr)}
                  className="min-h-[120px] border-r border-b border-slate-100 p-2 relative group hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span className={`text-sm font-medium ${isToday(day)
                    ? 'text-blue-600 bg-blue-50 w-6 h-6 rounded-full flex items-center justify-center'
                    : 'text-slate-400'
                    }`}>
                    {day}
                  </span>

                  <div className="mt-2 space-y-1.5">
                    {dayPosts.map(post => (
                      <div
                        key={post.id}
                        onClick={(e) => handleEditPost(post, e)}
                        className="bg-white border border-slate-200 rounded p-1.5 shadow-sm text-xs cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group/card"
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          {/* Platform Icons */}
                          <div className="flex -space-x-1">
                            {post.platforms.map(platform => (
                              <span key={platform}>{getPlatformIcon(platform)}</span>
                            ))}
                          </div>
                          <span className={`text-[10px] px-1 rounded ml-auto ${getStatusStyle(post.status)}`}>
                            {post.status === 'sent' ? 'Published' : post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                          </span>
                        </div>
                        <p className="truncate font-medium text-slate-700 leading-tight">{getPostTitle(post)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Add button on hover */}
                  <button className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-blue-50 text-blue-600 items-center justify-center hidden group-hover:flex hover:bg-blue-100 shadow-sm">
                    <Plus size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Drafts Panel - Collapsible */}
        {draftPosts.length > 0 && (
          <div className="mt-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl overflow-hidden">
            {/* Collapsible header */}
            <button
              onClick={() => setIsDraftsExpanded(!isDraftsExpanded)}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-purple-100/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-purple-600" />
                <span className="font-medium text-slate-900 text-sm">AI Drafts</span>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  {draftPosts.length}
                </span>
              </div>
              <ChevronDown
                size={16}
                className={`text-slate-500 transition-transform ${isDraftsExpanded ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Expandable content */}
            {isDraftsExpanded && (
              <div className="px-4 pb-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {draftPosts.map(draft => (
                  <div
                    key={draft.id}
                    className="bg-white rounded-lg border border-purple-100 p-2.5 cursor-pointer hover:shadow-md hover:border-purple-300 transition-all group relative"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        {draft.platforms.map(p => (
                          <span key={p} className="text-xs">
                            {getPlatformIcon(p)}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={(e) => handleDeletePost(draft.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                        title="Delete draft"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div onClick={(e) => handleEditPost(draft, e)}>
                      <p className="text-xs text-slate-700 line-clamp-1">
                        {getPostTitle(draft)}
                      </p>
                      <p className="text-xs text-purple-600 mt-1 font-medium">Review →</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Note: PostModal uses CalendarPost type which is different from ScheduledPost
          For now, we keep the modal for creating new posts - it creates local state only
          In a full implementation, this would need to be updated to use ScheduledPost */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[75vh] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
                <h3 className="font-semibold text-slate-900 text-sm">
                  {editingPost ? 'Post Details' : 'Create Post'}
                </h3>
                {editingPost && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusStyle(editingPost.status)}`}>
                    {editingPost.status}
                  </span>
                )}
                {/* Edit/Save toggle button */}
                {editingPost && (
                  <button
                    onClick={isEditMode ? handleSaveContent : handleStartEdit}
                    disabled={isSaving}
                    className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${isEditMode
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                  >
                    {isEditMode ? (
                      isSaving ? 'Saving...' : <><Save size={10} /> Save</>
                    ) : (
                      <><Edit3 size={10} /> Edit</>
                    )}
                  </button>
                )}
              </div>

              {editingPost ? (
                <>
                  {/* Scrollable content */}
                  <div className="space-y-2 p-4 overflow-y-auto flex-1">
                    {/* Generated Image */}
                    {editingPost.image_url && (
                      <div className="relative rounded-lg overflow-hidden border border-slate-200">
                        <img
                          src={editingPost.image_url}
                          alt="Generated"
                          className="w-full h-32 object-cover"
                        />
                        <button
                          onClick={handleRegenerateImage}
                          disabled={isRegeneratingImage}
                          className="absolute top-2 right-2 px-2 py-1 bg-white/90 hover:bg-white border border-slate-200 rounded text-xs font-medium flex items-center gap-1 shadow-sm"
                        >
                          <RefreshCw size={10} className={isRegeneratingImage ? 'animate-spin' : ''} />
                          {isRegeneratingImage ? '...' : 'Regenerate'}
                        </button>
                      </div>
                    )}

                    {/* No image placeholder */}
                    {!editingPost.image_url && (
                      <div className="flex items-center justify-center h-20 bg-slate-100 rounded-lg border border-dashed border-slate-300">
                        <div className="text-center">
                          <Image size={16} className="mx-auto text-slate-400 mb-1" />
                          <p className="text-xs text-slate-400">No image generated</p>
                        </div>
                      </div>
                    )}

                    {/* Content by platform */}
                    {editingPost.platforms.map(platform => (
                      <div key={platform} className={`rounded-lg p-2.5 border ${isEditMode ? 'bg-white border-blue-200' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="text-xs text-slate-400 mb-1 flex items-center gap-1 font-medium">
                          {getPlatformIcon(platform)} {platform}
                        </div>
                        {isEditMode ? (
                          <textarea
                            value={editedContent[platform]}
                            onChange={(e) => setEditedContent(prev => ({ ...prev, [platform]: e.target.value }))}
                            className="w-full text-xs text-slate-700 leading-relaxed border border-slate-200 rounded p-2 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                            rows={4}
                            placeholder={`Enter ${platform} content...`}
                          />
                        ) : (
                          <p className="text-xs text-slate-700 leading-relaxed max-h-20 overflow-y-auto">
                            {editingPost.content[platform] || 'No content'}
                          </p>
                        )}
                      </div>
                    ))}

                    {/* Schedule controls for draft posts */}
                    {editingPost.status === 'draft' && (
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <label className="block text-xs font-medium text-purple-900 mb-2">
                          <CalendarIcon size={12} className="inline mr-1" />
                          Schedule this post
                        </label>
                        <input
                          type="datetime-local"
                          value={scheduleDateTime}
                          onChange={(e) => setScheduleDateTime(e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                          min={new Date().toISOString().slice(0, 16)}
                        />
                        <button
                          onClick={handleSchedulePost}
                          disabled={!scheduleDateTime || isScheduling}
                          className="w-full mt-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium flex items-center justify-center gap-1"
                        >
                          {isScheduling ? 'Scheduling...' : (
                            <>
                              <CalendarIcon size={12} />
                              Schedule
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Fixed footer with action buttons */}
                  <div className="flex gap-2 px-4 py-3 border-t border-slate-100 bg-white shrink-0">
                    <button
                      onClick={() => handleDeletePost(editingPost.id)}
                      disabled={isDeleting}
                      className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200 flex items-center gap-1.5 text-xs font-medium disabled:opacity-50"
                      title="Delete this post"
                    >
                      <Trash2 size={14} />
                      {isDeleting ? '...' : 'Delete'}
                    </button>
                    <button
                      onClick={() => { setIsModalOpen(false); setScheduleDateTime(''); setIsEditMode(false); }}
                      className="flex-1 px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 text-xs font-medium"
                    >
                      Close
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 px-4">
                  <p className="text-slate-500 text-sm">Use the <strong className="text-slate-900">AI Post</strong> button to create new posts.</p>
                  <div className="flex flex-col gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => { setIsModalOpen(false); setIsAIModalOpen(true); }}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-sm flex items-center justify-center gap-2"
                    >
                      <Sparkles size={14} />
                      Create AI Post
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {isAIModalOpen && (
          <CreatePostModal
            onClose={() => setIsAIModalOpen(false)}
            onSuccess={() => {
              loadPosts();
              console.log('AI Post created successfully - refreshing calendar');
            }}
          />
        )}
      </div>
    </div>
  );
};
