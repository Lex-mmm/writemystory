// Run this in browser console on your project dashboard to test
const testEmailResponsesAfterFix = async () => {
  console.log('🧪 Testing Email Responses After Frontend Fix...\n');
  
  // Check current URL
  const currentUrl = window.location.href;
  if (!currentUrl.includes('/project/')) {
    console.log('❌ Run this on a project dashboard page');
    return;
  }
  
  const projectMatch = currentUrl.match(/project\/([a-f0-9-]+)/);
  const projectId = projectMatch[1];
  
  console.log(`📚 Project ID: ${projectId}`);
  
  // Add test response
  const testResponse = {
    questionId: 'test-question-id', // We'll get real ID from API
    storyId: projectId,
    teamMemberName: 'Frontend Test',
    responseContent: 'Dit is een test om te controleren of de frontend fix werkt. Als je dit ziet, dan laadt het dashboard nu correct email responses!',
    senderEmail: 'test@fix.nl',
    status: 'received'
  };
  
  // First get questions
  try {
    const questionsResponse = await fetch(`/api/questions?storyId=${projectId}`);
    if (questionsResponse.ok) {
      const questionsData = await questionsResponse.json();
      if (questionsData.questions && questionsData.questions.length > 0) {
        testResponse.questionId = questionsData.questions[0].id;
        
        // Add the test response
        const addResponse = await fetch('/api/questions/email-responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testResponse)
        });
        
        if (addResponse.ok) {
          console.log('✅ Test response added! Refreshing in 2 seconds...');
          console.log('👀 Look for: "📧 1 reactie" badge and blue response box');
          setTimeout(() => window.location.reload(), 2000);
        } else {
          console.log('❌ Failed to add test response');
        }
      }
    }
  } catch (error) {
    console.log('❌ Error:', error);
  }
};

console.log('🔧 FRONTEND FIX APPLIED!');
console.log('');
console.log('The frontend now properly loads email responses.');
console.log('Refresh the page and check Network tab for /api/questions/email-responses calls');
console.log('');
console.log('To test: testEmailResponsesAfterFix()');

// Auto-run test
testEmailResponsesAfterFix();
