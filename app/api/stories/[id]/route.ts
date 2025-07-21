import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '../../../../lib/supabase';

// Test function to verify route is working
export async function OPTIONS() {
  console.log('OPTIONS request received for stories/[id]');
  return NextResponse.json({ message: 'Route is active' }, { status: 200 });
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
    
    // Use service role client to bypass RLS
    if (!supabaseAdmin) {
      console.error('Service role client not available');
      return NextResponse.json({ error: 'Service role client not configured' }, { status: 500 });
    }

    // Get the specific project using service role
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching project:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch project', 
        details: error.message 
      }, { status: 500 });
    }

    if (!projects || projects.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = projects[0];

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
  console.log('=== DELETE ENDPOINT CALLED ===');
  console.log('Request URL:', request.url);
  console.log('Request method:', request.method);
  
  if (!isSupabaseConfigured()) {
    console.error('Supabase not configured properly');
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Service role key not configured');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }
  
  if (!supabaseAdmin) {
    console.error('Service role client not available');
    return NextResponse.json({ error: 'Service role client not configured' }, { status: 500 });
  }
  
  try {
    const { id: projectId } = await params;
    console.log('Project ID from params:', projectId);
    
    // Get user ID from query params first, then try request body
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('userId');
    console.log('User ID from query params:', userId);
    
    // If not in query params, try to get from request body
    if (!userId) {
      try {
        const body = await request.json();
        console.log('Request body:', body);
        userId = body.userId;
        console.log('User ID from body:', userId);
      } catch (error) {
        console.error('Error parsing request body:', error);
      }
    }

    if (!userId) {
      console.error('No user ID provided in delete request');
      return NextResponse.json({ 
        error: 'User ID is required for deletion' 
      }, { status: 400 });
    }
    
    console.log('Deleting project:', projectId, 'for user:', userId);

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      console.error('Invalid project ID format:', projectId);
      return NextResponse.json({ 
        error: 'Invalid project ID format',
        details: `Project ID must be a valid UUID, received: ${projectId}`
      }, { status: 400 });
    }

    if (!uuidRegex.test(userId)) {
      console.error('Invalid user ID format:', userId);
      return NextResponse.json({ 
        error: 'Invalid user ID format',
        details: `User ID must be a valid UUID, received: ${userId}`
      }, { status: 400 });
    }

    // Use service role client to bypass RLS and verify project ownership
    console.log('Verifying project ownership with service role...');
    const { data: projects, error: verifyError } = await supabaseAdmin
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .eq('user_id', userId);

    console.log('Project verification result:', { projects, verifyError });

    if (verifyError) {
      console.error('Error verifying project ownership:', verifyError);
      return NextResponse.json({ 
        error: 'Failed to verify project ownership',
        details: verifyError.message,
        debug: { projectId, userId, verifyError }
      }, { status: 500 });
    }

    if (!projects || projects.length === 0) {
      console.error('Project not found or access denied for project:', projectId, 'user:', userId);
      
      // Since the project doesn't exist in the database, return a special response
      // that tells the frontend to clean up localStorage
      return NextResponse.json({ 
        error: 'Project not found in database - it may have been deleted or never properly saved',
        details: `Project ${projectId} not found for user ${userId}`,
        shouldCleanupLocalStorage: true,
        projectId: projectId,
        debug: { projectId, userId, projects }
      }, { status: 404 });
    }

    console.log('Project ownership verified, proceeding with deletion using service role...');

    // Delete dependent records first using service role (bypasses RLS)
    console.log('Step 1: Deleting answers...');
    const { error: answersError } = await supabaseAdmin
      .from('answers')
      .delete()
      .eq('story_id', projectId);

    if (answersError) {
      console.log('Answers deletion result:', answersError);
      // Continue anyway - this might be expected if no answers exist
    } else {
      console.log('Answers deleted successfully');
    }

    console.log('Step 2: Deleting questions...');
    const { error: questionsError } = await supabaseAdmin
      .from('questions')
      .delete()
      .eq('story_id', projectId);

    if (questionsError) {
      console.log('Questions deletion result:', questionsError);
      // Continue anyway - this might be expected if no questions exist
    } else {
      console.log('Questions deleted successfully');
    }

    console.log('Step 3: Deleting project...');
    const { data: deletedProjects, error: deleteError } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId)
      .select();

    console.log('Project deletion result:', { deletedProjects, deleteError });

    if (deleteError) {
      console.error('Error deleting project:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete project', 
        details: deleteError.message,
        debug: {
          projectId,
          userId,
          deletedProjects,
          deleteError
        }
      }, { status: 500 });
    }

    if (!deletedProjects || deletedProjects.length === 0) {
      console.warn('No project deleted. Project may not exist or user does not have permission.', {
        projectId,
        userId,
        deletedProjects
      });
      return NextResponse.json({ 
        error: 'Project not found or you do not have permission to delete this project',
        details: `No project with ID ${projectId} found for user ${userId}`,
        debug: {
          projectId,
          userId,
          deletedProjects
        }
      }, { status: 404 });
    }

    console.log('Project deleted successfully:', projectId, 'Deleted project data:', deletedProjects[0]);

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
      deletedProject: deletedProjects[0],
      debug: {
        projectId,
        userId,
        deletedProjects
      }
    });
    
  } catch (error) {
    console.error('Error in DELETE test:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: 'DELETE endpoint error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
