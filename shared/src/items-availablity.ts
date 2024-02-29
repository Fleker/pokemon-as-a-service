import { Badge, Nature } from "./badge3";
import { getMoonPhase, isDusk, Location, timeOfDay } from "./locations-list";
import { datastore } from "./pokemon";
import { BadgeId, PokemonDoc, PokemonForm, PokemonId } from "./pokemon/types";
import { ItemId } from "./items-list";
import * as P from './gen/type-pokemon'
import * as PI from './gen/type-pokemon-ids'
import * as Pkmn from './pokemon'
import { MoveId } from "./gen/type-move-meta";
import randomItem from "./random-item";
import * as B2 from './badge2'
import { TPokemon } from "./badge-inflate";
import { F, Users } from "./server-types";
import { randomVariant } from "./farming";

export interface EvolutionEntry {
  /**
   * The badge ID of the new Pokemon
   */
  badge: BadgeId
  /**
   * Whether this is an evolution or changing the form
   */
  changeForm?: boolean
  /**
   * Whether this actually changed anything or not
   */
  noop?: boolean
}

export type EvolutionEntryFunction = (hours: number, value: PokemonDoc) => EvolutionEntry

type EvolutionMap = {[pkmnId in BadgeId]?: EvolutionEntry | EvolutionEntryFunction}

interface AvailabilityUsable {
  target: Badge
  currentPokemon: TPokemon
  hours: number
  quantity: number
}

export interface Availability {
  pokemon: EvolutionMap
  filter: BadgeId[]
  usable: (params: AvailabilityUsable) => boolean
  consumes: (target: Badge) => boolean | number
}

const friendshipList: BadgeId[] = [
  B2.Potw(P.Golbat), B2.Potw(P.Chansey), B2.Potw(P.Eevee), B2.Potw(P.Pichu),
  B2.Potw(P.Cleffa), B2.Potw(P.Igglybuff), B2.Potw(P.Togepi), B2.Potw(P.Azurill),
  B2.Potw(P.Budew), B2.Potw(P.Chingling), B2.Potw(P.Munchlax), B2.Potw(P.Buneary),
  B2.Potw(P.Riolu), B2.Potw(P.Woobat), B2.Potw(P.Swadloon), B2.Potw(P.Meowth, {form: 'alolan'}),
  B2.Potw(P.Type_Null), B2.Potw(P.Snom),
]

const friendshipPokemon: EvolutionMap = {
  [B2.Potw(P.Golbat)]: {
    badge: B2.Potw(P.Crobat)
  },
  [B2.Potw(P.Chansey)]: {
    badge: B2.Potw(P.Blissey)
  },
  [B2.Potw(P.Eevee)]: (hours) => {
    if (hours > 6 && hours < 18) {
      return {
        badge: B2.Potw(P.Espeon),
      }
    } else {
      return {
        badge: B2.Potw(P.Umbreon),
      }
    }
  },
  [B2.Potw(P.Pichu)]: {
    badge: B2.Potw(P.Pikachu),
  },
  [B2.Potw(P.Cleffa)]: {
    badge: B2.Potw(P.Clefairy),
  },
  [B2.Potw(P.Igglybuff)]: {
    badge: B2.Potw(P.Jigglypuff),
  },
  [B2.Potw(P.Togepi)]: {
    badge: B2.Potw(P.Togetic),
  },
  [B2.Potw(P.Azurill)]: {
    badge: B2.Potw(P.Marill)
  },
  [B2.Potw(P.Budew)]: (hours) => {
    if (hours > 6 && hours < 18) {
      return {
        badge: B2.Potw(P.Roselia),
      }
    } else {
      return {
        badge: B2.Potw(P.Budew),
        noop: true,
      }
    }
  },
  [B2.Potw(P.Buneary)]: {
    badge: B2.Potw(P.Lopunny),
  },
  [B2.Potw(P.Chingling)]: (hours) => {
    if (hours > 6 && hours < 18) {
      return {
        badge: B2.Potw(P.Chingling),
        noop: true,
      }
    } else {
      return {
        badge: B2.Potw(P.Chimecho),
      }
    }
  },
  [B2.Potw(P.Riolu)]: (hours) => {
    if (hours > 6 && hours < 18) {
      return {
        badge: B2.Potw(P.Lucario),
      }
    } else {
      return {
        badge: B2.Potw(P.Riolu),
        noop: true,
      }
    }
  },
  [B2.Potw(P.Munchlax)]: {
    badge: B2.Potw(P.Snorlax),
  },
  [B2.Potw(P.Woobat)]: {
    badge: B2.Potw(P.Swoobat),
  },
  [B2.Potw(P.Swadloon)]: {
    badge: B2.Potw(P.Leavanny),
  },
  [B2.Potw(P.Meowth, {form: 'alolan'})]: (hours) => {
    if (hours <= 6 || hours >= 18) {
      return {
        badge: B2.Potw(P.Persian, {form: 'alolan'}),
      }
    } else {
      return {
        badge: B2.Potw(P.Meowth, {form: 'alolan'}),
        noop: true,
      }
    }
  },
  [B2.Potw(P.Type_Null)]: {
    badge: B2.Potw(P.Silvally),
  },
  [B2.Potw(P.Snom)]: (hours) => {
    if (hours > 6 && hours < 18) {
      return {
        badge: B2.Potw(P.Snom),
        noop: true,
      }
    } else {
      return {
        badge: B2.Potw(P.Frosmoth),
      }
    }
  },
}

const RotomFilter = [
  B2.Potw(P.Rotom),
  B2.Potw(P.Rotom, {form: 'fan'}),
  B2.Potw(P.Rotom, {form: 'frost'}),
  B2.Potw(P.Rotom, {form: 'heat'}),
  B2.Potw(P.Rotom, {form: 'mow'}),
  B2.Potw(P.Rotom, {form: 'wash'}),
]

const RotomMap = (form?: PokemonForm) => {
  return {
    [B2.Potw(P.Rotom)]: {
      badge: B2.Potw(P.Rotom, {form}),
      changeForm: true,
      noop: form === undefined,
    },
    [B2.Potw(P.Rotom, {form: 'fan'})]: {
      badge: B2.Potw(P.Rotom, {form}),
      changeForm: true,
      noop: form === 'fan',
    },
    [B2.Potw(P.Rotom, {form: 'frost'})]: {
      badge: B2.Potw(P.Rotom, {form}),
      changeForm: true,
      noop: form === 'frost',
    },
    [B2.Potw(P.Rotom, {form: 'heat'})]: {
      badge: B2.Potw(P.Rotom, {form}),
      changeForm: true,
      noop: form === 'heat',
    },
    [B2.Potw(P.Rotom, {form: 'mow'})]: {
      badge: B2.Potw(P.Rotom, {form}),
      changeForm: true,
      noop: form === 'mow',
    },
    [B2.Potw(P.Rotom, {form: 'wash'})]: {
      badge: B2.Potw(P.Rotom, {form}),
      changeForm: true,
      noop: form === 'wash',
    },
  }
}

const DeoxysFilter = [
  B2.Potw(P.Deoxys),
  B2.Potw(P.Deoxys, {form: 'attack'}),
  B2.Potw(P.Deoxys, {form: 'defense'}),
  B2.Potw(P.Deoxys, {form: 'speed'}),
]

const DeoxysMap = (form?: PokemonForm) => {
  return {
    [B2.Potw(P.Deoxys)]: {
      badge: B2.Potw(P.Deoxys, {form}),
      changeForm: true,
      noop: form === undefined,
    },
    [B2.Potw(P.Deoxys, {form: 'attack'})]: {
      badge: B2.Potw(P.Deoxys, {form}),
      changeForm: true,
      noop: form === 'attack',
    },
    [B2.Potw(P.Deoxys, {form: 'defense'})]: {
      badge: B2.Potw(P.Deoxys, {form}),
      changeForm: true,
      noop: form === 'defense',
    },
    [B2.Potw(P.Deoxys, {form: 'speed'})]: {
      badge: B2.Potw(P.Deoxys, {form}),
      changeForm: true,
      noop: form === 'speed',
    },
  }
}

const FurfrouFilter = [
  B2.Potw(P.Furfrou),
  B2.Potw(P.Furfrou, {form: 'natural'}),
  B2.Potw(P.Furfrou, {form: 'heart'}),
  B2.Potw(P.Furfrou, {form: 'star'}),
  B2.Potw(P.Furfrou, {form: 'diamond'}),
  B2.Potw(P.Furfrou, {form: 'debutante'}),
  B2.Potw(P.Furfrou, {form: 'matron'}),
  B2.Potw(P.Furfrou, {form: 'dandy'}),
  B2.Potw(P.Furfrou, {form: 'lareine'}),
  B2.Potw(P.Furfrou, {form: 'kabuki'}),
  B2.Potw(P.Furfrou, {form: 'pharaoh'}),
]

const FurfrouMap = (form?: PokemonForm) => {
  return {
    [B2.Potw(P.Furfrou)]: {
      badge: B2.Potw(P.Furfrou, {form}),
      changeForm: true,
      noop: form === undefined,
    },
    [B2.Potw(P.Furfrou, {form: 'natural'})]: {
      badge: B2.Potw(P.Furfrou, {form}),
      changeForm: true,
      noop: form === 'natural',
    },
    [B2.Potw(P.Furfrou, {form: 'heart'})]: {
      badge: B2.Potw(P.Furfrou, {form}),
      changeForm: true,
      noop: form === 'heart',
    },
    [B2.Potw(P.Furfrou, {form: 'star'})]: {
      badge: B2.Potw(P.Furfrou, {form}),
      changeForm: true,
      noop: form === 'star',
    },
    [B2.Potw(P.Furfrou, {form: 'diamond'})]: {
      badge: B2.Potw(P.Furfrou, {form}),
      changeForm: true,
      noop: form === 'diamond',
    },
    [B2.Potw(P.Furfrou, {form: 'debutante'})]: {
      badge: B2.Potw(P.Furfrou, {form}),
      changeForm: true,
      noop: form === 'debutante',
    },
    [B2.Potw(P.Furfrou, {form: 'matron'})]: {
      badge: B2.Potw(P.Furfrou, {form}),
      changeForm: true,
      noop: form === 'matron',
    },
    [B2.Potw(P.Furfrou, {form: 'dandy'})]: {
      badge: B2.Potw(P.Furfrou, {form}),
      changeForm: true,
      noop: form === 'dandy',
    },
    [B2.Potw(P.Furfrou, {form: 'lareine'})]: {
      badge: B2.Potw(P.Furfrou, {form}),
      changeForm: true,
      noop: form === 'lareine',
    },
    [B2.Potw(P.Furfrou, {form: 'kabuki'})]: {
      badge: B2.Potw(P.Furfrou, {form}),
      changeForm: true,
      noop: form === 'kabuki',
    },
    [B2.Potw(P.Furfrou, {form: 'pharaoh'})]: {
      badge: B2.Potw(P.Furfrou, {form}),
      changeForm: true,
      noop: form === 'pharaoh',
    },
  }
}

const miniorFilter = [
  B2.Potw(P.Minior, {form: 'blue_core'}),
  B2.Potw(P.Minior, {form: 'green_core'}),
  B2.Potw(P.Minior, {form: 'indigo_core'}),
  B2.Potw(P.Minior, {form: 'orange_core'}),
  B2.Potw(P.Minior, {form: 'yellow_core'}),
  B2.Potw(P.Minior, {form: 'orange_core'}),
  B2.Potw(P.Minior, {form: 'red_core'}),
  B2.Potw(P.Minior, {form: 'violet_core'}),
  B2.Potw(P.Minior, {form: 'blue_meteor'}),
  B2.Potw(P.Minior, {form: 'green_meteor'}),
  B2.Potw(P.Minior, {form: 'indigo_meteor'}),
  B2.Potw(P.Minior, {form: 'orange_meteor'}),
  B2.Potw(P.Minior, {form: 'yellow_meteor'}),
  B2.Potw(P.Minior, {form: 'orange_meteor'}),
  B2.Potw(P.Minior, {form: 'red_meteor'}),
  B2.Potw(P.Minior, {form: 'violet_meteor'}),
]

const MiniorMap = (to: 'meteor' | 'core') => {
  return {
    [B2.Potw(P.Minior, {form: 'blue_core'})]: {
      badge: B2.Potw(P.Minior, {form: `blue_${to}` as PokemonForm}),
      changeForm: true,
      noop: to === 'core',
    },
    [B2.Potw(P.Minior, {form: 'green_core'})]: {
      badge: B2.Potw(P.Minior, {form: `green_${to}` as PokemonForm}),
      changeForm: true,
      noop: to === 'core',
    },
    [B2.Potw(P.Minior, {form: 'indigo_core'})]: {
      badge: B2.Potw(P.Minior, {form: `indigo_${to}` as PokemonForm}),
      changeForm: true,
      noop: to === 'core',
    },
    [B2.Potw(P.Minior, {form: 'orange_core'})]: {
      badge: B2.Potw(P.Minior, {form: `orange_${to}` as PokemonForm}),
      changeForm: true,
      noop: to === 'core',
    },
    [B2.Potw(P.Minior, {form: 'red_core'})]: {
      badge: B2.Potw(P.Minior, {form: `red_${to}` as PokemonForm}),
      changeForm: true,
      noop: to === 'core',
    },
    [B2.Potw(P.Minior, {form: 'yellow_core'})]: {
      badge: B2.Potw(P.Minior, {form: `yellow_${to}` as PokemonForm}),
      changeForm: true,
      noop: to === 'core',
    },
    [B2.Potw(P.Minior, {form: 'violet_core'})]: {
      badge: B2.Potw(P.Minior, {form: `violet_${to}` as PokemonForm}),
      changeForm: true,
      noop: to === 'core',
    },
    [B2.Potw(P.Minior, {form: 'blue_meteor'})]: {
      badge: B2.Potw(P.Minior, {form: `blue_${to}` as PokemonForm}),
      changeForm: true,
      noop: to === 'meteor',
    },
    [B2.Potw(P.Minior, {form: 'green_meteor'})]: {
      badge: B2.Potw(P.Minior, {form: `green_${to}` as PokemonForm}),
      changeForm: true,
      noop: to === 'meteor',
    },
    [B2.Potw(P.Minior, {form: 'indigo_meteor'})]: {
      badge: B2.Potw(P.Minior, {form: `indigo_${to}` as PokemonForm}),
      changeForm: true,
      noop: to === 'meteor',
    },
    [B2.Potw(P.Minior, {form: 'yellow_meteor'})]: {
      badge: B2.Potw(P.Minior, {form: `yellow_${to}` as PokemonForm}),
      changeForm: true,
      noop: to === 'meteor',
    },
    [B2.Potw(P.Minior, {form: 'orange_meteor'})]: {
      badge: B2.Potw(P.Minior, {form: `orange_${to}` as PokemonForm}),
      changeForm: true,
      noop: to === 'meteor',
    },
    [B2.Potw(P.Minior, {form: 'red_meteor'})]: {
      badge: B2.Potw(P.Minior, {form: `red_${to}` as PokemonForm}),
      changeForm: true,
      noop: to === 'meteor',
    },
    [B2.Potw(P.Minior, {form: 'violet_meteor'})]: {
      badge: B2.Potw(P.Minior, {form: `violet_${to}` as PokemonForm}),
      changeForm: true,
      noop: to === 'meteor',
    },
  }
}

const OricorioFilter = [
  B2.Potw(P.Oricorio),
  B2.Potw(P.Oricorio, {form: 'pau'}),
  B2.Potw(P.Oricorio, {form: 'baile'}),
  B2.Potw(P.Oricorio, {form: 'pom_pom'}),
  B2.Potw(P.Oricorio, {form: 'sensu'}),
]

const OricorioMap = (form?: PokemonForm) => {
  return {
    [B2.Potw(P.Oricorio)]: {
      badge: B2.Potw(P.Oricorio, {form}),
      changeForm: true,
      noop: form === undefined,
    },
    [B2.Potw(P.Oricorio, {form: 'baile'})]: {
      badge: B2.Potw(P.Oricorio, {form}),
      changeForm: true,
      noop: form === 'baile',
    },
    [B2.Potw(P.Oricorio, {form: 'pau'})]: {
      badge: B2.Potw(P.Oricorio, {form}),
      changeForm: true,
      noop: form === 'pau',
    },
    [B2.Potw(P.Oricorio, {form: 'pom_pom'})]: {
      badge: B2.Potw(P.Oricorio, {form}),
      changeForm: true,
      noop: form === 'pom_pom',
    },
    [B2.Potw(P.Oricorio, {form: 'sensu'})]: {
      badge: B2.Potw(P.Oricorio, {form}),
      changeForm: true,
      noop: form === 'sensu',
    },
  }
}

export function getPokemonLevel(level) {
  return Object.entries(datastore).filter(([, value]) => {
    if (value.levelAt !== undefined && value.levelAt <= level) {
      return true
    }
    return false
  }).map(([key]) => Badge.fromLegacy(key).toLegacyString() as BadgeId)
}

function getPokemonMap(level) {
  const map: EvolutionMap = {}
  Object.entries(datastore).forEach(([key, value]) => {
    if (value.levelAt !== undefined && value.levelAt <= level) {
      if (value.gender) {
        value.gender.forEach(g => {
          map[`${key}-${g}`] = {
            badge: value.levelTo as BadgeId
          }
        })
      } else if (value.syncableForms) {
        // Pokemon with both gender/form changes will still break
        value.syncableForms.forEach(f => {
          map[`${key}-${f}`] = {
            badge: value.levelTo as BadgeId
          }
        })
      }
      if (Array.isArray(value.levelTo)) {
        map[key] = { badge: randomItem<BadgeId>(value.levelTo) }
      } else {
        map[key] = {
          badge: value.levelTo!
        }
      }
    }
  })
  return map
}

export const ItemAvailability: {[key in ItemId]?: Availability} = {
  firestone: {
    filter: [
      B2.Potw(P.Vulpix),
      B2.Potw(P.Growlithe),
      B2.Potw(P.Growlithe, {form: 'hisuian'}),
      B2.Potw(P.Eevee),
      B2.Potw(P.Pansear),
    ],
    pokemon: {
      [B2.Potw(P.Vulpix)]: {
        badge: B2.Potw(P.Ninetales),
      },
      [B2.Potw(P.Growlithe)]: {
        badge: B2.Potw(P.Arcanine),
      },
      [B2.Potw(P.Growlithe, {form: 'hisuian'})]: {
        badge: B2.Potw(P.Arcanine, {form: 'hisuian'}),
      },
      [B2.Potw(P.Eevee)]: {
        badge: B2.Potw(P.Flareon)
      },
      [B2.Potw(P.Pansear)]: {
        badge: B2.Potw(P.Simisear),
      },
    },
    usable: () => true,
    consumes: () => true,
  },
  leafstone: {
    filter: [
      B2.Potw(P.Gloom),
      B2.Potw(P.Weepinbell),
      B2.Potw(P.Exeggcute),
      B2.Potw(P.Nuzleaf),
      B2.Potw(P.Pansage),
      B2.Potw(P.Voltorb, {form: 'hisuian'}),
    ],
    pokemon: {
      [B2.Potw(P.Gloom)]: {
        badge: B2.Potw(P.Vileplume),
      },
      [B2.Potw(P.Weepinbell)]: {
        badge: B2.Potw(P.Victreebel),
      },
      [B2.Potw(P.Exeggcute)]: {
        badge: B2.Potw(P.Exeggutor),
      },
      [B2.Potw(P.Nuzleaf)]: {
        badge: B2.Potw(P.Shiftry),
      },
      [B2.Potw(P.Pansage)]: {
        badge: B2.Potw(P.Simisage),
      },
      [B2.Potw(P.Voltorb, {form: 'hisuian'})]: {
        badge: B2.Potw(P.Electrode, {form: 'hisuian'}),
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  thunderstone: {
    filter: [
      B2.Potw(P.Pikachu),
      B2.Potw(P.Eevee),
      B2.Potw(P.Eelektrik),
    ],
    pokemon: {
      [B2.Potw(P.Pikachu)]: {
        badge: B2.Potw(P.Raichu),
      },
      [B2.Potw(P.Eevee)]: {
        badge: B2.Potw(P.Jolteon),
      },
      [B2.Potw(P.Eelektrik)]: {
        badge: B2.Potw(P.Eelektross),
      },
    },
    usable: () => true,
    consumes: () => true,
  },
  waterstone: {
    filter: [
      B2.Potw(P.Poliwhirl),
      B2.Potw(P.Shellder),
      B2.Potw(P.Staryu),
      B2.Potw(P.Eevee),
      B2.Potw(P.Lombre),
      B2.Potw(P.Panpour),
    ],
    pokemon: {
      [B2.Potw(P.Poliwhirl)]: {
        badge: B2.Potw(P.Poliwrath),
      },
      [B2.Potw(P.Shellder)]: {
        badge: B2.Potw(P.Cloyster),
      },
      [B2.Potw(P.Staryu)]: {
        badge: B2.Potw(P.Starmie),
      },
      [B2.Potw(P.Eevee)]: {
        badge: B2.Potw(P.Vaporeon),
      },
      [B2.Potw(P.Lombre)]: {
        badge: B2.Potw(P.Ludicolo),
      },
      [B2.Potw(P.Panpour)]: {
        badge: B2.Potw(P.Simipour),
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  moonstone: {
    filter: [
      B2.Potw(P.Nidorina),
      B2.Potw(P.Nidorino),
      B2.Potw(P.Clefairy),
      B2.Potw(P.Jigglypuff),
      B2.Potw(P.Skitty),
      B2.Potw(P.Munna),
    ],
    pokemon: {
      [B2.Potw(P.Nidorina)]: {
        badge: B2.Potw(P.Nidoqueen),
      },
      [B2.Potw(P.Nidorino)]: {
        badge: B2.Potw(P.Nidoking),
      },
      [B2.Potw(P.Clefairy)]: {
        badge: B2.Potw(P.Clefable),
      },
      [B2.Potw(P.Jigglypuff)]: {
        badge: B2.Potw(P.Wigglytuff),
      },
      [B2.Potw(P.Skitty)]: {
        badge: B2.Potw(P.Delcatty),
      },
      [B2.Potw(P.Munna)]: {
        badge: B2.Potw(P.Musharna),
      },
    },
    usable: () => true,
    consumes: () => true,
  },
  sunstone: {
    filter: [
      B2.Potw(P.Gloom),
      B2.Potw(P.Sunkern),
      B2.Potw(P.Cottonee),
      B2.Potw(P.Petilil),
      B2.Potw(P.Helioptile),
    ],
    pokemon: {
      [B2.Potw(P.Gloom)]: {
        badge: B2.Potw(P.Bellossom),
      },
      [B2.Potw(P.Sunkern)]: {
        badge: B2.Potw(P.Sunflora),
      },
      [B2.Potw(P.Cottonee)]: {
        badge: B2.Potw(P.Whimsicott),
      },
      [B2.Potw(P.Petilil)]: {
        badge: B2.Potw(P.Lilligant),
      },
      [B2.Potw(P.Helioptile)]: {
        badge: B2.Potw(P.Heliolisk),
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  duskstone: {
    filter: [
      B2.Potw(P.Murkrow),
      B2.Potw(P.Misdreavus),
      B2.Potw(P.Lampent),
      B2.Potw(P.Doublade)
    ],
    pokemon: {
      [B2.Potw(P.Murkrow)]: {
        badge: B2.Potw(P.Honchkrow),
      },
      [B2.Potw(P.Misdreavus)]: {
        badge: B2.Potw(P.Mismagius),
      },
      [B2.Potw(P.Lampent)]: {
        badge: B2.Potw(P.Chandelure),
      },
      [B2.Potw(P.Doublade)]: {
        badge: B2.Potw(P.Aegislash),
      },
    },
    usable: () => true,
    consumes: () => true,
  },
  shinystone: {
    filter: [
      B2.Potw(P.Togetic),
      B2.Potw(P.Roselia),
      B2.Potw(P.Minccino),
      B2.Potw(P.Floette),
    ],
    pokemon: {
      [B2.Potw(P.Togetic)]: {
        badge: B2.Potw(P.Togekiss),
      },
      [B2.Potw(P.Roselia)]: {
        badge: B2.Potw(P.Roserade),
      },
      [B2.Potw(P.Minccino)]: {
        badge: B2.Potw(P.Cinccino),
      },
      [B2.Potw(P.Floette)]: {
        badge: B2.Potw(P.Florges),
      },
    },
    usable: () => true,
    consumes: () => true,
  },
  dawnstone: {
    filter: [
      B2.Potw(P.Snorunt, {gender: 'female'}),
      B2.Potw(P.Kirlia, {gender: 'male'}),
    ],
    pokemon: {
      [B2.Potw(P.Snorunt, {gender: 'female'})]: {
        badge: B2.Potw(P.Froslass)
      },
      [B2.Potw(P.Kirlia, {gender: 'male'})]: {
        badge: B2.Potw(P.Gallade),
      }
    },
    usable: ({target}) => {
      if (target.id === 361 && target.personality.gender === 'female') {
        return true
      }
      if (target.id === 281 && target.personality.gender === 'male') {
        return true
      }
      return false
    },
    consumes: () => true,
  },
  icestone: {
    filter: [
      B2.Potw(P.Sandshrew, {form: 'alolan'}),
      B2.Potw(P.Vulpix, {form: 'alolan'}),
      B2.Potw(P.Darumaka, {form: 'galarian'}),
    ],
    pokemon: {
      [B2.Potw(P.Sandshrew, {form: 'alolan'})]: {
        badge: B2.Potw(P.Sandslash, {form: 'alolan'})
      },
      [B2.Potw(P.Vulpix, {form: 'alolan'})]: {
        badge: B2.Potw(P.Ninetales, {form: 'alolan'})
      },
      [B2.Potw(P.Darumaka, {form: 'galarian'})]: {
        badge: B2.Potw(P.Darmanitan, {form: 'galarian'})
      },
    },
    usable: () => true,
    consumes: () => true,
  },
  protein: {
    filter: [
      B2.Potw(P.Tyrogue),
    ],
    pokemon: {
      [B2.Potw(P.Tyrogue)]: {
        badge: B2.Potw(P.Hitmonlee),
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  iron: {
    filter: [
      B2.Potw(P.Tyrogue),
    ],
    pokemon: {
      [B2.Potw(P.Tyrogue)]: {
        badge: B2.Potw(P.Hitmonchan),
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  carbos: {
    filter: [
      B2.Potw(P.Tyrogue),
    ],
    pokemon: {
      [B2.Potw(P.Tyrogue)]: {
        badge: B2.Potw(P.Hitmontop),
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  rigidmeteorite: {
    filter: DeoxysFilter,
    pokemon: DeoxysMap('attack'),
    usable: () => true,
    consumes: () => false,
  },
  sturdymeteorite: {
    filter: DeoxysFilter,
    pokemon: DeoxysMap('defense'),
    usable: () => true,
    consumes: () => false,
  },
  smoothmeteorite: {
    filter: DeoxysFilter,
    pokemon: DeoxysMap('speed'),
    usable: () => true,
    consumes: () => false,
  },
  obsidianmeteorite: {
    filter: DeoxysFilter,
    pokemon: DeoxysMap(),
    usable: () => true,
    consumes: () => false,
  },
  pomeg: {
    filter: friendshipList,
    pokemon: friendshipPokemon,
    usable: ({target}) => {
      if (!target.personality.affectionate) {
        // This Pokémon needs to spend more time with you
        return false
      }
      return true
    },
    consumes: () => true,
  },
  kelpsy: {
    filter: friendshipList,
    pokemon: friendshipPokemon,
    usable: ({target}) => {
      if (!target.personality.affectionate) {
        return false
      }
      return true
    },
    consumes: () => true,
  },
  grepa: {
    filter: friendshipList,
    pokemon: friendshipPokemon,
    usable: ({target}) => {
      if (!target.personality.affectionate) {
        return false
      }
      return true
    },
    consumes: () => true,
  },
  hondew: {
    filter: friendshipList,
    pokemon: friendshipPokemon,
    usable: ({target}) => {
      if (!target.personality.affectionate) {
        return false
      }
      return true
    },
    consumes: () => true,
  },
  qualot: {
    filter: friendshipList,
    pokemon: friendshipPokemon,
    usable: ({target}) => {
      if (!target.personality.affectionate) {
        return false
      }
      return true
    },
    consumes: () => true,
  },
  tamato: {
    filter: friendshipList,
    pokemon: friendshipPokemon,
    usable: ({target}) => {
      if (!target.personality.affectionate) {
        return false
      }
      return true
    },
    consumes: () => true,
  },
  // While we stub these, they should actually be handled as special cases
  energypowder: {
    filter: [],
    pokemon: {},
    usable: () => true,
    consumes: () => true,
  },
  healpowder: {
    filter: [],
    pokemon: {},
    usable: () => true,
    consumes: () => true,
  },
  energyroot: {
    filter: [],
    pokemon: {},
    usable: () => true,
    consumes: () => true,
  },
  revivalherb: {
    filter: [],
    pokemon: {},
    usable: () => true,
    consumes: () => true,
  },
  prismscale: {
    filter: [
      B2.Potw(P.Feebas),
    ],
    pokemon: {
      [B2.Potw(P.Feebas)]: {
        badge: B2.Potw(P.Milotic),
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  bluepokeblock: {
    filter: [
      B2.Potw(P.Feebas),
      B2.Potw(P.Pikachu),
    ],
    pokemon: {
      [B2.Potw(P.Feebas)]: {
        badge: B2.Potw(P.Milotic),
      },
      [B2.Potw(P.Pikachu)]: {
        badge: B2.Potw(P.Pikachu, {form: 'belle'}),
      },
    },
    usable: () => true,
    consumes: () => true,
  },
  yellowpokeblock: {
    filter: [
      B2.Potw(P.Pikachu),
    ],
    pokemon: {
      [B2.Potw(P.Pikachu)]: {
        badge: B2.Potw(P.Pikachu, {form: 'libre'}),
      },
    },
    usable: () => true,
    consumes: () => true,
  },
  greenpokeblock: {
    filter: [
      B2.Potw(P.Pikachu),
    ],
    pokemon: {
      [B2.Potw(P.Pikachu)]: {
        badge: B2.Potw(P.Pikachu, {form: 'phd'}),
      },
    },
    usable: () => true,
    consumes: () => true,
  },
  pinkpokeblock: {
    filter: [
      B2.Potw(P.Pikachu),
    ],
    pokemon: {
      [B2.Potw(P.Pikachu)]: {
        badge: B2.Potw(P.Pikachu, {form: 'pop_star'}),
      },
    },
    usable: () => true,
    consumes: () => true,
  },
  redpokeblock: {
    filter: [
      B2.Potw(P.Pikachu),
    ],
    pokemon: {
      [B2.Potw(P.Pikachu)]: {
        badge: B2.Potw(P.Pikachu, {form: 'rock_star'}),
      },
    },
    usable: () => true,
    consumes: () => true,
  },
  razorclaw: {
    filter: [
      B2.Potw(P.Sneasel),
      B2.Potw(P.Sneasel, {form: 'hisuian'}),
    ],
    pokemon: {
      [B2.Potw(P.Sneasel)]: {
        badge: B2.Potw(P.Weavile),
      },
      [B2.Potw(P.Sneasel, {form: 'hisuian'})]: {
        badge: B2.Potw(P.Sneasler),
      },
    },
    usable: ({hours, target}) => {
      if (target.personality.form === undefined) {
        // Do this at night
        return hours >= 18 || hours < 6
      } else if (target.personality.form === 'hisuian') {
        // Do this during day
        return hours < 18 || hours >= 6
      }
      return false
    },
    consumes: () => true,
  },
  razorfang: {
    filter: [
      B2.Potw(P.Gligar),
    ],
    pokemon: {
      [B2.Potw(P.Gligar)]: {
        badge: B2.Potw(P.Gliscor),
      }
    },
    usable: ({hours}) => {
      // Do this at night
      return hours >= 18 || hours < 6
    },
    consumes: () => true,
  },
  ovalstone: {
    filter: [
      B2.Potw(P.Happiny)
    ],
    pokemon: {
      [B2.Potw(P.Happiny)]: {
        badge: B2.Potw(P.Chansey),
      }
    },
    usable: ({hours}) => {
      // Do this at day
      return hours < 18 || hours >= 6
    },
    consumes: () => true,
  },
  'tm-Rollout': {
    filter: [
      B2.Potw(P.Lickitung),
    ],
    pokemon: {
      [B2.Potw(P.Lickitung)]: {
        badge: B2.Potw(P.Lickilicky),
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  'tm-Double Hit': {
    filter: [
      B2.Potw(P.Aipom),
    ],
    pokemon: {
      [B2.Potw(P.Aipom)]: {
        badge: B2.Potw(P.Ambipom),
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  'tm-Ancient Power': {
    filter: [
      B2.Potw(P.Tangela),
      B2.Potw(P.Yanma),
      B2.Potw(P.Piloswine),
    ],
    pokemon: {
      [B2.Potw(P.Tangela)]: {
        badge: B2.Potw(P.Tangrowth),
      },
      [B2.Potw(P.Yanma)]: {
        badge: B2.Potw(P.Yanmega),
      },
      [B2.Potw(P.Piloswine)]: {
        badge: B2.Potw(P.Mamoswine),
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  'tm-Dragon Pulse': {
    filter: [
      B2.Potw(P.Poipole)
    ],
    pokemon: {
      [B2.Potw(P.Poipole)]: {
        badge: B2.Potw(P.Naganadel)
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  'tm-Stomp': {
    filter: [
      B2.Potw(P.Steenee)
    ],
    pokemon: {
      [B2.Potw(P.Steenee)]: {
        badge: B2.Potw(P.Tsareena)
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  'tr-Mimic': {
    filter: [
      B2.Potw(P.Bonsly),
      B2.Potw(P.Mime_Jr),
    ],
    pokemon: {
      [B2.Potw(P.Bonsly)]: {
        badge: B2.Potw(P.Sudowoodo),
      },
      [B2.Potw(P.Mime_Jr)]: {
        badge: B2.Potw(P.Mr_Mime),
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  'tr-Sunny Day': {
    filter: [
      B2.Potw(P.Castform),
      B2.Potw(P.Castform, {form: 'rainy'}),
      B2.Potw(P.Castform, {form: 'snowy'}),
      B2.Potw(P.Cherrim),
    ],
    pokemon: {
      [B2.Potw(P.Castform)]: {
        badge: B2.Potw(P.Castform, {form: 'sunny'}),
        changeForm: true,
      },
      [B2.Potw(P.Castform, {form: 'rainy'})]: {
        badge: B2.Potw(P.Castform, {form: 'sunny'}),
        changeForm: true,
      },
      [B2.Potw(P.Castform, {form: 'rainy'})]: {
        badge: B2.Potw(P.Castform, {form: 'sunny'}),
        changeForm: true,
      },
      [B2.Potw(P.Cherrim)]: {
        badge: B2.Potw(P.Cherrim, {form: 'sunshine'}),
        changeForm: true,
      },
    },
    usable: () => true,
    consumes: () => false,
  },
  'tr-Rain Dance': {
    filter: [
      B2.Potw(P.Castform),
      B2.Potw(P.Castform, {form: 'sunny'}),
      B2.Potw(P.Castform, {form: 'snowy'}),
    ],
    pokemon: {
      [B2.Potw(P.Castform)]: {
        badge: B2.Potw(P.Castform, {form: 'rainy'}),
        changeForm: true,
      },
      [B2.Potw(P.Castform, {form: 'sunny'})]: {
        badge: B2.Potw(P.Castform, {form: 'rainy'}),
        changeForm: true,
      },
      [B2.Potw(P.Castform, {form: 'snowy'})]: {
        badge: B2.Potw(P.Castform, {form: 'rainy'}),
        changeForm: true,
      },
    },
    usable: () => true,
    consumes: () => false,
  },
  'tr-Hail': {
    filter: [
      B2.Potw(P.Castform),
      B2.Potw(P.Castform, {form: 'rainy'}),
      B2.Potw(P.Castform, {form: 'sunny'}),
      B2.Potw(P.Eiscue, {form: 'noice_face'}),
    ],
    pokemon: {
      [B2.Potw(P.Castform)]: {
        badge: B2.Potw(P.Castform, {form: 'snowy'}),
        changeForm: true,
      },
      [B2.Potw(P.Castform, {form: 'rainy'})]: {
        badge: B2.Potw(P.Castform, {form: 'snowy'}),
        changeForm: true,
      },
      [B2.Potw(P.Castform, {form: 'sunny'})]: {
        badge: B2.Potw(P.Castform, {form: 'snowy'}),
        changeForm: true,
      },
      [B2.Potw(P.Eiscue, {form: 'noice_face'})]: {
        badge: B2.Potw(P.Eiscue, {form: 'ice_face'}),
        changeForm: true,
      },
    },
    usable: () => true,
    consumes: () => false,
  },
  'tr-Defog': {
    filter: [
      B2.Potw(P.Castform, {form: 'sunny'}),
      B2.Potw(P.Castform, {form: 'rainy'}),
      B2.Potw(P.Castform, {form: 'snowy'}),
      B2.Potw(P.Cherrim, {form: 'sunshine'}),
      B2.Potw(P.Dialga, {form: 'origin'}),
      B2.Potw(P.Palkia, {form: 'origin'}),
      B2.Potw(P.Giratina, {form: 'origin'}),
      B2.Potw(P.Shaymin, {form: 'sky'}),
      B2.Potw(P.Meloetta, {form: 'pirouette'}),
      B2.Potw(P.Keldeo, {form: 'resolute'}),
      B2.Potw(P.Kyurem, {form: 'black'}),
      B2.Potw(P.Kyurem, {form: 'white'}),
      B2.Potw(P.Pikachu, {form: 'belle'}),
      B2.Potw(P.Pikachu, {form: 'libre'}),
      B2.Potw(P.Pikachu, {form: 'phd'}),
      B2.Potw(P.Pikachu, {form: 'pop_star'}),
      B2.Potw(P.Pikachu, {form: 'rock_star'}),
      B2.Potw(P.Wishiwashi, {form: 'school'}),
      B2.Potw(P.Necrozma, {form: 'dusk_mane'}),
      B2.Potw(P.Necrozma, {form: 'dawn_wings'}),
      B2.Potw(P.Necrozma, {form: 'ultra_burst'}),
      B2.Potw(P.Cramorant, {form: 'gorging'}),
      B2.Potw(P.Cramorant, {form: 'gulping'}),
      B2.Potw(P.Calyrex, {form: 'ice_rider'}),
      B2.Potw(P.Calyrex, {form: 'shadow_rider'}),
    ],
    pokemon: {
      [B2.Potw(P.Castform, {form: 'sunny'})]: {
        badge: B2.Potw(P.Castform),
        changeForm: true,
      },
      [B2.Potw(P.Castform, {form: 'rainy'})]: {
        badge: B2.Potw(P.Castform),
        changeForm: true,
      },
      [B2.Potw(P.Castform, {form: 'snowy'})]: {
        badge: B2.Potw(P.Castform),
        changeForm: true,
      },
      [B2.Potw(P.Cherrim, {form: 'sunshine'})]: {
        badge: B2.Potw(P.Cherrim, {form: 'overcast'}),
        changeForm: true,
      },
      [B2.Potw(P.Dialga, {form: 'origin'})]: {
        badge: B2.Potw(P.Dialga, {}),
        changeForm: true,
      },
      [B2.Potw(P.Palkia, {form: 'origin'})]: {
        badge: B2.Potw(P.Palkia, {}),
        changeForm: true,
      },
      [B2.Potw(P.Giratina, {form: 'origin'})]: {
        badge: B2.Potw(P.Giratina, {form: 'altered'}),
        changeForm: true,
      },
      [B2.Potw(P.Shaymin, {form: 'sky'})]: {
        badge: B2.Potw(P.Shaymin, {form: 'land'}),
        changeForm: true,
      },
      [B2.Potw(P.Keldeo, {form: 'resolute'})]: {
        badge: B2.Potw(P.Keldeo, {form: 'ordinary'}),
        changeForm: true,
      },
      [B2.Potw(P.Meloetta, {form: 'pirouette'})]: {
        badge: B2.Potw(P.Meloetta, {form: 'aria'}),
        changeForm: true,
      },
      [B2.Potw(P.Kyurem, {form: 'black'})]: {
        badge: B2.Potw(P.Kyurem),
        changeForm: true,
      },
      [B2.Potw(P.Kyurem, {form: 'white'})]: {
        badge: B2.Potw(P.Kyurem),
        changeForm: true,
      },
      [B2.Potw(P.Pikachu, {form: 'belle'})]: {
        badge: B2.Potw(P.Pikachu),
        changeForm: true,
      },
      [B2.Potw(P.Pikachu, {form: 'libre'})]: {
        badge: B2.Potw(P.Pikachu),
        changeForm: true,
      },
      [B2.Potw(P.Pikachu, {form: 'phd'})]: {
        badge: B2.Potw(P.Pikachu),
        changeForm: true,
      },
      [B2.Potw(P.Pikachu, {form: 'pop_star'})]: {
        badge: B2.Potw(P.Pikachu),
        changeForm: true,
      },
      [B2.Potw(P.Pikachu, {form: 'rock_star'})]: {
        badge: B2.Potw(P.Pikachu),
        changeForm: true,
      },
      [B2.Potw(P.Wishiwashi, {form: 'school'})]: {
        badge: B2.Potw(P.Wishiwashi),
        changeForm: true,
      },
      [B2.Potw(P.Necrozma, {form: 'dusk_mane'})]: {
        badge: B2.Potw(P.Necrozma),
        changeForm: true,
      },
      [B2.Potw(P.Necrozma, {form: 'dawn_wings'})]: {
        badge: B2.Potw(P.Necrozma),
        changeForm: true,
      },
      [B2.Potw(P.Necrozma, {form: 'ultra_burst'})]: {
        badge: B2.Potw(P.Necrozma),
        changeForm: true,
      },
      [B2.Potw(P.Cramorant, {form: 'gulping'})]: {
        badge: B2.Potw(P.Cramorant),
        changeForm: true,
      },
      [B2.Potw(P.Cramorant, {form: 'gorging'})]: {
        badge: B2.Potw(P.Cramorant),
        changeForm: true,
      },
      [B2.Potw(P.Calyrex, {form: 'ice_rider'})]: {
        badge: B2.Potw(P.Calyrex),
        changeForm: true,
      },
      [B2.Potw(P.Calyrex, {form: 'shadow_rider'})]: {
        badge: B2.Potw(P.Calyrex),
        changeForm: true,
      },
    },
    usable: () => true,
    consumes: () => false,
  },
  'tm-Relic Song': {
    filter: [P.Meloetta, B2.Potw(P.Meloetta, {form: 'aria'})],
    pokemon: {
      [P.Meloetta]: {
        badge: B2.Potw(P.Meloetta, {form: 'pirouette'}),
        changeForm: true,
      },
      [B2.Potw(P.Meloetta, {form: 'aria'})]: {
        badge: B2.Potw(P.Meloetta, {form: 'pirouette'}),
        changeForm: true,
      }
    },
    usable: () => true,
    consumes: () => false,
  },
  'tm-Secret Sword': {
    filter: [P.Keldeo, B2.Potw(P.Keldeo, {form: 'ordinary'})],
    pokemon: {
      [P.Keldeo]: {
        badge: B2.Potw(P.Keldeo, {form: 'resolute'}),
        changeForm: true,
      },
      [B2.Potw(P.Keldeo, {form: 'ordinary'})]: {
        badge: B2.Potw(P.Keldeo, {form: 'resolute'}),
        changeForm: true,
      }
    },
    usable: () => true,
    consumes: () => false,
  },
  'tr-Iron Defense': {
    filter: [P.Aegislash, B2.Potw(P.Aegislash, {form: 'blade'}), ...miniorFilter],
    pokemon: {
      [P.Aegislash]: {
        badge: B2.Potw(P.Aegislash, {form: 'shield'}),
        changeForm: true,
      },
      [B2.Potw(P.Aegislash, {form: 'blade'})]: {
        badge: B2.Potw(P.Aegislash, {form: 'shield'}),
        changeForm: true,
      },
      ...MiniorMap('meteor'),
    },
    usable: () => true,
    consumes: () => false,
  },
  'tr-Swords Dance': {
    filter: [P.Aegislash, B2.Potw(P.Aegislash, {form: 'shield'})],
    pokemon: {
      [P.Aegislash]: {
        badge: B2.Potw(P.Aegislash, {form: 'blade'}),
        changeForm: true,
      },
      [B2.Potw(P.Aegislash, {form: 'shield'})]: {
        badge: B2.Potw(P.Aegislash, {form: 'blade'}),
        changeForm: true,
      },
    },
    usable: () => true,
    consumes: () => false,
  },
  'tr-Taunt': {
    filter: [P.Pancham, P.Clobbopus],
    pokemon: {
      [P.Pancham]: {
        badge: P.Pangoro,
      },
      [P.Clobbopus]: {
        badge: P.Grapploct,
      },
    },
    usable: () => true,
    consumes: () => true,
  },
  'tr-Charm': {
    filter: [P.Eevee],
    pokemon: {
      [P.Eevee]: {
        badge: P.Sylveon,
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  'tr-Shell Smash': {
    filter: [...miniorFilter],
    pokemon: {
      ...MiniorMap('core')
    },
    usable: () => true,
    consumes: () => false,
  },
  'tr-Double Team': {
    filter: [P.Wishiwashi],
    pokemon: {
      [P.Wishiwashi]: {
        badge: B2.Potw(P.Wishiwashi, {form: 'school'}),
        changeForm: true,
      }
    },
    usable: () => true,
    consumes: () => false,
  },
  adamantorb: {
    filter: [
      B2.Potw(P.Dialga),
    ],
    pokemon: {
      [B2.Potw(P.Dialga)]: {
        badge: B2.Potw(P.Dialga, {form: 'origin'}),
        changeForm: true,
      },
    },
    usable: () => true,
    consumes: () => false,
  },
  lustrousorb: {
    filter: [
      B2.Potw(P.Palkia),
    ],
    pokemon: {
      [B2.Potw(P.Palkia)]: {
        badge: B2.Potw(P.Palkia, {form: 'origin'}),
        changeForm: true,
      },
    },
    usable: () => true,
    consumes: () => false,
  },
  griseousorb: {
    filter: [
      B2.Potw(P.Giratina),
      B2.Potw(P.Giratina, {form: 'altered'})
    ],
    pokemon: {
      [B2.Potw(P.Giratina)]: {
        badge: B2.Potw(P.Giratina, {form: 'origin'}),
        changeForm: true,
      },
      [B2.Potw(P.Giratina, {form: 'altered'})]: {
        badge: B2.Potw(P.Giratina, {form: 'origin'}),
        changeForm: true,
      }
    },
    usable: () => true,
    consumes: () => false,
  },
  gracidea: {
    filter: [
      B2.Potw(P.Shaymin),
      B2.Potw(P.Shaymin, {form: 'land'})
    ],
    pokemon: {
      [B2.Potw(P.Shaymin)]: {
        badge: B2.Potw(P.Shaymin, {form: 'sky'}),
        changeForm: true,
      },
      [B2.Potw(P.Shaymin, {form: 'land'})]: {
        badge: B2.Potw(P.Shaymin, {form: 'sky'}),
        changeForm: true,
      }
    },
    usable: () => true,
    consumes: () => false,
  },
  brokenfan: {
    filter: RotomFilter,
    pokemon: RotomMap('fan'),
    usable: () => true,
    consumes: () => false,
  },
  brokenfridge: {
    filter: RotomFilter,
    pokemon: RotomMap('frost'),
    usable: () => true,
    consumes: () => false,
  },
  brokenmicrowave: {
    filter: RotomFilter,
    pokemon: RotomMap('heat'),
    usable: () => true,
    consumes: () => false,
  },
  brokenmower: {
    filter: RotomFilter,
    pokemon: RotomMap('mow'),
    usable: () => true,
    consumes: () => false,
  },
  brokenwasher: {
    filter: RotomFilter,
    pokemon: RotomMap('wash'),
    usable: () => true,
    consumes: () => false,
  },
  brokenlight: {
    filter: RotomFilter,
    pokemon: RotomMap(undefined),
    usable: () => true,
    consumes: () => false,
  },
  dnasplicerblack: {
    filter: [B2.Potw(P.Kyurem)],
    pokemon: {
      [B2.Potw(P.Kyurem)]: {
        badge: B2.Potw(P.Kyurem, {form: 'black'}),
        changeForm: true,
      }
    },
    usable: () => true,
    consumes: () => false,
  },
  dnasplicerwhite: {
    filter: [B2.Potw(P.Kyurem)],
    pokemon: {
      [B2.Potw(P.Kyurem)]: {
        badge: B2.Potw(P.Kyurem, {form: 'white'}),
        changeForm: true,
      }
    },
    usable: () => true,
    consumes: () => false,
  },
  revealglass: {
    filter: [
      B2.Potw(P.Thundurus),
      B2.Potw(P.Tornadus),
      B2.Potw(P.Landorus),
      B2.Potw(P.Tornadus, {form: 'incarnate'}),
      B2.Potw(P.Tornadus, {form: 'therian'}),
      B2.Potw(P.Thundurus, {form: 'incarnate'}),
      B2.Potw(P.Thundurus, {form: 'therian'}),
      B2.Potw(P.Landorus, {form: 'incarnate'}),
      B2.Potw(P.Landorus, {form: 'therian'}),
      B2.Potw(P.Enamorus),
      B2.Potw(P.Enamorus, {form: 'incarnate'}),
      B2.Potw(P.Enamorus, {form: 'therian'}),
    ],
    pokemon: {
      [B2.Potw(P.Thundurus)]: {
        badge: B2.Potw(P.Thundurus, {form: 'therian'}),
        changeForm: true,
      },
      [B2.Potw(P.Tornadus)]: {
        badge: B2.Potw(P.Tornadus, {form: 'therian'}),
        changeForm: true,
      },
      [B2.Potw(P.Landorus)]: {
        badge: B2.Potw(P.Landorus, {form: 'therian'}),
        changeForm: true,
      },
      [B2.Potw(P.Tornadus, {form: 'incarnate'})]: {
        badge: B2.Potw(P.Tornadus, {form: 'therian'}),
        changeForm: true,
      },
      [B2.Potw(P.Tornadus, {form: 'therian'})]: {
        badge: B2.Potw(P.Tornadus, {form: 'incarnate'}),
        changeForm: true,
      },
      [B2.Potw(P.Thundurus, {form: 'incarnate'})]: {
        badge: B2.Potw(P.Thundurus, {form: 'therian'}),
        changeForm: true,
      },
      [B2.Potw(P.Thundurus, {form: 'therian'})]: {
        badge: B2.Potw(P.Thundurus, {form: 'incarnate'}),
        changeForm: true,
      },
      [B2.Potw(P.Landorus, {form: 'incarnate'})]: {
        badge: B2.Potw(P.Landorus, {form: 'therian'}),
        changeForm: true,
      },
      [B2.Potw(P.Landorus, {form: 'therian'})]: {
        badge: B2.Potw(P.Landorus, {form: 'incarnate'}),
        changeForm: true,
      },
      [B2.Potw(P.Enamorus)]: {
        badge: B2.Potw(P.Enamorus, {form: 'therian'}),
        changeForm: true,
      },
      [B2.Potw(P.Enamorus, {form: 'incarnate'})]: {
        badge: B2.Potw(P.Enamorus, {form: 'therian'}),
        changeForm: true,
      },
      [B2.Potw(P.Enamorus, {form: 'therian'})]: {
        badge: B2.Potw(P.Enamorus, {form: 'incarnate'}),
        changeForm: true,
      },
    },
    usable: () => true,
    consumes: () => false,
  },
  trimnatural: {
    filter: FurfrouFilter,
    pokemon: FurfrouMap('natural'),
    usable: () => true,
    consumes: () => true,
  },
  trimheart: {
    filter: FurfrouFilter,
    pokemon: FurfrouMap('heart'),
    usable: () => true,
    consumes: () => true,
  },
  trimstar: {
    filter: FurfrouFilter,
    pokemon: FurfrouMap('star'),
    usable: () => true,
    consumes: () => true,
  },
  trimdiamond: {
    filter: FurfrouFilter,
    pokemon: FurfrouMap('diamond'),
    usable: () => true,
    consumes: () => true,
  },
  trimdeputante: {
    filter: FurfrouFilter,
    pokemon: FurfrouMap('debutante'),
    usable: () => true,
    consumes: () => true,
  },
  trimmatron: {
    filter: FurfrouFilter,
    pokemon: FurfrouMap('matron'),
    usable: () => true,
    consumes: () => true,
  },
  trimdandy: {
    filter: FurfrouFilter,
    pokemon: FurfrouMap('dandy'),
    usable: () => true,
    consumes: () => true,
  },
  trimlareine: {
    filter: FurfrouFilter,
    pokemon: FurfrouMap('lareine'),
    usable: () => true,
    consumes: () => true,
  },
  trimkabuki: {
    filter: FurfrouFilter,
    pokemon: FurfrouMap('kabuki'),
    usable: () => true,
    consumes: () => true,
  },
  trimpharaoh: {
    filter: FurfrouFilter,
    pokemon: FurfrouMap('pharaoh'),
    usable: () => true,
    consumes: () => true,
  },
  prisonbottle: {
    filter: [P.Hoopa, B2.Potw(P.Hoopa, {form: 'confined'}), B2.Potw(P.Hoopa, {form: 'unbound'})],
    pokemon: {
      [P.Hoopa]: {
        badge: B2.Potw(P.Hoopa, {form: 'unbound'}),
        changeForm: true,
      },
      [B2.Potw(P.Hoopa, {form: 'confined'})]: {
        badge: B2.Potw(P.Hoopa, {form: 'unbound'}),
        changeForm: true,
      },
      [B2.Potw(P.Hoopa, {form: 'unbound'})]: {
        badge: B2.Potw(P.Hoopa, {form: 'confined'}),
        changeForm: true,
      },
    },
    usable: () => true,
    consumes: () => false,
  },
  abilitycapsule: {
    filter: [
      P.Darmanitan, B2.Potw(P.Darmanitan, {form: 'zen'}),
      B2.Potw(P.Darmanitan, {form: 'galarian'}),
      B2.Potw(P.Darmanitan, {form: 'galarian_zen'}),
      P.Greninja, B2.Potw(P.Greninja, {form: 'ash'}),
      P.Zygarde, B2.Potw(P.Zygarde, {form: 'ten'}),
      B2.Potw(P.Zygarde, {form: 'fifty'}),
      B2.Potw(P.Zygarde, {form: 'complete'}),
    ],
    pokemon: {
      [P.Darmanitan]: {
        badge: B2.Potw(P.Darmanitan, {form: 'zen'}),
        changeForm: true,
      },
      [B2.Potw(P.Darmanitan, {form: 'zen'})]: {
        badge: P.Darmanitan,
        changeForm: true,
      },
      [B2.Potw(P.Darmanitan, {form: 'galarian'})]: {
        badge: B2.Potw(P.Darmanitan, {form: 'galarian_zen'}),
        changeForm: true,
      },

      [B2.Potw(P.Darmanitan, {form: 'galarian_zen'})]: {
        badge: B2.Potw(P.Darmanitan, {form: 'galarian'}),
        changeForm: true,
      },
      [P.Greninja]: {
        badge: B2.Potw(P.Greninja, {form: 'ash'}),
        changeForm: true,
      },
      [B2.Potw(P.Greninja, {form: 'ash'})]: {
        badge: P.Greninja,
        changeForm: true,
      },
      [B2.Potw(P.Zygarde)]: {
        badge: B2.Potw(P.Zygarde, {form: 'complete'}),
        changeForm: true,
      },
      [B2.Potw(P.Zygarde, {form: 'ten'})]: {
        badge: B2.Potw(P.Zygarde, {form: 'fifty'}),
        changeForm: true,
      },
      [B2.Potw(P.Zygarde, {form: 'fifty'})]: {
        badge: B2.Potw(P.Zygarde, {form: 'complete'}),
        changeForm: true,
      },
      [B2.Potw(P.Zygarde, {form: 'complete'})]: {
        badge: B2.Potw(P.Zygarde, {form: 'ten'}), // Loop back
        changeForm: true,
      },
    },
    usable: () => true,
    consumes: () => true,
  },
  strangesouvenir: {
    filter: [P.Pikachu, P.Exeggcute, P.Cubone],
    pokemon: {
      [P.Pikachu]: {
        badge: B2.Potw(P.Raichu, {form: 'alolan'}),
      },
      [P.Exeggcute]: {
        badge: B2.Potw(P.Exeggutor, {form: 'alolan'}),
      },
      [P.Cubone]: {
        badge: B2.Potw(P.Marowak, {form: 'alolan'}),
      },
    },
    usable: () => true,
    consumes: () => true,
  },
  yellownectar: {
    filter: OricorioFilter,
    pokemon: OricorioMap('pom_pom'),
    usable: () => true,
    consumes: () => true,
  },
  rednectar: {
    filter: OricorioFilter,
    pokemon: OricorioMap('baile'),
    usable: () => true,
    consumes: () => true,
  },
  pinknectar: {
    filter: OricorioFilter,
    pokemon: OricorioMap('pau'),
    usable: () => true,
    consumes: () => true,
  },
  purplenectar: {
    filter: OricorioFilter,
    pokemon: OricorioMap('sensu'),
    usable: () => true,
    consumes: () => true,
  },
  sunflute: {
    filter: [P.Cosmoem],
    pokemon: {
      [P.Cosmoem]: {
        badge: B2.Potw(P.Solgaleo)
      }
    },
    usable: () => true,
    consumes: () => false,
  },
  moonflute: {
    filter: [P.Cosmoem],
    pokemon: {
      [P.Cosmoem]: {
        badge: B2.Potw(P.Lunala)
      }
    },
    usable: () => true,
    consumes: () => false,
  },
  nlunarizer: {
    filter: [P.Necrozma],
    pokemon: {
      [P.Necrozma]: {
        badge: B2.Potw(P.Necrozma, {form: 'dawn_wings'})
      }
    },
    usable: () => true,
    consumes: () => false,
  },
  nsolarizer: {
    filter: [P.Necrozma],
    pokemon: {
      [P.Necrozma]: {
        badge: B2.Potw(P.Necrozma, {form: 'dusk_mane'})
      }
    },
    usable: () => true,
    consumes: () => false,
  },
  zultranecrozium: {
    filter: [P.Necrozma],
    pokemon: {
      [P.Necrozma]: {
        badge: B2.Potw(P.Necrozma, {form: 'ultra_burst'})
      }
    },
    usable: () => true,
    consumes: () => false,
  },
  meltancandy: {
    filter: [P.Meltan],
    pokemon: {
      [P.Meltan]: {
        badge: B2.Potw(P.Melmetal),
      }
    },
    usable: ({quantity}) => quantity >= 400,
    consumes: () => 400,
  },
  dynamaxcandy: {
    filter: [P.Koffing, P.Mime_Jr],
    pokemon: {
      [P.Koffing]: {
        badge: B2.Potw(P.Weezing, {form: 'galarian'}),
      },
      [P.Mime_Jr]: {
        badge: B2.Potw(P.Mr_Mime, {form: 'galarian'}),
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  sweetapple: {
    filter: [P.Applin],
    pokemon: {
      [P.Applin]: {
        badge: B2.Potw(P.Appletun),
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  tartapple: {
    filter: [P.Applin],
    pokemon: {
      [P.Applin]: {
        badge: B2.Potw(P.Flapple),
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  chippedpot: {
    filter: [B2.Potw(P.Sinistea, {form: 'antique'})],
    pokemon: {
      [B2.Potw(P.Sinistea, {form: 'antique'})]: {
        badge: B2.Potw(P.Polteageist, {form: 'antique'}),
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  crackedpot: {
    filter: [B2.Potw(P.Sinistea, {form: 'phony'})],
    pokemon: {
      [B2.Potw(P.Sinistea, {form: 'phony'})]: {
        badge: B2.Potw(P.Polteageist, {form: 'phony'}),
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  'tm-Rock Smash': {
    filter: [P.Eiscue, B2.Potw(P.Eiscue, {form: 'ice_face'})],
    pokemon: {
      [P.Eiscue]: {
        badge: B2.Potw(P.Eiscue, {form: 'noice_face'}),
        changeForm: true,
      },
      [B2.Potw(P.Eiscue, {form: 'ice_face'})]: {
        badge: B2.Potw(P.Eiscue, {form: 'noice_face'}),
        changeForm: true,
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  'tm-Dive': {
    filter: [P.Cramorant, B2.Potw(P.Cramorant, {form: 'gorging'})],
    pokemon: {
      [P.Cramorant]: {
        badge: B2.Potw(P.Cramorant, {form: 'gulping'}),
        changeForm: true,
      },
      [B2.Potw(P.Cramorant, {form: 'gorging'})]: {
        badge: B2.Potw(P.Cramorant, {form: 'gulping'}),
        changeForm: true,
      },
    },
    usable: () => true,
    consumes: () => true,
  },
  'tm-Surf': {
    filter: [P.Cramorant, B2.Potw(P.Cramorant, {form: 'gulping'})],
    pokemon: {
      [P.Cramorant]: {
        badge: B2.Potw(P.Cramorant, {form: 'gorging'}),
        changeForm: true,
      },
      [B2.Potw(P.Cramorant, {form: 'gulping'})]: {
        badge: B2.Potw(P.Cramorant, {form: 'gorging'}),
        changeForm: true,
      },
    },
    usable: () => true,
    consumes: () => true,
  },
  'leftovers': {
    filter: [P.Morpeko, B2.Potw(P.Morpeko, {form: 'full_belly'})],
    pokemon: {
      [P.Morpeko]: {
        badge: B2.Potw(P.Morpeko, {form: 'hangry'}),
        changeForm: true,
      },
      [B2.Potw(P.Morpeko, {form: 'full_belly'})]: {
        badge: B2.Potw(P.Morpeko, {form: 'hangry'}),
        changeForm: true,
      },
    },
    usable: () => true,
    consumes: () => true,
  },
  'oran': {
    filter: [P.Morpeko, B2.Potw(P.Morpeko, {form: 'hangry'})],
    pokemon: {
      [P.Morpeko]: {
        badge: B2.Potw(P.Morpeko, {form: 'full_belly'}),
        changeForm: true,
      },
      [B2.Potw(P.Morpeko, {form: 'hangry'})]: {
        badge: B2.Potw(P.Morpeko, {form: 'full_belly'}),
        changeForm: true,
      },
    },
    usable: () => true,
    consumes: () => true,
  },
  'scrollofdarkness': {
    filter: [P.Kubfu],
    pokemon: {
      [P.Kubfu]: {
        badge: B2.Potw(P.Urshifu, {form: 'single_strike'}),
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  'scrollofwaters': {
    filter: [P.Kubfu],
    pokemon: {
      [P.Kubfu]: {
        badge: B2.Potw(P.Urshifu, {form: 'rapid_strike'}),
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  'reinsofunityglacier': {
    filter: [P.Calyrex],
    pokemon: {
      [P.Calyrex]: {
        badge: B2.Potw(P.Calyrex, {form: 'ice_rider'}),
        changeForm: true,
      }
    },
    usable: () => true,
    consumes: () => false,
  },
  'reinsofunityspectral': {
    filter: [P.Calyrex],
    pokemon: {
      [P.Calyrex]: {
        badge: B2.Potw(P.Calyrex, {form: 'shadow_rider'}),
        changeForm: true,
      }
    },
    usable: () => true,
    consumes: () => false,
  },
  blackaugurite: {
    filter: [P.Scyther],
    pokemon: {
      [P.Scyther]: {
        badge: B2.Potw(P.Kleavor),
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  peatblock: {
    filter: [P.Ursaring],
    pokemon: {
      [P.Ursaring]: {
        badge: B2.Potw(P.Ursaluna),
      }
    },
    usable: () => getMoonPhase() === 'Full Moon',
    consumes: () => true,
  },
  'tm-Barb Barrage': {
    filter: [B2.Potw(P.Qwilfish, {form: 'hisuian'})],
    pokemon: {
      [B2.Potw(P.Qwilfish, {form: 'hisuian'})]: {
        badge: B2.Potw(P.Overqwil),
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  'tm-Psyshield Bash': {
    filter: [P.Stantler],
    pokemon: {
      [P.Stantler]: {
        badge: B2.Potw(P.Wyrdeer),
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  jubilifemuffin: {
    filter: [P.Quilava, P.Dewott, P.Petilil, P.Rufflet, P.Bergmite, P.Goomy, P.Dartrix],
    pokemon: {
      [P.Quilava]: {
        badge: B2.Potw(P.Typhlosion, {form: 'hisuian'}),
      },
      [P.Dewott]: {
        badge: B2.Potw(P.Samurott, {form: 'hisuian'})
      },
      [P.Petilil]: {
        badge: B2.Potw(P.Lilligant, {form: 'hisuian'})
      },
      [P.Rufflet]: {
        badge: B2.Potw(P.Braviary, {form: 'hisuian'})
      },
      [P.Bergmite]: {
        badge: B2.Potw(P.Avalugg, {form: 'hisuian'})
      },
      [P.Goomy]: {
        badge: B2.Potw(P.Sliggoo, {form: 'hisuian'})
      },
      [P.Dartrix]: {
        badge: B2.Potw(P.Decidueye, {form: 'hisuian'})
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  sweetstrawberry: {
    filter: [P.Milcery],
    pokemon: {
      [P.Milcery]: {
        // Should follow custom logic
        badge: B2.Potw(P.Alcremie, {form: 'strawberry_vanilla_cream'})
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  sweetberry: {
    filter: [P.Milcery],
    pokemon: {
      [P.Milcery]: {
        // Should follow custom logic
        badge: B2.Potw(P.Alcremie, {form: 'berry_vanilla_cream'})
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  sweetlove: {
    filter: [P.Milcery],
    pokemon: {
      [P.Milcery]: {
        // Should follow custom logic
        badge: B2.Potw(P.Alcremie, {form: 'love_vanilla_cream'})
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  sweetstar: {
    filter: [P.Milcery],
    pokemon: {
      [P.Milcery]: {
        // Should follow custom logic
        badge: B2.Potw(P.Alcremie, {form: 'star_vanilla_cream'})
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  sweetclover: {
    filter: [P.Milcery],
    pokemon: {
      [P.Milcery]: {
        // Should follow custom logic
        badge: B2.Potw(P.Alcremie, {form: 'clover_vanilla_cream'})
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  sweetflower: {
    filter: [P.Milcery],
    pokemon: {
      [P.Milcery]: {
        // Should follow custom logic
        badge: B2.Potw(P.Alcremie, {form: 'flower_vanilla_cream'})
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  sweetribbon: {
    filter: [P.Milcery],
    pokemon: {
      [P.Milcery]: {
        // Should follow custom logic
        badge: B2.Potw(P.Alcremie, {form: 'ribbon_vanilla_cream'})
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  galaricacuff: {
    filter: [B2.Potw(P.Slowpoke, {form: 'galarian'})],
    pokemon: {
      [B2.Potw(P.Slowpoke, {form: 'galarian'})]: {
        badge: B2.Potw(P.Slowbro, {form: 'galarian'})
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  galaricawreath: {
    filter: [B2.Potw(P.Slowpoke, {form: 'galarian'})],
    pokemon: {
      [B2.Potw(P.Slowpoke, {form: 'galarian'})]: {
        badge: B2.Potw(P.Slowking, {form: 'galarian'})
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  'tm-Rage Fist': {
    filter: [P.Primeape],
    pokemon: {
      [P.Primeape]: {
        badge: P.Annihilape,
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  'tm-Hyper Drill': {
    filter: [P.Dunsparce],
    pokemon: {
      [P.Dunsparce]: {
        badge: P.Dudunsparce,
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  'tm-Twin Beam': {
    filter: [P.Girafarig],
    pokemon: {
      [P.Girafarig]: {
        badge: P.Farigiraf,
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  'leaderscrest': {
    filter: [P.Bisharp],
    pokemon: {
      [P.Bisharp]: {
        badge: P.Kingambit,
      }
    },
    usable: () => true,
    consumes: () => true,
  },
  'gimmighoulcoin': {
    filter: [B2.Potw(P.Gimmighoul, {form: 'roaming'}), B2.Potw(P.Gimmighoul, {form: 'chest'})],
    pokemon: {
      [B2.Potw(P.Gimmighoul, {form: 'roaming'})]: {
        badge: P.Gholdengo,
      },
      [B2.Potw(P.Gimmighoul, {form: 'chest'})]: {
        badge: P.Gholdengo,
      },
    },
    usable: ({quantity}) => quantity >= 999,
    consumes: () => 999,
  },
  expcandyxs: {
    // 4/(x * .75) <= 1/2, x ~ 12
    filter: getPokemonLevel(12),
    pokemon: getPokemonMap(12),
    usable: () => true,
    consumes: () => true,
  },
  expcandys: {
    // 4/(x * .5) <= 1/2, x ~ 16
    filter: getPokemonLevel(16),
    pokemon: getPokemonMap(16),
    usable: () => true,
    consumes: () => true,
  },
  expcandym: {
    // 4/(x * .33) <= 1/2, x ~ 24
    filter: getPokemonLevel(24),
    pokemon: getPokemonMap(24),
    usable: () => true,
    consumes: () => true,
  },
  expcandyl: {
    // 4/(x * .25) <= 1/2, x ~ 36
    filter: getPokemonLevel(36),
    pokemon: getPokemonMap(36),
    usable: () => true,
    consumes: () => true,
  },
  expcandyxl: {
    // 4/(x * .15) <= 1/2, x ~ 54
    filter: getPokemonLevel(54),
    pokemon: getPokemonMap(54),
    usable: () => true,
    consumes: () => true,
  },
  rarecandy: {
    // x = yes
    filter: getPokemonLevel(100),
    pokemon: getPokemonMap(100),
    usable: () => true,
    consumes: () => true,
  },
}

export type UserSpin = 'QUICK_CLOCKWISE' | 'QUICK_ANTICLOCKWISE' |
  'SLOW_CLOCKWISE' | 'SLOW_ANTICLOCKWISE'

export type MilcerySpin = 'QUICK_CLOCKWISE_DAY' | 'QUICK_ANTICLOCKWISE_DAY' |
  'SLOW_CLOCKWISE_DAY' | 'SLOW_ANTICLOCKWISE_DAY' |
  'QUICK_CLOCKWISE_NIGHT' | 'QUICK_ANTICLOCKWISE_NIGHT' |
  'SLOW_CLOCKWISE_NIGHT' | 'SLOW_ANTICLOCKWISE_NIGHT' | 'SLOW_ANTICLOCKWISE_DUSK'

export interface ItemUsageParams {
  target: PokemonId,
  item: ItemId
  location: Location,
  pokemon: TPokemon
  hours: number,
  items: Record<ItemId, number>
  /** Gyroscopic sensor data for Z-axis. For Inkay. */
  gyroZ: number
  spin?: UserSpin
}

export interface UseItemOutput {
  /**
   * Identifier of the changed Pokemon
   */
  output: PokemonId,
  /**
   * Really only useful for Shedinja
   */
  others?: PokemonId[],
  /**
   * Whether the provided item should be removed.
   */
  consumedItem: boolean | number
  changeType: F.UseItem.ChangeType
}

const locationSpecificPokemon: BadgeId[] = [
  B2.Potw(P.Magneton),
  B2.Potw(P.Nosepass), 
  B2.Potw(P.Eevee),
  B2.Potw(P.Charjabug),
  B2.Potw(P.Crabrawler),
]
// Make a specific list here so that something like 'ragecandybar' doesn't get
// identified as 'candy'.
const evolutionCandy: ItemId[] = [
  'expcandyxs', 'expcandys', 'expcandym', 'expcandyl', 'expcandyxl', 'rarecandy'
]

const milcerySweets: ItemId[] = [
  'sweetstrawberry', 'sweetberry', 'sweetlove', 'sweetstar', 'sweetclover',
  'sweetflower', 'sweetribbon'
]

export function useItem(params: ItemUsageParams): UseItemOutput {
  const {target, item, location, pokemon, hours, items} = params
  // We assume this Pokemon exists
  const badge = new Badge(target)
  const availability: Availability = ItemAvailability[item]!
  if (!availability) {
    throw new Error(`Cannot use item ${item} on any target`)
  }
  // FIXME: Need to normalize this badge
  const filter = availability.filter.map(x => {
    if (x.startsWith('potw-')) return x
    return new Badge(x).toLegacyString()
  })
  const dbKey = Pkmn.get(badge.toLegacyString())!.key
  if (!filter.includes(dbKey)) { // Verify that Cosplay Pikachu cannot evolve
  // if (!B2.TeamsBadge.match(badge.toLegacyString(), filter, MATCH_FILTER).match) {
    throw new Error(`Cannot use item ${item} on target ${target}/${badge.toLegacyString()}: ${dbKey} ${filter}`)
  }
  if (!availability.usable({target: badge, currentPokemon: pokemon, hours, quantity: items[item]})) {
    throw new Error(`Cannot use item ${item} on target ${target}/${badge.toLegacyString()} at this time`)
  }

  if (evolutionCandy.includes(item) && locationSpecificPokemon.includes(dbKey)) {
    // eg. If you have a Magneton and it is not in a magnetic field, do nothing here
    if (badge.id === PI.Magneton && location.magneticField) {
      badge.id = PI.Magnezone
      return {
        consumedItem: true,
        output: badge.toString(),
        changeType: 'EVO',
      }
    }

    if (badge.id === PI.Nosepass && location.magneticField) {
      badge.id = PI.Probopass
      return {
        consumedItem: true,
        output: badge.toString(),
        changeType: 'EVO',
      }
    }

    if (badge.id === PI.Charjabug && location.magneticField) {
      badge.id = PI.Vikavolt
      return {
        consumedItem: true,
        output: badge.toString(),
        changeType: 'EVO',
      }
    }

    if (badge.id === PI.Eevee && location.mossyRock) {
      badge.id = PI.Leafeon
      return {
        consumedItem: true,
        output: badge.toString(),
        changeType: 'EVO',
      }
    }

    if (badge.id === PI.Eevee && location.icyRock) {
      badge.id = PI.Glaceon
      return {
        consumedItem: true,
        output: badge.toString(),
        changeType: 'EVO',
      }
    }

    // Crabrawler can only evolve in Regice locations (rather than just Mt. Lanikala)
    // If Crabrawler returns in S/V with a new evo method, we can adapt.
    if (badge.id === PI.Crabrawler && location.regice) {
      badge.id = PI.Crabominable
      return {
        consumedItem: true,
        output: badge.toString(),
        changeType: 'EVO',
      }
    }

    throw new Error(`Item ${item} cannot be used in this location ${location.label} for ${dbKey}`)
  }

  if (evolutionCandy.includes(item) && badge.id === PI.Inkay) {
    if (params.gyroZ === 0) {
      // Too precise
      throw new Error(`Item ${item} cannot be used in this position for ${dbKey}`)
    }
    // Check Z
    if (params.gyroZ > 345 || params.gyroZ < 15) {
      badge.id = PI.Malamar
      return {
        consumedItem: true,
        output: badge.toString(),
        changeType: 'EVO',
      }
    }
    throw new Error(`Item ${item} cannot be used in the position ${params.gyroZ} for ${dbKey}`)
  }

  if (evolutionCandy.includes(item) && badge.id === PI.Sliggoo) {
    // Check the weather
    if (location.forecast !== 'Rain') {
      throw new Error(`Item ${item} cannot be used in this location ${location.label} in this weather`)
    }
    badge.id = PI.Goodra
    return {
      consumedItem: true,
      output: badge.toString(),
      changeType: 'EVO',
    }
  }

  if (evolutionCandy.includes(item) && badge.id === PI.Tyrunt) {
    // Check the weather
    if (timeOfDay(location) !== 'Day') {
      throw new Error(`Item ${item} cannot be used in this location ${location.label} this time of day`)
    }
    badge.id = PI.Tyrantrum
    return {
      consumedItem: true,
      output: badge.toString(),
      changeType: 'EVO',
    }
  }

  if (evolutionCandy.includes(item) && badge.id === PI.Amaura) {
    // Check the weather
    if (timeOfDay(location) !== 'Night') {
      throw new Error(`Item ${item} cannot be used in this location ${location.label} this time of day`)
    }
    badge.id = PI.Aurorus
    return {
      consumedItem: true,
      output: badge.toString(),
      changeType: 'EVO',
    }
  }

  if (evolutionCandy.includes(item) && badge.id === PI.Spewpa) {
    const {vivillon} = location
    if (!vivillon) {
      throw new Error(`Item ${item} cannot be used in this location ${location.label}`)
    }
    badge.id = PI.Vivillon
    badge.personality.form = vivillon
    return {
      consumedItem: true,
      output: badge.toString(),
      changeType: 'EVO',
    }
  } else if (badge.id === PI.Spewpa) {
    throw new Error(`Spewpa cannot be evolved in this location ${location.label} with ${item}`)
  }

  if (evolutionCandy.includes(item) && badge.id === PI.Rattata && badge.personality.form === 'alolan') {
    // Check the weather
    if (timeOfDay(location) !== 'Night') {
      throw new Error(`Item ${item} cannot be used in this location ${location.label} today`)
    }
    badge.id = PI.Raticate
    return {
      consumedItem: true,
      output: badge.toString(),
      changeType: 'EVO',
    }
  }

  if (evolutionCandy.includes(item) && badge.id === PI.Yungoos) {
    // Check the weather
    if (timeOfDay(location) !== 'Day') {
      throw new Error(`Item ${item} cannot be used in this location ${location.label} today`)
    }
    badge.id = PI.Gumshoos
    return {
      consumedItem: true,
      output: badge.toString(),
      changeType: 'EVO',
    }
  }

  if (evolutionCandy.includes(item) && badge.id === PI.Fomantis) {
    // Check the weather
    if (timeOfDay(location) !== 'Day') {
      throw new Error(`Item ${item} cannot be used in this location ${location.label} today`)
    }
    badge.id = PI.Lurantis
    return {
      consumedItem: true,
      output: badge.toString(),
      changeType: 'EVO',
    }
  }

  if (evolutionCandy.includes(item) && badge.id === PI.Rockruff) {
    // Check the weather
    const tod = timeOfDay(location)
    const dusk = isDusk(location)
    badge.id = PI.Lycanroc
    if (dusk) {
      badge.personality.form = 'dusk'
    } else if (tod === 'Day') {
      badge.personality.form = 'midday'
    } else {
      badge.personality.form = 'midnight'
    }
    return {
      consumedItem: true,
      output: badge.toString(),
      changeType: 'EVO',
    }
  }

  if (evolutionCandy.includes(item) && badge.id === PI.Toxel) {
    // Toxel evo depends on its Nature
    const formMap: Record<Nature, PokemonForm> = {
      Hardy: 'amped',
      Adamant: 'amped',
      Bold: 'low_key',
      Timid: 'low_key',
      Modest: 'low_key',
      Calm: 'low_key',
      Naughty: 'amped',
      Jolly: 'amped',
      Neutral: 'amped', // ?
      Bashful: 'low_key',
      Docile: 'amped',
      Quirky: 'amped',
      Serious: 'low_key',
    }
    badge.id = PI.Toxtricity
    badge.personality.form = formMap[badge.personality.nature!]
    return {
      consumedItem: true,
      output: badge.toString(),
      changeType: 'EVO',
    }
  }

  if (milcerySweets.includes(item) && badge.id === PI.Milcery) {
    const milcerySpin: MilcerySpin = (() => {
      if (isDusk(location) && params.spin === 'SLOW_ANTICLOCKWISE') {
        return 'SLOW_ANTICLOCKWISE_DUSK'
      }
      if (timeOfDay(location) === 'Day') {
        if (params.spin === 'QUICK_CLOCKWISE') {
          return 'QUICK_CLOCKWISE_DAY'
        } else if (params.spin === 'QUICK_ANTICLOCKWISE') {
          return 'QUICK_ANTICLOCKWISE_DAY'
        } else if (params.spin === 'SLOW_CLOCKWISE') {
          return 'SLOW_CLOCKWISE_DAY'
        } else if (params.spin === 'SLOW_ANTICLOCKWISE') {
          return 'SLOW_ANTICLOCKWISE_DAY'
        }
      } else {
        if (params.spin === 'QUICK_CLOCKWISE') {
          return 'QUICK_CLOCKWISE_NIGHT'
        } else if (params.spin === 'QUICK_ANTICLOCKWISE') {
          return 'QUICK_ANTICLOCKWISE_NIGHT'
        } else if (params.spin === 'SLOW_CLOCKWISE') {
          return 'SLOW_CLOCKWISE_NIGHT'
        } else if (params.spin === 'SLOW_ANTICLOCKWISE') {
          return 'SLOW_ANTICLOCKWISE_NIGHT'
        }
      }
      throw new Error(`Cannot find valid spin for input ${params.spin}`)
    })()

    const spinFormCream: Record<MilcerySpin, string> = {
      QUICK_CLOCKWISE_DAY: 'vanilla_cream',
      QUICK_ANTICLOCKWISE_DAY: 'ruby_cream',
      SLOW_CLOCKWISE_DAY: 'caramel_swirl',
      SLOW_ANTICLOCKWISE_DAY: 'ruby_swirl',
      QUICK_CLOCKWISE_NIGHT: 'matcha_cream',
      QUICK_ANTICLOCKWISE_NIGHT: 'salted_cream',
      SLOW_CLOCKWISE_NIGHT: 'lemon_cream',
      SLOW_ANTICLOCKWISE_NIGHT: 'mint_cream',
      SLOW_ANTICLOCKWISE_DUSK: 'rainbow_swirl',
    }

    const sweetForm: Partial<Record<ItemId, string>> = {
      sweetstrawberry: 'strawberry_',
      sweetberry: 'berry_',
      sweetlove: 'love_',
      sweetstar: 'star_',
      sweetclover: 'clover_',
      sweetflower: 'flower_',
      sweetribbon: 'ribbon_',
    }

    const alcremieForm = `${sweetForm[params.item]}${spinFormCream[milcerySpin]}` as PokemonForm
    badge.id = PI.Alcremie
    badge.personality.form = alcremieForm
    return {
      consumedItem: true,
      output: badge.toString(),
      changeType: 'EVO',
    }
  }

  if (evolutionCandy.includes(item) && badge.id === PI.Linoone && badge.personality.form === 'galarian') {
    // Check the weather
    if (timeOfDay(location) !== 'Night') {
      throw new Error(`Item ${item} cannot be used in this location ${location.label} today`)
    }
    badge.id = PI.Obstagoon
    badge.personality.form = undefined // Reset form
    return {
      consumedItem: true,
      output: badge.toString(),
      changeType: 'EVO',
    }
  }

  const buddy = [PI.Rellor, PI.Pawmo, PI.Bramblin]
  if (buddy.includes(badge.id)) {
    if (!badge.defaultTags?.includes('BUDDY')) {
      throw new Error(`Item ${item} cannot be used on this acquantiance. You need to be friends.`)
    }
    const evol = [PI.Rabsca, PI.Pawmot, PI.Brambleghast]
    badge.id = evol[buddy.indexOf(badge.id)]
    return {
      consumedItem: true,
      output: badge.toString(),
      changeType: 'EVO',
    }
  }

  if (badge.id === PI.Dunsparce) {
    badge.id = PI.Dudunsparce
    if (Math.random() <= 0.01) {
      badge.personality.form = 'three_segment'
    } else {
      badge.personality.form = 'two_segment'
    }
    return {
      consumedItem: true,
      output: badge.toString(),
      changeType: 'EVO',
    }
  }

  if (badge.id === PI.Tandemaus) {
    badge.id = PI.Maushold
    if (Math.random() <= 0.01) {
      badge.personality.form = 'family_of_three'
    } else {
      badge.personality.form = 'family_of_four'
    }
    return {
      consumedItem: true,
      output: badge.toString(),
      changeType: 'EVO',
    }
  }

  if (badge.personality.form === 'spiky') {
    // Make sure we cannot evolve the Spiky-Eared Pichu.
    throw new Error(`Pichu cannot be evolved.`)
  }

  let transform: EvolutionEntry;
  if (typeof availability.pokemon[target] === 'object') {
    transform = availability.pokemon[target] as EvolutionEntry
  } else if (typeof availability.pokemon[dbKey] === 'object') {
    transform = availability.pokemon[dbKey] as EvolutionEntry
  } else if (typeof availability.pokemon[dbKey] === 'function') {
    // Evaluate based on the time.
    const evoFunction = availability.pokemon[dbKey] as EvolutionEntryFunction
    transform = evoFunction(hours, Pkmn.get(target)!)
  } else {
    throw new Error(`Item ${item} has no relationship to ${dbKey} (${target}, ${dbKey}), must match ${JSON.stringify(availability.pokemon)}, got ${typeof availability.pokemon[target]}`)
  }
  if (!transform?.badge) {
    throw new Error(`Item ${item} does nothing to ${dbKey}`)
  }
  if (transform.noop) {
    throw new Error(`Item ${item} did nothing to ${dbKey}. Maybe try with other conditions?`)
  }

  const transformBadge = Badge.fromLegacy(transform.badge)
  const dbTransform = Pkmn.get(transform.badge)!
  badge.id = transformBadge.id
  if (transformBadge.personality.form) {
    badge.personality.form = transformBadge.personality.form
  } else if (transform.changeForm) {
    // Castform
    badge.personality.form = transformBadge.personality.form
  }
  if (!transform.changeForm) {
    // For Burmy-X to Mothim
    if (!dbTransform.syncableForms?.includes(badge.personality.form!) && transformBadge.personality.form !== badge.personality.form) {
      badge.personality.form = randomItem(dbTransform.syncableForms || [])
    }
    // For Pikachu to Raichu-A
    if (dbTransform.syncableForms?.length && !dbTransform.needForm) {
      // This form is inherent and cannot be changed in a simple evolution
      // See if-statement above for actually setting the form from the badge itself
      // Do nothing.
    } else if (dbTransform.syncableForms && !badge.personality.form) {
      // For Cherubi to Cherrim-X
      badge.personality.form = randomItem(dbTransform.syncableForms)
    }
  }
  const response: UseItemOutput = {
    consumedItem: availability.consumes(badge),
    output: badge.toString(),
    changeType: transform.changeForm ? 'FORM' : 'EVO'
  }

  if (badge.id === PI.Ninjask) {
    if (items.pokeball > 0) {
      items.pokeball--
      const shedinja = badge
      shedinja.id = PI.Shedinja // Shedinja
      response.others = [shedinja.toString()]
    }
  }

  return response
}

export function getEligiblePokemonForMove(move: MoveId, isTr: boolean): Availability {
  const pokemon = {}
  Object.entries(datastore).forEach(([key, pkmn]) => {
    pkmn.novelMoves?.forEach((moveList, i) => {
      if (i === 0) return // No var0
      if (moveList.includes(move)) {
        // Will have issues for duplicate moves in different variants
        pokemon[key] = {
          badge: key, // Placeholder
        }
      }
    })
  })

  return {
    filter: Object.keys(pokemon) as BadgeId[],
    pokemon,
    usable: () => true,
    consumes: () => isTr, // TODO: Depends on TM/TR
  }
}

export function getVariantForMove(species: BadgeId | PokemonId, move: MoveId) {
  const badge = species.startsWith('potw-') ? Badge.fromLegacy(species) : new Badge(species)
  const badgeStr = badge.toLegacyString()
  const dbPkmn = Pkmn.get(badgeStr)
  if (dbPkmn === undefined) {
    throw new Error(`${species} DNE`)
  }
  if (dbPkmn.novelMoves === undefined) {
    throw new Error(`${species} cannot learn any other moves`)
  }
  for (let i = 1; i < dbPkmn?.novelMoves.length; i++) {
    if (dbPkmn.novelMoves[i].includes(move)) {
      return i
    }
  }
  return undefined
}

interface DirectUsage {
  isValid: (user: Users.Doc) => boolean
  exchange: (user: Users.Doc) => DirectUsageRes
}

interface DirectUsageRes {
  items: Partial<Record<ItemId, number>>
  badge: Badge
}

function getRestoredFossil(species: BadgeId) {
  const badge = Badge.fromLegacy(species)
  const p = Math.random()
  if (p < 0.67) {
    badge.personality.variant = randomVariant(Pkmn.get(species)!)
  }
  return badge
}

function getFossilUsage(species: BadgeId, item: ItemId): DirectUsage {
  return {
    isValid: () => true,
    exchange: (user) => {
      const badge = getRestoredFossil(species)
      const items = user.items
      items[item]!--
      return {
        badge,
        items,
      }
    }
  }
}

const slateUsage = {
  isValid: () => true,
  exchange: () => { throw new Error('Implementation should occur inline') },
}

export const DirectMap: Partial<Record<ItemId, DirectUsage>> = {
  helixfossil: getFossilUsage(P.Omanyte, 'helixfossil'),
  domefossil: getFossilUsage(P.Kabuto, 'domefossil'),
  oldamber: getFossilUsage(P.Aerodactyl, 'oldamber'),
  rootfossil: getFossilUsage(P.Lileep, 'rootfossil'),
  clawfossil: getFossilUsage(P.Anorith, 'clawfossil'),
  skullfossil: getFossilUsage(P.Cranidos, 'skullfossil'),
  armorfossil: getFossilUsage(P.Shieldon, 'armorfossil'),
  coverfossil: getFossilUsage(P.Tirtouga, 'coverfossil'),
  plumefossil: getFossilUsage(P.Archen, 'plumefossil'),
  jawfossil: getFossilUsage(P.Tyrunt, 'jawfossil'),
  sailfossil: getFossilUsage(P.Amaura, 'sailfossil'),
  dzfossil: getFossilUsage(P.Dracozolt, 'dzfossil'),
  dvfossil: getFossilUsage(P.Dracovish, 'dvfossil'),
  azfossil: getFossilUsage(P.Arctozolt, 'azfossil'),
  avfossil: getFossilUsage(P.Arctovish, 'avfossil'),
  oddkeystone: {
    isValid: (user) => (user.items.wisp ?? 0) >= 108,
    exchange: (user) => {
      const badge = Badge.fromLegacy(P.Spiritomb)
      const p = Math.random()
      if (p < 0.67) {
        badge.personality.variant = randomVariant(Pkmn.get(P.Spiritomb)!)
      }
      const items = user.items
      items.wisp! -= 108
      return {badge, items}
    }
  },
  zygardecube: {
    isValid: (user) => (user.items.zygardecell ?? 0) >= 10,
    exchange: (user) => {
      const badge = Badge.fromLegacy(P.Zygarde)
      // const cells = user.items.zygardecell!
      const items = user.items
      // Always do ten. Use ability capsule to cycle through others.
      badge.personality.form = 'ten'
      items.zygardecell! -= 10
      // if (cells < 50) {
      // } else if (cells < 100) {
      //   badge.personality.form = 'fifty'
      //   items.zygardecell! -= 50
      // } else {
      //   badge.personality.form = 'complete'
      //   items.zygardecell! -= 100
      // }
      return {badge, items}
    }
  },
  slategb: slateUsage,
  slatemewtwo: slateUsage,
  slategbc: slateUsage,
  slategba: slateUsage,
  slaters: slateUsage,
  slatelugia: slateUsage,
  slatehooh: slateUsage,
  slatekyogre: slateUsage,
  slategroudon: slateUsage,
  slaterayquaza: slateUsage,
  slategiratina: slateUsage,
}
