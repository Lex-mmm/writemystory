import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { createMessagesWithSystemPrompt } from "../../../lib/aiPrompts";

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

export async function POST(request: NextRequest) {
  try {
    const { projectId, userId } = await request.json();

    if (!projectId || !userId) {
      return NextResponse.json(
        { error: "Project ID en User ID zijn vereist" },
        { status: 400 }
      );
    }

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
        { error: "Project niet gevonden" },
        { status: 404 }
      );
    }

    // Get all answered questions for this project
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
      return NextResponse.json(
        { error: "Fout bij ophalen vragen" },
        { status: 500 }
      );
    }

    // Filter to only questions that have answers
    const answeredQuestions = questionsData?.filter(question => {
      const answer = question.answers?.[0];
      return answer && answer.answer && answer.answer.trim().length > 0;
    }).map(question => {
      const answer = question.answers[0];
      return {
        id: question.id,
        question: question.question,
        answer: answer.answer,
        category: question.category,
        created_at: answer.created_at
      };
    }) || [];

    // Get introduction if available
    const { data: introduction } = await supabase
      .from('introductions')
      .select('content')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();

    if (!answeredQuestions || answeredQuestions.length === 0) {
      return NextResponse.json(
        { error: "Geen beantwoorde vragen gevonden. Beantwoord eerst enkele vragen voordat je een verhaalvoorbeeld kunt genereren." },
        { status: 400 }
      );
    }

    // Build context for story generation
    const personName = project.person_name || "de persoon";
    const subjectType = project.subject_type === "self" ? "autobiography" : "biography";
    const isDeceased = project.is_deceased || false;
    const yearOfPassing = project.passed_away_year;
    const writingStyle = project.writing_style || "neutrale";

    // Categorize questions by type
    const categorizedAnswers: Record<string, Array<{question: string, answer: string}>> = {};
    answeredQuestions.forEach(q => {
      if (!categorizedAnswers[q.category]) {
        categorizedAnswers[q.category] = [];
      }
      categorizedAnswers[q.category].push({
        question: q.question,
        answer: q.answer || ""
      });
    });

    // Create comprehensive prompt for story generation
    const storyPrompt = `
Je bent een professionele biografie-schrijver die gevraagd is om een volledige ${subjectType} te schrijven over ${personName}${isDeceased ? ` (overleden in ${yearOfPassing})` : ""}.

SCHRIJFSTIJL: ${getWritingStyleDescription(writingStyle)}

${introduction?.content ? `
INTRODUCTIE VAN DE PERSOON:
${introduction.content}
` : ""}

BEANTWOORDE VRAGEN EN ANTWOORDEN:
${Object.entries(categorizedAnswers).map(([category, answers]) => `
=== ${category.toUpperCase()} ===
${answers.map(qa => `Q: ${qa.question}\nA: ${qa.answer}`).join('\n\n')}
`).join('\n')}

INSTRUCTIES:
1. Schrijf een volledige, coherente biografie die alle beschikbare informatie verwerkt
2. Organiseer het verhaal chronologisch waar mogelijk
3. Gebruik een natuurlijke, vloeiende schrijfstijl die past bij de gekozen stijl
4. Integreer alle antwoorden op een natuurlijke manier in het verhaal
5. Zorg dat het verhaal persoonlijk en authentiek aanvoelt
6. Voeg geen informatie toe die niet gebaseerd is op de verstrekte antwoorden
7. Begin met een inleiding en eindig met een passende afsluiting
8. Verdeel het verhaal in logische hoofdstukken of secties
9. Zorg dat het verhaal tussen de 2000-4000 woorden lang is
10. ${isDeceased ? "Behandel het verhaal met respect en waardigheid, passend voor een memoriaal" : "Maak het verhaal levendig en inspirerend"}

Schrijf nu het volledige verhaal:
`;

    // Call Together.ai API
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TOGETHER_AI_API_KEY}`, // Fixed: changed from TOGETHER_API_KEY to TOGETHER_AI_API_KEY
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
        messages: createMessagesWithSystemPrompt(storyPrompt),
        max_tokens: 6000,
        temperature: 0.7,
        top_p: 0.9,
        repetition_penalty: 1.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      if (response.status === 401) {
        throw new Error(
          `Together AI API error: 401 (Unauthorized). Your API key may be invalid, expired, or your account may have billing issues. Details: ${errorData}`
        );
      }
      throw new Error(`Together AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const storyPreview = aiResponse.choices[0]?.message?.content;

    if (!storyPreview) {
      throw new Error('Geen verhaal ontvangen van AI');
    }

    // Save the generated preview to database
    const { error: saveError } = await supabase
      .from('story_previews')
      .upsert({
        project_id: projectId,
        user_id: userId,
        content: storyPreview,
        status: 'draft',
        generated_at: new Date().toISOString(),
        word_count: storyPreview.split(' ').length
      });

    if (saveError) {
      console.error('Error saving story preview:', saveError);
      // Continue anyway, we'll return the preview even if saving fails
    }

    return NextResponse.json({
      success: true,
      storyPreview,
      wordCount: storyPreview.split(' ').length,
      questionsUsed: answeredQuestions.length,
      categoriesUsed: Object.keys(categorizedAnswers)
    });

  } catch (error) {
    console.error('Error generating story preview:', error);
    return NextResponse.json(
      { error: "Er ging iets mis bij het genereren van het verhaal. Probeer het opnieuw." },
      { status: 500 }
    );
  }
}

function getWritingStyleDescription(style: string): string {
  const styles: Record<string, string> = {
    'neutrale': 'Neutrale, toegankelijke stijl die objectief en helder is zonder te veel persoonlijke interpretatie',
    'isaacson': 'Biografische stijl zoals Walter Isaacson - diepgaand, analytisch, met focus op karakter en motivatie',
    'knausgaard': 'Intieme, gedetailleerde stijl zoals Karl Ove Knausgård - zeer persoonlijk en eerlijk',
    'chatty': 'Conversationele, vriendelijke toon alsof je praat met een goede vriend',
    'literary': 'Literaire stijl met mooie beeldspraak en doorwrochte zinnen'
  };
  
  return styles[style] || styles['neutrale'];
}
