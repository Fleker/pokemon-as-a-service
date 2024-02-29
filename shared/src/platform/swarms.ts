// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Potw } from "../badge2";
import { RegionType } from "../locations-list";
import { BadgeId } from "../pokemon/types";
import * as P from '../gen/type-pokemon'

/**
 * ```@markdown
potw-001 Bulbasaur (4)
potw-004 Charmander (2)
potw-052 Meowth (2)
potw-025 Pikachu (2)
potw-021 Hippopotas (1)
potw-837 Rolycoly (1)
potw-868 Milcery (1)
potw-013 Luvdisc (1)
33 votes in total
 * ```
 */
export const Swarms: Record<RegionType, BadgeId> = {
  'Africa / Middle East': P.Hippopotas,
  'Asia': P.Pikachu,
  'Australia / New Zealand': P.Rolycoly,
  'Mediterranean': P.Milcery,
  'North America': P.Bulbasaur,
  "North Europe": P.Charmander,
  "Pacific Islands": P.Luvdisc,
  "South America": P.Meowth,
}
