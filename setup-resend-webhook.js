// Check current Resend configuration
const checkResendConfig = () => {
  console.log('🔍 Checking Resend Configuration...\n');
  
  // Check environment variables (won't show actual values for security)
  const hasResendKey = !!process.env.RESEND_API_KEY;
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('Environment Variables:');
  console.log(`✅ RESEND_API_KEY: ${hasResendKey ? 'Set' : '❌ Missing'}`);
  console.log(`✅ SUPABASE_URL: ${hasSupabaseUrl ? 'Set' : '❌ Missing'}`);
  console.log(`✅ SERVICE_ROLE_KEY: ${hasServiceKey ? 'Set' : '❌ Missing'}`);
  
  // Test webhook endpoint
  console.log('\n🌐 Testing webhook endpoint...');
  
  fetch('/api/email/webhook')
    .then(response => response.json())
    .then(data => {
      console.log('✅ Webhook endpoint is active:', data.message);
    })
    .catch(error => {
      console.log('❌ Webhook endpoint error:', error);
    });
  
  console.log('\n📋 Next Steps:');
  console.log('1. Get your webhook URL: https://your-domain.com/api/email/webhook');
  console.log('2. Configure Resend webhook in dashboard');
  console.log('3. Set up email receiving for your domain');
};

// Instructions for manual setup
console.log('🚀 RESEND WEBHOOK SETUP GUIDE');
console.log('=============================\n');

console.log('📍 Your webhook endpoint:');
console.log(`   ${window.location.origin}/api/email/webhook`);
console.log('');

console.log('🔧 Resend Dashboard Setup:');
console.log('1. Go to: https://resend.com/webhooks');
console.log('2. Click "Add Webhook"');
console.log('3. Endpoint URL: ' + window.location.origin + '/api/email/webhook');
console.log('4. Events: Select "email.delivered" or "email.received"');
console.log('5. Save the webhook');
console.log('');

console.log('📧 Domain Configuration:');
console.log('1. Go to: https://resend.com/domains');
console.log('2. Add domain: write-my-story.com');
console.log('3. Follow DNS verification steps');
console.log('4. Set up MX records for email receiving');
console.log('');

console.log('Run checkResendConfig() to test current setup');

checkResendConfig();
