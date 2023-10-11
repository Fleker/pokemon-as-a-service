import { Type } from "../pokemon/types"
import { typeMatchup } from "./matchup"
import { Log, Pokemon } from "./types"

export class TypeMultiplier extends Log {
  mult: number
}
export const typeMultiplier = (target: Pokemon, type: Type): TypeMultiplier => {
  const log = new TypeMultiplier()
  log.mult = 1
  if (!target) return log
  let mult = typeMatchup[type][target.type1]
  if (target.type2) {
    mult *= typeMatchup[type][target.type2]
  }

  log.mult = mult
  if (mult > 1) {
    return log.add(`It's super effective!`)
  } else if (mult === 0) {
    return log.add(`It had no effect on ${target.species}...`)
  } else if (mult < 1) {
    return log.add(`It's not very effective...`)
  }
  return log
}
