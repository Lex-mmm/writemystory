// DEBUG EMAIL SYSTEM - Find out exactly what's happening
// Copy and paste this in your browser console

async function debugEmailSystem() {
  console.log('🔬 DEBUG EMAIL SYSTEM - DETAILED INVESTIGATION');
  console.log('===============================================');
  
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
          console.log(`👤 Found User ID: ${userId}`);
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
    // Step 1: Get questions
    console.log('\n📋 Step 1: Getting questions...');
    const questionsResponse = await fetch(`/api/questions?storyId=${projectId}&userId=${userId}`);
    
    if (!questionsResponse.ok) {
      console.log(`❌ Questions API failed: ${questionsResponse.status}`);
      return;
    }
    
    const questionsData = await questionsResponse.json();
    if (!questionsData.success || !questionsData.questions || questionsData.questions.length === 0) {
      console.log('❌ No questions found');
      return;
    }
    
    const testQuestion = questionsData.questions[0];
    console.log(`✅ Found ${questionsData.questions.length} questions`);
    console.log(`🎯 Test question: "${testQuestion.question.substring(0, 60)}..."`);
    console.log(`📋 Question ID: ${testQuestion.id}`);
    
    // Step 2: Get team members
    console.log('\n👥 Step 2: Getting team members...');
    const teamResponse = await fetch(`/api/team-members?storyId=${projectId}&userId=${userId}`);
    
    if (teamResponse.ok) {
      const teamData = await teamResponse.json();
      if (teamData.success && teamData.teamMembers && teamData.teamMembers.length > 0) {
        console.log(`✅ Found ${teamData.teamMembers.length} team members:`);
        teamData.teamMembers.forEach((member, index) => {
          console.log(`   ${index + 1}. ${member.name} (${member.email}) - ID: ${member.id}`);
        });
        
        const testMember = teamData.teamMembers[0];
        console.log(`🎯 Using team member: ${testMember.name} (${testMember.email})`);
        
        // Step 3: Test webhook with detailed logging
        console.log('\n🔗 Step 3: Testing webhook with debug info...');
        
        const timestamp = Date.now();
        const testEmail = {
          type: 'email.received',
          data: {
            from: { 
              email: testMember.email, 
              name: testMember.name 
            },
            to: [{ email: 'info@write-my-story.com' }],
            subject: 'Re: DEBUG Test - WriteMyStory',
            text: `DEBUG TEST - Timestamp: ${timestamp}

This is a debug test to trace exactly what happens.

Team Member: ${testMember.name}
Team Member Email: ${testMember.email}
Team Member ID: ${testMember.id}

-----Original Message-----
Question ID: ${testQuestion.id}
`,
            html: `<p>DEBUG TEST - Timestamp: ${timestamp}</p>
<p>This is a debug test to trace exactly what happens.</p>
<p>Team Member: ${testMember.name}<br>
Team Member Email: ${testMember.email}<br>
Team Member ID: ${testMember.id}</p>
<blockquote>
<p>Question ID: ${testQuestion.id}</p>
</blockquote>`,
            'message-id': '<debug-' + timestamp + '@resend.dev>'
          }
        };
        
        console.log('📤 Sending webhook with data:', {
          from: testEmail.data.from,
          questionId: testQuestion.id,
          storyId: projectId,
          teamMemberId: testMember.id
        });
        
        const webhookResponse = await fetch('/api/email/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testEmail)
        });
        
        const webhookData = await webhookResponse.json();
        console.log(`\n📊 Webhook Results:`);
        console.log(`   Status: ${webhookResponse.status}`);
        console.log(`   Success: ${webhookData.success}`);
        console.log(`   Message: ${webhookData.message}`);
        console.log(`   Response ID: ${webhookData.responseId}`);
        console.log(`   Question ID: ${webhookData.questionId}`);
        console.log(`   Story ID: ${webhookData.storyId}`);
        console.log(`   Processing Time: ${webhookData.processingTime}ms`);
        
        if (webhookResponse.status === 200 && webhookData.success) {
          // Step 4: Detailed database checking
          console.log('\n🔍 Step 4: Detailed database investigation...');
          
          // Check multiple endpoints
          const endpoints = [
            `/api/questions/email-responses?storyId=${projectId}`,
            `/api/questions/email-responses?questionId=${testQuestion.id}`
          ];
          
          for (const endpoint of endpoints) {
            console.log(`\n📡 Testing endpoint: ${endpoint}`);
            
            const response = await fetch(endpoint);
            console.log(`   Status: ${response.status}`);
            
            if (response.ok) {
              const data = await response.json();
              console.log(`   Success: ${data.success}`);
              console.log(`   Responses count: ${data.responses?.length || 0}`);
              
              if (data.responses && data.responses.length > 0) {
                console.log('   📧 Found responses:');
                data.responses.forEach((resp, idx) => {
                  console.log(`     ${idx + 1}. ID: ${resp.id}`);
                  console.log(`        Question: ${resp.question_id}`);
                  console.log(`        Story: ${resp.story_id}`);
                  console.log(`        Member: ${resp.team_member_name} (ID: ${resp.team_member_id})`);
                  console.log(`        Content: ${resp.response_content?.substring(0, 50)}...`);
                });
              } else {
                console.log('   ❌ No responses found');
              }
            } else {
              const errorText = await response.text();
              console.log(`   ❌ Error: ${errorText}`);
            }
          }
          
          // Step 5: Direct database table check using POST method
          console.log('\n🗄️ Step 5: Testing direct database access...');
          
          try {
            const directResponse = await fetch('/api/questions/email-responses', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                questionId: testQuestion.id,
                storyId: projectId,
                teamMemberEmail: testMember.email,
                responseContent: `Direct API test - ${timestamp}`,
                emailMessageId: `<direct-test-${timestamp}@test.com>`
              })
            });
            
            console.log(`Direct POST Status: ${directResponse.status}`);
            
            if (directResponse.ok) {
              const directData = await directResponse.json();
              console.log('Direct POST Result:', directData);
            } else {
              const directError = await directResponse.text();
              console.log('Direct POST Error:', directError);
            }
          } catch (directErr) {
            console.log('Direct POST failed:', directErr);
          }
          
        } else {
          console.log(`❌ Webhook failed: ${JSON.stringify(webhookData)}`);
        }
        
      } else {
        console.log('❌ No team members found');
      }
    } else {
      console.log(`❌ Team members API failed: ${teamResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugEmailSystem();
