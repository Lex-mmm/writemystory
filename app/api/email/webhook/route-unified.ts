import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

// Interface for Resend webhook data
interface ResendEmailData {
  type: string;
  data?: {
    from: { email: string; name?: string };
    to: Array<{ email: string }>;
    subject: string;
    'message-id': string;
    text?: string;
    html?: string;
  };
  from?: { email: string; name?: string };
  to?: Array<{ email: string }>;
  subject?: string;
  'message-id'?: string;
  text?: string;
  html?: string;
}

// Interface for Postmark inbound email
interface PostmarkInboundEmail {
  From: string;
  FromName: string;
  To: string;
  ToFull: Array<{ Email: string; Name: string }>;
  Subject: string;
  HtmlBody: string;
  TextBody: string;
  MessageID: string;
  Date: string;
  Headers: Array<{ Name: string; Value: string }>;
  OriginalRecipient: string;
}

export async function POST(request: NextRequest) {
  const webhookStartTime = Date.now();
  
  try {
    console.log('📧 ========== EMAIL WEBHOOK RECEIVED ==========');
    console.log('🕐 Timestamp:', new Date().toISOString());
    console.log('🌐 User-Agent:', request.headers.get('user-agent'));
    console.log('📍 Source IP:', request.headers.get('x-forwarded-for') || 'localhost');
    
    // Get the email data from webhook
    const requestData = await request.json();
    
    // Detect webhook type by checking the structure
    const isPostmark = 'From' in requestData && 'TextBody' in requestData;
    const isResend = 'type' in requestData || ('from' in requestData && 'message-id' in requestData);
    
    console.log('🔍 Webhook Detection:');
    console.log('   Is Postmark:', isPostmark);
    console.log('   Is Resend:', isResend);
    
    if (isPostmark) {
      return await handlePostmarkWebhook(requestData as PostmarkInboundEmail, webhookStartTime);
    } else if (isResend) {
      return await handleResendWebhook(requestData as ResendEmailData, webhookStartTime);
    } else {
      console.log('⚠️ Unknown webhook format');
      console.log('📋 Full webhook data:', JSON.stringify(requestData, null, 2));
      return NextResponse.json({ 
        success: false, 
        error: 'Unknown webhook format',
        processed: false 
      }, { status: 400 });
    }
    
  } catch (error) {
    const processingTime = Date.now() - webhookStartTime;
    console.error('❌ ========== EMAIL WEBHOOK PROCESSING FAILED ==========');
    console.error('🕐 Timestamp:', new Date().toISOString());
    console.error('⏱️ Failed after:', processingTime + 'ms');
    console.error('🚨 Error:', error);
    console.error('📋 Error Stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('=============================================================');
    
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

async function handlePostmarkWebhook(emailData: PostmarkInboundEmail, webhookStartTime: number) {
  console.log('📨 Processing POSTMARK webhook');
  console.log('   From:', emailData.From);
  console.log('   From Name:', emailData.FromName);
  console.log('   To:', emailData.To);
  console.log('   Subject:', emailData.Subject);
  console.log('   Message-ID:', emailData.MessageID);
  console.log('   Content Length:', emailData.TextBody?.length || 0, 'chars');

  // Verify this is a reply to info@write-my-story.com
  if (!emailData.To.includes('info@write-my-story.com')) {
    console.log('⚠️ Email not sent to info@write-my-story.com, ignoring');
    return NextResponse.json({ 
      success: true, 
      message: 'Email not for processing',
      processed: false,
      service: 'postmark'
    });
  }

  const from = { email: emailData.From, name: emailData.FromName };
  const messageId = emailData.MessageID;
  const subject = emailData.Subject;
  
  // Clean the response content (remove quoted text and signatures)
  let responseContent = emailData.TextBody || emailData.HtmlBody || '';
  
  // Remove common email signatures and quoted text
  responseContent = responseContent
    .split(/-----Original Message-----/i)[0]
    .split(/________________________________/)[0]
    .split(/On .* wrote:/)[0]
    .split(/Van: .*/)[0]
    .split(/From: .*/)[0]
    .split(/\n\n>/)[0]
    .trim();

  console.log('📝 Cleaned response content:', responseContent.substring(0, 100) + '...');

  // Try to extract Question ID from various sources
  let questionId = null;
  let storyId = null;
  let memberName = from.name || 'Unknown';

  // Method 1: Check custom headers (if present)
  const questionHeader = emailData.Headers?.find(h => h.Name === 'X-WriteMyStory-Question-ID');
  const storyHeader = emailData.Headers?.find(h => h.Name === 'X-WriteMyStory-Story-ID');
  
  if (questionHeader) {
    questionId = questionHeader.Value;
    console.log('✅ Found question ID in custom header:', questionId);
  }
  
  if (storyHeader) {
    storyId = storyHeader.Value;
    console.log('✅ Found story ID in custom header:', storyId);
  }

  // Method 2: Extract from email content
  if (!questionId) {
    const patterns = [
      /Question ID:\s*([a-f0-9\-]{36})/i,
      /\[Question:\s*([a-f0-9\-]{36})\]/i,
      /ID:\s*([a-f0-9\-]{36})/i
    ];

    for (const pattern of patterns) {
      const match = responseContent.match(pattern) || emailData.HtmlBody?.match(pattern);
      if (match) {
        questionId = match[1];
        console.log('✅ Found question ID in email content:', questionId);
        break;
      }
    }
  }

  // Method 3: Extract from subject line
  if (!questionId) {
    const subjectMatch = subject.match(/\[([a-f0-9\-]{36})\]/);
    if (subjectMatch) {
      questionId = subjectMatch[1];
      console.log('✅ Found question ID in subject:', questionId);
    }
  }

  const result = await processEmailResponse({
    questionId,
    storyId,
    memberName,
    from,
    messageId,
    responseContent,
    service: 'postmark'
  });

  const processingTime = Date.now() - webhookStartTime;
  
  if (result.success) {
    console.log('✅ ========== POSTMARK EMAIL PROCESSING SUCCESS ==========');
    console.log('🆔 Response ID:', result.responseId);
    console.log('❓ Question ID:', result.questionId);
    console.log('📚 Story ID:', result.storyId);
    console.log('👤 Team Member:', result.memberName);
    console.log('⏱️ Processing Time:', processingTime + 'ms');
    console.log('📧 Response Length:', responseContent.length, 'chars');
    console.log('🔧 Service: Postmark');
    console.log('========================================================');
  }

  return NextResponse.json({
    ...result,
    processingTime: processingTime,
    service: 'postmark'
  });
}

async function handleResendWebhook(requestData: ResendEmailData, webhookStartTime: number) {
  console.log('📨 Processing RESEND webhook');
  
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
      processed: false,
      service: 'resend'
    });
  }
  
  // Only process actual email replies or inbound emails
  if (eventType !== 'email.replied' && eventType !== 'email.received') {
    console.log('⚠️ Unknown event type:', eventType);
    console.log('📋 Full webhook data:', JSON.stringify(requestData, null, 2));
    return NextResponse.json({ 
      success: true, 
      message: `Event ${eventType} not processed`,
      processed: false,
      service: 'resend'
    });
  }

  // Note: Resend doesn't actually support inbound emails
  // This is kept for backwards compatibility but will log a warning
  console.log('⚠️ WARNING: Resend does not support inbound email processing!');
  console.log('⚠️ This webhook will not work for actual email replies.');
  console.log('⚠️ Please migrate to Postmark for bidirectional email processing.');

  return NextResponse.json({
    success: false,
    error: 'Resend does not support inbound email processing',
    message: 'Please use Postmark webhook endpoint for email replies',
    processed: false,
    service: 'resend'
  }, { status: 501 });
}

// Shared function to process email responses
async function processEmailResponse({
  questionId,
  storyId,
  memberName,
  from,
  messageId,
  responseContent,
  service
}: {
  questionId: string | null;
  storyId: string | null;
  memberName: string;
  from: { email: string; name?: string };
  messageId: string;
  responseContent: string;
  service: string;
}) {
  // Method 4: Fallback - find by team member email and recent questions
  if (!questionId) {
    console.log('🔍 No question ID found in email. Looking up by sender email:', from.email);
    
    // Find team member and their stories
    const { data: teamMembers, error: teamError } = await supabaseAdmin
      .from('story_team_members')
      .select('story_id, name')
      .eq('email', from.email);

    console.log('🔍 Team member query result:', { teamMembers, teamError });

    if (teamError) {
      console.error('Error querying team members:', teamError);
    } else if (teamMembers && teamMembers.length > 0) {
      storyId = teamMembers[0].story_id;
      memberName = teamMembers[0].name || memberName;
      console.log('📚 Found story ID from team member:', storyId);
      console.log('👤 Found member name from database:', memberName);
      
      // Try to find the most recent question for this story
      console.log('🔍 Looking for recent questions in story', storyId);
      
      const { data: recentQuestions, error: questionsError } = await supabaseAdmin
        .from('questions')
        .select('*')
        .eq('story_id', storyId)
        .order('created_at', { ascending: false })
        .limit(5);

      console.log('🔍 Questions query result:', { recentQuestions, questionsError });

      if (questionsError) {
        console.error('⚠️ Error finding recent questions:', questionsError);
      } else if (recentQuestions && recentQuestions.length > 0) {
        // Show available columns for debugging
        console.log('🔍 Available columns in questions table:', Object.keys(recentQuestions[0]));
        
        // Use the most recent question
        questionId = recentQuestions[0].id;
        console.log('✅ Found recent question ID by team member lookup:', questionId);
        console.log('📋 Question preview:', recentQuestions[0].question?.substring(0, 60) + '...');
        console.log('📅 Question created at:', recentQuestions[0].created_at);
        
        // Check different possible column names for sent timestamp
        const sentTimestamp = recentQuestions[0].sent_at || recentQuestions[0].sentAt || recentQuestions[0].sent_timestamp;
        console.log('📤 Question sent at:', sentTimestamp || 'Not sent yet');
        
        // Show all recent questions for context
        console.log('📋 All recent questions for this story:');
        recentQuestions.forEach((q, idx) => {
          const timestamp = q.sent_at || q.sentAt || q.sent_timestamp;
          const status = timestamp ? `sent ${timestamp}` : 'not sent yet';
          console.log(`   ${idx + 1}. ${q.id} - "${q.question?.substring(0, 40)}..." (${status})`);
        });
      } else {
        console.log('⚠️ No questions found for this story');
        console.log('🔍 Story ID used for query:', storyId);
      }
    } else {
      console.log('⚠️ Team member not found for email:', from.email);
      console.log('🔍 Available team members (if any):', teamMembers);
    }
  }

  console.log('📊 QUESTION LOOKUP SUMMARY:');
  console.log('   Question ID:', questionId || 'NULL');
  console.log('   Story ID:', storyId || 'NULL');
  console.log('   Member Name:', memberName);
  console.log('   Sender Email:', from.email);

  // Look up team member ID for the database insert
  let teamMemberId = null;
  
  if (storyId) {
    const { data: teamMember, error: memberError } = await supabaseAdmin
      .from('story_team_members')
      .select('id')
      .eq('story_id', storyId)
      .eq('email', from.email)
      .single();

    if (memberError) {
      console.error('⚠️ Could not find team member:', memberError);
    } else {
      teamMemberId = teamMember.id;
      console.log('✅ Found team member ID:', teamMemberId);
    }
  }

  // Store the response in the database
  const { data: responseRecord, error: insertError } = await supabaseAdmin
    .from('email_responses')
    .insert({
      question_id: questionId,
      story_id: storyId,
      team_member_id: teamMemberId,
      team_member_name: memberName,
      sender_email: from.email,
      response_content: responseContent,
      email_message_id: messageId,
      status: 'received'
    })
    .select()
    .single();

  if (insertError) {
    console.error('❌ Error storing email response:', insertError);
    return {
      success: false,
      error: 'Failed to store email response',
      details: insertError.message
    };
  }

  console.log('✅ Email response stored successfully:', responseRecord.id);

  return {
    success: true,
    responseId: responseRecord.id,
    questionId: questionId,
    storyId: storyId,
    memberName: memberName,
    message: `Email response processed successfully via ${service}`
  };
}
