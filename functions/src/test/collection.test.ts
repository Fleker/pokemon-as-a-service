import test from 'ava'
import { Users } from '../db-types'
import {addIf, deduplicate, ENCOUNTERS} from '../encounter'
import { Globe, Location, timeOfDay } from '../../../shared/src/locations-list'
import { CATCH_CHARM_GSC, CATCH_CHARM_RSE } from '../../../shared/src/quests'
import { BadgeId, PokemonForm, PokemonGender, PokemonId } from '../../../shared/src/pokemon/types'
import * as P from '../../../shared/src/gen/type-pokemon'
import { Pokemon } from '../../../shared/src/badge3'
import { genReleaseItems, v2Release } from '../collection.utils'
import * as I from '../../../shared/src/gen/type-pokemon-ids'
import { CATCH_CHARM_DPPT } from '../../../shared/src/legendary-quests'
import { inflate } from '../../../shared/src/badge-inflate'
import { Badge } from '../../../shared/src/badge3'
import * as Pkmn from '../../../shared/src/pokemon'
import { TeamsBadge } from '../../../shared/src/badge2'

const defaultValues: Users.Doc = {
  location: 'US-MTV',
  settings: {
    pokeindex: false,
    union: false,
    disableRealtime: false,
    disableSyncTeams: false,
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
  battleStadiumRecord: [0, 0, 0, 0],
  raidRecord: [0, 0, 0, 0],
  eggs: [],
  hiddenItemsFound: [],
  items: {},
  lastPokeball: 0,
  ldap: 'nobody',
  moveTutors: 0,
  eggsLaid: 0,
  pokemon: {},
}

test('Gatekeeping Sinnoh', t => {
  const common = ENCOUNTERS['pokeball']!
  const userDoc = {
    ...defaultValues,
    eggs: [],
    hiddenItemsFound: [],
    items: {},
    lastPokeball: 0,
    ldap: 'nobody',
    battleBoxRecord: [],
  } as unknown as Users.Doc
  const now = new Date()
  const location = Globe['US-CMH'] // Columbus is Forest
  const {list} = common(userDoc, now, location, 'List', {})
  t.false(list.includes('potw-399' as BadgeId)) // Bidoof
})


test('Burmy-Sandy', t => {
  const common = ENCOUNTERS['pokeball']!
  const userDoc = {
    ...defaultValues,
    eggs: [],
    hiddenItemsFound: [CATCH_CHARM_RSE],
    items: {},
    lastPokeball: 0,
    ldap: 'nobody',
    battleBoxRecord: [],
  } as unknown as Users.Doc
  const now = new Date()
  const location = Globe['US-BLD'] // Boulder is Mountainous
  const {list} = common(userDoc, now, location, 'List', {})
  t.true(list.includes('potw-412-sandy' as BadgeId))
})

test('Duplicate behavior - Common', t => {
  const common = ENCOUNTERS['pokeball']!
  const userDoc = {
    ...defaultValues,
    pokemon: {
      [Pokemon(I.Caterpie)]: 1,
      [Pokemon(I.Weedle)]: 1,
      [Pokemon(I.Meowth)]: 1,
      [Pokemon(I.Snorunt)]: 1,
      [Pokemon(I.Snorunt, {gender: 'male'})]: 1,
      [Pokemon(I.Rattata, {shiny: true})]: 1,
      [Pokemon(I.Burmy, {form: 'trash'})]: 1,
      [Pokemon(I.Ekans, {variant: 2})]: 1,
      [Pokemon(I.Ralts, {gender: 'female'})]: 1,
      [Pokemon(I.Ralts, {gender: 'male'})]: 1,
    },
    eggs: [],
    hiddenItemsFound: [CATCH_CHARM_GSC],
    items: {},
    lastPokeball: 0,
    ldap: 'nobody',
    battleBoxRecord: [],
  } as unknown as Users.Doc
  const now = new Date()
  const location: Location = {...Globe['US-BLD'], forecast: 'Snow'} // Boulder is Mountainous
  const encounter = common(userDoc, now, location, 'List', {})
  t.true(encounter.list.includes('potw-010'))

  const availableList = deduplicate(encounter, userDoc.pokemon, false)
  t.false(availableList.includes('potw-010'), 'Simple Pokemon should be considered duplicate')
  t.false(availableList.includes('potw-052'), 'Can only catch one Meowth (base form)')
  t.true(availableList.includes('potw-361'), 'Genders are considered duplicates')
  t.true(availableList.includes('potw-019'), 'Shinies are considered duplicates')
  t.true(availableList.includes('potw-021'), 'Forms are considered duplicates')
  t.true(availableList.includes('potw-023'), 'Vars are considered duplicates')
  t.false(availableList.includes('potw-280'), 'Genders are considered dupliates if you have both female and male')
})

function setGender(id: BadgeId, gender: PokemonGender) {
  const badge = new TeamsBadge(id);
  badge.gender = gender;
  return badge.toString();
}

function setForm(id: BadgeId, form: PokemonForm) {
  const badge = new TeamsBadge(id);
  badge.form = form;
  return badge.toString();
}

test('Duplicate behavior - Uncommon', t => {
  const uncommon = ENCOUNTERS['greatball']!
  const userDoc = {
    ...defaultValues,
    pokemon: {
      [Pokemon(I.Basculin)]: 1,
      [Pokemon(I.Basculin, {form: 'blue_stripe'})]: 1,
      [Pokemon(I.Castform, {form: 'sunny'})]: 1, // No base
    },
    eggs: [],
    hiddenItemsFound: [CATCH_CHARM_GSC, CATCH_CHARM_RSE, CATCH_CHARM_DPPT],
    items: {},
    lastPokeball: 0,
    ldap: 'nobody',
    battleBoxRecord: [],
    currentBadges: [],
  } as unknown as Users.Doc
  const now = new Date()
  const location: Location = {...Globe['US-BLD'], forecast: 'Rain'} // Boulder is Mountainous
  const encounter = uncommon(userDoc, now, location, 'List', {})
  t.true(encounter.list.includes('potw-001'))

  const availableList = deduplicate(encounter, userDoc.pokemon, false)
  const tempBadges = new Set(
    inflate(userDoc.pokemon)!.map(p => {
      const b = new Badge(p)
      return b.toLegacyString()
    })
  )
  encounter.list.filter((id) => {
    const genders = Pkmn.get(id)?.gender
    if (genders?.length) {
      const g = genders.some((gender) => !tempBadges.has(setGender(id, gender)))
      t.log(`For ${id} - Gender check - ${g}`)
      return g
    } else {
      const {key, syncableForms} = Pkmn.get(id)!
      if (syncableForms) {
        const f = syncableForms.every(form => tempBadges.has(setForm(id, form)))
        t.log(`For ${id} - Form check - ${f}`)
        return !f
      }
      if (tempBadges.has(key) && !syncableForms) {
        t.log(`For ${key} - Base check - false`)
        return false
      }
      return true
    }
  })
  t.log([...tempBadges])
  t.log(encounter.list)
  t.log(availableList)
  t.false(availableList.includes('potw-550-blue_stripe' as BadgeId), 'Basculin form captured')
  t.false(availableList.includes('potw-351-sunny' as BadgeId), 'Castform form captured')
  t.false(availableList.includes('potw-351' as BadgeId), 'Castform form not captured but cannot be in Rain')

  t.true(availableList.includes('potw-550-red_stripe' as BadgeId), 'Basculin form not captured')
  t.true(availableList.includes('potw-351-rainy' as BadgeId), 'Castform form not captured')
})

test('Duplicate behavior in lures', t => {
  const trophygarden = ENCOUNTERS['trophygardenkey']
  const userDoc = {
    ...defaultValues,
    pokemon: {
      [Pokemon(I.Clefairy)]: 1,
      [Pokemon(I.Jigglypuff)]: 1,
      [Pokemon(I.Roselia, {variant: 1})]: 1,
      [Pokemon(I.Staravia, {gender: 'male'})]: 1,
    },
    eggs: [],
    hiddenItemsFound: [CATCH_CHARM_GSC],
    items: {},
    lastPokeball: 0,
    ldap: 'nobody',
    battleBoxRecord: [],
  } as unknown as Users.Doc
  const now = new Date()
  const location: Location = {...Globe['US-BLD'], forecast: 'Snow'} // Boulder is Mountainous
  const encounter = trophygarden(userDoc, now, location, 'List', {})
  t.true(encounter.list.includes(P.Kricketot))

  const availableList = deduplicate(encounter, userDoc.pokemon, false, true)
  t.false(availableList.includes(P.Jigglypuff), 'Simple Pokemon should be considered duplicate')
  t.false(availableList.includes(P.Roselia), 'Roselia is already in there (as a var)')
  t.true(availableList.includes(P.Pichu), 'Pichu is not duplicate')
  t.true(availableList.includes(P.Staravia), 'Staravia can also be female')
})

test('AddIf', t => {
  const userDoc = {
    ...defaultValues,
    eggs: [],
    hiddenItemsFound: [],
    items: {},
    lastPokeball: 0,
    ldap: 'nobody',
    battleBoxRecord: [],
  } as unknown as Users.Doc
  const location = Globe['US-BLD'] // Boulder is Mountainous
  const p = {user: userDoc as Users.Doc, location}
  t.deepEqual(addIf(P.Pidgey, {gate: 'LcyYjBeK4KAq1BkYgzlx'}, p), [])
  t.deepEqual(addIf(P.Pidgey, {terrain: 'Mountain'}, p), [P.Pidgey, P.Pidgey])
  t.deepEqual(addIf(P.Pidgey, {terrain: 'Mountain', region: 'North America'}, p), [P.Pidgey, P.Pidgey])
  t.deepEqual(addIf(P.Pidgey, {terrain: 'Mountain', region: 'South America'}, p), [])
  t.deepEqual(addIf(P.Pidgey, {others: [true]}, p), [P.Pidgey, P.Pidgey])
  t.deepEqual(addIf(P.Pidgey, {other: true, count: 3}, p), [P.Pidgey, P.Pidgey, P.Pidgey])
})

test('Unova', t => {
  const userDoc = {
    ...defaultValues,
    eggs: [],
    hiddenItemsFound: [],
    items: {
      darkstone: 1
    },
    lastPokeball: 0,
    ldap: 'nobody',
    battleBoxRecord: [],
  } as unknown as Users.Doc
  const location = Globe['US-BLD'] // Boulder is Mountainous
  const p = {user: userDoc as Users.Doc, location}
  // Unova
  const darkstone = userDoc.items.darkstone! > 0
  const lightstone = userDoc.items.lightstone! > 0
  const haveStone = darkstone || lightstone

  t.deepEqual(addIf(P.Snivy, {other: haveStone}, p), [P.Snivy, P.Snivy])
})

test('Kalos', t => {
  const userDoc = {
    ...defaultValues,
    eggs: [],
    hiddenItemsFound: [],
    items: {
      darkstone: 1,
      venusaurite: 1,
      blastoiseite: 0,
    },
    lastPokeball: 0,
    ldap: 'nobody',
    battleBoxRecord: [],
  } as unknown as Users.Doc
  const location = Globe['US-BLD'] // Boulder is Mountainous
  const p = {user: userDoc as Users.Doc, location}
  t.deepEqual(addIf(P.Chespin, {item: ['venusaurite']}, p), [P.Chespin, P.Chespin])
  t.deepEqual(addIf(P.Fennekin, {item: ['charizarditex']}, p), [])
  t.deepEqual(addIf(P.Froakie, {item: ['blastoiseite']}, p), [])
})

test('Alola', t => {
  const userDoc = {
    ...defaultValues,
    eggs: [],
    hiddenItemsFound: [],
    items: {
      zrockium: 1,
    },
    lastPokeball: 0,
    ldap: 'nobody',
    battleBoxRecord: [],
  } as unknown as Users.Doc
  const location = Globe['US-BLD'] // Boulder is Mountainous
  const tod = timeOfDay(location)
  const oppositeTod = (() => {
    if (tod === 'Day') return 'Night'
    return 'Day'
  })()
  const p = {user: userDoc as Users.Doc, location}
  t.deepEqual(addIf(P.Lycanroc, {time: tod, item: ['zrockium'], count: 1}, p), [P.Lycanroc], "Lycanroc should appear")
  t.deepEqual(addIf(P.Lycanroc, {time: oppositeTod, item: ['zrockium'], count: 1}, p), [], "Lycanroc is in wrong time")
  t.deepEqual(addIf(P.Lycanroc, {time: tod, item: ['zghostium'], count: 1}, p), [], "Lycanroc needs item")
})

test('Release Pokemon', t => {
  const userDoc: Users.Doc = {
    ...defaultValues,
    pokemon: {
      ['1#Yf_4' as BadgeId]: 3,
      ['3#Yf_4' as BadgeId]: 3,
      ['5#Yf_4' as BadgeId]: 3,
    }
  }

  // Remove Bulb
  const items2 = genReleaseItems(userDoc, ['potw-001' as PokemonId])
  t.deepEqual(items2, ['pokeball'])
  t.deepEqual(userDoc.pokemon, {
    ['1#Yf_4' as BadgeId]: 2,
    ['3#Yf_4' as BadgeId]: 3,
    ['5#Yf_4' as BadgeId]: 3,
  })
  t.deepEqual(userDoc.items, {
    pokeball: 1,
  })

  // Remove Venus
  const items3 = genReleaseItems(userDoc, ['3#Yf_4' as PokemonId, '3#Yf_4' as PokemonId])
  t.deepEqual(items3, ['ultraball', 'ultraball'])
  t.deepEqual(userDoc.pokemon, {
    ['1#Yf_4' as BadgeId]: 2,
    ['3#Yf_4' as BadgeId]: 1,
    ['5#Yf_4' as BadgeId]: 3,
  })
  t.deepEqual(userDoc.items, {
    pokeball: 1,
    ultraball: 2,
  })
})

test('Release Pokemon via BankOperation[]', t => {
  const userDoc: Users.Doc = {
    ...defaultValues,
    pokemon: {
      ['1#Yf_4' as BadgeId]: 3,
      ['3#Yf_4' as BadgeId]: 3,
      ['5#Yf_4' as BadgeId]: 3,
    },
    items: {},
  }

  // Remove Bulb
  const items2 = v2Release(userDoc, '1#Yf_4', 1)
  t.deepEqual(items2, ['pokeball'])
  t.deepEqual(userDoc.pokemon, {
    ['1#Yf_4' as BadgeId]: 2,
    ['3#Yf_4' as BadgeId]: 3,
    ['5#Yf_4' as BadgeId]: 3,
  })
  t.deepEqual(userDoc.items, {
    pokeball: 1,
  })

  // Remove Venus
  const items3 = v2Release(userDoc, '3#Yf_4', 2)
  t.deepEqual(items3, ['ultraball', 'ultraball'])
  t.deepEqual(userDoc.pokemon, {
    ['1#Yf_4' as BadgeId]: 2,
    ['3#Yf_4' as BadgeId]: 1,
    ['5#Yf_4' as BadgeId]: 3,
  })
  t.deepEqual(userDoc.items, {
    pokeball: 1,
    ultraball: 2,
  })
})
