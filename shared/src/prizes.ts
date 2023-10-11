import { ItemId } from "./items-list"

export const BALLS_A: ItemId[] = [
  'pokeball', 'lureball', 'levelball', 'loveball', 'moonball'
]

export const BALLS_B: ItemId[] = [
  'heavyball', 'fastball', 'friendball'
]

export const BALLS_C: ItemId[] = [
  'greatball', 'ultraball'
]

export const BALLS_D: ItemId[] = [
  'quickball', 'duskball', 'repeatball',
]

export const TYPE_ITEMS_A: ItemId[] = [
  'blackbelt', 'blackglasses', 'dragonfang', 'hardstone', 'miracleseed',
  'mysticwater', 'nevermeltice', 'softsand', 'silkscarf', 'silverpowder'
]

export const TYPE_ITEMS_B: ItemId[] = [
  'charcoal', 'magnet', 'poisonbarb', 'sharpbeak', 'twistedspoon', 'spelltag',
]

export const TYPE_GSC_HOLD: ItemId[] = [
  'brightpowder', 'focusband', 'kingsrock', 'luckypunch', 'leftovers', 'scopelens',
  'thickclub', 'leek', 'metalpowder', 'lightball', 'quickpowder', 'smokeball',
  'pokedoll',
]

export const TYPE_GSC_BERRY: ItemId[] = [
  'oran', 'pecha', 'aspear', 'rawst', 'pecha', 'cheri', 'chesto'
]

export const TYPE_GSC_BERRY_B: ItemId[] = ['lum', 'sitrus']

export const TYPE_RSE_BERRY: ItemId[] = [
  'oran', 'pecha', 'aspear', 'rawst', 'pecha', 'cheri', 'chesto', 'lum', 'sitrus', 'figy'
]

export const TYPE_ELEMENTAL_BERRY: ItemId[] = [
  'occa', 'passho', 'wacan', 'rindo', 'yache', 'chople', 'kebia', 'shuca',
  'coba', 'payapa', 'tanga', 'charti', 'kasib', 'haban', 'colbur', 'roseli',
  'growthmulch', 'dampmulch', 'stablemulch', 'gooeymulch', 'amazemulch',
  'richmulch',
]

export const TYPE_PINCH_BERRY: ItemId[] = [
  'liechi', 'ganlon', 'salac', 'petaya', 'micle', 'cutsap', 'jaboca', 'rowap',
  'starf', 'lansat', 'apicot',
]

export const TYPE_TREASURE_BERRY: ItemId[] = [
  'belue', 'bluk', 'cornn', 'durin', 'magost', 'nanab', 'nomel', 'pamtre',
  'pinap', 'rabuta', 'razz', 'spelon', 'watmel', 'wepear', 'kee', 'maranga',
  'aguav', 'grepa', 'hondew', 'iapapa', 'mago', 'qualot', 'tamato', 'wiki',
]

export const TYPE_DPPT_HOLD: ItemId[] = [
  'scopelens', 'widelens', 'lifeorb', 'toxicorb', 'flameorb', 'choiceband',
  'choicescarf', 'choicespecs', 'blacksludge', 'expertbelt', 'metronome',
  'laggingtail', 'bigroot', 'lightclay', 'gripclaw', 'shedshell',
]

export const TYPE_BW_HOLD: ItemId[] = [
  'airballoon', 'healthwing', 'musclewing', 'resistwing', 'geniuswing',
  'cleverwing', 'swiftwing', 'eviolite', 'absorbbulb', 'cellbattery',
  'bindingband', 'ringtarget', 'floatstone',
  'firegem', 'watergem', 'electricgem', 'icegem',
  'ejectbutton', 'redcard',
]

export const TYPE_XY_ITEMS: ItemId[] = [
  'assaultvest', 'sachet', 'weaknesspolicy', 'whippeddream',
  'shaloursable', 'luminousmoss', 'lumiosegalette', 'snowball',
  'pixieplate', 'safetygoggles', 'snowball',
  'trimdandy', 'trimdeputante', 'trimdiamond', 'trimheart',
  'trimmatron', 'trimnatural', 'trimstar',
]

export const TYPE_SM_ITEMS: ItemId[] = [
  'icestone', 'strangesouvenir', 'mistyseed', 'grassyseed', 'electricseed', 'psychicseed',
  'bigmalasada', 'protectivepads', 'pinknectar', 'yellownectar', 'rednectar', 'purplenectar',
  // Well, pretty much
  'tm-Stomp', 'tm-Dragon Pulse', 'tr-Double Team', 'tr-Shell Smash', 'tr-Iron Defense',
]

export const SEEDS: ItemId[] = [
  'mistyseed', 'grassyseed', 'electricseed', 'psychicseed',
]

export const NECTARS: ItemId[] = [
  'pinknectar', 'yellownectar', 'rednectar', 'purplenectar',
]

export const BOTTLECAPS: ItemId[] = [
  'bottlecaphp', 'bottlecapatk', 'bottlecapdef', 'bottlecapspe',
  'bottlecapspa', 'bottlecapspd',
]

export const MINTS: ItemId[] = [
  'minthardy', 'mintadamant', 'minttimid', 'mintnaughty',
  'mintjolly', 'mintmodest', 'mintbold', 'mintcalm',
]

export const TYPE_GEMS: ItemId[] = [
  'firegem', 'watergem', 'electricgem', 'icegem', 'fightinggem', 'dragongem',
  'darkgem', 'rockgem', 'grassgem', 'groundgem', 'normalgem', 'buggem',
  'ghostgem', 'poisongem', 'flyinggem', 'psychicgem', 'fairygem', 'steelgem',
]

export const TYPE_ITEMS = [...TYPE_ITEMS_A, ...TYPE_ITEMS_B]

export const TMS_RB: ItemId[] = [
  'tm-Hyper Beam', 'tm-Ice Punch', 'tm-Thunder Punch', 'tm-Fire Punch',
  'tm-Dream Eater', 'tm-Snore', 'tm-Tri Attack', 'tm-Double-Edge',
  'tm-Dragon Rage', 'tm-Dig', 'tm-Bide', 'tm-Bubble Beam',
  'tm-Thunderbolt', 'tm-Mega Drain', 'tm-Sludge', 'tm-Psywave',
  'tm-Fire Blast', 'tm-Earthquake', 'tm-Egg Bomb', 'tm-Fire Spin',
  'tm-Surf', 'tm-Stomp',
]

export const TMS_GS: ItemId[] = [
  'tm-Mud-Slap', 'tm-Fury Cutter', 'tm-Rollout', 'tm-Shadow Ball',
  'tm-Dynamic Punch', 'tm-Iron Tail', 'tm-Icy Wind', 'tm-Dragon Breath',
  'tm-Zap Cannon', 'tm-Steel Wing', 'tm-Swift', 'tm-Ancient Power',
]

export const TMS_RSE: ItemId[] = [
  'tm-Rock Tomb', 'tm-Focus Punch', 'tm-Shock Wave', 'tm-Overheat',
  'tm-Facade', 'tm-Aerial Ace', 'tm-Extrasensory', 'tm-Water Pulse',
  'tm-Dive', 'tm-Nature Power', 'tm-Secret Power', 'tm-Sand Tomb',
  'tm-Weather Ball', 'tm-Dragon Pulse',
]

export const TMS_DPPt: ItemId[] = [
  'tm-Double Hit', 'tm-Stone Edge', 'tm-Leaf Storm', 'tm-Close Combat',
  'tm-Brine', 'tm-Shadow Claw', 'tm-Flash Cannon', 'tm-Ice Shard',
  'tm-Charge Beam', 'tm-Dark Pulse',
]

export const TMS_BW: ItemId[] = [
  'tm-Sludge Wave', 'tm-Chip Away', 'tm-Steamroller', 'tm-Electroweb',
  'tm-Bulldoze', 'tm-Sky Drop', 'tm-Frost Breath', 'tm-Dual Chop',
]

export const TMS_XY: ItemId[] = [
  'tm-Infestation', 'tm-Head Smash', 'tm-Power-Up Punch', 'tm-Petal Blizzard',
  'tm-Nuzzle', 'tm-Play Rough', 'tm-Psyshock', 'tm-Freeze-Dry',
  'tm-Dragon Ascent',
]

export const TMS_SM: ItemId[] = [
  'tm-Power Trip', 'tm-Liquidation', 'tm-Burn Up', 'tm-Solar Blade',
  'tm-Zing Zap', 'tm-Phantom Force', 'tm-Dragon Pulse',
]

export const TMS_SWSH: ItemId[] = [
  'tm-Leafage', 'tm-Razor Shell', 'tm-Flame Wheel', 'tm-Body Press',
  'tm-Draining Kiss', 'tm-Mud Shot', 'tm-Beat Up', 'tm-Twister',
  'tm-Payback', 'tm-Icicle Spear',
]

export const TMS_PLA: ItemId[] = [
  'tm-Barb Barrage', 'tm-Psyshield Bash',
]

export const TRS_RB: ItemId[] = [
  'tr-String Shot', 'tr-Swords Dance', 'tr-Mimic', 'tr-Self-Destruct',
  'tr-Thunder Wave', 'tr-Metronome', 'tr-Agility', 'tr-Mimic',
  'tr-Poison Powder', 'tr-Haze', 'tr-Leech Seed', 'tr-Endure', 'tr-Substitute',
  'tr-Flash', 'tr-Mist', 'tr-Double Team',
]

export const TRS_GS: ItemId[] = [
  'tr-Protect', 'tr-Swagger', 'tr-Defense Curl', 'tr-Hypnosis',
  'tr-Confuse Ray', 'tr-Reflect', 'tr-Light Screen', 'tr-Belly Drum',
  'tr-Cotton Spore', 'tr-Attract', 'tr-Sweet Scent',
]

export const TRS_RSE: ItemId[] = [
  'tr-Iron Defense', 'tr-Flatter', 'tr-Bulk Up', 'tr-Calm Mind',
  'tr-Dragon Dance', 'tr-Grass Whistle', 'tr-Charm', 'tr-Feather Dance',
  'tr-Knock Off', 'tr-Fake Tears', 'tr-Tickle', 'tr-Mud Sport',
  'tr-Endeavor', 'tr-Fake Out', 'tr-Taunt', 'tr-Odor Sleuth',
]

export const TRS_DPPt: ItemId[] = [
  'tr-Nasty Plot', 'tr-Embargo', 'tr-Defog', 'tr-Rock Polish', 'tr-Acupressure',
  'tr-Power Trick', 'tr-Power Swap', 'tr-Guard Swap', 'tr-Switcheroo',
  'tr-Trick Room', 'tr-Tailwind', 'tr-Captivate', 'tr-Miracle Eye',
]

export const TRS_BW: ItemId[] = [
  'tr-Telekinesis', 'tr-Autotomize', 'tr-Cotton Guard', 'tr-Work Up', 'tr-Shift Gear',
  'tr-Shell Smash', 'tr-Coil', 'tr-Soak', 'tr-Magic Room', 'tr-Wonder Room',
  'tr-Guard Split', 'tr-Power Split', 'tr-Quick Guard', 'tr-Hone Claws',
  'tr-Wide Guard', 'tr-Aqua Ring', 'tr-Imprison',
]

export const TRS_XY: ItemId[] = [
  'tr-Confide', 'tr-Venom Drench', 'tr-Electric Terrain', 'tr-Grassy Terrain',
  'tr-Misty Terrain', 'tr-Psychic Terrain', 'tr-Laser Focus',
]

export const TRS_SM: ItemId[] = [
  'tr-Speed Swap', 'tr-Tearful Look', 'tr-Aurora Veil',
]

export const TRS_SWSH: ItemId[] = [
  'tr-Life Dew',
]

export const TMS_ALL: ItemId[] = [
  ...TMS_RB, ...TMS_GS, ...TMS_RSE, ...TMS_DPPt, ...TMS_BW, ...TMS_XY,
  // TODO Add Sun/Moon
]

export const TRS_ALL: ItemId[] = [
  ...TRS_RB, ...TRS_GS, ...TRS_RSE, ...TRS_DPPt, ...TRS_BW, ...TRS_XY,
  // TODO Add Sun/Moon
]

export const HOLD_ALL: ItemId[] = [
  ...TYPE_GSC_HOLD, ...TYPE_DPPT_HOLD, ...TYPE_BW_HOLD, 'amuletcoin', 'quickclaw',
]

export const BERRY_ALL: ItemId[] = [
  ...TYPE_GSC_BERRY, ...TYPE_GSC_BERRY_B, ...TYPE_RSE_BERRY, ...TYPE_PINCH_BERRY,
  ...TYPE_TREASURE_BERRY, ...TYPE_ELEMENTAL_BERRY,
]

/**
 * Hidden Moves and similar. Used as unlocks for Voyages.
 */
export const HMS: ItemId[] = [
  'tm-Rock Smash', 'tm-Surf', 'tm-Whirlpool',
  'tm-Rock Climb', 'tm-Fire Blast', 'tm-Dig',
  'tm-Fly', 'tm-Waterfall', 'tm-Strength',
  'tm-Cut', 'tm-Dive', 'tr-Defog', 'tr-Flash',
]

export const TREASURE: ItemId[] = [
  'bigmushroom', 'bigpearl', 'nugget', 'redshard', 'greenshard', 'blueshard',
  'yellowshard', 'heartscale', 'shoalsalt', 'shoalshell',
]

export const TREASURE_RARE: ItemId[] = [
  'bignugget', 'pearlstring', 'balmmushroom', 'cometshard',
]

export const TREASURE_RELIC: ItemId[] = [
  'reliccopper', 'reliccopper', 'reliccopper',
  'relicsilver', 'relicsilver', 'relicgold',
  'relicvase', 'relicband', 'relicstatue', 'reliccrown',
]

export const RAIDS_1: ItemId[] = [
  'expcandyxs', 'expcandys', 'expcandym',
]

export const RAIDS_2: ItemId[] = [
  'wishingpiece', 'expcandym', 'expcandyl', 'expcandyxl',
]

// For special raids: 7+
export const RAIDS_3: ItemId[] = [
  'raidpass', 'expcandyl', 'expcandyxl', 'rarecandy'
]

export const DPP_EVOS: ItemId[] = [
  'reapercloth', 'tm-Rollout', 'tr-Mimic', 'tm-Double Hit', 'tm-Ancient Power',
  'razorclaw', 'razorfang', 'duskstone', 'shinystone', 'ovalstone', 'electirizer',
  'protector', 'dubiousdisc', 'magmarizer', 'dawnstone',
]

export const INCENSE: ItemId[] = [
  'seaincense', 'laxincense', 'rockincense', 'luckincense',
  'waveincense', 'fullincense', 'oddincense', 'roseincense',
]

export const FOSSILS: ItemId[] = [
  'helixfossil', 'domefossil', 'oldamber',
  'rootfossil', 'clawfossil', 'skullfossil', 'armorfossil',
  'coverfossil', 'plumefossil', 'jawfossil', 'sailfossil',
]

export const EVO_STONES: ItemId[] = [
  'everstone', 'thunderstone', 'firestone', 'waterstone', 'leafstone',
  'sunstone', 'moonstone', 'ovalstone',
]

export const MEGA_STONES: ItemId[] = [
  'venusaurite', 'charizarditex', 'charizarditey', 'blastoiseite',
  'alakazamite', 'gengarite', 'banetteite', 'pinsirite', 'heracrossite',
  'gardevoirite', 'ampharosite', 'manectricite', 'scizorite', 'mawileite',
  'aggronite', 'gyaradosite', 'aerodactylite', 'tyranitarite', 'absolite',
  'houndoomite', 'blazikenite', 'lucarioite', 'medichamite', 'garchompite',
  'mewtwoitex', 'mewtwoitey', 'abomasnowite', 'kangaskhanite',
  // OrAs
  'sceptileite', 'swampertite', 'sharpedoite', 'cameruptite',
  'slowbroite', 'lopunnyite', 'pidgeotite', 'steelixite',
  'sableyeite', 'beedrillite', 'glalieite', 'audinoite',
  'galladeite', 'latiosite', 'latiasite', 'salamenceite',
  'metagrossite', 'altariaite', 'diancieite',
]

export const APRICORNS: ItemId[] = [
  'yellowapricorn', 'redapricorn', 'blueapricorn', 'greenapricorn',
  'whiteapricorn', 'blackapricorn', 'pinkapricorn',
]

export const CRAFTING_MATERIALS: ItemId[] = [
  'apricorn', 'ironchunk', 'tumblestone', 'skytumblestone', 'blacktumblestone',
  'cakelurebase', 'sootfootroot', 'heartygrains', 'plumpbeans', 'dazzlinghoney',
  'casterfern', 'direshroom', 'swordcap', 'candytruffle', 'springymushroom',
  'sandradish', 'crunchysalt', 'kingsleaf', 'wood',
  'hopo', // Just stick that in here
]

export const PLATES: ItemId[] = [
  'splashplate', 'zapplate', 'pixieplate', 'fistplate', 'flameplate', 'stoneplate',
  'earthplate', 'insectplate', 'dracoplate', 'icicleplate', 'ironplate', 'skyplate',
  'spookyplate', 'toxicplate', 'meadowplate', 'dreadplate', 'mindplate',
]

export const MEMORIES: ItemId[] = [
  'grassmemory', 'firememory', 'watermemory',
  'flyingmemory',
  'bugmemory', 'rockmemory',
  'fightingmemory', 'psychicmemory',
  'electricmemory', 'icememory', 'ghostmemory',
  'fairymemory', 'steelmemory', 'darkmemory',
  'dragonmemory',
]

export const Z_CRYSTALS: ItemId[] = [
  'zgrassium', 'zfirium', 'zwaterium',
  'zflyinium', 'znormalium',
  'zbuginium', 'zrockium',
  'zfightinium', 'zpsychicium',
  'zelectrium', 'zicium', 'zghostium',
  'zfairium', 'zsteelium', 'zdarkinium',
  'zdragonium',
]

export const GALAR_INGREDIENTS: ItemId[] = [
  'sausages', 'bobsfoodtin', 'bachsfoodtin', 'tinofbeans', 'bread',
  'pasta', 'mixedmushrooms', 'smokepoketail', 'largeleek', 'fancyapple',
  'brittlebones', 'packofpotatoes', 'pungentroot', 'saladmix',
  'friedfood', 'boiledegg', 'fruitbunch', 'moomoocheese', 'spicemix',
  'freshcream', 'packagedcurry', 'coconutmilk', 'instantnoodles',
  'precookedburger',
]

export const SWEETS: ItemId[] = [
  'sweetberry', 'sweetclover', 'sweetflower', 'sweetstar',
  'sweetstrawberry', 'sweetlove', /* Ribbon Sweet is rarer */
]

export const TYPE_SWSH_ITEMS: ItemId[] = [
  ...SWEETS, 'blunderpolicy', 'chippedpot', 'crackedpot', 'dynamaxcandy',
  'ejectpack', 'heavydutyboots', 'roomservice', 'sweetapple', 'tartapple',
  'throatspray', 'utilityumbrella', 'galaricatwig',
]

/**
 * Pattern:
 *   Wins = Wins(T-1) + X
 *   where X = X(T-1) + 24
 *
 * Using this formula, we can calculate prize tiers starting with 0 -> 72
 * | Tier | Total Wins |
 * | ---- | ---------- |
 * |    1 |         72 |
 * |    2 |         96 |
 * |    3 |        144 |
 * |    4 |        216 |
 * |    5 |        312 |
 * |    6 |        432 |
 * |    7 |        576 |
 * |    8 |        744 |
 * |    9 |        936 |
 * |   10 |       1152 |
 *
 * @param tier The current prize tier the player is at
 * @returns The number of battles to reach this tier
 * @see https://docs.google.com/spreadsheets/d/1sq3WUxgAUupwLsM_0rSCwi8xN1Q6lrH3By-1nTFYUOU/edit?resourcekey=0-3zN2s_RGiJCKS6BxYkYWqg
 */
export function winTier(tier: number): number {
  return 12 * (Math.pow(tier, 2) - tier + 6)
}

export function battleRanking(wins: number): number {
  const winTier = (tier: number) => {
    return 12 * (Math.pow(tier, 2) - tier + 6)
  }
  if (wins < 6) return 0
  if (wins < 24) return 1
  if (wins < 72) return 2
  let tier = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (wins < winTier(tier)) {
      return tier + 2
    }
    tier++
  }
}
