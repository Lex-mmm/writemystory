# 📊 Resend Email Reply Monitoring Guide

## 🔍 Tracking Email Replies in Resend Dashboard

### 1. **Email Logs**
- Go to: https://resend.com/emails
- View all sent and received emails
- Filter by status: delivered, bounced, complained
- Search by recipient email or subject

### 2. **Webhook Activity**
- Go to: https://resend.com/webhooks
- Click on your webhook endpoint
- View "Recent deliveries" section
- See webhook calls, response codes, and timestamps

### 3. **Domain Health**
- Go to: https://resend.com/domains
- Check domain status and email receiving setup
- Monitor bounce rates and deliverability

## 📈 Webhook Response Monitoring

### What Resend tracks for your webhook:
- ✅ HTTP response code (200 = success)
- ✅ Response time
- ✅ Webhook payload delivery attempts
- ✅ Failed delivery retries

### Typical webhook flow:
1. Email received at info@write-my-story.com
2. Resend processes the email
3. Webhook fired to your endpoint
4. Your API responds with 200 status
5. Email response saved to database

## 🚨 Common Issues to Monitor

### Webhook Failures:
- 404: Webhook URL not found
- 500: Your API has an error
- Timeout: Your API is too slow to respond

### Email Issues:
- Bounced: Invalid recipient email
- Spam: Email marked as spam
- Blocked: Domain/IP restrictions

## 🧪 Testing Email Reply Reception

### Test Script (run in browser console):
```javascript
const testEmailReception = async () => {
  console.log('🧪 Testing Email Reception Flow...\n');
  
  // 1. Check webhook endpoint health
  console.log('1. Testing webhook endpoint...');
  try {
    const webhookTest = await fetch('/api/email/webhook');
    const webhookData = await webhookTest.json();
    console.log('✅ Webhook endpoint active:', webhookData.message);
  } catch (error) {
    console.log('❌ Webhook endpoint error:', error);
    return;
  }
  
  // 2. Simulate incoming email webhook
  console.log('\n2. Simulating incoming email...');
  const mockEmail = {
    from: { email: 'test@example.com', name: 'Test Sender' },
    to: [{ email: 'info@write-my-story.com' }],
    subject: 'Re: Vraag voor je verhaal - WriteMyStory',
    text: `Dit is een test antwoord op de vraag.
    
Ik herinner me dat verhaal nog heel goed. Het was een prachtige dag.

Question ID: test-question-id
Story ID: test-story-id

---
Dit bericht is verstuurd via WriteMyStory`,
    'message-id': '<test-' + Date.now() + '@example.com>',
    'in-reply-to': '<original@write-my-story.com>',
    references: '<original@write-my-story.com>'
  };
  
  try {
    const webhookResponse = await fetch('/api/email/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockEmail)
    });
    
    const webhookResult = await webhookResponse.json();
    
    if (webhookResponse.ok) {
      console.log('✅ Webhook processed email successfully');
      console.log('📧 Response saved with ID:', webhookResult.responseId);
    } else {
      console.log('❌ Webhook processing failed:', webhookResult.error);
    }
  } catch (error) {
    console.log('❌ Webhook test error:', error);
  }
  
  console.log('\n3. Check Resend Dashboard:');
  console.log('   → Go to https://resend.com/webhooks');
  console.log('   → Check recent webhook deliveries');
  console.log('   → Look for 200 response codes');
};

testEmailReception();
```

## 📱 Real-time Monitoring Setup

### Add Webhook Logging:
```javascript
// In your webhook endpoint, add detailed logging:
console.log('📧 Webhook received at:', new Date().toISOString());
console.log('📨 From:', from?.email);
console.log('📋 Subject:', subject);
console.log('🆔 Message ID:', messageId);
console.log('✅ Processing result:', result.success ? 'SUCCESS' : 'FAILED');
```

### Monitor Your Server Logs:
```bash
# Watch your application logs
tail -f /path/to/your/app/logs

# Or for local development
npm run dev # Watch console output
```

## 🎯 What Success Looks Like

### In Resend Dashboard:
- ✅ Emails appear in email logs
- ✅ Webhook shows 200 response codes
- ✅ No bounce or complaint notifications

### In Your Application:
- ✅ Email responses appear in database
- ✅ Dashboard shows 📧 badges on questions
- ✅ Blue response boxes display below questions

### Server Logs Show:
```
📧 Webhook received at: 2025-07-24T10:30:00.000Z
📨 From: oma@familie.nl
📋 Subject: Re: Vraag voor je verhaal - WriteMyStory
🆔 Message ID: <abc123@gmail.com>
🎯 Found question ID: abc-123-def
✅ Processing result: SUCCESS
📧 Email response saved: response-id-456
```

## 🚨 Troubleshooting Failed Replies

### If webhook shows failures:
1. Check your server is running
2. Verify webhook URL is correct
3. Check server logs for errors
4. Test webhook endpoint manually

### If emails not received:
1. Verify domain DNS settings
2. Check MX records are correct
3. Ensure SPF record includes Resend
4. Check if emails are going to spam

### If responses not appearing:
1. Check database for new email_responses
2. Verify frontend is loading email responses
3. Check question ID matching logic
4. Refresh dashboard page

## 📞 Support Resources

- Resend Documentation: https://resend.com/docs
- Resend Support: support@resend.com
- Webhook Testing: Use ngrok for local testing
- Database Check: Use Supabase dashboard to verify data
