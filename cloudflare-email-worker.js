// Cloudflare Worker for sending emails via MailChannels
// Deploy this to Cloudflare Workers

export default {
  async fetch(request, env, ctx) {
    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: {
          'Allow': 'POST',
          'Content-Type': 'application/json'
        }
      });
    }

    // Check for authorization (optional but recommended)
    const authToken = request.headers.get('Authorization');
    if (env.AUTH_TOKEN && authToken !== `Bearer ${env.AUTH_TOKEN}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    try {
      const { to, subject, html, text, from } = await request.json();

      // Validate required fields
      if (!to || !subject || (!html && !text)) {
        return new Response(JSON.stringify({
          error: 'Missing required fields: to, subject, and either html or text'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Prepare email data for MailChannels
      const emailData = {
        personalizations: [
          {
            to: [
              typeof to === 'string' 
                ? { email: to }
                : { email: to.email, name: to.name }
            ],
          },
        ],
        from: from || {
          email: 'noreply@write-my-story.com',
          name: 'WriteMyStory',
        },
        subject: subject,
        content: []
      };

      // Add content types
      if (html) {
        emailData.content.push({
          type: 'text/html',
          value: html,
        });
      }

      if (text) {
        emailData.content.push({
          type: 'text/plain',
          value: text,
        });
      }

      // Send email via MailChannels
      const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (response.ok) {
        console.log('Email sent successfully');
        return new Response(JSON.stringify({
          success: true,
          message: 'Email sent successfully'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        const errorText = await response.text();
        console.error('MailChannels error:', response.status, errorText);
        
        return new Response(JSON.stringify({
          error: 'Failed to send email',
          details: `MailChannels API error: ${response.status}`,
          mailchannels_response: errorText
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

    } catch (error) {
      console.error('Worker error:', error);
      
      return new Response(JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },
};

// Optional: Add scheduled handlers for email queue processing
export const scheduled = {
  async scheduled(event, env, ctx) {
    // You can add email queue processing here if needed
    console.log('Scheduled email worker run:', new Date().toISOString());
  }
};
