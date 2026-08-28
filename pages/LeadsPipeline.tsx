import React, { useState, useEffect, useRef } from 'react';
import { Lead, ChatMessage } from '../types';
import { Search, MessageSquare, Instagram, RefreshCw, Loader2 } from 'lucide-react';
import { ChatInterface } from '../components/ChatInterface';
import { MicrositeModal } from '../components/MicrositeModal';
import { generateSmartReply } from '../services/geminiService';
import { sendSocialDM, fetchSocialDMs } from '../services/n8nService';

export const LeadsPipeline: React.FC = () => {
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [localLeads, setLocalLeads] = useState<Lead[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showMicrositeModal, setShowMicrositeModal] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Use ref to track current selection ID to avoid stale closure in polling
    const selectedLeadIdRef = useRef<string | null>(null);

    // Filter leads based on search
    const filteredLeads = localLeads.filter(lead => {
        const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.company.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const handleSendMessage = async (content: string) => {
        if (!selectedLead) return;

        // Create local message immediately
        const newMessage: ChatMessage = {
            id: `m_${Date.now()} `,
            sender: 'user',
            content,
            timestamp: 'Just now'
        };

        updateLeadChat(selectedLead.id, newMessage);

        // Send via n8n if we have external conversation ID
        if (selectedLead.externalConversationId) {
            const result = await sendSocialDM(
                'instagram', // Always Instagram now
                selectedLead.externalConversationId,
                content
            );
            if (!result.success) {
                console.error('Failed to send DM via API:', result.error);

                // Handle messaging window expiration specifically
                if (result.errorType === 'messaging_window_expired') {
                    alert('⏰ Cannot send message\n\nInstagram only allows you to message users within 24 hours of their last message. This user hasn\'t messaged you recently.\n\nThey need to send you a message first before you can reply.');
                } else {
                    alert('❌ Failed to send message: ' + (result.error || 'Unknown error'));
                }
            } else {
                console.log('Message sent successfully via Instagram API');
            }
        }
    };

    const handleSmartResponse = async () => {
        if (!selectedLead) return '';

        const lastMsg = selectedLead.chatHistory?.[selectedLead.chatHistory.length - 1];
        const lastContent = lastMsg && lastMsg.sender === 'lead' ? lastMsg.content : "Considering your services.";

        const response = await generateSmartReply(
            selectedLead.name,
            lastContent,
            selectedLead.chatHistory || []
        );

        return response;
    };

    const handleGenerateMicrosite = () => {
        setShowMicrositeModal(true);
    };

    const handleSendMicrositeLink = (url: string) => {
        if (selectedLead) {
            handleSendMessage(`Check out this personalized page I created for you: ${url} `);
        }
    };

    const handleRefreshDMs = async (silent = false) => {
        setIsRefreshing(true);
        try {
            const result = await fetchSocialDMs();
            if (result.success && result.conversations && result.conversations.length > 0) {
                console.log('Fetched conversations:', result.conversations);

                // Convert API conversations to Lead format and merge
                const newLeads: Lead[] = result.conversations.map((conv, index) => ({
                    id: conv.id,
                    name: conv.participantName || `User ${index + 1} `,
                    company: `@${conv.participantName || 'instagram'} `,
                    avatar: conv.participantAvatar || `https://picsum.photos/id/${200 + index}/100/100`,
                    source: 'Instagram DM',
                    platform: 'instagram' as const,
                    score: 50,
                    status: 'New' as const,
                    lastActivity: conv.messages.length > 0
                        ? new Date(conv.messages[conv.messages.length - 1].timestamp).toLocaleString()
                        : 'Just now',
                    email: '',
                    externalConversationId: conv.participantId || conv.id, // Use participant ID for sending messages
                    chatHistory: conv.messages.map(m => ({
                        id: m.id,
                        sender: m.sender as 'user' | 'lead',
                        content: m.content,
                        timestamp: new Date(m.timestamp).toLocaleString()
                    }))
                }));

                // Replace all leads with fresh data
                setLocalLeads(newLeads);

                // Preserve current selection using ref (avoids stale closure), or auto-select first if none
                const currentSelectedId = selectedLeadIdRef.current;
                if (currentSelectedId) {
                    // Find the same conversation by ID and update it
                    const updatedLead = newLeads.find(l => l.id === currentSelectedId);
                    if (updatedLead) {
                        setSelectedLead(updatedLead);
                    }
                } else if (newLeads.length > 0) {
                    setSelectedLead(newLeads[0]);
                    selectedLeadIdRef.current = newLeads[0].id;
                }

                // Only show alert for manual sync
                if (!silent) {
                    alert(`✅ Synced ${newLeads.length} conversations from Instagram`);
                }
            } else {
                console.log('No new conversations found');
                if (!silent) {
                    alert('No conversations found');
                }
            }
        } catch (error) {
            console.error('Failed to refresh DMs:', error);
            if (!silent) {
                alert('Failed to sync: ' + (error instanceof Error ? error.message : 'Unknown error'));
            }
        } finally {
            setIsRefreshing(false);
            setIsInitialLoad(false);
        }
    };

    // Auto-sync on page load and every 5 seconds
    useEffect(() => {
        // Initial sync
        handleRefreshDMs(true);

        // Set up polling every 5 seconds
        const interval = setInterval(() => {
            handleRefreshDMs(true);
        }, 5000);

        // Cleanup on unmount
        return () => clearInterval(interval);
    }, []);

    const updateLeadChat = (leadId: string, msg: ChatMessage) => {
        setLocalLeads(prev => prev.map(l => {
            if (l.id === leadId) {
                return {
                    ...l,
                    chatHistory: [...(l.chatHistory || []), msg]
                };
            }
            return l;
        }));

        setSelectedLead(prev => {
            if (prev?.id === leadId) {
                return {
                    ...prev,
                    chatHistory: [...(prev.chatHistory || []), msg]
                };
            }
            return prev;
        });
    };

    return (
        <div className="h-full flex gap-6">
            {/* Left Sidebar: Lead List */}
            <div className="w-1/3 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Instagram size={20} className="text-pink-600" />
                            <h2 className="font-bold text-slate-900">Instagram DMs</h2>
                        </div>
                        {isRefreshing && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                <RefreshCw size={12} className="animate-spin" />
                                <span>Syncing...</span>
                            </div>
                        )}
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search conversations..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-pink-500"
                        />
                    </div>
                </div>

                {/* Lead List */}
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                    {filteredLeads.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                            <Instagram size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No conversations found</p>
                            <p className="text-xs mt-1">Click Sync to fetch from Instagram</p>
                        </div>
                    ) : (
                        filteredLeads.map(lead => (
                            <div
                                key={lead.id}
                                onClick={() => {
                                    setSelectedLead(lead);
                                    selectedLeadIdRef.current = lead.id;
                                }}
                                className={`p-4 border-b border-slate-100 cursor-pointer transition-colors hover:bg-slate-50 ${selectedLead?.id === lead.id
                                    ? 'bg-pink-50/50 border-l-4 border-l-pink-500'
                                    : 'border-l-4 border-l-transparent'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="relative">
                                        <img src={lead.avatar} className="w-10 h-10 rounded-full" alt={lead.name} />
                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                            <Instagram size={10} className="text-pink-600" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className={`text-sm font-semibold truncate ${selectedLead?.id === lead.id ? 'text-pink-700' : 'text-slate-900'
                                                }`}>
                                                {lead.name}
                                            </h3>
                                            <span className="text-[10px] text-slate-400 ml-2 flex-shrink-0">{lead.lastActivity}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 truncate mb-1">{lead.company}</p>
                                        <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                                            <MessageSquare size={12} />
                                            {lead.chatHistory ? lead.chatHistory[lead.chatHistory.length - 1]?.content : 'No messages yet'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right Main: Chat Interface */}
            <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {selectedLead ? (
                    <ChatInterface
                        lead={selectedLead}
                        onSendMessage={handleSendMessage}
                        onGenerateResponse={handleSmartResponse}
                        onGenerateMicrosite={handleGenerateMicrosite}
                    />
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">
                        <div className="text-center">
                            <Instagram size={48} className="mx-auto mb-4 opacity-50 text-pink-300" />
                            <p className="text-lg font-medium">Select a conversation</p>
                            <p className="text-sm">Choose a lead from the sidebar to start chatting</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Microsite Modal */}
            {showMicrositeModal && selectedLead && (
                <MicrositeModal
                    lead={selectedLead}
                    onClose={() => setShowMicrositeModal(false)}
                    onSendLink={handleSendMicrositeLink}
                />
            )}
        </div>
    );
};