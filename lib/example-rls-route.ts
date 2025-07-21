// Example of updating the stories API route to use RLS
// This shows the key changes needed after applying security fixes

import { NextRequest, NextResponse } from 'next/server';
import { withRLS, executeWithUserContext } from './rlsHelper';
import { SupabaseClient } from '@supabase/supabase-js';

// GET /api/stories - Fetch user's projects
export const GET = withRLS(async (client: SupabaseClient, userId: string) => {
  try {
    console.log('Fetching projects for user:', userId);
    const { data: projects, error } = await client
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      );
    }

    return NextResponse.json({ stories: projects || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/stories - Create a new project
export const POST = withRLS(async (client: SupabaseClient, userId: string, request: Request) => {
  try {
    const body = await request.json();
    
    // Prepare project data
    const projectData = {
      user_id: userId,
      person_name: body.personName || 'Untitled Story',
      subject_type: body.subjectType || 'self',
      period_type: body.periodType || 'fullLife',
      writing_style: body.writingStyle || 'neutral',
      status: 'active',
      progress: 10,
      metadata: {
        email: body.email,
        birth_year: body.birthYear,
        relationship: body.relationship,
        is_deceased: body.isDeceased,
        passed_away_year: body.passedAwayYear,
        collaborators: body.collaborators,
        collaborator_emails: body.collaboratorEmails,
        period_details: {
          start_year: body.startYear,
          end_year: body.endYear,
          theme: body.theme
        },
        communication_methods: body.communicationMethods,
        delivery_format: body.deliveryFormat,
        additional_info: body.additionalInfo,
        include_whatsapp_chat: body.includeWhatsappChat
      }
    };

    // Insert the project - RLS will ensure it's associated with the correct user
    const { data: project, error } = await client
      .from('projects')
      .insert(projectData)
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: project.id,
      story: project,
      message: 'Project created successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// Alternative approach using the helper function
export const GET_ALTERNATIVE = async (request: NextRequest) => {
  try {
    // Extract user ID from auth header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authHeader.replace('Bearer ', '');

    // Execute query with user context
    const projects = await executeWithUserContext(userId, async (client: SupabaseClient) => {
      const { data, error } = await client
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    });

    return NextResponse.json({ stories: projects || [] });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
};
