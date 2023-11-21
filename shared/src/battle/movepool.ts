import { Pokemon, Move, logDamage, Status, Stat, Log, logHeal, MoveInput, statBuff } from "./types"
import { StatusMap, StatusId, ConditionMap, ConditionId } from "./status"
import * as Pkmn from '../../../shared/src/pokemon'
import randomItem from "../random-item"
import { Weathers } from "./weather"
import { TerrainType, } from "../../../shared/src/locations-list"
import { Type, types } from "../../../shared/src/pokemon/types"
import { ITEMS, ItemId, BerryId } from "../../../shared/src/items-list"
import { MoveId } from '../../../shared/src/gen/type-move-meta'
import { getCondition, removeCondition } from './conditions'
import * as T from './terrain'
import { ZMoveEffects } from './zmoves'
import { typeMatchup } from "./matchup"

type Movepool = {
  [K: string]: Move
}

const nop = () => {
  return new Log()
}

const noop = (input: MoveInput) => {
  input.move.type = 'Status'
  return new Log()
}

/**
 * Boilerplate for Z-Moves, hard-coding certain universal properties:
 * - Accuracy
 * - Aoe
 * - Removes the Z-Move after use
 * - Critical hit*
 * - attackKey, defenseKey*
 * - power*
 *
 * Note that properties like power, atk/defKey may change depending on the
 * associated move. This will be programmed in when the Z-Crystal activates.
 * See `inventory.ts`.
 *
 * @param move Customizable properties of a Z-Move
 * @returns A fully-fledged move
 */
export const zMove = (move: Partial<Move>): Move => {
  move.accuracy = Infinity
  if (move.criticalHit === undefined) {
    move.criticalHit = 1
  }
  if (move.attackKey === undefined) {
    move.attackKey = 'attack'
  }
  if (move.defenseKey === undefined) {
    move.defenseKey = 'defense'
  }
  if (move.power === undefined) {
    move.power = 2 /* Base 180 */
  }
  if (move.aoe === undefined) {
    move.aoe = 'Single Opponent'
  }
  move.hide = true
  move.isZMove = true
  const mOBM = move.onBeforeMove
  const mOAM = move.onAfterMove
  move.onBeforeMove = (inp) => {
    const log = new Log()
    log.add(`The player's Z-Ring is shining brightly.`)
      .add(`${inp.caster.species} is doing a dance!`)
    log.push(mOBM?.(inp))
    if (getCondition(inp.target, 'Protect')) {
      // Break through Protect
      removeCondition(inp.target, 'Protect')
      log.add(`${inp.target.species} was only partially protected`)
      inp.move.power /= 4 // Reduce power to 25% of original
    }
    return log
  }
  move.onAfterMove = (inp) => {
    const log = new Log()
    log.push(mOAM?.(inp))
    log.debug('The Z-Move to be used up: ' + inp.caster.move)
    inp.caster.move.splice(0, 1)
    inp.caster.movepool.splice(0, 1)
    inp.caster.heldItemConsumed = true
    if (move.zMoveFx) {
      log.push(ZMoveEffects[move.zMoveFx](inp))
    }
    log.debug('The Z-Move was used up: ' + inp.caster.move)
    return log
  }
  return move as Move
}

const Burn = (input: MoveInput, odds = 1) => {
  if (input.target.type1 !== 'Fire' && input.target.type2 !== 'Fire') {
    if (Math.random() < odds) {
      return APPLY_STATUS(input.target, 'Burn',
        `${input.target.species} was burned!`)
    }
  }
  if (odds === 1) {
    return new Log().add('It had no effect.')
  }
  return new Log()
}

const Confuse = (input: MoveInput, odds = 1) => {
  if (Math.random() < odds) {
    return APPLY_TEMP_STATUS(input.target, ConditionMap.Confusion,
      `${input.target.species} became confused!`)
  }
  return new Log()
}

const Flinch = (input: MoveInput, odds = 1) => {
  if (Math.random() < odds) {
    return APPLY_TEMP_STATUS(input.target, ConditionMap.Flinch)
  }
  return new Log()
}

const Freeze = (input: MoveInput, odds = 1) => {
  if (input.field.weather.name === 'Heat Wave') {
    return new Log() // Cannot freeze in harsh sunlight
  }
  if (input.target.type1 !== 'Ice' && input.target.type2 !== 'Ice') {
    if (Math.random() < odds) {
      return APPLY_STATUS(input.target, 'Frozen',
        `${input.target.species} became frozen!`)
    }
  }
  return new Log()
}

const Sleep = (input: MoveInput, odds = 1) => {
  if (Math.random() < odds) {
    return APPLY_STATUS(input.target, 'Asleep',
      `${input.target.species} fell asleep!`)
  }
  return new Log()
}

const Paralyze = (input: MoveInput, odds = 1) => {
  const { target } = input
  if (target.type1 !== 'Electric' && target.type2 !== 'Electric') {
    if (Math.random() < odds) {
      return APPLY_STATUS(target, 'Paralyzed',
        `${target.species} became paralyzed! It may be unable to move.`)
    }
  }
  return new Log()
}

const Poison = (input: MoveInput, odds = 1) => {
  const { target } = input
  if (target.type1 !== 'Poison' && target.type2 !== 'Poison') {
    if (Math.random() < odds) {
      return APPLY_STATUS(target, 'Poison',
        `${target.species} was poisoned!`)
    }
  }
  return new Log()
}

const RECHARGE = (input: MoveInput): Log => {
  const {caster} = input
  return APPLY_TEMP_STATUS(caster, {...ConditionMap.Recharge}, `${caster.species} needs to cool down.`)
}

const HIT_MANY = (move: Move, mult: number, min: number, max: number): Log => {
  const times = Math.floor(Math.random() * (max - min)) + min
  move.power = mult * times
  return new Log().add(`Hit ${times} times!`)
}

const statMgs = {
  [-3]: 'dropped severely',
  [-2]: 'dropped sharply',
  [-1]: 'fell',
  0: '',
  1: 'rose',
  2: 'rose sharply',
  3: 'rose dramatically',
}

export const BUFF_STAT = (caster: Pokemon, input: MoveInput, stat: Stat, stages = 1): Log => {
  const { field } = input
  const log = new Log()
  if (field?.sides[input.targetPrefix]?.mist && stages < 0) {
    log.add('The mist prevents stats from being lowered.')
    return log // Exit early
  }
  if (caster.statBuffs[stat] >= 6 && stages > 0) {
    log.add(`${caster.species}'s ${stat} won't go any higher!`)
    return log
  }
  if (caster.statBuffs[stat] <= -6 && stages < 0) {
    log.add(`${caster.species}'s ${stat} won't go any lower!`)
    return log
  }
  caster.statBuffs[stat] += stages
  // Clamp -6 <= stat <= 6
  caster.statBuffs[stat] = Math.max(-6, Math.min(6, caster.statBuffs[stat]))
  log.add(`${caster.species}'s ${stat} ${statMgs[stages]}`)
  return log
}

export const BUFF_ALL = (input: MoveInput, odds = 0.17, stages = 1): Log => {
  const {caster} = input
  if (Math.random() < odds) {
    // Do not create a message for every stat
    BUFF_STAT(caster, input, 'attack', stages)
    BUFF_STAT(caster, input, 'defense', stages)
    BUFF_STAT(caster, input, 'spAttack', stages)
    BUFF_STAT(caster, input, 'spDefense', stages)
    BUFF_STAT(caster, input, 'speed', stages)
    return new Log().add(`All of ${caster.species}'s stats ${statMgs[stages]}!`)
  }
  return new Log()
}

const AtkBuff = (caster: Pokemon, input: MoveInput, odds = 1) => {
  if (Math.random() < odds) {
    return BUFF_STAT(caster, input, 'attack')
  }
  return new Log()
}

const AtkNerf = (caster: Pokemon, input: MoveInput, odds = 1) => {
  if (Math.random() < odds) {
    return BUFF_STAT(caster, input, 'attack', -1)
  }
  return new Log()
}

const DefBuff = (caster: Pokemon, input: MoveInput, odds = 1) => {
  if (Math.random() < odds) {
    return BUFF_STAT(caster, input, 'defense')
  }
  return new Log()
}

const DefNerf = (caster: Pokemon, input: MoveInput, odds = 1) => {
  if (Math.random() < odds) {
    return BUFF_STAT(caster, input, 'defense', -1)
  }
  return new Log()
}

// const SpdBuff = (caster: Pokemon, input: MoveInput, odds = 1) => {
//   if (Math.random() < odds) {
//     return BUFF_STAT(caster, input, 'spDefense')
//   }
//   return new Log()
// }

const SpdNerf = (caster: Pokemon, input: MoveInput, odds = 1) => {
  if (Math.random() < odds) {
    return BUFF_STAT(caster, input, 'spDefense', -1)
  }
  return new Log()
}

const SpaBuff = (caster: Pokemon, input: MoveInput, odds = 1) => {
  if (Math.random() < odds) {
    return BUFF_STAT(caster, input, 'spAttack')
  }
  return new Log()
}

const SpaNerf = (caster: Pokemon, input: MoveInput, odds = 1) => {
  if (Math.random() < odds) {
    return BUFF_STAT(caster, input, 'spAttack', -1)
  }
  return new Log()
}

// const SpeBuff = (caster: Pokemon, input: MoveInput, odds = 1) => {
//   if (Math.random() < odds) {
//     return BUFF_STAT(caster, input, 'speed')
//   }
//   return new Log()
// }

const SpeNerf = (caster: Pokemon, input: MoveInput, odds = 1) => {
  if (Math.random() < odds) {
    return BUFF_STAT(caster, input, 'speed', -1)
  }
  return new Log()
}

const RECOIL = (input: MoveInput, rate: number): Log => {
  const {caster, damage} = input
  const log = logDamage(caster, damage! / rate)
  log.add(`${caster.species} took damage in recoil`)
  return log
}

const DOUBLE_IF_ITEM = (input: MoveInput) => {
  const {target, move} = input
  if (!target.heldItem || target.heldItemConsumed) {
    move.power *= 2
  }
  return new Log()
}

const DOUBLE_IF_PINCH = (input: MoveInput) => {
  const {target, move} = input
  if (target.currentHp * 2 <= target.totalHp) {
    move.power *= 2
  }
  return new Log()
}

const POWER_BY_HP = (input: MoveInput) => {
  const {caster, move} = input
  const ratio = caster.currentHp / caster.totalHp
  move.power = 1.75 * ratio
  return new Log()
}

const FORCE_CONSUME = (inp: MoveInput, msg: string) => {
  if (inp.target.heldItem && !inp.target.heldItemConsumed) {
    // Nom nom
    inp.target.heldItem.onCasterMove?.(inp, false)
    inp.target.heldItem.onTargetMove?.(inp.caster, inp.target, inp.move, false)
    inp.target.heldItemConsumed = true
    const itemLookup = ITEMS[inp.target.heldItemKey!]
    const hiLabel = itemLookup.label ?? inp.target.heldItemKey
    const log = new Log().add(`${inp.caster.species} ${msg} ${inp.target.species}'s ${hiLabel}!`)
    if (itemLookup.category !== 'berry') {
      log.add(`${inp.caster.species} spit the ${hiLabel} back out, as it is not actually food.`)
      log.add(`That's really gross.`)
      log.add(`Looks like it will need a deep clean. Better not use it for the rest of the battle.`)
    }
    return log
  }
  return new Log()
}

const multiTurnOnBeforeMove = (inp: MoveInput, status: ConditionId, startMsg: string, endMsg: string): Log => {
  const {caster, target, move, field, targetPrefix} = inp
  const condition = getCondition(caster, status)
  const hasPowerHerb = caster.heldItemKey === 'powerherb' && !caster.heldItemConsumed
  const log = new Log()
  move['canonicaltarget'] = target
  if (!condition && !hasPowerHerb) {
    move['turnone'] = true
    move['startMsg'] = startMsg
    move.power = 0
    move.accuracy = Infinity
    move.aoe = 'Self'
    return log
  } else if (hasPowerHerb) {
    log.add(startMsg)
    log.add(`${caster.species} powered up with the Power Herb`)
    caster.heldItemConsumed = true
    caster.heldItemTotallyConsumed = true
  }
  if (move['canonicaltarget']) {
    field.sides[targetPrefix].target = move['canonicaltarget']
  }
  removeCondition(caster, status) // Reset
  log.add(`${caster.species} ${endMsg}`)
  return log
}

const multiTurnOnAfterMove = (inp: MoveInput, status: ConditionId) => {
  const {move, caster} = inp
  if (move['turnone']) {
    // If you started the move correctly, ie. not paralyzed, set the status
    // after move execution.
    return APPLY_TEMP_STATUS(caster, {...ConditionMap[status]},
      `${caster.species} ${move['startMsg']}`)
  }
  return new Log()
}

/**
 * Nerf behavior for OHKO moves, particularly in raids.
 * @param inp MoveInput params
 */
const ohko = (inp: MoveInput) => {
  const {move, target, caster} = inp
  if (getCondition(target, 'Raid')) {
    move.accuracy /= 1.5 // Make it less likely to hit
    move.power = 10 // Fix power to make it not actually a knock out
  }
  if (getCondition(target, 'Raid Protect')) {
    move.power = 3 // Fix power
  }
  if (move.type === 'Ice' && (target.type1 === 'Ice' || target.type2 === 'Ice')) {
    move.accuracy = 0 // Sheer Cold fails on Ice-types
    return new Log().debug('Cannot hit ice types')
  }
  if (move.type === 'Ice' && !(caster.type1 === 'Ice' || caster.type2 === 'Ice')) {
   // 10% accuracy drop if Sheer Cold user is not Ice-type.
    const log = new Log().debug('Acc: ' + move.accuracy)
    move.accuracy -= .1
    log.debug('New acc: ' + move.accuracy)
    return log
  }
  return new Log()
}

const weatherDependentHeal = (inp: MoveInput) => {
  // This move recovers its HP depending upon the weather.
  // If no weather is in effect, it heals the user by 50% of their maximum
  // Hit Points. If Sunny Day is in effect, this move heals the user by 66.66%
  // of its maximum Hit Points and if Rain Dance, Hail or Sandstorm is in
  // effect, this move heals the user by 25% of their maximum Hit Points.
  const {field, caster} = inp
  if (field.weather.name === 'Heat Wave') {
    return logHeal(caster, caster.totalHp * 0.67)
  }
  if (['Hail', 'Rain', 'Sandstorm', 'Fog'].includes(field.weather.name)) {
    return logHeal(caster, caster.totalHp / 4)
  }
  return logHeal(caster, caster.totalHp / 2)
}

const setTerrain = (inp: MoveInput, terrain: T.TerrainType) => {
  inp.field.terrain = T.Terrains[terrain]
  return new Log().add(`A surge of ${terrain} energy covered the field.`)
}

/**
 * Specific type of logHeal for draining moves which incorporates logic for
 * those holding the Big Root item.
 */
const logDrain = (caster: Pokemon, damage: number, ratio: number) => {
  let healHp = damage / ratio
  if (caster.heldItemKey === 'bigroot' && !caster.heldItemConsumed && !caster.heldItemTotallyConsumed) {
    healHp *= 1.3
  }
  return logHeal(caster, healHp)
}

export const APPLY_STATUS = (target: Pokemon, status: StatusId, msg?: string) => {
  if (!target.status) {
    target.status = {...StatusMap[status]}
    const log = new Log()
    const activationLog = target.status.onActivation?.(target) || new Log()
    if (activationLog) {
      log.push(activationLog)
    }
    log.add(msg)
    return log
  }
  return new Log()
}

export const APPLY_TEMP_STATUS = (target: Pokemon, status: Status, msg?: string) => {
  if (!target.conditions) {
    // New array
    target.conditions = []
  }
  // Check if we have this condition
  const index = target.conditions
      .findIndex(condition => condition.name === status.name)
  if (index !== -1) {
    return new Log()
  }
  status.turnsActive = 0
  target.conditions.push({...status})
  const log = new Log()
  const activationLog = status.onActivation?.(target) || new Log()
  if (activationLog) {
    log.push(activationLog)
  }
  log.add(msg)
  return log
}

const applyStaticDamage = (target: Pokemon, damage: number, input: MoveInput) => {
  if (getCondition(target, 'Raid Protect')) {
    const log = logDamage(target, 2) /* Hard-coded 2pt dmg */
    // Placeholder move to break a shield layer
    log.push(getCondition(target, 'Raid Protect')?.onTargetMove?.(input))
    return log
  } else {
    return logDamage(target, damage)
  }
}

const failsIfGravity = (inp: MoveInput) => {
  if (getCondition(inp.caster, 'Grounded')) {
    inp.move.failed = true
    return new Log().add(`${inp.caster.species} cannot get off the ground`)
  }
  return new Log()
}

export const Movepool: Movepool = {
  'Absorb': {
    name: 'Absorb',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.4,
    type: 'Grass',
    flavor: 'The user drains the target of some energy.',
    aoe: 'Single Opponent',
    onAfterMove: ({caster, target, damage}) => {
      const log = logDrain(caster, damage!, 2)
      log.add(`${target.species} had its energy drained`)
      return log
    }
  },
  'Accelerock': {
    name: 'Accelerock',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.6,
    type: 'Rock',
    priority: 1,
    flavor: 'The user strikes the opponent with a rock of ever-increasing velocity.',
    aoe: 'Single Opponent', contact: true,
  },
  Acid: {
    name: 'Acid',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.6,
    type: 'Poison',
    flavor: 'Opponents are hit by an acid spray which may lower Special Defense.',
    aoe: 'Nearby Opponents',
    onAfterMove: (inp) => SpdNerf(inp.target, inp, 0.1),
  },
  'Acid Armor': {
    name: 'Acid Armor',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Poison',
    flavor: 'The user covers itself in an acidic coating, sharply raising Defense.',
    aoe: 'Self', zMoveFx: 'ResetStat',
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'defense', 2),
  },
  'Acid Spray': {
    name: 'Acid Spray',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.6,
    type: 'Poison',
    flavor: `A burst of acid lowers the opponent's special defense.`,
    aoe: 'Single Opponent',
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'spDefense', -2),
  },
  Acrobatics: {
    name: 'Acrobatics',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.75,
    type: 'Flying',
    flavor: 'A nimble strike whose attacking power doubles if the user does not have an item.',
    aoe: 'Single Opponent',
    contact: true,
    onBeforeMove: DOUBLE_IF_ITEM,
  },
  Acupressure: {
    name: 'Acupressure',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Normal',
    flavor: 'A pressure point is pressed on an ally which will sharply increase a random stat.',
    aoe: 'Single Ally', zMoveFx: 'CriticalHit',
    onBeforeMove: noop,
    onAfterMove: (input) => {
      const randomStat = randomItem<Stat>([
        'attack', 'defense', 'spAttack', 'spDefense', 'speed'
      ])
      return BUFF_STAT(input.target, input, randomStat, 2)
    }
  },
  'Aerial Ace': {
    name: 'Aerial Ace',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.8,
    type: 'Flying',
    flavor: 'A flying strike that never misses.',
    aoe: 'Single Opponent', contact: true,
  },
  Aeroblast: {
    name: 'Aeroblast',
    accuracy: 0.95,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 2,
    power: 1.2,
    type: 'Flying',
    flavor: 'The target is hit by a vortex of air.',
    aoe: 'Single Opponent',
  },
  Agility: {
    name: 'Agility',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Psychic',
    flavor: 'The user sharply boosts their speed.',
    aoe: 'Self', zMoveFx: 'ResetStat',
    onAfterMove: (input) => BUFF_STAT(input.caster, input, 'speed', 2),
  },
  'Air Cutter': {
    name: 'Air Cutter',
    accuracy: 0.95,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 2,
    power: 0.8,
    type: 'Flying',
    flavor: 'Razor-sharp blades of wind strike the opponent.',
    aoe: 'Nearby Opponents',
  },
  'Air Slash': {
    name: 'Air Slash',
    accuracy: 0.95,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.95,
    type: 'Flying',
    flavor: 'Slices of air are hit by the opponent. It may cause a flich.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Flinch(inp, 0.3)
  },
  // Note: Since target selection specifies the Pokemon themselves instead of
  // slots, this won't really matter in the vast majority of moves where it
  // might have an effect in the main series.
  'Ally Switch': {
    name: 'Ally Switch', type: 'Psychic',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0,
    aoe: 'Self',
    flavor: 'Using a teleportative power, this Pokémon switches spots with an ally.',
    onBeforeMove: (inp) => {
      if (inp.casters.length <= 1) {
        inp.move.failed = true
        return new Log().add('You cannot switch with yourself...')
      }
      inp.move.type = 'Status'
      return new Log()
    },
    onAfterMove: (inp) => {
      // This has a possibility to get a false positive
      const casterIndex = inp.casters.findIndex(c => c.badge.toString() === inp.caster.badge.toString())
      if (casterIndex === -1) {
        return new Log().add('Something went wrong...')
      }
      if (casterIndex === 0 || casterIndex === 1) {
        // Switch to 1
        const casterTemp = inp.casters[0]
        inp.casters[0] = inp.casters[1]
        inp.casters[1] = casterTemp
        return new Log().add(`${inp.prefix} ${inp.casters[0].species} and ${inp.casters[1].species} swapped`)
      }

      // Switch to spot 0
      const casterTemp = inp.casters[casterIndex]
      inp.casters[casterIndex] = inp.casters[0]
      inp.casters[0] = casterTemp
      return new Log().add(`${inp.prefix} ${inp.casters[0].species} and ${inp.casters[casterIndex].species} swapped`)
    }
  },
  Amnesia: {
    name: 'Amnesia',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Psychic',
    flavor: 'The user forgets how to be hit by special attacks. Their special defense rises.',
    aoe: 'Self', zMoveFx: 'ResetStat',
    onAfterMove: (input) => BUFF_STAT(input.caster, input, 'spDefense', 2),
  },
  'Anchor Shot': {
    name: 'Anchor Shot',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Steel',
    flavor: 'The target becomes tangled by the chain of an anchor.',
    aoe: 'Self',
    onAfterMove: ({target}) => {
      return APPLY_TEMP_STATUS(target, ConditionMap.TrappedInBattle,
        `${target.species} is trapped in the battle.`)
    }
  },
  'Ancient Power': {
    name: 'Ancient Power',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.8,
    type: 'Rock',
    flavor: 'The opponent is hit by fossilized rocks extracted through mystical power.',
    aoe: 'Single Opponent',
    onAfterMove: BUFF_ALL
  },
  'Apple Acid': {
    name: 'Apple Acid', type: 'Grass',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    accuracy: 1, criticalHit: 1, power: 1,
    flavor: 'The user splashes the target with tart apple juice. The target\'s special defense drops.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'spDefense', -1),
  },
  'Aqua Cutter': {
    name: 'Aqua Cutter',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 2,
    power: 0.9,
    type: 'Water',
    flavor: 'The user strikes with the power of pressurized water. Critical hits are likely.',
    aoe: 'Single Opponent',
  },
  'Aqua Jet': {
    name: 'Aqua Jet',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.6,
    type: 'Water',
    priority: 1,
    flavor: 'A swift tackle in a watery covering. This move goes quickly.',
    aoe: 'Single Opponent',
    contact: true,
  },
  'Aqua Ring': {
    name: 'Aqua Ring',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Water',
    flavor: 'The user wraps itself in a watery cover that slowly heals over time.',
    aoe: 'Self', zMoveFx: 'DefBuff1',
    onAfterMove: ({caster}) => {
      APPLY_TEMP_STATUS(caster, ConditionMap['Aqua Rung'])
      return new Log().add(`${caster.species} covered itself in a watery veil`)
    }
  },
  'Aqua Step': {
    name: 'Aqua Step', type: 'Water',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1, accuracy: 1, criticalHit: 1,
    flavor: 'The user strikes with splashingly good dance moves. This raises its speed.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'speed', 1)
  },
  'Aqua Tail': {
    name: 'Aqua Tail',
    accuracy: 0.9,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.2,
    type: 'Water',
    flavor: 'The opponent is struck by a tail of water.',
    aoe: 'Single Opponent',
    contact: true,
  },
  'Arm Thrust': {
    name: 'Arm Thrust', type: 'Fighting',
    attackKey: 'attack', defenseKey: 'defense', aoe: 'Single Opponent', contact: true,
    power: 0.75, accuracy: 1, criticalHit: 1,
    flavor: 'The user attacks with its arms multiple times in a row.',
    onBeforeMove: ({move}) => HIT_MANY(move, 0.15, 2, 5),
  },
  'Armor Cannon': {
    name: 'Armor Cannon',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.4,
    type: 'Fire',
    flavor: 'The user draws fire from its body and launches. The damage is immense, but its own defenses lower.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => {
      const log = new Log()
      log.push(BUFF_STAT(inp.caster, inp, 'defense', -1))
      log.push(BUFF_STAT(inp.caster, inp, 'spDefense', -1))
      return log
    }
  },
  Aromatherapy: {
    name: 'Aromatherapy', type: 'Grass', aoe: 'All Allies',
    attackKey: 'attack', defenseKey: 'defense', recovery: true,
    power: 0, criticalHit: 0, accuracy: Infinity, zMoveFx: 'Heal',
    flavor: `A strong floral aroma wafts through the user's allies, healing their status conditions.`,
    onAfterMove: ({target}) => {
      const log = new Log()
      if (target.status) {
        log.add(`${target.species} is no longer ${target.status.name}`)
        target.status = undefined
        removeCondition(target, 'PoisonBad')
      }
      return log
    }
  },
  'Aromatic Mist': {
    name: 'Aromatic Mist', type: 'Fairy', aoe: 'Single Ally',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: Infinity, zMoveFx: 'SpDefBuff2',
    flavor: 'A sweet-smelling mist wafts over an ally, boosting their special defense.',
    onBeforeMove: noop,
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'spDefense', 1),
  },
  Assurance: {
    name: 'Assurance', type: 'Dark',
    attackKey: 'attack', defenseKey: 'defense', aoe: 'Single Opponent',
    accuracy: 1, criticalHit: 1, power: 0.7,
    flavor: 'The user assures the target faints. If the target has already taken damage this turn, the power of the attack is doubled.',
    onBeforeMove: ({target, move}) => {
      if (getCondition(target, 'Already Hit')) {
        move.power *= 2
      }
      return new Log()
    }
  },
  Astonish: {
    name: 'Astonish',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.5,
    type: 'Ghost',
    flavor: 'The opponent is spooked by a screaming tackle. They may flinch.',
    aoe: 'Single Opponent',
    contact: true,
    onAfterMove: (inp) => Flinch(inp, 0.3),
  },
  'Astral Barrage': {
    name: 'Astral Barrage', type: 'Ghost',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.4, accuracy: 1, criticalHit: 1,
    aoe: 'Nearby Opponents',
    flavor: 'The user unleashes nightmarish ghostly energy at opposing Pokémon.',
  },
  'Attack Order': {
    name: 'Attack Order',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 2,
    power: 1.1,
    type: 'Bug',
    flavor: 'The order is given. The underlings will attack. A critical hit is possible.',
    aoe: 'Single Opponent',
  },
  Attract: {
    name: 'Attract', type: 'Normal',
    defenseKey: 'defense', attackKey: 'attack',
    accuracy: 1, criticalHit: 0, power: 0,
    aoe: 'Single Opponent', zMoveFx: 'ResetStat',
    flavor: 'Causes the target to become infatuated.',
    onBeforeMove: (inp) => {
      const genderCaster = inp.caster.badge.personality.gender
      const genderTarget = inp.target.badge.personality.gender
      if (genderCaster !== '' && genderTarget !== '' && genderCaster === genderTarget) {
          inp.move.failed = true
          return new Log().add('It has no effect...')
      }
      return new Log()
    },
    onAfterMove: (inp) => APPLY_TEMP_STATUS(inp.target, ConditionMap.Infatuated,
      `${inp.target.species} fell in love.`)
  },
  'Aura Sphere': {
    name: 'Aura Sphere',
    accuracy: Infinity,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1,
    type: 'Fighting',
    flavor: 'The power of aura is bundled into a sphere and launched at the opponent. It cannot miss.',
    aoe: 'Single Opponent',
  },
  'Aura Wheel': {
    name: 'Aura Wheel', type: 'Electric',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.3, accuracy: 1, criticalHit: 1,
    aoe: 'Single Opponent',
    flavor: 'The user charges up a attack using energy in its cheeks. The type depends on its form.',
    onGetType: (caster) => {
      if (caster.badge.personality.form === 'hangry') {
        return 'Dark'
      }
      return 'Electric'
    },
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'speed', 1),
  },
  'Aurora Beam': {
    name: 'Aurora Beam',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.85,
    type: 'Ice',
    flavor: 'A beam of cold colorful air hits the opponent. It might lower attack.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => AtkNerf(inp.target, inp, 0.1)
  },
  'Aurora Veil': {
    name: 'Aurora Veil',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Ice',
    flavor: 'The user creates a beautiful aurora backdropped by the snow, protecting its side of the field.',
    aoe: 'Self', zMoveFx: 'SpdBuff1',
    onBeforeMove: ({move, field}) => {
      if (field.weather.weatherBall !== 'Ice') {
        move.failed = true
      }
      return new Log()
    },
    onAfterMove: ({caster, field, prefix}) => {
      const turns = caster.heldItemKey === 'lightclay' ? 8 : 5
      field.sides[prefix].reflect = turns
      field.sides[prefix].lightscreen = turns
      const log = new Log()
      log.add('A colorful veil surrounded the Pokémon and its allies')
      return log
    }
  },
  Autotomize: {
    name: 'Autotomize',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Steel',
    flavor: 'The user starts shedding pieces in an attempt to go faster. Its speed sharply rises.',
    aoe: 'Self', zMoveFx: 'ResetStat',
    onAfterMove: (inp) => {
      inp.caster.weight = Math.max(.1, inp.caster.weight-100) /* Lose up to 100 kg */
      return BUFF_STAT(inp.caster, inp, 'speed', 2)
    },
  },
  Avalanche: {
    name: 'Avalanche', type: 'Ice',
    attackKey: 'attack', defenseKey: 'defense', aoe: 'Single Opponent',
    accuracy: 1, criticalHit: 1, power: 0.8, priority: -4,
    flavor: 'The user attack with a snowy crash. If it was hit this turn, the power doubles.',
    onBeforeMove: ({caster, move}) => {
      if (getCondition(caster, 'Already Hit')) {
        move.power *= 2
      }
      return new Log()
    }
  },
  'Axe Kick': {
    name: 'Axe Kick',
    accuracy: 0.9,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.7,
    type: 'Fighting',
    flavor: 'The user jumps in the air and thrusts its heel at the target. If it misses, it gets hurt. It is hits, the opponent might become confused.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: (inp) => {
      return failsIfGravity(inp)
    },
    onAfterMove: (inp) => Confuse(inp, 0.3),
    onMiss: ({caster}) => {
      const log = new Log()
      log.add(`${caster.species} kept going and crashed!`)
      log.push(logDamage(caster, caster.totalHp / 6))
      return log
    }
  },
  'Baby-Doll Eyes': {
    name: 'Baby-Doll Eyes', type: 'Fairy',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: 1,
    priority: 1, aoe: 'Single Opponent', zMoveFx: 'DefBuff1',
    flavor: `A feint that appeals to the target's sense of empathy. This move goes first.`,
    onBeforeMove: noop,
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'attack', -1)
  },
  'Baneful Bunker': {
    name: 'Baneful Bunker', type: 'Poison',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, power: 0, criticalHit: 0,
    priority: 4,
    aoe: 'Self', zMoveFx: 'DefBuff1',
    flavor: 'The user protects itself with its barbs. If the target strikes head-on, it will be poisoned.',
    onAfterMove: (inp) => APPLY_TEMP_STATUS(inp.caster, ConditionMap.ProtectBunker,
      `${inp.caster.species} protected itself`)
  },
  'Barb Barrage': {
    name: 'Barb Barrage', type: 'Poison',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    accuracy: 1, criticalHit: 1, power: 0.8,
    flavor: 'The user launches tiny poison barbs. The damage doubles if the target is already poisoned.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => {
      if (inp.target.status?.name === 'Poison') {
        inp.move.power *= 2
      }
      return Poison(inp, 0.5)
    }
  },
  'Barrage': {
    name: 'Barrage', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense', aoe: 'Single Opponent',
    power: 0.95, accuracy: 0.85, criticalHit: 1,
    flavor: 'The target is assaulted by egg-like objects several times in a row.',
    onBeforeMove: ({move}) => HIT_MANY(move, 0.15, 2, 5),
  },
  'Barrier': {
    name: 'Barrier',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Psychic',
    flavor: 'The user raises its defense sharply with a clear barrier.',
    aoe: 'Self', zMoveFx: 'ResetStat',
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'defense', 2)
  },
  'Beak Blast': {
    name: 'Beak Blast', type: 'Flying',
    attackKey: 'attack', defenseKey: 'defense', priority: -3,
    accuracy: 1, criticalHit: 1, power: 1.2,
    flavor: 'The user takes a turn to start burning. Anyone striking at that time will be burned. Then it unleashes its own attack.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({caster, move}) => {
      const beaking = getCondition(caster, 'Beaking')
      const log = new Log()
      if (!beaking) {
        move.failed = true
        return APPLY_TEMP_STATUS(caster, ConditionMap.Beaking)
      }
      log.add(`${caster.species} finally strikes!`)
      removeCondition(caster, 'Beaking')
      return log
    },
  },
  'Beat Up': {
    name: 'Beat Up', type: 'Dark',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 1, criticalHit: 1, power: 1,
    flavor: "All of the user's allies come together to deal massive damage to an unlucky target.",
    aoe: 'Random Opponent', contact: true,
    onBeforeMove: ({casters, move}) => {
      let basePower = 0.3
      const eligiblePartners = casters.filter(c => !c.fainted)
      for (const c of eligiblePartners) {
        // Pokemon X base attack = 100
        // const cPower = c.attack / 10 + 5
        // ^-- In-game calculation, would add 15
        basePower += c.attack / 1000 + 0.05
        // ^-- PotW calculation, would add 0.15
      }
      move.power = basePower
      return new Log().add(`The attack struck ${eligiblePartners.length} time(s)`)
    },
  },
  'Behemoth Bash': {
    name: 'Behemoth Bash', type: 'Steel',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.2, accuracy: 1, criticalHit: 1,
    flavor: 'The user slams into the target with its shield. If they are dynamaxed, more damage is done.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({target, move}) => {
      if (getCondition(target, 'Dynamaxed')) {
        move.power *= 2
      }
      return new Log()
    }
  },
  'Behemoth Blade': {
    name: 'Behemoth Blade', type: 'Steel',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.2, accuracy: 1, criticalHit: 1,
    flavor: 'The user slashes the target with its sword. If they are dynamaxed, more damage is done.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({target, move}) => {
      if (getCondition(target, 'Dynamaxed')) {
        move.power *= 2
      }
      return new Log()
    }
  },
  Belch: {
    name: 'Belch', type: 'Poison',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.4, accuracy: 0.9, criticalHit: 1,
    aoe: 'Single Opponent',
    flavor: `The user consumes its berry. It doesn't go down well. In fact it comes up in a huge burst of gas.`,
    onBeforeMove: ({caster, move}) => {
      const log = new Log()
      if (!caster.heldItem) {
        log.add(`It failed...`)
        move.failed = true
      }
      const key = caster.heldItemKey!
      if (ITEMS[key].category !== 'berry') {
        log.add('It failed...')
        move.failed = true
      }
      if (caster.heldItemConsumed) {
        log.add('It failed...')
        move.failed = true
      }
      return log
    },
    onAfterMove: ({caster}) => {
      caster.heldItemConsumed = true
      caster.heldItemTotallyConsumed = true
      return new Log()
    }
  },
  'Belly Drum': {
    name: 'Belly Drum',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Normal',
    flavor: 'The user cuts its HP in half to maximize its attack.',
    aoe: 'Self', zMoveFx: 'Heal',
    onBeforeMove: ({caster, move}) => {
      const log = new Log()
      if (caster.currentHp <= caster.totalHp / 2) {
        move.failed = true
        log.add(`${caster.species} is too weak`)
      }
      return log
    },
    onAfterMove: ({caster}) => {
      caster.statBuffs.attack = 6
      const log = logDamage(caster, caster.totalHp / 2)
      log.add(`${caster.species} cut its HP and maximized its attack`)
      return log
    }
  },
  Bestow: {
    name: 'Bestow', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, criticalHit: 0, power: 0,
    flavor: 'The user shares its item with a target who is not holding an item.',
    aoe: 'Random Opponent',
    onBeforeMove: noop,
    onAfterMove: ({caster, target}) => {
      const log = new Log()
      if (caster.heldItem && !target.heldItem) {
        const hiLabel = ITEMS[caster.heldItemKey!].label
        log.add(`${caster.species} gave its ${hiLabel} with ${target.species}`)
        caster.heldItem = undefined
        caster.heldItemConsumed = false
        target.heldItem = caster.heldItem
        target.heldItemConsumed = caster.heldItemConsumed
        APPLY_TEMP_STATUS(caster, ConditionMap.Switcherooed)
        APPLY_TEMP_STATUS(target, ConditionMap.Switcherooed)
      } else {
        log.add(`Nothing happened`)
      }
      return log
    }
  },
  Bide: {
    name: 'Bide', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, criticalHit: 1, power: 0,
    flavor: 'The user accepts damage for several turns before unleashing a strong attack.',
    aoe: 'Single Opponent',
    contact: true,
    onBeforeMove: ({caster, move}) => {
      const condition = getCondition(caster, 'Biding')
      if (condition && condition.turnsActive === 2) {
        // Make power proportional to current/total HP
        const damage = caster['bideLastHp'] - caster.currentHp
        const proportion = damage / caster.totalHp
        // At 0%  - 0
        // At 50% - 1.5
        // At 99% - 2.97
        move.power = 3 * proportion
        caster['bideLastHp'] = caster.currentHp
        removeCondition(caster, 'Biding') // Reset
        return new Log().add(`${caster.species} unleashed its power!`)
      } else if (condition && condition.turnsActive < 2) {
        move.failed = true
        return new Log().add(`${caster.species} is biding its time...`)
      } else {
        move.failed = true
        caster['bideLastHp'] = caster.currentHp
        return APPLY_TEMP_STATUS(caster, ConditionMap.Biding,
          `${caster.species} has started concentrating...`)
      }
    },
  },
  'Bind': {
    name: 'Bind', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 0.85, criticalHit: 1, power: 0.35,
    flavor: 'The user curls around the target and binds them.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => {
      const status = {...ConditionMap.Bound}
      if (['bindingband', 'gripclaw'].includes(inp.caster.heldItemKey ?? '')) {
        status.p = {longer: true}
      }
      return APPLY_TEMP_STATUS(inp.target, status,
        `${inp.target.species} became trapped!`)
    },
  },
  Bite: {
    name: 'Bite',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.8,
    type: 'Dark',
    flavor: 'The user bites its target with sharp fangs. It may cause flinching.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => Flinch(inp, 0.3)
  },
  'Bitter Blade': {
    name: 'Bitter Blade',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.1,
    type: 'Fire',
    flavor: 'The user slashes the target. Once the wound is open, it drains the target of its energy.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: ({caster, target, damage}) => {
      const log = logDrain(caster, damage!, 2)
      log.add(`${target.species} had its energy drained`)
      return log
    }
  },
  'Bitter Malice': {
    name: 'Bitter Malice', type: 'Ghost',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 0.95, accuracy: 1, criticalHit: 1,
    aoe: 'Single Opponent',
    flavor: 'The user fires out the epitome spine-chilling resentment. The target attack drops.',
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'attack', -1),
  },
  'Blast Burn': {
    name: 'Blast Burn',
    accuracy: 0.9,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.7,
    type: 'Fire',
    flavor: 'The user razes the target. It cannot move next turn.',
    aoe: 'Single Opponent',
    onAfterMove: RECHARGE
  },
  'Blaze Kick': {
    name: 'Blaze Kick',
    accuracy: 0.9,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 2,
    power: 1.05,
    type: 'Fire',
    flavor: 'The user launches a fiery kick that may land a critical hit. The target may burn.',
    aoe: 'Single Opponent',
    contact: true,
    onAfterMove: (inp) => Burn(inp, 0.1),
  },
  'Blazing Torque': {
    name: 'Blazing Torque', type: 'Fire',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 1, criticalHit: 1, power: 1,
    flavor: 'The user rushes forward into the target, which may leave a burn.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Burn(inp, 0.3),
  },
  'Bleakwind Storm': {
    name: 'Bleakwind Storm', type: 'Flying',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.2, accuracy: 0.8, criticalHit: 1,
    aoe: 'Nearby Opponents',
    flavor: 'The user unleashes a fierce wind with emotional love and hate. The target speed drops after.',
    onAfterMove: (inp) => {
      return BUFF_STAT(inp.target, inp, 'speed', -1)
    }
  },
  'Blizzard': {
    name: 'Blizzard',
    accuracy: 0.7,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.3,
    type: 'Ice',
    flavor: 'Freezing cold winds batter the target. It may cause freeze.',
    aoe: 'Nearby Opponents',
    onBeforeMove: ({move, field}) => {
      if (field.weather.name === 'Hail') {
        move.accuracy = Infinity
      }
      return new Log()
    },
    onAfterMove: (inp) => Freeze(inp, 0.1),
  },
  'Block': {
    name: 'Block', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: Infinity, aoe: 'Single Opponent',
    flavor: 'The target tries to flee but the user blocks them with wide arms to trap them.',
    onBeforeMove: noop,
    onAfterMove: ({target}) => {
      return APPLY_TEMP_STATUS(target, ConditionMap.TrappedInBattle,
        `${target.species} is trapped in the battle.`)
    }
  },
  'Blood Moon': {
    name: 'Blood Moon', type: 'Normal',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.6, criticalHit: 1, accuracy: 1,
    flavor: 'The user drawns upon the magnificient power of the full moon to deal devastating damage. This move cannot be used twice in succession.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => APPLY_TEMP_STATUS(inp.caster, {...ConditionMap.BloodMooning},
      `${inp.caster} needs to take a pause.`)
  },
  'Blue Flare': {
    name: 'Blue Flare', type: 'Fire',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.5, accuracy: 0.85, criticalHit: 1,
    flavor: 'The target is hit by a beautiful yet hot blue flame.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Burn(inp, 0.2)
  },
  'Body Press': {
    name: 'Body Press', type: 'Fighting',
    attackKey: 'defense', defenseKey: 'defense',
    power: 1, accuracy: 1, criticalHit: 1,
    flavor: 'The user presses its thick body into the target. Damage is based on its defense.',
    aoe: 'Single Opponent', contact: true,
  },
  'Body Slam': {
    name: 'Body Slam',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.05,
    type: 'Normal',
    flavor: 'The target is crushed by the user. It may leave them paralyzed.',
    aoe: 'Single Opponent',
    contact: true,
    onAfterMove: (inp) => Paralyze(inp, 0.3),
  },
  'Bolt Beak': {
    name: 'Bolt Beak', type: 'Electric',
    attackKey: 'attack', defenseKey: 'defense', aoe: 'Single Opponent',
    accuracy: 1, criticalHit: 1, power: 1.05, contact: true,
    flavor: 'The user rushes with a charged beak. If the user has moved earlier than the target, the power of the attack is doubled.',
    onBeforeMove: ({caster, move}) => {
      if (!getCondition(caster, 'Already Hit')) {
        move.power *= 2
      }
      return new Log()
    }
  },
  'Bolt Strike': {
    name: 'Bolt Strike', type: 'Electric',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.5, accuracy: 0.85, criticalHit: 1,
    flavor: 'The user slams into the target with lightning fury. It may leave them paralyzed.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => Paralyze(inp, 0.2)
  },
  'Bone Club': {
    name: 'Bone Club', type: 'Ground',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 0.85, criticalHit: 1, power: 1.2,
    flavor: 'The user swings its bone at the target, which may cause a flinch.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Flinch(inp, 0.1),
  },
  'Bonemerang': {
    name: 'Bonemerang', type: 'Ground',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 0.9, criticalHit: 1, power: 1.2,
    flavor: 'The user throws its bone at the target, which hits coming and going.',
    aoe: 'Single Opponent',
    onBeforeMove: ({move}) => HIT_MANY(move, 0.5, 2, 2)
  },
  'Bone Rush': {
    name: 'Bone Rush', type: 'Ground',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 0.9, criticalHit: 1, power: 1,
    flavor: 'The user rushes and swacks the target with a bone multiple times.',
    aoe: 'Single Opponent',
    onBeforeMove: ({move}) => HIT_MANY(move, 0.45, 2, 5),
  },
  Boomburst: {
    name: 'Boomburst', type: 'Normal',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    accuracy: 1, criticalHit: 1, power: 1.6,
    flavor: `BOOM! BURST! LOUD NOISES! Everyone's ears hurt.`,
    aoe: 'Everyone',
  },
  'Bounce': {
    name: 'Bounce', type: 'Flying',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 0.85, criticalHit: 1, power: 1.05,
    flavor: 'The user bounces really high into the air. It will come down a turn later.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: (inp) => {
      const log = failsIfGravity(inp)
      log.push(multiTurnOnBeforeMove(inp, 'Bouncing', 'jumped really high', 'came down from its jump!'))
      return log
    },
    onAfterMove: (inp) => multiTurnOnAfterMove(inp, 'Bouncing'),
  },
  'Branch Poke': {
    name: 'Branch Poke',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    contact: true,
    criticalHit: 1,
    power: 0.6,
    type: 'Grass',
    flavor: "The target is impaled by a sharp branch.",
    aoe: 'Single Opponent',
  },
  'Brave Bird': {
    name: 'Brave Bird',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.4,
    type: 'Flying',
    flavor: 'The user charges into the target with aerodynamic speeds. It causes some recoil.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => RECOIL(inp, 3)
  },
  'Breaking Swipe': {
    name: 'Breaking Swipe', type: 'Dragon',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.8, accuracy: 1, criticalHit: 1,
    aoe: 'Nearby Opponents', contact: true,
    flavor: 'The user swipes its tail, disrupting the attack of nearby foes.',
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'attack', -1),
  },
  'Brick Break': {
    name: 'Brick Break',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.95,
    type: 'Fighting',
    flavor: 'The user karate chops the target, breaking through screens.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({move, field, targetPrefix}) => {
      if (field.sides[targetPrefix].reflect) {
        // If reflect is up, this move will break it
        // But first we need to wait after damage is done
        // So let's just double the move power to simulate
        // the reflect breaking
        move.power *= 2
      }
      return new Log()
    },
    onAfterMove: ({field, targetPrefix}) => {
      // Break screens
      const log = new Log()
      if (field.sides[targetPrefix].reflect) {
        log.add('The reflected barrier shattered')
        field.sides[targetPrefix].reflect = 0
      }
      if (field.sides[targetPrefix].lightscreen) {
        log.add('The light screen shattered')
        field.sides[targetPrefix].lightscreen = 0
      }
      return log
    }
  },
  'Brine': {
    name: 'Brine',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.85,
    type: 'Water',
    flavor: 'The target is hit by salty water. The power doubles if the target is in a pinch.',
    aoe: 'Single Opponent',
    onBeforeMove: DOUBLE_IF_PINCH,
  },
  'Brutal Swing': {
    name: 'Brutal Swing',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    contact: true,
    criticalHit: 1,
    power: 0.8,
    type: 'Dark',
    flavor: "The user spins around, hitting anyone around it.",
    aoe: 'Everyone',
  },
  Bubble: {
    name: 'Bubble',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.6,
    type: 'Water',
    flavor: 'The target is pelted by bubbles. It may lower their speed.',
    aoe: 'Nearby Opponents',
    onAfterMove: (inp) => SpeNerf(inp.target, inp, 0.1)
  },
  'Bubble Beam': {
    name: 'Bubble Beam',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.85,
    type: 'Water',
    flavor: 'The target is hit by a stream of bubbles. It may lower their speed.',
    aoe: 'Single Opponent',
    onBeforeMove: nop,
    onAfterMove: (inp) => SpeNerf(inp.target, inp, 0.1)
  },
  'Bug Bite': {
    name: 'Bug Bite',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.8,
    type: 'Bug',
    flavor: 'The user eats the target\'s held item.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => {
      return FORCE_CONSUME(inp, 'ate the')
    }
  },
  'Bug Buzz': {
    name: 'Bug Buzz',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.95,
    type: 'Bug',
    sound: true,
    flavor: 'The target is hit by a loud screeching or clicking. It might lower their special defense.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => SpdNerf(inp.target, inp, 0.1)
  },
  'Bulk Up': {
    name: 'Bulk Up',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Fighting',
    flavor: 'The user buffs itself up to raise its physical stats.',
    aoe: 'Self',
    onBeforeMove: noop,
    onAfterMove: (input) => {
      const log = new Log()
      log.push(BUFF_STAT(input.caster, input, 'attack'))
      log.push(BUFF_STAT(input.caster, input, 'defense'))
      return log
    },
    zMoveFx: 'AtkBuff1',
  },
  Bulldoze: {
    name: 'Bulldoze',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.8,
    type: 'Ground',
    flavor: 'The ground shakes and lowers everyone\'s speed.',
    aoe: 'Everyone',
    onAfterMove: (inp) => SpeNerf(inp.target, inp)
  },
  'Bullet Punch': {
    name: 'Bullet Punch',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.6,
    type: 'Steel',
    priority: 1,
    flavor: 'The user strikes its fist faster than a speeding bullet.',
    aoe: 'Single Opponent', contact: true,
  },
  'Bullet Seed': {
    name: 'Bullet Seed',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Grass',
    flavor: 'The user spits out a number of seeds at the opponent. Where do the seeds come from?',
    aoe: 'Single Opponent',
    onBeforeMove: ({move}) => HIT_MANY(move, 0.3, 2, 5),
  },
  'Burning Jealousy': {
    name: 'Burning Jealousy', type: 'Fire',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 0.9, accuracy: 1, criticalHit: 1,
    aoe: 'All Opponents',
    // FIXME: Only this turn.
    flavor: 'Flames emit from the user to the other side of the field. Anyone with boosted stats gets burned.',
    onAfterMove: (inp) => {
      for (const val of Object.values(inp.target.statBuffs)) {
        if (val > 0) {
          return Burn(inp, 1)
        }
      }
      return new Log()
    }
  },
  'Burn Up': {
    name: 'Burn Up', type: 'Fire',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.5, criticalHit: 1, accuracy: 1,
    aoe: 'Single Opponent',
    flavor: 'The user emits all of its fire in one devastating burst. It loses all its fire.',
    onAfterMove: ({caster}) => {
      if (caster.type1 === 'Fire') {
        caster.type1 = 'Status'
      }
      if (caster.type2 === 'Fire') {
        caster.type2 = 'Status'
      }
      return new Log().add(`${caster.species} is feeling burned out`)
    }
  },
  'Calm Mind': {
    name: 'Calm Mind',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Psychic',
    flavor: 'The user closes their eyes and focuses, raising their special stats.',
    aoe: 'Self', zMoveFx: 'ResetStat',
    onAfterMove: (input) => {
      const log = new Log()
      log.push(BUFF_STAT(input.caster, input, 'spAttack'))
      log.push(BUFF_STAT(input.caster, input, 'spDefense'))
      return log
    }
  },
  Camouflage: {
    name: 'Camouflage', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: Infinity,
    flavor: 'The user tries to blend into the background. Its type changes based on the terrain.',
    aoe: 'Self', zMoveFx: 'EvaBuff1',
    onBeforeMove: noop,
    onAfterMove: ({caster, field}) => {
      const terrainToType: {[terrain in TerrainType]: Type} = {
        Bay: 'Water',
        Beach: 'Water',
        Mountain: 'Rock',
        Tropical: 'Grass',
        Rural: 'Grass',
        Desert: 'Ground',
        Grasslands: 'Grass',
        Gardens: 'Grass',
        Forest: 'Grass',
        Urban: 'Normal',
        Rainforest: 'Grass',
        Oceanic: 'Water',
      }
      const nextType = terrainToType[field.locationTerrain]
      caster.type1 = nextType
      caster.type2 = undefined
      return new Log().add(`${caster.species} became a ${nextType}-type!`)
    }
  },
  Captivate: {
    name: 'Captivate', type: 'Normal',
    defenseKey: 'defense', attackKey: 'attack',
    accuracy: 1, criticalHit: 0, power: 0,
    aoe: 'Single Opponent', zMoveFx: 'SpDefBuff2',
    flavor: 'Causes the target to become infatuated and lose special attack.',
    onBeforeMove: (inp) => {
      const genderCaster = inp.caster.badge.personality.gender
      const genderTarget = inp.target.badge.personality.gender
      if (genderCaster !== '' && genderTarget !== '' && genderCaster === genderTarget) {
          inp.move.failed = true
          return new Log().add('It has no effect...')
      }
      inp.move.type = 'Status'
      return new Log()
    },
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'spAttack', -2)
  },
  'Ceaseless Edge': {
    name: 'Ceaseless Edge',
    accuracy: 0.9,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.85,
    type: 'Dark',
    flavor: 'The target is struck by a shell blade with tiny fractures. Sharp spikes are left behind afterwards.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => {
      inp.field.sides[inp.targetPrefix].spikes = Math.min(inp.field.sides[inp.targetPrefix].spikes + 1, 3) as 1 | 2 | 3
      return new Log().add('Sharp spikes fell on the field')
    }
  },
  Celebrate: {
    name: 'Celebrate', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense', aoe: 'Self',
    power: 0, criticalHit: 0, accuracy: Infinity, zMoveFx: 'BuffAll1',
    flavor: 'The user finds out how to celebrate. But wait, this is a battle!',
    onAfterMove: ({target}) => {
      return new Log().add(`Hey ${target.species}, you're awesome. Have a pleasant day.`)
    }
  },
  Charge: {
    name: 'Charge', type: 'Electric',
    attackKey: 'attack', defenseKey: 'defense', aoe: 'Self', zMoveFx: 'SpDefBuff1',
    power: 0, criticalHit: 0, accuracy: Infinity,
    flavor: 'The user builds up a static charge, raising its special defense. Its next Electric-type move will be stronger.',
    onBeforeMove: noop,
    onAfterMove: (inp) => {
      return new Log()
        .push!(BUFF_STAT(inp.caster, inp, 'spDefense'))
        .push!(APPLY_TEMP_STATUS(inp.caster, ConditionMap.Charged,
          `${inp.caster.species} started charging itself up.`))
    }
  },
  'Charge Beam': {
    name: 'Charge Beam',
    accuracy: 0.9,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.7,
    type: 'Electric',
    flavor: 'The target is hit by an electrical pulse. The user\'s special attack might rise.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => SpaBuff(inp.caster, inp, 0.7)
  },
  'Charm': {
    name: 'Charm',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Fairy',
    flavor: 'The user makes itself look cute. The target\'s attack falls harshly.',
    aoe: 'Single Opponent', zMoveFx: 'DefBuff1',
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'attack', -2),
  },
  Chatter: {
    name: 'Chatter', type: 'Flying',
    attackKey: 'spAttack', defenseKey: 'spDefense', sound: true,
    power: 1, accuracy: 1, criticalHit: 1,
    flavor: 'The target is hit by a cacaphony of noise. It confuses the target.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Confuse(inp, 1)
  },
  'Chilling Water': {
    name: 'Chilling Water',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.7,
    type: 'Water',
    flavor: "The user sprays the target with ice water. The target's attack subsequently drops",
    aoe: 'Single Opponent',
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'attack', -1)
  },
  'Chilly Reception': {
    name: 'Chilly Reception', type: 'Ice',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, criticalHit: 0, power: 0,
    flavor: "The user tells a bad joke. Big ooph. Super cringe. They are so embarrassed they retreat.",
    aoe: 'Self', priority: 0,
    onBeforeMove: ({caster, move}) => {
      move.type = 'Status'
      if (getCondition(caster, 'TrappedInBattle')) {
        move.failed = true
        return new Log().add('But it failed...')
      }
      return new Log()
    },
    onAfterMove: (inp) => {
      const log = new Log()
      log.push(APPLY_TEMP_STATUS(inp.caster, {...ConditionMap['SwitchOut']},
        `${inp.caster.species} is too embarassed to show its face!`))
      inp.field.weather = {...Weathers['Snowscape']}
      log.add('A light snow began falling.')
      return log
    },
  },
  'Chip Away': {
    name: 'Chip Away', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.9, accuracy: 1, criticalHit: 1,
    flavor: 'The user strikes consistently, ignoring stat changes.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({target}) => {
      target['tmpDefense'] = target.statBuffs.defense
      target.statBuffs.defense = 0
      return new Log()
    },
    onAfterMove: ({target}) => {
      // Yes this might be a problem if the move misses
      // and the value isn't reset.
      target.statBuffs.defense = target['tmpDefense']
      return new Log()
    },
  },
  'Chloroblast': {
    name: 'Chloroblast',
    accuracy: 0.95,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.7,
    type: 'Grass',
    flavor: 'The user draws out the solar energy it has collected, damaging itself significantly in the process.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => logDamage(inp.caster, inp.caster.totalHp / 2, true),
  },
  'Circle Throw': {
    name: 'Circle Throw', type: 'Fighting',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 0.9, criticalHit: 1, power: 0.8,
    flavor: 'The user grips the foe and throws them so hard they are switched out.',
    aoe: 'Single Opponent', priority: -6, contact: true,
    onAfterMove: (inp) => {
      if (getCondition(inp.target, 'TrappedInBattle')) {
        return new Log().add('But it failed...')
      }
      return APPLY_TEMP_STATUS(inp.target, {...ConditionMap['SwitchOut']},
        `${inp.target.species} is tossed aside!`)
    },
  },
  Clamp: {
    name: 'Clamp', type: 'Water',
    attackKey: 'attack', defenseKey: 'defense', aoe: 'Single Opponent', contact: true,
    power: 0.55, accuracy: 0.85, criticalHit: 1,
    flavor: 'The target is clamped with clamps. They take damage for several turns.',
    onAfterMove: (inp) => {
      const status = {...ConditionMap.Bound}
      if (['bindingband', 'gripclaw'].includes(inp.caster.heldItemKey ?? '')) {
        status.p = {longer: true}
      }
      return APPLY_TEMP_STATUS(inp.target, status, `${inp.target.species} has been clamped!`)
    }
  },
  'Clanging Scales': {
    name: 'Clanging Scales',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.3,
    type: 'Dragon',
    sound: true,
    flavor: "The scales on the user echo loudly. Its defense drops afterwards.",
    aoe: 'Everyone',
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'defense', -1)
  },
  'Clangorous Soul': {
    name: 'Clangorous Soul', type: 'Dragon',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'Self',
    flavor: 'The user burns a part of its hit points to raise all its stats.',
    onAfterMove: (inp) => {
      const log = new Log()
      log.push(logDamage(inp.caster, inp.caster.totalHp/3, true))
      log.push(BUFF_ALL(inp, 1, 1))
      return log
    },
  },
  'Clear Smog': {
    name: 'Clear Smog', type: 'Poison',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 0.7, accuracy: 1, criticalHit: 1,
    flavor: 'The target is hit by a cloudy haze. Its stat changes go away.',
    aoe: 'Single Opponent',
    onAfterMove: ({target}) => {
      target.statBuffs.attack = 0
      target.statBuffs.spAttack = 0
      target.statBuffs.defense = 0
      target.statBuffs.spDefense = 0
      target.statBuffs.speed = 0
      const log = new Log()
      log.add(`All the stat changes of ${target.species} were removed`)
      return log
    }
  },
  'Close Combat': {
    name: 'Close Combat',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.4,
    type: 'Fighting',
    flavor: 'The user strikes in close range to the target. The damage is immense, but its own defenses lower.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => {
      const log = new Log()
      log.push(BUFF_STAT(inp.caster, inp, 'defense', -1))
      log.push(BUFF_STAT(inp.caster, inp, 'spDefense', -1))
      return log
    }
  },
  Coaching: {
    name: 'Coaching',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Fighting',
    flavor: 'The user turns to a teammate and gives them a pep talk. Their physical stats rise',
    aoe: 'Single Ally', zMoveFx: 'CriticalHit',
    onBeforeMove: noop,
    onAfterMove: (input) => {
      return new Log()
        .push(BUFF_STAT(input.target, input, 'attack', 1))
        .push(BUFF_STAT(input.target, input, 'defense', 1))
    }
  },
  Coil: {
    name: 'Coil', type: 'Poison',
    attackKey: 'attack', defenseKey: 'defense',
    criticalHit: 0, accuracy: Infinity, power: 0,
    flavor: 'The user tenses its body, ready to strike. Its physical stats rise.',
    aoe: 'Self', zMoveFx: 'ResetStat',
    onAfterMove: (inp) => {
      // No accuracy stat
      const log = new Log()
      log.push(BUFF_STAT(inp.caster, inp, 'attack', 1))
      log.push(BUFF_STAT(inp.caster, inp, 'defense', 1))
      return log
    }
  },
  'Collision Course': {
    name: 'Collision Course', type: 'Fighting',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.2, accuracy: 1, criticalHit: 1,
    aoe: 'Single Opponent', contact: true,
    flavor: 'The user strikes like a large asteroid. Super-effective hits are much more effective.',
    onBeforeMove: (inp) => {
      const multiplier = typeMatchup['Fighting'][inp.target.type1] * typeMatchup['Fighting'][inp.target.type2 ?? inp.target.type1]
      if (multiplier > 1) {
        inp.move.power *= 1.5
      }
      return new Log()
    }
  },
  'Combat Torque': {
    name: 'Combat Torque', type: 'Fighting',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 1, criticalHit: 1, power: 1.2,
    flavor: 'The user rushes forward into the target, which may leave them paralyzed.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Paralyze(inp, 0.3),
  },
  'Comet Punch': {
    name: 'Comet Punch', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    criticalHit: 1, accuracy: 1, power: 0.8,
    flavor: 'The user throws its fist multiple times in rapid succession.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({move}) => HIT_MANY(move, 0.18, 2, 5),
  },
  'Comeuppance': {
    name: 'Comeuppance',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Dark',
    flavor: 'The user retaliates based on the last damage done to it.',
    aoe: 'Single Opponent',
    onAfterMove: (input) => {
      const {caster, move, target} = input
      const lastMoveCondition = getCondition(caster, 'LastDamage')
      if (!lastMoveCondition) {
        move.failed = true
        return new Log().add('Nothing happened')
      }
      const delta = lastMoveCondition.p!.dmg!
      if (delta < 0) {
        // Healed
        move.failed = true
        return new Log().add('Nothing happened')
      }
      return applyStaticDamage(target, delta * 1.5, input)
    },
    onBeforeMove: ({move}) => {
      move.power = 0
      return nop()
    },
  },
  Confide: {
    name: 'Confide', type: 'Normal', sound: true,
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, criticalHit: 0, power: 0, zMoveFx: 'SpDefBuff1',
    flavor: 'The target is told a secret that distracts it. Its special attack drops.',
    aoe: 'Single Opponent',
    onBeforeMove: noop,
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'spAttack', -1)
  },
  'Confuse Ray': {
    name: 'Confuse Ray',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Ghost',
    flavor: 'A glowing orb strikes the target, confusing it.',
    aoe: 'Single Opponent', zMoveFx: 'SpAtkBuff1',
    onBeforeMove: noop,
    onAfterMove: (inp) => Confuse(inp, 1),
  },
  Confusion: {
    name: 'Confusion',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.7,
    type: 'Psychic',
    flavor: 'The user strikes with a telekinetic force. It might confuse the target.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Confuse(inp, 0.1),
  },
  Constrict: {
    name: 'Constrict',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.3,
    type: 'Ground',
    flavor: 'The user grapples the target with its tentacles. Their speed might drop as a result.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => SpeNerf(inp.target, inp, 0.1),
  },
  Conversion: {
    name: 'Conversion', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, power: 0, criticalHit: 0,
    flavor: 'The user converts its type to be one based on its movepool.',
    aoe:'Self', zMoveFx: 'BuffAll1',
    onBeforeMove: noop,
    onAfterMove: ({caster}) => {
      // In MSG, pick same type as at top-of-list
      // Here that would always be normal
      const moveToMimic = randomItem(caster.movepool) as Move
      caster.type1 = moveToMimic.type
      caster.type2 = undefined
      return new Log().add(`${caster.species} became a ${caster.type1}-type!`)
    }
  },
  'Conversion 2': {
    name: 'Conversion 2', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, power: 0, criticalHit: 0,
    flavor: 'The user changes its types to resist the last move it was hit with.',
    aoe: 'Single Opponent', // Because we need a `target` here
    zMoveFx: 'Heal',
    onBeforeMove: noop,
    onAfterMove: ({caster, target, move}) => {
      const targetLastMove = getCondition(target, 'LastMove')
      if (targetLastMove) {
        const lastMove = targetLastMove.p!.selectedMove!
        const lastMoveType = lastMove.type
        const types: Type[] = ['Bug', 'Dark', 'Dragon', 'Ground', 'Fighting', 'Fire', 'Ice', 'Steel',
          'Grass', 'Psychic', 'Fairy', 'Flying', 'Water', 'Ghost', 'Rock',
          'Poison', 'Electric']
        const shuffle = (array) => {
          // https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
          let currentIndex = array.length,  randomIndex;
        
          // While there remain elements to shuffle...
          while (0 !== currentIndex) {
        
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
        
            // And swap it with the current element.
            [array[currentIndex], array[randomIndex]] = [
              array[randomIndex], array[currentIndex]];
          }
        
          return array;
        }
        const shuffledTypes: Type[] = shuffle(types)
        const nextType = ((): Type => {
          for (const t of shuffledTypes) {
            if (typeMatchup[lastMoveType][t] < 1) {
              return t
            }
          }
          return 'Status'
        })()
        caster.type1 = nextType
        caster.type2 = undefined
        return new Log().add(`${caster.species} became a ${caster.type1}-type!`)
      }
      move.failed = true
      return new Log().add(`It failed...`)
    }
  },
  'Copycat': {
    name: 'Copycat', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1, accuracy: 1, criticalHit: 0,
    aoe: 'Single Opponent',
    flavor: 'The user counters the target by using the same exact move.',
    onBeforeMove: (input) => {
      const log = new Log()
      const {move} = input
      const updatedMoveCondition = getCondition(input.target, 'LastMove')
      if (!updatedMoveCondition) {
        input.move.failed = true
        return new Log().add('There were moves to copy')
      }
      const updatedMove = updatedMoveCondition.p!.selectedMove!
      move.name = updatedMove.name
      log.add(`Copycat became ${move.name}!`)
      if (move.accuracy !== Infinity) {
        // Keep perfect accuracy for tests/Lock-On
        move.accuracy = updatedMove.accuracy
      }
      move.attackKey = updatedMove.attackKey
      move.defenseKey = updatedMove.defenseKey
      move.criticalHit = updatedMove.criticalHit
      move.power = updatedMove.power
      move.type = updatedMove.type
      move.aoe = updatedMove.aoe
      move.onAfterMove = updatedMove.onAfterMove
      log.push(updatedMove.onBeforeMove?.(input))
      return log
    },
    onAfterMove: nop,
  },
  'Core Enforcer': {
    name: 'Core Enforcer',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.2,
    type: 'Dragon',
    flavor: "The power of many is condensed into one incredible strike. Oh my, it's quite strong.",
    aoe: 'Single Opponent',
    // No secondary move effect
  },
  'Corrosive Gas': {
    name: 'Corrosive Gas', type: 'Poison',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: 1, criticalHit: 0,
    flavor: 'The target is surrounded by a thick acidic gas. Any hold items are dissolved.',
    aoe: 'Single Opponent',
    onAfterMove: ({target}) => {
      const log = new Log()
      if (target.heldItem && !target.heldItemTotallyConsumed) {
        target.heldItemConsumed = true
        const hiLabel = ITEMS[target.heldItemKey!].label
        log.add(`The ${hiLabel} that ${target.species} was holding is now melted.`)
      }
      return log
    }
  },
  'Cosmic Power': {
    name: 'Cosmic Power',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Psychic',
    flavor: 'The user harnesses cosmic energy to boost its defenses.',
    aoe: 'Self', zMoveFx: 'SpDefBuff1',
    onBeforeMove: noop,
    onAfterMove: (input) => {
      const log = new Log()
      log.push(BUFF_STAT(input.caster, input, 'defense', 1))
      log.push(BUFF_STAT(input.caster, input, 'spDefense', 1))
      return log
    }
  },
  'Cotton Guard': {
    name: 'Cotton Guard', type: 'Grass',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0,
    flavor: 'The user gathers fluffy material to drastically boost its defenses. It\'s so fluffy!',
    aoe: 'Self', zMoveFx: 'ResetStat',
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'defense', 3)
  },
  'Cotton Spore': {
    name: 'Cotton Spore',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Grass',
    flavor: 'The target is struck by fluffy material, making it harder to move. Its speed drops.',
    aoe: 'Single Opponent', zMoveFx: 'ResetStat',
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'speed', -2)
  },
  Counter: {
    name: 'Counter',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Fighting',
    priority: -5,
    flavor: 'The user strikes back with double the power of a physical move.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (input) => {
      const {caster, move, target} = input
      const lastMoveCondition = getCondition(caster, 'LastDamage')
      if (!lastMoveCondition) {
        move.failed = true
        return new Log().add('Nothing happened')
      }
      const lastMove = lastMoveCondition.p!.selectedMove!
      if (lastMove.attackKey === 'spAttack') {
        move.failed = true
        return new Log().add('Nothing happened')
      }
      const delta = lastMoveCondition.p!.dmg!
      if (delta < 0) {
        // Healed
        move.failed = true
        return new Log().add('Nothing happened')
      }
      return applyStaticDamage(target, delta * 2, input)
    },
    onBeforeMove: ({move}) => {
      move.power = 0
      return new Log()
    },
  },
  'Court Change': {
    name: 'Court Change', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: 1, criticalHit: 0,
    aoe: 'Self',
    flavor: 'The user calls for a halftime. The battle resumes with swapped sides.',
    onAfterMove: ({field}) => {
      const yourSide = {...field.sides.Your}
      field.sides.Your = {...field.sides.Opposing}
      field.sides.Opposing = {...yourSide}
      return new Log().add('The sides of the field swapped')
    }
  },
  'Covet': {
    name: 'Covet', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.8, accuracy: 1, criticalHit: 1,
    aoe: 'Single Opponent', contact: true,
    flavor: 'The user nonchalantly walks forward to steal whatever the opponent is holding.',
    onAfterMove: (inp) => {
      if (inp.caster.heldItem) {
        return new Log() // can't steal something else
      }
      if (!inp.target.heldItem) {
        return new Log() // can't steal nothing
      }
      if (inp.caster.heldItemConsumed) {
        return new Log() // can't steal used item
      }
      inp.caster.heldItem = inp.target.heldItem
      inp.caster.heldItemKey = inp.target.heldItemKey
      inp.caster.heldItemConsumed = inp.target.heldItemConsumed
      inp.caster.heldItemTotallyConsumed = false // Won't remove it from your bag
      const {label} = ITEMS[inp.target.heldItemKey!]
      return new Log().add(`${inp.prefix} ${inp.caster.species} stole ${inp.target.species}'s ${label}`)
    }
  },
  Crabhammer: {
    name: 'Crabhammer',
    accuracy: 0.9,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 2,
    power: 1.25,
    type: 'Water',
    flavor: 'The target is whacked by a hard claw. Critical hits are more likely.',
    aoe: 'Single Opponent', contact: true,
  },
  'Crafty Shield': {
    name: 'Crafty Shield', type: 'Fairy',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: Infinity,
    priority: 4,
    aoe: 'All Allies', zMoveFx: 'SpDefBuff1',
    flavor: 'A crafty shield protects all allies from status moves.',
    onAfterMove: ({caster, target}) => {
      APPLY_TEMP_STATUS(caster, ConditionMap.ProtectCrafty)
      APPLY_TEMP_STATUS(target, ConditionMap.ProtectCrafty)
      return new Log().add('A crafty shield is protecting all allies')
    }
  },
  'Cross Chop': {
    name: 'Cross Chop',
    accuracy: 0.8,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 3,
    power: 1.2,
    type: 'Fighting',
    flavor: 'The strikes with two forearms. Critical hits are more likely.',
    aoe: 'Single Opponent', contact: true,
  },
  'Cross Poison': {
    name: 'Cross Poison',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 2,
    power: 0.9,
    type: 'Poison', contact: true, aoe: 'Single Opponent',
    flavor: 'The user strikes with poisonous claws. Critical hits are more likely.',
  },
  Crunch: {
    name: 'Crunch',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Dark', contact: true, aoe: 'Single Opponent',
    flavor: 'The user bites with sharp jaws. The target\'s defense may lower.',
    onAfterMove: (inp) => DefNerf(inp.target, inp, 0.2),
  },
  'Crush Claw': {
    name: 'Crush Claw',
    accuracy: 0.95,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.95,
    type: 'Normal', contact: true,
    flavor: 'The user strikes with rough claws. The target\'s defense may drop.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => DefNerf(inp.target, inp, 0.5),
  },
  'Crush Grip': {
    name: 'Crush Grip',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Normal',
    flavor: 'The user crushes the target. The more HP the target has, the more damage is done.',
    aoe: 'Single Opponent', contact: true,
    // TODO : Reconsider formula
    onBeforeMove: ({target, move}) => {
      // Move power between 0.2 -> 1.5
      move.power = Math.max(1.5 * (target.currentHp / target.totalHp), 0.2)
      return new Log()
    },
  },
  'Curse': {
    name: 'Curse', type: 'Ghost',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: 1, criticalHit: 0,
    aoe: 'Single Opponent', zMoveFx: 'AtkBuff1',
    flavor: "Raises physical stats while dropping speed. This move works differently on Ghost-type Pokémon.",
    onAfterMove: (inp) => {
      const log = new Log()
      if (inp.caster.type1 === 'Ghost' || inp.caster.type2 === 'Ghost') {
        log.push(logDamage(inp.caster, inp.caster.totalHp / 2, true))
        log.push(APPLY_TEMP_STATUS(inp.target, {...ConditionMap['Cursed']},
          `A ghastly curse was placed upon ${inp.target.species}`))
      } else {
        log.push(BUFF_STAT(inp.caster, inp, 'speed', -1))
        log.push(BUFF_STAT(inp.caster, inp, 'attack', 1))
        log.push(BUFF_STAT(inp.caster, inp, 'defense', 1))
      }
      return log
    }
  },
  Cut: {
    name: 'Cut', type: 'Normal',
    power: 0.7, accuracy: 0.95, criticalHit: 1,
    attackKey: 'attack', defenseKey: 'defense',
    aoe: 'Single Opponent', contact: true,
    flavor: 'The user slices with a blade or sharp claws.',
  },
  'Dazzling Gleam': {
    name: 'Dazzling Gleam',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1,
    type: 'Fairy',
    flavor: 'The targets are struck by a blinding light.',
    aoe: 'Nearby Opponents',
  },
  'Dark Pulse': {
    name: 'Dark Pulse',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1,
    type: 'Dark',
    flavor: 'The target is hit by a pulse of dark thoughts. It might flinch.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Flinch(inp, 0.2)
  },
  'Dark Void': {
    name: 'Dark Void', type: 'Dark',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: 0.5, criticalHit: 0,
    flavor: 'The targets are pulled into a void of total sleep.',
    aoe: 'Nearby Opponents', zMoveFx: 'ResetStat',
    onAfterMove: (inp) => Sleep(inp, 1),
  },
  'Darkest Lariat': {
    name: 'Darkest Lariat', type: 'Dark',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.05, accuracy: 1, criticalHit: 1,
    flavor: 'The target is struck by a wrestling move. Its defense stat buffs do not matter.',
    aoe: 'Single Opponent',
    onBeforeMove: ({move, target}) => {
      // Adjust move power based on target defense stat
      move.power *= statBuff(target.statBuffs.defense)
      return new Log()
    },
  },
  Decorate: {
    name: 'Decorate', type: 'Fairy',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: Infinity,
    aoe: 'Single Ally',
    flavor: 'The user dresses up an ally with inspiring fashion. It sharply raises its attacks.',
    onAfterMove: (inp) => {
      return new Log()
        .push(BUFF_STAT(inp.target, inp, 'attack', 2))
        .push(BUFF_STAT(inp.target, inp, 'spAttack', 2))
    },
  },
  'Defend Order': {
    name: 'Defend Order',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Bug',
    flavor: 'The order is given to protect the queen. The queen\'s defenses rise.',
    aoe: 'Self',
    onBeforeMove: noop,
    onAfterMove: (inp) => {
      const log = new Log()
      log.push(BUFF_STAT(inp.caster, inp, 'defense'))
      log.push(BUFF_STAT(inp.caster, inp, 'spDefense'))
      return log
    }
  },
  'Defense Curl': {
    name: 'Defense Curl',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Normal',
    flavor: 'The user curls into a ball and tries to hide from the stress of modern life. It\'s defense rises.',
    aoe: 'Self', zMoveFx: 'AccBuff1',
    onBeforeMove: noop,
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'defense')
  },
  Defog: {
    name: 'Defog',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Flying',
    flavor: 'Items on the field are removed.',
    aoe: 'Everyone', zMoveFx: 'AccBuff1',
    onAfterMove: ({target, field, prefix, targetPrefix}) => {
      const log = new Log()
      log.add('The field was cleared.')

      field.sides[prefix].lightscreen = 0
      field.sides[prefix].reflect = 0
      field.sides[prefix].mist = 0
      field.sides[prefix].spikes = 0
      field.sides[prefix].toxicSpikes = 0
      field.sides[prefix].stealthRock = false
      field.sides[prefix].sharpSteel = false
      field.sides[prefix].stickyWeb = false

      field.sides[targetPrefix].lightscreen = 0
      field.sides[targetPrefix].reflect = 0
      field.sides[targetPrefix].mist = 0
      field.sides[targetPrefix].spikes = 0
      field.sides[targetPrefix].toxicSpikes = 0
      field.sides[targetPrefix].stealthRock = false
      field.sides[targetPrefix].sharpSteel = false
      field.sides[targetPrefix].stickyWeb = false

      field.terrain = undefined

      if (getCondition(target, 'Safeguard')) {
        // Doesn't hit all targets. This is a known issue.
        removeCondition(target, 'Safeguard')
        log.add(`${target.species} safeguard was removed`)
      }

      if (field.weather.name === 'Fog') {
        // Well, defog it then!
        // Sunny is the default.
        field.weather = {...Weathers.Sunny}
      }
      return log
    }
  },
  'Destiny Bond': {
    name: 'Destiny Bond', type: 'Ghost',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0,
    aoe: 'Self', zMoveFx: 'Spotlight',
    flavor: `The user puts a curse on itself. If it happens to get KO'd, so does the target.`,
    onBeforeMove: noop,
    onAfterMove: (inp) => {
      return APPLY_TEMP_STATUS(inp.caster, {...ConditionMap.DestinyBonded},
        `${inp.prefix} ${inp.caster.species} placed a curse upon itself.`)
    }
  },
  Detect: {
    name: 'Detect',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Fighting',
    priority: 4,
    flavor: 'The user watches cautiously, blocking attacks against it.',
    aoe: 'Self', zMoveFx: 'EvaBuff1',
    onAfterMove: ({caster}) => APPLY_TEMP_STATUS(caster, ConditionMap.Protect,
        `${caster.species} shielded itself!`)
  },
  'Diamond Storm': {
    name: 'Diamond Storm', type: 'Rock',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.2, criticalHit: 1, accuracy: 0.95,
    aoe: 'Nearby Opponents',
    flavor: 'A storm of diamonds rages through the targets. It may raise the defense of the user.',
    onAfterMove: (inp) => {
      if (Math.random() < 0.5) {
        return BUFF_STAT(inp.caster, inp, 'defense', 2)
      }
      return new Log()
    }
  },
  'Dig': {
    name: 'Dig',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.1,
    type: 'Ground',
    flavor: 'The user burrows into the ground and strikes the target when they least expect it.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: (inp) => multiTurnOnBeforeMove(inp, 'Underground', 'burrowed a hole into the earth', 'came up from the ground!'),
    onAfterMove: (inp) => multiTurnOnAfterMove(inp, 'Underground'),
  },
  'Dire Claw': {
    name: 'Dire Claw', type: 'Poison',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1, accuracy: 1, criticalHit: 1,
    aoe: 'Single Opponent', contact: true,
    flavor: 'The user draws toxins from its body that it unleashes in its claws. The target likely walks away with a status effect.',
    onAfterMove: (inp) => {
      if (Math.random() < 0.5) {
        // Let's go
        const p = Math.random()
        if (p < 0.33) {
          return Poison(inp, 1)
        }
        if (p < 0.67) {
          return Paralyze(inp, 1)
        }
        return Sleep(inp, 1)
      }
      return new Log()
    }
  },
  'Disable': {
    name: 'Disable', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: 1, criticalHit: 0,
    aoe: 'Single Opponent',
    flavor: 'The use of telekinetic power disables the last move that the opponent used.',
    onBeforeMove: (inp) => {
      inp.move.type = 'Status'
      const targetMove = getCondition(inp.target, 'LastMove')
      if (!targetMove) {
        inp.move.failed = true
        return new Log().add('It failed...')
      }
      if (!targetMove.p?.selectedMove) {
        inp.move.failed = true
        return new Log().add('It failed...')
      }
      return new Log()
    },
    onAfterMove: (inp) => {
      const targetMoveCondition = getCondition(inp.target, 'LastMove')
      const targetMove = targetMoveCondition!.p!.selectedMove!
      const mIndex = inp.target.movepool.findIndex(m => m.name === targetMove.name)
      if (mIndex === -1) {
        inp.move.failed = true
        return new Log().add('It failed...')
      }
      inp.target.move.splice(mIndex, 1)
      inp.target.movepool.splice(mIndex, 1)
      if (inp.target.move.length === 0) {
        inp.target.move = ['Struggle']
        inp.target.movepool = [{...Movepool.Struggle}]
      }
      return new Log().add(`${inp.prefix} ${inp.target.species}'s ${targetMove.name} was disabled`)
    }
  },
  'Disarming Voice': {
    name: 'Disarming Voice',
    accuracy: Infinity,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.6,
    type: 'Fairy',
    flavor: 'The user shouts with great alarm, striking all targets in range. It never misses.',
    aoe: 'Nearby Opponents', sound: true,
  },
  Discharge: {
    name: 'Discharge',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power:1,
    type: 'Electric',
    flavor: 'The user releases a burst of static electricity, hitting everyone in range. It may paralyze them.',
    aoe: 'Everyone',
    onAfterMove: (inp) => Paralyze(inp, 0.3),
  },
  'Dive': {
    name: 'Dive',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.1,
    type: 'Water',
    flavor: 'The user hides underwater and suddenly rises and sneak attacks the target.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: (inp) => multiTurnOnBeforeMove(inp, 'Underwater', 'dove into the water!', 'came out of the water!'),
    onAfterMove: (inp) => multiTurnOnAfterMove(inp, 'Underwater'),
  },
  'Dizzy Punch': {
    name: 'Dizzy Punch',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.9,
    type: 'Normal',
    flavor: 'The target is hit by an unexpected punch which might confuse them.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => Confuse(inp, 0.2),
  },
  'Doom Desire': {
    name: 'Doom Desire', type: 'Steel',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.6, accuracy: 1, criticalHit: 0,
    flavor: 'The user foresees an attack of metallic light.',
    aoe: 'Single Opponent',
    onBeforeMove: ({move, target}) => {
      move.power = 0 // Do no damage this turn
      if (getCondition(target, 'Future Seen')) {
        move.failed = true
        return new Log().add('It has no effect...')
      }
      return new Log()
    },
    onAfterMove: ({target, caster}) => {
      const condition = {...ConditionMap['Future Seen']}
      const atkStat = caster.spAttack
      const mult = 1
      const stab = (() => {
        if (caster.type1 === 'Steel') return 1.5
        if (caster.type2 === 'Steel') return 1.5
        return 1
      })()
      const movePower = 1.6
      const defStat = target.spDefense
      const dmg = atkStat * mult * stab * movePower * 1 / defStat * 50
      condition.p = {dmg}
      return APPLY_TEMP_STATUS(target, condition, `${caster.species} foresaw an attack!`)
    },
  },
  'Double-Edge': {
    name: 'Double-Edge',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.4,
    type: 'Normal',
    flavor: 'The user charges at the target with great momentum. Both double over in pain.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => RECOIL(inp, 3),
  },
  'Double Hit': {
    name: 'Double Hit',
    accuracy: 0.9,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.15,
    type: 'Normal',
    flavor: 'The user hits the target twice in quick succession.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: () => {
      const log = new Log()
      log.add('Hit twice')
      return log
    }
  },
  'Double Iron Bash': {
    name: 'Double Iron Bash',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.4,
    type: 'Normal',
    flavor: 'The user hits the target twice with what are effectively iron clubs.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => {
      const log = new Log()
      log.add('Hit twice')
      log.push(Flinch(inp, 0.3))
      return log
    }
  },
  'Double Kick': {
    name: 'Double Kick',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.8,
    type: 'Fighting',
    flavor: 'The user kicks the target twice in quick succession.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: () => {
      const log = new Log()
      log.add('Hit two times')
      return log
    }
  },
  'Double Shock': {
    name: 'Double Shock', type: 'Electric',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.4, criticalHit: 1, accuracy: 1,
    aoe: 'Single Opponent',
    flavor: 'The user emits all of its electricity in one devastating shock. It loses all its charge.',
    onAfterMove: ({caster}) => {
      if (caster.type1 === 'Electric') {
        caster.type1 = 'Status'
      }
      if (caster.type2 === 'Electric') {
        caster.type2 = 'Status'
      }
      return new Log().add(`${caster.species} is feeling grounded`)
    }
  },
  'Double Slap': {
    name: 'Double Slap',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.8,
    type: 'Normal',
    flavor: 'The user slaps the target\'s cheeks twice, insulting them.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: nop,
    onAfterMove: () => {
      const log = new Log()
      log.add('Hit two times')
      return log
    }
  },
  'Double Team': {
    name: 'Double Team', type: 'Normal', aoe: 'Self',
    power: 0, criticalHit: 0, accuracy: Infinity,
    attackKey: 'attack', defenseKey: 'defense', zMoveFx: 'ResetStat',
    flavor: 'The user moves fast. Wicked fast. It boosts its evasiveness.',
    onAfterMove: (inp) => {
      return BUFF_STAT(inp.target, inp, 'evasiveness', 1)
    }
  },
  'Draco Meteor': {
    name: 'Draco Meteor',
    accuracy: 0.9,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.5,
    type: 'Dragon',
    flavor: 'The user calls meteors to strike the target. It drains the special attack of the user, however.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'spAttack', -2)
  },
  'Dragon Ascent': {
    name: 'Dragon Ascent', type: 'Flying',
    attackKey: 'attack', defenseKey: 'defense',
    aoe: 'Single Opponent', contact: true,
    power: 1.4, accuracy: 1, criticalHit: 1,
    flavor: 'A burst of draconic energy flies toward the target. The user lowers their defenses.',
    onAfterMove: (inp) => {
      const log = new Log()
      log.push(BUFF_STAT(inp.caster, inp, 'defense', -1))
      log.push(BUFF_STAT(inp.caster, inp, 'spDefense', -1))
      return log
    },
  },
  'Dragon Breath': {
    name: 'Dragon Breath',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.8,
    type: 'Dragon',
    flavor: 'The target is hit by a horrible breath that may leave them paralyzed.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Paralyze(inp, 0.3),
  },
  'Dragon Claw': {
    name: 'Dragon Claw', type: 'Dragon',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1, criticalHit: 1, accuracy: 1,
    flavor: 'The user strikes with its claws. It\'s *dragon* claws.',
    aoe: 'Single Opponent', contact: true,
  },
  'Dragon Dance': {
    name: 'Dragon Dance',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Dragon',
    flavor: 'The user performs an ancient dance which boosts its attack and speed.',
    aoe: 'Self', zMoveFx: 'ResetStat',
    onAfterMove: (input) => {
      const log = new Log()
      log.push(BUFF_STAT(input.caster, input, 'attack'))
      log.push(BUFF_STAT(input.caster, input, 'speed'))
      return log
    }
  },
  'Dragon Darts': {
    name: 'Dragon Darts', type: 'Dragon',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.7, criticalHit: 1, accuracy: 1,
    aoe: 'Nearby Opponents', /* Close enough */
    flavor: 'The user attacks the foes using Dreepy. Nearby foes should be wary.',
  },
  'Dragon Energy': {
    name: 'Dragon Energy',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.7,
    type: 'Dragon',
    flavor: 'The user draws upon its inner core to deal damage. This attack does more damage if the user is healthier.',
    aoe: 'All Opponents',
    onBeforeMove: POWER_BY_HP,
  },
  'Dragon Hammer': {
    name: 'Dragon Hammer',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.1,
    type: 'Dragon',
    flavor: 'The user collides into the opponent, dealing draconic damage.',
    aoe: 'Single Opponent', contact: true,
  },
  'Dragon Pulse': {
    name: 'Dragon Pulse',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.05,
    type: 'Dragon',
    flavor: 'The user emits a burst of draconic energy.',
    aoe: 'Single Opponent',
  },
  'Dragon Rage': {
    name: 'Dragon Rage',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1,
    type: 'Dragon',
    flavor: 'The user emits a burst of pure rage. This move always does the same amount of damage.',
    aoe: 'Single Opponent',
    onBeforeMove: ({move}) => {
      move.power = 0
      return nop()
    },
    onAfterMove: (input) => {
      const {target} = input
      return applyStaticDamage(target, 40, input)
    }
  },
  'Dragon Rush': {
    name: 'Dragon Rush',
    accuracy: 0.75,
    attackKey: 'attack', defenseKey: 'defense',
    criticalHit: 1,
    power: 1.2,
    type: 'Dragon',
    flavor: 'The user charges at the opponent with overwhelming power. The target may flinch.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => Flinch(inp, 0.2),
  },
  'Dragon Tail': {
    name: 'Dragon Tail', type: 'Dragon',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 0.9, criticalHit: 1, power: 0.8,
    flavor: 'The user thrusts its tail forward so much the target is knocked away.',
    aoe: 'Single Opponent', priority: -6, contact: true,
    onAfterMove: (inp) => {
      if (getCondition(inp.target, 'TrappedInBattle')) {
        return new Log().add('But it failed...')
      }
      return APPLY_TEMP_STATUS(inp.target, {...ConditionMap['SwitchOut']},
        `${inp.target.species} is tailed away!`)
    },
  },
  'Drain Punch': {
    name: 'Drain Punch', type: 'Fighting',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 1, criticalHit: 1, power: 0.95,
    flavor: 'The user drains the target of its energy using its fist.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: ({caster, target, damage}) => {
      const log = logDrain(caster, damage!, 2)
      log.add(`${target.species} had its energy drained`)
      return log
    }
  },
  'Draining Kiss': {
    name: 'Draining Kiss',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.7,
    type: 'Fairy',
    flavor: 'The user steals a kiss. They also steal the target\'s HP.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: ({caster, target, damage}) => {
      const log = logDrain(caster, damage!, 1.33)
      log.add(`${target.species} had its energy drained`)
      return log
    }
  },
  'Dream Eater': {
    name: 'Dream Eater',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.2,
    type: 'Psychic',
    flavor: 'The user eats the dreams of a sleeping target.',
    aoe: 'Single Opponent',
    onBeforeMove: ({target, move}) => {
      const log = new Log()
      if (target.status?.name !== 'Asleep') {
        move.failed = true
        return new Log()
          .add(`${target.species} cannot dream if they are not asleep!`)
      }
      return log
    },
    onAfterMove: ({caster, target, damage}) => {
      const log = logDrain(caster, damage!, 2)
      log.add(`${target.species} had its dreams consumed`)
      return log
    },
  },
  'Drill Peck': {
    name: 'Drill Peck',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Flying',
    flavor: 'The user strikes with a corkscrew attack.',
    aoe: 'Single Opponent', contact: true,
  },
  'Drill Run': {
    name: 'Drill Run',
    accuracy: 0.95,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 2,
    power: 1,
    type: 'Ground',
    flavor: 'The user runs with a drill. Critical hits are more likely.',
    aoe: 'Single Opponent', contact: true,
  },
  'Drum Beating': {
    name: 'Drum Beating', type: 'Grass',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1, criticalHit: 1, accuracy: 1,
    flavor: 'The target is attacked by roots following the beat of the drum. Its speed lowers.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'speed', -1)
  },
  'Dual Chop': {
    name: 'Dual Chop', type: 'Dragon',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 0.9, criticalHit: 1, power: 1,
    flavor: 'The user slices its claws a the target, hitting them twice.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: () => {
      const log = new Log()
      log.add('Hit two times')
      return log
    },
  },
  'Dual Wingbeat': {
    name: 'Dual Wingbeat', type: 'Flying',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1, accuracy: 0.9, criticalHit: 1,
    aoe: 'Single Opponent', contact: true,
    flavor: 'The user flies around gracefully, striking the target with its wings once or more.',
    onBeforeMove: ({move}) => {
      // If we are at this point the first one struck.
      const twoWings = [1, Math.random()]
      if (twoWings[1] < 0.1) {
        move.power = 0.6
        return new Log().add('Struck once!')
      }
      move.power = 1 // + 40
      return new Log().add('Struck twice!')
    },
  },
  'Dynamax Cannon': {
    name: 'Dynamax Cannon', type: 'Dragon',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.2, accuracy: 1, criticalHit: 1,
    flavor: 'A powerful beam of cosmic energy is fired at the target. If they are dynamaxed, more damage is done.',
    aoe: 'Single Opponent',
    onBeforeMove: ({target, move}) => {
      if (getCondition(target, 'Dynamaxed')) {
        move.power *= 2
      }
      return new Log()
    }
  },
  'Dynamic Punch': {
    name: 'Dynamic Punch',
    accuracy: 0.5,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.75,
    type: 'Fighting',
    flavor: 'The user hits the target with a lot of force. The target gets confused.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => Confuse(inp, 1)
  },
  'Earthquake': {
    name: 'Earthquake',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.2,
    type: 'Ground',
    flavor: 'The user causes the ground to shake, causing everyone to stumble a bit.',
    aoe: 'Everyone',
  },
  'Earth Power': {
    name: 'Earth Power',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.1,
    type: 'Ground',
    flavor: 'The ground underneath the target erupts. The target\'s special defense may drop.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => SpdNerf(inp.target, inp, 0.1),
  },
  'Echoed Voice': {
    name: 'Echoed Voice',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.4,
    type: 'Normal',
    sound: true,
    flavor: 'The user creates a sound. It raises their special attack.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'spAttack')
  },
  'Eerie Impulse': {
    name: 'Eerie Impulse',
    accuracy: 1,
    attackKey: 'attack', defenseKey: 'defense',
    criticalHit: 0, power: 0,
    type: 'Electric',
    flavor: 'The target is struck by a strange shock wave. Their special attack drops.',
    aoe: 'Single Opponent', zMoveFx: 'SpDefBuff1',
    onBeforeMove: noop,
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'spAttack', -2)
  },
  'Eerie Spell': {
    name: 'Eerie Spell', type: 'Psychic',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1, accuracy: 1, criticalHit: 1,
    aoe: 'Single Opponent',
    flavor: 'The user speaks an incantation that strikes the opponent with telekinetic power.',
  },
  'Egg Bomb': {
    name: 'Egg Bomb',
    accuracy: 0.75,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.2,
    type: 'Normal',
    flavor: 'The user strikes the target with a large egg, scrambling them.',
    aoe: 'Single Opponent',
  },
  'Electric Terrain': {
    name: 'Electric Terrain', type: 'Electric',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'Self', zMoveFx: 'SpdBuff1',
    flavor: 'Zaps the field to make it electrifying. This applies some benefits.',
    onAfterMove: (inp) => setTerrain(inp, 'Electric')
  },
  Electrify: {
    name: 'Electrify', type: 'Electric',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: 1, criticalHit: 0, aoe: 'Single Opponent', zMoveFx: 'SpAtkBuff1',
    flavor: 'The user shoots static electricity at the target. The target will use Electric-type moves this turn.',
    onAfterMove: ({target}) => {
      return APPLY_TEMP_STATUS(target, ConditionMap.Electrified,
        `${target.species} is glowing with static electricity`)
    }
  },
  'Electro Ball': {
    name: 'Electro Ball', type: 'Electric',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1, accuracy: 1, criticalHit: 1,
    flavor: 'A ball of electrical energy strikes the target. Its damage depends on how much faster the user is.',
    aoe: 'Single Opponent',
    onBeforeMove: ({caster, target, move}) => {
      /**
       * More than 100%, or exactly 0	40
       * 50.01% - 100%	60
       * 33.34% - 50%	80
       * 25.01% - 33.33%	120
       * 0.01% - 25%	150
       */
      const speedRatio = target.speed / caster.speed
      if (speedRatio === 0 || speedRatio > 1) {
        move.power = 0.6
      } else if (speedRatio > 0.5) {
        move.power = 0.8
      } else if (speedRatio > 0.33) {
        move.power = 1
      } else if (speedRatio > 0.25) {
        move.power = 1.4
      } else {
        move.power = 1.7
      }
      return new Log()
    },
  },
  'Electro Drift': {
    name: 'Electro Drift', type: 'Electric',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.2, accuracy: 1, criticalHit: 1,
    aoe: 'Single Opponent', contact: true,
    flavor: 'The user strikes like a swift robot. Super-effective hits are much more effective.',
    onBeforeMove: (inp) => {
      const multiplier = typeMatchup['Electric'][inp.target.type1] * typeMatchup['Electric'][inp.target.type2 ?? inp.target.type1]
      if (multiplier > 1) {
        inp.move.power *= 1.5
      }
      return new Log()
    }
  },
  Electroweb: {
    name: 'Electroweb',
    accuracy: 0.95,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.9,
    type: 'Electric',
    flavor: 'The user emits a web of voltage. It traps the target and lowers their speed.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'speed', -1)
  },
  Embargo: {
    name: 'Embargo',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Dark',
    flavor: 'The target loses the ability to use items.',
    aoe: 'Single Opponent', zMoveFx: 'SpAtkBuff1',
    onBeforeMove: noop,
    onAfterMove: ({target}) => {
      // Block item for the whole battle.
      // The canon says 5 turns.
      target.heldItemConsumed = true
      const log = new Log()
      log.add(`${target.species} can no longer use their item`)
      return log
    }
  },
  Ember: {
    name: 'Ember',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.6,
    type: 'Fire',
    flavor: 'The user exhales a small flame. It might burn the target.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Burn(inp, 0.1),
  },
  Encore: {
    name: 'Encore', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: 1, criticalHit: 0,
    aoe: 'Single Opponent',
    flavor: 'The user stirs up a large round of applause. The opponent must keep using the same move until the applause stops.',
    onBeforeMove: (inp) => {
      const lastMoveCondition = getCondition(inp.target, 'LastMove')
      if (!lastMoveCondition) {
        inp.move.failed = true
        return new Log().add('There is nothing to encore...')
      }
      inp.move.type = 'Status'
      return new Log()
    },
    onAfterMove: (inp) => {
      const lastMoveCondition = getCondition(inp.target, 'LastMove')
      const selectedMove = lastMoveCondition!.p!.selectedMove!
      const moves = inp.target.move
      const movepool = inp.target.movepool
      const encore = {...ConditionMap['Encoring']}
      encore.p = { moves, movepool }
      const mIndex = inp.target.movepool.findIndex(m => m.name === selectedMove.name)
      if (mIndex === -1) {
        inp.move.failed = true
        return new Log().add('The move could not be encored')
      }
      return new Log().add(`${inp.target.species} has received an encore`)
    }
  },
  Endeavor: {
    name: 'Endeavor',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Normal',
    flavor: 'The user refuses to give up and strikes the opponent. Its damage depends on how much HP the user has.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({caster, target, move}) => {
      if (getCondition(target, 'Raid')) {
        move.failed = true
      }
      if (caster.currentHp >= target.currentHp) {
        move.failed = true
      }
      move.power = 0
      return new Log()
    },
    onAfterMove: ({caster, target}) => {
      const damage = target.currentHp - caster.currentHp
      return logDamage(target, damage)
    }
  },
  Endure: {
    name: 'Endure', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    criticalHit: 0, power: 0, accuracy: Infinity, priority: 4,
    aoe: 'Self',
    flavor: 'The user braces for impact and survives the next attack.',
    zMoveFx: 'ResetStat',
    onAfterMove: ({caster}) => {
      return APPLY_TEMP_STATUS(caster, ConditionMap.Enduring,
        `${caster.species} braced for impact.`)
    }
  },
  'Energy Ball': {
    name: 'Energy Ball',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.1,
    type: 'Grass',
    flavor: 'The power of nature is turned into a pulse and shot at the target. Their special defense might drop.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => SpdNerf(inp.target, inp, 0.1),
  },
  Eruption: {
    name: 'Eruption',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1,
    type: 'Fire',
    flavor: 'The user erupts with fiery energy. It does more damage the healthier the user is.',
    aoe: 'Nearby Opponents',
    onBeforeMove: POWER_BY_HP,
  },
  'Esper Wing': {
    name: 'Esper Wing',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 3,
    power: 1,
    type: 'Psychic',
    flavor: 'The user flaps its wings, generating gusts of aura and boosting its speed. Critical hits are likely.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'speed', 1),
  },
  'Expanding Force': {
    name: 'Expanding Force', type: 'Psychic',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1, criticalHit: 1, accuracy: 1,
    flavor: 'The user employs psychic power to strike with telekinetic power. In Psychic Terrain this attack does more.',
    aoe: 'Single Opponent',
    onBeforeMove: ({field, move}) => {
      if (field.terrain?.name === 'Psychic') {
        move.power *= 1.5
      }
      return new Log()
    }
  },
  'Explosion': {
    name: 'Explosion',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 2.7,
    type: 'Normal',
    flavor: 'The user explodes in tremendeous fashion. It does devastating damage to all those nearby.',
    aoe: 'Everyone',
    onAfterMove: ({caster}) => {
      caster.currentHp = 0
      caster.fainted = true
      return new Log().add(`${caster.species} exploded!!`)
    }
  },
  Extrasensory: {
    name: 'Extrasensory',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1,
    type: 'Psychic',
    flavor: 'The user strikes with an invisible psychic power. The target might flinch.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Flinch(inp, 0.1),
  },
  'Eternabeam': {
    name: 'Eternabeam',
    accuracy: 0.9,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.8,
    type: 'Dragon',
    flavor: 'Eternatus reveals its ultimate power. Then it cannot move the next turn.',
    aoe: 'Single Opponent',
    onAfterMove: RECHARGE
  },
  'Extreme Speed': {
    name: 'Extreme Speed',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Normal',
    priority: 2,
    flavor: 'The user strikes with blinding speed. This move always goes first.',
    aoe: 'Single Opponent', contact: true,
  },
  Facade: {
    name: 'Facade',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.9,
    type: 'Normal',
    flavor: 'The user strikes the target. This does more damage if the user has a status condition.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({caster, move}) => {
      const statuses = ['Burn', 'Paralyzed', 'Poison']
      if (caster.status) {
        if (statuses.includes(caster.status.name)) {
          move.power *= 2 // Double power
        }
      }
      return new Log()
    },
  },
  'Fairy Lock': {
    name: 'Fairy Lock', type: 'Fairy',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: Infinity, aoe: 'Everyone',
    flavor: 'The user employs key-onic power to lock all Pokémon in the field.',
    onBeforeMove: noop,
    onAfterMove: ({target}) => {
      return APPLY_TEMP_STATUS(target, ConditionMap.TrappedInBattle,
        `${target.species} is trapped in the battle.`)
    }
  },
  'Fairy Wind': {
    name: 'Fairy Wind',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.6,
    type: 'Fairy',
    flavor: 'The user starts blowing a wind with a strange odor.',
    aoe: 'Single Opponent',
  },
  'Fake Out': {
    name: 'Fake Out',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0,
    type: 'Normal',
    priority: 3,
    flavor: 'The user tricks the target, moving first and flinching it.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({move}) => {
      move.power += 0.5 // Set the power here
      return new Log()
    },
    onAfterMove: (inp) => Flinch(inp, 1),
  },
  'Fake Tears': {
    name: 'Fake Tears',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Dark',
    flavor: 'The user starts crying, but wait it\'s a trap. The target\'s special defense drops.',
    aoe: 'Single Opponent', zMoveFx: 'SpAtkBuff1',
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'spDefense', -2),
  },
  'False Surrender': {
    name: 'False Surrender', type: 'Dark',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1, accuracy: Infinity, criticalHit: 1,
    aoe: 'Single Opponent', contact: true,
    flavor: "The user bows its head in surrender. But wait! It's a trap! This attack never misses.",
  },
  'Feather Dance': {
    name: 'Feather Dance',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Flying',
    flavor: 'The user covers the target in feathers, causing the target\'s attack to fall.',
    aoe: 'Single Opponent', zMoveFx: 'DefBuff1',
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'attack', -2),
  },
  'Feint': {
    name: 'Feint', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.5, criticalHit: 1, accuracy: 1,
    aoe: 'Single Opponent', contact: true,
    flavor: "Makes an attack. No it won't. Yes it will. Removes protect.",
    onBeforeMove: ({target}) => {
      if (getCondition(target, 'Protect')) {
        // Break through Protect
        removeCondition(target, 'Protect')
      }
      return new Log()
    },
  },
  'Feint Attack': {
    name: 'Feint Attack',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.8,
    type: 'Dark',
    flavor: 'The user approaches the target and suddenly sucker punches them. This attack always hits.',
    aoe: 'Single Opponent', contact: true,
  },
  'Fell Stinger': {
    name: 'Fell Stinger',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.75,
    type: 'Bug',
    flavor: 'The target feels a sharp stabbing. The user\'s attack rises.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'attack')
  },
  'Fiery Dance': {
    name: 'Fiery Dance', type: 'Fire',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    criticalHit: 1, accuracy: 1, power: 1,
    flavor: 'The user elegantly conjures fire and hits the target. The user\'s special attack may increase.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => {
      if (Math.random() < 0.5) {
        return BUFF_STAT(inp.caster, inp, 'spAttack')
      }
      return new Log()
    }
  },
  'Fiery Wrath': {
    name: 'Fiery Wrath', type: 'Dark',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    criticalHit: 1, accuracy: 1, power: 1.1,
    flavor: 'The user unleashes embers of wrath. The target may flinch.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => {
      return Flinch(inp, 0.2)
    }
  },
  'Fillet Away': {
    name: 'Fillet Away',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Normal',
    flavor: 'The user cuts its HP in half to boost its attacking stats as well as its speed.',
    aoe: 'Self', zMoveFx: 'Heal',
    onBeforeMove: ({caster, move}) => {
      const log = new Log()
      if (caster.currentHp <= caster.totalHp / 2) {
        move.failed = true
        log.add(`${caster.species} is too weak`)
      }
      return log
    },
    onAfterMove: (inp) => {
      const log = logDamage(inp.caster, inp.caster.totalHp / 2)
      log.push(BUFF_STAT(inp.caster, inp, 'attack', 2))
      log.push(BUFF_STAT(inp.caster, inp, 'spAttack', 2))
      log.push(BUFF_STAT(inp.caster, inp, 'speed', 2))
      return log
    }
  },
  'Final Gambit': {
    name: 'Final Gambit', type: 'Fighting',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    criticalHit: 1, accuracy: 1, power: 0,
    flavor: 'The user goes all out in a final attack. It faints, but does the same amount of damage to the target.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => {
      const log = new Log()
      const damage = inp.caster.currentHp
      log.push(logDamage(inp.caster, damage))
      log.push(logDamage(inp.target, damage))
      return log
    }
  },
  'Fire Blast': {
    name: 'Fire Blast',
    accuracy: 0.85,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.3,
    type: 'Fire',
    flavor: 'A five-pronged burst of fire strikes the target, which may burn them.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Burn(inp, 0.1),
  },
  'Fire Fang': {
    name: 'Fire Fang',
    accuracy: 0.95,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.85,
    type: 'Fire',
    flavor: 'The user bites the target with hot fangs. This may burn the target.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => Burn(inp, 0.2),
  },
  'Fire Lash': {
    name: 'Fire Lash',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    contact: true,
    criticalHit: 1,
    power: 1,
    type: 'Fire',
    flavor: "The user strkes with a lash made of flames. The target's defense will drop.",
    aoe: 'Single Opponent',
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'defense', -1)
  },
  'Fire Pledge': {
    name: 'Fire Pledge', type: 'Fire',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1, accuracy: 1, criticalHit: 1,
    flavor: 'The user scatters embers around the target. This may have more effects when paired with friends.',
    aoe: 'Single Opponent',
    onBeforeMove: ({move, targetPrefix, field}) => {
      if (field.sides[targetPrefix].pledgeGrass || field.sides[targetPrefix].pledgeWater) {
        move.power *= 1.7
      }
      return new Log()
    },
    onAfterMove: ({prefix, targetPrefix, field}) => {
      const log = new Log()
      field.sides[targetPrefix].pledgeFire = true
      log.add(`Embers scatter across ${targetPrefix} side of the field`)
      if (field.sides[targetPrefix].pledgeGrass) {
        field.sides[targetPrefix].firefield = 4
        log.add('The flowers ignited!')
      }
      if (field.sides[targetPrefix].pledgeWater) {
        field.sides[prefix].rainbow = 4
        log.add('A rainbow has appeared!')
      }
      return log
    }
  },
  'Fire Punch': {
    name: 'Fire Punch',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.95,
    type: 'Fire',
    flavor: 'The user strikes the target with a flaming fist.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => Burn(inp, 0.1),
  },
  'Fire Spin': {
    name: 'Fire Spin', type: 'Fire',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    accuracy: 0.85, criticalHit: 1, power: 0.55,
    flavor: 'The user traps the target in a fiery vortex for several turns.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => {
      const status = {...ConditionMap.Bound}
      if (['bindingband', 'gripclaw'].includes(inp.caster.heldItemKey ?? '')) {
        status.p = {longer: true}
      }
      return APPLY_TEMP_STATUS(inp.target, status,
        `${inp.target.species} became trapped in a fiery vortex!`)
    },
  },
  'First Impression': {
    name: 'First Impression',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0, // Trigger first turn and never again
    type: 'Bug',
    priority: 2,
    flavor: 'The user moves quickly, dealing a great deal of damage at the start of battle.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({move}) => {
      move.power += 1.1 // Set the power here
      return new Log()
    },
  },
  'Fishious Rend': {
    name: 'Fishious Rend', type: 'Water',
    attackKey: 'attack', defenseKey: 'defense', aoe: 'Single Opponent',
    accuracy: 1, criticalHit: 1, power: 1.05, contact: true,
    flavor: 'The user rushes with a fishy jaw. If the user has moved earlier than the target, the power of the attack is doubled.',
    onBeforeMove: ({caster, move}) => {
      if (!getCondition(caster, 'Already Hit')) {
        move.power *= 2
      }
      return new Log()
    }
  },
  'Fissure': {
    name: 'Fissure', type: 'Ground',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 0.3, criticalHit: 1, power: Infinity,
    flavor: 'The earth opens up around the target, knocking them out instantly.',
    aoe: 'Single Opponent',
    onBeforeMove: ohko,
  },
  /**
   * HP ≥ 68.75%	20
   * 35.42% ≤ HP < 68.75%	40
   * 20.83% ≤ HP < 35.42%	80
   * 10.42% ≤ HP < 20.83%	100
   * 4.17% ≤ HP < 10.42%	150
   * HP < 4.17%	200
   */
  'Flail' :{
    name: 'Flail', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 1, criticalHit: 1, power: 1,
    flavor: 'The user strikes the target with a tackle. This move does more damage the more the user is damaged.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({caster, move}) => {
      const ratio = caster.currentHp / caster.totalHp
      if (ratio >= 0.6875) {
        move.power = 0.4
      } else if (ratio >= 0.3542) {
        move.power = 0.6
      } else if (ratio >= 0.2083) {
        move.power = 1
      } else if (ratio >= 0.1042) {
        move.power = 1.2
      } else if (ratio >= 0.0417) {
        move.power = 1.7
      } else {
        move.power = 2.2
      }
      return new Log()
    },
  },
  'Flame Burst': {
    name: 'Flame Burst', type: 'Fire',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 0.9, accuracy: 1, criticalHit: 1,
    flavor: 'The user shoots a ball of fire at the target. Burning embers may hit their neighbors.',
    aoe: 'Single Opponent',
    onAfterMove: nop, // TODO Cannot target neighbors right now
  },
  'Flame Charge': {
    name: 'Flame Charge', type: 'Fire',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.7, accuracy: 1, criticalHit: 1,
    flavor: 'The user strikes the target with a flaming charge. This raises its speed.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'speed', 1)
  },
  'Flame Wheel': {
    name: 'Flame Wheel',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.8,
    type: 'Fire',
    flavor: 'The user curls into a ball and rolls into the target. This may leave a burn.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => Burn(inp, 0.1),
  },
  'Flamethrower': {
    name: 'Flamethrower',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.1,
    type: 'Fire',
    flavor: 'The user shoots a stream of fire at the target, which may leave a burn.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Burn(inp, 0.1),
  },
  'Flare Blitz': {
    name: 'Flare Blitz',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.4,
    type: 'Fire',
    flavor: 'The user charges at the target with great velocity. It damages the user, but might burn the target.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (input) => {
      const log = new Log()
      log.push(Burn(input, 0.1))
      log.push(RECOIL(input, 3))
      return log
    }
  },
  Flash: {
    name: 'Flash', type: 'Normal', aoe: 'Single Opponent',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: 1, zMoveFx: 'EvaBuff1',
    flavor: `The user creates a burst of light, dropping the target's accuracy.`,
    onBeforeMove: ({target, move}) => {
      if (getCondition(target, 'Raid')) {
        move.failed = true
      }
      return new Log()
    },
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'accuracy', -1)
  },
  'Flash Cannon': {
    name: 'Flash Cannon',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1,
    type: 'Steel',
    flavor: 'The user hits the target with a beam of light. It might lower their special defense.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => SpdNerf(inp.target, inp, 0.1),
  },
  Flatter: {
    name: 'Flatter',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Dark',
    flavor: 'The user flatters the target. The target\'s special attack rises, but becomes confused.',
    aoe: 'Single Opponent', zMoveFx: 'SpDefBuff1',
    onBeforeMove: noop,
    onAfterMove: (input) => {
      const log = new Log()
      const {target} = input
      log.push(BUFF_STAT(input.target, input, 'spAttack', 2))
      log.push(APPLY_TEMP_STATUS(target, ConditionMap.Confusion,
        `${target.species} grew confused!`))
      return log
    }
  },
  'Fleur Cannon': {
    name: 'Fleur Cannon',
    accuracy: 0.9,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.5,
    type: 'Fairy',
    flavor: 'The user releases a beam of consolidated flower power. Its special attack subsequently drops.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'spAttack', -2)
  },
  'Flip Turn': {
    name: 'Flip Turn', type: 'Water',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 1, criticalHit: 1, power: 0.8,
    flavor: "The user charges forward and then says 'eau revoir'.",
    aoe: 'Single Opponent',
    onAfterMove: (inp) => {
      if (getCondition(inp.caster, 'TrappedInBattle')) {
        return new Log()
      }
      return APPLY_TEMP_STATUS(inp.caster, {...ConditionMap['SwitchOut']},
        `${inp.caster.species} says "eau revoir"!`)
    },
  },
  'Floral Healing': {
    name: 'Floral Healing', type: 'Fairy', aoe: 'Single Ally', recovery: true,
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: Infinity, zMoveFx: 'ResetStat',
    flavor: 'The user employs flowers to do its bidding: healing an ally.',
    onAfterMove: (inp) => {
      const {field, caster} = inp
      if (field.terrain?.name === 'Grassy') {
        return logHeal(caster, caster.totalHp)
      }
      return logHeal(caster, caster.totalHp / 2)
    }
  },
  'Flower Shield': {
    name: 'Flower Shield', type: 'Fairy',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, criticalHit: 0, power: 0,
    aoe: 'Everyone', zMoveFx: 'DefBuff1',
    flavor: 'A mysterious power boosts the defense of all Grass-types on the field.',
    onBeforeMove: noop,
    onAfterMoveOnce: (inp) => {
      const {caster} = inp
      if (caster.type1 === 'Grass' || caster.type2 === 'Grass') {
        return BUFF_STAT(caster, inp, 'defense', 1)
      }
      return new Log()
    },
    onAfterMove: (inp) => {
      const {target} = inp
      if (target.type1 === 'Grass' || target.type2 === 'Grass') {
        return BUFF_STAT(target, inp, 'defense', 1)
      }
      return new Log()
    },
  },
  'Flower Trick': {
    name: 'Flower Trick', type: 'Grass',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.9, accuracy: Infinity, criticalHit: Infinity,
    aoe: 'Single Opponent',
    flavor: "The user gives flowers to the target. Oh no, it's a trap! This move always hits and is always a critical hit."
  },
  'Fly': {
    name: 'Fly',
    accuracy: 0.95,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.1,
    type: 'Flying',
    flavor: 'The user flies into the air and later strikes the target.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: (inp) => {
      const log = failsIfGravity(inp)
      log.push(multiTurnOnBeforeMove(inp, 'InAir', 'flew to the skies', 'came down from the sky!'))
      return log
    },
    onAfterMove: (inp) => multiTurnOnAfterMove(inp, 'InAir'),
  },
  'Flying Press': {
    name: 'Flying Press', type: 'Status',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 0.95, power: 1.2, criticalHit: 1, aoe: 'Single Opponent',
    flavor: 'The user flies and crashes into the target. This move is both Fighting and Flying-type.',
    onBeforeMove: (inp) => {
      const {move, target} = inp
      move.power *= typeMatchup['Flying'][target.type1]
      move.power *= typeMatchup['Flying'][target.type2 || 'Status']
      move.power *= typeMatchup['Fighting'][target.type1]
      move.power *= typeMatchup['Fighting'][target.type2 || 'Status']
      const log = new Log()
      log.push(failsIfGravity(inp))
      return log
    },
  },
  'Focus Blast': {
    name: 'Focus Blast',
    accuracy: 0.7,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.4,
    type: 'Fighting',
    flavor: 'The user strikes with a pulse of aggressive aura. This may lower the target\'s special defense.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => SpdNerf(inp.target, inp, 0.1),
  },
  'Focus Energy': {
    name: 'Focus Energy', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0,
    flavor: 'The user takes a moment to focus. Their next hits might be more critical.',
    aoe: 'Self', zMoveFx: 'AccBuff1',
    onBeforeMove: noop,
    onAfterMove: (inp) => {
      return BUFF_STAT(inp.caster, inp, 'criticalHit', 1)
    }
  },
  'Focus Punch': {
    name: 'Focus Punch', type: 'Fighting',
    attackKey: 'attack', defenseKey: 'defense', priority: -3,
    accuracy: 1, criticalHit: 1, power: 1.7,
    flavor: 'The user takes a turn to focus. If they can stay focused, this attack does a lot of damage.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({caster, move}) => {
      const cantFocus = getCondition(caster, 'AlreadyHit')
      const log = new Log()
      if (cantFocus) {
        move.failed = true
        return new Log().add(`${caster.species} broke its concentration`)
      }
      log.add(`${caster.species} released its focus`)
      return log
    },
  },
  'Follow Me': {
    name: 'Follow Me', type: 'Normal',
    accuracy: Infinity, power: 0, criticalHit: 0, aoe: 'Self', priority: 2,
    attackKey: 'attack', defenseKey: 'defense',
    flavor: 'Makes self the center of attention with a distracting motion.',
    onAfterMove: ({caster, prefix, field}) => {
      field.sides[prefix].target = caster
      return new Log().add(`${caster.species} became the center of attention`)
    }
  },
  'Force Palm': {
    name: 'Force Palm',
    accuracy: 1,
    attackKey: 'attack', defenseKey: 'defense',
    criticalHit: 1,
    power: 0.8,
    type: 'Fighting',
    flavor: 'The user strikes with open palms, which might paralyze the target.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => Paralyze(inp, 0.3)
  },
  'Foresight': {
    name: 'Foresight', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: 1, criticalHit: 0,
    flavor: 'Using infrared vision, the user is able to hit Ghost-types with Normal and Fighting-type moves.',
    aoe: 'Single Opponent', zMoveFx: 'CriticalHit',
    onAfterMove: (inp) => {
      // In a slight change from the main series games, in order to esure that
      // the move is properly typed
      return APPLY_TEMP_STATUS(inp.target, ConditionMap.Sleuthed,
        `${inp.target.species} has been identified!`)
    }
  },
  [`Forest's Curse`]: {
    name: `Forest's Curse`, type: 'Grass',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: 1,
    // This is slightly different from MSG
    flavor: 'The target is hit by a strange force and becomes Grass-type.',
    aoe: 'Single Opponent', zMoveFx: 'BuffAll1',
    onAfterMove: ({target}) => {
      target.type1 = 'Grass'
      target.type2 = undefined
      return new Log().add(`${target.species} became a Grass-type.`)
    },
  },
  'Foul Play': {
    name: 'Foul Play',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.9,
    type: 'Dark',
    flavor: 'The user hits the target with anger. The user does more damage the higher the target\'s attack.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: function({target, move}) {
      // Cannot exceed 3x
      const multiplier = Math.min(target.attack / 100, 3)
      move.power *= multiplier
      return new Log()
    },
  },
  'Freeze-Dry': {
    name: 'Freeze-Dry', type: 'Ice',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 0.9, criticalHit: 1, accuracy: 1, aoe: 'Single Opponent',
    flavor: 'A rapid cooling of the target may leave them frozen. This move is super-effective against Water-types.',
    onBeforeMove: ({target, move}) => {
      if ([target.type1, target.type2].includes('Water')) {
        // Will be an odd message for some combinations
        move.power *= 2
        return new Log().add(`It's super-effective!`)
      }
      return new Log()
    },
    onAfterMove: (inp) => Freeze(inp, 0.1),
  },
  'Freeze Shock': {
    name: 'Freeze Shock', type: 'Ice',
    attackKey: 'attack', defenseKey: 'defense',
    criticalHit: 1, accuracy: 0.9, power: 1.6,
    flavor: 'The user unleashes by a burst of shocking cold. This may leave the target paralyzed.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Paralyze(inp, 0.3),
  },
  'Freezing Glare': {
    name: 'Freezing Glare', type: 'Psychic',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.1, accuracy: 1, criticalHit: 1,
    aoe: 'Single Opponent',
    flavor: 'The user shoots a telekinetic laser from its eyes, potentially freezing the target.',
    onAfterMove: (inp) => {
      return Freeze(inp, 0.1)
    }
  },
  'Frenzy Plant': {
    name: 'Frenzy Plant',
    accuracy: 0.9,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.7,
    type: 'Grass',
    flavor: 'The user conjures large roots to strike the target. The user needs to recharge afterwards.',
    aoe: 'Single Opponent',
    onAfterMove: RECHARGE
  },
  'Frost Breath': {
    name: 'Frost Breath', type: 'Ice',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 0.8, accuracy: 0.9, criticalHit: Infinity,
    flavor: 'The user exhales a freezing stream of air. This always lands a critical hit.',
    aoe: 'Single Opponent',
  },
  Frustration: {
    name: 'Frustration',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.71, // MSG - BP b/w 1-102, half is 51
    type: 'Normal',
    flavor: 'The user attacks with the power of anger',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({caster, move}) => {
      // TODO: Switch to a falsy statement
      if (!caster.badge.personality.affectionate) {
        move.power *= 2
      }
      return new Log()
    },
  },
  'Fury Attack': {
    name: 'Fury Attack',
    accuracy: 0.85,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.9,
    type: 'Normal',
    flavor: 'The user strikes repeatedly with a beak or horn.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({move}) => HIT_MANY(move, 0.3, 2, 5),
  },
  'Fury Cutter': {
    name: 'Fury Cutter',
    accuracy: 0.95,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.4,
    type: 'Bug',
    flavor: 'The user strikes with sharp claws. It\'s attack rises.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'attack')
  },
  'Fury Swipes': {
    name: 'Fury Swipes', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    criticalHit: 1, accuracy: 1, power: 0.8,
    flavor: 'The user angrily strikes the opponent several times in a row with claws.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({move}) => HIT_MANY(move, 0.18, 2, 5),
  },
  'Fusion Bolt': {
    name: 'Fusion Bolt', type: 'Electric',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.2, accuracy: 1, criticalHit: 1,
    flavor: 'The user strikes with a large bolt of lightning. This attack does more damage when paired with fire.',
    aoe: 'Single Opponent',
    onBeforeMove: ({field, prefix, move}) => {
      if (field.sides[prefix].fusionFire) {
        move.power *= 2
      }
      return new Log()
    },
    onAfterMove: ({field, prefix}) => {
      field.sides[prefix].fusionElectric = true
      return new Log()
    }
  },
  'Fusion Flare': {
    name: 'Fusion Flare', type: 'Fire',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.2, accuracy: 1, criticalHit: 1,
    flavor: 'The user strikes with a burst of blue fire. This attack does more damage when paired with lightning.',
    aoe: 'Single Opponent',
    onBeforeMove: ({field, prefix, move}) => {
      if (field.sides[prefix].fusionElectric) {
        move.power *= 2
      }
      return new Log()
    },
    onAfterMove: ({field, prefix}) => {
      field.sides[prefix].fusionFire = true
      return new Log()
    }
  },
  'Future Sight': {
    name: 'Future Sight', type: 'Psychic',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.4, accuracy: 1, criticalHit: 0,
    flavor: 'The user foresees an attack of psychic energy.',
    aoe: 'Single Opponent',
    onBeforeMove: ({move, target}) => {
      move.power = 0 // Do no damage this turn
      if (getCondition(target, 'Future Seen')) {
        move.failed = true
        return new Log().add("This Pokémon's future has already been seen.")
      }
      return new Log()
    },
    onAfterMove: ({target, caster}) => {
      const condition = {...ConditionMap['Future Seen']}
      const atkStat = caster.spAttack
      const stab = (() => {
        if (caster.type1 === 'Psychic') return 1.5
        if (caster.type2 === 'Psychic') return 1.5
        return 1
      })()
      const movePower = 1.4
      const defStat = target.spDefense
      const dmg = atkStat * stab * movePower / defStat * 50
      const log = new Log()
      log.debug(`Future sight DMG calculated as ${dmg}`)
      log.debug(`${dmg} = (${atkStat} * ${stab} * ${movePower} / ${defStat} * 50)`)
      condition.p = {dmg}
      log.push(APPLY_TEMP_STATUS(target, condition, `${caster.species} foresaw an attack!`))
      return log
    },
  },
  'Gear Grind': {
    name: 'Gear Grind', type: 'Steel',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 0.85, criticalHit: 1, power: 1.2,
    flavor: 'The user attacks with several gears.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: () => {
      const log = new Log()
      log.add('Hit two times')
      return log
    },
  },
  Geomancy: {
    name: 'Geomancy', type: 'Fairy',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0,
    aoe: 'Self', zMoveFx: 'BuffAll1',
    flavor: 'The user draws the power of life itself to boost its stats over two turns.',
    onBeforeMove: (inp) =>
      multiTurnOnBeforeMove(inp, 'Geomancying', 'started drawing energy', 'has collected enough energy'),
    onAfterMove: (inp) => {
      const log = multiTurnOnAfterMove(inp, 'Geomancying')
      if (inp.move['turnone']) return log
      log.push(BUFF_STAT(inp.caster, inp, 'spAttack', 2))
      log.push(BUFF_STAT(inp.caster, inp, 'spDefense', 2))
      log.push(BUFF_STAT(inp.caster, inp, 'speed', 2))
      removeCondition(inp.caster, 'Geomancying')
      return log
    }
  },
  'Giga Drain': {
    name: 'Giga Drain',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.95,
    type: 'Grass',
    flavor: 'The user drains the target of its energy.',
    aoe: 'Single Opponent',
    onAfterMove: ({caster, target, damage}) => {
      const log = logDrain(caster, damage!, 2)
      log.add(`${target.species} had its energy drained`)
      return log
    }
  },
  'Giga Impact': {
    name: 'Giga Impact',
    accuracy: 0.9,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.7,
    type: 'Normal',
    flavor: 'The user chages at the target with devastating damage. The user cannot move for the next turn.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: RECHARGE
  },
  'Gigaton Hammer': {
    name: 'Gigaton Hammer', type: 'Steel',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.8, criticalHit: 1, accuracy: 1,
    flavor: 'The user slams a massive hammer down. Afterwards, its wrists will be sore and cannot use the same move again.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => APPLY_TEMP_STATUS(inp.caster, {...ConditionMap.HammerTime},
      `${inp.caster} needs to put some ice on its wrists.`)
  },
  'Glacial Lance': {
    name: 'Glacial Lance', type: 'Ice',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.4, accuracy: 1, criticalHit: 1,
    aoe: 'Nearby Opponents',
    flavor: 'The user thrusts its ice-tipped lance forward, striking opposing Pokémon.',
  },
  'Glaciate': {
    name: 'Glaciate', type: 'Ice',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 0.85, accuracy: 0.95, criticalHit: 1,
    flavor: 'The user attacks with a frosty breath. This may lower the target\'s speed.',
    aoe: 'Nearby Opponents',
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'speed', -1)
  },
  'Glaive Rush': {
    name: 'Glaive Rush', type: 'Dragon',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.4, criticalHit: 1, accuracy: 1,
    flavor: 'The user charges recklessly into the target. Afterwards, it will be highly vulnerable to counter-attacks.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => APPLY_TEMP_STATUS(inp.caster, {...ConditionMap.Glaiven},
      `${inp.caster} is highly vulnerable.`)
  },
  'Glare': {
    name: 'Glare',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Normal',
    flavor: 'The user gives the target a devastating stare. The target gets paralyzed.',
    aoe: 'Single Opponent', zMoveFx: 'SpDefBuff1',
    onAfterMove: (inp) => Paralyze(inp, 1),
  },
  'Grass Knot': {
    name: 'Grass Knot', type: 'Grass',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1, accuracy: 1, criticalHit: 1,
    flavor: 'The user trips the target with blades of grass. The heavier they are, the harder they will fall.',
    aoe: 'Single Opponent',
    onBeforeMove: ({target, move}) => {
      if (target.weight <= 0) {
        move.failed = true
        return new Log().add('The target cannot be tripped.')
      }
      if (target.weight < 10) {
        move.power = 0.4
      } else if (target.weight < 25) {
        move.power = 0.6
      } else if (target.weight < 50) {
        move.power = 0.8
      } else if (target.weight < 100) {
        move.power = 1
      } else if (target.weight < 200) {
        move.power = 1.2
      } else {
        move.power = 1.4
      }
      return new Log()
    }
  },
  'Grass Pledge': {
    name: 'Grass Pledge', type: 'Grass',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1, accuracy: 1, criticalHit: 1,
    flavor: 'The user scatters flowers around the target. This may have more effects when paired with friends.',
    aoe: 'Single Opponent',
    onBeforeMove: ({move, targetPrefix, field}) => {
      if (field.sides[targetPrefix].pledgeFire || field.sides[targetPrefix].pledgeWater) {
        move.power *= 1.7
      }
      return new Log()
    },
    onAfterMove: ({targetPrefix, field}) => {
      const log = new Log()
      field.sides[targetPrefix].pledgeGrass = true
      log.add(`Blooming flowers scatter across ${targetPrefix} side of the field`)
      if (field.sides[targetPrefix].pledgeFire) {
        field.sides[targetPrefix].firefield = 4
        log.add(`The flowers caught fire!`)
      }
      if (field.sides[targetPrefix].pledgeWater) {
        field.sides[targetPrefix].marsh = 4
        log.add(`The flowers turned the ground into mush!`)
      }
      return log
    }
  },
  'Grassy Glide': {
    name: 'Grassy Glide', type: 'Grass',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.9, accuracy: 1, criticalHit: 1,
    // TODO: dynamically set priority
    aoe: 'Single Opponent', contact: true,
    flavor: 'The user charges forward by wading through blades of grass. In Grassy Terrain the user charges faster.',
  },
  'Grassy Terrain': {
    name: 'Grassy Terrain', type: 'Grass',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'Self', zMoveFx: 'DefBuff1',
    flavor: 'Pollinates the field to make it grow. This applies some benefits.',
    onAfterMove: (inp) => setTerrain(inp, 'Grassy')
  },
  'Grass Whistle': {
    name: 'Grass Whistle',
    accuracy: 0.55,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Grass',
    sound: true,
    flavor: 'The user plays a soft melody using grass. The target falls asleep.',
    aoe: 'Single Opponent', zMoveFx: 'SpdBuff1',
    onBeforeMove: noop,
    onAfterMove: (inp) => Sleep(inp, 1),
  },
  'Grav Apple': {
    name: 'Grav Apple', type: 'Grass',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 1, criticalHit: 1, power: 1,
    flavor: 'The user strikes the target with a sweet apple at terminal velocity. The target\'s defense drops.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'defense', -1),
  },
  'Gravity': {
    name: 'Gravity', type: 'Psychic',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0,
    flavor: 'The user increases the force of gravity. Even Flying-type Pokémon have to land.',
    aoe: 'Everyone', zMoveFx: 'SpAtkBuff1',
    onBeforeMove: noop,
    onAfterMove: ({target}) => {
      const log = new Log()
      if (target.type1 === 'Flying' || target.type2 === 'Flying') {
        APPLY_TEMP_STATUS(target, ConditionMap['Grounded'], `${target.species} landed.`)
      } else if (getCondition(target, 'Float') || getCondition(target, 'FloatUnintentional') || getCondition(target, 'Levitating')) {
        APPLY_TEMP_STATUS(target, ConditionMap['Grounded'], `${target.species} landed.`)
      } else {
        APPLY_TEMP_STATUS(target, ConditionMap['Grounded'])
      }
      return log
    },
  },
  Growl: {
    name: 'Growl',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Normal',
    flavor: 'The user gives a starling roar. The target attack drops.',
    aoe: 'Nearby Opponents', zMoveFx: 'DefBuff1',
    onBeforeMove: noop,
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'attack', -1),
  },
  'Growth': {
    name: 'Growth',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Normal',
    flavor: 'The user absorbs light and grows via photosynthesis. Their attack stats rise.',
    aoe: 'Self', zMoveFx: 'SpAtkBuff1',
    onBeforeMove: noop,
    onAfterMove: (input) => {
      const log = new Log()
      if (input.field.weather.name === 'Heat Wave') {
        log.push(BUFF_STAT(input.caster, input, 'attack', 2))
        log.push(BUFF_STAT(input.caster, input, 'spAttack', 2))
      } else {
        log.push(BUFF_STAT(input.caster, input, 'attack', 1))
        log.push(BUFF_STAT(input.caster, input, 'spAttack', 1))
      }
      return log
    }
  },
  'Grudge': {
    name: 'Grudge', type: 'Ghost',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0,
    aoe: 'Self', zMoveFx: 'Spotlight',
    flavor: `The user puts a curse on itself. If it happens to get KO'd, the target's attack becomes disabled.`,
    onBeforeMove: noop,
    onAfterMove: (inp) => {
      return APPLY_TEMP_STATUS(inp.caster, {...ConditionMap.Begrudged},
        `${inp.prefix} ${inp.caster.species} placed a curse upon itself.`)
    }
  },
  'Guard Split': {
    name: 'Guard Split',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Psychic',
    flavor: 'The user goes to the target and averages out their defenses.',
    aoe: 'Single Opponent', zMoveFx: 'SpdBuff1',
    onBeforeMove: ({target, move}) => {
      if (getCondition(target, 'Raid')) {
        move.failed = true
        return new Log().add('But it failed...')
      }
      return new Log()
    },
    onAfterMove: ({caster, target}) => {
      const defSum = caster.defense + target.defense
      const spdSum = caster.spDefense + target.spDefense
      caster.defense = defSum/2
      caster.spDefense = spdSum/2
      target.defense = defSum/2
      target.spDefense = spdSum/2
      const log = new Log()
      log.add(`${caster.species} and ${target.species} split their Defense and Special Defense stats`)
      return log
    }
  },
  'Guard Swap': {
    name: 'Guard Swap',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Psychic',
    flavor: 'The user swaps its defense stats with the target.',
    aoe: 'Single Opponent',
    onBeforeMove: ({target, move}) => {
      if (getCondition(target, 'Raid')) {
        move.failed = true
        return new Log().add('But it failed...')
      }
      return new Log()
    },
    onAfterMove: ({caster, target}) => {
      const casterDef = caster.defense
      const casterSpd = caster.spDefense
      caster.defense = target.defense
      caster.spDefense = target.spDefense
      target.defense = casterDef
      target.spDefense = casterSpd
      const log = new Log()
      log.add(`${caster.species} and ${target.species} swapped their Defense and Special Defense stats`)
      return log
    }
  },
  'Guillotine': {
    name: 'Guillotine', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 0.3, criticalHit: 1, power: Infinity,
    flavor: 'The user strikes at the target\'s neck. The target faints instantly.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ohko,
  },
  'Gunk Shot': {
    name: 'Gunk Shot',
    accuracy: 0.8,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.4,
    type: 'Poison',
    flavor: 'The user hauls a ton of garbage at the target, potentially poisoning them.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Poison(inp, 0.3),
  },
  Gust: {
    name: 'Gust', type: 'Flying',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    accuracy: 1, criticalHit: 1, power: 0.6,
    flavor: 'The user strikes with a short burst of wind.',
    aoe: 'Single Opponent',
  },
  'Gyro Ball': {
    name: 'Gyro Ball',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Steel',
    flavor: 'The user rolls forward at the target. This attack does more damage the slower the user is.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: function({caster, target, move}) {
      // Cannot exceed 3x
      const multiplier = Math.min(target.speed / caster.speed / 1.5, 3)
      move.power *= multiplier
      return new Log()
    },
  },
  Hail: {
    name: 'Hail',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Ice',
    flavor: 'The user conjures a snowstorm.',
    aoe: 'Self', zMoveFx: 'SpdBuff1',
    onBeforeMove: noop,
    onAfterMove: ({field}) => {
      const log = new Log()
      field.weather = {...Weathers.Snow}
      log.add('Hail began falling.')
      return log
    }
  },
  'Hammer Arm': {
    name: 'Hammer Arm',
    accuracy: 0.9,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.2,
    type: 'Fighting',
    flavor: 'The user slams its arm at the target, but the user\'s speed drops.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'speed', -1)
  },
  'Happy Hour': {
    name: 'Happy Hour', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: Infinity, aoe: 'Self', zMoveFx: 'BuffAll1',
    flavor: 'The user decides to celebrate for the next alloted time period.',
    onAfterMove: () => {
      return new Log().add(`Celebrate for the next hour. That is 60 minutes. That is 3600 seconds.`)
    }
  },
  'Harden': {
    name: 'Harden',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Normal',
    flavor: 'The user causes its body to grow strong, boosting its defense.',
    aoe: 'Self', zMoveFx: 'DefBuff1',
    onBeforeMove: noop,
    onAfterMove: (inp) => {
      return DefBuff(inp.caster, inp, 1)
    }
  },
  'Haze': {
    name: 'Haze',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Ice',
    flavor: 'The user emits a smoky gas which resets stat changes.',
    aoe: 'Everyone', zMoveFx: 'Heal',
    onBeforeMove: noop,
    onAfterMove: ({caster, target}) => {
      caster.statBuffs.attack = 0
      caster.statBuffs.defense = 0
      caster.statBuffs.spAttack = 0
      caster.statBuffs.spDefense = 0
      caster.statBuffs.speed = 0
      caster.statBuffs.accuracy = 0
      caster.statBuffs.evasiveness = 0

      target.statBuffs.attack = 0
      target.statBuffs.defense = 0
      target.statBuffs.spAttack = 0
      target.statBuffs.spDefense = 0
      target.statBuffs.speed = 0
      target.statBuffs.accuracy = 0
      target.statBuffs.evasiveness = 0

      const log = new Log()
      log.add(`The stat changes of ${caster.species} and ${target.species} were reset`)
      return log
    }
  },
  'Headbutt': {
    name: 'Headbutt', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.9, accuracy: 1, criticalHit: 1,
    flavor: 'The user charges with its head. The target might flinch',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Flinch(inp, 0.3)
  },
  'Head Charge': {
    name: 'Head Charge', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.4, accuracy: 1, criticalHit: 1,
    flavor: 'The user charges and headbutts the target. This may also damage the user.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => RECOIL(inp, 4)
  },
  'Headlong Rush': {
    name: 'Headlong Rush',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.4,
    type: 'Ground',
    flavor: 'The user slams into the target at close range. The damage is immense, but its own defenses lower.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => {
      const log = new Log()
      log.push(BUFF_STAT(inp.caster, inp, 'defense', -1))
      log.push(BUFF_STAT(inp.caster, inp, 'spDefense', -1))
      return log
    }
  },
  'Head Smash': {
    name: 'Head Smash',
    accuracy: 0.8,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.7,
    type: 'Rock',
    flavor: 'The user smashes its head into the target. This damages the user a lot.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => RECOIL(inp, 2),
  },
  'Heal Bell': {
    name: 'Heal Bell', type: 'Normal', aoe: 'All Allies',
    attackKey: 'attack', defenseKey: 'defense', recovery: true,
    power: 0, criticalHit: 0, accuracy: Infinity, zMoveFx: 'Heal',
    flavor: `A pleasant bell chime rings through the user's allies, healing their status conditions.`,
    onAfterMove: ({target}) => {
      const log = new Log()
      if (target.status) {
        log.add(`${target.species} is no longer ${target.status.name}`)
        target.status = undefined
        removeCondition(target, 'PoisonBad')
      }
      return log
    }
  },
  'Heal Block': {
    name: 'Heal Block', type: 'Psychic',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: 1, criticalHit: 0,
    aoe: 'Nearby Opponents', zMoveFx: 'SpAtkBuff2',
    flavor: 'Casts a mystical spell which prevents affected targets from any healing.',
    onBeforeMove: noop,
    onAfterMove: (inp) => {
      return APPLY_TEMP_STATUS(inp.target, {...ConditionMap['HealBlocked']},
        `${inp.target.species} has been blocked from healing`)
    }
  },
  'Heal Order': {
    name: 'Heal Order',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Bug',
    flavor: 'The order is given. The queen must recover some of its health.',
    aoe: 'Self', recovery: true, zMoveFx: 'ResetStat',
    onAfterMove: ({caster}) => {
      const log = logHeal(caster, caster.totalHp / 2)
      log.add(`${caster.species} healed itself`)
      return log
    }
  },
  'Heal Pulse': {
    name: 'Heal Pulse', type: 'Psychic',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, criticalHit: 0, power: 0,
    aoe: 'Single Ally', recovery: true, zMoveFx: 'ResetStat',
    flavor: 'The user emits a burst of healing energy at the target.',
    onAfterMove: ({target}) => logHeal(target, target.totalHp/2)
  },
  'Heart Swap': {
    name: 'Heart Swap', type: 'Psychic',
    attackKey: 'attack', defenseKey: 'defense',
    criticalHit: 0, accuracy: Infinity, power: 0,
    flavor: 'The user switches hearts with the target, switching stats as well.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => {
      const targetStats = {...inp.target.statBuffs}
      const casterStats = {...inp.caster.statBuffs}
      inp.target.statBuffs = casterStats
      inp.caster.statBuffs = targetStats
      return new Log().add(`${inp.caster.species} swapped stats with ${inp.target.species}`)
    },
  },
  'Heart Stamp': {
    name: 'Heart Stamp', type: 'Psychic',
    attackKey: 'attack', defenseKey: 'defense',
    criticalHit: 1, accuracy: 1, power: 0.95,
    flavor: 'The user sneaks up and strikes a vicious blow. The target might flinch.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => Flinch(inp, 0.3),
  },
  'Heat Crash': {
    name: 'Heat Crash', type: 'Fire',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1, accuracy: 1, criticalHit: 1,
    flavor: 'The user falls into the target at terminal velocity. If the user is much heavier, the attack does more damage.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({caster, target, move}) => {
      if (target.weight <= 0 || caster.weight <= 0) {
        move.failed = true
        return new Log().add('The target cannot be crashed into.')
      }
      const ratio = target.weight / caster.weight

      if (ratio > 0.5) {
        move.power = 0.6
      } else if (ratio > 0.33) {
        move.power = 0.8
      } else if (ratio > 0.25) {
        move.power = 1
      } else if (ratio > 0.2) {
        move.power = 1.2
      } else {
        move.power = 1.4
      }
      return new Log()
    }
  },
  'Heat Wave': {
    name: 'Heat Wave',
    accuracy: 0.9,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.15,
    type: 'Fire',
    flavor: 'The user unleashes a burst of hot air, hitting targets.',
    aoe: 'Nearby Opponents',
    onAfterMove: (inp) => Burn(inp, 0.1)
  },
  'Heavy Slam': {
    name: 'Heavy Slam', type: 'Steel',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1, accuracy: 1, criticalHit: 1,
    flavor: 'The user slams into the target. If the user is much heavier, the attack does more damage.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({caster, target, move}) => {
      if (target.weight <= 0 || caster.weight <= 0) {
        move.failed = true
        return new Log().add('The target cannot be slammed.')
      }
      const ratio = target.weight / caster.weight

      if (ratio > 0.5) {
        move.power = 0.6
      } else if (ratio > 0.33) {
        move.power = 0.8
      } else if (ratio > 0.25) {
        move.power = 1
      } else if (ratio > 0.2) {
        move.power = 1.2
      } else {
        move.power = 1.4
      }
      return new Log()
    }
  },
  'Helping Hand': {
    name: 'Helping Hand', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0,
    priority: 5, aoe: 'Single Ally', zMoveFx: 'ResetStat',
    flavor: 'Helps out an ally with their attack.',
    onAfterMove: ({caster, target}) => {
      return APPLY_TEMP_STATUS(target, ConditionMap['Hand Helped'],
        `${caster.species} is ready to help ${target.species}.`)
    }
  },
  'Hex': {
    name: 'Hex', type: 'Ghost',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 0.8, accuracy: 1, criticalHit: 1,
    flavor: 'The user strikes with spooky energy. If the target has a status condition, this attack does more damage.',
    aoe: 'Single Opponent',
    onBeforeMove: ({target, move}) => {
      if (target.status?.name) {
        move.power *= 2
      }
      return new Log()
    },
  },
  'Hidden Power': {
    name: 'Hidden Power',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.2,
    type: 'Normal',
    flavor: 'The user strikes with a mysterious power. Even the type of the move might change!',
    aoe: 'Single Opponent',
    onGetType: (caster) => {
      if (!caster['hiddenPowerType']) {
        caster['hiddenPowerType'] = randomItem([
          'Bug', 'Normal', 'Fighting', 'Flying', 'Fire', 'Poison', 'Fairy', 'Ghost',
          'Psychic', 'Dark', 'Dragon', 'Steel', 'Water', 'Grass', 'Ice', 'Electric',
          'Ground', 'Rock'
        ])
      }
      return caster['hiddenPowerType']
    },
    onBeforeMove: ({caster, move}) => {
      // Randomly assign a type to the move
      if (caster['hiddenPowerType']) {
        move.type = caster['hiddenPowerType']
      }
      return new Log()
    },
  },
  'High Horsepower': {
    name: 'High Horsepower', type: 'Ground',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.15, accuracy: 0.95, criticalHit: 1,
    flavor: 'The user strikes fiercely with great effort.',
    aoe: 'Single Opponent',
  },
  'High Jump Kick': {
    name: 'High Jump Kick',
    accuracy: 0.9,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.5,
    type: 'Fighting',
    flavor: 'The user jumps high in the air and tries to strike. If it misses, it gets hurt.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: (inp) => {
      return failsIfGravity(inp)
    },
    onMiss: ({caster}) => {
      const log = new Log()
      log.add(`${caster.species} kept going and crashed!`)
      log.push(logDamage(caster, caster.totalHp / 6))
      return log
    }
  },
  'Hold Back': {
    name: 'Hold Back', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.6, criticalHit: 1, accuracy: 1, aoe: 'Single Opponent',
    flavor: 'The user strikes at the opponent, but it seems to not be doing so whole-heartedly.',
    onAfterMove: ({target}) => {
      if (target.currentHp <= 0) {
        return logHeal(target, 1)
      }
      return new Log()
    }
  },
  'Hold Hands': {
    name: 'Hold Hands', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 1, accuracy: Infinity, aoe: 'Single Ally',
    flavor: 'The user holds hands with an ally.',
    onBeforeMove: noop,
    onAfterMove: ({caster, target}) => {
      return new Log().add(`${caster.species} grabs onto ${target.species}'s hand. Cute.`)
    }
  },
  'Hone Claws': {
    name: 'Hone Claws', type: 'Dark',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, criticalHit: 0, power: 0,
    flavor: 'The user sharpens its claws and prepares to attack. Its attack and accuracy rise.',
    aoe: 'Self', zMoveFx: 'AtkBuff1',
    onBeforeMove: noop,
    onAfterMove: (inp) => {
      const log = new Log()
      log.push(BUFF_STAT(inp.caster, inp, 'attack', 1))
      log.push(BUFF_STAT(inp.caster, inp, 'accuracy', 1))
      return log
    }
  },
  'Horn Attack': {
    name: 'Horn Attack', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 1, criticalHit: 1, power: 0.85,
    flavor: 'The user rams its horn into the target.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: nop, onAfterMove: nop,
  },
  'Horn Drill': {
    name: 'Horn Drill', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 0.3, criticalHit: 1, power: Infinity,
    flavor: 'The user bores its horn into the target. The target faints instantly.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ohko,
  },
  'Horn Leech': {
    name: 'Horn Leech', type: 'Grass',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 1, criticalHit: 1, power: 0.95,
    flavor: 'The user jams its horn into the target and saps the target\'s energy.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: ({caster, target, damage}) => {
      const log = logDrain(caster, damage!, 2)
      log.add(`${target.species} had its energy drained`)
      return log
    }
  },
  Howl: {
    name: 'Howl', type: 'Normal', sound: true,
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, criticalHit: 0, power: 0,
    flavor: 'The user lets out a loud howl. Its attack rises.',
    aoe: 'Self', zMoveFx: 'AtkBuff1',
    onBeforeMove: noop,
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'attack', 1)
  },
  Hurricane: {
    name: 'Hurricane',
    accuracy: 0.7,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.3,
    type: 'Flying',
    flavor: 'The user unleashes a strong gust of stormy wind. The target might be confused.',
    aoe: 'Single Opponent',
    onBeforeMove: ({move, field}) => {
      if (field.weather.name === 'Rain') {
        move.accuracy = Infinity
      } else if (field.weather.name === 'Heat Wave') {
        move.accuracy *= 0.5/0.7
      }
      return new Log()
    },
    onAfterMove: (inp) => Confuse(inp, 0.3),
  },
  'Hydro Cannon': {
    name: 'Hydro Cannon',
    accuracy: 0.9,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.7,
    type: 'Water',
    flavor: 'The user emits a massive burst of water at the target. The user cannot move the next turn.',
    aoe: 'Single Opponent',
    onAfterMove: RECHARGE
  },
  'Hydro Pump': {
    name: 'Hydro Pump',
    accuracy: 0.8,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.3,
    type: 'Water',
    flavor: 'The user puts out a blast of cold water.',
    aoe: 'Single Opponent',
  },
  'Hydro Steam': {
    name: 'Hydro Steam',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1,
    type: 'Water',
    flavor: "A boiling-hot water stream strikes the target. This move's power is boosted in sun.",
    aoe: 'Single Opponent',
    onBeforeMove: (inp) => {
      if (inp.field.weather?.name === 'Heat Wave') {
        inp.move.power *= 2.25 // Take into account the sunlight drop still happens
      }
      return new Log()
    }
  },
  'Hyper Beam': {
    name: 'Hyper Beam',
    accuracy: 0.9,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.7,
    type: 'Normal',
    flavor: 'The user unleashes a devastating burst of energy. The user cannot move the next turn.',
    aoe: 'Single Opponent',
    onAfterMove: RECHARGE
  },
  'Hyper Drill': {
    name: 'Hyper Drill', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.2, criticalHit: 1, accuracy: 1,
    aoe: 'Single Opponent', contact: true,
    flavor: "Spins its body at high speed as it strikes the target. Removes protect.",
    onBeforeMove: ({target}) => {
      if (getCondition(target, 'Protect')) {
        // Break through Protect
        removeCondition(target, 'Protect')
      }
      return new Log()
    },
  },
  'Hyper Fang': {
    name: 'Hyper Fang',
    accuracy: 0.9,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Normal',
    flavor: 'The user bites into the target with sharp fangs. The target might flinch.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => Flinch(inp, 0.1),
  },
  'Hyperspace Fury': {
    name: 'Hyperspace Fury', type: 'Dark',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.2, criticalHit: 1, accuracy: Infinity, aoe: 'Single Opponent',
    flavor: 'Attacks the target with its many arms, from all directions. Even Protect will not be enough.',
    onBeforeMove: ({target}) => {
      if (getCondition(target, 'Protect')) {
        // Break through Protect
        removeCondition(target, 'Protect')
      }
      return new Log()
    },
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'defense', -1),
  },
  'Hyperspace Hole': {
    name: 'Hyperspace Hole', type: 'Psychic',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1, criticalHit: 1, accuracy: Infinity, aoe: 'Single Opponent',
    flavor: 'Attacks the target with an odd portal, from all directions. Even Protect will not be enough.',
    onBeforeMove: ({target}) => {
      if (getCondition(target, 'Protect')) {
        // Break through Protect
        removeCondition(target, 'Protect')
      }
      return new Log()
    },
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'defense', -1),
  },
  'Hyper Voice': {
    name: 'Hyper Voice',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.1,
    type: 'Normal',
    flavor: 'The user creates a loud explosion of noise.',
    aoe: 'Nearby Opponents', sound: true,
  },
  Hypnosis: {
    name: 'Hypnosis',
    accuracy: 0.6,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Psychic',
    flavor: 'The user relaxes the target and puts them to sleep',
    aoe: 'Single Opponent', zMoveFx: 'SpdBuff1',
    onAfterMove: (inp) => Sleep(inp, 1)
  },
  'Ice Ball': {
    name: 'Ice Ball',
    accuracy: 0.9,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Ice',
    flavor: 'The user attacks with multiple ice balls in succession.',
    aoe: 'Single Opponent',
    onBeforeMove: ({move}) => HIT_MANY(move, 0.3, 2, 5),
  },
  'Ice Beam': {
    name: 'Ice Beam',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.1,
    type: 'Ice',
    flavor: 'The target is hit by a chilly beam. They might freeze.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Freeze(inp, 0.1),
  },
  'Ice Burn': {
    name: 'Ice Burn', type: 'Ice',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    criticalHit: 1, accuracy: 0.9, power: 1.6,
    flavor: 'The target is hit by a freezer burn. They might burn.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Burn(inp, 0.3),
  },
  'Ice Fang': {
    name: 'Ice Fang',
    accuracy: 0.95,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.85,
    type: 'Ice',
    flavor: 'The user noms into the target with freezing fangs. It might freeze them.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => Freeze(inp, 0.2),
  },
  'Ice Hammer': {
    name: 'Ice Hammer',
    accuracy: 0.9,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.2,
    type: 'Ice',
    flavor: 'The user smacks opponent, lowering its own speed.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'speed', -1)
  },
  'Ice Punch': {
    name: 'Ice Punch',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.95,
    type: 'Ice',
    flavor: 'The user throws a chilly punch. It might freeze the target.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => Freeze(inp, 0.1),
  },
  'Ice Shard': {
    name: 'Ice Shard',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.6,
    type: 'Ice',
    priority: 1,
    flavor: 'The user chucks an icy brick swiftly.',
    aoe: 'Single Opponent',
  },
  'Ice Spinner': {
    name: 'Ice Spinner', type: 'Ice',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1, accuracy: 1, criticalHit: 1,
    flavor: 'The user spins with icy elegance and strikes the target. This attack will dig up all terrain and deal damage.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: ({field}) => {
      if (field.terrain) {
        field.terrain = undefined
        return new Log().add('The terrain was dug up!')
      }
      return new Log()
    }
  },
  'Icicle Crash': {
    name: 'Icicle Crash',
    accuracy: 0.9,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.05,
    type: 'Ice',
    flavor: 'A large icicle is thrown at the target. It might cause flinching.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Flinch(inp, 0.3),
  },
  'Icicle Spear': {
    name: 'Icicle Spear', type: 'Ice',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    flavor: 'The user attacks with multiple icicles in succession.',
    aoe: 'Single Opponent',
    onBeforeMove: ({move}) => HIT_MANY(move, 0.45, 2, 5),
  },
  'Icy Wind': {
    name: 'Icy Wind',
    accuracy: 0.95,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.85,
    type: 'Ice',
    flavor: 'The user blows a freezing wind. It lowers the targets\' speed.',
    aoe: 'Nearby Opponents',
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'speed', -1),
  },
  Imprison: {
    name: 'Imprison', type: 'Psychic',
    attackKey: 'attack', defenseKey: 'defense',
    criticalHit: 0, power: 0, accuracy: Infinity,
    flavor: 'Blocks the target from using any moves the user knows',
    aoe: 'Single Opponent', zMoveFx: 'SpDefBuff2',
    onBeforeMove: noop,
    onAfterMove: ({caster, target}) => {
      const casterMove = Array.isArray(caster.move) ? caster.move : [caster.move]
      let targetMove = Array.isArray(target.move) ? target.move : [target.move]
      for (let i = 0; i < casterMove.length; i++) {
        const moveIndex = targetMove.indexOf(casterMove[i])
        if (moveIndex > -1) {
          if (target.move.length > 1) {
            target.move.splice(moveIndex, 1)
          } else {
            target.move = ['Struggle']
          }
          if (target.movepool.length > 1) {
            target.movepool.splice(moveIndex, 1)
          } else {
            target.movepool = [{...Movepool['Struggle']}]
          }
          targetMove = Array.isArray(target.move) ? target.move : [target.move]
        }
      }
      return new Log() 
        .add(`${target.species} had moves locked away`)
    }
  },
  Incinerate: {
    name: 'Incinerate', type: 'Fire',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 0.8, accuracy: 1, criticalHit: 1,
    flavor: 'The target is incinerated. Any berries are made crispy.',
    aoe: 'Single Opponent',
    onAfterMove: ({target}) => {
      const log = new Log()
      if (target.heldItem && !target.heldItemTotallyConsumed) {
        if (ITEMS[target.heldItemKey!]!.category === 'berry') {
          target.heldItemConsumed = true
          target.heldItemTotallyConsumed = true
          const hiLabel = ITEMS[target.heldItemKey!].label
          log.add(`The ${hiLabel} that ${target.species} was holding is now charred beyond use.`)
        }
      }
      return log
    }
  },
  'Infernal Parade': {
    name: 'Infernal Parade', type: 'Ghost',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 0.8, accuracy: 1, criticalHit: 1,
    flavor: 'The user attacks with fiery wisps, potentially leaving a burn. If the target has a status condition, this attack does more damage.',
    aoe: 'Single Opponent',
    onBeforeMove: (inp) => {
      if (inp.target.status?.name) {
        inp.move.power *= 2
      }
      return Burn(inp, 0.3)
    },
  },
  Inferno: {
    name: 'Inferno',
    accuracy: 0.5,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.7,
    type: 'Fire',
    flavor: 'A massive flame hits the target, burning them.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Burn(inp, 1),
  },
  'Infestation': {
    name: 'Infestation', type: 'Bug',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    accuracy: 1, criticalHit: 1, power: 0.4,
    flavor: 'The user traps the target in a buggy vortex for several turns.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => {
      const status = {...ConditionMap.Bound}
      if (['bindingband', 'gripclaw'].includes(inp.caster.heldItemKey ?? '')) {
        status.p = {longer: true}
      }
      return APPLY_TEMP_STATUS(inp.target, status,
        `${inp.target.species} became trapped in a buggy vortex!`)
    },
  },
  'Ingrain': {
    name: 'Ingrain',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Grass',
    flavor: 'The user burrows roots into the ground, slowly regaining health.',
    aoe: 'Self', zMoveFx: 'SpDefBuff1',
    onAfterMove: ({caster}) => {
      const log = new Log()
      log.add(`${caster.species} dug roots into the earth`)
      APPLY_TEMP_STATUS(caster, ConditionMap.Ingrained)
      APPLY_TEMP_STATUS(caster, ConditionMap.TrappedInBattle)
      return log
    }
  },
  'Ion Deluge': {
    name: 'Ion Deluge', type: 'Electric',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: Infinity, priority: 1,
    aoe: 'Everyone', zMoveFx: 'SpAtkBuff1',
    flavor: 'The user scatters charged particles on the field, causing Normal-type moves to become Electric-type.',
    onAfterMove: ({field}) => {
      field.ions = true
      return new Log().add('Ions scattered across the field.')
    }
  },
  'Iron Defense': {
    name: 'Iron Defense',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Steel',
    flavor: 'The user reinforces itself, sharply raising defense.',
    aoe: 'Self', zMoveFx: 'ResetStat',
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'defense', 2)
  },
  'Iron Head': {
    name: 'Iron Head',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Steel',
    flavor: 'The user reinforces its head and slams the target, which may cause a flinch.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => Flinch(inp, 0.3),
  },
  'Iron Tail': {
    name: 'Iron Tail',
    accuracy: 0.75,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.2,
    type: 'Steel',
    flavor: 'The user slams into the target with a metallic tail, which may drop the target\'s defense.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => DefNerf(inp.target, inp, 0.3),
  },
  'Ivy Cudgel': {
    name: 'Ivy Cudgel',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 2,
    power: 1.2,
    type: 'Grass',
    flavor: 'An ivy-wrapped cudgel strikes the foe with ferocity. The type of this move depends on the mask being worn.',
    aoe: 'Single Opponent',
    onGetType: (caster) => {
      if (!caster.heldItemKey) return 'Grass'
      return (() => {
        switch (caster.heldItemKey) {
          case 'maskwellspring': {
            return 'Water'
          }
          case 'maskhearthflame': {
            return 'Fire'
          }
          case 'maskcornerstone': {
            return 'Rock'
          }
          default: {
            return 'Grass'
          }
        }
      })()
    },
  },
  'Jaw Lock': {
    name: 'Jaw Lock', type: 'Dark',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1, criticalHit: 1, accuracy: 1,
    aoe: 'Single Opponent', contact: true,
    flavor: 'The user bites down quite hard on the opponent, keeping them both in the match.',
    onAfterMove: ({target}) => {
      return APPLY_TEMP_STATUS(target, ConditionMap.TrappedInBattle,
        `${target.species} is trapped in the battle.`)
    }
  },
  'Jet Punch': {
    name: 'Jet Punch',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.8,
    type: 'Water',
    priority: 1,
    flavor: 'A swift punch covered by a torrent. This move goes quickly.',
    aoe: 'Single Opponent',
    contact: true,
  },
  Judgment: {
    name: 'Judgment', type: 'Normal',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.2, accuracy: 1, criticalHit: 1,
    flavor: 'The user casts its final judgment on the target. The type of this move may vary.',
    aoe: 'Single Opponent',
    onGetType: (caster, _, move) => {
      const plateToMove: {[key in ItemId]?: Type} = {
        insectplate: 'Bug',
        dreadplate: 'Dark',
        dracoplate: 'Dragon',
        earthplate: 'Ground',
        fistplate: 'Fighting',
        flameplate: 'Fire',
        icicleplate: 'Ice',
        ironplate: 'Steel',
        meadowplate: 'Grass',
        mindplate: 'Psychic',
        pixieplate: 'Fairy',
        skyplate: 'Flying',
        splashplate: 'Water',
        spookyplate: 'Ghost',
        stoneplate: 'Rock',
        toxicplate: 'Poison',
        zapplate: 'Electric',
      }
      if (caster.heldItem && !caster.heldItemConsumed) {
        if (plateToMove[caster.heldItemKey!]) {
          move.type = plateToMove[caster.heldItemKey!]!
        }
      }
      return move.type
    },
  },
  'Jump Kick': {
    name: 'Jump Kick',
    accuracy: 0.95,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.2,
    type: 'Fighting',
    flavor: 'The user jumps into the air and tries to strike. If it misses, it gets hurt.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: (inp) => {
      return failsIfGravity(inp)
    },
    onMiss: ({caster}) => {
      const log = new Log()
      log.add(`${caster.species} kept going and crashed!`)
      log.push(logDamage(caster, caster.totalHp / 6))
      return log
    }
  },
  'Jungle Healing': {
    name: 'Jungle Healing', type: 'Grass',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0,
    aoe: 'All Allies', recovery: true,
    flavor: 'The user feeds its friends a chewy root, healing their hit points and status conditions.',
    onAfterMove: ({target}) => {
      target.status = undefined
      removeCondition(target, 'PoisonBad')
      return logHeal(target, target.totalHp / 4)
    }
  },
  'Karate Chop': {
    name: 'Karate Chop', type: 'Fighting',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 1, criticalHit: 2, power: 0.7,
    flavor: 'The user slams its hand into the opponent. Critical hits are more likely.',
    aoe: 'Single Opponent', contact: true,
  },
  Kinesis: {
    name: 'Kinesis', type: 'Psychic',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: 0.8, criticalHit: 0,
    flavor: 'The user distracts the target, lowering their accuracy.',
    aoe: 'Single Opponent', zMoveFx: 'EvaBuff1',
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'accuracy', -1)
  },
  "King's Shield": {
    name: "King's Shield", type: 'Steel',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, power: 0, criticalHit: 0,
    aoe: 'Self', zMoveFx: 'ResetStat',
    priority: 4,
    flavor: 'The user protects itself with a defensive posture. If the target strikes head-on, its attack will drop harshly.',
    onAfterMove: (inp) => APPLY_TEMP_STATUS(inp.caster, ConditionMap.ProtectKing,
      `${inp.caster.species} protected itself`)
  },
  'Knock Off': {
    name: 'Knock Off',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.75,
    type: 'Dark',
    flavor: 'The user smacks the item out of the target\'s hand.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({target, move}) => {
      const log = new Log()
      if (target.heldItem && !target.heldItemConsumed) {
        move.power *= 2
      }
      return log
    },
    onAfterMove: (inp) => {
      return FORCE_CONSUME(inp, 'knocked off')
    }
  },
  'Kowtow Cleave': {
    name: 'Kowtow Cleave',
    accuracy: Infinity,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.05, contact: true,
    type: 'Dark',
    flavor: 'The user bows its head. Oh no, its head has a giant blade on it! This move always hits.',
    aoe: 'Single Opponent',
  },
  "Land's Wrath": {
    name: "Land's Wrath", type: 'Ground',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.1, criticalHit: 1, accuracy: 1, aoe: 'Nearby Opponents',
    flavor: 'All nearby foes are pulled into the land, which is feeling wrathful.'
  },
  'Laser Focus': {
    name: 'Laser Focus', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0,
    flavor: 'The user takes a moment to focus. Their next hits might be more critical.',
    aoe: 'Self', zMoveFx: 'AtkBuff1',
    onBeforeMove: noop,
    onAfterMove: ({caster}) => {
      return APPLY_TEMP_STATUS(caster, ConditionMap.Energized,
        `${caster.species} is lining up its focus.`)
    }
  },
  'Lash Out': {
    name: 'Lash Out', type: 'Dark',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.95, accuracy: 1, criticalHit: 1,
    aoe: 'Single Opponent',
    // FIXME: Only this turn.
    flavor: 'The target growls and strikes with vengeous power. If its stats have dropped more damage is done.',
    onBeforeMove: (inp) => {
      for (const val of Object.values(inp.target.statBuffs)) {
        if (val < 0) {
          inp.move.power *= 2
          return new Log()
        }
      }
      return new Log()
    }
  },
  'Last Respects': {
    name: 'Last Respects', type: 'Ghost',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.7, accuracy: 1, criticalHit: 1,
    aoe: 'Single Opponent',
    flavor: 'The user conjures the souls of its fainted allies to unleash more damage.',
    onBeforeMove: (inp) => {
      const faintedAllies = inp.casters.filter(c => c.fainted).length
      inp.move.power += 0.5 * Math.min(faintedAllies, 5) // Cannot grow greater than 5 allies
      return new Log()
    },
  },
  'Lava Plume': {
    name: 'Lava Plume',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1,
    type: 'Fire',
    flavor: 'The user explodes with gushes of lava, hitting all in sight.',
    aoe: 'Everyone',
    onAfterMove: (inp) => Burn(inp, 0.3),
  },
  'Leafage': {
    name: 'Leafage',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    contact: true,
    criticalHit: 1,
    power: 0.6,
    type: 'Grass',
    flavor: "The target is pelted by sharp leaves.",
    aoe: 'Single Opponent',
  },
  'Leaf Blade': {
    name: 'Leaf Blade',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 2,
    power: 1.1,
    type: 'Grass',
    flavor: 'The user slices with sharp blades of grass. Critical hits are more likely.',
    aoe: 'Single Opponent', contact: true,
  },
  'Leaf Storm': {
    name: 'Leaf Storm',
    accuracy: 0.9,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.5,
    type: 'Grass',
    flavor: 'The user assaults the target with an intense gust of leaves. This reduces the user\'s special attack.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'spAttack', -2),
  },
  'Leaf Tornado': {
    name: 'Leaf Tornado', type: 'Grass',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 0.85, accuracy: 0.9, criticalHit: 1,
    flavor: 'The user creates a vortex of leaves and strikes the target. This may lower the target\'s speed.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => {
      if (Math.random() < 0.5) {
        // Lower speed rather than accuracy
        return BUFF_STAT(inp.target, inp, 'speed', -1)
      }
      return new Log()
    }
  },
  'Leech Life': {
    name: 'Leech Life',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Bug',
    flavor: 'The user absorbs the life force from the target.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: ({caster, target, damage}) => {
      const log = logDrain(caster, damage!, 2)
      log.add(`${target.species} had its energy drained`)
      return log
    }
  },
  'Leech Seed': {
    name: 'Leech Seed', type: 'Grass',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: 0.9, criticalHit: 0,
    flavor: 'The user shoots seeds around the target which take root. Their energy is slowly sapped.',
    aoe: 'Single Opponent', zMoveFx: 'ResetStat',
    onBeforeMove: ({target, move}) => {
      if (target.type1 === 'Grass' || target.type2 === 'Grass') {
        move.accuracy = 0
        move.failed = true
        return new Log().add('It failed...')
      }
      return new Log()
    },
    onAfterMove: ({caster, target}) => {
      const leechStatus = {...ConditionMap.Seeded}
      leechStatus.p = {caster}
      return APPLY_TEMP_STATUS(target, leechStatus,
        `${target.species} was seeded by ${caster.species}`)
    }
  },
  Leer: {
    name: 'Leer',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Normal',
    flavor: 'The user gives the targets an intimidating stare. Their defense drops.',
    aoe: 'Nearby Opponents', zMoveFx: 'AtkBuff1',
    onBeforeMove: noop,
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'defense', -1),
  },
  Lick: {
    name: 'Lick',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.5,
    type: 'Ghost',
    flavor: 'The user creepily touches the target with its tongue. This may paralyze the target.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => Paralyze(inp, 0.3),
  },
  'Life Dew': {
    name: 'Life Dew', type: 'Water',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0,
    aoe: 'All Allies', recovery: true,
    flavor: 'The user sprays its friends with a light mist, healing their hit points.',
    onAfterMove: ({target}) => {
      return logHeal(target, target.totalHp / 4)
    }
  },
  'Light Screen': {
    name: 'Light Screen',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Psychic',
    flavor: 'The user creates a barrier that protects its side from special attacks.',
    aoe: 'Self', zMoveFx: 'SpDefBuff1',
    onBeforeMove: noop,
    onAfterMove: ({caster, field, prefix}) => {
      const turns = caster.heldItemKey === 'lightclay' ? 8 : 5
      field.sides[prefix].lightscreen = turns
      const log = new Log()
      log.add('A screen of light surrounded the Pokémon and its allies')
      return log
    }
  },
  'Light of Ruin': {
    name: 'Light of Ruin', type: 'Fairy',
    criticalHit: 1, accuracy: 0.9, power: 1.6,
    attackKey: 'spAttack', defenseKey: 'spDefense',
    flavor: 'The power of the Eternal Flower is used to deal massive damage. The user takes damage too.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => RECOIL(inp, 2),
  },
  Liquidation: {
    name: 'Liquidation',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.05,
    type: 'Water',
    flavor: 'A watery tackle strikes the target, which might lower its defense.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => DefNerf(inp.target, inp, 0.2),
  },
  'Lock-On': {
    name: 'Lock-On', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0,
    aoe: 'Self', zMoveFx: 'SpdBuff1',
    flavor: 'The user takes aim carefully. Its next move will always hit.',
    onBeforeMove: noop,
    onAfterMove: (inp) => {
      return APPLY_TEMP_STATUS(inp.caster, {...ConditionMap.GuaranteedHit},
        `${inp.caster.species} has acquired a lock.`)
    }
  },
  'Lovely Kiss': {
    name: 'Lovely Kiss', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense', aoe: 'Single Opponent',
    power: 0, accuracy: 0.75, criticalHit: 1, zMoveFx: 'SpdBuff1',
    flavor: 'The user kisses the target and causes them to fall asleep.',
    onAfterMove: (inp) => Sleep(inp, 1),
  },
  'Low Kick': {
    name: 'Low Kick', type: 'Fighting',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1, accuracy: 1, criticalHit: 1,
    flavor: 'The user strikes low at the target. The heavier they are, the harder they will fall.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({target, move}) => {
      if (target.weight <= 0) {
        move.failed = true
        return new Log().add('The target cannot be kicked.')
      }
      if (target.weight < 10) {
        move.power = 0.4
      } else if (target.weight < 25) {
        move.power = 0.6
      } else if (target.weight < 50) {
        move.power = 0.8
      } else if (target.weight < 100) {
        move.power = 1
      } else if (target.weight < 200) {
        move.power = 1.2
      } else {
        move.power = 1.4
      }
      return new Log()
    }
  },
  'Low Sweep': {
    name: 'Low Sweep', type: 'Fighting',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.85, accuracy: 1, criticalHit: 1,
    flavor: 'The user strikes at the target\'s feet, lowering their speed.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'speed', -1),
  },
  'Lucky Chant': {
    name: 'Lucky Chant', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0,
    flavor: 'The user enchants themselves to prevent critical hits from landing.',
    aoe: 'Self', zMoveFx: 'EvaBuff1',
    onAfterMove: (inp) => APPLY_TEMP_STATUS(inp.caster, ConditionMap.Lucky,
      `${inp.caster.species} spoke an incantation.`)
  },
  'Lumina Crash': {
    name: 'Lumina Crash', type: 'Psychic',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1, accuracy: 1, criticalHit: 1,
    flavor: "The user releases a burst of light from its mind. The target's special defense drops harshly.",
    aoe: 'Single Opponent',
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'spDefense', -2)
  },
  'Lunar Blessing': {
    name: 'Lunar Blessing', type: 'Psychic',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0,
    aoe: 'All Allies', recovery: true,
    flavor: 'The user employs moon power to cure status conditions and heal allies.',
    onAfterMove: (inp) => {
      const log = new Log()
      removeCondition(inp.caster, 'PoisonBad')
      if (inp.caster.status?.name === 'Burn') {
        log.add(`${inp.caster.species} is no longer burned`)
      }
      if (inp.caster.status?.name === 'Paralyzed') {
        log.add(`${inp.caster.species} is no longer paralyzed`)
      }
      if (inp.caster.status?.name === 'Poison') {
        log.add(`${inp.caster.species} is no longer poisoned`)
      }
      inp.caster.status = undefined
      log.push(logHeal(inp.target, inp.target.totalHp / 4))
      return log
    }
  },
  'Lunge': {
    name: 'Lunge',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    contact: true,
    criticalHit: 1,
    power: 1,
    type: 'Bug',
    flavor: "The user lunges with a stinger of some kind. The target's attack subsequently drops",
    aoe: 'Single Opponent',
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'attack', -1)
  },
  'Luster Purge': {
    name: 'Luster Purge',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.9,
    type: 'Psychic',
    flavor: 'The user emits a bright light. It has a chance to lower the target\'s special defense.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => SpdNerf(inp.target, inp, 0.5),
  },
  'Mach Punch': {
    name: 'Mach Punch',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.6,
    type: 'Fighting',
    priority: 1,
    flavor: 'The fist moves at the speed of sound to hit the target.',
    aoe: 'Single Opponent',
    contact: true,
    onBeforeMove: nop,
    onAfterMove: nop,
  },
  'Magical Leaf': {
    name: 'Magical Leaf',
    accuracy: Infinity,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.8,
    type: 'Grass',
    flavor: 'Leafs strike at the target. This move never misses.',
    aoe: 'Single Opponent',
    onBeforeMove: nop,
    onAfterMove: nop
  },
  'Magical Torque': {
    name: 'Magical Torque', type: 'Fairy',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 1, criticalHit: 1, power: 1.2,
    flavor: 'The user rushes forward into the target, which may leave them confused.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Confuse(inp, 0.3),
  },
  'Magic Powder': {
    name: `Magic Powder`, type: 'Psychic',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: 1,
    flavor: 'The target is hit by a fantasic burst of powder and becomes Psychic-type.',
    aoe: 'Single Opponent',
    onAfterMove: ({target}) => {
      target.type1 = 'Psychic'
      target.type2 = undefined
      return new Log().add(`${target.species} became a Psychic-type.`)
    },
  },
  'Magic Room': {
    name: 'Magic Room', type: 'Psychic',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, criticalHit: 0, power: 0,
    flavor: 'Everyone enters a mysterious room in which items are useless.',
    aoe: 'Everyone', zMoveFx: 'SpDefBuff1',
    onBeforeMove: noop,
    onAfterMove: ({field}) => {
      const log = new Log()
      if (field.magicRoom) {
        field.magicRoom = 0
      } else {
        field.magicRoom = 5
      }
      log.add('Items are now useless!')
      return log
    }
  },
  'Magma Storm': {
    name: 'Magma Storm', type: 'Fire',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.2, accuracy: 0.75, criticalHit: 1,
    flavor: 'Hot lava traps the target.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => APPLY_TEMP_STATUS(inp.target, ConditionMap['Fire Trap'])
  },
  'Magnet Bomb': {
    name: 'Magnet Bomb', type: 'Steel',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.8, accuracy: Infinity, criticalHit: 1,
    flavor: 'The target is hit by an electromagnetic burst. This move never misses.',
    aoe: 'Single Opponent',
  },
  'Magnet Rise': {
    name: 'Magnet Rise', type: 'Electric',
    attackKey: 'attack', defenseKey: 'defense', aoe: 'Self',
    power: 0, accuracy: Infinity, criticalHit: 0, zMoveFx: 'EvaBuff1',
    flavor: 'The user begins to float using electromagnetism.',
    onBeforeMove: (inp) => failsIfGravity(inp),
    onAfterMove: (inp) => {
      return APPLY_TEMP_STATUS(inp.caster, ConditionMap.Levitating,
        `${inp.caster.species} began levitating.`)
    }
  },
  Magnitude: {
    name: 'Magnitude',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Ground',
    flavor: 'The user strikes the ground with seismic power. The damage depends on the magnitude.',
    aoe: 'Everyone',
    onBeforeMove: ({move}) => {
      const magnitudes = [
        4, // 5%
        5, 5, // 10%
        6, 6, 6, 6, // 20%
        7, 7, 7, 7, 7, 7, // 30%
        8, 8, 8, 8, // 20%
        9, 9, // 10%
        10 // 5%
      ]
      const power = {
        4: .3,
        5: .5,
        6: .7,
        7: .9,
        8: 1.1,
        9: 1.3,
        10: 1.7,
      }
      const mag = randomItem(magnitudes)
      move.power = power[mag]
      return new Log().add(`Magnitude ${mag}!`)
    },
  },
  'Make It Rain': {
    name: 'Make It Rain', type: 'Steel',
    attackKey: 'spAttack', defenseKey: 'spDefense', aoe: 'Single Opponent',
    accuracy: 1, power: 1.4, criticalHit: 1,
    flavor: 'Golden coins are hurled at opponents. As coins cover the field, the user loses special attack.',
    onAfterMove: (inp) => {
      inp.field.sides[inp.prefix].goldCoins = true
      const log = new Log()
      log.push(BUFF_STAT(inp.caster, inp, 'spAttack', -1))
      log.add('Coins were scattered on the field')
      return log
    }
  },
  'Mat Block': {
    name: 'Mat Block', type: 'Fighting',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: Infinity, aoe: 'Self',
    priority: 4, zMoveFx: 'DefBuff1',
    flavor: 'The user throws up a mat. Damaging moves will not do anything.',
    onBeforeMove: noop,
    onAfterMove: ({caster}) => {
      return APPLY_TEMP_STATUS(caster, ConditionMap.MatUp,
        `${caster.species} threw up a protective layer.`)
    }
  },
  'Matcha Gotcha': {
    name: 'Matcha Gotcha',
    accuracy: 0.9,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1,
    type: 'Grass',
    flavor: 'Piping hot tea is fired out in all directions, potentially leaving a burn. The user recovers HP based on those injured.',
    aoe: 'All Opponents',
    onAfterMove: (inp) => {
      const {caster, damage} = inp
      const log = new Log()
      log.add(`${caster.species} restored energy from the spilled tea`)
      log.push(logHeal(caster, (damage ?? 0) / 2))
      log.push(Burn(inp, 0.2))
      return log
    },
  },
  'Mean Look': {
    name: 'Mean Look', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: Infinity, aoe: 'Single Opponent',
    flavor: 'The target gets the feeling it is being watched. It can run but it cannot hide.',
    onBeforeMove: noop,
    onAfterMove: ({target}) => {
      return APPLY_TEMP_STATUS(target, ConditionMap.TrappedInBattle,
        `${target.species} is trapped in the battle.`)
    }
  },
  'Meditate': {
    name: 'Meditate',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Psychic',
    flavor: 'The user focuses with a yoga pose and raises their attack.',
    aoe: 'Self', zMoveFx: 'AtkBuff1',
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'attack', 1)
  },
  Megahorn: {
    name: 'Megahorn',
    accuracy: 0.85,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.4,
    type: 'Bug',
    flavor: 'The user rams the target using its horn.',
    aoe: 'Single Opponent', contact: true,
  },
  'Mega Drain': {
    name: 'Mega Drain',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.6,
    type: 'Grass',
    flavor: 'The user drains the target of its energy.',
    aoe: 'Single Opponent',
    onAfterMove: ({caster, target, damage}) => {
      const log = logDrain(caster, damage!, 2)
      log.add(`${target.species} had its energy drained`)
      return log
    }
  },
  'Mega Kick': {
    name: 'Mega Kick', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.4, criticalHit: 1, accuracy: 0.75,
    flavor: 'The target is hit by a kick with lots of energy.',
    aoe: 'Single Opponent', contact: true,
  },
  'Mega Punch': {
    name: 'Mega Punch', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1, criticalHit: 1, accuracy: 0.85,
    flavor: 'The target is hit by a punch with lots of energy.',
    aoe: 'Single Opponent', contact: true,
  },
  'Memento': {
    name: 'Memento', type: 'Dark',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: 1,
    flavor: 'The user faints but places a curse on the target that makes them weaker in battle.',
    aoe: 'Single Opponent',
    onBeforeMove: noop,
    onAfterMove: (inp) => {
      const log = new Log()
      log.push(BUFF_STAT(inp.target, inp, 'attack', -2))
      log.push(BUFF_STAT(inp.target, inp, 'spAttack', -2))
      log.push(logDamage(inp.caster, inp.caster.totalHp, true))
      return log
    }
  },
  'Metal Burst': {
    name: 'Metal Burst',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Steel',
    flavor: 'The user retaliates based on the last damage done to it.',
    aoe: 'Single Opponent',
    onAfterMove: (input) => {
      const {caster, move, target} = input
      const lastMoveCondition = getCondition(caster, 'LastDamage')
      if (!lastMoveCondition) {
        move.failed = true
        return new Log().add('Nothing happened')
      }
      const delta = lastMoveCondition.p!.dmg!
      if (delta < 0) {
        // Healed
        move.failed = true
        return new Log().add('Nothing happened')
      }
      return applyStaticDamage(target, delta * 1.5, input)
    },
    onBeforeMove: ({move}) => {
      move.power = 0
      return nop()
    },
  },
  'Metal Claw': {
    name: 'Metal Claw',
    accuracy: 0.95,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Steel',
    flavor: 'The user slashes its claws at the target. Their attack might rise.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => AtkBuff(inp.caster, inp, 0.25),
  },
  'Metal Sound': {
    name: 'Metal Sound', type: 'Steel', sound: true,
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 0.85, criticalHit: 0, power: 0,
    flavor: 'The user makes a loud screech. The target\'s special defense drops.',
    aoe: 'Single Opponent', zMoveFx: 'SpAtkBuff1',
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'spDefense', -2),
  },
  'Meteor Assault': {
    name: 'Meteor Assault',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.7,
    type: 'Fighting',
    flavor: 'The user charges with its leek. The user cannot move for the next turn.',
    aoe: 'Single Opponent',
    onAfterMove: RECHARGE
  },
  'Meteor Beam': {
    name: 'Meteor Beam', type: 'Rock',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.4, accuracy: 0.9, criticalHit: 1,
    flavor: 'The user draws in spacial power at first, then strikes with rocky power.',
    aoe: 'Single Opponent',
    onBeforeMove: (inp) => {
      const log = BUFF_STAT(inp.caster, inp, 'spAttack')
      log.push!(multiTurnOnBeforeMove(inp, 'MeteorGathering', 'starting drawing spacial energy', 'fired spacial energy!'))
      return log
    },
    onAfterMove: (inp) => multiTurnOnAfterMove(inp, 'MeteorGathering'),
  },
  'Meteor Mash': {
    name: 'Meteor Mash',
    accuracy: 0.9,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.1,
    type: 'Steel',
    flavor: 'The user throws a fist like a meteor. It might raise their attack.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => AtkBuff(inp.caster, inp, 0.25),
  },
  'Metronome': {
    name: 'Metronome',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Normal',
    flavor: 'The user wags their fingers. Then something unexpected happens.',
    aoe: 'Self', // This will change.
    onBeforeMove: (input) => {
      const {caster, move} = input
      const log = new Log()
      // Cut out Z-Moves, OHKO moves
      const newMove = randomItem(Object.values(Movepool).filter(x => x.power <= 100)) as Move
      Object.assign(move, newMove)
      log.add(`${caster.species} wagged its fingers`)
      if (newMove.onGetType) {
        // Hidden Power needs this additional step
        newMove.onGetType(input.caster, input.field, newMove)
      }
      log.push(newMove.onBeforeMove?.(input))
      return log
    },
    onAfterMove: nop,
  },
  'Milk Drink': {
    name: 'Milk Drink', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, criticalHit: 0, power: 0,
    aoe: 'Self', recovery: true, zMoveFx: 'ResetStat',
    flavor: 'The user produces a sweet dairy drink, healing itself.',
    onAfterMove: ({caster}) => logHeal(caster, caster.totalHp/2)
  },
  Mimic: {
    name: 'Mimic', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, criticalHit: 0, power: 0,
    flavor: 'The user copies what the target is doing.',
    aoe: 'Single Opponent', zMoveFx: 'AccBuff1',
    onAfterMove: ({caster, target}) => {
      // Caster replaces moveset with target
      caster.movepool = target.movepool
      return new Log()
        .add(`${caster.species} started mimicking ${target.species}`)
    }
  },
  'Mind Blown': {
    name: 'Mind Blown', type: 'Fire', aoe: 'Single Opponent',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.7, accuracy: 1, criticalHit: 1,
    flavor: "The user throws its head and it literally explodes. Geez that's gotta hurt.",
    onAfterMove: (inp) => {
      return logDamage(inp.caster, inp.caster.totalHp / 2, true)
    }
  },
  'Mind Reader': {
    name: 'Mind Reader', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0,
    aoe: 'Self', zMoveFx: 'SpAtkBuff1',
    flavor: 'The user reads the opponent so that its next attack will always hit.',
    onBeforeMove: noop,
    onAfterMove: (inp) => {
      return APPLY_TEMP_STATUS(inp.caster, {...ConditionMap.GuaranteedHit},
        `${inp.caster.species} has tracked the opponent's movement.`)
    }
  },
  Minimize: {
    name: 'Minimize', type: 'Normal', aoe: 'Self',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: Infinity, zMoveFx: 'ResetStat',
    flavor: 'The user shrinks itself, making it more nimble and evasive.',
    onAfterMove: (inp) => {
      BUFF_STAT(inp.caster, inp, 'evasiveness', 2)
      APPLY_TEMP_STATUS(inp.caster, ConditionMap.Minimized)
      return new Log()
    }
  },
  'Miracle Eye': {
    name: 'Miracle Eye', type: 'Psychic',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: 1, criticalHit: 0,
    flavor: 'The power of a magic eye allows Dark-types to be hit by Psychic-type moves.',
    aoe: 'Single Opponent', zMoveFx: 'SpAtkBuff1',
    onBeforeMove: noop,
    onAfterMove: (inp) => {
      return APPLY_TEMP_STATUS(inp.target, ConditionMap.EyedUp,
        `${inp.target.species} is seen!`)
    }
  },
  'Mirror Coat': {
    name: 'Mirror Coat',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1,
    type: 'Psychic',
    priority: -5,
    flavor: 'The user retaliates against the target\'s special attack.',
    aoe: 'Single Opponent',
    onAfterMove: (input) => {
      const {caster, target, move} = input
      const lastMoveCondition = getCondition(caster, 'LastDamage')
      if (!lastMoveCondition) {
        move.failed = true
        return new Log().add('Nothing happened')
      }
      const lastMove = lastMoveCondition.p!.selectedMove!
      if (lastMove.attackKey === 'attack') {
        move.failed = true
        return new Log().add('Nothing happened')
      }
      const delta = lastMoveCondition.p!.dmg!
      if (delta < 0) {
        // Healed
        move.failed = true
        return new Log().add('Nothing happened')
      }
      return applyStaticDamage(target, delta * 2, input)
    },
    onBeforeMove: ({move}) => {
      move.power = 0
      return nop()
    },
  },
  'Mirror Move': {
    name: 'Mirror Move', type: 'Flying',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1, accuracy: 1, criticalHit: 0,
    aoe: 'Single Opponent',
    flavor: 'The user counters the target by using the same exact move.',
    onBeforeMove: (input) => {
      const log = new Log()
      const {move} = input
      const updatedMoveCondition = getCondition(input.target, 'LastMove')
      if (!updatedMoveCondition) {
        input.move.failed = true
        return new Log().add('There were moves to mirror')
      }
      const updatedMove = updatedMoveCondition.p!.selectedMove!
      move.name = updatedMove.name
      log.add(`Mirror Move became ${move.name}!`)
      if (move.accuracy !== Infinity) {
        // Keep perfect accuracy for tests/Lock-On
        move.accuracy = updatedMove.accuracy
      }
      move.attackKey = updatedMove.attackKey
      move.defenseKey = updatedMove.defenseKey
      move.criticalHit = updatedMove.criticalHit
      move.power = updatedMove.power
      move.type = updatedMove.type
      move.aoe = updatedMove.aoe
      move.onAfterMove = updatedMove.onAfterMove
      log.push(updatedMove.onBeforeMove?.(input))
      return log
    },
    onAfterMove: nop,
  },
  'Mirror Shot': {
    name: 'Mirror Shot', type: 'Steel',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 0.85, accuracy: 0.85, criticalHit: 1,
    flavor: 'The user emits a reflective burst of energy. It might drop the target\'s speed.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => SpeNerf(inp.target, inp, 0.3),
  },
  Mist: {
    name: 'Mist',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Ice',
    flavor: 'The user covers the entire field in a mist. Stat drops become impossible.',
    aoe: 'Self', zMoveFx: 'Heal',
    onAfterMove: ({field, prefix}) => {
      const log = new Log()
      field.sides[prefix].mist = 5
      log.add('The field was covered in an icy mist')
      return log
    }
  },
  'Mist Ball': {
    name: 'Mist Ball',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.9,
    type: 'Psychic',
    flavor: 'The user shoots a flurry of down. This may drop the target\'s special attack.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => SpaNerf(inp.target, inp, 0.25),
  },
  'Misty Explosion': {
    name: 'Misty Explosion',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.2,
    type: 'Fairy',
    flavor: 'The user blows up. It does devastating damage when on Misty Terrain.',
    aoe: 'Nearby Opponents',
    onBeforeMove: ({move, field}) => {
      if (field.terrain?.name === 'Misty') {
        move.power *= 1.5
      }
      return new Log()
    },
    onAfterMove: ({caster}) => {
      caster.currentHp = 0
      caster.fainted = true
      return new Log().add(`${caster.species} exploded!!`)
    }
  },
  'Misty Terrain': {
    name: 'Misty Terrain', type: 'Fairy',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'Self', zMoveFx: 'SpDefBuff1',
    flavor: 'Incenses the field to make it misty. This applies some benefits.',
    onAfterMove: (inp) => setTerrain(inp, 'Misty')
  },
  'Moonblast': {
    // Same as Bug Buzz
    name: 'Moonblast',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1,
    type: 'Fairy',
    flavor: 'The user harnesses lunar power in this attack. The target\'s special defense might drop.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => SpdNerf(inp.target, inp, 0.25),
  },
  'Moongeist Beam': {
    name: 'Moongeist Beam',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.2,
    type: 'Ghost',
    flavor: 'The user attacks with a ray formed by lunar energy.',
    aoe: 'Single Opponent',
  },
  Moonlight: {
    name: 'Moonlight', type: 'Fairy', aoe: 'Self', recovery: true,
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: Infinity, zMoveFx: 'ResetStat',
    flavor: `The user repairs damage with moonlight. The amount healed depends on the sun's strength.`,
    onAfterMove: (inp) => {
      return weatherDependentHeal(inp)
    }
  },
  'Morning Sun': {
    name: 'Morning Sun', type: 'Normal', aoe: 'Self', recovery: true,
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: Infinity, zMoveFx: 'ResetStat',
    flavor: `The user repairs damage with sunlight. The amount healed depends on the sun's strength.`,
    onAfterMove: (inp) => {
      return weatherDependentHeal(inp)
    }
  },
  'Mortal Spin': {
    name: 'Mortal Spin',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0.5,
    type: 'Normal',
    flavor: 'Items on the field are removed. Anyone struck is now poisoned by venomous crystals.',
    aoe: 'Nearby Opponents', zMoveFx: 'AccBuff1',
    onAfterMove: (inp) => {
      const {field, prefix} = inp
      const log = new Log()
      log.add('The field was cleared.')

      field.sides[prefix].spikes = 0
      field.sides[prefix].toxicSpikes = 0
      field.sides[prefix].stealthRock = false
      field.sides[prefix].sharpSteel = false
      field.sides[prefix].stickyWeb = false
      log.push(Poison(inp, 1))
      return log
    }
  },
  'Mountain Gale': {
    name: 'Mountain Gale', type: 'Ice',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.2, accuracy: 0.85, criticalHit: 1,
    aoe: 'Single Opponent',
    flavor: 'The user draws upon the mountain permafrost to strike the opponent with ice. The target might flinch.',
    onAfterMove: (inp) => Flinch(inp, 0.3),
  },
  'Mud-Slap': {
    name: 'Mud-Slap',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.4,
    type: 'Ground',
    flavor: 'The user throws mud at the target. Their accuracy drops.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'accuracy', -1)
  },
  'Mud Bomb': {
    name: 'Mud Bomb',
    accuracy: 0.85,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.1,
    type: 'Ground',
    flavor: 'The user spits up a sphere of mud and whacks the target. Their accuracy may drop.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => {
      const p = Math.random()
      if (p < 0.3) {
        return BUFF_STAT(inp.target, inp, 'accuracy', -1)
      }
      return new Log()
    },
  },
  'Mud Shot': {
    name: 'Mud Shot',
    accuracy: 0.95,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.75,
    type: 'Ground',
    flavor: 'The user fires a clomp of dirt at the opponent. Their speed will drop',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => SpeNerf(inp.target, inp, 1),
  },
  'Mud Sport': {
    name: 'Mud Sport',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0,
    type: 'Ground',
    flavor: 'The user covers the field in a layer of mud. Electric-type moves weaken.',
    aoe: 'Everyone', zMoveFx: 'SpDefBuff1',
    onBeforeMove: noop,
    onAfterMove: ({field}) => {
      const log = new Log()
      field.mudSport = 5
      log.add('A layer of mud covered the field.')
      return log
    }
  },
  'Muddy Water': {
    name: 'Muddy Water', type: 'Water',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    accuracy: 0.85, criticalHit: 1, power: 1.1,
    flavor: 'A wave of dirty water crashes into the targets.',
    aoe: 'Nearby Opponents',
    onAfterMove: (inp) => {
      const log = new Log()
      if (Math.random() < 0.3) {
        log.push(BUFF_STAT(inp.target, inp, 'speed', -1))
      }
      return log
    },
  },
  'Multi-Attack': {
    name: 'Multi-Attack', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.1, accuracy: 1, criticalHit: 1,
    flavor: 'A high-energy blitz whose type is variable.',
    aoe: 'Single Opponent', contact: true,
    onGetType: (caster) => {
      if (caster.heldItemKey) {
        const memoryMapping: Partial<Record<ItemId, Type>> = {
          bugmemory: 'Bug',
          darkmemory: 'Dark',
          dragonmemory: 'Dragon',
          fairymemory: 'Fairy',
          firememory: 'Fire',
          flyingmemory: 'Flying',
          electricmemory: 'Electric',
          grassmemory: 'Grass',
          fightingmemory: 'Fighting',
          ghostmemory: 'Ghost',
          groundmemory: 'Ground',
          rockmemory: 'Rock',
          icememory: 'Ice',
          poisonmemory: 'Poison',
          watermemory: 'Water',
          steelmemory: 'Steel',
          psychicmemory: 'Psychic',
        }
        return memoryMapping[caster.heldItemKey] || 'Normal'
      }
      return 'Normal'
    }
  },
  'Mystical Fire': {
    name: 'Mystical Fire', type: 'Fire',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    accuracy: 1, power: 0.95, criticalHit: 1,
    aoe: 'Single Opponent',
    flavor: `A strange fire is cast which drops the target's special attack.`,
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'spAttack', -1)
  },
  'Mystical Power': {
    name: 'Mystical Power', type: 'Psychic',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 0.9, accuracy: 0.9, criticalHit: 1, aoe: 'Single Opponent',
    flavor: 'A burst of mysterious power that only gets stronger with repeated use.',
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'spAttack', 1)
  },
  'Nasty Plot': {
    name: 'Nasty Plot',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Dark',
    flavor: 'The user plots frantically, raising their special attack.',
    aoe: 'Self', zMoveFx: 'ResetStat',
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'spAttack', 2),
  },
  'Natural Gift': {
    name: 'Natural Gift',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Normal',
    flavor: 'The user consumes its held berry. The type and power of this move depends on what is eaten.',
    aoe: 'Single Opponent',
    onGetType: (caster, _, move) => {
      if (!caster.heldItemKey || caster.heldItemConsumed) return 'Status'
      // TODO: Make this part of the item spec?
      const berryToType: {[b in BerryId]: Type} = {
        cheri: 'Fire',
        chesto: 'Water',
        pecha: 'Electric',
        rawst: 'Grass',
        aspear: 'Ice',
        leppa: 'Fighting',
        oran: 'Poison',
        persim: 'Ground',
        lum: 'Flying',
        sitrus: 'Psychic',
        figy: 'Bug',
        wiki: 'Rock',
        mago: 'Ghost',
        aguav: 'Dragon',
        iapapa: 'Dark',
        razz: 'Steel',
        bluk: 'Fire',
        nanab: 'Water',
        wepear: 'Electric',
        pinap: 'Grass',
        pomeg: 'Ice',
        kelpsy: 'Fighting',
        qualot: 'Poison',
        hondew: 'Ground',
        grepa: 'Flying',
        tamato: 'Psychic',
        cornn: 'Bug',
        magost: 'Rock',
        rabuta: 'Ghost',
        nomel: 'Dragon',
        spelon: 'Dark',
        pamtre: 'Steel',
        watmel: 'Fire',
        durin: 'Water',
        belue: 'Electric',
        occa: 'Fire',
        passho: 'Water',
        wacan: 'Electric',
        rindo: 'Grass',
        yache: 'Ice',
        chople: 'Fighting',
        kebia: 'Poison',
        shuca: 'Ground',
        coba: 'Flying',
        payapa: 'Psychic',
        tanga: 'Bug',
        charti: 'Rock',
        kasib: 'Ghost',
        haban: 'Dragon',
        colbur: 'Dark',
        babiri: 'Steel',
        chilan: 'Normal',
        liechi: 'Grass',
        ganlon: 'Ice',
        salac: 'Fighting',
        petaya: 'Poison',
        apicot: 'Ground',
        lansat: 'Flying',
        starf: 'Psychic',
        enigma: 'Bug',
        micle: 'Rock',
        cutsap: 'Ghost',
        jaboca: 'Dragon',
        rowap: 'Dark',
        roseli: 'Fairy',
        kee: 'Fairy',
        maranga: 'Dark',
        hopo: 'Psychic', // Non-canon
      }
      if (berryToType[caster.heldItemKey]) {
        const updatedType = berryToType[caster.heldItemKey]
        move.type = updatedType
        return move.type
      }
      return 'Status'
    },
    onBeforeMove: ({caster, move}) => {
      if (!caster.heldItemKey || caster.heldItemConsumed) {
        move.failed = true
        return new Log().add(`There is no berry to eat`)
      }
      const berryToPower: {[b in BerryId]: number} = {
        cheri: 80,
        chesto: 80,
        pecha: 80,
        rawst: 80,
        aspear: 80,
        leppa: 80,
        oran: 80,
        persim: 80,
        lum: 80,
        sitrus: 80,
        figy: 80,
        wiki: 80,
        mago: 80,
        aguav: 80,
        iapapa: 80,
        razz: 80,
        bluk: 90,
        nanab: 90,
        wepear: 90,
        pinap: 90,
        pomeg: 90,
        kelpsy: 90,
        qualot: 90,
        hondew: 90,
        grepa: 90,
        tamato: 90,
        cornn: 90,
        magost: 90,
        rabuta: 90,
        nomel: 90,
        spelon: 90,
        pamtre: 90,
        watmel: 100,
        durin: 100,
        belue: 100,
        occa: 80,
        passho: 80,
        wacan: 80,
        rindo: 80,
        yache: 80,
        chople: 80,
        kebia: 80,
        shuca: 80,
        coba: 80,
        payapa: 80,
        tanga: 80,
        charti: 80,
        kasib: 80,
        haban: 80,
        colbur: 80,
        babiri: 80,
        chilan: 80,
        liechi: 100,
        ganlon: 100,
        salac: 100,
        petaya: 100,
        apicot: 100,
        lansat: 100,
        starf: 100,
        enigma: 100,
        micle: 100,
        cutsap: 100,
        jaboca: 100,
        rowap: 100,
        roseli: 80,
        kee: 100,
        maranga: 100,
        hopo: 80, // non-canon
      }
      if (berryToPower[caster.heldItemKey]) {
        // Normalize from map
        move.power = berryToPower[caster.heldItemKey] / 100 - 20
        caster.heldItemConsumed = true
        caster.heldItemTotallyConsumed = true
        return new Log().add(`${caster.species} swallowed its ${caster.heldItemKey} berry.`)
      }
      move.failed = true
      return new Log()
    },
    onAfterMove: nop,
  },
  'Nature Power': {
    name: 'Nature Power',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Normal',
    flavor: 'The user attacks with the power of nature. This attack changes based on the terrain.',
    aoe: 'Single Opponent',
    onGetType: (_, field, move) => {
      const terrainToMove: {[terrain in TerrainType]: MoveId} = {
        Bay: 'Hydro Pump',
        Beach: 'Hydro Pump',
        Mountain: 'Power Gem',
        Tropical: 'Energy Ball',
        Rural: 'Energy Ball',
        Desert: 'Mud Bomb',
        Grasslands: 'Energy Ball',
        Gardens: 'Energy Ball',
        Forest: 'Energy Ball',
        Urban: 'Tri Attack',
        Rainforest: 'Energy Ball',
        Oceanic: 'Hydro Pump',
      }
      const updatedMove = {...Movepool[terrainToMove[field.locationTerrain]]}
      move.type = updatedMove.type
      return move.type
    },
    onBeforeMove: (input) => {
      const log = new Log()
      const {field, move} = input
      const terrainToMove: {[terrain in TerrainType]: MoveId} = {
        Bay: 'Hydro Pump',
        Beach: 'Hydro Pump',
        Mountain: 'Power Gem',
        Tropical: 'Energy Ball',
        Rural: 'Energy Ball',
        Desert: 'Mud Bomb',
        Grasslands: 'Energy Ball',
        Gardens: 'Energy Ball',
        Forest: 'Energy Ball',
        Urban: 'Tri Attack',
        Rainforest: 'Energy Ball',
        Oceanic: 'Hydro Pump',
      }
      const updatedMove = {...Movepool[terrainToMove[field.locationTerrain]]}
      move.name = updatedMove.name
      log.add(`Nature Power became ${move.name}!`)
      if (move.accuracy !== Infinity) {
        // Keep perfect accuracy for tests/Lock-On
        move.accuracy = updatedMove.accuracy
      }
      move.attackKey = updatedMove.attackKey
      move.defenseKey = updatedMove.defenseKey
      move.criticalHit = updatedMove.criticalHit
      move.power = updatedMove.power
      move.type = updatedMove.type
      move.onAfterMove = updatedMove.onAfterMove
      log.push(updatedMove.onBeforeMove?.(input))
      return log
    },
    onAfterMove: nop,
  },
  "Nature's Madness": {
    name: "Nature's Madness", type: 'Fairy',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 0.01, accuracy: 1, criticalHit: 0,
    aoe: 'Single Opponent',
    flavor: 'The power of nature is called upon in order to deal a halving blow to the target.',
    onBeforeMove: ({target, move}) => {
      move.power = 0 // Zero out
      if (getCondition(target, 'Raid')) {
        move.failed = true
        return new Log().add('The move failed...')
      }
      return new Log()
    },
    onAfterMove: ({target}) => {
      return logDamage(target, target.currentHp / 2)
    }
  },
  'Needle Arm': {
    name: 'Needle Arm',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.1,
    type: 'Grass',
    flavor: 'The user attacks with sharp protrusions. The target might flinch.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => Flinch(inp, 0.25),
  },
  'Night Daze': {
    name: 'Night Daze', type: 'Dark',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.05, accuracy: 0.95, criticalHit: 1,
    flavor: 'The user attacks with the fury of darkness. The target\'s speed might drop.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => {
      if (Math.random() < 0.4) {
        // Lower speed rather than accuracy
        return BUFF_STAT(inp.target, inp, 'speed', -1)
      }
      return new Log()
    }
  },
  'Nightmare': {
    name: 'Nightmare', type: 'Ghost',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: 1, criticalHit: 0,
    aoe: 'Single Opponent',
    flavor: "Places a bad dream in the sleeping target's head. It will damage them for several turns.",
    onBeforeMove: (inp) => {
      if (inp.target.status?.name !== 'Asleep') {
        inp.move.failed = true
        return new Log().add('It failed...')
      }
      return new Log()
    },
    onAfterMove: (inp) => {
      return APPLY_TEMP_STATUS(inp.target, {...ConditionMap['Nightmaring']},
        `${inp.target.species} started having a nightmare`)
    }
  },
  'Night Shade': {
    name: 'Night Shade',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1,
    type: 'Ghost',
    flavor: 'The user covers the target with nighttime. This move always does the same amount of damage.',
    aoe: 'Single Opponent',
    onBeforeMove: ({move}) => {
      move.power = 0
      return nop()
    },
    onAfterMove: (input) => {
      const {target} = input
      return applyStaticDamage(target, 40, input)
    }
  },
  'Night Slash': {
    name: 'Night Slash',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 2,
    power: 0.9,
    type: 'Dark',
    flavor: 'The user attacks with a dark spirit. Critical hits are likely.',
    aoe: 'Single Opponent', contact: true,
  },
  'No Retreat': {
    name: 'No Retreat', type: 'Fighting',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: Infinity,
    aoe: 'Self',
    flavor: 'The user burns its bridges and boosts its stats. It is going to remain in the battle.',
    onAfterMove: (inp) => {
      // We can't actually enforce that.
      return new Log().push(BUFF_ALL(inp, 1, 1))
    }
  },
  'Noble Roar': {
    name: 'Noble Roar', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: 1,
    aoe: 'Nearby Opponents', sound: true, zMoveFx: 'DefBuff1',
    flavor: 'A loud, reverberating roar echoes. The target drops their attacking stats.',
    onBeforeMove: noop,
    onAfterMove: (inp) => {
      const log = new Log()
      log.push(BUFF_STAT(inp.target, inp, 'attack', -1))
      log.push(BUFF_STAT(inp.target, inp, 'spAttack', -1))
      return log
    }
  },
  Noop: {
    name: 'Noop',
    accuracy: 0,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 1,
    type: 'Normal',
    flavor: 'Nothing should happen. This is a placeholder for testing.',
    aoe: 'Single Opponent',
    hide: true,
  },
  NoopAoeSelf: {
    name: 'NoopAoeSelf',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 1,
    type: 'Normal',
    flavor: 'Test AOE (Self)',
    aoe: 'Self',
    hide: true,
  },
  'Noxious Torque': {
    name: 'Noxious Torque', type: 'Dark',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 1, criticalHit: 1, power: 1.2,
    flavor: 'The user rushes forward into the target, which may leave them poisoned.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Poison(inp, 0.3),
  },
  Nuzzle: {
    name: 'Nuzzle', type: 'Electric',
    attackKey: 'attack', defenseKey: 'defense', aoe: 'Single Opponent',
    power: 0.4, accuracy: 1, criticalHit: 1, contact: true,
    flavor: 'Rubbing against the target will cause them to become paralyzed.',
    onAfterMove: (inp) => {
      return Paralyze(inp, 1)
    }
  },
  'Oblivion Wing': {
    name: 'Oblivion Wing',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1,
    type: 'Flying',
    flavor: 'The user drains the target of its energy.',
    aoe: 'Single Opponent',
    onAfterMove: ({caster, target, damage}) => {
      const log = logDrain(caster, damage!, 2)
      log.add(`${target.species} had its energy drained`)
      return log
    }
  },
  Obstruct: {
    name: 'Obstruct', type: 'Dark',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, power: 0, criticalHit: 0,
    aoe: 'Self', zMoveFx: 'ResetStat',
    priority: 4,
    flavor: 'The user protects itself with an obstructive posture. If the target strikes head-on, its defense will drop harshly.',
    onAfterMove: (inp) => APPLY_TEMP_STATUS(inp.caster, ConditionMap.ProtectObstruct,
      `${inp.caster.species} protected itself`)
  },
  Octazooka: {
    name: 'Octazooka',
    accuracy: 0.85,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.85,
    type: 'Water',
    flavor: 'The user shoots a ball of ink at high speeds from its mouth.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => SpeNerf(inp.target, inp, 0.5),
  },
  Octolock: {
    name: 'Octolock', type: 'Fighting',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: 1, criticalHit: 0,
    flavor: 'The target is locked with tentacles. Its defenses will drop each turn.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => {
      return APPLY_TEMP_STATUS(inp.target, ConditionMap.Octolocked,
        `${inp.target.species} has been locked!`)
    }
  },
  'Odor Sleuth': {
    name: 'Odor Sleuth', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: 1, criticalHit: 0,
    flavor: 'You can hide but you cannot stop smelling.',
    aoe: 'Single Opponent', zMoveFx: 'AtkBuff1',
    onAfterMove: (inp) => {
      return APPLY_TEMP_STATUS(inp.target, ConditionMap.Sleuthed,
        `${inp.target.species} has been identified!`)
    }
  },
  'Ominous Wind': {
    name: 'Ominous Wind',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.8,
    type: 'Ghost',
    flavor: 'The user conjures a strange wind that causes goosebumps. All of its stats might rise.',
    aoe: 'Single Opponent',
    onAfterMove: BUFF_ALL
  },
  'Order Up': {
    name: 'Order Up', type: 'Dragon',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1, accuracy: 1, criticalHit: 1,
    aoe: 'Single Opponent',
    flavor: 'The user serves the target. If there is a Tatsugiri, the user gains sushi powers.',
    onAfterMove: (inp) => {
      const forms = {
        curly: false,
        droopy: false,
        stretchy: false,
      }
      // for (const c of inp.casters) {
        // if (c.badge.id === Tatsugiri) {
        //   if (c.badge.personality.form === 'curly') {
        //     forms.curly = true
        //   }
        //   if (c.badge.personality.form === 'droopy') {
        //     forms.droopy = true
        //   }
        //   if (c.badge.personality.form === 'stretchy') {
        //     forms.stretchy = true
        //   }
        // }
      // }
      const log = new Log()
      if (forms.curly) {
        log.push(BUFF_STAT(inp.caster, inp, 'attack', 1))
      }
      if (forms.droopy) {
        log.push(BUFF_STAT(inp.caster, inp, 'defense', 1))
      }
      if (forms.stretchy) {
        log.push(BUFF_STAT(inp.caster, inp, 'speed', 1))
      }
      return log
    }
  },
  'Origin Pulse': {
    name: 'Origin Pulse', type: 'Water',
    aoe: 'Nearby Opponents',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.3, accuracy: 0.85, criticalHit: 1,
    flavor: 'The first waters erupts forward and strkes the targets.',
  },
  Outrage: {
    name: 'Outrage',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.4,
    type: 'Dragon',
    flavor: 'The user might start a tantrum that causes serious damage. Then it becomes confused.',
    aoe: 'Random Opponent', contact: true,
    onAfterMove: (inp) => APPLY_TEMP_STATUS(inp.caster, ConditionMap.Outraged),
  },
  'Overdrive': {
    name: 'Overdrive',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1,
    type: 'Electric',
    flavor: 'The user strikes aloud with vibrations of a string instrument.',
    aoe: 'Nearby Opponents', sound: true,
  },
  Overheat: {
    name: 'Overheat',
    accuracy: 0.9,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.7,
    type: 'Fire',
    flavor: 'The user blows out a blindingly bright flame. Then its special attack drops.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'spAttack', -2),
  },
  'Pain Split': {
    name: 'Pain Split', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: 1, criticalHit: 0,
    aoe: 'Single Opponent', recovery: true, zMoveFx: 'DefBuff1',
    flavor: "Let's share everything, including out pain! You get some and I get some!",
    onAfterMove: (inp) => {
      const log = new Log()
        .add(`${inp.caster.species} shared with ${inp.target.species}.`)
      /*
       * Pichu - 100 HP
       * Chansey - 400 HP
       * hpTotal = 500
       * hpAvg = 250
       * Pichu: Heals hpAvg - pichu.currentHp (+150)
       * Chansey: Heals hpAvg - chansey.currentHp (-150)
       */
      const hpTotal = inp.caster.currentHp + inp.target.currentHp
      const hpAvg = Math.floor(hpTotal / 2)
      log.push(logHeal(inp.caster, hpAvg - inp.caster.currentHp))
      log.push(logHeal(inp.target, hpAvg - inp.target.currentHp))
      return log
    }
  },
  'Parabolic Charge': {
    name: 'Parabolic Charge',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1,
    type: 'Electric',
    flavor: 'The user drains the target of its energy.',
    aoe: 'Single Opponent',
    onAfterMove: ({caster, target, damage}) => {
      const log = logDrain(caster, damage!, 2)
      log.add(`${target.species} had its energy drained`)
      return log
    }
  },
  'Parting Shot': {
    name: 'Parting Shot', type: 'Dark',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, criticalHit: 0, power: 0,
    flavor: 'The user curses the opponent and then leaves before things get serious.',
    aoe: 'Single Opponent',
    onBeforeMove: ({caster, move}) => {
      move.type = 'Status'
      if (getCondition(caster, 'TrappedInBattle')) {
        move.failed = true
        return new Log().add('But it failed...')
      }
      return new Log()
    },
    onAfterMove: (inp) => {
      const log = new Log()
      log.push(BUFF_STAT(inp.target, inp, 'attack', -1))
      log.push(BUFF_STAT(inp.target, inp, 'spAttack', -1))
      log.push(APPLY_TEMP_STATUS(inp.caster, {...ConditionMap['SwitchOut']},
        `${inp.caster.species} is getting out of Dodge!`))
      return log
    },
  },
  Payback: {
    name: 'Payback', type: 'Dark',
    attackKey: 'attack', defenseKey: 'defense', aoe: 'Single Opponent',
    accuracy: 1, criticalHit: 1, power: 0.7,
    flavor: 'If the user moves last, or its target has used an item, the damage of this move is doubled.',
    onBeforeMove: ({caster, target, move}) => {
      if (getCondition(caster, 'Already Hit') || target.heldItemConsumed) {
        move.power *= 2
      }
      return new Log()
    }
  },
  'Pay Day': {
    name: 'Pay Day', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense', aoe: 'Single Opponent',
    accuracy: 1, power: 0.6, criticalHit: 1,
    flavor: 'Golden coins are hurled at the foe. The field becomes covered in coinage.',
    onAfterMove: ({prefix, field}) => {
      field.sides[prefix].goldCoins = true
      return new Log().add('Coins were scattered on the field')
    }
  },
  Peck: {
    name: 'Peck',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.55,
    type: 'Flying',
    flavor: 'The user hits the target with a sharp beak. It is mildly annoying.',
    aoe: 'Single Opponent',
    contact: true,
  },
  'Petal Blizzard': {
    name: 'Petal Blizzard',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.1,
    type: 'Grass',
    flavor: 'The user emits a burst of flower petals, striking everyone.',
    aoe: 'Everyone',
  },
  'Petal Dance': {
    name: 'Petal Dance',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.4,
    type: 'Grass',
    flavor: 'The user spins around quickly with bursts of petals. It shortly leaves the user confused.',
    aoe: 'Random Opponent', contact: true,
    onAfterMove: (inp) => APPLY_TEMP_STATUS(inp.caster, ConditionMap['Petal Dancing']),
  },
  'Phantom Force': {
    name: 'Phantom Force', type: 'Ghost',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.1, accuracy: 1, criticalHit: 1,
    flavor: 'The user disappears and then hits the target. This move will pentrate protective barriers.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({caster, target, move}) => {
      const ashadow = getCondition(caster, 'AShadow')
      if (!ashadow) {
        move.failed = true
        return APPLY_TEMP_STATUS(caster, ConditionMap.AShadow,
          `${caster.species} dissolved into the ground`)
      }
      if (getCondition(target, 'Protect')) {
        // Break through Protect
        removeCondition(target, 'Protect')
      }
      removeCondition(caster, 'AShadow') // Reset
      return new Log().add(`${caster.species} appeared from the shadows!`)
    },
    onAfterMove: (inp) => multiTurnOnAfterMove(inp, 'AShadow'),
  },
  'Photon Geyser': {
    name: 'Photon Geyser', type: 'Psychic', aoe: 'Single Opponent',
    attackKey: 'spAttack', defenseKey: 'spDefense', // Subject to change
    power: 1.2, accuracy: 1, criticalHit: 1,
    flavor: 'The user lets out a burst of tiny light particles. The stat used is always highest.',
    onBeforeMove: ({caster, move}) => {
      if (caster.attack > caster.spAttack) {
        move.attackKey = 'attack'
        move.defenseKey = 'defense'
      }
      return new Log()
    }
  },
  'Pin Missile': {
    name: 'Pin Missile',
    accuracy: 0.95,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Bug',
    flavor: 'The user shoots out multiple pins at the target.',
    aoe: 'Single Opponent',
    onBeforeMove: ({move}) => HIT_MANY(move, 0.3, 2, 5),
  },
  'Plasma Fists': {
    name: 'Plasma Fists', type: 'Electric', aoe: 'Single Opponent',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.2, accuracy: 1, criticalHit: 1,
    flavor: 'The user strikes with the electricity built up in its fists. Electrons remain on the field after.',
    onAfterMove: ({field}) => {
      field.ions = true
      return new Log().add('Ions scattered across the field.')
    }
  },
  'Play Nice': {
    name: 'Play Nice', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: 1,
    aoe: 'Single Opponent', zMoveFx: 'DefBuff1',
    flavor: 'The user looks like they want to share. The target lowers their attack.',
    onBeforeMove: noop,
    onAfterMove: (inp) => {
      const log = new Log()
      log.push(BUFF_STAT(inp.target, inp, 'attack', -1))
      return log
    }
  },
  'Play Rough': {
    name: 'Play Rough',
    accuracy: 0.9,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Fairy',
    flavor: 'The user strikes the target with a playful force. The target\'s attack may drop.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => AtkNerf(inp.target, inp, 0.25),
  },
  'Pluck': {
    // Same as Bug Bite
    name: 'Pluck',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.8,
    type: 'Flying',
    flavor: 'The user swoops down and plucks an item from the target.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => {
      return FORCE_CONSUME(inp, 'plucked the')
    }
  },
  'Poison Fang': {
    name: 'Poison Fang',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.75,
    type: 'Poison',
    flavor: 'The user attacks with venomous fangs. It will probably poison the target.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => Poison(inp, 0.5),
  },
  'Poison Gas': {
    name: 'Poison Gas', type: 'Poison',
    power: 0, criticalHit: 0, accuracy: 0.9,
    aoe: 'Nearby Opponents', zMoveFx: 'DefBuff1',
    attackKey: 'attack', defenseKey: 'defense',
    flavor: 'The user emits toxic fumes that poison all who breathe it in.',
    onAfterMove: (inp) => Poison(inp, 1),
  },
  'Poison Jab': {
    name: 'Poison Jab',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Poison',
    flavor: 'The user stabs with an appendage dipped in poison. It might poison the target.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => Poison(inp, 0.25),
  },
  'Poison Powder': {
    name: 'Poison Powder',
    accuracy: 0.8,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Poison',
    flavor: 'The user emits poisonous spores that the target inhales, much to their chagrin.',
    aoe: 'Single Opponent', zMoveFx: 'DefBuff1',
    onBeforeMove: ({target, move}) => {
      if (target.heldItemKey === 'safetygoggles') {
        move.failed = true
        return new Log().add(`The goggles protected ${target.species}`)
      }
      return new Log()
    },
    onAfterMove: (inp) => Poison(inp, 1),
  },
  'Poison Sting': {
    name: 'Poison Sting',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.35,
    type: 'Poison',
    flavor: 'The user jabs the target with a poisonous needle.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Poison(inp, 0.3),
  },
  'Poison Tail': {
    name: 'Poison Tail',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 2,
    power: 0.7,
    type: 'Poison',
    flavor: 'The user smacks the target with a poisonous tail. Critical hits are more likely.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => Poison(inp, 0.1),
  },
  /** Pollen Puffs will be one or the other depending on variant. No easy way to change move target for now. */
  'Pollen Puff_Damage': {
    name: 'Pollen Puff',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.1,
    type: 'Bug',
    flavor: 'A burst of pollen shoots out from the user. If the target is an ally, they will be healed.',
    aoe: 'Single Opponent',
  },
  'Pollen Puff_Heal': {
    name: 'Pollen Puff',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.1,
    type: 'Bug',
    flavor: 'A burst of pollen shoots out from the user. If the target is an ally, they will be healed.',
    aoe: 'Single Ally',
    recovery: true,
    onBeforeMove: ({move}) => {
      move.power = 0
      return new Log()
    },
    onAfterMove: ({target}) => {
      return logHeal(target, target.totalHp / 2)
    }
  },
  Poltergeist: {
    name: 'Poltergeist', type: 'Ghost',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.3, accuracy: 0.9, criticalHit: 1, aoe: 'Single Opponent',
    flavor: "The user takes control of the target's item and does a lot of damage.",
    onBeforeMove: ({target, move}) => {
      if (!target.heldItem) {
        move.failed = true
        return new Log().add('The move failed...')
      }
      return new Log()
    },
  },
  'Population Bomb': {
    name: 'Population Bomb',
    accuracy: 0.9,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Normal',
    flavor: 'The user gathers its friends to launch a combo attack.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({move}) => HIT_MANY(move, 0.4, 1, 10),
  },
  'Pounce': {
    name: 'Pounce',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    contact: true,
    criticalHit: 1,
    power: 0.7,
    type: 'Bug',
    flavor: "The user pounces with a stinger of some kind. The target's speed subsequently drops",
    aoe: 'Single Opponent',
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'speed', -1)
  },
  Pound: {
    name: 'Pound',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.6,
    type: 'Normal',
    flavor: 'The user smacks the target.',
    aoe: 'Single Opponent', contact: true,
  },
  'Powder': {
    name: 'Powder', type: 'Bug',
    attackKey: 'attack', defenseKey: 'defense', priority: 1,
    power: 0, criticalHit: 0, accuracy: 1, aoe: 'Single Opponent', zMoveFx: 'SpDefBuff2',
    flavor: 'The target is covered in a flammable powder. Or is it inflammable? Either way, do not use Fire-type moves.',
    onBeforeMove: ({target, move}) => {
      if (target.heldItemKey === 'safetygoggles') {
        move.failed = true
        return new Log().add(`The goggles protected ${target.species}`)
      }
      return new Log()
    },
    onAfterMove: ({target}) => APPLY_TEMP_STATUS(target, ConditionMap.Powdered,
      `${target.species} was covered in a combustible powder.`)
  },
  'Powder Snow': {
    name: 'Powder Snow',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.6,
    type: 'Ice',
    flavor: 'The user blows chilly snow at the targets. A freeze is possible.',
    aoe: 'Nearby Opponents',
    onAfterMove: (inp) => Freeze(inp, 0.1),
  },
  'Power Gem': {
    name: 'Power Gem',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1,
    type: 'Rock',
    flavor: 'The user conjures a mystical rock and chucks it at the target.',
    aoe: 'Single Opponent',
  },
  'Power Shift': {
    name: 'Power Shift',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Psychic',
    flavor: 'The user swaps its attack and defense stats.',
    aoe: 'Self',
    onAfterMove: ({caster}) => {
      const casterAtk = caster.attack
      caster.attack = caster.defense
      caster.defense = casterAtk
      const log = new Log()
      log.add(`${caster.species} swapped their Attack and Defense stats`)
      return log
    }
  },
  'Power Split': {
    name: 'Power Split',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Psychic',
    flavor: 'The user and the target decide to split the difference in their attack stats.',
    aoe: 'Single Opponent', zMoveFx: 'SpdBuff1',
    onBeforeMove: ({target, move}) => {
      if (getCondition(target, 'Raid')) {
        move.failed = true
      }
      return new Log()
    },
    onAfterMove: ({caster, target}) => {
      const atkSum = caster.attack + target.attack
      const spaSum = caster.spAttack + target.spAttack
      caster.attack = atkSum/2
      caster.attack = spaSum/2
      target.attack = atkSum/2
      target.attack = spaSum/2
      const log = new Log()
      log.add(`${caster.species} and ${target.species} split their Attack and Special Attack stats`)
      return log
    }
  },
  'Power Swap': {
    name: 'Power Swap',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Psychic',
    flavor: 'The user decides to swap its attacking power with the target.',
    aoe: 'Single Opponent', zMoveFx: 'SpdBuff1',
    onBeforeMove: ({target, move}) => {
      if (getCondition(target, 'Raid')) {
        move.failed = true
      }
      return new Log()
    },
    onAfterMove: ({caster, target}) => {
      const casterAtk = caster.attack
      const casterSpa = caster.spAttack
      caster.attack = target.attack
      caster.spAttack = target.spAttack
      target.attack = casterAtk
      target.spAttack = casterSpa
      const log = new Log()
      log.add(`${caster.species} and ${target.species} swapped their Attack and Special Attack stats`)
      return log
    }
  },
  'Power Trick': {
    name: 'Power Trick',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Psychic',
    flavor: 'The user swaps their attack and defensive stats.',
    aoe: 'Self', zMoveFx: 'AtkBuff1',
    onAfterMove: ({caster}) => {
      const oldDef = caster.defense
      caster.defense = caster.attack
      caster.attack = oldDef
      const log = new Log()
      log.add(`The attack and defense of ${caster.species} swapped`)
      return log
    }
  },
  'Power Trip': {
    name: 'Power Trip', type: 'Dark',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 0.4, accuracy: 1, criticalHit: 1, contact: true,
    flavor: 'The stat buffs from the user are employed to deal massive damage.',
    aoe: 'Single Opponent',
    onBeforeMove: ({caster, move}) => {
      let powerBoost = 0.4
      powerBoost += caster.statBuffs.attack * 0.2
      powerBoost += caster.statBuffs.spAttack * 0.2
      powerBoost += caster.statBuffs.defense * 0.2
      powerBoost += caster.statBuffs.spDefense * 0.2
      powerBoost += caster.statBuffs.speed * 0.2
      move.power = Math.min(powerBoost, 3)
      if (move.power <= 0) {
        return new Log().add('The move ran out of power and fizzled out.')
      }
      return new Log()
    },
  },
  'Power-Up Punch': {
    name: 'Power-Up Punch', type: 'Fighting',
    attackKey: 'attack', defenseKey: 'defense', contact: true,
    power: 0.6, accuracy: 1, criticalHit: 1, aoe: 'Single Opponent',
    flavor: 'A weak punch that only gets stronger with repeated use.',
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'attack', 1)
  },
  'Power Whip': {
    name: 'Power Whip',
    accuracy: 0.85,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.3,
    type: 'Grass',
    flavor: 'The user extends a grassy whip at the target with great force.',
    aoe: 'Single Opponent', contact: true,
  },
  'Precipice Blades': {
    name: 'Precipice Blades', type: 'Ground',
    aoe: 'Nearby Opponents',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.4, accuracy: 0.85, criticalHit: 1,
    flavor: 'The edge of the earth bursts forward and strkes the targets.',
  },
  Present: {
    name: 'Present',
    accuracy: 0.9,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Normal',
    flavor: 'The user pulls a gift out and gives it to the target. What happens when the target opens it? Nobody knows for sure.',
    aoe: 'Random Opponent',
    onBeforeMove: function({target, move}) {
      const p = Math.random()
      if (p < 0.4) {
        // Bad
        move.power *= 0.5;
      } else if (p < 0.7) {
        // Mediocre
        move.power *= 1;
      } else if (p < 0.8) {
        // Good
        move.power *= 1.5;
      } else {
        // Whoops
        move.failed = true;
        const log = logHeal(target, target.totalHp / 4);
        log.add(`${target.species} was healed from the present`);
        return log;
      }
      return new Log()
    }
  },
  'Prismatic Laser': {
    name: 'Prismatic Laser',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.8,
    type: 'Psychic',
    flavor: 'The user unleashes an awe-inspiring burst of rainbow power. The user cannot move the next turn.',
    aoe: 'Single Opponent',
    onAfterMove: RECHARGE
  },
  Protect: {
    name: 'Protect',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Normal',
    priority: 4,
    flavor: 'The user covers itself in a protective barrier, blocking attacks against it.',
    aoe: 'Self', zMoveFx: 'ResetStat',
    onAfterMove: ({caster}) => APPLY_TEMP_STATUS(caster, ConditionMap.Protect,
        `${caster.species} shielded itself!`)
  },
  Psybeam: {
    name: 'Psybeam',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.85,
    type: 'Psychic',
    flavor: 'Psionic energy is fired at the target. They might become confused.',
    aoe: 'Single Opponent', zMoveFx: 'SpdBuff1',
    onAfterMove: (inp) => Confuse(inp, 0.1),
  },
  'Psyblade': {
    name: 'Psyblade',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Psychic',
    flavor: "An ethereal blade slices the target. This move's power is boosted in electric terrain.",
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: (inp) => {
      if (inp.field.terrain?.name === 'Electric Terrain') {
        inp.move.power *= 1.5
      }
      return new Log()
    }
  },
  Psychic: {
    name: 'Psychic',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.1,
    type: 'Psychic',
    flavor: 'The user hits the target with telekinetic force. Their special defense may also drop.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => SpdNerf(inp.target, inp, 0.1)
  },
  'Psychic Fangs': {
    name: 'Psychic Fangs',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.05,
    type: 'Psychic',
    flavor: 'The user bites with supernatural fangs, breaking through screens.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({move, field, targetPrefix}) => {
      if (field.sides[targetPrefix].reflect) {
        // If reflect is up, this move will break it
        // But first we need to wait after damage is done
        // So let's just double the move power to simulate
        // the reflect breaking
        move.power *= 2
      }
      return new Log()
    },
  },
  'Psychic Terrain': {
    name: 'Psychic Terrain', type: 'Psychic',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'Self', zMoveFx: 'SpAtkBuff1',
    flavor: 'Warps the field with psychic power. This applies some benefits.',
    onAfterMove: (inp) => setTerrain(inp, 'Psychic')
  },
  'Psycho Boost': {
    name: 'Psycho Boost',
    accuracy: 0.9,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.7,
    type: 'Psychic',
    flavor: 'The user emits a single burst of telekinetic energy. While powerful, their special attack drops.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'spAttack', -2)
  },
  'Psycho Cut': {
    name: 'Psycho Cut',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 2,
    power: 0.9,
    type: 'Psychic',
    flavor: 'The user strikes the target with a physical manifestation of psychic energy. Critical hits are more likely.',
    aoe: 'Single Opponent',
  },
  'Psycho Shift': {
    name: 'Psycho Shift',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Psychic',
    flavor: 'The user uses telepathy to transfer its status condition to the target.',
    aoe: 'Single Opponent',
    onBeforeMove: ({caster, move}) => {
      if (!caster.status) {
        move.failed = true
        return new Log().add('The move failed...')
      }
      return new Log()
    },
    onAfterMove: ({caster, target}) => {
      target.status = {...caster.status!}
      caster.status = undefined
      return new Log().add(`${caster.species} transferred its ${target.status?.name} to ${target.species}`)
    }
  },
  'Psych Up': {
    name: 'Psych Up', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: Infinity,
    zMoveFx: 'Heal', aoe: 'Single Opponent',
    flavor: 'The user pumps itself up to start the battle. It copies the stat changes of its target.',
    onBeforeMove: noop,
    onAfterMove: (inp) => {
      for (const [key, val] of Object.entries(inp.target.statBuffs)) {
        inp.caster.statBuffs[key] = val
      }
      return new Log().add(`${inp.prefix} ${inp.caster.species} synced the stat changes of ${inp.targetPrefix} ${inp.target.species}`)
    }
  },
  'Psyshield Bash': {
    name: 'Psyshield Bash', type: 'Psychic',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.9, accuracy: 0.9, criticalHit: 1,
    aoe: 'Single Opponent', contact: true,
    flavor: 'The user covers itself in psychic energy and crashes into the target. Its defense rises after.',
    onAfterMove: (inp) => {
      return BUFF_STAT(inp.caster, inp, 'defense', 1)
    }
  },
  Psyshock: {
    name: 'Psyshock',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.1,
    type: 'Psychic',
    flavor: 'The user shocks the target with a burst of psychic power.',
    aoe: 'Single Opponent',
  },
  Psystrike: {
    name: 'Psystrike',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.2,
    type: 'Psychic',
    flavor: 'The user strikes at the target by harnessing its own psychic energy.',
    aoe: 'Single Opponent',
  },
  Psywave: {
    name: 'Psywave',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1,
    type: 'Psychic',
    flavor: 'The user emits a strange wave of telekinetic energy. Its power changes at random.',
    aoe: 'Single Opponent',
    onBeforeMove: ({move}) => {
      // Make the power modifiable
      move.power = Math.random() * 2
      return new Log()
    },
    onAfterMove: nop
  },
  Punishment: {
    name: 'Punishment', type: 'Dark',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.8, accuracy: 1, criticalHit: 1,
    flavor: 'The user turns the tables on the target, dealing more damage for each stat boost it has.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({target, move}) => {
      let powerBoost = 0.6
      powerBoost += Math.max(target.statBuffs.attack, 0) * 0.2
      powerBoost += Math.max(target.statBuffs.spAttack, 0) * 0.2
      powerBoost += Math.max(target.statBuffs.defense, 0) * 0.2
      powerBoost += Math.max(target.statBuffs.spDefense, 0) * 0.2
      powerBoost += Math.max(target.statBuffs.speed, 0) * 0.2
      move.power = Math.min(powerBoost, 2.2)
      return new Log()
    },
  },
  Purify: {
    name: 'Purify', type: 'Poison', aoe: 'Single Ally', recovery: true,
    accuracy: Infinity, power: 0, criticalHit: 0, zMoveFx: 'BuffAll1',
    attackKey: 'attack', defenseKey: 'defense',
    flavor: 'The user sucks out the poison from the target. The target and user recover.',
    onBeforeMove: ({target, move}) => {
      if (!target.status) {
        move.failed = true
        return new Log().add(`There is nothing to purify.`)
      }
      return new Log()
    },
    onAfterMove: ({caster, target}) => {
      target.status = undefined
      removeCondition(caster, 'PoisonBad')
      const log = new Log().add(`${target.species} recovered its status condition.`)
      log.push(logHeal(caster, caster.totalHp / 4))
      return log
    }
  },
  'Pyro Ball': {
    name: 'Pyro Ball', type: 'Fire',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.4, accuracy: 0.9, criticalHit: 1,
    aoe: 'Single Opponent',
    flavor: 'The user kicks up a small stone and shoots a flaming ball at the target.',
    onAfterMove: (inp) => Burn(inp, 0.1),
  },
  'Quick Attack': {
    name: 'Quick Attack',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.6,
    type: 'Normal',
    priority: 1,
    flavor: 'The user charges at the target with quickened speed.',
    aoe: 'Single Opponent', contact: true,
  },
  'Quick Guard': {
    name: 'Quick Guard',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Fighting',
    priority: 3,
    flavor: 'The user throws up a barrier that blocks quick moves.',
    aoe: 'Self', zMoveFx: 'DefBuff1',
    onBeforeMove: noop,
    onAfterMove: ({caster}) => APPLY_TEMP_STATUS(caster, ConditionMap.ProtectQuick,
        `${caster.species} shielded itself!`)
  },
  'Quiver Dance': {
    name: 'Quiver Dance',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Bug',
    flavor: 'The user conducts a mating dance, raising its stats.',
    aoe: 'Self', zMoveFx: 'ResetStat',
    onAfterMove: (input) => {
      const log = new Log()
      log.push(BUFF_STAT(input.caster, input, 'spAttack', 1))
      log.push(BUFF_STAT(input.caster, input, 'spDefense', 1))
      log.push(BUFF_STAT(input.caster, input, 'speed', 1))
      return log
    }
  },
  'Rage': {
    name: 'Rage', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 1, power: 0.7, criticalHit: 1, aoe: 'Single Opponent', contact: true,
    flavor: 'The user strikes with anger. The more it is hit, the angrier it gets.',
    onBeforeMove: ({caster, move}) => {
      const status = getCondition(caster, 'TimesHit')
      if (status) {
        const dmgBonus = Math.min(status.p!.rageFist ?? 0, 6)
        move.power += 0.5 * dmgBonus
      }
      return new Log()
    }
  },
  'Rage Fist': {
    name: 'Rage Fist', type: 'Ghost',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 1, power: 0.7, criticalHit: 1, aoe: 'Single Opponent', contact: true,
    flavor: 'The user strikes with anger. The more it is hit, the angrier it gets.',
    onBeforeMove: (inp) => {
      const timesHit = getCondition(inp.caster, 'TimesHit')
      const rageFist = timesHit?.p?.rageFist ?? 0
      inp.move.power = 0.7 + 0.5 * rageFist
      return new Log()
    },
  },
  'Rage Powder': {
    name: 'Rage Powder', type: 'Bug',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, power: 0, criticalHit: 0, aoe: 'Self',
    flavor: 'Makes self the center of attention with annoying pollen.',
    onAfterMove: ({caster, prefix, field}) => {
      field.sides[prefix].target = caster
      return new Log().add(`${caster.species} became the center of attention`)
    }
  },
  'Raging Bull': {
    name: 'Raging Bull', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.1, accuracy: 1, criticalHit: 1,
    aoe: 'Single Opponent', contact: true,
    flavor: 'The user rampages and charges with fury. Its type depends on its breed.',
    onGetType: (caster) => {
      return caster.type2 ?? caster.type1
    },
    onBeforeMove: ({move, field, targetPrefix}) => {
      if (field.sides[targetPrefix].reflect) {
        // If reflect is up, this move will break it
        // But first we need to wait after damage is done
        // So let's just double the move power to simulate
        // the reflect breaking
        move.power *= 2
      }
      return new Log()
    },
    onAfterMove: ({field, targetPrefix}) => {
      // Break screens
      const log = new Log()
      if (field.sides[targetPrefix].reflect) {
        log.add('The reflected barrier shattered')
        field.sides[targetPrefix].reflect = 0
      }
      if (field.sides[targetPrefix].lightscreen) {
        log.add('The light screen shattered')
        field.sides[targetPrefix].lightscreen = 0
      }
      return log
    }
  },
  'Raging Fury': {
    name: 'Raging Fury', type: 'Fire',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.4, accuracy: 1, criticalHit: 1,
    aoe: 'Random Opponent',
    flavor: 'The user rampages with fiery power, then becoming confused.',
    onAfterMove: (inp) => APPLY_TEMP_STATUS(inp.caster, ConditionMap['Fury Raging']),
  },
  'Raid Heal': {
    name: 'Raid Heal',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Status',
    flavor: 'The raid boss shrugs off damage and status effects',
    aoe: 'Self',
    onAfterMove: ({caster}) => {
      const log = logHeal(caster, caster.totalHp / 20)
      if (caster.status) {
        if (caster.status.onDeactivation) {
          caster.status.onDeactivation(caster)
        }
        caster.status = undefined
      }
      log.add(`${caster.species} healed itself`)
      return log
    }
  },
  'Rain Dance': {
    name: 'Rain Dance',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Water',
    flavor: 'The user conjures a rain storm through a fancy dance.',
    aoe: 'Self', zMoveFx: 'SpdBuff1',
    onBeforeMove: noop,
    onAfterMove: ({field}) => {
      const log = new Log()
      field.weather = {...Weathers.Rain}
      log.add('It started to rain.')
      return log
    }
  },
  'Rapid Spin': {
    name: 'Rapid Spin',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0.7,
    type: 'Normal',
    flavor: 'Items on the field are removed.',
    aoe: 'Single Opponent', zMoveFx: 'AccBuff1',
    onAfterMove: (inp) => {
      const {caster, field, prefix} = inp
      const log = new Log()
      log.add('The field was cleared.')

      field.sides[prefix].spikes = 0
      field.sides[prefix].toxicSpikes = 0
      field.sides[prefix].stealthRock = false
      field.sides[prefix].sharpSteel = false
      field.sides[prefix].stickyWeb = false
      log.push(BUFF_STAT(caster, inp, 'speed', 1))
      return log
    }
  },
  'Razor Leaf': {
    name: 'Razor Leaf',
    accuracy: 0.95,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 2,
    power: 0.75,
    type: 'Grass',
    flavor: 'The user shoots out sharp leaves at targets.',
    aoe: 'Nearby Opponents',
  },
  'Razor Shell': {
    name: 'Razor Shell', type: 'Water',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.95, accuracy: 0.95, criticalHit: 1,
    flavor: 'The user slashes a sharp blade-like shell.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => {
      if (Math.random() < 0.5) {
        return BUFF_STAT(inp.target, inp, 'defense', -1)
      }
      return new Log()
    }
  },
  'Razor Wind': {
    name: 'Razor Wind', type: 'Normal',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1, accuracy: 1, criticalHit: 2,
    flavor: 'The user takes time to draw the wind',
    aoe: 'Single Opponent',
    onBeforeMove: (inp) => multiTurnOnBeforeMove(inp, 'WindingRazors', 'started drawing the wind', 'released blades of wind!'),
    onAfterMove: (inp) => multiTurnOnAfterMove(inp, 'WindingRazors'),
  },
  'Recover': {
    name: 'Recover', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, criticalHit: 0, power: 0,
    aoe: 'Self', recovery: true, zMoveFx: 'ResetStat',
    flavor: 'The user rests a moment, healing itself.',
    onAfterMove: ({caster}) => logHeal(caster, caster.totalHp/2)
  },
  Recycle: {
    name: 'Recycle', type: 'Normal', aoe: 'Self',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, power: 0, criticalHit:0, recovery: true,
    flavor: 'The user takes a consumed held item and finds a way to rejuvenate it.',
    onAfterMove: ({caster}) => {
      if (!caster.heldItem) return new Log().add('Nothing happened.')
      caster.heldItemConsumed = false
      caster.heldItemTotallyConsumed = false
      const hiLabel = ITEMS[caster.heldItemKey!].label
      return new Log().add(`${caster.species} made some re-use out of its ${hiLabel} ♻️`)
    }
  },
  Reflect: {
    name: 'Reflect',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Psychic',
    flavor: 'The user draws up a screen that filters physical attacks.',
    aoe: 'Self', zMoveFx: 'DefBuff1',
    onBeforeMove: noop,
    onAfterMove: ({caster, field, prefix}) => {
      const turns = caster.heldItemKey === 'lightclay' ? 8 : 5
      field.sides[prefix].reflect = turns
      const log = new Log()
      log.add('A reflective screen protects the Pokémon and its allies')
      return log
    }
  },
  'Reflect Type': {
    name: 'Reflect Type', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0,
    flavor: `The user's body becomes translucent and adopts the same type as the target.`,
    aoe: 'Single Opponent', zMoveFx: 'SpAtkBuff1',
    onBeforeMove: noop,
    onAfterMove: ({caster, target}) => {
      const log = new Log()
      log.add(`${caster.species} now shares the same types as ${target.species}`)
      caster.type1 = target.type1
      caster.type2 = target.type2
      return log
    },
  },
  Refresh: {
    name: 'Refresh', type: 'Normal', aoe: 'Self', recovery: true,
    attackKey: 'attack', defenseKey: 'defense', zMoveFx: 'Heal',
    power: 0, accuracy: Infinity, criticalHit: 0,
    flavor: 'The user takes a beat to shrug off status conditions.',
    onAfterMove: ({caster}) => {
      if (!caster.status) return new Log().add('Nothing happened.')
      removeCondition(caster, 'PoisonBad')
      const log = new Log()
      if (caster.status!.name === 'Burn') {
        log.add(`${caster.species} is no longer burned`)
      }
      if (caster.status!.name === 'Paralyzed') {
        log.add(`${caster.species} is no longer paralyzed`)
      }
      if (caster.status!.name === 'Poison') {
        log.add(`${caster.species} is no longer poisoned`)
      }
      caster.status = undefined
      return log
    }
  },
  'Relic Song': {
    name: 'Relic Song', type: 'Normal',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 0.95, accuracy: 1, criticalHit: 1, sound: true,
    flavor: 'The user sings an old song.',
    aoe: 'Nearby Opponents',
    onAfterMove: (inp) => Sleep(inp, 0.1),
  },
  Rest: {
    name: 'Rest', type: 'Psychic', aoe: 'Self', recovery: true,
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: Infinity, zMoveFx: 'ResetStat',
    flavor: 'The user takes a nap in the middle of battle! Somehow it helps.',
    onAfterMove: ({caster}) => {
      caster.status = {...StatusMap.Asleep}

      caster.status.p = {
        Rest: true
      }
      return logHeal(caster, caster.totalHp)
    }
  },
  Retaliate: {
    name: 'Retaliate', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.9, accuracy: 1, criticalHit: 1,
    flavor: "The user tries to get revenge. If an ally has already fainted, this attack's damage is doubled.",
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({casters, move}) => {
      if (casters.filter(c => c.fainted).length) {
        move.power *= 2
      }
      return new Log()
    }
  },
  Return: {
    name: 'Return',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.71, // MSG - BP b/w 1-102, half is 51
    type: 'Normal',
    flavor: 'The user attacks with the power of friendship',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({caster, move}) => {
      const badge = caster.badge
      if (badge.personality.affectionate) {
        move.power *= 2
      }
      return new Log()
    },
  },
  'Revelation Dance': {
    name: 'Revelation Dance', type: 'Normal', /* Changes */
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.1, accuracy: 1, criticalHit: 1,
    aoe: 'Single Opponent',
    flavor: 'The user dances with a mystical energy. The type of this move is based on the form.',
    onGetType: (caster) => {
      return caster.type1 // For Oricorio, the move type always matches
    },
  },
  Revenge: {
    name: 'Revenge', type: 'Fighting',
    attackKey: 'attack', defenseKey: 'defense', aoe: 'Single Opponent',
    accuracy: 1, criticalHit: 1, power: 0.8, priority: -4, contact: true,
    flavor: 'The user avenges itself. If it was hit this turn, the power doubles.',
    onBeforeMove: ({caster, move}) => {
      if (getCondition(caster, 'Already Hit')) {
        move.power *= 2
      }
      return new Log()
    }
  },
  Reversal: {
    name: 'Reversal',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Fighting',
    flavor: 'The user retaliates. The more damage it has, the more this move does.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({caster, move}) => {
      const hpPercent = caster.currentHp / caster.totalHp
      // Calculate power based on user HP
      // Modify powers a bit to fit into game balance
      // See https://bulbapedia.bulbagarden.net/wiki/Reversal_(move)
      if (hpPercent > 0.6875) {
        move.power = 0.25
      } else if (hpPercent > 0.3542) {
        move.power = 0.5
      } else if (hpPercent > 0.2083) {
        move.power = 0.9
      } else if (hpPercent > 0.1042) {
        move.power = 1.05
      } else if (hpPercent > 0.0417) {
        move.power = 1.3
      } else {
        move.power = 1.75
      }
      return new Log()
    },
    onAfterMove: nop,
  },
  'Rising Voltage': {
    name: 'Rising Voltage', type: 'Electric',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 0.9, criticalHit: 1, accuracy: 1,
    flavor: 'The user strikes with voltage from the earth. In Electric Terrain this attack does more.',
    aoe: 'Single Opponent',
    onBeforeMove: ({field, move}) => {
      if (field.terrain?.name === 'Electric') {
        move.power *= 2
      }
      return new Log()
    }
  },
  'Roar': {
    name: 'Roar', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, criticalHit: 0, power: 0,
    flavor: 'The user shouts so loudly that the opponent is scared away.',
    aoe: 'Single Opponent', priority: -6,
    onBeforeMove: ({target, move}) => {
      move.type = 'Status'
      if (getCondition(target, 'TrappedInBattle')) {
        move.failed = true
        return new Log().add('But it failed...')
      }
      return new Log()
    },
    onAfterMove: (inp) => {
      return APPLY_TEMP_STATUS(inp.target, {...ConditionMap['SwitchOut']},
        `${inp.target.species} is scared away!`)
    },
  },
  'Roar of Time': {
    name: 'Roar of Time', type: 'Dragon',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.7, accuracy: 0.9, criticalHit: 1,
    flavor: 'The user attacks with the power of time. It needs to recharge after.',
    aoe: 'Single Opponent',
    onAfterMove: RECHARGE,
  },
  'Rock Blast': {
    name: 'Rock Blast',
    accuracy: 0.9,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Rock',
    flavor: 'The user attacks with multiple rocks in succession.',
    aoe: 'Single Opponent',
    onBeforeMove: ({move}) => HIT_MANY(move, 0.3, 2, 5),
  },
  'Rock Climb': {
    name: 'Rock Climb', type: 'Normal',
    power: 1.1, accuracy: 0.85, criticalHit: 1,
    attackKey: 'attack', defenseKey: 'defense',
    aoe: 'Single Opponent', contact: true,
    flavor: 'The user smashes into the target, which may leave them confused.',
    onAfterMove: (inp) => Confuse(inp, 0.2),
  },
  'Rock Polish': {
    name: 'Rock Polish',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Rock',
    flavor: 'The user polishes its body to move faster.',
    aoe: 'Self', zMoveFx: 'ResetStat',
    onAfterMove: (input) => BUFF_STAT(input.caster, input, 'speed', 2)
  },
  'Rock Slide': {
    name: 'Rock Slide',
    accuracy: 0.9,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.95,
    type: 'Rock',
    flavor: 'The user attacks with an avalanche of rocks. Targets may flinch.',
    aoe: 'Nearby Opponents',
    onAfterMove: (inp) => Flinch(inp, 0.25),
  },
  'Rock Smash': {
    name: 'Rock Smash', type: 'Fighting',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.6, accuracy: 1, criticalHit: 1,
    flavor: 'The target is smashed like a common breakable rock.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => {
      if (Math.random() < 0.5) {
        return BUFF_STAT(inp.target, inp, 'defense', -1)
      }
      return new Log()
    }
  },
  'Rock Throw': {
    name: 'Rock Throw', type: 'Rock',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.7, accuracy: 0.9, criticalHit: 1,
    flavor: 'The target is hit by a rock.',
    aoe: 'Single Opponent',
  },
  'Rock Tomb': {
    name: 'Rock Tomb',
    accuracy: 0.95,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Rock',
    flavor: 'A series of rocks impale the target and trap them. Their speed drops.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'speed', -1),
  },
  'Rock Wrecker': {
    name: 'Rock Wrecker', type: 'Rock',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.7, accuracy: 0.9, criticalHit: 1,
    flavor: 'The user picks up a massive boulder and hits the target with it. They cannot move the next turn.',
    aoe: 'Single Opponent',
    onAfterMove: RECHARGE,
  },
  'Rolling Kick': {
    name: 'Rolling Kick', type: 'Fighting',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.8, accuracy: 0.85, criticalHit: 1,
    flavor: 'The user charges with its legs stretched outwards. The target might flinch.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => Flinch(inp, 0.3),
  },
  Rollout: {
    name: 'Rollout',
    accuracy: 0.9,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.6,
    type: 'Rock',
    flavor: 'The user curls into a ball and rolls towards the opponent. Their attack raises.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'attack', 1)
  },
  'Roost': {
    name: 'Roost', type: 'Flying',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, criticalHit: 0, power: 0,
    aoe: 'Self', recovery: true, zMoveFx: 'ResetStat',
    flavor: 'The user lands for a hot second to recover some health.',
    onAfterMove: ({caster}) => {
      const status = {...ConditionMap['Grounded']}
      status.p = {
        Roost: true,
      }
      APPLY_TEMP_STATUS(caster, status)
      return logHeal(caster, caster.totalHp/2)
    }
  },
  Rototiller: {
    name: 'Rototiller',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Steel',
    flavor: 'The user tills the soil on the battlefield. Attacks raise for all Grass-types.',
    aoe: 'Everyone', zMoveFx: 'AtkBuff1',
    onBeforeMove: noop,
    onAfterMoveOnce: (inp) => {
      const log = new Log().add(`${inp.caster.species} tilled the field.`)
      if (inp.caster.type1 === 'Grass' || inp.caster.type2 === 'Grass') {
        log.push(BUFF_STAT(inp.caster, inp, 'attack', 1))
        log.push(BUFF_STAT(inp.caster, inp, 'spAttack', 1))
      }
      return log
    },
    onAfterMove: (inp) => {
      const log = new Log()
      if (inp.target.type1 === 'Grass' || inp.target.type2 === 'Grass') {
        log.push(BUFF_STAT(inp.target, inp, 'attack', 1))
        log.push(BUFF_STAT(inp.target, inp, 'spAttack', 1))
      }
      return log
    },
  },
  Round: {
    name: 'Round', type: 'Normal',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 0.8, accuracy: 1, criticalHit: 1,
    aoe: 'Everyone', sound: true,
    flavor: 'The user strikes with a round of music. If others join after, their damage increases.',
    onBeforeMove: ({field, move}) => {
      if (field.round) {
        move.power *= 2
      }
      return new Log()
    },
    onAfterMove: ({field}) => {
      if (!field.round) {
        field.round = true
        return new Log().add('A round has started')
      } else {
        return new Log().add('The round continues')
      }
    }
  },
  "Ruination": {
    name: "Ruination", type: 'Dark',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.01, accuracy: 1, criticalHit: 0,
    aoe: 'Single Opponent',
    flavor: 'The power of ruin is called upon in order to deal a halving blow to the target.',
    onBeforeMove: ({target, move}) => {
      move.power = 0 // Zero out
      if (getCondition(target, 'Raid')) {
        move.failed = true
        return new Log().add('The move failed...')
      }
      return new Log()
    },
    onAfterMove: ({target}) => {
      return logDamage(target, target.currentHp / 2)
    }
  },
  'Sacred Fire': {
    name: 'Sacred Fire',
    accuracy: 0.95,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.2,
    type: 'Fire',
    flavor: 'The user emits an ancient fire that has never stopped burning. The target might be burned.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Burn(inp, 0.5),
  },
  'Sacred Sword': {
    name: 'Sacred Sword', type: 'Fighting',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.1, accuracy: 1, criticalHit: 1,
    flavor: 'The user attacks with a traditional horn strike. Defenses don\'t matter here.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({target}) => {
      target['tmpDefense'] = target.statBuffs.defense
      target.statBuffs.defense = 0
      return new Log()
    },
    onAfterMove: ({target}) => {
      // Yes this might be a problem if the move misses
      // and the value isn't reset.
      target.statBuffs.defense = target['tmpDefense']
      return new Log()
    }
  },
  Safeguard: {
    name: 'Safeguard',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Normal',
    flavor: 'The user covers itself and friends in a mystic veil that protects against status effects.',
    aoe: 'All Allies', zMoveFx: 'SpdBuff1',
    onBeforeMove: noop,
    onAfterMove: ({target}) => {
      APPLY_TEMP_STATUS(target, ConditionMap.Safeguard)
      return new Log()
    },
    onAfterMoveOnce: ({caster}) => {
      return new Log().add(`${caster.species} covered itself and allies in a mystical veil`)
    },
  },
  'Salt Cure': {
    name: 'Salt Cure', type: 'Rock',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.6, criticalHit: 1, accuracy: 1,
    flavor: 'The user lays out the target and prepares them for salt curing. Water and Steel-type Pokémon are quite susceptible.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => APPLY_TEMP_STATUS(inp.target, {...ConditionMap.SaltCure},
      `${inp.target} began salt curing.`)
  },
  'Sand Attack': {
    name: 'Sand Attack', type: 'Ground',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: 1,
    flavor: 'The user flings sand, reducing the accuracy of the target.',
    aoe: 'Single Opponent', zMoveFx: 'EvaBuff1',
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'accuracy', -1)
  },
  'Sandsear Storm': {
    name: 'Sandsear Storm', type: 'Ground',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.2, accuracy: 0.8, criticalHit: 1,
    aoe: 'Nearby Opponents',
    flavor: 'The user unleashes a fierce wind with emotional love and hate. The target may be burned after.',
    onAfterMove: (inp) => {
      return Burn(inp, 0.2)
    }
  },
  Sandstorm: {
    name: 'Sandstorm',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Rock',
    flavor: 'The user conjures strong wings and sand onto the battlefield.',
    aoe: 'Self', zMoveFx: 'SpdBuff1',
    onBeforeMove: noop,
    onAfterMove: ({field}) => {
      const log = new Log()
      field.weather = {...Weathers.Sandstorm}
      log.add('Strong sands began blowing.')
      return log
    }
  },
  'Sand Tomb': {
    name: 'Sand Tomb', type: 'Ground',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 0.85, criticalHit: 1, power: 0.55,
    flavor: 'The user envelops the target into a vortex of sand that traps them.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => {
      const status = {...ConditionMap.Bound}
      if (['bindingband', 'gripclaw'].includes(inp.caster.heldItemKey ?? '')) {
        status.p = {longer: true}
      }
      return APPLY_TEMP_STATUS(inp.target, status,
        `${inp.target.species} became trapped in a sandy vortex!`)
    },
  },
  Scald: {
    name: 'Scald',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1,
    type: 'Water',
    flavor: 'The user unleashes a burst of piping hot water, which might even burn the target.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Burn(inp, 0.3),
  },
  'Scale Shot': {
    name: 'Scale Shot', type: 'Dragon',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.95, accuracy: 0.9, criticalHit: 1, aoe: 'Single Opponent',
    flavor: 'The user fires tiny scales from its body several times. This boosts their speed afterwards but leaves them vulnerable.',
    onBeforeMove: ({move}) => HIT_MANY(move, 0.25, 2, 5),
    onAfterMove: (inp) => {
      return new Log()
        .push(BUFF_STAT(inp.caster, inp, 'defense', -1))
        .push(BUFF_STAT(inp.caster, inp, 'speed', 1))
    }
  },
  'Scary Face': {
    name: 'Scary Face',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Normal',
    flavor: 'The user gives a spooky glare to the target, lowering their speed.',
    aoe: 'Single Opponent', zMoveFx: 'SpdBuff1',
    onBeforeMove: noop,
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'speed', -2),
  },
  'Scorching Sands': {
    name: 'Scorching Sands',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.9,
    type: 'Ground',
    flavor: 'The user kicks up a dust storm of hot sand, which may leave a burn.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Burn(inp, 0.3),
  },
  Scratch: {
    name: 'Scratch', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 1, criticalHit: 1, power: 0.6,
    flavor: 'The user attacks with its sharp claws.',
    aoe: 'Single Opponent', contact: true,
  },
  Screech: {
    name: 'Screech',
    accuracy: 0.85,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Normal',
    sound: true,
    flavor: 'The user emits a loud shriek, lowering the defense of the target.',
    aoe: 'Single Opponent', zMoveFx: 'AtkBuff1',
    onBeforeMove: noop,
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'defense', -2),
  },
  'Searing Shot': {
    name: 'Searing Shot', type: 'Fire',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.2, accuracy: 1, criticalHit: 1,
    flavor: 'The user unleashes a burst of fire, potentially burning the target.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Burn(inp, 0.3),
  },
  'Secret Power': {
    name: 'Secret Power',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.1,
    type: 'Normal',
    flavor: 'The user attacks with the power of the earth. The effect depends on where the user is.',
    aoe: 'Single Opponent',
    onAfterMove: (input) => {
      const {move, field} = input
      // eslint-disable-next-line @typescript-eslint/ban-types
      const terrainToEffectA: {[terrain in TerrainType]?: Function} = {
        Bay: AtkNerf,
        Beach: AtkNerf,
        Desert: SpeNerf, // No accuracy
        Oceanic: AtkNerf,
      }
      // eslint-disable-next-line @typescript-eslint/ban-types
      const terrainToEffectB: {[terrain in TerrainType]?: Function} = {
        Mountain: Flinch,
        Tropical: Sleep,
        Rural: Sleep,
        Grasslands: Sleep,
        Gardens: Sleep,
        Forest: Sleep,
        Urban: Paralyze,
        Rainforest: Sleep,
      }
      if (field.locationTerrain in terrainToEffectA) {
        const effect = terrainToEffectA[field.locationTerrain]
        return effect!(input.target, input, 0.25)
      } else if (field.locationTerrain in terrainToEffectB) {
        const effect = terrainToEffectB[field.locationTerrain]
        return effect!(input, 0.25)
      } else {
        move.failed = true
      }
    },
  },
  'Secret Sword': {
    name: 'Secret Sword', type: 'Fighting',
    attackKey: 'spAttack', defenseKey: 'defense',
    power: 1.05, accuracy: 1, criticalHit: 1,
    flavor: 'The user attacks using a traditional method. It does physical damage.',
    aoe: 'Single Opponent',
  },
  'Seed Bomb': {
    name: 'Seed Bomb',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.1,
    type: 'Grass',
    flavor: 'The target is pelted with seeds that detonate on impact.',
    aoe: 'Single Opponent',
  },
  'Seed Flare': {
    name: 'Seed Flare', type: 'Grass',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.4, accuracy: 0.85, criticalHit: 1,
    flavor: 'The user emits a shock wave that strikes the target. Their special defense may drop sharply.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => {
      if (Math.random() < 0.4) {
        return BUFF_STAT(inp.target, inp, 'spDefense', -2)
      }
      return new Log()
    }
  },
  'Seismic Toss': {
    name: 'Seismic Toss',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 1,
    type: 'Fighting', contact: true,
    flavor: 'The user throws the opponent. This move always does the same amount of damage.',
    aoe: 'Single Opponent',
    onBeforeMove: ({move}) => {
      move.power = 0
      return nop()
    },
    onAfterMove: (input) => {
      const {target} = input
      return applyStaticDamage(target, 100, input)
    }
  },
  'Self-Destruct': {
    name: 'Self-Destruct',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 2.2,
    type: 'Normal',
    flavor: 'The user blows up. It does devastating damage to all those nearby.',
    aoe: 'Everyone',
    onAfterMove: ({caster}) => {
      caster.currentHp = 0
      caster.fainted = true
      return new Log().add(`${caster.species} exploded!!`)
    }
  },
  'Shadow Ball': {
    name: 'Shadow Ball',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1,
    type: 'Ghost',
    flavor: 'The user attacks with an orb of spectral energy. It might lower the target\'s special defense.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => SpdNerf(inp.target, inp, 0.25),
  },
  'Shadow Bone': {
    name: 'Shadow Bone',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.05,
    type: 'Ghost',
    flavor: 'The user attacks with the power of a ghastly bone. Where did this bone come from?',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => DefNerf(inp.target, inp, 0.2)
  },
  'Shadow Claw': {
    name: 'Shadow Claw',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 2,
    power: 0.85,
    type: 'Ghost',
    flavor: 'The user slashes at the target with a spectral claw. Critical hits are more likely.',
    aoe: 'Single Opponent', contact: true,
  },
  'Shadow Force': {
    name: 'Shadow Force', type: 'Ghost',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.4, accuracy: 1, criticalHit: 1,
    flavor: 'The user disappears and then hits the target. This move will pentrate protective barriers.',
    aoe: 'Single Opponent', contact: true,
    // TODO Need to add protect break
    // onBeforeMove: (inp) => multiTurnOnBeforeMove(inp, 'AShadow', 'dissolved into the ground', 'appeared from the shadows!'),
    onBeforeMove: ({caster, target, move}) => {
      const ashadow = getCondition(caster, 'AShadow')
      if (!ashadow) {
        move.failed = true
        return APPLY_TEMP_STATUS(caster, ConditionMap.AShadow,
          `${caster.species} dissolved into the ground`)
      }
      if (getCondition(target, 'Protect')) {
        // Break through Protect
        removeCondition(target, 'Protect')
      }
      removeCondition(caster, 'AShadow') // Reset
      return new Log().add(`${caster.species} appeared from the shadows!`)
    },
    onAfterMove: (inp) => multiTurnOnAfterMove(inp, 'AShadow'),
  },
  'Shadow Punch': {
    name: 'Shadow Punch',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.9,
    type: 'Ghost',
    flavor: 'The user thrusts their fist with the power of shadows. This move always hits.',
    aoe: 'Single Opponent', contact: true,
  },
  'Shadow Sneak': {
    name: 'Shadow Sneak',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.6,
    type: 'Ghost',
    priority: 1,
    flavor: 'The user sneaks behind the target and strikes at them. This move always goes first.',
    aoe: 'Single Opponent', contact: true,
  },
  Sharpen: {
    name: 'Sharpen', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, criticalHit: 0, power: 0,
    aoe: 'Self', zMoveFx: 'AtkBuff1',
    flavor: 'The user sharpens its body to raise its attack.',
    onBeforeMove: noop,
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'attack', 1)
  },
  'Sheer Cold': {
    name: 'Sheer Cold', type: 'Ice',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    accuracy: 0.3, criticalHit: 1, power: Infinity,
    flavor: 'The user entombs the target in a glacier, immediately knocking them out.',
    aoe: 'Single Opponent',
    onBeforeMove: ohko,
  },
  'Shell Side Arm': {
    name: 'Shell Side Arm', type: 'Poison',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.1, accuracy: 1, criticalHit: 1,
    flavor: 'The user attacks with its arm, dealing special or physical damage. Targets may be left poisoned.',
    aoe: 'Single Opponent',
    onBeforeMove: ({target, move}) => {
      if (target.defense > target.spDefense) {
        move.defenseKey = 'defense'
        move.contact = true
      }
      return new Log()
    },
    onAfterMove: (inp) => Poison(inp, 0.2),
  },
  'Shell Smash': {
    name: 'Shell Smash',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Normal',
    flavor: 'The user breaks its defenses to boost its attack and speed sharply.',
    aoe: 'Self', zMoveFx: 'ResetStat',
    onAfterMove: (input) => {
      const log = new Log()
      log.push(BUFF_STAT(input.caster, input, 'defense', -1))
      log.push(BUFF_STAT(input.caster, input, 'spDefense', -1))
      log.push(BUFF_STAT(input.caster, input, 'attack', 2))
      log.push(BUFF_STAT(input.caster, input, 'spAttack', 2))
      log.push(BUFF_STAT(input.caster, input, 'speed', 2))
      return log
    }
  },
  /** To make this easier the damage calculation will be fixed */
  'Shell Trap': {
    name: 'Shell Trap', type: 'Fire',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    accuracy: 1, criticalHit: 1, power: 0, priority: 3,
    flavor: 'The user braces itself with fire. If it is struck, it will explode.',
    aoe: 'Self',
    onAfterMove: (inp) => APPLY_TEMP_STATUS(inp.caster, ConditionMap.ShellTrapped,
      `${inp.caster.species} laid a trap.`)
  },
  'Shelter': {
    name: 'Shelter',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Steel',
    flavor: 'The user withdraws into its shell, sharply raising defense.',
    aoe: 'Self',
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'defense', 2)
  },
  'Shift Gear': {
    name: 'Shift Gear', type: 'Steel',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0,
    flavor: 'The user grinds their gears in order to boost its attack and speed.',
    aoe: 'Self', zMoveFx: 'ResetStat',
    onAfterMove: (inp) => {
      const log = new Log()
      log.push(BUFF_STAT(inp.caster, inp, 'attack'))
      log.push(BUFF_STAT(inp.caster, inp, 'speed', 2))
      return log
    },
  },
  'Shock Wave': {
    name: 'Shock Wave',
    accuracy: Infinity,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.9,
    type: 'Electric',
    flavor: 'The user generates an arc of current between it and the target. This move always hits.',
    aoe: 'Single Opponent',
  },
  'Shore Up': {
    name: 'Shore Up', type: 'Ground', aoe: 'Self', recovery: true,
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: Infinity, zMoveFx: 'ResetStat',
    flavor: 'The user rebuilds. It rebuilds better in heavy sand.',
    onAfterMove: (inp) => {
      const {field, caster} = inp
      if (field.weather.name === 'Sandstorm') {
        return logHeal(caster, caster.totalHp * 0.67)
      }
      return logHeal(caster, caster.totalHp / 2)
    }
  },
  'Signal Beam': {
    name: 'Signal Beam',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.95,
    type: 'Bug',
    flavor: 'The user emits a sinister beam of light. The target might be confused by this.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Confuse(inp, 0.1),
  },
  'Silk Trap': {
    name: 'Silk Trap', type: 'Bug',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, power: 0, criticalHit: 0,
    priority: 4,
    aoe: 'Self', zMoveFx: 'DefBuff1',
    flavor: 'The user protects itself with spun silk. If the target strikes head-on, it will slow down.',
    onAfterMove: (inp) => APPLY_TEMP_STATUS(inp.caster, ConditionMap.ProtectSilky,
      `${inp.caster.species} protected itself`)
  },
  'Silver Wind': {
    name: 'Silver Wind',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.8,
    type: 'Bug',
    flavor: 'The user unleashes a wind with silver particles. All of their stats might raise.',
    aoe: 'Single Opponent',
    onAfterMove: BUFF_ALL
  },
  Sing: {
    name: 'Sing',
    accuracy: 0.55,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Normal',
    sound: true,
    flavor: 'The user begins to sing a lullaby. The target falls asleep.',
    aoe: 'Single Opponent', zMoveFx: 'SpdBuff1',
    onAfterMove: (inp) => Sleep(inp, 1),
  },
  'Skitter Smack': {
    name: 'Skitter Smack',
    accuracy: 0.9,
    attackKey: 'attack',
    defenseKey: 'defense',
    contact: true,
    criticalHit: 1,
    power: 0.9,
    type: 'Bug',
    flavor: "The user nips the target and skitters back. The target's special attack subsequently drops.",
    aoe: 'Single Opponent',
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'spAttack', -1)
  },
  'Skull Bash': {
    name: 'Skull Bash', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.5, accuracy: 1, criticalHit: 1,
    flavor: 'The user withdraws at first, then strikes with its head.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: (inp) => {
      const log = BUFF_STAT(inp.caster, inp, 'defense')
      log.push!(multiTurnOnBeforeMove(inp, 'SkullDrawn', 'drew its head back', 'shot forward!'))
      return log
    },
    onAfterMove: (inp) => multiTurnOnAfterMove(inp, 'SkullDrawn'),
  },
  'Sky Attack': {
    name: 'Sky Attack', type: 'Flying',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.6, accuracy: 0.9, criticalHit: 2,
    flavor: 'The user draws its wings in preparation and then strikes. Critical hits are more likely.',
    aoe: 'Single Opponent',
    onBeforeMove: (inp) => multiTurnOnBeforeMove(inp, 'SkyPrepared', 'drew its wings', 'attacked!'),
    onAfterMove: (inp) => {
      const log = multiTurnOnAfterMove(inp, 'SkyPrepared')
      log.push(Flinch(inp, 0.3))
      return log
    },
  },
  'Sky Drop': {
    name: 'Sky Drop', type: 'Flying',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.8, accuracy: 1, criticalHit: 1,
    flavor: 'The user takes the target up to the sky and then drops them, dealing a bit of damage.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: (inp) => {
      const {target, move} = inp
      if (target.weight > 200) {
        move.failed = true
        return new Log().add(`${target.species} is just too heavy to pick up!`)
      }
      const log = failsIfGravity(inp)
      log.push(multiTurnOnBeforeMove(inp, 'SkyDropping',
        `took ${target.species} to the sky`, 'dropped the opponent!'))
      return log
    },
    onAfterMove: (inp) => {
      const {move} = inp
      const target = move['canonicaltarget']
      const log = multiTurnOnAfterMove(inp, 'SkyDropping')
      if (move['turnone']) {
        log.push(APPLY_TEMP_STATUS(target, ConditionMap.Immobile, `${target.species} is in the sky. What?`))
      } else {
        removeCondition(target, 'Immobile')
      }
      return log
    }
  },
  'Sky Uppercut': {
    name: 'Sky Uppercut',
    accuracy: 0.9,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.05,
    type: 'Fighting',
    flavor: 'The user strikes upwards.',
    aoe: 'Single Opponent', contact: true,
    // TODO Can hit 'Fly' pkmn
  },
  'Slack Off': {
    name: 'Slack Off', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, criticalHit: 0, power: 0,
    aoe: 'Self', recovery: true, zMoveFx: 'ResetStat',
    flavor: 'The user rests a moment, healing itself.',
    onAfterMove: ({caster}) => logHeal(caster, caster.totalHp/2)
  },
  Slam: {
    name: 'Slam', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 0.75, criticalHit: 1, power: 1,
    flavor: 'The user strikes at the target with its appendage.',
    aoe: 'Single Opponent', contact: true,
  },
  'Slash': {
    name: 'Slash',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 2,
    power: 0.85,
    type: 'Normal',
    flavor: 'The user strikes at the target with sharp claws.',
    aoe: 'Single Opponent', contact: true,
  },
  'Sleep Powder': {
    name: 'Sleep Powder',
    accuracy: 0.75,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Grass',
    flavor: 'The user unleashes a sweet pollen that puts the target to sleep.',
    aoe: 'Single Opponent', zMoveFx: 'SpdBuff1',
    onBeforeMove: ({target, move}) => {
      if (target.type1 === 'Grass' || target.type2 === 'Grass') {
        move.accuracy = 0
        move.failed = true
      }
      if (target.heldItemKey === 'safetygoggles') {
        move.failed = true
        return new Log().add(`The goggles protected ${target.species}`)
      }
      return new Log()
    },
    onAfterMove: (inp) => Sleep(inp, 1)
  },
  Sludge: {
    name: 'Sludge',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.85,
    type: 'Poison',
    flavor: 'The user attacks with a toxic sludge which may leave the target with poison.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Poison(inp, 0.3),
  },
  'Sludge Bomb': {
    name: 'Sludge Bomb',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.1,
    type: 'Poison',
    flavor: 'The user hurls an orb of toxic garbage at the target, potentially poisoning them.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Poison(inp, 0.3),
  },
  'Sludge Wave': {
    name: 'Sludge Wave', type: 'Poison',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.15, accuracy: 1, criticalHit: 1,
    flavor: 'The user spits out sludge everywhere around it. Those hit might be poisoned.',
    aoe: 'Everyone',
    onAfterMove: (inp) => Poison(inp, 0.1),
  },
  'Smack Down': {
    name: 'Smack Down', type: 'Rock',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.7, accuracy: 1, criticalHit: 1,
    flavor: 'The user hits the target in the head with a boulder. Those in the air fall to the ground.',
    aoe: 'Single Opponent',
    onBeforeMove: ({target, move}) => {
      const log = new Log()
      if (getCondition(target, 'InAir')) {
        log.add(`${target.species} fell out of the air`)
        removeCondition(target, 'InAir')
        move.accuracy = Infinity
      }
      if (getCondition(target, 'Bouncing')) {
        log.add(`${target.species} fell out of the air`)
        removeCondition(target, 'Bouncing')
        move.accuracy = Infinity
      }
      if (getCondition(target, 'SkyDropping')) {
        move.accuracy = Infinity
      }
      return log
    },
    onAfterMove: ({target}) => {
      const log = new Log()
      if (target.type1 === 'Flying' || target.type2 === 'Flying') {
        APPLY_TEMP_STATUS(target, ConditionMap.Grounded, `${target.species} landed.`)
      }
      return log
    },
  },
  'Smart Strike': {
    name: 'Smart Strike',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.9,
    type: 'Steel',
    flavor: 'The user attacks the target deftly. This move never misses.',
    aoe: 'Single Opponent', contact: true
  },
  'Smelling Salts': {
    name: 'Smelling Salts',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.9,
    type: 'Normal',
    flavor: 'The target is smacked with odorous salt. If they are paralyzed, this attack hurts more.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({target, move}) => {
      if (target.status?.name === 'Paralyzed') {
        move.power *= 2
      }
      return new Log()
    },
    onAfterMove: ({target}) => {
      if (target.status?.name === 'Paralyzed') {
        target.status = undefined
        return new Log().add(`${target.species} is no longer paralyzed!`)
      }
      return new Log()
    }
  },
  Smog: {
    name: 'Smog',
    accuracy: 0.7,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.5,
    type: 'Poison',
    flavor: 'The user blows out toxic gas, potentially poisoning the target.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Poison(inp, 0.4),
  },
  Smokescreen: {
    name: 'Smokescreen', type: 'Poison', aoe: 'Single Opponent',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: 1, zMoveFx: 'EvaBuff1',
    flavor: `The user blows thick clouds in the target's face, dropping their accuracy.`,
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'accuracy', -1)
  },
  'Snap Trap': {
    name: 'Snap Trap', type: 'Grass',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 1, criticalHit: 1, power: 0.55,
    flavor: 'The user traps the target in a sharp trap for several turns.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => {
      const status = {...ConditionMap.Bound}
      if (['bindingband', 'gripclaw'].includes(inp.caster.heldItemKey ?? '')) {
        status.p = {longer: true}
      }
      return APPLY_TEMP_STATUS(inp.target, status,
        `${inp.target.species} became trapped in a large trap!`)
    },
  },
  Snarl: {
    name: 'Snarl',
    accuracy: 0.95,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.75,
    type: 'Dark',
    sound: true,
    flavor: 'The user lets out a loud growl. It lowers the special attack of those who hear it.',
    aoe: 'Nearby Opponents',
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'spAttack', -1)
  },
  'Snipe Shot': {
    name: 'Snipe Shot', type: 'Water',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1, accuracy: 1, criticalHit: 2,
    flavor: 'The user places a carefully targeted shot, striking its target with a high likelihood of critical hits.',
    aoe: 'Single Opponent',
    onBeforeMove: ({targetPrefix, field}) => {
      field.sides[targetPrefix].target = undefined
      return new Log()
    }
  },
  Snore: {
    name: 'Snore',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.25,
    type: 'Normal',
    sound: true,
    flavor: 'If asleep, the user emits a loud noise.',
    aoe: 'Single Opponent',
    onBeforeMove: ({caster, move}) => {
      if (caster.status?.name !== 'Asleep') {
        move.failed = true
      }
      return new Log()
    },
  },
  'Snowscape': {
    name: 'Snowscape',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Ice',
    flavor: 'The user conjurs a snowstorm onto the field. This helps Ice-types in defending themselves in battle.',
    aoe: 'Self', zMoveFx: 'SpdBuff1',
    onAfterMove: ({field}) => {
      const log = new Log()
      field.weather = {...Weathers['Snowscape']}
      log.add('A light snow began falling.')
      return log
    }
  },
  Soak: {
    name: 'Soak', type: 'Water',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: 1, criticalHit: 0,
    flavor: 'The target is drenched in so much water they literally become a Water-type.',
    aoe: 'Single Opponent', zMoveFx: 'SpAtkBuff1',
    onBeforeMove: noop,
    onAfterMove: ({target}) => {
      const log = new Log()
      target.type1 = 'Water'
      target.type2 = undefined
      log.add(`${target.species} became a Water-type!`)
      return log
    }
  },
  'Soft-Boiled': {
    name: 'Soft-Boiled', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, criticalHit: 0, power: 0,
    aoe: 'Self', recovery: true, zMoveFx: 'ResetStat',
    flavor: 'The user consumes a healthy snack, healing itself.',
    onAfterMove: ({caster}) => logHeal(caster, caster.totalHp/2)
  },
  'Solar Beam': {
    name: 'Solar Beam',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.4,
    type: 'Grass',
    flavor: 'The user draws in light and then attacks with energy from the sun.',
    aoe: 'Single Opponent',
    onBeforeMove: ({caster, move, field}) => {
      const log = new Log()
      const hasPowerHerb = caster.heldItemKey === 'powerherb' && !caster.heldItemConsumed
      if (field.weather.name !== 'Heat Wave') {
        const charging = getCondition(caster, 'Charging')
        if (!charging && !hasPowerHerb) {
          move.failed = true
          return log.push(APPLY_TEMP_STATUS(caster, ConditionMap.Charging,
            `${caster.species} began absorbing light`))
        } else if (hasPowerHerb) {
          log.add(`${caster.species} powered up with the Power Herb`)
          caster.heldItemConsumed = true
          caster.heldItemTotallyConsumed = true
        }
      }
      removeCondition(caster, 'Charging') // Reset
      if (field.weather.name === 'Sandstorm' ||
          field.weather.name === 'Hail' ||
          field.weather.name === 'Fog' ||
          field.weather.name === 'Rain') {
        move.power /= 2
      }
      return new Log().add('The solar light burst forward!')
    },
  },
  'Solar Blade': {
    name: 'Solar Blade',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.45,
    type: 'Grass', contact: true,
    flavor: 'The user draws in light and then attacks with energy from the sun.',
    aoe: 'Single Opponent',
    onBeforeMove: ({caster, move, field}) => {
      // Same as Solar Beam
      // TODO: Move Selection behavior
      const log = new Log()
      const hasPowerHerb = caster.heldItemKey === 'powerherb' && !caster.heldItemConsumed
      if (field.weather.name !== 'Heat Wave') {
        const charging = getCondition(caster, 'Charging')
        if (!charging && !hasPowerHerb) {
          move.failed = true
          return log.push(APPLY_TEMP_STATUS(caster, ConditionMap.Charging,
            `${caster.species} began absorbing light`))
        } else if (hasPowerHerb) {
          log.add(`${caster.species} powered up with the Power Herb`)
          caster.heldItemConsumed = true
          caster.heldItemTotallyConsumed = true
        }
      }
      removeCondition(caster, 'Charging') // Reset
      if (field.weather.name === 'Sandstorm' ||
          field.weather.name === 'Hail' ||
          field.weather.name === 'Fog' ||
          field.weather.name === 'Rain') {
        move.power /= 2
      }
      return new Log().add('The solar light burst forward!')
    },
  },
  'Sonic Boom': {
    name: 'Sonic Boom',
    accuracy: 0.9,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1,
    type: 'Normal',
    flavor: 'The user emits a sudden auditory burst. This move always does the same amount of damage.',
    aoe: 'Single Opponent',
    onBeforeMove: ({move}) => {
      move.power = 0
      return nop()
    },
    onAfterMove: (input) => {
      const {target} = input
      return applyStaticDamage(target, 20, input)
    }
  },
  'Spacial Rend': {
    name: 'Spacial Rend', type: 'Dragon',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.1, accuracy: 0.95, criticalHit: 2,
    flavor: 'The user strikes by bending the fabric of space around the target. Critical hits are more likely.',
    aoe: 'Single Opponent',
  },
  Spark: {
    name: 'Spark',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.85,
    type: 'Electric',
    flavor: 'The user tackles the target with electrical energy. The target may become paralyzed.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => Paralyze(inp, 0.3),
  },
  'Sparkling Aria': {
    name: 'Sparkling Aria',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.1,
    type: 'Water',
    flavor: 'The user emits an operatic bubble, popping at everyone. Burned targets will find themselves healed.',
    aoe: 'Everyone', sound: true,
    onAfterMove: (inp) => {
      if (getCondition(inp.target, 'Burn')) {
        removeCondition(inp.target, 'Burn')
        return new Log().add(`${inp.target.species} is no longer burned`)
      }
      return new Log()
    }
  },
  'Spectral Thief': {
    name: 'Spectral Thief', type: 'Ghost',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 1, criticalHit: 1, power: 1.1,
    contact: true, aoe: 'Single Opponent',
    flavor: "The user steals the target's stat boosts. Then it strikes.",
    onBeforeMove: (inp) => {
      const {caster, target} = inp
      for (const [stat, value] of Object.entries(target.statBuffs)) {
        if (value > 0) {
          caster.statBuffs[stat] = value
        }
      }
      return new Log()
    }
  },
  'Speed Swap': {
    name: 'Speed Swap',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Psychic',
    flavor: 'The user swaps its speed stat with the target.',
    aoe: 'Single Opponent', zMoveFx: 'SpdBuff1',
    onBeforeMove: ({target, move}) => {
      if (getCondition(target, 'Raid')) {
        move.failed = true
        return new Log().add('But it failed...')
      }
      return new Log()
    },
    onAfterMove: ({caster, target}) => {
      const casterSpd = caster.speed
      caster.speed = target.speed
      target.speed = casterSpd
      const log = new Log()
      log.add(`${caster.species} and ${target.species} swapped their Speed stats`)
      return log
    }
  },
  'Spicy Extract': {
    name: 'Spicy Extract', type: 'Grass',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: Infinity,
    aoe: 'Single Opponent',
    flavor: 'The user spits spicy dust at the target. Their attack will raise dramatically but their defense will drop dramatically.',
    onAfterMove: (inp) => {
      const log = new Log()
      log.push(BUFF_STAT(inp.target, inp, 'attack', 2))
      log.push(BUFF_STAT(inp.target, inp, 'defense', -2))
      return log
    }
  },
  'Spider Web': {
    name: 'Spider Web', type: 'Bug',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: Infinity, aoe: 'Single Opponent',
    flavor: 'The target gets covered in sticky silk that leaves them unable to flee.',
    onBeforeMove: noop,
    onAfterMove: ({target}) => {
      return APPLY_TEMP_STATUS(target, ConditionMap.TrappedInBattle,
        `${target.species} is trapped in the battle.`)
    }
  },
  'Spike Cannon': {
    name: 'Spike Cannon',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.8,
    type: 'Normal',
    flavor: 'The user quickly fires darts from the spikes on its body.',
    aoe: 'Single Opponent',
    onBeforeMove: ({move}) => HIT_MANY(move, 0.3, 2, 5),
  },
  Spikes: {
    name: 'Spikes', type: 'Ground',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, power: 0, criticalHit: 0,
    aoe: 'Single Opponent',
    flavor: 'The user lays a layer of spikes on the opposing side of the field.',
    onBeforeMove: ({move, field, targetPrefix}) => {
      if (field.sides[targetPrefix].spikes >= 3) {
        move.failed = true
        return new Log().add('The move failed...')
      }
      move.type = 'Status'
      return new Log()
    },
    onAfterMoveOnce: ({field, targetPrefix}) => {
      field.sides[targetPrefix].spikes++
      return new Log().add(`Spikes scattered on the field.`)
    }
  },
  'Spiky Shield': {
    name: 'Spiky Shield', type: 'Grass',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, power: 0, criticalHit: 0,
    priority: 4,
    aoe: 'Self', zMoveFx: 'DefBuff1',
    flavor: 'The user protects itself with its spines. If the target strikes head-on, it will take damage.',
    onAfterMove: (inp) => APPLY_TEMP_STATUS(inp.caster, ConditionMap.ProtectSpiky,
      `${inp.caster.species} protected itself`)
  },
  'Spin Out': {
    name: 'Spin Out', type: 'Steel',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.2, accuracy: 1, criticalHit: 1,
    aoe: 'Single Opponent', contact: true,
    flavor: 'The user rushes forward in a spinning tackle. They side-swipe the target and as a result loses speed.',
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'speed', -2),
  },
  'Spirit Break': {
    name: 'Spirit Break', type: 'Fairy',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.95, accuracy: 1, criticalHit: 1,
    aoe: 'Single Opponent', contact: true,
    flavor: 'The user strikes the target with a spirit-breaking tackle. This lowers their special attack.',
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'spAttack', -1),
  },
  'Spirit Shackle': {
    name: 'Spirit Shackle',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Ghost',
    flavor: 'The user draws back an arrow with a ghastly spirit. The target is then hit and trapped in its place.',
    aoe: 'Single Opponent',
    onAfterMove: ({target}) => {
      return APPLY_TEMP_STATUS(target, ConditionMap.TrappedInBattle,
        `${target.species} is trapped in the battle.`)
    }
  },
  'Spit Up': {
    name: 'Spit Up', type: 'Normal',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 0.2, accuracy: 1, criticalHit: 1,
    aoe: 'Single Opponent',
    flavor: 'The user throws up its Stockpile upon the target.',
    onBeforeMove: (inp) => {
      const status = getCondition(inp.caster, 'Stockpiling')
      if (!status) {
        inp.move.failed = true
        return new Log().add('There is no stockpile to release')
      }
      const {stockpile} = status.p!
      inp.move.power += stockpile!
      return new Log()
    },
    onAfterMove: (inp) => {
      const status = getCondition(inp.caster, 'Stockpiling')!
      const stockpile = status.p!.stockpile!
      status.p!.stockpile = 0
      const log = new Log()
      log.push(BUFF_STAT(inp.caster, inp, 'defense', -stockpile))
      log.push(BUFF_STAT(inp.caster, inp, 'spDefense', -stockpile))
      return log
    }
  },
  Splash: {
    name: 'Splash',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 1,
    type: 'Normal',
    flavor: 'The user splashes around. Nobody knows why.',
    aoe: 'Self', zMoveFx: 'AtkBuff3',
    onBeforeMove: (inp) => {
      // Do this to allow it to override Normal-type moves.
      inp.move.power = 0
      return failsIfGravity(inp)
    },
    onAfterMove: () => {
      return new Log().add('Nothing happened')
    }
  },
  Spore: {
    name: 'Spore',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Grass',
    flavor: 'The user emits an aromatic pollen that puts the target to sleep.',
    aoe: 'Single Opponent', zMoveFx: 'ResetStat',
    onBeforeMove: (inp) => {
      const l = new Log()
      if (inp.target.heldItemKey === 'safetygoggles') {
        inp.move.failed = true
        l.add('It failed...')
      }
      if (inp.target.type1 === 'Grass' || inp.target.type2 === 'Grass') {
        inp.move.failed = true
        l.add('It failed...')
      }
      return l
    },
    onAfterMove: (inp) => Sleep(inp, 1),
  },
  'Spotlight': {
    name: 'Spotlight', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, power: 0, criticalHit: 0, aoe: 'Single Opponent',
    flavor: 'Makes target the center of attention with a dazzling light.',
    onBeforeMove: noop,
    onAfterMove: ({target, targetPrefix, field}) => {
      field.sides[targetPrefix].target = target
      return new Log().add(`${targetPrefix} ${target.species} became the center of attention`)
    }
  },
  'Springtide Storm': {
    name: 'Springtide Storm', type: 'Fairy',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.2, accuracy: 0.8, criticalHit: 1,
    aoe: 'Nearby Opponents',
    flavor: 'The user unleashes a fierce wind with emotional love and hate. The target attack drops after.',
    onAfterMove: (inp) => {
      return BUFF_STAT(inp.target, inp, 'attack', -1)
    }
  },
  'Stealth Rock': {
    name: 'Stealth Rock', type: 'Rock',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, power: 0, criticalHit: 0,
    aoe: 'Single Opponent',
    flavor: 'The user fires out sharp rocks onto the opposing side of the field.',
    onBeforeMove: ({move, field, targetPrefix}) => {
      if (field.sides[targetPrefix].stealthRock) {
        move.failed = true
        return new Log().add('The move failed...')
      }
      move.type = 'Status'
      return new Log()
    },
    onAfterMove: ({field, targetPrefix}) => {
      field.sides[targetPrefix].stealthRock = true
      return new Log().add('Pointed rocks landed on the field')
    }
  },
  'Steam Eruption': {
    name: 'Steam Eruption',
    accuracy: 0.95,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.3,
    type: 'Water',
    flavor: 'The user unleashes a burst of piping hot water, which might even burn the target.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Burn(inp, 0.3),
  },
  'Steamroller': {
    name: 'Steamroller', type: 'Bug',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.85, accuracy: 1, criticalHit: 1,
    flavor: 'The user rolls over the target, potentially flinching them.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => Flinch(inp, 0.3),
  },
  'Steel Beam': {
    name: 'Steel Beam',
    accuracy: 0.95,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.6,
    type: 'Steel',
    flavor: 'A burst of steel is launched at the target. The steel comes from the caster, so it takes some damage.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => logDamage(inp.caster, inp.caster.totalHp / 2, true),
  },
  'Steel Roller': {
    name: 'Steel Roller', type: 'Steel',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.5, accuracy: 1, criticalHit: 1,
    flavor: 'This attack will dig up all terrain and deal damage.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({move, field}) => {
      if (field.terrain === undefined) {
        move.failed = true
        return new Log().add('There is no terrain...')
      }
      return new Log()
    },
    onAfterMove: ({field}) => {
      field.terrain = undefined
      return new Log().add('The terrain was dug up!')
    }
  },
  'Steel Wing': {
    name: 'Steel Wing',
    accuracy: 0.9,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.9,
    type: 'Steel',
    flavor: 'The user flies past the target with reinforced wings.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => DefBuff(inp.caster, inp, 0.1)
  },
  'Sticky Web': {
    name: 'Sticky Web', type: 'Bug',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, power: 0, criticalHit: 0,
    aoe: 'Single Opponent',
    flavor: 'The user shoots out a sticky webbing across the opposing side of the field.',
    onBeforeMove: ({move, field, targetPrefix}) => {
      if (field.sides[targetPrefix].stickyWeb) {
        move.failed = true
        return new Log().add('The move failed...')
      }
      move.type = 'Status'
      return new Log()
    },
    onAfterMove: ({field, targetPrefix}) => {
      field.sides[targetPrefix].stickyWeb = true
      return new Log().add('Long lines of webbing landed on the field')
    }
  },
  Stockpile: {
    name: 'Stockpile', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0,
    aoe: 'Self',
    flavor: 'The user builds up its stocks. Its defenses rise as well.',
    onBeforeMove: (inp) => {
      const status = getCondition(inp.caster, 'Stockpiling')
      if (status?.p?.stockpile !== undefined && status?.p?.stockpile >= 3) {
        inp.move.failed = true
        return new Log().add('The pile is as stocked as it is going to get.')
      }
      return new Log()
    },
    onAfterMove: (inp) => {
      const status = getCondition(inp.caster, 'Stockpiling')
      let sp = 1
      if (status) {
        status.p!.stockpile! += 1
        sp = status.p!.stockpile!
      } else {
        const stockpile = {...ConditionMap['Stockpiling']}
        stockpile.p = { stockpile: 1 }
        APPLY_TEMP_STATUS(inp.caster, stockpile)
      }
      const log = new Log()
      log.add(`${inp.caster.species} is stockpiling ${sp}`)
      log.push(BUFF_STAT(inp.caster, inp, 'defense', 1))
      log.push(BUFF_STAT(inp.caster, inp, 'spDefense', 1))
      return log
    }
  },
  Stomp: {
    name: 'Stomp',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.85,
    type: 'Normal',
    flavor: 'The user stomps the target with a large foot. They might flinch.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => Flinch(inp, 0.3),
  },
  'Stomping Tantrum': {
    name: 'Stomping Tantrum', type: 'Ground',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.95, accuracy: 1, criticalHit: 1,
    flavor: 'The user stamps the ground. If the previous move failed, the power doubles.',
    aoe: 'Single Opponent',
    onBeforeMove: ({caster, move}) => {
      if (getCondition(caster, 'PreviousMoveFailed')) {
        move.power *= 2
      }
      return new Log()
    }
  },
  'Stone Axe': {
    name: 'Stone Axe',
    accuracy: 0.9,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.85,
    type: 'Rock',
    flavor: 'The target is struck by a fulcrum with a stone at the end. Stone splinters are left behind afterwards.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => {
      inp.field.sides[inp.targetPrefix].stealthRock = true
      return new Log().add('Stone splinters fell on the field')
    }
  },
  'Stone Edge': {
    name: 'Stone Edge',
    accuracy: 0.8,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 2,
    power: 1.2,
    type: 'Rock',
    flavor: 'The target is smacked by rocks that come out of the earth. Critical hits are more likely.',
    aoe: 'Single Opponent',
  },
  'Stored Power': {
    name: 'Stored Power', type: 'Psychic',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 0.4, accuracy: 1, criticalHit: 1,
    flavor: 'The user emits a powerful telekinetic burst whose power depends on its stat buffs.',
    aoe: 'Single Opponent',
    onBeforeMove: ({caster, move}) => {
      let powerBoost = 0.4
      powerBoost += caster.statBuffs.attack * 0.2
      powerBoost += caster.statBuffs.spAttack * 0.2
      powerBoost += caster.statBuffs.defense * 0.2
      powerBoost += caster.statBuffs.spDefense * 0.2
      powerBoost += caster.statBuffs.speed * 0.2
      move.power = Math.min(powerBoost, 3)
      if (move.power <= 0) {
        return new Log().add('The move ran out of power and fizzled out.')
      }
      return new Log()
    },
  },
  'Storm Throw': {
    name: 'Storm Throw', type: 'Fighting',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.8, accuracy: 1, criticalHit: Infinity,
    flavor: 'The user grabs the target and throws them. This move always hits critically.',
    aoe: 'Single Opponent', contact: true,
  },
  'Strange Steam': {
    name: 'Strange Steam', type: 'Fairy',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.1, accuracy: 0.95, criticalHit: 1,
    aoe: 'Single Opponent',
    flavor: 'The user emits a strange sparkling gas which may confuse the target.',
    onAfterMove: (inp) => Confuse(inp, 0.2),
  },
  Strength: {
    name: 'Strength', type: 'Normal',
    power: 1, accuracy: 1, criticalHit: 1,
    attackKey: 'attack', defenseKey: 'defense',
    aoe: 'Single Opponent', contact: true,
    flavor: 'The user pushes with great force.',
  },
  'Strength Sap': {
    name: 'Strength Sap', type: 'Grass',
    power: 0, accuracy: 1, criticalHit: 0,
    attackKey: 'attack', defenseKey: 'defense',
    aoe: 'Single Opponent', zMoveFx: 'DefBuff1',
    flavor: 'The target is sapped of its attacking prowess. It heals the user.',
    onAfterMove: (inp) => {
      const log = BUFF_STAT(inp.target, inp, 'attack', -1)
      log.push(logHeal(inp.caster, inp.target.attack))
      return log
    }
  },
  'String Shot': {
    name: 'String Shot',
    accuracy: 0.95,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Bug',
    flavor: 'The target is covered in a sticky web. Their speed drops.',
    aoe: 'Single Opponent',
    zMoveFx: 'SpdBuff1',
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'speed', -1)
  },
  'Struggle': {
    name: 'Struggle', type: 'Status',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, criticalHit: 1, power: 0.5,
    flavor: 'The user fights with all it can do. It hurts itself too.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({caster}) => {
      const log = new Log()
      log.add(`${caster.species} has no usable moves.`)
      return log
    },
    onAfterMove: (inp) => {
      const {caster} = inp
      const rate = getCondition(inp.caster, 'Raid') ? 72 : 4
      const log = logDamage(caster, caster.totalHp / rate, true)
      log.add(`${caster.species} took damage in recoil`)
      return log
    }
  },
  'Struggle Bug': {
    name: 'Struggle Bug', type: 'Bug',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 0.7, accuracy: 1, criticalHit: 1,
    flavor: 'The user resists the target with bug power. The target\'s special attack drops.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'spAttack', -1)
  },
  'Stuff Cheeks': {
    name: 'Stuff Cheeks', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0,
    aoe: 'Self',
    flavor: `The user consumes its berry and boosts its defense.`,
    onBeforeMove: ({caster, move}) => {
      const log = new Log()
      if (!caster.heldItem) {
        log.add(`It failed...`)
        move.failed = true
      }
      const key = caster.heldItemKey!
      if (ITEMS[key].category !== 'berry') {
        log.add('It failed...')
        move.failed = true
      }
      if (caster.heldItemConsumed) {
        log.add('It failed...')
        move.failed = true
      }
      return log
    },
    onAfterMove: (inp) => {
      inp.caster.heldItemConsumed = true
      inp.caster.heldItemTotallyConsumed = true
      return new Log().push(BUFF_STAT(inp.caster, inp, 'defense', 2))
    }
  },
  'Stun Spore': {
    name: 'Stun Spore',
    accuracy: 0.75,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Grass',
    flavor: 'The user emits a foul-smelling powder that paralyzes whoever breathes it in.',
    aoe: 'Single Opponent', zMoveFx: 'SpDefBuff1',
    onBeforeMove: ({target, move}) => {
      if (target.type1 === 'Grass' || target.type2 === 'Grass') {
        move.accuracy = 0
        move.failed = true
      }
      if (target.heldItemKey === 'safetygoggles') {
        move.failed = true
        return new Log().add(`The goggles protected ${target.species}`)
      }
      return new Log()
    },
    onAfterMove: (inp) => Paralyze(inp, 1)
  },
  Submission: {
    name: 'Submission',
    accuracy: 0.8,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Fighting',
    flavor: 'The user tackles the target until they submit. The user is damaged too.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => RECOIL(inp, 4),
  },
  Substitute: {
    name: 'Substitute', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, criticalHit: 0, power: 0,
    flavor: 'The user creates a placeholder that can take damage.',
    aoe: 'Self', zMoveFx: 'ResetStat',
    onBeforeMove: ({caster, move}) => {
      const log = new Log()
      if (caster.currentHp <= caster.totalHp / 4) {
        log.add('The user is too weak...')
        move.failed = true
      }
      return log
    },
    onAfterMove: ({caster}) => {
      const log = new Log()
      log.push(logDamage(caster, caster.totalHp / 4))
      log.push(APPLY_TEMP_STATUS(caster, ConditionMap.Substituting,
        `${caster.species} stepped back and put in a substitute.`))
      return log
    },
  },
  'Sucker Punch': {
    name: 'Sucker Punch', type: 'Dark',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.9, accuracy: 1, criticalHit: 1, priority: 1,
    aoe: 'Single Opponent', contact: true,
    flavor: 'Before the target gets to make an attack, the user strikes first.',
    onBeforeMove: (inp) => {
      const targetMoveCondition = getCondition(inp.target, 'NextMove')
      if (!targetMoveCondition) {
        inp.move.failed = true
        return new Log().add('But it failed...')
      }
      const move = targetMoveCondition.p!.selectedMove!
      if (move.power === 0) {
        inp.move.failed = true
        return new Log().add('But it failed...')
      }
      return new Log()
    }
  },
  'Sunny Day': {
    name: 'Sunny Day',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Fire',
    flavor: 'The user draws the sun to the battlefield. Better put on your sunglasses, as it gets pretty bright and hot.',
    aoe: 'Self', zMoveFx: 'SpdBuff1',
    onAfterMove: ({field}) => {
      const log = new Log()
      field.weather = {...Weathers['Heat Wave']}
      log.add('The sky grew bright and warm.')
      return log
    }
  },
  'Sunsteel Strike': {
    name: 'Sunsteel Strike',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.2,
    type: 'Steel',
    flavor: 'The user attacks with a tackle formed by solar energy.',
    aoe: 'Single Opponent',
    contact: true,
  },
  "Super Fang": {
    name: "Super Fang", type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.01, accuracy: 0.9, criticalHit: 0,
    aoe: 'Single Opponent', contact: true,
    flavor: 'The user drives its sharp jaws into the target, delivering a halving blow.',
    onBeforeMove: ({target, move}) => {
      move.power = 0 // Zero out
      if (getCondition(target, 'Raid')) {
        move.failed = true
        return new Log().add('The move failed...')
      }
      return new Log()
    },
    onAfterMove: ({target}) => {
      return logDamage(target, target.currentHp / 2)
    }
  },
  Superpower: {
    name: 'Superpower',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.4,
    type: 'Fighting',
    flavor: 'The user strikes with a ton of force. Their attack and defense drop afterwards.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => {
      const log = new Log()
      log.push(BUFF_STAT(inp.caster, inp, 'attack', -1))
      log.push(BUFF_STAT(inp.caster, inp, 'defense', -1))
      return log
    }
  },
  Supersonic: {
    name: 'Supersonic',
    accuracy: 0.55,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Normal',
    flavor: 'The target hears a high-pitched screech which leaves them confused.',
    aoe: 'Single Opponent', zMoveFx: 'SpdBuff1',
    onAfterMove: (inp) => Confuse(inp, 1),
  },
  Surf: {
    name: 'Surf',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.1,
    type: 'Water',
    flavor: 'Everyone gets hit by a large tidal wave.',
    aoe: 'Everyone',
  },
  'Surging Strikes': {
    name: 'Surging Strikes', type: 'Water',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.95, criticalHit: Infinity, accuracy: 1,
    aoe: 'Single Opponent', contact: true,
    flavor: 'The user rushes forward to attack the foe in three rapid strikes, always resulting in a critical hit.',
  },
  Synthesis: {
    name: 'Synthesis', type: 'Grass', aoe: 'Self', recovery: true,
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: Infinity, zMoveFx: 'ResetStat',
    flavor: `The user repairs damage with photosynthesis. The amount healed depends on the sun's strength.`,
    onAfterMove: (inp) => {
      return weatherDependentHeal(inp)
    }
  },
  'Syrup Bomb': {
    name: 'Syrup Bomb',
    accuracy: 0.85,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.8,
    type: 'Grass',
    flavor: 'Sticky caramel is unleashed at the opponent. As long as they are stuck in syrup, they lose speed each turn.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => {
      return APPLY_TEMP_STATUS(inp.target, {...ConditionMap['Syruped']},
        `${inp.target.species} got sticky`)
    },
  },
  Swagger: {
    name: 'Swagger',
    accuracy: 0.85,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Normal',
    flavor: 'The user taunts the target, boosting the target\'s attack but leaving them confused.',
    aoe: 'Single Opponent', zMoveFx: 'ResetStat',
    onAfterMove: (inp) => {
      const log = new Log()
      log.push(BUFF_STAT(inp.target, inp, 'attack', 2))
      log.push(Confuse(inp, 1))
      return log
    }
  },
  'Swallow': {
    name: 'Swallow', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0,
    aoe: 'Self', recovery: true,
    flavor: 'The user swallows its Stockpile and heals itself.',
    onBeforeMove: (inp) => {
      const status = getCondition(inp.caster, 'Stockpiling')
      if (!status) {
        inp.move.failed = true
        return new Log().add('There is no stockpile to swallow')
      }
      return new Log()
    },
    onAfterMove: (inp) => {
      const status = getCondition(inp.caster, 'Stockpiling')!
      const stockpile = status.p!.stockpile!
      status.p!.stockpile = 0
      const log = new Log()
      const ratio = [8, 4, 2, 1]
      log.push(logHeal(inp.caster, inp.caster.totalHp / ratio[stockpile]))
      log.push(BUFF_STAT(inp.caster, inp, 'defense', -stockpile))
      log.push(BUFF_STAT(inp.caster, inp, 'spDefense', -stockpile))
      return log
    }
  },
  'Sweet Kiss': {
    name: 'Sweet Kiss',
    accuracy: 0.75,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Fairy',
    flavor: 'The user blows a strange kiss at the target, confusing them.',
    aoe: 'Single Opponent', zMoveFx: 'SpAtkBuff1',
    onAfterMove: (inp) => Confuse(inp, 1),
  },
  'Sweet Scent': {
    name: 'Sweet Scent', type: 'Normal', aoe: 'Nearby Opponents',
    power: 0, criticalHit: 0, accuracy: 1,
    attackKey: 'attack', defenseKey: 'defense', zMoveFx: 'AccBuff1',
    flavor: 'A sweet aroma lofts through the air, lowering the evasiness of those stopping to smell the roses.',
    onAfterMove: (inp) => {
      return BUFF_STAT(inp.target, inp, 'evasiveness', -2)
    }
  },
  Swift: {
    name: 'Swift',
    accuracy: Infinity,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.8,
    type: 'Normal',
    flavor: 'The user attacks with mystical stars. They never miss their mark.',
    aoe: 'Nearby Opponents',
  },
  Switcheroo: {
    name: 'Switcheroo',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Dark',
    flavor: 'The user tricks the target and swaps items.',
    aoe: 'Single Opponent',
    zMoveFx: 'SpdBuff2',
    onBeforeMove: noop,
    onAfterMove: ({caster, target}) => {
      const casterHeldItem = caster.heldItem
      const casterHeldItemConsumed = caster.heldItemConsumed
      caster.heldItem = target.heldItem
      caster.heldItemConsumed = target.heldItemConsumed
      target.heldItem = casterHeldItem
      target.heldItemConsumed = casterHeldItemConsumed
      APPLY_TEMP_STATUS(caster, ConditionMap.Switcherooed)
      APPLY_TEMP_STATUS(target, ConditionMap.Switcherooed)
      const log = new Log()
      log.add(`${caster.species} swapped items with ${target.species}`)
      return log
    }
  },
  'Swords Dance': {
    name: 'Swords Dance',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Normal',
    flavor: 'The user focuses their striking power and sharply raises their attack.',
    aoe: 'Self', zMoveFx: 'ResetStat',
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'attack', 2)
  },
  Synchronoise: {
    name: 'Synchronoise', type: 'Psychic',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    criticalHit: 1, accuracy: 1, power: 1.5,
    flavor: 'If the target and the user share a type, the target is hit by a devastating amount of damage.',
    aoe: 'Single Opponent',
    onBeforeMove: (inp) => {
      const log = new Log()
      const casterTypes = [inp.caster.type1, inp.caster.type2].filter(Boolean);
      const targetTypes = [inp.target.type1, inp.target.type2].filter(Boolean);
      if (!casterTypes.some((type) => targetTypes.includes(type))) {
        log.add('Synchronoise had no effect...')
        inp.move.failed = true;
      }
      return log;
    },
    onAfterMove: nop,
  },
  Tackle: {
    name: 'Tackle',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.6,
    type: 'Normal',
    flavor: 'The user rams into the target at a slow speed.',
    aoe: 'Single Opponent', contact: true,
  },
  Tailwind: {
    name: 'Tailwind', type: 'Flying',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0,
    flavor: 'The user starts a wind behind their backs. Their allies get a speed boost.',
    aoe: 'Self', zMoveFx: 'CriticalHit',
    onBeforeMove: noop,
    onAfterMove: ({caster, prefix, field}) => {
      const log = new Log()
      log.add(`${caster.species} kicked up a tailwind behind them.`)
      field.sides[prefix].tailwind = 5
      return log
    }
  },
  'Tail Glow': {
    name: 'Tail Glow',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Bug',
    flavor: `The user's tail emits a bright light. Their special attack raises dramatically.`,
    aoe: 'Self', zMoveFx: 'ResetStat',
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'spAttack', 3),
  },
  'Tail Slap': {
    name: 'Tail Slap', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 0.85, criticalHit: 1, power: 1,
    flavor: 'The user smacks the target with their tail a few times in succession.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({move}) => HIT_MANY(move, 0.3, 2, 5),
  },
  'Tail Whip': {
    name: 'Tail Whip',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Normal',
    flavor: 'The user smacks the targets with its tail. Their defense drops.',
    aoe: 'Nearby Opponents', zMoveFx: 'AtkBuff1',
    onBeforeMove: noop,
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'defense', -1),
  },
  'Take Down': {
    name: 'Take Down',
    accuracy: 0.85,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.1,
    type: 'Normal',
    flavor: 'The user charges at the target recklessly. They take damage too.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => RECOIL(inp, 4),
  },
  'Take Heart': {
    name: 'Take Heart', type: 'Psychic',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0,
    aoe: 'Self',
    flavor: 'The user cures its status conditions and boosts special stats.',
    onAfterMove: (inp) => {
      const log = new Log()
      removeCondition(inp.caster, 'PoisonBad')
      if (inp.caster.status?.name === 'Burn') {
        log.add(`${inp.caster.species} is no longer burned`)
      }
      if (inp.caster.status?.name === 'Paralyzed') {
        log.add(`${inp.caster.species} is no longer paralyzed`)
      }
      if (inp.caster.status?.name === 'Poison') {
        log.add(`${inp.caster.species} is no longer poisoned`)
      }
      inp.caster.status = undefined
      log.push(BUFF_STAT(inp.caster, inp, 'spAttack', 1))
      log.push(BUFF_STAT(inp.caster, inp, 'spDefense', 1))
      return log
    }
  },
  'Tar Shot': {
    name: 'Tar Shot', type: 'Rock', aoe: 'Single Opponent',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: 1, criticalHit: 0,
    flavor: 'The opponent is struck by hot tar, slowing them down. Fire-type moves will be more damaging.',
    onAfterMove: (inp) => {
      const log = new Log()
      log.push(BUFF_STAT(inp.target, inp, 'speed', -1))
      log.push(APPLY_TEMP_STATUS(inp.target, ConditionMap.Tarred,
        `${inp.target.species} was covered in a hot sticky tar.`))
      return log
    }
  },
  Taunt: {
    name: 'Taunt', type: 'Dark', aoe: 'Single Opponent',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: 1, zMoveFx: 'AtkBuff1',
    flavor: 'The opponent is insulted and can no longer use support moves.',
    onAfterMove: (inp) => APPLY_TEMP_STATUS(inp.target, ConditionMap.Taunted,
      `${inp.target.species} fell for the taunt!`)
  },
  'Tearful Look': {
    name: 'Tearful Look',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Normal',
    flavor: "The user's eyes grow moist, lowering the attacking stats of the target.",
    aoe: 'Single Opponent', zMoveFx: 'DefBuff1',
    onAfterMove: (inp) => {
      const log = BUFF_STAT(inp.target, inp, 'attack', -1)
      log.push(BUFF_STAT(inp.target, inp, 'spAttack', -1))
      return log
    },
  },
  Teatime: {
    name: 'Teatime', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: Infinity,
    aoe: 'Everyone',
    flavor: 'The battle is temporarily paused while everyone drinks tea and eats their berries.',
    onAfterMove: ({target}) => {
      if (!target.heldItem) {
        return new Log()
      }
      const key = target.heldItemKey!
      if (ITEMS[key].category !== 'berry') {
        return new Log()
      }
      if (target.heldItemConsumed) {
        return new Log()
      }
      target.heldItemConsumed = true
      target.heldItemTotallyConsumed = true
      return new Log().add(`${target.species} consumed their berry`)
    },
  },
  'Techno Blast': {
    name: 'Techno Blast', type: 'Normal',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.4, accuracy: 1, criticalHit: 1,
    flavor: 'The user emits a burst of elemental energy. The type of this move depends.',
    aoe: 'Single Opponent',
    onGetType: (caster, __, move) => {
      if (!caster.heldItemKey) return 'Normal'
      const heldItem = caster.heldItemKey
      const itemToType: Partial<Record<ItemId, Type>> = {
        'shockdrive': 'Electric',
        'burndrive': 'Fire',
        'chilldrive': 'Ice',
        'dousedrive': 'Water',
      }
      if (itemToType[heldItem]) {
        move.type = itemToType[heldItem]!
      }
      return move.type
    },
    onAfterMove: nop,
  },
  'Teeter Dance': {
    name: 'Teeter Dance',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Normal',
    flavor: 'The user begins dancing erratically. It seems fun, so nearby Pokémon join it. They become confused.',
    aoe: 'Everyone', zMoveFx: 'SpAtkBuff1',
    onBeforeMove: noop,
    onAfterMove: (inp) => Confuse(inp, 1),
  },
  Telekinesis: {
    name: 'Telekinesis', type: 'Psychic',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, criticalHit: 0, power: 0,
    flavor: 'The target begins to hover helplessly in the air, making them vulnerable to attacks.',
    aoe: 'Single Opponent', zMoveFx: 'SpAtkBuff1',
    onBeforeMove: (inp) => {
      noop(inp)
      if (['Sandygast', 'Pallosand', 'Diglett', 'Dugtrio'].includes(inp.target.species)) {
        inp.move.failed = true
        return new Log().add(`${inp.target.species} cannot float`)
      }
      return failsIfGravity(inp)
    },
    onAfterMove: ({target}) => {
      return APPLY_TEMP_STATUS(target, ConditionMap.FloatUnintentional, `${target.species} started floating`)
    }
  },
  'Teleport': {
    name: 'Teleport', type: 'Psychic',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, criticalHit: 0, power: 0,
    flavor: "The user focuses their telekinetic energy and returns to its trainer's PokéBall.",
    aoe: 'Self', priority: -6,
    onBeforeMove: ({caster, move}) => {
      move.type = 'Status'
      if (getCondition(caster, 'TrappedInBattle')) {
        move.failed = true
        return new Log().add('But it failed...')
      }
      return new Log()
    },
    onAfterMove: (inp) => {
      return APPLY_TEMP_STATUS(inp.caster, {...ConditionMap['SwitchOut']},
        `${inp.caster.species} noped out of there!`)
    },
  },
  'Tera Blast': {
    name: 'Tera Blast', type: 'Normal',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1, accuracy: 1, criticalHit: 1,
    aoe: 'Single Opponent',
    flavor: 'The user draws upon tera crystals to launch a strong attack.',
    onGetType: (caster) => {
      const status = getCondition(caster, 'Terastalized')
      if (status) {
        return status.p!.type!
      }
      return 'Normal'
    },
    onBeforeMove: (inp) => {
      if (inp.caster.attack > inp.caster.spAttack) {
        // Swap
        inp.move.attackKey = 'attack'
        inp.move.defenseKey = 'defense'
      }
      return new Log()
    }
  },
  'Terrain Pulse': {
    name: 'Terrain Pulse',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.7,
    type: 'Normal',
    flavor: 'The user generates a ray of energy. The type of this move depends on the terrain.',
    aoe: 'Single Opponent',
    onGetType: (_, field, move) => {
      const newType = field.terrain?.terrainPulse
      if (newType && newType !== 'Normal') {
        move.type = newType
      }
      return move.type
    },
    onBeforeMove: ({move, field}) => {
      const newType = field.terrain?.terrainPulse
      if (newType && newType !== 'Normal') {
        move.power *= 2
        move.type = newType
      }
      return new Log()
    },
  },
  'Thief': {
    name: 'Thief', type: 'Dark',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.8, accuracy: 1, criticalHit: 1,
    aoe: 'Single Opponent', contact: true,
    flavor: 'The user rushes forward to steal whatever the opponent is holding.',
    onAfterMove: (inp) => {
      if (inp.caster.heldItem) {
        return new Log() // can't steal something else
      }
      if (!inp.target.heldItem) {
        return new Log() // can't steal nothing
      }
      if (inp.caster.heldItemConsumed) {
        return new Log() // can't steal used item
      }
      inp.caster.heldItem = inp.target.heldItem
      inp.caster.heldItemKey = inp.target.heldItemKey
      inp.caster.heldItemConsumed = inp.target.heldItemConsumed
      inp.caster.heldItemTotallyConsumed = false // Won't remove it from your bag
      const {label} = ITEMS[inp.target.heldItemKey!]
      return new Log().add(`${inp.prefix} ${inp.caster.species} stole ${inp.target.species}'s ${label}`)
    }
  },
  'Thousand Arrows': {
    name: 'Thousand Arrows', type: 'Ground',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 1, power: 1.1, criticalHit: 1,
    flavor: 'Dirt arrows rise from the ground to strike the target. Even Pokémon in the air are vulnerable.',
    aoe: 'Nearby Opponents',
    onBeforeMove: (inp) => {
      if (inp.target.type1 === 'Flying' ||
          inp.target.type2 === 'Flying' || 
          getCondition(inp.target, 'Float') ||
          getCondition(inp.target, 'FloatUnintentional') ||
          getCondition(inp.target, 'InAir')
        ) {
        inp.move.type = 'Status'
        return APPLY_TEMP_STATUS(inp.target, ConditionMap.Grounded, `${inp.target} fell to the ground`)
      }
      return new Log()
    },
  },
  'Thousand Waves': {
    name: 'Thousand Waves', type: 'Ground',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 1, power: 1.1, criticalHit: 1,
    flavor: 'Seismic activity around the targets cause damage. Pokémon caught in the shaking cannot flee.',
    aoe: 'Nearby Opponents',
    onAfterMove: ({target}) => {
      return APPLY_TEMP_STATUS(target, ConditionMap.TrappedInBattle,
        `${target.species} is trapped in the battle.`)
    }
  },
  Thrash: {
    // Clone of Petal Dance
    name: 'Thrash',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.4,
    type: 'Normal',
    flavor: 'The user goes on an angry rampage. They become confused later on.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: ({caster}) => APPLY_TEMP_STATUS(caster, ConditionMap.Thrashing),
  },
  'Throat Chop': {
    name: 'Throat Chop',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.95,
    type: 'Dark',
    flavor: 'The user sinisterly strikes at the target\'s throat. The target cannot make any sounds afterwards.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: ({target}) => APPLY_TEMP_STATUS(target, ConditionMap.Speechless,
      `${target.species} has an injured throat.`),
  },
  Thunder: {
    name: 'Thunder',
    accuracy: 0.7,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.3,
    type: 'Electric',
    flavor: 'The user calls down a bolt of lightning (this move\'s name is a misnomer). The target might become paralyzed.',
    aoe: 'Single Opponent',
    onBeforeMove: ({move, field}) => {
      if (field.weather.name === 'Rain') {
        move.accuracy = Infinity
      } else if (field.weather.name === 'Heat Wave') {
        move.accuracy /= 0.7/0.5
      }
      return new Log()
    },
    onAfterMove: (inp) => Paralyze(inp, 0.3),
  },
  'Thunder Cage': {
    name: 'Thunder Cage', type: 'Electric',
    // TODO: No trapping effect
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1, accuracy: 0.9, criticalHit: 1,
    aoe: 'Single Opponent',
    flavor: 'The user slings bolts of lightning around the target, trapping them in a cage.',
  },
  Thunderbolt: {
    name: 'Thunderbolt',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.1,
    type: 'Electric',
    flavor: 'The target is hit by 100,000 volts, potentially paralyzing them.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Paralyze(inp, 0.1),
  },
  'Thunder Fang': {
    name: 'Thunder Fang',
    accuracy: 0.95,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.85,
    type: 'Electric',
    flavor: 'The user chomps down on the target with electrified teeth. Paralysis is possible.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => Paralyze(inp, 0.2),
  },
  'Thunderous Kick': {
    name: 'Thunderous Kick', type: 'Fighting',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.1, accuracy: 1, criticalHit: 1,
    aoe: 'Single Opponent', contact: true,
    flavor: "The user runs forward, building up a charge along the ground before striking with its feet. The target's defense will drop.",
    onAfterMove: (inp) => {
      return BUFF_STAT(inp.target, inp, 'defense', -1)
    }
  },
  'Thunder Punch': {
    name: 'Thunder Punch',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.95,
    type: 'Electric',
    flavor: 'The user jabs the target with a charged fist. Paralysis is possible.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => Paralyze(inp, 0.1),
  },
  'Thunder Shock': {
    name: 'Thunder Shock',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.6,
    type: 'Electric',
    flavor: 'The target is struck by static electricity, potentially paralyzing them.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Paralyze(inp, 0.1),
  },
  'Thunder Wave': {
    name: 'Thunder Wave',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Electric',
    flavor: 'The user emits a low-voltage electrical current that paralyzes the target.',
    aoe: 'Single Opponent', zMoveFx: 'SpDefBuff1',
    // T-Wave doesn't work on Ground-types
    onBeforeMove: nop,
    onAfterMove: (inp) => Paralyze(inp, 1),
  },
  Tickle: {
    name: 'Tickle',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Normal',
    flavor: `The user finds the target's funny bone and exploits it. The target's physical stats drop.`,
    aoe: 'Single Opponent', zMoveFx: 'DefBuff1',
    onBeforeMove: noop,
    onAfterMove: (inp) => {
      const log = new Log()
      log.push(BUFF_STAT(inp.target, inp, 'attack', -1))
      log.push(BUFF_STAT(inp.target, inp, 'defense', -1))
      return log
    }
  },
  'Tidy Up': {
    name: 'Tidy Up',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0.7,
    type: 'Normal',
    flavor: 'Items on the field are removed. The user feels better having cleaned.',
    aoe: 'Self', zMoveFx: 'AccBuff1',
    onAfterMove: (inp) => {
      const {caster, field, prefix} = inp
      const log = new Log()
      log.add('The field was cleared.')

      field.sides[prefix].spikes = 0
      field.sides[prefix].toxicSpikes = 0
      field.sides[prefix].stealthRock = false
      field.sides[prefix].sharpSteel = false
      field.sides[prefix].stickyWeb = false
      log.push(BUFF_STAT(caster, inp, 'attack', 1))
      log.push(BUFF_STAT(caster, inp, 'speed', 1))
      return log
    }
  },
  'Topsy-Turvy': {
    name: 'Topsy-Turvy', type: 'Dark',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: 1,
    aoe: 'Single Opponent', zMoveFx: 'AtkBuff1',
    flavor: `˙ʇǝƃɹɐʇ ǝɥʇ ɟo sǝƃuɐɥɔ ʇɐʇs sǝsɹǝʌǝɹ`,
    onAfterMove: ({target}) => {
      target.statBuffs.attack *= -1
      target.statBuffs.spAttack *= -1
      target.statBuffs.defense *= -1
      target.statBuffs.spDefense *= -1
      target.statBuffs.speed *= -1
      target.statBuffs.accuracy *= -1
      target.statBuffs.evasiveness *= -1
      return new Log().add(`${target.species}'s stat changes were flipped.'`)
    }
  },
  'Torch Song': {
    name: 'Torch Song', type: 'Fire',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1, accuracy: 1, criticalHit: 1, aoe: 'Single Opponent', sound: true,
    flavor: 'A fiery song only raises its special attack with lyric.',
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'spAttack', 1)
  },
  'Toxic': {
    name: 'Toxic',
    accuracy: 0.9,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Poison',
    flavor: 'The target is hit by a highly acidic poison. They are not just poisoned by their condition will worsen over time.',
    aoe: 'Single Opponent', zMoveFx: 'DefBuff1',
    onBeforeMove: ({caster, target, move}) => {
      const log = new Log()
      if (target.type1 === 'Steel' || target.type2 === 'Steel') {
        log.add('It had no effect...')
        move.failed = true
      } else if (target.type1 === 'Poison' || target.type2 === 'Poison') {
        log.add('It had no effect...')
        move.failed = true
      }
      if (caster.type1 === 'Poison' || caster.type2 === 'Poison') {
        move.accuracy = Infinity
      }

      return log
    },
    onAfterMove: (inp) => {
      const log = new Log()
      log.push(Poison(inp, 1))
      if (inp.target.status?.name === 'Poison') {
        // If the Poison didn't work, don't toxic
        log.push(APPLY_TEMP_STATUS(inp.target, ConditionMap.PoisonBad, `${inp.target.species} was badly poisoned`))
      } else {
        log.add('It had no effect...')
      }
      return log
    },
  },
  'Toxic Spikes': {
    name: 'Toxic Spikes', type: 'Poison',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, power: 0, criticalHit: 0,
    aoe: 'Single Opponent',
    flavor: 'The user lays a layer of acidic spikes on the opposing side of the field.',
    onBeforeMove: ({move, field, targetPrefix}) => {
      if (field.sides[targetPrefix].toxicSpikes >= 2) {
        move.failed = true
        return new Log().add('The move failed...')
      }
      move.type = 'Status'
      return new Log()
    },
    onAfterMove: ({field, targetPrefix}) => {
      field.sides[targetPrefix].toxicSpikes++
      return new Log().add('Toxic spikes scattered on the field')
    }
  },
  'Toxic Thread': {
    name: 'Toxic Thread',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Poison',
    flavor: 'The user shoots out a poisonous thread that leaves the target with a poison.',
    aoe: 'Single Opponent', zMoveFx: 'SpdBuff1',
    onAfterMove: (inp) => {
      const {target} = inp
      const log = BUFF_STAT(target, inp, 'speed', -1)
      if (target.type1 !== 'Poison' && target.type2 !== 'Poison') {
        if (target.type1 !== 'Steel' && target.type2 !== 'Steel') {
          log.push!(Poison(inp, 1))
        }
      }
      return log
    }
  },
  'Trailblaze': {
    name: 'Trailblaze', type: 'Grass',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.7, accuracy: 1, criticalHit: 1,
    flavor: 'The user rushes out of the brush to strike. This raises its speed.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'speed', 1)
  },
  Transform: {
    name: 'Transform',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0,
    type: 'Normal',
    flavor: 'The user disguises themselves as the target.',
    aoe: 'Single Opponent', zMoveFx: 'Heal',
    onBeforeMove: noop,
    onAfterMove: ({caster, target}) => {
      const species = Pkmn.get(target.badge.toLegacyString())!
      caster.type1 = species.type1
      caster.type2 = species.type2
      // Mirror opponent stats, but don't let Ditto get too OP
      caster.attack = Math.min(target.attack, species.attack * 2)
      caster.defense = Math.min(target.defense, species.defense * 2)
      caster.spAttack = Math.min(target.spAttack, species.spAttack * 2)
      caster.spDefense = Math.min(target.spDefense, species.spDefense * 2)
      caster.speed = Math.min(target.speed, species.speed * 2)
      caster.weight = target.weight
      caster.statBuffs = {...target.statBuffs}
      caster.movepool = target.movepool
      // If Ditto transforms into Ditto, handle this
      if (caster.movepool[0].name === 'Transform') {
        caster.movepool = [Movepool.Struggle] // Use Struggle instead
      }
      caster.moveTMs = target.moveTMs
      return new Log().add(`${caster.species} has transformed ` +
          `into a copy of ${target.species}!`)
    }
  },
  'Tri Attack': {
    name: 'Tri Attack',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.9,
    type: 'Normal',
    flavor: 'The user attacks with elemental power. The target may be frozen, paralyzed, or even burned.',
    aoe: 'Single Opponent',
    onAfterMove: ({target, field}) => {
      if (Math.random() >= 0.8) return new Log()
    
      const p = Math.random();
      if (p < 1/3 && field.weather.name !== 'Heat Wave') {
        return APPLY_STATUS(target, 'Frozen',
            `${target.species} became frozen solid!`);
      } else if (p < 2/3) {
        return APPLY_STATUS(target, 'Burn',
            `${target.species} was burned!`);
      } else {
        return APPLY_STATUS(target, 'Paralyzed',
            `${target.species} was paralyzed, it may be unable to move!`);
      }
    }
  },
  Trick: {
    name: 'Trick',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Dark',
    flavor: 'The user tricks the target and swaps items.',
    aoe: 'Single Opponent',
    zMoveFx: 'SpdBuff2',
    onBeforeMove: noop,
    onAfterMove: ({caster, target}) => {
      const casterHeldItem = caster.heldItem
      const casterHeldItemConsumed = caster.heldItemConsumed
      caster.heldItem = target.heldItem
      caster.heldItemConsumed = target.heldItemConsumed
      target.heldItem = casterHeldItem
      target.heldItemConsumed = casterHeldItemConsumed
      APPLY_TEMP_STATUS(caster, ConditionMap.Switcherooed)
      APPLY_TEMP_STATUS(target, ConditionMap.Switcherooed)
      const log = new Log()
      log.add(`${caster.species} swapped items with ${target.species}`)
      return log
    }
  },
  'Trick-or-Treat': {
    name: `Trick-or-Treat`, type: 'Ghost',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: 1,
    // This is slightly different from MSG
    flavor: 'The target is hit by a strange force and becomes Ghost-type.',
    aoe: 'Single Opponent', zMoveFx: 'BuffAll1',
    onAfterMove: ({target}) => {
      target.type1 = 'Ghost'
      target.type2 = undefined
      return new Log().add(`${target.species} became a Ghost-type.`)
    },
  },
  'Trick Room': {
    name: 'Trick Room', type: 'Psychic',
    attackKey: 'attack', defenseKey: 'defense', priority: -7,
    accuracy: Infinity, criticalHit: 0, power: 0,
    flavor: 'The user causes the battlefield to warp, making slow fast and vice versa.',
    aoe: 'Self', zMoveFx: 'AccBuff1',
    onBeforeMove: noop,
    onAfterMove: ({field}) => {
      const log = new Log()
      if (field.trickRoom) {
        field.trickRoom = 0
      } else {
        field.trickRoom = 5
      }
      log.add('The dimensions have been warped')
      return log
    }
  },
  'Triple Arrows': {
    name: 'Triple Arrows', type: 'Fighting',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.1, accuracy: 1, criticalHit: 3,
    aoe: 'Single Opponent',
    flavor: 'The user kicks the target, then fires three arrows. Critical hits are more likely. The target might lose defense or even flinch!',
    onAfterMove: (inp) => {
      const p = Math.random()
      if (p < 0.15) {
        return BUFF_STAT(inp.target, inp, 'defense', -1)
      } else if (p < 0.3) {
        return Flinch(inp, 1)
      }
      return new Log()
    },
  },
  'Triple Axel': {
    name: 'Triple Axel', type: 'Ice',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.4, accuracy: 0.9, criticalHit: 1,
    aoe: 'Single Opponent', contact: true,
    flavor: 'The user spins around gracefully, striking the target with its feet once or more.',
    onBeforeMove: ({move}) => {
      // If we are at this point the first one struck.
      const threeSpins = [1, Math.random(), Math.random()]
      if (threeSpins[1] < 0.1) {
        move.power = 0.4
        return new Log().add('Struck once!')
      }
      if (threeSpins[2] < 0.1) {
        move.power = 0.8 // + 40
        return new Log().add('Struck twice!')
      }
      move.power = 1.4 // + 60
      return new Log().add('Struck thrice!')
    },
  },
  'Triple Dive': {
    name: 'Triple Dive',
    accuracy: 0.95,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Water',
    flavor: 'The user rises from the water in a stunning pose, striking the target thrice.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({move}) => HIT_MANY(move, 0.5, 3, 3),
  },
  'Triple Kick': {
    name: 'Triple Kick',
    accuracy: 0.9,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.11,
    type: 'Fighting',
    flavor: 'The user strikes at the target with each of its three legs.',
    aoe: 'Single Opponent', contact: true,
  },
  'Trop Kick': {
    name: 'Trop Kick',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    contact: true,
    criticalHit: 1,
    power: 0.9,
    type: 'Grass',
    flavor: "The user kicks the target with the power of the tropics. The target's attack subsequently drops",
    aoe: 'Single Opponent',
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'attack', -1)
  },
  'Twin Beam': {
    name: 'Twin Beam', type: 'Psychic',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    aoe: 'Single Opponent',
    power: 1, accuracy: 1, criticalHit: 1,
    flavor: "The user issues a beam from its head. Then it issues a beam from its other head.",
    onBeforeMove: ({move}) => HIT_MANY(move, 0.4, 2, 2),
  },
  'Twineedle': {
    name: 'Twineedle', type: 'Bug',
    attackKey: 'attack', defenseKey: 'defense', aoe: 'Single Opponent', contact: true,
    power: 0.7, accuracy: 1, criticalHit: 1,
    flavor: 'The user stabs twice with spikes. The target may be poisoned.',
    onBeforeMove: ({move}) => HIT_MANY(move, 0.45, 2, 2),
    onAfterMove: (inp) => Poison(inp, 0.2),
  },
  'Twister': {
    name: 'Twister', type: 'Dragon',
    attackKey: 'spAttack', defenseKey: 'spDefense', aoe: 'Nearby Opponents',
    power: 0.6, accuracy: 1, criticalHit: 1,
    flavor: 'The user spins around, creating a spiral rush of wind that hits opponents.',
    onBeforeMove: ({target, move}) => {
      if (getCondition(target, 'InAir') ||
          getCondition(target, 'Bouncing') ||
          getCondition(target, 'SkyDropping')) {
        move.power *= 2
      }
      return new Log()
    },
    onAfterMove: (inp) => Flinch(inp, 0.2),
  },
  // https://twitter.com/NintendoAmerica/status/1691174113338101760
  'Upper Hand': {
    name: 'Upper Hand', type: 'Fighting',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.6, /* FIXME */ accuracy: 1, criticalHit: 1, priority: 2,
    aoe: 'Single Opponent', contact: true,
    flavor: 'Before the target gets to make a priority attack, the user strikes first.',
    onBeforeMove: (inp) => {
      const targetMoveCondition = getCondition(inp.target, 'NextMove')
      if (!targetMoveCondition) {
        inp.move.failed = true
        return new Log().add('But it failed...')
      }
      const move = targetMoveCondition.p!.selectedMove!
      if ((move.priority ?? 0) <= 0) {
        inp.move.failed = true
        return new Log().add('But it failed...')
      }
      return new Log()
    },
    onAfterMove: (i) => Flinch(i, 1),
  },
  Uproar: {
    name: 'Uproar',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.5,
    type: 'Normal',
    sound: true,
    flavor: 'The user screeches so loud that even those sleeping awaken. Their special attack raises with each use.',
    aoe: 'Random Opponent',
    onAfterMove: (inp) => {
      const {target} = inp
      const msg = BUFF_STAT(inp.caster, inp, 'spAttack', 1)
      if (target.status?.name === 'Asleep') {
        target.status = undefined
        msg.add!(`${target.species} woke up`)
      }
      return msg
    }
  },
  'U-turn': {
    name: 'U-turn', type: 'Bug',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 1, criticalHit: 1, power: 0.9,
    flavor: 'The user spins forward and then buzzes off.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => {
      if (getCondition(inp.caster, 'TrappedInBattle')) {
        return new Log()
      }
      return APPLY_TEMP_STATUS(inp.caster, {...ConditionMap['SwitchOut']},
        `${inp.caster.species} is buzzing off!`)
    },
  },
  'Vacuum Wave': {
    name: 'Vacuum Wave',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.6,
    type: 'Fighting',
    priority: 1,
    flavor: 'The user strikes quickly with a burst of kinetic energy.',
    aoe: 'Single Opponent',
  },
  'V-create': {
    name: 'V-create', type: 'Fire',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 0.95, criticalHit: 1, power: 2,
    flavor: 'The user tackles with a fiery burst of devastating power. Their defenses drop afterwards.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => {
      const log = new Log()
      log.push(BUFF_STAT(inp.caster, inp, 'defense', -1))
      log.push(BUFF_STAT(inp.caster, inp, 'spDefense', -1))
      log.push(BUFF_STAT(inp.caster, inp, 'speed', -1))
      return log
    },
  },
  'Venom Drench': {
    name: 'Venom Drench', type: 'Poison',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 1, criticalHit: 0, power: 0,
    flavor: 'The user spits up an acid that the target does not like. Both attack stats and speed drop.',
    aoe: 'Single Opponent', zMoveFx: 'DefBuff1',
    onAfterMove: (inp) => {
      const log = new Log()
      log.push(BUFF_STAT(inp.target, inp, 'attack', -1))
      log.push(BUFF_STAT(inp.target, inp, 'spAttack', -1))
      log.push(BUFF_STAT(inp.target, inp, 'speed', -1))
      return log
    }
  },
  'Venoshock': {
    name: 'Venoshock', type: 'Poison',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    accuracy: 1, criticalHit: 1, power: 0.85,
    flavor: 'The user spits up a special poison. The damage doubles if the target is already poisoned.',
    aoe: 'Single Opponent',
    onAfterMove: ({target, move}) => {
      const log = new Log()
      if (target.status?.name === 'Poison') {
        move.power *= 2
      }
      return log
    }
  },
  'Victory Dance': {
    name: 'Victory Dance', type: 'Fighting',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0,
    aoe: 'Self',
    flavor: 'The user dances in a show of force ahead of its victory, boosting multiple stats at once.',
    onAfterMove: (inp) => {
      return new Log()
        .push(BUFF_STAT(inp.caster, inp, 'attack', 1))
        .push(BUFF_STAT(inp.caster, inp, 'defense', 1))
        .push(BUFF_STAT(inp.caster, inp, 'speed', 1))
    }
  },
  'Vise Grip': {
    name: 'Vise Grip', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 1, criticalHit: 1, power: 0.75,
    flavor: 'The user strikes the opponent with its tightening claw.',
    aoe: 'Single Opponent', contact: true,
  },
  'Vine Whip': {
    name: 'Vine Whip', type: 'Grass',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 1, criticalHit: 1, power: 0.65,
    flavor: 'The user lashes out with vines from the ground.',
    aoe: 'Single Opponent'
  },
  'Vital Throw': {
    name: 'Vital Throw', type: 'Fighting',
    attackKey: 'attack', defenseKey: 'defense', aoe: 'Single Opponent', contact: true,
    power: 0.9, accuracy: Infinity, criticalHit: 1, priority: -1,
    flavor: 'The user attacks last, but never misses.',
  },
  'Volt Switch': {
    name: 'Volt Switch', type: 'Electric',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    accuracy: 1, criticalHit: 1, power: 0.9,
    flavor: 'The user thrusts voltage forward and then grounds out.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => {
      if (getCondition(inp.caster, 'TrappedInBattle')) {
        return new Log()
      }
      return APPLY_TEMP_STATUS(inp.caster, {...ConditionMap['SwitchOut']},
        `${inp.caster.species} needs a recharge!`)
    },
  },
  'Volt Tackle': {
    name: 'Volt Tackle',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.35,
    type: 'Electric',
    flavor: 'The user charges up their body and then recklessly hits the target. Both take damage.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => RECOIL(inp, 4),
  },
  'X-Scissor': {
    name: 'X-Scissor',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Bug',
    flavor: 'The target is struck by two sharp blades.',
    aoe: 'Single Opponent', contact: true,
  },
  'Wake-Up Slap': {
    name: 'Wake-Up Slap',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.85,
    type: 'Fighting',
    flavor: 'The target is smacked hard. If they are asleep they\'ll awaken.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({target, move}) => {
      if (target.status?.name === 'Asleep') {
        move.power *= 2
      }
      return new Log()
    },
    onAfterMove: ({target}) => {
      if (target.status?.name === 'Asleep') {
        target.status = undefined
        return new Log().add(`${target.species} woke up!`)
      }
      return new Log()
    }
  },
  Waterfall: {
    name: 'Waterfall',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Water',
    flavor: 'The user tackles the target, potentially causing them to flinch.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => Flinch(inp, 0.2),
  },
  'Water Gun': {
    name: 'Water Gun',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.7,
    type: 'Water',
    flavor: 'The user spits up some water at high pressure.',
    aoe: 'Single Opponent',
  },
  'Water Pledge': {
    name: 'Water Pledge', type: 'Water',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1, accuracy: 1, criticalHit: 1,
    flavor: 'The user scatters rain around the target. This may have more effects when paired with friends.',
    aoe: 'Single Opponent',
    onBeforeMove: ({move, targetPrefix, field}) => {
      if (field.sides[targetPrefix].pledgeGrass || field.sides[targetPrefix].pledgeFire) {
        move.power *= 1.7
      }
      return new Log()
    },
    onAfterMove: ({prefix, targetPrefix, field}) => {
      const log = new Log()
      field.sides[targetPrefix].pledgeWater = true
      log.add(`Rain drips across ${targetPrefix} side of the field`)
      if (field.sides[targetPrefix].pledgeGrass) {
        field.sides[targetPrefix].marsh = 4
        log.add('The rain has turned the grass muddy!')
      }
      if (field.sides[targetPrefix].pledgeFire) {
        field.sides[prefix].rainbow = 4
        log.add('A rainbow has appeared!')
      }
      return log
    }
  },
  'Water Pulse': {
    name: 'Water Pulse',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.8,
    type: 'Water',
    flavor: 'The user hurls an orb of water at the target. They might become confused.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Confuse(inp, 0.2),
  },
  'Water Shuriken': {
    name: 'Water Shuriken',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.65,
    type: 'Water',
    flavor: 'The user attacks with multiple watery blades in succession.',
    aoe: 'Single Opponent',
    priority: 1,
    onBeforeMove: ({move}) => HIT_MANY(move, 0.15, 2, 5),
  },
  'Water Sport': {
    name: 'Water Sport',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0,
    type: 'Water',
    flavor: 'The user covers the field in puddles. Fire-type moves weaken.',
    aoe: 'Everyone', zMoveFx: 'SpDefBuff1',
    onBeforeMove: noop,
    onAfterMove: ({field}) => {
      const log = new Log()
      field.waterSport = 5
      log.add('Shallow puddles covered the field.')
      return log
    }
  },
  'Water Spout': {
    name: 'Water Spout',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1,
    type: 'Water',
    flavor: 'The user causes water to rain down on the target. This attack does more damage if the user is healthier.',
    aoe: 'Nearby Opponents',
    onBeforeMove: POWER_BY_HP,
  },
  'Wave Crash': {
    name: 'Wave Crash',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.4,
    type: 'Water',
    flavor: 'The user encircles itself in water and crashes into the target with great momentum. Both double over in pain.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => RECOIL(inp, 3),
  },
  'Weather Ball': {
    name: 'Weather Ball',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 0.7,
    type: 'Normal',
    flavor: 'The user creates an orb of water vapor and hits the target. The type of this move depends on the weather.',
    aoe: 'Single Opponent',
    onGetType: (_, field, move) => {
      const newType = field.weather.weatherBall
      if (newType !== 'Normal') {
        move.type = newType
      }
      return move.type
    },
    onBeforeMove: ({move, field}) => {
      const newType = field.weather.weatherBall
      if (newType !== 'Normal') {
        move.power *= 2
        move.type = newType
      }
      if (field.weather.name === 'Fog') {
        move.power *= 2 // Double even though type same
      }
      return new Log()
    },
  },
  'Whirlpool': {
    name: 'Whirlpool', type: 'Water',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    accuracy: 0.85, criticalHit: 1, power: 0.55,
    flavor: 'The user conjures a vortex of water and envelops the target.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => {
      const status = {...ConditionMap.Bound}
      if (['bindingband', 'gripclaw'].includes(inp.caster.heldItemKey ?? '')) {
        status.p = {longer: true}
      }
      return APPLY_TEMP_STATUS(inp.target, status,
        `${inp.target.species} became trapped in a watery vortex!`)
    },
  },
  'Whirlwind': {
    name: 'Whirlwind', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, criticalHit: 0, power: 0,
    flavor: 'The user blows so much wind out that the opponent is blown away.',
    aoe: 'Single Opponent', priority: -6,
    onBeforeMove: ({target, move}) => {
      move.type = 'Status'
      if (getCondition(target, 'TrappedInBattle')) {
        move.failed = true
        return new Log().add('But it failed...')
      }
      return new Log()
    },
    onAfterMove: (inp) => {
      return APPLY_TEMP_STATUS(inp.target, {...ConditionMap['SwitchOut']},
        `${inp.target.species} is blown away!`)
    },
  },
  'Wicked Blow': {
    name: 'Wicked Blow', type: 'Dark',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1, criticalHit: Infinity, accuracy: 1,
    aoe: 'Single Opponent', contact: true,
    flavor: 'The user builds up energy to attack the foe in one blow, always resulting in a critical hit.',
  },
  'Wicked Torque': {
    name: 'Wicked Torque', type: 'Dark',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 1, criticalHit: 1, power: 1,
    flavor: 'The user rushes forward into the target, which may leave them asleep.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Sleep(inp, 0.1),
  },
  'Wide Guard': {
    name: 'Wide Guard',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Rock',
    priority: 3,
    flavor: 'The user throws up a barrier that blocks wide moves.',
    aoe: 'All Allies', zMoveFx: 'DefBuff1',
    onBeforeMove: noop,
    onAfterMove: ({target}) => APPLY_TEMP_STATUS(target, ConditionMap.ProtectWide,
        `${target.species} shielded itself!`)
  },
  'Wildbolt Storm': {
    name: 'Wildbolt Storm', type: 'Electric',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.2, accuracy: 0.8, criticalHit: 1,
    aoe: 'Nearby Opponents',
    flavor: 'The user unleashes a fierce wind with emotional love and hate. The target may be paralyzed after.',
    onAfterMove: (inp) => {
      return Paralyze(inp, 0.2)
    }
  },
  'Wild Charge': {
    name: 'Wild Charge', type: 'Electric',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.5, accuracy: 1, criticalHit: 1,
    flavor: 'The user recklessly charges at the target while it\'s charged (get it?). The user also takes some damage.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => RECOIL(inp, 4)
  },
  'Will-O-Wisp': {
    name: 'Will-O-Wisp',
    accuracy: 0.85,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Fire',
    flavor: 'The user conjures mysterious orbs of fire which burn the target.',
    aoe: 'Single Opponent',zMoveFx: 'AtkBuff1',
    onAfterMove: (inp) => Burn(inp, 1),
  },
  'Wing Attack': {
    name: 'Wing Attack',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0.8,
    type: 'Flying',
    flavor: 'The user smacks into the target with its wings.',
    aoe: 'Single Opponent', contact: true,
  },
  'Wish': {
    name: 'Wish',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Normal',
    flavor: 'The user casts a wish. In a few turns, their wish is granted.',
    aoe: 'Self', zMoveFx: 'SpDefBuff1',
    onBeforeMove: noop,
    onAfterMove: ({caster}) => {
      const log = new Log()
      log.add(`${caster.species} spotted a wishing star`)
      APPLY_TEMP_STATUS(caster, ConditionMap.Wishful)
      return log
    }
  },
  'Withdraw': {
    name: 'Withdraw',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Water',
    flavor: 'The user withdraws into its shell, boosting its defense.',
    aoe: 'Self', zMoveFx: 'DefBuff1',
    onBeforeMove: noop,
    onAfterMove: (inp) => {
      return DefBuff(inp.caster, inp, 1)
    }
  },
  'Wonder Room': {
    name: 'Wonder Room', type: 'Psychic',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: Infinity, criticalHit: 0, power: 0,
    flavor: 'The user plunges the battlefield into a strange room where defenses are swapped.',
    aoe: 'Everyone', zMoveFx: 'SpDefBuff1',
    onBeforeMove: noop,
    onAfterMove: ({field}) => {
      const log = new Log()
      if (field.wonderRoom) {
        field.wonderRoom = 0
      } else {
        field.wonderRoom = 5
      }
      log.add('The defensive stats have been warped')
      return log
    }
  },
  'Wood Hammer': {
    name: 'Wood Hammer',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1.4,
    type: 'Grass',
    flavor: 'The user smacks its fists into the target recklessly. The user takes some damage.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => RECOIL(inp, 4),
  },
  'Work Up': {
    name: 'Work Up',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Normal',
    flavor: 'The user prepares to fight next turn. Its attack stats rise.',
    aoe: 'Self', zMoveFx: 'AtkBuff1',
    onBeforeMove: noop,
    onAfterMove: (input) => {
      const log = new Log()
      log.push(BUFF_STAT(input.caster, input, 'attack'))
      log.push(BUFF_STAT(input.caster, input, 'spAttack'))
      return log
    }
  },
  'Wrap': {
    name: 'Wrap', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    accuracy: 0.9, criticalHit: 1, power: 0.55,
    flavor: 'The user curls around the target and binds them.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => {
      const status = {...ConditionMap.Bound}
      if (['bindingband', 'gripclaw'].includes(inp.caster.heldItemKey ?? '')) {
        status.p = {longer: true}
      }
      return APPLY_TEMP_STATUS(inp.target, status,
        `${inp.target.species} became trapped!`)
    },
  },
  // Same logic as Crush Grip
  'Wring Out': {
    name: 'Wring Out',
    accuracy: 1,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1,
    type: 'Normal',
    flavor: 'The user grabs the target and threatens to pull them apart. This attack does more damage if the target is healthier.',
    aoe: 'Single Opponent', contact: true,
    onBeforeMove: ({target, move}) => {
      // Move power between 0 -> 1.5
      move.power = 1.5 * (target.currentHp / target.totalHp)
      return new Log()
    },
  },
  'Yawn': {
    name: 'Yawn', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0,
    flavor: 'The user looks drowsy. Their contagious yawn causes the target to also grow tired.',
    aoe: 'Single Opponent', zMoveFx: 'SpdBuff1',
    onAfterMove: ({target}) => {
      return APPLY_TEMP_STATUS(target, ConditionMap.Drowsy,
        `${target.species} grew drowsy.`)
    }
  },
  'Zap Cannon': {
    name: 'Zap Cannon',
    accuracy: 0.5,
    attackKey: 'spAttack',
    defenseKey: 'spDefense',
    criticalHit: 1,
    power: 1.4,
    type: 'Electric',
    flavor: 'The user unleashes a devastating burst of power. The target becomes paralyzed.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Paralyze(inp, 1),
  },
  'Zen Headbutt': {
    name: 'Zen Headbutt',
    accuracy: 0.9,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Psychic',
    flavor: 'The user tackles the target in a meditative strike. The target might flinch.',
    aoe: 'Single Opponent', contact: true,
    onAfterMove: (inp) => Flinch(inp, 0.2),
  },
  'Zing Zap': {
    name: 'Zing Zap',
    accuracy: 1,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 1,
    type: 'Electric',
    contact: true,
    flavor: 'The user lunges with electrical force, potentially causing the target to flinch.',
    aoe: 'Single Opponent',
    onAfterMove: (inp) => Flinch(inp, 0.3),
  },
  /* Z-Moves Listings */
  '10_000_000 Volt Thunderbolt': zMove({
    name: '10,000,000 Volt Thunderbolt', type: 'Electric',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 2.15, criticalHit: 12, /* Standard is 4.17%. This is ~50% */
    flavor: 'The Pikachu unleashes an incredible strike of lightning using Z-Power. Critical hits are quite frequent.'
  }),
  'Acid Downpour': zMove({
    name: 'Acid Downpour', type: 'Poison',
    flavor: 'The target is drenched in a toxic swamp.'
  }),
  'All-Out Pummeling': zMove({
    name: 'All-Out Pummeling', type: 'Fighting',
    flavor: 'The target is slammed by a flurry of blows.'
  }),
  'Black Hole Eclipse': zMove({
    name: 'Black Hole Eclipse', type: 'Dark',
    flavor: 'A sphere of pure darkness ingests the target.'
  }),
  'Bloom Doom': zMove({
    name: 'Bloom Doom', type: 'Grass',
    flavor: 'Large flowers burst with photosynthetic energy all around the target.'
  }),
  'Breakneck Blitz': zMove({
    name: 'Breakneck Blitz', type: 'Normal',
    flavor: 'The user charges with intense momentum, mowing down the target.'
  }),
  'Catastropika': zMove({
    name: 'Catastropika', type: 'Electric',
    attackKey: 'attack', defenseKey: 'defense', power: 2.3,
    flavor: 'Your Pikachu charges with shocking Pikachu power. The target has a hard time managing.',
  }),
  'Clangorous Soulblaze': zMove({
    name: 'Clangorous Soulblaze', type: 'Dragon',
    attackKey: 'spAttack', defenseKey: 'spDefense', power: 2.05,
    aoe: 'Nearby Opponents',
    flavor: 'Scales are hit together to generate a loud but pleasant tone. All stats of your Kommo-o are boosted.',
    onAfterMove: (inp) => BUFF_ALL(inp, 1)
  }),
  'Continental Crush': zMove({
    name: 'Continental Crush', type: 'Rock',
    flavor: 'The user takes power of an entire continental shelf and smacks the target.',
  }),
  'Corkscrew Crash': zMove({
    name: 'Corkscrew Crash', type: 'Steel',
    flavor: 'The user starts spinning and drills into the target.',
  }),
  'Devastating Drake': zMove({
    name: 'Devastating Drake', type: 'Dragon',
    flavor: 'Draconic power is unleashed against the target.'
  }),
  'Extreme Evoboost': {
    name: 'Extreme Evoboost', type: 'Normal',
    accuracy: Infinity, power: 0, criticalHit: 0,
    attackKey: 'attack', defenseKey: 'defense',
    flavor: 'Your Eevee gets the power of its friends to boost its stats',
    aoe: 'Self',
    onAfterMove: (inp) => {
      const log = BUFF_ALL(inp, 1, 2)
      log.add(`Eevee is joined by friends. Its stats rose sharply!`)
      return log
    }
  },
  'Genesis Supernova': zMove({
    name: 'Genesis Supernova', type: 'Psychic',
    attackKey: 'spAttack', defenseKey: 'spDefense', power: 2.05,
    flavor: 'Terraforming power is instead turned upon the target. Your Mew creates Psychic Terrain after.',
    onAfterMove: (inp) => setTerrain(inp, 'Psychic')
  }),
  'Gigavolt Havoc': zMove({
    name: 'Gigavolt Havoc', type: 'Electric',
    flavor: 'Zap zap! The target is suddenly hit by tons of power.'
  }),
  'Guardian of Alola': zMove({
    name: 'Guardian of Alola', type: 'Fairy',
    flavor: 'All of the Alolan power is gathered to smack the target for massive damage.',
    onBeforeMove: ({target, move}) => {
      move.power = 0 // Zero out
      if (getCondition(target, 'Raid')) {
        move.failed = true
        return new Log().add('The move failed...')
      }
      return new Log()
    },
    onAfterMove: ({target}) => {
      return logDamage(target, target.currentHp * 0.75)
    }
  }),
  'Hydro Vortex': zMove({
    name: 'Hydro Vortex', type: 'Water',
    flavor: 'The user drowns the target with massive waves of water.'
  }),
  'Inferno Overdrive': zMove({
    name: 'Inferno Overdrive', type: 'Fire',
    flavor: 'The user releases ample amounts of heat, boiling the target.',
  }),
  "Let's Snuggle Forever": zMove({
    name: "Let's Snuggle Forever", type: 'Fairy',
    attackKey: 'attack', defenseKey: 'defense', power: 2.1,
    flavor: 'Your Mimikyu opens its arms to the target in a giant hug. Oh no!'
  }),
  'Light That Burns the Sky': zMove({
    name: 'Light That Burns the Sky', type: 'Psychic',
    attackKey: 'spAttack', defenseKey: 'spDefense', // Subject to change
    power: 2.2,
    onBeforeMove: ({caster, move}) => {
      if (caster.attack > caster.spAttack) {
        move.attackKey = 'attack'
        move.defenseKey = 'defense'
      }
      return new Log()
    }
  }),
  'Malicious Moonsault': zMove({
    name: 'Malicious Moonsault', type: 'Dark',
    attackKey: 'attack', defenseKey: 'defense', power: 2,
    flavor: 'Your Inciniroar collides into the target with great force.',
  }),
  'Menacing Moonraze Maelstrom': zMove({
    name: 'Menacing Moonraze Maelstrom', type: 'Ghost',
    attackKey: 'spAttack', defenseKey: 'spDefense', power: 2.2,
    flavor: 'Moonlight is absorbed and focused into an intense beam of pain.'
  }),
  'Never-Ending Nightmare': zMove({
    name: 'Never-Ending Nightmare', type: 'Ghost',
    flavor: 'The target is trapped in a dream, haunted by their own anxieties.'
  }),
  'Oceanic Operetta': zMove({
    name: 'Oceanic Operetta', type: 'Water',
    attackKey: 'spAttack', defenseKey: 'spDefense', power: 2.15,
    flavor: 'Your Primarina sings loudly, filling the target with bubbles.',
  }),
  'Pulverizing Pancake': zMove({
    name: 'Pulverizing Pancake', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense', power: 2.3,
    flavor: 'What is that up in the sky? It is your Snorlax, headed to the target. Oh no!',
  }),
  'Savage Spin-Out': zMove({
    name: 'Savage Spin-Out', type: 'Bug',
    flavor: 'The target is wrapped in webbing and then thrust back and forth like a toy.'
  }),
  'Searing Sunraze Smash': zMove({
    name: 'Searing Sunraze Smash', type: 'Steel',
    attackKey: 'attack', defenseKey: 'defense', power: 2.2,
    flavor: 'Sunlight is absorbed and focused into an intense tackle.'
  }),
  'Shattered Psyche': zMove({
    name: 'Shattered Psyche', type: 'Psychic',
    flavor: 'The user reads the mind of the target and exploits their anxieties.'
  }),
  'Sinister Arrow Raid': zMove({
    name: 'Sinister Arrow Raid', type: 'Ghost',
    attackKey: 'attack', defenseKey: 'defense', power: 2,
    flavor: 'Your Decidueye fires a flurry of arrows to collide with the target.'
  }),
  'Soul-Stealing 7-Star Strike': zMove({
    name: 'Soul-Stealing 7-Star Strike', type: 'Ghost',
    attackKey: 'attack', defenseKey: 'defense', power: 2.15,
    flavor: 'Your Marshadow takes off the kiddy gloves and puts on the adulting gloves.'
  }),
  'Splintered Stormshards': zMove({
    name: 'Splintered Stormshards', type: 'Rock',
    attackKey: 'attack', defenseKey: 'defense', power: 2.1,
    flavor: 'A hail of stones strike the target from the sky. Your Lycanroc clears all terrains from the field.',
    onAfterMove: (inp) => {
      const log = new Log()
      if (inp.field.terrain) {
        log.add(`The ${inp.field.terrain.name} was removed`)
        inp.field.terrain = undefined
      }
      return log
    }
  }),
  'Stoked Sparksurfer': zMove({
    name: 'Stoked Sparksurfer', type: 'Electric',
    attackKey: 'spAttack', defenseKey: 'spDefense', power: 1.95,
    flavor: 'Your Alolan Raichu charges into the target quickly, leaving them paralyzed.',
    onAfterMove: (inp) => Paralyze(inp, 1),
  }),
  'Subzero Slammer': zMove({
    name: 'Subzero Slammer', type: 'Ice',
    flavor: 'The target is smacked by the chill by the cold-hearted user.'
  }),
  'Supersonic Skystrike': zMove({
    name: 'Supersonic Skystrike', type: 'Flying',
    flavor: 'The user rushes into the target. First the target is hit, then they hear a booming sound.'
  }),
  'Tectonic Rage': zMove({
    name: 'Tectonic Rage', type: 'Ground',
    flavor: 'A chasm opens in the earth and the target falls into an endless pit.'
  }),
  'Twinkle Tackle': zMove({
    name: 'Twinkle Tackle', type: 'Fairy',
    flavor: 'The target enters a cosmic space and becomes overwhelmed by the user.'
  }),
  /* Raid Boss Listings */
  'Raid Protect': {
    name: 'Raid Protect', type: 'Status',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: Infinity,
    aoe: 'Self', hide: true,
    flavor: 'The raid boss creates a multi-layer shield to block attacks.',
    onAfterMove: ({caster}) => APPLY_TEMP_STATUS(caster, ConditionMap['Raid Protect'],
        `${caster.species} grew a large shield around itself!`),
  },
  'Raid Sword': {
    name: 'Raid Sword', type: 'Status',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: Infinity,
    aoe: 'Self', hide: true,
    flavor: 'The raid boss raises its attacks sharply.',
    onAfterMove: (input) => {
      const log = new Log()
      log.push(BUFF_STAT(input.caster, input, 'attack', 2))
      log.push(BUFF_STAT(input.caster, input, 'spAttack', 2))
      return log
    }
  },
  'Raid Shield': {
    name: 'Raid Shield', type: 'Status',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, criticalHit: 0, accuracy: Infinity,
    aoe: 'Self', hide: true,
    flavor: 'The raid boss raises its defenses sharply.',
    onAfterMove: (input) => {
      const log = new Log()
      log.push(BUFF_STAT(input.caster, input, 'defense', 2))
      log.push(BUFF_STAT(input.caster, input, 'spDefense', 2))
      return log
    }
  },
  'Raid Swarm': {
    name: 'Raid Swarm', type: 'Bug',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.9, criticalHit: 2, accuracy: Infinity,
    aoe: 'Single Opponent', hide: true,
    flavor: 'The raid boss calls others for help. Its stats will slowly raise over several turns.',
    onAfterMove: (inp) => {
      return APPLY_TEMP_STATUS(inp.caster, ConditionMap.Swarming,
        `${inp.caster.species} has gathered assistance`)
    }
  },
  'Raid Normalize': {
    name: 'Raid Normalize', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.1, criticalHit: 2, accuracy: Infinity,
    aoe: 'Single Opponent', hide: true,
    flavor: 'The raid boss puts the target in a box. All of its moves suddenly become Normal-type.',
    onAfterMove: ({target}) => {
      target.movepool.forEach(move => {
        move.type = 'Normal'
      })
      return new Log().add(`${target.species} has been normalized!`)
    }
  },
  'Raid Sprint': {
    name: 'Raid Sprint', type: 'Fighting',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.1, criticalHit: 2, accuracy: Infinity,
    aoe: 'Single Opponent', hide: true,
    flavor: 'The raid boss puts all its energy into a sudden burst of speed. Its moves raise in priority. Physical attacks will do more damage.',
    onAfterMove: ({caster}) => {
      caster.movepool.forEach(move => {
        if (!move.priority) {
          move.priority = 0
        }
        move.priority++
      })
      APPLY_TEMP_STATUS(caster, ConditionMap.Sprinting)
      return new Log().add(`${caster.species} has begun rushing!`)
    }
  },
  'Raid Headwinds': {
    name: 'Raid Headwinds', type: 'Flying',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.4, criticalHit: 2, accuracy: Infinity,
    aoe: 'All Opponents', hide: true,
    flavor: 'The raid boss unleashes a gust of wind. Those struck will find moves drop in priority.',
    onAfterMove: (inp) => {
      inp.target.movepool.forEach(move => {
        if (!move.priority) {
          move.priority = 0
        }
        move.priority--
      })
      return new Log().add(`${inp.target.species} is facing serious headwinds.`)
    }
  },
  'Raid Boil': {
    name: 'Raid Boil', type: 'Fire',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.4, criticalHit: 2, accuracy: Infinity,
    aoe: 'All Opponents', hide: true,
    flavor: 'The raid boss unleashes releases boiling hot liquid on opponents. If weak, they will burn. Else their stats will drop.',
    onAfterMove: (inp) => {
      const netEffective = typeMatchup.Fire[inp.target.type1] * typeMatchup.Fire[inp.target.type2 || inp.target.type1]
      if (netEffective > 1) {
        return APPLY_STATUS(inp.target, 'Burn', `${inp.target.species} was burned.`)
      }
      if (netEffective < 1) {
        return new Log()
          .push(BUFF_STAT(inp.target, inp, 'attack', -1))
          .push(BUFF_STAT(inp.target, inp, 'defense', -1))
      }
      return new Log()
    }
  },
  'Raid Haze': {
    name: 'Raid Haze', type: 'Poison',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.4, criticalHit: 2, accuracy: Infinity,
    aoe: 'All Opponents', hide: true,
    flavor: 'The raid boss unleashes a murky haze. Any stat drops it has will be cleared. If a weak Pokémon breathes this in, they are badly poisoned.',
    onAfterMove: (inp) => {
      const log = new Log()
      for (const [stat, val] of Object.entries(inp.caster.statBuffs)) {
        if (val < 0) {
          log.push(BUFF_STAT(inp.caster, inp, stat as Stat, -val))
        }
      }
      const netEffective = typeMatchup.Poison[inp.target.type1] * typeMatchup.Poison[inp.target.type2 || inp.target.type1]
      if (netEffective > 1) {
        log.push(APPLY_STATUS(inp.target, 'Poison', `${inp.target.species} was badly poisoned`))
        log.push(APPLY_TEMP_STATUS(inp.target, ConditionMap.PoisonBad))
      }
      return log
    }
  },
  'Raid Sparkle': {
    name: 'Raid Sparkle', type: 'Fairy',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.4, criticalHit: 2, accuracy: Infinity,
    aoe: 'All Opponents', hide: true,
    flavor: 'The raid boss starts shining brightly. Opponents must look away and their accuracy will drop.',
    onAfterMove: (inp) => {
      const log = BUFF_STAT(inp.target, inp, 'accuracy', -1)
      return log
    }
  },
  'Raid Shadow': {
    name: 'Raid Shadow', type: 'Ghost',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.4, criticalHit: 2, accuracy: Infinity,
    aoe: 'All Opponents', hide: true,
    flavor: 'The raid boss dissolves into a shadow. Moves will become harder to land.',
    onAfterMove: (inp) => {
      const log = BUFF_STAT(inp.caster, inp, 'evasiveness', 1)
      log.push(BUFF_STAT(inp.caster, inp, 'accuracy', 1))
      return log
    }
  },
  'Raid Mind Read': {
    name: 'Raid Mind Read', type: 'Psychic',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.1, criticalHit: 2, accuracy: Infinity,
    aoe: 'Single Opponent', hide: true,
    flavor: 'The raid boss predicts the future. Its next moves will always hit. Special attacks will do even more damage.',
    onAfterMove: ({caster}) => {
      APPLY_TEMP_STATUS(caster, ConditionMap.Mindfulness)
      return new Log().add(`${caster.species} has begun rushing!`)
    }
  },
  'Raid Thief': {
    name: 'Raid Thief', type: 'Dark',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.4, criticalHit: 2, accuracy: Infinity,
    aoe: 'All Opponents', hide: true,
    flavor: 'The raid boss steals the stat boosts of its opponent.',
    onAfterMove: (inp) => {
      const log = new Log()
      for (const [stat, val] of Object.entries(inp.target.statBuffs)) {
        if (val > 0) {
          // 'Steal' buff
          log.push(BUFF_STAT(inp.target, inp, stat as Stat, -val))
          log.push(BUFF_STAT(inp.caster, inp, stat as Stat, val))
        }
      }
      return log
    }
  },
  'Raid Rebirth': {
    name: 'Raid Rebirth', type: 'Dragon',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.3, criticalHit: 2, accuracy: Infinity,
    aoe: 'Single Opponent', hide: true,
    flavor: 'The raid boss rises from the ashes using the energy sapped from its target.',
    onAfterMove: (inp) => {
      const log = logDrain(inp.caster, inp.damage!, 1)
      log.add(`${inp.target.species} had its energy drained!`)
      log.add(`${inp.caster.species} has risen from the ashes.`)
      return log
    }
  },
  'Raid Smelt': {
    name: 'Raid Smelt', type: 'Steel',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.4, criticalHit: 2, accuracy: Infinity,
    aoe: 'All Opponents', hide: true,
    flavor: 'The raid boss creates an environment of hot, flowing iron. Those weak will see stats drop. Those resistant will lose energy.',
    onAfterMove: (inp) => {
      const netEffective = typeMatchup.Steel[inp.target.type1] * typeMatchup.Steel[inp.target.type2 || inp.target.type1]
      if (netEffective < 1) {
        return logDrain(inp.caster, inp.damage!, 2)
      }
      if (netEffective > 1) {
        return new Log()
          .push(BUFF_STAT(inp.target, inp, 'attack', -1))
          .push(BUFF_STAT(inp.target, inp, 'defense', -1))
      }
      return new Log()
    }
  },
  'Raid Rogue Wave': {
    name: 'Raid Rogue Wave', type: 'Water',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1, criticalHit: 2, accuracy: Infinity, priority: 1,
    aoe: 'All Opponents', hide: true,
    flavor: 'The raid boss surprises opponents with a sudden wave. They will flinch. Shallow puddles remain afterwards.',
    onAfterMove: (inp) => {
      inp.field.waterSport = 2
      return Flinch(inp, 1)
    }
  },
  'Raid Shroom Burst': {
    name: 'Raid Shroom Burst', type: 'Grass',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.4, criticalHit: 2, accuracy: Infinity,
    aoe: 'All Opponents', hide: true,
    flavor: 'The raid boss emits a burst of spores onto the field. Those who breathe it in will get a status effect and a stat will be lowered.',
    onAfterMove: (inp) => {
      const entries: [StatusId, Stat, string][] = [
        ['Poison', 'spAttack', 'was poisoned'],
        ['Asleep', 'defense', 'fell asleep'],
        ['Paralyzed', 'spDefense', 'became paralyzed'],
      ]
      const [status, stat, msg] = randomItem(entries)
      return APPLY_STATUS(inp.target, status, `${inp.target} ${msg}.`)
        .push(BUFF_STAT(inp.target, inp, stat, -1))
    }
  },
  'Raid Supercool': {
    name: 'Raid Supercool', type: 'Ice',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.1, criticalHit: 2, accuracy: Infinity,
    aoe: 'Single Opponent', hide: true,
    flavor: 'The raid boss suddenly sets the environment to absolute zero around the target. They will freeze.',
    onAfterMove: (inp) => {
      return Freeze(inp, 1)
    }
  },
  'Raid Voltage Drop': {
    name: 'Raid Voltage Drop', type: 'Electric',
    attackKey: 'spAttack', defenseKey: 'spDefense',
    power: 1.3, criticalHit: 2, accuracy: Infinity,
    aoe: 'All Opponents', hide: true,
    flavor: 'The raid boss discharges energy into the air with a whiff of ozone. Opposing moves will become weaker in power.',
    onAfterMoveOnce: ({field}) => {
      field.ions = true
      return new Log()
        .add('Ions scattered across the field.')
    },
    onAfterMove: ({target}) => {
      target.movepool.forEach(move => {
        move.power -= 0.1
      })
      return new Log()
        .add(`${target.species} experienced a voltage drop.`)
    }
  },
  'Raid High Ground': {
    name: 'Raid High Ground', type: 'Ground',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.3, criticalHit: 2, accuracy: Infinity,
    aoe: 'All Opponents', hide: true,
    flavor: 'The raid boss raises itself onto an overlook. Its moves will become stronger in power. Mud will cover the field afterwards.',
    onAfterMoveOnce: ({field}) => {
      field.mudSport = 2
      return new Log()
        .add('Mud covered the field.')
    },
    onAfterMove: ({caster}) => {
      caster.movepool.forEach(move => {
        move.power += 0.1
      })
      return new Log()
        .add(`${caster.species} has the high ground now.`)
    }
  },
  'Raid Vetrification': {
    name: 'Raid Vetrification', type: 'Rock',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0.9, criticalHit: 2, accuracy: Infinity,
    aoe: 'Single Opponent', hide: true,
    flavor: 'The raid boss begins turning the target into glass. Their stats will drop over time.',
    onAfterMove: (inp) => {
      return APPLY_TEMP_STATUS(inp.target, ConditionMap.Vetrifying,
        `${inp.target.species} is beginning to turn into glass!`)
    }
  },
  /* Max Moves Listings */
  'Max Flare': {
    name: 'Max Flare',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0,
    type: 'Fire',
    flavor: 'The user unleashes a Fiery max move. This causes intense sunlight to be drawn to the field.',
    aoe: 'Single Opponent', hide: true,
    onAfterMove: ({field}) => {
      const log = new Log()
      field.weather = {...Weathers['Heat Wave']}
      log.add('The sky grew bright and warm.')
      return log
    }
  },
  'Max Rockfall': {
    name: 'Max Rockfall',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0,
    type: 'Water',
    flavor: 'The user unleashes a Rocking max move. This causes a sandstorm to be drawn to the field.',
    aoe: 'Single Opponent', hide: true,
    onAfterMove: ({field}) => {
      const log = new Log()
      field.weather = {...Weathers['Sandstorm']}
      log.add('The sky grew thick with sand.')
      return log
    }
  },
  'Max Geyser': {
    name: 'Max Geyser',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0,
    type: 'Water',
    flavor: 'The user unleashes a Moist max move. This causes a torrential downpour to be drawn to the field.',
    aoe: 'Single Opponent', hide: true,
    onAfterMove: ({field}) => {
      const log = new Log()
      field.weather = {...Weathers['Rain']}
      log.add('The sky grew stormy and wet.')
      return log
    }
  },
  'Max Guard': {
    name: 'Max Guard',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 0,
    power: 0,
    type: 'Normal',
    priority: 4,
    flavor: 'The user covers itself in a protective barrier, blocking attacks against it.',
    aoe: 'Self',
    onAfterMove: ({caster}) => APPLY_TEMP_STATUS(caster, ConditionMap.MaxGuard,
        `${caster.species} shielded itself!`)
  },
  'Max Hailstorm': {
    name: 'Max Hailstorm',
    accuracy: Infinity,
    attackKey: 'attack',
    defenseKey: 'defense',
    criticalHit: 1,
    power: 0,
    type: 'Ice',
    flavor: 'The user unleashes a Chilly max move. This causes a hailstorm to be drawn to the field.',
    aoe: 'Single Opponent', hide: true,
    onAfterMove: ({field}) => {
      const log = new Log()
      field.weather = {...Weathers['Snow']}
      log.add('The sky grew dark and cold. Hail is starting to fall.')
      return log
    }
  },
  'Max Mindstorm': {
    name: 'Max Mindstorm', type: 'Psychic',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'Single Opponent',
    flavor: 'The user unleashes a Mindful max move. This causes Psychic Terrain to cover the field.',
    onAfterMove: (inp) => setTerrain(inp, 'Psychic')
  },
  'Max Lightning': {
    name: 'Max Lightning', type: 'Electric',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'Single Opponent',
    flavor: 'The user unleashes a Shocking max move. This causes Electric Terrain to cover the field.',
    onAfterMove: (inp) => setTerrain(inp, 'Electric')
  },
  'Max Starfall': {
    name: 'Max Starfall', type: 'Fairy',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'Single Opponent',
    flavor: 'The user unleashes a Fantastic max move. This causes Misty Terrain to cover the field.',
    onAfterMove: (inp) => setTerrain(inp, 'Misty')
  },
  'Max Overgrowth': {
    name: 'Max Overgrowth', type: 'Grass',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'Single Opponent',
    flavor: 'The user unleashes a Leafy max move. This causes Grassy Terrain to cover the field.',
    onAfterMove: (inp) => setTerrain(inp, 'Grassy')
  },
  'Max Strike': {
    name: 'Max Strike', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents', // FIXME
    flavor: 'The user unleashes a Damaging max move. This causes opponent speeds to fall.',
    onAfterMove: (inp) => BUFF_STAT(inp.target, inp, 'speed', -1)
  },
  'Max Airstream': {
    name: 'Max Airstream', type: 'Flying',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user unleashes a Windy max move. This causes ally speeds to rise.',
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'speed', 1)
  },
  'Max Knuckle': {
    name: 'Max Knuckle', type: 'Fighting',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user unleashes a Punchy max move. This causes ally attack to rise.',
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'attack', 1)
  },
  'Max Wyrmwind': {
    name: 'Max Wyrmwind', type: 'Dragon',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user unleashes a Draconic max move. This causes opponent attacks to fall.',
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'attack', -1)
  },
  'Max Steelspike': {
    name: 'Max Steelspike', type: 'Steel',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user unleashes a Sharp max move. This causes ally defenses to rise.',
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'defense', 1)
  },
  'Max Phantasm': {
    name: 'Max Phantasm', type: 'Ghost',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user unleashes a Ghastly max move. This causes opponent defenses to fall.',
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'defense', -1)
  },
  'Max Ooze': {
    name: 'Max Ooze', type: 'Poison',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user unleashes a Toxic max move. This causes ally special attack to rise.',
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'spAttack', 1)
  },
  'Max Flutterby': {
    name: 'Max Flutterby', type: 'Bug',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user unleashes a Buggy max move. This causes opponent special attacks to fall.',
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'spAttack', -1)
  },
  'Max Quake': {
    name: 'Max Quake', type: 'Ground',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user unleashes an Earthy max move. This causes ally special defenses to rise.',
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'spDefense', 1)
  },
  'Max Darkness': {
    name: 'Max Darkness', type: 'Dark',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user unleashes a Dark max move. This causes opponent special defenses to fall.',
    onAfterMove: (inp) => BUFF_STAT(inp.caster, inp, 'spDefense', -1)
  },
  /* G-Max Moves Listings */
  'G-Max Vine Lash': {
    name: 'G-Max Vine Lash', type: 'Grass',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user lashes foes with massive vines. These vines stay on the field for several turns, continuing to damage the opponent.',
    onAfterMove: (inp) => {
      if (inp.target.type1 === 'Grass' || inp.target.type2 === 'Grass') {
        return new Log()
      }
      return APPLY_TEMP_STATUS(inp.target, {...ConditionMap.Bound},
        `${inp.target.species} is struck by vines all around it`)
    }
  },
  'G-Max Wildfire': {
    name: 'G-Max Wildfire', type: 'Fire',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user lashes foes with overwhelming heat. These flames stay on the field for several turns, continuing to damage the opponent.',
    onAfterMove: (inp) => {
      if (inp.target.type1 === 'Fire' || inp.target.type2 === 'Fire') {
        return new Log()
      }
      return APPLY_TEMP_STATUS(inp.target, {...ConditionMap.Bound},
        `${inp.target.species} is struck by scorching flames all around it`)
    }
  },
  'G-Max Cannonade': {
    name: 'G-Max Cannonade', type: 'Water',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user lashes foes with torrents of water. This water stays on the field for several turns, continuing to damage the opponent.',
    onAfterMove: (inp) => {
      if (inp.target.type1 === 'Water' || inp.target.type2 === 'Water') {
        return new Log()
      }
      return APPLY_TEMP_STATUS(inp.target, {...ConditionMap.Bound},
        `${inp.target.species} is struck by a downpour all around it`)
    }
  },
  'G-Max Befuddle': {
    name: 'G-Max Befuddle', type: 'Bug',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user strikes with a flurry of pollen. All opponents become poisoned, paralyzed, or fall asleep.',
    onAfterMove: (inp) => {
      const p = Math.random()
      if (p <= 0.33) {
        return Sleep(inp, 1)
      }
      if (p <= 0.67) {
        return Poison(inp, 1)
      }
      return Paralyze(inp, 1)
    }
  },
  'G-Max Volt Crash': {
    name: 'G-Max Volt Crash', type: 'Electric',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user strikes a massive bolt of lightning. All opponents become paralyzed.',
    onAfterMove: (inp) => Paralyze(inp, 1),
  },
  'G-Max Gold Rush': {
    name: 'G-Max Gold Rush', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user befuddles the opponents with a rush of coinage. All opponents become confused.',
    onAfterMove: (inp) => {
      inp.field.sides[inp.prefix].goldCoins = true
      return Confuse(inp, 1)
    },
  },
  'G-Max Chi Strike': {
    name: 'G-Max Chi Strike', type: 'Fighting',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user strikes with deep focus. All allies see their critical hits become more likely.',
    onAfterMove: (inp) => {
      return BUFF_STAT(inp.caster, inp, 'criticalHit', 1)
    },
  },
  'G-Max Terror': {
    name: 'G-Max Terror', type: 'Ghost',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'Single Opponent',
    flavor: 'The user terrifies the opponents. They become trapped in battle.',
    onAfterMove: (inp) => {
      return APPLY_TEMP_STATUS(inp.target, {...ConditionMap.TrappedInBattle},
        `${inp.target.species} became infatuated by the Gigantamax Gengar.`)
    },
  },
  'G-Max Foam Burst': {
    name: 'G-Max Foam Burst', type: 'Water',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user covers opponents in thick seafoam. All opponents see their speed drop a lot.',
    onAfterMove: (inp) => {
      return BUFF_STAT(inp.target, inp, 'speed', -2)
    },
  },
  'G-Max Resonance': {
    name: 'G-Max Resonance', type: 'Ice',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user emits a wondrous song. A veil of energy reduces damage from foes.',
    onAfterMove: (inp) => {
      inp.field.sides[inp.prefix].reflect = 5
      inp.field.sides[inp.prefix].lightscreen = 5
      return new Log().add(`A veil covered ${inp.prefix} Side of the field.`)
    },
  },
  'G-Max Cuddle': {
    name: 'G-Max Cuddle', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user wraps its warm, fluffy body around the opponents. They will become infatuated.',
    onAfterMove: (inp) => {
      return APPLY_TEMP_STATUS(inp.target, {...ConditionMap.Infatuated},
        `${inp.target.species} became infatuated by the Gigantamax Eevee.`)
    },
  },
  'G-Max Replenish': {
    name: 'G-Max Replenish', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user strikes with natural forces. Berries might grow back as well.',
    onAfterMove: (inp) => {
      if (Math.random() < 0.5) {
        inp.caster.heldItemConsumed = false
        inp.caster.heldItemTotallyConsumed = false
        return new Log().add(`${inp.caster.species} sees its ${inp.caster.heldItemKey} grow back`)
      }
      return new Log()
    },
  },
  'G-Max Malodor': {
    name: 'G-Max Malodor', type: 'Poison',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user strikes with a surge of sludge. All opponents become poisoned.',
    onAfterMove: (inp) => Poison(inp, 1),
  },
  'G-Max Meltdown': {
    name: 'G-Max Meltdown', type: 'Normal',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    // MSG uses Torment but that doesn't apply here.
    flavor: 'The user wraps strikes with liquid metal from its own body. Opponents become taunted.',
    onAfterMove: (inp) => {
      return APPLY_TEMP_STATUS(inp.target, {...ConditionMap.Taunted},
        `${inp.target.species} can not use support moves.`)
    },
  },
  'G-Max Drum Solo': {
    name: 'G-Max Drum Solo', type: 'Grass',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.8, accuracy: Infinity, criticalHit: 0, aoe: 'Single Opponent',
    flavor: 'The user uses the power of Rock & Roll to attack with vines.',
  },
  'G-Max Fireball': {
    name: 'G-Max Fireball', type: 'Fire',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.8, accuracy: Infinity, criticalHit: 0, aoe: 'Single Opponent',
    flavor: 'The user uses the power of Fire to attack with a massive flaming orb.',
  },
  'G-Max Hydrosnipe': {
    name: 'G-Max Hydrosnipe', type: 'Water',
    attackKey: 'attack', defenseKey: 'defense',
    power: 1.8, accuracy: Infinity, criticalHit: 0, aoe: 'Single Opponent',
    flavor: 'The user uses the power of high-pressure water to strike the opponent.',
  },
  'G-Max Wind Rage': {
    name: 'G-Max Wind Rage', type: 'Flying',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user blows sharp winds. The opponent side of the field sees things blow away.',
    onAfterMove: ({target, field, prefix, targetPrefix}) => {
      const log = new Log()
      log.add('The field was cleared.')

      field.sides[prefix].lightscreen = 0
      field.sides[prefix].reflect = 0
      field.sides[prefix].mist = 0

      field.sides[targetPrefix].lightscreen = 0
      field.sides[targetPrefix].reflect = 0
      field.sides[targetPrefix].mist = 0

      field.terrain = undefined

      if (getCondition(target, 'Safeguard')) {
        // Doesn't hit all targets. This is a known issue.
        removeCondition(target, 'Safeguard')
        log.add(`${target.species} safeguard was removed`)
      }

      if (field.weather.name === 'Fog') {
        // Well, defog it then!
        // Sunny is the default.
        field.weather = {...Weathers.Sunny}
      }
      return log
    }
  },
  'G-Max Gravitas': {
    name: 'G-Max Gravitas', type: 'Psychic',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user strikes with intense gravity. Opponents are thrust to the ground.',
    onAfterMove: ({target}) => {
      const log = new Log()
      if (target.type1 === 'Flying' || target.type2 === 'Flying') {
        APPLY_TEMP_STATUS(target, ConditionMap['Grounded'], `${target.species} landed.`)
      } else if (getCondition(target, 'Float') || getCondition(target, 'FloatUnintentional') || getCondition(target, 'Levitating')) {
        APPLY_TEMP_STATUS(target, ConditionMap['Grounded'], `${target.species} landed.`)
      } else {
        APPLY_TEMP_STATUS(target, ConditionMap['Grounded'])
      }
      return log
    },
  },
  'G-Max Stonesurge': {
    name: 'G-Max Stonesurge', type: 'Water',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'Single Opponent',
    flavor: 'The user thrusts a great burst of water at the foe. Spiky rocks scatter across the field aftewards.',
    onAfterMove: (inp) => {
      inp.field.sides[inp.targetPrefix].stealthRock = true
      const l = new Log()
      l.add('Sharp stones scatter on the field')
      return l
    }
  },
  'G-Max Volcalith': {
    name: 'G-Max Volcalith', type: 'Rock',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user drops a volcanic rock on the opponents. These rocks stay on the field for several turns, continuing to damage the opponent.',
    onAfterMove: (inp) => {
      if (inp.target.type1 === 'Rock' || inp.target.type2 === 'Rock') {
        return new Log()
      }
      return APPLY_TEMP_STATUS(inp.target, {...ConditionMap.Bound},
        `${inp.target.species} is struck by lava rocks all around it`)
    }
  },
  'G-Max Tartness': {
    name: 'G-Max Tartness', type: 'Grass',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user strikes with tart applesauce. All opponents see their evasiveness drop.',
    onAfterMove: (inp) => {
      return BUFF_STAT(inp.target, inp, 'evasiveness', -1)
    },
  },
  'G-Max Sweetness': {
    name: 'G-Max Sweetness', type: 'Grass',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user strikes with sweet applesauce. All allies recover from status conditions.',
    onAfterMove: ({target}) => {
      const log = new Log()
      if (target.status) {
        log.add(`${target.species} is no longer ${target.status.name}`)
        target.status = undefined
        removeCondition(target, 'PoisonBad')
      }
      return log
    }
  },
  'G-Max Sandblast': {
    name: 'G-Max Sandblast', type: 'Ground',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user thrusts sandy winds at opponents. This sand stays on the field for several turns, continuing to damage the opponent.',
    onAfterMove: (inp) => {
      return APPLY_TEMP_STATUS(inp.target, {...ConditionMap.Bound},
        `${inp.target.species} is struck by sandy gusts all around it`)
    }
  },
  'G-Max Stun Shock': {
    name: 'G-Max Stun Shock', type: 'Electric',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user strikes with a jolt of poison. All opponents become poisoned or paralyzed.',
    onAfterMove: (inp) => {
      const p = Math.random()
      if (p <= 0.5) {
        return Poison(inp, 1)
      }
      return Paralyze(inp, 1)
    }
  },
  'G-Max Centiferno': {
    name: 'G-Max Centiferno', type: 'Fire',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user radiates intense heat at opponents. This heat stays on the field for several turns, continuing to damage the opponent.',
    onAfterMove: (inp) => {
      return APPLY_TEMP_STATUS(inp.target, {...ConditionMap.Bound},
        `${inp.target.species} is struck by firey winds all around it`)
    }
  },
  'G-Max Smite': {
    name: 'G-Max Smite', type: 'Fairy',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user releases Fairy power upon the opponents. All opponents become confused.',
    onAfterMove: (inp) => Confuse(inp, 1),
  },
  'G-Max Snooze': {
    name: 'G-Max Snooze', type: 'Dark',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user releases Sleepy power upon the opponents. Many opponents become drowsy.',
    onAfterMove: ({target}) => {
      if (Math.random() < 0.5) return new Log()
      return APPLY_TEMP_STATUS(target, ConditionMap.Drowsy,
        `${target.species} grew drowsy.`)
    }
  },
  'G-Max Finale': {
    name: 'G-Max Finale', type: 'Fairy',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Allies',
    flavor: 'The user puts the cherry on top. It is a huge cherry! Allies restore health.',
    onAfterMove: ({target}) => {
      return logHeal(target, target.totalHp / 6)
    }
  },
  'G-Max Steelsurge': {
    name: 'G-Max Steelsurge', type: 'Steel',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user strikes with huge steel spikes. These spikes scatter across the opponent side of the field',
    onAfterMove: (inp) => {
      inp.field.sides[inp.targetPrefix].sharpSteel = true
      return new Log().add('Steel spikes cover the floor')
    }
  },
  'G-Max Depletion': {
    name: 'G-Max Depletion', type: 'Dragon',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'Single Opponent',
    flavor: 'The user strikes with an unusual draconic power. It loses the ability to use one of its moves.',
    onAfterMove: (inp) => {
      const firstMove = inp.caster.movepool[0]
      inp.caster.movepool.shift()
      inp.caster.move.shift()
      return new Log().add(`${inp.caster.species} has lost the ability to use ${firstMove.name}`)
    }
  },
  'G-Max One Blow': {
    name: 'G-Max One Blow', type: 'Dark',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user strikes through any protective layers.',
    onBeforeMove: ({target}) => {
      if (getCondition(target, 'Protect')) {
        // Break through Protect
        removeCondition(target, 'Protect')
      }
      return new Log()
    },
  },
  'G-Max Rapid Flow': {
    name: 'G-Max Rapid Flow', type: 'Water',
    attackKey: 'attack', defenseKey: 'defense',
    power: 0, accuracy: Infinity, criticalHit: 0, aoe: 'All Opponents',
    flavor: 'The user strikes through any protective layers.',
    onBeforeMove: ({target}) => {
      if (getCondition(target, 'Protect')) {
        // Break through Protect
        removeCondition(target, 'Protect')
      }
      return new Log()
    },
  },
}

// Copies of moves and special moves.
Movepool['Double-Edge_Aerilate'] = {...Movepool['Double-Edge']}
Movepool['Double-Edge_Aerilate'].type = 'Flying'
Movepool['Double-Edge_Galvanize'] = {...Movepool['Double-Edge']}
Movepool['Double-Edge_Galvanize'].type = 'Electric'
Movepool['Self-Destruct_Galvanize'] = {...Movepool['Self-Destruct']}
Movepool['Self-Destruct_Galvanize'].type = 'Electric'
Movepool['Hyper Voice_Pixelate'] = {...Movepool['Hyper Voice']}
Movepool['Hyper Voice_Pixelate'].type = 'Fairy'
Movepool['Body Slam_Refrigerate'] = {...Movepool['Body Slam']}
Movepool['Body Slam_Refrigerate'].type = 'Ice'
Movepool['Water Shuriken_BattleBond'] = {...Movepool['Water Shuriken']}
Movepool['Water Shuriken_BattleBond'].onBeforeMove = ({move}) => HIT_MANY(move, 0.2, 3, 3),
Movepool['Thunder Wave_Normalize'] = {...Movepool['Thunder Wave']}
Movepool['Thunder Wave_Normalize'].type = 'Normal'
Movepool['Hyper Voice_LiquidVoice'] = {...Movepool['Hyper Voice']}
Movepool['Hyper Voice_LiquidVoice'].type = 'Water'

// Fixed type.
for (const t of types) {
  Movepool[`Hidden Power_${t}`] = {...Movepool['Hidden Power']}
  Movepool[`Hidden Power_${t}`].type = t
  Movepool[`Hidden Power_${t}`].onGetType = undefined
}
