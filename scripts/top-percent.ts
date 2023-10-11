/**
 * @fileoverview Computes rare Pokémon:
 * - List of top 1% Pokémon in user collections
 * - List of all Pokémon with <= N players having caught it
 * This outputs a JSON object in console which can be copied to shared/top-pokemon.ts 
 */
import { Badge } from '../shared/src/badge3'
const RARE_COUNT = 100 // <= RARE_COUNT players have this Pkmn

async function main() {
  const admin = require('firebase-admin');

  admin.initializeApp({
    storageBucket: 'pokemon-of-the-week.appspot.com',
    credential: admin.credential.cert(require('../service-key.json'))
  });
  const db = admin.firestore()
  const settings = {timestampsInSnapshots: true};
  db.settings(settings);

  async function forEveryUser(cb) {
    const LIMIT = 300
    let lastDoc = undefined
    while (true) {
      const querySnapshot = await (async () => {
        if (lastDoc) {
          // console.log('New iteration: start after', lastDoc.id)
          return await db.collection('users')
            .orderBy('ldap')
            .startAfter(lastDoc)
            .limit(LIMIT)
            .get()
        } else {
          return await db.collection('users')
          .orderBy('ldap')
          .limit(LIMIT)
          .get()
        }
      })()
      // Update token
      lastDoc = querySnapshot.docs[querySnapshot.docs.length-1];

      for (let i = 0; i < querySnapshot.size; i++) {
        const doc = querySnapshot.docs[i]
        // console.log(doc.id);
        if (doc.id.indexOf('npc') > -1) {
            // This is a virtual user, mostly used for testing and GTS
            continue;
        }
        const user = doc.data()
        const ref = doc.ref

        ///
        await db.runTransaction(async transaction => {
          await cb(ref, user, doc.id, transaction)
        })
      }

      if (querySnapshot.docs.length < LIMIT) {
        break // Exit loop once we've iterated through everyone
      }
    }
  }

  async function getTopOnePercent() {
    const map = new Map()
    // const userDoc = await db.collection('users').doc('veXJXuNwZ7RsUXV6tQqWjboQOy03').get()
    // const user = userDoc.data()
    await forEveryUser(async (_, user) => {
      if (!user) return
      const {pokemon} = user
      if (!pokemon) return
      for (const badge of Object.keys(pokemon)) {
        const key = new Badge(badge).toSprite()
        if (map.has(key)) {
          map.set(key, map.get(key) + 1)
        } else {
          map.set(key, 1)
        }
      }
    })
    // Sort
    map[Symbol.iterator] = function* () {
      yield* [...this.entries()].sort((a, b) => a[1] - b[1]);
    }
    console.log(map.size)
    const p1 = Math.max(Math.ceil(map.size / 100), 32) // Literally 1% (or at least 32)
    const c10 = (() => {
      let i = 0
      const ma = [...map]
      while (true) {
        if (ma[i][1] <= RARE_COUNT) {
          i++
        } else {
          return i
        }
      }
    })()
    console.log(map.size, p1, c10)
    const p1Arr = [...map].slice(0, p1).map(([k]) => k)
    const c10Arr = [...map].slice(0, c10).map(([k]) => k)
    console.log([...map].slice(0, p1))
    console.log([...map].slice(0, c10))
    console.log(JSON.stringify({
      p1Arr,
      c10Arr,
    }))
  }

  await getTopOnePercent()
}

(async function() {
  await main()
})()
