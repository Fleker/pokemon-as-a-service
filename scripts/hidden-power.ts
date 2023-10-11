import {datastore} from '../shared/src/pokemon'
import {BadgeId, Type, types} from '../shared/src/pokemon/types'

const map: Partial<Record<Type, string[]>> = {}
for (const [key, value] of Object.entries(datastore)) {
  if (value.novelMoves) {
    value.novelMoves.forEach(arr => {
      for (const t of types) {
        if (arr.includes(`Hidden Power_${t}`)) {
          if (map[t]) { map[t]!.push(key) }
          else { map[t] = [key] }
        }
      }
    })
  }
}

for (const type of types) {
  const value = map[type]
  console.log(`~ Hidden Power: ${type} (${value?.length}) ~`)
  value?.forEach(v => console.log(`    ${v}`))
}

for (const type of types) {
  console.log(`${type}: ${map[type]?.length}`)
}
