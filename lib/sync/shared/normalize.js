/**
 * Shared normalization utilities for sync operations
 */

/**
 * Normalize prescriptions data from API format to structured format
 * @param {any} value - Raw prescription data from API
 * @returns {Array} Normalized prescription array
 */
export function normalizePrescriptions(value) {
  if (!value) return [];

  const result = [];

  const parseSegment = (segment, overrides = {}) => {
    const raw = (segment || "").trim();
    if (!raw) return null;

    let name = raw;
    let quantity = "";
    let unit = "";

    const parenMatch = raw.match(/\(([^)]+)\)\s*$/);
    if (parenMatch) {
      name = raw.slice(0, parenMatch.index).trim();
      const inner = parenMatch[1].trim();
      const tokens = inner.split(/\s+/).filter(Boolean);

      if (tokens.length >= 2) {
        const qtyIndex = tokens.findIndex(
          (token, idx) => /^\d+(\.\d+)?$/.test(token) && idx < tokens.length - 1
        );
        if (qtyIndex !== -1) {
          quantity = tokens[qtyIndex];
          unit = tokens.slice(qtyIndex + 1).join(" ") || "";
        } else if (/^\d+(\.\d+)?$/.test(tokens[tokens.length - 1])) {
          quantity = tokens[tokens.length - 1];
          unit = tokens.slice(0, tokens.length - 1).join(" ");
        } else {
          unit = tokens.join(" ");
        }
      } else if (tokens.length === 1) {
        if (/^\d+(\.\d+)?$/.test(tokens[0])) {
          quantity = tokens[0];
        } else {
          unit = tokens[0];
        }
      }
    }

    return {
      name: overrides.name || name || raw,
      quantity: overrides.quantity || quantity,
      unit: overrides.unit || unit,
      raw: overrides.raw || raw,
    };
  };

  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string") {
        const parsed = parseSegment(item);
        if (parsed) result.push(parsed);
      } else if (item && typeof item === "object") {
        const parsed = parseSegment(item.nama || item.name || item.raw || "", item);
        if (parsed) result.push(parsed);
      }
    }
  } else if (typeof value === "string") {
    const segments = value.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    for (const segment of segments) {
      const parsed = parseSegment(segment);
      if (parsed) result.push(parsed);
    }
  }

  return result;
}

/**
 * Normalize diagnosis data
 * @param {any} value - Raw diagnosis data
 * @returns {string} Normalized diagnosis string
 */
export function normalizeDiagnosis(value) {
  if (!value) return null;
  
  if (Array.isArray(value)) {
    return value.map(d => typeof d === 'string' ? d : d?.nama || d?.name || '').filter(Boolean).join(', ');
  }
  
  if (typeof value === 'string') {
    return value.trim() || null;
  }
  
  if (value && typeof value === 'object') {
    return value.nama || value.name || null;
  }
  
  return null;
}

