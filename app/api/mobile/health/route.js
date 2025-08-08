import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    const result = await query('SELECT 1 as test');
    
    return NextResponse.json({
      success: true,
      message: 'Database connection is working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Database connection failed',
        error: error.message 
      },
      { status: 500 }
    );
  }
}
