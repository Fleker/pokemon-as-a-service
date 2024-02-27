// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Potw } from "../badge2";
import { RegionType } from "../locations-list";
import { BadgeId } from "../pokemon/types";
import * as P from '../gen/type-pokemon'

/**
 * ```@markdown
potw-001 Bulbasaur (3)
potw-133 Eevee (2)
potw-155 Cyndaquil (1)
potw-759 Stufful (1)
potw-129-skelly Magikarp (1)
potw-280 Ralts (1)
potw-850 Sizzlipede (1)
potw-877 Morpeko (1)
33 votes in total
 * ```
 */
export const Swarms: Record<RegionType, BadgeId> = {
  'Africa / Middle East': P.Cyndaquil,
  'Asia': P.Bulbasaur,
  'Australia / New Zealand': P.Stufful,
  'Mediterranean': P.Eevee,
  'North America': P.Morpeko,
  "North Europe": P.Ralts,
  "Pacific Islands": P.Sizzlipede,
  "South America": Potw(P.Magikarp, {form: 'skelly'}),
}
