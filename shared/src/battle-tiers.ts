import { ItemId } from './items-list'
import { PokemonDoc } from './pokemon/types'
import * as Prizes from './prizes'
export type Tier =
  'Traditional' |
  'Red Cup' |
  'Crystal Cup' |
  'Emerald Cup' |
  'Platinum Cup' |
  'Plasma Cup' |
  'Kalos Cup' |
  'Tiny Cup' |
  'Sky Cup' |
  'Alolan Cup' |
  'Ultra Cup' |
  'GigantaCup' |
  'Crown Cup' |
  'Arceus Cup' |
  'Terastallize Cup' |
  // 'Treasure Cup' |
  'Beginners Cup'
export interface Rules {
  /**
   * Number of Pokémon that each side must select.
   */
  partySize: number
  /**
   * Number of Pokémon on the field at one time. Used for AOE calculations.
   */
  fieldSize: number
  /**
   * Whether Mega Evolutions are allowed in this format. Requires Mega Ring.
   */
  mega: boolean
  /**
   * Whether Z-Moves can be used in this format. Requires Z-Ring.
   */
  zmoves: boolean
  /**
   * Whether Dynamax can be used in this format. Requires Dynamax Band.
   */
  dynamax?: boolean
  /**
   * Whether terastallization can be used in this format. Requires Tera Orb.
   */
  tera?: boolean
  /**
   * Max number of allowed wins, or 0 for no limit.
   */
  maxWins: number
}
/**
 * Represents a style of battle in the Battle Stadium.
 */
export interface BattleTier {
  /**
   * User-friendly name of the tier.
   */
  label: string
  /**
   * Sprite image URL to represent this tier. Currently not implemented.
   */
  icon: string
  /**
   * Series of rules for this cup.
   */
  rules: Rules,
  /**
   * Optional prizes that can only be won from this tier.
   */
  keyItemPrizes?: ItemId[]
  /**
   * Prizes that are awarded for this tier at varying win levels.
   * This is from a refactoring of functions/src/battle/prizes.ts.
   * Required Wins: -1, 6, 24, winTier(X)
   */
  prizes: PrizeList
}
type PrizeList = {
  wins: number
  items: ItemId[]
}[]
const TraditionalPrizeList: PrizeList = [{
  wins: -1,
  items: ['pokeball', 'tinymushroom']
}, {
  wins: 6,
  items: ['greatball', ...Prizes.TYPE_ITEMS_A],
}, {
  wins: 24,
  items: [...Prizes.BALLS_A, ...Prizes.TYPE_ITEMS],
},{
  wins: Prizes.winTier(1),
  items: [...Prizes.BALLS_C, ...Prizes.TYPE_ITEMS],
}, {
  wins:Prizes.winTier(2),
  items: [...Prizes.BALLS_C, ...Prizes.TYPE_ITEMS, ...Prizes.HOLD_ALL]
}, {
  wins:Prizes.winTier(3),
  items: [...Prizes.BALLS_C, ...Prizes.TYPE_ITEMS, ...Prizes.HOLD_ALL,
    ...Prizes.BERRY_ALL]
}, {
  wins:Prizes.winTier(4),
  items: [...Prizes.BALLS_C, ...Prizes.TYPE_ITEMS, ...Prizes.HOLD_ALL,
    ...Prizes.BERRY_ALL, ...Prizes.TREASURE, ...Prizes.TREASURE_RARE]
}, {
  wins:Prizes.winTier(5), // >312 wins
  items: [...Prizes.BALLS_C, ...Prizes.TYPE_ITEMS, ...Prizes.HOLD_ALL,
    ...Prizes.BERRY_ALL, ...Prizes.TREASURE, ...Prizes.TREASURE_RARE,
    ...Prizes.TMS_ALL, ...Prizes.TRS_ALL]
}, {
  wins:Prizes.winTier(6), // >432 wins
  items: [...Prizes.BALLS_C, ...Prizes.TYPE_ITEMS, ...Prizes.HOLD_ALL,
    ...Prizes.BERRY_ALL, ...Prizes.TREASURE, ...Prizes.TREASURE_RARE,
    ...Prizes.TMS_ALL, ...Prizes.TRS_ALL,
    ...Prizes.EVO_STONES, ...Prizes.DPP_EVOS]
}, {
  wins:Prizes.winTier(7), // >576 wins
  items: [...Prizes.BALLS_C, ...Prizes.TYPE_ITEMS, ...Prizes.HOLD_ALL,
    ...Prizes.BERRY_ALL, ...Prizes.TREASURE, ...Prizes.TREASURE_RARE,
    ...Prizes.TMS_ALL, ...Prizes.TRS_ALL,
    ...Prizes.EVO_STONES, ...Prizes.DPP_EVOS,
    ...Prizes.CRAFTING_MATERIALS, ...Prizes.APRICORNS]
}, {
  wins:Prizes.winTier(8), // >744 wins
  items: [...Prizes.BALLS_C, ...Prizes.TYPE_ITEMS, ...Prizes.HOLD_ALL,
    ...Prizes.BERRY_ALL, ...Prizes.TREASURE, ...Prizes.TREASURE_RARE,
    ...Prizes.TMS_ALL, ...Prizes.TRS_ALL,
    ...Prizes.EVO_STONES, ...Prizes.DPP_EVOS,
    ...Prizes.CRAFTING_MATERIALS, ...Prizes.APRICORNS,
    ...Prizes.MEGA_STONES, ...Prizes.FOSSILS]
}, {
  wins:Prizes.winTier(9), // >936 wins
  items: [...Prizes.BALLS_C, ...Prizes.TYPE_ITEMS, ...Prizes.HOLD_ALL,
    ...Prizes.BERRY_ALL, ...Prizes.TREASURE, ...Prizes.TREASURE_RARE,
    ...Prizes.TMS_ALL, ...Prizes.TRS_ALL,
    ...Prizes.EVO_STONES, ...Prizes.DPP_EVOS,
    ...Prizes.CRAFTING_MATERIALS, ...Prizes.APRICORNS,
    ...Prizes.MEGA_STONES, ...Prizes.FOSSILS,
    ...Prizes.INCENSE, ...Prizes.RAIDS_3, ...Prizes.TREASURE_RELIC,]
}]
const RedCupPrizeList: PrizeList = [{
  wins: -1,
  items: ['pokeball', 'tinymushroom', 'stardust'],
}, {
  wins: 6,
  items: ['greatball', 'tinymushroom', 'stardust', 'nugget'],
}, {
  wins: 24,
  items: ['ultraball', 'bigmushroom', 'starpiece', 'nugget'],
}, {
  wins: Prizes.winTier(1),
  items: ['ultraball', ...Prizes.TREASURE],
}, {
  wins: Prizes.winTier(2),
  items: [...Prizes.TREASURE, ...Prizes.TMS_RB],
}, {
  wins: Prizes.winTier(3),
  items: [...Prizes.TREASURE, ...Prizes.TMS_RB, ...Prizes.TRS_RB],
}, {
  wins: Prizes.winTier(4),
  items: [...Prizes.TREASURE, ...Prizes.TMS_RB, ...Prizes.TRS_RB,
    ...Prizes.TREASURE_RARE],
}]
const CrystalCupPrizeList: PrizeList = [{
  wins: -1,
  items: ['pokeball', 'tinymushroom', 'stardust'],
}, {
  wins: 6,
  items: [...Prizes.TYPE_ITEMS],
}, {
  wins: 24,
  items: [...Prizes.TYPE_ITEMS, ...Prizes.TREASURE],
}, {
  wins: Prizes.winTier(1),
  items: [...Prizes.APRICORNS, ...Prizes.TYPE_ITEMS, ...Prizes.TREASURE],
}, {
  wins: Prizes.winTier(2),
  items: [...Prizes.APRICORNS, ...Prizes.TYPE_ITEMS, ...Prizes.TREASURE, ...Prizes.TMS_GS],
}, {
  wins: Prizes.winTier(3),
  items: [...Prizes.APRICORNS, ...Prizes.TYPE_ITEMS, ...Prizes.TREASURE, ...Prizes.TMS_GS,
    ...Prizes.TRS_GS, ...Prizes.TYPE_GSC_BERRY, ...Prizes.TYPE_GSC_BERRY_B],
}, {
  wins: Prizes.winTier(4),
  items: [...Prizes.APRICORNS, ...Prizes.TYPE_ITEMS, ...Prizes.TREASURE, ...Prizes.TMS_GS,
    ...Prizes.TRS_GS,  ...Prizes.TYPE_GSC_BERRY, ...Prizes.TYPE_GSC_BERRY_B, ...Prizes.TYPE_GSC_HOLD,
    ...Prizes.TREASURE_RARE],
}, {
  wins: Prizes.winTier(5),
  items: [...Prizes.APRICORNS, ...Prizes.TYPE_ITEMS, ...Prizes.TREASURE, ...Prizes.TMS_GS,
    ...Prizes.TRS_GS,  ...Prizes.BERRY_ALL, ...Prizes.TYPE_GSC_HOLD,
    ...Prizes.TREASURE_RARE],
}]
const EmeraldCupPrizeList: PrizeList = [{
  wins: -1,
  items: ['pokeball', 'heartscale'],
}, {
  wins: 6,
  items: ['greatball', 'heartscale', 'tinymushroom', 'stardust', 'nugget'],
}, {
  wins: 24,
  items: ['ultraball', 'heartscale', 'bigmushroom', 'starpiece', 'nugget'],
}, {
  wins: Prizes.winTier(1),
  items: ['ultraball', ...Prizes.TREASURE],
}, {
  wins: Prizes.winTier(2),
  items: [...Prizes.TREASURE, ...Prizes.TMS_RSE],
}, {
  wins: Prizes.winTier(3),
  items: [...Prizes.TREASURE, ...Prizes.TMS_RSE, ...Prizes.TRS_RSE],
}, {
  wins: Prizes.winTier(4),
  items: [...Prizes.TREASURE, ...Prizes.TMS_RSE, ...Prizes.TRS_RSE,
    ...Prizes.TYPE_RSE_BERRY],
}, {
  wins: Prizes.winTier(5),
  items: [...Prizes.TREASURE, ...Prizes.TREASURE_RARE,
    ...Prizes.TMS_RSE, ...Prizes.TRS_RSE,
    ...Prizes.TYPE_RSE_BERRY, ...Prizes.TYPE_TREASURE_BERRY],
}]
const PlatinumCupPrizeList: PrizeList = [{
  wins: -1,
  items: ['pokeball', 'tinymushroom', 'stardust'],
}, {
  wins: 6,
  items: ['greatball', 'tinymushroom', 'stardust', 'nugget'],
}, {
  wins: 24,
  items: ['ultraball', 'bigmushroom', 'starpiece', 'nugget'],
}, {
  wins: Prizes.winTier(1),
  items: ['ultraball', ...Prizes.TREASURE],
}, {
  wins: Prizes.winTier(2),
  items: [...Prizes.TREASURE, ...Prizes.TMS_DPPt],
}, {
  wins: Prizes.winTier(3),
  items: [...Prizes.TREASURE, ...Prizes.TMS_DPPt, ...Prizes.TRS_DPPt,
    'lustrousorb', 'adamantorb'],
}, {
  wins: Prizes.winTier(4),
  items: [...Prizes.TREASURE,
    ...Prizes.TMS_DPPt, ...Prizes.TRS_DPPt,
    ...Prizes.TYPE_DPPT_HOLD, ...Prizes.TYPE_ELEMENTAL_BERRY,
    'lustrousorb', 'adamantorb'],
}, {
  wins: Prizes.winTier(5),
  items: [...Prizes.TREASURE, ...Prizes.TREASURE_RARE,
    ...Prizes.TMS_DPPt, ...Prizes.TRS_DPPt,
    ...Prizes.TYPE_DPPT_HOLD, ...Prizes.DPP_EVOS,
    ...Prizes.TYPE_PINCH_BERRY, ...Prizes.TYPE_ELEMENTAL_BERRY,
    'lustrousorb', 'adamantorb'],
}]
const PlasmaCupPrizeList: PrizeList = [{
  wins: -1,
  items: ['pokeball', 'stardust', 'prettywing'],
}, {
  wins: 6,
  items: ['greatball', 'tinymushroom', 'stardust', 'nugget', 'prettywing'],
}, {
  wins: 24,
  items: ['ultraball', 'bigmushroom', 'starpiece', 'nugget', 'prettywing'],
}, {
  wins: Prizes.winTier(1),
  items: ['ultraball', ...Prizes.TREASURE],
}, {
  wins: Prizes.winTier(2),
  items: [...Prizes.TREASURE, ...Prizes.TMS_BW],
}, {
  wins: Prizes.winTier(3),
  items: [...Prizes.TREASURE,
    ...Prizes.TMS_BW, ...Prizes.TRS_BW,
    ...Prizes.TYPE_BW_HOLD],
}, {
  wins: Prizes.winTier(4),
  items: [...Prizes.TREASURE,...Prizes.TREASURE_RELIC,
    ...Prizes.TMS_BW, ...Prizes.TRS_BW,
    ...Prizes.TYPE_BW_HOLD, ...Prizes.TYPE_GEMS],
}]
const KalosCupPrizeList: PrizeList = [{
  wins: -1,
  items: ['pokeball', 'stardust', 'prettywing'],
}, {
  wins: 6,
  items: ['greatball', 'tinymushroom', 'stardust', 'nugget', 'prettywing'],
}, {
  wins: 24,
  items: ['ultraball', 'bigmushroom', 'starpiece', 'nugget', 'prettywing'],
}, {
  wins: Prizes.winTier(1),
  items: ['ultraball', ...Prizes.TREASURE],
}, {
  wins: Prizes.winTier(2),
  items: [...Prizes.TREASURE, ...Prizes.TMS_XY],
}, {
  wins: Prizes.winTier(3),
  items: [...Prizes.TREASURE,
    ...Prizes.TMS_XY, ...Prizes.TRS_XY, 'gengarite'],
}, {
  wins: Prizes.winTier(4),
  items: [...Prizes.TREASURE, ...Prizes.TREASURE_RARE,
    ...Prizes.TMS_XY, ...Prizes.TRS_XY,
    ...Prizes.TYPE_XY_ITEMS, 'gengarite'],
}, {
  wins: Prizes.winTier(5),
  items: [...Prizes.TREASURE, ...Prizes.TREASURE_RARE,
    ...Prizes.TMS_XY, ...Prizes.TRS_XY,
    ...Prizes.TYPE_XY_ITEMS, ...Prizes.MEGA_STONES],
}]
const UltraCupPrizeList: PrizeList = [{
  wins: -1,
  items: ['pokeball', 'stardust', 'prettywing'],
}, {
  wins: 6,
  items: ['greatball', 'tinymushroom', 'stardust', 'nugget', 'prettywing'],
}, {
  wins: 24,
  items: ['ultraball', 'bigmushroom', 'starpiece', 'nugget', 'prettywing'],
}, {
  wins: Prizes.winTier(1),
  items: ['ultraball', ...Prizes.TREASURE, 'strangesouvenir'],
}, {
  wins: Prizes.winTier(2),
  items: [...Prizes.TREASURE, 'strangesouvenir', ...Prizes.TMS_SM],
}, {
  wins: Prizes.winTier(3),
  items: [...Prizes.TREASURE, 'strangesouvenir',
    ...Prizes.TMS_SM, ...Prizes.TRS_SM],
}, {
  wins: Prizes.winTier(4),
  items: [...Prizes.TREASURE, ...Prizes.TREASURE_RARE,
    ...Prizes.TMS_SM, ...Prizes.TRS_SM,
    ...Prizes.TYPE_SM_ITEMS,
    'zgrassium', 'zfirium', 'zwaterium',
  ],
}, {
  wins: Prizes.winTier(5),
  items: [...Prizes.TREASURE, ...Prizes.TREASURE_RARE,
    ...Prizes.TMS_SM, ...Prizes.TRS_SM,
    ...Prizes.TYPE_SM_ITEMS, ...Prizes.Z_CRYSTALS, ...Prizes.MEMORIES],
}]
const GalarCupPrizeList: PrizeList = [{
  wins: -1,
  items: ['pokeball', ...Prizes.GALAR_INGREDIENTS],
}, {
  wins: 6,
  items: ['greatball', ...Prizes.GALAR_INGREDIENTS],
}, {
  wins: 24,
  items: ['ultraball', ...Prizes.GALAR_INGREDIENTS],
}, {
  wins: Prizes.winTier(1),
  items: ['ultraball', ...Prizes.TREASURE, ...Prizes.GALAR_INGREDIENTS],
}, {
  wins: Prizes.winTier(2),
  items: [...Prizes.TREASURE, ...Prizes.GALAR_INGREDIENTS, ...Prizes.TMS_SWSH],
}, {
  wins: Prizes.winTier(3),
  items: [...Prizes.TREASURE, ...Prizes.GALAR_INGREDIENTS,
    ...Prizes.TMS_SWSH, ...Prizes.TRS_SWSH],
}, {
  wins: Prizes.winTier(4),
  items: [...Prizes.TREASURE, ...Prizes.TREASURE_RARE, ...Prizes.GALAR_INGREDIENTS,
    ...Prizes.TMS_SWSH, ...Prizes.TRS_SWSH,
  ],
}, {
  wins: Prizes.winTier(5),
  items: [...Prizes.TREASURE, ...Prizes.TREASURE_RARE, ...Prizes.GALAR_INGREDIENTS,
    ...Prizes.TMS_SWSH, ...Prizes.TRS_SWSH,
    ...Prizes.TYPE_SWSH_ITEMS, 'birdfossil', 'dinofossil', 'drakefossil', 'fishfossil'],
}]
const GalarDlcCupPrizeList: PrizeList = [{
  wins: -1,
  items: ['pokeball', ...Prizes.GALAR_INGREDIENTS],
}, {
  wins: 6,
  items: ['greatball', ...Prizes.GALAR_INGREDIENTS],
}, {
  wins: 24,
  items: ['ultraball', ...Prizes.GALAR_INGREDIENTS],
}, {
  wins: Prizes.winTier(1),
  items: ['ultraball', ...Prizes.TREASURE, ...Prizes.GALAR_INGREDIENTS],
}, {
  wins: Prizes.winTier(2),
  items: [...Prizes.TREASURE, ...Prizes.GALAR_INGREDIENTS, ...Prizes.TMS_SWSH],
}, {
  wins: Prizes.winTier(3),
  items: [...Prizes.TREASURE, ...Prizes.GALAR_INGREDIENTS,
    ...Prizes.TMS_SWSH, ...Prizes.TRS_SWSH],
}, {
  wins: Prizes.winTier(4),
  items: [...Prizes.TREASURE, ...Prizes.TREASURE_RARE, ...Prizes.GALAR_INGREDIENTS,
    ...Prizes.TMS_SWSH, ...Prizes.TRS_SWSH,
  ],
}, {
  wins: Prizes.winTier(5),
  items: [...Prizes.TREASURE, ...Prizes.TREASURE_RARE, ...Prizes.GALAR_INGREDIENTS,
    ...Prizes.TMS_SWSH, ...Prizes.TRS_SWSH,
    ...Prizes.TYPE_SWSH_ITEMS, 'birdfossil', 'dinofossil', 'drakefossil', 'fishfossil',
    'armorite', 'dynite', 'dynamaxcandy', 'galaricatwig', ...Prizes.MINTS,
  ],
}]
const ArceusCupPrizeList: PrizeList = [{
  wins: -1,
  items: ['pokeball', 'stardust'],
}, {
  wins: 6,
  items: ['greatball', 'nugget', 'stardust'],
}, {
  wins: 24,
  items: ['ultraball', 'starpiece', 'nugget'],
}, {
  wins: Prizes.winTier(1),
  items: ['ultraball', ...Prizes.TREASURE, ...Prizes.TYPE_RSE_BERRY],
}, {
  wins: Prizes.winTier(2),
  items: [...Prizes.TREASURE, ...Prizes.TYPE_RSE_BERRY],
}, {
  wins: Prizes.winTier(3),
  items: [...Prizes.TREASURE,
    ...Prizes.TMS_DPPt, ...Prizes.TRS_DPPt,
    ...Prizes.TYPE_RSE_BERRY, ...Prizes.CRAFTING_MATERIALS],
}, {
  wins: Prizes.winTier(4),
  items: [...Prizes.TREASURE, ...Prizes.TREASURE_RARE,
    ...Prizes.TMS_DPPt, ...Prizes.TRS_DPPt,
    ...Prizes.TYPE_RSE_BERRY, ...Prizes.CRAFTING_MATERIALS],
}, {
  wins: Prizes.winTier(5),
  items: [...Prizes.TREASURE, ...Prizes.TREASURE_RARE,
    ...Prizes.TMS_DPPt, ...Prizes.TRS_DPPt,
    ...Prizes.TYPE_RSE_BERRY, ...Prizes.CRAFTING_MATERIALS,
    ...Prizes.EVO_STONES, ...Prizes.DPP_EVOS],
}, {
  wins: Prizes.winTier(6),
  items: [...Prizes.TREASURE, ...Prizes.TREASURE_RARE,
    ...Prizes.TMS_DPPt, ...Prizes.TRS_DPPt,
    ...Prizes.TYPE_RSE_BERRY, ...Prizes.CRAFTING_MATERIALS,
    ...Prizes.EVO_STONES, ...Prizes.DPP_EVOS,
    ...Prizes.PLATES, ...Prizes.TMS_PLA],
}]
const TeraCupPrizeList: PrizeList = [{
  wins: -1,
  items: ['pokeball', ...Prizes.SV_INGREDIENTS],
}, {
  wins: 6,
  items: ['greatball', ...Prizes.SV_INGREDIENTS],
}, {
  wins: 24,
  items: ['ultraball', ...Prizes.SV_INGREDIENTS],
}, {
  wins: Prizes.winTier(1),
  items: ['ultraball', ...Prizes.TREASURE, ...Prizes.SV_INGREDIENTS],
}, {
  wins: Prizes.winTier(2),
  items: [...Prizes.TREASURE, ...Prizes.SV_INGREDIENTS, ...Prizes.TMS_SV],
}, {
  wins: Prizes.winTier(3),
  items: [...Prizes.TREASURE, ...Prizes.SV_INGREDIENTS,
    ...Prizes.TMS_SV],
}, {
  wins: Prizes.winTier(4),
  items: [...Prizes.TREASURE, ...Prizes.TREASURE_RARE, ...Prizes.SV_INGREDIENTS,
    ...Prizes.TMS_SV, 'teragrass', 'terafire', 'terawater',
  ],
}, {
  wins: Prizes.winTier(5),
  items: [...Prizes.TREASURE, ...Prizes.TREASURE_RARE, ...Prizes.SV_INGREDIENTS,
    ...Prizes.TMS_SV, ...Prizes.SV_ITEMS, ...Prizes.TERA_SHARDS],
}, {
  wins: Prizes.winTier(5),
  items: [...Prizes.TREASURE, ...Prizes.TREASURE_RARE, ...Prizes.SV_INGREDIENTS,
    ...Prizes.TMS_SV, ...Prizes.SV_ITEMS, ...Prizes.TERA_SHARDS,
    ...Prizes.SV_HMS],
}]
const TeraDlcCupPrizeList: PrizeList = [{
  wins: -1,
  items: ['pokeball', ...Prizes.SV_INGREDIENTS],
}, {
  wins: 6,
  items: ['greatball', ...Prizes.SV_INGREDIENTS],
}, {
  wins: 24,
  items: ['ultraball', ...Prizes.SV_INGREDIENTS],
}, {
  wins: Prizes.winTier(1),
  items: ['ultraball', ...Prizes.TREASURE, ...Prizes.SV_INGREDIENTS],
}, {
  wins: Prizes.winTier(2),
  items: [...Prizes.TREASURE, ...Prizes.SV_INGREDIENTS, ...Prizes.TMS_SV],
}, {
  wins: Prizes.winTier(3),
  items: [...Prizes.TREASURE, ...Prizes.SV_INGREDIENTS,
    ...Prizes.TMS_SV],
}, {
  wins: Prizes.winTier(4),
  items: [...Prizes.TREASURE, ...Prizes.TREASURE_RARE, ...Prizes.SV_INGREDIENTS,
    ...Prizes.TMS_SV, 'teragrass', 'terafire', 'terawater',
  ],
}, {
  wins: Prizes.winTier(5),
  items: [...Prizes.TREASURE, ...Prizes.TREASURE_RARE, ...Prizes.SV_INGREDIENTS,
    ...Prizes.TMS_SV, ...Prizes.SV_ITEMS, ...Prizes.TERA_SHARDS],
}, {
  wins: Prizes.winTier(5),
  items: [...Prizes.TREASURE, ...Prizes.TREASURE_RARE, ...Prizes.SV_INGREDIENTS,
    ...Prizes.TMS_SV, ...Prizes.SV_ITEMS, ...Prizes.TERA_SHARDS,
    ...Prizes.SV_HMS, ...Prizes.SV_DLC_ITEMS, 'terastellar'],
}]

const TinyCupPrizeList: PrizeList = [{
  wins: -1,
  items: ['pokeball', 'tinymushroom'],
}, {
  wins: 6,
  items: ['greatball', 'tinymushroom', 'stardust', 'nugget'],
}, {
  wins: 24,
  items: ['ultraball', 'bigmushroom', 'starpiece', 'nugget'],
}, {
  wins: Prizes.winTier(1),
  items: ['ultraball', ...Prizes.TREASURE],
}, {
  wins: Prizes.winTier(2),
  items: [...Prizes.TREASURE, ...Prizes.TRS_RB],
}, {
  wins: Prizes.winTier(3),
  items: [...Prizes.TREASURE, ...Prizes.INCENSE,
      ...Prizes.TRS_RB, ...Prizes.TRS_GS, ...Prizes.TRS_RSE],
}, {
  wins: Prizes.winTier(4),
  items: [...Prizes.TREASURE, ...Prizes.INCENSE,
    ...Prizes.TRS_ALL],
}, {
  wins: Prizes.winTier(5),
  items: [...Prizes.TREASURE, ...Prizes.TREASURE_RARE,
    ...Prizes.INCENSE, ...Prizes.TYPE_RSE_BERRY,
    ...Prizes.TRS_ALL],
}, {
  wins: Prizes.winTier(6),
  items: [...Prizes.TREASURE, ...Prizes.TREASURE_RARE,
    ...Prizes.INCENSE, ...Prizes.BERRY_ALL,
    ...Prizes.TRS_ALL],
}]
const Traditional: BattleTier = {
  label: 'Traditional',
  icon: 'battle-traditional',
  rules: {
    partySize: 1,
    fieldSize: 1,
    mega: false, zmoves: false,
    maxWins: 0,
  },
  prizes: TraditionalPrizeList
}
const RedCup: BattleTier = {
  label: 'Red Cup',
  icon: 'battle-red',
  rules: {
    fieldSize: 1,
    partySize: 1,
    mega: false, zmoves: false,
    maxWins: 0,
  },
  prizes: RedCupPrizeList
}
const CrystalCup: BattleTier = {
  label: 'Crystal Cup',
  icon: 'battle-crystal',
  rules: {
    fieldSize: 1,
    partySize: 1,
    mega: false, zmoves: false,
    maxWins: 0,
  },
  prizes: CrystalCupPrizeList
}
const EmeraldCup: BattleTier = {
  label: 'Emerald Cup',
  icon: 'battle-emerald',
  rules: {
    fieldSize: 2,
    partySize: 2,
    mega: false, zmoves: false,
    maxWins: 0,
  },
  keyItemPrizes: ['redorb', 'blueorb'],
  prizes: EmeraldCupPrizeList,
}
const PlatinumCup: BattleTier = {
  label: 'Platinum Cup',
  icon: 'battle-platinum',
  rules: {
    fieldSize: 2,
    partySize: 2,
    mega: false, zmoves: false,
    maxWins: 0,
  },
  prizes: PlatinumCupPrizeList,
}
const PlasmaCup: BattleTier = {
  label: 'Plasma Cup',
  icon: 'battle-plasma',
  rules: {
    fieldSize: 3,
    partySize: 3,
    mega: false, zmoves: false,
    maxWins: 0,
  },
  prizes: PlasmaCupPrizeList,
}
const KalosCup: BattleTier = {
  label: 'Kalos Cup',
  icon: 'battle-kalos',
  rules: {
    fieldSize: 2,
    partySize: 2,
    mega: true, zmoves: false,
    maxWins: 0,
  },
  prizes: KalosCupPrizeList,
}
const SkyCup: BattleTier = {
  label: 'Sky Cup',
  icon: 'battle-sky',
  rules: {
    fieldSize: 1,
    partySize: 1,
    mega: true, zmoves: false,
    maxWins: 0,
  },
  prizes: KalosCupPrizeList,
}
const AlolanCup: BattleTier = {
  label: 'Alolan Cup',
  icon: 'battle-alolan',
  rules: {
    // Two Pkmn, switch out
    fieldSize: 1,
    partySize: 2,
    mega: false, zmoves: true,
    maxWins: 0,
  },
  prizes: UltraCupPrizeList,
}
const UltraCup: BattleTier = {
  label: 'Ultra Cup',
  icon: 'battle-ultra',
  rules: {
    fieldSize: 2,
    partySize: 2,
    mega: false, zmoves: true,
    maxWins: 0,
  },
  prizes: UltraCupPrizeList,
}
const GalarCup: BattleTier = {
  label: 'GigantaCup',
  icon: 'battle-galar',
  rules: {
    fieldSize: 2,
    partySize: 4,
    mega: false, zmoves: false, dynamax: true,
    maxWins: 0,
  },
  prizes: GalarCupPrizeList,
}
const GalarDlcCup: BattleTier = {
  label: 'Crown Cup',
  icon: 'battle-galardlc',
  rules: {
    fieldSize: 2,
    partySize: 4,
    mega: false, zmoves: false, dynamax: true,
    maxWins: 0,
  },
  prizes: GalarDlcCupPrizeList,
}
const ArceusCup: BattleTier = {
  label: 'Arceus Cup',
  icon: 'battle-arceus',
  rules: {
    fieldSize: 1,
    partySize: 1,
    mega: false, zmoves: false,
    maxWins: 0,
  },
  prizes: ArceusCupPrizeList,
}
const TerastallizeCup: BattleTier = {
  label: 'Terastallize Cup',
  icon: 'battle-paldea',
  rules: {
    fieldSize: 1,
    partySize: 3,
    mega: false, zmoves: false,
    maxWins: 0, tera: true,
  },
  prizes: TeraCupPrizeList,
}
const TinyCup: BattleTier = {
  label: 'Tiny Cup',
  icon: 'battle-tiny',
  rules: {
    fieldSize: 1,
    partySize: 1,
    mega: false, zmoves: false,
    maxWins: 0,
  },
  prizes: TinyCupPrizeList,
}
const BeginnersCup: BattleTier = {
  label: 'Beginners Cup',
  icon: 'battle-beginner',
  rules: {
    fieldSize: 1,
    partySize: 1,
    mega: false, zmoves: false,
    maxWins: 151,
  },
  prizes: TinyCupPrizeList,
}
export const canBeginnersCup = (p: PokemonDoc) => {
  return p.tiers?.includes('Traditional') &&
    p.rarity !== 'LEGENDARY' && p.rarity !== 'MYTHICAL'
}
export const BATTLE_TIERS: Record<Tier, BattleTier> = {
  Traditional,
  'Red Cup': RedCup,
  'Crystal Cup': CrystalCup,
  'Emerald Cup': EmeraldCup,
  'Platinum Cup': PlatinumCup,
  'Plasma Cup': PlasmaCup,
  'Kalos Cup': KalosCup,
  'Sky Cup': SkyCup,
  'Alolan Cup': AlolanCup,
  'Ultra Cup': UltraCup,
  'GigantaCup': GalarCup,
  'Crown Cup': GalarDlcCup,
  'Arceus Cup': ArceusCup,
  'Terastallize Cup': TerastallizeCup,
  'Tiny Cup': TinyCup,
  'Beginners Cup': BeginnersCup,
}