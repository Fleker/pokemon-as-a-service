/**
 * @fileoverview Pokemon that you can put in the Breeding Club
 * (see pokemon-daycare.js)
 */

import { Potw } from '../badge2'
import { BadgeId } from '../pokemon/types'
import * as P from '../gen/type-pokemon'

// eslint-disable-next-line no-irregular-whitespace
// Winner: Nickit¹, Nickit²  (Send: Thievul², Nickit², Thievul¹, Nickit¹)
/**
 * Simple badge IDs for the species that have a 4x shiny chance.
 */
export const babyProduced: BadgeId[] = [
  P.Nickit,
]

/**
 * For labeling purposes, the parents who may be bred together.
 * Note that this only is for labels, and has no pragmatic effect.
 */
export const parents: BadgeId[] = [
  Potw(P.Nickit, {var: 1}),
  Potw(P.Nickit, {var: 2}),
  Potw(P.Thievul, {var: 1}),
  Potw(P.Thievul, {var: 2}),
]

export const history: BadgeId[] = [
  P.Igglybuff,
  P.Cleffa,
  P.Pichu,
  P.Togepi,
  P.Tyrogue,
  P.Elekid,
  P.Charmander,
  Potw(P.Dratini, {var: 1}),
  Potw(P.Magby, {var: 1}),
  Potw(P.Meditite, {var: 1}),
  Potw(P.Growlithe, {var: 1}),
  Potw(P.Phanpy, {var: 1}),
  Potw(P.Poochyena, {var: 1}),
  Potw(P.Zigzagoon, {var: 1}),
  Potw(P.Magikarp, {var: 1}),
  Potw(P.Magikarp, {var: 2}),
  Potw(P.Carvanha, {var: 1}),
  Potw(P.Seel, {var: 1}),
  Potw(P.Eevee, {var: 1}),
  Potw(P.Pichu, {var: 1}),
  Potw(P.Mareep, {var: 1}),
  Potw(P.Horsea, {var: 1}),
  Potw(P.Feebas, {var: 1}),
  Potw(P.Scyther, {var: 1}),
  Potw(P.Nincada, {var: 1}),
  Potw(P.Bagon, {var: 1}),
  Potw(P.Bagon, {var: 2}),
  Potw(P.Seedot, {var: 1}),
  Potw(P.Slakoth, {var: 1}),
  Potw(P.Larvitar, {var: 1}),
  Potw(P.Aron, {var: 1}),
  Potw(P.Pidgey, {var: 1}),
  Potw(P.Spearow, {var: 1}),
  Potw(P.Natu, {var: 1}),
  Potw(P.Taillow, {var: 1}),
  Potw(P.Snubbull, {var: 1}),
  Potw(P.Snubbull, {var: 2}),
  Potw(P.Marill, {var: 1}),
  Potw(P.Marill, {var: 2}),
  Potw(P.Azurill, {var: 1}),
  Potw(P.Azurill, {var: 2}),
  Potw(P.Rhyhorn, {var: 1}),
  Potw(P.Rhyhorn, {var: 2}),
  Potw(P.Oddish, {var: 1}),
  Potw(P.Oddish, {var: 2}),
  Potw(P.Cleffa, {var: 1}),
  Potw(P.Cleffa, {var: 2}),
  Potw(P.Cleffa, {var: 1}),
  Potw(P.Snorunt, {var: 2}),
  Potw(P.Poliwag, {var: 1}),
  Potw(P.Wingull, {var: 1}),
  Potw(P.Chansey, {var: 1}),
  Potw(P.Chansey, {var: 2}),
  Potw(P.Happiny, {var: 1}),
  Potw(P.Happiny, {var: 2}),
  Potw(P.Shellos, {var: 1}),
  Potw(P.Riolu, {var: 1}),
  Potw(P.Beldum, {var: 1}),
  Potw(P.Beldum, {var: 2}),
  Potw(P.Magnemite, {var: 1}),
  Potw(P.Magnemite, {var: 2}),
  Potw(P.Magneton, {var: 1}),
  Potw(P.Magneton, {var: 2}),
  Potw(P.Magnezone, {var: 1}),
  Potw(P.Magnezone, {var: 2}),
  Potw(P.Slowpoke, {var: 1}),
  Potw(P.Slowpoke, {var: 2}),
  Potw(P.Slowpoke, {var: 3}),
  Potw(P.Slowbro, {var: 1}),
  Potw(P.Slowbro, {var: 2}),
  Potw(P.Slowbro, {var: 3}),
  Potw(P.Slowking, {var: 1}),
  Potw(P.Slowking, {var: 2}),
  Potw(P.Slowking, {var: 3}),
  Potw(P.Luxray, {var: 1}),
  Potw(P.Luxray, {var: 2}),
  Potw(P.Snover, {var: 1}),
  Potw(P.Snover, {var: 2}),
  Potw(P.Abomasnow, {var: 1}),
  Potw(P.Abomasnow, {var: 2}),
  Potw(P.Graveler, {var: 1}),
  Potw(P.Graveler, {var: 2}),
  Potw(P.Graveler, {var: 3}),
  Potw(P.Golem, {var: 1}),
  Potw(P.Golem, {var: 2}),
  Potw(P.Golem, {var: 3}),
  Potw(P.Croagunk, {var: 1}),
  Potw(P.Croagunk, {var: 2}),
  Potw(P.Croagunk, {var: 3}),
  Potw(P.Toxicroak, {var: 1}),
  Potw(P.Toxicroak, {var: 2}),
  Potw(P.Toxicroak, {var: 3}),
  Potw(P.Finneon, {var: 1}),
  Potw(P.Finneon, {var: 2}),
  Potw(P.Jellicent, {var: 1}),
  Potw(P.Jellicent, {var: 2}),
  Potw(P.Yamask, {var: 1}),
  Potw(P.Yamask, {var: 2}),
  Potw(P.Cofagrigus, {var: 1}),
  Potw(P.Cofagrigus, {var: 2}),
  Potw(P.Growlithe, {var: 1}),
  Potw(P.Growlithe, {var: 2}),
  Potw(P.Growlithe, {var: 3}),
  Potw(P.Arcanine, {var: 1}),
  Potw(P.Arcanine, {var: 2}),
  Potw(P.Arcanine, {var: 3}),
  Potw(P.Rotom, {var: 1}),
  Potw(P.Rotom, {var: 2}),
  Potw(P.Rotom, {var: 3}),
  Potw(P.Porygon, {var: 1}),
  Potw(P.Porygon, {var: 2}),
  Potw(P.Porygon, {var: 3}),
  Potw(P.Porygon2, {var: 1}),
  Potw(P.Porygon2, {var: 2}),
  Potw(P.Porygon2, {var: 3}),
  Potw(P.Porygon_Z, {var: 1}),
  Potw(P.Porygon_Z, {var: 2}),
  Potw(P.Porygon_Z, {var: 3}),
  Potw(P.Magnezone, {var: 3}),
  Potw(P.Zorua, {var: 1}),
  Potw(P.Zorua, {var: 2}),
  Potw(P.Zorua, {var: 3}),
  Potw(P.Zoroark, {var: 1}),
  Potw(P.Zoroark, {var: 2}),
  Potw(P.Zoroark, {var: 3}),
  Potw(P.Ferroseed, {var: 1}),
  Potw(P.Ferroseed, {var: 2}),
  Potw(P.Ferroseed, {var: 3}),
  Potw(P.Ferrothorn, {var: 1}),
  Potw(P.Ferrothorn, {var: 2}),
  Potw(P.Ferrothorn, {var: 3}),
  Potw(P.Druddigon, {var:1}),
  Potw(P.Druddigon, {var:2}),
  Potw(P.Druddigon, {var:3}),
  Potw(P.Darmanitan, {var:1}),
  Potw(P.Darmanitan, {var:2}),
  Potw(P.Darmanitan, {var:3}),
  Potw(P.Deino, {var:1}),
  Potw(P.Deino, {var:2}),
  Potw(P.Deino, {var:3}),
  Potw(P.Zweilous, {var:1}),
  Potw(P.Zweilous, {var:2}),
  Potw(P.Zweilous, {var:3}),
  Potw(P.Hydreigon, {var:1}),
  Potw(P.Hydreigon, {var:2}),
  Potw(P.Hydreigon, {var:3}),
  Potw(P.Shinx, {var:1}),
  Potw(P.Shinx, {var:2}),
  Potw(P.Shinx, {var:3}),
  Potw(P.Shinx, {var:4}),
  Potw(P.Luxio, {var:1}),
  Potw(P.Luxio, {var:2}),
  Potw(P.Luxio, {var:3}),
  Potw(P.Luxio, {var:4}),
  Potw(P.Luxray, {var:1}),
  Potw(P.Luxray, {var:2}),
  Potw(P.Luxray, {var:3}),
  Potw(P.Luxray, {var:4}),
  Potw(P.Klink, {var:1}),
  Potw(P.Klink, {var:2}),
  Potw(P.Klink, {var:3}),
  Potw(P.Klang, {var:1}),
  Potw(P.Klang, {var:2}),
  Potw(P.Klang, {var:3}),
  Potw(P.Klinklang, {var:1}),
  Potw(P.Klinklang, {var:2}),
  Potw(P.Klinklang, {var:3}),
  Potw(P.Basculin, {var:1}),
  Potw(P.Basculin, {var:2}),
  Potw(P.Basculin, {var:3}),
  Potw(P.Basculin, {var:4}),
  Potw(P.Dragonair, {var:3}),
  Potw(P.Bagon, {var:2}),
  Potw(P.Bagon, {var:3}),
  Potw(P.Shelgon, {var:2}),
  Potw(P.Shelgon, {var:3}),
  Potw(P.Larvitar, {var: 1}),
  Potw(P.Larvitar, {var: 2}),
  Potw(P.Larvitar, {var: 3}),
  Potw(P.Larvitar, {var: 4}),
  Potw(P.Pupitar, {var: 1}),
  Potw(P.Pupitar, {var: 2}),
  Potw(P.Pupitar, {var: 3}),
  Potw(P.Pupitar, {var: 4}),
  Potw(P.Tyranitar, {var: 1}),
  Potw(P.Tyranitar, {var: 2}),
  Potw(P.Tyranitar, {var: 3}),
  Potw(P.Tyranitar, {var: 4}),
  Potw(P.Pansage, {var: 1}),
  Potw(P.Pansage, {var: 2}),
  Potw(P.Pansage, {var: 3}),
  Potw(P.Pansage, {var: 4}),
  Potw(P.Simisage, {var: 1}),
  Potw(P.Simisage, {var: 2}),
  Potw(P.Simisage, {var: 3}),
  Potw(P.Simisage, {var: 4}),
  Potw(P.Porygon, {var: 1}),
  Potw(P.Porygon, {var: 2}),
  Potw(P.Porygon, {var: 3}),
  Potw(P.Porygon2, {var: 1}),
  Potw(P.Porygon2, {var: 2}),
  Potw(P.Porygon2, {var: 3}),
  Potw(P.Porygon_Z, {var: 1}),
  Potw(P.Porygon_Z, {var: 2}),
  Potw(P.Porygon_Z, {var: 3}),
  Potw(P.Snover, {var: 1}),
  Potw(P.Snover, {var: 2}),
  Potw(P.Snover, {var: 3}),
  Potw(P.Snover, {var: 4}),
  Potw(P.Abomasnow, {var: 1}),
  Potw(P.Abomasnow, {var: 2}),
  Potw(P.Abomasnow, {var: 3}),
  Potw(P.Abomasnow, {var: 4}),
  Potw(P.Deerling, {var: 1}),
  Potw(P.Deerling, {var: 2}),
  Potw(P.Deerling, {var: 3}),
  Potw(P.Deerling, {var: 4}),
  Potw(P.Sawsbuck, {var: 1}),
  Potw(P.Sawsbuck, {var: 2}),
  Potw(P.Sawsbuck, {var: 3}),
  Potw(P.Sawsbuck, {var: 4}),
  Potw(P.Starly, {var: 1}),
  Potw(P.Starly, {var: 3}),
  Potw(P.Staravia, {var: 1}),
  Potw(P.Staravia, {var: 3}),
  Potw(P.Staraptor, {var: 2}),
  Potw(P.Staraptor, {var: 3}),
  Potw(P.Chatot, {var: 2}),
  Potw(P.Chatot, {var: 3}),
  Potw(P.Joltik, {var: 1}),
  Potw(P.Joltik, {var: 2}),
  Potw(P.Joltik, {var: 3}),
  Potw(P.Joltik, {var: 4}),
  Potw(P.Galvantula, {var: 1}),
  Potw(P.Galvantula, {var: 2}),
  Potw(P.Galvantula, {var: 3}),
  Potw(P.Galvantula, {var: 4}),
  Potw(P.Farfetchd, {var: 1}),
  Potw(P.Farfetchd, {var: 2}),
  Potw(P.Farfetchd, {var: 3}),
  Potw(P.Farfetchd, {var: 4}),
  Potw(P.Swanna, {var: 2}),
  Potw(P.Swanna, {var: 4}),
  Potw(P.Archen, {var: 1}),
  Potw(P.Archen, {var: 2}),
  Potw(P.Archen, {var: 3}),
  Potw(P.Archen, {var: 4}),
  Potw(P.Archeops, {var: 1}),
  Potw(P.Archeops, {var: 2}),
  Potw(P.Archeops, {var: 3}),
  Potw(P.Archeops, {var: 4}),
  Potw(P.Pansage, {var: 1}),
  Potw(P.Pansage, {var: 2}),
  Potw(P.Pansage, {var: 3}),
  Potw(P.Pansage, {var: 4}),
  Potw(P.Simisage, {var: 1}),
  Potw(P.Simisage, {var: 2}),
  Potw(P.Simisage, {var: 3}),
  Potw(P.Simisage, {var: 4}),
  Potw(P.Pansear, {var: 1}),
  Potw(P.Pansear, {var: 3}),
  Potw(P.Pansear, {var: 4}),
  Potw(P.Simisear, {var: 1}),
  Potw(P.Simisear, {var: 3}),
  Potw(P.Simisear, {var: 4}),
  Potw(P.Skorupi, {var: 1}),
  Potw(P.Skorupi, {var: 2}),
  Potw(P.Skorupi, {var: 3}),
  Potw(P.Skorupi, {var: 4}),
  Potw(P.Drapion, {var: 1}),
  Potw(P.Drapion, {var: 2}),
  Potw(P.Drapion, {var: 3}),
  Potw(P.Drapion, {var: 4}),
  Potw(P.Gothita, {var: 1}),
  Potw(P.Gothita, {var: 2}),
  Potw(P.Gothita, {var: 3}),
  Potw(P.Gothita, {var: 4}),
  Potw(P.Gothorita, {var: 1}),
  Potw(P.Gothorita, {var: 2}),
  Potw(P.Gothorita, {var: 3}),
  Potw(P.Gothorita, {var: 4}),
  Potw(P.Gothitelle, {var: 1}),
  Potw(P.Gothitelle, {var: 2}),
  Potw(P.Gothitelle, {var: 3}),
  Potw(P.Gothitelle, {var: 4}),
  Potw(P.Sigilyph, {var: 1}),
  Potw(P.Sigilyph, {var: 2}),
  Potw(P.Sigilyph, {var: 3}),
  Potw(P.Sigilyph, {var: 4}),
  Potw(P.Litwick, {var: 1}),
  Potw(P.Litwick, {var: 2}),
  Potw(P.Litwick, {var: 3}),
  Potw(P.Litwick, {var: 4}),
  Potw(P.Lampent, {var: 1}),
  Potw(P.Lampent, {var: 2}),
  Potw(P.Lampent, {var: 3}),
  Potw(P.Lampent, {var: 4}),
  Potw(P.Chandelure, {var: 1}),
  Potw(P.Chandelure, {var: 2}),
  Potw(P.Chandelure, {var: 3}),
  Potw(P.Chandelure, {var: 4}),
  Potw(P.Frillish, {var: 1}),
  Potw(P.Frillish, {var: 2}),
  Potw(P.Frillish, {var: 3}),
  Potw(P.Frillish, {var: 4}),
  Potw(P.Jellicent, {var: 1}),
  Potw(P.Jellicent, {var: 2}),
  Potw(P.Jellicent, {var: 3}),
  Potw(P.Jellicent, {var: 4}),
  Potw(P.Roggenrola, {var: 1}),
  Potw(P.Roggenrola, {var: 2}),
  Potw(P.Roggenrola, {var: 3}),
  Potw(P.Roggenrola, {var: 4}),
  Potw(P.Boldore, {var: 1}),
  Potw(P.Boldore, {var: 2}),
  Potw(P.Boldore, {var: 3}),
  Potw(P.Boldore, {var: 4}),
  Potw(P.Gigalith, {var: 1}),
  Potw(P.Gigalith, {var: 2}),
  Potw(P.Gigalith, {var: 3}),
  Potw(P.Gigalith, {var: 4}),
  Potw(P.Heatmor, {var: 1}),
  Potw(P.Heatmor, {var: 2}),
  Potw(P.Heatmor, {var: 3}),
  Potw(P.Heatmor, {var: 4}),
  Potw(P.Tirtouga, {var: 1}),
  Potw(P.Tirtouga, {var: 2}),
  Potw(P.Tirtouga, {var: 3}),
  Potw(P.Carracosta, {var: 1}),
  Potw(P.Carracosta, {var: 2}),
  Potw(P.Carracosta, {var: 3}),
  Potw(P.Onix, {var: 1}),
  Potw(P.Onix, {var: 2}),
  Potw(P.Onix, {var: 3}),
  Potw(P.Onix, {var: 4}),
  Potw(P.Steelix, {var: 1}),
  Potw(P.Steelix, {var: 2}),
  Potw(P.Steelix, {var: 3}),
  Potw(P.Steelix, {var: 4}),
  Potw(P.Croagunk, {var: 1}),
  Potw(P.Croagunk, {var: 2}),
  Potw(P.Croagunk, {var: 3}),
  Potw(P.Croagunk, {var: 4}),
  Potw(P.Toxicroak, {var: 1}),
  Potw(P.Toxicroak, {var: 2}),
  Potw(P.Toxicroak, {var: 3}),
  Potw(P.Toxicroak, {var: 4}),
  Potw(P.Pyukumuku, {var: 1}),
  Potw(P.Pyukumuku, {var: 2}),
  Potw(P.Pyukumuku, {var: 3}),
  Potw(P.Shieldon, {var: 1}),
  Potw(P.Shieldon, {var: 2}),
  Potw(P.Shieldon, {var: 3}),
  Potw(P.Shieldon, {var: 4}),
  Potw(P.Bastiodon, {var: 1}),
  Potw(P.Bastiodon, {var: 2}),
  Potw(P.Bastiodon, {var: 3}),
  Potw(P.Bastiodon, {var: 4}),
  Potw(P.Rhyperior, {var: 2}),
  Potw(P.Rhyperior, {var: 4}),
  Potw(P.Meowth, {var: 1}),
  Potw(P.Incineroar, {var: 2}),
  Potw(P.Lucario, {var: 1}),
  Potw(P.Lucario, {var: 2}),
  Potw(P.Lucario, {var: 3}),
  Potw(P.Lucario, {var: 4}),
  Potw(P.Mareanie, {var: 1}),
  Potw(P.Mareanie, {var: 2}),
  Potw(P.Mareanie, {var: 3}),
  Potw(P.Mareanie, {var: 4}),
  Potw(P.Kabutops, {var: 2}),
  Potw(P.Kabutops, {var: 3}),
  Potw(P.Kabutops, {var: 4}),
  Potw(P.Sandygast, {var: 1}),
  Potw(P.Sandygast, {var: 2}),
  Potw(P.Sandygast, {var: 3}),
  Potw(P.Palossand, {var: 1}),
  Potw(P.Palossand, {var: 2}),
  Potw(P.Palossand, {var: 3}),
  Potw(P.Morelull, {var: 1}),
  Potw(P.Morelull, {var: 2}),
  Potw(P.Morelull, {var: 3}),
  Potw(P.Morelull, {var: 4}),
  Potw(P.Shiinotic, {var: 1}),
  Potw(P.Shiinotic, {var: 2}),
  Potw(P.Shiinotic, {var: 3}),
  Potw(P.Shiinotic, {var: 4}),
]
