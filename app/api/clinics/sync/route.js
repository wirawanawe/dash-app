/**
 * API endpoint to sync clinics (faskes) from external API
 * 
 * Alur:
 * 1. Jalankan sync-clinics-paginated.js (sync dari API ke cache)
 * 2. Jalankan copy-cache-to-clinics.js (copy dari cache ke tabel utama)
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

export const dynamic = 'force-dynamic';
export const maxDuration = 600; // 10 minutes max duration for this route

/**
 * POST /api/clinics/sync - Sync clinics from external API
 */
export async function POST(request) {
  const startTime = Date.now();
  
  try {
    console.log('🔄 Starting clinics sync process...');
    
    // Step 1: Sync from API to cache
    console.log('📥 Step 1: Syncing from API to clinics_cache...');
    const syncResult = await runScript('scripts/sync-clinics-paginated.js');
    
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

    // Step 2: Copy from cache to clinics table
    console.log('📤 Step 2: Copying from clinics_cache to clinics table...');
    const copyResult = await runScript('scripts/copy-cache-to-clinics.js');
    
    if (!copyResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Copy from cache failed: ${copyResult.error || 'Unknown error'}`,
          step: 'copy-cache-to-clinics',
          syncResult: syncResult.stdout?.substring(0, 500),
        },
        { status: 500 }
      );
    }
    
    console.log('✅ Step 2 completed: Copy from cache to clinics successful');
    
    // Invalidate caches
    try {
      invalidateTableCache('clinics');
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
        'copy-cache-to-clinics': { success: true },
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
 * GET /api/clinics/sync - Get sync status and logs
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
       WHERE entity_type = 'clinics'
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
