import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    const { to, question, storyId, questionId, memberName } = await request.json();

    if (!to || !question || !storyId || !questionId || !memberName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Check if Resend is configured
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey || resendApiKey === 'your_resend_api_key_here') {
      // Development mode: simulate email
      console.log('=== EMAIL SIMULATION (Resend not configured) ===');
      console.log('To:', to);
      console.log('Subject: Vraag voor je verhaal - WriteMyStory');
      console.log('Question:', question);
      console.log('Member:', memberName);
      console.log('Story ID:', storyId);
      console.log('=== End Email Simulation ===');
      
      return NextResponse.json({
        success: true,
        message: 'Email simulated (add RESEND_API_KEY for actual sending)',
        mode: 'simulation'
      });
    }

    // Initialize Resend
    const resend = new Resend(resendApiKey);

    console.log('Sending email via Resend to:', to);

    // Try custom domain first, fallback to Resend domain for testing
    let fromAddress = 'WriteMyStory <info@write-my-story.com>';
    
    // For testing purposes, if sending to non-verified emails, use default domain
    const isTestMode = !to.includes('l.m.vanloon@utwente.nl');
    if (isTestMode) {
      fromAddress = 'WriteMyStory <onboarding@resend.dev>';
      console.log('Using test domain for unverified recipient');
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [to],
      subject: `Vraag voor je verhaal - WriteMyStory`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #2563eb; margin: 0 0 10px 0;">📝 Nieuwe vraag voor je verhaal</h2>
            <p style="color: #6b7280; margin: 0;">Hallo ${memberName},</p>
          </div>
          
          <div style="background-color: white; padding: 20px; border: 2px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #374151; margin: 0 0 15px 0;">Vraag:</h3>
            <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0; padding: 15px; background-color: #f9fafb; border-radius: 6px;">
              ${question}
            </p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              💡 <strong>Tip:</strong> Beantwoord de vraag zo uitgebreid mogelijk. Deel specifieke herinneringen, data, namen en gevoel bij gebeurtenissen. Hoe meer details, hoe rijker het verhaal wordt!
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/project/${storyId}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              📖 Beantwoord vraag op de website
            </a>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Dit bericht is verstuurd via WriteMyStory<br>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #2563eb;">www.writemystory.nl</a>
            </p>
          </div>
        </div>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error(`Resend error: ${JSON.stringify(error)}`);
    }

    console.log('Email sent successfully via Resend:', data?.id);

    return NextResponse.json({
      success: true,
      message: 'Question sent successfully via email',
      emailId: data?.id,
      fromAddress
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
