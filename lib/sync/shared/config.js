/**
 * Shared configuration for sync operations
 */

/**
 * Default sync configuration presets
 */
export const SYNC_CONFIGS = {
  incremental: {
    recordsPerPage: 150,
    maxPages: 10,
    maxRecords: 1000,
    delayBetweenPages: 1000,
    delayBetweenBatches: 1000,
    batchSize: 30,
    concurrentPages: 1,
    timeout: 30000,
    maxRetries: 2,
  },
  full: {
    recordsPerPage: 400,
    maxPages: 9999,
    maxRecords: Number.MAX_SAFE_INTEGER,
    delayBetweenPages: 200,
    delayBetweenBatches: 200,
    batchSize: 60,
    concurrentPages: 2,
    timeout: 180000,
    maxRetries: 3,
  },
  aggressive: {
    recordsPerPage: 5000,
    maxPages: 9999,
    maxRecords: Number.MAX_SAFE_INTEGER,
    delayBetweenPages: 100,
    delayBetweenBatches: 100,
    batchSize: 200,
    concurrentPages: 3,
    timeout: 180000,
    maxRetries: 3,
  },
  catchup: {
    recordsPerPage: 100,
    maxPages: 9999,
    maxRecords: Number.MAX_SAFE_INTEGER,
    delayBetweenPages: 5000,
    delayPerRecord: 50,
    timeout: 30000,
    maxRetries: 2,
  },
  staging: {
    recordsPerPage: 100, // Reduced from 200 to reduce database load
    maxPages: 9999,
    delayBetweenPages: 3000, // Increased from 2000 to 3000ms (3 seconds)
    transformBatchSize: 50, // Reduced from 100 to reduce CPU load
    timeout: 180000, // 3 minutes timeout untuk API calls (increased to prevent timeouts)
    maxRetries: 3, // Increase retries untuk reliability
  },
};

/**
 * Merge user options with default config
 * @param {string} mode - Sync mode
 * @param {object} userOptions - User-provided options
 * @returns {object} Merged configuration
 */
export function getSyncConfig(mode = 'incremental', userOptions = {}) {
  const baseConfig = SYNC_CONFIGS[mode] || SYNC_CONFIGS.incremental;
  return {
    ...baseConfig,
    ...userOptions,
  };
}

/**
 * Validate sync configuration
 * @param {object} config - Configuration to validate
 * @returns {object} Validated configuration
 */
export function validateConfig(config) {
  return {
    recordsPerPage: Math.max(1, Math.min(10000, config.recordsPerPage || 150)),
    maxPages: Math.max(1, config.maxPages || 9999),
    maxRecords: config.maxRecords || Number.MAX_SAFE_INTEGER,
    delayBetweenPages: Math.max(0, config.delayBetweenPages || 1000),
    delayBetweenBatches: Math.max(0, config.delayBetweenBatches || 1000),
    batchSize: Math.max(1, Math.min(1000, config.batchSize || 30)),
    concurrentPages: Math.max(1, Math.min(10, config.concurrentPages || 1)),
    timeout: Math.max(1000, config.timeout || 30000),
    maxRetries: Math.max(0, Math.min(10, config.maxRetries || 2)),
  };
}

