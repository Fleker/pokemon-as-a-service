import test from 'ava'
import {User, getAllPokemon, arrayToMap, TPokemon} from '../badge-inflate'

test('Test inflation', t => {
  const pokemon = {
    '33#3MfUhy': 3,
    '7v#3O08hW': 1,
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
    '33#fUhy': 3,
    '7v#fUhW': 1,
    '6#4f_4': 0,
  }
  const currentBadges = ['potw-001', 'potw-025', 'potw-010-shiny', 'potw-025']
  const user = {pokemon, currentBadges} as User
  const allBadges = getAllPokemon(user)
  const allMap = arrayToMap(allBadges)
  const expected = {
    '33#fUhy': 3,
    '7v#fUhW': 1,
    '1#3MfUhG': 1,
    'p#3MfUhW': 2,
    'a#3OfUg2': 1,
  } as TPokemon
  t.deepEqual(allMap, expected)
})
