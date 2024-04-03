import test from 'ava'
import { Badge, MATCH_GTS, Pokemon } from '../../../shared/src/badge3'
import { PokemonId } from '../../../shared/src/pokemon/types'
import { Users } from '../db-types'
import { addPokemon, calculateNetWorth, hasPokemon, hasPokemonFuzzy, removePokemon } from '../users.utils'
import * as P from '../../../shared/src/gen/type-pokemon-ids'

const user: Users.Doc = {
  eggs: [],
  hiddenItemsFound: [],
  items: {},
  lastPokeball: 0,
  ldap: 'placeholder',
  battleStadiumRecord: [0, 0, 0, 0],
  location: 'US-MTV',
  raidRecord: [0, 0, 0, 0],
  settings: {
    disableRealtime: false,
    disableSyncTeams: false,
    pokeindex: false,
    union: false,
    theme: 'default',
    flagSearch2: false,
    flagTag: false,
    flagAchievementService: false,
    flagLocation2: false,
    notification: {
      BATTLE_LEADERBOARD: {inapp: true, push: true},
      GTS_COMPLETE: {inapp: true, push: true},
      ITEM_DISPENSE: {inapp: true, push: true},
      RAID_CLAIM: {inapp: true, push: true},
      RAID_COMPLETE: {inapp: true, push: true},
      RAID_EXPIRE: {inapp: true, push: true},
      RAID_RESET: {inapp: true, push: true},
      VOYAGE_COMPLETE: {inapp: true, push: true},
      PLAYER_EVENT: {inapp: true, push: true},
      GAME_EVENT: {inapp: true, push: true},
    }
  },
  strikes: 0,
  moveTutors: 0,
  eggsLaid: 0,
  pokemon: {},
}

test('User wealth general', t => {
  user.items = {
    greatball: 2,
    ultraball: 2,
  }
  t.is(calculateNetWorth(user as Users.Doc), 18)
})

test('User wealth Poké Balls', t => {
  user.items = {
    pokeball: 10,
    raidpass: 2,
  }
  t.is(calculateNetWorth(user as Users.Doc), 12)
})

test('User wealth negative', t => {
  user.items = {
    greatball: -2,
    pokeball: 10
  }
  t.is(calculateNetWorth(user as Users.Doc), 4)
})

test('User wealth NaN', t => {
  user.items = {
    greatball: NaN,
    pokeball: 10
  }
  t.is(calculateNetWorth(user as Users.Doc), 10)
})

test('hasPokemon', t => {
  user.pokemon = {
    '1': {
      '3MfUhG': 1
    },
    '2': {
      '3MfUhG': 1
    },
    '3': {
      '3MfUhG': 1
    },
    '4': {
      '3MfUgy': 1
    },
    '7': {
      '3Yf_4': 1
    }
  }
  t.true(hasPokemon(user as Users.Doc, '1#3MfUhG' as PokemonId), 'Should have a Bulbasaur')
  t.true(hasPokemon(user as Users.Doc, ['1#3MfUhG', '2#3MfUhG'] as unknown as PokemonId[]), 'Should have both Pkmn')
  t.true(hasPokemon(user as Users.Doc, '3#3MfUhG' as PokemonId), 'Should have Venusaur in new format')
  t.true(hasPokemon(user as Users.Doc, ['3#3MfUhG', '4#3MfUgy'] as unknown as PokemonId[]), 'Should have both new format')
   
  // t.false(hasPokemon(user as Users.Doc, 'potw-010' as PokemonId), 'Should not have Caterpie')
  // t.false(hasPokemon(user as Users.Doc, ['potw-001', 'potw-001'] as unknown as PokemonId[]), 'Should not have 2 Bulbas')
  t.false(hasPokemon(user as Users.Doc, ['4#3MfUgy', '4#3MfUgy'] as unknown as PokemonId[]), 'Only has one Charm')
  t.false(hasPokemon(user as Users.Doc, ['5#3MfUgy'] as unknown as PokemonId[]), 'Does not have any Charmeleons')
})

test('hasPokemonFuzzy', t => {
  user.pokemon = {
    '1': {
      '3MfUhG': 1
    },
    '2': {
      '3MfUhG': 1
    },
    '3': {
      '3MfUhG': 2
    },
    '4': {
      '3MfUgy': 2,
      '3MfUhG': 2,
    },
    '7': {
      '3fM22': 1
    },
    'a': {
      '3MfUg2': 1,
    },
    '2q': {
      '3MfUhG': 5,
      '3MfUh2': 1,
    }
  }
  const squirtMatch = Badge.match('7#Yf_4', ['7#3Yf_4'] as unknown as PokemonId[], MATCH_GTS)
  t.true(squirtMatch.match, 'SquirtMatch failed')
  t.is('7#3fM22', squirtMatch.result, 'SquirtMatch matched wrong')
  t.true(hasPokemonFuzzy(user as Users.Doc, '1#3MfUhG' as PokemonId), 'Should have a Bulbasaur')
  t.false(hasPokemonFuzzy(user as Users.Doc, '1#3OfPpG' as PokemonId), 'Should not have shiny Bulbasaur')
  t.false(hasPokemonFuzzy(user as Users.Doc, ['1#3MfUhG','1#3MfUhG'] as unknown as PokemonId[]), 'Should not have two Bulbasaur')
  t.true(hasPokemonFuzzy(user as Users.Doc, '7#3fM22' as PokemonId), 'Should match Squirtle')
  t.true(hasPokemonFuzzy(user as Users.Doc, ['4#3MfUgy', '4#3MfUgy'] as unknown as PokemonId[]), 'Should have two valid Charm')
  t.log(Badge.fromLegacy('potw-010'))
  t.log(Badge.fromLegacy('potw-154'))
  t.true(hasPokemonFuzzy(user as Users.Doc, 'a#3MfUg2' as PokemonId), 'Should have a valid Caterpie')
  t.true(hasPokemonFuzzy(user as Users.Doc, [...Array(6)].fill('2q#3MfUhG') as unknown as PokemonId[]), 'Should have 6 Meganium')
  t.false(hasPokemonFuzzy(user as Users.Doc, [...Array(7)].fill('2q#3MfUhG') as unknown as PokemonId[]), 'Should not have 7 Meganium')

  t.false(hasPokemonFuzzy(user as Users.Doc, ['5#Yf_4'] as unknown as PokemonId[]), 'Does not have any Charmeleons')
})

// With FieldValues, the behavior here is not quite highly testable.
test.skip('Add/Remove Pokemon', t => {
  user.pokemon = {
    '1': {
      '3MfUhG': 1
    },
    '2': {
      '3MfUhG': 1
    },
  }

  const ivysaur = new Badge(Pokemon(P.Ivysaur))
  addPokemon(user, ivysaur, 2)
  t.deepEqual(user.pokemon, {
    '2': {
      '3MfUhG': 3
    },
  })

  removePokemon(user, ivysaur, 2)
  t.deepEqual(user.pokemon, {
    '2': {
      '3MfUhG': 1
    },
  })

  const venusaur = new Badge(Pokemon(P.Venusaur))
  t.throws(() => {
    removePokemon(user, venusaur)
  })

  addPokemon(user, venusaur)
  t.deepEqual(user.pokemon, {
    '2': {
      '3MfUhG': 1
    },
    '3': {
      '3MfUhG': 1
    },
  })

  // Verify getting to zero removes map entry
  removePokemon(user, venusaur)
  t.deepEqual(user.pokemon, {
    '2': {
      '3MfUhG': 1
    },
  }, 'Venusaur entry should be removed.')
})
