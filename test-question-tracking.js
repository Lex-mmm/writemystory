/**
 * Test script to verify question tracking functionality
 * This script tests the new tracking API endpoints
 */

const LOCAL_URL = 'http://localhost:3000';

// Test data
const TEST_DATA = {
  questionId: 'test-question-id-123',
  storyId: 'test-story-id-456', 
  teamMemberName: 'Test Member',
  method: 'email',
  responseContent: 'This is a test email response to the question.'
};

async function testQuestionTracking() {
  console.log('🧪 Testing Question Tracking API...');
  console.log('=====================================');

  try {
    // Test 1: Save tracking data
    console.log('\n📊 Test 1: Saving tracking data...');
    const trackingResponse = await fetch(`${LOCAL_URL}/api/questions/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questionId: TEST_DATA.questionId,
        teamMemberName: TEST_DATA.teamMemberName,
        method: TEST_DATA.method,
        storyId: TEST_DATA.storyId,
      }),
    });

    const trackingResult = await trackingResponse.text();
    console.log('📊 Tracking Response Status:', trackingResponse.status);
    console.log('📊 Tracking Response:', trackingResult);

    // Test 2: Get tracking data
    console.log('\n📋 Test 2: Getting tracking data...');
    const getTrackingResponse = await fetch(`${LOCAL_URL}/api/questions/track?questionId=${TEST_DATA.questionId}`);
    const getTrackingResult = await getTrackingResponse.text();
    console.log('📋 Get Tracking Status:', getTrackingResponse.status);
    console.log('📋 Get Tracking Response:', getTrackingResult);

    // Test 3: Save email response
    console.log('\n📧 Test 3: Saving email response...');
    const emailResponse = await fetch(`${LOCAL_URL}/api/questions/email-responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questionId: TEST_DATA.questionId,
        storyId: TEST_DATA.storyId,
        teamMemberEmail: 'test@example.com',
        responseContent: TEST_DATA.responseContent,
        emailMessageId: 'test-email-id-123',
      }),
    });

    const emailResult = await emailResponse.text();
    console.log('📧 Email Response Status:', emailResponse.status);
    console.log('📧 Email Response:', emailResult);

    // Test 4: Get email responses
    console.log('\n📮 Test 4: Getting email responses...');
    const getEmailResponse = await fetch(`${LOCAL_URL}/api/questions/email-responses?questionId=${TEST_DATA.questionId}`);
    const getEmailResult = await getEmailResponse.text();
    console.log('📮 Get Email Status:', getEmailResponse.status);
    console.log('📮 Get Email Response:', getEmailResult);

    console.log('\n✅ All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testQuestionTracking();
}

module.exports = { testQuestionTracking };
