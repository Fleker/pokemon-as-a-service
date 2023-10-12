import { Users } from "./db-types";
import { BadgeId } from '../../shared/src/pokemon/types'
import {ResearchParams, ACTIVE_RESEARCH} from '../../shared/src/research'

import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import { randomItem } from "./utils";
import { ItemId } from '../../shared/src/items-list';
import { salamander } from "@fleker/salamander";
import { getLocation } from "./location";
import { F } from "../../shared/src/server-types";
// Shim until Node v12: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/fromEntries
const fromEntries = require('object.fromentries');
import { awardItem } from "./users.utils";

const db = salamander(admin.firestore())

function maxQuests(researchCompleted = 0) {
  // As your level increases, you can take on more tasks in parallel
  if (researchCompleted > 180) {
    return 7
  } else if (researchCompleted > 150) {
    return 6
  } else if (researchCompleted > 30) {
    return 5
  }
  return 4
}

export const accomodateResearch = async (
  user: Users.Doc,
  capturedPokemon: BadgeId,
  item: ItemId,
) => {
  const {researchCurrent} = user
  if (!researchCurrent) {
    user.researchCurrent = {} // Empty init
    return user
  }
  const location = await getLocation(user.location)
  if (researchCurrent) {
    Object.keys(researchCurrent).forEach(research => {
      const task = ACTIVE_RESEARCH[research]
      if (!task) return
      const params: ResearchParams = {
        capturedPokemon,
        item,
        location
      }
      if (task.completedStep(params)) {
        user.researchCurrent![research]++
      }
    })
  } else {
    // Copied code
    const researchCurrent = {}
    for (let i = 0; i < maxQuests(user.researchCompleted); i++) {
      const newResearchId = getNewResearch(user, researchCurrent)
      if (newResearchId) {
        researchCurrent[newResearchId] = 0 // Init
      } else {
        throw new functions.https.HttpsError('deadline-exceeded',
          'Cannot get any more tasks for you at this time.')
      }
    }
    user.researchCurrent = researchCurrent
  }
  // Pass-through modifier
  // Put in a transaction
  return user
}

export const research_claim = functions.https.onCall(async (data: F.ResearchClaim.Req, context): Promise<F.ResearchClaim.Res> => {
  if (!context.auth) {
    throw new functions.https.HttpsError('not-found', '')
  }
  const userId = context.auth!.uid
  const {researchId} = data
  const research = ACTIVE_RESEARCH[researchId]
  const res = await db.runTransaction(async t => {
    const userRef = db.collection('users').doc(userId)
    const userDoc = await t.get<Users.Doc>(userRef)
    const user = userDoc.data()
    const {researchLastClaim, researchCurrent} = user
    let {researchCompleted} = user
    if (!researchCurrent) throw new functions.https.HttpsError('failed-precondition',
      'No research')

    console.log(researchId, researchCurrent[researchId])
    if (researchCurrent[researchId] === undefined) {
      throw new functions.https.HttpsError('not-found',
        'You cannot complete a task you do not have')
    }
    if (researchCurrent[researchId] < research.steps) {
      console.error('Less than error', researchId, researchCurrent, research)
      throw new functions.https.HttpsError('invalid-argument',
        `You cannot complete a research task that is not completed ${researchCurrent[researchId]}/${research.steps}`)
    }
    if (researchLastClaim && (Date.now() - researchLastClaim) < 1000 * 60 * 60 /* 1 Hour */) {
      throw new functions.https.HttpsError('out-of-range',
        'Professor Birch is surprised by your enthusiasm. This task can be completed within the hour.')
    }
    // Complete!
    if (researchCompleted) {
      researchCompleted++
    } else {
      researchCompleted = 1
    }

    const prize = randomItem(research.prize)
    awardItem(user, prize)
 
    delete researchCurrent[researchId]
    while (Object.keys(researchCurrent).length < maxQuests(user.researchCompleted)) {
      const newResearchId = getNewResearch(user, researchCurrent)
      if (newResearchId) {
        researchCurrent[newResearchId] = 0 // Init
      } else {
        break; // Exit loop
      }
    }

    await t.update<Users.Doc>(userRef, {
      items: user.items,
      researchCurrent,
      researchCompleted,
      researchLastClaim: Date.now()
    })

    return {
      prize,
      researchCurrent,
      researchCompleted,
      researchLastClaim: Date.now()
    }
  })

  const adventureLog = await db.collection('users').doc(userId)
      .collection('adventureLog').doc('research').get()
  if (!adventureLog.exists) {
    await adventureLog.ref.set({
      [researchId]: [Date.now()]
    })
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any 
    const adventureData: any = adventureLog.data()
    const researchData = adventureData[researchId] as number[]
    if (researchData) {
      researchData.push(Date.now())
    } else {
      adventureData[researchId] = [Date.now()]
    }
    await adventureLog.ref.update(adventureData)
  }

  return res
})

const getNewResearch = (user: Users.Doc, activeResearch: Record<string, number>) => {
  if (activeResearch && Object.keys(activeResearch).length >= maxQuests(user.researchCompleted)) {
    return undefined // Max of 5 tasks at once
  }
  const availableResearch = fromEntries(Object.entries(ACTIVE_RESEARCH).filter(([, val]) => {
    const rc = user.researchCompleted || 0
    return rc >= val.level && val.active
  }))
  const researchId = (() => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const randomId = randomItem(Object.keys(availableResearch))
      if (!activeResearch[randomId]) {
        return randomId // Novel research
      }
    }
  })()
  return researchId as string
}

export const research_get = functions.https.onCall(async (data: F.ResearchGet.Req, context): Promise<F.ResearchGet.Res> => {
  const userId = context.auth!.uid
  const {key} = data || {}
  return await db.runTransaction(async t => {
    const userRef = db.collection('users').doc(userId)
    const userDoc = await t.get<Users.Doc>(userRef)
    const user = userDoc.data()
    let {researchCurrent} = user
    if (researchCurrent) {
      if (key !== undefined) {
        // Delete this entry, then next the function will add a new task.
        delete researchCurrent[key]
      }
      // Keep giving quests to fill out their list right away
      while (Object.keys(researchCurrent).length < maxQuests(user.researchCompleted)) {
        const newResearchId = getNewResearch(user, researchCurrent)
        if (newResearchId) {
          researchCurrent[newResearchId] = 0 // Init
        } else {
          throw new functions.https.HttpsError('deadline-exceeded',
            'Cannot get any more tasks for you at this time.')
        }
      }
    } else {
      researchCurrent = {}
      for (let i = 0; i < maxQuests(user.researchCompleted); i++) {
        const newResearchId = getNewResearch(user, researchCurrent)
        if (newResearchId) {
          researchCurrent[newResearchId] = 0 // Init
        } else {
          throw new functions.https.HttpsError('deadline-exceeded',
            'Cannot get any more tasks for you at this time.')
        }
      }
    }

    await t.update<Users.Doc>(userRef, {
      researchCurrent,
    })

    return {
      researchCurrent,
    }
  })
})
