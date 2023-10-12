import { ItemId, ITEMS } from './items-list';
import { Type } from './pokemon/types';
import * as Prizes from './prizes'
import { MoveId, MoveTypeMap } from './gen/type-move-meta';

const commonBerries = [
  ...Prizes.TYPE_GSC_BERRY, ...Prizes.TYPE_GSC_BERRY_B, ...Prizes.TYPE_RSE_BERRY
]

const uncommonBerries = [
  ...Prizes.TYPE_PINCH_BERRY, ...Prizes.TYPE_TREASURE_BERRY,
]

const commonTreasure = [
  ...Prizes.RAIDS_1
]

const uncommonTreasure = [
  ...Prizes.TREASURE, ...Prizes.RAIDS_2
]

const rareTreasure = [
  ...Prizes.TREASURE_RARE, ...Prizes.RAIDS_3
]

const bottleCaps: ItemId[] = [
  'bottlecapatk', 'bottlecapdef', 'bottlecaphp', 'bottlecapspa', 'bottlecapspd', 'bottlecapspe',
]

const trmsByType = (type: Type, cat: 'tms' | 'trs') => {
  return Object.entries(ITEMS)
    .filter(([, i]) => i.category === cat)
    .filter(([k]) => MoveTypeMap[k.substring(3) as MoveId].type === type)
    .map(([k]) => k) as ItemId[]
}

const commonMap: Record<Type, ItemId[]> = {
  Bug: ['silverpowder', 'pungentroot'],
  Normal: ['silkscarf', 'packofpotatoes'],
  Fighting: ['blackbelt', 'largeleek'],
  Flying: ['sharpbeak', 'bread'],
  Fire: ['charcoal', 'rednectar', 'sausages'],
  Poison: ['poisonbarb', 'mixedmushrooms'],
  Fairy: ['silkscarf', 'mistyseed', 'bachsfoodtin'],
  Ghost: ['spelltag', 'purplenectar', 'brittlebones'],
  Psychic: ['twistedspoon', 'pinknectar', 'psychicseed', 'smokepoketail'],
  Dark: ['blackglasses', 'boiledegg'],
  Dragon: ['dragonfang', 'fancyapple'],
  Steel: ['metalcoat', 'moomoocheese'],
  Water: ['mysticwater', 'shoalshell', 'luminousmoss', 'bobsfoodtin'],
  Grass: ['miracleseed', 'grassyseed', 'saladmix'],
  Ice: ['nevermeltice', 'snowball', 'fruitbunch'],
  Electric: ['magnet', 'yellownectar', 'electricseed', 'friedfood'],
  Ground: ['softsand', 'soot', 'tinofbeans'],
  Rock: ['hardstone', 'shoalsalt', 'pasta'],
  Status: [],
}

const uncommonMap: Record<Type, ItemId[]> = {
  Bug: ['stickybarb', 'tanga', 'buggem'],
  Normal: ['everstone', 'chilan', 'normalgem'],
  Fighting: ['expertbelt', 'chople', 'fightinggem', 'protectivepads'],
  Flying: ['prettywing', 'coba', 'flyinggem'],
  Fire: ['firestone', 'occa', 'firegem'],
  Poison: ['blacksludge', 'kebia', 'poisongem'],
  Fairy: ['shinystone', 'roseli', 'fairygem'],
  Ghost: ['mentalherb', 'kasib', 'ghostgem'],
  Psychic: ['dawnstone', 'payapa', 'psychicgem'],
  Dark: ['duskstone', 'colbur', 'darkgem'],
  Dragon: ['dragonscale', 'haban', 'dragongem'],
  Steel: ['ironball', 'babiri', 'steelgem'],
  Water: ['waterstone', 'passho', 'watergem'],
  Grass: ['leafstone', 'rindo', 'grassgem'],
  Ice: ['icestone', 'yache', 'icegem'],
  Electric: ['thunderstone', 'wacan', 'electricgem'],
  Ground: ['ovalstone', 'shuca', 'groundgem'],
  Rock: ['nugget', 'charti', 'rockgem'],
  Status: [],
}

const rareMap: Record<Type, ItemId[]> = {
  Bug: ['insectplate', 'zbuginium', 'bugmemory'],
  Normal: ['pixieplate','znormalium', 'normalgem'],
  Fighting: ['fistplate','zfightinium', 'fightingmemory'],
  Flying: ['skyplate','zflyinium', 'flyingmemory'],
  Fire: ['flameplate','zfirium', 'firememory'],
  Poison: ['toxicplate','zpoisonium', 'poisonmemory'],
  Fairy: ['pixieplate','zfairium', 'fairymemory'],
  Ghost: ['spookyplate','zghostium', 'ghostmemory'],
  Psychic: ['mindplate','zpsychicium', 'psychicmemory'],
  Dark: ['dreadplate','zdarkinium', 'darkmemory'],
  Dragon: ['dracoplate','zdragonium', 'dragonmemory'],
  Steel: ['ironplate','zsteelium', 'steelmemory'],
  Water: ['splashplate','zwaterium', 'watermemory'],
  Grass: ['meadowplate','zgrassium', 'grassmemory'],
  Ice: ['icicleplate','zicium', 'icememory'],
  Electric: ['zapplate','zelectrium', 'electricmemory'],
  Ground: ['earthplate','zgroundium', 'groundmemory'],
  Rock: ['stoneplate','zrockium', 'rockmemory'],
  Status: [],
}

export const allTypePrizes = [...Object.values(commonMap), ...Object.values(uncommonMap)]

export const typePrizes = (types: (Type | undefined)[], rarity: 'common' | 'uncommon' | 'rare'): ItemId[] => {
  const pool: ItemId[] = []
  const typeA = types[0] as Type
  const typeB = types[1] ?? types[0] as Type
  const prizesMap = (() => {
    if (rarity === 'common') return commonMap
    if (rarity === 'uncommon') return uncommonMap
    return rareMap
  })()
  pool.push(...(prizesMap[typeA] as unknown as ItemId[]))
  pool.push(...(prizesMap[typeB] as unknown as ItemId[]))
  if (rarity === 'uncommon') {
    pool.push(...trmsByType(typeA, 'trs'))
    pool.push(...trmsByType(typeB, 'trs'))
  }
  if (rarity === 'rare') {
    pool.push(...trmsByType(typeA, 'tms'))
    pool.push(...trmsByType(typeB, 'tms'))
  }
  return pool
}

const shards: ItemId[] = ['mysteriousshards', 'mysteriousshardl']

// [star count]: ['prize 1', 'prize 2']
type RaidPrizes = [ItemId[], ItemId[], ItemId[]]
export const potentialPrizes: RaidPrizes[] = [
  [['pokeball'], ['pokeball'], ['pokeball']],
  /* 1-Star */
  [
    [...commonBerries, ...commonTreasure],
    [...uncommonBerries, ...uncommonTreasure],
    [...rareTreasure],
  ],
  /* 2-Star */
  [
    [...commonBerries, ...commonTreasure],
    [...uncommonBerries, ...uncommonTreasure, ...Prizes.EVO_STONES],
    [...rareTreasure],
  ],
  /* 3-Star */
  [
    [...commonBerries, ...commonTreasure],
    [...uncommonBerries, ...uncommonTreasure, ...Prizes.EVO_STONES],
    [...rareTreasure],
  ],
  /* 4-Star */
  [
    [...commonBerries, ...commonTreasure],
    [...uncommonBerries, ...uncommonTreasure],
    [...rareTreasure],
  ],
  /* 5-Star */
  [
    [...commonBerries, ...commonTreasure],
    [...uncommonBerries, ...uncommonTreasure],
    [...rareTreasure, ...Prizes.HMS, ...bottleCaps, ...Prizes.MINTS],
  ],
  /* 6-Star */
  [
    [...commonBerries, ...uncommonTreasure],
    [...uncommonBerries, ...rareTreasure],
    [...Prizes.HMS, ...bottleCaps, ...Prizes.MINTS],
  ],
  /* 7-Star (Tiny) */
  [
    [...commonBerries, ...commonTreasure],
    [...uncommonBerries, ...uncommonTreasure, ...Prizes.INCENSE],
    [...rareTreasure],
  ],
  /* 8-Star (Expert) */
  [
    [...commonBerries, ...commonTreasure],
    [...uncommonBerries, ...uncommonTreasure,
      ...Prizes.TYPE_DPPT_HOLD, ...Prizes.TYPE_GSC_HOLD, ...Prizes.TYPE_BW_HOLD, 'dynamaxcandy'],
    [...rareTreasure, ...shards, ...Prizes.MINTS],
  ],
  /* 9-Star (Fossil) */
  [
    [...commonBerries, ...commonTreasure, ...Prizes.EVO_STONES],
    [...uncommonBerries, ...uncommonTreasure, ...Prizes.FOSSILS],
    [...rareTreasure, ...shards, ...Prizes.TREASURE_RELIC],
  ],
  /* 10-Star (Legendary) */
  [
    [...commonBerries, ...uncommonTreasure],
    [...uncommonBerries, ...rareTreasure, 'dynamaxcandy'],
    [...Prizes.TREASURE_RELIC, ...Prizes.MEGA_STONES, ...shards, ...Prizes.MINTS],
  ],
]
