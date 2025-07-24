# Email Response Testing Guide

## Overview
This guide explains how to test if email replies to questions are properly stored in your WriteMyStory application.

## Prerequisites
1. Make sure your development server is running (`npm run dev`)
2. Apply the database migration: `lib/add-question-tracking.sql`
3. Have test data: questions and team members in your database

## Testing Methods

### Method 1: Automated Test Script

Run the automated test script:
```bash
node test-email-responses.js
```

This will test:
- ✅ API endpoint availability
- ✅ Saving email responses 
- ✅ Retrieving email responses
- ✅ Updating response status
- ✅ Email webhook processing

### Method 2: Manual API Testing

#### Step 1: Save an Email Response
```bash
curl -X POST http://localhost:3000/api/questions/email-responses \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": "YOUR_QUESTION_ID",
    "storyId": "YOUR_STORY_ID", 
    "teamMemberEmail": "test@example.com",
    "responseContent": "This is my answer to the question...",
    "emailMessageId": "test-email-123"
  }'
```

#### Step 2: Retrieve Email Responses
```bash
# Get responses for a specific question
curl http://localhost:3000/api/questions/email-responses?questionId=YOUR_QUESTION_ID

# Get all responses for a story
curl http://localhost:3000/api/questions/email-responses?storyId=YOUR_STORY_ID
```

#### Step 3: Update Response Status
```bash
curl -X PATCH http://localhost:3000/api/questions/email-responses \
  -H "Content-Type: application/json" \
  -d '{
    "responseId": "RESPONSE_ID_FROM_STEP_1",
    "status": "reviewed"
  }'
```

### Method 3: Database Verification

Check if responses are stored in the database:

```sql
-- Check if email_responses table exists
SELECT * FROM email_responses LIMIT 5;

-- Check responses for a specific question
SELECT 
  er.*,
  q.question,
  stm.name as team_member_name
FROM email_responses er
JOIN questions q ON er.question_id = q.id
LEFT JOIN story_team_members stm ON er.team_member_id = stm.id
WHERE er.question_id = 'YOUR_QUESTION_ID';

-- Check all responses with details
SELECT * FROM email_responses_with_details LIMIT 10;
```

### Method 4: Frontend Testing

1. **Forward a Question via Email:**
   - Go to your project dashboard
   - Click "📤 Doorsturen" on a question
   - Send it via email to a team member

2. **Simulate Email Reply:**
   - Use the test script or API to add a response
   - Check if it appears in the project dashboard

3. **Check Tracking Display:**
   - Refresh the project page
   - Verify tracking info persists
   - Check if email responses show up

## Expected Results

### ✅ Success Indicators
- API returns `{"success": true}` for POST requests
- Responses appear in GET requests
- Database contains email_responses records
- Frontend displays tracking information
- Page refresh preserves tracking data

### ❌ Failure Indicators
- API returns errors (500, 404, etc.)
- Empty response arrays from GET requests
- Missing database records
- Frontend shows no tracking info
- Tracking disappears on refresh

## Common Issues & Solutions

### Issue: "Team member not found" error
**Solution:** Ensure the team member exists in `story_team_members` table with the correct email

### Issue: "Question not found" error  
**Solution:** Use valid question IDs from your `questions` table

### Issue: Database connection errors
**Solution:** Check Supabase connection and service role key

### Issue: RLS policy errors
**Solution:** Verify Row Level Security policies are correctly set up

## Real Email Testing

To test with actual emails:

1. **Set up email webhook** (with Resend/Mailgun/etc.)
2. **Configure webhook URL** to point to `/api/email/webhook`
3. **Send actual email** to team member
4. **Have them reply** to the email
5. **Check if webhook** captures and stores the response

## Debugging

Enable debug logging by adding to your API routes:
```javascript
console.log('Email response data:', responseData);
console.log('Database result:', dbResult);
```

Check browser console and server logs for errors.

## Test Data Examples

Use these sample IDs (replace with your actual data):
```javascript
const TEST_DATA = {
  questionId: "00a9950e-cb1a-4352-ab44-572c83c149ba",
  storyId: "4e52186a-5e68-45e9-a14b-3e106d200b3f",
  teamMemberEmail: "test@example.com"
};
```
