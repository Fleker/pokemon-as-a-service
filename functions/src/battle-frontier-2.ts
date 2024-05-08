import { PokemonId} from '../../shared/src/pokemon/types'
import { BATTLE_TIERS, canBeginnersCup } from '../../shared/src/battle-tiers'
import { BattleStadium, Users } from './db-types'
import { BadgeId } from '../../shared/src/pokemon/types';
import { STADIUM_REWARDS } from './platform/game-config'
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { randomItem } from './utils'
import { TeamsBadge } from './../../shared/src/badge2';
import * as Pkmn from './../../shared/src/pokemon'
import { getLocation } from './location'
import { addPokemon, calculateNetWorth, hasItem, hasPokemonFuzzy, removePokemon } from './users.utils'
import { salamander } from '@fleker/salamander'
import { RuntimeOptions } from 'firebase-functions'
import { forEveryUser } from './admin'
import { ITEMS, ItemId } from '../../shared/src/items-list'
import { Badge } from '../../shared/src/badge3'
import { F } from '../../shared/src/server-types'
import { raidBattleSettings } from './battle-raid.utils'
import { sendNotification } from './notifications'
import { item } from '../../shared/src/sprites'
import { matchup, ExecuteLog, RESULT_PLAYER_VICTORY } from '../../shared/src/battle/battle-controller'
import * as PI from '../../shared/src/gen/type-pokemon-ids'


// const db = salamander(admin.firestore())hj
const db = admin.firestore()
const FieldValue = admin.firestore.FieldValue

interface BattleStadiumDoc {
  species: (BadgeId | PokemonId)[]
  opponent: (BadgeId | PokemonId)[]
  result: 1 | 2 | 3 | number
  timestamp: FirebaseFirestore.FieldValue | number
  userId: string
  docId?: string
  heldItems: ItemId[]
  tier: string
}

const handleInBattleEvolution = async (t: admin.firestore.Transaction, user: Users.Doc, userTransRef: admin.firestore.DocumentSnapshot<admin.firestore.DocumentData>, match: ExecuteLog) => {
  // Handle in-battle evolutions
  // G-Farfetch'd -> Sirfetch'd
  console.warn('- process evos')
  const gFarfetchdEvo = match.players.filter(p => {
    const {badge, criticalHits} = p
    if (badge.id !== PI.Farfetchd || badge.personality.form !== 'galarian') {
      return false
    }
    if (criticalHits < 3) return false
    return true
  })
  for (const gFarfetchd of gFarfetchdEvo) {
    const {badge} = gFarfetchd
    removePokemon(user, badge)
    badge.id = PI.Sirfetchd
    badge.personality.form = undefined
    addPokemon(user, badge)
    await t.update(userTransRef.ref, { pokemon: user.pokemon })
    match.add("What's this? Your Farfetch'd is evolving!")
    match.add("Wow! Your Farfetch'd evolved into Sirfetch'd!")
  }

  // G-Yamask -> Runegrigus
  const gYamaskEvo = match.players.filter(p => {
    const {badge} = p
    if (badge.id !== PI.Yamask || badge.personality.form !== 'galarian') {
      return false
    }
    if (p.currentHp + 49 > p.totalHp) return false
    return true
  })
  for (const gYamask of gYamaskEvo) {
    const {badge} = gYamask
    removePokemon(user, badge)
    badge.id = PI.Runerigus
    badge.personality.form = undefined
    addPokemon(user, badge)
    await t.update(userTransRef.ref, { pokemon: user.pokemon })
    match.add("What's this? Your Yamask is evolving!")
    match.add("Wow! Your Yamask evolved into Runegrigus!")
  }

  // H-Basculin -> Basculegion
  const hBasculinEvo = match.players.filter(p => {
    const {badge} = p
    if (badge.id !== PI.Basculin || badge.personality.form !== 'white_stripe') {
      return false
    }
    // Take (294/2) damage
    if (p.currentHp + 147 > p.totalHp) return false
    return true
  })
  for (const hBasculin of hBasculinEvo) {
    const {badge} = hBasculin
    removePokemon(user, badge)
    badge.id = PI.Basculegion
    // but keep its gender
    badge.personality.form = undefined
    addPokemon(user, badge)
    await t.update(userTransRef.ref, { pokemon: user.pokemon })
    match.add("What's this? Your Basculin is evolving!")
    match.add("Wow! Your Basculin evolved into Basculegion!")
  }
  console.warn('+ process evos')
  return 'ok'
}

const battleStadiumOptions = {
  timeoutSeconds: 60,
  memory: '256MB'
} as RuntimeOptions
export const battle_stadium = functions.runWith(battleStadiumOptions)
    .https.onCall(async (data: F.BattleStadium.Req, context): Promise<F.BattleStadium.Res> => {
  const userId = context.auth!.uid;
  const {heldItems, tier, practice} = data
  if (!data.species || !Array.isArray(data.species) || !data.species[0]) {
    throw new functions.https.HttpsError('failed-precondition', 'No species found')
  } 
  const species: Badge[] = data.species.map(x =>
    x.startsWith('potw-') ? Badge.fromLegacy(x) : new Badge(x)
  )

  if (!BATTLE_TIERS[tier]) {
    throw new functions.https.HttpsError('failed-precondition',
        `Tier ${tier} does not seem to exist`)
  }

  const SLICE = BATTLE_TIERS[tier].rules.partySize

  if (species.length < SLICE) {
    throw new functions.https.HttpsError('not-found',
      `Battles require ${SLICE} Pokemon to be selected in the ${tier}.`)
  }

  const userRef = db.collection('users').doc(userId)
  const user = await db.runTransaction(async transaction => {
    // const userDoc = await transaction.get<Users.Doc>(userRef._raw)
    // const userData = userDoc.data()

    const userDoc = await transaction.get(userRef)
    const userData = userDoc.data() as Users.Doc

    const {lastBattleStadiumDate} = userData

    // Check the last time for the player
    const cooldown = 60 * 60 * 1000 // 1 Hour
    if (!practice) {
      if (lastBattleStadiumDate) {
        const timeDiff = Date.now() - lastBattleStadiumDate
        const minutes = Math.ceil((cooldown - timeDiff) / 60 / 1000) // Milliseconds -> minutes
        if (timeDiff < cooldown) {
          throw new functions.https.HttpsError('failed-precondition', 
            `You've been playing too much. Try again later: ${minutes} minutes difference.`)
        }
      }

      // Check you have valid Pokémon
      for (const pkmn of species) {
        const dblookup = Pkmn.get(pkmn.toLegacyString())!
        if (!dblookup.tiers) {
          throw new functions.https.HttpsError('failed-precondition',
              `${pkmn} is not allowed to compete in any tier`)
        }
        if (tier === 'Beginners Cup') {
          if (!canBeginnersCup(dblookup)) {
            throw new functions.https.HttpsError('failed-precondition',
              `${pkmn} is not allowed to compete (Tier ${tier})`)
          }
        } else {
          if (!dblookup.tiers.includes(tier)) {
            throw new functions.https.HttpsError('failed-precondition',
              `${pkmn} is not allowed to compete (Tier ${tier})`)
          }
        }
      }
      if (!hasPokemonFuzzy(userData, species.map(s => s.toString()))) {
        throw new functions.https.HttpsError('not-found', `Not found for user ${species.map(x => x.toString())}`)
      }
      // Check items
      heldItems.forEach((item) => {
        if (!hasItem(userData, item)) {
          throw new functions.https.HttpsError('failed-precondition',
            `You don't have the item ${item}`)
        }
        if (ITEMS[item].category === 'megastone' && !hasItem(userData, 'megabracelet')) {
          throw new functions.https.HttpsError('failed-precondition',
            `You don't have the Mega Bracelet.`)
        }
        if (ITEMS[item].category === 'zcrystal' && !hasItem(userData, 'zpowerring')) {
          throw new functions.https.HttpsError('failed-precondition',
            `You don't have the Z-Power Ring.`)
        }
        if (['maxmushroom', 'maxhoney', 'dynamaxcandy'].includes(item) && !hasItem(userData, 'dynamaxband')) {
          throw new functions.https.HttpsError('failed-precondition',
            `You don't have the Dynamax Band.`)
        }
      })
      const maxWins = BATTLE_TIERS[tier].rules.maxWins
      const userWins = userData.battleStadiumRecord[1]
      if (maxWins) {
        if (userWins > maxWins) {
          throw new functions.https.HttpsError('failed-precondition',
            `You have ${userWins}, more than the allowed ${maxWins}`)
        }
      }
      // Update transaction
      await transaction.update(userDoc.ref, {lastBattleStadiumDate: Date.now()})
    }
    return userData
  })
  const {location} = user
  let {battleStadiumRecord} = user

  // Grab the last player's Pokémon to use as your opponent
  const {opponent, oppoHeldItems} = await (async () => {
    if (practice) {
      // FIXME at some point improve the slicing
      if (species.length < SLICE * 2) {
        throw new functions.https.HttpsError('not-found',
          'Practice battles now require you to select both your Pokémon and ' +
          'your opponent from your collection.')
      }
      const opponent = [...species.slice(SLICE).map(x => x.toLegacyString())]
      // const opponent = [...species.slice(SLICE).map(x => x.toString())]
      const oppoHeldItems = [...heldItems.slice(SLICE)]
      return {opponent, oppoHeldItems}
    } else {
        const querySnapshot = await db.collection('battleStadium')
        .where('tier', '==', tier)
        .orderBy('timestamp', 'desc')
        .limit(1)
        // .get<BattleStadiumDoc>()
        .get()
      const lastMatch = (() => {
        if (!querySnapshot.empty && querySnapshot.docs[0]) {
          return querySnapshot.docs[0].data()
        }
        // Bootstrap new tier
        return {
          species: ['potw-003'],
          // species: ['3#Yf_4'],
          opponent: ['potw-006'],
          // opponent: ['6#Yf_4'],
          result: 1,
          timestamp: 0,
          userId: 'npc-joey',
          heldItems: [],
          tier
        }
      })()
      const opponent = lastMatch.species as BadgeId[]
      const oppoHeldItems = lastMatch.heldItems as ItemId[]
      return {opponent, oppoHeldItems}
    }
  })()

  console.log('Matchup', species, 'v', opponent)
  const locationDoc = await (async () => {
    if (!location) {
      return await getLocation('US-MTV')
    }
    const forecast = await getLocation(location)
    return forecast
  })()

  // Slice species
  const inBattleSpecies: Badge[] = species.slice(0, SLICE)
  const opponentSpecies: Badge[] = opponent.slice(0, SLICE).map(x => x.startsWith('potw-') ? Badge.fromLegacy(x) : new Badge(x))
  console.info(`await matchup(`, inBattleSpecies, species, opponentSpecies)
  const match = await matchup(
    inBattleSpecies, heldItems,
    opponentSpecies, oppoHeldItems,
    locationDoc, BATTLE_TIERS[tier].rules,
  )
  console.warn('Match result', match.msg)
  console.warn('+ match msg')
  console.warn('- practice')
  if (practice) {
    console.log('- practice')
    return {
      match,
      species: inBattleSpecies.map(x => x.toLegacyString()),
      heldItems,
      opponent,
      opponentHeldItems: oppoHeldItems,
      location: {
        forecast: locationDoc.forecast,
        terrain: locationDoc.terrain,
      },
      // No prize, no record
    }
  }

  console.warn('- bsr check')
  if (!battleStadiumRecord) {
    console.warn('- not bsr')
    // Need to generate this value first
    battleStadiumRecord = [0, 0, 0, 0]
    const userBattleBoxRecord = await db.collection('battleStadium')
      .where('userId', '==', userId)
      // .get<BattleStadium.Doc>()
      .get()
    for (const battle of userBattleBoxRecord.docs) {
      const data = battle.data()
      battleStadiumRecord[data.result]++
    }
    console.warn('+ not bsr')
  }
  console.warn('- update bsr')
  battleStadiumRecord[match.result]++
  console.warn('+ update bsr')
  // Create a new match DB entry
  const battleEntry: BattleStadiumDoc = {
    userId,
    timestamp: FieldValue.serverTimestamp(),
    species: inBattleSpecies.map(x => x.toLegacyString()),
    // species: inBattleSpecies.map(x => x.toString()),
    opponent,
    tier,
    heldItems,
    result: match.result
  }
  const battleRef = await db.collection('battleStadium').add(battleEntry)
  console.warn('+ add battleEntry')

  if (match.playerHeldItemsConsumed.length) {
    // Remove these items from the player's bag
    await db.runTransaction(async (transaction) => {
      const user = await transaction.get(userRef)
      // const user = await transaction.get<Users.Doc>(userRef._raw)
      const {items} = user.data()!
      match.playerHeldItemsConsumed.forEach(item => {
        if (item === undefined) return;
        items[item]--
      })
      await transaction.update(user.ref, { items })
    })
  }
  console.warn('+ consume items')

  const prize: ItemId | undefined = (() => {
    if (match.result === RESULT_PLAYER_VICTORY) {
      if (BATTLE_TIERS[tier].keyItemPrizes) {
        const filteredGifts = BATTLE_TIERS[tier].keyItemPrizes!.filter(gift =>
          !hasItem(user, gift))
        if (filteredGifts.length > 0) {
          return filteredGifts[0]
        }
      }
      // Award a prize to the user based on their total win count
      // Check if prize count should double.
      let userWins = battleStadiumRecord[RESULT_PLAYER_VICTORY]
      if (match.field.sides.Your.goldCoins || heldItems.includes('amuletcoin')) {
        userWins *= 2
      }
  
      let awardedPrize: ItemId = 'pokeball'
      const prizeTierList = BATTLE_TIERS[tier].prizes
      for (const prizeTier of prizeTierList) {
        if (userWins >= prizeTier.wins) {
          const userPrize = randomItem(prizeTier.items)
          console.warn(`${battleRef.id} ${userId} ${userWins} => ${userPrize} for ${prizeTier.wins}`)
          awardedPrize = userPrize
        }
      }
      return awardedPrize
    }

    return undefined
  })()
  console.warn('+ finish prize calc')

  await db.runTransaction(async (transaction) => {
    // const userTransRef = await transaction.get<Users.Doc>(userRef._raw)
    const userTransRef = await transaction.get(userRef)
    const user = userTransRef.data() as Users.Doc

    await handleInBattleEvolution(transaction, user, userTransRef, match)

    console.warn('- add prize')
    if (typeof prize === 'string') {
      const netWorth = calculateNetWorth(user)
      // Improve prize output for newer users
      const prizeMultiplier = (() => {
        if (netWorth < 100) return 3
        if (netWorth < 1000) return 2
        return 1
      })()
      // Double the reward with an Amulet Coin
      if (match.field.sides.Your.goldCoins || heldItems.includes('amuletcoin')) {
        if (prize) {
          await transaction.update(userTransRef.ref, {
            [`items.${prize}`]: FieldValue.increment(2 * prizeMultiplier)
          })
        }
      } else {
        if (prize) {
          await transaction.update(userTransRef.ref, {
            [`items.${prize}`]: FieldValue.increment(prizeMultiplier)
          })
        }
      }
      await transaction.update(userTransRef.ref, { battleStadiumRecord })
    } else {
      // Prize is undefined, so just updated record
      await transaction.update(userTransRef.ref, { battleStadiumRecord })
    }
    console.warn('+ add prize')
  })
  /*
  try {
    battleEntry['docId'] = battleRef.id
    // FieldValue.serverTimestamp() cannot be used inside of an array.
    battleEntry['timestamp'] = new Date().getTime()
    console.log('Add to adventure log for', userId, battleEntry)
    await db.collection('users').doc(userId).collection('adventureLog').doc('battleStadium').update({
      upToDate: true,
      docs: FieldValue.arrayUnion(battleEntry)
    })
  } catch (e) {
    console.warn('Battle Stadium - User does not have an adventure log', e)
  }
  */
  // Present value & log to user
  console.warn('- gen res')
  const record = `Your record: ${battleStadiumRecord[1]}-${battleStadiumRecord[2]}-${battleStadiumRecord[3]}`
  const returnedPrize: ItemId | undefined = (() => {
    if (typeof prize === 'string') {
      return prize
    }
    return undefined
  })()
  console.warn('+ gen res')
  return {
    match,
    species: species.map(x => x.toLegacyString()),
    heldItems,
    opponent,
    opponentHeldItems: oppoHeldItems,
    // {label: 'redorb'} => 'redorb' OR 'pokeball'
    prize: returnedPrize,
    record,
    location: {
      forecast: locationDoc.forecast,
      terrain: locationDoc.terrain,
    },
  }
})

const dbx = salamander(db)
const WEEK = 1000 * 60 * 60 * 24 * 7

export const battle_stadium_history = functions.https.onCall(async (_, context) => {
  const userId = context.auth!.uid;
  const ref = dbx.collection('users').doc(userId)
  const userSnapshot = await ref.get<Users.Doc>()
  const data = userSnapshot.data() as Users.Doc
  const timeDiff = data.lastHistoryRequest ? Date.now() - data.lastHistoryRequest : Infinity
  if (timeDiff < WEEK) {
    throw new functions.https.HttpsError('cancelled', 'You requested data too recently')
  }

  await dbx.runTransaction(async t => {
    t.update(ref, {
      lastHistoryRequest: Date.now(),
    })
  })

  const historyBattleStadium = (async () => {
    const stadiumSnapshot = await db.collection('battleStadium')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'asc')
      .get()
    return stadiumSnapshot.docs.map(doc => doc.data())
  })()

  return {
    historyBattleStadium,
  }
})

export const battle_leaderboards = functions.https.onCall(async (_, context) => {
  if (!context!.auth!.uid) {
    throw new functions.https.HttpsError('internal', '')
  }
  const leaderboards = await db.collection('battleStadium').doc('record').get()
  const raids = await db.collection('raids').doc('record').get()
  return {
    data: leaderboards.data(),
    raids: raids.data(),
  }
})

function matrixToArray(matrix: number[][]) {
  const flatArray: string[] = []
  for (const row of matrix) {
    flatArray.push(row.join(',')) // We will need to decode this on the client-side
  }
  return flatArray
}

async function raidStats() {
  const wins: number[][] = Array(raidBattleSettings.length).fill([])
  const losses: number[][] = Array(raidBattleSettings.length).fill([])

  // One week ago -> now
  const AFTER = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);

  const weekRaids = await db.collection('raids')
    .where('timestamp', '>', AFTER)
    .where('state', '==', 1)
    .get()
  
  weekRaids.docs.forEach(doc => {
    const {rating, players, result} = doc.data()
    const p = Object.keys(players).length
    // console.log(rating, p, result)
    if (result === 1) {
      if (!wins[rating].length) {
        wins[rating] = []
      }
      if (wins[rating][p]) {
        wins[rating][p]++
      } else {
        wins[rating][p] = 1
      }
    }
    if (result === 2) {
      if (!losses[rating].length) {
        losses[rating] = []
      }
      if (losses[rating][p]) {
        losses[rating][p]++
      } else {
        losses[rating][p] = 1
      }
    }
  })

  console.log('Get ratio now.')
  const ratio: number[][] =  Array(raidBattleSettings.length).fill([])
  for (let i = 1; i < raidBattleSettings.length; i++) {
    console.log(`Rating for ${i} star`)
    const max = raidBattleSettings[i].maxMembers
    ratio[i] = Array(max).fill(1) // Load '1' by default even if not correct
    for (let j = 1; j <= max; j++) {
      // console.log(`    When there are ${j} players`)
      if (wins[i][j] && !losses[i][j]) {
        ratio[i][j] = 1
      } else if (losses[i][j] && !wins[i][j]) {
        ratio[i][j] = 0
      } else if (losses[i][j] && wins[i][j]) {
        ratio[i][j] = wins[i][j] / (wins[i][j] + losses[i][j])
      }
    }
  }

  console.log('# Wins')
  console.table(wins)
  console.log('# Losses')
  console.table(losses)
  console.log('W/L Ratio')
  console.table(ratio)

  // Cannot return arrays of arrays
  // https://stackoverflow.com/questions/54785637/cloud-functions-error-cannot-convert-an-array-value-in-an-array-value
  // Convert to a comma-separated list that is basically this (but different)

  return {
    wins: matrixToArray(wins),
    losses: matrixToArray(losses),
    ratio: matrixToArray(ratio),
  }
}

// Run at midnight every Wednesday
const battleStadiumLeaderboardCron = {
  timeoutSeconds: 360,
  memory: '2GB'
} as RuntimeOptions
const allSettled = require('promise.allsettled');
export const battle_stadium_leaderboard_cron = functions.runWith(battleStadiumLeaderboardCron).pubsub.schedule('0 0 * * 3').onRun(async () => {
  const today = new Date()
  const min = today.getTime() - (1000 * 60 * 60 * 24 * 7) // Calculated weekly
  const leaderboard: BattleStadium.Leaderboard = {}
  console.log(`Obtaining all the battles taking place after ${new Date(min).toISOString()}`)

  for (const tier of Object.keys(BATTLE_TIERS)) {
    const battleSnapshot = await db.collection('battleStadium')
      .where('timestamp', '>', new Date(min))
      .where('tier', '==', tier)
      .get()
    console.log(`Found ${battleSnapshot.docs.length} entries for ${tier}`)

    const usage = new Map()
    const winsWeekly = new Map()

    battleSnapshot.forEach((doc) => {
      const {species, result, userId} = doc.data() as BattleStadiumDoc
      species.forEach(specie => {
        const respecieBadge = new TeamsBadge(specie)
        respecieBadge.shiny = false // Ignore shiny
        respecieBadge.gender = '' // Ignore gender
        const respecie = respecieBadge.toString()
        if (usage.has(specie)) {
          usage.set(specie, usage.get(respecie) + 1)
        } else {
          usage.set(respecie, 1)
        }
      })
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

    const topPokemonIds = [...usage]
      .slice(0, 5)
      .map(entry => entry[0])

    console.log('Top Pkmn', topPokemonIds)
    const topPokemon = []

    for (let i = 0; i < topPokemonIds.length; i++) {
      const species = new TeamsBadge(topPokemonIds[i]).toLabel()
      topPokemon[i] = species
    }

    winsWeekly[Symbol.iterator] = function* () {
      yield* [...this.entries()].sort((a, b) => b[1] - a[1]);
    }

    const topWinsWeekly = [...winsWeekly]
      .slice(0, 5)
      .map(entry => { return {uid: entry[0], wins: entry[1] }})

    for (let i = 0; i < topWinsWeekly.length; i++) {
      const doc = await dbx.collection('users').doc(topWinsWeekly[i].uid).get<Users.Doc>()
      topWinsWeekly[i]['ldap'] = doc.data().ldap
    }

    // For each top weekly player, reward them with TM and TR
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tmPromises: any[] = []
    const icon = item(STADIUM_REWARDS.tm)

    topWinsWeekly.forEach(winner => {
      const {uid} = winner
      // eslint-disable-next-line no-async-promise-executor
      tmPromises.push(new Promise(async (res) => {
        const ref = dbx.collection('users').doc(uid)
        const userDoc = await ref.get<Users.Doc>()
        const user = userDoc.data()
        const labels = [
          ITEMS[STADIUM_REWARDS.tm].label,
          ITEMS[STADIUM_REWARDS.tr].label,
        ]
        sendNotification(user, {
          category: 'BATTLE_LEADERBOARD',
          title: `You're in this week's battle leaderboard!`,
          body: `Thanks for participating. You win ${labels[0]} and ${labels[1]}.`,
          link: '',
          icon,
        })
        await ref.update<Users.Doc>({
          [`items.${STADIUM_REWARDS.tm}`]: FieldValue.increment(1),
          [`items.${STADIUM_REWARDS.tr}`]: FieldValue.increment(1),
          notifications: user.notifications,
        })
        res(1)
      }))
    })
    // If one transaction fails, don't takedown the whole leaderboard
    await allSettled(tmPromises)

    // Save
    leaderboard[tier] = {
      topPokemon,
      topPokemonIds,
      topWinsWeekly,
    }
  }

  // Next step is to get all-time records
  const recordWins = new Map()
  const recordRatio = new Map()

  // Sort map by value
  recordWins[Symbol.iterator] = function* () {
    yield* [...this.entries()].sort((a, b) => b[1] - a[1]);
  }
  recordRatio[Symbol.iterator] = function* () {
    yield* [...this.entries()].sort((a, b) => b[1] - a[1]);
  }

  await forEveryUser(['lastBattleStadiumDate', '>', 0], (user) => {
    const {battleStadiumRecord, ldap} = user
    if (!battleStadiumRecord) return
    recordWins.set(ldap, battleStadiumRecord[1])
    const sum = battleStadiumRecord[1] + battleStadiumRecord[2] + battleStadiumRecord[3]
    if (sum > 100) {
      // Only for 100+ battles
      recordRatio.set(ldap, battleStadiumRecord[1] / sum)
    }
  })

  console.log('Handled users')

  const topWins = [...recordWins]
    .slice(0, 5)
    .map(entry => { return {ldap: entry[0], wins: entry[1]} })
  const topRatio = [...recordRatio]
    .slice(0, 5)
    .map(entry => { return {ldap: entry[0], percent: entry[1]} })

  for (const tier of Object.keys(BATTLE_TIERS)) {
    leaderboard[tier].topWins = topWins
    leaderboard[tier].topRatio = topRatio
  }

  // Save
  await dbx.collection('battleStadium').doc('record').set<BattleStadium.Leaderboard>(leaderboard)

  // Add raid stat pulls
  const {ratio} = await raidStats()
  await dbx.collection('raids').doc('record').set({
    ratio,
  })

  return {
    tiersProcessed: Object.keys(BATTLE_TIERS),
  }
})
