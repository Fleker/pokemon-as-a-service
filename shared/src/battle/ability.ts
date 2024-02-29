import { Ability, Log } from "./types"
import {assert} from '@fleker/gents'

export const AbilityDex = {
  PlaceholderPower: assert<Ability>({
    name: 'Placeholder Power', turn: 0,
    flavor: 'This Pokémon does not have an ability set.'
  }),
   SuperLuck: assert<Ability>({
    name: 'Super Luck', turn: 0,
    flavor: 'Boosts critical hit ratio or something',
    onCasterMove: ({move}) => {
      move.criticalHit *= 2
      return new Log()
    },
  })
}

export type AbilityId = keyof typeof AbilityDex
