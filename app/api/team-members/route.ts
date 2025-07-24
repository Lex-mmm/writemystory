import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

// Get team members for a story
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const storyId = searchParams.get('storyId');
  const userId = searchParams.get('userId');

  if (!storyId || !userId) {
    return NextResponse.json(
      { error: 'Story ID and User ID are required' },
      { status: 400 }
    );
  }

  try {
    // First, verify that the user owns this story using admin client
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('user_id')
      .eq('id', storyId)
      .single();

    if (projectError || !project) {
      console.error('Error fetching project:', projectError);
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (project.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not own this project' },
        { status: 403 }
      );
    }

    // Get team members using admin client
    const { data: teamMembers, error } = await supabaseAdmin
      .from('story_team_members')
      .select('*')
      .eq('story_id', storyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching team members:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch team members' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      teamMembers: teamMembers || [] 
    });
  } catch (error) {
    console.error('Error in team members GET route:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add a new team member to a story
export async function POST(request: NextRequest) {
  try {
    const { storyId, userId, name, phoneNumber, email, role } = await request.json();

    if (!storyId || !userId || !name || !role) {
      return NextResponse.json(
        { error: 'Story ID, User ID, name and role are required' },
        { status: 400 }
      );
    }

    // Require at least one contact method (WhatsApp or email)
    if (!phoneNumber && !email) {
      return NextResponse.json(
        { error: 'At least one contact method (WhatsApp number or email) is required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['author', 'family', 'friend', 'collaborator'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // First, verify that the user owns this story using admin client
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('user_id')
      .eq('id', storyId)
      .single();

    if (projectError || !project) {
      console.error('Error fetching project:', projectError);
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (project.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not own this project' },
        { status: 403 }
      );
    }

    // Note: Removed duplicate phone number check to allow multiple team members with same number

    // Insert new team member using admin client (bypasses RLS)
    const { data: teamMember, error } = await supabaseAdmin
      .from('story_team_members')
      .insert({
        story_id: storyId,
        name,
        phone_number: phoneNumber || null,
        email: email || null,
        role,
        status: 'active',
        invited_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding team member:', error);
      return NextResponse.json(
        { error: 'Failed to add team member' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      teamMember,
      message: 'Team member added successfully'
    });
  } catch (error) {
    console.error('Error in team members POST route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a team member
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get('memberId');
  const userId = searchParams.get('userId');

  if (!memberId || !userId) {
    return NextResponse.json(
      { success: false, error: 'Member ID and User ID are required' },
      { status: 400 }
    );
  }

  try {
    // First, get the team member to verify ownership
    const { data: member, error: memberError } = await supabaseAdmin
      .from('story_team_members')
      .select('story_id')
      .eq('id', memberId)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { success: false, error: 'Team member not found' },
        { status: 404 }
      );
    }

    // Verify that the user owns the story
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('user_id')
      .eq('id', member.story_id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    if (project.user_id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You do not own this project' },
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
        { success: false, error: 'Failed to delete team member' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Team member deleted successfully'
    });
  } catch (error) {
    console.error('Error in team members DELETE route:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

