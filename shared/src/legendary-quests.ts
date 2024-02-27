import { Location, season } from "./locations-list";
import { BadgeId, PokemonId, Type, types } from "./pokemon/types";
import * as I from './gen/type-pokemon-ids'
import * as P from './gen/type-pokemon'
import * as Sw from './platform/swarms'
import { ItemId } from './items-list'
import { TeamsBadge } from "./badge2";
import { get } from "./pokemon";
import { TPokemon } from "./badge-inflate";
import { Badge, Personality } from "./badge3";
import { Users } from "./server-types";
import { FriendSafariMap } from "./friend-safari";
import { Region } from "./pokedex";
import { MoveId, MoveTypeMap } from "./gen/type-move-meta";
import { calculateNetWorth } from "./events";
import { MEGA_STONES, MEMORIES, Z_CRYSTALS } from "./prizes";
import { toBase64 } from "./baseconv";
export const CATCH_CHARM_GSC = 'LcyYjBeK4KAq1BkYgzlx'
export const CATCH_CHARM_RSE = 'vJHZReab8dpsCgz6ixJy'
export const CATCH_CHARM_DPPT = 'drIVxbAeXnuVuWCYWTf5'
export const CATCH_CHARM_BW = 'JUNIPER'
export const CATCH_CHARM_XY = 'SYCAMORE'
export const CATCH_CHARM_SM = 'KUKUI'
export const CATCH_CHARM_SWSH = 'MAGNOLIA'
export const CLEAR_BELL = 'yTIJvMaSvvpsjdLQ0nsE'
/**
 * [id]: {
 *   active: true
 *   keyItem: true
 *   badge: <badge id>
 *   encounter: Pokemon Id
 * }
 */
// Gen 1 DB IDs
export const MEWTWO = 'mKB5KRO0zXgdYRX5IT9u' // Air Mail
export const FAB_MAIL = 'Xv6mAuwg9cnNykghYYEl'
export const DREAM_MAIL = 'geEzpCyuSiPxeaVUuCen'
export const BEAD_MAIL = 'hDcDXWmJgszg2w01NsYT'
export const MEW = 'RDYwoV8ZGOpBSdrp7vUc' // Truck
// Gen 2 DB IDs
export const GYARADOS = 'GqkJ38ATL8BF4ltkTGEO'
export const LUGIA = 'nYMmUHukrSWQA6dKVhT9'
export const HO_OH = 'acEfMaNcEAbk3ZHOUJUn'
export const GS_BALL = 'uKy8bueq7RfB2Ia6akfq'
// Gen 3 DB IDs
export const REGIROCK = '4rIca77rI58p349pgWEK'
export const REGICE = 'ggJHm8iE2YI0bxlyXxjo'
export const REGISTEEL = 'u77F1gEHfRe5kbMN5hP5'
export const GROUDON = 'vf0sLO0DvvXFDvb23mlf'
export const KYOGRE = 'oscgmHCCtAgoVD15KG1e'
export const RAYQUAZA = 'KT67Urw7EtzXitZ4KFa0'
export const JIRACHI = 'BZNDy1Hccc6xO03MdStA'
export const DEOXYS = 'DX_DNA_RNA_SPACE'
export const DEOXYS_ATK = 'DX_ATK'
export const DEOXYS_DEF = 'DX_DEF'
export const DEOXYS_SPE = 'DX_SPE'
// Gen 4 DB IDs
export const SPIRITOMB = 'GZejp1VvyFQ9jGAv2fTS'
export const CRESSELIA = 'BpxsD1I3P130zMTHtYXv'
export const AZELF = 'VALOR'
export const UXIE = 'ACUITY'
export const MANAPHY = 'eCXEqefPja8yTktiDnkC'
export const DIALGA = '2J4pUD9DKaMyM1bgyuer'
export const PALKIA = 'MgVCiDYOZSai0b1wTYVw'
export const HEATRAN = 'STARK'
export const REGIGIGAS = 'SNOWPOINT'
export const GIRANTINA = 'DISTORTION'
export const DARKRAI = 'PdRaCqqYpkh12XD6dQn1'
export const SHAYMIN = 'GRACIDEA'
export const ARCEUS = 'VOIDEGG'
// Gen 5 DB IDs
export const COBALION = 'ATHOS'
export const TERRAKION = 'PORTHOS'
export const VIRIZION = 'ARAMIS'
export const LANDORUS = 'DJINN'
export const VICTINI = 'VDAY'
export const RESHIRAM = 'TRUTH'
export const ZEKROM = 'IDEALS'
export const KYUREM = 'DRAGONSHELL'
export const KELDEO = 'DARTAGNAN'
export const MELOLETTA = 'FOLKMUSIC'
export const GENESECT = 'PLASMABUG'
export const KYUREM_BLACK = 'BLACKDRAGON'
export const KYUREM_WHITE = 'WHITEDRAGON'
export const THERIAN = 'LOOKING_GLASS'
export const VOYAGEPASS = 'VOYAGES'
export const VOYAGECHARM = 'FULLPASSPORT'
// Gen 6 IDs
export const VIVILLON = 'POKEBALLFLY'
export const XERNEAS = 'XLIFEPOKEMON'
export const YVELTAL = 'YDESTRUCTIONPOKEMON'
export const ZYGARDECELL = 'POKEMONZ'
export const VOLCANION = 'STEAMENGINE'
export const DIANCIE = 'CARBONJEWEL'
export const HOOPA = 'ITSHOOPANING'
export const PRISONBOTTLE = 'PANDORASBOX'
export const TOWNMAP = 'THEMAP'
// Gen 7 IDs
export const TYPE_NULL = 'RKS_SYSTEM'
export const TAPU_KOKO = 'MELEMELEGUARDIAN'
export const TAPU_LELE = 'AKALAGUARDIAN'
export const TAPU_BULU = 'ULAULAGUARDIAN'
export const TAPU_FINI = 'PONIGUARDIAN'
export const SUN_FLUTE = 'ABCDEflat'
export const MOON_FLUTE = 'EFGABCsharp'
export const NECROZMA = 'LIGHTEATING'
export const NECROZMA_Z = 'ULTRANECROZMA'
export const NECROZMA_SOLGALEO = 'DUSKMANE'
export const NECROZMA_LUNALA = 'DAWNWING'
export const NIHILEGO = 'SYMBIONT'
export const BUZZWOLE = 'ABSORPTION'
export const PHERAMOSA = 'BEAUTY'
export const XURKITREE = 'LIGHTING'
export const CELESTEELA = 'BLASTER'
export const KARTANA = 'BLADE'
export const GUZZLORD = 'GLUTTONY'
export const STAKATAKA = 'BRICKBREAK'
export const BLACEPHALON = 'MINDBLOWN'
export const POIPOLE = 'TINYPOISONULTRABEAST'
export const MAGEARNA = 'STEAMPUNK'
export const MAGEARNA_POKEBALL = 'CLOCKWORK'
export const ZERAORA = 'THEPOWEROFUS'
export const MARSHADOW = 'MOVIE20'
// Gen 8 IDs
export const CRAFTING = 'CRAFTINGKIT'
export const ZACIAN = 'THECROWNEDSWORD'
export const ZAMAZENTA = 'THECROWNEDSHIELD'
export const ETERNATUS = 'ETERNALPOWER'
export const KUBFU = 'FIGHTERFROMTHEEAST'
export const URSHIFUWATER = 'WATERTOWERSCROLL'
export const URSHIFUDARK = 'DARKTOWERSCROLL'
export const ZARUDE = 'SECRETSOFTHEJUNGLE'
export const REGIELEKI = 'SPLITDECISIONLEFT'
export const REGIDRAGO = 'SPLITDECISIONRIGHT'
export const GLASTRIER = 'ICYCARROTHORSEY'
export const SPECTRIER = 'SHADOWCARROTHORSEY'
export const CALYREX = 'KINGWITHBIGHEAD'
export const PLAPONY = 'PECULIARPONYTA'
export const ENAMORUS = 'HERALDOFSPRING'
export const LEGENDSPLATE = 'LEGENDSARCEUSPLATE'
const oneDayAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).getTime()
const oneWeekAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).getTime()
export interface Requirements {
  userJoinedDate: number // Timestamp
  location: Location
  badgeKeys: BadgeId[]
  teamsBadges: [TeamsBadge, number][]
  pokemonBadges: [Badge, number][]
  pokemonKeys: PokemonId[]
  pokemon: TPokemon
  items: {[item in ItemId]?: number}
  hiddenItemsFound: string[]
  battleStadiumRecord: number[]
  id: string
  researchCompleted: number
  raidRecord: number[]
  berryGrown: number
  totalTrades: number
  pokedex: {
    kanto: number
    johto: number
    hoenn: number
    sinnoh: number
    unova: number
    kalos: number
    alola: number
    galar: number
    hisui: number
    paldea: number
  }
  eggsLaid: number
  moveTutors: number
  friendSafari: string
  itemsCrafted: number
  voyagesCompleted: number
  evolutions: number
  forms: number
  restorations: number
}
export interface Task {
  /** Function to run to evaluate if the task is complete */
  completed: (r: Requirements) => boolean | Promise<boolean>
  /** Message presented to the user */
  msg: string
  /** Machine-focused explanation of how to complete task */
  spoiler?: string
}
export interface LegendaryQuest {
  hints: Task[]
}
const ONE_WEEK_ERR = `You sense a powerful force blocking your progress. Try again later.`
export function haveCaught(count: number) {
  return (req: Requirements) => Object.values(req.pokemon)
  .reduce((prev, curr) => prev + curr) >= count
}
/**
 * Verifies if you have a certain Pokemon in your collection using nat dex number only.
 * @param prefix The Pokemon's nat dex number, encoded as a base64 string
 * @returns true if this Pokemon appears, short-circuits
 */
export function simpleRequirePotw(badge: BadgeId) {
  const b64 = toBase64(new TeamsBadge(badge).id.toString(16).toUpperCase())
  return (req: Requirements) => {
    for (const k of req.pokemonKeys) {
      const ks = k.split('#')
      if (ks[0] === b64) return true
    }
    return false
  }
}
export function simpleRequirePotwArr(badge: BadgeId[]) {
  const b64 = badge.map(b => toBase64(new TeamsBadge(b).id.toString(16).toUpperCase()))
  const validArray = Array(badge.length).fill(false)
  return (req: Requirements) => {
    for (const k of req.pokemonKeys) {
      const ks = k.split('#')
      const i = b64.indexOf(ks[0])
      if (i > -1) {
        validArray[i] = true
      }
      if (validArray.every(x => x)) return true
    }
    return false
  }
}
export function complexRequirePotw(badge: BadgeId, personality: Partial<Personality>) {
  const pid = new TeamsBadge(badge).id
  return (req: Requirements) => {
    return Badge.quickMatch(pid, personality, Object.keys(req.pokemon) as PokemonId[])
  }
}
type BidQuestFilter = (badge: BadgeId) => boolean | undefined;
type LegacyQuestFilter = (badge: TeamsBadge) => boolean | undefined;
type QuestFilter = (badge: Badge) => boolean | undefined;
export function countForBid(filter: BidQuestFilter, total = 1) {
  return (req: Requirements) => {
    const tempArr = req.teamsBadges
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .filter(([key, _]) => filter(key.toString()))
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(([_, value]) => value)
    let count = 0
    for (const v of tempArr) {
      count += v
      if (count >= total) return true
    }
    return false
  }
}
export function countForLegacy(filter: LegacyQuestFilter, total = 1) {
  return (req: Requirements) => {
    const tempArr = req.teamsBadges
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .filter(([key, _]) => filter(key))
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(([_, value]) => value)
    let count = 0
    for (const v of tempArr) {
      count += v
      if (count >= total) return true
    }
    return false
  }
}
export function countFor(filter: QuestFilter, total = 1) {
  return (req: Requirements) => {
    const tempArr = req.pokemonBadges
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .filter(([key, _]) => filter(key))
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(([_, value]) => value)
    let count = 0
    for (const v of tempArr) {
      count += v
      if (count >= total) return true
    }
    return false
  }
}
export function requirePotw(badges: [BadgeId, Partial<Personality>][]) {
  return (req: Requirements) =>
    badges.every(b => complexRequirePotw(b[0], b[1])(req))
}
export function requirePotwCount(badges: [BadgeId, Partial<Personality>][]) {
  return (req: Requirements) =>
    badges.filter(b => complexRequirePotw(b[0], b[1])(req)).length
}
export function requireMove(move: MoveId, total = 1) {
  return (req: Requirements) => {
    const tempArr = req.teamsBadges
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .filter(([key, _]) => get(key.toString())?.move.map(m => MoveTypeMap[m]!.name).includes(move))
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(([_, value]) => value)
    let count = 0
    for (const v of tempArr) {
      count += v
      if (count >= total) return true
    }
    return false
  }
}
export function countType(type: Type) {
  return (req: Requirements) => {
    const typeArr = Object.entries(req.pokemon)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .filter(([key, _]) => {
      const dbkey = new Badge(key).toLegacyString()
      const db = get(dbkey)!
      return db.type1 === type || db.type2 === type
    })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(([_, value]) => value)
    if (typeArr.length) {
      return typeArr.reduce((prev, curr) => prev + curr)
    }
    return 0
  }
}
export function requireType(type: Type, total: number) {
  return (req: Requirements) => {
    let count = 0
    for (const [key, c] of Object.entries(req.pokemon)) {
      const dbkey = new Badge(key).toLegacyString()
      const db = get(dbkey)
      if (!db) continue;
      if (db.type1 === type || db.type2 === type) {
        count += c
      }
      // Short-circuit even if we're only partially through calc
      if (count >= total) return true
    }
    return false
  }
}
export function requireItem(item: ItemId | ItemId[], count = 1): (req: Requirements) => boolean {
  if (Array.isArray(item)) {
    return (req: Requirements) =>
      item.filter(i => req.items[i] !== undefined && req.items[i]! >= count).length === item.length
  }
  return (req: Requirements) => req.items[item] !== undefined && req.items[item]! >= count
}
export function countItem(item: ItemId[]): (req: Requirements) => number {
  return (req: Requirements) =>
    item.filter(i => req.items[i] !== undefined && req.items[i]! > 0).length
}
export function registerShinyRegion(region: Region): (req: Requirements) => number {
  return (req: Requirements) => {
    const badgeMap = new Map()
    if (!req.pokemon) return 0
    for (const key of Object.keys(req.pokemon)) {
      const badge = new Badge(key)
      if (badge.personality.shiny) {
        const {id} = badge
        if (region.range[0] <= id && id <= region.range[1]) {
          badgeMap.set(badge.id, true)
        }
      }
    }
    return [...badgeMap.values()].filter(n => n === true).length
  }
}
export const Squirtbottle: LegendaryQuest = {
  hints: [{
    completed: simpleRequirePotw(P.Squirtle),
    msg: 'There is a watering can shaped like a turtle Pokémon.'
  }, {
    completed: simpleRequirePotw(P.Geodude),
    msg: 'Rock-type Pokémon do not like water, particularly this one that looks like a rock.'
  }, {
    completed: simpleRequirePotw(P.Ponyta),
    msg: 'Fire-type Pokémon also do not like water. This one is racing away from you.'
  }, {
    completed: simpleRequirePotw(P.Diglett),
    msg: 'Ground-type Pokémon likewise detest water. This one has burrowed into its hole.'
  }]
}
export const BerryPouch: LegendaryQuest = {
  hints: [{
    completed: (r) => r.hiddenItemsFound.includes('s233iymSHWm4HxT3Q2M4') || (r.items.squirtbottle ?? 0) > 0, // Squirtbottle quest
    msg: 'You will need something to water with'
  }, {
    completed: simpleRequirePotw(P.Bulbasaur),
    msg: 'Have you seen this Pokémon? It has a giant bulb on its back!'
  }, {
    completed: requireItem('oran'),
    msg: 'There are many berries that can be planted. This one looks large and blue.',
  }, {
    completed: requireMove('Rototiller', 1),
    msg: 'You need a Pokémon that can TILL the soil.'
  }]
}
/**
 * Quest to complete to get a transit pass.
 */
export const Pokedoll: LegendaryQuest = {
  hints: [{
    completed: (r) => r.userJoinedDate <= oneDayAgo,
    msg: ONE_WEEK_ERR
  }, {
    completed: simpleRequirePotw(P.Clefairy),
    msg: 'The doll reminds you of a certain Pokémon'
  }, {
    completed: requireItem('moonstone'),
    msg: 'Did you know Clefairy have a connection to a certain stone from space?'
  }, {
    completed: simpleRequirePotw(P.Clefable),
    msg: 'What does Clefairy evolve into?'
  }, {
    completed: haveCaught(20),
    msg: 'Quick traveling can get you to new places to catch more Pokémon, but have you caught them all here?'
  }]
}
export const Devonscope: LegendaryQuest = {
  hints: [{
    completed: simpleRequirePotw(P.Gastly),
    msg: 'The Silph Scope made this ghostly Pokémon visible.'
  }, {
    completed: simpleRequirePotw(P.Staryu),
    msg: 'Some Pokémon can blend into their surroundings, like this star-shaped Pokémon.'
  }, {
    completed: simpleRequirePotw(P.Shuppet),
    msg: 'The source is not a Ghost-type Pokémon from the Hoenn region. This one looks like a puppet.'
  }, {
    completed: simpleRequirePotw(P.Duskull),
    msg: 'The source is not a Ghost-type Pokémon from the Hoenn region. This one looks like a skull.'
  }, {
    completed: requireItem(['widelens']),
    msg: 'Perhaps you need a lens to help you see better.'
  }, {
    completed: simpleRequirePotw(P.Beldum),
    msg: 'Steven Stone may be able to help you. He has a small metallic Pokémon.'
  },]
}
export const Swarms: LegendaryQuest = {
  hints: [{
    completed: simpleRequirePotwArr([P.Bulbasaur, P.Charmander, P.Squirtle]),
    msg: 'Professor Oak reports swarms in Kanto.'
  }, {
    completed: simpleRequirePotwArr([P.Chikorita, P.Cyndaquil, P.Totodile]),
    msg: 'Professor Elm reports swarms in Johto.'
  }, {
    completed: simpleRequirePotwArr([P.Treecko, P.Torchic, P.Mudkip]),
    msg: 'Professor Birch reports swarms in Hoenn.'
  }, {
    completed: simpleRequirePotwArr([P.Turtwig, P.Chimchar, P.Piplup]),
    msg: 'Professor Rowan reports swarms in Sinnoh.'
  }, {
    completed: requireItem('tr-Sweet Scent'),
    msg: 'A lot of Pokémon will be attracted to something that has a sweet scent.',
  }]
}
export const Ovalcharm: LegendaryQuest = {
  hints: [{
    completed: (r) => r.eggsLaid > 50,
    msg: 'Collect over 50 eggs from the Day Care.'
  }, {
    completed: simpleRequirePotw(P.Togepi),
    msg: 'Have you seen this cute baby Pokémon? Its body is an eggshell!'
  }]
}
export const Bank: LegendaryQuest = {
  hints: [{
    completed: (r) => r.moveTutors >= 10,
    msg: 'Use the Move Tutor 10 times.'
  }, {
    completed: (r) => r.researchCompleted >= 20,
    msg: 'Complete 20 research tasks.'
  }, {
    completed: (r) => r.totalTrades >= 30,
    msg: 'Trade 30 times.'
  }, {
    completed: (r) => r.berryGrown >= 40,
    msg: 'Plant and harvest 40 berries.',
  }, {
    completed: (r) => r.eggsLaid >= 50,
    msg: 'Collect over 50 eggs from the Day Care.'
  }, {
    completed: haveCaught(500),
    msg: 'Catch 500 Pokémon.'
  }]
}
export const Megas: LegendaryQuest = {
  hints: [{
    completed: requireItem('gengarite'),
    msg: 'You may want to find a companion stone for your Pokémon. One may fit a ghastly partner.',
  }, {
    completed: (r) => r.moveTutors > 25,
    msg: `Mega evolution may boost your Pokémon's power, but so can move tutors.`
  }, {
    completed: requireItem(['tr-Grassy Terrain', 'tr-Misty Terrain', 'tr-Psychic Terrain', 'tr-Electric Terrain']),
    msg: 'More than just your Pokémon, you must excel at battling on many terrains.'
  }, {
    completed: simpleRequirePotwArr([P.Venusaur, P.Charizard, P.Blastoise]),
    msg: 'What causes Kanto starter Pokémon to mega evolve? We will need them to start with.'
  }, {
    completed: (r) => r.researchCompleted > 150 /* Level 6 */,
    msg: 'Professor Sycamore will ask you to complete research. Do you have enough experience with research tasks?'
  }]
}
export const ExplorerKit: LegendaryQuest = {
  hints: [{
    completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_DPPT),
    msg: 'Professor Rowan may know a lot about fossils.',
  }, {
    completed: (r) => {
      const hasPkmn = simpleRequirePotwArr(
        [P.Omanyte, P.Kabuto, P.Aerodactyl, P.Lileep, P.Anorith, P.Cranidos, P.Shieldon]
      )(r)
      const hasItems = requireItem(
        ['helixfossil', 'domefossil', 'oldamber', 'rootfossil', 'clawfossil', 'skullfossil', 'armorfossil']
      )(r)
      return hasPkmn || hasItems
    },
    msg: 'There may be some Pokémon that can be restored from fossils.'
  }, {
    completed: (r) => r.researchCompleted > 60,
    msg: 'Complete enough tasks to earn the trust of the professors.'
  }, {
    completed: requireType('Rock', 100),
    msg: 'Fossil Pokémon are part Rock-type. Catch enough of these to gain a strong understanding of them.'
  }, {
    completed: requireItem('tm-Dig'),
    msg: 'Have a way to DIG down underground.',
  }]
}
export const EnigmaStone: LegendaryQuest = {
  hints: [{
    completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_BW),
    msg: 'Professor Juniper has a new quest for you.'
  }, {
    completed: (r) => r.raidRecord[1] >= 151,
    msg: 'First obtain experience in raids.'
  }, {
    completed: countForLegacy(x => get(x.toString())!.rarity === 'LEGENDARY', 30),
    msg: 'Are you able to handle legendary Pokémon?'
  }]
}
export const TrophyGarden: LegendaryQuest = {
  hints: [{
    completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_DPPT),
    msg: 'Professor Rowan has a quest for you.'
  }, {
    completed: simpleRequirePotw(P.Happiny),
    msg: 'There is a garden where a Happy baby Pokémon roams.'
  }, {
    completed: haveCaught(151),
    msg: 'Did you know there are 151 Pokémon who are known to inhabit in the Sinnoh region?'
  }]
}
export const ColressMchn: LegendaryQuest = {
  hints: [{
    completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_BW),
    msg: 'Professor Juniper has a quest for you.'
  }, {
    completed: simpleRequirePotwArr([
      P.Purrloin, P.Pidove, P.Woobat, P.Timburr, P.Tympole, P.Boldore,
      P.Sandile, P.Darumaka, P.Darmanitan, P.Sigilyph, P.Zorua, P.Joltik,
      P.Ferroseed, P.Klink
    ]),
    msg: 'Have you heard the legends of a Unovan named "N"? He is said to have befriended many Pokémon.',
  }, {
    completed: simpleRequirePotw(P.Crustle),
    msg: 'You are sent to find a renowned scientist, but a Crustle is blocking your path.'
  }, {
    completed: (r) => r.battleStadiumRecord[1] >= 151,
    msg: 'A scientist named Colress wishes to challenge you to battle. Do you have a good battle record?'
  }, {
    completed: simpleRequirePotwArr([
      P.Magneton, P.Rotom, P.Metagross, P.Beheeyem, P.Magnezone, P.Klinklang,
    ]),
    msg: 'Colress has caught several strong Pokémon. He wishes to compare that to his own collection.'
  }, {
    completed: requireItem(['dnasplicerblack', 'dnasplicerwhite']),
    msg: 'Colress does not remember meeting you before. Are there other items you have that he may have invented?'
  }]
}
export const FriendSafari: LegendaryQuest = {
  hints: [{
    completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_XY),
    msg: 'Professor Sycamore has a quest for you.'
  }, {
    completed: simpleRequirePotwArr([P.NidoranF, P.NidoranM, P.Doduo, P.Exeggcute, P.Rhyhorn, P.Chansey, P.Tangela, P.Kangaskhan, P.Scyther, P.Pinsir, P.Tauros, P.Dratini]),
    msg: 'Have you visited the Safari Zone from Kanto? There are many Pokémon there.'
  }, {
    completed: (r) => { return simpleRequirePotwArr([...FriendSafariMap[r.id.substring(0, 1)]])(r) },
    msg: 'Have you visited the Friend Safari from Kalos? There are some Pokémon you will find there.'
  }, {
    completed: (r) => r.friendSafari?.length > 0,
    msg: 'Make some friends. Try trading with them.'
  }]
}
export const SootSack: LegendaryQuest = {
  hints: [{
    completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_RSE),
    msg: 'Professor Birch has a quest for you.'
  }, {
    completed: ({pokemon}) => {
      const map = Object.entries(pokemon)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([key, _]) => new Badge(key).id === I.Spinda)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(([_, value]) => value)
      if (map.length) {
        return map.reduce((prev, curr) => prev + curr) > 12
      }
      return false
    },
    msg: 'There is a Pokémon with a variety of spots. Can you find a few of them?'
  }, {
    completed: simpleRequirePotw(P.Skarmory),
    msg: 'Have you ever seen a metallic bird?'
  }, {
    completed: simpleRequirePotw(P.Sandshrew),
    msg: 'Have you ever seen this desert Pokémon curl into a ball?'
  }, {
    completed: requireItem('lavacookie'),
    msg: 'You have caught a lot of Pokémon! Take a break with a cookie.'
  }]
}
export const ZygardeCube: LegendaryQuest = {
  hints: [{
    completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_XY),
    msg: 'Dexio and Sina have a quest from Professor Sycamore',
  }, {
    completed: requireType('Ground', 50),
    msg: 'Collect experience with Ground-type Pokémon.'
  }, {
    completed: requireType('Dragon', 100),
    msg: 'Collect experience with Dragon-type Pokémon.'
  }, {
    // This will require the general Zygarde quest to be completed first
    // (although in theory you could receive this item in a trade).
    completed: requireItem('zygardecell'),
    msg: 'Have you seen any strange green things?'
  }]
}
export const Goggles: LegendaryQuest = {
  hints: [{
    completed: countForBid(p => get(p)?.tiers?.includes('Emerald Cup'), 211),
    msg: 'Catch a dex worth of Pokémon.'
  }, {
    completed: countFor(p => p.personality.variant !== undefined, 211),
    msg: 'Some Pokémon are "variants" and have different backgrounds. Catch a bunch to research different kinds.'
  }, {
    completed: requireItem(['sceptileite', 'blazikenite', 'swampertite']),
    msg: 'Have you caught the starter Pokémon of Hoenn? Did you know they can mega evolve?'
  }]
}
for (let i = 0; i < 18; i++) {
  Goggles.hints.push({
    completed: requireType(types[i], 200),
    msg: `Gain experience catching at least 200 ${types[i]}-type Pokémon.`,
  })
}
export const OddKeystone: LegendaryQuest = {
  hints: [{
    completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_DPPT),
    msg: 'Professor Rowan has contacted you with a quest.'
  }, {
    completed: requireType('Ghost', 108),
    msg: 'Collect experience with Ghost-type Pokémon.'
  }, {
    completed: requireType('Dark', 108),
    msg: 'Collect experience with Dark-type Pokémon.'
  }]
}
export const UnownReport: LegendaryQuest = {
  hints: [{
    completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_GSC),
    msg: 'Professor Elm has a quest for you.'
  }, {
    completed: (r) => r.hiddenItemsFound.includes(CLEAR_BELL),
    msg: 'Eusine may help you on this quest if you have impressed him.'
  }, {
    completed: simpleRequirePotw(P.Unown),
    msg: 'Have you encountered the Pokémon which looks like a?'
  }, {
    completed: requireMove('Hidden Power', 26),
    msg: 'Do your Pokémon know how to use their Hidden Power?'
  }]
}
export const ZRing: LegendaryQuest = {
  hints: [{
    completed: countForBid(p => get(p)?.tiers?.includes('Ultra Cup'), 400),
    msg: 'Catch a dex worth of "Ultra" Pokémon.'
  }, {
    completed: countFor(p => p.personality.variant !== undefined, 400),
    msg: 'Some Pokémon are "variants" and have different backgrounds. Catch a bunch to research different kinds.'
  }]
}
for (let i = 0; i < 18; i++) {
  ZRing.hints.push({
    completed: requireType(types[i], 40),
    msg: `Gain some experience with ${types[i]}-type Pokémon.`
  })
}
export const AdrenalineOrb: LegendaryQuest = {
  hints: [{
    completed: requireItem('zpowerring'),
    msg: 'First, obtain a Z-Power Ring.'
  }, {
    completed: requireItem(['zgrassium', 'zfirium', 'zwaterium']),
    msg: 'Next, obtain some Z-Crystals.'
  }, {
    completed: (r) => r.battleStadiumRecord[1] >= 200,
    msg: 'Now, try out some battles.'
  }, {
    completed: (r) => r.pokedex.alola >= 9,
    msg: 'You may have success with your current team, but try finding Pokémon from the Alola region.'
  }, {
    completed: (r) => r.voyagesCompleted >= 12,
    msg: 'There are many Pokémon in the world. Take some voyages and discover them.'
  }, {
    completed: (r) => r.location.terrain === 'Tropical',
    msg: 'Have you been to Alola? Places like it are very Tropical.'
  }]
}
export const CraftingKit: LegendaryQuest = {
  hints: [{
    completed: (r) => calculateNetWorth(r as unknown as Users.Doc) > 10_000,
    msg: 'Collect a significant number of valuable items before using them for crafting.'
  }, {
    completed: (r) => r.researchCompleted > 100,
    msg: 'Learn crafting from your elders. Complete more tasks for professors.'
  }, {
    completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_DPPT),
    msg: 'Crafting was a skill honed long ago in the Hisui region, which is today known as Sinnoh.'
  }]
}
export const TownMap: LegendaryQuest = {
  hints: [{
    completed: (r) => r.hiddenItemsFound.includes('36NAlRfdNYXVi0Nh2Xvz'),
    msg: 'Obtain the ability to travel around the world.',
  }, {
    completed: simpleRequirePotw(P.Paras),
    msg: 'Have you seen this Pokémon in forests? Mushrooms grow on its back.'
  }, {
    completed: simpleRequirePotw(P.Meowth),
    msg: 'Have you seen this Pokémon in cities? It has a slick coin on its head.'
  }, {
    completed: simpleRequirePotw(P.Poliwag),
    msg: 'Have you seen this Pokémon in bays? It has a transparent belly.'
  }, {
    completed: simpleRequirePotw(P.Shellder),
    msg: 'Have you seen this Pokémon on beaches? It likes to eat Slowpoke tails.'
  }, {
    completed: simpleRequirePotw(P.Seel),
    msg: 'Have you seen this Pokémon on the open seas? Its fat helps it in colder climates.'
  }, {
    completed: simpleRequirePotw(P.Krabby),
    msg: 'Have you seen this Pokémon along the Mediterranean? Its sharp pincers help in battle.'
  }, {
    completed: simpleRequirePotw(P.Magnemite),
    msg: 'Have you seen this Pokémon on mountain trails? Its has a magnetic personality.'
  }, {
    completed: simpleRequirePotw(P.Goldeen),
    msg: 'Have you seen this Pokémon when the tide is low? Its orange hues are magnificent when it swims.',
  }, {
    completed: simpleRequirePotw(P.Dratini),
    msg: 'Have you seen this Pokémon? In the fog, during the day, you might encounter its molted skin instead.',
  }, {
    completed: simpleRequirePotw(P.Drifloon),
    msg: 'Have you seen this Pokémon? On Fridays it will blow into your location.',
  }, {
    completed: simpleRequirePotw(P.Cubchoo),
    msg: 'Have you seen this little bear? It likes to play near icy rocks.',
  }, {
    completed: simpleRequirePotw(P.Fletchling),
    msg: 'Have you seen this little red bird? If you hold a particular Mega Stone, it may come out of hiding.',
  }, {
    completed: simpleRequirePotw(P.Yungoos),
    msg: 'Have you seen this small bitey mongoose? If you hold a particular Z-Crystal, it may come out of hiding.',
  }, {
    completed: simpleRequirePotw(Sw.Swarms['North America']),
    msg: 'Have you noticed that a particular Pokémon has appeared in a mass outbreak around Mountain View?'
  }, {
    completed: simpleRequirePotw(P.Vivillon),
    msg: 'Have you seen this butterfly Pokémon? It has a wide variety of patterns.'
  }]
}
/**
 * BW Catching Charm
 * Get Transit Pass
 * Complete 30 research tasks
 * Win 30 raids
 */
export const VoyagePass: LegendaryQuest = {
  hints: [{
    completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_BW),
    msg: 'Professor Juniper has a quest for you to complete.'
  }, {
    completed: (r) => r.hiddenItemsFound.includes('36NAlRfdNYXVi0Nh2Xvz'),
    msg: 'To go on voyages, you will need to take the Magnet Train.'
  }, {
    completed: (r) => r.researchCompleted > 60,
    msg: 'Complete tasks for professors.'
  }, {
    completed: (r) => r.raidRecord[1] > 60,
    msg: 'Become victorious in large raid battles. You will need the experience.'
  }, {
    completed: (r) => r.berryGrown > 100,
    msg: 'You will obtain many items. Some may be ready to be planted in the ground.'
  }]
}
export const VoyageCharm: LegendaryQuest = {
  hints: [{
    completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_SWSH),
    msg: 'As you complete your PokéDex, you may find ways to unlock additional voyages.'
  }, {
    completed: (r) => r.researchCompleted > 240,
    msg: 'Complete tasks for professors.'
  }, {
    completed: (r) => r.raidRecord[1] > 240,
    msg: 'You need to prove yourself as a victor of many raids.'
  }, {
    completed: (r) => r.voyagesCompleted > 180, // 3/day * 30days/mo * 2 mo
    msg: 'Voyages can be long an arduous, but once you do enough of them you become equipped to do them.'
  }, {
    completed: simpleRequirePotwArr([P.Wyrdeer, P.Ursaluna, P.Braviary, P.Sneasler, P.Basculegion]),
    msg: 'Legends say that in the old land of Hisui people would go on voyages by traveling on their Pokémon.'
  }]
}
export const ForageBag: LegendaryQuest = {
  hints: [{
    completed: (r) => r.berryGrown > 140,
    msg: 'Grow many plants to learn about flowers and pollen.'
  }, {
    completed: (r) => r.itemsCrafted >= 30,
    msg: 'Berries can be used as materials in crafting.'
  }, {
    completed: requireType('Flying', 140),
    msg: 'Many birds are attracted to pollenating flowers. Catch some.'
  }, {
    completed: simpleRequirePotw(P.Tropius),
    msg: "This Pokémon doesn't need to forage. It's got fruit hanging from its neck!"
  }, {
    completed: simpleRequirePotw(P.Amoonguss),
    msg: "When foraging for mushrooms, make sure they aren't poisonous."
  }, {
    completed: (r) => r.forms >= 30,
    msg: 'There is a particular Pokémon whose form changes with nectar. Gain experience with changing forms.'
  }, {
    completed: (r) => r.voyagesCompleted >= 15,
    msg: 'As you go on voyages, you may find different nectars.'
  }, {
    completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_XY),
    msg: 'Professor Sycamore might be a good research partner in foraging.'
  }]
}
export const ItemFinder: LegendaryQuest = {
  hints: [{
    completed: (r) => r.battleStadiumRecord[1] >= 300,
    msg: 'Become a successful Pokémon battler.'
  }, {
    completed: (r) => r.restorations >= 30,
    msg: 'Items you collect can be used to restore Pokémon. Try restoring some.'
  }, {
    completed: requireType('Ground', 140),
    msg: 'To find items underground, you may want to collect Pokémon deeply connected to the earth.'
  }, {
    completed: simpleRequirePotw(P.Swinub),
    msg: 'Did you know Swinub use their noses to find hot springs?'
  }, {
    completed: simpleRequirePotw(P.Nosepass),
    msg: 'Did you know Nosepass can sense magnetic fields?'
  }, {
    completed: (r) => r.voyagesCompleted >= 15,
    msg: 'As you go on voyages, you may find different items.'
  }, {
    completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_XY),
    msg: 'Professor Sycamore might be a good research partner in finding hidden items.'
  }, {
    completed: haveCaught(999),
    msg: "Have you caught a lot of Pokémon? They are good, as good as gold.",
  }]
}
export const DynamaxBand: LegendaryQuest = {
  hints: [{
    completed: (r) => r.battleStadiumRecord[1] >= 50 && r.raidRecord[1] >= 50,
    msg: 'Become a successful Pokémon battler against trainers and in raids.'
  }, {
    completed: (r) => r.itemsCrafted >= 15,
    msg: 'Are you familiar with the curries crafted in the Galar region?'
  }, {
    completed: simpleRequirePotwArr([P.Rillaboom, P.Cinderace, P.Inteleon]),
    msg: 'Are you familiar with the starter Pokémon of the Galar region?'
  }]
}
export const CampingGear: LegendaryQuest = {
  hints: [{
    completed: (r) => r.battleStadiumRecord[1] >= 50 && r.raidRecord[1] >= 50,
    msg: 'Become a successful Pokémon battler against trainers and in raids.'
  }, {
    completed: (r) => r.voyagesCompleted >= 15,
    msg: 'As you travel on voyages, you may wish to collect more camping gear.'
  }, {
    completed: simpleRequirePotwArr([P.Rillaboom, P.Cinderace, P.Inteleon]),
    msg: 'Are you familiar with the starter Pokémon of the Galar region?'
  }]
}
/**
 * SwSh Catching Charm
Antique Polteageist
Phony Polteageist
Toxtricity Amped/Low-Key
Galarian Weezing
Craft a “curry”
Go on a voyage to “Galar”
X battle victories
 */
export const RotomBike: LegendaryQuest = {
  hints: [{
    completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_SWSH),
    msg: 'When you earn the trust of Professor Magnolia, she may chat with you about the Wild Area.'
  }, {
    completed: simpleRequirePotw(P.Polteageist),
    msg: 'Have you caught the Ghost-type Pokémon which lives in a teapot?'
  }, {
    completed: complexRequirePotw(P.Polteageist, {form: 'antique'}),
    msg: 'Some Polteageist have refined taste and only prefer specific teapots.'
  }, {
    completed: complexRequirePotw(P.Toxtricity, {form: 'amped'}),
    msg: 'Have you caught a Toxtricity? They can be really amped up.'
  }, {
    completed: complexRequirePotw(P.Toxtricity, {form: 'low_key'}),
    msg: 'Have you caught a Toxtricity? They can be really chill.'
  }, {
    completed: complexRequirePotw(P.Weezing, {form: 'galarian'}),
    msg: 'Have you caught a Weezing? Some like to clean smoggy air.'
  }, {
    completed: (r) => r.itemsCrafted > 60,
    msg: 'Have you tried crafting different forms of curry? They may attract rare Pokémon.'
  }, {
    completed: (r) => r.voyagesCompleted >= 60,
    msg: 'Have you taken a voyage across Galar?'
  }, {
    completed: (r) => r.battleStadiumRecord[1] >= 200,
    msg: 'There are many strong Pokémon in the Wild Area. Are you prepared to win in battles?'
  }]
}
export const TeraOrb: LegendaryQuest = {
  hints: [{
    completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_SWSH),
    msg: 'After exploring Galar, you may grow restless and ready for something new.'
  }, {
    completed: simpleRequirePotw(P.Urshifu),
    msg: 'Have you caught the mysterious Pokémon from the Isle of Armor?'
  }, {
    completed: simpleRequirePotw(P.Calyrex),
    msg: 'Have you caught the mysterious Pokémon from the Crown Tundra?'
  }, {
    completed: simpleRequirePotw(P.Annihilape),
    msg: 'Have you caught the new Rage Monkey Pokémon?'
  }, {
    completed: simpleRequirePotw(P.Farigiraf),
    msg: 'Have you caught the new Long Neck Pokémon?'
  }, {
    completed: simpleRequirePotw(P.Annihilape),
    msg: 'Have you caught the new Land Snake Pokémon?'
  }, {
    completed: simpleRequirePotw(P.Annihilape),
    msg: 'Have you caught the new Big Blade Pokémon?'
  }, {
    completed: (r) => r.voyagesCompleted >= 100,
    msg: 'Have you taken many voyages across the world?'
  }, {
    completed: (r) => r.battleStadiumRecord[1] >= 300,
    msg: 'You must gain expertise in battles before you can try terastallization.'
  }]
}
export const Mewtwo: LegendaryQuest = {
  hints: [{
    completed: (r) => r.userJoinedDate <= oneWeekAgo,
    msg: ONE_WEEK_ERR
  }, {
    completed: simpleRequirePotw(P.Onix),
    msg: 'Have you battled the Gym Leader Brock? He has a powerful Onix.',
    spoiler: 'Catch an Onix',
  }, {
    completed: simpleRequirePotw(P.Starmie),
    msg: 'Have you battled the Gym Leader Misty? She has a strong Starmie.',
    spoiler: 'Catch a Starmie',
  }, {
    completed: simpleRequirePotw(P.Raichu),
    msg: 'Have you battled the Gym Leader Lt. Surge? He has a capable Raichu.',
    spoiler: 'Catch a Raichu',
  }, {
    completed: simpleRequirePotw(P.Vileplume),
    msg: 'Have you battled the Gym Leader Erika? She has an intimidating Vileplume.',
    spoiler: 'Catch a Vileplume'
  }]
}
export const Mew: LegendaryQuest = {
  hints: [{
    completed: (r) => r.userJoinedDate <= oneWeekAgo,
    msg: 'You see a truck on a platform.'
  }, {
    completed: simpleRequirePotw(P.Machamp),
    msg: 'There is a truck. It is too heavy to move. If only you had a strong ' +
      'Pokémon that could use its many strong arms...'
  }, {
    completed: (r) => r.hiddenItemsFound.includes(MEWTWO) &&
      r.hiddenItemsFound.includes(BEAD_MAIL) &&
      r.hiddenItemsFound.includes(DREAM_MAIL) &&
      r.hiddenItemsFound.includes(FAB_MAIL),
    msg: 'The truck was pushed forward. There is nothing under the truck.'
  }]
}
export const captureGyarados: LegendaryQuest = {
  hints: [{
    completed: countFor(b => b.personality.shiny),
    msg: 'Have you seen a Pokémon with unusual colors?',
    spoiler: 'Catch a shiny Pokemon'
  }, {
    completed: simpleRequirePotw(P.Pidgeotto),
    msg: `Falkner of Violet City has an impressive Pidgeotto.`,
    spoiler: 'Catch a Pidgeotto'
  }, {
    completed: simpleRequirePotw(P.Scyther),
    msg: `Bugsy of Azalea Town has a formidable Scyther.`,
    spoiler: 'Catch a Scyther',
  }, {
    completed: simpleRequirePotw(P.Miltank),
    msg: `Whitney of Goldenrod City has a scary Miltank.`,
    spoiler: 'Catch a Miltank'
  }, {
    completed: simpleRequirePotw(P.Gengar),
    msg: `Morty of Ecruteak City has a spooky Gengar.`,
    spoiler: 'Catch a Gengar',
  }, {
    completed: simpleRequirePotw(P.Poliwrath),
    msg: `Chuck of Cianwood City has a strong Poliwrath.`,
    spoiler: 'Catch a Poliwrath',
  }, {
    completed: simpleRequirePotw(P.Steelix),
    msg: `Jasmine of Olivine City has a polished Steelix.`,
    spoiler: 'Catch a Steelix',
  }, {
    completed: simpleRequirePotw(P.Piloswine),
    msg: `Pryce of Mahogany Town has a cold-hearted Piloswine.`,
    spoiler: 'Catch a Piloswine',
  }, {
    completed: simpleRequirePotw(P.Kingdra),
    msg: `Clair of Blackthorn City has an intimidating Kingdra.`,
    spoiler: 'Catch a Kingdra',
  }]
}
const captureLugiaHoOh = (which: 'Lugia' | 'HoOh'): LegendaryQuest => {
  const baseMap = {
    Lugia: 'You pick up the wing. It has a metallic look.',
    HoOh: 'You pick up the feather. It has a magnificient glow.'
  }
  const msgMap = {
    Lugia: 'You can sense it came from something ' +
      `mysterious, although it doesn't seem to think you're very strong.`,
    HoOh: 'You know it was dropped by a ' +
      'strong Pokémon. However, it seems to be ignoring you.'
  }
  const humilityMap = {
    Lugia: 'You feel a powerful being hovering above you. It seems intrigued by you, but sees you as ' +
      'overconfident.',
    HoOh: 'You notice a large presence flying in front of you. It looks with some interest, but ' +
      'does not know whether you are humble.'
  }
  // Check battle stadium record, with two tiers depending on which you get first
  // Tier 1 - 6 wins
  // Tier 2 - 18 wins
  const playerRecord = (r: Requirements) => {
    return ((which === 'Lugia' && r.hiddenItemsFound.includes(HO_OH)) ||
      (which === 'HoOh' && r.hiddenItemsFound.includes(LUGIA))) ? 18 : 6
  }
  return {
    hints: [{
      completed: (r) => r.userJoinedDate <= oneWeekAgo,
      msg: baseMap[which]
    }, {
      completed: (r) => r.battleStadiumRecord && r.battleStadiumRecord[1] >= playerRecord(r),
      msg: msgMap[which]
    }, {
      completed: (r) => r.battleStadiumRecord && r.battleStadiumRecord[2] > 0,
      // Be humble. Lose once.
      msg: humilityMap[which]
    }]
  }
}
export const captureLugia = captureLugiaHoOh('Lugia')
export const captureHoOh = captureLugiaHoOh('HoOh')
export const captureCelebi: LegendaryQuest = {
  hints: [{
    completed: (r) => r.userJoinedDate <= oneWeekAgo,
    msg: 'You want to craft something, but you do not know how. ' +
    'You may need to visit a library and read for a while.'
  }, {
    completed: simpleRequirePotw(P.Farfetchd),
    msg: 'You want to build something out of wood, but you will need some help cutting down trees.'
  }, {
    // Check that we have a Heracross, proxy for headbutting
    completed: simpleRequirePotw(P.Heracross),
    msg: 'As you approach the trees, you hear something buzzing inside. You should probably find ' +
    'out what is hiding in the trees.'
  }, {
    // Check that we have caught Apricorn-exclusive Pokémon
    completed: simpleRequirePotwArr([
      P.Jumpluff, P.Togetic, P.Pupitar, P.Flaaffy, P.Miltank,
      P.Chinchou, P.Qwilfish, P.Murkrow,
    ]),
    msg: 'The tree dropped several Apricorns. These may be good to turn into Poké Balls.'
  }, {
    // Check that we have Yanma, proxy for bug catching
    completed: simpleRequirePotw(P.Yanma),
    msg: 'You take a step back. You have finished the woodwork on your shrine. It is a good ' +
      'time to take a break. The park is close.'
  }, {
    // Check that we have a bigmushroom
    completed: requireItem('bigmushroom'),
    msg: 'Your shrine looks good, but a bit sparse. It may be good to add a decoration to ' +
    'give it more of a forest-y aesthetic.'
  }, {
    // Check that we have charcoal
    completed: requireItem('charcoal'),
    msg: 'You are happy with how the shrine looks. You shiver. It is getting pretty cold. You ' +
    'should find some way to keep warm.'
  }]
}
const commonRegi: Task[] = [{
  completed: (r) => r.userJoinedDate <= oneWeekAgo,
  msg: ONE_WEEK_ERR
}, {
  completed: simpleRequirePotw(P.Relicanth),
  msg: 'There are rumors of an ancient fish that has not actually gone extinct.'
}, {
  completed: simpleRequirePotw(P.Wailord),
  msg: 'There seems to be something hidden under the water that only the largest Pokémon can reach.'
}, {
  completed: requireItem('tm-Dive'),
  msg: 'You can tell there is an ancient temple at the bottom of the sea. Your Pokémon will need to learn a way to reach it.'
}, {
  completed: requireItem('tm-Dig'),
  msg: 'You have reached the top of the temple, but you will need a way to burrow into it.'
}]
export const captureRegice: LegendaryQuest = {
  hints: [
    ...commonRegi,
    {
      completed: (r) => r.location.forecast === 'Snow' && r.location.regice === true,
      msg: 'You must find the hidden temple in a location where the snow quietly falls.'
    }, {
      completed: async () => new Promise((res) => {
        setTimeout(() => {
          // Wait a long time
          res(true)
        }, 45 * 1000)
      }),
      msg: 'It is good to have patience.'
    }
  ]
}
export const captureRegirock: LegendaryQuest = {
  hints: [
    ...commonRegi,
    {
      completed: simpleRequirePotw(P.Machamp),
      msg: 'Artifacts from the ancient wall hold an inscription: Be sure to use your strength.'
    },
    {
      completed: (r) => r.location.forecast === 'Sandstorm' && r.location.regirock === true,
      msg: 'You must find the hidden temple in a location where the sand blows past.'
    }
  ]
}
export const captureRegisteel: LegendaryQuest = {
  hints: [
    ...commonRegi,
    {
      completed: requireItem('tm-Fly'),
      msg: 'An inscription is on the wall: The sky will one day clear, then you can aim to the sky.'
    },
    {
      completed: (r) => r.location.forecast === 'Thunderstorm' && r.location.registeel === true,
      msg: 'You must find the hidden temple in a location where the sky cracks and flashes.'
    }
  ]
}
export const captureGroudon: LegendaryQuest = {
  hints: [{
    completed: (r) => r.userJoinedDate <= oneWeekAgo,
    msg: ONE_WEEK_ERR
  }, {
    completed: requireItem('redorb'),
    msg: 'You have found a large volcanic cavern. The entrance seems to be sealed.'
  }, {
    completed: simpleRequirePotw(P.Camerupt),
    msg: 'The environment is dry and warm. Quadruped Pokémon are grazing nearby.'
  }, {
    completed: simpleRequirePotw(P.Wynaut),
    msg: 'The environment is dry and warm. You feel relaxed. It would be a good place to hatch an egg.'
  }, {
    completed: simpleRequirePotw(P.Castform_Sunny),
    msg: 'The environment is dry and warm. It may cause a Pokémon to change its form.'
  }, {
    completed: simpleRequirePotw(P.Shiftry),
    msg: 'The environment is dry and warm. It may help a forest guardian grow.'
  }, {
    completed: simpleRequirePotw(P.Mawile),
    msg: 'The environment is dry and warm. There seems to be a scary Pokémon near the entrance of the cave. It has two heads?!'
  }, {
    completed: simpleRequirePotw(P.Solrock),
    msg: 'The environment is very sunny. It reminds you of a certain Pokémon.'
  }, {
    completed: (r) => r.location.forecast === 'Sandstorm' || r.location.forecast === 'Heat Wave',
    msg: 'The weather is fairly mild. There is nothing to report.'
  }]
}
export const captureKyogre: LegendaryQuest = {
  hints: [{
    completed: (r) => r.userJoinedDate <= oneWeekAgo,
    msg: ONE_WEEK_ERR
  }, {
    completed: requireItem('blueorb'),
    msg: 'You have found a large underwater cavern. The entrance seems to be blocked.'
  }, {
    completed: simpleRequirePotw(P.Sharpedo),
    msg: 'The environment is wet and cool. Razor-toothed Pokémon are lurking nearby.'
  }, {
    completed: simpleRequirePotw(P.Azurill),
    msg: 'The environment is wet and cool. You feel one with the sea. It would be a nice spot to hatch an egg.'
  }, {
    completed: simpleRequirePotw(P.Castform_Rainy),
    msg: 'The environment is wet and cool. It may cause a Pokémon to change its form.'
  }, {
    completed: simpleRequirePotw(P.Ludicolo),
    msg: 'The environment is wet and cool. It may help certain water plants to grow.'
  }, {
    completed: simpleRequirePotw(P.Sableye),
    msg: 'The environment is wet and cool. There seems to be an unusual Pokémon near the entrance of the cave. It is guarding the treasure on its body.'
  }, {
    completed: simpleRequirePotw(P.Lunatone),
    msg: 'The light of the moon reflects on the water. It reminds you of a certain Pokémon.'
  }, {
    completed: (r) => r.location.forecast === 'Rain' || r.location.forecast === 'Thunderstorm',
    msg: 'The weather is fairly dry. There is nothing of note.'
  }]
}
export const captureRayquaza: LegendaryQuest = {
  hints: [{
    completed: (r) => r.userJoinedDate <= oneWeekAgo,
    msg: ONE_WEEK_ERR
  }, {
    completed: simpleRequirePotw(P.Ludicolo),
    msg: 'Professor Birch has said Pokémon can be found in many weather conditions, even in the rain!'
  }, {
    completed: simpleRequirePotw(P.Manectric),
    msg: 'Professor Birch has said Pokémon can be found in many weather conditions, even in a thunderstorm!'
  }, {
    completed: simpleRequirePotw(P.Torkoal),
    msg: 'Professor Birch has said Pokémon can be found in many weather conditions, even in the bright sun!'
  }, {
    completed: simpleRequirePotw(P.Glalie),
    msg: 'Professor Birch has said Pokémon can be found in many weather conditions, even in the snow!'
  }, {
    completed: simpleRequirePotw(P.Flygon),
    msg: 'Professor Birch has said Pokémon can be found in many weather conditions, even in a sandstorm!'
  }, {
    completed: simpleRequirePotw(P.Altaria),
    msg: 'Professor Birch has said Pokémon can be found in many weather conditions, even in the fog!'
  }, {
    completed: requireItem('redorb'),
    msg: 'In the distance you see a large volcanic cave.'
  }, {
    completed: requireItem('blueorb'),
    msg: 'In the distance you see a cavern underwater.'
  }, {
    completed: simpleRequirePotw(P.Sceptile),
    msg: 'You see old logs blocking the entrance to a large pillar in the sky. It seems like they could be cut by a blade made of leaves.'
  }, {
    completed: simpleRequirePotw(P.Blaziken),
    msg: 'You see old logs blocking the entrance to a large pillar in the sky. It seems like they could be crushed by a blazing kick.'
  }, {
    completed: simpleRequirePotw(P.Swampert),
    msg: 'You see old logs blocking the entrance to a large pillar in the sky. It seems like they could be washed out to sea with some muddy water.'
  }, {
    completed: (r) => r.location.forecast === 'Fog' || r.location.forecast === 'Cloudy',
    msg: 'The weather is clear, without a cloud in the sky. It is a quiet day.'
  }]
}
export const captureJirachi: LegendaryQuest = {
  hints: [{
    completed: (r) => r.userJoinedDate <= oneWeekAgo,
    msg: ONE_WEEK_ERR
  }, {
    completed: (r) => r.researchCompleted > 4,
    msg: 'Professor Birch has a secret task, but wants to get to know you better first.'
  }, {
    completed: simpleRequirePotw(P.Milotic),
    msg:  'Professor Birch has spoken at length about the most beautiful Pokémon in the world.'
  }, {
    completed: simpleRequirePotw(P.Gorebyss),
    msg: 'Professor Birch has said a scale at the bottom of the sea may make a certain Pokémon evolve!'
  }, {
    completed: simpleRequirePotw(P.Pelipper),
    msg: 'People all over the world like to make wishes, even at the beach!'
  }, {
    completed: simpleRequirePotw(P.Aggron),
    msg: 'People all over the world like to make wishes, even in the mountains!'
  }, {
    completed: simpleRequirePotw(P.Tropius),
    msg: 'People all over the world like to make wishes, even in tropical climates!'
  }, {
    completed: simpleRequirePotw(P.Mightyena),
    msg: 'People all over the world like to make wishes, even in rural areas!'
  }, {
    completed: simpleRequirePotw(P.Cacturne),
    msg: 'People all over the world like to make wishes, even in the desert!'
  }, {
    completed: simpleRequirePotw(P.Roselia),
    msg: 'People all over the world like to make wishes, even in grassy lands!'
  }, {
    completed: simpleRequirePotw(P.Breloom),
    msg: 'People all over the world like to make wishes, even in the forest!'
  }, {
    completed: simpleRequirePotw(P.Swalot),
    msg: 'People all over the world like to make wishes, even in cities!'
  }, {
    completed: simpleRequirePotw(P.Slaking),
    msg: 'People all over the world like to make wishes, even in the rainforest!'
  }, {
    completed: simpleRequirePotw(P.Wailord),
    msg: 'People all over the world like to make wishes, even alongside the ocean!'
  }, {
    completed: simpleRequirePotw(P.Rayquaza),
    msg: 'Professor Birch has said spoken about a Pokémon at the top of a large pillar in the sky!'
  }]
}
export const captureDeoxys: LegendaryQuest = {
  hints: [{
    completed: (r) => r.userJoinedDate <= oneWeekAgo,
    msg: ONE_WEEK_ERR
  }, {
    completed: (r) => r.raidRecord && r.raidRecord[1] > 4,
    msg: 'Professor Birch has a secret task, but wants to ensure you can handle the challenge.'
  }, {
    completed: simpleRequirePotw(P.Lunatone),
    msg: 'Astronomers have looked up at the moon in wonder for centuries.'
  }, {
    completed: simpleRequirePotw(P.Solrock),
    msg: 'Astronomers have long looked at the many stars in the sky in wonder. They are billions of suns.'
  }, {
    completed: simpleRequirePotw(P.Huntail),
    msg: 'Professor Birch has said a tooth at the bottom of the sea may make a certain Pokémon evolve!'
  }, {
    completed: simpleRequirePotw(P.Ninjask),
    msg: 'Sightings of meteorites have been reported all over the world, even in North America!'
  }, {
    completed: simpleRequirePotw(P.Plusle),
    msg: 'Sightings of meteorites have been reported all over the world, even in South America!'
  }, {
    completed: simpleRequirePotw(P.Volbeat),
    msg: 'Sightings of meteorites have been reported all over the world, even in Northern Europe!'
  }, {
    completed: simpleRequirePotw(P.Crawdaunt),
    msg: 'Sightings of meteorites have been reported all over the world, even in the Mediterranean!'
  }, {
    completed: simpleRequirePotw(P.Camerupt),
    msg: 'Sightings of meteorites have been reported all over the world, even in Africa and the Middle East!'
  }, {
    completed: simpleRequirePotw(P.Medicham),
    msg: 'Sightings of meteorites have been reported all over the world, even in Asia!'
  }, {
    completed: simpleRequirePotw(P.Nosepass),
    msg: 'Sightings of meteorites have been reported all over the world, even in the Pacific Islands!'
  }, {
    completed: simpleRequirePotw(P.Kangaskhan),
    msg: 'Sightings of meteorites have been reported all over the world, even in Australia and New Zealand!'
  }, {
    completed: simpleRequirePotw(P.Rayquaza),
    msg: 'Professor Birch has said spoken about a Pokémon at the top of a large pillar in the sky!'
  }]
}
export const captureDeoxysAtk: LegendaryQuest = {
  hints: [...captureDeoxys.hints, {
    completed: requireItem('tm-Superpower'),
    msg: 'You are looking for a Superpowerful Pokémon.'
  }]
}
export const captureDeoxysDef: LegendaryQuest = {
  hints: [...captureDeoxys.hints, {
    completed: requireItem('tr-Iron Defense'),
    msg: 'You are looking for a Pokémon as defensive as Iron.'
  }]
}
export const captureDeoxysSpe: LegendaryQuest = {
  hints: [...captureDeoxys.hints, {
    completed: requireItem('tm-Volt Tackle'),
    msg: 'The breeder Hayley knows of Pikachus with a special move. She may be able to help.'
  }, {
    completed: requireItem('tr-Agility'),
    msg: 'You are looking for a Pokémon that is very Agile.'
  }]
}
export const captureSpiritomb: LegendaryQuest = {
  hints: [{
    completed: haveCaught(108),
    msg: 'An eerie voice seeks 108 souls.'
  }, {
    completed: (r) => Object.values(r.items).reduce((prev, curr) => prev! + (curr || 0))! >= 108,
    msg: 'An eerie voice seeks 108 things.'
  }, {
    completed: (r) => r.battleStadiumRecord[1] >= 108,
    msg: 'An eerie voice seeks 108 victories.'
  }, {
    completed: (r) => r.raidRecord[1] >= 108,
    msg: 'An eerie voice seeks 108 significant victories.'
  }, {
    completed: (r) => r.berryGrown >= 108,
    msg: 'An eerie voice seeks the growth of 108.'
  }, {
    completed: (r) => r.location.terrain === 'Rural' && r.location.region === 'Asia',
    msg: 'An eerie voice comes from an old shrine in a small village.'
  }]
}
export const captureAzelf: LegendaryQuest = {
  hints: [{
    completed: (r) => r.location.terrain === 'Bay',
    msg: 'Odd sightings are coming from a nearby lake.'
  }, {
    completed: (r) => r.berryGrown >= 10,
    msg: 'The strange sighting may enjoy berries.'
  }, {
    completed: (r) => r.raidRecord[1] >= 10,
    msg: 'The strange sighting may be looking for strong trainers.'
  }, {
    completed: simpleRequirePotwArr([P.Pachirisu, P.Chatot, P.Lumineon, P.Bronzor]),
    msg: 'There are many Pokémon that are only sighted in certain locations.'
  }, {
    completed: simpleRequirePotwArr([P.Combee, P.Vespiquen]),
    msg: 'Wherever this strange sighting goes, there are Pokémon attracted by sweet honey.'
  }, {
    completed: requireItem(['waveincense', 'fullincense', 'roseincense', 'rockincense', 'oddincense', 'pureincense', 'seaincense']),
    msg: 'The strange sighting may be looking for a strong smoke scent.'
  }, {
    completed: complexRequirePotw(P.Gastrodon, {form: 'west_sea'}),
    msg: 'Have you heard of a Pokémon that only appears in the west?'
  }]
}
export const captureUxie: LegendaryQuest = {
  hints: [{
    completed: (r) => r.location.terrain === 'Bay',
    msg: 'Odd sightings are coming from a nearby lake.'
  }, {
    completed: (r) => r.berryGrown >= 10,
    msg: 'The strange sighting may enjoy berries.'
  }, {
    completed: (r) => r.raidRecord[1] >= 10,
    msg: 'The strange sighting may be looking for strong trainers.'
  }, {
    completed: simpleRequirePotwArr([P.Buizel, P.Riolu, P.Buneary, P.Hippopotas, P.Kricketot, P.Budew, P.Bidoof, P.Glameow]),
    msg: 'Lakes can appear in all kinds of terrains.'
  }, {
    completed: simpleRequirePotwArr([P.Combee, P.Vespiquen]),
    msg: 'Wherever this strange sighting goes, there are Pokémon attracted by sweet honey.'
  }, {
    completed: requireItem(['tm-Rollout', 'tm-Ancient Power', 'tm-Double Hit', 'tr-Mimic']),
    msg: 'There are some moves that can cause a Pokémon to evolve.'
  }, {
    completed: complexRequirePotw(P.Gastrodon, {form: 'east_sea'}),
    msg: 'Have you heard of a Pokémon that only appears in the east?'
  }]
}
export const captureDialga: LegendaryQuest = {
  hints: [{
    completed: requireItem('adamantorb'),
    msg: 'Find something made of diamond.'
  }, {
    completed: simpleRequirePotwArr([P.Azelf, P.Uxie, P.Mesprit]),
    msg: 'Have you ever looked at the lakes?'
  }, {
    completed: simpleRequirePotw(P.Dewgong),
    msg: 'There are seal-like Pokémon reportedly found near lakes.'
  }, {
    completed: simpleRequirePotw(P.Scizor),
    msg: 'There are reportedly beatle-like Pokémon with sharp metallic claws.'
  }, {
    completed: simpleRequirePotw(P.Honchkrow),
    msg: 'There are reportedly large crow-like Pokémon flying towards the mountains.'
  }, {
    completed: simpleRequirePotw(P.Rampardos),
    msg: 'In another time, Pokémon with large skulls roamed the land.'
  }, {
    completed: simpleRequirePotw(P.Skuntank),
    msg: 'There is a foul odor being emitted by Pokémon near the mountains.'
  }, {
    completed: complexRequirePotw(P.Unown, {form: '!'}),
    msg: 'A certain legend is seen in carvings of the mountain cliffside!'
  }, {
    completed: (r) => r.berryGrown >= 64,
    msg: 'The journey through the mountains looks tough. You may need to prepare some food first.'
  }, {
    completed: requireItem('choiceband'),
    msg: 'You will need to choose lot of strength.'
  }, {
    completed: simpleRequirePotw(P.Gallade),
    msg: 'A Psychic-type Pokémon with sharp blades may help you finish the journey.'
  }]
}
export const capturePalkia: LegendaryQuest = {
  hints: [{
    completed: requireItem('lustrousorb'),
    msg: 'Find something made from pearl.'
  }, {
    completed: simpleRequirePotwArr([P.Azelf, P.Uxie, P.Mesprit]),
    msg: 'Have you ever looked at the lakes?'
  }, {
    completed: simpleRequirePotw(P.Slowbro),
    msg: 'There are slow-moving Pokémon reportedly found near lakes.'
  }, {
    completed: simpleRequirePotw(P.Pinsir),
    msg: 'There are reportedly beatle-like Pokémon with sharp jaws.'
  }, {
    completed: simpleRequirePotw(P.Mismagius),
    msg: 'There are reportedly large witch-like Pokémon flying towards the mountains.'
  }, {
    completed: simpleRequirePotw(P.Bastiodon),
    msg: 'When the place was different, Pokémon with thick skulls roamed the land.'
  }, {
    completed: simpleRequirePotw(P.Purugly),
    msg: 'An unattractive-looking Pokémon is headed towards the mountains.'
  }, {
    completed: complexRequirePotw(P.Unown, {form: '?'}),
    msg: 'A certain legend is seen in carvings. What do they mean?'
  }, {
    completed: (r) => r.berryGrown >= 64,
    msg: 'The journey through the mountains looks tough. You may need to prepare some food first.'
  }, {
    completed: requireItem('choicespecs'),
    msg: 'You will need to choose to see new things.'
  }, {
    completed: simpleRequirePotw(P.Froslass),
    msg: 'A Ghost-type Pokémon familiar with the icy peaks may help you complete your journey.'
  }]
}
export const captureGirantina: LegendaryQuest = {
  hints: [{
    completed: simpleRequirePotwArr([P.Dialga, P.Palkia]),
    msg: 'Before you can leave reality, you must have a grasp over time and space.'
  }, {
    completed: requireItem('choicescarf'),
    msg: 'It may be cold on the other side, so you should choose something warm.'
  }, {
    completed: requirePotw([
      [P.Rotom, {form: 'fan'}], [P.Rotom, {form: 'frost'}], [P.Rotom, {form: 'heat'}],
      [P.Rotom, {form: 'mow'}], [P.Rotom, {form: 'wash'}]]),
    msg: 'Make sure you pack your appliances before leaving.'
  }, {
    completed: simpleRequirePotw(P.Cranidos),
    msg: 'Gym Leader Roark has a hardy Cranidos.'
  }, {
    completed: simpleRequirePotw(P.Roserade),
    msg: 'Gym Leader Gardenia has a modest Roserade.'
  }, {
    completed: simpleRequirePotw(P.Mismagius),
    msg: 'Gym Leader Fantina has a spooky Mismagius.'
  }, {
    completed: simpleRequirePotw(P.Lucario),
    msg: 'Gym Leader Maylene has an adamant Lucario.'
  }, {
    completed: simpleRequirePotw(P.Floatzel),
    msg: 'Gym Leader Crasher Wake has a swift Floatzel.'
  }, {
    completed: simpleRequirePotw(P.Bastiodon),
    msg: 'Gym Leader Byron has a sturdy Bastiodon.'
  }, {
    completed: simpleRequirePotw(P.Froslass),
    msg: 'Gym Leader Candice has a haunted Froslass.'
  }, {
    completed: simpleRequirePotw(P.Electivire),
    msg: 'Gym Leader Volkner has a relaxed Electivire.'
  }]
}
export const captureRegigias: LegendaryQuest = {
  hints: [{
    completed: (r) => r.location.terrain === 'Mountain' && r.location.forecast === 'Snow',
    msg: 'There is a temple up in the snowy mountains.'
  }, {
    completed: simpleRequirePotwArr([P.Regice, P.Regirock, P.Registeel]),
    msg: 'The temple seems to have carvings that resemble historical golems.'
  }, {
    completed: requireItem('tr-Acupressure'),
    msg: 'It may require some pointed pressure to get into the temple.'
  }, {
    completed: requireItem('lifeorb'),
    msg: 'You may need a leeching sphere to enter.'
  }, {
    completed: simpleRequirePotwArr([P.Happiny, P.Bonsly, P.Mime_Jr, P.Mantyke]),
    msg: 'The entrance is too small. Maybe small or young Pokémon can slip inside.'
  }, {
    completed: requirePotw([
      [P.Wormadam, {form: 'plant'}], [P.Wormadam, {form: 'sandy'}], [P.Wormadam, {form: 'trash'}]]),
    msg: 'There are three possible paths, made of different materials, but all of them seem to have been left behind by a bug.'
  }]
}
export const captureHeatran: LegendaryQuest = {
  hints: [{
    completed: (r) => r.location.forecast === 'Heat Wave',
    msg: 'There is a volcano that seems to grow more active in the heat.'
  }, {
    completed: requireItem('tr-Rock Polish'),
    msg: 'Rocks are falling quickly down the mountain. As they roll, they become smoother.'
  }, {
    completed: simpleRequirePotw(P.Vespiquen),
    msg: 'Elite Four member Aaron has an intimidating Vespiquen.'
  }, {
    completed: requirePotw([
      [P.Hippowdon, {gender: 'female'}],
      [P.Hippowdon, {gender: 'male'}],
    ]),
    msg: 'Elite Four member Bertha has a pair of relaxed Hippowdon.'
  }, {
    completed: simpleRequirePotw(P.Magmortar),
    msg: 'Elite Four member Flint has a rash Magmortar.'
  }, {
    completed: simpleRequirePotw(P.Gallade),
    msg: 'Elite Four member Lucian has a focused Gallade.'
  }, {
    completed: simpleRequirePotw(P.Garchomp),
    msg: 'Champion Cynthia has an incredible Garchomp.'
  }, {
    completed: (r) => r.hiddenItemsFound.includes('drIVxbAeXnuVuWCYWTf5'),
    msg: 'Professor Rowan is at the base of the volcano, not sure if you will be able to successfully confront what is ahead.'
  }]
}
export const captureCresselia: LegendaryQuest = {
  hints: [{
    completed: simpleRequirePotw(P.Blissey),
    msg: 'Cheryl is awakened by her Blissey under the stars.'
  }, {
    completed: simpleRequirePotw(P.Claydol),
    msg: 'Buck is alerted by a silhouette passing across the full moon.'
  }, {
    completed: simpleRequirePotw(P.Arcanine),
    msg: 'Marley climbs on her Arcanine and chases after the silhouette.'
  }, {
    completed: simpleRequirePotw(P.Lucario),
    msg: 'Riley sends his Lucario to cut off the silhouette\'s path.'
  }, {
    completed: simpleRequirePotw(P.Alakazam),
    msg: 'Mira asks her Alakazam to trap the silhouette from retreating.'
  }, {
    completed: (r) => r.researchCompleted >= 14,
    msg: 'Professor Rowan asks you to investigate, but wants to know if you can help with research.'
  }, {
    completed: (r) => r.hiddenItemsFound.includes('drIVxbAeXnuVuWCYWTf5'),
    msg: 'Professor Rowan is not sure if you will be able to catch the silhouette.'
  }]
}
export const captureManaphy: LegendaryQuest = {
  hints: [{
    completed: (r) => r.berryGrown >= 64,
    msg: 'You find a mysterious egg at the beach. You are asked to meet a Pokémon Ranger in Ring Town. You see farmland in the distance as you wait.'
  }, {
    completed: simpleRequirePotw(P.Leafeon),
    msg: 'The Pokémon Ranger takes you to the Raira Forest, where there is a lot of moss.'
  }, {
    completed: simpleRequirePotw(P.Glaceon),
    msg: 'The Pokémon Ranger takes you to Panulla Cave, where there is a lot of ice.'
  }, {
    completed: simpleRequirePotwArr([P.Probopass, P.Magnezone]),
    msg: 'The Pokémon Ranger takes you to Shikura Mountains. Its strong magnetic field disrupts your compass.'
  }, {
    completed: requireItem('tr-Aqua Ring'),
    msg: 'The mysterious egg seems to have something to do with the ocean. Can the ocean water restore its health?'
  }, {
    completed: (r) => r.hiddenItemsFound.includes('drIVxbAeXnuVuWCYWTf5'),
    msg: 'The Pokémon Ranger wonders if you should hatch the egg, not sure if you have experience catching Pokemon.'
  }, {
    completed: (r) => r.location.terrain === 'Oceanic',
    msg: 'The egg may hatch if it can return to where it was laid.'
  }]
}
export const captureDarkrai: LegendaryQuest = {
  hints: [{
    completed: requireItem('chesto'),
    msg: 'You are supposed to meet Looker in Jubilife City. He is asleep with no indication of waking soon.'
  }, {
    completed: (r) => r.hiddenItemsFound.includes('drIVxbAeXnuVuWCYWTf5'),
    msg: 'Looker suggests a Pokémon did this to him. He wants to know whether you will be able to catch it.'
  }, {
    completed: simpleRequirePotw(P.Cresselia),
    msg: 'Looker says this Pokémon has a rival, a bright light at night.'
  }, {
    completed: simpleRequirePotwArr([P.Gliscor, P.Weavile, P.Lickilicky, P.Tangrowth]),
    msg: 'Looker suggests you should add several Pokémon to your team: those experienced at night that can rollout with a history of power.'
  }, {
    completed: requireItem('tm-Dream Eater'),
    msg: 'Looker says he had nightmares and does not want someone to consume his sleep.'
  }, {
    completed: (r) => r.raidRecord[1] >= 64,
    msg: 'Looker does not want you to go ahead until you have faced strong opponents.'
  }]
}
export const captureShaymin: LegendaryQuest = {
  hints: [{
    completed: simpleRequirePotw(P.Porygon_Z),
    msg: 'Professor Oak wants to send you a phone call, but your phone seems to have a virus.'
  }, {
    completed: simpleRequirePotw(P.Electivire),
    msg: 'The phone got a software update, but now needs its battery to be recharged.'
  }, {
    completed: simpleRequirePotw(P.Magmortar),
    msg: 'Professor Oak is looking for a Pokémon that lives in volcanic craters.'
  }, {
    completed: simpleRequirePotw(P.Rhyperior),
    msg: 'Professor Oak is protecting a Pokémon so it can surf without taking damage.'
  }, {
    completed: requireItem('tm-Leaf Storm'),
    msg: 'In the distance you can see a garden, but gusts of wind are blowing leaves around.'
  }, {
    completed: (r) => r.berryGrown >= 100,
    msg: 'A garden is full of rich berries and flowers.'
  }, {
    completed: (r) => r.hiddenItemsFound.includes('drIVxbAeXnuVuWCYWTf5'),
    msg: 'Professor Oak sees something in the garden. He wants to know whether you will be able to catch it.'
  }]
}
export const captureArceus: LegendaryQuest = {
  hints: [{
    completed: simpleRequirePotwArr([P.Dialga, P.Palkia, P.Giratina]),
    msg: 'You must first obtain a mastery of space and time.'
  }, {
    completed: requireItem([
      'tm-Stone Edge', 'tm-Leaf Storm', 'tm-Close Combat', 'tm-Brine',
      'tm-Shadow Claw', 'tm-Flash Cannon', 'tm-Ice Shard', 'tm-Charge Beam',
    ]),
    msg: 'To further research the bright light, the gym leaders may know more.'
  }, {
    completed: (r) => r.raidRecord[1] >= 128,
    msg: 'You will need a lot of experience before confronting such a powerful figure.'
  }, {
    completed: (r) => r.battleStadiumRecord[1] >= 128,
    msg: 'You will need more battle experience before confronting such a powerful figure.'
  }, {
    completed: (r) => r.hiddenItemsFound.includes('drIVxbAeXnuVuWCYWTf5'),
    msg: 'You will need to ensure you are ready to capture it.'
  }]
}
export const captureCobalion: LegendaryQuest = {
  hints: [{
    completed: requireType('Fighting', 100),
    msg: 'Do you have enough experience with capturing Fighting-type Pokémon?'
  }, {
    completed: requireType('Steel', 100),
    msg: 'You must in particular be familiar with the silent strength of Steel-type Pokémon.'
  }, {
    completed: (r) => r.raidRecord[1] >= 100,
    msg: 'You must first win against powerful adversaries.'
  }, {
    completed: simpleRequirePotw(P.Emboar),
    msg: 'Facing this adversary will require a mega fire boar.'
  }, {
    completed: simpleRequirePotw(P.Simisear),
    msg: 'Facing this adversary will require a searing simian.'
  }, {
    completed: requireItem('bignugget'),
    msg: 'A being of Steel should appreciate a large sphere of gold.'
  }, {
    completed: (r) => r.totalTrades >= 50,
    msg: 'You will need friends. All for one and one for all.'
  }, {
    completed: (r) => r.location.forecast === 'Thunderstorm',
    msg: 'Your adversary will be training in the midst of a storm.'
  }, {
    completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_BW),
    msg: 'Professor Juniper will not let you challenge the adversary without her approval.'
  }]
}
export const captureTerrakion: LegendaryQuest = {
  hints: [{
    completed: requireType('Fighting', 100),
    msg: 'Do you have enough experience with capturing Fighting-type Pokémon?'
  }, {
    completed: requireType('Rock', 100),
    msg: 'You must in particular be familiar with the powerful resilience of Rock-type Pokémon.'
  }, {
    completed: (r) => r.raidRecord[1] >= 100,
    msg: 'You must first win against powerful adversaries.'
  }, {
    completed: simpleRequirePotw(P.Samurott),
    msg: 'Facing this adversary will require a formidable sea lion.'
  }, {
    completed: simpleRequirePotw(P.Simipour),
    msg: 'Facing this adversary will require a pouring simian.'
  }, {
    completed: requireItem('pearlstring'),
    msg: 'A being of Rock should appreciate glittery pearls, polished and strung.'
  }, {
    completed: (r) => r.totalTrades >= 50,
    msg: 'You will need friends. All for one and one for all.'
  }, {
    completed: (r) => r.location.forecast === 'Sandstorm',
    msg: 'Your adversary will be training in the midst of a dust storm.'
  }, {
    completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_BW),
    msg: 'Professor Juniper will not let you challenge the adversary without her approval.'
  }]
}
export const captureVirizion: LegendaryQuest = {
  hints: [{
    completed: requireType('Fighting', 100),
    msg: 'Do you have enough experience with capturing Fighting-type Pokémon?'
  }, {
    completed: requireType('Grass', 100),
    msg: 'You must in particular be familiar with the graceful beauty of Grass-type Pokémon.'
  }, {
    completed: (r) => r.raidRecord[1] >= 100,
    msg: 'You must first win against powerful adversaries.'
  }, {
    completed: simpleRequirePotw(P.Serperior),
    msg: 'Facing this adversary will require a regal serpent.'
  }, {
    completed: simpleRequirePotw(P.Simisage),
    msg: 'Facing this adversary will require a sage simian.'
  }, {
    completed: requireItem('balmmushroom'),
    msg: 'A being of Grass should appreciate a golden mushroom.'
  }, {
    completed: (r) => r.totalTrades >= 50,
    msg: 'You will need friends. All for one and one for all.'
  }, {
    completed: (r) => r.location.forecast === 'Heat Wave',
    msg: 'Your opponent will be training in the midst of the strong sun.'
  }, {
    completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_BW),
    msg: 'Professor Juniper will not let you challenge the adversary without her approval.'
  }]
}
export const captureLandorus: LegendaryQuest = {
  hints: [{
    completed: (r) => r.location.forecast === 'Windy',
    msg: 'A strong wind is brewing.'
  }, {
    completed: requirePotw([[P.Unfezant, {gender: 'male'}], [P.Unfezant, {gender: 'female'}]]),
    msg: 'The male of this bird Pokémon has colorful plumes to attract its counterpart.'
  }, {
    completed: simpleRequirePotwArr([P.Excadrill, P.Seismitoad, P.Krookodile, P.Stunfisk, P.Golurk]),
    msg: 'It has been said that "The Guardian of the Fields" has a deep connection to the land. Professor Juniper wants you to catch Pokémon tied to the ground.'
  }, {
    completed: requireItem(['tm-Sky Drop', 'tm-Bulldoze']),
    msg: 'Gym Leaders Skyla and Clay may be able to help by sharing their expertise with Pokémon.'
  }, {
    completed: simpleRequirePotwArr([P.Whimsicott, P.Lilligant]),
    msg: 'Some Pokémon grow stronger when connected to the Sun.'
  }, {
    completed: simpleRequirePotw(P.Eelektross),
    msg: 'Plants get nourishment during strong storms. Some Pokémon grow stronger too.'
  }, {
    completed: simpleRequirePotwArr([P.Swoobat, P.Leavanny]),
    msg: 'Regardless of how, all Pokémon need friendship.'
  }]
}
export const captureVictini: LegendaryQuest = {
  hints: [{
    completed: (r) => r.battleStadiumRecord[1] >= 151,
    msg: 'Demonstrate Victory many times amongst your peers.'
  }, {
    completed: (r) => r.raidRecord[1] >= 151,
    msg: 'Demonstrate Victory many times amongst nature.'
  }, {
    completed: requireType('Psychic', 151),
    msg: 'Victory requires a calm mind, necessitating experience with Psychic-type Pokémon.'
  }, {
    completed: requireType('Fire', 151),
    msg: 'Victory requires a fiery spirit, necessitating experience with Fire-type Pokémon.'
  }, {
    completed: requirePotw([[P.Darmanitan, {}], [P.Darmanitan, {form: 'zen'}]]),
    msg: 'A winner needs to have a mix of fiery spirit and moments of zen.'
  }, {
    completed: simpleRequirePotwArr([P.Archeops, P.Carracosta]),
    msg: 'Whether in the sea or sky, there have been records of victories since ancient times.'
  }]
}
export const captureReshiram: LegendaryQuest = {
  hints: [{
    completed: requireItem('lightstone'),
    msg: 'There is a dragon hidden in a bright stone.'
  }, {
    completed: complexRequirePotw(P.Basculin, {form: 'red_stripe'}),
    msg: 'This Pokémon has a red stripe similar to the red accents of the dragon.'
  }, {
    completed: simpleRequirePotw(P.Whimsicott),
    msg: `This Pokémon's white fluff reminds you of the white sheen of the dragon.`
  }, {
    completed: simpleRequirePotw(P.Gothitelle),
    msg: `This Pokémon's gothic mood reminds you of the dragon's demeanor.`
  }, {
    completed: simpleRequirePotw(P.Mandibuzz),
    msg: `This Pokémon's large bone reminds you of the dragon's hard, white scales.`
  }, {
    completed: simpleRequirePotw(P.Tornadus),
    msg: `This Pokémon blows strong funnels of wind on warm days, much like the dragon.`
  }, {
    completed: simpleRequirePotw(P.Hydreigon),
    msg: `This Pokemon has three heads, which is a lot. It is smaller than the dragon, but shares similarities too.`
  }, {
    completed: requireItem(['tm-Sludge Wave', 'tm-Steamroller', 'tm-Bulldoze', 'tm-Frost Breath']),
    msg: `Gym Leaders will help you investigate the dragon's rebirth. You see Roxie, Burgh, Clay, and Brycen standing by.`
  }]
}
export const captureZekrom: LegendaryQuest = {
  hints: [{
    completed: requireItem('darkstone'),
    msg: 'There is a dragon hidden in a dark stone.'
  }, {
    completed: complexRequirePotw(P.Basculin, {form: 'blue_stripe'}),
    msg: 'This Pokémon has a blue stripe similar to the blue accents of the dragon.'
  }, {
    completed: simpleRequirePotw(P.Lilligant),
    msg: `This Pokémon's colorful flower constrasts with the black sheen of the dragon.`
  }, {
    completed: simpleRequirePotw(P.Reuniclus),
    msg: `This Pokémon's amorphus body has large hands much like dragon's own.`
  }, {
    completed: simpleRequirePotw(P.Braviary),
    msg: `Few Pokémon can handle flying in the dragon's strong storms, but this one can.`
  }, {
    completed: simpleRequirePotw(P.Thundurus),
    msg: `This Pokémon blows strong gusts of wind, with thunderous power matching the dragon.`
  }, {
    completed: simpleRequirePotw(P.Haxorus),
    msg: `This Pokémon has strong tusks, but not strong enough to penetrate the dragon's black scales.`
  }, {
    completed: requireItem(['tm-Chip Away', 'tm-Electroweb', 'tm-Sky Drop', 'tm-Dual Chop']),
    msg: `Gym Leaders will help you investigate the dragon's rebirth. You see Lenora, Elesa, Skyla, and Iris standing by.`
  }]
}
export const captureKyurem: LegendaryQuest = {
  hints: [{
    completed: simpleRequirePotwArr([P.Zekrom, P.Reshiram]),
    msg: `There was once a single ultimate dragon but split apart. You will need to first capture a part of that dragon.`
  }, {
    completed: simpleRequirePotw(P.Chandelure),
    msg: 'You meet Shauntal. She has a spooky Chandelure.'
  }, {
    completed: simpleRequirePotw(P.Bisharp),
    msg: 'You meet Grimsley. He has a disciplined Bisharp.'
  }, {
    completed: simpleRequirePotw(P.Gothitelle),
    msg: 'You meet Caitlin. She has a decisive Gothitelle.'
  }, {
    completed: simpleRequirePotw(P.Mienshao),
    msg: 'You meet Marshal. He has a strong Meinshao.'
  }, {
    completed: simpleRequirePotw(P.Volcarona),
    msg: 'You meet the champion, Alder. He has a Volacrona that emits a brilliant light.'
  }]
}
export const captureKyuremBlack: LegendaryQuest = {
  hints: [{
    completed: simpleRequirePotwArr([P.Haxorus, P.Druddigon, P.Hydreigon, P.Kyurem]),
    msg: 'Colress is researching Dragon-type Pokémon from the Unova region.'
  }, {
    completed: simpleRequirePotwArr([
      P.Zebstrika, P.Emolga, P.Galvantula, P.Eelektross, P.Stunfisk,
      P.Ampharos, P.Electivire, P.Jolteon,
    ]),
    msg: 'Colress thinks there is a connection between Electric-type Pokémon and the ultimate dragon. He will need Electric-type Pokémon from Unova and beyond.'
  }, {
    completed: simpleRequirePotwArr([P.Kyurem, P.Zekrom]),
    msg: 'Colress has a device that can splice the DNA together between two Pokémon.'
  }]
}
export const captureKyuremWhite: LegendaryQuest = {
  hints: [{
    completed: simpleRequirePotwArr([P.Haxorus, P.Druddigon, P.Hydreigon, P.Kyurem]),
    msg: 'Colress is researching Dragon-type Pokémon from the Unova region.'
  }, {
    completed: simpleRequirePotwArr([
      P.Emboar, P.Simisear, P.Darmanitan, P.Chandelure, P.Volcarona, P.Heatmor,
      P.Arcanine, P.Magmortar, P.Flareon, P.Camerupt, P.Ninetales,
    ]),
    msg: 'Colress thinks there is a connection between Fire-type Pokémon and the ultimate dragon. He will need Fire-type Pokémon from Unova and beyond.'
  }, {
    completed: simpleRequirePotwArr([P.Kyurem, P.Reshiram]),
    msg: 'Colress has a device that can splice the DNA together between two Pokémon.'
  }]
}
export const captureKeldeo: LegendaryQuest = {
  hints: [{
    completed: simpleRequirePotwArr([P.Cobalion, P.Terrakion, P.Virizion]),
    msg: 'The Swords of Justice will lead you towards their apprentice.'
  }, {
    completed: requireType('Fighting', 100),
    msg: 'Do you have enough experience with capturing Fighting-type Pokémon?'
  }, {
    completed: requireType('Water', 100),
    msg: 'Their apprentice has strong Water-type attacks. You require more experience with Water-type Pokémon.'
  }, {
    completed: (r) => r.berryGrown >= 100,
    msg: 'This apprentice has an attraction to sweet berries.'
  }, {
    completed: (r) => r.raidRecord[1] >= 151,
    msg: 'The apprentice has a strong fighting spirit. Does it match your own?'
  }, {
    completed: requireItem(['healthwing', 'musclewing', 'resistwing', 'cleverwing', 'geniuswing', 'swiftwing']),
    msg: 'The apprentice has soft fur that is similar to how soft feathers are.'
  }]
}
export const captureMeloletta: LegendaryQuest = {
  hints: [{
    completed: requireItem(['tm-Snore', 'tm-Hyper Voice', 'tr-Grass Whistle', 'tr-Screech']),
    msg: 'You hear a voice in the distance. Can your Pokémon learn ways to call back?'
  }, {
    completed: simpleRequirePotwArr([P.Jigglypuff, P.Exploud, P.Ludicolo, P.Chatot, P.Seismitoad]),
    msg: 'Some Pokémon may be better skilled at making noise.'
  }, {
    completed: simpleRequirePotwArr([
      P.Emboar, P.Throh, P.Sawk, P.Scrafty, P.Mienshao
    ]),
    msg: 'This may be coming from a Fighting-type Pokémon. What Fighting-type Pokémon in Unova could it be?',
  }, {
    completed: complexRequirePotw(P.Jellicent, {gender: 'male'}),
    msg: 'The music creates strong vibrations, attracting the King of the Sea.',
  }, {
    completed: requirePotw([[P.Sawsbuck, {form: 'spring'}], [P.Sawsbuck, {form: 'summer'}]]),
    msg: 'The music attracts the attention of a deer Pokémon. Some are blooming flowers while others are fully green.'
  }, {
    completed: simpleRequirePotw(P.Gigalith),
    msg: 'The music is so loud it attracts a large rocky Pokémon.'
  }, {
    completed: simpleRequirePotw(P.Accelgor),
    msg: 'This Pokémon sheds its shell to get there sooner.',
  }, {
    completed: simpleRequirePotw(P.Whirlipede),
    msg: 'Gym Leader Roxie has a swift Whirlipede.'
  },  {
    completed: simpleRequirePotw(P.Leavanny),
    msg: 'Gym Leader Leavanny has an elegant Leavanny.'
  },  {
    completed: simpleRequirePotw(P.Excadrill),
    msg: 'Gym Leader Clay has a fierce Excadrill.'
  },  {
    completed: simpleRequirePotw(P.Beartic),
    msg: 'Gym Leader Brycen has a ferocious Beartic.'
  }, {
    completed: simpleRequirePotwArr([P.Zekrom, P.Reshiram]),
    msg: 'The music, sang from ancient times, depicts two legendary dragons.'
  }, {
    completed: requireItem('reliccrown'),
    msg: 'The ancient musician deserves a crown.'
  }]
}
export const captureGenesect: LegendaryQuest = {
  hints: [{
    completed: requireItem(['tm-Water Pulse', 'tm-Dark Pulse', 'tm-Hyper Beam', 'tm-Solar Beam', 'tm-Bubble Beam', 'tm-Charge Beam']),
    msg: 'Team Plasma has been manipulating a Pokémon to use Pulse and Beam moves.'
  }, {
    completed: simpleRequirePotwArr([
      P.Omastar, P.Kabutops, P.Aerodactyl, P.Cradily, P.Armaldo, P.Rampardos, P.Bastiodon, P.Archeops, P.Carracosta
    ]),
    msg: 'Team Plasma resurrected this Pokémon from an ancient fossil. Catching other fossil Pokémon may help with the research.'
  }, {
    completed: simpleRequirePotwArr([
      P.Leavanny, P.Scolipede, P.Crustle, P.Accelgor, P.Galvantula, P.Durant, P.Volcarona,
    ]),
    msg: 'You see a burst of energy which may be coming from a Bug-type Pokémon. What Bug-type Pokémon in Unova could it be?',
  }, {
    completed: complexRequirePotw(P.Jellicent, {gender: 'female'}),
    msg: 'This bright energy attracts a Queen of the Sea.',
  }, {
    completed: requirePotw([[P.Sawsbuck, {form: 'autumn'}], [P.Sawsbuck, {form: 'winter'}]]),
    msg: 'These bursts spook deer Pokémon. One has red leaves while the other looks ready to head north.'
  }, {
    completed: simpleRequirePotw(P.Conkeldurr),
    msg: 'It would be wise to have a Pokémon which could block pulses with concrete.'
  }, {
    completed: simpleRequirePotw(P.Escavalier),
    msg: 'This Pokémon finds a set of armor to defend itself.'
  }, {
    completed: simpleRequirePotw(P.Watchog),
    msg: 'Gym Leader Lenora has a patient Watchog.'
  }, {
    completed: simpleRequirePotw(P.Zebstrika),
    msg: 'Gym Leader Elesa has a brave Zebstrika.'
  }, {
    completed: simpleRequirePotw(P.Swanna),
    msg: 'Gym Leader Skyla has a fanciful Swanna.'
  }, {
    completed: simpleRequirePotw(P.Haxorus),
    msg: 'Gym Leader Iris has a razor-sharp Haxorus.'
  }, {
    completed: simpleRequirePotwArr([P.Zekrom, P.Reshiram]),
    msg: 'This ancient Pokémon seems to embody both truth and ideals.'
  }, {
    completed: requireItem(['firegem', 'electricgem', 'watergem', 'icegem']),
    msg: 'This ancient Pokémon should be attracted to shiny objects.'
  }]
}
export const getRevealGlass: LegendaryQuest = {
  hints: [{
    completed: (r) => r.location.forecast === 'Windy',
    msg: 'Go to where the winds blow.'
  }, {
    completed: simpleRequirePotwArr([P.Thundurus, P.Tornadus, P.Landorus]),
    msg: 'You hear the whispers of the djinn.'
  }, {
    completed: simpleRequirePotwArr([P.Tranquill, P.Swoobat, P.Sigilyph, P.Archeops, P.Swanna,
      P.Emolga, P.Braviary, P.Mandibuzz]),
    msg: 'Professor Juniper requests you obtain a mastery of Flying-type Pokémon.'
  }, {
    completed: requireItem(['tm-Secret Sword', 'tm-Relic Song']),
    msg: 'Have you heard mythical stories of musketeers and folk tunes?'
  }, {
    completed: requireItem(['dnasplicerblack', 'dnasplicerwhite']),
    msg: 'Perhaps the scientist Colress knows more about the Djinns. Have you worked with him before?',
  }]
}
export const PokeballVivillon: LegendaryQuest = {
  hints: [{
    completed: haveCaught(666),
    msg: 'Catch 666 Pokémon.',
  }, {
    completed: (r) => calculateNetWorth(r as unknown as Users.Doc) >= 666,
    msg: 'Have over 666 in wealth.'
  }, {
    completed: requirePotw([
      [P.Vivillon, {form: 'archipelago'}],
      [P.Vivillon, {form: 'continental'}],
      [P.Vivillon, {form: 'elegant'}],
      [P.Vivillon, {form: 'garden'}],
      [P.Vivillon, {form: 'highplains'}],
      [P.Vivillon, {form: 'icysnow'}],
      [P.Vivillon, {form: 'jungle'}],
      [P.Vivillon, {form: 'marine'}],
      [P.Vivillon, {form: 'meadow'}],
      [P.Vivillon, {form: 'modern'}],
      [P.Vivillon, {form: 'monsoon'}],
      [P.Vivillon, {form: 'ocean'}],
      [P.Vivillon, {form: 'polar'}],
      [P.Vivillon, {form: 'river'}],
      [P.Vivillon, {form: 'sandstorm'}],
      [P.Vivillon, {form: 'savanna'}],
      [P.Vivillon, {form: 'sun'}],
      [P.Vivillon, {form: 'tundra'}],
    ]),
    msg: 'Catch Vivillon in its many forms.'
  }]
}
export const Xerneas: LegendaryQuest = {
  hints: [{
    completed: requireItem('charizarditex'),
    msg: 'Did you know there is a waX to Mega Evolve Charizard?'
  }, {
    completed: requireItem('mewtwoitex'),
    msg: 'Did you know there is a waX to Mega Evolve Mewtwo?'
  }, {
    completed: simpleRequirePotw(P.Starmie),
    msg: 'Have you seen this Pokémon? It looks like a star!'
  }, {
    completed: simpleRequirePotw(P.Pinsir),
    msg: 'Have you seen this Pokémon? It has large pincers on its head!'
  }, {
    completed: simpleRequirePotw(P.Houndoom),
    msg: 'Have you seen this Pokémon? It has two sinister horns on its hot head!'
  }, {
    completed: simpleRequirePotw(P.Mightyena),
    msg: 'Have you seen this Pokémon? It has a sinister snarl like a laugh!'
  }, {
    completed: simpleRequirePotw(P.Aggron),
    msg: 'Have you seen this Pokémon? It has a steely exterior!'
  }, {
    completed: simpleRequirePotw(P.Cradily),
    msg: 'Have you seen this Pokémon? It has thick roots embedded in old stone!'
  }, {
    completed: simpleRequirePotw(P.Armaldo),
    msg: 'Have you seen this Pokémon? It has sharp claws embedded in old stone!'
  }, {
    completed: simpleRequirePotw(P.Sawk),
    msg: 'Have you seen this Pokémon? It has a strong chop with its blue hands!'
  }, {
    completed: simpleRequirePotw(P.Slurpuff),
    msg: 'Have you seen this Pokémon? It has a sweet odor like a cupcake!'
  }, {
    completed: simpleRequirePotw(P.Clawitzer),
    msg: 'Have you seen this Pokémon? It shoots projectiles from its claw!'
  }, {
    completed: complexRequirePotw(P.Florges, {form: 'yellow'}),
    msg: 'Have you seen this Pokémon? Its bright yellow and smells like a flower!'
  }, {
    completed: complexRequirePotw(P.Aegislash, {form: 'shield'}),
    msg: 'Have you seen this Pokémon? It holds a shield!'
  }, {
    completed: complexRequirePotw(P.Meowstic, {gender: 'male'}),
    msg: 'Have you seen this Pokémon? It purrs and licks its dark fur!'
  }]
}
export const Yveltal: LegendaryQuest = {
  hints: [{
    completed: requireItem('charizarditey'),
    msg: 'Did you know there is a waY to Mega Evolve Charizard?'
  }, {
    completed: requireItem('mewtwoitey'),
    msg: 'Did you know there is a waY to Mega Evolve Mewtwo?'
  }, {
    completed: simpleRequirePotw(P.Cloyster),
    msg: 'Have you seen this Pokémon? It is quite shy, cloistering itself off from strangers!'
  }, {
    completed: simpleRequirePotw(P.Heracross),
    msg: 'Have you seen this Pokémon? It has a large horn on its head!'
  }, {
    completed: simpleRequirePotw(P.Manectric),
    msg: 'Have you seen this Pokémon? It runs like a bolt of lightning!'
  }, {
    completed: simpleRequirePotw(P.Liepard),
    msg: 'Have you seen this Pokémon? It has a sinister snarl like a purr!'
  }, {
    completed: simpleRequirePotw(P.Tyranitar),
    msg: 'Have you seen this Pokémon? It has a tyrannical look on its face!'
  }, {
    completed: simpleRequirePotw(P.Omastar),
    msg: 'Have you seen this Pokémon? It has a helix shape embedded in old stone!'
  }, {
    completed: simpleRequirePotw(P.Kabutops),
    msg: 'Have you seen this Pokémon? It has thick dome head embedded in old stone!'
  }, {
    completed: simpleRequirePotw(P.Throh),
    msg: 'Have you seen this Pokémon? It has a powerful throw with its red hands!'
  }, {
    completed: simpleRequirePotw(P.Aromatisse),
    // what pokemon has a pleasant aroma and beak-like face?
    msg: 'Have you seen this Pokémon? It has a pleasant aroma and a beak-like face!'
  }, {
    completed: simpleRequirePotw(P.Dragalge),
    msg: 'Have you seen this Pokémon? It has a long plant-like tail!'
  }, {
    completed: complexRequirePotw(P.Florges, {form: 'yellow'}),
    msg: 'Have you seen this Pokémon? Its bright yellow and smells like a flower!'
  }, {
    completed: complexRequirePotw(P.Aegislash, {form: 'blade'}),
    msg: 'Have you seen this Pokémon? It holds a sword!'
  }, {
    completed: complexRequirePotw(P.Meowstic, {gender: 'female'}),
    msg: 'Have you seen this Pokémon? It purrs and licks its light fur!'
  }]
}
export const ZygardeCell: LegendaryQuest = {
  hints: [{
    completed: requirePotw([
      [P.Gourgeist, {form: 'small'}],
      [P.Gourgeist, {form: 'average'}],
      [P.Gourgeist, {form: 'large'}],
      [P.Gourgeist, {form: 'super'}],
    ]),
    msg: 'Have you seen this Pokémon? As it grows from a seed, it can come in four distinct sizes.'
  }, {
    completed: simpleRequirePotw(P.Pangoro),
    msg: 'Have you seen this Pokémon? It gets darker as it evolves.'
  }, {
    completed: complexRequirePotw(P.Florges, {form: 'red'}),
    msg: 'Have you seen this Pokémon? It has a majestic red coloration that smells like a flower!'
  }, {
    completed: complexRequirePotw(P.Furfrou, {form: 'heart'}),
    msg: "This one's haircut looks like a heart."
  }, {
    completed: complexRequirePotw(P.Furfrou, {form: 'star'}),
    msg: "This one's haircut makes it look like a star."
  }, {
    completed: complexRequirePotw(P.Furfrou, {form: 'matron'}),
    msg: "This one's haircut is a tad matronly."
  }, {
    completed: requireItem('tm-Infestation'),
    msg: 'Receive a gift from Bug-type leader Viola.'
  }, {
    completed: requireItem('tm-Head Smash'),
    msg: 'Receive a gift from Rock-type leader Grant.'
  }]
}
export const Diancie: LegendaryQuest = {
  hints: [{
    completed: requireItem('soot', 150), // Is this too high?
    msg: 'Before you can collect diamonds, you need to start with ash.',
  }, {
    completed: simpleRequirePotw(P.Carbink),
    msg: 'Have you seen this Pokémon? Its bejeweled body has been formed under intense pressure.'
  }, {
    completed: simpleRequirePotwArr([
      P.Aromatisse,
      P.Slurpuff,
      P.Barbaracle,
      P.Sylveon,
    ]),
    msg: 'There are a number of Fairy and Rock-type Pokémon from the Kalos region.'
  }, {
    completed: complexRequirePotw(P.Florges, {form: 'blue'}),
    msg: 'Have you seen this Pokémon? It has a sky blue coloration that smells like a flower!'
  }, {
    completed: complexRequirePotw(P.Furfrou, {form: 'diamond'}),
    msg: "This one's haircut reminds you of diamonds."
  }, {
    completed: complexRequirePotw(P.Furfrou, {form: 'debutante'}),
    msg: "This one's haircut makes it look quite deputable."
  }, {
    completed: requireItem([
      'venusaurite', 'charizarditex', 'charizarditey', 'blastoiseite',
      'alakazamite', 'gengarite', 'banetteite', 'pinsirite', 'heracrossite',
      'gardevoirite', 'ampharosite', 'manectricite', 'scizorite', 'mawileite',
      'aggronite', 'gyaradosite', 'aerodactylite', 'tyranitarite', 'absolite',
      'houndoomite', 'blazikenite', 'lucarioite', 'medichamite', 'garchompite',
      'mewtwoitex', 'mewtwoitey', 'abomasnowite', 'kangaskhanite',
    ]),
    msg: 'Have you mastered Mega Evolution in the Kalos region?'
  }, {
    completed: requireItem('tm-Power-Up Punch'),
    msg: 'Receive a gift from Fighting-type leader Korrina.'
  }, {
    completed: requireItem('tm-Petal Blizzard'),
    msg: 'Receive a gift from Grass-type leader Ramos.'
  }]
}
export const Hoopa: LegendaryQuest = {
  hints: [{
    completed: simpleRequirePotw(P.Tyrantrum),
    msg: 'Have you seen this Pokémon? It once terrorized the prehistoric lands of Kalos.'
  }, {
    completed: simpleRequirePotw(P.Aurorus),
    msg: 'Have you seen this Pokémon? It once brightened the prehistoric lands of Kalos.'
  }, {
    completed: requirePotw(
      // Dynamically pull in every form
      get('potw-666')!.syncableForms!.map(form => [P.Vivillon, {form}])
    ),
    msg: "Did you know that this Pokémon's form depends on where it is when it evolves?"
  }, {
    completed: complexRequirePotw(P.Florges, {form: 'orange'}),
    msg: 'Have you seen this Pokémon? It has a warm orange coloration that smells like a flower!'
  }, {
    completed: complexRequirePotw(P.Furfrou, {form: 'kabuki'}),
    msg: "This one's haircut reminds you of kabuki."
  }, {
    completed: complexRequirePotw(P.Furfrou, {form: 'pharaoh'}),
    msg: "This one's haircut gives major Egyptian vibes."
  }, {
    completed: requireItem([
      'sceptileite', 'swampertite', 'sharpedoite', 'cameruptite',
      'slowbroite', 'lopunnyite', 'pidgeotite', 'steelixite',
      'sableyeite', 'beedrillite', 'glalieite', 'audinoite',
      'galladeite', 'latiosite', 'latiasite', 'salamenceite',
      'metagrossite', 'altariaite',
    ]),
    msg: 'Have you mastered Mega Evolution in the Hoenn region?'
  }, {
    completed: requireItem('tm-Nuzzle'),
    msg: 'Receive a gift from Electric-type leader Clemont.'
  }, {
    completed: requireItem('tm-Play Rough'),
    msg: 'Receive a gift from Fairy-type leader Valerie.'
  }]
}
export const PrisonBottle: LegendaryQuest = {
  hints: [{
    completed: simpleRequirePotw(P.Talonflame),
    msg: 'Elite Four member Malva has a terrific Talonflame',
  }, {
    completed: simpleRequirePotw(P.Aegislash),
    msg: 'Elite Four member Wikstrom has an agile Aegislash',
  }, {
    completed: simpleRequirePotw(P.Noivern),
    msg: 'Elite Four member Drasna has a nice Noiven',
  }, {
    completed: simpleRequirePotw(P.Barbaracle),
    msg: 'Elite Four member Siebold has a barbaric Barbaracle',
  }, {
    completed: requireItem('gardevoirite'),
    msg: 'Champion Diantha has a way to mega evolve her Gardevoir',
  }, {
    completed: simpleRequirePotw(P.Dialga),
    msg: 'Have you caught a master of time?',
  }, {
    completed: simpleRequirePotw(P.Palkia),
    msg: 'Have you caught a master of space?',
  }, {
    completed: simpleRequirePotw(P.Hoopa),
    msg: 'There are ancient myths about a Pokémon that likes to open rings to other dimensions',
  }]
}
export const Volcanion: LegendaryQuest = {
  hints: [{
    completed: simpleRequirePotwArr([
      P.Greninja, P.Barbaracle, P.Dragalge, P.Clawitzer
    ]),
    msg: 'There are many Water-type Pokémon that live near the coasts of Kalos.'
  }, {
    completed: requirePotw([
      [P.Delphox, {}], [P.Talonflame, {}],
      [P.Pyroar, {gender: 'female'}], [P.Pyroar, {gender: 'male'}],
    ]),
    msg: 'There are many Fire-type Pokémon that live in the warm inlands of Kalos.'
  }, {
    completed: simpleRequirePotw(P.Goodra),
    msg: 'Did you know that this Pokémon evolves when exposed to torrential downpours?'
  }, {
    completed: complexRequirePotw(P.Florges, {form: 'white'}),
    msg: 'Have you seen this Pokémon? It has an eggshell white coloration that smells like a flower!'
  }, {
    completed: complexRequirePotw(P.Furfrou, {form: 'dandy'}),
    msg: "This one's haircut isn't spectacular, but it's quite dandy."
  }, {
    completed: complexRequirePotw(P.Furfrou, {form: 'lareine'}),
    msg: "This one's haircut is quite French."
  }, {
    completed: requireItem(MEGA_STONES),
    msg: 'Have you mastered Mega Evolution?'
  }, {
    completed: requireItem('tm-Psyshock'),
    msg: 'Receive a gift from Psychic-type leader Olympia.'
  }, {
    completed: requireItem('tm-Freeze-Dry'),
    msg: 'Receive a gift from Ice-type leader Wulfric.'
  }]
}
export const TapuX: LegendaryQuest = {
  hints: [{
    completed: countForBid(p => get(p)?.tiers?.includes('Ultra Cup'), 400),
    msg: 'Catch a dex worth of "Ultra" Pokémon.'
  }, {
    completed: (r) => r.location.terrain === 'Tropical',
    msg: 'Alola is a Tropical location.'
  }, {
    completed: (r) => Object.entries(r.pokemon) 
      .filter(([key]) => ['totem', 'alpha', 'noble', 'titan'].includes(new Badge(key).personality.form ?? ''))
      .map(([, count]) => count)
      .length > 0,
    msg: 'Alola is known for having larger-than-normal Totem Pokémon. Catch one.'
  }, {
    completed: complexRequirePotw(P.Pikachu, {form: 'alolan'}),
    msg: 'Catch a Pikachu wearing a tropical hat.'
  }]
}
export const TapuKoko: LegendaryQuest = {
  hints: [...TapuX.hints, {
    completed: simpleRequirePotw(P.Gumshoos),
    msg: 'Gumshoos is a common Pokémon of Mele Mele Island.'
  }, {
    completed: complexRequirePotw(P.Raticate, {form: 'alolan'}),
    msg: 'Alolan Raticate is a common Pokémon of Mele Mele Island.'
  }, {
    completed: simpleRequirePotw(P.Crabrawler),
    msg: 'Kahuna Hala has a strong Crabrawler at his side.',
  }, {
    completed: complexRequirePotw(P.Oricorio, {form: 'pom_pom'}),
    msg: 'This cheerful yellow bird enjoys dancing.'
  }, {
    completed: requireItem('tm-Power Trip'),
    msg: "Obtain a TM that does more damage depending on a user's stat boosts."
  }]
}
export const TapuLele: LegendaryQuest = {
  hints: [...TapuX.hints, {
    completed: simpleRequirePotw(P.Wishiwashi),
    msg: 'This Pokémon of Akala Island will often form in large schools.'
  }, {
    completed: simpleRequirePotw(P.Salazzle),
    msg: 'This Pokémon of Akala Island spits corrosive acid.'
  }, {
    completed: simpleRequirePotw(P.Lurantis),
    msg: 'This Pokémon of Akala Island looks like a candy cane, but you should not lick its sharp scythes.'
  }, {
    completed: complexRequirePotw(P.Lycanroc, {form: 'midnight'}),
    msg: 'Kahuna Olivia has a harsh Lycanroc at her side.',
  }, {
    completed: complexRequirePotw(P.Oricorio, {form: 'pau'}),
    msg: 'This relaxed pink bird enjoys dancing.'
  }, {
    completed: requireItem('tm-Liquidation'),
    msg: "Obtain a TM in which the user strikes the opponent with water."
  }, {
    completed: requireItem('tm-Burn Up'),
    msg: "Obtain a TM in whichthe user from a Fire-type to something else."
  }, {
    completed: requireItem('tm-Solar Blade'),
    msg: "Obtain a TM in which the user slashes with solar energy."
  }]
}
export const TapuBulu: LegendaryQuest = {
  hints: [...TapuX.hints, {
    completed: simpleRequirePotw(P.Vikavolt),
    msg: "This Pokémon of Ula'Ula Island flies past with eletrical power."
  }, {
    completed: simpleRequirePotw(P.Mimikyu),
    msg: "This Pokémon of Ula'Ula Island has never been seen. It hides under a disguise."
  }, {
    completed: complexRequirePotw(P.Persian, {form: 'alolan'}),
    msg: 'Kahuna Nanu has a sinister Persian at his side.',
  }, {
    completed: complexRequirePotw(P.Oricorio, {form: 'baile'}),
    msg: 'This charismatic red bird enjoys dancing.'
  }, {
    completed: requireItem('tm-Zing Zap'),
    msg: "Obtain a TM in which the user's electrical collision can cause a flinch."
  }, {
    completed: requireItem('tm-Phantom Force'),
    msg: "Obtain a TM in which the user disappears into the shadows for a turn."
  }]
}
export const TapuFini: LegendaryQuest = {
  hints: [...TapuX.hints, {
    completed: simpleRequirePotw(P.Kommo_o),
    msg: 'This Pokémon of Poni Island clangs its scales together to make loud noises.'
  }, {
    completed: simpleRequirePotw(P.Mudsdale),
    msg: 'Kahuna Hala has an enduring Mudsdale at her side.',
  }, {
    completed: complexRequirePotw(P.Oricorio, {form: 'sensu'}),
    msg: 'This respectful purple bird enjoys dancing.'
  }, {
    completed: requireItem('tm-Dragon Pulse'),
    msg: "Obtain a TM that distills draconic power into a pulse of energy.",
  }]
}
export const SunFlute: LegendaryQuest = {
  hints: [{
    completed: complexRequirePotw(P.Ninetales, {form: 'alolan'}),
    msg: 'Catch a mystical fox that lives in the snowy mountains.',
  }, {
    completed: simpleRequirePotw(P.Houndoom),
    msg: 'Catch a fiery hound.',
  }, {
    completed: simpleRequirePotw(P.Whimsicott),
    msg: 'Catch a cottony Pokémon.',
  }, {
    completed: complexRequirePotw(P.Basculin, {form: 'red_stripe'}),
    msg: 'Catch a red-ish fish.',
  }, {
    completed: simpleRequirePotw(P.Golurk),
    msg: 'Catch a clay golem.',
  }, {
    completed: simpleRequirePotw(P.Braviary),
    msg: 'Catch an eagle.',
  }, {
    completed: simpleRequirePotw(P.Clawitzer),
    msg: 'Catch a lobster.',
  }, {
    completed: simpleRequirePotw(P.Turtonator),
    msg: 'Catch a draconic tortoise.',
  }, {
    completed: simpleRequirePotw(P.Passimian),
    msg: 'Catch a rugby monkey.',
  }, {
    completed: complexRequirePotw(P.Lycanroc, {form: 'midday'}),
    msg: 'Catch a sunny rock dog.',
  }]
}
export const MoonFlute: LegendaryQuest = {
  hints: [{
    completed: complexRequirePotw(P.Sandslash, {form: 'alolan'}),
    msg: 'Catch a sharp shrew that lives in the snowy mountains.',
  }, {
    completed: simpleRequirePotw(P.Manectric),
    msg: 'Catch a thundrous hound.',
  }, {
    completed: simpleRequirePotw(P.Lilligant),
    msg: 'Catch a lily Pokémon.',
  }, {
    completed: complexRequirePotw(P.Basculin, {form: 'blue_stripe'}),
    msg: 'Catch a blue-ish fish.',
  }, {
    completed: simpleRequirePotw(P.Claydol),
    msg: 'Catch a clay doll.',
  }, {
    completed: simpleRequirePotw(P.Mandibuzz),
    msg: 'Catch a vulture.',
  }, {
    completed: simpleRequirePotw(P.Dragalge),
    msg: 'Catch a sea dragon.',
  }, {
    completed: simpleRequirePotw(P.Drampa),
    msg: 'Catch a draconic grandpa.',
  }, {
    completed: simpleRequirePotw(P.Oranguru),
    msg: 'Catch a meditative orangutan.',
  }, {
    completed: complexRequirePotw(P.Lycanroc, {form: 'midnight'}),
    msg: 'Catch a lunar rock dog.',
  }]
}
export const TypeNull: LegendaryQuest = {
  hints: [{
    completed: requireItem([...MEMORIES]),
    msg: 'You first must seek out discs that contain data on Pokémon types.',
  }, {
    completed: simpleRequirePotwArr([P.Crobat, P.Zoroark, P.Lucario]),
    msg: 'There is a Pokémon trainer named Gladion who holds a rare Pokémon.'
  }, {
    completed: (r) => r.battleStadiumRecord[1] >= 200,
    msg: 'Prove to Gladion you are skilled at battling trainers.'
  }, {
    completed: (r) => r.raidRecord[1] >= 200,
    msg: 'Prove to Gladion you are skilled at battling in raids.'
  }]
}
export const Necrozma: LegendaryQuest = {
  hints: [{
    completed: requireItem([...Z_CRYSTALS]),
    msg: 'There are Z-Crystals for every type.'
  }, {
    completed: simpleRequirePotw(P.Crabominable),
    msg: 'Elite Four member Hala has a muscular Crabominable'
  }, {
    completed: complexRequirePotw(P.Golem, {form: 'alolan'}),
    msg: 'Elite Four member Olivia has an electrifying Golem.'
  }, {
    completed: simpleRequirePotw(P.Palossand),
    msg: 'Elite Four member Acerola has a Pokémon that might get stuck in your shoes.'
  }, {
    completed: simpleRequirePotw(P.Toucannon),
    msg: 'Elite Four member Kahili has a Pokémon with a long colorful beak.',
  }]
}
export const NecrozmaUltra: LegendaryQuest = {
  hints: [{
    completed: complexRequirePotw(P.Lycanroc, {form: 'dusk'}),
    msg: 'Lycanroc has a distinct form only available one hour a day.'
  }, {
    completed: simpleRequirePotw(P.Naganadel),
    msg: 'This Ultra Beast has a toxic stinger.'
  }, {
    completed: requireItem(['zkommonium', 'zlunalium', 'zlycanium', 'zmimikium', 'zsolganium']),
    msg: 'Some Z-Crystals can give distinct Z-Moves to specific Pokémon.'
  }]
}
export const Magearna: LegendaryQuest = {
  hints: [{
    completed: requirePotw([
      [P.Minior, {form: 'red_core'}],
      [P.Minior, {form: 'orange_core'}],
      [P.Minior, {form: 'yellow_core'}],
      [P.Minior, {form: 'green_core'}],
      [P.Minior, {form: 'blue_core'}],
      [P.Minior, {form: 'indigo_core'}],
      [P.Minior, {form: 'violet_core'}],
    ]),
    msg: 'A Pokémon known as Minior comes in many colors when they are cracked open.'
  }, {
    completed: requirePotw([
      [P.Raticate, {form: 'alolan'}],
      [P.Raichu, {form: 'alolan'}],
      [P.Sandslash, {form: 'alolan'}],
      [P.Ninetales, {form: 'alolan'}],
      [P.Dugtrio, {form: 'alolan'}],
      [P.Persian, {form: 'alolan'}],
      [P.Golem, {form: 'alolan'}],
      [P.Muk, {form: 'alolan'}],
      [P.Exeggutor, {form: 'alolan'}],
      [P.Marowak, {form: 'alolan'}],
    ]),
    msg: 'Some Pokémon have a distinct form exclusively in the Alolan region.'
  }]
}
export const MagearnaPokeball: LegendaryQuest = {
  hints: [{
    completed: (r) => {
      return r.pokedex.kanto === 151 &&
        r.pokedex.johto  === 100 &&
        r.pokedex.hoenn  === 135 &&
        r.pokedex.sinnoh === 107 &&
        r.pokedex.unova  === 156 &&
        r.pokedex.kalos  === 72 &&
        r.pokedex.alola  === 86
    },
    msg: 'Have you worked on completing the PokéDex?'
  }, {
    completed: countFor((x => x.personality.variant !== undefined), 807),
    msg: 'Some Pokémon are "variants" and have different backgrounds. Catch a bunch to research different kinds.'
  }, {
    completed: (r) => {
      // FIXME use countFor method
      const valid = Object.entries(r.pokemon) 
        .filter(([key]) => new Badge(key).personality.shiny)
        .map(([, count]) => count)
      return valid.length > 81
    },
    msg: 'Some Pokémon have alternate colors. Try finding more of them.'
  }, {
    completed: (r) => {
      const valid = Object.entries(r.pokemon) 
        .filter(([key]) => new Badge(key).personality.gender)
        .map(([, count]) => count)
      return valid.length > 81
    },
    msg: 'Some Pokémon have distinct genders. Try finding more of them.'
  }, {
    completed: (r) => {
      const valid = Object.entries(r.pokemon) 
        .filter(([key]) => new Badge(key).personality.form)
        .map(([, count]) => count)
      return valid.length > 81
    },
    msg: 'Some Pokémon have distinct forms. Try finding more of them.'
  }, {
    completed: simpleRequirePotw(P.Magearna),
    msg: 'Have you ever encountered the mechanical Pokémon, Magearna?'
  }]
}
export const Zeraora: LegendaryQuest = {
  hints: [{
    completed: requirePotw([
      [P.Pichu, {}],
      [P.Pikachu, {}],
      [P.Raichu, {form: 'alolan'}],
      [P.Charjabug, {}],
      [P.Vikavolt, {}],
      [P.Magnemite, {}],
      [P.Magneton, {}],
      [P.Magnezone, {}],
      [P.Oricorio, {form: 'pom_pom'}],
      [P.Geodude, {form: 'alolan'}],
      [P.Graveler, {form: 'alolan'}],
      [P.Golem, {form: 'alolan'}],
      [P.Jolteon, {}],
      [P.Mareep, {}], [P.Flaaffy, {}], [P.Ampharos, {}],
      [P.Chinchou, {}], [P.Lanturn, {}],
      [P.Dedenne, {}], [P.Togedemaru, {}], [P.Electrike, {}], [P.Manectric, {}],
      [P.Elekid, {}], [P.Electabuzz, {}], [P.Electivire, {}], [P.Tapu_Koko, {}], [P.Xurkitree, {}],
    ]),
    msg: 'There are many Electric-type Pokémon that call Alola their home.'
  }, {
    completed: simpleRequirePotwArr([
      P.Nihilego, P.Stakataka, P.Blacephalon, P.Buzzwole, P.Pheromosa,
      P.Xurkitree, P.Celesteela, P.Kartana, P.Guzzlord,
    ]),
    msg: 'Have you encountered the Ultra Beasts from Ultra Space?'
  }, {
    completed: requirePotw([
      [P.Pikachu, {form: 'kantonian'}],
      [P.Pikachu, {form: 'hoennian'}],
      [P.Pikachu, {form: 'sinnohian'}],
      [P.Pikachu, {form: 'unovan'}],
      [P.Pikachu, {form: 'kalosian'}],
      [P.Pikachu, {form: 'alolan'}],
      [P.Pikachu, {form: 'galarian'}],
    ]),
    msg: "Have you ever seen a Pikachu wearing a hat? It's so cute! What hats might it be wearing?"
  }, {
    completed: requireItem([
      'zaloraichium', 'zdecidium', 'zeevium', 'zincinium', 'zmarshadium', 'zmewnium', 'zpikanium',
      'zpikashunium', 'zprimarium', 'zsnorlium', 'ztapunium',
    ]),
    msg: "Did you know some Z-Crystals can only be held by a specific Pokémon?"
  }, {
    completed: (r) => r.voyagesCompleted >= 100,
    msg: "Go on more than 100 voyages."
  }, {
    completed: (r) => {
      for (const [b] of r.pokemonBadges) {
        if (b.personality.nature === 'Jolly') return true
      }
      return false
    },
    msg: 'You will need a Pokémon with a Jolly nature.',
  }, {
    completed: (r) => r.location.forecast === 'Thunderstorm',
    msg: "Zeraora will appear where lightning strikes."
  }]
}
export const Marshadow: LegendaryQuest = {
  hints: [{
    completed: requirePotw([
      [P.Decidueye, {}],
      [P.Gengar, {}],
      [P.Drifblim, {}],
      [P.Sableye, {}],
      [P.Marowak, {form: 'alolan'}],
      [P.Trevenant, {}],
      [P.Golurk, {}],
      [P.Oricorio, {form: 'sensu'}],
      [P.Mimikyu, {}],
      [P.Banette, {}],
      [P.Jellicent, {gender: 'female'}],
      [P.Jellicent, {gender: 'male'}],
      [P.Froslass, {}],
      [P.Dhelmise, {}],
      [P.Mismagius, {}],
      [P.Lunala, {}],
    ]),
    msg: 'There are many Ghost-type Pokémon that call Alola their home.'
  }, {
    completed: requirePotw([
      [P.Hariyama, {}],
      [P.Crabominable, {}],
      [P.Primeape, {}],
      [P.Hawlucha, {}],
      [P.Machamp, {}],
      [P.Poliwrath, {}],
      [P.Bewear, {}],
      [P.Passimian, {}],
      [P.Pangoro, {}],
      [P.Scrafty, {}],
      [P.Mienshao, {}],
      [P.Kommo_o, {}],
      [P.Heracross, {}],
      [P.Lucario, {}],
      [P.Buzzwole, {}],
      [P.Pheromosa, {}],
    ]),
    msg: 'There are many Fighting-type Pokémon that call Alola their home.'
  }, {
    completed: simpleRequirePotwArr([
      P.Ho_Oh
    ]),
    msg: 'Use a rainbow to conquer the darkness.'
  }, {
    completed: requirePotw([
      [P.Pikachu, {form: 'kantonian'}],
    ]),
    msg: "Have you ever seen a Pikachu wearing a classic hat? It's so cute!"
  }, {
    completed: requireItem([
      'zkommonium', 'zlunalium', 'zlycanium', 'zmimikium', 'zsolganium', 'zultranecrozium',
    ]),
    msg: "Did you know some Z-Crystals can only be held by a specific Pokémon?"
  }, {
    completed: requireItem([
      'adrenalineorb',
    ]),
    msg: "When you enter a battle, your heart race quickens and you are filled with Adrenaline."
  }, {
    completed: (r) => {
      for (const [b] of r.pokemonBadges) {
        if (b.personality.nature === 'Adamant') return true
      }
      return false
    },
    msg: 'You will need a Pokémon with an Adamant nature.',
  }, {
    completed: requireItem('townmap'),
    msg: "As you travel more and more, you may need a tool to help you track locations."
  }, {
    completed: (r) => r.battleStadiumRecord[1] >= 300,
    msg: "Achieve more than 300 victories in battle."
  }]
}
export const NSolarizer: LegendaryQuest = {
  hints: [{
    completed: requireItem(['dnasplicerblack', 'dnasplicerwhite', 'colressmchn']),
    msg: 'Have you encountered the scientist Colress in the past?'
  }, {
    completed: simpleRequirePotwArr([P.Solgaleo, P.Necrozma]),
    msg: 'Have you encountered the legendary Pokémon of Alola?'
  }, {
    completed: requireItem('zultranecrozium'),
    msg: 'There is a Z-Crystal that can only be held by Necrozma.'
  }]
}
export const NLunarizer: LegendaryQuest = {
  hints: [{
    completed: requireItem(['dnasplicerblack', 'dnasplicerwhite', 'colressmchn']),
    msg: 'Have you encountered the scientist Colress in the past?'
  }, {
    completed: simpleRequirePotwArr([P.Lunala, P.Necrozma]),
    msg: 'Have you encountered the legendary Pokémon of Alola?'
  }, {
    completed: requireItem('zultranecrozium'),
    msg: 'There is a Z-Crystal that can only be held by Necrozma.'
  }]
}
export const UltraBeast: LegendaryQuest = {
  hints: [{
    completed: requireItem('zpowerring'),
    msg: 'Before you go searching for Ultra Beasts, be prepared with a Z-Power ring.'
  }, {
    completed: (r) => r.hiddenItemsFound.includes(CATCH_CHARM_SM),
    msg: 'Catch a number of Pokémon from the Alola region.'
  }]
}
export const Nihilego: LegendaryQuest = {
  hints: [...UltraBeast.hints, {
    completed: complexRequirePotw(P.Grimer, {form: 'alolan'}),
    msg: 'Catch a shimmering oil Pokémon.'
  }]
}
export const Buzzwole: LegendaryQuest = {
  hints: [...UltraBeast.hints, {
    completed: complexRequirePotw(P.Sandshrew, {form: 'alolan'}),
    msg: 'Catch a snowy shrew Pokémon.'
  }]
}
export const Pheramosa: LegendaryQuest = {
  hints: [...UltraBeast.hints, {
    completed: complexRequirePotw(P.Vulpix, {form: 'alolan'}),
    msg: 'Catch a snowy fox Pokémon.'
  }]
}
export const Xurkitree: LegendaryQuest = {
  hints: [...UltraBeast.hints, {
    completed: complexRequirePotw(P.Raichu, {form: 'alolan'}),
    msg: 'Catch a surging surfer Pokémon.'
  }]
}
export const Celesteela: LegendaryQuest = {
  hints: [...UltraBeast.hints, {
    completed: complexRequirePotw(P.Exeggutor, {form: 'alolan'}),
    msg: 'Catch a tall tree Pokémon.'
  }]
}
export const Kartana: LegendaryQuest = {
  hints: [...UltraBeast.hints, {
    completed: complexRequirePotw(P.Marowak, {form: 'alolan'}),
    msg: 'Catch a fire juggling Pokémon.'
  }]
}
export const Guzzlord: LegendaryQuest = {
  hints: [...UltraBeast.hints, {
    completed: complexRequirePotw(P.Golem, {form: 'alolan'}),
    msg: 'Catch a ferrous electromagnetic Pokémon.'
  }]
}
export const Stakataka: LegendaryQuest = {
  hints: [...UltraBeast.hints, {
    completed: simpleRequirePotw(P.Solgaleo),
    msg: 'Catch a sun-chasing Pokémon.'
  }, {
    completed: requireItem('zsolganium'),
    msg: 'Obtain a Z-Crystal that can only be used by Solgaleo.'
  }]
}
export const Blacephalon: LegendaryQuest = {
  hints: [...UltraBeast.hints, {
    completed: simpleRequirePotw(P.Lunala),
    msg: 'Catch a moon-flying Pokémon.'
  }, {
    completed: requireItem('zlunalium'),
    msg: 'Obtain a Z-Crystal that can only be used by Lunala.'
  }]
}
export const Poipole: LegendaryQuest = {
  hints: [{
    completed: simpleRequirePotw(P.Stakataka),
    msg: 'Build a fort.'
  }, {
    completed: simpleRequirePotw(P.Blacephalon),
    msg: 'Start clowing around.'
  }, {
    completed: requireItem(['zsolganium', 'zlunalium']),
    msg: 'Gain the items needed to venture into Ultra Space.'
  }]
}
export const Meltan: LegendaryQuest = {
  hints: [{
    completed: requirePotw([
      [P.Magnemite, {}], [P.Magneton, {}], [P.Magnezone, {}],
      [P.Diglett, {form: 'alolan'}], [P.Dugtrio, {form: 'alolan'}],
      [P.Mawile, {}], [P.Shieldon, {}], [P.Bastiodon, {}], [P.Probopass, {}], [P.Forretress, {}], [P.Skarmory, {}],
      [P.Beldum, {}], [P.Metang, {}], [P.Metagross, {}], [P.Togedemaru, {}], [P.Pawniard, {}], [P.Bisharp, {}],
      [P.Scizor, {}], [P.Lucario, {}], [P.Solgaleo, {}], [P.Stakataka, {}], [P.Celesteela, {}], [P.Kartana, {}],
      [P.Magearna, {}],
    ]),
    msg: 'There are many Steel-type Pokémon that inhabit Alola. But is there one we are missing?'
  }, {
    completed: requireItem('ironball'),
    msg: 'There is a small Steel-type Pokémon. Do you think it likes to eat iron objects?'
  }, {
    completed: requireItem('metalcoat'),
    msg: 'It is unusual. It seems to be covered in a metallic coating.'
  }, {
    completed: requireItem('zsteelium'),
    msg: 'It might be interested in seeing your Z-Power ring.'
  }]
}
/**
 * Have TM084/86
Catch Galarian Weezing
Version exclusives:
GMax-Machamp, Sirfetch’d, Pinsir, Omastar, Ho-Oh, Shiftry, Mawile, Solrock,
Salamence, Latios, Groudon, Dialga, Red Basculin, G-Darmanitan, Scrafty,
Gothitelle, Braviary, Hydreigon, Tornadus, Reshiram, Slurpuff,
Clawitzer, Xerneas, Passimian, Turtonator, Kommo-O, Solageo,
GMax-Coalossal, GMax-Flapple, Stonjourner, Indeedee-M
 */
export const Zacian: LegendaryQuest = {
  hints: [{
    completed: requireItem(['tm-Body Press', 'tm-Mud Shot']),
    msg: 'Have you battled against the gym leaders Bea and Gordie?'
  }, {
    completed: simpleRequirePotw(P.Machamp),
    msg: 'When this Pokémon Gigantamaxes, it can use a devastating G-Max Chi Strike.',
  }, {
    completed: simpleRequirePotw(P.Coalossal),
    msg: 'When this Pokémon Gigantamaxes, it can use a devastating G-Max Volcalith.',
  }, {
    completed: simpleRequirePotw(P.Flapple),
    msg: 'When this Pokémon Gigantamaxes, it can use a devastating G-Max Tartness.',
  }, {
    completed: simpleRequirePotw(P.Stonjourner),
    msg: 'Have you seen this Pokémon? It watches the sunset with stone-like stoicism.',
  }, {
    completed: complexRequirePotw(P.Indeedee, {gender: 'male'}),
    msg: 'Have you seen this Pokémon? It can serve as valets for others, using its horns to detect emotions.',
  }, {
    completed: complexRequirePotw(P.Weezing, {form: 'galarian'}),
    msg: 'Have you seen this Pokémon? It likes to consume toxic gasses in the air.',
  }, {
    completed: simpleRequirePotwArr([
      P.Pinsir, P.Omastar, P.Shiftry, P.Mawile, P.Solrock, P.Salamence,
      P.Scrafty, P.Gothitelle, P.Braviary, P.Hydreigon, P.Slurpuff,
      P.Clawitzer, P.Passimian, P.Turtonator, P.Kommo_o,
    ]),
    msg: 'Have you seen rare Pokémon of Galar? Some may only be drawn to the blade.'
  }]
}
/**
 * Have TM089/90
Catch Galarian Darmanitan
Version Exclusives:
GMax-Gengar,
G-Rapidash, GMax-Lapras, Kabutops, Heracross, Cursola, Tyranitar, Lugia,
Ludicolo, Sableye, Lunatone, Latias, Kyogre, Garchomp, Toxicroak,
Palkia, Blue Basculin, Reuniclus, Mandibuzz, Thundurus, Zekrom,
Aromatisse, Dragalge, Goodra, Yveltal, Oranguru, Drampa, Lunala,
GMax-Appletun, Eiscue, Indeedee-F
 */
export const Zamazenta: LegendaryQuest = {
  hints: [{
    completed: requireItem(['tm-Payback', 'tm-Icicle Spear']),
    msg: 'Have you battled against the gym leaders Allister and Melony?'
  }, {
    completed: simpleRequirePotw(P.Gengar),
    msg: 'When this Pokémon Gigantamaxes, it can use a devastating G-Max Terror.',
  }, {
    completed: simpleRequirePotw(P.Lapras),
    msg: 'When this Pokémon Gigantamaxes, it can use a devastating G-Max Resonance.',
  }, {
    completed: simpleRequirePotw(P.Appletun),
    msg: 'When this Pokémon Gigantamaxes, it can use a devastating G-Max Sweetness.',
  }, {
    completed: simpleRequirePotw(P.Eiscue),
    msg: 'Have you seen this Pokémon? Its icy head can shatter.',
  }, {
    completed: complexRequirePotw(P.Indeedee, {gender: 'female'}),
    msg: 'Have you seen this Pokémon? It is good at babysitting while it shares information with friends using its horns.',
  }, {
    completed: complexRequirePotw(P.Darmanitan, {form: 'galarian'}),
    msg: 'Have you seen this Pokémon? It has a large snowball on its head.',
  }, {
    completed: simpleRequirePotwArr([
      P.Heracross, P.Kabutops, P.Ludicolo, P.Sableye, P.Lunatone, P.Garchomp,
      P.Toxicroak, P.Reuniclus, P.Mandibuzz, P.Goodra, P.Aromatisse,
      P.Dragalge, P.Oranguru, P.Drampa, P.Tyranitar,
    ]),
    msg: 'Have you seen rare Pokémon of Galar? Some may only be drawn to the shield.'
  }]
}
/**
 * Have the regional form evolutions: Obstagoon, Perrserker, Cursola, Sirfetch’d, Mr. Rime, Runegrigus
Catch the four fossil Pokemon
Catch Galarian Stunfisk
Catch Zamazenta & Zacian
 */
export const Eternatus: LegendaryQuest = {
  hints: [{
    completed: simpleRequirePotwArr([
      P.Obstagoon, P.Perrserker, P.Cursola, P.Sirfetchd, P.Mr_Rime, P.Runerigus
    ]),
    msg: 'Some Pokémon, originally discovered in other regions, have unique evolutions in the Galar region.'
  }, {
    completed: simpleRequirePotwArr([
      P.Dracovish, P.Arctozolt, P.Arctovish, P.Dracozolt,
    ]),
    msg: 'Cara Liss says some Pokémon can be caught by revolving a pair of fossils.'
  }, {
    completed: complexRequirePotw(P.Stunfisk, {form: 'galarian'}),
    msg: `Have you seen this Pokémon? If you step on the wrong spot, it'll snap you up.`
  }, {
    completed: (r) => r.battleStadiumRecord[1] > 200,
    msg: `Before you can battle Eternatus, you'll have to prove your strength as a trainer.`
  }, {
    completed: simpleRequirePotwArr([
      P.Zacian, P.Zamazenta,
    ]),
    msg: `Before you can catch Eternatus, you'll need the partnership of the ancient heroes.`
  }]
}
/**
 * Have Galarian Slowbro
Have Max Honey
Catch 100 Fighting-type Pokemon
 */
export const Kubfu: LegendaryQuest = {
  hints: [{
    completed: complexRequirePotw(P.Slowbro, {form: 'galarian'}),
    msg: 'Slowpoke has a distinct form on the Isle of Armor. What happens when you give it a Galarica cuff?'
  }, {
    completed: requireItem('maxhoney'),
    msg: 'A Kubfu is nearby, but you will need to get something sweet to lure it.'
  }, {
    completed: requireType('Fighting', 200),
    msg: 'Kubfu is a Fighting-type Pokémon. It may come closer if it has some friends.'
  }]
}
/**
 * Have Celebi
Have other forest Pokemon
Have all baby Pokemon
 */
export const Zarude: LegendaryQuest = {
  hints: [{
    completed: simpleRequirePotw(P.Celebi),
    msg: 'It is rumored that Zarude live in the same forest as Celebi.'
  }, {
    completed: simpleRequirePotwArr([
      P.Butterfree, P.Oddish, P.Diglett, P.Exeggcute, P.Pinsir, P.Hoothoot,
      P.Wooper, P.Mantine, P.Lotad, P.Seedot, P.Ninjask, P.Mawile, P.Flygon,
      P.Budew, P.Combee, P.Cherubi, P.Drifloon, P.Stunky, P.Bonsly, P.Munchlax,
      P.Pidove, P.Roggenrola, P.Drilbur, P.Cottonee, P.Dwebble, P.Foongus,
      P.Rufflet, P.Spritzee, P.Goomy, P.Grubbin, P.Mudbray, P.Morelull,
      P.Salazzle, P.Skwovet, P.Wooloo, P.Cramorant, P.Arrokuda,
    ]),
    msg: 'Catch the Pokémon of the forest where Zarude resides.'
  }, {
    completed: complexRequirePotw(P.Cramorant, {form: 'gulping'}),
    msg: 'Catch a Cramorant who has a fish in its mouth.'
  }, {
    completed: complexRequirePotw(P.Cramorant, {form: 'gorging'}),
    msg: 'Catch a Cramorant who has a Pikachu in its mouth.'
  }, {
    completed: simpleRequirePotwArr([
      P.Igglybuff, P.Cleffa, P.Pichu, P.Togepi, P.Magby, P.Elekid, P.Smoochum,
      P.Wynaut, P.Azurill, P.Toxel
    ]),
    msg: 'Zarude is said to be a good parent to baby Pokémon.'
  }]
}
/**
Scroll of Water
Have Kubfu
Have 50 exp candies XL
Catch 300 Water-type Pokemon
 */
export const UrshifuWater: LegendaryQuest = {
  hints: [{
    completed: simpleRequirePotw(P.Kubfu),
    msg: 'Have a Kubfu that is eager to train.'
  }, {
    completed: requireItem('expcandyxl', 50),
    msg: 'Have a lot of experience candy so that Kubfu can level up.'
  }, {
    completed: requireType('Water', 300),
    msg: 'To obtain the Scroll of Water, demonstrate experience in Water-type Pokémon.'
  }]
}
/**
 * Scroll of Darkness
Have Kubfu
Have 50 exp candies XL
Catch 300 Dark-type Pokemon
 */
export const UrshifuDark: LegendaryQuest = {
  hints: [{
    completed: simpleRequirePotw(P.Kubfu),
    msg: 'Have a Kubfu that is eager to train.'
  }, {
    completed: requireItem('expcandyxl', 50),
    msg: 'Have a lot of experience candy so that Kubfu can level up.'
  }, {
    completed: requireType('Dark', 300),
    msg: 'To obtain the Scroll of Dark, demonstrate experience in Dark-type Pokémon.'
  }]
}
/**
 * TMs 81, 83, 85, 87
Catch Eternatus
 */
export const Glastrier: LegendaryQuest = {
  hints: [{
    completed: requireItem('tm-Leafage'),
    msg: 'Earn a reward from Gym Leader Milo.'
  }, {
    completed: requireItem('tm-Flame Wheel'),
    msg: 'Earn a reward from Gym Leader Kabu.'
  }, {
    completed: requireItem('tm-Draining Kiss'),
    msg: 'Earn a reward from Gym Leader Opal.'
  }, {
    completed: requireItem('tm-Beat Up'),
    msg: 'Earn a reward from Gym Leader Piers.'
  }, {
    completed: simpleRequirePotw(P.Poipole),
    msg: 'Catch a small purple Pokémon that came out of the Ultra Wormhole.'
  }, {
    completed: simpleRequirePotw(P.Eternatus),
    msg: 'Complete the mission at Macro Cosmos.'
  }, {
    completed: simpleRequirePotwArr([P.Frosmoth, P.Eiscue, P.Arctozolt, P.Arctovish]),
    msg: 'Catch the Ice-type Pokémon of Galar.'
  }, {
    completed: complexRequirePotw(P.Slowking, {form: 'galarian'}),
    msg: 'Slowpoke has a distinct form in the Crown Tundra. What happens when you give it a Galarica wreath?'
  }]
}
/**
 * TMs 82, 84, 86, 88
Catch Eternatus
Every Ice-type: Frosmoth, Eiscue, Arctozolt, Arctovish,
 */
export const Spectrier: LegendaryQuest = {
  hints: [{
    completed: requireItem('tm-Razor Shell'),
    msg: 'Earn a reward from Gym Leader Nessa.'
  }, {
    completed: requireItem('tm-Body Press'),
    msg: 'Earn a reward from Gym Leader Bea.'
  }, {
    completed: requireItem('tm-Mud Shot'),
    msg: 'Earn a reward from Gym Leader Gordie.'
  }, {
    completed: requireItem('tm-Twister'),
    msg: 'Earn a reward from Gym Leader Raihan.'
  }, {
    completed: simpleRequirePotw(P.Poipole),
    msg: 'Catch a small purple Pokémon that came out of the Ultra Wormhole.'
  }, {
    completed: simpleRequirePotw(P.Eternatus),
    msg: 'Complete the mission at Macro Cosmos.'
  }, {
    // Cursola, Runegrigus, Dragapult
    completed: simpleRequirePotwArr([P.Cursola, P.Runerigus, P.Dragapult]),
    msg: 'Catch the Ghost-type Pokémon of Galar.'
  }, {
    completed: complexRequirePotw(P.Slowking, {form: 'galarian'}),
    msg: 'Slowpoke has a distinct form in the Crown Tundra. What happens when you give it a Galarica wreath?'
  }]
}
/**
 * Calyrex
Every form of Alcremie
Catch Galarian Rapidash, Slowbro, Slowking
Catch Eternatus, Regieleki, Regidrago
 */
export const Calyrex: LegendaryQuest = {
  hints: [{
    completed: complexRequirePotw(P.Rapidash, {form: 'galarian'}),
    msg: `Have you found the "Unique Horn" Pokémon?`
  }, {
    completed: (r) => {
      return complexRequirePotw(P.Slowbro, {form: 'galarian'})(r) &&
        complexRequirePotw(P.Slowking, {form: 'galarian'})(r)
    },
    msg: 'Slowpoke has a Galarian form! What happens when it evolves?'
  }, {
    completed: simpleRequirePotw(P.Eternatus),
    msg: 'Complete the mission at Macro Cosmos.'
  }, {
    completed: simpleRequirePotwArr([P.Glastrier, P.Spectrier]),
    msg: 'A king is nothing without their trusty steed.'
  }, {
    completed: simpleRequirePotwArr([P.Regieleki, P.Regidrago]),
    msg: 'Have you explored all the rare Pokémon which live in the Crown Tundra?'
  }]
}
/**
 * Regidrago
All 3 Regis & Eternatus
Have every Dragon Galarian Pokémon: Flapple, Appleton, Dracozolt, Arctozolt, Dracovishm Duraludon, Dragapult
Max Mushrooms
 */
export const Regidrago: LegendaryQuest = {
  hints: [{
    completed: simpleRequirePotwArr([P.Regirock, P.Regice, P.Registeel]),
    msg: 'Are you familiar with the legendary golems of Hoenn?'
  }, {
    completed: simpleRequirePotw(P.Eternatus),
    msg: 'Complete the mission at Macro Cosmos.'
  }, {
    completed: simpleRequirePotwArr([P.Flapple, P.Appletun, P.Dracozolt, P.Arctozolt, P.Dracovish, P.Duraludon, P.Dragapult]),
    msg: 'Are you familiar with the Dragon-type Pokémon of Galar?'
  }, {
    completed: requireItem('maxmushroom'),
    msg: 'Do you have mushrooms that can cause Pokémon to Gigantamax?'
  }, {
    completed: (r) => {
      return !simpleRequirePotw(P.Regieleki)(r)
    },
    msg: 'You arrive at the Split Decision-Ruins. Which path do you take?'
  }]
}
/**
 * Regieleki
All 3 Regis & Eternatus
Have every Electric Galarian Pokémon: Boltund, Toxtricity (both forms), Morpeko (both forms), Dracozolt
Max Honey
 */
export const Regieleki: LegendaryQuest = {
  hints: [{
    completed: simpleRequirePotwArr([P.Regirock, P.Regice, P.Registeel]),
    msg: 'Are you familiar with the legendary golems of Hoenn?'
  }, {
    completed: simpleRequirePotw(P.Eternatus),
    msg: 'Complete the mission at Macro Cosmos.'
  }, {
    completed: simpleRequirePotwArr([P.Boltund, P.Toxtricity, P.Morpeko, P.Dracozolt]),
    msg: 'Are you familiar with the Electric-type Pokémon of Galar?'
  }, {
    completed: (r) => {
      return complexRequirePotw(P.Toxtricity, {form: 'amped'})(r) &&
        complexRequirePotw(P.Toxtricity, {form: 'low_key'})(r)
    },
    msg: 'Did you know Toxtricity has two distinct forms based on its nature?'
  }, {
    completed: requireItem('maxhoney'),
    msg: 'Do you have honey that can cause Pokémon to Gigantamax?'
  }, {
    completed: (r) => {
      return !simpleRequirePotw(P.Regidrago)(r)
    },
    msg: 'You arrive at the Split Decision-Ruins. Which path do you take?'
  }]
}
/**
 * Shiny Ponyta (PLA)
Caught Kleavor
Caught Kantonian & Galarian Ponyta
Catch Ponyta-var1, var2, var3, var4
Have item Pokeshi Doll
 */
export const PlaPony: LegendaryQuest = {
  hints: [{
    completed: simpleRequirePotw(P.Kleavor),
    msg: 'Have you caught the noble Pokémon that lives in the woods?'
  }, {
    completed: simpleRequirePotw(P.Ponyta),
    msg: 'Have you ever caught the fiery horse Pokémon?'
  }, {
    completed: complexRequirePotw(P.Ponyta, {form: 'galarian'}),
    msg: 'Have you ever caught the unique horn Pokémon?'
  }, {
    completed: (r) => {
      return complexRequirePotw(P.Ponyta, {variant: 1})(r) &&
        complexRequirePotw(P.Ponyta, {variant: 2})(r) &&
        complexRequirePotw(P.Ponyta, {variant: 3})(r) &&
        complexRequirePotw(P.Ponyta, {variant: 4})(r)
    },
    msg: 'Ponyta may have a handful of unique moves from variants'
  }, {
    completed: requireItem('pokeshidoll'),
    msg: 'Ponyta may approach you if you have a friendly doll to play with.'
  }]
}
/**
 * Enamorus
Have all 3 other genies
Season: Spring or Summer
Have the reveal glass
Windy
Something about berries
Have all the other new evolutions: Kleavor, Ursaluna, Overqwil, Basculegion, Wyrdeer, Sneaseler
 */
export const Enamorus: LegendaryQuest = {
  hints: [{
    completed: simpleRequirePotwArr([P.Thundurus, P.Tornadus, P.Landorus]),
    msg: 'Are you familiar with the djinns of legend?'
  }, {
    completed: (r) => {
      const now = season(r.location, new Date())
      return ['Spring', 'Summer'].includes(now) && r.location.forecast === 'Windy'
    },
    msg: 'There is a Pokémon who represents the spring winds.'
  }, {
    completed: requireItem('revealglass'),
    msg: 'Legends speak of a legendary mirror who can change the form of certain Pokémon'
  }, {
    completed: (r) => r.berryGrown >= 500,
    msg: 'Enamorus is said to arrive with the beginning of planting season. Have you planted many berries?'
  }, {
    completed: simpleRequirePotwArr([P.Kleavor, P.Ursaluna, P.Basculegion, P.Sneasler, P.Wyrdeer, P.Overqwil]),
    msg: 'There are certain Pokémon evolutions who are only known to have come from the Hisui region.'
  }]
}
/**
 * - Hisui Starters
 * - Hisui Nobles
 * - Adamant/Lustrous Orb
 * - Gresious Orb
 * - Battle/Raids
 */
export const LegendsPlate: LegendaryQuest = {
  hints: [{
    completed: (r) => {
      return complexRequirePotw(P.Decidueye, {form: 'hisuian'})(r) &&
        complexRequirePotw(P.Typhlosion, {form: 'hisuian'})(r) &&
        complexRequirePotw(P.Samurott, {form: 'hisuian'})(r)
    },
    msg: 'Legends state that when certain starter Pokémon are in the Hisui region they will evolve into distinct forms.'
  }, {
    completed: (r) => {
      return complexRequirePotw(P.Kleavor, {})(r) &&
        complexRequirePotw(P.Lilligant, {form: 'hisuian'})(r) &&
        complexRequirePotw(P.Arcanine, {form: 'hisuian'})(r) &&
        complexRequirePotw(P.Electrode, {form: 'hisuian'})(r) &&
        complexRequirePotw(P.Avalugg, {form: 'hisuian'})(r)
    },
    msg: 'Legends speak of the noble Pokémon who once guarded the lands of Hisui.'
  }, {
    completed: requireItem(['adamantorb', 'lustrousorb']),
    msg: 'Legends include drawings of items that reveal the true forms of Dialga and Palkia.'
  }, {
    completed: requireItem('griseousorb'),
    msg: 'Legends include drawings of items that reveal the true form of Giratina.'
  }, {
    completed: (r) => r.raidRecord[1] >= 250 && r.battleStadiumRecord[1] >= 250,
    msg: 'The mythical Pokémon Arceus shall not appear until you prove yourself in battle.'
  }]
}