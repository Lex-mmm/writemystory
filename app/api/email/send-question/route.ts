import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

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

    // Fetch project details for better context
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select(`
        user_id,
        subject_type,
        person_name,
        period_type,
        writing_style,
        created_at,
        profiles!inner(
          full_name,
          email
        )
      `)
      .eq('id', storyId)
      .single();

    if (projectError || !project) {
      console.error('Error fetching project details:', projectError);
      // Continue without project context if fetch fails
    }

    // Generate context text based on project details
    let contextText = '';
    if (project && project.profiles && project.profiles.length > 0) {
      const accountHolderName = project.profiles[0].full_name || 'Een gebruiker';
      const storySubject = project.subject_type === 'self' ? 'zichzelf' : (project.person_name || 'een persoon');
      contextText = `De accounthouder ${accountHolderName} schrijft een verhaal over ${storySubject} en heeft jouw hulp nodig om het verhaal compleet te maken.`;
    } else {
      contextText = 'Er wordt een verhaal geschreven en jouw hulp is nodig om het compleet te maken.';
    }

    // Check if Resend is configured
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey || resendApiKey === 'your_resend_api_key_here') {
      // Development mode: simulate email
      console.log('=== EMAIL SIMULATION (Resend not configured) ===');
      console.log('To:', to);
      console.log('Subject: Vraag voor je verhaal - WriteMyStory');
      console.log('Context:', contextText);
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

    // Try to send real email with custom domain
    const { data, error } = await resend.emails.send({
      from: 'WriteMyStory <info@write-my-story.com>', // Your custom domain
      to: [to],
      replyTo: 'info@write-my-story.com', // Enable direct email replies
      subject: `Vraag voor je verhaal - WriteMyStory`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #2563eb; margin: 0 0 10px 0;">📝 Nieuwe vraag voor je verhaal</h2>
            <p style="color: #6b7280; margin: 0 0 10px 0;">Hallo ${memberName},</p>
            <p style="color: #374151; margin: 0; font-size: 14px; line-height: 1.5; background-color: #e8f4fd; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb;">
              ${contextText} Kun je helpen door deze vraag te beantwoorden?
            </p>
          </div>
          
          <div style="background-color: white; padding: 20px; border: 2px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #374151; margin: 0 0 15px 0;">Vraag:</h3>
            <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0; padding: 15px; background-color: #f9fafb; border-radius: 6px;">
              ${question}
            </p>
          </div>
          
          <div style="background-color: #e0f2fe; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2563eb;">
            <h3 style="color: #1e40af; margin: 0 0 10px 0;">💬 Hoe te beantwoorden:</h3>
            <p style="color: #1e40af; margin: 0 0 15px 0; font-weight: 600; font-size: 16px;">
              <strong>Beantwoord deze email direct!</strong>
            </p>
            <p style="color: #374151; margin: 0; font-size: 14px; line-height: 1.5;">
              • Typ je antwoord in een nieuwe email of beantwoord deze email<br>
              • Geen account nodig, geen website bezoeken<br>
              • Wij verwerken je antwoord automatisch in het verhaal<br>
              • Hoe uitgebreider je antwoord, hoe mooier het verhaal wordt
            </p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              💡 <strong>Tip:</strong> Beantwoord de vraag zo uitgebreid mogelijk. Deel specifieke herinneringen, data, namen en gevoel bij gebeurtenissen. Hoe meer details, hoe rijker het verhaal wordt!
            </p>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              Dit bericht is verstuurd via WriteMyStory<br>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #2563eb;">www.writemystory.nl</a>
            </p>
            <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0;">
              ID: ${questionId} | Voor: ${memberName}
            </p>
          </div>
        </div>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      
      // If domain verification error, provide helpful message
      if (error.message && error.message.includes('verify a domain')) {
        return NextResponse.json({
          error: 'Domain not verified',
          message: 'Please verify write-my-story.com domain in Resend dashboard first',
          details: 'Go to resend.com/domains and follow the verification steps',
        }, { status: 403 });
      }
      
      throw new Error(`Resend error: ${JSON.stringify(error)}`);
    }

    console.log('Email sent successfully via Resend:', data?.id);

    return NextResponse.json({
      success: true,
      message: 'Question sent successfully via email',
      emailId: data?.id,
      from: 'WriteMyStory <info@write-my-story.com>'
    });  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
