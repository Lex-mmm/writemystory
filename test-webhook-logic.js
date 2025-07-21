// Test the exact logic that the WhatsApp webhook uses
require('dotenv').config({ path: '.env.local' });

async function testWebhookLogic() {
  console.log('🔍 Testing WhatsApp Webhook Logic...');
  console.log('=====================================');

  const PRODUCTION_URL = 'https://write-my-story.com';
  const YOUR_PHONE = '+31681933832';
  const TEST_MESSAGE = 'Test reply: This is my answer to the question';

  try {
    console.log('📱 Simulating WhatsApp message reception...');
    console.log('From phone:', YOUR_PHONE);
    console.log('Message:', TEST_MESSAGE);
    
    // Create the form data that Twilio would send
    const formData = new URLSearchParams();
    formData.append('From', `whatsapp:${YOUR_PHONE}`);
    formData.append('Body', TEST_MESSAGE);
    formData.append('MessageSid', 'TEST_MESSAGE_SID_' + Date.now());
    formData.append('AccountSid', process.env.TWILIO_ACCOUNT_SID || 'TEST_ACCOUNT_SID');
    
    console.log('\n📤 Sending to webhook endpoint...');
    
    const response = await fetch(`${PRODUCTION_URL}/api/whatsapp/receive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });

    const responseText = await response.text();
    
    console.log('\n📋 Response Status:', response.status);
    console.log('📋 Response Body:');
    console.log(responseText);
    
    // Try to parse as TwiML
    if (responseText.includes('<Message>')) {
      console.log('\n📱 TwiML Response detected');
      const messageMatch = responseText.match(/<Message>(.*?)<\/Message>/);
      if (messageMatch) {
        console.log('Reply message:', messageMatch[1]);
        
        if (messageMatch[1].includes('geen openstaande vraag')) {
          console.log('\n❌ ISSUE: "No open question" error detected');
          console.log('This means the findLatestQuestionForTeamMember function is not finding the question');
        } else {
          console.log('\n✅ SUCCESS: Question was found and answer processed');
        }
      }
    }

  } catch (error) {
    console.error('💥 Webhook test failed:', error.message);
  }
}

testWebhookLogic();
