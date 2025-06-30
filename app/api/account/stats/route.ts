import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  // Build-time protection
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Supabase service role key not available');
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    // Get user from auth
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userError) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's projects count
    const { count: projectsCount, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get user's answers count
    const { count: answersCount, error: answersError } = await supabaseAdmin
      .from('answers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (projectsError || answersError) {
      console.error('Error fetching stats:', { projectsError, answersError });
    }

    const stats = {
      totalProjects: projectsCount || 0,
      totalAnswers: answersCount || 0,
      accountCreated: userData.user.created_at
    };

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Error in stats route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
