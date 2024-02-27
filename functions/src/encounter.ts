import { Users } from './db-types'
import { TeamsBadge, MATCH_REQS, Potw } from '../../shared/src/badge2'
import { season, Location, WeatherType, TerrainType, RegionType, TimeOfDay, timeOfDay, isDusk, Tides, LocationId, Globe, getTidesByLocation } from '../../shared/src/locations-list'
import * as Pkmn from '../../shared/src/pokemon'
import { BadgeId, PokemonDoc, PokemonForm, PokemonGender } from '../../shared/src/pokemon/types'
import { CLEAR_BELL, CATCH_CHARM_RBY, CATCH_CHARM_GSC, CATCH_CHARM_RSE, CATCH_CHARM_DPPT, CATCH_CHARM_BW, CATCH_CHARM_SM } from '../../shared/src/quests'
import { CATCH_CHARM_SWSH } from '../../shared/src/legendary-quests'
import { LureId } from '../../shared/src/gen/type-item'
import { Bait, ItemId, PokeballId } from '../../shared/src/items-list'
import * as I from '../../shared/src/gen/type-pokemon-ids'
import * as P from '../../shared/src/gen/type-pokemon'
import {Events, EventId} from '../../shared/src/events'
import * as S from '../../shared/src/server-types'
import spacetime from 'spacetime'
import { Swarms } from '../../shared/src/platform/swarms'
import { SWARMS_UNLOCK } from '../../shared/src/quests'
import { hasPokemonFuzzy } from './users.utils'
import {getAllPokemon, TPokemon} from '../../shared/src/badge-inflate'
import { Pokemon, Badge } from '../../shared/src/badge3'
import { Azelf, Mesprit, Uxie } from '../../shared/src/gen/type-pokemon-ids'
import { ITEMS } from '../../shared/src/items-list'
import { FriendSafariMap } from '../../shared/src/friend-safari'
import { randomVariant } from '../../shared/src/farming'
import { get } from '../../shared/src/pokemon'
import randomItem from '../../shared/src/random-item'
import { CATCH_CHARM_XY } from '../../shared/src/legendary-quests'
import { NECTARS } from '../../shared/src/prizes'

function setGender(id: BadgeId, gender: PokemonGender) {
  const badge = new TeamsBadge(id);
  badge.gender = gender;
  return badge.toString();
}

export function deduplicate(
  encounters: Encounter, pokemon: TPokemon, duplicates: boolean, isLure = false
) {
  if (duplicates) return encounters.list

  const badges: ReadonlySet<BadgeId> = new Set(
    Object.keys(pokemon)!.map(p => {
      const b = new Badge(p)
      if (isLure) {
        b.personality.variant = undefined
      }
      return b.toLegacyString()
    })
  )
  return encounters.list.filter((id) => {
    const badge = new TeamsBadge(id);
    const genders = Pkmn.get(id)?.gender
    if (genders?.length) {
      return genders.some((gender) => !badges.has(setGender(id, gender)))
    }
    if (!badges.has(badge.toString())) {
        return true;
    }
    return false;
  })
}

const nop = () => ''

type Gate = 'yuQPa32crRiPBJvi9HU9' | 'LcyYjBeK4KAq1BkYgzlx' |
'vJHZReab8dpsCgz6ixJy' | 'drIVxbAeXnuVuWCYWTf5' |
'JUNIPER' | 'SYCAMORE' | 'KUKUI' | 'MAGNOLIA'

interface EncounterRule {
  /**
   * Need a catch charm
   */
  gate?: Gate
  /**
   * Weather effect that is required
   */
  weather?: WeatherType
  /**
   * Terrain that is required
   */
  terrain?: TerrainType
  /**
   * Region that is required
   */
  region?: RegionType
  /**
   * Another boolean check
   */
  other?: boolean
  /**
   * List of boolean checks
   */
  others?: boolean[]
  /**
   * Number of mons to add if valid
   */
  count?: number
  /**
   * True when the event is active.
   */
  event?: EventId
  /**
   * Requires the user to have one or more of these items in their bag.
   */
  item?: ItemId[]
  time?: TimeOfDay
  tide?: Tides
  location?: LocationId
  souvenir?: boolean
  /** This is the bait being used. */
  bait?: ItemId
}

type EncounterParamFormat = 'Pokedex' | 'List' | 'Client'

interface EncounterParams {
  user: Users.Doc
  location: Location
  format?: EncounterParamFormat
  bait?: ItemId
}

export function addIf(pokemon: BadgeId, opts: EncounterRule, params: EncounterParams) {
  if (params.format === undefined || params.format === 'List') {
    const willAdd = (() => {
      if (opts.gate && !params.user.hiddenItemsFound.includes(opts.gate)) {
        return false
      }
      if (opts.weather && params.location.forecast !== opts.weather) {
        return false
      }
      if (opts.terrain && params.location.terrain !== opts.terrain) {
        return false
      }
      if (opts.region && params.location.region !== opts.region) {
        return false
      }
      if (opts.event && !Events[opts.event].isActive(params.user as S.Users.Doc)) {
        return false
      }
      if (opts.time) {
        if (opts.time === 'Dusk' && !isDusk(params.location)) {
          return false
        }
        if (opts.time !== timeOfDay(params.location)) {
          return false
        }
      }
      if (opts.item) {
        for (const item of opts.item) {
          if (params.user.items[item] === undefined || params.user.items[item]! <= 0) {
            return false
          }
        }
      }
      if (opts.tide && getTidesByLocation(params.location) !== opts.tide) {
        return false
      }
      if (opts.location && params.user.location !== opts.location) {
        return false
      }
      if (opts.souvenir && params.user.lastLocations?.includes(params.user.location)) {
        return false
      }
      if (opts.bait && params.bait !== opts.bait) {
        return false
      }
      if (opts.other !== undefined && !opts.other) {
        return false
      }
      if (opts.others) {
        for (const conditional of opts.others) {
          if (!conditional) return false
        }
      }
      return true
    })()
    if (willAdd) {
      return Array(Math.floor(opts.count!) || 2).fill(pokemon)
    }
    return []
  } else if (params.format === 'Pokedex') {
    return [{
      pokemon,
      rarity: opts.count || 2,
      method: (() => {
        const msg: string[] = []
        if (opts.gate) {
          // TODO: Make this show the exact charm
          msg.push('Requires Catching Charm')
        }
        if (opts.weather) {
          msg.push(`In ${opts.weather} weather`)
        }
        if (opts.region) {
          msg.push(`Locations in ${opts.region}`)
        }
        if (opts.terrain) {
          msg.push(`${opts.terrain} places`)
        }
        if (opts.event) {
          msg.push(`During ${Events[opts.event].title}`)
        }
        if (opts.item) {
          msg.push(`Requires ${opts.item.map(i => ITEMS[i].label).join(', ')} in bag`)
        }
        if (opts.time) {
          msg.push(`Only during ${opts.time}`)
        }
        if (opts.tide) {
          msg.push(`Only during ${opts.tide}`)
        }
        if (opts.location) {
          msg.push(`In ${Globe[opts.location].label}`)
        }
        if (opts.souvenir) {
          msg.push('Found rarely in location')
        }
        if (opts.bait) {
          msg.push(`Attracted to ${ITEMS[opts.bait].label}`)
        }
        if (opts.other !== undefined) {
          msg.push('One more condition')
        }
        if (opts.others?.length) {
          msg.push(`${opts.others.length} more conditions`)
        }
        return msg
      })()
    }]
  } else if (params.format === 'Client') {
    return [{
      pokemon,
      rarity: opts.count || 2,
      method: (() => {
        return opts
      })()
    }]
  }
  return []
}

const ENCOUNTERS_COMMON = (user: Users.Doc, now: Date, location: Location, format: EncounterParamFormat = 'List') => {
  const p: EncounterParams = {user: user as Users.Doc, location, format}

  const list: BadgeId[] = []
  list.push(...addIf(P.Caterpie, {count: 1, time: 'Day'}, p))
  list.push(...addIf(P.Weedle, {count: 1, time: 'Night'}, p))
  list.push(...addIf(P.Pidgey, {count: 1}, p))
  list.push(...addIf(P.Rattata, {count: 1}, p))
  list.push(...addIf(P.Spearow, {count: 1}, p))
  list.push(...addIf(P.Ekans, {count: 1}, p))
  list.push(...addIf(P.NidoranF, {count: 1}, p))
  list.push(...addIf(P.NidoranM, {count: 1}, p))
  list.push(...addIf(P.Jigglypuff, {count: 1}, p))
  list.push(...addIf(P.Oddish, {count: 1, weather: 'Sunny'}, p))
  list.push(...addIf(P.Paras, {count: 1, terrain: 'Forest'}, p))
  list.push(...addIf(P.Venonat, {count: 1, terrain: 'Forest'}, p))
  list.push(...addIf(P.Meowth, {count: 1, terrain: 'Urban'}, p))
  list.push(...addIf(P.Psyduck, {count: 1}, p))
  list.push(...addIf(P.Mankey, {count: 1, terrain: 'Forest'}, p))
  list.push(...addIf(P.Poliwag, {count: 1, terrain: 'Bay'}, p))
  list.push(...addIf(P.Bellsprout, {count: 1}, p))
  list.push(...addIf(P.Shellder, {count: 1, terrain: 'Beach'}, p))
  list.push(...addIf(P.Voltorb, {count: 1}, p))
  list.push(...addIf(P.Exeggcute, {count: 1}, p))
  list.push(...addIf(P.Koffing, {count: 1, terrain: 'Urban'}, p))
  list.push(...addIf(P.Goldeen, {count: 1, tide: 'Low Tide'}, p))
  list.push(...addIf(P.Magikarp, {count: 1, tide: 'Low Tide'}, p))
  list.push(...addIf(P.Eevee, {count: 1}, p))
  list.push(...addIf(P.Eevee, {event: 'EEVEE', count: 20}, p))
  // Clefairy are available with a Poké Ball & Moon Stone on Monday nights 20:00 - 23:59
  list.push(...addIf(P.Bulbasaur, {count: 20, event: 'HOUSEPLANT'}, p))
  list.push(...addIf(P.Clefairy, {count: 5, event: 'MOON_STONE'}, p))
  list.push(...addIf(P.Cleffa, {count: 5, event: 'MOON_STONE'}, p))
  list.push(...addIf(P.Diglett, {count: 20, event: 'MOLE_DAY'}, p))
  list.push(...addIf(P.Zubat, {time: 'Night'}, p))
  list.push(...addIf(P.Magnemite, {terrain: 'Mountain'}, p))
  list.push(...addIf(P.Seel, {terrain: 'Oceanic'}, p))
  list.push(...addIf(P.Grimer, {terrain: 'Urban'}, p))
  list.push(...addIf(P.Krabby, {region: 'Mediterranean'}, p))

  // Johto
  list.push(...addIf(P.Chikorita, {gate: CATCH_CHARM_RBY, count: 1}, p))
  list.push(...addIf(P.Cyndaquil, {gate: CATCH_CHARM_RBY, count: 1}, p))
  list.push(...addIf(P.Totodile, {gate: CATCH_CHARM_RBY, count: 1}, p))
  list.push(...addIf(P.Sentret, {gate: CATCH_CHARM_RBY, count: 1, terrain: 'Grasslands'}, p))
  list.push(...addIf(P.Hoothoot, {gate: CATCH_CHARM_RBY, count: 1, time: 'Night'}, p))
  list.push(...addIf(P.Ledyba, {gate: CATCH_CHARM_RBY, count: 1, time: 'Day'}, p))
  list.push(...addIf(P.Spinarak, {gate: CATCH_CHARM_RBY, count: 1, time: 'Night'}, p))
  list.push(...addIf(P.Pichu, {event: 'YOUTH_DAY', count: 20}, p))
  list.push(...addIf(Potw(P.Pichu, {form: 'spiky'}), {count: 1, other: p.location.registeel}, p))
  list.push(...addIf(P.Igglybuff, {event: 'YOUTH_DAY', count: 20}, p))
  list.push(...addIf(P.Cleffa, {event: 'YOUTH_DAY', count: 20}, p))
  list.push(...addIf(P.Togepi, {event: 'YOUTH_DAY', count: 20}, p))
  list.push(...addIf(P.Natu, {gate: CATCH_CHARM_RBY, count: 1, weather: 'Fog'}, p))
  list.push(...addIf(P.Mareep, {gate: CATCH_CHARM_RBY, terrain: 'Grasslands'}, p))
  list.push(...addIf(P.Marill, {gate: CATCH_CHARM_RBY, count: 1, weather: 'Rain'}, p))
  list.push(...addIf(P.Hoppip, {gate: CATCH_CHARM_RBY, terrain: 'Gardens'}, p))
  list.push(...addIf(P.Wooper, {gate: CATCH_CHARM_RBY, count: 1}, p))
  list.push(...addIf(P.Aipom, {gate: CATCH_CHARM_RBY, terrain: 'Rainforest'}, p))
  list.push(...addIf(P.Pineco, {gate: CATCH_CHARM_RBY, region: 'North America'}, p))
  list.push(...addIf(P.Gligar, {gate: CATCH_CHARM_RBY, weather: 'Sandstorm'}, p))
  list.push(...addIf(P.Snubbull, {gate: CATCH_CHARM_RBY, count: 1, terrain: 'Urban'}, p))
  list.push(...addIf(P.Shuckle, {event: 'WINE_DAY', count: 20}, p))
  list.push(...addIf(P.Teddiursa, {gate: CATCH_CHARM_RBY, count: 1, terrain: 'Forest'}, p))
  list.push(...addIf(P.Slugma, {gate: CATCH_CHARM_RBY, count: 1, weather: 'Heat Wave'}, p))
  list.push(...addIf(P.Swinub, {gate: CATCH_CHARM_RBY, count: 1, weather: 'Snow'}, p))
  list.push(...addIf(P.Remoraid, {gate: CATCH_CHARM_RBY, count: 1, terrain: 'Bay'}, p))
  // Holiday bird in December
  list.push(...addIf(P.Delibird, {other: now.getMonth() === 11}, p))
  list.push(...addIf(P.Houndour, {gate: CATCH_CHARM_RBY, count: 1, time: 'Night'}, p))
  list.push(...addIf(P.Phanpy, {gate: CATCH_CHARM_RBY, count: 1, terrain: 'Rural'}, p))
  list.push(...addIf(P.Phanpy, {event: 'ELEPHANT_DAY', count: 20}, p))
  list.push(...addIf(P.Stantler, {gate: CATCH_CHARM_RBY, terrain: 'Forest'}, p))
  
  // Hoenn
  list.push(...addIf(P.Treecko, {gate: CATCH_CHARM_GSC, count: 1}, p))
  list.push(...addIf(P.Torchic, {gate: CATCH_CHARM_GSC, count: 1}, p))
  list.push(...addIf(P.Mudkip, {gate: CATCH_CHARM_GSC, count: 1}, p))
  list.push(...addIf(P.Zigzagoon, {gate: CATCH_CHARM_GSC, count: 1, terrain: 'Grasslands'}, p))
  list.push(...addIf(P.Poochyena, {gate: CATCH_CHARM_GSC, terrain: 'Rural'}, p))
  list.push(...addIf(P.Taillow, {gate: CATCH_CHARM_GSC, count: 1}, p))
  list.push(...addIf(P.Lotad, {gate: CATCH_CHARM_GSC, weather: 'Rain'}, p))
  list.push(...addIf(P.Seedot, {gate: CATCH_CHARM_GSC, weather: 'Sunny'}, p))
  list.push(...addIf(P.Wingull, {gate: CATCH_CHARM_GSC, terrain: 'Bay'}, p))
  list.push(...addIf(P.Wingull, {gate: CATCH_CHARM_GSC, terrain: 'Beach'}, p))
  list.push(...addIf(P.Ralts, {gate: CATCH_CHARM_GSC, count: 1}, p))
  list.push(...addIf(P.Shroomish, {gate: CATCH_CHARM_GSC, terrain: 'Forest'}, p))
  list.push(...addIf(P.Slakoth, {gate: CATCH_CHARM_GSC, terrain: 'Rainforest'}, p))
  list.push(...addIf(P.Whismur, {gate: CATCH_CHARM_GSC, terrain: 'Urban'}, p))
  list.push(...addIf(P.Makuhita, {gate: CATCH_CHARM_GSC, count: 1}, p))
  list.push(...addIf(P.Aron, {gate: CATCH_CHARM_GSC, terrain: 'Mountain'}, p))
  list.push(...addIf(P.Electrike, {gate: CATCH_CHARM_GSC, weather: 'Thunderstorm', terrain: 'Rural'}, p))
  list.push(...addIf(P.Spoink, {gate: CATCH_CHARM_GSC, count: 1, weather: 'Fog'}, p))
  list.push(...addIf(P.Baltoy, {gate: CATCH_CHARM_GSC, time: 'Day', terrain: 'Desert'}, p))
  list.push(...addIf(P.Shuppet, {gate: CATCH_CHARM_GSC, time: 'Night'}, p))
  list.push(...addIf(P.Duskull, {gate: CATCH_CHARM_GSC, time: 'Night'}, p))
  list.push(...addIf(P.Snorunt, {gate: CATCH_CHARM_GSC, weather: 'Snow'}, p))
  list.push(...addIf(P.Spheal, {gate: CATCH_CHARM_GSC, terrain: 'Bay'}, p))
  list.push(...addIf(P.Spheal, {gate: CATCH_CHARM_GSC, terrain: 'Beach'}, p))
  list.push(...addIf(P.Azurill, {event: 'INTERN_DAY', count: 20}, p))

  // Sinnoh
  list.push(...addIf(P.Turtwig, {gate: CATCH_CHARM_RSE, other: p.location.mossyRock === true}, p))
  list.push(...addIf(P.Chimchar, {gate: CATCH_CHARM_RSE, other: p.location.magneticField === true}, p))
  list.push(...addIf(P.Piplup, {gate: CATCH_CHARM_RSE, other: p.location.icyRock === true}, p))
  list.push(...addIf(P.Bidoof, {gate: CATCH_CHARM_RSE, terrain: 'Forest'}, p))
  list.push(...addIf(P.Kricketot, {gate: CATCH_CHARM_RSE, terrain: 'Grasslands'}, p))
  list.push(...addIf(P.Shinx, {gate: CATCH_CHARM_RSE, weather: 'Thunderstorm'}, p))
  list.push(...addIf(P.Budew, {gate: CATCH_CHARM_RSE, terrain: 'Gardens'}, p))
  list.push(...addIf(Potw(P.Burmy, {form: 'sandy'}), {gate: CATCH_CHARM_RSE, terrain: 'Bay'}, p))
  list.push(...addIf(Potw(P.Burmy, {form: 'sandy'}), {gate: CATCH_CHARM_RSE, terrain: 'Beach'}, p))
  list.push(...addIf(Potw(P.Burmy, {form: 'sandy'}), {gate: CATCH_CHARM_RSE, terrain: 'Desert'}, p))
  list.push(...addIf(Potw(P.Burmy, {form: 'plant'}), {gate: CATCH_CHARM_RSE, terrain: 'Forest'}, p))
  list.push(...addIf(Potw(P.Burmy, {form: 'plant'}), {gate: CATCH_CHARM_RSE, terrain: 'Gardens'}, p))
  list.push(...addIf(Potw(P.Burmy, {form: 'plant'}), {gate: CATCH_CHARM_RSE, terrain: 'Grasslands'}, p))
  list.push(...addIf(Potw(P.Burmy, {form: 'sandy'}), {gate: CATCH_CHARM_RSE, terrain: 'Mountain'}, p))
  list.push(...addIf(Potw(P.Burmy, {form: 'sandy'}), {gate: CATCH_CHARM_RSE, terrain: 'Oceanic'}, p))
  list.push(...addIf(Potw(P.Burmy, {form: 'plant'}), {gate: CATCH_CHARM_RSE, terrain: 'Rainforest'}, p))
  list.push(...addIf(Potw(P.Burmy, {form: 'plant'}), {gate: CATCH_CHARM_RSE, terrain: 'Rural'}, p))
  list.push(...addIf(Potw(P.Burmy, {form: 'sandy'}), {gate: CATCH_CHARM_RSE, terrain: 'Tropical'}, p))
  list.push(...addIf(Potw(P.Burmy, {form: 'trash'}), {gate: CATCH_CHARM_RSE, terrain: 'Urban'}, p))
  list.push(...addIf(P.Combee, {gate: CATCH_CHARM_RSE, weather: 'Sunny'}, p))
  list.push(...addIf(P.Buizel, {gate: CATCH_CHARM_RSE, terrain: 'Bay'}, p))
  list.push(...addIf(P.Buizel, {gate: CATCH_CHARM_RSE, terrain: 'Beach'}, p))
  list.push(...addIf(P.Cherubi, {gate: CATCH_CHARM_RSE, weather: 'Heat Wave'}, p))
  list.push(...addIf(P.Cherubi, {event: 'SPRING', count: 20}, p))
  list.push(...addIf(P.Munchlax, {event: 'MARDI_GRAS', count: 20}, p))
  list.push(...addIf(P.Buneary, {gate: CATCH_CHARM_RSE, terrain: 'Rural'}, p))
  list.push(...addIf(P.Buneary, {event: 'EASTER', count: 20}, p))
  list.push(...addIf(P.Glameow, {gate: CATCH_CHARM_RSE, terrain: 'Urban'}, p))
  list.push(...addIf(P.Stunky, {gate: CATCH_CHARM_RSE, weather: 'Fog'}, p))
  list.push(...addIf(P.Hippopotas, {gate: CATCH_CHARM_RSE, terrain: 'Desert'}, p))

  // Unova
  list.push(...addIf(P.Snivy, {gate: CATCH_CHARM_DPPT, item: ['lightstone', 'darkstone']}, p))
  list.push(...addIf(P.Tepig, {gate: CATCH_CHARM_DPPT, item: ['lightstone', 'darkstone']}, p))
  list.push(...addIf(P.Oshawott, {gate: CATCH_CHARM_DPPT, item: ['lightstone', 'darkstone']}, p))
  list.push(...addIf(P.Patrat, {gate: CATCH_CHARM_DPPT, terrain: 'Grasslands', other: p.user.berryGrown! >= 16}, p))
  list.push(...addIf(P.Purrloin, {gate: CATCH_CHARM_DPPT, terrain: 'Urban', time: 'Night'}, p))
  list.push(...addIf(P.Lillipup, {gate: CATCH_CHARM_DPPT, time: 'Day'}, p))
  list.push(...addIf(P.Roggenrola, {gate: CATCH_CHARM_DPPT, terrain: 'Mountain', other: p.user.battleStadiumRecord[1] >= 4}, p))
  list.push(...addIf(P.Timburr, {gate: CATCH_CHARM_DPPT, terrain: 'Urban', other: p.user.battleStadiumRecord[1] >= 4}, p))
  list.push(...addIf(P.Woobat, {gate: CATCH_CHARM_DPPT, terrain: 'Mountain', weather: 'Fog'}, p))
  list.push(...addIf(P.Drilbur, {gate: CATCH_CHARM_DPPT, terrain: 'Mountain', other: p.user.researchCompleted! >= 4}, p))
  list.push(...addIf(P.Sewaddle, {gate: CATCH_CHARM_DPPT, terrain: 'Rainforest', other: p.user.berryGrown! >= 16}, p))
  list.push(...addIf(P.Tympole, {gate: CATCH_CHARM_DPPT, terrain: 'Bay', other: p.user.researchCompleted! >= 4}, p))
  list.push(...addIf(P.Sandile, {gate: CATCH_CHARM_DPPT, terrain: 'Desert', other: p.user.battleStadiumRecord[1] >= 4}, p))
  list.push(...addIf(P.Trubbish, {gate: CATCH_CHARM_DPPT, location: 'US-NYC'}, p))
  list.push(...addIf(P.Vanillite, {gate: CATCH_CHARM_DPPT, weather: 'Snow'}, p))
  list.push(...addIf(P.Vanillite, {event: 'ICE_CREAM_DAY', count: 20}, p))
  list.push(...addIf(P.Elgyem, {gate: CATCH_CHARM_DPPT, location: 'US-CHD'}, p))
  list.push(...addIf(P.Elgyem, {event: 'STARWARS_DAY', count: 20}, p))
  list.push(...addIf(P.Pidove, {gate: CATCH_CHARM_DPPT, terrain: 'Urban'}, p))
  list.push(...addIf(P.Venipede, {gate: CATCH_CHARM_DPPT, region: 'South America', terrain: 'Rainforest'}, p))
  list.push(...addIf(P.Gothita, {gate: CATCH_CHARM_DPPT, region: 'North Europe', weather: 'Fog', item: ['lightstone']}, p))
  list.push(...addIf(P.Cottonee, {gate: CATCH_CHARM_DPPT, terrain: 'Grasslands', item: ['lightstone'], time: 'Day'}, p))
  list.push(...addIf(P.Cottonee, {event: 'SUMMER', count: 20}, p))
  list.push(...addIf(P.Petilil, {gate: CATCH_CHARM_DPPT, terrain: 'Tropical', item: ['darkstone'], time: 'Day'}, p))
  list.push(...addIf(P.Petilil, {event: 'ST_PATRICKS', count: 20}, p))
  list.push(...addIf(P.Solosis, {gate: CATCH_CHARM_DPPT, region: 'North America', weather: 'Rain', item: ['darkstone']}, p))
  list.push(...addIf(P.Minccino, {gate: CATCH_CHARM_DPPT, terrain: 'Grasslands'}, p))
  list.push(...addIf(P.Klink, {gate: CATCH_CHARM_DPPT, weather: 'Thunderstorm', terrain: 'Mountain'}, p))
  list.push(...addIf(P.Tynamo, {gate: CATCH_CHARM_DPPT, weather: 'Thunderstorm', terrain: 'Mountain'}, p))
  list.push(...addIf(P.Litwick, {gate: CATCH_CHARM_DPPT, terrain: 'Urban', time: 'Night'}, p))

  // Kalos
  list.push(...addIf(P.Chespin, {gate: CATCH_CHARM_BW, item: ['venusaurite']}, p))
  list.push(...addIf(P.Fennekin, {gate: CATCH_CHARM_BW, item: ['charizarditex']}, p))
  list.push(...addIf(P.Fennekin, {gate: CATCH_CHARM_BW, item: ['charizarditey']}, p))
  list.push(...addIf(P.Froakie, {gate: CATCH_CHARM_BW, item: ['blastoiseite']}, p))
  list.push(...addIf(P.Scatterbug, {gate: CATCH_CHARM_BW, item: ['beedrillite']}, p))
  list.push(...addIf(P.Bunnelby, {gate: CATCH_CHARM_BW, item: ['lopunnyite'], terrain: 'Rural'}, p))
  list.push(...addIf(P.Bunnelby, {event: 'LUNAR_NY', count: 20}, p))
  list.push(...addIf(P.Fletchling, {gate: CATCH_CHARM_BW, item: ['pidgeotite']}, p))
  list.push(...addIf(P.Espurr, {gate: CATCH_CHARM_BW, item: ['alakazamite']}, p))
  list.push(...addIf(P.Honedge, {gate: CATCH_CHARM_BW, item: ['gengarite']}, p))
  list.push(...addIf(P.Litleo, {gate: CATCH_CHARM_BW, item: ['cameruptite']}, p))
  list.push(...addIf(P.Binacle, {gate: CATCH_CHARM_BW, item: ['sharpedoite'], terrain: 'Beach'}, p))
  list.push(...addIf(Potw(P.Flabébé, {form: 'blue'}), {gate: CATCH_CHARM_BW, item: ['gardevoirite'], terrain: 'Gardens', other: p.location.flower === 'blue'}, p))
  list.push(...addIf(Potw(P.Flabébé, {form: 'orange'}), {gate: CATCH_CHARM_BW, item: ['gardevoirite'], terrain: 'Gardens', other: p.location.flower === 'orange'}, p))
  list.push(...addIf(Potw(P.Flabébé, {form: 'red'}), {gate: CATCH_CHARM_BW, item: ['gardevoirite'], terrain: 'Gardens', other: p.location.flower === 'red'}, p))
  list.push(...addIf(Potw(P.Flabébé, {form: 'white'}), {gate: CATCH_CHARM_BW, item: ['gardevoirite'], terrain: 'Gardens', other: p.location.flower === 'white'}, p))
  list.push(...addIf(Potw(P.Flabébé, {form: 'yellow'}), {gate: CATCH_CHARM_BW, item: ['gardevoirite'], terrain: 'Gardens', other: p.location.flower === 'yellow'}, p))
  list.push(...addIf(P.Inkay, {gate: CATCH_CHARM_BW, item: ['absolite']}, p))

  // Alola
  list.push(...addIf(P.Rowlet, {gate: CATCH_CHARM_XY, item: ['zgrassium']}, p))
  list.push(...addIf(P.Litten, {gate: CATCH_CHARM_XY, item: ['zfirium']}, p))
  list.push(...addIf(P.Popplio, {gate: CATCH_CHARM_XY, item: ['zwaterium']}, p))
  list.push(...addIf(P.Pikipek, {gate: CATCH_CHARM_XY, item: ['zflyinium']}, p))
  list.push(...addIf(P.Yungoos, {gate: CATCH_CHARM_XY, item: ['znormalium'], time: 'Day'}, p))
  list.push(...addIf(P.Grubbin, {gate: CATCH_CHARM_XY, item: ['zbuginium']}, p))
  list.push(...addIf(P.Stufful, {gate: CATCH_CHARM_XY, item: ['zfightinium'], weather: 'Sunny'}, p))
  list.push(...addIf(P.Bounsweet, {gate: CATCH_CHARM_XY, terrain: 'Forest', item: ['zgrassium']}, p))
  list.push(...addIf(P.Wimpod, {gate: CATCH_CHARM_XY, weather: 'Fog', item: ['zbuginium']}, p))
  list.push(...addIf(P.Sandygast, {gate: CATCH_CHARM_XY, terrain: 'Beach', item: ['zghostium'], tide: 'Low Tide'}, p))
  list.push(...addIf(P.Meltan, {gate: CATCH_CHARM_XY, item: ['meltanbox'], others: [p.user.lastLocations?.includes(p.user.location) ?? true]}, p))

  // Galar
  list.push(...addIf(P.Grookey, {gate: CATCH_CHARM_SM, terrain: 'Gardens'}, p))
  list.push(...addIf(P.Scorbunny, {gate: CATCH_CHARM_SM, terrain: 'Grasslands'}, p))
  list.push(...addIf(P.Sobble, {gate: CATCH_CHARM_SM, terrain: 'Bay'}, p))
  list.push(...addIf(P.Gossifleur, {gate: CATCH_CHARM_SM, terrain: 'Gardens', time: 'Day'}, p))
  list.push(...addIf(P.Chewtle, {gate: CATCH_CHARM_SM, weather: 'Rain'}, p))
  list.push(...addIf(P.Yamper, {gate: CATCH_CHARM_SM, terrain: 'Urban'}, p))
  list.push(...addIf(P.Applin, {gate: CATCH_CHARM_SM, terrain: 'Rainforest', weather: 'Heat Wave'}, p))
  list.push(...addIf(P.Toxel, {gate: CATCH_CHARM_SM, weather: 'Thunderstorm', time: 'Night'}, p))
  list.push(...addIf(P.Silicobra, {gate: CATCH_CHARM_SM, terrain: 'Desert'}, p))
  list.push(...addIf(P.Sinistea, {gate: CATCH_CHARM_SM, terrain: 'Urban', weather: 'Fog', time: 'Night'}, p))
  list.push(...addIf(P.Milcery, {gate: CATCH_CHARM_SM, terrain: 'Urban', weather: 'Sunny', time: 'Day'}, p))
  // IOA
  list.push(...addIf(Potw(P.Diglett, {form: 'alolan'}), {gate: CATCH_CHARM_SM, item: ['itemfinder'], others: [p.user.lastLocations?.includes(p.user.location) ?? true]}, p))
  list.push(...addIf(Potw(P.Slowpoke, {form: 'galarian'}), {gate: CATCH_CHARM_SM, item: ['galaricatwig'], terrain: 'Beach'}, p))

  // Swarms
  if (user.hiddenItemsFound.includes(SWARMS_UNLOCK)) {
    const swarmPokemon = Swarms[location.region || 'North America']
    // ~9-10% chance of a Swarm Pokemon.
    // (Keeping in mind that list + list/11 does increase the list size)
    list.push(...addIf(swarmPokemon, {count: Math.floor(list.length / 11)}, p))
  }

  return {
    shinyMultipler: 1,
    list,
    guaranteedItem: (species, _, __, user) => {
      if ([P.Clefairy, P.Cleffa].includes(species) && Events.MOON_STONE.isActive(user)) {
        return 'moonstone'
      }
      return ''
    }
  }
}

const ENCOUNTERS_UNCOMMON = (user, now: Date, location: Location, format: EncounterParamFormat = 'List') => {
  const p = {user: user as Users.Doc, location, format}
  const date = spacetime(now, location.timezone)
  const nowSeason = season(location, now)

  const list: BadgeId[] = []
  list.push(...addIf(P.Bulbasaur, {count: 1}, p))
  list.push(...addIf(P.Charmander, {count: 1}, p))
  list.push(...addIf(P.Squirtle, {count: 1}, p))
  list.push(...addIf(P.Metapod, {count: 1, time: 'Day'}, p))
  list.push(...addIf(P.Kakuna, {count: 1, time: 'Night'}, p))
  list.push(...addIf(P.Pidgeotto, {count: 1, terrain: 'Rural'}, p))
  list.push(...addIf(P.Raticate, {count: 1, terrain: 'Urban'}, p))
  list.push(...addIf(P.Fearow, {count: 1}, p))
  list.push(...addIf(P.Pikachu, {count: 1}, p))
  list.push(...addIf(P.Pikachu, {count: 20, event: 'POKEMON_DAY'}, p))
  list.push(...addIf(Potw(P.Pikachu, {form: 'kantonian'}), {count: 1, others: [p.location.registeel === true, date.day() === 1]}, p))
  list.push(...addIf(Potw(P.Pikachu, {form: 'hoennian'}), {count: 1, others: [p.location.registeel === true, date.day() === 2]}, p))
  list.push(...addIf(Potw(P.Pikachu, {form: 'sinnohian'}), {count: 1, others: [p.location.registeel === true, date.day() === 3]}, p))
  list.push(...addIf(Potw(P.Pikachu, {form: 'unovan'}), {count: 1, others: [p.location.registeel === true, date.day() === 4]}, p))
  list.push(...addIf(Potw(P.Pikachu, {form: 'kalosian'}), {count: 1, others: [p.location.registeel === true, date.day() === 5]}, p))
  list.push(...addIf(Potw(P.Pikachu, {form: 'alolan'}), {count: 1, terrain: 'Tropical', other: p.location.registeel === true}, p))
  list.push(...addIf(Potw(P.Pikachu, {form: 'galarian'}), {count: 1, region: 'North Europe', other: p.location.registeel === true}, p))
  list.push(...addIf(P.Sandshrew, {count: 1, terrain: 'Desert'}, p))
  list.push(...addIf(P.Clefairy, {count: 1}, p))
  list.push(...addIf(P.Vulpix, {count: 1}, p))
  list.push(...addIf(P.Parasect, {count: 1, terrain: 'Rainforest'}, p))
  list.push(...addIf(P.Venomoth, {count: 1, terrain: 'Forest'}, p))
  list.push(...addIf(P.Dugtrio, {count: 1}, p))
  list.push(...addIf(P.Primeape, {count: 1, terrain: 'Forest'}, p))
  list.push(...addIf(P.Growlithe, {count: 1}, p))
  list.push(...addIf(P.Poliwhirl, {count: 1, terrain: 'Bay'}, p))
  list.push(...addIf(P.Abra, {count: 1}, p))
  list.push(...addIf(P.Abra, {count: 20, event: 'MEWTWO_BIRTHDAY'}, p))
  list.push(...addIf(P.Machop, {count: 1}, p))
  list.push(...addIf(P.Ponyta, {count: 1, terrain: 'Grasslands'}, p))
  list.push(...addIf(P.Doduo, {count: 1, terrain: 'Grasslands'}, p))
  list.push(...addIf(P.Muk, {count: 1}, p))
  list.push(...addIf(P.Gastly, {count: 1, time: 'Night'}, p))
  list.push(...addIf(P.Gastly, {event: 'HALLOWEEN', count: 20}, p))
  list.push(...addIf(P.Onix, {count: 1, terrain: 'Mountain'}, p))
  list.push(...addIf(P.Drowzee, {count: 1, time: 'Night'}, p))
  list.push(...addIf(P.Kingler, {count: 1, terrain: 'Bay'}, p))
  list.push(...addIf(P.Electrode, {count: 1}, p))
  list.push(...addIf(P.Cubone, {count: 1}, p))
  list.push(...addIf(P.Rhyhorn, {count: 1}, p))
  list.push(...addIf(P.Seadra, {count: 1, terrain: 'Oceanic'}, p))
  list.push(...addIf(P.Arbok, {region: 'Africa / Middle East'}, p))
  list.push(...addIf(P.Sandslash, {terrain: 'Desert'}, p))
  list.push(...addIf(P.Golbat, {time: 'Night'}, p))
  list.push(...addIf(P.Gloom, {weather: 'Cloudy'}, p))
  list.push(...addIf(P.Golduck, {weather: 'Cloudy'}, p))
  list.push(...addIf(P.Persian, {region: 'Pacific Islands'}, p))
  list.push(...addIf(P.Slowpoke, {region: 'South America'}, p))
  list.push(...addIf(P.Magneton, {weather: 'Thunderstorm'}, p))
  list.push(...addIf(P.Farfetchd, {terrain: 'Forest'}, p))
  list.push(...addIf(P.Dewgong, {terrain: 'Oceanic'}, p))
  list.push(...addIf(P.Weezing, {weather: 'Fog'}, p))
  list.push(...addIf(P.Seaking, {region: 'Asia', tide: 'High Tide'}, p))
  // Lapras are available with a Great Ball or Ultra Ball on Fridays
  list.push(...addIf(P.Lapras, {event: 'HAPPY_FRIDAY'}, p))
  list.push(...addIf(P.Dratini, {weather: 'Fog', time: 'Day'}, p))

  // Johto
  list.push(...addIf(P.Bayleef, {gate: CATCH_CHARM_RBY, count: 1}, p))
  list.push(...addIf(P.Quilava, {gate: CATCH_CHARM_RBY, count: 1}, p))
  list.push(...addIf(P.Croconaw, {gate: CATCH_CHARM_RBY, count: 1}, p))
  list.push(...addIf(P.Furret, {gate: CATCH_CHARM_RBY, count: 1, terrain: 'Grasslands'}, p))
  list.push(...addIf(P.Noctowl, {gate: CATCH_CHARM_RBY, count: 1, time: 'Night'}, p))
  list.push(...addIf(P.Ledian, {gate: CATCH_CHARM_RBY, count: 1, time: 'Day'}, p))
  list.push(...addIf(P.Xatu, {gate: CATCH_CHARM_RBY, count: 1, weather: 'Fog'}, p))
  list.push(...addIf(P.Azumarill, {gate: CATCH_CHARM_RBY, count: 1, weather: 'Rain'}, p))
  list.push(...addIf(P.Skiploom, {gate: CATCH_CHARM_RBY, count: 1, terrain: 'Gardens'}, p))
  list.push(...addIf(P.Sudowoodo, {gate: CATCH_CHARM_RBY, item: ['squirtbottle']}, p))
  list.push(...addIf(P.Sunkern, {gate: CATCH_CHARM_RBY, count: 1, weather: 'Heat Wave'}, p))
  list.push(...addIf(P.Sunkern, {event: 'AUTUMN', count: 20}, p))
  list.push(...addIf(P.Quagsire, {gate: CATCH_CHARM_RBY, count: 1}, p))
  list.push(...addIf(P.Gligar, {gate: CATCH_CHARM_RBY, count: 1, weather: 'Sandstorm'}, p))
  list.push(...addIf(P.Granbull, {gate: CATCH_CHARM_RBY, count: 1, terrain: 'Urban'}, p))
  list.push(...addIf(P.Sneasel, {gate: CATCH_CHARM_RBY, count: 1, weather: 'Snow'}, p))
  list.push(...addIf(P.Magcargo, {gate: CATCH_CHARM_RBY, weather: 'Heat Wave'}, p))
  list.push(...addIf(P.Piloswine, {gate: CATCH_CHARM_RBY, count: 1, weather: 'Snow'}, p))
  list.push(...addIf(P.Mantine, {gate: CATCH_CHARM_RBY, terrain: 'Oceanic'}, p))
  list.push(...addIf(P.Skarmory, {gate: CATCH_CHARM_RBY, count: 1, terrain: 'Mountain'}, p))
  list.push(...addIf(P.Togetic, {event: 'KINDNESS', count: 10}, p))
  // Unown Report logic goes here!
  list.push(...addIf(Potw(P.Unown, {
      form: (p.location.unown as PokemonForm | undefined),
      var: randomVariant(get('potw-201')!)
    }), // Get a random Unown var guaranteed
    {gate: CATCH_CHARM_RBY, item: ['unownreport'], other: !!(p.location.unown)}, p))
  
  // Hoenn
  list.push(...addIf(P.Grovyle, {gate: CATCH_CHARM_GSC, count: 1}, p))
  list.push(...addIf(P.Combusken, {gate: CATCH_CHARM_GSC, count: 1}, p))
  list.push(...addIf(P.Marshtomp, {gate: CATCH_CHARM_GSC, count: 1}, p))
  list.push(...addIf(P.Linoone, {gate: CATCH_CHARM_GSC, count: 1, terrain: 'Grasslands'}, p))
  list.push(...addIf(P.Mightyena, {gate: CATCH_CHARM_GSC, terrain: 'Rural'}, p))
  list.push(...addIf(P.Silcoon, {gate: CATCH_CHARM_GSC, count: 1, terrain: 'Forest'}, p))
  list.push(...addIf(P.Cascoon, {gate: CATCH_CHARM_GSC, count: 1, terrain: 'Forest'}, p))
  list.push(...addIf(P.Swellow, {gate: CATCH_CHARM_GSC, count: 1}, p))
  list.push(...addIf(P.Kirlia, {gate: CATCH_CHARM_GSC, count: 1}, p))
  list.push(...addIf(P.Lombre, {gate: CATCH_CHARM_GSC, weather: 'Rain', time: 'Day'}, p))
  list.push(...addIf(P.Nuzleaf, {gate: CATCH_CHARM_GSC, weather: 'Sunny', time: 'Night'}, p))
  list.push(...addIf(P.Pelipper, {gate: CATCH_CHARM_GSC, terrain: 'Bay'}, p))
  list.push(...addIf(P.Pelipper, {gate: CATCH_CHARM_GSC, terrain: 'Beach'}, p))
  list.push(...addIf(P.Nincada, {gate: CATCH_CHARM_GSC, region: 'North America'}, p))
  list.push(...addIf(P.Breloom, {gate: CATCH_CHARM_GSC, terrain: 'Forest'}, p))
  list.push(...addIf(P.Vigoroth, {gate: CATCH_CHARM_GSC, terrain: 'Rainforest'}, p))
  list.push(...addIf(P.Loudred, {gate: CATCH_CHARM_GSC, terrain: 'Urban'}, p))
  list.push(...addIf(P.Meditite, {gate: CATCH_CHARM_GSC, region: 'Asia'}, p))
  list.push(...addIf(P.Nosepass, {gate: CATCH_CHARM_GSC, region: 'Pacific Islands'}, p))
  list.push(...addIf(P.Sableye, {gate: CATCH_CHARM_GSC, weather: 'Fog', time: 'Night'}, p))
  list.push(...addIf(P.Mawile, {gate: CATCH_CHARM_GSC, weather: 'Fog', time: 'Day'}, p))
  list.push(...addIf(P.Lairon, {gate: CATCH_CHARM_GSC, terrain: 'Mountain'}, p))
  list.push(...addIf(P.Manectric, {gate: CATCH_CHARM_GSC, weather: 'Thunderstorm', terrain: 'Rural'}, p))
  list.push(...addIf(P.Plusle, {gate: CATCH_CHARM_GSC, region: 'North America'}, p))
  list.push(...addIf(P.Plusle, {gate: CATCH_CHARM_GSC, region: 'South America'}, p))
  list.push(...addIf(P.Minun, {gate: CATCH_CHARM_GSC, region: 'North Europe'}, p))
  list.push(...addIf(P.Volbeat, {gate: CATCH_CHARM_GSC, region: 'North Europe'}, p))
  list.push(...addIf(P.Illumise, {gate: CATCH_CHARM_GSC, region: 'South America'}, p))
  list.push(...addIf(P.Roselia, {gate: CATCH_CHARM_GSC, terrain: 'Gardens'}, p))
  list.push(...addIf(P.Gulpin, {gate: CATCH_CHARM_GSC, terrain: 'Urban'}, p))
  list.push(...addIf(P.Wailmer, {gate: CATCH_CHARM_GSC, terrain: 'Oceanic'}, p))
  list.push(...addIf(P.Carvanha, {gate: CATCH_CHARM_GSC, region: 'Africa / Middle East', tide: 'High Tide'}, p))
  list.push(...addIf(P.Numel, {gate: CATCH_CHARM_GSC, region: 'Africa / Middle East', tide: 'Low Tide'}, p))
  list.push(...addIf(P.Torkoal, {gate: CATCH_CHARM_GSC, weather: 'Heat Wave'}, p))
  list.push(...addIf(P.Trapinch, {gate: CATCH_CHARM_GSC, weather: 'Sandstorm'}, p))
  list.push(...addIf(P.Cacnea, {gate: CATCH_CHARM_GSC, terrain: 'Desert'}, p))
  list.push(...addIf(P.Swablu, {gate: CATCH_CHARM_GSC, weather: 'Fog'}, p))
  list.push(...addIf(P.Corphish, {gate: CATCH_CHARM_GSC, region: 'Mediterranean'}, p))
  list.push(...addIf(P.Corphish, {event: 'LOBSTER', count: 20}, p))
  list.push(...addIf(P.Claydol, {gate: CATCH_CHARM_GSC, time: 'Day', terrain: 'Desert'}, p))
  list.push(...addIf(Potw(P.Castform, {}), {gate: CATCH_CHARM_GSC, weather: 'Cloudy'}, p))
  list.push(...addIf(Potw(P.Castform, {}), {gate: CATCH_CHARM_GSC, weather: 'Fog'}, p))
  list.push(...addIf(P.Castform_Sunny, {gate: CATCH_CHARM_GSC, weather: 'Heat Wave'}, p))
  list.push(...addIf(P.Castform_Sunny, {gate: CATCH_CHARM_GSC, weather: 'Sunny'}, p))
  list.push(...addIf(P.Castform_Rainy, {gate: CATCH_CHARM_GSC, weather: 'Rain'}, p))
  list.push(...addIf(P.Castform_Rainy, {gate: CATCH_CHARM_GSC, weather: 'Thunderstorm'}, p))
  list.push(...addIf(P.Castform_Snowy, {gate: CATCH_CHARM_GSC, weather: 'Snow'}, p))
  list.push(...addIf(P.Castform_Snowy, {gate: CATCH_CHARM_GSC, weather: 'Diamond Dust'}, p))
  list.push(...addIf(P.Kecleon, {gate: CATCH_CHARM_GSC, item: ['devonscope']}, p))
  list.push(...addIf(P.Banette, {gate: CATCH_CHARM_GSC, time: 'Night'}, p))
  // In Kalos, Banette can be found on Thursdays.
  list.push(...addIf(P.Banette, {gate: CATCH_CHARM_GSC, other: date.day() === 4}, p))
  list.push(...addIf(P.Dusclops, {gate: CATCH_CHARM_GSC, time: 'Night'}, p))
  list.push(...addIf(P.Chimecho, {gate: CATCH_CHARM_GSC, time: 'Night'}, p))
  list.push(...addIf(P.Absol, {gate: CATCH_CHARM_GSC, count: 1, terrain: 'Rural'}, p))
  list.push(...addIf(P.Glalie, {gate: CATCH_CHARM_GSC, weather: 'Snow'}, p))
  list.push(...addIf(P.Sealeo, {gate: CATCH_CHARM_GSC, terrain: 'Bay'}, p))
  list.push(...addIf(P.Sealeo, {gate: CATCH_CHARM_GSC, terrain: 'Beach'}, p))
  list.push(...addIf(P.Bagon, {gate: CATCH_CHARM_GSC, terrain: 'Mountain'}, p))
  list.push(...addIf(P.Beldum, {gate: CATCH_CHARM_GSC, weather: 'Thunderstorm'}, p))

  // Sinnoh
  list.push(...addIf(P.Grotle, {gate: CATCH_CHARM_RSE, other: p.location.mossyRock === true}, p))
  list.push(...addIf(P.Monferno, {gate: CATCH_CHARM_RSE, other: p.location.magneticField === true}, p))
  list.push(...addIf(P.Prinplup, {gate: CATCH_CHARM_RSE, other: p.location.icyRock === true}, p))
  list.push(...addIf(P.Bibarel, {gate: CATCH_CHARM_RSE, terrain: 'Forest'}, p))
  list.push(...addIf(P.Luxio, {gate: CATCH_CHARM_RSE, weather: 'Thunderstorm'}, p))
  list.push(...addIf(Potw(P.Shellos, {form: 'east_sea'}), {gate: CATCH_CHARM_RSE, weather: 'Rain', other: location.hemiLong === 'East'}, p))
  list.push(...addIf(Potw(P.Shellos, {form: 'west_sea'}), {gate: CATCH_CHARM_RSE, weather: 'Rain', other: location.hemiLong === 'West'}, p))
  list.push(...addIf(P.Floatzel, {gate: CATCH_CHARM_RSE, terrain: 'Bay'}, p))
  list.push(...addIf(P.Pachirisu, {gate: CATCH_CHARM_RSE, region: 'North America'}, p))
  list.push(...addIf(P.Drifloon, {gate: CATCH_CHARM_RSE, event: 'HAPPY_FRIDAY'}, p))
  list.push(...addIf(P.Purugly, {gate: CATCH_CHARM_RSE, terrain: 'Urban'}, p))
  list.push(...addIf(P.Chatot, {gate: CATCH_CHARM_RSE, region: 'South America'}, p))
  list.push(...addIf(P.Chatot, {event: 'PIRATE_DAY', count: 20}, p))
  list.push(...addIf(P.Bronzor, {gate: CATCH_CHARM_RSE, region: 'Africa / Middle East'}, p))
  list.push(...addIf(P.Gible, {gate: CATCH_CHARM_RSE, weather: 'Sandstorm'}, p))
  list.push(...addIf(P.Lumineon, {gate: CATCH_CHARM_RSE, region: 'Mediterranean'}, p))
  list.push(...addIf(P.Snover, {gate: CATCH_CHARM_RSE, weather: 'Snow'}, p))
  list.push(...addIf(P.Snover, {event: 'WINTER', count: 20}, p))

  // Unova
  list.push(...addIf(P.Servine, {gate: CATCH_CHARM_DPPT, item: ['lightstone', 'darkstone']}, p))
  list.push(...addIf(P.Pignite, {gate: CATCH_CHARM_DPPT, item: ['lightstone', 'darkstone']}, p))
  list.push(...addIf(P.Dewott, {gate: CATCH_CHARM_DPPT, item: ['lightstone', 'darkstone']}, p))
  list.push(...addIf(P.Watchog, {gate: CATCH_CHARM_DPPT, terrain: 'Grasslands', other: p.user.berryGrown! >= 16}, p))
  list.push(...addIf(P.Herdier, {gate: CATCH_CHARM_DPPT, time: 'Day'}, p))
  list.push(...addIf(P.Pansage, {gate: CATCH_CHARM_DPPT, terrain: 'Forest', weather: 'Sunny'}, p))
  list.push(...addIf(P.Pansear, {gate: CATCH_CHARM_DPPT, terrain: 'Forest', weather: 'Heat Wave'}, p))
  list.push(...addIf(P.Panpour, {gate: CATCH_CHARM_DPPT, terrain: 'Forest', weather: 'Rain'}, p))
  list.push(...addIf(P.Boldore, {gate: CATCH_CHARM_DPPT, terrain: 'Mountain', weather: 'Cloudy'}, p))
  list.push(...addIf(P.Gurdurr, {gate: CATCH_CHARM_DPPT, terrain: 'Urban', weather: 'Cloudy'}, p))
  list.push(...addIf(P.Swadloon, {gate: CATCH_CHARM_DPPT, terrain: 'Rainforest', weather:'Sunny', other: p.user.berryGrown! >= 16}, p))
  list.push(...addIf(P.Palpitoad, {gate: CATCH_CHARM_DPPT, terrain: 'Bay', weather: 'Rain', other: p.user.researchCompleted! >= 4}, p))
  list.push(...addIf(Potw(P.Deerling, {form: 'spring'}), {gate: CATCH_CHARM_DPPT, terrain: 'Grasslands', other: nowSeason === 'Spring'}, p))
  list.push(...addIf(Potw(P.Deerling, {form: 'summer'}), {gate: CATCH_CHARM_DPPT, terrain: 'Grasslands', other: nowSeason === 'Summer'}, p))
  list.push(...addIf(Potw(P.Deerling, {form: 'autumn'}), {gate: CATCH_CHARM_DPPT, terrain: 'Grasslands', other: nowSeason === 'Autumn'}, p))
  list.push(...addIf(Potw(P.Deerling, {form: 'winter'}), {gate: CATCH_CHARM_DPPT, terrain: 'Grasslands', other: nowSeason === 'Winter'}, p))
  list.push(...addIf(P.Krokorok, {gate: CATCH_CHARM_DPPT, terrain: 'Desert', weather: 'Sandstorm', other: user.battleStadiumRecord[1] >= 4}, p))
  list.push(...addIf(P.Darumaka, {gate: CATCH_CHARM_DPPT, terrain: 'Desert', other: p.user.raidRecord[1] >= 4}, p))
  list.push(...addIf(P.Dwebble, {gate: CATCH_CHARM_DPPT, terrain: 'Beach', other: p.user.raidRecord[1] >= 4}, p))
  list.push(...addIf(P.Scraggy, {gate: CATCH_CHARM_DPPT, terrain: 'Urban', time: 'Night'}, p))
  list.push(...addIf(P.Sigilyph, {gate: CATCH_CHARM_DPPT, region: 'North America', terrain: 'Desert', weather: 'Windy'}, p))
  list.push(...addIf(P.Vanillish, {gate: CATCH_CHARM_DPPT, weather: 'Snow'}, p))
  list.push(...addIf(P.Vanillish, {event: 'ICE_CREAM_DAY', count: 20}, p))
  list.push(...addIf(P.Beheeyem, {gate: CATCH_CHARM_DPPT, location: 'US-CHD'}, p))
  list.push(...addIf(P.Beheeyem, {event: 'STARWARS_DAY', count: 20}, p))
  list.push(...addIf(P.Rufflet, {gate: CATCH_CHARM_DPPT, region: 'North America', terrain: 'Desert', weather: 'Windy', item: ['darkstone']}, p))
  list.push(...addIf(P.Tranquill, {gate: CATCH_CHARM_DPPT, terrain: 'Urban', weather: 'Cloudy'}, p))
  list.push(...addIf(P.Whirlipede, {gate: CATCH_CHARM_DPPT, region: 'South America', terrain: 'Rainforest'}, p))
  list.push(...addIf(P.Gothorita, {gate: CATCH_CHARM_DPPT, region: 'North Europe', weather: 'Fog', item: ['lightstone']}, p))
  list.push(...addIf(P.Cubchoo, {gate: CATCH_CHARM_DPPT, other: p.location.icyRock === true}, p))
  list.push(...addIf(P.Audino, {gate: CATCH_CHARM_DPPT, weather: 'Fog', region: 'North America'}, p))
  list.push(...addIf(P.Yamask, {gate: CATCH_CHARM_DPPT, region: 'Africa / Middle East', time: 'Night'}, p))
  list.push(...addIf(P.Alomomola, {gate: CATCH_CHARM_DPPT, region: 'Mediterranean', weather: 'Sunny'}, p))
  list.push(...addIf(P.Alomomola, {event: 'VALENTINES_DAY', count: 20}, p))
  list.push(...addIf(P.Lampent, {gate: CATCH_CHARM_DPPT, terrain: 'Urban', time: 'Night'}, p))
  list.push(...addIf(P.Golett, {gate: CATCH_CHARM_DPPT, terrain: 'Desert', time: 'Night'}, p))
  list.push(...addIf(P.Stunfisk, {gate: CATCH_CHARM_DPPT, terrain: 'Rural', weather: 'Thunderstorm'}, p))
  list.push(...addIf(P.Emolga, {gate: CATCH_CHARM_DPPT, terrain: 'Forest', weather: 'Thunderstorm'}, p))
  list.push(...addIf(P.Ducklett, {gate: CATCH_CHARM_DPPT, terrain: 'Beach', weather: 'Cloudy'}, p))
  list.push(...addIf(P.Duosion, {gate: CATCH_CHARM_DPPT, region: 'North America', weather: 'Rain', item: ['darkstone']}, p))
  list.push(...addIf(P.Maractus, {gate: CATCH_CHARM_DPPT, weather: 'Sunny', terrain: 'Desert'}, p))
  list.push(...addIf(P.Foongus, {gate: CATCH_CHARM_DPPT, weather: 'Sunny', other: p.location.mossyRock === true}, p))
  list.push(...addIf(Potw(P.Basculin, {form: 'red_stripe'}), {gate: CATCH_CHARM_DPPT, weather: 'Rain', region: 'North America'}, p))
  list.push(...addIf(Potw(P.Basculin, {form: 'blue_stripe'}), {gate: CATCH_CHARM_DPPT, weather: 'Rain', region: 'Mediterranean'}, p))
  list.push(...addIf(Potw(P.Basculin, {form: 'white_stripe'}), {gate: CATCH_CHARM_SWSH, region: 'Asia', tide: 'High Tide', terrain: 'Rural'}, p))
  list.push(...addIf(P.Throh, {gate: CATCH_CHARM_DPPT, region: 'Asia', terrain: 'Beach'}, p))
  list.push(...addIf(P.Sawk, {gate: CATCH_CHARM_DPPT, region: 'Asia', terrain: 'Beach'}, p))
  list.push(...addIf(P.Mienfoo, {gate: CATCH_CHARM_DPPT, region: 'Asia', terrain: 'Urban'}, p))
  list.push(...addIf(P.Joltik, {gate: CATCH_CHARM_DPPT, weather: 'Thunderstorm', terrain: 'Rainforest'}, p))
  list.push(...addIf(P.Zorua, {gate: CATCH_CHARM_DPPT, weather: 'Fog', terrain: 'Forest'}, p))
  list.push(...addIf(P.Klang, {gate: CATCH_CHARM_DPPT, weather: 'Thunderstorm', terrain: 'Mountain'}, p))
  list.push(...addIf(P.Eelektrik, {gate: CATCH_CHARM_DPPT, weather: 'Thunderstorm', terrain: 'Mountain'}, p))
  list.push(...addIf(P.Ferroseed, {gate: CATCH_CHARM_DPPT, weather: 'Sunny', other: p.location.magneticField}, p))
  list.push(...addIf(P.Cryogonal, {gate: CATCH_CHARM_DPPT, weather: 'Snow', terrain: 'Grasslands'}, p))
  list.push(...addIf(P.Bouffalant, {gate: CATCH_CHARM_DPPT, terrain: 'Grasslands', region: 'North America'}, p))
  list.push(...addIf(P.Axew, {gate: CATCH_CHARM_DPPT, terrain: 'Mountain', weather: 'Cloudy'}, p))
  list.push(...addIf(P.Deino, {gate: CATCH_CHARM_DPPT, terrain: 'Rural', weather: 'Windy'}, p))
  list.push(...addIf(P.Durant, {gate: CATCH_CHARM_DPPT, terrain: 'Forest', other: p.user.berryGrown! >= 32}, p))
  list.push(...addIf(P.Heatmor, {gate: CATCH_CHARM_DPPT, weather: 'Heat Wave', terrain: 'Forest', other: TeamsBadge.match(P.Durant, getAllPokemon(p.user), MATCH_REQS).match}, p))
  list.push(...addIf(P.Pawniard, {gate: CATCH_CHARM_DPPT, other: p.user.raidRecord[1] >= 4}, p))
  list.push(...addIf(P.Frillish, {gate: CATCH_CHARM_DPPT, region: 'Pacific Islands', weather: 'Fog'}, p))
  list.push(...addIf(P.Vullaby, {gate: CATCH_CHARM_DPPT, region: 'Australia / New Zealand', weather: 'Windy', item: ['lightstone']}, p))
  list.push(...addIf(P.Shelmet, {gate: CATCH_CHARM_DPPT, weather: 'Rain', terrain: 'Forest'}, p))
  list.push(...addIf(P.Karrablast, {gate: CATCH_CHARM_DPPT, weather: 'Heat Wave', terrain: 'Forest'}, p))
  list.push(...addIf(P.Blitzle, {gate: CATCH_CHARM_DPPT, weather: 'Thunderstorm', terrain: 'Grasslands'}, p))

  // Kalos
  list.push(...addIf(P.Quilladin, {gate: CATCH_CHARM_BW, item: ['venusaurite']}, p))
  list.push(...addIf(P.Braixen, {gate: CATCH_CHARM_BW, item: ['charizarditex']}, p))
  list.push(...addIf(P.Braixen, {gate: CATCH_CHARM_BW, item: ['charizarditey']}, p))
  list.push(...addIf(P.Frogadier, {gate: CATCH_CHARM_BW, item: ['blastoiseite']}, p))
  list.push(...addIf(P.Spewpa, {gate: CATCH_CHARM_BW, item: ['beedrillite']}, p))
  list.push(...addIf(P.Diggersby, {gate: CATCH_CHARM_BW, item: ['lopunnyite'], terrain: 'Rural'}, p))
  list.push(...addIf(P.Fletchinder, {gate: CATCH_CHARM_BW, item: ['pidgeotite']}, p))
  list.push(...addIf(P.Spritzee, {gate: CATCH_CHARM_BW, item: ['audinoite', 'charizarditey']}, p))
  list.push(...addIf(P.Swirlix, {gate: CATCH_CHARM_BW, item: ['audinoite', 'charizarditex']}, p))
  list.push(...addIf(P.Meowstic, {gate: CATCH_CHARM_BW, item: ['alakazamite']}, p))
  list.push(...addIf(Potw(P.Pumpkaboo, {form: 'small'}), {gate: CATCH_CHARM_BW, item: ['banetteite']}, p))
  list.push(...addIf(Potw(P.Pumpkaboo, {form: 'average'}), {gate: CATCH_CHARM_BW, item: ['banetteite']}, p))
  list.push(...addIf(Potw(P.Pumpkaboo, {form: 'large'}), {gate: CATCH_CHARM_BW, item: ['banetteite']}, p))
  list.push(...addIf(Potw(P.Pumpkaboo, {form: 'super'}), {gate: CATCH_CHARM_BW, item: ['banetteite']}, p))
  list.push(...addIf(P.Phantump, {gate: CATCH_CHARM_BW, item: ['banetteite']}, p))
  list.push(...addIf(Potw(P.Floette, {form: 'blue'}), {gate: CATCH_CHARM_BW, item: ['gardevoirite'], terrain: 'Gardens', other: p.location.flower === 'blue'}, p))
  list.push(...addIf(Potw(P.Floette, {form: 'orange'}), {gate: CATCH_CHARM_BW, item: ['gardevoirite'], terrain: 'Gardens', other: p.location.flower === 'orange'}, p))
  list.push(...addIf(Potw(P.Floette, {form: 'red'}), {gate: CATCH_CHARM_BW, item: ['gardevoirite'], terrain: 'Gardens', other: p.location.flower === 'red'}, p))
  list.push(...addIf(Potw(P.Floette, {form: 'white'}), {gate: CATCH_CHARM_BW, item: ['gardevoirite'], terrain: 'Gardens', other: p.location.flower === 'white'}, p))
  list.push(...addIf(Potw(P.Floette, {form: 'yellow'}), {gate: CATCH_CHARM_BW, item: ['gardevoirite'], terrain: 'Gardens', other: p.location.flower === 'yellow'}, p))
  list.push(...addIf(P.Dedenne, {gate: CATCH_CHARM_BW, item: ['ampharosite'], terrain: 'Rural'}, p))
  list.push(...addIf(P.Helioptile, {gate: CATCH_CHARM_BW, item: ['manectricite'], weather: 'Heat Wave'}, p))
  list.push(...addIf(P.Clauncher, {gate: CATCH_CHARM_BW, item: ['slowbroite', 'charizarditex']}, p))
  list.push(...addIf(P.Skrelp, {gate: CATCH_CHARM_BW, item: ['gyaradosite', 'charizarditey']}, p))
  list.push(...addIf(P.Skiddo, {gate: CATCH_CHARM_BW, item: ['houndoomite'], weather: 'Sunny'}, p))
  list.push(...addIf(P.Pancham, {gate: CATCH_CHARM_BW, item: ['lucarioite'], weather: 'Cloudy'}, p))
  list.push(...addIf(P.Bergmite, {gate: CATCH_CHARM_BW, item: ['abomasnowite'], weather: 'Snow'}, p))
  list.push(...addIf(Potw(P.Furfrou, {form: 'natural'}), {gate: CATCH_CHARM_BW, item: ['kangaskhanite']}, p))
  list.push(...addIf(P.Hawlucha, {gate: CATCH_CHARM_BW, item: ['medichamite']}, p))
  list.push(...addIf(P.Goomy, {gate: CATCH_CHARM_BW, item: ['garchompite']}, p))
  
  list.push(...addIf(P.Vaporeon, {event: 'EEVEE', weather: 'Rain'}, p))
  list.push(...addIf(P.Jolteon, {event: 'EEVEE', weather: 'Thunderstorm'}, p))
  list.push(...addIf(P.Flareon, {event: 'EEVEE', weather: 'Heat Wave'}, p))
  list.push(...addIf(P.Espeon, {event: 'EEVEE', time: 'Day'}, p))
  list.push(...addIf(P.Umbreon, {event: 'EEVEE', time: 'Night'}, p))
  list.push(...addIf(P.Leafeon, {event: 'EEVEE', weather: 'Sunny'}, p))
  list.push(...addIf(P.Glaceon, {event: 'EEVEE', weather: 'Snow'}, p))
  list.push(...addIf(P.Sylveon, {event: 'EEVEE', terrain: 'Gardens'}, p))

  // Alola
  list.push(...addIf(P.Dartrix, {gate: CATCH_CHARM_XY, item: ['zgrassium']}, p))
  list.push(...addIf(P.Torracat, {gate: CATCH_CHARM_XY, item: ['zfirium']}, p))
  list.push(...addIf(P.Brionne, {gate: CATCH_CHARM_XY, item: ['zwaterium']}, p))
  list.push(...addIf(P.Trumbeak, {gate: CATCH_CHARM_XY, item: ['zflyinium'], weather: 'Windy'}, p))
  list.push(...addIf(P.Gumshoos, {gate: CATCH_CHARM_XY, item: ['znormalium'], time: 'Day'}, p))
  list.push(...addIf(P.Charjabug, {gate: CATCH_CHARM_XY, item: ['zbuginium']}, p))
  list.push(...addIf(P.Rockruff, {gate: CATCH_CHARM_XY, item: ['zrockium']}, p))
  list.push(...addIf(Potw(P.Oricorio, {form: 'baile'}), {gate: CATCH_CHARM_XY, item: ['zflyinium'], other: p.location.flower === 'red'}, p))
  list.push(...addIf(Potw(P.Oricorio, {form: 'pom_pom'}), {gate: CATCH_CHARM_XY, item: ['zflyinium'], other: p.location.flower === 'yellow'}, p))
  list.push(...addIf(Potw(P.Oricorio, {form: 'sensu'}), {gate: CATCH_CHARM_XY, item: ['zflyinium'], other: p.location.flower === 'blue'}, p))
  list.push(...addIf(Potw(P.Oricorio, {form: 'pau'}), {gate: CATCH_CHARM_XY, item: ['zflyinium'], other: p.location.flower === 'white'}, p))
  list.push(...addIf(Potw(P.Minior, {form: 'blue_meteor'}), {gate: CATCH_CHARM_XY, item: ['zrockium'], terrain: 'Mountain', other: p.location.meteor === 'blue_meteor'}, p))
  list.push(...addIf(Potw(P.Minior, {form: 'green_meteor'}), {gate: CATCH_CHARM_XY, item: ['zrockium'], terrain: 'Mountain', other: p.location.meteor === 'green_meteor'}, p))
  list.push(...addIf(Potw(P.Minior, {form: 'indigo_meteor'}), {gate: CATCH_CHARM_XY, item: ['zrockium'], terrain: 'Mountain', other: p.location.meteor === 'indigo_meteor'}, p))
  list.push(...addIf(Potw(P.Minior, {form: 'red_meteor'}), {gate: CATCH_CHARM_XY, item: ['zrockium'], terrain: 'Mountain', other: p.location.meteor === 'red_meteor'}, p))
  list.push(...addIf(Potw(P.Minior, {form: 'orange_meteor'}), {gate: CATCH_CHARM_XY, item: ['zrockium'], terrain: 'Mountain', other: p.location.meteor === 'orange_meteor'}, p))
  list.push(...addIf(Potw(P.Minior, {form: 'yellow_meteor'}), {gate: CATCH_CHARM_XY, item: ['zrockium'], terrain: 'Mountain', other: p.location.meteor === 'yellow_meteor'}, p))
  list.push(...addIf(Potw(P.Minior, {form: 'violet_meteor'}), {gate: CATCH_CHARM_XY, item: ['zrockium'], terrain: 'Mountain', other: p.location.meteor === 'violet_meteor'}, p))
  list.push(...addIf(P.Wishiwashi, {gate: CATCH_CHARM_XY, terrain: 'Bay', item: ['zwaterium']}, p))
  list.push(...addIf(P.Mareanie, {gate: CATCH_CHARM_XY, item: ['zpoisonium'], terrain: 'Beach'}, p))
  list.push(...addIf(P.Mudbray, {gate: CATCH_CHARM_XY, item: ['zgroundium'], terrain: 'Rural'}, p))
  list.push(...addIf(P.Dewpider, {gate: CATCH_CHARM_XY, terrain: 'Beach', item: ['zwaterium']}, p))
  list.push(...addIf(P.Fomantis, {gate: CATCH_CHARM_XY, terrain: 'Grasslands', item: ['zgrassium']}, p))
  list.push(...addIf(P.Morelull, {gate: CATCH_CHARM_XY, terrain: 'Rainforest', item: ['zgrassium']}, p))
  list.push(...addIf(P.Salandit, {gate: CATCH_CHARM_XY, terrain: 'Mountain', item: ['zfirium']}, p))
  list.push(...addIf(P.Steenee, {gate: CATCH_CHARM_XY, terrain: 'Forest', item: ['zgrassium']}, p))
  list.push(...addIf(P.Comfey, {gate: CATCH_CHARM_XY, terrain: 'Tropical', item: ['zfairium']}, p))
  list.push(...addIf(P.Cutiefly, {gate: CATCH_CHARM_XY, terrain: 'Gardens', item: ['zbuginium']}, p))
  list.push(...addIf(P.Oranguru, {gate: CATCH_CHARM_XY, terrain: 'Rainforest', item: ['zpsychicium']}, p))
  list.push(...addIf(P.Passimian, {gate: CATCH_CHARM_XY, terrain: 'Rainforest', item: ['zfightinium']}, p))
  list.push(...addIf(P.Pyukumuku, {gate: CATCH_CHARM_XY, terrain: 'Oceanic', item: ['zwaterium']}, p))
  list.push(...addIf(P.Komala, {gate: CATCH_CHARM_XY, item: ['blueflute']}, p))
  list.push(...addIf(P.Togedemaru, {gate: CATCH_CHARM_XY, item: ['zelectrium'], terrain: 'Mountain'}, p))
  list.push(...addIf(P.Togedemaru, {gate: CATCH_CHARM_XY, item: ['zelectrium'], weather: 'Thunderstorm'}, p))
  list.push(...addIf(P.Mimikyu, {gate: CATCH_CHARM_XY, terrain: 'Urban', item: ['zghostium']}, p))
  list.push(...addIf(P.Bruxish, {gate: CATCH_CHARM_XY, terrain: 'Oceanic', item: ['zpsychicium']}, p))
  list.push(...addIf(P.Drampa, {gate: CATCH_CHARM_XY, terrain: 'Rural', item: ['zdragonium']}, p))
  list.push(...addIf(P.Dhelmise, {gate: CATCH_CHARM_XY, terrain: 'Oceanic', item: ['zsteelium']}, p))
  list.push(...addIf(P.Jangmo_o, {gate: CATCH_CHARM_XY, item: ['zdragonium']}, p))

  // Galar
  list.push(...addIf(P.Thwackey, {gate: CATCH_CHARM_SM, terrain: 'Gardens'}, p))
  list.push(...addIf(P.Raboot, {gate: CATCH_CHARM_SM, terrain: 'Grasslands'}, p))
  list.push(...addIf(P.Drizzile, {gate: CATCH_CHARM_SM, terrain: 'Bay'}, p))
  list.push(...addIf(P.Corvisquire, {gate: CATCH_CHARM_SM, terrain: 'Forest', time: 'Day'}, p))
  list.push(...addIf(P.Dottler, {gate: CATCH_CHARM_SM, terrain: 'Grasslands', time: 'Night'}, p))
  list.push(...addIf(P.Thievul, {gate: CATCH_CHARM_SM, terrain: 'Rural', time: 'Night'}, p))
  list.push(...addIf(P.Eldegoss, {gate: CATCH_CHARM_SM, weather: 'Sunny'}, p))
  list.push(...addIf(P.Drednaw, {gate: CATCH_CHARM_SM, weather: 'Rain'}, p))
  list.push(...addIf(P.Boltund, {gate: CATCH_CHARM_SM, weather: 'Thunderstorm', terrain: 'Urban'}, p))
  list.push(...addIf(P.Carkol, {gate: CATCH_CHARM_SM, weather: 'Heat Wave', terrain: 'Mountain'}, p))
  list.push(...addIf(P.Clobbopus, {gate: CATCH_CHARM_SM, weather: 'Cloudy', terrain: 'Bay'}, p))
  list.push(...addIf(P.Hattrem, {gate: CATCH_CHARM_SM, weather: 'Fog', terrain: 'Forest'}, p))
  list.push(...addIf(P.Morgrem, {gate: CATCH_CHARM_SM, weather: 'Fog', terrain: 'Forest'}, p))
  list.push(...addIf(P.Falinks, {gate: CATCH_CHARM_SM, time: 'Day', region: 'North Europe'}, p))
  list.push(...addIf(Potw(P.Morpeko, {form: 'hangry'}), {gate: CATCH_CHARM_SM, terrain: 'Grasslands'}, p))
  list.push(...addIf(P.Pincurchin, {gate: CATCH_CHARM_SM, time: 'Night', region: 'Mediterranean'}, p))
  list.push(...addIf(P.Dreepy, {gate: CATCH_CHARM_SM, weather: 'Fog'}, p))
  for (const l of ['UK-CBG', 'UK-LON', 'UK-MAN', 'UK-OXF']) {
    const location = l as LocationId
    list.push(...addIf(Potw(P.Meowth, {form: 'galarian'}), {gate: CATCH_CHARM_SM, weather: 'Thunderstorm', location}, p))
    list.push(...addIf(Potw(P.Ponyta, {form: 'galarian'}), {gate: CATCH_CHARM_SM, weather: 'Fog', location, terrain: 'Grasslands'}, p))
    list.push(...addIf(Potw(P.Slowpoke, {form: 'galarian'}), {gate: CATCH_CHARM_SM, weather: 'Rain', location, terrain: 'Grasslands'}, p))
    list.push(...addIf(Potw(P.Farfetchd, {form: 'galarian'}), {gate: CATCH_CHARM_SM, weather: 'Cloudy', location}, p))
    list.push(...addIf(Potw(P.Weezing, {form: 'galarian'}), {gate: CATCH_CHARM_SM, weather: 'Fog', location, terrain: 'Urban'}, p))
    list.push(...addIf(Potw(P.Mr_Mime, {form: 'galarian'}), {gate: CATCH_CHARM_SM, weather: 'Snow', location, terrain: 'Urban'}, p))
    list.push(...addIf(Potw(P.Corsola, {form: 'galarian'}), {gate: CATCH_CHARM_SM, location, terrain: 'Urban', time: 'Night'}, p))
    list.push(...addIf(Potw(P.Zigzagoon, {form: 'galarian'}), {gate: CATCH_CHARM_SM, location, terrain: 'Grasslands', time: 'Night'}, p))
    list.push(...addIf(Potw(P.Darumaka, {form: 'galarian'}), {gate: CATCH_CHARM_SM, location, weather: 'Snow'}, p))
    list.push(...addIf(Potw(P.Yamask, {form: 'galarian'}), {gate: CATCH_CHARM_SM, location, terrain: 'Grasslands', time: 'Night'}, p))
    list.push(...addIf(Potw(P.Stunfisk, {form: 'galarian'}), {gate: CATCH_CHARM_SM, location, terrain: 'Grasslands', weather: 'Thunderstorm'}, p))
  }

  return {
    shinyMultipler: 1,
    list,
    guaranteedItem: nop
  }
}

const ENCOUNTERS_RARE = (user: Users.Doc, now: Date, location: Location, format: EncounterParamFormat = 'List') => {
  const p = {user: user as Users.Doc, location, format}
  const nowSeason = season(location, now)
  const allBadges = getAllPokemon(user)
  const simpleBadges = allBadges.map(badge => new TeamsBadge(badge).toSimple())

  const list: BadgeId[] = []
  list.push(...addIf(P.Ivysaur, {count: 1}, p))
  list.push(...addIf(P.Venusaur, {count: 1}, p))
  list.push(...addIf(P.Charmeleon, {count: 1}, p))
  list.push(...addIf(P.Charizard, {count: 1}, p))
  list.push(...addIf(P.Wartortle, {count: 1}, p))
  list.push(...addIf(P.Blastoise, {count: 1}, p))
  list.push(...addIf(P.Butterfree, {count: 1, terrain: 'Gardens'}, p))
  list.push(...addIf(P.Beedrill, {count: 1, terrain: 'Forest'}, p))
  list.push(...addIf(P.Pidgeot, {count: 1}, p))
  list.push(...addIf(P.Nidorina, {count: 1}, p))
  list.push(...addIf(P.Nidorino, {count: 1}, p))
  list.push(...addIf(P.Nidoking, {gate: CATCH_CHARM_RSE, event: 'THREE_KINGS', count: 10}, p))
  list.push(...addIf(P.Clefable, {count: 5, event: 'MOON_STONE'}, p))
  list.push(...addIf(P.Clefable, {count: 5, event: 'FULL_MOON'}, p))
  list.push(...addIf(P.Kadabra, {count: 1}, p))
  list.push(...addIf(P.Alakazam, {count: 1, event: 'MEWTWO_BIRTHDAY'}, p))
  list.push(...addIf(P.Machoke, {count: 1}, p))
  list.push(...addIf(P.Weepinbell, {count: 1}, p))
  list.push(...addIf(P.Rapidash, {count: 1, terrain: 'Grasslands'}, p))
  list.push(...addIf(P.Slowbro, {count: 1, terrain: 'Beach'}, p))
  list.push(...addIf(P.Dodrio, {count: 1, terrain: 'Grasslands'}, p))
  list.push(...addIf(P.Haunter, {count: 1, time: 'Night'}, p))
  list.push(...addIf(P.Haunter, {event: 'HALLOWEEN', count: 20}, p))
  list.push(...addIf(P.Gengar, {event: 'HALLOWEEN'}, p))
  list.push(...addIf(P.Hypno, {count: 1, time: 'Night'}, p))
  list.push(...addIf(P.Marowak, {count: 1}, p))
  list.push(...addIf(P.Lickitung, {count: 1, terrain: 'Grasslands'}, p))
  list.push(...addIf(P.Rhydon, {count: 1}, p))
  list.push(...addIf(P.Chansey, {count: 1, terrain: 'Grasslands'}, p))
  list.push(...addIf(P.Tangela, {count: 1, terrain: 'Grasslands'}, p))
  list.push(...addIf(P.Gyarados, {count: 1, tide: 'High Tide'}, p))
  list.push(...addIf(P.Porygon, {count: 1}, p))
  list.push(...addIf(P.Porygon, {event: 'SOFTWARE_FREEDOM_DAY', count: 20}, p))
  list.push(...addIf(Potw(P.Porygon, {form: 'brin'}), {event: 'APRIL_FOOLS', count: 20}, p))
  list.push(...addIf(Potw(P.Porygon, {form: 'page'}), {event: 'APRIL_FOOLS', count: 20}, p))
  list.push(...addIf(P.Dragonair, {count: 1, time: 'Day', weather: 'Fog'}, p))

  // If the player has won at least six times in the Battle Stadium,
  // Hitmonlee and Hitmonchan are available w/ Ultra Ball.
  list.push(...addIf(P.Hitmonlee, {other: user.battleStadiumRecord && user.battleStadiumRecord[1] > 6}, p))
  list.push(...addIf(P.Hitmonchan, {other: user.battleStadiumRecord && user.battleStadiumRecord[1] > 6}, p))
  list.push(...addIf(P.Kangaskhan, {region: 'Australia / New Zealand', weather: 'Cloudy'}, p))
  list.push(...addIf(P.Mr_Mime, {region: 'North Europe'}, p))
  list.push(...addIf(P.Scyther, {terrain: 'Forest'}, p))
  list.push(...addIf(P.Jynx, {weather: 'Snow'}, p))
  list.push(...addIf(P.Electabuzz, {weather: 'Thunderstorm'}, p))
  list.push(...addIf(P.Magmar, {weather: 'Heat Wave'}, p))
  // Lapras are available with a Great Ball or Ultra Ball on Fridays
  list.push(...addIf(P.Lapras, {event: 'HAPPY_FRIDAY'}, p))
  list.push(...addIf(P.Ditto, {weather: 'Diamond Dust'}, p))
  list.push(...addIf(P.Dragonite, {terrain: 'Oceanic', weather: 'Fog'}, p))
  list.push(...addIf(P.Nidoqueen, {event: 'MOTHERS_DAY', count: 10}, p))
  list.push(...addIf(P.Nidoking, {event: 'FATHERS_DAY', count: 10}, p))

  // Johto
  list.push(...addIf(P.Meganium, {gate: CATCH_CHARM_RBY, count: 1}, p))
  list.push(...addIf(P.Typhlosion, {gate: CATCH_CHARM_RBY, count: 1}, p))
  list.push(...addIf(P.Feraligatr, {gate: CATCH_CHARM_RBY, count: 1}, p))
  list.push(...addIf(P.Lanturn, {gate: CATCH_CHARM_RBY, region: 'Pacific Islands'}, p))
  list.push(...addIf(P.Ampharos, {gate: CATCH_CHARM_RBY, count: 1, weather: 'Thunderstorm', terrain: 'Grasslands'}, p))
  list.push(...addIf(P.Sunflora, {event: 'AUTUMN', count: 10}, p))
  list.push(...addIf(P.Slowking, {gate: CATCH_CHARM_RSE, event: 'THREE_KINGS', count: 10}, p))
  list.push(...addIf(P.Misdreavus, {gate: CATCH_CHARM_RBY, terrain: 'Rural', time: 'Night'}, p))
  list.push(...addIf(P.Wobbuffet, {gate: CATCH_CHARM_RBY, count: 1}, p))
  list.push(...addIf(P.Girafarig, {gate: CATCH_CHARM_RBY, count: 1, terrain: 'Grasslands'}, p))
  list.push(...addIf(P.Forretress, {gate: CATCH_CHARM_RBY, count: 1, terrain: 'Rainforest'}, p))
  list.push(...addIf(P.Heracross, {gate: CATCH_CHARM_RBY, terrain: 'Gardens', time: 'Day'}, p))
  list.push(...addIf(P.Ursaring, {gate: CATCH_CHARM_RBY, count: 1, terrain: 'Forest'}, p))
  list.push(...addIf(P.Octillery, {gate: CATCH_CHARM_RBY, count: 1, terrain: 'Bay'}, p))
  list.push(...addIf(P.Octillery, {gate: CATCH_CHARM_RBY, count: 1, terrain: 'Beach'}, p))
  list.push(...addIf(P.Delibird, {gate: CATCH_CHARM_RBY, other: nowSeason === 'Winter'}, p))
  list.push(...addIf(P.Delibird, {gate: CATCH_CHARM_RBY, weather: 'Diamond Dust'}, p))
  list.push(...addIf(P.Delibird, {gate: CATCH_CHARM_RBY, weather: 'Snow'}, p))
  list.push(...addIf(P.Delibird, {event: 'CHRISTMAS', count: 20}, p))
  list.push(...addIf(P.Houndoom, {gate: CATCH_CHARM_RBY, count: 1, time: 'Night'}, p))
  list.push(...addIf(P.Kingdra, {gate: CATCH_CHARM_RSE, event: 'THREE_KINGS', count: 10}, p))
  list.push(...addIf(P.Donphan, {gate: CATCH_CHARM_RBY, count: 1, terrain: 'Rural'}, p))
  list.push(...addIf(P.Smeargle, {gate: CATCH_CHARM_RBY, weather: 'Diamond Dust'}, p))
  list.push(...addIf(P.Larvitar, {gate: CATCH_CHARM_RBY, count: 1}, p))
  list.push(...addIf(P.Tyranitar, {gate: CATCH_CHARM_RBY, terrain: 'Mountain', weather: 'Sandstorm'}, p))
  
  // Hoenn
  list.push(...addIf(P.Sceptile, {gate: CATCH_CHARM_GSC, count: 1}, p))
  list.push(...addIf(P.Blaziken, {gate: CATCH_CHARM_GSC, count: 1}, p))
  list.push(...addIf(P.Swampert, {gate: CATCH_CHARM_GSC, count: 1}, p))
  list.push(...addIf(P.Beautifly, {gate: CATCH_CHARM_GSC, terrain: 'Tropical'}, p))
  list.push(...addIf(P.Dustox, {gate: CATCH_CHARM_GSC, terrain: 'Tropical'}, p))
  list.push(...addIf(P.Gardevoir, {gate: CATCH_CHARM_GSC, count: 1}, p))
  list.push(...addIf(P.Slaking, {gate: CATCH_CHARM_GSC, terrain: 'Rainforest'}, p))
  list.push(...addIf(P.Exploud, {gate: CATCH_CHARM_GSC, terrain: 'Urban'}, p))
  list.push(...addIf(P.Hariyama, {gate: CATCH_CHARM_GSC, count: 1, weather: 'Cloudy'}, p))
  list.push(...addIf(P.Aggron, {gate: CATCH_CHARM_GSC, terrain: 'Mountain'}, p))
  list.push(...addIf(P.Medicham, {gate: CATCH_CHARM_GSC, region: 'Asia'}, p))
  list.push(...addIf(P.Swalot, {gate: CATCH_CHARM_GSC, terrain: 'Urban'}, p))
  list.push(...addIf(P.Wailord, {gate: CATCH_CHARM_GSC, terrain: 'Oceanic'}, p))
  list.push(...addIf(P.Camerupt, {gate: CATCH_CHARM_GSC, region: 'Africa / Middle East', tide: 'Low Tide'}, p))
  list.push(...addIf(P.Grumpig, {gate: CATCH_CHARM_GSC, count: 1, weather: 'Fog'}, p))
  list.push(...addIf(P.Vibrava, {gate: CATCH_CHARM_GSC, weather: 'Sandstorm'}, p))
  list.push(...addIf(P.Seviper, {gate: CATCH_CHARM_GSC, count: 1, other: simpleBadges.includes(P.Zangoose)}, p))
  list.push(...addIf(P.Zangoose, {gate: CATCH_CHARM_GSC, count: 1, other: simpleBadges.includes(P.Seviper)}, p))
  list.push(...addIf(P.Cacturne, {gate: CATCH_CHARM_GSC, terrain: 'Desert'}, p))
  list.push(...addIf(P.Altaria, {gate: CATCH_CHARM_GSC, weather: 'Fog'}, p))
  list.push(...addIf(P.Crawdaunt, {event: 'LOBSTER', count: 5}, p))
  list.push(...addIf(P.Solrock, {gate: CATCH_CHARM_GSC, other: nowSeason === 'Spring'}, p))
  list.push(...addIf(P.Solrock, {gate: CATCH_CHARM_GSC, other: nowSeason === 'Summer'}, p))
  list.push(...addIf(P.Lunatone, {gate: CATCH_CHARM_GSC, other: nowSeason === 'Autumn'}, p))
  list.push(...addIf(P.Lunatone, {gate: CATCH_CHARM_GSC, other: nowSeason === 'Winter'}, p))
  list.push(...addIf(P.Tropius, {gate: CATCH_CHARM_GSC, terrain: 'Tropical'}, p))
  list.push(...addIf(P.Walrein, {gate: CATCH_CHARM_GSC, terrain: 'Bay'}, p))
  list.push(...addIf(P.Walrein, {gate: CATCH_CHARM_GSC, terrain: 'Beach'}, p))
  list.push(...addIf(P.Shelgon, {gate: CATCH_CHARM_GSC, terrain: 'Mountain'}, p))
  list.push(...addIf(P.Metang, {gate: CATCH_CHARM_GSC, weather: 'Thunderstorm'}, p))

  // Sinnoh
  list.push(...addIf(P.Torterra, {gate: CATCH_CHARM_RSE, other: p.location.mossyRock === true}, p))
  list.push(...addIf(P.Infernape, {gate: CATCH_CHARM_RSE, other: p.location.magneticField === true}, p))
  list.push(...addIf(P.Empoleon, {gate: CATCH_CHARM_RSE, other: p.location.icyRock === true}, p))
  list.push(...addIf(P.Staraptor, {gate: CATCH_CHARM_RSE, weather: 'Cloudy'}, p))
  list.push(...addIf(P.Luxray, {gate: CATCH_CHARM_RSE, weather: 'Thunderstorm'}, p))
  list.push(...addIf(Potw(P.Cherrim, {form: 'overcast'}), {gate: CATCH_CHARM_RSE, weather: 'Cloudy'}, p))
  list.push(...addIf(Potw(P.Cherrim, {form: 'sunshine'}), {gate: CATCH_CHARM_RSE, weather: 'Heat Wave'}, p))
  list.push(...addIf(Potw(P.Gastrodon, {form: 'east_sea'}), {gate: CATCH_CHARM_RSE, weather: 'Rain', other: location.hemiLong === 'East'}, p))
  list.push(...addIf(Potw(P.Gastrodon, {form: 'west_sea'}), {gate: CATCH_CHARM_RSE, weather: 'Rain', other: location.hemiLong === 'West'}, p))
  list.push(...addIf(P.Drifblim, {gate: CATCH_CHARM_RSE, event: 'HAPPY_FRIDAY'}, p))
  list.push(...addIf(P.Lopunny, {gate: CATCH_CHARM_RSE, event: 'EASTER'}, p))
  list.push(...addIf(P.Bronzong, {gate: CATCH_CHARM_RSE, region: 'Africa / Middle East'}, p))
  list.push(...addIf(P.Gabite, {gate: CATCH_CHARM_RSE, weather: 'Sandstorm'}, p))
  list.push(...addIf(P.Riolu, {gate: CATCH_CHARM_RSE, terrain: 'Mountain'}, p))
  list.push(...addIf(P.Hippowdon, {gate: CATCH_CHARM_RSE, terrain: 'Desert'}, p))
  list.push(...addIf(P.Abomasnow, {gate: CATCH_CHARM_RSE, weather: 'Diamond Dust'}, p))
  list.push(...addIf(P.Abomasnow, {gate: CATCH_CHARM_RSE, weather: 'Snow'}, p))
  list.push(...addIf(P.Rotom, {gate: CATCH_CHARM_RSE, weather: 'Thunderstorm', terrain: 'Urban', time: 'Night'}, p))
  list.push(...addIf(P.Togekiss, {event: 'KINDNESS', count: 10}, p))

  // Unova
  list.push(...addIf(P.Serperior, {gate: CATCH_CHARM_DPPT, item: ['lightstone', 'darkstone']}, p))
  list.push(...addIf(P.Emboar, {gate: CATCH_CHARM_DPPT, item: ['lightstone', 'darkstone']}, p))
  list.push(...addIf(P.Samurott, {gate: CATCH_CHARM_DPPT, item: ['lightstone', 'darkstone']}, p))
  list.push(...addIf(P.Liepard, {gate: CATCH_CHARM_DPPT, terrain: 'Urban', time: 'Night'}, p))
  list.push(...addIf(P.Stoutland, {gate: CATCH_CHARM_DPPT, terrain: 'Mountain', weather: 'Snow'}, p))
  list.push(...addIf(P.Excadrill, {gate: CATCH_CHARM_DPPT, terrain: 'Mountain', other: p.user.raidRecord[1] >= 16}, p))
  list.push(...addIf(P.Seismitoad, {gate: CATCH_CHARM_DPPT, terrain: 'Bay', weather: 'Rain', other: user.researchCompleted! >= 4}, p))
  list.push(...addIf(P.Garbodor, {gate: CATCH_CHARM_DPPT, location: 'US-NYC'}, p))
  list.push(...addIf(Potw(P.Sawsbuck, {form: 'spring'}), {gate: CATCH_CHARM_DPPT, terrain: 'Grasslands', weather: 'Sunny', other: nowSeason === 'Spring'}, p))
  list.push(...addIf(Potw(P.Sawsbuck, {form: 'summer'}), {gate: CATCH_CHARM_DPPT, terrain: 'Grasslands', weather: 'Sunny', other: nowSeason === 'Summer'}, p))
  list.push(...addIf(Potw(P.Sawsbuck, {form: 'autumn'}), {gate: CATCH_CHARM_DPPT, terrain: 'Grasslands', weather: 'Sunny', other: nowSeason === 'Autumn'}, p))
  list.push(...addIf(Potw(P.Sawsbuck, {form: 'winter'}), {gate: CATCH_CHARM_DPPT, terrain: 'Grasslands', weather: 'Sunny', other: nowSeason === 'Winter'}, p))
  list.push(...addIf(P.Krookodile, {gate: CATCH_CHARM_DPPT, terrain: 'Desert', weather: 'Sandstorm', region: 'Africa / Middle East', other: user.battleStadiumRecord[1] >= 4}, p))
  list.push(...addIf(Potw(P.Darmanitan, {form: 'ordinary'}), {gate: CATCH_CHARM_DPPT, terrain: 'Desert', weather: 'Heat Wave'}, p))
  list.push(...addIf(Potw(P.Darmanitan, {form: 'zen'}), {gate: CATCH_CHARM_DPPT, terrain: 'Desert', weather: 'Fog'}, p))
  list.push(...addIf(P.Crustle, {gate: CATCH_CHARM_DPPT, terrain: 'Beach', weather: 'Sandstorm', other: p.user.raidRecord[1] >= 4}, p))
  list.push(...addIf(P.Scrafty, {gate: CATCH_CHARM_DPPT, terrain: 'Urban', time: 'Night'}, p))
  list.push(...addIf(P.Vanilluxe, {gate: CATCH_CHARM_DPPT, terrain: 'Urban', weather: 'Snow'}, p))
  list.push(...addIf(P.Vanilluxe, {event: 'ICE_CREAM_DAY', count: 10}, p))
  list.push(...addIf(P.Braviary, {gate: CATCH_CHARM_DPPT, region: 'North America', terrain: 'Desert', weather: 'Windy', item: ['darkstone']}, p))
  list.push(...addIf(P.Unfezant, {gate: CATCH_CHARM_DPPT, terrain: 'Grasslands', weather: 'Cloudy'}, p))
  list.push(...addIf(P.Unfezant, {event: 'THANKSGIVING', count: 10}, p))
  list.push(...addIf(P.Scolipede, {gate: CATCH_CHARM_DPPT, region: 'South America', terrain: 'Rainforest', weather: 'Sunny'}, p))
  list.push(...addIf(P.Gothitelle, {gate: CATCH_CHARM_DPPT, region: 'North Europe', weather: 'Fog', terrain: 'Urban', item: ['lightstone']}, p))
  list.push(...addIf(P.Cofagrigus, {gate: CATCH_CHARM_DPPT, time: 'Night', location: 'EG-CAI'}, p))
  list.push(...addIf(P.Beartic, {gate: CATCH_CHARM_DPPT, other: p.location.icyRock === true}, p))
  list.push(...addIf(P.Golurk, {gate: CATCH_CHARM_DPPT, terrain: 'Desert', time: 'Night'}, p))
  list.push(...addIf(P.Swanna, {gate: CATCH_CHARM_DPPT, terrain: 'Beach', weather: 'Cloudy'}, p))
  list.push(...addIf(P.Reuniclus, {gate: CATCH_CHARM_DPPT, region: 'North America', weather: 'Rain', terrain: 'Urban', item: ['darkstone']}, p))
  list.push(...addIf(P.Amoonguss, {gate: CATCH_CHARM_DPPT, weather: 'Sunny', other: p.location.mossyRock === true}, p))
  list.push(...addIf(P.Galvantula, {gate: CATCH_CHARM_DPPT, weather: 'Thunderstorm', terrain: 'Rainforest'}, p))
  list.push(...addIf(P.Zoroark, {gate: CATCH_CHARM_DPPT, weather: 'Fog', terrain: 'Forest'}, p))
  list.push(...addIf(P.Klinklang, {gate: CATCH_CHARM_DPPT, weather: 'Thunderstorm', terrain: 'Mountain'}, p))
  list.push(...addIf(P.Ferrothorn, {gate: CATCH_CHARM_DPPT, weather: 'Sunny', other: p.location.magneticField}, p))
  list.push(...addIf(P.Mienshao, {gate: CATCH_CHARM_DPPT, region: 'Asia', terrain: 'Urban'}, p))
  list.push(...addIf(P.Fraxure, {gate: CATCH_CHARM_DPPT, terrain: 'Mountain', weather: 'Cloudy'}, p))
  list.push(...addIf(P.Zweilous, {gate: CATCH_CHARM_DPPT, terrain: 'Rural', weather: 'Windy'}, p))
  list.push(...addIf(P.Druddigon, {gate: CATCH_CHARM_DPPT, location: 'UK-MAN'}, p))
  list.push(...addIf(P.Bisharp, {gate: CATCH_CHARM_DPPT, other: p.user.raidRecord[1] >= 16}, p))
  list.push(...addIf(P.Jellicent, {gate: CATCH_CHARM_DPPT, region: 'Pacific Islands', weather: 'Fog'}, p))
  list.push(...addIf(P.Mandibuzz, {gate: CATCH_CHARM_DPPT, region: 'Australia / New Zealand', weather: 'Windy', item: ['lightstone']}, p))
  list.push(...addIf(P.Mandibuzz, {event: 'VULTURE_AWARENESS', count: 20}, p))
  list.push(...addIf(P.Zebstrika, {gate: CATCH_CHARM_DPPT, weather: 'Thunderstorm', terrain: 'Grasslands'}, p))
  list.push(...addIf(P.Larvesta, {gate: CATCH_CHARM_DPPT, weather: 'Sunny', terrain: 'Tropical', time: 'Day'}, p))
  list.push(...addIf(P.Whimsicott, {event: 'SUMMER'}, p))

  // Kalos
  list.push(...addIf(P.Chesnaught, {gate: CATCH_CHARM_BW, item: ['venusaurite']}, p))
  list.push(...addIf(P.Delphox, {gate: CATCH_CHARM_BW, item: ['charizarditex']}, p))
  list.push(...addIf(P.Delphox, {gate: CATCH_CHARM_BW, item: ['charizarditey']}, p))
  list.push(...addIf(P.Greninja, {gate: CATCH_CHARM_BW, item: ['blastoiseite']}, p))
  list.push(...addIf(P.Talonflame, {gate: CATCH_CHARM_BW, item: ['pidgeotite'], weather: 'Heat Wave'}, p))
  list.push(...addIf(P.Doublade, {gate: CATCH_CHARM_BW, item: ['gengarite']}, p))
  list.push(...addIf(P.Klefki, {gate: CATCH_CHARM_BW, item: ['mawileite'], terrain: 'Urban'}, p))
  list.push(...addIf(P.Clawitzer, {gate: CATCH_CHARM_BW, item: ['slowbroite', 'charizarditex'], tide: 'High Tide'}, p))
  list.push(...addIf(P.Dragalge, {gate: CATCH_CHARM_BW, item: ['gyaradosite', 'charizarditey'], tide: 'High Tide'}, p))
  list.push(...addIf(P.Gogoat, {gate: CATCH_CHARM_BW, item: ['houndoomite'], weather: 'Sunny'}, p))
  list.push(...addIf(P.Avalugg, {gate: CATCH_CHARM_BW, item: ['abomasnowite'], weather: 'Snow'}, p))
  list.push(...addIf(P.Sliggoo, {gate: CATCH_CHARM_BW, item: ['garchompite']}, p))
  list.push(...addIf(P.Pyroar, {gate: CATCH_CHARM_BW, item: ['cameruptite'], terrain: 'Grasslands'}, p))
  list.push(...addIf(P.Barbaracle, {gate: CATCH_CHARM_BW, item: ['sharpedoite'], terrain: 'Beach'}, p))
  list.push(...addIf(P.Carbink, {gate: CATCH_CHARM_BW, item: ['steelixite'], terrain: 'Mountain'}, p))
  list.push(...addIf(P.Noibat, {gate: CATCH_CHARM_BW, item: ['altariaite'], weather: 'Windy'}, p))

  // Alola
  list.push(...addIf(P.Decidueye, {gate: CATCH_CHARM_XY, item: ['zgrassium']}, p))
  list.push(...addIf(P.Incineroar, {gate: CATCH_CHARM_XY, item: ['zfirium']}, p))
  list.push(...addIf(P.Primarina, {gate: CATCH_CHARM_XY, item: ['zwaterium']}, p))
  list.push(...addIf(P.Toucannon, {gate: CATCH_CHARM_XY, item: ['zflyinium']}, p))
  list.push(...addIf(Potw(P.Lycanroc, {form: 'midday'}), {gate: CATCH_CHARM_XY, time: 'Day', item: ['zrockium']}, p))
  list.push(...addIf(Potw(P.Lycanroc, {form: 'midnight'}), {gate: CATCH_CHARM_XY, time: 'Night', item: ['zrockium']}, p))
  list.push(...addIf(P.Toxapex, {gate: CATCH_CHARM_XY, item: ['zpoisonium'], terrain: 'Beach'}, p))
  list.push(...addIf(P.Mudsdale, {gate: CATCH_CHARM_XY, item: ['zgroundium'], terrain: 'Rural'}, p))
  list.push(...addIf(P.Araquanid, {gate: CATCH_CHARM_XY, terrain: 'Beach', item: ['zwaterium']}, p))
  list.push(...addIf(P.Lurantis, {gate: CATCH_CHARM_XY, terrain: 'Grasslands', item: ['zgrassium']}, p))
  list.push(...addIf(P.Shiinotic, {gate: CATCH_CHARM_XY, terrain: 'Rainforest', item: ['zgrassium']}, p))
  list.push(...addIf(P.Bewear, {gate: CATCH_CHARM_XY, item: ['zfightinium'], weather: 'Sunny'}, p))
  list.push(...addIf(P.Ribombee, {gate: CATCH_CHARM_XY, terrain: 'Gardens', item: ['zbuginium']}, p))
  list.push(...addIf(P.Palossand, {gate: CATCH_CHARM_XY, terrain: 'Beach', item: ['zghostium'], tide: 'Low Tide'}, p))
  list.push(...addIf(P.Turtonator, {gate: CATCH_CHARM_XY, weather: 'Heat Wave', item: ['zfirium']}, p))
  list.push(...addIf(P.Hakamo_o, {gate: CATCH_CHARM_XY, item: ['zdragonium']}, p))
  list.push(...addIf(P.Golisopod, {gate: CATCH_CHARM_XY, weather: 'Fog', item: ['zbuginium']}, p))

  // Galar
  list.push(...addIf(P.Corviknight, {gate: CATCH_CHARM_SM, terrain: 'Forest', time: 'Day'}, p))
  list.push(...addIf(P.Orbeetle, {gate: CATCH_CHARM_SM, terrain: 'Grasslands', time: 'Night'}, p))
  list.push(...addIf(P.Dubwool, {gate: CATCH_CHARM_SM, terrain: 'Grasslands', region: 'North Europe'}, p))
  list.push(...addIf(P.Coalossal, {gate: CATCH_CHARM_SM, terrain: 'Mountain', weather: 'Heat Wave'}, p))
  list.push(...addIf(P.Sandaconda, {gate: CATCH_CHARM_SM, terrain: 'Desert', weather: 'Sandstorm'}, p))
  list.push(...addIf(P.Barraskewda, {gate: CATCH_CHARM_SM, terrain: 'Bay', weather: 'Rain'}, p))
  list.push(...addIf(P.Centiskorch, {gate: CATCH_CHARM_SM, terrain: 'Rainforest', weather: 'Heat Wave'}, p))
  list.push(...addIf(P.Hatterene, {gate: CATCH_CHARM_SM, terrain: 'Forest', weather: 'Fog'}, p))
  list.push(...addIf(P.Grimmsnarl, {gate: CATCH_CHARM_SM, terrain: 'Forest', weather: 'Fog'}, p))
  list.push(...addIf(P.Copperajah, {gate: CATCH_CHARM_SM, region: 'Asia', terrain: 'Grasslands'}, p))
  list.push(...addIf(P.Duraludon, {gate: CATCH_CHARM_SM, terrain: 'Mountain', weather: 'Thunderstorm'}, p))
  list.push(...addIf(P.Drakloak, {gate: CATCH_CHARM_SM, weather: 'Fog'}, p))
  list.push(...addIf(Potw(P.Weezing, {form: 'galarian'}), {count: 10, event: 'MONTREAL_PROTOCOL'}, p))

  return {
    shinyMultipler: 1,
    list,
    guaranteedItem: nop
  }
}

function ENCOUNTERS_LEGENDARY(user: Users.Doc, now, location, format: EncounterParamFormat = 'List'): Encounter {
  const p = {user: user as Users.Doc, location, format}

  const list: BadgeId[] = []
  list.push(...addIf(P.Articuno, {count: 1}, p))
  list.push(...addIf(P.Zapdos, {count: 1}, p))
  list.push(...addIf(P.Moltres, {count: 1}, p))
  list.push(...addIf(P.Dragonite, {count: 1}, p))

  // Johto
  list.push(...addIf(P.Raikou, {gate: CATCH_CHARM_RBY}, p))
  list.push(...addIf(P.Entei, {gate: CATCH_CHARM_RBY}, p))
  list.push(...addIf(P.Suicune, {other: user.hiddenItemsFound.includes(CLEAR_BELL)}, p))
  list.push(...addIf(P.Tyranitar, {gate: CATCH_CHARM_RBY}, p))
  
  // Hoenn
  list.push(...addIf(P.Flygon, {gate: CATCH_CHARM_GSC, weather: 'Sandstorm'}, p))
  list.push(...addIf(P.Salamence, {gate: CATCH_CHARM_GSC, terrain: 'Mountain'}, p))
  list.push(...addIf(P.Metagross, {gate: CATCH_CHARM_GSC, weather: 'Thunderstorm'}, p))
  list.push(...addIf(P.Latias, {item: ['blueorb']}, p))
  list.push(...addIf(P.Latios, {item: ['redorb']}, p))

  // Sinnoh
  list.push(...addIf(P.Garchomp, {gate: CATCH_CHARM_RSE, weather: 'Sandstorm'}, p))
  const azelf = Pokemon(Azelf)
  const uxie = Pokemon(Uxie)
  const mesprit = Pokemon(Mesprit)
  const mespritCondition = hasPokemonFuzzy(user, azelf) &&
      hasPokemonFuzzy(user, uxie) && !hasPokemonFuzzy(user, mesprit)
  list.push(...addIf(P.Mesprit, {other: mespritCondition}, p))
  list.push(...addIf(P.Phione, {gate: CATCH_CHARM_DPPT, tide: 'High Tide', terrain: 'Tropical'}, p))

  // Unova
  const hasLandorus = TeamsBadge.match(P.Landorus, getAllPokemon(p.user), MATCH_REQS).match
  list.push(...addIf(P.Haxorus, {gate: CATCH_CHARM_DPPT, terrain: 'Mountain', weather: 'Cloudy'}, p))
  list.push(...addIf(P.Hydreigon, {gate: CATCH_CHARM_DPPT, terrain: 'Rural', weather: 'Windy'}, p))
  list.push(...addIf(Potw(P.Tornadus, {form: 'incarnate'}), {gate: CATCH_CHARM_DPPT, weather: 'Windy', item:['lightstone'], others: [hasLandorus]}, p))
  list.push(...addIf(Potw(P.Thundurus, {form: 'incarnate'}), {gate: CATCH_CHARM_DPPT, weather: 'Windy', item: ['darkstone'], others: [hasLandorus]}, p))
  list.push(...addIf(P.Volcarona, {gate: CATCH_CHARM_DPPT, weather: 'Sunny', terrain: 'Tropical', time: 'Day'}, p))

  // Kalos
  list.push(...addIf(P.Goodra, {gate: CATCH_CHARM_BW, item: ['garchompite'], weather: 'Rain'}, p))
  list.push(...addIf(P.Noivern, {gate: CATCH_CHARM_BW, item: ['altariaite']}, p))

  // Alola
  list.push(...addIf(P.Kommo_o, {gate: CATCH_CHARM_XY, item: ['zdragonium']}, p))

  // Galar
  list.push(...addIf(P.Dragapult, {gate: CATCH_CHARM_SM, weather: 'Fog'}, p))
  const galarianBirds = hasPokemonFuzzy(user, Pokemon(I.Slowking, {form: 'galarian'}))
  list.push(...addIf(Potw(P.Articuno, {form: 'galarian'}), {gate: CATCH_CHARM_SM, other: galarianBirds}, p))
  list.push(...addIf(Potw(P.Zapdos, {form: 'galarian'}), {gate: CATCH_CHARM_SM, other: galarianBirds}, p))
  list.push(...addIf(Potw(P.Moltres, {form: 'galarian'}), {gate: CATCH_CHARM_SM, other: galarianBirds}, p))

  return {
    shinyMultipler: 1,
    list,
    guaranteedItem: nop
  }
}

const ENCOUNTERS_SAFARI = (user, _, location, format: EncounterParamFormat = 'List') => {
  const p = {user: user as Users.Doc, location, format}

  const list: BadgeId[] = []
  list.push(...addIf(P.NidoranF, {count: 1}, p))
  list.push(...addIf(P.NidoranM, {count: 1}, p))
  list.push(...addIf(P.Doduo, {count: 1}, p))
  list.push(...addIf(P.Exeggcute, {count: 1}, p))
  list.push(...addIf(P.Rhyhorn, {count: 1}, p))
  list.push(...addIf(P.Chansey, {count: 1}, p))
  list.push(...addIf(P.Tangela, {count: 1}, p))
  list.push(...addIf(P.Kangaskhan, {count: 1}, p))
  list.push(...addIf(P.Scyther, {count: 1}, p))
  list.push(...addIf(P.Pinsir, {count: 1}, p))
  list.push(...addIf(P.Tauros, {count: 1}, p))
  list.push(...addIf(P.Dratini, {count: 1}, p))

  // Sinnoh
  list.push(...addIf(P.Staravia, {gate: CATCH_CHARM_RSE}, p))
  list.push(...addIf(P.Yanma, {gate: CATCH_CHARM_RSE}, p))
  list.push(...addIf(P.Budew, {gate: CATCH_CHARM_RSE}, p))
  list.push(...addIf(P.Bidoof, {gate: CATCH_CHARM_RSE}, p))
  list.push(...addIf(P.Skorupi, {gate: CATCH_CHARM_RSE}, p))
  list.push(...addIf(P.Croagunk, {gate: CATCH_CHARM_RSE}, p))
  list.push(...addIf(P.Carnivine, {gate: CATCH_CHARM_RSE}, p))

  return {
    shinyMultipler: 1,
    list,
    guaranteedItem: nop
  }
}

// Fast Ball
const ENCOUNTERS_WHITE_APRICORN = (user, _, location, format: EncounterParamFormat = 'List') => {
  const p = {user: user as Users.Doc, location, format}

  const list: BadgeId[] = []
  list.push(...addIf(P.Dugtrio, {count: 1}, p))
  list.push(...addIf(P.Persian, {count: 1}, p))
  list.push(...addIf(P.Kadabra, {count: 1}, p))
  list.push(...addIf(P.Rapidash, {count: 1}, p))
  list.push(...addIf(P.Electrode, {count: 1}, p))
  list.push(...addIf(P.Scyther, {count: 1}, p))
  list.push(...addIf(P.Jumpluff, {count: 1}, p))
  list.push(...addIf(P.Sneasel, {count: 1}, p))

  // Hoenn
  list.push(...addIf(P.Grovyle, {gate: CATCH_CHARM_GSC}, p))

  // Galar
  list.push(...addIf(P.Eiscue, {gate: CATCH_CHARM_SM}, p))

  return {
    shinyMultipler: 1,
    list,
    guaranteedItem: nop
  }
}

// Friend Ball
const ENCOUNTERS_GREEN_APRICORN = (user, _, location, format: EncounterParamFormat = 'List') => {
  const p = {user: user as Users.Doc, location, format}

  const list: BadgeId[] = []
  list.push(...addIf(P.Golbat, {count: 1}, p))
  list.push(...addIf(P.Eevee, {count: 2}, p))
  list.push(...addIf(P.Chansey, {count: 1}, p))
  list.push(...addIf(P.Pikachu, {count: 1}, p))
  list.push(...addIf(P.Clefairy, {count: 1}, p))
  list.push(...addIf(P.Jigglypuff, {count: 1}, p))
  list.push(...addIf(P.Togetic, {count: 1}, p))
  list.push(...addIf(P.Marill, {count: 1}, p))
  list.push(...addIf(P.Snom, {gate: CATCH_CHARM_SM, weather: 'Snow'}, p))

  return {
    shinyMultipler: 1,
    list,
    guaranteedItem: nop
  }
}

// Heavy Ball
const ENCOUNTERS_BLACK_APRICORN = (user, _, location, format: EncounterParamFormat = 'List') => {
  const p = {user: user as Users.Doc, location, format}

  const list: BadgeId[] = []
  list.push(...addIf(P.Snorlax, {count: 1}, p))
  list.push(...addIf(P.Gyarados, {count: 1}, p))
  list.push(...addIf(P.Onix, {count: 1}, p))
  list.push(...addIf(P.Graveler, {count: 1}, p))
  list.push(...addIf(P.Dragonite, {count: 1}, p))
  list.push(...addIf(P.Ursaring, {count: 1}, p))
  list.push(...addIf(P.Mantine, {count: 1}, p))
  list.push(...addIf(P.Pupitar, {count: 1}, p))
  list.push(...addIf(P.Tyranitar, {count: 1}, p))

  // Hoenn
  list.push(...addIf(P.Hariyama, {gate: CATCH_CHARM_GSC}, p))

  // Galar
  list.push(...addIf(P.Stonjourner, {gate: CATCH_CHARM_SM}, p))
  list.push(...addIf(P.Cufant, {gate: CATCH_CHARM_SM}, p))

  return {
    shinyMultipler: 1,
    list,
    guaranteedItem: nop
  }
}

// Level Ball
const ENCOUNTERS_RED_APRICORN = (user, _, location, format: EncounterParamFormat = 'List') => {
  const p = {user: user as Users.Doc, location, format}

  const list: BadgeId[] = []
  list.push(...addIf(P.Butterfree, {count: 1}, p))
  list.push(...addIf(P.Beedrill, {count: 1}, p))
  list.push(...addIf(P.Furret, {count: 1}, p))
  list.push(...addIf(P.Noctowl, {count: 1, time: 'Night'}, p))
  list.push(...addIf(P.Ledian, {count: 1, time: 'Day'}, p))
  list.push(...addIf(P.Ariados, {count: 1, time: 'Night'}, p))
  list.push(...addIf(P.Quagsire, {count: 1}, p))
  list.push(...addIf(P.Flaaffy, {count: 1}, p))

  // Hoenn
  list.push(...addIf(P.Linoone, {gate: CATCH_CHARM_GSC}, p))
  
  // Galar
  list.push(...addIf(P.Skwovet, {gate: CATCH_CHARM_SM}, p))
  list.push(...addIf(P.Rookidee, {gate: CATCH_CHARM_SM}, p))

  return {
    shinyMultipler: 1,
    list,
    guaranteedItem: nop
  }
}

// Love Ball
const ENCOUNTERS_PINK_APRICORN = (user, _, location, format: EncounterParamFormat = 'List') => {
  const p = {user: user as Users.Doc, location, format}

  const list: BadgeId[] = []
  list.push(...addIf(P.NidoranF, {count: 1}, p))
  list.push(...addIf(P.NidoranM, {count: 1}, p))
  list.push(...addIf(P.Tauros, {count: 1}, p))
  list.push(...addIf(P.Chansey, {count: 1}, p))
  list.push(...addIf(P.Jynx, {count: 1}, p))
  list.push(...addIf(P.Nidorina, {count: 1}, p))
  list.push(...addIf(P.Nidorino, {count: 1}, p))
  list.push(...addIf(P.Miltank, {count: 1}, p))

  // Hoenn
  list.push(...addIf(P.Ralts, {gate: CATCH_CHARM_GSC}, p))
  list.push(...addIf(P.Snorunt, {gate: CATCH_CHARM_GSC}, p))

  // Galar
  list.push(...addIf(P.Indeedee, {gate: CATCH_CHARM_SM}, p))

  return {
    shinyMultipler: 1,
    list,
    guaranteedItem: nop
  }
}

// Lure Ball
const ENCOUNTERS_BLUE_APRICORN = (user, _, location, format: EncounterParamFormat = 'List') => {
  const p = {user: user as Users.Doc, location, format}

  const list: BadgeId[] = []
  list.push(...addIf(P.Goldeen, {count: 1}, p))
  list.push(...addIf(P.Magikarp, {count: 1}, p))
  list.push(...addIf(P.Totodile, {count: 1}, p))
  list.push(...addIf(P.Chinchou, {count: 1}, p))
  list.push(...addIf(P.Qwilfish, {count: 1}, p))
  list.push(...addIf(P.Corsola, {count: 1}, p))
  list.push(...addIf(P.Corsola, {count: 20, event: 'EARTH_DAY'}, p))
  list.push(...addIf(P.Remoraid, {count: 1}, p))
  list.push(...addIf(P.Mantine, {count: 1}, p))

  // Hoenn
  list.push(...addIf(P.Luvdisc, {gate: CATCH_CHARM_GSC}, p))
  list.push(...addIf(P.Luvdisc, {count: 20, event: 'VALENTINES_DAY'}, p))

  list.push(...addIf(P.Arrokuda, {gate: CATCH_CHARM_SM}, p))

  return {
    shinyMultipler: 1,
    list,
    guaranteedItem: nop
  }
}

// Moon Ball
const ENCOUNTERS_YELLOW_APRICORN = (user, _, location, format: EncounterParamFormat = 'List') => {
  const p = {user: user as Users.Doc, location, format}

  const list: BadgeId[] = []
  list.push(...addIf(P.Eevee, {count: 1}, p))
  list.push(...addIf(P.Nidorina, {count: 1}, p))
  list.push(...addIf(P.Nidorino, {count: 1}, p))
  list.push(...addIf(P.Clefairy, {count: 1}, p))
  list.push(...addIf(P.Jigglypuff, {count: 1}, p))
  list.push(...addIf(P.Murkrow, {count: 1}, p))
  list.push(...addIf(P.Sneasel, {count: 1}, p))
  list.push(...addIf(P.Houndour, {count: 1}, p))

  // Hoenn
  list.push(...addIf(P.Skitty, {gate: CATCH_CHARM_GSC}, p))
  list.push(...addIf(P.Hatenna, {gate: CATCH_CHARM_SM, terrain: 'Forest'}, p)) // There is no 'Heal Ball'
  list.push(...addIf(P.Impidimp, {gate: CATCH_CHARM_SM, terrain: 'Forest'}, p))

  return {
    shinyMultipler: 1,
    list,
    guaranteedItem: nop
  }
}

// Sport Ball
const ENCOUNTERS_BUG_CATCHING = (user, _, location: Location, format: EncounterParamFormat = 'List') => {
  const p = {user: user as Users.Doc, location, format}

  const list: BadgeId[] = []
  list.push(...addIf(P.Caterpie, {count: 2}, p))
  list.push(...addIf(P.Metapod, {count: 2}, p))
  list.push(...addIf(P.Butterfree, {count: 1}, p))
  list.push(...addIf(P.Weedle, {count: 2}, p))
  list.push(...addIf(P.Kakuna, {count: 2}, p))
  list.push(...addIf(P.Beedrill, {count: 1}, p))
  list.push(...addIf(P.Paras, {count: 2}, p))
  list.push(...addIf(P.Venonat, {count: 2}, p))
  list.push(...addIf(P.Scyther, {count: 1}, p))
  list.push(...addIf(P.Pinsir, {count: 1}, p))
  list.push(...addIf(P.Ledyba, {count: 2, time: 'Day'}, p))
  list.push(...addIf(P.Ledian, {count: 2, time: 'Day'}, p))
  list.push(...addIf(P.Spinarak, {count: 2, time: 'Night'}, p))
  list.push(...addIf(P.Ariados, {count: 1, time: 'Night'}, p))
  list.push(...addIf(P.Pineco, {count: 2}, p))

  list.push(...addIf(P.Scyther, {event: 'BUG_CATCHING', count: 5}, p))
  list.push(...addIf(P.Pinsir, {event: 'BUG_CATCHING', count: 5}, p))
  list.push(...addIf(P.Yanma, {event: 'BUG_CATCHING', count: 3}, p))
  list.push(...addIf(P.Forretress, {terrain: 'Forest'}, p))
  list.push(...addIf(P.Forretress, {terrain: 'Rainforest'}, p))

  return {
    shinyMultipler: 1,
    list,
    guaranteedItem: (species, _, location, user) => {
      if (location.terrain === 'Rainforest' && species === P.Forretress) {
        return 'bigmushroom'
      }
      if (Events.BUG_CATCHING.isActive(user)) {
        if (species === P.Forretress) return 'bigmushroom'
        return 'tinymushroom'
      }
      return ''
    },
  }
}

const ENCOUNTERS_DIVE = (user, _, location, format: EncounterParamFormat = 'List') => {
  const p: EncounterParams = {user: user as Users.Doc, location, format}
  const list: BadgeId[] = []
  list.push(...addIf(P.Sharpedo, {count: 1}, p))
  list.push(...addIf(P.Relicanth, {count: 1}, p))
  list.push(...addIf(P.Lanturn, {count: 1}, p))
  list.push(...addIf(P.Corsola, {count: 1}, p))
  list.push(...addIf(P.Corsola, {count: 20, event: 'EARTH_DAY'}, p))
  list.push(...addIf(P.Horsea, {count: 1}, p))
  list.push(...addIf(P.Staryu, {count: 1}, p))
  list.push(...addIf(P.Clamperl, {count: 1}, p))
  list.push(...addIf(P.Luvdisc, {count: 1}, p))
  list.push(...addIf(P.Luvdisc, {count: 20, event: 'VALENTINES_DAY'}, p))
  list.push(...addIf(P.Cramorant, {gate: CATCH_CHARM_SM}, p))
  list.push(...addIf(Potw(P.Cramorant, {form: 'gorging'}), {gate: CATCH_CHARM_SM, event: 'THANKSGIVING'}, p))

  return {
    shinyMultipler: 1,
    list,
    guaranteedItem: (species) => {
      const p = Math.random()
      if (species === P.Clamperl) {
        if (p < 0.125) {
          return 'deepseatooth'
        } else if (p < 0.25) {
          return 'deepseascale'
        }
      } else {
        if (p < 0.05) {
          return 'pearl'
        } else if (p < 0.075) {
          return 'deepseatooth'
        } else if (p < 0.1) {
          return 'deepseascale'
        }
      }
      return ''
    }
  }
}

const ENCOUNTERS_LUXURY = (user, _, location, format: EncounterParamFormat = 'List') => {
  const p: EncounterParams = {user: user as Users.Doc, location, format}
  
  const list: BadgeId[] = []
  list.push(...addIf(P.Skitty, {count: 1}, p))
  list.push(...addIf(P.Chansey, {count: 1}, p))
  list.push(...addIf(P.Golbat, {count: 1}, p))
  list.push(...addIf(P.Jigglypuff, {count: 1}, p))
  list.push(...addIf(P.Eevee, {count: 2}, p))
  list.push(...addIf(P.Pikachu, {count: 1}, p))
  list.push(...addIf(P.Clefairy, {count: 1}, p))
  list.push(...addIf(P.Marill, {count: 1}, p))
  list.push(...addIf(P.Snom, {gate: CATCH_CHARM_SM, weather: 'Snow'}, p))

  return {
    shinyMultipler: 1,
    list,
    guaranteedItem: () => {
      const p = Math.random()
      if (p < 0.025) {
        return 'kelpsy'
      } else if (p < 0.075) {
        return 'pomeg'
      }
      return ''
    }
  }
}

const ENCOUNTERS_NEST = (user, _, location, format: EncounterParamFormat = 'List') => {
  const p: EncounterParams = {user: user as Users.Doc, location, format}

  const list: BadgeId[] = []
  list.push(...addIf(P.Caterpie, {count: 1}, p))
  list.push(...addIf(P.Weedle, {count: 1}, p))
  list.push(...addIf(P.Ledyba, {count: 1}, p))
  list.push(...addIf(P.Spinarak, {count: 1}, p))
  list.push(...addIf(P.Wooper, {count: 1}, p))
  list.push(...addIf(P.Mareep, {count: 1}, p))
  list.push(...addIf(P.Wurmple, {count: 1}, p))
  list.push(...addIf(P.Wooloo, {gate: CATCH_CHARM_SM, terrain: 'Grasslands'}, p))

  return {
    shinyMultipler: 1,
    list,
    guaranteedItem: () => {
      const p = Math.random()
      if (p < 0.04) {
        return 'oran'
      } else if (p < 0.05) {
        return 'sitrus'
      }
      return ''
    }
  }
}

const ENCOUNTERS_NET = (user, __, location: Location, format: EncounterParamFormat = 'List') => {
  const p = {user: user as Users.Doc, location, format}
  const list: BadgeId[] = []
  list.push(...addIf(P.Pineco, {count: 1}, p))
  list.push(...addIf(P.Silcoon, {count: 1}, p))
  list.push(...addIf(P.Cascoon, {count: 1}, p))
  list.push(...addIf(P.Slowpoke, {count: 1}, p))
  list.push(...addIf(P.Remoraid, {count: 1}, p))
  list.push(...addIf(P.Goldeen, {count: 1}, p))
  list.push(...addIf(P.Staryu, {count: 1}, p))
  list.push(...addIf(P.Surskit, {count: 1}, p))

  list.push(...addIf(P.Feebas, {other: location.feebas, count: 1}, p))
  list.push(...addIf(P.Blipbug, {gate: CATCH_CHARM_SM}, p))
  list.push(...addIf(P.Sizzlipede, {gate: CATCH_CHARM_SM, weather: 'Heat Wave'}, p))

  return {
    shinyMultipler: 1,
    list,
    guaranteedItem: (species) => {
      const p = Math.random()
      if (species === P.Feebas && p < 0.25) {
        return 'prismscale' // 25%
      }
      if (p < 0.025) {
        return 'mysticwater'
      } else if (p < 0.05) {
        return 'silverpowder'
      } else if (p < 0.075) {
        return 'prismscale'
      }
      return ''
    }
  }
}

const ENCOUNTERS_DUSK = (user, now: Date, location: Location, format: EncounterParamFormat = 'List') => {
  const p = {user: user as Users.Doc, location, format}

  const list: BadgeId[] = []
  list.push(...addIf(P.Zubat, {count: 1}, p))
  list.push(...addIf(P.Sneasel, {count: 1}, p))
  list.push(...addIf(P.Houndour, {count: 1}, p))
  list.push(...addIf(P.Gligar, {count: 1}, p))
  list.push(...addIf(P.Murkrow, {count: 1}, p))
  list.push(...addIf(P.Misdreavus, {count: 1}, p))

  // Hoenn
  list.push(...addIf(P.Duskull, {gate: CATCH_CHARM_GSC}, p))

  // Sinnoh
  list.push(...addIf(P.Kricketune, {gate: CATCH_CHARM_RSE, terrain: 'Grasslands'}, p))
  list.push(...addIf(P.Skuntank, {gate: CATCH_CHARM_RSE, weather: 'Fog'}, p))
  list.push(...addIf(P.Chingling, {gate: CATCH_CHARM_RSE, time: 'Night'}, p))
  list.push(...addIf(P.Spiritomb, {gate: CATCH_CHARM_RSE, region: 'Asia'}, p))
  
  // Galar
  list.push(...addIf(P.Rolycoly, {gate: CATCH_CHARM_SM, terrain: 'Mountain'}, p))

  return {
    shinyMultipler: 1.5,
    list,
    guaranteedItem: nop
  }
}

function ENCOUNTERS_QUICK(user, _, location, format: EncounterParamFormat = 'List'): Encounter {
  const p: EncounterParams = {user: user as Users.Doc, location, format}
  
  const list: BadgeId[] = []
  list.push(...addIf(P.Electabuzz, {count: 1}, p))
  list.push(...addIf(P.Magmar, {count: 1}, p))
  list.push(...addIf(P.Tangela, {count: 1}, p))
  list.push(...addIf(P.Yanma, {count: 1}, p))
  list.push(...addIf(P.Lickitung, {count: 1}, p))
  list.push(...addIf(P.Aipom, {count: 1}, p))
  list.push(...addIf(P.Gligar, {count: 1}, p))
  list.push(...addIf(P.Sneasel, {count: 1}, p))
  list.push(...addIf(P.Magneton, {count: 1}, p))
  list.push(...addIf(P.Rhyhorn, {count: 1}, p))
  list.push(...addIf(P.Porygon, {count: 1}, p))
  list.push(...addIf(P.Murkrow, {count: 1}, p))
  list.push(...addIf(P.Misdreavus, {count: 1}, p))
  list.push(...addIf(P.Nosepass, {gate: CATCH_CHARM_RSE, count: 1}, p))
  list.push(...addIf(P.Duskull, {gate: CATCH_CHARM_RSE, count: 1}, p))
  list.push(...addIf(P.Roselia, {gate: CATCH_CHARM_RSE, count: 1}, p))
  list.push(...addIf(P.Ralts, {gate: CATCH_CHARM_RSE, count: 1}, p))
  list.push(...addIf(P.Snorunt, {gate: CATCH_CHARM_RSE, count: 1}, p))
  list.push(...addIf(P.Nickit, {gate: CATCH_CHARM_SM}, p))

  return {
    list,
    shinyMultipler: 1.5,
    guaranteedItem: nop,
  }
}

const ENCOUNTERS_DREAM = (user: Users.Doc, now: Date, location: Location, format: EncounterParamFormat = 'List') => {
  const p: EncounterParams = {user: user as Users.Doc, location, format}

  const list: BadgeId[] = []
  list.push(...addIf(P.Munna, {count: 14}, p))
  list.push(...addIf(P.Musharna, {count: 1}, p))
  return {
    list,
    shinyMultipler: 2,
    guaranteedItem: nop,
  }
}

const ENCOUNTERS_BACKLOT = (user: Users.Doc, now: Date, location: Location, format: EncounterParamFormat = 'List') => {
  const p: EncounterParams = {user: user as Users.Doc, location, format}
  const day = new Date().getDate()
  // This largely works out to 2 a month
  // But Happiny is only once
  // Mime_Jr is only once every other month
  const extraList = [
    P.Clefairy,
    P.Jigglypuff,
    P.Meowth,
    P.Chansey,
    P.Ditto,
    P.Eevee,
    P.Cleffa,
    P.Igglybuff,
    P.Marill,
    P.Azurill,
    P.Plusle,
    P.Minun,
    P.Castform,
    P.Bonsly,
    P.Mime_Jr,
    P.Happiny,
  ] as BadgeId[]
  const pkmn = extraList[day % extraList.length]
  const list: BadgeId[] = []
  list.push(...addIf(P.Roselia, {count: 2}, p))
  list.push(...addIf(P.Pichu, {count: 2}, p))
  list.push(...addIf(P.Pikachu, {count: 2}, p))
  list.push(...addIf(P.Kricketot, {count: 2}, p))
  list.push(...addIf(P.Staravia, {count: 2}, p))
  for (const index in extraList) {
    const extraPokemon = extraList[index]
    list.push(...addIf(extraPokemon, {count: 3, other: extraPokemon === pkmn}, p))
  }
  return {
    list,
    shinyMultipler: 1.5,
    guaranteedItem: nop,
  }
}

const ENCOUNTER_FRIENDSAFARI = (user: Users.Doc, now: Date, location: Location, format: EncounterParamFormat = 'List', params: Record<string, string> = {}) => {
  const p: EncounterParams = {user: user as Users.Doc, location, format}

  const {friendSafari} = params
  const list: BadgeId[] = []

  for (const safari of friendSafari) {
    for (const pkmn of FriendSafariMap[safari]) {
      list.push(...addIf(pkmn, {count: 1}, p))
    }
  }

  return {
    list,
    shinyMultipler: 1.5,
    guaranteedItem: () => {
      const p = Math.random()
      if (p < 0.1) {
        return 'safariball'
      }
      return ''
    },
  }
}

const ENCOUNTERS_HIDDENGROTTO = (user: Users.Doc, now: Date, location: Location, format: EncounterParamFormat = 'List') => {
  const p: EncounterParams = {user: user as Users.Doc, location, format}
  const grottoCommon = [
    P.NidoranF,
    P.NidoranM,
    P.Venonat,
    P.Golduck,
    P.Muk,
    P.Kingler,
    P.Tangela,
    P.Dragonair,
    P.Dunsparce,
    P.Corsola,
    P.Lombre,
    P.Nosepass,
    P.Zangoose,
    P.Seviper,
    P.Spheal,
    P.Pachirisu,
    P.Skorupi,
    P.Chatot,
    P.Watchog,
    P.Zebstrika,
    P.Bibarel,
    P.Foongus,
    P.Liepard,
    P.Minccino,
    P.Woobat,
    P.Garbodor,
    P.Mienfoo,
    P.Bouffalant
  ] as BadgeId[]

  const grottoUncommon = [
    P.Eevee,
    P.Vaporeon,
    P.Jolteon,
    P.Flareon,
    P.Espeon,
    P.Umbreon,
    P.Stunky,
    P.Glameow,
    P.Glaceon,
    P.Leafeon,
  ] as BadgeId[]
  const list: BadgeId[] = []

  for (const badge of grottoCommon) {
    list.push(...addIf(badge, {count: 4}, p))
  }
  for (const badge of grottoUncommon) {
    list.push(...addIf(badge, {count: 1}, p))
  }

  list.push(...addIf(P.Absol, {count: 2, weather: 'Cloudy'}, p))
  list.push(...addIf(P.Granbull, {count: 2, weather: 'Fog'}, p))
  list.push(...addIf(P.Amoonguss, {count: 2, weather: 'Heat Wave'}, p))
  list.push(...addIf(P.Manectric, {count: 2, weather: 'Thunderstorm'}, p))
  list.push(...addIf(P.Gligar, {count: 2, weather: 'Sandstorm'}, p))
  list.push(...addIf(P.Pelipper, {count: 2, weather: 'Rain'}, p))
  list.push(...addIf(P.Drifloon, {count: 2, weather: 'Windy'}, p))
  list.push(...addIf(P.Cubchoo, {count: 2, weather: 'Diamond Dust'}, p))
  list.push(...addIf(P.Cubchoo, {count: 2, weather: 'Snow'}, p))

  /**
   * Forest: Pinwheel Forest
   * Mountain: Giant Chasm
   * Gardens: Abundant Shrine
   * Rainforest: Lostlorn Forest
   * Rural: Floccesy Ranch
   */
  list.push(...addIf(P.Butterfree, {count: 2, terrain: 'Forest', item: ['lightstone']}, p))
  list.push(...addIf(P.Beedrill, {count: 2, terrain: 'Forest', item: ['darkstone']}, p))
  list.push(...addIf(P.Clefairy, {count: 3, terrain: 'Mountain'}, p))
  list.push(...addIf(P.Vulpix, {count: 1, terrain: 'Gardens'}, p))
  list.push(...addIf(P.Golduck, {count: 2, terrain: 'Gardens'}, p))
  list.push(...addIf(P.Poliwhirl, {count: 1, terrain: 'Forest'}, p))
  list.push(...addIf(P.Pinsir, {count: 1, terrain: 'Rainforest'}, p))
  list.push(...addIf(P.Ditto, {count: 1, terrain: 'Mountain'}, p))
  list.push(...addIf(P.Marill, {count: 3, terrain: 'Rural'}, p))
  list.push(...addIf(P.Murkrow, {count: 1, terrain: 'Forest'}, p))
  list.push(...addIf(P.Dunsparce, {count: 1, terrain: 'Rural'}, p))
  list.push(...addIf(P.Heracross, {count: 1, terrain: 'Rainforest'}, p))
  list.push(...addIf(P.Sneasel, {count: 1, terrain: 'Mountain'}, p))
  list.push(...addIf(P.Breloom, {count: 2, terrain: 'Forest'}, p))
  list.push(...addIf(P.Hariyama, {count: 3, terrain: 'Forest', item: ['darkstone']}, p))
  list.push(...addIf(P.Medicham, {count: 3, terrain: 'Forest', item: ['lightstone']}, p))
  list.push(...addIf(P.Swablu, {count: 1, terrain: 'Gardens'}, p))
  list.push(...addIf(P.Bagon, {count: 1, terrain: 'Forest'}, p))
  list.push(...addIf(P.Metang, {count: 1, terrain: 'Mountain'}, p))
  list.push(...addIf(P.Combee, {count: 3, terrain: 'Rainforest'}, p))
  list.push(...addIf(P.Bronzor, {count: 2, terrain: 'Gardens'}, p))
  list.push(...addIf(P.Herdier, {count: 2, terrain: 'Rural'}, p))
  list.push(...addIf(P.Leavanny, {count: 2, terrain: 'Rainforest'}, p))
  list.push(...addIf(P.Amoonguss, {count: 3, terrain: 'Forest'}, p))
  list.push(...addIf(P.Amoonguss, {count: 3, terrain: 'Gardens'}, p))

  return {
    list,
    shinyMultipler: 1.5,
    guaranteedItem: () => {
      const p = Math.random()
      if (p < 0.1) {
        // Rare item (10%)
        const items: ItemId[] = [
          'firestone', 'thunderstone', 'waterstone', 'leafstone',
          'bigmushroom', 'redshard', 'blueshard', 'yellowshard', 'greenshard',
          'expcandym', 'expcandyl', 'dawnstone', 'duskstone', 'shinystone',
          'moonstone', 'sunstone',
        ]
        return randomItem(items)
      } else if (p < 0.35) {
        // Somewhat more common item (25%)
        const items: ItemId[] = [
          'pokeball', 'greatball', 'growthmulch', 'dampmulch', 'stablemulch',
          'gooeymulch', 'tinymushroom', 'expcandys',
        ]
        return randomItem(items)
      }
      return ''
    },
  }
}

const ENCOUNTERS_ADRENALINE = (user: Users.Doc, now: Date, location: Location, format: EncounterParamFormat = 'List') => {
  const p: EncounterParams = {user: user as Users.Doc, location, format}
  const sosCommon = [
    P.Baltoy,
    P.Happiny,
    P.Pawniard,
    P.Mareanie,
  ] as BadgeId[]

  const sosUncommon = [
    P.Pikachu,
    P.Jigglypuff,
    P.Seaking,
    P.Dragonair,
    P.Noctowl,
    P.Lanturn,
    P.Xatu,
    P.Sudowoodo,
    P.Octillery,
    P.Sableye,
    P.Sharpedo,
    P.Whiscash,
    P.Crawdaunt,
    P.Ambipom,
    P.Lopunny,
    P.Fletchinder,
    P.Pangoro,
    P.Toucannon,
  ] as BadgeId[]
  const list: BadgeId[] = []

  const sosRare = [
    P.Jynx,
    P.Electabuzz,
    P.Magmar,
    P.Snorlax,
    P.Dragonite,
    P.Crobat,
    P.Espeon,
    P.Umbreon,
    P.Salamence,
    P.Lucario,
    P.Larvesta,
    P.Salazzle,
    P.Hakamo_o,
    P.Kommo_o,
  ] as BadgeId[]

  for (const badge of sosCommon) {
    list.push(...addIf(badge, {count: 9}, p))
  }
  for (const badge of sosUncommon) {
    list.push(...addIf(badge, {count: 5}, p))
  }
  for (const badge of sosRare) {
    list.push(...addIf(badge, {count: 1}, p))
  }

  // Malie Garden
  list.push(...addIf(Potw(P.Persian, {form: 'alolan'}), {count: 1, terrain: 'Gardens'}, p))
  list.push(...addIf(P.Slowbro, {count: 5, terrain: 'Bay'}, p))
  list.push(...addIf(P.Poliwhirl, {count: 5, weather: 'Rain'}, p))
  list.push(...addIf(P.Poliwrath, {count: 1, weather: 'Rain'}, p))
  list.push(...addIf(P.Gengar, {count: 1, time: 'Night'}, p))
  // Hano Beach
  list.push(...addIf(P.Starmie, {count: 1, terrain: 'Beach'}, p))
  // Hau'oli City
  list.push(...addIf(P.Mr_Mime, {count: 1, terrain: 'Urban'}, p))
  list.push(...addIf(P.Politoed, {count: 1, weather: 'Rain'}, p))
  // Kala'e Bay
  list.push(...addIf(P.Slowking, {count: 1, terrain: 'Bay'}, p))
  // Poni Plains
  list.push(...addIf(P.Blissey, {count: 1, terrain: 'Grasslands'}, p))
  // Melemele Sea
  list.push(...addIf(P.Huntail, {count: 1, terrain: 'Oceanic'}, p))
  list.push(...addIf(P.Gorebyss, {count: 1, terrain: 'Oceanic'}, p))
  list.push(...addIf(P.Shelgon, {count: 5, terrain: 'Bay'}, p))
  list.push(...addIf(P.Gabite, {count: 1, weather: 'Sandstorm'}, p))
  list.push(...addIf(P.Vanillite, {count: 9, weather: 'Snow'}, p))
  list.push(...addIf(P.Vanillish, {count: 5, weather: 'Snow'}, p))
  list.push(...addIf(P.Goomy, {count: 9, weather: 'Rain'}, p))
  list.push(...addIf(P.Sliggoo, {count: 5, weather: 'Rain'}, p))
  list.push(...addIf(Potw(P.Castform, {form: 'sunny'}), {count: 7, weather: 'Heat Wave'}, p))
  list.push(...addIf(Potw(P.Castform, {form: 'rainy'}), {count: 7, weather: 'Rain'}, p))
  list.push(...addIf(Potw(P.Castform, {form: 'snowy'}), {count: 7, weather: 'Snow'}, p))

  // Add titans as quite rare encounters
  list.push(...addIf(Potw(P.Gumshoos, {form: 'totem'}), {count: 1, item: ['znormalium'], time: 'Day'}, p))
  list.push(...addIf(Potw(P.Raticate, {form: 'totem'}), {count: 1, item: ['zdarkinium'], time: 'Night'}, p))
  list.push(...addIf(Potw(P.Marowak, {form: 'totem'}), {count: 1, item: ['zfirium']}, p))
  list.push(...addIf(Potw(P.Araquanid, {form: 'totem'}), {count: 1, item: ['zwaterium']}, p))
  list.push(...addIf(Potw(P.Lurantis, {form: 'totem'}), {count: 1, item: ['zgrassium']}, p))
  list.push(...addIf(Potw(P.Salazzle, {form: 'totem'}), {count: 1, item: ['zfirium']}, p))
  list.push(...addIf(Potw(P.Vikavolt, {form: 'totem'}), {count: 1, item: ['zelectrium']}, p))
  list.push(...addIf(Potw(P.Togedemaru, {form: 'totem'}), {count: 1, item: ['zelectrium']}, p))
  list.push(...addIf(Potw(P.Mimikyu, {form: 'totem'}), {count: 1, item: ['zghostium']}, p))
  list.push(...addIf(Potw(P.Ribombee, {form: 'totem'}), {count: 1, item: ['zfairium']}, p))
  list.push(...addIf(Potw(P.Kommo_o, {form: 'totem'}), {count: 1, item: ['zdragonium']}, p))

  return {
    list,
    shinyMultipler: 2,
    guaranteedItem: () => {
      const p = Math.random()
      if (p < 0.11) {
        // Rare item (11%)
        const items: ItemId[] = [
          'abilitycapsule', 'icestone',
        ]
        return randomItem(items)
      }
      if (p < 0.31) {
        // Other Alolan item
        const items: ItemId[] = [
          'electricseed', 'grassyseed', 'mistyseed', 'psychicseed',
          'pinknectar', 'yellownectar', 'rednectar', 'purplenectar',
          'bigmalasada',
        ]
        return randomItem(items)
      }
      return ''
    },
  }
}

const ENCOUNTERS_WILDAREA = (user: Users.Doc, now: Date, location: Location, format: EncounterParamFormat = 'List') => {
  const p: EncounterParams = {user: user as Users.Doc, location, format}
  const list: BadgeId[] = []

  // https://serebii.net/swordshield/wildarea.shtml
  // Generally: 5 is common, 3 is uncommon/stone evos, 1 is rare/trade evos
  list.push(...addIf(P.Pikachu, {count: 5}, p))
  list.push(...addIf(P.Clefable, {count: 3, weather: 'Fog'}, p))
  list.push(...addIf(P.Vileplume, {count: 3, time: 'Night', weather: 'Heat Wave'}, p))
  list.push(...addIf(P.Machoke, {count: 5, weather: 'Cloudy'}, p))
  list.push(...addIf(P.Machamp, {count: 1, weather: 'Cloudy'}, p))

  list.push(...addIf(P.Cloyster, {count: 3, terrain: 'Oceanic'}, p))
  list.push(...addIf(P.Haunter, {count: 3, time: 'Night'}, p))
  list.push(...addIf(P.Gengar, {count: 1, time: 'Night', weather: 'Fog'}, p))
  list.push(...addIf(P.Onix, {count: 5}, p))
  list.push(...addIf(P.Kingler, {count: 3, terrain: 'Beach'}, p))
  
  list.push(...addIf(Potw(P.Weezing, {form: 'galarian'}), {count: 3, weather: 'Fog', region: 'North Europe'}, p))
  list.push(...addIf(P.Rhydon, {count: 3, weather: 'Sandstorm'}, p))
  list.push(...addIf(P.Seaking, {count: 5, terrain: 'Bay'}, p))
  list.push(...addIf(P.Gyarados, {count: 3, terrain: 'Oceanic', weather: 'Thunderstorm'}, p))
  list.push(...addIf(P.Lapras, {count: 3, terrain: 'Oceanic', weather: 'Snow'}, p))

  list.push(...addIf(P.Vaporeon, {count: 3, weather: 'Rain'}, p))
  list.push(...addIf(P.Jolteon, {count: 3, weather: 'Thunderstorm'}, p))
  list.push(...addIf(P.Flareon, {count: 3, weather: 'Heat Wave'}, p))
  list.push(...addIf(P.Snorlax, {count: 3, time: 'Day'}, p))
  list.push(...addIf(P.Noctowl, {count: 3, time: 'Night', weather: 'Windy'}, p))

  list.push(...addIf(P.Lanturn, {count: 3, weather: 'Thunderstorm', terrain: 'Bay'}, p))
  list.push(...addIf(P.Xatu, {count: 3, weather: 'Windy'}, p))
  list.push(...addIf(P.Bellossom, {count: 3, time: 'Day', weather: 'Heat Wave'}, p))
  list.push(...addIf(P.Sudowoodo, {count: 3, weather: 'Sandstorm'}, p))
  list.push(...addIf(P.Quagsire, {count: 5, weather: 'Rain'}, p))

  list.push(...addIf(P.Espeon, {count: 3, weather: 'Cloudy', time: 'Day'}, p))
  list.push(...addIf(P.Umbreon, {count: 3, weather: 'Cloudy', time: 'Night'}, p))
  list.push(...addIf(P.Steelix, {count: 1, weather: 'Sandstorm', terrain: 'Desert'}, p))
  list.push(...addIf(P.Shuckle, {count: 3, terrain: 'Desert'}, p))
  list.push(...addIf(P.Piloswine, {count: 3, weather: 'Snow'}, p))

  list.push(...addIf(P.Octillery, {count: 3, terrain: 'Bay'}, p))
  list.push(...addIf(P.Tyranitar, {count: 3, weather: 'Sandstorm', terrain: 'Desert'}, p))
  list.push(...addIf(Potw(P.Linoone, {form: 'galarian'}), {count: 3, time: 'Night'}, p))
  list.push(...addIf(P.Ludicolo, {count: 3, weather: 'Rain'}, p))
  list.push(...addIf(P.Shiftry, {count: 3, weather: 'Heat Wave'}, p))

  list.push(...addIf(P.Pelipper, {count: 5, weather: 'Rain', terrain: 'Beach'}, p))
  list.push(...addIf(P.Kirlia, {count: 5, weather: 'Fog'}, p))
  list.push(...addIf(P.Gardevoir, {count: 3, weather: 'Fog'}, p))
  list.push(...addIf(P.Ninjask, {count: 3, terrain: 'Desert'}, p))
  list.push(...addIf(P.Manectric, {count: 3, terrain: 'Grasslands', weather: 'Thunderstorm'}, p))

  list.push(...addIf(P.Roselia, {count: 5, terrain: 'Gardens', weather: 'Sunny'}, p))
  list.push(...addIf(P.Wailmer, {count: 5, terrain: 'Oceanic', weather: 'Rain'}, p))
  list.push(...addIf(P.Flygon, {count: 3, terrain: 'Desert', weather: 'Sandstorm'}, p))
  list.push(...addIf(P.Whiscash, {count: 3, terrain: 'Bay', weather: 'Sandstorm'}, p))
  list.push(...addIf(P.Crawdaunt, {count: 3, terrain: 'Bay', weather: 'Rain', time: 'Night'}, p))

  list.push(...addIf(P.Claydol, {count: 3, terrain: 'Desert'}, p))
  list.push(...addIf(P.Milotic, {count: 1, terrain: 'Oceanic'}, p))
  list.push(...addIf(P.Dusclops, {count: 3, terrain: 'Rural', time: 'Night'}, p))
  list.push(...addIf(P.Glalie, {count: 3, terrain: 'Rural', weather: 'Snow'}, p))
  list.push(...addIf(P.Roserade, {count: 3, terrain: 'Gardens', weather: 'Sunny'}, p))

  list.push(...addIf(P.Vespiquen, {count: 3, terrain: 'Gardens', weather: 'Cloudy'}, p))
  list.push(...addIf(P.Gastrodon, {count: 3, terrain: 'Bay', weather: 'Rain'}, p))
  list.push(...addIf(P.Drifblim, {count: 3, weather: 'Windy', time: 'Night'}, p))
  list.push(...addIf(P.Skuntank, {count: 3, weather: 'Fog', time: 'Night'}, p))
  list.push(...addIf(P.Bronzong, {count: 3, weather: 'Fog', time: 'Day'}, p))

  list.push(...addIf(P.Mime_Jr, {count: 5, weather: 'Fog', time: 'Day'}, p))
  list.push(...addIf(P.Lucario, {count: 3, weather: 'Cloudy', terrain: 'Rural'}, p))
  list.push(...addIf(P.Drapion, {count: 3, time: 'Night', terrain: 'Rural'}, p))
  list.push(...addIf(P.Abomasnow, {count: 3, weather: 'Snow', terrain: 'Mountain'}, p))
  list.push(...addIf(P.Weavile, {count: 3, weather: 'Snow', terrain: 'Mountain'}, p))

  list.push(...addIf(P.Leafeon, {count: 3, other: p.location.mossyRock === true}, p))
  list.push(...addIf(P.Glaceon, {count: 3, other: p.location.icyRock === true}, p))
  list.push(...addIf(P.Gallade, {count: 3, terrain: 'Rural', weather: 'Fog'}, p))
  list.push(...addIf(P.Dusknoir, {count: 1, terrain: 'Rural', weather: 'Fog', time: 'Night'}, p))
  list.push(...addIf(P.Liepard, {count: 5, terrain: 'Rural', time: 'Night'}, p))

  list.push(...addIf(P.Musharna, {count: 3, terrain: 'Urban', time: 'Night'}, p))
  list.push(...addIf(P.Unfezant, {count: 3, terrain: 'Grasslands', time: 'Day'}, p))
  list.push(...addIf(P.Gigalith, {count: 1, terrain: 'Grasslands', weather: 'Sandstorm'}, p))
  list.push(...addIf(P.Excadrill, {count: 3, terrain: 'Grasslands', weather: 'Sandstorm'}, p))
  list.push(...addIf(P.Conkeldurr, {count: 1, terrain: 'Urban', weather: 'Cloudy'}, p))

  list.push(...addIf(P.Palpitoad, {count: 5, terrain: 'Bay', weather: 'Rain'}, p))
  list.push(...addIf(P.Seismitoad, {count: 3, terrain: 'Bay', weather: 'Rain'}, p))
  list.push(...addIf(P.Crustle, {count: 3, terrain: 'Beach', time: 'Night'}, p))
  list.push(...addIf(P.Sigilyph, {count: 3, terrain: 'Rural', time: 'Night'}, p))
  list.push(...addIf(P.Garbodor, {count: 3, terrain: 'Urban', time: 'Night'}, p))

  list.push(...addIf(P.Cinccino, {count: 3, terrain: 'Urban', time: 'Day', weather: 'Sunny'}, p))
  list.push(...addIf(P.Vanillish, {count: 5, terrain: 'Urban', weather: 'Snow'}, p))
  list.push(...addIf(P.Vanilluxe, {count: 3, terrain: 'Urban', weather: 'Snow'}, p))
  list.push(...addIf(P.Jellicent, {count: 3, terrain: 'Oceanic', weather: 'Fog'}, p))
  list.push(...addIf(P.Galvantula, {count: 3, terrain: 'Forest', weather: 'Thunderstorm'}, p))
  
  list.push(...addIf(P.Ferrothorn, {count: 3, terrain: 'Desert', weather: 'Thunderstorm'}, p))
  list.push(...addIf(P.Klang, {count: 5, terrain: 'Urban', weather: 'Thunderstorm'}, p))
  list.push(...addIf(P.Klinklang, {count: 3, terrain: 'Urban', weather: 'Thunderstorm'}, p))
  list.push(...addIf(P.Beheeyem, {count: 3, terrain: 'Rural', time: 'Night'}, p))
  list.push(...addIf(P.Chandelure, {count: 3, weather: 'Heat Wave', time: 'Night'}, p))

  list.push(...addIf(P.Haxorus, {count: 3, weather: 'Cloudy'}, p))
  list.push(...addIf(P.Beartic, {count: 3, weather: 'Snow', terrain: 'Mountain'}, p))
  list.push(...addIf(P.Golurk, {count: 3, time: 'Night', terrain: 'Rural'}, p))
  list.push(...addIf(P.Bisharp, {count: 3, time: 'Night', terrain: 'Urban'}, p))
  list.push(...addIf(P.Diggersby, {count: 3, weather: 'Sandstorm', terrain: 'Grasslands'}, p))

  list.push(...addIf(P.Pangoro, {count: 3, weather: 'Cloudy', terrain: 'Forest'}, p))
  list.push(...addIf(P.Doublade, {count: 3, weather: 'Fog', terrain: 'Urban'}, p))
  list.push(...addIf(P.Aegislash, {count: 1, weather: 'Fog', terrain: 'Urban'}, p))
  list.push(...addIf(P.Barbaracle, {count: 3, weather: 'Rain', terrain: 'Bay'}, p))
  list.push(...addIf(P.Sylveon, {count: 3, weather: 'Fog'}, p))

  list.push(...addIf(P.Hawlucha, {count: 3, weather: 'Cloudy', region: 'North America'}, p))
  list.push(...addIf(P.Gourgeist, {count: 1, weather: 'Heat Wave', terrain: 'Grasslands'}, p))
  list.push(...addIf(P.Avalugg, {count: 3, weather: 'Snow', terrain: 'Mountain'}, p))
  list.push(...addIf(P.Noivern, {count: 3, weather: 'Windy', time: 'Night'}, p))
  list.push(...addIf(P.Vikavolt, {count: 3, weather: 'Thunderstorm', other: p.location.magneticField === true}, p))

  list.push(...addIf(P.Ribombee, {count: 3, terrain: 'Gardens', time: 'Day'}, p))
  list.push(...addIf(P.Mudsdale, {count: 3, terrain: 'Grasslands'}, p))
  list.push(...addIf(P.Araquanid, {count: 3, weather: 'Rain', terrain: 'Bay'}, p))
  list.push(...addIf(P.Shiinotic, {count: 3, weather: 'Cloudy', time: 'Night'}, p))
  list.push(...addIf(P.Bewear, {count: 3, weather: 'Cloudy', time: 'Day', terrain: 'Forest'}, p))
  
  list.push(...addIf(P.Tsareena, {count: 3, weather: 'Heat Wave', terrain: 'Tropical'}, p))
  list.push(...addIf(P.Golisopod, {count: 3, terrain: 'Beach'}, p))
  list.push(...addIf(P.Mimikyu, {count: 3, weather: 'Cloudy', time: 'Night', terrain: 'Forest'}, p))
  list.push(...addIf(P.Kommo_o, {count: 3, weather: 'Cloudy', terrain: 'Tropical'}, p))
  list.push(...addIf(P.Greedent, {count: 3, time: 'Day', terrain: 'Forest'}, p))

  list.push(...addIf(P.Corviknight, {count: 3, time: 'Night', terrain: 'Forest'}, p))
  list.push(...addIf(P.Orbeetle, {count: 3, weather: 'Fog', terrain: 'Forest'}, p))
  list.push(...addIf(P.Thievul, {count: 3, time: 'Night', terrain: 'Grasslands'}, p))
  list.push(...addIf(P.Eldegoss, {count: 3, weather: 'Sunny', terrain: 'Gardens'}, p))
  list.push(...addIf(P.Dubwool, {count: 3, time: 'Day', terrain: 'Grasslands'}, p))

  list.push(...addIf(P.Drednaw, {count: 3, weather: 'Sandstorm', terrain: 'Bay'}, p))
  list.push(...addIf(P.Boltund, {count: 3, weather: 'Thunderstorm', terrain: 'Bay'}, p))
  list.push(...addIf(P.Coalossal, {count: 3, weather: 'Heat Wave', terrain: 'Desert'}, p))
  list.push(...addIf(P.Sandaconda, {count: 3, weather: 'Sandstorm', terrain: 'Desert'}, p))
  list.push(...addIf(P.Cramorant, {count: 3, weather: 'Rain', terrain: 'Bay'}, p))
  list.push(...addIf(Potw(P.Cramorant, {form: 'gorging'}), {count: 3, event: 'THANKSGIVING'}, p))

  list.push(...addIf(P.Grapploct, {count: 3, weather: 'Cloudy', terrain: 'Beach'}, p))
  list.push(...addIf(P.Hatterene, {count: 3, weather: 'Fog', terrain: 'Forest', time: 'Day'}, p))
  list.push(...addIf(P.Grimmsnarl, {count: 3, weather: 'Fog', terrain: 'Forest', time: 'Night'}, p))
  list.push(...addIf(P.Obstagoon, {count: 3, weather: 'Cloudy', terrain: 'Urban', time: 'Night'}, p))
  list.push(...addIf(P.Perrserker, {count: 3, weather: 'Thunderstorm', terrain: 'Urban'}, p))

  list.push(...addIf(P.Copperajah, {count: 3, weather: 'Thunderstorm', terrain: 'Mountain'}, p))
  list.push(...addIf(P.Duraludon, {count: 3, weather: 'Thunderstorm', terrain: 'Rural'}, p))

  return {
    list,
    shinyMultipler: 3,
    guaranteedItem: () => {
      const p = Math.random()
      if (p < 0.01) {
        return 'stardust'
      } else if (p < 0.03) {
        return 'starpiece'
      } else if (p < 0.35) {
        return randomItem([
          'sausages', 'bobsfoodtin', 'bachsfoodtin', 'tinofbeans', 'bread',
          'pasta', 'mixedmushrooms', 'smokepoketail', 'largeleek', 'fancyapple',
          'brittlebones', 'packofpotatoes', 'pungentroot', 'saladmix',
          'friedfood', 'boiledegg', 'fruitbunch', 'moomoocheese', 'spicemix',
          'freshcream', 'packagedcurry', 'coconutmilk', 'instantnoodles',
          'precookedburger',
        ])
      }
      return ''
    },
  }
}


const ENCOUNTERS_FEATHERBALL = (user: Users.Doc, now: Date, location: Location, format: EncounterParamFormat = 'List') => {
  const p: EncounterParams = {user: user as Users.Doc, location, format}
  const list: BadgeId[] = []
  list.push(...addIf(P.Starly, {count: 2}, p))
  list.push(...addIf(P.Zubat, {count: 2}, p))

  list.push(...addIf(P.Magikarp, {count: 2}, p))
  list.push(...addIf(P.Mantyke, {count: 2}, p))
  return {
    list,
    shinyMultipler: 3,
    guaranteedItem: () => {
      const p = Math.random()
      if (p < 0.01) {
        return 'stardust'
      } else if (p < 0.1) {
        return 'skytumblestone'
      } else if (p < 0.15) {
        return 'apricorn'
      }
      return ''
    },
  }
}

const ENCOUNTERS_WINGBALL = (user: Users.Doc, now: Date, location: Location, format: EncounterParamFormat = 'List') => {
  const p: EncounterParams = {user: user as Users.Doc, location, format}
  const list: BadgeId[] = []
  list.push(...addIf(P.Magneton, {count: 2}, p))
  list.push(...addIf(P.Murkrow, {count: 2}, p))
  list.push(...addIf(P.Staravia, {count: 2}, p))
  list.push(...addIf(P.Golbat, {count: 2}, p))

  list.push(...addIf(P.Barboach, {count: 2}, p))
  list.push(...addIf(P.Finneon, {count: 2}, p))
  list.push(...addIf(P.Tentacool, {count: 2}, p))
  return {
    list,
    shinyMultipler: 3,
    guaranteedItem: () => {
      const p = Math.random()
      if (p < 0.01) {
        return 'shinystone'
      } if (p < 0.1) {
        return 'skytumblestone'
      } else if (p < 0.15) {
        return 'apricorn'
      }
      return ''
    },
  }
}

const ENCOUNTERS_JETBALL = (user: Users.Doc, now: Date, location: Location, format: EncounterParamFormat = 'List') => {
  const p: EncounterParams = {user: user as Users.Doc, location, format}
  const list: BadgeId[] = []
  list.push(...addIf(P.Gyarados, {count: 2}, p))
  list.push(...addIf(P.Crobat, {count: 2}, p))
  list.push(...addIf(P.Staraptor, {count: 2}, p))
  list.push(...addIf(P.Honchkrow, {count: 2}, p))
  list.push(...addIf(P.Magnezone, {count: 2}, p))
  list.push(...addIf(P.Togekiss, {count: 2}, p))

  list.push(...addIf(P.Whiscash, {count: 2}, p))
  list.push(...addIf(P.Mantine, {count: 2}, p))
  list.push(...addIf(P.Tentacruel, {count: 2}, p))
  return {
    list,
    shinyMultipler: 3,
    guaranteedItem: () => {
      const p = Math.random()
      if (p < 0.01) {
        return 'dawnstone'
      } else if (p < 0.1) {
        return 'skytumblestone'
      } else if (p < 0.15) {
        return 'apricorn'
      }
      return ''
    },
  }
}

const ENCOUNTERS_LEADENBALL = (user: Users.Doc, now: Date, location: Location, format: EncounterParamFormat = 'List') => {
  const p: EncounterParams = {user: user as Users.Doc, location, format}
  const list: BadgeId[] = []
  list.push(...addIf(P.Geodude, {count: 2}, p))
  list.push(...addIf(P.Nosepass, {count: 2}, p))
  list.push(...addIf(P.Snorunt, {count: 2}, p))
  list.push(...addIf(P.Bronzor, {count: 2}, p))
  list.push(...addIf(P.Bonsly, {count: 2}, p))
  list.push(...addIf(P.Gible, {count: 2}, p))
  list.push(...addIf(P.Bergmite, {count: 2}, p))
  
  list.push(...addIf(P.Aipom, {count: 2}, p))
  list.push(...addIf(Potw(P.Burmy, {form: 'plant'}), {count: 2}, p))
  list.push(...addIf(Potw(P.Burmy, {form: 'sandy'}), {count: 2}, p))
  list.push(...addIf(Potw(P.Burmy, {form: 'trash'}), {count: 2}, p))
  list.push(...addIf(P.Combee, {count: 2}, p))
  list.push(...addIf(P.Cherubi, {count: 2}, p))
  list.push(...addIf(P.Pachirisu, {count: 2}, p))
  return {
    list,
    shinyMultipler: 3,
    guaranteedItem: () => {
      const p = Math.random()
      if (p < 0.01) {
        return 'stardust'
      } else if (p < 0.1) {
        return 'blacktumblestone'
      } else if (p < 0.15) {
        return 'apricorn'
      }
      return ''
    },
  }
}

const ENCOUNTERS_GIGATONBALL = (user: Users.Doc, now: Date, location: Location, format: EncounterParamFormat = 'List') => {
  const p: EncounterParams = {user: user as Users.Doc, location, format}
  const list: BadgeId[] = []
  list.push(...addIf(P.Graveler, {count: 2}, p))
  list.push(...addIf(P.Glalie, {count: 2}, p))
  list.push(...addIf(P.Bronzong, {count: 2}, p))
  list.push(...addIf(P.Garchomp, {count: 2}, p))

  list.push(...addIf(P.Heracross, {count: 2}, p))
  list.push(...addIf(P.Wormadam_Plant, {count: 2}, p))
  list.push(...addIf(P.Wormadam_Sandy, {count: 2}, p))
  list.push(...addIf(P.Wormadam_Trash, {count: 2}, p))
  list.push(...addIf(P.Cherrim, {count: 2}, p))
  return {
    list,
    shinyMultipler: 3,
    guaranteedItem: () => {
      const p = Math.random()
      if (p < 0.01) {
        return 'blackaugurite'
      } else if (p < 0.1) {
        return 'blacktumblestone'
      } else if (p < 0.15) {
        return 'apricorn'
      }
      return ''
    },
  }
}

const ENCOUNTERS_BEASTBALL = (user: Users.Doc, now: Date, location: Location, format: EncounterParamFormat = 'List') => {
  const p: EncounterParams = {user: user as Users.Doc, location, format}
  const list: BadgeId[] = []
  const nihilegoCondition = hasPokemonFuzzy(user, Pokemon(I.Nihilego))
  list.push(...addIf(P.Nihilego, {other: nihilegoCondition}, p))

  const xurkitreeCondition = hasPokemonFuzzy(user, Pokemon(I.Xurkitree))
  list.push(...addIf(P.Xurkitree, {other: xurkitreeCondition}, p))

  const pheramosaCondition = hasPokemonFuzzy(user, Pokemon(I.Pheromosa))
  list.push(...addIf(P.Pheromosa, {other: pheramosaCondition}, p))

  const buzzwoleCondition = hasPokemonFuzzy(user, Pokemon(I.Buzzwole))
  list.push(...addIf(P.Buzzwole, {other: buzzwoleCondition}, p))

  const celesteelaCondition = hasPokemonFuzzy(user, Pokemon(I.Celesteela))
  list.push(...addIf(P.Celesteela, {other: celesteelaCondition}, p))

  const kartanaCondition = hasPokemonFuzzy(user, Pokemon(I.Kartana))
  list.push(...addIf(P.Kartana, {other: kartanaCondition}, p))

  const guzzlordCondition = hasPokemonFuzzy(user, Pokemon(I.Guzzlord))
  list.push(...addIf(P.Guzzlord, {other: guzzlordCondition}, p))

  const stakatakaCondition = hasPokemonFuzzy(user, Pokemon(I.Stakataka))
  list.push(...addIf(P.Stakataka, {other: stakatakaCondition}, p))

  const blacephalonCondition = hasPokemonFuzzy(user, Pokemon(I.Blacephalon))
  list.push(...addIf(P.Blacephalon, {other: blacephalonCondition}, p))

  const poipoleCondition = hasPokemonFuzzy(user, Pokemon(I.Poipole))
  list.push(...addIf(P.Poipole, {other: poipoleCondition}, p))

  return {
    list,
    shinyMultipler: 3,
    guaranteedItem: () => {
      const p = Math.random()
      if (p < 0.01) {
        return 'icestone'
      } else if (p < 0.05) {
        return 'strangesouvenir'
      } else if (p < 0.2) {
        return randomItem(NECTARS)
      }
      return ''
    },
  }
}

const ENCOUNTERS_BAIT = (user, now, location, format, params) => {
  const {bait, pokeball} = params
  const p: EncounterParams = {user: user as Users.Doc, location, format, bait}
  const baitDb = ITEMS[bait] as Bait ?? undefined
  const list: BadgeId[] = []
  // Create a nested mapping:
  // curryspicysausage
  // |__ pokeball
  //     |___ [P.Vulpix, P.Charmander, ...]
  //
  // Then inflate this map below.
  const baitBallPkmnMap: Partial<Record<ItemId, Partial<Record<PokeballId, Partial<Record<Gate, BadgeId[]>>>>>> = {
    curryspicysausage: {
      pokeball: {
        [CATCH_CHARM_SM]: [
          P.Vulpix, P.Growlithe, P.Litwick, P.Charmander,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Sizzlipede, P.Rolycoly,
        ]
      },
      greatball: {
        [CATCH_CHARM_SM]: [
          P.Torkoal, P.Heatmor, P.Turtonator
        ] 
      }
    },
    currydryjuicy: {
      pokeball: {
        [CATCH_CHARM_SM]: [
          P.Lotad, P.Wingull, P.Krabby, P.Wooper,
          P.Corphish, P.Tympole, P.Magikarp, P.Goldeen,
          P.Remoraid, P.Shellder, P.Chinchou, P.Barboach,
          P.Wimpod, P.Qwilfish, P.Mareanie, P.Mantyke,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Chewtle,
        ]
      },
      greatball: {
        [CATCH_CHARM_SM]: [
          P.Wailmer, P.Binacle, P.Basculin, P.Wishiwashi,
          P.Pyukumuku, P.Frillish, P.Shellos,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Cramorant, P.Arrokuda,
        ]
      },
      ultraball: {
        [CATCH_CHARM_SM]: [
          P.Lapras, P.Feebas,
        ]
      }
    },
    currysweetrich: {
      pokeball: {
        [CATCH_CHARM_SM]: [
          P.Cutiefly, P.Cleffa, P.Togepi, P.Mime_Jr,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Milcery,
        ]
      },
      greatball: {
        [CATCH_CHARM_SM]: [
          P.Swirlix, P.Spritzee, P.Cottonee, P.Mawile,
          P.Morelull,
        ]
      },
      ultraball: {
        [CATCH_CHARM_SM]: [
          P.Mimikyu,
        ]
      }
    },
    currybitterbean: {
      pokeball: {
        [CATCH_CHARM_SM]: [
          P.Swinub, P.Baltoy, P.Wooper, P.Diglett,
          P.Drilbur, P.Trapinch,
        ],
      },
      greatball: {
        [CATCH_CHARM_SM]: [
          P.Mudbray, P.Golett, P.Palpitoad, P.Onix,
          P.Barboach, P.Rhyhorn, P.Hippopotas, P.Larvitar,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Silicobra, Potw(P.Yamask, {form: 'galarian'}),
          Potw(P.Stunfisk, {form: 'galarian'}),
        ]
      },
      ultraball: {
        [CATCH_CHARM_SM]: [
          P.Diggersby, P.Gastrodon,
        ]
      }
    },
    currysourtoast: {
      pokeball: {
        [CATCH_CHARM_SM]: [
          P.Hoothoot, P.Pidove, P.Wingull, P.Combee,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Rookidee,
        ]
      },
      greatball: {
        [CATCH_CHARM_SM]: [
          P.Drifloon, P.Woobat, P.Togetic, P.Rufflet,
          P.Vullaby, P.Sigilyph, P.Mantyke,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Cramorant,
        ]
      },
    },
    curryspicypasta: {
      pokeball: {
        [CATCH_CHARM_SM]: [
          P.Dwebble, P.Roggenrola, P.Bonsly,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Rolycoly,
        ]
      },
      greatball: {
        [CATCH_CHARM_SM]: [
          P.Onix, P.Shuckle, P.Binacle, P.Rhyhorn,
          P.Lunatone, P.Solrock, P.Larvitar,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Stonjourner,
        ]
      },
    },
    currydrymushroom: {
      pokeball: {
        [CATCH_CHARM_SM]: [
          P.Oddish, P.Budew, P.Stunky, P.Gastly,
          P.Koffing, P.Skorupi,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Toxel,
        ]
      },
      greatball: {
        [CATCH_CHARM_SM]: [
          P.Gloom, P.Trubbish, P.Croagunk, P.Salandit,
        ]
      },
    },
    currysweetsmokedtail: {
      pokeball: {
        [CATCH_CHARM_SM]: [
          P.Baltoy, P.Munna, P.Natu, P.Ralts, P.Wynaut,
          P.Gothita, P.Solosis, P.Mime_Jr,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Hatenna,
        ]
      },
      greatball: {
        [CATCH_CHARM_SM]: [
          P.Bronzor, P.Kirlia, P.Woobat, P.Espurr,
          P.Elgyem, P.Inkay, P.Sigilyph, P.Oranguru,
          P.Lunatone, P.Solrock,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Indeedee,
        ]
      }
    },
    currybitterleek: {
      pokeball: {
        [CATCH_CHARM_SM]: [
          P.Stufful, P.Tyrogue, P.Pancham, P.Machop,
          P.Timburr, P.Scraggy, P.Riolu,
        ]
      },
      greatball: {
        [CATCH_CHARM_SM]: [
          P.Croagunk, P.Throh, P.Sawk, P.Hawlucha,
          P.Passimian,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Clobbopus, P.Falinks, Potw(P.Farfetchd, {form: 'galarian'})
        ]
      },
      ultraball: {
        [CATCH_CHARM_SM]: [
          P.Hakamo_o,
        ]
      }
    },
    currysourapple: {
      pokeball: {
        [CATCH_CHARM_SWSH]: [
          P.Applin,
        ]
      },
      greatball: {
        [CATCH_CHARM_SM]: [
          P.Deino, P.Axew, P.Goomy, P.Jangmo_o,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Dreepy,
        ]
      },
      ultraball: {
        [CATCH_CHARM_SM]: [
          P.Noibat, P.Vibrava, P.Drampa, P.Turtonator,
        ]
      }
    },
    curryspicybone: {
      pokeball: {
        [CATCH_CHARM_SM]: [
          P.Duskull, P.Gastly, P.Litwick, P.Honedge,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Sinistea,
        ]
      },
      greatball: {
        [CATCH_CHARM_SM]: [
          P.Golett, P.Pumpkaboo, P.Frillish, P.Drifloon,
          P.Phantump,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Dreepy,
          Potw(P.Corsola, {form: 'galarian'}), Potw(P.Yamask, {form: 'galarian'}),
        ]
      }
    },
    currydryplentyofpotato: {
      pokeball: {
        [CATCH_CHARM_SM]: [
          P.Hoothoot, P.Pidove, P.Bunnelby, P.Minccino,
          P.Stufful, P.Eevee, P.Munchlax,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Skwovet, P.Wooloo,
        ]
      },
      greatball: {
        [CATCH_CHARM_SM]: [
          P.Rufflet, P.Helioptile, P.Oranguru, P.Drampa,
        ]
      },
    },
    currysweetherb: {
      pokeball: {
        [CATCH_CHARM_SM]: [
          P.Caterpie, P.Grubbin, P.Combee, P.Cutiefly,
          P.Wimpod,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Blipbug, P.Sizzlipede,
        ]
      },
      greatball: {
        [CATCH_CHARM_SM]: [
          P.Joltik, P.Dwebble, P.Nincada, P.Dewpider, P.Shuckle,
          P.Karrablast, P.Shelmet, P.Skorupi, P.Durant,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Snom,
        ]
      }
    },
    currybittersalad: {
      pokeball: {
        [CATCH_CHARM_SM]: [
          P.Lotad, P.Seedot, P.Bounsweet, P.Oddish, P.Budew,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Gossifleur, P.Applin,
        ]
      },
      greatball: {
        [CATCH_CHARM_SM]: [
          P.Snover, P.Cherubi, P.Ferroseed, P.Pumpkaboo, P.Phantump,
          P.Cottonee, P.Maractus, P.Morelull,
        ]
      },
      ultraball: {
        [CATCH_CHARM_SM]: [
          P.Dhelmise,
        ]
      }
    },
    currysourfriedfood: {
      pokeball: {
        [CATCH_CHARM_SM]: [
          P.Electrike, P.Joltik, P.Pichu,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Yamper, P.Toxel,
        ]
      },
      greatball: {
        [CATCH_CHARM_SM]: [
          P.Charjabug, P.Chinchou, P.Rotom,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Morpeko,
          P.Pincurchin,
        ],
      }
    },
    curryspicyboiledegg: {
      pokeball: {
        [CATCH_CHARM_SM]: [
          P.Purrloin, P.Stunky, P.Scraggy,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Nickit, Potw(P.Zigzagoon, {form: 'galarian'}),
          P.Impidimp,
        ],
      },
      greatball: {
        [CATCH_CHARM_SM]: [
          P.Nuzleaf, P.Pawniard, P.Vullaby, P.Inkay,
          P.Sneasel, P.Sableye, P.Deino,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Morpeko,
        ]
      },
      ultraball: {
        [CATCH_CHARM_SM]: [
          P.Drapion,
        ]
      }
    },
    currydrytropical: {
      pokeball: {
        [CATCH_CHARM_SM]: [
          P.Vanillite, P.Swinub, P.Snorunt, P.Bergmite,
        ],
      },
      greatball: {
        [CATCH_CHARM_SM]: [
          P.Snover, P.Cubchoo, P.Sneasel,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Snom, Potw(P.Mr_Mime, {form: 'galarian'}), Potw(P.Darumaka, {form: 'galarian'}),
          P.Eiscue,
        ],
      }
    },
    currysweetcheesecovered: {
      pokeball: {
        [CATCH_CHARM_SM]: [
          P.Klink, P.Honedge,
        ],
      },
      greatball: {
        [CATCH_CHARM_SM]: [
          P.Bronzor, P.Ferroseed, P.Pawniard, P.Mawile,
          P.Durant, P.Togedemaru,
        ],
        [CATCH_CHARM_SWSH]: [
          Potw(P.Meowth, {form: 'galarian'}),
          P.Cufant,
        ]
      },
      ultraball: {
        [CATCH_CHARM_SM]: [
          P.Excadrill,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Corviknight, Potw(P.Stunfisk, {form: 'galarian'}), P.Duraludon,
        ],
      }
    },
    // Top Stat: Defense
    currybitterseasoned: {
      pokeball: {
        [CATCH_CHARM_SM]: [
          P.Wingull, P.Dwebble, P.Klink, P.Bonsly,
          P.Aron,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Rookidee, Potw(P.Zigzagoon, {form: 'galarian'}), P.Wooloo,
          P.Rolycoly,
        ]
      },
      greatball: {
        [CATCH_CHARM_SM]: [
          P.Shellder, P.Onix, P.Ferroseed, P.Pumpkaboo, P.Swirlix,
          P.Scraggy, P.Shuckle, P.Wimpod, P.Binacle, P.Koffing,
          P.Skorupi, P.Sableye, P.Mawile, P.Torkoal, P.Mareanie,
          P.Hippopotas, P.Durant, P.Honedge, P.Bergmite, P.Jangmo_o,
          P.Sandshrew, P.Slowpoke, P.Cubone, P.Tangela, P.Horsea,
          P.Skarmory, P.Miltank, P.Klefki, P.Sandygast,
          P.Relicanth,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Silicobra, Potw(P.Yamask, {form: 'galarian'}), P.Stonjourner,
          Potw(P.Eiscue, {form: 'ice_face'}),
        ]
      }
    },
    // Top Stat: HP
    currysourwhippedcream: {
      pokeball: {
        [CATCH_CHARM_SM]: [
          P.Hoothoot, P.Bunnelby, P.Minccino, P.Munna, P.Wooper, P.Drifloon,
          P.Tympole, P.Wishiwashi, P.Wynaut, P.Cleffa, P.Munchlax,
          P.Happiny, P.Whismur,
          P.Spheal,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Skwovet, P.Applin,
        ]
      },
      greatball: {
        [CATCH_CHARM_SM]: [
          P.Stunky, P.Spritzee, P.Chinchou, P.Barboach, P.Shellos, P.Throh,
          P.Vullaby, P.Wailmer, P.Lapras,
          P.Jigglypuff, P.Lickitung, P.Chansey, P.Kangaskhan, P.Marill,
          P.Dunsparce, P.Foongus,
          P.Audino,
        ],
        [CATCH_CHARM_SWSH]: [
          Potw(P.Stunfisk, {form: 'galarian'}),
        ]
      }
    },
    // Top Stat: Speed
    curryspicydecorative: {
      pokeball: {
        [CATCH_CHARM_SM]: [
          P.Purrloin, P.Joltik, P.Electrike, P.Vulpix,
          P.Snorunt, P.Nincada, P.Pichu, P.Shelmet,
          P.Venipede, P.Fletchling,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Yamper,
        ]
      },
      greatball: {
        [CATCH_CHARM_SM]: [
          P.Delibird, P.Diglett, P.Woobat, P.Noibat, P.Cutiefly, P.Espurr,
          P.Salandit, P.Cottonee, P.Sneasel, P.Hawlucha,
          P.Staryu, P.Tauros, P.Buneary, P.Emolga, P.Dedenne,
          P.Electabuzz, P.Treecko,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Arrokuda, Potw(P.Ponyta, {form: 'galarian'}),
          P.Morpeko, P.Dreepy,
        ]
      }
    },
    // Top Stat: SpDef
    currydrycoconut: {
      pokeball: {
        [CATCH_CHARM_SM]: [
          P.Lotad, P.Baltoy, P.Combee, P.Duskull, P.Gothita, P.Mantyke,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Blipbug, P.Nickit, P.Gossifleur,
        ]
      },
      greatball: {
        [CATCH_CHARM_SM]: [
          P.Bronzor, P.Feebas, P.Pyukumuku, P.Eevee, P.Dewpider, P.Mimikyu,
          P.Frillish, P.Cramorant, P.Morelull, P.Oranguru, P.Turtonator,
          P.Goomy,
          P.Tentacool, P.Skrelp, P.Comfey,
          P.Swablu, P.Cryogonal, P.Carbink,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Milcery,
        ]
      }
    },
    // Top Stat: SpAtk
    currysweetinstantnoodle: {
      pokeball: {
        [CATCH_CHARM_SM]: [
          P.Caterpie, P.Grubbin, P.Oddish, P.Budew, P.Vanillite, P.Natu,
          P.Ralts, P.Gastly, P.Togepi, P.Solosis, P.Litwick, P.Riolu,
          P.Mime_Jr, P.Charmander,
          P.Abra, P.Exeggcute,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Toxel, P.Hatenna,
        ]
      },
      greatball: {
        [CATCH_CHARM_SM]: [
          P.Snover, P.Cherubi, P.Elgyem, P.Maractus, P.Sigilyph, P.Heatmor,
          P.Helioptile, P.Drampa, P.Lunatone, P.Rotom, P.Deino,
          P.Psyduck, P.Magnemite, P.Petilil, P.Clauncher,
          P.Jynx, P.Magmar,
        ],
        [CATCH_CHARM_SWSH]: [
          Potw(P.Corsola, {form: 'galarian'}),
          P.Sinistea,
          P.Indeedee,
          P.Snom,
        ]
      },
      ultraball: {
        [CATCH_CHARM_SM]: [
          P.Larvesta,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Duraludon,
        ]
      }
    },
    // Top Stat: Attack
    currybitterburgersteak: {
      pokeball: {
        [CATCH_CHARM_SM]: [
          P.Pidove, P.Seedot, P.Bounsweet, P.Growlithe, P.Swinub,
          P.Mudbray, P.Golett, P.Stufful, P.Krabby, P.Corphish,
          P.Ralts, P.Machop, P.Magikarp, P.Roggenrola, P.Timburr,
          P.Karrablast, P.Cubchoo, P.Inkay,
          P.Poliwag, P.Shinx, P.Lillipup, P.Sandile,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Chewtle, P.Impidimp,
        ]
      },
      greatball: {
        [CATCH_CHARM_SM]: [
          P.Pancham, P.Goldeen, P.Remoraid, P.Basculin, P.Trubbish, P.Drilbur,
          P.Croagunk, P.Pawniard, P.Sawk, P.Rhyhorn, P.Rufflet, P.Qwilfish,
          P.Trapinch, P.Axew, P.Phantump, P.Passimian, P.Togedemaru,
          P.Dhelmise, P.Solrock, P.Larvitar,
          P.Scyther, P.Pinsir, P.Heracross, P.Carvanha, P.Zorua, P.Mienfoo,
          P.Druddigon, P.Bouffalant, P.Rockruff, P.Fomantis,
          P.NidoranF, P.NidoranM, P.Zubat, P.Dratini, P.Torchic, P.Mudkip,
          P.Bagon, P.Beldum, P.Gible,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Sizzlipede, Potw(P.Meowth, {form: 'galarian'}),
          Potw(P.Farfetchd, {form: 'galarian'}),
          P.Cufant, P.Falinks, P.Clobbopus, P.Pincurchin,
          Potw(P.Darumaka, {form: 'galarian'}),
        ]
      }
    },
    // https://www.serebii.net/swordshield/gigantamax.shtml
    currygigantamax: {
      pokeball: {
        [CATCH_CHARM_RBY]: [
          P.Bulbasaur, P.Charmander, P.Squirtle, P.Caterpie, P.Meowth,
          P.Machop, P.Gastly, P.Eevee,
        ],
        [CATCH_CHARM_GSC]: [
          P.Pichu,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Grookey, P.Scorbunny, P.Sobble, P.Rookidee, P.Blipbug, P.Chewtle,
          P.Applin, P.Toxel, P.Hatenna, P.Impidimp, P.Rolycoly,
        ]
      },
      greatball: {
        [CATCH_CHARM_RBY]: [
          P.Ivysaur, P.Charmeleon, P.Wartortle, P.Metapod, P.Machoke,
          P.Haunter, P.Pikachu, P.Krabby,
        ],
        [CATCH_CHARM_DPPT]: [ P.Munchlax ],
        [CATCH_CHARM_BW]: [ P.Trubbish ],
        [CATCH_CHARM_SWSH]: [
          P.Thwackey, P.Raboot, P.Drizzile, P.Corvisquire, P.Dottler,
          P.Hattrem, P.Morgrem, P.Carkol, P.Sizzlipede, P.Milcery, P.Cufant,
        ]
      },
      ultraball: {
        [CATCH_CHARM_RBY]: [
          P.Venusaur, P.Charizard, P.Blastoise, P.Butterfree, P.Machamp,
          P.Gengar, P.Kingler, P.Lapras, P.Snorlax,
        ],
        [CATCH_CHARM_BW]: [
          P.Garbodor,
        ],
        [CATCH_CHARM_SWSH]: [
          P.Rillaboom, P.Cinderace, P.Inteleon, P.Corviknight, P.Orbeetle,
          P.Drednaw, P.Coalossal, P.Sandaconda, P.Toxtricity, P.Centiskorch,
          P.Hatterene, P.Grimmsnarl, P.Copperajah, P.Duraludon,
        ]
      },
    },
    redpokeblock: {
      pokeball: {
        [CATCH_CHARM_RBY]: [
          P.Charmander, P.Paras, P.Krabby, P.Voltorb, P.Goldeen, P.Magikarp,
        ],
        [CATCH_CHARM_GSC]: [
          P.Ledyba, P.Slugma, P.Magby
        ],
        [CATCH_CHARM_RSE]: [
          P.Torchic, P.Wurmple, P.Carvanha, P.Corphish,
        ]
      },
      greatball: {
        [CATCH_CHARM_RBY]: [
          P.Charmeleon, P.Parasect, P.Seaking,
        ],
        [CATCH_CHARM_GSC]: [
          P.Ledian, P.Ariados, P.Yanma, P.Delibird,
        ],
        [CATCH_CHARM_RSE]: [
          P.Combusken, P.Medicham, P.Solrock, Potw(P.Castform, {form: 'sunny'}),
        ],
      },
      ultraball: {
        [CATCH_CHARM_RBY]: [
          P.Charizard, P.Vileplume, P.Kingler, P.Electrode, P.Jynx, P.Magmar,
          P.Flareon,
        ],
        [CATCH_CHARM_GSC]: [
          P.Magcargo, P.Octillery,
        ],
        [CATCH_CHARM_RSE]: [
          P.Blaziken, P.Camerupt, P.Crawdaunt,
        ]
      }
    },
    bluepokeblock: {
      pokeball: {
        [CATCH_CHARM_RBY]: [
          P.Squirtle, P.NidoranF, P.Oddish, P.Poliwag, P.Tentacool, P.Horsea,
        ],
        [CATCH_CHARM_GSC]: [
          P.Totodile, P.Chinchou, P.Marill, P.Wooper, P.Phanpy,
        ],
        [CATCH_CHARM_RSE]: [
          P.Mudkip, P.Taillow, P.Surskit, P.Azurill, P.Meditite, P.Wailmer,
          P.Swablu, P.Wynaut, P.Spheal, P.Clamperl,
        ],
      },
      greatball: {
        [CATCH_CHARM_RBY]: [
          P.Wartortle, P.Nidorina, P.Gloom, P.Poliwhirl, P.Seadra, P.Dratini,
        ],
        [CATCH_CHARM_GSC]: [
          P.Croconaw, P.Azumarill, P.Quagsire,
        ],
        [CATCH_CHARM_RSE]: [
          P.Marshtomp, P.Swellow, P.Masquerain, Potw(P.Castform, {form: 'rainy'}),
          P.Sealeo, P.Bagon, P.Beldum, P.Loudred,
        ]
      },
      ultraball: {
        [CATCH_CHARM_RBY]: [
          P.Blastoise, P.Nidoqueen, P.Golduck, P.Tentacruel, P.Tangela,
          P.Gyarados, P.Lapras, P.Vaporeon, P.Dragonair,
        ],
        [CATCH_CHARM_GSC]: [
          P.Feraligatr, P.Lanturn, P.Wobbuffet, P.Heracross,
        ],
        [CATCH_CHARM_RSE]: [
          P.Swampert, P.Exploud, P.Sharpedo, P.Wailord, P.Altaria, P.Whiscash,
          P.Chimecho, P.Walrein, P.Metang,
        ]
      }
    },
    greenpokeblock: {
      pokeball: {
        [CATCH_CHARM_RBY]: [
          P.Bulbasaur, P.Caterpie, P.Bellsprout,
        ],
        [CATCH_CHARM_GSC]: [
          P.Chikorita, P.Spinarak, P.Natu,
        ],
        [CATCH_CHARM_RSE]: [
          P.Treecko, P.Lotad, P.Electrike, P.Gulpin, P.Cacnea,
        ]
      },
      greatball: {
        [CATCH_CHARM_RBY]: [
          P.Ivysaur, P.Metapod, P.Weepinbell,
        ],
        [CATCH_CHARM_GSC]: [
          P.Bayleef, P.Xatu, P.Skiploom, P.Larvitar,
        ],
        [CATCH_CHARM_RSE]: [
          P.Grovyle, P.Lombre, P.Breloom, P.Roselia, P.Kecleon,
        ]
      },
      ultraball: {
        [CATCH_CHARM_RBY]: [
          P.Venusaur, P.Victreebel, P.Scyther,
        ],
        [CATCH_CHARM_GSC]: [
          P.Meganium,
        ],
        [CATCH_CHARM_RSE]: [
          P.Sceptile, P.Dustox, P.Ludicolo, P.Vibrava, P.Cacturne, P.Tropius,
        ]
      }
    },
    pinkpokeblock: {
      pokeball: {
        [CATCH_CHARM_RBY]: [
          P.Clefairy, P.Jigglypuff, P.Slowpoke, P.Exeggcute,
        ],
        [CATCH_CHARM_GSC]: [
          P.Cleffa, P.Igglybuff, P.Hoppip, P.Snubbull, P.Smoochum,
        ],
        [CATCH_CHARM_RSE]: [
          P.Whismur, P.Skitty, P.Luvdisc,
        ]
      },
      greatball: {
        [CATCH_CHARM_GSC]: [
          P.Flaaffy, P.Corsola,
        ],
      },
      ultraball: {
        [CATCH_CHARM_RBY]: [
          P.Clefable, P.Wigglytuff, P.Slowbro, P.Lickitung, P.Chansey,
          P.Mr_Mime,
        ],
        [CATCH_CHARM_GSC]: [
          P.Miltank,
        ]
      }
    },
    yellowpokeblock: {
      pokeball: {
        [CATCH_CHARM_RBY]: [
          P.Sandshrew, P.Meowth, P.Psyduck, P.Ponyta, P.Drowzee,
        ],
        [CATCH_CHARM_GSC]: [
          P.Cyndaquil, P.Pichu, P.Sunkern, P.Elekid,
        ],
        [CATCH_CHARM_RSE]: [
          P.Makuhita, P.Plusle, P.Minun, P.Numel,
        ]
      },
      greatball: {
        [CATCH_CHARM_RBY]: [
          P.Kakuna, P.Pikachu, P.Hypno,
        ],
        [CATCH_CHARM_GSC]: [
          P.Quilava, P.Girafarig, P.Dunsparce, P.Shuckle,
        ],
        [CATCH_CHARM_RSE]: [
          P.Pelipper, P.Lunatone,
        ]
      },
      ultraball: {
        [CATCH_CHARM_RBY]: [
          P.Beedrill, P.Raichu, P.Sandslash, P.Ninetales, P.Persian,
          P.Rapidash, P.Exeggutor, P.Electabuzz, P.Jolteon,
        ],
        [CATCH_CHARM_GSC]: [
          P.Typhlosion, P.Ampharos, P.Sunflora,
        ],
        [CATCH_CHARM_RSE]: [
          P.Beautifly, P.Ninjask, P.Manectric,
        ]
      }
    },
    poffinspicy: {
      pokeball: {
        [CATCH_CHARM_DPPT]: [
          P.Magikarp, P.Chimchar, P.Kricketot, P.Wurmple, P.Cherubi,
          P.Goldeen, P.Magby,
        ]
      },
      greatball: {
        [CATCH_CHARM_DPPT]: [
          P.Monferno, P.Kricketune, P.Seaking, P.Medicham, P.Yanma,
        ]
      },
      ultraball: {
        [CATCH_CHARM_DPPT]: [
          P.Infernape, P.Octillery,
          P.Flareon, P.Magmar,
        ]
      }
    },
    poffindry: {
      pokeball: {
        [CATCH_CHARM_DPPT]: [
          P.Piplup, P.Shinx, P.Zubat, P.Glameow, P.Bronzor, P.Meditite,
          P.Wooper, P.Azurill, P.Marill, P.Remoraid, P.Finneon, P.Tentacool,
          P.Mantyke, P.Swablu,
        ]
      },
      greatball: {
        [CATCH_CHARM_DPPT]: [
          P.Prinplup, P.Luxio, P.Golbat, P.Gible, P.Munchlax, P.Riolu,
          P.Quagsire, P.Skorupi, P.Croagunk, P.Nosepass, P.Tangela,
        ]
      },
      ultraball: {
        [CATCH_CHARM_DPPT]: [
          P.Empoleon, P.Luxray, P.Gyarados, P.Golduck, P.Heracross,
          P.Purugly, P.Whiscash, P.Chimecho, P.Bronzong, P.Gabite,
          P.Azumarill, P.Toxicroak, P.Lumineon, P.Mantine, P.Vaporeon,
          P.Altaria,
        ]
      }
    },
    poffinsweet: {
      pokeball: {
        [CATCH_CHARM_DPPT]: [
          P.Cleffa, Potw(P.Shellos, {form: 'west_sea'}), P.Happiny, P.Mime_Jr,
        ],
      },
      greatball: {
        [CATCH_CHARM_DPPT]: [
          P.Clefairy, P.Cascoon,
        ]
      },
      ultraball: {
        [CATCH_CHARM_DPPT]: [
          Potw(P.Gastrodon, {form: 'west_sea'}), P.Cherrim, P.Medicham,
          P.Mr_Mime, P.Chansey, P.Clefable, P.Lickitung, P.Porygon,
        ]
      }
    },
    poffinbitter: {
      pokeball: {
        [CATCH_CHARM_DPPT]: [
          P.Turtwig, P.Budew, Potw(P.Burmy, {form: 'plant'}), P.Ralts,
        ]
      },
      greatball: {
        [CATCH_CHARM_DPPT]: [
          P.Grotle, P.Roselia, Potw(P.Wormadam, {form: 'plant'}), P.Kirlia,
        ]
      },
      ultraball: {
        [CATCH_CHARM_DPPT]: [
          P.Torterra, P.Roserade, P.Dustox, P.Carnivine, P.Gardevoir,
          P.Gallade, P.Leafeon, P.Tropius, P.Scyther,
        ]
      }
    },
    poffinsour: {
      pokeball: {
        [CATCH_CHARM_DPPT]: [
          P.Pichu, P.Abra, P.Psyduck, P.Combee, P.Chingling, P.Ponyta,
          P.Elekid, P.Snorunt,
        ],
      },
      greatball: {
        [CATCH_CHARM_DPPT]: [
          P.Kadabra, P.Pikachu, P.Girafarig,
        ]
      },
      ultraball: {
        [CATCH_CHARM_DPPT]: [
          P.Mothim, P.Vespiquen, P.Beautifly, P.Raichu, P.Rapidash, P.Pelipper,
          P.Jolteon, P.Electabuzz,
        ]
      }
    },
    cakemushroom: {
      pokeball: {
        [CATCH_CHARM_SWSH]: [
          P.Cyndaquil, P.Oshawott, P.Bidoof, P.Shinx, P.Wurmple, P.Ponyta,
          P.Eevee, P.Drifloon, P.Kricketot, P.Buizel, P.Burmy, P.Paras,
          P.Pichu, P.Abra, P.Chimchar, P.Buneary, P.Cherubi, P.Psyduck,
          P.Combee, P.Mime_Jr, P.Aipom, P.Shellos, P.Budew, P.Petilil,
          P.Ralts, P.Hippopotas, P.Stunky, P.Teddiursa, P.Turtwig, P.Gastly,
          P.Spheal, Potw(P.Growlithe, {form: 'hisuian'}), P.Machop, P.Glameow,
          P.Duskull, P.Piplup, P.Vulpix, P.Magby, P.Elekid, P.Chingling,
          P.Swinub, P.Snover,
        ]
      },
      greatball: {
        [CATCH_CHARM_SWSH]: [
          P.Quilava, P.Bibarel, P.Luxio, P.Silcoon, P.Cascoon, P.Kricketune,
          P.Stantler, P.Parasect, P.Pikachu, P.Kadabra, P.Monferno, P.Roselia,
          P.Tangela, P.Croagunk, P.Skorupi, P.Kirlia, P.Yanma, P.Pachirisu,
          P.Rhyhorn, P.Grotle, P.Haunter, P.Sealeo, P.Machoke, P.Dusclops,
          P.Prinplup, P.Gligar, P.Rotom, P.Misdreavus,
          Potw(P.Sneasel, {form: 'hisuian'}), P.Piloswine,
          Potw(P.Zorua, {form: 'hisuian'}), P.Riolu, P.Dewott,
        ]
      },
      ultraball: {
        [CATCH_CHARM_SWSH]: [
          Potw(P.Typhlosion, {form: 'hisuian'}), P.Luxray, P.Rapidash,
          Potw(P.Samurott, {form: 'hisuian'}), P.Beautifly, P.Dustox,
          P.Vaporeon, P.Flareon, P.Jolteon, P.Drifblim, P.Floatzel, P.Wormadam,
          P.Mothim, P.Raichu, P.Infernape, P.Cherrim, P.Golduck, P.Vespiquen,
          P.Heracross, P.Mime_Jr, P.Electabuzz, P.Magmar, P.Gastrodon,
          P.Roserade, P.Gardevoir, P.Gallade, P.Carnivine, P.Toxicroak,
          P.Ursaring, P.Hippowdon, P.Skuntank, P.Rhydon, P.Torterra, P.Walrein,
          P.Drapion, P.Purugly, P.Empoleon, P.Ninetales, P.Chimecho,
          P.Abomasnow,
        ]
      }
    },
    cakehoney: {
      pokeball: {
        [CATCH_CHARM_SWSH]: [
          P.Rowlet, P.Starly, P.Wurmple, P.Zubat, P.Kricketot, P.Pichu,
          P.Munchlax, P.Burmy, P.Abra, P.Chimchar, P.Buneary, P.Cherubi,
          P.Combee, P.Mime_Jr, P.Happiny, P.Budew, P.Ralts, P.Togepi,
          P.Turtwig, P.Machop, P.Magby, P.Elekid, P.Cleffa, P.Snorunt,
          P.Bergmite,
        ]
      },
      greatball: {
        [CATCH_CHARM_SWSH]: [
          P.Dartrix, P.Staravia, P.Silcoon, P.Cascoon, P.Golbat, P.Kricketune,
          P.Parasect, P.Pikachu, P.Kadabra, P.Roselia, P.Yanma, P.Kirlia,
          P.Pachirisu, P.Rhyhorn, P.Togetic, P.Grotle, P.Murkrow, P.Skorupi,
          P.Machoke, P.Chatot, P.Gligar, P.Gible, P.Clefairy, P.Snover,
          P.Rufflet, P.Riolu,
        ]
      },
      ultraball: {
        [CATCH_CHARM_SWSH]: [
          Potw(P.Decidueye, {form: 'hisuian'}), P.Staraptor, P.Wormadam,
          Potw(P.Avalugg, {form: 'hisuian'}), P.Beautifly, P.Dustox,
          P.Mothim, P.Snorlax, P.Raichu, P.Infernape, P.Scyther, P.Cherrim,
          P.Vespiquen, P.Scyther, P.Heracross, P.Mr_Mime, P.Chansey,
          P.Roserade, P.Gabite, P.Rhydon, P.Toxicroak, P.Lickitung,
          P.Torterra, P.Drapion, P.Magmar, P.Electabuzz, P.Glalie, P.Abomasnow,
          Potw(P.Braviary, {form: 'hisuian'}),
        ]
      }
    },
    cakegrain: {
      pokeball: {
        [CATCH_CHARM_SWSH]: [
          P.Rowlet, P.Cyndaquil, P.Oshawott, P.Bidoof, P.Starly, P.Shinx,
          P.Wurmple, P.Ponyta, P.Eevee, P.Zubat, P.Kricketot, P.Buizel,
          P.Burmy, P.Munchlax, P.Paras, P.Pichu, P.Abra, P.Chimchar, P.Combee,
          P.Mime_Jr, P.Aipom, P.Magikarp, P.Shellos,
          Potw(P.Qwilfish, {form: 'hisuian'}), P.Barboach, P.Croagunk, P.Ralts,
          P.Hippopotas, P.Stunky, P.Teddiursa, P.Togepi, P.Turtwig, P.Spheal,
          P.Remoraid, Potw(P.Growlithe, {form: 'hisuian'}), P.Glameow,
          P.Machop, P.Piplup, P.Mantyke, P.Vulpix, P.Tentacool, P.Finneon,
          P.Magby, P.Elekid, P.Swinub, P.Bergmite,
        ]
      },
      greatball: {
        [CATCH_CHARM_SWSH]: [
          P.Dartrix, P.Quilava, P.Dewott, P.Bibarel, P.Staravia, P.Cascoon,
          P.Silcoon, P.Luxio, P.Golbat, P.Kricketune, P.Stantler, P.Parasect,
          P.Pikachu, P.Kadabra, P.Monferno, P.Kirlia, P.Pachirisu, P.Yanma,
          P.Rhyhorn, P.Togetic, P.Grotle, P.Murkrow, P.Sealeo, P.Skorupi,
          P.Machoke, P.Chatot, P.Prinplup,
          Potw(P.Basculin, {form: 'white_stripe'}), P.Gligar, P.Gible,
          Potw(P.Sneasel, {form: 'hisuian'}), P.Piloswine, P.Rufflet,
          Potw(P.Zorua, {form: 'hisuian'})
        ]
      },
      ultraball: {
        [CATCH_CHARM_SWSH]: [
          Potw(P.Decidueye, {form: 'hisuian'}), P.Staraptor, P.Luxray,
          Potw(P.Typhlosion, {form: 'hisuian'}), P.Beautifly, P.Dustox,
          Potw(P.Samurott, {form: 'hisuian'}), P.Rapidash,
          P.Vaporeon, P.Flareon, P.Jolteon, P.Floatzel, P.Snorlax, P.Raichu,
          P.Infernape, P.Scyther, P.Golduck, P.Vespiquen, P.Heracross,
          P.Mr_Mime, P.Electabuzz, P.Magmar, P.Gyarados, P.Gastrodon,
          P.Whiscash, P.Toxicroak, P.Gardevoir, P.Gallade, P.Hippowdon,
          P.Drapion, P.Skuntank, P.Rhydon, P.Ursaring, P.Lickitung, P.Torterra,
          P.Octillery, P.Walrein, P.Purugly, P.Empoleon, P.Mantine,
          P.Ninetales, P.Tentacruel, P.Lumineon, P.Gabite, P.Abomasnow,
          Potw(P.Avalugg, {form: 'hisuian'}), Potw(P.Braviary, {form: 'hisuian'}),
        ]
      }
    },
    cakebean: {
      pokeball: {
        [CATCH_CHARM_SWSH]: [
          P.Rowlet, P.Cyndaquil, P.Oshawott, P.Bidoof, P.Starly, P.Shinx,
          P.Wurmple, P.Ponyta, P.Eevee, P.Zubat, P.Kricketot, P.Buizel,
          P.Burmy, P.Munchlax, P.Paras, P.Pichu, P.Abra, P.Chimchar, P.Combee,
          P.Mime_Jr, P.Aipom, P.Magikarp, P.Shellos,
          Potw(P.Qwilfish, {form: 'hisuian'}), P.Barboach, P.Croagunk, P.Ralts,
          P.Hippopotas, P.Stunky, P.Teddiursa, P.Togepi, P.Turtwig, P.Spheal,
          P.Remoraid, Potw(P.Growlithe, {form: 'hisuian'}), P.Glameow,
          P.Machop, P.Piplup, P.Mantyke, P.Vulpix, P.Tentacool, P.Finneon,
          P.Magby, P.Elekid, P.Swinub, P.Bergmite, P.Chingling, P.Drifloon,
        ]
      },
      greatball: {
        [CATCH_CHARM_SWSH]: [
          P.Dartrix, P.Quilava, P.Dewott, P.Bibarel, P.Staravia, P.Cascoon,
          P.Silcoon, P.Luxio, P.Golbat, P.Kricketune, P.Stantler, P.Parasect,
          P.Pikachu, P.Kadabra, P.Monferno, P.Kirlia, P.Pachirisu, P.Yanma,
          P.Rhyhorn, P.Togetic, P.Grotle, P.Murkrow, P.Sealeo, P.Skorupi,
          P.Machoke, P.Chatot, P.Prinplup,
          Potw(P.Basculin, {form: 'white_stripe'}), P.Gligar, P.Gible,
          Potw(P.Sneasel, {form: 'hisuian'}), P.Piloswine, P.Rufflet,
          Potw(P.Zorua, {form: 'hisuian'}), P.Rotom,
        ]
      },
      ultraball: {
        [CATCH_CHARM_SWSH]: [
          Potw(P.Decidueye, {form: 'hisuian'}), P.Staraptor, P.Luxray,
          Potw(P.Typhlosion, {form: 'hisuian'}), P.Beautifly, P.Dustox,
          Potw(P.Samurott, {form: 'hisuian'}), P.Rapidash,
          P.Vaporeon, P.Flareon, P.Jolteon, P.Floatzel, P.Snorlax, P.Raichu,
          P.Infernape, P.Scyther, P.Golduck, P.Vespiquen, P.Heracross,
          P.Mr_Mime, P.Electabuzz, P.Magmar, P.Gyarados, P.Gastrodon,
          P.Whiscash, P.Toxicroak, P.Gardevoir, P.Gallade, P.Hippowdon,
          P.Drapion, P.Skuntank, P.Rhydon, P.Ursaring, P.Lickitung, P.Torterra,
          P.Octillery, P.Walrein, P.Purugly, P.Empoleon, P.Mantine,
          P.Ninetales, P.Tentacruel, P.Lumineon, P.Gabite, P.Abomasnow,
          P.Chimecho, P.Drifblim,
          Potw(P.Avalugg, {form: 'hisuian'}), Potw(P.Braviary, {form: 'hisuian'}),
        ]
      }
    },
    cakesalt: {
      pokeball: {
        [CATCH_CHARM_SWSH]: [
          P.Geodude, P.Paras, P.Cherubi, P.Budew, P.Petilil, P.Bonsly,
          P.Turtwig, P.Magnemite, P.Bronzor, P.Snover,
          Potw(P.Voltorb, {form: 'hisuian'}), P.Snorunt, P.Bergmite,
        ]
      },
      greatball: {
        [CATCH_CHARM_SWSH]: [
          P.Graveler, P.Parasect, P.Roselia, P.Tangela, P.Onix, P.Sudowoodo,
          P.Grotle, P.Magneton, P.Nosepass,
        ]
      },
      ultraball: {
        [CATCH_CHARM_SWSH]: [
          P.Cherrim, P.Roserade, P.Torterra, P.Porygon, P.Bronzong, P.Glalie,
          Potw(P.Avalugg, {form: 'hisuian'}), P.Abomasnow,
        ]
      }
    },
    pokepuffsweet: { // Pink
      pokeball: {
        [CATCH_CHARM_XY]: [
          Potw(P.Burmy, {form: 'trash'}), P.Skitty, P.Hoppip, P.Whismur,
          P.Luvdisc, P.Snubbull, P.NidoranM, P.Mime_Jr, P.Slowpoke,
          P.Exeggcute, P.Shelmet, P.Smoochum, P.Igglybuff,
        ]
      },
      greatball: {
        [CATCH_CHARM_XY]: [
          P.Audino, P.Spritzee, P.Swirlix, P.Nidorino, P.Flaaffy,
          P.Corsola, P.Gligar, P.Jigglypuff, P.Ditto,
        ]
      },
      ultraball: {
        [CATCH_CHARM_XY]: [
          P.Nidoking, P.Mime_Jr, P.Miltank, P.Slowbro, P.Alomomola,
          P.Lickitung,
        ]
      }
    },
    pokepuffmint: { // Green
      pokeball: {
        [CATCH_CHARM_XY]: [
          P.Caterpie, Potw(P.Burmy, {form: 'plant'}), P.Ralts, P.Budew,
          P.Bulbasaur, P.Gulpin, P.Electrike, P.Solosis, P.Lotad,
          P.Spinarak,
        ]
      },
      greatball: {
        [CATCH_CHARM_XY]: [
          P.Pansage, P.Kirlia, P.Roselia, P.Ivysaur, P.Kecleon, P.Skiploom,
          P.Duosion, P.Lombre, Potw(P.Basculin, {form: 'blue_stripe'}),
          P.Trubbish, P.Larvitar,
        ]
      },
      ultraball: {
        [CATCH_CHARM_XY]: [
          P.Simisage, P.Venusaur, P.Reuniclus, P.Carnivine,
        ]
      }
    },
    pokepuffcitrus: { // Orange
      pokeball: {
        [CATCH_CHARM_XY]: [
          P.Fennekin, Potw(P.Flabébé, {form: 'orange'}), P.Ledyba,
          P.Charmander, P.Trapinch, P.Buizel,
        ]
      },
      greatball: {
        [CATCH_CHARM_XY]: [
          P.Braixen, Potw(P.Floette, {form: 'orange'}), P.Charmeleon,
          P.Solrock, P.Dwebble, P.Dedenne,
        ]
      },
      ultraball: {
        [CATCH_CHARM_XY]: [
          P.Delphox, P.Charizard, P.Crustle, P.Floatzel, P.Rotom,
        ]
      }
    },
    pokepuffmocha: { // Brown
      pokeball: {
        [CATCH_CHARM_XY]: [
          P.Chespin, P.Bunnelby, P.Zigzagoon, P.Pidgey, P.Weedle, P.Bidoof,
          Potw(P.Burmy, {form: 'sandy'}), P.Litleo, P.Skiddo, P.Sentret,
          P.Sandile, P.Hippopotas, P.Diglett, P.Geodude, P.Patrat,
          P.Swinub, P.Timburr, P.Sandshrew, P.Spearow, P.Hoothoot,
          P.Bonsly, P.Teddiursa,
        ]
      },
      greatball: {
        [CATCH_CHARM_XY]: [
          P.Quilladin, P.Diggersby, P.Linoone, P.Pidgeotto, P.Bibarel,
          P.Doduo, P.Furret, P.Dwebble, P.Skrelp, P.Staryu, P.Relicanth,
          P.Krokorok, P.Cubone, P.Eevee, P.Graveler, P.Phantump,
          P.Piloswine, P.Gurdurr, P.Fearow, P.Noctowl, P.Sudowoodo,
        ]
      },
      ultraball: {
        [CATCH_CHARM_XY]: [
          P.Chesnaught, P.Pidgeot, P.Pyroar, P.Gogoat, P.Dodrio,
          P.Crustle, P.Dragalge, P.Hippowdon, P.Marowak, P.Kangaskhan,
          P.Tauros, P.Pinsir, P.Dugtrio, P.Stunfisk, P.Sandslash,
          P.Ursaring,
        ]
      }
    },
    pokepuffspice: { // Black
      pokeball: {
        [CATCH_CHARM_XY]: [
          P.Froakie, P.Scatterbug, P.Pancham, P.Poochyena, P.Gothita,
        ]
      },
      greatball: {
        [CATCH_CHARM_XY]: [
          P.Frogadier, P.Seviper, P.Houndour, P.Mightyena, P.Pawniard,
          P.Murkrow, P.Zorua, P.Gothorita, P.Deino,
        ]
      },
      ultraball: {
        [CATCH_CHARM_XY]: [
          P.Greninja, P.Pangoro, P.Houndoom, P.Aggron, P.Zoroark, P.Gothitelle,
          P.Zweilous,
        ]
      }
    },
    svscheese: {
      pokeball: {
        [CATCH_CHARM_SWSH]: [
          P.Venonat,
        ]
      },
      greatball: {
        [CATCH_CHARM_SWSH]: [
          P.Venomoth,
        ]
      },
      ultraball: {
        [CATCH_CHARM_SWSH]: [
          P.Scyther,
        ]
      }
    },
    svstofu: {
      pokeball: {
        [CATCH_CHARM_SWSH]: [
          P.Jigglypuff, P.Meowth,
        ]
      },
      greatball: {
        [CATCH_CHARM_SWSH]: [
          P.Persian, P.Eevee,
        ]
      },
      ultraball: {
        [CATCH_CHARM_SWSH]: [
          P.Chansey,
        ]
      }
    },
    svsherbsausage: {
      pokeball: {
        [CATCH_CHARM_SWSH]: [
          P.Mankey,
        ]
      },
      greatball: {
        [CATCH_CHARM_SWSH]: [
          P.Primeape,
        ]
      }
    },
    svsegg: {
      pokeball: {
        [CATCH_CHARM_SWSH]: [
          P.Hoppip,
        ]
      },
      greatball: {
        [CATCH_CHARM_SWSH]: [
          P.Skiploom, P.Murkrow,
        ]
      },
      ultraball: {
        [CATCH_CHARM_SWSH]: [
          P.Scyther, P.Gyarados, P.Jumpluff,
        ]
      }
    },
    svspickle: {
      greatball: {
        [CATCH_CHARM_SWSH]: [
          P.Growlithe,
        ]
      }
    },
    svsnoodle: {
      pokeball: {
        [CATCH_CHARM_SWSH]: [
          P.Venonat, P.Grimer, P.Gastly,
        ]
      },
      greatball: {
        [CATCH_CHARM_SWSH]: [
          P.Venomoth, P.Muk, P.Haunter,
        ]
      }
    },
    svsnouveau: {
      pokeball: {
        [CATCH_CHARM_SWSH]: [
          P.Jigglypuff, P.Marill,
        ]
      },
      greatball: {
        [CATCH_CHARM_SWSH]: [
          P.Azumarill,
        ]
      }
    },
    svspotatosalad: {
      pokeball: {
        [CATCH_CHARM_SWSH]: [
          P.Gastly,
        ],
      },
      greatball: {
        [CATCH_CHARM_SWSH]: [
          P.Haunter, P.Misdreavus,
        ]
      }
    },
    svssmoky: {
      pokeball: {
        [CATCH_CHARM_SWSH]: [
          P.Slowpoke, P.Drowzee,
        ]
      },
      greatball: {
        [CATCH_CHARM_SWSH]: [
          P.Slowbro, P.Hypno,
        ]
      }
    },
    svssushi: {
      greatball: {
        [CATCH_CHARM_SWSH]: [
          P.Murkrow,
        ]
      }
    },
    svshamburger: {
      greatball: {
        [CATCH_CHARM_SWSH]: [
          P.Dratini,
        ]
      },
      ultraball: {
        [CATCH_CHARM_SWSH]: [
          P.Dragonair,
        ]
      }
    },
    svshefty: {
      pokeball: {
        [CATCH_CHARM_SWSH]: [
          P.Magnemite,
        ]
      },
      greatball: {
        [CATCH_CHARM_SWSH]: [
          P.Magneton,
        ]
      }
    },
    svsvegetable: {
      pokeball: {
        [CATCH_CHARM_SWSH]: [
          P.Psyduck, P.Slowpoke, P.Shellder, P.Magikarp,
          P.Marill,
        ]
      },
      greatball: {
        [CATCH_CHARM_SWSH]: [
          P.Golduck, P.Slowbro,
          P.Azumarill
        ]
      },
      ultraball: {
        [CATCH_CHARM_SWSH]: [
          P.Gyarados,
        ]
      }
    },
    svsklawf: {
      pokeball: {
        [CATCH_CHARM_SWSH]: [
          P.Hoppip, P.Sunkern,
        ]
      },
      greatball: {
        [CATCH_CHARM_SWSH]: [
          P.Skiploom,
        ]
      },
      ultraball: {
        [CATCH_CHARM_SWSH]: [
          P.Jumpluff,
        ]
      }
    },
    svsavocado: {
      pokeball: {
        [CATCH_CHARM_SWSH]: [
          P.Pikachu, P.Magnemite, P.Voltorb,
          P.Mareep,
        ]
      },
      greatball: {
        [CATCH_CHARM_SWSH]: [
          P.Magneton, P.Electrode,
          P.Flaaffy,
        ]
      },
      ultraball: {
        [CATCH_CHARM_SWSH]: [
          P.Ampharos,
        ]
      }
    },
    svsjambon: {
      pokeball: {
        [CATCH_CHARM_SWSH]: [
          P.Diglett,
        ]
      },
      greatball: {
        [CATCH_CHARM_SWSH]: [
          P.Dugtrio,
        ]
      },
    },
    svsblt: {
      greatball: {
        [CATCH_CHARM_SWSH]: [
          P.Sudowoodo,
        ]
      }
    }
  }
  // We need to file this twice
  // First, for the addIf backend impl
  // Second, for generating frontend listings
  if (format === 'List') {
    const gateMap: Record<Gate, BadgeId[]> = baitBallPkmnMap[bait][pokeball] ?? {}
    for (const [gate, encounters] of Object.entries(gateMap)) {
      for (const pkmn of encounters) {
        list.push(...addIf(pkmn, {gate: gate as Gate, count: 1}, p))
      }
    }
  } else {
    for (const [bait, ballMap] of Object.entries(baitBallPkmnMap)) {
      for (const [ball, gateMap] of Object.entries(ballMap)) {
        for (const [gate, encounters] of Object.entries(gateMap)) {
          for (const pkmn of encounters) {
            list.push(...addIf(pkmn, {gate: gate as Gate, bait: bait as ItemId, item: [ball as ItemId]}, p))
          }
        }
      }
    }
  }

  return {
    list,
    shinyMultipler: 3 * (baitDb?.shiny ?? 1),
    guaranteedItem: () => {
      return ''
    },
  }
}

const ENCOUNTERS_NONE = () => {
  return {
    shinyMultipler: 0,
    list: [],
    guaranteedItem: nop,
  }
}

function fromDatabase(gift: ItemId) {
  return [
    ...fromRegion(Pkmn.datastore, gift),
  ]
}
  
function fromRegion(region: {[key in BadgeId]?: PokemonDoc}, gift: ItemId) {
  const ids: string[] = []
  const entries = Object.entries(region)
  entries.forEach(value => {
    const [key, pokemon] = value
    if (pokemon!.release === gift) {
      ids.push(key)
    }
  })
  return ids
}

// repeatball: Don't allow just _any_ Pokémon to be recaught
const invalidList = [
  ...fromDatabase('ultraball'),
  P.Graveler, P.Kadabra, P.Haunter, P.Machoke, // Too easy to spam-create trades for Ultra Balls
  P.Articuno, P.Zapdos, P.Moltres, P.Mewtwo, P.Mew,
  P.Raikou, P.Entei, P.Suicune, P.Lugia, P.Ho_Oh, P.Celebi,
  P.Regirock, P.Regice, P.Registeel, P.Latias, P.Latios,
  P.Kyogre, P.Groudon, P.Rayquaza, P.Jirachi, P.Deoxys,
  P.Deoxys_Attack, P.Deoxys_Defense, P.Deoxys_Speed,
]

type EncounterKey = PokeballId | LureId | 'campinggear'

type EncounterFn = (user: Users.Doc, time: Date, location: Location,
  format: EncounterParamFormat, params: Record<string, string>) => Encounter;

type EncounterTable = Record<EncounterKey, EncounterFn>;

interface Encounter {
  shinyMultipler: number
  list: BadgeId[]
  guaranteedItem: (species: string, time: Date, location: Location,
      user: Users.Doc) => (ItemId | string)
}

export const ENCOUNTERS: EncounterTable = {
  pokeball: ENCOUNTERS_COMMON,
  greatball: ENCOUNTERS_UNCOMMON,
  ultraball: ENCOUNTERS_RARE,
  masterball: ENCOUNTERS_LEGENDARY,
  safariball: ENCOUNTERS_SAFARI,
  fastball: ENCOUNTERS_WHITE_APRICORN,
  friendball: ENCOUNTERS_GREEN_APRICORN,
  heavyball: ENCOUNTERS_BLACK_APRICORN,
  levelball: ENCOUNTERS_RED_APRICORN,
  loveball: ENCOUNTERS_PINK_APRICORN,
  lureball: ENCOUNTERS_BLUE_APRICORN,
  moonball: ENCOUNTERS_YELLOW_APRICORN,
  competitionball: ENCOUNTERS_BUG_CATCHING,
  diveball: ENCOUNTERS_DIVE,
  luxuryball: ENCOUNTERS_LUXURY,
  nestball: ENCOUNTERS_NEST,
  netball: ENCOUNTERS_NET,
  duskball: ENCOUNTERS_DUSK,
  quickball: ENCOUNTERS_QUICK,
  dreamball: ENCOUNTERS_DREAM,
  repeatball: (user) => {
    // Event Pokémon, like Fancy Vivillon, are not going to be repeat-able even though they aren't rare.
    const validBadges = getAllPokemon(user, (x => new Badge(x).personality.pokeball !== 'cherishball')).map(
      x => {
        const badge = new TeamsBadge(x)
        badge.shiny = false
        badge.variant = undefined
        // Keep Gender & Form
        return badge.toString()
      }
    ).filter(
      badge => {
        // const canBeShiny = TeamsBadge.match(badge, SHINY_LIST, MATCH_REQS).match
        return !invalidList.includes(badge)
        // return canBeShiny && !invalidList.includes(badge)
      })
    return {
      shinyMultipler: 2,
      list: validBadges as BadgeId[],
      guaranteedItem: nop,
    }
  },
  premierball: (a, b, c, d) => {
    const {list, guaranteedItem} = ENCOUNTERS_COMMON(a, b, c, d)
    return {
      shinyMultipler: 3,
      list,
      guaranteedItem
    }
  },
  // Placed here for completion
  beastball: ENCOUNTERS_BEASTBALL,
  cherishball: ENCOUNTERS_NONE,
  leadenball: ENCOUNTERS_LEADENBALL,
  gigatonball: ENCOUNTERS_GIGATONBALL,
  featherball: ENCOUNTERS_FEATHERBALL,
  wingball: ENCOUNTERS_WINGBALL,
  jetball: ENCOUNTERS_JETBALL,
  originball: ENCOUNTERS_NONE,
  strangeball: ENCOUNTERS_NONE,
  // Lure encounters
  trophygardenkey: ENCOUNTERS_BACKLOT,
  friendsafaripass: ENCOUNTER_FRIENDSAFARI,
  colressmchn: ENCOUNTERS_HIDDENGROTTO,
  adrenalineorb: ENCOUNTERS_ADRENALINE,
  campinggear: ENCOUNTERS_BAIT,
  rotombike: ENCOUNTERS_WILDAREA,
}

type HoldItemTable = Partial<Record<BadgeId, ItemId[]>>

/** 5% chance of finding an item. These items tend to be rare. */
export const HOLD_ITEMS_5: HoldItemTable = {
  [P.Squirtle]: ['blackglasses'],
  [P.Butterfree]: ['silverpowder'],
  [P.Beedrill]: ['poisonbarb'],
  [P.Rattata]: ['chilan'],
  [P.Raticate]: ['chilan'],
  [P.Fearow]: ['healthwing', 'swiftwing'],
  [P.Pikachu]: ['lightball', 'strangesouvenir'],
  [P.Raichu]: ['lightball'],
  [P.Clefairy]: ['moonstone'],
  [P.Clefable]: ['starpiece'],
  [P.Paras]: ['bigmushroom'],
  [P.Parasect]: ['bigmushroom'],
  [P.Venomoth]: ['shedshell'],
  [P.Dugtrio]: ['softsand'],
  [P.Mankey]: ['payapa'],
  [P.Primeape]: ['payapa'],
  [P.Poliwhirl]: ['kingsrock'],
  [P.Kadabra]: ['twistedspoon'],
  [P.Alakazam]: ['twistedspoon'],
  [P.Machop]: ['blackbelt'],
  [P.Machoke]: ['focusband'],
  [P.Machamp]: ['expertbelt'],
  [P.Weepinbell]: ['leafstone'],
  [P.Geodude]: ['everstone'],
  [P.Graveler]: ['everstone'],
  [P.Golem]: ['everstone'],
  [P.Ponyta]: ['shuca'],
  [P.Rapidash]: ['shuca'],
  [P.Slowpoke]: ['kingsrock'],
  [P.Magnemite]: ['magnet'],
  [P.Magneton]: ['magnet', 'metalcoat'],
  [P.Farfetchd]: ['leek'],
  [P.Dodrio]: ['sharpbeak'],
  [P.Grimer]: ['nugget'],
  [P.Muk]: ['nugget'],
  [P.Shellder]: ['bigpearl'],
  [P.Cloyster]: ['bigpearl'],
  [P.Onix]: ['nugget'],
  [P.Voltorb]: ['casterfern'], // FIXME: Hisuian only
  [P.Electrode]: ['casterfern'], // FIXME: Hisuian only
  [P.Exeggcute]: ['strangesouvenir'],
  [P.Cubone]: ['strangesouvenir'],
  [P.Marowak]: ['thickclub'],
  [P.Hitmonlee]: ['protein'],
  [P.Hitmonchan]: ['iron'],
  [P.Lickitung]: ['casterfern'],
  [P.Koffing]: ['smokeball'],
  [P.Weezing]: ['smokeball'],
  [P.Chansey]: ['luckypunch', 'ovalstone'],
  [P.Horsea]: ['dragonscale'],
  [P.Seadra]: ['dragonscale'],
  [P.Staryu]: ['starpiece'],
  [P.Starmie]: ['starpiece'],
  [P.Mr_Mime]: ['leppa'],
  [P.Scyther]: ['silverpowder'],
  [P.Jynx]: ['nevermeltice'],
  [P.Electabuzz]: ['electirizer'],
  [P.Magmar]: ['magmarizer'],
  [P.Gyarados]: ['deepseatooth'],
  [P.Lapras]: ['mysticwater'],
  [P.Ditto]: ['metalpowder', 'quickpowder'],
  [P.Snorlax]: ['leftovers', 'sitrus'],
  [P.Dratini]: ['dragonscale'],
  [P.Dragonair]: ['dragonscale'],
  [P.Dragonite]: ['dragonfang'],
  [P.Typhlosion]: ['kingsleaf'], // Hisuian only
  [P.Sentret]: ['oran'],
  [P.Furret]: ['sitrus'],
  [P.Chinchou]: ['deepseascale'],
  [P.Lanturn]: ['deepseascale'],
  [P.Cleffa]: ['moonstone'],
  [P.Marill]: ['mysticwater'],
  [P.Azumarill]: ['mysticwater'],
  [P.Politoed]: ['kingsrock'],
  [P.Jumpluff]: ['miracleseed'],
  [P.Sunkern]: ['coba'],
  [P.Yanma]: ['widelens'],
  [P.Murkrow]: ['blackglasses'],
  [P.Slowking]: ['kingsrock'],
  [P.Misdreavus]: ['spelltag'],
  [P.Girafarig]: ['persim'],
  [P.Gligar]: ['razorfang'],
  [P.Steelix]: ['metalcoat'],
  [P.Scizor]: ['metalcoat'],
  [P.Qwilfish]: ['poisonbarb'],
  [P.Sneasel]: ['quickclaw', 'razorclaw'],
  [P.Teddiursa]: ['sitrus'],
  [P.Ursaring]: ['sitrus'],
  [P.Magcargo]: ['hardstone'],
  [P.Piloswine]: ['nevermeltice'],
  [P.Corsola]: ['redshard'],
  [P.Delibird]: ['nugget', 'bignugget'],
  [P.Skarmory]: ['resistwing', 'cleverwing'],
  [P.Kingdra]: ['dragonscale'],
  [P.Phanpy]: ['passho'],
  [P.Donphan]: ['passho'],
  [P.Porygon2]: ['upgrade'],
  [P.Elekid]: ['electirizer'],
  [P.Magby]: ['magmarizer'],
  // [P.Ho_Oh]: 'sacredash',
  [P.Poochyena]: ['pecha'],
  [P.Mightyena]: ['pecha'],
  [P.Zigzagoon]: ['oran'],
  [P.Linoone]: ['sitrus'],
  [P.Beautifly]: ['silverpowder', 'shedshell'],
  [P.Dustox]: ['silverpowder', 'shedshell'],
  [P.Lotad]: ['mentalherb'],
  [P.Lombre]: ['mentalherb'],
  [P.Ludicolo]: ['mentalherb'],
  [P.Seedot]: ['powerherb'],
  [P.Nuzleaf]: ['powerherb'],
  [P.Shiftry]: ['powerherb'],
  [P.Taillow]: ['charti'],
  [P.Swellow]: ['charti'],
  [P.Surskit]: ['honey'],
  [P.Masquerain]: ['silverpowder'],
  [P.Shroomish]: ['kebia'],
  [P.Breloom]: ['kebia'],
  [P.Nincada]: ['softsand'],
  [P.Whismur]: ['chesto'],
  [P.Loudred]: ['chesto'],
  [P.Exploud]: ['chesto'],
  [P.Makuhita]: ['blackbelt'],
  [P.Hariyama]: ['kingsrock'],
  [P.Nosepass]: ['hardstone'],
  [P.Sableye]: ['stardust'],
  [P.Mawile]: ['occa'],
  [P.Skitty]: ['leppa'],
  [P.Delcatty]: ['leppa'],
  [P.Aron]: ['hardstone'],
  [P.Lairon]: ['hardstone'],
  [P.Aggron]: ['hardstone'],
  [P.Roselia]: ['poisonbarb'],
  [P.Gulpin]: ['bigpearl'],
  [P.Swalot]: ['bigpearl'],
  [P.Carvanha]: ['deepseatooth'],
  [P.Sharpedo]: ['deepseatooth'],
  [P.Spoink]: ['tanga'],
  [P.Grumpig]:['tanga'],
  [P.Seviper]: ['shedshell'],
  [P.Spinda]: ['chesto'],
  [P.Trapinch]: ['softsand'],
  [P.Flygon]: ['softsand'],
  [P.Cacnea]: ['poisonbarb'],
  [P.Cacturne]:[ 'poisonbarb'],
  [P.Zangoose]: ['quickclaw'],
  [P.Lunatone]: ['moonstone'],
  [P.Solrock]: ['sunstone'],
  [P.Baltoy]: ['lightclay'],
  [P.Claydol]: ['lightclay'],
  [P.Lileep]: ['bigroot'],
  [P.Cradily]: ['bigroot'],
  [P.Milotic]: ['mysticwater'],
  [P.Kecleon]: ['persim'],
  [P.Shuppet]: ['spelltag'],
  [P.Banette]: ['spelltag'],
  [P.Duskull]: ['kasib'],
  [P.Dusclops]: ['kasib', 'reapercloth'],
  [P.Chimecho]: ['colbur'],
  [P.Snorunt]: ['babiri'],
  [P.Glalie]: ['babiri', 'nevermeltice'],
  [P.Clamperl]: ['blueshard'],
  [P.Huntail]: ['deepseatooth'],
  [P.Gorebyss]: ['deepseascale'],
  [P.Walrein]: ['expcandyl'],
  [P.Relicanth]: ['greenshard'],
  [P.Bagon]: ['dragonfang'],
  [P.Shelgon]: ['dragonfang'],
  [P.Salamence]: ['dragonscale'],
  [P.Beldum]: ['metalcoat'],
  [P.Metang]: ['metalcoat'],
  [P.Metagross]: ['metalcoat'],
  [P.Latias]: ['souldew'],
  [P.Latios]: ['souldew'],
  [P.Jirachi]: ['starpiece'],
  [P.Kricketot]: ['metronome'],
  [P.Kricketune]: ['metronome'],
  [P.Budew]: ['poisonbarb'],
  [P.Roserade]: ['poisonbarb'],
  [P.Wormadam]: ['poisonbarb'],
  [P.Mothim]: ['poisonbarb'],
  [P.Vespiquen]: ['poisonbarb'],
  [P.Buizel]: ['wacan'],
  [P.Floatzel]: ['wacan'],
  [P.Cherubi]: ['miracleseed'],
  [P.Cherrim]: ['miracleseed'],
  [P.Ambipom]: ['nanab'],
  [P.Drifblim]: ['airballoon'],
  [P.Buneary]: ['chople'],
  [P.Lopunny]: ['chople'],
  [P.Chingling]: ['colbur'],
  [P.Happiny]: ['luckypunch'],
  [P.Chatot]: ['metronome'],
  [P.Gible]: ['haban'],
  [P.Gabite]: ['haban'],
  [P.Garchomp]: ['haban'],
  [P.Skorupi]: ['poisonbarb'],
  [P.Drapion]: ['poisonbarb'],
  [P.Croagunk]: ['blacksludge'],
  [P.Toxicroak]: ['blacksludge'],
  [P.Finneon]: ['rindo'],
  [P.Lumineon]: ['rindo'],
  [P.Snover]: ['nevermeltice', 'snowball'],
  [P.Abomasnow]: ['nevermeltice', 'snowball'],
  [P.Rhyperior]: ['protector'],
  [P.Weavile]: ['razorclaw'],
  [P.Gliscor]: ['razorfang'],
  [P.Magnezone]: ['metalcoat'],
  [P.Lickilicky]: ['laggingtail'],
  [P.Porygon_Z]: ['skytumblestone'],
  [P.Electivire]: ['electirizer'],
  [P.Magmortar]: ['magmarizer'],
  [P.Mamoswine]: ['nevermeltice'],
  [P.Yanmega]: ['widelens'],
  [P.Probopass]: ['hardstone'],
  [P.Dusknoir]: ['kasib'],
  [P.Froslass]: ['babiri'],
  [P.Simisage]: ['occa'],
  [P.Simisear]: ['passho'],
  [P.Simipour]: ['rindo'],
  [P.Roggenrola]: ['hardstone'],
  [P.Boldore]: ['hardstone'],
  [P.Gigalith]: ['hardstone'],
  [P.Audino]: ['sitrus'],
  [P.Throh]: ['expertbelt'],
  [P.Sawk]: ['expertbelt'],
  [P.Sewaddle]: ['mentalherb'],
  [P.Swadloon]: ['mentalherb'],
  [P.Leavanny]: ['mentalherb'],
  [P.Venipede]: ['poisonbarb'],
  [P.Whirlipede]: ['poisonbarb'],
  [P.Scolipede]: ['poisonbarb'],
  [P.Basculin]: ['deepseatooth'],
  [P.Maractus]: ['miracleseed'],
  [P.Dwebble]: ['rarebone'],
  [P.Crustle]: ['rarebone'],
  [P.Scraggy]: ['shedshell'],
  [P.Scrafty]: ['shedshell'],
  [P.Yamask]: ['spelltag'],
  [P.Cofagrigus]: ['spelltag'],
  [P.Trubbish]: ['blacksludge'],
  [P.Garbodor]: ['nugget'],
  [P.Foongus]: ['bigmushroom'],
  [P.Amoonguss]: ['balmmushroom'],
  [P.Ferroseed]: ['stickybarb'],
  [P.Ferrothorn]: ['stickybarb'],
  [P.Cryogonal]: ['nevermeltice'],
  [P.Stunfisk]: ['softsand'],
  [P.Druddigon]: ['dragonfang'],
  [P.Golett]: ['lightclay'],
  [P.Golurk]: ['lightclay'],
  [P.Rufflet]: ['sootfootroot'],
  [P.Braviary]: ['musclewing', 'geniuswing'],
  [P.Mandibuzz]: ['musclewing', 'geniuswing'],
  [P.Pancham]: ['mentalherb'],
  [P.Pangoro]: ['mentalherb'],
  [P.Hawlucha]: ['kingsrock'],
  [P.Goomy]: ['shedshell'],
  [P.Sliggoo]: ['shedshell'],
  [P.Pikipek]: ['oran'],
  [P.Trumbeak]: ['sitrus'],
  [P.Toucannon]: ['rawst'],
  [P.Yungoos]: ['pecha'],
  [P.Gumshoos]: ['pecha'],
  [P.Charjabug]: ['cellbattery'],
  [P.Vikavolt]: ['thunderstone'],
  [P.Crabrawler]: ['aspear'],
  [P.Crabominable]: ['cheri'],
  [P.Oricorio]: ['honey'],
  [P.Cutiefly]: ['honey'],
  [P.Ribombee]: ['honey'],
  [P.Mareanie]: ['poisonbarb'],
  [P.Toxapex]: ['poisonbarb'],
  [P.Mudbray]: ['lightclay'],
  [P.Mudsdale]: ['lightclay'],
  [P.Dewpider]: ['mysticwater'],
  [P.Araquanid]: ['mysticwater'],
  [P.Fomantis]: ['miracleseed'],
  [P.Lurantis]: ['miracleseed'],
  [P.Morelull]: ['bigmushroom'],
  [P.Shiinotic]: ['bigmushroom'],
  [P.Salandit]: ['smokeball'],
  [P.Salazzle]: ['smokeball'],
  [P.Bounsweet]: ['grassyseed'],
  [P.Steenee]: ['grassyseed'],
  [P.Comfey]: ['mistyseed'],
  [P.Sandygast]: ['spelltag', 'softsand'],
  [P.Palossand]: ['spelltag', 'softsand'],
  [P.Minior]: ['starpiece'],
  [P.Turtonator]: ['charcoal'],
  [P.Togedemaru]: ['electricseed'],
  [P.Mimikyu]: ['chesto'],
  [P.Bruxish]: ['razorfang', 'goldteeth'],
  [P.Drampa]: ['persim'],
  [P.Jangmo_o]: ['razorclaw'],
  [P.Hakamo_o]: ['razorclaw'],
  [P.Skwovet]: ['oran'],
  [P.Greedent]: ['sitrus'],
  [P.Dottler]: ['psychicseed'],
  [P.Orbeetle]: ['psychicseed'],
  [P.Applin]: ['tartapple', 'sweetapple'],
  [P.Sirfetchd]: ['leek'],
  [P.Snom]: ['snowball'],
  [P.Cufant]: ['laggingtail'],
  [P.Copperajah]: ['laggingtail'],
  [P.Kleavor]: ['wood'],
  [P.Toedschool]: ['tinymushroom'],
  [P.Toedscreul]: ['bigmushroom'],
  [P.Great_Tusk]: ['boosterenergy'],
  [P.Brute_Bonnet]: ['boosterenergy'],
  [P.Sandy_Shocks]: ['boosterenergy'],
  [P.Scream_Tail]: ['boosterenergy'],
  [P.Flutter_Mane]: ['boosterenergy'],
  [P.Slither_Wing]: ['boosterenergy'],
  [P.Roaring_Moon]: ['boosterenergy'],
  [P.Iron_Treads]: ['boosterenergy'],
  [P.Iron_Moth]: ['boosterenergy'],
  [P.Iron_Hands]: ['boosterenergy'],
  [P.Iron_Jugulis]: ['boosterenergy'],
  [P.Iron_Thorns]: ['boosterenergy'],
  [P.Iron_Bundle]: ['boosterenergy'],
  [P.Iron_Valiant]: ['boosterenergy'],
}

/** 15% chance of finding an item. These items tend to be more common or topical. */
export const HOLD_ITEMS_15: HoldItemTable = {
  [P.Raticate]: ['oran'],
  [P.Fearow]: ['sharpbeak'],
  [P.Pikachu]: ['oran'],
  [P.Clefairy]: ['leppa'],
  [P.Clefable]: ['leppa'],
  [P.Vulpix]: ['rawst'],
  [P.Ninetales]: ['rawst'],
  [P.Paras]: ['tinymushroom'],
  [P.Parasect]: ['bigmushroom'],
  [P.Growlithe]: ['rawst'],
  [P.Arcanine]: ['rawst'],
  [P.Seel]: ['aspear'],
  [P.Dewgong]: ['aspear'],
  [P.Shellder]: ['pearl'],
  [P.Cloyster]: ['pearl'],
  [P.Staryu]: ['stardust'],
  [P.Starmie]: ['stardust'],
  [P.Jynx]: ['aspear'],
  [P.Magmar]: ['rawst'],
  [P.Ditto]: ['quickpowder'],
  [P.Snorlax]: ['leftovers'],
  [P.Furret]: ['oran'],
  [P.Cleffa]: ['leppa'],
  [P.Shuckle]: ['oran'],
  [P.Teddiursa]: ['oran'],
  [P.Ursaring]: ['oran'],
  [P.Swinub]: ['aspear'],
  [P.Piloswine]: ['aspear'],
  [P.Skarmory]: ['sharpbeak'],
  [P.Smoochum]: ['aspear'],
  [P.Magby]: ['rawst'],
  [P.Linoone]: ['oran'],
  [P.Wingull]: ['prettywing'],
  [P.Pelipper]: ['prettywing'],
  [P.Numel]: ['rawst'],
  [P.Camerupt]: ['rawst'],
  [P.Lunatone]: ['stardust'],
  [P.Solrock]: ['stardust'],
  [P.Feebas]: ['prismscale'],
  [P.Castform]: ['mysticwater'],
  [P.Clamperl]: ['pearl'],
  [P.Luvdisc]: ['heartscale'],
  [P.Bibarel]: ['oran'],
  [P.Shinx]: ['cheri'],
  [P.Luxio]: ['cheri'],
  [P.Luxray]: ['cheri'],
  [P.Combee]: ['honey'],
  [P.Buneary]: ['pecha'],
  [P.Lopunny]: ['pecha'],
  [P.Happiny]: ['ovalstone'],
  [P.Munchlax]: ['leftovers'],
  [P.Weavile]: ['gripclaw'],
  [P.Rotom]: ['brokenlight'],
  [P.Shaymin]: ['lum'],
  [P.Pansage]: ['oran'],
  [P.Simisage]: ['occa'],
  [P.Pansear]: ['oran'],
  [P.Simisear]: ['passho'],
  [P.Panpour]: ['oran'],
  [P.Simipour]: ['rindo'],
  [P.Blitzle]: ['cheri'],
  [P.Zebstrika]: ['cheri'],
  [P.Roggenrola]: ['everstone'],
  [P.Boldore]: ['everstone'],
  [P.Gigalith]: ['everstone'],
  [P.Audino]: ['oran'],
  [P.Tympole]: ['persim'],
  [P.Palpitoad]: ['persim'],
  [P.Seismitoad]: ['persim'],
  [P.Throh]: ['blackbelt'],
  [P.Sawk]: ['blackbelt'],
  [P.Venipede]: ['pecha'],
  [P.Whirlipede]: ['pecha'],
  [P.Scolipede]: ['pecha'],
  [P.Darumaka]: ['rawst'],
  [P.Darmanitan]: ['rawst'],
  [P.Dwebble]: ['hardstone'],
  [P.Crustle]: ['hardstone'],
  [P.Garbodor]: ['blacksludge'],
  [P.Minccino]: ['chesto'],
  [P.Cinccino]: ['chesto'],
  [P.Emolga]: ['cheri'],
  [P.Foongus]: ['tinymushroom'],
  [P.Amoonguss]: ['bigmushroom'],
  [P.Cubchoo]: ['aspear'],
  [P.Beartic]: ['aspear'],
  [P.Volcarona]: ['silverpowder'],
  [P.Meloetta]: ['starpiece'],
  [P.Pumpkaboo]: ['miracleseed'],
  [P.Morelull]: ['tinymushroom'],
  [P.Shiinotic]: ['tinymushroom'],
  [P.Tsareena]: ['grassyseed'],
  [P.Kommo_o]: ['razorclaw'],
  // [P.Toedscreul]: ['tinymushroom'],
}

/** 50% chance of finding an item. These items are common and normally materials. */
export const HOLD_ITEMS_50: HoldItemTable = {
  [P.Pikachu]: ['oran'],
  [P.Raichu]: ['oran'],
  [P.Sandshrew]: ['tmm_sandshrew'],
  [P.Sandslash]: ['tmm_sandshrew'],
  [P.Clefairy]: ['leppa'],
  [P.Clefable]: ['leppa'],
  [P.Vulpix]: ['aspear', 'tmm_vulpix'],
  [P.Ninetales]: ['rawst', 'tmm_vulpix'],
  [P.Jigglypuff]: ['tmm_igglybuff'],
  [P.Wigglytuff]: ['tmm_igglybuff'],
  [P.Zubat]: ['chesto'],
  [P.Golbat]: ['chesto'],
  [P.Paras]: ['springymushroom'],
  [P.Parasect]: ['springymushroom'],
  [P.Diglett]: ['tmm_diglett'],
  [P.Dugtrio]: ['tmm_diglett'],
  [P.Meowth]: ['tmm_meowth'],
  [P.Persian]: ['tmm_meowth'],
  [P.Growlithe]: ['tmm_growlithe'],
  [P.Arcanine]: ['tmm_growlithe'],
  [P.Abra]: ['hopo'],
  [P.Kadabra]: ['hopo'],
  [P.Alakazam]: ['hopo'],
  [P.Machop]: ['tumblestone'],
  [P.Machoke]: ['tumblestone'],
  [P.Machamp]: ['tumblestone'],
  [P.Geodude]: ['tumblestone'],
  [P.Graveler]: ['tumblestone'],
  [P.Golem]: ['tumblestone'],
  [P.Ponyta]: ['rawst'],
  [P.Rapidash]: ['rawst'],
  [P.Tentacool]: ['pecha'],
  [P.Tentacruel]: ['pecha'],
  [P.Slowpoke]: ['tmm_slowpoke'],
  [P.Slowbro]: ['tmm_slowpoke'],
  [P.Magnemite]: ['ironchunk', 'tmm_magnemite'],
  [P.Magneton]: ['ironchunk', 'tmm_magnemite'],
  [P.Farfetchd]: ['leek'],
  [P.Grimer]: ['tmm_grimer'],
  [P.Muk]: ['tmm_grimer'],
  [P.Gastly]: ['chesto', 'tmm_gastly'],
  [P.Haunter]: ['chesto', 'tmm_gastly'],
  [P.Gengar]: ['chesto', 'tmm_gastly'],
  [P.Onix]: ['blacktumblestone'],
  [P.Drowzee]: ['tmm_drowzee'],
  [P.Hypno]: ['tmm_drowzee'],
  [P.Voltorb]: ['casterfern', 'tmm_voltorb'], // FIXME: Hisuian only
  [P.Electrode]: ['casterfern', 'tmm_voltorb'], // FIXME: Hisuian only
  [P.Lickitung]: ['casterfern'],
  [P.Rhyhorn]: ['blacktumblestone'],
  [P.Rhydon]: ['blacktumblestone'],
  [P.Chansey]: ['razz', 'tmm_happiny'],
  [P.Mr_Mime]: ['chesto'],
  [P.Scyther]: ['wood', 'tmm_scyther'],
  [P.Electabuzz]: ['cheri'],
  [P.Magmar]: ['rawst'],
  [P.Tauros]: ['tmm_tauros'],
  [P.Magikarp]: ['tumblestone', 'tmm_magikarp'],
  [P.Gyarados]: ['skytumblestone', 'tmm_magikarp'],
  [P.Eevee]: ['razz'],
  [P.Vaporeon]: ['razz'],
  [P.Jolteon]: ['razz'],
  [P.Flareon]: ['razz'],
  [P.Porygon]: ['skytumblestone'],
  [P.Snorlax]: ['sitrus'],
  [P.Dratini]: ['tmm_dratini'],
  [P.Dragonair]: ['tmm_dratini'],
  [P.Dragonite]: ['tmm_dratini'],
  [P.Typhlosion]: ['kingsleaf'], // Hisuian only
  [P.Crobat]: ['chesto'],
  [P.Pichu]: ['oran'],
  [P.Cleffa]: ['leppa'],
  [P.Igglybuff]: ['tmm_igglybuff'],
  [P.Togepi]: ['leppa'],
  [P.Togetic]: ['leppa'],
  [P.Hoppip]: ['tmm_hoppip'],
  [P.Skiploom]: ['tmm_hoppip'],
  [P.Jumpluff]: ['tmm_hoppip'],
  [P.Mareep]: ['tmm_mareep'],
  [P.Flaaffy]: ['tmm_mareep'],
  [P.Ampharos]: ['tmm_mareep'],
  [P.Marill]: ['azurillfur'],
  [P.Azumarill]: ['azurillfur'],
  [P.Sudowoodo]: ['blacktumblestone', 'tmm_bonsly'],
  [P.Aipom]: ['nanab'],
  [P.Sunkern]: ['tmm_sunkern'],
  [P.Sunflora]: ['tmm_sunkern'],
  [P.Yanma]: ['heartygrains'],
  [P.Wooper]: ['tmm_wooper'],
  [P.Quagsire]: ['tmm_wooper'],
  [P.Espeon]: ['razz'],
  [P.Umbreon]: ['razz'],
  [P.Murkrow]: ['plumpbeans'],
  [P.Slowking]: ['tmm_slowpoke'],
  [P.Pineco]: ['tmm_pineco'],
  [P.Forretress]: ['tmm_pineco'],
  [P.Gligar]: ['crunchysalt'],
  [P.Steelix]: ['ironchunk'],
  [P.Scizor]: ['ironchunk', 'tmm_scyther'],
  [P.Qwilfish]: ['tmm_qwilfish'],
  [P.Sneasel]: ['tmm_sneasel'],
  [P.Heracross]: ['dazzlinghoney'],
  [P.Teddiursa]: ['dazzlinghoney', 'teddiursaclaw'],
  [P.Ursaring]: ['dazzlinghoney', 'teddiursaclaw'],
  [P.Swinub]: ['crunchysalt', 'tmm_swinub'],
  [P.Piloswine]: ['crunchysalt', 'tmm_swinub'],
  [P.Delibird]: ['tmm_delibird'],
  [P.Mantine]: ['skytumblestone'],
  [P.Houndour]: ['tmm_houndour'],
  [P.Houndoom]: ['tmm_houndour'],
  [P.Phanpy]: ['tmm_phanpy'],
  [P.Donphan]: ['tmm_phanpy'],
  [P.Porygon2]: ['skytumblestone'],
  [P.Stantler]: ['tmm_stantler'],
  [P.Elekid]: ['cheri'],
  [P.Magby]: ['rawst'],
  [P.Blissey]: ['razz', 'ovalstone', 'tmm_happiny'],
  [P.Wurmple]: ['apricorn'],
  [P.Silcoon]: ['apricorn'],
  [P.Cascoon]: ['apricorn'],
  [P.Beautifly]: ['dazzlinghoney'],
  [P.Dustox]: ['dazzlinghoney'],
  [P.Seedot]: ['tmm_seedot'],
  [P.Nuzleaf]: ['tmm_seedot'],
  [P.Shiftry]: ['tmm_seedot'],
  [P.Slakoth]: ['tmm_slakoth'],
  [P.Vigoroth]: ['tmm_slakoth'],
  [P.Slaking]: ['tmm_slakoth'],
  [P.Makuhita]: ['tmm_makuhita'],
  [P.Hariyama]: ['tmm_makuhita'],
  [P.Nosepass]: ['ironchunk'],
  [P.Azurill]: ['azurillfur'],
  [P.Sableye]: ['tmm_sableye'],
  [P.Meditite]: ['tmm_meditite'],
  [P.Medicham]: ['tmm_meditite'],
  [P.Roselia]: ['heartygrains'],
  [P.Numel]: ['tmm_numel'],
  [P.Camerupt]: ['tmm_numel'],
  [P.Torkoal]: ['tmm_torkoal'],
  [P.Cacnea]: ['tmm_cacnea'],
  [P.Cacturne]: ['tmm_cacnea'],
  [P.Spoink]: ['tmm_spoink'],
  [P.Grumpig]: ['tmm_spoink'],
  [P.Zangoose]: ['tmm_zangoose'],
  [P.Swablu]: ['tmm_swablu'],
  [P.Altaria]: ['tmm_swablu'],
  [P.Barboach]: ['oran', 'tmm_barboach'],
  [P.Whiscash]: ['sitrus', 'tmm_barboach'],
  [P.Corphish]: ['tmm_corphish'],
  [P.Crawdaunt]: ['tmm_corphish'],
  [P.Feebas]: ['tmm_feebas'],
  [P.Milotic]: ['tmm_feebas'],
  [P.Tropius]: ['tmm_tropius'],
  [P.Chimecho]: ['skytumblestone'],
  [P.Shuppet]: ['tmm_shuppet'],
  [P.Banette]: ['tmm_shuppet'],
  [P.Luvdisc]: ['tmm_luvdisc'],
  [P.Snorunt]: ['tmm_snorunt'],
  [P.Glalie]: ['ironchunk', 'tmm_snorunt'],
  [P.Spheal]: ['plumpbeans', 'expcandyxs'],
  [P.Sealeo]: ['plumpbeans', 'expcandym'],
  [P.Turtwig]: ['oran'],
  [P.Grotle]: ['sitrus'],
  [P.Torterra]: ['sitrus', 'kingsleaf'],
  [P.Chimchar]: ['oran'],
  [P.Monferno]: ['sitrus'],
  [P.Infernape]: ['sitrus', 'kingsleaf'],
  [P.Piplup]: ['oran'],
  [P.Prinplup]: ['sitrus'],
  [P.Empoleon]: ['sitrus', 'kingsleaf'],
  [P.Starly]: ['yache', 'apricorn', 'tmm_starly'],
  [P.Staravia]: ['yache', 'apricorn', 'tmm_starly'],
  [P.Staraptor]: ['yache', 'apricorn', 'tmm_starly'],
  [P.Bidoof]: ['oran'],
  [P.Bibarel]: ['sitrus'],
  [P.Kricketot]: ['apricorn'],
  [P.Kricketune]: ['apricorn'],
  [P.Budew]: ['heartygrains'],
  [P.Roserade]: ['heartygrains'],
  [P.Burmy]: ['lum'],
  [P.Wormadam]: ['lum', 'kingsleaf'],
  [P.Mothim]: ['dazzlinghoney'],
  [P.Combee]: ['dazzlinghoney'],
  [P.Vespiquen]: ['dazzlinghoney'],
  [P.Pachirisu]: ['oran'],
  [P.Cherubi]: ['lum'],
  [P.Cherrim]: ['lum', 'kingsleaf'],
  [P.Shellos]: ['nanab', 'tmm_shellos'],
  [P.Gastrodon]: ['pinap', 'tmm_shellos'],
  [P.Buizel]: ['tmm_buizel'],
  [P.Floatzel]: ['tmm_buizel'],
  [P.Ambipom]: ['nanab'],
  [P.Cranidos]: ['blacktumblestone'],
  [P.Rampardos]: ['blacktumblestone'],
  [P.Shieldon]: ['blacktumblestone'],
  [P.Bastiodon]: ['blacktumblestone'],
  [P.Buneary]: ['oran'],
  [P.Lopunny]: ['oran'],
  [P.Glameow]: ['cheri', 'casterfern'],
  [P.Purugly]: ['cheri', 'casterfern'],
  [P.Pachirisu]: ['tmm_pachirisu'],
  [P.Honchkrow]: ['plumpbeans'],
  [P.Chingling]: ['skytumblestone'],
  [P.Stunky]: ['pecha'],
  [P.Skuntank]: ['pecha'],
  [P.Bronzor]: ['ironchunk', 'tmm_bronzor'],
  [P.Bronzong]: ['ironchunk', 'tmm_bronzor'],
  [P.Bonsly]: ['blacktumblestone', 'tmm_bonsly'],
  [P.Mime_Jr]: ['leppa', 'chesto'],
  [P.Happiny]: ['razz', 'tmm_happiny'],
  [P.Chatot]: ['plumpbeans'],
  [P.Munchlax]: ['sitrus'],
  [P.Gible]: ['crunchysalt', 'tmm_gible'],
  [P.Gabite]: ['crunchysalt', 'tmm_gible'],
  [P.Garchomp]: ['crunchysalt', 'tmm_gible'],
  [P.Finneon]: ['tmm_finneon'],
  [P.Lumineon]: ['tmm_finneon'],
  [P.Riolu]: ['ironchunk', 'tmm_riolu'],
  [P.Lucario]: ['ironchunk', 'tmm_riolu'],
  [P.Hippopotas]: ['sootfootroot', 'tmm_hippopotas'],
  [P.Hippowdon]: ['sootfootroot', 'tmm_hippopotas'],
  [P.Spiritomb]: ['tmm_spiritomb'],
  [P.Carnivine]: ['casterfern'],
  [P.Skorupi]: ['blacktumblestone'],
  [P.Drapion]: ['blacktumblestone'],
  [P.Croagunk]: ['tumblestone', 'tmm_croagunk'],
  [P.Toxicroak]: ['tumblestone', 'tmm_croagunk'],
  [P.Mantyke]: ['skytumblestone'],
  [P.Snover]: ['sootfootroot', 'tmm_snover'],
  [P.Abomasnow]: ['sootfootroot', 'tmm_snover'],
  [P.Leafeon]: ['razz'],
  [P.Glaceon]: ['razz'],
  [P.Rhyperior]: ['blacktumblestone'],
  [P.Togekiss]: ['leppa'],
  [P.Weavile]: ['tmm_sneasel'],
  [P.Gliscor]: ['crunchysalt'],
  [P.Magnezone]: ['ironchunk', 'tmm_magnemite'],
  [P.Lickilicky]: ['casterfern'],
  [P.Porygon_Z]: ['skytumblestone'],
  [P.Electivire]: ['cheri'],
  [P.Magmortar]: ['rawst'],
  [P.Mamoswine]: ['crunchysalt', 'tmm_swinub'],
  [P.Yanmega]: ['heartygrains'],
  [P.Probopass]: ['ironchunk'],
  [P.Froslass]: ['hopo', 'tmm_snorunt'],
  [P.Rotom]: ['tumblestone'],
  [P.Samurott]: ['kingsleaf'], // Hisuian only
  [P.Petilil]: ['tmm_petilil'],
  [P.Lilligant]: ['kingsleaf', 'tmm_petilil'], // Hisuian only
  [P.Sewaddle]: ['tmm_sewaddle'],
  [P.Swadloon]: ['tmm_sewaddle'],
  [P.Leavanny]: ['tmm_sewaddle'],
  [P.Timburr]: ['tmm_timburr'],
  [P.Gurdurr]: ['tmm_timburr'],
  [P.Conkeldurr]: ['tmm_timburr'],
  [P.Basculin]: ['tmm_basculin'],
  [P.Zorua]: ['tmm_zorua'],
  [P.Zoroark]: ['tmm_zorua'],
  [P.Gothita]: ['tmm_gothita'],
  [P.Gothorita]: ['tmm_gothita'],
  [P.Gothitelle]: ['tmm_gothita'],
  [P.Foongus]: ['tmm_foongus'],
  [P.Amoonguss]: ['tmm_foongus'],
  [P.Axew]: ['tmm_axew'],
  [P.Fraxure]: ['tmm_axew'],
  [P.Haxorus]: ['tmm_axew'],
  [P.Cubchoo]: ['tmm_cubchoo'],
  [P.Beartic]: ['tmm_cubchoo'],
  [P.Rufflet]: ['sootfootroot', 'tmm_rufflet'],
  [P.Braviary]: ['tmm_rufflet'],
  [P.Sylveon]: ['razz'],
  [P.Bergmite]: ['crunchysalt'],
  [P.Avalugg]: ['crunchysalt'], // Hisuian only
  [P.Larvesta]: ['tmm_larvesta'],
  [P.Volcarona]: ['tmm_larvesta'],
  [P.Scatterbug]: ['tmm_scatterbug'],
  [P.Spewpa]: ['tmm_scatterbug'],
  [P.Vivillon]: ['tmm_scatterbug'],
  [P.Fletchling]: ['tmm_fletchling'],
  [P.Fletchinder]: ['tmm_fletchling'],
  [P.Talonflame]: ['tmm_fletchling'],
  [P.Litleo]: ['tmm_litleo'],
  [P.Pyroar]: ['tmm_litleo'],
  [P.Skiddo]: ['tmm_skiddo'],
  [P.Gogoat]: ['tmm_skiddo'],
  [P.Flabébé]: ['tmm_flabebe'],
  [P.Floette]: ['tmm_flabebe'],
  [P.Florges]: ['tmm_flabebe'],
  [P.Dedenne]: ['tmm_dedenne'],
  [P.Klefki]: ['tmm_klefki'],
  [P.Goomy]: ['springymushroom', 'tmm_goomy'],
  [P.Sliggoo]: ['springymushroom', 'tmm_goomy'], // Hisuian only
  [P.Goodra]: ['springymushroom', 'tmm_goomy'], // Hisuian only
  [P.Noibat]: ['tmm_noibat'],
  [P.Noivern]: ['tmm_noibat'],
  [P.Decidueye]: ['kingsleaf'], // Hisuian only
  [P.Crabrawler]: ['tmm_crabrawler'],
  [P.Crabominable]: ['tmm_crabrawler'],
  [P.Oricorio]: ['tmm_oricorio'],
  [P.Rockruff]: ['tmm_rockruff'],
  [P.Lycanroc]: ['tmm_rockruff'],
  [P.Bounsweet]: ['tmm_bounsweet'],
  [P.Steenee]: ['tmm_bounsweet'],
  [P.Tsareena]: ['tmm_bounsweet'],
  [P.Fomantis]: ['tmm_fomantis'],
  [P.Lurantis]: ['tmm_fomantis'],
  [P.Mimikyu]: ['tmm_mimikyu'],
  [P.Komala]: ['tmm_komala'],
  [P.Sandygast]: ['tmm_sandyghast'],
  [P.Palossand]: ['tmm_sandyghast'],
  [P.Mudbray]: ['tmm_mudbray'],
  [P.Mudsdale]: ['tmm_mudbray'],
  [P.Salandit]: ['tmm_salandit'],
  [P.Salazzle]: ['tmm_salandit'],
  [P.Jangmo_o]: ['tmm_jangmoo'],
  [P.Hakamo_o]: ['tmm_jangmoo'],
  [P.Kommo_o]: ['tmm_jangmoo'],
  [P.Meltan]: ['meltancandy'],
  [P.Skwovet]: ['tmm_skwovet'],
  [P.Greedent]: ['tmm_skwovet'],
  [P.Rookidee]: ['tmm_rookidee'],
  [P.Corvisquire]: ['tmm_rookidee'],
  [P.Corviknight]: ['tmm_rookidee'],
  [P.Chewtle]: ['tmm_chewtle'],
  [P.Drednaw]: ['tmm_chewtle'],
  [P.Silicobra]: ['tmm_silicobra'],
  [P.Sandaconda]: ['tmm_silicobra'],
  [P.Rolycoly]: ['tmm_rolycoly'],
  [P.Carkol]: ['tmm_rolycoly'],
  [P.Coalossal]: ['tmm_rolycoly'],
  [P.Arrokuda]: ['tmm_arrokuda'],
  [P.Barraskewda]: ['tmm_arrokuda'],
  [P.Applin]: ['tmm_applin'],
  [P.Flapple]: ['tmm_applin'],
  [P.Appletun]: ['tmm_applin'],
  [P.Toxel]: ['tmm_toxel'],
  [P.Toxtricity]: ['tmm_toxel'],
  [P.Hatenna]: ['tmm_hatenna'],
  [P.Hattrem]: ['tmm_hatenna'],
  [P.Hatterene]: ['tmm_hatenna'],
  [P.Impidimp]: ['tmm_impidimp'],
  [P.Morgrem]: ['tmm_impidimp'],
  [P.Grimmsnarl]: ['tmm_impidimp'],
  [P.Sinistea]: ['tmm_sinistea'],
  [P.Polteageist]: ['tmm_sinistea'],
  [P.Falinks]: ['tmm_falinks'],
  [P.Pincurchin]: ['tmm_pincurchin'],
  [P.Indeedee]: ['tmm_indeedee'],
  [P.Snom]: ['tmm_snom'],
  [P.Frosmoth]: ['tmm_snom'],
  [P.Kleavor]: ['wood', 'tmm_scyther'],
  [P.Wyrdeer]: ['tmm_stantler'],
  [P.Basculegion]: ['tmm_basculin'],
  [P.Ursaluna]: ['teddiursaclaw'],
  [P.Lechonk]: ['tmm_lechonk'],
  [P.Oinkologne]: ['tmm_lechonk'],
  [P.Pawmi]: ['tmm_pawmi'],
  [P.Pawmo]: ['tmm_pawmi'],
  [P.Pawmot]: ['tmm_pawmi'],
  [P.Wattrel]: ['tmm_wattrel'],
  [P.Kilowattrel]: ['tmm_wattrel'],
  [P.Charcadet]: ['tmm_charcadet'],
  [P.Armarouge]: ['tmm_charcadet'],
  [P.Ceruledge]: ['tmm_charcadet'],
  [P.Greavard]: ['tmm_greavard'],
  [P.Houndstone]: ['tmm_greavard'],
  [P.Orthworm]: ['tmm_orthworm'],
  [P.Tadbulb]: ['tmm_tadbulb'],
  [P.Bellibolt]: ['tmm_tadbulb'],
  [P.Capsakid]: ['tmm_capsakid'],
  [P.Scovillain]: ['tmm_capsakid'],
  [P.Klawf]: ['tmm_klawf'],
  [P.Tinkatink]: ['tmm_tinkatink'],
  [P.Tinkatuff]: ['tmm_tinkatink'],
  [P.Tinkaton]: ['tmm_tinkatink'],
  [P.Nacli]: ['tmm_nacli'],
  [P.Naclstack]: ['tmm_nacli'],
  [P.Garganacl]: ['tmm_nacli'],
  [P.Toedscool]: ['tmm_toedscool'],
  [P.Toedscruel]: ['tmm_toedscool'],
  [P.Tandemaus]: ['tmm_tandemaus'],
  [P.Maushold]: ['tmm_tandemaus'],
  [P.Fidough]: ['tmm_fidough'],
  [P.Dachsbun]: ['tmm_fidough'],
  [P.Wiglett]: ['tmm_wiglett'],
  [P.Wugtrio]: ['tmm_wiglett'],
  [P.Squawkabilly]: ['tmm_squawkabilly'],
  [P.Finizen]: ['tmm_finizen'],
  [P.Palafin]: ['tmm_finizen'],
  [P.Flittle]: ['tmm_flittle'],
  [P.Espathra]: ['tmm_flittle'],
  [P.Bombirdier]: ['tmm_bombirdier'],
  [P.Tatsugiri]: ['tmm_tatsugiri'],
  [P.Dondozo]: ['tmm_dondozo'],
  [P.Frigibax]: ['tmm_frigibax'],
  [P.Arctibax]: ['tmm_frigibax'],
  [P.Baxcalibur]: ['tmm_frigibax'],
}
