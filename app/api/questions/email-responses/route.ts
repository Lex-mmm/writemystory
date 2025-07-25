import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

// Save email response from team member
export async function POST(request: NextRequest) {
  try {
    const { 
      questionId, 
      storyId, 
      teamMemberEmail, 
      responseContent, 
      emailMessageId 
    } = await request.json();

    if (!questionId || !storyId || !teamMemberEmail || !responseContent) {
      return NextResponse.json(
        { error: 'Question ID, story ID, team member email, and response content are required' },
        { status: 400 }
      );
    }

    // Find the team member by email
    const { data: teamMember, error: memberError } = await supabaseAdmin
      .from('story_team_members')
      .select('id, name, email')
      .eq('story_id', storyId)
      .eq('email', teamMemberEmail)
      .single();

    if (memberError || !teamMember) {
      console.error('Team member not found:', memberError);
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    // Save the email response
    const { data: emailResponse, error: saveError } = await supabaseAdmin
      .from('email_responses')
      .insert({
        question_id: questionId,
        story_id: storyId,
        team_member_id: teamMember.id,
        team_member_name: teamMember.name,
        response_content: responseContent.trim(),
        email_message_id: emailMessageId,
        sender_email: teamMemberEmail,
        received_at: new Date().toISOString(),
        status: 'received'
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving email response:', saveError);
      return NextResponse.json(
        { error: 'Failed to save email response' },
        { status: 500 }
      );
    }

    console.log('Email response saved successfully:', emailResponse.id);

    return NextResponse.json({
      success: true,
      message: 'Email response saved successfully',
      responseId: emailResponse.id,
      teamMember: teamMember.name
    });

  } catch (error) {
    console.error('Error in email response route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Get email responses for a question or story
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');
    const storyId = searchParams.get('storyId');

    if (!questionId && !storyId) {
      return NextResponse.json(
        { error: 'Either question ID or story ID is required' },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from('email_responses')
      .select('*')
      .order('received_at', { ascending: false });

    if (questionId) {
      query = query.eq('question_id', questionId);
    } else if (storyId) {
      query = query.eq('story_id', storyId);
    }

    const { data: responses, error } = await query;

    if (error) {
      console.error('Error fetching email responses:', error);
      return NextResponse.json(
        { error: 'Failed to fetch email responses' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      responses: responses || []
    });

  } catch (error) {
    console.error('Error in email response GET route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update email response status
export async function PATCH(request: NextRequest) {
  try {
    const { responseId, status } = await request.json();

    if (!responseId || !status) {
      return NextResponse.json(
        { error: 'Response ID and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['received', 'reviewed', 'integrated'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const { data: updatedResponse, error: updateError } = await supabaseAdmin
      .from('email_responses')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', responseId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating email response status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update email response status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email response status updated successfully',
      response: updatedResponse
    });

  } catch (error) {
    console.error('Error in email response PATCH route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
