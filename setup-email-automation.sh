#!/bin/bash

echo "🚀 WriteMyStory Email Automation Setup"
echo "====================================="
echo ""

# Check if server is running
echo "🔍 Checking if development server is running..."
if curl -s http://localhost:3002/api/email/webhook > /dev/null; then
    echo "✅ Development server is running on port 3002"
else
    echo "❌ Development server not running. Please run 'npm run dev' first"
    exit 1
fi

echo ""
echo "📧 Current webhook endpoint: http://localhost:3002/api/email/webhook"
echo "🌐 For production, use: https://your-domain.com/api/email/webhook"
echo ""

echo "🔧 Next Steps for Complete Email Automation:"
echo ""
echo "1. 📱 Resend Dashboard Setup:"
echo "   → Go to: https://resend.com/webhooks"
echo "   → Click 'Add Webhook'"
echo "   → URL: https://your-production-domain.com/api/email/webhook"
echo "   → Events: email.delivered, email.bounced"
echo ""

echo "2. 🌍 Domain Configuration:"
echo "   → Go to: https://resend.com/domains"
echo "   → Add domain: write-my-story.com"
echo "   → Follow DNS verification steps"
echo ""

echo "3. 📬 DNS Records (add to your domain registrar):"
echo "   MX    @    mx1.resend.com    10"
echo "   MX    @    mx2.resend.com    20"
echo "   TXT   @    \"v=spf1 include:_spf.resend.com ~all\""
echo ""

echo "4. 🧪 Test the webhook locally:"
echo "   → Install ngrok: brew install ngrok"
echo "   → Run: ngrok http 3002"
echo "   → Use ngrok URL in Resend webhook for testing"
echo ""

echo "5. 🎯 After setup, the flow will be:"
echo "   → Team member replies to email"
echo "   → Email goes to info@write-my-story.com"
echo "   → Resend webhook calls your API"
echo "   → Reply appears automatically in dashboard"
echo ""

echo "✅ Your system is ready for webhook configuration!"
echo "📋 See RESEND_WEBHOOK_SETUP.md for detailed instructions"
