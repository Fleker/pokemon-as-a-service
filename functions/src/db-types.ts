/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-namespace */
import { PokemonId, Type } from "../../shared/src/pokemon/types"
import { ItemId } from "../../shared/src/items-list"
import { WeatherType, LocationId } from "../../shared/src/locations-list"
import { BadgeId } from '../../shared/src/pokemon/types';
import { Tier } from "../../shared/src/battle-tiers"
import { Notification } from "../../shared/src/server-types";
import * as Server from "../../shared/src/server-types";
import {FieldValue} from '@google-cloud/firestore'

export function updateableUser(user: Users.Doc) {
  return user as Users.DbDoc // Naive type transfer
}

export type BerryPlot = Server.BerryPlot

export namespace Users {
  export type Items = {[item in ItemId]?: number}

  export type Doc = Server.Users.Doc
  export type Egg = Server.Users.Egg

  // A version of Users.Doc which includes FieldValues
  export type DbDoc = Server.Users.Doc | {
    /**
     * Map of Pokemon the user has available and how many of them.
     */
    pokemon: Partial<Record<PokemonId, number|FieldValue>>
    /**
     * Map of obtained items and their count.
     */
    items: Partial<Record<ItemId, number|FieldValue>>,
    'items.pokeball': FieldValue,
    'items.greatball': FieldValue,
    'items.ultraball': FieldValue,
    'items.raidpass': FieldValue,
    /**
     * Array of active hidden items the user has fonud.
     */
    hiddenItemsFound: string[] | FieldValue
    /**
     * Record of current research tasks and their progress.
     */
    researchCurrent?: Record<string, number|FieldValue>
    /**
     * Count of research tasks completed.
     */
    researchCompleted?: number|FieldValue
    /**
     * Count of trainers the player has traded with in prviate trades.
     */
    trainersTraded?: number|FieldValue
    /**
     * Count of trades made in the GTS.
     */
    gtsTraded?: number|FieldValue
    /**
     * Active notifications for player
     */
    notifications?: Notification[]|FieldValue
    /**
     * Total number of berries planted.
     */
    berryGrown?: number|FieldValue
    /**
     * Count of number of times move tutor was used.
     */
    moveTutors: number|FieldValue
    /**
     * Count of items crafted.
     */
    itemsCrafted?: number|FieldValue
    /**
     * A 5-item reverse queue to store recent places traveled.
     * This is used for Souvenirs, so will be updated in the catch function.
     */
    lastLocations?: LocationId[]|FieldValue
    voyagesCompleted?: number|FieldValue
    evolutionCount?: number|FieldValue
    restorationCount?: number|FieldValue
    formChangeCount?: number|FieldValue
    // Custom badges that the user may have, which we need to sync
    customBadges?: string[]|FieldValue
    wonderTradeCount?: number|FieldValue
  }
}

export namespace BattleStadium {
  export interface Doc {
    heldItems: ItemId[]
    opponent: BadgeId[]
    result: 1 | 2 | 3
    species: BadgeId[]
    tier: Tier
    timestamp: FirebaseFirestore.Timestamp
    userId: string
  }

  export type Leaderboard = {
    [t in Tier]?: {
      topPokemon: BadgeId[]
      topRatio: {
        ldap: string
        percent: number
      }[]
      topWins: {
        ldap: string
        percent: number
      }[]
      topWinsWeekly: {
        ldap: string
        wins: number
      }
    }
  }
}

export namespace Lottery {
  export interface Doc {
    /**
     * List of LDAPs who have drawn today
     */
    draws: string[]
    /**
     * Total matches from draws today.
     */
    matches: number
    /**
     * Number of people who got the grand prize. (Might be broken.)
     */
    grandPrizes: number
    /**
     * Count of matching numbers. Can divide by `matches` to get average.
     */
    sum: number
    /**
     * Winning ticket.
     */
    ticket: string
  }
}

export namespace RadioQuiz {
  export interface Doc {
    correct: number | FieldValue
    wrong: number | FieldValue
  }
}

export namespace Swarm {
  export type Doc = {
    /**
     * Key-value pair of votes to count of votes.
     */
    votes: Partial<Record<BadgeId, number>>
    /**
     * Users who have voted in this cycle for this region.
     */
    users: Record<string, BadgeId>
  }
}

export interface ReleasedDoc {
  count: number
  releasedBadges: string[]
  releasedTime?: number
}

export type HiddenItemDoc = DowseEncounterDoc | DowseItemDoc | DowseEggDoc | MysteryGiftItemDoc
  | UnownDoc

export interface DowsingHiddenItem {
  active: boolean
  badge: string
  ldaps: string[]
  keyItem: boolean
  noShare: boolean
  mystery?: boolean
  image?: string
  text?: string
}

export interface DowseEncounterDoc extends DowsingHiddenItem {
  encounter: string
}

export interface DowseItemDoc extends DowsingHiddenItem {
  item: string
}

export interface DowseEggDoc extends DowsingHiddenItem {
  egg: string
}

export interface MysteryGiftItemDoc {
  active?: boolean
  encounter: string
  mystery: boolean
  badge?: string
  ldaps?: string[]
}

export interface UnownDoc {
  active?: boolean
  mystery?: boolean
  badge?: string
  ldaps?: string[]
  unown: true
}

/**
 * @deprecated Move to the new RadioQuiz.Doc, which stores less in the database.
 */
export interface RadioQuizDoc {
  answer: string
  correct: number
  options: string[]
  question: string
  wrong: number
}

export interface PokemonDoc {
  species: string
  abilityName?: string
  type1: Type
  type2?: Type
  hp: number
  attack: number
  defense: number
  spAttack: number
  spDefense: number
  speed: number
  move: string | string[]
  moveSupport?: string
  moveTMs?: string[]
}

export interface DbRaid {
  host: string
  players?: {
    [userId: string]: {
      ldap: string
      species: BadgeId | PokemonId
      ready: boolean
      item?: ItemId
      tank?: boolean
    }
  },
  playerList: string[],
  timestamp: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp
  timestampLastUpdated: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp
  boss: BadgeId
  rating: number
  result?: number
  location: LocationId
  locationLabel: string
  locationWeather: WeatherType
  isPublic: boolean
  log?: string
  state: number
  shinyCharm?: boolean
  prizes?: {
    [userId: string]: ItemId[]
  }
  claimUsers?: string[]
  matchState?: {
    playerHps: number[]
    opponentHps: number[]
  }
  wishes: number
}

interface DbTradeRoomParticipant {
  id: string
  ldap: string
  hiddenItems: string[]
  offerSpecies: PokemonId | null
  offerItem: ItemId | null
  offerConfirmed: boolean
}

export interface DbTradeRoom {
  host: DbTradeRoomParticipant
  player?: DbTradeRoomParticipant
  active: boolean
  timestamp: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp
  trades: number | FirebaseFirestore.FieldValue
}
