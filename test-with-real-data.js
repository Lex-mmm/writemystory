/**
 * Email Response Integration Test
 * Use this after you have created a project with questions and team members
 */

const LOCAL_URL = 'http://localhost:3001';

// REPLACE THESE WITH YOUR REAL IDs FROM THE WEBSITE
const REAL_TEST_DATA = {
  questionId: 'REPLACE_WITH_REAL_QUESTION_ID',    // Get from your project dashboard
  storyId: 'REPLACE_WITH_REAL_STORY_ID',          // Get from your project URL
  teamMemberEmail: 'REPLACE_WITH_REAL_EMAIL',     // Email of team member you added
  teamMemberName: 'REPLACE_WITH_REAL_NAME'        // Name of team member you added
};

async function testWithRealData() {
  console.log('🎯 Testing Email Response with Real Data');
  console.log('========================================');
  console.log('Using data:', REAL_TEST_DATA);
  
  // Test 1: Save an email response
  console.log('\n📧 Step 1: Saving email response...');
  const emailResponse = {
    questionId: REAL_TEST_DATA.questionId,
    storyId: REAL_TEST_DATA.storyId,
    teamMemberEmail: REAL_TEST_DATA.teamMemberEmail,
    responseContent: 'Dit is mijn antwoord op de vraag. Ik herinner me dat dit gebeurde in 1985 toen ik 20 jaar oud was. Het was een bijzondere tijd in mijn leven...',
    emailMessageId: `test-email-${Date.now()}`
  };
  
  try {
    const saveResponse = await fetch(`${LOCAL_URL}/api/questions/email-responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailResponse)
    });
    
    const saveResult = await saveResponse.json();
    console.log('💾 Save Status:', saveResponse.status);
    console.log('💾 Save Result:', saveResult);
    
    if (saveResult.success) {
      console.log('✅ Email response saved successfully!');
      console.log('📝 Response ID:', saveResult.responseId);
      
      // Test 2: Retrieve the response
      console.log('\n📋 Step 2: Retrieving saved response...');
      const getResponse = await fetch(`${LOCAL_URL}/api/questions/email-responses?questionId=${REAL_TEST_DATA.questionId}`);
      const getResult = await getResponse.json();
      
      console.log('📖 Retrieved responses:', getResult.responses?.length || 0);
      if (getResult.responses?.length > 0) {
        console.log('✅ Response successfully retrieved!');
        console.log('📝 Response content preview:', getResult.responses[0].response_content.substring(0, 50) + '...');
      }
      
      // Test 3: Update response status
      console.log('\n🔄 Step 3: Updating response status...');
      const updateResponse = await fetch(`${LOCAL_URL}/api/questions/email-responses`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responseId: saveResult.responseId,
          status: 'reviewed'
        })
      });
      
      const updateResult = await updateResponse.json();
      console.log('🔄 Update Status:', updateResponse.status);
      console.log('🔄 Update Result:', updateResult);
      
    } else {
      console.log('❌ Failed to save email response:', saveResult.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  // Test 4: Test question tracking
  console.log('\n📊 Step 4: Testing question tracking...');
  try {
    const trackingResponse = await fetch(`${LOCAL_URL}/api/questions/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId: REAL_TEST_DATA.questionId,
        teamMemberName: REAL_TEST_DATA.teamMemberName,
        method: 'email',
        storyId: REAL_TEST_DATA.storyId
      })
    });
    
    const trackingResult = await trackingResponse.json();
    console.log('📊 Tracking Status:', trackingResponse.status);
    console.log('📊 Tracking Result:', trackingResult);
    
    if (trackingResult.success) {
      console.log('✅ Question tracking saved successfully!');
    }
    
  } catch (error) {
    console.error('❌ Tracking test failed:', error);
  }
}

// Instructions for getting real data
function showInstructions() {
  console.log('📖 HOW TO GET REAL TEST DATA:');
  console.log('============================');
  console.log('1. Visit http://localhost:3001');
  console.log('2. Create a new project/story');
  console.log('3. Generate some questions');
  console.log('4. Add a team member with email');
  console.log('5. Copy the IDs from:');
  console.log('   - Question ID: Look in browser dev tools network tab');
  console.log('   - Story ID: Check the URL of your project page');
  console.log('   - Team member: Use the email/name you added');
  console.log('6. Update REAL_TEST_DATA above with actual values');
  console.log('7. Run this script again');
  console.log('\n🔍 To find IDs:');
  console.log('   - Open browser dev tools (F12)');
  console.log('   - Go to Network tab');
  console.log('   - Refresh your project page');
  console.log('   - Look for API calls to see the IDs');
}

// Check if user has updated the test data
if (REAL_TEST_DATA.questionId === 'REPLACE_WITH_REAL_QUESTION_ID') {
  showInstructions();
} else {
  testWithRealData();
}
