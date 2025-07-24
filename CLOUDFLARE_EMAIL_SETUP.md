# Email Reply Setup Guide

## ✅ What's Implemented

### 1. **Enhanced Email Template**
- ✅ Clear instruction: "Beantwoord gewoon deze email!"
- ✅ Professional layout with reply encouragement
- ✅ Fallback website option still available
- ✅ Question ID tracking for replies

### 2. **Email Reply Processing**
- ✅ Webhook endpoint: `/api/email/webhook`
- ✅ Database table: `story_question_responses`
- ✅ Email content parsing and cleanup
- ✅ Automatic question/story linking

### 3. **Database Integration**
- ✅ Migration applied successfully
- ✅ Response tracking with status (received/reviewed/integrated)
- ✅ Email metadata storage

## 🚀 Final Setup Steps

### Step 1: Configure Resend Webhook
1. **Go to**: [resend.com/webhooks](https://resend.com/webhooks)
2. **Click**: "Add Webhook"
3. **Endpoint URL**: `https://your-domain.com/api/email/webhook`
4. **Events**: Select "Email Received" or "Inbound Email"
5. **Click**: "Save"

### Step 2: Test Email Replies
1. **Send a question** to a team member via email
2. **Team member replies** to the email (no account needed!)
3. **Check console** for webhook processing logs
4. **View responses** in your project dashboard

### Step 3: Production Deployment
When you deploy to Render, make sure:
- ✅ Domain is verified in Resend
- ✅ Webhook URL points to your production domain
- ✅ Database migrations are applied

## 📧 How It Works

### For Team Members:
1. **Receive email** with question
2. **Reply directly** to the email
3. **No account required** - just type and send!

### For You:
1. **Responses stored** in database automatically
2. **View all responses** in project dashboard
3. **Track status** (received → reviewed → integrated)
4. **Use responses** to enhance your story

## 🎯 Benefits

- ✅ **No friction** for external contributors
- ✅ **Email familiarity** - everyone knows how to reply
- ✅ **Automatic processing** - responses are captured and organized
- ✅ **Flexible workflow** - use responses however you want

---

## 🚨 URGENT: Database Migration Required

**Problem**: Database still requires phone_number (NOT NULL constraint)
**Solution**: Run this SQL in your Supabase dashboard

### Step 1: Go to Supabase SQL Editor
1. Open: https://supabase.com/dashboard/project/sfnbundogjxrrrotmzqy/sql
2. Click "New Query"

### Step 2: Run This SQL
```sql
-- Make phone_number optional
ALTER TABLE story_team_members ALTER COLUMN phone_number DROP NOT NULL;

-- Ensure at least one contact method is provided
ALTER TABLE story_team_members ADD CONSTRAINT check_contact_method 
CHECK (phone_number IS NOT NULL OR email IS NOT NULL);
```

### Step 3: Test
After running the SQL, try adding a team member with only an email address.

---

## ⚠️ Issues Fixed

### ✅ Team Member Deletion Fixed

**Problems**: 
1. "No HTTP methods exported" error when deleting team members
2. Next.js 15+ async params requirement  
3. Database relationship error (using wrong table name)
4. "Fout: undefined" error - response format mismatch
5. Manual page refresh needed after deletion

**Solutions**: 
✅ Created proper DELETE endpoint at `/api/team-members/[id]/route.ts`  
✅ Fixed async params handling for Next.js 15+  
✅ Updated to use correct table names (`projects` instead of `stories`)  
✅ Fixed response format to include `success: true/false` property
✅ Auto-refresh team member list after deletion

### ✅ Optional Contact Methods

**Feature**: WhatsApp number is now optional
**Requirement**: At least one contact method (WhatsApp OR email) required
**UI Updates**: 
✅ Form validation updated to require at least one contact method
✅ Optional labels updated ("WhatsApp nummer (optioneel)")
✅ Team member display conditionally shows available contact methods
✅ Forward buttons only show for available contact methods

**Status**: Team member system supports email-only after database migration!
