import { NextRequest, NextResponse } from 'next/server';

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

    console.log('Attempting to send email via Resend API...');

    // Use Resend (simple transactional email service)
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const emailContent = {
      from: 'WriteMyStory <onboarding@resend.dev>', // Default Resend domain
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
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailContent),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Resend API error:', response.status, errorData);
      throw new Error(`Resend API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log('Email sent successfully via Resend:', result.id);

    return NextResponse.json({
      success: true,
      message: 'Question sent successfully via email',
      emailId: result.id
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
