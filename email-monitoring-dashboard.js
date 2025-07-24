// Email Reply Monitoring Dashboard - Run in browser console
const createMonitoringDashboard = () => {
  console.log('📊 EMAIL REPLY MONITORING DASHBOARD');
  console.log('=====================================\n');
  
  // Quick links
  console.log('🔗 QUICK LINKS:');
  console.log('📧 Resend Emails: https://resend.com/emails');
  console.log('🎣 Resend Webhooks: https://resend.com/webhooks');
  console.log('🌍 Resend Domains: https://resend.com/domains');
  console.log('🛠️ Your Webhook:', window.location.origin + '/api/email/webhook');
  console.log('');
  
  // Test functions
  window.testWebhookHealth = async () => {
    console.log('🧪 Testing webhook health...');
    try {
      const response = await fetch('/api/email/webhook');
      const data = await response.json();
      console.log('✅ Webhook is healthy:', data.message);
    } catch (error) {
      console.log('❌ Webhook health check failed:', error);
    }
  };
  
  window.simulateEmailReply = async (questionId = null) => {
    console.log('📧 Simulating email reply...');
    
    // Get a real question ID if not provided
    if (!questionId) {
      try {
        const projectId = window.location.pathname.split('/')[2];
        const response = await fetch(`/api/questions?storyId=${projectId}`);
        const data = await response.json();
        
        if (data.questions && data.questions.length > 0) {
          questionId = data.questions[0].id;
          console.log('🎯 Using question ID:', questionId);
        } else {
          console.log('❌ No questions found to test with');
          return;
        }
      } catch (error) {
        console.log('❌ Could not get question ID:', error);
        return;
      }
    }
    
    const mockEmail = {
      from: { email: 'test@example.com', name: 'Test Team Member' },
      to: [{ email: 'info@write-my-story.com' }],
      subject: 'Re: Vraag voor je verhaal - WriteMyStory',
      text: `Dit is een test antwoord!

Ik herinner me dat verhaal nog heel goed. Het was een prachtige zomerdag en iedereen was zo gelukkig. Deze herinnering zal ik nooit vergeten.

Ik hoop dat dit helpt voor het verhaal!

Groetjes,
Test Teamlid

---
Question ID: ${questionId}
Dit bericht is verstuurd via WriteMyStory`,
      'message-id': '<test-' + Date.now() + '@example.com>',
      'in-reply-to': '<original@write-my-story.com>',
      references: '<original@write-my-story.com>'
    };
    
    try {
      console.log('📤 Sending test email to webhook...');
      const response = await fetch('/api/email/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockEmail)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Test email processed successfully!');
        console.log('🆔 Response ID:', result.responseId);
        console.log('⏱️ Processing time:', result.processingTime + 'ms');
        console.log('🔄 Refreshing page in 2 seconds...');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        console.log('❌ Test email failed:', result.error);
        console.log('📋 Details:', result.details);
      }
    } catch (error) {
      console.log('❌ Test email error:', error);
    }
  };
  
  window.checkEmailResponses = async () => {
    console.log('📊 Checking email responses in database...');
    
    try {
      const projectId = window.location.pathname.split('/')[2];
      if (!projectId) {
        console.log('❌ Not on a project page');
        return;
      }
      
      const response = await fetch(`/api/questions/email-responses?storyId=${projectId}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ Found ${data.responses?.length || 0} email responses`);
        
        if (data.responses && data.responses.length > 0) {
          console.log('📧 Recent responses:');
          data.responses.slice(0, 3).forEach((resp, i) => {
            console.log(`   ${i + 1}. ${resp.team_member_name}: "${resp.response_content.substring(0, 50)}..."`);
            console.log(`      Status: ${resp.status} | Created: ${new Date(resp.created_at).toLocaleString()}`);
          });
        } else {
          console.log('📭 No email responses found');
          console.log('💡 Try running: simulateEmailReply()');
        }
      } else {
        console.log('❌ Failed to check email responses:', data.error);
      }
    } catch (error) {
      console.log('❌ Error checking email responses:', error);
    }
  };
  
  window.monitorWebhookLogs = () => {
    console.log('📜 WEBHOOK MONITORING GUIDE:');
    console.log('1. Open browser DevTools → Network tab');
    console.log('2. Filter by "webhook" or "/api/email"');
    console.log('3. Watch for incoming webhook calls');
    console.log('4. Check response codes (200 = success)');
    console.log('');
    console.log('📊 Server logs to watch for:');
    console.log('  ✅ "EMAIL WEBHOOK RECEIVED"');
    console.log('  ✅ "EMAIL PROCESSING SUCCESS"');
    console.log('  ❌ "EMAIL PROCESSING FAILED"');
  };
  
  // Display available commands
  console.log('🎮 AVAILABLE COMMANDS:');
  console.log('testWebhookHealth()     - Test if webhook is responding');
  console.log('simulateEmailReply()    - Send test email through webhook');
  console.log('checkEmailResponses()   - Check database for email responses');
  console.log('monitorWebhookLogs()    - Guide for monitoring webhook activity');
  console.log('');
  
  // Auto-run basic checks
  console.log('🚀 Running automatic checks...\n');
  window.testWebhookHealth();
  setTimeout(() => window.checkEmailResponses(), 1000);
};

// Auto-run when script loads
createMonitoringDashboard();

// Export for manual use
window.createMonitoringDashboard = createMonitoringDashboard;
