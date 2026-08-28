import { supabase, isSupabaseConfigured } from './supabaseClient';
import { SocialComment, ReplyStatus } from '../types';

/**
 * Social Comments Service
 * Handles all CRUD operations for the social_comments table (Replies Flow)
 */

/**
 * Fetch all comments for the inbox (new and suggested status)
 */
export async function fetchInboxComments(): Promise<SocialComment[]> {
    if (!isSupabaseConfigured()) {
        console.log('Supabase not configured - returning empty array');
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('social_comments')
            .select('*')
            .in('reply_status', ['new', 'suggested'])
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching inbox comments:', error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('Failed to fetch comments:', err);
        return [];
    }
}

/**
 * Fetch all comments by status
 */
export async function fetchCommentsByStatus(status: ReplyStatus[]): Promise<SocialComment[]> {
    if (!isSupabaseConfigured()) {
        console.log('Supabase not configured - returning empty array');
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('social_comments')
            .select('*')
            .in('reply_status', status)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching comments:', error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('Failed to fetch comments by status:', err);
        return [];
    }
}

/**
 * Approve a reply for a comment
 */
export async function approveReply(
    commentId: string,
    approvedReply: string
): Promise<SocialComment> {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
        .from('social_comments')
        .update({
            approved_reply: approvedReply,
            reply_status: 'approved',
        })
        .eq('id', commentId)
        .select()
        .single();

    if (error) {
        console.error('Error approving reply:', error);
        throw error;
    }

    return data;
}

/**
 * Update reply status
 */
export async function updateReplyStatus(
    commentId: string,
    status: ReplyStatus
): Promise<SocialComment> {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
        .from('social_comments')
        .update({ reply_status: status, sent_at: status === 'sent' ? new Date().toISOString() : null })
        .eq('id', commentId)
        .select()
        .single();

    if (error) {
        console.error('Error updating reply status:', error);
        throw error;
    }

    return data;
}

/**
 * Request regeneration of AI reply
 * Clears the current AI suggestion and resets status to 'new'
 * The n8n workflow (Flow 2) will pick it up and regenerate within ~5 minutes
 */
export async function requestReplyRegeneration(commentId: string): Promise<SocialComment> {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
        .from('social_comments')
        .update({
            ai_suggested_reply: null,
            ai_confidence: null,
            approved_reply: null,
            reply_status: 'new',
        })
        .eq('id', commentId)
        .select()
        .single();

    if (error) {
        console.error('Error requesting regeneration:', error);
        throw error;
    }

    return data;
}

// Helper to check if string is a valid UUID
function isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

/**
 * Subscribe to realtime comment changes
 */
export function subscribeToComments(
    callback: (payload: { eventType: string; new: SocialComment; old: SocialComment }) => void
) {
    if (!isSupabaseConfigured()) {
        console.log('Realtime not available - Supabase not configured');
        return { unsubscribe: () => { } };
    }

    const subscription = supabase
        .channel('social_comments_changes')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'social_comments' },
            (payload) => {
                callback(payload as any);
            }
        )
        .subscribe();

    return {
        unsubscribe: () => {
            supabase.removeChannel(subscription);
        },
    };
}
