import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { LEGENDARY_ITEM_QUESTS } from './../../shared/src/quests'
import { HiddenItemDoc, Users } from './db-types';
import { FieldValue } from '@google-cloud/firestore';
import { calculateNetWorth } from './users.utils'
import {salamander, SalamanderRef} from '@fleker/salamander'
import { RuntimeOptions } from 'firebase-functions';
import { optionallyRecycle } from './recycler';
import { getAllPokemon } from '../../shared/src/badge-inflate';
import { sendNotification } from './notifications';
import { isBerryHarvestable, parsePlot } from '../../shared/src/farming';
import { aboutInfo } from './vendor/example-tasks'

const db = salamander(admin.firestore())

// Run every Wednesday
const adminDispenseCron = {
  timeoutSeconds: 540,
  memory: '1GB'
} as RuntimeOptions
export const admin_dispense_cron = functions.runWith(adminDispenseCron).pubsub.schedule('0 0 */1 * 3').onRun(async () => {
  // Function has 1 GB memory, so can hold a limited number of users at a time
  await forEveryUser(['items.pokeball', '<', 200], async (_, ref) => {
    try {
      await db.runTransaction(async t => {
        const doc = await t.get<Users.Doc>(ref)
        const user = doc.data()
        t.update<Users.DbDoc>(ref, {
          'items.pokeball': FieldValue.increment(5),
        })
        if (calculateNetWorth(user) < 1000) {
          // Additional booster for new players
          t.update<Users.DbDoc>(ref, {
            'items.greatball': FieldValue.increment(3)
          })
        }
        if (calculateNetWorth(user) < 100) {
          // Additional booster for new players
          t.update<Users.DbDoc>(ref, {
            'items.ultraball': FieldValue.increment(3)
          })
        }
        sendNotification(user, {
          category: 'ITEM_DISPENSE',
          title: "Here are some PokéBalls on the house.",
          body: 'You can use these to catch more Pokémon.',
          link: '',
          icon: 'images/sprites/items/potw-item-pokeball.png',
        })
        t.update<Users.Doc>(ref, {
          notifications: user.notifications,
        })
      })
    } catch (e) {
      console.error(`Cannot dispense user ${_.ldap}: ${e}`)
    }
  })
  await db.collection('admin').doc('cron').update({
    adminDispenseCron: Date.now()
  })
  return 'Dispensed Poké Balls'
})

// Run the first day of each month
const adminRecycleLegendariesCron = {
  timeoutSeconds: 540,
  memory: '2GB'
} as RuntimeOptions
export const admin_recycle_legendaries_cron = functions.runWith(adminRecycleLegendariesCron)
    .pubsub.schedule('0 0 1 */1 *').onRun(async () => {

  let recycles = 0

  await forEveryUser(async (user, ref) => {
    const {ldap} = user
    let {hiddenItemsFound} = user
    const {items} = user
    if (!hiddenItemsFound) return;
    const recycleRes = optionallyRecycle(hiddenItemsFound, getAllPokemon(user), items)
    hiddenItemsFound = recycleRes.hiddenItemsFound
    const needsUpdate = recycleRes.needsUpdate

    // FIXME: It makes little sense to run this query twice,
    // but it allow for data consistency
    if (needsUpdate) {
      try {
        console.info(`Ref ${ref.id} (${ldap}) needs update`)
        console.log('    - fetch')
        const userDoc = await ref.get<Users.Doc>()
        const recycleRes = optionallyRecycle(hiddenItemsFound, getAllPokemon(userDoc.data()), items)
        console.log('    - get hif')
        await ref.update<Users.Doc>({
          hiddenItemsFound: recycleRes.hiddenItemsFound
        })
        console.log('    - complete update')
        // await db.runTransaction(async t => {
        //   console.log('    - fetch')
        //   const userDoc = await t.get<Users.Doc>(ref)
        //   const recycleRes = optionallyRecycle(hiddenItemsFound, getAllPokemon(userDoc.data()), items)
        //   console.log('    - get hif')
        //   await ref.update<Users.Doc>({
        //     hiddenItemsFound: recycleRes.hiddenItemsFound
        //   })
        //   console.log('    - complete update')
        // })
      } catch (e) {
        console.error(`Cannot recycle for ${ldap}: ${e}`)
      }
      console.info(`Ref ${ref.id} (${ldap}) updated`)
      recycles++
    }
  })
  
  console.log(`OK, recycled for ${recycles} users`)
  await db.collection('admin').doc('cron').update({
    adminRecycleLegendariesCron: Date.now()
  })
  return `OK, recycled for ${recycles} users`
})

// Run every Wednesday
const adminForbesCronRuntime = {
  timeoutSeconds: 540,
  memory: '1GB'
} as RuntimeOptions
export const admin_forbes_cron = functions.runWith(adminForbesCronRuntime)
    .pubsub.schedule('0 0 * * 3').onRun(async() => {
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const priceList: any[] = []
  await forEveryUser((user, ref) => {
    const {ldap, items} = user
    if (!items) return
    const netWorth = calculateNetWorth(user)
    priceList.push({ldap, netWorth, id: ref.id})
  })

  // Sort to get the wealthiest
  const sortedList = priceList.sort((a, b) => {
    return b.netWorth - a.netWorth
  })
  const topTen = sortedList.slice(0, 10)

  await db.collection('test').doc('forbes').set({
    peeps: topTen
  })

  await db.collection('admin').doc('cron').update({
    adminForbesCron: Date.now()
  })
  return sortedList.slice(0, 10)
})

// Run every Wednesday
export const admin_hidden_id_cleanup = functions.pubsub.schedule('0 0 * * 3').onRun(async() => {
  // This function will read in every hidden ID for every user. It will see if that ID should
  // be archived (mystery != true || active != true) and will remove from the user's main doc
  // to an adventure log
  const archiveHiddenItem: {[id: string]: boolean} = {}
  const legendaryQuests = LEGENDARY_ITEM_QUESTS.map(q => q.docId)
  let bytesSaved = 0
  
  await forEveryUser(async (user, ref) => {
    const {hiddenItemsFound} = user
    if (!hiddenItemsFound) return
    const hiddenItemsArchive: string[] = []
    for (let i = hiddenItemsFound.length - 1; i >= 0; i--) {
      const hiddenItem = hiddenItemsFound[i]
      if (!(hiddenItem in archiveHiddenItem)) {
        const hiddenItemDoc = await db.collection('hiddenItems').doc(hiddenItem).get<HiddenItemDoc>()
        if (hiddenItemDoc.exists) {
          const hiddenItemData = hiddenItemDoc.data()
          archiveHiddenItem[hiddenItem] = !hiddenItemData.active && !hiddenItemData.mystery
          console.log(hiddenItem, archiveHiddenItem[hiddenItem])
        } else if (legendaryQuests.includes(hiddenItem)) {
          // Do nothing
          archiveHiddenItem[hiddenItem] = false // Just in case
          console.log(hiddenItem, 'legendary')
        } else {
          archiveHiddenItem[hiddenItem] = false // Just in case
          console.log(hiddenItem, 'misc')
        }
      }
      // console.log(hiddenItem, 'Archive Decision', archiveHiddenItem[hiddenItem])
      if (archiveHiddenItem[hiddenItem]) {
        hiddenItemsArchive.push(hiddenItem)
        hiddenItemsFound.splice(hiddenItemsFound.indexOf(hiddenItem), 1)
      }
    }

    if (hiddenItemsArchive.length > 0) {
      await db.runTransaction(async (transaction) => {
        const alRef = ref
          .collection('adventureLog')
          .doc('hiddenItemsFound')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const adventureLog = await transaction.get<any>(alRef)

        user.hiddenItemsFound = hiddenItemsFound
        await transaction.update(ref, { hiddenItemsFound })
        const createNewAdventureLog = !adventureLog.exists 
            || adventureLog.data().hiddenItemsFound.length === 0
        // Post into adventure log
        if (createNewAdventureLog) {
          // Set
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await transaction.set<any>(alRef, {
            hiddenItemsFound: hiddenItemsArchive
          })
        } else {
          // Update
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await transaction.update<any>(alRef, {
            hiddenItemsFound: FieldValue.arrayUnion(...hiddenItemsArchive)
          })
        }
      })
      const bytes = hiddenItemsArchive.length * 28 // 1 char ~~ 1 bytes
      console.log(`Archived ${hiddenItemsArchive.length} items for ${user.ldap}@, saving ${bytes} B`)
      bytesSaved += bytes
    }
  })
  const res = `Hidden Item cleanup finished for the week, saving a net ${bytesSaved} bytes`
  console.log(res)
  await db.collection('admin').doc('cron').update({
    adminHiddenIdCleanup: Date.now()
  })
  return res
})

export const about_info = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('not-found', '')
  }
  const {uid} = context.auth!
  if (!uid) {
    throw new functions.https.HttpsError('not-found', '')
  }

  return aboutInfo
})

type IterativeCallback = (user: Users.Doc, ref: SalamanderRef) => void

/**
 * Run a set of behavior on all users in an iterative approach.
 * This cuts down on in-memory at any given time, as only 300 are acted upon.
 *
 * @param callback Logic to run on a subset of users
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function forEveryUser(callback: IterativeCallback | any[], altCallback?: IterativeCallback) {
  const rdb = db._raw
  const LIMIT = 150
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const query = (() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q = rdb.collection('users') as any
      if (Array.isArray(callback)) {
        // Limit our query before advancing
        q = q.where(callback[0], callback[1], callback[2])
      }
      if (lastDoc!) {
        console.log('New iteration: start after', lastDoc!.id)
        return q
          // .orderBy('ldap')

          .startAfter(lastDoc!)
          .limit(LIMIT)
      } else {
        return q
        .limit(LIMIT)
      }
    })()

    const querySnapshot = await query.get()
    // Update token
    lastDoc = querySnapshot.docs[querySnapshot.docs.length-1];

    for (let i = 0; i < querySnapshot.size; i++) {
      const doc = querySnapshot.docs[i]
      // console.log(doc.id);
      if (doc.id.indexOf('npc') > -1) {
          // This is a virtual user, mostly used for testing and GTS
          continue;
      }
      if (Array.isArray(callback)) {
        await altCallback!(doc.data() as Users.Doc, new SalamanderRef(doc.ref))
      } else {
        await callback(doc.data() as Users.Doc, new SalamanderRef(doc.ref))
      }
    }

    if (querySnapshot.docs.length < LIMIT) {
      break // Exit loop once we've iterated through everyone
    }
  }
}

// Run every Wednesday
const adminNotifyCron = {
  timeoutSeconds: 540,
  memory: '1GB'
} as RuntimeOptions
// Fifteen past every hour
export const admin_notify_cron = functions.runWith(adminNotifyCron).pubsub.schedule('15 */1 * * *').onRun(async () => {
  // Notify when berries are ready
  await forEveryUser(['berryPlots', '>', 0], async (_, ref) => {
    try {
      await db.runTransaction(async t => {
        const doc = await t.get<Users.Doc>(ref)
        const user = doc.data()
        // Only send an explicit notification if not already
        // This means a notification might be outdated by the time the user
        // takes action on it.
        // Right now, as `sendNotification` does both in-app and FCM
        // notifications, we cannot update a notification.
        if (!user.berryPlanted) return
        const hasFarmNotification = user.notifications?.find(n => n.link === '/base/farm')
        if (hasFarmNotification) return
        let plotsReady = 0
        let firstBerry
        user.berryPlanted?.forEach(bp => {
          const parsedPlot = parsePlot(bp)
          if (!parsedPlot) return
          if (!firstBerry) {
            firstBerry = parsedPlot.item
          }
          if (isBerryHarvestable(parsedPlot.item, parsedPlot.harvest, parsedPlot.fertilizer)) {
            plotsReady++
          }
        })
        if (plotsReady === 0) return
        const plotTitle = (() => {
          if (plotsReady === 1) {
            return `is one berry plot`
          }
          return `are ${plotsReady} berry plots`
        })()
        sendNotification(user, {
          category: 'PLAYER_EVENT',
          title: `There ${plotTitle} ready to harvest`,
          body: 'Visit your Berry Farm and see what you have collected.',
          link: '/base/farm',
          icon: `images/sprites/berries/${firstBerry}.png`,
        })
        t.update<Users.Doc>(ref, {
          notifications: user.notifications,
        })
      })
    } catch (e) {
      console.error(`Cannot read user ${_.ldap}: ${e}`)
    }
  })

  // Notify when eggs are ready
  // Cannot query whether there are eggs actively laid
  // (see https://stackoverflow.com/questions/55287819/query-firebase-for-documents-that-contain-an-array-of-length-0)
  // but we can limit to at least anyone who has ever had an egg.
  await forEveryUser(['eggsLaid', '>', 0], async (_, ref) => {
    try {
      await db.runTransaction(async t => {
        const doc = await t.get<Users.Doc>(ref)
        const user = doc.data()
        if (!user.eggs || user.eggs.length === 0) return
        // Only send an explicit notification if not already
        // This means a notification might be outdated by the time the user
        // takes action on it.
        // Right now, as `sendNotification` does both in-app and FCM
        // notifications, we cannot update a notification.
        const hasEggNotification = user.notifications?.find(n => n.link === '/pokemon/eggs')
        if (hasEggNotification) return
        const countHatching = user.eggs.filter(egg => {
          // Don't support `egg.laid`
          if (egg.hatch) {
            return Math.floor((Date.now()/1000)) > egg.hatch
          }
          return false
        }).length
        if (countHatching === 0) return
        const eggTitle = (() => {
          if (countHatching === 1) {
            return `is one egg`
          }
          return `are ${countHatching} eggs`
        })()
        sendNotification(user, {
          category: 'PLAYER_EVENT',
          title: `There ${eggTitle} ready to hatch`,
          body: 'Visit your Eggs page and be ready to welcome them.',
          link: '/pokemon/eggs',
          // Generic egg icon, won't change for Phione-only action
          icon: `images/sprites/potw-egg-g2.png`,
        })
        t.update<Users.Doc>(ref, {
          notifications: user.notifications,
        })
      })
    } catch (e) {
      console.error(`Cannot read user ${_.ldap}: ${e}`)
    }
  })
  await db.collection('admin').doc('cron').update({
    adminNotifyCron: Date.now()
  })
  return 'Notified users of in-game actions'
})

