/* eslint-disable no-prototype-builtins */
import { Users } from "./db-types"
import { ITEMS, ItemId } from "../../shared/src/items-list"
import { PokemonId } from "../../shared/src/pokemon/types"
import { Badge, MATCH_GTS } from "../../shared/src/badge3"

export const hasItem = (user: Users.Doc, item: ItemId, count = 1) => {
  if (!ITEMS.hasOwnProperty(item)) {
    return false
  }
  if (!user.items.hasOwnProperty(item)) {
    return false
  }
  const itemValue = user.items[item]
  if (!itemValue) {
    return false
  }
  if (isNaN(itemValue) || itemValue < count) {
    return false
  }
  return true
}

/**
 * Verifies the user in question has the Pokemon. If there is an array provided,
 * it will check against every single Pokemon without replacement.
 */
export const hasPokemon = (user: Users.Doc, fnPkmn: PokemonId | PokemonId[]) => {
  // Normalize to array
  const pkmn = Array.isArray(fnPkmn) ? fnPkmn : [fnPkmn]
  let hasPkmn = false
  if (user.pokemon !== undefined) {
    hasPkmn = true
    const pmap = {...user.pokemon}
    for (const p of pkmn) {
      if (pmap[p] !== undefined && pmap[p]! > 0) {
        pmap[p]!--
      } else {
        hasPkmn = false
      }
    }
  }
  return hasPkmn
}

/**
 * Verifies the user in question has the Pokemon or something similar.
 * If there is an array provided,
 * it will check against every single Pokemon without replacement.
 */
 export const hasPokemonFuzzy = (user: Users.Doc, fnPkmn: PokemonId | PokemonId[]) => {
  // Normalize to array
  const pkmn = Array.isArray(fnPkmn) ? fnPkmn : [fnPkmn]
  // Try mapping first
  let hasPkmn = false
  if (user.pokemon !== undefined) {
    hasPkmn = true
    const pmap = {...user.pokemon}
    let keys = Object.keys(pmap) as unknown as PokemonId[]
    for (const p of pkmn) {
      const matcher = Badge.match(p, keys, MATCH_GTS)
      if (matcher.match) {
        const pk = matcher.result!
        if (pmap[pk] !== undefined && pmap[pk]! > 1) {
          pmap[pk]!--
        } else if (pmap[pk] !== undefined && pmap[pk]! === 1) {
          delete pmap[pk]
        } else {
          hasPkmn = false
        }
      } else {
        hasPkmn = false
      }
      keys = Object.keys(pmap) as unknown as PokemonId[]
    }
  }
  return hasPkmn
}

/**
 * @deprecated use FieldValue.increment where possible
 */
export const awardItem = (user: Users.Doc, item: ItemId, count = 1) => {
  if (hasItem(user, item)) {
    user.items[item]! += count
  } else {
    user.items[item] = count
  }
}

/**
 * Inline addition of Pokemon from user's `pokemon` user doc.
 * @param user Database user object.
 * @param pkmn The Badge3 object to be added.
 * @param count The number of this Pokemon to add (default is 1).
 */
export const addPokemon = (user: Users.Doc, pkmn: Badge, count = 1) => {
  if (user.pokemon === undefined) {
    console.info('Creating user.pokemon map')
    user.pokemon = {}
  }
  const badge = pkmn.toString()
  if (user.pokemon[badge] !== undefined) {
    user.pokemon[badge]! += count
  } else {
    user.pokemon[badge] = count
  }
}

/**
 * Inline removal of Pokemon from user's `pokemon` or `currentBadges` user doc.
 * @param user Database user object.
 * @param pkmn The Badge3 object to be removed.
 * @param count The number of this Pokemon to remove (default is 1).
 */
export const removePokemon = (user: Users.Doc, pkmn: Badge, count = 1) => {
  if (user.pokemon === undefined) {
    console.info('Creating user.pokemon map')
    user.pokemon = {}
  }
  const badge = pkmn.toString()
  if (badge in user.pokemon && user.pokemon[badge]! >= count) {
    user.pokemon[badge]! -= count
    if (user.pokemon[badge]! === 0) {
      delete user.pokemon[badge]
    }
  } else if (user.currentBadges?.includes(pkmn.toLegacyString())) {
    const legacy = pkmn.toLegacyString()
    const howMany = user.currentBadges!.filter(x => x === legacy).length
    if (howMany < count) {
      throw new Error(`User ${user.ldap} does not have ${count} ${legacy}`)
    }
    for (let i = 0; i < count; i++) {
      // Prune each one
      const index = user.currentBadges!.indexOf(legacy)
      if (index !== -1) { // <- This should never happen
        user.currentBadges!.splice(index, 1)
      }
    }
  } else {
    throw new Error(`User ${user.ldap} does not have ${count} ${badge}`)
  }
}

export const calculateNetWorth = (user: Users.Doc) => {
  const {items} = user
  let netWorth = 0
  for (const [item, count] of Object.entries(items)) {
    if (!count) {
      continue
    }
    if (ITEMS[item] && !isNaN(count!)) {
      const itemEntry = ITEMS[item]
      netWorth += itemEntry.sell * (count as number)
    }
  }
  netWorth += items.pokeball || 0 // Add Poké Balls though they sell for 0
  netWorth += items.raidpass || 0 // Add Raid Passes though they sell for 0
  return netWorth
}
