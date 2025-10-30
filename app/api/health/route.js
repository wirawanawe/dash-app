import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    // Test database connection
    await query('SELECT 1 as test');
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      server: 'running'
    });
  } catch (error) {

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      server: 'running',
      error: error.message
    }, { status: 500 });
  }
} 