import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as Utils from './utils' 
import * as Pkmn from './../../shared/src/pokemon'
import { Users } from './db-types';

const db = admin.firestore()

interface BattleBoxEntry {
  species: string
  opponent: string
  result: 1 | 2 | 3 | number
  timestamp: FirebaseFirestore.FieldValue | number | FirebaseFirestore.Timestamp,
  userId: string,
  docId?: string
}

exports.battle_box = functions.https.onCall(async () => {
  throw new functions.https.HttpsError('failed-precondition',
    'The Battle Box has been closed and taped up.')
})

const WEEK = 1000 * 60 * 60 * 24 * 7

export const battle_box_history = functions.https.onCall(async (_, context) => {
  const userId = context.auth!.uid;
  const ref = db.collection('users').doc(userId)
  const userSnapshot = await ref.get()
  const data = userSnapshot.data() as Users.Doc
  const timeDiff = data.lastHistoryRequest ? Date.now() - data.lastHistoryRequest : Infinity
  if (timeDiff < WEEK) {
    throw new functions.https.HttpsError('cancelled', 'You requested data too recently')
  }

  await db.runTransaction(async t => {
    t.update(ref, {
      lastHistoryRequest: Date.now(),
    })
  })

  // TODO: Start pulling all user info

  const historyBattleBox = (async () => {
    const boxSnapshot = await db.collection('battleBox')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'asc')
      .get()
    return boxSnapshot.docs.map(doc => doc.data()) as BattleBoxEntry[]
  })()

  return {
    historyBattleBox,
  }
})

exports.battle_box_leaderboard = functions.https.onRequest(async (_, response) => {
  Utils.middleware(response)
  const leaderboards = await db.collection('battleBox').doc('record').get()
  const {topPokemon, topWins, topWinsWeekly, topRatio} = leaderboards.data()!
  response.status(200).send({
    topPokemon,
    topWins,
    topWinsWeekly,
    topRatio
  })
})

const RESULT_PLAYER_VICTORY = 1

// Run at midnight every Wednesday
exports.battle_box_leaderboard_cron = functions.pubsub.schedule('0 0 * * 3').onRun(async () => {
  const today = new Date()
  const min = today.getTime() - (1000 * 60 * 60 * 24 * 7) // Calculated weekly

  console.log(`Obtaining all the battles taking place after ` + 
    `${new Date(min).toISOString()}`)

  const battleSnapshot = await db.collection('battleBox')
    .where('timestamp', '>', new Date(min))
    .get()
  console.log(`Found ${battleSnapshot.docs.length} entries`)

  const usage = new Map()
  const winsWeekly = new Map()

  battleSnapshot.forEach((doc) => {
    const {species, result, userId} = doc.data() as BattleBoxEntry;
    if (usage.has(species)) {
      usage.set(species, usage.get(species) + 1)
    } else {
      usage.set(species, 1)
    }
    if (result === RESULT_PLAYER_VICTORY) {
      if (winsWeekly.has(userId)) {
        winsWeekly.set(userId, winsWeekly.get(userId) + 1)
      } else {
        winsWeekly.set(userId, 1)
      }
    }
  })

  usage[Symbol.iterator] = function* () {
    yield* [...this.entries()].sort((a, b) => b[1] - a[1]);
  }

  const topPokemon = [...usage]
    .slice(0, 5)
    .map(entry => entry[0])

  for (let i = 0; i < topPokemon.length; i++) {
    const {species} = Pkmn.get(topPokemon[i])!
    topPokemon[i] = species
  }

  winsWeekly[Symbol.iterator] = function* () {
    yield* [...this.entries()].sort((a, b) => b[1] - a[1]);
  }

  const topWinsWeekly = [...winsWeekly]
    .slice(0, 5)
    .map(entry => { return {uid: entry[0], wins: entry[1] }})

  for (let i = 0; i < topWinsWeekly.length; i++) {
    const doc = await db.collection('users').doc(topWinsWeekly[i].uid).get()
    topWinsWeekly[i]['ldap'] = doc.data()!.ldap
  }

  // Save this step
  await db.collection('battleBox').doc('record').update({
    topPokemon,
    topWinsWeekly
  })
  console.log(topPokemon, topWinsWeekly)

  const recordWins = new Map()
  const recordRatio = new Map()

  recordWins[Symbol.iterator] = function* () {
    yield* [...this.entries()].sort((a, b) => b[1] - a[1]);
  }
  recordRatio[Symbol.iterator] = function* () {
    yield* [...this.entries()].sort((a, b) => b[1] - a[1]);
  }

  const userSnapshot = await db.collection('users').get()
  userSnapshot.forEach((doc) => {
    const {battleBoxRecord, ldap} = doc.data()
    if (!battleBoxRecord) return
    recordWins.set(ldap, battleBoxRecord[1])
    const sum = battleBoxRecord[1] + battleBoxRecord[2] + battleBoxRecord[3]
    if (sum > 100) {
      // Only for 100+ battles
      recordRatio.set(ldap, battleBoxRecord[1] / sum)
    }
  })

  const topWins = [...recordWins]
    .slice(0, 5)
    .map(entry => { return {ldap: entry[0], wins: entry[1]} })
  const topRatio = [...recordRatio]
    .slice(0, 5)
    .map(entry => { return {ldap: entry[0], percent: entry[1]} })

  // Save
  await db.collection('battleBox').doc('record').update({
    topWins,
    topRatio,
  })

  return {
    topPokemon,
    topWinsWeekly,
    topWins,
    topRatio,
  }
})
