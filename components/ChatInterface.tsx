
import React, { useState, useRef, useEffect } from 'react';
import { Lead, ChatMessage } from '../types';
import { Send, Sparkles, LayoutTemplate, Instagram, MessageSquare } from 'lucide-react';

interface ChatInterfaceProps {
    lead: Lead;
    onSendMessage: (msg: string) => void;
    onGenerateResponse: () => Promise<string>;
    onGenerateMicrosite: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ lead, onSendMessage, onGenerateResponse, onGenerateMicrosite }) => {
    const [inputText, setInputText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [lead.chatHistory]);

    const handleSend = () => {
        if (inputText.trim()) {
            onSendMessage(inputText);
            setInputText('');
        }
    };

    const handleSmartDraft = async () => {
        setIsGenerating(true);
        try {
            const draft = await onGenerateResponse();
            setInputText(draft);
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const currentChats = lead.chatHistory || [];

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Chat Header */}
            <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img src={lead.avatar} className="w-10 h-10 rounded-full border border-slate-100" alt={lead.name} />
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <Instagram size={12} className="text-pink-600" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-800">{lead.name}</h3>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700">
                                <Instagram size={10} />
                                Instagram
                            </span>
                        </div>
                        <p className="text-xs text-slate-500">{lead.company} • {lead.source}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onGenerateMicrosite}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200"
                    >
                        <LayoutTemplate size={14} />
                        Generate Microsite
                    </button>
                    <button
                        onClick={handleSmartDraft}
                        disabled={isGenerating}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 text-pink-700 text-xs font-medium rounded-lg hover:bg-pink-100 transition-colors border border-pink-200 disabled:opacity-50"
                    >
                        <Sparkles size={14} className={isGenerating ? "animate-spin" : ""} />
                        {isGenerating ? "Drafting..." : "Smart Reply"}
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {currentChats.length === 0 ? (
                    <div className="text-center text-slate-400 mt-20">
                        <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No messages yet</p>
                        <p className="text-sm">Start the conversation with {lead.name}</p>
                    </div>
                ) : (
                    <>
                        {currentChats.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === 'user' ? (
                                    // SENT MESSAGE - Blue background, white text
                                    <div className="max-w-[70%] rounded-2xl rounded-tr-none px-4 py-3 shadow-md bg-blue-600">
                                        <p className="text-sm leading-relaxed text-white" style={{ color: '#ffffff' }}>
                                            {msg.content}
                                        </p>
                                        <p className="text-[10px] text-blue-200 mt-1.5 text-right">
                                            {msg.timestamp}
                                        </p>
                                    </div>
                                ) : (
                                    // RECEIVED MESSAGE - White background, dark text
                                    <div className="max-w-[70%] rounded-2xl rounded-tl-none px-4 py-3 shadow-md bg-white border border-slate-200">
                                        <p className="text-sm leading-relaxed text-slate-900" style={{ color: '#1e293b' }}>
                                            {msg.content}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-1.5">
                                            {msg.timestamp}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Smart Reply Indicator */}
            {isGenerating && (
                <div className="px-6 py-2 bg-pink-50 border-t border-pink-100">
                    <div className="flex items-center gap-2 text-sm text-pink-600">
                        <Sparkles size={14} className="animate-pulse" />
                        <span>Generating smart reply based on conversation context...</span>
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="bg-white p-4 border-t border-slate-200">
                <div className="flex gap-3 items-end">
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder={`Reply to ${lead.name}...`}
                        rows={1}
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm resize-none overflow-hidden"
                        style={{
                            minHeight: '44px',
                            maxHeight: '96px',
                            height: 'auto'
                        }}
                        onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = Math.min(target.scrollHeight, 96) + 'px';
                        }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputText.trim()}
                        className="w-11 h-11 flex-shrink-0 flex items-center justify-center bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-md"
                    >
                        <Send size={18} />
                    </button>
                </div>
                <p className="text-xs text-slate-400 mt-2 text-center flex items-center justify-center gap-1">
                    <Instagram size={12} className="text-pink-500" />
                    Replying via Instagram Direct
                </p>
            </div>
        </div>
    );
};
