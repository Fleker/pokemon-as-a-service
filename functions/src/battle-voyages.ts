import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { salamander } from '@fleker/salamander'
import { DbRaid, Users } from './db-types'
import { F } from '../../shared/src/server-types'
import { Doc, Voyages, State, Leg, getScore, getBucket, Voyage, LegendaryBossConditions, getMaxVoyages } from '../../shared/src/voyages'
import { toRequirements } from './users'
import { getLocation } from './location'
import { SHINY_CHARM } from '../../shared/src/quests'
import {  inflate } from '../../shared/src/badge-inflate'
import { shinyRate } from './platform/game-config'
import { addPokemon, awardItem, hasPokemon, removePokemon } from './users.utils'
import { BadgeId, PokemonId } from '../../shared/src/pokemon/types'
import { Badge } from '../../shared/src/badge3'
import { ItemId, PokeballId } from '../../shared/src/items-list'
import randomItem from '../../shared/src/random-item'
import { Globe, WeatherType } from '../../shared/src/locations-list'
import { randomVariant } from '../../shared/src/farming'
import { get } from '../../shared/src/pokemon'
import { sendNotification } from './notifications'
import { pkmn } from '../../shared/src/sprites'
import * as I from '../../shared/src/gen/type-pokemon-ids'
import { myPokemon } from '../../shared/src/badge-inflate'
import {assignMarks} from '../../shared/src/ribbon-marks'

const db = salamander(admin.firestore())
const FieldValue = admin.firestore.FieldValue

export const voyage_create = functions.https.onCall(async (data: F.VoyageCreate.Req, context): Promise<F.VoyageCreate.Res> => {
  const {uid} = context.auth!
  const userRef = db.collection('users').doc(uid)
  const {voyage} = await db.runTransaction(async t => {
    const userDoc = await t.get<Users.Doc>(userRef)
    const user = userDoc.data()
    // 1. Verify the user can create this voyage.
    const selectedVoyage = Voyages[data.voyage]
    const location = await getLocation(user.location)
    const requirements = await toRequirements(user, location)
    // First verify primary condition
    if (!user.items['voyagepass']) {
      throw new functions.https.HttpsError('failed-precondition', 'Player requires the Voyage Pass')
    }

    // Now verify specific hints
    for (const hint of selectedVoyage.unlocked.hints) {
      if (!hint.completed(requirements)) {
        throw new functions.https.HttpsError('failed-precondition', hint.msg)
      }
    }

    // 2. Construct voyage object.
    const filterBadges = inflate(user.pokemon)!
    let leg0 = Leg.ITEM
    let leg1 = Leg.ITEM
    let leg2 = Leg.ITEM
    if (selectedVoyage.map) {
      leg0 = parseInt(Object.keys(selectedVoyage.map!)[0]!) as unknown as Leg
      const part1 = selectedVoyage.map![leg0]!
      leg1 = part1[0].leg
      const part2 = part1[0].next[0]!
      leg2 = part2.leg
    }
    const voyage: Doc = {
      vid: data.voyage,
      host: uid,
      shinyCharm: user.hiddenItemsFound.includes(SHINY_CHARM),
      weather: location.forecast ?? 'Sunny',
      players: {
        [uid]: {
          ldap: user.ldap,
          species: filterBadges[0],
          ready: false,
        }
      },
      playerList: [uid],
      legs: [leg0, leg1, leg2], // Host must select legs
      created: Date.now(),
      started: -1,
      state: State.CREATED,
      prizes: [], // None yet
    }

    let {voyagesActive} = user
    if (!voyagesActive) {
      voyagesActive = {}
    }
    if (voyagesActive[voyage.vid as string]) {
      throw new functions.https.HttpsError('failed-precondition',
        'You already have a voyage scheduled here.')
    }
    if (Object.keys(voyagesActive).length >= getMaxVoyages(user)) {
      throw new functions.https.HttpsError('out-of-range',
        `You are already in ${Object.keys(voyagesActive).length} voyages`)
    }

    return {voyage}
  })

  const doc = await db.collection('voyages').add<Doc>(voyage)
  await userRef.update({
    [`voyagesActive.${voyage.vid}`]: doc.id
  })

  return {
    voyage: data.voyage,
    docId: doc.id,
  }
})

export const violatesSpeciesClause = (raid: Doc, userId: string, pkmn: PokemonId) => {
  const suggested = new Badge(pkmn);
  const { id } = suggested
  let seen = false;
  for (const [uid, player] of Object.entries(raid.players??{})) {
    if (userId === uid) continue;
    const badge = player.species.startsWith('potw-') 
                ? Badge.fromLegacy(player.species)
                : new Badge(player.species)
    if (badge.id !== id) continue;
    if (seen || badge.personality.shiny === suggested.personality.shiny) {
      return true;
    }
    seen = true;
  }
  return false;
}

/**
 * Asserts all properties of a raid within a DB transaction or throws
 * @param raid The raid the user is trying to join
 * @param user The user who is trying to join the raid
 */
export async function voyageSelectPreconditionCheck(voyage: Doc, user: Users.Doc, userId: string, species: PokemonId | 'null' | 'first') {
  if (voyage.state != State.CREATED) {
    throw new Error('Cannot join this voyage')
  }

  if (species === 'null' && userId !== voyage.host) {
    if (voyage.players![userId] === undefined || !voyage.playerList.includes(userId)) {
      throw new Error('You are not in this raid. Sorry.')
    }
  }

  if (species === 'null') {
    return {state: 'LEAVE'}
  }

  if (violatesRoomSize(voyage, userId)) {
    throw new Error(`Precheck: The raid cannot handle any more players`)
  }

  const speciesToJoin: PokemonId = (() => {
    if (species === 'first') {
      const filterBadges = [...myPokemon(user.pokemon)].map(([k]) => k)
        .filter(b => {
          const badge = new Badge(b)
          return badge.toString() === b && !violatesSpeciesClause(voyage, userId, b)
        }) as PokemonId[]

      // Join raid quickly
      const buddy = (() => {
        for (const b of filterBadges) {
          const badge = new Badge(b)
          if (badge.defaultTags?.includes('BUDDY')) {
            return b
          }
        }
        return undefined
      })()
      if (buddy && filterBadges.includes(buddy)) return buddy
      return filterBadges[0]
    } else {
      // User selected a real Pokémon, do checks
      if (!hasPokemon(user, species)) {
        throw new Error(`You do not have this Pokémon ${species}`)
      }

      if (violatesSpeciesClause(voyage, userId, species)) {
        throw new Error(`You selected ${species} but the Species Clause allows only one of them. Try selecting a different Pokémon.`)
      }
      return species
    }
  })()

  return {state: 'JOIN', speciesToJoin}
}

/**
 * Set the room size as a function of rating.
 */
 export const violatesRoomSize = (voyage: Doc, userId: string) => {
  const raidPlus2 = (voyage.created) + 1000 * 60 * 60 * 24 * 2
  if (voyage.host === userId) return false
  if (voyage.players === undefined) return false
  if (voyage.players[userId] !== undefined) return false
  const roomSize = (() => {
    if (voyage.playerList.includes(voyage.host)) {
      // Enable last slot
      return 4
    } else if (Date.now() > raidPlus2) {
      return 4
    } else {
      return 3
    }
  })()
  if (voyage.playerList.length >= roomSize) return true
  return false
}

export const voyage_select = functions.https.onCall(async (data: F.VoyageSelect.Req, context): Promise<F.VoyageSelect.Res> => {
  const {uid} = context.auth!
  return await db.runTransaction(async t => {
    const ref = db.collection('users').doc(uid)
    const userDoc = await t.get<Users.Doc>(ref)
    const user = userDoc.data()

    const species: PokemonId | 'null' | 'first' = (() => {
      if (data.species === 'null' || data.species === 'first') {
        return data.species
      }
      return new Badge(data.species).toString()
    })()
    
    const voyageRef = db.collection('voyages').doc(data.voyageId)
    const voyageDoc = await t.get<Doc>(voyageRef)
    const voyage = voyageDoc.data()
    if (voyage.state !== State.CREATED) {
      throw new functions.https.HttpsError('out-of-range',
        'The voyage is already happening!')
    }
    // Verify user can join this voyage.
    // 1. Verify the user can create this voyage.
    const selectedVoyage = Voyages[voyage.vid]
    const location = await getLocation(user.location)
    const requirements = await toRequirements(user, location)
    // First verify primary condition
    if (!user.items['voyagepass']) {
      throw new functions.https.HttpsError('failed-precondition', 'Player requires the Voyage Pass')
    }

    // Now verify specific hints
    for (const hint of selectedVoyage.unlocked.hints) {
      if (!hint.completed(requirements)) {
        throw new functions.https.HttpsError('failed-precondition', hint.msg)
      }
    }

    try {
      const voyageId = data.voyageId
      const res = await voyageSelectPreconditionCheck(voyage, user, uid, species)
      if (res.state === 'LEAVE') {
        // Leave room
        delete voyage.players![uid]
        const playerList = Object.keys(voyage.players!)

        t.update<Doc>(voyageRef, {
          'players': voyage.players,
          playerList,
          // timestampLastUpdated: Date.now()
        })
        t.update<Users.Doc>(ref, {
          [`voyagesActive.${voyage.vid}`]: FieldValue.delete(),
        })


        if (4 === playerList.length && voyage.isPublic) {
          // Re-add if necessary
          const publicDoc = await db.collection('voyages').doc('_public').get()
          const {entries} = publicDoc.data() as PublicVoyages
          if (!(voyageId in entries)) {
            await publicDoc.ref.update({
              [`entries.${voyageId}`]: voyage.vid
            })
          }
        }

        if (voyage.players![uid]) {
          return 'ok'
        } else {
          return 'you are not in this voyage but ok'
        }
      } else if (res.state === 'JOIN') {
        // Check room size in transaction
        const playerList = Object.keys(voyage.players!)
        voyage.playerList = playerList

        if (violatesRoomSize(voyage, uid)) {
          throw new functions.https.HttpsError('failed-precondition',
            `The voyage cannot handle any more players`)
        }
        voyage.players![uid] = {
          species: res.speciesToJoin!,
          ready: data.ready, ldap: user.ldap,
        }

        let {voyagesActive} = user
        if (!voyagesActive) {
          voyagesActive = {}
        }
        if (voyagesActive[voyage.vid] && voyagesActive[voyage.vid] !== data.voyageId) {
          throw new functions.https.HttpsError('failed-precondition',
            'You already have a voyage scheduled here.')
        }
        if (!voyagesActive[voyage.vid] && Object.keys(voyagesActive).length >= getMaxVoyages(user)) {
          throw new functions.https.HttpsError('out-of-range',
            `You are already in ${Object.keys(voyagesActive).length} voyages`)
        }
        voyagesActive[voyage.vid] = data.voyageId

        t.update<Users.Doc>(ref, {voyagesActive})
        t.update<Doc>(voyageRef, {
          'players': voyage.players,
          playerList: Object.keys(voyage.players!),
          // timestampLastUpdated: Date.now(),
        })

        if (4 === Object.keys(voyage.players!).length && voyage.isPublic) {
          // Remove
          const publicDoc = await db.collection('voyages').doc('_public').get()
          const {entries} = publicDoc.data() as PublicVoyages
          if (voyageId in entries) {
            await publicDoc.ref.update({
              [`entries.${voyageId}`]: FieldValue.delete()
            })
          }
        } else if (voyage.isPublic) {
          // Update player count is not available
        }

        // Send notification when conditions make sense
        if (Object.keys(voyage.players!).length === 4) {
          // Player count is correct
          if (Object.values(voyage.players!).every(p => p.ready)) {
            // Okay we're good
            const hostRef = db.collection('users').doc(voyage.host)
            const hostDoc = await hostRef.get<Users.Doc>()
            const host = hostDoc.data()
            const icon = (() => {
              const hostedPkmn = new Badge(voyage.players[voyage.host].species)
              if (hostedPkmn.id === I.Finizen) {
                hostedPkmn.id = I.Palafin
              }
              return hostedPkmn
            })()
            try {
              sendNotification(host, {
                title: `Your voyage is ready to start`,
                category: 'PLAYER_EVENT',
                body: 'Every player in the voyage has been marked as ready',
                link: `/multiplayer/voyages?${voyageId}`,
                icon: pkmn(icon).toSprite(),
              })
            } catch (e) {
              console.error(`Could not send ready notification to ${host.ldap}`)
            }
            t.update<Users.Doc>(hostRef, {
              notifications: host.notifications,
            })
          }
        }

        return voyage.players![uid]
      }
      throw new functions.https.HttpsError('not-found', `Got invalid state ${res.state}`)
    } catch (e) {
      throw new functions.https.HttpsError('failed-precondition', e)
    }
  })
})

export const voyage_path = functions.https.onCall(async (data: F.VoyagePath.Req, context): Promise<F.VoyagePath.Res> => {
  const {uid} = context.auth!

  return await db.runTransaction(async t => {
    const voyageRef = db.collection('voyages').doc(data.voyageId) 
    const voyageDoc = await t.get<Doc>(voyageRef)
    const voyage = voyageDoc.data()

    if (voyage.host !== uid) {
      throw new functions.https.HttpsError('permission-denied', 'You cannot do this.')
    }

    /**
     * Valid legs are like
     * |--------------------------------------------|
     * | ITEM    ->   ITEM    -> ITEM   ->   RAID   |
     * |                                            |
     * | PKMN    ->   PKMN    -> PKMN   ->   RAID   |
     * |                                            |
     * | RARE    ->           -> ^      ->   RAID   |
     * |____________________________________________|
     */
    if (data.legs.length > 3) {
      throw new functions.https.HttpsError('out-of-range', `Incorrect legs: ${data.legs.length}`)
    }
    for (let i = 0; i < data.legs.length; i++) {
      if (data.legs[i] === Leg.RARE_ITEM && i !== 0) {
        throw new functions.https.HttpsError('failed-precondition',
          `You cannot do rare at ${i}`)
      }
      if (data.legs[i] === Leg.RARE_ITEM && data.legs[i + 1] !== 0) {
        throw new functions.https.HttpsError('failed-precondition',
          `You cannot do ${data.legs[i + 1]} at ${i + 1}`)
      }
    }

    t.update(voyageRef, {
      legs: data.legs
    })

    return {
      legs: data.legs
    }
  })
})

function pushCustomPokemon(leg: Leg, voyageDb: Voyage, weather: WeatherType, caught: BadgeId[]) {
  const pool = [...(voyageDb.legPokemon![leg] ?? voyageDb.pokemon[0])]
  pool.push(...voyageDb.weatherPokemon[weather])
  caught.push(randomItem(pool))
}

function pushCustomItems(leg: Leg, voyageDb: Voyage, prizes: ItemId[]) {
  for (let i = 0; i < 2; i++) {
    prizes.push(randomItem(voyageDb.legItems![leg] ?? voyageDb.rareitems[0]))
  }
}

function executeLeg(leg: Leg, voyageDb: Voyage, weather: WeatherType, bucket: number) {
  const prizes: ItemId[] = []
  const caught: BadgeId[] = []
  if (leg === Leg.ITEM) {
    // 3 pulls from the regular items pool
    for (let i = 0; i < 3; i++) {
      prizes.push(randomItem(voyageDb.items[bucket]))
    }
  } else if (leg === Leg.RARE_ITEM) {
    // 2 pulls from the rare items pool
    for (let i = 0; i < 2; i++) {
      prizes.push(randomItem(voyageDb.rareitems[bucket]))
    }
  } else if (leg === Leg.POKEMON) {
    // 1 pull from the Pokemon pool
    const pool = [...voyageDb.pokemon[bucket]]
    pool.push(...voyageDb.weatherPokemon[weather])
    caught.push(randomItem(pool))
  } else if ([
    Leg.FISHING, Leg.SAND, Leg.KITE,
    Leg.GREENGRASS, Leg.CYANBEACH, Leg.TAUPEHOLLOW, Leg.SNOWDROP, Leg.LAPIS,
    Leg.CAVERN, Leg.CLIFFS, Leg.FIELDS, Leg.WATERFALL,
    Leg.RICEFIELD, Leg.APPLEFIELD, Leg.CRYSTALLAKE, Leg.TIMELESSFOREST,
    Leg.BIOMECANYON, Leg.BIOMECOASTAL, Leg.BIOMESAVANNA, Leg.BIOMEPOLAR,
    Leg.PLAZAVERT, Leg.PLAZABLEU, Leg.PLAZAMAGENTA, Leg.PLAZAROUGE, Leg.PLAZAJAUNE,
  ].includes(leg)) {
    pushCustomPokemon(leg, voyageDb, weather, caught)
  } else if ([
    Leg.GREENGRASSBERRY, Leg.METALCHECK, Leg.DIVE, Leg.PLAZACENTR,
  ].includes(leg)) {
    pushCustomItems(leg, voyageDb, prizes)
  } else {
    // Not implemented
  }
  return {
    prizes,
    caught,
  }
}

/** Executable to run a voyage to completion */
async function runVoyage(voyageId: string): Promise<F.VoyageStart.Res> {
  const {voyage, voyageDb, boss} = await db.runTransaction(async t => {
    const voyageRef = db.collection('voyages').doc(voyageId)
    const voyageDoc = await t.get<Doc>(voyageRef)
    const voyage = voyageDoc.data()
    const hostRef = db.collection('users').doc(voyage.host)
    const hostDoc = await t.get<Users.Doc>(hostRef)
    const host = hostDoc.data()

    // Calculate voyage bucket
    const party = Object.values(voyage.players).map(player => player.species)
    const voyageScore = getScore(voyage.vid, party)
    const voyageDb = Voyages[voyage.vid]
    const bucket = (() => {
      try {
        return getBucket(voyageDb, voyageScore)
      } catch (e) {
        console.error('Cannot get bucket number', e)
        return 0
      }
    })()
    console.log(`Voyage ${voyageId} gets bucket ${bucket} with score ${voyageScore} for party ${party}`)

    // Execute every leg
    for (let i = 0; i < voyage.legs.length; i++) {
      // If we don't have 3 legs, this may cause a crash. Ah well.
      const legResult = executeLeg(voyage.legs[i], voyageDb, voyage.weather, bucket)
      // Return leg results into main doc
      const caught = legResult.caught.map(bid => Badge.create(bid))
        .map(badge => {
          badge.personality.location = host.location
          badge.personality.pokeball = ['pokeball', 'pokeball', 'greatball', 'ultraball'][bucket] as PokeballId
          if (Math.random() < 0.67) {
            // 67% to get variant
            badge.personality.variant = randomVariant(get(badge.toLegacyString())!)
          }
          if (Math.random() < shinyRate('dowsing', host.hiddenItemsFound)) {
            badge.personality.shiny = true
          }
          badge.personality.isOwner = true
          // Timezone doesn't matter
          badge.ribbons = assignMarks({forecast: voyage.weather, timezone: 'Africa/Accra'}, 'voyage')
          return badge.toString()
        })
      voyage.prizes.push({
        items: [...legResult.prizes],
        caught: [...caught],
      })
    }
    console.log(`Voyage ${voyageId} - All prizes: ${voyage.prizes.map(p => JSON.stringify(p)).join(', ')}`)


    // Create a raid at the end
    const raidPool = (() => {
      if (bucket === 0) {
        // Create a raid based on common pool
        const pool = [...voyageDb.pokemon[bucket]]
        pool.push(...voyageDb.weatherPokemon[voyage.weather])
        // Or also include any Pokemon from any leg
        if (voyageDb.legPokemon) {
          Object.values(voyageDb.legPokemon ?? [[]]).forEach(l => {
            l.forEach(p => {
              pool.push(p)
            })
          })
        }
        return pool
      } else if (bucket === 1 || bucket === 2) {
        // Create a raid based on common boss pool
        return voyageDb.bosses[0]
      } else {
        // Create a legendary-level raid
        return voyageDb.bosses[1]
      }
    })()

    // Adjust possible bosses based on weather.
    const filteredRaidPool = raidPool.filter(boss => {
      if (LegendaryBossConditions[boss] && LegendaryBossConditions[boss] !== voyage.weather) {
        return false
      }
      return true
    })
    const raidBoss = randomItem(filteredRaidPool)
    const raidBadge = Badge.fromLegacy(raidBoss)
    raidBadge.personality.variant = randomVariant(get(raidBoss)!)
    const boss = raidBadge.toLegacyString()

    const raidPlayers = {}
    Object.entries(voyage.players).forEach(([key, value]) => {
      raidPlayers[key] = {
        ready: false, // Players will want to swap partners
        ldap: value.ldap,
        species: new Badge(value.species).toLegacyString()
      }
    })
    // Create deterministic ID that won't be accidentally overwritten
    const raidId = `v-${voyageId}`
    await t.set<DbRaid>(db.collection('raids').doc(raidId), {
      boss,
      host: voyage.host,
      isPublic: false,
      location: host.location,
      locationLabel: Globe[host.location].label,
      locationWeather: voyage.weather,
      playerList: voyage.playerList,
      rating: 11,
      state: 0,
      timestamp: FieldValue.serverTimestamp(),
      timestampLastUpdated: FieldValue.serverTimestamp(),
      wishes: 0,
      players: raidPlayers,
      shinyCharm: voyage.shinyCharm,
      log: '',
    })
    console.log(`Voyage ${voyageId} - VS ${boss} at ${raidId}`)
    voyage.raidId = raidId
    voyage.raidBoss = raidBadge.toString()

    // Update our voyage
    voyage.state = State.COMPLETE
    voyage.claimList = voyage.playerList // Everyone needs to claim.
    t.update<Doc>(voyageRef, voyage)

    return {voyage, voyageDb, boss}
  })

  for (const [key, player] of Object.entries((voyage as Doc).players)) {
    const playerDoc = await db.collection('users').doc(key).get<Users.Doc>()
    const playerData = playerDoc.data()
    sendNotification(playerData, {
      title: `Your ${new Badge(player.species).toLabel()} returned from the ${voyageDb.label} Voyage!`,
      body: `They have found a number of rewards for you. Visit the page to claim them.`,
      category: 'VOYAGE_COMPLETE',
      icon: pkmn(new Badge(player.species).toSprite()),
      link: `/multiplayer/voyages?${voyageId}`
    })
    playerData.raidActive![voyage.raidId] = {
      boss,
      rating: 11,
      reason: 'Voyage raid'
    }
    try {
      // Maybe this won't happen.
      playerDoc.ref.update({
        raidActive: playerData.raidActive,
        notifications: playerData.notifications,
      })
    } catch (e) { /* Ignore error */ }
  }

  return {voyageId, raidId: voyage.raidId}
}

/** Runs the voyage from beginning to end. This might not be user-callable, but a cron instead. */
export const voyage_start = functions.https.onCall(async (data: F.VoyageStart.Req, context): Promise<F.VoyageStart.Res> => {
  console.log('Voyage Start: ' + data.voyageId)
  return await db.runTransaction(async t => {
    const voyageRef = db.collection('voyages').doc(data.voyageId)
    const voyageDoc = await t.get<Doc>(voyageRef)
    const voyage = voyageDoc.data()

    if (voyage.host !== context.auth!.uid) {
      throw new functions.https.HttpsError('permission-denied', 'You cannot do this.')
    }

    if (voyage.state !== State.CREATED) {
      throw new functions.https.HttpsError('out-of-range',
        'Your voyage has already started')
    }

    if (voyage.playerList.length === 0) {
      throw new functions.https.HttpsError('out-of-range',
        'You cannot go on a voyage if nobody is on the voyage!')
    }

    // Start our voyage
    t.update<Doc>(voyageRef, {
      started: Date.now(),
      state: State.STARTED,
    })

    if (voyage.isPublic) {
      await db.runTransaction(async transaction => {
        const publicRef = db.collection('voyages').doc('_public')
    
        await transaction.update(publicRef, {
          [`entries.${data.voyageId}`]: FieldValue.delete(),
        })
      })
    }

    return data.voyageId
  })
})

// At the 30th minute of every hour
export const voyage_completion_cron = functions.pubsub.schedule('30 * * * *').onRun(async () => {
  // ~1 day
  // At most it's 22h + 59m => 23h
  const startMin = Date.now() - 1000 * 60 * 60 * 22
  const voyagesToComplete = await db.collection('voyages')
    .where('started', '>', 0)
    .where('started', '<', startMin)
    .where('state', '==', 1) /* Started */
    .get<Doc>()
  
  console.log(`Found ${voyagesToComplete.docs.length} voyages to complete`)
  for (const voyage of voyagesToComplete.docs) {
    await runVoyage(voyage.id)
  }
  console.log(`Finished running ${voyagesToComplete.docs.length} started voyages`)

  // Expire unstarted voyages after some point
  // If a raid has been sitting for over a week, auto-run
  const expireMin = Date.now() - 1000 * 60 * 60 * 24 * 7
  const voyagesToExpire = await db.collection('voyages')
    .where('created', '<', expireMin)
    .where('state', '==', 0) /* Created */
    .get<Doc>()
  console.log(`Found ${voyagesToExpire.docs.length} voyages to expire`)
  for (const voyage of voyagesToExpire.docs) {
    if (voyage.data().playerList.length === 0) continue // Skip no-player voyages
    try {
      await runVoyage(voyage.id)
    } catch (e) {
      console.error(`error with expired voyage ${voyage.id}: ${e}`)
    }
  }
  console.log(`Finished running ${voyagesToExpire.docs.length} expired voyages`)

  // Clear out any public voyages that shouldn't be here anymore
  const publicRef = db.collection('voyages').doc('_public')
  const publicDoc = await publicRef.get<PublicVoyages>()
  const {entries} = publicDoc.data()

  for (const voyageId of Object.keys(entries)) {
    const publicVoyageDoc = await db.collection('voyages').doc(voyageId).get<Doc>()
    const publicVoyage = publicVoyageDoc.data()
    console.log(`Check public voyage ${voyageId}: ${publicVoyage.state}`)
    if (publicVoyage.state !== 0) {
      // Not 'Created'
      console.log(`Remove public voyage ${voyageId}`)
      await publicRef.update({
        [`entries.${voyageId}`]: FieldValue.delete(),
      })
    }
  }

  await db.collection('admin').doc('cron').update({
    voyageCompletionCron: Date.now()
  })
})

/**
 * Prizes need to be manually claimed to avoid txn issues.
 * Also, players need to prep for the raid anyway.
 */
export const voyage_claim = functions.https.onCall(async (data: F.VoyageClaim.Req, context): Promise<F.VoyageClaim.Res> => {
  const userId = context.auth!.uid
  const {voyageId} = data

  return await db.runTransaction(async t => {
    const userRef = db.collection('users').doc(userId)
    const userDoc = await t.get<Users.Doc>(userRef)
    const user = userDoc.data()

    const voyageRef = db.collection('voyages').doc(voyageId)
    const voyageDoc = await t.get<Doc>(voyageRef)
    const voyage = voyageDoc.data()

    if (voyage.state !== State.COMPLETE) {
      throw new functions.https.HttpsError('out-of-range',
        'The voyage is not done yet!')
    }

    if (!voyage.claimList) {
      throw new functions.https.HttpsError('failed-precondition',
        'There is nothing to be claimed.')
    }

    if (!user.voyagesActive) {
      throw new functions.https.HttpsError('failed-precondition',
        'User has no active voyages')
    }

    if (!user.voyagesActive[voyage.vid]) {
      throw new functions.https.HttpsError('failed-precondition',
        'User has no active voyages of this kind')
    }

    if (user.voyagesActive[voyage.vid] !== voyageId) {
      throw new functions.https.HttpsError('failed-precondition',
        'User has no active voyages of this ID')
    }

    const claimIndex = voyage.claimList.indexOf(userId)
    // if (claimIndex < 0 || false) { // FIXME
    //   throw new functions.https.HttpsError('out-of-range',
    //     'You have already claimed prizes here, or were never on this voyage!')
    // }
    if (claimIndex >= 0) {
      voyage.claimList.splice(claimIndex, 1) // Remove user

      voyage.prizes.forEach(prize => {
        prize.items.forEach(item => {
          awardItem(user, item)
        })
        prize.caught.forEach(pid => {
          addPokemon(user, new Badge(pid))
        })
      })

      // Finizen evolves into Palafin in a 'Union Circle'
      const playerSelectedPokemon = new Badge(voyage.players[userId].species)
      if (playerSelectedPokemon.id === I.Finizen) {
        // Evolve!
        try {
          removePokemon(user, playerSelectedPokemon)
          playerSelectedPokemon.id = I.Palafin
          playerSelectedPokemon.personality.form = 'zero'
          addPokemon(user, playerSelectedPokemon)
          // Update this in our database
          voyage.players[userId].species = playerSelectedPokemon.toString()
        } catch (e) {
          // Uh-oh. Is the Finizen lost?
          console.error(e)
        }
      }
    }

    t.update<Users.DbDoc>(userRef, {
      voyagesCompleted: FieldValue.increment(1),
      [`voyagesActive.${voyage.vid}`]: FieldValue.delete(),
      pokemon: user.pokemon,
      items: user.items,
    })

    t.update<Doc>(voyageRef, {
      claimList: voyage.claimList,
      players: voyage.players
    })

    return voyageId
  })
})

interface PublicVoyages {
  // [key: DBKey]: [VoyageType]
  entries: Record<string, string>
}

export const voyage_publicize = functions.https.onCall(async (data: F.VoyagePublicize.Req, context): Promise<F.VoyagePublicize.Res> => {
  const userId = context.auth!.uid
  const {voyageId} = data
  const doc = await db.collection('voyages').doc(voyageId).get<Doc>()
  const voyage = doc.data()
  if (voyage.host !== userId) {
    throw new functions.https.HttpsError('failed-precondition',
      'Only the host can publish a new raid')
  }
  if (voyage.state !== State.CREATED) {
    throw new functions.https.HttpsError('failed-precondition',
      `The raid cannot be published in its current state ${voyage.state}`)
  }

  await db.collection('voyages').doc(voyageId).update({isPublic: true})

  await db.runTransaction(async transaction => {
    const publicRef = db.collection('voyages').doc('_public')
    const publicDoc = await transaction.get<PublicVoyages>(publicRef)
    const {entries} = publicDoc.data()

    if (voyageId in entries) {
      throw new functions.https.HttpsError('already-exists',
        'This voyage is already marked as public.')
    }

    await transaction.update(publicRef, {
      [`entries.${voyageId}`]: voyage.vid,
    })
  })

  return {
    voyageId,
    vid: voyage.vid,
  }
})
