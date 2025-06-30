import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '../../../../lib/supabase';

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

// Get a specific project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    console.error('Supabase not configured properly');
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const { id: projectId } = await params;
    
    // Set user context for RLS
    await setUserContext(userId);

    // Get the specific project
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching project:', error);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Transform database format to frontend format
    const transformedProject = {
      id: project.id,
      personName: project.person_name || "Mijn verhaal",
      subjectType: project.subject_type,
      periodType: project.period_type,
      writingStyle: project.writing_style,
      createdAt: project.created_at,
      status: project.status,
      progress: project.progress || 15
    };

    return NextResponse.json(transformedProject);
  } catch (error) {
    console.error('Error in GET /api/stories/[id]:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch project', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Delete a specific project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    console.error('Supabase not configured properly');
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  try {
    const { id: projectId } = await params;
    
    // Get user ID from Authorization header or request body
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('userId');
    
    if (!userId) {
      const body = await request.text();
      if (body) {
        try {
          const parsedBody = JSON.parse(body);
          userId = parsedBody.userId;
        } catch {
          // Not JSON or no userId in body
        }
      }
    }

    if (!userId) {
      console.error('No user ID provided in delete request');
      return NextResponse.json({ 
        error: 'User ID is required for deletion' 
      }, { status: 400 });
    }

    console.log('Deleting project:', projectId, 'for user:', userId);

    // Set user context for RLS
    await setUserContext(userId);

    // First, check if the project exists and belongs to the user
    const { data: project, error: checkError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (checkError || !project) {
      console.error('Project not found or access denied:', checkError);
      return NextResponse.json({ 
        error: 'Project not found or access denied',
        details: `Project ${projectId} not found for user ${userId}`
      }, { status: 404 });
    }

    // Delete associated answers first
    const { error: answersError } = await supabase
      .from('answers')
      .delete()
      .eq('story_id', projectId);

    if (answersError) {
      console.error('Error deleting answers:', answersError);
    }

    // Delete associated questions
    const { error: questionsError } = await supabase
      .from('questions')
      .delete()
      .eq('story_id', projectId);

    if (questionsError) {
      console.error('Error deleting questions:', questionsError);
    }

    // Finally, delete the project
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting project:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete project', 
        details: deleteError.message 
      }, { status: 500 });
    }

    console.log('Project deleted successfully:', projectId);

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/stories/[id]:', error);
    return NextResponse.json({ 
      error: 'Failed to delete project', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
