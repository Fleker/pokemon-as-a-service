// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Potw } from "../badge2";
import { RegionType } from "../locations-list";
import { BadgeId } from "../pokemon/types";
import * as P from '../gen/type-pokemon'

/**
 * ```@markdown
 * potw-010 Caterpie (1)
 * potw-220 Swinub (1)
 * potw-503-hisuian Samurott (1) (no)
 * potw-570-hisuian Zorua (1)
 * potw-039 Jigglypuff (1)
 * potw-004 Charmander (1)
 * potw-132 Ditto (1)
 * potw-439 Mime Jr. (1)
 * potw-774 Minior (1)
 * **17** votes in total
 * ```
 */
export const Swarms: Record<RegionType, BadgeId> = {
  'Africa / Middle East': P.Jigglypuff,
  'Asia': P.Caterpie,
  'Australia / New Zealand': P.Swinub,
  'Mediterranean': P.Charmander,
  'North America': P.Ditto,
  "North Europe": P.Mime_Jr,
  "Pacific Islands": P.Minior,
  "South America": Potw(P.Zorua, {form: 'hisuian'}),
}
