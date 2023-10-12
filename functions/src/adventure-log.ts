import * as admin from 'firebase-admin'

import { GtsEntry } from "./gts"
import { TeamsBadge } from '../../shared/src/badge2'
import { BadgeId } from '../../shared/src/pokemon/types';

const db = admin.firestore()
const FieldValue = admin.firestore.FieldValue

export interface DocMeta {
  battlebox: string[]
  countBattlebox: number

  daycare: string[]
  countDaycare: number

  gts: string[]
  countGts: number

  items: string[]
  countItems: number

  pokedex: string[]
  countPokedex: number

  raids: string[]
  countRaids: number

  stadium: string[]
  countStadium: number
}

async function getMetaDoc(userId: string) {
  const adventureLog = db.collection('users').doc(userId).collection('adventureLog')
  console.debug(`Get Metadoc`)
  // let meta = await t.get(adventureLog.doc('meta'))
  const meta = await adventureLog.doc('meta').get()
  console.debug(`Got Metadoc`)
  let metadata = meta.data() as DocMeta
  if (!meta.exists) {
    console.debug(`Todo: create Adventure Log metadata for ${userId}`)
    const doc: DocMeta = {
      battlebox: [],
      countBattlebox: 0,    
      daycare: [],
      countDaycare: 0,    
      gts: [],
      countGts: 0,
      items: [],
      countItems: 0,
      pokedex: [],
      countPokedex: 0,
      raids: [],
      countRaids: 0,
      stadium: [],
      countStadium: 0,
    }

    await adventureLog.doc('meta').set(doc)
    // meta = await t.set(adventureLog.doc('meta'), doc)
    metadata = doc
  }
  return {
    adventureLog,
    meta,
    metadata,
  }
}

interface GtsAdventureLogObject {
  partner: string // 28 bytes
  timestamp: number // 13 bytes?
  offer: string // >=8 bytes
  seeking: string // >=8 bytes
}

// Let's say each can fit up to 1000
export interface GtsAdventureLog {
  created: {
    [tradeId: string]: GtsAdventureLogObject // >=85 bytes
  }
  completed: {
    [tradeId: string]: GtsAdventureLogObject // >=85 bytes
  }
}

export interface GtsAdventureLogOptions {
  userId: string
  created: boolean
  tradeId: string
  gtsDoc: GtsEntry
}

// ~30 bytes => Let's say it can store >= 10K
export interface BattleBoxLogObject {
  timestamp: number // 13 bytes?
  opponent: BadgeId // >=8 bytes
  species: BadgeId // >= 8 bytes
  result: number // 1 byte
}

/**
 * Obtain the last adventure log document in a given category
 *
 * @param t Firestore transaction object
 * @param adventureLog Adventure Log document
 * @param metadata Metadata document
 * @param arr Key for the array in the metadata
 * @param cnt Key for the size in the metadata
 * @param max Maximum number of cached values per Firestore document
 * @param defVal Default value for a new category adventure log document
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getRef(t: FirebaseFirestore.Transaction, adventureLog: FirebaseFirestore.CollectionReference, metadata: DocMeta, arr: string, cnt: string, max: number, defVal: any) {
  const array = metadata[arr] || [] // 'gts' => ['gts0', 'gts1']
  const count = metadata[cnt] || 0  // 'countGts' = 1433
  const index = Math.ceil(count / max) // 1433/1000 => ceil = 2
  if (array.length < index) { // Is 2 < 2? If so we need a new array 'gts2'
    // Add entry
    console.log(`Create a new adventure log doc for ${arr}`)
    await t.set(adventureLog.doc(`${arr}${index}`), defVal)
    array.push(`${arr}${index}`)
    // Update metadata
    console.log(`Update metadata for ${arr}`)
    await adventureLog.doc('meta').update({
      [arr]: array
    })
  }

  let currLogId = array[array.length - 1]
  if (currLogId === undefined) {
    currLogId = `${arr}0`
    console.log(`Create2 a new adventure log doc for ${arr}`)
    await t.set(adventureLog.doc(`${arr}${index}`), defVal)
    console.log(`Update metadata for ${arr}`)
    await adventureLog.doc('meta').update({
      [arr]: array
    })
  }
  console.log(`Gen ref ${currLogId}`)
  const ref = adventureLog.doc(currLogId)

  return {
    ref,
    [arr]: array,
  }
}

interface ReadOptions {
  limit?: number
}

export async function updateGts(
  t: FirebaseFirestore.Transaction,
  opt: GtsAdventureLogOptions
) {
  const {created, userId} = opt
  const {adventureLog, meta, metadata} = await getMetaDoc(userId)
  
  const {ref, gts} = await getRef(t, adventureLog, metadata, 'gts', 'countGts', 1000, {
    created: {},
    completed: {}
  })
  console.debug(`Update GTS - ${JSON.stringify(opt)}`)
  if (created) {
    try {
      await t.update(ref, {
        created: {
          [opt.tradeId]: {
            partner: opt.gtsDoc.user2,
            timestamp: opt.gtsDoc.timestampCompleted,
            offer: opt.gtsDoc.speciesId || opt.gtsDoc['species'],
            seeking: opt.gtsDoc.lookingForId || opt.gtsDoc['lookingFor'],
          }
        }
      })
    } catch (e) {
      console.log(`Shoot - GTS AL fail ${e}`)
      await t.set(ref, {
        created: {
          [opt.tradeId]: {
            partner: opt.gtsDoc.user2,
            timestamp: opt.gtsDoc.timestampCompleted,
            offer: opt.gtsDoc.speciesId || opt.gtsDoc['species'],
            seeking: opt.gtsDoc.lookingForId || opt.gtsDoc['lookingFor'],
          }
        }
      })
    }
  } else {
    try {
      await t.update(ref, {
        completed: {
          [opt.tradeId]: {
            partner: opt.gtsDoc.user2,
            timestamp: opt.gtsDoc.timestampCompleted,
            offer: opt.gtsDoc.speciesId || opt.gtsDoc['species'],
            seeking: opt.gtsDoc.lookingForId || opt.gtsDoc['lookingFor'],
          }
        }
      })
    } catch (e) {
      console.log(`Shoot - GTS AL fail2 ${e}`)
      await t.set(ref, {
        completed: {
          [opt.tradeId]: {
            partner: opt.gtsDoc.user2,
            timestamp: opt.gtsDoc.timestampCompleted,
            offer: opt.gtsDoc.speciesId || opt.gtsDoc['species'],
            seeking: opt.gtsDoc.lookingForId  || opt.gtsDoc['lookingFor'],
          }
        }
      })
    }
  }

  await t.update(meta.ref, {
    gts,
    countGts: FieldValue.increment(1),
  })
}

export async function adventureLogNumber(userId: string, cnt: string) {
  const {metadata} = await getMetaDoc(userId)
  return metadata[cnt]
}

export async function readGts(userId: string, opts: ReadOptions) {
  const {adventureLog, metadata} = await getMetaDoc(userId)
  const docs = metadata.gts.slice(0, opts.limit || metadata.gts.length)
  // Read each doc
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response: any[] = []
  for (const docId of docs) {
    const ref = await adventureLog.doc(docId).get()
    response.push(ref.data())
  }
  return response
}

export interface PokedexOptions {
  userId: string
  speciesId: BadgeId
}

export async function updatePokedex(
  t: FirebaseFirestore.Transaction,
  opts: PokedexOptions
) {
  const {userId} = opts
  console.debug(`Update Pokédex: ${JSON.stringify(opts)}`)
  const {adventureLog, meta, metadata} = await getMetaDoc(userId)
  
  // We should never have more than one Pokédex doc
  const {ref, pokedex} = await getRef(t, adventureLog, metadata, 'pokedex', 'countPokedex', 10_000, {
    badges: []
  })
  try {
    await t.update(ref, {
      badges: FieldValue.arrayUnion(new TeamsBadge(opts.speciesId).toSimple())
    })
  } catch (e) {
    console.log(`Shoot - Pokédex AL fail ${e}`)
    await t.set(ref, {
      badges: [new TeamsBadge(opts.speciesId).toSimple()]
    })
  }
  await t.update(meta.ref, {
    pokedex,
    countPokedex: 1 // We don't really have a good way to assess this, and it's not necessary to have it right now.
  })
}

/**
 * A version of updatePokedex that writes only (or crashes) without any reads
 * or meta-doc interaction.
 */
export async function updateOnlyPokedex(
  t: FirebaseFirestore.Transaction,
  opts: PokedexOptions
) {
  const {userId, speciesId} = opts
  console.debug(`Update Pokédex: ${JSON.stringify(opts)}`)
  const ref = db.collection('users').doc(userId).collection('adventureLog').doc('pokedex0')
  await t.update(ref, {
    badges: FieldValue.arrayUnion(new TeamsBadge(speciesId).toSimple())
  })
}

export async function readPokedex(userId: string, opts: ReadOptions) {
  const {adventureLog, metadata} = await getMetaDoc(userId)
  const docs = metadata.pokedex.slice(0, opts.limit || metadata.pokedex.length)
  // Read each doc
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response: any[] = []
  for (const docId of docs) {
    const ref = await adventureLog.doc(docId).get()
    response.push(ref.data())
  }
  return response
}

/**
 * Options to update Battle Box History
 */
export interface BattleBoxOptions {
  userId: string
  battle: BattleBoxLogObject
}

/**
 * Update Battle Box History with an entry
 * @param t Transaction
 * @param opts Options
 */
export async function updateBattleBox(
  t: FirebaseFirestore.Transaction,
  opts: BattleBoxOptions
) {
  const {userId} = opts
  const {adventureLog, meta, metadata} = await getMetaDoc(userId)
  
  const {ref, battlebox} = await getRef(t, adventureLog, metadata, 'battlebox', 'countBattlebox', 10_000, {
    battles: []
  })
  try {
    await t.update(ref, {
      battles: FieldValue.arrayUnion(opts.battle)
    })
  } catch (e) {
    console.log(`Shoot - BattleBox AL fail ${e}`)
    await t.set(ref, {
      battles: [opts.battle]
    })
  }
  await t.update(meta.ref, {
    battlebox,
    countBattlebox: FieldValue.increment(1),
  })
}

/**
 * Gets battle box history from the adventure log
 * @param userId User who has the history
 * @param opts General reading options
 */
export async function readBattleBox(userId: string, opts: ReadOptions) {
  const {adventureLog, metadata} = await getMetaDoc(userId)
  const docs = metadata.battlebox.slice(0, opts.limit || metadata.battlebox.length)
  // Read each doc
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response: any[] = []
  for (const docId of docs) {
    const ref = await adventureLog.doc(docId).get()
    response.push(ref.data())
  }
  return response
}

/**
 * Raid Log
 *
 * We estimate each one is going to be about 81 bytes, so about 10K entries
 * can fit un in one doc.
 */
export interface RaidLogObject {
  /**
   * Raid ID
   */
  id: string
  /**
   * Timestamp (ms)
   */
  time: number
  /**
   * Boss badge
   */
  boss: BadgeId
  /**
   * Raid rating (difficulty)
   */
  rating: number
  /**
   * X-Win-Lose-Tie
   */
  result: number
  /**
   * UID of the host
   */
  host: string
}

/**
 * Options to update Battle Box History
 */
export interface RaidOptions {
  userId: string
  raid: RaidLogObject
}

/**
 * Update Raid History with an entry
 * @param t Transaction
 * @param opts Options
 */
export async function updateRaid(
  t: FirebaseFirestore.Transaction,
  opts: RaidOptions
) {
  const {userId} = opts
  const {adventureLog, meta, metadata} = await getMetaDoc(userId)
  
  const {ref, raids} = await getRef(t, adventureLog, metadata, 'raids', 'countRaids', 10_000, {
    raids: []
  })
  try {
    await t.update(ref, {
      raids: FieldValue.arrayUnion(opts.raid)
    })
  } catch (e) {
    console.log(`Shoot - Raid AL fail ${e}`)
    await t.set(ref, {
      raids: [opts.raid]
    })
  }
  await t.update(meta.ref, {
    raids,
    countRaids: FieldValue.increment(1),
  })
}

/**
 * Gets Raid history from the adventure log
 * @param userId User who has the history
 * @param opts General reading options
 */
export async function readRaid(userId: string, opts: ReadOptions) {
  const {adventureLog, metadata} = await getMetaDoc(userId)
  const docs = metadata.raids.slice(0, opts.limit || metadata.battlebox.length)
  // Read each doc
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response: any[] = []
  for (const docId of docs) {
    const ref = await adventureLog.doc(docId).get()
    response.push(ref.data())
  }
  return response
}

/**
 * Forcefully sets non-existent docs in Adventure Log
 *
 * @param userId User ID
 * @param keys Types of docs to verify
 */
export async function verify(userId: string, keys: string[]) {
  console.info(`${userId} - Verify keys ${keys} exist`)
  const {adventureLog, meta, metadata} = await getMetaDoc(userId)
  for (const key of keys) {
    if (metadata[key] && metadata[key].length) {
      const id = metadata[key][metadata[key].length - 1]
      const doc = await adventureLog.doc(id).get()
      if (!doc.exists) {
        console.log(`${userId} - Need to set ${id}`)
        await doc.ref.set({}) // Empty
      } else {
        console.info(`${userId} - Doc ${id} exists`)
      }
    } else {
      const id = `${key}0`
      const counter = `count${key.substring(0, 1).toUpperCase()}${key.substring(1)}`
      const doc = await adventureLog.doc(id).get()
      console.log(`${userId} - Need to set originally set ${id}`)
      await doc.ref.set({}) // Empty set
      await meta.ref.update({
        [key]: [id],
        [counter]: 0,
      })
    }
    console.info(`${userId} - Verified AL ${key}`)
  }
}

/**
 * Delete all adventure log entries for a given type
 * @param userId User ID to delete for
 * @param key Adventure log key
 */
export async function clear(userId: string, key: string) {
  const counter = `count${key.substring(0, 1).toUpperCase()}${key.substring(1)}`

  const {adventureLog, meta, metadata} = await getMetaDoc(userId)
  for (const docId of metadata[key]) {
    await adventureLog.doc(docId).delete()
  }
  await meta.ref.update({
    [key]: [],
    [counter]: 0,
  })
}
