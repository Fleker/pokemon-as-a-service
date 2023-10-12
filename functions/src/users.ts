import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { TeamsBadge } from '../../shared/src/badge2';
import { getDayCareHistory } from './day-care';
import { Users } from './db-types';
import { POKEDOLL, SHINY_CHARM, POKEDEX_QUESTS, PokedexQuest } from '../../shared/src/quests';
import { genAdventureLog, ItemEntry } from './items';
import { Globe } from '../../shared/src/locations-list';
import { clear, readPokedex } from './adventure-log';
import * as A from './adventure-log';
import { salamander } from '@fleker/salamander';
import { regions } from '../../shared/src/pokedex';
import { Location } from '../../shared/src/locations-list';
import { registerShinyRegion, Requirements } from '../../shared/src/legendary-quests';
import { getAllPokemon } from '../../shared/src/badge-inflate';
import { F } from '../../shared/src/server-types';
import { assert } from '@fleker/gents';
import { Badge } from '../../shared/src/badge3';
import { PokemonId } from '../../shared/src/pokemon/types';
import { obtainUsernameFromEmail, verifyUserEmail } from './vendor/example-tasks'

const db = salamander(admin.firestore())
const auth = admin.auth()
require("firebase-functions/lib/logger/compat") // Log compat

export const create_user_auto = functions.auth.user().onCreate(async (user) => {
  const userId = user.uid
  const email = user.email
  if (!verifyUserEmail(email)) {
    console.error(`User ${userId} is trying to create an account with ${email}.`)
    // Bye
    await admin.auth().deleteUser(userId)
    throw new functions.https.HttpsError('unauthenticated',
      `Sorry, you cannot do this... :'(`)
  }

  const usersRef = db.collection('users').doc(userId);
  const userDoc = await usersRef.get()
  if (userDoc.exists) {
    throw new functions.https.HttpsError('already-exists',
      'You are not allowed to do this!!! >:|')
  }
  const defaultUser: Users.Doc = {
    items: {
      pokeball: 10,
      greatball: 5,
      ultraball: 3,
      safariball: 1,
      lureball: 1,
      moonball: 1,
      levelball: 1,
      heavyball: 1,
      friendball: 1,
      loveball: 1,
      fastball: 1,
      competitionball: 1,
      masterball: 0,
      stardust: 3,
    },
    ldap: obtainUsernameFromEmail(email),
    currentBadges: [],
    lastPokeball: Date.now(),
    hiddenItemsFound: [],
    eggs: [],
    location: 'US-MTV',
    settings: {
      pokeindex: false,
      union: false,
      disableRealtime: false,
      disableSyncTeams: false,
      teamsSync: 'ALL',
      theme: 'default',
      flagAchievementService: false,
      flagLocation2: false,
      flagSearch2: false,
      flagTag: false,
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
    battleStadiumRecord: [0,0,0,0],
    raidRecord: [0,0,0,0],
    strikes: 0,
    moveTutors: 0,
    eggsLaid: 0,
    pokemon: {
      // Basic forms of Bulbasaur, Charmander, Squirtle
      '1#Yf_4': 1,
      '4#Yf_4': 1,
      '7#Yf_4': 1,
    },
  }
  await usersRef.set<Users.Doc>(defaultUser)

  return {
    html: 'Welcome to the world of Pokémon!'
  }
})

export const settings = functions.https.onCall(async (data: F.Settings.Req, context): Promise<F.Settings.Res> => {
  const userId = context.auth!.uid

  const usersRef = db.collection('users').doc(userId)
  let somethingHappened = false
  for (const setting of Object.keys(data)) {
    if (data[setting] !== undefined) {
      await usersRef.update({
        [`settings.${setting}`]: data[setting]
      })
      somethingHappened = true
    }
    if (setting.startsWith('notification')) {
      console.log('Modify notifications:', setting)
      const [, notificationType, notificationMethod] = setting.split('.')
      console.log('Modify notifications part 2:', notificationType, notificationMethod)
      await usersRef.update({
        [`settings.notification.${notificationType}.${notificationMethod}`]: data[setting]
      })
      somethingHappened = true
    }
  }

  if (somethingHappened) {
    return { html: 'ok' }
  }

  throw new functions.https.HttpsError('invalid-argument',
    `That is not a valid setting: ${Object.keys(data)}`);
})

export const npc = functions.https.onCall(async (data, context) => {
  const userId = context.auth!.uid

  const doc = await db.collection('users').doc(userId).get<Users.Doc>()
  if (!doc.exists) {
    // You can't delete a non-existent account
    throw new functions.https.HttpsError('failed-precondition', 'You cannot delete this account')
  }
  const userData = doc.data()
  userData.ldap = ''
  await db.collection('users').doc(`npc-${userId}`).set(userData)
  await db.collection('users').doc(userId).delete()
  // TODO: Clear GTS & Raids
  await admin.auth().deleteUser(userId)

  return {
    html: 'You have reset your account.'
  }
});

export const user_dowsing = functions.https.onCall(async (_, context): Promise<F.UserDowsing.Res> => {
  const userId = context.auth!.uid

  const doc = await db.collection('users').doc(userId).get<Users.Doc>()
  const {hiddenItemsFound} = doc.data()

  const hiddenItems = await db.collection('hiddenItems')
    .where('active', '==', true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .get<any>()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const itemsFound: any[] = []

  hiddenItems.forEach(snapshot => {
    if (hiddenItemsFound.includes(snapshot.id)) {
      const {badge, keyItem} = snapshot.data()
      if (keyItem) return // Key Items are now separate
      itemsFound.push({
        id: snapshot.id,
        badge,
      })
    }
  })

  return {
    data: itemsFound,
    // Only count regular dowsing items
    totalItemsCount: hiddenItems.docs.filter(item => !item.data().keyItem).length
  }
});

function getBadgeNumber(badge: string): number {
  if (badge.startsWith('potw-')) {
    const b = new TeamsBadge(badge)
    return b.id
  }
  const b = new Badge(badge)
  return b.id
}

function insertIntoSet(sets: PokedexSet, badge: string) {
  const id = getBadgeNumber(badge)
  for (const region of regions) {
    if (id >= region.range[0] && id <= region.range[1] && sets[region.key]) {
      sets[region.key].add(id)
      return
    }
  }
  console.error(`Cannot add to set ${badge}`)
}

interface PokedexSet {
  kanto: Set<number>
  johto: Set<number>
  hoenn: Set<number>
  sinnoh: Set<number>
  unova: Set<number>
  kalos: Set<number>
  alola: Set<number>
  unknown: Set<number>
  galar: Set<number>
  hisui: Set<number>
  paldea: Set<number>
}

export function toRequirements(user: Users.Doc, location: Location): Requirements {
  const {lastPokeball} = user
  const userJoin = (() => {
    if (lastPokeball['toMillis']) {
      return lastPokeball['toMillis']()
    }
    console.info(`lastPokeball not a timestamp: ${lastPokeball}`)
    return lastPokeball
  })()
  const pokemonKeys = Object.entries(user.pokemon).filter(([, v]) => v > 0).map(([k]) => k) as PokemonId[]
  const pokemonBadges = Object.entries(user.pokemon)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => [new Badge(k), v]) as [Badge, number][]
  const teamsBadges = pokemonBadges
    .map(([k, v]) => [new TeamsBadge(k.toLegacyString()), v]) as [TeamsBadge, number][]
  const badgeKeys = teamsBadges.map(([k]) => k.toString())
  const questArgs: Requirements = {
    battleStadiumRecord: user.battleStadiumRecord,
    teamsBadges,
    badgeKeys,
    pokemonBadges,
    pokemonKeys,
    pokemon: user.pokemon!,
    hiddenItemsFound: user.hiddenItemsFound,
    id: '', // Don't need this
    items: user.items,
    location,
    raidRecord: user.raidRecord,
    researchCompleted: user.researchCompleted!,
    userJoinedDate: userJoin,
    berryGrown: user.berryGrown!,
    totalTrades: (user.gtsTraded || 0) + (user.trainersTraded || 0),
    pokedex: user.pokedex!,
    eggsLaid: user.eggsLaid,
    moveTutors: user.moveTutors as number,
    friendSafari: user.friendSafari ?? '',
    itemsCrafted: user.itemsCrafted ?? 0,
    voyagesCompleted: user.voyagesCompleted ?? 0,
    evolutions: user.evolutionCount ?? 0,
    forms: user.formChangeCount ?? 0,
    restorations: user.restorationCount ?? 0,
  }
  return questArgs
}

export const user_pokedex = functions.https.onCall(async (_, context) => {
  const userId = context.auth!.uid

  console.log(`${userId} - Init...`)

  const pokemonSet: PokedexSet = {
    kanto: new Set(),
    johto: new Set(),
    hoenn: new Set(),
    sinnoh: new Set(),
    unova: new Set(),
    kalos: new Set(),
    alola: new Set(),
    unknown: new Set(), // Meltan region
    galar: new Set(),
    hisui: new Set(),
    paldea: new Set(),
  }

  const userRef = db.collection('users').doc(userId)
  const userDoc = await userRef.get<Users.Doc>()
  if (!userDoc.exists || !userDoc.data()) {
    throw new functions.https.HttpsError('invalid-argument', 'This user does not exist')
  }
  const pokeArr = getAllPokemon(userDoc.data())

  if (pokeArr.length) {
    pokeArr.forEach(badge => {
      insertIntoSet(pokemonSet, badge)
    })
  }

  console.log(`${userId} - pokeArr tracked`)

  const releasedDoc = await db.collection('users').doc(userId)
    .collection('adventureLog')
    .doc('released')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .get<any>()

  if (releasedDoc.exists) {
    const releasedBadges = releasedDoc.data().releasedBadges
    if (Array.isArray(releasedBadges)) {
      releasedBadges.forEach(badge => {
        insertIntoSet(pokemonSet, badge)
      })
    }
  }

  console.log(`${userId} - Releases tracked`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const badgesArrs: any[] = await readPokedex(userId, {limit: 2})
  if (Array.isArray(badgesArrs)) {
    badgesArrs.forEach(badgesArr => {
      if (badgesArr && badgesArr.badges && Array.isArray(badgesArr.badges)) {
        badgesArr.badges.forEach(badge => {
          insertIntoSet(pokemonSet, badge)
        })
      }
    })
  }
  console.log(`${userId} - Pokédex entries tracked`)

  const itemsUsed = await db.collection('users')
    .doc(userId)
    .collection('adventureLog')
    .doc('itemHistory')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .get<any>()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let itemsUsedArray: any[] = []
  if (itemsUsed.exists && itemsUsed.data().upToDate) {
    itemsUsedArray = itemsUsed.data().items
  } else {
    const itemsUsedSnapshots = await db.collection('items-history')
      .where('userId', '==', userId)
      .limit(500)
      .get()
    if (!itemsUsedSnapshots.empty) {
      const data: ItemEntry[] = itemsUsedSnapshots.docs.map(doc => doc.data() as ItemEntry)
      itemsUsedArray = genAdventureLog(data)
      await db.collection('users')
        .doc(userId)
        .collection('adventureLog')
        .doc('itemHistory')
        .set({ items: itemsUsedArray, upToDate: true })
    }
  }

  itemsUsedArray.forEach(data => {
    const {target, offeredPkmn, seekingPkmn} = data
    if (target) insertIntoSet(pokemonSet, target)
    if (offeredPkmn) insertIntoSet(pokemonSet, offeredPkmn)
    if (seekingPkmn) insertIntoSet(pokemonSet, seekingPkmn)
  })

  console.log(`${userId} - Item history tracked`)

  const {daycare} = await getDayCareHistory(userId)
  if (daycare && daycare.length) {
    daycare.forEach(momentcare => {
      insertIntoSet(pokemonSet, momentcare.fatherSpeciesId)
    })
  }

  console.log(`${userId} - Daycare tracked`)

  console.log(userId, pokemonSet)

  const SHINY_CHARM_REGION_COUNTER = 6 // Kalos
  const kanto = Array.from(pokemonSet.kanto)
  const johto = Array.from(pokemonSet.johto)
  const hoenn = Array.from(pokemonSet.hoenn)
  const sinnoh = Array.from(pokemonSet.sinnoh)
  const unova = Array.from(pokemonSet.unova)
  const kalos = Array.from(pokemonSet.kalos)
  const alola = Array.from(pokemonSet.alola)
  const unknown = Array.from(pokemonSet.unknown)
  const galar = Array.from(pokemonSet.galar)
  const hisui = Array.from(pokemonSet.hisui)
  const paldea = Array.from(pokemonSet.paldea)

  const pokedex = {
    kanto: kanto.length,
    johto: johto.length,
    hoenn: hoenn.length,
    sinnoh: sinnoh.length,
    unova: unova.length,
    kalos: kalos.length,
    alola: alola.length,
    unknown: unknown.length,
    galar: galar.length,
    hisui: hisui.length,
    paldea: paldea.length,
  }

  // Update user stats
  const charmsAdded: string[] = []
  const charmsRemoved: string[] = []
  try {
    await db.runTransaction(async transaction => {
      const user = await transaction.get<Users.Doc>(userRef)
      const {ldap, hiddenItemsFound, customBadges, pokemon} = user.data()
      const getShinyCharm = (() => {
        for (let i = 1; i <= SHINY_CHARM_REGION_COUNTER; i++) {
          const {key, total} = regions[i]
          if (pokedex[key] !== total) return false
        }
        return true
      })()

      console.log(`${userId} - Shiny Charm ${getShinyCharm}`)

      // Shiny Charm Check
      if (getShinyCharm && !hiddenItemsFound.includes(SHINY_CHARM)) {
        hiddenItemsFound.push(SHINY_CHARM)
        charmsAdded.push(SHINY_CHARM)
        console.log(`Gave a shiny charm to ${ldap}@ ${userId}`)
      } else if (!getShinyCharm && hiddenItemsFound.includes(SHINY_CHARM)) {
        hiddenItemsFound.splice(hiddenItemsFound.indexOf(SHINY_CHARM), 1)
        charmsRemoved.push(SHINY_CHARM)
        console.log(`Removed a shiny charm from ${ldap}@ ${userId}`)
      }

      for (let i = 0; i < POKEDEX_QUESTS.length - 1; i++) {
        // For each Catch Charm (but not Shiny Charm)
        const pokedexQuest = POKEDEX_QUESTS[i] as PokedexQuest
        const count = Array.from(pokemonSet[pokedexQuest.region]).length
        if (count >= pokedexQuest.count && !hiddenItemsFound.includes(pokedexQuest.docId)) {
          hiddenItemsFound.push(pokedexQuest.docId)
          charmsAdded.push(pokedexQuest.docId)
          console.log(`Gave a ${pokedexQuest.shorthand} catch charm to ${ldap}@ ${userId}`)
        } else if (count < pokedexQuest.count && hiddenItemsFound.includes(pokedexQuest.docId)) {
          hiddenItemsFound.splice(hiddenItemsFound.indexOf(pokedexQuest.docId), 1)
          charmsRemoved.push(pokedexQuest.docId)
          console.log(`Removed a ${pokedexQuest.shorthand} catch charm from ${ldap}@ ${userId}`)
        }
      }

      const updatedCustomBadges = customBadges ?? []
      for (let i = 1; i <= regions.length; i++) {
        const r = regions[i]
        if (!r) continue
        if (pokedex && pokedex[r.key] >= r.total) {
          updatedCustomBadges.push(`potw-dex-${r.key}`)
        } else {
          const dexIndex = updatedCustomBadges.indexOf(`potw-dex-${r.key}`)
          if (dexIndex > -1) {
            updatedCustomBadges.splice(dexIndex, 1)
          }
        }
        if (registerShinyRegion(r)({ pokemon } as Requirements) === r.total) {
          updatedCustomBadges.push(`potw-shiny-${r.key}`)
        } else {
          const dexIndex = updatedCustomBadges.indexOf(`potw-shiny-${r.key}`)
          if (dexIndex > -1) {
            updatedCustomBadges.splice(dexIndex, 1)
          }
        }
      }

      // Update DB
      console.log(`${userId} - Updating DB entry...`)
      await transaction.update(userRef, {
        hiddenItemsFound,
        pokedex,
        customBadges: updatedCustomBadges,
      })
      console.log(`${userId} - Updated DB entry`)
    })
  } catch (e) {
    console.error(e)
    throw new functions.https.HttpsError('cancelled',
      `Cannot update Pokédex: ${e}`)
  }

  console.log(`${userId} - Updated Pokédex data`)

  const alCount = await A.adventureLogNumber(userId, 'countPokedex')
  const alDocs = await A.adventureLogNumber(userId, 'pokedex')

  return {
    kanto, johto, hoenn, sinnoh, unova, kalos, alola, unknown, galar, hisui, paldea,
    charmsAdded,
    charmsRemoved,
    // debug values
    debug: {
      badgesArrs,
      alCount,
      alDocs,
    }
  }
})

export const user_adventurelog_clear = functions.https.onCall(async (data, context) => {
  const userId = context.auth!.uid
  const {field} = data
  const validFields = ['battleBox', 'daycare', 'gts', 'itemHistory']
  if (!validFields.includes(field)) {
    throw new functions.https.HttpsError('invalid-argument', 'What are you even doing?')
  }
  await db.collection('users').doc(userId).collection('adventureLog').doc(field).delete()
  await clear(userId, field)
  return {}
})

export const user_location = functions.https.onCall(async (data: F.UserLocation.Req, context): Promise<F.UserLocation.Res> => {
  const userId = context.auth!.uid
  const {location} = data
  if (!Globe[location] || !Globe[location].label) {
    console.error(`404 - ${location}`)
    throw new functions.https.HttpsError('not-found',
      `I don't know where ${location} is. Did you find it on a map?`)
  }
  return await db.runTransaction(async t => {
    const userRef = db.collection('users').doc(userId)
    const user = await t.get<Users.Doc>(userRef)
    const {hiddenItemsFound} = user.data()
    if (!hiddenItemsFound.includes(POKEDOLL)) {
      throw new functions.https.HttpsError('failed-precondition',
        'You have no way to travel! Perhaps you should find a transit pass.')
    }
    // Update DB
    t.update<Users.Doc>(userRef, {
      location
    })
    return {
      location,
      globe: Globe[location],
    }
  })
})

export const notifications_clear = functions.https.onCall(async (data: F.NotificationsClear.Req, context): Promise<F.NotificationsClear.Res> => {
  const userId = context.auth!.uid
  const {index} = data || {}
  if (index !== undefined) {
    const userDoc = await db.collection('users').doc(userId).get<Users.Doc>()
    const {notifications} = userDoc.data()
    if (!notifications) {
      throw new functions.https.HttpsError('out-of-range',
        'The user has no active notifications')
    }
    notifications.splice(index, 1)

    await db.collection('users').doc(userId).update({
      notifications,
    })

    return notifications
  }

  await db.collection('users').doc(userId).update({
    notifications: [],
  })
  return []
})

const FieldValue = admin.firestore.FieldValue

export const fcm_manage = functions.https.onCall(async (data: F.FcmManage.Req, context): Promise<F.FcmManage.Res> => {
  if (!context.auth) {
    throw new functions.https.HttpsError('not-found', '')
  }
  const userId = context.auth!.uid
  const {token, action} = data
  await db.runTransaction(async t => {
    const ref = db.collection('users').doc(userId)
    const userDoc = await t.get<Users.Doc>(ref)
    const user = userDoc.data()
    if (action === 'CLEAR') {
      if (user.fcm) {
        t.update<Users.Doc>(ref, {
          fcm: []
        })
      } else {
        throw new functions.https.HttpsError('not-found',
          'You have no tokens to remove')
      }
    } else if (action === 'REMOVE') {
      if (user.fcm) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        t.update<any>(ref, {
          fcm: FieldValue.arrayRemove(token)
        })
      } else {
        throw new functions.https.HttpsError('not-found',
          'You have no tokens to remove')
      }
    } else if (action === 'PUSH') {
      if (user.fcm) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        t.update<any>(ref, {
          fcm: FieldValue.arrayUnion(token)
        })
      } else if (token !== undefined) {
        t.update<Users.Doc>(ref, {
          fcm: [token]
        })
      }
    } else {
      throw new functions.https.HttpsError('failed-precondition',
        'No action found for', action)
    }
  })
  return 'OK'
})

export const user_history = functions.https.onCall(async (data: F.UserHistory.Req, context): Promise<F.UserHistory.Res> => {
  const userId = context.auth!.uid
  const oneWeek = 1000 * 60 * 60 * 24 * 7

  return await db.runTransaction(async t => {
    const ref = db.collection('users').doc(userId)
    const userDoc = await t.get<Users.Doc>(ref)
    const user = userDoc.data()
    if (user.lastHistoryRequest && user.lastHistoryRequest > Date.now() - oneWeek) {
      throw new functions.https.HttpsError('out-of-range',
        'Please wait longer to request history again. This operation is expensive in the backend.')
    }

    const lastHistory = Date.now()

    t.update<Users.Doc>(ref, { lastHistoryRequest: lastHistory })

    // History: Battle Box
    const historyBattleBox = await (async () => {
      const boxSnapshot = await db.collection('battleBox')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'asc')
        .get()
      return boxSnapshot.docs.map(doc => doc.data())/* as BattleBoxEntry[]*/
    })()

    // History: Battle Stadium
    const historyBattleStadium = await (async () => {
      const stadiumSnapshot = await db.collection('battleStadium')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'asc')
        .get()
      return stadiumSnapshot.docs.map(doc => doc.data())
    })()

    // History: GTS
    const userCreated = await db.collection('gts')
    .where('user', '==', userId)
    .where('completed', '==', true)
    .orderBy('timestampInitiated')
    .get()
    
    // Now do it for the set of users
    const userCompleted = await db.collection('gts')
      .where('user2', '==', userId)
      .where('completed', '==', true)
      .orderBy('timestampCompleted')
      .get()

    const historyGts = [
      ...userCreated.docs.map(d => d.data()),
      ...userCompleted.docs.map(d => d.data()),
    ]

    // History: Raids
    const historyHostedRaids = await (async () => {
      const stadiumSnapshot = await db.collection('raids')
        .where('host', '==', userId)
        .orderBy('timestamp', 'asc')
        .get()
      return stadiumSnapshot.docs.map(doc => doc.data())
    })()
    const historyParticipantRaids = await (async () => {
      const stadiumSnapshot = await db.collection('raids')
        .where('playerList', 'array-contains', userId)
        .orderBy('timestamp', 'asc')
        .get()
      return stadiumSnapshot.docs.map(doc => doc.data())
    })()

    // History: Item Usage
    const historyItemUsage = await (async () => {
      const stadiumSnapshot = await db.collection('items-history')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'asc')
        .get()
      return stadiumSnapshot.docs.map(doc => doc.data())
    })()

    // History: DayCare
    const historyDaycare = await (async () => {
      const stadiumSnapshot = await db.collection('dayCare')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'asc')
        .get()
      return stadiumSnapshot.docs.map(doc => doc.data())
    })()

    return assert<F.UserHistory.Res>({
      lastHistory,
      user,
      historyBattleBox,
      historyBattleStadium,
      historyHostedRaids,
      historyParticipantRaids,
      historyGts,
      historyItemUsage,
      historyDaycare,
    })
  })
})

/**
 * This function will quietly update the `<user>.ldap` field in Firestore if
 * it has changed since user account creation. This will not affect other
 * datastore places where the LDAP is a set field, such as raids. However,
 * those are transient places.
 */
export const user_sync_ldap = functions.https.onCall(async (data: Record<string, never>, context): Promise<void> => {
  const {uid} = context.auth!
  const userAccount = await auth.getUser(uid)
  const userRef = db.collection('users').doc(uid)
  const userDoc = await userRef.get<Users.Doc>()
  const user = userDoc.data()
  const {email} = userAccount
  if (!email) {
    throw new functions.https.HttpsError('not-found', `Syncing user account has no email`)
  }
  const ldap = obtainUsernameFromEmail(email)
  if (ldap !== user.ldap) {
    console.log('Sync LDAP')
    await userRef.update<Users.Doc>({
      ldap,
    })
  }
  return undefined
})