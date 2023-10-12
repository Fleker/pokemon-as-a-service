import { Badge } from "./badge3"

function pkmnSort(a: Badge, b: Badge) {
  if (a.id < b.id) return -1
  if (a.id > b.id) return 1
  const aForm = a.personality.form || ''
  const bForm = b.personality.form || ''
  if (aForm < bForm) return -1
  if (aForm > bForm) return 1
  if (a.personality.variant  !== undefined || b.personality.variant !== undefined ) {
    if (!a.personality.variant && b.personality.variant) return -1
    if (a.personality.variant && !b.personality.variant) return 1
    if (a.personality.variant! > b.personality.variant!) return 1
    if (a.personality.variant! < b.personality.variant!) return -1
  }
  if (a.personality.gender < b.personality.gender) return -1
  if (a.personality.gender > b.personality.gender) return 1
  if (!a.personality.shiny && b.personality.shiny) return -1
  if (a.personality.shiny && !b.personality.shiny) return 1
  return 0
}

/**
 * Iterator for an Pokemon Map's entries but in the right order
 * @param obj Object in key-value pairs
 * @returns Entries in a sorted order
 */
 export function PokemonEntries(obj) {
  const sortedKeys = Object.keys(obj)
    .map(x => new Badge(x))
    .sort(pkmnSort)
    .map(badge => badge.toString())
  console.log(obj, sortedKeys[0], obj[sortedKeys[0]])
  return sortedKeys.map(key => [key, obj[key]])
}