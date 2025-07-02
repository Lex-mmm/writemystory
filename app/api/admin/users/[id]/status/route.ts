import { NextRequest, NextResponse } from 'next/server';
import { validateAdminAccess } from '../../../../../../middleware/adminAuth';
import { supabaseAdmin } from '../../../../../../lib/supabaseAdmin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const authResult = validateAdminAccess(request);
    if (!authResult.isValid) {
      return authResult.error!;
    }

    const { action } = await request.json();
    const { id: userId } = await params;

    if (!action || !['disable', 'enable'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Update user status in Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        ban_duration: action === 'disable' ? '876000h' : 'none', // ~100 years or none
      }
    );

    if (error) {
      console.error('Error updating user status:', error);
      return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `User ${action}d successfully`,
      user: data.user
    });

  } catch (error) {
    console.error('Error in user status update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
