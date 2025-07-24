// Complete diagnostic to see why email replies aren't showing
const fullDiagnostic = async () => {
  console.log('🔍 Complete Email Replies Diagnostic...\n');
  
  try {
    // 1. Check if we're on the right page
    const currentUrl = window.location.href;
    console.log(`📍 Current URL: ${currentUrl}`);
    
    if (!currentUrl.includes('/project/')) {
      console.log('❌ You need to be on a project dashboard page');
      console.log('💡 Go to: http://localhost:3002/project/[your-project-id]');
      return;
    }
    
    const projectMatch = currentUrl.match(/project\/([a-f0-9-]+)/);
    if (!projectMatch) {
      console.log('❌ Invalid project URL format');
      return;
    }
    
    const projectId = projectMatch[1];
    console.log(`📚 Project ID: ${projectId}`);
    
    // 2. Check if emailResponses state exists in the page
    console.log('\n🔍 Checking page state...');
    
    // Try to find React components with email responses
    const reactFiberKey = Object.keys(document.querySelector('body')).find(key => key.startsWith('__reactFiber'));
    if (reactFiberKey) {
      console.log('✅ React is loaded');
    } else {
      console.log('❌ React not found');
    }
    
    // 3. Check API endpoints
    console.log('\n🌐 Testing API endpoints...');
    
    // Test questions API
    console.log('📋 Testing questions API...');
    const questionsResponse = await fetch(`/api/questions?storyId=${projectId}`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (questionsResponse.ok) {
      const questionsData = await questionsResponse.json();
      console.log(`✅ Questions API working - ${questionsData.questions?.length || 0} questions found`);
      
      if (questionsData.questions && questionsData.questions.length > 0) {
        const firstQuestion = questionsData.questions[0];
        console.log(`   First question: "${firstQuestion.question.substring(0, 50)}..."`);
        console.log(`   Question ID: ${firstQuestion.id}`);
        
        // 4. Test email responses API for this question
        console.log('\n📧 Testing email responses API...');
        const responsesResponse = await fetch(`/api/questions/email-responses?questionId=${firstQuestion.id}`);
        
        if (responsesResponse.ok) {
          const responsesData = await responsesResponse.json();
          console.log(`✅ Email responses API working - ${responsesData.responses?.length || 0} responses found`);
          
          if (responsesData.responses && responsesData.responses.length > 0) {
            console.log('\n📧 Email responses found in database:');
            for (const response of responsesData.responses) {
              console.log(`   • From: ${response.team_member_name}`);
              console.log(`     Content: "${response.response_content.substring(0, 60)}..."`);
              console.log(`     Status: ${response.status}`);
              console.log(`     Created: ${response.created_at}`);
            }
            
            console.log('\n🤔 Responses exist but not showing in UI. Possible issues:');
            console.log('   1. Frontend not fetching email responses');
            console.log('   2. State not updating correctly');
            console.log('   3. UI rendering logic has a bug');
            
            // 5. Check if the UI elements exist
            console.log('\n🎨 Checking UI elements...');
            const questionElements = document.querySelectorAll('[class*="border-gray-200"]');
            console.log(`   Found ${questionElements.length} potential question containers`);
            
            const emailBadges = document.querySelectorAll('span:contains("📧")');
            console.log(`   Found ${emailBadges.length} email badges`);
            
            const responseDivs = document.querySelectorAll('[class*="bg-blue-50"]');
            console.log(`   Found ${responseDivs.length} potential response containers`);
            
          } else {
            console.log('\n📭 No email responses found in database');
            console.log('💡 Let\'s add a test response...');
            
            // Add a test response
            const testResponse = {
              questionId: firstQuestion.id,
              storyId: projectId,
              teamMemberName: 'Test Oma',
              responseContent: 'Dit is een test reactie om te controleren of de email responses correct worden weergegeven in het dashboard.',
              senderEmail: 'test@familie.nl',
              status: 'received'
            };
            
            const addResponse = await fetch('/api/questions/email-responses', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(testResponse)
            });
            
            if (addResponse.ok) {
              console.log('✅ Test response added! Refreshing page...');
              setTimeout(() => window.location.reload(), 1000);
            } else {
              const errorText = await addResponse.text();
              console.log('❌ Failed to add test response:', errorText);
            }
          }
          
        } else {
          const errorText = await responsesResponse.text();
          console.log('❌ Email responses API failed:', errorText);
        }
        
      } else {
        console.log('📭 No questions found in this project');
        console.log('💡 Add some questions first');
      }
      
    } else {
      const errorText = await questionsResponse.text();
      console.log('❌ Questions API failed:', errorText);
    }
    
    // 6. Check if frontend code is correctly fetching email responses
    console.log('\n🔍 Frontend debugging suggestions:');
    console.log('1. Open browser DevTools → Network tab');
    console.log('2. Refresh the page');
    console.log('3. Look for calls to /api/questions/email-responses');
    console.log('4. Check if the calls are successful and returning data');
    console.log('5. Check browser Console for any JavaScript errors');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  }
};

// Instructions
console.log('🎯 EMAIL REPLIES TROUBLESHOOTING GUIDE:');
console.log('');
console.log('1. Go to your project dashboard: http://localhost:3002/project/[id]');
console.log('2. Open browser DevTools (F12)');
console.log('3. Go to Console tab');
console.log('4. Copy and paste this script');
console.log('5. Run: fullDiagnostic()');
console.log('');

// Auto-run if on project page
if (typeof window !== 'undefined' && window.location.href.includes('/project/')) {
  fullDiagnostic();
}
