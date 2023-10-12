import * as admin from 'firebase-admin'
import * as P from './../../shared/src/gen/type-pokemon'
const db = admin.firestore();

let _sudowoodoArray: string[] = []
export const sudowoodoArray = () => {
  return _sudowoodoArray
}

let _kecleonArray: string[] = []
export const kecleonArray = () => {
  return _kecleonArray
}

let _haircutBrosArray: string[] = []
export const haircutBrosArray = () => {
  return _haircutBrosArray
}

let _radioQuizHiddenIds: string[] = []
export const radioQuizHiddenIds = () => {
  return _radioQuizHiddenIds
}

let _magnetTrainIds = {}
export const magnetTrainIds = () => {
  return _magnetTrainIds as {[key: string]: {itemGift: string}}
}

// Initialize constants when functions first load
export async function gameConfigLoad () {
  if (!_sudowoodoArray.length) {
    const sudowoodoArraySnapshot = await db.collection('hiddenItems')
      .where('encounter', '==', P.Sudowoodo)
      .where('active', '==', true)
      .get()
    _sudowoodoArray = sudowoodoArraySnapshot.docs.map(doc => doc.id)
  }

  if (!_kecleonArray.length) {
    const kecleonArraySnapshot = await db.collection('hiddenItems')
      .where('encounter', '==', P.Kecleon)
      .where('active', '==', true)
      .get()
    _kecleonArray = kecleonArraySnapshot.docs.map(doc => doc.id)
  }

  if (!_haircutBrosArray.length) {
    const haircutBrosArraySnapshot = await db.collection('hiddenItems')
      .where('badge', '==', 'potw-npc-haircutbros')
      .where('active', '==', true)
      .get()
    _haircutBrosArray = haircutBrosArraySnapshot.docs.map(doc => doc.id)
  }

  if (!_radioQuizHiddenIds.length) {
    const radioQuizHiddenIdsSnapshot = await db.collection('hiddenItems')
      .where('badge', '==', 'potw-npc-radio')
      .where('active', '==', true)
      .get()
    _radioQuizHiddenIds = radioQuizHiddenIdsSnapshot.docs.map(doc => doc.id)
  }

  // if (!Object.keys(_magnetTrainIds).length) {
    const magnetTrainIdsSnapshot = await db.collection('hiddenItems')
      .where('magnet', '==', true)
      .where('active', '==', true)
      .get()
    _magnetTrainIds = {}
    magnetTrainIdsSnapshot.docs.forEach(doc => {
      try {
        _magnetTrainIds[doc.id] = {
          itemGift: doc.data().itemGift
        }
      } catch (e) {
        console.error(e)
        console.error(doc.id)
      }
    })
  // }

  console.log('Database keys loaded into function configuration')
}
