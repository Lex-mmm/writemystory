import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { validateAdminToken, createAdminErrorResponse, createAdminSuccessResponse } from '../../../../lib/adminAuth';
import { 
  AdminUser, 
  AdminQuestion, 
  AdminAnswer, 
  AdminUserDetails,
  AdminOverviewResponse,
  AdminOverviewStats
} from '../../../../lib/adminTypes';

export async function GET(request: NextRequest) {
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createAdminErrorResponse('Admin service not available during build', 503);
  }

  // Validate admin authentication
  const { isValid, error } = validateAdminToken(request);
  
  if (!isValid) {
    return createAdminErrorResponse(error || 'Unauthorized');
  }

  try {
    console.log('Admin overview request - starting data fetch...');
    
    // Get query parameters for filtering/pagination
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const includeProjects = searchParams.get('includeProjects') !== 'false';
    const includeActivity = searchParams.get('includeActivity') !== 'false';

    // Fetch all users using Supabase Admin Auth
    const { data: authData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return createAdminErrorResponse('Failed to fetch users data');
    }

    const users: AdminUser[] = authData.users.map(user => ({
      id: user.id,
      email: user.email || '',
      created_at: user.created_at,
      email_confirmed_at: user.email_confirmed_at,
      last_sign_in_at: user.last_sign_in_at,
      app_metadata: user.app_metadata,
      user_metadata: user.user_metadata
    }));

    // Fetch all projects
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      return createAdminErrorResponse('Failed to fetch projects data');
    }

    // Fetch all questions and answers if needed
    let questions: AdminQuestion[] = [];
    let answers: AdminAnswer[] = [];

    if (includeProjects && projects && projects.length > 0) {
      const { data: questionsData, error: questionsError } = await supabaseAdmin
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: answersData, error: answersError } = await supabaseAdmin
        .from('answers')
        .select('*')
        .order('created_at', { ascending: false });

      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
      } else {
        // Properly type the questions data
        questions = (questionsData || []).map(q => ({
          id: q.id,
          story_id: q.story_id,
          category: q.category,
          question: q.question,
          type: q.type,
          priority: q.priority,
          created_at: q.created_at
        }));
      }

      if (answersError) {
        console.error('Error fetching answers:', answersError);
      } else {
        // Properly type the answers data
        answers = (answersData || []).map(a => ({
          id: a.id,
          question_id: a.question_id,
          story_id: a.story_id,
          user_id: a.user_id,
          answer: a.answer,
          created_at: a.created_at,
          updated_at: a.updated_at
        }));
      }
    }

    // Calculate statistics
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const stats: AdminOverviewStats = {
      totalUsers: users.length,
      totalProjects: projects?.length || 0,
      totalQuestions: questions.length,
      totalAnswers: answers.length,
      recentSignups: users.filter(user => 
        new Date(user.created_at) >= sevenDaysAgo
      ).length,
      activeProjects: projects?.filter(p => p.status === 'active').length || 0,
      completedProjects: projects?.filter(p => p.status === 'completed').length || 0
    };

    // Enrich users with project data
    const userDetails: AdminUserDetails[] = users.slice(0, limit).map(user => {
      const userProjects = projects?.filter(p => p.user_id === user.id) || [];
      const userQuestions = questions.filter(q => 
        userProjects.some(p => p.id === q.story_id)
      );
      const userAnswers = answers.filter(a => a.user_id === user.id);
      
      const averageProgress = userProjects.length > 0
        ? userProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / userProjects.length
        : 0;

      return {
        ...user,
        projects: includeProjects ? userProjects : [],
        totalQuestions: userQuestions.length,
        totalAnswers: userAnswers.length,
        averageProgress: Math.round(averageProgress)
      };
    });

    // Recent activity data
    const recentActivity = includeActivity ? {
      newUsers: users
        .filter(user => new Date(user.created_at) >= sevenDaysAgo)
        .slice(0, 10),
      newProjects: (projects || [])
        .filter(project => new Date(project.created_at) >= sevenDaysAgo)
        .slice(0, 10),
      recentAnswers: answers
        .filter(answer => new Date(answer.created_at) >= sevenDaysAgo)
        .slice(0, 10)
    } : {
      newUsers: [],
      newProjects: [],
      recentAnswers: []
    };

    const response: AdminOverviewResponse = {
      stats,
      users: userDetails,
      recentActivity
    };

    console.log('Admin overview completed successfully');
    return createAdminSuccessResponse(response);

  } catch (error) {
    console.error('Error in admin overview route:', error);
    return createAdminErrorResponse(
      'Internal server error occurred while fetching admin data',
      500
    );
  }
}

// Additional helper endpoint for specific user data
export async function POST(request: NextRequest) {
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createAdminErrorResponse('Admin service not available during build', 503);
  }

  // Validate admin authentication
  const { isValid, error } = validateAdminToken(request);
  
  if (!isValid) {
    return createAdminErrorResponse(error || 'Unauthorized');
  }

  try {
    const body = await request.json();
    const { userId, includeFullData = false } = body;

    if (!userId) {
      return createAdminErrorResponse('User ID is required', 400);
    }

    // Get specific user data
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userError) {
      return createAdminErrorResponse('User not found', 404);
    }

    // Get user's projects
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('Error fetching user projects:', projectsError);
      return createAdminErrorResponse('Failed to fetch user projects');
    }

    let detailedData = {};
    
    if (includeFullData && projects && projects.length > 0) {
      const projectIds = projects.map(p => p.id);
      
      // Get questions and answers for user's projects
      const [questionsResult, answersResult] = await Promise.all([
        supabaseAdmin
          .from('questions')
          .select('*')
          .in('story_id', projectIds),
        supabaseAdmin
          .from('answers')
          .select('*')
          .eq('user_id', userId)
      ]);

      detailedData = {
        questions: (questionsResult.data || []).map(q => ({
          id: q.id,
          story_id: q.story_id,
          category: q.category,
          question: q.question,
          type: q.type,
          priority: q.priority,
          created_at: q.created_at
        })),
        answers: (answersResult.data || []).map(a => ({
          id: a.id,
          question_id: a.question_id,
          story_id: a.story_id,
          user_id: a.user_id,
          answer: a.answer,
          created_at: a.created_at,
          updated_at: a.updated_at
        }))
      };
    }

    const userDetails = {
      id: userData.user.id,
      email: userData.user.email || '',
      created_at: userData.user.created_at,
      email_confirmed_at: userData.user.email_confirmed_at,
      last_sign_in_at: userData.user.last_sign_in_at,
      projects: projects || [],
      ...detailedData
    };

    return createAdminSuccessResponse(userDetails);

  } catch (error) {
    console.error('Error in admin user detail route:', error);
    return createAdminErrorResponse(
      'Internal server error occurred while fetching user data',
      500
    );
  }
}
