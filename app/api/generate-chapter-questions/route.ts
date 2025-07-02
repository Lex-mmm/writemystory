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

const CHAPTER_DEFINITIONS = {
  early_childhood: {
    name: 'Vroege Jeugd',
    icon: '🍼',
    description: 'De eerste levensjaren, familie en vroege herinneringen',
    categories: ['early_life', 'family', 'childhood', 'birth', 'parents'],
    prompt: 'Genereer vragen over de vroege jeugd, familie achtergrond, eerste herinneringen, ouders en grootouders.'
  },
  school_years: {
    name: 'Schooltijd',
    icon: '🎓',
    description: 'School, vrienden, eerste lessen van het leven',
    categories: ['school', 'education', 'friends', 'learning', 'adolescence'],
    prompt: 'Genereer vragen over schoolperiode, vriendschappen, leerprestaties, hobby\'s en persoonlijkheidsontwikkeling.'
  },
  young_adult: {
    name: 'Jong Volwassen',
    icon: '🌟',
    description: 'Eerste baan, onafhankelijkheid, relaties',
    categories: ['career', 'relationships', 'independence', 'first_job', 'love'],
    prompt: 'Genereer vragen over eerste baan, romantische relaties, onafhankelijkheid en belangrijke levensbeslissingen.'
  },
  adult_life: {
    name: 'Volwassen Leven',
    icon: '💼',
    description: 'Werk, huwelijk, prestaties, hobby\'s en reizen',
    categories: ['work', 'marriage', 'achievements', 'hobbies', 'travel', 'family_life'],
    prompt: 'Genereer vragen over carrière, huwelijk/partnerschap, kinderen, prestaties, hobby\'s en bijzondere ervaringen.'
  },
  later_life: {
    name: 'Later Leven',
    icon: '🌅',
    description: 'Pensioen, wijsheid, nalatenschap en reflectie',
    categories: ['retirement', 'wisdom', 'legacy', 'challenges', 'grandchildren'],
    prompt: 'Genereer vragen over pensioen, verworven wijsheid, nalatenschap, familie relaties en levensreflectie.'
  },
  memorial: {
    name: 'Herinneringen',
    icon: '🕊️',
    description: 'Speciale herinneringen en het nalatenschap',
    categories: ['memorial', 'memories', 'legacy', 'tribute'],
    prompt: 'Genereer vragen over mooie herinneringen, karakter eigenschappen, nalatenschap en wat deze persoon betekende voor anderen.'
  },
};

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    console.error('Supabase not configured properly');
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  try {
    const { projectId, userId, chapterId } = await request.json();

    if (!projectId || !userId || !chapterId) {
      return NextResponse.json(
        { error: 'Project ID, User ID en Chapter ID zijn vereist' },
        { status: 400 }
      );
    }

    // Validate chapter ID
    if (!CHAPTER_DEFINITIONS[chapterId as keyof typeof CHAPTER_DEFINITIONS]) {
      return NextResponse.json(
        { error: 'Ongeldig hoofdstuk ID' },
        { status: 400 }
      );
    }

    const chapter = CHAPTER_DEFINITIONS[chapterId as keyof typeof CHAPTER_DEFINITIONS];

    // Set user context for RLS
    await setUserContext(userId);

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project niet gevonden' },
        { status: 404 }
      );
    }

    // Get existing questions for this chapter
    const { data: existingQuestions } = await supabase
      .from('questions')
      .select('*')
      .eq('story_id', projectId)
      .in('category', chapter.categories);

    // Check if we already have enough questions for this chapter
    if (existingQuestions && existingQuestions.length >= 8) {
      return NextResponse.json(
        { error: `Er zijn al ${existingQuestions.length} vragen voor dit hoofdstuk. Beantwoord eerst enkele bestaande vragen.` },
        { status: 400 }
      );
    }

    // Get introduction for context
    const { data: introData } = await supabase
      .from('introductions')
      .select('introduction')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();

    // Build prompt for AI
    const personName = project.person_name || "deze persoon";
    const isDeceased = project.is_deceased || false;
    const subjectType = project.subject_type;
    const introduction = introData?.introduction || '';

    const prompt = `
Genereer 5-7 biografische vragen voor het hoofdstuk "${chapter.name}" van een levensverhaal.

Context:
- ${subjectType === 'self' ? 'Dit is een autobiografie' : `Dit is een biografie over ${personName}`}
- ${isDeceased ? `${personName} is overleden` : `${personName} leeft nog`}
- Focus: ${chapter.description}
- ${introduction ? `Introductie: ${introduction}` : 'Geen introductie beschikbaar'}

Richtlijnen:
${chapter.prompt}

${isDeceased ? 'Pas de vragen aan voor een overleden persoon (gebruik verleden tijd, focus op herinneringen).' : ''}

Vragen moeten:
1. Specifiek zijn voor dit hoofdstuk/levensfase
2. Persoonlijk en emotioneel relevant zijn
3. Concrete verhalen en details uitlokken
4. Variëren tussen feitelijke en emotionele aspecten
5. ${isDeceased ? 'Respectvol en passend zijn voor een memorial' : 'Inspirerend en reflectief zijn'}

Format elke vraag als:
[nummer]. [hoofdstuk categorie] - [vraag]

Bijvoorbeeld:
1. childhood - Wat is je vroegste herinnering aan je ouderlijk huis?
2. family - Hoe zou je de relatie met je ouders beschrijven?

Genereer nu de vragen:
`;

    // Call Together.ai API
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TOGETHER_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
        messages: createMessagesWithSystemPrompt(prompt),
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('Together AI API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'AI service niet beschikbaar' },
        { status: 503 }
      );
    }

    const aiResponse = await response.json();
    const questionsText = aiResponse.choices[0]?.message?.content;

    if (!questionsText) {
      return NextResponse.json(
        { error: 'Geen vragen gegenereerd door AI' },
        { status: 500 }
      );
    }

    // Parse and save questions
    const questions = await parseAndSaveChapterQuestions(questionsText, projectId, chapter.categories[0]);

    return NextResponse.json({
      success: true,
      questionsGenerated: questions.length,
      chapter: chapter.name,
      questions: questions,
    });

  } catch (error) {
    console.error('Error generating chapter questions:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het genereren van vragen' },
      { status: 500 }
    );
  }
}

async function parseAndSaveChapterQuestions(questionsText: string, projectId: string, defaultCategory: string) {
  const lines = questionsText.split('\n').filter(line => line.trim());
  const questions = [];

  for (const line of lines) {
    // Match patterns like "1. category - question" or "1) category - question"
    const match = line.match(/^\s*\d+[.)]?\s*([^-]+)\s*[-–—]\s*(.+)$/);
    
    if (match) {
      const [, category, questionText] = match;
      const cleanCategory = category.trim().toLowerCase();
      const cleanQuestion = questionText.trim();
      
      try {
        const { data: question, error } = await supabase
          .from('questions')
          .insert({
            story_id: projectId,
            category: cleanCategory || defaultCategory,
            question: cleanQuestion,
            type: 'open',
            priority: 1,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (!error && question) {
          questions.push(question);
        }
      } catch (error) {
        console.error('Error saving chapter question:', error);
      }
    }
  }

  return questions;
}
