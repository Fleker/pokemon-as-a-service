import { Badge, MATCH_EXACT } from '../../shared/src/badge3'
import { Potw } from '../../shared/src/badge2'
import * as P from '../../shared/src/gen/type-pokemon'
import { Users } from "./db-types"
import { ItemId } from '../../shared/src/items-list'
import { hasItem, awardItem, hasPokemon, removePokemon, addPokemon } from "./users.utils"
import { BadgeId, PokemonId } from '../../shared/src/pokemon/types';

export type ItemBasedFunction = (item?: ItemId) => string

export interface TradeEvolution {
  badge: BadgeId | ItemBasedFunction,
  name1: string,
  name2: string | ItemBasedFunction,
  consumesItem: boolean,
  valid: (item: ItemId, otherSpecies: PokemonId) => boolean
}

export interface TradeEvolutionMap {
  [key: string]: TradeEvolution
}

// Check no-op
export const validNoOps = [
  P.Unown,
  P.Machoke,
  P.Haunter,
  P.Graveler,
  P.Kadabra,
  P.Poliwhirl,
  P.Slowpoke,
  P.Scyther,
  P.Onix,
  P.Seadra,
  P.Porygon,
  P.Clamperl,
  P.Gurdurr,
  P.Boldore,
  P.Shelmet,
  P.Karrablast,
  P.Phantump,
  P.Pumpkaboo,
  P.Swirlix,
  P.Spritzee,
]

export const tradeEvolutionsMap: TradeEvolutionMap = {
  [P.Poliwhirl]: {
    badge: P.Politoed,
    name1: 'Poliwhirl',
    name2: 'Politoed',
    consumesItem: true,
    valid: (item) => {return item === 'kingsrock'}
  },
  [P.Kadabra]: {
    badge: P.Alakazam,
    name1: 'Kadabra',
    name2: 'Alakazam',
    valid: (item) => {return item !== 'everstone'},
    consumesItem: false,
  },
  [P.Machoke]: {
    badge: P.Machamp,
    name1: 'Machoke',
    name2: 'Machamp',
    valid: (item) => {return item !== 'everstone'},
    consumesItem: false,
  },
  [P.Graveler]: {
    badge: P.Golem,
    name1: 'Graveler',
    name2: 'Golem',
    valid: (item) => {return item !== 'everstone'},
    consumesItem: false,
  },
  [P.Slowpoke]: {
    badge: P.Slowking,
    name1: 'Slowpoke',
    name2: 'Slowking',
    consumesItem: true,
    valid: (item) => {return item === 'kingsrock'}
  },
  [P.Haunter]: {
    badge: P.Gengar,
    name1: 'Haunter',
    name2: 'Gengar',
    valid: (item) => {return item !== 'everstone'},
    consumesItem: false,
  },
  [P.Onix]: {
    badge: P.Steelix,
    name1: 'Onix',
    name2: 'Steelix',
    consumesItem: true,
    valid: (item) => {return item === 'metalcoat'}
  },
  [P.Rhydon]: {
    badge: P.Rhyperior,
    name1: 'Rhydon',
    name2: 'Rhyperior',
    consumesItem: true,
    valid: (item) => {return item === 'protector'},
  },
  [P.Seadra]: {
    badge: P.Kingdra,
    name1: 'Seadra',
    name2: 'Kingdra',
    consumesItem: true,
    valid: (item) => {return item === 'dragonscale'}
  },
  [P.Scyther]: {
    badge: P.Scizor,
    name1: 'Scyther',
    name2: 'Scizor',
    consumesItem: true,
    valid: (item) => {return item === 'metalcoat'}
  },
  [P.Electabuzz]: {
    badge: P.Electivire,
    name1: 'Electabuzz',
    name2: 'Electivire',
    consumesItem: true,
    valid: (item) => {return item === 'electirizer'}
  },
  [P.Magmar]: {
    badge: P.Magmortar,
    name1: 'Magmar',
    name2: 'Magmortar',
    consumesItem: true,
    valid: (item) => {return item === 'magmarizer'}
  },
  [P.Porygon]: {
    badge: P.Porygon2,
    name1: 'Porygon',
    name2: 'Porygon2',
    consumesItem: true,
    valid: (item) => {return item === 'upgrade'}
  },
  [Potw(P.Porygon, {form: 'brin'})]: {
    badge: Potw(P.Porygon2, {form: 'brin'}),
    name1: 'Porygon',
    name2: 'Porygon2',
    consumesItem: true,
    valid: (item) => {return item === 'upgrade'}
  },
  [Potw(P.Porygon, {form: 'page'})]: {
    badge: Potw(P.Porygon2, {form: 'page'}),
    name1: 'Porygon',
    name2: 'Porygon2',
    consumesItem: true,
    valid: (item) => {return item === 'upgrade'}
  },
  [P.Porygon2]: {
    badge: P.Porygon_Z,
    name1: 'Porygon2',
    name2: 'Porygon-Z',
    consumesItem: true,
    valid: (item) => {return item === 'dubiousdisc'}
  },
  [P.Clamperl]: {
    badge: (item) => {
      if (item === 'deepseatooth') {
        return P.Huntail
      }
      return P.Gorebyss
    },
    name1: 'Clamperl',
    name2: (item) => {
      if (item === 'deepseatooth') {
        return 'Huntail'
      }
      return 'Gorebyss'
    },
    consumesItem: true,
    valid: (item) => {
      return item === 'deepseatooth' || item === 'deepseascale'
    }
  },
  [P.Dusclops]: {
    badge: P.Dusknoir,
    name1: 'Dusclops',
    name2: 'Dusknoir',
    consumesItem: true,
    valid: (item) => item === 'reapercloth',
  },
  [P.Boldore]: {
    badge: P.Gigalith,
    name1: 'Boldore',
    name2: 'Gigalith',
    consumesItem: false,
    valid: () => true
  },
  [P.Gurdurr]: {
    badge: P.Conkeldurr,
    name1: 'Gurdurr',
    name2: 'Conkeldurr',
    consumesItem: false,
    valid: () => true
  },
  [P.Shelmet]: {
    badge: P.Accelgor,
    name1: 'Shelmet',
    name2: 'Accelgor',
    consumesItem: false,
    valid: (_, other) => new Badge(other).toSimple() === P.Karrablast
  },
  [P.Karrablast]: {
    badge: P.Escavalier,
    name1: 'Karrablast',
    name2: 'Escavalier',
    consumesItem: false,
    valid: (_, other) => new Badge(other).toSimple() === P.Shelmet
  },
  [P.Phantump]: {
    badge: P.Trevenant,
    name1: 'Phantump',
    name2: 'Trevenant',
    consumesItem: false,
    valid: () => true
  },
  [P.Pumpkaboo]: {
    badge: P.Gourgeist,
    name1: 'Pumpkaboo',
    name2: 'Gourgeist',
    consumesItem: false,
    valid: () => true
  },
  [Potw(P.Pumpkaboo, {form: 'small'})]: {
    badge: Potw(P.Gourgeist, {form: 'small'}),
    name1: 'Pumpkaboo',
    name2: 'Gourgeist',
    consumesItem: false,
    valid: () => true
  },
  [Potw(P.Pumpkaboo, {form: 'average'})]: {
    badge: Potw(P.Gourgeist, {form: 'average'}),
    name1: 'Pumpkaboo',
    name2: 'Gourgeist',
    consumesItem: false,
    valid: () => true
  },
  [Potw(P.Pumpkaboo, {form: 'large'})]: {
    badge: Potw(P.Gourgeist, {form: 'large'}),
    name1: 'Pumpkaboo',
    name2: 'Gourgeist',
    consumesItem: false,
    valid: () => true
  },
  [Potw(P.Pumpkaboo, {form: 'super'})]: {
    badge: Potw(P.Gourgeist, {form: 'super'}),
    name1: 'Pumpkaboo',
    name2: 'Gourgeist',
    consumesItem: false,
    valid: () => true
  },
  [P.Spritzee]: {
    badge: P.Aromatisse,
    name1: 'Spritzee',
    name2: 'Aromatisse',
    consumesItem: true,
    valid: (item) => item === 'sachet',
  },
  [P.Swirlix]: {
    badge: P.Slurpuff,
    name1: 'Swirlix',
    name2: 'Slurpuff',
    consumesItem: true,
    valid: (item) => item === 'whippeddream',
  }
}

// Abstract away trade evolution management
export const tradeEvolution = (pkmn: BadgeId, item: ItemId = 'oran', other: BadgeId) => {
  const badge = Badge.fromLegacy(pkmn).toSimple()
  const details = tradeEvolutionsMap[badge]
  if (details && details.valid(item, Badge.fromLegacy(other).toString())) {
    const badge = (() => {
      if (typeof details.badge === 'string') {
        return Badge.fromLegacy(details.badge)
      }
      return Badge.fromLegacy(details.badge(item))
    })()
    const name2 = (() => {
      if (typeof details.name2 === 'string') {
        return details.name2
      }
      return details.name2(item)
    })()
    return {
      badgeId: badge.id,
      name1: details.name1,
      name2,
      consumesItem: details.consumesItem
    }
  }
  return undefined
}

export const trainerVerify = (user: Users.Doc, species: PokemonId, item?: ItemId) => {
  const b3Pokemon = Object.keys(user.pokemon) as PokemonId[]
  const searchBadge = new Badge(species)
  if (!Badge.match(searchBadge.toString(), b3Pokemon, MATCH_EXACT).match) {
    throw new Error(`[G-M] Trainer ${user.ldap} does not have exact Pokémon ${searchBadge.toSimple()}/${species}`)
  }
  if (item !== undefined && item !== null) {
    if (!hasItem(user, item)) {
      throw new Error(`Trainer does not have hold item ${item}`)
    }
  }
  return true
}

/**
 * Creates an in-memory data send b/w two accounts
 * @param origin The user doc for who initiated the swap
 * @param destination The user doc accepting the swap, the recipient
 * @param destinationId Recipient user id
 * @param badge The Pokemon being sent
 * @param item Optional item being sent along with Pokemon
 * @param otherBadge Pokemon being traded with this one, used for Shelmet/Karrablast.
 * @returns An object including an ItemEntry
 */
export const swap = (origin: Users.Doc, destination: Users.Doc, destinationId: string, badge: PokemonId, item: ItemId | null, otherBadge: PokemonId | null) => {
  if (!hasPokemon(origin, badge)) {
    throw new Error(`Origin does not have Pokémon ${badge}: -1`)
  }
  return swapNoCheck(origin, destination, destinationId, badge, item, otherBadge)
}

/**
 * Creates an in-memory data send b/w two accounts without checking if they have Pokémon
 * @param origin The user doc for who initiated the swap
 * @param destination The user doc accepting the swap, the recipient
 * @param destinationId Recipient user id
 * @param badge The Pokemon being sent
 * @param item Optional item being sent along with Pokemon
 * @param otherBadge Pokemon being traded with this one, used for Shelmet/Karrablast.
 * @returns An object including an ItemEntry
 */
export const swapNoCheck = (origin: Users.Doc, destination: Users.Doc, destinationId: string, badge: PokemonId, item: ItemId | null, otherBadge: PokemonId | null) => {
  let html = ''
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let itemEntry: any = undefined

  const swapBadge = new Badge(badge)
  const otherSwapBadge = new Badge(otherBadge!)
  removePokemon(origin, swapBadge)
  const tradeEffects = tradeEvolution(
    swapBadge.toLegacyString(),
    item ? item : undefined,
    otherSwapBadge.toLegacyString()!
  )
  if (tradeEffects) {
    swapBadge.id = tradeEffects.badgeId
    addPokemon(destination, swapBadge)
    html += `Instead of receiving ${tradeEffects.name1}, a ${tradeEffects.name2} arrived. `

    itemEntry = {
      item: tradeEffects.consumesItem ? item : 'Link Cable',
      userId: destinationId,
      target: badge,
      timestamp: Date.now(),
    }

    if (tradeEffects.consumesItem) {
      origin.items[item!]!--
    }
  } else {
    addPokemon(destination, swapBadge)
  }

  if (item !== undefined && item !== null) {
    if (!hasItem(origin, item) && !tradeEffects!.consumesItem) {
      throw new Error(`Origin does not have item ${item}`)
    }
    if (!tradeEffects?.consumesItem) {
      // html += `You receive one ${item} as an extra gift. `
      // Grant item to `destination`
      awardItem(destination, item)
      origin.items[item]!--
    }
  }

  return {
    html,
    itemEntry,
  }
}
