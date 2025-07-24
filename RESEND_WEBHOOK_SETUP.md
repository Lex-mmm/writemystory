# 🚀 Complete Resend Webhook Configuration Guide

## 📋 Current Status
✅ Resend API Key: Configured  
✅ Webhook endpoint: `/api/email/webhook` exists  
✅ Database: `email_responses` table ready  
✅ Frontend: Updated to display email responses  

## 🔧 Step 1: Configure Resend Webhook

### A. Get your webhook URL:
```
https://your-production-domain.com/api/email/webhook
```
*Replace with your actual domain when deployed*

For local testing:
```
http://localhost:3002/api/email/webhook
```

### B. Set up webhook in Resend Dashboard:

1. **Go to Resend Dashboard:**
   - Visit: https://resend.com/webhooks
   - Login with your account

2. **Add New Webhook:**
   - Click "Add Webhook"
   - **Endpoint URL:** `https://your-domain.com/api/email/webhook`
   - **Events to track:** Select these:
     - ✅ `email.delivered`
     - ✅ `email.bounced` (optional)
     - ✅ `email.complained` (optional)

3. **Save webhook configuration**

## 🌐 Step 2: Configure Domain for Email Receiving

### A. Domain Setup in Resend:
1. Go to: https://resend.com/domains
2. Click "Add Domain"
3. Enter: `write-my-story.com`
4. Follow the DNS verification steps

### B. DNS Configuration (in your domain registrar):
Add these DNS records to `write-my-story.com`:

```dns
# MX Records (for receiving emails)
MX    @    mx1.resend.com    10
MX    @    mx2.resend.com    20

# SPF Record (for sending emails)
TXT   @    "v=spf1 include:_spf.resend.com ~all"

# DKIM Records (Resend will provide specific values)
TXT   resend._domainkey    [Resend will provide this value]

# DMARC Record (optional but recommended)
TXT   _dmarc    "v=DMARC1; p=quarantine; rua=mailto:dmarc@write-my-story.com"
```

## 📧 Step 3: Update Email Sending to Include Question IDs

The webhook needs to identify which question the reply belongs to. Let's update the email template:

### Current email format needs to include:
- Question ID in the email body
- Proper subject line formatting
- Reply-to address: info@write-my-story.com

## 🧪 Step 4: Test the Complete Flow

### Local Testing (Development):
1. Use ngrok to expose local webhook:
   ```bash
   ngrok http 3002
   ```
2. Use ngrok URL in Resend webhook: `https://abc123.ngrok.io/api/email/webhook`

### Production Testing:
1. Deploy your app to production
2. Update Resend webhook to production URL
3. Send test question via email
4. Reply to the email
5. Check dashboard for automatic appearance

## 🔍 Step 5: Debug Email Flow

### Test Webhook Directly:
```javascript
// Run in browser console to test webhook
const testWebhook = async () => {
  const mockEmailData = {
    from: { email: 'test@example.com', name: 'Test User' },
    to: [{ email: 'info@write-my-story.com' }],
    subject: 'Re: Vraag voor je verhaal - WriteMyStory',
    text: 'Dit is mijn antwoord! ID: your-question-id-here',
    'message-id': '<test@example.com>',
    'in-reply-to': '<original@write-my-story.com>',
    references: '<original@write-my-story.com>'
  };
  
  const response = await fetch('/api/email/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mockEmailData)
  });
  
  const result = await response.json();
  console.log('Webhook test result:', result);
  
  if (result.success) {
    console.log('✅ Webhook working! Refreshing page...');
    setTimeout(() => window.location.reload(), 1000);
  }
};

testWebhook();
```

## 📱 Expected User Experience After Setup

1. **User forwards question** → Email sent with question ID embedded
2. **Team member replies** → Email goes to info@write-my-story.com
3. **Resend receives email** → Triggers webhook to your API
4. **Webhook processes reply** → Saves to database automatically
5. **User refreshes dashboard** → Sees reply immediately with 📧 badge

## ⚠️ Important Notes

- **Question ID matching:** Emails must include the question ID for proper threading
- **Domain verification:** write-my-story.com must be verified in Resend
- **Webhook security:** Consider adding webhook signature verification
- **Error handling:** Monitor webhook logs for failed email processing

## 🚨 Current Limitation

Right now the webhook exists but **Resend is not configured to call it**. You need to:

1. ✅ Configure webhook in Resend dashboard (do this first)
2. ✅ Set up domain DNS records for email receiving  
3. ✅ Test with real email replies

Once configured, email replies will appear automatically! 🎉

## 🔗 Quick Links

- [Resend Webhooks Dashboard](https://resend.com/webhooks)
- [Resend Domains Dashboard](https://resend.com/domains)  
- [Your Webhook Endpoint](http://localhost:3002/api/email/webhook)
- [Email Automation Setup Guide](./EMAIL_AUTOMATION_SETUP.md)
