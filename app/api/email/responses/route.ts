import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get('storyId');

    if (!storyId) {
      return NextResponse.json(
        { error: 'Story ID is required' },
        { status: 400 }
      );
    }

    // Get all email responses for this story
    const { data: responses, error } = await supabaseAdmin
      .from('story_question_responses')
      .select(`
        id,
        question_id,
        story_id,
        team_member_id,
        team_member_name,
        response_content,
        email_message_id,
        created_at,
        updated_at,
        status
      `)
      .eq('story_id', storyId)
      .order('created_at', { ascending: false });

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
    console.error('Error in email responses API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { responseId, status } = await request.json();

    if (!responseId || !status) {
      return NextResponse.json(
        { error: 'Response ID and status are required' },
        { status: 400 }
      );
    }

    // Update the response status
    const { data: updatedResponse, error: updateError } = await supabaseAdmin
      .from('story_question_responses')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', responseId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating response status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update response status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      response: updatedResponse
    });

  } catch (error) {
    console.error('Error updating email response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
