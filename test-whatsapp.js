// Test script for WhatsApp integration
// Run with: node test-whatsapp.js

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

async function testWhatsAppMessage() {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
    console.error('❌ Missing Twilio environment variables');
    console.log('Required:');
    console.log('- TWILIO_ACCOUNT_SID');
    console.log('- TWILIO_AUTH_TOKEN');
    console.log('- TWILIO_WHATSAPP_NUMBER');
    return;
  }

  const testPhoneNumber = 'whatsapp:+31612345678'; // Replace with your phone number
  const testMessage = 'Test message from WriteMyStory.ai! 🎉';

  try {
    const body = new URLSearchParams();
    body.append('From', TWILIO_WHATSAPP_NUMBER);
    body.append('To', testPhoneNumber);
    body.append('Body', testMessage);

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('✅ WhatsApp message sent successfully!');
      console.log('Message SID:', data.sid);
    } else {
      const error = await response.text();
      console.error('❌ Failed to send message:', error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Test configuration
console.log('🧪 Testing WhatsApp Integration...');
console.log('Account SID:', TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing');
console.log('Auth Token:', TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing');
console.log('WhatsApp Number:', TWILIO_WHATSAPP_NUMBER || '❌ Missing');

testWhatsAppMessage();
