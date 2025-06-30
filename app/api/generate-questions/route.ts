import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { createMessagesWithSystemPrompt, TOGETHER_AI_CONFIG } from '../../../lib/aiPrompts';

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
  }
}

interface ProjectData {
  id: string;
  subject_type: string;
  person_name?: string;
  period_type: string;
  writing_style: string;
  metadata?: Record<string, unknown>;
}

interface AnsweredQuestion {
  id: string;
  question: string;
  answer: string;
  category: string;
  created_at: string;
}

async function fetchProjectAndAnswers(projectId: string, userId: string) {
  try {
    await setUserContext(userId);

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      console.error('Error fetching project:', projectError);
      return null;
    }

    // Get all answered questions and their answers
    const { data: questionsData, error: questionsError } = await supabase
      .from('questions')
      .select(`
        *,
        answers!left(
          id,
          answer,
          status,
          created_at
        )
      `)
      .eq('story_id', projectId)
      .order('created_at', { ascending: true });

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return { project, answers: [] };
    }

    // Filter to only questions that have answers and transform the data
    const answers = questionsData?.filter(question => {
      const answer = question.answers?.[0];
      return answer && answer.answer && answer.answer.trim().length > 0;
    }).map(question => {
      const answer = question.answers[0];
      return {
        id: answer.id,
        question: question.question,
        answer: answer.answer,
        category: question.category,
        created_at: answer.created_at
      };
    }) || [];

    return { project, answers };
  } catch (error) {
    console.error('Error in fetchProjectAndAnswers:', error);
    return null;
  }
}

function createAnalysisPrompt(project: ProjectData, answers: AnsweredQuestion[]): string {
  const personName = project.subject_type === 'self' ? 'de persoon' : project.person_name || 'de persoon';
  
  const answersText = answers.map(a => 
    `Categorie: ${a.category}\nVraag: ${a.question}\nAntwoord: ${a.answer}`
  ).join('\n\n');

  return `Je bent een ervaren biografieschrijver die het levensverhaal van ${personName} in kaart brengt.

ANALYSE OPDRACHT:
Analyseer de onderstaande beantwoorde vragen en geef een gestructureerde analyse in het Nederlands.

PROJECT DETAILS:
- Onderwerp: ${project.subject_type === 'self' ? 'Eigen verhaal' : `Verhaal van ${project.person_name}`}
- Periode: ${project.period_type}
- Aantal beantwoorde vragen: ${answers.length}

BEANTWOORDE VRAGEN:
${answersText}

Geef een analyse in exact deze structuur:

## SAMENVATTING VERHAAL TOT NU TOE
[Een samenvattende beschrijving van wat we nu weten over het leven van de persoon]

## BEHANDELDE ONDERWERPEN
[Welke levensfases/onderwerpen zijn al goed behandeld]

## ONTBREKENDE INFORMATIE IN HUIDIGE PERIODE
[Wat ontbreekt er nog in de onderwerpen die al behandeld zijn]

## VOLGENDE PERIODE OF THEMA
[Welke nieuwe levensperiode of thema moet nu worden onderzocht]

## AANBEVELING VOOR NIEUWE VRAGEN
[Of we moeten inzoomen op ontbrekende details van huidige periode, of doorgaan naar nieuwe periode]

Houd het beknopt maar informatief.`;
}

function createQuestionGenerationPrompt(project: ProjectData, analysis: string): string {
  const personName = project.subject_type === 'self' ? 'de persoon' : project.person_name || 'de persoon';
  
  return `Je bent een ervaren biografieschrijver die nieuwe vragen genereert voor het levensverhaal van ${personName}.

CONTEXT:
${analysis}

OPDRACHT:
Genereer 8 nieuwe, specifieke vragen in het Nederlands gebaseerd op de analyse hierboven.

RICHTLIJNEN:
- Maak de vragen persoonlijk en uitnodigend
- Vraag naar concrete details, emoties en betekenis
- Vermijd vragen die al beantwoord zijn
- Focus op wat ontbreekt of de volgende periode
- Gebruik een warme, nieuwsgierige toon
- Varieer tussen feitelijke en emotionele vragen

CATEGORIEËN (kies passende categorieën):
- childhood (jeugd)
- education (onderwijs)
- career (werk/carrière)
- family (familie)
- relationships (relaties)
- hobbies (hobby's/interesses)
- travel (reizen)
- challenges (uitdagingen)
- achievements (prestaties)
- general (algemeen)

Geef precies 8 vragen in dit formaat:

1. [CATEGORIE] - [VRAAG]
2. [CATEGORIE] - [VRAAG]
3. [CATEGORIE] - [VRAAG]
4. [CATEGORIE] - [VRAAG]
5. [CATEGORIE] - [VRAAG]
6. [CATEGORIE] - [VRAAG]
7. [CATEGORIE] - [VRAAG]
8. [CATEGORIE] - [VRAAG]

Maak elke vraag uniek en specifiek voor dit verhaal.`;
}

function createIntroductionAnalysisPrompt(project: ProjectData, introduction: string): string {
  const personName = project.subject_type === 'self' ? 'de persoon' : project.person_name || 'de persoon';
  
  return `Je bent een ervaren biografieschrijver die het levensverhaal van ${personName} in kaart brengt.

ANALYSE OPDRACHT:
Analyseer de onderstaande introductie en geef een gestructureerde analyse in het Nederlands.

PROJECT DETAILS:
- Onderwerp: ${project.subject_type === 'self' ? 'Eigen verhaal' : `Verhaal van ${project.person_name}`}
- Periode: ${project.period_type}

INTRODUCTIE VERHAAL:
${introduction}

Geef een analyse in exact deze structuur:

## SAMENVATTING VERHAAL
[Een beknopte samenvatting van wat we nu weten over het leven van de persoon]

## HOOFDTHEMAS GEÏDENTIFICEERD
[Welke hoofdthema's en levensfases komen naar voren]

## STERKE PUNTEN IN HET VERHAAL
[Welke aspecten zijn al goed uitgewerkt]

## ONTBREKENDE INFORMATIE
[Wat ontbreekt er nog en zou uitgebreid kunnen worden]

## INTERESSANTE AANKNOPINGSPUNTEN
[Specifieke details die verder uitgediept kunnen worden]

## AANBEVELING VOOR VRAGEN
[Welke richting de eerste vragen op moeten]

Houd het beknopt maar informatief.`;
}

function createIntroductionQuestionPrompt(project: ProjectData, analysis: string, introduction: string): string {
  const personName = project.subject_type === 'self' ? 'de persoon' : project.person_name || 'de persoon';
  
  return `Je bent een ervaren biografieschrijver die nieuwe vragen genereert voor het levensverhaal van ${personName}.

CONTEXT:
De persoon heeft een introductieverhaal geschreven. Hier is de analyse:

${analysis}

ORIGINELE INTRODUCTIE:
${introduction}

OPDRACHT:
Genereer 8 specifieke, gerichte vragen in het Nederlands die voortbouwen op het introductieverhaal.

RICHTLIJNEN:
- Bouw voort op details die al genoemd zijn in de introductie
- Vraag naar concrete voorbeelden en verhalen
- Focus op emoties, gevoelens en betekenis
- Maak vragen die uitnodigen tot uitgebreide antwoorden
- Vermijd algemene vragen - maak ze specifiek voor dit verhaal
- Gebruik een warme, nieuwsgierige toon
- Varieer tussen verschillende levensfases en thema's die genoemd zijn

CATEGORIEËN (kies passende categorieën op basis van de introductie):
- childhood (jeugd)
- education (onderwijs)
- career (werk/carrière)  
- family (familie)
- relationships (relaties)
- hobbies (hobby's/interesses)
- travel (reizen)
- challenges (uitdagingen)
- achievements (prestaties)
- general (algemeen)

Geef precies 8 vragen in dit formaat:

1. [CATEGORIE] - [VRAAG]
2. [CATEGORIE] - [VRAAG]
3. [CATEGORIE] - [VRAAG]
4. [CATEGORIE] - [VRAAG]
5. [CATEGORIE] - [VRAAG]
6. [CATEGORIE] - [VRAAG]
7. [CATEGORIE] - [VRAAG]
8. [CATEGORIE] - [VRAAG]

Maak elke vraag persoonlijk en specifiek voor dit verhaal.`;
}

async function callMistralForAnalysis(prompt: string): Promise<string> {
  const apiKey = process.env.TOGETHER_AI_API_KEY;
  
  if (!apiKey) {
    throw new Error('TOGETHER_AI_API_KEY environment variable is not set');
  }

  try {
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...TOGETHER_AI_CONFIG,
        messages: createMessagesWithSystemPrompt(prompt),
        max_tokens: 1500, // Override for questions generation
      }),
    });

    if (!response.ok) {
      throw new Error(`Together.ai API error: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('=== AI API RESPONSE DEBUG ===');
    console.log('Response status:', response.status);
    console.log('Data structure:', Object.keys(data));
    console.log('Raw content:', data.choices?.[0]?.message?.content);
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling Mistral API:', error);
    throw error;
  }
}

async function parseAndSaveQuestions(questionsText: string, projectId: string): Promise<Array<{
  id: string;
  story_id: string;
  category: string;
  question: string;
  type: string;
  priority: number;
  created_at: string;
}>> {
  console.log('=== RAW AI RESPONSE ===');
  console.log('Full response length:', questionsText.length);
  console.log('First 500 chars:', questionsText.substring(0, 500));
  console.log('All lines:', questionsText.split('\n').map((line, i) => `${i}: "${line}"`));
  
  const lines = questionsText.split('\n').filter(line => line.trim().match(/^\d+\./));
  console.log('=== PARSING DEBUG ===');
  console.log('Lines matching number pattern:', lines.length);
  console.log('Filtered lines:', lines);
  
  const questions = [];

  for (const line of lines) {
    // Updated regex to handle the actual format: "1. Categorie - Vraag"
    // This matches: number + dot + optional spaces + category + dash + question
    const match = line.match(/^\s*\d+[.)]?\s*([^-]+)\s*[-–—]\s*(.+)$/);
    console.log('=== LINE PARSING ===');
    console.log('Line:', line);
    console.log('Match result:', match);
    
    if (match) {
      const [, category, questionText] = match;
      // Clean up category (remove extra spaces)
      const cleanCategory = category.trim().toLowerCase();
      const cleanQuestion = questionText.trim();
      
      console.log('Extracted - Category:', cleanCategory, 'Question:', cleanQuestion);
      
      try {
        const { data: question, error } = await supabase
          .from('questions')
          .insert({
            story_id: projectId,
            category: cleanCategory,
            question: cleanQuestion,
            type: 'open',
            priority: 1,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (!error && question) {
          console.log('Successfully saved question:', question.id);
          questions.push(question);
        } else {
          console.error('Error saving question:', error);
        }
      } catch (error) {
        console.error('Error saving question:', error);
      }
    } else {
      console.log('No match for line:', line);
      
      // Try alternative parsing for edge cases
      const alternativeMatch = line.match(/^\s*\d+[.)]?\s*(.+)$/);
      if (alternativeMatch) {
        const fullText = alternativeMatch[1].trim();
        // If it contains a dash, split on the first dash
        const dashIndex = fullText.indexOf(' - ');
        if (dashIndex > 0) {
          const category = fullText.substring(0, dashIndex).trim().toLowerCase();
          const questionText = fullText.substring(dashIndex + 3).trim();
          console.log('Alternative parsing - Category:', category, 'Question:', questionText);
          
          try {
            const { data: question, error } = await supabase
              .from('questions')
              .insert({
                story_id: projectId,
                category: category,
                question: questionText,
                type: 'open',
                priority: 1,
                created_at: new Date().toISOString()
              })
              .select()
              .single();

            if (!error && question) {
              console.log('Successfully saved question (alternative):', question.id);
              questions.push(question);
            }
          } catch (error) {
            console.error('Error saving question (alternative):', error);
          }
        }
      }
    }
  }

  console.log('=== FINAL PARSING RESULT ===');
  console.log('Total questions saved:', questions.length);
  
  // Update progress after adding new questions
  if (questions.length > 0) {
    await updateStoryProgress(projectId);
  }
  
  return questions;
}

// Add the updateStoryProgress function to this file as well
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
      return;
    }

    // Filter questions that have actual answers
    const allQuestions = questionsData;
    const answeredQuestions = questionsData.filter(q => {
      const answer = q.answers?.[0] as { answer: string } | undefined;
      return answer && answer.answer && answer.answer.trim().length > 0;
    });

    // Define life periods and their categories
    const lifePeriods: Record<string, {
      name: string;
      icon: string;
      categories: string[];
    }> = {
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
      : 15;

    // Update project with detailed progress
    await supabase
      .from('projects')
      .update({ 
        progress: overallProgress,
        progress_detail: periodProgress,
        updated_at: new Date().toISOString()
      })
      .eq('id', storyId);

  } catch (error) {
    console.error('Error in updateStoryProgress:', error);
  }
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  if (!process.env.TOGETHER_AI_API_KEY) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { projectId, userId, analysisOnly = false, introduction, type } = body;

    if (!projectId || !userId) {
      return NextResponse.json({ 
        error: 'Project ID and User ID are required' 
      }, { status: 400 });
    }

    console.log(`Generating smart questions for project ${projectId}`);

    // Step 1: Fetch project and answered questions
    const data = await fetchProjectAndAnswers(projectId, userId);
    
    if (!data) {
      return NextResponse.json({ 
        error: 'Project not found or no access' 
      }, { status: 404 });
    }

    const { project, answers } = data;

    // Check if there's an introduction available
    let introductionText = introduction;
    if (!introductionText) {
      try {
        console.log('Looking for introduction in project metadata:', project.metadata);
        // First check if introduction is stored in project metadata
        if (project.metadata?.introduction) {
          introductionText = project.metadata.introduction;
          console.log('Found introduction in project metadata:', introductionText.substring(0, 100) + '...');
        } else {
          console.log('No introduction in project metadata, checking introductions table');
          // Fallback: check introductions table
          const { data: introData, error } = await supabase
            .from('introductions')
            .select('introduction')
            .eq('project_id', projectId)
            .eq('user_id', userId)
            .single();
          
          if (!error && introData) {
            introductionText = introData.introduction;
            console.log('Found introduction in introductions table:', introductionText.substring(0, 100) + '...');
          }
        }
      } catch {
        console.log('No introduction found, continuing with answers only');
      }
    }

    // Check if we have enough context for smart questions
    if (!introductionText && answers.length === 0) {
      return NextResponse.json({ 
        error: 'Voor slimme vragen heb je een introductie nodig of beantwoorde vragen. Schrijf eerst een introductie of beantwoord enkele basis vragen.' 
      }, { status: 400 });
    }

    // Handle introduction-based question generation
    if (introductionText && (type === 'introduction' || answers.length === 0)) {
      console.log('Generating questions from introduction');
      
      // Step 1: Analyze the introduction
      const analysisPrompt = createIntroductionAnalysisPrompt(project, introductionText);
      const analysis = await callMistralForAnalysis(analysisPrompt);

      if (analysisOnly) {
        return NextResponse.json({
          success: true,
          analysis,
          introduction: introductionText
        });
      }

      // Step 2: Generate questions based on introduction analysis
      const questionPrompt = createIntroductionQuestionPrompt(project, analysis, introductionText);
      const questionsText = await callMistralForAnalysis(questionPrompt);

      // Step 3: Parse and save questions to database
      const savedQuestions = await parseAndSaveQuestions(questionsText, projectId);

      return NextResponse.json({
        success: true,
        analysis,
        questionsGenerated: savedQuestions.length,
        questions: savedQuestions,
        rawQuestionsText: questionsText,
        type: 'introduction',
        message: `${savedQuestions.length} slimme vragen gegenereerd op basis van je introductie`
      });
    }

    // Handle regular answer-based question generation
    if (answers.length === 0) {
      return NextResponse.json({ 
        error: 'No answered questions found. Answer some questions first before generating new ones.' 
      }, { status: 400 });
    }

    console.log(`Found ${answers.length} answered questions for analysis`);

    // Step 2: Generate analysis using LLM
    const analysisPrompt = createAnalysisPrompt(project, answers);
    console.log('Generating story analysis...');
    const analysis = await callMistralForAnalysis(analysisPrompt);

    if (analysisOnly) {
      return NextResponse.json({
        success: true,
        analysis,
        answeredQuestions: answers.length
      });
    }

    // Step 3: Generate new questions based on analysis
    const questionPrompt = createQuestionGenerationPrompt(project, analysis);
    console.log('Generating new questions...');
    const questionsText = await callMistralForAnalysis(questionPrompt);

    // Step 4: Parse and save questions to database
    console.log('Parsing and saving questions...');
    const savedQuestions = await parseAndSaveQuestions(questionsText, projectId);

    console.log(`Generated and saved ${savedQuestions.length} new questions`);

    return NextResponse.json({
      success: true,
      analysis,
      questionsGenerated: savedQuestions.length,
      questions: savedQuestions,
      rawQuestionsText: questionsText, // Add this to see the raw response in frontend
      message: `${savedQuestions.length} slimme vragen gegenereerd op basis van je antwoorden`,
      debugInfo: {
        promptLength: questionPrompt.length,
        responseLength: questionsText.length,
        linesFound: questionsText.split('\n').filter(line => line.trim().match(/^\d+\./)).length
      }
    });

  } catch (error) {
    console.error('Error in generate-questions API:', error);
    return NextResponse.json({ 
      error: 'Failed to generate questions', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// GET endpoint to get the latest analysis
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const userId = searchParams.get('userId');

  if (!projectId || !userId) {
    return NextResponse.json({ 
      error: 'Project ID and User ID are required' 
    }, { status: 400 });
  }

  try {
    const data = await fetchProjectAndAnswers(projectId, userId);
    
    if (!data || data.answers.length === 0) {
      return NextResponse.json({ 
        error: 'No answered questions found' 
      }, { status: 404 });
    }

    const { project, answers } = data;
    const analysisPrompt = createAnalysisPrompt(project, answers);
    const analysis = await callMistralForAnalysis(analysisPrompt);

    return NextResponse.json({
      success: true,
      analysis,
      answeredQuestions: answers.length,
      lastAnswer: answers[answers.length - 1]?.created_at
    });

  } catch (error) {
    console.error('Error getting analysis:', error);
    return NextResponse.json({ 
      error: 'Failed to get analysis' 
    }, { status: 500 });
  }
}
