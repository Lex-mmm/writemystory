// Email service for WriteMyStory using Postmark
import { Client } from 'postmark';

export class EmailService {
  private client: Client;

  constructor() {
    const serverToken = process.env.POSTMARK_SERVER_API_TOKEN || process.env.POSTMARK_API_TOKEN;
    
    if (!serverToken || serverToken === 'your_postmark_server_token_here') {
      throw new Error('POSTMARK_SERVER_API_TOKEN or POSTMARK_API_TOKEN not configured. Get it from https://postmarkapp.com');
    }

    this.client = new Client(serverToken);
  }

  async sendQuestionEmail({
    to,
    memberName,
    question,
    questionId,
    storyId,
    contextText
  }: {
    to: string;
    memberName: string;
    question: string;
    questionId: string;
    storyId: string;
    contextText: string;
  }) {
    try {
      console.log('Sending email via Postmark to:', to);

      const result = await this.client.sendEmail({
        From: 'WriteMyStory <info@write-my-story.com>',
        To: to,
        ReplyTo: 'info@write-my-story.com',
        Subject: 'Vraag voor je verhaal - WriteMyStory',
        HtmlBody: `
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
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center;">
              <p style="color: #6b7280; margin: 0; font-size: 12px;">
                Met vriendelijke groet,<br>
                Het WriteMyStory team<br>
                <a href="https://write-my-story.com" style="color: #2563eb;">write-my-story.com</a>
              </p>
            </div>
            
            <!-- Hidden tracking data -->
            <div style="display: none;">
              Question ID: ${questionId}<br>
              Story ID: ${storyId}<br>
              Member: ${memberName}
            </div>
          </div>
        `,
        TextBody: `
Hallo ${memberName},

${contextText} Kun je helpen door deze vraag te beantwoorden?

VRAAG:
${question}

HOE TE BEANTWOORDEN:
Beantwoord deze email direct! Geen account nodig, geen website bezoeken.
Wij verwerken je antwoord automatisch in het verhaal.

Met vriendelijke groet,
Het WriteMyStory team
write-my-story.com

---
Question ID: ${questionId}
Story ID: ${storyId}
        `,
        Headers: [
          {
            Name: 'X-WriteMyStory-Question-ID',
            Value: questionId
          },
          {
            Name: 'X-WriteMyStory-Story-ID', 
            Value: storyId
          },
          {
            Name: 'X-WriteMyStory-Member',
            Value: memberName
          }
        ],
        TrackOpens: true
      });

      console.log('Email sent successfully via Postmark:', result.MessageID);

      return {
        success: true,
        messageId: result.MessageID,
        to: result.To,
        submittedAt: result.SubmittedAt
      };

    } catch (error) {
      console.error('Postmark error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async sendMultipleQuestionsEmail({
    to,
    memberName,
    questions,
    storyId,
    personName,
    isOwnStory = true
  }: {
    to: string;
    memberName: string;
    questions: Array<{ id: string; question: string; category?: string }>;
    storyId: string;
    personName: string;
    isOwnStory: boolean;
  }) {
    try {
      console.log(`Sending ${questions.length} questions via Postmark to:`, to);

      const questionsList = questions.slice(0, 5).map((q, index) => `
        <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #2563eb;">
          <h3 style="color: #2563eb; margin: 0 0 10px 0;">Vraag ${index + 1}</h3>
          <p style="font-size: 16px; line-height: 1.5; margin: 0; color: #374151;">${q.question}</p>
          <div style="margin-top: 10px; padding: 8px; background-color: #e0f2fe; border-radius: 6px; font-size: 12px; color: #1e40af;">
            Question ID: ${q.id}
          </div>
        </div>
      `).join('');

      const contextText = isOwnStory 
        ? `We zijn bezig met het opstellen van jouw levensverhaal "${personName}".`
        : `We zijn bezig met het opstellen van het levensverhaal van ${personName}.`;

      const questionIds = questions.map(q => q.id).join(', ');

      const result = await this.client.sendEmail({
        From: 'WriteMyStory <info@write-my-story.com>',
        To: to,
        ReplyTo: 'info@write-my-story.com',
        Subject: `${questions.length} nieuwe vragen voor ${isOwnStory ? 'je verhaal' : `het verhaal van ${personName}`} - WriteMyStory`,
        HtmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #2563eb; margin: 0 0 10px 0;">📚 ${questions.length} nieuwe vragen voor je verhaal</h2>
              <p style="color: #6b7280; margin: 0 0 10px 0;">Hallo ${memberName},</p>
              <p style="color: #374151; margin: 0; font-size: 14px; line-height: 1.5; background-color: #e8f4fd; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb;">
                ${contextText} Kun je helpen door deze vragen te beantwoorden?
              </p>
            </div>
            
            ${questionsList}
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center;">
              <p style="color: #6b7280; margin: 0; font-size: 12px;">
                Met vriendelijke groet,<br>
                Het WriteMyStory team<br>
                <a href="https://write-my-story.com" style="color: #2563eb;">write-my-story.com</a>
              </p>
            </div>
            
            <!-- Hidden tracking data -->
            <div style="display: none;">
              Question IDs: ${questionIds}<br>
              Story ID: ${storyId}<br>
              Member: ${memberName}
            </div>
          </div>
        `,
        TextBody: `
Hallo ${memberName},

${contextText} Kun je helpen door deze vragen te beantwoorden?

${questions.map((q, index) => `
VRAAG ${index + 1}:
${q.question}
(Question ID: ${q.id})
`).join('\n')}

HOE TE BEANTWOORDEN:
- Beantwoord deze email direct!
- Nummer je antwoorden (Vraag 1:, Vraag 2:, etc.)

Met vriendelijke groet,
Het WriteMyStory team
write-my-story.com

---
Question IDs: ${questionIds}
Story ID: ${storyId}
        `,
        Headers: [
          {
            Name: 'X-WriteMyStory-Question-IDs',
            Value: questionIds
          },
          {
            Name: 'X-WriteMyStory-Story-ID', 
            Value: storyId
          },
          {
            Name: 'X-WriteMyStory-Member',
            Value: memberName
          }
        ],
        TrackOpens: true
      });

      return {
        success: true,
        messageId: result.MessageID,
        to: result.To,
        submittedAt: result.SubmittedAt
      };

    } catch (error) {
      console.error('Postmark multi-question email error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// For backward compatibility
export const PostmarkService = EmailService;
export default EmailService;
