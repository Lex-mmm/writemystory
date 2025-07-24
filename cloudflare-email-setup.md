# Cloudflare Email Setup Guide for WriteMyStory

## Option 1: Cloudflare Email Workers (Recommended)

### Step 1: Enable Email Workers
1. Go to your Cloudflare dashboard
2. Select your domain (write-my-story.com)
3. Go to Workers & Pages
4. Create a new Worker for email sending

### Step 2: Create Email Worker
```javascript
// email-worker.js
export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { to, subject, html, text } = await request.json();

      const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: to }],
            },
          ],
          from: {
            email: 'noreply@write-my-story.com',
            name: 'WriteMyStory',
          },
          subject: subject,
          content: [
            {
              type: 'text/html',
              value: html,
            },
            {
              type: 'text/plain',
              value: text,
            },
          ],
        }),
      });

      if (response.ok) {
        return new Response('Email sent successfully', { status: 200 });
      } else {
        return new Response('Failed to send email', { status: 500 });
      }
    } catch (error) {
      return new Response('Error: ' + error.message, { status: 500 });
    }
  },
};
```

### Step 3: Update Your Environment Variables
Add to your `.env.local`:
```bash
# Cloudflare Email Worker
CLOUDFLARE_EMAIL_WORKER_URL=https://your-worker.your-subdomain.workers.dev
```

### Step 4: Update Your Email API Route
Replace the SMTP configuration in your email API route.

## Option 2: Cloudflare Email Routing + Workers

### Step 1: Set up Email Routing
1. In Cloudflare dashboard → Email
2. Add your domain
3. Create routing rules (e.g., noreply@write-my-story.com → your-email@gmail.com)

### Step 2: Verify Domain
1. Add the required DNS records
2. Verify your domain ownership

## Migration Steps

1. **Test the new setup** alongside existing SMTP
2. **Update environment variables** gradually
3. **Monitor email delivery** for a few days
4. **Remove SMTP configuration** once confirmed working

## Cost Comparison

| Service | Free Tier | Paid Plans |
|---------|-----------|------------|
| Cloudflare Workers | 100,000 requests/day | $5/month for 10M requests |
| Gmail SMTP | 500 emails/day | Limited and unreliable |
| SendGrid | 100 emails/day | $14.95/month for 40k emails |

## Advantages for Your Use Case

✅ **Better for team member forwarding** - more reliable delivery  
✅ **No rate limits** like Gmail has  
✅ **Professional appearance** - emails from @write-my-story.com  
✅ **Integrated monitoring** in Cloudflare dashboard  
✅ **Automatic scaling** as your user base grows  

## Next Steps

1. Would you like me to help you create the Cloudflare Worker?
2. Or would you prefer to update your existing email API to use Cloudflare Workers?
3. I can also help you set up the DNS records for email routing

Let me know which approach you'd prefer!
