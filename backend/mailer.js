// backend/mailer.js
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendQuestionEmail({ to, subject, text }) {
  try {
    const response = await resend.emails.send({
      from: 'WriteMyStory <noreply@writemystory.ai>',
      to,
      subject,
      text,
    });

    console.log('✅ Email sent:', response);
    return response;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw error;
  }
}
