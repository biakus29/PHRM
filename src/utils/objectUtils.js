// src/utils/objectUtils.js
// Utility helpers for generic object/array operations

/**
 * Recursively removes keys with undefined values from objects/arrays.
 * Preserves null, false, 0, and empty strings.
 */
export function removeUndefined(obj) {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  } else if (obj && typeof obj === 'object') {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = removeUndefined(value);
      }
      return acc;
    }, {});
  }
  return obj;
}
