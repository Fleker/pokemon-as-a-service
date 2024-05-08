// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Potw } from "../badge2";
import { RegionType, WeatherType } from "../locations-list";
import { BadgeId } from "../pokemon/types";
import * as P from '../gen/type-pokemon'

/**
 * ```@markdown
potw-859 Impidimp (2)
potw-029 Nidoran♀ (1)
potw-349 Feebas (1)
potw-175 Togepi (1)
potw-092 Gastly (1)
potw-734 Yungoos (1)
potw-258 Mudkip (1)
potw-133 Eevee (1)
---
potw-757-female Salandit (1)
potw-443 Gible (1)
potw-025 Pikachu (1)
potw-622 Golett (1)
potw-948 Toedscool (1)
potw-304 Aron (1)
potw-088-alolan Grimer (1)
potw-778 Mimikyu (1)
potw-117 Seadra (1)
 * 18 votes in total
 * ```
 */
export const Swarms: Record<RegionType, BadgeId> = {
  'Africa / Middle East': P.Togepi,
  'Asia': P.Eevee,
  'Australia / New Zealand': P.Gastly,
  'Mediterranean': P.Feebas,
  'North America': P.Toedscool,
  "North Europe": P.Impidimp,
  "Pacific Islands": P.Yungoos,
  "South America": P.NidoranF,
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
  Cloudy: P.Gible,
  'Diamond Dust': P.Horsea,
  Snow: P.Horsea,
  Fog: P.Mimikyu,
  'Heat Wave': P.Salandit,
  Rain: P.Mudkip,
  Sandstorm: P.Aron,
  Thunderstorm: P.Pikachu,
  Windy: Potw(P.Grimer, {form: 'alolan'}),
  Sunny: P.Ditto // No-op
}
