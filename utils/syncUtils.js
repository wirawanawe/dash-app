/**
 * Auto-sync utility for visits data
 * Handles automatic synchronization on:
 * - Browser refresh
 * - User login
 * - Page navigation
 */

const SYNC_ENDPOINTS = {
  visits: '/api/visits/sync',
};

const SYNC_STORAGE_KEY = 'last_sync_time';
const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Check if sync is needed based on last sync time
 */
export function shouldSync() {
  try {
    const lastSyncTime = localStorage.getItem(SYNC_STORAGE_KEY);
    if (!lastSyncTime) {
      return true;
    }
    
    const timeSinceLastSync = Date.now() - parseInt(lastSyncTime, 10);
    return timeSinceLastSync >= SYNC_INTERVAL;
  } catch (error) {
    console.error('Error checking sync status:', error);
    return false;
  }
}

/**
 * Update last sync time in localStorage
 */
export function updateLastSyncTime() {
  try {
    localStorage.setItem(SYNC_STORAGE_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error updating last sync time:', error);
  }
}

/**
 * Trigger sync for visits data
 * @param {boolean} silent - If true, won't show notifications
 * @returns {Promise<Object>} Sync result
 */
export async function syncVisits(silent = true) {
  try {
    // Check if sync is needed
    if (!shouldSync()) {
      if (!silent) {
        console.log('Sync skipped: Not enough time since last sync');
      }
      return { 
        success: true, 
        skipped: true, 
        message: 'Sync not needed yet' 
      };
    }

    if (!silent) {
      console.log('Starting visits sync (async mode - CPU friendly)...');
    }

    // Use async endpoint to prevent CPU overload
    const response = await fetch(`${SYNC_ENDPOINTS.visits}-async?mode=incremental`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Sync failed');
    }

    // Update last sync time
    updateLastSyncTime();

    if (!silent) {
      console.log('Sync completed:', data);
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Sync error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Trigger sync on page load/refresh
 * This is called when the page is loaded or refreshed
 * DISABLED to prevent CPU overload - use manual sync instead
 */
export function syncOnPageLoad() {
  // DISABLED: Auto-sync can cause high CPU usage
  // Users should manually trigger sync via UI button
  console.log('⚠️  Auto-sync on page load is disabled (use manual sync button)');
  return;
  
  // Original code commented out:
  // setTimeout(() => {
  //   syncVisits(true).then(result => {
  //     if (result.success && !result.skipped) {
  //       console.log('✅ Background sync completed on page load');
  //     }
  //   });
  // }, 2000);
}

/**
 * Trigger sync on login
 * This is called when a user successfully logs in
 * DISABLED to prevent CPU overload - use manual sync instead
 */
export function syncOnLogin() {
  // DISABLED: Auto-sync on login can cause high CPU usage
  // Users should manually trigger sync if needed
  console.log('⚠️  Auto-sync on login is disabled (use manual sync button)');
  return;
  
  // Original code commented out:
  // localStorage.removeItem(SYNC_STORAGE_KEY);
  // setTimeout(() => {
  //   syncVisits(false).then(result => {
  //     if (result.success) {
  //       console.log('✅ Sync completed after login');
  //     }
  //   });
  // }, 1000);
}

/**
 * Trigger sync on page navigation
 * This is called when user navigates between pages
 * NOTE: Disabled to prevent high CPU usage
 */
export function syncOnNavigation() {
  // Disabled: Navigation sync was causing high CPU usage
  // Background sync on page load is sufficient
  return;
  
  // Use setTimeout to avoid blocking navigation
  // setTimeout(() => {
  //   syncVisits(true).then(result => {
  //     if (result.success && !result.skipped) {
  //       console.log('✅ Background sync completed on navigation');
  //     }
  //   });
  // }, 1000); // Wait 1 second after navigation
}

/**
 * Get last sync info
 */
export function getLastSyncInfo() {
  try {
    const lastSyncTime = localStorage.getItem(SYNC_STORAGE_KEY);
    if (!lastSyncTime) {
      return {
        hasSynced: false,
        lastSyncTime: null,
        timeSinceLastSync: null,
      };
    }
    
    const timestamp = parseInt(lastSyncTime, 10);
    const timeSinceLastSync = Date.now() - timestamp;
    
    return {
      hasSynced: true,
      lastSyncTime: new Date(timestamp),
      timeSinceLastSync,
      nextSyncIn: Math.max(0, SYNC_INTERVAL - timeSinceLastSync),
    };
  } catch (error) {
    console.error('Error getting sync info:', error);
    return {
      hasSynced: false,
      lastSyncTime: null,
      timeSinceLastSync: null,
      error: error.message,
    };
  }
}

