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

const herbaMystica: ItemId[] = [
  'svhmsweet', 'svhmsour', 'svhmsalty', 'svhmbitter', 'svhmspicy',
]

const trmsByType = (type: Type, cat: 'tms' | 'trs') => {
  return Object.entries(ITEMS)
    .filter(([, i]) => i.category === cat)
    .filter(([k]) => MoveTypeMap[k.substring(3) as MoveId].type === type)
    .map(([k]) => k) as ItemId[]
}

const commonMap: Record<Type, ItemId[]> = {
  Bug: ['silverpowder', 'pungentroot', 'sleepimushroom', 'svicherrytomato'],
  Normal: ['silkscarf', 'packofpotatoes', 'sleepimilk', 'svibanana', 'svirice', 'svitofu'],
  Fighting: ['blackbelt', 'largeleek', 'svicheese', 'svipickle', 'svistrawberry'],
  Flying: ['sharpbeak', 'bread', 'sviapple', 'sviprosciutto'],
  Fire: ['charcoal', 'rednectar', 'sausages', 'sleepifieryherb', 'svibasil', 'svitortilla', 'svibellpepperred'],
  Poison: ['poisonbarb', 'mixedmushrooms', 'sleepipureoil', 'svichorizo', 'svibellpeppergreen'],
  Fairy: ['silkscarf', 'mistyseed', 'bachsfoodtin', 'sleepisoybeans', 'svijalapeno', 'svitomato'],
  Ghost: ['spelltag', 'purplenectar', 'brittlebones', 'svisausage', 'svionionred'],
  Psychic: ['twistedspoon', 'pinknectar', 'psychicseed', 'smokepoketail', 'sleepislowpoke', 'svinoodles', 'svionion'],
  Dark: ['blackglasses', 'boiledegg', 'svipineapple', 'svipotatosalad', 'svismokedfillet'],
  Dragon: ['dragonfang', 'fancyapple', 'sviavocado', 'svikiwi'],
  Steel: ['metalcoat', 'moomoocheese', 'sleepicacao', 'sviegg', 'svihamburger', 'sviwatercress'],
  Water: ['mysticwater', 'shoalshell', 'luminousmoss', 'bobsfoodtin', 'sleepiginger', 'svicucumber'],
  Grass: ['miracleseed', 'grassyseed', 'saladmix', 'sleepitomato', 'svilettuce'],
  Ice: ['nevermeltice', 'snowball', 'fruitbunch', 'sviklawfstick'],
  Electric: ['magnet', 'yellownectar', 'electricseed', 'friedfood', 'svibellpepperyellow'],
  Ground: ['softsand', 'soot', 'tinofbeans', 'sleepibeansausage', 'svifriedfillet', 'sviham'],
  Rock: ['hardstone', 'shoalsalt', 'pasta', 'sleepipotato', 'svibacon'],
  Status: [],
}

const uncommonMap: Record<Type, ItemId[]> = {
  Bug: ['stickybarb', 'tanga', 'buggem', 'svcbutter'],
  Normal: ['everstone', 'chilan', 'normalgem', 'svcpepper'],
  Fighting: ['expertbelt', 'chople', 'fightinggem', 'protectivepads', 'svcmayonnaise'],
  Flying: ['prettywing', 'coba', 'flyinggem', 'svchorseradish'],
  Fire: ['firestone', 'occa', 'firegem', 'svcoliveoil'],
  Poison: ['blacksludge', 'kebia', 'poisongem', 'svcketchup'],
  Fairy: ['shinystone', 'roseli', 'fairygem', 'svcyogurt'],
  Ghost: ['mentalherb', 'kasib', 'ghostgem', 'svccurrypowder'],
  Psychic: ['dawnstone', 'payapa', 'psychicgem', 'svcvinegar'],
  Dark: ['duskstone', 'colbur', 'darkgem', 'svcwhippedcream'],
  Dragon: ['dragonscale', 'haban', 'dragongem', 'svcpeanutbutter'],
  Steel: ['ironball', 'babiri', 'steelgem', 'svccreamcheese'],
  Water: ['waterstone', 'passho', 'watergem', 'svcchilisauce'],
  Grass: ['leafstone', 'rindo', 'grassgem', 'svcsalt'],
  Ice: ['icestone', 'yache', 'icegem', 'svcwasabi'],
  Electric: ['thunderstone', 'wacan', 'electricgem', 'svcjam'],
  Ground: ['ovalstone', 'shuca', 'groundgem', 'svcmustard'],
  Rock: ['nugget', 'charti', 'rockgem', 'svcmarmalade'],
  Status: [],
}

const rareMap: Record<Type, ItemId[]> = {
  Bug: ['insectplate', 'zbuginium', 'bugmemory', 'terabug'],
  Normal: ['pixieplate','znormalium', 'normalgem', 'teranormal'],
  Fighting: ['fistplate','zfightinium', 'fightingmemory', 'terafighting'],
  Flying: ['skyplate','zflyinium', 'flyingmemory', 'teraflying'],
  Fire: ['flameplate','zfirium', 'firememory', 'terafire'],
  Poison: ['toxicplate','zpoisonium', 'poisonmemory', 'terapoison'],
  Fairy: ['pixieplate','zfairium', 'fairymemory', 'terafairy'],
  Ghost: ['spookyplate','zghostium', 'ghostmemory', 'teraghost'],
  Psychic: ['mindplate','zpsychicium', 'psychicmemory', 'terapsychic'],
  Dark: ['dreadplate','zdarkinium', 'darkmemory', 'teradark'],
  Dragon: ['dracoplate','zdragonium', 'dragonmemory', 'teradragon'],
  Steel: ['ironplate','zsteelium', 'steelmemory', 'terasteel'],
  Water: ['splashplate','zwaterium', 'watermemory', 'terawater'],
  Grass: ['meadowplate','zgrassium', 'grassmemory', 'teragrass'],
  Ice: ['icicleplate','zicium', 'icememory', 'teraice'],
  Electric: ['zapplate','zelectrium', 'electricmemory', 'teraelectric'],
  Ground: ['earthplate','zgroundium', 'groundmemory', 'teraground'],
  Rock: ['stoneplate','zrockium', 'rockmemory', 'terarock'],
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
    [...rareTreasure, ...shards, ...Prizes.MINTS, ...herbaMystica],
  ],
  /* 9-Star (Fossil) */
  [
    [...commonBerries, ...commonTreasure, ...Prizes.EVO_STONES],
    [...uncommonBerries, ...uncommonTreasure, ...Prizes.FOSSILS],
    [...rareTreasure, ...shards, ...Prizes.TREASURE_RELIC, 'dinofossil', 'drakefossil', 'birdfossil', 'fishfossil'],
  ],
  /* 10-Star (Legendary) */
  [
    [...commonBerries, ...uncommonTreasure],
    [...uncommonBerries, ...rareTreasure, 'dynamaxcandy'],
    [...Prizes.TREASURE_RELIC, ...Prizes.MEGA_STONES, ...shards, ...Prizes.MINTS],
  ],
]
