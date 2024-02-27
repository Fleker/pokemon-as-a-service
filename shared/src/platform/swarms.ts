// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Potw } from "../badge2";
import { RegionType } from "../locations-list";
import { BadgeId } from "../pokemon/types";
import * as P from '../gen/type-pokemon'

/**
 * ```@markdown

potw-010 Caterpie (3)
potw-001 Bulbasaur (2)
potw-007 Squirtle (2)
potw-004 Charmander (2)
potw-483-origin Dialga (2) (NO!)
potw-618 Stunfisk (1)
potw-705-hisuian Sliggoo (1)
potw-571-hisuian Zoroark (1)
potw-674 Pancham (1)
30 votes in total
 * ```
 */
export const Swarms: Record<RegionType, BadgeId> = {
  'Africa / Middle East': P.Bulbasaur,
  'Asia': P.Pancham,
  'Australia / New Zealand': P.Charmander,
  'Mediterranean': P.Stunfisk,
  'North America': P.Goomy,
  "North Europe": P.Squirtle,
  "Pacific Islands": Potw(P.Zorua, {form: 'hisui'}),
  "South America": P.Caterpie,
}
