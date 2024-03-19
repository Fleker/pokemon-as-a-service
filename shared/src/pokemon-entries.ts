import { Badge } from "./badge3"
import {myPokemon} from './badge-inflate'
import { PokemonId } from "./pokemon/types"

function pkmnSort(p1: [Badge, number], p2: [Badge, number]) {
  const a = p1[0]
  const b = p2[0]
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
export function PokemonEntries(obj): [PokemonId, number][] {
  const sorted = [...myPokemon(obj)]
    .map(([key, val]) => [new Badge(key), val])
    .sort(pkmnSort) as [Badge, number][]
  console.debug(sorted[0][0], sorted[0][1])
  return sorted.map(([badge, val]) => [badge.toString(), val])
}