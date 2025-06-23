// backend/questions.js
import { sendQuestionEmail } from './mailer.js';
import prisma from './prismaClient.js';

const questions = [
  "Wat is je eerste herinnering aan je ouderlijk huis?",
  "Wie was je eerste grote liefde?",
  "Welke beslissing heeft je leven veranderd?",
  "Wat vond je het mooiste moment in je carrière?",
  "Wat wil je dat je (klein)kinderen later over je weten?",
];

const recipient = 'voorbeeld@example.com'; // Replace with actual user email

async function sendAllQuestions() {
  for (let i = 0; i < questions.length; i++) {
    const subject = `Vraag ${i + 1} over jouw levensverhaal`;
    const text = questions[i];

    await sendQuestionEmail({
      to: recipient,
      subject,
      text,
    });
  }
}

export async function sendQuestionToUser(userId, questionText) {
  // Sla de vraag op
  const question = await prisma.question.create({
    data: {
      text: questionText,
      userId: userId,
      sentAt: new Date(),
    },
  });

  // Hier kun je ook de mail versturen via Resend
  // await sendMail(user.email, questionText);

  console.log(`Vraag opgeslagen en verstuurd: ${question.id}`);
}

sendAllQuestions();
