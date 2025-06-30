import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

// Helper function to set user context for RLS
async function setUserContext(userId: string) {
  try {
    await supabase.rpc('set_config', {
      setting_name: 'app.current_user_id',
      setting_value: userId,
      is_local: true
    });
  } catch (error) {
    console.error('Error setting user context:', error);
    // Don't throw, just log the error
  }
}

export async function GET(request: NextRequest) {
  // Check if Supabase is properly configured
  if (!isSupabaseConfigured()) {
    console.error('Supabase not configured properly');
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const storyId = searchParams.get('storyId');
  const userId = searchParams.get('userId');

  if (!storyId || !userId) {
    return NextResponse.json({ error: 'Story ID and User ID are required' }, { status: 400 });
  }

  try {
    // Set user context for RLS
    await setUserContext(userId);

    // Get questions for this story with their answers - updated query
    const { data: questionsData, error: questionsError } = await supabase
      .from('questions')
      .select(`
        *,
        answers!left(
          id,
          answer,
          status,
          skip_reason,
          created_at,
          updated_at
        )
      `)
      .eq('story_id', storyId)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return NextResponse.json({ 
        error: 'Failed to fetch questions', 
        details: questionsError.message 
      }, { status: 500 });
    }

    // Transform the data to include answer status
    const questions = questionsData?.map(question => {
      const answer = question.answers?.[0]; // Get the first (should be only) answer
      return {
        id: question.id,
        story_id: question.story_id,
        category: question.category,
        question: question.question,
        type: question.type,
        priority: question.priority,
        created_at: question.created_at,
        status: answer ? (answer.status || 'answered') : (question.status || 'pending'),
        answer: answer?.answer,
        skipped_reason: answer?.skip_reason,
        answeredAt: answer?.created_at
      };
    }) || [];

    return NextResponse.json({
      success: true,
      questions
    });

  } catch (error) {
    console.error('Error in GET /api/questions:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch questions', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Check if Supabase is properly configured
  if (!isSupabaseConfigured()) {
    console.error('Supabase not configured properly');
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { storyId, userId, type = "basic" } = body;

    if (!storyId || !userId) {
      return NextResponse.json({ error: 'Story ID and User ID are required' }, { status: 400 });
    }

    // Set user context for RLS
    await setUserContext(userId);

    if (type === "smart") {
      // Redirect to the new smart question generation
      const response = await fetch(`${request.nextUrl.origin}/api/generate-questions`, {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify({ projectId: storyId, userId })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Fetch the updated questions
        const questionsResponse = await fetch(`${request.nextUrl.origin}/api/questions?storyId=${storyId}&userId=${userId}`, {
          headers: request.headers
        });
        
        const questionsData = await questionsResponse.json();
        
        return NextResponse.json({
          success: true,
          questions: questionsData.questions || [],
          analysis: data.analysis,
          message: `${data.questionsGenerated} slimme vragen gegenereerd op basis van je antwoorden`
        });
      } else {
        return NextResponse.json(data, { status: response.status });
      }
    }

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
    console.error('Error in POST /api/questions:', error);
    return NextResponse.json({ 
      error: 'Failed to process request', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

function generateQuestionsForStory(storyId: string) {
  // Generate more comprehensive and diverse questions across life periods
  const baseQuestions = [
    // Early life & family
    {
      story_id: storyId,
      category: 'early_life',
      question: "Waar ben je geboren en opgegroeid? Beschrijf je geboorteplaats.",
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
    {
      story_id: storyId,
      category: 'family',
      question: "Heb je broers of zussen? Wat is je mooiste herinnering met hen?",
      type: 'open',
      priority: 4
    },
    
    // School years
    {
      story_id: storyId,
      category: 'school',
      question: "Wat herinner je je van je eerste schooldag? Hoe voelde dat?",
      type: 'open',
      priority: 5
    },
    {
      story_id: storyId,
      category: 'education',
      question: "Welke leraar of docent heeft de meeste indruk op je gemaakt en waarom?",
      type: 'open',
      priority: 6
    },
    {
      story_id: storyId,
      category: 'friends',
      question: "Wie was je beste vriend(in) tijdens je schooltijd? Wat deden jullie samen?",
      type: 'open',
      priority: 7
    },
    {
      story_id: storyId,
      category: 'school',
      question: "Welk schoolvak vond je het leukst en welk vond je het moeilijkst?",
      type: 'open',
      priority: 8
    },
    
    // Young adult & career
    {
      story_id: storyId,
      category: 'career',
      question: "Wat was je eerste baantje? Hoe was die ervaring?",
      type: 'open',
      priority: 9
    },
    {
      story_id: storyId,
      category: 'independence',
      question: "Wanneer ben je voor het eerst op jezelf gaan wonen? Hoe voelde dat?",
      type: 'open',
      priority: 10
    },
    {
      story_id: storyId,
      category: 'relationships',
      question: "Hoe heb je je partner ontmoet? (indien van toepassing)",
      type: 'open',
      priority: 11
    },
    {
      story_id: storyId,
      category: 'milestones',
      question: "Wat was een belangrijk keerpunt in je leven?",
      type: 'open',
      priority: 12
    },
    
    // Personal interests & values
    {
      story_id: storyId,
      category: 'hobbies',
      question: "Wat zijn je hobby's of interesses? Hoe ben je daaraan begonnen?",
      type: 'open',
      priority: 13
    },
    {
      story_id: storyId,
      category: 'achievements',
      question: "Waar ben je het meest trots op in je leven?",
      type: 'open',
      priority: 14
    },
    {
      story_id: storyId,
      category: 'challenges',
      question: "Wat was een moeilijke periode in je leven en hoe heb je dat overwonnen?",
      type: 'open',
      priority: 15
    },
    {
      story_id: storyId,
      category: 'wisdom',
      question: "Welk advies zou je aan je jongere zelf geven?",
      type: 'open',
      priority: 16
    },
    
    // Additional life aspects
    {
      story_id: storyId,
      category: 'travel',
      question: "Wat is de mooiste reis die je ooit hebt gemaakt?",
      type: 'open',
      priority: 17
    },
    {
      story_id: storyId,
      category: 'traditions',
      question: "Welke tradities of gewoonten zijn belangrijk voor je (familie)?",
      type: 'open',
      priority: 18
    },
    {
      story_id: storyId,
      category: 'legacy',
      question: "Hoe wil je herinnerd worden? Wat wil je doorgeven aan volgende generaties?",
      type: 'open',
      priority: 19
    },
    {
      story_id: storyId,
      category: 'gratitude',
      question: "Voor wat ben je het meest dankbaar in je leven?",
      type: 'open',
      priority: 20
    }
  ];

  return baseQuestions;
}

async function updateStoryProgress(storyId: string) {
  try {
    // Get all questions for this story
    const { data: questionsData } = await supabase
      .from('questions')
      .select(`
        id,
        category,
        answers!left(
          id,
          answer
        )
      `)
      .eq('story_id', storyId);

    if (!questionsData) {
      console.log('No questions found for story:', storyId);
      return;
    }

    // Filter questions that have actual answers
    const allQuestions = questionsData;
    const answeredQuestions = questionsData.filter(q => {
      const answer = q.answers?.[0];
      return answer && answer.answer && answer.answer.trim().length > 0;
    });

    console.log(`Progress update: ${answeredQuestions.length}/${allQuestions.length} questions answered`);

    // Define life periods and their categories
    const lifePeriods = {
      'early_childhood': {
        name: 'Vroege Jeugd',
        icon: '🍼',
        categories: ['early_life', 'family', 'childhood']
      },
      'school_years': {
        name: 'Schooltijd', 
        icon: '🎓',
        categories: ['school', 'education', 'friends']
      },
      'young_adult': {
        name: 'Jong Volwassen',
        icon: '🌟', 
        categories: ['career', 'relationships', 'independence']
      },
      'adult_life': {
        name: 'Volwassen Leven',
        icon: '💼',
        categories: ['work', 'marriage', 'achievements', 'hobbies', 'travel']
      },
      'later_life': {
        name: 'Later Leven',
        icon: '🌅',
        categories: ['retirement', 'wisdom', 'legacy', 'challenges']
      }
    };

    // Calculate progress per period
    const periodProgress: Record<string, {
      answered: number;
      total: number;
      percentage: number;
      name: string;
      icon: string;
      categories: string[];
    }> = {};

    for (const [periodKey, periodInfo] of Object.entries(lifePeriods)) {
      const periodQuestions = allQuestions.filter(q => 
        periodInfo.categories.includes(q.category)
      );
      const periodAnswered = answeredQuestions.filter(q => 
        periodInfo.categories.includes(q.category)
      );
      
      periodProgress[periodKey] = {
        answered: periodAnswered.length,
        total: periodQuestions.length,
        percentage: periodQuestions.length > 0 
          ? Math.round((periodAnswered.length / periodQuestions.length) * 100) 
          : 0,
        name: periodInfo.name,
        icon: periodInfo.icon,
        categories: periodInfo.categories
      };
    }

    // Calculate overall progress
    const totalQuestions = allQuestions.length;
    const totalAnswered = answeredQuestions.length;
    const overallProgress = totalQuestions > 0 
      ? Math.round((totalAnswered / totalQuestions) * 100) 
      : 15; // Default minimum progress

    console.log('Updating project with progress:', {
      overall: overallProgress,
      periods: Object.keys(periodProgress).length,
      totalAnswered,
      totalQuestions
    });

    // Update project with detailed progress
    const { error: updateError } = await supabase
      .from('projects')
      .update({ 
        progress: overallProgress,
        progress_detail: periodProgress,
        updated_at: new Date().toISOString()
      })
      .eq('id', storyId);

    if (updateError) {
      console.error('Error updating project progress:', updateError);
    } else {
      console.log('Successfully updated project progress');
    }

  } catch (error) {
    console.error('Error in updateStoryProgress:', error);
  }
}

async function sendQuestionsViaEmail(userId: string, storyId: string, questions: Array<{
  id: string;
  question: string;
  category: string;
}>) {
  try {
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
  } catch (error) {
    console.error('Error in sendQuestionsViaEmail:', error);
    return Promise.resolve(false);
  }
}

function generateQuestionEmail(questions: Array<{
  id: string;
  question: string;
  category: string;
}>, storyId: string) {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://writemystory.ai';
    
    const questionsList = questions.slice(0, 3).map((q, index) => `
      <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
        <h3 style="color: #2563eb; margin-bottom: 10px;">Vraag ${index + 1}</h3>
        <p style="font-size: 16px; line-height: 1.5;">${q.question}</p>
        <a href="${siteUrl}/answer?questionId=${q.id}&storyId=${storyId}" 
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
          <a href="${siteUrl}/project/${storyId}" 
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
  } catch (error) {
    console.error('Error generating email HTML:', error);
    return '<p>Error generating email content</p>';
  }
}

