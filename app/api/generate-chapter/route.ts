import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { createMessagesWithSystemPrompt } from '../../../lib/aiPrompts';

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

interface StoryData {
  project: {
    id: string;
    person_name?: string;
    subject_type: string;
    writing_style: string;
    period_type: string;
    user_id: string;
  };
  answers: Array<{
    id: string;
    question: string;
    answer: string;
    category: string;
    created_at: string;
  }>;
}

interface GeneratedChapter {
  id: string;
  project_id: string;
  chapter_title: string;
  chapter_content: string;
  chapter_number: number;
  category: string;
  created_at: string;
}

interface QuestionData {
  question: string;
  category: string;
}

async function fetchStoryData(projectId: string, userId: string): Promise<StoryData | null> {
  try {
    // Set user context for RLS
    await setUserContext(userId);

    // Fetch project details
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

    // Fetch answered questions and their answers
    const { data: questionsWithAnswers, error: answersError } = await supabase
      .from('answers')
      .select(`
        id,
        answer,
        created_at,
        questions:question_id (
          question,
          category
        )
      `)
      .eq('story_id', projectId)
      .eq('user_id', userId)
      .not('answer', 'is', null)
      .order('created_at', { ascending: true });

    if (answersError) {
      console.error('Error fetching answers:', answersError);
      return null;
    }

    // Transform the data
    const answers = questionsWithAnswers?.map(item => ({
      id: item.id,
      question: Array.isArray(item.questions)
        ? (item.questions[0]?.question || '')
        : ((item.questions as QuestionData)?.question || ''),
      answer: item.answer,
      category: Array.isArray(item.questions)
        ? (item.questions[0]?.category || 'general')
        : ((item.questions as QuestionData)?.category || 'general'),
      created_at: item.created_at
    })) || [];

    return {
      project,
      answers
    };
  } catch (error) {
    console.error('Error in fetchStoryData:', error);
    return null;
  }
}

function createBiographyPrompt(storyData: StoryData, chapterCategory: string): string {
  const { project, answers } = storyData;
  
  // Filter answers by category for focused chapter generation
  const categoryAnswers = answers.filter(answer => answer.category === chapterCategory);
  
  // Fallback to all answers if no category-specific answers
  const relevantAnswers = categoryAnswers.length > 0 ? categoryAnswers : answers.slice(0, 10);
  
  const personName = project.subject_type === 'self' ? 'de persoon' : project.person_name || 'de persoon';
  
  const writingStyleInstructions = {
    'isaacson': 'Schrijf in de stijl van Walter Isaacson: analytisch, gedetailleerd en biografisch, met aandacht voor context en achtergronden.',
    'gul': 'Schrijf in de stijl van Lale Gül: persoonlijk, direct en emotioneel, met warmte en toegankelijkheid.',
    'tellegen': 'Schrijf in de stijl van Toon Tellegen: poëtisch, filosofisch en beeldend, met aandacht voor de schoonheid van kleine momenten.',
    'adaptive': 'Schrijf in een warme, persoonlijke stijl die past bij de verhalen en emoties van de persoon.'
  };

  const styleInstruction = writingStyleInstructions[project.writing_style as keyof typeof writingStyleInstructions] 
    || writingStyleInstructions.adaptive;

  const questionsAndAnswers = relevantAnswers.map(item => 
    `Vraag: ${item.question}\nAntwoord: ${item.answer}`
  ).join('\n\n');

  return `Je bent een ervaren biografieschrijver die een hoofdstuk schrijft voor het levensverhaal van ${personName}. 

INSTRUCTIES:
- ${styleInstruction}
- Schrijf in het Nederlands
- Maak een samenhangend verhaal van de onderstaande informatie
- Gebruik een warme, respectvolle toon
- Focus op ${chapterCategory === 'general' ? 'de levenservaringen' : chapterCategory}
- Maak het verhaal levendig met details en emoties
- Vermijd opsommingen, maak er een vloeiend verhaal van
- Zorg dat het hoofdstuk tussen 800-1200 woorden is

PERIODE/THEMA: ${project.period_type}

INFORMATIE VOOR HET HOOFDSTUK:
${questionsAndAnswers}

Schrijf nu een biografisch hoofdstuk dat deze informatie omzet in een mooi, samenhangend verhaal. Begin direct met het verhaal, zonder inleiding over wat je gaat doen.`;
}

async function callMistralAPI(prompt: string): Promise<string> {
  const apiKey = process.env.TOGETHER_AI_API_KEY;
  
  // Debug logging
  console.log('=== TOGETHER AI DEBUG ===');
  console.log('API Key from env:', apiKey ? `${apiKey.substring(0, 15)}...` : 'NOT SET');
  console.log('API Key length:', apiKey?.length || 0);
  console.log('API Key starts with tgp_v1_:', apiKey?.startsWith('tgp_v1_') || false);
  console.log('Full API key (first 20 chars):', apiKey?.substring(0, 20) || 'NOT SET');
  
  if (!apiKey) {
    throw new Error('TOGETHER_AI_API_KEY environment variable is not set');
  }

  try {
    // Explicitly define the request body instead of using spread operator
    const requestBody = {
      model: "mistralai/Mixtral-8x7B-Instruct-v0.1", // Use the same model that worked in curl
      messages: createMessagesWithSystemPrompt(prompt),
      max_tokens: 2000,
      temperature: 0.7,
      top_p: 0.7,
      top_k: 50,
      repetition_penalty: 1,
      stop: ["<|eot_id|>"]
    };
    
    console.log('Request model:', requestBody.model);
    console.log('Request URL:', 'https://api.together.xyz/v1/chat/completions');
    console.log('Authorization header:', `Bearer ${apiKey.substring(0, 15)}...`);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.log('=== TOGETHER AI ERROR RESPONSE ===');
      console.log('Full error response:', errorData);
      
      if (response.status === 401) {
        throw new Error('Together AI API authentication failed. The API key may be invalid, expired, or the service may have changed authentication requirements.');
      }
      
      throw new Error(`Together.ai API error: ${response.status} ${response.statusText}: ${errorData}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response format:', data);
      throw new Error('Invalid response format from Together AI API');
    }

    console.log('✅ SUCCESS: Together AI API call completed');
    return data.choices[0].message.content;

  } catch (error) {
    console.error('Error calling Together AI API:', error);
    throw error;
  }
}

async function saveChapterToSupabase(
  projectId: string, 
  userId: string,
  chapterContent: string, 
  category: string,
  chapterNumber: number
): Promise<GeneratedChapter | null> {
  try {
    // Set user context for RLS
    await setUserContext(userId);

    // Generate chapter title based on category
    const categoryTitles: Record<string, string> = {
      'childhood': 'De Vroege Jaren',
      'education': 'Leren en Groeien',
      'career': 'Werkzaam Leven',
      'family': 'Familie en Relaties',
      'relationships': 'Liefde en Vriendschap',
      'hobbies': 'Passies en Interesses',
      'travel': 'Reizen en Avonturen',
      'challenges': 'Uitdagingen en Groei',
      'achievements': 'Prestaties en Mijlpalen',
      'general': 'Levensverhaal'
    };

    const chapterTitle = categoryTitles[category] || `Hoofdstuk ${chapterNumber}`;

    // First, ensure the chapters table exists
    await createChaptersTableIfNeeded();

    // Save the generated chapter
    const { data: chapter, error } = await supabase
      .from('chapters')
      .insert({
        project_id: projectId,
        user_id: userId,
        chapter_title: chapterTitle,
        chapter_content: chapterContent,
        chapter_number: chapterNumber,
        category: category,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving chapter:', error);
      return null;
    }

    return chapter;
  } catch (error) {
    console.error('Error in saveChapterToSupabase:', error);
    return null;
  }
}

async function createChaptersTableIfNeeded() {
  try {
    // Try to create the chapters table if it doesn't exist
    const { error } = await supabase.rpc('create_chapters_table_if_not_exists');
    
    if (error && !error.message.includes('already exists')) {
      console.error('Error creating chapters table:', error);
    }
  } catch (error) {
    console.error('Error in createChaptersTableIfNeeded:', error);
  }
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  if (!process.env.TOGETHER_AI_API_KEY) {
    console.error('TOGETHER_AI_API_KEY not found in environment variables');
    return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { projectId, userId, category = 'general', chapterNumber = 1 } = body;

    if (!projectId || !userId) {
      return NextResponse.json({ 
        error: 'Project ID and User ID are required' 
      }, { status: 400 });
    }

    console.log(`Generating chapter for project ${projectId}, category: ${category}`);

    // Step 1: Fetch story data from Supabase
    const storyData = await fetchStoryData(projectId, userId);
    
    if (!storyData || storyData.answers.length === 0) {
      return NextResponse.json({ 
        error: 'No story data found for this project or no answered questions available' 
      }, { status: 404 });
    }

    console.log(`Found ${storyData.answers.length} answers for story generation`);

    // Step 2: Create the prompt
    const prompt = createBiographyPrompt(storyData, category);

    // Step 3: Call Together AI API
    console.log('Calling Together AI API...');
    const generatedContent = await callMistralAPI(prompt);

    if (!generatedContent) {
      return NextResponse.json({ 
        error: 'Failed to generate chapter content' 
      }, { status: 500 });
    }

    console.log(`Generated chapter content (${generatedContent.length} characters)`);

    // Step 4: Save to Supabase
    const savedChapter = await saveChapterToSupabase(
      projectId, 
      userId,
      generatedContent, 
      category, 
      chapterNumber
    );

    if (!savedChapter) {
      return NextResponse.json({ 
        error: 'Failed to save generated chapter' 
      }, { status: 500 });
    }

    console.log('Chapter saved successfully:', savedChapter.id);

    // Return success with the generated chapter
    return NextResponse.json({
      success: true,
      chapter: {
        id: savedChapter.id,
        title: savedChapter.chapter_title,
        content: savedChapter.chapter_content,
        category: savedChapter.category,
        chapterNumber: savedChapter.chapter_number,
        createdAt: savedChapter.created_at
      },
      message: 'Chapter generated and saved successfully'
    });

  } catch (error) {
    console.error('Error in generate-chapter API:', error);
    
    // Handle specific Together AI API errors
    if (error instanceof Error) {
      if (error.message.includes('authentication failed') || error.message.includes('401')) {
        return NextResponse.json({ 
          error: 'AI service authentication failed', 
          details: 'API key may be invalid or expired. Please check your Together AI configuration.' 
        }, { status: 401 });
      }
      
      if (error.message.includes('403')) {
        return NextResponse.json({ 
          error: 'AI service access forbidden', 
          details: 'API key may not have required permissions' 
        }, { status: 403 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to generate chapter', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// GET endpoint to retrieve existing chapters
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const userId = searchParams.get('userId');

  if (!projectId || !userId) {
    return NextResponse.json({ 
      error: 'Project ID and User ID are required' 
    }, { status: 400 });
  }

  try {
    // Set user context for RLS
    await setUserContext(userId);

    // Fetch all chapters for this project
    const { data: chapters, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .order('chapter_number', { ascending: true });

    if (error) {
      console.error('Error fetching chapters:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch chapters' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      chapters: chapters || []
    });

  } catch (error) {
    console.error('Error in GET generate-chapter API:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch chapters', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
