import { assert } from '@fleker/gents'
import { Badge } from "./badge3"
import { calculateNetWorth } from "./events"
import { CATCH_CHARM_DPPT, CATCH_CHARM_SWSH, CATCH_CHARM_XY, LegendaryQuest, requireItem, requireType, simpleRequirePotw, simpleRequirePotwArr } from "./legendary-quests"
import { Users } from "./server-types"
import { Item, ItemId } from "./items-list"
import * as P from './gen/type-pokemon'
import asLiterals from './as-literals'
import { Type } from './pokemon/types'
import { get } from './pokemon'

export const recipeCategoryKeys = asLiterals(['crafting', 'tmmachine', 'bait'])
export type RecipeCategory = keyof {[K in (typeof recipeCategoryKeys)[number]]: string}

type CraftInput = Partial<Record<ItemId, number>>
type CraftPair = [ItemId, number]

export interface Recipe {
  /** Required items */
  input: CraftInput
  /** Item you get in return */
  output: ItemId
  /** Whether you have this recipe unlocked */
  unlocked: LegendaryQuest
  category: RecipeCategory
}

function craftTm(tm: ItemId, inputs: CraftPair[]): Recipe {
  const input: CraftInput = {}
  for (const i of inputs) {
    const key = i[0] as ItemId
    input[key] = i[1]
  }
  return {
    category: 'tmmachine',
    input,
    output: tm,
    unlocked: {
      hints: [{
        completed: (r) => r.battleStadiumRecord[1] >= 50 + 25 * inputs.length,
        msg: 'Develop an expertise with battles.'
      }, {
        completed: requireItem(tm),
        msg: `Already be familiar with the move ${tm.substring(3)}.`
      }]
    }
  }
}

function craftTr(tr: ItemId, inputs: CraftPair[]): Recipe {
  const input: CraftInput = {}
  for (const i of inputs) {
    const key = i[0] as ItemId
    input[key] = i[1]
  }
  return {
    category: 'tmmachine',
    input,
    output: tr,
    unlocked: {
      hints: [{
        completed: (r) => r.raidRecord[1] >= 50 + 25 * inputs.length,
        msg: 'Develop an expertise with raids.'
      }, {
        completed: requireItem(tr),
        msg: `Already be familiar with the move ${tr.substring(3)}.`
      }]
    }
  }
}

function craftCurry(input: Partial<Record<ItemId, number>>, output: ItemId, type: Type, label: string): Recipe {
  return {
    category: 'bait',
    input,
    output,
    unlocked: {
      hints: [{
        completed: (r) => (r.items.campinggear ?? 0) > 0,
        msg: 'You cannot make this item until you have a place to put the prepared meal.'
      }, {
        completed: (r) => r.researchCompleted >= 210,
        msg: 'Professor Magnolia may provide you with a starting recipe.'
      }, {
        completed: requireType(type, 50),
        msg: `${label} attract ${type}-type Pokémon. Are you familiar with them?`,
      }]
    }
  }
}

function craftCurryRare(input: Partial<Record<ItemId, number>>, output: ItemId, kind: string, label: string): Recipe {
  return {
    category: 'bait',
    input,
    output,
    unlocked: {
      hints: [{
        completed: (r) => (r.items.campinggear ?? 0) > 0,
        msg: 'You cannot make this item until you have a place to put the prepared meal.'
      }, {
        completed: (r) => r.researchCompleted >= 210,
        msg: 'Professor Magnolia may provide you with a starting recipe.'
      }, {
        completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_SWSH),
        msg: 'Once you earn the trust of Professor Magnolia, she will give you more recipes.'
      }, {
        completed: (r) => r.itemsCrafted > 72, // 18*4
        msg: 'Once you have crafted enough items, you will gain the experience to craft more.'
      }, {
        completed: (r) => {
          const kindStat = {
            'Bulky': 'defense',
            'Spongy': 'hp',
            'Fast': 'speed',
            'Wary': 'spDefense',
            'Magical': 'spAttack',
            'Strong': 'attack',
            'Gigantamax': 'hp',
          }
          const stat = kindStat[kind]
          let c = 0
          for (const [key, value] of Object.entries(r.pokemon)) {
            const badge = new Badge(key)
            const db = get(badge.toLegacyString())
            if (!db) return false
            if (db[stat] >= 100) {
              c += value
            }
            if (c >= 50) {
              return true // exit early
            }
          }
          return false
        },
        msg: `The ${label} can attack ${kind} Pokémon. Do you have familarity with them?`
      }]
    }
  }
}

function craftPoffin(input: Partial<Record<ItemId, number>>, output: ItemId): Recipe {
  return {
    category: 'bait',
    input,
    output,
    unlocked: {
      hints: [{
        completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_DPPT),
        msg: 'Professor Rowan will give you a recipe once he believes you are ready.'
      }, {
        completed: (r) => r.researchCompleted >= 120,
        msg: 'Professor Rowan may provide you with a starting recipe.'
      }]
    }
  }
}

function craftPokepuff(input: Partial<Record<ItemId, number>>, output: ItemId): Recipe {
  return {
    category: 'bait',
    input,
    output,
    unlocked: {
      hints: [{
        completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_XY),
        msg: 'Professor Sycamore will give you a recipe once he believes you are ready.'
      }, {
        completed: (r) => r.researchCompleted >= 180,
        msg: 'Professor Sycamore may provide you with a starting recipe.'
      }]
    }
  }
}

function craftHisuiCake(input: ItemId, output: ItemId): Recipe {
  return {
    category: 'bait',
    input: {
      [input]: 1,
      cakelurebase: 1,
    },
    output,
    unlocked: {
      hints: [{
        completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_SWSH),
        msg: 'Professor Magnola speaks of the ancient Hisui region.'
      }, {
        completed: requireItem('legendplate'),
        msg: 'Until you uncover the ultimate power of the legendary Pokémon Arceus, these recipes will be a mystery.'
      }]
    }
  }
}

function craftPaldeanSandwich(ingredients: ItemId[], output: ItemId): Recipe {
  const input: Partial<Record<ItemId, number>> = {}
  ingredients.forEach(i => {
    input[i] = 1
  })
  input['svibaguette'] = 1
  return {
    category: 'bait',
    input,
    output,
    unlocked: {
      hints: [{
        completed: (r) => false,
        msg: 'Requires TODO SV Catching Charm.'
      }]
    }
  }
}

function craftSleepSalad(input: Partial<Record<ItemId, number>>, output: ItemId): Recipe {
  return {
    category: 'bait',
    input,
    output,
    unlocked: {
      hints: [{
        completed: simpleRequirePotw(P.Snorlax),
        msg: 'Catch a snoozy Pokémon.'
      }, {
        completed: (r) => r.itemsCrafted > 30,
        msg: 'Try crafting some other items first.'
      }, {
        completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_SWSH),
        msg: 'Professor Magnola may help you craft some salads.'
      }]
    }
  }
}


export const Recipes = {
  pokeball: assert<Recipe>({
    category: 'crafting',
    input: {
      tumblestone: 1,
      apricorn: 1,
    },
    output: 'pokeball',
    unlocked: {
      hints: [],
    }
  }),
  greatball: assert<Recipe>({
    category: 'crafting',
    input: {
      tumblestone: 1,
      apricorn: 1,
      ironchunk: 1,
    },
    output: 'greatball',
    unlocked: {
      hints: [{
        completed: (r) => calculateNetWorth(r as unknown as Users.Doc) >= 2000,
        msg: 'Play more to win.'
      }, {
        completed: ({pokemon}) => {
          let sum = 0
          for (const [key, value] of Object.entries<number>(pokemon)) {
            const badge = new Badge(key)
            if (badge.personality.pokeball === 'greatball') {
              sum += value
            }
          }
          return sum >= 50
        },
        msg: 'Catch more in Great Balls.'
      }],
    }
  }),
  ultraball: assert<Recipe>({
    category: 'crafting',
    input: {
      tumblestone: 1,
      apricorn: 1,
      ironchunk: 2,
    },
    output: 'ultraball',
    unlocked: {
      hints: [{
        completed: (r) => calculateNetWorth(r as unknown as Users.Doc) >= 4000,
        msg: 'Play more to win.'
      }, {
        completed: ({pokemon}) => {
          let sum = 0
          for (const [key, value] of Object.entries<number>(pokemon)) {
            const badge = new Badge(key)
            if (badge.personality.pokeball === 'ultraball') {
              sum += value
            }
          }
          return sum >= 50
        },
        msg: 'Catch more in Ultra Balls.'
      }],
    }
  }),
  heavyball: assert<Recipe>({
    category: 'crafting',
    input: {
      tumblestone: 1,
      blackapricorn: 1,
    },
    output: 'heavyball',
    unlocked: {
      hints: [{
        completed: simpleRequirePotwArr([
          P.Snorlax, P.Gyarados, P.Onix, P.Graveler, P.Dragonite,
          P.Ursaring, P.Mantine, P.Pupitar, P.Hariyama,
        ]),
        msg: 'The Heavy Ball is able to catch Pokémon that are quite heavy.'
      }]
    }
  }),
  lureball: assert<Recipe>({
    category: 'crafting',
    input: {
      tumblestone: 1,
      blueapricorn: 1,
    },
    output: 'lureball',
    unlocked: {
      hints: [{
        completed: simpleRequirePotwArr([
          P.Goldeen, P.Magikarp, P.Totodile, P.Chinchou, P.Qwilfish,
          P.Corsola, P.Remoraid, P.Luvdisc
        ]),
        msg: 'The Lure Ball is able to catch Pokémon that are found in the water.'
      }]
    }
  }),
  friendball: assert<Recipe>({
    category: 'crafting',
    input: {
      tumblestone: 1,
      greenapricorn: 1,
    },
    output: 'friendball',
    unlocked: {
      hints: [{
        completed: simpleRequirePotwArr([
          P.Golbat, P.Eevee, P.Chansey, P.Pikachu, P.Clefairy, P.Jigglypuff,
          P.Togetic, P.Marill,
        ]),
        msg: 'The Friend Ball is able to catch Pokémon that will grow more friendly.'
      }]
    }
  }),
  loveball: assert<Recipe>({
    category: 'crafting',
    input: {
      tumblestone: 1,
      pinkapricorn: 1,
    },
    output: 'loveball',
    unlocked: {
      hints: [{
        completed: simpleRequirePotwArr([
          P.NidoranF, P.NidoranM, P.Tauros, P.Chansey, P.Jynx,
          P.Nidorina, P.Nidorino, P.Miltank, P.Ralts, P.Snorunt,
        ]),
        msg: 'The Love Ball is able to catch Pokémon that are lovable.'
      }]
    }
  }),
  levelball: assert<Recipe>({
    category: 'crafting',
    input: {
      tumblestone: 1,
      redapricorn: 1,
    },
    output: 'levelball',
    unlocked: {
      hints: [{
        completed: simpleRequirePotwArr([
          P.Butterfree, P.Beedrill, P.Furret, P.Noctowl, P.Ledian,
          P.Ariados, P.Quagsire, P.Flaaffy, P.Linoone,
        ]),
        msg: 'The Level Ball is able to catch Pokémon that are low level.'
      }]
    }
  }),
  fastball: assert<Recipe>({
    category: 'crafting',
    input: {
      tumblestone: 1,
      blueapricorn: 1,
    },
    output: 'fastball',
    unlocked: {
      hints: [{
        completed: simpleRequirePotwArr([
          P.Dugtrio, P.Persian, P.Kadabra, P.Rapidash, P.Electrode,
          P.Scyther, P.Jumpluff, P.Sneasel, P.Grovyle,
        ]),
        msg: 'The Fast Ball is able to catch Pokémon that gotta go fast.'
      }]
    }
  }),
  moonball: assert<Recipe>({
    category: 'crafting',
    input: {
      tumblestone: 1,
      yellowapricorn: 1,
    },
    output: 'moonball',
    unlocked: {
      hints: [{
        completed: simpleRequirePotwArr([
          P.Eevee, P.Nidorina, P.Nidorino, P.Clefairy, P.Jigglypuff,
          P.Murkrow, P.Sneasel, P.Houndour, P.Skitty,
        ]),
        msg: 'The Moon Ball is able to catch Pokémon that are connected to the moon.'
      }]
    }
  }),
  bluepokeblock: assert<Recipe>({
    category: 'crafting',
    input: {
      wiki: 4,
    },
    output: 'bluepokeblock',
    unlocked: {
      hints: [{
        completed: (r) => r.berryGrown > 100,
        msg: 'Grow a bunch of berries to improve your gardening skills.'
      }, {
        completed: (r) => r.hiddenItemsFound.includes('vJHZReab8dpsCgz6ixJy'),
        msg: 'Catch Pokémon from the Hoenn region.'
      }]
    }
  }),
  redpokeblock: assert<Recipe>({
    category: 'crafting',
    input: {
      tamato: 4,
    },
    output: 'redpokeblock',
    unlocked: {
      hints: [{
        completed: (r) => r.berryGrown > 100,
        msg: 'Grow a bunch of berries to improve your gardening skills.'
      }, {
        completed: (r) => r.hiddenItemsFound.includes('vJHZReab8dpsCgz6ixJy'),
        msg: 'Catch Pokémon from the Hoenn region.'
      }]
    }
  }),
  pinkpokeblock: assert<Recipe>({
    category: 'crafting',
    input: {
      mago: 4,
    },
    output: 'pinkpokeblock',
    unlocked: {
      hints: [{
        completed: (r) => r.berryGrown > 100,
        msg: 'Grow a bunch of berries to improve your gardening skills.'
      }, {
        completed: (r) => r.hiddenItemsFound.includes('vJHZReab8dpsCgz6ixJy'),
        msg: 'Catch Pokémon from the Hoenn region.'
      }]
    }
  }),
  greenpokeblock: assert<Recipe>({
    category: 'crafting',
    input: {
      aguav: 4,
    },
    output: 'greenpokeblock',
    unlocked: {
      hints: [{
        completed: (r) => r.berryGrown > 100,
        msg: 'Grow a bunch of berries to improve your gardening skills.'
      }, {
        completed: (r) => r.hiddenItemsFound.includes('vJHZReab8dpsCgz6ixJy'),
        msg: 'Catch Pokémon from the Hoenn region.'
      }]
    }
  }),
  yellowpokeblock: assert<Recipe>({
    category: 'crafting',
    input: {
      iapapa: 4,
    },
    output: 'yellowpokeblock',
    unlocked: {
      hints: [{
        completed: (r) => r.berryGrown > 100,
        msg: 'Grow a bunch of berries to improve your gardening skills.'
      }, {
        completed: (r) => r.hiddenItemsFound.includes('vJHZReab8dpsCgz6ixJy'),
        msg: 'Catch Pokémon from the Hoenn region.'
      }]
    }
  }),
  featherball: assert<Recipe>({
    category: 'crafting',
    input: {
      apricorn: 1,
      skytumblestone: 1,
    },
    output: 'featherball',
    unlocked: {
      hints: [{
        completed: requireType('Flying', 30),
        msg: 'Catch many Flying-type Pokémon.'
      }, {
        completed: requireType('Water', 30),
        msg: 'Catch many Water-type Pokémon.'
      }, {
        completed: simpleRequirePotwArr([
          P.Staraptor, P.Crobat, P.Togekiss, P.Magnezone, P.Honchkrow, P.Gyarados,
        ]),
        msg: 'Do you know of the great Flying Pokémon that once traversed the historic Sinnoh region?'
      }]
    }
  }),
  wingball: assert<Recipe>({
    category: 'crafting',
    input: {
      apricorn: 1,
      skytumblestone: 1,
      ironchunk: 1,
    },
    output: 'wingball',
    unlocked: {
      hints: [{
        completed: requireType('Flying', 75),
        msg: 'Catch many Flying-type Pokémon.'
      }, {
        completed: requireType('Water', 75),
        msg: 'Catch many Water-type Pokémon.'
      }, {
        completed: simpleRequirePotwArr([
          P.Staraptor, P.Crobat, P.Togekiss, P.Magnezone, P.Honchkrow, P.Gyarados,
        ]),
        msg: 'Do you know of the great Flying Pokémon that once traversed the historic Sinnoh region?'
      }]
    }
  }),
  jetball: assert<Recipe>({
    category: 'crafting',
    input: {
      apricorn: 1,
      skytumblestone: 1,
      ironchunk: 2,
    },
    output: 'jetball',
    unlocked: {
      hints: [{
        completed: requireType('Flying', 151),
        msg: 'Catch many Flying-type Pokémon.'
      }, {
        completed: requireType('Water', 151),
        msg: 'Catch many Water-type Pokémon.'
      }, {
        completed: simpleRequirePotwArr([
          P.Staraptor, P.Crobat, P.Togekiss, P.Magnezone, P.Honchkrow, P.Gyarados,
        ]),
        msg: 'Do you know of the great Flying Pokémon that once traversed the historic Sinnoh region?'
      }]
    }
  }),
  leadenball: assert<Recipe>({
    category: 'crafting',
    input: {
      apricorn: 1,
      blacktumblestone: 1,
      ironchunk: 1,
    },
    output: 'leadenball',
    unlocked: {
      hints: [{
        completed: requireType('Rock', 75),
        msg: 'Catch many Rock-type Pokémon.'
      }, {
        completed: requireType('Bug', 75),
        msg: 'Catch many Bug-type Pokémon.'
      }, {
        completed: simpleRequirePotwArr([
          P.Probopass, P.Bronzong, P.Golem, P.Avalugg, P.Garchomp, P.Sudowoodo, P.Glalie,
        ]),
        msg: 'Do you know of the great Pokémon that once lived beneath the historic Sinnoh region?'
      }]
    }
  }),
  gigatonball: assert<Recipe>({
    category: 'crafting',
    input: {
      apricorn: 1,
      blacktumblestone: 1,
      ironchunk: 2,
    },
    output: 'gigatonball',
    unlocked: {
      hints: [{
        completed: requireType('Rock', 151),
        msg: 'Catch many Rock-type Pokémon.'
      }, {
        completed: requireType('Bug', 151),
        msg: 'Catch many Bug-type Pokémon.'
      }, {
        completed: simpleRequirePotwArr([
          P.Probopass, P.Bronzong, P.Golem, P.Avalugg, P.Garchomp, P.Sudowoodo, P.Glalie,
        ]),
        msg: 'Do you know of the great Pokémon that once lived beneath the historic Sinnoh region?'
      }]
    }
  }),
  oldgateau: assert<Recipe>({
    category: 'crafting',
    input: {
      plumpbeans: 1,
      dazzlinghoney: 1,
      sootfootroot: 1,
      cakelurebase: 1,
    },
    output: 'oldgateau',
    unlocked: {
      hints: [{
        completed: (r) => r.hiddenItemsFound.includes('drIVxbAeXnuVuWCYWTf5'),
        msg: 'Obtain the DPPt Catching Charm'
      }]
    }
  }),
  jubilifemuffin: assert<Recipe>({
    category: 'crafting',
    input: {
      heartygrains: 2,
      hopo: 2,
      razz: 1,
      cakelurebase: 1,
    },
    output: 'jubilifemuffin',
    unlocked: {
      hints: [{
        completed: (r) => r.hiddenItemsFound.includes('drIVxbAeXnuVuWCYWTf5'),
        msg: 'Obtain the DPPt Catching Charm'
      }]
    }
  }),
  starpiece: assert<Recipe>({
    category: 'crafting',
    input: {
      stardust: 1,
      blueshard: 3,
      redshard: 3,
      greenshard: 3,
    },
    output: 'starpiece',
    unlocked: {
      hints: [{
        completed: (r) => r.hiddenItemsFound.includes('drIVxbAeXnuVuWCYWTf5'),
        msg: 'Obtain the DPPt Catching Charm'
      }]
    }
  }),
  choicedumpling: assert<Recipe>({
    category: 'crafting',
    input: {
      casterfern: 3,
      direshroom: 1,
      swordcap: 1,
      heartygrains: 2,
    },
    output: 'choicedumpling',
    unlocked: {
      hints: [{
        completed: (r) => r.hiddenItemsFound.includes('drIVxbAeXnuVuWCYWTf5'),
        msg: 'Obtain the DPPt Catching Charm'
      }]
    }
  }),
  swapsnack: assert<Recipe>({
    category: 'crafting',
    input: {
      candytruffle: 1,
      sootfootroot: 1,
      springymushroom: 1,
      hopo: 1,
    },
    output: 'swapsnack',
    unlocked: {
      hints: [{
        completed: (r) => r.hiddenItemsFound.includes('drIVxbAeXnuVuWCYWTf5'),
        msg: 'Obtain the DPPt Catching Charm'
      }]
    }
  }),
  twicespicedradish: assert<Recipe>({
    category: 'crafting',
    input: {
      sandradish: 1,
      crunchysalt: 1,
      plumpbeans: 1,
      kingsleaf: 1,
    },
    output: 'twicespicedradish',
    unlocked: {
      hints: [{
        completed: (r) => r.hiddenItemsFound.includes('drIVxbAeXnuVuWCYWTf5'),
        msg: 'Obtain the DPPt Catching Charm'
      }]
    }
  }),
  pokeshidoll: assert<Recipe>({
    category: 'crafting',
    input: {
      wood: 3,
    },
    output: 'pokeshidoll',
    unlocked: {
      hints: [{
        completed: (r) => r.hiddenItemsFound.includes('drIVxbAeXnuVuWCYWTf5'),
        msg: 'Obtain the DPPt Catching Charm'
      }]
    }
  }),
  dzfossil: assert<Recipe>({
    category: 'crafting',
    input: {
      drakefossil: 1,
      birdfossil: 1,
    },
    output: 'dzfossil',
    unlocked: {
      hints: [{
        completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_SWSH),
        msg: 'Obtain the SWSH Catching Charm'
      }, {
        completed: requireItem('explorerkit'),
        msg: 'Obtain the Explorer Kit',
      }]
    }
  }),
  dvfossil: assert<Recipe>({
    category: 'crafting',
    input: {
      drakefossil: 1,
      fishfossil: 1,
    },
    output: 'dvfossil',
    unlocked: {
      hints: [{
        completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_SWSH),
        msg: 'Obtain the SWSH Catching Charm'
      }, {
        completed: requireItem('explorerkit'),
        msg: 'Obtain the Explorer Kit',
      }]
    }
  }),
  azfossil: assert<Recipe>({
    category: 'crafting',
    input: {
      dinofossil: 1,
      birdfossil: 1,
    },
    output: 'azfossil',
    unlocked: {
      hints: [{
        completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_SWSH),
        msg: 'Obtain the SWSH Catching Charm'
      }, {
        completed: requireItem('explorerkit'),
        msg: 'Obtain the Explorer Kit',
      }]
    }
  }),
  avfossil: assert<Recipe>({
    category: 'crafting',
    input: {
      dinofossil: 1,
      fishfossil: 1,
    },
    output: 'avfossil',
    unlocked: {
      hints: [{
        completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_SWSH),
        msg: 'Obtain the SWSH Catching Charm'
      }, {
        completed: requireItem('explorerkit'),
        msg: 'Obtain the Explorer Kit',
      }]
    }
  }),
  'tm-000': craftTm('tm-Hyper Beam', [['tmm_dratini', 8], ['tmm_goomy', 5], ['tmm_tauros', 3]]),
  'tm-001': craftTm('tm-Solar Beam', [['tmm_bounsweet', 5], ['tmm_tropius', 3], ['tmm_foongus', 3]]),
  'tm-002': craftTm('tm-Ice Punch', [['tmm_meditite', 3], ['tmm_cubchoo', 3]]),
  'tm-003': craftTm('tm-Thunder Punch', [['tmm_meditite', 3], ['tmm_toxel', 3]]),
  // 'tm-004': craftTm('tm-Fire Punch', [['tmm_meditite', 3], ['charcadetsoot', 3]]),
  'tm-008': craftTm('tm-Double-Edge', [['tmm_rhyhorn', 4], ['tmm_tauros', 2]]),

  // 'tm-010': craftTm('tm-Dig', [['tmm_diglett', 3], ['greavardwax', 3], ['orthwormtarnish', 3]]),
  // 'tm-013': craftTm('tm-Thunderbolt', [['pachirisufur', 5], ['tadbulbmucus', 3], ['pichufur', 3]]),
  // 'tm-014': craftTm('tm-Mega Drain', [['capsakidseed', 3], ['hoppipleaf', 3], ['tmm_skiddo', 3]]),
  'tm-015': craftTm('tm-Sludge', [['tmm_croagunk', 5], ['tmm_grimer', 3], ['tmm_foongus', 3]]),
  'tm-017': craftTm('tm-Fire Blast', [['tmm_numel', 5], ['tmm_larvesta', 3], ['tmm_torkoal', 3]]),
  'tm-018': craftTm('tm-Earthquake', [['tmm_phanpy', 5], ['tmm_diglett', 3], ['tmm_barboach', 3]]),
  'tm-021': craftTm('tm-Mud-Slap', [['tmm_wooper', 3]]),
  'tm-024': craftTm('tm-Shadow Ball', [['tmm_gastly', 5], ['tmm_sandyghast', 3], ['tmm_sinistea', 3]]),
  'tm-027': craftTm('tm-Icy Wind', [['tmm_snom', 3], ['tmm_snover', 3]]),
  'tm-030': craftTm('tm-Swift', [['tmm_fletchling', 3]]),
  // 'tm-031': craftTm('tm-Rock Tomb', [['rockruffrock', 3], ['klawfclaw', 3]]),
  'tm-032': craftTm('tm-Focus Punch', [['tmm_timburr', 3], ['tmm_jangmoo', 3]]),
  // 'tm-034': craftTm('tm-Overheat', [['tmm_litleo', 5], ['tmm_numel', 3], ['capsakidseed', 3]]),
  // 'tm-035': craftTm('tm-Facade', [['tmm_komala', 3], ['tinkatinkhair', 3], ['stantlerhair', 3]]),
  'tm-036': craftTm('tm-Aerial Ace', [['tmm_starly', 3], ['tmm_fletchling', 3]]),
  'tm-038': craftTm('tm-Water Pulse', [['tmm_buizel', 3], ['tmm_magikarp', 3]]),
  // 'tm-039': craftTm('tm-Rock Slide', [['naclisalt', 3], ['rockruffrock', 3], ['tmm_bonsly', 3]]),
  // 'tm-041': craftTm('tm-Stone Edge', [['rolycolycoal', 5], ['rockruffrock', 3], ['klawfclaw', 3]]),
  // 'tm-042': craftTm('tm-Leaf Storm', [['tmm_bounsweet', 5], ['tmm_tropius', 3], ['toedscoolflaps', 3]]),
  'tm-043': craftTm('tm-Close Combat', [['tmm_riolu', 5], ['tmm_crabrawler', 3], ['tmm_makuhita', 3]]),
  'tm-045': craftTm('tm-Shadow Claw', [['tmm_mimikyu', 3], ['tmm_komala', 3]]),
  // 'tm-046': craftTm('tm-Flash Cannon', [['varoomfume', 3], ['impidimphair', 3], ['spiritombfragment', 3]]),
  'tm-048': craftTm('tm-Charge Beam', [['tmm_mareep', 3], ['tmm_dedenne', 3]]),
  // 'tm-050': craftTm('tm-Hyper Voice', [['tmm_litleo', 5], ['tandemausfur', 3], ['skwovetfur', 3]]),
  'tm-051': craftTm('tm-Sludge Wave', [['tmm_tentacool', 2], ['tmm_qwilfish', 2], ['tmm_gastly', 2]]),
 'tm-054': craftTm('tm-Electroweb', [['tmm_joltik', 5]]),
  'tm-055': craftTm('tm-Bulldoze', [['tmm_mudbray', 3], ['tmm_sandyghast', 3]]),
  // 'tm-060': craftTm('tm-Rock Blast', [['naclisalt', 3], ['chewtleclaw', 3]]),
  'tm-064': craftTm('tm-Petal Blizzard', [['tmm_oddish', 2], ['tmm_comfey', 2], ['tmm_cottonee', 1]]),
  // 'tm-066': craftTm('tm-Play Rough', [['fidoughfur', 5], ['tandemausfur', 3], ['tinkatinkhair', 3]]),
  'tm-067': craftTm('tm-Psyshock', [['tmm_meditite', 3], ['tmm_spoink', 3], ['tmm_drowzee', 3]]),
  'tm-070': craftTm('tm-Giga Impact', [['tmm_tauros', 8], ['tmm_zangoose', 5], ['tmm_slakoth', 3]]),
  // 'tm-072': craftTm('tm-Liquidation', [['tmm_arrokuda', 3], ['wiglettsand', 3], ['tmm_buizel', 3]]),
  'tm-074': craftTm('tm-Solar Blade', [['tmm_seedot', 4], ['tmm_sewaddle', 2]]),
  // 'tm-076': craftTm('tm-Phantom Force', [['tmm_sinistea', 5], ['shuppetscrap', 3], ['greavardwax', 3]]),
  // 'tm-077': craftTm('tm-Dragon Pulse', [['tmm_goomy', 5], ['swablufluff', 3], ['tatsugiriscales', 3]]),
  // 'tm-078': craftTm('tm-Dazzling Gleam', [['hatennadust', 3], ['swablufluff', 3], ['fidoughfur', 3]]),
  // 'tm-079': craftTm('tm-Fly', [['squawkabillyfeathre', 3], ['bombirdierfeather', 3], ['ruffletfeather', 3]]),
  'tm-090': craftTm('tm-Icicle Spear', [['tmm_swinub', 3], ['tmm_snorunt', 3]]),
  'tm-095': craftTm('tm-Fire Spin', [['tmm_growlithe', 3], ['tmm_torkoal', 3]]),
  'tm-096': craftTm('tm-Sand Tomb', [['tmm_sandshrew', 3], ['tmm_diglett', 2]]),
  // 'tm-100': craftTm('tm-Surf', [['finneonscales', 5], ['finizenmucus', 3], ['wiglettsand', 3]]),
  'tm-104': craftTm('tm-Whirlpool', [['tmm_horsea', 2], ['tmm_seel', 2], ['tmm_lapras', 1]]),
  'tm-106': craftTm('tm-Waterfall', [['tmm_magikarp', 5], ['tmm_basculin', 3], ['tmm_arrokuda', 3]]),
  'tm-110': craftTm('tm-Dark Pulse', [['tmm_zorua', 3], ['tmm_impidimp', 3], ['tmm_spiritomb', 3]]),
  'tm-111': craftTm('tm-Weather Ball', [['tmm_vulpix', 3], ['tmm_petilil', 3]]),
  // 'tr-001': craftTr('tr-Protect', [['lechonkhair', 3], ['tmm_scatterbug', 3]]),
  // 'tr-007': craftTr('tr-Thunder Wave', [['tmm_mareep', 3], ['pawmifur', 3]]),
  'tr-008': craftTr('tr-Metronome', [['tmm_igglybuff', 3], ['tmm_happiny', 3]]),
  'tr-010': craftTr('tr-Will-O-Wisp', [['tmm_salandit', 3], ['tmm_shuppet', 3]]),
  'tr-012': craftTr('tr-Confuse Ray', [['tmm_gastly', 3], ['tmm_mareep', 3]]),
  'tr-013': craftTr('tr-Bulk Up', [['tmm_makuhita', 3], ['tmm_axew', 3]]),
  'tr-014': craftTr('tr-Calm Mind', [['tmm_stantler', 3], ['tmm_indeedee', 3]]),
  // 'tr-015': craftTr('tr-Dragon Dance', [['tatsugiriscales', 3], ['tmm_gible', 3], ['noibatfur', 3]]),
  'tr-017': craftTr('tr-Frenzy Plant', [['tmm_tropius', 8], ['tmm_skiddo', 5], ['tmm_cacnea', 3]]),
  // 'tr-018': craftTr('tr-Blast Burn', [['houndourfang', 8], ['charcadetsoot', 5], ['tmm_growlithe', 3]]),
  // 'tr-019': craftTr('tr-Hydro Cannon', [['qwilfishspines', 8], ['dondozowhisker', 5], ['luvdiscscales', 3]]),
  // 'tr-020': craftTr('tr-Draco Meteor', [['tmm_goomy', 8], ['frigibaxscales', 5], ['applinjuice', 3]]),
  'tr-021': craftTr('tr-Swords Dance', [['tmm_zangoose', 3], ['tmm_gible', 3], ['tmm_scyther', 3]]),
  'tr-022': craftTr('tr-Iron Defense', [['tmm_bronzor', 3], ['tmm_pineco', 3]]),
  // 'tr-023': craftTr('tr-Nasty Plot', [['tmm_meowth', 3], ['spiritombfragment', 3], ['tatsugiriscales', 3]]),
  'tr-024': craftTr('tr-Amnesia', [['tmm_slowpoke', 3], ['tmm_slakoth', 3]]),
  'tr-025': craftTr('tr-Agility', [['tmm_fletchling', 3], ['tmm_oricorio', 3]]),
  'tr-026': craftTr('tr-Feather Dance', [['tmm_pikipek', 3], ['tmm_murkrow', 2]]),
  'tr-029': craftTr('tr-Metal Sound', [['tmm_magnemite', 2], ['tmm_elekid', 2], ['tmm_shieldon', 2]]),
  'tr-032': craftTr('tr-Hail', [['tmm_snover', 3], ['tmm_delibird', 3], ['tmm_snom', 3]]),
  'tr-033': craftTr('tr-Sunny Day', [['tmm_sunkern', 3], ['tmm_torkoal', 3], ['tmm_litleo', 3]]),
  // 'tr-034': craftTr('tr-Rain Dance', [['shellosmucus', 3], ['azurillfur', 3], ['wattrelfeather', 3]]),
  'tr-035': craftTr('tr-Sandstorm', [['tmm_hippopotas', 3], ['tmm_silicobra', 3], ['tmm_sandyghast', 3]]),
  // 'tr-036': craftTr('tr-Reflect', [['tmm_drowzee', 3], ['flittledown', 3]]),
  'tr-037': craftTr('tr-Light Screen', [['tmm_magnemite', 3], ['tmm_voltorb', 3]]),
  'tr-039': craftTr('tr-Haze', [['tmm_feebas', 2]]),
  'tr-046': craftTr('tr-Charm', [['azurillfur', 3], ['teddiursaclaw', 3]]),
  'tr-052': craftTr('tr-Switcheroo', [['tmm_shuppet', 3], ['tmm_sableye', 3], ['tmm_sinistea', 3]]),
  'tr-053': craftTr('tr-Trick Room', [['tmm_hatenna', 3], ['tmm_bronzor', 3], ['tmm_gothita', 3]]),
  // 'tr-054': craftTr('tr-Tailwind', [['ruffletfeather', 3], ['rookideefeather', 3], ['bombirdierfeather', 3]]),
  'tr-056': craftTr('tr-Endeavor', [['tmm_snubbull', 3], ['tmm_tauros', 3]]),
  'tr-059': craftTr('tr-Knock Off', [['tmm_corphish', 4], ['tmm_seedot', 4]]),
  'tr-060': craftTr('tr-Substitute', [['tmm_mimikyu', 3], ['azurillfur', 3], ['tmm_falinks', 3]]),
  'tr-077': craftTr('tr-Endure', [['tmm_scatterbug', 3]]),
  'tr-079': craftTr('tr-Imprison', [['tmm_bronzor', 3], ['tmm_zorua', 3]]),
  // 'tr-080': craftTr('tr-Electric Terrain', [['pincurchinspines', 3], ['tadbulbmucus', 3], ['pawmifur', 3]]),
  'tr-081': craftTr('tr-Grassy Terrain', [['tmm_flabebe', 3], ['tmm_sunkern', 3], ['tmm_fomantis', 3]]),
  'tr-082': craftTr('tr-Misty Terrain', [['tmm_klefki', 3], ['tmm_igglybuff', 3], ['tmm_flabebe', 3]]),
  'tr-083': craftTr('tr-Psychic Terrain', [['tmm_slowpoke', 3], ['tmm_indeedee', 3], ['tmm_drowzee', 3]]),
  'tr-088': craftTr('tr-Taunt', [['tmm_meowth', 3], ['tmm_sableye', 3], ['tmm_sneasel', 3]]),
  'tr-090': craftTr('tr-Fake Tears', [['tmm_bonsly', 3], ['teddiursaclaw', 3]]),
  // CURRY: https://www.serebii.net/swordshield/currydex.shtml
  c_spicysauage: craftCurry({sausages: 1, tanga: 3}, 'curryspicysausage', 'Fire', 'Spicy Sausages'),
  c_dryjuicy: craftCurry({bobsfoodtin: 1, charti: 3}, 'currydryjuicy', 'Water', 'Dry Juicy Curry'),
  c_sweetrich: craftCurry({bachsfoodtin: 1, kasib: 3}, 'currysweetrich', 'Fairy', 'Sweet Rich Curry'),
  c_bitterbean: craftCurry({tinofbeans: 1, haban: 3}, 'currybitterbean', 'Ground', 'Bitter Beans'),
  c_sourtoast: craftCurry({bread: 1, colbur: 3}, 'currysourtoast', 'Flying', 'Sour Toast'),
  c_spicypasta: craftCurry({pasta: 1, babiri: 3}, 'curryspicypasta', 'Rock', 'Spicy Pasta'),
  c_drymushroom: craftCurry({mixedmushrooms: 1, chilan: 3}, 'currydrymushroom', 'Poison', 'Dry Mushroom Curry'),
  c_sweetsmokedtail: craftCurry({smokepoketail: 1, roseli: 3}, 'currysweetsmokedtail', 'Psychic', 'Sweet Smoked-Tail Curry'),
  c_bitterleek: craftCurry({largeleek: 1, ganlon: 3}, 'currybitterleek', 'Fighting', 'Bitter Leek Curry'),
  c_sourapple: craftCurry({fancyapple: 1, salac: 3}, 'currysourapple', 'Dragon', 'Sour Apple Curry'),
  c_spicybone: craftCurry({brittlebones: 1, cheri: 3}, 'curryspicybone', 'Ghost', 'Spicy Bone Curry'),
  c_dryplentyofpotato: craftCurry({packofpotatoes: 1, chesto: 3}, 'currydryplentyofpotato', 'Normal', 'Dry Plenty-of-Potato Curry'),
  c_sweetherb: craftCurry({pungentroot: 1, pecha: 3}, 'currysweetherb', 'Bug', 'Sweet Herb Medley Curry'),
  c_bittersalad: craftCurry({saladmix: 1, rawst: 3}, 'currybittersalad', 'Grass', 'Bitter Salad Curry'),
  c_sourfriedfood: craftCurry({friedfood: 1, aspear: 3}, 'currysourfriedfood', 'Electric', 'Sour Fried-Food'),
  c_spicyboiledegg: craftCurry({boiledegg: 1, leppa: 3}, 'curryspicyboiledegg', 'Dark', 'Spicy Boiled-Egg'),
  c_drytropical: craftCurry({fruitbunch: 1, oran: 3}, 'currydrytropical', 'Ice', 'Dry Tropical Curry'),
  c_sweetcheesecovered: craftCurry({moomoocheese: 1, lum: 3}, 'currysweetcheesecovered', 'Steel', 'Sweet Cheese-Covered Curry'),
  c_bitterseasoned: craftCurryRare({spicemix: 1, sitrus: 5}, 'currybitterseasoned', 'Bulky', 'Bitter Seasoned Curry'),
  c_sourwhippedcream: craftCurryRare({freshcream: 1, persim: 5}, 'currysourwhippedcream', 'Spongy', 'Sour Whipped-Cream Curry'),
  c_spicydecorative: craftCurryRare({packagedcurry: 1, figy: 5}, 'curryspicydecorative', 'Fast', 'Spicy Decorative Curry'),
  c_drycoconut: craftCurryRare({coconutmilk: 1, wiki: 5}, 'currydrycoconut', 'Wary', 'Dry Coconut Curry'),
  c_sweetinstantnoodle: craftCurryRare({instantnoodles: 1, mago: 5}, 'currysweetinstantnoodle', 'Magical', 'Sweet Instant Noodles'),
  c_bitterburgersteak: craftCurryRare({precookedburger: 1, aguav: 5}, 'currybitterburgersteak', 'Strong', 'Bitter Burger-Steak'),
  c_gigantamax: craftCurryRare({gigantamix: 1, cheri: 1, chesto: 1, pecha: 1, rawst: 1, aspear: 1}, 'currygigantamax', 'Gigantamax', 'Gigantamax Curry'),
  poffinspicy: craftPoffin({cheri: 3, spelon: 1}, 'poffinspicy'),
  poffindry: craftPoffin({chesto: 3, micle: 1}, 'poffindry'),
  poffinsweet: craftPoffin({pecha: 3, cutsap: 1}, 'poffinsweet'),
  poffinbitter: craftPoffin({rawst: 3, jaboca: 1}, 'poffinbitter'),
  poffinsour: craftPoffin({aspear: 3, rowap: 1}, 'poffinsour'),
  // Cherry on top, cuteness, pink color
  pokepuffsweet: craftPokepuff({cheri: 1, magost: 1, nanab: 2}, 'pokepuffsweet'),
  // Charti on top, cleverness, green color
  pokepuffmint: craftPokepuff({charti: 1, watmel: 1, wepear: 2}, 'pokepuffmint'),
  // Sitrus on top, toughness, yellow color
  pokepuffcitrus: craftPokepuff({pinap: 2, nomel: 1, sitrus: 1}, 'pokepuffcitrus'),
  // Coolness, lansat on top, red/brown color
  pokepuffmocha: craftPokepuff({lansat: 1, spelon: 1, razz: 2}, 'pokepuffmocha'),
  // Petaya on top, dark/blue color
  pokepuffspice: craftPokepuff({petaya: 1, bluk: 2, belue: 1}, 'pokepuffspice'),
  cakebean: craftHisuiCake('plumpbeans', 'cakebean'),
  cakegrain: craftHisuiCake('heartygrains', 'cakegrain'),
  cakehoney: craftHisuiCake('dazzlinghoney', 'cakehoney'),
  cakemushroom: craftHisuiCake('springymushroom', 'cakemushroom'),
  cakesalt: craftHisuiCake('crunchysalt', 'cakesalt'),
  // Unavailable
  sandwichcheese: craftPaldeanSandwich(['svicheese', 'svccreamcheese', 'svcpepper', 'svcsalt'], 'svscheese'),
  sandwichtofu: craftPaldeanSandwich(['svitofu', 'svitofu', 'svirice', 'svilettuce', 'sviavocado', 'svcwasabi', 'svcsalt'], 'svstofu'),
  sandwichherbsausage: craftPaldeanSandwich(['svisausage', 'svcketchup'], 'svsherbsausage'),
  sandwichegg: craftPaldeanSandwich(['sviegg', 'svicucumber', 'svcsalt', 'svcmayonnaise'], 'svsegg'),
  sandwichpickle: craftPaldeanSandwich(['svipickle', 'svcoliveoil'], 'svspickle'),
  sandwichnoodle: craftPaldeanSandwich(['svinoodles', 'svcoliveoil', 'svcketchup'], 'svsnoodle'),
  sandwichnouveau: craftPaldeanSandwich(['sviwatercress', 'svibellpepperyellow', 'svionion', 'svitomato', 'svcoliveoil', 'svcwasabi'], 'svsnouveau'),
  sandwichpotatosalad: craftPaldeanSandwich(['svipotatosalad', 'svicucumber', 'svibellpepperred', 'sviavocado', 'svcmayonnaise'], 'svspotatosalad'),
  sandwichsmoky: craftPaldeanSandwich(['svismokedfillet', 'sviwatercress', 'svcvinegar', 'svcsalt', 'svcpepper'], 'svssmoky'),
  sandwichsushi: craftPaldeanSandwich(['svirice', 'svismokedfillet', 'svismokedfillet', 'sviklawfstick', 'svcsalt', 'svcvinegar', 'svcwasabi'], 'svssushi'),
  sandwichhamburger: craftPaldeanSandwich(['svihamburger', 'svionion', 'svcvinegar', 'svcpepper'], 'svshamburger'),
  sandwichhefty: craftPaldeanSandwich(['svitortilla', 'svifriedfillet', 'sviprosciutto', 'svipotatosalad', 'svcsalt', 'svcpeanutbutter'], 'svshefty'),
  sandwichvegetable: craftPaldeanSandwich(['svibellpeppergreen', 'svicherrytomato', 'svicucumber', 'svcsalt', 'svcoliveoil', 'svcvinegar'], 'svsvegetable'),
  sandwichklawf: craftPaldeanSandwich(['sviklawfstick', 'svitomato', 'svilettuce', 'svcsalt', 'svcoliveoil'], 'svsklawf'),
  sandwichdecadent: craftPaldeanSandwich(['svismokedfillet', 'sviklawfstick', 'sviwatercress', 'svibasil', 'svcvinegar', 'svcoliveoil', 'svcsalt'], 'svsdecadent'),
  sandwichavocado: craftPaldeanSandwich(['sviavocado', 'svismokedfillet', 'svcsalt'], 'svsavocado'),
  sandwichjambon: craftPaldeanSandwich(['sviham', 'svcbutter'], 'svsjambon'),
  sandwichblt: craftPaldeanSandwich(['svibacon', 'svilettuce', 'svitomato', 'svcmayonnaise', 'svcmustard'], 'svsblt'),
  sandwichuvariety: craftPaldeanSandwich(['sviprosciutto', 'svicherrytomato', 'svismokedfillet', 'svipotatosalad', 'svihamburger', 'svcsalt', 'svcvinegar', 'svhmsweet', 'svhmsalty'], 'svsuvariety'),
  sandwichutower: craftPaldeanSandwich(['svihamburger', 'svinoodles', 'svipotatosalad', 'svirice', 'sviklawfstick', 'svitofu', 'svcoliveoil', 'svcsalt', 'svccurrypowder', 'svhmsour', 'svhmbitter'], 'svsutower'),
  sandwichurefreshing: craftPaldeanSandwich(['svicherrytomato', 'sviavocado', 'svikiwi', 'svipickle', 'svcmarmalade', 'svcsalt', 'svhmspicy', 'svhmsweet'], 'svsurefreshing'),
  sandwichuegg: craftPaldeanSandwich(['sviegg', 'svicucumber', 'svionionred', 'svicheese', 'svcsalt', 'svcmayonnaise', 'svhmsalty', 'svhmsour'], 'svsuegg'),
  sandwichcurryrice: craftPaldeanSandwich(['svirice', 'svijalapeno', 'svitomato', 'svccurrypowder', 'svcmayonnaise', 'svhmbitter', 'svhmspicy'], 'svscurryrice'),
  sandwichumarmalade: craftPaldeanSandwich(['svicheese', 'svcmarmalade', 'svcbutter', 'svccreamcheese', 'svhmsweet', 'svhmsour'], 'svsumarmalade'),
  sandwichunouveau: craftPaldeanSandwich(['sviwatercress', 'svibellpepperyellow', 'svionion', 'svitomato', 'svicucumber', 'svcoliveoil', 'svcwasabi', 'svcmayonnaise', 'svhmsweet', 'svhmbitter'], 'svsunouveau'),
  sandwichuhefty: craftPaldeanSandwich(['svitortilla', 'svifriedfillet', 'sviprosciutto', 'svipotatosalad', 'svisausage', 'svihamburger', 'svcsalt', 'svcpeanutbutter', 'svhmsweet', 'svhmspicy'], 'svsuhefty'),
  sandwichubocadillo: craftPaldeanSandwich(['sviwatercress', 'svibellpepperyellow', 'svionion', 'svitomato', 'svicucumber', 'svcoliveoil', 'svcwasabi', 'svcmayonnaise', 'svhmsalty', 'svhmbitter'], 'svsunouveau'),
  sandwichudecadent: craftPaldeanSandwich(['svismokedfillet', 'sviklawfstick', 'sviwatercress', 'svibasil', 'svibasil', 'svitofu', 'svionionred', 'svcvinegar', 'svcoliveoil', 'svcsalt', 'svhmsalty', 'svhmspicy'], 'svsudecadent'),
  sandwichuhamburger: craftPaldeanSandwich(['svihamburger', 'svionion', 'sviwatercress', 'svcvinegar', 'svcpepper', 'svchorseradish', 'svhmsour', 'svhmspicy'], 'svsuhamburger'),
  sandwichucurrynoodle: craftPaldeanSandwich(['svihamburger', 'svinoodles', 'svipotatosalad', 'svirice', 'sviklawfstick', 'svitofu', 'svcoliveoil', 'svcsalt', 'svccurrypowder', 'svhmsweet', 'svhmsalty'], 'svsutower'),
  sandwichuzesty: craftPaldeanSandwich(['svijalapeno', 'svionion', 'svisausage', 'svibellpeppergreen', 'sviwatercress', 'svcchilisauce', 'svhmsweet', 'svhmsour'], 'svsuzesty'),
  sandwichlbitter: craftPaldeanSandwich(['svilettuce', 'svilettuce', 'svibacon', 'svibacon', 'svcpepper', 'svhmsweet', 'svhmspicy'], 'svslbitter'),
  sandwichusushi: craftPaldeanSandwich(['svirice', 'svismokedfillet', 'svismokedfillet', 'sviklawfstick', 'sviklawfstick', 'sviwatercress', 'svcsalt', 'svcvinegar', 'svcwasabi', 'svhmsweet', 'svhmbitter'], 'svsusushi'),
  sandwichuklawf: craftPaldeanSandwich(['sviklawfstick', 'svitomato', 'svilettuce', 'svibellpepperyellow', 'svcsalt', 'svcoliveoil', 'svcwasabi', 'svhmsalty', 'svhmsour'], 'svsuklawf'),
  sandwichuspicysweet: craftPaldeanSandwich(['svihamburger', 'svitomato', 'svikiwi', 'svipineapple', 'sviavocado', 'svicheese', 'svcbutter', 'svchorseradish', 'svhmsalty', 'svhmbitter'], 'svsuspicysweet'),
  sandwichublt: craftPaldeanSandwich(['svibacon', 'svilettuce', 'svitomato', 'svibasil', 'svicheese', 'svcmayonnaise', 'svcmustard', 'svhmsalty', 'svhmspicy'], 'svsublt'),
  sandwichpb: craftPaldeanSandwich(['svibanana', 'svcpeanutbutter', 'svcjam'], 'svspb'),
  sandwichupickle: craftPaldeanSandwich(['svipickle', 'sviwatercress', 'svibasil', 'svcoliveoil'], 'svsupickle'),
  sandwichdessert: craftPaldeanSandwich(['sviapple', 'sviapple', 'svcyogurt', 'svcwhippedcream'], 'svsdessert'),
  sandwichufruit: craftPaldeanSandwich(['svibanana', 'sviapple', 'svipineapple', 'svikiwi', 'svcwhippedcream', 'svcmarmalade', 'svcyogurt', 'svhmsalty', 'svhmspicy'], 'svsufruit'),
  sandwichufivealarm: craftPaldeanSandwich(['svichorizo', 'svionion', 'svibellpeppergreen', 'svibasil', 'svijalapeno', 'svcmustard', 'svcchilisauce', 'svcpepper', 'svhmsour', 'svhmbitter'], 'svsufivealarm'),
  sandwichudessert: craftPaldeanSandwich(['sviapple', 'sviapple', 'svikiwi', 'svistrawberry', 'svcyogurt', 'svcwhippedcream', 'svhmsour', 'svhmspicy'], 'svsudessert'),
  // https://www.serebii.net/pokemonsleep/dishes.shtml
  sleepslowpoke: craftSleepSalad({sleepislowpoke: 3, sleepifieryherb: 3, sleepipureoil: 5}, 'sleepsslowpoke'),
  sleepsmushroom: craftSleepSalad({sleepimushroom: 6, sleepitomato: 3, sleepipureoil: 3}, 'sleepsmushroom'),
  sleepssnowcloak: craftSleepSalad({sleepimilk: 5, sleepibeansausage: 3}, 'sleepssnowcloak'),
  sleepsgluttony: craftSleepSalad({sleepipotato: 6, boiledegg: 3, fancyapple: 1, sleepibeansausage: 1}, 'sleepsgluttony'),
  sleepswaterveil: craftSleepSalad({sleepisoybeans: 5, sleepitomato: 3}, 'sleepswaterveil'),
  sleepssuperpower: craftSleepSalad({sleepibeansausage: 5, sleepiginger: 3, boiledegg: 2, sleepipotato: 1}, 'sleepssuperpower'),
  sleepsbeanham: craftSleepSalad({sleepibeansausage: 8}, 'sleepsbeanham'),
  sleepstomato: craftSleepSalad({sleepitomato: 8}, 'sleepstomato'),
  sleepscaprese: craftSleepSalad({sleepimilk: 6, sleepitomato: 3, sleepipureoil: 2}, 'sleepscaprese'),
  sleepschocolate: craftSleepSalad({sleepicacao: 7, sleepibeansausage: 4}, 'sleepschocolate'),
  sleepsginger: craftSleepSalad({sleepifieryherb: 5, sleepiginger: 3, sleepitomato: 2}, 'sleepsginger'),
  sleepsapple: craftSleepSalad({fancyapple: 8}, 'sleepsapple'),
  sleepsleek: craftSleepSalad({largeleek: 5, sleepiginger: 3}, 'sleepsleek'),
  sleepsapplecheese: craftSleepSalad({fancyapple: 5, sleepimilk: 2, sleepipureoil: 1}, 'sleepsapplecheese'),
  sleepsninja: craftSleepSalad({largeleek: 4, sleepisoybeans: 4, sleepimushroom: 2, sleepiginger: 2}, 'sleepsninja'),
  sleepsheatwave: craftSleepSalad({sleepisoybeans: 5, sleepifieryherb: 3}, 'sleepsheatwave'),
}

export type RecipeId = keyof typeof Recipes
