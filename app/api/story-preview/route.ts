import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

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

export async function PUT(request: NextRequest) {
  try {
    const { projectId, userId, content, status } = await request.json();

    if (!projectId || !userId || !content) {
      return NextResponse.json(
        { error: "Project ID, User ID en content zijn vereist" },
        { status: 400 }
      );
    }

    // Set user context for RLS
    await setUserContext(userId);

    // Validate status
    const validStatuses = ['draft', 'edited', 'finalized'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Ongeldige status" },
        { status: 400 }
      );
    }

    // Update the story preview
    const { error: updateError } = await supabase
      .from('story_previews')
      .update({
        content,
        status: status || 'edited',
        updated_at: new Date().toISOString(),
        word_count: content.split(' ').length
      })
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating story preview:', updateError);
      return NextResponse.json(
        { error: "Fout bij opslaan van wijzigingen" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verhaal succesvol opgeslagen",
      wordCount: content.split(' ').length,
      status: status || 'edited'
    });

  } catch (error) {
    console.error('Error saving story preview:', error);
    return NextResponse.json(
      { error: "Er ging iets mis bij het opslaan. Probeer het opnieuw." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    const userId = url.searchParams.get('userId');

    if (!projectId || !userId) {
      return NextResponse.json(
        { error: "Project ID en User ID zijn vereist" },
        { status: 400 }
      );
    }

    // Set user context for RLS
    await setUserContext(userId);

    // Get the story preview
    const { data: storyPreview, error } = await supabase
      .from('story_previews')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching story preview:', error);
      return NextResponse.json(
        { error: "Fout bij ophalen van verhaal" },
        { status: 500 }
      );
    }

    if (!storyPreview) {
      return NextResponse.json({
        exists: false,
        message: "Nog geen verhaalvoorbeeld gegenereerd"
      });
    }

    return NextResponse.json({
      exists: true,
      storyPreview: {
        content: storyPreview.content,
        status: storyPreview.status,
        wordCount: storyPreview.word_count,
        generatedAt: storyPreview.generated_at,
        updatedAt: storyPreview.updated_at
      }
    });

  } catch (error) {
    console.error('Error fetching story preview:', error);
    return NextResponse.json(
      { error: "Er ging iets mis bij het ophalen van het verhaal. Probeer het opnieuw." },
      { status: 500 }
    );
  }
}
