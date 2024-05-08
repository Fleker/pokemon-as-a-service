// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Potw } from "../badge2";
import { RegionType, WeatherType } from "../locations-list";
import { BadgeId } from "../pokemon/types";
import * as P from '../gen/type-pokemon'

/**
 * ```@markdown
 * potw-025 Pikachu (4)
 * potw-010 Caterpie (3)
 * potw-821 Rookidee (2)
 * potw-021 Spearow (2)
 * potw-335 Zangoose (1)
 * potw-370 Luvdisc (1)
 * potw-215-hisuian Sneasel (1)
 * potw-016 Pidgey (1)
 * ---
 * potw-849 Toxtricity (1)
 * potw-004 Charmander (1)
 * potw-001 Bulbasaur (1)
 * potw-412-trash-female Burmy (1)
 * potw-111 Rhyhorn (1)
 * potw-682 Spritzee (1)
 * potw-069 Bellsprout (1)
 * potw-032 Nidoran♂ (1)
 * potw-133 Eevee (1)
 * potw-025-rock_star Pikachu (1)
 * potw-039 Jigglypuff (1)
 * potw-327 Spinda (1)
 * potw-393 Piplup (1)
 * potw-063 Abra (1)
 * potw-352 Kecleon (1)
 * potw-594 Alomomola (1)
 * potw-007 Squirtle (1)
 * potw-868 Milcery (1)
 * potw-194 Wooper (1)
 * potw-238 Smoochum (1)
 * potw-088-alolan Grimer (1)
 * 36 votes in total
 * ```
 */
export const Swarms: Record<RegionType, BadgeId> = {
  'Africa / Middle East': P.Rookidee,
  'Asia': Potw(P.Sneasel, {form: 'hisuian'}),
  'Australia / New Zealand': P.Pikachu,
  'Mediterranean': P.Luvdisc,
  'North America': P.Caterpie,
  "North Europe": P.Spearow,
  "Pacific Islands": P.Pidgey,
  "South America": P.Zangoose,
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
  Cloudy: P.Kecleon,
  'Diamond Dust': P.Piplup,
  Snow: P.Piplup,
  Fog: Potw(P.Grimer, {form: 'alolan'}),
  'Heat Wave': P.Charmander,
  Rain: P.Wooper,
  Sandstorm: P.Spinda,
  Thunderstorm: P.Toxel,
  Windy: P.Abra,
  Sunny: P.Squirtle // No-op
}
