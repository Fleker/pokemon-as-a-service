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

// Mark species as 4x likely to be shiny
export const BOOSTED_SHINY: BadgeId[] = [
  P.Primeape,
]

export const MONTH_THEME = {
  label: "No-Shave November",
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
  Potw(P.Ariados, {var: 1}),
]

export interface RaidBoss {
  species: BadgeId
  condition?: L.LegendaryQuest
}

// 1-3*
export const regionBoss: {[key in RegionType]: {[rating: number]: RaidBoss[]}} = {
  'North America': {
    1: [{
      species: Potw(P.Blipbug, {var: 1})
    }, {
      species: Potw(P.Throh, {var: 1})
    }],
    2: [{
      species: Potw(P.Dottler, {var: 1})
    }, {
      species: Potw(P.Throh, {var: 1})
    }],
    3: [{
      species: Potw(P.Orbeetle, {var: 1})
    }, {
      species: Potw(P.Throh, {var: 1})
    }]
  },
  'South America': {
    1: [{
      species: Potw(P.Arrokuda, {var: 1})
    }, {
      species: Potw(P.Sawk, {var: 1})
    }],
    2: [{
      species: Potw(P.Arrokuda, {var: 1})
    }, {
      species: Potw(P.Sawk, {var: 1})
    }],
    3: [{
      species: Potw(P.Barraskewda, {var: 1})
    }, {
      species: Potw(P.Sawk, {var: 1})
    }]
  },
  'North Europe': {
    1: [{
      species: Potw(P.Impidimp, {var: 1})
    }, {
      species: Potw(P.Surskit, {var: 3})
    }],
    2: [{
      species: Potw(P.Morgrem, {var: 1})
    }, {
      species: Potw(P.Surskit, {var: 3})
    }],
    3: [{
      species: Potw(P.Grimmsnarl, {var: 1})
    }, {
      species: Potw(P.Masquerain, {var: 3})
    }]
  },
  'Mediterranean': {
    1: [{
      species: Potw(P.Falinks, {var: 1})
    }, {
      species: Potw(P.Luvdisc, {var:3})
    }],
    2: [{
      species: Potw(P.Falinks, {var: 1})
    }, {
      species: Potw(P.Luvdisc, {var:3})
    }],
    3: [{
      species: Potw(P.Falinks, {var: 1})
    }, {
      species: Potw(P.Luvdisc, {var:3})
    }]
  },
  'Africa / Middle East': {
    1: [{
      species: Potw(P.Zigzagoon, {var: 1, form: 'galarian'})
    }, {
      species: Potw(P.Skitty, {var: 1})
    }],
    2: [{
      species: Potw(P.Linoone, {var: 1, form: 'galarian'})
    }, {
      species: Potw(P.Skitty, {var: 1})
    }],
    3: [{
      species: Potw(P.Obstagoon, {var: 1})
    }, {
      species: Potw(P.Delcatty, {var: 1})
    }]
  },
  'Asia': {
    1: [{
      species: Potw(P.Hatenna, {var: 1})
    }, {
      species: Potw(P.Wynaut, {var: 2})
    }],
    2: [{
      species: Potw(P.Hattrem, {var: 1})
    }, {
      species: Potw(P.Wobbuffet, {var: 2})
    }],
    3: [{
      species: Potw(P.Hatterene, {var: 1})
    }, {
      species: Potw(P.Wobbuffet, {var: 2})
    }]
  },
  'Pacific Islands': {
    1: [{
      species: Potw(P.Heatmor, {var: 3})
    }, {
      species: Potw(P.Slowpoke, {var:1, form: 'galarian'})
    }],
    2: [{
      species: Potw(P.Heatmor, {var: 3})
    }, {
      species: Potw(P.Slowpoke, {var:1, form: 'galarian'})
    }],
    3: [{
      species: Potw(P.Heatmor, {var: 3})
    }, {
      species: Potw(P.Slowpoke, {var:1, form: 'galarian'})
    }]
  },
  'Australia / New Zealand': {
    1: [{
      species: Potw(P.Stunfisk, {var: 1, form: 'galarian'})
    }, {
      species: Potw(P.Skiddo, {var: 1})
    }],
    2: [{
      species: Potw(P.Stunfisk, {var: 1, form: 'galarian'})
    }, {
      species: Potw(P.Skiddo, {var: 1})
    }],
    3: [{
      species: Potw(P.Stunfisk, {var: 1, form: 'galarian'})
    }, {
      species: Potw(P.Gogoat, {var: 1})
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


const spindaOfTheMonth = Potw(P.Spinda, {var: 4, form: 'b'})
const pumpkabooForm = Potw(P.Pumpkaboo, {var:4, form: 'small'})
const pikachuForm = Potw(P.Pikachu, {var: 3, form: 'phd'})
const vivillonForm = Potw(P.Vivillon, {var: 1, form: 'sandstorm'})
// Y -> R -> O -> B -> W
const florgesForm = Potw(P.Florges, {var: 3, form: 'yellow'})
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
    species: Potw(P.Grookey, {var: starterBossVar}),
  }, {
    species: Potw(P.Scorbunny, {var: starterBossVar})
  }, {
    species: Potw(P.Sobble, {var: starterBossVar})
  }, {
    species: Potw(P.Clobbopus, {var: 1})
  }, {
    species: Potw(P.Dreepy, {var: 1})
  }, {
    species: Potw(P.Cufant, {var: 1})
  }, {
    species: Potw(P.Skwovet, {var: 2})
  }, {
    species: Potw(P.Nickit, {var: 2})
  }, {
    species: Potw(P.Chewtle, {var: 2})
  }, {
    species: Potw(P.Corsola, {var: 2, form: 'galarian'})
  },
  ],
  /* 2-Star */
  [{
    species: Potw(P.Thwackey, {var: starterBossVar})
  }, {
    species: Potw(P.Raboot, {var: starterBossVar})
  }, {
    species: Potw(P.Drizzile, {var: starterBossVar})
  }, {
    species: Potw(P.Applin, {var: 1}),
  }, {
    species: Potw(P.Diglett, {var: 3, form: 'alolan'}),
  }, {
    species: Potw(P.Sandshrew, {var: 3, form: 'alolan'}),
  }, {
    species: Potw(P.Mareanie, {var: 4}),
  }, {
    species: Potw(P.Magikarp, {var: 4}),
},  {
    species: spindaOfTheMonth
  }, {
    species: pumpkabooForm
  },
  ],
  /* 3-Star */
  [{
    species: Potw(P.Rillaboom, {var: starterBossVar})
  }, {
    species: Potw(P.Cinderace, {var: starterBossVar})
  }, {
    species: Potw(P.Inteleon, {var: starterBossVar})
  }, {
    species: Potw(P.Oricorio, {var: 3, form: 'baile'})
  }, {
    species: Potw(P.Oricorio, {var: 3, form: 'pom_pom'})
  }, {
    species: Potw(P.Oricorio, {var: 3, form: 'pau'})
  }, {
    species: Potw(P.Oricorio, {var: 3, form: 'sensu'})
  }, {
    species: Potw(P.Comfey, {var: 1}),
  }, {
    species: spindaOfTheMonth
  }, {
    species: pikachuForm
  }, // ...fossils3
  ],
  /* 4-Star */
  [{
    species: Potw(P.Swalot, {var: 1}),
  }, {
    species: Potw(P.Perrserker, {var: 2})
  }, {
    species: Potw(P.Alakazam, {var: 4})
  }, {
    species: Potw(P.Primeape, {var:1})
  }, {
    species: Potw(P.Samurott, {var: 1, form: 'hisuian'})
  }, {
    species: Potw(P.Typhlosion, {var:1, form: 'hisuian'})
  }, {
    species: Potw(P.Decidueye, {var: 1, form: 'hisuian'})
  }, {
    species: Potw(P.Kricketune, {var:4}),
  }, {
    species: Potw(P.Stoutland, {var: 3}),
  }, {
    species: vivillonForm
  }],
  /* 5-Star */
  [{
    species: Potw(P.Probopass, {var: 1}),
  }, {
    species: Potw(P.Golem, {var: 3, form: 'alolan'}),
  }, {
    species: Potw(P.Honchkrow, {var: 2}),
  }, {
    species: Potw(P.Weezing, {var: 2, form: 'galarian'}),
  }, {
    species: Potw(P.Mr_Rime, {var: 2}),
  }, {
    species: Potw(P.Articuno, {var: 1, form: 'galarian'}),
  }, {
    species: Potw(P.Zapdos, {var: 1, form: 'galarian'}),
  }, {
    species: Potw(P.Moltres, {var: 1, form: 'galarian'}),
  }, {
    species: florgesForm,
  }, /* {
    species: Potw(P.Mewtwo, {var: 1}),
    condition: {
      hints: [{
        completed: (r) => Events['MEWTWO_BIRTHDAY'].isActive(r as unknown as Users.Doc),
        msg: 'This raid cannot be created today'
      }]
    }
  }, {
    // species: Potw(P.Pikachu, {var: 1, form: 'kantonian'}),
    // condition: {
    //   hints: [{
    //     completed: (r) => Events['POKEMON_DAY'].isActive(r as unknown as Users.Doc),
    //     msg: 'This raid cannot be created today'
    //   }]
    // }
  }, {
    // species: Potw(P.Pikachu, {var: 1, form: 'hoennian'}),
    // condition: {
    //   hints: [{
    //     completed: (r) => Events['POKEMON_DAY'].isActive(r as unknown as Users.Doc),
    //     msg: 'This raid cannot be created today'
    //   }]
    // }
  }, {
    // species: Potw(P.Pikachu, {var: 1, form: 'sinnohian'}),
    // condition: {
    //   hints: [{
    //     completed: (r) => Events['POKEMON_DAY'].isActive(r as unknown as Users.Doc),
    //     msg: 'This raid cannot be created today'
    //   }]
    // }
  }, {
    // species: Potw(P.Pikachu, {var: 1, form: 'unovan'}),
    // condition: {
    //   hints: [{
    //     completed: (r) => Events['POKEMON_DAY'].isActive(r as unknown as Users.Doc),
    //     msg: 'This raid cannot be created today'
    //   }]
    // }
  }, {
    // species: Potw(P.Pikachu, {var: 1, form: 'kalosian'}),
    // condition: {
    //   hints: [{
    //     completed: (r) => Events['POKEMON_DAY'].isActive(r as unknown as Users.Doc),
    //     msg: 'This raid cannot be created today'
    //   }]
    // }
  }, {
    // species: Potw(P.Pikachu, {var: 1, form: 'alolan'}),
    // condition: {
    //   hints: [{
    //     completed: (r) => Events['POKEMON_DAY'].isActive(r as unknown as Users.Doc),
    //     msg: 'This raid cannot be created today'
    //   }]
    // }
  }, {
    // species: Potw(P.Pikachu, {var: 1, form: 'galarian'}),
    // condition: {
    //   hints: [{
    //     completed: (r) => Events['POKEMON_DAY'].isActive(r as unknown as Users.Doc),
    //     msg: 'This raid cannot be created today'
    //   }]
    // }
  },*/],
  /* 6-Star */
  [{
    species: Q.GLOBAL_QUESTS[0].boss,
  }],
  /* 7-Star */
  [...tinyWater, ...hoennEgg, {
    species: Potw(P.Pichu, {var: 2, form: 'spiky'})
  }, {
    species: Potw(P.Poochyena, {var: 2})
  }, {
    species: Potw(P.Lotad, {var: 1})
  }, {
    species: Potw(P.Seedot, {var: 2})
  }],
  /* 8-Star */
  [
    {
      // Mega
      species: Potw(P.Abomasnow, {var: 1})
    },
    {
      species: Potw(P.Kangaskhan, {var: 2})
    },
    {
      // Z-Electric
      // see https://serebii.net/sunmoon/alolapokedex.shtml
      species: Potw(P.Lanturn, {var: 2})
    },
    {
      // Special Z-Move
      species: Potw(P.Raichu, {var: 3, form: 'alolan'})
    },
    {
      // Totem
      // see https://bulbapedia.bulbagarden.net/wiki/Totem_Pok%C3%A9mon
      species: Potw(P.Lurantis, {var: 1, form: 'totem'})
    },
    {
      // GMax
      // see https://bulbapedia.bulbagarden.net/wiki/Gigantamax
      species: Potw(P.Butterfree, {var: 1})
    },
    {
      // Alphas
      // see https://www.serebii.net/legendsarceus/alphapokemon.shtml
      species: Potw(P.Alakazam, {var: 1, form: 'alpha'})
    },
    {
      // Nobles
      // see https://www.serebii.net/legendsarceus/noblepokemon.shtml
      species: Potw(P.Arcanine, {var: 1, form: 'noble'})
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
  }],
  /* 10-Star */
  [{
    species: Potw(P.Mewtwo, {var: 4}),
    condition: {
      hints: [{
        completed: (r) => r.hiddenItemsFound.includes('RDYwoV8ZGOpBSdrp7vUc'),
        msg: 'Complete the Mew quest first.'
      }]
    },
  }, {
    species: Potw(P.Articuno, {var: 1}),
  }, { /* TODO: Add conditions */
    species: Potw(P.Zapdos, {var: 1}),
  }, {
    species: Potw(P.Moltres, {var: 1}),
  }, {
    species: Potw(P.Raikou, {var: 4}),
    condition: {
      hints: [{
        completed: (r) => r.location.forecast === 'Thunderstorm',
        msg: 'Raikou only appears in thunderstorms.'
      }]
    },
  }, {
    species: Potw(P.Entei, {var: 4}),
    condition: {
      hints: [{
        completed: (r) => r.location.forecast === 'Heat Wave',
        msg: 'Entei only appears in heat waves.'
      }]
    },
  }, {
    species: Potw(P.Suicune, {var: 4}),
    condition: {
      hints: [{
        completed: (r) => r.location.forecast === 'Rain',
        msg: 'Suicune only appears in heavy rains.'
      }]
    },
  }, {
    species: Potw(P.Lugia, {var: 4}),
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
    species: Potw(P.Ho_Oh, {var: 4}),
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
    species: Potw(P.Latias, {var: 4}),
    condition: {
      hints: [{
        completed: (r) => r.location.terrain == 'Tropical',
        msg: 'Latias only appears in tropical locations.'
      }]
    },
  }, {
    species: Potw(P.Latios, {var: 4}),
    condition: {
      hints: [{
        completed: (r) => r.location.terrain == 'Tropical',
        msg: 'Latios only appears in tropical locations.'
      }]
    },
  }, {
    species: Potw(P.Kyogre, {var: 4}),
    condition: {
      hints: [{
        completed: (r) => r.location.forecast === 'Rain',
        msg: 'Kyogre only appears in the midst of a torrential downpour.'
      }]
    },
  }, {
    species: Potw(P.Groudon, {var: 4}),
    condition: {
      hints: [{
        completed: (r) => r.location.forecast === 'Heat Wave',
        msg: 'Groudon only appears when the sun is intense.'
      }]
    },
  }, {
    species: Potw(P.Rayquaza, {var: 3}),
    condition: {
      hints: [{
        completed: (r) => r.location.forecast === 'Windy',
        msg: 'Rayquaza only comes down during strong winds.'
      }]
    },
  }, {
    species: Potw(P.Heatran, {var: 4}),
    condition: {
      hints: [{
        completed: (r) => r.location.forecast === 'Heat Wave',
        msg: 'Heatran only appears in areas of extreme heat.'
      }]
    }
  }, {
    species: Potw(P.Regigigas, {var: 4}),
    condition: {
      hints: [{
        completed: L.simpleRequirePotwArr([P.Regirock, P.Regice, P.Registeel]),
        msg: 'Regigigas only appears when you have the three primary golems.'
      }]
    }
  }, {
    species: Potw(P.Phione, {var: 4}),
    condition: {
      hints: [{
        completed: (r) => getTidesByLocation(r.location) === 'High Tide',
        msg: 'Phione only appears during high tides.'
      }]
    }
  }, {
    species: Potw(P.Cresselia, {var: 4}),
    condition: {
      hints: [{
        completed: () => getMoonPhase().includes('Crescent'),
        msg: 'Cresselia only appears during the crescent moon.'
      }]
    }
  }, {
    species: Potw(P.Darkrai, {var: 3}),
    condition: {
      hints: [{
        completed: (r) => getMoonPhase().includes('New Moon') && timeOfDay(r.location) === 'Night' && r.hiddenItemsFound.includes('PdRaCqqYpkh12XD6dQn1'),
        msg: 'Darkrai only appears in pitch dark.'
      }]
    }
  }, {
    species: Potw(P.Dialga, {var: 4}),
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
    species: Potw(P.Palkia, {var: 4}),
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
    species: Potw(P.Regice, {var: 4}),
    condition: {
      hints: [{
        completed: (r) => r.location.regice === true,
        msg: 'Regice only appears in one location a day.'
      }]
    },
  }, {
    species: Potw(P.Regirock, {var: 4}),
    condition: {
      hints: [{
        completed: (r) => r.location.regirock === true,
        msg: 'Regirock only appears in one location a day.'
      }]
    },
  }, {
    species: Potw(P.Registeel, {var: 4}),
    condition: {
      hints: [{
        completed: (r) => r.location.registeel === true,
        msg: 'Registeel only appears in one location a day.'
      }]
    },
  }, {
    species: Potw(P.Azelf, {var: 4}),
    condition: {
      hints: [{
        completed: (r) => r.location.terrain == 'Bay',
        msg: 'Azelf only appears in the bay.'
      }]
    },
  }, {
    species: Potw(P.Mesprit, {var: 4}),
    condition: {
      hints: [{
        completed: (r) => r.location.terrain == 'Bay',
        msg: 'Mesprit only appears in the bay.'
      }]
    },
  }, {
    species: Potw(P.Uxie, {var: 4}),
    condition: {
      hints: [{
        completed: (r) => r.location.terrain == 'Bay',
        msg: 'Uxie only appears in the bay.'
      }]
    },
  }, {
    species: Potw(P.Giratina, {var: 4}),
    condition: {
      hints: [{
        completed: (r) => r.location.terrain == 'Mountain' && timeOfDay(r.location) === 'Night',
        msg: 'Giratina only appears in mountains at night.'
      }]
    },
  }, {
    species: Potw(P.Thundurus, {var: 3}),
    condition: {
      hints: [{
        completed: (r) => r.location.forecast === 'Windy',
        msg: 'Thundurus only appears in windy locations.'
      }]
    },
  }, {
    species: Potw(P.Tornadus, {var: 3}),
    condition: {
      hints: [{
        completed: (r) => r.location.forecast === 'Windy',
        msg: 'Tornadus only appears in windy locations.'
      }]
    },
  }, {
    species: Potw(P.Landorus, {var: 3}),
    condition: {
      hints: [{
        completed: (r) => r.location.forecast === 'Windy',
        msg: 'Landorus only appears in windy locations.'
      }]
    },
  }, {
    species: Potw(P.Virizion, {var: 3}),
    condition: {
      hints: [{
        completed: (r) => r.location.terrain === 'Forest',
        msg: 'Virizion only appears in forest locations.'
      }]
    },
  }, {
    species: Potw(P.Terrakion, {var: 3}),
    condition: {
      hints: [{
        completed: (r) => r.location.terrain === 'Rural',
        msg: 'Terrakion only appears in rural locations.'
      }]
    },
  }, {
    species: Potw(P.Cobalion, {var: 3}),
    condition: {
      hints: [{
        completed: (r) => r.location.terrain === 'Mountain',
        msg: 'Cobalion only appears in mountainous locations.'
      }]
    },
  }, {
    species: Potw(P.Zekrom, {var: 3}),
    condition: {
      hints: [{
        completed: (r) => r.location.forecast === 'Thunderstorm',
        msg: 'Zekrom only appears during thunderstorms.'
      }]
    },
  }, {
    species: Potw(P.Reshiram, {var: 3}),
    condition: {
      hints: [{
        completed: (r) => r.location.forecast === 'Heat Wave',
        msg: 'Reshiram only appears during heat waves.'
      }]
    },
  }, {
    species: Potw(P.Kyurem, {var: 3}),
    condition: {
      hints: [{
        completed: L.requireItem(['dnasplicerblack', 'dnasplicerwhite']),
        msg: 'Kyurem will not appear until you have obtained DNA splicers.'
      }]
    },
  }, {
    species: Potw(P.Xerneas, {var: 2}),
    condition: {
      hints: [{
        completed: (r) => r.items.zygardecube !== undefined && r.items.zygardecube > 0,
        msg: 'Requires the Zygarde Cube.'
      }]
    },
  }, {
    species: Potw(P.Yveltal, {var: 2}),
    condition: {
      hints: [{
        completed: (r) => r.items.zygardecube !== undefined && r.items.zygardecube > 0,
        msg: 'Requires the Zygarde Cube.'
      }]
    },
  }, {
    species: Potw(P.Zygarde, {var: 2, form: 'ten'}),
    condition: {
      hints: [{
        completed: (r) => r.items.zygardecube !== undefined && r.items.zygardecube > 0,
        msg: 'Requires the Zygarde Cube.'
      }]
    },
  }, {
    species: Potw(P.Tapu_Koko, {var: 2}),
    condition: {
      hints: [{
        completed: (r) => r.location.terrain === 'Tropical',
        msg: 'Tapu Koko only appears in tropical locations.'
      }]
    },
  }, {
    species: Potw(P.Tapu_Bulu, {var: 2}),
    condition: {
      hints: [{
        completed: (r) => r.location.terrain === 'Tropical',
        msg: 'Tapu Bulu only appears in tropical locations.'
      }]
    },
  }, {
    species: Potw(P.Tapu_Fini, {var: 2}),
    condition: {
      hints: [{
        completed: (r) => r.location.terrain === 'Tropical',
        msg: 'Tapu Fini only appears in tropical locations.'
      }]
    },
  }, {
    species: Potw(P.Tapu_Lele, {var: 2}),
    condition: {
      hints: [{
        completed: (r) => r.location.terrain === 'Tropical',
        msg: 'Tapu Lele only appears in tropical locations.'
      }]
    },
  }, {
    species: Potw(P.Nihilego, {var: 3}),
    condition: {
      hints: [{
        completed: (r) => r.hiddenItemsFound.includes(L.CATCH_CHARM_SM),
        msg: 'You must prove your catching skills in Alola before you will be allowed to join this raid.'
      }]
    },
  }, {
    species: Potw(P.Buzzwole, {var: 3}),
    condition: {
      hints: [{
        completed: (r) => r.hiddenItemsFound.includes(L.CATCH_CHARM_SM),
        msg: 'You must prove your catching skills in Alola before you will be allowed to join this raid.'
      }]
    },
  }, {
    species: Potw(P.Pheromosa, {var: 3}),
    condition: {
      hints: [{
        completed: (r) => r.hiddenItemsFound.includes(L.CATCH_CHARM_SM),
        msg: 'You must prove your catching skills in Alola before you will be allowed to join this raid.'
      }]
    },
  }, {
    species: Potw(P.Xurkitree, {var: 3}),
    condition: {
      hints: [{
        completed: (r) => r.hiddenItemsFound.includes(L.CATCH_CHARM_SM),
        msg: 'You must prove your catching skills in Alola before you will be allowed to join this raid.'
      }]
    },
  }, {
    species: Potw(P.Celesteela, {var: 3}),
    condition: {
      hints: [{
        completed: (r) => r.hiddenItemsFound.includes(L.CATCH_CHARM_SM),
        msg: 'You must prove your catching skills in Alola before you will be allowed to join this raid.'
      }]
    },
  }, {
    species: Potw(P.Kartana, {var: 3}),
    condition: {
      hints: [{
        completed: (r) => r.hiddenItemsFound.includes(L.CATCH_CHARM_SM),
        msg: 'You must prove your catching skills in Alola before you will be allowed to join this raid.'
      }]
    },
  }, {
    species: Potw(P.Guzzlord, {var: 3}),
    condition: {
      hints: [{
        completed: (r) => r.hiddenItemsFound.includes(L.CATCH_CHARM_SM),
        msg: 'You must prove your catching skills in Alola before you will be allowed to join this raid.'
      }]
    },
  }, {
    species: Potw(P.Blacephalon, {var: 3}),
    condition: {
      hints: [{
        completed: L.requireItem('zultranecrozium'),
        msg: "Obtain Necrozma's Z-Crystal."
      }]
    },
  }, {
    species: Potw(P.Stakataka, {var: 3}),
    condition: {
      hints: [{
        completed: L.requireItem('zultranecrozium'),
        msg: "Obtain Necrozma's Z-Crystal."
      }]
    },
  }, {
    species: Potw(P.Poipole, {var: 3}),
    condition: {
      hints: [{
        completed: L.requireItem('zultranecrozium'),
        msg: "Obtain Necrozma's Z-Crystal."
      }]
    },
  }, {
    species: Potw(P.Cosmog, {var: 2}),
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
    species: Potw(P.Necrozma, {var: 1}),
    condition: {
      hints: [{
        completed: L.requireItem('zultranecrozium'),
        msg: "Obtain Necrozma's Z-Crystal."
      }]
    },
  }, {
    species: Potw(P.Meltan, {var: 1}),
    condition: {
      hints: [{
        completed: L.requireItem('meltanbox'),
        msg: "Meltan will only appear if attracted by a mysterious box."
      }]
    },
  }, {
    species: Potw(P.Eternatus, {var: 1}),
    condition: {
      hints: [{
        completed: L.requireItem('rustedsword'),
        msg: "Meltan will only appear if drawn by the Rusted Sword."
      }]
    },
  }, {
    species: Potw(P.Regieleki, {var: 1}),
    condition: {
      hints: [{
        completed: L.simpleRequirePotwArr([P.Regirock, P.Regice, P.Registeel, P.Regieleki, P.Regidrago]),
        msg: 'Regieleki only appears when you have all the golems.'
      }]
    }
  }, {
    species: Potw(P.Regidrago, {var: 1}),
    condition: {
      hints: [{
        completed: L.simpleRequirePotwArr([P.Regirock, P.Regice, P.Registeel, P.Regieleki, P.Regidrago]),
        msg: 'Regidrago only appears when you have all the golems.'
      }]
    }
  }, {
    species: Potw(P.Enamorus, {var: 1}),
    condition: {
      hints: [{
        completed: L.requireItem('legendplate'),
        msg: 'Enamorus will only appear when the player has the plate of legends.'
      }]
    }
  }, ],
]

// 1-2*
export const timeBoss: {'Day': {[rating: number]: RaidBoss[]}, 'Night': {[rating: number]: RaidBoss[]}} = {
  'Day': {
    1: [{
      species: Potw(P.Rattata, {var: 3})
    }],
    2: [{
      species: Potw(P.Rattata, {var: 3})
    }]
  },
  'Night': {
    1: [{
      species: Potw(P.Rattata, {var: 3, form: 'alolan'})
    }],
    2: [{
      species: Potw(P.Rattata, {var: 3, form: 'alolan'})
    }]
  }
}

// 3-4*
export const forecastBoss: {[key in WeatherType]: {[rating: number]: RaidBoss[]}} = {
  Cloudy: {
    3: [{
     species: Potw(P.Shuppet, {var: 4}),
    }, {
     species: Potw(P.Zorua, {var: 1, form: 'hisuian'}),
    }],
    4: [{
      species: Potw(P.Zoroark, {var: 1, form: 'hisuian'})
    }, {
      species: Potw(P.Banette, {var: 4})
    }]
  },
  Fog: {
    3: [{
     species: Potw(P.Indeedee, {var: 1}), 
    }, {
     species: Potw(P.Sableye, {var: 1})
    }],
    4: [{
      species: Potw(P.Indeedee, {var: 1})
    }, {
      species: Potw(P.Sableye, {var: 1})
    }]
  },
  'Heat Wave': {
    3: [{
      species: Potw(P.Carkol, {var: 1})
    }, {
      species: Potw(P.Litleo, {var: 1})
    }],
    4: [{
      species: Potw(P.Coalossal, {var:1})
    }, {
      species: Potw(P.Pyroar, {var: 1})
    }]
  },
  Rain: {
    3: [{
      species: Potw(P.Sinistea, {var: 1})
    }, {
      species: Potw(P.Qwilfish, {var: 4})
    }],
    4: [{
      species: Potw(P.Sinistea, {var: 1})
    }, {
      species: Potw(P.Qwilfish, {var: 4})
    }]
  },
  Sandstorm: {
    3: [{
      species: Potw(P.Silicobra, {var: 1})
    }, {
      species: Potw(P.Sigilyph, {var: 2})
    }],
    4: [{
      species: Potw(P.Sandaconda, {var: 1})
    }, {
      species: Potw(P.Sigilyph, {var: 2})
    }],
  },
  'Diamond Dust': {
    3: [{
      species: Potw(P.Snom, {var: 1}),
    }, {
      species: Potw(P.Vanillish, {var: 4})
    }],
    4: [{
      species: Potw(P.Snom, {var: 1}),
    }, {
      species: Potw(P.Vanilluxe, {var: 4})
    }],
  },
  Snow: {
    3: [{
      species: Potw(P.Snom, {var: 1}),
    }, {
      species: Potw(P.Vanillish, {var: 3})
    }],
    4: [{
      species: Potw(P.Snom, {var: 1}),
    }, {
      species: Potw(P.Vanilluxe, {var: 3})
    }],
  },
  Thunderstorm: {
    3: [{
      species: Potw(P.Pincurchin, {var: 1}),
    }, {
      species: Potw(P.Chinchou, {var: 1})
    }],
    4: [{
      species: Potw(P.Pincurchin, {var: 1})
    }, {
      species: Potw(P.Lanturn, {var: 1})
    }]
  },
  Sunny: {
    3: [{
      species: Potw(P.Yamper, {var: 1})
    }, {
      species: Potw(P.Doduo, {var: 1})
    }],
    4: [{
      species: Potw(P.Boltund, {var: 1})
    }, {
      species: Potw(P.Dodrio, {var: 1})
    }]
  },
  Windy: {
    3: [{
      species: Potw(P.Rufflet, {var: 1})
    }, {
      species: Potw(P.Pidgeotto, {var: 3})
    }],
    4: [{
      species: Potw(P.Braviary, {var: 1, form: 'hisuian'})
    }, {
      species: Potw(P.Pidgeot, {var: 3})
    }]
  },
}

// 2-4*
export const terrainBoss: {[key in TerrainType]: {[rating: number]: RaidBoss[]}} = {
  Bay: {
    2: [{
      species: Potw(P.Feebas, {var: 1})
    }, {
      species: Potw(P.Bruxish, {var: 4})
    }],
    3: [{
      species: Potw(P.Feebas, {var: 1})
    }, {
      species: Potw(P.Bruxish, {var: 4})
    }],
    4: [{
      species: Potw(P.Milotic, {var: 1})
    }, {
      species: Potw(P.Bruxish, {var: 4})
    }]
  },
  Beach: {
    2: [{
      species: Potw(P.Sandygast, {var: 4})
    }, {
      species: Potw(P.Shellder, {var: 4})
    }],
    3: [{
      species: Potw(P.Sandygast, {var: 4})
    }, {
      species: Potw(P.Shellder, {var: 4})
    }],
    4: [{
      species: Potw(P.Palossand, {var: 4})
    }, {
      species: Potw(P.Cloyster, {var: 4})
    }]
  },
  Mountain: {
    2: [{
      species: Potw(P.Carbink, {var: 2})
    }, {
      species: Potw(P.Togedemaru, {var: 4})
    }],
    3: [{
      species: Potw(P.Carbink, {var: 2})
    }, {
      species: Potw(P.Togedemaru, {var: 4})
    }],
    4: [{
      species: Potw(P.Carbink, {var: 2})
    }, {
      species: Potw(P.Togedemaru, {var: 4})
    }],
  },
  Tropical: {
    2: [{
      species: Potw(P.Crabrawler, {var: 4})
    }, {
      species: Potw(P.Alomomola, {var: 2})
    }],
    3: [{
      species: Potw(P.Crabrawler, {var: 4})
    }, {
      species: Potw(P.Alomomola, {var: 2})
    }],
    4: [{
      species: Potw(P.Crabominable, {var: 4})
    }, {
      species: Potw(P.Alomomola, {var: 2})
    }],
  },
  Rural: {
    2: [{
      species: Potw(P.Vullaby, {var: 4})
    }, {
      species: Potw(P.Yungoos, {var: 4})
    }],
    3: [{
      species: Potw(P.Vullaby, {var: 4})
    }, {
      species: Potw(P.Yungoos, {var: 4})
    }],
    4: [{
      species: Potw(P.Mandibuzz, {var: 4})
    }, {
      species: Potw(P.Gumshoos, {var: 4})
    }],
  },
  Desert: {
    2: [{
      species: Potw(P.Mudbray, {var: 4})
    }, {
      species: Potw(P.Numel, {var: 1})
    }],
    3: [{
      species: Potw(P.Mudbray, {var: 4})
    }, {
      species: Potw(P.Numel, {var: 1})
    }],
    4: [{
      species: Potw(P.Mudsdale, {var: 4})
    }, {
      species: Potw(P.Camerupt, {var: 1})
    }],
  },
  Grasslands: {
    2: [{
      species: Potw(P.Stufful, {var: 4})
    }, {
      species: Potw(P.Slakoth, {var: 2})
    }],
    3: [{
      species: Potw(P.Stufful, {var: 4})
    }, {
      species: Potw(P.Vigoroth, {var: 2})
    }],
    4: [{
      species: Potw(P.Bewear, {var: 4})
    }, {
      species: Potw(P.Slaking, {var: 2})
    }],
  },
  Gardens: {
    2: [{
      species: Potw(P.Aipom, {var: 4})
    }, {
      species: Potw(P.Bounsweet, {var: 4})
    }],
    3: [{
      species: Potw(P.Aipom, {var: 4})
    }, {
      species: Potw(P.Steenee, {var: 4})
    }],
    4: [{
      species: Potw(P.Ambipom, {var: 4})
    }, {
      species: Potw(P.Tsareena, {var: 4})
    }]
  },
  Forest: {
    2: [{
      species: Potw(P.Dewpider, {var: 4})
    }, {
      species: Potw(P.Deerling, {var: 1, form: 'autumn'})
    }],
    3: [{
      species: Potw(P.Dewpider, {var: 4})
    }, {
      species: Potw(P.Deerling, {var: 1, form: 'autumn'})
    }],
    4: [{
      species: Potw(P.Araquanid, {var: 4})
    }, {
      species: Potw(P.Sawsbuck, {var: 1, form: 'autumn'})
    }],
  },
  Urban: {
    2: [{
      species: Potw(P.Toxel, {var: 1})
    }, {
      species: Potw(P.Jigglypuff, {var: 3})
    }],
    3: [{
      species: Potw(P.Toxel, {var: 1})
    }, {
      species: Potw(P.Jigglypuff, {var:3})
    }],
    4: [{
      species: Potw(P.Toxtricity, {var: 1})
    }, {
      species: Potw(P.Wigglytuff, {var: 3})
    }]
  },
  Rainforest: {
    2: [{
      species: Potw(P.Komala, {var: 4})
    }, {
      species: Potw(P.Farfetchd, {var: 3})
    }],
    3: [{
      species: Potw(P.Komala, {var: 4})
    }, {
      species: Potw(P.Farfetchd, {var: 3})
    }],
    4: [{
      species: Potw(P.Komala, {var: 4})
    }, {
      species: Potw(P.Farfetchd, {var: 3})
    }],
  },
  Oceanic: {
    2: [{
      species: Potw(P.Dhelmise, {var: 4})
    }, {
      species: Potw(P.Basculin, {var: 1, form: 'white_stripe', gender: 'female'})
    }],
    3: [{
      species: Potw(P.Dhelmise, {var: 4})
    }, {
      species: Potw(P.Basculin, {var: 1, form: 'white_stripe', gender: 'female'})
    }],
    4: [{
      species: Potw(P.Dhelmise, {var: 4})
    }, {
      species: Potw(P.Basculin, {var: 1, form: 'white_stripe', gender: 'female'})
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


/** By default the boss holds a Lum Berry, else will have this item. */
export const bossHeldItem: Partial<Record<BadgeId, ItemId>> = {
  [Potw(P.Venusaur, {var: 1})]: 'venusaurite',
  [Potw(P.Venusaur, {var: 2})]: 'maxmushroom',
  [Potw(P.Charizard, {var: 1})]: 'charizarditex',
  [Potw(P.Charizard, {var: 2})]: 'maxmushroom',
  [Potw(P.Blastoise, {var: 1})]: 'blastoiseite',
  [Potw(P.Blastoise, {var: 2})]: 'maxmushroom',
  [Potw(P.Butterfree, {var: 3})]: 'zbugium',
  [Potw(P.Beedrill, {var: 1})]: 'beedrillite',
  [Potw(P.Pidgeot, {var: 2})]: 'pidgeotite',
  [Potw(P.Fearow, {var: 1})]: 'zflyinium',
  [Potw(P.Pikachu, {var: 3})]: 'zpikanium',
  [Potw(P.Arcanine, {var: 3})]: 'zfirium',
  [Potw(P.Alakazam, {var: 1})]: 'alakazamite',
  [Potw(P.Machamp, {var: 1})]: 'maxmushroom',
  [Potw(P.Machamp, {var: 3})]: 'zfightium',
  [Potw(P.Slowbro, {var: 4})]: 'slowbroite',
  [Potw(P.Gengar, {var: 1})]: 'gengarite',
  [Potw(P.Gengar, {var: 4})]: 'maxmushroom',
  [Potw(P.Hypno, {var: 1})]: 'zpsychicium',
  [Potw(P.Kingler, {var: 1})]: 'maxmushroom',
  [Potw(P.Kangaskhan, {var: 3})]: 'kangaskhanite',
  [Potw(P.Pinsir, {var: 1})]: 'pinsirite',
  [Potw(P.Pinsir, {var: 4})]: 'pinsirite',
  [Potw(P.Gyarados, {var: 3})]: 'gyaradosite',
  [Potw(P.Lapras, {var: 1})]: 'maxmushroom',
  [Potw(P.Eevee, {var: 1})]: 'zeevium',
  [Potw(P.Aerodactyl, {var: 1})]: 'aerodactylite',
  [Potw(P.Snorlax, {var: 2})]: 'zsnorlaium',
  [Potw(P.Ampharos, {var: 1})]: 'ampharosite',
  [Potw(P.Sudowoodo, {var: 1})]: 'zrockium',
  [Potw(P.Steelix, {var: 1})]: 'steelixite',
  [Potw(P.Scizor, {var: 2})]: 'scizorite',
  [Potw(P.Heracross, {var: 1})]: 'heracrossite',
  [Potw(P.Heracross, {var: 4})]: 'heracrossite',
  [Potw(P.Houndoom, {var: 2})]: 'houndoomite',
  [Potw(P.Tyranitar, {var: 3})]: 'tyranitarite',
  [Potw(P.Sceptile, {var: 3})]: 'sceptileite',
  [Potw(P.Blaziken, {var: 3})]: 'blazikenite',
  [Potw(P.Swampert, {var: 3})]: 'swampertite',
  [Potw(P.Gardevoir, {var: 1})]: 'gardevoirite',
  [Potw(P.Sableye, {var: 1})]: 'sableyeite',
  [Potw(P.Medicham, {var: 3})]: 'medichamite',
  [Potw(P.Aggron, {var: 1})]: 'aggronite',
  [Potw(P.Mawile, {var: 1})]: 'mawileite',
  [Potw(P.Manectric, {var: 1})]: 'manectricite',
  [Potw(P.Sharpedo, {var: 3})]: 'sharpedoite',
  [Potw(P.Camerupt, {var: 3})]: 'cameruptite',
  [Potw(P.Altaria, {var: 1})]: 'altariaite',
  [Potw(P.Banette, {var: 1})]: 'banetteite',
  [Potw(P.Absol, {var: 4})]: 'absolite',
  [Potw(P.Glalie, {var: 1})]: 'glalieite',
  [Potw(P.Salamence, {var: 2})]: 'salamencite',
  [Potw(P.Metagross, {var: 1})]: 'metagrossite',
  [Potw(P.Latias, {var: 2})]: 'latiasite',
  [Potw(P.Latios, {var: 2})]: 'latiosite',
  [Potw(P.Lopunny, {var: 2})]: 'lopunnyite',
  [Potw(P.Lucario, {var: 4})]: 'lucarioite',
  [Potw(P.Garchomp, {var: 3})]: 'garchompite',
  [Potw(P.Abomasnow, {var: 3})]: 'abomasnowite',
  [Potw(P.Gallade, {var: 3})]: 'galladeite',
  [Potw(P.Stoutland, {var: 1})]: 'znormalium',
  [Potw(P.Audino, {var: 2})]: 'audinoite',
  [Potw(P.Garchomp, {var: 4})]: 'maxmushroom',
  [Potw(P.Diancie, {var: 1})]: 'diancieite',
  [Potw(P.Decidueye, {var: 1})]: 'zdecidium',
  [Potw(P.Incineroar, {var: 1})]: 'zincinium',
  [Potw(P.Primarina, {var: 1})]: 'zprimarium',
  [Potw(P.Lycanroc, {var: 4})]: 'zlycanium',
  [Potw(P.Mimikyu, {var: 4})]: 'zmimikyum',
  [Potw(P.Kommo_o, {var: 1})]: 'zkommonium',
  [Potw(P.Eternatus, {var: 1})]: 'beserkgene',
}

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
  [P.Graveler]: ['pewtercrunchies', 'passho', 'rindo'],
  [P.Golem]: ['pewtercrunchies', 'passho', 'rindo'],
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
  [P.Rhydon]: ['protector', 'passho', 'rindo'],
  [P.Chansey]: ['tmm_happiny', 'luckypunch'],
  [P.Tangela]: ['tm-Ancient Power'],
  [P.Kangaskhan]: ['kangaskhanite'],
  [P.Starmie]: ['starpiece'],
  [P.Mr_Mime]: ['oddincense'],
  [P.Scyther]: ['charti', 'tmm_scyther'],
  [P.Electabuzz]: ['electirizer'],
  [P.Magmar]: ['magmarizer'],
  [P.Pinsir]: ['pinsirite'],
  [P.Tauros]: ['tmm_tauros'],
  [P.Magikarp]: ['tmm_magikarp'],
  [P.Gyarados]: ['ragecandybar', 'gyaradosite', 'tmm_magikarp'],
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
  [P.Murkrow]: ['duskstone'],
  [P.Misdreavus]: ['duskstone'],
  [P.Slowking]: ['kingsrock', 'tmm_slowpoke', 'galaricatwig'],
  [P.Pineco]: ['tmm_pineco'],
  [P.Forretress]: ['occa', 'tmm_pineco'],
  [P.Gligar]: ['yache'],
  [P.Steelix]: ['metalcoat', 'steelixite'],
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
  [P.Kingdra]: ['haban'],
  [P.Phanpy]: ['tmm_phanpy'],
  [P.Donphan]: ['tmm_phanpy'],
  [P.Porygon2]: ['dubiousdisc'],
  [P.Stantler]: ['tmm_stantler'],
  [P.Hitmontop]: ['carbos'],
  [P.Smeargle]: ['ragecandybar'],
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
  [P.Tropius]: ['yache', 'tmm_tropius'],
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
  [P.Bastiodon]: ['chople', 'shuca'],
  [P.Kricketune]: ['metronome'],
  [P.Cherubi]: ['cheri'],
  [P.Cherrim]: ['cheri'],
  [P.Shellos]: ['tmm_shellos'],
  [P.Gastrodon]: ['tmm_shellos'],
  [P.Buizel]: ['tmm_buizel'],
  [P.Floatzel]: ['tmm_buizel'],
  [P.Pachirisu]: ['tmm_pachirisu'],
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
  [P.Electivire]: ['electirizer'],
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
  [P.Pawniard]: ['chople'],
  [P.Bisharp]: ['chople'],
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
  [P.Aegislash]: ['gengarite'],
  [P.Dedenne]: ['tmm_dedenne'],
  [P.Klefki]: ['tmm_klefki'],
  [P.Goomy]: ['tmm_goomy'],
  [P.Sliggoo]: ['tmm_goomy'],
  [P.Goodra]: ['tmm_goomy'],
  [P.Diancie]: ['diancieite'],
  [P.Noibat]: ['tmm_noibat'],
  [P.Noivern]: ['tmm_noibat'],
  [P.Decidueye]: ['zdecidium'],
  [P.Incineroar]: ['zincinium'],
  [P.Primarina]: ['zprimarium'],
  [P.Charjabug]: ['cellbattery'],
  [P.Ribombee]: ['honey'],
  [P.Crabrawler]: ['tmm_crabrawler'],
  [P.Crabominable]: ['tmm_crabrawler', 'icestone'],
  [P.Rockruff]: ['tmm_rockruff'],
  [P.Lycanroc]: ['tmm_rockruff', 'zlycanium'],
  [P.Oricorio]: ['rednectar', 'yellownectar', 'purplenectar', 'pinknectar', 'tmm_oricorio'],
  [P.Shiinotic]: ['luminousmoss'],
  [P.Minior]: ['cometshard'],
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
  [P.Applin]: ['tmm_applin'],
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
  [P.Polteageist]: ['tmm_sinistea', 'crackedpot'],
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
  [P.Pawmi]: ['tmm_pawmi'],
  [P.Pawmo]: ['tmm_pawmi'],
  [P.Pawmot]: ['tmm_pawmi'],
  [P.Wattrel]: ['tmm_wattrel'],
  [P.Kilowattrel]: ['tmm_wattrel'],
  [P.Charcadet]: ['tmm_charcadet'],
  [P.Armarouge]: ['tmm_charcadet'],
  [P.Ceruledge]: ['tmm_charcadet'],
  [P.Greavard]: ['tmm_greavard'],
  [P.Houndstone]: ['tmm_greavard'],
  [P.Orthworm]: ['tmm_orthworm'],
  [P.Tadbulb]: ['tmm_tadbulb'],
  [P.Bellibolt]: ['tmm_tadbulb'],
  [P.Capsakid]: ['tmm_capsakid'],
  [P.Scovillain]: ['tmm_capsakid'],
  [P.Klawf]: ['tmm_klawf', 'sviklawfstick'],
  [P.Tinkatink]: ['tmm_tinkatink'],
  [P.Tinkatuff]: ['tmm_tinkatink'],
  [P.Tinkaton]: ['tmm_tinkatink'],
  [P.Nacli]: ['tmm_nacli', 'svcsalt'],
  [P.Naclstack]: ['tmm_nacli', 'svcsalt'],
  [P.Garganacl]: ['tmm_nacli', 'svcsalt'],
  [P.Toedscool]: ['tmm_toedscool'],
  [P.Toedscruel]: ['tmm_toedscool'],
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
  [P.Annihilape]: ['tm-Rage Fist'],
  [P.Frigibax]: ['tmm_frigibax'],
  [P.Arctibax]: ['tmm_frigibax'],
  [P.Baxcalibur]: ['tmm_frigibax'],
  [P.Poltchageist]: ['teacupunremarkable'],
}
