import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

// Helper function to set user context for RLS
async function setUserContext(userId: string) {
  await supabase.rpc('set_config', {
    setting_name: 'app.current_user_id',
    setting_value: userId,
    is_local: true
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const storyId = searchParams.get('storyId');
  const userId = searchParams.get('userId');

  if (!storyId || !userId) {
    return NextResponse.json({ error: 'Story ID and User ID are required' }, { status: 400 });
  }

  try {
    // Set user context for RLS
    await setUserContext(userId);

    // Get questions for this story from Supabase
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('story_id', storyId)
      .order('priority', { ascending: true });

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    // Get answers for these questions
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('*')
      .eq('story_id', storyId);

    if (answersError) {
      console.error('Error fetching answers:', answersError);
    }

    // Merge questions with their answers
    const questionsWithAnswers = questions?.map(question => {
      const answer = answers?.find(a => a.question_id === question.id);
      return {
        ...question,
        status: answer ? 'answered' : 'pending',
        answeredAt: answer?.created_at || null,
        answer: answer?.answer || null
      };
    }) || [];
    
    return NextResponse.json({ questions: questionsWithAnswers });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storyId, userId, type } = body;

    if (!storyId || !userId) {
      return NextResponse.json({ error: 'Story ID and User ID are required' }, { status: 400 });
    }

    // Set user context for RLS
    await setUserContext(userId);

    if (type === 'generate') {
      // Generate new questions for the story
      const newQuestions = generateQuestionsForStory(storyId);
      
      // Insert questions into Supabase
      const { data: insertedQuestions, error: insertError } = await supabase
        .from('questions')
        .insert(newQuestions)
        .select();

      if (insertError) {
        console.error('Error inserting questions:', insertError);
        return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 });
      }

      // Send questions via email (mock implementation)
      await sendQuestionsViaEmail(userId, storyId, insertedQuestions || []);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Questions generated and sent via email',
        questions: insertedQuestions?.map(q => ({ ...q, status: 'pending' })) || []
      });
    }

    if (type === 'answer') {
      const { questionId, answer } = body;
      
      // Check if answer already exists
      const { data: existingAnswer } = await supabase
        .from('answers')
        .select('id')
        .eq('question_id', questionId)
        .eq('story_id', storyId)
        .single();

      let answerData;

      if (existingAnswer) {
        // Update existing answer
        const { data: updatedAnswer, error: updateError } = await supabase
          .from('answers')
          .update({
            answer: answer,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAnswer.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating answer:', updateError);
          return NextResponse.json({ error: 'Failed to update answer' }, { status: 500 });
        }

        answerData = updatedAnswer;
      } else {
        // Insert new answer
        const { data: insertedAnswer, error: insertError } = await supabase
          .from('answers')
          .insert({
            question_id: questionId,
            story_id: storyId,
            user_id: userId,
            answer: answer
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting answer:', insertError);
          return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 });
        }

        answerData = insertedAnswer;
      }

      // Update story progress
      await updateStoryProgress(storyId);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Answer saved successfully',
        answer: answerData 
      });
    }

    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
  } catch (error) {
    console.error('Error handling question request:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

function generateQuestionsForStory(storyId: string) {
  // Generate more diverse questions across life periods
  const baseQuestions = [
    // Early childhood
    {
      story_id: storyId,
      category: 'early_life',
      question: "Kun je me vertellen over de plek waar je bent opgegroeid? Hoe zag je buurt eruit?",
      type: 'open',
      priority: 1
    },
    {
      story_id: storyId,
      category: 'family',
      question: "Wat is een van je vroegste herinneringen aan je ouders of verzorgers?",
      type: 'open',
      priority: 2
    },
    {
      story_id: storyId,
      category: 'childhood',
      question: "Welk speelgoed of welke activiteit bracht je als kind de meeste vreugde?",
      type: 'open',
      priority: 3
    },
    
    // School years
    {
      story_id: storyId,
      category: 'school',
      question: "Wat herinner je je van je eerste schooldag? Hoe voelde dat?",
      type: 'open',
      priority: 4
    },
    {
      story_id: storyId,
      category: 'education',
      question: "Welke leraar of docent heeft de meeste indruk op je gemaakt?",
      type: 'open',
      priority: 5
    },
    {
      story_id: storyId,
      category: 'friends',
      question: "Wie was je beste vriend(in) tijdens je schooltijd?",
      type: 'open',
      priority: 6
    },
    
    // Young adult
    {
      story_id: storyId,
      category: 'career',
      question: "Wat was je eerste baantje? Hoe was die ervaring?",
      type: 'open',
      priority: 7
    },
    {
      story_id: storyId,
      category: 'independence',
      question: "Wanneer ben je voor het eerst op jezelf gaan wonen?",
      type: 'open',
      priority: 8
    }
  ];

  return baseQuestions;
}

async function updateStoryProgress(storyId: string) {
  try {
    // Get all questions categorized by life periods
    const { data: questions } = await supabase
      .from('questions')
      .select('id, category')
      .eq('story_id', storyId);

    // Get all answers
    const { data: answers } = await supabase
      .from('answers')
      .select('question_id')
      .eq('story_id', storyId);

    const answerIds = new Set(answers?.map(a => a.question_id) || []);

    // Define life periods and their categories
    const lifePeriods = {
      'early_childhood': ['early_life', 'family', 'childhood'],
      'school_years': ['school', 'education', 'friends'],
      'young_adult': ['career', 'relationships', 'independence'],
      'adult_life': ['work', 'marriage', 'achievements'],
      'later_life': ['retirement', 'wisdom', 'legacy']
    };

    // Calculate progress per period
    const periodProgress: Record<string, {
      answered: number;
      total: number;
      percentage: number;
      categories: string[];
    }> = {};

    for (const [period, categories] of Object.entries(lifePeriods)) {
      const periodQuestions = questions?.filter(q => categories.includes(q.category)) || [];
      const answeredCount = periodQuestions.filter(q => answerIds.has(q.id)).length;
      
      periodProgress[period] = {
        answered: answeredCount,
        total: periodQuestions.length,
        percentage: periodQuestions.length > 0 ? Math.round((answeredCount / periodQuestions.length) * 100) : 0,
        categories
      };
    }

    // Calculate overall progress
    const totalQuestions = questions?.length || 0;
    const totalAnswered = answers?.length || 0;
    const overallProgress = totalQuestions > 0 ? Math.min(95, 10 + (totalAnswered / totalQuestions) * 80) : 15;

    // Update story progress with detailed breakdown
    await supabase
      .from('projects')
      .update({ 
        progress: Math.round(overallProgress),
        progress_detail: periodProgress
      })
      .eq('id', storyId);

  } catch (error) {
    console.error('Error updating story progress:', error);
  }
}

async function sendQuestionsViaEmail(userId: string, storyId: string, questions: Array<{
  id: string;
  question: string;
  category: string;
}>) {
  // In production, implement actual email sending
  console.log(`Sending ${questions.length} questions via email for story ${storyId} to user ${userId}`);
  
  // Generate the email HTML content
  const emailHtml = generateQuestionEmail(questions, storyId);
  
  console.log('Email would be sent with content length:', emailHtml.length);
  
  // Here you would integrate with your email service (SendGrid, Mailgun, etc.)
  // Example implementation:
  // const emailService = new EmailService();
  // await emailService.send({
  //   to: getUserEmail(userId),
  //   subject: 'Nieuwe vragen voor je levensverhaal',
  //   html: emailHtml
  // });
  
  return Promise.resolve(true);
}

function generateQuestionEmail(questions: Array<{
  id: string;
  question: string;
  category: string;
}>, storyId: string) {
  const questionsList = questions.slice(0, 3).map((q, index) => `
    <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
      <h3 style="color: #2563eb; margin-bottom: 10px;">Vraag ${index + 1}</h3>
      <p style="font-size: 16px; line-height: 1.5;">${q.question}</p>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/answer?questionId=${q.id}&storyId=${storyId}" 
         style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">
        Beantwoord deze vraag
      </a>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Nieuwe vragen voor je verhaal</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2563eb;">Tijd voor nieuwe verhalen! 📚</h1>
      
      <p>Hallo! Je verhaal groeit mooi en we hebben een paar nieuwe vragen voor je.</p>
      
      <p>Je kunt de vragen beantwoorden door simpelweg te antwoorden op deze e-mail, of door op de knoppen hieronder te klikken:</p>
      
      ${questionsList}
      
      <div style="margin-top: 30px; padding: 20px; background-color: #eff6ff; border-radius: 8px;">
        <h3 style="color: #1d4ed8;">💡 Tips voor het beantwoorden:</h3>
        <ul style="line-height: 1.6;">
          <li>Neem de tijd - er is geen haast</li>
          <li>Vertel zoveel of zo weinig als je wilt</li>
          <li>Je kunt altijd later nog details toevoegen</li>
          <li>Antwoord gewoon via reply op deze e-mail</li>
        </ul>
      </div>
      
      <p style="margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/project/${storyId}" 
           style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
          Bekijk je volledige verhaal
        </a>
      </p>
      
      <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
        Met vriendelijke groet,<br>
        Het WriteMyStory.ai team
      </p>
    </body>
    </html>
  `;
}

