// Check current RLS status and policies
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Checking current RLS status and policies...\n');

async function checkRLSStatus() {
  try {
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('1. Checking if tables have RLS enabled...');
    
    // Check RLS status using a direct query
    const tables = ['projects', 'questions', 'answers'];
    
    for (const table of tables) {
      try {
        // Try to query system catalogs
        const { data, error } = await serviceClient
          .from('pg_class')
          .select('relname, relrowsecurity')
          .eq('relname', table)
          .single();
          
        if (error) {
          console.log(`   ${table}: ❌ Could not check RLS status`);
        } else {
          console.log(`   ${table}: RLS ${data.relrowsecurity ? '✅ Enabled' : '❌ Disabled'}`);
        }
      } catch (err) {
        console.log(`   ${table}: ❌ Error checking: ${err.message}`);
      }
    }
    
    console.log('\n2. Testing project access scenarios...');
    
    // Test 1: Service role access (should always work)
    console.log('   a) Service role access:');
    try {
      const { data: allProjects, error } = await serviceClient
        .from('projects')
        .select('id, user_id')
        .limit(5);
        
      if (error) {
        console.log(`      ❌ Failed: ${error.message}`);
      } else {
        console.log(`      ✅ Success: Found ${allProjects.length} projects`);
      }
    } catch (err) {
      console.log(`      ❌ Error: ${err.message}`);
    }
    
    // Test 2: Anon key access (should be restricted by RLS)
    console.log('   b) Anonymous access (should be restricted):');
    try {
      const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      const { data: anonProjects, error } = await anonClient
        .from('projects')
        .select('id, user_id')
        .limit(5);
        
      if (error) {
        console.log(`      ✅ Properly restricted: ${error.message}`);
      } else {
        console.log(`      ⚠️  WARNING: Anonymous access allowed! Found ${anonProjects.length} projects`);
        console.log('      This suggests RLS policies might not be working correctly.');
      }
    } catch (err) {
      console.log(`      ❌ Error: ${err.message}`);
    }
    
    // Test 3: User context access
    console.log('   c) User context access:');
    try {
      const testUserId = 'test-user-' + Date.now();
      
      // Set user context
      await serviceClient.rpc('set_current_user_id', { user_id: testUserId });
      
      // Create a test project
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
        console.log(`      ❌ Insert failed: ${insertError.message}`);
      } else {
        console.log(`      ✅ Insert successful: ${project.id}`);
        
        // Try to read projects for this user
        const { data: userProjects, error: selectError } = await serviceClient
          .from('projects')
          .select('id, user_id')
          .eq('user_id', testUserId);
          
        if (selectError) {
          console.log(`      ❌ Select failed: ${selectError.message}`);
        } else {
          console.log(`      ✅ Select successful: Found ${userProjects.length} projects for user`);
        }
        
        // Clean up
        await serviceClient.from('projects').delete().eq('id', project.id);
      }
    } catch (err) {
      console.log(`      ❌ Error: ${err.message}`);
    }
    
    console.log('\n3. Checking for existing RLS policies...');
    try {
      // Try to check policies (this might not work depending on permissions)
      const { data: policies, error } = await serviceClient
        .from('pg_policies')
        .select('tablename, policyname, permissive, roles, cmd')
        .eq('schemaname', 'public');
        
      if (error) {
        console.log('   ❌ Could not fetch policies:', error.message);
      } else {
        console.log(`   ✅ Found ${policies.length} policies:`);
        policies.forEach(policy => {
          console.log(`      - ${policy.tablename}.${policy.policyname} (${policy.cmd})`);
        });
      }
    } catch (err) {
      console.log('   ❌ Error checking policies:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Failed to check RLS status:', error.message);
  }
}

checkRLSStatus();
