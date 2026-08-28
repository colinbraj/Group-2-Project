# App Code Audit - n8n Workflow Integration

**Date:** 2026-01-08
**Focus:** App-side code that interacts with n8n workflows

---

## Summary of Integration Points

| Feature | App Component | Service Function | n8n Workflow |
|---------|---------------|------------------|--------------|
| Send Reply | `SocialInbox.tsx` | `triggerSendReply()` | 3_send_reply |
| AI Create Post | `CreatePostModal.tsx` | `triggerCreatePost()` | 4_ai_create_post |
| Load Comments | `SocialInbox.tsx` | `fetchInboxComments()` | N/A (reads from Supabase) |
| Load Posts | `Calendar.tsx` | `fetchScheduledPosts()` | N/A (reads from Supabase) |

---

## Audit Findings

### 1. n8nService.ts ✅ GOOD

**triggerSendReply()** - Lines 21-91
- ✅ Proper validation of required fields
- ✅ Good error handling  
- ✅ Handles empty responses
- ✅ Logs everything for debugging
- ✅ Correct payload format: `{ platform, comment_id, reply }`

**triggerCreatePost()** - Lines 98-136
- ⚠️ **Missing logging** - No logging of what's being sent
- ⚠️ **No validation** - Doesn't validate required fields
- ✅ Correct payload format: `{ platforms, goal, tone, context }`

**Recommendation:** Add logging to `triggerCreatePost()` for consistency.

---

### 2. CreatePostModal.tsx ✅ MOSTLY GOOD

**handleGenerate()** - Lines 29-53
- ✅ Calls `triggerCreatePost()` correctly
- ✅ Handles success and error states
- ✅ Shows loading state
- ⚠️ **Missing feedback on success** - Just closes modal, no toast/confirmation

**Issue:** After creating a post, user has no clear confirmation it worked.

---

### 3. SocialInbox.tsx ✅ GOOD

**handleSendNow()** - Lines 107-133
- ✅ Calls `triggerSendReply()` with correct params
- ✅ Gets reply from `approved_reply` or `ai_suggested_reply`
- ✅ Updates local status on success
- ✅ Shows error alert on failure

---

### 4. scheduledPostsService.ts ✅ GOOD

**fetchScheduledPosts()** - Lines 72-89
- ✅ Falls back to mock data if Supabase not configured
- ✅ Proper error handling

**insertScheduledPost()** - Lines 116-172
- ✅ Good logging
- ✅ Mock data fallback
- ⚠️ **Not called from CreatePostModal** - The n8n workflow saves to Supabase directly

---

### 5. socialCommentsService.ts ✅ GOOD (after previous fixes)

**fetchInboxComments()** 
- ✅ Falls back to mock data on error
- ✅ Falls back to mock data if table empty
- ✅ Timeout-protected in App.tsx

---

## Key Finding: App Code is Correct ✅

The app code correctly:
1. Sends data to n8n webhooks in the expected format
2. Handles responses properly
3. Falls back gracefully when services aren't available

The issues you're experiencing are related to:
1. **Facebook permissions** - Need `pages_manage_engagement` permission
2. **n8n workflow internal config** - Workflows need to be properly configured in n8n itself

---

## Minor Improvements (Optional)

### 1. Add Logging to triggerCreatePost()

```typescript
export async function triggerCreatePost(
    platforms: Platform[],
    goal: string,
    tone: string,
    additionalContext?: string
): Promise<{ success: boolean; error?: string }> {
    console.log('triggerCreatePost called with:', { platforms, goal, tone, context: additionalContext });
    
    // ... rest of function
}
```

### 2. Add Success Toast to CreatePostModal

After `onSuccess?.()`:
```typescript
// Could add a toast notification here
console.log('AI Post created successfully!');
```

---

## Verification Steps

To verify the app is working correctly:

1. **Check Console for Send Reply:**
   ```
   triggerSendReply called with: { platform: "facebook", commentId: "...", reply: "..." }
   Sending to n8n: https://n8n.kadoshai.com/webhook/send-reply
   Payload: { platform: "facebook", comment_id: "...", reply: "..." }
   ```

2. **Check Network Tab:**
   - Request goes to: `https://n8n.kadoshai.com/webhook/send-reply`
   - Method: POST
   - Body: JSON with platform, comment_id, reply

3. **n8n Should Receive:**
   - The exact payload shown in console

---

## Conclusion

**App code is correct.** The issues are on the n8n/external service side:

| Issue | Root Cause |
|-------|------------|
| Send Reply fails | Facebook permissions error (#200) |
| Comments not loading from DB | n8n Workflow 1 or 2 needs to run to populate data |
| AI Post not saving | n8n Workflow 4 saves to Supabase (check if it's running) |

**Recommended actions:**
1. Get new Facebook access token with proper permissions
2. Manually run n8n Workflow 1 (Ingest Comments) to test data flow
3. Check n8n execution logs for any errors
