// CHECK EMAIL RESPONSES - Run this to see what was actually saved
// Copy and paste this in your browser console

async function checkEmailResponses() {
  console.log('🔍 CHECKING EMAIL RESPONSES');
  console.log('============================');
  
  const projectId = window.location.pathname.split('/').pop();
  console.log(`📁 Project ID: ${projectId}`);
  
  try {
    // Check email responses
    console.log('\n📧 Checking stored email responses...');
    const emailResponsesCheck = await fetch(`/api/questions/email-responses?storyId=${projectId}`);
    const emailResponsesData = await emailResponsesCheck.json();
    
    console.log(`Email responses API Status: ${emailResponsesCheck.status}`);
    console.log('Email responses data:', emailResponsesData);
    
    if (emailResponsesData.success) {
      console.log(`📊 Total responses found: ${emailResponsesData.responses.length}`);
      
      if (emailResponsesData.responses.length > 0) {
        console.log('\n📧 All email responses:');
        emailResponsesData.responses.forEach((response, index) => {
          console.log(`${index + 1}. Response ID: ${response.id}`);
          console.log(`   Question ID: ${response.question_id}`);
          console.log(`   Team Member: ${response.team_member_name}`);
          console.log(`   Content: ${response.response_content.substring(0, 100)}...`);
          console.log(`   Created: ${response.created_at}`);
          console.log('   ---');
        });
        
        console.log('\n✅ EMAIL RESPONSES ARE STORED!');
        console.log('💡 These should appear in your dashboard');
      } else {
        console.log('❌ No email responses found');
      }
    } else {
      console.log('❌ Failed to get email responses:', emailResponsesData.error);
    }
    
    // Also check team members
    console.log('\n👥 Checking team members...');
    const teamResponse = await fetch(`/api/team-members?storyId=${projectId}`);
    
    if (teamResponse.ok) {
      const teamData = await teamResponse.json();
      console.log('Team members data:', teamData);
      
      if (teamData.success && teamData.teamMembers) {
        console.log(`📊 Total team members: ${teamData.teamMembers.length}`);
        teamData.teamMembers.forEach((member, index) => {
          console.log(`${index + 1}. ${member.name} (${member.email})`);
        });
      }
    } else {
      console.log('Could not fetch team members');
    }
    
  } catch (error) {
    console.error('❌ Error checking responses:', error);
  }
}

// Run the check
checkEmailResponses();
