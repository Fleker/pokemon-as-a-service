import { Badge } from "../../shared/src/badge3"
import { DbRaid, Users } from './db-types'
import { isQuestComplete } from "../../shared/src/quests"
import { ItemId, ITEMS } from "../../shared/src/items-list"
import { calculateNetWorth, hasItem, hasPokemonFuzzy } from "./users.utils"
import { standardBosses } from "../../shared/src/raid-bosses"
import { getLocation } from "./location"
import { toRequirements } from "./users"
import { PokemonId } from "../../shared/src/pokemon/types"
import { raidBattleSettings as sharedSettings, SharedRaidSetting } from "../../shared/src/raid-settings"
import { get } from "../../shared/src/pokemon"

// STATES
export const CREATED = 0
export const COMPLETED = 1
export const IN_PROGRESS = 2
export const EXPIRED = 3
/**
 * Battle finished, but before submitting full results
 */
export const NEARLY_COMPLETED = 4

export interface RaidBattleSetting extends SharedRaidSetting {
  /**
   * Custom messages to give when the boss drops below a certain percentage at the end of a turn
   */
  pctLogs: Array<[number, string]>
  /**
   * If true, players must manually claim prizes after raid.
   */
  mandateClaim: boolean
}

export const raidBattleSettings: RaidBattleSetting[] = [
  // 0-Star. Not used.
  {
    ...sharedSettings[0],
    pctLogs: [],
    mandateClaim: false,
  },
  // 1-Star
  {
    ...sharedSettings[1],
    pctLogs: [
      [0.5, 'The opponent is growing frustrated!'],
    ],
    mandateClaim: false,
  },
  // 2-Star
  {
    ...sharedSettings[2],
    pctLogs: [
      [0.25, 'The opponent is looking tired. It is acting more aggressively!']
    ],
    mandateClaim: false,
  },
  // 3-Star
  {
    ...sharedSettings[3],
    pctLogs: [
      [0.5, 'The opponent is looking tired. It is acting more aggressively!']
    ],
    mandateClaim: false,
  },
  // 4-Star
  {
    ...sharedSettings[4],
    pctLogs: [
      [0.5, 'The opponent is looking tired. It is acting more aggressively!']
    ],
    mandateClaim: false,
  },
  // 5-Star
  {
    ...sharedSettings[5],
    pctLogs: [
      [0.5, 'The opponent is looking tired. It is acting more defensively!'],
      [0.33, 'The opponent is looking exhausted. It is acting more aggressively!'],
    ],
    mandateClaim: true,
  },
  // 6-Star
  {
    ...sharedSettings[6],
    pctLogs: [
      [0.5, 'The opponent is looking tired. It is acting more defensively!'],
      [0.15, 'The opponent is looking exhausted. It is acting more aggressively!'],
    ],
    mandateClaim: true,
  },
  // 7-Star (Tiny Raids)
  {
    ...sharedSettings[7],
    pctLogs: [
      [0.5, 'The opponent is looking tired. It is acting more defensively!'],
    ],
    mandateClaim: true,
  },
  // 8-Star (Expert Raids)
  {
    ...sharedSettings[8],
    pctLogs: [
      [0.5, 'The opponent is looking tired. It is acting more aggressively!'],
    ],
    mandateClaim: true,
  },
  // 9-Star (Grand Underground Raids)
  {
    ...sharedSettings[9],
    pctLogs: [
      [0.67, 'The opponent is looking endangered. It is acting more aggressively!'],
      [0.1, 'The opponent is looking extinct. It is acting more assertive!'],
    ],
    mandateClaim: true,
  },
  // 10-Star (Legendary Raids)
  {
    ...sharedSettings[10],
    pctLogs: [
      [0.5, 'The opponent is growing tired but not finished. It is acting more aggressively!'],
      [0.33, 'The opponent has become enraged. It is acting more assertive!'],
    ],
    mandateClaim: true,
  },
  // 11-Star (Voyage Raids)
  {
    ...sharedSettings[11],
    pctLogs: [
      [0.5, 'The opponent is growing tired but not finished. It is acting more aggressively!'],
      [0.33, 'The opponent has become enraged. It is acting more assertive!'],
    ],
    mandateClaim: true,
  },
]

export const violatesSpeciesClause = (raid: DbRaid, userId: string, pkmn: PokemonId) => {
  const suggested = new Badge(pkmn);
  const { id } = suggested
  let seen = false;
  for (const [uid, player] of Object.entries(raid.players??{})) {
    if (userId === uid) continue;
    const badge = player.species.startsWith('potw-') 
                ? Badge.fromLegacy(player.species)
                : new Badge(player.species)
    if (badge.id !== id) continue;
    if (seen || badge.personality.shiny === suggested.personality.shiny) {
      return true;
    }
    seen = true;
  }
  return false;
}

/**
 * Set the room size as a function of rating.
 */
export const violatesRoomSize = (raid: DbRaid, userId: string) => {
  const raidPlus2 = (raid.timestamp as FirebaseFirestore.Timestamp).toMillis() + 1000 * 60 * 60 * 24 * 2
  if (raid.host === userId) return false
  if (raid.players === undefined) return false
  if (raid.players[userId] !== undefined) return false
  const roomSize = (() => {
    if (raid.playerList.includes(raid.host)) {
      // Enable last slot
      return raidBattleSettings[raid.rating].maxMembers
    } else if (Date.now() > raidPlus2) {
      // Host has relinquished their slot
      return raidBattleSettings[raid.rating].maxMembers
    } else {
      // Prevent taking of last slot
      return raidBattleSettings[raid.rating].maxMembers - 1
    }
  })()
  if (raid.playerList.length >= roomSize) return true
  return false
}

export const getPityCount = (user: Users.Doc) => {
  const bossLength = 10 // Hardcode for now
  const wealth = calculateNetWorth(user)
  const threshold = Math.floor(bossLength * (1 + Math.max(0, Math.log10(1 + wealth) - 3)))
  return Math.min(threshold, 30) // No more than 30 wishing pieces
}

/**
 * Asserts all properties of a raid within a DB transaction or throws
 * @param raid The raid the user is trying to join
 * @param user The user who is trying to join the raid
 */
export async function raidSelectPreconditionCheck(raid: DbRaid, user: Users.Doc, userId: string, species: PokemonId | 'null' | 'first', item?: ItemId) {
  const raidPrice = raidBattleSettings[raid.rating].cost

  const conditionalBosses = {}
  if (standardBosses[raid.rating]) {
    for (const boss of standardBosses[raid.rating]) {
      if (boss.condition) {
        conditionalBosses[boss.species] = boss.condition
      }
    }
  }

  if (raid.state != CREATED) {
    throw new Error('Cannot join this raid')
  }

  const timestamp = raid.timestamp as FirebaseFirestore.Timestamp
  if (timestamp.toMillis !== undefined) {
    if (timestamp.toMillis() < Date.now() - raidBattleSettings[raid.rating].expires) {
      // await doc.ref.update({ state: EXPIRED })
      throw new Error('This raid has expired')
    }
  } // Else this object is actually not a Firestore Timestamp

  if (species !== 'null' && conditionalBosses[raid.boss]) {
    // Check eligibility
    const location = await getLocation(raid.location)
    const questArgs = toRequirements(user, location)
    const conditionalErr = isQuestComplete(conditionalBosses[raid.boss], questArgs)
    if (conditionalErr !== true && raid.rating !== 10) {
      // For Legendary Raids, allow eligible players to join
      throw new Error(`Not eligible to join this raid: ${conditionalErr}`)
    }
  }

  if (species === 'null' /* && userId !== raid.host */) {
    if (raid.players![userId] === undefined || !raid.playerList.includes(userId)) {
      throw new Error('You are not in this raid. Sorry.')
    }
  }

  if (species === 'null') {
    return {state: 'LEAVE', raidPrice}
  }

  if (violatesRoomSize(raid, userId)) {
    throw new Error(`Precheck: The raid cannot handle any more players`)
  }

  if (userId !== raid.host && !(userId in raid.players!)) {
    const {items} = user
    if ('raidpass' in items && items.raidpass! < raidPrice) {
      throw new Error(`Precheck - You do not have the necessary ${raidPrice} number of raid passes`)
    }
  }

  const speciesToJoin: PokemonId = (() => {
    if (species === 'first') {
      // Select a canonically-valid pkmn
      let filterBadges = Object.keys(user.pokemon)
        .filter(b => {
          const badge = new Badge(b)
          return badge.toString() === b && !violatesSpeciesClause(raid, userId, b)
        }) as PokemonId[]

      if (raid.rating === 7) {
        filterBadges = filterBadges.filter(
          b => get(new Badge(b).toLegacyString())?.tiers?.includes('Tiny Cup')
        )
      }
      if (!filterBadges.length) {
        throw new Error('You have no smol Pokémon.')
      }

      // Join raid quickly
      const buddy = (() => {
        for (const b of filterBadges) {
          const badge = new Badge(b)
          if (badge.defaultTags?.includes('BUDDY')) {
            return b
          }
        }
        return undefined
      })()

      if (buddy && filterBadges.includes(buddy)) return buddy
      return new Badge(filterBadges[0]).toString() // Convert to canonical string
    } else {
      // User selected a real Pokémon, do checks
      if (!hasPokemonFuzzy(user, species)) {
        throw new Error(`You do not have that Pokémon ${species}`)
      }

      if (raid.rating === 7 &&
          !get(new Badge(species).toLegacyString())?.tiers?.includes('Tiny Cup')) {
        throw new Error(`You cannot use ${species}. It is not smol.`)
      }

      if (violatesSpeciesClause(raid, userId, species)) {
        throw new Error(`You cannot select species ${species} for this raid (Species Clause)`)
      }
      return species
    }
  })()

  // Check items
  if (item) {
    if (!hasItem(user, item)) {
      throw new Error(`You don't have the item ${item}`)
    }
    if (ITEMS[item].category === 'megastone' && !hasItem(user, 'megabracelet')) {
      throw new Error(`You don't have the Mega Bracelet.`)
    }
  }

  console.log('4', species)
  return {state: 'JOIN', raidPrice, speciesToJoin}
}
