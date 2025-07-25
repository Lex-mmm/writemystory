// DEBUG FALLBACK LOGIC - Test if recent questions lookup is working
// Copy and paste this in your browser console on the project page

async function debugFallbackLogic() {
  console.log('🔍 DEBUGGING FALLBACK LOGIC');
  console.log('============================');
  
  const projectId = window.location.pathname.split('/').pop();
  console.log(`📁 Project ID: ${projectId}`);
  
  // Get user ID
  let userId = null;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes('auth-token')) {
      try {
        const item = JSON.parse(localStorage.getItem(key) || '{}');
        if (item.user && item.user.id) {
          userId = item.user.id;
          break;
        }
      } catch (e) {}
    }
  }
  
  if (!userId) {
    console.log('❌ Could not find user ID');
    return;
  }
  
  try {
    // Check questions in this story
    console.log('\n📋 Checking all questions in this story...');
    const questionsResponse = await fetch(`/api/questions?storyId=${projectId}&userId=${userId}`);
    const questionsData = await questionsResponse.json();
    
    if (questionsData.success && questionsData.questions) {
      console.log(`✅ Found ${questionsData.questions.length} questions:`);
      questionsData.questions.forEach((q, idx) => {
        console.log(`   ${idx + 1}. ID: ${q.id}`);
        console.log(`      Question: "${q.question.substring(0, 60)}..."`);
        console.log(`      Sent at: ${q.sent_at || 'Not sent'}`);
        console.log(`      Status: ${q.sent_at ? 'SENT' : 'NOT SENT'}`);
      });
      
      // Check if any questions were sent in the last week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const recentQuestions = questionsData.questions.filter(q => 
        q.sent_at && new Date(q.sent_at) > oneWeekAgo
      );
      
      console.log(`\n📅 Questions sent in the last 7 days: ${recentQuestions.length}`);
      if (recentQuestions.length > 0) {
        recentQuestions.forEach((q, idx) => {
          console.log(`   ${idx + 1}. ${q.id} - "${q.question.substring(0, 40)}..." (${q.sent_at})`);
        });
      } else {
        console.log('⚠️ NO QUESTIONS SENT IN THE LAST 7 DAYS!');
        console.log('This explains why the fallback logic is not finding questions.');
        console.log('The webhook looks for questions sent within the last week.');
      }
    }
    
    // Check team members
    console.log('\n👥 Checking team members...');
    const teamResponse = await fetch(`/api/team-members?storyId=${projectId}&userId=${userId}`);
    const teamData = await teamResponse.json();
    
    if (teamData.success && teamData.teamMembers) {
      console.log(`✅ Found ${teamData.teamMembers.length} team members:`);
      teamData.teamMembers.forEach((member, idx) => {
        console.log(`   ${idx + 1}. ${member.name} (${member.email}) - ID: ${member.id}`);
      });
    }
    
    // Test the exact same logic the webhook uses
    console.log('\n🔧 Testing webhook logic manually...');
    const testMember = teamData.teamMembers[0];
    
    // Simulate what the webhook does: mark a question as sent first
    const testQuestion = questionsData.questions[0];
    console.log(`📤 Marking question as sent: ${testQuestion.id}`);
    
    // Mark the question as sent so it appears in recent questions
    const markSentResponse = await fetch(`/api/questions/${testQuestion.id}/mark-sent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (markSentResponse.ok) {
      console.log('✅ Question marked as sent successfully');
      
      // Now test the fallback logic
      console.log('\n🔄 Testing fallback logic again...');
      
      const timestamp = Date.now();
      const testEmail = {
        type: 'email.received',
        data: {
          from: { 
            email: testMember.email, 
            name: testMember.name 
          },
          to: [{ email: 'info@write-my-story.com' }],
          subject: `Re: Vraag voor je verhaal - WriteMyStory`,
          text: `Dit is een test na het markeren van de vraag als verzonden.

Henk`,
          html: null,
          'message-id': `<fallback-test-after-sent-${timestamp}@email.client>`
        }
      };
      
      console.log('📤 Sending test email after marking question as sent...');
      const webhookResponse = await fetch('/api/email/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testEmail)
      });
      
      const webhookData = await webhookResponse.json();
      console.log(`📊 Status: ${webhookResponse.status}`);
      console.log(`✅ Success: ${webhookData.success}`);
      console.log(`🆔 Response ID: ${webhookData.responseId}`);
      console.log(`❓ Question ID: ${webhookData.questionId || 'Still not found'}`);
      console.log(`📚 Story ID: ${webhookData.storyId}`);
      
      if (webhookData.questionId) {
        console.log('🎉 SUCCESS! Fallback logic works when questions are marked as sent!');
      } else {
        console.log('❌ Fallback logic still not working even after marking question as sent');
      }
      
    } else {
      console.log('❌ Failed to mark question as sent');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the fallback debug
debugFallbackLogic();
