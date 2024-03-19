import test from 'ava'
import { Users } from '../db-types'
import {addIf, deduplicate, ENCOUNTERS} from '../encounter'
import { Globe, Location, timeOfDay } from '../../../shared/src/locations-list'
import { CATCH_CHARM_GSC, CATCH_CHARM_RSE } from '../../../shared/src/quests'
import { BadgeId, PokemonForm, PokemonGender, PokemonId } from '../../../shared/src/pokemon/types'
import * as P from '../../../shared/src/gen/type-pokemon'
import { fromPersonality } from '../../../shared/src/badge3'
import { genReleaseItems, v2Release } from '../collection.utils'
import * as I from '../../../shared/src/gen/type-pokemon-ids'
import { CATCH_CHARM_DPPT } from '../../../shared/src/legendary-quests'
import { inflate, myPokemon } from '../../../shared/src/badge-inflate'
import { Badge, MATCH_GTS } from '../../../shared/src/badge3'
import * as Pkmn from '../../../shared/src/pokemon'
import { TeamsBadge, Potw } from '../../../shared/src/badge2'
import { toBase64 } from '../../../shared/src/baseconv'

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
      [toBase64(I.Caterpie)]: {
        [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Caterpie)]: 1
      },
      [toBase64(I.Weedle)]: {
        [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Weedle)]: 1
      },
      [toBase64(I.Meowth)]: {
        [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Meowth)]: 1
      },
      [toBase64(I.Snorunt)]: {
        [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Snorunt)]: 1,
        [fromPersonality({pokeball: 'pokeball', gender: 'male', shiny: false, affectionate: false, location: 'US-MTV'}, I.Snorunt)]: 1,
      },
      [toBase64(I.Rattata)]: {
        [fromPersonality({pokeball: 'pokeball', gender: '', shiny: true, affectionate: false, location: 'US-MTV'}, I.Rattata)]: 1
      },
      [toBase64(I.Burmy)]: {
        [fromPersonality({form: 'trash', pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Burmy)]: 1
      },
      [toBase64(I.Ekans)]: {
        [fromPersonality({variant: 2, pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Ekans)]: 1
      },
      [toBase64(I.Ralts)]: {
        [fromPersonality({pokeball: 'pokeball', gender: 'female', shiny: false, affectionate: false, location: 'US-MTV'}, I.Ralts)]: 1,
        [fromPersonality({pokeball: 'pokeball', gender: 'male', shiny: false, affectionate: false, location: 'US-MTV'}, I.Ralts)]: 1,
      },
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
      [toBase64(I.Basculin)]: {
        [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Basculin)]: 1,
        [fromPersonality({form: 'blue_stripe', pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Basculin)]: 1,
      },
      [toBase64(I.Castform)]: {
        // No base
        [fromPersonality({form: 'sunny', pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Castform)]: 1
      },
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
      [toBase64(I.Clefairy)]: {
        [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Clefairy)]: 1
      },
      [toBase64(I.Jigglypuff)]: {
        [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Jigglypuff)]: 1
      },
      [toBase64(I.Roselia)]: {
        [fromPersonality({variant: 1, pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Roselia)]: 1
      },
      [toBase64(I.Staravia)]: {
        [fromPersonality({pokeball: 'pokeball', gender: 'male', shiny: false, affectionate: false, location: 'US-MTV'}, I.Staravia)]: 1
      },
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

test('Duplicate checks - Combee', t => {
  const common = ENCOUNTERS['pokeball']!
  const userDoc = {
    ...defaultValues,
    pokemon: {
      [toBase64(I.Combee)]: {
        [fromPersonality({location: 'BR-RIO', nature: 'Timid', pokeball: 'pokeball', gender: 'male', shiny: false, affectionate: false}, I.Combee)]: 1,
        [fromPersonality({location: 'US-CHI', nature: 'Naughty', pokeball: 'pokeball', gender: 'male', shiny: false, affectionate: false}, I.Combee)]: 1,
        [fromPersonality({location: 'US-SJC', nature: 'Bold', pokeball: 'pokeball', gender: 'male', shiny: false, affectionate: false}, I.Combee)]: 1,
        [fromPersonality({location: 'CL-SCL', nature: 'Bold', pokeball: 'pokeball', gender: '', shiny: false, affectionate: false}, I.Combee)]: 1,
        [fromPersonality({location: 'DE-FRA', nature: 'Jolly', pokeball: 'pokeball', gender: 'female', shiny: false, affectionate: false}, I.Combee)]: 1,
        [fromPersonality({location: 'MY-KUL', nature: 'Calm', pokeball: 'pokeball', gender: 'male', shiny: false, affectionate: false}, I.Combee)]: 1,
        [fromPersonality({location: 'CN-SHA', nature: 'Hardy', pokeball: 'pokeball', gender: 'male', shiny: false, affectionate: false}, I.Combee)]: 1,
        [fromPersonality({location: 'CO-BOG', nature: 'Hardy', pokeball: 'pokeball', gender: 'female', shiny: false, affectionate: false}, I.Combee)]: 1,
        [fromPersonality({location: 'US-MTV', nature: 'Naughty', pokeball: 'pokeball', gender: 'female', shiny: false, affectionate: false}, I.Combee)]: 1,
        [fromPersonality({location: 'US-SJC', nature: 'Modest', pokeball: 'pokeball', gender: 'male', shiny: false, affectionate: false}, I.Combee)]: 1,
      },
    },
    eggs: [],
    hiddenItemsFound: [CATCH_CHARM_RSE],
    items: {},
    lastPokeball: 0,
    ldap: 'nobody',
    battleBoxRecord: [],
  } as unknown as Users.Doc
  const now = new Date()
  const location: Location = {...Globe['US-MTV'], forecast: 'Sunny'}
  const encounter = common(userDoc, now, location, 'List', {})
  t.true(encounter.list.includes(P.Buizel))

  const availableList = deduplicate(encounter, userDoc.pokemon, false, true)
  t.false(availableList.includes(P.Combee), 'Player has both male and female Combee')
})

test('Duplicate checks - Darmanitan', t => {
  const rare = ENCOUNTERS['ultraball']!
  const userDoc = {
    ...defaultValues,
    pokemon: {
      [toBase64(I.Darmanitan)]: {
        [fromPersonality({location: 'AE-DXB', nature: 'Jolly', form: 'zen', pokeball: 'pokeball', gender: '', shiny: false, affectionate: false}, I.Darmanitan)]: 1,
        [fromPersonality({location: 'US-CHD', nature: 'Calm', form: 'ordinary', pokeball: 'pokeball', gender: '', shiny: false, affectionate: false}, I.Darmanitan)]: 1,
        [fromPersonality({location: 'AE-DXB', nature: 'Hardy', form: 'ordinary', pokeball: 'pokeball', gender: '', shiny: false, affectionate: false}, I.Darmanitan)]: 2,
        [fromPersonality({location: 'AE-DXB', nature: 'Adamant', form: 'zen', pokeball: 'pokeball', gender: '', shiny: false, affectionate: false}, I.Darmanitan)]: 2,
        [fromPersonality({location: 'AE-DXB', nature: 'Timid', form: 'ordinary', pokeball: 'pokeball', gender: '', shiny: false, affectionate: false}, I.Darmanitan)]: 2,
        [fromPersonality({location: 'MX-MEX', nature: 'Modest', form: 'ordinary', pokeball: 'pokeball', gender: '', shiny: false, affectionate: false}, I.Darmanitan)]: 2,
        [fromPersonality({location: 'MX-MEX', nature: 'Timid', form: 'ordinary', pokeball: 'pokeball', gender: '', shiny: false, affectionate: false}, I.Darmanitan)]: 2,
        [fromPersonality({location: 'MX-MEX', nature: 'Adamant', form: 'ordinary', pokeball: 'pokeball', gender: '', shiny: false, affectionate: false}, I.Darmanitan)]: 2,
        [fromPersonality({location: 'IL-TLV', nature: 'Calm', form: 'ordinary', pokeball: 'pokeball', gender: '', shiny: false, affectionate: false}, I.Darmanitan)]: 2,
        [fromPersonality({location: 'IL-TLV', nature: 'Jolly', form: 'ordinary', pokeball: 'pokeball', gender: '', shiny: false, affectionate: false}, I.Darmanitan)]: 2,
        [fromPersonality({location: 'IL-TLV', nature: 'Modest', form: 'ordinary', pokeball: 'pokeball', gender: '', shiny: false, affectionate: false}, I.Darmanitan)]: 3,
        [fromPersonality({location: 'IL-TLV', nature: 'Naughty', form: 'ordinary', pokeball: 'pokeball', gender: '', shiny: false, affectionate: false}, I.Darmanitan)]: 2,
        [fromPersonality({location: 'IL-TLV', nature: 'Adamant', form: 'ordinary', pokeball: 'pokeball', gender: '', shiny: false, affectionate: false}, I.Darmanitan)]: 2,
        [fromPersonality({location: 'IL-TLV', nature: 'Timid', form: 'ordinary', pokeball: 'pokeball', gender: '', shiny: false, affectionate: false}, I.Darmanitan)]: 2,
      },
    },
    eggs: [],
    hiddenItemsFound: [CATCH_CHARM_DPPT],
    items: {},
    lastPokeball: 0,
    ldap: 'nobody',
    battleBoxRecord: [],
  } as unknown as Users.Doc
  const now = new Date()
  const location: Location = {...Globe['US-MTV'], terrain: 'Desert', forecast: 'Heat Wave'}
  const encounter = rare(userDoc, now, location, 'List', {})

  const availableList = deduplicate(encounter, userDoc.pokemon, false, true)
  t.false(availableList.includes(P.Darmanitan), 'Player needs no Darmanitan')
})

// This test doesn't work.
test.skip('Duplicate checks - White Basculin', t => {
  const repeats = ENCOUNTERS['repeatball']!
  const userDoc = {
    ...defaultValues,
    pokemon: {
      [toBase64(I.Basculin)]: {
        [fromPersonality({location: 'US-ARB', nature: 'Hardy', form: 'blue_stripe', variant: 3, pokeball: 'pokeball', gender: '', shiny: false, affectionate: false}, I.Basculin)]: 1,
        [fromPersonality({location: 'US-PRY', nature: 'Modest', form: 'red_stripe', pokeball: 'pokeball', gender: '', shiny: false, affectionate: false}, I.Basculin)]: 1,
        [fromPersonality({location: 'CA-CAL', nature: 'Hardy', form: 'red_stripe', pokeball: 'pokeball', gender: '', shiny: false, affectionate: false}, I.Basculin)]: 1,
        [fromPersonality({location: 'US-MIA', nature: 'Bold', form: 'blue_stripe', pokeball: 'cherishball', gender: '', shiny: false, affectionate: false}, I.Basculin)]: 1,
        [fromPersonality({location: 'AU-MEL', nature: 'Jolly', form: 'blue_stripe', pokeball: 'cherishball', gender: '', shiny: false, affectionate: false}, I.Basculin)]: 1,
        [fromPersonality({location: 'TW-CHG', nature: 'Hardy', form: 'red_stripe', pokeball: 'pokeball', gender: '', shiny: false, affectionate: false}, I.Basculin)]: 1,
        [fromPersonality({location: 'UK-LON', nature: 'Calm', form: 'red_stripe', pokeball: 'cherishball', gender: '', shiny: false, affectionate: false}, I.Basculin)]: 1,
        [fromPersonality({location: 'US-BNA', nature: 'Calm', form: 'blue_stripe', pokeball: 'cherishball', gender: '', shiny: false, affectionate: false}, I.Basculin)]: 1,
        [fromPersonality({location: 'TR-IST', nature: 'Hardy', form: 'blue_stripe', pokeball: 'cherishball', gender: '', shiny: false, affectionate: false}, I.Basculin)]: 1,
        [fromPersonality({location: 'UA-KIE', nature: 'Hardy', form: 'blue_stripe', pokeball: 'cherishball', gender: '', shiny: false, affectionate: false}, I.Basculin)]: 1,
        [fromPersonality({location: 'BR-RIO', nature: 'Hardy', form: 'red_stripe', pokeball: 'cherishball', gender: '', shiny: false, affectionate: false}, I.Basculin)]: 1,
      }
    },
    eggs: [],
    hiddenItemsFound: [CATCH_CHARM_RSE],
    items: {},
    lastPokeball: 0,
    ldap: 'nobody',
    battleBoxRecord: [],
  } as unknown as Users.Doc
  const now = new Date()
  const location: Location = {...Globe['US-MTV'], terrain: 'Rural', region: 'Asia', forecast: 'Sunny'}
  const encounter = repeats(userDoc, now, location, 'List', {})
  
  const availableList = deduplicate(encounter, userDoc.pokemon, false, true)
  t.log(availableList)
  t.log(encounter.list)
  t.true(availableList.includes(Potw(P.Basculin, {form: 'white_stripe'})))

  // Add a White-Stripe
  userDoc.pokemon[toBase64(I.Basculin)][fromPersonality({location: 'BR-RIO', nature: 'Hardy', form: 'white_stripe', pokeball: 'pokeball', gender: 'male', shiny: false, affectionate: false}, I.Basculin)] = 2
  const availableList2 = deduplicate(encounter, userDoc.pokemon, false, true)
  t.false(availableList2.includes(Potw(P.Basculin, {form: 'white_stripe'})))
})

test('AddIf', t => {
  const userDoc = {
    ...defaultValues,
    eggs: [],
    hiddenItemsFound: ['SWARM'],
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

  const list: string[] = []
  if (userDoc.hiddenItemsFound.includes('SWARM')) {
    const swarmPokemon = P.Spinda
    // ~9-10% chance of a Swarm Pokemon.
    // (Keeping in mind that list + list/11 does increase the list size)
    list.push(...addIf(swarmPokemon, {count: 11}, p))
  }
  t.true(list.includes(P.Spinda))
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
      '1': {
        '3MfUhG': 3,
      },
      '3': {
        '3MfUhG': 3,
      },
      '5': {
        '3MfUgy': 3,
      },
    }
  }

  // Remove Bulb
  const simpBulb = Badge.fromLegacy('potw-001')
  t.log(simpBulb)
  t.deepEqual(simpBulb.fragments, ['1', '3MfUhG'])
  t.log([...myPokemon(userDoc.pokemon)].map(([k]) => k))
  const matchRes = Badge.match('1#3MfUhG', ['1#3MfUhG' as PokemonId, '3#3MfUhG' as PokemonId, '5#3MfUgy' as PokemonId], MATCH_GTS)
  t.log(matchRes)
  t.true(matchRes.match, 'Badge matching should work')
  const items2 = genReleaseItems(userDoc, ['potw-001' as PokemonId])
  t.deepEqual(items2, ['pokeball'])
  t.deepEqual(userDoc.pokemon, {
    '1': {
      '3MfUhG': 2,
    },
    '3': {
      '3MfUhG': 3,
    },
    '5': {
      '3MfUgy': 3,
    },
  })
  t.deepEqual(userDoc.items, {
    pokeball: 1,
  })

  // Remove Venus
  const simpleVenu = Badge.fromLegacy('potw-003')
  t.log(simpleVenu.original, simpleVenu.toString())
  const items3 = genReleaseItems(userDoc, ['3#3MfUhG' as PokemonId, '3#3MfUhG' as PokemonId])
  t.deepEqual(items3, ['ultraball', 'ultraball'])
  t.deepEqual(userDoc.pokemon, {
    '1': {
      '3MfUhG': 2,
    },
    '3': {
      '3MfUhG': 1,
    },
    '5': {
      '3MfUgy': 3,
    },
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
      '1': {
        '3MfUhG': 3,
      },
      '3': {
        '3MfUhG': 3,
      },
      '5': {
        '3MfUgy': 3,
      },
    },
    items: {},
  }

  // Remove Bulb
  t.log(userDoc.pokemon, new Badge('1#3MfUhG'))
  const items2 = v2Release(userDoc, '1#3MfUhG' as PokemonId, 1)
  t.log(userDoc.pokemon, new Badge('1#3MfUhG'))
  t.deepEqual(items2, ['pokeball'])
  t.deepEqual(userDoc.pokemon, {
    '1': {
      '3MfUhG': 2,
    },
    '3': {
      '3MfUhG': 3,
    },
    '5': {
      '3MfUgy': 3,
    },
  })
  t.deepEqual(userDoc.items, {
    pokeball: 1,
  })

  // Remove Venus
  const items3 = v2Release(userDoc, '3#3MfUhG' as PokemonId, 2)
  t.deepEqual(items3, ['ultraball', 'ultraball'])
  t.deepEqual(userDoc.pokemon, {
    '1': {
      '3MfUhG': 2,
    },
    '3': {
      '3MfUhG': 1,
    },
    '5': {
      '3MfUgy': 3,
    },
  })
  t.deepEqual(userDoc.items, {
    pokeball: 1,
    ultraball: 2,
  })
})
