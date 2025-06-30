import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { validateAdminToken, createAdminErrorResponse, createAdminSuccessResponse } from '../../../../lib/adminAuth';
import { AdminProjectDetails } from '../../../../lib/adminTypes';

export async function GET(request: NextRequest) {
  // Skip during build time or when admin service is not available
  if (process.env.NEXT_PHASE === 'phase-production-build' || 
      process.env.NODE_ENV === 'production' && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: 'Admin service not available during build' }, { status: 503 });
  }

  // Validate admin authentication
  const { isValid, error } = validateAdminToken(request);
  
  if (!isValid) {
    return createAdminErrorResponse(error || 'Unauthorized');
  }

  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');
    const includeContent = searchParams.get('includeContent') !== 'false';
    
    let query = supabaseAdmin
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by specific project or user
    if (projectId) {
      query = query.eq('id', projectId);
    } else if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: projects, error: projectsError } = await query;

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      return createAdminErrorResponse('Failed to fetch projects');
    }

    if (!projects || projects.length === 0) {
      return createAdminSuccessResponse([]);
    }

    // If we don't need content, return projects as-is
    if (!includeContent) {
      return createAdminSuccessResponse(projects);
    }

    // Fetch questions and answers for each project
    const projectIds = projects.map(p => p.id);
    
    const [questionsResult, answersResult] = await Promise.all([
      supabaseAdmin
        .from('questions')
        .select('*')
        .in('story_id', projectIds)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('answers')
        .select('*')
        .in('story_id', projectIds)
        .order('created_at', { ascending: false })
    ]);

    const questions = questionsResult.data || [];
    const answers = answersResult.data || [];

    // Enrich projects with their questions and answers
    const enrichedProjects: AdminProjectDetails[] = projects.map(project => ({
      ...project,
      questions: questions.filter(q => q.story_id === project.id),
      answers: answers.filter(a => a.story_id === project.id)
    }));

    return createAdminSuccessResponse(enrichedProjects);

  } catch (error) {
    console.error('Error in admin projects route:', error);
    return createAdminErrorResponse(
      'Internal server error occurred while fetching projects',
      500
    );
  }
}
