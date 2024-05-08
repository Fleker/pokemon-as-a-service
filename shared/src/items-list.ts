import {assert} from '@fleker/gents'
import { BadgeId, Type } from "./pokemon/types"
import { MoveId, MoveTypeMap } from "./gen/type-move-meta"
import * as P from './gen/type-pokemon'
// If I just use the second entry, it uses the key: string
// and the whole thing is just a string.
import { get } from "./pokemon"
import asLiterals from "./as-literals"
import { CATCH_CHARM_GSC, CATCH_CHARM_SM, CATCH_CHARM_SWSH, Requirements } from './legendary-quests'
import { Nature } from './badge3'
import { GALAR_INGREDIENTS, SWEETS, MINTS } from './prizes'

/**
 * Represents an item, something in the player inventory.
 */
export interface Item {
  /**
   * Display name of the item.
   */
  label: string
  /**
   * The 'pocket' the item belongs in.
   */
  category: Category
  /**
   * Flavor text or usage descriptor.
   */
  description?: string
  /**
   * Price in Poké Balls. '0' means you cannot buy it.
   */
  buy: number
  /**
   * Resale value in Poké Balls. '0' means you cannot sell it.
   */
  sell: number
  /**
   * Whether this item is useful for battles.
   */
  battle?: boolean
  /**
   * Whether this item is useful for daycare.
   */
  daycare?: boolean
  /**
   * Whether this item is actionable in your bag.
   */
  functional?: boolean
  /**
   * When `functional` is enabled, there is this second flag. When this flag
   * is turned on as well, the item will be used without being associated with
   * a single species.
   *
   * For some items, such as fossils, they will be restored directly.
   */
  direct?: boolean
}

export interface Berry extends Item {
  /**
   * Time to maturation, in hours.
   */
  growTime: number
  /**
   * Number of berries on a mature plant, from `min` to `max`.
   */
  yield: {
    min: number
    max: number
  }
}

export interface MegaStone extends Item {
  badge: BadgeId
}

export interface Lure extends Item {
  isLure: boolean
}

export interface SouvenirContainer extends Item {
  isSouvenirContainer: boolean
}

export interface Souvenir extends Item {
  isSouvenir: boolean
}

export interface Bait extends Item {
  /** Dividend rate by which the bait will be consumed. */
  consumption: number
  /** Boosted shiny rate */
  shiny?: number
}

export const categoryKeys = asLiterals([
  'balls', 'items', 'hold', 'treasure', 'berry',
  'battle', 'tms', 'trs', 'key', 'fertilizer', 'fossil', 'material',
  'megastone', 'zcrystal', 'cooking', 'bait', 'terashard', 'clothing',
  'sticker',
])
export type Category = keyof {[K in (typeof categoryKeys)[number]]: string}


interface CategoryAttributes {
  label: string
  /** See https://fonts.google.com/icons */
  icon: string
  /** For laying out the UI */
  categoryDescription?: string
  /** For linking to another page */
  categoryRoute?: string
  /** A quick way to disable new categories */
  active?: boolean
}

export const categoryAttributes: Record<Category, CategoryAttributes> = {
  balls: {
    label: `PokéBalls`,
    icon: 'sports_baseball',
    categoryDescription: 'Use Poké Balls to catch Pokémon',
    categoryRoute: '/pokemon/catch'
  },
  items: {
    label: 'Other Items',
    icon: 'category',
    categoryDescription: 'These items can have unique effects on some Pokémon.',
  },
  hold: {
    label: 'Hold Items',
    icon: 'back_hand',
    categoryDescription: 'Let your Pokémon hold an item while trading and something special might happen.',
    categoryRoute: '/multiplayer/gts'
  },
  treasure: {
    label: 'Treasure',
    icon: 'redeem',
    categoryDescription: 'Rare items that can go for a high price at the Mart.',
    categoryRoute: '/items/mart',
  },
  berry: {
    label: 'Berries',
    // icon: 'nutrition',
    icon: 'park',
    categoryDescription: 'Berries can have a variety of effects on a Pokémon.',
  },
  battle: {
    label: 'Battle Items',
    // icon: 'swords',
    icon: 'sports_mma',
    categoryDescription: 'Let your Pokémon hold an item while battling to gain an advantage',
    categoryRoute: '/multiplayer/battle'
  },
  tms: {
    label: 'Technial Machines',
    icon: 'album',
    categoryDescription: 'Let your Pokémon learn a new move during battles to gain an advantage.',
    categoryRoute: '/multiplayer/battle',
  },
  trs: {
    label: 'Technical Records',
    icon: 'disc_full',
    categoryDescription: 'Let your Pokémon use temporarily learn a new move in battle to get a one-time advantage.',
    categoryRoute: '/multiplayer/battle',
  },
  key: {
    label: 'Key Items',
    icon: 'key',
    categoryDescription: 'Items that are key.',
  },
  fertilizer: {
    label: 'Fertilizers',
    icon: 'compost',
    categoryDescription: 'Fertilizers can be used on berry plots for varying effects.',
    categoryRoute: '/base/farm'
  },
  fossil: {
    label: 'Fossils',
    // icon: 'skeleton',
    icon: 'pets',
    categoryDescription: 'A rock containing a living creature from long ago. Can anything be done with it?',
  },
  material: {
    label: 'Crafting Materials',
    icon: 'handyman',
    categoryDescription: 'Items that may be useful in crafting other items.',
    categoryRoute: '/items/craft'
  },
  megastone: {
    label: 'Mega Stones',
    // icon: 'genetics',
    icon: 'stream',
    categoryDescription: 'Items that a Pokémon can hold in battles to draw out their full power.',
    categoryRoute: '/multiplayer/battle'
  },
  zcrystal: {
    label: 'Z-Crystals',
    icon: 'diamond',
    categoryDescription: 'Items that a Pokémon can hold in battles to unleash an attack of devastating power.',
    categoryRoute: '/multiplayer/battle'
  },
  terashard: {
    label: 'Tera Shards',
    icon: 'heart_broken',
    active: true,
    categoryDescription: 'Items that a Pokémon can hold in battles to trigger terrastalization.',
    categoryRoute: '/multiplayer/battle'
  },
  cooking: {
    label: 'Cooking Items',
    // icon: 'cooking',
    icon: 'outdoor_grill',
    active: true,
    categoryDescription: 'Items that may be useful in creating bait.',
    categoryRoute: '/items/craft'
  },
  bait: {
    label: 'Bait',
    icon: 'lunch_dining',
    active: true,
    categoryDescription: 'Items that may be uesful in encountering rare Pokémon.',
    categoryRoute: '/pokemon/encounters'
  },
  clothing: {
    label: 'Fashion',
    icon: 'heart_broken',
    active: false,
  },
  sticker: {
    label: 'Stickers',
    icon: 'heart_broken',
    active: false,
  }
}

const HELD_TYPE_ITEM = (label: string, type: Type, buy = 12): Item => {
  return {
    label,
    category: 'battle',
    buy, sell: 8,
    description: `An item to be held by a Pokémon. It increases the power of ${type}-type attacks.`,
    battle: true,
    daycare: true,
  }
}

const GEM = (type: Type): Item => {
  return {
    label: `${type} Gem`,
    category: 'battle',
    buy: 6, sell: 3,
    description: `An item to be held by a Pokémon. It increases the power of ${type}-type attacks once.`,
    battle: true,
  }
}

const RKS_MEMORY = (type: Type): Item => {
  return {
    label: `${type} Memory`,
    category: 'battle',
    buy: 0, sell: 6,
    description: `An item to be held by a specific Pokémon. It contains ${type}-type data and changes its type.`,
    battle: true,  }
}

const APRICORN_BALL = (label): Item => {
  return {
    label,
    category: 'balls',
    description: 'A Poké Ball made from an Apricorn that can catch certain Pokémon',
    buy: 0, sell: 3,    
  }
}

const DEVON_BALL = (label): Item => {
  return {
    label,
    category: 'balls',
    description: 'A Poké Ball produced by the Devon Corporation that can catch certain Pokémon',
    buy: 4, sell: 3,    
  }
}

const TX = (cat: 'tm' | 'tr', move: MoveId): string => {
  return `${cat}-${move}`
}

function Pokeball(opts: {label: string, description: string, buy: number, sell: number}): Item {
  const {label, description, buy, sell} = opts
  return {
    label, description, buy, sell,
    category: 'balls',
     
  }
}

function Treasure(opts: {label: string, description: string, sell?: number, functional?: boolean}): Item {
  const {label, description, sell, functional} = opts
  return {
    label, description, buy: 0, sell: sell || 0, functional,
    category: 'treasure',
  }
}

function Slate(opts: {label: string, description: string}): Item {
  const {label, description} = opts
  return {
    label, description: `${description}. This will create an 11-Star raid.`,
    buy: 0, sell: 0, direct: true,
    category: 'treasure',
  }
}

/**
 * Creates a generic placeholder item in the items category
 * @param opts Label of the item
 * @returns Simple item to append to item list without making it accessible in-game
 */
function Placeholder(opts: {label: string}): Item {
  const {label} = opts
  return {
    label,
    description: 'Description to come',
    buy: 0, sell: 0,
    category: 'items',
     
  }
}

const ITEMS_POKEBALLS = {
  // Poké Balls
  pokeball: Pokeball({
    label: 'Poké Ball',
    description: 'A common Poké Ball used to catch Pokémon',
    buy: 0, sell: 0,
  }),
  greatball: Pokeball({
    label: 'Great Ball',
    description: 'An uncommon Poké Ball used to catch stronger Pokémon',
    buy: 4, sell: 3,
  }),
  ultraball: Pokeball({
    label: 'Ultra Ball',
    description: 'A rare Poké Ball used to catch rare Pokémon',
    buy: 8, sell: 6,
  }),
  masterball: Pokeball({
    label: 'Master Ball',
    description: 'A special Poké Ball used to catch Pokémon considered legendary',
    buy: 24, sell: 20,
  }),
  safariball: APRICORN_BALL('Safari Ball'),
  fastball: APRICORN_BALL('Fast Ball'),
  friendball: APRICORN_BALL('Friend Ball'),
  heavyball: APRICORN_BALL('Heavy Ball'),
  levelball: APRICORN_BALL('Level Ball'),
  loveball: APRICORN_BALL('Love Ball'),
  lureball: APRICORN_BALL('Lure Ball'),
  moonball: APRICORN_BALL('Moon Ball'),
  competitionball: APRICORN_BALL('Sport Ball'),
  diveball: DEVON_BALL('Dive Ball'),
  luxuryball: DEVON_BALL('Luxury Ball'),
  nestball: DEVON_BALL('Nest Ball'),
  netball: DEVON_BALL('Net Ball'),
  repeatball: DEVON_BALL('Repeat Ball'),
  premierball: Pokeball({
    label: 'Premier Ball',
    description: 'A Poké Ball to commemorate a special occasion. It can catch common Pokémon.',
    buy: 0, sell: 0,
  }),
  duskball: Pokeball({
    label: 'Dusk Ball',
    description: 'A Poké Ball that catches Pokémon well during the night.',
    buy: 6, sell: 4,
  }),
  quickball: Pokeball({
    label: 'Quick Ball',
    description: 'A Poké Ball that catches certain Pokémon.',
    buy: 6, sell: 4,
  }),
  dreamball: Pokeball({
    label: 'Dream Ball',
    description: 'A Poké Ball that can catch Pokémon which inhabit a dream world.',
    buy: 8, sell: 6,
  }),
  beastball: Pokeball({
    label: 'Beast Ball',
    description: 'A Poké Ball from an island region. What is can capture is unknown.',
    buy: 0, sell: 0,
  }),
  // Index: 23
  cherishball: Pokeball({
    label: 'Cherish Ball',
    description: 'A Poké Ball that is used for ceremonies. You cannot use it.',
    buy: 0, sell: 0,
  }),
  leadenball: Pokeball({
    label: 'Leaden Ball',
    description: 'An old PokéBall that can catch Pokémon living underground or in trees.',
    buy: 0, sell: 0,
  }),
  gigatonball: Pokeball({
    label: 'Gigaton Ball',
    description: 'An old PokéBall that can catch rare Pokémon living underground or in trees.',
    buy: 0, sell: 0,
  }),
  featherball: Pokeball({
    label: 'Feather Ball',
    description: 'A PokéBall prototype that can travel far, either to the sky or the sea.',
    buy: 0, sell: 0,
  }),
  wingball: Pokeball({
    label: 'Wing Ball',
    description: 'A lightweight PokéBall prototype that can travel long distances, either to the sky or the sea.',
    buy: 0, sell: 0,
  }),
  // 28
  jetball: Pokeball({
    label: 'Jet Ball',
    description: 'A light PokéBall prototype that can be thrown great distances, all the way to the sky or the depths of the sea.',
    buy: 0, sell: 0,
  }),
  // 29
  originball: Pokeball({
    label: 'Origin Ball',
    description: 'Description to come',
    buy: 0, sell: 0,
  }),
  // 30
  strangeball: Pokeball({
    label: 'Strange Ball',
    description: 'Description to come',
    buy: 0, sell: 0,
  }),
  // 31 (This is the last one that can canonically exist)
}

export type PokeballId = keyof typeof ITEMS_POKEBALLS;

const ITEMS_TREASURE = {
  tinymushroom: Treasure({
    label: 'Tiny Mushroom',
    description: 'A small fungus that is highly sought after by collectors',
    sell: 5,
  }),
  bigmushroom: Treasure({
    label: 'Big Mushroom',
    description: 'A large fungus that is highly sought after by collectors',
    sell: 10,
  }),
  balmmushroom: Treasure({
    label: 'Balm Mushroom',
    description: 'A golden mushroom that smells unusally good. It is highly sought after.',
    sell: 15,
  }),
  nugget: Treasure({
    label: 'Nugget',
    description: 'A piece of gold that is highly sought after by collectors',
    sell: 10,
  }),
  bignugget: Treasure({
    label: 'Big Nugget',
    description: 'A large chunk of gold that is highly sought after by collectors',
    sell: 20,
  }),
  pearl: Treasure({
    label: 'Pearl',
    description: 'A shiny pearl that is highly sought after by collectors',
    sell: 6,
  }),
  bigpearl: Treasure({
    label: 'Big Pearl',
    description: 'A lustrous pearl that is highly sought after by collectors',
    sell: 10,
  }),
  pearlstring: Treasure({
    label: 'Pearl String',
    description: 'An elegant string of pearls that is highly valued.',
    sell: 16,
  }),
  stardust: Treasure({
    label: 'Stardust',
    description: 'Red sand that feels silky to the touch. It can be sold to shopkeepers.',
    sell: 6,
  }),
  starpiece: Treasure({
    label: 'Star Piece',
    description: 'A red gem that glistens brightly. It can be sold to shopkeepers.',
    sell: 10,
  }),
  cometshard: Treasure({
    label: 'Comet Shard',
    description: 'A real piece of space, something that is highly valuable.',
    sell: 16,
  }),
  rarebone: Treasure({
    label: 'Rare Bone',
    description: 'An old bone from the ground. Who did it belong to?',
    sell: 10,
  }),
  goldteeth: Treasure({
    label: 'Gold Teeth',
    description: 'A set of dentures made of gold. Do not stick them in your mouth! You can sell them instead.',
    sell: 8,
  }),
  prettywing: Treasure({
    label: 'Pretty Wing',
    description: 'An elegant feather that collectors may appreciate.',
    sell: 6,
  }),
  redshard: Treasure({
    label: 'Red Shard',
    description: 'A small red shard from an ancient item. It may be used as a bartering item.',
  }),
  greenshard: Treasure({
    label: 'Green Shard',
    description: 'A small green shard from a valuable antique. It may be used as a bartering item.',
  }),
  blueshard: Treasure({
    label: 'Blue Shard',
    description: 'A small blue shard from ancient pottery. It may be used as a bartering item.',
  }),
  yellowshard: Treasure({
    label: 'Yellow Shard',
    description: 'A small yellow shard from an old discarded item. It may be used as a bartering item.',
  }),
  heartscale: Treasure({
    label: 'Heart Scale',
    description: 'A colorful fishy scale that has a familiar shape. It may be used as a bartering item.',
  }),
  shoalsalt: Treasure({
    label: 'Shoal Salt',
    description: 'A deposit of salt from the ocean. It may be useful in building simple tools.',
  }),
  shoalshell: Treasure({
    label: 'Shoal Shell',
    description: 'A small shell from the ocean. It may be useful in building simple tools.',
  }),
  strangesouvenir: assert<Souvenir>({
    label: 'Strange Souvenir', category: 'treasure',
    description: 'An odd trinket. Why is it here? Save this for later!',
    functional: true, isSouvenir: true, buy: 0, sell: 0,
  }),
  soot: assert<Souvenir>({
    label: 'Soot', category: 'treasure',
    description: 'Ashes to ashes, dust to dust.',
    isSouvenir: true, buy: 0, sell: 0,
  }),
  reliccopper: Treasure({
    label: 'Relic Copper',
    description: 'An old copper coin. It is very valuable.',
  }),
  relicsilver: Treasure({
    label: 'Relic Silver',
    description: 'An old silver coin. It is highly valuable.',
  }),
  relicgold: Treasure({
    label: 'Relic Gold',
    description: 'An old gold coin. It is extremely valuable.',
  }),
  relicvase: Treasure({
    label: 'Relic Vase',
    description: 'An old vase from an ancient civilization. Wow it is valuable.',
    sell: 40,
  }),
  relicband: Treasure({
    label: 'Relic Band',
    description: 'A bracelet from an ancient civilization. Wow it is valuable.',
    sell: 60,
  }),
  relicstatue: Treasure({
    label: 'Relic Statue',
    description: 'A statue from an ancient civilization. Does it kinda look like you?',
    sell: 80,
  }),
  reliccrown: Treasure({
    label: 'Relic Crown',
    description: "A crown from an ancient civilization. Sadly it doesn't fit.",
    sell: 100,
  }),
  zygardecell: assert<Souvenir>({
    label: 'Zygarde Cell', category: 'treasure',
    description: 'A strange lifeforms. It is looking at me.',
      buy: 0, sell: 0, isSouvenir: true,
  }),
  wisp: assert<Souvenir>({
    label: 'Wisp', category: 'treasure',
    description: 'A purple-ish ball of light that is attracted to a keystone.',
      buy: 0, sell: 0, isSouvenir: true,
  }),
  pinknectar: assert<Souvenir>({
    label: 'Pink Nectar', category: 'treasure',
    description: 'The pollen from a pink flower that a Pokémon loves. It smells like a rose.',
      buy: 0, sell: 0, isSouvenir: true, functional: true,
  }),
  purplenectar: assert<Souvenir>({
    label: 'Purple Nectar', category: 'treasure',
    description: 'The pollen from a purple flower that a Pokémon loves. It smells like grapes.',
      buy: 0, sell: 0, isSouvenir: true, functional: true,
  }),
  rednectar: assert<Souvenir>({
    label: 'Red Nectar', category: 'treasure',
    description: 'The pollen from a red flower that a Pokémon loves. It smells like fruit punch.',
      buy: 0, sell: 0, isSouvenir: true, functional: true,
  }),
  yellownectar: assert<Souvenir>({
    label: 'Yellow Nectar', category: 'treasure',
    description: 'The pollen from a yellow flower that a Pokémon loves. It smells citrusy.',
    buy: 0, sell: 0, isSouvenir: true, functional: true,
  }),
  meltancandy:{
    label: 'Meltan Candy', category: 'treasure',
    description: 'A colorful block of metal that Meltan might drop. You SHOULD NOT eat it.',
    buy: 0, sell: 0, functional: true,
  },
  pokeshidoll: {
    label: 'Pokéshi Doll', category: 'treasure',
    description: 'A piece of wood whittled down to resemble a Pokémon. People might be interested in buying it.',
    buy: 0, sell: 8,
  },
  gimmighoulcoin: assert<Souvenir>({
    label: 'Gimmighoul Coin', category: 'treasure',
    description: 'A strange coin dropped by a small Pokémon. What currency is this used for?',
    buy: 0, sell: 0, isSouvenir: true, functional: true,
  }),
  gimmighoulbill: assert<Item>({
    label: 'Gimmighoul Bill', category: 'treasure',
    description: 'A bag of coins dropped by a small Pokémon. What currency is this used for?',
    buy: 0, sell: 5, direct: true,
  }),
  mysteriousshards: Treasure({
    label: 'Mysterious Shard (Small)',
    description: 'A small mysterious shard with a faint glow.',
    sell: 0,
  }),
  mysteriousshardl: Treasure({
    label: 'Mysterious Shard (Large)',
    description: 'A large mysterious shard with a fascinating glow.',
    sell: 0,
  }),
  seedofmastery: Treasure({
    label: 'Seed of Mastery',
    description: `A rare seed from the Hisui region. You can't do much with it, but sells well among collectors.`,
    sell: 15,
  }),
  tinybambooshoot: Treasure({
    label: 'Tiny Bamboo Shoot',
    description: 'A rare shoot from a bamboo plant. It is valuable amongst gourmands.',
    sell: 6,
  }),
  bigbambooshoot: Treasure({
    label: 'Big Bamboo Shoot',
    description: 'A large shoot from a bamboo plant. It is valuable amongst gourmands.',
    sell: 12,
  }),
  slategb: Slate({
    label: 'Kantonian Slate',
    description: 'An old slate sealed with three colors'
  }),
  slategbc: Slate({
    label: 'Johtonian Slate',
    description: 'An old state sealed with three metals'
  }),
  slategba: Slate({
    label: 'Discovery Slate',
    description: 'An old slate sealed with three materials'
  }),
  slaters: Slate({
    label: 'Soul Slate',
    description: 'An old slate sealed with rubies and sapphires'
  }),
  slatemewtwo: Slate({
    label: 'Genome Slate',
    description: 'An old slate that has been imbued with a strange energy'
  }),
  slatelugia: Slate({
    label: 'Squall Slate',
    description: 'An old slate weathered by rain'
  }),
  slatehooh: Slate({
    label: 'Rainbow Slate',
    description: 'An old slate with a rainbow shimmer'
  }),
  slatekyogre: Slate({
    label: 'Oceanic Slate',
    description: 'An old slate found at the bottom of the sea'
  }),
  slategroudon: Slate({
    label: 'Tectonic Slate',
    description: 'An old slate dug up from the earth core'
  }),
  slaterayquaza: Slate({
    label: 'Stratospheric Slate',
    description: 'An old slate that may have come from space'
  }),
  slategiratina: Slate({
    label: 'Distortion Slate',
    description: 'An old slate from a world unlike our own'
  }),
  armorite: Treasure({
    label: 'Armorite Ore',
    description: 'Ore that comes from the northeastern region of Galar. Some collectors will pay a lot for it.'
  }),
  dynite: Treasure({
    label: 'Dynite Ore',
    description: 'Ore that comes from the southern region of Galar. Some collectors will pay a lot for it.'
  }),
  ruinousstakenw: assert<Souvenir>({
    label: 'Northwestern Ruinous Stake',
    description: 'A strange stake found buried in the earth. It has an eerie green glow.',
    category: 'treasure', buy: 0, sell: 1, isSouvenir: true,
  }),
  ruinousstakene: assert<Souvenir>({
    label: 'Northeastern Ruinous Stake',
    description: 'A strange stake found buried in the earth. It has a sinister blue glow.',
    category: 'treasure', buy: 0, sell: 1, isSouvenir: true,
  }),
  ruinousstakese: assert<Souvenir>({
    label: 'Southeastern Ruinous Stake',
    description: 'A strange stake found buried in the earth. It has a foreboding purple glow.',
    category: 'treasure', buy: 0, sell: 1, isSouvenir: true,
  }),
  ruinousstakesw: assert<Souvenir>({
    label: 'Southwestern Ruinous Stake',
    description: 'A strange stake found buried in the earth. It has a sickly orange glow.',
    category: 'treasure', buy: 0, sell: 1, isSouvenir: true,
  }),
}

const ITEMS_HOLD = {
  kingsrock: {
    label: `King's Rock`,
    category: 'hold',
    description: 'An item to be held by a Pokémon. It increases the odds of flinching.',
    buy: 0, sell: 21,
    battle: true, 
  },
  metalcoat: {
    label: 'Metal Coat',
    category: 'hold',
    description: 'An item to be held by a Pokémon. It increases damage done by Steel-type attacks.',
    buy: 0, sell: 21,
    battle: true, 
  },
  dragonscale: {
    label: 'Dragon Scale',
    category: 'hold',
    description: 'A scaly item that is enjoyed by certain Pokémon.',
    buy: 0, sell: 42,
  },
  upgrade: {
    label: 'Upgrade',
    category: 'hold',
    description: 'A software update that is enjoyed by certain Pokémon.',
    buy: 0, sell: 42,
  },
  deepseatooth: {
    label: 'Deep Sea Tooth',
    category: 'hold',
    description: 'A large sharp tooth from the ocean depths. A certain Pokémon enjoys holding it.',
    buy: 0, sell: 10,
    battle: true, 
  },
  deepseascale: {
    label: 'Deep Sea Scale',
    category: 'hold',
    description: 'A rough scale from the ocean depths. A certain Pokémon enjoys holding it.',
    buy: 0, sell: 10,
    battle: true, 
  },
  reapercloth: {
    label: 'Reaper Cloth',
    category: 'hold',
    description: `A shredded piece of cloth that gives off bad vibes. A certain Pokémon seems to enjoy it, oddly enough.`,
    buy: 0, sell: 10,
  },
  razorfang: {
    label: 'Razor Fang',
    category: 'hold',
    description: 'A sharp fang that a certain Pokémon enjoys. It boosts the chance of flinching if held.',
    buy: 0, sell: 10,
    battle: true, 
    functional: true,
  },
  razorclaw: {
    label: 'Razor Claw',
    category: 'hold',
    description: 'A hooked claw that a certain Pokémon enjoys. It boosts the chance of critical hits if held.',
    buy: 0, sell: 10,
    battle: true, 
    functional: true,
  },
  protector: {
    label: 'Protector',
    category: 'hold',
    description: 'A protective item that a certain Pokémon enjoys.',
    buy: 0, sell: 12,
  },
  dubiousdisc: {
    label: 'Dubious Disc',
    category: 'hold',
    description: 'A clear disc that contains malware. A certain Pokémon enjoys it.',
    buy: 0, sell: 12,
  },
  electirizer: {
    label: 'Electirizer',
    category: 'hold',
    description: 'A box that contains high voltage. A certain Pokémon enjoys it.',
    buy: 0, sell: 12,
  },
  magmarizer: {
    label: 'Magmarizer',
    category: 'hold',
    description: 'A box that contains a boiling furnace. A certain Pokémon enjoys it.',
    buy: 0, sell: 12,
  },
  seaincense: {
    label: 'Sea Incense',
    category: 'hold',
    description: 'An item that may be held. Its aroma boosts the power of Water-type attacks.',
    buy: 0, sell: 12,
    battle: true, daycare: true,
  },
  laxincense: {
    label: 'Lax Incense',
    category: 'hold',
    description: 'An item that may be held. Its aroma can cause the accuracy of moves to reduce.',
    buy: 0, sell: 12,
    battle: true, daycare: true,
  },
  rockincense: {
    label: 'Rock Incense',
    category: 'hold',
    description: 'An item that may be held. Its aroma boosts the power of Rock-type moves.',
    buy: 0, sell: 12,
    battle: true, daycare: true,
  },
  oddincense: {
    label: 'Odd Incense',
    category: 'hold',
    description: 'An item that may be held. Its aroma boosts the power of Psychic-type moves.',
    buy: 0, sell: 12,
    battle: true, daycare: true,
  },
  fullincense: {
    label: 'Full Incense',
    category: 'hold',
    description: 'An item that may be held. Its aroma makes the holder bloated and slow moving.',
    buy: 0, sell: 12,
    battle: true, daycare: true,
  },
  roseincense: {
    label: 'Rose Incense',
    category: 'hold',
    description: 'An item that may be held. Its aroma boosts the power of Grass-type moves.',
    buy: 0, sell: 12,
    battle: true, daycare: true,
  },
  pureincense: {
    label: 'Pure Incense',
    category: 'hold',
    // In video games it repels Pokémon. Can this effect be implemented here?
    description: 'An item that may be held. Its aroma is sweet.',
    buy: 0, sell: 12,
     daycare: true,
  },
  luckincense: {
    label: 'Luck Incense',
    category: 'hold',
    // May one day have something to do with amulet coin?
    description: 'An item that may be held. Its aroma is citrusy.',
    buy: 0, sell: 12,
    daycare: true,
  },
  waveincense: {
    label: 'Wave Incense',
    category: 'hold',
    description: 'An item to be held. Its aroma boosts the power of Water-type moves.',
    buy: 0, sell: 12,
    battle: true, daycare: true,
  },
  sachet: {
    label: 'Sachet', category: 'hold',
    description: 'A container for a perfume. A certain Pokémon enjoys the scent.',
    buy: 0, sell: 10,  
  },
  whippeddream: {
    label: 'Whipped Dream', category: 'hold',
    description: 'A sweet dairy treat that a certain Pokémon enjoys.',
    buy: 0, sell: 10,  
  },
}

const APRICORN = (color: string, scent: string): Berry => {
  return {
    label: `${color.substring(0, 1).toUpperCase()}${color.substring(1)} Apricorn`,
    category: 'material',
    description: `A ${color} Apricorn. It ${scent}.`,
    buy: 0, sell: 4,
    growTime: 96, yield: {min: 2, max: 5},
  }
}

const ITEMS_OTHER = {
  firestone: {
    label: 'Fire Stone',
    category: 'items',
    description: 'A fiery red stone that has a strange effect on certain Pokémon.',
    buy: 24, sell: 6,
    daycare: true,
    functional: true,
  },
  leafstone: {
    label: 'Leaf Stone',
    category: 'items',
    description: 'An organic green stone that has a strange effect on certain Pokémon.',
    buy: 24, sell: 6,
    functional: true,
  },
  moonstone: {
    label: 'Moon Stone',
    category: 'items',
    description: 'A lunar gray stone that has a strange effect on certain Pokémon.',
    buy: 24, sell: 6,
    functional: true,
  },
  sunstone: {
    label: 'Sun Stone',
    category: 'items',
    description: 'A bright orange stone that has a strange effect on certain Pokémon.',
    buy: 24, sell: 6,
    daycare: true,
    functional: true,
  },
  thunderstone: {
    label: 'Thunder Stone',
    category: 'items',
    description: 'A highly-charged yellow stone that has a strange effect on certain Pokémon.',
    buy: 24, sell: 6,
    functional: true,
  },
  waterstone: {
    label: 'Water Stone',
    category: 'items',
    description: 'A moist blue stone that has a strange effect on certain Pokémon.',
    buy: 24, sell: 6,
    functional: true,
  },
  everstone: {
    label: 'Everstone',
    category: 'items',
    description: 'A dull stone that prevents evolution in the Pokémon holding it.',
    buy: 6, sell: 6,
    daycare: true,
  },
  duskstone: {
    label: 'Dusk Stone',
    category: 'items',
    description: 'A dark stone that has a duskly effect on certain Pokémon.',
    buy: 0, sell: 6,
    functional: true,
  },
  shinystone: {
    label: 'Shiny Stone',
    category: 'items',
    description: 'A bright stone that has a bright effect on certain Pokémon.',
    buy: 0, sell: 6,
    functional: true,
  },
  dawnstone: {
    label: 'Dawn Stone',
    category: 'items',
    description: 'A vivid stone that has a novel effect on certain Pokémon.',
    buy: 0, sell: 6,
    functional: true,
  },
  icestone: {
    label: 'Ice Stone',
    category: 'items',
    description: 'A stone cold to the touch. It has a bone-chilling effect on certain Pokémon.',
    buy: 0, sell: 6,
    functional: true,
  },
  ovalstone: {
    label: 'Oval Stone',
    category: 'items',
    description: 'A stone that looks like an egg. A certain Pokémon enjoys carrying it around.',
    buy: 0, sell: 4,
    functional: true,
  },
  prismscale: {
    label: 'Prism Scale',
    category: 'items',
    description: 'A scale in an assortment of colors that is enjoyed by a certain Pokémon.',
    buy: 0, sell: 10,
    functional: true,
  },
  bluepokeblock: assert<Bait>({
    label: 'Blue PokéBlock',
    category: 'items',
    description: 'A fruit snack that enhances beauty.',
    buy: 0, sell: 5,
    functional: true, consumption: 1,
  }),
  greenpokeblock: assert<Bait>({
    label: 'Green PokéBlock',
    category: 'items',
    description: 'A fruit snack that enhances cleverness.',
    buy: 0, sell: 5,
    functional: true, consumption: 1,
  }),
  pinkpokeblock: assert<Bait>({
    label: 'Pink PokéBlock',
    category: 'items',
    description: 'A fruit snack that enhances cuteness.',
    buy: 0, sell: 5,
    functional: true, consumption: 1,
  }),
  redpokeblock: assert<Bait>({
    label: 'Red PokéBlock',
    category: 'items',
    description: 'A fruit snack that enhances coolness.',
    buy: 0, sell: 5,
    functional: true, consumption: 1,
  }),
  yellowpokeblock: assert<Bait>({
    label: 'Yellow PokéBlock',
    category: 'items',
    description: 'A fruit snack that enhances toughness.',
    buy: 0, sell: 5,
    functional: true, consumption: 1,
  }),
  carbos: {
    label: 'Carbos',
    category: 'items',
    description: 'A vitamin that increases the speed of a Pokémon.',
    buy: 0, sell: 3,
    functional: true,
  },
  protein: {
    label: 'Protein',
    category: 'items',
    description: 'A vitamin that increases the attack of a Pokémon.',
    buy: 0, sell: 3,
    functional: true,
  },
  iron: {
    label: 'Iron',
    category: 'items',
    description: 'A vitamin that increases the defense of a Pokémon.',
    buy: 0, sell: 3,
    functional: true,
  },
  raidpass: {
    label: 'Raid Pass',
    category: 'items',
    description: 'A ticket that grants a player access to a raid. Some raids may require several.',
    buy: 150, sell: 0,
  },
  wishingpiece: {
    label: 'Wishing Piece',
    category: 'items',
    description: 'An unusual stone that can cause a raid to begin or cause a new raid boss to appear.',
    buy: 75, sell: 1,
  },
  expcandyxs: {
    label: 'Exp. Candy XS',
    category: 'items',
    description: 'A sweet treat that has a tiny chance of a Pokémon evolving.',
    buy: 0, sell: 1,
    daycare: true,
    functional: true,
  },
  expcandys: {
    label: 'Exp. Candy S',
    category: 'items',
    description: 'A sweet treat that has a small chance of a Pokémon evolving.',
    buy: 0, sell: 2,
    daycare: true,
    functional: true,
  },
  expcandym: {
    label: 'Exp. Candy M',
    category: 'items',
    description: 'A sweet treat that has a fair chance of a Pokémon evolving.',
    buy: 0, sell: 4,
    daycare: true,
    functional: true,
  },
  expcandyl: {
    label: 'Exp. Candy L',
    category: 'items',
    description: 'A sweet treat that has a good chance of a Pokémon evolving.',
    buy: 0, sell: 6,
    daycare: true,
    functional: true,
  },
  expcandyxl: {
    label: 'Exp. Candy XL',
    category: 'items',
    description: 'A sweet treat that has a great chance of a Pokémon evolving.',
    buy: 0, sell: 8,
    daycare: true,
    functional: true,
  },
  rarecandy: {
    label: 'Rare Candy',
    category: 'items',
    description: 'A sweet treat that has a guaranteed chance of a Pokémon evolving.',
    buy: 0, sell: 12,
    daycare: true,
    functional: true,
  },
  blueflute: {
    label: 'Blue Flute', category: 'items',
    description: 'A reed with a soprano sound that wakes one from sleep.',
    buy: 0, sell: 0,   functional: false,
  },
  redflute: {
    label: 'Red Flute', category: 'items',
    description: 'A reed with an alto sound that snaps one out of infatuation.',
    buy: 0, sell: 0,   functional: false,
  },
  yellowflute: {
    label: 'Yellow Flute', category: 'items',
    description: 'A reed with a tenor sound that prevents confusion.',
    buy: 0, sell: 0,   functional: false,
  },
  whiteflute: {
    label: 'White Flute', category: 'items',
    description: 'A reed with a bass sound.',
    buy: 0, sell: 0,   functional: false,
  },
  blackflute: {
    label: 'Black Flute', category: 'items',
    description: 'A reed with a baritone sound.',
    buy: 0, sell: 0,   functional: false,
  },
  trimheart: {
    label: 'Heart Grooming Kit', category: 'items',
    description: 'A small kit including scissors, hair dye, and a beauty manual.',
    buy: 0, sell: 5, functional: true,
  },
  trimstar: {
    label: 'Star Grooming Kit', category: 'items',
    description: 'A small kit including scissors, hair dye, and a beauty manual.',
    buy: 0, sell: 5, functional: true,
  },
  trimdiamond: {
    label: 'Diamond Grooming Kit', category: 'items',
    description: 'A small kit including scissors, hair dye, and a beauty manual.',
    buy: 0, sell: 5, functional: true,
  },
  trimdeputante: {
    label: 'Debutante Grooming Kit', category: 'items',
    description: 'A small kit including scissors, hair dye, and a beauty manual.',
    buy: 0, sell: 5, functional: true,
  },
  trimmatron: {
    label: 'Matron Grooming Kit', category: 'items',
    description: 'A small kit including scissors, hair dye, and a beauty manual.',
    buy: 0, sell: 5, functional: true,
  },
  trimdandy: {
    label: 'Dandy Grooming Kit', category: 'items',
    description: 'A small kit including scissors, hair dye, and a beauty manual.',
    buy: 0, sell: 5, functional: true,
  },
  trimlareine: {
    label: 'LaReine Grooming Kit', category: 'items',
    description: 'A small kit including scissors, hair dye, and a beauty manual.',
    buy: 0, sell: 5, functional: true,
  },
  trimkabuki: {
    label: 'Kabuki Grooming Kit', category: 'items',
    description: 'A small kit including scissors, hair dye, and a beauty manual.',
    buy: 0, sell: 5, functional: true,
  },
  trimpharaoh: {
    label: 'Pharaoh Grooming Kit', category: 'items',
    description: 'A small kit including scissors, hair dye, and a beauty manual.',
    buy: 0, sell: 5, functional: true,
  },
  trimnatural: {
    label: 'Natural Grooming Kit', category: 'items',
    description: 'A small kit including scissors and a beauty manual.',
    buy: 0, sell: 5, functional: true,
  },
  blackaugurite: {
    label: 'Black Augurite', category: 'items',
    description: 'A dark-colored mineral that a certain Pokémon finds very enticing.',
    buy: 0, sell: 12, functional: true,
  },
  linkingcord: Placeholder({label: 'Linking Cord'}),
  peatblock: {
    label: 'Peat Block', category: 'items',
    description: 'A block of moss recovered at the bottom of a swamp. It seems to be glowing slightly. A certain Pokémon finds it very enticing when the moon is full.',
    buy: 0, sell: 12, functional: true,
  },
  abilitycapsule: {
    label: 'Ability Capsule', category: 'items',
    description: 'An item that brings out the ability of certain Pokémon.',
    buy: 0, sell: 10, functional: true,
  },
  energypowder: {
    label: 'Energy Powder', category: 'items',
    description: 'A bitter medicine that can only be uesd outside of battle. Pokémon do not like the taste.',
    buy: 0, sell: 2, functional: true,
  },
  healpowder: {
    label: 'Heal Powder', category: 'items',
    description: 'A bitter medicine that can only be uesd outside of battle. Pokémon do not like the taste.',
    buy: 0, sell: 2, functional: true,
  },
  energyroot: {
    label: 'Energy Root', category: 'items',
    description: 'A bitter medicine that can only be uesd outside of battle. Pokémon do not like the taste.',
    buy: 0, sell: 3, functional: true,
  },
  revivalherb: {
    label: 'Revival Herb', category: 'items',
    description: 'A bitter medicine that can only be uesd outside of battle. Pokémon do not like the taste.',
    buy: 0, sell: 3, functional: true,
  },
  sweetapple: {
    label: 'Sweet Apple', category: 'items',
    description: 'A sweet and nutritious fruit. When Applin nibbles on it, something unexpected happens.',
    buy: 0, sell: 8, functional: true,
  },
  tartapple: {
    label: 'Tart Apple', category: 'items',
    description: 'A tart and mealy fruit. When Applin nibbles on it, something unexpected happens.',
    buy: 0, sell: 8, functional: true,
  },
  chippedpot: {
    label: 'Chipped Pot', category: 'items',
    description: 'An antique pot in remarkable condition with a small chip in its side. A certain Pokémon may find it a suitable home',
    buy: 0, sell: 16, functional: true,
  },
  crackedpot: {
    label: 'Cracked Pot', category: 'items',
    description: 'An antique pot with a sizable crack in its side. Still, a certain Pokémon may find it a suitable home',
    buy: 0, sell: 16, functional: true,
  },
  sweetlove: {
    label: 'Love Sweet', category: 'items',
    description: 'A piece of sugary candy molded into a heart. When Milcery grabs it, things may spin out of control.',
    buy: 0, sell: 4, functional: true,
  },
  sweetberry: {
    label: 'Berry Sweet', category: 'items',
    description: 'A piece of sugary candy molded into a blue berry. When Milcery grabs it, things may spin out of control.',
    buy: 0, sell: 4, functional: true,
  },
  sweetclover: {
    label: 'Clover Sweet', category: 'items',
    description: 'A piece of sugary candy molded into a four-leaf clover. When Milcery grabs it, things may spin out of control.',
    buy: 0, sell: 4, functional: true,
  },
  sweetflower: {
    label: 'Flower Sweet', category: 'items',
    description: 'A piece of sugary candy molded into a flower. When Milcery grabs it, things may spin out of control.',
    buy: 0, sell: 4, functional: true,
  },
  sweetribbon: {
    label: 'Ribbon Sweet', category: 'items',
    description: 'A rare piece of sugary candy molded into a bow. When Milcery grabs it, things may spin out of control.',
    buy: 0, sell: 6, functional: true,
  },
  sweetstar: {
    label: 'Star Sweet', category: 'items',
    description: 'A piece of sugary candy molded into a gold star. When Milcery grabs it, things may spin out of control.',
    buy: 0, sell: 4, functional: true,
  },
  sweetstrawberry: {
    label: 'Strawberry Sweet', category: 'items',
    description: 'A piece of sugary candy molded into a strawberry. When Milcery grabs it, things may spin out of control.',
    buy: 0, sell: 4, functional: true,
  },
  galaricatwig: {
    label: 'Galarica Twig', category: 'items',
    description: 'A small stick with a pretty flower at the end. They are fun to collect',
    buy: 0, sell: 2,
  },
  galaricacuff: {
    label: 'Galarica Cuff', category: 'items',
    description: 'A bracelet made of flowers and twigs. When around the arm of a certain Pokémon, something unexpected happens.',
    buy: 0, sell: 8, functional: true,
  },
  galaricawreath: {
    label: 'Galarica Wreath', category: 'items',
    description: 'A crown made of flowers and twigs. When on the head of a certain Pokémon, something unexpected happens.',
    buy: 0, sell: 8, functional: true,
  },
  scrollofdarkness: {
    label: 'Scroll of Darkness', category: 'items',
    description: 'A scroll written in a foreign script about the path of darkness. A certain Pokémon will enjoy reading it.',
    buy: 0, sell: 25, functional: true,
  },
  scrollofwaters: {
    label: 'Scroll of Waters', category: 'items',
    description: 'A scroll written in a foreign script about the path of the sea. A certain Pokémon will enjoy reading it.',
    buy: 0, sell: 25, functional: true,
  },
  leaderscrest: {
    label: "Leader's Crest", category: 'items',
    description: 'A rusted blade signaling ones prestige. Bisharp are eager to obtain one.',
    buy: 0, sell: 10, functional: true,
  },
  auspiciousarmor: {
    label: 'Auspicious Armor', category: 'items',
    description: 'The armor once worn by an auspicious hero. A certain Pokémon is eager to don it.',
    buy: 0, sell: 6, functional: true,
  },
  maliciousarmor: {
    label: 'Malicious Armor', category: 'items',
    description: 'The armor once worn by a malicious antagonist. A certain Pokémon is eager to don it.',
    buy: 0, sell: 6, functional: true,
  },
  syrupyapple: {
    label: 'Syrupy Apple', category: 'items',
    description: 'An apple oozing in caramel. Be careful when picking up! A certain Pokémon is eager to eat it.',
    buy: 0, sell: 3,
  },
  teacupunremarkable: {
    label: 'Unremarkable Teacup', category: 'items',
    description: 'A rudimentary teacup mass produced and sold around the world. Tea, or a certain Pokémon, can go inside.',
    buy: 0, sell: 4,
  },
  teacupmasterpiece: {
    label: 'Masterpiece Teacup', category: 'items',
    description: 'A well-crafted artisnal teacup which is one-of-a-kind. Tea, or a certain Pokémon, can go inside.',
    buy: 0, sell: 17,
  },
  metalalloy: {
    label: 'Metal Alloy', category: 'items',
    description: 'A piece of fused metal with all kinds of elements baked in. A certain Pokémon will appreciate it.',
    buy: 0, sell: 0,
  },
}

const BERRY_SIMPLE = (label, description, battle = true, functional = false): Berry => {
  return {
    label, category: 'berry',
    description,
    buy: 8, sell: 4,
    battle, functional,
    growTime: 36, yield: {min: 4, max: 10},
  }
}

const BERRY_TYPE = (label: string, type: Type): Berry => {
  return {
    label,
    category: 'berry',
    description: `A berry that reduces the damage done by a ${type}-Type move once.`,
    buy: 0, sell: 5,
    battle: true, 
    growTime: 48, yield: {min: 2, max: 6},
  }
}

const BERRY_PINCH = (label: string, type: string): Berry => {
  return {
    label,
    category: 'berry',
    description: `A berry that raises the ${type} stat in a pinch.`,
    buy: 0, sell: 6,
    battle: true, 
    growTime: 96, yield: {min: 4, max: 10},
  }
}

const BERRY_FRIENDSHIP = (label): Berry => {
  return {
    label, category: 'berry',
    description: 'A berry that improves the bond between trainer and Pokémon.',
    battle: true, 
    buy: 10, sell: 5,
    functional: true,
    growTime: 48, yield: {min: 5, max: 14},
  }
}

const BERRY_TREASURE = (label): Berry => {
  return {
    label, category: 'berry',
    description: 'A rare berry.',
    buy: 0, sell: 8,
    functional: false,
    growTime: 72, yield: {min: 2, max: 5},
  }
}

const BERRY_TREASURE2 = (label, functional = false): Berry => {
  return {
    label, category: 'berry',
    description: 'A very rare berry.',
    buy: 0, sell: 10,
    functional,
    growTime: 96, yield: {min: 2, max: 5},
  }
}

const ITEMS_BERRIES = {
  oran: BERRY_SIMPLE('Oran Berry', 'A berry that heals some health in a pinch.', true, true),
  aspear: BERRY_SIMPLE('Aspear Berry', 'A berry that treats freezing when eaten.'),
  cheri: BERRY_SIMPLE('Cheri Berry', 'A berry that treats paralysis when eaten.'),
  rawst: BERRY_SIMPLE('Rawst Berry', 'A berry that treats burns when eaten.'),
  chesto: BERRY_SIMPLE('Chesto Berry', 'A berry that treats sleep when eaten.'),
  lum: BERRY_SIMPLE('Lum Berry', 'A berry that heals any status condition when eaten.'),
  pecha: BERRY_SIMPLE('Pecha Berry', 'A berry that treats poison when eaten.'), 
  leppa: BERRY_SIMPLE('Leppa Berry', 'A berry that admittedly does not really do anything when eaten.', false),
  persim: BERRY_SIMPLE('Persim Berry', 'A berry that treats confusion when eaten.'),
  pomeg: BERRY_FRIENDSHIP('Pomeg Berry'),
  kelpsy: BERRY_FRIENDSHIP('Kelpsy Berry'),
  sitrus: assert<Berry>({
    label: 'Sitrus Berry', category: 'berry',
    description: 'A berry that heals health in a pinch.',
    buy: 10, sell: 5,
    battle: true, 
    growTime: 48, yield: {min: 5, max: 15},
  }),
  figy: assert<Berry>({
    label: 'Figy Berry', category: 'berry',
    description: 'A berry that can be held which greatly heals in a pinch. However, it will cause confusion.',
    buy: 10, sell: 5,
    battle: true, 
    growTime: 36, yield: {min: 3, max: 9},
  }),
  chilan: BERRY_TYPE('Chilan Berry', 'Normal'),
  wacan: BERRY_TYPE('Wacan Berry', 'Electric'),
  passho: BERRY_TYPE('Passho Berry', 'Water'),
  occa: BERRY_TYPE('Occa Berry', 'Fire'),
  rindo: BERRY_TYPE('Rindo Berry', 'Grass'),
  yache: BERRY_TYPE('Yache Berry', 'Ice'),
  chople: BERRY_TYPE('Chople Berry', 'Fighting'),
  kebia: BERRY_TYPE('Kebia Berry', 'Poison'),
  shuca: BERRY_TYPE('Shuca Berry', 'Ground'),
  coba: BERRY_TYPE('Coba Berry', 'Flying'),
  payapa: BERRY_TYPE('Payapa Berry', 'Psychic'),
  tanga: BERRY_TYPE('Tanga Berry', 'Bug'),
  charti: BERRY_TYPE('Charti Berry', 'Rock'),
  kasib: BERRY_TYPE('Kasib Berry', 'Ghost'),
  haban: BERRY_TYPE('Haban Berry', 'Dragon'),
  colbur: BERRY_TYPE('Colbur Berry', 'Dark'),
  babiri: BERRY_TYPE('Babiri Berry', 'Steel'),
  liechi: BERRY_PINCH('Liechi Berry', 'Attack'),
  ganlon: BERRY_PINCH('Ganlon Berry', 'Defense'),
  salac: BERRY_PINCH('Salac Berry', 'Speed'),
  petaya: BERRY_PINCH('Petaya Berry', 'Special Attack'),
  apicot: BERRY_PINCH('Apicot Berry', 'Special Defense'),
  lansat: BERRY_PINCH('Lansat Berry', 'Critical-Hit Ratio'),
  starf: BERRY_PINCH('Starf Berry', 'Randomly-Picked'),
  enigma: assert<Berry>({
    label: 'Enigma Berry', category: 'berry',
    description: 'A berry that can be held which greatly heals when hit by a Super-Effective move.',
    buy: 0, sell: 8,
    battle: true, 
    growTime: 48, yield: {min: 2, max: 4},
  }),
  micle: BERRY_PINCH('Micle Berry', 'Randomly-Picked'),
  cutsap: BERRY_PINCH('Custap Berry', 'Priority'),
  roseli: BERRY_TYPE('Roseli Berry', 'Fairy'),
  jaboca: assert<Berry>({
    label: 'Jaboca Berry', category: 'berry',
    description: 'A berry that will hurt the attacker if they use a physical move.',
    buy: 0, sell: 8,
    battle: true, 
    growTime: 48, yield: {min: 2, max: 4},
  }),
  rowap: assert<Berry>({
    label: 'Rowap Berry', category: 'berry',
    description: 'A berry that will hurt the attacker if they use a special move.',
    buy: 0, sell: 8,
    battle: true, 
    growTime: 48, yield: {min: 2, max: 4},
  }),
  belue: BERRY_TREASURE('Belue Berry'),
  bluk: BERRY_TREASURE('Bluk Berry'),
  cornn: BERRY_TREASURE('Cornn Berry'),
  durin: BERRY_TREASURE('Durin Berry'),
  magost: BERRY_TREASURE('Magost Berry'),
  nanab: BERRY_TREASURE('Nanab Berry'),
  nomel: BERRY_TREASURE('Nomel Berry'),
  pamtre: BERRY_TREASURE('Pamtre Berry'),
  pinap: BERRY_TREASURE('Pinap Berry'),
  rabuta: BERRY_TREASURE('Rabuta Berry'),
  razz: BERRY_TREASURE('Razz Berry'),
  spelon: BERRY_TREASURE('Spelon Berry'),
  watmel: BERRY_TREASURE('Watmel Berry'),
  wepear: BERRY_TREASURE('Wepear Berry'),
  kee: BERRY_TREASURE2('Kee Berry'),
  maranga: BERRY_TREASURE2('Maranga Berry'),
  aguav: BERRY_TREASURE2('Aguav Berry'),
  grepa: BERRY_TREASURE2('Grepa Berry', true),
  hondew: BERRY_TREASURE2('Hondew Berry', true),
  iapapa: BERRY_TREASURE2('Iapapa Berry'),
  mago: BERRY_TREASURE2('Mago Berry'),
  qualot: BERRY_TREASURE2('Qualot Berry', true),
  tamato: BERRY_TREASURE2('Tamato Berry', true),
  wiki: BERRY_TREASURE2('Wiki Berry'),
  hopo: BERRY_TREASURE('Hopo Berry'), // PLA berry
}

export type BerryId = keyof typeof ITEMS_BERRIES;

const ITEMS_FERTILIZER = {
  growthmulch: assert<Item>({
    label: 'Growth Mulch', category: 'fertilizer',
    description: 'A mulch that decreases growth time and yield',
    buy: 3, sell: 1,
  }),
  dampmulch: assert<Item>({
    label: 'Damp Mulch', category: 'fertilizer',
    description: 'A mulch that increases growth time and yield',
    buy: 3, sell: 1,
  }),
  stablemulch: assert<Item>({
    label: 'Stable Mulch', category: 'fertilizer',
    description: 'A mulch that removes the chance of mutations',
    buy: 3, sell: 1,
  }),
  gooeymulch: assert<Item>({
    label: 'Gooey Mulch', category: 'fertilizer',
    description: 'A mulch that slightly increases mutation rate and yield',
    buy: 3, sell: 1,
  }),
  amazemulch: assert<Item>({
    label: 'Amaze Mulch', category: 'fertilizer',
    description: 'A mulch that doubles the chance of mutation',
    buy: 3, sell: 1,
  }),
  boostmulch: assert<Item>({
    label: 'Boost Mulch', category: 'fertilizer',
    description: 'A mulch that decreases growth time',
    buy: 3, sell: 1,
  }),
  richmulch: assert<Item>({
    label: 'Rich Mulch', category: 'fertilizer',
    description: 'A mulch that increases yield',
    buy: 3, sell: 1,
  }),
  surprisemulch: assert<Item>({
    label: 'Surprise Mulch', category: 'fertilizer',
    description: 'A mulch that guarantees mutations',
    buy: 3, sell: 1,
  }),
  honey: assert<Item>({
    label: 'Sweet Honey', category: 'fertilizer',
    description: 'A mulch that triples the chance of mutations',
    buy: 3, sell: 1,
  }),
  apricorncompost: assert<Item>({
    label: 'Apricorn Compost', category: 'fertilizer',
    description: 'A nutty compost that decreases the time and increases the yield for Apricorns',
    buy: 3, sell: 1,
  }),
  featheredmulch: assert<Item>({
    label: 'Feathered Mulch', category: 'fertilizer',
    description: 'A mulch that seems to have loose feathers. It increases growth time and yield.',
    buy: 3, sell: 1,
  }),
  classicmulch: assert<Item>({
    label: 'Classic Mulch', category: 'fertilizer',
    description: 'A mulch that smells unpleasant. It decreases growth time.',
    buy: 3, sell: 1,
  }),
  pokesnack: assert<Item>({
    label: 'Poké Snack', category: 'fertilizer',
    description: 'Shreds of food that increase yield slightly.',
    buy: 3, sell: 1,
  }),
  berrymulch: assert<Item>({
    label: 'Berry Mulch', category: 'fertilizer',
    description: 'A mulch made from berries that increases yield slightly.',
    buy: 3, sell: 1,
  }),
  pokebeans: assert<Item>({
    label: 'Beans', category: 'fertilizer',
    description: 'A mulch made of ground-up beans. It decreases growth time.',
    buy: 3, sell: 1,
  }),
  curryfertilizer: assert<Item>({
    label: 'Curry Fertilizer', category: 'fertilizer',
    description: 'A fertilizer made from the remnants of a Galarian dish. It increases growth yield.',
    buy: 3, sell: 1,
  }),
}

export type FertilizerId = keyof typeof ITEMS_FERTILIZER;

function MINT(nature: Nature): Berry {
  return {
    label: `${nature} Mint`,
    category: 'battle',
    buy: 0, sell: 6,
    description: `Leaves of a mint that, when consumed, will draw out a ${nature} nature.`,
    growTime: 96, yield: {min: 2, max: 5},
  }
}

const ITEMS_BATTLE = {
  blackbelt: HELD_TYPE_ITEM('Black Belt', 'Fighting'),
  blackglasses: HELD_TYPE_ITEM('Black Glasses', 'Dark'),
  dragonfang: HELD_TYPE_ITEM('Dragon Fang', 'Dragon'),
  hardstone: HELD_TYPE_ITEM('Hard Stone', 'Rock'),
  miracleseed: HELD_TYPE_ITEM('Miracle Seed', 'Grass'),
  mysticwater: HELD_TYPE_ITEM('Mystic Water', 'Water'),
  nevermeltice: HELD_TYPE_ITEM('Never-Melt Ice', 'Ice'),
  softsand: HELD_TYPE_ITEM('Soft Sand', 'Ground'),
  silkscarf: HELD_TYPE_ITEM('Silk Scarf', 'Normal'),
  silverpowder: HELD_TYPE_ITEM('Silver Powder', 'Bug'),
  spelltag: HELD_TYPE_ITEM('Spell Tag', 'Ghost'),
  charcoal: HELD_TYPE_ITEM('Charcoal', 'Fire'),
  magnet: HELD_TYPE_ITEM('Magnet', 'Electric'),
  poisonbarb: HELD_TYPE_ITEM('Poison Barb', 'Poison'),
  sharpbeak: HELD_TYPE_ITEM('Sharp Beak', 'Flying'),
  twistedspoon: HELD_TYPE_ITEM('Twisted Spoon', 'Psychic'),
  brightpowder: {
    label: 'Bright Powder',
    category: 'battle',
    description: 'A flashy powder that reduces the accuracy of moves against the Pokémon holding it.',
    buy: 18, sell: 9,
    battle: true, 
  },
  focusband: {
    label: 'Focus Band',
    category: 'battle',
    description: 'A band that Pokémon may hold in battle. It may prevent a Pokémon from fainting.',
    buy: 18, sell: 6,
    battle: true, 
  },
  luckypunch: {
    label: 'Lucky Punch',
    category: 'battle',
    description: 'An item to be held by Chansey. It increases the critical-hit ratio.',
    buy: 12, sell: 6,
    battle: true, 
  },
  thickclub: {
    label: 'Thick Club',
    category: 'battle',
    description: 'An item to be held by Cubone or Marowak. It increases its attack.',
    buy: 12, sell: 6,
    battle: true, 
  },
  leek: {
    label: 'Leek',
    category: 'battle',
    description: `An item to be held by Farfetch'd. It increases the critical-hit ratio.`,
    buy: 12, sell: 6,
    battle: true, 
  },
  metalpowder: {
    label: 'Metal Powder',
    category: 'battle',
    description: 'An item to be held by Ditto. It increases its bulkiness.',
    buy: 12, sell: 6,
    battle: true, 
  },
  lightball: {
    label: 'Light Ball',
    category: 'battle',
    description: 'An item to be held by Pikachu. It increases its power.',
    buy: 12, sell: 6,
    battle: true, 
  },
  leftovers: {
    label: 'Leftovers',
    category: 'battle',
    description: 'A small snack that periodically restores the health of a Pokémon',
    buy: 20, sell: 10,
    battle: true, functional: true,
  },
  quickclaw: {
    label: 'Quick Claw',
    category: 'battle',
    description: 'An item that may allow a Pokémon to move first in battle.',
    buy: 24, sell: 12,
    battle: true, 
  },
  scopelens: {
    label: 'Scope Lens',
    category: 'battle',
    description: 'A lens with a large zoom. It increases the likelihood of critical hits.',
    buy: 36, sell: 18,
    battle: true, 
  },
  amuletcoin: {
    label: 'Amulet Coin',
    category: 'battle',
    description: 'A lucky coin. It seems to allow you to earn more rewards.',
    buy: 36, sell: 18,
    battle: true, 
  },
  lifeorb: {
    label: 'Life Orb',
    category: 'battle',
    description: 'A mysterious orb that increases the power of moves, but exacts a cost each time.',
    buy: 36, sell: 18,
    battle: true, 
  },
  shellbell: {
    label: 'Shell Bell',
    category: 'battle',
    description: 'A bell that sounds like the ocean. It increases the health of a Pokémon after it uses a move.',
    buy: 0, sell: 5,
    battle: true, 
  },
  souldew: {
    label: 'Soul Dew',
    category: 'battle',
    description: 'An item to be held by Latias or Latios. It increases the power of their moves.',
    buy: 0, sell: 10,
    battle: true, 
  },
  widelens: {
    label: 'Wide Lens',
    category: 'battle',
    description: 'An item that boosts the accuracy of using moves when held.',
    buy: 36, sell: 18,
    battle: true, 
  },
  pewtercrunchies: {
    label: 'Pewter Crunchies',
    category: 'battle',
    description: 'A crunchy snack from Kanto that will heal the status condition when held.',
    buy: 4, sell: 2,
    battle: true, 
  },
  ragecandybar: {
    label: 'Rage Candy Bar',
    category: 'battle',
    description: 'A chocolate bar from Johto that will heal the status condition when held.',
    buy: 4, sell: 2,
    battle: true, 
  },
  lavacookie: {
    label: 'Lava Cookie',
    category: 'battle',
    description: 'A spicy baked good from Hoenn that will heal the status condition when held.',
    buy: 4, sell: 2,
    battle: true, 
  },
  oldgateau: {
    label: 'Old Gateau',
    category: 'battle',
    description: 'A sticky candy from Sinnoh that will heal the status condition when held.',
    buy: 4, sell: 2,
    battle: true, 
  },
  jubilifemuffin: {
    label: 'Jubilife Muffin',
    category: 'battle',
    description: 'A baked good from Sinnoh that will heal the status condition when held.',
    buy: 4, sell: 2,
    battle: true, functional: true,
  },
  casteliacone: {
    label: 'Castelia Cone',
    category: 'battle',
    description: 'A cold treat from Unova that will heal the status condition when held.',
    buy: 4, sell: 2,
    battle: true, 
  },
  shaloursable: {
    label: 'Shalour Sable',
    category: 'battle',
    description: 'A crunchy shortbread from a bakery in Kalos that will heal the status condition when held.',
    buy: 4, sell: 2,
    battle: true, 
  },
  lumiosegalette: {
    label: 'Lumiose Galette',
    category: 'battle',
    description: 'A fruit-filled pastry from a bakery in Kalos that will heal the status condition when held.',
    buy: 4, sell: 2,
    battle: true, 
  },
  bigmalasada: {
    label: 'Big Malasada',
    category: 'battle',
    description: 'A fried baked good from a bakery in Alola that will heal the status condition when held.',
    buy: 4, sell: 2,
    battle: true, 
  },
  choiceband: {
    label: 'Choice Band',
    category: 'battle',
    description: 'An item that boosts physical prowess, but locks the holder into their first move.',
    buy: 0, sell: 12,
    battle: true, 
  },
  choicespecs: {
    label: 'Choice Specs',
    category: 'battle',
    description: 'An item that boosts special stength, but locks the holder into their first move.',
    buy: 0, sell: 12,
    battle: true, 
  },
  choicescarf: {
    label: 'Choice Scarf',
    category: 'battle',
    description: 'An item that increases speed, but locks the holder into their first move.',
    buy: 0, sell: 12,
    battle: true, 
  },
  expertbelt: {
    label: 'Expert Belt',
    category: 'battle',
    description: 'An item that, when worn, boosts the damage by super-effective moves.',
    buy: 0, sell: 12,
    battle: true, 
  },
  blacksludge: {
    label: 'Black Sludge',
    category: 'battle',
    description: 'An item that, if held by a Poison-type, heals damage each turn.',
    buy: 0, sell: 12,
    battle: true, 
  },
  flameorb: {
    label: 'Flame Orb',
    category: 'battle',
    description: 'An item that will burn whoever holds it.',
    buy: 0, sell: 12,
    battle: true, 
  },
  toxicorb: {
    label: 'Toxic Orb',
    category: 'battle',
    description: 'An item that will poison whoever holds it.',
    buy: 0, sell: 12,
    battle: true, 
  },
  metronome: {
    label: 'Metronome',
    category: 'battle',
    description: 'An item that will gradually increase the power of moves, but locks the holder into their first move.',
    buy: 0, sell: 12,
    battle: true, 
  },
  stickybarb: {
    label: 'Sticky Barb',
    category: 'battle',
    description: `A barb that pokes into the user's side. If contact is made, the barb may transfer.`,
    buy: 0, sell: 12,
    battle: true, 
  },
  adamantorb: {
    label: 'Adamant Orb',
    category: 'battle',
    description: 'A crystalline orb that should be held by Dialga to boost its power.',
    buy: 0, sell: 0,
    battle: true, functional: true, 
  },
  griseousorb: {
    label: 'Griseous Orb',
    category: 'battle',
    description: 'A glowing orb that should be held by Girantina to boost its power.',
    buy: 0, sell: 0,
    battle: true, 
    functional: true,
  },
  lustrousorb: {
    label: 'Lustrous Orb',
    category: 'battle',
    description: 'A smooth orb that should be held by Palkia to boost its power.',
    buy: 0, sell: 0,
    battle: true, functional: true,
  },
  lightclay: {
    label: 'Light Clay', category: 'battle',
    description: 'A soft reflective piece of rock that can boost the effectiveness of screens.',
    buy: 0, sell: 3,
    battle: true, 
  },
  bigroot: {
    label: 'Big Root', category: 'battle',
    description: 'A long root that can boost the effectiveness of absorption moves.',
    buy: 0, sell: 3,
    battle: true, 
  },
  laggingtail: {
    label: 'Lagging Tail', category: 'battle',
    description: 'A long object that slows down whoever is wearing it.',
    buy: 0, sell: 5,
    battle: true, 
  },
  quickpowder: {
    label: 'Quick Powder', category: 'battle',
    description: 'A fine powder that can be held by Ditto. If it does, its speed doubles.',
    buy: 0, sell: 5,
    battle: true, 
  },
  gripclaw: {
    label: 'Grip Claw', category: 'battle',
    description: 'A tool that enables grappling moves to last longer.',
    buy: 0, sell: 4,
    battle: true, 
  },
  insectplate: HELD_TYPE_ITEM('Insect Plate', 'Bug', 0),
  dreadplate: HELD_TYPE_ITEM('Dread Plate', 'Dark', 0),
  dracoplate: HELD_TYPE_ITEM('Draco Plate', 'Dragon', 0),
  earthplate: HELD_TYPE_ITEM('Earth Plate', 'Ground', 0),
  fistplate: HELD_TYPE_ITEM('Fist Plate', 'Fighting', 0),
  flameplate: HELD_TYPE_ITEM('Flame Plate', 'Fire', 0),
  icicleplate: HELD_TYPE_ITEM('Icicle Plate', 'Ice', 0),
  ironplate: HELD_TYPE_ITEM('Iron Plate', 'Steel', 0),
  meadowplate: HELD_TYPE_ITEM('Meadow Plate', 'Grass', 0),
  mindplate: HELD_TYPE_ITEM('Mind Plate', 'Psychic', 0),
  pixieplate: HELD_TYPE_ITEM('Pixie Plate', 'Fairy', 0),
  skyplate: HELD_TYPE_ITEM('Sky Plate', 'Flying', 0),
  splashplate: HELD_TYPE_ITEM('Splash Plate', 'Water', 0),
  spookyplate: HELD_TYPE_ITEM('Spooky Plate', 'Ghost', 0),
  stoneplate: HELD_TYPE_ITEM('Stone Plate', 'Rock', 0),
  toxicplate: HELD_TYPE_ITEM('Toxic Plate', 'Poison', 0),
  zapplate: HELD_TYPE_ITEM('Zap Plate', 'Electric', 0),
  legendplate: {
    label: 'Legend Plate', category: 'battle',
    description: 'A plate that radiates energy. When held by Arceus, it is able to attain its true potential.',
    buy: 0, sell: 30,
    battle: true,
  },
  // Gen 5
  airballoon: {
    label: 'Air Balloon', category: 'battle',
    description: 'A colorful balloon that lets the holder fly above the battle.',
    buy: 0, sell: 6,
    battle: true, 
  },
  bindingband: {
    label: 'Binding Band', category: 'battle',
    description: 'A rubbery thing which lets binding moves last longer.',
    buy: 8, sell: 4,
    battle: true, 
  },
  eviolite: {
    label: 'Eviolite', category: 'battle',
    description: 'A small stone that seems to be handy for non-fully-evolved Pokémon.',
    buy: 0, sell: 6,
    battle: true, 
  },
  floatstone: {
    label: 'Float Stone', category: 'battle',
    description: 'A wondrous stone that, when held, halves the weight of the holder.',
    buy: 0, sell: 6,
    battle: true,
  },
  rockyhelmet: {
    label: 'Rocky Helmet', category: 'battle',
    description: 'A helmet with a rough surface. Collisions can cause damage.',
    buy: 0, sell: 6,
    battle: true, 
  },
  absorbbulb: {
    label: 'Absorb Bulb', category: 'battle',
    description: 'A bulb that raises special attack when hit by a Water-type move.',
    buy: 0, sell: 6,
    battle: true, 
  },
  cellbattery: {
    label: 'Cell Battery', category: 'battle',
    description: 'A small chunk of Lithium-Ion that boosts attack when hit by an Electric-type move.',
    buy: 0, sell: 6,
    battle: true, 
  },
  ringtarget: {
    label: 'Ring Target', category: 'battle',
    description: 'Allows the holder to be hit by any move regardless of type immunity.',
    buy: 0, sell: 12,
    battle: true, 
  },
  healthwing: {
    label: 'Health Wing', category: 'battle',
    description: 'Restores a bit of health at the end of the first turn. Tastes foul.',
    buy: 0, sell: 6,
    battle: true, 
  },
  swiftwing: {
    label: 'Swift Wing', category: 'battle',
    description: 'Boosts speed when consumed. Tastes foul.',
    buy: 0, sell: 6,
    battle: true, 
  },
  musclewing: {
    label: 'Muscle Wing', category: 'battle',
    description: 'Boosts attack when consumed. Tastes foul.',
    buy: 0, sell: 6,
    battle: true, 
  },
  resistwing: {
    label: 'Resist Wing', category: 'battle',
    description: 'Boosts defense when consumed. Tastes foul.',
    buy: 0, sell: 6,
    battle: true, 
  },
  geniuswing: {
    label: 'Genius Wing', category: 'battle',
    description: 'Boosts special attack when consumed. Tastes foul.',
    buy: 0, sell: 6,
    battle: true, 
  },
  cleverwing: {
    label: 'Clever Wing', category: 'battle',
    description: 'Boosts special defense when consumed. Tastes foul.',
    buy: 0, sell: 6,
    battle: true, 
  },
  burndrive: {
    label: 'Burn Drive', category: 'battle',
    description: 'A casette tape for Genesect. It turns Techno Blast into a Fire-type move.',
    buy: 0, sell: 2,
    battle: true, 
  },
  dousedrive: {
    label: 'Douse Drive', category: 'battle',
    description: 'A casette tape for Genesect. It turns Techno Blast into a Water-type move.',
    buy: 0, sell: 2,
    battle: true, 
  },
  shockdrive: {
    label: 'Shock Drive', category: 'battle',
    description: 'A casette tape for Genesect. It turns Techno Blast into an Electric-type move.',
    buy: 0, sell: 2,
    battle: true, 
  },
  chilldrive: {
    label: 'Chill Drive', category: 'battle',
    description: 'A casette tape for Genesect. It turns Techno Blast into an Ice-type move.',
    buy: 0, sell: 2,
    battle: true, 
  },
  fightinggem: GEM('Fighting'),
  darkgem: GEM('Dark'),
  dragongem: GEM('Dragon'),
  rockgem: GEM('Rock'),
  grassgem: GEM('Grass'),
  watergem: GEM('Water'),
  icegem: GEM('Ice'),
  groundgem: GEM('Ground'),
  normalgem: GEM('Normal'),
  buggem: GEM('Bug'),
  ghostgem: GEM('Ghost'),
  firegem: GEM('Fire'),
  electricgem: GEM('Electric'),
  poisongem: GEM('Poison'),
  flyinggem: GEM('Flying'),
  psychicgem: GEM('Psychic'),
  fairygem: GEM('Fairy'),
  steelgem: GEM('Steel'),
  mentalherb: {
    label: 'Mental Herb', category: 'battle',
    description: 'Treats any mental conditions the holder receives in battle.',
    buy: 0, sell: 6,
    battle: true, 
  },
  powerherb: {
    label: 'Power Herb', category: 'battle',
    description: 'Treats any issues arising from recharging.',
    buy: 0, sell: 6,
    battle: true, 
  },
  whiteherb: {
    label: 'White Herb', category: 'battle',
    description: 'Treats any stat drops the holder gets.',
    buy: 0, sell: 6,
    battle: true, 
  },
  // Gen 6
  assaultvest: {
    label: 'Assault Vest', category: 'battle',
    description: 'Boosts defenses for offensive-only battlers.',
    buy: 0, sell: 10,
    battle: true, 
  },
  weaknesspolicy: {
    label: 'Weakness Policy', category: 'battle',
    description: 'Sharply boosts stats when hit by a super-effective move one time.',
    buy: 0, sell: 5,
    battle: true, 
  },
  ironball: {
    label: 'Iron Ball', category: 'battle',
    description: 'A perfect sphere made from a ferrous metal. The holder is weighed down to the ground and becomes slower.',
    buy: 0, sell: 3,
    battle: true, 
  },
  snowball: {
    label: 'Snowball', category: 'battle',
    description: 'A small ball made of compacted snow. When hit by an Ice-type attack its attack rises.',
    buy: 0, sell: 1,
    battle: true, 
  },
  luminousmoss: {
    label: 'Luminous Moss', category: 'battle',
    description: 'A chunk made of glowing plants. When hit by an Water-type attack its special defense rises.',
    buy: 0, sell: 1,
    battle: true, 
  },
  safetygoggles: {
    label: 'Safety Goggles', category: 'battle',
    description: 'These IP67-rated goggles protect the user from the scourge of weather damage and powders.',
    buy: 20, sell: 10,
    battle: true, 
  },
  bugmemory: RKS_MEMORY('Bug'),
  darkmemory: RKS_MEMORY('Dark'),
  dragonmemory: RKS_MEMORY('Dragon'),
  fairymemory: RKS_MEMORY('Fairy'),
  fightingmemory: RKS_MEMORY('Fighting'),
  firememory: RKS_MEMORY('Fire'),
  flyingmemory: RKS_MEMORY('Flying'),
  electricmemory: RKS_MEMORY('Electric'),
  grassmemory: RKS_MEMORY('Grass'),
  ghostmemory: RKS_MEMORY('Ghost'),
  groundmemory: RKS_MEMORY('Ground'),
  rockmemory: RKS_MEMORY('Rock'),
  icememory: RKS_MEMORY('Ice'),
  poisonmemory: RKS_MEMORY('Poison'),
  watermemory: RKS_MEMORY('Water'),
  steelmemory: RKS_MEMORY('Steel'),
  psychicmemory: RKS_MEMORY('Psychic'),
  electricseed: {
    label: 'Electric Seed', category: 'battle',
    description: "Tiny buds that can be planted in Electric Terrain. It will boost the user's defense.",
    buy: 0, sell: 2,
    battle: true, 
  },
  grassyseed: {
    label: 'Grassy Seed', category: 'battle',
    description: "Tiny buds that can be planted in Grassy Terrain. It will boost the user's defense.",
    buy: 0, sell: 2,
    battle: true, 
  },
  mistyseed: {
    label: 'Misty Seed', category: 'battle',
    description: "Tiny buds that can be planted in Misty Terrain. It will boost the user's special defense.",
    buy: 0, sell: 2,
    battle: true, 
  },
  psychicseed: {
    label: 'Psychic Seed', category: 'battle',
    description: "Tiny buds that can be planted in Psychic Terrain. It will boost the user's special defense.",
    buy: 0, sell: 2,
    battle: true, 
  },
  terrainextender: {
    label: 'Terrain Extender', category: 'battle',
    description: "An aerosol can. I don't know what's in it, but Terrain moves will last longer.",
    buy: 0, sell: 5,
    battle: true, 
  },
  bottlecaphp: assert<Souvenir>({
    label: 'HP Bottle Cap', category: 'battle',
    description: "A plastic cap from a bottle. It will boost a Pokémon's base HP during a single battle.",
    buy: 0, sell: 7,
    battle: true, isSouvenir: true,
  }),
  bottlecapatk: assert<Souvenir>({
    label: 'ATK Bottle Cap', category: 'battle',
    description: "A plastic cap from a bottle. It will boost a Pokémon's attack during a single battle.",
    buy: 0, sell: 7,
    battle: true, isSouvenir: true,
  }),
  bottlecapdef: assert<Souvenir>({
    label: 'DEF Bottle Cap', category: 'battle',
    description: "A plastic cap from a bottle. It will boost a Pokémon's defense during a single battle.",
    buy: 0, sell: 7,
    battle: true, isSouvenir: true,
  }),
  bottlecapspa: assert<Souvenir>({
    label: 'SpAtk Bottle Cap', category: 'battle',
    description: "A plastic cap from a bottle. It will boost a Pokémon's special attack during a single battle.",
    buy: 0, sell: 7,
    battle: true, isSouvenir: true,
  }),
  bottlecapspd: assert<Souvenir>({
    label: 'SpDef Bottle Cap', category: 'battle',
    description: "A plastic cap from a bottle. It will boost a Pokémon's special defense during a single battle.",
    buy: 0, sell: 7,
    battle: true, isSouvenir: true,
  }),
  bottlecapspe: assert<Souvenir>({
    label: 'SPE Bottle Cap', category: 'battle',
    description: "A plastic cap from a bottle. It will boost a Pokémon's speed during a single battle.",
    buy: 0, sell: 7,
    battle: true, isSouvenir: true,
  }),
  bottlecapgold: assert<Souvenir>({
    label: 'Gold Bottle Cap', category: 'battle',
    description: "A metal cap from an imported bottle. It will boost all of a Pokémon's stats during a single battle.",
    buy: 0, sell: 15,
    battle: true, isSouvenir: true,
  }),
  protectivepads: {
    label: 'Protective Pads', category: 'battle',
    description: "Padded uniform for a Pokémon's safety. It prevents it from making direct contact during battle.",
    buy: 0, sell: 7,
    battle: true, 
  },
  choicedumpling: {
    label: 'Choice Dumpling', category: 'battle',
    description: 'A cooked dumpling that, when consumed at the start of battle, boosts a single move. The Pokémon takes more damage too.',
    buy: 0, sell: 3,
    battle: true, 
  },
  swapsnack: {
    label: 'Swap Snack', category: 'battle',
    description: "A spicy snack which swaps a Pokémon's offensive and defensive stats.",
    buy: 0, sell: 3,
    battle: true, 
  },
  twicespicedradish: {
    label: 'Twice-Spiced Radish', category: 'battle',
    description: 'A bitter root vegetable that will boost the power of moves in battle.',
    buy: 0, sell: 3,
    battle: true, 
  },
  minthardy: MINT('Hardy'),
  mintadamant: MINT('Adamant'),
  mintbold: MINT('Bold'),
  minttimid: MINT('Timid'),
  mintmodest: MINT('Modest'),
  mintcalm: MINT('Calm'),
  mintnaughty: MINT('Naughty'),
  mintjolly: MINT('Jolly'),
  dynamaxcandy: {
    label: 'Dynamax Candy', category: 'battle',
    description: 'A sour candy. When consumed in battle, your Pokémon will instantly Dynamax.',
    buy: 0, sell: 1, battle: true, functional: true,
  },
  maxmushroom: {
    label: 'Max Mushrooms', category: 'battle',
    description: 'A poisonous mushroom. When consumed in battle, your Pokémon will instantly Gigantamax if possible.',
    buy: 0, sell: 5, battle: true,
  },
  maxhoney: {
    label: 'Max Honey', category: 'battle',
    description: 'A sweet and sticky liquid that some Pokémon really enjoy. When consumed in battle, that Pokémon will instantly Gigantamax.',
    buy: 0, sell: 15, battle: true,
  },
  blunderpolicy: {
    label: 'Blunder Policy', category: 'battle',
    description: 'You use a move and it misses. You can claim this insurance policy for a hefty buff.',
    buy: 0, sell: 16, battle: true,
  },
  redcard: {
    label: 'Red Card', category: 'battle',
    description: 'A monocolor playing card with specific properties. When raised in a battle, the offending Pokémon must return.',
    buy: 0, sell: 16, battle: true,
  },
  ejectbutton: {
    label: 'Eject Button', category: 'battle',
    description: 'You automatically are returned when struck by an attack.',
    buy: 0, sell: 16, battle: true,
  },
  ejectpack: {
    label: 'Eject Pack', category: 'battle',
    description: 'You automatically are returned when your stats drop.',
    buy: 0, sell: 16, battle: true,
  },
  heavydutyboots: {
    label: 'Heavy-Duty Boots', category: 'battle',
    description: 'Protects the wearer from entry hazards.',
    buy: 0, sell: 16, battle: true,
  },
  roomservice: {
    label: 'Room Service', category: 'battle',
    description: 'Placeholder buff in Trick Room.',
    buy: 0, sell: 16, battle: true,
  },
  throatspray: {
    label: 'Throat Spray', category: 'battle',
    description: 'A quick spray in the throat helps boost special attack after using a sound move.',
    buy: 0, sell: 16, battle: true,
  },
  utilityumbrella: {
    label: 'Utility Umbrella', category: 'battle',
    description: 'Protects the holder from the effects of rain and harsh sunlight.',
    buy: 0, sell: 16, battle: true,
  },
  rustedsword: {
    label: 'Rusted Sword', category: 'battle',
    description: 'A sword from ancient times. It is too heavy for you to lift.',
    buy: 0, sell: 0, battle: true,
  },
  rustedshield: {
    label: 'Rusted Shield', category: 'battle',
    description: 'A shield from ancient times. It is too heavy for you to lift.',
    buy: 0, sell: 0, battle: true,
  },
  shedshell: {
    label: 'Shed Shell', category: 'battle',
    description: 'What appears to be the sticky remains of molting. If held by a Pokémon, it will be immune from trapping in battle.',
    buy: 0, sell: 4, battle: true,
  },
  pokedoll: {
    label: 'PokéDoll', category: 'battle',
    description: 'A fun and chewable toy. If held by a Pokémon, it will be immune from trapping in battle.',
    buy: 0, sell: 4, battle: true,
  },
  smokeball: {
    label: 'Smoke Ball', category: 'battle',
    description: 'A ball full of smoke. If held by a Pokémon, it will be immune from trapping in battle.',
    buy: 0, sell: 4, battle: true,
  },
  boosterenergy: {
    label: 'Booster Energy', category: 'battle',
    description: 'A capsule containing a strange energy that only certain Pokémon can use. It will boost them in battle.',
    buy: 0, sell: 9, battle: true,
  },
  abilityshield: {
    label: 'Ability Shield', category: 'battle',
    description: "A shield that draws out a Pokémon's innate power. It protects that power from changing.",
    buy: 0, sell: 0, battle: true,
  },
  clearamulet: {
    label: 'Clear Amulet', category: 'battle',
    description: 'When held, any moves that lower its stats will cause those stats to return to normal.',
    buy: 0, sell: 9, battle: true,
  },
  mirrorherb: {
    label: 'Mirror Herb', category: 'battle',
    description: 'When an opponent raises their stats, this Pokémon will consume the herb and reflect those changes.',
    buy: 0, sell: 3, battle: true,
  },
  punchingglove: {
    label: 'Punching Glove', category: 'battle',
    description: "Punching moves will be powered up when wearing these gloves. Additionally, they won't make direct contact with the foe.",
    buy: 0, sell: 9, battle: true,
  },
  covertcloak: {
    label: 'Covert Cloak', category: 'battle',
    description: 'Prevents a move, after damage, from having additional effects.',
    buy: 0, sell: 9, battle: true,
  },
  loadeddice: {
    label: 'Loaded Dice', category: 'battle',
    description: 'For multi-use moves, this gives the user a bit of luck and will hit more times.',
    buy: 0, sell: 9, battle: true,
  },
  fairyfeather: {
    label: 'Fairy Feather', category: 'battle',
    description: 'A feather which glistens in the light. When held, Fairy-type moves get boosted.',
    buy: 0, sell: 6, battle: true,
  },
  mochimuscle: {
    label: 'Muscle Mochi', category: 'battle',
    description: 'A Pokémon will consume this mochi at the start of a battle. Its Attack stat will be temporarily raised.',
    buy: 0, sell: 2, battle: true,
  },
  mochiresist: {
    label: 'Resist Mochi', category: 'battle',
    description: 'A Pokémon will consume this mochi at the start of a battle. Its Defense stat will be temporarily raised.',
    buy: 0, sell: 2, battle: true,
  },
  mochigenius: {
    label: 'Genius Mochi', category: 'battle',
    description: 'A Pokémon will consume this mochi at the start of a battle. Its Special Attack stat will be temporarily raised.',
    buy: 0, sell: 2, battle: true,
  },
  mochiclever: {
    label: 'Clever Mochi', category: 'battle',
    description: 'A Pokémon will consume this mochi at the start of a battle. Its Special Defense stat will be temporarily raised.',
    buy: 0, sell: 2, battle: true,
  },
  mochiswift: {
    label: 'Swift Mochi', category: 'battle',
    description: 'A Pokémon will consume this mochi at the start of a battle. Its Speed stat will be temporarily raised.',
    buy: 0, sell: 2, battle: true,
  },
  mochihealth: {
    label: 'Health Mochi', category: 'battle',
    description: 'A Pokémon will consume this mochi in a pinch to boost its health.',
    buy: 0, sell: 2, battle: true,
  },
  mochifreshstart: {
    label: 'Fresh-Start Mochi', category: 'battle',
    description: 'A Pokémon will consume this mochi on the start of its second turn. Its stat changes will be reset.',
    buy: 0, sell: 2, battle: true,
  },
}

/**
 * Params for `genTm` and `genTr` function
 */
interface TmTr {
  buy?: number
  sell?: number
  functional?: boolean
}

function genTm(number: number, move: MoveId, params: TmTr): Item {
  return {
    label: `TM-${number.toString().padStart(3, '0')} ${move}`,
    category: 'tms',
    buy: params.buy || 0,
    sell: params.sell || 0,
    battle: true,    description: MoveTypeMap[move]!.flavor,
    functional: params.functional || false
  }
}

function genTr(number: number, move: MoveId, params: TmTr): Item {
  return {
    label: `TR-${number.toString().padStart(3, '0')} ${move}`,
    category: 'trs',
    buy: params.buy || 0,
    sell: params.sell || 0,
    battle: true,    description: MoveTypeMap[move]!.flavor,
    functional: params.functional || false
  }
}

const ITEMS_TMS = {
  [TX('tm', 'Hyper Beam')]: genTm(0, 'Hyper Beam', {
    buy: 24, sell: 12,
  }),
  [TX('tm', 'Solar Beam')]: genTm(1, 'Solar Beam', {
    buy: 24, sell: 12,
  }),
  [TX('tm', 'Ice Punch')]: genTm(2, 'Ice Punch', {
    buy: 20, sell: 10,
  }),
  [TX('tm', 'Thunder Punch')]: genTm(3, 'Thunder Punch', {
    buy: 20, sell: 10,
  }),
  [TX('tm', 'Fire Punch')]: genTm(4, 'Fire Punch', {
    buy: 20, sell: 10,
  }),
  [TX('tm', 'Dream Eater')]: genTm(5, 'Dream Eater', {
    buy: 16, sell: 8,
  }),
  [TX('tm', 'Snore')]: genTm(6, 'Snore', {
    buy: 16, sell: 8,
  }),
  [TX('tm', 'Tri Attack')]: genTm(7, 'Tri Attack', {
    buy: 20, sell: 10,
  }),
  [TX('tm', 'Double-Edge')]: genTm(8, 'Double-Edge', {
    buy: 20, sell: 10,
  }),
  [TX('tm', 'Dive')]: genTm(9, 'Dive', {
    buy: 20, sell: 10, functional: true,
  }),
  [TX('tm', 'Dig')]: genTm(10, 'Dig', {
    buy: 20, sell: 10,
  }),
  [TX('tm', 'Bide')]: genTm(11, 'Bide', {
    buy: 0, sell: 10,
  }),
  [TX('tm', 'Bubble Beam')]: genTm(12, 'Bubble Beam', {
    buy: 0, sell: 10,
  }),
  [TX('tm', 'Thunderbolt')]: genTm(13, 'Thunderbolt', {
    buy: 0, sell: 10,
  }),
  [TX('tm', 'Mega Drain')]: genTm(14, 'Mega Drain', {
    buy: 0, sell: 10,
  }),
  [TX('tm', 'Sludge')]: genTm(15, 'Sludge', {
    buy: 0, sell: 10,
  }),
  [TX('tm', 'Psywave')]: genTm(16, 'Psywave', {
    buy: 0, sell: 10,
  }),
  [TX('tm', 'Fire Blast')]: genTm(17, 'Fire Blast', {
    buy: 0, sell: 10,
  }),
  [TX('tm', 'Earthquake')]: genTm(18, 'Earthquake', {
    buy: 0, sell: 15,
  }),
  [TX('tm', 'Zap Cannon')]: genTm(19, 'Zap Cannon', {
    buy: 20, sell: 10,
  }),
  [TX('tm', 'Steel Wing')]: genTm(20, 'Steel Wing', {
    buy: 20, sell: 10,
  }),
  [TX('tm', 'Mud-Slap')]: genTm(21, 'Mud-Slap', {
    buy: 0, sell: 10,
  }),
  [TX('tm', 'Fury Cutter')]: genTm(22, 'Fury Cutter', {
    buy: 0, sell: 10,
  }),
  [TX('tm', 'Rollout')]: genTm(23, 'Rollout', {
    buy: 0, sell: 10,
    functional: true,
  }),
  [TX('tm', 'Shadow Ball')]: genTm(24, 'Shadow Ball', {
    buy: 0, sell: 10,
  }),
  [TX('tm', 'Dynamic Punch')]: genTm(25, 'Dynamic Punch', {
    buy: 0, sell: 10,
  }),
  [TX('tm', 'Iron Tail')]: genTm(26, 'Iron Tail', {
    buy: 0, sell: 10,
  }),
  [TX('tm', 'Icy Wind')]: genTm(27, 'Icy Wind', {
    buy: 0, sell: 10,
  }),
  [TX('tm', 'Dragon Breath')]: genTm(28, 'Dragon Breath', {
    buy: 0, sell: 10,
  }),
  [TX('tm', 'Egg Bomb')]: genTm(29, 'Egg Bomb', {
    buy: 20, sell: 10,
  }),
  [TX('tm', 'Swift')]: genTm(30, 'Swift', {
    buy: 20, sell: 10,
  }),
  [TX('tm', 'Rock Tomb')]: genTm(31, 'Rock Tomb', {
    buy: 0, sell: 15,
  }),
  [TX('tm', 'Focus Punch')]: genTm(32, 'Focus Punch', {
    buy: 0, sell: 15,
  }),
  [TX('tm', 'Shock Wave')]: genTm(33, 'Shock Wave', {
    buy: 0, sell: 15,
  }),
  [TX('tm', 'Overheat')]: genTm(34, 'Overheat', {
    buy: 0, sell: 15,
  }),
  [TX('tm', 'Facade')]: genTm(35, 'Facade', {
    buy: 0, sell: 15,
  }),
  [TX('tm', 'Aerial Ace')]: genTm(36, 'Aerial Ace', {
    buy: 0, sell: 15,
  }),
  [TX('tm', 'Extrasensory')]: genTm(37, 'Extrasensory', {
    buy: 0, sell: 15,
  }),
  [TX('tm', 'Water Pulse')]: genTm(38, 'Water Pulse', {
    buy: 0, sell: 15,
  }),
  [TX('tm', 'Rock Slide')]: genTm(39, 'Rock Slide', {
    buy: 0, sell: 15,
  }),
  [TX('tm', 'Volt Tackle')]: genTm(40, 'Volt Tackle', {
    buy: 0, sell: 15,
  }),
  [TX('tm', 'Stone Edge')]: genTm(41, 'Stone Edge', {
    buy: 0, sell: 15,
  }),
  [TX('tm', 'Leaf Storm')]: genTm(42, 'Leaf Storm', {
    buy: 0, sell: 15,
  }),
  [TX('tm', 'Close Combat')]: genTm(43, 'Close Combat', {
    buy: 0, sell: 15,
  }),
  [TX('tm', 'Brine')]: genTm(44, 'Brine', {
    buy: 0, sell: 15,
  }),
  [TX('tm', 'Shadow Claw')]: genTm(45, 'Shadow Claw', {
    buy: 0, sell: 15,
  }),
  [TX('tm', 'Flash Cannon')]: genTm(46, 'Flash Cannon', {
    buy: 0, sell: 15,
  }),
  [TX('tm', 'Ice Shard')]: genTm(47, 'Ice Shard', {
    buy: 0, sell: 15,
  }),
  [TX('tm', 'Charge Beam')]: genTm(48, 'Charge Beam', {
    buy: 0, sell: 15,
  }),
  [TX('tm', 'Smelling Salts')]: genTm(49, 'Smelling Salts', {
    buy: 0, sell: 15,
  }),
  [TX('tm', 'Hyper Voice')]: genTm(50, 'Hyper Voice', {
    buy: 0, sell: 15,
  }),
  [TX('tm', 'Sludge Wave')]: genTm(51, 'Sludge Wave', {
    buy: 0, sell: 20,
  }),
  [TX('tm', 'Chip Away')]: genTm(52, 'Chip Away', {
    buy: 0, sell: 20,
  }),
  [TX('tm', 'Steamroller')]: genTm(53, 'Steamroller', {
    buy: 0, sell: 20,
  }),
  [TX('tm', 'Electroweb')]: genTm(54, 'Electroweb', {
    buy: 0, sell: 20,
  }),
  [TX('tm', 'Bulldoze')]: genTm(55, 'Bulldoze', {
    buy: 0, sell: 20,
  }),
  [TX('tm', 'Sky Drop')]: genTm(56, 'Sky Drop', {
    buy: 0, sell: 20,
  }),
  [TX('tm', 'Frost Breath')]: genTm(57, 'Frost Breath', {
    buy: 0, sell: 20,
  }),
  [TX('tm', 'Dual Chop')]: genTm(58, 'Dual Chop', {
    buy: 0, sell: 20,
  }),
  [TX('tm', 'Double Hit')]: genTm(59, 'Double Hit', {
    buy: 0, sell: 10,
    functional: true,
  }),
  [TX('tm', 'Rock Blast')]: genTm(60, 'Rock Blast', {
    buy: 0, sell: 15,
  }),
  [TX('tm', 'Infestation')]: genTm(61, 'Infestation', {
    buy: 0, sell: 15
  }),
  [TX('tm', 'Head Smash')]: genTm(62, 'Head Smash', {
    buy: 0, sell: 15
  }),
  [TX('tm', 'Power-Up Punch')]: genTm(63, 'Power-Up Punch', {
    buy: 0, sell: 15
  }),
  [TX('tm', 'Petal Blizzard')]: genTm(64, 'Petal Blizzard', {
    buy: 0, sell: 15
  }),
  [TX('tm', 'Nuzzle')]: genTm(65, 'Nuzzle', {
    buy: 0, sell: 15,
  }),
  [TX('tm', 'Play Rough')]: genTm(66, 'Play Rough', {
    buy: 0, sell: 15
  }),
  [TX('tm', 'Psyshock')]: genTm(67, 'Psyshock', {
    buy: 0, sell: 15,
  }),
  [TX('tm', 'Freeze-Dry')]: genTm(68, 'Freeze-Dry', {
    buy: 0, sell: 15
  }),
  [TX('tm', 'Spark')]: genTm(69, 'Spark', {
    buy: 0, sell: 15,
  }),
  [TX('tm', 'Giga Impact')]: genTm(70, 'Giga Impact', {
    buy: 0, sell: 15,
  }),
  [TX('tm', 'Power Trip')]: genTm(71, 'Power Trip', {
    buy: 0, sell: 20,
  }),
  [TX('tm', 'Liquidation')]: genTm(72, 'Liquidation', {
    buy: 0, sell: 20,
  }),
  [TX('tm', 'Burn Up')]: genTm(73, 'Burn Up', {
    buy: 0, sell: 20,
  }),
  [TX('tm', 'Solar Blade')]: genTm(74, 'Solar Blade', {
    buy: 0, sell: 20,
  }),
  [TX('tm', 'Zing Zap')]: genTm(75, 'Zing Zap', {
    buy: 0, sell: 20,
  }),
  [TX('tm', 'Phantom Force')]: genTm(76, 'Phantom Force', {
    buy: 0, sell: 20,
  }),
  [TX('tm', 'Dragon Pulse')]: genTm(77, 'Dragon Pulse', {
    buy: 0, sell: 20, functional: true,
  }),
  [TX('tm', 'Dazzling Gleam')]: genTm(78, 'Dazzling Gleam', {
    buy: 20, sell: 10,
  }),
  [TX('tm', 'Fly')]: genTm(79, 'Fly', {
    buy: 0, sell: 10,
  }),
  [TX('tm', 'Dragon Rage')]: genTm(80, 'Dragon Rage', {
    buy: 20, sell: 10,
  }),
  [TX('tm', 'Leafage')]: genTm(81, 'Leafage', {
    buy: 0, sell: 22,
  }),
  [TX('tm', 'Razor Shell')]: genTm(82, 'Razor Shell', {
    buy: 0, sell: 22,
  }),
  [TX('tm', 'Flame Wheel')]: genTm(83, 'Flame Wheel', {
    buy: 0, sell: 22,
  }),
  [TX('tm', 'Body Press')]: genTm(84, 'Body Press', {
    buy: 0, sell: 22,
  }),
  [TX('tm', 'Draining Kiss')]: genTm(85, 'Draining Kiss', {
    buy: 0, sell: 22,
  }),
  [TX('tm', 'Mud Shot')]: genTm(86, 'Mud Shot', {
    buy: 0, sell: 22,
  }),
  [TX('tm', 'Beat Up')]: genTm(87, 'Beat Up', {
    buy: 0, sell: 22,
  }),
  [TX('tm', 'Twister')]: genTm(88, 'Twister', {
    buy: 0, sell: 22,
  }),
  [TX('tm', 'Payback')]: genTm(89, 'Payback', {
    buy: 0, sell: 22,
  }),
  [TX('tm', 'Icicle Spear')]: genTm(90, 'Icicle Spear', {
    buy: 0, sell: 22,
  }),
  [TX('tm', 'Pounce')]: genTm(91, 'Pounce', {
    buy: 0, sell: 18,
  }),
  [TX('tm', 'Trailblaze')]: genTm(92, 'Trailblaze', {
    buy: 0, sell: 18,
  }),
  [TX('tm', 'Volt Switch')]: genTm(93, 'Volt Switch', {
    buy: 0, sell: 18,
  }),
  [TX('tm', 'Chilling Water')]: genTm(94, 'Chilling Water', {
    buy: 0, sell: 18,
  }),
  [TX('tm', 'Hyper Drill')]: genTm(95, 'Hyper Drill', {
    buy: 0, sell: 18, functional: true,
  }),
  [TX('tm', 'Rage Fist')]: genTm(96, 'Rage Fist', {
    buy: 0, sell: 18, functional: true,
  }),
  [TX('tm', 'Twin Beam')]: genTm(97, 'Twin Beam', {
    buy: 0, sell: 18, functional: true,
  }),
  [TX('tm', 'Ice Spinner')]: genTm(98, 'Ice Spinner', {
    buy: 0, sell: 18,
  }),  
  [TX('tm', 'Dragon Ascent')]: genTm(99, 'Dragon Ascent', {
    buy: 0, sell: 15,
  }),
  [TX('tm', 'Surf')]: genTm(100, 'Surf', {
    buy: 20, sell: 10, functional: true,
  }),
  [TX('tm', 'Cut')]: genTm(101, 'Cut', {
    buy: 20, sell: 10,
  }),
  [TX('tm', 'Strength')]: genTm(102, 'Strength', {
    buy: 20, sell: 10,
  }),
  [TX('tm', 'Rock Smash')]: genTm(103, 'Rock Smash', {
    buy: 20, sell: 10, functional: true,
  }),
  [TX('tm', 'Whirlpool')]: genTm(104, 'Whirlpool', {
    buy: 20, sell: 10,
  }),
  [TX('tm', 'Rock Climb')]: genTm(105, 'Rock Climb', {
    buy: 20, sell: 10,
  }),
  [TX('tm', 'Waterfall')]: genTm(106, 'Waterfall', {
    buy: 20, sell: 10,
  }),
  [TX('tm', 'Stomp')]: genTm(107, 'Stomp', {
    buy: 14, sell: 7, functional: true,
  }),
  [TX('tm', 'Barb Barrage')]: genTm(108, 'Barb Barrage', {
    buy: 0, sell: 16, functional: true,
  }),
  [TX('tm', 'Psyshield Bash')]: genTm(109, 'Psyshield Bash', {
    buy: 0, sell: 16, functional: true,
  }),
  [TX('tm', 'Dark Pulse')]: genTm(110, 'Dark Pulse', {
    buy: 20, sell: 10,
  }),
  [TX('tm', 'Weather Ball')]: genTm(111, 'Weather Ball', {
    buy: 0, sell: 15,
  }),
  [TX('tm', 'Nature Power')]: genTm(112, 'Nature Power', {
    buy: 20, sell: 10,
  }),
  [TX('tm', 'Secret Power')]: genTm(113, 'Secret Power', {
    buy: 20, sell: 10,
  }),
  [TX('tm', 'Ancient Power')]: genTm(114, 'Ancient Power', {
    buy: 0, sell: 10,
    functional: true,
  }),
  [TX('tm', 'Superpower')]: genTm(115, 'Superpower', {
    buy: 20, sell: 10,
  }),
  [TX('tm', 'Fire Spin')]: genTm(116, 'Fire Spin', {
    buy: 0, sell: 15,
  }),
  [TX('tm', 'Sand Tomb')]: genTm(117, 'Sand Tomb', {
    buy: 0, sell: 15,
  }),
  [TX('tm', 'Secret Sword')]: genTm(118, 'Secret Sword', {
    buy: 0, sell: 15,
    functional: true,
  }),
  [TX('tm', 'Relic Song')]: genTm(119, 'Relic Song', {
    buy: 0, sell: 15,
    functional: true,
  }),
}

const ITEMS_TRS = {
  /* TRs */
  [TX('tr', 'String Shot')]: genTr(0, 'String Shot', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Protect')]: genTr(1, 'Protect', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Swagger')]: genTr(2, 'Swagger', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Flatter')]: genTr(3, 'Flatter', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Defense Curl')]: genTr(4, 'Defense Curl', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Mimic')]: genTr(5, 'Mimic', {
    buy: 0, sell: 5,
    functional: true,
  }),
  [TX('tr', 'Self-Destruct')]: genTr(6, 'Self-Destruct', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Thunder Wave')]: genTr(7, 'Thunder Wave', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Metronome')]: genTr(8, 'Metronome', {
    buy: 10, sell: 5,
  }),
  [TX('tr', 'Hypnosis')]: genTr(9, 'Hypnosis', {
    buy: 10, sell: 5,
  }),
  [TX('tr', 'Will-O-Wisp')]: genTr(10, 'Will-O-Wisp', {
    buy: 10, sell: 5,
  }),
  [TX('tr', 'Poison Powder')]: genTr(11, 'Poison Powder', {
    buy: 10, sell: 5,
  }),
  [TX('tr', 'Confuse Ray')]: genTr(12, 'Confuse Ray', {
    buy: 10, sell: 5,
  }),
  [TX('tr', 'Bulk Up')]: genTr(13, 'Bulk Up', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Calm Mind')]: genTr(14, 'Calm Mind', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Dragon Dance')]: genTr(15, 'Dragon Dance', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Mud Sport')]: genTr(16, 'Mud Sport', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Frenzy Plant')]: genTr(17, 'Frenzy Plant', {
    buy: 0, sell: 10,
  }),
  [TX('tr', 'Blast Burn')]: genTr(18, 'Blast Burn', {
    buy: 0, sell: 10,
  }),
  [TX('tr', 'Hydro Cannon')]: genTr(19, 'Hydro Cannon', {
    buy: 0, sell: 10,
  }),
  [TX('tr', 'Draco Meteor')]: genTr(20, 'Draco Meteor', {
    buy: 0, sell: 10,
  }),
  [TX('tr', 'Swords Dance')]: genTr(21, 'Swords Dance', {
    buy: 0, sell: 5, functional: true,
  }),
  [TX('tr', 'Iron Defense')]: genTr(22, 'Iron Defense', {
    buy: 10, sell: 5, functional: true,
  }),
  [TX('tr', 'Nasty Plot')]: genTr(23, 'Nasty Plot', {
    buy: 10, sell: 5,
  }),
  [TX('tr', 'Amnesia')]: genTr(24, 'Amnesia', {
    buy: 10, sell: 5,
  }),
  [TX('tr', 'Agility')]: genTr(25, 'Agility', {
    buy: 10, sell: 5,
  }),
  [TX('tr', 'Feather Dance')]: genTr(26, 'Feather Dance', {
    buy: 10, sell: 5,
  }),
  [TX('tr', 'Screech')]: genTr(27, 'Screech', {
    buy: 10, sell: 5,
  }),
  [TX('tr', 'Captivate')]: genTr(28, 'Captivate', {
    buy: 10, sell: 5,
  }),
  [TX('tr', 'Metal Sound')]: genTr(29, 'Metal Sound', {
    buy: 10, sell: 5,
  }),
  [TX('tr', 'Cotton Spore')]: genTr(30, 'Cotton Spore', {
    buy: 10, sell: 5,
  }),
  [TX('tr', 'Defog')]: genTr(31, 'Defog', {
    buy: 0, sell: 5,
    functional: true,
  }),
  [TX('tr', 'Hail')]: genTr(32, 'Hail', {
    buy: 16, sell: 8,
    functional: true,
  }),
  [TX('tr', 'Sunny Day')]: genTr(33, 'Sunny Day', {
    buy: 16, sell: 8,
    functional: true,
  }),
  [TX('tr', 'Rain Dance')]: genTr(34, 'Rain Dance', {
    buy: 16, sell: 8,
    functional: true,
  }),
  [TX('tr', 'Sandstorm')]: genTr(35, 'Sandstorm', {
    buy: 16, sell: 8,
  }),
  [TX('tr', 'Reflect')]: genTr(36, 'Reflect', {
    buy: 16, sell: 8,
  }),
  [TX('tr', 'Light Screen')]: genTr(37, 'Light Screen', {
    buy: 16, sell: 8,
  }),
  [TX('tr', 'Tickle')]: genTr(38, 'Tickle', {
    buy: 10, sell: 5,
  }),
  [TX('tr', 'Haze')]: genTr(39, 'Haze', {
    buy: 10, sell: 5,
  }),
  [TX('tr', 'Safeguard')]: genTr(40, 'Safeguard', {
    buy: 10, sell: 5,
  }),
  [TX('tr', 'Belly Drum')]: genTr(41, 'Belly Drum', {
    buy: 10, sell: 5,
  }),
  [TX('tr', 'Aqua Ring')]: genTr(42, 'Aqua Ring', {
    buy: 12, sell: 6,
  }),
  [TX('tr', 'Ingrain')]: genTr(43, 'Ingrain', {
    buy: 12, sell: 6,
  }),
  [TX('tr', 'Quick Attack')]: genTr(44, 'Quick Attack', {
    buy: 12, sell: 6,
  }),
  [TX('tr', 'Embargo')]: genTr(45, 'Embargo', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Charm')]: genTr(46, 'Charm', {
    buy: 10, sell: 5, functional: true,
  }),
  [TX('tr', 'Rock Polish')]: genTr(47, 'Rock Polish', {
    buy: 0, sell: 6,
  }),
  [TX('tr', 'Acupressure')]: genTr(48, 'Acupressure', {
    buy: 0, sell: 6,
  }),
  [TX('tr', 'Power Trick')]: genTr(49, 'Power Trick', {
    buy: 0, sell: 6,
  }),
  [TX('tr', 'Power Swap')]: genTr(50, 'Power Swap', {
    buy: 0, sell: 6,
  }),
  [TX('tr', 'Guard Swap')]: genTr(51, 'Guard Swap', {
    buy: 0, sell: 6,
  }),
  [TX('tr', 'Switcheroo')]: genTr(52, 'Switcheroo', {
    buy: 0, sell: 6,
  }),
  [TX('tr', 'Trick Room')]: genTr(53, 'Trick Room', {
    buy: 0, sell: 6,
  }),
  [TX('tr', 'Tailwind')]: genTr(54, 'Tailwind', {
    buy: 0, sell: 6,
  }),
  [TX('tr', 'Wish')]: genTr(55, 'Wish', {
    buy: 10, sell: 5,
  }),
  [TX('tr', 'Endeavor')]: genTr(56, 'Endeavor', {
    buy: 10, sell: 5,
  }),
  [TX('tr', 'Fake Out')]: genTr(57, 'Fake Out', {
    buy: 10, sell: 5,
  }),
  [TX('tr', 'Attract')]: genTr(58, 'Attract', {
    buy: 12, sell: 6,
  }),
  [TX('tr', 'Knock Off')]: genTr(59, 'Knock Off', {
    buy: 16, sell: 8,
  }),
  [TX('tr', 'Substitute')]: genTr(60, 'Substitute', {
    buy: 0, sell: 6,
  }),
  [TX('tr', 'Leech Seed')]: genTr(61, 'Leech Seed', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Hone Claws')]: genTr(62, 'Hone Claws', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Wide Guard')]: genTr(63, 'Wide Guard', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Quick Guard')]: genTr(64, 'Quick Guard', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Power Split')]: genTr(65, 'Power Split', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Guard Split')]: genTr(66, 'Guard Split', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Wonder Room')]: genTr(67, 'Wonder Room', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Magic Room')]: genTr(68, 'Magic Room', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Soak')]: genTr(69, 'Soak', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Coil')]: genTr(70, 'Coil', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Shell Smash')]: genTr(71, 'Shell Smash', {
    buy: 0, sell: 5, functional: true,
  }),
  [TX('tr', 'Shift Gear')]: genTr(72, 'Shift Gear', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Work Up')]: genTr(73, 'Work Up', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Cotton Guard')]: genTr(74, 'Cotton Guard', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Autotomize')]: genTr(75, 'Autotomize', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Telekinesis')]: genTr(76, 'Telekinesis', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Endure')]: genTr(77, 'Endure', {
    buy: 10, sell: 5,
  }),
  [TX('tr', 'Mist')]: genTr(78, 'Mist', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Imprison')]: genTr(79, 'Imprison', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Electric Terrain')]: genTr(80, 'Electric Terrain', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Grassy Terrain')]: genTr(81, 'Grassy Terrain', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Misty Terrain')]: genTr(82, 'Misty Terrain', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Psychic Terrain')]: genTr(83, 'Psychic Terrain', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Confide')]: genTr(84, 'Confide', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Venom Drench')]: genTr(85, 'Venom Drench', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Flash')]: genTr(86, 'Flash', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Sweet Scent')]: genTr(87, 'Sweet Scent', {
    buy: 10, sell: 5,
  }),
  [TX('tr', 'Taunt')]: genTr(88, 'Taunt', {
    buy: 0, sell: 5, functional: true,
  }),
  [TX('tr', 'Roost')]: genTr(89, 'Roost', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Fake Tears')]: genTr(90, 'Fake Tears', {
    buy: 10, sell: 5,
  }),
  [TX('tr', 'Grass Whistle')]: genTr(91, 'Grass Whistle', {
    buy: 10, sell: 5,
  }),
  [TX('tr', 'Odor Sleuth')]: genTr(92, 'Odor Sleuth', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Miracle Eye')]: genTr(93, 'Miracle Eye', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Laser Focus')]: genTr(94, 'Laser Focus', {
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Follow Me')]: genTr(95, 'Follow Me',{
    buy: 0, sell: 5,
  }),
  [TX('tr', 'Tearful Look')]: genTr(96, 'Tearful Look', {
    buy: 0, sell: 7,
  }),
  [TX('tr', 'Aurora Veil')]: genTr(97, 'Aurora Veil', {
    buy: 0, sell: 7,
  }),
  [TX('tr', 'Speed Swap')]: genTr(98, 'Speed Swap', {
    buy: 0, sell: 7,
  }),
  [TX('tr', 'Double Team')]: genTr(99, 'Double Team', {
    buy: 0, sell: 7, functional: true,
  }),
  // Gen 8 moves
  [TX('tr', 'Life Dew')]: genTr(100, 'Life Dew',{
    buy: 0, sell: 5,
  }),
  // Gen 9 moves
  [TX('tr', 'Dragon Cheer')]: genTr(101, 'Dragon Cheer',{
    buy: 0, sell: 7,
  }),
}

const ITEMS_KEY = {
  squirtbottle: {
    label: 'Squirtbottle', category: 'key',
    description: 'A watering can shaped like a familiar Pokémon.',
    buy: 0, sell: 0,
  },
  devonscope: {
    label: 'Devon Scope', category: 'key',
    description: 'A high-tech lens from the Devon Corporation. It can see things invisible to the eye.',
    buy: 0, sell: 0,
  },
  berrypouch: {
    label: 'Berry Pouch', category: 'key',
    description: 'A small bag to store berry seeds to plant.',
    buy: 0, sell: 0,
  },
  brokenmicrowave: {
    label: 'Broken Microwave', category: 'key',
    description: 'A broken appliance. Maybe a Pokémon can get into it.',
    buy: 0, sell: 2,
    functional: true,
  },
  brokenfan: {
    label: 'Broken Fan', category: 'key',
    description: 'A broken appliance. Maybe a Pokémon can get into it.',
    buy: 0, sell: 2,
    functional: true,
  },
  brokenfridge: {
    label: 'Broken Refrigerator', category: 'key',
    description: 'A broken appliance. Maybe a Pokémon can get into it.',
    buy: 0, sell: 2,
    functional: true,
  },
  brokenwasher: {
    label: 'Broken Washer', category: 'key',
    description: 'A broken appliance. Maybe a Pokémon can get into it.',
    buy: 0, sell: 2,
    functional: true,
  },
  brokenmower: {
    label: 'Broken Lawn Mower', category: 'key',
    description: 'A broken appliance. Maybe a Pokémon can get into it.',
    buy: 0, sell: 2,
    functional: true,
  },
  brokenlight: {
    label: 'Broken Lightbulb', category: 'key',
    description: 'A broken appliance. Maybe a Pokémon can get into it.',
    buy: 0, sell: 1,
    functional: true,
  },
  unownreport: {
    label: 'Unown Report', category: 'key',
    description: 'An academic paper full of letters, but they are not quite letters...',
    buy: 0, sell: 0,
  },
  gracidea: {
    label: 'Gracidea Flower', category: 'key',
    description: 'A pleasant smelling flower. A certain Pokémon likes it.',
    buy: 0, sell: 1,
    functional: true,
  },
  darkstone: {
    label: 'Dark Stone', category: 'key',
    description: 'A dark stone.',
    buy: 0, sell: 1,
    functional: false,
  },
  lightstone: {
    label: 'Light Stone', category: 'key',
    description: 'A light stone.',
    buy: 0, sell: 1,
    functional: false,
  },
  dnasplicerblack: {
    label: 'DNA Splicers (Black)', category: 'key',
    description: 'An item that splices DNA between Kyurem and Zekrom.',
    buy: 0, sell: 0,
    functional: true,
  },
  dnasplicerwhite: {
    label: 'DNA Splicers (White)', category: 'key',
    description: 'An item that splices DNA between Kyurem and Reshiram.',
    buy: 0, sell: 0,
    functional: true,
  },
  revealglass: {
    label: 'Reveal Glass', category: 'key',
    description: 'A mirror that points to another world.',
    buy: 0, sell: 0,
    functional: true,
  },
  zygardecube: assert<SouvenirContainer>({
    label: 'Zygarde Cube', category: 'key',
    description: 'A box that holds strange lifeforms.',
    buy: 0, sell: 0,
    direct: true, isSouvenirContainer: true,
  }),
  ovalcharm: {
    label: 'Oval Charm', category: 'key',
    description: 'A charm that grants you special permissions in the day care.',
    buy: 0, sell: 0,
  },
  rotoencounter: {
    label: 'Swarms Charm', category: 'key',
    description: 'An upgrade to the Pokédex that lets you find swarms of Pokémon.',
    buy: 0, sell: 0,
  },
  megabracelet: {
    label: 'Mega Bracelet', category: 'key',
    description: `A bracelet with a stone embedded inside. It can help unlock a Pokémon's power.`,
    buy: 0, sell: 0,
  },
  pokemonboxlink: {
    label: 'Bank Account', category: 'key',
    description: 'A valid account for the Pokémon Bank.',
    buy: 0, sell: 0,
  },
  redorb: {
    label: 'Red Orb', category: 'key',
    description: 'An orb that feels volcanic to the touch.',
    battle: true,  buy: 0, sell: 0,
  },
  blueorb: {
    label: 'Blue Orb', category: 'key',
    description: 'An orb that sounds vaguely like the ocean.',
    battle: true,  buy: 0, sell: 0,
  },
  obsidianmeteorite: {
    label: 'Obsidian Meteorite', category: 'key',
    description: 'A rare piece of space rock. Other than that (which itself is significant) it is rather normal.',
      buy: 0, sell: 0, functional: true,
  },
  rigidmeteorite: {
    label: 'Rigid Meteorite', category: 'key',
    description: 'A chipped piece of a space rock. It encourages strength when held by a certain Pokémon.',
      buy: 0, sell: 0, functional: true,
  },
  sturdymeteorite: {
    label: 'Sturdy Meteorite', category: 'key',
    description: 'A strong piece of a space rock. It encourages defense when held by a certain Pokémon.',
      buy: 0, sell: 0, functional: true,
  },
  smoothmeteorite: {
    label: 'Smooth Meteorite', category: 'key',
    description: 'A polished piece of a space rock. It encourages speed when held by a certain Pokémon.',
      buy: 0, sell: 0, functional: true,
  },
  explorerkit: {
    label: 'Explorer Kit', category: 'key',
    description: 'A pickaxe, shovel, and everything you need to travel underground.',
      buy: 0, sell: 0,
  },
  enigmastone: {
    label: 'Enigma Stone', category: 'key',
    description: 'A mysterious stone. It has a mysterious energy inside that calls certain Pokémon to raids.',
      buy: 0, sell: 0,
  },
  trophygardenkey: assert<Lure>({
    label: 'Trophy Garden Key', category: 'key',
    description: 'A key that unlocks the Trophy Garden.',
    buy: 0, sell: 0,
    isLure: true,
  }),
  oddkeystone: assert<SouvenirContainer>({
    label: 'Odd Keystone', category: 'key',
    description: 'A frowning stone. Is it crying?',
    buy: 0, sell: 0,
    direct: true, isSouvenirContainer: true,
  }),
  apricornbox: {
    label: 'Apricorn Box', category: 'key',
    description: 'A box where you can store apricorns you find.',
    buy: 0, sell: 0,
  },
  gogoggles: {
    label: 'Go-Goggles', category: 'key',
    description: 'High-powered goggles that grant you with greater vision than usual.',
    buy: 0, sell: 0,
  },
  colressmchn: assert<Lure>({
    label: 'Colress MCHN', category: 'key',
    description: 'A device that emits a strange radar. It is a prototype, but seems to draw Pokémon towards it.',
      buy: 0, sell: 0,
    isLure: true,
  }),
  // permit: {
  //   label: 'Permit', category: 'key',
  //   description: 'A permit that allows you to travel to the Nature Preserve far from Unova.',
  //     buy: 0, sell: 0,
  //   isLure: true,
  // } as Lure,
  sootsack: assert<SouvenirContainer>({
    label: 'Soot Sack', category: 'key',
    description: 'A bag with which to store volcanic ashes.',
      buy: 0, sell: 0,
    isSouvenirContainer: true,
  }),
  friendsafaripass: assert<Lure>({
    label: 'Friend Safari Pass', category: 'key',
    description: 'A badge with a QR code. When scanned, it grants you entry to the Friend Safari.',
      buy: 0, sell: 0,
    isLure: true,
  }),
  prisonbottle: {
    label: 'Prison Bottle', category: 'key',
    description: 'A glass bottle with a tight stopper. Something might fit inside.',
      buy: 0, sell: 0, functional: true,
  },
  poffincase: {
    label: 'Poffin Case', category: 'key',
    description: 'A two-shelf container for single-serving breads.',
      buy: 0, sell: 0,
  },
  foragebag: assert<SouvenirContainer>({
    label: 'Forage Bag', category: 'key',
    description: 'A bag to hold things you have foraged, and maybe more.',
    buy: 0, sell: 0,
    isSouvenirContainer: true,
  }),
  craftingkit: {
    label: 'Crafting Kit', category: 'key',
    description: 'A hammer and some nails. With these things you can invent the universe.',
    buy: 0, sell: 0,
  },
  voyagepass: {
    label: 'Voyage Pass', category: 'key',
    description: 'A ticket with a QR code. It gives you access to many destinations, all-inclusive.',
    buy: 0, sell: 0,
  },
  zpowerring: {
    label: 'Z-Power Ring', category: 'key',
    description: 'A bracelet that sits on your arm. When paired with a Z-Crystal you can unleash powerful attacks in battle.',
    buy: 0, sell: 0,
  },
  moonflute: {
    label: 'Moon Flute', category: 'key',
    description: 'A flute said to be carved from an old moon rock. It plays softly.',
    buy: 0, sell: 0, functional: true,
  },
  sunflute: {
    label: 'Sun Flute', category: 'key',
    description: 'A flute said to be smelted from the sun. It plays sweetly.',
    buy: 0, sell: 0, functional: true,
  },
  nlunarizer: {
    label: 'N-Lunarizer', category: 'key',
    description: 'An odd gadget that can fuse Necrozma with Lunala.',
    buy: 0, sell: 0, functional: true,
  },
  nsolarizer: {
    label: 'N-Solarizer', category: 'key',
    description: 'An odd gizmo that can fuse Necrozma with Solgaleo.',
    buy: 0, sell: 0, functional: true,
  },
  itemfinder: assert<SouvenirContainer>({
    label: 'Item Finder', category: 'key',
    description: 'A tool that detects metal hidden just below the ground.',
    buy: 0, sell: 0, isSouvenirContainer: true,
  }),
  adrenalineorb: assert<Lure>({
    label: 'Adrenaline Orb', category: 'key',
    description: 'A orb that pesters wild Pokémon. It might attract curious ones who want to investigate.',
    buy: 0, sell: 0, isLure: true,
  }),
  meltanbox: assert<Item>({
    label: 'Mystery Box', category: 'key',
    description: 'A box that smells like copper when opened. It can lure a particular Pokémon if it is in a location.',
    buy: 0, sell: 0,
  }),
  dynamaxband: assert<Item>({
    label: 'Dynamax Band', category: 'key',
    description: 'A piece of fabric wrapped around your arm. A small meteorite is placed inside. It allows your Pokémon to dynamax.',
    buy: 0, sell: 0,
  }),
  rotombike: assert<Lure>({
    label: 'Rotom Bike', category: 'key',
    description: 'A bike combined with the power of Rotom. It makes it easy to traverse the Wild Area of Galar to catch Pokémon.',
    buy: 0, sell: 0, isLure: true,
  }),
  townmap: assert<Item>({
    label: 'Town Map', category: 'key',
    description: 'A high-tech version of the classic atlas. It provides you with a graphical layout of places in the world, along with several toggleable layers. View it in the location dialog.',
    buy: 0, sell: 0,
  }),
  clearbell: assert<Item>({
    label: 'Clear Bell', category: 'key',
    description: 'A pretty bell. This should not be owned by anyone.',
    buy: 0, sell: 0,
  }),
  campinggear: assert<Item>({
    label: 'Camping Gear', category: 'key',
    description: 'A woven basket that lets you hold food and cooking equipment.',
    buy: 0, sell: 0,
  }),
  reinsofunityglacier: assert<Item>({
    label: 'Glacial Reins of Unity', category: 'key',
    description: 'Reins for a mount that are crystal and cold to the touch. It binds Calyrex to Glastrier.',
    buy: 0, sell: 0, functional: true,
  }),
  reinsofunityspectral: assert<Item>({
    label: 'Spectral Reins of Unity', category: 'key',
    description: 'Reins for a mount that are a mesmerizingly dark purple. It binds Calyrex to Spectrier.',
    buy: 0, sell: 0, functional: true,
  }),
  carroticeroot: assert<Item>({
    label: 'Iceroot Carrot', category: 'key',
    description: 'A carrot that grows well in freezing climates. A certain Pokémon was known to enjoy them.',
    buy: 0, sell: 0,
  }),
  carrotshaderoot: assert<Item>({
    label: 'Shaderoot Carrot', category: 'key',
    description: 'A carrot that grows well in the dark. A certain Pokémon was known to enjoy them.',
    buy: 0, sell: 0,
  }),
  voyagecharm: assert<Item>({
    label: 'Voyage Charm', category: 'key',
    description: 'A hidden treasure uncovered in the depths of a voyage. It marks your expertise and serves as an indication you can handle more.',
    buy: 0, sell: 0,
  }),
  teraorb: assert<SouvenirContainer>({
    label: 'Tera Orb', category: 'key',
    description: 'An orb that contains power from an unknown source. When paired with a Tera Crystal, your Pokémon will terastalize.',
    buy: 0, sell: 0, battle: true,
    isSouvenirContainer: true,
  }),
  scarletbook: assert<Item>({
    label: 'Scarlet Book', category: 'key',
    description: 'A book covered in scarlet letting. It appears to document legends of old.',
    buy: 0, sell: 0,
  }),
  violetbook: assert<Item>({
    label: 'Violet Book', category: 'key',
    description: 'A book covered in violet letting. It appears to document predictions of the future.',
    buy: 0, sell: 0,
  }),
  glimmeringcharm: assert<Lure>({
    label: 'Glimmering Charm', category: 'key',
    description: 'A charm that hangs from your neck. It is made from the same material as tera crystals.',
    buy: 0, sell: 0, isLure: true,
  }),
  maskteal: {
    label: 'Teal Mask', category: 'key',
    description: 'A mask which may be held by Ogerpon during fights. Nothing changes when held.',
    buy: 0, sell: 0, battle: true,
  },
  maskcornerstone: {
    label: 'Cornerstone Mask', category: 'key',
    description: 'A mask which may be held by Ogerpon in battle. It is made of Rock-type Tera Shards.',
    buy: 0, sell: 0, battle: true,
  },
  maskhearthflame: {
    label: 'Hearthflame Mask', category: 'key',
    description: 'A mask which may be held by Ogerpon in battle. It is made of Fire-type Tera Shards.',
    buy: 0, sell: 0, battle: true,
  },
  maskwellspring: {
    label: 'Wellspring Mask', category: 'key',
    description: 'A mask which may be held by Ogerpon in battle. It is made of Water-type Tera Shards.',
    buy: 0, sell: 0, battle: true,
  },
  berserkgene: {
    label: 'Berserk Gene', category: 'key',
    description: 'An item raid bosses may hold which draws out a great deal of power. Held by a trainer, it is useless.',
    buy: 0, sell: 0, battle: true,
  },
  // For integration with the page-encounter page
  'catchingcharm-rby': {
    label: 'RBY Catching Charm',
    category: 'key', description: '',
      buy: 0, sell: 0,
  },
  'catchingcharm-gsc': {
    label: 'GSC Catching Charm',
    category: 'key', description: '',
      buy: 0, sell: 0,
  },
  'catchingcharm-rse': {
    label: 'RSE Catching Charm',
    category: 'key', description: '',
      buy: 0, sell: 0,
  },
  'catchingcharm-dppt': {
    label: 'DPPt Catching Charm',
    category: 'key', description: '',
      buy: 0, sell: 0,
  },
  'catchingcharm-bw': {
    label: 'BW Catching Charm',
    category: 'key', description: '',
      buy: 0, sell: 0,
  },
  'catchingcharm-xy': {
    label: 'XY Catching Charm',
    category: 'key', description: '',
      buy: 0, sell: 0,
  },
  'catchingcharm-sm': {
    label: 'SM Catching Charm',
    category: 'key', description: '',
      buy: 0, sell: 0,
  },
  'catchingcharm-swsh': {
    label: 'SwSh Catching Charm',
    category: 'key', description: '',
      buy: 0, sell: 0,
  },
  'catchingcharm-sv': {
    label: 'SV Catching Charm',
    category: 'key', description: '',
      buy: 0, sell: 0,
  },
}

type PokemonMaterialType = 'Claw' | 'Fur' | 'Goo' | 'Hair' | 'Scales' | 'Sweat'
  | 'Toxin' | 'Poison' | 'Spores' | 'Lava' | 'Coal' | 'Fuzz' | 'Nail' | 'Dirt'
  | 'Slime' | 'Feather' | 'Wool' | 'Pearl' | 'Gas' | 'Fluff' | 'Dust' | 'Needle'
  | 'Leaf' | 'Fragment' | 'Husk' | 'Tuft' | 'Screw' | 'Sparks' | 'Gem' | 'Tears'
  | 'Key' | 'Pollen' | 'Powder' | 'Rock' | 'Shell' | 'Scrap' | 'Sand' | 'Mud'
  | 'Parcel' | 'Chip' | 'Thread' | 'Berries' | 'Eyelash' | 'Fang' | 'Juice'
  | 'Spines' | 'Mucus' | 'Stem' | 'Soot' | 'Wax' | 'Tarnish' | 'Seed'
  | 'Salt' | 'Flaps' | 'Down' | 'Whisker' | 'Cream' | 'Flower' | 'Ink' | 'Gel'
  | 'Shard' | 'Mane Hair' | 'Spike' | 'Paint' | 'Teardrop' | 'Stinger' | 'Bauble'

const PokemonMaterial = (species: string, component: PokemonMaterialType): Item => {
  return assert<Item>({
    label: `${species} ${component}`, category: 'material',
    description: `${component} dropped by ${species} and its ilk in the wild. It can be used for crafting.`,
    buy: 0, sell: 1,
  })
}

const ITEMS_MATERIALS = {
  apricorn: APRICORN('brown', 'smells old-fashioned'),
  greenapricorn: APRICORN('green', 'has a mysterious, aromatic scent'),
  redapricorn: APRICORN('red', 'assails your nostrils'),
  blueapricorn: APRICORN('blue', 'smells a bit like grass'),
  yellowapricorn: APRICORN('yellow', 'has an invigorating scent'),
  pinkapricorn: APRICORN('pink', 'has a nice, sweet scent'),
  blackapricorn: APRICORN('black', 'has a scent beyond one\'s experience'),
  whiteapricorn: APRICORN('white', 'does not smell like anything'),
  blacktumblestone: assert<Item>({
    label: 'Black Tumblestone', category: 'material',
    description: 'A black stone that can be used in crafting.',
    buy: 0, sell: 3,  
  }),
  skytumblestone: assert<Item>({
    label: 'Sky Tumblestone', category: 'material',
    description: 'A sky-blue stone that can be used in crafting.',
    buy: 0, sell: 3,  
  }),
  tumblestone: assert<Item>({
    label: 'Tumblestone', category: 'material',
    description: 'A red stone that can be used in crafting.',
    buy: 0, sell: 2,  
  }),
  ironchunk: assert<Item>({
    label: 'Iron Chunk', category: 'material',
    description: 'A hunk of metal that can be bent and shaped to your will.',
    buy: 0, sell: 1,  
  }),
  cakelurebase: assert<Item>({
    label: 'Cake-Lure Base', category: 'material',
    description: 'A lump of dough with a slightly sweet taste. It is meant to be mixed with other items.',
    buy: 2, sell: 1,  
  }),
  sootfootroot: assert<Item>({
    label: 'Sootfoot Root', category: 'material',
    description: 'A dry tuber found growing around.',
    buy: 0, sell: 1,  
  }),
  heartygrains: assert<Item>({
    label: 'Hearty Grains', category: 'material',
    description: 'A few stalks of rice pulled from the ground.',
    buy: 0, sell: 1,  
  }),
  plumpbeans: assert<Item>({
    label: 'Plump Beans', category: 'material',
    description: 'A bean with a surprising amount of bitterness.',
    buy: 0, sell: 1,  
  }),
  dazzlinghoney: assert<Item>({
    label: 'Dazzling Honey', category: 'material',
    description: 'A honeycomb with a sweet taste and scent.',
    buy: 0, sell: 1,  
  }),
  casterfern: assert<Item>({
    label: 'Caster Fern', category: 'material',
    description: 'A short shrub with large leaves.',
    buy: 0, sell: 1,  
  }),
  direshroom: assert<Item>({
    label: 'Direshroom', category: 'material',
    description: 'A bulging orange mushroom which can be used in crafting.',
    buy: 0, sell: 1,  
  }),
  swordcap: assert<Item>({
    label: 'Sword Cap', category: 'material',
    description: 'A red mushroom with many branches that tends to grow in rocky areas.',
    buy: 0, sell: 1,  
  }),
  candytruffle: assert<Item>({
    label: 'Candy Truffle', category: 'material',
    description: 'A sweet treat which is used as the base in crafting some items.',
    buy: 0, sell: 1,   
  }),
  springymushroom: assert<Item>({
    label: 'Springy Mushroom', category: 'material',
    description: 'A mushroom that is very squishy.',
    buy: 0, sell: 1,  
  }),
  sandradish: assert<Item>({
    label: 'Sand Radish', category: 'material',
    description: 'A veggie that grows in harsh conditions. It can be used in crafting.',
    buy: 0, sell: 1,  
  }),
  crunchysalt: assert<Item>({
    label: 'Crunchy Salt', category: 'material',
    description: 'Large blocks of salt that have a pinkish hue.',
    buy: 0, sell: 1,  
  }),
  kingsleaf: assert<Item>({
    label: "King's Leaf", category: 'material',
    description: 'A bold and beautiful yellow flower.',
    buy: 0, sell: 2,  
  }),
  wood: assert<Item>({
    label: "Wood", category: 'material',
    description: 'A dry log that was once a tree. You can craft with it.',
    buy: 0, sell: 1,  
  }),
  // These items exist in PLA but craft to items that aren't useful.
  // See https://serebii.net/legendsarceus/crafting.shtml
  // So it seems unreasonable to include them here.
  bugwort: Placeholder({label: 'Bugwort'}),
  doppelbonnets: Placeholder({label: 'Doppel Bonnets'}),
  ironbarktongue: Placeholder({label: 'Iron Barktongue'}),
  medicinalleek: Placeholder({label: 'Medicinial Leek'}),
  pepupplant: Placeholder({label: 'Pep-Up Plant'}),
  poppod: Placeholder({label: 'Pop Pod'}),
  vivichoke: Placeholder({label: 'Vivichoke'}),
  // TM Machine
  tmm_sandshrew: PokemonMaterial('Sandshrew', 'Claw'),
  tmm_vulpix: PokemonMaterial('Vulpix', 'Fur'),
  tmm_oddish: PokemonMaterial('Oddish', 'Leaf'),
  tmm_diglett: PokemonMaterial('Diglett', 'Dirt'),
  tmm_meowth: PokemonMaterial('Meowth', 'Fur'),
  tmm_growlithe: PokemonMaterial('Growlithe', 'Fur'),
  tmm_slowpoke: PokemonMaterial('Slowpoke', 'Claw'),
  tmm_magnemite: PokemonMaterial('Magnemite', 'Screw'),
  tmm_tentacool: PokemonMaterial('Tentacool', 'Stinger'),
  tmm_doduo: PokemonMaterial('Doduo', 'Down'),
  tmm_seel: PokemonMaterial('Seel', 'Fur'),
  tmm_grimer: PokemonMaterial('Grimer', 'Toxin'),
  tmm_gastly: PokemonMaterial('Gastly', 'Gas'),
  tmm_drowzee: PokemonMaterial('Drowzee', 'Fur'),
  tmm_voltorb: PokemonMaterial('Voltorb', 'Sparks'),
  tmm_exeggcute: PokemonMaterial('Exeggcute', 'Shell'),
  tmm_rhyhorn: PokemonMaterial('Rhyhorn', 'Fang'),
  tmm_horsea: PokemonMaterial('Horsea', 'Ink'),
  tmm_scyther: PokemonMaterial('Scyther', 'Claw'),
  tmm_tauros: PokemonMaterial('Tauros', 'Hair'),
  tmm_magikarp: PokemonMaterial('Magikarp', 'Scales'),
  tmm_lapras: PokemonMaterial('Lapras', 'Teardrop'),
  tmm_eevee: PokemonMaterial('Eevee', 'Fur'),
  tmm_porygon: PokemonMaterial('Porygon', 'Fragment'),
  tmm_dratini: PokemonMaterial('Dratini', 'Scales'),
  tmm_igglybuff: PokemonMaterial('Igglybuff', 'Fluff'),
  tmm_chinchou: PokemonMaterial('Chinchou', 'Sparks'),
  tmm_hoppip: PokemonMaterial('Hoppip', 'Leaf'),
  tmm_mareep: PokemonMaterial('Mareep', 'Wool'),
  tmm_sunkern: PokemonMaterial('Sunkern', 'Leaf'),
  tmm_wooper: PokemonMaterial('Wooper', 'Slime'),
  tmm_murkrow: PokemonMaterial('Murkrow', 'Bauble'),
  tmm_pineco: PokemonMaterial('Pineco', 'Husk'),
  tmm_snubbull: PokemonMaterial('Snubbull', 'Hair'),
  tmm_qwilfish: PokemonMaterial('Qwilfish', 'Spines'),
  tmm_sneasel: PokemonMaterial('Sneasel', 'Claw'),
  teddiursaclaw: PokemonMaterial('Teddiursa', 'Claw'),
  tmm_swinub: PokemonMaterial('Swinub', 'Hair'),
  tmm_delibird: PokemonMaterial('Delibird', 'Parcel'),
  tmm_skarmory: PokemonMaterial('Skarmory', 'Feather'),
  tmm_houndour: PokemonMaterial('Houndour', 'Fang'),
  tmm_phanpy: PokemonMaterial('Phanpy', 'Nail'),
  tmm_stantler: PokemonMaterial('Stantler', 'Hair'),
  tmm_smeargle: PokemonMaterial('Smeargle', 'Paint'),
  tmm_tyrogue: PokemonMaterial('Tyrogue', 'Sweat'),
  tmm_elekid: PokemonMaterial('Elekid', 'Fur'),
  tmm_magby: PokemonMaterial('Magby', 'Hair'),
  tmm_seedot: PokemonMaterial('Seedot', 'Stem'),
  tmm_slakoth: PokemonMaterial('Slakoth', 'Fur'),
  azurillfur: PokemonMaterial('Azurill', 'Fur'),
  tmm_meditite: PokemonMaterial('Meditite', 'Sweat'),
  tmm_makuhita: PokemonMaterial('Makuhita', 'Sweat'),
  tmm_sableye: PokemonMaterial('Sableye', 'Gem'),
  tmm_plusle: PokemonMaterial('Plusle', 'Fur'),
  tmm_minun: PokemonMaterial('Minun', 'Fur'),
  tmm_trapinch: PokemonMaterial('Trapinch', 'Shell'),
  tmm_numel: PokemonMaterial('Numel', 'Lava'),
  tmm_torkoal: PokemonMaterial('Torkoal', 'Coal'),
  tmm_spoink: PokemonMaterial('Spoink', 'Pearl'),
  tmm_cacnea: PokemonMaterial('Cacnea', 'Needle'),
  tmm_zangoose: PokemonMaterial('Zangoose', 'Claw'),
  tmm_swablu: PokemonMaterial('Swablu', 'Fluff'),
  tmm_corphish: PokemonMaterial('Corphish', 'Shell'),
  tmm_barboach: PokemonMaterial('Barboach', 'Slime'),
  tmm_tropius: PokemonMaterial('Tropius', 'Leaf'),
  tmm_feebas: PokemonMaterial('Feebas', 'Scales'),
  tmm_shuppet: PokemonMaterial('Shuppet', 'Scrap'),
  tmm_luvdisc: PokemonMaterial('Luvdisc', 'Scales'),
  tmm_snorunt: PokemonMaterial('Snorunt', 'Fur'),
  tmm_beldum: PokemonMaterial('Beldum', 'Claw'),
  tmm_starly: PokemonMaterial('Starly', 'Feather'),
  tmm_buizel: PokemonMaterial('Buizel', 'Fur'),
  tmm_cranidos: PokemonMaterial('Cranidos', 'Spike'),
  tmm_shieldon: PokemonMaterial('Shieldon', 'Claw'),
  tmm_shellos: PokemonMaterial('Shellos', 'Mucus'),
  tmm_pachirisu: PokemonMaterial('Pachirisu', 'Fur'),
  tmm_happiny: PokemonMaterial('Happiny', 'Dust'),
  tmm_bonsly: PokemonMaterial('Bonsly', 'Tears'),
  tmm_bronzor: PokemonMaterial('Bronzor', 'Fragment'),
  tmm_croagunk: PokemonMaterial('Croagunk', 'Poison'),
  tmm_hippopotas: PokemonMaterial('Hippopotas', 'Sand'),
  tmm_spiritomb: PokemonMaterial('Spiritomb', 'Fragment'),
  tmm_gible: PokemonMaterial('Gible', 'Scales'),
  tmm_finneon: PokemonMaterial('Finneon', 'Scales'),
  tmm_riolu: PokemonMaterial('Riolu', 'Fur'),
  tmm_snover: PokemonMaterial('Snover', 'Berries'),
  tmm_blitzle: PokemonMaterial('Blitzle', 'Mane Hair'),
  tmm_drilbur: PokemonMaterial('Drilbur', 'Claw'),
  tmm_sewaddle: PokemonMaterial('Sewaddle', 'Leaf'),
  tmm_timburr: PokemonMaterial('Timburr', 'Sweat'),
  tmm_cottonee: PokemonMaterial('Cottonee', 'Fluff'),
  tmm_petilil: PokemonMaterial('Petilil', 'Leaf'),
  tmm_basculin: PokemonMaterial('Basculin', 'Fang'),
  tmm_zorua: PokemonMaterial('Zorua', 'Fur'),
  tmm_scraggy: PokemonMaterial('Scraggy', 'Sweat'),
  tmm_minccino: PokemonMaterial('Minccino', 'Fur'),
  tmm_solosis: PokemonMaterial('Solosis', 'Gel'),
  tmm_gothita: PokemonMaterial('Gothita', 'Eyelash'),
  tmm_foongus: PokemonMaterial('Foonguss', 'Spores'),
  tmm_joltik: PokemonMaterial('Joltik', 'Thread'),
  tmm_golett: PokemonMaterial('Golett', 'Shard'),
  tmm_cubchoo: PokemonMaterial('Cubchoo', 'Fur'),
  tmm_axew: PokemonMaterial('Axew', 'Scales'),
  tmm_rufflet: PokemonMaterial('Rufflet', 'Feather'),
  tmm_larvesta: PokemonMaterial('Larvesta', 'Fuzz'),
  tmm_scatterbug: PokemonMaterial('Scatterbug', 'Powder'),
  tmm_fletchling: PokemonMaterial('Fletchling', 'Feather'),
  tmm_litleo: PokemonMaterial('Litleo', 'Tuft'),
  tmm_skiddo: PokemonMaterial('Skiddo', 'Leaf'),
  tmm_espurr: PokemonMaterial('Espurr', 'Fur'),
  tmm_inkay: PokemonMaterial('Inkay', 'Ink'),
  tmm_flabebe: PokemonMaterial('Flabébé', 'Pollen'),
  tmm_dedenne: PokemonMaterial('Dedenne', 'Fur'),
  tmm_klefki: PokemonMaterial('Klefki', 'Key'),
  tmm_goomy: PokemonMaterial('Goomy', 'Goo'),
  tmm_noibat: PokemonMaterial('Noibat', 'Fur'),
  tmm_pikipek: PokemonMaterial('Pikipek', 'Feather'),
  tmm_dewpider: PokemonMaterial('Dewpider', 'Thread'),
  tmm_comfey: PokemonMaterial('Comfey', 'Flower'),
  tmm_minior: PokemonMaterial('Minior', 'Shell'),
  tmm_crabrawler: PokemonMaterial('Crabrawler', 'Shell'),
  tmm_oricorio: PokemonMaterial('Oricorio', 'Feather'),
  tmm_rockruff: PokemonMaterial('Rockruff', 'Rock'),
  tmm_bounsweet: PokemonMaterial('Bounsweet', 'Sweat'),
  tmm_fomantis: PokemonMaterial('Fomantis', 'Leaf'),
  tmm_mimikyu: PokemonMaterial('Mimikyu', 'Scrap'),
  tmm_komala: PokemonMaterial('Komala', 'Claw'),
  tmm_sandyghast: PokemonMaterial('Sandyghast', 'Sand'),
  tmm_mudbray: PokemonMaterial('Mudbray', 'Mud'),
  tmm_salandit: PokemonMaterial('Salandit', 'Gas'),
  tmm_jangmoo: PokemonMaterial('Jangmo-o', 'Scales'),
  tmm_skwovet: PokemonMaterial('Skwovet', 'Fur'),
  tmm_rookidee: PokemonMaterial('Rookidee', 'Feather'),
  tmm_chewtle: PokemonMaterial('Chewtle', 'Claw'),
  tmm_rolycoly: PokemonMaterial('Rolycoly', 'Coal'),
  tmm_milcery: PokemonMaterial('Milcery', 'Cream'),
  tmm_snom: PokemonMaterial('Snom', 'Thread'),
  tmm_silicobra: PokemonMaterial('Silicobra', 'Sand'),
  tmm_arrokuda: PokemonMaterial('Arrokuda', 'Scales'),
  tmm_applin: PokemonMaterial('Applin', 'Juice'),
  tmm_toxel: PokemonMaterial('Toxel', 'Sparks'),
  tmm_hatenna: PokemonMaterial('Hatenna', 'Dust'),
  tmm_impidimp: PokemonMaterial('Impidimp', 'Hair'),
  tmm_sinistea: PokemonMaterial('Sinistea', 'Chip'),
  tmm_falinks: PokemonMaterial('Falinks', 'Sweat'),
  tmm_pincurchin: PokemonMaterial('Pincurchin', 'Spines'),
  tmm_indeedee: PokemonMaterial('Indeedee', 'Fur'),
  tmm_duraludon: PokemonMaterial('Duraludon', 'Tarnish'),
  tmm_lechonk: PokemonMaterial('Lechonk', 'Hair'),
  tmm_pawmi: PokemonMaterial('Pawmi', 'Hair'),
  tmm_wattrel: PokemonMaterial('Wattrel', 'Feather'),
  tmm_charcadet: PokemonMaterial('Charcadet', 'Soot'),
  tmm_greavard: PokemonMaterial('Greavard', 'Wax'),
  tmm_orthworm: PokemonMaterial('Orthworm', 'Tarnish'),
  tmm_tadbulb: PokemonMaterial('Tadbulb', 'Mucus'),
  tmm_capsakid: PokemonMaterial('Capsakid', 'Seed'),
  tmm_klawf: PokemonMaterial('Klawf', 'Claw'),
  tmm_tinkatink: PokemonMaterial('Tinkatink', 'Hair'),
  tmm_nacli: PokemonMaterial('Nacli', 'Salt'),
  tmm_toedscool: PokemonMaterial('Toedscool', 'Flaps'),
  tmm_tandemaus: PokemonMaterial('Tandemaus', 'Fur'),
  tmm_fidough: PokemonMaterial('Fidough', 'Fur'),
  tmm_wiglett: PokemonMaterial('Wiglett', 'Sand'),
  tmm_squawkabilly: PokemonMaterial('Squawkabilly', 'Feather'),
  tmm_finizen: PokemonMaterial('Finizen', 'Mucus'),
  tmm_flittle: PokemonMaterial('Flittle', 'Down'),
  tmm_bombirdier: PokemonMaterial('Bombirdier', 'Feather'),
  tmm_tatsugiri: PokemonMaterial('Tatsugiri', 'Scales'),
  tmm_dondozo: PokemonMaterial('Dondozo', 'Whisker'),
  tmm_frigibax: PokemonMaterial('Frigibax', 'Scales'),
}

function GalarIngredient(label: string, suffix: string): Item {
  return {
    label, category: 'cooking',
    description: `An item to use for making curry. ${suffix}`,
    buy: 0, sell: 2,
  }
}

function GalarCurry(label: string, prefix: string, type: Type | string, longevity = false): Bait {
  return {
    label, category: 'bait',
    description: `${prefix} When you place it out in the wild, ${type}-type Pokémon may eat it.`,
    buy: 0, sell: longevity ? 20 : 16,
    consumption: longevity ? 3 : 2,
  }
}

function Poffin(label: string, description: string): Bait {
  return {
    label, category: 'bait',
    description,
    buy: 0, sell: 5, consumption: 2,
  }
}

function HisuiCake(label: string, sensory: string): Bait {
  return {
    label, category: 'bait',
    description: `A cake from a historic recipe. Its ${sensory} attracts certain Pokémon.`,
    buy: 0, sell: 8, consumption: 4,
  }
}

function PokePuff(label: string, suffix: string): Bait {
  return {
    label, category: 'bait',
    description: `A baked pastry covered in ${suffix}.`,
    buy: 0, sell: 8, consumption: 4,
  }
}

function PaldeaCondiment(item: Partial<Item>): Item {
  return {
    category: 'cooking',
    buy: 0, sell: 3,
    description: 'A condiment that spreads on top of a sandwich.',
    label: item.label!,
    ...item,
  }
}

function PaldeaIngredient(item: Partial<Item>): Item {
  return {
    category: 'cooking',
    buy: 0, sell: 4,
    description: 'An ingredient that can fit in a sandwich.',
    label: item.label!,
    ...item,
  }
}

function PaldeaSandwich(label: string, item: Partial<Bait>): Bait {
  return {
    label, category: 'bait',
    description: 'A sandwich made of common ingredients, seasoned to perfection. Wild Pokémon may enjoy eating it.',
    buy: 0, sell: 7, consumption: 5,
    ...item,
  }
}

function SleepIngredient(label: string, item: Partial<Item | Berry>): Item {
  return {
    label, category: 'cooking',
    description: 'An ingredient that can go into a salad.',
    buy: 0, sell: 2,
    ...item,
  }
}

function SleepSalad(label: string, item: Partial<Bait>): Bait {
  return {
    label: `${label} Salad`, category: 'bait',
    description: 'A salad made of common greens and drenched in dressing. Wild Pokémon may enjoy eating it but it will make them drowzy.',
    buy: 0, sell: 15, consumption: 5,
    ...item,
  }
}

const ITEMS_INGREDIENTS = {
  // POFFINS
  poffinspicy: Poffin('Spicy Poffin',
    'A poffin blended with spices that give it a red coloration.'),
  poffindry: Poffin('Dry Poffin',
    'A poffin blended with blue herbs that appear to suck the water out of your mouth.'),
  poffinsweet: Poffin('Sweet Poffin',
    'A poffin covered in a pink frosting which is almost too sweet to bear.'),
  poffinbitter: Poffin('Bitter Poffin',
    'A poffin mixed with green herbs and kale for some reason. It is really bitter.'),
  poffinsour: Poffin('Sour Poffin',
    "A poffin served with yellow lemon zest. You can't help puckering up after a taste."),
  // POKEPUFFS
  pokepuffsweet: PokePuff('Sweet PokéPuff', 'pink frosting to give it extra sweetness'),
  pokepuffmint: PokePuff('Mint PokéPuff', 'a minty green cream to draw out the fresh flavor'),
  pokepuffcitrus: PokePuff('Citrus PokéPuff', 'orange juice to draw out the tangy flavor'),
  pokepuffmocha: PokePuff('Mocha PokéPuff', 'a brown mocha flavor to draw out the flavor'),
  pokepuffspice: PokePuff('Spicy PokéPuff', 'black pepper icing on top to draw out a spicy flavor'),
  // Galar ingredients
  sausages: GalarIngredient('Sausages', 'Make sure to boil them first.'),
  bobsfoodtin: GalarIngredient("Bob's Food Tin", 'A can of food. Who is Bob?'),
  bachsfoodtin: GalarIngredient("Bach's Food Tin", 'A box of dried food. Who is Bach?'),
  tinofbeans: GalarIngredient('Tin of Beans', 'An assortment of colorful beans.'),
  bread: GalarIngredient('Bread', 'It is fresh and smells great.'),
  pasta: GalarIngredient('Pasta', 'Long thin noodles.'),
  mixedmushrooms: GalarIngredient('Mixed Mushrooms', 'A package of mushrooms that remind you of Pokémon.'),
  smokepoketail: GalarIngredient('Smoke-Poke Tail', 'A thick jerky that tastes unbelievable.'),
  largeleek: GalarIngredient('Large Leek', "Farfetch'd seem to like carrying these around."),
  fancyapple: GalarIngredient('Fancy Apple', 'A clean, ripe apple. No worms are hiding inside.'),
  brittlebones: GalarIngredient('Brittle Bones', 'Old bones with a bit of meat left on them.'),
  packofpotatoes: GalarIngredient('Pack of Potatoes', 'Rough spuds that just came from the ground.'),
  pungentroot: GalarIngredient('Pungent Root', 'A plant with a foul smell but can serve as a fine garnish.'),
  saladmix: GalarIngredient('Salad Mix', 'A combination of greens.'),
  friedfood: GalarIngredient('Fried Food', 'A package of food that has already been fried and gives a loud crunch.'),
  boiledegg: GalarIngredient('Boiled Egg', 'This is a single hard-boiled egg.'),
  fruitbunch: GalarIngredient('Fruit Bunch', 'A sweet fruit salad.'),
  moomoocheese: GalarIngredient('Moomoo Cheese', 'A creamy cheese that melts easily.'),
  spicemix: GalarIngredient('Spice Mix', 'A bottle of seasoning which draws out the flavor.'),
  freshcream: GalarIngredient('Fresh Cream', 'A bottle of cream from the farm.'),
  packagedcurry: GalarIngredient('Packaged Curry', 'A box of instant curry. Just add water.'),
  coconutmilk: GalarIngredient('Coconut Milk', 'A box of milk that comes from a Pokémon in Alola.'),
  instantnoodles: GalarIngredient('Instant Noodles', 'A packet of noodles that just require some boiling.'),
  precookedburger: GalarIngredient('Precooked Burger', 'A patty of unspecified origins. It has been burned beyond recognition.'),
  gigantamix: GalarIngredient('Gigantamix', 'A rare Galar ingredient that does some surprising things to meal.'),
  // CURRIES: https://www.serebii.net/swordshield/currydex.shtml
  curryspicysausage: GalarCurry('Spicy Sausage Curry', 'A spicy meal with a strong umami flavor.', 'Fire'),
  currydryjuicy: GalarCurry('Dry Juicy Curry', 'A paradoxically dry and oily flavor.', 'Water'),
  currysweetrich: GalarCurry('Sweet Rich Curry', 'It is unbearably sweet.', 'Fairy'),
  currybitterbean: GalarCurry('Bitter Bean Curry', 'The bitterness cancels out the flavor of the beans.', 'Ground'),
  currysourtoast: GalarCurry('Sour Toast Curry', 'Well-browned bread covered in a sour citrus jam.', 'Flying'),
  curryspicypasta: GalarCurry('Spicy Pasta Curry', 'A pasta with a spicy tomato sauce.', 'Rock'),
  currydrymushroom: GalarCurry('Dry Mushroom Curry', 'A mixture of mushrooms bring out a mild dry flavor', 'Poison'),
  currysweetsmokedtail: GalarCurry('Sweet Smoked-Tail Curry', 'A pleasant baked dish with a rich fragrant smell.', 'Psychic'),
  currybitterleek: GalarCurry('Bitter Leek Curry', 'A curry that draws out the natural bitterness of the leek.', 'Fighting'),
  currysourapple: GalarCurry('Sour Apple Curry', 'A curry that highlights a single sour red apple.', 'Dragon'),
  curryspicybone: GalarCurry('Spicy Bone Curry', 'Old bones are covered in a spicy sauce to maximize flavor.', 'Ghost'),
  currydryplentyofpotato: GalarCurry('Plenty-of-Potato Curry', 'Baked potatoes covered in a thick dry curry roux.', 'Normal'),
  currysweetherb: GalarCurry('Sweet Herb Medley Curry', 'A mix of sweet winter herbs mix well together with a dressing.', 'Bug'),
  currybittersalad: GalarCurry('Bitter Salad Curry', 'Bitter greens are coverd in a mild dressing to make them edible.', 'Grass'),
  currysourfriedfood: GalarCurry('Sour Fried-Food Curry', 'Overcooked food brings out a sour greasy aftertaste.', 'Electric'),
  curryspicyboiledegg: GalarCurry('Spicy Boiled-Egg Curry', 'Crack open the egg and taste a spicy filling inside.', 'Dark'),
  currydrytropical: GalarCurry('Dry Tropical Curry', 'A dry seasoning compliments the otherwise sweet fruits.', 'Ice'),
  currysweetcheesecovered: GalarCurry('Sweet Cheese-Covered Curry', 'A sweet melted cheese blend covers the entire plate.', 'Steel'),
  currybitterseasoned: GalarCurry('Bitter Seasoned Curry', 'An otherwise plain curry covered in bitter spices.', 'Bulky', true),
  currysourwhippedcream: GalarCurry('Sour Whipped-Cream Curry', 'A sour cream whipped into a frenzy has a unique taste.', 'Spongy', true),
  curryspicydecorative: GalarCurry('Spicy Decorative Curry', 'A cute pattern on top hides its very sour roux.', 'Fast', true),
  currydrycoconut: GalarCurry('Dry Coconut Curry', 'Coconut milk is used to add a bit of sweetness to an otherwise dry roux.', 'Wary', true),
  currysweetinstantnoodle: GalarCurry('Sweet Instant-Noodle Curry', 'Instant noodles and their artifical flavoring are accented by a naturally sweet roux.', 'Magical', true),
  currybitterburgersteak: GalarCurry('Bitter Burger-Steak Curry', 'Overdone meats are blended together in a roux to make them edible.', 'Strong', true),
  currygigantamax: GalarCurry('Gigantamax Curry', 'A massive hunk of curry with overflowing umami flavor.', 'Dragon', true),
  // HISUI CAKES
  cakemushroom: HisuiCake('Mushroom Cake', 'mushroomy texture'),
  cakehoney: HisuiCake('Honey Cake', 'honey flavor'),
  cakegrain: HisuiCake('Grain Cake', 'grainy texture'),
  cakebean: HisuiCake('Bean Cake', 'beany scent'),
  cakesalt: HisuiCake('Salt Cake', 'salty flavor'),
  // PALDEA SANDWICH INGREDIENTS: https://serebii.net/scarletviolet/sandwich.shtml
  svibaguette: PaldeaCondiment({ label: 'Baguette' }),
  svcmayonnaise: PaldeaCondiment({ label: 'Mayonnaise' }),
  svcketchup: PaldeaCondiment({ label: 'Ketchup' }),
  svcmustard: PaldeaCondiment({ label: 'Mustard' }),
  svcbutter: PaldeaCondiment({ label: 'Butter' }),
  svcpeanutbutter: PaldeaCondiment({ label: 'Peanut Butter' }),
  svcchilisauce: PaldeaCondiment({ label: 'Chili Sauce' }),
  svcsalt: PaldeaCondiment({ label: 'Salt' }),
  svcpepper: PaldeaCondiment({ label: 'Pepper' }),
  svcyogurt: PaldeaCondiment({ label: 'Yogurt' }),
  svcwhippedcream: PaldeaCondiment({ label: 'Whipped Cream' }),
  svccreamcheese: PaldeaCondiment({ label: 'Cream Cheese' }),
  svcjam: PaldeaCondiment({ label: 'Jam' }),
  svcmarmalade: PaldeaCondiment({ label: 'Marmalade' }),
  svcoliveoil: PaldeaCondiment({ label: 'Olive Oil' }),
  svcvinegar: PaldeaCondiment({ label: 'Vinegar' }),
  svhmsweet: PaldeaCondiment({ label: 'Sweet Herba Mystica', sell: 9, description: 'A legendary condiment that is the epitome of sweetness.' }),
  svhmsalty: PaldeaCondiment({ label: 'Salty Herba Mystica', sell: 9, description: 'A legendary condiment that is the epitome of saltiness.' }),
  svhmsour: PaldeaCondiment({ label: 'Sour Herba Mystica', sell: 9, description: 'A legendary condiment that is the epitome of sourness.' }),
  svhmbitter: PaldeaCondiment({ label: 'Bitter Herba Mystica', sell: 9, description: 'A legendary condiment that is the epitome of bitterness.' }),
  svhmspicy: PaldeaCondiment({ label: 'Spicy Herba Mystica', sell: 9, description: 'A legendary condiment that is the epitome of spiciness.' }),
  svilettuce: PaldeaIngredient({ label: 'Lettuce', description: 'Leafs of bitter lettuce that gives a crunch to sandwiches.'}),
  svitomato: PaldeaIngredient({ label: 'Tomato', description: 'A tart ingredient for a sandwich with a savory texture.' }),
  svicherrytomato: PaldeaIngredient({ label: 'Cherry Tomatoes', description: 'Small tart sandwich ingredients that are just as savory as their larger cousins.' }),
  svicucumber: PaldeaIngredient({ label: 'Cucumber', description: 'A mildly bitter sandwich ingredient with a strong veggie taste.' }),
  svipickle: PaldeaIngredient({ label: 'Pickle', description: 'A sour ingredient for sandwiches made from pickling cucumbers overnight.' }),
  svionion: PaldeaIngredient({ label: 'Onion', description: 'Chopped onions can draw out a mild spice flavor on your sandwiches.' }),
  svionionred: PaldeaIngredient({ label: 'Red Onion', description: 'Chopped onions with a mild sweet flavor.' }),
  svibellpeppergreen: PaldeaIngredient({ label: 'Green Bell Pepper', description: 'Slices of peppers can give a sandwich a slight bitter flavor.' }),
  svibellpepperred: PaldeaIngredient({ label: 'Red Bell Pepper', description: 'Slices of pepper with a bit of bitterness to give a kick to sandwiches.' }),
  svibellpepperyellow: PaldeaIngredient({ label: 'Yellow Bell Pepper', description: 'A bright pepper which can give a bit of color to your sandwiches. It is a little bitter.' }),
  sviavocado: PaldeaIngredient({ label: 'Avocado', description: 'A good thing to spread on your toast. It gives sandwiches a rich flavor.' }),
  svibacon: PaldeaIngredient({ label: 'Bacon', description: 'A salty strip of meat and fat that gives sandwiches a good flavor.' }),
  sviham: PaldeaIngredient({ label: 'Ham', description: 'Thin slices of meat give sandwiches a salty flavor. Do not ask where the ham comes from.' }),
  sviprosciutto: PaldeaIngredient({ label: 'Prosciutto', description: 'Ham which is cured but not cooked, giving sandwiches a salty and fresh flavor.' }),
  svichorizo: PaldeaIngredient({ label: 'Chorizo', description: 'A salty sausage with a bit of spiciness too. It goes well on a sandwich' }),
  svisausage: PaldeaIngredient({ label: 'Herbed Sausage', description: 'A sausage baked with herbs to draw out a bitterness in your sandwich.' }),
  svihamburger: PaldeaIngredient({ label: 'Hamburger', description: 'A salty and savory beef patty. It is cooked to perfection.' }),
  sviklawfstick: PaldeaIngredient({ label: 'Klawf Stick', description: 'A sweet and salty snack which comes from the shells of Klawf after they are shed.' }),
  svismokedfillet: PaldeaIngredient({ label: 'Smoked Fillet', description: 'This fillet gives sandwiches a strong smokey flavor.' }),
  svifriedfillet: PaldeaIngredient({ label: 'Fried Fillet', description: 'Fillet placed in batter and cooked in oil gives sandwiches a lot of crunch.' }),
  sviegg: PaldeaIngredient({ label: 'Egg', description: 'An egg, hard-boiled, gives sandwiches a lot of protein.' }),
  svitortilla: PaldeaIngredient({ label: 'Potato Tortilla', description: 'A potato is flattened and baked to make it suitable for sandwiches. It is quite salty.' }),
  svitofu: PaldeaIngredient({ label: 'Tofu', description: 'A mildly sweet block of soy which could fit in a sandwich if necessary.' }),
  svirice: PaldeaIngredient({ label: 'Rice', description: 'A clump of rice can be dropped in a sandwich to give it a mildly sweet flavor.' }),
  svinoodles: PaldeaIngredient({ label: 'Noodles', description: 'After cooking, these noodles can give a sandwich a salty flavor.' }),
  svipotatosalad: PaldeaIngredient({ label: 'Potato Salad', description: 'Potatos can be mixed with mayo and be served along with a sandwich. Can it go in the sandwich?' }),
  svicheese: PaldeaIngredient({ label: 'Cheese', description: 'A salty slice of cheese can be placed in a sandwich.' }),
  svibanana: PaldeaIngredient({ label: 'Banana', description: 'Cut up pieces of banana can give a sandwich a very sweet flavor.' }),
  sviapple: PaldeaIngredient({ label: 'Apple', description: 'Pieces of apple are sliced into thin layers to give sandwiches a sweet flavor.' }),
  svikiwi: PaldeaIngredient({ label: 'Kiwi', description: 'Pieces of kiwi can give a sandwich a tart and sweet flavor.' }),
  svipineapple: PaldeaIngredient({ label: 'Pineapple', description: 'A tart citrus fruit which comes from a tropical region.' }),
  svistrawberry: PaldeaIngredient({ label: 'Strawberry', description: 'A sweet berry that comes up in small bunches.' }),
  svijalapeno: PaldeaIngredient({ label: 'Jalapeno', description: 'A pepper with an intense amount of spiciness.' }),
  svchorseradish: PaldeaCondiment({ label: 'Horseradish', description: "A condiment with an intense spicy flavor. It isn't for everyone." }),
  svccurrypowder: PaldeaCondiment({ label: 'Curry Powder', description: 'A powder made from dried herbs which gives it a potent spiciness. Be careful.' }),
  svcwasabi: PaldeaCondiment({ label: 'Wasabi', description: 'A condiment that is as spicy as horseradish but has superior flavor.' }),
  sviwatercress: PaldeaIngredient({ label: 'Watercress', description: "A highly bitter herb that only needs a few sprigs to give sandwiches a distinct flavor. It isn't for everyone." }),
  svibasil: PaldeaIngredient({ label: 'Basil', description: 'A bitter herb that only needs a few sprigs to give sandwiches a distinct flavor. It pairs well with tomatoes.' }),
  // SV Sandwiches
  svscheese: PaldeaSandwich('Cheese Sandwich', { description: 'A sandwich with creamy cheese, simple yet tasty.' }),
  svstofu: PaldeaSandwich('Tofu Sandwich', { description: 'A sandwich with blocks of tofu, simple yet tasty.' }),
  svsherbsausage: PaldeaSandwich('Herbed-Sausage Sandwich', { description: 'A sandwich with pieces of seasoned meat, simple yet tasty.' }),
  svsegg: PaldeaSandwich('Egg Sandwich', { description: 'A sandwich with hard-boiled eggs, simple yet tasty.' }),
  svspickle: PaldeaSandwich('Pickle Sandwich', { description: 'A sandwich with pickles, simple yet tasty.' }),
  svsnoodle: PaldeaSandwich('Noodle Sandwich', { description: 'A sandwich made with wet noodles. Why?' }),
  svsnouveau: PaldeaSandwich('Nouveau Veggie Sandwich', { description: 'A sandwich full of flavorful veggies.' }),
  svspotatosalad: PaldeaSandwich('Great Potato Salad Sandwich', { description: 'A sandwich made of potatos and other veggies.' }),
  svssmoky: PaldeaSandwich('Smoky Sandwich', { description: 'A sandwich with smoked filet which dances on the tongue.' }),
  svssushi: PaldeaSandwich('Sushi Sandwich', { description: 'When you bite into this sandwich you get a lot of fishy flavor.' }),
  svshamburger: PaldeaSandwich('Hamburger Patty Sandwich', { description: 'The hamburger patty gives this sandwich a savory flavor.' }),
  svshefty: PaldeaSandwich('Hefty Sandwich', { description: 'A sandwich with a mix of rich carbs.' }),
  svsvegetable: PaldeaSandwich('Vegetable Sandwich', { description: 'A sandwich with juicy veggies.' }),
  svsklawf: PaldeaSandwich('Klawf Claw Sandwich', { description: 'A crunchy sandwich full of ingredients of dubious origin.' }),
  svsdecadent: PaldeaSandwich('Decadent Sandwich', { description: 'A tasty sandwich with rich flavor and expensive ingredients.' }),
  svsavocado: PaldeaSandwich('Avocado Sandwich', { description: 'A flavorful sandwich by those who live on the west coast, on any west coast.' }),
  svsjambon: PaldeaSandwich('Jambon-Beurre', { description: 'A sandwich made with ham and butter, simple yet tasty.' }),
  svsblt: PaldeaSandwich('BLT Sandwich', { description: 'A classic sandwich with common tastes.' }),
  svsuvariety: PaldeaSandwich('Ultra Variety Sandwich', { description: 'A hefty sandwich with a variety of palatable flavors.', sell: 30, shiny: 3 }),
  svsutower: PaldeaSandwich('Ultra Tower Sandwich', { description: 'This hefty sandwich does its best to contain its many ingredients.', sell: 30, shiny: 3 }),
  svsurefreshing: PaldeaSandwich('Ultra Refreshing Sandwich', { description: 'A hefty sandwich full of rich vegetable flavor.', sell: 30, shiny: 3 }),
  svsuegg: PaldeaSandwich('Ultra Egg Sandwich', { description: 'An egg sandwich with a handful of other ingredients to create a rich flavor.', sell: 30, shiny: 3 }),
  svscurryrice: PaldeaSandwich('Ultra Curry-and-Rice-style Sandwich', { description: 'A hefty sandwich with a kick of flavor.', sell: 30, shiny: 3 }),
  svsumarmalade: PaldeaSandwich('Ultra Marmalade Sandwich', { description: 'A sandwich with a bit of saltiness but otherwise fantastically balanced.', sell: 30, shiny: 3 }),
  svsunouveau: PaldeaSandwich('Ultra Nouveau Veggie Sandwich', { description: 'A sandwich that is savory, bitter, and sweet.', sell: 30, shiny: 3 }),
  svsuhefty: PaldeaSandwich('Ultra Hefty Sandwich', { description: 'A sandwich full of heavy carbs. Plan for a nap after eating.', sell: 30, shiny: 3 }),
  svsubocadillo: PaldeaSandwich('Ultra Classic Bocadillo', { description: 'A fantastic sandwich if you like veggies.', sell: 30, shiny: 3 }),
  svsudecadent: PaldeaSandwich('Ultra Decadent Sandwich', { description: 'A delicious and hefty sandwich with only the best ingredients.', sell: 30, shiny: 3 }),
  svsuhamburger: PaldeaSandwich('Ultra Hamburger Patty Sandwich', { description: 'A hefty sandwich with a great deal of savory flavor.', sell: 30, shiny: 3 }),
  svsucurrynoodle: PaldeaSandwich('Ultra Curry-and-Noodle Sandwich', { description: 'A hefty sandwich stocked to the brim with ingredients.', sell: 30, shiny: 3 }),
  svsuzesty: PaldeaSandwich('Ultra Zesty Sandwich', { description: 'A hefty sandwich that, as you bite it, it bites back.', sell: 30, shiny: 3 }),
  svslbitter: PaldeaSandwich('Ultra Bitter Sandwich', { description: 'A hefty sandwich which has the bitterest flavor possible.', sell: 30, shiny: 3 }),
  svsusushi: PaldeaSandwich('Ultra Sushi Sandwich', { description: 'A sandwich dreamed up by a sushi aficionado. It is stuffed to the brim with flavor.', sell: 30, shiny: 3 }),
  svsuklawf: PaldeaSandwich('Ultra Klawf Claw Sandwich', { description: 'A hefty sandwich with great flavors and a dubious crunch.', sell: 30, shiny: 3 }),
  svsuspicysweet: PaldeaSandwich('Ultra Spicy-Sweet Sandwich', { description: 'A perfect blend of spicy and sweet flavoring.', sell: 30, shiny: 3 }),
  svsublt: PaldeaSandwich('Ultra BLT Sandwich', { description: 'The perfect BLT in every way.', sell: 30, shiny: 3 }),
  svspb: PaldeaSandwich('Peanut Butter Sandwich', { description: 'A sticky and sweet sandwich full of nostalgia.' }),
  svsupickle: PaldeaSandwich('Great Pickle Sandwich', { description: 'A slightly grown-up pickle sandwich.' }),
  svsdessert: PaldeaSandwich('Great Dessert Sandwich', { description: 'A sandwich full of sweet flavoring.' }),
  svsufruit: PaldeaSandwich('Ultra Fruit Sandwich', { description: 'A sandwich littered with fruit, drawing out a sweet taste.', sell: 30 }),
  svsufivealarm: PaldeaSandwich('Ultra Five-Alarm Sandwich', { description: 'A sandwich that is incredibly spicy. Not for everyone.', sell: 30 }),
  svsudessert: PaldeaSandwich('Ultra Dessert Sandwich', { description: 'Move aside ice cream! This is the sweetest sandwich one can make!', sell: 30 }),
  // Sleep Ingredients
  sleepislowpoke: SleepIngredient('Slowpoke Tail', {}),
  sleepifieryherb: SleepIngredient('Fiery Herb', {buy: 5, growTime: 32, yield: {min: 2, max: 3}}),
  sleepipureoil: SleepIngredient('Pure Oil', {buy: 3}),
  sleepimushroom: SleepIngredient('Tasty Mushroom', {buy: 5, growTime: 32, yield: {min: 2, max: 3}}),
  sleepitomato: SleepIngredient('Snoozy Tomato', {buy: 6, growTime: 96, yield: {min: 3, max: 5}}),
  sleepimilk: SleepIngredient('Moomoo Milk', {}),
  sleepibeansausage: SleepIngredient('Bean Sausage', {buy: 3}),
  sleepipotato: SleepIngredient('Soft Potato', {buy: 6, growTime: 96, yield: {min: 3, max: 5}}),
  // sleepiegg: SleepIngredient('Fancy Egg', {}), // <-- We have this from Galar (boiledegg)
  // sleepiapple: SleepIngredient('Fancy Apple', {}), // <-- We have this from Galar (fancyapple)
  sleepisoybeans: SleepIngredient('Greengrass Soybeans', {buy: 5, growTime: 32, yield: {min: 2, max: 3}}),
  sleepiginger: SleepIngredient('Warming Ginger', {buy: 5, growTime: 32, yield: {min: 2, max: 3}}),
  sleepicacao: SleepIngredient('Soothing Cacao', {buy: 6, growTime: 96, yield: {min: 3, max: 5}}),
  // sleepileek: SleepIngredient('Large Leek', {}), // <-- Galar (largeleek)
  // Sleep Salads
  sleepsslowpoke: SleepSalad('Slowpoke Tail Pepper', {}),
  sleepsmushroom: SleepSalad('Spore Mushroom', {}),
  sleepssnowcloak: SleepSalad('Snow Cloak Caesar', {}),
  sleepsgluttony: SleepSalad('Gluttony Potato', {}),
  sleepswaterveil: SleepSalad('Water Veil Tofu', {}),
  sleepssuperpower: SleepSalad('Superpower Extreme', {}),
  sleepsbeanham: SleepSalad('Bean Ham', {}),
  sleepstomato: SleepSalad('Snoozy Tomato', {}),
  sleepscaprese: SleepSalad('Moomoo Caprese', {}),
  sleepschocolate: SleepSalad('Contrary Chocolate Meat', {}),
  sleepsginger: SleepSalad('Overheat Ginger', {}),
  sleepsapple: SleepSalad('Fancy Apple', {}),
  sleepsleek: SleepSalad('Immunity Leek', {}),
  sleepsapplecheese: SleepSalad('Dazzling Apple Cheese', {}),
  sleepsninja: SleepSalad('Ninja', {}),
  sleepsheatwave: SleepSalad('Heat Wave Tofu', {}),
}

function genMegaStone(badge: BadgeId, xy: ' X' | ' Y' | '' = ''): MegaStone {
  const pkmn = get(badge)!
  return {
    label: `${pkmn.species}ite${xy}`, category: 'megastone',
    description: `An odd stone which draws out the power of ${pkmn.species}.`,
    battle: true,  buy: 0, sell: 12,
    badge,
  }
}

const ITEMS_MEGA = {
  venusaurite: genMegaStone(P.Venusaur),
  charizarditex: genMegaStone(P.Charizard, ' X'),
  charizarditey: genMegaStone(P.Charizard, ' Y'),
  blastoiseite: genMegaStone(P.Blastoise),
  beedrillite: genMegaStone(P.Beedrill),
  pidgeotite: genMegaStone(P.Pidgeot),
  alakazamite: genMegaStone(P.Alakazam),
  slowbroite: genMegaStone(P.Slowbro),
  gengarite: genMegaStone(P.Gengar),
  kangaskhanite: genMegaStone(P.Kangaskhan),
  pinsirite: genMegaStone(P.Pinsir),
  gyaradosite: genMegaStone(P.Gyarados),
  aerodactylite: genMegaStone(P.Aerodactyl),
  mewtwoitex: genMegaStone(P.Mewtwo, ' X'),
  mewtwoitey: genMegaStone(P.Mewtwo, ' Y'),
  ampharosite: genMegaStone(P.Ampharos),
  steelixite: genMegaStone(P.Steelix),
  scizorite: genMegaStone(P.Scizor),
  heracrossite: genMegaStone(P.Heracross),
  houndoomite: genMegaStone(P.Houndoom),
  tyranitarite: genMegaStone(P.Tyranitar),
  sceptileite: genMegaStone(P.Sceptile),
  blazikenite: genMegaStone(P.Blaziken),
  swampertite: genMegaStone(P.Swampert),
  gardevoirite: genMegaStone(P.Gardevoir),
  aggronite: genMegaStone(P.Aggron),
  sableyeite: genMegaStone(P.Sableye),
  mawileite: genMegaStone(P.Mawile),
  medichamite: genMegaStone(P.Medicham),
  manectricite: genMegaStone(P.Manectric),
  sharpedoite: genMegaStone(P.Sharpedo),
  cameruptite: genMegaStone(P.Camerupt),
  altariaite: genMegaStone(P.Altaria),
  banetteite: genMegaStone(P.Banette),
  absolite: genMegaStone(P.Absol),
  glalieite: genMegaStone(P.Glalie),
  salamenceite: genMegaStone(P.Salamence),
  metagrossite: genMegaStone(P.Metagross),
  latiosite: genMegaStone(P.Latios),
  latiasite: genMegaStone(P.Latias),
  lopunnyite: genMegaStone(P.Lopunny),
  lucarioite: genMegaStone(P.Lucario),
  garchompite: genMegaStone(P.Garchomp),
  abomasnowite: genMegaStone(P.Abomasnow),
  galladeite: genMegaStone(P.Gallade),
  audinoite: genMegaStone(P.Audino),
  diancieite: genMegaStone(P.Diancie),
}

export type MegaStoneId = keyof typeof ITEMS_MEGA;

function genZCrystal(label: string, type: Type): Item {
  return {
    battle: true, 
    category: 'zcrystal', buy: 0, sell: 4, // Don't want these to be sold, but you may end up with many.
    label,
    description: `A Z-Crystal to be held by your Pokémon. It powers up a ${type}-type to great effect.`
  }
}

function genSpecialZCrystal(label: string, holder: string, functional?: boolean): Item {
  return {
    battle: true, 
    category: 'zcrystal', buy: 0, sell: 9,
    label, functional,
    description: `A Z-Crystal to be held by ${holder}. It powers up a move to devastating effect.`
  }
}

const ITEMS_ZCRYSTAL = {
  zbuginium: genZCrystal('Buginium Z', 'Bug'),
  zdarkinium: genZCrystal('Darkinium Z', 'Dark'),
  zdragonium: genZCrystal('Dragonium Z', 'Dragon'),
  zelectrium: genZCrystal('Electrium Z', 'Electric'),
  zfairium: genZCrystal('Fairium Z', 'Fairy'),
  zfightinium: genZCrystal('Fightinium Z', 'Fighting'),
  zfirium: genZCrystal('Firium Z', 'Fire'),
  zflyinium: genZCrystal('Flyinium Z', 'Flying'),
  zghostium: genZCrystal('Ghostium Z', 'Ghost'),
  zgrassium: genZCrystal('Grassium Z', 'Grass'),
  zgroundium: genZCrystal('Groundium Z', 'Ground'),
  zicium: genZCrystal('Icium Z', 'Ice'),
  znormalium: genZCrystal('Normalium Z', 'Normal'),
  zpoisonium: genZCrystal('Poisonium Z', 'Poison'),
  zpsychicium: genZCrystal('Psychicium Z', 'Psychic'),
  zrockium: genZCrystal('Rockium Z', 'Rock'),
  zsteelium: genZCrystal('Steelium Z', 'Steel'),
  zwaterium: genZCrystal('Waterium Z', 'Water'),
  // SM Special crystals
  zaloraichium: genSpecialZCrystal('Aloraichium Z', 'Alolan Raichu'),
  zdecidium: genSpecialZCrystal('Decidium Z', 'Decidueye'),
  zeevium: genSpecialZCrystal('Eevium Z', 'Eevee'),
  zincinium: genSpecialZCrystal('Incinium Z', 'Incineroar'),
  zmarshadium: genSpecialZCrystal('Marshadium Z', 'Marshadow'),
  zmewnium: genSpecialZCrystal('Mewnium Z', 'Mew'),
  zpikanium: genSpecialZCrystal('Pikanium', 'Pikachu'),
  zpikashunium: genSpecialZCrystal('Pikashunium Z', 'Capped Pikachu'),
  zprimarium: genSpecialZCrystal('Primarium Z', 'Primarina'),
  zsnorlium: genSpecialZCrystal('Snorlium Z', 'Snorlax'),
  ztapunium: genSpecialZCrystal('Tapunium Z', 'Tapus Koko, Bulu, Lele, Fini'),
  // USUM Special crystals
  zkommonium: genSpecialZCrystal('Kommonium Z', 'Kommo-o'),
  zlunalium: genSpecialZCrystal('Lunalium Z', 'Lunala'),
  zlycanium: genSpecialZCrystal('Lycanium Z', 'Lycanroc'),
  zmimikium: genSpecialZCrystal('Mimikium Z', 'Mimikyu'),
  zsolganium: genSpecialZCrystal('Solganium Z', 'Solgaleo'),
  zultranecrozium: genSpecialZCrystal('Ultranecrozium Z', 'Necrozma', true),
}

function teraShard(type: Type): Item {
  return {
    battle: true,
    category: 'terashard', buy: 0, sell: 3,
    label: `${type} Tera Shard`,
    description: `A jewel shard with a coloration reminding you of the ${type}-type. When held by a Pokémon, they will terastalize.`,
  }
}

const ITEMS_TERA = {
  teranormal: teraShard('Normal'),
  terafire: teraShard('Fire'),
  terawater: teraShard('Water'),
  teraelectric: teraShard('Electric'),
  teragrass: teraShard('Grass'),
  teraice: teraShard('Ice'),
  terafighting: teraShard('Fighting'),
  terapoison: teraShard('Poison'),
  teraground: teraShard('Ground'),
  teraflying: teraShard('Flying'),
  terapsychic: teraShard('Psychic'),
  terabug: teraShard('Bug'),
  terarock: teraShard('Rock'),
  teraghost: teraShard('Ghost'),
  teradragon: teraShard('Dragon'),
  teradark: teraShard('Dark'),
  terasteel: teraShard('Steel'),
  terafairy: teraShard('Fairy'),
  terastellar: {
    battle: true,
    category: 'terashard', buy: 0, sell: 0,
    label: `Stellar Tera Shard`,
    description: `A jewel shard with a vivd rainbow coloration. When held by a Pokémon, they will terastalize into a Stellar-type.`,
  }
}

function Fossil(label: string, description = 'A fossil.'): Item {
  return {
    category: 'fossil', buy: 0, sell: 15,
    label, description, direct: true,
  }
}

function FossilGalar(label: string, description = 'A chunk of fossil.'): Item {
  return {
    category: 'fossil', buy: 0, sell: 7,
    label, description, // Needs to be crafted into a real fossil.
  }
}

export const ITEMS_FOSSILS = {
  helixfossil: Fossil('Helix Fossil', 'A shell of something dug up in the Kanto region.'),
  domefossil: Fossil('Dome Fossil', 'A shell of something dug up in the Kanto region.'),
  oldamber: Fossil('Old Amber', 'Remains of an old creature trapped in solid amber.'),
  rootfossil: Fossil('Root Fossil', 'Markings of an ancient plant embedded in a stone from the Hoenn region.'),
  clawfossil: Fossil('Claw Fossil', 'An old fossil of a claw found in the oceans of Hoenn.'),
  skullfossil: Fossil('Skull Fossil', 'A fossil of a prominent forehead dug up in the mines of Sinnoh.'),
  armorfossil: Fossil('Armor Fossil', 'A fossil of a fortified forehead dug up in the mines of Sinnoh.'),
  coverfossil: Fossil('Cover Fossil', 'The back of an old creature that has dried and solidied due to pressure below Unova.'),
  plumefossil: Fossil('Plume Fossil', 'An old feather embedded in stone after millions of years of pressure below Unova.'),
  jawfossil: Fossil('Jaw Fossil', 'An old pair of dentures found in a Kalos archaeological site.'),
  sailfossil: Fossil('Sail Fossil', 'An ancient head plume found in a Kalos archaeological site.'),
  birdfossil: FossilGalar('Fossilized Bird', 'The top of an ancient Pokémon who once soared the skies of Galar.'),
  dinofossil: FossilGalar('Fossilized Dino', 'The bottom of an ancient Pokémon who once roamed the seas of Galar.'),
  drakefossil: FossilGalar('Fossilized Drake', 'The bottom of an ancient Pokémon who roamed the lands of Galar.'),
  fishfossil: FossilGalar('Fossilized Fish', 'The top of an ancient Pokémon who swam in the deep oceans surrounding Galar.'),
  dzfossil: Fossil('DZ Fossil', 'Cara Liss has stuck the bird and drake fossil together. What will it become?'),
  azfossil: Fossil('AZ Fossil', 'Cara Liss has stuck the fish and dino fossil together. What will it become?'),
  dvfossil: Fossil('DV Fossil', 'Cara Liss has stuck the fish and drake fossil together. What will it become?'),
  avfossil: Fossil('AV Fossil', 'Cara Liss has stuck the bird and dino fossil together. What will it become?'),
}

export const ITEMS = {
  ...ITEMS_POKEBALLS,
  ...ITEMS_TREASURE,
  ...ITEMS_OTHER,
  ...ITEMS_HOLD,
  ...ITEMS_BERRIES,
  ...ITEMS_FERTILIZER,
  ...ITEMS_BATTLE,
  ...ITEMS_TMS,
  ...ITEMS_TRS,
  ...ITEMS_KEY,
  ...ITEMS_MATERIALS,
  ...ITEMS_INGREDIENTS,
  ...ITEMS_MEGA,
  ...ITEMS_ZCRYSTAL,
  ...ITEMS_FOSSILS,
  ...ITEMS_TERA,
};

/** A representation of every item. However, TMs and TRs while spelled correctly are overrepresented. */
export type ItemId = keyof typeof ITEMS | `tm-${MoveId}` | `tr-${MoveId}`

export const BAZAAR_OPEN = 0
export const BAZAAR_CLOSED = 1
export const BAZAAR_SOLDOUT = 2

export const currencies = asLiterals(['pokeball', 'heartscale', 'redshard', 'greenshard',
  'blueshard', 'yellowshard', 'shoalsalt', 'shoalshell', 'reliccopper',
  'relicsilver', 'relicgold', 'soot', 'mysteriousshards', 'mysteriousshardl',
  'armorite', 'dynite', 'galaricatwig'])

export type Currency = keyof {[K in (typeof currencies)[number]]: string}

type BazaarItems = {
  name: ItemId
  rate: number
}[]

type BazaarFn = () => BazaarItems;

interface Bazaar {
  name: string
  isOpen: (date: number, items: Record<ItemId, number>, r: Requirements) => 0 | 1 | 2
  /** Max to buy at a time */
  maxItems?: number
  /** Material Icon */
  icon?: string
  currency: Currency,
  items: BazaarItems | BazaarFn
}

const generalMoveTutors: {name: ItemId, rate: number}[] = [{
  name: 'tm-Rock Slide',
  rate: 5
}, {
  name: 'tm-Smelling Salts',
  rate: 5
}, {
  name: 'tm-Hyper Voice',
  rate: 5
}, {
  name: 'tm-Petal Blizzard',
  rate: 5
}, {
  name: 'tm-Rock Blast',
  rate: 5
}, {
  name: 'tm-Spark',
  rate: 5
}, {
  name: 'tm-Giga Impact',
  rate: 5
}, {
  name: 'tm-Fly',
  rate: 3
}, {
  name: 'tr-Bulk Up',
  rate: 3
}, {
  name: 'tr-Calm Mind',
  rate: 3
}, {
  name: 'tr-Dragon Dance',
  rate: 3
}, {
  name: 'tr-Mud Sport',
  rate: 3,
}]

// Treasure changes every day
const platinumTreasure: ItemId[] = [
  'nugget', 'razorclaw', 'razorfang', 'reapercloth', 'ovalstone',
  'electirizer', 'dubiousdisc', 'protector', 'magmarizer',
]

export const BAZAAR = {
  moveTutorLance: assert<Bazaar>({
    name: 'Lance, the move expert', icon: 'emoji_events',
    isOpen: (date) => {
      // Monday
      return new Date(date).getUTCDay() === 1 ? BAZAAR_OPEN : BAZAAR_CLOSED
    },
    currency: 'redshard',
    items: generalMoveTutors
  }),
  moveTutorLance2: assert<Bazaar>({
    name: 'Lance, the move expert', icon: 'emoji_events',
    isOpen: (date) => {
      // Friday
      return new Date(date).getUTCDay() === 5 ? BAZAAR_OPEN : BAZAAR_CLOSED
    },
    currency: 'yellowshard',
    items: generalMoveTutors
  }),
  moveTutorSteven: assert<Bazaar>({
    name: 'Steven, the move expert', icon: 'emoji_events',
    isOpen: (date) => {
      // Tuesday
      return new Date(date).getUTCDay() === 2 ? BAZAAR_OPEN : BAZAAR_CLOSED
    },
    currency: 'greenshard',
    items: generalMoveTutors
  }),
  moveTutorCynthia: assert<Bazaar>({
    name: 'Cynthia, the move expert', icon: 'emoji_events',
    isOpen: (date) => {
      // Wednesday
      return new Date(date).getUTCDay() === 3 ? BAZAAR_OPEN : BAZAAR_CLOSED
    },
    currency: 'heartscale',
    items: [
      ...generalMoveTutors,
      {
        name: 'tm-Double Hit',
        rate: 5,
      }, {
        name: 'tm-Ancient Power',
        rate: 5,
      }, {
        name: 'tm-Rollout',
        rate: 5,
      }, {
        name: 'tr-Mimic',
        rate: 3,
      }
    ]
  }),
  moveTutorAlder: assert<Bazaar>({
    name: 'Alder, the move expert', icon: 'emoji_events',
    isOpen: (date) => {
      // Thursday
      return new Date(date).getUTCDay() === 4 ? BAZAAR_OPEN : BAZAAR_CLOSED
    },
    currency: 'blueshard',
    items: generalMoveTutors
  }),
  moveTutorHayley: assert<Bazaar>({
    name: 'Hayley, the expert breeder', icon: 'egg',
    isOpen: (date) => {
      // Wednesday
      return new Date(date).getUTCDay() === 3 ? BAZAAR_OPEN : BAZAAR_CLOSED
    },
    currency: 'heartscale',
    items: [{
      name: 'tm-Volt Tackle',
      rate: 4
    }, {
      name: 'tr-Protect',
      rate: 2
    }, {
      name: 'tr-Defense Curl',
      rate: 2
    }, {
      name: 'tr-Swagger',
      rate: 2
    }, {
      name: 'tr-Flatter',
      rate: 2
    }, {
      name: 'tr-Frenzy Plant',
      rate: 4,
    }, {
      name: 'tr-Blast Burn',
      rate: 4
    }, {
      name: 'tr-Hydro Cannon',
      rate: 4,
    }, {
      name: 'tr-Draco Meteor',
      rate: 4,
    }]
  }),
  apricornDudeKurt: assert<Bazaar>({
    name: 'Kurt, the expert Poké Ball maker',
    isOpen: (date, items) => {
      const now = new Date(date)
      const dow = now.getUTCDay()
      if (dow === 0 || dow === 6) {
        // The weekend
        return BAZAAR_CLOSED
      }
      if (now.getDate() % 3 !== 0) {
        // Appears every three days otherwise
        return BAZAAR_CLOSED
      }
      if (items.fastball >= 5 &&
          items.friendball >= 5 &&
          items.heavyball >= 5 &&
          items.levelball >= 5 &&
          items.loveball >= 5 &&
          items.lureball >= 5 &&
          items.moonball >= 5
      ) {
        return BAZAAR_SOLDOUT
      }
      return BAZAAR_OPEN
    },
    maxItems: 5,
    currency: 'pokeball',
    items: [{
      name: 'fastball',
      rate: 4,
    }, {
      name: 'friendball',
      rate: 4
    }, {
      name: 'heavyball',
      rate: 4
    }, {
      name: 'levelball',
      rate: 4
    }, {
      name: 'loveball',
      rate: 4
    }, {
      name: 'lureball',
      rate: 4
    }, {
      name: 'moonball',
      rate: 4
    }]
  }),
  bugcatcher: assert<Bazaar>({
    name: 'Bugcatcher Arnie', icon: 'emoji_nature',
    isOpen: (date, items) => {
      const dow = new Date(date).getUTCDay()
      if (dow !== 1 && dow !== 3) {
        // Mondays and Wednesdays only
        return BAZAAR_CLOSED
      }
      if (items.competitionball >= 10) {
        return BAZAAR_SOLDOUT
      }
      return BAZAAR_OPEN
    },
    maxItems: 10,
    currency: 'pokeball',
    items: [{
      name: 'silverpowder',
      rate: 12
    }, {
      name: 'competitionball',
      rate: 4
    }]
  }),
  olivineport: assert<Bazaar>({
    name: 'Olivine Port', icon: 'sailing',
    isOpen: (_, __, r) => {
      if (!r.hiddenItemsFound.includes(CATCH_CHARM_GSC)) {
        return BAZAAR_CLOSED
      }
      return BAZAAR_OPEN
    },
    currency: 'pokeball',
    items: [{
      name: 'kingsrock',
      rate: 24,
    }, {
      name: 'metalcoat',
      rate: 24,
    }, {
      name: 'dragonscale',
      rate: 48,
    }, {
      name: 'upgrade',
      rate: 48,
    }]
  }),
  shellcollectorLow: assert<Bazaar>({
    name: 'Low Tide Shell Merchant', icon: 'beach_access',
    isOpen: (date) => {
      const hours = new Date(date).getUTCHours()
      // Low
      if (hours < 3 || (hours < 15 && hours >= 9) || hours > 21) {
        return BAZAAR_CLOSED
      }
      return BAZAAR_OPEN
    },
    currency: 'shoalsalt',
    items: [{
      name: 'shellbell',
      rate: 4
    }]
  }),
  shellcollectorHigh: assert<Bazaar>({
    name: 'High Tide Shell Merchant', icon: 'beach_access',
    isOpen: (date) => {
      const hours = new Date(date).getUTCHours()
      // High
      if ((hours >= 3 && hours < 9) || (hours >= 15 && hours < 21)) {
        return BAZAAR_CLOSED
      }
      return BAZAAR_OPEN
    },
    currency: 'shoalshell',
    items: [{
      name: 'shellbell',
      rate: 4
    }]
  }),
  vitaminClerk: assert<Bazaar>({
    name: 'Vitamin Clerk', icon: 'medication',
    isOpen: (date, items) => {
      const hours = new Date(date).getUTCHours()
      // Open at seedy hours
      if (hours > 3 && hours < 21) {
        return BAZAAR_CLOSED
      }
      if (items.protein >= 5 && items.iron >= 5 && items.carbos >= 5) {
        return BAZAAR_SOLDOUT
      }
      return BAZAAR_OPEN
    },
    maxItems: 5,
    currency: 'pokeball',
    items: [{
      name: 'carbos',
      rate: 3,
    }, {
      name: 'protein',
      rate: 3,
    }, {
      name: 'iron',
      rate: 3,
    }]
  }),
  incenseClerk: assert<Bazaar>({
    name: 'Pokémon Breeder Isaac', icon: 'cake',
    isOpen: (date, items) => {
      const timestamp = new Date(date)
      const dow = timestamp.getUTCDay()
      const hours = timestamp.getUTCHours()
      // Tuesdays, Thursdays b/w 12-4[ap]m
      if (dow !== 2 && dow !== 4) {
        return BAZAAR_CLOSED
      }
      if (items.laxincense >= 3 && items.seaincense >= 3) {
        return BAZAAR_SOLDOUT
      }
      if (hours >= 0 && hours <= 4) {
        return BAZAAR_OPEN
      }
      if (hours >= 12 && hours <= 15) {
        return BAZAAR_OPEN
      }
      return BAZAAR_CLOSED
    },
    currency: 'pokeball',
    maxItems: 3,
    items: [{
      name: 'laxincense',
      rate: 15,
    }, {
      name: 'seaincense',
      rate: 15,
    }]
  }),
  incenseClerkDppt: assert<Bazaar>({
    name: 'Pokémon Breeder Amber', icon: 'cake',
    isOpen: (date, items) => {
      const timestamp = new Date(date)
      const dow = timestamp.getUTCDay()
      const hours = timestamp.getUTCHours()
      // Wednesdays, Fridays b/w 1-3[ap]m
      if (dow !== 3 && dow !== 5) {
        return BAZAAR_CLOSED
      }
      if (items.rockincense >= 3 && items.oddincense >= 3 &&
          items.fullincense >= 3 && items.roseincense >= 3 &&
          items.pureincense >= 3 && items.luckincense >= 3 &&
          items.waveincense >= 3) {
        return BAZAAR_SOLDOUT
      }
      if (hours <= 1 || hours >= 3) {
        return BAZAAR_OPEN
      }
      if (hours <= 13 || hours >= 15) {
        return BAZAAR_OPEN
      }
      return BAZAAR_CLOSED
    },
    currency: 'pokeball',
    maxItems: 3,
    items: [{
      name: 'rockincense',
      rate: 15,
    }, {
      name: 'oddincense',
      rate: 15,
    }, {
      name: 'fullincense',
      rate: 15,
    }, {
      name: 'roseincense',
      rate: 15,
    }, {
      name: 'pureincense',
      rate: 15,
    }, {
      name: 'luckincense',
      rate: 15,
    }, {
      name: 'waveincense',
      rate: 15,
    }]
  }),
  platinumTreasureHunter: assert<Bazaar>({
    name: 'Platinum Treasure Hunter', icon: 'paid',
    isOpen: (date, items) => {
      const timestamp = new Date(date)
      const hours = timestamp.getUTCHours()
      const treasure = platinumTreasure[timestamp.getUTCDate() % platinumTreasure.length]
      if (items[treasure] >= 1) {
        return BAZAAR_SOLDOUT
      }
      // Daily b/w 9-5am
      if (hours >= 9 && hours <= 17) {
        return BAZAAR_OPEN
      }
      // Daily between 1-4am
      if (hours >= 1 && hours <= 4) {
        return BAZAAR_OPEN
      }
      return BAZAAR_CLOSED
    },
    currency: 'heartscale',
    maxItems: 1,
    items: (() => {
      const timestamp = new Date()
      const treasure = platinumTreasure[timestamp.getUTCDate() % platinumTreasure.length]
      return [{
        name: treasure,
        rate: 4,
      }]
    })()
  }),
  platinumGhost: assert<Bazaar>({
    name: 'Appliances Depot', icon: 'kitchen',
    isOpen: (date, items) => {
      if (items.brokenfan >= 1 &&
          items.brokenfridge >= 1 &&
          items.brokenlight >= 1 &&
          items.brokenmicrowave >= 1 &&
          items.brokenmower >= 1 &&
          items.brokenwasher >= 1) {
        return BAZAAR_SOLDOUT
      }
      // 
      return BAZAAR_OPEN
    },
    currency: 'heartscale',
    maxItems: 1,
    items: [{
      name: 'brokenfan',
      rate: 4,
    }, {
      name: 'brokenfridge',
      rate: 4,
    }, {
      name: 'brokenlight',
      rate: 4,
    }, {
      name: 'brokenmicrowave',
      rate: 4,
    }, {
      name: 'brokenmower',
      rate: 4,
    }, {
      name: 'brokenwasher',
      rate: 4,
    }]
  }),
  platinumGardener: assert<Bazaar>({
    name: 'Floaroma Gardener', icon: 'filter_vintage',
    isOpen: (_, items) => {
      if (items.gracidea >= 1) {
        return BAZAAR_SOLDOUT
      }
      return BAZAAR_OPEN
    },
    currency: 'heartscale',
    maxItems: 1,
    items: [{
      name: 'gracidea',
      rate: 4,
    }]
  }),
  platinumDistortion: assert<Bazaar>({
    name: 'Dark Trinity', icon: 'more_horiz',
    isOpen: (_, items) => {
      if (items.griseousorb >= 1) {
        return BAZAAR_SOLDOUT
      }
      return BAZAAR_OPEN
    },
    currency: 'heartscale',
    maxItems: 1,
    items: [{
      name: 'griseousorb',
      rate: 4,
    }]
  }),
  ruinManiac1: assert<Bazaar>({
    name: 'Ruin Fan', icon: 'search',
    isOpen: (date) => {
      const timestamp = new Date(date)
      const hours = timestamp.getUTCHours()
      // 12am - 8am
      if (hours < 8) {
        return BAZAAR_OPEN
      }
      return BAZAAR_CLOSED
    },
    currency: 'reliccopper',
    maxItems: 1,
    items: [{
      name: 'tm-Relic Song',
      rate: 15,
    }],
  }),
  ruinManiac2: assert<Bazaar>({
    name: 'Ruin Fan', icon: 'search',
    isOpen: (date) => {
      const timestamp = new Date(date)
      const hours = timestamp.getUTCHours()
      // 8am - 4pm
      if (hours >= 8 && hours < 16) {
        return BAZAAR_OPEN
      }
      return BAZAAR_CLOSED
    },
    currency: 'relicsilver',
    maxItems: 1,
    items: [{
      name: 'tm-Relic Song',
      rate: 5,
    }],
  }),
  ruinManiac3: assert<Bazaar>({
    name: 'Ruin Fan', icon: 'search',
    isOpen: (date) => {
      const timestamp = new Date(date)
      const hours = timestamp.getUTCHours()
      // 4pm - 12am
      if (hours >= 16) {
        return BAZAAR_OPEN
      }
      return BAZAAR_CLOSED
    },
    currency: 'relicgold',
    maxItems: 1,
    items: [{
      name: 'tm-Relic Song',
      rate: 3,
    }],
  }),
  unovanMonk: assert<Bazaar>({
    name: 'Unovan Monk', icon: 'church',
    isOpen: (_, items) => {
      if (items["tm-Secret Sword"] >= 1) return BAZAAR_SOLDOUT
      return BAZAAR_OPEN
    },
    currency: 'heartscale',
    maxItems: 1,
    items: [{
      name: 'tm-Secret Sword',
      rate: 5
    }]
  }),
  plasmaScientist1: assert<Bazaar>({
    name: 'Plasma Researcher Colress', icon: 'save',
    isOpen: (date) => {
      const timestamp = new Date(date)
      const hours = timestamp.getUTCHours()
      // 6am
      if (hours < 6) {
        return BAZAAR_OPEN
      }
      return BAZAAR_CLOSED
    },
    currency: 'redshard',
    maxItems: 1,
    items: [{
      name: 'burndrive',
      rate: 4
    }]
  }),
  plasmaScientist2: assert<Bazaar>({
    name: 'Plasma Researcher Colress', icon: 'save',
    isOpen: (date) => {
      const timestamp = new Date(date)
      const hours = timestamp.getUTCHours()
      // 6am - 12pm
      if (hours >= 6 && hours < 12) {
        return BAZAAR_OPEN
      }
      return BAZAAR_CLOSED
    },
    currency: 'blueshard',
    maxItems: 1,
    items: [{
      name: 'dousedrive',
      rate: 4
    }]
  }),
  plasmaScientist3: assert<Bazaar>({
    name: 'Plasma Researcher Colress', icon: 'save',
    isOpen: (date) => {
      const timestamp = new Date(date)
      const hours = timestamp.getUTCHours()
      // 12pm - 6pm
      if (hours >= 12 && hours < 18) {
        return BAZAAR_OPEN
      }
      return BAZAAR_CLOSED
    },
    currency: 'yellowshard',
    maxItems: 1,
    items: [{
      name: 'shockdrive',
      rate: 4
    }]
  }),
  plasmaScientist4: assert<Bazaar>({
    name: 'Plasma Researcher Colress', icon: 'save',
    isOpen: (date) => {
      const timestamp = new Date(date)
      const hours = timestamp.getUTCHours()
      // 6pm+
      if (hours > 18) {
        return BAZAAR_OPEN
      }
      return BAZAAR_CLOSED
    },
    currency: 'greenshard',
    maxItems: 1,
    items: [{
      name: 'chilldrive',
      rate: 4
    }]
  }),
  hoennFloutist: assert<Bazaar>({
    name: 'Hoenn GlassWorks', icon: 'sports',
    isOpen: (date) => {
      const timestamp = new Date(date)
      const hours = timestamp.getUTCHours()
      // 8am - 8pm
      if (hours >= 8) {
        return BAZAAR_OPEN
      }
      if (hours <= 20) {
        return BAZAAR_OPEN
      }
      return BAZAAR_CLOSED
    },
    currency: 'soot',
    items: [{
      name: 'blueflute',
      rate: 25,
    }, {
      name: 'redflute',
      rate: 50,
    }, {
      name: 'yellowflute',
      rate: 50,
    }, {
      name: 'whiteflute',
      rate: 100,
    }, {
      name: 'blackflute',
      rate: 100,
    }]
  }),
  beautysalon: assert<Bazaar>({
    name: 'Lumiose Salon', icon: 'content_cut',
    isOpen: (date) => {
      const timestamp = new Date(date)
      const hours = timestamp.getUTCHours()
      // 8am - 8pm
      if (hours >= 8) {
        return BAZAAR_OPEN
      }
      if (hours <= 20) {
        return BAZAAR_OPEN
      }
      return BAZAAR_CLOSED
    },
    currency: 'pokeball',
    items: [{
      name: 'trimnatural',
      rate: 5,
    }, {
      name: 'trimheart',
      rate: 5,
    }, {
      name: 'trimstar',
      rate: 5,
    }, {
      name: 'trimdiamond',
      rate: 5,
    }, {
      name: 'trimdeputante',
      rate: 5,
    }, {
      name: 'trimmatron',
      rate: 5,
    }, {
      name: 'trimdandy',
      rate: 5,
    }, {
      name: 'trimlareine',
      rate: 5,
    }, {
      name: 'trimpharaoh',
      rate: 5,
    }, {
      name: 'trimkabuki',
      rate: 5,
    }]
  }),
  battleTower: assert<Bazaar>({
    name: 'Battle Tower Shop', icon: 'sports_mma',
    isOpen: (date) => {
      const timestamp = new Date(date)
      const hours = timestamp.getUTCHours()
      const dow = timestamp.getUTCDay()
      // 9am - 7pm M - R
      // (so closed Su, F, Sa)
      if ([0, 5, 6].includes(dow)) {
        return BAZAAR_CLOSED
      }
      if (hours >= 9) {
        return BAZAAR_OPEN
      }
      if (hours <= 19) {
        return BAZAAR_OPEN
      }
      return BAZAAR_CLOSED
    },
    currency: 'heartscale',
    items: [{
      name: 'airballoon',
      rate: 2,
    }, {
      name: 'bindingband',
      rate: 2,
    }, {
      name: 'protectivepads',
      rate: 3,
    }, {
      name: 'safetygoggles',
      rate: 3,
    }, {
      name: 'weaknesspolicy',
      rate: 3,
    }, {
      name: 'assaultvest',
      rate: 3,
    }, {
      name: 'ejectbutton',
      rate: 3,
    }, {
      name: 'redcard',
      rate: 3,
    }, {
      name: 'abilitycapsule',
      rate: 4,
    }]
  }),
  michaels: assert<Bazaar>({
    name: 'Craft Bazaar', icon: 'handyman',
    isOpen: (date) => {
      const timestamp = new Date(date)
      const hours = timestamp.getUTCHours()
      const dow = timestamp.getUTCDay()
      // 9am - 7pm R - S
      if ([0, 4, 5, 6].includes(dow)) {
        return BAZAAR_CLOSED
      }
      if (hours >= 9) {
        return BAZAAR_OPEN
      }
      if (hours <= 19) {
        return BAZAAR_OPEN
      }
      return BAZAAR_CLOSED
    },
    currency: 'pokeball',
    items: [{
      name: 'cakelurebase',
      rate: 2,
    }, {
      name: 'candytruffle',
      rate: 2,
    }, {
      name: 'ironchunk',
      rate: 2,
    }]
  }),
  dentures: assert<Bazaar>({
    name: 'Safari Zone Delivery', icon: 'delivery_dining',
    isOpen: (date, items) => {
      const timestamp = new Date(date)
      const dow = timestamp.getUTCDay()
      // Closed on weekends
      if ([0, 6].includes(dow)) {
        return BAZAAR_CLOSED
      }
      if (items.goldteeth > 0) {
        return BAZAAR_OPEN
      }
      return BAZAAR_CLOSED
    },
    currency: 'pokeball',
    items: [{
      name: 'safariball',
      rate: 4,
    }, {
      name: 'competitionball',
      rate: 4,
    }]
  }),
  aetherfoundation: assert<Bazaar>({
    name: 'Aether Foundation', icon: 'balcony',
    isOpen: (_, __, r) => {
      if (!r.hiddenItemsFound.includes(CATCH_CHARM_SM)) {
        return BAZAAR_CLOSED
      }
      return BAZAAR_OPEN
    },
    currency: 'pokeball',
    items: [{
      name: 'beastball',
      rate: 10,
    }]
  }),
  apotheke: assert<Bazaar>({
    name: 'Apotheke', icon: 'medication_liquid',
    isOpen: (date) => {
      const timestamp = new Date(date)
      const hours = timestamp.getUTCHours()
      // 6pm - 6am
      if (hours >= 18) {
        return BAZAAR_OPEN
      }
      if (hours <= 6) {
        return BAZAAR_OPEN
      }
      return BAZAAR_CLOSED
    },
    currency: 'pokeball',
    items: [{
      name: 'energypowder',
      rate: 4,
    }, {
      name: 'healpowder',
      rate: 4,
    }]
  }),
  ramanass: assert<Bazaar>({
    name: 'Ramanas Park', icon: 'park',
    isOpen: (date) => {
      const timestamp = new Date(date)
      const hours = timestamp.getUTCHours()
      // 6pm - 6am
      if (hours >= 18) {
        return BAZAAR_OPEN
      }
      if (hours <= 6) {
        return BAZAAR_OPEN
      }
      return BAZAAR_CLOSED
    },
    currency: 'mysteriousshards',
    items: [{
      name: 'slategb',
      rate: 3
    },{
      name: 'slategbc',
      rate: 3
    },{
      name: 'slategba',
      rate: 3
    },{
      name: 'slaters',
      rate: 3
    },{
      name: 'slatemewtwo',
      rate: 3
    },{
      name: 'slatelugia',
      rate: 3
    },{
      name: 'slatehooh',
      rate: 3
    },{
      name: 'slatekyogre',
      rate: 3
    },{
      name: 'slategroudon',
      rate: 3
    },{
      name: 'slaterayquaza',
      rate: 3
    },{
      name: 'slategiratina',
      rate: 3
    },]
  }),
  ramanasl: assert<Bazaar>({
    name: 'Ramanas Park', icon: 'park',
    isOpen: (date) => {
      const timestamp = new Date(date)
      const hours = timestamp.getUTCHours()
      // 6am - 6pm
      if (hours >= 18) {
        return BAZAAR_CLOSED
      }
      if (hours <= 6) {
        return BAZAAR_CLOSED
      }
      return BAZAAR_OPEN
    },
    currency: 'mysteriousshardl',
    items: [{
      name: 'slategb',
      rate: 1
    },{
      name: 'slategbc',
      rate: 1
    },{
      name: 'slategba',
      rate: 1
    },{
      name: 'slaters',
      rate: 1
    },{
      name: 'slatemewtwo',
      rate: 1
    },{
      name: 'slatelugia',
      rate: 1
    },{
      name: 'slatehooh',
      rate: 1
    },{
      name: 'slatekyogre',
      rate: 1
    },{
      name: 'slategroudon',
      rate: 1
    },{
      name: 'slaterayquaza',
      rate: 1
    },{
      name: 'slategiratina',
      rate: 1
    },]
  }),
  galarica: assert<Bazaar>({
    name: 'Galarica Weaver', icon: 'grass',
    isOpen: (_, __, r) => {
      if (!r.hiddenItemsFound.includes(CATCH_CHARM_SWSH)) {
        return BAZAAR_CLOSED
      }
      return BAZAAR_OPEN
    },
    currency: 'galaricatwig',
    items: [{
      name: 'galaricacuff',
      rate: 8,
    }, {
      name: 'galaricawreath',
      rate: 15,
    }]
  }),
  // https://bulbapedia.bulbagarden.net/wiki/Stow-on-Side#Bargain_shop
  stowonside: assert<Bazaar>({
    name: 'Stow-On-Side Trading Post', icon: 'brush',
    isOpen: (_, __, r) => {
      if (!r.hiddenItemsFound.includes(CATCH_CHARM_SWSH)) {
        return BAZAAR_CLOSED
      }
      return BAZAAR_OPEN
    },
    currency: 'pokeball',
    items: (() => {
      const timestamp = new Date()
      const dailyOptions: ItemId[] = [
        'blunderpolicy', 'chippedpot', 'ejectpack', 'heavydutyboots',
        'roomservice', 'throatspray', 'utilityumbrella',
      ]
      const treasure = dailyOptions[timestamp.getUTCDate() % dailyOptions.length]
      return [{
        name: treasure as ItemId,
        rate: 17, // One more than sale price
      }, {
        name: 'bindingband',
        rate: 7, // 1 cheaper
      }, {
        name: 'protectivepads',
        rate: 10,
      }, {
        name: 'crackedpot',
        rate: 24,
      }, {
        name: 'focusband',
        rate: 16, // 2 cheaper
      }, {
        name: 'metronome',
        rate: 16,
      }, {
        name: 'protector',
        rate: 16,
      }, {
        name: 'razorclaw',
        rate: 16,
      }, {
        name: 'reapercloth',
        rate: 16,
      }, {
        name: 'ringtarget',
        rate: 16,
      }, {
        name: 'quickclaw',
        rate: 20, // 4 cheaper
      }] as BazaarItems
    })()
  }),
  armorite: assert<Bazaar>({
    name: 'Isle of Armor Vending', icon: 'shield',
    isOpen: (_, __, r) => {
      if (!r.hiddenItemsFound.includes(CATCH_CHARM_SWSH)) {
        return BAZAAR_CLOSED
      }
      return BAZAAR_OPEN
    },
    currency: 'armorite',
    items: (() => {
      const primaryList = GALAR_INGREDIENTS.slice(0, 18).map(name => ({ name, rate: 3 }))
      const secondaryList = GALAR_INGREDIENTS.slice(18).map(name => ({ name, rate: 4 }))
      return [...primaryList, ...secondaryList]
    })()
  }),
  dynite: assert<Bazaar>({
    name: 'Freezington Convenience', icon: 'ac_unit',
    isOpen: (_, __, r) => {
      if (!r.hiddenItemsFound.includes(CATCH_CHARM_SWSH)) {
        return BAZAAR_CLOSED
      }
      return BAZAAR_OPEN
    },
    currency: 'dynite',
    items: (() => {
      const sweetList = SWEETS.map(name => ({ name, rate: 4 }))
      const mintList = MINTS.map(name => ({ name, rate: 8 }))
      return [...sweetList, ...mintList]
    })()
  }),
  ginkgo: assert<Bazaar>({
    name: "Ginter Trades", icon: 'brush',
    isOpen: (_, __, r) => {
      if (r.hiddenItemsFound.includes(CATCH_CHARM_SWSH)) {
        return BAZAAR_OPEN
      }
      return BAZAAR_CLOSED
    },
    currency: 'pokeball',
    items: (() => {
      const timestamp = new Date()
      const dailyOptions: ItemId[] = [
        'ovalstone', 'shinystone', 'duskstone', 'dawnstone', 'metalcoat',
        'upgrade', 'blackaugurite', 'dubiousdisc', 'magmarizer', 'electirizer',
        'protector', 'razorclaw', 'razorfang', 'reapercloth', 'peatblock',
        'brokenmower', 'brokenwasher', 'brokenmicrowave', 'brokenfridge', 'brokenfan',
      ]
      const treasure = dailyOptions[timestamp.getUTCDate() % dailyOptions.length]
      return [{
        name: treasure as ItemId,
        rate: 15,
      }, {
        name: 'cakelurebase',
        rate: 2,
      }, {
        name: 'leadenball',
        rate: 7,
      }, {
        name: 'gigatonball',
        rate: 15,
      }, {
        name: 'featherball',
        rate: 5,
      }, {
        name: 'wingball',
        rate: 8,
      }, {
        name: 'jetball',
        rate: 16,
      }] as BazaarItems
    })()
  }),
}

export type BazaarId = keyof typeof BAZAAR
