import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const resolvedParams = await params;
    const memberId = resolvedParams.id;

    if (!userId || !memberId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'User ID and Member ID are required' 
        },
        { status: 400 }
      );
    }

    console.log('Deleting team member:', memberId, 'for user:', userId);

    // Get the team member to find which project it belongs to
    const { data: teamMember, error: fetchError } = await supabaseAdmin
      .from('story_team_members')
      .select('id, story_id')
      .eq('id', memberId)
      .single();

    if (fetchError || !teamMember) {
      console.error('Error fetching team member:', fetchError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Team member not found' 
        },
        { status: 404 }
      );
    }

    // Check if user owns the project (using projects table, not stories)
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('user_id')
      .eq('id', teamMember.story_id)
      .single();

    if (projectError || !project || project.user_id !== userId) {
      console.error('Project access error:', projectError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Unauthorized: You can only delete team members from your own projects' 
        },
        { status: 403 }
      );
    }

    // Delete the team member
    const { error: deleteError } = await supabaseAdmin
      .from('story_team_members')
      .delete()
      .eq('id', memberId);

    if (deleteError) {
      console.error('Error deleting team member:', deleteError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to delete team member' 
        },
        { status: 500 }
      );
    }

    console.log('Successfully deleted team member:', memberId);
    return NextResponse.json(
      { 
        success: true,
        message: 'Team member deleted successfully' 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
