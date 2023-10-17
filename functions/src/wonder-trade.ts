import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { salamander } from '@fleker/salamander';
import {Badge} from '../../shared/src/badge3'
import {F, WonderTradeEntry, WonderTradeStatus} from '../../shared/src/server-types'
import { removePokemon } from './users.utils';
import { swapNoCheck } from './gts.utils';
import {Users} from './db-types'
import {Notification, sendNotification} from './notifications'
import * as Sprite from '../../shared/src/sprites'
const db = salamander(admin.firestore())
const FieldValue = admin.firestore.FieldValue;
/**
 * Shuffles input array.
 * See https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
 */
function shuffle<T>(array: T[]) {
  let currentIndex = array.length, randomIndex;
  // While there remain elements to shuffle.
  while (currentIndex > 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}
function checkWonderTradeTimer(lastWonderTrade?: number) {
  if (!lastWonderTrade) return true
  const now = Date.now()
  if (now - lastWonderTrade < 1000 * 60 * 60 * 23) {
    return true
  }
  return false
}
export const wonder_trade_upload = functions.https.onCall(async (data: F.WonderTradeUpload.Req, context): Promise<F.WonderTradeUpload.Res> => {
  const userId = context.auth!.uid
  const {species} = data
  const badge = new Badge(species)
  if (badge.defaultTags?.includes('FAVORITE')) {
    throw new functions.https.HttpsError('failed-precondition',
      'You cannot trade a favorite Pokemon.')
  }
  // Verify whether user already has a wonder trade entry
  const alreadyWonderTrading = await db.collection('wonderTrades')
    .where('userId', '==', userId)
    .where('state', '==', WonderTradeStatus.ACTIVE)
    .get<WonderTradeEntry>()
  if (alreadyWonderTrading.docs.length) {
    throw new functions.https.HttpsError('failed-precondition',
      'You can only use Wonder Trade once at a time')
  }
  // Verify whether user is out of the wonder trade time window
  const userDoc = await db.collection('users').doc(userId).get<Users.Doc>()
  const user = userDoc.data()
  if (!checkWonderTradeTimer(user.lastWonderTrade)) {
    throw new functions.https.HttpsError('failed-precondition',
      'You can only use Wonder Trade once a day')
  }
  // Create entry
  const entry: WonderTradeEntry = {
    userId,
    species,
    timestamp: Date.now(),
    state: WonderTradeStatus.ACTIVE,
  }
  // Post entry
  await db.collection('wonderTrades').add(entry)
  await db.runTransaction(async t => {
    const userRef = db.collection('users').doc(userId)
    const userDoc = await t.get<Users.Doc>(userRef)
    const user = userDoc.data()
    // Remove this Pokemon from user collection
    removePokemon(user, badge)
  
    // Update user doc
    await t.update<Users.Doc>(userRef, {
      lastWonderTrade: Date.now(),
      pokemon: user.pokemon,
    })
  })
  return {
    ok: 'ok'
  }
})
/** Run cron to shuffle and execute wonder trades at the 30th minute every eight hours */
export const wonder_trade_cron = functions.pubsub.schedule('30 */8 * * *').onRun(async () => {
  // Start by collecting all of our trades
  const activeTrades = await db.collection('wonderTrades')
    .where('state', '==', WonderTradeStatus.ACTIVE)
    .get<WonderTradeEntry>()
  // Shuffle all of these
  const tradesToComplete = activeTrades.docs
  console.log(`Wonder Trade start for ${tradesToComplete.length} trades`)
  shuffle(tradesToComplete)
  // Execute trades two at a time.
  // This may mean one trade is left out. It'll get picked up next time.
  // It is possible that this trade may never execute if it's just super
  // unlucky.
  for (let i = 0; i < tradesToComplete.length; i += 2) {
    if (tradesToComplete[i] && tradesToComplete[i + 1]) {
      await db.runTransaction(async t => {
        const tradeA = tradesToComplete[i].data()
        const tradeB = tradesToComplete[i + 1].data()
        const refA = db.collection('users').doc(tradeA.userId)
        const refB = db.collection('users').doc(tradeB.userId)
        const playerADoc = await t.get<Users.Doc>(refA)
        const playerBDoc = await t.get<Users.Doc>(refB)
        const playerA = playerADoc.data()
        const playerB = playerBDoc.data()
        const badgeA = new Badge(tradeA.species)
        const badgeB = new Badge(tradeB.species)
        console.log(`Swap:`)
        console.log(`    ${tradesToComplete[i].id} & ${tradesToComplete[i+1].id}`)
        console.log(`    ${tradeA.species} & ${tradeB.species}`)
        swapNoCheck(playerA, playerB, tradeB.userId, tradeA.species, null, tradeB.species, false)
        swapNoCheck(playerB, playerA, tradeA.userId, tradeB.species, null, tradeA.species, false)
        // Create notifications
        const notificationA: Notification = {
          category: 'GTS_COMPLETE',
          title: `Your ${badgeA.toLabel()} was traded to a random trainer`,
          body: `You said good-bye to your ${badgeA.toLabel()}. You have received a ${badgeB.toLabel()}`,
          link: '/multiplayer/wonder',
          icon: Sprite.pkmn(badgeA.toSprite())
        }
        const notificationB: Notification = {
          category: 'GTS_COMPLETE',
          title: `Your ${badgeB.toLabel()} was traded to a random trainer`,
          body: `You said good-bye to your ${badgeB.toLabel()}. You have received a ${badgeA.toLabel()}`,
          link: '/multiplayer/wonder',
          icon: Sprite.pkmn(badgeB.toSprite())
        }
        try {
          console.log('    Send notifications to players')
          await sendNotification(playerA, notificationA)
          await sendNotification(playerB, notificationB)
        } catch (e) {
          console.error('Could not send notifications', e)
        }
        t.update<Users.DbDoc>(refA, {
          wonderTradeCount: FieldValue.increment(1),
          pokemon: playerA.pokemon,
          notifications: playerA.notifications,
        })
        
        t.update<Users.DbDoc>(refB, {
          wonderTradeCount: FieldValue.increment(1),
          pokemon: playerB.pokemon,
          notifications: playerB.notifications,
        })
        console.log('    Update player docs')
      })
      // Assume transaction succeeded, discard these trades
      console.log('    Mark trades as completed')
      await tradesToComplete[i].ref.update({
        status: WonderTradeStatus.COMPLETED,
      })
      await tradesToComplete[i + 1].ref.update({
        status: WonderTradeStatus.COMPLETED,
      })
    }
  }
  console.log('Wonder trade operation complete')
  return `Wonder trade: ${tradesToComplete.length}`
})
