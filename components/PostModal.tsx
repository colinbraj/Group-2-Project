import React, { useState, useEffect } from 'react';
import { CalendarPost } from '../types';
import { X, Save, Trash2 } from 'lucide-react';

interface PostModalProps {
    post?: CalendarPost; // If present, edit mode
    initialDate?: string;
    onClose: () => void;
    onSave: (post: Omit<CalendarPost, 'id'>) => void;
    onDelete?: (id: string) => void;
}

export const PostModal: React.FC<PostModalProps> = ({ post, initialDate, onClose, onSave, onDelete }) => {
    const [formData, setFormData] = useState<Omit<CalendarPost, 'id'>>({
        title: '',
        date: initialDate || new Date().toISOString().split('T')[0],
        channel: 'LinkedIn',
        status: 'Scheduled'
    });

    useEffect(() => {
        if (post) {
            setFormData({
                title: post.title,
                date: post.date,
                channel: post.channel,
                status: post.status
            });
        }
    }, [post]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h3 className="font-semibold text-slate-900">
                        {post ? 'Edit Post' : 'Create New Post'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Post title..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="Scheduled">Scheduled</option>
                                <option value="Published">Published</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Channel</label>
                        <div className="grid grid-cols-4 gap-2">
                            {['LinkedIn', 'Twitter', 'Instagram', 'Email'].map((ch) => (
                                <button
                                    key={ch}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, channel: ch as any })}
                                    className={`px-2 py-2 text-xs font-medium rounded-lg border transition-all
                    ${formData.channel === ch
                                            ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500'
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                >
                                    {ch}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6 pt-2">
                        {post && onDelete && (
                            <button
                                type="button"
                                onClick={() => onDelete(post.id)}
                                className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium flex items-center justify-center gap-2"
                        >
                            <Save size={18} />
                            Save Post
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
