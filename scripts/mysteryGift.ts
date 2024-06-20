// node mysteryGift.js [dry]
const species = 302
///
const admin = require('firebase-admin');
import {Badge, Pokemon} from '../shared/src/badge3'
import {Users} from '../shared/src/server-types'
const pkmn = Pokemon(species)
const badge = new Badge(pkmn)
const bstr = badge.toString()
const isDryRun = process.argv[2] === 'dry'
if (isDryRun) {
  console.info('This is a dry run')
}
admin.initializeApp({
  credential: admin.credential.cert(require('../service-key.json'))
});
const db = admin.firestore();
const settings = {timestampsInSnapshots: true};
db.settings(settings);
(async () => {
  const ref = await db.collection('hiddenItems').add({
    encounter: bstr,
    mystery: true
  })
  const hiddenItemId = ref.id
  console.log(`Granting a MYSTERYGIFT: ${badge.toLegacyString()} / ${bstr} - (${hiddenItemId})`)
  console.log('.....')
  const querySnapshot = await db.collection('users').get()
  console.log('.....')
  // querySnapshot.docs.forEach(d => console.log(d.data().ldap, d.id))
  // return
  for (const doc of querySnapshot.docs) {
    // console.log(doc.id);
    if (doc.id.startsWith('npc')) {
      // This is a virtual user, mostly used for testing and GTS
      console.log(`Skip NPC ${doc.id}`)
      continue;
    }
    // doc.data() is never undefined for query doc snapshots
    const {ldap, settings, hiddenItemsFound} = doc.data() as Users.Doc;
    let {pokemon} = doc.data() as Users.Doc
    const [id, personality] = badge.fragments
    if (settings && settings.union) {
      if (pokemon && pokemon[id] && pokemon[id][personality]) {
        pokemon[id][personality]++
      } else if (pokemon && pokemon[id]) {
        pokemon[id][personality] = 1
      } else if (pokemon) {
        pokemon[id] = {
          [personality]: 1
        }
      } else {
        pokemon = {
          [id]: {
            [personality]: 1
          }
        }
      }
      hiddenItemsFound.push(hiddenItemId);
      if (!isDryRun) {
        try {
          await db.collection('users').doc(doc.id).update({
            pokemon,
            hiddenItemsFound
          })
        } catch (e) {
          console.error('CANNOT UPDATE', doc.id, e)
        }
        if (Math.random() < 0.05) {
          // Occasionally spit out some text so we know it's working
          console.log('...')
        }
        console.log(`Updated ${doc.id} ${ldap}`)
      } else {
        console.log(`Dry skip ${doc.id} ${ldap}`)
      }
    } else {
      console.log(`Skip ${doc.id} ${ldap}`)
    }
  }
  console.log(`OK have done Pokemon ${species} as ${bstr}`)
})()