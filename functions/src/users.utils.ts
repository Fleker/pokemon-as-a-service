/* eslint-disable no-prototype-builtins */
import { Users } from "./db-types"
import { ITEMS, ItemId } from "../../shared/src/items-list"
import { PokemonId } from "../../shared/src/pokemon/types"
import { Badge, MATCH_GTS } from "../../shared/src/badge3"
import { myPokemon } from "../../shared/src/badge-inflate"
import structuredClone from '@ungap/structured-clone';

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
  const checked = new Map()
  let hasPkmn = false
  if (user.pokemon !== undefined) {
    hasPkmn = true
    const pmap = user.pokemon
    for (const p of pkmn) {
      if (p.startsWith('potw-')) {
        throw new Error('Nope. That is badge format is deprecated.')
      }
      const pbadge = new Badge(p)
      const [id, personality] = pbadge.fragments
      if (!checked.has(p)) checked.set(p, 0);
      const checkedCount = checked.get(p)!;
      if (pmap[id]?.[personality] !== undefined && pmap[id][personality] > checkedCount) {
        checked.set(p, checkedCount + 1);
      } else {
        return false // Bail
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
    const pmap = structuredClone(user.pokemon)
    let keys = [...myPokemon(pmap)].map(([k]) => k)
    for (const p of pkmn) {
      const matcher = Badge.match(p, keys, MATCH_GTS)
      if (matcher.match) {
        const pk = matcher.result!
        const pbadge = new Badge(pk)
        const [id, personality] = pbadge.fragments
        if (pmap[id]) {
          if (pmap[id][personality] !== undefined && pmap[id][personality]! > 0) {
            pmap[id][personality]!--
          } else {
            return false
          }
        } else {
          return false // Bail
        }
      } else {
        hasPkmn = false
      }
      keys = [...myPokemon(pmap)].map(([k]) => k)
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
  const [id, personality] = pkmn.fragments
  if (user.pokemon[id]) {
    if (user.pokemon[id][personality] !== undefined && user.pokemon[id][personality]! > 0) {
      user.pokemon[id][personality]! += count
    } else {
      user.pokemon[id][personality]! = count
    }
  } else {
    user.pokemon[id] = {
      [personality]: count
    }
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
  const [id, personality] = pkmn.fragments
  
  if (user.pokemon[id] === undefined) {
    throw new Error(`User ${user.ldap} does not have ${count} ${pkmn.toString()}`)
  }
  if (user.pokemon[id][personality] === undefined) {
    throw new Error(`User ${user.ldap} does not have ${count} ${pkmn.toString()}`)
  }
  if (user.pokemon[id][personality] < count) {
    throw new Error(`User ${user.ldap} does not have ${count} ${pkmn.toString()}`)
  }
  user.pokemon[id][personality]! -= count
  if (user.pokemon[id][personality] === 0) {
    delete user.pokemon[id][personality]
  }
  if (Object.keys(user.pokemon[id]).length === 0) {
    delete user.pokemon[id]
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
