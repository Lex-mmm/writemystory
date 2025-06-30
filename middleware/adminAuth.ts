import { NextRequest, NextResponse } from 'next/server';

// Simple admin authentication middleware
// In production, you'd want more sophisticated authentication
const ADMIN_TOKEN = process.env.ADMIN_ACCESS_TOKEN;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

// Debug logging (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('Admin token loaded:', ADMIN_TOKEN ? `${ADMIN_TOKEN.substring(0, 3)}...` : 'NOT SET');
  console.log('Admin email loaded:', ADMIN_EMAIL || 'NOT SET');
}

if (!ADMIN_TOKEN) {
  console.warn('ADMIN_ACCESS_TOKEN not set - admin routes will be disabled');
}

export interface AdminAuthRequest extends NextRequest {
  adminUser?: {
    email: string;
    isAdmin: boolean;
  };
}

export function createAdminAuthMiddleware() {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    // Check if admin token is configured
    if (!ADMIN_TOKEN) {
      return NextResponse.json(
        { error: 'Admin functionality not configured' },
        { status: 503 }
      );
    }

    const authHeader = request.headers.get('authorization');
    const token = request.headers.get('x-admin-token');
    
    // Check for token in Authorization header or X-Admin-Token header
    const providedToken = authHeader?.replace('Bearer ', '') || token;
    
    if (!providedToken) {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    if (providedToken !== ADMIN_TOKEN) {
      return NextResponse.json(
        { error: 'Invalid admin token' },
        { status: 403 }
      );
    }

    // Token is valid, allow the request to proceed
    return null;
  };
}

export const adminAuthMiddleware = createAdminAuthMiddleware();

// Helper function to validate admin access in API routes
export function validateAdminAccess(request: NextRequest): { error?: NextResponse; isValid: boolean } {
  console.log('=== Admin Access Validation ===');
  console.log('Environment ADMIN_TOKEN exists:', !!ADMIN_TOKEN);
  console.log('Environment ADMIN_TOKEN value:', ADMIN_TOKEN ? `${ADMIN_TOKEN.substring(0, 3)}...` : 'NOT SET');
  
  if (!ADMIN_TOKEN) {
    console.log('No admin token configured');
    return {
      error: NextResponse.json(
        { error: 'Admin functionality not configured' },
        { status: 503 }
      ),
      isValid: false
    };
  }

  const authHeader = request.headers.get('authorization');
  const token = request.headers.get('x-admin-token');
  const providedToken = authHeader?.replace('Bearer ', '') || token;
  
  console.log('Provided token:', providedToken ? `${providedToken.substring(0, 3)}...` : 'NOT PROVIDED');
  console.log('Token match:', providedToken === ADMIN_TOKEN);
  
  if (!providedToken || providedToken !== ADMIN_TOKEN) {
    console.log('Admin authentication failed');
    return {
      error: NextResponse.json(
        { 
          error: 'Admin authentication required',
          debug: process.env.NODE_ENV === 'development' ? {
            tokenProvided: !!providedToken,
            tokenMatches: providedToken === ADMIN_TOKEN,
            expectedLength: ADMIN_TOKEN?.length,
            providedLength: providedToken?.length
          } : undefined
        },
        { status: 401 }
      ),
      isValid: false
    };
  }

  console.log('Admin authentication successful');
  return { isValid: true };
}
