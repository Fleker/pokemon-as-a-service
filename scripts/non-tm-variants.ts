import {ITEMS} from '../shared/src/items-list'
import {datastore} from '../shared/src/pokemon'
import { PokemonDoc } from '../shared/src/pokemon/types';
import { MoveId } from '../shared/src/type-move-meta';

// node non-tm-variants.js true
// node non-tm-variants.js false
const tmEnabled = process.argv[2] === 'true'

const moves = new Map();
for (let i in ITEMS) {
  const item = ITEMS[i];
  if (item.category == "tms" /*|| item.category == "trs"*/) {
    moves.set(i.substring(3), i);
  }
}

function print(pokemon: PokemonDoc, key: string, i: number, move?: MoveId) {
  if (!move) {
    move = datastore[key].novelMoves[i].join(',')
  }
  console.log(`${pokemon.species} - ${pokemon.type1}/${pokemon.type2} - ${key}-var${i}   ${move}`)
}

let counter = 0
let total = 0
for (const [key, pokemon] of Object.entries(datastore)) {
  if (pokemon.novelMoves) {
    for (let i = 1; i < pokemon.novelMoves.length; i++) {
      total++
      let canChange = false
      if (i === 3) continue // tutor3
      for (let j = 0; j < pokemon.novelMoves[i].length; j++) {
        const move = pokemon.novelMoves[i][j];
        if (moves.has(move)) {
          if (tmEnabled) {
            print(pokemon, key, i, move)
            counter++
          }
          canChange = true
        }
      }
      if (!canChange && !tmEnabled) {
        print(pokemon, key, i)
        counter++
      }
    }
  }
}

console.log(`Is ${counter}/${total}`)
