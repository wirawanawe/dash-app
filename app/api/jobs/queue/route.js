import { NextResponse } from 'next/server';
import { getJobQueue } from '@/lib/jobQueue';

export const dynamic = 'force-dynamic';

/**
 * POST /api/jobs/queue - Add job to queue
 * Body: { jobType, jobData, priority }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { jobType, jobData = {}, priority = 0, maxRetries = 3 } = body;
    
    if (!jobType) {
      return NextResponse.json(
        { error: 'jobType is required' },
        { status: 400 }
      );
    }
    
    // Validate job type
    const validJobTypes = ['visits_incremental_sync', 'visits_full_sync'];
    if (!validJobTypes.includes(jobType)) {
      return NextResponse.json(
        { error: `Invalid jobType. Must be one of: ${validJobTypes.join(', ')}` },
        { status: 400 }
      );
    }
    
    const queue = getJobQueue();
    const result = await queue.addJob(jobType, jobData, priority, maxRetries);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Job added to queue',
      job: result,
    });
    
  } catch (error) {
    console.error('Error adding job to queue:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/jobs/queue - Get queue statistics
 */
export async function GET(request) {
  try {
    const queue = getJobQueue();
    const stats = await queue.getStats();
    
    return NextResponse.json({
      success: true,
      stats,
    });
    
  } catch (error) {
    console.error('Error getting queue stats:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/jobs/queue - Clean up old jobs
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const daysToKeep = parseInt(searchParams.get('daysToKeep') || '7');
    
    const queue = getJobQueue();
    const deletedCount = await queue.cleanup(daysToKeep);
    
    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedCount} old jobs`,
      deletedCount,
    });
    
  } catch (error) {
    console.error('Error cleaning up jobs:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

