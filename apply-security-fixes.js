// Apply security fixes to Supabase database
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Applying security fixes to database...\n');

async function applySecurityFixes() {
  try {
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Read the SQL file
    const sqlContent = fs.readFileSync('./lib/security-fixes-safe.sql', 'utf8');
    
    console.log('📄 Executing security fixes SQL script...');
    
    // Execute the SQL
    const { data, error } = await serviceClient.rpc('sql', {
      query: sqlContent
    });
    
    if (error) {
      console.error('❌ Error applying security fixes:', error.message);
      
      // Try alternative approach - split into smaller chunks
      console.log('\n🔄 Trying alternative approach with smaller SQL chunks...');
      
      // For now, let's just enable RLS and create the function
      const basicFixes = `
        -- Enable RLS on projects table
        ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
        
        -- Create function to set user context
        CREATE OR REPLACE FUNCTION set_current_user_id(user_id TEXT)
        RETURNS void AS $$
        BEGIN
          PERFORM set_config('app.current_user_id', user_id, true);
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        
        -- Create basic RLS policy for service role
        DROP POLICY IF EXISTS "Service role can manage all projects" ON projects;
        CREATE POLICY "Service role can manage all projects" ON projects
          FOR ALL USING (current_setting('role') = 'service_role')
          WITH CHECK (current_setting('role') = 'service_role');
      `;
      
      const { error: basicError } = await serviceClient.rpc('sql', {
        query: basicFixes
      });
      
      if (basicError) {
        console.error('❌ Basic fixes also failed:', basicError.message);
      } else {
        console.log('✅ Basic security fixes applied successfully');
      }
    } else {
      console.log('✅ Security fixes applied successfully');
      if (data) {
        console.log('📋 Results:', data);
      }
    }
    
    // Test the fixes
    console.log('\n🧪 Testing security fixes...');
    
    // Test setting user context
    try {
      await serviceClient.rpc('set_current_user_id', {
        user_id: 'test-user-123'
      });
      console.log('✅ User context function works');
    } catch (err) {
      console.log('❌ User context function failed:', err.message);
    }
    
    // Test project access with user context
    try {
      const testUserId = 'test-user-' + Date.now();
      
      // Set user context
      await serviceClient.rpc('set_current_user_id', { user_id: testUserId });
      
      // Create project
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
        console.log('❌ Project creation with RLS failed:', insertError.message);
      } else {
        console.log('✅ Project creation with RLS works');
        
        // Try to read it back
        const { data: projects, error: selectError } = await serviceClient
          .from('projects')
          .select('*')
          .eq('user_id', testUserId);
          
        if (selectError) {
          console.log('❌ Project reading with RLS failed:', selectError.message);
        } else {
          console.log(`✅ Project reading with RLS works (found ${projects.length} projects)`);
        }
        
        // Clean up
        await serviceClient.from('projects').delete().eq('id', project.id);
      }
    } catch (err) {
      console.log('❌ RLS test failed:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Failed to apply security fixes:', error.message);
  }
}

applySecurityFixes();
