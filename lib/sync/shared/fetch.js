/**
 * Shared fetch utilities with retry and timeout support
 */

/**
 * Fetch with retry logic and adaptive timeout
 * @param {string} url - URL to fetch
 * @param {object} options - Fetch options
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @param {number} timeoutMs - Timeout in milliseconds (default: 180000 = 3 minutes)
 * @returns {Promise<Response>} Fetch response
 */
export async function fetchWithRetry(url, options = {}, maxRetries = 3, timeoutMs = 180000) {
  for (let i = 0; i < maxRetries; i++) {
    // Adaptive timeout: increase timeout on retry
    const adaptiveTimeout = timeoutMs + (i * 60000); // Add 60s per retry attempt (increased for slow APIs)
    const controller = new AbortController();
    let timeoutId;
    
    try {
      console.log(`📡 Fetch attempt ${i + 1}/${maxRetries} (timeout: ${adaptiveTimeout}ms)...`);
      console.log(`   URL: ${url}`);
      
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          controller.abort();
          reject(new Error(`Request timeout after ${adaptiveTimeout}ms`));
        }, adaptiveTimeout);
      });
      
      // Create fetch promise with proper options for server-side
      const fetchOptions = {
        ...options,
        signal: controller.signal,
        // Disable Next.js cache for external API calls
        cache: 'no-store',
      };
      
      // Remove 'next' option if it exists (not valid for fetch)
      if (fetchOptions.next) {
        delete fetchOptions.next;
      }
      
      const fetchPromise = fetch(url, fetchOptions);
      
      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`✅ Fetch successful (status: ${response.status})`);
        return response;
      }
      
      // For non-OK responses, don't retry unless it's a server error (5xx)
      if (response.status >= 500 && i < maxRetries - 1) {
        console.warn(`⚠️  Server error ${response.status}, will retry...`);
        throw new Error(`HTTP ${response.status}`);
      }
      
      // For client errors (4xx), don't retry but log details
      if (response.status >= 400 && response.status < 500) {
        console.error(`❌ Client error ${response.status}: ${response.statusText}`);
        try {
          const errorText = await response.text();
          if (errorText) {
            console.error(`   Error body: ${errorText.substring(0, 200)}`);
          }
        } catch (e) {
          // Ignore
        }
      }
      
      // For client errors (4xx), don't retry
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle timeout error from Promise.race
      if (error.message && error.message.includes('timeout')) {
        const errorMsg = `Request timeout after ${adaptiveTimeout}ms`;
        if (i === maxRetries - 1) {
          throw new Error(`${errorMsg} (all ${maxRetries} attempts failed)`);
        }
        console.warn(`⚠️  ${errorMsg}, retrying with longer timeout... (${i + 1}/${maxRetries})`);
      } else if (error.name === 'AbortError' || error.message.includes('aborted')) {
        const errorMsg = `Request aborted after ${adaptiveTimeout}ms`;
        if (i === maxRetries - 1) {
          throw new Error(`${errorMsg} (all ${maxRetries} attempts failed)`);
        }
        console.warn(`⚠️  ${errorMsg}, retrying with longer timeout... (${i + 1}/${maxRetries})`);
      } else if (error.message && (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND'))) {
        // Network errors - don't retry, throw immediately
        throw new Error(`Network error: ${error.message}. Cannot reach API endpoint.`);
      } else {
        if (i === maxRetries - 1) {
          throw error;
        }
        console.warn(`⚠️  Fetch error: ${error.message}, retrying... (${i + 1}/${maxRetries})`);
      }
      
      // Exponential backoff with longer delays for timeout errors
      const baseDelay = error.name === 'AbortError' ? 10000 : 3000; // 10s for timeout, 3s for other errors
      const backoffDelay = Math.pow(2, i) * baseDelay;
      console.log(`⏸️  Waiting ${backoffDelay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
}

/**
 * Fetch JSON with retry
 * @param {string} url - URL to fetch
 * @param {object} options - Fetch options
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @param {number} timeoutMs - Timeout in milliseconds (default: 180000 = 3 minutes)
 * @returns {Promise<any>} Parsed JSON response
 */
export async function fetchJson(url, options = {}, maxRetries = 3, timeoutMs = 180000) {
  const response = await fetchWithRetry(url, options, maxRetries, timeoutMs);
  
  // Check if response is OK before parsing
  if (!response.ok) {
    // Try to get error message from response body
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorBody = await response.text();
      if (errorBody) {
        try {
          const errorJson = JSON.parse(errorBody);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          // If not JSON, use text as error message
          if (errorBody.length < 200) {
            errorMessage = `${errorMessage} - ${errorBody}`;
          }
        }
      }
    } catch (e) {
      // Ignore error reading response body
    }
    throw new Error(errorMessage);
  }
  
  // Try to parse JSON, with better error handling
  try {
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.warn(`⚠️  Response is not JSON. Content-Type: ${contentType}, First 200 chars: ${text.substring(0, 200)}`);
      // Try to parse as JSON anyway
      return JSON.parse(text);
    }
    return await response.json();
  } catch (parseError) {
    const text = await response.text();
    console.error(`❌ Failed to parse JSON response. First 500 chars: ${text.substring(0, 500)}`);
    throw new Error(`Failed to parse JSON response: ${parseError.message}`);
  }
}

