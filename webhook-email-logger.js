// WEBHOOK EMAIL LOGGER - Check what real emails look like
// This will help us see the difference between test emails and real emails

// First, let's check the recent webhook logs on the server
async function checkRecentWebhookActivity() {
  console.log('🔍 CHECKING RECENT WEBHOOK ACTIVITY');
  console.log('===================================');
  
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
    // Check all recent email responses
    console.log('\n📧 Getting all recent email responses...');
    const responsesUrl = `/api/questions/email-responses?storyId=${projectId}`;
    console.log(`🔗 URL: ${responsesUrl}`);
    
    const response = await fetch(responsesUrl);
    console.log(`📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Success: ${data.success}`);
      console.log(`📧 Total responses: ${data.responses?.length || 0}`);
      
      if (data.responses && data.responses.length > 0) {
        console.log('\n📋 Recent Email Responses:');
        console.log('=========================');
        
        data.responses.forEach((resp, idx) => {
          console.log(`\n${idx + 1}. Response ID: ${resp.id}`);
          console.log(`   📅 Created: ${resp.created_at}`);
          console.log(`   👤 Team Member: ${resp.team_member_name} (ID: ${resp.team_member_id})`);
          console.log(`   📧 Email: ${resp.sender_email}`);
          console.log(`   ❓ Question ID: ${resp.question_id}`);
          console.log(`   📚 Story ID: ${resp.story_id}`);
          console.log(`   📨 Message ID: ${resp.email_message_id}`);
          console.log(`   🔄 Status: ${resp.status}`);
          console.log(`   📝 Content Preview: "${resp.response_content?.substring(0, 100)}..."`);
          
          // Check if this looks like a test vs real email
          if (resp.response_content?.includes('TEST') || resp.response_content?.includes('Debug')) {
            console.log(`   🧪 Type: TEST EMAIL`);
          } else {
            console.log(`   🌐 Type: REAL EMAIL`);
          }
        });
        
        // Count test vs real emails
        const testEmails = data.responses.filter(r => 
          r.response_content?.includes('TEST') || 
          r.response_content?.includes('Debug') ||
          r.response_content?.includes('Direct test')
        );
        const realEmails = data.responses.filter(r => 
          !r.response_content?.includes('TEST') && 
          !r.response_content?.includes('Debug') &&
          !r.response_content?.includes('Direct test')
        );
        
        console.log(`\n📊 SUMMARY:`);
        console.log(`   🧪 Test emails: ${testEmails.length}`);
        console.log(`   🌐 Real emails: ${realEmails.length}`);
        
        if (realEmails.length === 0) {
          console.log('\n⚠️ NO REAL EMAILS FOUND!');
          console.log('This suggests your real email reply might not have been processed by the webhook.');
          console.log('Possible reasons:');
          console.log('1. The email format is different from our test format');
          console.log('2. The question ID was not properly included in the email');
          console.log('3. The webhook failed to extract the question ID from the real email');
          console.log('4. The email was sent from a different email address than the team member');
        } else {
          console.log('\n✅ Found real emails! Let\'s analyze them...');
          realEmails.forEach((real, idx) => {
            console.log(`\nReal Email ${idx + 1}:`);
            console.log(`   Full Content: "${real.response_content}"`);
            console.log(`   Message ID: ${real.email_message_id}`);
          });
        }
        
      } else {
        console.log('❌ No email responses found at all');
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ API Error: ${errorText}`);
    }
    
    // Also check if there were any questions sent today
    console.log('\n📋 Checking recent questions...');
    const questionsResponse = await fetch(`/api/questions?storyId=${projectId}&userId=${userId}`);
    
    if (questionsResponse.ok) {
      const questionsData = await questionsResponse.json();
      if (questionsData.success && questionsData.questions) {
        const today = new Date().toISOString().split('T')[0];
        const todayQuestions = questionsData.questions.filter(q => 
          q.sent_at && q.sent_at.startsWith(today)
        );
        
        console.log(`📧 Questions sent today: ${todayQuestions.length}`);
        if (todayQuestions.length > 0) {
          todayQuestions.forEach((q, idx) => {
            console.log(`   ${idx + 1}. ID: ${q.id} - "${q.question.substring(0, 50)}..."`);
            console.log(`      Sent at: ${q.sent_at}`);
          });
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking webhook activity:', error);
  }
}

// Run the check
checkRecentWebhookActivity();
