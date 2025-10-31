import { NextResponse } from "next/server";
import { getHealthCheck, getPoolStats, getCacheStats, getMemoryStats } from "@/lib/monitor";

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const health = await getHealthCheck();
    const memory = getMemoryStats();
    
    return NextResponse.json({
      ...health,
      memory,
      uptime: process.uptime(),
      nodeVersion: process.version
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
