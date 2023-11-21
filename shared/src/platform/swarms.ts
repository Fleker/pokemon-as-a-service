// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Potw } from "../badge2";
import { RegionType } from "../locations-list";
import { BadgeId } from "../pokemon/types";
import * as P from '../gen/type-pokemon'

/**
 * ```@markdown
 * potw-133 Eevee (3)
 * potw-155 Cyndaquil (2)
 * potw-741 Oricorio (1)
 * potw-684 Swirlix (1)
 * potw-850 Sizzlipede (1)
 * potw-019 Rattata (1)
 * NO potw-549-hisuian Lilligant (1)
 * potw-004 Charmander (1)
 * potw-175 Togepi (1)
 * **17** votes in total
 * ```
 */
export const Swarms: Record<RegionType, BadgeId> = {
  'Africa / Middle East': P.Eevee,
  'Asia': P.Cyndaquil,
  'Australia / New Zealand': P.Sizzlipede,
  'Mediterranean': P.Rattata,
  'North America': Potw(P.Oricorio, {form: 'pom_pom'}),
  "North Europe": P.Charmander,
  "Pacific Islands": P.Swirlix,
  "South America": P.Togepi,
}
