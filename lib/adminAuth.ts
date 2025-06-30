import { NextRequest } from 'next/server';

/**
 * Validates the admin authorization token from the request headers
 * @param request - The incoming NextRequest
 * @returns Object with validation result and optional error message
 */
export function validateAdminToken(request: NextRequest): { 
  isValid: boolean; 
  error?: string; 
} {
  const adminSecret = process.env.ADMIN_SECRET;
  
  if (!adminSecret) {
    console.error('ADMIN_SECRET environment variable is not set');
    return { 
      isValid: false, 
      error: 'Admin authentication not configured' 
    };
  }

  // Check both authorization header and x-admin-token header
  const authHeader = request.headers.get('authorization');
  const adminTokenHeader = request.headers.get('x-admin-token');
  
  let token = '';
  
  if (authHeader) {
    // Support both "Bearer token" and "token" formats
    token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;
  } else if (adminTokenHeader) {
    token = adminTokenHeader;
  } else {
    return { 
      isValid: false, 
      error: 'Authorization header or x-admin-token header is required' 
    };
  }

  if (token !== adminSecret) {
    console.warn('Invalid admin token attempted. Expected:', adminSecret?.substring(0, 3) + '...', 'Got:', token?.substring(0, 3) + '...');
    return { 
      isValid: false, 
      error: 'Invalid admin token' 
    };
  }

  return { isValid: true };
}

/**
 * Admin response helper for consistent error formatting
 */
export function createAdminErrorResponse(message: string, status: number = 401) {
  return Response.json(
    { 
      error: message, 
      timestamp: new Date().toISOString() 
    }, 
    { status }
  );
}

/**
 * Admin response helper for successful responses
 */
export function createAdminSuccessResponse(data: unknown) {
  return Response.json({
    success: true,
    data,
    timestamp: new Date().toISOString()
  });
}
