/** @fileoverview This script uses a scoring system to identify, based on an
 * input of bosses, which are the top ones to use.
 *
 * ex. `yarn script boss-month Raichu Gyarados Pangoro`
 *
 * Would output something like:
 * ```
 *   Raichu (100)
 *   Pangoro (85)
 *   Gyarados (10)
 * ```
 */
import { BadgeId } from '../shared/src/pokemon/types'
import {TeamsBadge} from '../shared/src/badge2'
import {datastore, get} from '../shared/src/pokemon'
import {bosses} from './bosses'

// Change once we get to var5
const CURRENT_VAR_MAX = 4

const inputs = process.argv.slice(2)
console.log(`Found ${inputs.length} Pokémon to score`)

const badgeIds = inputs.map(name => {
  for (const [key, val] of Object.entries(datastore)) {
    if (val.species === name) return key
  }
  console.warn(`Cannot find Pkmn by name "${name}"`)
}).filter(x => x !== undefined) as BadgeId[] // Remove undefineds

const scoreMap = new Map()
// Sort by value
scoreMap[Symbol.iterator] = function* () {
  yield* [...this.entries()].sort((a, b) => b[1] - a[1]);
}
const suggestions: string[] = []
badgeIds.map(badgeId => {
  let score = 0

  const mdiff = getMonthsAgo(badgeId)
  if (mdiff === -1) {
    // Neverboss
    score += 75
    suggestions.push(`${label(badgeId)} has never been a boss`)
  } else if (mdiff > 1) {
    score += Math.max(mdiff, 6) * 10
  }

  const freq = getBossFreq(badgeId)
  if (freq === undefined) {
    score += 75 // Neverboss
    suggestions.push(`${label(badgeId)} has never been a boss`)
  } else if (freq < CURRENT_VAR_MAX) {
    score += 65 // Neverboss
    suggestions.push(`${label(badgeId)} has not been every boss`)
  } else if (freq < CURRENT_VAR_MAX + 1) {
    score += 30
  } else if (freq < CURRENT_VAR_MAX * 2) {
    score += 25
  }

  scoreMap.set(badgeId, score)
})

function getMonthsAgo(badgeId: BadgeId) {
  const max = bosses.length
  for (let i = bosses.length - 1; i >= 0; i--) {
    for (const b of bosses[i]) {
      if (b.startsWith(badgeId)) {
        // console.log('gma', badgeId, max - i)
        return max - i
      }
    }
  }
  return -1
}

function getBossFreq(badgeId: BadgeId) {
  // See bosses.ts -> frequency
  const map: Record<string, number> = {}
  for (const month of bosses) {
    for (const boss of month) {
      const match = new TeamsBadge(boss)
      const s = match.toSimple()
      if (map[s]) {
        map[s]++
      } else {
        map[s] = 1
      }
    }
  }

  if (map[badgeId]) {
    return map[badgeId]
  }

  return undefined
}

function label(badgeId: BadgeId) {
  return get(badgeId)!.species
}

for (const [k, v] of [...scoreMap]) {
  console.log(k, label(k), v)
}
for (const s of suggestions) {
  console.log(s)
}
