/**
 * @fileoverview Scripts to aid in defining and building voyages
 * Usage:
 *    node voyager.js encounters <primary-type> <secondary-type> <secondary-type> <weather-type>? <weather-type>?
 *    node voyager.js bosses <primary-type> <secondary-type> <secondary-type>
 *    node voyager.js buckets <primary-type> <secondary-type> <secondary-type> <score-stat>
 *    node voyager.js buckets-all # Computes buckets for every voyage in file
 *    node voyager.js novelty-check # Counts number of Pokemon appearances to minimize duplicates
 *    node voyager.js count-types # Counts types used in voyages for balance
 *    node voyager.js unused-pokemon # Lists base Pokemon who are not in any voyage
 *    node voyager.js unused-bosses # Lists cool Pokemon who are not in any voyage boss list
 */

import * as voyages from '../shared/src/voyages'
import * as pokemon from '../shared/src/pokemon'
import {types} from '../shared/src/pokemon/types'

const {Voyages} = voyages

function getBuckets(primary, stat) {
  const primaryList = Object.values(pokemon.datastore)
    .filter(pkmn => pkmn.type1 === primary || pkmn.type2 === primary)
    .filter(pkmn => pkmn.shiny !== "FALSE")
    .filter(pkmn => pkmn.rarity === undefined)
  primaryList.sort((a, b) => b[stat] - a[stat]) // Sort by stat
  let sum = 0
  // Use 4 players?
  for (let i = 0; i < 4; i++) {
    sum += primaryList[i][stat] + 15 // Assume shiny-var with leeway 
    console.log(primaryList[i].species, primaryList[i][stat])
  }
  console.log('=', sum)
  console.log(`[0, ${Math.floor(sum*0.33)}, ${Math.floor(sum*0.67)}, ${sum}]`)
}

const cmd = process.argv[2]
if (cmd === 'encounters') {
  console.log('Voyage Encounters')
  const primary = process.argv[3]
  const secondary1 = process.argv[4]
  const secondary2 = process.argv[5]
  const weather1 = process.argv[6]
  const weather2 = process.argv[7]
  const printForType = (type, opt1, opt2) => {
    Object.entries(pokemon.datastore).forEach(([key, pokemon]) => {
      if (pokemon.eggBase !== key) return // Not baby or legendary?
      if (pokemon.type1 === type || pokemon.type2 === type) {
        if (!opt1) {
          console.log(`${pokemon.species} - ${pokemon.type1}/${pokemon.type2 || ''}`)
        }
        if (opt1 && (pokemon.type1 === opt1 || pokemon.type2 === opt1)) {
          console.log(`${pokemon.species} - ${pokemon.type1}/${pokemon.type2 || ''}`)
        }
        if (opt2 && (pokemon.type1 === opt2 || pokemon.type2 === opt2)) {
          console.log(`${pokemon.species} - ${pokemon.type1}/${pokemon.type2 || ''}`)
        }
      }
    })
    console.log('-----')
  }

  printForType(primary, weather1, weather2)
  printForType(secondary1, weather1, weather2)
  printForType(secondary2, weather1, weather2)
} else if (cmd === 'bosses') {
  console.log('Voyage Bosses')
  const primary = process.argv[3]
  const secondary1 = process.argv[4]
  const secondary2 = process.argv[5]
  const printForType = (type) => {
    Object.entries(pokemon.datastore).forEach(([key, pokemon]) => {
      if (pokemon.type1 === type || pokemon.type2 === type) {
        console.log(`${pokemon.species} - ${pokemon.type1}/${pokemon.type2 || ''}`)
      }
    })
    console.log('-----')
  }

  printForType(primary)
  printForType(secondary1)
  printForType(secondary2)
} else if (cmd === 'buckets') {
  console.log('Buckets')
  const primary = process.argv[3]
  const stat = process.argv[6]
  getBuckets(primary, stat)
} else if (cmd === 'buckets-all') {
  console.log('Buckets-All')
  for (const voyage of Object.values(Voyages)) {
    console.log(voyage.label)
    getBuckets(voyage.typePrimary, voyage.scoreStat)
  }
} else if (cmd === 'novelty-check') {
  const pkmn = {}
  for (const voyage of Object.values(Voyages)) {
    console.log(voyage.label, '...')
    for (const p of voyage.pokemon[0]) {
      if (pkmn[p]) {
        pkmn[p]++
      } else {
        pkmn[p] = 1
      }
    }
    for (const p of Object.values(voyage.weatherPokemon)) {
      for (const pp of p) {
        if (pkmn[pp]) {
          pkmn[pp]++
        } else {
          pkmn[pp] = 1
        }
      }
    }
  }
  for (const [k, v] of Object.entries(pkmn)) {
    const label = pokemon.get(k)?.species
    console.log(label, v)
  }
} else if (cmd === 'unused-pokemon') {
  // Copy novelty-check to get a list of those who are in now.
  const pkmn = {}
  for (const voyage of Object.values(Voyages)) {
    for (const pkmns of voyage.pokemon) {
      for (const p of pkmns) {
        if (pkmn[p]) {
          pkmn[p]++
        } else {
          pkmn[p] = 1
        }
      }
    }
    for (const p of Object.values(voyage.weatherPokemon)) {
      for (const pp of p) {
        if (pkmn[pp]) {
          pkmn[pp]++
        } else {
          pkmn[pp] = 1
        }
      }
    }
  }
  const pkmnKeys = Object.keys(pkmn)
  // Now look for all base-form Pokemon
  // These will be considered as any Pokemon whose eggBase is itself
  // This means special Pokemon including babies and legendaries won't be caught.
  // That is intentional.
  for (const [key, value] of Object.entries(pokemon.datastore)) {
    if (key !== value.eggBase) continue
    if (!pkmnKeys.includes(key)) {
      console.log(`${key} ${value.species} - ${value.type1}/${value.type2}`)
    }
  }
} else if (cmd === 'unused-bosses') {
  const pkmn = {}
  for (const voyage of Object.values(Voyages)) {
    for (const bosses of voyage.bosses) {
      for (const p of bosses) {
        if (pkmn[p]) {
          pkmn[p]++
        } else {
          pkmn[p] = 1
        }
      }
    }
  }
  const pkmnKeys = Object.keys(pkmn)
  for (const [key, value] of Object.entries(pokemon.datastore)) {
    if (value.rarity !== 'LEGENDARY') continue
    if (!pkmnKeys.includes(key)) {
      console.log(`${key} ${value.species} - ${value.type1}/${value.type2}`)
    }
  }
} else if (cmd === 'count-types') {
  const mapPrimary: Record<string, number> = {}
  const mapSecondary: Record<string, number> = {}
  for (const t of types) {
    mapPrimary[t] = 0
    mapSecondary[t] = 0
  }
  for (const voyage of Object.values(Voyages)) {
    const {typePrimary, typeSecondary} = voyage
    mapPrimary[typePrimary]++
    typeSecondary.forEach(type => {
      mapSecondary[type]++
    })
  }
  console.log('Primary', mapPrimary)
  console.log('Secondary', mapSecondary)
} else {
  console.log('Unknown command')
}