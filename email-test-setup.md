# Email Configuration Setup Guide

## Current Status
✅ Email SMTP configuration has been added to your `.env.local` file
⚠️ You need to replace the placeholder values with your actual email credentials

## Configuration Options

### Option 1: Gmail (Recommended for development)
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to https://myaccount.google.com/security
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. Update `.env.local` with:
   ```
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASS=your-16-character-app-password
   ```

### Option 2: Test with Ethereal Email (No real emails sent)
For testing purposes, you can use Ethereal Email which captures emails without sending them:

1. Visit https://ethereal.email/create
2. Copy the generated credentials
3. Update `.env.local` with the provided settings

### Option 3: SendGrid (Production ready)
For production use:
1. Sign up at https://sendgrid.com
2. Generate an API key
3. Update `.env.local` with:
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   ```

## After Configuration
1. Restart your development server: `npm run dev`
2. Test the email functionality by adding a team member and sending a question

## Current Settings in .env.local
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com          # ← Replace this
SMTP_PASS=your-app-password             # ← Replace this
SMTP_FROM=noreply@write-my-story.com
```

## Security Notes
- Never commit real email credentials to version control
- Use app passwords instead of your actual email password
- Consider using environment-specific configurations for production
