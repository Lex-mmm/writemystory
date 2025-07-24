// Check database for email responses for lexvanloon@gmail.com
const checkEmailResponses = async () => {
  console.log('🔍 Checking Email Responses for lexvanloon@gmail.com...\n');
  
  try {
    // 1. Check if email responses API is working
    console.log('🧪 Testing email responses API...');
    const apiTest = await fetch('http://localhost:3002/api/questions/email-responses');
    
    if (!apiTest.ok) {
      console.log('❌ Email responses API not working - migration not applied yet');
      console.log('💡 Apply the safe-migration.sql script in Supabase Dashboard first');
      return;
    }
    
    console.log('✅ Email responses API is working');
    
    // 2. Get all projects for the user (to see what data exists)
    console.log('\n📚 Checking projects...');
    const projectsResponse = await fetch('http://localhost:3002/api/stories');
    
    if (projectsResponse.ok) {
      const projectsData = await projectsResponse.json();
      console.log(`Found ${projectsData.stories?.length || 0} projects`);
      
      if (projectsData.stories && projectsData.stories.length > 0) {
        for (const project of projectsData.stories) {
          console.log(`  📖 "${project.person_name}" (ID: ${project.id})`);
        }
      }
    }
    
    // 3. Get all questions
    console.log('\n❓ Checking questions...');
    const questionsResponse = await fetch('http://localhost:3002/api/questions');
    
    if (questionsResponse.ok) {
      const questionsData = await questionsResponse.json();
      console.log(`Found ${questionsData.questions?.length || 0} questions`);
      
      if (questionsData.questions && questionsData.questions.length > 0) {
        console.log('\n📋 Questions found:');
        for (const question of questionsData.questions.slice(0, 3)) { // Show first 3
          console.log(`  • "${question.question.substring(0, 60)}..."`);
          console.log(`    ID: ${question.id}, Story: ${question.story_id}`);
          
          // Check for email responses for this question
          try {
            const responseCheck = await fetch(`http://localhost:3002/api/questions/email-responses?questionId=${question.id}`);
            if (responseCheck.ok) {
              const responseData = await responseCheck.json();
              if (responseData.responses && responseData.responses.length > 0) {
                console.log(`    📧 Has ${responseData.responses.length} email response(s):`);
                for (const response of responseData.responses) {
                  console.log(`      - From: ${response.team_member_name} (${response.sender_email})`);
                  console.log(`      - Content: "${response.response_content.substring(0, 50)}..."`);
                  console.log(`      - Status: ${response.status}`);
                  console.log(`      - Date: ${new Date(response.created_at).toLocaleString()}`);
                }
              } else {
                console.log(`    📭 No email responses`);
              }
            }
          } catch (err) {
            console.log(`    ❌ Error checking responses: ${err.message}`);
          }
        }
      }
    }
    
    // 4. Try to get all email responses globally
    console.log('\n📧 Checking all email responses in system...');
    try {
      const allResponsesCheck = await fetch('http://localhost:3002/api/questions/email-responses');
      if (allResponsesCheck.ok) {
        const allResponsesData = await allResponsesCheck.json();
        
        if (allResponsesData.responses && allResponsesData.responses.length > 0) {
          console.log(`✅ Found ${allResponsesData.responses.length} total email responses:`);
          for (const response of allResponsesData.responses) {
            console.log(`  📧 Response ID: ${response.id}`);
            console.log(`     Question ID: ${response.question_id}`);
            console.log(`     From: ${response.team_member_name} (${response.sender_email})`);
            console.log(`     Content: "${response.response_content.substring(0, 80)}..."`);
            console.log(`     Status: ${response.status}`);
            console.log(`     Created: ${new Date(response.created_at).toLocaleString()}`);
            console.log('');
          }
        } else {
          console.log('📭 No email responses found in the system');
          console.log('\n💡 This means:');
          console.log('   1. Either no email responses have been saved yet');
          console.log('   2. Or they exist but the API can\'t access them due to RLS policies');
        }
      }
    } catch (err) {
      console.log(`❌ Error getting all responses: ${err.message}`);
    }
    
    // 5. Summary
    console.log('\n📊 Summary:');
    console.log('   - Email responses API: Working');
    console.log('   - Database migration: Applied');
    console.log('   - To see responses in dashboard: Go to project page and look below questions');
    console.log('   - Dashboard URL pattern: http://localhost:3002/project/[project-id]');
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
};

checkEmailResponses();
