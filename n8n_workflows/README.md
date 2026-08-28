# n8n Workflow Templates

These workflows are configured for your n8n instance at https://n8n.kadoshai.com/

## Workflow Overview

| # | Workflow | Trigger | Purpose |
|---|----------|---------|---------|
| 1 | Ingest Comments | Cron (5m) | Fetch FB/IG posts with comments → Supabase |
| 2 | AI Suggest Reply | Cron (1m) | Generate AI replies for new comments |
| 3 | Send Reply | Webhook | Send approved replies to FB/IG |
| 4 | AI Create Post | Webhook | Generate AI post drafts |
| 5 | Scheduler | Cron (1m) | Check for due posts → trigger #6 |
| 6 | Publish Post | Execute Workflow | Post content to FB/IG |

## Webhook Endpoints (App Integration)

The app connects to these webhooks:

| Workflow | Webhook Path | App Function |
|----------|--------------|--------------|
| 3. Send Reply | `/webhook/send-reply` | `triggerSendReply()` |
| 4. AI Create Post | `/webhook/create-post` | `triggerCreatePost()` |

## Environment Variables

Add these to your `.env.local`:

```env
# n8n Configuration
VITE_N8N_BASE_URL=https://n8n.kadoshai.com
VITE_N8N_SEND_REPLY_WEBHOOK=/webhook/send-reply
VITE_N8N_CREATE_POST_WEBHOOK=/webhook/create-post

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Workflow Details

### 1. Ingest Comments (Cron)
**Flow:** Schedule → Get FB Posts + Get IG Media → Normalize Comments → Merge → Upsert to Supabase

**Fetches from:**
- Facebook: `https://graph.facebook.com/v18.0/{page_id}/feed` (with comments)
- Instagram: `https://graph.instagram.com/v24.0/{business_id}/media` (with comments)

### 2. AI Suggest Reply (Cron)
**Flow:** Schedule → Get New Comments → Check if any → Prepare Prompts → AI Generate Reply → Prepare Update → Update Supabase

**Updates:** `reply_status` = "suggested", `ai_suggested_reply`, `ai_confidence`

### 3. Send Reply (Webhook)
**Trigger:** POST `/webhook/send-reply`
**Body:**
```json
{
  "platform": "facebook" | "instagram",
  "comment_id": "string",
  "reply": "string"
}
```
**Flow:** Validate → Route by Platform → Post Reply → Update Status → Respond

### 4. AI Create Post (Webhook)
**Trigger:** POST `/webhook/create-post`
**Body:**
```json
{
  "platforms": ["facebook", "instagram"],
  "goal": "engagement" | "awareness" | etc,
  "tone": "professional" | "friendly" | etc,
  "context": "optional additional context"
}
```
**Flow:** AI Generate Content → Prepare Data → Upsert to Supabase → Respond

### 5. Scheduler (Cron)
**Flow:** Every 1 min → Get Due Posts (status=scheduled, schedule_at <= now) → Execute Workflow #6

### 6. Publish Post (Execute Workflow)
**Flow:** Input → Lock Post → Split by Platform → Route → Post to FB/IG → Mark as Sent

## Supabase Tables Required

### `social_comments`
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| platform | text | "facebook" or "instagram" |
| post_id | text | Original post ID |
| comment_id | text | Comment ID from platform |
| author | text | Comment author name |
| message | text | Comment text |
| reply_status | text | "new", "suggested", "approved", "sent", "failed" |
| ai_suggested_reply | text | AI-generated reply |
| ai_confidence | float | AI confidence score (0-1) |
| approved_reply | text | User-edited reply |
| created_at | timestamptz | When comment was created |
| sent_at | timestamptz | When reply was sent |

### `scheduled_posts`
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| platforms | text[] | ["facebook", "instagram"] |
| content | jsonb | { facebook: "...", instagram: "..." } |
| status | text | "draft", "scheduled", "publishing", "sent" |
| schedule_at | timestamptz | When to publish |
| created_at | timestamptz | When created |

## Testing

1. **Test Workflow 1:** Run manually in n8n, check Supabase for new comments
2. **Test Workflow 2:** Run manually, check `ai_suggested_reply` populated
3. **Test Workflow 3:** From app, click "Send Now" on approved comment
4. **Test Workflow 4:** From app, click "AI Post" button on Calendar page
