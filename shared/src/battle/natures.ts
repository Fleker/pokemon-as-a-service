import randomItem from "../random-item"
import { SupportMoves, MoveId } from "../gen/type-move-meta"
import { typeMultiplier } from "./typeMultiplier"
import { Movepool } from "./movepool"
import { getCondition } from './conditions'
import { Move, Pokemon, Stat, Field } from "./types"
import { Nature } from '../badge3'
import { typeMatchup } from "./matchup"

export type TargetSelection = (self: Pokemon, turnCount: number, targets: Pokemon[]) => Pokemon
export type MoveSelection = (self: Pokemon, target: Pokemon, field: Field, turnCount: number, inTurnCount: number) => Move | undefined

export const statAdjustment: Record<Nature, {buff?: Stat, nerf?: Stat}> = {
  Hardy: {},
  Adamant: { buff: 'attack', nerf: 'spAttack' },
  Bold: { buff: 'defense', nerf: 'attack' },
  Timid: { buff: 'speed', nerf: 'attack' },
  Modest: { buff: 'spAttack', nerf: 'attack' },
  Calm: { buff: 'spDefense', nerf: 'attack' },
  Naughty: { buff: 'attack', nerf: 'spDefense' },
  Jolly: { buff: 'speed', nerf: 'spAttack' },
  Docile: {},
  Serious: {},
  Bashful: {},
  Quirky: {},
  Neutral: {},
}

const sortByTypeMatchup = (self: Pokemon, a: Pokemon, b: Pokemon) => {
  const matches = [a, b].map(p => {
    let mult = 1
    mult *= typeMatchup[self.type1][p.type1]
    if (self.type2) {
      mult *= typeMatchup[self.type2][p.type1]
    }
    if (p.type2) {
      mult *= typeMatchup[self.type1][p.type2]
      if (self.type2) {
        mult *= typeMatchup[self.type2][p.type2]
      }
    }
    return mult
  })
  return matches[1] - matches[0]
}

export const targetSelection: Record<Nature, TargetSelection> = {
  Hardy: (_, __, t) => t[0],
  Adamant: (self, __, t) => t.sort((a, b) => sortByTypeMatchup(self, a, b))[0],
  Bold: (_, __, t) => t.sort((a, b) => b.currentHp - a.currentHp)[0],
  Timid: (_, __, t) => t.sort((a, b) => (a.defense + a.spDefense) - (b.defense + a.spDefense))[0],
  Modest: (_, __, t) => t.sort((a, b) => a.speed - b.speed)[0],
  Calm: (_, __, t) => t.sort((a, b) => b.speed - a.speed)[0],
  Naughty: (_, __, t) => t.sort((a, b) => a.currentHp - b.currentHp)[0],
  Jolly: (_, __, t) => t.sort((a, b) => (b.defense + b.spDefense) - (a.defense + a.spDefense))[0],
  Docile: (_, __, t) => t[0],
  Serious: (_, __, t) => t[0],
  Bashful: (_, __, t) => t[0],
  Quirky: (_, __, t) => t[0],
  Neutral: (_, __, t) => t[0],
}

/**
 * Returns a selected move if the user is locked into a move.
 * @param caster Pokémon using move
 * @returns A Movepool entry if valid, undefined if not
 */
const getLockedInMove = (caster) => {
  if (getCondition(caster, 'Biding')) {
    return {...Movepool.Bide}
  }
  if (getCondition(caster, 'Focused')) {
    return {...Movepool['Focus Punch']}
  }
  if (getCondition(caster, 'InAir')) {
    return {...Movepool.Fly}
  }
  if (getCondition(caster, 'AShadow')) {
    return {...Movepool['Shadow Force']}
  }
  if (getCondition(caster, 'WindingRazors')) {
    return {...Movepool['Razor Wind']}
  }
  if (getCondition(caster, 'SkullDrawn')) {
    return {...Movepool['Skull Bash']}
  }
  if (getCondition(caster, 'SkyPrepared')) {
    return {...Movepool['Sky Attack']}
  }
  if (getCondition(caster, 'Geomancying')) {
    return {...Movepool['Geomancy']}
  }
  if (getCondition(caster, 'Outraged')) {
    return {...Movepool.Outrage}
  }
  if (getCondition(caster, 'Petal Dancing')) {
    return {...Movepool["Petal Dance"]}
  }
  if (getCondition(caster, 'Thrashing')) {
    return {...Movepool.Thrash}
  }
  if (getCondition(caster, 'Fury Raging')) {
    return {...Movepool['Raging Fury']}
  }
  if (getCondition(caster, 'Underground')) {
    return {...Movepool.Dig}
  }
  if (getCondition(caster, 'Underwater')) {
    return {...Movepool.Dive}
  }
  if (getCondition(caster, 'SkyDropping')) {
    return {...Movepool['Sky Drop']}
  }
  return undefined
}

/**
 * Gets the support move to use if that weather move is not already set.
 * @param supportMove Move potentially being used
 * @param field Current field conditions
 * @returns Move if reasonable, undefined if not
 */
const getWeatherChangeMove = (supportMove, field) => {
  if (supportMove.name === 'Rain Dance' && field.weather.name !== 'Rain') {
    return supportMove
  }
  if (supportMove.name === 'Hail' && field.weather.name !== 'Hail') {
    return supportMove
  }
  if (supportMove.name === 'Sandstorm' && field.weather.name !== 'Sandstorm') {
    return supportMove
  }
  if (supportMove.name === 'Sunny Day' && field.weather.name !== 'Heat Wave') {
    return supportMove
  }
  if (supportMove.name !== 'Rain Dance' &&
      supportMove.name !== 'Hail' &&
      supportMove.name !== 'Sandstorm' &&
      supportMove.name !== 'Sunny Day') {
        return supportMove
  }
  return undefined
}

/**
 * Computes the net multiplier of all possible boosts and nerfs taking into
 * account caster held item and field specifics.
 * @param caster Pokémon using the move
 * @param field The field on which the move is being used
 * @param move The move itself being used
 * @returns The net multiplier
 */
const itemFieldModifier = (caster, field, move) => {
  return ((move.type === 'Fire' && field.weather.name === 'Heat Wave') ? 1.5 : 1) *
  ((move.type === 'Water' && field.weather.name === 'Heat Wave') ? 0.5 : 1) *
  ((move.type === 'Fire' && field.weather.name === 'Rain') ? 0.5 : 1) *
  ((move.type === 'Water' && field.weather.name === 'Rain') ? 1.5 : 1) *
  ((move.type === 'Electric' && field.mudSport) ? 0.5 : 1) *
  ((move.type === 'Fire' && field.fireSport) ? 0.5 : 1) *
  ((move.type === 'Grass' && field.terrain?.name === 'Grassy') ? 1.3 : 1) *
  ((move.type === 'Electric' && field.terrain?.name === 'Electric') ? 1.3 : 1) *
  ((move.type === 'Psychic' && field.terrain?.name === 'Psychic') ? 1.3 : 1) *
  ((move.type === 'Dragon' && field.terrain?.name === 'Misty') ? 0.5 : 1) *
  ((move.sound && getCondition(caster, 'Speechless')) ? 0 : 1) *
  ((move.type === 'Fighting' && caster.heldItemKey === 'blackbelt') ? 1.2 : 1) *
  ((move.type === 'Dark' && caster.heldItemKey === 'blackglasses') ? 1.2 : 1) *
  ((move.type === 'Fire' && caster.heldItemKey === 'charcoal') ? 1.2 : 1) *
  ((move.type === 'Dragon' && caster.heldItemKey === 'dragonfang') ? 1.2 : 1) *
  ((move.type === 'Rock' && caster.heldItemKey === 'hardstone') ? 1.2 : 1) *
  ((move.type === 'Electric' && caster.heldItemKey === 'magnet') ? 1.2 : 1) *
  ((move.type === 'Steel' && caster.heldItemKey === 'metalcoat') ? 1.2 : 1) *
  ((move.type === 'Grass' && caster.heldItemKey === 'miracleseed') ? 1.2 : 1) *
  ((move.type === 'Water' && caster.heldItemKey === 'mysticwater') ? 1.2 : 1) *
  ((move.type === 'Ice' && caster.heldItemKey === 'nevermeltice') ? 1.2 : 1) *
  ((move.type === 'Poison' && caster.heldItemKey === 'poisonbarb') ? 1.2 : 1) *
  ((move.type === 'Flying' && caster.heldItemKey === 'sharpbeak') ? 1.2 : 1) *
  ((move.type === 'Normal' && caster.heldItemKey === 'silkscarf') ? 1.2 : 1) *
  ((move.type === 'Bug' && caster.heldItemKey === 'silverpowder') ? 1.2 : 1) *
  ((move.type === 'Ground' && caster.heldItemKey === 'softsand') ? 1.2 : 1) *
  ((move.type === 'Ghost' && caster.heldItemKey === 'spelltag') ? 1.2 : 1) *
  ((move.type === 'Psychic' && caster.heldItemKey === 'twistedspoon') ? 1.2 : 1)
}

/**
 * Computes multiplier based on conditions on the target.
 * @param target Target being struck
 * @param mult Type-effectiveness multiplier
 * @param moveType Type of the move being used
 * @returns Multiplier of boosts
 */
const conditionsModifier = (target, mult, moveType) => {
  if (getCondition(target, 'Grounded') && moveType === 'Ground' && mult === 0) {
    // Can be hit by ground moves.
    return 1
  }
  if (getCondition(target, 'Float') && moveType === 'Ground') {
    return 0
  }
  if (getCondition(target, 'FloatUnintentional') && moveType === 'Ground') {
    return 0
  }
  return 1
}

/**
 * Calculate the average net power of a given move.
 * Takes into account accuracy.
 */
const getNetPower = (caster, target, field, move) => {
  const moveType = (() => {
    if (move.onGetType) return move.onGetType(caster, field, move)
    return move.type
  })()
  const {mult} = typeMultiplier(target, moveType)
  let stabMult = 1
  if (moveType === caster.type1 || moveType === caster.type2) {
    stabMult = 1.5
  }
  const accuracy = Math.min(move.accuracy, 1.01)
  const power = Math.min(move.power, 5)
  return mult * power * accuracy * stabMult
    * itemFieldModifier(caster, field, move) * conditionsModifier(target, mult, moveType)
}

/**
 * Calculate the average net power of a given move.
 * Does not take into account accuracy.
 */
const getTotalPower = (caster, target, field, move) => {
  const moveType = (() => {
    if (move.onGetType) return move.onGetType(caster, field, move)
    return move.type
  })()
  const {mult} = typeMultiplier(target, moveType)
  let stabMult = 1
  if (moveType === caster.type1 || moveType === caster.type2) {
    stabMult = 1.5
  }
  const power = Math.min(move.power, 5)
  return mult * power * stabMult
    * itemFieldModifier(caster, field, move) * conditionsModifier(target, mult, moveType)
}

/**
 * Calculate the average net power of a given move.
 * Does not take into account accuracy.
 * Takes into account attack/defense ratio.
 */
const getRatioPower = (caster, target, field, move) => {
  const moveType = (() => {
    if (move.onGetType) return move.onGetType(caster, field, move)
    return move.type
  })()
  const {mult} = typeMultiplier(target, moveType)
  let stabMult = 1
  if (moveType === caster.type1 || moveType === caster.type2) {
    stabMult = 1.5
  }
  const ratioPower = caster[move.attackKey] / target[move.defenseKey]
  const power = Math.min(move.power, 5)
  return mult * power * stabMult * ratioPower
    * itemFieldModifier(caster, field, move) * conditionsModifier(target, mult, moveType)
}

/**
 * Calculate the Timid-optimized power of a given move.
 */
const getTimidPower = (caster, target, field, move) => {
  const moveType = (() => {
    if (move.onGetType) return move.onGetType(caster, field, move)
    return move.type
  })()
  const {mult} = typeMultiplier(target, moveType)
  let stabMult = 1
  if (moveType === caster.type1 || moveType === caster.type2) {
    stabMult = 1.5
  }
  const accuracy = Math.min(move.accuracy, 1.01)
  const power = Math.min(move.power, 5)
  const targetMult = move.aoe === 'Single Opponent' ? 2 : 1
  return mult * power * accuracy * stabMult * targetMult
    * itemFieldModifier(caster, field, move) * conditionsModifier(target, mult, moveType)
}

/**
 * Calculate the Modest-optimized power of a given move.
 */
const getModestPower = (caster, target, field, move) => {
  const moveType = (() => {
    if (move.onGetType) return move.onGetType(caster, field, move)
    return move.type
  })()
  const {mult} = typeMultiplier(target, moveType)
  let stabMult = 1
  if (moveType === caster.type1 || moveType === caster.type2) {
    stabMult = 1.5
  }
  const accuracy = Math.min(move.accuracy, 1.01)
  const power = Math.min(move.power, 5)
  const targetMult = move.aoe === 'Single Opponent' ? 2 : 1
  const moveMetaMult = (() => {
    let mult = 1
    if (!move.sound) mult *= 2
    if (!move.contact) mult *= 2
    return mult
  })()
  return mult * power * accuracy * stabMult * targetMult * moveMetaMult
    * itemFieldModifier(caster, field, move) * conditionsModifier(target, mult, moveType)
}

/**
 * Calculate the Calm-optimized power of a given move.
 */
const getCalmPower = (caster, target, field, move) => {
  const moveType = (() => {
    if (move.onGetType) return move.onGetType(caster, field, move)
    return move.type
  })()
  const {mult} = typeMultiplier(target, moveType)
  let stabMult = 1
  if (moveType === caster.type1 || moveType === caster.type2) {
    stabMult = 1.5
  }
  const accuracy = Math.min(move.accuracy, 1.01)
  const power = Math.min(move.power, 5)
  const targetMult = (() => {
    if (move.aoe === 'Everyone') return 4
    if (move.aoe === 'All Opponents') return 3
    if (move.aoe === 'Nearby Opponents') return 2
    return 1 
  })()
  return mult * power * accuracy * stabMult * targetMult
    * itemFieldModifier(caster, field, move) * conditionsModifier(target, mult, moveType)
}

/**
 * Calculate the Naughty-optimized power of a given move.
 */
const getNaughtyPower = (caster, target, field, move) => {
  const moveType = (() => {
    if (move.onGetType) return move.onGetType(caster, field, move)
    return move.type
  })()
  const {mult} = typeMultiplier(target, moveType)
  let stabMult = 1
  if (moveType === caster.type1 || moveType === caster.type2) {
    stabMult = 1.5
  }
  const accuracy = Math.min(move.accuracy, 1.01)
  const power = Math.min(move.power, 5)
  const targetMult = (() => {
    if (move.aoe === 'Everyone') return 2
    if (move.aoe === 'All Opponents') return 2
    if (move.aoe === 'Nearby Opponents') return 2
    return 1 
  })()
  const moveMetaMult = (() => {
    let mult = 1
    if (move.priority > 0) mult *= 2
    if (move.onBeforeMove) mult *= 1.5
    if (move.onAfterMove) mult *= 1.5
    return mult
  })()
  return mult * power * accuracy * stabMult * targetMult * moveMetaMult
    * itemFieldModifier(caster, field, move) * conditionsModifier(target, mult, moveType)
}

/**
 * Calculate the Naughty-optimized power of a given move.
 */
const getJollyPower = (caster, target, field, move) => {
  const moveType = (() => {
    if (move.onGetType) return move.onGetType(caster, field, move)
    return move.type
  })()
  const {mult} = typeMultiplier(target, moveType)
  let stabMult = 1
  if (moveType === caster.type1 || moveType === caster.type2) {
    stabMult = 1.5
  }
  const accuracy = Math.min(move.accuracy, 1.01)
  const power = Math.min(move.power, 5)
  const targetMult = (() => {
    if (move.aoe === 'Single Opponent') return 3
    return 1 
  })()
  const moveMetaMult = (() => {
    let mult = 1
    if (move.priority > 0) mult *= 2
    if (move.onBeforeMove) mult *= 1.5
    if (move.onAfterMove) mult *= 1.5
    return mult
  })()
  return mult * power * accuracy * stabMult * targetMult * moveMetaMult
    * itemFieldModifier(caster, field, move) * conditionsModifier(target, mult, moveType)
}

/**
 * The move selection function that runs by default.
 * @param caster Caster using the move
 * @param target Target receiving the move
 * @param field Field on which move is executed
 * @param turnCount How many turns have elapsed
 * @param inTurnCount How many moves this Pokémon has used this turn (really only useful for raids)
 * @returns The move that the caster Pokémon will use.
 */
const defaultMoveSelection: MoveSelection = (caster, target, field, turnCount, inTurnCount) => {
  const damageMoves = caster.movepool
      .filter(m => !SupportMoves.includes(m.name as MoveId))
  const secondaryMoves = caster.movepool
      .filter(m => SupportMoves.includes(m.name as MoveId) && !m.recovery)
  const hasSupportMoves = secondaryMoves.length > 0
  const healingMoves = secondaryMoves.filter(x => x.recovery)
  const isRaidBoss = getCondition(caster, 'Raid')

  // Secondary move logic
  if (!isRaidBoss && hasSupportMoves && turnCount === 0 && inTurnCount === 0) {
    const supportMove = {...randomItem(secondaryMoves)} as Move
    const weatherMove = getWeatherChangeMove(supportMove, field)
    if (weatherMove) return weatherMove
  }

  // For Pokemon with recovery moves
  if (!isRaidBoss && hasSupportMoves && turnCount === 2 && inTurnCount === 0) {
    // Do it only on Turn #3
    // We should probably improve this determination in the future
    if (healingMoves.length) {
      return randomItem(healingMoves)
    }
  }

  // Raid move logic
  if (isRaidBoss && hasSupportMoves && !(turnCount % 3) && inTurnCount === 1) {
    // Use once every 3 turns in a second slot
    const supportMove = {...randomItem(secondaryMoves)} as Move
    const weatherMove = getWeatherChangeMove(supportMove, field)
    if (weatherMove) return weatherMove
  }

  // Locked-in moves
  const lockInMove = getLockedInMove(caster)
  if (lockInMove) return lockInMove

  // Default move logic: Get move with net highest power.
  let bestMove = caster.movepool[0]
  let bestMult = 0
  damageMoves.forEach(move => {
    const multUnderTest = getNetPower(caster, target, field, move)
    if (multUnderTest > bestMult) {
      bestMove = move
      bestMult = multUnderTest
    }
  })
  if (bestMult === 0) {
    // If all of a Pokémon's moves are not
    // available, provide some sort of default.
    return {...Movepool.Struggle}
  }
  return {...bestMove}
}

/** First turn use status move if on self or ally. Else use best move (no accuracy check) */
const adamantMoveSelection: MoveSelection = (caster, target, field, turnCount, inTurnCount) => {
  const damageMoves = caster.movepool
      .filter(m => !SupportMoves.includes(m.name as MoveId))
  const secondaryMoves = caster.movepool
      .filter(m => SupportMoves.includes(m.name as MoveId) && !m.recovery)
      .filter(m => ['All Allies', 'Single Ally', 'Self'].includes(m.aoe))
  const hasSupportMoves = secondaryMoves.length > 0
  const isRaidBoss = getCondition(caster, 'Raid')

  // Secondary move logic
  if (!isRaidBoss && hasSupportMoves && turnCount === 0 && inTurnCount === 0) {
    const supportMove = {...randomItem(secondaryMoves)} as Move
    const weatherMove = getWeatherChangeMove(supportMove, field)
    if (weatherMove) return weatherMove
  }

  // Locked-in moves
  const lockInMove = getLockedInMove(caster)
  if (lockInMove) return lockInMove

  // Default move logic: Get move with net highest power.
  let bestMove = caster.movepool[0]
  let bestMult = 0
  damageMoves.forEach(move => {
    const multUnderTest = getRatioPower(caster, target, field, move)
    if (multUnderTest > bestMult) {
      bestMove = move
      bestMult = multUnderTest
    }
  })
  if (bestMult === 0) {
    // If all of a Pokémon's moves are not
    // available, provide some sort of default.
    return {...Movepool.Struggle}
  }
  return {...bestMove}
}

/** Uses the move with highest power regardless of accuracy. Never uses status moves. */
const boldMoveSelection: MoveSelection = (caster, target, field) => {
  const damageMoves = caster.movepool
      .filter(m => !SupportMoves.includes(m.name as MoveId))

  // Locked-in moves
  const lockInMove = getLockedInMove(caster)
  if (lockInMove) return lockInMove

  // Default move logic: Get move with net highest power.
  let bestMove = caster.movepool[0]
  let bestMult = 0
  damageMoves.forEach(move => {
    const multUnderTest = getTotalPower(caster, target, field, move)
    if (multUnderTest > bestMult) {
      bestMove = move
      bestMult = multUnderTest
    }
  })
  if (bestMult === 0) {
    // If all of a Pokémon's moves are not
    // available, provide some sort of default.
    return {...Movepool.Struggle}
  }
  return {...bestMove}
}

/** Uses status first turn. Status every other turn when in danger. Recovery when allies in danger. Higher accuracy, single opponent. */
const timidMoveSelection: MoveSelection = (caster, target, field, turnCount, inTurnCount) => {
  const damageMoves = caster.movepool
      .filter(m => !SupportMoves.includes(m.name as MoveId))
  const secondaryMoves = caster.movepool
      .filter(m => SupportMoves.includes(m.name as MoveId) && !m.recovery)
  const hasSupportMoves = secondaryMoves.length > 0
  const healingMoves = secondaryMoves.filter(x => x.recovery)
  const isInDanger = caster.currentHp / caster.totalHp < 0.33

  // Secondary move logic
  if (hasSupportMoves && turnCount === 0 && inTurnCount === 0) {
    const supportMove = {...randomItem(secondaryMoves)} as Move
    const weatherMove = getWeatherChangeMove(supportMove, field)
    if (weatherMove) return weatherMove
  }
  if (hasSupportMoves && turnCount % 2 === 0 && inTurnCount === 0 && isInDanger) {
    const supportMove = {...randomItem(secondaryMoves)} as Move
    const weatherMove = getWeatherChangeMove(supportMove, field)
    if (weatherMove) return weatherMove
  }
  // TODO: Add allies into MoveSelection param
  if (hasSupportMoves && turnCount === 2 && inTurnCount === 0) {
    if (healingMoves.length) {
      return randomItem(healingMoves)
    }
  }

  // Locked-in moves
  const lockInMove = getLockedInMove(caster)
  if (lockInMove) return lockInMove

  // Default move logic: Get move with net highest power.
  let bestMove = caster.movepool[0]
  let bestMult = 0
  damageMoves.forEach(move => {
    const multUnderTest = getTimidPower(caster, target, field, move)
    if (multUnderTest > bestMult) {
      bestMove = move
      bestMult = multUnderTest
    }
  })
  if (bestMult === 0) {
    // If all of a Pokémon's moves are not
    // available, provide some sort of default.
    return {...Movepool.Struggle}
  }
  return {...bestMove}
}

/** Uses status first turn. Use recovery moves when it or allies in danger. Prioritize single target, non-contact, non-sound moves. */
const modestMoveSelection: MoveSelection = (caster, target, field, turnCount, inTurnCount) => {
  const damageMoves = caster.movepool
      .filter(m => !SupportMoves.includes(m.name as MoveId))
  const secondaryMoves = caster.movepool
      .filter(m => SupportMoves.includes(m.name as MoveId) && !m.recovery)
  const hasSupportMoves = secondaryMoves.length > 0
  const healingMoves = secondaryMoves.filter(x => x.recovery)
  const isInDanger = caster.currentHp / caster.totalHp < 0.33

  // Secondary move logic
  if (hasSupportMoves && turnCount === 0 && inTurnCount === 0) {
    const supportMove = {...randomItem(secondaryMoves)} as Move
    const weatherMove = getWeatherChangeMove(supportMove, field)
    if (weatherMove) return weatherMove
  }
  if (hasSupportMoves && turnCount % 2 === 0 && inTurnCount === 0 && isInDanger) {
    const supportMove = {...randomItem(secondaryMoves)} as Move
    const weatherMove = getWeatherChangeMove(supportMove, field)
    if (weatherMove) return weatherMove
  }
  // TODO: Add allies into MoveSelection param
  if (healingMoves.length && isInDanger) {
    return randomItem(healingMoves)
  }

  // Locked-in moves
  const lockInMove = getLockedInMove(caster)
  if (lockInMove) return lockInMove

  // Default move logic: Get move with net highest power.
  let bestMove = caster.movepool[0]
  let bestMult = 0
  damageMoves.forEach(move => {
    const multUnderTest = getModestPower(caster, target, field, move)
    if (multUnderTest > bestMult) {
      bestMove = move
      bestMult = multUnderTest
    }
  })
  if (bestMult === 0) {
    // If all of a Pokémon's moves are not
    // available, provide some sort of default.
    return {...Movepool.Struggle}
  }
  return {...bestMove}
}

/** Uses status regularly. Prioritize large AOE moves. */
const calmMoveSelection: MoveSelection = (caster, target, field, turnCount, inTurnCount) => {
  const damageMoves = caster.movepool
      .filter(m => !SupportMoves.includes(m.name as MoveId))
  const secondaryMoves = caster.movepool
      .filter(m => SupportMoves.includes(m.name as MoveId) && !m.recovery)
  const hasSupportMoves = secondaryMoves.length > 0
  const isInDanger = caster.currentHp / caster.totalHp < 0.33

  // Secondary move logic
  if (hasSupportMoves && turnCount === 0 && inTurnCount === 0) {
    const supportMove = {...randomItem(secondaryMoves)} as Move
    const weatherMove = getWeatherChangeMove(supportMove, field)
    if (weatherMove) return weatherMove
  }
  if (hasSupportMoves && turnCount % 2 === 0 && inTurnCount === 0 && isInDanger) {
    const supportMove = {...randomItem(secondaryMoves)} as Move
    const weatherMove = getWeatherChangeMove(supportMove, field)
    if (weatherMove) return weatherMove
  }

  // Locked-in moves
  const lockInMove = getLockedInMove(caster)
  if (lockInMove) return lockInMove

  // Default move logic: Get move with net highest power.
  let bestMove = caster.movepool[0]
  let bestMult = 0
  damageMoves.forEach(move => {
    const multUnderTest = getCalmPower(caster, target, field, move)
    if (multUnderTest > bestMult) {
      bestMove = move
      bestMult = multUnderTest
    }
  })
  if (bestMult === 0) {
    // If all of a Pokémon's moves are not
    // available, provide some sort of default.
    return {...Movepool.Struggle}
  }
  return {...bestMove}
}

/** Uses status first turn. Then go for high priority, large AOE moves with before/after effects. */
const naughtyMoveSelection: MoveSelection = (caster, target, field, turnCount, inTurnCount) => {
  const damageMoves = caster.movepool
      .filter(m => !SupportMoves.includes(m.name as MoveId))
  const secondaryMoves = caster.movepool
      .filter(m => SupportMoves.includes(m.name as MoveId) && !m.recovery)
  const hasSupportMoves = secondaryMoves.length > 0

  // Secondary move logic
  if (hasSupportMoves && turnCount === 0 && inTurnCount === 0) {
    const supportMove = {...randomItem(secondaryMoves)} as Move
    const weatherMove = getWeatherChangeMove(supportMove, field)
    if (weatherMove) return weatherMove
  }

  // Locked-in moves
  const lockInMove = getLockedInMove(caster)
  if (lockInMove) return lockInMove

  // Default move logic: Get move with net highest power.
  let bestMove = caster.movepool[0]
  let bestMult = 0
  damageMoves.forEach(move => {
    const multUnderTest = getNaughtyPower(caster, target, field, move)
    if (multUnderTest > bestMult) {
      bestMove = move
      bestMult = multUnderTest
    }
  })
  if (bestMult === 0) {
    // If all of a Pokémon's moves are not
    // available, provide some sort of default.
    return {...Movepool.Struggle}
  }
  return {...bestMove}
}

/** Uses status first turn (if on target). Recovery moves when in danger. Then go for high priority, small AOE moves with before/after effects. */
const jollyMoveSelection: MoveSelection = (caster, target, field, turnCount, inTurnCount) => {
  const damageMoves = caster.movepool
      .filter(m => !SupportMoves.includes(m.name as MoveId))
  const secondaryMoves = caster.movepool
      .filter(m => SupportMoves.includes(m.name as MoveId) && !m.recovery)
  const hasSupportMoves = secondaryMoves.length > 0
  const healingMoves = secondaryMoves.filter(x => x.recovery)
  const isInDanger = caster.currentHp / caster.totalHp < 0.33

  // Secondary move logic
  if (hasSupportMoves && turnCount === 0 && inTurnCount === 0) {
    const supportMove = {...randomItem(secondaryMoves)} as Move
    const weatherMove = getWeatherChangeMove(supportMove, field)
    if (weatherMove) return weatherMove
  }
  // TODO: Add allies into MoveSelection param
  if (healingMoves.length && isInDanger) {
    return randomItem(healingMoves)
  }

  // Locked-in moves
  const lockInMove = getLockedInMove(caster)
  if (lockInMove) return lockInMove

  // Default move logic: Get move with net highest power.
  let bestMove = caster.movepool[0]
  let bestMult = 0
  damageMoves.forEach(move => {
    const multUnderTest = getJollyPower(caster, target, field, move)
    if (multUnderTest > bestMult) {
      bestMove = move
      bestMult = multUnderTest
    }
  })
  if (bestMult === 0) {
    // If all of a Pokémon's moves are not
    // available, provide some sort of default.
    return {...Movepool.Struggle}
  }
  return {...bestMove}
}

export const moveSelection: Record<Nature, MoveSelection> = {
  Hardy: defaultMoveSelection,
  Adamant: adamantMoveSelection,
  Bold: boldMoveSelection,
  Timid: timidMoveSelection,
  Modest: modestMoveSelection,
  Calm: calmMoveSelection,
  Naughty: naughtyMoveSelection,
  Jolly: jollyMoveSelection,
  Docile: defaultMoveSelection,
  Serious: defaultMoveSelection,
  Bashful: defaultMoveSelection,
  Quirky: defaultMoveSelection,
  Neutral: defaultMoveSelection,
}
