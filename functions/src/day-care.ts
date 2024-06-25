import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { Badge, Pokemon } from '../../shared/src/badge3';
import { ItemEntry } from './items';
import * as Pkmn from '../../shared/src/pokemon'
import { randomItem } from './utils';
import { ItemId } from '../../shared/src/items-list';
import * as ST from '../../shared/src/server-types';
import {Users} from './db-types';
import * as DB from './db-types';
import { addPokemon, hasItem, hasPokemon, removePokemon } from './users.utils';
import { canBeShiny, generateEgg, mantykeMethod, panchamMethod, compatibleEggGroup, DayCareEvolution, daycareEvolution } from './day-care.utils';
import {babyProduced} from '../../shared/src/platform/breeding-club'
import { BadgeId, PokemonId } from '../../shared/src/pokemon/types';
import { OVALCHARM } from '../../shared/src/quests';
import { shinyRate } from './platform/game-config';
import { Ditto } from '../../shared/src/gen/type-pokemon-ids';
import { F } from '../../shared/src/server-types';
import * as I from '../../shared/src/gen/type-pokemon-ids';
import { getLocation } from './location';

const db = admin.firestore()

const FieldValue = admin.firestore.FieldValue

// Subset of DayCareDoc
export interface DayCareAdventureLog {
  fatherSpeciesId: string
}

// export const genAdventureLog = (docs: DayCareDoc[]) => {
//   // Design it to be in a single doc
//   // Primarily this is used for Pokédex registration,
//   //   so no other information needs to be here
//   const fatherDocSet = new Set<DayCareAdventureLog>()
//   docs.forEach(doc => {
//     fatherDocSet.add({
//       fatherSpeciesId: doc.fatherSpeciesId
//     })
//   })
//   const adventureDoc = {
//     daycare: [...fatherDocSet]
//   }
//   return adventureDoc
// }

const DAY_S = 60 * 60 * 24
const WEEK_S = DAY_S * 7
const COOLDOWN_MS = 1000 * 60 * 60 * 1 // 1 Hour
const COOLDOWN_OVAL_MS = 1000 * 60 * 30 * 1 // 30 Min

/**
 * Update form of child in-place

 * @param mother Badge ID for the mother
 * @param child Badge ID of the child
 * @param badge Badge interface for the child
 * @deprecated Use generateEgg
 */
export function updateEggBadge(mother: BadgeId, child: BadgeId, badge: Badge): void {
  const {needForm, syncableForms} = Pkmn.get(child)!
  if (needForm) {
    // For Pokémon like Shellos, their bred form is based on parent (if valid)
    const motherBadge = Badge.fromLegacy(mother)
    if (motherBadge.personality.form) {
      badge.personality.form = motherBadge.personality.form
    } // Else you get no form because undefined is inherited
  }
  if (syncableForms && needForm) {
    // For Pokémon like Spinda, their bred form is random
    const randomForm = randomItem(syncableForms)
    badge.personality.form = randomForm
  }
  // No return, update in-place
}

interface EggDoc {
  hatch: number
  species: string
}

interface DayCareDoc {
  userId: string
  motherSpeciesId: string
  fatherSpeciesId: string
  item?: string
  motherItem?: string
  timestamp: FirebaseFirestore.FieldValue | number
  eggProduced?: string
  evolution?: boolean
}

export async function getDayCareHistory(userId) {
  // Either get from adventure log or populate from collection
  const userCollection = await db.collection('users').doc(userId)
    .collection('adventureLog').doc('dayCare').get()

  if (userCollection.exists) {
    return { daycare: userCollection.data()!.daycare }
  }
  return { }
}

export const daycare = functions.https.onCall(async (data: F.Daycare.Req, context): Promise<F.Daycare.Res> => {
  if (!context.auth) {
    throw new functions.https.HttpsError('not-found', '')
  }
  const userId = context.auth!.uid;
  if (!data || !data.species || !data.species[0]) {
    console.error(`Getting bad data sent by ${context.auth!.uid}`)
    throw new functions.https.HttpsError('not-found',
      'No data was provided')
  }
  if (!Array.isArray(data.species)) {
    console.error(`Getting bad data type sent by ${context.auth!.uid}`)
    throw new functions.https.HttpsError('invalid-argument',
      'No array of data.species is being passed')
  }
  const {isPrivate} = data
  const species = data.species.map(x => new Badge(x))
  let {heldItem} = data
  if (typeof heldItem === 'string') heldItem = [heldItem]

  if (!species) {
    throw new functions.https.HttpsError('invalid-argument',
      `Public day care requires Pokémon, found nothing`)
  }
  if (species.length !== 1 && !isPrivate) {
    throw new functions.https.HttpsError('invalid-argument',
      `Public day care requires 1 Pokémon, found ${species.length}`)
  }
  if (species.length !== 2 && isPrivate) {
    throw new functions.https.HttpsError('invalid-argument',
      `Private day care requires 2 Pokémon, found ${species.length}`)
  }
  if (data.heldItem && !Array.isArray(data.heldItem)) {
    throw new functions.https.HttpsError('failed-precondition',
      'Held Items must be an array')
  }
  let html = ''

  // Check the last time for the player
  const userRef = db.collection('users').doc(userId)
  const user = await db.runTransaction(async transaction => {
    const userDoc = await transaction.get(userRef)
    const user = userDoc.data() as ST.Users.Doc
    const {lastDayCareDate, hiddenItemsFound} = user
    if (lastDayCareDate && !hiddenItemsFound.includes(OVALCHARM)) {
      const timeDiff = Date.now() - lastDayCareDate
      const minutes = Math.ceil((COOLDOWN_MS - timeDiff) / 1000 / 60) // ms -> min
      if (timeDiff < COOLDOWN_MS) {
        throw new functions.https.HttpsError('failed-precondition',
          `You've been playing too much. Try again later: ${minutes} minutes difference.`)
      }
    } else if (lastDayCareDate && hiddenItemsFound.includes(OVALCHARM)) {
      const timeDiff = Date.now() - lastDayCareDate
      const minutes = Math.ceil((COOLDOWN_OVAL_MS - timeDiff) / 1000 / 60) // ms -> min
      if (timeDiff < COOLDOWN_OVAL_MS) {
        throw new functions.https.HttpsError('failed-precondition',
          `You've been playing too much. Try again later: ${minutes} minutes difference.`)
      }
    }

    if (species) {
      if (!hasPokemon(user as unknown as DB.Users.Doc, data.species)) {
        throw new functions.https.HttpsError('not-found', `Not found in user: ${data.species}`)
      }
    }

    if (typeof heldItem === 'string') heldItem = [heldItem]
    if (heldItem) {
      heldItem.forEach(item => {
        if (!hasItem(user as unknown as DB.Users.Doc, item)) {
          throw new functions.https.HttpsError('not-found', `You do not have that item ${item}.`)
        }
      })
    }

    transaction.update(userRef, {lastDayCareDate: Date.now()})
    return userDoc.data() as ST.Users.Doc
  })

  const {hiddenItemsFound} = user

  if (!heldItem) {
    heldItem = ['oran', 'oran'] // I dunno let's just hardcode it
  }
  // Force cast
  let item: ItemId = heldItem[0]

  let father: Badge = species[0]
  let mother: (Badge | undefined) = undefined
  let motherItem: ItemId = 'oran' // Default
  if (isPrivate) {
    mother = species[0]
    motherItem = heldItem[0]
    father = species[1]
    item = heldItem[1]
  } else {
    // Grab the last player's Pokémon to use as the mother (or father if it's a Ditto)
    const querySnapshot = await db.collection('dayCare')
    .orderBy('timestamp', 'desc')
    .limit(1)
    .get()

    if (querySnapshot.empty) {
      mother = new Badge(Pokemon(Ditto)) // For debugging
    } else {
      // Swap parent (father -> mother)
      mother = Badge.fromLegacy(querySnapshot.docs[0].data().fatherSpeciesId)
    }
  }

  const motherDb = Pkmn.get(mother.toLegacyString())!
  const fatherDb = Pkmn.get(father.toLegacyString())!

  const userLocation = await getLocation(user.location ?? 'US-MTV')
  const evolutions: DayCareEvolution[] = []
  if (isPrivate) {
    // When 'isPrivate' the mother will also be considered.
    evolutions.push(daycareEvolution(mother, motherItem, user, userLocation))
  }
  evolutions.push(daycareEvolution(father, item, user, userLocation))
  if (mantykeMethod(mother.toLegacyString(), father.toLegacyString()!)) {
    evolutions.push({
      parent: father,
      html: 'Your Mantyke evolved!!',
      useItemOutput: {
        changeType: 'EVO',
        consumedItem: false,
        output: (() => {
          const baby = new Badge(father.toString())
          baby.id = I.Mantine
          return baby.toString()
        })(),
      },
      debug: {},
      item,
    })
  }
  if (panchamMethod(mother.toLegacyString(), father.toLegacyString()!)) {
    evolutions.push({
      parent: father,
      html: 'Your Pancham evolved!!',
      useItemOutput: {
        changeType: 'EVO',
        consumedItem: false,
        output: (() => {
          const baby = new Badge(father.toString())
          baby.id = I.Pangoro
          return baby.toString()
        })(),
      },
      debug: {},
      item: motherItem,
    })
  }

  // Insert evolutions into user doc
  await db.runTransaction(async t => {
    const userDoc = await t.get(userRef)
    const user = userDoc.data() as Users.Doc
    for (const evo of evolutions) {
      if (!evo.useItemOutput) continue // No evo
      console.log(`Evolution ${evo.parent.toString()} -> ${evo.useItemOutput.output}`)
      removePokemon(user, evo.parent)
      const evolver = new Badge(evo.useItemOutput.output)
      evo.parent.id = evolver.id
      if (evolver.personality.form) {
        // Mainly only useful for Vivillon
        evo.parent.personality.form = evolver.personality.form
      }
      addPokemon(user, evo.parent)
      evo.useItemOutput.others?.forEach(badge => {
        console.log(`-- Also add ${badge}`)
        addPokemon(user, new Badge(badge))
      })

      if (user.evolutionCount) {
        user.evolutionCount++
      } else {
        user.evolutionCount = 1
      }

      html += evo.html

      const itemEntry: ItemEntry = {
        item: 'Rare Candy',
        userId,
        offeredPkmn: evo.parent.toLegacyString(),
        timestamp: FieldValue.serverTimestamp(),
      }
      await db.collection('items-history').add(itemEntry)
    }

    await t.update(userRef, {
      pokemon: user.pokemon,
      evolutionCount: user.evolutionCount ?? 0,
    })
  })

  const parents = (() => {
    const p: PokemonId[] = []
    for (const evo of evolutions) {
      if (evo.useItemOutput) {
        p.push(new Badge(evo.useItemOutput.output).toString())
        evo.useItemOutput.others?.forEach(badge => {
          p.push(new Badge(badge).toString())
        })
      } else {
        p.push(evo.parent.toString())
      }
    }
    return p
  })()

  if (!fatherDb.eggGroup || isPrivate && !motherDb.eggGroup) {
    await db.runTransaction(async transaction => {
      const user = await transaction.get(userRef)
      const {items} = user.data()!
      for (const evo of evolutions) {
        if (!evo.specials) continue
        if (evo.specials.itemConsumed) {
          items[evo.item]--
        }
      }
      transaction.update(userRef, { items })
    })
    html += 'Your Pokémon quickly returned to you. It did not want to play with others.\n'
    return {
      html,
      parents,
      debug: {evolutions},
    }
  }

  const breedResult = compatibleEggGroup(motherDb.eggGroup!, fatherDb.eggGroup)
  if (breedResult === 'INVALID') {
    // Insert record
    const record: DayCareDoc = {
      motherSpeciesId: mother.toLegacyString(),
      fatherSpeciesId: father.toLegacyString()!,
      userId,
      timestamp: FieldValue.serverTimestamp(),
    }
    if (item) record.item = item
    if (isPrivate && motherItem!) record.motherItem = motherItem!
    await db.collection('dayCare').add(record)

    // try {
    //   const adventureLog = await db.collection('users').doc(userId)
    //     .collection('adventureLog').doc('dayCare').get()
    //   record.timestamp = new Date().getTime()
    //   if (adventureLog.exists) {
    //     try {
    //       await adventureLog.ref.update({
    //         daycare: FieldValue.arrayUnion(record)
    //       })
    //     } catch (e) {
    //       html += `Cannot update adventure log: ${e}<br>`
    //     }
    //   } else {
    //     try {
    //       await adventureLog.ref.set({
    //         daycare: await getDayCareHistory(userId)
    //       })
    //     } catch (e) {
    //       html += `Cannot set adventure log: ${e}<br>`
    //     }
    //   }
    // } catch (e) {
    //   console.warn('Cannot post to daycare AL', e)
    // }
    await db.runTransaction(async transaction => {
      const user = await transaction.get(userRef)
      const {items} = user.data()!
      for (const evo of evolutions) {
        if (!evo.specials) continue
        if (evo.specials.itemConsumed) {
          items[evo.item]--
        }
      }
      transaction.update(userRef, { items })
    })
    return {
      debug: {evolutions},
      parents,
      html: html + `Your Pokémon is doing well. It doesn't seem to like playing with the others though.`
    }
  }

  const specials = isPrivate ? evolutions[1].specials! : evolutions[0].specials!
  const motherSpecials = isPrivate ? evolutions[0].specials : undefined

  const eggSpecies = generateEgg(
    mother.toLegacyString(), father.toLegacyString()!,
    breedResult,
    specials,
    motherSpecials,
  )

  if (!eggSpecies) {
    console.error(`Egg Species is undefined for ${fatherDb.eggBase}, ${motherDb.eggBase}, ${breedResult}`)
    await db.runTransaction(async transaction => {
      const user = await transaction.get(userRef)
      const {items} = user.data()!
      for (const evo of evolutions) {
        if (!evo.specials) continue
        if (evo.specials.itemConsumed) {
          items[evo.item]--
        }
      }
      transaction.update(userRef, { items })
    })
    return {
      debug: {evolutions},
      parents,
      html: html + 'Your Pokémon is doing well. It made a friend, but then they got into a fight.'
    }
  }

  // Insert data back to user doc
  const egg = await db.runTransaction(async transaction => {
    const user = await transaction.get(userRef)
    const {items} = user.data()!
    let {eggs} = user.data()!

    // Create an egg
    const egg: EggDoc = {
      hatch: Date.now() / 1000 + WEEK_S,
      species: eggSpecies
    }
    // choose one item for egg hatch time
    if (specials.hatchTime) {
      egg.hatch = Date.now() / 1000 + specials.hatchTime
      specials.eggConsumed = true
      if (motherSpecials) {
        motherSpecials.eggConsumed = false
      }
    }
    if (motherSpecials && motherSpecials.hatchTime) {
      if (!specials.hatchTime || motherSpecials.hatchTime < specials.hatchTime) {
        egg.hatch = Date.now() / 1000 + motherSpecials.hatchTime
        motherSpecials.eggConsumed = true
        specials.eggConsumed = false
      }
    }
    if (specials.eggConsumed || specials.itemConsumed) {
      items[item]--
    }
    if (motherSpecials) {
      if (motherSpecials.eggConsumed || motherSpecials.itemConsumed) {
        items[motherItem]--
      }
    }
    const badge = Badge.fromLegacy(egg.species)

    const eggCanBeShiny = canBeShiny(egg.species as BadgeId)
    if (!specials.shiny && !motherSpecials?.shiny && eggCanBeShiny.list) {
      // BREEDING CLUB SPECIAL - 3x increase to be shiny in public daycare
      const encounterType = isPrivate ? 'daycare' : 'masuda'
      if (!isPrivate && eggCanBeShiny.club) {
        if ((Math.random() / 3) < shinyRate(encounterType, hiddenItemsFound)) {
          badge.personality.shiny = true
        }
      } else {
        if (Math.random() < shinyRate(encounterType, hiddenItemsFound)) {
          badge.personality.shiny = true
        }
      }
    }

    if (specials.shiny || motherSpecials?.shiny) {
      badge.personality.shiny = true
    }
    egg.species = badge.toLegacyString()
    egg.badgeId = badge.toString()

    if (!eggs || !Array.isArray(eggs)) {
      eggs = [egg]
    } else {
      eggs.push(egg)
    }

    transaction.update(userRef, { eggs, items, eggsLaid: FieldValue.increment(1) })
    return egg
  })

  // Insert record
  const record: DayCareDoc = {
    motherSpeciesId: mother.toLegacyString(),
    fatherSpeciesId: father.toLegacyString()!,
    userId,
    timestamp: FieldValue.serverTimestamp(),
    eggProduced: egg.species
  }
  if (item) record.item = item
  if (motherItem!) record.motherItem = motherItem!
  const daycareId = await db.collection('dayCare').add(record)

  // try {
  //   const adventureLog = await db.collection('users').doc(userId)
  //       .collection('adventureLog').doc('dayCare').get()
  //   record.timestamp = new Date().getTime()
  //   if (adventureLog.exists) {
  //     await adventureLog.ref.update({
  //       daycare: FieldValue.arrayUnion({
  //         fatherSpeciesId: father.toLegacyString()!
  //       })
  //     })
  //   } else {
  //     await adventureLog.ref.set({
  //       daycare: await getDayCareHistory(userId)
  //     })
  //   }
  // } catch (e) {
  //   console.warn('Cannot post to daycare AL (2)', e)
  // }

  return {
    debug: {
      specials,
      ...(isPrivate ? {motherSpecials} : undefined),
      babyProduced,
      evolutions,
    },
    debugId: daycareId.id,
    egg,
    parents,
    html: html + 'Your Pokémon was playing and something amazing happened. An egg was found! ' +
      'We do not know how it got there, but you should probably hold onto it.'
  }
})
