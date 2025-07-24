/**
 * Test script to verify email response functionality
 * This script tests the email response capture and storage system
 */

const LOCAL_URL = 'http://localhost:3000';

// Test data for email responses
const TEST_EMAIL_RESPONSE = {
  questionId: '00a9950e-cb1a-4352-ab44-572c83c149ba', // Use a real question ID from your database
  storyId: '4e52186a-5e68-45e9-a14b-3e106d200b3f', // Use a real story ID from your database
  teamMemberEmail: 'test@example.com',
  responseContent: 'Dit is een test antwoord op de vraag. Ik herinner me dat dit gebeurde in 1985 toen ik nog jong was...',
  emailMessageId: 'test-email-message-id-12345'
};

async function testEmailResponseSystem() {
  console.log('📧 Testing Email Response System...');
  console.log('=========================================');

  try {
    // Test 1: Check if the API endpoint exists
    console.log('\n🔍 Test 1: Checking email responses API endpoint...');
    const pingResponse = await fetch(`${LOCAL_URL}/api/questions/email-responses`);
    console.log('📍 API Status:', pingResponse.status);
    
    if (pingResponse.status === 405) {
      console.log('✅ API endpoint exists (method not allowed is expected for GET without params)');
    }

    // Test 2: Save a test email response
    console.log('\n💾 Test 2: Saving test email response...');
    const saveResponse = await fetch(`${LOCAL_URL}/api/questions/email-responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_EMAIL_RESPONSE),
    });

    const saveResult = await saveResponse.text();
    console.log('💾 Save Response Status:', saveResponse.status);
    console.log('💾 Save Response Body:', saveResult);

    let savedResponseId = null;
    try {
      const saveData = JSON.parse(saveResult);
      if (saveData.success && saveData.responseId) {
        savedResponseId = saveData.responseId;
        console.log('✅ Email response saved successfully with ID:', savedResponseId);
      }
    } catch (e) {
      console.log('⚠️ Could not parse save response as JSON');
    }

    // Test 3: Retrieve email responses for the question
    console.log('\n📋 Test 3: Retrieving email responses...');
    const getResponse = await fetch(`${LOCAL_URL}/api/questions/email-responses?questionId=${TEST_EMAIL_RESPONSE.questionId}`);
    const getResult = await getResponse.text();
    console.log('📋 Get Response Status:', getResponse.status);
    console.log('📋 Get Response Body:', getResult);

    // Test 4: Retrieve email responses for the story
    console.log('\n📚 Test 4: Retrieving email responses by story...');
    const getStoryResponse = await fetch(`${LOCAL_URL}/api/questions/email-responses?storyId=${TEST_EMAIL_RESPONSE.storyId}`);
    const getStoryResult = await getStoryResponse.text();
    console.log('📚 Story Response Status:', getStoryResponse.status);
    console.log('📚 Story Response Body:', getStoryResult);

    // Test 5: Update response status (if we have a response ID)
    if (savedResponseId) {
      console.log('\n🔄 Test 5: Updating response status...');
      const updateResponse = await fetch(`${LOCAL_URL}/api/questions/email-responses`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responseId: savedResponseId,
          status: 'reviewed'
        }),
      });

      const updateResult = await updateResponse.text();
      console.log('🔄 Update Response Status:', updateResponse.status);
      console.log('🔄 Update Response Body:', updateResult);
    }

    // Test 6: Test the email webhook endpoint
    console.log('\n📨 Test 6: Testing email webhook...');
    const webhookResponse = await fetch(`${LOCAL_URL}/api/email/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: { email: TEST_EMAIL_RESPONSE.teamMemberEmail, name: 'Test User' },
        to: [{ email: 'info@write-my-story.com' }],
        subject: 'Re: Vraag voor je verhaal - WriteMyStory',
        text: `${TEST_EMAIL_RESPONSE.responseContent}\n\nID: ${TEST_EMAIL_RESPONSE.questionId}`,
        'message-id': TEST_EMAIL_RESPONSE.emailMessageId
      }),
    });

    const webhookResult = await webhookResponse.text();
    console.log('📨 Webhook Response Status:', webhookResponse.status);
    console.log('📨 Webhook Response Body:', webhookResult);

    console.log('\n✅ All email response tests completed!');
    console.log('\n📋 Summary:');
    console.log('- API endpoint availability: Tested');
    console.log('- Saving email responses: Tested');
    console.log('- Retrieving email responses: Tested');
    console.log('- Updating response status: Tested');
    console.log('- Email webhook processing: Tested');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Test the email webhook GET endpoint
async function testEmailWebhookGet() {
  console.log('\n🌐 Testing Email Webhook GET endpoint...');
  try {
    const response = await fetch(`${LOCAL_URL}/api/email/webhook`);
    const result = await response.text();
    console.log('🌐 Webhook GET Status:', response.status);
    console.log('🌐 Webhook GET Response:', result);
  } catch (error) {
    console.error('❌ Webhook GET test failed:', error);
  }
}

// Run all tests
async function runAllTests() {
  await testEmailResponseSystem();
  await testEmailWebhookGet();
  console.log('\n🏁 All tests completed!');
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testEmailResponseSystem,
    testEmailWebhookGet,
    runAllTests,
    TEST_EMAIL_RESPONSE
  };
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests();
}
