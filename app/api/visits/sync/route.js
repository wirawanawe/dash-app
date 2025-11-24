/**
 * API endpoint to sync visits from external API
 * 
 * Alur:
 * 1. Jalankan sync-visits-paginated.js (sync dari API ke cache)
 * 2. Jalankan copy-cache-to-visits.js (copy dari cache ke tabel utama)
 * 3. Refresh halaman setelah selesai
 */

import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { invalidateTableCache } from '@/lib/cache.js';
import { responseCache } from '@/lib/cache.js';
import path from 'path';
import { query } from '@/lib/db.js';

const execAsync = promisify(exec);
// Use process.cwd() to get the project root directory
// This works reliably in Next.js API routes
const projectRoot = process.cwd();

export const dynamic = 'force-dynamic';
export const maxDuration = 600; // 10 minutes max duration for this route

/**
 * Execute a Node.js script and return output
 */
async function runScript(scriptPath, args = []) {
  try {
    const fullPath = path.join(projectRoot, scriptPath);
    console.log(`🚀 Running script: ${scriptPath}${args.length > 0 ? ' ' + args.join(' ') : ''}`);
    
    // Build command with arguments properly escaped
    const command = `node "${fullPath}"${args.length > 0 ? ' ' + args.map(arg => `"${arg}"`).join(' ') : ''}`;
    
    const { stdout, stderr } = await execAsync(command, {
      cwd: projectRoot,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      env: {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV || 'production',
      },
    });
    
    if (stderr && !stderr.includes('Warning')) {
      console.warn(`⚠️  Script stderr: ${stderr.substring(0, 500)}`);
    }
    
    return { success: true, stdout, stderr };
  } catch (error) {
    console.error(`❌ Script execution failed: ${error.message}`);
    return { success: false, error: error.message, stdout: error.stdout, stderr: error.stderr };
  }
}

/**
 * POST /api/visits/sync - Sync visits from external API
 */
export async function POST(request) {
  const startTime = Date.now();
  let syncLogId = null;
  
  try {
    // Create sync log entry
    try {
      const logResult = await query(
        `INSERT INTO sync_logs (entity_type, status, started_at) 
         VALUES ('visits', 'started', NOW())`
      );
      syncLogId = logResult.insertId;
      await query(
        `UPDATE sync_logs SET status = 'in_progress' WHERE id = ?`,
        [syncLogId]
      );
      console.log(`📝 Created sync log entry: ${syncLogId}`);
    } catch (logError) {
      console.warn('⚠️  Failed to create sync log:', logError.message);
    }
    
    // Parse request body for sync options
    let syncArgs = [];
    try {
      const body = await request.json().catch(() => ({}));
      if (body.today === true || body.today === 'true') {
        syncArgs = ['--today'];
        console.log('📅 Sync mode: Today only');
      } else if (body.startDate && body.endDate) {
        syncArgs = ['--start-date', body.startDate, '--end-date', body.endDate];
        console.log(`📅 Sync mode: Date range ${body.startDate} to ${body.endDate}`);
      } else if (body.date) {
        syncArgs = ['--date', body.date];
        console.log(`📅 Sync mode: Date ${body.date}`);
      } else if (body.startDate) {
        syncArgs = ['--start-date', body.startDate];
        console.log(`📅 Sync mode: From date ${body.startDate}`);
      }
    } catch (e) {
      // If no body or invalid JSON, continue with full sync
    }
    
    console.log('🔄 Starting visits sync process...');
    
    // Step 1: Sync from API to cache
    console.log('📥 Step 1: Syncing from API to visits_cache...');
    const syncResult = await runScript('scripts/sync-visits-paginated.js', syncArgs);
    
    if (!syncResult.success) {
      // Update sync log with error
      if (syncLogId) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        await query(
          `UPDATE sync_logs SET
            status = 'failed',
            error_message = ?,
            completed_at = NOW(),
            duration_seconds = ?
          WHERE id = ?`,
          [`Sync from API failed: ${syncResult.error || 'Unknown error'}`, duration, syncLogId]
        );
      }
      
      return NextResponse.json(
        {
          success: false,
          error: `Sync from API failed: ${syncResult.error || 'Unknown error'}`,
          step: 'sync-api-to-cache',
        },
        { status: 500 }
      );
    }
    
    console.log('✅ Step 1 completed: API sync to cache successful');
    
    // Verify data was inserted into cache before proceeding
    try {
      const [cacheCount] = await query('SELECT COUNT(*) as total FROM visits_cache');
      console.log(`📊 Records in cache after sync: ${cacheCount?.total || 0}`);
      if (cacheCount?.total === 0) {
        console.warn('⚠️  Warning: No records found in cache after sync');
      }
    } catch (cacheError) {
      console.warn('⚠️  Could not verify cache count:', cacheError.message);
    }
    
    // Step 2: Copy from cache to visits table
    console.log('📤 Step 2: Copying from visits_cache to visits table...');
    const copyResult = await runScript('scripts/copy-cache-to-visits.js');
    
    // Log copy result for debugging
    if (copyResult.stdout) {
      console.log('📋 Copy script output (first 1000 chars):', copyResult.stdout.substring(0, 1000));
    }
    if (copyResult.stderr) {
      console.warn('⚠️  Copy script stderr:', copyResult.stderr.substring(0, 500));
    }
    
    if (!copyResult.success) {
      // Update sync log with error
      if (syncLogId) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        await query(
          `UPDATE sync_logs SET
            status = 'failed',
            error_message = ?,
            completed_at = NOW(),
            duration_seconds = ?
          WHERE id = ?`,
          [`Copy from cache failed: ${copyResult.error || 'Unknown error'}`, duration, syncLogId]
        );
      }
      
      return NextResponse.json(
        {
          success: false,
          error: `Copy from cache failed: ${copyResult.error || 'Unknown error'}`,
          step: 'copy-cache-to-visits',
          syncResult: syncResult.stdout?.substring(0, 500),
          copyResult: copyResult.stdout?.substring(0, 500),
        },
        { status: 500 }
      );
    }
    
    console.log('✅ Step 2 completed: Copy from cache to visits successful');
    
    // Verify data was copied to visits table
    try {
      const [visitsCount] = await query('SELECT COUNT(*) as total FROM visits WHERE external_id IS NOT NULL');
      console.log(`📊 Total records in visits table after copy: ${visitsCount?.total || 0}`);
    } catch (verifyError) {
      console.warn('⚠️  Could not verify visits count:', verifyError.message);
    }

    // Invalidate caches
    try {
      invalidateTableCache('visits');
      responseCache.clear();
      console.log('✅ Cache invalidated');
    } catch (cacheError) {
      console.error('⚠️  Failed to invalidate cache:', cacheError);
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Parse results from stdout if possible
    let stats = {
      sync: { success: true },
      copy: { success: true },
    };
    
    let fetchedRecords = 0;
    let insertedRecords = 0;
    let updatedRecords = 0;
    let failedRecords = 0;
    
    // Try to extract stats from stdout
    try {
      if (syncResult.stdout) {
        // Try to extract inserted count from sync script output
        const syncMatch1 = syncResult.stdout.match(/Total records inserted:\s*([\d,]+)/);
        const syncMatch2 = syncResult.stdout.match(/Total records inserted:\s*([\d.]+)/);
        const syncMatch = syncMatch1 || syncMatch2;
        if (syncMatch) {
          const inserted = parseInt(syncMatch[1].replace(/[,.]/g, ''));
          stats.sync.inserted = inserted;
          fetchedRecords = inserted; // Use inserted as fetched for now
        }
        // Try to extract fetched count from various patterns
        const fetchedMatch1 = syncResult.stdout.match(/Fetched.*?(\d+)/i);
        const fetchedMatch2 = syncResult.stdout.match(/Fetched\s+(\d+)/i);
        const fetchedMatch = fetchedMatch1 || fetchedMatch2;
        if (fetchedMatch) {
          fetchedRecords = parseInt(fetchedMatch[1].replace(/[,.]/g, ''));
        }
        // Also try to extract from page summaries
        const pageMatch = syncResult.stdout.match(/✅ Page \d+ completed: (\d+) inserted/i);
        if (pageMatch) {
          const pageInserted = parseInt(pageMatch[1].replace(/[,.]/g, ''));
          if (pageInserted > 0) {
            fetchedRecords = (fetchedRecords || 0) + pageInserted;
          }
        }
      }
      
      if (copyResult.stdout) {
        // Try multiple patterns for inserted
        const copyMatch1 = copyResult.stdout.match(/Records inserted:\s*([\d,]+)/);
        const copyMatch2 = copyResult.stdout.match(/Records inserted:\s*([\d.]+)/);
        const copyMatch = copyMatch1 || copyMatch2;
        if (copyMatch) {
          insertedRecords = parseInt(copyMatch[1].replace(/[,.]/g, ''));
          stats.copy.inserted = insertedRecords;
        }
        
        // Try multiple patterns for updated
        const updateMatch1 = copyResult.stdout.match(/Records updated:\s*([\d,]+)/);
        const updateMatch2 = copyResult.stdout.match(/Records updated:\s*([\d.]+)/);
        const updateMatch = updateMatch1 || updateMatch2;
        if (updateMatch) {
          updatedRecords = parseInt(updateMatch[1].replace(/[,.]/g, ''));
          stats.copy.updated = updatedRecords;
        }
        
        // Try to extract failed count
        const failedMatch1 = copyResult.stdout.match(/Records failed:\s*([\d,]+)/);
        const failedMatch2 = copyResult.stdout.match(/Records failed:\s*([\d.]+)/);
        const failedMatch = failedMatch1 || failedMatch2;
        if (failedMatch) {
          failedRecords = parseInt(failedMatch[1].replace(/[,.]/g, ''));
        }
      }
    } catch (parseError) {
      console.warn('⚠️  Could not parse stats from output:', parseError.message);
    }
    
    // Update sync log with success status
    if (syncLogId) {
      try {
        await query(
          `UPDATE sync_logs SET
            status = 'completed',
            records_fetched = ?,
            records_inserted = ?,
            records_updated = ?,
            records_failed = ?,
            total_records = ?,
            processed_records = ?,
            progress_percent = 100,
            completed_at = NOW(),
            duration_seconds = ?,
            error_message = NULL
          WHERE id = ?`,
          [
            fetchedRecords,
            insertedRecords,
            updatedRecords,
            failedRecords,
            fetchedRecords,
            insertedRecords + updatedRecords,
            parseFloat(duration),
            syncLogId
          ]
        );
        console.log(`✅ Updated sync log ${syncLogId} with completed status`);
      } catch (logError) {
        console.warn('⚠️  Failed to update sync log:', logError.message);
      }
  }
    
    return NextResponse.json({
      success: true,
      message: 'Sync completed successfully',
      duration: parseFloat(duration),
      steps: {
        'sync-api-to-cache': { success: true },
        'copy-cache-to-visits': { success: true },
      },
      stats,
    });
    
  } catch (error) {
    console.error('❌ Sync error:', error);
    
    // Update sync log with error
    if (syncLogId) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      try {
        await query(
          `UPDATE sync_logs SET
            status = 'failed',
            error_message = ?,
            completed_at = NOW(),
            duration_seconds = ?
          WHERE id = ?`,
          [error.message, duration, syncLogId]
        );
      } catch (logError) {
        console.warn('⚠️  Failed to update sync log with error:', logError.message);
      }
    }
    
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
 * Returns the last sync result if available
 */
export async function GET(request) {
  try {
    const { query } = await import('@/lib/db.js');
    
    // Get latest sync log
    const logs = await query(
      `SELECT 
         id,
         status,
         records_fetched as fetched,
         records_inserted as inserted,
         records_updated as updated,
         records_failed as failed,
         total_records as total,
         processed_records as processed,
         progress_percent as progress,
         started_at,
         completed_at,
         duration_seconds as duration,
         error_message as error
       FROM sync_logs
       WHERE entity_type = 'visits'
       ORDER BY started_at DESC
       LIMIT 1`
    );

    if (!logs || logs.length === 0) {
      return NextResponse.json({
        success: true,
        status: 'idle',
        message: 'No sync history found',
      });
    }
    
    const lastSync = logs[0];

    return NextResponse.json({
      success: true,
      status: lastSync.status || 'idle',
      lastSync: {
        status: lastSync.status,
        progress: lastSync.progress || 0,
        fetched: lastSync.fetched || 0,
        inserted: lastSync.inserted || 0,
        updated: lastSync.updated || 0,
        failed: lastSync.failed || 0,
        total: lastSync.total || 0,
        processed: lastSync.processed || 0,
        started_at: lastSync.started_at,
        completed_at: lastSync.completed_at,
        duration: lastSync.duration || 0,
        error: lastSync.error || null,
      },
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

