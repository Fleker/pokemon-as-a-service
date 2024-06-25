import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import spacetime from 'spacetime'
import {salamander} from '@fleker/salamander'

import { randomItem } from './utils'
import {BadgeId, PokemonDoc, PokemonId, Type} from '../../shared/src/pokemon/types'
import * as Pkmn from '../../shared/src/pokemon'
import {Badge} from '../../shared/src/badge3'
import { DbRaid, Users } from './db-types';
import { Location, LocationId } from '../../shared/src/locations-list'
import {
  SHINY_CHARM, POKEDOLL, GLOBAL_QUEST_DATE,
} from '../../shared/src/quests';
import { isAdmin } from './platform/game-config'
import { Movepool } from './../../shared/src/battle/movepool';
import { Inventory } from './../../shared/src/battle/inventory';
import {Pokemon} from './../../shared/src/battle/types'
import { ConditionMap } from './../../shared/src/battle/status';
import { targetSelection, moveSelection, statAdjustment } from './../../shared/src/battle/natures'
import { RuntimeOptions } from 'firebase-functions';
import { CREATED, COMPLETED, IN_PROGRESS, EXPIRED, violatesRoomSize, raidBattleSettings, getPityCount, raidSelectPreconditionCheck } from './battle-raid.utils';
import { getLocation } from './location';
import { RaidBoss, bossPrizes, BOOSTED_SHINY, getAvailableBosses, bossHeldItem } from '../../shared/src/raid-bosses';
import { MONTH_THEME, timeBoss, standardBosses, forecastBoss, regionBoss, terrainBoss } from '../../shared/src/raid-bosses';
import { hasItem, awardItem, calculateNetWorth, addPokemon } from './users.utils';
import { ItemId } from '../../shared/src/items-list';
import { timeOfDay } from './location.utils';

import * as A from './adventure-log'
import { Requirements } from '../../shared/src/legendary-quests';
import { forEveryUser } from './admin';
import { getAllPokemon } from '../../shared/src/badge-inflate'
import { toRequirements } from './users'
import { accomodateResearch } from './research-quests'
import { sendNotification } from './notifications'
import { ITEMS } from '../../shared/src/items-list'
import { item, pkmn } from '../../shared/src/sprites'
import { EXPIRY_TIME } from '../../shared/src/raid-settings'
import { Notification, PublicRaidsDoc } from '../../shared/src/server-types'
import { typePrizes } from '../../shared/src/raid-prizes'
import {BattleOptions, execute, ExecuteLog} from '../../shared/src/battle/battle-controller'
import isDemo from '../../shared/src/platform/isDemo'
import { myPokemon } from '../../shared/src/badge-inflate'
import { assignMarks } from '../../shared/src/ribbon-marks'

const _db = admin.firestore()
const db = salamander(_db)
const FieldValue = admin.firestore.FieldValue
const allSettled = require('promise.allsettled');

const getRaidBoss = (rating: number, location: Location, charms: string[], questArgs: Requirements, desiredBoss?: BadgeId): RaidBoss => {
  const tod = timeOfDay(spacetime(new Date(), location.timezone))
  const filterBosses = getAvailableBosses(rating, location, charms, questArgs, tod)

  const simpleBoss = (() => {
    if (desiredBoss && filterBosses.find(b => b.species === desiredBoss)) {
      return {species: desiredBoss}
    }
    return randomItem(filterBosses) as RaidBoss
  })()
  const badge = Badge.create(simpleBoss.species)
  return {
    heldItem: simpleBoss.heldItem,
    species: badge.toLegacyString(),
  }
}

const teraShardTypes: Partial<Record<ItemId, Type>> = {
  'teranormal': 'Normal',
  'terafire': 'Fire',
  'terawater': 'Water',
  'teraelectric': 'Electric',
  'teraground': 'Ground',
  'terarock': 'Rock',
  'teradragon': 'Dragon',
  'teraflying': 'Flying',
  'terafairy': 'Fairy',
  'terabug': 'Bug',
  'terapsychic': 'Psychic',
  'teraghost': 'Ghost',
  'terapoison': 'Poison',
  'teragrass': 'Grass',
  'teradark': 'Dark',
  'terasteel': 'Steel',
  'terafighting': 'Fighting',
  'teraice': 'Ice',
}

const claimRaidBoss = (species: BadgeId, location: LocationId, raid: DbRaid, holding: ItemId = 'lum') => {
  const badge = Badge.create(species)
  badge.personality.pokeball = 'premierball'
  badge.personality.location = location
  if (holding === 'maxmushroom' || holding === 'maxhoney') {
    badge.personality.gmax = true
  }
  if (teraShardTypes[holding] !== undefined) {
    badge.personality.teraType = teraShardTypes[holding]
  }
  badge.personality.isOwner = true
  // Timezone doesn't matter
  badge.ribbons = assignMarks({forecast: raid.locationWeather, timezone: 'Africa/Accra'}, 'raid')
  if (raid.rating === 6) {
    badge.ribbons.push('👑') // Mightiest
  }
  return badge
}

const checkShiny = (raid) => {
  const db = Pkmn.get(raid.boss)!
  if (db.shiny === 'FALSE') return 0 // Never be shiny
  const raidDefault = (() => {
    const boss = Badge.fromLegacy(raid.boss)
    for (const booster of BOOSTED_SHINY) {
      const boostedBadge = Badge.fromLegacy(booster)
      if (boostedBadge.id === boss.id) {
        return 64 // 4x as likely
      }
    }
    return 256
  })()
  if (raid.shinyCharm) {
    return 3/raidDefault
  }
  return 1/raidDefault
}

export const raid_create = functions.https.onCall(async (data, context) => {
  const host = context.auth!.uid
  const {rating} = data

  if (!Number.isInteger(rating)) {
    throw new functions.https.HttpsError('failed-precondition',
      `You cannot create a raid with this condition`)
  }

  if (isAdmin(host)) {
    // We're all good here
  } else {
    const supportLegendaryRaid = GLOBAL_QUEST_DATE()
    if (rating === 6 && !supportLegendaryRaid) {
      throw new functions.https.HttpsError('failed-precondition',
          `You, yes you specifically, cannot create a ${rating}-star raid`)
    }
    if (rating < 1 || rating > raidBattleSettings.length) {
      throw new functions.https.HttpsError('failed-precondition',
          `You, yes you specifically, cannot create a ${rating}-star raid`)
    }
  }

  const hostDoc = await db.collection('users').doc(host).get()
  const hostData = hostDoc.data() as Users.Doc
  if (!hostData.hiddenItemsFound.includes(POKEDOLL)) {
    throw new functions.https.HttpsError('failed-precondition',
    'To host raids you must first have a transit pass')
  }

  // Get player current location
  const hostLocation = hostData.location || 'US-MTV'
  const location = await getLocation(hostLocation)
  // Check eligibility
  const questArgs: Requirements = toRequirements(hostData, location)
  if (raidBattleSettings[rating].eligible && !raidBattleSettings[rating].eligible!(questArgs)) {
    throw new functions.https.HttpsError('failed-precondition',
      `You are ineligible to create a ${rating}-star raid`)
  }
  const boss = getRaidBoss(rating, location, hostData.hiddenItemsFound, questArgs)
  console.info(`Select boss ${boss.species}`)
  if (!boss || !boss.species) {
    throw new functions.https.HttpsError('out-of-range',
      `Unable to get a raid boss for a ${rating}-star raid. ` +
      `Boss ${boss} does not exist.`)
  }
  // Create a raid object
  // Auto-enroll host
  let filterBadges = getAllPokemon(hostData)
  if (rating === 7) {
    filterBadges = filterBadges.filter(
      b => Pkmn.get(b)?.tiers?.includes('Tiny Cup')
    )
  }
  const entry: DbRaid = {
    host,
    players: {
      [host]: {
        ldap: hostData.ldap,
        ready: false,
        species: Badge.fromLegacy(filterBadges[0]).toString(),
      }
    },
    playerList: [host],
    timestamp: FieldValue.serverTimestamp(),
    timestampLastUpdated: FieldValue.serverTimestamp(),
    rating,
    boss: boss.species,
    bossHeldItem: boss.heldItem ?? 'lum',
    location: hostLocation,
    locationLabel: location.label,
    locationWeather: location.forecast!,
    shinyCharm: hostData.hiddenItemsFound.includes(SHINY_CHARM),
    state: CREATED,
    isPublic: false,
    wishes: 0,
  }

  if (!hostData.lastRaidDate) {
    // Add this field before the following transaction
    await db.runTransaction(async transaction => {
      const ref = db.collection('users').doc(host)
      const lastRaidDate = 0
      await transaction.update(ref, {lastRaidDate})
    })
  }

  let {raidActive} = hostData
  if (!raidActive) {
    raidActive = {}
  }

  // Give raid pass
  await db.runTransaction(async transaction => {
    // Raid pass
    const ref = db.collection('users').doc(host)
    const userDoc = await transaction.get(ref)
    const user = userDoc.data() as Users.Doc
    const {items} = user

    const wishes = raidBattleSettings[rating].wishes
    const hasWishingPieces = hasItem(user, 'wishingpiece', wishes)
    // Check against a `lastRaidDate` field to prevent someone from
    // creating too many raids at the same time
    if (user.lastRaidDate) {
      const timeDiff = Date.now() - user.lastRaidDate
      const minCooldown = 1000 * 60 * 60 * 0.5 // 1/2 hour
      const minMinutes = Math.ceil((minCooldown - timeDiff) / 1000 / 60) // Seconds -> minutes
      if (!hasWishingPieces) {
        throw new functions.https.HttpsError('failed-precondition',
          `You do not have enough wishing pieces to do this.`)
      }
      if (timeDiff < minCooldown) {
        throw new functions.https.HttpsError('failed-precondition',
          `You've been raiding far too much. Try again later: ${minMinutes} minutes difference.`)
      }
      // Wishing piece deduction behavior
      items.wishingpiece! -= wishes
    }
    const lastRaidDate = Date.now()
    await transaction.update(ref, {items, lastRaidDate})
  })

  const raidId = await db.collection('raids').add(entry)

  raidActive![raidId.id] = {
    boss: boss.species as BadgeId,
    rating,
    reason: 'Created raid'
  }

  // Update
  await hostDoc.ref.update({ raidActive })

  return {
    raidId: raidId.id,
    boss,
    debug: {
      terrainBoss,
      regionBoss,
      standardBosses,
      forecastBoss,
      timeBoss,
      MONTH_THEME,
      BOOSTED_SHINY,
      bossHeldItem,
    }
  } as any
})

export const raid_publicize = functions.https.onCall(async (data, context) => {
  const userId = context.auth!.uid
  const {raidId} = data
  const doc = await db.collection('raids').doc(raidId).get()
  const raid = doc.data() as DbRaid
  if (raid.host !== userId) {
    throw new functions.https.HttpsError('failed-precondition',
      'Only the host can publish a new raid')
  }
  if (raid.state !== CREATED) {
    throw new functions.https.HttpsError('failed-precondition',
      `The raid cannot be published in its current state ${raid.state}`)
  }

  await db.collection('raids').doc(raidId).update({isPublic: true})

  await db.runTransaction(async transaction => {
    const publicRef = db.collection('raids').doc('_public')
    const publicDoc = await transaction.get<PublicRaidsDoc>(publicRef)
    const {list} = publicDoc.data()

    if (list.filter(entry => entry.id === raidId).length) {
      throw new functions.https.HttpsError('already-exists',
        'This raid is already marked as public.')
    }

    list.unshift({
      boss: raid.boss,
      id: raidId,
      rating: raid.rating,
      players: raid.playerList.length,
    })
    await transaction.update<PublicRaidsDoc>(publicRef, {list})
  })
})

/**
 * API params for raid_wish
 */
interface RaidWishParams {
  /**
   * ID of the raid to wish for. You must own this raid.
   */
  raidId: string
  /**
   * The boss you wish for. You must be pityable and this must be a valid boss.
   */
  wishForBoss?: BadgeId
}
export const raid_wish = functions.https.onCall(async (data: RaidWishParams, context) => {
  const userId = context.auth!.uid
  const {raidId, wishForBoss} = data
  const raidRef = db.collection('raids').doc(raidId)
  const ref = db.collection('users').doc(userId)
  // Check user wishing pieces and update
  const {isPublic, newboss, willPity} = await db.runTransaction(async transaction => {
    // Get raid preconditions
    const doc = await transaction.get(raidRef)
    const raid = doc.data() as DbRaid
    const expiryTime = raidBattleSettings[raid.rating].expires

    if (raid.rating < 1 || raid.rating > raidBattleSettings.length) {
      throw new functions.https.HttpsError('failed-precondition',
          `You cannot wish about a ${raid.rating}-star raid`)
    }

    if (!raidBattleSettings[raid.rating].canWish) {
      // Special case
      throw new functions.https.HttpsError('failed-precondition',
          `You cannot wish about a ${raid.rating}-star raid`)
    }

    if (raid.host !== userId) {
      throw new functions.https.HttpsError('failed-precondition',
          `You cannot wish when it is not your raid`)
    }

    const timestamp = raid.timestamp as FirebaseFirestore.Timestamp
    if (timestamp.toMillis() < Date.now() - expiryTime) {
      // await doc.ref.update({ state: EXPIRED })
      throw new functions.https.HttpsError('failed-precondition',
        'This raid has expired')
    }

    // Raid pass
    const user = await transaction.get(ref)

    let willPity = false
    if (raid.wishes > getPityCount(user.data() as Users.Doc)) {
      console.info('Bad luck buddy')
      if (wishForBoss) {
        console.info(`You really want to get a ${wishForBoss}`)
      }
      willPity = true
    }

    if (!willPity) {
      const {items} = user.data()!
      if (items.wishingpiece && items.wishingpiece > 0) {
        items.wishingpiece--
      } else {
        throw new functions.https.HttpsError('failed-precondition',
          `You do not have a wishing piece`)
      }
      await transaction.update(ref, {items})
    }

    // Reselect boss
    const {boss, locationWeather, wishes} = raid
    // Get player current location
    const hostData = user.data() as Users.Doc
    const hostLocation = hostData.location || 'US-MTV'
    const location = await getLocation(hostLocation)
    location.forecast = locationWeather // Static weather
    // Check eligibility
    const questArgs: Requirements = toRequirements(hostData, location)

    const newboss = (() => {
      let nextBoss: RaidBoss = {
        species: boss as BadgeId
      }
      while (nextBoss.species === boss) {
        // We may pity the player and let them pick.
        // The UI to do this may come later.
        nextBoss = getRaidBoss(raid.rating, location, user.data()!.hiddenItemsFound, questArgs, willPity ? wishForBoss : undefined)
      }
      return nextBoss
    })()

    // Nobody is ready for this
    Object.keys(raid.players!).forEach(key => {
      raid.players![key].ready = false
    })

    // Update raid
    await transaction.update<DbRaid>(raidRef, {
      boss: newboss.species,
      bossHeldItem: newboss.heldItem ?? 'lum',
      players: raid.players,
      timestampLastUpdated: FieldValue.serverTimestamp(),
      wishes: wishes + 1,
    })

    // Update active raids
    const {raidActive} = hostData
    if (!raidActive![raidId]) {
      raidActive![raidId] = {
        boss: boss as BadgeId,
        rating: raid.rating,
        reason: 'Created raid'
      }
    }
    raidActive![raidId].boss = newboss.species as BadgeId
    await transaction.update(ref, { raidActive })

    return {
      isPublic: raid.isPublic,
      newboss,
      willPity,
    }
  })

  if (isPublic) {
    await db.runTransaction(async transaction => {
      const publicRef = db.collection('raids').doc('_public')
      const publicDoc = await transaction.get<PublicRaidsDoc>(publicRef)
      const {list} = publicDoc.data()
      const listIndex = list.findIndex(value => value.id === raidId)
      if (listIndex === -1) {
        console.error(`Cannot find public raid ${raidId} in list`)
      } else {
        list[listIndex].boss = newboss.species
        await transaction.update<PublicRaidsDoc>(publicRef, {list})
      }
    })
  }

  return {
    isPublic,
    newboss,
    raidId,
    willPity,
  }
})

/**
 * Closes raid in a transaction in a 'best case' approach.
 * If the transaction fails, don't do anything about it.
 * This may result in stale public raids.
 *
 * @param raidId /raids/<doc-id>
 */
async function closeRaid(raidId) {
  const transaction = db.runTransaction(async transaction => {
    const publicRef = db.collection('raids').doc('_public')
    const publicDoc = await transaction.get<PublicRaidsDoc>(publicRef)
    const {list} = publicDoc.data()
    const listIndex = list.findIndex(value => value.id === raidId)
    if (listIndex > -1) {
      list.splice(listIndex, 1)
      await transaction.update<PublicRaidsDoc>(publicRef, {list})
    }
  })
  await allSettled([transaction])
}

export const raid_select = functions.https.onCall(async (data, context) => {
  const userId = context.auth!.uid
  const {item, raidId} = data
  const dataSpecies: BadgeId | PokemonId | 'null' | 'first' = data.species

  console.log('1', data.species)

  const species: PokemonId | 'null' | 'first' = (() => {
    if (dataSpecies === 'null' || dataSpecies === 'first') {
      return dataSpecies
    }
    return dataSpecies.startsWith('potw-') ?
      Badge.fromLegacy(dataSpecies).toString() :
      new Badge(dataSpecies).toString()
  })()

  console.log('2', data.species, species)

  let {ready} = data
  if (ready === undefined) {
    ready = true
  }

  try {
    return await db.runTransaction(async t => {
      const userRef = db.collection('users').doc(userId)
      const userDoc = await t.get(userRef)
      const raidRef = db.collection('raids').doc(raidId)
      const raidDoc = await t.get(raidRef)

      const raid  = raidDoc.data() as DbRaid
      const user = userDoc.data() as Users.Doc

      // Pass precondition check or throw
      try {
        const res = await raidSelectPreconditionCheck(raid, user, userId, species, item)
        console.log('3', species, res.state)
        if (res.state === 'LEAVE') {
          // Leave room
          delete raid.players![userId]
          const playerList = Object.keys(raid.players!)

          if (raid.host !== userId) {
            const {items} = userDoc.data()!
            if (items.raidpass) {
              items.raidpass += res.raidPrice
            } else {
              items.raidpass = res.raidPrice
            }
            t.update<Users.Doc>(userRef, {items})
          }

          if (raid.host === userId) {
            // Let's re-select a host
            raid.host = randomItem(playerList)
            const newHostRef = db.collection('users').doc(raid.host)
            const newHostDoc = await newHostRef.get<Users.Doc>()
            const newHost = newHostDoc.data()
            sendNotification(newHost, {
              title: `You are now hosting a ${raid.rating}-Star Raid`,
              category: 'RAID_RESET',
              body: 'Visit the raids page to start the raid',
              link: `/raids?${raidId}`,
              icon: pkmn(raid.boss),
            })
            t.update<Users.Doc>(newHostRef, {
              notifications: newHost.notifications,
            })
          }

          t.update<DbRaid>(raidRef, {
            'players': raid.players,
            host: raid.host,
            playerList,
            timestampLastUpdated: FieldValue.serverTimestamp()
          })

          if (raidBattleSettings[raid.rating].maxMembers === playerList.length && raid.isPublic) {
            // Re-add if necessary
            const publicDoc = await db.collection('raids').doc('_public').get()
            const {list} = publicDoc.data() as PublicRaidsDoc
            if (!list.filter(entry => entry.id === raidId).length) {
              list.unshift({
                boss: raid.boss,
                id: raidId,
                rating: raid.rating,
                players: playerList.length - 1,
              })
              await publicDoc.ref.set({list})
            }
          }

          if (raid.players![userId]) {
            return 'ok'
          } else {
            return 'you are not in this raid but ok'
          }
        } else if (res.state === 'JOIN') {
          // Check room size in transaction
          const playerList = Object.keys(raid.players!)
          raid.playerList = playerList

          if (violatesRoomSize(raid, userId)) {
            if (raid.isPublic) {
              // At this point we should remove from the public list
              await closeRaid(raidId)
            }
            throw new functions.https.HttpsError('failed-precondition',
              `The raid cannot handle any more players`)
          }

          if (userId !== raid.host && !(userId in raid.players!)) {
            if (!hasItem(user, 'raidpass')) {
              // This player has not even conceived of raid passes yet
              // Allow them to participate with backwards compat
              user.items['raidpass'] = 5 - res.raidPrice // Give them some to start with
            } else if (user.items.raidpass! >= res.raidPrice) {
              user.items.raidpass! -= res.raidPrice
            } else {
              throw new functions.https.HttpsError('failed-precondition',
                `You do not have the necessary ${res.raidPrice} number of raid passes`)
            }
          }

          // Join the room!
          console.log('5', species)

          const speciesToJoin = (() => {
            if (res.speciesToJoin!.startsWith('potw-')) {
              return Badge.fromLegacy(res.speciesToJoin!).toString()
            }
            return new Badge(res.speciesToJoin).toString()
          })()
          if (item) {
            /*if (ITEMS[item].category === 'megastone') {
              raid.players![userId] = {
                species: (`${speciesToJoin!}-mega` as BadgeId),
                item, ready, ldap: user.ldap,
              }
            } else {*/
              raid.players![userId] = {
                species: speciesToJoin!,
                item, ready, ldap: user.ldap,
              }
            // }
          } else {
            raid.players![userId] = {
              species: speciesToJoin!,
              ready, ldap: user.ldap,
            }
          }

          let {raidActive} = user
          if (!raidActive) {
            raidActive = {}
          }
          raidActive[raidId] = {
            boss: raid.boss as BadgeId,
            rating: raid.rating,
            reason: 'Joined this raid',
          }

          t.update<Users.Doc>(userRef, {items: user.items, raidActive})
          if (Object.keys(raid.players!).length === 5 && raid.rating === 11) {
            throw new functions.https.HttpsError('failed-precondition',
              'Check for voyage raid failed. There are 5 players for this raid.')
          }
          t.update<DbRaid>(raidRef, {
            'players': raid.players,
            playerList: Object.keys(raid.players!),
            timestampLastUpdated: FieldValue.serverTimestamp()
          })
          if (raidBattleSettings[raid.rating].maxMembers === Object.keys(raid.players!).length && raid.isPublic) {
            // Remove
            const publicDoc = await db.collection('raids').doc('_public').get()
            const {list} = publicDoc.data() as PublicRaidsDoc
            const listIndex = list.findIndex(entry => entry.id === raidId)
            if (listIndex > -1) {
              list.splice(listIndex, 1)
              await publicDoc.ref.set({list})
            }
          } else if (raid.isPublic) {
            // Update player count
            const publicDoc = await db.collection('raids').doc('_public').get()
            const {list} = publicDoc.data() as PublicRaidsDoc
            const listIndex = list.findIndex(entry => entry.id === raidId)
            if (listIndex > -1) {
              list[listIndex].players = Object.keys(raid.players!).length ?? 1
              await publicDoc.ref.set({list})
            }
          }

          // Send notification when conditions make sense
          if (Object.keys(raid.players!).length === raidBattleSettings[raid.rating].maxMembers) {
            // Player count is correct
            if (Object.values(raid.players!).every(p => p.ready)) {
              // Okay we're good
              const hostRef = db.collection('users').doc(raid.host)
              const hostDoc = await hostRef.get<Users.Doc>()
              const host = hostDoc.data()
              try {
                sendNotification(host, {
                  title: `Your ${raid.rating}-Star Raid is ready to start`,
                  category: 'PLAYER_EVENT',
                  body: 'Every player in the raid has been marked as ready',
                  link: `/raids?${raidId}`,
                  icon: pkmn(raid.boss),
                })
              } catch (e) {
                console.error(`Could not send ready notification to ${host.ldap}`)
              }
              t.update<Users.Doc>(hostRef, {
                notifications: host.notifications,
              })
            }
          }

          return raid.players![userId]
        }
        return `Got unexpected result ${res.state}`
      } catch (e) {
        throw new functions.https.HttpsError('failed-precondition', e)
      }
    })
  } catch (e) {
    throw new functions.https.HttpsError('deadline-exceeded',
      `Please try again in a few seconds: ${e}`)
  }
  return 'OK'
})

function buffRaidBoss(opponentPokemon, rating) {
  raidBattleSettings[rating].buff(opponentPokemon)
}

// There is no Mega Evolution exception here.
export async function matchup(players: Badge[], heldItems: ItemId[], opponent: BadgeId, bossHeldItemKey: ItemId = 'lum', rating: number, location: Location): Promise<ExecuteLog> {
  const playerPokemon = players.map((badge, index) => {
    const data = {...Pkmn.get(badge.toLegacyString())} as PokemonDoc
    const pkmn: Pokemon = {...data,
      badge: badge,
      title: badge.toBattleTitle(),
      fainted: false,
      totalHp: (data.hp || 50) * 4,
      currentHp: (data.hp || 50) * 4,
      movepool: data.move.map(move => Movepool[move] || Movepool.Tackle),
      heldItem: Inventory[heldItems[index]],
      heldItemKey: heldItems[index] as ItemId,
      heldItemConsumed: false,
      heldItemTotallyConsumed: false,
      statBuffs: {
        attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0,
        accuracy: 0, evasiveness: 0, criticalHit: 0,
      },
      targetingLogic: targetSelection[badge.personality.nature ?? 'Hardy'],
      moveLogic: moveSelection[badge.personality.nature ?? 'Hardy'],
      conditions: [{...ConditionMap.OnField}],
    }
    const {buff, nerf} = statAdjustment[badge.personality.nature ?? 'Hardy']
    if (buff) {
      pkmn[buff] *= 1.1
    }
    if (nerf) {
      pkmn[nerf] /= 1.1
    }
    const size = badge.size
    pkmn.weight *= {xxs: 0.8, xxl: 1.2, n: 1}[size ?? 'n']
    return pkmn
  })

  const data = {...Pkmn.get(opponent)} as PokemonDoc
  const opponentPokemon: Pokemon = {
    ...Pkmn.get(opponent)!,
    badge: Badge.fromLegacy(opponent),
    title: badge.toBattleTitle(),
    fainted: false,
    totalHp: (data.hp || 50) * 4,
    currentHp: (data.hp || 50) * 4,
    movepool: data.move.map(move => Movepool[move] || Movepool.Tackle),
    heldItem: {...Inventory[bossHeldItemKey]}, // Hold Lum Berry or something else.
    heldItemKey: bossHeldItemKey,
    heldItemConsumed: false,
    heldItemTotallyConsumed: false,
    statBuffs: {
      attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0,
      accuracy: 0, evasiveness: 0, criticalHit: 1,
    },
    conditions: [{...ConditionMap.Raid}, {...ConditionMap.OnField}],
  }
  if (opponent.includes('-totem')) {
    opponentPokemon.conditions.push({...ConditionMap.RaidTotem})
  }
  if (opponent.includes('-alpha')) {
    opponentPokemon.conditions.push({...ConditionMap.RaidAlpha})
  }
  if (opponent.includes('-noble')) {
    opponentPokemon.conditions.push({...ConditionMap.RaidNoble})
  }
  // Raid bosses have no explicit size modifier

  // Buff Raid Boss
  buffRaidBoss(opponentPokemon, rating)

  const options: BattleOptions = {
    opponentMoves: raidBattleSettings[rating].moves,
    startMsg: `A ${opponentPokemon.species} has appeared and lets out a loud cry! It is dramatically larger than it should be!`,
    lossMsg: `The ${opponentPokemon.species} was overwhelming!`,
    victoryMsg: `The ${opponentPokemon.species} was defeated! It reverted to normal size!`,
    moveLogic: raidBattleSettings[rating].moveLogic,
    targetingLogic: raidBattleSettings[rating].targetingLogic,
    pctLogs: [...raidBattleSettings[rating].pctLogs],
  }
  return execute(playerPokemon, [opponentPokemon], options, location, {fieldSize: -1, partySize: -1, maxWins: 0, mega: true, zmoves: true})
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function prizesPromise(raidId: string, raid: DbRaid, prizesMap: Record<any, any>, userId: string, result: any, mult: number) {
  // Do we do one prize per person? Do we add more based on difficulty?
  // Make prizes change for each person
  return db.runTransaction(async transaction => {
    const userRef = db.collection('users').doc(userId)
    const userDoc = await transaction.get<Users.Doc>(userRef)
    if (!userDoc.exists) return Promise.resolve()
    const user = userDoc.data()
    const {items, strikes} = user
    if (strikes) {
      return userId // Exit early without rewards or record change
    }
    let {raidRecord} = user
    // Get prizes
    const netWorth = calculateNetWorth(user)
    const netMult = (() => {
      if (netWorth < 100) return 3
      if (netWorth < 1000) return 2
      if (netWorth < 5000) return 1
      return 0
    })()
    const numPrizes = raidBattleSettings[raid.rating].prizeCount * mult + netMult

    prizesMap[userId] = []

    /// Create the prize pool
    const stdPrizes = raidBattleSettings[raid.rating].prizes
    // Make common ones more common
    const prizesArr = [
      ...stdPrizes[0], ...stdPrizes[0],
      ...stdPrizes[1], ...stdPrizes[1],
      ...stdPrizes[2],
    ]
    const bossDb = Pkmn.get(raid.boss)!
    const cTypePrizes = typePrizes([bossDb.type1, bossDb.type2], 'common')
    const uTypePrizes = typePrizes([bossDb.type1, bossDb.type2], 'uncommon')
    const rTypePrizes = typePrizes([bossDb.type1, bossDb.type2], 'rare')
    prizesArr.push(
      ...cTypePrizes, ...cTypePrizes, ...cTypePrizes,
      ...uTypePrizes, ...rTypePrizes)
    const simpleBoss = Badge.fromLegacy(raid.boss).toSimple()
    if (bossPrizes[simpleBoss] !== undefined) {
      const bprizes = (bossPrizes[simpleBoss]!)
      // 5x
      prizesArr.push(...bprizes, ...bprizes, ...bprizes, ...bprizes, ...bprizes)
    }
    if (raid.bossHeldItem) {
      prizesArr.push(...Array(5).fill(raid.bossHeldItem))
    }

    for (let i = 0; i < numPrizes; i++) {
      const prize = randomItem(prizesArr) || 'pokeball'
      prizesMap[userId].push(prize)
      awardItem(user, prize)
    }
    if (raidRecord) {
      raidRecord[1]++
    } else {
      raidRecord = [0, 1, 0, 0]
    }
    console.log('Player', userId, 'gets', prizesMap[userId], raidId, raid.rating)

    // Player then captures the Pokémon
    const claimedBoss = claimRaidBoss(raid.boss, raid.location, raid, raid.bossHeldItem)
    if (isDemo) {
      const countUserCaughtPkmn = [...myPokemon(user.pokemon)]
        .map(([, v]) => v)
        .reduce((p, c) => p + c)
      if (countUserCaughtPkmn > 250) {
        throw new functions.https.HttpsError('out-of-range',
          'You cannot catch any more Pokemon in demo mode')
      }
    }
    addPokemon(user, claimedBoss)
    const {researchCurrent} = await accomodateResearch(user, claimedBoss.toLegacyString(), 'premierball')
    const mandateClaim = raidBattleSettings[raid.rating].mandateClaim || claimedBoss.personality.shiny
    if (!mandateClaim) {
      await transaction.update(userRef, {
        pokemon: user.pokemon,
        items,
        raidRecord,
        researchCurrent,
      })
    } else {
      prizesMap[userId].unshift('Prize allocation failed: Manual claim')
      console.log('Cannot update database right now')
    }

    if (mandateClaim) {
      sendNotification(user, {
        category: 'RAID_CLAIM',
        icon: pkmn(Badge.fromLegacy(raid.boss).toSprite()),
        title: `Victory against ` +
          `${Badge.fromLegacy(raid.boss).toLabel()}! Claim your prizes!`,
        body: `Your Pokémon fought valiantly. Return to the raid page to get your rewards!`,
        link: `/multiplayer/raids?${raidId}`,
      })
    } else {
      sendNotification(user, {
        category: 'RAID_COMPLETE',
        icon: pkmn(Badge.fromLegacy(raid.boss).toSprite()),
        title: `Victory against ` +
          `${Badge.fromLegacy(raid.boss).toLabel()}!`,
        body: `Your Pokémon fought valiantly. You have received: ` +
          `${prizesMap[userId].map(prize => ITEMS[prize].label).join(', ')}!`,
        link: `/multiplayer/raids?${raidId}`,
      })
    }
    await transaction.update(userRef, {
      notifications: user.notifications,
    })
    return userDoc.id
  })
}

const raidStartRuntime = {
  timeoutSeconds: 240,
} as RuntimeOptions
export const raid_start = functions.runWith(raidStartRuntime).https.onCall(async (data, context) => {
  const userId = context.auth!.uid
  const {raidId, override} = data
  const doc = await db.collection('raids').doc(raidId).get()
  const raid = doc.data() as DbRaid
  if (raid.state !== CREATED) {
    throw new functions.https.HttpsError('failed-precondition',
      'Cannot start this raid as it has already started: (' + raid.state + ')')
  }
  if (userId !== raid.host) {
    throw new functions.https.HttpsError('failed-precondition',
      'You cannot start this raid')
  }
  const timestamp = raid.timestamp as FirebaseFirestore.Timestamp
  const timestampUpdated = raid.timestampLastUpdated as FirebaseFirestore.Timestamp
  const expiryTime = raidBattleSettings[raid.rating].expires
  if (timestamp.toMillis() < Date.now() - expiryTime) {
    await doc.ref.update({ state: EXPIRED })
    if (raid.isPublic) {
      try {
        await closeRaid(raidId)
      } catch (e) {
        throw new functions.https.HttpsError('data-loss',
          'Cannot splice public raid list for expired raid: ' + e)
      }
    }
    // Return all of the user passes that they had put into it
    // await allSettled(raid.playerList.map(async (userId) => {
    //   return await db.runTransaction(async transaction => {
    //     const doc = await transaction.get(db.collection('users').doc(userId))
    //     const {items} = doc.data() as UserDoc
    //     const raidPrice = Math.ceil(raid.rating / 2)
    //     items.raidpass += raidPrice
    //     await transaction.update(doc.ref, {items})
    //   })
    // }))
    throw new functions.https.HttpsError('failed-precondition',
      'This raid has expired. Raid passes are returned once a day.')
  }

  Object.values(raid.players!).forEach(player => {
    if (!player.ready && !override) {
      throw new functions.https.HttpsError('failed-precondition',
        'Not everyone is ready yet. Do you want to start anyway?')
    }
  })

  if (Object.values(raid.players!).length === 0) {
    throw new functions.https.HttpsError('not-found',
      'You cannot start a raid without any Pokémon!')
  }

  // Mark as in-progress to prevent last-minute submissions
  try {
    await db.runTransaction(async transaction => {
      const raidRef = db.collection('raids').doc(raidId)
      const doc = await transaction.get(raidRef)
      const raid = doc.data() as DbRaid
      if (raid.state === COMPLETED) {
        throw new functions.https.HttpsError('invalid-argument',
          'This raid already completed. It cannot be started again')
      }
      // Wait >15 sec after creation
      if (timestamp.toMillis() > Date.now() - 1000 * 15) {
        throw new functions.https.HttpsError('failed-precondition',
          'This raid is still forming. Give it some time.')
      }
      // Wait >15s after last update
      if (timestampUpdated.toMillis() > Date.now() - 1000 * 15) {
        throw new functions.https.HttpsError('failed-precondition',
          'Players are still preparing. Give them a second.')
      }
      await transaction.update<DbRaid>(raidRef, {
        state: IN_PROGRESS,
        timestampLastUpdated: FieldValue.serverTimestamp()
      })
    })
  } catch (e) {
    throw new functions.https.HttpsError('unavailable',
      'Cannot mark raid as in-progress for some reason: ' + e)
  }

  /// Look at battle-frontier-2.ts
  const players: Badge[] = [
    ...Object.keys(raid.players!).sort()
      .filter(key => raid.players![key].tank)
      .map(key => raid.players![key].species)
      .map(key => key.startsWith('potw-') ? Badge.fromLegacy(key) : new Badge(key)),
      ...Object.keys(raid.players!).sort()
      .filter(key => !raid.players![key].tank)
      .map(key => raid.players![key].species)
      .map(key => key.startsWith('potw-') ? Badge.fromLegacy(key) : new Badge(key)),
  ]

  const playerItems: ItemId[] = [
    ...Object.keys(raid.players!).sort()
      .filter(key => raid.players![key].tank)
      .map(key => raid.players![key].item!),
    ...Object.keys(raid.players!).sort()
      .filter(key => !raid.players![key].tank)
      .map(key => raid.players![key].item!),
  ]

  // Run the battle
  console.log(`${raidId} - Preconditions complete`)
  const location = await getLocation(raid.location)
  location.forecast = raid.locationWeather // Static weather
  const result = await matchup(players, playerItems, raid.boss, raid.bossHeldItem, raid.rating, location)
  console.log(`${raidId} - Match complete`)

  // Mark as completed to prevent repeatedly running raid past this point
  try {
    await db.runTransaction(async transaction => {
      const raidRef = db.collection('raids').doc(raidId)
      const doc = await transaction.get(raidRef)
      const raid = doc.data() as DbRaid
      if (raid.state === COMPLETED) {
        console.error(`${raidId} - Already completed`)
        throw new functions.https.HttpsError('invalid-argument',
          'This raid already completed. It cannot be completed again')
      }
      if (raid.state !== IN_PROGRESS) {
        console.error(`${raidId} - State is not in-progress`)
        throw new functions.https.HttpsError('invalid-argument',
          'How did you get to this point? I am very confused.')
      }
      await transaction.update(raidRef, {state: COMPLETED, log: ''})
    })
  } catch (e) {
    console.error(`${raidId} - Cannot mark as completed: ${e}`)
    throw new functions.https.HttpsError('unavailable',
      'Cannot mark raid as nearly completed for some reason: ' + e)
  }
  console.log(`${raidId} - Mark as complete`)

  if (raid.isPublic) {
    try {
      await closeRaid(raidId)
    } catch (e) {
      throw new functions.https.HttpsError('data-loss',
        'Cannot splice completed public raid: ' + e)
    }
    console.log(`${raidId} - Splice public raid complete`)
  }

  // Consume items
  const playerIds = [
    ...Object.keys(raid.players!).sort()
      .filter(key => raid.players![key].tank),
    ...Object.keys(raid.players!).sort()
      .filter(key => !raid.players![key].tank),
  ]
  // If this runs multiple times we can lose too many items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const itemConsumePromises: any[] = []
  if (result.playerHeldItemsConsumed.length) {
    // Remove these items from the player's bag
    playerIds.forEach((userId, i) => {
      const item = result.playerHeldItemsConsumed[i]
      // Only remove items if the item has been consumed
      if (item === undefined) return;
      itemConsumePromises.push(db.runTransaction(async transaction => {
        const userRef = db.collection('users').doc(userId)
        const userDoc = await transaction.get<Users.Doc>(userRef)
        if (!userDoc.exists) return Promise.resolve()
        const user = userDoc.data()
        const {items} = user
        items[item!]--
        await transaction.update<Users.Doc>(userRef, {
          items,
        })
      }))
    })
  }
  try {
    await Promise.all(itemConsumePromises)
  } catch (e) {
    // await doc.ref.update({ state: CREATED })
    throw new functions.https.HttpsError('data-loss',
      'Player documents are unavailable to manage item removal: ' + e)
  }
  console.log(`${raidId} - Item consumption complete`)

  // Update adventure logs, notify users, remove active raid
  const adventureLogUpdates = playerIds.map(async (userId) => {
    await db.runTransaction(async t => {
      const userRef = db.collection('users').doc(userId)
      const userDoc = await t.get<Users.Doc>(userRef)
      if (!userDoc.exists) return Promise.resolve()
      const user = userDoc.data()
      let {raidActive} = user
      if (!raidActive) {
        raidActive = {}
      } else {
        delete raidActive[raidId]
      }

      await t.update<Users.Doc>(userRef, {
        raidActive,
      })
    })
    // await db.runTransaction(async t => {
    //   A.updateRaid(t, {
    //     userId,
    //     raid: {
    //       id: doc.id,
    //       time: (raid.timestampLastUpdated as FirebaseFirestore.Timestamp).toMillis(),
    //       boss: raid.boss as BadgeId,
    //       rating: raid.rating,
    //       result: raid.result,
    //       host: raid.host
    //     }
    //   })
    // })
  })

  try {
    await allSettled(adventureLogUpdates)
  } catch (e) {
    throw new functions.https.HttpsError('data-loss',
      `Cannot update adventure logs for players: ${e}`)
  }
  console.log(`${raidId} - Adventure logging complete`)

  // Determine shinyness for raid boss
  let mandateClaim = raidBattleSettings[raid.rating].mandateClaim
  if ((Math.random() / raid.rating) < checkShiny(raid)) {
    const badge = Badge.fromLegacy(raid.boss)
    badge.personality.shiny = true
    raid.boss = badge.toLegacyString()
    mandateClaim = true // Always mandate claim for shiny
    // Save right away
    await db.collection('raids').doc(raidId).update<DbRaid>({
      boss: raid.boss
    })
  }

  const prizesMap = {}
  const claimUsers: string[] = []
  if (mandateClaim) {
    playerIds.forEach(p => claimUsers.push(p))
  }
  console.log(`${raidId} - Raid result: ${result.result}`)
  if (result.result === 1) {
    // Award Prizes
    // Run in sequence as there seems to be a larger issue happening when this
    // runs in parallel. The function seems to just stop and timeout.
    for (const userId of playerIds) {
      try {
        const mult = result.field.sides.Your.goldCoins ? 2 : 1
        await prizesPromise(raidId, raid, prizesMap, userId, result, mult)
        console.log(`${raidId} - Prize allocation complete for ${userId}`)
      } catch (e) {
        // Adjust notifications?
        console.error(`${raidId} - Transaction failed for ${userId}: ${e}`)
        if (prizesMap[userId]) {
          prizesMap[userId].unshift(
            'Prize allocation failed: ' +
            e.toString()
          )
        } else {
          prizesMap[userId] = [
            'Prize allocation failed: ' +
            e.toString()
          ]
        }
        claimUsers.push(userId)
      }
    }
    console.log(`${raidId} - Prizes Map: ${JSON.stringify(prizesMap)}`)
  } else {
    // Here we should update the record result (not a win) for every user.
    try {
      for (const userId of playerIds) {
        await db.runTransaction(async transaction => {
          const userRef = db.collection('users').doc(userId)
          const userDoc = await transaction.get<Users.Doc>(userRef)
          if (!userDoc.exists) return Promise.resolve()
          const user = userDoc.data()

          let {raidRecord} = user
          if (raidRecord) {
            raidRecord[result.result]++
          } else {
            raidRecord = [0, 0, 0, 0]
            raidRecord[result.result]++
          }
          // Update notification system to use FCM directly
          const resultLabels = ['Unknown', 'Victory', 'Loss', 'Tie']
          sendNotification(user, {
            category: 'RAID_COMPLETE',
            icon: pkmn(Badge.fromLegacy(raid.boss).toSprite()),
            title: `${resultLabels[result.result]} against ${Badge.fromLegacy(raid.boss).toLabel()}!`,
            body: `Your Pokémon fought valiantly, but alas...`,
            link: `/multiplayer/raids?${raidId}`
          })
          console.log(`${raidId} - Update loss raid record for ${userId}`)
          await transaction.update<Users.Doc>(userRef, {
            raidRecord,
            notifications: user.notifications,
          })
          return userDoc.id
        })
      }
    } catch (e) {
      console.error(`${raidId} - Cannot update raid record for user`)
    }
  }
  console.log(`${raidId} - Final stretch`)

  // Post log for everyone
  try {
    await db.collection('raids').doc(raidId).update<DbRaid>({
      boss: raid.boss,
      log: result.msg.join('\n'),
      matchState: {
        playerHps: result.playerHps,
        opponentHps: result.opponentHps,
      },
      prizes: prizesMap,
      state: COMPLETED,
      result: result.result,
      claimUsers,
      timestampLastUpdated: FieldValue.serverTimestamp(),
    })
  } catch (e) {
    throw new functions.https.HttpsError('aborted',
      `Cannot update raid result data: ${e}`)
  }
  console.log(`${raidId} - Result compilations complete`)

  return { result }
})

export const raid_claim = functions.https.onCall(async (data, context) => {
  const userId = context.auth!.uid
  const {raidId} = data
  const prizes = await db.runTransaction(async transaction => {
    const raidRef = db.collection('raids').doc(raidId)
    const raidDoc = await transaction.get<DbRaid>(raidRef)
    const {boss, bossHeldItem, prizes, playerList, claimUsers, location} = raidDoc.data() as DbRaid
    if (!playerList.includes(userId)) {
      throw new functions.https.HttpsError('not-found',
        'You cannot claim prizes')
    }
    if (!prizes![userId]) {
      throw new functions.https.HttpsError('failed-precondition',
        'Prize cannot be allocated')
    }
    if (!prizes![userId][0].includes('Prize allocation failed')) {
      throw new functions.https.HttpsError('failed-precondition',
        'Prize already allocated')
    }
    const prizesToAllocate = prizes![userId].filter(p => !p.includes('Prize allocation failed'))

    const userRef = db.collection('users').doc(userId)
    const userDoc = await transaction.get<Users.Doc>(userRef)
    if (!userDoc.exists) return Promise.resolve()
    const user = userDoc.data()
    const {items} = user
    let {raidRecord} = user
    // Get prizes
    prizesToAllocate.forEach(prize => {
      if (ITEMS[prize]) {
        const item: ItemId = prize as ItemId
        awardItem(user, item)
      } else {
        console.error(`Trying to give user ${userId} bad item ${prize}`)
      }
    })
    if (raidRecord) {
      raidRecord[1]++
    } else {
      raidRecord = [0, 1, 0, 0]
    }
    console.log('Player', userId, 'claims', prizesToAllocate, raidId)
    // Player then captures the Pokémon
    const claimedBoss = claimRaidBoss(boss as BadgeId, location, raidDoc.data(), bossHeldItem)
    if (isDemo) {
      const countUserCaughtPkmn = [...myPokemon(user.pokemon)]
        .map(([, v]) => v)
        .reduce((p, c) => p + c)
      if (countUserCaughtPkmn > 250) {
        throw new functions.https.HttpsError('out-of-range',
          'You cannot catch any more Pokemon in demo mode')
      }
    }
    addPokemon(user, claimedBoss)
    const {researchCurrent} = await accomodateResearch(user, claimedBoss.toLegacyString(), 'premierball')
    let {raidActive} = user
    if (!raidActive) {
      raidActive = {}
    } else {
      delete raidActive[raidId]
    }
    await transaction.update<Users.Doc>(userRef, {
      pokemon: user.pokemon,
      items,
      raidRecord,
      raidActive,
      researchCurrent
    })
    // Mark that the prize has been given to prevent duplicate awards
    if (claimUsers) {
      const updatedClaimUsers = claimUsers.filter(id => id !== userId)
      await transaction.update<DbRaid>(raidRef, {
        [`prizes.${userId}`]: prizesToAllocate,
        claimUsers: updatedClaimUsers
      })
    } else {
      // Fix in 3 days
      await transaction.update<DbRaid>(raidRef, {
        [`prizes.${userId}`]: prizesToAllocate,
      })
    }
    // Mark raid as having allocated prize
    return prizesToAllocate
  })
  return {
    prizes
  }
})

export const raid_tank = functions.https.onCall(async (data, context) => {
  const userId = context.auth!.uid
  const {raidId, playerId, isTank} = data
  const doc = await db.collection('raids').doc(raidId).get()
  const raid = doc.data() as DbRaid
  if (raid.state !== CREATED) {
    throw new functions.https.HttpsError('failed-precondition',
      'You cannot change this for as the raid is set in stone.')
  }
  if (raid.host !== userId) {
    throw new functions.https.HttpsError('failed-precondition',
      'Only the host can do this.')
  }
  if (isTank === undefined || !playerId) {
    throw new functions.https.HttpsError('failed-precondition',
      'Failed precondition.')
  }
  if (!raid.playerList.includes(playerId)) {
    throw new functions.https.HttpsError('failed-precondition',
      'Failed precondition 2.')
  }

  await db.collection('raids').doc(raidId).update({
    [`players.${playerId}.tank`]: isTank === true
  })
})

/**
 * This can now be pulled in directly through Users.Doc.raidActive
 * @deprecated
 */
export const raid_list = functions.https.onCall(async (data, context) => {
  const userId = context.auth!.uid
  // Do a list query with the smallest number of document reads
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raids: Record<string, any> = {}
  const userDoc = await db.collection('users').doc(userId).get()
  const user = userDoc.data() as Users.Doc
  const {raidActive} = user
  if (raidActive) {
    Object.entries(raidActive).forEach(([key, value]) => {
      raids[key] = {
        id: key,
        boss: value.boss,
        rating: value.rating,
        reason: value.reason
      }
    })
  }
  // A list of raids that need to be claimed
  const toClaimDocs = await db.collection('raids')
    .where('state', '==', COMPLETED)
    .where('result', '==', 1) // Won raid
    .where('claimUsers', 'array-contains', userId)
    .limit(20)
    .get()
  toClaimDocs.docs.forEach(doc => {
    const {boss, rating} = doc.data() as DbRaid
    raids[doc.id] = {
      id: doc.id,
      boss,
      rating,
      reason: 'Claim prize'
    }
  })
  // See b/273274962
  const toClaim2Docs = await db.collection('raids')
    .where('result', '==', 1) // Won raid
    .where(`prizes.${userId}`, 'array-contains', 'Prize allocation failed: Manual claim')
    .limit(20)
    .get()
  toClaim2Docs.docs.forEach(doc => {
    const {boss, rating} = doc.data() as DbRaid
    raids[doc.id] = {
      id: doc.id,
      boss,
      rating,
      reason: 'Claim prize'
    }
  })
  // A list of raids that may have been missed from before.
  const otherInRaidDocs = await db.collection('raids')
    .where('state', '==', CREATED)
    .where('playerList', 'array-contains', userId)
    .where('rating', '>', 5)
    .limit(10)
    .get()
  otherInRaidDocs.docs.forEach(doc => {
    const {boss, rating} = doc.data() as DbRaid
    raids[doc.id] = {
      id: doc.id,
      boss,
      rating,
      reason: 'Joined raid'
    }
  })
  return Object.values(raids)
})

// Run daily
const raidDispenseRuntime = {
  timeoutSeconds: 540,
  memory: '2GB'
} as RuntimeOptions
// Daily, 1AM GMT
export const raid_dispense = functions.runWith(raidDispenseRuntime)
    .pubsub.schedule('0 1 */1 * *').onRun(async () => {

  let dispenses = 0
  await forEveryUser(['items.raidpass', '<', 25], async (user, ref) => {
    const max = (() => {
      const wealth = calculateNetWorth(user)
      if (wealth > 1_000_000) return 10
      if (wealth > 1_000) return 15
      return 25
    })()
    try {
      await db.runTransaction(async transaction => {
        const {items, notifications} = user
        const hasDispenseNotification = notifications?.find(n => n.link === '/multiplayer/raids')

        if (items.raidpass && items.raidpass > max) {
          // Do not change, allowing one to theoretically have many
        } else if (items.raidpass) {
          // Do not let players get more than 10 in total
          items.raidpass = Math.min(items.raidpass + 5, max)
        } else {
          items.raidpass = 5
        }

        if (items.wishingpiece && items.wishingpiece > max) {
          // Do not change, allowing one to theoretically have many
        } else if (items.wishingpiece) {
          // Do not let players get more than 5 in total
          items.wishingpiece = Math.min(items.wishingpiece + 2, max)
        } else {
          items.wishingpiece = 2
        }
        // Only send novel notification
        if (!hasDispenseNotification) {
          sendNotification(user, {
            category: 'ITEM_DISPENSE',
            title: "Here are some raid passes and wishing pieces.",
            body: '',
            link: '/multiplayer/raids',
            icon: 'images/sprites/items/potw-item-wishingpiece.png',
          })
        }
        transaction.update(ref, {items, notifications: user.notifications})
      })
    } catch (e) {
      console.info(`User ${ref.id} dispense error -- ${e}`)
    }
    dispenses++
    // itemUpdatePromises.push(transaction)
    // await allSettled(itemUpdatePromises)
  })
  console.log(`Dispensed Raid Passes and Wishing Pieces for ${dispenses} accounts`)
  await db.collection('admin').doc('cron').update({
    raidDispense: Date.now()
  })
  return `Dispensed Raid Passes and Wishing Pieces for ${dispenses} accounts`
})

export const getAdventureLog = async (userId: string) => {
  const raidHistory = await A.readRaid(userId, {limit: 1})

  if (raidHistory.length) {
    return {
      history: raidHistory,
    }
  }

  // Retroactively generate

  const raidSnapshot = await db.collection('raids')
      .where('playerList', 'array-contains', userId)
      .orderBy('timestamp', 'asc')
      .get<DbRaid>()
  const raidSnapshotDocs = raidSnapshot.docs.map(
    doc => ({
      id: doc.id,
      boss: doc.data().boss as BadgeId,
      rating: doc.data().rating,
      result: doc.data().result,
      host: doc.data().host,
      timestamp: doc.data().timestamp,
    })
  )

  await db.runTransaction(async t => {
    for (const doc of raidSnapshotDocs) {
      let timestamp
      if (Number.isInteger(doc.timestamp)) {
        timestamp = doc.timestamp
      } else {
        timestamp = (doc.timestamp as FirebaseFirestore.Timestamp).toMillis()
      }
      await A.updateRaid(t._raw, {
        userId,
        raid: {
          id: doc.id,
          boss: doc.boss as BadgeId,
          result: doc.result!,
          host: doc.host,
          rating: doc.rating,
          time: timestamp,
        }
      })
    }
  })

  return {
    history: raidSnapshotDocs,
  }
}

export const raid_history = functions.https.onCall(async (_, context) => {
  const userId = context.auth!.uid
  const raids = await getAdventureLog(userId)
  const raidsWon = raids.history.filter(raid => raid.result === 1).length
  const raidsLost = raids.history.filter(raid => raid.result === 2).length
  const raidsTie = raids.history.filter(raid => raid.result === 3).length
  const raidRecord = [0, raidsWon, raidsLost, raidsTie]
  await db.collection('users').doc(userId).update({
    raidRecord,
  })
  return {
    raids,
    raidRecord,
  }
})

// Periodically, 1AM GMT
const raidPublicRemoveCron = {
  timeoutSeconds: 540,
  memory: '256MB'
} as RuntimeOptions
export const raid_public_remove = functions.runWith(raidPublicRemoveCron)
    .pubsub.schedule('0 1 */1 * *').onRun(async () => {
  // Run through all expired raids, refund
  for (let i = 1; i < raidBattleSettings.length; i++) {
    const expiredRaids = await db.collection('raids')
      .where('timestamp', '<', new Date(Date.now() - raidBattleSettings[i].expires))
      .where('state', '==', CREATED)
      .where('rating', '==', i)
      .get<DbRaid>()
    console.log(`There are ${expiredRaids.docs.length} expired raids`)
    for (const doc of expiredRaids.docs) {
      console.log(`Expire raid ${doc.id}`)
      const raid = doc.data()
      if (!raid.playerList) continue // Don't continue with bad raid
      // Return all of the user passes that they had put into it
      await allSettled(raid.playerList.map(async (userId) => {
        return await db.runTransaction(async transaction => {
          const ref = db.collection('users').doc(userId)
          const doc = await transaction.get<Users.Doc>(ref)
          const user = doc.data()
          const raidPrice = raidBattleSettings[raid.rating].cost
          if (user.raidActive && user.raidActive[doc.id]) {
            delete user.raidActive[doc.id]
          }
          console.log(`            ${doc.id} - ${userId}`)
          if (!user.strikes) {
            await transaction.update<Users.DbDoc>(ref, {
              ['items.raidpass']: FieldValue.increment(raidPrice),
              raidActive: user.raidActive,
            })
          }
        })
      }))
      await doc.ref.update({state: EXPIRED})
      const hostDoc = await db.collection('users').doc(raid.host).get()
      const hostData = hostDoc.data() as Users.Doc
      sendNotification(hostData, {
        title: `Your ${Badge.fromLegacy(raid.boss).toLabel()} raid has expired and raid passes refunded.`,
        body: 'Your raid passes have been returned to you for re-use next time.',
        category: 'RAID_EXPIRE',
        icon: item('raidpass'),
        link: '/multiplayer/raids',
      })
      await hostDoc.ref.update({
        notifications: hostData.notifications,
      })
    }
  }

  // Next cleanup public raids
  const publicRef = db.collection('raids').doc('_public')
  const publicRaids = await publicRef.get<PublicRaidsDoc>()
  const {list} = publicRaids.data()
  const staleRaids: string[] = []
  const listedRaids = list.map(raid => db.collection('raids').doc(raid.id).get())
  const raidDocs = await Promise.all(listedRaids)
  raidDocs.forEach(raidDoc => {
    if (!raidDoc.data()) {
      staleRaids.push(raidDoc!.id)
      return // Broken raid
    }
    const {timestamp, state, rating} = raidDoc.data() as DbRaid
    const timestampStamp = timestamp as FirebaseFirestore.Timestamp
    const expiryTime = raidBattleSettings[rating].expires
    if (timestampStamp.toMillis) {
      if (timestampStamp.toMillis() < Date.now() - expiryTime) {
        staleRaids.push(raidDoc.id)
      }
    } else {
      console.error(`Unknown timestamp for ${raidDoc.id}`)
    }
    if (state === COMPLETED || state === EXPIRED) {
      staleRaids.push(raidDoc.id)
    }
  })

  try {
    await db.runTransaction(async transaction => {
      const publicDoc = await transaction.get<PublicRaidsDoc>(publicRef)
      const {list} = publicDoc.data()
      for (const raidId of staleRaids) {
        // Iterate through all the invalid raids and prune them
        const listIndex = list.findIndex(value => value.id === raidId)
        if (listIndex > -1) {
          list.splice(listIndex, 1)
        }
      }
      // Update our public list
      await transaction.update<PublicRaidsDoc>(publicRef, {list})
    })
  } catch (e) {
    console.error('cannot prune public raid list', e)
  }

  // Run through all almost raids, reminder
  for (let i = 1; i < raidBattleSettings.length; i++) {
    const nearExpiryTime = new Date(Date.now() - raidBattleSettings[i].expires + 1000 * 60 * 60 * 24)
    const expiryTime = new Date(Date.now() - raidBattleSettings[i].expires)
    const nearExpiredRaids = await db.collection('raids')
      .where('timestamp', '<', nearExpiryTime)
      .where('timestamp', '>', expiryTime)
      .where('rating', '==', i)
      .where('state', '==', CREATED)
      .get()
    console.log(`There are ${nearExpiredRaids.docs.length} near-expired raids`)
    for (const doc of nearExpiredRaids.docs) {
      console.log(`Reminder for raid ${doc.id}`)
      const raid = doc.data() as DbRaid
      if (!raid.playerList) continue // Don't continue with bad raid
      const hostDoc = await db.collection('users').doc(raid.host).get()
      const hostData = hostDoc.data() as Users.Doc
      sendNotification(hostData, {
        title: `Your ${Badge.fromLegacy(raid.boss).toLabel()} will expire soon`,
        body: 'This pending raid has about one day left, so run it.',
        category: 'RAID_EXPIRE', // FIXME
        icon: pkmn(Badge.fromLegacy(raid.boss).toSprite()),
        link: `/multiplayer/raids?${doc.id}`,
      })
      await hostDoc.ref.update({
        notifications: hostData.notifications,
      })
    }
  }

  const stalledRaids = await db.collection('raids')
    .where('state', '==', COMPLETED)
    .where('log', '==', '') // Empty string
    .get()
  console.log(`There are ${stalledRaids.docs} stalled raids`)
  for (const doc of stalledRaids.docs) {
    const raid = doc.data() as DbRaid
    // Reset them
    console.info(`Reset stalled raid ${doc.id}`)
    await doc.ref.update({
      state: CREATED,
      timestamp: FieldValue.serverTimestamp(),
    })

    const hostDoc = await db.collection('users').doc(raid.host).get()
    const hostData = hostDoc.data() as Users.Doc
    try {
      sendNotification(hostData, {
        title: `Your ${Badge.fromLegacy(raid.boss).toLabel()} raid has reset.`,
        body: 'This raid has been automatically reset after getting stuck for some reason.',
        category: 'RAID_EXPIRE',
        icon: pkmn(Badge.fromLegacy(raid.boss).toSprite()),
        link: `/multiplayer/raids?${doc.id}`,
      })
      await hostDoc.ref.update({
        notifications: hostData.notifications,
      })
    } catch (e) {
      console.error(`Error notifying stalled raid: ${e}`)
    }
  }

  const brokenRaids = await db.collection('raids')
    .where('state', '==', IN_PROGRESS)
    .where('log', '==', '') // Empty string
    .where('timestamp', '<', new Date(Date.now() - EXPIRY_TIME))
    .get()
  console.log(`There are ${brokenRaids.docs} broken raids`)
  for (const doc of brokenRaids.docs) {
    const raid = doc.data() as DbRaid
    // Reset them
    console.info(`Reset broken raid ${doc.id}`)
    await doc.ref.update({
      state: CREATED,
      timestamp: FieldValue.serverTimestamp(),
    })
    const notify: Notification = {
      cat: 'RAID_RESET',
      link: `/raids?${doc.id}`,
      msg: `Your ${Badge.fromLegacy(raid.boss).toLabel()} raid was reset.`,
      body: 'The raid had gotten stuck somehow. Revisit the page to try running it again.',
      icon: item('raidpass'),
      timestamp: Date.now()
    }
    await db.collection('users').doc(raid.host).update({
      notifications: FieldValue.arrayUnion(notify),
    })
  }

  await db.collection('admin').doc('cron').update({
    raidPublicRemove: Date.now()
  })
  console.info(`Removed ${staleRaids.length} raids from the public list`)
})

interface RaidActiveClearParams {
  /**
   * If a raid ID is provided, only clear that entry.
   */
  id?: string
}

/**
 * Function that clears the 'raidActive' field of the UserDoc.
 */
export const raid_active_clear = functions.https.onCall(async (data: RaidActiveClearParams, context) => {
  const userId = context.auth!.uid
  const {id} = data || {}
  if (id) {
    await db.runTransaction(async t => {
      const userRef = db.collection('users').doc(userId)
      const userDoc = await t.get(userRef)
      const {raidActive} = userDoc.data()!
      delete raidActive[id]
      t.update(userRef, {
        raidActive,
      })
    })
  } else {
    await db.runTransaction(async t => {
      // const userDoc = await t.get(db.collection('users').doc(userId))
      const userRef = db.collection('users').doc(userId)
      t.update(userRef, {
        raidActive: {}
      })
    })
  }
})
