// Safe Query Helpers for LIMIT/OFFSET pagination
// Avoids SQL injection by using proper parameter binding

import { query } from "./db.js";

/**
 * Execute a query with safe LIMIT/OFFSET pagination
 * Uses prepared statements to prevent SQL injection
 * 
 * @param {string} baseQuery - SQL query with ? placeholders for params
 * @param {Array} params - Parameters for the query
 * @param {number} limit - Limit value (will be safely bound)
 * @param {number} offset - Offset value (will be safely bound)
 * @returns {Promise<Array>} Query results
 */
export async function queryWithPagination(baseQuery, params = [], limit, offset) {
  // Validate and convert limit and offset to integers
  let safeLimit, safeOffset;
  
  if (typeof limit === 'number') {
    safeLimit = Math.floor(limit);
  } else if (typeof limit === 'string') {
    safeLimit = parseInt(limit, 10);
  } else {
    safeLimit = parseInt(limit, 10);
  }
  
  if (typeof offset === 'number') {
    safeOffset = Math.floor(offset);
  } else if (typeof offset === 'string') {
    safeOffset = parseInt(offset, 10);
  } else {
    safeOffset = parseInt(offset, 10);
  }
  
  // Validate values
  if (isNaN(safeLimit) || safeLimit < 0 || !Number.isInteger(safeLimit)) {
    throw new Error(`Invalid limit value: ${limit} (converted to: ${safeLimit})`);
  }
  if (isNaN(safeOffset) || safeOffset < 0 || !Number.isInteger(safeOffset)) {
    throw new Error(`Invalid offset value: ${offset} (converted to: ${safeOffset})`);
  }
  
  // Ensure params is an array
  const safeParams = Array.isArray(params) ? params : [];
  
  // Add LIMIT and OFFSET as additional parameters (as integers)
  const finalQuery = `${baseQuery.trim()} LIMIT ? OFFSET ?`;
  const finalParams = [...safeParams, safeLimit, safeOffset];
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 queryWithPagination:', {
      query: finalQuery.substring(0, 100),
      paramsCount: finalParams.length,
      limit: safeLimit,
      offset: safeOffset,
      paramTypes: finalParams.map(p => typeof p)
    });
  }
  
  return await query(finalQuery, finalParams);
}

/**
 * Get count safely with prepared statements
 * 
 * @param {string} baseQuery - SQL query (will be converted to COUNT)
 * @param {Array} params - Parameters for the query
 * @returns {Promise<number>} Count result
 */
export async function getCount(baseQuery, params = []) {
  // Convert SELECT to COUNT
  let countQuery = baseQuery;
  
  // Remove SELECT ... FROM and replace with SELECT COUNT(*) as total FROM
  if (countQuery.includes('SELECT')) {
    const fromIndex = countQuery.toUpperCase().indexOf(' FROM ');
    if (fromIndex > 0) {
      const afterFrom = countQuery.substring(fromIndex + 6); // Skip " FROM "
      // Remove ORDER BY, GROUP BY, LIMIT, OFFSET from count query
      const cleanAfterFrom = afterFrom
        .replace(/\sORDER\s+BY\s+[^;]+/gi, '')
        .replace(/\sGROUP\s+BY\s+[^;]+/gi, '')
        .replace(/\sLIMIT\s+\d+/gi, '')
        .replace(/\sOFFSET\s+\d+/gi, '');
      
      countQuery = `SELECT COUNT(*) as total FROM ${cleanAfterFrom}`;
    }
  }
  
  const result = await query(countQuery, params);
  return result[0]?.total || 0;
}

/**
 * Build WHERE clause safely
 * 
 * @param {Object} filters - Object with field: value pairs
 * @param {Object} options - Options for building clause
 * @returns {Object} { whereClause: string, params: Array }
 */
export function buildWhereClause(filters, options = {}) {
  const conditions = [];
  const params = [];
  
  for (const [field, value] of Object.entries(filters)) {
    if (value === null || value === undefined || value === '') {
      continue;
    }
    
    const operator = options.operators?.[field] || '=';
    const useLike = options.useLike?.includes(field);
    
    if (useLike) {
      conditions.push(`${field} LIKE ?`);
      params.push(`%${value}%`);
    } else if (operator === 'IN') {
      if (Array.isArray(value) && value.length > 0) {
        const placeholders = value.map(() => '?').join(', ');
        conditions.push(`${field} IN (${placeholders})`);
        params.push(...value);
      }
    } else {
      conditions.push(`${field} ${operator} ?`);
      params.push(value);
    }
  }
  
  const whereClause = conditions.length > 0 
    ? `WHERE ${conditions.join(' AND ')}`
    : '';
  
  return { whereClause, params };
}

