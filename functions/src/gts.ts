import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { MATCH_GTS } from '../../shared/src/badge2'
import { Users } from './db-types';
import { randomItem } from './utils';
import * as Pkmn from '../../shared/src/pokemon'
import { tradeEvolutionsMap, ItemBasedFunction, trainerVerify, swap } from './gts.utils';
import { ITEMS, ItemId } from '../../shared/src/items-list';
import { BadgeId, pokemonForms, PokemonId } from '../../shared/src/pokemon/types';
import * as P from '../../shared/src/gen/type-pokemon'
import { addPokemon, hasItem, hasPokemon } from './users.utils';
import * as A from './adventure-log'
import {Badge} from '../../shared/src/badge3'
import { sendNotification } from './notifications';
import { pkmn } from '../../shared/src/sprites';

const db = admin.firestore()
const FieldValue = admin.firestore.FieldValue;

interface GtsQueryEntry {
  id?: string
  lookingForId: PokemonId
  speciesId: PokemonId
  heldItem?: ItemId
  lookingForItem?: ItemId
  user: string
}

export interface GtsEntry {
  speciesId: PokemonId,
  heldItem?: ItemId,
  lookingForId: PokemonId,
  lookingForItem?: ItemId,
  timestampInitiated: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue | number,
  timestampCompleted?: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue | number,
  user: string,
  user2?: string,
  completed: boolean,
  stale: boolean,
  private: boolean
}

type GtsCache = {[id: string]: GtsQueryEntry}

const MAX_USER_TRADES = 8

const cacheRebuild = async () => {
  try {
    const querySnapshot = await db.collection('gts')
      .where('completed', '==', false)
      .where('stale', '==', false)
      .orderBy('timestampInitiated')
      .get()
    const entries: GtsCache = {}
    querySnapshot.docs.forEach(doc => {
      const {speciesId, lookingForId, heldItem, lookingForItem, user} = doc.data() as GtsEntry
      const entry = {
        speciesId,
        lookingForId,
        user
      } as GtsQueryEntry
      if (heldItem) {
        entry.heldItem = heldItem
      }
      if (lookingForItem) {
        entry.lookingForItem = lookingForItem
      }
      entries[doc.id] = entry
    })
    console.log('GTS cache rebuild')
    console.log('cache', JSON.stringify(entries).length, 'bytes')
    await db.collection('gts').doc('_cache').set(entries)
  } catch (e) {
    console.error(e)
    throw new Error(e)
  }
}

const cacheAdd = async (tradeId: string, entry: GtsQueryEntry) => {
  const cacheRef = db.collection('gts').doc('_cache')
  console.log(`GTS cache add ${tradeId}`)
  await cacheRef.update({
    [tradeId]: entry
  })
}

const cacheRemove = async (tradeId: string) => {
  const cacheRef = db.collection('gts').doc('_cache')
  console.log(`GTS cache remove ${tradeId}`)
  await cacheRef.update({
    [tradeId]: FieldValue.delete()
  })
}

export const gts_query = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('not-found', '')
  }
  console.log('gts_query requested')
  const userId = context.auth!.uid

  if (!userId) {
    throw new functions.https.HttpsError('not-found', 'Not found')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queryEntries: any[] = []

  let querySnapshot

  console.log('db.collection requested')
  try {
    querySnapshot = await db.collection('gts').doc('_cache').get()
    if (querySnapshot.empty) {
      throw new functions.https.HttpsError('not-found',
        'No GTS documents found')
    }
  } catch (e) {
    console.error(`Cannot complete Firebase query: ${e}`)
    throw new functions.https.HttpsError('unavailable',
      `Cannot complete Firebase query: ${e}`)
  }
  console.log('db.collection obtained')

  // eslint-disable-next-line @typescript-eslint/ban-types
  const entryMap = querySnapshot.data() as Record<string, object>
  // Convert map to array
  const entries = Object.entries(entryMap).map(([id, entry]) => {
    return {
      ...entry,
      id,
    }
  }) as unknown as GtsQueryEntry[]

  for (let i = 0; i < entries.length; i++) {
    const data = entries[i]! as GtsQueryEntry
    const speciesId = data.speciesId.startsWith('potw-') ?
      Badge.fromLegacy(data.speciesId) : new Badge(data.speciesId)
    const lookingForId = data.lookingForId.startsWith('potw-') ?
      Badge.fromLegacy(data.lookingForId) : new Badge(data.lookingForId)
    const badgeString = speciesId.toSimple()
    try {
      const noteworthy = (() => {
        if (tradeEvolutionsMap[badgeString]) {
          if (tradeEvolutionsMap[badgeString].valid(data.heldItem as ItemId, data.lookingForId)) {
            if (typeof tradeEvolutionsMap[badgeString].name2 === 'string') {
              return tradeEvolutionsMap[badgeString].name2
            } else {
              return (tradeEvolutionsMap[badgeString].name2 as ItemBasedFunction)(data.heldItem as ItemId)
            }
          }
          return false
        }
        return false
      })()
      queryEntries.push({
        id: data.id,
        /**
         * Pokemon label
         * @deprecated
         */
        species: speciesId.toLabel(),
        speciesId: speciesId.toString(),
        /**
         * @deprecated
         */
        legacySpeciesId: speciesId.toLegacyString(),
        /**
         * @deprecated
         */
        lookingFor: lookingForId.toLabel(),
        lookingForId: lookingForId.toString(),
        heldItem: data.heldItem,
        lookingForItem: data.lookingForItem,
        noteworthy,
        user: userId == data.user ? userId : ''
      })
    } catch (e) {
      console.error(`Error generating datum: ${data.id} offer ${speciesId} lf ${lookingForId}`, e)
      // throw new functions.https.HttpsError('unavailable',
      //   `Error generating datum: ${data.id} ${e}`)
    }
  }
  return queryEntries
})

export async function getTradeHistory(userId, limit = 2) {
  // Either get from adventure log or populate from collection
  let docArr = await A.adventureLogNumber(userId, 'gts')
  let docNo = await A.adventureLogNumber(userId, 'countGts')
  let tradeData
  try {
    tradeData = await A.readGts(userId, {limit}) // Only read 2 docs for now
  } catch (e) {
    throw new functions.https.HttpsError('internal', e)
  }

  if (tradeData.length) {
    return {
      tradeData,
      docArr,
      docNo,
    }
  }

  // Retroactively implement trade history
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

  await db.runTransaction(async t => {
    for (const createdDoc of userCreated.docs) {
      await A.updateGts(t, {
        created: true,
        gtsDoc: createdDoc.data() as GtsEntry,
        tradeId: createdDoc.id,
        userId: userId
      })
    }

    for (const completedDoc of userCompleted.docs) {
      await A.updateGts(t, {
        created: false,
        gtsDoc: completedDoc.data() as GtsEntry,
        tradeId: completedDoc.id,
        userId: userId
      })
    }
  })

  docArr = await A.adventureLogNumber(userId, 'gts')
  docNo = await A.adventureLogNumber(userId, 'countGts')
  tradeData = await A.readGts(userId, {limit}) // Only read 2 docs for now
  return {
    tradeData,
    docArr,
    docNo,
  }
}

exports.gts_history = functions.https.onCall(async (data, context) => {
  const userId = context.auth!.uid
  let limit = 0
  if (data) {
    limit = data.limit
  }
  try {
    return await getTradeHistory(userId, limit || 2)
  } catch (e) {
    throw new functions.https.HttpsError('internal', e)
  }
})

interface GtsUploadParams {
  speciesId: BadgeId | PokemonId
  heldItem: ItemId
  lookingForId: BadgeId | PokemonId
  lookingForItem: ItemId
}

export const gts_upload = functions.https.onCall(async (data: GtsUploadParams, context) => {
  const userId = context.auth!.uid
  const {heldItem, lookingForItem} = data
  if (data.speciesId.startsWith('potw-')) {
    throw new functions.https.HttpsError('failed-precondition', 'Using old badge format')
  }
  const speciesId: Badge = new Badge(data.speciesId)
  const lookingForId: Badge = new Badge(data.lookingForId)
  if (speciesId.defaultTags?.includes('FAVORITE')) {
    throw new functions.https.HttpsError('failed-precondition', 'You cannot trade a favorite Pokemon.')
  }
  if (!speciesId) {
    throw new functions.https.HttpsError('invalid-argument', `Pokémon requires a speciesId`)
  }

  const legacySpeciesId = speciesId.toLegacyString()
  if (!Pkmn.get(legacySpeciesId)) {
    throw new functions.https.HttpsError('invalid-argument',
      `Pokémon ${speciesId} does not exist`)
  }

  if (!Pkmn.get(lookingForId.toLegacyString())) {
    console.error('Looking for error')
    throw new functions.https.HttpsError('invalid-argument',
      `Pokémon ${lookingForId} does not exist`)
  }

  if (speciesId.personality.form && !pokemonForms.includes(speciesId.personality.form!)) {
    throw new functions.https.HttpsError('invalid-argument', `Seeking Pokémon ${lookingForId} cannot exist`)
  }

  if (heldItem && !ITEMS[heldItem]) {
    throw new functions.https.HttpsError('invalid-argument', `You cannot include a non-item ${heldItem}`)
  }

  if (lookingForItem && !ITEMS[lookingForItem]) {
    throw new functions.https.HttpsError('invalid-argument', `You cannot include a non-item ${lookingForItem}`)
  }

  const activeTradesDoc = await db.collection('gts').doc('_cache').get()
  if (activeTradesDoc.exists) {
    const activeTrades = activeTradesDoc.data()!
    const currUserTrades = Object.values(activeTrades).filter(trade => userId == trade.user)
    if (currUserTrades.length >= MAX_USER_TRADES) {
      console.error(`User already has ${MAX_USER_TRADES}`)
      throw new functions.https.HttpsError('failed-precondition',
        `User already has ${MAX_USER_TRADES} open trades`)
    }
  } else {
    // Create empty doc
    await activeTradesDoc.ref.set({})
  }

  try {
    await db.runTransaction(async transaction => {
      const userRef = await transaction.get(db.collection('users').doc(userId))
      if (!userRef.exists) {
        throw new functions.https.HttpsError('invalid-argument', 'User does not exist')
      }

      const user = userRef.data() as Users.Doc
      console.debug(userId, lookingForId)

      if (!hasPokemon(user, speciesId.toOriginalString())) {
        throw new functions.https.HttpsError('invalid-argument',
          `[G-HPF] User ${user.ldap} does not have Pokémon ${speciesId.toSimple()}/${speciesId.toString()}`)
      }

      if (heldItem) {
        if (!hasItem(user as Users.Doc, heldItem)) {
          throw new functions.https.HttpsError('invalid-argument',
            `User does not have item ${heldItem}`)
        }
      }
    })
  } catch (e) {
    throw new functions.https.HttpsError('data-loss', `Cannot process upload validation: ${e}`)
  }

  // Create listing
  const gtsEntry: GtsEntry = {
    user: userId,
    speciesId: speciesId.toString(),
    lookingForId: lookingForId.toString(),
    completed: false,
    stale: false,
    timestampInitiated: FieldValue.serverTimestamp(),
    private: false,
  }

  if (heldItem) {
    gtsEntry.heldItem = heldItem
  }
  if (lookingForItem) {
    gtsEntry.lookingForItem = lookingForItem
  }
  console.debug('gtsEntry created!')
  const docRef = await db.collection('gts').add(gtsEntry)

  await cacheAdd(docRef.id, gtsEntry)

  return {
    html: `OK ${docRef.id}`,
    gtsDoc: docRef.id,
  }
})

interface GtsTradeParams {
  tradeId: string
  tradeSpeciesId: BadgeId | PokemonId
}

export const gts_trade = functions.https.onCall(async (data: GtsTradeParams, context) => {
  const userId = context.auth!.uid
  const {tradeId} = data
  if (data.tradeSpeciesId.startsWith('potw-')) {
    throw new functions.https.HttpsError('invalid-argument',
      'Trades that use the legacy badge format are no longer supported. Please send a new badge format and/or use the updated website.')
  }
  const tradeBadge = data.tradeSpeciesId.startsWith('potw-') ?
    Badge.fromLegacy(data.tradeSpeciesId) :
    new Badge(data.tradeSpeciesId)
  if (tradeBadge.defaultTags?.includes('FAVORITE')) {
    throw new functions.https.HttpsError('failed-precondition', 'You cannot trade a favorite Pokemon.')
  }
  console.debug(`Make trade ${tradeId} for seller ${userId}`);
  let html = ''
  // throw new functions.https.HttpsError('invalid-argument', 'GTS is borked right now :\\');

  await A.verify(userId, ['gts', 'pokedex'])

  // AAAHHH
  const intermediateGts = await db.collection('gts').doc(tradeId).get()
  const intermediateUser = intermediateGts.data()!.user
  await A.verify(intermediateUser, ['gts', 'pokedex'])

  // Wrap the entire operation in a single transaction
  // The MERCHANT actively trades the SEEKING pokemon
  // with the SELLER, who has the OFFERED pokemon
  // eslint-disable-next-line no-useless-catch
  try {
    const txnRes = await db.runTransaction(async (transaction) => {
      // Reset HTML output so that multiple transaction attempts
      // do not duplicate output
      html = ''
      const merchantRef = db.collection('users').doc(userId)
      const merchantDoc = await transaction.get(merchantRef)
      if (!merchantDoc.exists) {
        throw new functions.https.HttpsError('invalid-argument', 'User does not exist');
      }
      const merchant = merchantDoc.data() as Users.Doc

      const gtsRef = db.collection('gts').doc(tradeId)
      const gtsDoc = await transaction.get(gtsRef)
      if (!gtsDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Trade does not exist');
      }
      const {speciesId, completed, stale, user2, heldItem, lookingForItem} = gtsDoc.data()!;
      if (completed) {
        throw new functions.https.HttpsError('failed-precondition', 'Trade has already been done');
      }
      if (stale) {
        throw new functions.https.HttpsError('failed-precondition', 'Trade has expired');
      }

      const lookingForId: PokemonId = (() => {
        const lookingForOriginal = gtsDoc.data()!.lookingForId
        if (lookingForOriginal.startsWith('potw-')) {
          throw new functions.https.HttpsError('invalid-argument',
            `Looking For Original is ${lookingForOriginal} which is using an old invalid badge format for trade ${data.tradeId}`)
        }
        // I forget what this does.
        const has = Badge.match(lookingForOriginal, [tradeBadge.toString()], MATCH_GTS)
        if (tradeBadge.toString() && has.match) {
          return tradeBadge.toString()
        } else if (!tradeBadge.toString()) {
          return lookingForOriginal
        } else {
          throw new functions.https.HttpsError('failed-precondition',
          `${tradeBadge.toString()} does not match trade precondition for ${lookingForOriginal}`)
        }
      })()

      console.debug(`${tradeId} - Passed initial preconditions`)

      const user = (() => {
        if (gtsDoc.data()!.user) {
          return gtsDoc.data()!.user
        }
        return gtsDoc.data()!.userId // Compat with original data format
      })()

      if (user === user2 || user === userId) {
        // Update database
        await transaction.update(gtsRef, {
          stale: true,
          timestampStale: FieldValue.serverTimestamp()
        })
        throw new functions.https.HttpsError('failed-precondition', 'You cannot trade with yourself!');
      }

      const offer = speciesId.startsWith('potw-') ?
        Badge.fromLegacy(speciesId) :
        new Badge(speciesId)
      if (!Pkmn.get(offer.toLegacyString())) {
        throw new functions.https.HttpsError('not-found', `Offered species ${speciesId} does not exist`);
      }
      if (!Pkmn.get(new Badge(lookingForId).toLegacyString())) {
        throw new functions.https.HttpsError('not-found', `Seeking species ${lookingForId} does not exist`);
      }

      // Grant you a badge, remove the previous one
      try {
        trainerVerify(merchant, lookingForId, lookingForItem) // May throw if not valid
      } catch (e) {
        throw new functions.https.HttpsError('failed-precondition', e)
      }

      console.debug(`${tradeId} - Merchant ${userId} was verified`)

      const sellerRef = db.collection('users').doc(user)
      const sellerDoc = await transaction.get(sellerRef)
      const seller = sellerDoc.data() as Users.Doc
      try {
        trainerVerify(seller, speciesId, heldItem)
      } catch(e) {
        // Update database
        await transaction.update(gtsRef, {
          stale: true,
          timestampStale: FieldValue.serverTimestamp()
        })
        await cacheRemove(gtsRef.id) 
        throw new functions.https.HttpsError('unavailable', e)
      }
      console.debug(`${tradeId} - Seller was verified`)

      let merchantTradeNotes, sellerTradeNotes
      try {
        // Send `speciesId` from `seller` to `merchant`
        merchantTradeNotes = swap(seller, merchant, merchantDoc.id, speciesId, heldItem, lookingForId)
        sellerTradeNotes = swap(merchant, seller, sellerDoc.id, lookingForId, lookingForItem, speciesId)
      } catch (e) {
        throw new functions.https.HttpsError('failed-precondition', `Swap error ${e}`)
      }
      console.debug(`${tradeId} - Swap occurred`)

      try {
        await A.updatePokedex(transaction, {
          userId: merchantDoc.id,
          speciesId: new Badge(lookingForId).toLegacyString(),
        })
        // Note `seller` previously had a `speciesId`
        await A.updatePokedex(transaction, {
          userId: sellerDoc.id,
          speciesId: speciesId,
        })
        console.debug(`${tradeId} - Updated adventure logs`)
      } catch (e) {
        console.warn('AAAAHHHH')
      }

      if (merchantTradeNotes.html) {
        html += merchantTradeNotes.html
      }
      // Send a notification to the original person who made the trade
      console.debug(`${tradeId} - Posting notification...`)
      sendNotification(seller, {
        category: 'GTS_COMPLETE',
        link: '/gts',
        title: `Your ${new Badge(speciesId).toLabel()} was traded for ${new Badge(lookingForId).toLabel()}`,
        body: sellerTradeNotes.html ?? 'Your new Pokémon was placed in your box.',
        icon: pkmn(new Badge(lookingForId).toSprite()),
      })
      await transaction.update(sellerRef, {
        notifications: seller.notifications
      })

      console.log(`${tradeId} - Updating merchant badges with ${speciesId}`)
      await transaction.update(merchantRef, {
        pokemon: merchant.pokemon,
        items: merchant.items,
        gtsTraded: FieldValue.increment(1),
      })

      // Perform transactions to update the database
      console.log(`${tradeId} - Updating seller badges with ${lookingForId}`)
      await transaction.update(sellerRef, {
        pokemon: seller.pokemon,
        items: seller.items,
        gtsTraded: FieldValue.increment(1),
      })

      // Update the GTS entry to mark as completed
      const tradeIdRef = db.collection('gts').doc(tradeId)
      console.log(`${tradeId} - Marking GTS entry as completed`)
      await transaction.update(tradeIdRef, {
        // Log this trade for posterity
        timestampCompleted: FieldValue.serverTimestamp(),
        completed: true,
        user2: userId,
      })

      const gtsEntry: GtsEntry = gtsDoc.data() as GtsEntry
      gtsEntry.user2 = userId
      gtsEntry.timestampCompleted = FieldValue.serverTimestamp()

      try {
        await A.updateGts(transaction, {
          created: true,
          gtsDoc: gtsEntry,
          tradeId: tradeId,
          userId: gtsEntry.user,
        })
      } catch (e) {
        console.error(`${tradeId} - Adventure log merchant: ${e}`)
      }

      try {
        await A.updateGts(transaction, {
          created: false,
          gtsDoc: gtsEntry,
          tradeId: tradeId,
          userId,
        })
      } catch (e) {
        console.error(`${tradeId} - Adventure log seller: ${e}`)
      }
      console.debug(`${tradeId} - Update GTS`)

      // Lookup ldap
      const merchantLdap = merchantDoc.data()!.ldap
      const sellerLdap = sellerDoc.data()!.ldap
      console.log(`${tradeId} - Return LDAPs ${merchantDoc.id} & ${sellerDoc.id}`)
      return { merchantLdap, sellerLdap, lookingForId, speciesId }
    })

    console.log(`${tradeId} - Rebuilding cache`)
    await cacheRemove(tradeId)
    console.log(`${tradeId} - Cache rebuild complete`)

    return {
      html: `${html} Trade completed`,
      speciesId: txnRes.speciesId
    }
  } catch (err) {
    throw err
  }
});

async function invalidateUncompletedTrades() {
  const now = Date.now()
  const pruneDate = new Date(now - 1000 * 60 * 60 * 24 * 10.5) // 10.5 days
  const pruneDateFar = new Date(now - 1000 * 60 * 60 * 24 * 12) // 12 days
  const staleGtsDocs = await db.collection('gts')
    .where('timestampInitiated', '<', pruneDate)
    .where('timestampInitiated', '>', pruneDateFar)
    .where('completed', '==', false)
    .get()

  const docs = staleGtsDocs.docs.filter(doc => !doc.data().stale)
  for (const doc of docs) {
    // Mark as completed and as stale
    console.log('iut', doc.id)
    const {speciesId} = doc.data() as GtsEntry
    if (speciesId.startsWith('potw')) {
      // Oh geez this is very old
      await db.runTransaction(async (transaction) => {
        return transaction.update(doc.ref, {
          stale: true,
          timestampStale: FieldValue.serverTimestamp()
        })
      })
      continue; // Go to the next one
    }
    const speciesLegacy = new Badge(speciesId).toLegacyString()
    const speciesDb = Pkmn.get(speciesLegacy)
    if (!speciesDb) {
      console.error(`Error in trade ${doc.id}: ${speciesId}/${speciesLegacy} maps to a null value`)
    }
    // const species = Pkmn.get(speciesLegacy)!.species
    // const lookingFor = Pkmn.get(lookingForLegacy)!.species

    // Update database
    await db.runTransaction(async (transaction) => {
      return transaction.update(doc.ref, {
        stale: true,
        timestampStale: FieldValue.serverTimestamp()
      })
    })
  }
  return docs.length
}

// Pick up any old trades that may have escaped the previous check.
// This might happen if the cron crashes a few days in a row.
async function invalidateVeryStaleTrades() {
  const now = Date.now()
  const pruneDateFar = new Date(now - 1000 * 60 * 60 * 24 * 14) // 14 days
  const staleGtsDocs = await db.collection('gts')
    .where('timestampInitiated', '<', pruneDateFar)
    .where('stale', '==', false)
    .where('completed', '==', false)
    .get()

  for (const doc of staleGtsDocs.docs) {
    // Mark as completed and as stale
    console.log('ivst', doc.id)
    // Oh geez this is very old
    await db.runTransaction(async (transaction) => {
      return transaction.update(doc.ref, {
        stale: true,
        timestampStale: FieldValue.serverTimestamp()
      })
    })
  }
  return staleGtsDocs.docs.length
}

/**
 * Any private trade room older than a week gets closed.
 */
async function invalidateOldTradeRooms() {
  const now = Date.now()
  const pruneDateFar = new Date(now - 1000 * 60 * 60 * 24 * 7) // 14 days
  const staleTradeDocs = await db.collection('trades')
    .where('timestamp', '<', pruneDateFar)
    .where('active', '==', true)
    .get()

  for (const doc of staleTradeDocs.docs) {
    // Mark as completed and as stale
    console.log('iotr', doc.id)
    // Oh geez this is very old
    await db.runTransaction(async (transaction) => {
      return transaction.update(doc.ref, {
        active: false,
      })
    })
  }
  return staleTradeDocs.docs.length
}

async function generateLeaderboard() {
  const now = Date.now()
  const pruneDateFar = new Date(now - 1000 * 60 * 60 * 24 * 14) // 14 days
  const successGtsDocs = await db.collection('gts')
    .where('timestampInitiated', '>', pruneDateFar)
    .where('stale', '==', false)
    .where('completed', '==', true)
    .get()
  const simplePokemonTrades = {}
  const canonicalTrades = {}
  const simpleOffers = {}
  const canonicalOffers = {}
  const updateMap = (id: string, map: Record<string, number>) => {
    if (map[id]) {
      map[id]++
    } else {
      map[id] = 1
    }
  }
  for (const doc of successGtsDocs.docs) {
    const {lookingForId, speciesId} = doc.data()
    const simpleLF = new Badge(lookingForId).toSimple()
    updateMap(simpleLF, simplePokemonTrades)
    updateMap(lookingForId, canonicalTrades)
    const simpleOffer = new Badge(speciesId).toSimple()
    updateMap(simpleOffer, simpleOffers)
    updateMap(speciesId, canonicalOffers)
  }
  await db.collection('gts').doc('leaderboard').set({
    simplePokemonTrades,
    canonicalTrades,
    simpleOffers,
    canonicalOffers,
  })
}

/**
 * Run every twenty-three hours.
 */
export const gts_prune_stale_cron = functions.pubsub.schedule('0 */23 * * *').onRun(async () => {
  let stale = await invalidateUncompletedTrades()
  stale += await invalidateVeryStaleTrades()
  stale += await invalidateOldTradeRooms()
  await cacheRebuild()
  await generateLeaderboard()
  await db.collection('admin').doc('cron').update({
    gtsPruneStaleCron: Date.now()
  })
  return `Pruned old GTS entries (${stale})`
})

export const gts_cancel = functions.https.onCall(async (data, context) => {
  const userId = context.auth!.uid
  const {tradeId} = data
  console.log(tradeId, userId)

  if (!tradeId) {
    throw new functions.https.HttpsError('failed-precondition',
      'There is no trade selected')
  }

  const gtsDoc = await db.collection('gts').doc(tradeId).get()
  if (!gtsDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Trade ID not found');
  }

  const {user} = gtsDoc.data()!;
  if (user !== userId && gtsDoc.data()!.userId !== userId) {
    throw new functions.https.HttpsError('permission-denied',
      'Cannot cancel this GTS listing');
  }

  const tradeIdRef = db.collection('gts').doc(tradeId)

  try {
    await db.runTransaction(async transaction => {
      await transaction.delete(tradeIdRef)
    })

    await cacheRemove(tradeId)
    return {
      html: 'Trade removed'
    }
  } catch (e) {
    throw new functions.https.HttpsError('cancelled',
      `Cannot remove trade from DB: ${e}`)
  }
});

// Create one virtual trade everyday, then evaluate later
export const gts_virtual_cron = functions.pubsub.schedule('0 0 */1 * *').onRun(async () => {
  const userDoc = await db.collection('users').doc('npc-joey').get()
  const user = userDoc.data() as Users.Doc
  const potentialTrades = [{
    speciesId: Badge.fromLegacy(P.Machoke).toString(),
    lookingForId: Badge.fromLegacy(P.Kadabra).toString(),
  }, {
    speciesId: Badge.fromLegacy(P.Graveler).toString(),
    lookingForId: Badge.fromLegacy(P.Machoke).toString(),
  }, {
    speciesId: Badge.fromLegacy(P.Haunter).toString(),
    lookingForId: Badge.fromLegacy(P.Graveler).toString(),
  }, {
    speciesId: Badge.fromLegacy(P.Kadabra).toString(),
    lookingForId: Badge.fromLegacy(P.Haunter).toString(),
  }]
  const trade = randomItem(potentialTrades)
  addPokemon(user, Badge.fromLegacy(trade.speciesId))
  await db.collection('users').doc('npc-joey').update({ pokemon: user.pokemon })
  const gtsEntry: GtsEntry = {
    ...trade,
    user: 'npc-joey',
    completed: false,
    stale: false,
    timestampInitiated: FieldValue.serverTimestamp(),
    private: false,
  }
  const gtsRef = await db.collection('gts').add(gtsEntry)
  await cacheAdd(gtsRef.id, gtsEntry)
  return `Created virtual trade - ${gtsEntry.speciesId} for ${gtsEntry.lookingForId}`
})
