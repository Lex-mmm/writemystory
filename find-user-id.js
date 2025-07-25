// USER ID FINDER - Run this in browser console to find your user ID
// Go to: https://write-my-story.com/project/[your-project-id]

console.log('🔍 SEARCHING FOR USER ID...');
console.log('==========================');

// Method 1: Check all localStorage items
console.log('\n📦 Method 1: Checking localStorage...');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  console.log(`Key: ${key}`);
  
  if (key && (key.includes('supabase') || key.includes('auth'))) {
    try {
      const item = localStorage.getItem(key);
      console.log(`  Content preview: ${item.substring(0, 100)}...`);
      
      const parsed = JSON.parse(item);
      if (parsed.user) {
        console.log(`  ✅ FOUND USER DATA in ${key}:`);
        console.log(`     User ID: ${parsed.user.id}`);
        console.log(`     Email: ${parsed.user.email}`);
      }
    } catch (e) {
      console.log(`  ❌ Could not parse JSON in ${key}`);
    }
  }
}

// Method 2: Check sessionStorage
console.log('\n📦 Method 2: Checking sessionStorage...');
for (let i = 0; i < sessionStorage.length; i++) {
  const key = sessionStorage.key(i);
  console.log(`Key: ${key}`);
  
  if (key && (key.includes('supabase') || key.includes('auth'))) {
    try {
      const item = sessionStorage.getItem(key);
      const parsed = JSON.parse(item);
      if (parsed.user) {
        console.log(`  ✅ FOUND USER DATA in ${key}:`);
        console.log(`     User ID: ${parsed.user.id}`);
        console.log(`     Email: ${parsed.user.email}`);
      }
    } catch (e) {
      console.log(`  ❌ Could not parse JSON in ${key}`);
    }
  }
}

// Method 3: Check if there's any global auth state
console.log('\n🌐 Method 3: Checking global variables...');
if (typeof window !== 'undefined') {
  const globalKeys = Object.keys(window).filter(key => 
    key.includes('auth') || key.includes('supabase') || key.includes('user')
  );
  console.log('Auth-related global variables:', globalKeys);
}

console.log('\n🎯 MANUAL INSTRUCTIONS:');
console.log('1. Look for any User ID printed above');
console.log('2. If found, copy it and run: userId = "your-user-id"; testEmailSystem();');
console.log('3. If not found, we\'ll use an alternative approach');
