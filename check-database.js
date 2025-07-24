// Quick check of your database state
const checkDatabase = async () => {
  console.log('🔍 Checking Database State...\n');
  
  try {
    // Check projects
    const projectsResponse = await fetch('http://localhost:3002/api/stories');
    if (projectsResponse.ok) {
      const projectsData = await projectsResponse.json();
      console.log(`📚 Projects: ${projectsData.stories?.length || 0} found`);
      
      if (projectsData.stories && projectsData.stories.length > 0) {
        console.log(`   First project: "${projectsData.stories[0].person_name}" (ID: ${projectsData.stories[0].id})`);
        console.log(`   📱 Dashboard: http://localhost:3002/project/${projectsData.stories[0].id}`);
      }
    }
    
    // Check questions
    const questionsResponse = await fetch('http://localhost:3002/api/questions');
    if (questionsResponse.ok) {
      const questionsData = await questionsResponse.json();
      console.log(`❓ Questions: ${questionsData.questions?.length || 0} found`);
    }
    
    // Test email responses table
    console.log('\n🧪 Testing email responses API...');
    const testResponse = await fetch('http://localhost:3002/api/questions/email-responses');
    if (testResponse.ok) {
      console.log('✅ Email responses API is working!');
      console.log('✅ Migration was successful!');
      
      console.log('\n🎯 Next Steps:');
      console.log('1. Go to http://localhost:3002');
      console.log('2. Create a project if you don\'t have one');
      console.log('3. Add some questions to the project');
      console.log('4. I\'ll help you add test email responses');
    } else {
      console.log('❌ Email responses API not working');
      console.log('💡 Make sure you applied the safe-migration.sql script');
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  }
};

checkDatabase();
