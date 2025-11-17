// Job Queue System for Background Processing
// Menggunakan database sebagai queue storage untuk reliability

import { query } from './db.js';
import { invalidateTableCache, responseCache } from './cache.js';

const SYNC_LOG_COLUMN_DEFINITIONS = {
  total_records: "ADD COLUMN total_records INT DEFAULT 0",
  processed_records: "ADD COLUMN processed_records INT DEFAULT 0",
  progress_percent: "ADD COLUMN progress_percent INT DEFAULT 0",
  current_page: "ADD COLUMN current_page INT DEFAULT 0",
  total_pages: "ADD COLUMN total_pages INT DEFAULT 0",
};

async function ensureSyncLogColumns() {
  try {
    const columns = await query(
      `SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'sync_logs'`
    );
    const existing = new Set(columns.map((col) => col.COLUMN_NAME));
    
    // Check if entity_type is ENUM and needs to be changed to VARCHAR
    const entityTypeColumn = columns.find(col => col.COLUMN_NAME === 'entity_type');
    if (entityTypeColumn && entityTypeColumn.DATA_TYPE === 'enum') {
      try {
        console.log('🔄 Converting entity_type from ENUM to VARCHAR for flexibility...');
        await query(`ALTER TABLE sync_logs MODIFY COLUMN entity_type VARCHAR(50) NOT NULL`);
        console.log('✅ entity_type converted to VARCHAR');
      } catch (error) {
        if (!error.message.includes('Duplicate') && !error.message.includes('already')) {
          console.warn('⚠️  Failed to convert entity_type:', error.message);
        }
      }
    }
    
    // Ensure other columns exist
    for (const [column, clause] of Object.entries(SYNC_LOG_COLUMN_DEFINITIONS)) {
      if (!existing.has(column)) {
        try {
          await query(`ALTER TABLE sync_logs ${clause}`);
        } catch (error) {
          if (!error.message.includes('Duplicate column name')) {
            throw error;
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Failed to ensure sync_logs columns:', error.message);
  }
}

/**
 * Job Queue Manager
 * Menangani background jobs untuk sync data tanpa membebani CPU
 */
class JobQueue {
  constructor() {
    this.isProcessing = false;
    this.processingInterval = null;
    this.config = {
      // Process jobs setiap 30 detik (bisa disesuaikan)
      processIntervalMs: parseInt(process.env.JOB_PROCESS_INTERVAL || '30000'),
      // Max concurrent jobs
      maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS || '2'),
      // Job timeout (5 menit)
      jobTimeoutMs: parseInt(process.env.JOB_TIMEOUT || '300000'),
      // Max retries
      maxRetries: parseInt(process.env.JOB_MAX_RETRIES || '3'),
      // CPU throttling - delay antar batch
      batchDelayMs: parseInt(process.env.JOB_BATCH_DELAY || '1000'),
    };
  }

  /**
   * Initialize job queue table jika belum ada
   */
  async initialize() {
    try {
      // Create jobs table if not exists
      await query(`
        CREATE TABLE IF NOT EXISTS job_queue (
          id INT AUTO_INCREMENT PRIMARY KEY,
          job_type VARCHAR(50) NOT NULL,
          job_data JSON,
          status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
          priority INT DEFAULT 0,
          attempts INT DEFAULT 0,
          max_retries INT DEFAULT 3,
          error_message TEXT,
          result JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          started_at TIMESTAMP NULL,
          completed_at TIMESTAMP NULL,
          next_retry_at TIMESTAMP NULL,
          INDEX idx_status_priority (status, priority DESC, created_at),
          INDEX idx_job_type (job_type),
          INDEX idx_next_retry (next_retry_at)
        )
      `);

      console.log('✅ Job queue table initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize job queue:', error.message);
      return false;
    }
  }

  /**
   * Tambah job ke queue
   */
  async addJob(jobType, jobData = {}, priority = 0, maxRetries = 3) {
    try {
      const result = await query(
        `INSERT INTO job_queue (job_type, job_data, priority, max_retries, status)
         VALUES (?, ?, ?, ?, 'pending')`,
        [jobType, JSON.stringify(jobData), priority, maxRetries]
      );

      const jobId = result.insertId;
      console.log(`📋 Job added: ${jobType} (ID: ${jobId})`);
      
      return {
        success: true,
        jobId,
        jobType,
      };
    } catch (error) {
      console.error('❌ Failed to add job:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check if there is an active (pending/processing) job for the given type
   */
  async hasActiveJob(jobType) {
    const statuses = ['pending', 'processing'];
    const placeholders = statuses.map(() => '?').join(', ');
    try {
      const params = [jobType, ...statuses];
      const [row] = await query(
        `SELECT COUNT(*) as count 
         FROM job_queue 
         WHERE job_type = ? 
           AND status IN (${placeholders})`,
        params
      );
      return (row?.count || 0) > 0;
    } catch (error) {
      console.error('❌ Failed to check active jobs:', error.message);
      return false;
    }
  }

  /**
   * Check if a job of the same type was queued recently (dedupe window)
   */
  async hasRecentJob(jobType, withinSeconds = 0) {
    if (!withinSeconds || withinSeconds <= 0) {
      return false;
    }
    try {
      const [row] = await query(
        `SELECT COUNT(*) as count 
         FROM job_queue 
         WHERE job_type = ? 
           AND created_at >= DATE_SUB(NOW(), INTERVAL ? SECOND)`,
        [jobType, withinSeconds]
      );
      return (row?.count || 0) > 0;
    } catch (error) {
      console.error('❌ Failed to check recent jobs:', error.message);
      return false;
    }
  }

  /**
   * Add job only if there is no active or recently queued job
   */
  async addJobIfIdle(jobType, jobData = {}, priority = 0, maxRetries = 3, dedupeSeconds = 0) {
    const hasActive = await this.hasActiveJob(jobType);
    if (hasActive) {
      return {
        success: false,
        skipped: true,
        reason: 'Active job already running',
      };
    }

    const hasRecent = await this.hasRecentJob(jobType, dedupeSeconds);
    if (hasRecent) {
      return {
        success: false,
        skipped: true,
        reason: `Job recently scheduled within ${dedupeSeconds}s`,
      };
    }

    return await this.addJob(jobType, jobData, priority, maxRetries);
  }

  /**
   * Get next pending jobs
   */
  async getNextJobs(limit = 1) {
    try {
      // Ensure limit is a safe integer (prevent SQL injection)
      const limitInt = Math.max(1, Math.min(100, parseInt(limit) || 1));
      
      // Get jobs yang ready untuk diproses
      // Priority: pending jobs atau jobs yang ready untuk retry
      // Note: LIMIT cannot be parameterized in MySQL, so we use safe integer interpolation
      const jobs = await query(
        `SELECT * FROM job_queue 
         WHERE status = 'pending' 
            OR (status = 'failed' 
                AND attempts < max_retries 
                AND (next_retry_at IS NULL OR next_retry_at <= NOW()))
         ORDER BY priority DESC, created_at ASC
         LIMIT ${limitInt}`
      );

      return jobs;
    } catch (error) {
      console.error('❌ Failed to get next jobs:', error.message);
      return [];
    }
  }

  /**
   * Mark job as processing
   */
  async markJobAsProcessing(jobId) {
    try {
      await query(
        `UPDATE job_queue 
         SET status = 'processing', started_at = NOW(), attempts = attempts + 1
         WHERE id = ?`,
        [jobId]
      );
      return true;
    } catch (error) {
      console.error('❌ Failed to mark job as processing:', error.message);
      return false;
    }
  }

  /**
   * Mark job as completed
   */
  async markJobAsCompleted(jobId, result = null) {
    try {
      await query(
        `UPDATE job_queue 
         SET status = 'completed', completed_at = NOW(), result = ?
         WHERE id = ?`,
        [result ? JSON.stringify(result) : null, jobId]
      );
      return true;
    } catch (error) {
      console.error('❌ Failed to mark job as completed:', error.message);
      return false;
    }
  }

  /**
   * Cancel a job (mark as cancelled)
   */
  async cancelJob(jobId, reason = 'Cancelled by user') {
    try {
      const result = await query(
        `UPDATE job_queue 
         SET status = 'failed', 
             error_message = ?,
             completed_at = NOW()
         WHERE id = ? 
           AND status IN ('pending', 'processing')`,
        [reason, jobId]
      );
      
      if (result.affectedRows > 0) {
        console.log(`✅ Job ${jobId} cancelled`);
        return { success: true, message: 'Job cancelled successfully' };
      } else {
        return { success: false, error: 'Job not found or cannot be cancelled' };
      }
    } catch (error) {
      console.error('❌ Failed to cancel job:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel all active sync jobs
   */
  async cancelActiveSyncJobs() {
    try {
      const result = await query(
        `UPDATE job_queue 
         SET status = 'failed', 
             error_message = 'Cancelled by user',
             completed_at = NOW()
         WHERE 1=1
           AND status IN ('pending', 'processing')`
      );
      
      console.log(`✅ Cancelled ${result.affectedRows} active sync jobs`);
      return { 
        success: true, 
        cancelled: result.affectedRows,
        message: `Cancelled ${result.affectedRows} active sync jobs`
      };
    } catch (error) {
      console.error('❌ Failed to cancel active sync jobs:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark job as failed
   */
  async markJobAsFailed(jobId, errorMessage, shouldRetry = true) {
    try {
      // Calculate next retry time with exponential backoff
      const job = await query('SELECT attempts FROM job_queue WHERE id = ?', [jobId]);
      const attempts = job[0]?.attempts || 0;
      
      // Exponential backoff: 1min, 5min, 15min
      const retryDelays = [60, 300, 900]; // seconds
      const retryDelay = retryDelays[Math.min(attempts, retryDelays.length - 1)];
      
      if (shouldRetry) {
        await query(
          `UPDATE job_queue 
           SET status = 'failed', error_message = ?, next_retry_at = DATE_ADD(NOW(), INTERVAL ? SECOND)
           WHERE id = ?`,
          [errorMessage, retryDelay, jobId]
        );
      } else {
        await query(
          `UPDATE job_queue 
           SET status = 'failed', error_message = ?, completed_at = NOW()
           WHERE id = ?`,
          [errorMessage, jobId]
        );
      }
      
      return true;
    } catch (error) {
      console.error('❌ Failed to mark job as failed:', error.message);
      return false;
    }
  }

  /**
   * Process single job
   */
  async processJob(job) {
    const startTime = Date.now();
    
    try {
      const jobType = job.job_type;
      console.log(`⚙️  Processing job ${job.id}: ${jobType}`);
      
      // Mark as processing
      await this.markJobAsProcessing(job.id);
      
      // Parse job data
      const jobData = typeof job.job_data === 'string' 
        ? JSON.parse(job.job_data) 
        : job.job_data;
      
      // Process based on job type
      let result;
      
      // Process based on job type
      // Visits sync methods have been removed
      switch (jobType) {
        default:
          // Auto-mark as failed for unknown job types (don't retry)
          console.error(`❌ Unknown job type: ${jobType}. Marking as failed without retry.`);
          await this.markJobAsFailed(job.id, `Unknown job type: ${jobType}. Visits sync has been removed.`, false);
          return { 
            success: false, 
            error: `Unknown job type: ${jobType}`,
            skipped: true 
          };
      }
      
      // Mark as completed
      await this.markJobAsCompleted(job.id, result);
      
      const duration = Math.round((Date.now() - startTime) / 1000);
      console.log(`✅ Job ${job.id} completed in ${duration}s`);
      
      return { success: true, result };
      
    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error.message);
      
      const shouldRetry = job.attempts < job.max_retries;
      await this.markJobAsFailed(job.id, error.message, shouldRetry);
      
      return { success: false, error: error.message };
    }
  }

  // Visits sync methods removed - all processVisits* methods deleted

  /**
   * Start processing queue (background worker)
   */
  startProcessing() {
    if (this.processingInterval) {
      console.log('⚠️  Queue processor already running');
      return;
    }

    console.log(`🚀 Starting job queue processor (interval: ${this.config.processIntervalMs}ms)`);
    
    // Process immediately
    this.processNextJobs();
    
    // Then process at intervals
    this.processingInterval = setInterval(() => {
      this.processNextJobs();
    }, this.config.processIntervalMs);
  }

  /**
   * Stop processing queue
   */
  stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('🛑 Job queue processor stopped');
    }
  }

  /**
   * Process next batch of jobs
   */
  async processNextJobs() {
    if (this.isProcessing) {
      // Skip silently to prevent log spam
      return;
    }

    try {
      this.isProcessing = true;
      
      // Get next jobs
      const jobs = await this.getNextJobs(this.config.maxConcurrentJobs);
      
      if (jobs.length === 0) {
        // No jobs to process - normal condition
        return;
      }

      console.log(`📊 Processing ${jobs.length} jobs...`);
      
      // Process jobs concurrently dengan limit
      const promises = jobs.map(job => this.processJob(job));
      await Promise.all(promises);
      
      // Throttling - kasih delay untuk CPU recovery
      if (this.config.batchDelayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, this.config.batchDelayMs));
      }
      
    } catch (error) {
      console.error('❌ Error processing jobs:', error.message);
      // Add delay on error to prevent tight error loop causing CPU spike
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay on error
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get queue statistics
   */
  async getStats() {
    try {
      const [stats] = await query(`
        SELECT 
          COUNT(*) as total_jobs,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
          AVG(TIMESTAMPDIFF(SECOND, started_at, completed_at)) as avg_duration_seconds
        FROM job_queue
      `);

      return {
        ...stats,
        config: this.config,
        isProcessing: this.isProcessing,
      };
    } catch (error) {
      console.error('❌ Failed to get queue stats:', error.message);
      return null;
    }
  }

  /**
   * Clean up old completed jobs (older than 7 days)
   */
  async cleanup(daysToKeep = 7) {
    try {
      const result = await query(
        `DELETE FROM job_queue 
         WHERE status IN ('completed', 'failed') 
         AND completed_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [daysToKeep]
      );

      console.log(`🧹 Cleaned up ${result.affectedRows} old jobs`);
      return result.affectedRows;
    } catch (error) {
      console.error('❌ Failed to cleanup jobs:', error.message);
      return 0;
    }
  }
}

// Singleton instance
let queueInstance = null;

export function getJobQueue() {
  if (!queueInstance) {
    queueInstance = new JobQueue();
  }
  return queueInstance;
}

export { JobQueue };

