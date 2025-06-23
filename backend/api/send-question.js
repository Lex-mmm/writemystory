import express from "express";
import prisma from "../prismaClient.js";
import { sendEmail } from "../mailer.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { email, question } = req.body;

  if (!email || !question) return res.status(400).json({ error: "Invalid input" });

  try {
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({ data: { email } });
    }

    const savedQuestion = await prisma.question.create({
      data: {
        text: question,
        userId: user.id,
        sentAt: new Date(),
      },
    });

    await sendEmail(email, "Jouw eerste vraag", question);

    res.status(200).json({ success: true, id: savedQuestion.id });
  } catch (error) {
    console.error("Fout bij verzenden vraag:", error);
    res.status(500).json({ error: "Interne serverfout" });
  }
});

export default router;
