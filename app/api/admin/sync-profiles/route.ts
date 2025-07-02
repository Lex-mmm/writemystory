import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { validateAdminToken, createAdminErrorResponse, createAdminSuccessResponse } from '../../../../lib/adminAuth';

export async function POST(request: NextRequest) {
  // Skip during build time or when admin service is not available
  if (process.env.NEXT_PHASE === 'phase-production-build' || 
      process.env.NODE_ENV === 'production' && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: 'Admin service not available during build' }, { status: 503 });
  }

  // Validate admin authentication
  const { isValid, error } = validateAdminToken(request);
  
  if (!isValid) {
    return createAdminErrorResponse(error || 'Unauthorized');
  }

  try {
    console.log('Syncing auth.users to profiles table...');

    // Get all users from auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return createAdminErrorResponse('Failed to fetch auth users');
    }

    // Get existing profiles
    const { data: existingProfiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id');

    if (profilesError) {
      console.error('Error fetching existing profiles:', profilesError);
      return createAdminErrorResponse('Failed to fetch existing profiles');
    }

    const existingProfileIds = new Set(existingProfiles?.map(p => p.id) || []);
    
    // Find users that don't have profiles
    const usersNeedingProfiles = authUsers.users.filter(user => !existingProfileIds.has(user.id));
    
    console.log(`Found ${usersNeedingProfiles.length} users needing profiles out of ${authUsers.users.length} total users`);

    if (usersNeedingProfiles.length === 0) {
      return createAdminSuccessResponse({
        message: 'All users already have profiles',
        totalUsers: authUsers.users.length,
        newProfiles: 0
      });
    }

    // Create profiles for missing users
    const profilesToCreate = usersNeedingProfiles.map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
      role: 'user'
    }));

    const { error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert(profilesToCreate);

    if (insertError) {
      console.error('Error creating profiles:', insertError);
      return createAdminErrorResponse('Failed to create profiles: ' + insertError.message);
    }

    console.log(`Successfully created ${profilesToCreate.length} profiles`);

    return createAdminSuccessResponse({
      message: `Successfully synced ${profilesToCreate.length} user profiles`,
      totalUsers: authUsers.users.length,
      newProfiles: profilesToCreate.length,
      createdProfiles: profilesToCreate.map(p => ({ id: p.id, email: p.email }))
    });

  } catch (error) {
    console.error('Error in sync-profiles route:', error);
    return createAdminErrorResponse(
      'Internal server error occurred while syncing profiles',
      500
    );
  }
}
