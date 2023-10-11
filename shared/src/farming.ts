import { Badge } from "./badge3"
import { Potw } from './badge2'
import { Berry, ITEMS, FertilizerId } from "./items-list"
import { BadgeId, PokemonDoc } from "./pokemon/types"
import { ItemId } from "./items-list"
import * as Pkmn from './pokemon'
import * as P from './gen/type-pokemon'
import randomItem from "./random-item"
import { BerryPlot } from "./server-types"

type FertilizerGrowth = Record<FertilizerId, (count: number) => number>

const HOUR = 1000 * 60 * 60

const fertilizerGrowth: FertilizerGrowth = {
  growthmulch: (n) => n - HOUR * 24,
  dampmulch: (n) => n + HOUR * 24,
  stablemulch: (n) => n,
  gooeymulch: (n) => n,
  amazemulch: (n) => n,
  boostmulch: (n) => n - HOUR * 24,
  richmulch: (n) => n,
  surprisemulch: (n) => n,
  honey: (n) => n,
  apricorncompost: (n) => n - HOUR * 12,
  featheredmulch: (n) => n + HOUR * 12,
  classicmulch: (n) => n - HOUR * 24,
  pokesnack: (n) => n,
  berrymulch: (n) => n,
  pokebeans: (n) => n - HOUR * 24,
  curryfertilizer: (n) => n + HOUR * 3,
}

type FertilizerYield = Record<FertilizerId, (count: number) => number>

const fertilizerYield: FertilizerYield = {
  growthmulch: (n) => n / 1.5,
  dampmulch: (n) => n * 1.5,
  stablemulch: (n) => n,
  gooeymulch: (n) => n + 1,
  amazemulch: (n) => n,
  boostmulch: (n) => n,
  richmulch: (n) => n + 3,
  surprisemulch: (n) => n,
  honey: (n) => n,
  apricorncompost: (n) => n + 1,
  featheredmulch: (n) => n * 1.5,
  classicmulch: (n) => n,
  pokesnack: (n) => n + 1,
  berrymulch: (n) => n + 1,
  pokebeans: (n) => n,
  curryfertilizer: (n) => n * 1.6,
}

type FertilizerEncounters = Record<FertilizerId, BadgeId[]>

export const fertilizerPokemon: FertilizerEncounters = {
  // Attracts DPPt Grass-type Pokemon and others
  growthmulch: [
    P.Starly, P.Kricketot, P.Roselia, Potw(P.Burmy, {form: 'plant'}), P.Wurmple,
    P.Combee, P.Pachirisu, P.Cherubi, P.Tangela,
  ],
  // Attracts DPPt Water-type Pokemon
  dampmulch: [
    P.Psyduck, P.Buizel, P.Goldeen, P.Barboach, P.Wooper, P.Wingull, P.Marill,
    P.Remoraid, P.Tentacool, P.Mantyke,
  ],
  // Attracts DPPt Rock-type Pokemon
  stablemulch: [
    P.Geodude, P.Onix, P.Machop, P.Bonsly, P.Nosepass, P.Rhyhorn,
  ],
  // Attracts DPPt Poison-type Pokemon
  gooeymulch: [
    P.Roselia, P.Cascoon, P.Stunky, P.Weedle, P.Venonat,
  ],
  // Attracts XY Fairy-type Pokemon
  amazemulch: [
    P.Marill, P.Ralts, P.Spritzee, P.Swirlix,
    P.Mawile, P.Snubbull, P.Mr_Mime, P.Carbink, P.Klefki,
    P.Jigglypuff, Potw(P.Flabébé, {form: 'white'})
  ],
  // https://serebii.net/xy/berryfields.shtml
  boostmulch: [
    P.Ledyba, P.Volbeat, P.Illumise, P.Combee, Potw(P.Burmy, {form: 'plant'}),
    P.Spewpa,
  ],
  // Attracts XY Steel-type Pokemon
  richmulch: [
    P.Mawile, P.Durant, P.Aron, P.Magnemite, P.Pawniard, P.Ferroseed,
    P.Honedge,
  ],
  // Attracts XY Psychic-type Pokemon
  surprisemulch: [
    P.Meditite, P.Espurr, P.Abra, P.Ralts, P.Spoink, P.Inkay,
    P.Solrock, P.Lunatone, P.Woobat, P.Sigilyph, P.Solosis,
    P.Gothita, P.Wobbuffet, P.Slowpoke, P.Exeggcute, P.Jynx,
  ],
  // https://serebii.net/platinum/honeytrees.shtml
  honey: [
    P.Wurmple, P.Combee, P.Aipom, Potw(P.Burmy, {form: 'plant'}), P.Cherubi,
    P.Heracross, P.Munchlax,
  ],
  // https://serebii.net/heartgoldsoulsilver/headbutt.shtml
  apricorncompost: [
    P.Caterpie, P.Metapod, P.Weedle, P.Kakuna, P.Spearow, P.Venonat,
    P.Exeggcute, P.Hoothoot, P.Ledyba, P.Spinarak, P.Aipom, P.Pineco,
    P.Wurmple, P.Seedot, P.Taillow, P.Shroomish, P.Slakoth, P.Starly,
    Potw(P.Burmy, {form: 'plant'}), P.Combee, P.Cherubi,
  ],
  // https://serebii.net/blackwhite/dreamworldattacks.shtml
  featheredmulch: [
    P.Pidgey, P.Rattata, P.Spearow, P.Vulpix, P.Zubat, P.Oddish, P.Meowth,
    P.Psyduck, P.Mankey, P.Growlithe , P.Poliwag, P.Abra, P.Bellsprout,
    P.Tentacool, P.Ponyta, P.Slowpoke, P.Farfetchd, P.Doduo, P.Shellder,
    P.Gastly, P.Drowzee, P.Krabby, P.Exeggcute, P.Lickitung, P.Koffing,
    P.Rhyhorn, P.Tangela, P.Kangaskhan, P.Horsea, P.Goldeen, P.Staryu,
    P.Mr_Mime, P.Scyther, P.Tauros, P.Magikarp, P.Eevee, P.Dratini,
  ],
  // https://serebii.net/omegarubyalphasapphire/dexnav.shtml
  classicmulch: [
    P.Lillipup, P.Sewaddle, P.Zorua, P.Tympole, P.Gothita,
    Potw(P.Shellos, {form: 'east_sea'}), Potw(P.Shellos, {form: 'west_sea'}),
    P.Chatot, P.Pidove, P.Krabby, P.Frillish,
    P.Skrelp, P.Clauncher, P.Trubbish, P.Gible, P.Sandile,
    P.Dwebble, P.Ponyta, P.Tyrogue, P.Throh, P.Sawk, P.Scraggy,
    P.Bouffalant, P.Klefki, P.Misdreavus, P.Skorupi, P.Clefairy,
    P.Eevee, P.Joltik, P.Rattata, P.Seel, P.Aipom, P.Shinx,
    P.Drowzee, P.Beheeyem, P.Alomomola, P.Finneon,
    Potw(P.Deerling, {form: 'spring'}),
    Potw(P.Deerling, {form: 'summer'}),
    Potw(P.Deerling, {form: 'autumn'}),
    Potw(P.Deerling, {form: 'winter'}),
  ],
  // https://serebii.net/xd/pokespot.shtml
  pokesnack: [
    P.Sandshrew, P.Gligar, P.Trapinch, P.Hoppip, P.Phanpy, P.Surskit,
    P.Zubat, P.Aron, P.Wooper, P.Munchlax,
  ],
  // https://serebii.net/swordshield/berrytrees.shtml
  berrymulch: [
    /*P.Skowvet,*/ P.Cherubi, /*P.Greedent,*/ /*P.Applin,*/ P.Emolga,
  ],
  // https://serebii.net/sunmoon/pokepelago.shtml
  pokebeans: [
    P.Spearow, P.Zubat, P.Poliwag, P.Magnemite, P.Shellder, P.Gastly,
    P.Staryu, P.Scyther, P.Pinsir, P.Murkrow, P.Skarmory, P.Wingull,
    P.Beldum, P.Drifloon, P.Emolga, P.Rufflet, P.Vullaby,
    P.Fletchling, P.Carbink, P.Klefki, P.Phantump, P.Pikipek,
    P.Crabrawler, P.Pyukumuku,
  ],
  curryfertilizer: [
    P.Vulpix, P.Oddish, P.Stufful, P.Bounsweet,/* P.Wooloo, P.Yamper, */
    P.Pikachu, P.Ralts, P.Munna, /* P.Milcery, */ P.Bronzor, P.Cutiefly,
    P.Woobat, P.Pichu, P.Togepi, P.Wynaut, P.Budew, P.Munchlax, P.Cleffa,
    P.Mudbray, P.Machop, P.Tyrogue, P.Onix, P.Timburr, P.Meowth,
    P.Eevee, P.Growlithe, P.Riolu, P.Gothita, P.Farfetchd, P.Koffing,
    P.Ponyta, P.Mime_Jr, /* P.Falinks, P.Morpeko */
  ],
}

type FertilizerMutation = Record<FertilizerId, number>

export const fertilizerMutation: FertilizerMutation = {
  growthmulch: 1,
  dampmulch: 1,
  stablemulch: 0,
  gooeymulch: 2,
  amazemulch: 2,
  boostmulch: 1,
  richmulch: 1,
  surprisemulch: Infinity,
  honey: 3,
  apricorncompost: 1.5,
  featheredmulch: 1.5,
  classicmulch: 1.5,
  pokesnack: 1.5,
  berrymulch: 1.5,
  pokebeans: 1.5,
  curryfertilizer: 2,
}

export function getTotalPlots(berryPlots = 0) {
  return 6 * berryPlots
}

export function getNextPlotCost(berryPlots = 0) {
  return 50 * Math.pow(2, berryPlots)
}

export function getHarvestTime(berry: ItemId, plantedTime: number, fertilizer?: ItemId) {
  const berryMeta = ITEMS[berry] as Berry
  // Check on effect on mulch
  if (fertilizer) {
    const timeDiff = fertilizerGrowth[fertilizer || 'oran']!(berryMeta.growTime * HOUR)
    return timeDiff + plantedTime
  }
  return plantedTime + berryMeta.growTime * HOUR
}

export function isBerryHarvestable(berry: ItemId, harvestTime: number, fertilizer?: ItemId) {
  return getHarvestTime(berry, harvestTime, fertilizer) <= Date.now()
}

export function parsePlot(berry?: BerryPlot) {
  // Parse entry
  if (berry === undefined) {
    return undefined
  }
  const entries = Object.entries(berry)
  let item, harvest, fertilizer
  for (const entry of entries) {
    if (entry[0] === 'fertilizer') {
      fertilizer = entry[1]
    } else {
      item = entry[0]
      harvest = entry[1]
    }
  }
  return {
    item, harvest, fertilizer,
  }
}

export function isEmptyPlot(plot?: BerryPlot) {
  const parse = parsePlot(plot)
  return !parse || !parse.item
}

export function getYield(berry: Berry, fertilizer?: FertilizerId) {
  const count = Math.random() * (berry.yield.max - berry.yield.min) + berry.yield.min
  if (fertilizer) {
    return Math.floor(fertilizerYield[fertilizer]!(count))
  }
  return Math.floor(count)
}

// =1/A2*POW(2,(A2-10)/10)
export function encounterRate(berryPlots = 1) {
  return Math.pow(2, (berryPlots - 20) / 20) / 5
}

export function randomVariant(pkmn: PokemonDoc) {
  const numVariants = pkmn.novelMoves?.length
  if (numVariants! > 1) {
    // Has var1 - varX
    return Math.max(1, Math.ceil(Math.random() * (pkmn.novelMoves!.length - 1)))
  }
  return undefined // No variant, not a var0
}

export function getFertilizerPokemon(fertilizer?: FertilizerId) {
  const pkmn = (() => {
    if (!fertilizer) {
      return undefined
    } if (!fertilizerPokemon[fertilizer]) {
      return undefined
    }
    if (!fertilizerPokemon[fertilizer]!.length) {
      return undefined
    }
    return randomItem(fertilizerPokemon[fertilizer]!)
  })()
  if (!pkmn) {
    return undefined
  }
  const badge = Badge.create(pkmn)
  const entry = Pkmn.get(badge.toLegacyString())!
  badge.personality.variant = randomVariant(entry)
  return badge
}
