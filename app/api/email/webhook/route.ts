import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  const webhookStartTime = Date.now();
  
  try {
    console.log('📧 ========== EMAIL WEBHOOK RECEIVED ==========');
    console.log('🕐 Timestamp:', new Date().toISOString());
    console.log('🌐 User-Agent:', request.headers.get('user-agent'));
    console.log('📍 Source IP:', request.headers.get('x-forwarded-for') || 'localhost');
    
    // Get the email data from Resend webhook
    const requestData = await request.json();
    
    // Check the event type first
    const eventType = requestData.type;
    console.log('📬 Event Type:', eventType);
    
    // Only process email replies, not delivery confirmations or other events
    if (eventType === 'email.delivered' || eventType === 'email.bounced' || eventType === 'email.opened') {
      console.log('ℹ️ Ignoring event type:', eventType);
      console.log('✅ Event acknowledged (no processing needed)');
      return NextResponse.json({ 
        success: true, 
        message: `Event ${eventType} acknowledged`,
        processed: false 
      });
    }
    
    // Only process actual email replies or inbound emails
    if (eventType !== 'email.replied' && eventType !== 'email.received') {
      console.log('⚠️ Unknown event type:', eventType);
      console.log('📋 Full webhook data:', JSON.stringify(requestData, null, 2));
      return NextResponse.json({ 
        success: true, 
        message: `Event ${eventType} not processed`,
        processed: false 
      });
    }
    
    // Extract email data from the webhook payload
    const emailData = requestData.data || requestData;
    
    console.log('📨 Email Details:');
    console.log('   From:', emailData.from?.email || emailData.from);
    console.log('   From Name:', emailData.from?.name);
    console.log('   To:', emailData.to?.[0]?.email || emailData.to);
    console.log('   Subject:', emailData.subject);
    console.log('   Message-ID:', emailData['message-id']);
    console.log('   Content Length:', emailData.text?.length || 0, 'chars');
    
    // Log full data in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📋 Full webhook data:', JSON.stringify(emailData, null, 2));
    }

    // Resend webhook sends email data in this format:
    const {
      from,     // { email: "sender@email.com", name: "Sender Name" }
      // to,       // [{ email: "info@write-my-story.com" }] - not used currently
      subject,  // Email subject
      text,     // Plain text content
      html,     // HTML content (if available)
      'message-id': messageId,
      // 'in-reply-to': inReplyTo, - not used currently
      // references - not used currently
    } = emailData;

    console.log('📨 Email from:', from?.email, 'Subject:', subject);

    // Extract question ID and story ID from subject or email headers
    // The subject should contain "Re: Vraag voor je verhaal - WriteMyStory"
    // And we included the question ID in the original email footer
    
    let questionId = null;
    let storyId = null;
    let memberName = from?.name || from?.email || 'Unknown Sender';

    // Try to extract IDs from the email content or subject
    // Look for our ID pattern in the text content (including quoted content)
    const textContent = text || html || '';
    
    // Try multiple patterns for better matching
    const patterns = [
      /ID:\s*([a-f0-9A-F-]{36})/gi,  // Standard UUID format
      /ID:\s*([a-f0-9A-F-]+)/gi,     // Any UUID-like string
      /question.*id[:\s]*([a-f0-9A-F-]{36})/gi, // "question id: ..."
      /vraag.*id[:\s]*([a-f0-9A-F-]{36})/gi     // "vraag id: ..." (Dutch)
    ];
    
    for (const pattern of patterns) {
      const match = textContent.match(pattern);
      if (match) {
        // Extract the UUID from the match
        const uuidMatch = match[0].match(/([a-f0-9A-F-]{36})/);
        if (uuidMatch) {
          questionId = uuidMatch[1];
          console.log('📋 Found question ID with pattern:', pattern.source);
          console.log('📋 Question ID:', questionId);
          break;
        }
      }
    }

    // If we can't find the question ID, try to match by sender email
    if (!questionId) {
      console.log('🔍 Looking up question by sender email:', from?.email);
      
      // Query team members to find associated stories
      const { data: teamMembers, error: teamError } = await supabase
        .from('story_team_members')
        .select('story_id, name')
        .eq('email', from?.email);

      if (teamError) {
        console.error('Error querying team members:', teamError);
      } else if (teamMembers && teamMembers.length > 0) {
        // For now, we'll assume the latest email is related to their most recent story
        storyId = teamMembers[0].story_id;
        memberName = teamMembers[0].name || memberName;
        console.log('📚 Found story ID from team member:', storyId);
      }
    }

    // Extract the actual response content (remove quoted text)
    let responseContent = text || html || '';
    
    // Remove common email signatures and quoted text
    const lines = responseContent.split('\n');
    const cleanLines = [];
    
    for (const line of lines) {
      // Stop at common reply separators
      if (line.includes('--- Original Message ---') || 
          line.includes('On ') && line.includes('wrote:') ||
          line.startsWith('>') ||
          line.includes('Dit bericht is verstuurd via WriteMyStory')) {
        break;
      }
      cleanLines.push(line);
    }
    
    responseContent = cleanLines.join('\n').trim();

    console.log('📝 Cleaned response content:', responseContent.substring(0, 100) + '...');

    // Store the response in the database
    const { data: responseRecord, error: insertError } = await supabase
      .from('email_responses')
      .insert({
        question_id: questionId,
        story_id: storyId,
        team_member_name: memberName,
        sender_email: from?.email,
        response_content: responseContent,
        email_message_id: messageId,
        status: 'received'
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error storing email response:', insertError);
      return NextResponse.json(
        { error: 'Failed to store email response', details: insertError.message },
        { status: 500 }
      );
    }

    console.log('✅ Email response stored successfully:', responseRecord.id);

    // Optional: Send confirmation email back to sender
    try {
      // TODO: Enable confirmation emails when needed
      // const confirmationSubject = `Re: ${subject}`;
      // const confirmationText = `
// Hallo ${memberName},

// Bedankt voor je antwoord! We hebben je bijdrage ontvangen en zullen deze verwerken in het verhaal.

// Je antwoord:
// "${responseContent.substring(0, 200)}${responseContent.length > 200 ? '...' : ''}"

// Met vriendelijke groet,
// Het WriteMyStory team

// ---
// Dit is een automatisch gegenereerd bericht.
      // `;

      console.log(`📧 Confirmation email would be sent to ${from?.email} - Currently disabled`);

      // Note: You could send a confirmation email here if desired
      console.log('📧 Would send confirmation email to:', from?.email);
      
    } catch (confirmError) {
      console.warn('⚠️ Could not send confirmation email:', confirmError);
    }

    // Log success
    const processingTime = Date.now() - webhookStartTime;
    console.log('✅ ========== EMAIL PROCESSING SUCCESS ==========');
    console.log('🆔 Response ID:', responseRecord.id);
    console.log('❓ Question ID:', questionId);
    console.log('📚 Story ID:', storyId);
    console.log('👤 Team Member:', memberName);
    console.log('⏱️ Processing Time:', processingTime + 'ms');
    console.log('📧 Response Length:', responseContent.length, 'chars');
    console.log('================================================');

    return NextResponse.json({
      success: true,
      message: 'Email response processed successfully',
      responseId: responseRecord.id,
      questionId: questionId,
      storyId: storyId,
      processingTime: processingTime
    });

  } catch (error) {
    const processingTime = Date.now() - webhookStartTime;
    console.error('❌ ========== EMAIL PROCESSING FAILED ==========');
    console.error('🕐 Timestamp:', new Date().toISOString());
    console.error('⏱️ Failed after:', processingTime + 'ms');
    console.error('🚨 Error:', error);
    console.error('📋 Error Stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('================================================');
    
    return NextResponse.json(
      { 
        error: 'Failed to process email webhook', 
        details: error instanceof Error ? error.message : 'Unknown error',
        processingTime: processingTime,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Also handle GET requests for webhook verification
export async function GET() {
  return NextResponse.json({ message: 'WriteMyStory email webhook endpoint is active' });
}
