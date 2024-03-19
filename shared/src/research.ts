/**
 * @fileoverview Module containing every research task metadata and conditions.
 * Makes it easy to get one at random, also allows for retiring/too soon quests
 * Maybe one day have specially timed research (one week)
 * Maybe one day have advanced research based on number completed
 */
import * as P from './gen/type-pokemon'
import * as Pkmn from './pokemon'
import * as Sprite from './sprites'
import {regions} from './pokedex'
import { ItemId } from "./items-list";
import { BadgeId, Type } from "./pokemon/types";
import { TeamsBadge } from "./badge2";
import { getTidesByLocation, Location, timeOfDay } from './locations-list';
import { weekly } from './platform/weekly';

export type ResearchOrigin = 'gen2' | 'gen3' | 'gen4' | 'gen5' | 'gen6' | 'gen7' |
  'gen8' | 'gen8-pla' | 'gen9'

export interface ResearchParams {
  capturedPokemon?: BadgeId
  location?: Location
  item?: ItemId
}

/**
 * Represents a particular research quest for Professor Birch.
 */
export interface ResearchQuest {
  title: string
  steps: number
  prize: ItemId[]
  icon: string
  level: number
  active: boolean
  origin: ResearchOrigin
  completedStep: (params: ResearchParams) => boolean
}

const LEVEL = {
  L1: 0,
  L2: 30,
  L3: 60,
  L4: 90,
  L5: 120,
  L6: 150,
  L7: 180,
  L8: 210,
  L9: 270, // +60 for +PLA
}

// Quests only go up to this level
export const LEVEL_MAX = 9

const PRIZES_SIMPLE: ItemId[] = [
  'premierball'
]

function completeForSimple(badge: BadgeId) {
  return ({capturedPokemon}) => {
    if (!capturedPokemon) return false
    const simple = new TeamsBadge(capturedPokemon).toSimple()
    return simple === badge
  }
}

function catchSpecificType(type: Type, level: number): ResearchQuest {
  return {
    title: `Catch a ${type}-type Pokémon`,
    steps: 1,
    icon: Sprite.item('premierball'),
    prize: PRIZES_SIMPLE,
    level,
    active: true,
    origin: 'gen3',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const pkmn = Pkmn.get(capturedPokemon)!
      return pkmn.type1 === type || pkmn.type2 === type
    }
  }
}

function catchTypeForPlate(type: Type, item: ItemId): ResearchQuest {
  return {
    title: `Catch 3 ${type}-type Pokémon`,
    steps: 3,
    icon: Sprite.item(item),
    prize: [item],
    level: LEVEL.L2,
    active: true,
    origin: 'gen4',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const pkmn = Pkmn.get(capturedPokemon)!
      return pkmn.type1 === type || pkmn.type2 === type
    }
  }
}

function catchTypeForGem(type: Type, item: ItemId): ResearchQuest {
  return {
    title: `Catch 7 ${type}-type Pokémon`,
    steps: 7,
    icon: Sprite.item(item),
    prize: [item],
    level: LEVEL.L5,
    active: true,
    origin: 'gen5',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const pkmn = Pkmn.get(capturedPokemon)!
      return pkmn.type1 === type || pkmn.type2 === type
    }
  }
}

const QUEST_CAPTURE: Record<string, ResearchQuest> = {
  CATCH3: {
    title: 'Catch 3 Pokémon',
    steps: 3,
    icon: Sprite.item('pokeball'),
    prize: PRIZES_SIMPLE,
    level: LEVEL.L1,
    active: true,
    origin: 'gen3',
    completedStep: ({capturedPokemon}) => {
      return capturedPokemon !== undefined
    },
  },
  CATCH_GREAT: {
    title: 'Catch a Pokémon with a Great Ball',
    steps: 1,
    icon: Sprite.item('greatball'),
    prize: PRIZES_SIMPLE,
    level: LEVEL.L1,
    active: true,
    origin: 'gen3',
    completedStep: ({item}) => {
      return item === 'greatball'
    },
  },
}

const QUEST_POKEMON: Record<string, ResearchQuest> = {
  CATCHERPIE: {
    title: 'Catch a Caterpie',
    steps: 1,
    icon: Sprite.pkmn(P.Caterpie),
    prize: PRIZES_SIMPLE,
    level: LEVEL.L1,
    active: true,
    origin: 'gen3',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const simple = new TeamsBadge(capturedPokemon).toSimple()
      return simple === P.Caterpie
    },
  },
  SAFARI: {
    title: 'Catch 5 Normal-type Pokémon',
    steps: 5,
    icon: Sprite.item('safariball'),
    prize: ['safariball'],
    level: LEVEL.L1,
    active: true,
    origin: 'gen3',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const pkmn = Pkmn.get(capturedPokemon)!
      return pkmn.type1 === 'Normal' || pkmn.type2 === 'Normal'
    },
  },
  KINGSROCK: {
    title: 'Catch 5 Poliwhirl or Slowpoke',
    steps: 5,
    icon: Sprite.item('kingsrock'),
    prize: ['kingsrock'],
    level: LEVEL.L2,
    active: true,
    origin: 'gen3',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const simple = new TeamsBadge(capturedPokemon).toSimple()
      return simple === P.Poliwhirl ||
        simple === P.Slowpoke
    }
  },
  METALCOAT: {
    title: 'Catch 5 Onix or Scyther',
    steps: 5,
    icon: Sprite.item('metalcoat'),
    prize: ['metalcoat'],
    level: LEVEL.L2,
    active: true,
    origin: 'gen3',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const simple = new TeamsBadge(capturedPokemon).toSimple()
      return simple === P.Onix ||
      simple === P.Scyther
    }
  },
  DRAGONSCALE: {
    title: 'Catch 5 Horsea or Seadra',
    steps: 5,
    icon: Sprite.item('dragonscale'),
    prize: ['dragonscale'],
    level: LEVEL.L2,
    active: true,
    origin: 'gen3',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const simple = new TeamsBadge(capturedPokemon).toSimple()
      return simple === P.Horsea ||
        simple === P.Seadra
    }
  },
  UPGRADE: {
    title: 'Catch 5 Porygon',
    steps: 5,
    icon: Sprite.item('upgrade'),
    prize: ['upgrade'],
    level: LEVEL.L2,
    active: true,
    origin: 'gen3',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const simple = new TeamsBadge(capturedPokemon).toSimple()
      return simple === P.Porygon
    }
  },
  BUGCATCHER: {
    title: 'Catch 5 Bug-type Pokémon',
    steps: 5,
    icon: Sprite.item('competitionball'),
    prize: ['competitionball'],
    level: LEVEL.L2,
    active: true,
    origin: 'gen3',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const pkmn = Pkmn.get(capturedPokemon)!
      return pkmn.type1 === 'Bug' || pkmn.type2 === 'Bug'
    }
  },
  VITAMIN1: {
    title: 'Catch 5 Fighting-type Pokémon',
    steps: 5,
    icon: Sprite.item('protein'),
    prize: ['protein'],
    level: LEVEL.L2,
    active: true,
    origin: 'gen3',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const pkmn = Pkmn.get(capturedPokemon)!
      return pkmn.type1 === 'Fighting' || pkmn.type2 === 'Fighting'
    }
  },
  VITAMIN2: {
    title: 'Catch 5 Fighting-type Pokémon',
    steps: 5,
    icon: Sprite.item('iron'),
    prize: ['iron'],
    level: LEVEL.L2,
    active: true,
    origin: 'gen3',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const pkmn = Pkmn.get(capturedPokemon)!
      return pkmn.type1 === 'Fighting' || pkmn.type2 === 'Fighting'
    }
  },
  VITAMIN3: {
    title: 'Catch 5 Fighting-type Pokémon',
    steps: 5,
    icon: Sprite.item('carbos'),
    prize: ['carbos'],
    level: LEVEL.L2,
    active: true,
    origin: 'gen3',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const pkmn = Pkmn.get(capturedPokemon)!
      return pkmn.type1 === 'Fighting' || pkmn.type2 === 'Fighting'
    }
  },
  MOON: {
    title: 'Catch 3 moon Pokémon',
    steps: 3,
    icon: Sprite.item('moonstone'),
    prize: ['moonstone'],
    level: LEVEL.L3,
    active: true,
    origin: 'gen3',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const simple = new TeamsBadge(capturedPokemon).toSimple()
      return [
        P.Clefairy, P.Jigglypuff, P.Nidorino, P.Nidorina, P.Lunatone, P.Skitty
      ].includes(simple)
    }
  },
  SUN: {
    title: 'Catch 3 sun Pokémon',
    steps: 3,
    icon: Sprite.item('sunstone'),
    prize: ['sunstone'],
    level: LEVEL.L3,
    active: true,
    origin: 'gen3',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const simple = new TeamsBadge(capturedPokemon).toSimple()
      return [
        P.Gloom, P.Sunkern, P.Solrock,
      ].includes(simple)
    }
  },
  DUSK: {
    title: 'Catch 10 Dark-type Pokémon',
    steps: 10,
    icon: Sprite.item('duskstone'),
    prize: ['duskstone'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen4',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const pkmn = Pkmn.get(capturedPokemon)!
      return pkmn.type1 === 'Dark' || pkmn.type2 === 'Dark'
    }
  },
  // Kept key as 'DAWN' for backwards-compat
  DAWN: {
    title: 'Catch 10 Fairy-type Pokémon',
    steps: 10,
    icon: Sprite.item('shinystone'),
    prize: ['shinystone'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen4',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const pkmn = Pkmn.get(capturedPokemon)!
      return pkmn.type1 === 'Fairy' || pkmn.type2 === 'Fairy'
    }
  },
  DAWN2: {
    title: 'Catch 10 Snorunt, Ralts, or Kirlia',
    steps: 10,
    icon: Sprite.item('dawnstone'),
    prize: ['dawnstone'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen4',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const simple = new TeamsBadge(capturedPokemon).toSimple()
      return [
        P.Snorunt, P.Ralts, P.Kirlia,
      ].includes(simple)
    }
  },
  ELECTABUZZ: {
    title: 'Catch 10 Electabuzz',
    steps: 10,
    icon: Sprite.item('electirizer'),
    prize: ['electirizer'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen4',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const simple = new TeamsBadge(capturedPokemon).toSimple()
      return simple === P.Electabuzz
    }
  },
  MAGMAR: {
    title: 'Catch 10 Magmar',
    steps: 10,
    icon: Sprite.item('magmarizer'),
    prize: ['magmarizer'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen4',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const simple = new TeamsBadge(capturedPokemon).toSimple()
      return simple === P.Magmar
    }
  },
  DUSCLOPS: {
    title: 'Catch 10 Duskull or Dusclops',
    steps: 10,
    icon: Sprite.item('reapercloth'),
    prize: ['reapercloth'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen4',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const simple = new TeamsBadge(capturedPokemon).toSimple()
      return simple === P.Dusclops ||
        simple === P.Duskull
    }
  },
  RHYDON: {
    title: 'Catch 10 Rhyhorn or Rhydon',
    steps: 10,
    icon: Sprite.item('protector'),
    prize: ['protector'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen4',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const simple = new TeamsBadge(capturedPokemon).toSimple()
      return simple === P.Rhyhorn ||
        simple === P.Rhydon
    }
  },
  DUBIOUS: {
    title: 'Catch 10 Porygon',
    steps: 10,
    icon: Sprite.item('dubiousdisc'),
    prize: ['dubiousdisc'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen4',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const simple = new TeamsBadge(capturedPokemon).toSimple()
      return simple === P.Porygon
    }
  },
  RAZORCLAW: {
    title: 'Catch 10 Sneasel',
    steps: 10,
    icon: Sprite.item('razorclaw'),
    prize: ['razorclaw'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen4',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const simple = new TeamsBadge(capturedPokemon).toSimple()
      return simple === P.Sneasel
    }
  },
  RAZORFANG: {
    title: 'Catch 10 Gligar',
    steps: 10,
    icon: Sprite.item('razorfang'),
    prize: ['razorfang'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen4',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const simple = new TeamsBadge(capturedPokemon).toSimple()
      return simple === P.Gligar
    }
  },
  PEARLSTONE: {
    title: 'Catch 3 Sinnoh starters',
    steps: 3,
    icon: Sprite.item('lustrousorb'),
    prize: ['lustrousorb'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen4',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const simple = new TeamsBadge(capturedPokemon).toSimple()
      return [
        P.Turtwig, P.Grotle, P.Torterra,
        P.Chimchar, P.Monferno, P.Infernape,
        P.Piplup, P.Prinplup, P.Empoleon,
      ].includes(simple)
    }
  },
  DIAMONDSTONE: {
    title: 'Catch 3 Sinnoh starters',
    steps: 3,
    icon: Sprite.item('adamantorb'),
    prize: ['adamantorb'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen4',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const simple = new TeamsBadge(capturedPokemon).toSimple()
      return [
        P.Turtwig, P.Grotle, P.Torterra,
        P.Chimchar, P.Monferno, P.Infernape,
        P.Piplup, P.Prinplup, P.Empoleon,
      ].includes(simple)
    }
  },
  DREAMBALL: {
    title: 'Catch 7 Sleepy Pokémon',
    steps: 7,
    icon: Sprite.item('dreamball'),
    prize: ['dreamball'],
    level: LEVEL.L5,
    active: true,
    origin: 'gen5',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const simple = new TeamsBadge(capturedPokemon).toSimple()
      return [
        P.Jigglypuff,
        P.Drowzee,
        P.Munna,
      ].includes(simple)
    }
  },
  EVIOLITE: {
    title: 'Capture 11 not-fully evolved Pokémon',
    steps: 11,
    icon: Sprite.item('eviolite'),
    prize: ['eviolite'],
    level: LEVEL.L5,
    active: true,
    origin: 'gen5',
    completedStep: ({capturedPokemon}) => {
      return Pkmn.get(capturedPokemon!)?.levelTo !== undefined
    }
  },
  MILTANK: {
    title: 'Catch 5 Miltank',
    steps: 5,
    icon: Sprite.item('tm-Rollout'),
    prize: ['tm-Rollout'],
    level: LEVEL.L5,
    active: true,
    origin: 'gen4',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const simple = new TeamsBadge(capturedPokemon).toSimple()
      return simple === P.Miltank
    }
  },
  MRMIME: {
    title: 'Catch 5 Mr. Mime',
    steps: 5,
    icon: Sprite.item('tr-Mimic'),
    prize: ['tr-Mimic'],
    level: LEVEL.L5,
    active: true,
    origin: 'gen4',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const simple = new TeamsBadge(capturedPokemon).toSimple()
      return simple === P.Mr_Mime
    }
  },
  // Compatibility with old name
  AIPOM: {
    title: 'Catch 5 Aipom',
    steps: 5,
    icon: Sprite.item('tm-Double Hit'),
    prize: ['tm-Double Hit'],
    level: LEVEL.L5,
    active: true,
    origin: 'gen4',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const simple = new TeamsBadge(capturedPokemon).toSimple()
      return simple === P.Aipom
    }
  },
  AIPOMTM: {
    title: 'Catch 5 Aipom',
    steps: 5,
    icon: Sprite.item('tm-Double Hit'),
    prize: ['tm-Double Hit'],
    level: LEVEL.L5,
    active: true,
    origin: 'gen4',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const simple = new TeamsBadge(capturedPokemon).toSimple()
      return simple === P.Aipom
    }
  },
  PILOSWINE: {
    title: 'Catch 5 Piloswine',
    steps: 5,
    icon: Sprite.item('tm-Ancient Power'),
    prize: ['tm-Ancient Power'],
    level: LEVEL.L5,
    active: true,
    origin: 'gen4',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const simple = new TeamsBadge(capturedPokemon).toSimple()
      return simple === P.Piloswine
    }
  },
  UNOVANCOPPER: {
    title: 'Catch 10 Unovan Pokémon',
    steps: 10,
    icon: Sprite.item('reliccopper'),
    prize: ['reliccopper'],
    level: LEVEL.L5,
    active: true,
    origin: 'gen5',
    completedStep: ({capturedPokemon}) => {
      const {id} = new TeamsBadge(capturedPokemon!)
      return id >= regions[5].range[0] &&
        id <= regions[5].range[1]
    }
  },
  PRIMEAPE: {
    title: `Catch 18 Mankey or Primeape`,
    steps: 18,
    icon: Sprite.item('tm-Rage Fist'),
    prize: ['tm-Rage Fist'],
    level: LEVEL.L9,
    active: true,
    origin: 'gen9',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const simple = new TeamsBadge(capturedPokemon).toSimple()
      return [P.Mankey, P.Primeape].includes(simple)
    }
  },
  DUNSPARCE: {
    title: `Catch 18 Dunsparce`,
    steps: 18,
    icon: Sprite.item('tm-Hyper Drill'),
    prize: ['tm-Hyper Drill'],
    level: LEVEL.L9,
    active: true,
    origin: 'gen9',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const simple = new TeamsBadge(capturedPokemon).toSimple()
      return [P.Dunsparce].includes(simple)
    }
  },
  GIRAFARIG: {
    title: `Catch 18 Girafarig`,
    steps: 18,
    icon: Sprite.item('tm-Twin Beam'),
    prize: ['tm-Twin Beam'],
    level: LEVEL.L9,
    active: true,
    origin: 'gen9',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const simple = new TeamsBadge(capturedPokemon).toSimple()
      return [P.Girafarig].includes(simple)
    }
  },
  HALLOWEEN21: {
    title: 'Catch 3 Spooky Pokémon',
    steps: 3,
    icon: Sprite.item('duskstone'),
    prize: ['duskstone'],
    level: LEVEL.L5,
    active: false,
    origin: 'gen3',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const pkmn = Pkmn.get(capturedPokemon)!
      return pkmn.type1 === 'Ghost' || pkmn.type2 === 'Ghost'
    }
  },
  POTW: {
    title: (() => {
      // Yes, if you don't complete this task within the week it will change
      // the message and be a little confusing. C'est la vie.
      return `Catch a ${new TeamsBadge(weekly).toLabel()}`
    })(),
    steps: 1,
    icon: Sprite.item('expcandym'),
    prize: ['expcandym'],
    level: LEVEL.L2,
    active: true,
    origin: 'gen2',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const simple = new TeamsBadge(capturedPokemon).toSimple()
      return simple === weekly
    }
  }
}

export const QUEST_TYPE: Record<string, ResearchQuest> = {
  CATCH_BUG: catchSpecificType('Bug', LEVEL.L1),
  CATCH_DARK: catchSpecificType('Dark', LEVEL.L2),
  CATCH_ELECTRIC: catchSpecificType('Electric', LEVEL.L1),
  CATCH_FIRE: catchSpecificType('Fire', LEVEL.L1),
  CATCH_FLYING: catchSpecificType('Flying', LEVEL.L1),
  CATCH_GRASS: catchSpecificType('Grass', LEVEL.L1),
  CATCH_NORMAL: catchSpecificType('Normal', LEVEL.L1),
  CATCH_POISON: catchSpecificType('Poison', LEVEL.L2),
  CATCH_WATER: catchSpecificType('Water', LEVEL.L1),
  CATCH_ROCK: catchSpecificType('Rock', LEVEL.L2),
  CATCH_GROUND: catchSpecificType('Ground', LEVEL.L3),
  CATCH_PSYCHIC: catchSpecificType('Psychic', LEVEL.L3),
  CATCH_ICE: catchSpecificType('Ice', LEVEL.L3),
  CATCH_STEEL: catchSpecificType('Steel', LEVEL.L3),
}

export const QUEST_ARCEUS: Record<string, ResearchQuest> = {
  PLATE_INSECT: catchTypeForPlate('Bug', 'insectplate'),
  PLATE_DREAD: catchTypeForPlate('Dark', 'dreadplate'),
  PLATE_DRACO: catchTypeForPlate('Dragon', 'dracoplate'),
  PLATE_EARTH: catchTypeForPlate('Ground', 'earthplate'),
  PLATE_FIST: catchTypeForPlate('Fighting', 'fistplate'),
  PLATE_FLAME: catchTypeForPlate('Fire', 'flameplate'),
  PLATE_ICICLE: catchTypeForPlate('Ice', 'icicleplate'),
  PLATE_IRON: catchTypeForPlate('Steel', 'ironplate'),
  PLATE_MEADOW: catchTypeForPlate('Grass', 'meadowplate'),
  PLATE_MIND: catchTypeForPlate('Psychic', 'mindplate'),
  PLATE_PIXIE: catchTypeForPlate('Fairy', 'pixieplate'),
  PLATE_SKY: catchTypeForPlate('Flying', 'skyplate'),
  PLATE_SPLASH: catchTypeForPlate('Water', 'splashplate'),
  PLATE_SPOOKY: catchTypeForPlate('Ghost', 'spookyplate'),
  PLATE_STONE: catchTypeForPlate('Rock', 'stoneplate'),
  PLATE_TOXIC: catchTypeForPlate('Poison', 'toxicplate'),
  PLATE_ZAP: catchTypeForPlate('Electric', 'zapplate'),
}

export const QUEST_GEM: Record<string, ResearchQuest> = {
  GEM_INSECT: catchTypeForGem('Bug', 'buggem'),
  GEM_DREAD: catchTypeForGem('Dark', 'darkgem'),
  GEM_DRACO: catchTypeForGem('Dragon', 'dragongem'),
  GEM_EARTH: catchTypeForGem('Ground', 'groundgem'),
  GEM_FIST: catchTypeForGem('Fighting', 'fightinggem'),
  GEM_FLAME: catchTypeForGem('Fire', 'firegem'),
  GEM_ICICLE: catchTypeForGem('Ice', 'icegem'),
  GEM_IRON: catchTypeForGem('Steel', 'steelgem'),
  GEM_MEADOW: catchTypeForGem('Grass', 'grassgem'),
  GEM_MIND: catchTypeForGem('Psychic', 'psychicgem'),
  GEM_PIXIE: catchTypeForGem('Fairy', 'fairygem'),
  GEM_SKY: catchTypeForGem('Flying', 'flyinggem'),
  GEM_SPLASH: catchTypeForGem('Water', 'watergem'),
  GEM_SPOOKY: catchTypeForGem('Ghost', 'ghostgem'),
  GEM_STONE: catchTypeForGem('Rock', 'rockgem'),
  GEM_TOXIC: catchTypeForGem('Poison', 'poisongem'),
  GEM_ZAP: catchTypeForGem('Electric', 'electricgem'),
}

/**
 * A research quest to give someone a mega stone when they catch 12 of a given
 * Pokemon.
 * @param species BadgeId of the specific Pokemon
 * @param item The mega stone they'll receive as a reward
 * @param steps The number of Pokémon to catch
 * @returns A capture-based Mega Quest
 */
function megaQuest(species: BadgeId[], item: ItemId, steps = 12): ResearchQuest {
  const label = species.map(s => Pkmn.get(s)!.species).join(', ')
  return {
    title: `Catch ${steps} ${label}`,
    steps,
    icon: Sprite.item(item),
    prize: [item],
    level: LEVEL.L6,
    active: true,
    origin: 'gen6',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const simple = new TeamsBadge(capturedPokemon).toSimple()
      return species.includes(simple)
    }
  }
}

/**
 * Quests that will give someone a specific Pokemon mega stone
 * @see https://serebii.net/omegarubyalphasapphire/megaevolutions.shtml
 */
export const QUEST_MEGAS: Record<string, ResearchQuest> = {
  VENUSAURITE: megaQuest([P.Bulbasaur, P.Ivysaur, P.Venusaur], 'venusaurite'),
  CHARIZARDITE_X: megaQuest([P.Charmander, P.Charmeleon, P.Charizard], 'charizarditex'),
  CHARIZARDITE_Y: megaQuest([P.Charmander, P.Charmeleon, P.Charizard], 'charizarditey'),
  BLASTOISEITE: megaQuest([P.Squirtle, P.Wartortle, P.Blastoise], 'blastoiseite'),
  ALAKAZAMITE: megaQuest([P.Abra, P.Kadabra, P.Alakazam], 'alakazamite'),
  GENGARITE: megaQuest([P.Gastly, P.Haunter, P.Gengar], 'gengarite'),
  AMPHAROSITE: megaQuest([P.Mareep, P.Flaaffy, P.Ampharos], 'ampharosite'),
  MANECTRICITE: megaQuest([P.Electrike, P.Manectric], 'manectricite'),
  BANETTEITE: megaQuest([P.Shuppet, P.Banette], 'banetteite'),
  GARDEVOIRITE: megaQuest([P.Ralts, P.Kirlia, P.Gardevoir], 'gardevoirite'),
  PINSIRITE: megaQuest([P.Pinsir], 'pinsirite'),
  HERACROSSITE: megaQuest([P.Heracross], 'heracrossite'),
  MAWILEITE: megaQuest([P.Mawile], 'mawileite'),
  SCIZORITE: megaQuest([P.Scyther, P.Scizor], 'scizorite'),
  AGGRONITE: megaQuest([P.Aron, P.Lairon, P.Aggron], 'aggronite'),
  GYARADOSITE: megaQuest([P.Magikarp, P.Gyarados], 'gyaradosite'),
  AERODACTYLITE: megaQuest([P.Aerodactyl], 'aerodactylite'),
  TYRANITARITE: megaQuest([P.Larvitar, P.Pupitar, P.Tyranitar], 'tyranitarite'),
  ABSOLITE: megaQuest([P.Absol], 'absolite'),
  HOUNDOOMITE: megaQuest([P.Houndour, P.Houndoom], 'houndoomite'),
  BLAZIKENITE: megaQuest([P.Torchic, P.Combusken, P.Blaziken], 'blazikenite'),
  LUCARIOITE: megaQuest([P.Riolu, P.Lucario], 'lucarioite'),
  MEDICHAMITE: megaQuest([P.Meditite, P.Medicham], 'medichamite'),
  GARCHOMPITE: megaQuest([P.Gible, P.Gabite, P.Garchomp], 'garchompite'),
  ABOMASNOWITE: megaQuest([P.Snover, P.Abomasnow], 'abomasnowite'),
  KANGASKHANITE: megaQuest([P.Kangaskhan], 'kangaskhanite'),
  // OrAs
  SCEPTILEITE: megaQuest([P.Treecko, P.Grovyle, P.Sceptile], 'sceptileite'),
  SWAMPERITE: megaQuest([P.Mudkip, P.Marshtomp, P.Swampert], 'swampertite'),
  SHARPEDOITE: megaQuest([P.Carvanha, P.Sharpedo], 'sharpedoite'),
  CAMERUPTITE: megaQuest([P.Numel, P.Camerupt], 'cameruptite'),
  SLOWBROITE: megaQuest([P.Slowpoke, P.Slowbro, P.Slowking], 'slowbroite'),
  LOPUNNYITE: megaQuest([P.Buneary, P.Lopunny], 'lopunnyite'),
  PIDGEOTITE: megaQuest([P.Pidgey, P.Pidgeotto, P.Pidgeot], 'pidgeotite'),
  GLAILITEITE: megaQuest([P.Snorunt, P.Glalie], 'glalieite'),
  STEELIXITE: megaQuest([P.Onix, P.Steelix], 'steelixite'),
  SABLEYEITE: megaQuest([P.Sableye], 'sableyeite'),
  BEEDRILL: megaQuest([P.Weedle, P.Kakuna, P.Beedrill], 'beedrillite'),
  AUDINOITE: megaQuest([P.Audino], 'audinoite'),
  GALLADEITE: megaQuest([P.Ralts, P.Kirlia, P.Gallade], 'galladeite'),
  SALAMENCEITE: megaQuest([P.Bagon, P.Shelgon, P.Salamence], 'salamenceite'),
  METAGROSSITE: megaQuest([P.Beldum, P.Metang, P.Metagross], 'metagrossite'),
  ALTRIAITE: megaQuest([P.Swablu, P.Altaria], 'altariaite'),
  LATIASITE: megaQuest([P.Latias], 'latiasite', 6),
  LATIOSITE: megaQuest([P.Latios], 'latiosite', 6),
  DIANCIEITE: megaQuest([P.Carbink], 'diancieite', 24),
}

function zcrystalQuest(item: ItemId, type: Type, steps = 14): ResearchQuest {
  const active = true
  return {
    title: `Catch ${steps} ${type}-Type Ultra Pokémon`,
    steps,
    icon: Sprite.item(item),
    prize: [item],
    level: LEVEL.L7,
    active,
    origin: 'gen7',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const db = Pkmn.get(capturedPokemon)!
      if (db.type1 !== type && db.type2 !== type) return false
      return db.tiers?.includes('Ultra Cup') || false
    }
  }
}

function specialZCrystalQuest(species: BadgeId[], item: ItemId, steps = 14): ResearchQuest {
  const label = species.map(s => Pkmn.get(s)!.species).join(', ')
  const active = true
  return {
    title: `Catch ${steps} ${label}`,
    steps,
    icon: Sprite.item(item),
    prize: [item],
    level: LEVEL.L7,
    active,
    origin: 'gen7',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const simple = new TeamsBadge(capturedPokemon).toSimple()
      return species.includes(simple)
    }
  }
}


export const QUEST_ZCRYSTALS_MEMORIES: Record<string, ResearchQuest> = {
  ZBUG: zcrystalQuest('zbuginium', 'Bug'),
  ZDARK: zcrystalQuest('zdarkinium', 'Dark'),
  ZDRAGON: zcrystalQuest('zdragonium', 'Dragon'),
  ZELECTRIC: zcrystalQuest('zelectrium', 'Electric'),
  ZFAIRY: zcrystalQuest('zfairium', 'Fairy'),
  ZFIGHTING: zcrystalQuest('zfightinium', 'Fighting'),
  ZFIRE: zcrystalQuest('zfirium', 'Fire'),
  ZFLYING: zcrystalQuest('zflyinium', 'Flying'),
  ZGHOST: zcrystalQuest('zghostium', 'Ghost'),
  ZGRASS: zcrystalQuest('zgrassium', 'Grass'),
  ZGROUND: zcrystalQuest('zgroundium', 'Ground'),
  ZICE: zcrystalQuest('zicium', 'Ice'),
  ZNORMAL: zcrystalQuest('znormalium', 'Normal'),
  ZPOISON: zcrystalQuest('zpoisonium', 'Poison'),
  ZPSYCHIC: zcrystalQuest('zpsychicium', 'Psychic'),
  ZROCK: zcrystalQuest('zrockium', 'Rock'),
  ZSTEEL: zcrystalQuest('zsteelium', 'Steel'),
  ZWATER: zcrystalQuest('zwaterium', 'Water'),
  // Silvally Memories
  MEMORYBUG: zcrystalQuest('bugmemory', 'Bug', 21),
  MEMORYDARK: zcrystalQuest('darkmemory', 'Dark', 21),
  MEMORYDRAGON: zcrystalQuest('dragonmemory', 'Dragon', 21),
  MEMORYELECTRIC: zcrystalQuest('electricmemory', 'Electric', 21),
  MEMORYFAIRY: zcrystalQuest('fairymemory', 'Fairy', 21),
  MEMORYFIGHTING: zcrystalQuest('fightingmemory', 'Fighting', 21),
  MEMORYFIRE: zcrystalQuest('firememory', 'Fire', 21),
  MEMORYFLYING: zcrystalQuest('flyingmemory', 'Flying', 21),
  MEMORYGHOST: zcrystalQuest('ghostmemory', 'Ghost', 21),
  MEMORYGRASS: zcrystalQuest('grassmemory', 'Grass', 21),
  MEMORYGROUND: zcrystalQuest('groundmemory', 'Ground', 21),
  MEMORYICE: zcrystalQuest('icememory', 'Ice', 21),
  MEMORYPOISON: zcrystalQuest('poisonmemory', 'Poison', 21),
  MEMORYPSYCHIC: zcrystalQuest('psychicmemory', 'Psychic', 21),
  MEMORYROCK: zcrystalQuest('rockmemory', 'Rock', 21),
  MEMORYSTEEL: zcrystalQuest('steelmemory', 'Steel', 21),
  MEMORYWATER: zcrystalQuest('watermemory', 'Water', 21),
  // SM Special Crystals
  ZARAICHU: specialZCrystalQuest([P.Pichu, P.Pikachu, P.Raichu], 'zaloraichium'),
  ZDECIDUEYE: specialZCrystalQuest([P.Rowlet, P.Dartrix, P.Decidueye], 'zdecidium'),
  ZEEVEE: specialZCrystalQuest([P.Eevee], 'zeevium'),
  ZINCINEROAR: specialZCrystalQuest([P.Litten, P.Torracat, P.Incineroar], 'zincinium'),
  ZMARSHADOW: specialZCrystalQuest([P.Crabrawler, P.Passimian, P.Dhelmise, P.Mimikyu], 'zmarshadium', 28),
  ZMEW: specialZCrystalQuest([P.Bruxish, P.Oranguru], 'zmewnium', 28),
  ZPIKACHU: specialZCrystalQuest([P.Pikachu], 'zpikanium', 15),
  ZPIKACHUCAP: specialZCrystalQuest([P.Pikachu], 'zpikashunium', 16),
  ZPRIMARINA: specialZCrystalQuest([P.Popplio, P.Brionne, P.Primarina], 'zprimarium'),
  ZSNORLAX: specialZCrystalQuest([P.Munchlax, P.Snorlax], 'zsnorlium'),
  ZTAPU: specialZCrystalQuest([P.Cosmog], 'ztapunium', 10),
  // USUM Special Crystals
  ZKOMMO: specialZCrystalQuest([P.Jangmo_o, P.Hakamo_o, P.Kommo_o], 'zkommonium'),
  ZMIMIKYU: specialZCrystalQuest([P.Mimikyu], 'zmimikium'),
  ZLYCANROC: specialZCrystalQuest([P.Rockruff, P.Lycanroc], 'zlycanium'),
  ZLUNALA: specialZCrystalQuest([P.Cosmog], 'zlunalium', 7),
  ZSOLGALEO: specialZCrystalQuest([P.Cosmog], 'zsolganium', 7),
  ZNECROZMA: specialZCrystalQuest([P.Cosmog], 'zultranecrozium', 14),
  MELTANCANDY: zcrystalQuest('meltancandy', 'Steel', 1),
}

function curryQuest(item: ItemId, type: Type, steps = 8): ResearchQuest {
  const active = true
  return {
    title: `Catch ${steps} ${type}-Type GigantaCup Pokémon`,
    steps,
    icon: Sprite.item(item),
    prize: [item],
    level: LEVEL.L8,
    active,
    origin: 'gen8',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const db = Pkmn.get(capturedPokemon)!
      if (db.type1 !== type && db.type2 !== type) return false
      return db.tiers?.includes('GigantaCup') || false
    }
  }
}

export const QUEST_GALAR: Record<string, ResearchQuest> = {
  DYNAMAX_CANDY: {
    title: `Catch 8 Galar Pokémon`,
    steps: 8,
    icon: Sprite.item('dynamaxcandy'),
    prize: ['dynamaxcandy'],
    level: LEVEL.L8,
    active: true,
    origin: 'gen8',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const db = Pkmn.get(capturedPokemon)!
      return db.tiers?.includes('GigantaCup') || false
    }
  },
  CURRYFIRE: curryQuest('sausages', 'Fire'),
  CURRYWATER: curryQuest('bobsfoodtin', 'Water'),
  CURRYFAIRY: curryQuest('bachsfoodtin', 'Fairy'),
  CURRYGROUND: curryQuest('tinofbeans', 'Ground'),
  CURRYFLYING: curryQuest('bread', 'Flying'),
  CURRYROCK: curryQuest('pasta', 'Rock'),
  CURRYPOISON: curryQuest('mixedmushrooms', 'Poison'),
  CURRYPSYCHIC: curryQuest('smokepoketail', 'Psychic'),
  CURRYFIGHTING: curryQuest('largeleek', 'Fighting'),
  CURRYDRAGON: curryQuest('fancyapple', 'Dragon'),
  CURRYGHOST: curryQuest('brittlebones', 'Ghost'),
  CURRYNORMAL: curryQuest('packofpotatoes', 'Normal'),
  CURRYBUG: curryQuest('pungentroot', 'Bug'),
  CURRYGRASS: curryQuest('saladmix', 'Grass'),
  CURRYELECTRIC: curryQuest('friedfood', 'Electric'),
  CURRYDARK: curryQuest('boiledegg', 'Dark'),
  CURRYICE: curryQuest('fruitbunch', 'Ice'),
  CURRYSTEEL: curryQuest('moomoocheese', 'Steel'),
}

/**
 * Quests related to Hisui or PLA
 * @see https://serebii.net/legendsarceus/requests.shtml
 */
export const QUEST_HISUI: Record<string, ResearchQuest> = {
  WURMPLE: {
    title: 'Catch 2 Wurmple',
    steps: 2,
    icon: Sprite.item('pecha'),
    prize: ['pecha'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen8-pla',
    completedStep: completeForSimple(P.Wurmple),
  },
  STARLY: {
    title: 'Catch 2 Starly',
    steps: 2,
    icon: Sprite.item('oran'),
    prize: ['oran'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen8-pla',
    completedStep: completeForSimple(P.Starly),
  },
  SHINX: {
    title: 'Catch 2 Shinx',
    steps: 2,
    icon: Sprite.item('cheri'),
    prize: ['cheri'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen8-pla',
    completedStep: completeForSimple(P.Shinx),
  },
  KRICKETOT: {
    title: 'Catch 2 Kricketot',
    steps: 2,
    icon: Sprite.item('persim'),
    prize: ['persim'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen8-pla',
    completedStep: completeForSimple(P.Kricketot),
  },
  GEODUDE: {
    title: 'Catch 2 Geodude',
    steps: 2,
    icon: Sprite.item('stablemulch'),
    prize: ['stablemulch'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen8-pla',
    completedStep: completeForSimple(P.Geodude),
  },
  DRIFLOON: {
    title: 'Catch 2 Drifloon',
    steps: 2,
    icon: Sprite.item('chesto'),
    prize: ['chesto'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen8-pla',
    completedStep: completeForSimple(P.Drifloon),
  },
  MR_MIME: {
    title: 'Catch 4 Mr. Mime',
    steps: 4,
    icon: Sprite.item('sitrus'),
    prize: ['sitrus'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen8-pla',
    completedStep: completeForSimple(P.Mr_Mime),
  },
  HIPPO: {
    title: 'Catch 4 Hippopotas',
    steps: 4,
    icon: Sprite.item('sitrus'),
    prize: ['sitrus'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen8-pla',
    completedStep: completeForSimple(P.Hippopotas),
  },
  PSYDUCK: {
    title: 'Catch 5 Psyduck',
    steps: 5,
    icon: Sprite.item('persim'),
    prize: ['persim'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen8-pla',
    completedStep: completeForSimple(P.Psyduck),
  },
  CROAGUNK: {
    title: 'Catch 5 Croagunk',
    steps: 5,
    icon: Sprite.item('pecha'),
    prize: ['pecha'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen8-pla',
    completedStep: completeForSimple(P.Croagunk),
  },
  PACHIRISU: {
    title: 'Catch 5 Pachirisu',
    steps: 5,
    icon: Sprite.item('lum'),
    prize: ['lum'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen8-pla',
    completedStep: completeForSimple(P.Pachirisu),
  },
  MAGIKARP: {
    title: 'Catch 6 Magikarp',
    steps: 6,
    icon: Sprite.item('expcandys'),
    prize: ['expcandys'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen8-pla',
    completedStep: completeForSimple(P.Magikarp),
  },
  SHELLOS: {
    title: 'Catch 6 Shellos',
    steps: 6,
    icon: Sprite.item('expcandys'),
    prize: ['expcandys'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen8-pla',
    completedStep: completeForSimple(P.Shellos),
  },
  AIPOMPLA: {
    title: 'Catch 6 Aipom',
    steps: 6,
    icon: Sprite.item('expcandys'),
    prize: ['expcandys'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen8-pla',
    completedStep: completeForSimple(P.Aipom),
  },
  OCTILLERY: {
    title: 'Catch 8 Octillery',
    steps: 8,
    icon: Sprite.item('expcandyl'),
    prize: ['expcandyl'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen8-pla',
    completedStep: completeForSimple(P.Octillery),
  },
  MACHOKE: {
    title: 'Catch 8 Machoke',
    steps: 8,
    icon: Sprite.item('expcandyl'),
    prize: ['expcandyl'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen8-pla',
    completedStep: completeForSimple(P.Machoke),
  },
  PIPLUP: {
    title: 'Catch 8 Piplup',
    steps: 8,
    icon: Sprite.item('expcandyl'),
    prize: ['expcandyl'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen8-pla',
    completedStep: completeForSimple(P.Piplup),
  },
  MISDREAVUS: {
    title: 'Catch 8 Misdreavus',
    steps: 8,
    icon: Sprite.item('expcandyl'),
    prize: ['expcandyl'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen8-pla',
    completedStep: completeForSimple(P.Misdreavus),
  },
  WORMADAM: {
    title: 'Catch 8 Wormadam',
    steps: 8,
    icon: Sprite.item('expcandyxl'),
    prize: ['expcandyxl'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen8-pla',
    completedStep: completeForSimple(P.Wormadam),
  },
  CLEFAIRY: {
    title: 'Catch 8 Clefairy',
    steps: 8,
    icon: Sprite.item('expcandyl'),
    prize: ['expcandyl'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen8-pla',
    completedStep: completeForSimple(P.Clefairy),
  },
  NOSEPASS: {
    title: 'Catch 8 Nosepass',
    steps: 8,
    icon: Sprite.item('expcandyl'),
    prize: ['expcandyl'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen8-pla',
    completedStep: completeForSimple(P.Nosepass),
  },
  KIRLIA: {
    title: 'Catch 8 Kirlia',
    steps: 8,
    icon: Sprite.item('expcandyl'),
    prize: ['expcandyl'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen8-pla',
    completedStep: completeForSimple(P.Kirlia),
  },
  SWINUB: {
    title: 'Catch 8 Swinub',
    steps: 8,
    icon: Sprite.item('expcandyl'),
    prize: ['expcandyl'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen8-pla',
    completedStep: completeForSimple(P.Swinub),
  },
  SPHEAL: {
    title: 'Catch 12 Spheal',
    steps: 12,
    icon: Sprite.item('expcandyxl'),
    prize: ['expcandyxl'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen8-pla',
    completedStep: completeForSimple(P.Spheal),
  },
  BURMY: {
    title: 'Catch 20 Burmy',
    steps: 20,
    icon: Sprite.item('rarecandy'),
    prize: ['rarecandy'],
    level: LEVEL.L4,
    active: true,
    origin: 'gen8-pla',
    completedStep: completeForSimple(P.Burmy),
  },
}

function teraQuest(item: ItemId, type: Type, steps = 9, active = true): ResearchQuest {
  return {
    title: `Catch ${steps} ${type}-Type Paldean Pokémon`,
    steps,
    icon: Sprite.item(item),
    prize: [item],
    level: LEVEL.L9,
    active,
    origin: 'gen9',
    completedStep: ({capturedPokemon}) => {
      if (!capturedPokemon) return false
      const db = Pkmn.get(capturedPokemon)!
      if (db.type1 !== type && db.type2 !== type) return false
      return db.tiers?.includes('Terastallize Cup') || false
    }
  }
}


export const QUEST_TERA: Record<string, ResearchQuest> = {
  TERA_NORMAL: teraQuest('teranormal', 'Normal'),
  TERA_FIRE: teraQuest('terafire', 'Fire'),
  TERA_GRASS: teraQuest('teragrass', 'Grass'),
  TERA_WATER: teraQuest('terawater', 'Water'),
  TERA_ICE: teraQuest('teraice', 'Ice', 9, false),
  TERA_DARK: teraQuest('teradark', 'Dark', 9, false),
  TERA_STEEL: teraQuest('terasteel', 'Steel', 9, false),
  TERA_FAIRY: teraQuest('terafairy', 'Fairy'),
  TERA_DRAGON: teraQuest('teradragon', 'Dragon', 9, false),
  TERA_ROCK: teraQuest('terarock', 'Rock'),
  TERA_GROUND: teraQuest('teraground', 'Ground', 9, false),
  TERA_BUG: teraQuest('terabug', 'Bug'),
  TERA_POISON: teraQuest('terapoison', 'Poison'),
  TERA_GHOST: teraQuest('teraghost', 'Ghost', 9, false),
  TERA_PSYCHIC: teraQuest('terapsychic', 'Psychic', 9, false),
  TERA_ELECTRIC: teraQuest('teraelectric', 'Electric'),
  TERA_FLYING: teraQuest('teraflying', 'Flying', 9, false),
  TERA_FIGHTING: teraQuest('terafighting', 'Fighting', 9, false),
}

export const QUEST_TRAVEL: Record<string, ResearchQuest> = {
  CATCH_SNOW: {
    title: 'Catch 5 Pokémon in the snow',
    steps: 5,
    icon: Sprite.item('snowball'),
    prize: ['snowball'],
    level: LEVEL.L5,
    active: true,
    origin: 'gen8',
    completedStep: ({capturedPokemon, location}) => capturedPokemon !== undefined && location?.forecast === 'Snow',
  },
  CATCH_RAIN: {
    title: 'Catch 5 Pokémon in the rain',
    steps: 5,
    icon: Sprite.item('absorbbulb'),
    prize: ['absorbbulb'],
    level: LEVEL.L5,
    active: true,
    origin: 'gen8',
    completedStep: ({capturedPokemon, location}) => capturedPokemon !== undefined && location?.forecast === 'Rain',
  },
  CATCH_THUNDER: {
    title: 'Catch 5 Pokémon in a thunderstorm',
    steps: 5,
    icon: Sprite.item('cellbattery'),
    prize: ['cellbattery'],
    level: LEVEL.L5,
    active: true,
    origin: 'gen8',
    completedStep: ({capturedPokemon, location}) => capturedPokemon !== undefined && location?.forecast === 'Thunderstorm',
  },
  CATCH_WIND: {
    title: 'Catch 5 Pokémon in heavy wind',
    steps: 5,
    icon: Sprite.item('prettywing'),
    prize: ['prettywing'],
    level: LEVEL.L5,
    active: true,
    origin: 'gen8',
    completedStep: ({capturedPokemon, location}) => capturedPokemon !== undefined && location?.forecast === 'Windy',
  },
  CATCH_FOG: {
    title: 'Catch 5 Pokémon in fog',
    steps: 5,
    icon: Sprite.item('luminousmoss'),
    prize: ['luminousmoss'],
    level: LEVEL.L5,
    active: true,
    origin: 'gen8',
    completedStep: ({capturedPokemon, location}) => capturedPokemon !== undefined && location?.forecast === 'Fog',
  },
  CATCH_NA: {
    title: 'Catch 5 Pokémon in North America',
    steps: 5,
    icon: Sprite.item('casteliacone'),
    prize: ['casteliacone'],
    level: LEVEL.L5,
    active: true,
    origin: 'gen8',
    completedStep: ({capturedPokemon, location}) => capturedPokemon !== undefined && location?.region === 'North America',
  },
  CATCH_SA: {
    title: 'Catch 5 Pokémon in South America',
    steps: 5,
    icon: Sprite.item('expcandym'),
    prize: ['expcandym'],
    level: LEVEL.L5,
    active: true,
    origin: 'gen8',
    completedStep: ({capturedPokemon, location}) => capturedPokemon !== undefined && location?.region === 'South America',
  },
  CATCH_AMEA: {
    title: 'Catch 5 Pokémon in Africa / Middle East',
    steps: 5,
    icon: Sprite.item('powerherb'),
    prize: ['powerherb'],
    level: LEVEL.L5,
    active: true,
    origin: 'gen8',
    completedStep: ({capturedPokemon, location}) => capturedPokemon !== undefined && location?.region === 'Africa / Middle East',
  },
  CATCH_NE: {
    title: 'Catch 5 Pokémon in Europe',
    steps: 5,
    icon: Sprite.item('shaloursable'),
    prize: ['shaloursable'],
    level: LEVEL.L5,
    active: true,
    origin: 'gen8',
    completedStep: ({capturedPokemon, location}) => capturedPokemon !== undefined && location?.region === 'North Europe',
  },
  CATCH_ASIA: {
    title: 'Catch 5 Pokémon in Asia',
    steps: 5,
    icon: Sprite.item('pewtercrunchies'),
    prize: ['pewtercrunchies'],
    level: LEVEL.L5,
    active: true,
    origin: 'gen8',
    completedStep: ({capturedPokemon, location}) => capturedPokemon !== undefined && location?.region === 'Asia',
  },
  CATCH_PACIFIC: {
    title: 'Catch 5 Pokémon in the Pacific Islands',
    steps: 5,
    icon: Sprite.item('strangesouvenir'),
    prize: ['strangesouvenir'],
    level: LEVEL.L5,
    active: false, //TODO Wait until Gen 7
    origin: 'gen7',
    completedStep: ({capturedPokemon, location}) => capturedPokemon !== undefined && location?.region === 'Pacific Islands',
  },
  CATCH_DESERT: {
    title: 'Catch 5 Pokémon in a desert area',
    steps: 5,
    icon: Sprite.item('stickybarb'),
    prize: ['stickybarb'],
    level: LEVEL.L5,
    active: true,
    origin: 'gen8',
    completedStep: ({capturedPokemon, location}) => capturedPokemon !== undefined && location?.terrain === 'Desert',
  },
  CATCH_MOUNTAIN: {
    title: 'Catch 5 Pokémon in a mountain area',
    steps: 5,
    icon: Sprite.item('rockyhelmet'),
    prize: ['rockyhelmet'],
    level: LEVEL.L5,
    active: true,
    origin: 'gen8',
    completedStep: ({capturedPokemon, location}) => capturedPokemon !== undefined && location?.terrain === 'Mountain',
  },
  CATCH_FOREST: {
    title: 'Catch 5 Pokémon in a forest area',
    steps: 5,
    icon: Sprite.item('leek'),
    prize: ['leek'],
    level: LEVEL.L5,
    active: true,
    origin: 'gen8',
    completedStep: ({capturedPokemon, location}) => capturedPokemon !== undefined && location?.terrain === 'Forest',
  },
  CATCH_OCEAN: {
    title: 'Catch 5 Pokémon in an oceanic area',
    steps: 5,
    icon: Sprite.item('pearl'),
    prize: ['pearl'],
    level: LEVEL.L5,
    active: true,
    origin: 'gen8',
    completedStep: ({capturedPokemon, location}) => capturedPokemon !== undefined && location?.terrain === 'Oceanic',
  },
  CATCH_NIGHT: {
    title: 'Catch 5 Pokémon at night',
    steps: 5,
    icon: Sprite.item('tinymushroom'),
    prize: ['tinymushroom'],
    level: LEVEL.L5,
    active: true,
    origin: 'gen8',
    completedStep: ({capturedPokemon, location}) => capturedPokemon !== undefined && timeOfDay(location) === 'Night',
  },
  CATCH_LOWTIDE: {
    title: 'Catch 5 Pokémon in low tide',
    steps: 5,
    icon: Sprite.item('shoalshell'),
    prize: ['shoalshell'],
    level: LEVEL.L5,
    active: true,
    origin: 'gen8',
    completedStep: ({capturedPokemon, location}) => capturedPokemon !== undefined && getTidesByLocation(location) === 'Low Tide',
  },
}

export const ACTIVE_RESEARCH = {
  ...QUEST_CAPTURE,
  ...QUEST_POKEMON,
  ...QUEST_TYPE,
  ...QUEST_ARCEUS,
  ...QUEST_GEM,
  ...QUEST_MEGAS,
  ...QUEST_HISUI,
  ...QUEST_TRAVEL,
  ...QUEST_ZCRYSTALS_MEMORIES,
  ...QUEST_GALAR,
  ...QUEST_TERA,
}
