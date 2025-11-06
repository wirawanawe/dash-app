// Background Worker - Auto-start job queue processor
// This runs continuously to process queued jobs

import { getJobQueue } from './jobQueue.js';

let workerStarted = false;
let workerInstance = null;

/**
 * Initialize and start background worker
 * Hanya dijalankan sekali saat server start
 */
export async function startBackgroundWorker() {
  if (workerStarted) {
    console.log('⚠️  Background worker already started');
    return workerInstance;
  }
  
  try {
    console.log('🚀 Starting background worker...');
    
    // Get job queue instance
    const queue = getJobQueue();
    
    // Initialize queue (create table if not exists)
    const initialized = await queue.initialize();
    
    if (!initialized) {
      throw new Error('Failed to initialize job queue');
    }
    
    // Start processing
    queue.startProcessing();
    
    workerStarted = true;
    workerInstance = queue;
    
    console.log('✅ Background worker started successfully');
    
    // Setup graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 Received SIGTERM, stopping background worker...');
      stopBackgroundWorker();
      process.exit(0);
    });
    
    process.on('SIGINT', () => {
      console.log('🛑 Received SIGINT, stopping background worker...');
      stopBackgroundWorker();
      process.exit(0);
    });
    
    // Schedule automatic incremental sync every hour (optional)
    if (process.env.AUTO_SYNC_ENABLED === 'true') {
      const autoSyncInterval = parseInt(process.env.AUTO_SYNC_INTERVAL || '3600000'); // 1 hour default
      
      setInterval(async () => {
        console.log('🔄 Auto-scheduling incremental sync...');
        await queue.addJob('visits_incremental_sync', {}, 3); // Medium priority
      }, autoSyncInterval);
      
      console.log(`⏰ Auto-sync enabled (interval: ${autoSyncInterval}ms)`);
    }
    
    return queue;
    
  } catch (error) {
    console.error('❌ Failed to start background worker:', error.message);
    return null;
  }
}

/**
 * Stop background worker
 */
export function stopBackgroundWorker() {
  if (!workerStarted || !workerInstance) {
    console.log('⚠️  Background worker not running');
    return;
  }
  
  console.log('🛑 Stopping background worker...');
  
  workerInstance.stopProcessing();
  workerStarted = false;
  workerInstance = null;
  
  console.log('✅ Background worker stopped');
}

/**
 * Get worker status
 */
export function getWorkerStatus() {
  return {
    running: workerStarted,
    instance: workerInstance ? 'active' : 'inactive',
  };
}

/**
 * Check if worker is healthy
 */
export async function checkWorkerHealth() {
  if (!workerStarted || !workerInstance) {
    return {
      healthy: false,
      message: 'Worker not running',
    };
  }
  
  try {
    const stats = await workerInstance.getStats();
    
    // Check for stuck jobs (processing > 10 minutes)
    const { query } = await import('./db.js');
    const stuckJobs = await query(
      `SELECT COUNT(*) as count FROM job_queue 
       WHERE status = 'processing' 
       AND started_at < DATE_SUB(NOW(), INTERVAL 10 MINUTE)`
    );
    
    const hasStuckJobs = stuckJobs[0]?.count > 0;
    
    return {
      healthy: !hasStuckJobs,
      message: hasStuckJobs ? 'Has stuck jobs' : 'OK',
      stats,
      warnings: hasStuckJobs ? ['Some jobs are stuck in processing state'] : [],
    };
    
  } catch (error) {
    return {
      healthy: false,
      message: error.message,
    };
  }
}

// Export singleton instance
export { workerInstance };

