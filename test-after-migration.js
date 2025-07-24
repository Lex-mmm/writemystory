// Test to add email responses after migration is applied
const testAfterMigration = async () => {
  console.log('🧪 Testing Email Responses After Migration...\n');
  
  try {
    // 1. Get questions to test with
    console.log('📋 Getting questions...');
    const questionsResponse = await fetch('http://localhost:3002/api/questions');
    const questionsData = await questionsResponse.json();
    
    if (!questionsData.success || questionsData.questions.length === 0) {
      console.log('❌ No questions found. Create a project and add some questions first.');
      return;
    }
    
    const testQuestion = questionsData.questions[0];
    console.log(`✅ Found test question: "${testQuestion.question.substring(0, 50)}..."`);
    console.log(`   Question ID: ${testQuestion.id}`);
    console.log(`   Story ID: ${testQuestion.story_id}`);
    
    // 2. Add a test email response
    console.log('\n➕ Adding test email response...');
    
    const testResponse = {
      questionId: testQuestion.id,
      storyId: testQuestion.story_id,
      teamMemberName: 'Oma Gertrude',
      responseContent: `Wat een mooie vraag! Ik herinner me nog goed dat ${testQuestion.question.includes('verhaal') ? 'verhaal' : 'moment'}. 
      
Het was in de zomer van 1973, en ik was toen nog zo jong. De zon scheen prachtig die dag, en iedereen was zo gelukkig. Dat zijn de momenten die je nooit vergeet!

Ik hoop dat dit helpt voor het verhaal. Laat me weten als je meer wilt weten!

Liefs,
Oma Gertrude`,
      senderEmail: 'gertrude@familie.nl',
      status: 'received'
    };
    
    const addResponse = await fetch('http://localhost:3002/api/questions/email-responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testResponse)
    });
    
    if (!addResponse.ok) {
      const errorText = await addResponse.text();
      console.log('❌ Failed to add response:', errorText);
      console.log('\n💡 This likely means:');
      console.log('   1. The database migration hasn\'t been applied yet');
      console.log('   2. Go to Supabase Dashboard → SQL Editor');
      console.log('   3. Run the SQL from add-question-tracking.sql');
      return;
    }
    
    const addResult = await addResponse.json();
    
    if (addResult.success) {
      console.log('✅ Test email response added successfully!');
      console.log(`   Response ID: ${addResult.response.id}`);
      
      // 3. Verify it appears in the API
      console.log('\n🔍 Checking if response appears in API...');
      const checkResponse = await fetch(`http://localhost:3002/api/questions/email-responses?questionId=${testQuestion.id}`);
      const checkData = await checkResponse.json();
      
      console.log(`✅ Found ${checkData.responses?.length || 0} response(s) for this question`);
      
      // 4. Show dashboard URL
      console.log('\n🎯 SUCCESS! Now check the dashboard:');
      console.log(`   📱 Dashboard URL: http://localhost:3002/project/${testQuestion.story_id}`);
      console.log(`   🔍 Look for the question: "${testQuestion.question.substring(0, 50)}..."`);
      console.log(`   📧 You should see: "📧 1 reactie" badge`);
      console.log(`   💬 Below the question, you should see Oma Gertrude's response`);
      
    } else {
      console.log('❌ Failed to add response:', addResult.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n💡 Make sure:');
    console.log('   1. The server is running (npm run dev)');
    console.log('   2. The database migration has been applied');
    console.log('   3. You have at least one project with questions');
  }
};

// Run the test
testAfterMigration().then(() => {
  console.log('\n🏁 Test completed');
});
