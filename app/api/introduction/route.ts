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

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { projectId, userId, introduction } = body;

    if (!projectId || !userId || !introduction) {
      return NextResponse.json({ 
        error: 'Project ID, User ID, and introduction are required' 
      }, { status: 400 });
    }

    console.log('Saving introduction for project:', projectId);

    // Set user context for RLS
    await setUserContext(userId);

    // First get the current project to preserve existing metadata
    const { data: currentProject, error: fetchError } = await supabase
      .from('projects')
      .select('metadata')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching current project:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch current project', 
        details: fetchError.message 
      }, { status: 500 });
    }

    // Merge introduction with existing metadata
    const updatedMetadata = {
      ...currentProject.metadata,
      introduction: introduction,
      introduction_date: new Date().toISOString()
    };

    // Update project with introduction
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error saving introduction:', updateError);
      return NextResponse.json({ 
        error: 'Failed to save introduction', 
        details: updateError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Introduction saved successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/introduction:', error);
    return NextResponse.json({ 
      error: 'Failed to save introduction', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const userId = searchParams.get('userId');

  if (!projectId || !userId) {
    return NextResponse.json({ 
      error: 'Project ID and User ID are required' 
    }, { status: 400 });
  }

  try {
    // Set user context for RLS
    await setUserContext(userId);

    // Get project with introduction
    const { data: project, error } = await supabase
      .from('projects')
      .select('metadata')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching introduction:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch introduction', 
        details: error.message 
      }, { status: 500 });
    }

    const introduction = project?.metadata?.introduction || '';

    return NextResponse.json({
      success: true,
      introduction
    });

  } catch (error) {
    console.error('Error in GET /api/introduction:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch introduction', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
