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

const execAsync = promisify(exec);
// Use process.cwd() to get the project root directory
// This works reliably in Next.js API routes
const projectRoot = process.cwd();

export const dynamic = 'force-dynamic';
export const maxDuration = 600; // 10 minutes max duration for this route

/**
 * Execute a Node.js script and return output
 */
async function runScript(scriptPath) {
  try {
    const fullPath = path.join(projectRoot, scriptPath);
    console.log(`🚀 Running script: ${scriptPath}`);
    
    const { stdout, stderr } = await execAsync(`node "${fullPath}"`, {
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
  
  try {
    console.log('🔄 Starting visits sync process...');
    
    // Step 1: Sync from API to cache
    console.log('📥 Step 1: Syncing from API to visits_cache...');
    const syncResult = await runScript('scripts/sync-visits-paginated.js');
    
    if (!syncResult.success) {
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
    
    // Step 2: Copy from cache to visits table
    console.log('📤 Step 2: Copying from visits_cache to visits table...');
    const copyResult = await runScript('scripts/copy-cache-to-visits.js');
    
    if (!copyResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Copy from cache failed: ${copyResult.error || 'Unknown error'}`,
          step: 'copy-cache-to-visits',
          syncResult: syncResult.stdout?.substring(0, 500),
        },
        { status: 500 }
      );
    }
    
    console.log('✅ Step 2 completed: Copy from cache to visits successful');
    
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
    
    // Try to extract stats from stdout
    try {
      if (syncResult.stdout) {
        const syncMatch = syncResult.stdout.match(/Total records inserted:\s*(\d+)/);
        if (syncMatch) {
          stats.sync.inserted = parseInt(syncMatch[1]);
        }
      }
      
      if (copyResult.stdout) {
        const copyMatch = copyResult.stdout.match(/Records inserted:\s*([\d.]+)/);
        const updateMatch = copyResult.stdout.match(/Records updated:\s*([\d.]+)/);
        if (copyMatch) {
          stats.copy.inserted = parseInt(copyMatch[1].replace(/\./g, ''));
        }
        if (updateMatch) {
          stats.copy.updated = parseInt(updateMatch[1].replace(/\./g, ''));
        }
      }
    } catch (parseError) {
      console.warn('⚠️  Could not parse stats from output:', parseError.message);
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
    // For now, return a simple status
    // The POST endpoint handles the actual sync and returns steps info
    return NextResponse.json({
      success: true,
      status: 'idle',
      message: 'Use POST /api/visits/sync to start sync',
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

