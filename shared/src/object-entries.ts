/**
 * Iterator for an Object's entries but in the right order
 * @param obj Object in key-value pairs
 * @returns Entries in a sorted order
 */
 export function ObjectEntries(obj) {
  const sortedKeys = Object.keys(obj).sort()
  return sortedKeys.map(key => [key, obj[key]])
}