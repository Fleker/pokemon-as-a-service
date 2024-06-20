// Set of functions relating to the creation and handling of private trade rooms

import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { GtsEntry } from './gts'
import { DbTradeRoom, Users } from './db-types';
import * as Pkmn from '../../shared/src/pokemon'
import { ITEMS } from '../../shared/src/items-list';
import { hasItem, hasPokemon } from './users.utils';
import { swapNoCheck } from './gts.utils';
import * as A from './adventure-log'
import { salamander } from '@fleker/salamander';
import {Badge} from '../../shared/src/badge3'
import {F} from '../../shared/src/server-types'
import { updateFriendSafari } from '../../shared/src/friend-safari';

const db = salamander(admin.firestore())
const FieldValue = admin.firestore.FieldValue;

// Note: The lack of transactions being used can cause data loss issues

export const trade_room_create = functions.https.onCall(async (_, context): Promise<F.TradeRoomCreate.Res> => {
  const userId = context.auth!.uid

  const userDoc = await db.collection('users').doc(userId).get<Users.Doc>()
  const user = userDoc.data()

  const tradeRoom: DbTradeRoom = {
    host: {
      id: userId,
      ldap: user.ldap,
      hiddenItems: user.hiddenItemsFound,
      offerConfirmed: false,
      offerItem: null,
      offerSpecies: null,
    },
    active: true,
    timestamp: FieldValue.serverTimestamp(),
    trades: 0,
  }

  const roomDoc = await db.collection('trades').add(tradeRoom)
  return {
    roomId: roomDoc.id,
  }
})

export const trade_room_join = functions.https.onCall(async (data: F.TradeRoomJoin.Req, context): Promise<F.TradeRoomJoin.Res> => {
  const userId = context.auth!.uid
  const {roomId} = data

  const roomDoc = await db.collection('trades').doc(roomId).get()
  const room = roomDoc.data() as DbTradeRoom
  if (!room.active) {
    throw new functions.https.HttpsError('out-of-range',
      'This room is not available')
  }
  if (room.player !== undefined && room.player.id !== userId) {
    throw new functions.https.HttpsError('failed-precondition',
      'You are unable to join this room')
  }
  if (room.player?.id === room.host.id) {
    throw new functions.https.HttpsError('failed-precondition',
      'You are yourself')
  }

  const userDoc = await db.collection('users').doc(userId).get<Users.Doc>()
  const user = userDoc.data()

  room.player = {
    id: userId,
    ldap: user.ldap,
    hiddenItems: user.hiddenItemsFound,
    offerConfirmed: false,
    offerItem: null,
    offerSpecies: null,
  }

  await roomDoc.ref.update<DbTradeRoom>(room)
  return {
    roomId,
    joined: true,
  }
})

export const trade_offer = functions.https.onCall(async (data: F.TradeOffer.Req, context): Promise<F.TradeOffer.Res> => {
  const userId = context.auth!.uid
  const {roomId, species, item} = data

  if (species.startsWith('potw-')) {
    throw new functions.https.HttpsError('invalid-argument',
      'Trades that use the legacy badge format are no longer supported. Please send a new badge format and/or use the updated website.')
  }

  const badge = new Badge(species)
  if (badge.defaultTags?.includes('FAVORITE')) {
    throw new functions.https.HttpsError('failed-precondition', 'You cannot trade a favorite Pokemon.')
  }

  const roomDoc = await db.collection('trades').doc(roomId).get<DbTradeRoom>()
  const room = roomDoc.data()
  if (!room.active) {
    throw new functions.https.HttpsError('out-of-range',
      'This room is not available')
  }
  if (room.player?.id === room.host.id) {
    throw new functions.https.HttpsError('failed-precondition',
      'You are yourself')
  }

  const userDoc = await db.collection('users').doc(userId).get<Users.Doc>()
  const user = userDoc.data()

  if (species !== null) {
    const offerPkmn = Pkmn.get(badge.toLegacyString())
    if (!species || !offerPkmn) {
      throw new functions.https.HttpsError('failed-precondition',
        `No species ${offerPkmn}`)
    }

    if (!hasPokemon(user, badge.toOriginalString())) {
      throw new functions.https.HttpsError('failed-precondition',
        `[T-HPF] You do not have species ${badge.toSimple()}/${badge.toString()}`)
    }
  }

  if (item) {
    if (!ITEMS[item].label) {
      throw new functions.https.HttpsError('failed-precondition',
        `No item ${item}`)
    }
    if (!hasItem(user, item)) {
      throw new functions.https.HttpsError('failed-precondition',
        `You do not have item ${item}`)
    }
  }

  if (room.host.id === userId) {
    room.host.offerSpecies = badge.toString()
    if (item) {
      room.host.offerItem = item
    }
    room.host.offerConfirmed = false
  } else if (room.player?.id === userId) {
    room.player.offerSpecies = badge.toString()
    if (item) {
      room.player.offerItem = item
    }
    room.player.offerConfirmed = false
  } else {
    throw new functions.https.HttpsError('failed-precondition', 'Who are you?')
  }

  await roomDoc.ref.update<DbTradeRoom>(room)

  return {
    roomId
  }
})

export const trade_confirm = functions.https.onCall(async (data: F.TradeConfirm.Req, context): Promise<F.TradeConfirm.Res> => {
  const userId = context.auth!.uid
  const {roomId, confirmed} = data

  const roomRef = db.collection('trades').doc(roomId)
  const roomDoc = await roomRef.get<DbTradeRoom>()
  const room = roomDoc.data()
  if (!room.active) {
    throw new functions.https.HttpsError('out-of-range',
      'This room is not available')
  }
  if (room.player?.id === room.host.id) {
    throw new functions.https.HttpsError('failed-precondition',
      'You are yourself')
  }

  if (room.host?.offerSpecies === null || room.player?.offerSpecies === null) {
    throw new functions.https.HttpsError('failed-precondition',
      'You need to offer a Pokémon at the very least')
  }

  const performSwap = (async (room: DbTradeRoom) => {
    const speciesId1 = new Badge(room.host!.offerSpecies!).toLegacyString()
    const speciesId2 = new Badge(room.player!.offerSpecies!).toLegacyString()
    try {
      await db.runTransaction(async t => {
        // FIXME: Update GTS / trade adventure log at some point
        await A.updatePokedex(t._raw, { speciesId: speciesId1, userId: room.host.id })
      })
      await db.runTransaction(async t => {
        await A.updatePokedex(t._raw, { speciesId: speciesId2, userId: room.player!.id })
      })
    } catch (e) {
      console.error('Cannot update adventure log', e)
      }

    return await db.runTransaction(async t => {
      const hostRef = db.collection('users').doc(room.host.id)
      const hostDoc = await t.get<Users.Doc>(hostRef)
      const host = hostDoc.data()
      const playerRef = db.collection('users').doc(room.player!.id)
      const playerDoc = await t.get<Users.Doc>(playerRef)
      const player = playerDoc.data()

      if (!hasPokemon(host, room.host!.offerSpecies!)) {
        throw new functions.https.HttpsError('failed-precondition',
          `[T-HP] Host does not have species ${room.host!.offerSpecies!}`)
      }

      if (!hasPokemon(player, room.player!.offerSpecies!)) {
        throw new functions.https.HttpsError('failed-precondition',
          `[T-HP] Player does not have species ${room.player!.offerSpecies!}`)
      }

      const hostOffer = new Badge(room.host!.offerSpecies!).toString()
      const playerOffer = new Badge(room.player!.offerSpecies!).toString()
      const dataP = swapNoCheck(host, player, room.player!.id, hostOffer, room.host!.offerItem, playerOffer)
      const dataH = swapNoCheck(player, host, room.host.id, playerOffer, room.player!.offerItem, hostOffer);

  
      (host as Users.DbDoc).trainersTraded = FieldValue.increment(1);
      (player as Users.DbDoc).trainersTraded = FieldValue.increment(1);

      host.friendSafari = updateFriendSafari(host.friendSafari || '', room.player!.id)
      player.friendSafari = updateFriendSafari(player.friendSafari || '', room.host!.id)

      t.update<Users.Doc>(hostRef, host)
      t.update<Users.Doc>(playerRef, player)

      // Reset confirmations
      await t.update(roomRef, {
        'host.offerConfirmed': false,
        'player.offerConfirmed': false,
        'host.offerSpecies': null,
        'player.offerSpecies': null,
        'host.offerItem': null,
        'player.offerItem': null,
        trades: FieldValue.increment(1),
      })

      return {
        roomId,
        dataP,
        dataH,
        trade: 'SUCCESS'
      }
    })
  })

  const addGtsEntry = (async (room: DbTradeRoom) => {
    const gtsEntry: GtsEntry = {
      completed: true,
      speciesId: Badge.fromLegacy(room.host.offerSpecies!).toString(),
      lookingForId: Badge.fromLegacy(room.player!.offerSpecies!).toString(),
      timestampInitiated: room.timestamp,
      private: true,
      stale: false,
      user: room.host.id,
      user2: room.player!.id,
      heldItem: room.host.offerItem || undefined,
      lookingForItem: room.player!.offerItem || undefined,
      timestampCompleted: FieldValue.serverTimestamp(),
    }

    await db.collection('gts').add(gtsEntry)
  })

  if (room.host.id === userId) {
    room.host.offerConfirmed = confirmed
    await roomDoc.ref.update<DbTradeRoom>(room)
    if (room.player?.offerConfirmed) {
      try {
        const swap = await performSwap(room)
        await addGtsEntry(room)
        room.host.offerSpecies = null
        room.host.offerItem = null
        room.host.offerConfirmed = false
        room.player.offerSpecies = null
        room.player.offerItem = null
        room.player.offerConfirmed = false
        await roomDoc.ref.update(room)
        return swap
      } catch (e) {
        throw new functions.https.HttpsError('cancelled',
          `Error swapping ${e} 1`)
      }
    }
  } else if (room.player?.id === userId) {
    room.player.offerConfirmed = confirmed
    await roomDoc.ref.update(room)
    if (room.host.offerConfirmed) {
      try {
        const swap = await performSwap(room)
        await addGtsEntry(room)
        room.host.offerSpecies = null
        room.host.offerItem = null
        room.host.offerConfirmed = false
        room.player.offerSpecies = null
        room.player.offerItem = null
        room.player.offerConfirmed = false
        await roomDoc.ref.update(room)
        return swap
      } catch (e) {
        throw new functions.https.HttpsError('cancelled',
          `Error swapping ${e} 2`)
      }
    }
  } else {
    throw new functions.https.HttpsError('failed-precondition', 'Who are you?')
  }

  return {
    roomId,
    trade: 'FAIL',
    // More debug info
  }
})

export const trade_close = functions.https.onCall(async (data: F.TradeClose.Req, context): Promise<F.TradeClose.Res> => {
  const userId = context.auth!.uid
  const {roomId} = data

  const roomDoc = await db.collection('trades').doc(roomId).get<DbTradeRoom>()
  const room = roomDoc.data()
  if (!room.active) {
    throw new functions.https.HttpsError('out-of-range',
      'This room is not available')
  }
  if (room.host.id !== userId) {
    throw new functions.https.HttpsError('failed-precondition',
      'Only the host can close the room')
  }

  room.active = false
  await roomDoc.ref.update<DbTradeRoom>(room)

  return {
    roomId
  }
})
