import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { 
  findLatestQuestionForTeamMember, 
  downloadTwilioMedia 
} from '../../../../lib/twilioHelper';
import { TwilioWebhookBody } from '../../../../lib/whatsappTypes';
import WHATSAPP_CONFIG from '../../../../lib/whatsappConfig';

export async function POST(request: NextRequest) {
  // Check if WhatsApp is enabled
  if (!WHATSAPP_CONFIG.isAvailable()) {
    const reason = WHATSAPP_CONFIG.getDisabledReason();
    console.log('WhatsApp webhook blocked:', reason);
    return NextResponse.json({ 
      error: 'WhatsApp functionality is currently unavailable',
      reason: reason
    }, { status: 503 });
  }

  // Build-time protection
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Supabase service role key not available');
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
  }

  try {
    // Parse the webhook data from Twilio
    const formData = await request.formData();
    const webhookData: TwilioWebhookBody = {
      MessageSid: formData.get('MessageSid') as string,
      AccountSid: formData.get('AccountSid') as string,
      From: formData.get('From') as string,
      To: formData.get('To') as string,
      Body: formData.get('Body') as string || '',
      NumMedia: formData.get('NumMedia') as string,
      MediaUrl0: formData.get('MediaUrl0') as string,
      MediaContentType0: formData.get('MediaContentType0') as string,
      ProfileName: formData.get('ProfileName') as string,
    };

    console.log('Received WhatsApp message:', {
      from: webhookData.From,
      body: webhookData.Body?.substring(0, 100),
      hasMedia: !!webhookData.MediaUrl0
    });

    // Extract phone number (remove whatsapp: prefix if present)
    const phoneNumber = webhookData.From.replace('whatsapp:', '');

    // Find the team member and their latest question
    const question = await findLatestQuestionForTeamMember(phoneNumber);

    if (!question) {
      console.log('No matching question found for phone number:', phoneNumber);
      
      // Send a friendly response
      return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Bedankt voor je bericht! We konden geen openstaande vraag voor je vinden. Neem contact op als je denkt dat dit een fout is. 😊</Message>
</Response>`, {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // Get the team member details
    const { data: teamMember, error: memberError } = await supabaseAdmin
      .from('story_team_members')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('story_id', question.story_id)
      .single();

    if (memberError || !teamMember) {
      console.error('Team member not found:', memberError);
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    // Save the answer to the database
    const { data: answer, error: answerError } = await supabaseAdmin
      .from('answers')
      .insert({
        question_id: question.id,
        story_id: question.story_id,
        user_id: teamMember.user_id || teamMember.id, // Use user_id if available, fallback to team member id
        answer: webhookData.Body || '[Voice message or media]',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (answerError) {
      console.error('Error saving answer:', answerError);
      return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 });
    }

    console.log('Answer saved successfully:', answer.id);

    // Handle media if present
    if (webhookData.MediaUrl0 && webhookData.MediaContentType0) {
      console.log('Processing media attachment...');
      
      const mediaResult = await downloadTwilioMedia(webhookData.MediaUrl0);
      
      if (mediaResult.success && mediaResult.mediaData) {
        // Determine media type
        let mediaType: 'audio' | 'image' | 'video' | 'document' = 'document';
        if (webhookData.MediaContentType0.startsWith('audio/')) {
          mediaType = 'audio';
        } else if (webhookData.MediaContentType0.startsWith('image/')) {
          mediaType = 'image';
        } else if (webhookData.MediaContentType0.startsWith('video/')) {
          mediaType = 'video';
        }

        // Save media information
        const { error: mediaError } = await supabaseAdmin
          .from('media_answers')
          .insert({
            answer_id: answer.id,
            media_url: mediaResult.mediaData.url,
            media_type: mediaType,
            file_size: mediaResult.mediaData.size,
            created_at: new Date().toISOString(),
          });

        if (mediaError) {
          console.error('Error saving media answer:', mediaError);
        } else {
          console.log('Media answer saved successfully');
        }
      }
    }

    // Send a thank you response
    const thankYouMessage = `Dank je wel voor je antwoord, ${teamMember.name}! 🙏

Je reactie is opgeslagen en helpt om het verhaal compleet te maken. Je krijgt binnenkort misschien nog meer vragen.

WriteMyStory.ai`;

    return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${thankYouMessage}</Message>
</Response>`, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });

  } catch (error) {
    console.error('Error in WhatsApp receive webhook:', error);
    
    // Return a generic error response to the user
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Er is een fout opgetreden bij het verwerken van je bericht. Probeer het later opnieuw of neem contact op met support.</Message>
</Response>`, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}
