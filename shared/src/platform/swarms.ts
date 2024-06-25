// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Potw } from "../badge2";
import { RegionType, WeatherType } from "../locations-list";
import { BadgeId } from "../pokemon/types";
import * as P from '../gen/type-pokemon'

/**
 * ```@markdown
potw-885 Dreepy (2)
potw-077 Ponyta (2)
potw-935 Charcadet (1)
potw-194-paldean Wooper (1)
potw-019-alolan Rattata (1)
potw-213 Shuckle (1)
potw-767 Wimpod (1)
potw-023 Ekans (1)
---
potw-531 Audino (1)
potw-867 Runerigus (1)
potw-855 Polteageist (1)
potw-024 Arbok (1)
potw-117 Seadra (1)
potw-116 Horsea (1)
potw-058 Growlithe (1)
potw-206 Dunsparce (1)
potw-418 Buizel (1)
potw-179 Mareep (1)
potw-129-apricot_stripes Magikarp (1)
potw-327 Spinda (1)
potw-447 Riolu (1)
potw-404 Luxio (1)
potw-236 Tyrogue (1)
potw-351-sunny Castform (1)
potw-060 Poliwag (1)
potw-132 Ditto (1)
potw-302 Sableye (1)
potw-004 Charmander (1)
potw-440 Happiny (1)
potw-363 Spheal (1)
potw-032 Nidoran♂ (1)
potw-240 Magby (1)
34 votes in total
 * ```
 */
export const Swarms: Record<RegionType, BadgeId> = {
  'Africa / Middle East': Potw(P.Yamask, {form:'galarian'}),
  'Asia': P.Spinda,
  'Australia / New Zealand': P.Sinistea,
  'Mediterranean': P.Horsea,
  'North America': P.Sableye,
  "North Europe": P.Growlithe,
  "Pacific Islands": P.Mareep,
  "South America": P.Dunsparce,
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
  Cloudy: P.Riolu,
  'Diamond Dust': P.Happiny,
  Snow: P.Happiny,
  Fog: P.Poliwag,
  'Heat Wave': P.Magby,
  Rain: P.Buizel,
  Sandstorm: P.NidoranM,
  Thunderstorm: P.Spheal,
  Windy: P.Tyrogue,
  Sunny: P.Ditto // No-op
}
