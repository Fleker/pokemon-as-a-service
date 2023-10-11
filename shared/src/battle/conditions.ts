import {Pokemon} from './types'

export const getCondition = (target: Pokemon, status: string) => {
  if (!target.conditions) {
    return undefined
  }
  const index = target.conditions
      .findIndex(condition => condition.name === status)
  if (index !== -1) {
    return target.conditions[index]
  }
  return undefined
}

export const removeCondition = (target: Pokemon, status: string) => {
  if (!target.conditions) {
    return
  }
  const index = target.conditions
      .findIndex(condition => condition.name === status)
  if (index !== -1) {
    target.conditions.splice(index, 1)
  }
  return
}
