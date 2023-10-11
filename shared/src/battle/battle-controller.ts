import { Rules } from "../battle-tiers"
import { ItemId, ITEMS } from "../items-list"
import { getCondition, removeCondition } from "./conditions"
import { typeMatchup } from "./matchup"
import { APPLY_TEMP_STATUS, APPLY_STATUS, Movepool } from "./movepool"
import { ConditionMap, StatusMap } from "./status"
import { Field, Log, Move, MoveInput, Pokemon, Prefix, logDamage, statBuff } from "./types"
import { moveSelection, targetSelection, TargetSelection, MoveSelection, statAdjustment } from "./natures"
import { Inventory } from './inventory'
import * as Pkmn from '../pokemon'
import { Badge } from '../badge3'
import { PokemonDoc } from "../pokemon/types"
import { Weathers } from "./weather"
import randomItem from '../random-item'
import { typeMultiplier, TypeMultiplier } from "./typeMultiplier"
import {Location} from '../locations-list'

export interface BattleOptions {
  opponentMoves?: (self: Pokemon) => number
  startMsg?: string
  lossMsg?: string
  victoryMsg?: string
  targetingLogic?: TargetSelection
  moveLogic?: MoveSelection
  pctLogs: Array<Array<number | string>>
}

export class CasterTurnMove extends Log {
  move: Move
  target: Pokemon
}
export type BattlePosition = 'PRIMARY' | 'SECONDARY'
export function getCasterTurnMove(caster: Pokemon, casters: Pokemon[], targets: Pokemon[], pos: BattlePosition, prefix: Prefix, turnCount: number, inTurnCount: number, field: Field, options?: BattleOptions):
    CasterTurnMove {
  const log = new CasterTurnMove()
  log.move = Movepool.Noop
  log.target = targets[0]
  if (caster.currentHp <= 0) {
    // Fainted Pokémon cannot attack!
    return log
  }
  if (!getCondition(caster, 'OnField')) {
    // Pokémon can only use attacks if in battle!
    return log
  }
  const validTargets = targets.filter(target => target.currentHp > 0 && getCondition(target, 'OnField'))
  if (validTargets.length === 0) {
    // console.log('No valid targets')
    return log
  }

  const target = (() => {
    if (options && options.targetingLogic) {
      const dynamicTarget = options.targetingLogic(caster, turnCount, validTargets)
      if (dynamicTarget === undefined) {
        // This should not happen.
        console.warn(`Dynamic target for boss ${caster.species} undefined`)
        return validTargets[0]
      }
      return dynamicTarget
    }
    if (caster.targetingLogic) {
      const dynamicTarget = caster.targetingLogic(caster, turnCount, validTargets)
      if (dynamicTarget === undefined) {
        // This should not happen.
        console.warn(`Dynamic target for caster ${caster.species} undefined`)
        return validTargets[0]
      }
      return dynamicTarget
    }
    return validTargets[0]
  })()

  const move: Move = (() => {
    // Custom move logic for opponents
    if (options?.moveLogic && prefix === 'Opposing') {
      const logicalMove = options.moveLogic(caster, target, field, turnCount, inTurnCount)
      if (logicalMove) {
        // Otherwise use the default move logic
        return logicalMove
      }
    }
    if (caster.moveLogic) {
      const logicalMove = caster.moveLogic(caster, target, field, turnCount, inTurnCount)
      if (logicalMove) {
        // Otherwise use the default move logic
        return logicalMove
      }
    }
    const defaultMove = moveSelection.Neutral(caster, target, field, turnCount, inTurnCount)
    return defaultMove || Movepool.noop
  })()

  log.move = move
  log.target = target

  // Preload the selected move, which may be used for moves such as
  // 'Sucker Punch'
  const condition = getCondition(caster, 'NextMove')
  if (!condition) {
    const nextMove = {...ConditionMap['NextMove']}
    nextMove.p = {selectedMove: move}
    caster.conditions.push(nextMove)
  } else {
    condition.p = {selectedMove: move}
  }

  return log
}

export interface SpeedAlignedAction {
  caster: SortablePokemon
  target: SortablePokemon
  targets: Pokemon[]
  move: Move
  label: 'Your' | 'Opposing'
}

export class CriticalHit extends Log {
  crit: boolean
  chance: number
}
// https://bulbapedia.bulbagarden.net/wiki/Critical_hit
export const criticalHit = (caster: Pokemon, move: Move): CriticalHit => {
  const probabilityByStage = [0, 0.0417, 0.125, 0.50, 1, 1]
  const critStage = move.criticalHit + caster.statBuffs.criticalHit
  const clamp = Math.min(Math.max(critStage, 0), 5)
  const chance = probabilityByStage[clamp]
  const log = new CriticalHit()
  log.crit = Math.random() < chance
  log.chance = chance
  return log
}

export function invPrefix(prefix: Prefix) {
  return prefix === 'Your' ? 'Opposing' : 'Your'
}

export function applyReflect(field: Field, prefix: Prefix) {
  if (!field) return false // This should never happen
  return field.sides[invPrefix(prefix)].reflect
}

export function applyLightScreen(field: Field, prefix: Prefix) {
  if (!field) return false // This should never happen
  return field.sides[invPrefix(prefix)].lightscreen
}

const QUICK_CLAW_ACTIVATION_RATE = 0.2

export interface SortablePokemon extends Pokemon {
  field?: Field
  prefix?: Prefix
}

export function bySpeed(pkmn1: SortablePokemon, pkmn2: SortablePokemon) {
  // Quick Claw logic
  const pkmn1QuickClawActivated =
    (pkmn1.heldItem !== undefined &&
    pkmn1.heldItemKey === 'quickclaw' &&
    !pkmn1.heldItemConsumed && Math.random() < QUICK_CLAW_ACTIVATION_RATE)
  const pkmn2QuickClawActivated =
    (pkmn2.heldItem !== undefined &&
    pkmn2.heldItemKey === 'quickclaw' &&
    !pkmn2.heldItemConsumed && Math.random() < QUICK_CLAW_ACTIVATION_RATE)
  if (pkmn1QuickClawActivated && !pkmn2QuickClawActivated) {
    return -1
  }
  if (!pkmn1QuickClawActivated && pkmn2QuickClawActivated) {
    return 1
  }

  const speed = (pkmn: SortablePokemon) => {
    if (pkmn.field) {
      return pkmn.speed *
        statBuff(pkmn.statBuffs.speed) *
        // Double speed in a Tailwind
        (pkmn.field.sides[pkmn.prefix!].tailwind ? 2 : 1) *
        // 75% speed reduction w/ Grass & Water Pledge
        (pkmn.field.sides[pkmn.prefix!].marsh ? 0.25 : 1)
    }
    return pkmn.speed * statBuff(pkmn.statBuffs.speed)
  }

  // Nominal behavior
  const pkmn1Speed = speed(pkmn1)
  const pkmn2Speed = speed(pkmn2)
  if (pkmn2Speed === pkmn1Speed) return Math.random() < 0.5 ? 1 : -1
  if (!pkmn1.field?.trickRoom) {
    // Normal
    return (pkmn2Speed || 50) - (pkmn1Speed || 50)
  } else {
    return (pkmn1Speed || 50) - (pkmn2Speed || 50)
  }
}

// Sort at a higher level than just Pokémon speed. Factor the 'priority' of a move
// in as well.
export function byPriority(action1: SpeedAlignedAction, action2: SpeedAlignedAction) {
  const p1 = action1.move?.priority ?? 0
  const p2 = action2.move?.priority ?? 0
  if (p1 > p2) {
    return -1
  } else if (p1 < p2) {
    return 1
  } else {
    return bySpeed(action1.caster, action2.caster)
  }
}

// Targets here are the Pokémon being attacked, checking that they fainted
export function endOfGame(targets: Pokemon[]) {
  return targets.filter(target => target.currentHp > 0).length === 0
}

export function switchOutPokemon(field: Field, prefix: Prefix, pkmn: Pokemon, party: Pokemon[]): Log {
  const log = new Log()
  const eligiblePartners = party.filter(p => !p.fainted && !getCondition(p, 'OnField'))
  if (eligiblePartners.length === 0) {
    // what if it's one of the last pkmn on the field?
    return log // No Pokemon in party to swap with.
  }
  removeCondition(pkmn, 'OnField')
  pkmn.statBuffs = {
    accuracy: 0,
    attack: 0,
    criticalHit: 0,
    defense: 0,
    evasiveness: 0,
    spAttack: 0,
    spDefense: 0,
    speed: 0,
  }
  if (pkmn.fainted) {
    log.add(`You did well, ${pkmn.species}. You deserve a long rest.`)
  } else {
    log.add(`Thanks, ${pkmn.species}.`)
  }
  const next = eligiblePartners[0]
  APPLY_TEMP_STATUS(next, {...ConditionMap['OnField']})
  const p = Math.random()
  if (p < 0.33) {
    log.add(`Let's go, ${next.species}!`)
  } else if (p < 0.67) {
    log.add(`I choose you, ${next.species}!`)
  } else {
    log.add(`I'm counting on you ${next.species}!`)
  }
  log.push(applyEntryHazards(field, prefix, next, party))
  return log
}

function applyEntryHazards(field: Field, prefix: Prefix, pkmn: Pokemon, party: Pokemon[]): Log {
  const log = new Log()
  if (pkmn.heldItemKey === 'heavydutyboots' && !pkmn.heldItemConsumed) {
    return log // Skip all entry hazards 
  }
  const side = field.sides[prefix]
  // Note: Raid bosses appear on the field before entry hazards, so they do not
  // get affected and thus we do not need to calculate separate damage ratios.
  if (side.spikes && pkmn.type1 !== 'Flying' && pkmn.type2 !== 'Flying') {
    const spikesRatio = [0, 0.125, 0.167, 0.25]
    log.add(`A trap of sharp spikes dug into the ${pkmn.species}'s feet.`)
    log.push(logDamage(pkmn, pkmn.totalHp * spikesRatio[side.spikes], true))
  }
  if (side.stickyWeb && pkmn.type1 !== 'Flying' && pkmn.type2 !== 'Flying') {
    log.add('The sticky web slowed down the Pokémon')
    pkmn.statBuffs.speed--
  }
  if (side.toxicSpikes) {
    if (pkmn.type1 === 'Poison' && pkmn.type2 === 'Poison') {
      field.sides[prefix].toxicSpikes = 0
      log.add(`The toxic spikes were safely brushed aside.`)
    } else if (pkmn.type1 !== 'Flying' && pkmn.type2 !== 'Flying') {
      if (side.toxicSpikes === 1) {
        log.push(APPLY_STATUS(pkmn, 'Poison', `${pkmn.species} was poisoned`))
      } else {
        log.push(APPLY_STATUS(pkmn, 'Poison', `${pkmn.species} was badly poisoned`))
        log.push(APPLY_TEMP_STATUS(pkmn, {...ConditionMap['PoisonBad']}))
      }
    }
  }
  if (side.stealthRock) {
    let srRatio = 8 * typeMatchup.Rock[pkmn.type1]
    if (pkmn.type2) {
      srRatio *= typeMatchup.Rock[pkmn.type2]
    }
    log.add("Pointed rocks dug into the Pokémon.")
    log.push(logDamage(pkmn, pkmn.totalHp / srRatio, true))
  }
  if (side.sharpSteel) {
    let srRatio = 8 * typeMatchup.Steel[pkmn.type1]
    if (pkmn.type2) {
      srRatio *= typeMatchup.Steel[pkmn.type2]
    }
    log.add("Bits of metal dug into the Pokémon.")
    log.push(logDamage(pkmn, pkmn.totalHp / srRatio, true))
  }
  if (pkmn.currentHp <= 0) {
    // It might require us to mark a Pokemon as fainted in a loop.
    pkmn.fainted = true
    log.push(switchOutPokemon(field, prefix, pkmn, party))
  }
  return log
}

/**
 * Determines if a particular item is considered legal in this tier.
 * If true, this item is disabled for the match.
 *
 * @param rules Rules for this battle format
 * @param item The item ID being held
 * @returns Return true if item should not be used
 */
export function renderItemInert(rules: Rules, item?: ItemId) {
  if (!item) return false
  const {category} = ITEMS[item]
  if (category === 'megastone' && !rules.mega) {
    return true
  }
  if (category === 'zcrystal' && !rules.zmoves) {
    return true
  }
  if (['maxmushroom', 'maxhoney', 'dynamaxcandy'].includes(item) && !rules.dynamax) {
    return true
  }
  return false
}

export interface AttackParams {
  caster: Pokemon,
  target: Pokemon,
  move: Move
  field: Field
  prefix: Prefix
  casters: Pokemon[]
  casterParty: Pokemon[]
  targets: Pokemon[]
  targetParty: Pokemon[]
}

export function attack(params: AttackParams): Log {
  const {caster, move, field, prefix, casters, targets} = params
  const targetPrefix = invPrefix(prefix)
  // For moves like Rage Powder, alter target after move selection or go with default
  const target = (() => {
    const selected = params.field.sides[targetPrefix].target
    // If selection is fainted, or undefined, revert to default
    if (selected && !selected.fainted && selected.currentHp > 0) {
      return selected
    }
    return params.target
  })()
  const log = new Log()
  if (caster.currentHp <= 0) return log.debug('Caster fainted') // Pokémon fainted. Exit now.
  if (move === undefined) return log.debug('Move is undefined') // No move is used. Exit now.
  if (!target) {
    console.warn('Target undefined', caster, move, prefix)
    return log.debug('Target does not exist')
  }
  move.failed = false
  // Apply effects before attack occurs
  // Items
  const casterItem = caster.heldItem

  const casterAbility = caster.ability
  const targetAbility = target.ability

  const moveInput: MoveInput = {
    caster, target, move, field, prefix, targetPrefix, casters, targets
  }

  if (casterAbility) {
    log.push(casterAbility.onCasterMove?.(moveInput))
  }

  let targetList: (Pokemon | undefined)[] = [target]
  if (move.aoe === 'Random Opponent') {
    targetList[0] = randomItem(params.targets.filter(t => !t.fainted && getCondition(t, 'OnField')))
  } else if (move.aoe === 'All Opponents') {
    targetList = params.targets.filter(t => !t.fainted && getCondition(t, 'OnField'))
  } else if (move.aoe === 'Nearby Opponents') {
    const indexOfOpponent = params.targets.indexOf(target)
    if (indexOfOpponent <= -1) {
      // Just in case
      // If there are less than 3, pass undefineds and handle them below
      targetList = [target, params.targets[0], params.targets[1]]
    } else {
      targetList = [
        params.targets[indexOfOpponent - 1],
        target,
        params.targets[indexOfOpponent + 1],
      ]
    }
  } else if (move.aoe === 'Everyone') {
    const indexOfPlayer = params.casters.indexOf(caster)
    // Get everyone sans player
    targetList = [
      ...params.targets,
      ...params.casters.slice(0, indexOfPlayer),
      ...params.casters.slice(indexOfPlayer + 1)
    ]
  }

  if (move.onGetType) {
    move.type = move.onGetType(caster, field, move)
  }

  // Apply Fire & Water Pledge
  // We cannot directly control secondary effects in our model
  // But we can boost crit ratio
  if (field.sides[prefix].rainbow) {
    move.criticalHit *= 2
  }

  if (casterItem && !caster.heldItemConsumed && !field.magicRoom) {
    log.push(casterItem.onCasterMove?.(moveInput, caster.heldItemConsumed))
  }
  if (field.weather) {
    log.push(field.weather.onCasterMove?.(caster, target, move))
  }
  if (field.terrain) {
    log.push(field.terrain.onCasterMove?.(caster, target, move))
  }
  if (caster.status) {
    log.push(caster.status.onTurnStart?.(caster.status, caster, move))
  }
  if (caster.conditions) {
    caster.conditions.forEach(condition => {
      log.push(condition.onTurnStart?.(condition, caster, move))
    })
  }

  // Confusion perhaps?
  if (target.currentHp <= 0) {
    target.fainted = true
    log.add(`${target.species} fainted!`)
  }

  // Will this fail once and not for others? I don't think so?
  log.push(move.onBeforeMove?.(moveInput))
  if (move.failed) {
    APPLY_TEMP_STATUS(caster, {...StatusMap['PreviousMoveFailed']})
    return log.debug('Move marked as failed') // No-op. Exit now.
  }
  removeCondition(caster, 'PreviousMoveFailed')

  // Create move
  log.add(`${prefix} ${caster.species} used ${move.name}`)

  const statusLog = new Log()
  const tempStatusLog = new Log();
  const effectArray: {accuracy: number, failed: boolean}[] = []
  const originalAccuracy = move.accuracy
  // This might be verbose
  targetList.forEach(target => {
    if (!target) return
    
    // Reset
    move.failed = false
    move.accuracy = originalAccuracy
    moveInput.target = target

    if (target.heldItem && !target.heldItemConsumed && !field.magicRoom) {
      log.push(target.heldItem.onTargetMove?.(caster, target, move, target.heldItemConsumed))
    }

    if (target.status) {
      statusLog.push(target.status.onTargetMove?.(moveInput))
    }
    if (target.conditions) {
      target.conditions.forEach(condition => {
        tempStatusLog.push(condition?.onTargetMove?.(moveInput))
      })
    }
    if (caster.conditions) {
      caster.conditions.forEach(condition => {
        tempStatusLog.push(condition?.onTargetMove?.(moveInput))
      })
    }
  
    if (move.failed) {
      if (statusLog) {
        log.push(statusLog)
      }
    
      if (tempStatusLog) {
        log.push(tempStatusLog)
      }
      // Splice out this target from the targetList
      targetList.splice(targetList.indexOf(target), 1)
    }
    // We need to store these fields for each target.
    effectArray.push({
      accuracy: move.accuracy,
      failed: move.failed,
    })
  })


  let adjustedDmg = 0
  if (move.aoe === 'Self') {
    // Target and caster are the same
    moveInput.target = moveInput.caster
    moveInput.targetPrefix = moveInput.prefix
    // No need for damage calculation
    if (move.failed) {
      log.add('It failed...')
    } else {
      log.push(move.onAfterMove?.(moveInput))
    }
  } else if (move.aoe === 'Single Ally') {
    // No accuracy check
    // Get an ally at random
    const ally = (() => {
      if (params.casters.length === 1) return caster
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const ally = randomItem(params.casters)
        if (ally !== caster) return ally
      }
    })()
    moveInput.target = ally
    log.push(move.onAfterMove?.(moveInput))
  } else if (move.aoe === 'All Allies') {
    params.casters.forEach(caster => {
      moveInput.target = caster
      log.push(move.onAfterMove?.(moveInput))
    })
  } else {
    // Damage-dealing move
    // Adjust move power based on the number of targets
    const many = targetList.filter(t => t).length > 1
    if (many) {
      move.power /= targetList.length
      move.power *= (targetList.length > 1 ? 1.2 : 1)
    }
    let onAfterMoveOnce = true
    targetList.forEach((target) => {
      if (!target) return // This target is undefined
      // Setup the target
      moveInput.target = target

      const effect = effectArray.splice(0, 1)[0]
      // Reset fields, recalculated for every target.
      move.accuracy = effect.accuracy
      move.failed = effect.failed
      // Check accuracy
      const netAccuracy = move.accuracy * statBuff(caster.statBuffs.accuracy) / statBuff(target.statBuffs.evasiveness)
      // log.add(`[D] ${move.name} on ${target.species}: ${netAccuracy}`)
      if (isNaN(netAccuracy)) {
        throw new Error('Move accuracy is NaN. This should never happen.')
      }
      const hitRoll = Math.random()
      // log.add(`[D] ${netAccuracy} < ${hitRoll}`)
      if (netAccuracy < hitRoll) {
        if (many) {
          log.add(`The attack missed on ${target.species}!`)
          if (move.onMiss) {
            log.push(move.onMiss(moveInput))
          }
          if (caster.heldItem?.onMiss) {
            log.push(caster.heldItem.onMiss(moveInput))
          }
        } else {
          log.add('The attack missed!')
          if (move.onMiss) {
            log.push(move.onMiss(moveInput))
          }
          if (caster.heldItem?.onMiss) {
            log.push(caster.heldItem.onMiss(moveInput))
          }
        }
        return
      } // Miss. Exit now.
      const multLog = typeMultiplier(target, move.type) as TypeMultiplier
      if (many) {
        log.add(`The attack struck ${target.species}`)
      }
      log.push(multLog)
      const {mult} = multLog
      if (!mult) return // No effect. Exit now.

      const defenseKey = (() => {
        if (field.wonderRoom) {
          if (move.defenseKey === 'defense') return 'spDefense'
          return 'defense'
        }
        return move.defenseKey
      })()

      // Apply damage
      // Critical Hit calculator
      let targetMovePower = move.power
      const {crit} = log.push(criticalHit(caster, move)) as CriticalHit
      if (move.power > 0 && crit) {
        // Count total number of critical hits conducted throughout the match
        if (!getCondition(caster, 'CriticalHits')) {
          const status = {...ConditionMap['CriticalHits']}
          status.p = { criticalHits: 1 }
          APPLY_TEMP_STATUS(caster, status)
        } else {
          const status = getCondition(caster, 'CriticalHits')!
          if (status.p === undefined) {
            status.p = { criticalHits: 1 }
          } else {
            status.p.criticalHits!++
          }
        }
        if (many) {
          log.add(`A critical hit on ${target.species}!`)
        } else {
          log.add('A critical hit!')
        }
        // Ignore positive defense stat boosts
        targetMovePower *= 1.5 * Math.max(statBuff(target.statBuffs[defenseKey]), 1)
      }
      const stab = (caster.type1 === move.type || caster.type2 === move.type) ? 1.5 : 1
      const dmgRange = Math.random() * 0.1 + 0.95 // Random float 0.95x - 1.05x
      const atkStat = (caster[move.attackKey] || 50) * statBuff(caster.statBuffs[move.attackKey])
      const defStat = (target[defenseKey] || 50) * statBuff(target.statBuffs[defenseKey])
  
      if (field.mudSport && move.type === 'Electric') {
        targetMovePower /= 2 // Halve the base power of Electric-type moves
      }

      if (field.waterSport && move.type === 'Fire') {
        targetMovePower /= 2 // Halve the base power of Fire-type moves
      }
  
      if (applyReflect(field, prefix) && move.attackKey === 'attack') {
        targetMovePower /= 2 // Halve the base power of physical attacks
      }
  
      if (applyLightScreen(field, prefix) && move.attackKey === 'spAttack') {
        targetMovePower /= 2 // Halve the base power of special attacks
      }
  
      const dmg = atkStat * mult * stab * targetMovePower * dmgRange / defStat * 50
      adjustedDmg = Math.min(dmg, target.currentHp)
      if (move.power > 0) {
        log.push(logDamage(target, adjustedDmg))
        // Now that the move successfully occurred, update this to be the
        // caster's last-used move that dealt damage. This may be used for
        // counterattacks such as 'Counter'.
        const condition = getCondition(caster, 'LastDamage')
        if (!condition) {
          const lastDamage = {...ConditionMap['LastDamage']}
          lastDamage.p = {selectedMove: move, dmg: adjustedDmg}
          caster.conditions.push(lastDamage)
        } else {
          condition.p = {selectedMove: move, dmg: adjustedDmg}
        }
      }
      moveInput.damage = adjustedDmg
  
      // Will this be a problem for certain ally moves?
      if (onAfterMoveOnce) {
        log.push(move.onAfterMoveOnce?.(moveInput))
        onAfterMoveOnce = false
      }
      log.push(move.onAfterMove?.(moveInput))
      // Will this be a problem for certain ally moves?
      if (casterItem && !caster.heldItemConsumed && casterItem.onAfterCasterMove && !field.magicRoom) {
        log.push(casterItem.onAfterCasterMove(moveInput, caster.heldItemConsumed, adjustedDmg))
      }
      if (field.terrain) {
        log.push(field.terrain.onAfterCasterMove?.(caster, target, move))
      }
      if (target.heldItem && !target.heldItemConsumed && target.heldItem.onAfterTargetMove && !field.magicRoom) {
        const tiInput: MoveInput = {
          caster: moveInput.target,
          casters: moveInput.targets,
          field: moveInput.field,
          move: moveInput.move,
          prefix: moveInput.targetPrefix,
          target: moveInput.caster,
          targets: moveInput.casters,
          targetPrefix: moveInput.prefix,
          damage: moveInput.damage,
        }
        log.push(target.heldItem.onAfterTargetMove(tiInput, target.heldItemConsumed, adjustedDmg))
      }
      if (target.conditions) {
        target.conditions.forEach(condition => {
          log.push(condition.onAfterTargetMove?.(moveInput))
        })
      }
      // Mark as hit for moves like Avalanche
      if (!getCondition(target, 'Already Hit')) {
        APPLY_TEMP_STATUS(target, {...ConditionMap['Already Hit']})
      }
      if (!getCondition(target, 'TimesHit')) {
        const status = {...ConditionMap['TimesHit']}
        status.p = { rageFist: 1 }
        APPLY_TEMP_STATUS(target, status)
      } else {
        const status = getCondition(target, 'TimesHit')!
        if (status.p === undefined) {
          status.p = { rageFist: 1 }
        } else {
          status.p.rageFist!++
        }
      }
      if (target.currentHp <= 0) {
        target.fainted = true
        log.add(`${target.species} fainted!`)
      }
      if (getCondition(caster, 'SwitchOut')) {
        // If 'SwitchOut' condition then replace player
        log.push(switchOutPokemon(field, moveInput.prefix, moveInput.caster, params.casterParty))
      }
      if (getCondition(target, 'SwitchOut')) {
        // If 'SwitchOut' condition then replace player
        log.push(switchOutPokemon(field, moveInput.targetPrefix, moveInput.target, params.targetParty))
      }
      // TODO: Will this be a problem for certain ally moves?
      if (targetAbility) {
        log.push(targetAbility.onMoveHit?.(caster, target, moveInput))
      }
    })
    // Will this be a problem for certain ally moves?
    if (casterItem && !caster.heldItemConsumed && casterItem.onAfterCasterMoveOnce && !field.magicRoom) {
      log.push(casterItem.onAfterCasterMoveOnce(moveInput, caster.heldItemConsumed, adjustedDmg))
    }
    log.push(statusLog)
    log.push(tempStatusLog)
  }

  // Now that the move successfully occurred, update this to be the caster's
  // last-used move. This may be used for counterattacks such as 'Disable'
  // and 'Encore'.
  const condition = getCondition(caster, 'LastMove')
  if (!condition) {
    const lastMove = {...ConditionMap['LastMove']}
    lastMove.p = {selectedMove: move}
    caster.conditions.push(lastMove)
  } else {
    condition.p = {selectedMove: move}
  }

  return log
}

export class TurnLog extends Log {
  /**
   * Who won?
   */
  matchEnd?: 'opponent' | 'player'
}

export interface TurnParameters {
  players: Pokemon[]
  opponents: Pokemon[]
  field: Field
  turnCount: number
  options?: BattleOptions
  rules?: Rules
}

// The first element in each array will be the primary battler
export function turn(p: TurnParameters): TurnLog {
  const {players, opponents, field, turnCount, options} = p
  // Turn starts
  const log = new TurnLog()

  // Only include those in battle
  const battlers = [...players, ...opponents]
  battlers.sort(bySpeed)
  const speedAlignedActions: SpeedAlignedAction[] = []

  // Perform move selection first
  battlers.forEach(caster => {
    if (!getCondition(caster, 'OnField')) return // Not in-battle!
    // Increment turns active
    if (caster.status) {
      caster.status.turnsActive++
    }
    if (caster.conditions) {
      caster.conditions.forEach(condition => {
        condition.turnsActive++
      })
    }

    // Perform move selection
    caster['field'] = field
    if (players.includes(caster)) {
      const {move, target} = log.push(getCasterTurnMove(caster, players, opponents, 'PRIMARY', 'Your', turnCount, 0, field, options)) as CasterTurnMove
      caster['prefix'] = 'Your'
      target['field'] = field
      target['prefix'] = 'Opposing'
      speedAlignedActions.push({
        label: 'Your',
        targets: opponents,
        caster: (caster as SortablePokemon),
        target: (target as SortablePokemon),
        move,
      })
    } else if (opponents.indexOf(caster) === 0) {
      if (options && options.opponentMoves) {
        for (let i = 0; i < options.opponentMoves(caster); i++) {
          const {move, target} = log.push(getCasterTurnMove(caster, opponents, players, 'PRIMARY', 'Opposing', turnCount, i, field, options)) as CasterTurnMove
          caster['prefix'] = 'Opposing'
          target['field'] = field
          target['prefix'] = 'Your'
          speedAlignedActions.push({
            label: 'Opposing',
            targets: players,
            caster: (caster as SortablePokemon),
            target: (target as SortablePokemon),
            move,
          })
        }
      } else {
        const {move, target} = log.push(getCasterTurnMove(caster, opponents, players, 'PRIMARY', 'Opposing', turnCount, 0, field, options)) as CasterTurnMove
        caster['prefix'] = 'Opposing'
        target['field'] = field
        target['prefix'] = 'Your'
        speedAlignedActions.push({
          label: 'Opposing',
          targets: players,
          caster: (caster as SortablePokemon),
          target: (target as SortablePokemon),
          move,
        })
      }
    } else {
      const {move, target} = log.push(getCasterTurnMove(caster, opponents, players, 'SECONDARY', 'Opposing', turnCount, 0, field, options)) as CasterTurnMove
      caster['prefix'] = 'Opposing'
      target['field'] = field
      target['prefix'] = 'Your'
      speedAlignedActions.push({
        label: 'Opposing',
        targets: players,
        caster: (caster as SortablePokemon),
        target: (target as SortablePokemon),
        move,
      })
    }
  })

  speedAlignedActions.sort(byPriority)
  speedAlignedActions.forEach(action => {
    let target = action.target
    if (action.target.currentHp === 0 || action.target.fainted) {
      target = randomItem(
        action.targets.filter(t => t.currentHp > 0)
      )
    }

    if (players.includes(action.caster)) {
      const attackParams: AttackParams = {
        caster: action.caster,
        target,
        move: action.move,
        field,
        prefix: action.label,
        casterParty: players,
        casters: players.filter(c => getCondition(c, 'OnField')),
        targets: opponents.filter(c => getCondition(c, 'OnField')),
        targetParty: opponents,
      }
      log.debug(`${action.move.name} -> ${action.target.species}`)
      log.push(attack(attackParams))
      if (endOfGame(opponents)) {
        log.matchEnd = 'player'
      }
    } else {
      const attackParams: AttackParams = {
        caster: action.caster,
        target,
        move: action.move,
        field,
        prefix: action.label,
        casterParty: opponents,
        casters: opponents.filter(c => getCondition(c, 'OnField')),
        targets: players.filter(c => getCondition(c, 'OnField')),
        targetParty: opponents,
      }
      log.debug(`${action.move.name} -> ${action.target.species}`)
      log.push(attack(attackParams))
      if (endOfGame(players)) {
        log.matchEnd = 'opponent'
      }
    }
    log.add!('---')
  })

  // Turn ends
  if (field.weather) {
    log.push(field.weather.onTurnEnd?.(battlers))
  }
  if (field.terrain) {
    log.push(field.terrain.onTurnEnd?.(battlers))
  }

  // Apply Grass & Fire Pledge
  if (field.sides.Your.firefield) {
    players.forEach(player => {
      if (player.type1 !== 'Fire' && player.type2 !== 'Fire' && !getCondition(player, 'Raid')) {
        log.push(logDamage(player, player.totalHp / 8))
      }
    })
  }

  if (field.sides.Opposing.firefield) {
    opponents.forEach(player => {
      if (player.type1 !== 'Fire' && player.type2 !== 'Fire' && !getCondition(player, 'Raid')) {
        log.push(logDamage(player, player.totalHp / 8))
      }
    })
  }

  // Reset moves like Rage Powder
  field.sides.Your.target = undefined
  field.sides.Opposing.target = undefined

  battlers.forEach(caster => {
    if (caster.heldItem && !caster.heldItemConsumed && !field.magicRoom) {
      log.push(caster.heldItem.onTurnEnd?.(caster, caster.heldItemConsumed, field))
    }
    if (caster.status && caster.currentHp > 0) {
      // log.add(`[D] ${caster.species} has ${caster.status?.name}`)
      log.push(caster.status.onTurnEnd?.(caster, caster.status, field))
    }
    // console.log(caster.species, caster.conditions)
    if (caster.conditions && caster.currentHp > 0) {
      caster.conditions.forEach(condition => {
        log.push(condition.onTurnEnd?.(caster, condition, field))
      })
    }
    // if (caster.ability) {
    //   log.push(caster.ability.onTurnEnd(caster))
    // }
    if (caster.currentHp < 0 && !caster.fainted) {
      // Caster fainted! But whose side are they on?
      caster.fainted = true
      if (players.includes(caster) && endOfGame(players)) {
        log.matchEnd = 'opponent'
      }
      if (opponents.includes(caster) && endOfGame(opponents)) {
        log.matchEnd = 'player'
      }
    }
  })

  if (field.mudSport) {
    field.mudSport--
  }
  if (field.waterSport) {
    field.waterSport--
  }
  if (field.trickRoom) {
    field.trickRoom--
  }
  if (field.wonderRoom) {
    field.wonderRoom--
  }
  if (field.magicRoom) {
    field.magicRoom--
  }
  field.ions = false
  field.round = false;
  ['Your', 'Opposing'].forEach(side => {
    // Decrement number params
    const numberParams = ['reflect', 'lightscreen', 'mist', 'tailwind', 'marsh', 'firefield', 'rainbow']
    const boolParams = ['fusionfire', 'fusionelectric', 'pledgegrass', 'pledgefire', 'pledgewater']
    numberParams.forEach(param => {
      if (field.sides[side][param]) {
        field.sides[side][param]--
      }
    })
    // Reset bool params
    boolParams.forEach(param => {
      if (field.sides[side][param]) {
        field.sides[side][param] = false
      }
    })
  })

  if (options?.pctLogs && options.pctLogs.length) {
    const pctCondition = options.pctLogs[0][0]
    const pctOppo = opponents[0].currentHp / opponents[0].totalHp
    if (opponents[0].currentHp > 0 && pctOppo < pctCondition) {
      log.add(options.pctLogs[0][1] as string)
      options.pctLogs.splice(0, 1) // Pop this message from queue
    }
  }
  return log
}

export const RESULT_PLAYER_VICTORY = 1
export const RESULT_OPPONENT_VICTORY = 2
export const RESULT_MATCH_STALEMATE = 3
export type MatchResult = 1 | 2 | 3

export class ExecuteLog extends Log {
  playerHps: number[]
  playerHeldItemsConsumed: string[]
  opponentHps: number[]
  result: MatchResult
  field: Field
  players: {
    badge: Badge
    currentHp: number
    totalHp: number
    criticalHits: number
  }[]
}

export const MATCH_MAX_LENGTH = 30
export function execute(
  players: Pokemon[], opponents: Pokemon[],
  options: BattleOptions, location: Location,
  rules: Rules,
): ExecuteLog {
  const log = new ExecuteLog()
  if (options?.startMsg) {
    log.add!(options.startMsg)
  }
  log.playerHeldItemsConsumed = []

  let continueMatch = true
  let turnCount = 0
  const weather = (() => {
    if (Weathers[location.forecast!]) {
      return Weathers[location.forecast!]
    }
    return Weathers.Cloudy // Generic
  })()
  const field: Field = {
    naturePower: 'Grass',
    weather,
    trickRoom: 0,
    mudSport: 0,
    waterSport: 0,
    magicRoom: 0,
    wonderRoom: 0,
    ions: false,
    sides: {
      Your: {
        reflect: 0,
        lightscreen: 0,
        mist: 0,
        tailwind: 0,
        marsh: 0,
        firefield: 0,
        rainbow: 0,
        fusionElectric: false,
        fusionFire: false,
        pledgeFire: false,
        pledgeGrass: false,
        pledgeWater: false,
        goldCoins: false,
        sharpSteel: false,
        stickyWeb: false,
        stealthRock: false,
        spikes: 0,
        toxicSpikes: 0,
      },
      Opposing: {
        reflect: 0,
        lightscreen: 0,
        mist: 0,
        tailwind: 0,
        marsh: 0,
        firefield: 0,
        rainbow: 0,
        fusionElectric: false,
        fusionFire: false,
        pledgeFire: false,
        pledgeGrass: false,
        pledgeWater: false,
        goldCoins: false,
        sharpSteel: false,
        stickyWeb: false,
        stealthRock: false,
        spikes: 0,
        toxicSpikes: 0,
      },
    },
    locationTerrain: location.terrain
  }

  log.push!(weather.onActivation?.([...players, ...opponents], field))

  for (const pkmn of players) {
    if (pkmn.ability) {
      for (const oppo of opponents) {
        log.push!(pkmn.ability.onBattleStart?.(pkmn, oppo))
      }
    }
    if (pkmn.heldItem) {
      // NOTE: Will hardcoding to index 0 backfire at some point?
      log.push!(pkmn.heldItem.onBattleStart?.(pkmn, opponents[0], false))
    }
    if (pkmn.conditions) {
      pkmn.conditions.forEach(condition => {
        log.push(condition.onBattleStart?.(pkmn))
      })
    }
  }
  for (const pkmn of opponents) {
    if (pkmn.ability) {
      for (const oppo of players) {
        log.push!(pkmn.ability.onBattleStart?.(pkmn, oppo))
      }
    }
    if (pkmn.heldItem) {
      log.push!(pkmn.heldItem.onBattleStart?.(pkmn, players[0], false))
    }
    if (pkmn.conditions) {
      pkmn.conditions.forEach(condition => {
        log.push(condition.onBattleStart?.(pkmn))
      })
    }
  }

  log.add!('==========')

  while (continueMatch && turnCount < MATCH_MAX_LENGTH) {
    const turnLog = turn({ players, opponents, field, turnCount, options, rules })
    log.push!(turnLog)
    log.add!('==========')
    // console.log('Turn results', players, 'v', opponents)
    let playerFaint = 0
    let opponentFaint = 0

    if (turnLog.matchEnd) {
      // Copy behavior for end of game
      if (turnLog.matchEnd === 'player') {
        continueMatch = false
        log.add!(options?.victoryMsg || 'The opposing trainer has no Pokémon left!')
        log.playerHps = players.map(player => player.currentHp / player.totalHp)
        log.opponentHps = opponents.map(oppo => oppo.currentHp / oppo.totalHp)
        log.result = RESULT_PLAYER_VICTORY
      } else {
        continueMatch = false
        log.add!(options?.lossMsg || 'All your Pokémon fainted!')
        log.playerHps = players.map(player => player.currentHp / player.totalHp)
        log.opponentHps = opponents.map(oppo => oppo.currentHp / oppo.totalHp)
        log.result = RESULT_OPPONENT_VICTORY
      }
    } else {
      // Default, lets scan all players
      opponents.forEach(pokemon => {
        if (pokemon.currentHp <= 0 && !pokemon.fainted) {
          pokemon.fainted = true
        }
        if (pokemon.fainted) {
          // Switch out opponent Pkmn for next one
          log.push(switchOutPokemon(field, 'Opposing', pokemon, opponents))
          opponentFaint++
        }
      })
      if (opponentFaint >= opponents.length) {
        continueMatch = false
        log.add!(`The opposing trainer has no Pokémon left!`)
        log.playerHps = players.map(player => player.currentHp / player.totalHp)
        log.opponentHps = opponents.map(oppo => oppo.currentHp / oppo.totalHp)
        log.result = RESULT_PLAYER_VICTORY // May be overriden if player also lost
      }
  
      players.forEach(pokemon => {
        if (pokemon.currentHp <= 0 && !pokemon.fainted) {
          pokemon.fainted = true
        }
        if (pokemon.fainted) {
          // Switch out player Pkmn for next one
          log.push(switchOutPokemon(field, 'Your', pokemon, players))
          playerFaint++
        }
      })
      if (playerFaint >= players.length) {
        continueMatch = false
        log.add!(`All your Pokémon fainted!`)
        log.playerHps = players.map(player => player.currentHp / player.totalHp)
        log.opponentHps = opponents.map(oppo => oppo.currentHp / oppo.totalHp)
        log.result = RESULT_OPPONENT_VICTORY
      }
    }


    turnCount++
  }

  if (turnCount >= MATCH_MAX_LENGTH) {
    log.playerHps = players.map(player => player.currentHp / player.totalHp)
    log.opponentHps = opponents.map(oppo => oppo.currentHp / oppo.totalHp)
    log.result = RESULT_MATCH_STALEMATE
  }

  players.forEach(player => {
    if (player.heldItemTotallyConsumed && !getCondition(player, 'Switcherooed')) {
      log.playerHeldItemsConsumed.push(player.heldItemKey!)
    } else {
      log.playerHeldItemsConsumed.push(undefined!) // Hmm
    }
  })
  log.field = field
  log.players = players.map(p => {
    const criticalHits = (() => {
      const crits = getCondition(p, 'CriticalHits')
      if (!crits) return 0
      if (!crits.p) return 0
      return crits.p.criticalHits ?? 0
    })()
    return {
      badge: p.badge,
      currentHp: p.currentHp,
      totalHp: p.totalHp,
      criticalHits,
    }
  })
  return log
}

export function buildMatchup(players: Badge[], heldItems: ItemId[],
    opponents: Badge[], oppoHeld: ItemId[], rules: Rules) {
  const playerPokemon = players.map((badge, index) => {
    const data = {...Pkmn.get(badge.toLegacyString())} as PokemonDoc
    const pkmn: Pokemon = {...data,
      badge: badge,
      fainted: false,
      totalHp: (data.hp || 50) * 4,
      currentHp: (data.hp || 50) * 4,
      movepool: data.move.map(move => Movepool[move] || Movepool.Tackle),
      heldItem: Inventory[heldItems[index]],
      heldItemKey: heldItems[index] as ItemId,
      heldItemConsumed: renderItemInert(rules, heldItems[index] as ItemId),
      heldItemTotallyConsumed: false,
      conditions: [],
      statBuffs: {
        attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0,
        accuracy: 0, evasiveness: 0, criticalHit: 0,
      },
      targetingLogic: targetSelection[badge.personality.nature ?? 'Hardy'],
      moveLogic: moveSelection[badge.personality.nature ?? 'Hardy'],
    }
    const {buff, nerf} = statAdjustment[badge.personality.nature ?? 'Hardy']
    if (buff) {
      pkmn[buff] *= 1.1
    }
    if (nerf) {
      pkmn[nerf] /= 1.1
    }
    const size = badge.size
    pkmn.weight *= {xxs: 0.8, xxl: 1.2, n: 1}[size ?? 'n']
    if (index < rules.fieldSize) {
      pkmn.conditions = [{...ConditionMap.OnField}]
    }
    return pkmn
  })

  const opponentPokemon = opponents.map((badge, index) => {
    const data = {...Pkmn.get(badge.toLegacyString())} as PokemonDoc
    const pkmn: Pokemon = {...data,
      badge: badge,
      fainted: false,
      totalHp: (data.hp || 50) * 4,
      currentHp: (data.hp || 50) * 4,
      movepool: data.move.map(move => Movepool[move] || Movepool.Tackle),
      heldItem: Inventory[oppoHeld[index]],
      heldItemKey: oppoHeld[index] as ItemId,
      heldItemConsumed: renderItemInert(rules, oppoHeld[index] as ItemId),
      heldItemTotallyConsumed: false,
      conditions: [],
      statBuffs: {
        attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0,
        accuracy: 0, evasiveness: 0, criticalHit: 0,
      },
      targetingLogic: targetSelection[badge.personality.nature ?? 'Hardy'],
      moveLogic: moveSelection[badge.personality.nature ?? 'Hardy'],
    }
    const {buff, nerf} = statAdjustment[badge.personality.nature ?? 'Hardy']
    if (buff) {
      pkmn[buff] *= 1.1
    }
    if (nerf) {
      pkmn[nerf] /= 1.1
    }
    const size = badge.size
    pkmn.weight *= {xxs: 0.8, xxl: 1.2, n: 1}[size ?? 'n']
    if (index < rules.fieldSize) {
      pkmn.conditions = [{...ConditionMap.OnField}]
    }
    return pkmn
  })
  return {playerPokemon, opponentPokemon}
}

export async function matchup(
  players: Badge[], heldItems: ItemId[],
  opponents: Badge[], oppoHeld: ItemId[],
  location: Location, rules: Rules,
): Promise<ExecuteLog> {
  const {playerPokemon, opponentPokemon} = buildMatchup(players, heldItems, opponents, oppoHeld, rules)
  return execute(playerPokemon, opponentPokemon, undefined!, location, rules)
}
