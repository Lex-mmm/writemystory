import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

// Helper function to set user context for RLS (same as in questions route)
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

// Helper function to create tables if they don't exist
async function createTablesIfNeeded() {
  try {
    // Create the projects table directly with SQL
    const { error: createError } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS projects (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id TEXT NOT NULL,
          person_name TEXT,
          subject_type TEXT NOT NULL,
          period_type TEXT NOT NULL,
          writing_style TEXT NOT NULL,
          status TEXT DEFAULT 'active',
          progress INTEGER DEFAULT 15,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
      `
    });
    
    if (createError) {
      console.error('Error creating table with RPC:', createError);
      // Try alternative method - direct table creation
      await createTableDirectly();
    }
    
    return true;
  } catch (error) {
    console.error('Error in createTablesIfNeeded:', error);
    return false;
  }
}

async function createTableDirectly() {
  try {
    // Try to create table using direct SQL execution
    const { error } = await supabase
      .rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS projects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT NOT NULL,
            person_name TEXT,
            subject_type TEXT NOT NULL,
            period_type TEXT NOT NULL,
            writing_style TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            progress INTEGER DEFAULT 15,
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
        `
      });
      
    if (error) {
      console.error('Error creating table directly:', error);
    }
  } catch (error) {
    console.error('Error in createTableDirectly:', error);
  }
}

export async function GET(request: NextRequest) {
  // Check if Supabase is properly configured
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
    console.log('Fetching projects for user:', userId);
    
    // Set user context for RLS
    await setUserContext(userId);

    // Get projects for this user from Supabase
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching projects:', error);
      
      // If it's a table doesn't exist error, try to create it and return empty array
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.log('Projects table does not exist, attempting to create it...');
        
        // Try to create the table
        await createTablesIfNeeded();
        
        // Return empty array for now - user can try again
        return NextResponse.json([]);
      }
      
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    console.log('Found projects:', projects?.length || 0);

    // Transform database format to frontend format
    const transformedProjects = projects?.map(project => ({
      id: project.id,
      personName: project.person_name || "Mijn verhaal",
      subjectType: project.subject_type,
      periodType: project.period_type,
      writingStyle: project.writing_style,
      createdAt: project.created_at,
      status: project.status,
      progress: project.progress || 15
    })) || [];

    return NextResponse.json(transformedProjects);
  } catch (error) {
    console.error('Error in GET /api/stories:', error);
    
    // If it's a connection error, try to create tables
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('does not exist') || errorMessage.includes('42P01')) {
      await createTablesIfNeeded();
      return NextResponse.json([]);
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch projects', 
      details: errorMessage 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Check if Supabase is properly configured
  if (!isSupabaseConfigured()) {
    console.error('Supabase not configured properly');
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const {
      userId,
      email,
      subjectType,
      personName,
      birthYear,
      relationship,
      collaborators,
      collaboratorEmails,
      periodType,
      startYear,
      endYear,
      theme,
      writingStyle,
      communicationMethods,
      deliveryFormat
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('Creating project for user:', userId);

    // Set user context for RLS
    await setUserContext(userId);

    // Insert project into Supabase
    const { data: project, error: insertError } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        person_name: subjectType === "other" ? personName : null,
        subject_type: subjectType,
        period_type: periodType,
        writing_style: writingStyle,
        status: 'active',
        progress: 15,
        // Store additional data as JSON
        metadata: {
          birthYear,
          relationship,
          collaborators,
          collaboratorEmails,
          startYear,
          endYear,
          theme,
          communicationMethods,
          deliveryFormat,
          email
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting project:', insertError);
      
      // If it's a table doesn't exist error, try to create it first
      if (insertError.code === '42P01' || insertError.message.includes('does not exist')) {
        console.log('Projects table does not exist, attempting to create it...');
        await createTablesIfNeeded();
        
        return NextResponse.json({ 
          error: 'Database was not initialized. Tables have been created. Please try creating your project again.',
          shouldRetry: true
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        error: 'Failed to create project', 
        details: insertError.message 
      }, { status: 500 });
    }

    console.log('Project created successfully:', project.id);

    // Transform the response to match frontend expectations
    const transformedProject = {
      id: project.id,
      personName: project.person_name || "Mijn verhaal",
      subjectType: project.subject_type,
      periodType: project.period_type,
      writingStyle: project.writing_style,
      createdAt: project.created_at,
      status: project.status,
      progress: project.progress,
      // Include original form data
      ...body
    };

    return NextResponse.json({
      success: true,
      id: project.id,
      message: 'Project created successfully',
      story: transformedProject
    });
  } catch (error) {
    console.error('Error in POST /api/stories:', error);
    return NextResponse.json({ 
      error: 'Failed to create project', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
