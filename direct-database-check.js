// DIRECT DATABASE CHECK - Run this to see what's actually in the database
// Copy and paste this in your browser console

async function directDatabaseCheck() {
  console.log('🔍 DIRECT DATABASE CHECK');
  console.log('========================');
  
  const projectId = window.location.pathname.split('/').pop();
  console.log(`📁 Project ID: ${projectId}`);
  
  try {
    // Test direct access to email_responses table (not the view)
    console.log('\n📧 Checking email_responses table directly...');
    
    // We'll use a direct API call to check the actual table
    const testUrl = `/api/questions/email-responses?storyId=${projectId}`;
    console.log('🔗 Testing URL:', testUrl);
    
    const response = await fetch(testUrl);
    console.log(`API Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Full API Response:', data);
      
      if (data.success) {
        console.log(`📊 Responses found: ${data.responses.length}`);
        
        if (data.responses.length > 0) {
          console.log('\n📧 All responses:');
          data.responses.forEach((response, index) => {
            console.log(`${index + 1}. ID: ${response.id}`);
            console.log(`   Question: ${response.question_id}`);
            console.log(`   Story: ${response.story_id}`);
            console.log(`   Member: ${response.team_member_name}`);
            console.log(`   Email: ${response.sender_email}`);
            console.log(`   Content: ${response.response_content?.substring(0, 50)}...`);
            console.log(`   Status: ${response.status}`);
            console.log(`   Created: ${response.created_at || response.received_at}`);
            console.log('   ---');
          });
        } else {
          console.log('❌ No responses in database');
        }
      } else {
        console.log('❌ API returned error:', data.error);
      }
    } else {
      const errorText = await response.text();
      console.log('❌ API request failed:', errorText);
    }
    
    // Also check if we can see recent webhook calls
    console.log('\n🔗 Testing webhook endpoint health...');
    const webhookHealthResponse = await fetch('/api/email/webhook');
    console.log(`Webhook health status: ${webhookHealthResponse.status}`);
    
    if (webhookHealthResponse.ok) {
      const healthData = await webhookHealthResponse.json();
      console.log('Webhook health:', healthData);
    }
    
  } catch (error) {
    console.error('❌ Direct database check failed:', error);
  }
}

// Run the check
directDatabaseCheck();
