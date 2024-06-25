// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Potw } from "../badge2";
import { RegionType, WeatherType } from "../locations-list";
import { BadgeId } from "../pokemon/types";
import * as P from '../gen/type-pokemon'

/**
 * ```@markdown
potw-025 Pikachu (3)
potw-010 Caterpie (1)
potw-001 Bulbasaur (1)
potw-869 Alcremie (1)
potw-025-sinnohian Pikachu (1)
potw-025-alolan Pikachu (1)
potw-349 Feebas (1)
potw-039 Jigglypuff (1)
---
potw-280 Ralts (1)
potw-363 Spheal (1)
potw-302 Sableye (1)
potw-996 Frigibax (1)
potw-013 Weedle (1)
potw-263-galarian Zigzagoon (1)
potw-025-galarian Pikachu (1)
potw-674 Pancham (1)
potw-116 Horsea (1)
potw-661 Fletchling (1)
potw-552 Krokorok (1)
potw-214 Heracross (1)
potw-190 Aipom (1)
potw-446 Munchlax (1)
potw-255 Torchic (1)
potw-304 Aron (1)
potw-309 Electrike (1)
potw-749 Mudbray (1)
potw-054 Psyduck (1)
29 votes in total
 * ```
 */
export const Swarms: Record<RegionType, BadgeId> = {
  'Africa / Middle East': P.Feebas,
  'Asia': Potw(P.Pikachu, {form: 'sinnohian'}),
  'Australia / New Zealand': P.Jigglypuff,
  'Mediterranean': P.Milcery,
  'North America': P.Bulbasaur,
  "North Europe": P.Caterpie,
  "Pacific Islands": Potw(P.Pikachu, {form: 'alolan'}),
  "South America": P.Pichu,
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
  Cloudy: P.Sableye,
  'Diamond Dust': P.Frigibax,
  Snow: P.Frigibax,
  Fog: P.Ralts,
  'Heat Wave': P.Torchic,
  Rain: P.Psyduck,
  Sandstorm: P.Sandile,
  Thunderstorm: P.Electrike,
  Windy: P.Fletchling,
  Sunny: P.Ditto // No-op
}
