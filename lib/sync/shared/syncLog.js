/**
 * Sync log utilities for tracking sync progress
 */

import { query } from '../../db.js';

/**
 * Create a new sync log entry
 * @param {string} entityType - Entity type (e.g., 'visits')
 * @returns {Promise<number>} Sync log ID
 */
export async function createSyncLog(entityType = 'visits') {
  const result = await query(
    `INSERT INTO sync_logs (entity_type, status, started_at) 
     VALUES (?, 'started', NOW())`,
    [entityType]
  );
  
  const logId = result.insertId;
  
  // Update to in_progress
  await query(
    `UPDATE sync_logs SET status = 'in_progress' WHERE id = ?`,
    [logId]
  );
  
  return logId;
}

/**
 * Update sync log progress
 * @param {number} logId - Sync log ID
 * @param {object} progress - Progress data
 */
export async function updateSyncLogProgress(logId, progress) {
  if (!logId) return;
  
  const {
    totalRecords = 0,
    processedRecords = 0,
    fetchedRecords = 0,
    insertedRecords = 0,
    updatedRecords = 0,
    failedRecords = 0,
    currentPage = 0,
    totalPages = 0,
    progressPercent = 0,
  } = progress;
  
  const percent = totalRecords > 0
    ? Math.min(100, Math.round((processedRecords / totalRecords) * 100))
    : progressPercent;
  
  try {
    await query(
      `UPDATE sync_logs SET
        status = 'in_progress',
        total_records = ?,
        records_fetched = ?,
        records_inserted = ?,
        records_updated = ?,
        records_failed = ?,
        processed_records = ?,
        progress_percent = ?,
        current_page = ?,
        total_pages = ?
      WHERE id = ?`,
      [
        totalRecords,
        fetchedRecords,
        insertedRecords,
        updatedRecords,
        failedRecords,
        processedRecords,
        percent,
        currentPage,
        totalPages,
        logId,
      ]
    );
  } catch (error) {
    console.error('Failed to update sync progress:', error.message);
  }
}

/**
 * Complete sync log
 * @param {number} logId - Sync log ID
 * @param {object} result - Final result data
 */
export async function completeSyncLog(logId, result) {
  if (!logId) return;
  
  const {
    status = 'completed',
    fetchedRecords = 0,
    insertedRecords = 0,
    updatedRecords = 0,
    failedRecords = 0,
    totalRecords = 0,
    processedRecords = 0,
    currentPage = 0,
    totalPages = 0,
    errorMessage = null,
    durationSeconds = 0,
  } = result;
  
  const percent = totalRecords > 0
    ? Math.min(100, Math.round((processedRecords / totalRecords) * 100))
    : 100;
  
  try {
    await query(
      `UPDATE sync_logs SET
        status = ?,
        records_fetched = ?,
        records_inserted = ?,
        records_updated = ?,
        records_failed = ?,
        total_records = ?,
        processed_records = ?,
        progress_percent = ?,
        current_page = ?,
        total_pages = ?,
        error_message = ?,
        completed_at = NOW(),
        duration_seconds = ?
      WHERE id = ?`,
      [
        status,
        fetchedRecords,
        insertedRecords,
        updatedRecords,
        failedRecords,
        totalRecords,
        processedRecords,
        percent,
        currentPage,
        totalPages,
        errorMessage,
        durationSeconds,
        logId,
      ]
    );
  } catch (error) {
    console.error('Failed to complete sync log:', error.message);
  }
}

