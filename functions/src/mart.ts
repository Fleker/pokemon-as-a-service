import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { ITEMS, BAZAAR, BAZAAR_CLOSED, BAZAAR_SOLDOUT, ItemId } from '../../shared/src/items-list'
import { getMaxItemsToBuy } from './mart.utils'
import { salamander } from '@fleker/salamander'
import { Users } from './db-types'
import {F} from '../../shared/src/server-types'
import { toRequirements } from './users'
import { Globe } from '../../shared/src/locations-list'

const db = salamander(admin.firestore())

interface CartItem {
  type: ItemId
  count: number
  toss?: boolean
}

function buildCart(data: F.Exchange.Req | F.ExchangeInverse.Req) {
  const batch = (() => {
    if ('type' in data) {
      // Single
      return [data]
    }
    return data.batch
  })()

  for (let i = 0; i < batch.length; i++) {
    const {count} = batch[i]
    if (typeof count === 'string') {
      batch[i].count = parseInt(count)
    }
  }

  return batch as unknown as CartItem[]
}

export const exchange = functions.https.onCall(async (data: F.Exchange.Req, context): Promise<F.Exchange.Res> => {
  if (!context.auth) {
    throw new functions.https.HttpsError('not-found', '')
  }
  const userId = context.auth!.uid

  const batch = buildCart(data)

  return await db.runTransaction(async t => {
    const ref = db.collection('users').doc(userId)
    const doc = await t.get<Users.Doc>(ref)
    if (!doc.exists) {
      throw new functions.https.HttpsError('invalid-argument',
        'User does not exist')
    }

    const {items} = doc.data()
    if (!items.pokeball) {
      throw new functions.https.HttpsError('not-found',
        'No pokeballs found')
    }

    for (const cartItem of batch) {
      const {type, count} = cartItem
      if (!Number.isInteger(count)) {
        throw new functions.https.HttpsError('failed-precondition',
          `You cannot do this`)
      }
    
      if (!ITEMS[type]) {
        throw new functions.https.HttpsError('invalid-argument',
          'Exchange rate is invalid')
      }
    
      if (ITEMS[type].buy <= 0) {
        throw new functions.https.HttpsError('invalid-argument',
          'You cannot buy this item')
      }
    
      if (count < 0) {
        throw new functions.https.HttpsError('invalid-argument',
          'Nice try')
      }

      if (items.pokeball >= ITEMS[type].buy * count) {
        items.pokeball -= ITEMS[type].buy * count
        if (items[type] === undefined) {
          items[type] = count
        } else {
          items[type]! += count
        }
        // Get a free Premier Ball if you buy 10+ balls
        if (ITEMS[type].category === 'balls' && count >= 10) {
          const premier = Math.floor(count / 10)
          if (!items.premierball) {
            items.premierball = premier
          } else {
            items.premierball += premier
          }
        }
      } else {
        console.error('Need more Poké Balls')
        throw new functions.https.HttpsError('out-of-range',
          'Need more Poké Balls')
      }
    }

    await t.update<Users.Doc>(ref, { items })
    return {
      purchased: batch[0].type,
      premier: items.premierball,
      count: batch[0].count,
      price: ITEMS[batch[0].type].buy * batch[0].count,
      html: 'Exchanged',
      batch,
    }
  })
});

// Exchange in certain circumstances
export const exchange_bazaar = functions.https.onCall(async (data: F.ExchangeBazaar.Req, context): Promise<F.ExchangeBazaar.Res> => {
  if (!context.auth) {
    throw new functions.https.HttpsError('not-found', '')
  }
  const userId = context.auth!.uid
  const {type, bazaarId} = data
  let count = (() => {
    if (typeof data.count === 'string') {
      return parseInt(data.count)
    }
    return data.count
  })()
  if (!Number.isInteger(count)) {
    throw new functions.https.HttpsError('failed-precondition',
      `You cannot do this`)
  }

  if (!ITEMS[type] || !BAZAAR[bazaarId]) {
    throw new functions.https.HttpsError('invalid-argument',
      'Exchange rate is invalid')
  }

  const {currency, maxItems} = BAZAAR[bazaarId]

  const {rate} = BAZAAR[bazaarId].items.filter(item => item.name === type)[0]
  if (rate <= 0) {
    throw new functions.https.HttpsError('invalid-argument',
      `You cannot buy this item, rate of ${rate}`)
  }

  if (count < 0) {
    throw new functions.https.HttpsError('invalid-argument',
      'Nice try')
  }

  return await db.runTransaction(async t => {
    const ref = db.collection('users').doc(userId)
    const doc = await t.get<Users.Doc>(ref)
    if (!doc.exists) {
      throw new functions.https.HttpsError('invalid-argument',
        'User does not exist')
    }

    const {items} = doc.data()!

    const requirements = toRequirements(doc.data(), Globe[doc.data().location])
    const openState = BAZAAR[bazaarId].isOpen(Date.now(), items as Record<string, number>, requirements)
    if (openState === BAZAAR_CLOSED) {
      throw new functions.https.HttpsError('invalid-argument',
        'This stall has closed')
    }

    if (openState === BAZAAR_SOLDOUT) {
      throw new functions.https.HttpsError('invalid-argument',
        'This stall has sold all of its goods')
    }

    if (maxItems && (items[type] ?? 0) >= maxItems) {
      throw new functions.https.HttpsError('invalid-argument',
        `There are no more ${type} for sale`)
    }

    count = getMaxItemsToBuy(items, type, count, maxItems)
    if (!items[currency]) throw new functions.https.HttpsError('not-found',
      'No currency found')
    if (items[currency]! >= rate * count) {
      items[currency]! -= rate * count
      if (!items[type]) {
        items[type] = count
      } else {
        items[type]! += count
      }

      await t.update<Users.Doc>(ref, { items })
      return {
        purchased: type,
        count,
        price: rate * count,
        html: 'Exchanged'
      }
    } else {
      console.error(`Need more ${currency}`)
      throw new functions.https.HttpsError('out-of-range',
        `Need more ${currency}`)
    }
  })
});

export const exchange_inverse = functions.https.onCall(async (data: F.ExchangeInverse.Req, context): Promise<F.ExchangeInverse.Res> => {
  if (!context.auth) {
    throw new functions.https.HttpsError('not-found', '')
  }
  const userId = context.auth!.uid

  const batch = buildCart(data)

  return await db.runTransaction(async t => {
    const ref = db.collection('users').doc(userId)
    const doc = await t.get<Users.Doc>(ref)
    if (!doc.exists) {
      throw new functions.https.HttpsError('invalid-argument',
        'User does not exist')
    }

    const {items} = doc.data()

    for (const cartItem of batch) {
      const {count, type, toss} = cartItem
      if (!Number.isInteger(count)) {
        throw new functions.https.HttpsError('failed-precondition',
          `You cannot do this`)
      }

      if (!ITEMS[type]) {
        throw new functions.https.HttpsError('invalid-argument',
          'Exchange rate is invalid')
      }

      // If `toss` is true for item, then you'll just sell at a rate of 0
      if (ITEMS[type].sell <= 0 && !toss) {
        throw new functions.https.HttpsError('invalid-argument',
          'You cannot sell this item')
      }

      if (count < 0) {
        throw new functions.https.HttpsError('invalid-argument',
          'Nice try')
      }

      if (items[type]! >= count) {
        items[type]! -= count;
        if (!items.pokeball) {
          items.pokeball = ITEMS[type].sell * count
        } else {
          items.pokeball += ITEMS[type].sell * count
        }
      } else {
        console.error('Need more items')
        throw new functions.https.HttpsError('out-of-range',
          `Need more items of type ${type}`)
      }
    }

    await t.update<Users.Doc>(ref, { items })
    return {
      sold: batch[0].type,
      pokeball: items.pokeball,
      count: batch[0].count,
      price: ITEMS[batch[0].type].sell * batch[0].count,
      html: 'Exchanged',
      batch,
    }
  })
})
