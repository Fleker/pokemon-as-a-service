import { assert } from '@fleker/gents'
import { Status, logDamage, logHeal, Log, Pokemon } from "./types"
import { APPLY_STATUS, APPLY_TEMP_STATUS, BUFF_STAT, Movepool } from "./movepool"
import { getCondition, removeCondition } from './conditions'
import randomItem from "../random-item"
import { MoveId, SupportMoves } from "../gen/type-move-meta"
import { typeMatchup } from './matchup'

const nop = () => { return new Log()}

const Asleep =  assert<Status>({
  name: 'Asleep',
  turnsActive: 0,
  onTurnStart: (status, target, move) => {
    if (status.turnsActive > 5 || Math.random() < 0.2) {
      target.status = undefined
      return new Log().add(`${target.species} woke up`)
    }
    if (status.turnsActive >= 2 && status.p?.Rest) {
      target.status = undefined
      return new Log().add(`${target.species} woke up`)
    }
    move.failed = true
    return new Log().add(`${target.species} is fast asleep`)
  },
})

const Burn = assert<Status>({
  name: 'Burn',
  turnsActive: 0,
  onActivation: (target) => {
    target.attack /= 1.5
    return new Log()
  },
  onTurnEnd: (target) => {
    const log = new Log()
    log.add(`${target.species} was damaged by the burn`)
    if (getCondition(target, 'Raid')) {
      log.push(logDamage(target, target.totalHp / 32, true))
    } else {
      log.push(logDamage(target, target.totalHp / 16, true))
    }
    return log
  },
  onDeactivation: (target) => {
    target.attack *= 1.5
    return new Log()
  }
})

const Confusion = assert<Status>({
  name: 'Confusion',
  turnsActive: 0,
  onTurnStart: (status, target, move) => {
    const ratio = getCondition(target, 'Raid') ? 64 : 16
     if (status.turnsActive >= 4 || Math.random() < 0.25) {
      removeCondition(target, 'Confusion')
      return new Log().add(`${target.species} snapped out of confusion`)
    }
    if (Math.random() < 0.33) {
      const log = new Log()
      log.add(`${target.species} hurt itself in its confusion`)
      log.push(logDamage(target, target.totalHp / ratio, true))
      move.failed = true
      return log
    }
    return new Log()
  },
})

const AlreadyHit = assert<Status>({
  name: 'Already Hit',
  turnsActive: 0,
  onTurnEnd: (target) => {
    removeCondition(target, 'Already Hit')
    return new Log()
  }
})

const Bound = assert<Status>({
  name: 'Bound',
  turnsActive: 0,
  onActivation: (battler) => {
    return APPLY_TEMP_STATUS(battler, {...ConditionMap['TrappedInBattle']}, '')
  },
  onTurnEnd: (target, status) => {
    const log = new Log()
    const turnsActive = status.p?.longer ? 7 : 4
    if (status.turnsActive === turnsActive && Math.random() < 0.5 || status.turnsActive > turnsActive) {
      removeCondition(target, 'Bound')
      removeCondition(target, 'TrappedInBattle')
      log.add(`${target.species} became unbound`)
      return log
    }
    log.add(`${target.species} took some damage from the trap`)
    if (getCondition(target, 'Raid')) {
      log.push(logDamage(target, target.totalHp / 48, true))
    } else {
      log.push(logDamage(target, target.totalHp / 16, true))
    }

    return log
  },
})

const Charged = assert<Status>({
  name: 'Charged', turnsActive: 0,
  onTargetMove: ({caster, move}) => {
    if (move.type === 'Electric') {
      move.power *= 2
      removeCondition(caster, 'Charged')
    }
    return new Log()
  },
})

const Drowsy = assert<Status>({
  name: 'Drowsy', turnsActive: 0,
  onTurnEnd: (battler, status) => {
    if (status.turnsActive >= 1) {
      removeCondition(battler, 'Drowsy')
      return APPLY_STATUS(battler, 'Asleep',
        `${battler.species} fell asleep`)
    }
    return new Log()
  }
})

const Electrified = assert<Status>({
  name: 'Electrified', turnsActive: 0,
  onTargetMove: ({move}) => {
    move.type = 'Electric'
    return new Log()
  },
  onTurnEnd: (battler) => {
    removeCondition(battler, 'Electrified')
    return new Log()
  },
})

const Enduring = assert<Status>({
  name: 'Enduring', turnsActive: 0,
  onTurnEnd: (battler) => {
    removeCondition(battler, 'Enduring')
    return new Log()
  },
  onAfterTargetMove: (inp) => {
    if (inp.target.currentHp <= 0) {
      inp.target.currentHp = 1
      inp.target.fainted = false
      return new Log().add(`${inp.target.species} held on!`)
    }
    return new Log()
  }
})

const FireTrap = assert<Status>({
  name: 'Fire Trap',
  turnsActive: 0,
  onTurnEnd: (target, status) => {
    const log = new Log()
    log.add(`${target.species} was damaged by the magma`)
    if (getCondition(target, 'Raid')) {
      log.push(logDamage(target, target.totalHp / 32, true))
    } else {
      log.push(logDamage(target, target.totalHp / 16, true))
    }
    if (status.turnsActive === 4 && Math.random() < 0.5) {
      removeCondition(target, 'Fire Trap')
    } else if (status.turnsActive >= 5) {
      removeCondition(target, 'Fire Trap')
    }
    return log
  },
})

const Flinch = assert<Status>({
  name: 'Flinch',
  turnsActive: 0,
  onTurnStart: (status, target, move) => {
    removeCondition(target, 'Flinch')
    move.failed = true
    return new Log().add(`${target.species} flinched!`)
  },
  onTurnEnd: (target) => {
    removeCondition(target, 'Flinch')
    return new Log()
  },
})

const Float = assert<Status>({
  name: 'Float',
  turnsActive: 0,
  onTargetMove: ({target, move}) => {
    const log = new Log()
    if (getCondition(target, 'Grounded')) {
      return log.add('[D] Target is also Grounded') // not really floating
    }
    if (move.type === 'Ground' && !getCondition(target, 'Ingrained')) {
      move.failed = true
      log.add(`${target.species} is floating in the air!`)
    }
    return log
  },
})

const FloatUnintentional = assert<Status>({
  name: 'FloatUnintentional',
  turnsActive: 0,
  onTargetMove: ({target, move}) => {
    const log = new Log()
    if (getCondition(target, 'Grounded')) {
      return log.add('[D] Target is also Grounded') // not really floating
    }
    if (move.type === 'Ground' && !getCondition(target, 'Ingrained')) {
      move.failed = true
      log.add('The target is floating in the air!')
    }
    if (move.power === Infinity) {
      return log // Doesn't change OHKO moves
    }
    move.accuracy = Infinity // Guaranteed hit
    return log
  },
  onTurnEnd: (target, status) => {
    const log = new Log()
    if (status.turnsActive === 3) {
      removeCondition(target, 'FloatUnintentional')
    }
    return log
  },
})

/** @deprecated */
const Focused = assert<Status>({
  name: 'Focused',
  turnsActive: 0,
  onActivation: (caster) => {
    const log = new Log()
    log.add(`${caster.species} began tightening its focus`)
    return log
  },
  onTargetMove: ({caster, move}) => {
    const log = new Log()
    if (move.power >= 0) {
      // Break focus
      log.add(`${caster.species} lost its focus`)
      removeCondition(caster, 'Focused')
    }
    return log
  },
})

const Grounded = assert<Status>({
  name: 'Grounded',
  turnsActive: 0,
  onTargetMove: ({target, move}) => {
    const log = new Log()
    if (move.type === 'Ground' && (target.type1 === 'Flying' || target.type2 === 'Flying')) {
      move.type = 'Status'
    }
    // Otherwise it's fine.
    return log
  },
  onTurnEnd: (target, status) => {
    const log = new Log()
    // Nominally lasts 5 turns unless you're a rooster
    if (status.turnsActive === 5 || status.p?.Roost) {
      removeCondition(target, 'Grounded')
    }
    return log
  },
})

const Infatuated = assert<Status>({
  name: 'Infatuated',
  turnsActive: 0,
  onTurnStart: (status, target, move) => {
    if (status.turnsActive >= 4 || Math.random() < 0.25) {
      if (getCondition(target, 'Infatuated')) {
        removeCondition(target, 'Infatuated')
        return new Log().add(`${target.species} fell out of love 💔`)
      }
    }
    if (Math.random() < 0.5) {
      move.failed = true
      return new Log()
        .add(`${target.species} is immobilized by love ❤️`)
    }
    return new Log()
  },
})

const Seeded = assert<Status>({
  name: 'Seeded',
  turnsActive: 0,
  onTurnEnd: (target, status) => { 
    const pctCng = (() => {
      if (getCondition(target, 'Raid')) return 64
      return 16
    })()
    const caster = status.p?.caster
    const log = new Log()
    if (!caster) {
      return log
    }
    log.add(`${target.species}'s health was sapped by ${caster.species}`)
    log.push(logDamage(target, target.totalHp / pctCng, true))
    log.push(logHeal(caster, caster.totalHp / pctCng))
    return log
  },
})

const HandHelped = assert<Status>({
  name: 'Hand Helped',
  turnsActive: 0,
  onTargetMove: ({caster, move}) => {
    if (!getCondition(caster, 'Hand Helped')) return new Log()
    move.power *= 1.5
    return new Log()
  },
  onTurnEnd: (caster) => {
    removeCondition(caster, 'Hand Helped')
    return new Log()
  }
})

const FutureSeen = assert<Status>({
  name: 'Future Seen',
  turnsActive: 0,
  onTurnEnd: (battler, status) => {
    if (status.turnsActive < 2) {
      return new Log().debug(`Turn ${status.turnsActive}/2 to do ${status.p?.dmg} on ${battler.species}`)
    }
    // Calculate damage
    const dmg = status.p?.dmg ?? 0
    removeCondition(battler, 'Future Seen')
    const log = new Log().add('The move finally struck!')
      .debug(`Deal ${dmg} damage to ${battler.species}`)
    log.push(logDamage(battler, dmg, true))
    return log
  }
})

const Wishful = assert<Status>({
  name: 'Wishful',
  turnsActive: 0,
  onTurnEnd: (target, status) => {
    const log = new Log()
    if (status.turnsActive === 2) {
      const heal = (() => {
        if (getCondition(target, 'Raid')) {
          return target.totalHp / 16
        }
        return target.totalHp / 2
      })()
      log.push(logHeal(target, heal))
      log.add(`${target.species}'s wish came true`)
      removeCondition(target, 'Wishful')
    }
    return log
  },
})

const Taunted = assert<Status>({
  name: 'Taunted', turnsActive: 0,
  // For purposes of this game, to make things simpler,
  // we just won't have any support moves ever.
  onActivation: (target) => {
    target.movepool = target.movepool
      .filter(m => !SupportMoves.includes(m.name as MoveId))
    return new Log()
  },
  onTargetMove: (inp) => {
    if (!getCondition(inp.caster, 'Taunted')) return new Log()
    // Check that this move is canonically supposed to not do any damage.
    // We also need to make sure certain type-shifting moves like
    // Hidden Power do exist in the lookup.
    // Of course, Hidden Power is a damaging move and won't be subject to
    // Taunt.
    if (Movepool[inp.move.name] !== undefined && Movepool[inp.move.name].power === 0) {
      inp.move.failed = true
      return new Log().add(`${inp.move.name} cannot be used.`)
    }
    return new Log()
  }
})

const Substituting = assert<Status>({
  name: 'Substituting',
  turnsActive: 0,
  onActivation: (caster) => {
    // Bosses cannot set up more than 500HP in this way.
    caster['substituteHp'] = Math.min(caster.totalHp / 4, 500)
    return new Log()
  },
  onTargetMove: (inp) => {
    if (!inp.move.sound && getCondition(inp.target, 'Substituting')) {
      inp.move.failed = false // Need to repair damage later
      return new Log()
        .add('The substitute took the damage')
    }
    // Sound-based moves break through sub
    return new Log()
  },
  onAfterTargetMove: (inp) => {
    if (inp.move.sound) return new Log() // Ignore
    inp.target['substituteHp'] -= inp.damage || 0
    const log = new Log()
    log.push(logHeal(inp.target, inp.damage || 0))
    if (inp.target['substituteHp'] <= 0) {
      removeCondition(inp.target, 'Substituting')
      return log.add('The substitute broke')
    }
    return log
  },
})

const Speechless = assert<Status>({
  name: 'Speechless',
  turnsActive: 0,
  onTurnStart: (status, _, move) => {
    const log = new Log()
    if (move.sound) {
      move.failed = true
    }
    return log
  },
  onTurnEnd: (caster: Pokemon, status: Status) => {
    // Lasts two turns
    if (status.turnsActive >= 2) {
      if (getCondition(caster, 'Speechless')) {
        removeCondition(caster, 'Speechless')
      }
    }
    return new Log()
  },
})

const Safeguard = assert<Status>({
  name: 'Safeguard',
  turnsActive: 0,
  onTurnEnd: (caster: Pokemon, status: Status) => {
    // Lasts five turns
    if (status.turnsActive >= 5) {
      if (getCondition(caster, 'Safeguard')) {
        removeCondition(caster, 'Safeguard')
      }
    }
    return new Log()
  },
  onAfterTargetMove: ({target}) => {
    const log = new Log()
    if (target.status) {
      log.push(target.status.onDeactivation?.(target))
      target.status = undefined
      log.add(`${target.species} shrugged off the status effect`)
    }
    return log
  },
})

const Recharge = assert<Status>({
  name: 'Recharge',
  turnsActive: 0,
  onTargetMove: ({caster, move}) => {
    if (getCondition(caster, 'Recharge')) {
      removeCondition(caster, 'Recharge')
      move.failed = true
      return new Log().add(`${caster.species} must recharge!`)
    }
    // This should never happen.
    return new Log()
  },
})

const RaidProtect = assert<Status>({
  name: 'Raid Protect',
  turnsActive: 0,
  onActivation: (caster) => {
    /*
     *   | Pkmn       | Defense | Boosted Defense | Turns |
     *    ------------------------------------------------
     *   | Shuckle 3* |     230 |             920 |     9 |
     *   | Aggron  4* |     180 |             765 |     7 |
     *   | Suicune 5* |     115 |             575 |     5 |
     */
    const betterStat = Math.max(caster.defense, caster.spDefense)
    const raidProtectTurns = Math.max(Math.floor(betterStat / 100), 3)
    caster['raidProtectTurns'] = raidProtectTurns
    const log = new Log()
    log.add(`The shield appears to have ${raidProtectTurns} layers`)
    return log
  },
  onTargetMove: (input) => {
    const log = new Log()
    const {target, move} = input
    if (!getCondition(target, 'Raid Protect')) return new Log()

    if (move.power) {
      if (move.power <= 1) {
        move.power = 0.01
      } else {
        move.power -= 0.99
      }
    }
    return log
  },
  onAfterTargetMove: (input) => {
    const {damage, target} = input
    const log = new Log()
    if (damage) {
      target['raidProtectTurns']--
      log.add(`${target.species} partially protected itself!`)
      log.add(`The protective shielding lost a layer, ${target['raidProtectTurns']} remain`)
      if (target['raidProtectTurns'] <= 0) {
        if (getCondition(target, 'Raid Protect')) {
          removeCondition(target, 'Raid Protect')
          BUFF_STAT(target, input, 'defense', -1)
          BUFF_STAT(target, input, 'spDefense', -1)
          log.add(`${target.species} lost its shield. Its defenses dropped.`)
        }
      }
    }
    return log
  },
  onTurnEnd: (caster, _, field) => {
    // Give a reason for entry hazards to still matter in the course of a raid.
    // This can be stacked to do a non-trivial amount of chip damage.
    const raidField = field.sides.Opposing
    const isFlying = caster.type1 === 'Flying' || caster.type2 === 'Flying'
    const log = new Log()
    if (raidField.spikes && !isFlying) {
      log.add(`The gigantic raid boss stepped on spikes`)
      log.push(logDamage(caster, raidField.spikes * 10, true))
    }
    if (raidField.stickyWeb && !isFlying) {
      log.add(`The gigantic raid boss stepped on sticky webbing`)
      log.push(logDamage(caster, 5, true))
    }
    if (raidField.toxicSpikes && caster.type1 !== 'Poison' && caster.type2 !== 'Poison' && !isFlying) {
      log.add(`The gigantic raid boss stepped on poison spikes`)
      log.push(logDamage(caster, raidField.toxicSpikes * 30, true))
    }
    if (raidField.stealthRock) {
      let srDmg = typeMatchup.Rock[caster.type1]
      if (caster.type2) {
        srDmg *= typeMatchup.Rock[caster.type2]
      }
      log.add(`The gigantic raid boss crashed into pointed spikes`)
      log.push(logDamage(caster, srDmg * 15, true))
    }
    if (raidField.sharpSteel) {
      let srDmg = typeMatchup.Steel[caster.type1]
      if (caster.type2) {
        srDmg *= typeMatchup.Steel[caster.type2]
      }
      log.add(`The gigantic raid boss crashed into sharp steel`)
      log.push(logDamage(caster, srDmg * 15, true))
    }
    return log
  }
})

const ProtectWide = assert<Status>({
  name: 'ProtectWide',
  turnsActive: 0,
  onTurnEnd: (caster) => {
    removeCondition(caster, 'ProtectWide')
    return nop()
  },
  onTargetMove: ({target, move}) => {
    if (!getCondition(target, 'ProtectWide')) return new Log()
    if (['All Opponents', 'Everyone', 'Nearby Opponents'].includes(move.aoe)) {
      move.failed = true // Move fails
      return new Log().add(`${target.species} protected itself!`)
    }
    return new Log() // No protection
  },
})

const ProtectQuick = assert<Status>({
  name: 'ProtectQuick',
  turnsActive: 0,
  onTurnEnd: (caster) => {
    removeCondition(caster, 'ProtectQuick')
    return nop()
  },
  onTargetMove: ({target, move}) => {
    if ((move.priority || 0) > 0) {
      move.failed = true // Move fails
      return new Log().add(`${target.species} protected itself!`)
    }
    return new Log() // No protection
  },
})

const Quick = assert<Status>({
  name: 'Quick',
  turnsActive: 0,
  onActivation: (caster: Pokemon) => {
    caster.speed *= 100
    return new Log()
  },
  onTurnEnd: (caster: Pokemon, status: Status) => {
    // Lasts two turns
    if (status.turnsActive >= 1) {
      if (getCondition(caster, 'Quick')) {
        removeCondition(caster, 'Quick')
        caster.speed /= 100 // Reverse effect
      }
    }
    return new Log()
  },
})

const ProtectSpiky = assert<Status>({
  name: 'ProtectSpiky',
  turnsActive: 0,
  onTurnEnd: (caster) => {
    removeCondition(caster, 'ProtectSpiky')
    return nop()
  },
  onTargetMove: (inp) => {
    const {caster, target, move} = inp
    if (!getCondition(target, 'ProtectSpiky')) return new Log()
    if (['Single Ally', 'Self', 'All Allies'].includes(move.aoe)) return new Log()
    const log = new Log()
    if (move.power > 0) {
      move.failed = true // Move fails
      log.add(`${target.species} protected itself!`)
      if (move.contact) {
        const ratio = getCondition(caster, 'Raid') ? 32 : 8
        log.push(logDamage(caster, caster.totalHp / ratio, true))
      }
    }
    return log
  },
})

const ShellTrapped = assert<Status>({
  name: 'ShellTrapped',
  turnsActive: 0,
  onTurnEnd: (caster) => {
    removeCondition(caster, 'ShellTrapped')
    return nop()
  },
  onTargetMove: (inp) => {
    const {caster, target, move} = inp
    if (!getCondition(target, 'ShellTrapped')) return new Log()
    if (['Single Ally', 'Self', 'All Allies'].includes(move.aoe)) return new Log()
    const log = new Log()
    if (move.contact) {
      const ratio = getCondition(caster, 'Raid') ? 64 : 8
      log.push(logDamage(caster, caster.totalHp / ratio, true))
    }
    return log
  },
})

const ProtectBunker = assert<Status>({
  name: 'ProtectBunker',
  turnsActive: 0,
  onTurnEnd: (caster) => {
    removeCondition(caster, 'ProtectBunker')
    return nop()
  },
  onTargetMove: (inp) => {
    const {target, move} = inp
    if (!getCondition(target, 'ProtectBunker')) return new Log()
    if (['Single Ally', 'Self', 'All Allies'].includes(move.aoe)) return new Log()
    const log = new Log()
    if (move.power > 0) {
      move.failed = true // Move fails
      log.add(`${target.species} protected itself!`)
      if (move.contact) {
        log.push(APPLY_STATUS(target, 'Poison',
          `Ouch! ${target.species} was poisoned by the poisonous barbs.`))
      }
    }
    return log
  },
})

const ProtectKing = assert<Status>({
  name: 'ProtectKing',
  turnsActive: 0,
  onTurnEnd: (caster) => {
    removeCondition(caster, 'ProtectKing')
    return nop()
  },
  onTargetMove: (inp) => {
    const {caster, target, move} = inp
    if (!getCondition(target, 'ProtectKing')) return new Log()
    if (['Single Ally', 'Self', 'All Allies'].includes(move.aoe)) return new Log()
    const log = new Log()
    if (move.power > 0) {
      move.failed = true // Move fails
      log.add(`${target.species} protected itself!`)
      if (move.contact) {
        log.push(BUFF_STAT(caster, inp, 'attack', -2))
      }
    }
    return log
  },
})

const ProtectCrafty = assert<Status>({
  name: 'ProtectCrafty',
  turnsActive: 0,
  onTurnEnd: (caster) => {
    removeCondition(caster, 'ProtectCrafty')
    return nop()
  },
  onTargetMove: ({target, move}) => {
    if (!getCondition(target, 'ProtectCrafty')) return new Log()
    if (['Single Ally', 'Self', 'All Allies'].includes(move.aoe)) return new Log()
    if (move.power === 0) {
      move.failed = true // Move fails
      return new Log().add(`${target.species} protected itself!`)
    }
    return new Log() // No protection
  },
})

const ProtectObstruct = assert<Status>({
  name: 'ProtectObstruct',
  turnsActive: 0,
  onTurnEnd: (caster) => {
    removeCondition(caster, 'ProtectObstruct')
    return nop()
  },
  onTargetMove: (inp) => {
    const {caster, target, move} = inp
    if (!getCondition(target, 'ProtectObstruct')) return new Log()
    if (['Single Ally', 'Self', 'All Allies'].includes(move.aoe)) return new Log()
    const log = new Log()
    if (move.power > 0) {
      move.failed = true // Move fails
      log.add(`${target.species} protected itself!`)
      if (move.contact) {
        log.push(BUFF_STAT(caster, inp, 'defense', -2))
      }
    }
    return log
  },
})

const ProtectSilky = assert<Status>({
  name: 'ProtectSilky',
  turnsActive: 0,
  onTurnEnd: (caster) => {
    removeCondition(caster, 'ProtectSilky')
    return nop()
  },
  onTargetMove: (inp) => {
    const {caster, target, move} = inp
    if (!getCondition(target, 'ProtectSilky')) return new Log()
    if (['Single Ally', 'Self', 'All Allies'].includes(move.aoe)) return new Log()
    const log = new Log()
    if (move.power > 0) {
      move.failed = true // Move fails
      log.add(`${target.species} protected itself!`)
      if (move.contact) {
        log.push(BUFF_STAT(caster, inp, 'speed', -1))
      }
    }
    return log
  },
})

const Protect = assert<Status>({
  name: 'Protect',
  turnsActive: 0,
  onTurnEnd: (caster) => {
    removeCondition(caster, 'Protect')
    return nop()
  },
  onTargetMove: ({target, move}) => {
    if (!getCondition(target, 'Protect')) return new Log()
    if (move.power > 0 ||
        ['Single Opponent', 'Nearby Opponents', 'Everyone', 'All Opponents'].includes(move.aoe)) {
      move.failed = true // Move fails
      return new Log().add(`${target.species} protected itself!`)
    }
    return new Log()
  },
})

const MaxGuard = assert<Status>({
  name: 'MaxGuard',
  turnsActive: 0,
  onTurnEnd: (caster) => {
    removeCondition(caster, 'MaxGuard')
    return nop()
  },
  onTargetMove: ({target, move}) => {
    if (!getCondition(target, 'MaxGuard')) return new Log()
    if (move.power > 0 || move.aoe === 'Single Opponent') {
      move.failed = true // Move fails
      return new Log().add(`${target.species} protected itself!`)
    }
    return new Log()
  },
})

const Powdered = assert<Status>({
  name: 'Powdered', turnsActive: 0,
  onTargetMove: ({caster, move}) => {
    if (move.type !== 'Fire') return new Log()
    const ratio = (() => {
      if (getCondition(caster, 'Raid')) return 32
      return 4
    })()
    const log = new Log()
    log.add(`The powder blew up in ${caster.species}'s face!'`)
    log.push(logDamage(caster, caster.totalHp / ratio, true))
    move.failed = true
    return log
  },
  onTurnEnd: (caster) => {
    removeCondition(caster, 'Powdered')
    return new Log()
  }
})

const Tarred = assert<Status>({
  name: 'Tarred', turnsActive: 0,
  onAfterTargetMove: ({caster, move, damage}) => {
    if (move.type !== 'Fire') return new Log()
    const ratio = 2
    const log = new Log()
    log.add(`The tar on ${caster.species} ignited!'`)
    log.push(logDamage(caster, (damage ?? 1) * ratio, false))
    return log
  },
})

const PoisonBad = assert<Status>({
  name: 'PoisonBad',
  turnsActive: 0,
  onTurnEnd: (target, status) => {
    const log = new Log()
    log.add(`${target.species} took more damage from the severe poison`)
    if (getCondition(target, 'Raid')) {
      // Cannot do more than 300 points of damage in this way.
      const damage = Math.min(target.totalHp / 48 * status.turnsActive, 300)
      log.push(logDamage(target, damage, true))
    } else {
      log.push(logDamage(target, target.totalHp / 16 * status.turnsActive, true))
    }
    return log
  },
})

const PetalDancing = assert<Status>({
  name: 'Petal Dancing',
  turnsActive: 0,
  onTurnEnd: (caster, status) => {
    if (status.turnsActive === 2 && Math.random() < 0.5 || status.turnsActive > 2) {
      removeCondition(caster, 'Petal Dancing')
      return APPLY_TEMP_STATUS(caster, Confusion,
        `${caster.species} grew confused from exhaustion`)
    }
    return nop()
  },
})

const Thrashing = assert<Status>({
  name: 'Thrashing',
  turnsActive: 0,
  onTurnEnd: (caster, status) => {
    if (status.turnsActive === 2 && Math.random() < 0.5 || status.turnsActive > 2) {
      removeCondition(caster, 'Thrashing')
      return APPLY_TEMP_STATUS(caster, Confusion,
        `${caster.species} grew confused from exhaustion`)
    }
    return nop()
  },
})

const Outraged = assert<Status>({
  name: 'Outraged',
  turnsActive: 0,
  onTurnEnd: (caster, status) => {
    if (status.turnsActive === 2 && Math.random() < 0.5 || status.turnsActive > 2) {
      removeCondition(caster, 'Outraged')
      return APPLY_TEMP_STATUS(caster, Confusion,
        `${caster.species} grew confused from exhaustion`)
    }
    return nop()
  },
})

const FuryRaging = assert<Status>({
  name: 'Fury Raging',
  turnsActive: 0,
  onTurnEnd: (caster, status) => {
    if (status.turnsActive === 2 && Math.random() < 0.5 || status.turnsActive > 2) {
      removeCondition(caster, 'Fury Raging')
      return APPLY_TEMP_STATUS(caster, Confusion,
        `${caster.species} grew confused from exhaustion`)
    }
    return nop()
  },
})

const MatUp = assert<Status>({
  name: 'MatUp',
  turnsActive: 0,
  onTurnEnd: (caster) => {
    removeCondition(caster, 'MatUp')
    return nop()
  },
  onTargetMove: ({target, move}) => {
    if (move.power > 0) {
      move.failed = true // Move fails
      return new Log().add(`${target.species} protected itself!`)
    }
    return new Log() // No protection
  },
})

const Lucky = assert<Status>({
  name: 'Lucky',
  turnsActive: 0,
  onTargetMove: ({move}) => {
    const log = new Log()
    move.criticalHit = 0 // Make it impossible
    return log
  },
  onTurnEnd: (target, status) => {
    const log = new Log()
    if (status.turnsActive === 5) {
      removeCondition(target, 'Lucky')
    }
    return log
  },
})

const Levitating = assert<Status>({
  name: 'Levitating',
  turnsActive: 0,
  onTargetMove: ({target, move}) => {
    const log = new Log()
    if (getCondition(target, 'Grounded')) {
      return log.add('[D] Target is also Grounded') // not really floating
    }
    if (move.type === 'Ground') {
      log.add('It had no effect on the floating target')
      move.accuracy = 0
    }
    return log
  },
})

const EyedUp = assert<Status>({
  name: 'EyedUp',
  turnsActive: 0,
  onTargetMove: ({target, move}) => {
    if (getCondition(target, 'EyedUp') && move.type === 'Psychic') {
      if (target.type1 === 'Dark' || target.type2 === 'Dark') {
        move.type = 'Status'
      }
    }
    return new Log()
  }
})

const Sleuthed = assert<Status>({
  name: 'Sleuthed',
  turnsActive: 0,
  onTargetMove: ({target, move}) => {
    if (getCondition(target, 'Sleuthed')) {
      if (target.type1 === 'Ghost' || target.type2 == 'Ghost') {
        if (move.type === 'Normal' || move.type === 'Fighting') {
          move.type = 'Status'
        }
      }
    }
    return new Log()
  }
})

const Dynamaxed = assert<Status>({
  name: 'Dynamaxed',
  turnsActive: 0,
  onTargetMove: ({target, move}) => {
    if (getCondition(target, 'Flinch')) {
      removeCondition(target, 'Flinch')
      move.failed = false
    }
    return new Log()
  },
  onTurnEnd: (target, status) => {
    if (status.turnsActive >= 3) {
      removeCondition(target, 'Dynamaxed')
      const {moves, movepool} = status.p!
      target.move = moves!
      target.movepool = movepool!
      return new Log().add(`${target.species} reverted to normal size`)
    }
    return new Log()
  }
})

const Swarming = assert<Status>({
  name: 'Swarming', turnsActive: 0,
  onTurnEnd: (target, status) => {
    if (status.turnsActive > 3) {
      return new Log().add('The swarming has subsided.')
    }
    target.attack += 10
    target.defense += 10
    target.spAttack += 10
    target.spDefense += 10
    target.speed += 10
    return new Log().add(`${target.species} is powered up by the swarm.`)
  }
})

const Vetrifying = assert<Status>({
  name: 'Vetrifying', turnsActive: 0,
  onTurnEnd: (target, status) => {
    if (status.turnsActive > 3) {
      return new Log().add('The vetrification process has halted.')
    }
    target.attack -= 10
    target.defense -= 10
    target.spAttack -= 10
    target.spDefense -= 10
    target.speed -= 10
    return new Log().add(`${target.species} is being vetrified! Its base stats dropped.`)
  }
})

const Sprinting = assert<Status>({
  name: 'Sprinting', turnsActive: 0,
  onTargetMove: (inp) => {
    if (inp.move.attackKey === 'attack') {
      inp.move.power *= 2
    }
    return new Log()
  },
  onTurnEnd: (target, status) => {
    if (status.turnsActive > 1) {
      removeCondition(target, 'Sprinting')
    }
    return new Log()
  }
})

const Mindfulness = assert<Status>({
  name: 'Mindfulness', turnsActive: 0,
  onTargetMove: (inp) => {
    if (inp.move.attackKey === 'spAttack') {
      inp.move.power *= 2
    }
    inp.move.accuracy = Infinity
    return new Log()
  },
  onTurnEnd: (target, status) => {
    if (status.turnsActive > 1) {
      removeCondition(target, 'Mindfulness')
    }
    return new Log()
  }
})

const Octolocked = assert<Status>({
  name: 'Octolocked',
  turnsActive: 0,
  onTurnEnd: (caster) => {
    if (caster.statBuffs.defense > -6) {
      caster.statBuffs.defense--
    }
    if (caster.statBuffs.spDefense > -6) {
      caster.statBuffs.spDefense--
    }
    return new Log()
      .add(`${caster.species} is locked up. Its defenses dropped!`)
  },
})

// Applied to Pokémon to represent their on-field status as a specific marker
const OnField = assert<Status>({
  name: 'OnField', turnsActive: 0,
})

// A Pokémon with this condition will be replaced with the next healthy Pokémon
const SwitchOut = assert<Status>({
  name: 'SwitchOut', turnsActive: 0,
})

// Marked when a Pokémon cannot leave the field
const TrappedInBattle = assert<Status>({
  name: 'TrappedInBattle', turnsActive: 0,
  onActivation: (battler) => {
    const log = new Log()
    if (battler.type1 === 'Ghost' || battler.type2 === 'Ghost') {
      log.add('Ghost-type Pokémon cannot be trapped')
      removeCondition(battler, 'TrappedInBattle')
      return log
    }
    if (battler.heldItemKey === 'shedshell') {
      log.add(`${battler.species}'s Shed Shell activated`)
      removeCondition(battler, 'TrappedInBattle')
      return log
    }
    if (battler.heldItemKey === 'smokeball') {
      log.add(`${battler.species}'s Smoke Ball activated`)
      removeCondition(battler, 'TrappedInBattle')
      return log
    }
    if (battler.heldItemKey === 'pokedoll') {
      log.add(`${battler.species} tossed the PokéDoll to enable a quick getaway`)
      removeCondition(battler, 'TrappedInBattle')
      return log
    }
    return log
  }
})

const Raging = assert<Status>({
  name: 'Raging', turnsActive: 0,
  onTargetMove: (inp) => {
    const l = new Log().add(`${inp.caster.species} is raging`)
    l.push(BUFF_STAT(inp.caster, inp, 'attack', 1))
    return l
  },
})

// Times hit for Rage Fist
const TimesHit = assert<Status>({
  name: 'TimesHit', turnsActive: 0,
  p: {
    rageFist: 0,
  }
})

const Stockpiling = assert<Status>({
  name: 'Stockpiling', turnsActive: 0,
  p: {
    stockpile: 0,
  }
})

const CriticalHits = assert<Status>({
  name: 'CriticalHits', turnsActive: 0,
  p: {
    criticalHits: 0,
  }
})

const LastMove = assert<Status>({
  name: 'LastMove', turnsActive: 0,
  p: {
    selectedMove: undefined,
  }
})

const LastDamage = assert<Status>({
  name: 'LastDamage', turnsActive: 0,
  p: {
    selectedMove: undefined,
  }
})

const NextMove = assert<Status>({
  name: 'NextMove', turnsActive: 0,
  p: {
    selectedMove: undefined,
  }
})

const GuaranteedHit = assert<Status>({
  name: 'GuaranteedHit', turnsActive: 0,
  onTargetMove: (inp) => {
    const status = getCondition(inp.caster, 'GuranteedHit')
    if (status) {
      inp.move.accuracy = Infinity
    }
    return new Log()
  },
  onTurnEnd: (caster, status) => {
    if (status.turnsActive > 2) {
      removeCondition(caster, 'GuranteedHit')
    }
    return new Log()
  }
})

const Encoring = assert<Status>({
  name: 'Encoring', turnsActive: 0,
  onTurnEnd: (caster, status) => {
    if (status.turnsActive >= 3) {
      const {moves, movepool} = status.p!
      removeCondition(caster, 'Encoring')
      caster.move = moves!
      caster.movepool = movepool!
      return new Log().add(`${caster.species} finished their encore`)
    }
    return new Log()
  }
})

const Nightmaring = assert<Status>({
  name: 'Nightmaring',
  turnsActive: 0,
  onTurnEnd: (target) => {
    const log = new Log()
    if (target.status?.name === 'Asleep') {
      log.add(`${target.species} is having a nightmare`)
      if (getCondition(target, 'Raid')) {
        log.push(logDamage(target, target.totalHp / 64, true))
      } else {
        log.push(logDamage(target, target.totalHp / 4, true))
      }
    } else {
      removeCondition(target, 'Nightmaring')
    }
    return log
  },
})

const Cursed = assert<Status>({
  name: 'Cursed',
  turnsActive: 0,
  onTurnEnd: (target) => {
    const log = new Log()
    log.add(`${target.species} is struck by the power of the curse`)
    if (getCondition(target, 'Raid')) {
      log.push(logDamage(target, target.totalHp / 64, true))
    } else {
      log.push(logDamage(target, target.totalHp / 4, true))
    }
    return log
  },
})

const HealBlocked = assert<Status>({
  name: 'HealBlocked', turnsActive: 0,
})

const Terastalized = assert<Status>({
  name: 'Terastalized', turnsActive: 0,
  onTargetMove: (inp) => {
    const status = getCondition(inp.caster, 'Terastalized')
    if (status) {
      if (inp.move.type === status.p?.type) {
        inp.move.power *= 1.5
      }
    }
    return new Log()
  },
})

const DestinyBonded = assert<Status>({
  name: 'DestinyBonded', turnsActive: 0,
  onAfterTargetMove: (inp) => {
    const log = new Log()
    if (inp.caster.currentHp <= 0) {
      // Target fained
      if (getCondition(inp.caster, 'DestinyBonded') && !getCondition(inp.target, 'Raid')) {
        log.add('The Destiny Bond must come true. You cannot avoid your fate.')
        log.push(logDamage(inp.target, inp.target.totalHp, true))
        removeCondition(inp.caster, 'DestinyBonded')
      }
    }
    return log
  }
})

const Begrudged = assert<Status>({
  name: 'Begrudged', turnsActive: 0,
  onAfterTargetMove: (inp) => {
    const log = new Log()
    if (inp.target.currentHp <= 0) {
      // Target fained
      if (getCondition(inp.caster, 'Begrudged')) {
        log.add('The grudge has reached its zenith!')
        removeCondition(inp.caster, 'Begrudged')
        // "Disable" logic
        const targetMoveCondition = getCondition(inp.target, 'LastMove')
        const targetMove = targetMoveCondition!.p!.selectedMove!
        const mIndex = inp.target.movepool.findIndex(m => m.name === targetMove.name)
        if (mIndex === -1) {
          inp.move.failed = true
          return log.add('It failed...')
        }
        inp.target.move.splice(mIndex, 1)
        inp.target.movepool.splice(mIndex, 1)
        log.add(`${inp.prefix} ${inp.target.species}'s ${targetMove.name} was disabled`)
      }
    }
    return log
  }
})

const Glaiven = assert<Status>({
  name: 'Glaiven', turnsActive: 0,
  onTargetMove: (inp) => {
    const status = getCondition(inp.caster, 'Glaiven')
    if (status) {
      inp.move.power *= 2 // Moves are twice as damaging
      inp.move.accuracy = Infinity // And cannot miss
    }
    return new Log()
  },
  onTurnEnd: (target, status) => {
    if (status.turnsActive > 1) {
      removeCondition(target, 'Glaiven')
    }
    return new Log()
  }
})

const HammerTime = assert<Status>({
  name: 'HammerTime', turnsActive: 0,
  onTargetMove: (inp) => {
    const status = getCondition(inp.caster, 'HammerTime')
    if (status && inp.move.name === 'Gigaton Hammer') {
      inp.move.failed = true
      return new Log().add('Its wrists are still a bit wobbly. The move failed.')
    }
    return new Log()
  },
  onTurnEnd: (target, status) => {
    if (status.turnsActive > 1) {
      removeCondition(target, 'HammerTime')
    }
    return new Log()
  }
})

const BloodMooning = assert<Status>({
  name: 'BloodMooning', turnsActive: 0,
  onTargetMove: (inp) => {
    const status = getCondition(inp.caster, 'BloodMooning')
    if (status && inp.move.name === 'Blood Moon') {
      inp.move.failed = true
      return new Log().add('The move failed.')
    }
    return new Log()
  },
  onTurnEnd: (target, status) => {
    if (status.turnsActive > 1) {
      removeCondition(target, 'BloodMooning')
    }
    return new Log()
  }
})

const SaltCure = assert<Status>({
  name: 'SaltCure',
  turnsActive: 0,
  onTurnEnd: (target) => { 
    const log = new Log()
    log.add(`${target.species} is curing`)
    let multiplier = 8
    if (['Water', 'Steel'].includes(target.type1)) {
      multiplier = 4
    }
    if (['Water', 'Steel'].includes(target.type2 ?? target.type1)) {
      multiplier = 4
    }
    
    if (getCondition(target, 'Raid')) {
      multiplier *= 64
    }
    log.push(logDamage(target, target.totalHp / multiplier, true))
    return log
  },
})

const Syruped = assert<Status>({
  name: 'Syruped',
  turnsActive: 0,
  onTurnEnd: (target, status) => {
    const log = new Log()
    const turnsActive = 3
    if (status.turnsActive === turnsActive) {
      removeCondition(target, 'Syruped')
      log.add(`${target.species} got out of the syrup`)
      return log
    }
    log.add(`${target.species} is still stuck in sticky syrup!`)
    target.speed = Math.max(target.speed - 1, -6)
    log.add(`${target.species}'s speed dropped`)
    return log
  },
})

const Terastallized = assert<Status>({
  name: 'Terastallized',
  turnsActive: 0,
  onActivation: (battler, status) => {
    const stab1 = {...ConditionMap.Stab}
    stab1.p = { type: battler.type1 }
    if (status.p!.type === battler.type1) {
      status.p!.stabTera = true
    } else {
      battler.conditions.push(stab1)
    }
    battler.type1 = status.p!.type ?? 'Status'

    if (battler.type2) {
      const stab2 = {...ConditionMap.Stab}
      stab2.p = { type: battler.type2 }
      if (status.p!.type === battler.type2) {
        status.p!.stabTera = true
      } else {
        battler.conditions.push(stab2)
      }
      battler.type1 = status.p!.type ?? 'Status'
      battler.type2 = undefined
    }
    return new Log().add(`${battler.species} terastallized into a ${status.p!.type}-type!`)
  },
  onTargetMove: (input) => {
    const {caster, move} = input
    const tera = getCondition(caster, 'Terastallized')
    const stab = getCondition(caster, 'Stab')
    if (!tera) return new Log()
    if (!stab) return new Log()
    const teraType = tera.p!.type!
    const isTeraStab = tera.p!.stabTera!
    const normalStab = stab.p!.type!
    if (teraType === move.type) {
      input.move.power *= isTeraStab ? 2 : 1.5
      return new Log().add(`The move was powered up by terastallization.`)
    } else if (normalStab === move.type) {
      input.move.power *= 1.5
    }
    return new Log()
  }
})

const Stab = assert<Status>({
  name: 'Stab',
  turnsActive: 0,
})

const RaidTotem = assert<Status>({
  name: 'RaidTotem',
  turnsActive: 0,
  onBattleStart: (battler) => {
    const log = new Log()
    log.add(`The opposing ${battler.species} unleashed its power`)
    battler.statBuffs.attack++
    battler.statBuffs.spAttack++
    battler.statBuffs.speed++
    log.add(`The opposing ${battler.species}'s attack rose.`)
    log.add(`The opposing ${battler.species}'s special attack rose.`)
    log.add(`The opposing ${battler.species}'s speed rose.`)
    log.add("Yikes, this looks like a problem.")
    return log
  }
})

const RaidAlpha = assert<Status>({
  name: 'RaidAlpha',
  turnsActive: 0,
  onBattleStart: (battler) => {
    const log = new Log()
    log.add(`The opposing ${battler.species} unleashed its power`)
    battler.statBuffs.attack++
    battler.statBuffs.spAttack++
    log.add(`The opposing ${battler.species}'s attack rose.`)
    log.add(`The opposing ${battler.species}'s special attack rose.`)
    if (battler.attack > battler.spAttack) {
      battler.statBuffs.attack++
      log.add(`The opposing ${battler.species}'s attack rose again.`)
    } else {
      battler.statBuffs.spAttack++
      log.add(`The opposing ${battler.species}'s special attack rose again.`)
    }
    log.add("Yikes, this looks like a problem.")
    return log
  }
})

const RaidNoble = assert<Status>({
  name: 'RaidNoble',
  turnsActive: 0,
  onBattleStart: (battler) => {
    const log = new Log()
    log.add(`The opposing ${battler.species} unleashed its power`)
    battler.statBuffs.attack++
    battler.statBuffs.spAttack++
    log.add(`The opposing ${battler.species}'s attack rose.`)
    log.add(`The opposing ${battler.species}'s special attack rose.`)
    if (battler.attack > battler.spAttack) {
      battler.statBuffs.attack++
      log.add(`The opposing ${battler.species}'s attack rose again.`)
    } else {
      battler.statBuffs.spAttack++
      log.add(`The opposing ${battler.species}'s special attack rose again.`)
    }
    log.add("Yikes, this looks like a problem.")
    return log
  }
})

const RaidDifficulty = (rating: number, hp: number, attacks: number, defenses: number, speed: number) => {
  return assert<Status>({
    name: `Raid${rating}`,
    turnsActive: 0,
    onBattleStart: (battler) => {
      const log = new Log()
      log.add(`The opposing ${battler.species} released its raid-iant power`)
      battler.totalHp *= hp
      battler.currentHp *= hp
      battler.attack *= attacks
      battler.defense *= defenses
      battler.spAttack *= attacks
      battler.spDefense *= defenses
      battler.speed *= speed
      log.add("The raid boss looks formidable.")
      return log
    }
  })
}

export const StatusMap = {
  Asleep,
  Burn,
  Frozen: assert<Status>({
    name: 'Frozen',
    turnsActive: 0,
    onActivation: () => { return new Log()},
    onTurnStart: (status, target, move) => {
      if (status.turnsActive > 5 || Math.random() < 0.2) {
        target.status = undefined
        return new Log().add(`${target.species} thawed out`)
      }
      move.failed = true
      return new Log().add(`${target.species} is frozen solid`)
    },
  }),
  Paralyzed: assert<Status>({
    name: 'Paralyzed',
    turnsActive: 0,
    onActivation: (target) => { 
      target.speed /= 1.5
      return new Log()
    },
    onTurnStart: (status, target, move) => {
      if (Math.random() < 0.33) {
        move.failed = true
        return new Log().add(`${target.species} is fully paralyzed!`)
      }
      return new Log()
    },
    onDeactivation: (target) => {
      target.speed *= 1.5
      return new Log()
    }
  }),
  Poison: assert<Status>({
    name: 'Poison',
    turnsActive: 0,
    onTurnEnd: (target) => { 
      const log = new Log()
      log.add(`${target.species} took some damage from poison`)
      if (getCondition(target, 'Raid')) {
        log.push(logDamage(target, target.totalHp / 32, true))
      } else {
        log.push(logDamage(target, target.totalHp / 16, true))
      }
      return log
    },
  }),
}

export const ConditionMap = {
  'Aqua Rung': assert<Status>({
    name: 'Aqua Rung',
    turnsActive: 0,
    onTurnEnd: (target) => { 
      const log = logHeal(target, target.totalHp / 16)
      log.add(`${target.species} healed some health from its aqua ring`)
      return log
    },
  }),
  'Already Hit': AlreadyHit,
  Asleep,
  Biding: assert<Status>({
    name: 'Biding',
    turnsActive: 0,
  }),
  Bound,
  Burn,
  /**
   * For the move Charge.
   */
  Charged,
  /**
   * Charging for 2-turn moves
   */
  Charging: assert<Status>({
    name: 'Charging',
    turnsActive: 0,
  }),
  Confusion,
  Drowsy,
  Dynamaxed,
  Electrified,
  Encore: assert<Status>({
    name: 'Encore',
    turnsActive: 0,
    onTurnEnd: (target) => {
      console.log('Encore')
      const breakages = [
        'The record snapped in half!',
        'The technical record broke!',
        'The record is no longer usable!',
        'The technical record is broken!'
      ]

      if (target.heldItemTotallyConsumed) return new Log()
      // Reset moves
      target.heldItemConsumed = true
      target.heldItemTotallyConsumed = true
      target.movepool = target.move.map(move => Movepool[move] || Movepool.Tackle)
      const msg = randomItem(breakages)
      return new Log().add(msg)
    },
  }),
  Enduring,
  Energized: assert<Status>({
    name: 'Energized', turnsActive: 0,
    onTurnStart: (status, target, move) => {
      move.criticalHit *= 2
      return new Log()
    },
  }),
  'Fire Trap': FireTrap,
  Flinch,
  Float,
  FloatUnintentional,
  Focused,
  Grounded,
  Immobile: assert<Status>({
    name: 'Immobile',
    turnsActive: 0,
    // Mirror conditions for Fly/InAir
    onTargetMove: ({move}) => {
      if (move.name === 'Thunder' ||
          move.name === 'Sky Uppercut' ||
          move.name === 'Hurricane') {
        move.power *= 1
        return new Log()
      }
      if (move.name === 'Gust') {
        move.power *= 2
        return new Log()
      }
      if (move.name === 'Sky Drop') {
        move.accuracy = Infinity
        return new Log()
      }
      move.accuracy = 0
      return new Log()
    },
    onTurnStart: (_, target, move) => {
      move.failed = true
      return new Log().add(`${target.species} can't move!`)
    },
  }),
  Infatuated,
  Ingrained: assert<Status>({
    name: 'Ingrained',
    turnsActive: 0,
    onTurnEnd: (target) => { 
      const log = logHeal(target, target.totalHp / 16)
      log.add(`${target.species} healed some health from its roots`)
      return log
    },
  }),
  Minimized: assert<Status>({
    name: 'Minimized', turnsActive: 0,
    onTargetMove: ({move}) => {
      // This move, while increasing your evasion, makes you more vulnerable to
      // certain attacks. These attacks ignore the evasion boost and do double
      // the original damage.
      if (['Body Slam', 'Dragon Rush', 'Flying Press', 'Heavy Slam', 'Phantom Force', 'Shadow Force', 'Steamroller', 'Stomp', 'Heat Crash', 'Heavy Slam']
        .includes(move.name)) {
          move.power *= 2
          // FIXME: We need to fix the way this is allocated
          move.accuracy = 1
      }
      return new Log()
    }
  }),
  Seeded,
  Levitating,
  Lucky,
  MatUp,
  Mindfulness,
  Octolocked,
  Outraged,
  Thrashing,
  'Petal Dancing': PetalDancing,
  'Fury Raging': FuryRaging,
  PoisonBad,
  Powdered,
  Protect,
  ProtectCrafty,
  ProtectKing,
  ProtectObstruct,
  ProtectSpiky,
  ProtectBunker,
  Quick,
  ProtectQuick,
  ProtectWide,
  ProtectSilky,
  Raid: assert<Status>({
    name: 'Raid',
    turnsActive: 0,
  }),
  'Raid Protect': RaidProtect,
  Recharge,
  Safeguard,
  Speechless,
  Sprinting,
  Substituting,
  Swarming,
  Switcherooed: assert<Status>({
    name: 'Switcherooed',
    turnsActive: 0,
  }),
  Tarred,
  Taunted,
  Underground: assert<Status>({
    name: 'Underground',
    turnsActive: 0,
    onTargetMove: ({move}) => {
      if (move.name === 'Earthquake' || move.name === 'Magnitude') {
        move.power *= 2
        return new Log()
      }
      move.accuracy = 0
      return new Log()
    },
  }),
  Underwater: assert<Status>({
    name: 'Underwater',
    turnsActive: 0,
    onTargetMove: ({move}) => {
      if (move.name === 'Surf') {
        move.power *= 2
        return new Log()
      }
      move.accuracy = 0
      return new Log()
    },
  }),
  Vetrifying,
  InAir: assert<Status>({
    name: 'InAir',
    turnsActive: 0,
    onTargetMove: ({move}) => {
      if (move.name === 'Thunder' ||
          move.name === 'Sky Uppercut' ||
          move.name === 'Hurricane') {
        move.power *= 1
        return new Log()
      }
      if (move.name === 'Gust') {
        move.power *= 2
        return new Log()
      }
      move.accuracy = 0
      return new Log()
    },
  }),
  Bouncing: assert<Status>({
    name: 'Bouncing',
    turnsActive: 0,
    onTargetMove: ({move}) => {
      if (move.name === 'Thunder' ||
          move.name === 'Sky Uppercut' ||
          move.name === 'Hurricane') {
        move.power *= 1
        return new Log()
      }
      if (move.name === 'Gust') {
        move.power *= 2
        return new Log()
      }
      move.accuracy = 0
      return new Log()
    },
  }),
  SkyDropping: assert<Status>({
    name: 'SkyDropping',
    turnsActive: 0,
    onTargetMove: ({move}) => {
      if (move.name === 'Thunder' ||
          move.name === 'Sky Uppercut' ||
          move.name === 'Hurricane') {
        move.power *= 1
        return new Log()
      }
      if (move.name === 'Gust') {
        move.power *= 2
        return new Log()
      }
      move.accuracy = 0
      return new Log()
    },
  }),
  AShadow: assert<Status>({
    name: 'AShadow',
    turnsActive: 0,
    onTargetMove: ({move}) => {
      move.accuracy = 0
      return new Log()
    },
  }),
  Wishful,
  WindingRazors: assert<Status>({
    name: 'WindingRazors',
    turnsActive: 0,
  }),
  SkullDrawn: assert<Status>({
    name: 'SkullDrawn',
    turnsActive: 0,
  }),
  SkyPrepared: assert<Status>({
    name: 'SkyPrepared',
    turnsActive: 0,
  }),
  Geomancying: assert<Status>({
    name: 'Geomancying',
    turnsActive: 0,
  }),
  MeteorGathering: assert<Status>({
    name: 'MeteorGathering',
    turnsActive: 0,
  }),
  PreviousMoveFailed: assert<Status>({
    name: 'PreviousMoveFailed',
    turnsActive: 0,
  }),
  'Future Seen': FutureSeen,
  'Hand Helped': HandHelped,
  Sleuthed,
  EyedUp,
  Beaking: assert<Status>({
    name: 'Beaking',
    turnsActive: 0,
    onActivation: (caster) => {
      const log = new Log()
      log.add(`${caster.species} began heating up`)
      return log
    },
    onTargetMove: ({target, move}) => {
      const log = new Log()
      if (move.contact) {
        // Burn them
        log.push(APPLY_STATUS(target, 'Burn',
            `Ouch! ${target.species} crashed into the flaming beak.`))
      }
      return log
    },
  }),
  ShellTrapped,
  OnField,
  SwitchOut,
  TrappedInBattle,
  Raging,
  MaxGuard,
  Terastalized,
  Glaiven,
  HammerTime,
  BloodMooning,
  TimesHit,
  Stockpiling,
  SaltCure,
  CriticalHits,
  LastMove,
  LastDamage,
  NextMove,
  GuaranteedHit,
  Encoring,
  Nightmaring,
  Cursed,
  HealBlocked,
  DestinyBonded,
  Begrudged,
  Syruped,
  Terastallized,
  Stab,
  RaidTotem,
  RaidAlpha,
  RaidNoble,
  Raid1:  RaidDifficulty(1,  5,     3.25, 3,    2),
  Raid2:  RaidDifficulty(2,  14,    3.75, 4.5,  2.25),
  Raid3:  RaidDifficulty(3,  21.75, 4,    4.5,  2.5),
  Raid4:  RaidDifficulty(4,  22.25, 4,    5.25, 2.75),
  Raid5:  RaidDifficulty(5,  24.75, 4,    5.5,  2.25),
  Raid6:  RaidDifficulty(6,  24,    4,    6.75, 3),
  Raid7:  RaidDifficulty(7,  6.25,  2,    3.5, 3),
  Raid8:  RaidDifficulty(8,  6,     3,    3.75, 3),
  Raid9:  RaidDifficulty(9,  6.5,   3,    4,    2),
  Raid10: RaidDifficulty(10, 6,     3,    2.25, 2),
  Raid11: RaidDifficulty(11, 4.5,   2.75, 2,    1.5),
}

export type StatusId = keyof typeof StatusMap;
// export type ConditionId = keyof typeof ConditionMap
export type ConditionId = string // fixme