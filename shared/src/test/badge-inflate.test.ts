import test from 'ava'
import {User, getAllPokemon, arrayToMap, TPokemon} from '../badge-inflate'

test('Test inflation', t => {
  const pokemon = {
    '33#Yf_4': 3,
    '7v#Yw24': 1,
    '6#4f_4': 0,
  }
  const currentBadges = ['potw-001', 'potw-025', 'potw-010-shiny']
  const user = {pokemon, currentBadges} as User
  t.deepEqual(getAllPokemon(user), [
    'potw-001', 'potw-025', 'potw-010-shiny',
    'potw-195', 'potw-195', 'potw-195',
    'potw-479-fan-shiny'
  ])
})

// Some players have >100K Pokemon
test('Stress test inflation', t => {
  const pokemon = {
    '33#Yf_4': 5_000,
    '7v#Yw24': 5_000,
    '6#4f_4':  3_000,
  }
  // Add more keys to the map
  for (let i = 1; i <= 99; i++) {
    pokemon[`${i}#Yf_4`] = 1_000
    pokemon[`${i}#Yw24`] = 1_000
    pokemon[`${i}#4f_4`] = 1_000
  }
  // Should result with a sum over 230_000
  const currentBadges = ['potw-001', 'potw-025', 'potw-010-shiny']
  const user = {pokemon, currentBadges} as User
  getAllPokemon(user)
  t.pass() // Did not blow up the memory stack
})

test('Test deflation', t => {
  const pokemon = {
    '33#Yf_4': 3,
    '7v#Yw24': 1,
    '6#4f_4': 0,
  }
  const currentBadges = ['potw-001', 'potw-025', 'potw-010-shiny', 'potw-025']
  const user = {pokemon, currentBadges} as User
  const allBadges = getAllPokemon(user)
  const allMap = arrayToMap(allBadges)
  const expected = {
    '33#Yf_4': 3,
    '7v#Yw24': 1,
    '1#Yf_4': 1,
    'p#Yf_4': 2,
    'a#YL_4': 1,
  } as TPokemon
  t.deepEqual(allMap, expected)
})
