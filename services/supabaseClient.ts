import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration
// Add these to your .env.local file:
// VITE_SUPABASE_URL=https://your-project.supabase.co
// VITE_SUPABASE_ANON_KEY=your-anon-key

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Debug logging
console.log('=== Supabase Configuration ===');
console.log('VITE_SUPABASE_URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NOT SET');
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT SET');

// Helper to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
    const configured = Boolean(supabaseUrl && supabaseAnonKey);
    console.log('isSupabaseConfigured:', configured);
    return configured;
};

// Only create client if credentials exist to avoid crash when env vars are missing
// When not configured, the app will use mock data instead
let supabaseInstance: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
    console.log('Creating Supabase client...');
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    });
    console.log('Supabase client created successfully');
} else {
    console.warn(
        '⚠️ Supabase credentials not found. Using mock data. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local'
    );
}

// Export - services should always check isSupabaseConfigured() before using
export const supabase = supabaseInstance as SupabaseClient;

