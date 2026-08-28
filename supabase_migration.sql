-- ============================================
-- SUPABASE MIGRATION: Social Media Management
-- ============================================
-- Run this in Supabase SQL Editor to create all tables
-- 
-- Two AI-assisted workflows:
-- 1. Replies Flow: fetch comments → AI suggest reply → human confirm → send
-- 2. Posts Flow: AI create post → schedule post → send post
-- ============================================

-- ============================================
-- PART 1: User Profiles (Authentication)
-- ============================================
-- Stores user profile information
-- Linked to Supabase Auth users

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  role TEXT DEFAULT 'User',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "read_own_profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "update_own_profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id);

-- Users can insert their own profile (for signup)
CREATE POLICY "insert_own_profile"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================
-- PART 2: Platform Accounts (Server-only)
-- ============================================
-- Stores Facebook / Instagram credentials used by n8n
-- Never exposed to frontend

CREATE TABLE IF NOT EXISTS platform_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram')),
  page_id TEXT,
  ig_user_id TEXT,
  
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- PART 2: Social Comments (Replies Flow)
-- ============================================
-- Powers the Inbox UI

CREATE TABLE IF NOT EXISTS social_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram')),
  post_id TEXT NOT NULL,
  comment_id TEXT NOT NULL,
  
  author TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ,
  
  ai_suggested_reply TEXT,
  ai_confidence NUMERIC,
  
  approved_reply TEXT,
  
  reply_status TEXT NOT NULL DEFAULT 'new'
    CHECK (reply_status IN ('new', 'suggested', 'approved', 'sent', 'failed')),
  
  sent_at TIMESTAMPTZ,
  inserted_at TIMESTAMPTZ DEFAULT now()
);

-- Deduplication index (required)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_comment_platform 
ON social_comments (platform, comment_id);

-- ============================================
-- PART 3: Scheduled Posts (Publishing Flow)
-- ============================================
-- Powers Drafts, Calendar, and Scheduling

CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  platforms JSONB NOT NULL,
  content JSONB NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'sent', 'failed')),
  
  schedule_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  
  error_message TEXT,
  
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- PART 4: Activity Logs (Optional)
-- ============================================
-- Useful for debugging and audit trails

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  entity_type TEXT,
  entity_id UUID,
  
  action TEXT,
  details JSONB,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- PART 5: Row Level Security (RLS)
-- ============================================

-- Enable RLS on tables
ALTER TABLE social_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

-- Frontend Read Access (authenticated users only)
CREATE POLICY "read_comments"
ON social_comments
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "read_posts"
ON scheduled_posts
FOR SELECT
USING (auth.role() = 'authenticated');

-- Frontend Update Access (authenticated users only)
CREATE POLICY "update_comments"
ON social_comments
FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "update_posts"
ON scheduled_posts
FOR UPDATE
USING (auth.role() = 'authenticated');

-- Frontend Insert Access for scheduled_posts (for repurposing and AI post creation)
CREATE POLICY "insert_posts"
ON scheduled_posts
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- NOTES:
-- ============================================
-- ❌ No INSERT policy for social_comments (n8n handles inserts)
-- ❌ No DELETE policy for frontend
-- ✅ n8n uses Service Role Key for full access
-- ✅ Frontend can INSERT scheduled_posts (repurposing, AI posts)
-- 
-- Status Lifecycles:
-- Comments: new → suggested → approved → sent
-- Posts: draft → scheduled → sent
-- ============================================
