import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

// Update question tracking information
export async function POST(request: NextRequest) {
  try {
    const { questionId, teamMemberName, method, storyId } = await request.json();

    if (!questionId || !teamMemberName || !method || !storyId) {
      return NextResponse.json(
        { error: 'Question ID, team member name, method, and story ID are required' },
        { status: 400 }
      );
    }

    // First, get the current question data
    const { data: question, error: fetchError } = await supabaseAdmin
      .from('questions')
      .select('forwarded_to, forwarded_count, forwarded_at, last_forwarded_method')
      .eq('id', questionId)
      .single();

    if (fetchError) {
      console.error('Error fetching question:', fetchError);
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Parse existing forwarded_to as array or initialize as empty array
    let forwardedTo: string[] = [];
    try {
      if (question.forwarded_to) {
        forwardedTo = typeof question.forwarded_to === 'string' 
          ? JSON.parse(question.forwarded_to)
          : question.forwarded_to;
      }
    } catch {
      console.log('Could not parse forwarded_to, treating as new array');
    }

    // Add the new team member if not already present
    if (!forwardedTo.includes(teamMemberName)) {
      forwardedTo.push(teamMemberName);
    }

    // Update the question with tracking information
    const { data: updatedQuestion, error: updateError } = await supabaseAdmin
      .from('questions')
      .update({
        forwarded_to: JSON.stringify(forwardedTo),
        forwarded_at: new Date().toISOString(),
        forwarded_count: (question.forwarded_count || 0) + 1,
        last_forwarded_method: method
      })
      .eq('id', questionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating question tracking:', updateError);
      return NextResponse.json(
        { error: 'Failed to update tracking information' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Question tracking updated successfully',
      tracking: {
        forwarded_to: forwardedTo,
        forwarded_at: updatedQuestion.forwarded_at,
        forwarded_count: updatedQuestion.forwarded_count,
        last_forwarded_method: updatedQuestion.last_forwarded_method
      }
    });

  } catch (error) {
    console.error('Error in question tracking route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Get question tracking information
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');

    if (!questionId) {
      return NextResponse.json(
        { error: 'Question ID is required' },
        { status: 400 }
      );
    }

    const { data: question, error } = await supabaseAdmin
      .from('questions')
      .select('forwarded_to, forwarded_count, forwarded_at, last_forwarded_method')
      .eq('id', questionId)
      .single();

    if (error) {
      console.error('Error fetching question tracking:', error);
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Parse forwarded_to array
    let forwardedTo: string[] = [];
    try {
      if (question.forwarded_to) {
        forwardedTo = typeof question.forwarded_to === 'string' 
          ? JSON.parse(question.forwarded_to)
          : question.forwarded_to;
      }
    } catch {
      console.log('Could not parse forwarded_to');
    }

    return NextResponse.json({
      success: true,
      tracking: {
        forwarded_to: forwardedTo,
        forwarded_at: question.forwarded_at,
        forwarded_count: question.forwarded_count || 0,
        last_forwarded_method: question.last_forwarded_method
      }
    });

  } catch (error) {
    console.error('Error in question tracking GET route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
