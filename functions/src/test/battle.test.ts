import test from 'ava'
import {criticalHit, SpeedAlignedAction, byPriority, bySpeed, getCasterTurnMove, BattleOptions, attack, turn, execute} from '../../../shared/src/battle/battle-controller'
import {typeMultiplier} from '../../../shared/src/battle/typeMultiplier'
import { Movepool, BUFF_STAT } from '../../../shared/src/battle/movepool';
import { Inventory } from '../../../shared/src/battle/inventory';
import { AbilityDex } from '../../../shared/src/battle/ability';
import { Pokemon, Field, MoveInput, Log } from '../../../shared/src/battle/types'
import { getCondition, removeCondition } from '../../../shared/src/battle/conditions';
import { Weathers } from '../../../shared/src/battle/weather';
import { ConditionMap } from '../../../shared/src/battle/status';
import { Badge } from '../../../shared/src/badge3';
import { Globe } from '../../../shared/src/locations-list';
import { Rules } from '../../../shared/src/battle-tiers';
import { maxMovePower } from '../../../shared/src/dynamax';

// const moveSelection = Natures.moveSelection.Hardy

const MAGIKARP: Pokemon = {
  species: 'Magikarp',
  badge: Badge.fromLegacy('potw-129'),
  pokedex: '', moveTMs: [],
  currentHp: 100,
  totalHp: 100,
  move: ['Splash'],
  movepool: [Movepool.Splash],
  fainted: false,
  type1: 'Water',
  hp: 1,
  attack: 1,
  defense: 100,
  spAttack: 1,
  spDefense: 1,
  speed: 1,
  shiny: 'FALSE',
  heldItemConsumed: false,
  heldItemTotallyConsumed: false,
  statBuffs: {
    attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0,
    accuracy: 0, evasiveness: 0, criticalHit: 0,
  },
  weight: 1, eggCycles: -1,
  conditions: [ConditionMap.OnField],
}

const GOLEM: Pokemon = {
  species: 'Golem',
  badge: Badge.fromLegacy('potw-076'),
  pokedex: '', moveTMs: [],
  currentHp: 100,
  totalHp: 100,
  move: ['Tackle'],
  movepool: [Movepool.Splash],
  fainted: false,
  type1: 'Rock',
  type2: 'Ground',
  hp: 1,
  attack: 1,
  defense: 1,
  spAttack: 1,
  spDefense: 1,
  speed: 2,
  shiny: 'FALSE',
  heldItemConsumed: false,
  heldItemTotallyConsumed: false,
  statBuffs: {
    attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0,
    accuracy: 0, evasiveness: 0, criticalHit: 0,
  },
  weight: 1, eggCycles: -1,
  conditions: [ConditionMap.OnField],
}

const ELECTRODE: Pokemon = {
  species: 'Electrode',
  badge: Badge.fromLegacy('potw-101'),
  pokedex: '', moveTMs: [],
  currentHp: 100,
  totalHp: 100,
  move: ['Tackle'],
  movepool: [Movepool.Tackle],
  fainted: false,
  type1: 'Electric',
  hp: 1,
  attack: 1,
  defense: 1,
  spAttack: 1,
  spDefense: 1,
  speed: 25,
  shiny: 'FALSE',
  heldItemConsumed: false,
  heldItemTotallyConsumed: false,
  statBuffs: {
    attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0,
    accuracy: 0, evasiveness: 0, criticalHit: 0,
  },
  weight: 1, eggCycles: -1,
  conditions: [ConditionMap.OnField],
}

const CUBONE: Pokemon = {
  species: 'Cubone',
  badge: Badge.fromLegacy('potw-104'),
  pokedex: '', moveTMs: [],
  currentHp: 100,
  totalHp: 100,
  move: ['Tackle'],
  movepool: [Movepool.Tackle],
  fainted: false,
  type1: 'Ground',
  hp: 1,
  attack: 1,
  defense: 1,
  spAttack: 1,
  spDefense: 1,
  speed: 20,
  shiny: 'FALSE',
  heldItemConsumed: false,
  heldItemTotallyConsumed: false,
  statBuffs: {
    attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0,
    accuracy: 0, evasiveness: 0, criticalHit: 0,
  },
  weight: 1, eggCycles: -1,
  conditions: [ConditionMap.OnField],
}

const TYRANITAR: Pokemon = {
  species: 'Tyranitar',
  badge: Badge.fromLegacy('potw-248'),
  pokedex: '', moveTMs: [],
  currentHp: 100,
  totalHp: 100,
  move: ['Stone Edge', 'Feint Attack'],
  movepool: [Movepool['Stone Edge'], Movepool['Feint Attack']],
  fainted: false,
  type1: 'Dark', type2: 'Rock',
  hp: 1,
  attack: 1,
  defense: 1,
  spAttack: 1,
  spDefense: 1,
  speed: 20,
  shiny: 'FALSE',
  heldItemConsumed: false,
  heldItemTotallyConsumed: false,
  statBuffs: {
    attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0,
    accuracy: 0, evasiveness: 0, criticalHit: 0,
  },
  weight: 1, eggCycles: -1,
  conditions: [ConditionMap.OnField],
}


const TYRANITAR_V1: Pokemon = {
  species: 'Tyranitar',
  badge: Badge.fromLegacy('potw-248'),
  pokedex: '', moveTMs: [],
  currentHp: 100,
  totalHp: 100,
  move: ['Stone Edge', 'Ice Fang', 'Feint Attack'],
  movepool: [Movepool['Stone Edge'], Movepool['Ice Fang'], Movepool['Feint Attack']],
  fainted: false,
  type1: 'Dark', type2: 'Rock',
  hp: 1,
  attack: 1,
  defense: 1,
  spAttack: 1,
  spDefense: 1,
  speed: 20,
  shiny: 'FALSE',
  heldItemConsumed: false,
  heldItemTotallyConsumed: false,
  statBuffs: {
    attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0,
    accuracy: 0, evasiveness: 0, criticalHit: 0,
  },
  weight: 1, eggCycles: -1,
  conditions: [ConditionMap.OnField],
}

const DRAGONITE: Pokemon = {
  species: 'Dragonite',
  badge: Badge.fromLegacy('potw-149'),
  pokedex: '', moveTMs: [],
  currentHp: 100,
  totalHp: 100,
  move: ['Tackle'],
  movepool: [Movepool.Tackle],
  fainted: false,
  type1: 'Dragon', type2: 'Flying',
  hp: 1,
  attack: 1,
  defense: 1,
  spAttack: 1,
  spDefense: 1,
  speed: 20,
  shiny: 'FALSE',
  heldItemConsumed: false,
  heldItemTotallyConsumed: false,
  statBuffs: {
    attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0,
    accuracy: 0, evasiveness: 0, criticalHit: 0,
  },
  weight: 1, eggCycles: -1,
  conditions: [ConditionMap.OnField],
}


const K_RAICHU: Pokemon = {
  species: 'Raichu',
  badge: Badge.fromLegacy('potw-026'),
  pokedex: '', moveTMs: [],
  currentHp: 100,
  totalHp: 100,
  move: ['Thunderbolt'],
  movepool: [Movepool['Thunderbolt']],
  fainted: false,
  type1: 'Electric', type2: 'Psychic',
  hp: 1,
  attack: 1,
  defense: 1,
  spAttack: 1,
  spDefense: 1,
  speed: 20,
  shiny: 'FALSE',
  heldItemConsumed: false,
  heldItemTotallyConsumed: false,
  statBuffs: {
    attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0,
    accuracy: 0, evasiveness: 0, criticalHit: 0,
  },
  weight: 1, eggCycles: -1,
  conditions: [ConditionMap.OnField],
}

const A_RAICHU_V1: Pokemon = {
  species: 'Raichu',
  badge: Badge.fromLegacy('potw-026-alolan'),
  pokedex: '', moveTMs: [],
  currentHp: 100,
  totalHp: 100,
  move: ['Thunderbolt', 'Psychic', 'Nasty Plot'],
  movepool: [Movepool['Thunderbolt'], Movepool['Psychic'], Movepool['Nasty Plot']],
  fainted: false,
  type1: 'Electric', type2: 'Psychic',
  hp: 1,
  attack: 1,
  defense: 1,
  spAttack: 1,
  spDefense: 1,
  speed: 20,
  shiny: 'FALSE',
  heldItemConsumed: false,
  heldItemTotallyConsumed: false,
  statBuffs: {
    attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0,
    accuracy: 0, evasiveness: 0, criticalHit: 0,
  },
  weight: 1, eggCycles: -1,
  conditions: [ConditionMap.OnField],
}

const A_RAICHU_V4: Pokemon = {
  species: 'Raichu',
  badge: Badge.fromLegacy('potw-026-alolan'),
  pokedex: '', moveTMs: [],
  currentHp: 100,
  totalHp: 100,
  move: ['Discharge', 'Psychic', 'Nasty Plot'],
  movepool: [Movepool['Discharge'], Movepool['Psychic'], Movepool['Nasty Plot']],
  fainted: false,
  type1: 'Electric', type2: 'Psychic',
  hp: 1,
  attack: 1,
  defense: 1,
  spAttack: 1,
  spDefense: 1,
  speed: 20,
  shiny: 'FALSE',
  heldItemConsumed: false,
  heldItemTotallyConsumed: false,
  statBuffs: {
    attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0,
    accuracy: 0, evasiveness: 0, criticalHit: 0,
  },
  weight: 1, eggCycles: -1,
  conditions: [ConditionMap.OnField],
}

const LAPRAS_V4: Pokemon = {
  species: 'Lapras',
  badge: Badge.fromLegacy('potw-131'),
  pokedex: '', moveTMs: [],
  currentHp: 100,
  totalHp: 100,
  move: ['Blizzard', 'Surf', 'Sing'],
  movepool: [Movepool['Blizzard'], Movepool['Surf'], Movepool['Sing']],
  fainted: false,
  type1: 'Water', type2: 'Ice',
  hp: 1,
  attack: 1,
  defense: 1,
  spAttack: 1,
  spDefense: 1,
  speed: 20,
  shiny: 'FALSE',
  heldItemConsumed: false,
  heldItemTotallyConsumed: false,
  statBuffs: {
    attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0,
    accuracy: 0, evasiveness: 0, criticalHit: 0,
  },
  weight: 1, eggCycles: -1,
  conditions: [ConditionMap.OnField],
}

const FIELD_BAY: Field = {
  naturePower: 'Normal',
  weather: Weathers.Sunny,
  trickRoom: 0,
  mudSport: 0,
  waterSport: 0,
  locationTerrain: 'Bay',
  wonderRoom: 0,
  magicRoom: 0,
  ions: false,
  sides: {
    Opposing: {
      lightscreen: 0,
      mist: 0,
      reflect: 0,
      tailwind: 0,
      firefield: 0,
      fusionElectric: false,
      fusionFire: false,
      marsh: 0,
      pledgeFire: false,
      pledgeGrass: false,
      pledgeWater: false,
      rainbow: 0,
      goldCoins: false,
      sharpSteel: false,
      stickyWeb: false,
      stealthRock: false,
      spikes: 0,
      toxicSpikes: 0,
    },
    Your: {
      lightscreen: 0,
      mist: 0,
      reflect: 0,
      tailwind: 0,
      firefield: 0,
      fusionElectric: false,
      fusionFire: false,
      marsh: 0,
      pledgeFire: false,
      pledgeGrass: false,
      pledgeWater: false,
      rainbow: 0,
      goldCoins: false,
      sharpSteel: false,
      stickyWeb: false,
      stealthRock: false,
      spikes: 0,
      toxicSpikes: 0,
    },
  },
}

const battleOptions: BattleOptions = {
  pctLogs: [],
}

const battleRules: Rules = {
  fieldSize: 2,
  maxWins: 0,
  partySize: 1,
  mega: false,
  zmoves: false,
  dynamax: false,
}

test('Critical Hits', t => {
  const splashCrit = criticalHit(CUBONE, Movepool.Splash)
  t.is(splashCrit.crit, false)
  t.is(splashCrit.chance, 0)

  const tackleCrit = criticalHit(CUBONE, Movepool.Tackle)
  t.is(tackleCrit.chance, 0.0417)

  const razorLeafCrit = criticalHit(CUBONE, Movepool['Razor Leaf'])
  t.is(razorLeafCrit.chance, 0.125)

  const razorLeafScope = {...Movepool['Razor Leaf']}
  
  Inventory.scopelens!.onCasterMove!({
    caster: MAGIKARP,
    target: MAGIKARP,
    casters: [MAGIKARP],
    targets: [MAGIKARP],
    field: FIELD_BAY,
    move: razorLeafScope,
    prefix: 'Your',
    targetPrefix: 'Opposing',
  }, false)
  const scopeCrit = criticalHit(CUBONE, razorLeafScope)
  t.is(scopeCrit.chance, 1)

  const razorLeafLuck = {...Movepool['Razor Leaf']}
  AbilityDex.SuperLuck.onCasterMove?.({
    caster: MAGIKARP,
    target: MAGIKARP,
    casters: [MAGIKARP],
    targets: [MAGIKARP],
    field: FIELD_BAY,
    move: razorLeafLuck,
    prefix: 'Your',
    targetPrefix: 'Opposing',
  })
  const superluckCrit = criticalHit(CUBONE, razorLeafLuck)
  t.is(razorLeafLuck.criticalHit, 4, `Got ${razorLeafLuck.criticalHit}`)
  t.is(superluckCrit.chance, 1)

  const razorLeafLuckScope = {...Movepool['Razor Leaf']}
  Inventory.scopelens!.onCasterMove!({
        caster: MAGIKARP,
    target: MAGIKARP,
    casters: [MAGIKARP],
    targets: [MAGIKARP],
    field: FIELD_BAY,
    move: razorLeafScope,
    prefix: 'Your',
    targetPrefix: 'Opposing',
  }, false)
  AbilityDex.SuperLuck.onCasterMove?.({
    caster: MAGIKARP,
    target: MAGIKARP,
    casters: [MAGIKARP],
    targets: [MAGIKARP],
    field: FIELD_BAY,
    move: razorLeafLuckScope,
    prefix: 'Your',
    targetPrefix: 'Opposing',
  })
  const superluckScopeCrit = criticalHit(CUBONE, razorLeafLuckScope)
  t.is(superluckScopeCrit.chance, 1)
})

test('Type multipliers', t => {
  const oneEffective = typeMultiplier(MAGIKARP, 'Normal')
  t.is(oneEffective.mult, 1)

  const twoEffective = typeMultiplier(MAGIKARP, 'Electric')
  t.is(twoEffective.mult, 2)

  const halfEffective = typeMultiplier(MAGIKARP, 'Fire')
  t.is(halfEffective.mult, 0.5)

  const fourEffective = typeMultiplier(GOLEM, 'Water')
  t.is(fourEffective.mult, 4)

  const noEffective = typeMultiplier(GOLEM, 'Electric')
  t.is(noEffective.mult, 0)
})

test('Sort by speed', t => {
  const pkmn = [MAGIKARP, ELECTRODE, CUBONE, GOLEM]
  pkmn.sort(bySpeed)
  t.is(pkmn[0].species, 'Electrode')
  t.is(pkmn[1].species, 'Cubone')
  t.is(pkmn[2].species, 'Golem')
  t.is(pkmn[3].species, 'Magikarp')
})

test('Sort by speed with stat boosts', t => {
  const cubone = {...CUBONE}
  const moveInput: Partial<MoveInput> = {
    caster: cubone,
    target: undefined,
    field: undefined,
    move: undefined,
    prefix: 'Your',
    targetPrefix: 'Your',
    damage: 0,
  }
  BUFF_STAT(cubone, moveInput as MoveInput, 'speed', 1) // Base 20 versus Electrode's 25, now doubled
  const pkmn = [cubone, ELECTRODE, MAGIKARP, GOLEM]
  pkmn.sort(bySpeed)
  t.is(pkmn[0].species, 'Cubone')
  t.is(pkmn[1].species, 'Electrode')
  t.is(pkmn[2].species, 'Golem')
  t.is(pkmn[3].species, 'Magikarp')
})

test('Sort by move priority', t => {
  const cubone = {...CUBONE}
  cubone.statBuffs.speed = 0
  const electrode = {...ELECTRODE}
  electrode.statBuffs.speed = 0
  const actions: SpeedAlignedAction[] = [{
    caster: electrode,
    target: cubone,
    targets: [cubone],
    move: {...Movepool.Counter}, // Move with a negative priority
    label: 'Your',
  }, {
    caster: electrode,
    target: cubone,
    targets: [cubone],
    move: {...Movepool.Acid}, // Move with a neutral priority
    label: 'Your',
  }, {
    caster: cubone,
    target: electrode,
    targets: [electrode],
    move: {...Movepool["Mirror Coat"]}, // Move with negative priority
    label: 'Your',
  }, {
    caster: cubone,
    target: electrode,
    targets: [electrode],
    move: {...Movepool["Bone Club"]}, // Move with neutral priority
    label: 'Your',
  }, {
    caster: cubone,
    target: electrode,
    targets: [electrode],
    move: {...Movepool["Ice Shard"]}, // Move with positive priority
    label: 'Your',
  }]

  // Electrode is faster than Cubone, so it should win priority ties
  actions.sort(byPriority)
  t.log(cubone)
  t.log(electrode)
  t.log(actions.map(action => action.move.name))
  t.log(actions.map(action => action.caster.species))
  t.log(actions.map(action => action.caster.speed))
  t.is(actions[0].move.name, 'Ice Shard')
  t.is(actions[1].move.name, 'Acid')
  t.is(actions[2].move.name, 'Bone Club')
  t.is(actions[3].move.name, 'Counter')
  t.is(actions[4].move.name, 'Mirror Coat')
})

test('Sort by move priority with fainted Pokémon', t => {
  const cubone = {...CUBONE}
  const electrode = {...ELECTRODE}
  electrode.fainted = true
  const actions: Partial<SpeedAlignedAction>[] = [{
    caster: electrode,
    target: cubone,
    targets: [cubone],
    move: undefined, // Get undefined move selection
    label: 'Your',
  }, {
    caster: cubone,
    target: electrode,
    targets: [electrode],
    move: {...Movepool["Mirror Coat"]}, // Move with negative priority
    label: 'Your',
  }]

  actions.sort(byPriority)
  t.is(actions[0].move?.name, undefined)
  t.is(actions[1].move?.name, 'Mirror Coat')
})

test('Test attack flow - Items', t => {
  const magikarp = {...MAGIKARP}
  magikarp.heldItem = {...Inventory.lifeorb!}
  const golem = {...GOLEM}!
  golem.heldItem = {...Inventory.chilan!}

  const tackle = {...Movepool.Tackle}
  tackle.power = 0.6
  t.is(tackle.power, 0.6)
  tackle.criticalHit = 0 // Prevent flaky critical hits
  const attackLog = attack({
    caster: magikarp, casters: [magikarp], casterParty: [magikarp],
    target: golem, targets: [golem], targetParty: [golem],
    move: tackle, field: FIELD_BAY, prefix: 'Your',
  })

  t.is(magikarp.currentHp, 90, 'Magikarp did not take 10% damage with the Life Orb')
  t.is(tackle.power, 0.39, 'The power Tackle was not halved by Chilan Berry')
  t.not(golem.currentHp, golem.totalHp, 'Golem did not take any damage')
  t.assert(golem.heldItemConsumed)
  t.assert(attackLog.msg.includes('Magikarp: 100 -> 90'))

  // Verify that the Chilan Berry was consumed
  const tackleTurn2 = {...Movepool.Tackle}
  tackleTurn2.power = 0.6 // Reset
  tackleTurn2.criticalHit = 0
  attack({
    caster: magikarp, casters: [magikarp], casterParty: [magikarp],
    target: golem, targets: [golem], targetParty: [golem],
    move: tackleTurn2, field: FIELD_BAY, prefix: 'Your',
  })
  t.is(magikarp.currentHp, 80, 'Magikarp did not take 10% damage with the Life Orb')
  t.is(tackleTurn2.power, 0.78, 'The power Tackle was not just increased with the Life Orb')
  t.not(golem.currentHp, golem.totalHp, 'Golem did not take any damage')
})

test('Test attack flow - Move effect', t => {
  const electrode = {...ELECTRODE}
  const cubone = {...CUBONE}
  cubone.statBuffs.speed = 0
  const pkmn = [electrode, cubone]
  pkmn.sort(bySpeed)
  t.is(pkmn[0].species, 'Electrode')
  t.is(pkmn[1].species, 'Cubone')
  const stringShot = {...Movepool['String Shot']}
 
  const log = attack({
    caster: cubone, casters: [cubone], casterParty: [cubone],
    target: electrode, targets: [electrode], targetParty: [cubone],
    move: stringShot, field: FIELD_BAY, prefix: 'Your',
  })
  t.log(log)
  t.is(electrode.statBuffs.speed, -1, 'Electrode did not half speed')
  t.is(electrode.currentHp, electrode.totalHp, 'Electrode took damage from a non-damaging move')
  pkmn.sort(bySpeed)
  t.is(pkmn[0].species, 'Cubone')
  t.is(pkmn[1].species, 'Electrode')
})

test('Test attack flow - No effect', t => {
  const magikarp = {...MAGIKARP}
  const golem = {...GOLEM} 
  const spark = {...Movepool.Spark}

  const log = attack({
    caster: magikarp, casters: [magikarp], casterParty: [magikarp],
    target: golem, targets: [golem], targetParty: [golem],
    move: spark, field: FIELD_BAY, prefix: 'Your',
  })
  t.is(golem.currentHp, golem.totalHp, 'Golem took damage with Spark')
  t.is(log.msg[log.msg.length - 1], 'It had no effect on Golem...')
})

test('Test attack flow - Miss', t => {
  const magikarp = {...MAGIKARP}
  const golem = {...GOLEM}
  const noop = {...Movepool.Noop}

  const log = attack({
    caster: magikarp, casters: [magikarp], casterParty: [magikarp],
    target: golem, targets: [golem], targetParty: [golem],
    move: noop, field: FIELD_BAY, prefix: 'Your',
  })
  t.is(golem.currentHp, golem.totalHp, 'Golem took damage with Noop')
  t.is(log.msg[log.msg.length - 1], 'The attack missed!')
})

test('Stat buffing and clamps', t => {
  const magikarp = {...MAGIKARP}
  const golem = {...GOLEM}

  const placeholderInput: MoveInput = {
    caster: magikarp, casters: [magikarp],
    target: golem, targets: [golem],
    field: FIELD_BAY,
    move: {...Movepool.Acid},
    prefix: 'Opposing',
    targetPrefix: 'Opposing',
    damage: 0,
  }

  const log = BUFF_STAT(magikarp, placeholderInput, 'attack', 1)
  t.is(log.msg[0], `Magikarp's attack rose`)

  const log2 = BUFF_STAT(magikarp, placeholderInput, 'attack', 3)
  t.is(log2.msg[0], `Magikarp's attack rose dramatically`)
  BUFF_STAT(magikarp, placeholderInput, 'attack', 2)
  t.is(magikarp.statBuffs.attack, 6)

  const log3 = BUFF_STAT(magikarp, placeholderInput, 'attack', 3)
  t.is(log3.msg[0], `Magikarp's attack won't go any higher!`)

  BUFF_STAT(golem, placeholderInput, 'defense', -3)
  BUFF_STAT(golem, placeholderInput, 'defense', -3)
  const waterfall = {...Movepool.Waterfall}
  attack({
    caster: magikarp, casters: [magikarp], casterParty: [magikarp],
    target: golem, targets: [golem], targetParty: [golem],
    move: waterfall, field: FIELD_BAY, prefix: 'Your',
  })
  t.is(golem.currentHp, 0, 'Golem did not faint!')
})

test('Solar Beam instant', t => {
  const magikarp = {...MAGIKARP}
  const golem = {...GOLEM}

  const field = {...FIELD_BAY}
  field.weather = {...Weathers['Heat Wave']}

  const solarBeam = {...Movepool["Solar Beam"]}
  attack({
    caster: magikarp, casters: [magikarp], casterParty: [magikarp],
    target: golem, targets: [golem], targetParty: [golem],
    move: solarBeam, field, prefix: 'Your',
  })
  t.not(golem.currentHp, golem.totalHp, 'Golem did not take damage!')
})

test.skip('Weather activation', t => {
  const magikarp = {...MAGIKARP}
  const golem = {...GOLEM}
  const field = {...FIELD_BAY}
  field.weather = {...Weathers['Sandstorm']}

  field.weather.onActivation?.([magikarp, golem], field)
  t.is(golem.spDefense, 1.5, 'Golem did not get a sandstorm boost!')
})

test('Weather damage', t => {
  const magikarp = {...MAGIKARP}
  const golem = {...GOLEM}
  const field = {...FIELD_BAY}
  field.weather = {...Weathers['Sandstorm']}

  field.weather.onTurnEnd?.([magikarp, golem])
  t.is(golem.currentHp, golem.totalHp, 'Golem did took sandstorm damage!')
  t.not(magikarp.currentHp, magikarp.totalHp, 'Magikarp did not take sandstorm damage!')
})

test('Weather - Delta Stream', t => {
  const magikarp = {...MAGIKARP}
  magikarp.type1 = 'Flying' // Sure, go with it
  const golem = {...GOLEM}
  const field = {...FIELD_BAY}
  field.weather = {...Weathers['Windy']}
  const log = attack({
    caster: golem, casters: [golem], casterParty: [golem],
    target: magikarp, targets: [magikarp], targetParty: [magikarp],
    move: Movepool['Shock Wave'], field, prefix: 'Your',
  })
  t.log(log)
  t.true(log.msg.includes(`A strong headwind weakens the attack.`))
})

test('Protection', t => {
  const magikarp = {...MAGIKARP}
  const golem = {...GOLEM}

  magikarp.conditions = [ConditionMap.OnField, {...ConditionMap.Protect}]
  const log = attack({
    caster: golem, casters: [golem], casterParty: [golem],
    target: magikarp, targets: [magikarp], targetParty: [magikarp],
    move: Movepool.Tackle, field: FIELD_BAY, prefix: 'Your',
  })
  t.is(magikarp.currentHp, magikarp.totalHp, 'Magikarp did not protect itself')
  t.log(log.msg)
  t.true(log.msg.includes('Magikarp protected itself!'))
})

test('Protect works against status moves', t => {
  const magikarp = {...MAGIKARP}
  const golem = {...GOLEM}

  magikarp.conditions = [ConditionMap.OnField, {...ConditionMap.Protect}]
  const log = attack({
    caster: golem, casters: [golem], casterParty: [golem],
    target: magikarp, targets: [magikarp], targetParty: [magikarp],
    move: Movepool.Spore, field: FIELD_BAY, prefix: 'Your',
  })
  t.is(magikarp.status, undefined, 'Magikarp did not protect itself')
  t.log(log.msg)
  t.true(log.msg.includes('Magikarp protected itself!'))
})

test('King Shield does not work against status moves', t => {
  const magikarp = {...MAGIKARP}
  const golem = {...GOLEM}

  magikarp.conditions = [ConditionMap.OnField, {...ConditionMap.ProtectKing}]
  const log = attack({
    caster: golem, casters: [golem], casterParty: [golem],
    target: magikarp, targets: [magikarp], targetParty: [magikarp],
    move: Movepool.Spore, field: FIELD_BAY, prefix: 'Your',
  })
  t.is(magikarp.status?.name, 'Asleep', 'Magikarp falsy protected itself')
  t.log(log.msg)
  t.true(log.msg.includes('Magikarp fell asleep!'))
})

test('Technical Record replacement', t => {
  const magikarp = {...MAGIKARP}
  magikarp.heldItem = {...Inventory["tr-Agility"]!}
  magikarp.movepool = [Movepool.Agility] // Force replace
  magikarp.conditions = [ConditionMap.OnField, {...ConditionMap.Encore}]
  magikarp.totalHp = 10000 // Guarantee Magikarp doesn't faint
  magikarp.currentHp = 10000
  const golem = {...GOLEM}

  const log = turn({
    field: FIELD_BAY,
    players: [magikarp],
    opponents: [golem],
    turnCount: 0,
  })
  t.log(log)
  t.true(log.msg.includes('Your Magikarp used Agility'))
  // Verify that the move returns at the end of the turn
  t.is(magikarp.movepool[0].name, 'Splash')
})

test('Technical Record plucked', t => {
  // Using the move Pluck. Also applicable to moves like
  //   Bug Bite and Knock Off.
  const magikarp = {...MAGIKARP}
  magikarp.heldItemKey = 'tr-Agility'
  magikarp.heldItem = {...Inventory["tr-Agility"]!}
  magikarp.movepool = [{...Movepool.Agility}] // Force replace
  magikarp.conditions = [ConditionMap.OnField, {...ConditionMap.Encore}]
  const golem = {...GOLEM}
  golem.movepool = [{...Movepool.Pluck}]

  const log = turn({
    field: FIELD_BAY,
    players: [magikarp],
    opponents: [golem],
    turnCount: 0,
  })
  console.log(log.msg)
  t.true(log.msg.includes('Your Magikarp used Agility'))
  t.true(log.msg.includes(`Golem plucked the Magikarp's TR-025 Agility!`), log.msg.join('|'))
  // Verify that the move returns at the end of the turn
  // t.is(magikarp.movePrimary.name, 'Splash')
})

// This test is flaky. It resolves itself after running a second time.
test('Move - Knock Off', t => {
  const magikarp = {...MAGIKARP}
  magikarp.heldItemKey = 'amuletcoin'
  magikarp.heldItem = {...Inventory.amuletcoin!}
  const golem = {...GOLEM}
  const knockOffMsg = `Golem knocked off Magikarp's Amulet Coin!`

  const knockOff = {...Movepool["Knock Off"]}
  knockOff.power = 0.75 // Reset
  knockOff.criticalHit = 0
  const log = attack({
    caster: golem, casters: [golem], casterParty: [golem],
    target: magikarp, targets: [magikarp], targetParty: [magikarp],
    move: knockOff, field: FIELD_BAY, prefix: 'Your',
  })
  t.is(knockOff.power, 1.5)
  t.not(magikarp.currentHp, magikarp.totalHp, 'Magikarp did not take damage')
  t.true(log.msg.includes(knockOffMsg))
  t.is(magikarp.heldItemConsumed, true)

  // Check that during the second time the move has changed effect
  const knockOff2 = {...Movepool["Knock Off"]}
  knockOff2.power = 0.75 // Reset
  knockOff2.criticalHit = 0
  t.is(knockOff2.power, 0.75)
  const log2 = attack({
    caster: golem, casters: [golem], casterParty: [golem],
    target: magikarp, targets: [magikarp], targetParty: [magikarp],
    move: knockOff2, field: FIELD_BAY, prefix: 'Your',
  })
  t.is(knockOff2.power, 0.75)
  t.false(log2.msg.includes(knockOffMsg)) 
})

test('Move - Power Split', t => {
  const magikarp = {...MAGIKARP}
  const golem = {...GOLEM}
  attack({
    caster: magikarp, casters: [magikarp], casterParty: [magikarp],
    target: golem, targets: [golem], targetParty: [golem],
    move: Movepool['Power Split'], field: FIELD_BAY, prefix: 'Your',
  })
  t.is(magikarp.attack, golem.attack)
  t.is(magikarp.spAttack, golem.spAttack)
})

test('Move - Sheer Cold', t => {
  const magikarp = {...MAGIKARP}
  const golem = {...GOLEM}
  const move = {...Movepool['Sheer Cold']}
  move.accuracy = 0.3

  magikarp.type1 = 'Water'
  magikarp.type2 = undefined
  t.log(attack({
    caster: magikarp, casters: [magikarp], casterParty: [magikarp],
    target: golem, targets: [golem], targetParty: [golem],
    move, field: FIELD_BAY, prefix: 'Your',
  }))
  t.log(move)
  t.is(move.accuracy, 0.19999999999999998, 'Magikarp Sheer Cold is too accurate')
  
  magikarp.type2 = 'Ice'
  move.accuracy = 0.3
  attack({
    caster: magikarp, casters: [magikarp], casterParty: [magikarp],
    target: golem, targets: [golem], targetParty: [golem],
    move, field: FIELD_BAY, prefix: 'Your',
  })
  t.is(move.accuracy, 0.3, 'Sheer Cold is not accurate')
  
  golem.type1 = 'Ice'
  move.accuracy = 0.3
  attack({
    caster: magikarp, casters: [magikarp], casterParty: [magikarp],
    target: golem, targets: [golem], targetParty: [golem],
    move, field: FIELD_BAY, prefix: 'Your',
  })
  t.is(move.accuracy, 0, 'Golem Sheer Cold is too accurate')
})

test('Move - Nature Power', t => {
  const magikarp = {...MAGIKARP}
  const golem = {...GOLEM}
  // Going to be 'Hydro Pump' in Bay terrain
  // Hydro Pump has no onBefore/onAfter
  const move = {...Movepool['Nature Power']}
  move.criticalHit = 0
  move.accuracy = Infinity // Adjust to guarantee hit

  t.log(attack({
    caster: magikarp, casters: [magikarp], casterParty: [magikarp],
    target: golem, targets: [golem], targetParty: [golem],
    move, field: FIELD_BAY, prefix: 'Your',
  }))
  t.is(move.type, 'Water', 'Nature Power did not become Water-type')
  t.not(golem.currentHp, golem.totalHp, 'Hydro Pump did no damage')
})

test('Move - Acupressure', t => {
  // Test Aoe - Single Ally
  const magikarp = {...MAGIKARP}
  const golem = {...GOLEM}
  magikarp.statBuffs = {
    attack: 0, defense: 0,
    spAttack: 0, spDefense: 0,
    speed: 0, accuracy: 0, evasiveness: 0, criticalHit: 0,
  }
  golem.statBuffs = {
    attack: 0, defense: 0,
    spAttack: 0, spDefense: 0,
    speed: 0, accuracy: 0, evasiveness: 0, criticalHit: 0,
  }
  const move = {...Movepool.Acupressure}

  attack({
    caster: magikarp, casters: [golem, magikarp], casterParty: [golem, magikarp],
    target: golem, targets: [golem], targetParty: [golem],
    move, field: FIELD_BAY, prefix: 'Your',
  })
  // Golem is only non-caster ally
  const statBuffSum = Object.values(golem.statBuffs)
    .reduce((p, c) => p + c)
  t.is(statBuffSum, 2)

  // Should still work with a single party member
  attack({
    caster: magikarp, casters: [magikarp], casterParty: [magikarp],
    target: golem, targets: [golem], targetParty: [golem],
    move, field: FIELD_BAY, prefix: 'Your',
  })
  const statBuffSum2 = Object.values(magikarp.statBuffs)
    .reduce((p, c) => p + c)
  t.is(statBuffSum2, 2)
})

test('Move - Howl', t => {
  // Test Aoe - Self
  const magikarp = {...MAGIKARP}
  const golem = {...GOLEM}
  magikarp.statBuffs = {
    attack: 0, defense: 0,
    spAttack: 0, spDefense: 0,
    speed: 0, accuracy: 0, evasiveness: 0, criticalHit: 0,
  }
  const move = {...Movepool.Howl}

  attack({
    caster: magikarp, casters: [magikarp], casterParty: [magikarp],
    target: golem, targets: [golem], targetParty: [golem],
    move, field: FIELD_BAY, prefix: 'Your',
  })
  const statBuffSum = Object.values(magikarp.statBuffs)
    .reduce((p, c) => p + c)
  t.is(statBuffSum, 1)
})

test('Move - Techno Blast', t => {
  // Test move type changing with onGetType
  const magikarp = {...MAGIKARP}
  magikarp.heldItem = {...Inventory.dousedrive!}
  magikarp.heldItemKey = 'dousedrive'
  const golem = {...GOLEM}
  magikarp.statBuffs = {
    attack: 0, defense: 0,
    spAttack: 0, spDefense: 0,
    speed: 0, accuracy: 0, evasiveness: 0, criticalHit: 0,
  }
  const move = {...Movepool['Techno Blast']}

  const log = attack({
    caster: magikarp, casters: [magikarp], casterParty: [magikarp],
    target: golem, targets: [golem], targetParty: [golem],
    move, field: FIELD_BAY, prefix: 'Your',
  })
  t.true(log.msg.includes(`It's super effective!`))
})

test('Move - Hyper Beam', t => {
  const magikarp = {...MAGIKARP}
  const golem = {...GOLEM}
  magikarp.statBuffs = {
    attack: 0, defense: 0,
    spAttack: 0, spDefense: 0,
    speed: 0, accuracy: 0, evasiveness: 0, criticalHit: 0,
  }
  const move = {...Movepool['Hyper Beam']}
  move.accuracy = Infinity

  const log = attack({
    caster: magikarp, casters: [magikarp], casterParty: [magikarp],
    target: golem, targets: [golem], targetParty: [golem],
    move, field: FIELD_BAY, prefix: 'Your',
  })
  t.truthy(getCondition(magikarp, 'Recharge'), 'Magikarp does not need to recharge')

  // Verify that there is a recharge step
  log.push(attack({
    caster: magikarp, casters: [magikarp], casterParty: [magikarp],
    target: golem, targets: [golem], targetParty: [golem],
    move, field: FIELD_BAY, prefix: 'Your',
  }))
  t.log(move)
  t.true(move.failed)
  t.log(log)
  t.true(log.msg.includes('Magikarp must recharge!'))
})

test('Move - Reflect Type', t => {
  const magikarp = {...MAGIKARP}
  const golem = {...GOLEM}
  const move = {...Movepool['Reflect Type']}
  attack({
    caster: magikarp, casters: [magikarp], casterParty: [magikarp],
    target: golem, targets: [golem], targetParty: [golem],
    move, field: FIELD_BAY, prefix: 'Your',
  })
  t.is(magikarp.type1, 'Rock')
  t.is(magikarp.type2, 'Ground')
})

test('Aoe - Self', t => {
  const magikarp = {...MAGIKARP}
  const golem = {...GOLEM}
  const move = {...Movepool['NoopAoeSelf']}

  const log = attack({
    caster: magikarp, casters: [magikarp], casterParty: [magikarp],
    target: golem, targets: [golem], targetParty: [golem],
    move, field: FIELD_BAY, prefix: 'Your',
  })
  // Prove nothing happened
  t.is(golem.currentHp, golem.totalHp)
  t.false(log.msg.includes(`It's not very effective...`))
})

test('Aoe - Nearby Opponents - Center', t => {
  const magikarp = {...MAGIKARP}
  const golem = {...GOLEM}
  const electrode = {...ELECTRODE}
  const cubone = {...CUBONE}
  const move = {...Movepool['Acid']}
  move.accuracy = Infinity
  move.criticalHit = Infinity

  const log = attack({
    caster: magikarp, casters: [magikarp], casterParty: [magikarp],
    target: electrode, targets: [golem, electrode, cubone], targetParty: [golem, electrode, cubone],
    move, field: FIELD_BAY, prefix: 'Your',
  })
  t.not(golem.currentHp, golem.totalHp, 'Golem took no damage')
  t.not(electrode.currentHp, electrode.totalHp, 'Electrode took no damage')
  t.not(cubone.currentHp, cubone.totalHp, 'Cubone took no damage')
  t.true(log.msg.includes('A critical hit on Electrode!'))
})

test('Aoe - Nearby Opponents - Left', t => {
  const magikarp = {...MAGIKARP}
  const golem = {...GOLEM}
  const electrode = {...ELECTRODE}
  const cubone = {...CUBONE}
  const move = {...Movepool['Acid']}
  move.accuracy = Infinity
  move.criticalHit = Infinity

  attack({
    caster: magikarp, casters: [magikarp], casterParty: [magikarp],
    target: golem, targets: [golem, electrode, cubone], targetParty: [golem, electrode, cubone],
    move, field: FIELD_BAY, prefix: 'Your',
  })
  t.not(golem.currentHp, golem.totalHp, 'Golem took no damage')
  t.not(electrode.currentHp, electrode.totalHp, 'Electrode took no damage')
  t.is(cubone.currentHp, cubone.totalHp, 'Cubone took damage')
})

test('Aoe - Everyone', t => {
  const magikarp = {...MAGIKARP}
  const golem = {...GOLEM}
  const electrode = {...ELECTRODE}
  const cubone = {...CUBONE}
  const move = {...Movepool['Surf']}
  move.accuracy = Infinity
  move.criticalHit = Infinity

  attack({
    caster: magikarp, casters: [magikarp, golem], casterParty: [magikarp, golem],
    target: cubone, targets: [electrode, cubone], targetParty: [golem, electrode, cubone],
    move, field: FIELD_BAY, prefix: 'Your',
  })
  t.not(golem.currentHp, golem.totalHp, 'Golem took no damage')
  t.not(electrode.currentHp, electrode.totalHp, 'Electrode took no damage')
  t.not(cubone.currentHp, cubone.totalHp, 'Cubone took no damage')
})

test('Aoe - Damage calc', t => {
  // See b/221247984
  const magikarp = {...MAGIKARP}
  const golem = {...GOLEM}
  const electrode = {...ELECTRODE}
  const move = {...Movepool['Blizzard']}
  move.accuracy = Infinity
  move.criticalHit = 0
  move.power = 2
  // Give it enough HP to survive both hits and compare damage outputs
  electrode.totalHp = 500
  electrode.currentHp = 500

  t.log('AOEDC', electrode.currentHp)
  const log = attack({
    caster: magikarp, casters: [magikarp, golem], casterParty: [magikarp, golem],
    target: electrode, targets: [electrode], targetParty: [electrode],
    move, field: FIELD_BAY, prefix: 'Your',
  })
  t.is(golem.currentHp, golem.totalHp, 'Golem should take no damage')
  t.not(electrode.currentHp, electrode.totalHp, 'Electrode took no damage')
  t.log('AOEDC', electrode.currentHp)
  const damage1 = electrode.totalHp - electrode.currentHp
  t.log('AOEDC', `dmg1 - ${damage1}`)

  const move2 = {...Movepool['Judgment']}
  move2.accuracy = Infinity
  move2.criticalHit = 0
  move2.power = 1.5

  log.push(attack({
    caster: magikarp, casters: [magikarp, golem], casterParty: [magikarp, golem],
    target: electrode, targets: [electrode], targetParty: [electrode],
    move: move2, field: FIELD_BAY, prefix: 'Your',
  }))
  t.log('AOEDC', electrode.currentHp)
  const damage2 = electrode.totalHp - damage1 - electrode.currentHp
  t.log('AOEDC', `dmg2 - ${damage2}`)
  t.true(damage1 > damage2, 'The first move has a higher BP even though it can hit many targets')
  t.true(electrode.currentHp < 400, 'Electrode took no damage')
})

test('Substitute - Broke', t => {
  // Verify substitute works as expected
  const magikarp = {...MAGIKARP}
  const golem = {...GOLEM}
  const move = {...Movepool['Fissure']}
  move.accuracy = Infinity

  // Golem should set up sub first
  const log = attack({
    caster: golem, casters: [golem], casterParty: [golem],
    target: magikarp, targets: [magikarp], targetParty: [magikarp],
    move: {...Movepool.Substitute},
    field: FIELD_BAY, prefix: 'Your',
  })
  t.not(golem.currentHp, golem.totalHp, 'Golem took no penalty for using Substitute')
  log.push(attack({
    caster: magikarp, casters: [magikarp], casterParty: [magikarp],
    target: golem, targets: [golem], targetParty: [golem],
    move, field: FIELD_BAY, prefix: 'Your',
  }))
  t.log(log)
  t.is(golem.currentHp, golem.totalHp * .75, 'Golem took damage')
  t.true(log.msg.includes('The substitute took the damage'), 'Substitute did not take damage')
  t.true(log.msg.includes('The substitute broke'), 'Substitute did not break')
})

test('Substitute - Sound', t => {
  // Verify substitute works as expected
  const magikarp = {...MAGIKARP}
  const golem = {...GOLEM}
  golem.conditions = [ConditionMap.OnField, ConditionMap['Substituting']]
  const move = {...Movepool['Snarl']}
  move.accuracy = Infinity

  // Golem should set up sub first
  const log = attack({
    caster: golem, casters: [golem], casterParty: [golem],
    target: magikarp, targets: [magikarp], targetParty: [magikarp],
    move: {...Movepool.Substitute},
    field: FIELD_BAY, prefix: 'Your',
  })
  log.push(attack({
    caster: magikarp, casters: [magikarp], casterParty: [magikarp],
    target: golem, targets: [golem], targetParty: [golem],
    move, field: FIELD_BAY, prefix: 'Your',
  }))
  t.not(golem.currentHp, golem.totalHp, 'Golem took no damage')
  t.false(log.msg.includes('The substitute took the damage'))
  t.false(log.msg.includes('The substitute broke'))
})

test('Item - Air Balloon', t => {
  const magikarp = {...MAGIKARP}
  magikarp.heldItemKey = 'absorbbulb'
  magikarp.heldItem = Inventory.absorbbulb
  magikarp.heldItemConsumed = false
  magikarp.heldItemTotallyConsumed = false

  const golem = {...GOLEM}
  golem.heldItemKey = 'airballoon'
  golem.heldItem = Inventory.airballoon
  golem.heldItemConsumed = false
  golem.heldItemTotallyConsumed = false
  golem.conditions = [ConditionMap.OnField, ConditionMap['Float']]

  const move = {...Movepool['Earthquake']}
  move.accuracy = Infinity

  const log = attack({
    caster: magikarp, casters: [magikarp], casterParty: [magikarp],
    target: golem, targets: [golem], targetParty: [golem],
    move, field: FIELD_BAY, prefix: 'Your',
  })
  t.is(golem.currentHp, golem.totalHp, 'No damage should be done')

  const popMove = {...Movepool['Acid']}
  log.push(attack({
    caster: magikarp, casters: [magikarp], casterParty: [magikarp],
    target: golem, targets: [golem], targetParty: [golem],
    move: popMove, field: FIELD_BAY, prefix: 'Your',
  }))
  t.log(log)
  t.true(log.msg.includes(`Golem's balloon popped!`), log.msg.join('|'))
  t.not(golem.currentHp, golem.totalHp, 'Golem should take damage')
  t.true(golem.heldItemTotallyConsumed)
  t.false(magikarp.heldItemTotallyConsumed)
})

test('Item - EQ hits everyone but floaters', t => {
  const magikarp = {...MAGIKARP}

  const golem = {...GOLEM}
  golem.conditions = [ConditionMap.OnField, ConditionMap['Float']]

  const move = {...Movepool['Earthquake']}
  move.accuracy = Infinity

  attack({
    caster: magikarp, casters: [magikarp], casterParty: [magikarp],
    target: golem, targets: [golem, magikarp], targetParty: [golem, magikarp],
    move, field: FIELD_BAY, prefix: 'Your',
  })
  t.is(golem.currentHp, golem.totalHp, 'No damage should be done')
  t.not(magikarp.currentHp, magikarp.totalHp, 'Damage should be done')
})

test('Status - ProtectWide', t => {
  const magikarp = {...MAGIKARP}

  const golem = {...GOLEM}
  golem.conditions = [ConditionMap.OnField, ConditionMap['ProtectWide']]

  const move = {...Movepool['Earthquake']}
  move.accuracy = Infinity

  attack({
    caster: magikarp, casters: [magikarp], casterParty: [magikarp],
    target: golem, targets: [golem], targetParty: [golem],
    move, field: FIELD_BAY, prefix: 'Your',
  })
  t.is(golem.currentHp, golem.totalHp, 'No damage should be done')

  attack({
    caster: golem, casters: [golem], casterParty: [golem],
    target: magikarp, targets: [magikarp], targetParty: [magikarp],
    move, field: FIELD_BAY, prefix: 'Your',
  })
  t.not(magikarp.currentHp, magikarp.totalHp, 'Damage should be done')
})

test('Status - Sleuthed and EyedUp', t => {
  const magikarp = {...MAGIKARP}
  magikarp.type1 = 'Dark'
  magikarp.totalHp = 100
  magikarp.currentHp = 100

  const golem = {...GOLEM}
  golem.type1 = 'Ghost'
  golem.conditions = [ConditionMap.OnField, ConditionMap['Sleuthed']]
  golem.totalHp = 100
  golem.currentHp = 100

  const move = {...Movepool['Tackle']}
  move.accuracy = Infinity

  const log1 = attack({
    caster: magikarp, casters: [magikarp], casterParty: [magikarp],
    target: golem, targets: [golem], targetParty: [golem],
    move, field: FIELD_BAY, prefix: 'Your',
  })
  t.not(golem.currentHp, golem.totalHp, 'Damage should be done. It was not.')
  t.log(log1)


  const move2 = {...Movepool['Psychic']}
  move2.accuracy = Infinity

  attack({
    caster: golem, casters: [golem], casterParty: [golem],
    target: magikarp, targets: [magikarp], targetParty: [magikarp],
    move: move2, field: FIELD_BAY, prefix: 'Your',
  })
  t.is(magikarp.currentHp, magikarp.totalHp, 'Damage should not be done')
})

test('Gengarite works', t => {
  const golem = {...GOLEM}
  const gengar = {...MAGIKARP}
  gengar.species = 'Gengar' // :|
  gengar.heldItem = Inventory.gengarite
  gengar.spAttack = 130
  gengar.heldItemKey = 'gengarite'
  const log = gengar.heldItem?.onBattleStart?.(gengar, golem, false)
  t.log(log)
  t.is(Math.round(gengar.spAttack), 170, 'Mega evo did not update stats')
})

test('Gengarite fails on non-Gengar', t => {
  const golem = {...GOLEM}
  const magikarp = {...MAGIKARP}
  magikarp.species = 'Magikarp' // :|
  magikarp.heldItem = Inventory.gengarite
  magikarp.heldItemKey = 'gengarite'
  magikarp.spAttack = 130
  magikarp.heldItem?.onBattleStart?.(magikarp, golem, false)
  t.not(Math.round(magikarp.spAttack), 170, 'Mega evo should not update stats')
})

test('Move selection', t => {
  const tyranitar = {...TYRANITAR_V1}
  const dragonite = {...DRAGONITE}
  const {move} = getCasterTurnMove(tyranitar, [tyranitar], [dragonite], 'PRIMARY', 'Your', 0, 0, FIELD_BAY)
  t.is(move.name, 'Ice Fang')
})

test('Snowball', t => {
  const tyranitar = {...TYRANITAR_V1}
  const dragonite = {...DRAGONITE}
  dragonite.heldItemKey = 'snowball'
  dragonite.heldItem = Inventory.snowball
  const iceFang = {...Movepool['Ice Fang']}
  iceFang.accuracy = Infinity
  const log = attack({
    caster: tyranitar, casters: [tyranitar], casterParty: [tyranitar],
    target: dragonite, targets: [dragonite], targetParty: [dragonite],
    move: iceFang, field: FIELD_BAY, prefix: 'Your',
  })
  log.msg.includes('The snowball liked the ice')
  t.is(1, dragonite.statBuffs.attack, `Dragonite should be at +1: ${log.msg.join('|')}`)
  t.is(0, tyranitar.statBuffs.attack, 'Tyranitar should be at 0')
  t.true(dragonite.heldItemConsumed)
})

test('Simple Z-Crystal activations', t => {
  const tyranitar = {...TYRANITAR} // Base form
  // Bug Crystal shouldn't work
  tyranitar.heldItemKey = 'zbuginium'
  tyranitar.heldItem = Inventory.zbuginium
  t.deepEqual(tyranitar.move, ['Stone Edge', 'Feint Attack'], 'Confirm initial moves')

  const bugLog = tyranitar.heldItem!.onBattleStart!(tyranitar, tyranitar, false)
  t.true(bugLog.msg.includes("Tyranitar's Z-Crystal failed to activate"), 'Tyranitar should not have a Bug Z-Move')

  // Dark Crystal
  tyranitar.heldItemKey = 'zdarkinium'
  tyranitar.heldItem = Inventory.zdarkinium
  const darkLog = tyranitar.heldItem!.onBattleStart!(tyranitar, tyranitar, false)
  t.log(darkLog)
  t.true(darkLog.msg.includes('Tyranitar has learned Black Hole Eclipse'))
  t.deepEqual(tyranitar.move, ['Black Hole Eclipse', 'Stone Edge', 'Feint Attack'], 'Move should be in first slot')
  t.is(tyranitar.movepool[0].name, 'Black Hole Eclipse')
  t.is(tyranitar.movepool[0].power, 1.8, `Black Hole power is ${tyranitar.movepool[0].power}//${Movepool['Feint Attack'].power}`)

  // Tyranitar & Raichu crystal
  tyranitar.heldItemKey = 'zaloraichium'
  tyranitar.heldItem = Inventory.zaloraichium
  const tyraichuLog = tyranitar.heldItem!.onBattleStart!(tyranitar, tyranitar, false)
  t.true(tyraichuLog.msg.includes("Tyranitar's Z-Crystal failed to activate"), 'Tyranitar is not Alolan Raichu')
})

test('Raichu Z-Crystal activations', t => {
  const aRaichu1 = {...A_RAICHU_V1}
  const aRaichu4 = {...A_RAICHU_V4}
  const kRaichu = {...K_RAICHU}
  
  // Z-<Support>
  aRaichu1.heldItemKey = 'zdarkinium'
  aRaichu1.heldItem = Inventory.zdarkinium
  aRaichu1.move = ['Thunderbolt', 'Psychic', 'Nasty Plot']
  const darkLog = aRaichu1.heldItem!.onBattleStart!(aRaichu1, aRaichu1, false)
  t.log(darkLog)
  t.true(darkLog.msg.includes("Raichu has learned Z-Nasty Plot"))
  t.log('Z-Dark', aRaichu1.move)
  t.deepEqual(aRaichu1.move, ['Nasty Plot', 'Thunderbolt', 'Psychic', 'Nasty Plot'])
  t.is(aRaichu1.movepool[0].name, 'Z-Nasty Plot') // Nasty Plot maps to Z-Nasty Plot internally as `Z-NP` isn't a valid key.

  // A-Raichu & Raichu Crystal
  aRaichu1.heldItemKey = 'zaloraichium'
  aRaichu1.heldItem = Inventory.zaloraichium
  aRaichu1.move = ['Nasty Plot', 'Thunderbolt', 'Psychic', 'Nasty Plot']
  const zRaiLog = aRaichu1.heldItem!.onBattleStart!(aRaichu1, aRaichu1, false)
  t.log(aRaichu1)
  t.log(zRaiLog)
  t.true(zRaiLog.msg.includes("Raichu has learned Stoked Sparksurfer"))
  // Whoops we have the previous Z-move in there too. Doesn't make a big difference for this test though.
  t.log('Alola', aRaichu1.move)
  t.deepEqual(aRaichu1.move, ['Stoked Sparksurfer', 'Nasty Plot', 'Thunderbolt', 'Psychic', 'Nasty Plot'])
  t.is(aRaichu1.movepool[0].name, 'Stoked Sparksurfer')

  // A-Raichu4 & Raichu Crystal
  aRaichu4.heldItemKey = 'zaloraichium'
  aRaichu4.heldItem = Inventory.zaloraichium
  const zRai4Log = aRaichu4.heldItem!.onBattleStart!(aRaichu4, aRaichu4, false)
  t.true(zRai4Log.msg.includes("Raichu's Z-Crystal failed to activate"))
  t.deepEqual(aRaichu4.move, ['Discharge', 'Psychic', 'Nasty Plot'])

  // K-Raichu & Raichu Crystal
  kRaichu.heldItemKey = 'zaloraichium'
  kRaichu.heldItem = Inventory.zaloraichium
  const zKRaiLog = kRaichu.heldItem!.onBattleStart!(kRaichu, kRaichu, false)
  t.true(zKRaiLog.msg.includes("Raichu's Z-Crystal failed to activate"))
  t.deepEqual(kRaichu.move, ['Thunderbolt'])
})

test('Damaging Z-Moves', t => {
  const tyranitar = {...TYRANITAR} // Base form
  tyranitar.move = ['Stone Edge', 'Feint Attack']
  const dragonite = {...DRAGONITE}
  // Dark Crystal
  tyranitar.heldItemKey = 'zdarkinium'
  tyranitar.heldItem = Inventory.zdarkinium
  tyranitar.heldItem!.onBattleStart!(tyranitar, tyranitar, false)

  t.deepEqual(tyranitar.move, ['Black Hole Eclipse', 'Stone Edge', 'Feint Attack'], 'Move should be in first slot')
  const log = attack({
    caster: tyranitar, casters: [tyranitar], casterParty: [tyranitar],
    target: dragonite, targets: [dragonite], targetParty: [dragonite],
    move: tyranitar.movepool[0], field: FIELD_BAY, prefix: 'Your',
  })
  t.true(log.msg.includes(`The player's Z-Ring is shining brightly.`))
  t.true(log.msg.includes(`Tyranitar is doing a dance!`))
  t.true(log.msg.includes(`Your Tyranitar used Black Hole Eclipse`))
  t.is(dragonite.currentHp, 0, 'Assume damage is done and is KO')
  t.deepEqual(tyranitar.move, ['Stone Edge', 'Feint Attack'], 'Z-Move should be removed after')

  // Reset
  dragonite.currentHp = 50
  dragonite.fainted = false
  const log2 = attack({
    caster: tyranitar, casters: [tyranitar], casterParty: [tyranitar],
    target: dragonite, targets: [dragonite], targetParty: [dragonite],
    move: Movepool['Stoked Sparksurfer'], field: FIELD_BAY, prefix: 'Your',
  })
  t.true(log2.msg.includes('Your Tyranitar used Stoked Sparksurfer'))
  t.true(log2.msg.includes('Dragonite became paralyzed! It may be unable to move.'))
  t.true(log2.msg.includes('Dragonite fainted!'))
})

test('Support Z-Moves', t => {
  const aRaichu1 = {...A_RAICHU_V1}
  aRaichu1.move = ['Thunderbolt', 'Psychic', 'Nasty Plot']
  aRaichu1.heldItemKey = 'zdarkinium'
  aRaichu1.heldItem = Inventory.zdarkinium
  aRaichu1.heldItem!.onBattleStart!(aRaichu1, aRaichu1, false)
  aRaichu1.statBuffs = {
    accuracy: 1, evasiveness: 0, criticalHit: 0,
    attack: -1, defense: -2,
    spAttack: 0, spDefense: 2,
    speed: 3,
  }
  t.is(aRaichu1.movepool[0].name, 'Z-Nasty Plot') // Nasty Plot maps to Z-Nasty Plot internally as `Z-NP` isn't a valid key.
  t.is(aRaichu1.movepool[0].power, 0) // Nasty Plot maps to Z-Nasty Plot internally as `Z-NP` isn't a valid key.
  const dragonite = {...DRAGONITE}

  // Use our modified Z-Nasty Plot
  const log = attack({
    caster: aRaichu1, casters: [aRaichu1], casterParty: [aRaichu1],
    target: dragonite, targets: [dragonite], targetParty: [dragonite],
    move: aRaichu1.movepool[0], field: FIELD_BAY, prefix: 'Your',
  })
  t.true(log.msg.includes('Your Raichu used Z-Nasty Plot'))
  t.true(log.msg.includes('Raichu reset their stat drops'))
  t.deepEqual(aRaichu1.statBuffs, {
    accuracy: 1, evasiveness: 0, criticalHit: 0,
    attack: 0, defense: 0,
    spAttack: 2, spDefense: 2,
    speed: 3,
  })
})

test('Custom targeting - Follow Me, Spotlight, etc.', t => {
  const aRaichu1 = {...A_RAICHU_V1}
  const dragonite = {...DRAGONITE}
  const tyranitar = {...TYRANITAR}

  const field: Field = {
    naturePower: 'Normal',
    weather: Weathers.Sunny,
    trickRoom: 0,
    mudSport: 0,
    waterSport: 0,
    locationTerrain: 'Bay',
    wonderRoom: 0,
    magicRoom: 0,
    ions: false,
    sides: {
      Opposing: {
        lightscreen: 0,
        mist: 0,
        reflect: 0,
        tailwind: 0,
        firefield: 0,
        fusionElectric: false,
        fusionFire: false,
        marsh: 0,
        pledgeFire: false,
        pledgeGrass: false,
        pledgeWater: false,
        rainbow: 0,
        goldCoins: false,
        sharpSteel: false,
        stickyWeb: false,
        stealthRock: false,
        spikes: 0,
        toxicSpikes: 0,
      },
      Your: {
        lightscreen: 0,
        mist: 0,
        reflect: 0,
        tailwind: 0,
        firefield: 0,
        fusionElectric: false,
        fusionFire: false,
        marsh: 0,
        pledgeFire: false,
        pledgeGrass: false,
        pledgeWater: false,
        rainbow: 0,
        goldCoins: false,
        sharpSteel: false,
        stickyWeb: false,
        stealthRock: false,
        spikes: 0,
        toxicSpikes: 0,
      },
    },
  }

  // Spotlight is used on Tyranitar
  const log = attack({
    caster: aRaichu1, casters: [aRaichu1], casterParty: [aRaichu1],
    target: tyranitar, targets: [dragonite, tyranitar], targetParty: [dragonite, tyranitar],
    move: Movepool.Spotlight, field, prefix: 'Your',
  })
  t.true(log.msg.includes('Opposing Tyranitar became the center of attention'))
  t.log(log.msg)
  t.truthy(field.sides.Opposing.target) // Is not undefined
  t.is(field.sides.Opposing.target?.species, 'Tyranitar')
  // Canonically the target is Dragonite
  log.push(attack({
    caster: aRaichu1, casters: [aRaichu1], casterParty: [aRaichu1],
    target: dragonite, targets: [dragonite, tyranitar], targetParty: [dragonite, tyranitar],
    move: Movepool.Thunderbolt, field, prefix: 'Your',
  }))
  t.is(dragonite.currentHp, dragonite.totalHp, 'Dragonite should be fine')
  t.not(tyranitar.currentHp, tyranitar.totalHp, 'Tyranitar should have taken damage')
  t.log(log.msg)

  // This needs to reset once Tyrantar faints
  tyranitar.currentHp = 0
  tyranitar.fainted = true
  log.push(attack({
    caster: aRaichu1, casters: [aRaichu1], casterParty: [aRaichu1],
    target: dragonite, targets: [dragonite, tyranitar], targetParty: [dragonite, tyranitar],
    move: Movepool.Thunderbolt, field, prefix: 'Your',
  }))
  t.not(dragonite.currentHp, dragonite.totalHp, 'Dragonite should be hit now')
  t.log(log.msg)
})

test('Hidden Power works', t => {
  const aRaichu1 = {...A_RAICHU_V1}
  const tyranitar = {...TYRANITAR}

  const field: Field = {
    naturePower: 'Normal',
    weather: Weathers.Sunny,
    trickRoom: 0,
    mudSport: 0,
    waterSport: 0,
    locationTerrain: 'Bay',
    wonderRoom: 0,
    magicRoom: 0,
    ions: false,
    sides: {
      Opposing: {
        lightscreen: 0,
        mist: 0,
        reflect: 0,
        tailwind: 0,
        firefield: 0,
        fusionElectric: false,
        fusionFire: false,
        marsh: 0,
        pledgeFire: false,
        pledgeGrass: false,
        pledgeWater: false,
        rainbow: 0,
        goldCoins: false,
        sharpSteel: false,
        stickyWeb: false,
        stealthRock: false,
        spikes: 0,
        toxicSpikes: 0,
      },
      Your: {
        lightscreen: 0,
        mist: 0,
        reflect: 0,
        tailwind: 0,
        firefield: 0,
        fusionElectric: false,
        fusionFire: false,
        marsh: 0,
        pledgeFire: false,
        pledgeGrass: false,
        pledgeWater: false,
        rainbow: 0,
        goldCoins: false,
        sharpSteel: false,
        stickyWeb: false,
        stealthRock: false,
        spikes: 0,
        toxicSpikes: 0,
      },
    },
  }

  // Hidden Power is used on Tyranitar
  attack({
    caster: aRaichu1, casters: [aRaichu1], casterParty: [aRaichu1],
    target: tyranitar, targets: [tyranitar], targetParty: [tyranitar],
    move: Movepool['Hidden Power'], field, prefix: 'Your',
  })
  t.truthy(aRaichu1['hiddenPowerType'], 'Hidden Power has no type!')
})

test('Amulet Coin is not eaten', t => {
  const aRaichu1 = {...A_RAICHU_V1}
  aRaichu1.heldItem = {...Inventory.oran}
  aRaichu1.heldItemConsumed = false
  aRaichu1.heldItemTotallyConsumed = false
  const tyranitar = {...TYRANITAR}
  tyranitar.heldItem = {...Inventory.amuletcoin}
  tyranitar.heldItemConsumed = false
  tyranitar.heldItemTotallyConsumed = false
  // Force Raichu to eat item
  aRaichu1.currentHp = 1
  aRaichu1.totalHp = 100

  const field: Field = {
    naturePower: 'Normal',
    weather: Weathers.Sunny,
    trickRoom: 0,
    mudSport: 0,
    waterSport: 0,
    locationTerrain: 'Bay',
    wonderRoom: 0,
    magicRoom: 0,
    ions: false,
    sides: {
      Opposing: {
        lightscreen: 0,
        mist: 0,
        reflect: 0,
        tailwind: 0,
        firefield: 0,
        fusionElectric: false,
        fusionFire: false,
        marsh: 0,
        pledgeFire: false,
        pledgeGrass: false,
        pledgeWater: false,
        rainbow: 0,
        goldCoins: false,
        sharpSteel: false,
        stickyWeb: false,
        stealthRock: false,
        spikes: 0,
        toxicSpikes: 0,
      },
      Your: {
        lightscreen: 0,
        mist: 0,
        reflect: 0,
        tailwind: 0,
        firefield: 0,
        fusionElectric: false,
        fusionFire: false,
        marsh: 0,
        pledgeFire: false,
        pledgeGrass: false,
        pledgeWater: false,
        rainbow: 0,
        goldCoins: false,
        sharpSteel: false,
        stickyWeb: false,
        stealthRock: false,
        spikes: 0,
        toxicSpikes: 0,
      },
    },
  }

  const noop = {...Movepool['Noop']}
  noop.power = 0
  noop.accuracy = Infinity
  const log = attack({
    caster: tyranitar, casters: [tyranitar], casterParty: [tyranitar],
    target: aRaichu1, targets: [aRaichu1], targetParty: [aRaichu1],
    move: noop, field, prefix: 'Your',
  })
  t.false(tyranitar.heldItemTotallyConsumed, `Tyranitar should not eat its coin: ${log.msg.join('|')}`)
  t.true(aRaichu1.heldItemTotallyConsumed, `Raichu eat its berry: ${log.msg.join('|')}`)
})

test('Defog then Weather Ball', t => {
  // Castform v2, see b/262306810
  const aRaichu1 = {...A_RAICHU_V1}
  const tyranitar = {...TYRANITAR}
  const field = {...FIELD_BAY}
  field.weather = {...Weathers.Fog}
  const log = attack({
    caster: tyranitar, casters: [tyranitar], casterParty: [tyranitar],
    target: aRaichu1, targets: [aRaichu1], targetParty: [aRaichu1],
    move: {...Movepool.Defog}, field, prefix: 'Your',
  })
  log.push(attack({
    caster: tyranitar, casters: [tyranitar], casterParty: [tyranitar],
    target: aRaichu1, targets: [aRaichu1], targetParty: [aRaichu1],
    move: {...Movepool['Weather Ball']}, field, prefix: 'Your',
  }))
  t.log(log)
  t.pass('Did not crash')
})

test('Slots: After KO, get next Pokemon', t => {
  const aRaichu1 = {...A_RAICHU_V1}
  const tyranitar = {...TYRANITAR}
  const magikarp = {...MAGIKARP}

  // 1 slot each - No TTar
  tyranitar.conditions = []
  t.falsy(getCondition(tyranitar, 'OnField'))
  magikarp.speed = aRaichu1.speed + 1 // Goes first
  const fissure = {...Movepool['Fissure']}
  fissure.accuracy = Infinity
  magikarp.movepool = [fissure]
  const location = Globe['US-MTV']
  // lol, get rekt
  const log = execute(
    [aRaichu1, tyranitar], [magikarp],
    battleOptions, location, battleRules
  )
  t.log(log)
  t.is(log.msg[8], 'You did well, Raichu. You deserve a long rest.')
  t.true(log.msg[9].includes('Tyranitar!'))
  t.true(log.msg.includes('All your Pokémon fainted!'))
})

test('Slots: Entry hazards on switch out', t => {
  const aRaichu1 = {...A_RAICHU_V1}
  const tyranitar = {...TYRANITAR}
  const magikarp = {...MAGIKARP}

  // 1 slot each - No TTar
  tyranitar.conditions = []
  t.falsy(getCondition(tyranitar, 'OnField'))
  aRaichu1.speed = 2
  magikarp.speed = 1 // Goes second
  const fissure = {...Movepool['Fissure']}
  fissure.accuracy = Infinity
  fissure.criticalHit = 0
  magikarp.move = ['Fissure', 'Spikes']
  magikarp.movepool = [fissure, Movepool['Spikes']]
  aRaichu1.move = ['Splash']
  aRaichu1.movepool = [Movepool.Splash]
  aRaichu1.conditions = [ConditionMap['OnField']]
  t.truthy(getCondition(aRaichu1, 'OnField'))
  const location = Globe['US-MTV']
  // should set spikes, then fissure, then ttar gets hurt
  const log = execute(
    [aRaichu1, tyranitar], [magikarp],
    battleOptions, location, battleRules
  )
  t.log(magikarp)
  t.log(aRaichu1)
  t.log(log)
  t.is(1, log.field.sides.Your.spikes)
  t.is(log.msg[2], 'Spikes scattered on the field.')
  t.true(log.msg[16].includes('Tyranitar!'))
  t.is(log.msg[17], "A trap of sharp spikes dug into the Tyranitar's feet.")
  t.is(log.msg[18], "Tyranitar: 100 -> 87")
  t.true(log.msg.includes('All your Pokémon fainted!'))
})

test('Slots: Switch-out moves work unless trapped', t => {
  const aRaichu1 = {...A_RAICHU_V1}
  const tyranitar = {...TYRANITAR}
  const magikarp = {...MAGIKARP}

  // 1 slot each - No TTar
  aRaichu1.conditions = [ConditionMap.OnField]
  tyranitar.fainted = false
  tyranitar.conditions = [ConditionMap.TrappedInBattle] // Doesn't apply until in-battle
  t.falsy(getCondition(tyranitar, 'OnField'))
  aRaichu1.speed = 2
  magikarp.speed = 1 // Goes second
  magikarp.movepool = [Movepool.Splash]
  aRaichu1.movepool = [Movepool['Parting Shot']]
  const voltSwitch = {...Movepool['Volt Switch']}
  voltSwitch.power = 0.1 // To prevent quick faints
  tyranitar.movepool = [voltSwitch]
  const location = Globe['US-MTV']
  // should set spikes, then fissure, then ttar gets hurt
  const log = new Log()
  log.push(execute(
    [aRaichu1, tyranitar], [magikarp],
    battleOptions, location, battleRules
  ))
  t.log(log)
  t.is(log.msg[6], "Magikarp's spAttack fell")
  t.is(log.msg[7], 'Raichu is getting out of Dodge!')
  t.is(log.msg[8], 'Thanks, Raichu.')
  t.true(log.msg[9].includes('Tyranitar!'))
  t.false(log.msg.includes('needs a recharge'), 'Tyranitar should not leave')
})

test('Dynamax Power', t => {
  t.is(1.5, maxMovePower(1.2, 0.8)) // Stone Edge
  t.is(1.3, maxMovePower(0.8, Infinity)) // Feint Attack
  t.is(1.25, maxMovePower(0.75, 1)) // Fell Stinger
  t.is(0, maxMovePower(0, Infinity)) // Splash
})

test('Dynamax', t => {
  const tyranitar = {...TYRANITAR} // Base form
  tyranitar.heldItemKey = 'dynamaxcandy'
  tyranitar.heldItem = Inventory.dynamaxcandy
  tyranitar.move = ['Stone Edge', 'Feint Attack']
  t.deepEqual(tyranitar.move, ['Stone Edge', 'Feint Attack'], 'Confirm initial moves')

  const maxLog = tyranitar.heldItem!.onBattleStart!(tyranitar, tyranitar, false)
  t.true(maxLog.msg.includes("Tyranitar dynamaxed!"), 'Tyranitar should grow up')
  t.deepEqual(tyranitar.move, ['Max Rockfall', 'Max Darkness'], 'Confirm DMax moves')
  t.is(200, tyranitar.totalHp)
  t.is(200, tyranitar.currentHp)
  t.log(tyranitar.movepool)
  t.is(1.5, tyranitar.movepool[0].power, `${tyranitar.movepool[0].name} should have different power`)
  t.is(1.3, tyranitar.movepool[1].power, `${tyranitar.movepool[1].name} should have different power`)
  t.is('Max Rockfall', tyranitar.movepool[0].name)

  const cond = tyranitar.conditions!.find(c => c.name === 'Dynamaxed')
  t.truthy(cond, 'Dynamaxed condition should exist')
  t.deepEqual(cond!.p!.moves, ['Stone Edge', 'Feint Attack'], 'Confirm initial moves')
})

test('Gigantamax', t => {
  const tyranitar = {...TYRANITAR} // Base form
  // Gigantamax shouldn't work
  tyranitar.heldItemKey = 'maxmushroom'
  tyranitar.heldItem = Inventory.maxmushroom
  tyranitar.move = ['Stone Edge', 'Feint Attack']
  t.deepEqual(tyranitar.move, ['Stone Edge', 'Feint Attack'], 'Confirm initial moves')

  const maxLog = tyranitar.heldItem!.onBattleStart!(tyranitar, tyranitar, false)
  t.log(maxLog)
  t.true(maxLog.msg.includes("Tyranitar does not like mushrooms"), 'Tyranitar has no GMax form')

  const lapras = {...LAPRAS_V4} // Base form
  // Gigantamax shouldn't work
  lapras.heldItemKey = 'maxmushroom'
  lapras.heldItem = Inventory.maxmushroom
  t.deepEqual(lapras.move, ['Blizzard', 'Surf', 'Sing'], 'Confirm initial moves')

  const gmaxLog = lapras.heldItem!.onBattleStart!(lapras, lapras, false)
  t.log(gmaxLog)
  t.log(lapras.movepool)
  t.true(gmaxLog.msg.includes("Lapras gigantamaxed!"), 'Lapras has a GMax form')
  t.is(1.5, lapras.movepool[0].power, `${lapras.movepool[0].name} should have different power`)
  t.is(1.6, lapras.movepool[1].power, `${lapras.movepool[1].name} should have different power`)
  t.deepEqual(lapras.move, ['G-Max Resonance', 'Max Geyser', 'Max Guard'], 'Confirm Gmax moves')
})

test('Dark Void should not penetrate Detect', t => {
  const aRaichu1 = {...A_RAICHU_V1}
  const tyranitar = {...TYRANITAR}
  const field = {...FIELD_BAY}
  field.weather = {...Weathers.Sunny}
  const log = attack({
    caster: tyranitar, casters: [tyranitar], casterParty: [tyranitar],
    target: aRaichu1, targets: [aRaichu1], targetParty: [aRaichu1],
    move: {...Movepool.Detect}, field, prefix: 'Your',
  })
  t.truthy(getCondition(tyranitar, 'Protect'), 'Tyranitar should be protecting itself')

  const darkVoid = {...Movepool['Dark Void']}
  darkVoid.accuracy = Infinity // Ensure it hits
  log.push(attack({
    caster: aRaichu1, casters: [aRaichu1], casterParty: [aRaichu1],
    target: tyranitar, targets: [tyranitar], targetParty: [tyranitar],
    move: darkVoid, field, prefix: 'Your',
  }))
  t.true(darkVoid.failed, 'Dark Void should have failed')
  t.falsy(tyranitar.status, 'Tyranitar should not have a status condition')
  t.log(log)
  t.pass('Did not crash')
})

test('Loaded Dice guarantees four hits', t => {
  const aRaichu1 = {...A_RAICHU_V1}
  const tyranitar = {...TYRANITAR}
  const field = {...FIELD_BAY}
  field.weather = {...Weathers.Sunny}
  const populationBomb = {...Movepool['Population Bomb']}
  populationBomb.accuracy = Infinity // Guarantee hit

  const minput1: MoveInput = {
    caster: aRaichu1, casters: [aRaichu1],
    target: tyranitar, targets: [tyranitar],
    field,
    move: populationBomb,
    prefix: 'Opposing',
    targetPrefix: 'Opposing',
    damage: 0,
  }

  const log = populationBomb.onBeforeMove!(minput1)
  t.log(log)
  t.true(populationBomb.power >= 0.4)
  t.true(populationBomb.power <= 2.2)

  // Equip dice
  aRaichu1.heldItemKey = 'loadeddice'
  log.push(populationBomb.onBeforeMove!(minput1))
  t.log(log)
  t.true(populationBomb.power >= 1)
  t.true(populationBomb.power <= 2.2)
})

test('Terastallization - Stab', t => {
  const aRaichu1 = {...A_RAICHU_V1}
  // Reset
  removeCondition(aRaichu1, 'Terastallized')
  removeCondition(aRaichu1, 'Stab')  
  const teraPsychic = Inventory.terapsychic
  const log = teraPsychic.onBattleStart!(aRaichu1, aRaichu1, false)
  t.log(log)
  const conditionTera = getCondition(aRaichu1, 'Terastallized')!
  const conditionsStab = aRaichu1.conditions.filter(c => c.name === 'Stab')
  t.is(1, conditionsStab.length)
  t.log(aRaichu1.conditions)
  t.truthy(conditionTera)
  t.truthy(conditionsStab)
  t.is('Raichu terastallized into a Psychic-type!', log.msg[0])
  t.is('Psychic', aRaichu1.type1)
  t.is(undefined, aRaichu1.type2)
  t.is('Psychic', conditionTera.p!.type)
  t.truthy(conditionTera.p!.stabTera)
})

test('Terastallization - Third Type', t => {
  const aRaichu1 = {...A_RAICHU_V1}
  // Reset
  removeCondition(aRaichu1, 'Terastallized')
  removeCondition(aRaichu1, 'Stab')
  const teraWater = Inventory.terawater
  const log = teraWater.onBattleStart!(aRaichu1, aRaichu1, false)
  t.log(log)
  const conditionTera = getCondition(aRaichu1, 'Terastallized')!
  const conditionsStab = aRaichu1.conditions.filter(c => c.name === 'Stab')
  t.truthy(conditionTera)
  t.truthy(conditionsStab)
  t.log(conditionTera)
  t.is('Raichu terastallized into a Water-type!', log.msg[0])
  t.is('Water', aRaichu1.type1)
  t.is(undefined, aRaichu1.type2)
  t.is('Water', conditionTera.p!.type)
  t.falsy(conditionTera.p!.stabTera)
})
