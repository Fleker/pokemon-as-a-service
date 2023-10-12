import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { Users } from './db-types'
import {Berry, ITEMS, ItemId, BerryId, FertilizerId } from '../../shared/src/items-list'
import { addPokemon, awardItem, hasItem } from './users.utils'
import { Badge } from '../../shared/src/badge3'
import { randomItem } from './utils'
import {getTotalPlots, parsePlot, getNextPlotCost, isBerryHarvestable, isEmptyPlot, getYield, encounterRate, fertilizerMutation, getFertilizerPokemon} from '../../shared/src/farming'
import { salamander } from '@fleker/salamander'
import { shinyRate } from './platform/game-config'
import { F, BerryPlot } from '../../shared/src/server-types'
import { accomodateResearch } from './research-quests'
import { FOSSILS } from '../../shared/src/prizes'

const db = salamander(admin.firestore())
const FieldValue = admin.firestore.FieldValue;

interface BerryEntry {
  item: BerryId,
  harvest: number,
  fertilizer: FertilizerId
}

export function isMutationPossible(berries: (BerryEntry | undefined)[]): BerryId | boolean {
  const [l, c, r] = berries
  const pairings = [[l, c], [c, l], [c, r], [r, c]]
  for (const pairing of pairings) {
    if (pairing[0]?.item === 'iapapa' && pairing[1]?.item === 'mago') {
      return 'pomeg'
    }
    if (pairing[0]?.item === 'chesto' && pairing[1]?.item === 'persim') {
      return 'kelpsy'
    }
    if (pairing[0]?.item === 'oran' && pairing[1]?.item === 'pecha') {
      return 'qualot'
    }
    if (pairing[0]?.item === 'aspear' && pairing[1]?.item === 'leppa') {
      return 'hondew'
    }
    if (pairing[0]?.item === 'aguav' && pairing[1]?.item === 'figy') {
      return 'grepa'
    }
    if (pairing[0]?.item === 'lum' && pairing[1]?.item === 'sitrus') {
      return 'tamato'
    }
    if (pairing[0]?.item === 'hondew' && pairing[1]?.item === 'yache') {
      return 'liechi'
    }
    if (pairing[0]?.item === 'qualot' && pairing[1]?.item === 'tanga') {
      return 'ganlon'
    }
    if (pairing[0]?.item === 'grepa' && pairing[1]?.item === 'roseli') {
      return 'salac'
    }
    if (pairing[0]?.item === 'pomeg' && pairing[1]?.item === 'kasib') {
      return 'petaya'
    }
    if (pairing[0]?.item === 'kelpsy' && pairing[1]?.item === 'wacan') {
      return 'apicot'
    }
    if (pairing[0]?.item === 'ganlon' && pairing[1]?.item === 'liechi') {
      return 'kee'
    }
    if (pairing[0]?.item === 'salac' && pairing[1]?.item === 'petaya') {
      return 'maranga'
    }
  }

  // No mutation possible
  return false
}

export function mutateBerry(left: BerryPlot, berry: BerryPlot, right: BerryPlot) {
  const bLeft = parsePlot(left || berry)
  const bCenter = parsePlot(berry)!
  const bRight = parsePlot(right || berry)
  const mutation = isMutationPossible([bLeft, bCenter, bRight])
  const mutationMult = fertilizerMutation[bCenter.fertilizer || 'oran']
  if (mutation && Math.random() < 0.05 * mutationMult) {
    return mutation
  }
  return bCenter.item 
}

/**
 * Occur 3x in the items pool to increase odds of one of these being selected.
 */
const commonWeeds: ItemId[] = [
  // Interesting items
  'tinymushroom', 'bigmushroom', 'absorbbulb', 'miracleseed',
  'healthwing', 'musclewing', 'resistwing', 'geniuswing', 'cleverwing', 'swiftwing',
  'powerherb', 'whiteherb', 'mentalherb', 'luminousmoss', 'bigroot',
  // Terrain seeds
  'electricseed', 'grassyseed', 'psychicseed', 'mistyseed',
  // Crafting materials
  'casterfern', 'direshroom', 'sootfootroot', 'heartygrains', 'swordcap',
  'plumpbeans', 'springymushroom', 'sandradish', 'kingsleaf',
  // Frustration plants
  'energyroot', 'revivalherb',
]

/**
 * Occur 1x in the items pool.
 */
const rareWeeds: ItemId[] = [
  ...FOSSILS,
  /*'tartapple', 'sweetapple',*/ /*'galaricatwig',*/
]

/**
 * The canonical pool of what you may get from picking berries.
 */
const weeds: ItemId[] = [
  ...commonWeeds,
  ...commonWeeds,
  ...commonWeeds,
  ...rareWeeds,
]

const EXTRA_ITEM_ODDS = 0.075

export const berry_plot = functions.https.onCall(async (data, context) => {
  const userId = context.auth!.uid
  const plots = await db.runTransaction(async t => {
    const userRef = db.collection('users').doc(userId)
    const userDoc = await t.get<Users.Doc>(userRef)
    // TODO: Check user precondition
    const user = userDoc.data()
    const cost = getNextPlotCost(user.berryPlots)
    if (!hasItem(user, 'pokeball', cost)) {
      throw new functions.https.HttpsError('failed-precondition',
        `You need ${cost} Poké Balls`)
    }
    const {items} = user
    let {berryPlots} = user
    if (!berryPlots) {
      berryPlots = 0
    }
    berryPlots++
    items.pokeball! -= cost
    await t.update(userRef, { items, berryPlots })
    return berryPlots
  })
  return {
    plots: 6 * plots
  }
})

export const berry_plant = functions.https.onCall(async (data: F.BerryPlant.Req, context): Promise<F.BerryPlant.Res> => {
  const userId = context.auth!.uid
  const dataBerry = (() => {
    if (Array.isArray(data.berry)) return data.berry
    return [data.berry]
  })()
  const dataIndex = (() => {
    if (Array.isArray(data.index)) return data.index
    return [data.index]
  })()
  for (let i = 0; i < dataBerry.length; i++) {
    const db = dataBerry[i]
    const di = dataIndex[i]
    const berry = ITEMS[db] as Berry
    if (!berry?.yield) {
      throw new functions.https.HttpsError('failed-precondition',
        `What is a ${db}?`)
    }
    if (di === null || di === undefined) {
      throw new functions.https.HttpsError('data-loss',
        `Index ${di} is invalid`)
    }
  }
  const args = await db.runTransaction(async t => {
    const userRef = db.collection('users').doc(userId)
    const userDoc = await t.get<Users.Doc>(userRef)
    const user = userDoc.data()
    const {items} = user
    const plots = getTotalPlots(user.berryPlots)
    if (!user.berryPlanted) {
      user.berryPlanted = Array(plots).fill({})
    }
    for (let i = 0; i < dataBerry.length; i++) {
      const db = dataBerry[i]
      const di = dataIndex[i]
      if (data.index < 0) {
        throw new functions.https.HttpsError('failed-precondition',
          `Cannot write to plot ${di}`)
      }
      if (!isEmptyPlot(user.berryPlanted[di])) {
        throw new functions.https.HttpsError('failed-precondition',
          `A berry is already planted at index ${di}`)
      }
      
      if (plots <= di) {
        throw new functions.https.HttpsError('failed-precondition',
          `Cannnot write to plot ${di}`)
      }
      if (!hasItem(user, db)) {
        throw new functions.https.HttpsError('failed-precondition',
          `You do not have item ${db}`)
      }
      // Apply data
      items[db]!--
      user.berryPlanted[di] = {
        [db]: Date.now()
      }
    }
    console.debug(user.berryPlanted)
    await t.update(userRef, { items, berryPlanted: user.berryPlanted })
    return {
      berry: data.berry,
      berryPlanted: user.berryPlanted,
    }
  })
  return args
})

export const berry_harvest = functions.https.onCall(async (data: F.BerryHarvest.Req, context) => {
  const userId = context.auth!.uid
  const dataIndex = (() => {
    if (Array.isArray(data.index)) return data.index
    return [data.index]
  })()
  const args = await db.runTransaction(async t => {
    const userRef = db.collection('users').doc(userId)
    const userDoc = await t.get<Users.Doc>(userRef)
    const user = userDoc.data()
    const {berryPlanted} = user
    let {researchCurrent} = user

    const res: F.BerryHarvest.Res = {
      badge: [],
      berry: [],
      berryYield: [],
      species: [],
      weed: [],
    }

    for (const index of dataIndex) {
      if (isEmptyPlot(berryPlanted![index])) {
        throw new functions.https.HttpsError('failed-precondition', `No berry plot at index ${index}`)
      }
      const entries = Object.entries(berryPlanted![index]!)
      // Parse entry
      let berry, harvest, fertilizer
      for (const entry of entries) {
        if (entry[0] === 'fertilizer') {
          fertilizer = entry[1]
        } else {
          berry = entry[0]
          harvest = entry[1]
        }
      }
      // Verify entry
      const ready = isBerryHarvestable(berry, harvest, fertilizer)
      if (!ready) {
        throw new functions.https.HttpsError('out-of-range', `${berry} is not ready to harvest`)
      }
      const berryMeta = ITEMS[berry] as Berry

      berry = mutateBerry(
        berryPlanted![index - 1]!,
        berryPlanted![index]!,
        berryPlanted![index + 1]!
      )
      // Check on wild Pokémon
      const willEncounter = (Math.random() / 1.5) < encounterRate(user.berryPlots)
      let badge: Badge | undefined
      if (willEncounter) {
        console.log('Will create an encounter')
        badge = getFertilizerPokemon(fertilizer)
        if (badge) {
          console.log('Got badge', badge)
          if (badge) {
            if (Math.random() < shinyRate('farm', user.hiddenItemsFound)) {
              badge.personality.shiny = true
              console.log('Is shiny', badge)
            }
            badge.personality.location = user.location
            addPokemon(user, badge)
            researchCurrent = (await accomodateResearch(user, badge.toLegacyString(), 'pokeball')).researchCurrent
          }
        }
      }
      // Update bag
      const berryYield = getYield(berryMeta, fertilizer)
      awardItem(user, berry, berryYield)
      let weed
      if (Math.random() < EXTRA_ITEM_ODDS) {
        weed = randomItem(weeds)
        awardItem(user, weed)
      }
      // Remove array entry
      berryPlanted![index]! = {}
      if (badge) {
        res.badge.push(badge.toLegacyString())
        res.species.push(badge.toString())
      }
      res.berryYield.push(berryYield)
      res.berry.push(berry)
      res.weed.push(weed)
    }

    await t.update(userRef, {
      pokemon: user.pokemon,
      berryPlanted,
      items: user.items,
      berryGrown: FieldValue.increment(dataIndex.length),
      researchCurrent,
    })

    // TODO AdventureLog update

    return res
  })
  return args
})

export const berry_fertilize = functions.https.onCall(async (data: F.BerryFertilize.Req, context): Promise<F.BerryFertilize.Res> => {
  const userId = context.auth!.uid
  const dataFertilizer = (() => {
    if (Array.isArray(data.fertilizer)) return data.fertilizer
    return [data.fertilizer]
  })()
  const dataIndex = (() => {
    if (Array.isArray(data.index)) return data.index
    return [data.index]
  })()
  const args = await db.runTransaction(async t => {
    const userRef = db.collection('users').doc(userId)
    const userDoc = await t.get<Users.Doc>(userRef)
    const user = userDoc.data()
    const {berryPlanted, items} = user
    for (let i = 0; i < dataFertilizer.length; i++) {
      const di = dataIndex[i]
      const df = dataFertilizer[i]

      if (!ITEMS[df]?.label) {
        throw new functions.https.HttpsError('failed-precondition',
          `Cannot use fertilizer ${df}`)
      }
      if (ITEMS[df].category !== 'fertilizer') {
        throw new functions.https.HttpsError('failed-precondition',
          `Is not a fertilizer ${df}`)
      }
      if (!hasItem(user, df)) {
        throw new functions.https.HttpsError('failed-precondition',
          `Do not have ${df}`)
      }
      if (isEmptyPlot(berryPlanted![di]!)) {
        throw new functions.https.HttpsError('failed-precondition',
          `Cannot put fertilizer in an empty plot #${di}`)
      }
      if (berryPlanted![di]!.fertilizer) {
        throw new functions.https.HttpsError('failed-precondition',
          `There is already fertilizer in this plot #${di}`)
      }
      items[df]!--
      berryPlanted![di]!.fertilizer = df
    }

    await t.update(userRef, {
      berryPlanted,
      items,
    })

    // TODO AdventureLog update

    return {
      dataFertilizer,
      berryPlanted,
    }
  })
  return args
})
