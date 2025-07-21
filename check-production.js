// Check if production deployment is complete
require('dotenv').config({ path: '.env.local' });

async function checkProductionDeployment() {
  console.log('🚀 Checking Production Deployment Status...');
  console.log('==========================================');

  const PRODUCTION_URL = 'https://write-my-story.com';
  const YOUR_PHONE = '+31681933832';

  try {
    console.log('📱 Testing production webhook...');
    
    const formData = new URLSearchParams();
    formData.append('From', `whatsapp:${YOUR_PHONE}`);
    formData.append('Body', 'Production deployment test');
    formData.append('MessageSid', 'PROD_TEST_' + Date.now());
    formData.append('AccountSid', process.env.TWILIO_ACCOUNT_SID || 'TEST_ACCOUNT_SID');
    
    const response = await fetch(`${PRODUCTION_URL}/api/whatsapp/receive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });

    const responseText = await response.text();
    
    console.log('📋 Production Response Status:', response.status);
    console.log('📋 Production Response Body:');
    console.log(responseText);
    
    if (responseText.includes('geen openstaande vraag')) {
      console.log('\n❌ PRODUCTION: Still using OLD code (deployment not complete)');
      console.log('The enhanced findLatestQuestionForTeamMember function is NOT deployed yet');
      console.log('\n⏱️  Options:');
      console.log('1. Wait for automatic deployment to complete (can take 5-10 minutes)');
      console.log('2. Manually trigger a new deployment');
      console.log('3. Check deployment status on Render dashboard');
    } else if (responseText.includes('Dank je wel voor je antwoord')) {
      console.log('\n🎉 PRODUCTION: Using NEW code (deployment complete!)');
      console.log('✅ Enhanced question matching is now live in production');
      console.log('🎯 Your WhatsApp replies should now work correctly!');
    } else {
      console.log('\n🤔 PRODUCTION: Unexpected response');
      console.log('Could be a different error or issue');
    }

  } catch (error) {
    console.error('💥 Production check failed:', error.message);
  }
}

checkProductionDeployment();
