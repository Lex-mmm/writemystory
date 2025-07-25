import { NextResponse } from 'next/server';
import { PostmarkService } from '@/lib/postmarkService';

export async function POST() {
  console.log('🧪 Testing Postmark email system...');

  try {
    // Initialize Postmark service
    const postmark = new PostmarkService();
    console.log('✅ Postmark service initialized');

    // Send test email
    const result = await postmark.sendQuestionEmail({
      to: 'l.m.vanloon@outlook.com',
      memberName: 'Test User',
      question: 'This is a test question to verify Postmark integration is working correctly.',
      questionId: 'test-question-' + Date.now(),
      storyId: 'test-story-' + Date.now(),
      contextText: 'Testing the email system with Postmark. If you receive this email, the integration is working perfectly!'
    });

    console.log('✅ Test email sent successfully');
    console.log('📧 Message ID:', result.messageId);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: result.messageId,
      submittedAt: result.submittedAt,
      to: result.to,
      testResults: {
        postmarkInitialized: true,
        emailSent: true,
        messageId: result.messageId
      }
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      testResults: {
        postmarkInitialized: false,
        emailSent: false,
        errorMessage: errorMessage
      }
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Email test endpoint. Use POST to run the test.',
    instructions: 'Send a POST request to this endpoint to test Postmark email functionality.'
  });
}
