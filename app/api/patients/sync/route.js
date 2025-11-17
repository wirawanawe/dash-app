/**
 * API endpoint to sync patients from external API
 */

import { NextResponse } from 'next/server';
import { syncPatients } from '@/lib/syncPatients.js';
import { invalidateTableCache } from '@/lib/cache.js';
import { responseCache } from '@/lib/cache.js';

export const dynamic = 'force-dynamic';
export const maxDuration = 600; // 10 minutes max duration for this route

/**
 * POST /api/patients/sync - Sync patients from external API
 */
export async function POST(request) {
  try {
    // Parse optional options from body
    let options = {};
    try {
      const body = await request.json();
      options = body || {};
    } catch (error) {
      // No body or invalid JSON, use defaults
    }

    // Execute sync
    const result = await syncPatients(options);

    // Invalidate caches
    try {
      invalidateTableCache('patients');
      responseCache.clear();
    } catch (cacheError) {
      console.error('Failed to invalidate cache:', cacheError);
    }

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Sync completed successfully',
      duration: result.duration,
      stats: {
        fetched: result.fetched || 0,
        inserted: result.inserted || 0,
        updated: result.updated || 0,
        failed: result.failed || 0,
        total: result.total || 0,
        processed: result.processed || 0,
      },
    });
    
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/patients/sync - Get sync status and logs
 */
export async function GET(request) {
  try {
    const { query } = await import('@/lib/db.js');
    
    // Get latest sync log
    const logs = await query(
      `SELECT 
         id,
         status,
         records_fetched,
         records_inserted,
         records_updated,
         records_failed,
         total_records,
         processed_records,
         progress_percent,
         started_at,
         completed_at,
         duration_seconds,
         error_message
       FROM sync_logs
       WHERE entity_type = 'patients'
       ORDER BY started_at DESC
       LIMIT 1`
    );
    
    if (!logs || logs.length === 0) {
      return NextResponse.json({
        success: true,
        logs: [],
        message: 'No sync history found',
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      logs: logs 
    });
  } catch (error) {
    console.error('Get sync status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
