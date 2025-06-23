import { NextResponse } from 'next/server';

// Simple UUID generator function instead of using the uuid package
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// In-memory store for testing purposes
const projectStore: Record<string, Record<string, unknown>> = {};

export async function POST(request: Request) {
  try {
    // Parse the JSON request body
    const data = await request.json();
    
    // Create a unique ID for the project
    const projectId = generateId();
    
    // Create the project object (removed layoutStyle)
    const project = {
      id: projectId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progress: 10, // Initial progress
      status: 'active'
    };
    
    // Store it in our in-memory database
    projectStore[projectId] = project;
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return NextResponse.json({ 
      id: projectId, 
      message: 'Project created successfully',
      story: project // Return the full project object (kept as "story" for backward compatibility)
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ 
      message: 'Failed to create project' 
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    // Get the URL parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('id');
    
    // If requesting a specific project
    if (projectId) {
      const project = projectStore[projectId];
      if (project) {
        return NextResponse.json(project);
      } else {
        // If not found in memory, return a mock project
        return NextResponse.json({
          id: projectId,
          userId: userId || 'unknown',
          personName: 'Mijn verhaal',
          subjectType: 'self',
          periodType: 'fullLife',
          writingStyle: 'isaacson',
          createdAt: new Date().toISOString(),
          status: 'active',
          progress: 10
        });
      }
    }
    
    // If requesting all projects for a user
    if (!userId) {
      return NextResponse.json({ 
        message: 'User ID is required' 
      }, { status: 400 });
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get all projects for this user from our in-memory store
    const userProjects = Object.values(projectStore)
      .filter((project: Record<string, unknown>) => project.userId === userId)
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const dateA = new Date(a.createdAt as string).getTime();
        const dateB = new Date(b.createdAt as string).getTime();
        return dateB - dateA;
      });
    
    // If we have projects for this user, return them
    if (userProjects.length > 0) {
      return NextResponse.json(userProjects);
    }
    
    // Otherwise return a mock project
    return NextResponse.json([
      {
        id: generateId(),
        userId,
        personName: 'Mijn verhaal',
        subjectType: 'self',
        periodType: 'fullLife',
        writingStyle: 'isaacson',
        createdAt: new Date().toISOString(),
        status: 'active',
        progress: 10
      }
    ]);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ 
      message: 'Failed to fetch projects' 
    }, { status: 500 });
  }
}
