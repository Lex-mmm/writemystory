# Email Configuration for WriteMyStory

To enable email functionality for team member questions, add these environment variables to your .env.local file:

```
# SMTP Configuration (Example using Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM=WriteMyStory <your-email@gmail.com>

# App URL for links in emails
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Setting up Gmail SMTP:
1. Enable 2-factor authentication on your Gmail account
2. Generate an "App Password" in Google Account settings
3. Use the app password as SMTP_PASS (not your regular password)

## Other SMTP providers:
- **Outlook/Hotmail**: smtp-mail.outlook.com, port 587
- **Yahoo**: smtp.mail.yahoo.com, port 587
- **Custom SMTP**: Use your hosting provider's SMTP settings

## Database Update:
Run the SQL migration to add the email field:
```sql
-- File: lib/add-email-to-team-members.sql
-- Run this in your Supabase SQL editor or database console
```
