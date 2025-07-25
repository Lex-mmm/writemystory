// VERIFY QUESTION EXISTS - Debug the foreign key issue
// Copy and paste this in your browser console

async function verifyQuestionExists() {
  console.log('🔍 VERIFY QUESTION EXISTS - FOREIGN KEY DEBUG');
  console.log('=============================================');
  
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
    // Step 1: Get questions
    console.log('\n📋 Step 1: Getting questions from API...');
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
    console.log(`✅ Found ${questionsData.questions.length} questions from API`);
    console.log(`🎯 First question: "${testQuestion.question.substring(0, 60)}..."`);
    console.log(`📋 Question ID: ${testQuestion.id}`);
    console.log(`📚 Story ID: ${testQuestion.story_id}`);
    console.log(`🔢 Question Priority: ${testQuestion.priority}`);
    console.log(`📅 Question Created: ${testQuestion.created_at}`);
    
    // Step 2: Test if we can create an email response directly using the API
    console.log('\n📧 Step 2: Testing direct email response creation...');
    
    // Get team member
    const teamResponse = await fetch(`/api/team-members?storyId=${projectId}&userId=${userId}`);
    if (!teamResponse.ok) {
      console.log(`❌ Team members API failed: ${teamResponse.status}`);
      return;
    }
    
    const teamData = await teamResponse.json();
    if (!teamData.success || !teamData.teamMembers || teamData.teamMembers.length === 0) {
      console.log('❌ No team members found');
      return;
    }
    
    const testMember = teamData.teamMembers[0];
    console.log(`👤 Using team member: ${testMember.name} (${testMember.email})`);
    console.log(`🆔 Team member ID: ${testMember.id}`);
    
    // Try to create email response directly
    const timestamp = Date.now();
    const directEmailResponse = await fetch('/api/questions/email-responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId: testQuestion.id,
        storyId: projectId,
        teamMemberEmail: testMember.email,
        responseContent: `Direct test response - ${timestamp}`,
        emailMessageId: `<direct-verification-${timestamp}@test.com>`
      })
    });
    
    console.log(`\n📊 Direct API Results:`);
    console.log(`   Status: ${directEmailResponse.status}`);
    
    if (directEmailResponse.ok) {
      const directData = await directEmailResponse.json();
      console.log('   ✅ SUCCESS! Direct API worked');
      console.log(`   Response ID: ${directData.responseId}`);
      console.log(`   Team Member: ${directData.teamMember}`);
      
      // Now check if we can retrieve it
      console.log('\n🔍 Step 3: Checking if direct response is retrievable...');
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const checkResponse = await fetch(`/api/questions/email-responses?storyId=${projectId}`);
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        console.log(`   Retrievable responses: ${checkData.responses?.length || 0}`);
        
        if (checkData.responses && checkData.responses.length > 0) {
          console.log('   📧 Found responses via direct API!');
          const latestResponse = checkData.responses[0];
          console.log(`      ID: ${latestResponse.id}`);
          console.log(`      Question: ${latestResponse.question_id}`);
          console.log(`      Story: ${latestResponse.story_id}`);
          console.log(`      Member: ${latestResponse.team_member_name}`);
          console.log(`      Content: ${latestResponse.response_content?.substring(0, 50)}...`);
          
          console.log('\n🎉 CONCLUSION: Direct API works! Issue is with webhook.');
          console.log('🔧 The webhook has a different problem than the API');
          
        } else {
          console.log('   ❌ Direct response not retrievable');
        }
      }
      
    } else {
      const directError = await directEmailResponse.text();
      console.log('   ❌ Direct API failed:', directError);
      
      if (directError.includes('foreign key constraint')) {
        console.log('\n🚨 FOREIGN KEY ISSUE CONFIRMED');
        console.log('   The question ID from the API does not exist in the database questions table');
        console.log('   This suggests a database sync issue or different database connections');
        
        // Let's check what questions actually exist in the database
        console.log('\n🔍 Step 3: Investigating database state...');
        console.log('   Try refreshing the page and regenerating questions');
        console.log('   The questions table might be out of sync');
        
      } else {
        console.log('\n🔍 Different error - not foreign key related');
      }
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run the verification
verifyQuestionExists();
