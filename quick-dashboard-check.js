// Quick Dashboard Check - Run this in your browser console on the project dashboard page
// This will show you the current state of questions and email responses

async function quickDashboardCheck() {
  console.log('🔍 QUICK DASHBOARD CHECK');
  console.log('======================');
  
  // Get project ID from URL
  const projectId = window.location.pathname.split('/').pop();
  console.log(`📁 Project ID: ${projectId}`);
  
  try {
    // 1. Check questions
    console.log('\n📋 CHECKING QUESTIONS...');
    const questionsResponse = await fetch(`/api/questions?storyId=${projectId}`);
    const questionsData = await questionsResponse.json();
    
    if (questionsData.success) {
      console.log(`✅ Found ${questionsData.questions.length} questions`);
      
      // Show first few questions with their IDs
      questionsData.questions.slice(0, 5).forEach((q, i) => {
        console.log(`   ${i + 1}. "${q.question.substring(0, 60)}..."`);
        console.log(`      📋 ID: ${q.id}`);
        console.log(`      💬 Answer: ${q.answer ? `"${q.answer.substring(0, 40)}..."` : 'No answer yet'}`);
      });
    } else {
      console.log('❌ No questions found');
      return;
    }
    
    // 2. Check email responses  
    console.log('\n📧 CHECKING EMAIL RESPONSES...');
    const emailResponse = await fetch(`/api/questions/email-responses?storyId=${projectId}`);
    const emailData = await emailResponse.json();
    
    if (emailData.success) {
      console.log(`✅ Found ${emailData.responses.length} email responses`);
      
      if (emailData.responses.length > 0) {
        emailData.responses.forEach((response, i) => {
          console.log(`   ${i + 1}. From: ${response.team_member_name}`);
          console.log(`      📋 Question ID: ${response.question_id}`);
          console.log(`      💬 Content: "${response.response_content.substring(0, 60)}..."`);
          console.log(`      📅 Date: ${new Date(response.created_at).toLocaleString()}`);
        });
      } else {
        console.log('📝 No email responses yet');
      }
    } else {
      console.log('❌ Failed to fetch email responses');
    }
    
    // 3. Test webhook status
    console.log('\n🔗 CHECKING WEBHOOK STATUS...');
    try {
      const webhookTest = await fetch('/api/email/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'email.received',
          data: {
            from: { email: 'test@example.com' },
            subject: `Test - Question ID: ${questionsData.questions[0]?.id || 'no-question'}`,
            html: 'This is a test email response to check webhook functionality'
          }
        })
      });
      
      if (webhookTest.ok) {
        console.log('✅ Webhook endpoint is responding');
      } else {
        console.log(`⚠️ Webhook status: ${webhookTest.status}`);
      }
    } catch (error) {
      console.log('❌ Webhook test failed:', error.message);
    }
    
    console.log('\n💡 SUMMARY:');
    console.log('- Questions loaded:', questionsData.questions.length > 0 ? '✅' : '❌');
    console.log('- Email responses loaded:', emailData.responses.length > 0 ? '✅' : '❌');
    console.log('- To test: Send a real email question and reply to it');
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

// Run the check
quickDashboardCheck();
