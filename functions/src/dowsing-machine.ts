import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import {
  POKEDOLL,
  MAGNETTRAIN_PASS,
  DITTOS,
  GLOBAL_QUESTS
} from '../../shared/src/quests'
import * as L from '../../shared/src/legendary-quests'
import * as Q from '../../shared/src/quests'
import {
  sudowoodoArray,
  magnetTrainIds,
  gameConfigLoad,
  kecleonArray,
  haircutBrosArray,
  radioQuizHiddenIds,
} from './dowsing-badge'
import * as Utils from './utils'
import * as Sprite from '../../shared/src/sprites'
import * as Pkmn from '../../shared/src/pokemon'
import { Badge } from '../../shared/src/badge3';
import { ITEMS, ItemId } from '../../shared/src/items-list'
import * as P from '../../shared/src/gen/type-pokemon'
import { OptCapt } from './dowsing-machine.utils'
import { getLocation } from './location'
import { Location } from '../../shared/src/locations-list'
import { Questions } from '../../shared/src/radio-quiz'
import { myPokemon } from '../../shared/src/badge-inflate'
import { salamander, SalamanderRef, SalamanderSnapshot, SalamanderTxn } from '@fleker/salamander'
import { DowsingHiddenItem, Users } from './db-types'
import { BadgeId } from '../../shared/src/pokemon/types';
import { shinyRate } from './platform/game-config'
import {toRequirements} from './users'
import { addPokemon, hasItem } from './users.utils'
import { Potw } from '../../shared/src/badge2'
import { F } from '../../shared/src/server-types'
import isDemo from '../../shared/src/platform/isDemo'

const db = salamander(admin.firestore())

interface DowseItemDoc {
  active: boolean
  noShare?: boolean
  item: string
}

interface DowsePokemonDoc {
  active: boolean
  noShare?: boolean
  encounter: string
  item?: string
}

interface DowseEggDoc {
  active: boolean
  noShare?: boolean
  egg: string
}

export const dowse = functions.https.onCall(async (data, context) => {
  const userId = context.auth!.uid
  const hiddenItem = data.hiddenId.replace('?', '')
  console.info(`Hidden Id ${hiddenItem} for ${userId}`)

  const isLegendaryQuest = Q.LEGENDARY_ITEM_QUESTS.filter(item => item.docId === hiddenItem)
  const isKeyItemQuest = Q.KEY_ITEM_QUESTS.filter(item => item.docId === hiddenItem)
  if (isLegendaryQuest.length && isLegendaryQuest[0].encounter) {
    // We can short-circuit the lookup
    const dowse: DowsePokemonDoc = {
      active: true,
      encounter: isLegendaryQuest[0].encounter!,
      noShare: false,
      item: isLegendaryQuest[0].item, // or undefined
    }
    console.log('Short circuit', isLegendaryQuest[0].encounter)
    return await foundPokemon(userId, dowse, hiddenItem)
  } else if (isLegendaryQuest.length && isLegendaryQuest[0].item) {
    const dowse: DowseItemDoc = {
      active: true,
      item: isLegendaryQuest[0].item,
      noShare: false,
    }
    return await foundItem(userId, dowse, hiddenItem)
  } else if (isKeyItemQuest.length && isKeyItemQuest[0].item) {
    // short-circuit
    const dowse: DowseItemDoc = {
      active: true,
      item: isKeyItemQuest[0].item,
      noShare: false,
    }
    return await foundItem(userId, dowse, hiddenItem)
  }

  await gameConfigLoad()

  const doc = await db.collection('hiddenItems').doc(hiddenItem).get()
  if (doc.exists) {
    const data = doc.data() as DowseItemDoc | DowsePokemonDoc | DowseEggDoc
    if (!data.active) {
      throw new functions.https.HttpsError('failed-precondition', 'There is nothing here.');
    }
    if (data.noShare) {
      throw new functions.https.HttpsError('failed-precondition', 'There is nothing here.');
    }
    try {
      if (data['item']) {
        return await foundItem(userId, data as DowseItemDoc, hiddenItem);
      } else if (data['egg']) {
        return await foundEgg(userId, data as DowseEggDoc, hiddenItem);
      } else if (data['encounter']) {
        return await foundPokemon(userId, data as DowsePokemonDoc, hiddenItem);
      } else {
        return await foundHiddenItem(userId, hiddenItem);
      }
    } catch (e) {
      throw new functions.https.HttpsError('cancelled', e)
    }
  } else {
    console.error('Hidden ID doc', hiddenItem, 'does not exist')
    throw new functions.https.HttpsError('not-found', 'Nothing was found nearby.');
  }
})

const foundItem = async (userId: string, data: DowseItemDoc, hiddenItem: string) => {
  // Check if the user has already gotten this item
  const item = data.item as ItemId
  const userRef = db.collection('users').doc(userId)

  return await db.runTransaction(async (t) => {
    const user = await t.get<Users.Doc>(userRef)
    const {items, hiddenItemsFound} = user.data();
    if (hiddenItemsFound && hiddenItemsFound.includes(hiddenItem)) {
      throw new functions.https.HttpsError('already-exists', 
        'There was something here before, but you have picked it up.');
    } else {
      hiddenItemsFound.push(hiddenItem);
      items[item] = !items[item] ? 1 : items[item]! + 1;
      t.update<Users.Doc>(userRef, {
        hiddenItemsFound,
        items
      })
      const label = ITEMS[item].label
      return {
        found: 'item',
        item,
        label,
        html: `You found a <strong>${label}</strong>! The <strong>${label}</strong> was placed in your bag.
          <br><br>
          <sprite-item item="${item}"></sprite-item>`
      }
    }
  })
}

const foundEgg = async (userId: string, data: DowseEggDoc, hiddenItem: string) => {
  // Check if the user has already gotten this Pokémon
  const userRef = db.collection('users').doc(userId)
  let egg = data.egg as BadgeId

  return await db.runTransaction(async (t) => {
    const user = await t.get<Users.Doc>(userRef)
    const {hiddenItemsFound} = user.data()
    const canBeShiny = Pkmn.get(egg)?.shiny === 'WILD'
    if (canBeShiny && Math.random() < shinyRate('dowsing', hiddenItemsFound)) {
      // It is shiny!!
      const badge = Badge.fromLegacy(egg)
      badge.personality.shiny = true
      egg = badge.toLegacyString()
    }
  
    let eggs: Users.Egg[] = []
    if (user.data().eggs && Array.isArray(user.data().eggs)) {
      eggs = user.data().eggs
    }
  
    if (hiddenItemsFound && hiddenItemsFound.includes(hiddenItem)) {
      throw new functions.https.HttpsError('already-exists', 
        'There is a Pokémon nest here. The nest is now empty.');
    }
    const DAY_S = 60 * 60 * 24
    const WEEK_S = DAY_S * 7
    eggs.push({
      hatch: Date.now() / 1000 + WEEK_S, // Can't use timestamps in arrays?
      species: egg
    });
    hiddenItemsFound.push(hiddenItem);
    await t.update<Users.Doc>(userRef, {
      eggs,
      hiddenItemsFound,
    })
    console.log(egg);
    return {
      found: 'egg',
      egg,
      html: `You found an egg! You carefully picked up the egg.<br>
        <img src="${Sprite.egg(egg as BadgeId)}" title="Egg" />`
    }
  })
}

const foundPokemon = async (userId: string, data: DowsePokemonDoc, hiddenItem: string): Promise<OptCapt | undefined> => {
  // Check if the user has already gotten this Pokémon
  const userRef = db.collection('users').doc(userId)
  const pokemon = data.encounter as BadgeId

  const encounteredPokemon = Pkmn.get(pokemon)
  if (!encounteredPokemon) {
    throw new functions.https.HttpsError('not-found',
      `There is something here that should be a Pokémon but is not: ${pokemon}`)
  }

  const transactionResult = await db.runTransaction(async (t) => {
    const userDoc = await t.get<Users.Doc>(userRef)
    const user = userDoc.data()

    if (isDemo) {
      const countUserCaughtPkmn = [...myPokemon(user.pokemon)]
        .map(([, v]) => v)
        .reduce((p, c) => p + c)
      if (countUserCaughtPkmn > 250) {
        throw new functions.https.HttpsError('out-of-range',
          'You cannot catch any more Pokemon in demo mode')
      }
    }

    const {hiddenItemsFound, items, location} = user

    if (hiddenItemsFound.includes(hiddenItem)) {
      throw new functions.https.HttpsError('already-exists', 
        'You return to the area. You spot the footprints where the Pokémon once was.');
    }

    const locationDoc = await (async () => {
      if (location) {
        return await getLocation(location)
      }
      return await getLocation('US-MTV')
    })() as Location

    const questArgs = toRequirements(user, locationDoc)

    // Conditional capture
    const isLegendaryQuest = Q.LEGENDARY_ITEM_QUESTS.find(q => q.docId === hiddenItem)
    if (isLegendaryQuest) {
      const {hints} = isLegendaryQuest.quest!
      for (const hint of hints) {
        const hintCompleted = await hint.completed(questArgs)
        if (!hintCompleted) {
          throw new functions.https.HttpsError('failed-precondition', hint.msg)
        }
      }
    } else if (magnetTrainIds()[hiddenItem]) {
      const cap = captureMagnetTrainPass(questArgs, hiddenItem, items as unknown as Partial<Record<ItemId, number>>)
      if (cap) { return cap }
    } else if (sudowoodoArray().includes(hiddenItem)) {
      const cap = captureSudowoodo(user)
      if (cap) { return cap }
    } else if (kecleonArray().includes(hiddenItem)) {
      const cap = captureKecleon(user)
      if (cap) { return cap }
    }

    const badge = Badge.create(pokemon)
    badge.personality.location = user.location
    badge.personality.pokeball = 'cherishball'
    if (encounteredPokemon.shiny === 'WILD' && Math.random() < shinyRate('dowsing', hiddenItemsFound)) {
      // It is shiny!!
      badge.personality.shiny = true
    }
    addPokemon(user, badge)
    hiddenItemsFound.push(hiddenItem)
    if (data.item) {
      user.items[data.item] = !user.items[data.item] ? 1 : user.items[data.item]! + 1;
    }
    // Perform DB transaction
    await t.update<Users.Doc>(userRef, {
      pokemon: user.pokemon,
      hiddenItemsFound,
      items: user.items,
    })
    return {
      species: badge.toLegacyString(),
      // html: 'n/a'
    } as OptCapt
  }) as OptCapt | undefined

  if (transactionResult !== undefined) {
    console.info('Transaction result', transactionResult)
    return transactionResult // OptCapt value directly
  }

  const {species} = encounteredPokemon
  console.log(pokemon)

  // Come up with a nice visual to show the player
  const url = Sprite.pkmn(pokemon)
  if (hiddenItem === L.MEWTWO) {
    // Mewtwo
    return {
      species: Potw(P.Mewtwo),
      html: `<img src="${Sprite.quest('potw-item-airmail')}" /><br>` +
        `<img src="${Sprite.pkmn('potw-150')}" /><br>` +
        `Mewtwo has appeared in front of you. It seems intrigued by you.`
    }
  }

  if (hiddenItem === L.MEW) {
    // Mew
    return {
      species: Potw(P.Mew),
      html: `<img src="${Sprite.pkmn('potw-151')}" /><br>` + 
      'The truck is pushed out of the way and a small creature begins to float ' +
        'in the air. It seems to be in a good mood.'
    }
  }

  if (hiddenItem === L.LUGIA) {
    return {
      species: Potw(P.Lugia),
      html: `<img src="${Sprite.pkmn('potw-249')}" /><br>` + 
      'A gust of wind blows past you, and you look up to find the source. ' +
        'The creature that dropped the silvery wing sees you, ' +
        'and you can tell it senses your strength.'
    }
  }

  if (hiddenItem === L.HO_OH) {
    return {
      species: Potw(P.Ho_Oh),
      html: `<img src="${Sprite.pkmn('potw-250')}" /><br>` + 
      'You see a shadow as a large being flies above a rainbow. It turns around and returns ' +
        'to look at you. It seems to be impressed by you.'
    }
  }

  if (hiddenItem === L.GS_BALL) {
    return {
      species: Potw(P.Celebi),
      html: `<img src="${Sprite.pkmn('potw-251')}" /><br>` + 
      'The gold and silver ball is placed neatly in the center of the shrine you have built. ' +
        'Suddenly a ' +
        'burst of light flashes in front of you. You see a small Pokémon circle around the ' +
        'shrine and land on top. It seems to appreciate your handiwork.'
    }
  }

  if (hiddenItem === L.GROUDON) {
    return {
      species: Potw(P.Groudon),
      html: `<img src="${Sprite.pkmn(P.Groudon)}" /><br>
        A giant beast emerges from the volcanic lava and appears attracted
        to the ruby luster of the Red Orb.`
    }
  }

  if (hiddenItem === L.KYOGRE) {
    return {
      species: Potw(P.Kyogre),
      html: `<img src="${Sprite.pkmn(P.Kyogre)}" /><br>
        A large creature emerges from the raging sea and appears attracted
        to the sapphire glow of the Blue Orb.`
    }
  }

  if (hiddenItem === L.RAYQUAZA) {
    return {
      species: Potw(P.Rayquaza),
      html: `<img src="${Sprite.pkmn(P.Rayquaza)}" /><br>
        From the peak of Sky Pillar you see a dragon descending to meet you.
        As it hovers above you, you can feel its breath. It seems drawn to you.`
    }
  }

  if (hiddenItem === L.JIRACHI) {
    return {
      species: Potw(P.Jirachi),
      html: `<img src="${Sprite.pkmn(P.Jirachi)}" /><br>
        A shooting star flies overhead. As you begin to make a wish, it stops
        and descends in front of you. The star unfurls itself to reveal a small
        being with its three eyes closed. It wakes up and stares at you quietly.`
    }
  }

  if (hiddenItem === L.DEOXYS) {
    return {
      species: Potw(P.Deoxys),
      html: `<img src="${Sprite.pkmn(pokemon)}" /><br>
        A burst of light shoots out of the meteorite and a lifeform assembles itself.
        It looks around at its surroundings with an air of curiosity. It seems to find you
        to be the most curious.`
    }
  }

  if (hiddenItem === L.DEOXYS_ATK) {
    return {
      species: Potw(P.Deoxys, {form: 'attack'}),
      html: `<img src="${Sprite.pkmn(pokemon)}" /><br>
        Through the chaos of its attacks, it stops when it spots you. The
        lifeform appears to be intimidated by you, and it calms down.`
    }
  }

  if (hiddenItem === L.DEOXYS_DEF) {
    return {
      species: Potw(P.Deoxys, {form: 'defense'}),
      html: `<img src="${Sprite.pkmn(pokemon)}" /><br>
        The lifeform's barriers seem impenetrable. Yet, when it sees you nearby,
        the barriers go away and it seems to await your response.`
    }
  }

  if (hiddenItem === L.DEOXYS_SPE) {
    return {
      species: Potw(P.Deoxys, {form: 'speed'}),
      html: `<img src="${Sprite.pkmn(pokemon)}" /><br>
        While others search far and wide for the missing lifeform, it appears to
        have retreated into the meteorite. It reforms as it detects your presence.`
    }
  }

  if (DITTOS[hiddenItem]) {
    const disguise = DITTOS[hiddenItem]
    return {
      species: Potw(P.Ditto),
      html: `<img src="${Sprite.pkmn('potw-132')}" /><br>` +
      `The ${disguise} turned out to be a Ditto! It appears to enjoy playing with you.`
    }
  }

  if (magnetTrainIds()[hiddenItem]) {
    const item = magnetTrainIds()[hiddenItem].itemGift
    const itemLabel = ITEMS[item].label
    return {
      species: pokemon,
      item: item as ItemId,
      html: `You found a wild ${species}! Looks like it wants to stay with you.<br>
        <img src="${url}" title="${species}" /><br>
        It is holding a <strong>${itemLabel}</strong>`
    }
  }

  console.info('Base case, finding wild', species)
  return {
    species: pokemon,
    html: `You found a wild ${species}! Looks like it wants to stay with you.<br>
      <img src="${url}" title="${species}" />`
  }
}

const foundHiddenItem = async (userId: string, hiddenItem: string) => {
  console.log('Found hidden item', hiddenItem)
  // Check if the user has already gotten this Pokémon
  const userRef = db.collection('users').doc(userId)
  return await db.runTransaction(async (t) => {
    const userDoc = await t.get<Users.Doc>(userRef)
    const user = userDoc.data()
    const {location, hiddenItemsFound, items} = user

    const locationDoc = await (async () => {
      if (location) {
        return await getLocation(location)
      }
      return await getLocation('US-MTV')
    })() as Location

    const questArgs = toRequirements(user, locationDoc)

    // Conditional capture
    const isQuest = Q.KEY_ITEM_QUESTS.find(q => q.docId === hiddenItem)
    if (isQuest) {
      const {hints} = isQuest.quest!
      for (const hint of hints) {
        const hintCompleted = await hint.completed(questArgs)
        if (!hintCompleted) {
          return {
            html: hint.msg
          }
        }
      }
    }

    if (hiddenItemsFound.includes(hiddenItem)) {
      throw new functions.https.HttpsError('already-exists', 'There is nothing else here.')
    } else {
      hiddenItemsFound.push(hiddenItem);
      // Poké Doll
      if (hiddenItem === POKEDOLL) {
        // Also add magnet train pass
        hiddenItemsFound.push(MAGNETTRAIN_PASS)
      } else if (haircutBrosArray().includes(hiddenItem)) {
        return await runHaircutShop(t, userDoc, userRef, hiddenItem)
      } else if (radioQuizHiddenIds().includes(hiddenItem)) {
        return await runRadioQuiz(hiddenItem, items)
      }
      await t.update(userRef, {
        hiddenItemsFound
      })
      // Get HTML from database
      const hiddenDoc = await db.collection('hiddenItems').doc(hiddenItem).get<DowsingHiddenItem>()
      const {image, text} = hiddenDoc.data()
      return {
        html: `<img src="${image}" /><br>${text}`
      }
    }
  })
}

function captureMagnetTrainPass(quest: L.Requirements, hiddenItem: string, items: Partial<Record<ItemId, number>>): OptCapt | void {
  const {hiddenItemsFound} = quest
  // Poké Doll/Magnet train pass
  if (!hiddenItemsFound.includes(POKEDOLL)) {
    // You do not have the train pass
    throw new functions.https.HttpsError('failed-precondition', 
    'You do not have a ticket to board the train.')
  }
  const {itemGift} = magnetTrainIds()[hiddenItem] as {itemGift: ItemId}
  if (items[itemGift]) {
    items[itemGift]!++
  } else {
    items[itemGift] = 1
  }
}

function captureSudowoodo(user: Users.Doc): OptCapt | void {
  // Sudowoodo & squirt bottle
  if (!hasItem(user, 'squirtbottle')) {
    // You do not have a squirt bottle
    return {
      species: Potw(P.Sudowoodo),
      html: 'You see a tree in front of you.'
    }
  }
}

function captureKecleon(user: Users.Doc): OptCapt | void {
  // Kecleon & devon scope
  if (!hasItem(user, 'devonscope')) {
    // You do not have a devon scope
    return {
      species: Potw(P.Kecleon),
      html: 'You see nothing front of you. It is blocking your path.'
    }
  }
}

async function runHaircutShop(t: SalamanderTxn,
    user: SalamanderSnapshot<Users.Doc>, userRef: SalamanderRef, hiddenItem: string): Promise<OptCapt> {
  const {hiddenItemsFound, items} = user.data()
  hiddenItemsFound.push(hiddenItem)
  const dayOfWeek = new Date().getDay()

  // Sunday, Wednesday, Friday
  if (dayOfWeek === 0 || dayOfWeek === 3 || dayOfWeek === 5) {
    // Younger brother
    if (items['pomeg']) {
      items['pomeg']++
    } else {
      items['pomeg'] = 1
    }
    await t.update<Users.Doc>(userRef, {
      hiddenItemsFound,
      items
    })
    return {
      species: Potw(P.Hoothoot),
      item: 'pomeg',
      html: `Take this <strong>Pomeg Berry</strong>. Your Pokémon will enjoy eating it, and` +
        ` it will increase your friendship.<br><br>` +
        `<img src="${Sprite.item('pomeg')}" />`
   }
   // Tuesday, Thursday, Saturday
  } else if (dayOfWeek === 2 || dayOfWeek === 4 || dayOfWeek === 6) {
    // Younger brother
    if (items['kelpsy']) {
      items['kelpsy']++
    } else {
      items['kelpsy'] = 1
    }
    await t.update<Users.Doc>(userRef, {
      hiddenItemsFound,
      items
    })
    return {
      species: Potw(P.Hoothoot),
      item: 'kelpsy',
      html: `Take this <strong>Kelpsy Berry</strong>. Your Pokémon will be delighted to eat it, and` +
        ` it will strengthen your bond together.<br><br>` +
        `<img src="${Sprite.item('kelpsy')}" />`
    }
  } else {
    // Monday
    throw new functions.https.HttpsError('failed-precondition',
      'The haircuit shop is closed for the day.')
  }
}

async function runRadioQuiz(hiddenItem: string, items: Partial<Record<ItemId, number>>) {
  let question;
  if (!('darkstone' in items) || items.darkstone! < 1) {
    question = Questions.filter(q => q.id === 'gen5.philosophy')[0]
  } else if (!('lightstone' in items) || items.lightstone! < 1) {
    question = Questions.filter(q => q.id === 'gen5.philosophy')[0]
  } else {
    const radioQuestions = Object.keys(Questions)
    const questionId = Utils.randomItem(radioQuestions)
    question = Questions[questionId]
  }

  return {
    id: question.id,
    hiddenItem,
    question: question.question,
    options: question.options
  }
}

export const quest_donate = functions.https.onCall(async (data: F.QuestDonate.Req, context): Promise<F.QuestDonate.Res> => {
  const userId = context.auth!.uid
  const {donations, anonymous} = data
  if (!Number.isInteger(donations) || donations < 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Do not do this please')
  }

  const quest = GLOBAL_QUESTS[0]
  const {dbKey} = quest
  const leaderboard = `${dbKey}-list`

  // Get our global counter
  const res = await db.runTransaction(async t => {
    const globalRef = db.collection('test').doc('global')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const globalDoc = await t.get<any>(globalRef)
    const userRef = db.collection('users').doc(userId)
    const user = await t.get<Users.Doc>(userRef)
    let current = 0
    let list: string[] = []
    if (!globalDoc.exists || globalDoc.data()[dbKey] === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await t.set<any>(globalRef, {
        [dbKey]: 0,
        [leaderboard]: []
      })
    } else {
      current = globalDoc.data()[dbKey]
      list = globalDoc.data()[leaderboard]
    }
    const {ldap, items} = user.data()
    if (items.pokeball! < donations) {
      throw new functions.https.HttpsError('invalid-argument', 'You are donating too much')
    }
    const total = quest.count
    if (current > total) {
      throw new functions.https.HttpsError('invalid-argument', 'The goal has already been met!')
    }
    if (donations > 0) {
      // Only update DB if there is something to update
      const toDonate = Math.min(total - current, donations)
      items.pokeball! -= toDonate
      if (isNaN(items.pokeball!)) {
        throw new functions.https.HttpsError('aborted', 'NaN, ending function call early')
      }
      current += toDonate
      t.update(globalRef, {[dbKey]: current})
      if (!list) {
        list = []
      }
      if (anonymous) {
        list.push(`Anonymous - ${toDonate}`)
      } else {
        list.push(`${ldap} - ${toDonate}`)
      }
      t.update(globalRef, {[leaderboard]: list})
      t.update<Users.Doc>(userRef, {items})
    }
    return {current, list}
  })

  return res
})
