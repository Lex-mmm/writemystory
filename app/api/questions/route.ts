import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { PostmarkService } from '../../../lib/postmarkService';

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
    console.log('Fetching questions for story:', storyId, 'user:', userId);

    // First verify the user has access to this project
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', storyId)
      .eq('user_id', userId);

    if (projectError) {
      console.error('Error verifying project access:', projectError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!projects || projects.length === 0) {
      console.error('No project access for user:', userId, 'story:', storyId);
      return NextResponse.json({ error: 'Project not found or no access' }, { status: 404 });
    }

    console.log('Project access verified, fetching questions...');

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

    console.log('POST questions - type:', type, 'storyId:', storyId, 'userId:', userId);

    // Verify user has access to this project
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', storyId)
      .eq('user_id', userId);

    if (projectError) {
      console.error('Error verifying project access:', projectError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!projects || projects.length === 0) {
      console.error('No project access for user:', userId, 'story:', storyId);
      return NextResponse.json({ error: 'Project not found or no access' }, { status: 404 });
    }

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
      // Get project info to check if person is deceased
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('is_deceased, passed_away_year, person_name, subject_type')
        .eq('id', storyId)
        .eq('user_id', userId)
        .single();

      if (projectError) {
        console.error('Error fetching project:', projectError);
        return NextResponse.json({ error: 'Failed to fetch project information' }, { status: 500 });
      }

      // Generate new questions for the story
      const newQuestions = generateQuestionsForStory(
        storyId, 
        project?.is_deceased || false, 
        project?.subject_type || 'self',
        project?.person_name
      );
      
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

export async function DELETE(request: NextRequest) {
  // Check if Supabase is properly configured
  if (!isSupabaseConfigured()) {
    console.error('Supabase not configured properly');
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');
    const userId = searchParams.get('userId');

    if (!questionId || !userId) {
      return NextResponse.json({ error: 'Question ID and User ID are required' }, { status: 400 });
    }

    // Set user context for RLS
    await setUserContext(userId);

    // First, delete any answers associated with this question
    const { error: deleteAnswersError } = await supabase
      .from('answers')
      .delete()
      .eq('question_id', questionId);

    if (deleteAnswersError) {
      console.error('Error deleting answers:', deleteAnswersError);
      return NextResponse.json({ 
        error: 'Failed to delete question answers', 
        details: deleteAnswersError.message 
      }, { status: 500 });
    }

    // Then delete the question itself
    const { error: deleteQuestionError } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId);

    if (deleteQuestionError) {
      console.error('Error deleting question:', deleteQuestionError);
      return NextResponse.json({ 
        error: 'Failed to delete question', 
        details: deleteQuestionError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/questions:', error);
    return NextResponse.json({ 
      error: 'Failed to delete question', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

function generateQuestionsForStory(
  storyId: string, 
  isDeceased: boolean = false, 
  subjectType: 'self' | 'other' = 'self',
  personName?: string
) {
  // Generate factual, biographical questions for comprehensive life documentation
  // Adjust tense and perspective based on whether it's about self or someone else
  
  const isSelfStory = subjectType === 'self';
  const pronoun = isSelfStory ? 'je' : (isDeceased ? 'hij/zij' : 'hij/zij');
  const possessive = isSelfStory ? 'je' : (isDeceased ? 'zijn/haar' : 'zijn/haar');
  // const verbForm = isSelfStory ? '' : (isDeceased ? '' : ''); // Will be handled in individual questions - not used currently
  
  const baseQuestions = [
    // Early life & family - FACTUAL
    {
      story_id: storyId,
      category: 'early_life',
      question: isSelfStory 
        ? `Waar en wanneer ben je geboren? Beschrijf je geboorteplaats en -datum.`
        : `Waar en wanneer ${isDeceased ? 'werd' : 'is'} ${personName || 'hij/zij'} geboren? Beschrijf ${possessive} geboorteplaats en -datum.`,
      type: 'open',
      priority: 1
    },
    {
      story_id: storyId,
      category: 'family',
      question: isSelfStory
        ? `Wat zijn de namen van je ouders en wat was hun beroep?`
        : `Wat ${isDeceased ? 'waren' : 'zijn'} de namen van ${possessive} ouders en wat was hun beroep?`,
      type: 'open',
      priority: 2
    },
    {
      story_id: storyId,
      category: 'family',
      question: isSelfStory
        ? `Heb je broers of zussen? Wat zijn hun namen en geboortejaren?`
        : `${isDeceased ? 'Had' : 'Heeft'} ${personName || pronoun} broers of zussen? Wat ${isDeceased ? 'waren' : 'zijn'} hun namen en geboortejaren?`,
      type: 'open',
      priority: 3
    },
    {
      story_id: storyId,
      category: 'childhood',
      question: isSelfStory
        ? `In welke straat/wijk woonde je als kind? Beschrijf het huis en de buurt.`
        : `In welke straat/wijk ${isDeceased ? 'woonde' : 'woont'} ${personName || pronoun} als kind? Beschrijf het huis en de buurt.`,
      type: 'open',
      priority: 4
    },
    
    // School & education - FACTUAL
    {
      story_id: storyId,
      category: 'education',
      question: isSelfStory
        ? `Welke scholen heb je bezocht? (naam, plaats, jaartallen)`
        : `Welke scholen ${isDeceased ? 'heeft' : 'heeft'} ${personName || pronoun} bezocht? (naam, plaats, jaartallen)`,
      type: 'open',
      priority: 5
    },
    {
      story_id: storyId,
      category: 'education',
      question: isSelfStory
        ? `Welke opleiding(en) heb je gevolgd na de middelbare school?`
        : `Welke opleiding(en) ${isDeceased ? 'heeft' : 'heeft'} ${personName || pronoun} gevolgd na de middelbare school?`,
      type: 'open',
      priority: 6
    },
    {
      story_id: storyId,
      category: 'education',
      question: isSelfStory
        ? `Heb je diploma's, certificaten of speciale kwalificaties behaald?`
        : `${isDeceased ? 'Heeft' : 'Heeft'} ${personName || pronoun} diploma's, certificaten of speciale kwalificaties behaald?`,
      type: 'open',
      priority: 7
    },
    {
      story_id: storyId,
      category: 'education',
      question: isSelfStory
        ? `In welke vakken of onderwerpen excelleerde je op school?`
        : `In welke vakken of onderwerpen ${isDeceased ? 'excelleerde' : 'excelleert'} ${personName || pronoun} op school?`,
      type: 'open',
      priority: 8
    },
    
    // Career & work - FACTUAL  
    {
      story_id: storyId,
      category: 'career',
      question: isSelfStory
        ? `Wat was je eerste baan en bij welk bedrijf? (inclusief jaartallen)`
        : `Wat was ${possessive} eerste baan en bij welk bedrijf? (inclusief jaartallen)`,
      type: 'open',
      priority: 9
    },
    {
      story_id: storyId,
      category: 'career',
      question: isSelfStory
        ? `Welke carrièrestappen heb je gemaakt? Beschrijf je werkgeschiedenis.`
        : `Welke carrièrestappen ${isDeceased ? 'heeft' : 'heeft'} ${personName || pronoun} gemaakt? Beschrijf ${possessive} werkgeschiedenis.`,
      type: 'open',
      priority: 10
    },
    {
      story_id: storyId,
      category: 'career',
      question: isSelfStory
        ? `In welke sector/industrie heb je het grootste deel van je carrière gewerkt?`
        : `In welke sector/industrie ${isDeceased ? 'heeft' : 'heeft'} ${personName || pronoun} het grootste deel van ${possessive} carrière gewerkt?`,
      type: 'open',
      priority: 11
    },
    {
      story_id: storyId,
      category: 'career',
      question: isSelfStory
        ? `Welke functietitels heb je gehad en wat waren je hoofdtaken?`
        : `Welke functietitels ${isDeceased ? 'heeft' : 'heeft'} ${personName || pronoun} gehad en wat waren ${possessive} hoofdtaken?`,
      type: 'open',
      priority: 12
    },
    
    // Personal life - FACTUAL
    {
      story_id: storyId,
      category: 'relationships',
      question: isSelfStory
        ? `Ben je getrouwd (geweest)? Naam van partner(s) en trouwdatum(s)?`
        : `${isDeceased ? 'Was' : 'Is'} ${personName || pronoun} getrouwd (geweest)? Naam van partner(s) en trouwdatum(s)?`,
      type: 'open',
      priority: 13
    },
    {
      story_id: storyId,
      category: 'family',
      question: isSelfStory
        ? `Heb je kinderen? Namen, geboortejaren en hun belangrijkste prestaties?`
        : `${isDeceased ? 'Had' : 'Heeft'} ${personName || pronoun} kinderen? Namen, geboortejaren en hun belangrijkste prestaties?`,
      type: 'open',
      priority: 14
    },
    {
      story_id: storyId,
      category: 'general',
      question: isSelfStory
        ? `In welke plaatsen heb je gewoond gedurende je leven? (inclusief jaartallen)`
        : `In welke plaatsen ${isDeceased ? 'heeft' : 'heeft'} ${personName || pronoun} gewoond gedurende ${possessive} leven? (inclusief jaartallen)`,
      type: 'open',
      priority: 15
    },
    {
      story_id: storyId,
      category: 'general',
      question: isSelfStory
        ? `Welke belangrijke data en mijlpalen zou je willen documenteren?`
        : `Welke belangrijke data en mijlpalen zou je willen documenteren uit ${possessive} leven?`,
      type: 'open',
      priority: 16
    },
    
    // Achievements & activities - FACTUAL
    {
      story_id: storyId,
      category: 'achievements',
      question: isSelfStory
        ? `Welke prijzen, onderscheidingen of erkenningen heb je ontvangen?`
        : `Welke prijzen, onderscheidingen of erkenningen ${isDeceased ? 'heeft' : 'heeft'} ${personName || pronoun} ontvangen?`,
      type: 'open',
      priority: 17
    },
    {
      story_id: storyId,
      category: 'hobbies',
      question: isSelfStory
        ? `In welke verenigingen, clubs of organisaties ben je actief (geweest)?`
        : `In welke verenigingen, clubs of organisaties ${isDeceased ? 'was' : 'is'} ${personName || pronoun} actief (geweest)?`,
      type: 'open',
      priority: 18
    },
    {
      story_id: storyId,
      category: 'travel',
      question: isSelfStory
        ? `Naar welke landen of bijzondere plaatsen heb je gereisd? (jaartallen)`
        : `Naar welke landen of bijzondere plaatsen ${isDeceased ? 'heeft' : 'heeft'} ${personName || pronoun} gereisd? (jaartallen)`,
      type: 'open',
      priority: 19
    },
    {
      story_id: storyId,
      category: 'general',
      question: isSelfStory
        ? `Welke belangrijke historische gebeurtenissen heb je meegemaakt?`
        : `Welke belangrijke historische gebeurtenissen ${isDeceased ? 'heeft' : 'heeft'} ${personName || pronoun} meegemaakt?`,
      type: 'open',
      priority: 20
    }
  ];

  // Add memorial-specific questions if the person is deceased
  if (isDeceased) {
    const memorialQuestions = [
      {
        story_id: storyId,
        category: 'memorial',
        question: isSelfStory 
          ? "Wat waren je meest bijzondere karaktereigenschappen die mensen zich herinneren?"
          : `Wat waren ${possessive} meest bijzondere karaktereigenschappen die mensen zich herinneren?`,
        type: 'open',
        priority: 21
      },
      {
        story_id: storyId,
        category: 'memorial',
        question: isSelfStory
          ? "Welke wijze woorden, uitspraken of levenslessen deelde je vaak?"
          : `Welke wijze woorden, uitspraken of levenslessen deelde ${personName || pronoun} vaak?`,
        type: 'open',
        priority: 22
      },
      {
        story_id: storyId,
        category: 'memorial',
        question: isSelfStory
          ? "Wat was je grootste passie of wat maakte je het gelukkigst?"
          : `Wat was ${possessive} grootste passie of wat maakte ${personName || pronoun} het gelukkigst?`,
        type: 'open',
        priority: 23
      },
      {
        story_id: storyId,
        category: 'memorial',
        question: isSelfStory
          ? "Welke betekenisvolle herinneringen of tradities blijven voortleven?"
          : "Welke betekenisvolle herinneringen of tradities blijven voortleven?",
        type: 'open',
        priority: 24
      },
      {
        story_id: storyId,
        category: 'memorial',
        question: isSelfStory
          ? "Hoe zou je graag herinnerd willen worden?"
          : `Hoe zou ${personName || pronoun} graag herinnerd willen worden?`,
        type: 'open',
        priority: 25
      }
    ];
    
    baseQuestions.push(...memorialQuestions);
  }

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
    console.log(`📧 Sending ${questions.length} questions via Postmark email for story ${storyId} to user ${userId}`);
    
    // Get project info to personalize the email
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('person_name, subject_type')
      .eq('id', storyId)
      .single();

    if (projectError) {
      console.error('⚠️ Could not fetch project info:', projectError);
    }

    const personName = project?.person_name || 'je verhaal';
    const isOwn = project?.subject_type === 'self';
    
    // Get team members for this story to send to
    const { data: teamMembers, error: teamError } = await supabase
      .from('story_team_members')
      .select('email, name')
      .eq('story_id', storyId);

    if (teamError) {
      console.error('⚠️ Could not fetch team members:', teamError);
      return false;
    }

    if (!teamMembers || teamMembers.length === 0) {
      console.log('ℹ️ No team members found for story, skipping email sending');
      return true; // Not an error, just no team members
    }

    console.log(`📮 Found ${teamMembers.length} team members to send questions to`);

    // Initialize Postmark service
    const postmarkService = new PostmarkService();
    
    // Send emails to each team member
    const emailPromises = teamMembers.map(async (member) => {
      try {
        console.log(`📤 Sending questions to team member: ${member.name} (${member.email})`);
        
        const result = await postmarkService.sendMultipleQuestionsEmail({
          to: member.email,
          memberName: member.name || 'Team Member',
          questions: questions,
          storyId,
          personName,
          isOwnStory: isOwn
        });
        
        if (result.success) {
          console.log(`✅ Email sent successfully to ${member.email}, Message ID: ${result.messageId}`);
          
          // Mark questions as sent
          for (const question of questions) {
            await supabase
              .from('questions')
              .update({ 
                sent_at: new Date().toISOString(),
                status: 'sent'
              })
              .eq('id', question.id);
          }
          
          return { success: true, email: member.email, messageId: result.messageId };
        } else {
          console.error(`❌ Failed to send email to ${member.email}:`, result.error);
          return { success: false, email: member.email, error: result.error };
        }
      } catch (error) {
        console.error(`❌ Error sending email to ${member.email}:`, error);
        return { success: false, email: member.email, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    const results = await Promise.allSettled(emailPromises);
    
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failCount = results.length - successCount;
    
    console.log(`📊 Email sending summary: ${successCount} successful, ${failCount} failed out of ${results.length} total`);
    
    if (failCount > 0) {
      console.warn('⚠️ Some emails failed to send. Check logs above for details.');
    }
    
    return successCount > 0; // Return true if at least one email was sent successfully
    
  } catch (error) {
    console.error('❌ Error in sendQuestionsViaEmail:', error);
    return false;
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

