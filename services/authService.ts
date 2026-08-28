import { supabase, isSupabaseConfigured } from './supabaseClient';
import { User } from '../types';

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role?: string;
}

/**
 * Authentication Service
 * Handles user authentication with Supabase Auth
 */

/**
 * Sign up a new user
 */
export async function signUp(email: string, password: string, name: string): Promise<{ user: AuthUser | null; error: string | null }> {
    if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured - using mock signup');
        return {
            user: {
                id: 'mock-user-' + Date.now(),
                email,
                name,
                avatar: 'https://picsum.photos/id/64/100/100',
                role: 'User'
            },
            error: null
        };
    }

    try {
        // Sign up with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: name,
                }
            }
        });

        if (authError) {
            return { user: null, error: authError.message };
        }

        if (!authData.user) {
            return { user: null, error: 'Failed to create user' };
        }

        // Create user profile in profiles table
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: authData.user.id,
                email: authData.user.email,
                name: name,
                role: 'User',
                created_at: new Date().toISOString()
            });

        if (profileError) {
            console.error('Error creating profile:', profileError);
        }

        const user: AuthUser = {
            id: authData.user.id,
            email: authData.user.email || email,
            name: name,
            avatar: 'https://picsum.photos/id/64/100/100',
            role: 'User'
        };

        return { user, error: null };
    } catch (error) {
        console.error('Signup error:', error);
        return { user: null, error: 'An unexpected error occurred' };
    }
}

/**
 * Sign in an existing user
 */
export async function signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
    if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured - using mock login');
        // Mock login for development
        if (email && password) {
            return {
                user: {
                    id: 'mock-user-123',
                    email,
                    name: 'Demo User',
                    avatar: 'https://picsum.photos/id/64/100/100',
                    role: 'Senior Trainer'
                },
                error: null
            };
        }
        return { user: null, error: 'Invalid credentials' };
    }

    // Wrap entire sign-in in a timeout
    const signInWithTimeout = async (): Promise<{ user: AuthUser | null; error: string | null }> => {
        console.log('Attempting sign in for:', email);

        // Create timeout promise
        const timeout = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Sign in timed out')), 10000);
        });

        try {
            // Race between auth and timeout
            const authPromise = supabase.auth.signInWithPassword({
                email,
                password,
            });

            const { data: authData, error: authError } = await Promise.race([authPromise, timeout]);

            console.log('Auth response received');

            if (authError) {
                console.error('Auth error:', authError.message);
                return { user: null, error: authError.message };
            }

            if (!authData?.user) {
                return { user: null, error: 'Login failed' };
            }

            console.log('Auth successful, user ID:', authData.user.id);

            // Fetch user profile with timeout to prevent hanging
            let profile = null;
            try {
                const profilePromise = supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authData.user.id)
                    .single();

                const profileTimeout = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error('Profile fetch timeout')), 5000);
                });

                const result = await Promise.race([profilePromise, profileTimeout]);
                if (result?.data) {
                    profile = result.data;
                    console.log('Profile loaded:', profile.name);
                }
            } catch (profileError) {
                console.warn('Profile fetch failed or timed out, using defaults');
            }

            const user: AuthUser = {
                id: authData.user.id,
                email: authData.user.email || email,
                name: profile?.name || authData.user.user_metadata?.name || 'User',
                avatar: profile?.avatar || 'https://picsum.photos/id/64/100/100',
                role: profile?.role || 'User'
            };

            console.log('Sign in complete:', user.name);
            return { user, error: null };
        } catch (error: any) {
            console.error('Sign in error:', error?.message || error);
            if (error?.message === 'Sign in timed out') {
                return { user: null, error: 'Sign in timed out. Please check your internet connection and try again.' };
            }
            return { user: null, error: 'An unexpected error occurred. Please try again.' };
        }
    };

    return signInWithTimeout();
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<{ error: string | null }> {
    if (!isSupabaseConfigured()) {
        return { error: null };
    }

    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            return { error: error.message };
        }
        return { error: null };
    } catch (error) {
        console.error('Logout error:', error);
        return { error: 'An unexpected error occurred' };
    }
}

/**
 * Get current session
 */
export async function getCurrentSession(): Promise<{ user: AuthUser | null; error: string | null }> {
    if (!isSupabaseConfigured()) {
        console.log('getCurrentSession: Supabase not configured');
        return { user: null, error: null };
    }

    console.log('getCurrentSession: Checking session...');

    try {
        // Create timeout for the entire operation
        const timeout = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Session check timed out')), 8000);
        });

        const sessionCheck = async () => {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            console.log('getCurrentSession: getSession returned', session ? 'session found' : 'no session');

            if (sessionError) {
                console.error('getCurrentSession: Session error', sessionError.message);
                return { user: null, error: sessionError.message };
            }

            if (!session) {
                console.log('getCurrentSession: No active session');
                return { user: null, error: null };
            }

            console.log('getCurrentSession: Session found for user', session.user.id);

            // Fetch user profile with its own timeout
            let profile = null;
            try {
                const profilePromise = supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                const profileTimeout = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error('Profile timeout')), 3000);
                });

                const result = await Promise.race([profilePromise, profileTimeout]);
                if (result?.data) {
                    profile = result.data;
                    console.log('getCurrentSession: Profile loaded for', profile.name);
                }
            } catch (profileError) {
                console.warn('getCurrentSession: Profile fetch failed, using defaults');
            }

            const user: AuthUser = {
                id: session.user.id,
                email: session.user.email || '',
                name: profile?.name || session.user.user_metadata?.name || 'User',
                avatar: profile?.avatar || 'https://picsum.photos/id/64/100/100',
                role: profile?.role || 'User'
            };

            console.log('getCurrentSession: Success, user:', user.name);
            return { user, error: null };
        };

        // Race between session check and timeout
        return await Promise.race([sessionCheck(), timeout]);
    } catch (error: any) {
        console.error('getCurrentSession: Error', error?.message || error);
        return { user: null, error: null }; // Return null user on timeout, let them log in again
    }
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
    if (!isSupabaseConfigured()) {
        return { unsubscribe: () => { } };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('onAuthStateChange:', event);

        if (session?.user) {
            // Fetch profile with timeout
            let profile = null;
            try {
                const profilePromise = supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                const profileTimeout = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error('Profile timeout')), 3000);
                });

                const result = await Promise.race([profilePromise, profileTimeout]);
                if (result?.data) {
                    profile = result.data;
                }
            } catch (err) {
                console.warn('onAuthStateChange: Profile fetch failed, using defaults');
            }

            const user: AuthUser = {
                id: session.user.id,
                email: session.user.email || '',
                name: profile?.name || session.user.user_metadata?.name || 'User',
                avatar: profile?.avatar || 'https://picsum.photos/id/64/100/100',
                role: profile?.role || 'User'
            };
            callback(user);
        } else {
            callback(null);
        }
    });

    return {
        unsubscribe: () => subscription.unsubscribe()
    };
}

