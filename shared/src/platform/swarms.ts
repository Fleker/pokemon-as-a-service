// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Potw } from "../badge2";
import { RegionType } from "../locations-list";
import { BadgeId } from "../pokemon/types";
import * as P from '../gen/type-pokemon'

/**
 * ```@markdown
potw-077-galarian Ponyta (4)
potw-025 Pikachu (3)
potw-133 Eevee (2)
potw-024 Arbok (2)
potw-001 Bulbasaur (2)
potw-037-alolan Vulpix (1)
potw-866 Mr. Rime (1)
potw-050 Diglett (1)
36 votes in total
 * ```
 */
export const Swarms: Record<RegionType, BadgeId> = {
  'Africa / Middle East': P.Bulbasaur,
  'Asia': P.Pikachu,
  'Australia / New Zealand': P.Ekans,
  'Mediterranean': P.Eevee,
  'North America': P.Mime_Jr,
  "North Europe": Potw(P.Ponyta, {form: 'galarian'}),
  "Pacific Islands": Potw(P.Vulpix, {form: 'alolan'}),
  "South America": P.Diglett,
}
