// Monitor deployment status and test when ready
require('dotenv').config({ path: '.env.local' });

async function monitorDeployment() {
  console.log('🚀 Monitoring Production Deployment...');
  console.log('====================================');
  
  const PRODUCTION_URL = 'https://write-my-story.com';
  const YOUR_PHONE = '+31681933832';
  const TEST_MESSAGE = 'Test after deployment';
  
  let attempts = 0;
  const maxAttempts = 20; // Check for up to 10 minutes
  
  console.log('⏱️  Waiting for deployment to complete...');
  console.log('This usually takes 2-5 minutes on Render');
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`\n🔍 Attempt ${attempts}/${maxAttempts} - Testing webhook...`);
    
    try {
      // Test the webhook with enhanced logging
      const formData = new URLSearchParams();
      formData.append('From', `whatsapp:${YOUR_PHONE}`);
      formData.append('Body', `${TEST_MESSAGE} - attempt ${attempts}`);
      formData.append('MessageSid', `TEST_${Date.now()}`);
      formData.append('AccountSid', process.env.TWILIO_ACCOUNT_SID || 'TEST_ACCOUNT_SID');
      
      const response = await fetch(`${PRODUCTION_URL}/api/whatsapp/receive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });

      const responseText = await response.text();
      
      // Check if we get the "no question found" error
      if (responseText.includes('geen openstaande vraag')) {
        console.log('❌ Still getting "no question found" - old deployment');
        
        if (attempts < maxAttempts) {
          console.log('⏱️  Waiting 30 seconds for deployment...');
          await new Promise(resolve => setTimeout(resolve, 30000));
        }
      } else if (responseText.includes('Bedankt voor je antwoord')) {
        console.log('🎉 SUCCESS! New deployment is live!');
        console.log('✅ Question matching is now working');
        console.log('\n📱 Try replying to your WhatsApp message now!');
        break;
      } else {
        console.log('🔍 Different response:', responseText);
        console.log('Checking again in 30 seconds...');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
      
    } catch (error) {
      console.log('⚠️  Network error:', error.message);
      console.log('Retrying in 30 seconds...');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
  
  if (attempts >= maxAttempts) {
    console.log('\n⚠️  Deployment monitoring timed out');
    console.log('You may need to check Render dashboard or try again manually');
  }
}

monitorDeployment();
