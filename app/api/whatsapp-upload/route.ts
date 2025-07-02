import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

// WhatsApp chat parsing function
function parseWhatsAppChat(chatContent: string) {
  try {
    const lines = chatContent.split('\n').filter(line => line.trim());
    const messages: Array<{
      timestamp: string;
      sender: string;
      message: string;
      date: Date | null;
    }> = [];
    
    // Common WhatsApp export patterns
    const patterns = [
      // Format: [DD/MM/YYYY, HH:MM:SS] Name: Message
      /^\[(\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2}:\d{2})\] ([^:]+): (.+)$/,
      // Format: DD/MM/YYYY, HH:MM - Name: Message  
      /^(\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2}) - ([^:]+): (.+)$/,
      // Format: DD-MM-YYYY HH:MM - Name: Message
      /^(\d{1,2}-\d{1,2}-\d{4} \d{1,2}:\d{2}) - ([^:]+): (.+)$/,
      // Format: MM/DD/YY, HH:MM AM/PM - Name: Message
      /^(\d{1,2}\/\d{1,2}\/\d{2}, \d{1,2}:\d{2} [AP]M) - ([^:]+): (.+)$/
    ];
    
    for (const line of lines) {
      let matched = false;
      
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          const [, timestamp, sender, message] = match;
          
          // Try to parse the date
          let parsedDate: Date | null = null;
          try {
            // Handle different date formats
            if (timestamp.includes('/') && timestamp.includes(',')) {
              // Format like "25/12/2023, 14:30:45" or "25/12/2023, 2:30 PM"
              parsedDate = new Date(timestamp.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/, '$3-$2-$1'));
            } else if (timestamp.includes('-')) {
              // Format like "25-12-2023 14:30"
              parsedDate = new Date(timestamp.replace(/(\d{1,2})-(\d{1,2})-(\d{4})/, '$3-$2-$1'));
            }
          } catch (e) {
            void e; // Suppress ESLint unused variable warning
            // If date parsing fails, continue without date
          }
          
          messages.push({
            timestamp,
            sender: sender.trim(),
            message: message.trim(),
            date: parsedDate
          });
          
          matched = true;
          break;
        }
      }
      
      // If no pattern matched, it might be a continuation of the previous message
      if (!matched && messages.length > 0 && line.trim()) {
        messages[messages.length - 1].message += '\n' + line.trim();
      }
    }
    
    // Extract participants (unique senders)
    const participants = [...new Set(messages.map(m => m.sender))];
    
    // Extract some basic statistics
    const messageCount = messages.length;
    const dateRange = {
      start: messages.length > 0 ? messages[0].date : null,
      end: messages.length > 0 ? messages[messages.length - 1].date : null
    };
    
    return {
      messages,
      participants,
      messageCount,
      dateRange,
      processingInfo: {
        totalLines: lines.length,
        successfullyParsed: messages.length,
        parsingDate: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error parsing WhatsApp chat:', error);
    return {
      messages: [],
      participants: [],
      messageCount: 0,
      dateRange: { start: null, end: null },
      error: error instanceof Error ? error.message : 'Unknown parsing error'
    };
  }
}

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
  if (!isSupabaseConfigured()) {
    console.error('Supabase not configured properly');
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  try {
    const formData = await request.formData();
    const whatsappChatFile = formData.get('whatsappChatFile') as File;
    const projectId = formData.get('projectId') as string;
    const userId = formData.get('userId') as string;

    if (!whatsappChatFile || !projectId || !userId) {
      return NextResponse.json({ 
        error: 'WhatsApp file, project ID, and user ID are required' 
      }, { status: 400 });
    }

    // Validate file type
    if (!whatsappChatFile.name.endsWith('.txt')) {
      return NextResponse.json({ 
        error: 'Only .txt files are supported' 
      }, { status: 400 });
    }

    // Set user context for RLS
    await setUserContext(userId);

    // Read and parse the file
    const fileContent = await whatsappChatFile.text();
    const chatData = parseWhatsAppChat(fileContent);

    if (chatData.error) {
      return NextResponse.json({ 
        error: `Failed to parse WhatsApp chat: ${chatData.error}` 
      }, { status: 400 });
    }

    // Update project with WhatsApp chat data
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        metadata: supabase.rpc('jsonb_set', {
          target: supabase.from('projects').select('metadata').eq('id', projectId).single(),
          path: ['whatsappChat'],
          new_value: JSON.stringify(chatData)
        }),
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating project with WhatsApp data:', updateError);
      
      // Fallback: try direct metadata update
      const { data: currentProject, error: fetchError } = await supabase
        .from('projects')
        .select('metadata')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        return NextResponse.json({ 
          error: 'Failed to fetch project' 
        }, { status: 500 });
      }

      const updatedMetadata = {
        ...currentProject.metadata,
        whatsappChat: chatData
      };

      const { error: secondUpdateError } = await supabase
        .from('projects')
        .update({
          metadata: updatedMetadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .eq('user_id', userId);

      if (secondUpdateError) {
        console.error('Error updating project metadata:', secondUpdateError);
        return NextResponse.json({ 
          error: 'Failed to save WhatsApp data to project' 
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      messageCount: chatData.messageCount,
      participants: chatData.participants,
      dateRange: chatData.dateRange,
      message: 'WhatsApp chat uploaded and processed successfully'
    });

  } catch (error) {
    console.error('Error in WhatsApp upload:', error);
    return NextResponse.json({ 
      error: 'Failed to process WhatsApp upload',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
