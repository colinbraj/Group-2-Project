# Supabase Authentication Setup Guide

## Overview
This app now includes full authentication using Supabase Auth with email/password signup and login.

## Setup Steps

### 1. Run the Database Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Copy the entire contents of `supabase_migration.sql`
5. Paste into the SQL Editor
6. Click **Run** to execute the migration

This will create:
- ✅ `profiles` table for user data
- ✅ `platform_accounts` table (existing)
- ✅ `social_comments` table (existing)
- ✅ `scheduled_posts` table (existing)
- ✅ `activity_logs` table (existing)
- ✅ Row Level Security (RLS) policies for all tables

### 2. Configure Environment Variables

Make sure your `.env.local` file has the correct Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: For development with mock data
# Leave blank or comment out to use mock authentication
```

**Important:** The app will work without Supabase configured (using mock auth), but for real authentication you need these variables set.

### 3. Test the Authentication Flow

#### Sign Up:
1. Start the app (`npm run dev`)
2. Click "Sign up for free" on the login page
3. Enter:
   - Full Name (e.g., "John Doe")
   - Email (e.g., "john@example.com")
   - Password (min 6 characters)
4. Click "Create account"
5. You'll be automatically logged in

#### Sign In:
1. On the login page, enter your email and password
2. Click "Sign in to your account"
3. You'll be redirected to the Content Vault

#### Sign Out:
1. Click the "Logout" button in the sidebar
2. You'll be redirected to the login page

### 4. Email Confirmation (Optional)

By default, Supabase requires email confirmation for new signups. To disable this for testing:

1. Go to **Authentication** → **Settings** in Supabase Dashboard
2. Under "Email Auth", **disable** "Confirm email"
3. Click **Save**

For production, keep email confirmation **enabled** for security.

## Features Implemented

### ✅ Authentication Service (`services/authService.ts`)
- `signUp(email, password, name)` - Create new account
- `signIn(email, password)` - Login existing user
- `signOut()` - Logout current user
- `getCurrentSession()` - Check for existing session
- `onAuthStateChange(callback)` - Subscribe to auth changes

### ✅ Login/Signup Page (`pages/Login.tsx`)
- Toggle between Login and Signup modes
- Form validation (email, password min 6 chars, required fields)
- Error handling with user-friendly messages
- Loading states during authentication
- Beautiful UI with features showcase

### ✅ App Component (`App.tsx`)
- Session persistence (checks for existing session on load)
- Auth state management
- Automatic redirect after login/logout
- Loading state while checking authentication

### ✅ Database (`supabase_migration.sql`)
- `profiles` table with RLS policies
- Users can only read/update their own profile
- Profile created automatically on signup

## Mock vs Real Authentication

The app intelligently falls back to mock authentication if Supabase isn't configured:

**With Supabase configured:**
- ✅ Real user accounts in database
- ✅ Secure password hashing
- ✅ Session persistence across page refreshes
- ✅ Proper logout

**Without Supabase (Mock mode):**
- ⚠️ Accepts any email/password
- ⚠️ Session lost on page refresh
- ⚠️ No real database storage
- ✅ Good for development/testing

## Troubleshooting

### "Supabase not configured" in console
- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in `.env.local`
- Restart dev server after adding environment variables

### "Invalid credentials" error
- Make sure you've run the migration to create the `profiles` table
- Check that email confirmation is disabled (for testing) or check your email
- Verify the email/password you're using

### Session not persisting
- Make sure Supabase is configured (not in mock mode)
- Check browser console for errors
- Clear browser cache and try again

### Can't create new users
- Run the database migration to create `profiles` table
- Check RLS policies allow INSERT on profiles table
- Check Supabase Dashboard → Authentication → Users for created accounts

## Security Notes

1. **Passwords** - Supabase handles password hashing automatically
2. **RLS Policies** - Users can only access their own profile data
3. **Anon Key** - Safe to expose in frontend (limited permissions)
4. **Session Tokens** - Automatically managed by Supabase client
5. **Email Confirmation** - Enable for production deployments

## Next Steps

1. ✅ Run the migration
2. ✅ Set environment variables
3. ✅ Test signup/login flow
4. ✅ Verify profile data in Supabase Dashboard

You now have a fully functional authentication system! 🎉
