# WhatsApp Feature Toggle

This document explains how to disable/enable WhatsApp functionality in the WriteMyStory application.

## Environment Variables

Add these to your `.env` file:

```bash
# Disable WhatsApp entirely (server-side)
WHATSAPP_ENABLED=false

# Disable WhatsApp in UI (client-side) 
NEXT_PUBLIC_WHATSAPP_ENABLED=false

# Optional: Twilio credentials (only needed if WHATSAPP_ENABLED=true)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token  
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

## What Gets Disabled

When `WHATSAPP_ENABLED=false` and `NEXT_PUBLIC_WHATSAPP_ENABLED=false`:

### API Routes
- `/api/whatsapp/send-question` - Returns 503 with helpful error message
- `/api/whatsapp/receive` - Returns 503 with helpful error message  
- `/api/whatsapp-upload` - Returns 503 with helpful error message

### Frontend UI
- **Project Dashboard**: WhatsApp upload section shows "disabled" message instead of upload form
- **Pricing Page**: WhatsApp references removed from plan descriptions
- **Signup Flow**: WhatsApp upload shows "disabled" message with alternatives
- **Question Forwarding**: WhatsApp option hidden (only email available)

### User Experience
- Clear messaging explaining WhatsApp is temporarily disabled
- Alternative methods prominently displayed (email forwarding, manual input)
- Graceful degradation - all core functionality remains available

## Enabling WhatsApp

To re-enable WhatsApp functionality:

1. Set up Twilio account with WhatsApp Business API
2. Update environment variables:
   ```bash
   WHATSAPP_ENABLED=true
   NEXT_PUBLIC_WHATSAPP_ENABLED=true
   TWILIO_ACCOUNT_SID=your_real_sid
   TWILIO_AUTH_TOKEN=your_real_token
   TWILIO_WHATSAPP_NUMBER=your_real_whatsapp_number
   ```
3. Restart the application

## Production Deployment

For production with WhatsApp disabled:

1. Ensure environment variables are set correctly in your hosting platform
2. The application will work fully without any Twilio setup
3. Users get clear messaging about alternatives
4. Email functionality remains primary communication method

## Benefits of This Approach

- **Production Ready**: Can deploy immediately without paid Twilio account
- **Feature Complete**: All core functionality available via email
- **User Friendly**: Clear messaging about disabled features and alternatives
- **Future Proof**: Easy to enable WhatsApp when ready
- **Cost Effective**: No need for Twilio subscription during development/early deployment
