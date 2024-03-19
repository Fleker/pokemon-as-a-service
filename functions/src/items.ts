import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { Badge, Nature } from '../../shared/src/badge3';
import {DirectMap, getVariantForMove, ItemUsageParams, useItem} from '../../shared/src/items-availablity'
import * as Pkmn from '../../shared/src/pokemon'
import { DbRaid, Users } from './db-types';
import { salamander, SalamanderRef, SalamanderTxn } from '@fleker/salamander';
import { addPokemon, awardItem, hasItem, hasPokemon, removePokemon } from './users.utils';
import { ITEMS, ItemId } from '../../shared/src/items-list';
import { MoveId } from '../../shared/src/gen/type-move-meta';
import { shinyRate } from './platform/game-config';
import { accomodateResearch } from './research-quests';
import spacetime from 'spacetime';
import {F} from '../../shared/src/server-types'
import * as P from '../../shared/src/gen/type-pokemon'
import { Recipes } from '../../shared/src/crafting';
import { toRequirements } from './users';
import { getLocation } from './location';
import { BadgeId, PokemonId } from '../../shared/src/pokemon/types';
import * as A from './adventure-log'
import randomItem from '../../shared/src/random-item';
import { SHINY_CHARM } from '../../shared/src/quests';
import { Globe } from '../../shared/src/locations-list';
import { randomVariant } from '../../shared/src/farming';

const db = salamander(admin.firestore())
const FieldValue = admin.firestore.FieldValue;

export interface ItemEntry {
  item: string
  userId: string
  target?: string
  seekingPkmn?: string
  offeredPkmn?: string
  timestamp: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp | number
}

export interface ItemEntryAdventureLog {
  timestamp: number
  item: string
  target: string
}

export const genAdventureLog = (docs: ItemEntry[]) => {
  // Design it to be a single doc
  // Primarily used for Pokédex registration
  //   also includes some historical information
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adventureLogSet = new Set<any>()
  const timestamps: number[] = []
  docs.forEach(doc => {
    const payload = {
      target: doc.target || doc.offeredPkmn,
      item: doc.item
    }
    if (!adventureLogSet.has(payload)) {
      // Only keep important entries in adventure log
      // Silently drop others
      adventureLogSet.add(payload)
      if (typeof doc.timestamp === 'number') {
        timestamps.unshift(doc.timestamp)
      } else {
        const time = doc.timestamp as FirebaseFirestore.Timestamp
        timestamps.unshift(time.toMillis())
      }
    }
  })
  const adventureDoc: ItemEntryAdventureLog[] = [...adventureLogSet]
    .filter(entry => entry.target)
    .map(entry => {
      return {
        ...entry,
        timestamp: timestamps.pop() // Get timestamps from reverse order
      }
    })
  return adventureDoc
}

/**
 * Pre-validated function to change nature of a given Pokémon
 * @param data Function data
 * @param t Salamander Transaction to update User Doc
 */
async function useMint(data: F.UseItem.OnTarget, user: Users.Doc, ref: SalamanderRef, t: SalamanderTxn) {
  const map: Partial<Record<ItemId, Nature>> = {
    minthardy: 'Hardy',
    mintadamant: 'Adamant',
    mintbold: 'Bold',
    minttimid: 'Timid',
    mintmodest: 'Modest',
    mintcalm: 'Calm',
    mintnaughty: 'Naughty',
    mintjolly: 'Jolly',
  }
  const nature = map[data.item]
  if (!nature) {
    throw new functions.https.HttpsError('invalid-argument',
      `The mint ${data.item} is not a valid mint.`)
  }
  const target = new Badge(data.target)
  removePokemon(user, target)
  target.personality.nature = nature
  addPokemon(user, target)
  user.items[data.item]!--
  t.update<Users.Doc>(ref, {
    items: user.items,
    pokemon: user.pokemon,
  })
  return {
    target: target.toString(),
    nature,
    item: data.item,
    mintsCount: user.items[data.item],
    noop: true,
  }
}

/**
 * Pre-validated function to change affection of a given Pokémon
 * @param affection Final value of affection change. Could be turned off with bitter item.
 * @param data Function data
 * @param t Salamander Transaction to update User Doc
 */
function useAffectionChange(affection: boolean, data: F.UseItem.OnTarget, user: Users.Doc, ref: SalamanderRef, t: SalamanderTxn) {
  const target = new Badge(data.target)
  // Check if we should update affection or evolve
  console.log('useAffectionChange', affection, target.personality.affectionate)
  if (affection && target.personality.affectionate === affection) {
    // Return a no-op
    // return {
    //   target: target.toString(),
    //   affection,
    //   item: data.item,
    //   itemCount: user.items[data.item]!
    // }
    return undefined
  }
  removePokemon(user, target)
  target.personality.affectionate = affection
  addPokemon(user, target)
  user.items[data.item]!--
  t.update<Users.Doc>(ref, {
    items: user.items,
    pokemon: user.pokemon,
  })
  return {
    noop: true,
    target: target.toString(),
    affection,
    item: data.item,
    itemCount: user.items[data.item]!
  }
}

const affectionTrueItems: ItemId[] = ['pomeg', 'kelpsy', 'grepa', 'hondew', 'qualot', 'tamato']
const affectionFalseItems: ItemId[] = ['energypowder', 'healpowder', 'energyroot', 'revivalherb']
const slateItems: Partial<Record<ItemId, BadgeId[]>> = {
  slategb: [P.Articuno, P.Zapdos, P.Moltres],
  slategbc: [P.Suicune, P.Entei, P.Raikou],
  slategba: [P.Regirock, P.Regice, P.Registeel],
  slaters: [P.Latios, P.Latias],
  slatemewtwo: [...Array(5).fill(P.Mewtwo), P.Mew],
  slatelugia: [...Array(5).fill(P.Lugia), P.Celebi],
  slatehooh: [...Array(5).fill(P.Ho_Oh), P.Celebi],
  slatekyogre: [...Array(5).fill(P.Kyogre), P.Jirachi],
  slategroudon: [...Array(5).fill(P.Groudon), P.Jirachi],
  slaterayquaza: [...Array(5).fill(P.Rayquaza), P.Deoxys],
  slategiratina: [...Array(5).fill(P.Giratina), P.Darkrai, P.Manaphy, P.Shaymin],
}

async function useItemTarget(data: F.UseItem.OnTarget, userId: string): Promise<F.UseItem.Res> {
  const {item, target} = data
  if (!target) {
    throw new functions.https.HttpsError('failed-precondition',
      `You cannot undefined ${target}.`)
  }
  if (target.startsWith('potw')) {
    throw new functions.https.HttpsError('failed-precondition',
      `You cannot send legacy badge ID ${target}.`)
  }
  const targetBadge = new Badge(target);
  console.log(`Use ${item} on ${target} at ??? hours`)

  if (!item) {
    throw new functions.https.HttpsError('invalid-argument', 'Item does not exist');
  }

  const {currentBadge, noop, changeType} = await db.runTransaction(async t => {
    const ref = db.collection('users').doc(userId)
    const doc = await t.get<Users.Doc>(ref)
    if (!doc.exists) {
      throw new functions.https.HttpsError('invalid-argument', 'User does not exist');
    }
    const user = doc.data()
    const {items, location} = user

    if (!hasPokemon(user, targetBadge.toOriginalString())) {
      throw new functions.https.HttpsError('failed-precondition',
        `You do not have ${targetBadge.toString()} via ${data.target}`)
    }

    if (!hasItem(user, item)) {
      console.error(`${item} is not available for this user`)
      throw new functions.https.HttpsError('invalid-argument',
        `Item ${item} cannot be found`);
    }

    if (item.startsWith('mint')) {
      // Short-circuit for mints
      return useMint(data, user, ref, t)
    }

    if (affectionTrueItems.includes(item)) {
      // Short-circuit for affection
      const uac = useAffectionChange(true, data, user, ref, t)
      if (uac) {
        console.info('Pokemon became affectionate but does not evolve', targetBadge.personality)
        return uac // Or pass-through evo
      }
      console.log('Pokemon is eligible for evolution')
    }

    if (affectionFalseItems.includes(item)) {
      // Short-circuit for affection
      // No pass-through in the falsy case (we cannot de-evolve)
      return useAffectionChange(false, data, user, ref, t)
    }

    const userLocation = await getLocation(location || 'US-MTV')

    // Use in-game location
    let loc = spacetime()
    const timezone = userLocation.timezone
    loc = loc.goto(timezone)
    const hours = loc.hour()

    const itemUsageParams: ItemUsageParams = {
      target: targetBadge.toString(),
      item,
      items: items as Record<ItemId, number>,
      location: userLocation,
      hours,
      gyroZ: data.gyroZ,
      spin: data.spin,
    }

    try {
      console.log(itemUsageParams)
      const res = useItem(itemUsageParams)
      console.log(res)
      if (res.consumedItem === true) {
        items[item]!-- // Remove item from your bag
      } else if ((res.consumedItem as number) > 1) {
        items[item]! -= (res.consumedItem as number)
      }
      removePokemon(user, targetBadge)
      addPokemon(user, new Badge(res.output))
      if (res.others?.length) {
        res.others.forEach(other => {
          addPokemon(user, new Badge(other))
        })
      }

      // FIXME: Just use FieldValue.increment()
      const evolutionCount = (() => {
        if (res.changeType !== 'EVO') {
          return user.evolutionCount ?? 0
        }
        if (user.evolutionCount) return ++user.evolutionCount
        return 1
      })()

      const formChangeCount = (() => {
        if (res.changeType !== 'FORM') {
          return user.formChangeCount ?? 0
        }
        if (user.formChangeCount) return ++user.formChangeCount
        return 1
      })()

      t.update<Users.Doc>(ref, {
        items,
        currentBadges: user.currentBadges,
        pokemon: user.pokemon,
        evolutionCount,
        formChangeCount
      })
      await A.updatePokedex(t._raw, { speciesId: targetBadge.toLegacyString(), userId })
      await A.updatePokedex(t._raw, { speciesId: new Badge(res.output).toLegacyString(), userId })
      return { currentBadge: res.output, changeType: res.changeType }
    } catch (e) {
      throw new functions.https.HttpsError('failed-precondition', e)
    }
  })

  if (noop) {
    return {
      target,
      transform: targetBadge.toLegacyString(),
      species: targetBadge.toString(),
      name1: targetBadge.toLabel(),
      name2: targetBadge.toLabel()!,
      changeType: 'FORM',
    }
  }

  if (!currentBadge) {
    throw new functions.https.HttpsError('invalid-argument',
        `There's a time and place for everything, but not now.`);
  }

  const itemEntry: ItemEntry = {
    item,
    userId,
    target,
    timestamp: FieldValue.serverTimestamp(),
  }
  await db.collection('items-history').add(itemEntry)

  try {
    const simpleItemEntry: ItemEntryAdventureLog = {
      timestamp: Date.now(),
      target,
      item,
    }
    await db.collection('users').doc(userId).collection('adventureLog').doc('itemHistory').update({
      upToDate: true,
      items: FieldValue.arrayUnion(simpleItemEntry)
    })
  } catch (e) {
    console.warn('Items - User does not have an adventure log', e)
  }

  const name1 = targetBadge.toLabel()
  const name2 = new Badge(currentBadge).toLabel() ?? 'Missingno'
  return {
    target,
    transform: currentBadge,
    species: new Badge(currentBadge).toString(),
    name1,
    name2,
    changeType,
  }
}

async function createRaidFromSlate(item: ItemId, user: Users.Doc, userId: string, t: SalamanderTxn, ref: SalamanderRef, slateSeed: number) {
  const boss = randomItem(slateItems[item]!)
  const badge = Badge.fromLegacy(boss)
  badge.personality.variant = randomVariant(Pkmn.get(boss)!)
  // Create Raid
  const location = await getLocation(user.location)
  const newRaidId = `slate-${userId}-${slateSeed}`
  const newRaidRef = db.collection('raids').doc(newRaidId)
  await newRaidRef.set<DbRaid>({
    boss: badge.toLegacyString(),
    host: userId,
    isPublic: false,
    location: user.location,
    locationLabel: Globe[user.location].label,
    locationWeather: location.forecast ?? 'Sunny',

    playerList: [userId],
    rating: 11,
    state: 0,
    timestamp: FieldValue.serverTimestamp(),
    timestampLastUpdated: FieldValue.serverTimestamp(),
    wishes: 0,
    players: {
      [userId]: {
        ready: false,
        ldap: user.ldap,
        species: randomItem(Object.keys(user.pokemon)) as PokemonId,
      }
    },
    shinyCharm: user.hiddenItemsFound.includes(SHINY_CHARM),
    log: '',
  })
  // Decrement slate from bag
  user.items[item]!--
  // Update user raidActive
  user.raidActive![newRaidId] = {
    boss,
    rating: 11,
    reason: 'Host',
  }
  // TODO: This might cause some txn glitches
  // Complete transaction and return
  t.update<Users.Doc>(ref, {
    items: user.items,
    raidActive: user.raidActive,
  })
  console.log(badge)
  return {
    target: badge.toString(),
    badge,
    transform: badge.toLegacyString(),
    species: badge.toString(),
    name1: badge.toLabel(),
    name2: badge.toLabel(),
    changeType: 'RESTORED',
    raidId: newRaidId,
  }
}

async function useItemDirect(data: F.UseItem.Directly, userId: string): Promise<F.UseItem.Res> {
  const {item} = data
  const itemDb = ITEMS[item]
  const slateSeed = Date.now() // To only allow one slate raid to be created per-run
  if (!itemDb.direct) {
    throw new functions.https.HttpsError('failed-precondition', `${item} cannot be used like this`)
  }
  const {badge, raidId} = await db.runTransaction(async t => {
    const ref = db.collection('users').doc(userId)
    const doc = await t.get<Users.Doc>(ref)
    if (!doc.exists) {
      throw new functions.https.HttpsError('invalid-argument', 'User does not exist');
    }
    const user = doc.data()

    if (!hasItem(user, item)) {
      console.error(`${item} is not available for this user`)
      throw new functions.https.HttpsError('invalid-argument',
        `Item ${item} cannot be found`);
    }

    if (itemDb.category === 'fossil' && !hasItem(user, 'explorerkit')) {
      throw new functions.https.HttpsError('invalid-argument', `You cannot restore ${item} without the Explorer Kit`)
    }

    if (Object.keys(slateItems).includes(item)) {
      return createRaidFromSlate(item, user, userId, t, ref, slateSeed)
    }

    // We can use it.
    const directUsage = DirectMap[item]
    if (!directUsage) {
      throw new functions.https.HttpsError('unimplemented',
        `There should be an implementation for ${item} but there is not. Please file a bug.`)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!directUsage.isValid(user as any)) {
      throw new functions.https.HttpsError('invalid-argument',
        `Using ${item} is declared invalid for whatever reason`)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const {items, badge} = directUsage.exchange(user as any)
    const dbpk = Pkmn.get(badge.toLegacyString())!
    if (dbpk.shiny === 'WILD') {
      const isShiny = Math.random() < shinyRate('dowsing', user.hiddenItemsFound)
      if (isShiny) {
        badge.personality.shiny = true
      }
    }
    // Add other properties
    badge.personality.pokeball = 'pokeball'
    badge.personality.location = 'Restored'
    addPokemon(user, badge)

    const researchCurrent = (await accomodateResearch(user, badge.toLegacyString(), 'pokeball')).researchCurrent
    const restorationCount = (() => {
      if (user.restorationCount) return ++user.restorationCount
      return 1
    })()
    t.update<Users.Doc>(ref, {
      pokemon: user.pokemon,
      items,
      researchCurrent,
      restorationCount,
    })
    return {badge}
  })
  // Mirror the same API as above.
  // Note that the client will need to handle the new `changeType` in a special way.
  return {
    target: badge.toString(),
    transform: badge.toLegacyString(),
    species: badge.toString(),
    name1: badge.toLabel(),
    name2: badge.toLabel(),
    changeType: 'RESTORED',
    raidId,
  }
}

export const use_item = functions.https.onCall(async (data: F.UseItem.Req, context): Promise<F.UseItem.Res> => {
  if (!('uid' in context.auth!)) {
    throw new functions.https.HttpsError('not-found', '')
  }
  const userId = context.auth!.uid
  // Add logging for usage
  console.log(`use_item: ${userId} - ${JSON.stringify(data)}`)
  if ('target' in data) {
    return await useItemTarget(data, userId)
  } else {
    return await useItemDirect(data, userId)
  }
})

export const move_tutor = functions.https.onCall(async (data: F.MoveTutor.Req, context): Promise<F.MoveTutor.Res> => {
  const {uid} = context.auth!
  const {tutorId} = data
  if (data.species === undefined) {
    throw new functions.https.HttpsError('failed-precondition', `data.species is undefined`)
  }
  if (data.species.startsWith('potw')) {
    throw new functions.https.HttpsError('failed-precondition', `Please send PokemonId format--found BadgeId format`)
  }

  const {badge, heartscale, armorite, novelMoves} = await db.runTransaction(async (t) => {
    const species = new Badge(data.species)
    const ref = db.collection('users').doc(uid)
    const userDoc = await t.get<Users.Doc>(ref)
    const user = userDoc.data()
    if (!hasPokemon(user, species.toOriginalString())) {
      throw new functions.https.HttpsError('failed-precondition',
        `User does not have Pokemon ${species.toString()}.`)
    }

    if (species.personality.variant !== undefined) {
      throw new functions.https.HttpsError('failed-precondition',
        `You cannot teach additional moves to Pokemon ${species.toString()}; is var${species.personality.variant}.`)
    }

    if (Pkmn.get(species.toLegacyString())?.novelMoves === undefined) {
      throw new functions.https.HttpsError('failed-precondition',
        `You cannot teach any moves to ${species.toString()}.`)
    }

    if (Pkmn.get(species.toLegacyString())!.novelMoves!.length <= tutorId) {
      throw new functions.https.HttpsError('failed-precondition',
        `This move tutor is not available for ${species.toString()}.`)
    }

    if (![3, 6].includes(tutorId)) {
      throw new functions.https.HttpsError('failed-precondition',
        `Not a valid Move Tutor ${tutorId}.`)
    }

    if (tutorId === 3) {
      // Requires 1 Heart Scale
      if (!hasItem(user, 'heartscale', 1)) {
        throw new functions.https.HttpsError('failed-precondition',
          'User does not have enough Heart Scales.')
      }
      user.items.heartscale! -= 1 // Deduct
    }
    if (tutorId === 6) {
      // Requires 1 Armorite Ore
      if (!hasItem(user, 'armorite', 1)) {
        throw new functions.https.HttpsError('failed-precondition',
          'User does not have enough Armorite Ore.')
      }
      user.items.armorite! -= 1 // Deduct
    }
    removePokemon(user, species)
    species.personality.variant = tutorId
    addPokemon(user, species)

    t.update<Users.DbDoc>(ref, {
      pokemon: user.pokemon,
      items: user.items,
      moveTutors: admin.firestore.FieldValue.increment(1),
    })

    return {
      badge: species,
      heartscale: user.items.heartscale!,
      armorite: user.items.armorite!,
      novelMoves: Pkmn.get(species.toLegacyString())!.novelMoves![tutorId],
    }
  })

  return {
    species: badge.toString(),
    heartscale,
    armorite,
    novelMoves,
  }
})

export const move_deleter = functions.https.onCall(async (data: F.MoveDeleter.Req, context): Promise<F.MoveDeleter.Res> => {
  const {uid} = context.auth!

  const {badge} = await db.runTransaction(async (t) => {
    const species = new Badge(data.species)
    const ref = db.collection('users').doc(uid)
    const userDoc = await t.get<Users.Doc>(ref)
    const user = userDoc.data()
    if (!hasPokemon(user, species.toOriginalString())) {
      throw new functions.https.HttpsError('failed-precondition',
        `User does not have Pokemon ${species}.`)
    }

    if (species.personality.variant === undefined) {
      throw new functions.https.HttpsError('failed-precondition',
        `You cannot remove moves from Pokemon ${species.toString()}.`)
    }

    removePokemon(user, species)
    species.personality.variant = undefined // Null-ify var
    addPokemon(user, species)

    t.update<Users.Doc>(ref, {
      currentBadges: user.currentBadges,
      pokemon: user.pokemon,
    })

    return {
      badge: species,
    }
  })

  return {
    species: badge.toString(),
  }
})

export const use_tmtr = functions.https.onCall(async (data: F.UseTmTr.Req, context): Promise<F.UseTmTr.Res> => {
  const {uid} = context.auth!
  const {item} = data
  const itemDb = ITEMS[item]
  if (itemDb === undefined) {
    throw new functions.https.HttpsError('failed-precondition',
      `${item} is not an item`)
  }
  if (itemDb.category !== 'tms' /*&& itemDb.category !== 'trs'*/) {
    throw new functions.https.HttpsError('failed-precondition',
      `There's a time and place for everything, but ${item} cannot be used now`)
  }

  const {badge, move} = await db.runTransaction(async (t) => {
    const ref = db.collection('users').doc(uid)
    const userDoc = await t.get<Users.Doc>(ref)
    const user = userDoc.data()
    const species = data.species.startsWith('potw-') ?
      Badge.fromLegacy(data.species) : new Badge(data.species)

    if (!hasPokemon(user, species.toOriginalString())) {
      throw new functions.https.HttpsError('failed-precondition',
        `User does not have Pokemon ${species.toString()}.`)
    }

    if (species.personality.variant !== undefined) {
      throw new functions.https.HttpsError('failed-precondition',
        `You cannot teach additional moves to Pokemon ${species.toString()}; is var${species.personality.variant}.`)
    }

    const dbPkmn = Pkmn.get(species.toLegacyString())
    if (dbPkmn?.novelMoves === undefined) {
      throw new functions.https.HttpsError('failed-precondition',
        `You cannot teach any moves to ${species.toString()}.`)
    }

    if (!hasItem(user, item)) {
      throw new functions.https.HttpsError('failed-precondition',
        `User does not have ${item}.`)
    }

    user.items[item]!-- // Deduct
    removePokemon(user, species)

    const move: MoveId = item.substring(3) as MoveId
    species.personality.variant = getVariantForMove(species.toString(), move)
    if (species.personality.variant === undefined || species.personality.variant < 1) {
      throw new functions.https.HttpsError('failed-precondition',
        `You cannot teach this move to ${species.toString()}.`)
    }
    addPokemon(user, species)

    t.update<Users.Doc>(ref, {
      pokemon: user.pokemon,
      currentBadges: user.currentBadges,
      items: user.items,
    })

    return {
      badge: species,
      move,
    }
  })

  return {
    species: badge.toString(),
    move,
    item,
  }
})


export const craft_item = functions.https.onCall(async (data: F.CraftItem.Req, context): Promise<F.CraftItem.Res> => {
  const {craft} = data
  const {uid} = context.auth!

  craft.forEach(c => {
    if (!Recipes[c.item]) {
      throw new functions.https.HttpsError('failed-precondition',
        `You cannot craft ${c.item}`)
    }
  })

  return await db.runTransaction(async t => {
    const ref = db.collection('users').doc(uid)
    const userDoc = await t.get<Users.Doc>(ref)
    const user = userDoc.data()
    const location = await getLocation(user.location || 'US-MTV')
    const requirements = toRequirements(user, location)
    const res: F.CraftItem.Res = {
      craft: []
    }

    for (const c of craft) {
      const recipe = Recipes[c.item]
      const isValid = (() => {
        const quest = recipe.unlocked
        for (const q of quest.hints) {
          if (!q.completed(requirements)) {
            return q.msg
          }
        }
        return true
      })()
      if (isValid !== true) {
        throw new functions.https.HttpsError('failed-precondition',
          `You cannot craft ${c.item}: ${isValid}`)
      }
      if (c.count < 1 || !Number.isInteger(c.count)) {
        throw new functions.https.HttpsError('failed-precondition',
          'You cannot craft that number of items')
      }
      for (const [ingredient, count] of Object.entries<number>(recipe.input)) {
        if (!hasItem(user, ingredient as ItemId, count * c.count)) {
          throw new functions.https.HttpsError('failed-precondition',
            `You cannot craft ${c.item}: ${ingredient} < ${count} * ${c.count}`)
        }
      }
    }

    // Now we know they are valid
    for (const c of craft) {
      const recipe = Recipes[c.item]
      for (const [ingredient, count] of Object.entries<number>(recipe.input)) {
        user.items[ingredient]! -= count * c.count
      }
      awardItem(user, recipe.output, c.count)
      res.craft.push({...c, total: user.items[recipe.output]!})
      if (!user.itemsCrafted) {
        user.itemsCrafted = c.count
      } else {
        user.itemsCrafted += c.count
      }
    }

    t.update(ref, { items: user.items, itemsCrafted: user.itemsCrafted })

    return res
  })
})

export const train_pokemon = functions.https.onCall(async (data: F.TrainPokemon.Req, context): Promise<F.TrainPokemon.Res> => {
  const {uid} = context.auth!
  const {item} = data
  const itemDb = ITEMS[item]
  if (itemDb === undefined) {
    throw new functions.https.HttpsError('failed-precondition',
      `${item} is not an item`)
  }

  return db.runTransaction(async (t) => {
    const ref = db.collection('users').doc(uid)
    const userDoc = await t.get<Users.Doc>(ref)
    const user = userDoc.data()
    const species = data.species.startsWith('potw-') ?
      Badge.fromLegacy(data.species) : new Badge(data.species)
    if (!hasPokemon(user, species.toOriginalString())) {
      throw new functions.https.HttpsError('failed-precondition',
        `User does not have Pokemon ${species.toString()}.`)
    }

    const dbPkmn = Pkmn.get(species.toLegacyString())
    if (item === 'maxmushroom' || item === 'maxhoney') {
      if (dbPkmn.gmax === undefined) {
        throw new functions.https.HttpsError('failed-precondition', 'Your Pokḿeon cannot gigantamax!')
      }
      removePokemon(user, species.toOriginalString())
      species.personality.gmax = !species.personality.gmax
      addPokemon(user, species.toString())
      user.items[item]!-- // Deduct
      t.update(ref, {
        items: user.items,
        pokemon: user.pokemon
      })
      return {item, species: species.toString()}
    }

    const teraTypes: Partial<Record<ItemId, Type>> = {
      teranormal: 'Normal',
      terafighting: 'Fighting',
      teraflying: 'Flying',
      terapoison: 'Poison',
      teraground: 'Ground',
      terarock: 'Rock',
      terabug: 'Bug',
      teraghost: 'Ghost',
      terasteel: 'Steel',
      terafire: 'Fire',
      terawater: 'Water',
      teragrass: 'Grass',
      teraelectric: 'Electric',
      terapsychic: 'Psychic',
      teraice: 'Ice',
      teradragon: 'Dragon',
      terafairy: 'Fairy',
      teradark: 'Dark',
      terastellar: 'Status',
    }
    if (teraTypes[item] !== undefined) {
      const newType = teraTypes[item]
      if (species.personality.teraType === newType) {
        throw new functions.https.HttpsError('failed-precondition', 'This Pokémon already is that tera type')
      }
      removePokemon(user, species.toOriginalString())
      species.personality.teraType = newType
      addPokemon(user, species.toString())
      user.items[item]!-- // Deduct
      t.update(ref, {
        items: user.items,
        pokemon: user.pokemon
      })
      return {item, species: species.toString()}
    }
  })
})
