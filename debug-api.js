// Simple test to see what's wrong with the API
const debugAPI = async () => {
  console.log('🔧 Debugging Email Responses API...\n');
  
  try {
    console.log('Testing: http://localhost:3002/api/questions/email-responses');
    const response = await fetch('http://localhost:3002/api/questions/email-responses');
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response Body:', text);
    
    if (response.status === 404) {
      console.log('\n❌ API endpoint not found');
      console.log('💡 Check if the file exists: app/api/questions/email-responses/route.ts');
    } else if (response.status === 500) {
      console.log('\n❌ Server error - check database connection');
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
};

debugAPI();
