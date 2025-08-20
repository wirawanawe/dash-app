/**
 * Utility functions for automatic data refresh after CRUD operations
 */

/**
 * Wraps a CRUD operation with automatic data refresh
 * @param {Function} operation - The CRUD operation to perform (POST, PUT, DELETE)
 * @param {Function} refreshFunction - The function to call to refresh data
 * @param {Object} options - Additional options
 * @param {number} options.delay - Delay before refresh in milliseconds (default: 300)
 * @param {boolean} options.showLoading - Whether to show loading state during refresh
 * @param {Function} options.setLoading - Function to set loading state
 * @returns {Promise} - Promise that resolves when operation and refresh are complete
 */
export const withAutoRefresh = async (operation, refreshFunction, options = {}) => {
  const { delay = 300, showLoading = false, setLoading } = options;
  
  try {
    // Perform the CRUD operation
    const result = await operation();
    
    // Show loading state if requested
    if (showLoading && setLoading) {
      setLoading(true);
    }
    
    // Wait for a short delay to ensure server has processed the update
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Refresh the data
    await refreshFunction();
    
    return result;
  } catch (error) {
    console.error('Error in withAutoRefresh:', error);
    throw error;
  } finally {
    // Clear loading state if it was set
    if (showLoading && setLoading) {
      setLoading(false);
    }
  }
};

/**
 * Creates a refresh function with cache busting
 * @param {Function} fetchFunction - The original fetch function
 * @param {boolean} forceRefresh - Whether to force refresh with cache busting
 * @returns {Function} - Enhanced fetch function with cache busting
 */
export const createRefreshFunction = (fetchFunction, forceRefresh = true) => {
  return async (...args) => {
    if (forceRefresh) {
      // Add cache busting parameter to the fetch function
      const timestamp = Date.now();
      return await fetchFunction(...args, timestamp);
    }
    return await fetchFunction(...args);
  };
};

/**
 * Standard delay times for different operations
 */
export const REFRESH_DELAYS = {
  POST: 300,    // 300ms for create operations
  PUT: 300,     // 300ms for update operations  
  DELETE: 200,  // 200ms for delete operations (faster since data is removed)
  BATCH: 500    // 500ms for batch operations
};

/**
 * Enhanced fetch function with automatic retry and error handling
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} retries - Number of retries (default: 2)
 * @returns {Promise} - Fetch response
 */
export const fetchWithRetry = async (url, options = {}, retries = 2) => {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`Fetch failed, retrying... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
};

/**
 * Creates a standardized CRUD operation with auto-refresh
 * @param {string} method - HTTP method (POST, PUT, DELETE)
 * @param {string} url - API endpoint URL
 * @param {Object} data - Request body data
 * @param {Function} refreshFunction - Function to refresh data
 * @param {Object} options - Additional options
 * @returns {Promise} - Promise that resolves when operation and refresh are complete
 */
export const createCrudOperation = (method, url, data, refreshFunction, options = {}) => {
  const operation = async () => {
    const response = await fetchWithRetry(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  };

  const delay = REFRESH_DELAYS[method] || REFRESH_DELAYS.POST;
  
  return withAutoRefresh(operation, refreshFunction, {
    delay,
    showLoading: options.showLoading,
    setLoading: options.setLoading
  });
};
