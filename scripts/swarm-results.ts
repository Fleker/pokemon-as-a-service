import { get } from '../shared/src/pokemon'
const admin = require('firebase-admin');

// swarm | raid
function getDocId() {
  const docId = (() => {
    if (process.argv[2] === 'reset' || process.argv[2] === undefined) {
      return 'swarm'
    }
    return process.argv[2]
  })()
  return docId
}

async function main() {

  admin.initializeApp({
    storageBucket: 'pokemon-of-the-week.appspot.com',
    credential: admin.credential.cert(require('../service-key.json'))
  });
  const db = admin.firestore()
  const settings = {timestampsInSnapshots: true};
  db.settings(settings);

  const swarmDoc = await db.collection('test').doc(getDocId()).get()
  const {users, votes} = swarmDoc.data()
  const vmap = new Map()

  Object.entries(votes).forEach(([specie, votes]) => {
    vmap.set(specie, votes)
  })

  vmap[Symbol.iterator] = function* () {
    yield* [...this.entries()].sort((a, b) => b[1] - a[1]);
  }

  const topEight = [...vmap].slice(0, 8).map(k => k[0])
  topEight.forEach(p => {
    const pkmn = get(p)!
    console.log(p, pkmn.species, `(${vmap.get(p)})`)
  })

  console.log('---')
  const rest = [...vmap].slice(8).map(k => k[0])
  rest.forEach(p => {
    const pkmn = get(p)!
    console.log(p, pkmn.species, `(${vmap.get(p)})`)
  })

  console.log(`${Object.keys(users).length} votes in total`)
}

(async function() {
    await main()

    if (process.argv.includes('reset')) {
      // node swarm-results.js reset
      const db = admin.firestore()
      await db.collection('test').doc(getDocId()).set({
        users: {},
        votes: {}
      })
      console.log('Reset votes')
    }
})()
