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
        { error: 'Failed to fetch team members' },
        { status: 500 }
      );
    }

    return NextResponse.json({ teamMembers: teamMembers || [] });
  } catch (error) {
    console.error('Error in team members GET route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add a new team member to a story
export async function POST(request: NextRequest) {
  try {
    const { storyId, userId, name, phoneNumber, role } = await request.json();

    if (!storyId || !userId || !name || !phoneNumber || !role) {
      return NextResponse.json(
        { error: 'All fields are required' },
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

    // Check if phone number already exists for this story using admin client
    const { data: existingMember } = await supabaseAdmin
      .from('story_team_members')
      .select('id')
      .eq('story_id', storyId)
      .eq('phone_number', phoneNumber)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: 'This phone number is already added to this story' },
        { status: 409 }
      );
    }

    // Insert new team member using admin client (bypasses RLS)
    const { data: teamMember, error } = await supabaseAdmin
      .from('story_team_members')
      .insert({
        story_id: storyId,
        name,
        phone_number: phoneNumber,
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

