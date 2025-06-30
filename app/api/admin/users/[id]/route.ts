import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { validateAdminToken, createAdminErrorResponse, createAdminSuccessResponse } from '../../../../../lib/adminAuth';

// Use Promise<Record<string, string | string[]>> for params to match Next.js App Router expectations
export async function GET(
  request: NextRequest,
  context: { params: Promise<Record<string, string | string[]>> }
) {
  const params = await context.params;
  const userId = Array.isArray(params.id) ? params.id[0] : params.id;

  // Validate admin authentication
  const { isValid, error } = validateAdminToken(request);
  
  if (!isValid) {
    return createAdminErrorResponse(error || 'Unauthorized');
  }

  try {

    if (!userId) {
      return createAdminErrorResponse('User ID is required', 400);
    }

    // Get specific user data
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userError) {
      console.error('Error fetching user:', userError);
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

    // Get questions and answers for user's projects if they exist
    let questions = [];
    let answers = [];

    if (projects && projects.length > 0) {
      const projectIds = projects.map(p => p.id);
      
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

      questions = questionsResult.data || [];
      answers = answersResult.data || [];
    }

    const userDetails = {
      id: userData.user.id,
      email: userData.user.email || '',
      created_at: userData.user.created_at,
      email_confirmed_at: userData.user.email_confirmed_at,
      last_sign_in_at: userData.user.last_sign_in_at,
      app_metadata: userData.user.app_metadata,
      user_metadata: userData.user.user_metadata,
      projects: projects || [],
      questions,
      answers,
      stats: {
        totalProjects: projects?.length || 0,
        totalQuestions: questions.length,
        totalAnswers: answers.length,
        averageProgress: projects && projects.length > 0
          ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
          : 0
      }
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

export async function PUT(
  request: NextRequest,
  context: { params: Promise<Record<string, string | string[]>> }
) {
  const params = await context.params;
  const userId = Array.isArray(params.id) ? params.id[0] : params.id;

  // Validate admin authentication
  const { isValid, error } = validateAdminToken(request);
  
  if (!isValid) {
    return createAdminErrorResponse(error || 'Unauthorized');
  }

  try {
    const body = await request.json();
    const { action, ...updateData } = body;

    if (!userId) {
      return createAdminErrorResponse('User ID is required', 400);
    }

    if (action === 'disable') {
      // Disable user account
      const { error: disableError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { 
          ...updateData.user_metadata,
          disabled: true,
          disabled_at: new Date().toISOString()
        }
      });

      if (disableError) {
        console.error('Error disabling user:', disableError);
        return createAdminErrorResponse('Failed to disable user');
      }

      return createAdminSuccessResponse({ message: 'User disabled successfully' });
    }

    if (action === 'enable') {
      // Enable user account
      const { error: enableError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { 
          ...updateData.user_metadata,
          disabled: false,
          enabled_at: new Date().toISOString()
        }
      });

      if (enableError) {
        console.error('Error enabling user:', enableError);
        return createAdminErrorResponse('Failed to enable user');
      }

      return createAdminSuccessResponse({ message: 'User enabled successfully' });
    }

    // General user update
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email: updateData.email,
      user_metadata: updateData.user_metadata,
      app_metadata: updateData.app_metadata
    });

    if (updateError) {
      console.error('Error updating user:', updateError);
      return createAdminErrorResponse('Failed to update user');
    }

    return createAdminSuccessResponse(updatedUser);

  } catch (error) {
    console.error('Error in admin user update route:', error);
    return createAdminErrorResponse(
      'Internal server error occurred while updating user',
      500
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<Record<string, string | string[]>> }
) {
  const params = await context.params;
  const userId = Array.isArray(params.id) ? params.id[0] : params.id;

  // Validate admin authentication
  const { isValid, error } = validateAdminToken(request);
  
  if (!isValid) {
    return createAdminErrorResponse(error || 'Unauthorized');
  }

  try {

    if (!userId) {
      return createAdminErrorResponse('User ID is required', 400);
    }

    // Delete user account (this will cascade delete related data due to foreign key constraints)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return createAdminErrorResponse('Failed to delete user');
    }

    return createAdminSuccessResponse({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Error in admin user delete route:', error);
    return createAdminErrorResponse(
      'Internal server error occurred while deleting user',
      500
    );
  }
}

