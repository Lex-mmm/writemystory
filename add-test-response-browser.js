// Test script to add email responses through the dashboard
// Copy this code and run it in your browser's console while on the dashboard page

const addTestEmailResponse = async () => {
  console.log('🧪 Adding Test Email Response...');
  
  try {
    // Get current URL to extract project ID
    const currentUrl = window.location.href;
    const projectMatch = currentUrl.match(/project\/([a-f0-9-]+)/);
    
    if (!projectMatch) {
      console.log('❌ Please run this on a project dashboard page (http://localhost:3002/project/[id])');
      return;
    }
    
    const projectId = projectMatch[1];
    console.log(`📚 Project ID: ${projectId}`);
    
    // Get questions for this project
    console.log('❓ Getting questions...');
    const questionsResponse = await fetch(`/api/questions?storyId=${projectId}`);
    
    if (!questionsResponse.ok) {
      console.log('❌ Failed to get questions');
      return;
    }
    
    const questionsData = await questionsResponse.json();
    
    if (!questionsData.questions || questionsData.questions.length === 0) {
      console.log('📭 No questions found. Add some questions to this project first.');
      return;
    }
    
    const firstQuestion = questionsData.questions[0];
    console.log(`🎯 Using question: "${firstQuestion.question.substring(0, 50)}..."`);
    
    // Add test email response
    const testResponse = {
      questionId: firstQuestion.id,
      storyId: projectId,
      teamMemberName: 'Oma Gertrude',
      responseContent: `Wat een prachtige vraag! 

Ik herinner me dat verhaal nog heel goed. Het was in de zomer van 1973, en de hele familie was bij elkaar. Opa had net zijn nieuwe auto gekocht - een blauwe Volkswagen Kever - en we waren allemaal zo trots!

Die dag reden we naar het strand in Zandvoort. Ik had mijn beste jurk aan, die met de bloemetjes, en jij was nog zo klein. Je wilde per se zandkastelen bouwen, maar de golven spoelden ze steeds weg. Dat vond je zo grappig!

's Avonds aten we poffertjes bij dat kraampje op de boulevard. Jij kreeg suikerpoeder op je neus en we hebben zo gelachen. Dat zijn de momenten die je nooit vergeet.

Ik hoop dat dit helpt voor het verhaal. Er zijn nog zoveel meer verhalen te vertellen!

Liefs,
Oma Gertrude`,
      senderEmail: 'gertrude@familie.nl',
      status: 'received'
    };
    
    console.log('📧 Adding email response...');
    const addResponse = await fetch('/api/questions/email-responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testResponse)
    });
    
    if (addResponse.ok) {
      const result = await addResponse.json();
      console.log('✅ Test email response added successfully!');
      console.log(`📧 Response ID: ${result.response.id}`);
      
      // Refresh the page to see the response
      console.log('🔄 Refreshing page to show the new response...');
      window.location.reload();
      
    } else {
      const error = await addResponse.text();
      console.log('❌ Failed to add response:', error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

// Instructions
console.log(`
🎯 TO SEE EMAIL REPLIES IN YOUR DASHBOARD:

1. Go to: http://localhost:3002/project/[your-project-id]
2. Make sure you have at least one question in the project
3. Open browser Developer Tools (F12)
4. Go to Console tab
5. Copy and paste this entire script
6. Run: addTestEmailResponse()

This will add a test email response that you'll see immediately below the question!
`);

// Auto-run if we're on the right page
if (typeof window !== 'undefined' && window.location.href.includes('/project/')) {
  addTestEmailResponse();
}
