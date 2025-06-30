import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_ACCESS_TOKEN) {
    return NextResponse.json({ error: 'Admin service not available during build' }, { status: 503 });
  }

  const ADMIN_TOKEN = process.env.ADMIN_ACCESS_TOKEN;
  
  const authHeader = request.headers.get('authorization');
  const token = request.headers.get('x-admin-token');
  const providedToken = authHeader?.replace('Bearer ', '') || token;
  
  const debugInfo = {
    environmentTokenExists: !!ADMIN_TOKEN,
    environmentTokenLength: ADMIN_TOKEN?.length || 0,
    environmentTokenPreview: ADMIN_TOKEN ? `${ADMIN_TOKEN.substring(0, 3)}...${ADMIN_TOKEN.substring(ADMIN_TOKEN.length - 3)}` : 'NOT SET',
    providedTokenExists: !!providedToken,
    providedTokenLength: providedToken?.length || 0,
    providedTokenPreview: providedToken ? `${providedToken.substring(0, 3)}...${providedToken.substring(providedToken.length - 3)}` : 'NOT PROVIDED',
    tokensMatch: providedToken === ADMIN_TOKEN,
    headers: {
      authorization: authHeader ? 'PROVIDED' : 'NOT PROVIDED',
      'x-admin-token': token ? 'PROVIDED' : 'NOT PROVIDED'
    }
  };
  
  return NextResponse.json({
    message: 'Admin authentication test endpoint',
    debug: debugInfo,
    isAuthenticated: providedToken === ADMIN_TOKEN
  });
}
