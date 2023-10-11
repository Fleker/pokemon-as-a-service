import { Type } from '../pokemon/types'
import { getCondition, removeCondition } from "./conditions"
import { Log, logHeal, Move, Pokemon } from "./types"

export interface TerrainEvent {
  name: string
  turnsActive: number
  terrainPulse: Type
  onCasterMove?:   (caster: Pokemon, target: Pokemon, move: Move) => Log
  onAfterCasterMove?:   (caster: Pokemon, target: Pokemon, move: Move) => Log
  onTurnEnd?:      (battlers: Pokemon[]) => Log
}

export type TerrainType = 'Grassy' | 'Misty' | 'Psychic' | 'Electric'

type TerrainsMapType = {[terrain in TerrainType]: TerrainEvent}

export const Terrains: TerrainsMapType = {
  Grassy: {
    name: 'Grassy', turnsActive: 0, terrainPulse: 'Grass',
    onCasterMove: (_, __, move) => {
      if (move.type === 'Grass') {
        move.power *= 1.3
      }
      if (['Earthquake', 'Magnitude', 'Bulldoze'].includes(move.name)) {
        move.power /= 2
      }
      return new Log()
    },
    onTurnEnd: (battlers) => {
      const log = new Log()
      log.add('The grassy terrain is healing everyone.')
      battlers.forEach(battler => {
        if (battler.type1 === 'Flying' || battler.type2 === 'Flying') {
          return
        }
        if (getCondition(battler, 'Float') || getCondition(battler, 'FloatUnintentional') || getCondition(battler, 'Levitating')) {
          return
        }
        log.push(logHeal(battler, battler.totalHp / 16))
      })
      return log
    }
  },
  Misty: {
    name: 'Misty', turnsActive: 0, terrainPulse: 'Fairy',
    onCasterMove: (_, __, move) => {
      if (move.type === 'Dragon') {
        move.power /= 2
      }
      return new Log()
    },
    onAfterCasterMove: (_, target) => {
      const log = new Log()
      if (target.status) {
        log.add(`${target.species} was cured by the misty terrain`)
        target.status = undefined
      }
      if (getCondition(target, 'Confusion')) {
        log.add(`${target.species} is no longer Confused due to the mist`)
        removeCondition(target, 'Confusion')
      }
      if (getCondition(target, 'PoisonBad')) {
        log.add(`${target.species} is no longer badly Poisoned due to the mist`)
        removeCondition(target, 'PoisonBad')
      }
      return log
    }
  },
  Psychic: {
    name: 'Psychic', turnsActive: 0, terrainPulse: 'Psychic',
    onCasterMove: (_, __, move) => {
      const log = new Log()
      if (move.type === 'Psychic') {
        move.power *= 1.3
      }
      if ((move.priority || 0) > 0) {
        move.failed = true
        log.add(`${move.name} was blocked by the mysterious surge of energy on the field`)
      }
      return log
    },
  },
  Electric: {
    name: 'Electric', turnsActive: 0, terrainPulse: 'Electric',
    onCasterMove: (_, __, move) => {
      if (move.type === 'Electric') {
        move.power *= 1.3
      }
      return new Log()
    },
    onAfterCasterMove: (_, target) => {
      const log = new Log()
      if (target.status?.name === 'Asleep') {
        log.add(`${target.species} is no longer asleep and was shocked awake`)
        target.status = undefined
      }
      if (getCondition(target, 'Drowsy')) {
        log.add(`${target.species} is no longer Drowsy and was shocked to attention`)
        removeCondition(target, 'Drowsy')
      }
      return log
    },
  },
}
