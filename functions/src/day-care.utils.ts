import { TeamsBadge, MATCH_REQS } from "../../shared/src/badge2"
import { EggGroup, Type } from "../../shared/src/pokemon/types"
import { randomItem } from "./utils"
import * as Club from '../../shared/src/platform/breeding-club';
import * as Pkmn from '../../shared/src/pokemon'
import * as P from '../../shared/src/gen/type-pokemon'
import { MoveId } from "../../shared/src/gen/type-move-meta";
import { ItemId } from "../../shared/src/items-list";
import { BadgeId } from '../../shared/src/pokemon/types';
import { Badge } from "../../shared/src/badge3";
import { Location } from "../../shared/src/locations-list";
import { useItem, UseItemOutput } from "../../shared/src/items-availablity";
import spacetime from "spacetime";
import { Users } from "../../shared/src/server-types";

export type BreedState = 'MOTHER-LIKE' | 'FATHER-LIKE' | 'INVALID'

function merge(result1: BreedState, result2: BreedState): BreedState {
  if (result1 === 'INVALID' && result2 === 'INVALID') return 'INVALID'
  if (result1 === 'FATHER-LIKE' || result2 === 'FATHER-LIKE') return 'FATHER-LIKE'
  return 'MOTHER-LIKE'
}

export function compatibleEggGroup(mother: EggGroup | EggGroup[], father: EggGroup | EggGroup[]): BreedState {
  /*
   *  Pokémon can have either 1 or 2 egg groups.
   *  The flow is:
   *    mother[] <-> father[]
   *    mother[0] <-> father[]    mother[1] <-> father[]
   *    mother[0] <-> father[0]   mother[0] <-> father[1]   mother[1] <-> father[0] ...
   */

  if (Array.isArray(mother)) {
    return merge(compatibleEggGroup(mother[0], father), compatibleEggGroup(mother[1], father))
  }

  if (Array.isArray(father)) {
    return merge(compatibleEggGroup(mother, father[0]), compatibleEggGroup(mother, father[1]))
  }

  if (mother === undefined || father === undefined) return 'INVALID'

  if (mother === 'Undiscovered' || father === 'Undiscovered') return 'INVALID'
  if (mother === 'Ditto' && father === 'Ditto') return 'INVALID'
  if (mother === 'Ditto') return 'FATHER-LIKE'
  if (father === 'Ditto') return 'MOTHER-LIKE'
  if (mother === father) return 'MOTHER-LIKE'

  return 'INVALID'
}

export interface ItemResponse {
  speciesId?: string,
  hatchTime?: number,
  shiny?: boolean,
  levelMultiplier?: number,
  itemConsumed: boolean,
  eggConsumed?: boolean,
}

export function mantykeMethod(mother: BadgeId, father: BadgeId) {
  if (TeamsBadge.match(P.Remoraid, [mother], MATCH_REQS).match &&
      TeamsBadge.match(P.Mantyke, [father], MATCH_REQS).match) {
    return true
  }
  return false
}

export function panchamMethod(mother: BadgeId, father: BadgeId) {
  const motherLookup = Pkmn.get(mother)!
  if ((motherLookup.type1 === 'Dark' || motherLookup.type2 === 'Dark') &&
      TeamsBadge.match(P.Pancham, [father], MATCH_REQS).match) {
    return true
  }
  return false
}

export function generateEgg(motherId: BadgeId, fatherId: BadgeId, breedResult: BreedState, specials: ItemResponse, motherSpecials?: ItemResponse) {
  const mother = Pkmn.get(motherId)!
  const father = Pkmn.get(fatherId)!
  const babyId = (() => {
    if (motherSpecials && motherSpecials.speciesId) {
      return motherSpecials.speciesId
    }
    if (specials.speciesId) {
      return specials.speciesId
    }
    if (breedResult === 'FATHER-LIKE') {
      return getEggBase(father.eggBase as BadgeId)
    }
    return getEggBase(mother.eggBase as BadgeId)
  })()

  const baby = Pkmn.get(babyId)!
  const babyBadge = new TeamsBadge(babyId)

  // Compute the egg move variation here
  babyBadge.variant = getEggMoveVariation(motherId, fatherId)

  const {needForm, syncableForms} = baby
  const motherBadge = new TeamsBadge(motherId)
  if (needForm === true) {
    // For Pokémon like Shellos, their bred form is based on parent (if valid)
    if (motherBadge.form && syncableForms!.includes(motherBadge.form)) {
      babyBadge.form = motherBadge.form
    } else {
      const randomForm = randomItem(syncableForms!)
      babyBadge.form = randomForm
    }
  } else if (needForm) {
    babyBadge.form = needForm
  } else if (motherBadge.form) {
    // Or the mother passes its form down directly
    babyBadge.form = motherBadge.form
  }

  if (baby.gender) {
    // Give them a random gender if possible
    babyBadge.gender = randomItem(baby.gender)
  }
  return babyBadge.toString()
}

export function canBeShiny(egg: BadgeId) {
  const inShinyList = Pkmn.get(egg)?.shiny === 'WILD'
  const inClubList = TeamsBadge.match(new TeamsBadge(egg).toSimple(), Club.babyProduced, MATCH_REQS)
  return {
    list: inShinyList || inClubList.match,
    club: inClubList.match,
  }
}

export function getEggBase(eggBase: BadgeId | BadgeId[]): BadgeId {
  if (Array.isArray(eggBase)) {
    return randomItem(eggBase)
  }
  return eggBase
}

const RATIO = 0.25

/**
 * Whether a Pokémon evolves is dependent on its level, divided by a
 * particular ratio. What should this ratio be?
 *
 * Bulbasaur evolves at level 16.
 * We should have the odds of Bulbasaur evolving be 1/4, that is RATIO = 0.25
 *
 * Bulbasaur (16) - 1/4
 * Caterpie (7)   - ~1/2
 * Dragonair (55) - ~1/14
 *
 */
function willEvolve(levelAt?: number): boolean {
  if (!levelAt) return false
  return Math.random() < (1/levelAt/RATIO)
}

export interface DayCareEvolution {
  html: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug: any
  parent: Badge
  useItemOutput?: UseItemOutput
  item: ItemId
  specials?: ItemResponse
}

export function daycareEvolution(parent: Badge, heldItem: ItemId, user: Users.Doc, userLocation: Location): DayCareEvolution {
  const res: DayCareEvolution = {
    html: '',
    parent,
    debug: {},
    item: heldItem,
  }

  const itemUsageSpecials = (() => {
    if (daycareItems[heldItem]) return daycareItems[heldItem]!(parent.toLegacyString()!)
    return {itemConsumed: false} // Default
  })()
  res.specials = itemUsageSpecials
  const parentDb = Pkmn.get(parent.toLegacyString())!
  if (itemUsageSpecials.levelMultiplier && parentDb.levelAt) {
    parentDb.levelAt *= itemUsageSpecials.levelMultiplier
  }
  // If we have a Widget with our Bulbasaur
  // Then using it:
  //   Bulbasaur (16) - 1/4
  //   Widget.levelMultipler - 0.5
  //   Now, Bulbasaur (8) - 1/2
  const performEvolution = willEvolve(parentDb.levelAt)

  if (parent.id === 665) {
    console.log('Spewpa! Evolve? ' + performEvolution)
  }

  if (performEvolution && heldItem !== 'everstone') {
    res.html += `Your ${parent.toLabel()} evolved!!\n`

    // Use in-game loction
    let loc = spacetime()
    const timezone = userLocation.timezone
    loc = loc.goto(timezone)
    const hours = loc.hour()

    try {
      if (parent.id === 665) {
        console.log('Evolve Spewpa rarecandy at ' + user.location)
      }
      const evolution = useItem({
        pokemon: user.pokemon || {},
        hours,
        item: 'rarecandy', // We already guarantee evo, so just go with it
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: user.items as any,
        location: userLocation,
        target: parent.toString(),
        gyroZ: 0,
      })
      if (parent.id === 665) {
        console.log('Evolve Spewpa -> ' + evolution)
      }
      res.useItemOutput = evolution
    } catch (e) {
      // For whatever reason, the evolution cannot occur
      // useItemOutput remains undefined, so no evo happens.
    }
  }
  return res
}


// In this function we assume that the egg groups align
export function getEggMoveVariation(mother: string, father: string) {
  // The output of this should be the correct badge ID for a variation,
  // if applicable.
  // Match the father's moves against the mother's novelMoves.
  // If there's a match, attach that variant to the baby badge.
  const motherPkmn = Pkmn.get(mother)!
  const fatherPkmn = Pkmn.get(father)!
  const motherBadge = new TeamsBadge(mother)
  const fatherBadge = new TeamsBadge(father)
  if (!motherPkmn.novelMoves) {
    return undefined // No variation
  }
  if (fatherBadge.variant === 0 || motherBadge.variant === 0) {
    // Ignore var0
    return undefined // No variation
  }
  const variation = (() => {
    for (const [index, moves] of motherPkmn.novelMoves.entries()) {
      // Check each of father's moves
      const fatherMoves = fatherPkmn.move as MoveId[] // Cast
      for (const move of fatherMoves) {
        if (moves.includes(move)) {
          return index
        }
      }
    }
    return undefined
  })()
  if (variation === undefined || variation === 0) {
    return undefined
  }
  // This baby is going to be a variation
  // const badge = Badge.toBadge(baby)
  // badge.variant = variation
  // return Badge.toString(badge)
  return variation
}

const DAY_S = 60 * 60 * 24
const WEEK_S = DAY_S * 7

type ItemMap = {
  [item in ItemId]?: (speciesId: BadgeId) => ItemResponse
}

const typeItemEffect = (type: Type) => {
  return (speciesId: BadgeId): ItemResponse => {
    const pkmn = Pkmn.get(speciesId)!
    if (pkmn.type1 === type || pkmn.type2 === type) {
      // Should hatch in 2 days instead of a week
      return {hatchTime: DAY_S * 2, eggConsumed: true, itemConsumed: false}
    }
    return {itemConsumed: false}
  }
}

/**
 * Candy balance rationale
 *   Each candy reduces the `levelAt` field by a certain amount
 *   This should make levelup easier
 *
 * |           | Caterpie (7) | Bulbasaur (16) | Croconaw (30) |  Larvesta (59) |
 * | --        |    4/7 ~ 1/2 |     4/16 = 1/4 |    4/30 ~ 1/9 |    4/59 ~ 1/15 |
 * | XS (0.75) | 4/5.25 ~ 3/4 |     4/12 = 1/3 |  4/22.5 ~ 1/6 | 4/44.25 ~ 1/10 |
 * |  S (0.5)  |    4/3.5 > 1 |      4/8 = 1/2 |    4/15 ~ 2/7 |   4/29.5 ~ 1/7 |
 * |  M (0.33) |            1 |    4/5.3 ~ 3/4 |    4/10 ~ 2/5 |   4/19.7 ~ 1/5 |
 * |  L (0.25) |            1 |              1 |   4/7.5 ~ 1/2 |  4/14.75 ~ 2/7 |
 * | XL (0.15) |            1 |              1 |   4/4.5 ~ 8/9 |  4/11.8 ~ 9/20 |
 *
 * @param levelMultiplier Ratio to decrease multiplication chance
 */
 const expcandy = (levelMultiplier: number, stage: number) => {
  return (speciesId: BadgeId): ItemResponse => {
    const pkmn = Pkmn.get(speciesId)!
    if (pkmn.levelAt) {
      return {
        itemConsumed: true,
        eggConsumed: true,
        hatchTime: WEEK_S - DAY_S * stage,
        levelMultiplier
      }
    }
    return {itemConsumed: false}
  }
}

export const daycareItems: ItemMap = {
  seaincense: (speciesId) => {
    const id = new TeamsBadge(speciesId).toSimple()
    if (id === P.Marill || id === P.Azumarill) {
      return {speciesId: P.Azurill, itemConsumed: false}
    }
    return {itemConsumed: false}
  },
  laxincense: (speciesId) => {
    const id = new TeamsBadge(speciesId).toSimple()
    if (id === P.Wobbuffet) {
      return {speciesId: P.Wynaut, itemConsumed: false}
    }
    return {itemConsumed: false}
  },
  rockincense: (speciesId) => {
    const id = new TeamsBadge(speciesId).toSimple()
    if (id === P.Sudowoodo) {
      return {speciesId: P.Bonsly, itemConsumed: false}
    }
    return {itemConsumed: false}
  },
  oddincense: (speciesId) => {
    const id = new TeamsBadge(speciesId).toSimple()
    if (id === P.Mr_Mime) {
      return {speciesId: P.Mime_Jr, itemConsumed: false}
    }
    return {itemConsumed: false}
  },
  fullincense: (speciesId) => {
    const id = new TeamsBadge(speciesId).toSimple()
    if (id === P.Snorlax) {
      return {speciesId: P.Munchlax, itemConsumed: false}
    }
    return {itemConsumed: false}
  },
  roseincense: (speciesId) => {
    const id = new TeamsBadge(speciesId).toSimple()
    if (id === P.Roselia || id === P.Roserade) {
      return {speciesId: P.Budew, itemConsumed: false}
    }
    return {itemConsumed: false}
  },
  pureincense: (speciesId) => {
    const id = new TeamsBadge(speciesId).toSimple()
    if (id === P.Chimecho) {
      return {speciesId: P.Chingling, itemConsumed: false}
    }
    return {itemConsumed: false}
  },
  luckincense: (speciesId) => {
    const id = new TeamsBadge(speciesId).toSimple()
    if (id === P.Chansey || id === P.Blissey) {
      return {speciesId: P.Happiny, itemConsumed: false}
    }
    return {itemConsumed: false}
  },
  waveincense: (speciesId) => {
    const id = new TeamsBadge(speciesId).toSimple()
    if (id === P.Mantine) {
      return {speciesId: P.Mantyke, itemConsumed: false}
    }
    return {itemConsumed: false}
  },

  firestone: () => {
    // Hatch in half the time
    return {hatchTime: WEEK_S / 2, itemConsumed: false, eggConsumed: true}
  },
  sunstone: () => {
    return {hatchTime: WEEK_S / 2, itemConsumed: false, eggConsumed: true}
  },
  blackbelt: typeItemEffect('Fighting'),
  blackglasses: typeItemEffect('Dark'),
  dragonfang: typeItemEffect('Dragon'),
  hardstone: typeItemEffect('Rock'),
  miracleseed: typeItemEffect('Grass'),
  mysticwater: typeItemEffect('Water'),
  nevermeltice: typeItemEffect('Ice'),
  softsand: typeItemEffect('Ground'),
  silkscarf: typeItemEffect('Normal'),
  silverpowder: typeItemEffect('Bug'),
  spelltag: typeItemEffect('Ghost'),
  charcoal: typeItemEffect('Fire'),
  magnet: typeItemEffect('Electric'),
  poisonbarb: typeItemEffect('Poison'),
  sharpbeak: typeItemEffect('Flying'),
  metalcoat: typeItemEffect('Steel'),
  twistedspoon: typeItemEffect('Psychic'),
  expcandyxs: expcandy(0.75, 1),
  expcandys: expcandy(0.5, 1),
  expcandym: expcandy(0.33, 2),
  expcandyl: expcandy(0.25, 2),
  expcandyxl: expcandy(0.15, 3),
  rarecandy: expcandy(0.04, 3),
}
