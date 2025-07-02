import { NextRequest, NextResponse } from 'next/server';
import { validateAdminAccess } from '../../../../middleware/adminAuth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

/* eslint-disable @typescript-eslint/no-explicit-any, prefer-const */

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = validateAdminAccess(request);
    if (!authResult.isValid) {
      return authResult.error!;
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const contentType = searchParams.get('type') || 'all'; // 'answers', 'stories', 'questions', 'all'

    let content: Array<{
      id: string;
      type: string;
      content: string;
      created_at: string;
      user: Record<string, unknown> | null;
      question?: string;
      metadata?: Record<string, unknown>;
    }> = [];

    if (contentType === 'answers' || contentType === 'all') {
      // Get recent answers with user info
      const { data: answers, error: answersError } = await supabaseAdmin
        .from('answers')
        .select(`
          id,
          answer,
          created_at,
          question_id,
          questions(question),
          profiles(
            id,
            user_id,
            name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(contentType === 'answers' ? limit : Math.floor(limit / 3))
        .range(offset, offset + (contentType === 'answers' ? limit : Math.floor(limit / 3)) - 1);

      if (!answersError && answers) {
        content.push(...answers.map((answer: any) => ({
          id: answer.id as string,
          type: 'answer',
          content: answer.answer as string,
          created_at: answer.created_at as string,
          user: answer.profiles,
          question: Array.isArray(answer.questions) ? answer.questions[0]?.question : answer.questions?.question,
          metadata: { question_id: answer.question_id }
        })));
      }
    }

    if (contentType === 'stories' || contentType === 'all') {
      // Get recent stories
      const { data: stories, error: storiesError } = await supabaseAdmin
        .from('stories')
        .select(`
          id,
          content,
          created_at,
          project_id,
          projects(
            person_name,
            subject_type
          ),
          profiles(
            id,
            user_id,
            name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(contentType === 'stories' ? limit : Math.floor(limit / 3))
        .range(offset, offset + (contentType === 'stories' ? limit : Math.floor(limit / 3)) - 1);

      if (!storiesError && stories) {
        content.push(...stories.map((story: any) => ({
          id: story.id as string,
          type: 'story',
          content: story.content as string,
          created_at: story.created_at as string,
          user: story.profiles,
          metadata: { 
            project_id: story.project_id,
            person_name: Array.isArray(story.projects) ? story.projects[0]?.person_name : story.projects?.person_name,
            subject_type: Array.isArray(story.projects) ? story.projects[0]?.subject_type : story.projects?.subject_type
          }
        })));
      }
    }

    // Sort all content by creation date
    content.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({
      content: content.slice(0, limit),
      total: content.length,
      hasMore: content.length === limit
    });

  } catch (error) {
    console.error('Error fetching content for moderation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = validateAdminAccess(request);
    if (!authResult.isValid) {
      return authResult.error!;
    }

    const { contentId, contentType, action, reason } = await request.json();

    if (!contentId || !contentType || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['approve', 'flag', 'remove'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Log the moderation action
    const { error: logError } = await supabaseAdmin
      .from('moderation_logs')
      .insert({
        content_id: contentId,
        content_type: contentType,
        action: action,
        reason: reason,
        admin_id: 'admin', // In a real app, get from authenticated admin
        created_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Error logging moderation action:', logError);
    }

    // Perform the action based on type
    if (action === 'remove') {
      const table = contentType === 'answer' ? 'answers' : 'stories';
      const { error: deleteError } = await supabaseAdmin
        .from(table)
        .delete()
        .eq('id', contentId);

      if (deleteError) {
        console.error('Error removing content:', deleteError);
        return NextResponse.json({ error: 'Failed to remove content' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Content ${action}ed successfully` 
    });

  } catch (error) {
    console.error('Error in content moderation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
