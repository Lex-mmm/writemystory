import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import WHATSAPP_CONFIG from '../../../lib/whatsappConfig';

export async function POST(request: NextRequest) {
  // Check if WhatsApp is enabled
  if (!WHATSAPP_CONFIG.isAvailable()) {
    const reason = WHATSAPP_CONFIG.getDisabledReason();
    console.log('WhatsApp upload blocked:', reason);
    return NextResponse.json({ 
      error: 'WhatsApp functionality is currently unavailable',
      reason: reason,
      message: 'WhatsApp chat upload is disabled. Please use other input methods such as email forwarding or manual story input instead.'
    }, { status: 503 });
  }

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
      return NextResponse.json(
        { error: 'Missing required fields: whatsappChatFile, projectId, userId' },
        { status: 400 }
      );
    }

    console.log('Processing WhatsApp chat upload:', {
      fileName: whatsappChatFile.name,
      fileSize: whatsappChatFile.size,
      projectId,
      userId
    });

    // Read the file content
    const chatContent = await whatsappChatFile.text();
    
    if (!chatContent.trim()) {
      return NextResponse.json(
        { error: 'The uploaded file appears to be empty' },
        { status: 400 }
      );
    }

    // Parse the WhatsApp chat
    const parsedChat = parseWhatsAppChat(chatContent);
    
    if (parsedChat.messages.length === 0) {
      return NextResponse.json(
        { error: 'No valid WhatsApp messages found in the file. Please check the format.' },
        { status: 400 }
      );
    }

    console.log('Parsed WhatsApp chat:', {
      messageCount: parsedChat.totalMessages,
      senders: parsedChat.senders,
      dateRange: parsedChat.dateRange
    });

    // Set user context for RLS
    await setUserContext(userId);

    // Store the chat data in the database
    const { data, error } = await supabase
      .from('whatsapp_chats')
      .insert({
        project_id: projectId,
        user_id: userId,
        file_name: whatsappChatFile.name,
        message_count: parsedChat.totalMessages,
        senders: parsedChat.senders,
        date_range_start: parsedChat.dateRange?.start,
        date_range_end: parsedChat.dateRange?.end,
        raw_content: chatContent,
        parsed_messages: parsedChat.messages,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing WhatsApp chat:', error);
      return NextResponse.json(
        { error: 'Failed to store chat data' },
        { status: 500 }
      );
    }

    console.log('WhatsApp chat stored successfully:', data.id);

    return NextResponse.json({
      success: true,
      messageCount: parsedChat.totalMessages,
      senders: parsedChat.senders,
      chatId: data.id,
      dateRange: parsedChat.dateRange
    });

  } catch (error) {
    console.error('Error processing WhatsApp upload:', error);
    return NextResponse.json(
      { error: 'Failed to process WhatsApp chat file' },
      { status: 500 }
    );
  }
}

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
            // This is a simplified date parsing - you might want to use a library like date-fns
            const dateStr = timestamp.split(',')[0]; // Get date part
            parsedDate = new Date(dateStr);
            if (isNaN(parsedDate.getTime())) {
              parsedDate = null;
            }
          } catch {
            console.warn('Could not parse date:', timestamp);
            parsedDate = null;
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
      
      if (!matched && line.trim()) {
        console.log('Unmatched line:', line);
      }
    }
    
    return {
      messages,
      totalMessages: messages.length,
      senders: [...new Set(messages.map(m => m.sender))],
      dateRange: messages.length > 0 ? {
        start: messages[0]?.date,
        end: messages[messages.length - 1]?.date
      } : null
    };
  } catch (error) {
    console.error('Error parsing WhatsApp chat:', error);
    throw new Error('Failed to parse WhatsApp chat format');
  }
}

// Helper function to set user context in Supabase
async function setUserContext(userId: string) {
  try {
    const { error } = await supabase.rpc('set_claim', {
      uid: userId,
      claim: 'role',
      value: 'authenticated'
    });
    
    if (error) {
      console.warn('Could not set user context:', error);
    }
  } catch (error) {
    console.error('Error setting user context:', error);
  }
}
