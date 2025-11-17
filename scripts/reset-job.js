/**
 * Reset specific job or all stuck jobs
 * Usage: node scripts/reset-job.js [jobId]
 *        node scripts/reset-job.js all
 */

import { query } from '../lib/db.js';

async function resetJob(jobIdOrAll) {
  try {
    if (jobIdOrAll === 'all') {
      console.log('🔄 Resetting all stuck jobs...');
      
      // Reset all processing jobs
      const result = await query(
        `UPDATE job_queue 
         SET status = 'failed', 
             error_message = 'Reset: Job was stuck in processing state',
             completed_at = NOW()
         WHERE status = 'processing'`
      );
      
      console.log(`✅ Reset ${result.affectedRows} processing job(s)`);
      
      // Also reset jobs that have been processing for more than 30 minutes
      const stuckResult = await query(
        `UPDATE job_queue 
         SET status = 'failed', 
             error_message = 'Reset: Job was stuck (processing > 30 minutes)',
             completed_at = NOW()
         WHERE status = 'processing' 
         AND started_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE)`
      );
      
      if (stuckResult.affectedRows > 0) {
        console.log(`✅ Reset ${stuckResult.affectedRows} stuck job(s) (processing > 30 minutes)`);
      }
      
    } else if (jobIdOrAll) {
      const jobId = parseInt(jobIdOrAll);
      
      if (isNaN(jobId)) {
        console.error('❌ Invalid job ID. Must be a number or "all"');
        process.exit(1);
      }
      
      console.log(`🔄 Resetting job ${jobId}...`);
      
      // Check if job exists
      const [job] = await query(
        `SELECT id, job_type, status, started_at 
         FROM job_queue 
         WHERE id = ?`,
        [jobId]
      );
      
      if (!job) {
        console.error(`❌ Job ${jobId} not found`);
        process.exit(1);
      }
      
      console.log(`📋 Job ${jobId}: ${job.job_type}, status: ${job.status}`);
      
      // Reset the job
      const result = await query(
        `UPDATE job_queue 
         SET status = 'failed', 
             error_message = 'Reset: Job manually reset',
             completed_at = NOW()
         WHERE id = ?`,
        [jobId]
      );
      
      console.log(`✅ Job ${jobId} reset successfully`);
      
    } else {
      // Show current processing jobs
      console.log('📋 Current processing jobs:');
      const processingJobs = await query(
        `SELECT id, job_type, started_at, TIMESTAMPDIFF(MINUTE, started_at, NOW()) as minutes_running
         FROM job_queue 
         WHERE status = 'processing'
         ORDER BY started_at DESC`
      );
      
      if (processingJobs.length === 0) {
        console.log('✅ No processing jobs found');
      } else {
        processingJobs.forEach(job => {
          console.log(`  - Job ${job.id}: ${job.job_type} (running for ${job.minutes_running} minutes)`);
        });
        console.log('');
        console.log('To reset a specific job: node scripts/reset-job.js <jobId>');
        console.log('To reset all processing jobs: node scripts/reset-job.js all');
      }
    }

  } catch (error) {
    console.error('❌ Failed to reset job:', error.message);
    process.exit(1);
  }
}

const jobIdOrAll = process.argv[2];
resetJob(jobIdOrAll).then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

