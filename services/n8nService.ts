import { Platform } from '../types';

/**
 * n8n Webhook Service
 * Handles all webhook triggers from the app to n8n workflows
 */

const N8N_BASE_URL = import.meta.env.VITE_N8N_BASE_URL || 'https://n8n.kadoshai.com';
const SEND_REPLY_WEBHOOK = import.meta.env.VITE_N8N_SEND_REPLY_WEBHOOK || '/webhook/send-reply';
const CREATE_POST_WEBHOOK = import.meta.env.VITE_N8N_CREATE_POST_WEBHOOK || '/webhook/create-post';

// Helper to check if n8n is configured
export const isN8nConfigured = (): boolean => {
    return Boolean(N8N_BASE_URL);
};

/**
 * Trigger Workflow 3: Send Reply
 * Called when user approves a reply and wants to send it immediately
 */
export async function triggerSendReply(
    platform: Platform,
    commentId: string,
    reply: string
): Promise<{ success: boolean; error?: string; message?: string }> {
    console.log('triggerSendReply called with:', { platform, commentId, reply: reply?.substring(0, 50) + '...' });

    // Validate required fields before sending
    if (!platform || !commentId || !reply) {
        const missingFields = [];
        if (!platform) missingFields.push('platform');
        if (!commentId) missingFields.push('comment_id');
        if (!reply) missingFields.push('reply');
        const error = `Missing required fields: ${missingFields.join(', ')}`;
        console.error('triggerSendReply validation failed:', error);
        return { success: false, error };
    }

    if (!isN8nConfigured()) {
        console.warn('n8n not configured, simulating send...');
        return { success: true };
    }

    const webhookUrl = `${N8N_BASE_URL}${SEND_REPLY_WEBHOOK}`;
    const payload = {
        platform,
        comment_id: commentId,
        reply,
    };

    console.log('Sending to n8n:', webhookUrl);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const responseText = await response.text();
        console.log('n8n response status:', response.status);
        console.log('n8n response body:', responseText || '(empty)');

        if (!response.ok) {
            throw new Error(`n8n webhook failed: ${response.status} - ${responseText || 'No response'}`);
        }

        // Handle empty response - treat as success if status is 200
        if (!responseText || responseText.trim() === '') {
            console.log('Empty response from n8n, treating as success');
            return { success: true, message: 'Request sent (no response body)' };
        }

        // Try to parse JSON response
        try {
            const result = JSON.parse(responseText);
            return { success: result.success !== false, ...result };
        } catch (parseError) {
            console.warn('Could not parse n8n response as JSON:', responseText);
            return { success: true, message: responseText };
        }
    } catch (error) {
        console.error('Failed to trigger send reply:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Trigger Workflow 4: AI Create Post
 * Called when user wants to generate a new post draft using AI
 */
export async function triggerCreatePost(
    platforms: Platform[],
    goal: string,
    tone: string,
    additionalContext?: string
): Promise<{ success: boolean; error?: string; message?: string }> {
    console.log('triggerCreatePost called with:', { platforms, goal, tone, context: additionalContext });

    if (!isN8nConfigured()) {
        console.warn('n8n not configured, simulating create post...');
        return { success: true, message: 'Simulated - n8n not configured' };
    }

    const webhookUrl = `${N8N_BASE_URL}${CREATE_POST_WEBHOOK}`;
    const payload = {
        platforms,
        goal,
        tone,
        context: additionalContext,
    };

    console.log('Sending to n8n:', webhookUrl);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const responseText = await response.text();
        console.log('n8n response status:', response.status);
        console.log('n8n response body:', responseText || '(empty)');

        if (!response.ok) {
            throw new Error(`n8n webhook failed: ${response.status} - ${responseText || 'No response'}`);
        }

        // Handle empty response - treat as success if status is 200
        if (!responseText || responseText.trim() === '') {
            console.log('Empty response from n8n, treating as success');
            return { success: true, message: 'Post created (no response body)' };
        }

        // Try to parse JSON response
        try {
            const result = JSON.parse(responseText);
            return { success: result.success !== false, ...result };
        } catch (parseError) {
            console.warn('Could not parse n8n response as JSON:', responseText);
            return { success: true, message: responseText };
        }
    } catch (error) {
        console.error('Failed to trigger create post:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// Tone options for AI post creation
export const POST_TONES = [
    { id: 'professional', label: 'Professional', emoji: '💼' },
    { id: 'friendly', label: 'Friendly', emoji: '😊' },
    { id: 'inspiring', label: 'Inspiring', emoji: '✨' },
    { id: 'humorous', label: 'Humorous', emoji: '😄' },
    { id: 'urgent', label: 'Urgent', emoji: '🚨' },
    { id: 'educational', label: 'Educational', emoji: '📚' },
];

// Goal options for AI post creation
export const POST_GOALS = [
    { id: 'engagement', label: 'Drive Engagement', desc: 'Get likes, comments, shares' },
    { id: 'awareness', label: 'Brand Awareness', desc: 'Introduce your brand/product' },
    { id: 'launch', label: 'Product Launch', desc: 'Announce something new' },
    { id: 'event', label: 'Event Promotion', desc: 'Promote an upcoming event' },
    { id: 'educational', label: 'Educational Content', desc: 'Share knowledge/tips' },
    { id: 'testimonial', label: 'Social Proof', desc: 'Share success stories' },
];

// ============================================================================
// Social DM Integration - Instagram DMs via n8n
// ============================================================================

const FETCH_DMS_WEBHOOK = import.meta.env.VITE_N8N_FETCH_DMS_WEBHOOK || '/webhook/fetch-dms';
const SEND_DM_WEBHOOK = import.meta.env.VITE_N8N_SEND_DM_WEBHOOK || '/webhook/send-dm';

/**
 * Fetch DMs from Instagram via n8n webhook
 * The n8n workflow integrates with Instagram Graph API
 */
export async function fetchSocialDMs(): Promise<{
    success: boolean;
    conversations?: Array<{
        id: string;
        platform: 'facebook' | 'instagram';
        participantName: string;
        participantAvatar?: string;
        participantId?: string;
        messages: Array<{
            id: string;
            sender: 'user' | 'lead';
            content: string;
            timestamp: string;
        }>;
    }>;
    error?: string;
}> {
    console.log('fetchSocialDMs called');

    if (!isN8nConfigured()) {
        console.warn('n8n not configured, returning mock DMs');
        return { success: true, conversations: [] };
    }

    const webhookUrl = `${N8N_BASE_URL}${FETCH_DMS_WEBHOOK}`;
    console.log('Fetching DMs from:', webhookUrl);

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'fetch_all' }),
        });

        const responseText = await response.text();
        console.log('n8n response:', response.status, responseText);

        if (!response.ok) {
            throw new Error(`Failed to fetch DMs: ${response.status}`);
        }

        if (!responseText) {
            return { success: true, conversations: [] };
        }

        const result = JSON.parse(responseText);
        return { success: true, conversations: result.conversations || [] };

    } catch (error) {
        console.error('Failed to fetch DMs:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Send an Instagram DM reply via n8n webhook
 */
export async function sendSocialDM(
    platform: 'instagram' | 'facebook', // keeping for backwards compat, but always sends to IG
    conversationId: string,
    message: string
): Promise<{ success: boolean; error?: string; errorType?: string; messageId?: string }> {
    console.log('sendSocialDM called:', { conversationId, message: message.substring(0, 50) + '...' });

    if (!isN8nConfigured()) {
        console.warn('n8n not configured, simulating Instagram DM send');
        return { success: true, messageId: `mock_ig_${Date.now()}` };
    }

    const webhookUrl = `${N8N_BASE_URL}${SEND_DM_WEBHOOK}`;
    const payload = {
        platform: 'instagram',
        recipient_id: conversationId, // This is actually the participant ID
        message,
    };

    console.log('Sending Instagram DM via:', webhookUrl);

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const responseText = await response.text();
        console.log('n8n response:', response.status, responseText);

        if (!responseText) {
            return { success: true };
        }

        const result = JSON.parse(responseText);

        // Handle messaging window expiration error
        if (result.error === 'messaging_window_expired') {
            return {
                success: false,
                errorType: 'messaging_window_expired',
                error: result.message || 'The 24-hour messaging window has expired. The user must message you first before you can reply.'
            };
        }

        // Handle other API errors
        if (result.error) {
            return {
                success: false,
                errorType: result.error,
                error: result.message || 'Failed to send message'
            };
        }

        return { success: result.success !== false, messageId: result.message_id };

    } catch (error) {
        console.error('Failed to send Instagram DM:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}


