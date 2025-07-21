import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { 
  sendWhatsAppMessage, 
  getQuestionRecipients, 
  formatQuestionMessage 
} from '../../../../lib/twilioHelper';
import { QuestionWithStory } from '../../../../lib/whatsappTypes';

export async function POST(request: NextRequest) {
  // Build-time protection
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Supabase service role key not available');
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
  }

  try {
    const { questionId, teamMemberIds, storyId, userId } = await request.json();

    if (!questionId) {
      return NextResponse.json(
        { error: 'Question ID is required' },
        { status: 400 }
      );
    }

    console.log('Sending WhatsApp messages for question:', questionId);

    // Get the question with story details
    const { data: question, error: questionError } = await supabaseAdmin
      .from('questions')
      .select(`
        id,
        story_id,
        category,
        question,
        type,
        priority,
        created_at,
        projects:story_id (
          id,
          person_name,
          subject_type,
          user_id
        )
      `)
      .eq('id', questionId)
      .single();

    if (questionError || !question) {
      console.error('Question not found:', questionError);
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Transform the question data
    const questionWithStory: QuestionWithStory = {
      ...question,
      story: Array.isArray(question.projects) ? question.projects[0] : question.projects
    };

    // Get team members who should receive this question
    let recipients;
    
    if (teamMemberIds && teamMemberIds.length > 0) {
      // Send to specific team members (forwarding mode)
      console.log('Forwarding question to specific team members:', teamMemberIds);
      
      const { data: specificMembers, error: membersError } = await supabaseAdmin
        .from('story_team_members')
        .select('*')
        .eq('story_id', question.story_id)
        .in('id', teamMemberIds)
        .eq('status', 'active');

      if (membersError) {
        console.error('Error fetching specific team members:', membersError);
        return NextResponse.json(
          { error: 'Failed to fetch team members' },
          { status: 500 }
        );
      }

      recipients = specificMembers || [];
    } else {
      // Send to all eligible team members (default mode)
      recipients = await getQuestionRecipients(question.story_id);
    }

    if (recipients.length === 0) {
      console.log('No recipients found for story:', question.story_id);
      return NextResponse.json(
        { 
          success: true, 
          message: 'No team members found to send question to',
          sentCount: 0 
        }
      );
    }

    console.log(`Found ${recipients.length} recipients for question`);

    // Send WhatsApp messages to all recipients
    const sendResults = await Promise.all(
      recipients.map(async (recipient) => {
        const message = formatQuestionMessage(questionWithStory, recipient.name);
        
        const result = await sendWhatsAppMessage(
          recipient.phone_number,
          message
        );

        // Update last_contacted timestamp if message was sent successfully
        if (result.success) {
          await supabaseAdmin
            .from('story_team_members')
            .update({ last_contacted: new Date().toISOString() })
            .eq('id', recipient.id);
        }

        return {
          recipient: recipient.name,
          phone: recipient.phone_number,
          success: result.success,
          messageId: result.messageId,
          error: result.error,
        };
      })
    );

    const successCount = sendResults.filter(r => r.success).length;
    const failures = sendResults.filter(r => !r.success);

    console.log(`WhatsApp messages sent: ${successCount}/${recipients.length} successful`);

    if (failures.length > 0) {
      console.error('Some messages failed to send:', failures);
    }

    return NextResponse.json({
      success: true,
      message: `Question sent to ${successCount} team members`,
      sentCount: successCount,
      totalRecipients: recipients.length,
      results: sendResults,
    });

  } catch (error) {
    console.error('Error in send-question route:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
