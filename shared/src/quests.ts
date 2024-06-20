import { TeamsBadge, Potw } from "./badge2"
import * as P from './gen/type-pokemon'
import * as I from './gen/type-pokemon-ids'
import { LegendaryQuest } from "./legendary-quests"
import * as L from "./legendary-quests"
import { BadgeId } from "./pokemon/types"
import { regions } from "./pokedex"
import { ItemId, ITEMS } from "./items-list"
import { Badge, Personality } from "./badge3"
import { calculateNetWorth } from "./events"
import { Users } from "./server-types"
import { MEGA_STONES, PLATES } from "./prizes"
import { datastore, get } from "./pokemon"
import { myPokemon } from "./badge-inflate"

// https://pokemon-of-the-week.firebaseapp.com/dowsing?FpDkDv9bHqJ91XupNWGt
export const CLEAR_BELL = 'yTIJvMaSvvpsjdLQ0nsE'
export const SQUIRTBOTTLE = 'SQUIRTBOTTLE'
export const BERRYPOUCH = 'BERRYGLADTOMEETYOU'
export const POKEDOLL = '36NAlRfdNYXVi0Nh2Xvz'
export const DEVONSCOPE = 'DEVONSCOPE'
export const MAGNETTRAIN_PASS = 'C4Nkyuy7Dsdpoutsv3K9'
export const SWARMS_UNLOCK = 'SWARM'
export const OVALCHARM = 'OVALCHARM'
export const UNOWNREPORT = 'RUINS_OF_THE_ALPH'
export const BANK_UNLOCK = 'BANK'
export const EXPLORER_KIT = 'GRANDUNDERGROUND'
export const TROPHY_GARDEN = 'BACKLOTANDBUTLER'
export const LEGENDARY_RAIDS = 'ENIGMAMCHN'
export const MEGABRACELET = 'MEGA_EVOLUTION'
export const FRIENDSAFARI = 'LETSALLBEFRIENDS'
export const SPIRITOMB = 'ONEHUNDREDEIGHT'
export const ZYGARDECUBE = 'ZZZ_ZZZ_ZZZ'
export const SOOTSACK = 'SPINDA_ME_RIGHT_ROUND'
export const GOGGLES = 'PROJECT_BINOCULARS'
export const COLRESSMCHN = 'POKEMONTRAINERCOLRESS'
export const ZRING = 'ZMOVE_ALOLA'
export const ADRENALINE = 'ALOLA_SOS'
export const FORAGEBAG = 'NECTARCOLLECTOR'
export const ITEMFINDER = 'METALDETECTOR'
export const MELTANBOX = 'MELTANBOX'
export const DYNAMAXBAND = 'DYNAMAXING'
export const CAMPINGGEAR = 'LETSALLMAKECURRY'
export const ROTOMBIKE = 'SPARKLINGWHITETURBOBIKE'
export const TERAORB = 'PKMNCHAMPIONNEMONA'
export const SCARLETBOOK = 'PROFESSORSADARESEARCH'
export const VIOLETBOOK = 'PROFESSORTURORESEARCH'
export const GLIMMERINGCHARM = 'ENTERAREAZERO'
 
export const SHINY_CHARM = '93Nj1QmwJlx8eGW9Vq18'
export const CATCH_CHARM_RBY = 'yuQPa32crRiPBJvi9HU9'
export const CATCH_CHARM_GSC = 'LcyYjBeK4KAq1BkYgzlx'
export const CATCH_CHARM_RSE = 'vJHZReab8dpsCgz6ixJy'
export const CATCH_CHARM_DPPT = 'drIVxbAeXnuVuWCYWTf5'
export const CATCH_CHARM_BW = 'JUNIPER'
export const CATCH_CHARM_XY = 'SYCAMORE'
export const CATCH_CHARM_SM = 'KUKUI'
export const CATCH_CHARM_SWSH = 'MAGNOLIA'
export const CATCH_CHARM_SV = 'SADATURO'

export interface Quest {
  docId: string
  badge: string
  title: string
  hint: string[]
  encounter?: BadgeId,
  item?: ItemId,
  recyclable?: boolean
  quest?: LegendaryQuest
  gate?: 'yuQPa32crRiPBJvi9HU9' | 'LcyYjBeK4KAq1BkYgzlx' |
    'DX_DNA_RNA_SPACE' | 'vJHZReab8dpsCgz6ixJy' |
    'drIVxbAeXnuVuWCYWTf5' | 'JUNIPER' | 'SYCAMORE' | 'KUKUI' | 'MAGNOLIA' |
    'SADATURO'
  completion?: string
}
export interface PokedexQuest extends Quest {
  count: number
  region: string
  shorthand: string
  /** For page-pokedex */
  sprite: string
  modes: string[]
}
export interface GlobalQuest extends Quest {
  count: number
  dbKey: string
  boss: BadgeId
}
/**
 * Medals are for achievements with multiple thresholds,
 * ie. Bronze, Silver, Gold, etc.
 * Of course, an `Achievement` is a simpler form of `Medal` with only
 * a single condition.
 */
export interface Medal {
  /**
   * Single identifying badge ID for reference. For achievements,
   * this should match the sprite.
   */
  badge: string
  /**
   * A function to run in order to determine the current count to match against
   * the `hints.count` value.
   */
  condition: (payload: L.Requirements) => number
  /**
   * The user-facing title for this medal.
   */
  title: string
  /**
   * Info to show to the user in order to get to the next level of this medal.
   * For achievements, there is only going to be a single entry.
   */
  hints: {
    /**
     * Text to show to get to the next level.
     */
    description: string
    /**
     * Number of items to get to the next level, to show to the user.
     */
    count: number
    /**
     * Image to use for the current level, in the `sprites/quests` dir.
     */
    sprite: string
  }[]
}
/**
 * A function that verifies the user has completed every requirement for a
 * provided quest.
 *
 * @param quest The quest to be checked
 * @param args The structure of requirements
 * @returns `true` if passes, or a string-based message to show when failed
 */
export function isQuestComplete(quest: LegendaryQuest, args: L.Requirements): boolean | string {
  const {hints} = quest
  for (const hint of hints) {
    const hintCompleted = hint.completed(args)
    if (!hintCompleted) {
      return hint.msg
    }
  }
  return true
}
export const KEY_ITEM_QUESTS: Quest[] = [{
  docId: SQUIRTBOTTLE,
  badge: 'potw-item-squirtbottle',
  title: 'Encountering a Weird Tree',
  hint: ['A weird tree stands in your way. Looks like it needs water.'],
  quest: L.Squirtbottle,
  item: 'squirtbottle',
}, {
  docId: BERRYPOUCH,
  badge: 'potw-item-berrypouch',
  title: 'Nearly Harvest Season',
  hint: ['You want to try out some gardening in your spare time.'],
  quest: L.BerryPouch,
  item: 'berrypouch',
}, {
  docId: POKEDOLL,
  badge: 'potw-item-pokedoll',
  title: 'Finding a Lost Doll',
  hint: ['A little girl has put up a poster for a missing doll near the train station.'],
  quest: L.Pokedoll,
}, {
  docId: POKEDOLL,
  badge: 'potw-item-pass',
  title: 'Magnet Train Pass',
  hint: ['Someone will have to give you the Magnet Train Pass. Perhaps they may give it as a reward for finding something.'],
}, {
  docId: DEVONSCOPE,
  badge: 'potw-item-devonscope',
  title: 'Seeing the Unseeable',
  gate: CATCH_CHARM_GSC,
  hint: ['Can you identify the invisible force blocking your path?'],
  quest: L.Devonscope,
  item: 'devonscope',
}, {
  docId: OVALCHARM,
  badge: 'ovalcharm',
  title: 'Pokémon Breeder - Master',
  gate: CATCH_CHARM_GSC,
  hint: ['Are you a master of breeding Pokémon? Only the best can unlock this achievement.'],
  quest: L.Ovalcharm,
  item: 'ovalcharm',
}, {
  docId: UNOWNREPORT,
  badge: 'unownreport',
  title: 'L3 Unown Intern',
  gate: CATCH_CHARM_GSC,
  hint: ['A researcher wishes to deputize you as an IC in old ruins.'],
  quest: L.UnownReport,
  item: 'unownreport',
}, {
  docId: SWARMS_UNLOCK,
  badge: 'rotoencounter',
  title: 'Breakout! Outbreaks of wild Pokémon are everywhere!',
  gate: CATCH_CHARM_RSE,
  hint: ['Professors around the world are seeing bunches of wild Pokémon. Can you help research what is going on?'],
  quest: L.Swarms,
  item: 'rotoencounter',
}, {
  docId: SOOTSACK,
  badge: 'sootsack',
  title: "Ash: Catch'em",
  gate: CATCH_CHARM_RSE,
  hint: ['You have found a business opportunity in the grasses near Mt. Chimney.'],
  quest: L.SootSack,
  item: 'sootsack',
}, {
  docId: L.TOWNMAP,
  badge: 'potw-item-townmap',
  title: 'Adding a Mini Map to the Game',
  gate: CATCH_CHARM_RSE,
  hint: ['Once you have enough travel experience, you see ways it could be better.'],
  quest: L.TownMap,
  item: 'townmap',
  recyclable: true,
}, {
  docId: BANK_UNLOCK,
  badge: 'pokemonboxlink',
  title: 'Bank',
  gate: CATCH_CHARM_DPPT,
  hint: ['You have collected a lot of Pokémon. You may want to find someplace for them all.'],
  quest: L.Bank,
  item: 'pokemonboxlink',
}, {
  docId: EXPLORER_KIT,
  badge: 'potw-item-explorerkit',
  title: 'Find a whole new level to this game',
  gate: CATCH_CHARM_DPPT,
  hint: ['Complete some tasks to impress Mr. Underground.'],
  quest: L.ExplorerKit,
  item: 'explorerkit',
  recyclable: true,
}, {
  docId: TROPHY_GARDEN,
  badge: 'trophygardenkey',
  title: "Mr. Backlot's Trophy Garden",
  gate: CATCH_CHARM_DPPT,
  hint: ['Mr. Backlot has a prized garden with many Pokémon. But the gate is locked!'],
  quest: L.TrophyGarden,
  item: 'trophygardenkey',
  recyclable: true,
}, {
  docId: SPIRITOMB,
  badge: 'potw-item-oddkeystone',
  title: 'What is inside the Odd Keystone?',
  gate: CATCH_CHARM_DPPT,
  hint: ['You hear the sound of something wailing. Where is it coming from?'],
  quest: L.OddKeystone,
  item: 'oddkeystone',
  recyclable: true,
}, {
  docId: LEGENDARY_RAIDS,
  badge: 'potw-item-enigmastone',
  title: 'Discover the power of the Enigma Stone',
  gate: CATCH_CHARM_BW,
  hint: ['What is causing Legendary Pokémon to appear?'],
  quest: L.EnigmaStone,
  item: 'enigmastone',
  recyclable: true,
}, {
  docId: COLRESSMCHN,
  badge: 'potw-item-colressmchn',
  title: 'Colress & The Mystery Machine',
  gate: CATCH_CHARM_BW,
  hint: ['There are Pokémon in hidden places, everywhere. How do we find them to capture them?'],
  quest: L.ColressMchn,
  item: 'colressmchn',
  recyclable: true,
}, {
  docId: L.VOYAGEPASS,
  badge: 'potw-item-voyagepass',
  title: 'Begin Voyaging',
  gate: CATCH_CHARM_BW,
  hint: ['You are presented with the opportunity for travel.'],
  quest: L.VoyagePass,
  item: 'voyagepass',
  recyclable: true,
}, {
  docId: L.VOYAGECHARM,
  badge: 'potw-item-voyagecharm',
  title: 'World Traveler',
  gate: CATCH_CHARM_BW,
  hint: ['With the wind at your back, you will demonstrate your worldly experience.'],
  quest: L.VoyageCharm,
  item: 'voyagecharm',
  recyclable: true,
}, {
  docId: MEGABRACELET,
  badge: 'megabracelet',
  title: 'Unlock the power of Mega Evolution',
  gate: CATCH_CHARM_BW,
  hint: ['Professor Sycamore lives in the Kalos region and is an expert on mega evolution. Can you help with his research?'],
  quest: L.Megas,
  item: 'megabracelet',
  recyclable: true,
}, {
  docId: FRIENDSAFARI,
  badge: 'friendsafaripass',
  title: 'Granting access to the Friend Safari',
  gate: CATCH_CHARM_XY,
  hint: ['In the outskirts of the Kalos region there is a new safari zone.'],
  quest: L.FriendSafari,
  item: 'friendsafaripass',
  recyclable: true,
}, {
  docId: ZYGARDECUBE,
  badge: 'zygardecube',
  title: 'Celluluar Collection',
  gate: CATCH_CHARM_XY,
  hint: ['Professor Sycamore is looking to bequeath you with a new quest.'],
  quest: L.ZygardeCube,
  item: 'zygardecube',
  recyclable: true,
}, {
  docId: GOGGLES,
  badge: 'goggles',
  title: 'Go-Goggles',
  gate: CATCH_CHARM_XY,
  hint: ['A rare pair of goggles are available for purchase. Can you prove you deserve them?'],
  quest: L.Goggles,
  item: 'gogoggles',
  recyclable: true,
}, {
  docId: ZRING,
  badge: 'potw-item-zpowerring',
  title: 'Unlock the power of Z-Moves',
  gate: CATCH_CHARM_XY,
  hint: ['Professor Kukui lives in the Alola region and is an expert on Z-Moves. Can you help with his research?'],
  quest: L.ZRing,
  item: 'zpowerring',
  recyclable: true,
}, {
  docId: L.CRAFTING,
  badge: 'potw-item-craftingkit',
  title: 'Homemade Goods, Made with Love',
  gate: CATCH_CHARM_XY,
  hint: ['You decide to study the history and crafting of the ancient Sinnoh region.'],
  quest: L.CraftingKit,
  item: 'craftingkit',
  recyclable: true,
}, {
  docId: ADRENALINE,
  badge: 'potw-item-adrenalineorb',
  title: 'Save our Ship!',
  gate: CATCH_CHARM_SM,
  hint: ['Pokémon may call for help when they feel trapped. Can you catch those helper Pokémon as well?'],
  quest: L.AdrenalineOrb,
  recyclable: true,
  item: 'adrenalineorb',
}, {
  docId: FORAGEBAG,
  badge: 'potw-item-foragebag',
  title: 'Nectar Collector',
  gate: CATCH_CHARM_SM,
  hint: ['All around the world are colorful flowers. Closer inspection may reveal something even more.'],
  quest: L.ForageBag,
  item: 'foragebag',
  recyclable: true,
}, {
  docId: ITEMFINDER,
  badge: 'potw-item-itemfinder',
  title: 'Scanning for buried treasure',
  gate: CATCH_CHARM_SM,
  hint: ['Alola has many beaches. Historical records tell of many treasures beneath them.'],
  quest: L.ItemFinder,
  item: 'itemfinder',
  recyclable: true,
}, {
  docId: MELTANBOX,
  badge: 'potw-item-meltanbox',
  title: 'What is this thing? It looks like a placeholder!',
  gate: CATCH_CHARM_SM,
  hint: ['A small odd-looking thing is becoming more common. What is it exactly? How can you get one close enough?'],
  quest: L.Meltan,
  item: 'meltanbox',
  recyclable: true,
}, {
  docId: DYNAMAXBAND,
  badge: 'potw-item-dynamaxband',
  title: 'A cloth from the Wishing Star',
  gate: CATCH_CHARM_SM,
  hint: ['You find a small rock from space. Will Professor Magnolia use it to create something for you?'],
  quest: L.DynamaxBand,
  item: 'dynamaxband',
  recyclable: true,
}, {
  docId: CAMPINGGEAR,
  badge: 'potw-item-campinggear',
  title: 'Curry at the Pokémon Camp',
  gate: CATCH_CHARM_SM,
  hint: ['As you travel, you feel the pangs of hunger. Can you take a break and cook something?'],
  quest: L.CampingGear,
  item: 'campinggear',
  recyclable: true,
}, {
  docId: ROTOMBIKE,
  badge: 'potw-item-rotombike',
  title: 'Bike across Galar',
  gate: CATCH_CHARM_SWSH,
  hint: [`You may want to travel across the Wild Area. However, it is much too big to just walk. You'll need better transportation.`],
  quest: L.RotomBike,
  item: 'rotombike',
  recyclable: true,
}, {
  docId: TERAORB,
  badge: 'potw-item-teraorb',
  title: 'Gain the power of Terastallization',
  gate: CATCH_CHARM_SWSH,
  hint: [`After your many adventures, you are ready for a new journey to a new region.`],
  quest: L.TeraOrb,
  item: 'teraorb',
  recyclable: true,
}, {
  docId: SCARLETBOOK,
  badge: 'potw-item-scarletbook',
  title: "Following the research of Sada",
  gate: CATCH_CHARM_SV,
  hint: [`Years later, you hear of a book that was sought after by Professor Sada.`],
  quest: L.ScarletBook,
  item: 'scarletbook',
  recyclable: true,
}, {
  docId: VIOLETBOOK,
  badge: 'potw-item-violetbook',
  title: "Following the research of Turo",
  gate: CATCH_CHARM_SV,
  hint: [`Many years later, you hear of a book that was sought after by Professor Turo.`],
  quest: L.VioletBook,
  item: 'violetbook',
  recyclable: true,
}, {
  docId: GLIMMERINGCHARM,
  badge: 'potw-item-glimmeringcharm',
  title: "The hunt for treasure continues",
  gate: CATCH_CHARM_SV,
  hint: [`Your treasure hunt takes you to the depths of Paldea's large crater.`],
  quest: L.GlimmeringCharm,
  item: 'glimmeringcharm',
  recyclable: true,
}]
export const LEGENDARY_ITEM_QUESTS: Quest[] = [{
  docId: L.MEWTWO,
  badge: 'potw-item-airmail',
  title: 'Cinnabar Island Journals',
  hint: ['There are lost pages from an old journal. Can they all be recovered?'],
  quest: L.Mewtwo,
  encounter: P.Mewtwo,
  recyclable: true,
  completion: `Mewtwo has appeared in front of you. It seems intrigued by you.`
}, {
  docId: L.MEW,
  badge: 'potw-encounter-truck',
  title: 'Mysterious Truck',
  hint: ['Is something underneath the truck? May need to push it out of the way.'],
  quest: L.Mew,
  encounter: P.Mew,
  recyclable: true,
  completion: 'The truck is pushed out of the way and a small creature begins to float in the air. It seems to be in a good mood.'
}, {
  docId: CLEAR_BELL,
  badge: 'potw-item-clearbell',
  title: 'Collect the Clear Bell',
  gate: CATCH_CHARM_RBY,
  hint: ['You can obtain the Clear Bell after getting a correct answer in the radio quiz.']
}, {
  docId: L.GYARADOS,
  quest: L.captureGyarados,
  badge: 'potw-130',
  title: 'The beast in the Lake of Rage',
  gate: CATCH_CHARM_RBY,
  hint: [`Something is stirring in the lake.`],
  encounter: Potw(P.Gyarados, {shiny: true}),
}, {
  docId: L.LUGIA,
  quest: L.captureLugia,
  badge: 'potw-item-silverwing',
  title: 'The Pristine Silver Wing',
  gate: CATCH_CHARM_RBY,
  hint: ['It has been said that a mysterious creature will present itself to strong trainers holding the wing.'],
  encounter: P.Lugia,
  recyclable: true,
  completion: 'A gust of wind blows past you, and you look up to find the source. ' +
  'The creature that dropped the silvery wing sees you, ' +
  'and you can tell it senses your strength.'
}, {
  docId: L.HO_OH,
  quest: L.captureHoOh,
  badge: 'potw-item-rainbowwing',
  title: 'The Brilliant Rainbow Wing',
  gate: CATCH_CHARM_RBY,
  hint: ['Myths state that a strong creature will show itself to trainers who are strong while holding the wing.'],
  encounter: P.Ho_Oh,
  recyclable: true,
  completion: 'You see a shadow as a large being flies above a rainbow. It turns around and returns ' +
  'to look at you. It seems to be impressed by you.'
}, {
  docId: L.GS_BALL,
  quest: L.captureCelebi,
  badge: 'potw-item-gsball',
  title: 'The Foresty Shrine',
  gate: CATCH_CHARM_RBY,
  hint: ['You want to build a small wooden shrine in the woods. You will need to collect some materials.'],
  encounter: P.Celebi,
  recyclable: true,
  completion: 'The gold and silver ball is placed neatly in the center of the shrine you have built. ' +
  'Suddenly a ' +
  'burst of light flashes in front of you. You see a small Pokémon circle around the ' +
  'shrine and land on top. It seems to appreciate your handiwork.'
}, {
  docId: L.GROUDON,
  quest: L.captureGroudon,
  badge: 'potw-item-redorb',
  title: 'The Mystery of the Red Orb',
  gate: CATCH_CHARM_GSC,
  hint: ['A trainer may give you a Red Orb if you prove yourself. What does it do?'],
  encounter: P.Groudon,
  recyclable: true,
  completion: 'A giant beast emerges from the volcanic lava and appears attracted to the ruby luster of the Red Orb.'
}, {
  docId: L.KYOGRE,
  quest: L.captureKyogre,
  badge: 'potw-item-blueorb',
  title: 'The Legend of the Blue Orb',
  gate: CATCH_CHARM_GSC,
  hint: ['A trainer may give you a Blue Orb if you prove yourself. What does it do?'],
  encounter: P.Kyogre,
  recyclable: true,
  completion: 'A large creature emerges from the raging sea and appears attracted to the sapphire glow of the Blue Orb.',
}, {
  docId: L.REGIROCK,
  quest: L.captureRegirock,
  badge: 'potw-encounter-regir',
  title: 'Rocky Cavern',
  gate: CATCH_CHARM_GSC,
  hint: ['A rocky cavern is rumored to appear in the midst of a sandstorm.'],
  encounter: P.Regirock,
  recyclable: true,
}, {
  docId: L.REGICE,
  quest: L.captureRegice,
  badge: 'potw-encounter-regii',
  title: 'Icy Cavern',
  gate: CATCH_CHARM_GSC,
  hint: ['The mirage of an ice cave is said to show up in the snow.'],
  encounter: P.Regice,
  recyclable: true,
}, {
  docId: L.REGISTEEL,
  quest: L.captureRegisteel,
  badge: 'potw-encounter-regis',
  title: 'Iron Cavern',
  gate: CATCH_CHARM_GSC,
  hint: ['Intimidating bolts of lightning are said to strike a cave made of metal.'],
  encounter: P.Registeel,
  recyclable: true,
}, {
  docId: L.RAYQUAZA,
  quest: L.captureRayquaza,
  badge: 'potw-encounter-skypillar',
  title: 'Entering Sky Pillar',
  gate: CATCH_CHARM_GSC,
  hint: ['There is a pillar that appears to touch the sky while in the middle of the ocean. Who built it?'],
  encounter: P.Rayquaza,
  recyclable: true,
  completion: `From the peak of Sky Pillar you see a dragon descending to meet you.
  As it hovers above you, you can feel its breath. It seems drawn to you.`
}, {
  docId: L.JIRACHI,
  quest: L.captureJirachi,
  badge: 'potw-encounter-wish',
  title: 'Wishing Star',
  gate: CATCH_CHARM_GSC,
  hint: ['Professor Birch has spoken about shooting stars at night and a comet that comes once a millennium!'],
  encounter: P.Jirachi,
  recyclable: true,
  completion: `A shooting star flies overhead. As you begin to make a wish, it stops
  and descends in front of you. The star unfurls itself to reveal a small
  being with its three eyes closed. It wakes up and stares at you quietly.`
}, {
  docId: L.DEOXYS,
  quest: L.captureDeoxys,
  badge: 'potw-encounter-meteorite',
  title: 'A strange lifeform',
  gate: CATCH_CHARM_GSC,
  hint: ['A strange lifeform has been identified in the middle of a meteorite from outer space!'],
  encounter: P.Deoxys,
  recyclable: true,
  item: 'obsidianmeteorite',
  completion: `A burst of light shoots out of the meteorite and a lifeform assembles itself.
  It looks around at its surroundings with an air of curiosity. It seems to find you
  to be the most curious.`
}, {
  docId: L.DEOXYS_ATK,
  quest: L.captureDeoxysAtk,
  badge: 'potw-item-rigidmeteorite',
  title: 'The strange lifeform attacks!',
  gate: L.DEOXYS,
  hint: ['The strange lifeform is growing to an intimidating size!'],
  item: 'rigidmeteorite',
  completion: `Through the chaos of its attacks, it stops when it spots you. The
  lifeform appears to be intimidated by you, and it calms down.`
}, {
  docId: L.DEOXYS_DEF,
  quest: L.captureDeoxysDef,
  badge: 'potw-item-sturdymeteorite',
  title: 'The strange lifeform protects!',
  gate: L.DEOXYS,
  hint: ['Attempts to subdue the lifeform are being nullified with its shielding!'],
  item: 'sturdymeteorite',
  completion: `The lifeform's barriers seem impenetrable. Yet, when it sees you nearby,
  the barriers go away and it seems to await your response.`
}, {
  docId: L.DEOXYS_SPE,
  quest: L.captureDeoxysSpe,
  badge: 'potw-item-smoothmeteorite',
  title: 'The strange lifeform vanishes!',
  gate: L.DEOXYS,
  hint: ['During the encounter with the lifeform, it has quickly vanished into the unknown!'],
  item: 'smoothmeteorite',
  completion: `While others search far and wide for the missing lifeform, it appears to
  have retreated into the meteorite. It reforms as it detects your presence.`,
}, {
  docId: L.SPIRITOMB,
  quest: L.captureSpiritomb,
  badge: 'spiritomb',
  title: 'The eerie voice',
  gate: CATCH_CHARM_RSE,
  hint: ['An eerie voice calls out to you at night.'],
  encounter: P.Spiritomb,
}, {
  docId: L.CRESSELIA,
  quest: L.captureCresselia,
  badge: 'potw-488',
  title: 'The Nightlight',
  gate: CATCH_CHARM_RSE,
  hint: ['Something bright shines in the midst of night.'],
  encounter: P.Cresselia,
  recyclable: true,
}, {
  docId: L.UXIE,
  quest: L.captureUxie,
  badge: 'potw-encounter-uxie',
  title: 'Lake Acuity Mystery',
  gate: CATCH_CHARM_RSE,
  hint: ['What is lurking near the lake?'],
  encounter: P.Uxie,
  recyclable: true,
}, {
  docId: L.AZELF,
  quest: L.captureAzelf,
  badge: 'potw-encounter-azelf',
  title: 'Lake Valor Mystery',
  gate: CATCH_CHARM_RSE,
  hint: ['What is hiding at the lake?'],
  encounter: P.Azelf,
  recyclable: true,
}, {
  docId: L.DIALGA,
  quest: L.captureDialga,
  badge: 'potw-item-adamantorb',
  title: 'Brilliant Diamond',
  gate: CATCH_CHARM_RSE,
  hint: ['Something brilliant shines from the top of a mountain.'],
  encounter: P.Dialga,
  recyclable: true,
}, {
  docId: L.PALKIA,
  quest: L.capturePalkia,
  badge: 'potw-item-lustrousorb',
  title: 'Shining Pearl',
  gate: CATCH_CHARM_RSE,
  hint: ['Something shining is coming from the peak of a mountain.'],
  encounter: P.Palkia,
  recyclable: true,
}, {
  docId: L.GIRANTINA,
  quest: L.captureGirantina,
  badge: 'potw-item-gresiousorb',
  title: 'T̶̯̀ḧ̵̜ȅ̶̙ ̵̰͋D̷̤̆ĩ̷̲s̷̙̈́t̵̬͑o̸̞͠r̷̛̦t̸̩̓i̷͚͒o̵̖͊n̶̢̔ ̸͙̆W̶͉͠ö̸͜r̸̫̕l̴̫͂d̴͙̈',
  gate: CATCH_CHARM_RSE,
  hint: ['A portal to another world has opened up.'],
  encounter: Potw(P.Giratina, {form: 'altered'}),
  recyclable: true,
}, {
  docId: L.HEATRAN,
  quest: L.captureHeatran,
  badge: 'potw-item-magmastone',
  title: 'A Stark Eruption',
  gate: CATCH_CHARM_RSE,
  hint: ['Something is happening on Stark Mountain.'],
  encounter: P.Heatran,
  recyclable: true,
}, {
  docId: L.REGIGIGAS,
  quest: L.captureRegigias,
  badge: 'potw-encounter-regigigas',
  title: 'A Temple Uncovered',
  gate: CATCH_CHARM_RSE,
  hint: ['A hidden temple has just been rediscovered.'],
  encounter: P.Regigigas,
  recyclable: true,
}, {
  docId: L.DARKRAI,
  quest: L.captureDarkrai,
  badge: 'potw-item-membercard',
  title: 'The Nightmare',
  gate: CATCH_CHARM_RSE,
  hint: ['You awake in the middle of the night in a cold sweat.'],
  encounter: P.Darkrai,
  recyclable: true,
}, {
  docId: L.MANAPHY,
  quest: L.captureManaphy,
  badge: 'potw-encounter-manaphy',
  title: 'The ocean lays an egg',
  gate: CATCH_CHARM_RSE,
  hint: ['You have encountered an egg on the beach.'],
  encounter: P.Manaphy,
  recyclable: true,
}, {
  docId: L.SHAYMIN,
  quest: L.captureShaymin,
  badge: 'potw-item-gracidea',
  title: 'Flowers are in Bloom',
  gate: CATCH_CHARM_RSE,
  hint: ['Professor Oak has sent you a letter.'],
  encounter: Potw(P.Shaymin, {form: 'land'}),
  recyclable: true,
}, {
  docId: L.ARCEUS,
  quest: L.captureArceus,
  badge: 'azureflute',
  title: 'Judgment Day',
  gate: CATCH_CHARM_RSE,
  hint: ['You pick up an azure flute.'],
  encounter: P.Arceus,
  recyclable: true,
}, {
  docId: L.COBALION,
  quest: L.captureCobalion,
  badge: 'cobalion',
  title: 'Swords of Justice: Silent Steel',
  gate: CATCH_CHARM_DPPT,
  hint: ['You are challenged by a powerful adversary in the fields.'],
  encounter: P.Cobalion,
  recyclable: true,
}, {
  docId: L.TERRAKION,
  quest: L.captureTerrakion,
  badge: 'terrakion',
  title: 'Swords of Justice: Resilient Rock',
  gate: CATCH_CHARM_DPPT,
  hint: ['You are challenged by a powerful adversary in the mountains.'],
  encounter: P.Terrakion,
  recyclable: true,
}, {
  docId: L.VIRIZION,
  quest: L.captureVirizion,
  badge: 'virizion',
  title: 'Swords of Justice: Graceful Grass',
  gate: CATCH_CHARM_DPPT,
  hint: ['You are challenged by a powerful adversary in the woods.'],
  encounter: P.Virizion,
  recyclable: true,
}, {
  docId: L.LANDORUS,
  quest: L.captureLandorus,
  badge: 'landorus',
  title: 'The Wicked Djinn of the West',
  gate: CATCH_CHARM_DPPT,
  hint: ['Something wicked this way blows.'],
  encounter: Potw(P.Landorus, {form: 'incarnate'}),
  recyclable: true,
}, {
  docId: L.VICTINI,
  quest: L.captureVictini,
  badge: 'victini',
  title: 'Achievement of Liberty',
  gate: CATCH_CHARM_DPPT,
  hint: ['There is a contest to obtain a Liberty Pass.'],
  encounter: P.Victini,
  recyclable: true,
}, {
  docId: L.RESHIRAM,
  quest: L.captureReshiram,
  badge: 'reshiram',
  title: 'The Pursuit of Truth',
  gate: CATCH_CHARM_DPPT,
  hint: ['There is a whisper in the wind. It causes you to sweat.'],
  encounter: P.Reshiram,
  recyclable: true,
}, {
  docId: L.ZEKROM,
  quest: L.captureZekrom,
  badge: 'zekrom',
  title: 'The Pursuit of Ideals',
  gate: CATCH_CHARM_DPPT,
  hint: ['There is a whisper in the wind. The hairs on your body stand on end.'],
  encounter: P.Zekrom,
  recyclable: true,
}, {
  docId: L.KYUREM,
  quest: L.captureKyurem,
  badge: 'kyurem',
  title: 'The Dragon Shell',
  gate: CATCH_CHARM_DPPT,
  hint: ['There is a whisper in the wind. It causes you to shiver.'],
  encounter: P.Kyurem,
  recyclable: true,
}, {
  docId: L.KELDEO,
  quest: L.captureKeldeo,
  badge: 'keldeo',
  title: 'The Apprentice',
  gate: CATCH_CHARM_BW,
  hint: ['The Swords of Justice are training a fourth.'],
  encounter: Potw(P.Keldeo, {form: 'ordinary'}),
  recyclable: true,
}, {
  docId: L.MELOLETTA,
  quest: L.captureMeloletta,
  badge: 'meloletta',
  title: 'Folk Tunes',
  gate: CATCH_CHARM_BW,
  hint: ['You hear a familiar song, one sung since ancient times.'],
  encounter: Potw(P.Meloetta, {form: 'aria'}),
  recyclable: true,
}, {
  docId: L.GENESECT,
  quest: L.captureGenesect,
  badge: 'genesect',
  title: 'Plasma\'s Experiment',
  gate: CATCH_CHARM_BW,
  hint: ['You have learned of a rumor that Team Plasma has created a Pokémon.'],
  encounter: P.Genesect,
  recyclable: true,
}, {
  docId: L.KYUREM_BLACK,
  quest: L.captureKyuremBlack,
  badge: 'blackkyurem',
  title: 'Colress Experiment 1',
  gate: CATCH_CHARM_BW,
  hint: ['A rogue scientist from Team Plasma has continued their experiments.'],
  item: 'dnasplicerblack',
}, {
  docId: L.KYUREM_WHITE,
  quest: L.captureKyuremWhite,
  badge: 'whitekyurem',
  title: 'Colress Experiment 2',
  gate: CATCH_CHARM_BW,
  hint: ['A rogue scientist from Team Plasma has been seen at academic conferences.'],
  item: 'dnasplicerwhite',
}, {
  docId: L.THERIAN,
  quest: L.getRevealGlass,
  badge: 'therian',
  title: 'Through the Looking Glass',
  gate: CATCH_CHARM_BW,
  hint: ['The truth is out there, on the other side.'],
  item: 'revealglass',
}, {
  docId: L.VIVILLON,
  quest: L.PokeballVivillon,
  badge: 'potw-666-pokeball',
  title: 'The elusive PokéBall Form Vivillon',
  gate: CATCH_CHARM_XY,
  hint: ['If you collect enough Vivillon, a rare one may appear.'],
  encounter: Potw(P.Vivillon, {form: 'pokeball'}),
  recyclable: true,
}, {
  docId: L.XERNEAS,
  quest: L.Xerneas,
  badge: 'xerneas',
  title: 'The Mysteries of Life',
  gate: CATCH_CHARM_XY,
  hint: ['What is this rainbow deer in the woods?'],
  encounter: P.Xerneas,
  recyclable: true,
}, {
  docId: L.YVELTAL,
  quest: L.Yveltal,
  badge: 'yveltal',
  title: 'The Sorrows of Destruction',
  gate: CATCH_CHARM_XY,
  hint: ['What is this glowing red bird in the sky?'],
  encounter: P.Yveltal,
  recyclable: true,
}, {
  docId: L.ZYGARDECELL,
  quest: L.ZygardeCell,
  badge: 'zygardecell',
  title: 'Small Green Lifeform',
  gate: CATCH_CHARM_XY,
  hint: ['Have you seen something green slithering around? It gives me the creeps.'],
  item: 'zygardecell',
}, {
  docId: L.HOOPA,
  quest: L.Hoopa,
  badge: 'hoopa',
  title: 'Wishes are easy and fun to do',
  gate: CATCH_CHARM_XY,
  hint: ['You are on the search for a wishing Pokémon.'],
  encounter: Potw(P.Hoopa, {form: 'confined'}),
  recyclable: true,
}, {
  docId: L.PRISONBOTTLE,
  quest: L.PrisonBottle,
  badge: 'prison-bottle',
  title: 'Actually, be careful what you wish for',
  gate: CATCH_CHARM_XY,
  hint: ['This wishing Pokémon belongs in an ancient vessel'],
  item: 'prisonbottle',
}, {
  docId: L.VOLCANION,
  quest: L.Volcanion,
  badge: 'volcanion',
  title: 'Eruption',
  gate: CATCH_CHARM_XY,
  hint: ['Something amiss is happening at the power plant.'],
  encounter: P.Volcanion,
  recyclable: true,
}, {
  docId: L.DIANCIE,
  quest: L.Diancie,
  badge: 'diancie',
  title: 'Diamonds are Forever',
  gate: CATCH_CHARM_XY,
  hint: ['You come across a shard of carbon, polished and crystalized'],
  encounter: P.Diancie,
  recyclable: true,
}, {
  docId: L.TYPE_NULL,
  quest: L.TypeNull,
  badge: 'typenull',
  title: 'The chimera of Aether',
  gate: CATCH_CHARM_SM,
  hint: ['While in the Aether Foundation you spot something unusual.'],
  encounter: P.Type_Null,
  recyclable: true,
}, {
  docId: L.TAPU_KOKO,
  quest: L.TapuKoko,
  badge: 'tapukoko',
  title: 'The Guardian of Mele Mele Island',
  gate: CATCH_CHARM_SM,
  hint: ['An Electric-type Pokémon is said to protect the island.'],
  encounter: P.Tapu_Koko,
  recyclable: true,
}, {
  docId: L.TAPU_LELE,
  quest: L.TapuLele,
  badge: 'tapulele',
  title: 'The Guardian of Akala Island',
  gate: CATCH_CHARM_SM,
  hint: ['A Psychic-type Pokémon is said to protect the island.'],
  encounter: P.Tapu_Lele,
  recyclable: true,
}, {
  docId: L.TAPU_BULU,
  quest: L.TapuBulu,
  badge: 'tapubulu',
  title: "The Guardian of Ula'Ula Island",
  gate: CATCH_CHARM_SM,
  hint: ['A Grass-type Pokémon is said to protect the island.'],
  encounter: P.Tapu_Bulu,
  recyclable: true,
}, {
  docId: L.TAPU_FINI,
  quest: L.TapuFini,
  badge: 'tapufini',
  title: 'The Guardian of Poni Island',
  gate: CATCH_CHARM_SM,
  hint: ['A Water-type Pokémon is said to protect the island.'],
  encounter: P.Tapu_Fini,
  recyclable: true,
}, {
  docId: L.SUN_FLUTE,
  quest: L.SunFlute,
  badge: 'sunflute',
  title: 'The Beast Who Devours the Sun',
  gate: CATCH_CHARM_SM,
  hint: ['This Pokémon reminds you of the sun.'],
  item: 'sunflute',
}, {
  docId: L.MOON_FLUTE,
  quest: L.MoonFlute,
  badge: 'moonflute',
  title: 'The Bat Who Devours the Moon',
  gate: CATCH_CHARM_SM,
  hint: ['This Pokémon reminds you of the moon.'],
  item: 'moonflute',
}, {
  docId: L.NECROZMA,
  quest: L.Necrozma,
  badge: 'necrozma',
  title: 'The Prism Pokémon',
  gate: CATCH_CHARM_SM,
  hint: ['Something is stirring underground and inching towards the light.'],
  encounter: P.Necrozma,
  recyclable: true,
}, {
  docId: L.MAGEARNA,
  quest: L.Magearna,
  badge: 'magearna',
  title: 'The Artificial Pokémon',
  gate: CATCH_CHARM_SM,
  hint: ['What is the source of that mysterious ticking noise?'],
  encounter: P.Magearna,
  recyclable: true,
}, {
  docId: L.NECROZMA_Z,
  quest: L.NecrozmaUltra,
  badge: 'necrozmaz',
  title: 'The Ultra Light Eater',
  gate: CATCH_CHARM_SM,
  hint: ['Your Necrozma is getting hungry for more light.'],
  item: 'zultranecrozium',
}, {
  docId: L.NECROZMA_SOLGALEO,
  quest: L.NSolarizer,
  badge: 'nsolarizer',
  title: 'Solar Fusion',
  gate: CATCH_CHARM_SM,
  hint: ['A mysterious inventor offers you a chance to bind to the sun.'],
  item: 'nsolarizer',
}, {
  docId: L.NECROZMA_LUNALA,
  quest: L.NLunarizer,
  badge: 'nlunarizer',
  title: 'Lunar Fusion',
  gate: CATCH_CHARM_SM,
  hint: ['A mysterious inventor offers you a chance to bind to the moon.'],
  item: 'nlunarizer',
}, {
  docId: L.NIHILEGO,
  quest: L.Nihilego,
  badge: 'nihilego',
  title: 'UB-01 SYMBIONT',
  gate: CATCH_CHARM_SM,
  hint: ['Something alien came out of the Ultra Wormhole!'],
  encounter: P.Nihilego,
  recyclable: false,
}, {
  docId: L.BUZZWOLE,
  quest: L.Buzzwole,
  badge: 'buzzwole',
  title: 'UB-02 ABSORPTION',
  gate: CATCH_CHARM_SM,
  hint: ['Something swole came out of the Ultra Wormhole!'],
  encounter: P.Buzzwole,
  recyclable: true,
}, {
  docId: L.PHERAMOSA,
  quest: L.Pheramosa,
  badge: 'pheramosa',
  title: 'UB-02 BEAUTY',
  gate: CATCH_CHARM_SM,
  hint: ['Something elegant came out of the Ultra Wormhole!'],
  encounter: P.Pheromosa,
  recyclable: true,
}, {
  docId: L.XURKITREE,
  quest: L.Xurkitree,
  badge: 'xurkitree',
  title: 'UB-03 LIGHTING',
  gate: CATCH_CHARM_SM,
  hint: ['Something bright came out of the Ultra Wormhole!'],
  encounter: P.Xurkitree,
  recyclable: false,
}, {
  docId: L.CELESTEELA,
  quest: L.Celesteela,
  badge: 'celesteela',
  title: 'UB-04 BLASTER',
  gate: CATCH_CHARM_SM,
  hint: ['Something tall came out of the Ultra Wormhole!'],
  encounter: P.Celesteela,
  recyclable: true,
}, {
  docId: L.KARTANA,
  quest: L.Kartana,
  badge: 'kartana',
  title: 'UB-04 BLADE',
  gate: CATCH_CHARM_SM,
  hint: ['Something sharp came out of the Ultra Wormhole!'],
  encounter: P.Kartana,
  recyclable: true,
}, {
  docId: L.GUZZLORD,
  quest: L.Guzzlord,
  badge: 'guzzlord',
  title: 'UB-05 GLUTTONY',
  gate: CATCH_CHARM_SM,
  hint: ['Something massive came out of the Ultra Wormhole!'],
  encounter: P.Guzzlord,
  recyclable: true,
}, {
  docId: L.STAKATAKA,
  quest: L.Stakataka,
  badge: 'stakataka',
  title: 'UB-?? ASSEMBLY',
  gate: CATCH_CHARM_SM,
  hint: ['Something sturdy came out of the Ultra Wormhole!'],
  encounter: P.Stakataka,
  recyclable: true,
}, {
  docId: L.BLACEPHALON,
  quest: L.Blacephalon,
  badge: 'blacephalon',
  title: 'UB-?? BURST',
  gate: CATCH_CHARM_SM,
  hint: ['Something funny came out of the Ultra Wormhole!'],
  encounter: P.Blacephalon,
  recyclable: true,
}, {
  docId: L.POIPOLE,
  quest: L.Poipole,
  badge: 'poipole',
  title: 'The Poison Pin from the Ultra Wormhole',
  gate: CATCH_CHARM_SM,
  hint: ['You hear something small coming from the other side of an Ultra Wormhole. Can you draw it out?'],
  encounter: P.Poipole,
  recyclable: true,
}, {
  docId: L.ZERAORA,
  quest: L.Zeraora,
  badge: 'zeraora',
  title: 'The Power of Us',
  gate: CATCH_CHARM_SM,
  hint: ['Something raced by at the speed of lightning!'],
  encounter: P.Zeraora,
  recyclable: true,
}, {
  docId: L.MARSHADOW,
  quest: L.Marshadow,
  badge: 'marshadow',
  title: 'The Gloomdweller in the Dark',
  gate: CATCH_CHARM_SM,
  hint: ['You feel something watching you. You look down to see two shadows! Can you draw out the shadow?'],
  encounter: P.Marshadow,
  recyclable: true,
}, {
  docId: L.MAGEARNA_POKEBALL,
  quest: L.MagearnaPokeball,
  badge: 'magearna2',
  title: 'Clockwork PokéBall',
  gate: CATCH_CHARM_SM,
  hint: ['You have found an old mechanical object. Can you revive it?'],
  encounter: Potw(P.Magearna, {form: 'original'}),
  recyclable: true,
}, {
  docId: L.ZACIAN,
  quest: L.Zacian,
  badge: 'zacian',
  title: 'The Crowned Sword',
  gate: CATCH_CHARM_SWSH,
  hint: ['In the forest, you see a flash of cyan and hear a loud howl.'],
  encounter: Potw(P.Zacian, {form: 'hero_of_many_battles'}),
  item: 'rustedsword',
  recyclable: true,
}, {
  docId: L.ZAMAZENTA,
  quest: L.Zamazenta,
  badge: 'zamazenta',
  title: 'The Crowned Shield',
  gate: CATCH_CHARM_SWSH,
  hint: ['In the forest, you see a flash of magenta and hear a loud howl.'],
  encounter: Potw(P.Zamazenta, {form: 'hero_of_many_battles'}),
  item: 'rustedshield',
  recyclable: true,
}, {
  docId: L.ETERNATUS,
  quest: L.Eternatus,
  badge: 'eternatus',
  title: `Rose's Plan for Unlimited Power`,
  gate: CATCH_CHARM_SWSH,
  hint: ['At the top of Macro Cosmos, Chairman Rose has been nuturing a rare Pokémon.'],
  encounter: P.Eternatus,
  recyclable: true,
}, {
  docId: L.KUBFU,
  quest: L.Kubfu,
  badge: 'kubfu',
  title: `Tiny Creature on the Isle of Armor`,
  gate: CATCH_CHARM_SWSH,
  hint: ['The move expert Mustard suggests a new Pokémon may suit you.'],
  encounter: P.Kubfu,
  recyclable: true,
}, {
  docId: L.URSHIFUWATER,
  quest: L.UrshifuWater,
  badge: 'scrollofwaters',
  title: 'Training within the Water Tower',
  gate: CATCH_CHARM_SWSH,
  hint: ['Do you choose to enter the Tower of Water with your Kubfu?'],
  item: 'scrollofwaters',
  recyclable: true,
}, {
  docId: L.URSHIFUDARK,
  quest: L.UrshifuDark,
  badge: 'scrollofdarkness',
  title: 'Training within the Darkness Tower',
  gate: CATCH_CHARM_SWSH,
  hint: ['Do you choose to enter the Tower of Darkness with your Kubfu?'],
  item: 'scrollofdarkness',
  recyclable: true,
}, {
  docId: L.ZARUDE,
  quest: L.Zarude,
  badge: 'zarude',
  title: `Secrets of the Jungle`,
  gate: CATCH_CHARM_SWSH,
  hint: ['A rare Pokémon is said to live in the depths of the jungle. How can you draw it out?'],
  encounter: P.Zarude,
  recyclable: true,
}, {
  docId: L.REGIELEKI,
  quest: L.Regieleki,
  badge: 'regieleki',
  title: `Split-Decision Ruins (1/2)`,
  gate: CATCH_CHARM_SWSH,
  hint: ['From an old journal, you hear about a rare Pokémon living in the depths of the ruins.'],
  encounter: P.Regieleki,
  recyclable: true,
}, {
  docId: L.REGIDRAGO,
  quest: L.Regidrago,
  badge: 'regidrago',
  title: `Split-Decision Ruins (2/2)`,
  gate: CATCH_CHARM_SWSH,
  hint: ['From an old journal, you hear about a rare Pokémon living in the depths of the ruins.'],
  encounter: P.Regidrago,
  recyclable: true,
}, {
  docId: L.GLASTRIER,
  quest: L.Glastrier,
  badge: 'glastrier',
  title: 'The Ice Horse of the Crown Tundra',
  gate: CATCH_CHARM_SWSH,
  hint: ['The people of Freezington speak of a horse with a chilling neigh'],
  encounter: P.Glastrier,
  recyclable: true,
  item: 'reinsofunityglacier',
}, {
  docId: L.SPECTRIER,
  quest: L.Spectrier,
  badge: 'spectrier',
  title: 'The Nightmare Horse of the Crown Tundra',
  gate: CATCH_CHARM_SWSH,
  hint: ['The people of Freezington speak of a horse with a grim neigh'],
  encounter: P.Spectrier,
  recyclable: true,
  item: 'reinsofunityspectral',
}, {
  docId: L.CALYREX,
  quest: L.Calyrex,
  badge: 'calyrex',
  title: 'The High King with the Crown',
  gate: CATCH_CHARM_SWSH,
  hint: ['In the town of Freezington, an ancient memorial is dedicated to a strange Pokémon.'],
  encounter: P.Calyrex,
  recyclable: true,
}, {
  docId: L.PLAPONY,
  quest: L.PlaPony,
  badge: 'plapony',
  title: 'A Peculiar Ponyta',
  gate: CATCH_CHARM_SWSH,
  hint: ['A villager named Yota remarks about a strange Ponyta in the Horseshoe Plains.'],
  encounter: Potw(P.Ponyta, {shiny: true}),
  recyclable: true,
}, {
  docId: L.ENAMORUS,
  quest: L.Enamorus,
  badge: 'enamorus',
  title: 'Herald of Spring',
  gate: CATCH_CHARM_SWSH,
  hint: ['A classy woman notes that there is a fourth incarnate of nature.'],
  encounter: Potw(P.Enamorus, {form: 'incarnate'}),
  recyclable: true,
}, {
  docId: L.LEGENDSPLATE,
  quest: L.LegendsPlate,
  badge: 'legendsplate',
  title: 'The Plate of Legends',
  gate: CATCH_CHARM_SWSH,
  hint: ['Arceus is highly revered, but up to this point its true power has not been unveiled.'],
  item: 'legendplate',
  recyclable: true,
}, {
  docId: L.WOCHIEN,
  quest: L.WoChien,
  badge: 'potw-1001',
  title: 'The Tablets of Ruin',
  gate: CATCH_CHARM_SV,
  hint: ['Your history teacher tells you a story about a greedy king who receives tablets.'],
  encounter: Potw(P.Wo_Chien),
  recyclable: true,
}, {
  docId: L.CHIENPAO,
  quest: L.ChienPao,
  badge: 'potw-1002',
  title: 'The Sword of Ruin',
  gate: CATCH_CHARM_SV,
  hint: ['Your history teacher tells you a story about a greedy king who receives swords.'],
  encounter: Potw(P.Chien_Pao),
  recyclable: true,
}, {
  docId: L.TINGLU,
  quest: L.TingLu,
  badge: 'potw-1003',
  title: 'The Vessel of Ruin',
  gate: CATCH_CHARM_SV,
  hint: ['Your history teacher tells you a story about a greedy king who receives a vessel.'],
  encounter: Potw(P.Ting_Lu),
  recyclable: true,
}, {
  docId: L.CHIYU,
  quest: L.ChiYu,
  badge: 'potw-1004',
  title: 'The Beads of Ruin',
  gate: CATCH_CHARM_SV,
  hint: ['Your history teacher tells you a story about a greedy king who receives beads.'],
  encounter: Potw(P.Chi_Yu),
  recyclable: true,
}, {
  docId: L.KORAIDON,
  quest: L.Koraidon,
  badge: 'potw-1007',
  title: 'The Winged King',
  gate: CATCH_CHARM_SV,
  hint: ['A large scarlet reptile is laying on the beach in a bad state.'],
  encounter: Potw(P.Koraidon),
  recyclable: true,
}, {
  docId: L.MIRAIDON,
  quest: L.Miraridon,
  badge: 'potw-1008',
  title: 'The Iron Serpent',
  gate: CATCH_CHARM_SV,
  hint: ['A large violet reptile is laying on the beach in a weakened state.'],
  encounter: Potw(P.Miraidon),
  recyclable: true,
}, {
  docId: L.WALKINGWAKE,
  quest: L.WalkingWake,
  badge: 'potw-1009',
  title: 'The Aquatic Monster',
  gate: CATCH_CHARM_SV,
  hint: ['You hear about a paranormal Pokémon vaguely resembling Suicune.'],
  encounter: Potw(P.Walking_Wake),
  recyclable: true,
}, {
  docId: L.IRONLEAVES,
  quest: L.IronLeaves,
  badge: 'potw-1010',
  title: 'The Shining Blades',
  gate: CATCH_CHARM_SV,
  hint: ['You hear of a paranormal Pokémon vaguely resembling Virizion.'],
  encounter: Potw(P.Iron_Leaves),
  recyclable: true,
}, {
  docId: L.BLOODMOON,
  quest: L.BloodmoonUrsaluna,
  badge: 'bloodmoon',
  title: 'The Blood Moon Beast',
  gate: CATCH_CHARM_SV,
  hint: ['You arrive in Kitakami, where a dense forest evokes a sense of nostalgia.'],
  encounter: Potw(P.Ursaluna, {form: 'blood_moon'}),
  recyclable: true,
}, {
  docId: L.OGERPON,
  quest: L.Ogerpon,
  badge: 'potw-1017',
  title: 'The Teal Mask',
  gate: CATCH_CHARM_SV,
  hint: ['You arrive in Kitakami, where a festival is ongoing.'],
  encounter: Potw(P.Ogerpon),
  recyclable: true,
}, {
  docId: L.OGERPONWATER,
  quest: L.OgerponWellspring,
  badge: 'potw-1017-water',
  title: 'Embody the Wellspring',
  gate: CATCH_CHARM_SV,
  hint: ['You learn that the ogre once had a mask of blue.'],
  item: 'maskwellspring',
  recyclable: true,
}, {
  docId: L.OGERPONFIRE,
  quest: L.OgerponHearthflame,
  badge: 'potw-1017-fire',
  title: "Embody the Hearth's Flame",
  gate: CATCH_CHARM_SV,
  hint: ['You learn that the ogre once had a mask of red.'],
  item: 'maskhearthflame',
  recyclable: true,
}, {
  docId: L.OGERPONROCK,
  quest: L.OgerponCornerstone,
  badge: 'potw-1017-rock',
  title: 'Embody the Cornerstone',
  gate: CATCH_CHARM_SV,
  hint: ['You learn that the ogre once had a mask of rock.'],
  item: 'maskcornerstone',
  recyclable: true,
}, {
  docId: L.OKIDOGI,
  quest: L.Okidogi,
  badge: 'potw-1014',
  title: 'The Canine Retainer',
  gate: CATCH_CHARM_SV,
  hint: ['The ogre was once attacked by a Pokémon with a Fighting spirit.'],
  encounter: Potw(P.Okidogi),
  recyclable: true,
}, {
  docId: L.MUNKIDORI,
  quest: L.Munkidori,
  badge: 'potw-1015',
  title: 'The Ape Retainer',
  gate: CATCH_CHARM_SV,
  hint: ['The ogre was once attacked by a Pokémon with a Psychic mind.'],
  encounter: Potw(P.Munkidori),
  recyclable: true,
}, {
  docId: L.FEZANDIPITI,
  quest: L.Fezandipiti,
  badge: 'potw-1016',
  title: 'The Pheasant Retainer',
  gate: CATCH_CHARM_SV,
  hint: ['The ogre was once attacked by a Pokémon that came from Fairy tales.'],
  encounter: Potw(P.Fezandipiti),
  recyclable: true,
}]

export const CATCH_QUESTS: PokedexQuest[] = [{
  docId: CATCH_CHARM_RBY,
  badge: 'potw-item-catchingcharm-rby',
  title: 'Kanto Catching Charm',
  count: 60, region: 'kanto', shorthand: 'rby',
  hint: ['Professor Oak will award you this charm when you catch 60 or more Pokémon from Kanto.'],
  sprite: 'catchingcharm-rby',
  modes: ['Private Trading', 'Battle info in Pokédex'],
}, {
  docId: CATCH_CHARM_GSC,
  badge: 'potw-item-catchingcharm-gsc',
  title: 'Johto Catching Charm',
  count: 40, region: 'johto', shorthand: 'gsc',
  hint: ['Professor Elm will award you this charm when you catch 40 or more Pokémon from Johto.'],
  sprite: 'catchingcharm-gsc',
  modes: ['Bazaar', 'Day Care', 'Release info in Pokédex'],
}, {
  docId: CATCH_CHARM_RSE,
  badge: 'potw-item-catchingcharm-rse',
  title: 'Hoenn Catching Charm',
  count: 54, region: 'hoenn', shorthand: 'rse',
  hint: ['Professor Birch will award you this charm when you catch 54 or more Pokémon from Hoenn.'],
  sprite: 'catchingcharm-rse',
  modes: ['Move Deleter', 'Move Tutor', 'Areas in Pokédex'],
}, {
  docId: CATCH_CHARM_DPPT,
  badge: 'potw-item-catchingcharm-dppt',
  title: 'Sinnoh Catching Charm',
  count: 43, region: 'sinnoh', shorthand: 'dppt',
  hint: ['Professor Rowan will award you this charm when you catch 43 or more Pokémon from Sinnoh.'],
  sprite: 'catchingcharm-dppt',
  modes: ['Forms in Pokédex']
}, {
  docId: CATCH_CHARM_BW,
  badge: 'potw-item-catchingcharm-bw',
  title: 'Unova Catching Charm',
  count: 62, region: 'unova', shorthand: 'bw',
  hint: ['Professor Juniper will award you this charm when you catch 62 or more Pokémon from Unova.'],
  sprite: 'catchingcharm-bw',
  modes: ['Movedex', 'Day Care in Pokédex'],
}, {
  docId: CATCH_CHARM_XY,
  badge: 'potw-item-catchingcharm-xy',
  title: 'Kalos Catching Charm',
  count: 29, region: 'kalos', shorthand: 'xy',
  hint: ['Professor Sycamore will award you this charm when you catch 29 or more Pokémon from Kalos.'],
  sprite: 'catchingcharm-xy',
  modes: ['Vivillon icon in Location Picker', 'Wonder Trade'],
}, {
  docId: CATCH_CHARM_SM,
  badge: 'potw-item-catchingcharm-sm',
  title: 'Alola Catching Charm',
  count: 34, region: 'alola', shorthand: 'sm',
  hint: ['Professor Kukui will award you this charm when you catch 34 or more Pokémon from Alola.'],
  sprite: 'catchingcharm-sm',
  modes: ['New Voyages', 'New Bazaar stalls'],
}, {
  docId: CATCH_CHARM_SWSH,
  badge: 'potw-item-catchingcharm-swsh',
  title: 'Galar Catching Charm',
  count: 36, region: 'galar', shorthand: 'swsh',
  hint: ['Professor Magnolia will award you this charm when you catch 36 or more Pokémon from Galar.'],
  sprite: 'catchingcharm-swsh',
  modes: ['New Voyages', 'New Bazaar stalls'],
}, {
  docId: CATCH_CHARM_SV,
  badge: 'potw-item-catchingcharm-sv',
  title: 'Paldea Catching Charm',
  count: 48, region: 'paldea', shorthand: 'sv',
  hint: ['Professor Sada will award you this charm when you catch 48 or more Pokémon from Paldea.'],
  sprite: 'catchingcharm-sv',
  modes: ['New Voyages'],
}]

export const POKEDEX_QUESTS: Quest[] = [...CATCH_QUESTS, {
  docId: SHINY_CHARM,
  badge: 'potw-item-shinycharm',
  title: 'Shiny Charm',
  hint: ['You will receive this charm when you have registered every Pokémon in your Pokédex.']
}]

export const GLOBAL_QUEST_DATE: () => boolean = (() => {
  const legendaryDate = new Date()
  return legendaryDate.getUTCMonth() === 4 && // May (4)
    legendaryDate.getUTCDate() <= 22 // May 22nd
})

export const GLOBAL_QUESTS: GlobalQuest[] = [{
    docId: 'available',
    // docId: 'unavailable',
  dbKey: 'lousyThree',
  badge: 'lousy-three',
  boss: Potw(P.Okidogi, {shiny: false, var: 1}),
  title: 'Mightiest Lousy Three Raids',
   count: 1_000_000,
  hint: ['A global pot of 1,000,000 Poké Balls will unlock a day where you battle in raids against the Lousy Three. Normal shiny rates apply.']
 }]

export const POKEDEX_ACHIEVEMENTS: Medal[] = [{
  badge: 'potw-dex-kanto',
  title: `Oak's Evaluation`,
  condition: ({pokedex}) => {
    return pokedex.kanto
  },
  hints: [{
    description: 'Professor Oak wants you to find all the Pokémon in Kanto',
    count: regions[1].total,
    sprite: 'potw-dex-kanto',
  }],
}, {
  badge: 'potw-dex-johto',
  title: `Elm's Evaluation`,
  condition: ({pokedex}) => {
    return pokedex.johto
  },
  hints: [{
    description: 'Professor Elm wants you to find all the Pokémon in Johto',
    count: regions[2].total,
    sprite: 'potw-dex-johto',
  }],
}, {
  badge: 'potw-dex-hoenn',
  title: `Birch's Evaluation`,
  condition: ({pokedex}) => {
    return pokedex.hoenn
  },
  hints: [{
    description: 'Professor Birch wants you to find all the Pokémon in Hoenn',
    count: regions[3].total,
    sprite: 'potw-dex-hoenn',
  }],
}, {
  badge: 'potw-dex-sinnoh',
  title: `Rowan's Evaluation`,
  condition: ({pokedex}) => {
    return pokedex.sinnoh
  },
  hints: [{
    description: 'Professor Rowan wants you to find all the Pokémon in Sinnoh',
    count: regions[4].total,
    sprite: 'potw-dex-sinnoh',
  }],
}, {
  badge: 'potw-dex-unova',
  title: `Juniper's Evaluation`,
  condition: ({pokedex}) => {
    return pokedex.unova
  },
  hints: [{
    description: 'Professor Juniper wants you to find all the Pokémon in Unova',
    count: regions[5].total,
    sprite: 'potw-dex-unova',
  }],
}, {
  badge: 'potw-dex-kalos',
  title: `Sycamore's Evaluation`,
  condition: ({pokedex}) => {
    return pokedex.kalos
  },
  hints: [{
    description: 'Professor Sycamore wants you to find all the Pokémon in Kalos',
    count: regions[6].total,
    sprite: 'potw-dex-kalos',
  }],
}, {
  badge: 'potw-dex-alola',
  title: `Kukui's Evaluation`,
  condition: ({pokedex}) => {
    return pokedex.alola
  },
  hints: [{
    description: 'Professor Kukui wants you to find all the Pokémon in Alola',
    count: regions[7].total,
    sprite: 'potw-dex-alola',
  }],
}, {
  badge: 'potw-dex-galar',
  title: `Magnolia's Evaluation`,
  condition: ({pokedex}) => {
    return pokedex.galar
  },
  hints: [{
    description: 'Professor Magnolia wants you to find all the Pokémon in Galar',
    count: regions[9].total, // + Unknown
    sprite: 'potw-dex-galar',
  }],
}, {
  badge: 'potw-dex-hisui',
  title: `Laverton's Evaluation`,
  condition: ({pokedex}) => {
    return pokedex.hisui
  },
  hints: [{
    description: 'Professor Laverton wants you to find all the Pokémon in Hisui',
    count: regions[10].total, // + Unknown
    sprite: 'potw-dex-hisui',
  }],
}, {
  badge: 'potw-shiny-kanto',
  title: `Oak's Special Evaluation`,
  condition: L.registerShinyRegion(regions[1]),
  hints: [{
    description: 'Professor Oak wants you to find all the rare Pokémon in Kanto',
    count: regions[1].total,
    sprite: 'potw-shiny-kanto',
  }],
}, {
  badge: 'potw-shiny-johto',
  title: `Elm's Special Evaluation`,
  condition: L.registerShinyRegion(regions[2]),
  hints: [{
    description: 'Professor Elm wants you to find all the rare Pokémon in Johto',
    count: regions[2].total,
    sprite: 'potw-shiny-johto',
  }],
}, {
  badge: 'potw-shiny-hoenn',
  title: `Birch's Special Evaluation`,
  condition: L.registerShinyRegion(regions[3]),
  hints: [{
    description: 'Professor Birch wants you to find all the rare Pokémon in Hoenn',
    count: regions[3].total,
    sprite: 'potw-shiny-hoenn',
  }],
}, {
  badge: 'potw-shiny-sinnoh',
  title: `Rowan's Special Evaluation`,
  condition: L.registerShinyRegion(regions[4]),
  hints: [{
    description: 'Professor Rowan wants you to find all the rare Pokémon in Sinnoh',
    count: regions[4].total,
    sprite: 'potw-shiny-sinnoh',
  }],
}, {
  badge: 'potw-shiny-unova',
  title: `Juniper's Special Evaluation`,
  condition: L.registerShinyRegion(regions[5]),
  hints: [{
    description: 'Professor Juniper wants you to find all the rare Pokémon in Unova',
    count: regions[5].total,
    sprite: 'potw-shiny-unova',
  }],
}, {
  badge: 'potw-shiny-kalos',
  title: `Sycamore's Special Evaluation`,
  condition: L.registerShinyRegion(regions[6]),
  hints: [{
    description: 'Professor Sycamore wants you to find all the rare Pokémon in Kalos',
    count: regions[6].total,
    sprite: 'potw-shiny-kalos',
  }],
}, {
  badge: 'potw-shiny-alola',
  title: `Kukui's Special Evaluation`,
  condition: L.registerShinyRegion(regions[7]),
  hints: [{
    description: 'Professor Kukui wants you to find all the rare Pokémon in Alola',
    count: regions[7].total,
    sprite: 'potw-shiny-alola',
  }],
}]
export const ONEP_ACHIEVEMENTS: Medal[] = [{
  badge: 'potw-201-a',
  title: 'The Mysterious Ways of the Unown',
  condition: ({badgeKeys}) => {
    const unownSet = new Set<string>()
    badgeKeys.forEach(id => {
      const badge = new TeamsBadge(id as BadgeId)
      const isUnown = badge.id === 201 // Unown
      if (isUnown) {
        unownSet.add(badge.form!)
      }
    })
    return unownSet.size
  },
  hints: [{
    description: 'Can you find all of the Unown?',
    count: 28,
    sprite: 'potw-201-a',
  }]
}, {
  badge: 'technical-machine',
  title: 'Technically a master',
  condition: ({items}) => {
    // Get all TMs/TRs
    const yourCount = Object.entries(items)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([_, v]) => v > 0)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([k, _]) => ITEMS[k] !== undefined)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([k, _]) => ITEMS[k].category === 'tms' || ITEMS[k].category === 'trs')
      .length
    return yourCount
  },
  hints: [{
    description: 'Can you collect all the techincal machines and technical records?',
    count: Object.values(ITEMS)
      .filter(v => v.category === 'tms')
      .length,
    sprite: 'technical-record',
  }, {
    description: 'Can you collect all the techincal machines and technical records?',
    count: Object.values(ITEMS)
      .filter(v => v.category === 'tms' || v.category === 'trs')
      .length,
    sprite: 'technical-machine',
  }]
}, {
  badge: 'berry-farmer',
  title: 'Berry Farmer',
  condition: (r) => r.berryGrown,
  hints: [{
    description: 'Seedling - Harvest 10 berries.',
    count: 10,
    sprite: 'oran',
  }, {
    description: 'Sapling - Harvest 100 berries.',
    count: 100,
    sprite: 'sitrus',
  }, {
    description: 'Maturity - Harvest 200 berries.',
    count: 200,
    sprite: 'figy',
  }, {
    description: 'Harvest 500 berries.',
    count: 500,
    sprite: 'enigma',
  }, {
    description: 'Harvest 1000 berries.',
    count: 1000,
    sprite: 'tamato',
  }, {
    description: 'Harvest 2000 berries.',
    count: 2000,
    sprite: 'blackapricorn',
  }, {
    description: 'Harvest 5000 berries.',
    count: 5000,
    sprite: 'mint',
  }]
}, {
  badge: 'pokemon-breeder',
  title: 'Pokémon Breeder',
  condition: (r) => r.eggsLaid,
  hints: [{
    description: 'Hatch 10 eggs.',
    count: 10,
    sprite: 'egg2'
  }, {
    description: 'Hatch 1000 eggs.',
    count: 1000,
    sprite: 'egg4',
  }]
}, {
  badge: 'battle-champ',
  title: 'Battle Champ',
  condition: (r) => r.battleStadiumRecord[1],
  hints: [{
    description: 'Win 151 battles.',
    count: 151,
    sprite: 'champion1', // Lance
  }, {
    description: 'Win 250 battles.',
    count: 250,
    sprite: 'champion2', // Lance
  }, {
    description: 'Win 500 battles.',
    count: 500,
    sprite: 'champion3', // Steven
  }, {
    description: 'Win 1000 battles.',
    count: 1000,
    sprite: 'champion4', // Cynthia
  }, {
    description: 'Win 2500 battles.',
    count: 2500,
    sprite: 'champion5', // Alder
  },/* {
    description: 'Win 5000 battles.',
    count: 5000,
    sprite: 'champion6', // Diantha
  }, {
    description: 'Win 10,000 battles.',
    count: 10000,
    sprite: 'champion7', // Kukui
  }, {
    description: 'Win 25,000 battles.',
    count: 25000,
    sprite: 'champion8', // Leon
  }*/]
}, {
  badge: 'raid-champ',
  title: 'Raid Champ',
  condition: (r) => r.raidRecord[1],
  hints: [{
    description: 'Win 151 raids.',
    count: 151,
    sprite: 'raid1', // Blue
  }, {
    description: 'Win 250 raids.',
    count: 250,
    sprite: 'raid2', // Silver
  }, {
    description: 'Win 500 raids.',
    count: 500,
    sprite: 'raid3', // Wally
  }, {
    description: 'Win 1000 raids.',
    count: 1000,
    sprite: 'raid4', // Barry
  }, {
    description: 'Win 2500 raids.',
    count: 2500,
    sprite: 'raid5', // Bianca
  }, {
    description: 'Win 5000 raids.',
    count: 5000,
    sprite: 'raid6', // Shauna
  }, {
    description: 'Win 10,000 raids.',
    count: 10000,
    sprite: 'raid7', // Hau
  }, {
    description: 'Win 25,000 raids.',
    count: 250,
    sprite: 'raid8', // Hop
  },]
}, {
  badge: 'move-tutor',
  title: 'Move Expert',
  condition: (r) => r.moveTutors,
  hints: [{
    description: 'Move tutor 50 Pokémon.',
    count: 50,
    sprite: 'movetutor1', // Gentleman
  }, {
    description: 'Move tutor 250 Pokémon.',
    count: 250,
    sprite: 'movetutor2', // Gentleman
  }, {
    description: 'Move tutor 500 Pokémon.',
    count: 500,
    sprite: 'movetutor3', // Gentleman
  }, {
    description: 'Move tutor 1000 Pokémon.',
    count: 1000,
    sprite: 'movetutor4', // Gentleman
  }, {
    description: 'Move tutor 2500 Pokémon.',
    count: 2500,
    sprite: 'movetutor5', // Gentleman
  }, {
    description: 'Move tutor 5000 Pokémon.',
    count: 5000,
    sprite: 'movetutor6', // Gentleman
  }, {
    description: 'Move tutor 10,000 Pokémon.',
    count: 10000,
    sprite: 'movetutor7', // Gentleman
  }, {
    description: 'Move tutor 25,000 Pokémon.',
    count: 25000,
    sprite: 'movetutor8', // Gentleman
  }]
}, {
  badge: 'social-butterfly',
  title: 'Social Butterfly',
  condition: (r) => r.totalTrades,
  hints: [{
    description: 'Trade 100 times.',
    count: 100,
    sprite: 'linkingcord',
  }]
}, {
  badge: 'battle-good-try',
  title: 'Good Try...',
  condition: (r) => r.battleStadiumRecord[2], // Losses
  hints: [{
    description: 'Lose 100 times.',
    count: 100,
    sprite: 'potw-129',
  }, {
    description: 'Lose 250 times.',
    count: 250,
    sprite: 'potw-129-shiny',
  }, ]
}, {
  badge: 'friend-safari',
  title: 'Best Friend Safari',
  condition: (r) => (r.friendSafari ?? '').split('').length,
  hints: [{
    description: 'Make 10 safari friends.',
    count: 10,
    sprite: 'friendsafaripass',
  }, {
    description: 'Make 36 safari friends.',
    count: 36,
    sprite: 'holocaster',
  }, {
    description: 'Make every safari friend.',
    count: 64,
    sprite: 'honorofkalos',
  }]
}, {
  badge: 'crafty-player',
  title: 'Crafty Player',
  condition: (r) => r.itemsCrafted,
  hints: [{
    description: 'Craft 10 items.',
    count: 10,
    sprite: 'potw-item-featherball',
  }, {
    description: 'Craft 100 items.',
    count: 100,
    sprite: 'potw-item-wingball',
  }, {
    description: 'Craft 250 items.',
    count: 250,
    sprite: 'potw-item-jetball',
  }, {
    description: 'Craft 1000 items.',
    count: 1000,
    sprite: 'potw-item-leadenball',
  }, {
    description: 'Craft 2500 items.',
    count: 2500,
    sprite: 'potw-item-gigatonball',
  }, {
    description: 'Craft 10,000 items.',
    count: 10_000,
    sprite: 'potw-item-originball',
  }]
}, {
  badge: 'items-evolutions',
  title: 'Evolutionary My Dear Watson',
  condition: (r) => r.evolutions,
  hints: [{
    description: 'Evolve 72 Pokémon',
    count: 72, // Kanto evos
    sprite: 'potw-item-expcandyxs',
  }, {
    description: 'Evolve 115 Pokémon',
    count: 115, // + Johto evos
    sprite: 'potw-item-expcandys',
  }, {
    description: 'Evolve 175 Pokémon',
    count: 175, // + Hoenn evos
    sprite: 'potw-item-expcandym',
  }, {
    description: 'Evolve 231 Pokémon',
    count: 231, // + Sinnoh evos
    sprite: 'potw-item-expcandyl',
  }, {
    description: 'Evolve 305 Pokémon',
    count: 305, // + Unova evos
    sprite: 'potw-item-expcandyxl',
  }, {
    description: 'Evolve 340 Pokémon',
    count: 340, // + Kalos evos
    sprite: 'potw-item-rarecandy',
  }]
}, {
  badge: 'items-forms',
  title: 'Form & Function',
  condition: (r) => r.forms,
  hints: [{
    description: 'Change the form for 15 Pokémon',
    count: 15,
    sprite: 'potw-172-spiky'
  }, {
    description: 'Change the form for 30 Pokémon',
    count: 30,
    sprite: 'potw-351-rainy'
  }, {
    description: 'Change the form for 60 Pokémon',
    count: 60,
    sprite: 'potw-423-westsea',
  }, {
    description: 'Change the form for 120 Pokémon',
    count: 120,
    sprite: 'potw-550-redstripe',
  }, {
    description: 'Change the form for 240 Pokémon',
    count: 240,
    sprite: 'potw-676-dandy',
  }]
}, {
  badge: 'items-restorations',
  title: 'Restore from Backup',
  condition: (r) => r.restorations,
  hints: [{
    description: 'Restore 15 Pokémon',
    count: 15,
    sprite: 'potw-fossil-oldamber'
  }, {
    description: 'Restore 30 Pokémon',
    count: 30,
    sprite: 'potw-fossil-claw'
  }, {
    description: 'Restore 60 Pokémon',
    count: 60,
    sprite: 'potw-fossil-skull',
  }, {
    description: 'Restore 120 Pokémon',
    count: 120,
    sprite: 'potw-fossil-plume',
  }, {
    description: 'Restore 240 Pokémon',
    count: 240,
    sprite: 'potw-fossil-sail',
  }, {
    description: 'Restore 480 Pokémon',
    count: 480,
    sprite: 'potw-fossil-bird',
  }]
}, {
  badge: 'teachers-pet',
  title: "Teacher's Pet",
  condition: (r) => r.researchCompleted,
  hints: [{
    description: 'Complete 100 research tasks.',
    count: 100,
    sprite: 'oak',
  }, {
    description: 'Complete 250 research tasks.',
    count: 250,
    sprite: 'oak2',
  }, {
    description: 'Complete 500 research tasks.',
    count: 500,
    sprite: 'birch3',
  }, {
    description: 'Complete 1000 research tasks.',
    count: 1000,
    sprite: 'rowan4',
  }, {
    description: 'Complete 2500 research tasks.',
    count: 2500,
    sprite: 'juniper5',
  }, {
    description: 'Complete 5000 research tasks.',
    count: 5000,
    sprite: 'sycamore6',
  }, {
    description: 'Complete 10,000 research tasks.',
    count: 10_000,
    sprite: 'kukui7',
  }, {
    description: 'Complete 25,000 research tasks.',
    count: 25_000,
    sprite: 'magnolia8',
  }]
}, {
  badge: 'pokemon-journeys',
  title: "Pokémon Journeys",
  condition: (r) => r.voyagesCompleted,
  hints: [{
    // 3 voyages/day * 5 days/week
    description: 'Complete 30 Voyages.',
    count: 30,
    sprite: 'badge1-kanto',
  }, {
    description: 'Complete 60 Voyages.',
    count: 60,
    sprite: 'badge1-johto',
  }, {
    description: 'Complete 120 Voyages.',
    count: 120,
    sprite: 'badge1-hoenn',
  }, {
    description: 'Complete 180 Voyages.',
    count: 180,
    sprite: 'badge1-sinnoh',
  }, {
    description: 'Complete 270 Voyages.',
    count: 270,
    sprite: 'badge1-unova',
  }, {
    description: 'Complete 360 Voyages.',
    count: 360,
    sprite: 'badge1-unova2',
  }, {
    description: 'Complete 480 Voyages.',
    count: 480,
    sprite: 'badge1-kalos',
  }, {
    description: 'Complete 600 Voyages.',
    count: 600,
    sprite: 'badge1-galar',
  }, {
    description: 'Complete 780 Voyages.',
    count: 780,
    sprite: 'badge1-paldea',
  }]
}, {
  badge: 'foodie',
  title: 'Foodie',
  condition: L.countItem([
    'pewtercrunchies',
    'ragecandybar',
    'lavacookie',
    'oldgateau',
    'casteliacone',
    'shaloursable',
    'lumiosegalette',
    'jubilifemuffin',
    'bigmalasada',
  ]),
  hints: [{
    description: 'Collect all the food.',
    count: 9,
    sprite: 'leftovers',
  }]
}, {
  badge: 'adventurenaut',
  title: 'Adventurenaut',
  condition: L.countItem([
    'tm-Rock Smash',
    'tm-Surf',
    'tm-Whirlpool',
    'tm-Rock Climb',
    'tm-Fire Blast',
    'tm-Dig',
    'tm-Fly',
    'tm-Waterfall',
    'tm-Strength',
    'tm-Cut',
    'tm-Dive',
    'tr-Defog',
    'tr-Flash',
  ]),
  hints: [{
    description: 'Collect a variety of adventuring moves.',
    count: 13,
    sprite: 'surgebadge',
  }]
}, {
  badge: 'legendsarceus',
  title: 'Legends: Arceus',
  condition: L.countItem([
    ...PLATES
  ]),
  hints: [{
    description: 'Have you obtained all the typed plates of Arceus?.',
    count: 17,
    sprite: 'legendsarceus',
  }, {
    description: 'Have you obtained every single plate of Arceus?.',
    count: 18,
    sprite: 'legendsarceus2',
  }]
}, {
  badge: 'mega-evolver',
  title: 'Mega Evolution Master',
  condition: L.countItem([
    ...MEGA_STONES
  ]),
  hints: [{
    description: 'Collect all of the Mega Stones.',
    count: MEGA_STONES.length,
    sprite: 'potw-item-diancieite',
  }]
}, {
  badge: 'zmovekahuna',
  title: 'Z-Move Champion',
  condition: ({items}) => {
    // Get all TMs/TRs
    const yourCount = Object.entries(items)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([_, v]) => v > 0)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([k, _]) => ITEMS[k] !== undefined)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([k, _]) => ITEMS[k].category === 'zcrystal')
      .length
    return yourCount
  },
  hints: [{
    description: 'Collect all the primary Z-Crystals',
    count: 18,
    sprite: 'potw-item-znormalium',
  }, {
    description: 'Collect all the Z-Crystals',
    count: 35,
    sprite: 'potw-item-ztapunium',
  }]
}, {
  badge: 'catch-female',
  title: 'Feminine Collector',
  condition: L.requirePotwCount([
    [P.Ralts, {gender: 'female'}],
    [P.Kirlia, {gender: 'female'}],
    [P.Gardevoir, {gender: 'female'}],
    [P.Snorunt, {gender: 'female'}],
    [P.Starly, {gender: 'female'}],
    [P.Staravia, {gender: 'female'}],
    [P.Staraptor, {gender: 'female'}],
    [P.Bidoof, {gender: 'female'}],
    [P.Bibarel, {gender: 'female'}],
    [P.Kricketot, {gender: 'female'}],
    [P.Kricketune, {gender: 'female'}],
    [P.Shinx, {gender: 'female'}],
    [P.Luxio, {gender: 'female'}],
    [P.Burmy, {gender: 'female', form: 'trash'}],
    [P.Burmy, {gender: 'female', form: 'plant'}],
    [P.Burmy, {gender: 'female', form: 'sandy'}],
    [P.Wormadam, {gender: 'female', form: 'trash'}],
    [P.Wormadam, {gender: 'female', form: 'plant'}],
    [P.Wormadam, {gender: 'female', form: 'sandy'}],
    [P.Combee, {gender: 'female'}],
    [P.Vespiquen, {gender: 'female'}],
    [P.Pachirisu, {gender: 'female'}],
    // Potw(P.Ambipom, {gender: 'female'}),
    [P.Gible, {gender: 'female'}],
    [P.Gabite, {gender: 'female'}],
    [P.Garchomp, {gender: 'female'}],
    [P.Hippopotas, {gender: 'female'}],
    [P.Hippowdon, {gender: 'female'}],
    [P.Croagunk, {gender: 'female'}],
    [P.Toxicroak, {gender: 'female'}],
    [P.Finneon, {gender: 'female'}],
    [P.Lumineon, {gender: 'female'}],
    [P.Snover, {gender: 'female'}],
    [P.Abomasnow, {gender: 'female'}],
    [P.Froslass, {gender: 'female'}],
    [P.Pidove, {gender: 'female'}],
    [P.Tranquill, {gender: 'female'}],
    [P.Unfezant, {gender: 'female'}],
    [P.Frillish, {gender: 'female'}],
    [P.Jellicent, {gender: 'female'}],
    [P.Meowstic, {gender: 'female'}],
    [P.Pyroar, {gender: 'female'}],
    [P.Salazzle, {}],
    // [P.Indeedee, {gender: 'female'}],
  ]),
  hints: [{
    description: 'Catch all female Pokémon',
    count: 42, // 43
    sprite: 'female',
  }]
}, {
  badge: 'catch-male',
  title: 'Masculine Collector',
  condition: L.requirePotwCount([
    [P.Ralts, {gender: 'male'}],
    [P.Kirlia, {gender: 'male'}],
    [P.Gardevoir, {gender: 'male'}],
    [P.Snorunt, {gender: 'male'}],
    [P.Glalie, {gender: 'male'}],
    [P.Starly, {gender: 'male'}],
    [P.Staravia, {gender: 'male'}],
    [P.Staraptor, {gender: 'male'}],
    [P.Bidoof, {gender: 'male'}],
    [P.Bibarel, {gender: 'male'}],
    [P.Kricketot, {gender: 'male'}],
    [P.Kricketune, {gender: 'male'}],
    [P.Shinx, {gender: 'male'}],
    [P.Luxio, {gender: 'male'}],
    [P.Burmy, {gender: 'male', form: 'trash'}],
    [P.Burmy, {gender: 'male', form: 'plant'}],
    [P.Burmy, {gender: 'male', form: 'sandy'}],
    [P.Mothim, {gender: 'male'}],
    [P.Combee, {gender: 'male'}],
    [P.Pachirisu, {gender: 'male'}],
    // Potw(P.Ambipom, {gender: 'female'}),
    [P.Gible, {gender: 'male'}],
    [P.Gabite, {gender: 'male'}],
    [P.Garchomp, {gender: 'male'}],
    [P.Hippopotas, {gender: 'male'}],
    [P.Hippowdon, {gender: 'male'}],
    [P.Croagunk, {gender: 'male'}],
    [P.Toxicroak, {gender: 'male'}],
    [P.Finneon, {gender: 'male'}],
    [P.Lumineon, {gender: 'male'}],
    [P.Snover, {gender: 'male'}],
    [P.Abomasnow, {gender: 'male'}],
    [P.Gallade, {gender: 'male'}],
    [P.Pidove, {gender: 'male'}],
    [P.Tranquill, {gender: 'male'}],
    [P.Unfezant, {gender: 'male'}],
    [P.Frillish, {gender: 'male'}],
    [P.Jellicent, {gender: 'male'}],
    [P.Meowstic, {gender: 'male'}],
    [P.Pyroar, {gender: 'male'}],
    // [P.Indeedee, {gender: 'male'}],
  ]),
  hints: [{
    description: 'Catch all male Pokémon',
    count: 39, // 40
    sprite: 'male',
  }]
}, {
  badge: 'catch-legends',
  title: 'Legendary Pokémon Collector',
  condition: L.requirePotwCount(
    Object.entries(datastore)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .filter(([k, p]) => p.rarity === 'LEGENDARY')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .filter(([k, p]) => k.split('-').length === 2) // Base form
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(([k, _]) => [k, {}] as [BadgeId, Partial<Personality>])
  ),
  hints: [{
    description: 'Catch every legendary Pokémon',
    count: Object.entries(datastore)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .filter(([k, p]) => p.rarity === 'LEGENDARY')
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .filter(([k, p]) => k.split('-').length === 2) // Base form
        .length,
    sprite: 'potw-150-shiny',
  }]
}, {
  badge: 'catch-myth',
  title: 'Ancient Mew Collector',
  condition: L.requirePotwCount(
    Object.entries(datastore)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([k, p]) => p.rarity === 'MYTHICAL')
      // FIXME: This is not the right way to get base form
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([k, p]) => k.split('-').length === 2) // Base form
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(([k, _]) => [k, {}] as [BadgeId, Partial<Personality>])
  ),
  hints: [{
    description: 'Catch every mythical Pokémon',
    count: Object.entries(datastore)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .filter(([k, p]) => p.rarity === 'MYTHICAL')
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .filter(([k, p]) => k.split('-').length === 2) // Base form
        .length,
    sprite: 'potw-151-shiny',
  }]
}, {
  badge: 'catch-deoxys',
  title: 'Meteorite Masher',
  condition: L.requirePotwCount([
    [P.Deoxys, {}],
    [P.Deoxys, {form: 'speed'}],
    [P.Deoxys, {form: 'defense'}],
    [P.Deoxys, {form: 'attack'}],
  ]),
  hints: [{
    description: 'Catch every form of Deoxys',
    count: 4,
    sprite: 'potw-386-shiny',
  }]
}, {
  badge: 'catch-rotom',
  title: 'Sears Catalog',
  condition: L.requirePotwCount([
    [P.Rotom, {}],
    [P.Rotom, {form: 'frost'}],
    [P.Rotom, {form: 'fan'}],
    [P.Rotom, {form: 'wash'}],
    [P.Rotom, {form: 'heat'}],
    [P.Rotom, {form: 'mow'}],
  ]),
  hints: [{
    description: 'Catch every form of Rotom',
    count: 6,
    sprite: 'potw-479-shiny',
  }]
}, {
  badge: 'catch-deering',
  title: 'Seasonal Achievement',
  condition: L.requirePotwCount([
    [P.Deerling, {form: 'spring'}],
    [P.Deerling, {form: 'summer'}],
    [P.Deerling, {form: 'autumn'}],
    [P.Deerling, {form: 'winter'}],
    [P.Sawsbuck, {form: 'spring'}],
    [P.Sawsbuck, {form: 'summer'}],
    [P.Sawsbuck, {form: 'autumn'}],
    [P.Sawsbuck, {form: 'winter'}],
  ]),
  hints: [{
    description: 'Catch every form of Deerling and Sawsbuck',
    count: 8,
    sprite: 'potw-586-shiny',
  }]
}, {
  badge: 'vivillon-fancy',
  title: 'Butterfly Garden',
  condition: L.requirePotwCount(
    get('potw-666')!.syncableForms!.map(form => [P.Vivillon, {form}])
  ),
  hints: [{
    description: 'Catch all Vivillon forms',
    count: 20,
    sprite: 'vivillon-fancy',
  }]
}, {
  badge: 'pika-pika',
  title: 'The Electric Mouse Pokémon',
  condition: L.requirePotwCount(
    get('potw-025')!.syncableForms!.map(form => [P.Pikachu, {form}])
  ),
  hints: [{
    description: 'Catch every form of Pikachu',
    count: get('potw-025')!.syncableForms!.length,
    sprite: 'potw-025-kantonian',
  }]
}, {
  badge: 'sparkle-star',
  title: 'Shiny Living Dex',
  condition: (r) => {
    const valid = [...myPokemon(r.pokemon)]
      .filter(([key]) => new Badge(key).personality.shiny)
      .map(([, count]) => count)
    if (valid.length) return valid.reduce((pre, curr) => pre + curr)
    return 0
  },
  hints: [{
    description: 'Catch 151 shiny Pokémon',
    count: 151,
    sprite: 'potw-149-shiny',
  }, {
    description: 'Catch 251 shiny Pokémon',
    count: 251,
    sprite: 'potw-248-shiny',
  }, {
    description: 'Catch 386 shiny Pokémon',
    count: 386,
    sprite: 'potw-376-shiny'
  }, {
    description: 'Catch 493 shiny Pokémon',
    count: 493,
    sprite: 'potw-445-shiny',
  }, {
    description: 'Catch 649 shiny Pokémon',
    count: 649,
    sprite: 'potw-635-shiny',
  }, {
    description: 'Catch 721 shiny Pokémon',
    count: 721,
    sprite: 'potw-706-shiny'
  }, {
    description: 'Catch 807 shiny Pokémon',
    count: 807,
    sprite: 'potw-784-shiny',
  }]
}, {
  badge: 'tiny-star',
  title: 'Honey, I shrunk the Pokémon',
  condition: (r) => {
    const valid = [...myPokemon(r.pokemon)]
      .filter(([key]) => new Badge(key).size === 'xxs')
      .map(([, count]) => count)
    if (valid.length) return valid.reduce((pre, curr) => pre + curr)
    return 0
  },
  hints: [{
    description: 'Catch 151 extra-extra-small Pokémon',
    count: 151,
    sprite: 'voltorb-xxs',
  }]
}, {
  badge: 'massive-star',
  title: 'Honey, I grew the Pokémon',
  condition: (r) => {
    const valid = [...myPokemon(r.pokemon)]
      .filter(([key]) => new Badge(key).size === 'xxl')
      .map(([, count]) => count)
    if (valid.length) return valid.reduce((pre, curr) => pre + curr)
    return 0
  },
  hints: [{
    description: 'Catch 151 extra-extra-large Pokémon',
    count: 151,
    sprite: 'electrode-xxl',
  }]
}, {
  badge: 'totem-alpha-titan',
  title: 'Pokémon Giants',
  condition: (r) => {
    const valid = [...myPokemon(r.pokemon)] 
      .filter(([key]) => ['totem', 'alpha', 'noble', 'titan'].includes(new Badge(key).personality.form ?? ''))
      .map(([, count]) => count)
    if (valid.length) return valid.reduce((pre, curr) => pre + curr)
    return 0
  },
  hints: [{
    // https://www.serebii.net/ultrasunultramoon/totemstickers.shtml
    description: 'Catch 11 Giant Pokémon',
    count: 11,
    sprite: 'potw-735-totem',
  }, {
    // Plus Alphas
    description: 'Catch 30 Giant Pokémon', // TODO +19 in Obsidian Fieldlands
    count: 25,
    sprite: 'garchomp-alpha',
  }, {
    // Plus Nobles
    description: 'Catch 35 Giant Pokémon',
    count: 30,
    sprite: 'kleavor-noble',
  }, {
    // Plus Titans
    description: 'Catch 40 Giant Pokémon',
    count: 35,
    sprite: 'klawf-titan',
  }]
}, {
  badge: 'forbes',
  title: 'Player Income',
  condition: (r) => calculateNetWorth(r as unknown as Users.Doc),
  hints: [{
    description: 'Collect 1,000 PokéBalls of wealth',
    count: 1_000,
    sprite: 'potw-item-stardust',
  }, {
    description: 'Collect 5,000 PokéBalls of wealth',
    count: 5_000,
    sprite: 'potw-item-starpiece',
  }, {
    description: 'Collect 10,000 PokéBalls of wealth',
    count: 10_000,
    sprite: 'potw-item-cometshard',
  }, {
    description: 'Collect 25,000 PokéBalls of wealth',
    count: 25_000,
    sprite: 'potw-item-nugget',
  }, {
    description: 'Collect 50,000 PokéBalls of wealth',
    count: 50_000,
    sprite: 'potw-item-relicstatue',
  }, {
    description: 'Collect 100,000 PokéBalls of wealth',
    count: 100_000,
    sprite: 'potw-item-reliccrown',
  }, ]
}]
export const CATCH_TYPE_ACHIEVEMENTS: Medal[] = [{
  badge: 'type-fighting',
  title: 'Black Belt',
  condition: L.countType('Fighting'),
  hints: [{
    description: 'Catch 100 Fighting-type Pokémon.',
    count: 100,
    sprite: 'type-fighting',
  }, {
    description: 'Catch 250 Fighting-type Pokémon.',
    count: 250,
    sprite: 'type-fighting2',
  }, {
    description: 'Catch 500 Fighting-type Pokémon.',
    count: 500,
    sprite: 'type-fighting3',
  }, {
    description: 'Catch 1000 Fighting-type Pokémon.',
    count: 1000,
    sprite: 'type-fighting4',
  }, {
    description: 'Catch 2500 Fighting-type Pokémon.',
    count: 2500,
    sprite: 'type-fighting5',
  }, {
    description: 'Catch 5000 Fighting-type Pokémon.',
    count: 5000,
    sprite: 'type-fighting6',
  }, {
    description: 'Catch 10,000 Fighting-type Pokémon.',
    count: 10_000,
    sprite: 'type-fighting7',
  }, {
    description: 'Catch 25000 Fighting-type Pokémon.',
    count: 25_000,
    sprite: 'type-fighting8',
  }]
}, {
  badge: 'type-steel',
  title: 'Scientist', /* Scientist */
  condition: L.countType('Steel'),
  hints: [{
    description: 'Catch 100 Steel-type Pokémon.',
    count: 100,
    sprite: 'type-steel',
  }, {
    description: 'Catch 250 Steel-type Pokémon.',
    count: 250,
    sprite: 'type-steel2',
  }, {
    description: 'Catch 500 Steel-type Pokémon.',
    count: 500,
    sprite: 'type-steel3',
  }, {
    description: 'Catch 1000 Steel-type Pokémon.',
    count: 1000,
    sprite: 'type-steel4',
  }, {
    description: 'Catch 2500 Steel-type Pokémon.',
    count: 2500,
    sprite: 'type-steel5',
  }, {
    description: 'Catch 5000 Steel-type Pokémon.',
    count: 5000,
    sprite: 'type-steel6',
  }, {
    description: 'Catch 10,000 Steel-type Pokémon.',
    count: 10_000,
    sprite: 'type-steel7',
  }] // There is no Scientist in Gen 8
}, {
  badge: 'type-rock',
  title: 'Hiker',
  condition: L.countType('Rock'),
  hints: [{
    description: 'Catch 100 Rock-type Pokémon.',
    count: 100,
    sprite: 'type-rock',
  }, {
    description: 'Catch 250 Rock-type Pokémon.',
    count: 250,
    sprite: 'type-rock2',
  }, {
    description: 'Catch 500 Rock-type Pokémon.',
    count: 500,
    sprite: 'type-rock3',
  }, {
    description: 'Catch 1000 Rock-type Pokémon.',
    count: 1000,
    sprite: 'type-rock4',
  }, {
    description: 'Catch 2500 Rock-type Pokémon.',
    count: 2500,
    sprite: 'type-rock5',
  }, {
    description: 'Catch 5000 Rock-type Pokémon.',
    count: 5000,
    sprite: 'type-rock6',
  }, {
    description: 'Catch 10,000 Rock-type Pokémon.',
    count: 10_000,
    sprite: 'type-rock7',
  }, {
    description: 'Catch 25,000 Rock-type Pokémon.',
    count: 25_000,
    sprite: 'type-rock8',
  }]
}, {
  badge: 'type-grass',
  title: 'Gardener', /* Jr Trainer sprite */
  condition: L.countType('Grass'),
  hints: [{
    description: 'Catch 100 Grass-type Pokémon.',
    count: 100,
    sprite: 'type-grass',
  }, {
    description: 'Catch 250 Grass-type Pokémon.',
    count: 250,
    sprite: 'type-grass2', // Camper
  }, {
    description: 'Catch 500 Grass-type Pokémon.',
    count: 500,
    sprite: 'type-grass3', // Camper
  }, {
    description: 'Catch 1000 Grass-type Pokémon.',
    count: 1000,
    sprite: 'type-grass4', // Camper
  }, { // No 5, 7, 8 Camper
    description: 'Catch 5000 Grass-type Pokémon.',
    count: 5000,
    sprite: 'type-grass6', // Camper
  }]
}, {
  badge: 'type-water',
  title: 'Swimmer',
  condition: L.countType('Water'),
  hints: [{
    description: 'Catch 100 Water-type Pokémon.',
    count: 100,
    sprite: 'type-water',
  }, {
    description: 'Catch 250 Water-type Pokémon.',
    count: 250,
    sprite: 'type-water2',
  }, {
    description: 'Catch 500 Water-type Pokémon.',
    count: 500,
    sprite: 'type-water3',
  }, {
    description: 'Catch 1000 Water-type Pokémon.',
    count: 1000,
    sprite: 'type-water4',
  }, {
    description: 'Catch 2500 Water-type Pokémon.',
    count: 2500,
    sprite: 'type-water5',
  }, {
    description: 'Catch 5000 Water-type Pokémon.',
    count: 5000,
    sprite: 'type-water6',
  }, {
    description: 'Catch 10,000 Water-type Pokémon.',
    count: 10_000,
    sprite: 'type-water7',
  }, {
    description: 'Catch 25,000 Water-type Pokémon.',
    count: 25_000,
    sprite: 'type-water8',
  }]
}, {
  badge: 'type-fire',
  title: 'Fire Breather', /* OKAY It's burglar b/c gen 1 */
  condition: L.countType('Fire'),
  hints: [{
    description: 'Catch 151 Fire-type Pokémon.',
    count: 151, /* More as a way to track the Victini quest */
    sprite: 'type-fire',
  }, {
    description: 'Catch 250 Fire-type Pokémon.',
    count: 250,
    sprite: 'type-fire2',
  }, {
    description: 'Catch 500 Fire-type Pokémon.',
    count: 500,
    sprite: 'type-fire3', // Burglar
  }, {
    description: 'Catch 1000 Fire-type Pokémon.',
    count: 1000,
    sprite: 'type-fire4',
  }], // There are no more Burglar/Firebreather class after Gen 4
}, {
  badge: 'type-psychic',
  title: 'Psychic Master',
  condition: L.countType('Psychic'),
  hints: [{
    description: 'Catch 151 Psychic-type Pokémon.',
    count: 151, /* More as a way to track the Victini quest */
    sprite: 'type-psychic',
  }, {
    description: 'Catch 250 Psychic-type Pokémon.',
    count: 250,
    sprite: 'type-psychic2',
  }, {
    description: 'Catch 500 Psychic-type Pokémon.',
    count: 500,
    sprite: 'type-psychic3',
  }, {
    description: 'Catch 1000 Psychic-type Pokémon.',
    count: 1000,
    sprite: 'type-psychic4',
  }, {
    description: 'Catch 2500 Psychic-type Pokémon.',
    count: 2500,
    sprite: 'type-psychic5',
  }, {
    description: 'Catch 5000 Psychic-type Pokémon.',
    count: 5000,
    sprite: 'type-psychic6',
  }], // No more psychic after Gen 6
}, {
  badge: 'type-flying',
  title: 'Bird Keeper',
  condition: L.countType('Flying'),
  hints: [{
    description: 'Catch 100 Flying-type Pokémon.',
    count: 100,
    sprite: 'type-flying',
  }, {
    description: 'Catch 250 Flying-type Pokémon.',
    count: 250,
    sprite: 'type-flying2',
  }, {
    description: 'Catch 500 Flying-type Pokémon.',
    count: 500,
    sprite: 'type-flying3',
  }, {
    description: 'Catch 1000 Flying-type Pokémon.',
    count: 1000,
    sprite: 'type-flying4',
  }, { // No Bird Keeper in Gen 5
    description: 'Catch 5000 Flying-type Pokémon.',
    count: 5000,
    sprite: 'type-flying6',
  }],
}, {
  badge: 'type-bug',
  title: 'Bug Catcher',
  condition: L.countType('Bug'),
  hints: [{
    description: 'Catch 100 Bug-type Pokémon.',
    count: 100,
    sprite: 'type-bug',
  }, {
    description: 'Catch 250 Bug-type Pokémon.',
    count: 250,
    sprite: 'type-bug2',
  }, {
    description: 'Catch 500 Bug-type Pokémon.',
    count: 500,
    sprite: 'type-bug3',
  }, {
    description: 'Catch 1000 Bug-type Pokémon.',
    count: 1000,
    sprite: 'type-bug4',
  }, { // No Bug Catcher in Gen 5
    description: 'Catch 5000 Bug-type Pokémon.',
    count: 5000,
    sprite: 'type-bug6',
  }],
}, {
  badge: 'type-electric',
  title: 'Engineer',
  condition: L.countType('Electric'),
  hints: [{
    description: 'Catch 100 Electric-type Pokémon.',
    count: 100,
    sprite: 'type-electric',
  }, {
    description: 'Catch 250 Electric-type Pokémon.',
    count: 250,
    sprite: 'type-electric2', // Guitarist
  }, {
    description: 'Catch 500 Electric-type Pokémon.',
    count: 500,
    sprite: 'type-electric3', // Engineer
  }, {
    description: 'Catch 1000 Electric-type Pokémon.',
    count: 1000,
    sprite: 'type-electric4', // Guitarist
  }, {
    description: 'Catch 2500 Electric-type Pokémon.',
    count: 2500,
    sprite: 'type-electric5',
  }, {
    description: 'Catch 5000 Electric-type Pokémon.',
    count: 5000,
    sprite: 'type-electric6',
  }],// None after gen 6
}, {
  badge: 'type-ghost',
  title: 'Channeler',
  condition: L.countType('Ghost'),
  hints: [{
    description: 'Catch 108 Ghost-type Pokémon.',
    count: 108,
    sprite: 'type-ghost',
  }, {
    description: 'Catch 250 Ghost-type Pokémon.',
    count: 250,
    sprite: 'type-ghost2',
  }, {
    description: 'Catch 500 Ghost-type Pokémon.',
    count: 500,
    sprite: 'type-ghost3',
  }, {
    description: 'Catch 1000 Ghost-type Pokémon.',
    count: 1000,
    sprite: 'type-ghost4',
  }], // None after gen 4
}, {
  badge: 'type-dragon',
  title: 'Cool Trainer',
  condition: L.countType('Dragon'),
  hints: [{
    description: 'Catch 100 Dragon-type Pokémon.',
    count: 100,
    sprite: 'type-dragon',
  }, {
    description: 'Catch 250 Dragon-type Pokémon.',
    count: 250,
    sprite: 'type-dragon2',
  }, {
    description: 'Catch 500 Dragon-type Pokémon.',
    count: 500,
    sprite: 'type-dragon3',
  }, {
    description: 'Catch 1000 Dragon-type Pokémon.',
    count: 1000,
    sprite: 'type-dragon4',
  }, {
    description: 'Catch 2500 Dragon-type Pokémon.',
    count: 2500,
    sprite: 'type-dragon5',
  }, {
    description: 'Catch 5000 Dragon-type Pokémon.',
    count: 5000,
    sprite: 'type-dragon6',
  }, {
    description: 'Catch 10,000 Dragon-type Pokémon.',
    count: 10_000,
    sprite: 'type-dragon7',
  }], // No Gen 8
}, {
  badge: 'type-fairy',
  title: 'Lass',
  condition: L.countType('Fairy'),
  hints: [{
    description: 'Catch 100 Fairy-type Pokémon.',
    count: 100,
    sprite: 'type-fairy',
  }, {
    description: 'Catch 250 Fairy-type Pokémon.',
    count: 250,
    sprite: 'type-fairy2',
  }, {
    description: 'Catch 500 Fairy-type Pokémon.',
    count: 500,
    sprite: 'type-fairy3',
  }, {
    description: 'Catch 1000 Fairy-type Pokémon.',
    count: 1000,
    sprite: 'type-fairy4',
  }, {
    description: 'Catch 2500 Fairy-type Pokémon.',
    count: 2500,
    sprite: 'type-fairy5',
  }, {
    description: 'Catch 5000 Fairy-type Pokémon.',
    count: 5000,
    sprite: 'type-fairy6',
  }, {
    description: 'Catch 10,000 Fairy-type Pokémon.',
    count: 10_000,
    sprite: 'type-fairy7',
  }, {
    description: 'Catch 25,000 Fairy-type Pokémon.',
    count: 25_000,
    sprite: 'type-fairy8',
  }],
}, {
  badge: 'type-dark',
  title: 'Rocker',
  condition: L.countType('Dark'),
  hints: [{
    description: 'Catch 100 Dark-type Pokémon.',
    count: 100,
    sprite: 'type-dark',
  }, {
    description: 'Catch 250 Dark-type Pokémon.',
    count: 250,
    sprite: 'type-dark2', //Juggler
  }, {
    description: 'Catch 500 Dark-type Pokémon.',
    count: 500,
    sprite: 'type-dark3', // Rocker
  }, {
    description: 'Catch 1000 Dark-type Pokémon.',
    count: 1000,
    sprite: 'type-dark4', //Juggler
  }], // No more after gen 4
}, {
  badge: 'type-ice',
  title: 'Winter Sportsperson',
  condition: L.countType('Ice'),
  hints: [{
    description: 'Catch 100 Ice-type Pokémon.',
    count: 100,
    sprite: 'type-ice', // Ice Fisherman
  }, {
    description: 'Catch 250 Ice-type Pokémon.',
    count: 250,
    sprite: 'type-ice2', // Skier
  }, {
    description: 'Catch 500 Ice-type Pokémon.',
    count: 500,
    sprite: 'type-ice3', // Fisher
  }, {
    description: 'Catch 1000 Ice-type Pokémon.',
    count: 1000,
    sprite: 'type-ice4', // Boarder
  }], // None after gen 4
}, {
  badge: 'type-normal',
  title: 'Poké Maniac',
  condition: L.countType('Normal'),
  hints: [{
    description: 'Catch 100 Normal-type Pokémon.',
    count: 100,
    sprite: 'type-normal',
  }, {
    description: 'Catch 250 Normal-type Pokémon.',
    count: 250,
    sprite: 'type-normal2',
  }, {
    description: 'Catch 500 Normal-type Pokémon.',
    count: 500,
    sprite: 'type-normal3',
  }, {
    description: 'Catch 1000 Normal-type Pokémon.',
    count: 1000,
    sprite: 'type-normal4',
  }, { // none in gen5
    description: 'Catch 5000 Normal-type Pokémon.',
    count: 5000,
    sprite: 'type-normal6',
  }], // None after gen 6
}, {
  badge: 'type-ground',
  title: 'Tamer',
  condition: L.countType('Ground'),
  hints: [{
    description: 'Catch 100 Ground-type Pokémon.',
    count: 100,
    sprite: 'type-ground',
  }, {
    description: 'Catch 250 Ground-type Pokémon.',
    count: 250,
    sprite: 'type-ground2', // Teacher
  }, {
    description: 'Catch 500 Ground-type Pokémon.',
    count: 500,
    sprite: 'type-ground3', // Tamer
  }, {
    description: 'Catch 1000 Ground-type Pokémon.',
    count: 1000,
    sprite: 'type-ground4', // Teacher
  }, { // None for Gen 5, 6
    description: 'Catch 10,000 Ground-type Pokémon.',
    count: 10_000,
    sprite: 'type-ground7', // Teacher
  }],
}, {
  badge: 'type-poison',
  title: 'Biker',
  condition: L.countType('Poison'),
  hints: [{
    description: 'Catch 100 Poison-type Pokémon.',
    count: 100,
    sprite: 'type-poison',
  }, {
    description: 'Catch 250 Poison-type Pokémon.',
    count: 250,
    sprite: 'type-poison2',
  }, {
    description: 'Catch 500 Poison-type Pokémon.',
    count: 500,
    sprite: 'type-poison3',
  }, {
    description: 'Catch 1000 Poison-type Pokémon.',
    count: 1000,
    sprite: 'type-poison4',
  }, {
    description: 'Catch 2500 Poison-type Pokémon.',
    count: 2500,
    sprite: 'type-poison5',
  }], // No more after gen 5
}, {
  badge: 'catch-champ',
  title: 'Catching Champion',
  condition: ({pokemon}) => [...myPokemon(pokemon)].map(([k, v]) => v).reduce((p, c) => p + c),
  hints: [{
    description: 'Catch 50 Pokémon.',
    count: 50,
    sprite: 'potw-item-pokeball',
  }, {
    description: 'Catch 200 Pokémon.',
    count: 200,
    sprite: 'potw-item-greatball',
  }, {
    description: 'Catch 500 Pokémon.',
    count: 500,
    sprite: 'potw-item-ultraball',
  }, {
    description: 'Catch 1000 Pokémon.',
    count: 1000,
    sprite: 'potw-item-safariball',
  }, {
    description: 'Catch 2500 Pokémon.',
    count: 2500,
    sprite: 'potw-item-lureball',
  }, {
    description: 'Catch 5000 Pokémon.',
    count: 5000,
    sprite: 'potw-item-premierball',
  }, {
    description: 'Catch 10,000 Pokémon.',
    count: 10000,
    sprite: 'potw-item-cherishball',
  }, {
    description: 'Catch 25,000 Pokémon.',
    count: 25000,
    sprite: 'potw-item-masterball',
  }]
}]
export const COMMUNITY_ACHIEVEMENTS: Medal[] = [{
  badge: 'potw-152',
  title: 'Chonkorita',
  condition: ({pokemon}) => {
    const map = [...myPokemon(pokemon)]
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([key, _]) => new Badge(key).id === I.Chikorita)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(([_, value]) => value)
    if (map.length) {
      return map.reduce((prev, curr) => prev + curr)
    }
    return 0
  },
  hints: [{
    description: 'Collect 255 Chikorita',
    count: 255,
    sprite: 'potw-152',
  }, {
    description: 'Collect 1023 Chikorita',
    count: 1023,
    sprite: 'potw-152-shiny',
  }]
}, {
  badge: 'cowboy-caterpie',
  title: 'Cowboy Caterpie',
  condition: L.countType('Bug'),
  hints: [{
    description: 'Collect 151 Bug-type Pokémon',
    count: 151,
    sprite: 'potw-010-sandy'
  }]
}, {
  badge: 'potw-157  ',
  title: 'Space Typhlosion',
  condition: ({pokemon}) => {
    const map = [...myPokemon(pokemon)]
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .filter(([key, _]) => new Badge(key).id === I.Typhlosion)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(([_, value]) => value)
    if (map.length) {
      return map.reduce((prev, curr) => prev + curr)
    }
    return 0
  },
  hints: [{
    description: 'Catch 10 Typhlosion',
    count: 10,
    sprite: 'potw-157-space',
  }],
}, {
  badge: 'mothim-female',
  title: 'Female Mothim',
  condition: ({pokemon}) => {
    const map = [...myPokemon(pokemon)]
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .filter(([key, _]) => [I.Burmy, I.Wormadam, I.Mothim].includes(new Badge(key).id))
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(([_, value]) => value)
    if (map.length) {
      return map.reduce((prev, curr) => prev + curr)
    }
    return 0
  },
  hints: [{
    description: 'Collect 10 Burmy, Wormadam, or Mothim',
    count: 10,
    sprite: 'potw-414-male',
  }, {
    description: 'Collect 25 Burmy, Wormadam, or Mothim',
    count: 25,
    sprite: 'potw-414-female',
  }]
}, {
  badge: 'space-kyurem',
  title: 'Negative Space Kyurem',
  condition: ({pokemon}) => {
    const map = [...myPokemon(pokemon)]
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .filter(([key, _]) => new Badge(key).id === I.Kyurem)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(([_, value]) => value)
    if (map.length) {
      return map.reduce((prev, curr) => prev + curr)
    }
    return 0
  },
  hints: [{
    description: 'Catch Kyurem',
    count: 1,
    sprite: 'negative-kyurem',
  }]
}, {
  badge: 'founders-porygon',
  title: 'Founding Porygon',
  condition: ({pokemon}) => {
    const map = [...myPokemon(pokemon)]
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .filter(([key, _]) => new Badge(key).id === I.Porygon)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(([_, value]) => value)
    if (map.length) {
      return map.reduce((prev, curr) => prev + curr)
    }
    return 0
  },
  hints: [{
    description: 'Collect 25 Porygon',
    count: 25,
    sprite: 'potw-137-brin',
  }]
}]
// [key]: Species
export const DITTOS = {
  'eumLWmbJz5bTJtP3g9d1': 'Bulbasaur',
  'fkRVdArfT9Ar6LSBf9UO': 'Charmander',
  'jPtqR5h7bhZCQCWS0qdk': 'Squirtle',
  'ZgfdGOEsnr5Xa7DIjFBB': 'Caterpie',
  'i6JxFNB0vflDn6EVCzCK': 'Weedle',
  '9pMpzklpko0uWo9LxXG6': 'Chikorita',
  'tv035IHt8ZXhiHbrcL9p': 'Cyndaquil',
  'E37CUdJXNmD0EjHmv5BS': 'Totodile',
  'Wp3NrkugXF5oDtAA2x4R': 'Treecko',
  'O6RiCJARLgrlcKFiIF9I': 'Torchic',
  'NKWk2SSzfDR1GBuw5Gte': 'Mudkip',
}