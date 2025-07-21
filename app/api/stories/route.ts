import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { getUserSubscription, checkProjectLimit } from '../../../lib/subscriptionCheck';

interface CreateProjectRequest {
  userId: string;
  email?: string;
  subjectType?: string;
  personName?: string;
  birthYear?: string;
  relationship?: string;
  isDeceased?: boolean;
  passedAwayYear?: string;
  collaborators?: string[];
  collaboratorEmails?: string[];
  periodType?: string;
  startYear?: string;
  endYear?: string;
  theme?: string;
  writingStyle?: string;
  communicationMethods?: string[];
  deliveryFormat?: string;
  includeWhatsappChat?: boolean;
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
            // Handle different date formats
            if (timestamp.includes('/') && timestamp.includes(',')) {
              // Format like "25/12/2023, 14:30:45" or "25/12/2023, 2:30 PM"
              parsedDate = new Date(timestamp.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/, '$3-$2-$1'));
            } else if (timestamp.includes('-')) {
              // Format like "25-12-2023 14:30"
              parsedDate = new Date(timestamp.replace(/(\d{1,2})-(\d{1,2})-(\d{4})/, '$3-$2-$1'));
            }
          } catch {
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

// Helper function to create tables if they don't exist
async function createTablesIfNeeded() {
  try {
    // Create the projects table directly with SQL
    const { error: createError } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS projects (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id TEXT NOT NULL,
          person_name TEXT,
          subject_type TEXT NOT NULL,
          period_type TEXT NOT NULL,
          writing_style TEXT NOT NULL,
          status TEXT DEFAULT 'active',
          progress INTEGER DEFAULT 15,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
      `
    });
    
    if (createError) {
      console.error('Error creating table with RPC:', createError);
      // Try alternative method - direct table creation
      await createTableDirectly();
    }
    
    return true;
  } catch (error) {
    console.error('Error in createTablesIfNeeded:', error);
    return false;
  }
}

async function createTableDirectly() {
  try {
    // Try to create table using direct SQL execution
    const { error } = await supabase
      .rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS projects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT NOT NULL,
            person_name TEXT,
            subject_type TEXT NOT NULL,
            period_type TEXT NOT NULL,
            writing_style TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            progress INTEGER DEFAULT 15,
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
        `
      });
      
    if (error) {
      console.error('Error creating table directly:', error);
    }
  } catch (error) {
    console.error('Error in createTableDirectly:', error);
  }
}

export async function GET(request: NextRequest) {
  // Check if Supabase is properly configured
  if (!isSupabaseConfigured()) {
    console.error('Supabase not configured properly');
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    console.log('Fetching stories for user:', userId);

    // Use service role client to fetch projects for this user
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Fetch projects using the service role client (bypasses RLS)
    const { data: projects, error } = await serviceClient
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching projects:', error);
      
      // If it's a table doesn't exist error, try to create it and return empty array
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.log('Projects table does not exist, attempting to create it...');
        
        // Try to create the table
        await createTablesIfNeeded();
        
        // Return empty array for now - user can try again
        return NextResponse.json([]);
      }
      
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    console.log('Found projects:', projects?.length || 0);

    // Transform database format to frontend format
    const transformedProjects = projects?.map(project => ({
      id: project.id,
      personName: project.person_name || "Mijn verhaal",
      subjectType: project.subject_type,
      periodType: project.period_type,
      writingStyle: project.writing_style,
      createdAt: project.created_at,
      status: project.status,
      progress: project.progress || 15
    })) || [];

    return NextResponse.json(transformedProjects);
  } catch (error) {
    console.error('Error in GET /api/stories:', error);
    
    // If it's a connection error, try to create tables
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('does not exist') || errorMessage.includes('42P01')) {
      await createTablesIfNeeded();
      return NextResponse.json([]);
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch projects', 
      details: errorMessage 
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
    const contentType = request.headers.get('content-type');
    let body: Partial<CreateProjectRequest> = {};
    let whatsappChatFile: File | null = null;

    // Handle both JSON and FormData requests
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      
      // Extract the file
      whatsappChatFile = formData.get('whatsappChatFile') as File || null;
      
      // Extract other data from FormData
      const bodyData: Record<string, unknown> = {};
      for (const [key, value] of formData.entries()) {
        if (key !== 'whatsappChatFile') {
          if (key === 'collaborators' || key === 'collaboratorEmails' || key === 'communicationMethods') {
            try {
              bodyData[key] = JSON.parse(value as string);
            } catch {
              bodyData[key] = value;
            }
          } else if (key === 'isDeceased' || key === 'includeWhatsappChat') {
            bodyData[key] = value === 'true';
          } else {
            bodyData[key] = value;
          }
        }
      }
      body = bodyData as Partial<CreateProjectRequest>;
    } else {
      body = await request.json();
    }

    const {
      userId,
      email,
      subjectType,
      personName,
      birthYear,
      relationship,
      isDeceased,
      passedAwayYear,
      collaborators,
      collaboratorEmails,
      periodType,
      startYear,
      endYear,
      theme,
      writingStyle,
      communicationMethods,
      deliveryFormat,
      includeWhatsappChat
    } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('Creating project for user:', userId);

    // Check user subscription and project limits
    const userSubscription = await getUserSubscription(userId);
    const projectLimit = await checkProjectLimit(userId, userSubscription.plan);

    if (!projectLimit.canCreate) {
      return NextResponse.json({
        error: `Project limit reached (${projectLimit.currentCount}/${projectLimit.limit}). Upgrade your plan to create more projects.`,
        upgradeRequired: true,
        currentPlan: userSubscription.plan,
        limit: projectLimit.limit,
        currentCount: projectLimit.currentCount
      }, { status: 403 });
    }

    // Use service role client to bypass RLS for project creation
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Process WhatsApp chat file if provided
    let whatsappChatContent = null;
    if (includeWhatsappChat && whatsappChatFile) {
      try {
        const fileContent = await whatsappChatFile.text();
        whatsappChatContent = parseWhatsAppChat(fileContent);
        console.log(`Processed WhatsApp chat with ${whatsappChatContent.messages.length} messages`);
      } catch (error) {
        console.error('Error processing WhatsApp file:', error);
        // Continue without the file - don't fail the project creation
      }
    }

    // Insert project into Supabase using service role client
    const { data: project, error: insertError } = await serviceClient
      .from('projects')
      .insert({
        user_id: userId,
        person_name: subjectType === "other" ? personName : null,
        subject_type: subjectType,
        period_type: periodType,
        writing_style: writingStyle,
        status: 'active',
        progress: 15,
        is_deceased: isDeceased || false,
        passed_away_year: passedAwayYear || null,
        // Store additional data as JSON
        metadata: {
          birthYear,
          relationship,
          collaborators,
          collaboratorEmails,
          startYear,
          endYear,
          theme,
          communicationMethods,
          deliveryFormat,
          email,
          includeWhatsappChat,
          whatsappChat: whatsappChatContent
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting project:', insertError);
      
      // If it's a table doesn't exist error, try to create it first
      if (insertError.code === '42P01' || insertError.message.includes('does not exist')) {
        console.log('Projects table does not exist, attempting to create it...');
        await createTablesIfNeeded();
        
        return NextResponse.json({ 
          error: 'Database was not initialized. Tables have been created. Please try creating your project again.',
          shouldRetry: true
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        error: 'Failed to create project', 
        details: insertError.message 
      }, { status: 500 });
    }

    console.log('Project created successfully:', project.id);

    // Transform the response to match frontend expectations
    const transformedProject = {
      id: project.id,
      personName: project.person_name || "Mijn verhaal",
      subjectType: project.subject_type,
      periodType: project.period_type,
      writingStyle: project.writing_style,
      createdAt: project.created_at,
      status: project.status,
      progress: project.progress,
      // Include original form data
      ...body
    };

    return NextResponse.json({
      success: true,
      id: project.id,
      message: 'Project created successfully',
      story: transformedProject
    });
  } catch (error) {
    console.error('Error in POST /api/stories:', error);
    return NextResponse.json({ 
      error: 'Failed to create project', 
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

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('id');
  const userId = searchParams.get('userId');

  if (!projectId || !userId) {
    return NextResponse.json({ error: 'Project ID and User ID are required' }, { status: 400 });
  }

  try {
    console.log('Deleting project:', projectId, 'for user:', userId);

    // Use service role client to delete the project
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Delete the project (CASCADE should handle related records)
    const { error: deleteError } = await serviceClient
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting project:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete project', 
        details: deleteError.message 
      }, { status: 500 });
    }

    console.log('Project deleted successfully:', projectId);

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/stories:', error);
    return NextResponse.json({ 
      error: 'Failed to delete project', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
