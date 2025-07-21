// Local WhatsApp testing setup
require('dotenv').config({ path: '.env.local' });

async function testLocalWhatsApp() {
  console.log('🏠 Testing WhatsApp Integration Locally...');
  console.log('==========================================');

  const LOCAL_URL = 'http://localhost:3002';
  const YOUR_PHONE = '+31681933832';
  const TEST_MESSAGE = 'Local test: This is my answer to the question';

  try {
    console.log('📋 Testing local webhook endpoint...');
    console.log('Local URL:', LOCAL_URL);
    console.log('From phone:', YOUR_PHONE);
    console.log('Message:', TEST_MESSAGE);
    
    // Create the form data that Twilio would send
    const formData = new URLSearchParams();
    formData.append('From', `whatsapp:${YOUR_PHONE}`);
    formData.append('Body', TEST_MESSAGE);
    formData.append('MessageSid', 'LOCAL_TEST_' + Date.now());
    formData.append('AccountSid', process.env.TWILIO_ACCOUNT_SID || 'TEST_ACCOUNT_SID');
    
    console.log('\n📤 Sending to local webhook endpoint...');
    
    const response = await fetch(`${LOCAL_URL}/api/whatsapp/receive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });

    const responseText = await response.text();
    
    console.log('\n📋 Local Response Status:', response.status);
    console.log('📋 Local Response Body:');
    console.log(responseText);
    
    // Parse the response
    if (responseText.includes('<Message>')) {
      console.log('\n📱 TwiML Response detected');
      const messageMatch = responseText.match(/<Message>(.*?)<\/Message>/);
      if (messageMatch) {
        console.log('Reply message:', messageMatch[1]);
        
        if (messageMatch[1].includes('geen openstaande vraag')) {
          console.log('\n❌ LOCAL ISSUE: "No open question" error detected');
          console.log('The findLatestQuestionForTeamMember function is not finding the question locally');
          console.log('\n🔍 Debugging steps:');
          console.log('1. Check if local database has the same data as production');
          console.log('2. Verify team member exists locally');
          console.log('3. Check question data locally');
        } else if (messageMatch[1].includes('Bedankt voor je antwoord')) {
          console.log('\n🎉 LOCAL SUCCESS! Question matching is working locally!');
          console.log('✅ Your enhanced code is working correctly');
        } else {
          console.log('\n🤔 Unexpected response - investigating...');
        }
      }
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('\n❌ Local server not running!');
      console.log('Please start your Next.js development server:');
      console.log('npm run dev');
      console.log('\nThen run this test again.');
    } else {
      console.error('💥 Local webhook test failed:', error.message);
    }
  }
}

testLocalWhatsApp();
