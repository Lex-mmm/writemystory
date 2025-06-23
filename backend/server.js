// backend/server.js
import express from 'express';
import dotenv from 'dotenv';
import { sendQuestionEmail } from './mailer.js';

import sendQuestionRoute from './api/send-question.js';
app.use("/api/send-question", sendQuestionRoute);


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

const questions = [
  "Wat is je eerste herinnering aan je ouderlijk huis?",
  "Wie was je eerste grote liefde?",
  "Welke beslissing heeft je leven veranderd?",
  "Wat vond je het mooiste moment in je carrière?",
  "Wat wil je dat je (klein)kinderen later over je weten?",
];

app.post('/api/send-questions', async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    for (let i = 0; i < questions.length; i++) {
      await sendQuestionEmail({
        to: email,
        subject: `Vraag ${i + 1} over jouw levensverhaal`,
        text: questions[i],
      });
    }

    res.status(200).json({ message: 'All questions sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send questions' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend API running at http://localhost:${PORT}`);
});
