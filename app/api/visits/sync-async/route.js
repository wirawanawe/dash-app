import { NextResponse } from 'next/server';
import { getJobQueue } from '@/lib/jobQueue';

export const dynamic = 'force-dynamic';

/**
 * POST /api/visits/sync-async - Trigger async sync via job queue
 * 
 * This endpoint adds a sync job to the queue instead of processing it immediately.
 * This prevents CPU overload and allows for better resource management.
 * 
 * Query params:
 *   - mode: 'incremental' (default) or 'full'
 *   - priority: 0-10 (default: 5)
 */
export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'incremental';
    const priority = parseInt(searchParams.get('priority') || '5');
    
    // Validate mode
    if (!['incremental', 'full', 'aggressive'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be "incremental" or "full"' },
        { status: 400 }
      );
    }
    
    // Parse optional job data from body
    let jobData = {};
    try {
      const body = await request.json();
      jobData = body || {};
    } catch (error) {
      // No body or invalid JSON, use defaults
    }
    
    // Determine job type
    const jobType = mode === 'incremental' 
      ? 'visits_incremental_sync' 
      : 'visits_full_sync';
    
    const defaultJobData = mode === 'aggressive'
      ? {
          maxRecords: 'all',
          recordsPerPage: 5000,
          concurrentPages: 3,
          batchSize: 200,
          delayBetweenBatches: 100,
          delayBetweenPages: 200,
        }
      : mode === 'full'
      ? {
          maxRecords: 'all',
          recordsPerPage: 400,
          concurrentPages: 2,
          batchSize: 60,
          delayBetweenBatches: 200,
          delayBetweenPages: 200,
        }
      : {
          maxRecords: 1000,
          recordsPerPage: 150,
          concurrentPages: 1,
          batchSize: 30,
          delayBetweenBatches: 1000,
          delayBetweenPages: 1000,
        };

    const mergedJobData = {
      ...defaultJobData,
      ...jobData,
    };

    // Add job to queue
    const queue = getJobQueue();
    const result = await queue.addJob(jobType, mergedJobData, priority);
    
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          error: result.error 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: `Sync job queued successfully (${mode} mode)`,
      job: {
        id: result.jobId,
        type: jobType,
        mode,
        priority,
      },
      info: {
        message: 'Job will be processed in the background',
        checkStatus: `/api/jobs/queue`,
      }
    });
    
  } catch (error) {
    console.error('Error queuing sync job:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/visits/sync-async - Get sync job status
 */
export async function GET(request) {
  try {
    const queue = getJobQueue();
    const stats = await queue.getStats();
    
    // Get recent sync jobs
    const { query } = await import('../../../../lib/db.js');
    const recentJobs = await query(
      `SELECT * FROM job_queue 
       WHERE job_type IN ('visits_incremental_sync', 'visits_full_sync')
       ORDER BY created_at DESC 
       LIMIT 10`
    );
    
    return NextResponse.json({
      success: true,
      queueStats: stats,
      recentJobs: recentJobs.map(job => ({
        id: job.id,
        type: job.job_type,
        status: job.status,
        attempts: job.attempts,
        created_at: job.created_at,
        started_at: job.started_at,
        completed_at: job.completed_at,
        error_message: job.error_message,
        result: job.result ? JSON.parse(job.result) : null,
      })),
    });
    
  } catch (error) {
    console.error('Error getting sync status:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message 
      },
      { status: 500 }
    );
  }
}

