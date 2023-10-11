import { Pokemon, Log, logDamage, Move, Field } from "./types";
import { Type } from "../../../shared/src/pokemon/types";
import { WeatherType } from "../../../shared/src/locations-list";
import { Terrains } from "./terrain";
import { getCondition } from "./conditions";

const nop = () => { return new Log() }

export interface WeatherEvent {
  name: string
  turnsActive: number
  weatherBall: Type
  onActivation?:   (battlers: Pokemon[], field: Field) => Log
  onDeactivation?: (battlers: Pokemon[]) => Log
  onCasterMove?:   (caster: Pokemon, target: Pokemon, move: Move) => Log
  onTurnEnd?:      (battlers: Pokemon[]) => Log
}

const RAID_DMG = 64
const STD_DMG = 16

export const Weathers: Record<WeatherType | 'Snowscape', WeatherEvent> = {
  Cloudy: {
    name: 'Cloudy',
    turnsActive: 0,
    weatherBall: 'Normal',
  },
  Sunny: {
    name: 'Sunny',
    turnsActive: 0,
    weatherBall: 'Normal',
  },
  "Diamond Dust": {
    // Same as hail in battle
    name: 'Hail',
    turnsActive: 0,
    weatherBall: 'Ice',
    onActivation: () => {
      return new Log().add('It has started to hail.')
    },
    onTurnEnd: (battlers) => {
      const log = new Log()
      battlers.forEach(battler => {
        if (battler.heldItemKey === 'safetygoggles') return
        if (!getCondition(battler, 'OnField')) return
        // Take 1/16 damage each turn
        const fraction = battler['raidBoss'] ? RAID_DMG : STD_DMG
        if (battler.type1 !== 'Ice' && battler.type2 !== 'Ice' && !battler.fainted) {
          log.add(`${battler.species} was hit by the hail`)
          log.push(logDamage(battler, battler.totalHp / fraction, true))
        }
      })
      return log
    }
  },
  Snow: {
    // Same as hail in battle
    name: 'Hail',
    turnsActive: 0,
    weatherBall: 'Ice',
    onActivation: () => {
      return new Log().add('It has started to hail.')
    },
    onTurnEnd: (battlers) => {
      const log = new Log()
      battlers.forEach(battler => {
        if (battler.heldItemKey === 'safetygoggles') return
        if (!getCondition(battler, 'OnField')) return
        // Take 1/16 damage each turn
        const fraction = battler['raidBoss'] ? RAID_DMG : STD_DMG
        if (battler.type1 !== 'Ice' && battler.type2 !== 'Ice' && !battler.fainted) {
          log.add(`${battler.species} was hit by the hail`)
          log.push(logDamage(battler, battler.totalHp / fraction, true))
        }
      })
      return log
    }
  },
  "Heat Wave": {
    name: 'Heat Wave',
    turnsActive: 0,
    weatherBall: 'Fire',
    onActivation: () => {
      return new Log().add('It is bright and sunny.')
    },
    onCasterMove: (caster, __, move) => {
      if (caster.heldItemKey === 'utilityumbrella' && !caster.heldItemConsumed) {
        return nop()
      }
      if (move.type === 'Fire') {
        // Boost Fire power by 1.5x
        move.power *= 1.5
      } else if (move.type === 'Water') {
        // Weaken water power
        move.power /= 1.5
      }
      return nop()
    },
  },
  Rain: {
    name: 'Rain',
    turnsActive: 0,
    weatherBall: 'Water',
    onActivation: () => {
      return new Log()
        .add('It has started to rain.')
    },
    onCasterMove: (caster, __, move) => {
      if (caster.heldItemKey === 'utilityumbrella' && !caster.heldItemConsumed) {
        return nop()
      }
      if (move.type === 'Water') {
        move.power *= 1.5
      } else if (move.type === 'Fire') {
        move.power /= 1.5
      }
      return nop()
    },
  },
  Thunderstorm: {
    name: 'Rain',
    turnsActive: 0,
    weatherBall: 'Water',
    onActivation: (_, field) => {
      field.terrain = {...Terrains.Electric}
      return new Log()
        .add('It has started to rain.')
        .add('A surge of electrictiy covered the field.')
    },
    onCasterMove: (caster, __, move) => {
      if (caster.heldItemKey === 'utilityumbrella' && !caster.heldItemConsumed) {
        return nop()
      }
      if (move.type === 'Water') {
        move.power *= 1.5
      } else if (move.type === 'Fire') {
        move.power /= 1.5
      }
      return nop()
    },
  },
  Sandstorm: {
    name: 'Sandstorm',
    turnsActive: 0,
    weatherBall: 'Rock',
    onActivation: () => {
      return new Log().add('Sand blows past.')
    },
    onCasterMove: (_, target, move) => {
      if (target.type1 === 'Rock' || target.type2 === 'Rock') {
        // Boost SpDef by lowering the power of a move
        if (move.defenseKey === 'spDefense') {
          move.power /= 1.5
        }
      }
      return new Log()
    },
    onTurnEnd: (battlers) => {
      const log = new Log()
      battlers.forEach(battler => {
        if (battler.heldItemKey === 'safetygoggles') return
        if (!getCondition(battler, 'OnField')) return
        // Take 1/16 damage each turn
        const fraction = battler['raidBoss'] ? RAID_DMG : STD_DMG
        const isBattlerGround = battler.type1 === 'Ground' || battler.type2 === 'Ground'
        const isBattlerRock = battler.type1 === 'Rock' || battler.type2 === 'Rock'
        const isBattlerSteel = battler.type1 === 'Steel' || battler.type2 === 'Steel'
        if (!isBattlerGround && !isBattlerRock && !isBattlerSteel && !battler.fainted) {
          log.add(`${battler.species} was hit by the sandstorm`)
          log.push(logDamage(battler, battler.totalHp / fraction, true))
        }
      })
      return log
    }
  },
  Fog: {
    name: 'Fog',
    turnsActive: 0,
    weatherBall: 'Normal',
    onActivation: (_, field) => {
      field.terrain = {...Terrains.Misty}
      return new Log()
        .add('A misty fog is tickling at the edges of the field.')
    },
  },
  // https://bulbapedia.bulbagarden.net/wiki/Strong_winds
  Windy: {
    name: 'Windy',
    turnsActive: 0,
    weatherBall: 'Normal',
    onActivation: () => {
      return new Log().add('A strong wind blows across the field.')
    },
    onCasterMove: (caster, target, move) => {
      if (['Electric', 'Ice', 'Rock'].includes(move.type)) {
        if ([target.type1, target.type2].includes('Flying')) {
          move.power /= 2
          return new Log().add('A strong headwind weakens the attack.')
        }
      }
      return new Log()
    }
  },
  // Gen 9 Snow mechanics
  Snowscape: {
    name: 'Snowscape',
    turnsActive: 0,
    weatherBall: 'Ice',
    onActivation: () => {
      return new Log().add('Snow lightly drifts from the sky.')
    },
    onCasterMove: (_, target, move) => {
      if (target.type1 === 'Ice' || target.type2 === 'Ice') {
        // Boost Def by lowering the power of a move
        if (move.defenseKey === 'defense') {
          move.power /= 1.5
        }
      }
      return new Log()
    },
  },
}
