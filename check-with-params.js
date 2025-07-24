// Check email responses with proper parameters
const checkWithParams = async () => {
  console.log('🔍 Checking Email Responses with Parameters...\n');
  
  try {
    // 1. First get projects to find valid IDs
    console.log('📚 Getting projects...');
    const projectsResponse = await fetch('http://localhost:3002/api/stories');
    
    if (!projectsResponse.ok) {
      console.log('❌ Failed to get projects');
      return;
    }
    
    const projectsData = await projectsResponse.json();
    console.log(`Found ${projectsData.stories?.length || 0} projects`);
    
    if (!projectsData.stories || projectsData.stories.length === 0) {
      console.log('📭 No projects found');
      console.log('💡 Create a project first at http://localhost:3002');
      return;
    }
    
    // 2. Get questions for the first project
    console.log('\n❓ Getting questions...');
    const questionsResponse = await fetch('http://localhost:3002/api/questions');
    
    if (!questionsResponse.ok) {
      console.log('❌ Failed to get questions');
      return;
    }
    
    const questionsData = await questionsResponse.json();
    console.log(`Found ${questionsData.questions?.length || 0} questions`);
    
    if (!questionsData.questions || questionsData.questions.length === 0) {
      console.log('📭 No questions found');
      console.log('💡 Add some questions to your project first');
      
      // Still test API with a story ID
      const firstStory = projectsData.stories[0];
      console.log(`\n🧪 Testing API with story ID: ${firstStory.id}`);
      
      const testResponse = await fetch(`http://localhost:3002/api/questions/email-responses?storyId=${firstStory.id}`);
      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log('✅ Email responses API is working!');
        console.log(`📧 Found ${testData.responses?.length || 0} email responses for this story`);
      } else {
        console.log('❌ API still not working:', await testResponse.text());
      }
      return;
    }
    
    // 3. Test with real question and story IDs
    const firstQuestion = questionsData.questions[0];
    const firstStory = projectsData.stories[0];
    
    console.log(`\n🧪 Testing API with:
    Question ID: ${firstQuestion.id}
    Story ID: ${firstStory.id}
    Question: "${firstQuestion.question.substring(0, 50)}..."`);
    
    // Test by question ID
    console.log('\n📧 Checking email responses by question ID...');
    const questionResponse = await fetch(`http://localhost:3002/api/questions/email-responses?questionId=${firstQuestion.id}`);
    
    if (questionResponse.ok) {
      const questionData = await questionResponse.json();
      console.log('✅ Email responses API is working!');
      console.log(`📧 Found ${questionData.responses?.length || 0} email responses for this question`);
      
      if (questionData.responses && questionData.responses.length > 0) {
        console.log('\n📋 Email responses found:');
        for (const response of questionData.responses) {
          console.log(`  • From: ${response.team_member_name} (${response.sender_email})`);
          console.log(`    Content: "${response.response_content.substring(0, 80)}..."`);
          console.log(`    Status: ${response.status}`);
          console.log(`    Date: ${new Date(response.created_at).toLocaleString()}`);
          console.log('');
        }
        
        console.log('🎯 These responses should appear in your dashboard at:');
        console.log(`   http://localhost:3002/project/${firstQuestion.story_id}`);
      } else {
        console.log('📭 No email responses stored yet');
        console.log('\n💡 To add a test response, I can create one for you!');
      }
    } else {
      console.log('❌ API error:', await questionResponse.text());
    }
    
    // Test by story ID
    console.log('\n📚 Checking email responses by story ID...');
    const storyResponse = await fetch(`http://localhost:3002/api/questions/email-responses?storyId=${firstStory.id}`);
    
    if (storyResponse.ok) {
      const storyData = await storyResponse.json();
      console.log(`📧 Found ${storyData.responses?.length || 0} total email responses for this story`);
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
};

checkWithParams();
