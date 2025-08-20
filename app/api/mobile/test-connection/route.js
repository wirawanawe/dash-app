import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    console.log('🔍 Mobile connection test endpoint called');
    
    return NextResponse.json({
      success: true,
      message: 'Mobile app connection test successful',
      timestamp: new Date().toISOString(),
      server: 'PHC Dashboard API',
      version: '1.0.0'
    });
  } catch (error) {
    console.error('❌ Error in connection test:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Connection test failed' 
    }, { status: 500 });
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
