/**
 * @fileoverview Handle management of Pokemon in a new map data structure.
 */
import { BadgeId, PokemonId } from "./pokemon/types";
import {Badge} from './badge3'

/**
 * The database representation for a Pokémon.
 * {
 *    "1": { // Bulbasaur <- base64 ID
 *        '1hw043': 1  // Personality and other items | count
 *    }
 * }
 */
// export type TPokemon = {[b in PokemonId]?: number}
export type TPokemon = Record<string, Record<string, number>>

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
  for (const [dexId, badgeIds] of Object.entries(pkmn)) {
    for (const [badgeId, count] of Object.entries(badgeIds)) {
      // If we let this go to its full value of `count`
      // the memory could be exceeded and result in a crash.
      // '3' works in the stress test.
      for (let i = 0; i < Math.min(count, 3); i++) {
        inflatedPkmn.push(`${dexId}#${badgeId}` as PokemonId)  
      }
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
    const parts = b.split('#')
    const id = parts[0]
    const metadata = parts.splice(0, 1).join('#')
    if (map[id]) {
      if (map[id][metadata]) map[id][metadata]++
      else map[id][metadata] = 1
    } else {
      map[id] = {
        [metadata]: 1
      }
    }
  })
  return map
}

/**
 * Generates an iterator for every Pokémon ID
 * @param pokemon Your nested collection of Pokémon
 * @param callback A function that runs on every reconstructed BadgeId
 * @returns If you want to exit the loop, return any value. Otherwise, this should be considered void.
 */
export function forEachBadgeId(pokemon: TPokemon, callback: ([BadgeId, number]) => unknown): unknown {
  for (const [dexId, badgeIds] of Object.entries(pokemon)) {
    for (const [badgeId, value] of Object.entries(badgeIds)) {
      const res = callback([`${dexId}#${badgeId}`, value])
      if (res !== undefined) {
        return res // Jump out of loops
      }
    }
  }
  return undefined
}

/**
 * Generates a custom iterator for reconstructed BadgeIDs and counts
 * @param pokemon Your nested database collection of Pokémon
 */
export function myPokemon(pokemon: TPokemon): IterableIterator<[PokemonId, number]> {
  const entries: [PokemonId, number][] = []
  for (const [dexId, badgeIds] of Object.entries(pokemon)) {
    for (const [badgeId, value] of Object.entries(badgeIds)) {
      entries.push([`${dexId}#${badgeId}` as PokemonId, value])
    }
  }
  
  return entries[Symbol.iterator]()
}

