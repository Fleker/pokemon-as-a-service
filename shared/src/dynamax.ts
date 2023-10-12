import { Type } from "./pokemon/types"
import { MoveId, MoveTypeMap } from "./gen/type-move-meta"

/**
 * Simple implementation of getting Dynamax power
 * This is designed to be one universal expression, which may mean it does
 * not perfectly align with main-series games.
 * See https://bulbapedia.bulbagarden.net/wiki/Max_Move
 * @param power Original move power
 * @param accuracy Original move accuracy
 */
export const maxMovePower = (power: number, accuracy: number) => {
  if (power === 0) return 0
  let dynamaxPower = power + 0.5
  // Ensure always-hit moves like Feint Attack don't break
  dynamaxPower -= (1 - Math.min(accuracy, 1))
  return dynamaxPower
}

/**
 * Simple mapping of damaging moves to their corresponding Max Move.
 * See https://bulbapedia.bulbagarden.net/wiki/Max_Move
 */
export const maxMoveMapping: Record<Type, MoveId> = {
  'Normal': 'Max Strike',
  'Fighting': 'Max Knuckle',
  'Flying': 'Max Airstream',
  'Poison': 'Max Ooze',
  'Ground': 'Max Quake',
  'Rock': 'Max Rockfall',
  'Bug': 'Max Flutterby',
  'Ghost': 'Max Phantasm',
  'Steel': 'Max Steelspike',
  'Fire': 'Max Flare',
  'Water': 'Max Geyser',
  'Grass': 'Max Overgrowth',
  'Electric': 'Max Lightning',
  'Psychic': 'Max Mindstorm',
  'Ice': 'Max Hailstorm',
  'Dragon': 'Max Wyrmwind',
  'Dark': 'Max Darkness',
  'Fairy': 'Max Starfall',
  'Status': 'Splash', // Lol
}

export function getMaxMoveset(moves: MoveId[], gmax?: MoveId) {
  const gmaxType: Type | undefined = (() => {
    if (gmax) return MoveTypeMap[gmax].type
    return undefined
  })()
  return moves.map(m => {
    const mp = MoveTypeMap[m]
    if (mp.power === 0) return 'Max Guard' as MoveId
    if (gmax && gmaxType === mp.type) return gmax as MoveId
    return maxMoveMapping[mp.type] as MoveId
  }) as MoveId[]
}
