// Debug all APIs to see what's working
const debugAllAPIs = async () => {
  console.log('🔧 Debugging All APIs...\n');
  
  const endpoints = [
    'http://localhost:3002/api/stories',
    'http://localhost:3002/api/questions',
    'http://localhost:3002/api/questions/email-responses?storyId=test'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`Testing: ${endpoint}`);
    try {
      const response = await fetch(endpoint);
      console.log(`  Status: ${response.status} ${response.statusText}`);
      
      const text = await response.text();
      if (text.length < 200) {
        console.log(`  Response: ${text}`);
      } else {
        console.log(`  Response: ${text.substring(0, 100)}...`);
      }
      console.log('');
    } catch (error) {
      console.log(`  Error: ${error.message}`);
      console.log('');
    }
  }
  
  // Check if server is running
  console.log('🌐 Testing homepage...');
  try {
    const homeResponse = await fetch('http://localhost:3002/');
    console.log(`Homepage status: ${homeResponse.status}`);
  } catch (error) {
    console.log('❌ Server might not be running on port 3002');
    console.log('💡 Make sure "npm run dev" is running');
  }
};

debugAllAPIs();
