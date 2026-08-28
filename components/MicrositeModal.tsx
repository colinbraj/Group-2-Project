import React, { useState, useEffect } from 'react';
import { Lead } from '../types';
import { X, Sparkles, Copy, Send, RefreshCw, ExternalLink, Check } from 'lucide-react';
import { generateMicrositeContent } from '../services/geminiService';

interface MicrositeModalProps {
    lead: Lead;
    onClose: () => void;
    onSendLink: (url: string) => void;
}

interface MicrositeContent {
    headline: string;
    subheadline: string;
    description: string;
    features: string[];
    ctaText: string;
}

export const MicrositeModal: React.FC<MicrositeModalProps> = ({ lead, onClose, onSendLink }) => {
    const [isGenerating, setIsGenerating] = useState(true);
    const [content, setContent] = useState<MicrositeContent | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const micrositeUrl = `https://app.kadoshai.com/p/${lead.company.toLowerCase().replace(/\s+/g, '-')}`;

    const generateContent = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            const result = await generateMicrositeContent(lead);
            setContent(result);
        } catch (err) {
            setError('Failed to generate microsite content');
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    useEffect(() => {
        generateContent();
    }, []);

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(micrositeUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSendInChat = () => {
        onSendLink(micrositeUrl);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <ExternalLink size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900">Generate Microsite</h3>
                            <p className="text-xs text-slate-500">Personalized landing page for {lead.company}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-white/50 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isGenerating ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4 animate-pulse">
                                <Sparkles size={32} className="text-indigo-600" />
                            </div>
                            <h4 className="text-lg font-medium text-slate-700">Generating personalized content...</h4>
                            <p className="text-sm text-slate-500 mt-1">Using GPT-4o to create compelling copy</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <p className="text-red-500">{error}</p>
                            <button
                                onClick={generateContent}
                                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : content && (
                        <div className="grid grid-cols-2 gap-6">
                            {/* Left: Content Editor */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Generated Content</h4>

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-medium text-slate-500">Headline</label>
                                        <p className="text-lg font-bold text-slate-900 mt-1">{content.headline}</p>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-slate-500">Subheadline</label>
                                        <p className="text-sm text-slate-600 mt-1">{content.subheadline}</p>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-slate-500">Description</label>
                                        <p className="text-sm text-slate-600 mt-1">{content.description}</p>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-slate-500">Key Features</label>
                                        <ul className="mt-1 space-y-1">
                                            {content.features.map((feature, i) => (
                                                <li key={i} className="text-sm text-slate-600 flex items-center gap-2">
                                                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">✓</span>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-slate-500">Call to Action</label>
                                        <p className="text-sm font-medium text-indigo-600 mt-1">{content.ctaText}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Live Preview */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Live Preview</h4>

                                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-lg">
                                    {/* Mock Browser Bar */}
                                    <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 flex items-center gap-2">
                                        <div className="flex gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                                            <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                                        </div>
                                        <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-slate-500 truncate">
                                            {micrositeUrl}
                                        </div>
                                    </div>

                                    {/* Microsite Preview */}
                                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 min-h-[300px]">
                                        <div className="text-center space-y-4">
                                            <h1 className="text-xl font-bold text-white">{content.headline}</h1>
                                            <p className="text-sm text-slate-300">{content.subheadline}</p>
                                            <p className="text-xs text-slate-400 max-w-sm mx-auto">{content.description}</p>

                                            <div className="flex flex-wrap justify-center gap-2 mt-4">
                                                {content.features.slice(0, 3).map((feature, i) => (
                                                    <span key={i} className="px-2 py-1 bg-white/10 rounded text-xs text-slate-300">
                                                        {feature}
                                                    </span>
                                                ))}
                                            </div>

                                            <button className="mt-6 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-sm font-medium shadow-lg">
                                                {content.ctaText}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={generateContent}
                            disabled={isGenerating}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={isGenerating ? 'animate-spin' : ''} />
                            Regenerate
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopyUrl}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                            {copied ? 'Copied!' : 'Copy URL'}
                        </button>
                        <button
                            onClick={handleSendInChat}
                            disabled={!content}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            <Send size={16} />
                            Send in Chat
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
