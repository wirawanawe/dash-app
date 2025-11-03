import { NextResponse } from "next/server";
import { getPoolStats } from "@/lib/db";

export async function GET(request) {
  try {
    const stats = await getPoolStats();
    
    const status = {
      healthy: stats.activeConnections < 45, // Warning if above 45 out of 50
      timestamp: new Date().toISOString(),
      pool: {
        activeConnections: stats.activeConnections,
        idleConnections: stats.idleConnections,
        totalConnections: stats.totalConnections,
        queuedRequests: stats.queuedRequests,
        utilizationPercentage: Math.round((stats.activeConnections / 50) * 100),
      },
      recommendations: []
    };

    // Add recommendations based on usage
    if (stats.activeConnections > 40) {
      status.recommendations.push("High connection usage - consider increasing pool size or optimizing queries");
    }
    
    if (stats.queuedRequests > 10) {
      status.recommendations.push("High queue - connections waiting for availability");
    }

    if (stats.idleConnections < 5 && stats.activeConnections > 30) {
      status.recommendations.push("Low idle connections - pool might be saturated");
    }

    return NextResponse.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('❌ Health check error:', error);
    return NextResponse.json(
      {
        success: false,
        healthy: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}

