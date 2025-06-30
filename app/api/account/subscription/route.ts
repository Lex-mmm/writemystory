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
    // Get user subscription from database
    const { data: subscription, error } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching subscription:', error);
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
    }

    return NextResponse.json({
      subscription: subscription || null
    });

  } catch (error) {
    console.error('Error in subscription route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
