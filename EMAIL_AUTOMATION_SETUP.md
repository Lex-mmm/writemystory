# 🚀 Complete Email Replies Automation Setup Guide

## ✅ Current Status
- ✅ Database migration applied (`email_responses` table exists)
- ✅ API endpoints working (`/api/questions/email-responses`)
- ✅ Dashboard UI displaying email responses
- ✅ Email webhook endpoint exists (`/api/email/webhook`)
- ✅ Email sending via Resend configured

## 🔧 Missing Steps for Full Automation

### 1. **Configure Resend Webhook** 
To make email replies automatically appear in the dashboard:

#### A. Set up Resend webhook:
1. Go to [Resend Dashboard](https://resend.com/webhooks)
2. Add webhook endpoint: `https://your-domain.com/api/email/webhook`
3. Select event: `email.received` or `email.delivered`

#### B. Configure email domain:
1. In Resend Dashboard → Domains
2. Verify your domain `write-my-story.com`
3. Set up MX records to receive emails at `info@write-my-story.com`

### 2. **Update Email Sending to Include Tracking**
The outgoing emails need question IDs for the webhook to match replies:

```typescript
// In send-question email template, add:
const emailHtml = `
<html>
  <body>
    <h2>Vraag voor je verhaal - WriteMyStory</h2>
    <p>Hallo ${teamMemberName},</p>
    
    <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-left: 4px solid #3b82f6;">
      <h3>${question.category}</h3>
      <p><strong>${question.question}</strong></p>
    </div>
    
    <p>Kun je deze vraag beantwoorden? Je kunt gewoon op deze email antwoorden.</p>
    
    <hr style="margin: 30px 0;">
    <small style="color: #666;">
      Question ID: ${question.id}
      Story ID: ${storyId}
      
      Dit bericht is verstuurd via WriteMyStory - automatisch verwerkt in je verhaal!
    </small>
  </body>
</html>
`;
```

### 3. **Test the Complete Flow**

#### A. Send test question:
1. Go to project dashboard
2. Forward a question to team member via email
3. Check that email contains question ID

#### B. Reply via email:
1. Team member replies to `info@write-my-story.com`
2. Resend webhook captures the reply
3. Webhook saves to `email_responses` table
4. Dashboard shows the reply automatically

### 4. **Environment Variables Required**
Make sure these are set:
```env
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 5. **DNS Configuration for Email Receiving**
In your domain DNS settings (write-my-story.com):
```
MX Record: @ → mx1.resend.com (priority 10)
MX Record: @ → mx2.resend.com (priority 20)
TXT Record: @ → "v=spf1 include:_spf.resend.com ~all"
```

## 🧪 Testing Email Automation

### Quick Test Script:
```javascript
// Run in browser console on dashboard
const testEmailFlow = async () => {
  // 1. Get a question
  const response = await fetch('/api/questions?storyId=' + window.location.pathname.split('/')[2]);
  const data = await response.json();
  
  if (data.questions?.length > 0) {
    const questionId = data.questions[0].id;
    
    // 2. Simulate webhook receiving email reply
    const mockEmailData = {
      from: { email: 'oma@familie.nl', name: 'Oma Gertrude' },
      subject: 'Re: Vraag voor je verhaal - WriteMyStory',
      text: `Dit is mijn antwoord op de vraag!
      
Ik herinner me dat verhaal nog heel goed. Het was prachtig weer die dag.

Question ID: ${questionId}

---
Dit bericht is verstuurd via WriteMyStory`
    };
    
    // 3. Send to webhook
    const webhookResponse = await fetch('/api/email/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockEmailData)
    });
    
    if (webhookResponse.ok) {
      console.log('✅ Webhook test successful!');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      console.log('❌ Webhook test failed');
    }
  }
};

testEmailFlow();
```

## 📧 Expected User Experience

1. **User forwards question via email** → Team member receives email with question
2. **Team member replies to email** → Goes to info@write-my-story.com  
3. **Resend webhook processes reply** → Automatically saved to database
4. **User refreshes dashboard** → Sees reply with 📧 badge and blue response box

## 🚨 Current Limitation

Right now, the webhook exists but **Resend webhook is not configured** to call it when emails are received. You need to:

1. Set up Resend webhook pointing to your domain
2. Configure email receiving on your domain
3. Test the complete flow

Once configured, email replies will appear automatically in the dashboard! 🎉
