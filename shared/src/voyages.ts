import { assert } from '@fleker/gents'
import { Potw } from "./badge2";
import { Badge } from "./badge3";
import { CATCH_CHARM_SM, CATCH_CHARM_SWSH, LegendaryQuest, requireItem, requireMove, simpleRequirePotw, simpleRequirePotwArr } from "./legendary-quests";
import { WeatherType } from "./locations-list";
import { get } from "./pokemon";
import { BadgeId, PokemonForm, PokemonId, Type } from "./pokemon/types";
import { APRICORNS, RAIDS_1, RAIDS_2, SEEDS, NECTARS, MINTS, BOTTLECAPS, SWEETS, GALAR_INGREDIENTS } from "./prizes";
import { ItemId } from "./items-list";
import * as P from './gen/type-pokemon'

export enum Leg {
  NOTHING = 0,
  ITEM = 1,
  RARE_ITEM = 2,
  /**
   * For items to be prioritized if the host doesn't have one. This may be
   * useful in the future.
   */
  KEY_ITEM = 3,
  POKEMON = 4,
}

export enum State {
  CREATED = 0,
  STARTED = 1,
  /** @deprecated */
  IN_RAID = 2,
  COMPLETE = 3,
}

export interface Prize {
  items: ItemId[]
  caught: PokemonId[]
}

export interface Doc {
  /** The type of Voyage */
  vid: VoyageId
  /** User ID of the host */
  host: string
  /** Whether host has the shiny charm. Applicable to all players. */
  shinyCharm: boolean
  /** Weather in player location when voyage is created. */
  weather: WeatherType
  /** Map of players and selections */
  players: {
    [userId: string]: {
      ldap: string
      species: PokemonId
      ready: boolean
    }
  }
  /** List of player IDs in voyage */
  playerList: string[]
  /** List of players who have yet to claim prizes. */
  claimList?: string[]
  /** Selected legs */
  legs: Leg[]
  /** When created */
  created: number
  /** Time the voyage started. Voyages complete in T+1 day +/- 1 hour */
  started: number
  state: State
  /** Prizes at each leg. Everyone gets the same. Prizes defined by leg for UI purposes. */
  prizes: Prize[]
  /** Raids Firebase ID */
  raidId?: string
  /** When raid is available, this is the ID. */
  raidBoss?: PokemonId
  /** Whether it has already been marked as public. */
  isPublic?: boolean
}

/** 4 buckets of items & Pokémon */
type VoyageItems = [ItemId[], ItemId[], ItemId[], ItemId[]]

type VoyagePkmn = [BadgeId[], BadgeId[], BadgeId[], BadgeId[]]

type VoyageWeatherPkmn = Record<WeatherType, BadgeId[]>

/** For scores of 1/2, and 3 */
type VoyageRaidBosses = [BadgeId[], BadgeId[]]

type Stat = 'hp' | 'attack' | 'defense' | 'spAttack' | 'spDefense' | 'speed'

export interface Voyage {
  label: string
  description: string
  items: VoyageItems
  rareitems: VoyageItems
  pokemon: VoyagePkmn
  weatherPokemon: VoyageWeatherPkmn
  bosses: VoyageRaidBosses
  unlocked: LegendaryQuest
  typePrimary: Type
  typeSecondary: Type[]
  scoreStat: Stat
  /** Quartiles to set the voyage's bucket ⅓,⅔, max */
  buckets: [0, number, number, number]
}

export const getMaxVoyages = (user: Users.Doc) => {
  // if (user.items['voyagecharm'] && user.items['voyagecharm'] > 0) {
  //   return 6
  // }
  return 3
}

export function getScore(voyageId: VoyageId, party: PokemonId[]) {
  let score = 0
  const voyage = Voyages[voyageId]
  for (const pkmn of party) {
    const badge = new Badge(pkmn)
    const badgeId = badge.toLegacyString()
    const db = get(badgeId)!
    const types = [db.type1, db.type2 ?? undefined]
    if (types.includes(voyage.typePrimary)) {
      score += db[voyage.scoreStat]
    } else if (types.includes(voyage.typeSecondary[0])) {
      score += 0.67 * db[voyage.scoreStat]
    } else if (types.includes(voyage.typeSecondary[1])) {
      score += 0.67 * db[voyage.scoreStat]
    } else {
      score += 0.33 * db[voyage.scoreStat]
    }
    if (badge.personality.shiny) {
      score += 10
    }
    if (badge.personality.variant) {
      score += 10
    }
  }
  return score
}

export function getBucket(voyageDb: Voyage, voyageScore: number) {
  if (voyageScore < voyageDb.buckets[1]) return 0
  if (voyageScore < voyageDb.buckets[2]) return 1
  if (voyageScore < voyageDb.buckets[3]) return 2
  return 3 // Max
}

export const LegendaryBossConditions: Partial<Record<BadgeId, WeatherType>> = {
  [P.Thundurus]: 'Thunderstorm',
  [P.Landorus]: 'Sandstorm',
}

export const Voyages = {
  VAST_OCEAN: assert<Voyage>({
    label: 'Vast Ocean',
    description: 'The midst of a chilly ocean, where you can see icebergs and seaweed surrounding you.',
    typePrimary: 'Water', typeSecondary: ['Ice', 'Flying'], scoreStat: 'hp',
    buckets: [0, 216, 438, 655],
    items: [
      ['prismscale', ...RAIDS_1],
      ['prismscale', 'heartscale', ...RAIDS_1, 'floatstone'],
      ['prismscale', 'heartscale', ...RAIDS_1, 'stardust', 'floatstone'],
      ['prismscale', 'heartscale', ...RAIDS_2, 'starpiece', 'watergem', 'icegem', 'flyinggem'],
    ],
    rareitems: [
      ['waterstone', 'relicsilver', 'dragonscale', 'pearl'],
      ['waterstone', 'relicsilver', 'dragonscale', 'bigpearl'],
      ['waterstone', 'relicsilver', 'dragonscale', 'pearlstring', 'zwaterium'],
      ['waterstone', 'relicsilver', 'dragonscale', 'pearlstring', 'splashplate', 'icicleplate', 'skyplate', 'zwaterium', 'zflyinium', 'zicium'],
    ],
    pokemon: [
      [P.Wailmer, P.Remoraid, P.Tentacool, P.Corphish, P.Horsea, P.Oshawott],
      [P.Wailmer, P.Remoraid, P.Tentacool, P.Skrelp, P.Horsea, P.Oshawott],
      [P.Wailmer, P.Remoraid, P.Tentacruel, P.Qwilfish, P.Seadra, P.Oshawott],
      [P.Wailmer, P.Octillery, P.Lapras, P.Feebas, P.Seadra, P.Dewott],
    ],
    weatherPokemon: {
      Cloudy: [P.Psyduck],
      'Diamond Dust': [P.Seel],
      Fog: [P.Frillish],
      'Heat Wave': [P.Mantine],
      Rain: [P.Squirtle],
      Sandstorm: [P.Wooper],
      Snow: [P.Seel],
      Sunny: [P.Piplup],
      Thunderstorm: [P.Chinchou],
      Windy: [P.Wingull],
    },
    bosses: [
      [P.Wailord, P.Gyarados, P.Vaporeon],
      [P.Kyogre],
    ],
    unlocked: {
      hints: [{
        completed: requireItem('tm-Surf'),
        msg: 'Have a way to teach Pokémon to swim across the water.'
      }, {
        completed: requireMove('Surf', 1),
        msg: 'Have a Pokémon who can swim across the water.'
      }, {
        completed: simpleRequirePotw(P.Kyogre),
        msg: 'Catch a Pokémon who is the beast of the sea.'
      }]
    }
  }),
  DYNAMIC_VOLCANO: assert<Voyage>({
    label: 'Dynamic Volcano',
    description: 'Your adventure takes you to a boiling trail to the top of an active volcano.',
    typePrimary: 'Fire', typeSecondary: ['Dragon', 'Steel'], scoreStat: 'hp',
    buckets: [0, 156, 318, 475],
    items: [
      ['lavacookie', ...RAIDS_1, 'tumblestone', 'hardstone', 'charcoal', 'ironchunk', 'soot'],
      ['lavacookie', ...RAIDS_1, 'tumblestone', 'blacktumblestone', 'skytumblestone', 'hardstone', 'charcoal', 'ironchunk', 'soot'],
      ['lavacookie', ...RAIDS_1, 'tumblestone', 'blacktumblestone', 'skytumblestone', 'hardstone', 'charcoal', 'ironchunk', 'lightclay', 'occa'],
      ['lavacookie', ...RAIDS_2, 'blacktumblestone', 'skytumblestone', 'hardstone', 'charcoal', 'ironchunk', 'lightclay', 'occa', 'firegem', 'dragongem', 'steelgem'],
    ],
    rareitems: [
      ['firestone', 'flameorb', 'ironball', 'rockincense'],
      ['firestone', 'flameorb', 'ironball', 'rockyhelmet'],
      ['firestone', 'flameorb', 'ironball', 'magmarizer', 'zfirium'],
      ['firestone', 'flameorb', 'flameplate', 'dracoplate', 'ironplate', 'zfirium', 'zsteelium', 'zdragonium'],
    ],
    pokemon: [
      [P.Magby, P.Vulpix, P.Numel, P.Bagon, P.Slugma, P.Charmander],
      [P.Magby, P.Vulpix, P.Numel, P.Bagon, P.Bronzor, P.Charmander],
      [P.Magby, P.Torkoal, P.Numel, P.Axew, P.Bronzor, P.Cyndaquil],
      [P.Magmar, P.Larvesta, P.Camerupt, P.Druddigon, P.Bronzong, P.Charmeleon],
    ],
    weatherPokemon: {
      Cloudy: [P.Growlithe],
      'Diamond Dust': [P.Beldum],
      Fog: [P.Koffing],
      'Heat Wave': [P.Darumaka],
      Rain: [P.Goomy],
      Sandstorm: [P.Beldum],
      Snow: [P.Beldum],
      Sunny: [P.Litleo],
      Thunderstorm: [P.Elekid],
      Windy: [P.Fletchling],
    },
    bosses: [
      [P.Magmortar, P.Excadrill, P.Flareon],
      [P.Groudon, P.Heatran, P.Moltres],
    ],
    unlocked: {
      hints: [{
        completed: requireItem('tm-Fire Blast'),
        msg: 'Have a way to teach Pokémon to burst out flames.'
      }, {
        completed: requireMove('Fire Blast', 1),
        msg: 'Have a Pokémon who can exhale fire.'
      }, {
        completed: simpleRequirePotw(P.Groudon),
        msg: 'Catch a Pokémon who is the beast of the land.'
      }]
    }
  }),
  GARGANTUAN_MOUNTAIN: assert<Voyage>({
    label: 'Gargantuan Mountain',
    description: 'You are at the base of a tall mountain. Its peak scratches the clouds above.',
    typePrimary: 'Fighting', typeSecondary: ['Rock', 'Ice'], scoreStat: 'attack',
    buckets: [0, 195, 396, 592],
    items: [
      ['tumblestone', 'ironchunk', 'starpiece', 'blacktumblestone', 'skytumblestone', 'swordcap', 'springymushroom', 'sandradish', 'crunchysalt'],
      ['tumblestone', 'ironchunk', 'starpiece', 'blacktumblestone', 'skytumblestone', 'swordcap', 'springymushroom', 'sandradish', 'crunchysalt'],
      ['tumblestone', 'ironchunk', 'starpiece', 'blacktumblestone', 'skytumblestone', 'swordcap', 'springymushroom', 'sandradish', 'crunchysalt'],
      ['tumblestone', 'ironchunk', 'starpiece', 'blacktumblestone', 'skytumblestone', 'fightinggem', 'rockgem', 'icegem'],
    ],
    rareitems: [
      ['cometshard', 'airballoon', 'kingsrock', 'razorclaw', 'helixfossil', 'domefossil'],
      ['cometshard', 'airballoon', 'kingsrock', 'razorclaw', 'helixfossil', 'domefossil'],
      ['cometshard', 'airballoon', 'kingsrock', 'razorclaw', 'helixfossil', 'domefossil', 'zfightinium'],
      ['cometshard', 'airballoon', 'kingsrock', 'razorclaw', 'helixfossil', 'domefossil', 'fistplate', 'stoneplate', 'icicleplate', 'zrockium', 'zfightinium', 'zicium'],
    ],
    pokemon: [
      [P.Zubat, P.Sneasel, P.Machop, P.Bergmite, P.Rhyhorn, P.Mankey],
      [P.Zubat, P.Sneasel, P.Machop, P.Bergmite, P.Rhyhorn, P.Mankey],
      [P.Golbat, P.Snorunt, P.Mienfoo, P.Bergmite, P.Larvitar, P.Mankey],
      [P.Golbat, P.Pignite, P.Machoke, P.Bergmite, P.Rhydon, P.Primeape],
    ],
    weatherPokemon: {
      Cloudy: [P.Riolu],
      'Diamond Dust': [P.Snover],
      Fog: [P.Meditite],
      'Heat Wave': [P.Houndour],
      Rain: [P.Goomy],
      Sandstorm: [P.Gligar],
      Snow: [P.Snover],
      Sunny: [P.Skiddo],
      Thunderstorm: [P.Mareep],
      Windy: [P.Hawlucha],
    },
    bosses: [
      [P.Rhyperior, P.Beartic, P.Conkeldurr],
      [P.Dialga, P.Palkia, P.Terrakion],
    ],
    unlocked: {
      hints: [{
        completed: requireItem('tm-Rock Climb'),
        msg: 'Have a way to teach Pokémon to scale cliffsides.'
      }, {
        completed: requireMove('Rock Climb', 1),
        msg: 'Have a Pokémon who can scale cliffsides.'
      }, {
        completed: simpleRequirePotw(P.Heatran),
        msg: 'Catch a Pokémon who is the beast of volcanos.'
      }]
    }
  }),
  GRAND_UNDERGROUND: assert<Voyage>({
    label: 'Grand Underground',
    description: 'A vast series of tunnels underneath the Sinnoh region.',
    typePrimary: 'Ground', typeSecondary: ['Normal', 'Fire'], scoreStat: 'attack',
    buckets: [0, 196, 398, 595],
    items: [
      ['thickclub', 'tumblestone', 'ironchunk', 'blacktumblestone', 'skytumblestone', 'crunchysalt'],
      ['thickclub', 'tumblestone', 'blacktumblestone', 'skytumblestone', 'ironchunk', 'skullfossil', 'armorfossil', 'crunchysalt'],
      ['thickclub', 'blacktumblestone', 'skytumblestone', 'ironchunk', 'skullfossil', 'armorfossil'],
      ['thickclub', 'tumblestone', 'blacktumblestone', 'skytumblestone', 'ironchunk', 'skullfossil', 'armorfossil', 'groundgem', 'normalgem', 'firegem'],
    ],
    rareitems: [
      ['skullfossil', 'rootfossil', 'clawfossil', 'shinystone', 'rockyhelmet', 'nugget', 'starpiece', /* 'mysteriousshard' */],
      ['rootfossil', 'clawfossil', 'shinystone', 'rockyhelmet', 'nugget', 'starpiece', /* 'mysteriousshard' */],
      ['rootfossil', 'clawfossil', 'shinystone', 'rockyhelmet', 'nugget', 'rarebone', 'zgroundium', /*'mysteriousshard' */],
      ['rootfossil', 'clawfossil', 'shinystone', 'rockyhelmet', 'nugget', 'cometshard', /* 'mysteriousshard', */ 'earthplate', 'flameplate', 'zfirium', 'znormalium', 'zgroundium'],
    ],
    pokemon: [
      [P.Diglett, P.Sentret, P.Teddiursa, P.Bunnelby, P.Whismur, P.Patrat],
      [P.Diglett, P.Sentret, P.Teddiursa, P.Bunnelby, P.Whismur, P.Patrat],
      [P.Diglett, P.Zigzagoon, P.Teddiursa, P.Nosepass, P.Onix, P.Patrat],
      [P.Diglett, P.Furret, P.Rhyhorn, P.Diggersby, P.Loudred, P.Watchog],
    ],
    weatherPokemon: {
      Cloudy: [P.Sandile],
      'Diamond Dust': [P.Swinub],
      Fog: [P.Baltoy],
      'Heat Wave': [P.Slugma],
      Rain: [P.Wooper],
      Snow: [P.Swinub],
      Sunny: [P.Litleo],
      Sandstorm: [P.Nincada],
      Thunderstorm: [P.Helioptile],
      Windy: [P.Spearow],
    },
    bosses: [
      [P.Dugtrio, P.Torkoal, P.Cinccino],
      [P.Regigigas, P.Reshiram, P.Zekrom, P.Kyurem],
    ],
    unlocked: {
      hints: [{
        completed: requireItem('tm-Dig'),
        msg: 'Have a way to teach Pokémon to dig holes.'
      }, {
        completed: requireMove('Dig', 1),
        msg: 'Have a Pokémon who create holes underground.'
      }, {
        completed: simpleRequirePotw(P.Regigigas),
        msg: 'Catch a Pokémon who is the titan of titans.'
      }]
    }
  }),
  IRON_MINES: assert<Voyage>({
    label: 'Iron Mines',
    description: 'You find yourself in mines. Carts of ore sit all around.',
    typePrimary: 'Steel', typeSecondary: ['Electric', 'Fighting'], scoreStat: 'defense',
    buckets: [0, 250, 507, 758],
    items: [
      ['ironchunk', 'stardust', 'redshard', 'blueshard', 'greenshard', 'yellowshard', 'metalpowder', 'cellbattery', 'quickpowder', 'crunchysalt'],
      ['ironchunk', 'stardust', 'redshard', 'blueshard', 'greenshard', 'yellowshard', 'metalpowder', 'cellbattery', 'quickpowder', 'crunchysalt'],
      ['ironchunk', 'stardust', 'redshard', 'blueshard', 'greenshard', 'yellowshard', 'metalpowder', 'cellbattery', 'quickpowder'],
      ['ironchunk', 'stardust', 'redshard', 'blueshard', 'greenshard', 'yellowshard', 'metalpowder', 'cellbattery', 'quickpowder', 'steelgem', 'electricgem', 'fightinggem'],
    ],
    rareitems: [
      ['thunderstone', 'bignugget', 'nugget', 'metalcoat', 'ironball'],
      ['bignugget', 'nugget', 'metalcoat', 'thunderstone', 'ironball'],
      ['bignugget', 'nugget', 'metalcoat', 'thunderstone', 'ironball', 'zsteelium'],
      ['bignugget', 'nugget', 'metalcoat', 'thunderstone', 'ironball', 'ironplate', 'zapplate', 'fistplate', 'zfightinium', 'zelectrium', 'zsteelium'],
    ],
    pokemon: [
      [P.Nosepass, P.Aron, P.Beldum, P.Mienfoo, P.Makuhita, P.Pichu],
      [P.Nosepass, P.Aron, P.Beldum, P.Mienfoo, P.Makuhita, P.Pichu],
      [P.Stunfisk, P.Aron, P.Beldum, P.Throh, P.Sawk, P.Klink],
      [P.Stunfisk, P.Helioptile, P.Magnemite, P.Joltik, P.Durant, P.Klink],
    ],
    weatherPokemon: {
      Cloudy: [P.Pawniard],
      'Diamond Dust': [P.Sneasel],
      Fog: [P.Mawile],
      'Heat Wave': [P.Torkoal],
      Rain: [P.Tynamo],
      Sandstorm: [P.Onix],
      Snow: [P.Sneasel],
      Sunny: [P.Ferroseed],
      Thunderstorm: [P.Voltorb],
      Windy: [P.Skarmory],
    },
    bosses: [
      [P.Steelix, P.Hariyama, P.Jolteon],
      [P.Registeel, P.Cobalion, P.Zapdos],
    ],
    unlocked: {
      hints: [{
        completed: requireItem('tm-Strength'),
        msg: 'Have a way to teach Pokémon to push boulders.'
      }, {
        completed: requireMove('Strength', 1),
        msg: 'Have a Pokémon who can push boulders.'
      }, {
        completed: simpleRequirePotw(P.Registeel),
        msg: 'Catch a Pokémon who is the titan of steel.'
      }]
    }
  }),
  ABANDONED_TUNNEL: assert<Voyage>({
    label: 'Abandoned Tunnel',
    description: 'You find yourself venturing deeper into this cave.',
    typePrimary: 'Rock', typeSecondary: ['Ghost', 'Dark'], scoreStat: 'defense',
    buckets: [0, 263, 534, 798],
    items: [
      ['hardstone', 'tumblestone', 'redshard', 'greenshard', 'blueshard', 'yellowshard', 'tinymushroom', 'crunchysalt'],
      ['hardstone', 'tumblestone', 'redshard', 'greenshard', 'blueshard', 'yellowshard', 'tinymushroom', 'crunchysalt'],
      ['hardstone', 'tumblestone', 'redshard', 'greenshard', 'blueshard', 'yellowshard', 'tinymushroom', 'lightclay'],
      ['hardstone', 'tumblestone', 'redshard', 'greenshard', 'blueshard', 'yellowshard', 'tinymushroom', 'lightclay', 'rockgem', 'ghostgem', 'darkgem'],
    ],
    rareitems: [
      ['rarebone', 'moonstone', 'blacksludge', 'toxicorb'],
      ['rarebone', 'moonstone', 'blacksludge', 'toxicorb'],
      ['rarebone', 'moonstone', 'blacksludge', 'toxicorb', 'zrockium'],
      ['rarebone', 'moonstone', 'blacksludge', 'toxicorb', 'dreadplate', 'stoneplate', 'spookyplate', 'zrockium', 'zdarkinium', 'zghostium'],
    ],
    pokemon: [
      [P.Geodude, P.Larvitar, P.Roggenrola, P.Solrock, P.Deino, P.Mawile, P.Woobat],
      [P.Geodude, P.Larvitar, P.Roggenrola, P.Lunatone, P.Deino, P.Mawile, P.Woobat],
      [P.Geodude, P.Larvitar, P.Roggenrola, P.Solrock, P.Lunatone, P.Deino, P.Mawile, P.Woobat],
      [P.Graveler, P.Pupitar, P.Boldore, P.Carbink, P.Zweilous, P.Mawile, P.Woobat],
    ],
    weatherPokemon: {
      Cloudy: [P.Sableye],
      'Diamond Dust': [P.Sneasel],
      Fog: [P.Bronzor],
      'Heat Wave': [P.Houndour],
      Rain: [P.Binacle],
      Sandstorm: [P.Rhyhorn],
      Snow: [P.Sneasel],
      Sunny: [P.Phantump],
      Thunderstorm: [P.Rotom],
      Windy: [P.Zubat],
    },
    bosses: [
      [P.Tyranitar, P.Umbreon, P.Cofagrigus],
      [P.Regirock, Potw(P.Zygarde, {form: 'fifty'})]
    ],
    unlocked: {
      hints: [{
        completed: requireItem('tr-Flash'),
        msg: 'Have a way to teach Pokémon to illuminate the darkness.'
      }, {
        completed: requireMove('Strength', 1),
        msg: 'Have a Pokémon who can push illuminate darkness.'
      }, {
        completed: simpleRequirePotw(P.Regirock),
        msg: 'Catch a Pokémon who is the titan of stone.'
      }]
    }
  }),
  LUSH_ISLAND: assert<Voyage>({
    label: 'Lush Island',
    description: 'You find yourself on a small tropical island teeming with life.',
    typePrimary: 'Grass', typeSecondary: ['Bug', 'Poison'], scoreStat: 'spAttack',
    buckets: [0, 181, 368, 550],
    items: [
      ['stickybarb', ...APRICORNS, 'tinymushroom', 'bigmushroom', 'oran', 'luminousmoss', 'plumpbeans', 'sootfootroot', 'direshroom', 'energyroot'],
      ['stickybarb', ...APRICORNS, 'tinymushroom', 'bigmushroom', 'oran', 'luminousmoss', 'plumpbeans', 'sootfootroot', 'direshroom', 'energyroot'],
      ['stickybarb', ...APRICORNS, 'tinymushroom', 'bigmushroom', 'sitrus', 'leek', ...MINTS, 'luminousmoss', 'wiki', 'dazzlinghoney', 'heartygrains', 'kingsleaf', 'revivalherb'],
      ['stickybarb', ...APRICORNS,'tinymushroom', 'bigmushroom', 'sitrus', 'leek', 'grassgem', 'buggem', 'poisongem', ...MINTS, 'heartygrains', 'kingsleaf', 'revivalherb'],
    ],
    rareitems: [
      ['sunstone', 'balmmushroom', ...MINTS],
      ['balmmushroom', 'sunstone', ...MINTS],
      ['balmmushroom', 'sunstone', 'zgrassium'],
      ['balmmushroom', 'sunstone', 'meadowplate', 'insectplate', 'toxicplate', 'zgrassium', 'zbuginium', 'zpoisonium'],
    ],
    pokemon: [
      [P.Paras, P.Budew, P.Ledyba, P.Oddish, P.Sunkern, P.Chikorita],
      [P.Paras, P.Budew, P.Ledyba, P.Oddish, P.Sunkern, P.Chikorita],
      [P.Bulbasaur, P.Roselia, P.Tropius, P.Oddish, P.Foongus, P.Chikorita],
      [P.Bulbasaur, P.Roselia, P.Tropius, P.Gloom, P.Foongus, P.Bayleef],
    ],
    weatherPokemon: {
      Cloudy: [P.Gastly],
      'Diamond Dust': [P.Snover],
      Fog: [P.Exeggcute],
      'Heat Wave': [P.Petilil],
      Rain: [P.Lotad],
      Sandstorm: [P.Ferroseed],
      Snow: [P.Snover],
      Sunny: [P.Sewaddle],
      Thunderstorm: [P.Surskit],
      Windy: [P.Hoppip],
    },
    bosses: [
      [P.Vileplume, P.Scolipede, P.Leafeon],
      [P.Latias, P.Latios, P.Uxie, P.Mesprit, P.Azelf]
    ],
    unlocked: {
      hints: [{
        completed: requireItem('tm-Whirlpool'),
        msg: 'Have a way to teach Pokémon to cross whirlpools.'
      }, {
        completed: requireMove('Whirlpool', 1),
        msg: 'Have a Pokémon who can navigate through whirlpools.'
      }, {
        completed: simpleRequirePotwArr([P.Latias, P.Latios]),
        msg: 'Catch the Eon Pokémon.'
      }]
    }
  }),
  FROZEN_FALLS: assert<Voyage>({
    label: 'Frozen Falls',
    description: 'You find yourself at the base of a waterfall in a frozen tundra',
    typePrimary: 'Ice', typeSecondary: ['Water', 'Ground'], scoreStat: 'spAttack',
    buckets: [0, 171, 348, 520],
    items: [
      ['nevermeltice', 'snowball', 'ironchunk', 'swordcap', 'sandradish', 'crunchysalt'],
      ['nevermeltice', 'snowball', 'ironchunk', 'swordcap', 'sandradish', 'crunchysalt'],
      ['nevermeltice', 'snowball', 'ironchunk', 'ironball', 'stardust'],
      ['nevermeltice', 'snowball', 'ironchunk', 'stardust', 'icegem', 'watergem', 'groundgem'],
    ],
    rareitems: [
      ['dawnstone', 'icestone', 'sailfossil', 'jawfossil'],
      ['dawnstone', 'icestone', 'sailfossil', 'jawfossil'],
      ['dawnstone', 'icestone', 'sailfossil', 'jawfossil', 'zicium'],
      ['dawnstone', 'icestone', 'sailfossil', 'jawfossil', 'icicleplate', 'splashplate', 'earthplate', 'zwaterium', 'zgroundium', 'zicium'],
    ],
    pokemon: [
      [P.Swinub, P.Smoochum, P.Snorunt, P.Piplup, P.Snover, P.Stantler],
      [P.Swinub, P.Smoochum, P.Snorunt, P.Piplup, P.Snover, P.Stantler],
      [P.Swinub, P.Jynx, P.Snorunt, P.Piplup, P.Cubchoo, P.Stantler],
      [P.Piloswine, P.Jynx, P.Snorunt, P.Prinplup, P.Cubchoo, P.Stantler],
    ],
    weatherPokemon: {
      Cloudy: [P.Frillish],
      'Diamond Dust': [P.Cryogonal],
      Fog: [P.Ralts],
      'Heat Wave': [P.Numel],
      Rain: [P.Spheal],
      Sandstorm: [P.Cubone],
      Snow: [P.Cryogonal],
      Sunny: [P.Lotad],
      Thunderstorm: [P.Shinx],
      Windy: [P.Delibird],
    },
    bosses: [
      [P.Lapras, P.Glaceon, P.Weavile],
      [P.Articuno, P.Regice]
    ],
    unlocked: {
      hints: [{
        completed: requireItem('tm-Waterfall'),
        msg: 'Have a way to teach Pokémon to ascend waterfalls.'
      }, {
        completed: requireMove('Waterfall', 1),
        msg: 'Have a Pokémon who can ascend waterfalls.'
      }, {
        completed: simpleRequirePotw(P.Regice),
        msg: 'Catch a Pokémon who is the titan of ice.'
      }]
    }
  }),
  UNDERWATER_TRENCH: assert<Voyage>({
    label: 'Underwater Trench',
    description: 'You find yourself at the deepest part of the ocean.',
    typePrimary: 'Water', typeSecondary: ['Dark', 'Grass'], scoreStat: 'spDefense',
    buckets: [0, 200, 408, 609],
    items: [
      ['deepseatooth', 'deepseascale', 'pearl', 'yellowshard', 'blueshard', 'redshard', 'greenshard', 'shoalshell', 'shoalsalt'],
      ['deepseatooth', 'deepseascale', 'pearl', 'yellowshard', 'blueshard', 'redshard', 'greenshard', 'shoalshell', 'shoalsalt'],
      ['deepseatooth', 'deepseascale', 'pearl', 'yellowshard', 'blueshard', 'redshard', 'greenshard', 'shoalshell', 'shoalsalt'],
      ['deepseatooth', 'deepseascale', 'pearl', 'yellowshard', 'blueshard', 'redshard', 'greenshard', 'shoalshell', 'shoalsalt', 'watergem', 'darkgem', 'grassgem'],
    ],
    rareitems: [
      ['bigpearl', 'dragonscale', 'cometshard', 'coverfossil', 'plumefossil'],
      ['bigpearl', 'dragonscale', 'cometshard', 'coverfossil', 'plumefossil'],
      ['bigpearl', 'dragonscale', 'cometshard', 'coverfossil', 'plumefossil', 'zwaterium'],
      ['bigpearl', 'dragonscale', 'cometshard', 'coverfossil', 'plumefossil', 'splashplate', 'dreadplate', 'meadowplate', 'zgrassium', 'zwaterium', 'zdarkinium'],
    ],
    pokemon: [
      [P.Clamperl, P.Carvanha, P.Corsola, P.Seel, P.Magikarp, P.Wailmer],
      [P.Clamperl, P.Carvanha, P.Corsola, P.Seel, P.Goldeen, P.Wailmer],
      [P.Clamperl, P.Carvanha, P.Binacle, P.Clauncher, P.Finneon, P.Wailmer],
      [P.Dhelmise, P.Remoraid, P.Barboach, P.Binacle, P.Clauncher, P.Feebas, Potw(P.Basculin, {form: 'red_stripe'}), Potw(P.Basculin, {form: 'blue_stripe'})],
    ],
    weatherPokemon: {
      Cloudy: [P.Inkay],
      'Diamond Dust': [P.Shellder],
      Fog: [P.Qwilfish],
      'Heat Wave': [P.Lotad],
      Rain: [P.Alomomola],
      Sandstorm: [P.Barboach],
      Snow: [P.Shellder],
      Sunny: [P.Skrelp],
      Thunderstorm: [P.Chinchou],
      Windy: [P.Wingull],
    },
    bosses: [
      [P.Wailord, P.Clawitzer, P.Lumineon],
      [P.Lugia, P.Phione]
    ],
    unlocked: {
      hints: [{
        completed: requireItem('tm-Dive'),
        msg: 'Have a way to teach Pokémon to descend into the depths of the ocean.'
      }, {
        completed: requireMove('Dive', 1),
        msg: 'Have a Pokémon who can descend into watery depths.'
      }, {
        completed: simpleRequirePotw(P.Lugia),
        msg: 'Catch a Pokémon who is the mediator of birds.'
      }]
    }
  }),
  EERIE_GRAVEYARD: assert<Voyage>({
    label: 'Eerie Graveyard',
    description: 'You find yourself in a ghastly graveyard at midnight.',
    typePrimary: 'Ghost', typeSecondary: ['Fairy', 'Psychic'], scoreStat: 'spDefense',
    buckets: [0, 206, 418, 625],
    items: [
      ['spelltag', 'wisp', 'direshroom', 'swordcap', 'springymushroom'],
      ['reliccopper', 'spelltag', 'wisp', 'direshroom', 'swordcap', 'springymushroom'],
      ['reliccopper', 'spelltag', 'wisp', 'reapercloth', 'direshroom', 'swordcap', 'springymushroom'],
      ['reliccopper', 'spelltag', 'wisp', 'sachet', 'ghostgem', 'fairygem', 'psychicgem'],
    ],
    rareitems: [
      ['duskstone', 'relicsilver'],
      ['relicsilver', 'duskstone'],
      ['relicsilver', 'duskstone', 'zghostium'],
      ['relicsilver', 'duskstone', 'mindplate', 'spookyplate', 'pixieplate', 'zpsychicium', 'zfairium', 'zghostium'],
    ],
    pokemon: [
      [P.Gastly, P.Misdreavus, P.Shuppet, P.Ralts, P.Yamask, P.Drowzee],
      [P.Gastly, P.Misdreavus, P.Shuppet, P.Kirlia, P.Yamask, P.Drowzee],
      [P.Gastly, P.Misdreavus, P.Shuppet, P.Espurr, P.Yamask, P.Drowzee],
      [P.Haunter, P.Duskull, P.Frillish, P.Espurr, P.Phantump, P.Chingling],
    ],
    weatherPokemon: {
      Cloudy: [P.Munna],
      'Diamond Dust': [P.Snorunt],
      Fog: [P.Absol],
      'Heat Wave': [P.Litwick],
      Rain: [P.Gothita],
      Sandstorm: [P.Honedge],
      Snow: [P.Snorunt],
      Sunny: [P.Audino],
      Thunderstorm: [P.Joltik],
      Windy: [P.Drifloon],
    },
    bosses: [
      [P.Gengar, P.Espeon, P.Chimecho],
      [P.Cresselia, P.Giratina]
    ],
    unlocked: {
      hints: [{
        completed: requireItem('tr-Defog'),
        msg: 'Have a way to teach Pokémon to dispel the fog.'
      }, {
        completed: requireMove('Defog', 1),
        msg: 'Have a Pokémon who can dispel Fog.'
      }, {
        completed: simpleRequirePotw(P.Cresselia),
        msg: 'Catch a Pokémon who is the crescent personified.'
      }]
    }
  }),
  CUMULUS_CLOUDS: assert<Voyage>({
    label: 'Cumulus Clouds',
    description: 'You find yourself soaring high in the sky.',
    typePrimary: 'Flying', typeSecondary: ['Dragon', 'Ghost'], scoreStat: 'speed',
    buckets: [0, 199, 406, 606],
    items: [
      ['healthwing', 'swiftwing', 'musclewing', 'resistwing', 'geniuswing', 'cleverwing', 'prettywing', 'sharpbeak', 'softsand'],
      ['healthwing', 'swiftwing', 'musclewing', 'resistwing', 'geniuswing', 'cleverwing', 'prettywing', 'sharpbeak', 'softsand'],
      ['healthwing', 'swiftwing', 'musclewing', 'resistwing', 'geniuswing', 'cleverwing', 'prettywing', 'sharpbeak', 'softsand'],
      ['healthwing', 'swiftwing', 'musclewing', 'resistwing', 'geniuswing', 'cleverwing', 'prettywing', 'sharpbeak', 'softsand', 'flyinggem', 'dragongem', 'ghostgem'],
    ],
    rareitems: [
      ['brightpowder', 'airballoon', 'whippeddream'],
      ['brightpowder', 'airballoon', 'whippeddream'],
      ['brightpowder', 'airballoon', 'whippeddream', 'zflyinium'],
      ['brightpowder', 'airballoon', 'whippeddream', 'skyplate', 'spookyplate', 'dracoplate', 'zflyinium', 'zdragonium', 'zghostium'],
    ],
    pokemon: [
      [P.Pidgey, P.Combee, P.Yanma, P.Hoppip, P.Taillow, P.Farfetchd],
      [P.Pidgey, P.Drifloon, P.Dratini, P.Hoppip, P.Taillow, P.Farfetchd],
      [P.Chatot, P.Drifloon, P.Dratini, P.Hoppip, P.Starly, P.Hoothoot],
      [Potw(P.Rotom, {form: 'fan'}), P.Drifloon, P.Dratini, P.Skiploom, P.Pidove, P.Noctowl],
    ],
    weatherPokemon: {
      Cloudy: [P.Swablu],
      'Diamond Dust': [P.Fletchling],
      Fog: [P.Woobat, P.Natu],
      'Heat Wave': [P.Tropius],
      Rain: [P.Ducklett],
      Sandstorm: [P.Vibrava],
      Snow: [P.Fletchling],
      Sunny: [P.Ledyba],
      Thunderstorm: [P.Emolga],
      Windy: [P.Noibat],
    },
    bosses: [
      [P.Dragonite, P.Braviary, P.Jumpluff],
      [P.Ho_Oh, P.Rayquaza, P.Tornadus, P.Thundurus, P.Landorus, P.Yveltal],
    ],
    unlocked: {
      hints: [{
        completed: requireItem('tm-Fly'),
        msg: 'Have a way to teach Pokémon to soar the skies.'
      }, {
        completed: requireMove('Fly', 1),
        msg: 'Have a Pokémon who can soar skies.',
      }, {
        completed: simpleRequirePotw(P.Ho_Oh),
        msg: 'Catch a Pokémon who is the rising phoenix.'
      }]
    }
  }),
  DENSE_RAINFOREST: assert<Voyage>({
    label: 'Dense Rainforest',
    description: 'You find yourself hiding under the canopy of a giant tree.',
    typePrimary: 'Bug', typeSecondary: ['Poison', 'Grass'], scoreStat: 'speed',
    buckets: [0, 198, 402, 601],
    items: [
      [...APRICORNS, 'oran', 'wood', 'casterfern', 'whiteherb', 'powerherb', 'mentalherb', 'bigroot', 'direshroom', 'energyroot'],
      [...APRICORNS, 'apricorn', 'sitrus', 'wood', 'casterfern', 'whiteherb', 'powerherb', 'mentalherb', 'direshroom', 'energyroot'],
      [...APRICORNS, 'apricorn', 'sitrus', 'wood', 'casterfern', 'whiteherb', 'powerherb', 'mentalherb', 'bigroot', 'revivalherb'],
      [...APRICORNS, 'apricorn', 'sitrus', 'wood', 'casterfern', 'whiteherb', 'powerherb', 'mentalherb', 'bigroot', 'revivalherb', 'buggem', 'poisongem', 'grassgem'],
    ],
    rareitems: [
      ['leafstone', 'balmmushroom', 'razorfang'],
      ['balmmushroom', 'razorfang', 'leafstone'],
      ['balmmushroom', 'razorfang', 'leafstone', 'zbuginium'],
      ['balmmushroom', 'razorfang', 'leafstone', 'meadowplate', 'insectplate', 'toxicplate', 'zgrassium', 'zbuginium', 'zpoisonium'],
    ],
    pokemon: [
      [P.Slakoth, P.Seviper, P.Surskit, P.Wurmple, P.Cottonee, P.Karrablast],
      [P.Slakoth, P.Seviper, P.Scyther, P.Wurmple, P.Cottonee, P.Shelmet],
      [P.Slakoth, P.Seviper, P.Pinsir, P.Wurmple, P.Cottonee, P.Karrablast],
      [P.Vigoroth, P.Seviper, P.Heracross, P.Cascoon, P.Silcoon, P.Cottonee, P.Shelmet],
    ],
    weatherPokemon: {
      Cloudy: [P.Phantump],
      'Diamond Dust': [P.Foongus],
      Fog: [P.Stunky],
      'Heat Wave': [P.Budew],
      Rain: [P.Qwilfish],
      Sandstorm: [P.Nincada],
      Snow: [P.Foongus],
      Sunny: [P.Larvesta],
      Thunderstorm: [P.Joltik],
      Windy: [P.Yanma],
    },
    bosses: [
      [P.Scizor, P.Whimsicott, P.Lilligant],
      [P.Raikou, P.Entei, P.Suicune, P.Virizion, P.Xerneas],
    ],
    unlocked: {
      hints: [{
        completed: requireItem('tm-Cut'),
        msg: 'Have a way to teach Pokémon to slice trees.'
      }, {
        completed: requireMove('Cut', 1),
        msg: 'Have a Pokémon who can fell trees.'
      }, {
        completed: simpleRequirePotwArr([P.Raikou, P.Entei, P.Suicune]),
        msg: 'Catch Pokémon who are beastly resurrections.'
      }]
    }
  }),
  ULTRA_WORMHOLE: assert<Voyage>({
    label: 'Ultra Wormhole',
    description: 'You see a giant portal in front of you. What happens when you step through?',
    typePrimary: 'Bug', typeSecondary: ['Steel', 'Ghost'], scoreStat: 'attack',
    buckets: [0, 189, 385, 575],
    items: [
      ['strangesouvenir', 'pokebeans', ...SEEDS],
      ['strangesouvenir', 'pokebeans', ...NECTARS],
      ['strangesouvenir', 'pokebeans', ...NECTARS],
      ['strangesouvenir', 'pokebeans', ...BOTTLECAPS, ...NECTARS],
    ],
    rareitems: [
      ['strangesouvenir', 'bottlecapgold', 'icestone'],
      ['bottlecapgold', 'icestone'],
      ['bottlecapgold', 'icestone', 'zbuginium'],
      ['bottlecapgold', 'icestone', 'zbuginium', 'zsteelium', 'zghostium'],
    ],
    pokemon: [
      [Potw(P.Rattata, {form: 'alolan'}), Potw(P.Sandshrew, {form: 'alolan'}), Potw(P.Geodude, {form: 'alolan'}), Potw(P.Grimer, {form: 'alolan'}), Potw(P.Meowth, {form: 'alolan'}), Potw(P.Diglett, {form: 'alolan'})],
      [Potw(P.Rattata, {form: 'alolan'}), Potw(P.Vulpix, {form: 'alolan'}), Potw(P.Geodude, {form: 'alolan'}), Potw(P.Grimer, {form: 'alolan'}), Potw(P.Meowth, {form: 'alolan'}), Potw(P.Diglett, {form: 'alolan'})],
      [Potw(P.Raticate, {form: 'alolan'}), Potw(P.Sandslash, {form: 'alolan'}), Potw(P.Graveler, {form: 'alolan'}), Potw(P.Grimer, {form: 'alolan'}), Potw(P.Meowth, {form: 'alolan'}), Potw(P.Diglett, {form: 'alolan'})],
      [Potw(P.Raticate, {form: 'alolan'}), Potw(P.Ninetales, {form: 'alolan'}), Potw(P.Graveler, {form: 'alolan'}), Potw(P.Muk, {form: 'alolan'}), Potw(P.Persian, {form: 'alolan'}), Potw(P.Dugtrio, {form: 'alolan'})],
    ],
    weatherPokemon: {
      Cloudy: [P.Rowlet],
      'Diamond Dust': [P.Crabrawler],
      Fog: [P.Grubbin],
      'Heat Wave': [P.Litten],
      Rain: [P.Popplio],
      Sandstorm: [P.Cubone],
      Snow: [P.Crabrawler],
      Sunny: [P.Exeggcute],
      Thunderstorm: [P.Pikachu],
      Windy: [P.Pikipek],
    },
    bosses: [
      [Potw(P.Raticate, {form: 'alolan'}), Potw(P.Sandslash, {form: 'alolan'}), Potw(P.Ninetales, {form: 'alolan'}), Potw(P.Golem, {form: 'alolan'}), Potw(P.Muk, {form: 'alolan'}), Potw(P.Persian, {form: 'alolan'}), Potw(P.Dugtrio, {form: 'alolan'})],
      [...Array(3).fill(P.Cosmog), P.Type_Null],
    ],
    unlocked: {
      hints: [{
        completed: simpleRequirePotwArr([P.Rowlet, P.Litten, P.Popplio]),
        msg: 'Are you familiar with the starter Pokémon of Alola?'
      }, {
        completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_SM),
        msg: 'Become an expert on the Pokémon of Alola.'
      }]
    }
  }),
  BUTTERFLY_GARDENS: assert<Voyage>({
    label: 'Butterfly Gardens',
    description: 'You are immersed in the bright, colorful flowers of the botanical gardens. What kinds of things can you smell?',
    typePrimary: 'Fairy', typeSecondary: ['Bug', 'Grass'], scoreStat: 'hp',
    buckets: [0, 170, 345, 516],
    items: [
      [...SEEDS, ...NECTARS, 'silverpowder', 'miracleseed', 'honey', 'sweetapple', 'tartapple', 'galaricatwig', /* ...SWEETS*/],
      [...SEEDS, ...NECTARS, 'silverpowder', 'miracleseed', 'honey', 'sweetapple', 'tartapple', 'galaricatwig', /* ...SWEETS*/],
      [...SEEDS, ...NECTARS, 'silverpowder', 'miracleseed', 'honey', 'sweetapple', 'tartapple', 'galaricatwig', /* ...SWEETS*/],
      [...SEEDS, ...NECTARS, 'silverpowder', 'miracleseed', 'honey', 'sweetapple', 'tartapple', 'galaricatwig', /* ...SWEETS*/],
    ],
    rareitems: [
      ['sweetribbon', 'bottlecapgold', 'shinystone', 'leafstone'],
      ['sweetribbon', 'bottlecapgold', 'shinystone', 'leafstone'],
      ['sweetribbon', 'bottlecapgold', 'shinystone', 'leafstone', 'zfairium'],
      ['sweetribbon', 'bottlecapgold', 'shinystone', 'leafstone', 'zbuginium', 'zfairium', 'zgrassium'],
    ],
    pokemon: [
      [P.Caterpie, P.Weedle, P.Bellsprout, P.Budew, P.Cutiefly],
      [P.Metapod, P.Kakuna, P.Bellsprout, P.Roselia, P.Flabébé, P.Cutiefly],
      [P.Metapod, P.Kakuna, P.Scatterbug, P.Bellsprout, P.Roselia, P.Happiny, P.Flabébé, P.Cutiefly, P.Oricorio],
      [P.Metapod, P.Kakuna, P.Spewpa, P.Weepinbell, P.Lickitung, P.Chansey, P.Flabébé, P.Cutiefly, P.Oricorio],
    ],
    weatherPokemon: {
      Cloudy: [P.Heracross],
      'Diamond Dust': [P.Snom],
      Fog: [P.Cottonee],
      'Heat Wave': [P.Cherubi],
      Rain: [P.Marill],
      Sandstorm: [P.Bonsly],
      Snow: [P.Snom],
      Sunny: [P.Bounsweet],
      Thunderstorm: [P.Joltik],
      Windy: [P.Hoppip],
    },
    bosses: [
      [P.Bellossom, P.Blissey, P.Roserade, P.Florges],
      [
        'archipelago', 'continental', 'elegant', 'garden', 'highplains', 'icysnow',
        'jungle', 'marine', 'meadow', 'modern', 'monsoon', 'ocean', 'polar', 'river',
        'sandstorm', 'savanna', 'sun', 'tundra',
      ].map((form: PokemonForm) => Potw(P.Vivillon, {form})),
    ],
    unlocked: {
      hints: [{
        completed: simpleRequirePotwArr([P.Grookey, P.Scorbunny, P.Sobble]),
        msg: 'Are you familiar with the starter Pokémon of Galar?'
      }, {
        completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_SWSH),
        msg: 'Become an expert on the Pokémon of Galar.'
      }]
    }
  }),
  PEATSWAMP: assert<Voyage>({
    label: 'Peat Swamp',
    description: 'Wade through a thick muck as you venture deeper into the bog. What might be lurking around your feet?',
    typePrimary: 'Poison', typeSecondary: ['Ground', 'Water'], scoreStat: 'attack',
    buckets: [0, 158, 322, 481],
    items: [
      ['poisonbarb', 'stickybarb'],
      ['poisonbarb', 'stickybarb'],
      ['poisonbarb', 'stickybarb'],
      ['poisonbarb', 'stickybarb'],
    ],
    rareitems: [
      ['peatblock', 'kingsrock', 'nugget', 'rarebone', 'waterstone'],
      ['peatblock', 'kingsrock', 'nugget', 'rarebone', 'waterstone'],
      ['peatblock', 'kingsrock', 'bignugget', 'rarebone', 'waterstone'],
      ['peatblock', 'kingsrock', 'bignugget', 'rarebone', 'waterstone'],
    ],
    pokemon: [
      [P.Ekans, P.Teddiursa, P.Grimer, P.Poliwag, P.Totodile, P.Mudkip, P.Bidoof, P.Croagunk],
      [P.Ekans, P.Teddiursa, P.Grimer, P.Poliwag, P.Totodile, P.Mudkip, P.Bidoof, P.Croagunk],
      [P.Ekans, P.Teddiursa, P.Grimer, P.Poliwag, P.Totodile, P.Mudkip, P.Bidoof, P.Croagunk],
      [P.Ekans, P.Teddiursa, P.Grimer, P.Poliwhirl, P.Croconaw, P.Marshtomp, P.Bidoof, P.Toxicroak],
    ],
    weatherPokemon: {
      Cloudy: [P.Dunsparce],
      'Diamond Dust': [P.Bergmite],
      Fog: [P.Stunky],
      'Heat Wave': [P.Carnivine],
      Rain: [P.Tympole],
      Sandstorm: [P.Shuckle],
      Snow: [P.Bergmite],
      Sunny: [P.Pineco],
      Thunderstorm: [P.Stunfisk],
      Windy: [P.Venomoth],
    },
    bosses: [
      [P.Bibarel, P.Arbok, P.Amoonguss],
      [P.Seismitoad, P.Poliwrath, P.Politoed],
    ],
    unlocked: {
      hints: [{
        completed: simpleRequirePotwArr([P.Grookey, P.Scorbunny, P.Sobble]),
        msg: 'Are you familiar with the starter Pokémon of Galar?'
      }, {
        completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_SWSH),
        msg: 'Become an expert on the Pokémon of Galar.'
      }, {
        completed: simpleRequirePotw(P.Calyrex),
        msg: 'Become an expert on the legendary Pokémon of the Crown Tundra.'
      }]
    }
  }),
  CARBON_OBSERVATORY: assert<Voyage>({
    label: 'Carbon Observatory',
    description: 'In an isolated region of black mountains, you walk up the trail to a scientific laboratory. What things can you spot through the telescope?',
    typePrimary: 'Psychic', typeSecondary: ['Dark', 'Rock'], scoreStat: 'defense',
    buckets: [0, 171, 349, 521],
    items: [
      ['ironchunk', 'stardust', 'soot', 'hardstone'],
      ['ironchunk', 'stardust', 'soot', 'hardstone'],
      ['ironchunk', 'stardust', 'soot', 'hardstone'],
      ['ironchunk', 'stardust', 'starpiece', 'soot', 'hardstone'],
    ],
    rareitems: [
      ['blackaugurite', 'cometshard', 'upgrade', 'dubiousdisc', 'waterstone', 'reapercloth', 'blackglasses', 'widelens'],
      ['blackaugurite', 'cometshard', 'upgrade', 'dubiousdisc', 'waterstone', 'reapercloth', 'blackglasses', 'widelens'],
      ['blackaugurite', 'cometshard', 'upgrade', 'dubiousdisc', 'waterstone', 'reapercloth', 'blackglasses', 'widelens'],
      ['blackaugurite', 'cometshard', 'upgrade', 'dubiousdisc', 'waterstone', 'reapercloth', 'blackglasses', 'widelens'],
    ],
    pokemon: [
      [P.Stufful, P.Lunatone, P.Solrock, P.Cleffa, P.Elgyem, P.Salandit, P.Rockruff, P.Blipbug, P.Staryu],
      [P.Stufful, P.Lunatone, P.Solrock, P.Clefairy, P.Elgyem, P.Salandit, P.Rockruff, P.Dottler, P.Staryu],
      [P.Stufful, P.Lunatone, P.Solrock, P.Clefairy, P.Elgyem, P.Salandit, P.Rockruff, P.Dottler, P.Staryu, P.Sableye],
      [P.Stufful, P.Lunatone, P.Solrock, P.Clefairy, P.Carbink, P.Salandit, P.Rockruff, P.Dottler, P.Staryu, P.Sableye],
    ],
    weatherPokemon: {
      Cloudy: [P.Minior],
      'Diamond Dust': [Potw(P.Minior, {form: 'violet_core'})],
      Fog: [Potw(P.Minior, {form: 'indigo_core'})],
      'Heat Wave': [Potw(P.Minior, {form: 'red_core'})],
      Rain: [Potw(P.Minior, {form: 'blue_core'})],
      Sandstorm: [Potw(P.Minior, {form: 'orange_core'})],
      Snow: [Potw(P.Minior, {form: 'violet_core'})],
      Sunny: [Potw(P.Minior, {form: 'green_core'})],
      Thunderstorm: [Potw(P.Minior, {form: 'yellow_core'})],
      Windy: [Potw(P.Minior, {form: 'indigo_core'})],
    },
    bosses: [
      [P.Orbeetle, P.Dusknoir, P.Magnezone, P.Scyther],
      [P.Kubfu],
    ],
    unlocked: {
      hints: [{
        completed: simpleRequirePotwArr([P.Grookey, P.Scorbunny, P.Sobble]),
        msg: 'Are you familiar with the starter Pokémon of Galar?'
      }, {
        completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_SWSH),
        msg: 'Become an expert on the Pokémon of Galar.'
      }]
    }
  }),
  MISTYWOODS: assert<Voyage>({
    label: 'Misty Woods',
    description: 'Evergreens tower overhead as you make your way towards a great lake. Yet why is this fog growing thicker with each passing step?',
    typePrimary: 'Normal', typeSecondary: ['Psychic', 'Fairy'], scoreStat: 'spAttack',
    buckets: [0, 180, 367, 548],
    items: [
      ['luminousmoss', ...SEEDS, 'tartapple', 'sweetapple', 'galaricatwig'],
      ['luminousmoss', ...SEEDS, 'tartapple', 'sweetapple', 'galaricatwig'],
      ['luminousmoss', ...SEEDS, 'tartapple', 'sweetapple', 'galaricatwig'],
      ['luminousmoss', ...SEEDS, 'tartapple', 'sweetapple', 'galaricatwig'],
    ],
    rareitems: [
      ['galaricacuff', ...MINTS],
      ['galaricacuff', ...MINTS],
      ['galaricacuff', 'maxmushroom', ...MINTS],
      ['galaricacuff', 'maxmushroom', 'maxhoney', ...MINTS],
    ],
    pokemon: [
      [P.Hatenna, P.Impidimp, P.Deerling, P.Seedot, P.Basculin, P.Aipom, P.Dewpider, P.Fomantis, P.Treecko],
      [P.Hatenna, P.Impidimp, P.Deerling, P.Seedot, P.Basculin, P.Aipom, P.Dewpider, P.Fomantis, P.Treecko],
      [P.Hatenna, P.Impidimp, P.Deerling, P.Shroomish, P.Basculin, P.Aipom, P.Dewpider, P.Fomantis, P.Treecko],
      [P.Hatenna, P.Impidimp, Potw(P.Ponyta, {form: 'galarian'}), P.Shroomish, P.Basculin, P.Aipom, P.Dewpider, P.Lurantis, P.Grovyle],
    ],
    weatherPokemon: {
      Cloudy: [P.Durant],
      'Diamond Dust': [P.Cubchoo],
      Fog: [P.Zorua],
      'Heat Wave': [P.Heatmor],
      Rain: [P.Wishiwashi],
      Sandstorm: [P.Kecleon],
      Snow: [P.Cubchoo],
      Sunny: [P.Chespin],
      Thunderstorm: [P.Dedenne],
      Windy: [P.Rufflet],
    },
    bosses: [
      [P.Shiinotic, P.Hatterene, P.Grimmsnarl, P.Sawsbuck],
      [
        // Make these two a bit harder to find
        P.Zacian, P.Zamazenta,
        ...Array(5).fill(Potw(P.Rapidash, {form: 'galarian'})),
      ],
    ],
    unlocked: {
      hints: [{
        completed: simpleRequirePotwArr([P.Grookey, P.Scorbunny, P.Sobble]),
        msg: 'Are you familiar with the starter Pokémon of Galar?'
      }, {
        completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_SWSH),
        msg: 'Become an expert on the Pokémon of Galar.'
      }]
    }
  }),
  SPACETIMEDISTORTION: assert<Voyage>({
    label: 'Space-Time Distortion',
    description: 'As you walk along, you are suddenly enveloped in a dome of growing energy. What will happen once the energy reaches its peak?',
    typePrimary: 'Dark', typeSecondary: ['Fighting', 'Electric'], scoreStat: 'spDefense',
    buckets: [0, 169, 343, 513],
    items: [
      ['redshard', 'blueshard', 'greenshard', 'stardust', 'heartygrains', 'hopo', 'razz', 'casterfern', 'direshroom', 'swordcap'],
      ['redshard', 'blueshard', 'greenshard', 'stardust', 'heartygrains', 'hopo', 'razz', 'casterfern', 'direshroom', 'swordcap'],
      ['redshard', 'blueshard', 'greenshard', 'stardust', 'razorclaw', 'razorfang', 'heartygrains', 'hopo', 'razz', 'casterfern', 'direshroom', 'swordcap'],
      ['redshard', 'blueshard', 'greenshard', 'starpiece', 'razorclaw', 'razorfang', 'heartygrains', 'hopo', 'razz', 'casterfern', 'direshroom', 'swordcap'],
    ],
    rareitems: [
      ['seedofmastery', 'nugget', 'upgrade', 'metalcoat', 'electirizer', 'magmarizer', 'protector', 'reapercloth', 'leafstone'],
      ['seedofmastery', 'nugget', 'upgrade', 'metalcoat', 'electirizer', 'magmarizer', 'protector', 'reapercloth', 'leafstone'],
      ['seedofmastery', 'nugget', 'cometshard', 'dubiousdisc', 'electirizer', 'magmarizer', 'protector', 'reapercloth', 'leafstone'],
      ['seedofmastery', 'bignugget', 'cometshard', 'dubiousdisc', 'electirizer', 'magmarizer', 'protector', 'reapercloth', 'leafstone'],
    ],
    pokemon: [
      [Potw(P.Voltorb, {form: 'hisuian'}), Potw(P.Growlithe, {form: 'hisuian'}), Potw(P.Qwilfish, {form: 'hisuian'}), P.Eevee],
      [Potw(P.Voltorb, {form: 'hisuian'}), Potw(P.Growlithe, {form: 'hisuian'}), Potw(P.Qwilfish, {form: 'hisuian'}), Potw(P.Zorua, {form: 'hisuian'}), P.Eevee],
      [Potw(P.Voltorb, {form: 'hisuian'}), Potw(P.Growlithe, {form: 'hisuian'}), Potw(P.Qwilfish, {form: 'hisuian'}), Potw(P.Zorua, {form: 'hisuian'}), Potw(P.Sneasel, {form: 'hisuian'}), Potw(P.Basculin, {form: 'white_stripe'}), P.Stantler, P.Ursaring],
      [Potw(P.Voltorb, {form: 'hisuian'}), Potw(P.Growlithe, {form: 'hisuian'}), Potw(P.Qwilfish, {form: 'hisuian'}), Potw(P.Zorua, {form: 'hisuian'}), Potw(P.Sneasel, {form: 'hisuian'}), Potw(P.Basculin, {form: 'white_stripe'}), P.Cranidos, P.Shieldon],
    ],
    weatherPokemon: {
      Cloudy: [P.Rowlet],
      'Diamond Dust': [P.Bergmite],
      Fog: [P.Cyndaquil],
      'Heat Wave': [P.Petilil],
      Rain: [P.Oshawott],
      Sandstorm: [P.Goomy],
      Snow: [P.Bergmite],
      Sunny: [P.Scyther],
      Thunderstorm: [P.Magnemite],
      Windy: [P.Rufflet],
    },
    bosses: [
      [
        P.Porygon_Z, P.Rampardos, P.Bastiodon, Potw(P.Sliggoo, {form: 'hisuian'}),
        Potw(P.Golbat, {form: 'alpha'}), Potw(P.Parasect, {form: 'alpha'}),
      ],
      [
        Potw(P.Decidueye, {form: 'hisuian'}), Potw(P.Typhlosion, {form: 'hisuian'}), Potw(P.Samurott, {form: 'hisuian'}),
        Potw(P.Alakazam, {form: 'alpha'}),
      ],
    ],
    unlocked: {
      hints: [{
        completed: simpleRequirePotwArr([P.Grookey, P.Scorbunny, P.Sobble]),
        msg: 'Are you familiar with the starter Pokémon of Galar?'
      }, {
        completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_SWSH),
        msg: 'Become an expert on the Pokémon of Galar.'
      }, {
        completed: simpleRequirePotw(P.Calyrex),
        msg: 'Become an expert on the legendary Pokémon of the Crown Tundra.'
      }]
    }
  }),
  GALARIANCROSSINGS: assert<Voyage>({
    label: 'Galarian Crossings',
    description: 'You find yourself staring out at the horizon of the vast Wild Area. Where will you go first?',
    typePrimary: 'Fairy', typeSecondary: ['Steel', 'Fighting'], scoreStat: 'speed',
    buckets: [0, 168, 341, 510],
    items: [
      ['tartapple', 'sweetapple', ...GALAR_INGREDIENTS, ...SWEETS],
      ['tartapple', 'sweetapple', ...GALAR_INGREDIENTS, ...SWEETS],
      ['tartapple', 'sweetapple', 'dynamaxcandy', 'fishfossil', 'birdfossil', ...SWEETS],
      ['tartapple', 'sweetapple', 'dynamaxcandy', 'fishfossil', 'birdfossil', ...SWEETS],
    ],
    rareitems: [
      ['maxmushroom', 'wishingpiece', 'fishfossil', 'birdfossil', 'crackedpot'],
      ['maxmushroom', 'wishingpiece', 'dinofossil', 'drakefossil', 'crackedpot'],
      ['maxmushroom', 'maxhoney', 'wishingpiece', 'dinofossil', 'drakefossil', 'chippedpot', 'dynite', 'armorite'],
      ['maxmushroom', 'maxhoney', 'wishingpiece', 'dinofossil', 'drakefossil', 'chippedpot', 'dynite', 'armorite'],
    ],
    pokemon: [
      [Potw(P.Meowth, {form: 'galarian'}), Potw(P.Farfetchd, {form: 'galarian'}), Potw(P.Zigzagoon, {form: 'galarian'}), Potw(P.Darumaka, {form: 'galarian'})],
      [Potw(P.Meowth, {form: 'galarian'}), Potw(P.Slowpoke, {form: 'galarian'}), Potw(P.Farfetchd, {form: 'galarian'}), Potw(P.Zigzagoon, {form: 'galarian'}), Potw(P.Darumaka, {form: 'galarian'}), Potw(P.Yamask, {form: 'galarian'})],
      [Potw(P.Meowth, {form: 'galarian'}), Potw(P.Slowpoke, {form: 'galarian'}), Potw(P.Farfetchd, {form: 'galarian'}), Potw(P.Zigzagoon, {form: 'galarian'}), Potw(P.Darumaka, {form: 'galarian'}), Potw(P.Yamask, {form: 'galarian'}), Potw(P.Stunfisk, {form: 'galarian'})],
      [Potw(P.Meowth, {form: 'galarian'}), Potw(P.Slowpoke, {form: 'galarian'}), Potw(P.Farfetchd, {form: 'galarian'}), Potw(P.Corsola, {form: 'galarian'}), Potw(P.Zigzagoon, {form: 'galarian'}), Potw(P.Darumaka, {form: 'galarian'}), Potw(P.Yamask, {form: 'galarian'}), Potw(P.Stunfisk, {form: 'galarian'})],
    ],
    weatherPokemon: {
      Cloudy: [P.Nickit],
      'Diamond Dust': [P.Eiscue],
      Fog: [P.Dottler],
      'Heat Wave': [P.Carkol],
      Rain: [P.Chewtle],
      Sandstorm: [P.Stonjourner],
      Snow: [P.Eiscue],
      Sunny: [P.Gossifleur],
      Thunderstorm: [P.Yamper],
      Windy: [P.Rookidee],
    },
    bosses: [
      [Potw(P.Weezing, {form: 'galarian'}), Potw(P.Mr_Mime, {form: 'galarian'}), P.Greedent],
      [P.Mr_Rime, Potw(P.Articuno, {form: 'galarian'}), Potw(P.Zapdos, {form: 'galarian'}), Potw(P.Moltres, {form: 'galarian'})],
    ],
    unlocked: {
      hints: [{
        completed: simpleRequirePotwArr([P.Grookey, P.Scorbunny, P.Sobble]),
        msg: 'Are you familiar with the starter Pokémon of Galar?'
      }, {
        completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_SWSH),
        msg: 'Become an expert on the Pokémon of Galar.'
      }]
    }
  }),
  /**
  // Desert/Rural area?
  - Sandshrew, Cyndaquil, Phanpy, Electrike, Trapinch, Cacnea, Zangoose, Gible, Hippopotas, Skorupi, Maractus, Dwebble, Vullaby,
  // Plains? Safari/Serengeti? Watering Hole?
  - Venonat, Doduo, Kangaskhan, Tauros, Dratini, Girafarig, Poochyena, Blitzle, Bouffalant, Yungoos
  // Cityscape? Urban Plaza? Sewers?
  - Rattata, Meowth, Abra, Grimer, Mr. Mime, Snorlax, Snubbull, Gulpin, Glameow, Purrloin, Timburr, Venipede, Trubbish,
  // Ancient Ruins?
  - Chimecho, Relicanth, Sigilyph, Golett,
  // Shopping mall? Airport?
  - Skitty, Plusle, Minun, Pidove, Scraggy, Minccino, Vanillite, Furfrou, Klefki,
  // Farm?
  - Rattata, Ekans, Spinarak, Murkrow, Miltank, Torchic, Kricketot, Buneary, Tepig, Lillipup, Dedenne, Pumpkaboo, Mudbray,
  // Beach/Coastline?
  // Coral Reef?
  - Slowpoke, Krabby, Staryu, Lapras, Shuckle, Luvdisc, Shellos, Marieanie, Wimpod, Sandygast, Pyukumuku, Bruxish, dhelmise,
  // Great Crater/Area Zero?
  // Power Plant? Solar plant/wind turbines?
  - Togedemaru,
  // Bamboo Forest? Luminous Forest? Haunted Forest?
  - Pancham, Morelull, Oranguru, Passimian, Komala, Mimikyu, Drampa,
  // Nothing Yet (or perhaps retrofit):
  - Tangela, Ditto, Eevee, Porygon, Fossil-mons,
  - Wobbuffet,
  - Spoink, Spinda, Castform, Kecleon,
  - Turtwig, Chimchar, Burmy, Spiritomb, Phione,
  - Snivy, Pansage, Pansear, Panpour, Zorua, Solosis, Elgyem,
  - Fennekin, Froakie, Scatterbug, Spritzee, Swirlix,
  - Oricorio, Jangmo-o
  */
}

export type VoyageId = keyof typeof Voyages
