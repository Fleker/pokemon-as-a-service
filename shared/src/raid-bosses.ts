import * as P from './gen/type-pokemon'
import { WeatherType, RegionType, TerrainType, Location, getTidesByLocation, getMoonPhase, timeOfDay } from './locations-list'
import * as L from './legendary-quests'
import { ItemId } from './items-list'
import { TeamsBadge, Potw } from './badge2'
import * as Q from './quests'
import { BadgeId, PokemonForm } from './pokemon/types'
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Events } from './events'
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Users } from './server-types'
import {KUBFU} from './legendary-quests'

// Mark species as 4x likely to be shiny
export const BOOSTED_SHINY: BadgeId[] = [
  P.Turtonator,
]

export const MONTH_THEME = {
  label: "Frozen Dragonfruit",
}

/** These show up as specially marked in the Public Raids section. */
export const specialRaids: BadgeId[] = [
  /* 6-Star mythical shiny boss */
  Q.GLOBAL_QUESTS[0].boss,
  /* 5-Star event boss */
  Potw(P.Mewtwo, {var: 1}),
  /* 5-Star event boss */
  Potw(P.Pikachu, {var: 1, form: 'kantonian'}),
  Potw(P.Pikachu, {var: 1, form: 'hoennian'}),
  Potw(P.Pikachu, {var: 1, form: 'sinnohian'}),
  Potw(P.Pikachu, {var: 1, form: 'unovan'}),
  Potw(P.Pikachu, {var: 1, form: 'kalosian'}),
  Potw(P.Pikachu, {var: 1, form: 'alolan'}),
  Potw(P.Pikachu, {var: 1, form: 'galarian'}),
  /* Boosted shiny of the month */
  Potw(P.Turtonator, {var: 1}),
  Potw(P.Turtonator, {var: 2}),
  Potw(P.Turtonator, {var: 3}),
  Potw(P.Turtonator, {var: 4}),
]

export interface RaidBoss {
  species: BadgeId
  heldItem?: ItemId
  condition?: L.LegendaryQuest
}

// 1-3*
export const regionBoss: {[key in RegionType]: {[rating: number]: RaidBoss[]}} = {
  'North America': {
    1: [{
      species: Potw(P.Tauros, {var:2,form:'combat_breed'})
    }, {
      species: Potw(P.Grubbin, {var:2})
    }],
    2: [{
      species: Potw(P.Tauros, {var:2,form:'combat_breed'})
    }, {
      species: Potw(P.Charjabug, {var:2})
    }],
    3: [{
      species: Potw(P.Tauros, {var:2,form:'combat_breed'})
    }, {
      species: Potw(P.Vikavolt, {var:2})
    }]
  },
  'South America': {
    1: [{
      species: Potw(P.Tarountula, {var:2})
    }, {
      species: Potw(P.Dewpider, {var:1})
    }],
    2: [{
      species: Potw(P.Tarountula, {var:2})
    }, {
      species: Potw(P.Dewpider, {var:1})
    }],
    3: [{
      species: Potw(P.Spidops, {var:2})
    }, {
      species: Potw(P.Araquanid, {var:1})
    }]
  },
  'North Europe': {
    1: [{
      species: Potw(P.Spinarak, {var: 2})
    }, {
      species: Potw(P.Crabrawler, {var:2})
    }],
    2: [{
      species: Potw(P.Spinarak, {var: 2})
    }, {
      species: Potw(P.Crabrawler, {var:2})
    }],
    3: [{
      species: Potw(P.Ariados, {var: 2})
    }, {
      species: Potw(P.Crabominable, {var:2})
    }]
  },
  'Mediterranean': {
    1: [{
      species: Potw(P.Qwilfish, {var: 1})
    }, {
      species: Potw(P.Spheal, {var:3})
    }],
    2: [{
      species: Potw(P.Qwilfish, {var: 1})
    }, {
      species: Potw(P.Sealeo, {var:3})
    }],
    3: [{
      species: Potw(P.Qwilfish, {var: 1})
    }, {
      species: Potw(P.Walrein, {var:3})
    }]
  },
  'Africa / Middle East': {
    1: [{
      species: Potw(P.Vullaby, {var: 2})
    }, {
      species: Potw(P.Swinub, {var: 4})
    }],
    2: [{
      species: Potw(P.Vullaby, {var: 2})
    }, {
      species: Potw(P.Piloswine, {var: 4})
    }],
    3: [{
      species: Potw(P.Mandibuzz, {var: 2})
    }, {
      species: Potw(P.Mamoswine, {var: 4})
    }]
  },
  'Asia': {
    1: [{
      species: Potw(P.Poltchageist, {var: 1})
    }, {
      species: Potw(P.Bruxish, {var: 1})
    }],
    2: [{
      species: Potw(P.Poltchageist, {var: 1})
    }, {
      species: Potw(P.Bruxish, {var: 1})
    }],
    3: [{
      species: Potw(P.Poltchageist, {var: 1})
    }, {
      species: Potw(P.Bruxish, {var: 1})
    }]
  },
  'Pacific Islands': {
    1: [{
      species: Potw(P.Volbeat, {var:1})
    }, {
      species: Potw(P.Vanillite, {var:1})
    }],
    2: [{
      species: Potw(P.Volbeat, {var:1})
    }, {
      species: Potw(P.Vanillish, {var:1})
    }],
    3: [{
      species: Potw(P.Volbeat, {var:1})
    }, {
      species: Potw(P.Vanilluxe, {var:1})
    }]
  },
  'Australia / New Zealand': {
    1: [{
      species: Potw(P.Illumise, {var:1})
    }, {
      species: Potw(P.Cryogonal, {var:2})
    }],
    2: [{
      species: Potw(P.Illumise, {var:1})
    }, {
      species: Potw(P.Cryogonal, {var:2})
    }],
    3: [{
      species: Potw(P.Illumise, {var:1})
    }, {
      species: Potw(P.Cryogonal, {var: 2})
    }]
  },
}

/* eslint-disable @typescript-eslint/no-unused-vars */
const tinyGrass = [{
  species: Potw(P.Bulbasaur, {var: 1}),
}, {
  species: Potw(P.Chikorita, {var: 1}),
}, {
  species: Potw(P.Treecko, {var: 1}),
}, {
  species: Potw(P.Turtwig, {var: 1}),
}, {
  species: Potw(P.Snivy, {var: 1}),
}, {
  species: Potw(P.Chespin, {var: 1}),
}]

/* eslint-disable @typescript-eslint/no-unused-vars */
const tinyFire = [{
  species: Potw(P.Charmander, {var: 1}),
}, {
  species: Potw(P.Cyndaquil, {var: 1}),
}, {
  species: Potw(P.Torchic, {var: 1}),
}, {
  species: Potw(P.Chimchar, {var: 1}),
}, {
  species: Potw(P.Tepig, {var: 1}),
}, {
  species: Potw(P.Fennekin, {var: 1}),
}]

/* eslint-disable @typescript-eslint/no-unused-vars */
const tinyWater = [{
  species: Potw(P.Squirtle, {var: 1}),
}, {
  species: Potw(P.Totodile, {var: 1}),
}, {
  species: Potw(P.Mudkip, {var: 1}),
}, {
  species: Potw(P.Piplup, {var: 1}),
}, {
  species: Potw(P.Oshawott, {var: 1}),
}, {
  species: Potw(P.Froakie, {var: 1}),
}]

/* eslint-disable @typescript-eslint/no-unused-vars */
const johtoEgg1 = [{
  species: Potw(P.Pichu, {var: 4}),
}, {
  species: Potw(P.Cleffa, {var: 4}),
}, {
  species: Potw(P.Igglybuff, {var: 4}),
}, {
  species: Potw(P.Togepi, {var: 4}),
}]

/* eslint-disable @typescript-eslint/no-unused-vars */
const johtoEgg2 = [{
  species: Potw(P.Elekid, {var: 1}),
}, {
  species: Potw(P.Magby, {var: 1}),
}, {
  species: Potw(P.Smoochum, {var: 1}),
}, {
  species: Potw(P.Tyrogue, {var: 1}),
}]

/* eslint-disable @typescript-eslint/no-unused-vars */
const hoennEgg = [{
  species: Potw(P.Wynaut, {var: 1}),
}, {
  species: Potw(P.Azurill, {var: 1}),
}]

/* eslint-disable @typescript-eslint/no-unused-vars */
const sinnohEgg1 = [{
  species: Potw(P.Munchlax, {var: 1}),
}, {
  species: Potw(P.Mime_Jr, {var: 1}),
}, {
  species: Potw(P.Bonsly, {var: 1}),
}, {
  species: Potw(P.Happiny, {var: 1}),
}]

/* eslint-disable @typescript-eslint/no-unused-vars */
const sinnohEgg2 = [{
  species: Potw(P.Riolu, {var: 1}),
}, {
  species: Potw(P.Mantyke, {var: 1}),
}, {
  species: Potw(P.Budew, {var: 1}),
}, {
  species: Potw(P.Chingling, {var: 1}),
}]


const spindaOfTheMonth = Potw(P.Spinda, {var: 4, form: 'i'})
const pumpkabooForm = Potw(P.Pumpkaboo, {var:2, form: 'average'})
const pikachuForm = Potw(P.Pikachu, {var:4, form: 'rock_star'})
const vivillonForm = Potw(P.Vivillon, {var: 2, form: 'garden'})
// Y -> R -> O -> B -> W
const florgesForm = Potw(P.Florges, {var:4, form: 'orange'})
const starterBossVar = 3
const grandUndergroundVar = 3
/* eslint-disable @typescript-eslint/no-unused-vars */
const fossils12 = [{
  species: Potw(P.Kabuto, {var: 4})
}, {
  species: Potw(P.Omanyte, {var: 4})
}]

const fossils3 = [{
  species: Potw(P.Omastar, {var: 4})
}, {
  species: Potw(P.Kabutops, {var: 4})
}, ]

export const standardBosses: RaidBoss[][] = [
  [],
  /* 1-Star */
  [{
    species: Potw(P.Sprigatito, {var: starterBossVar}),
  }, {
    species: Potw(P.Fuecoco, {var: starterBossVar})
  }, {
    species: Potw(P.Quaxly, {var: starterBossVar})
  }, {
    species: Potw(P.Cubchoo, {var:4})
  }, {
    species: Potw(P.Horsea, {var:1})
  }, {
    species: Potw(P.Dratini, {var:2})
  }, {
    species: Potw(P.Smoochum, {var:4})
  }, {
    species: Potw(P.Snorunt, {var:1})
  }, {
    species: Potw(P.Bergmite, {var:2})
  }, {
    species: Potw(P.Wooper, {var:2, form: 'paldean'})
  },
  ],
  /* 2-Star */
  [{
    species: Potw(P.Floragato, {var: starterBossVar})
  }, {
    species: Potw(P.Crocalor, {var: starterBossVar})
  }, {
    species: Potw(P.Quaxwell, {var: starterBossVar})
  }, {
    species: Potw(P.Sneasel, {var:4}),
  }, {
    species: Potw(P.Mr_Mime, {var:1, form: 'galarian'}),
  }, {
    species: Potw(P.Trapinch, {var:3}),
  }, {
    species: Potw(P.Swablu, {var:1}),
  }, {
    species: Potw(P.Bagon, {var:2}),
},  {
    species: spindaOfTheMonth
  }, {
    species: pumpkabooForm
  },
  ],
  /* 3-Star */
  [{
    species: Potw(P.Meowscarada, {var: starterBossVar})
  }, {
    species: Potw(P.Skeledirge, {var: starterBossVar})
  }, {
    species: Potw(P.Quaquaval, {var: starterBossVar})
  }, {
    species: Potw(P.Skrelp, {var:3})
  }, {
    species: Potw(P.Sandslash, {var:1, form: 'alolan'})
  }, {
    species: Potw(P.Ninetales, {var:2, form: 'alolan'})
  }, {
    species: Potw(P.Tyrantrum, {var:2})
  }, {
    species: Potw(P.Aurorus, {var:2}),
  }, {
    species: spindaOfTheMonth
  }, {
    species: pikachuForm
  }, // ...fossils3
  ],
  /* 4-Star */
  [{
    species: Potw(P.Cloyster, {var:1}),
  }, {
    species: Potw(P.Abomasnow, {var:2})
  }, {
    species: Potw(P.Dewgong, {var:3})
  }, {
    species: Potw(P.Cyclizar, {var:1})
  }, {
    species: Potw(P.Noivern, {var:2})
  }, {
    species: Potw(P.Haxorus, {var:3})
  }, {
    species: Potw(P.Goodra, {var:3})
  }, {
    species: Potw(P.Druddigon, {var:2}),
  }, {
    species: Potw(P.Hydreigon, {var:3}),
  }, {
    species: vivillonForm
  }],
  /* 5-Star */
  [{
    species: Potw(P.Cetitan, {var:1}),
  }, {
    species: Potw(P.Tatsugiri, {var:1}),
  }, {
    species: Potw(P.Baxcalibur, {var:1}),
  }, {
    species: Potw(P.Turtonator, {var:1}),
  }, {
    species: Potw(P.Latios, {var:1}),
  }, {
    species: Potw(P.Latias, {var:1}),
  }, {
    species: Potw(P.Walking_Wake, {var:1}),
  }, {
    species: Potw(P.Iron_Leaves, {var:1}),
  }, {
    species: florgesForm,
  }, /*{
    species: Potw(P.Mewtwo, {var: 1}),
    condition: {
      hints: [{
        // completed: (r) => Events['MEWTWO_BIRTHDAY'].isActive(r as unknown as Users.Doc),
        completed: (r) => Events['POKEMON_DAY'].isActive(r as unknown as Users.Doc),
        msg: 'This raid cannot be created today'
      }]
    }
  }, {
    species: Potw(P.Pikachu, {var: 1, form: 'kantonian'}),
    condition: {
      hints: [{
        completed: (r) => Events['POKEMON_DAY'].isActive(r as unknown as Users.Doc),
        msg: 'This raid cannot be created today'
      }]
    }
  }, {
    species: Potw(P.Pikachu, {var: 1, form: 'hoennian'}),
    condition: {
      hints: [{
        completed: (r) => Events['POKEMON_DAY'].isActive(r as unknown as Users.Doc),
        msg: 'This raid cannot be created today'
      }]
    }
  }, {
    species: Potw(P.Pikachu, {var: 1, form: 'sinnohian'}),
    condition: {
      hints: [{
        completed: (r) => Events['POKEMON_DAY'].isActive(r as unknown as Users.Doc),
        msg: 'This raid cannot be created today'
      }]
    }
  }, {
    species: Potw(P.Pikachu, {var: 1, form: 'unovan'}),
    condition: {
      hints: [{
        completed: (r) => Events['POKEMON_DAY'].isActive(r as unknown as Users.Doc),
        msg: 'This raid cannot be created today'
      }]
    }
  }, {
    species: Potw(P.Pikachu, {var: 1, form: 'kalosian'}),
    condition: {
      hints: [{
        completed: (r) => Events['POKEMON_DAY'].isActive(r as unknown as Users.Doc),
        msg: 'This raid cannot be created today'
      }]
    }
  }, {
    species: Potw(P.Pikachu, {var: 1, form: 'alolan'}),
    condition: {
      hints: [{
        completed: (r) => Events['POKEMON_DAY'].isActive(r as unknown as Users.Doc),
        msg: 'This raid cannot be created today'
      }]
    }
  }, {
    species: Potw(P.Pikachu, {var: 1, form: 'galarian'}),
    condition: {
      hints: [{
        completed: (r) => Events['POKEMON_DAY'].isActive(r as unknown as Users.Doc),
        msg: 'This raid cannot be created today'
      }]
    }
  }, {
    species: Potw(P.Necrozma, {var: 1}),
    condition: {
      hints: [{
        completed: (r) => Events['SOLAR_ECLIPSE'].isActive(r as unknown as Users.Doc),
        msg: 'This raid can only be created during an Eclipse'
      }]
    }
  }*/],
  /* 6-Star */
  [/*{
    species: Q.GLOBAL_QUESTS[0].boss,
  },*/ {
    species: Potw(P.Okidogi, {var: 1}),
  }, {
    species: Potw(P.Munkidori, {var: 1}),
  }, {
    species: Potw(P.Fezandipiti, {var: 1}),
  }],
  /* 7-Star */
  [...tinyGrass, ...sinnohEgg2, {
    species: Potw(P.Pichu, {var: 1, form: 'spiky'})
  }, {
    species: Potw(P.Pawniard, {var:2})
  }, {
    species: Potw(P.Tandemaus, {var:1})
  }, {
    species: Potw(P.Nacli, {var:1})
  }, {
    species: Potw(P.Skitty, {var:1})
  }, {
    species: Potw(P.Gimmighoul, {var:4, form: 'chest'})
  }, {
    species: Potw(P.Magikarp, {var:1, form: 'orange_and_gold_calico'})
  }],
  /* 8-Star */
  [
    {
      // Mega
      species: Potw(P.Alakazam, {var:1}),
      heldItem: 'alakazamite',
    },
    {
      species: Potw(P.Gengar, {var:1}),
      heldItem: 'gengarite',
    },
    {
      species: Potw(P.Banette, {var:3}),
      heldItem: 'banetteite',
    },
    {
      // see https://serebii.net/sunmoon/alolapokedex.shtml
      species: Potw(P.Wishiwashi, {var:1, form: 'school'}),
      heldItem: 'zwaterium',
    },
    {
      // Special Z-Move
      species: Potw(P.Decidueye, {var:3}),
      heldItem: 'zdecidium',
    },
    {
      // Totem
      // see https://bulbapedia.bulbagarden.net/wiki/Totem_Pok%C3%A9mon
      species: Potw(P.Kommo_o, {var: 1, form: 'totem'})
    },
    {
      // DMax
      species: Potw(P.Ursaluna, {var:1, form: 'blood_moon'}),
      heldItem: 'dynamaxcandy',
    },
    {
      // GMax
      // see https://bulbapedia.bulbagarden.net/wiki/Gigantamax
      species: Potw(P.Blastoise, {var:4}),
      heldItem: 'maxmushroom',
    },
    {
      // Alphas
      // see https://www.serebii.net/legendsarceus/alphapokemon.shtml
      species: Potw(P.Stantler, {var: 1, form: 'alpha'}),
    },
    {
      // Nobles
      // see https://www.serebii.net/legendsarceus/noblepokemon.shtml
      species: Potw(P.Avalugg, {var:2, form: 'noble'})
    },
    {
      // Tera Type
      species: Potw(P.Cyclizar, {var:1}),
      heldItem: 'teraflying',
    },
    {
      // Starmobile
      species: Potw(P.Revavroom, {var:1}),
      heldItem: 'terafairy',
    },
    {
      // Scarlet Paradox
      species: Potw(P.Scream_Tail, {var:1}),
      heldItem: 'boosterenergy',
    },
    {
      // Violet Paradox
      species: Potw(P.Iron_Bundle, {var:1}),
      heldItem: 'boosterenergy',
    },
    {
      // Titan
      species: Potw(P.Dondozo, {var:1, form: 'titan'}),
    },
    ...Object.values(regionBoss)[0][3],
    ...Object.values(regionBoss)[1][3],
    ...Object.values(regionBoss)[2][3],
    ...Object.values(regionBoss)[3][3],
    ...Object.values(regionBoss)[4][3],
    ...Object.values(regionBoss)[5][3],
    ...Object.values(regionBoss)[6][3],
    ...Object.values(regionBoss)[7][3],
  ],
  /* 9-Star */
  [{
    species: Potw(P.Omastar, {var: grandUndergroundVar})
  }, {
    species: Potw(P.Kabutops, {var: grandUndergroundVar})
  }, {
    species: Potw(P.Aerodactyl, {var: grandUndergroundVar})
  }, {
    species: Potw(P.Cradily, {var: grandUndergroundVar})
  }, {
    species: Potw(P.Armaldo, {var: grandUndergroundVar})
  }, {
    species: Potw(P.Rampardos, {var: grandUndergroundVar})
  }, {
    species: Potw(P.Bastiodon, {var: grandUndergroundVar})
  }, {
    species: Potw(P.Carracosta, {var: grandUndergroundVar})
  }, {
    species: Potw(P.Archeops, {var: grandUndergroundVar})
  }, {
    species: Potw(P.Tyrantrum, {var: grandUndergroundVar})
  }, {
    species: Potw(P.Aurorus, {var: grandUndergroundVar})
  }, {
    species: Potw(P.Dracozolt, {var:4})
  }],
  /* 10-Star */
  [{
    species: Potw(P.Mewtwo, {var: 1}),
    condition: {
      hints: [{
        completed: (r) => r.hiddenItemsFound.includes('RDYwoV8ZGOpBSdrp7vUc'),
        msg: 'Complete the Mew quest first.'
      }]
    },
  }, {
    species: Potw(P.Articuno, {var: 2}),
  }, { /* TODO: Add conditions */
    species: Potw(P.Zapdos, {var: 2}),
  }, {
    species: Potw(P.Moltres, {var: 2}),
  }, {
    species: Potw(P.Raikou, {var: 1}),
    condition: {
      hints: [{
        completed: (r) => r.location.forecast === 'Thunderstorm',
        msg: 'Raikou only appears in thunderstorms.'
      }]
    },
  }, {
    species: Potw(P.Entei, {var: 1}),
    condition: {
      hints: [{
        completed: (r) => r.location.forecast === 'Heat Wave',
        msg: 'Entei only appears in heat waves.'
      }]
    },
  }, {
    species: Potw(P.Suicune, {var: 1}),
    condition: {
      hints: [{
        completed: (r) => r.location.forecast === 'Rain',
        msg: 'Suicune only appears in heavy rains.'
      }]
    },
  }, {
    species: Potw(P.Lugia, {var: 1}),
    condition: {
      hints: [{
        completed: (r) => r.location.terrain === 'Oceanic',
        msg: 'Lugia only appears in Oceanic locations.'
      }, {
        completed: (r) => r.hiddenItemsFound.includes(L.CATCH_CHARM_GSC),
        msg: 'Requires the GSC Catching Charm'
      }]
    },
  }, {
    species: Potw(P.Ho_Oh, {var: 1}),
    condition: {
      hints: [{
        completed: (r) => r.location.terrain === 'Grasslands',
        msg: 'Ho-Oh only appears in Grassland locations.'
      }, {
        completed: (r) => r.hiddenItemsFound.includes(L.CATCH_CHARM_GSC),
        msg: 'Requires the GSC Catching Charm'
      }]
    },
  }, {
    species: Potw(P.Latias, {var: 1}),
    condition: {
      hints: [{
        completed: (r) => r.location.terrain == 'Tropical',
        msg: 'Latias only appears in tropical locations.'
      }]
    },
  }, {
    species: Potw(P.Latios, {var: 1}),
    condition: {
      hints: [{
        completed: (r) => r.location.terrain == 'Tropical',
        msg: 'Latios only appears in tropical locations.'
      }]
    },
  }, {
    species: Potw(P.Kyogre, {var: 1}),
    condition: {
      hints: [{
        completed: (r) => r.location.forecast === 'Rain',
        msg: 'Kyogre only appears in the midst of a torrential downpour.'
      }]
    },
  }, {
    species: Potw(P.Groudon, {var: 1}),
    condition: {
      hints: [{
        completed: (r) => r.location.forecast === 'Heat Wave',
        msg: 'Groudon only appears when the sun is intense.'
      }]
    },
  }, {
    species: Potw(P.Rayquaza, {var: 1}),
    condition: {
      hints: [{
        completed: (r) => r.location.forecast === 'Windy',
        msg: 'Rayquaza only comes down during strong winds.'
      }]
    },
  }, {
    species: Potw(P.Heatran, {var: 2}),
    condition: {
      hints: [{
        completed: (r) => r.location.forecast === 'Heat Wave',
        msg: 'Heatran only appears in areas of extreme heat.'
      }]
    }
  }, {
    species: Potw(P.Regigigas, {var: 1}),
    condition: {
      hints: [{
        completed: L.simpleRequirePotwArr([P.Regirock, P.Regice, P.Registeel]),
        msg: 'Regigigas only appears when you have the three primary golems.'
      }]
    }
  }, {
    species: Potw(P.Phione, {var: 2}),
    condition: {
      hints: [{
        completed: (r) => getTidesByLocation(r.location) === 'High Tide',
        msg: 'Phione only appears during high tides.'
      }]
    }
  }, {
    species: Potw(P.Cresselia, {var: 2}),
    condition: {
      hints: [{
        completed: () => getMoonPhase().includes('Crescent'),
        msg: 'Cresselia only appears during the crescent moon.'
      }]
    }
  }, {
    species: Potw(P.Darkrai, {var: 1}),
    condition: {
      hints: [{
        completed: (r) => getMoonPhase().includes('New Moon') && timeOfDay(r.location) === 'Night' && r.hiddenItemsFound.includes('PdRaCqqYpkh12XD6dQn1'),
        msg: 'Darkrai only appears in pitch dark.'
      }]
    }
  }, {
    species: Potw(P.Dialga, {var: 2}),
    condition: {
      hints: [{
        completed: (r) => r.location.terrain === 'Mountain',
        msg: 'Dialga only appears in Mountainous locations.'
      }, {
        completed: (r) => r.hiddenItemsFound.includes(L.CATCH_CHARM_DPPT),
        msg: 'Requires the DPPt Catching Charm'
      }]
    },
  }, {
    species: Potw(P.Palkia, {var: 2}),
    condition: {
      hints: [{
        completed: (r) => r.location.terrain === 'Mountain',
        msg: 'Palkia only appears in Mountainous locations.'
      }, {
        completed: (r) => r.hiddenItemsFound.includes(L.CATCH_CHARM_DPPT),
        msg: 'Requires the DPPt Catching Charm'
      }]
    },
  }, {
    species: Potw(P.Regice, {var: 1}),
    condition: {
      hints: [{
        completed: (r) => r.location.regice === true,
        msg: 'Regice only appears in one location a day.'
      }]
    },
  }, {
    species: Potw(P.Regirock, {var: 1}),
    condition: {
      hints: [{
        completed: (r) => r.location.regirock === true,
        msg: 'Regirock only appears in one location a day.'
      }]
    },
  }, {
    species: Potw(P.Registeel, {var: 1}),
    condition: {
      hints: [{
        completed: (r) => r.location.registeel === true,
        msg: 'Registeel only appears in one location a day.'
      }]
    },
  }, {
    species: Potw(P.Azelf, {var: 2}),
    condition: {
      hints: [{
        completed: (r) => r.location.terrain == 'Bay',
        msg: 'Azelf only appears in the bay.'
      }]
    },
  }, {
    species: Potw(P.Mesprit, {var:2}),
    condition: {
      hints: [{
        completed: (r) => r.location.terrain == 'Bay',
        msg: 'Mesprit only appears in the bay.'
      }]
    },
  }, {
    species: Potw(P.Uxie, {var:2}),
    condition: {
      hints: [{
        completed: (r) => r.location.terrain == 'Bay',
        msg: 'Uxie only appears in the bay.'
      }]
    },
  }, {
    species: Potw(P.Giratina, {var:2}),
    condition: {
      hints: [{
        completed: (r) => r.location.terrain == 'Mountain' && timeOfDay(r.location) === 'Night',
        msg: 'Giratina only appears in mountains at night.'
      }]
    },
  }, {
    species: Potw(P.Thundurus, {var:2}),
    condition: {
      hints: [{
        completed: (r) => r.location.forecast === 'Windy',
        msg: 'Thundurus only appears in windy locations.'
      }]
    },
  }, {
    species: Potw(P.Tornadus, {var:2}),
    condition: {
      hints: [{
        completed: (r) => r.location.forecast === 'Windy',
        msg: 'Tornadus only appears in windy locations.'
      }]
    },
  }, {
    species: Potw(P.Landorus, {var:2}),
    condition: {
      hints: [{
        completed: (r) => r.location.forecast === 'Windy',
        msg: 'Landorus only appears in windy locations.'
      }]
    },
  }, {
    species: Potw(P.Virizion, {var:1}),
    condition: {
      hints: [{
        completed: (r) => r.location.terrain === 'Forest',
        msg: 'Virizion only appears in forest locations.'
      }]
    },
  }, {
    species: Potw(P.Terrakion, {var:1}),
    condition: {
      hints: [{
        completed: (r) => r.location.terrain === 'Rural',
        msg: 'Terrakion only appears in rural locations.'
      }]
    },
  }, {
    species: Potw(P.Cobalion, {var:1}),
    condition: {
      hints: [{
        completed: (r) => r.location.terrain === 'Mountain',
        msg: 'Cobalion only appears in mountainous locations.'
      }]
    },
  }, {
    species: Potw(P.Zekrom, {var:1}),
    condition: {
      hints: [{
        completed: (r) => r.location.forecast === 'Thunderstorm',
        msg: 'Zekrom only appears during thunderstorms.'
      }]
    },
  }, {
    species: Potw(P.Reshiram, {var:1}),
    condition: {
      hints: [{
        completed: (r) => r.location.forecast === 'Heat Wave',
        msg: 'Reshiram only appears during heat waves.'
      }]
    },
  }, {
    species: Potw(P.Kyurem, {var:1}),
    condition: {
      hints: [{
        completed: L.requireItem(['dnasplicerblack', 'dnasplicerwhite']),
        msg: 'Kyurem will not appear until you have obtained DNA splicers.'
      }]
    },
  }, {
    species: Potw(P.Xerneas, {var:1}),
    condition: {
      hints: [{
        completed: (r) => r.items.zygardecube !== undefined && r.items.zygardecube > 0,
        msg: 'Requires the Zygarde Cube.'
      }]
    },
  }, {
    species: Potw(P.Yveltal, {var:1}),
    condition: {
      hints: [{
        completed: (r) => r.items.zygardecube !== undefined && r.items.zygardecube > 0,
        msg: 'Requires the Zygarde Cube.'
      }]
    },
  }, {
    species: Potw(P.Zygarde, {var:1, form: 'ten'}),
    condition: {
      hints: [{
        completed: (r) => r.items.zygardecube !== undefined && r.items.zygardecube > 0,
        msg: 'Requires the Zygarde Cube.'
      }]
    },
  }, {
    species: Potw(P.Tapu_Koko, {var:1}),
    condition: {
      hints: [{
        completed: (r) => r.location.terrain === 'Tropical',
        msg: 'Tapu Koko only appears in tropical locations.'
      }]
    },
  }, {
    species: Potw(P.Tapu_Bulu, {var:1}),
    condition: {
      hints: [{
        completed: (r) => r.location.terrain === 'Tropical',
        msg: 'Tapu Bulu only appears in tropical locations.'
      }]
    },
  }, {
    species: Potw(P.Tapu_Fini, {var:1}),
    condition: {
      hints: [{
        completed: (r) => r.location.terrain === 'Tropical',
        msg: 'Tapu Fini only appears in tropical locations.'
      }]
    },
  }, {
    species: Potw(P.Tapu_Lele, {var:1}),
    condition: {
      hints: [{
        completed: (r) => r.location.terrain === 'Tropical',
        msg: 'Tapu Lele only appears in tropical locations.'
      }]
    },
  }, {
    species: Potw(P.Nihilego, {var:2}),
    condition: {
      hints: [{
        completed: (r) => r.hiddenItemsFound.includes(L.CATCH_CHARM_SM),
        msg: 'You must prove your catching skills in Alola before you will be allowed to join this raid.'
      }]
    },
  }, {
    species: Potw(P.Buzzwole, {var:2}),
    condition: {
      hints: [{
        completed: (r) => r.hiddenItemsFound.includes(L.CATCH_CHARM_SM),
        msg: 'You must prove your catching skills in Alola before you will be allowed to join this raid.'
      }]
    },
  }, {
    species: Potw(P.Pheromosa, {var:2}),
    condition: {
      hints: [{
        completed: (r) => r.hiddenItemsFound.includes(L.CATCH_CHARM_SM),
        msg: 'You must prove your catching skills in Alola before you will be allowed to join this raid.'
      }]
    },
  }, {
    species: Potw(P.Xurkitree, {var:2}),
    condition: {
      hints: [{
        completed: (r) => r.hiddenItemsFound.includes(L.CATCH_CHARM_SM),
        msg: 'You must prove your catching skills in Alola before you will be allowed to join this raid.'
      }]
    },
  }, {
    species: Potw(P.Celesteela, {var:2}),
    condition: {
      hints: [{
        completed: (r) => r.hiddenItemsFound.includes(L.CATCH_CHARM_SM),
        msg: 'You must prove your catching skills in Alola before you will be allowed to join this raid.'
      }]
    },
  }, {
    species: Potw(P.Kartana, {var:2}),
    condition: {
      hints: [{
        completed: (r) => r.hiddenItemsFound.includes(L.CATCH_CHARM_SM),
        msg: 'You must prove your catching skills in Alola before you will be allowed to join this raid.'
      }]
    },
  }, {
    species: Potw(P.Guzzlord, {var:2}),
    condition: {
      hints: [{
        completed: (r) => r.hiddenItemsFound.includes(L.CATCH_CHARM_SM),
        msg: 'You must prove your catching skills in Alola before you will be allowed to join this raid.'
      }]
    },
  }, {
    species: Potw(P.Blacephalon, {var:2}),
    condition: {
      hints: [{
        completed: L.requireItem('zultranecrozium'),
        msg: "Obtain Necrozma's Z-Crystal."
      }]
    },
  }, {
    species: Potw(P.Stakataka, {var:2}),
    condition: {
      hints: [{
        completed: L.requireItem('zultranecrozium'),
        msg: "Obtain Necrozma's Z-Crystal."
      }]
    },
  }, {
    species: Potw(P.Poipole, {var:2}),
    condition: {
      hints: [{
        completed: L.requireItem('zultranecrozium'),
        msg: "Obtain Necrozma's Z-Crystal."
      }]
    },
  }, {
    species: Potw(P.Cosmog, {var:1}),
    condition: {
      hints: [{
        completed: L.requireItem('zsolganium'),
        msg: "Obtain Solgaleo's Z-Crystal."
      }, {
        completed: L.requireItem('zlunalium'),
        msg: "Obtain Lunalas's Z-Crystal."
      }]
    },
  }, {
    species: Potw(P.Necrozma, {var:1}),
    condition: {
      hints: [{
        completed: L.requireItem('zultranecrozium'),
        msg: "Obtain Necrozma's Z-Crystal."
      }]
    },
  }, {
    species: Potw(P.Type_Null, {var:1}),
    condition: {
      hints: [{
        completed: L.requireItem('zultranecrozium'),
        msg: "To battle Type: Null you must obtain the ultimate power of Necrozma."
      }]
    },
  }, {
    species: Potw(P.Meltan, {var:1}),
    condition: {
      hints: [{
        completed: L.requireItem('meltanbox'),
        msg: "Meltan will only appear if attracted by a mysterious box."
      }]
    },
  }, {
    species: Potw(P.Zacian, {var:4}),
    heldItem: 'rustedsword',
    condition: {
      hints: [{
        completed: L.requireItem('rustedsword'),
        msg: "Zacian will only appear if drawn by the Rusted Sword."
      }]
    },
  }, {
    species: Potw(P.Zamazenta, {var:4}),
    heldItem: 'rustedshield',
    condition: {
      hints: [{
        completed: L.requireItem('rustedshield'),
        msg: "Zamazenta will only appear if drawn by the Rusted Shield."
      }]
    },
  }, {
    species: Potw(P.Eternatus, {var:4}),
    heldItem: 'berserkgene',
    condition: {
      hints: [{
        completed: L.requireItem('rustedsword'),
        msg: "Eternatus will only appear if drawn by the Rusted Sword."
      }]
    },
  }, {
    species: Potw(P.Kubfu, {var:3}),
    condition: {
      hints: [{
        completed: (r) => r.hiddenItemsFound.includes(KUBFU),
        msg: "Kubfu only appears to trainers who have proven themselves already."
      }]
    },
  }, {
    species: Potw(P.Regieleki, {var:1}),
    condition: {
      hints: [{
        completed: L.simpleRequirePotwArr([P.Regirock, P.Regice, P.Registeel, P.Regieleki, P.Regidrago]),
        msg: 'Regieleki only appears when you have all the golems.'
      }]
    }
  }, {
    species: Potw(P.Regidrago, {var:1}),
    condition: {
      hints: [{
        completed: L.simpleRequirePotwArr([P.Regirock, P.Regice, P.Registeel, P.Regieleki, P.Regidrago]),
        msg: 'Regidrago only appears when you have all the golems.'
      }]
    }
  }, {
    species: Potw(P.Glastrier, {var:4}),
    condition: {
      hints: [{
        completed: L.simpleRequirePotw(P.Calyrex),
        msg: 'Glastrier only appears when you have befriended its rider.'
      }]
    }
  }, {
    species: Potw(P.Spectrier, {var:4}),
    condition: {
      hints: [{
        completed: L.simpleRequirePotw(P.Calyrex),
        msg: 'Spectrier only appears when you have befriended its rider.'
      }]
    }
  }, {
    species: Potw(P.Enamorus, {var:3}),
    condition: {
      hints: [{
        completed: L.requireItem('legendplate'),
        msg: 'Enamorus will only appear when the player has the plate of legends.'
      }]
    }
  }],
]

// 1-2*
export const timeBoss: {'Day': {[rating: number]: RaidBoss[]}, 'Night': {[rating: number]: RaidBoss[]}} = {
  'Day': {
    1: [{
      species: Potw(P.Torchic, {var:1})
    }],
    2: [{
      species: Potw(P.Torchic, {var:1})
    }]
  },
  'Night': {
    1: [{
      species: Potw(P.Mudkip, {var:1})
    }],
    2: [{
      species: Potw(P.Mudkip, {var:1})
    }]
  }
}

// 3-4*
export const forecastBoss: {[key in WeatherType]: {[rating: number]: RaidBoss[]}} = {
  Cloudy: {
    3: [{
     species: Potw(P.Sigilyph, {var:3}),
    }, {
     species: Potw(P.Delibird, {var:2}),
    }],
    4: [{
      species: Potw(P.Sigilyph, {var:3}),
    }, {
      species: Potw(P.Delibird, {var:2}),
    }]
  },
  Fog: {
    3: [{
     species: Potw(P.Mimikyu, {var: 1}),
    }, {
     species: Potw(P.Shuppet, {var: 2}),
    }],
    4: [{
      species: Potw(P.Mimikyu, {var:1}),
    }, {
      species: Potw(P.Banette, {var: 2}),
    }]
  },
  'Heat Wave': {
    3: [{
      species: Potw(P.Quilava, {var:4})
    }, {
      species: Potw(P.Vulpix, {var: 3})
    }],
    4: [{
      species: Potw(P.Typhlosion, {var:4})
    }, {
      species: Potw(P.Ninetales, {var: 3})
    }]
  },
  Rain: {
    3: [{
      species: Potw(P.Dewott, {var:4}),
    }, {
      species: Potw(P.Corphish, {var:3}),
    }],
    4: [{
      species: Potw(P.Samurott, {var:4}),
    }, {
      species: Potw(P.Crawdaunt, {var:3}),
    }]
  },
  Sandstorm: {
    3: [{
      species: Potw(P.Bramblin, {var:2}),
    }, {
      species: Potw(P.Mawile, {var:4}),
    }],
    4: [{
      species: Potw(P.Bramblin, {var:2}),
    }, {
      species: Potw(P.Mawile, {var:4}),
    }],
  },
  'Diamond Dust': {
    3: [{
      species: Potw(P.Castform, {var: 1, form:'snowy'}),
    }, {
      species: Potw(P.Eevee, {var: 2}),
    }],
    4: [{
      species: Potw(P.Castform, {var: 1, form:'snowy'}),
    }, {
      species: Potw(P.Glaceon, {var:2}),
    }],
  },
  Snow: {
    3: [{
      species: Potw(P.Castform, {var: 1, form:'snowy'}),
    }, {
      species: Potw(P.Eevee, {var: 2})
    }],
    4: [{
      species: Potw(P.Castform, {var:1, form:'snowy'}),
    }, {
      species: Potw(P.Glaceon, {var:2})
    }],
  },
  Thunderstorm: {
    3: [{
      species: Potw(P.Tadbulb, {var:2}),
    }, {
      species: Potw(P.Voltorb, {var:1}),
    }],
    4: [{
      species: Potw(P.Tadbulb, {var:2}),
    }, {
      species: Potw(P.Electrode, {var:1}),
    }]
  },
  Sunny: {
    3: [{
      species: Potw(P.Farfetchd, {var:4}),
    }, {
      species: Potw(P.Skiddo, {var:2}),
    }],
    4: [{
      species: Potw(P.Farfetchd, {var:4}),
    }, {
      species: Potw(P.Gogoat, {var:2}),
    }]
  },
  Windy: {
    3: [{
      species: Potw(P.Dartrix, {var:4}),
    }, {
      species: Potw(P.Spearow, {var:2}),
    }],
    4: [{
      species: Potw(P.Decidueye, {var:4}),
    }, {
      species: Potw(P.Fearow, {var:2}),
    }]
  },
}

// 2-4*
export const terrainBoss: {[key in TerrainType]: {[rating: number]: RaidBoss[]}} = {
  Bay: {
    2: [{
      species: Potw(P.Lechonk, {var:2})
    }, {
      species: Potw(P.Stunfisk, {var: 4})
    }],
    3: [{
      species: Potw(P.Lechonk, {var:2})
    }, {
      species: Potw(P.Stunfisk, {var: 4})
    }],
    4: [{
      species: Potw(P.Oinkologne, {var:2})
    }, {
      species: Potw(P.Stunfisk, {var: 4})
    }]
  },
  Beach: {
    2: [{
      species: Potw(P.Finizen, {var:1})
    }, {
      species: Potw(P.Ducklett, {var: 1})
    }],
    3: [{
      species: Potw(P.Finizen, {var:1})
    }, {
      species: Potw(P.Ducklett, {var: 1})
    }],
    4: [{
      species: Potw(P.Finizen, {var:1})
    }, {
      species: Potw(P.Swanna, {var: 1})
    }]
  },
  Mountain: {
    2: [{
      species: Potw(P.Duraludon, {var:1})
    }, {
      species: Potw(P.Koffing, {var:4})
    }],
    3: [{
      species: Potw(P.Duraludon, {var:1})
    }, {
      species: Potw(P.Koffing, {var:4})
    }],
    4: [{
      species: Potw(P.Duraludon, {var:1})
    }, {
      species: Potw(P.Weezing, {var:4})
    }],
  },
  Tropical: {
    2: [{
      species: Potw(P.Nymble, {var:2})
    }, {
      species: Potw(P.Litten, {var:1})
    }],
    3: [{
      species: Potw(P.Nymble, {var:2})
    }, {
      species: Potw(P.Torracat, {var:1})
    }],
    4: [{
      species: Potw(P.Lokix, {var:2})
    }, {
      species: Potw(P.Incineroar, {var:1})
    }],
  },
  Rural: {
    2: [{
      species: Potw(P.Mankey, {var:3})
    }, {
      species: Potw(P.Spiritomb, {var:1})
    }],
    3: [{
      species: Potw(P.Mankey, {var:3})
    }, {
      species: Potw(P.Spiritomb, {var:1})
    }],
    4: [{
      species: Potw(P.Primeape, {var:3})
    }, {
      species: Potw(P.Spiritomb, {var:1})
    }],
  },
  Desert: {
    2: [{
      species: Potw(P.Orthworm, {var:1})
    }, {
      species: Potw(P.Rockruff, {var:1})
    }],
    3: [{
      species: Potw(P.Orthworm, {var: 1})
    }, {
      species: Potw(P.Rockruff, {var:1})
    }],
    4: [{
      species: Potw(P.Orthworm, {var: 1})
    }, {
      species: Potw(P.Lycanroc, {var:1,form:'midday'})
    }],
  },
  Grasslands: {
    2: [{
      species: Potw(P.Pawmi, {var:1})
    }, {
      species: Potw(P.Fennekin, {var:3})
    }],
    3: [{
      species: Potw(P.Pawmo, {var:1})
    }, {
      species: Potw(P.Braixen, {var:3})
    }],
    4: [{
      species: Potw(P.Pawmo, {var:1})
    }, {
      species: Potw(P.Delphox, {var:3})
    }],
  },
  Gardens: {
    2: [{
      species: Potw(P.Fidough, {var:1})
    }, {
      species: Potw(P.Fomantis, {var: 1})
    }],
    3: [{
      species: Potw(P.Fidough, {var:1})
    }, {
      species: Potw(P.Fomantis, {var: 1})
    }],
    4: [{
      species: Potw(P.Dachsbun, {var:1})
    }, {
      species: Potw(P.Lurantis, {var: 1})
    }]
  },
  Forest: {
    2: [{
      species: Potw(P.Charcadet, {var:1})
    }, {
      species: Potw(P.Froakie, {var: 3})
    }],
    3: [{
      species: Potw(P.Charcadet, {var:1})
    }, {
      species: Potw(P.Frogadier, {var: 3})
    }],
    4: [{
      species: Potw(P.Charcadet, {var:1})
    }, {
      species: Potw(P.Greninja, {var: 3})
    }],
  },
  Urban: {
    2: [{
      species: Potw(P.Milcery, {var:4})
    }, {
      species: Potw(P.Grimer, {var:2})
    }],
    3: [{
      species: Potw(P.Milcery, {var:4})
    }, {
      species: Potw(P.Grimer, {var:2})
    }],
    4: [{
      species: Potw(P.Milcery, {var:4})
    }, {
      species: Potw(P.Muk, {var:2})
    }]
  },
  Rainforest: {
    2: [{
      species: Potw(P.Cherubi, {var:1})
    }, {
      species: Potw(P.Scatterbug, {var:4})
    }],
    3: [{
      species: Potw(P.Cherubi, {var:1})
    }, {
      species: Potw(P.Spewpa, {var:4})
    }],
    4: [{
      species: Potw(P.Cherrim, {var:1})
    }, {
      species: Potw(P.Vivillon, {var:4, form: 'jungle'})
    }],
  },
  Oceanic: {
    2: [{
      species: Potw(P.Dondozo, {var: 1})
    }, {
      species: Potw(P.Surskit, {var:4})
    }],
    3: [{
      species: Potw(P.Dondozo, {var: 1})
    }, {
      species: Potw(P.Surskit, {var:4})
    }],
    4: [{
      species: Potw(P.Dondozo, {var: 1})
    }, {
      species: Potw(P.Masquerain, {var:4})
    }],
  }
}

export const getAvailableBosses = (rating: number, location: Location, charms: string[], questArgs?: L.Requirements, tod?: 'Day' | 'Night'): RaidBoss[] => {
  const allBosses = [...standardBosses[rating]]
  const johto = charms.includes(Q.CATCH_CHARM_RBY)
  const hoenn = charms.includes(Q.CATCH_CHARM_GSC)
  if (rating >= 1 && rating <= 3 && johto) {
    allBosses.push(...regionBoss[location.region][rating])
  }
  if (rating === 3 || rating === 4) {
    allBosses.push(...forecastBoss[location.forecast!][rating])
  }
  if (rating >= 2 && rating <= 4 && hoenn) {
    allBosses.push(...terrainBoss[location.terrain][rating])
  }
  if (rating <= 2) {
    allBosses.push(...timeBoss[tod ?? 'Day'][rating])
  }

  if (!allBosses || !allBosses.length) {
    console.error(`Error trying to get bosses for a ${rating}-star raid`)
    return [{
      species: P.Magikarp
    }]
  }
  const filterBosses = allBosses.filter(boss => {
    if (!boss.condition) {
      return true
    }
    if (questArgs === undefined) {
      return false
    }
    const {hints} = boss.condition
    for (const hint of hints) {
      const hintCompleted = hint.completed(questArgs) as boolean
      if (!hintCompleted) {
        return false
      }
    }
    return true
  })
  
  return filterBosses
}

const allBosses: RaidBoss[] = []
for (const rating of standardBosses) {
  allBosses.push(...rating)
}
for (const region of Object.values(regionBoss)) {
  for (const boss of Object.values(region)) {
    allBosses.push(...boss)
  }
}
for (const terrain of Object.values(terrainBoss)) {
  for (const boss of Object.values(terrain)) {
    allBosses.push(...boss)
  }
}
for (const time of Object.values(timeBoss)) {
  for (const boss of Object.values(time)) {
    allBosses.push(...boss)
  }
}
/**
 * Mapping of canonical raid bosses with held items
 * (This is for display/informational purposes)
 * @deprecated Look up data from the DB instead
 */
export const bossHeldItem: Partial<Record<BadgeId, ItemId>> = {}
for (const boss of allBosses) {
  if (boss.heldItem) {
    bossHeldItem[`${boss.species}`] = boss.heldItem
  }
}

/**
 * Requirement to catch a Pokemon starting with every letter. They can be of
 * any form.
 */
const captureUnown: L.LegendaryQuest = {
  hints: [{
    completed: (r) => {
      const {badgeKeys} = r
      const unownSet = new Set<string>()
      badgeKeys.forEach(id => {
        const badge = new TeamsBadge(id)
        const title = badge.toLabel()!
        unownSet.add(title.substring(0, 1))
      })
      return unownSet.size >= 26
    },
    msg: 'Pokémon come in all shapes and names. Can you find one starting with every letter?'
  }]
}

// Will be reset upon importing, which may not directly align with days
const dayOfMonth = new Date().getDate()
// a-z => days 1-26 (and day 0)
// !-? => days 27-31 (up to 31 days/month)
const unownForm = ['a', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k',
  'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  '!', '?', '!', '?', '!']
standardBosses[5].push({
  species: Potw(P.Unown, {form: unownForm[dayOfMonth] as PokemonForm}),
  condition: captureUnown
})

export const bossPrizes: Partial<Record<BadgeId, ItemId[]>> = {
  [P.Venusaur]: ['tr-Frenzy Plant', 'venusaurite'],
  [P.Charizard]: ['tr-Blast Burn', 'charizarditex', 'charizarditey'],
  [P.Blastoise]: ['tr-Hydro Cannon', 'blastoiseite'],
  [P.Butterfree]: ['charti'],
  [P.Beedrill]: ['beedrillite'],
  [P.Pidgeotto]: ['sharpbeak'],
  [P.Pidgeot]: ['sharpbeak', 'pidgeotite'],
  [P.Pichu]: ['lightball', 'tm-Volt Tackle'],
  [P.Pikachu]: ['lightball', 'tm-Volt Tackle', 'zpikashunium', 'zpikanium'],
  [P.Raichu]: ['lightball', 'strangesouvenir', 'zaloraichium'],
  [P.Sandshrew]: ['tmm_sandshrew'],
  [P.Sandslash]: ['tmm_sandshrew', 'razorclaw'],
  [P.NidoranF]: ['moonstone'],
  [P.NidoranM]: ['moonstone'],
  [P.Clefable]: ['moonstone'],
  [P.Vulpix]: ['tmm_vulpix'],
  [P.Ninetales]: ['tmm_vulpix'],
  [P.Jigglypuff]: ['tmm_igglybuff'],
  [P.Wigglytuff]: ['babiri', 'moonstone', 'tmm_igglybuff'],
  [P.Golbat]: ['poisonbarb'],
  [P.Oddish]: ['tmm_oddish'],
  [P.Gloom]: ['tmm_oddish'],
  [P.Vileplume]: ['tmm_oddish'],
  [P.Parasect]: ['occa', 'coba'],
  [P.Diglett]: ['softsand', 'tmm_diglett'],
  [P.Dugtrio]: ['softsand', 'tmm_diglett'],
  [P.Meowth]: ['tmm_meowth'],
  [P.Persian]: ['tmm_meowth'],
  [P.Mankey]: ['tm-Rage Fist'],
  [P.Primeape]: ['tm-Rage Fist'],
  [P.Growlithe]: ['tmm_growlithe'],
  [P.Arcanine]: ['tmm_growlithe', 'firestone'],
  [P.Machoke]: ['blackbelt'],
  [P.Machamp]: ['expertbelt'],
  [P.Kadabra]: ['twistedspoon'],
  [P.Alakazam]: ['kasib', 'alakazamite'],
  [P.Weepinbell]: ['leafstone'],
  [P.Tentacool]: ['tmm_tentacool'],
  [P.Tentacruel]: ['tmm_tentacool'],
  [P.Graveler]: ['pewtercrunchies', 'passho', 'rindo'],
  [P.Golem]: ['pewtercrunchies', 'passho', 'rindo'],
  [P.Seel]: ['tmm_seel'],
  [P.Dewgong]: ['tmm_seel'],
  [P.Slowpoke]: ['tmm_slowpoke', 'galaricatwig'],
  [P.Slowbro]: ['slowbroite', 'tmm_slowpoke', 'galaricatwig'],
  [P.Magnemite]: ['tmm_magnemite', 'magnet'],
  [P.Magneton]: ['tmm_magnemite', 'magnet'],
  [P.Farfetchd]: ['leek'],
  [P.Grimer]: ['tmm_grimer'],
  [P.Muk]: ['blacksludge', 'tmm_grimer'],
  [P.Shellder]: ['pearl'],
  [P.Cloyster]: ['bigpearl'],
  [P.Gastly]: ['tmm_gastly'],
  [P.Haunter]: ['tmm_gastly'],
  [P.Gengar]: ['colbur', 'gengarite', 'tmm_gastly'],
  [P.Onix]: ['passho', 'rindo'],
  [P.Drowzee]: ['tmm_drowzee'],
  [P.Hypno]: ['tmm_drowzee'],
  [P.Voltorb]: ['tmm_voltorb'],
  [P.Electrode]: ['tmm_voltorb'],
  [P.Marowak]: ['strangesouvenir', 'thickclub'],
  [P.Exeggutor]: ['tanga', 'strangesouvenir'],
  [P.Hitmonlee]: ['protein'],
  [P.Hitmonchan]: ['iron'],
  [P.Lickitung]: ['tm-Rollout'],
  [P.Rhyhorn]: ['protector', 'passho', 'rindo', 'tmm_rhyhorn'],
  [P.Rhydon]: ['protector', 'passho', 'rindo', 'tmm_rhyhorn'],
  [P.Chansey]: ['tmm_happiny', 'luckypunch'],
  [P.Tangela]: ['tm-Ancient Power'],
  [P.Kangaskhan]: ['kangaskhanite'],
  [P.Horsea]: ['tmm_horsea'],
  [P.Seadra]: ['tmm_horsea'],
  [P.Staryu]: ['stardust'],
  [P.Starmie]: ['starpiece'],
  [P.Mr_Mime]: ['oddincense'],
  [P.Scyther]: ['charti', 'tmm_scyther'],
  [P.Electabuzz]: ['electirizer', 'tmm_elekid'],
  [P.Magmar]: ['magmarizer'],
  [P.Pinsir]: ['pinsirite'],
  [P.Tauros]: ['tmm_tauros'],
  [P.Magikarp]: ['tmm_magikarp'],
  [P.Gyarados]: ['ragecandybar', 'gyaradosite', 'tmm_magikarp'],
  [P.Lapras]: ['tmm_lapras'],
  [P.Ditto]: ['metalpowder', 'rarecandy'],
  [P.Eevee]: ['zeevium'],
  [P.Porygon]: ['upgrade'],
  [P.Omastar]: ['rindo'],
  [P.Kabutops]: ['rindo'],
  [P.Aerodactyl]: ['aerodactylite'],
  [P.Snorlax]: ['fullincense', 'leftovers', 'zsnorlium'],
  [P.Articuno]: ['charti'],
  [P.Moltres]: ['charti'],
  [P.Dratini]: ['tmm_dratini'],
  [P.Dragonair]: ['tmm_dratini'],
  [P.Dragonite]: ['yache', 'tmm_dratini'],
  [P.Mewtwo]: ['mewtwoitex', 'mewtwoitey'],
  [P.Mew]: ['zmewnium'],
  [P.Ledian]: ['charti'],
  [P.Crobat]: ['poisonbarb'],
  [P.Igglybuff]: ['tmm_igglybuff'],
  [P.Togetic]: ['shinystone'],
  [P.Hoppip]: ['tmm_hoppip'],
  [P.Skiploom]: ['tmm_hoppip'],
  [P.Jumpluff]: ['tmm_hoppip'],
  [P.Mareep]: ['tmm_mareep'],
  [P.Flaaffy]: ['tmm_mareep'],
  [P.Ampharos]: ['ampharosite', 'tmm_mareep'],
  [P.Bellossom]: ['tmm_oddish'],
  [P.Marill]: ['azurillfur'],
  [P.Azumarill]: ['azurillfur'],
  [P.Sudowoodo]: ['rockincense', 'tmm_bonsly'],
  [P.Sunkern]: ['tmm_sunkern'],
  [P.Sunflora]: ['tmm_sunkern', 'sunstone'],
  [P.Yanma]: ['tm-Ancient Power'],
  [P.Wooper]: ['tmm_wooper'],
  [P.Quagsire]: ['rindo', 'tmm_wooper'],
  [P.Espeon]: ['sunstone'],
  [P.Umbreon]: ['moonstone'],
  [P.Murkrow]: ['duskstone', 'tmm_murkrow'],
  [P.Misdreavus]: ['duskstone'],
  [P.Slowking]: ['kingsrock', 'tmm_slowpoke', 'galaricatwig'],
  [P.Girafarig]: ['tm-Twin Beam'],
  [P.Pineco]: ['tmm_pineco'],
  [P.Forretress]: ['occa', 'tmm_pineco'],
  [P.Dunsparce]: ['tm-Hyper Drill'],
  [P.Gligar]: ['yache'],
  [P.Steelix]: ['metalcoat', 'steelixite'],
  [P.Snubbull]: ['tmm_snubbull'],
  [P.Granbull]: ['tmm_snubbull'],
  [P.Qwilfish]: ['tmm_qwilfish', 'poisonbarb'],
  [P.Scizor]: ['metalcoat', 'occa', 'scizorite', 'tmm_scyther'],
  [P.Sneasel]: ['razorclaw', 'chople', 'tmm_sneasel'],
  [P.Heracross]: ['coba', 'heracrossite'],
  [P.Teddiursa]: ['teddiursaclaw'],
  [P.Ursaring]: ['teddiursaclaw'],
  [P.Magcargo]: ['passho', 'shuca'],
  [P.Swinub]: ['tmm_swinub'],
  [P.Piloswine]: ['tm-Ancient Power', 'tmm_swinub'],
  [P.Corsola]: ['rindo'],
  [P.Mantine]: ['waveincense'],
  [P.Delibird]: ['charti', 'nugget', 'tmm_delibird'],
  [P.Houndour]: ['tmm_houndour'],
  [P.Houndoom]: ['houndoomite', 'tmm_houndour'],
  [P.Kingdra]: ['haban', 'tmm_horsea'],
  [P.Phanpy]: ['tmm_phanpy'],
  [P.Donphan]: ['tmm_phanpy'],
  [P.Porygon2]: ['dubiousdisc'],
  [P.Stantler]: ['tmm_stantler'],
  [P.Hitmontop]: ['carbos'],
  [P.Smeargle]: ['ragecandybar'],
  [P.Elekid]: ['tmm_elekid'],
  [P.Blissey]: ['luckincense', 'ovalstone', 'tmm_happiny'],
  [P.Tyranitar]: ['chople', 'tyranitarite'],
  [P.Celebi]: ['tanga', 'mintadamant', 'mintcalm', 'mintbold', 'minthardy', 'mintjolly', 'mintmodest', 'mintnaughty', 'minttimid'],
  [P.Sceptile]: ['sceptileite'],
  [P.Blaziken]: ['blazikenite'],
  [P.Swampert]: ['swampertite'],
  [P.Beautifly]: ['charti'],
  [P.Seedot]: ['tmm_seedot'],
  [P.Nuzleaf]: ['tanga', 'tmm_seedot'],
  [P.Shiftry]: ['tanga', 'tmm_seedot'],
  [P.Pelipper]: ['wacan'],
  [P.Gardevoir]: ['gardevoirite'],
  [P.Breloom]: ['coba'],
  [P.Slakoth]: ['tmm_slakoth'],
  [P.Vigoroth]: ['tmm_slakoth'],
  [P.Slaking]: ['tmm_slakoth'],
  [P.Makuhita]: ['tmm_makuhita'],
  [P.Hariyama]: ['tmm_makuhita'],
  [P.Azurill]: ['azurillfur'],
  [P.Meditite]: ['tmm_meditite'],
  [P.Medicham]: ['medichamite', 'tmm_meditite'],
  [P.Sableye]: ['roseli', 'sableyeite', 'tmm_sableye'],
  [P.Mawile]: ['mawileite'],
  [P.Aggron]: ['chople', 'aggronite'],
  [P.Manectric]: ['manectricite'],
  [P.Roselia]: ['shinystone', 'roseincense'],
  [P.Illumise]: ['tanga'],
  [P.Volbeat]: ['tanga'],
  [P.Sharpedo]: ['sharpedoite', 'deepseatooth'],
  [P.Numel]: ['lavacookie', 'tmm_numel'],
  [P.Camerupt]: ['lavacookie', 'passho', 'cameruptite', 'tmm_numel'],
  [P.Torkoal]: ['tmm_torkoal', 'soot'],
  [P.Spoink]: ['tmm_spoink'],
  [P.Grumpig]: ['tmm_spoink', 'pearl'],
  [P.Zangoose]: ['tmm_zangoose'],
  [P.Cacnea]: ['tmm_cacnea'],
  [P.Cacturne]: ['tanga', 'tmm_cacnea'],
  [P.Lunatone]: ['moonstone', 'starpiece'],
  [P.Solrock]: ['sunstone', 'starpiece'],
  [P.Swablu]: ['tmm_swablu'],
  [P.Altaria]: ['tmm_swablu'],
  [P.Corphish]: ['tmm_corphish'],
  [P.Crawdaunt]: ['tmm_corphish', 'gripclaw'],
  [P.Barboach]: ['rindo', 'tmm_barboach'],
  [P.Whiscash]: ['rindo', 'tmm_barboach'],
  [P.Shuppet]: ['tmm_shuppet'],
  [P.Banette]: ['banetteite', 'tmm_shuppet'],
  [P.Wynaut]: ['enigma'],
  [P.Feebas]: ['tmm_feebas', 'prismscale'],
  [P.Milotic]: ['tmm_feebas','prismscale'],
  [P.Tropius]: ['yache', 'tmm_tropius', 'svibanana'],
  [P.Absol]: ['absolite'],
  [P.Luvdisc]: ['tmm_luvdisc', 'heartscale'],
  [P.Snorunt]: ['tmm_snorunt'],
  [P.Glalie]: ['glalieite', 'tmm_snorunt'],
  [P.Clamperl]: ['deepseatooth', 'deepseascale'],
  [P.Huntail]: ['deepseatooth'],
  [P.Gorebyss]: ['deepseascale'],
  [P.Latios]: ['latiosite'],
  [P.Latias]: ['latiasite'],
  [P.Turtwig]: ['adamantorb', 'lustrousorb'],
  [P.Grotle]: ['adamantorb', 'lustrousorb'],
  [P.Torterra]: ['adamantorb', 'lustrousorb'],
  [P.Chimchar]: ['adamantorb', 'lustrousorb'],
  [P.Monferno]: ['adamantorb', 'lustrousorb'],
  [P.Infernape]: ['adamantorb', 'lustrousorb'],
  [P.Piplup]: ['adamantorb', 'lustrousorb'],
  [P.Prinplup]: ['adamantorb', 'lustrousorb'],
  [P.Empoleon]: ['adamantorb', 'lustrousorb'],
  [P.Starly]: ['tmm_starly'],
  [P.Staravia]: ['tmm_starly'],
  [P.Staraptor]: ['tmm_starly'],
  [P.Wormadam]: ['occa'],
  [P.Mothim]: ['charti'],
  [P.Vespiquen]: ['charti'],
  [P.Shieldon]: ['hardstone', 'tmm_shieldon'],
  [P.Bastiodon]: ['chople', 'shuca', 'tmm_shieldon'],
  [P.Kricketune]: ['metronome'],
  [P.Cherubi]: ['cheri'],
  [P.Cherrim]: ['cheri'],
  [P.Shellos]: ['tmm_shellos'],
  [P.Gastrodon]: ['tmm_shellos'],
  [P.Buizel]: ['tmm_buizel'],
  [P.Floatzel]: ['tmm_buizel'],
  [P.Pachirisu]: ['tmm_pachirisu'],
  [P.Honchkrow]: ['tmm_murkrow'],
  [P.Lopunny]: ['lopunnyite'],
  [P.Happiny]: ['tmm_happiny'],
  [P.Bonsly]: ['tmm_bonsly'],
  [P.Drifloon]: ['airballoon'],
  [P.Drifblim]: ['airballoon'],
  [P.Spiritomb]: ['reapercloth', 'wisp', 'tmm_spiritomb'],
  [P.Drapion]: ['lustrousorb'],
  [P.Croagunk]: ['tmm_croagunk'],
  [P.Toxicroak]: ['payapa', 'tmm_croagunk'],
  [P.Bronzor]: ['tmm_bronzor'],
  [P.Bronzong]: ['adamantorb', 'tmm_bronzor'],
  [P.Gible]: ['tmm_gible'],
  [P.Gabite]: ['tmm_gible'],
  [P.Garchomp]: ['yache', 'garchompite', 'tmm_gible'],
  [P.Finneon]: ['tmm_finneon'],
  [P.Lumineon]: ['tmm_finneon'],
  [P.Riolu]: ['lucarioite', 'tmm_riolu'],
  [P.Lucario]: ['lucarioite', 'tmm_riolu'],
  [P.Hippopotas]: ['softsand', 'tmm_hippopotas'],
  [P.Hippowdon]: ['softsand', 'tmm_hippopotas'],
  [P.Snover]: ['tmm_snover'],
  [P.Abomasnow]: ['occa', 'abomasnowite', 'tmm_snover'],
  [P.Weavile]: ['chople', 'tmm_sneasel'],
  [P.Gallade]: ['galladeite'],
  [P.Rhyperior]: ['protector', 'tmm_rhyhorn'],
  [P.Electivire]: ['electirizer', 'tmm_elekid'],
  [P.Magmortar]: ['magmarizer'],
  [P.Probopass]: ['chople', 'shuca'],
  [P.Magnezone]: ['magnet', 'tmm_magnemite', 'shuca'],
  [P.Mamoswine]: ['tmm_swinub'],
  [P.Froslass]: ['tmm_snorunt', 'hopo', 'nevermeltice'],
  [P.Rotom]: ['oldgateau'],
  [P.Dialga]: ['adamantorb'],
  [P.Palkia]: ['lustrousorb'],
  [P.Shaymin]: ['yache', 'mintadamant', 'mintcalm', 'mintbold', 'minthardy', 'mintjolly', 'mintmodest', 'mintnaughty', 'minttimid'],
  [P.Serperior]: ['miracleseed'],
  [P.Emboar]: ['charcoal'],
  [P.Samurott]: ['mysticwater'],
  [P.Palpitoad]: ['rindo'],
  [P.Seismitoad]: ['rindo'],
  [P.Basculin]: ['deepseatooth', 'tmm_basculin'],
  [P.Audino]: ['audinoite'],
  [P.Sewaddle]: ['occa', 'coba', 'tmm_sewaddle'],
  [P.Swadloon]: ['occa', 'coba', 'tmm_sewaddle'],
  [P.Leavanny]: ['occa', 'coba', 'tmm_sewaddle'],
  [P.Timburr]: ['tmm_timburr'],
  [P.Gurdurr]: ['tmm_timburr'],
  [P.Conkeldurr]: ['tmm_timburr'],
  [P.Cottonee]: ['tmm_cottonee'],
  [P.Whimsicott]: ['tmm_cottonee'],
  [P.Petilil]: ['tmm_petilil'],
  [P.Lilligant]: ['tmm_petilil', 'kingsleaf'],
  [P.Scraggy]: ['roseli'],
  [P.Scrafty]: ['roseli'],
  [P.Tirtouga]: ['rindo'],
  [P.Carracosta]: ['rindo'],
  [P.Gothita]: ['tmm_gothita'],
  [P.Gothorita]: ['tmm_gothita'],
  [P.Gothitelle]: ['tmm_gothita'],
  [P.Ducklett]: ['wacan'],
  [P.Swanna]: ['wacan'],
  [P.Escavalier]: ['occa'],
  [P.Zorua]: ['tmm_zorua'],
  [P.Zoroark]: ['tmm_zorua'],
  [P.Foongus]: ['tinymushroom', 'tmm_foongus'],
  [P.Amoonguss]: ['balmmushroom', 'tmm_foongus'],
  [P.Ferroseed]: ['occa'],
  [P.Ferrothorn]: ['occa'],
  [P.Joltik]: ['tmm_joltik'],
  [P.Galvantula]: ['tmm_joltik'],
  [P.Pawniard]: ['chople', 'leaderscrest'],
  [P.Bisharp]: ['chople', 'leaderscrest'],
  [P.Axew]: ['tmm_axew'],
  [P.Fraxure]: ['tmm_axew'],
  [P.Haxorus]: ['tmm_axew'],
  [P.Cubchoo]: ['tmm_cubchoo'],
  [P.Beartic]: ['tmm_cubchoo'],
  [P.Durant]: ['occa'],
  [P.Rufflet]: ['tmm_rufflet'],
  [P.Braviary]: ['tmm_rufflet'],
  [P.Larvesta]: ['charti', 'tmm_larvesta'],
  [P.Volcarona]: ['charti', 'tmm_larvesta'],
  [P.Virizion]: ['coba'],
  [P.Landorus]: ['yache'],
  [P.Genesect]: ['occa'],
  [P.Chesnaught]: ['venusaurite'],
  [P.Delphox]: ['charizarditex', 'charizarditey'],
  [P.Greninja]: ['blastoiseite'],
  [P.Scatterbug]: ['tmm_scatterbug'],
  [P.Spewpa]: ['tmm_scatterbug'],
  [P.Vivillon]: ['tmm_scatterbug', 'charti'],
  [P.Fletchling]: ['tmm_fletchling'],
  [P.Fletchinder]: ['tmm_fletchling'],
  [P.Talonflame]: ['tmm_fletchling'],
  [P.Litleo]: ['tmm_litleo'],
  [P.Pyroar]: ['tmm_litleo'],
  [P.Meowstic]: ['alakazamite'],
  [P.Malamar]: ['absolite'],
  [P.Skiddo]: ['tmm_skiddo'],
  [P.Gogoat]: ['houndoomite', 'tmm_skiddo'],
  [P.Flabébé]: ['tmm_flabebe', 'grassyseed'],
  [P.Floette]: ['tmm_flabebe', 'grassyseed'],
  [P.Florges]: ['tmm_flabebe', 'grassyseed'],
  [P.Aromatisse]: ['sachet'],
  [P.Slurpuff]: ['whippeddream'],
  [P.Furfrou]: [
    'trimdandy', 'trimdeputante', 'trimdiamond', 'trimheart',
    'trimmatron', 'trimnatural', 'trimstar'
  ],
  [P.Aegislash]: ['gengarite'],
  [P.Dedenne]: ['tmm_dedenne'],
  [P.Klefki]: ['tmm_klefki'],
  [P.Goomy]: ['tmm_goomy'],
  [P.Sliggoo]: ['tmm_goomy'],
  [P.Goodra]: ['tmm_goomy'],
  [P.Zygarde]: [...Array(5).fill('zygardecell')],
  [P.Diancie]: ['diancieite'],
  [P.Noibat]: ['tmm_noibat'],
  [P.Noivern]: ['tmm_noibat'],
  [P.Decidueye]: ['zdecidium'],
  [P.Incineroar]: ['zincinium'],
  [P.Primarina]: ['zprimarium'],
  [P.Charjabug]: ['cellbattery'],
  [P.Pikipek]: ['tmm_pikipek'],
  [P.Trumbeak]: ['tmm_pikipek'],
  [P.Toucannon]: ['tmm_pikipek'],
  [P.Ribombee]: ['honey'],
  [P.Crabrawler]: ['tmm_crabrawler'],
  [P.Crabominable]: ['tmm_crabrawler', 'icestone'],
  [P.Rockruff]: ['tmm_rockruff'],
  [P.Lycanroc]: ['tmm_rockruff', 'zlycanium'],
  [P.Oricorio]: ['rednectar', 'yellownectar', 'purplenectar', 'pinknectar', 'tmm_oricorio'],
  [P.Shiinotic]: ['luminousmoss'],
  [P.Minior]: ['cometshard'],
  [P.Comfey]: ['tmm_comfey'],
  [P.Bounsweet]: ['tmm_bounsweet'],
  [P.Steenee]: ['tmm_bounsweet'],
  [P.Tsareena]: ['tm-Stomp', 'tmm_bounsweet'],
  [P.Fomantis]: ['tmm_fomantis'],
  [P.Lurantis]: ['tmm_fomantis'],
  [P.Sandygast]: ['tmm_sandyghast'],
  [P.Palossand]: ['shoalsalt', 'shoalshell', 'tmm_sandyghast'],
  [P.Bruxish]: ['goldteeth'],
  [P.Komala]: ['tmm_komala'],
  [P.Mudbray]: ['tmm_mudbray'],
  [P.Mudsdale]: ['tmm_mudbray'],
  [P.Salandit]: ['tmm_salandit'],
  [P.Salazzle]: ['tmm_salandit'],
  [P.Mimikyu]: ['pokeshidoll', 'zmimikium', 'tmm_mimikyu'],
  [P.Dhelmise]: ['pearl', 'reliccopper'],
  [P.Jangmo_o]: ['dragonscale', 'tmm_jangmoo'],
  [P.Hakamo_o]: ['dragonscale', 'tmm_jangmoo'],
  [P.Kommo_o]: ['dragonscale', 'zkommonium', 'tmm_jangmoo'],
  [P.Tapu_Koko]: ['ztapunium'],
  [P.Tapu_Lele]: ['ztapunium'],
  [P.Tapu_Bulu]: ['ztapunium'],
  [P.Tapu_Fini]: ['ztapunium'],
  [P.Cosmog]: ['zsolganium', 'zlunalium'],
  [P.Cosmoem]: ['zsolganium', 'zlunalium'],
  [P.Solgaleo]: ['zsolganium'],
  [P.Lunala]: ['zlunalium'],
  [P.Marshadow]: ['zmarshadium'],
  [P.Meltan]: [...Array(5).fill('meltancandy')],
  [P.Melmetal]: [...Array(5).fill('meltancandy')],
  [P.Skwovet]: ['tmm_skwovet'],
  [P.Greedent]: ['tmm_skwovet'],
  [P.Rookidee]: ['tmm_rookidee'],
  [P.Corvisquire]: ['tmm_rookidee'],
  [P.Corviknight]: ['tmm_rookidee', 'gigantamix'],
  [P.Chewtle]: ['tmm_chewtle'],
  [P.Drednaw]: ['tmm_chewtle', 'gigantamix'],
  [P.Silicobra]: ['tmm_silicobra'],
  [P.Sandaconda]: ['tmm_silicobra', 'gigantamix'],
  [P.Rolycoly]: ['tmm_rolycoly', 'charcoal'],
  [P.Carkol]: ['tmm_rolycoly', 'charcoal'],
  [P.Coalossal]: ['tmm_rolycoly', 'charcoal', 'gigantamix'],
  [P.Arrokuda]: ['tmm_arrokuda'],
  [P.Barraskewda]: ['tmm_arrokuda'],
  [P.Applin]: ['tmm_applin', 'sviapple'],
  [P.Flapple]: ['tmm_applin', 'gigantamix'],
  [P.Appletun]: ['tmm_applin', 'gigantamix'],
  [P.Toxel]: ['tmm_toxel'],
  [P.Toxtricity]: ['tmm_toxel', 'throatspray', 'gigantamix'],
  [P.Hatenna]: ['tmm_hatenna'],
  [P.Hattrem]: ['tmm_hatenna'],
  [P.Hatterene]: ['tmm_hatenna', 'gigantamix'],
  [P.Impidimp]: ['tmm_impidimp'],
  [P.Morgrem]: ['tmm_impidimp'],
  [P.Grimmsnarl]: ['tmm_impidimp', 'gigantamix'],
  [P.Sinistea]: ['tmm_sinistea', 'crackedpot'],
  [P.Polteageist]: ['tmm_sinistea'],
  [P.Falinks]: ['tmm_falinks'],
  [P.Pincurchin]: ['tmm_pincurchin'],
  [P.Indeedee]: ['tmm_indeedee'],
  [P.Snom]: ['tmm_snom'],
  [P.Frosmoth]: ['tmm_snom'],
  [P.Eternatus]: ['cometshard', 'wishingpiece', 'gigantamix'],
  [P.Kleavor]: ['tmm_scyther'],
  [P.Wyrdeer]: ['tmm_stantler'],
  [P.Basculegion]: ['tmm_basculin'],
  [P.Ursaluna]: ['teddiursaclaw', 'peatblock'],
  [P.Overqwil]: ['tmm_qwilfish', 'poisonbarb'],
  [P.Lechonk]: ['tmm_lechonk', 'sviham'],
  [P.Oinkologne]: ['tmm_lechonk', 'sviham'],
  [P.Smoliv]: ['svcoliveoil'],
  [P.Dolliv]: ['svcoliveoil'],
  [P.Arboliva]: ['svcoliveoil'],
  [P.Pawmi]: ['tmm_pawmi'],
  [P.Pawmo]: ['tmm_pawmi'],
  [P.Pawmot]: ['tmm_pawmi'],
  [P.Wattrel]: ['tmm_wattrel', 'sviegg'],
  [P.Kilowattrel]: ['tmm_wattrel', 'sviegg'],
  [P.Charcadet]: ['tmm_charcadet'],
  [P.Armarouge]: ['tmm_charcadet'],
  [P.Ceruledge]: ['tmm_charcadet'],
  [P.Greavard]: ['tmm_greavard'],
  [P.Houndstone]: ['tmm_greavard'],
  [P.Orthworm]: ['tmm_orthworm'],
  [P.Tadbulb]: ['tmm_tadbulb'],
  [P.Bellibolt]: ['tmm_tadbulb'],
  [P.Capsakid]: ['tmm_capsakid', 'svcchilisauce'],
  [P.Scovillain]: ['tmm_capsakid', 'svibellpeppergreen', 'svibellpepperred'],
  [P.Klawf]: ['tmm_klawf', 'sviklawfstick'],
  [P.Tinkatink]: ['tmm_tinkatink'],
  [P.Tinkatuff]: ['tmm_tinkatink'],
  [P.Tinkaton]: ['tmm_tinkatink'],
  [P.Nacli]: ['tmm_nacli', 'svcsalt'],
  [P.Naclstack]: ['tmm_nacli', 'svcsalt'],
  [P.Garganacl]: ['tmm_nacli', 'svcsalt'],
  [P.Toedscool]: ['tmm_toedscool', 'tinymushroom'],
  [P.Toedscruel]: ['tmm_toedscool', 'bigmushroom'],
  [P.Tandemaus]: ['tmm_tandemaus'],
  [P.Maushold]: ['tmm_tandemaus'],
  [P.Fidough]: ['tmm_fidough'],
  [P.Dachsbun]: ['tmm_fidough'],
  [P.Wiglett]: ['tmm_wiglett'],
  [P.Wugtrio]: ['tmm_wiglett'],
  [P.Squawkabilly]: ['tmm_squawkabilly'],
  [P.Finizen]: ['tmm_finizen'],
  [P.Palafin]: ['tmm_finizen'],
  [P.Flittle]: ['tmm_flittle'],
  [P.Espathra]: ['tmm_flittle'],
  [P.Veluza]: ['svismokedfillet'],
  [P.Bombirdier]: ['tmm_bombirdier'],
  [P.Tatsugiri]: ['tmm_tatsugiri', 'svirice'],
  [P.Dondozo]: ['tmm_dondozo'],
  [P.Annihilape]: ['tm-Rage Fist', 'punchingglove'],
  [P.Frigibax]: ['tmm_frigibax'],
  [P.Arctibax]: ['tmm_frigibax'],
  [P.Baxcalibur]: ['tmm_frigibax'],
  [P.Gimmighoul]: ['gimmighoulcoin', 'gimmighoulbill'],
  [P.Poltchageist]: ['teacupunremarkable'],
  [P.Dipplin]: ['syrupyapple'],
  [P.Hydrapple]: ['syrupyapple'],
  [P.Archaludon]: ['metalalloy'],
  [P.Terapagos]: ['terastellar'],
  [P.Pecharunt]: ['pecha'],
}
