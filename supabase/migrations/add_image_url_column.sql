-- Add image_url column to scheduled_posts table
-- Run this in Supabase SQL Editor

ALTER TABLE scheduled_posts 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Optional: Add a comment to describe the column
COMMENT ON COLUMN scheduled_posts.image_url IS 'URL of AI-generated image for Instagram posts';
