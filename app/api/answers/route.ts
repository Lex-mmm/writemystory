import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

// Helper function to set user context for RLS
async function setUserContext(userId: string) {
  try {
    await supabase.rpc('set_config', {
      setting_name: 'app.current_user_id',
      setting_value: userId,
      is_local: true
    });
  } catch (error) {
    console.error('Error setting user context:', error);
  }
}

// Submit an answer to a question
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    console.error('Supabase not configured properly');
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { 
      questionId, 
      storyId, 
      userId, 
      answer, 
      status = 'answered', 
      skipReason 
    }: {
      questionId: string;
      storyId: string;
      userId: string;
      answer?: string;
      status?: string;
      skipReason?: string;
    } = body;

    if (!questionId || !storyId || !userId) {
      return NextResponse.json({ 
        error: 'Question ID, Story ID, and User ID are required' 
      }, { status: 400 });
    }

    // For skipped questions, we don't require an answer
    if (status !== 'skipped' && !answer?.trim()) {
      return NextResponse.json({ 
        error: 'Answer is required for non-skipped questions' 
      }, { status: 400 });
    }

    console.log('Submitting answer for question:', questionId);

    // Set user context for RLS
    await setUserContext(userId);

    // Check if answer already exists
    const { data: existingAnswer, error: checkError } = await supabase
      .from('answers')
      .select('id')
      .eq('question_id', questionId)
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing answer:', checkError);
    }

    // Prepare answer data with status column
    const answerData: Record<string, unknown> = {
      question_id: questionId,
      story_id: storyId,
      user_id: userId,
      answer: answer?.trim() || '',
      status: status, // Now using the status column properly
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add skip reason if provided
    if (status === 'skipped' && skipReason) {
      answerData.skip_reason = skipReason;
    }

    let result;
    if (existingAnswer) {
      // Update existing answer
      const { data, error: updateError } = await supabase
        .from('answers')
        .update(answerData)
        .eq('id', existingAnswer.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating answer:', updateError);
        return NextResponse.json({ 
          error: 'Failed to update answer', 
          details: updateError.message 
        }, { status: 500 });
      }
      result = data;
    } else {
      // Insert new answer
      const { data, error: insertError } = await supabase
        .from('answers')
        .insert(answerData)
        .select()
        .single();

      if (insertError) {
        console.error('Error saving answer:', insertError);
        return NextResponse.json({ 
          error: 'Failed to save answer', 
          details: insertError.message 
        }, { status: 500 });
      }
      result = data;
    }

    // Update question status in a separate table or handle it differently
    if (status === 'skipped') {
      // For now, we'll handle skipped questions by updating the question itself
      await supabase
        .from('questions')
        .update({ 
          // Add any metadata we can to track skipped status
          updated_at: new Date().toISOString()
        })
        .eq('id', questionId);
    }

    // Update project progress
    await updateProjectProgress(storyId);

    return NextResponse.json({
      success: true,
      answer: result,
      message: status === 'skipped' ? 'Question skipped successfully' : 'Answer saved successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/answers:', error);
    return NextResponse.json({ 
      error: 'Failed to save answer', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Get answers for a story
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    console.error('Supabase not configured properly');
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const storyId = searchParams.get('storyId');
  const userId = searchParams.get('userId');

  if (!storyId || !userId) {
    return NextResponse.json({ 
      error: 'Story ID and User ID are required' 
    }, { status: 400 });
  }

  try {
    // Set user context for RLS
    await setUserContext(userId);

    const { data: answers, error } = await supabase
      .from('answers')
      .select('*')
      .eq('story_id', storyId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching answers:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch answers', 
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ answers: answers || [] });

  } catch (error) {
    console.error('Error in GET /api/answers:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch answers', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Update project progress based on answers
async function updateProjectProgress(storyId: string) {
  try {
    // Get total questions for this story
    const { data: allQuestions, error: questionsError } = await supabase
      .from('questions')
      .select('id')
      .eq('story_id', storyId);

    if (questionsError) {
      console.error('Error fetching questions for progress:', questionsError);
      return;
    }

    // Get answered questions
    const { data: answeredQuestions, error: answersError } = await supabase
      .from('answers')
      .select('question_id')
      .eq('story_id', storyId);

    if (answersError) {
      console.error('Error fetching answers for progress:', answersError);
      return;
    }

    const totalQuestions = allQuestions?.length || 0;
    const answeredCount = answeredQuestions?.length || 0;
    const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 15;

    // Update project progress
    await supabase
      .from('projects')
      .update({ 
        progress: Math.max(progress, 15), // Minimum 15% progress
        updated_at: new Date().toISOString()
      })
      .eq('id', storyId);

  } catch (error) {
    console.error('Error updating project progress:', error);
  }
}
