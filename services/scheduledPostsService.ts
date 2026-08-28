import { supabase, isSupabaseConfigured } from './supabaseClient';
import { ScheduledPost, PostStatus, Platform } from '../types';

/**
 * Scheduled Posts Service
 * Handles all CRUD operations for the scheduled_posts table (Posts Flow)
 */

/**
 * Convert a local datetime string (from datetime-local input) to UTC ISO string.
 * datetime-local gives values like "2026-01-13T18:17:35" without timezone.
 * We need to interpret this as local time and convert to UTC for Supabase.
 */
function toUTCISOString(localDatetime: string | null | undefined): string | null {
    if (!localDatetime) return null;

    // If it's already a full ISO string with timezone, return as-is
    if (localDatetime.includes('Z') || /[+-]\d{2}:\d{2}$/.test(localDatetime)) {
        return localDatetime;
    }

    // Parse as local time and convert to UTC ISO string
    const localDate = new Date(localDatetime);
    if (isNaN(localDate.getTime())) {
        console.error('Invalid date:', localDatetime);
        return null;
    }

    return localDate.toISOString();
}

// Mock data for when Supabase is not configured
const MOCK_SCHEDULED_POSTS: ScheduledPost[] = [
    {
        id: 'mock-post-1',
        platforms: ['facebook', 'instagram'],
        content: {
            facebook: "We're excited to launch our new Leadership Masterclass! 🎉 Join us for a transformative experience.",
            instagram: "New Leadership Masterclass dropping soon! ✨ Stay tuned for the launch date. #Leadership #Growth"
        },
        status: 'scheduled',
        schedule_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
        sent_at: null,
        error_message: null,
        created_by: null,
        created_at: new Date().toISOString(),
    },
    {
        id: 'mock-post-2',
        platforms: ['facebook'],
        content: {
            facebook: "Success story: How our client increased their team productivity by 200%! Read the full case study 👇",
            instagram: ""
        },
        status: 'draft',
        schedule_at: null,
        sent_at: null,
        error_message: null,
        created_by: null,
        created_at: new Date().toISOString(),
    },
    {
        id: 'mock-post-3',
        platforms: ['instagram'],
        content: {
            facebook: "",
            instagram: "Monday motivation: 'The only way to do great work is to love what you do.' - Steve Jobs 💼✨ #MondayMotivation"
        },
        status: 'scheduled',
        schedule_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
        sent_at: null,
        error_message: null,
        created_by: null,
        created_at: new Date().toISOString(),
    },
    {
        id: 'mock-post-4',
        platforms: ['facebook', 'instagram'],
        content: {
            facebook: "Thank you all for joining our webinar yesterday! Here are the key takeaways...",
            instagram: "Webinar recap! 🎯 Swipe through for the top insights from yesterday's session. #ProfessionalDevelopment"
        },
        status: 'sent',
        schedule_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        sent_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        error_message: null,
        created_by: null,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
];

/**
 * Fetch all scheduled posts for calendar
 */
export async function fetchScheduledPosts(): Promise<ScheduledPost[]> {
    if (!isSupabaseConfigured()) {
        console.log('Using mock data - Supabase not configured');
        return MOCK_SCHEDULED_POSTS;
    }

    const { data, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .order('schedule_at', { ascending: true });

    if (error) {
        console.error('Error fetching scheduled posts:', error);
        throw error;
    }

    return data || [];
}

/**
 * Fetch posts by status
 */
export async function fetchPostsByStatus(status: PostStatus[]): Promise<ScheduledPost[]> {
    if (!isSupabaseConfigured()) {
        return MOCK_SCHEDULED_POSTS.filter(p => status.includes(p.status));
    }

    const { data, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .in('status', status)
        .order('schedule_at', { ascending: true });

    if (error) {
        console.error('Error fetching posts:', error);
        throw error;
    }

    return data || [];
}

/**
 * Insert a new scheduled post
 */
export async function insertScheduledPost(
    post: {
        platforms: Platform[];
        content: Record<string, string>;
        status: PostStatus;
        schedule_at?: string | null;
        image_url?: string | null;
    }
): Promise<ScheduledPost | null> {
    console.log('insertScheduledPost called with:', post);

    if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured - post not saved to database');
        // Create a mock post for local state
        const mockPost: ScheduledPost = {
            id: `mock-${Date.now()}`,
            platforms: post.platforms,
            content: post.content,
            status: post.status,
            schedule_at: post.schedule_at || null,
            image_url: post.image_url || null,
            sent_at: null,
            error_message: null,
            created_by: null,
            created_at: new Date().toISOString(),
        };
        MOCK_SCHEDULED_POSTS.unshift(mockPost);
        console.log('Mock post created:', mockPost);
        return mockPost;
    }

    try {
        console.log('Inserting post into Supabase...');

        // Convert local datetime to UTC ISO string
        const scheduleAtUTC = toUTCISOString(post.schedule_at);
        console.log('Original schedule_at:', post.schedule_at, '-> UTC:', scheduleAtUTC);

        const insertData: Record<string, unknown> = {
            platforms: post.platforms,
            content: post.content,
            status: post.status,
            schedule_at: scheduleAtUTC,
        };

        // Only include image_url if it has a value
        if (post.image_url) {
            insertData.image_url = post.image_url;
            console.log('Including image_url:', post.image_url);
        }

        console.log('Full insertData:', JSON.stringify(insertData, null, 2));

        const { data, error } = await supabase
            .from('scheduled_posts')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            console.error('Error details:', error.details);
            throw error;
        }

        console.log('Post inserted successfully:', data);
        return data;
    } catch (err) {
        console.error('Error in insertScheduledPost:', err);
        throw err;
    }
}

/**
 * Update a scheduled post
 */
export async function updateScheduledPost(
    postId: string,
    updates: Partial<Pick<ScheduledPost, 'platforms' | 'content' | 'status' | 'schedule_at'>>
): Promise<ScheduledPost> {
    // Convert schedule_at to UTC if present
    const processedUpdates = { ...updates };
    if (updates.schedule_at !== undefined) {
        processedUpdates.schedule_at = toUTCISOString(updates.schedule_at);
        console.log('Original schedule_at:', updates.schedule_at, '-> UTC:', processedUpdates.schedule_at);
    }

    if (!isSupabaseConfigured()) {
        const post = MOCK_SCHEDULED_POSTS.find(p => p.id === postId);
        if (post) {
            Object.assign(post, processedUpdates);
        }
        return post!;
    }

    const { data, error } = await supabase
        .from('scheduled_posts')
        .update(processedUpdates)
        .eq('id', postId)
        .select()
        .single();

    if (error) {
        console.error('Error updating scheduled post:', error);
        throw error;
    }

    return data;
}

/**
 * Schedule a draft post
 */
export async function schedulePost(
    postId: string,
    scheduleAt: string
): Promise<ScheduledPost> {
    return updateScheduledPost(postId, {
        status: 'scheduled',
        schedule_at: scheduleAt,
    });
}

/**
 * Save as draft (update content without scheduling)
 */
export async function saveAsDraft(
    postId: string,
    content: Record<Platform, string>,
    platforms: Platform[]
): Promise<ScheduledPost> {
    return updateScheduledPost(postId, {
        content,
        platforms,
        status: 'draft',
    });
}

/**
 * Subscribe to realtime post changes
 */
export function subscribeToPostChanges(
    callback: (payload: { eventType: string; new: ScheduledPost; old: ScheduledPost }) => void
) {
    if (!isSupabaseConfigured()) {
        console.log('Realtime not available - Supabase not configured');
        return { unsubscribe: () => { } };
    }

    const subscription = supabase
        .channel('scheduled_posts_changes')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'scheduled_posts' },
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

/**
 * Get posts for a specific date (for calendar view)
 */
export function getPostsForDate(posts: ScheduledPost[], date: string): ScheduledPost[] {
    return posts.filter(post => {
        if (!post.schedule_at) return false;
        const postDate = new Date(post.schedule_at).toISOString().split('T')[0];
        return postDate === date;
    });
}

/**
 * Delete a scheduled post
 */
export async function deleteScheduledPost(postId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
        console.log('Using mock data - simulating delete');
        const index = MOCK_SCHEDULED_POSTS.findIndex(p => p.id === postId);
        if (index !== -1) {
            MOCK_SCHEDULED_POSTS.splice(index, 1);
        }
        return;
    }

    console.log('Attempting to delete post:', postId);

    // First verify the post exists
    const { data: existingPost, error: fetchError } = await supabase
        .from('scheduled_posts')
        .select('id, status')
        .eq('id', postId)
        .single();

    if (fetchError) {
        console.error('Post not found or fetch error:', fetchError);
        throw new Error(`Post not found: ${postId}`);
    }

    console.log('Found post to delete:', existingPost);

    // Now delete it
    const { data, error, count } = await supabase
        .from('scheduled_posts')
        .delete()
        .eq('id', postId)
        .select();

    console.log('Delete response:', { data, error, count });

    if (error) {
        console.error('Failed to delete post:', error);
        throw error;
    }

    // Check if anything was actually deleted
    if (!data || data.length === 0) {
        console.error('Delete returned no data - RLS policy may be blocking delete');
        throw new Error('Delete failed - permission denied. Check RLS policies.');
    }

    console.log('Post successfully deleted:', postId, data);
}
