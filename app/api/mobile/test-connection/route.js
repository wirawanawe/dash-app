import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Simple health check endpoint
    return NextResponse.json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      status: 'healthy'
    });
  } catch (error) {
    console.error('Test connection error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Server error',
        timestamp: new Date().toISOString(),
        status: 'error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    console.log('🔍 Mobile connection test POST endpoint called');
    
    const body = await request.json();
    console.log('📝 Received data:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Mobile app POST test successful',
      receivedData: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in POST test:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'POST test failed' 
    }, { status: 500 });
  }
}
