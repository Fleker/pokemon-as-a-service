import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as Sprite from '../../shared/src/sprites'
import { ITEMS, ItemId } from '../../shared/src/items-list'

import { radioQuizHiddenIds, gameConfigLoad} from './dowsing-badge'
import {CLEAR_BELL} from '../../shared/src/quests'
import { F } from '../../shared/src/server-types';
import { Lottery, RadioQuiz, Users } from './db-types';
import { awardItem } from './users.utils';
import * as RQ from '../../shared/src/radio-quiz'
import { salamander } from '@fleker/salamander'

const db = salamander(admin.firestore())
const FieldValue = admin.firestore.FieldValue
const Utils = require('./utils')

// All of thse are items
const lotteryPrizesMap: {[matches: number]: ItemId[]} = {
  2: [
    'lureball',
    'heavyball',
    'moonball',
    'levelball',
    'fastball',
    'loveball',
    'friendball',
    'competitionball',
    'safariball',
  ],
  3: [
    'pearl',
    'nugget',
    'bigmushroom',
    'seaincense',
    'laxincense',
    'rockincense',
    'oddincense',
    'waveincense',
    'pureincense',
    'fullincense',
    'luckincense',
  ],
  4: [
    'thunderstone',
    'firestone',
    'waterstone',
    'moonstone',
    'leafstone',
    'sunstone',
    'duskstone',
    'shinystone',
  ],
  5: [
    'kingsrock',
    'metalcoat',
    'dragonscale',
    'upgrade',
    'rarecandy',
    'strangesouvenir',
  ],
  6: [
    // 'strangesouvenir',
    'masterball',
  ]
}

const LOTTO_SIZE = 6 // Draw LOTTO_SIZE numbers
const LOTTO_MAX = 9 // Numbers 1 - LOTTO_MAX
const MAX_DRAWS = 50 // No more than MAX_DRAWS draws can be made

function match(input, lotto) {
  // Match right-to-left
  // console.log(input, lotto)
  const inputArr = input.split(' ')
  const lottoArr = lotto.split(' ')
  let matches = 0
  for (let i = LOTTO_SIZE - 1; i >= 0; i--) {
    if (inputArr[i] === lottoArr[i]) {
      matches++
    }
  }
  return matches
}

function getUserLotto() {
  let ticket = ''
  const ticketArray: number[] = []
  for (let i = 0; i < LOTTO_SIZE; i++) {
    const drawnDigit = Math.floor(Math.random() * LOTTO_MAX + 1)
    ticket += `${drawnDigit} `
    ticketArray.push(drawnDigit)
  }
  return {ticket, ticketArray}
}

async function getUniqueUserTrades(userId): Promise<Set<string>> {
  const userDoc = await db.collection('users').doc(userId).get<Users.Doc>()
  const userData = userDoc.data()
  const noTrades = (userData.trainersTraded || 0) + (userData.gtsTraded || 0)

  // You will always have one
  const uniqueTradeIds = new Set(['me'])
  for (let i = 0; i < noTrades; i++) {
    uniqueTradeIds.add(`Trade ${i}`)
  }

  if (uniqueTradeIds.size === 1) console.log(`User ${userId} has no logged trades`)
  return uniqueTradeIds
}

async function getTicketDraws(userId): Promise<number> {
  const iterations = await getUniqueUserTrades(userId)
  // Weigh down the number of draws as a proportion to trades to create more luck.
  return Math.min(Math.max(iterations.size, 1), MAX_DRAWS) * 0.6
}

export const draw_lotto = functions.https.onCall(async (data: F.DrawLotto.Req, context): Promise<F.DrawLotto.Res> => {
  if (!context.auth) {
    throw new functions.https.HttpsError('not-found', '')
  }
  const userId = context.auth!.uid
  // Check that the user hasn't down this today already
  const lottoDbId = new Date().toISOString().substr(0, 10)
  
  const {ticket, lottoDoc, lottoRef} = await db.runTransaction(async t => {
    const lottoRef = db.collection('lottery').doc(lottoDbId)
    const lottoDoc = await t.get<Lottery.Doc>(lottoRef)
    const userLotto = getUserLotto()
    let ticket = userLotto.ticket
    if (lottoDoc.exists) {
      const {draws} = lottoDoc.data()
      ticket = lottoDoc.data().ticket
      if (draws.includes(userId)) {
        throw new functions.https.HttpsError('permission-denied',
          'You already drew a ticket today')
      }
    }
    return {ticket, lottoDoc, lottoRef}
  })

  let matchCountMax = -1 // This way, we always grab the first ticket
  let bestTicket = ''
  let bestTicketArray = Array(6)

  const iterations = await getTicketDraws(userId)
  for (let i = 0; i < iterations; i++) {
    const userLotto = getUserLotto()
    const matchCount = match(userLotto.ticket, ticket)
    if (matchCount > matchCountMax) {
      matchCountMax = matchCount
      bestTicket = userLotto.ticket
      bestTicketArray = userLotto.ticketArray
    }
  }

  const iterationHtml = (() => {
    const weighedIterations = iterations / 0.6
    if (weighedIterations >= MAX_DRAWS) {
      return `<p>You've traded with over ${MAX_DRAWS} trainers! Amazing! We're no longer counting all your trades for ticket draws.</p>`
    } else if (weighedIterations > 1) {
      return `<p>You've traded with ${Math.round(weighedIterations)} trainers. You can always visit the <a href="/gts">GTS</a> to trade more.</p>`
    } else if (weighedIterations === 1) {
      return `<p>You have one ticket. You can always visit the <a href="/gts">GTS</a> to trade more.</p>`
    }
    return '<p>No tickets are being drawn. This is probably a bug.</p>'
  })()

  let html = `
    <p>Today's lucky numbers are <b>${ticket.trim()}</b>.</p>
    ${iterationHtml}
    <p>You drew <b>${bestTicket.trim()}</b>.</p>
    <p>Let's see if you have a match...</p>
    <p>
  `
  let item;
  switch (matchCountMax) {
    case 0:
      html += `Hmm. None of your numbers match.`
      break;
    case 1:
      html += `Only one of your numbers match. I'm sorry.`
      break;
    case 2:
      item = Utils.randomItem(lotteryPrizesMap['2']) as ItemId
      html += `${Sprite.img(Sprite.item(item!))}<br>` +
        `Congratulations! Two digits matched, so you've won a ` +
          `<b>${ITEMS[item!].label}</b>.`
      break;
    case 3:
      item = Utils.randomItem(lotteryPrizesMap['3']) as ItemId
      html += `${Sprite.img(Sprite.item(item!))}<br>` +
        `Wow! Three digits matched, so you've won a ` +
          `<b>${ITEMS[item!].label}</b>.`
      break;
    case 4:
      item = Utils.randomItem(lotteryPrizesMap['4']) as ItemId
      html += `${Sprite.img(Sprite.item(item!))}<br>` +
        `Incredible! Four digits matched, so you've won a ` +
          `<b>${ITEMS[item!].label}</b>.`
      break;
    case 5:
      item = Utils.randomItem(lotteryPrizesMap['5']) as ItemId
      html += `${Sprite.img(Sprite.item(item!))}<br>` +
        `Amazing! Five digits matched, so you've won a ` +
          `<b>${ITEMS[item!].label}</b>.`
      break;
    case 6:
      item = Utils.randomItem(lotteryPrizesMap['6']) as ItemId
      html += `${Sprite.img(Sprite.item(item!))}<br>` +
        `Oh my goodness, all six digits matched! You've won the jackpot prize! You've won the ` +
          `<b>${ITEMS[item!].label}</b>!`
      break;
  }
  html += `</p>`

  const tResult = await db.runTransaction(async (t) => {
    const lottoTDoc = await t.get<Lottery.Doc>(lottoRef)
    const userRef = db.collection('users').doc(userId)
    const userDoc = await t.get<Users.Doc>(userRef)
    const draws: string[] = []
    let matches = (matchCountMax >= 2) ? 1 : 0
    let sum = matchCountMax
    if (lottoDoc.exists) {
      const {draws} = lottoTDoc.data()
      if (draws.includes(userId)) {
        throw new functions.https.HttpsError('permission-denied',
          'You already drew a ticket today')
      }
      draws.push(userId)
      matches += lottoTDoc.data().matches
      sum += lottoTDoc.data().sum
      await t.update(lottoRef, {
        ticket,
        draws,
        matches,
        grandPrizes: matchCountMax === LOTTO_SIZE ?
          FieldValue.increment(1) :
          FieldValue.increment(0),
        sum
      })
    } else {
      draws.push(userId)
      await t.set(lottoRef, {
        ticket,
        draws,
        matches,
        grandPrizes: matchCountMax === LOTTO_SIZE ? 1 : 0,
        sum
      })
    }

    if (item) {
      const user = userDoc.data()
      awardItem(user, item)
      try {
        t.update<Users.Doc>(userRef, { items: user.items })
      } catch (e) {
        console.error(e)
        return {
          html: `There was an error rewarding you with ${item}: ${e}`
        }
      }
    }
    t.update<Users.Doc>(userRef, { lastGameCorner: lottoDbId })
    return {html: ''}
  })

  if (tResult.html) {
    html += tResult.html
  }

  return {
    matchCountMax,
    bestTicket,
    bestTicketArray,
    iterations,
    ticket,
    html,
    item,
  }
})

export const draw_lotto_debug = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('not-found', '')
  }
  const userId = context.auth!.uid
  const set = await getUniqueUserTrades(userId)
  const uniqueTradeIds = [...set]
  return {
    uniqueTradeIds
  }
})

const radioQuizRewards: ItemId[][] = [
  // Sunday
  [
    'pokeball',
    'levelball',
    'tinymushroom',
  ],
  // Monday
  [
    'fastball',
    'loveball',
    'moonball',
    'nugget',
  ],
  // Tuesday
  [
    'heavyball',
    'friendball',
    'lureball',
    'competitionball',
  ],
  // Wednesday
  [
    'fastball',
    'heavyball',
    'lureball',
    'levelball',
  ],
  // Tuesday
  [
    'heavyball',
    'friendball',
    'lureball',
    'competitionball',
  ],
  // Friday
  [
    'fastball',
    'loveball',
    'moonball',
    'nugget',
  ],
  // Saturday
  [
    'pokeball',
    'levelball',
    'tinymushroom',
  ],
]

export const radio_quiz = functions.https.onCall(async (data, context) => {
  const userId = context.auth!.uid
  const {question, answer, hiddenItem} = data
  await gameConfigLoad()

  return await db.runTransaction(async t => {
    const userRef = db.collection('users').doc(userId)
    const userDoc = await t.get<Users.Doc>(userRef)
    const user = userDoc.data()
    const {items, hiddenItemsFound} = user
    if (hiddenItemsFound.includes(hiddenItem)) {
      throw new functions.https.HttpsError('already-exists',
        'Sorry, you have already played this week.')
    }
    if (!radioQuizHiddenIds().includes(hiddenItem)) {
      throw new functions.https.HttpsError('deadline-exceeded',
        `You try to call in the answer, but the show has already ended.`)
      return {
        html: `You try to call in the answer, but the show has already ended.`
      }
    }
    const docData = RQ.Questions.filter(q => q.id === question)[0]
    if (!docData) {
      throw new functions.https.HttpsError('not-found',
        'Cool answer, but that really is not what we were looking for.')
    }
    console.log(`User selected ${answer} and the real answer is ${docData.answer}`)

    if (docData.id === 'gen5.philosophy') {
      // Duplicate of logic below
      // Of course, neither answer is 'really' correct.
      // Mark hidden item
      hiddenItemsFound.push(hiddenItem)

      const prize = (() => {
        if (answer === 'Pursuit of ideals') {
          return 'darkstone'
        }
        return 'lightstone'
      })()
      awardItem(user, prize)
      try {
        await t.update(userRef, { items, hiddenItemsFound })
      } catch (e) {
        console.error(`Cannot give prize to ${userId}`, e)
      }
      try {
        const ref = db.collection('radioQuiz').doc(question)
        const doc = await ref.get<RadioQuiz.Doc>()
        if (doc.exists) {
          await ref.update<RadioQuiz.Doc>({ correct: FieldValue.increment(1) })
        } else {
          await ref.set<RadioQuiz.Doc>({ correct: 1, wrong: 0 })
        }
      } catch (e) {
        console.error('Cannot update quiz correctness', e)
      }
  
      const label = ITEMS[prize] ? ITEMS[prize].label : prize
      if (!ITEMS[prize]) {
        console.error(`Prize ${prize} is not a canonical prize`)
      }
      return {
        prize,
        question: docData.question,
        label,
        sprite: Sprite.item(prize as ItemId),
        html: `${Sprite.img(Sprite.item(prize as ItemId))}<br>` +
          `Correct! Here is a <strong>${label}</strong>. I hope to see you play again next week.`
      }
    }

    if (answer === docData.answer) {
      // Mark hidden item
      hiddenItemsFound.push(hiddenItem)
  
      // The prizes you may win depend on the day of the week
      const prize = (() => {
        if (!hiddenItemsFound.includes(CLEAR_BELL)) {
          hiddenItemsFound.push(CLEAR_BELL)
          return 'Clear Bell'
        } else {
          const prizePool = radioQuizRewards[new Date().getDay()]
          const randomPrize = prizePool[Math.floor(Math.random() * prizePool.length)]
          awardItem(user, randomPrize)
          return randomPrize
        }
      })()
      try {
        await t.update<Users.Doc>(userRef, { items, hiddenItemsFound })
      } catch (e) {
        console.error(`Cannot give prize to ${userId}`, e)
      }
      try {
        const ref = db.collection('radioQuiz').doc(question)
        const doc = await ref.get<RadioQuiz.Doc>()
        if (doc.exists) {
          await ref.update<RadioQuiz.Doc>({ correct: FieldValue.increment(1) })
        } else {
          await ref.set<RadioQuiz.Doc>({ correct: 1, wrong: 0 })
        }
      } catch (e) {
        console.error('Cannot update quiz correctness', e)
      }
  
      const label = ITEMS[prize] ? ITEMS[prize].label : prize
      const sprite = ITEMS[prize] ? Sprite.item(prize as ItemId) : Sprite.quest('potw-item-clearbell') 
      if (!ITEMS[prize]) {
        console.error(`Prize ${prize} is not a canonical prize`)
      }
      return {
        prize,
        quesition: docData.question,
        sprite,
        label,
        html: `${Sprite.img(sprite)}<br>` +
          `Correct! Here is a <strong>${label}</strong>. I hope to see you play again next week.`
      }
    }

    try {
      const ref = db.collection('radioQuiz').doc(question)
      const doc = await ref.get<RadioQuiz.Doc>()
      if (doc.exists) {
        await ref.update<RadioQuiz.Doc>({ wrong: FieldValue.increment(1) })
      } else {
        await ref.set<RadioQuiz.Doc>({ wrong: 1, correct: 0 })
      }
    } catch (e) {
      console.error('Cannot update quiz wrongness', e)
    }

    return {
      question: docData.question,
      html: `Sorry, that was the wrong answer! That's all the time we have this week. Try again next time.`
    }
  })
})
