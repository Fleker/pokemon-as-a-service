// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Potw } from "../badge2";
import { RegionType } from "../locations-list";
import { BadgeId } from "../pokemon/types";
import * as P from '../gen/type-pokemon'

/**
 * ```@markdown
 * potw-004 Charmander (4)
 * potw-088-alolan Grimer (2)
 * potw-117 Seadra (2)
 * potw-027 Sandshrew (2)
 * potw-077 Ponyta (2)
 * potw-840 Applin (2)
 * potw-001 Bulbasaur (2)
 * potw-133 Eevee (2)
 * **58** votes in total
 * ```
 */
export const Swarms: Record<RegionType, BadgeId> = {
  'Africa / Middle East': P.Charmander,
  'Asia': P.Horsea,
  'Australia / New Zealand': P.Sandshrew,
  'Mediterranean': P.Bulbasaur,
  'North America': P.Ponyta,
  "North Europe": P.Applin,
  "Pacific Islands": Potw(P.Grimer, {form: 'alolan'}),
  "South America": P.Eevee,
}
