import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  console.log('Test DELETE endpoint called');
  console.log('Request URL:', request.url);
  console.log('Request method:', request.method);
  
  return NextResponse.json({
    success: true,
    message: 'Test DELETE endpoint is working',
    timestamp: new Date().toISOString()
  });
}

export async function GET() {
  return NextResponse.json({
    message: 'Test endpoint is working'
  });
}
