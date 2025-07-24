/**
 * Script to get real question and story IDs for testing
 */

const LOCAL_URL = 'http://localhost:3001';

async function getRealTestData() {
  console.log('🔍 Getting real test data from your database...');
  console.log('================================================');

  try {
    // Try to get some real questions and stories
    console.log('\n📋 Checking for questions...');
    
    // This is a simple way to test - we'll use the existing project API
    const projectsResponse = await fetch(`${LOCAL_URL}/api/stories`);
    if (projectsResponse.ok) {
      const projectsData = await projectsResponse.json();
      console.log('📚 Projects/Stories found:', projectsData.success ? projectsData.stories?.length || 0 : 'Error');
      
      if (projectsData.success && projectsData.stories?.length > 0) {
        const firstStory = projectsData.stories[0];
        console.log('📖 First story ID:', firstStory.id);
        console.log('📖 Story name:', firstStory.person_name || 'Unknown');
        
        return {
          storyId: firstStory.id,
          userId: firstStory.user_id
        };
      }
    }
    
  } catch (error) {
    console.error('❌ Error getting test data:', error);
  }
  
  return null;
}

async function testWithRealData() {
  const testData = await getRealTestData();
  
  if (!testData) {
    console.log('❌ No real test data found. Please:');
    console.log('   1. Make sure your server is running');
    console.log('   2. Create a story/project first via the website');
    console.log('   3. Add some questions to that project');
    console.log('   4. Add team members to the project');
    return;
  }
  
  console.log('\n📋 Testing with real data:');
  console.log('Story ID:', testData.storyId);
  console.log('User ID:', testData.userId);
  
  // Now get questions for this story
  try {
    const questionsResponse = await fetch(`${LOCAL_URL}/api/questions?storyId=${testData.storyId}&userId=${testData.userId}`);
    const questionsData = await questionsResponse.json();
    
    console.log('📝 Questions API response:', questionsData.success ? 'Success' : 'Failed');
    
    if (questionsData.success && questionsData.questions?.length > 0) {
      const firstQuestion = questionsData.questions[0];
      console.log('❓ First question ID:', firstQuestion.id);
      console.log('❓ Question text:', firstQuestion.question?.substring(0, 50) + '...');
      
      // Test email response with real data
      console.log('\n📧 Testing email response with real data...');
      
      const realEmailResponse = {
        questionId: firstQuestion.id,
        storyId: testData.storyId,
        teamMemberEmail: 'test@example.com',
        responseContent: 'Dit is een echt test antwoord op deze vraag. Ik herinner me dit heel goed...',
        emailMessageId: `real-test-${Date.now()}`
      };
      
      const saveResponse = await fetch(`${LOCAL_URL}/api/questions/email-responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(realEmailResponse),
      });
      
      const saveResult = await saveResponse.text();
      console.log('💾 Real data save status:', saveResponse.status);
      console.log('💾 Real data save result:', saveResult);
      
    } else {
      console.log('❌ No questions found. Create some questions first via the website.');
    }
    
  } catch (error) {
    console.error('❌ Error testing with real data:', error);
  }
}

// Run the test
testWithRealData();
