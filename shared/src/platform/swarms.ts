// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Potw } from "../badge2";
import { RegionType } from "../locations-list";
import { BadgeId } from "../pokemon/types";
import * as P from '../gen/type-pokemon'

/**
 * ```@markdown
 * potw-025 Pikachu (6)
 * potw-001 Bulbasaur (6)
 * potw-039 Jigglypuff (4)
 * potw-010 Caterpie (2)
 * potw-175 Togepi (2)
 * potw-092 Gastly (1)
 * potw-209 Snubbull (1)
 * potw-129-orange_and_white_calico Magikarp (1)
 * 50 votes in total
 * ```
 */
export const Swarms: Record<RegionType, BadgeId> = {
  'Africa / Middle East': P.Snubbull,
  'Asia': P.Bulbasaur,
  'Australia / New Zealand': P.Pikachu,
  'Mediterranean': P.Caterpie,
  'North America': P.Togepi,
  "North Europe": P.Jigglypuff,
  "Pacific Islands": Potw(P.Magikarp, {form: 'orange_and_white_calico'}),
  "South America": P.Gastly,
}
