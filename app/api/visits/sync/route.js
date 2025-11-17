/**
 * API endpoint to sync visits from external API
 */

import { NextResponse } from 'next/server';
import { syncVisits } from '@/lib/syncVisits.js';
import { invalidateTableCache } from '@/lib/cache.js';
import { responseCache } from '@/lib/cache.js';

export const dynamic = 'force-dynamic';
export const maxDuration = 600; // 10 minutes max duration for this route

/**
 * POST /api/visits/sync - Sync visits from external API
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

    // Allow query params (mode, limit, pages) to override defaults
    try {
      const { searchParams } = new URL(request.url);
      const modeParam = searchParams.get('mode');
      const limitParam = searchParams.get('limit');
      const pagesParam = searchParams.get('pages');

      if (modeParam && !options.mode) {
        options.mode = modeParam;
      }

      if (limitParam && options.limit === undefined) {
        const parsedLimit = parseInt(limitParam, 10);
        if (!Number.isNaN(parsedLimit)) {
          options.limit = parsedLimit;
        }
      }

      if (pagesParam && options.pages === undefined) {
        const parsedPages = parseInt(pagesParam, 10);
        if (!Number.isNaN(parsedPages)) {
          options.pages = parsedPages;
        }
      }
    } catch (paramError) {
      console.warn('⚠️  Failed to parse sync query params:', paramError.message);
    }

    // Execute sync
    const result = await syncVisits(options);

    // Invalidate caches
    try {
      invalidateTableCache('visits');
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
        deleted: result.deleted || 0,
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
 * DELETE /api/visits/sync - Cancel running sync
 */
export async function DELETE(request) {
  try {
    const { query } = await import('@/lib/db.js');
    
    // Find active sync logs
    const activeSyncs = await query(
      `SELECT id, status, started_at 
       FROM sync_logs 
       WHERE entity_type = 'visits' 
       AND status IN ('started', 'in_progress')
       ORDER BY started_at DESC
       LIMIT 1`
    );

    if (activeSyncs.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No active sync found',
      });
    }

    // Cancel all active syncs - use 'failed' status (cancelled is not in enum)
    const result = await query(
      `UPDATE sync_logs 
       SET status = 'failed',
           error_message = 'Cancelled by user',
           completed_at = NOW()
       WHERE entity_type = 'visits' 
       AND status IN ('started', 'in_progress')`
    );

    // Invalidate caches
    try {
      const { invalidateTableCache } = await import('@/lib/cache.js');
      invalidateTableCache('visits');
      responseCache.clear();
    } catch (cacheError) {
      console.error('Failed to invalidate cache:', cacheError);
    }

    return NextResponse.json({
      success: true,
      message: `Cancelled ${result.affectedRows} active sync(s)`,
      cancelled: result.affectedRows,
    });
  } catch (error) {
    console.error('Cancel sync error:', error);
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
 * GET /api/visits/sync - Get sync status
 */
export async function GET(request) {
  try {
    const { query } = await import('@/lib/db.js');
    
    // Get latest sync log
    const [syncLog] = await query(
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
       WHERE entity_type = 'visits'
       ORDER BY started_at DESC
       LIMIT 1`
    );

    if (!syncLog || syncLog.length === 0) {
      return NextResponse.json({
        success: true,
        status: 'idle',
        message: 'No sync history found',
      });
    }

    return NextResponse.json({
      success: true,
      status: syncLog[0].status,
      sync: syncLog[0],
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

