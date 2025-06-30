import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, AdminUser, testAdminConnection } from '../../../../lib/supabaseAdmin';
import { validateAdminAccess } from '../../../../middleware/adminAuth';

export async function GET(request: NextRequest) {
  // Skip during build time or when admin service is not available
  if (process.env.NEXT_PHASE === 'phase-production-build' || 
      process.env.NODE_ENV === 'production' && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Admin service not available during build' }, { status: 503 });
  }

  // Validate admin access
  const { error: authError, isValid } = validateAdminAccess(request);
  if (!isValid) {
    return authError;
  }

  try {
    console.log('Admin users route - starting...');
    
    // Test admin connection first
    const connectionTest = await testAdminConnection();
    if (!connectionTest) {
      return NextResponse.json(
        { error: 'Admin connection failed' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    
    console.log('Fetching users with admin client...');

    // Use Supabase Admin Auth API to list users
    const { data: authData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: limit
    });

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users', details: usersError.message },
        { status: 500 }
      );
    }

    console.log('Users fetched successfully:', authData.users.length);

    // Filter users by email if search is provided
    let filteredUsers = authData.users;
    if (search) {
      filteredUsers = authData.users.filter(user => 
        user.email?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Transform the user data to match our AdminUser interface
    const users: AdminUser[] = filteredUsers.map(user => ({
      id: user.id,
      email: user.email || '',
      created_at: user.created_at,
      email_confirmed_at: user.email_confirmed_at,
      last_sign_in_at: user.last_sign_in_at
    }));

    const response = {
      users,
      pagination: {
        page,
        limit,
        total: authData.users.length,
        totalPages: Math.ceil(authData.users.length / limit)
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in admin users route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
