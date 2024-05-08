// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Potw } from "../badge2";
import { RegionType, WeatherType } from "../locations-list";
import { BadgeId } from "../pokemon/types";
import * as P from '../gen/type-pokemon'

/**
 * ```@markdown
 * potw-615 Cryogonal (2)
 * potw-050-alolan Diglett (2)
 * potw-602 Tynamo (1)
 * potw-370 Luvdisc (1)
 * potw-058 Growlithe (1)
 * potw-023 Ekans (1)
 * potw-072 Tentacool (1)
 * potw-258 Mudkip (1)
 * ---
 * potw-851 Centiskorch (1)
 * potw-025-kalosian Pikachu (1)
 * potw-025-libre Pikachu (1)
 * potw-926 Fidough (1)
 * potw-821 Rookidee (1)
 * potw-116 Horsea (1)
 * potw-019-alolan Rattata (1)
 * potw-865 Sirfetch'd (1)
 * potw-203 Girafarig (1)
 * potw-761 Bounsweet (1)
 * potw-213 Shuckle (1)
 * potw-004 Charmander (1)
 * potw-025 Pikachu (1)
 * potw-501 Oshawott (1)
 * potw-007 Squirtle (1)
 * potw-387 Turtwig (1)
 * potw-074-alolan Geodude (1)
 * potw-855 Polteageist (1)
 * potw-610 Axew (1)
 * 29 votes in total
 * ```
 */
export const Swarms: Record<RegionType, BadgeId> = {
  'Africa / Middle East': P.Ekans,
  'Asia': P.Tynamo,
  'Australia / New Zealand': Potw(P.Diglett, {form: 'alolan'}),
  'Mediterranean': P.Mudkip,
  'North America': P.Cryogonal,
  "North Europe": P.Tentacool,
  "Pacific Islands": P.Luvdisc,
  "South America": P.Growlithe,
}

/**
 * Massive Mass Outbreaks are a feature that builds upon everyday swarms with
 * a more distinct appearance method. First, they are broken into applicable
 * weather types and selected from the same user polling with greater variety.
 * 
 * Second, their appearances are sudden and leave just as suddenly. You can
 * imagine as rain begins, a swarm of Pokémon suddenly come out of the
 * woodwork. So while their appearance depends on weather, it also depends
 * upon the location's latitude. For every decade of latitutde, that determines
 * the hour upon that outbreak. Additionally, the outbreak is confined to five
 * minutes before and after half-past a particular hour.
 */
export const MassiveOutbreaks: Record<WeatherType, BadgeId> = {
  Cloudy: P.Axew,
  'Diamond Dust': P.Horsea,
  Fog: P.Girafarig,
  'Heat Wave': P.Sizzlipede,
  Rain: P.Oshawott,
  Sandstorm: P.Shuckle,
  Snow: P.Horsea,
  Thunderstorm: Potw(P.Geodude, {form: 'alolan'}),
  Windy: P.Rookidee,
  Sunny: P.Magikarp // No-op
}
