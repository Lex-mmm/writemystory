import { supabaseAdmin } from './supabaseAdmin';
import { StoryTeamMember, QuestionWithStory } from './whatsappTypes';

// Twilio client setup
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
  console.warn('Twilio environment variables not configured');
}

/**
 * Send a WhatsApp message using Twilio API
 */
export async function sendWhatsAppMessage(
  to: string,
  message: string,
  mediaUrl?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
    return { success: false, error: 'Twilio not configured' };
  }

  try {
    // Ensure phone number is in WhatsApp format
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    
    const body = new URLSearchParams();
    body.append('From', TWILIO_WHATSAPP_NUMBER);
    body.append('To', formattedTo);
    body.append('Body', message);
    
    if (mediaUrl) {
      body.append('MediaUrl', mediaUrl);
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Twilio API error:', errorData);
      return { success: false, error: `Twilio API error: ${response.status}` };
    }

    const data = await response.json();
    console.log('WhatsApp message sent successfully:', data.sid);
    
    return { success: true, messageId: data.sid };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get team members who should receive questions for a story
 */
export async function getQuestionRecipients(storyId: string): Promise<StoryTeamMember[]> {
  try {
    const { data: teamMembers, error } = await supabaseAdmin
      .from('story_team_members')
      .select('*')
      .eq('story_id', storyId)
      .in('role', ['author', 'family'])
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching team members:', error);
      return [];
    }

    return teamMembers || [];
  } catch (error) {
    console.error('Error in getQuestionRecipients:', error);
    return [];
  }
}

/**
 * Find the latest unanswered question for a team member's story
 */
export async function findLatestQuestionForTeamMember(phoneNumber: string): Promise<QuestionWithStory | null> {
  try {
    // First, find the team member by phone number
    const { data: teamMember, error: memberError } = await supabaseAdmin
      .from('story_team_members')
      .select('story_id, role')
      .eq('phone_number', phoneNumber)
      .eq('status', 'active')
      .single();

    if (memberError || !teamMember) {
      console.log('Team member not found for phone:', phoneNumber);
      return null;
    }

    // Find the latest question for this story that doesn't have an answer
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
      .eq('story_id', teamMember.story_id)
      .not('id', 'in', `(
        SELECT question_id FROM answers WHERE story_id = '${teamMember.story_id}'
      )`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (questionError || !question) {
      console.log('No unanswered questions found for story:', teamMember.story_id);
      return null;
    }

    return {
      ...question,
      story: Array.isArray(question.projects) ? question.projects[0] : question.projects
    } as QuestionWithStory;
  } catch (error) {
    console.error('Error in findLatestQuestionForTeamMember:', error);
    return null;
  }
}

/**
 * Download media from Twilio and get metadata
 */
export async function downloadTwilioMedia(mediaUrl: string): Promise<{
  success: boolean;
  mediaData?: {
    url: string;
    contentType: string;
    size?: number;
  };
  error?: string;
}> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return { success: false, error: 'Twilio not configured' };
  }

  try {
    const response = await fetch(mediaUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`,
      },
    });

    if (!response.ok) {
      return { success: false, error: `Failed to download media: ${response.status}` };
    }

    const contentType = response.headers.get('content-type') || 'unknown';
    const contentLength = response.headers.get('content-length');

    // For now, we'll just return the URL and metadata
    // In production, you might want to upload to your own storage
    return {
      success: true,
      mediaData: {
        url: mediaUrl,
        contentType,
        size: contentLength ? parseInt(contentLength) : undefined,
      },
    };
  } catch (error) {
    console.error('Error downloading Twilio media:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Create formatted question message for WhatsApp
 */
export function formatQuestionMessage(
  question: QuestionWithStory,
  recipientName: string
): string {
  const storySubject = question.story.subject_type === 'self' 
    ? 'je eigen verhaal' 
    : `het verhaal van ${question.story.person_name || 'je dierbare'}`;

  return `Hoi ${recipientName}! 👋

Er is een nieuwe vraag voor ${storySubject}:

❓ ${question.question}

Je kunt antwoorden door simpelweg terug te berichten. Je mag ook een spraakberichtje sturen als dat makkelijker is!

Bedankt dat je helpt met dit bijzondere project! 💙

WriteMyStory.ai`;
}
