import { Ability, Log } from "./types"
import {assert} from '@fleker/gents'

export const AbilityDex = {
  SuperLuck: assert<Ability>({
    name: 'Super Luck',
    turn: 0,
    onCasterMove: ({move}) => {
      move.criticalHit *= 2
      return new Log()
    },
  })
}

export type AbilityId = keyof typeof AbilityDex
