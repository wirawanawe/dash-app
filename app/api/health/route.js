import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health - Health check endpoint
 * 
 * Returns:
 *   - Database connectivity
 *   - Queue statistics
 *   - System health
 */
export async function GET(request) {
  const checks = {
    timestamp: new Date().toISOString(),
    database: { healthy: false },
    queue: { healthy: false },
  };
  
  let overallHealthy = true;
  
  try {
    // Check database
    try {
      const { query } = await import('../../../lib/db.js');
      await query('SELECT 1');
      checks.database = {
        healthy: true,
        message: 'Database connected',
      };
    } catch (error) {
      checks.database = {
        healthy: false,
        message: error.message,
      };
      overallHealthy = false;
    }
    
    // Check queue
    try {
      const { getJobQueue } = await import('@/lib/jobQueue');
      const queue = getJobQueue();
      const stats = await queue.getStats();
      
      checks.queue = {
        healthy: true,
        stats,
      };
    } catch (error) {
      checks.queue = {
        healthy: false,
        message: error.message,
      };
      overallHealthy = false;
    }
    
    // Return appropriate status code
    const statusCode = overallHealthy ? 200 : 503;
    
    return NextResponse.json({
      healthy: overallHealthy,
      service: 'dash-app',
      version: process.env.npm_package_version || '1.0.0',
      checks,
      uptime: process.uptime(),
    }, { status: statusCode });
    
  } catch (error) {
    return NextResponse.json({
      healthy: false,
      service: 'dash-app',
      error: error.message,
    }, { status: 503 });
  }
}
