/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-namespace */
import { PokemonId } from "./pokemon/types"
import { LureId } from "./gen/type-item"
import { BerryId, FertilizerId, ItemId, PokeballId } from "./items-list"
import { Location, TerrainType, WeatherType } from "./locations-list"
import { BadgeId } from './pokemon/types';
import { Tier } from "./battle-tiers"
import { LocationId } from "./locations-list";
import { TPokemon } from "./badge-inflate";
import { MoveId } from "./gen/type-move-meta";
import { RecipeId } from "./crafting";
import { Leg, VoyageId } from "./voyages";
import { UserSpin } from "./items-availablity";
import asLiterals from "./as-literals";

export const settingKeys = asLiterals([
  'union',
  'pokeindex',
  'disableRealtime',
  'disableSyncTeams',
  'flagMart2',
  'flagPokedex2',
  'flagSearch2',
  'flagPicker3',
  'flagPokedex3',
  'flagLocation2',
  'flagTag',
  'flagAchievementService',
  'theme',
  'teamsSync',
  'flagMart3',
  'flagPickerPro',
  'notification',
  'flagSelectList',
])

export type SettingKey = keyof {[K in (typeof settingKeys)[number]]: string}

export type Theme = 'light' | 'dark' | 'default'

export type NotificationValue = Record<NotificationType, {inapp: boolean, push: boolean}>

export type UserItems = {[key in ItemId]?: number}

export namespace Users {
  export type Items = {[item in ItemId]?: number}
  export interface Egg {
    hatch?: number
    laid?: number
    species: BadgeId
  }

  export interface Doc {
    /**
     * Player battle record X-wins-losses-ties.
     * @deprecated
     */
    battleBoxRecord?: number[]
    /**
     * Player battle record X-wins-losses-ties.
     */
    battleStadiumRecord: number[]
    // battleStadiumRecord: [0, number, number, number]
    /**
     * Array of captured Pokemon.
     * @deprecated Use Pokemon map
     */
    currentBadges?: BadgeId[]
    /**
     * Map of Pokemon the user has available and how many of them.
     */
    pokemon: TPokemon
    /**
     * Map of obtained items and their count.
     */
    items: Items,
    /**
     * Array of eggs currently being handled.
     */
    eggs: Egg[]
    /**
     * Array of active hidden items the user has fonud.
     */
    hiddenItemsFound: string[]
    /**
     * Basically set when the player starts.
     */
    lastPokeball: Date | number
    /**
     * Last timestamp the user created a raid.
     */
    lastRaidDate?: number
    /**
     * Player raid record X-wins-losses-ties.
     */
    // raidRecord: [0, number, number, number]
    raidRecord: number[]
    /**
     * Map of raids relevant to the user right now.
     */
    raidActive?: Record<string, {
      boss: BadgeId,
      rating: number,
      reason: string,
    }>
    /**
     * Timestamp of last time battle was conducted.
     */
    lastBattleStadiumDate?: number
    /**
     * Timestamp of last time daycare was used.
     */
    lastDayCareDate?: number
    /**
     * Timestamp of last time user history was requested.
     */
    lastHistoryRequest?: number
    /** Timestamp of last game corner request, but as a date string. */
    lastGameCorner?: string
    /**
     * Count of the number of eggs created from daycare, public or private.
     */
    eggsLaid: number
    /**
     * The location ID the player is currently at.
     */
    location: LocationId
    /**
     * Player LDAP (@google.com)
     */
    ldap: string
    /**
     * Count of registered Pokemon in Pokedex per-region
     */
    pokedex?: {
      kanto: number
      johto: number
      hoenn: number
      sinnoh: number
      unova: number
      kalos: number
      alola: number
      lost: number
      galar: number
      hisui: number
      paldea: number
    }
    /**
     * @deprecated
     */
    releasedBadges?: string[] // Deprecated
    /**
     * @deprecated
     */
    releasedTimes?: number[] // Deprecated
    /**
     * Game settings
     */
    settings: Partial<Record<SettingKey, boolean | Theme | NotificationValue | string>> & {
      /**
       * Sort by Pokedex number instead of catch order.
       */
      pokeindex: boolean
      /**
       * Enables mystery gift.
       */
      union: boolean
      /**
       * Turn off realtime updates on client.
       */
      disableRealtime: boolean
      /**
       * Do not sync badges to Teams page.
       * @deprecated Use teamsSync field
       */
      disableSyncTeams: boolean
      /**
       * Specifies the syncing options to your Teams page.
       */
      teamsSync?: 'ALL' | 'SHINY' | 'LEGENDARY' | 'SHINY_LEGENDARY' | 'RARE' | 'FAVORITE' | 'NONE'
      /**
       * Theme value.
       */
      theme: 'light' | 'dark' | 'default'
      /**
       * Common Expression Langauge
       */
      flagSearch2: boolean
      /**
       * Text & autocomplete to select user location
       */
      flagLocation2: boolean
      /**
       * Feature flag for tags
       */
      flagTag: boolean
      /**
       * Feature flag to DISABLE the Achievements Service popup
       */
      flagAchievementService: boolean
      /** See https://developer.chrome.com/en/blog/introducing-scheduler-yield-origin-trial/ */
      flagSchedulerYield?: boolean
      notification: NotificationValue,
    }
    /**
     * Record of current research tasks and their progress.
     */
    researchCurrent: Record<string, number>
    /**
     * Count of research tasks completed.
     */
    researchCompleted: number
    /**
     * Timestamp of the last time research was claimed.
     */
    researchLastClaim?: number
    /**
     * Count of trainers the player has traded with in prviate trades.
     */
    trainersTraded?: number
    /**
     * Count of trades made in the GTS.
     */
    gtsTraded?: number
    /**
     * Active notifications for player
     */
    notifications?: Notification[]
    // Berry Farming
    /**
     * Total number of berries planted.
     */
    berryGrown?: number
    /**
     * Total number of plots upgrades owned.
     */
    berryPlots?: number
    /**
     * Array of active berry plots.
     */
    berryPlanted?: (BerryPlot | undefined)[]
    /**
     * Count of number of times move tutor was used.
     */
    moveTutors: number
    /**
     * Count of items crafted.
     */
    itemsCrafted?: number
    /**
     * A 5-item reverse queue to store recent places traveled.
     * This is used for Souvenirs, so will be updated in the catch function.
     */
    lastLocations?: LocationId[]
    /**
     * A set of all safaris that have been unlocked.
     */
    friendSafari?: string
    /**
     * A counter of strikes this account has accumulated for bad behavior.
     */
    strikes: number
    /**
     * Token for Firebase Cloud Messaging. May have many, one for each device.
     * @see https://firebase.google.com/docs/cloud-messaging/js/client
     */
    fcm?: string[]
    /**
     * A list of custom labels to tag Pokemon. Behind the scenes the Pokemon
     * will have tags corresponding to the index value. This array provides
     * the user-friendly labels. Due to the way these are defined, you cannot
     * have any more than 64 labels.
     */
     customTags?: string[]
    /**
     * Map of voyages user is in, <VoyageId, DB key>.
     */
    voyagesActive?: Record<string, string>
    voyagesCompleted?: number
    evolutionCount?: number
    restorationCount?: number
    formChangeCount?: number
    yearInReview21?: {
      // We're in Gen 6 now--Angular
      battleWins: number
      raidWins: number
      eggsLaid: number
      pokedex: {
        kanto: number
        johto: number
        hoenn: number
        sinnoh: number
        unova: number // Note: no kalos
      }
      gtsTraded: number
      berryGrown: number
      researchCompleted: number
      currentBadgesLength: number
    }
    yearInReview22?: {
      // We're in Gen 6 now--Angular
      battleWins: number
      raidWins: number
      eggsLaid: number
      pokedex: {
        kanto: number
        johto: number
        hoenn: number
        sinnoh: number
        unova: number
        kalos: number
        alola: number
        galar: number
        hisui: number
      }
      gtsTraded: number
      berryGrown: number
      researchCompleted: number
      voyagesCompleted: number
      formChangeCount: number
      evolutionCount: number
      restorationCount: number
      currentBadgesLength: number
      wealth: 0
    }
    /** Custom badges that the user may have, which we need to sync */
    customBadges?: string[]
    /** Metric for number of wonder trades made by player. */
    lastWonderTrade?: number
    /** Total number of wonder trades made by player. */
    wonderTradeCount?: number
  }
}

export const notificationTypes = asLiterals([
  'GTS_COMPLETE', 'VOYAGE_COMPLETE', 'BATTLE_LEADERBOARD',
  'RAID_RESET', 'RAID_COMPLETE', 'RAID_EXPIRE', 'RAID_CLAIM',
  'ITEM_DISPENSE', 'PLAYER_EVENT', 'GAME_EVENT',
])

export type NotificationType = keyof {[K in (typeof notificationTypes)[number]]: string}

export interface Notification {
  /** Notification title */
  msg: string
  /** Longer notification body */
  body: string
  link: string
  timestamp: number
  cat: NotificationType
  icon: string /* path only */
}

export type BasicBerryPlot = {
  /**
   * Timestamp when berry was planted.
   */
  [berry in ItemId]?: number
}

export type BerryPlot = BasicBerryPlot & {
  /**
   * Item ID for attached fertilizer, if applicable.
   */
  fertilizer?: ItemId
}

export interface PublicRaid {
  /** Raid ID */
  id: string
  boss: BadgeId
  rating: number
  /** Number of players currently in raid. Compute max w/rating. */
  players: number
}

export interface PublicRaidsDoc {
  list: PublicRaid[]
}

export enum WonderTradeStatus {
  UNKNOWN = 0,
  ACTIVE = 1,
  COMPLETED = 2,
  DEACTIVATED = 3,
}

/**
 * This represents a DB entry for Wonder Trade.
 */
export interface WonderTradeEntry {
  userId: string
  species: PokemonId
  timestamp: number
  state: WonderTradeStatus
}

export namespace F {
  export namespace Bank {
    export type BankOperation = [BadgeId | PokemonId, number]
  }

  export namespace BattleStadium {
    export interface Req {
      species: (BadgeId | PokemonId)[]
      heldItems: ItemId[]
      tier: Tier
      practice: boolean
    }

    export interface Res {
      /** ExecuteLog type */
      match: {
        result: number
        msg: string[]
        playerHps: number[]
        opponentHps: number[]
      }
      /** Your species */
      species: BadgeId[]
      /** Your items */
      heldItems: ItemId[]
      opponent: BadgeId[]
      opponentHeldItems: ItemId[]
      /** Location info based on where you did the battle. */
      location: {
        forecast?: WeatherType
        terrain: TerrainType
      }
      prize?: ItemId
      /** Current layer battle stadium record as a rendered string. */
      record?: string
    }
  }

  export namespace BerryFertilize {
    export interface Req {
      index: number | number[]
      fertilizer: FertilizerId | FertilizerId[]
    }

    export interface Res {
      dataFertilizer: FertilizerId | FertilizerId[]
      berryPlanted: (BerryPlot | undefined)[]
    }
  }

  export namespace BerryHarvest {
    export interface Req {
      index: number | number[]
    }

    export interface Res {
      /** Legacy badge format */
      badge: BadgeId[]
      /** New badge format */
      species: PokemonId[]
      berryYield: number[]
      berry: BerryId[]
      weed: ItemId[]
    }
  }

  export namespace BerryPlant {
    export interface Req {
      berry: BerryId | BerryId[]
      index: number | number[]
    }

    export interface Res {
      berry: BerryId | BerryId[]
      berryPlanted: (BerryPlot | undefined)[]
    }
  }

  export namespace BerryPlot {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface Req {}

    export interface Res {
      plots: number
    }
  }

  export namespace Chatbot {
    export type Contact = 'oak' | 'magnolia' | string

    export interface Req {
      contact: Contact
      message: string
    }

    export interface Res {
      contact: Contact
      response: string
    }
  }

  export namespace CraftItem {
    export interface Req {
      craft: {
        item: RecipeId
        count: number
      }[]
    }
    
    export interface Res {
      craft:  {
        item: RecipeId
        count: number
        total: number
      }[] 
    }
  }

  export namespace Daycare {
    export interface Req {
      species: PokemonId[]
      heldItem: ItemId[],
      isPrivate: boolean
    }

    export interface Res {
      debug: any
      debugId?: string
      egg?: {
        /** day-care.ts -> EggDoc */
        hatch: number
        species: string
      }
      evolution?: any
      evolved?: boolean
      /** Parents IDs (evolved) and Shedinja sometimes */
      parents: PokemonId[]
      html: string
    }
  }

  export namespace DrawLotto {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface Req {}

    export interface Res {
      matchCountMax: number
      bestTicket: string
      bestTicketArray: number[]
      iterations: number
      ticket: string
      /** @deprecated */
      html: string
      /** Item won, if any. */
      item?: ItemId
    }
  }

  export namespace Exchange {
    export type Req = {
      type: ItemId
      count: number | string
    } | {
      batch: {
        type: ItemId
        count: number | string
      }[]
    }

    export interface Res {
      purchased: ItemId
      /** User's total count of Premier Balls */
      premier?: number
      count: number
      /** Unit price times count */
      price: number
      /** @deprecated */
      html: 'Exchanged'
      batch: {
        type: ItemId
        count: number
      }[]
    }
  }

  export namespace ExchangeBazaar {
    export interface Req {
      type: ItemId
      /** Corresponding to key in Bazaar object */
      bazaarId: string
      count: number | string
    }

    export interface Res {
      purchased: ItemId
      count: number
      /** Rate times count */
      price: number
      /** @deprecated */
      html: 'Exchanged'
    }
  }

  export namespace ExchangeInverse {
    export type Req = {
      type: ItemId
      count: number | string
      toss?: boolean
    } | {
      batch: {
        type: ItemId
        count: number | string
        toss?: boolean
      }[]
    }

    export interface Res {
      sold: ItemId
      /** Number of PokeBalls user has */
      pokeball: number
      count: number
      /** Unit rate times count */
      price: number
      /** @deprecated */
      html: 'Exchanged'
      batch: {
        type: ItemId
        count: number
      }[]
    }
  }

  export namespace FcmManage {
    export interface Req {
      /**
       * If a `token` is provided, add it to the user's array of FCMs
       */
      token?: string
      /**
       * If an `action` is provided, complete the given action.
       * * `CLEAR` - Delete all tokens
       * * `REMOVE` - Remove the provided token
       * * `PUSH` - Add the provided token
       */
      action?: 'CLEAR' | 'REMOVE' | 'PUSH'
    }

    export type Res = 'OK'
  }

  export namespace Hatch {
    export interface Req {
      key: BadgeId
    }

    export interface Res {
      species: BadgeId
    }
  }

  export namespace MoveDeleter {
    export interface Req {
      species: PokemonId
    }

    export interface Res {
      species: PokemonId
    }
  }

  export namespace MoveTutor {
    export interface Req {
      tutorId: 3 | 6
      species: BadgeId | PokemonId
    }

    export interface Res {
      species: PokemonId
      heartscale: number
      armorite: number
      novelMoves: string[]
    }
  }

  export namespace NotificationsClear {
    export interface Req {
      /**
       * If an index is provided, only clear that entry.
       */
      index?: number
    }

    export type Res = Notification[]
  }

  export namespace QuestDonate {
    export interface Req {
      donations: number
      anonymous?: boolean
    }

    export interface Res {
      current: number
      list: string[]
    }
  }

  export namespace Release {
    export interface Req {
      /**
       * A direct array of v1 badges (potw-xxx) that should be released.
       */
      pokemon?: BadgeId[]
      /**
       * An array of v1/v2 badges and how many to be released, which has higher scaling capabilities.
       */
      operations?: F.Bank.BankOperation[]
    }

    export interface Res {
      /**
       * @deprecated
       */
      html: string
      receivedItems?: ItemId[],
      itemMap?: {
        pokeball:  number | undefined
        greatball: number | undefined
        ultraball: number | undefined
      }
      debug?: {
        receivedItems: number
        string: string
      }
    }
  }

  export namespace ResearchClaim {
    export interface Req {
      /** @see research.ts */
      researchId: string
    }

    export interface Res {
      prize: ItemId
      researchCurrent: Record<string, number>
      researchCompleted: number
      /** Timestamp */
      researchLastClaim: number
    }
  }

  export namespace ResearchGet {
    export interface Req {
      /**
       * If true, deletes the research task with the given key, to be replaced.
       */
      key?: string
    }

    export interface Res {
      researchCurrent: Record<string, number>
    }
  }

  export namespace Settings {
    export interface Req {
      [key: string]: boolean | string
    }

    export type Res = { html: 'ok' }
  }

  export namespace SwarmVote {
    export interface Req {
      species: BadgeId
      /* The specific doc to request. Formats are same. */
      position: 'swarm' | 'raid'
    }

    export interface Res {
      species: BadgeId
      /* The specific doc to request. Formats are same. */
      position: 'swarm' | 'raid'
    }
  }

  export namespace Tag {
    interface TagOperation {
      species: PokemonId
      shouldTag: boolean
      tags: string[]
    }

    export interface Req {
      operations: TagOperation[]
    }

    export type Res = string
  }

  export namespace TagManage {
    export interface Req {
      /**
       * A list of tags. They need to either all exist or not at all. Otherwise
       * there may be some problems.
       */
      tags: string[]
      /**
       * For a given `action`, complete the given action.
       * * `PUSH` - Add `tag` entries to bottom of `user.customTags`
       * * `UPDATE` - Replace `tag` entries starting at `index`
       * * `REMOVE` - Delete `tag` entries with the provided names.
       */
      action: 'PUSH' | 'UPDATE' | 'REMOVE'
      /**
       * For `action == UPDATE`, provide the index to update the existing tag.
       */
      index?: number
    }

    export type Res = string
  }

  export namespace Throw {
    export interface Req {
      pokeball: PokeballId
      duplicates: boolean
      /**
       * Location ID to move locations in the throw script
       */
      locationId?: LocationId
      /**
       * The encounter pool you are throwing into.
       */
      lure?: LureId
      /**
       * If lure == 'friendsafaripass', then the safaris being used correspond to
       * valid friendSafari field in user doc.
       */
      friendSafari?: string
      /**
       * A specific item that can be used as a 'bait' to help catch additional
       * Pokémon.
       * @see [Bait doc](https://docs.google.com/document/d/1aQ1lccf9nZpnP2sO_eoTfm7RAVX_AURX34QTgyr176M/edit)
       */
      bait?: ItemId
    }

    export interface Res {
      /**
       * @deprecated
       */
      html: string
      /**
       * @deprecated
       */
      pokedex: string
      selectedPokemon: BadgeId
      duplicates: boolean
      holdItem?: ItemId
      badge: PokemonId
      /* Not the same Pkmn for UI effect */
      ditto?: PokemonId
      zorua?: PokemonId
      zoroark?: PokemonId
      /** Quantity of existing balls remaining */
      balls: number
      /** user.lastLocations as of last throw */
      lastLocations: LocationId[]
      /** Bait object if used in request */
      bait?: {
        item: ItemId
        /** If less than what client has, note this in UI */
        remaining: number
      }
      debug: any
    }
  }

  export namespace TradeClose {
    export interface Req {
      roomId: string
    }

    export interface Res {
      roomId: string
    }
  }

  export namespace TradeConfirm {
    export interface Req {
      roomId: string
      confirmed: boolean
    }

    export type Res = {
      roomId: string
      dataP: any
      dataH: any
      trade: 'SUCCESS'
    } | {
      roomId: string
      trade: 'FAIL'
    }
  }

  export namespace TradeOffer {
    export interface Req {
      roomId: string
      species: PokemonId
      item: ItemId | null
    }

    export interface Res {
      roomId: string
    }
  }

  export namespace TradeRoomCreate {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface Req {}

    export interface Res {
      roomId: string
    }
  }

  export namespace TradeRoomJoin {
    export interface Req {
      roomId: string
    }

    export interface Res {
      roomId: string
      joined: true,
    }
  }

  export namespace TrainPokemon {
    export interface Req {
      species: PokemonId
      item: ItemId
    }

    export interface Res {
      species: PokemonId
      item: ItemId
    }
  }

  export namespace UseItem {
    export interface OnTarget {
      item: ItemId,
      target: PokemonId,
      hours: number
      gyroZ: number
      spin?: UserSpin
    }

    export interface Directly {
      item: ItemId
    }

    export type Req = OnTarget | Directly

    export type ChangeType = 'EVO' | 'FORM' | 'RESTORED'

    export interface Res {
      target: PokemonId
      /** @deprecated Old badge format */
      transform: BadgeId
      species: PokemonId
      /** @deprecated We can now infer from the client */
      name1?: string
      /** @deprecated We can now infer from the client */
      name2: string
      changeType: ChangeType
      /** Some items can generate raids */
      raidId?: string
    }
  }

  export namespace UserDowsing {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface Req {}

    export interface Res {
      data: ({
        id: string
        badge: string
      } | null)[]
      totalItemsCount: number
    }
  }

  export namespace UserHistory {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface Req {}

    export interface Res {
      lastHistory: number
      /** Standard user doc */
      user: any
      historyBattleBox: any
      historyBattleStadium: any
      historyHostedRaids: any
      historyParticipantRaids: any
      historyGts: any
      historyItemUsage: any
      historyDaycare: any
    }
  }

  export namespace UserLocation {
    export interface Req {
      location: LocationId
    }

    export interface Res {
      location: LocationId
      globe: Location
    }
  }

  export namespace UserPokedex {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface Req {}

    export interface Res {
      kanto: number[]
      johto: number[]
      hoenn: number[]
      sinnoh: number[]
      unova: number[]
      kalos: number[]
      alola: number[]
      lost: number[]
      charmsAdded: string[]
      charmsRemoved: string[]
      debug: any 
    }
  }

  export namespace UserSyncLdap {
    export interface Req {
      newLdap: string
    }

    export interface Res {
      newLdap: string
      uid: string
    }
  }

  export namespace UseTmTr {
    export interface Req {
      species: BadgeId | PokemonId
      item: ItemId
    }

    export interface Res {
      species: PokemonId
      move: MoveId
      item: ItemId
    }
  }

  export namespace VoyageClaim {
    export interface Req {
      voyageId: string
    }

    export interface Res {
      voyageId: string
    }
  }

  export namespace VoyageCreate {
    export interface Req {
      voyage: VoyageId
    }

    export interface Res {
      voyage: VoyageId
      /** Firestore ID: voyages/<docid> */
      docId: string
    }
  }

  export namespace VoyagePath {
    export interface Req {
      voyageId: string
      legs: Leg[]
    }

    export interface Res {
      legs: Leg[]
    }
  }

  export namespace VoyagePublicize {
    export interface Req {
      voyageId: string
    }
  
    export interface Res {
      voyageId: string
      vid: string
    }
  }  

  export namespace VoyageSelect {
    export interface Req {
      voyageId: string
      species: 'null' | 'first' | PokemonId
      ready: boolean
    }

    export interface Res {
      voyageId: string
    }
  }

  export namespace VoyageStart {
    export interface Req {
      voyageId: string
    }

    export interface Res {
      voyageId: string
      /** Raids are created at the end of a voyage. This is the link to that voyage. */
      raidId: string
    }
  }

  export namespace WonderTradeUpload {
    export interface Req {
      species: PokemonId
    }

    export interface Res {
      ok: 'ok'
    }
  }
}
