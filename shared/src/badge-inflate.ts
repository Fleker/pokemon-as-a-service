/**
 * @fileoverview Handle management of Pokemon in a new map data structure.
 */
import { BadgeId, PokemonId } from "./pokemon/types";
import {Badge} from './badge3'

export type TPokemon = {[b in PokemonId]?: number}

export interface User {
  currentBadges?: BadgeId[]
  pokemon?: TPokemon
}

/**
 * Converts the new Pokemon collection map into a legacy-supported array of
 * Pokemon. This will be useful for more quickly supporting existing functions.
 * @param pkmn Map of Pokemon and their counts
 * @returns An array of your Pokemon badges, rolled out.
 * @deprecated Move to using pokemon map only
 */
 export function inflate(pkmn?: TPokemon): PokemonId[] | undefined {
  if (!pkmn) return undefined
  const inflatedPkmn: PokemonId[] = []
  for (const [badgeId, count] of Object.entries(pkmn)) {
    // If we let this go to its full value of `count`
    // the memory could be exceeded and result in a crash.
    // '3' works in the stress test.
    for (let i = 0; i < Math.min(count, 3); i++) {
      inflatedPkmn.push(badgeId as PokemonId)  
    }
  }
  return inflatedPkmn
}

/**
 * Obtains all user Pokemon in a single array regardless of field name.
 * @param user A User Doc object
 * @returns Merged array of badges in legacy format
 * @deprecated Move to using pokemon map only
 */
export function getAllPokemon(user: User, filter?: ((badge: PokemonId) => boolean)): BadgeId[] {
  const badges: BadgeId[] = []
  if ('currentBadges' in user) {
    badges.push(...user.currentBadges!)
  }
  if (user.pokemon) {
    let inflatedPkmn = inflate(user.pokemon)!
    if (filter) {
      inflatedPkmn = inflatedPkmn.filter(x => filter(x))
    }
    badges.push(...(inflatedPkmn.map(p => new Badge(p).toLegacyString())))
  }
  return badges
}

/**
 * Serializes array of badges to the new mappings
 * @param arr Array of legacy badge IDs
 * @param map Existing map to merge with, optional.
 * @returns Map of new format badges
 * @deprecated Move to using pokemon map only
 */
export function arrayToMap(arr: BadgeId[], map: TPokemon = {}): TPokemon {
  arr.forEach(p => {
    const b = Badge.fromLegacy(p).toString()
    if (map[b]) map[b]!++
    else map[b] = 1
  })
  return map
}

// export function getCount(map: TPokemon, predicate: (x: Badge) => boolean) {
//   let count = 0
//   for (const [key, value] of Object.entries(map)) {
//     const willAddCount = predicate(new Badge(key))
//     if (willAddCount) {
//       count += value
//     }
//   }
//   return count
// }
