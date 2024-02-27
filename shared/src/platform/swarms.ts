// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Potw } from "../badge2";
import { RegionType } from "../locations-list";
import { BadgeId } from "../pokemon/types";
import * as P from '../gen/type-pokemon'

/**
 * ```@markdown

 * **17** votes in total
 * potw-001 Bulbasaur (5)
 * potw-868 Milcery (3)
 * potw-025 Pikachu (3)
 * potw-027 Sandshrew (2)
 * potw-1001 Wo-Chien (2) (NO)
 * potw-739 Crabrawler (2)
 * potw-370 Luvdisc (2)
 * potw-004 Charmander (2)
 * potw-116 Horsea (1)
 * 40 votes in total
 * ```
 */
export const Swarms: Record<RegionType, BadgeId> = {
  'Africa / Middle East': P.Pikachu,
  'Asia': P.Charmander,
  'Australia / New Zealand': P.Sandshrew,
  'Mediterranean': P.Horsea,
  'North America': P.Luvdisc,
  "North Europe": P.Crabrawler,
  "Pacific Islands": P.Milcery,
  "South America": P.Bulbasaur,
}
