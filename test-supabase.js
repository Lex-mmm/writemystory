// Test Supabase connection and diagnose issues
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Diagnosing Supabase Connection...\n');

console.log('Environment Variables:');
console.log('- SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('- ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
console.log('- SERVICE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
console.log('');

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

async function testConnection() {
  try {
    // Test with anon key (normal client)
    console.log('1. Testing connection with anon key...');
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    
    // Check if we can connect at all
    const { data: authData, error: authError } = await anonClient.auth.getSession();
    console.log('   Auth session check:', authError ? `❌ ${authError.message}` : '✅ Connected');
    
    // Test with service role key
    console.log('\n2. Testing connection with service role key...');
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check tables existence
    console.log('\n3. Checking table existence...');
    
    const tables = ['projects', 'questions', 'answers', 'user_subscriptions'];
    for (const table of tables) {
      try {
        const { data, error } = await serviceClient.from(table).select('*').limit(1);
        if (error) {
          if (error.code === 'PGRST116') {
            console.log(`   ${table}: ❌ Table does not exist`);
          } else {
            console.log(`   ${table}: ❌ Error: ${error.message}`);
          }
        } else {
          console.log(`   ${table}: ✅ Exists (${data?.length || 0} rows sample)`);
        }
      } catch (err) {
        console.log(`   ${table}: ❌ Connection error: ${err.message}`);
      }
    }
    
    // Test creating a project with service role
    console.log('\n4. Testing project creation with service role...');
    const testUserId = 'test-user-' + Date.now();
    
    try {
      const { data: project, error: insertError } = await serviceClient
        .from('projects')
        .insert({
          user_id: testUserId,
          subject_type: 'self',
          period_type: 'fullLife',
          writing_style: 'neutral',
          status: 'active',
          progress: 15
        })
        .select()
        .single();
        
      if (insertError) {
        console.log(`   ❌ Insert failed: ${insertError.message}`);
        console.log(`   Error code: ${insertError.code}`);
        
        // If RLS error, suggest fixes
        if (insertError.code === '42501') {
          console.log('\n💡 RLS Policy Issue Detected!');
          console.log('   This means Row Level Security is blocking the insert.');
          console.log('   Solutions:');
          console.log('   1. Apply the security-fixes-safe.sql script to your database');
          console.log('   2. Or temporarily disable RLS for testing');
        }
      } else {
        console.log(`   ✅ Project created successfully: ${project.id}`);
        
        // Clean up test project
        await serviceClient.from('projects').delete().eq('id', project.id);
        console.log('   ✅ Test project cleaned up');
      }
    } catch (err) {
      console.log(`   ❌ Unexpected error: ${err.message}`);
    }
    
    console.log('\n5. Checking RLS status...');
    try {
      const { data: rlsStatus } = await serviceClient
        .rpc('sql', {
          query: `
            SELECT 
              schemaname, 
              tablename, 
              rowsecurity as rls_enabled
            FROM pg_tables 
            WHERE schemaname = 'public' 
              AND tablename IN ('projects', 'questions', 'answers')
          `
        });
        
      if (rlsStatus) {
        rlsStatus.forEach(table => {
          console.log(`   ${table.tablename}: RLS ${table.rls_enabled ? '✅ Enabled' : '❌ Disabled'}`);
        });
      }
    } catch (err) {
      console.log('   ❌ Could not check RLS status');
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }
}

testConnection();
