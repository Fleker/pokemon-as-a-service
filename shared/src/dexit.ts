import { BadgeId } from "./pokemon/types";
import * as P from './gen/type-pokemon'
import {datastore} from './pokemon'

export const pkmnToDexit: BadgeId[] = [
  P.Rattata, P.Raticate, P.Spearow, P.Fearow,
  P.Tentacool, P.Tentacruel, P.Seel, P.Dewgong,
  P.Drowzee, P.Hypno, P.Goldeen, P.Seaking,
  P.Sunkern, P.Sunflora, P.Shuckle, P.Heracross,
  P.Smeargle, P.Mantine, P.Skarmory, P.Mantyke,
  P.Whismur, P.Loudred, P.Exploud, P.Sableye,
  P.Taillow, P.Swellow, P.Cacnea, P.Cacturne,
  P.Castform, P.Tropius, P.Relicanth,
  P.Pachirisu, P.Drifloon, P.Drifblim, P.Chatot,
  P.Carnivine, P.Finneon, P.Lumineon, P.Rotom,
  P.Phione, P.Manaphy,
  P.Pansear, P.Simisear, P.Throh, P.Audino,
  P.Cinccino, P.Minccino, P.Foongus, P.Amoonguss,
  P.Axew, P.Fraxure, P.Haxorus, P.Beheeyem, P.Elgyem,
  P.Golett, P.Golurk, P.Heatmor, P.Durant,
  P.Skiddo, P.Gogoat, P.Binacle, P.Barbaracle, P.Carbink,
  P.Phantump, P.Trevenant, P.Volcanion,
  P.Yungoos, P.Gumshoos, P.Crabrawler, P.Crabominable,
  P.Mareanie, P.Toxapex, P.Pyukumuku, P.Drampa, P.Dhelmise,
  P.Guzzlord,
  P.Gossifleur, P.Eldegoss, P.Sandaconda, P.Silicobra,
  P.Hatenna, P.Hatterene, P.Hattrem, P.Dracozolt,
  P.Zarude, P.Kleavor, P.Glimmora, P.Glimmet, P.Rellor,
  P.Rabsca, P.Tadbulb, P.Bellibolt, P.Orthworm,
]

// April Fools!
if (new Date().getDate() <= 1) {
  // Perform dexit
  for (const [key, value] of Object.entries(datastore)) {
    if (pkmnToDexit.includes(key as BadgeId)) {
      value.pokedex = 'This Pokémon will be removed in a future update.'
      value.tiers = []
    }
  }
}
