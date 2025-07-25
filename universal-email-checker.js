// UNIVERSAL EMAIL CHECKER - Works from any page
// Copy and paste this in your browser console

async function checkAllEmailActivity() {
  console.log('🔍 UNIVERSAL EMAIL ACTIVITY CHECKER');
  console.log('===================================');
  
  // Get user ID
  let userId = null;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes('auth-token')) {
      try {
        const item = JSON.parse(localStorage.getItem(key) || '{}');
        if (item.user && item.user.id) {
          userId = item.user.id;
          console.log(`👤 User ID: ${userId}`);
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
    // First, get all user's projects
    console.log('\n📁 Getting all your projects...');
    const projectsResponse = await fetch(`/api/stories?userId=${userId}`);
    
    if (!projectsResponse.ok) {
      console.log(`❌ Projects API failed: ${projectsResponse.status}`);
      return;
    }
    
    const projectsData = await projectsResponse.json();
    if (!projectsData.success || !projectsData.stories || projectsData.stories.length === 0) {
      console.log('❌ No projects found');
      return;
    }
    
    console.log(`✅ Found ${projectsData.stories.length} projects:`);
    projectsData.stories.forEach((project, idx) => {
      console.log(`   ${idx + 1}. ${project.title} (ID: ${project.id})`);
    });
    
    // Check each project for email responses
    console.log('\n📧 Checking email responses in each project...');
    
    let totalEmailResponses = 0;
    let totalTestEmails = 0;
    let totalRealEmails = 0;
    
    for (const project of projectsData.stories) {
      console.log(`\n🔍 Checking project: ${project.title}`);
      console.log(`   Project ID: ${project.id}`);
      
      try {
        const responsesResponse = await fetch(`/api/questions/email-responses?storyId=${project.id}`);
        
        if (responsesResponse.ok) {
          const responsesData = await responsesResponse.json();
          
          if (responsesData.success && responsesData.responses && responsesData.responses.length > 0) {
            console.log(`   📧 Found ${responsesData.responses.length} email responses:`);
            
            responsesData.responses.forEach((resp, idx) => {
              const isTest = resp.response_content?.includes('TEST') || 
                           resp.response_content?.includes('Debug') ||
                           resp.response_content?.includes('Direct test') ||
                           resp.email_message_id?.includes('test') ||
                           resp.email_message_id?.includes('debug');
              
              console.log(`     ${idx + 1}. ${isTest ? '🧪' : '🌐'} ${resp.team_member_name} - ${resp.created_at}`);
              console.log(`        Content: "${resp.response_content?.substring(0, 60)}..."`);
              console.log(`        Message ID: ${resp.email_message_id}`);
              
              totalEmailResponses++;
              if (isTest) {
                totalTestEmails++;
              } else {
                totalRealEmails++;
              }
            });
            
            // Show recent real emails in detail
            const realEmails = responsesData.responses.filter(r => 
              !r.response_content?.includes('TEST') && 
              !r.response_content?.includes('Debug') &&
              !r.response_content?.includes('Direct test') &&
              !r.email_message_id?.includes('test') &&
              !r.email_message_id?.includes('debug')
            );
            
            if (realEmails.length > 0) {
              console.log(`   🌐 REAL EMAILS in ${project.title}:`);
              realEmails.forEach((real, idx) => {
                console.log(`     Real Email ${idx + 1}:`);
                console.log(`       Full Content: "${real.response_content}"`);
                console.log(`       Created: ${real.created_at}`);
                console.log(`       Question ID: ${real.question_id}`);
                console.log(`       Story ID: ${real.story_id}`);
              });
            }
            
          } else {
            console.log(`   📧 No email responses found`);
          }
        } else {
          console.log(`   ❌ API error: ${responsesResponse.status}`);
        }
      } catch (error) {
        console.log(`   ❌ Error checking project: ${error.message}`);
      }
    }
    
    console.log(`\n📊 OVERALL SUMMARY:`);
    console.log(`   📧 Total email responses: ${totalEmailResponses}`);
    console.log(`   🧪 Test emails: ${totalTestEmails}`);
    console.log(`   🌐 Real emails: ${totalRealEmails}`);
    
    if (totalRealEmails === 0) {
      console.log('\n⚠️ NO REAL EMAILS FOUND ACROSS ALL PROJECTS!');
      console.log('This suggests your real email replies are not being processed by the webhook.');
      console.log('\nTroubleshooting steps:');
      console.log('1. Make sure you replied to the correct email address: info@write-my-story.com');
      console.log('2. Check that your reply includes the original question text with the Question ID');
      console.log('3. Verify you are replying from the same email address as your team member');
      console.log('4. Try sending a simple reply like "This is my answer" and include the original email');
    } else {
      console.log(`\n✅ Found ${totalRealEmails} real email(s)! They should appear in your dashboard.`);
    }
    
  } catch (error) {
    console.error('❌ Error checking email activity:', error);
  }
}

// Run the universal check
checkAllEmailActivity();
