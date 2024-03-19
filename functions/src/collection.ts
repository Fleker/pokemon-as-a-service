import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { Badge, DEFAULT_TAGS, Tag } from '../../shared/src/badge3';
import * as Utils from './utils';
import * as Sprite from '../../shared/src/sprites';
import { ENCOUNTERS, HOLD_ITEMS_5, HOLD_ITEMS_15, deduplicate, HOLD_ITEMS_50 } from './encounter'
import { ReleasedDoc, Swarm, Users } from './db-types';
import { gameConfigLoad } from './dowsing-badge';
import * as Pkmn from '../../shared/src/pokemon'
import { BadgeId, PokemonId } from '../../shared/src/pokemon/types';
import { accomodateResearch } from './research-quests';
import { LureArr, LureId } from '../../shared/src/gen/type-item';
import { getLocation } from './location';
import { ITEMS, ItemId } from '../../shared/src/items-list';
import { addPokemon, awardItem, calculateNetWorth, hasItem, hasPokemon, removePokemon } from './users.utils';
import { Globe } from '../../shared/src/locations-list';
import { POKEDOLL } from '../../shared/src/quests';
import { salamander } from '@fleker/salamander';
import { Swarms } from '../../shared/src/platform/swarms';
import { randomVariant } from '../../shared/src/farming';
import { shinyRate } from './platform/game-config';
import { genReleaseItems, v2Release } from './collection.utils';
import { Events } from '../../shared/src/events';
import { Souvenirs } from '../../shared/src/souvenirs';
import randomItem from '../../shared/src/random-item';
import * as S from '../../shared/src/server-types';
import {F} from '../../shared/src/server-types';
import {PokeballId} from '../../shared/src/items-list';
import * as A from './adventure-log'
import { sendNotification } from './notifications';
import isDemo from '../../shared/src/platform/isDemo'
import { myPokemon } from '../../shared/src/badge-inflate'
import spacetime from 'spacetime'

const db = salamander(admin.firestore())
const FieldValue = admin.firestore.FieldValue;
interface Egg {
  species: string,
  laid?: number,
  hatch?: number,
}
// Gotta remove the egg & add a new badge
export const hatch = functions.https.onCall(async (data: F.Hatch.Req, context): Promise<F.Hatch.Res> => {
  const userId = context.auth!.uid
  const {key} = data
  let status = 'You do not have this egg.'
  return await db.runTransaction(async transaction => {
    const ref = db.collection('users').doc(userId)
    const userDoc = await transaction.get<Users.Doc>(ref)
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('invalid-argument', 'User does not exist.');
    }
    const user = userDoc.data()
    if (isDemo) {
      const countUserCaughtPkmn = [...myPokemon(user.pokemon)]
        .map(([, v]) => v)
        .reduce((p, c) => p + c)
      if (countUserCaughtPkmn > 250) {
        throw new functions.https.HttpsError('out-of-range',
          'You cannot hatch any more Pokemon in demo mode')
      }
    }
    const {eggs} = user
    for (let i = 0; i < eggs.length; i++) {
      const egg: Egg = eggs[i]
      if (egg.species != key) continue
      if (egg.laid) {
        const eggDuration = 60 * 60 * 24 * 7; // 1 WEEK
        const age = Math.floor((new Date().getTime()/1000) - egg.laid);
        if (age < eggDuration) {
          status = 'The egg is not moving much.'
          continue
        }
      } else if (egg.hatch) {
        if (Math.floor((new Date().getTime()/1000)) < egg.hatch) {
          status = 'The egg is not moving much.'
          continue
        }
      }
    
      eggs.splice(i, 1)
      const badge = Badge.create(egg.species)
      // Already some factors like shiny and form are determined from breeding
      badge.personality.location = 'Hatched'
      addPokemon(user, badge)
      const {researchCurrent} = await accomodateResearch(user, badge.toLegacyString(), 'pokeball')
      await transaction.update(ref, { eggs, pokemon: user.pokemon, researchCurrent })
      await A.updatePokedex(transaction._raw, {
        userId,
        speciesId: badge.toLegacyString(),
      })
      // Add an item to the items-history collection for stats
      await db.collection('items-history').add({
        userId,
        item: 'incubator',
        target: egg.species,
        timestamp: FieldValue.serverTimestamp()
      })
      return {
        species: egg.species,
        badge: badge.toString()
      }
    }
    throw new functions.https.HttpsError('failed-precondition', status);
  })
});
const lureBallMapping: Record<LureId, PokeballId[]> = {
  trophygardenkey: ['greatball'],
  friendsafaripass: ['safariball'],
  colressmchn: ['ultraball'],
  adrenalineorb: ['quickball'],
  rotombike: ['duskball'],
}
exports.throw = functions.https.onCall(async (data: F.Throw.Req, context): Promise<F.Throw.Res> => {
  if (!context.auth) {
    throw new functions.https.HttpsError('not-found', '')
  }
  const userId = context.auth!.uid
  const {pokeball, duplicates, locationId, lure, friendSafari, bait} = data
  await gameConfigLoad()
  let items;
  // Get encounter table
  const group = (() => {
    if (bait) {
      return ENCOUNTERS.campinggear
    }
    if (lure) {
      // When using a lure, the 'pokeball' is meant to be fixed to one.
      // We can't just rely on the 'pokeball' field being passed.
      if (!lureBallMapping[lure].includes(pokeball)) {
        throw new functions.https.HttpsError('failed-precondition',
          `The lure ${lure} requires ball ${lureBallMapping[lure].join(',')}`)
      }
      return ENCOUNTERS[lure]
    }
    return ENCOUNTERS[pokeball] // Default encounter.
  })()
  if (!group) {
    throw new functions.https.HttpsError('invalid-argument',
      `Category of Pokémon ${pokeball} is invalid`);
  }
  const txnRes = await db.runTransaction(async (transaction) => {
    const ref = db.collection('users').doc(userId)
    const doc = await transaction.get<Users.Doc>(ref)
    if (!doc.exists) {
      throw new functions.https.HttpsError('invalid-argument',
        'User does not exist');
    }
    const user = doc.data()
    items = user.items
    const hiddenItemsFound = user.hiddenItemsFound
  
    if (!hasItem(user, pokeball)) {
      throw new functions.https.HttpsError('out-of-range',
        `No ${pokeball} found`);
    }
    if (lure && !hasItem(user, lure)) {
      throw new functions.https.HttpsError('out-of-range',
        `No lure ${lure} found`);
    }
    if (bait && !hasItem(user, bait)) {
      throw new functions.https.HttpsError('out-of-range',
        `No bait ${bait} found`);
    }
    if (lure === 'friendsafaripass') {
      if (friendSafari === undefined) {
        throw new functions.https.HttpsError('invalid-argument',
          'Expected, did not find friendSafari parameter.')
      }
      // Verify `friendSafari` is valid against user
      for (const char of friendSafari) {
        if (!user.friendSafari || !user.friendSafari.includes(char)) {
          throw new functions.https.HttpsError('out-of-range',
            `User friend safari unlock does not include "${char}".`)
        }
      }
    }
    // Check that the player has not captured too many Pokémon.
    // If they exceed the 1MB doc limit, bad things can happen.
    if (duplicates && JSON.stringify(user).length > 500 * 1024) {
      throw new functions.https.HttpsError('out-of-range',
        'You have caught so many Pokémon, we are worried about them becoming endangered!')
    }
    if (isDemo) {
      const countUserCaughtPkmn = [...myPokemon(user.pokemon)]
        .map(([, v]) => v)
        .reduce((p, c) => p + c)
      if (countUserCaughtPkmn > 250) {
        throw new functions.https.HttpsError('out-of-range',
          'You cannot catch any more Pokemon in demo mode')
      }
    }
    const location = await (async () => {
      if (locationId && Globe[locationId]?.label && hiddenItemsFound.includes(POKEDOLL)) {
        // Update location or fail silently
        await transaction.update(ref, { location: locationId })
        return await getLocation(locationId)
      }
      if (user.location) {
        return await getLocation(user.location)
      }
      return getLocation('US-MTV') // Default
    })()
    const now = new Date()
    try {
      const encounter = group(user, now, location, 'List', {
        friendSafari: friendSafari ? friendSafari : '',
        bait: bait ? bait : '',
        pokeball: bait ? pokeball : '',
      })
      const availablePokemon = deduplicate(encounter, user.pokemon, duplicates, !!lure)
  
      if (availablePokemon.length === 0) {
        throw new functions.https.HttpsError('out-of-range',
          'Cannot find any Pokémon. Looks like you have caught them all.');
      }
    
      let selectedPokemon: BadgeId = availablePokemon[Math.floor(Math.random() * availablePokemon.length)];
      if (!selectedPokemon) {
        throw new functions.https.HttpsError('internal',
          'Selected Pokémon does not exist'); 
      }
      const guaranteedItem = encounter.guaranteedItem(selectedPokemon, now, location, user)
      // Shiny checker
      const activeEvents = Object.values(Events)
        .filter(e => e.isActive(user as S.Users.Doc))
      const eventMult = (() => {
        if (activeEvents.length) {
          return activeEvents
            .map(e => e.shinyRate)
            .reduce((prev, curr) => prev + curr)
        }
        return 1
      })()
      const isEventPkmn = activeEvents 
        .filter(ev => ev.frequentSpecies.includes(selectedPokemon))
        .length
      const shiny = shinyRate('throw', hiddenItemsFound) *
        // Diamond Dust special encounters
        (location && location.forecast === 'Diamond Dust' ? 3 : 1) *
        (encounter.shinyMultipler * 1) *// Some balls may have a higher shiny rate
        (Swarms[location.region] === selectedPokemon ? 3 : 1) * // Swarms are slightly improved.
        eventMult * (isEventPkmn ? 2 : 1)
      const badge = Badge.create(selectedPokemon)
      const dbPkmn = Pkmn.get(selectedPokemon)!
      const canBeShiny = dbPkmn.shiny === 'WILD'
      if (canBeShiny && Math.random() < shiny) {
        // Oh wow it's a shiny!
        badge.personality.shiny = true
      }
      if (Swarms[location.region] === selectedPokemon && Math.random() < 0.33) {
        // 33% chance for Swarm Pokemon to be a variant
        badge.personality.variant = randomVariant(dbPkmn)
      }
      if (isEventPkmn && Math.random() < 0.5) {
        badge.personality.variant = randomVariant(dbPkmn)
      }
      if (lure !== undefined && LureArr.includes(lure)) {
        // All Lure Pokemon are going to be a variant
        badge.personality.variant = randomVariant(dbPkmn)
      }
      if (pokeball === 'luxuryball') {
        badge.personality.affectionate = true
      }
      badge.personality.pokeball = pokeball
      badge.personality.location = locationId || user.location
      const hasWeatherMark = Math.random() < 0.02 // 1/50
      if (hasWeatherMark) {
        if (location.forecast === 'Cloudy') {
          badge.ribbons = ['☁️']
        } else if (location.forecast === 'Thunderstorm') {
          badge.ribbons = ['🌩️']
        }  else if (location.forecast === 'Rain') {
          badge.ribbons = ['🌧️']
        } else if (location.forecast === 'Snow') {
          badge.ribbons = ['☃️']
        } else if (location.forecast === 'Heat Wave') {
          badge.ribbons = ['☀️']
        } else if (location.forecast === 'Sandstorm') {
          badge.ribbons = ['⏳']
        } else if (location.forecast === 'Fog') {
          badge.ribbons = ['🌫️']
        }
      } else {
        const hasToDMark = Math.random() < 0.19 // ~1/52
        if (hasToDMark) {
          const date = spacetime(new Date(), location.timezone)
          if (date.hours() < 6) {
            badge.ribbons = ['💤']
          } else if (date.hours() < 12) {
            badge.ribbons = ['🌅']
          } else if (date.hours() < 19) {
            badge.ribbons = ['🍴']
          } else if (date.hours() < 20) {
            badge.ribbons = ['🌇']
          } else {
            badge.ribbons = ['💤']
          }
        } else {
          const p = Math.random()
          const hasWildMark = p < 0.00035 // ~1/2800
          if (hasWildMark) {
            badge.ribbons = [randomItem([
              '💫',
              '💢',
              '😢',
              '🤕',
            ])]
          } else if (p < 0.001) {
            badge.ribbons = ['‼️']
          } else if (p < 0.02) {
            badge.ribbons = ['❗']
          }
        }
      }
      // Add to database
      selectedPokemon = badge.toLegacyString()
      console.log(`Adding ${selectedPokemon}`)
      addPokemon(user, badge)
    
      // Remove current ball from inventory
      console.log(`Remove 1 ${pokeball}`);
      items[pokeball]--;
      // Calculate bait removal
      if (bait) {
        const p = Math.random()
        const {consumption} = ITEMS[bait]
        console.log('Bait', bait, 'consumption', consumption, 'p', p)
        if (p < 1/consumption) {
          items[bait]--
        }
      }
      const nw = calculateNetWorth(user)
      const HOLD_ITEM_POKEBALL = (() => {
        if (nw < 100) return 0.5  /* 50% */
        if (nw < 500) return 0.15 /* 15% */
        if (nw < 1000) return 0.05 /* 5% */
        return 0.005 // 0.5%
      })()
      // Check for random hidden items
      let holdItem = guaranteedItem // Preload with guaranteed item if available from conditional logic
      let holdItemQuantity = 1
      if (!holdItem && Math.random() < HOLD_ITEM_POKEBALL) {
        // Pickup a Poké Ball
        holdItem = 'pokeball'
      }
      const ITEM_RATE_RARE = (() => {
        if (nw < 20) return 1 /* 100% */
        if (nw < 100) return 0.25 /* 25% */
        if (nw < 1000) return 0.15 /* 15% */
        if (nw < 10_000) return 0.15 /* 15% */
        return 0.15 /* Standard 15% */
      })()
      const ITEM_RATE_UNCOMMON = (() => {
        if (nw < 20) return 1 /* 100% */
        if (nw < 100) return 0.7 /* 70% */
        if (nw < 1000) return 0.35 /* 35% */
        if (nw < 10_000) return 0.25 /* 25% */
        return 0.25 /* Standard 25% */
      })()
      const ITEM_RATE_COMMON = (() => {
        if (nw < 20) return 1 /* 100% */
        if (nw < 100) return 0.75 /* 75% */
        if (nw < 1000) return 0.65 /* 65% */
        if (nw < 10_000) return 0.55 /* 55% */
        return 0.45 /* Standard 45% */
      })()
      // ~5% chance to get a hold item
      const simpleSelection = badge.toSimple()
      if (HOLD_ITEMS_5[simpleSelection] && Math.random() < ITEM_RATE_RARE && !holdItem) {
        const itemSelect = HOLD_ITEMS_5[simpleSelection]
        if (itemSelect) {
          holdItem = Utils.randomItem(itemSelect)
        }
      }
      // ~15% chance to get a hold item
      if (HOLD_ITEMS_15[simpleSelection] && Math.random() < ITEM_RATE_UNCOMMON && !holdItem) {
        const itemSelect = HOLD_ITEMS_15[simpleSelection]
        if (itemSelect) {
          holdItem = Utils.randomItem(itemSelect)
        }
      }
      // ~50% chance to get a hold item
      if (HOLD_ITEMS_50[simpleSelection] && Math.random() < ITEM_RATE_COMMON && !holdItem) {
        const itemSelect = HOLD_ITEMS_50[simpleSelection]
        if (itemSelect) {
          holdItem = Utils.randomItem(itemSelect)
          holdItemQuantity = Utils.randomItem([1, 1, 1, 2, 2, 3])
        }
      }
      for (const event of activeEvents) {
        if (!holdItem && event.isActive(user as unknown as S.Users.Doc)) {
          /**
           * This likelihood will cut off at a maximum for some valuable items,
           * where their buy/sell price is ≥10 (whichever is higher). For
           * example when reapercloths are given out for Halloween the player
           * cannot hold more than 20 at a time.
           */
          const itemDropped = randomItem(event.encounterHoldItems)
          if (itemDropped) {
            const dbItem = ITEMS[itemDropped]
            const isValuable = Math.max(dbItem.buy, dbItem.sell) >= 10
            const eventDrop = isValuable ? (user.items[itemDropped] ?? 0) < 20 : true
            if (eventDrop && Math.random() < 0.2) {
              holdItem = itemDropped
            }
          }
        }
      }
      // Souvenirs logic
      if (user.lastLocations && !holdItem) {
        if (!user.lastLocations.includes(locationId || user.location)) {
          // Roll for souvenirs
          const getSouvenir = Math.random() < 0.2 // 20% chance to get souvenir if nothing else.
          if (getSouvenir) {
            // Update user locations when a souvenir is obtained
            user.lastLocations.unshift(locationId || user.location)
            user.lastLocations.splice(4, user.lastLocations.length) // Trim size
            const souvenirPool: Partial<Record<ItemId, number>> = {}
            for (const [collector, souvenir] of Object.entries(Souvenirs)) {
              if (hasItem(user, collector as ItemId)) {
                const souvenirId = typeof souvenir.item === 'function' ? 
                  souvenir.item(user.location) : souvenir.item
                const quantity = souvenir.quantity(location.forecast!, souvenirId)
                souvenirPool[souvenirId] = quantity
              }
            }
            holdItem = randomItem(Object.keys(souvenirPool))
            holdItemQuantity = souvenirPool[holdItem]
          }
        }
      } else if (!user.lastLocations) {
        user.lastLocations = [locationId || user.location || 'US-MTV']
      }
      
      // Add to bag
      if (holdItem) {
        if (items[holdItem] && items[holdItem] < 1_000) {
          awardItem(user, holdItem as ItemId, holdItemQuantity)
        } else if (!items[holdItem]) {
          awardItem(user, holdItem as ItemId, holdItemQuantity)
        }
      }
   
      const {researchCurrent} = await accomodateResearch(user as Users.Doc, badge.toLegacyString(), pokeball)
  
      try {
        await transaction.update(ref, {
          pokemon: user.pokemon,
          lastLocations: user.lastLocations,
          items,
          researchCurrent,
        })
        await A.updatePokedex(transaction._raw, {
          userId,
          speciesId: badge.toLegacyString(),
        })
      } catch (e) {
        throw new functions.https.HttpsError('internal', e)
      }
      const userWorth = calculateNetWorth(user)
      return {
        selectedPokemon: badge.toLegacyString(),
        badge,
        holdItem,
        userWorth,
        ditto: badge.id === 132 ? Badge.fromLegacy(randomItem(encounter.list)).toString() : undefined,
        zorua: badge.id === 570 ? Badge.fromLegacy(randomItem(encounter.list)).toString() : undefined,
        zoroark: badge.id === 571 ? Badge.fromLegacy(randomItem(encounter.list)).toString() : undefined,
        // For debug
        encounter,
        availablePokemon,
        pokemon: user.pokemon,
        balls: items[pokeball],
        lastLocations: user.lastLocations,
        bait: bait !== undefined ? {
          item: bait,
          remaining: items[bait],
        } : undefined
      }
    } catch (e) {
      throw new functions.https.HttpsError('failed-precondition', `Cannot use ${pokeball}: ${e}`)
    }
  })
  const {selectedPokemon, badge, holdItem, availablePokemon, balls, lastLocations} = txnRes
  const url = Sprite.pkmn(selectedPokemon)
  const details = await Utils.getPokemonDetails(selectedPokemon)
  let html = `<img src="${url}" /><br>
    You caught a wild ${details.species}!<br>`
  if (holdItem) {
    const label = ITEMS[holdItem].label
    html += `<br>It was holding a <strong>${label}</strong>! You placed it in your bag.<br><br>`
  }
  html += `${details.species} was sent to the PC!`
  const pokedex = `${details.species}'s information was added to the Pokédex:<br>
    <em>${details.pokedex}</em>
    `
  // if (userWorth > 1_000_000) {
    // Are there certain players who are catching too much via scripts?
    // This may result in database transactions failing elsewhere due to
    // contention.
    // await Utils.delay(1000) // Add a second to each function call
    // Hopefully this will be sufficient in creating enough of a buffer
    // to allow database events elsewhere to proceed.
  // }
  return {
    html, pokedex, selectedPokemon, duplicates, holdItem, badge: badge.toString(),
    balls, lastLocations, bait: txnRes.bait,
    debug: {
      availablePokemon,
    }
  }
})
const MAX_LENGTH = 5
const THRESHOLD = 60000 // 1 min
export function checkScripting(releasedTimes) {
  if (releasedTimes && releasedTimes.length >= MAX_LENGTH) {
    const lastReleaseDate = new Date(releasedTimes[MAX_LENGTH - 1])
    const now = new Date()
    if ((lastReleaseDate.getTime() + 1000 * 60 * 60 * 24 * 7) < now.getTime()) {
      return false // This is at least a week old, let them slide
    }
    const avg = (releasedTimes[MAX_LENGTH - 1] - releasedTimes[0]) / (releasedTimes.length - 1)
    if (avg < THRESHOLD) {
      return true
    }
  }
  return false
}
const RELEASE_DEADLINE = 1000 * 60 * 60 // 1 Hour
export const release = functions.https.onCall(async (data: F.Release.Req, context): Promise<F.Release.Res> => {
  const userId = context.auth!.uid
  console.log(`=== Release (${userId}) ===`)
  console.log(data)
  console.log('===')
  // Some cron tasks that manipulate items run at the top of the hour.
  // It is possible that these override the transaction that runs.
  // Let's check it.
  const now = new Date()
  if (now.getMinutes() < 5) {
    throw new functions.https.HttpsError('unavailable',
      'Please try this again at 5 minutes past the hour.')
  }
  if (data.pokemon && data.pokemon.length === 0) {
    throw new functions.https.HttpsError('failed-precondition',
      'No pokemon provided')
  }
  if (data.operations && data.operations.length === 0) {
    throw new functions.https.HttpsError('failed-precondition',
      'No operations provided')
  }
  const receivedItems = await db.runTransaction(async (t) => {
    const ref = db.collection('users').doc(userId)
    const userDoc = await t.get<Users.Doc>(ref)
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('invalid-argument', 'User does not exist');
    }
    const releasedLog = await t.get<ReleasedDoc>(ref.collection('adventureLog').doc('released'))
    if (releasedLog.exists) {
      const releasedDoc = releasedLog.data()
      const timeDiff = Date.now() - releasedDoc.releasedTime!
      const minutes = Math.ceil((RELEASE_DEADLINE - timeDiff) / (1000 * 60)) // MS -> Min
      if (timeDiff < RELEASE_DEADLINE) {
        throw new functions.https.HttpsError('failed-precondition',
          `You should wait a bit longer before doing this, maybe in ${minutes} minutes.`)
      }
    }
    const user = userDoc.data()
    if (data.pokemon) {
      try {
        const pokemonToRelease = data.pokemon.map(badge => Badge.fromLegacy(badge).toString())
        const receivedItems = genReleaseItems(user, pokemonToRelease)
        console.log('Release', userId, data.pokemon, receivedItems)
        await t.update(ref, {
          pokemon: user.pokemon,
          items: user.items,
        })
        return receivedItems
      } catch (e) {
        throw new functions.https.HttpsError('cancelled',
          `Error in genReleaseItems: ${e}`)
      }
    } else if (data.operations) {
      const receivedItems: ItemId[] = []
      for (const [id, count] of data.operations) {
        if (typeof count !== 'number') {
          throw new functions.https.HttpsError('failed-precondition',
            `${count} is not a number. Come on.`)
        }
        try {
          const badge = id.startsWith('potw-') ? Badge.fromLegacy(id).toString() : id as PokemonId
          receivedItems.push(...v2Release(user, badge, count))
          // await A.updateOnlyPokedex(t._raw, {
          //   userId,
          //   speciesId: new Badge(badge).toLegacyString(),
          // })
        } catch (e) {
          throw new functions.https.HttpsError('cancelled',
            `Error in v2Release: ${e}`)
        }
      }
      await t.update(ref, {
        pokemon: user.pokemon,
        items: user.items,
      })
      return receivedItems
    } else {
      throw new functions.https.HttpsError('failed-precondition',
        'No data fields selected')
    }
    return []
  })
  const releasedLog = await db.collection('users').doc(userId).
    collection('adventureLog')
    .doc('released')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .get<any>()
  const uniqueReleases = new Set()
  const pokemon = data.pokemon || [] // FIXME for new format
  if (releasedLog.exists) {
    // Append to current set
    const releasedBadgeSet = releasedLog.data().releasedBadges
    releasedBadgeSet.forEach(badge => {
      uniqueReleases.add(badge)
    })
    for (const species of pokemon) {
      uniqueReleases.add(species)
    }
    await releasedLog.ref.update({
      releasedBadges: Array.from(uniqueReleases),
      count: FieldValue.increment(pokemon.length),
      releasedTime: Date.now()
    })
  } else {
    // Generate adventure log
    for (const species of pokemon) {
      uniqueReleases.add(species)
    }
    await releasedLog.ref.set({
      releasedBadges: Array.from(uniqueReleases),
      count: FieldValue.increment(pokemon.length),
      releasedTime: Date.now()
    })
  }
  // Create a Map of your items and their counts
  const itemMap: Map<string, number> = new Map()
  receivedItems.forEach(item => itemMap.has(item)
      ? itemMap.set(item, itemMap.get(item)! + 1) : itemMap.set(item, 1)
  )
  if (receivedItems.length) {
    if (receivedItems.length === 1) {
      const item = receivedItems[0]
      return {
        html: `${Sprite.img(Sprite.item(item))}<br>
          You said good-bye to your Pokémon.
          As you did, you found a <b>${item}</b> and placed it in your bag.`,
        receivedItems,
        itemMap: {
          pokeball: itemMap.get('pokeball'),
          greatball: itemMap.get('greatball'),
          ultraball: itemMap.get('ultraball')
        },
        debug: {
          receivedItems: 1,
          string: '=1'
        }
      }
    } else if (receivedItems.length < 10) {
      return {
        html: `You said farewell to your Pokémon.
          As you did, you found some treasure and placed the items in your bag.<br><br>
          ${receivedItems.map(item => Sprite.img(Sprite.item(item))).join('')}`,
        receivedItems,
        itemMap: {
          pokeball: itemMap.get('pokeball'),
          greatball: itemMap.get('greatball'),
          ultraball: itemMap.get('ultraball')
        },
        debug: {
          receivedItems: receivedItems.length,
          string: '<10'
        }
      }
    } else {
      const cPokeball = itemMap.get('pokeball') || 0
      const cGreatball = itemMap.get('greatball') || 0
      const cUltraball = itemMap.get('ultraball') || 0
      return {
        html: `You thanked your Pokémon and let them move along.
          As you stared off into the sunset, you found some treasure bag.<br><br>
          ${Sprite.img(Sprite.item('pokeball'))} x${cPokeball.toLocaleString()}<br>
          ${Sprite.img(Sprite.item('greatball'))} x${cGreatball.toLocaleString()}<br>
          ${Sprite.img(Sprite.item('ultraball'))} x${cUltraball.toLocaleString()}`,
        itemMap: {
          pokeball: itemMap.get('pokeball'),
          greatball: itemMap.get('greatball'),
          ultraball: itemMap.get('ultraball')
        },
        receivedItems,
        debug: {
          receivedItems: receivedItems.length,
          string: 'else'
        }
      }
    }
  } else {
    return {
      html: `You said good-bye to your Pokémon.`
    }
  }
})
export const swarm_vote = functions.https.onCall(async (data: F.SwarmVote.Req, context): Promise<F.SwarmVote.Res> => {
  const {uid} = context.auth!
  const {species, position} = data
  // You can only vote cycle.
  // Reset fortnightly?
  // Votes will then get placed into `Swarms` structure.
  // Pass via location_list to client.
  const ref = db.collection('test').doc(position)
  return await db.runTransaction(async t => {
    const swarmCurrentDoc = await t.get<Swarm.Doc>(ref)
    const swarmCurrent: Swarm.Doc = (() => {
      const data = swarmCurrentDoc.data()
      if (data === undefined) {
        return {
          users: {},
          votes: {},
        }
      }
      return data
    })()
    // Layout has region-votes and region-voters.
    if (uid in swarmCurrent.users) {
      throw new functions.https.HttpsError('already-exists',
        `You already voted this cycle. Your vote was for ${swarmCurrent.users[uid]}.`)
    }
    const datastore = Pkmn.get(species)
    if (datastore === undefined) {
      throw new functions.https.HttpsError('not-found',
        `${species} is not a real thing.`)
    }
    if (Badge.fromLegacy(species).personality.shiny) {
      throw new functions.https.HttpsError('not-found',
        `${species} is too shiny.`)
    }
    if (position === 'swarm' && datastore.release === 'greatball') {
      throw new functions.https.HttpsError('not-found',
        `${species} is too great.`)
    }
    if (position === 'swarm' && datastore.release === 'ultraball') {
      throw new functions.https.HttpsError('not-found',
        `${species} is much too great.`)
    }
    if (swarmCurrentDoc.exists) {
      await t.update<Swarm.Doc>(ref, {
        [`votes.${species}`]: FieldValue.increment(1),
        [`users.${uid}`]: species
      })
    } else {
      await t.set<Swarm.Doc>(ref, swarmCurrent)
    }
    return {
      data,
    }
  })
})
export const swarm_notify = functions.firestore.document('test/swarm').onUpdate(async (change) => {
  const {before, after} = change
  if (Object.keys(after.data().users).length === 0) {
    // Reset
    const users = Object.keys(before.data().users)
    for (const u of users) {
      const userRef = db.collection('users').doc(u)
      const userDoc = await userRef.get<Users.Doc>()
      const user = userDoc.data()
      if (!user.notifications) continue
      sendNotification(user, {
        category: 'GAME_EVENT',
        title: 'Mass Outbreaks of Pokémon have changed!',
        body: `Pokémon migrations have changed. Explore the world to see what's new.`,
        link: '/pokemon/catch',
        icon: Sprite.item('pokeball'),
      })
      await userRef.update({
        notifications: user.notifications
      })
    }
  }
})
export const tag = functions.https.onCall(async (data: F.Tag.Req, context): Promise<F.Tag.Res> => {
  const userId = context.auth!.uid
  const {operations} = data
  if (!operations || !Array.isArray(operations)) {
    throw new functions.https.HttpsError('failed-precondition',
      'There is nothing to do.')
  }
  await db.runTransaction(async t => {
    const userRef = db.collection('users').doc(userId)
    const userDoc = await t.get<Users.Doc>(userRef)
    const user = userDoc.data()
    if (!user.pokemon) {
      throw new functions.https.HttpsError('failed-precondition',
        'There is nobody here.')
    }
    if (!hasPokemon(user, operations.map(x => x.species))) {
      throw new functions.https.HttpsError('failed-precondition',
        'Your tagging misses the mark.')
    }
    for (const op of operations) {
      const badge = new Badge(op.species)
      for (const tag of op.tags) {
        const isCustomTag = !DEFAULT_TAGS.includes(tag as Tag)
        if (op.shouldTag) {
          if (isCustomTag) {
            const tagIndex = user.customTags?.indexOf(tag)
            if (tagIndex === undefined ||tagIndex === -1) {
              throw new functions.https.HttpsError('failed-precondition',
                `Tag ${tag} is not a real tag`)
            }
            if (!badge.tags) {
              badge.tags = [tagIndex]
            } else {
              badge.tags.push(tagIndex)
            }
          } else {
            if (!badge.defaultTags) {
              badge.defaultTags = [tag as Tag]
            } else {
              badge.defaultTags.push(tag as Tag)
            }
          }
        } else {
          if (isCustomTag) {
            const tagIndex = user.customTags?.indexOf(tag)
            if (tagIndex === undefined || tagIndex === -1) {
              throw new functions.https.HttpsError('failed-precondition',
                `Tag ${tag} is not a real tag`)
            }
            const badgeTagIndex = badge.tags?.indexOf(tagIndex)
            if (badgeTagIndex === undefined || badgeTagIndex === -1) {
              throw new functions.https.HttpsError('failed-precondition',
                'You cannot use remove an untagged tag.')
            }
            if (!badge.tags) {
              badge.tags = []
            } else {
              badge.tags.splice(badgeTagIndex, 1)
            }
          } else {
            const index = badge.defaultTags?.indexOf(tag as Tag)
            if (index === undefined || index === -1) {
              throw new functions.https.HttpsError('failed-precondition',
                'You cannot use remove an untagged tag.')
            }
            if (!badge.defaultTags) {
              badge.defaultTags = []
            } else {
              badge.defaultTags.splice(index, 1)
            }
          }
        }
      }
      removePokemon(user, new Badge(op.species))
      addPokemon(user, badge)
    }
    // Update our Pokemon
    t.update(userRef, {
      pokemon: user.pokemon
    })
  })
  return 'Tags are implemented'
})
export const tag_manage = functions.https.onCall(async (data: F.TagManage.Req, context): Promise<F.TagManage.Res> => {
  if (!context.auth) {
    throw new functions.https.HttpsError('not-found', '')
  }
  const {uid} = context.auth!
  const {tags, action, index} = data
  await db.runTransaction(async t => {
    const ref = db.collection('users').doc(uid)
    const userDoc = await t.get<Users.Doc>(ref)
    const user = userDoc.data()
    if (!user.customTags) {
      user.customTags = []
    }
    if (action === 'PUSH') {
      tags.forEach(tag => {
        const sanitizedTag = tag.trim()
        if (sanitizedTag === undefined || sanitizedTag === '') {
          throw new functions.https.HttpsError('failed-precondition',
            `Cannot set custom tag ${tag}`)
        }
      })
      user.customTags.push(...tags)
    } else if (action === 'UPDATE') {
      if (index === undefined || index < 0) {
        throw new functions.https.HttpsError('out-of-range',
          'No index was provided to update')
      }
      for (let i = 0; i < tags.length; i++) {
        const sanitizedTag = tag[i].trim()
        if (sanitizedTag === undefined || sanitizedTag === '') {
          throw new functions.https.HttpsError('failed-precondition',
            `Cannot set custom tag ${i + index} to ${tags[i]}`)
        }
        user.customTags[i + index] = tags[i]
      }
    } else if (action === 'REMOVE') {
      for (const tag of tags) {
        const tagIndex = user.customTags.indexOf(tag)
        if (tagIndex === -1) {
          throw new functions.https.HttpsError('invalid-argument',
            `No existing tag found: '${tag}'`)
        }
        user.customTags.splice(tagIndex, 1)
      }
    } else {
      throw new functions.https.HttpsError('failed-precondition',
        'No action found for', action)
    }
    t.update<Users.Doc>(ref, {
      customTags: user.customTags
    })
  })
  return 'OK'
})