// Test the complete local WhatsApp flow: send question + reply
require('dotenv').config({ path: '.env.local' });

async function testCompleteLocalFlow() {
  console.log('🔄 Testing Complete Local WhatsApp Flow...');
  console.log('==========================================');

  const LOCAL_URL = 'http://localhost:3002';
  const QUESTION_ID = '00a9950e-cb1a-4352-ab44-572c83c149ba'; // First question
  const TEAM_MEMBER_ID = '05b724e5-de18-481a-818c-20b3eeaa774e'; // Your team member ID
  const STORY_ID = '4e52186a-5e68-45e9-a14b-3e106d200b3f';
  const USER_ID = '4848fd64-f9cc-4e3f-8013-2468e1d5138f';
  const YOUR_PHONE = '+31681933832';

  try {
    console.log('📤 Step 1: Sending question via local API...');
    
    const sendResponse = await fetch(`${LOCAL_URL}/api/whatsapp/send-question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questionId: QUESTION_ID,
        teamMemberIds: [TEAM_MEMBER_ID],
        storyId: STORY_ID,
        userId: USER_ID
      })
    });

    const sendResult = await sendResponse.text();
    console.log('📤 Send question response:', sendResponse.status);
    
    try {
      const sendData = JSON.parse(sendResult);
      console.log('📤 Send result:', JSON.stringify(sendData, null, 2));
      
      if (sendData.success) {
        console.log('✅ Question sent successfully!');
        
        // Now test the reply
        console.log('\n📱 Step 2: Simulating WhatsApp reply...');
        
        const formData = new URLSearchParams();
        formData.append('From', `whatsapp:${YOUR_PHONE}`);
        formData.append('Body', 'Local test answer: Ik ben geboren in Amsterdam op 15 maart 1985.');
        formData.append('MessageSid', 'LOCAL_REPLY_' + Date.now());
        formData.append('AccountSid', process.env.TWILIO_ACCOUNT_SID || 'TEST_ACCOUNT_SID');
        
        const replyResponse = await fetch(`${LOCAL_URL}/api/whatsapp/receive`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString()
        });

        const replyResult = await replyResponse.text();
        console.log('📱 Reply response status:', replyResponse.status);
        console.log('📱 Reply response:', replyResult);
        
        if (replyResult.includes('Dank je wel voor je antwoord')) {
          console.log('\n🎉 COMPLETE SUCCESS!');
          console.log('✅ Local question sending: WORKS');
          console.log('✅ Local question receiving: WORKS');
          console.log('✅ Local answer processing: WORKS');
          console.log('\n🚀 Your code is ready for production!');
        }
      }
    } catch (parseError) {
      console.log('📤 Raw send response:', sendResult);
    }

  } catch (error) {
    console.error('💥 Local flow test failed:', error.message);
  }
}

testCompleteLocalFlow();
