/**
 * @fileoverview Description of this file.
 */

// ---
import * as pokemon from '../shared/src/pokemon'
import { PokemonDoc } from '../shared/src/pokemon/types'

const unusedSet = new Set<PokemonDoc>()
Object.values(pokemon.datastore).forEach(pokemon => {
    if (!pokemon.novelMoves || !pokemon.novelMoves.length) {
        unusedSet.add(pokemon)
    }
})

unusedSet.forEach((pkmn: PokemonDoc) => {
    console.log(`${pkmn.species} var1 (${pkmn.type1} / ${pkmn.type2})`)
})
console.log(`No variants: ${unusedSet.size} / ${Object.keys(pokemon.datastore).length}`)
console.log('\n')

/// VAR0
const var0set = new Set<PokemonDoc>()
Object.values(pokemon.datastore).forEach(pokemon => {
    if (pokemon.novelMoves && pokemon.novelMoves.length === 1) {
        var0set.add(pokemon)
    }
    if (pokemon.novelMoves && !pokemon.novelMoves[0]) {
        console.error(`Pokemon ${pokemon.species} has weird state`)
    }
    if (pokemon.novelMoves && pokemon.novelMoves[0]?.length) {
        var0set.add(pokemon)
    }
})

var0set.forEach((pkmn: PokemonDoc) => {
    console.log(`${pkmn.species} var0 (${pkmn.type1} / ${pkmn.type2})`)
})
console.log(`Exploit variant: ${var0set.size} / ${Object.keys(pokemon.datastore).length}`)
console.log()

/// VAR1
const var1set = new Set<PokemonDoc>()
Object.values(pokemon.datastore).forEach(pokemon => {
    if (pokemon.novelMoves && pokemon.novelMoves.length === 2) {
        var1set.add(pokemon)
    }
})

var1set.forEach((pkmn: PokemonDoc) => {
    console.log(`${pkmn.species} var2 (${pkmn.type1} / ${pkmn.type2})`)
})
console.log(`One variant: ${var1set.size} / ${Object.keys(pokemon.datastore).length}`)
console.log('')

/// VAR2
const var2set = new Set<PokemonDoc>()
Object.values(pokemon.datastore).forEach(pokemon => {
    if (pokemon.novelMoves && pokemon.novelMoves.length === 3) {
        var2set.add(pokemon)
    }
})

var2set.forEach((pkmn: PokemonDoc) => {
    console.log(`${pkmn.species} var3 (${pkmn.type1} / ${pkmn.type2})`)
})
console.log(`Two variant: ${var2set.size} / ${Object.keys(pokemon.datastore).length}`)
console.log('')

/// VAR3
const var3set = new Set<PokemonDoc>()
Object.values(pokemon.datastore).forEach(pokemon => {
    if (pokemon.novelMoves && pokemon.novelMoves.length === 4) {
        var3set.add(pokemon)
    }
})

var3set.forEach((pkmn: PokemonDoc) => {
    console.log(`${pkmn.species} var4 (${pkmn.type1} / ${pkmn.type2})`)
})
console.log(`Three variants: ${var3set.size} / ${Object.keys(pokemon.datastore).length}`)
console.log('')

/// VAR4
const var4set = new Set<PokemonDoc>()
Object.values(pokemon.datastore).forEach(pokemon => {
    if (pokemon.novelMoves && pokemon.novelMoves.length === 5) {
        var4set.add(pokemon)
    }
})

var4set.forEach((pkmn: PokemonDoc) => {
    console.log(`${pkmn.species} var5 (${pkmn.type1} / ${pkmn.type2})`)
})
console.log(`Four variants: ${var4set.size} / ${Object.keys(pokemon.datastore).length}`)
console.log('')

console.log(`Total variants #: ${var1set.size + var2set.size * 2 + var3set.size * 3 + var4set.size * 4}`)
