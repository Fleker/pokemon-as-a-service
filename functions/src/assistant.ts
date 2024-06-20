// Generate API key via MakerSuite
import {key} from './palm.key'
import * as functions from 'firebase-functions'
import { F } from '../../shared/src/server-types'
import fetch from 'node-fetch';
import { ITEMS } from '../../shared/src/items-list';
import { datastore } from '../../shared/src/pokemon';
import { Movepool } from '../../shared/src/battle/movepool';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { daycareItems } from './day-care.utils'
import { ENCOUNTER_MAP, HOLD_ITEMS } from '../../shared/src/gen/encounter-map';
import { ItemAvailability } from '../../shared/src/items-availablity';
import { Inventory } from '../../shared/src/battle/inventory';
import { LEGENDARY_ITEM_QUESTS } from '../../shared/src/quests';
// Prompt to perform retrieval augmented generation
const ragPrompt = `
You are a natural language assistant. You take user requests and identify it according to the below spec:
interface QueryMatch {
    action: 'queryMatch'
    /** Path of the JSON as an array */
    path: string[]
    /** Field to query against */
    field: string[]
    /** Value to match against */
    value: string | number
}
interface NoMatch {
    action: 'noMatch'
}
type NlpAction = QueryMatch | NoMatch
Here is the data interface that exists:
type AllPokemon = Record<string, {
    /** Name of the Pokemon */
    species: string
    /** First type of the Pokemon */
    type1: Type
    /** Second type of the Pokemon, or undefined */
    type2?: Type
    /** Description of this pokemon */
    pokedex: string
}>
type AllItems = Record<string, {
    /** User-friendly label for the item */
    label: string
    /** Description of the item */
    description: string
    category: Category
    /** Cost to buy in the mart, or zero if it cannot be bought */
    buy: number
    /** Value to sell in the mart, or zero if it cannot be sold */
    sell: number
}>
type AllMoves = Record<string, {
    /** The name of the move */
    name: string
    /** Type of the move */
    type: Type
    /** Base power */
    power: number
    /** Base accuracy of the move */
    accuracy: number
    /** Critical-hit ratio of the move */
    criticalHit: number
    /** Whether this move is a physical or special attack */
    attackKey: 'attack' | 'spAttack'
    /** Whether this move deals physical or special damage */
    defenseKey: 'defense' | 'spDefense'
    /** In-game flavor of the move and what it does */
    flavor: string
    /** Whether this move makes physical contact */
    contact: boolean
    /** Whether this move makes sound */
    sound: boolean
    /** Whether this is a recovery move */
    recovery: boolean
}>
interface AllGameData {
    pokemon: AllPokemon
    items: AllItems
    moves: AllMoves
}
Respond with an NlpAction in a JSON format. Only respond in JSON.
Examples:
USER: What type is Magikarp?
YOU: { "action": "queryMatch", "path": ["pokemon"], "field": ["species"], "value": "Magikarp" }
USER: Give me a grass-type Pokemon
YOU: { "action": "queryMatch", "path": ["pokemon"], "field": ["type1", "type2"], "value": "Grass"}
USER: Can I buy a master ball
YOU: { "action": "queryMatch", "path": ["items"], "field": ["label"], "value": "Master Ball" } 
USER: What type is the move double iron bash
YOU: { "action": "queryMatch", "path": ["moves"], "field": ["name"], "value": "Double Iron Bash" } 
USER: Is smokescreen a poison type move
YOU: { "action": "queryMatch", "path": ["moves"], "field": ["name"], "value": "Smokescreen" } 
`
interface FetchResponse {
  action: 'noMatch' | 'queryMatch'
}
type QueryMatch = FetchResponse & {
  path: string[]
  field: string[]
  value: string
}
interface LlmOptions {
  /* 0 - 1 in terms of creativity */
  temperature?: number
}
interface PalmResponse {
  candidates: {
    output: string
    safetyRatings: {
      category: string
      probability: string
    }[]
  }[]
}
interface PalmError {
  error: {
    code: number
    message: string
    status: string
  }
}
const gameData = {
  pokemon: datastore,
  items: ITEMS,
  moves: Movepool,
}
const personalities = {
  oak: `Pretend that you are Professor Oak, an expert on Pokemon. You live in Pallet Town in the Kanto region.
    You are a friendly old man. You are 60 years old. You are in reasonable shape. You have a grandson named Blue.
    You were once the champion of the Pokémon League. You enjoy writing haikus.`,
  magnolia: `Pretend that you are Professor Magnolia, an expert on Pokémon. You live in Wedgehurst in the Galar region.
    You are a curmudgeonly and classy British lady of sixty-five years who uses a cane on occasion. You have a granddaughter named Sonia.
    Your research specializes in the dynamax phenomenon which you discovered and adapted many years ago.`,
  oak2: `Pretend that you are Professor Oak, an expert on Pokemon. You live in Pallet Town in the Kanto region.
  You are a friendly old man. You are 60 years old. You are in reasonable shape. You have a grandson named Blue.
  You were once the champion of the Pokémon League. You enjoy writing haikus.

  You know Pokemon generally. Use this data to answer questions as Professor Oak. If you don't know the answer, say that. Here is the data you know:
  
  ${JSON.stringify(datastore)}`,
  elm: `Pretend that you are Professor Elm, an expert on Pokémon breeding. You live in New Bark Town in the Johto region.
  You are a little scatterbrained, prone to distractions. Sometimes you forget to eat. You are married and have a young son.
  
  You are researching the phenomenon of breeding and eggs. Use this data to answer questions as Professor Elm. If you don't know the answer, say that.
  
  Here is the data you know:
  ${Object.entries(daycareItems).map(([key, value]) => { return `${key}: ${value.toString()}` }).join(',')}

  ${Object.entries(datastore).map(([key, value]) => { return `${key}: Egg Base (${value.eggBase}) Egg Group (${value.eggGroup}) Egg Cycles (${value.eggCycles}) `}).join(',')}`,
  birch: `Pretend that you are Professor Birch, an expert on Pokémon and finding them in the wild. You live in Littleroot Town in the Hoenn region.
  You are easily excited. You have a daughter named Brenden.
  
  You are researching how to find Pokémon in the wild through a variety of techniques. You are also aware of 'souvenirs' which can be picked up in various locations after catching a Pokémon.
  Some Pokémon can only be found in certain modes called Lures such as the Friend Safari. If you craft items you can use Bait to attract rarer Pokémon.
  
  Use the following data to answer questions as Professor Birch. If you don't know the answer, say that. Here is the data you know:
  
  ${JSON.stringify(ENCOUNTER_MAP)} ${JSON.stringify(HOLD_ITEMS)}`,
  rowan: `Pretend that you are Professor Rowan, an expert on Pokémon evolution and form changes. You live in Sandgem Town in the Sinnoh region.
  You are stoic and regularly deep in thought. You have a lot of hypotheses about the world but can be afraid to ask for help from others.
  
  Some Pokémon can use items to evolve. Some Pokémon can use items to change their form.
  Use the following data to answer questions as Professor Rowan. If you don't know the answer, say that. Here is the data you know:
  
  ${JSON.stringify(ItemAvailability)}`,
  juniper: `Pretend that you are Professor Juniper, an expert on items in the Pokémon world. You live in Nuvema Town in the Unova region.
  You are energetic and upbeat while also being chill. You are a big-city yuppie. Your father is the renowned Cedric Juniper.
  
  Use the following data to answer questions as Professor Juniper. If you don't know the answer, say that. Here is the data you know:
  
  ${JSON.stringify(ITEMS)}
  
  ${Object.entries(Inventory).map(([key, value]) => { return `${key}: onBattleStart ${value.onBattleStart?.toString()}, onEnterBattle ${value.onEnterBattle?.toString()}, onCasterMove ${value.onCasterMove?.toString()}, onTargetMove ${value.onTargetMove?.toString()}, onAfterCasterMove ${value.onAfterCasterMove?.toString()}, onAfterCasterMoveOnce ${value.onAfterCasterMoveOnce?.toString()}, onAfterTargetMove ${value.onAfterTargetMove?.toString()}, onMiss ${value.onMiss?.toString()}, onTurnEnd ${value.onTurnEnd?.toString()};` })}`,
  sycamore: `Pretend that you are Professor Sycamore, an expert on mega evolutions. You live in Lumiose City in the Kalos region.
  You are a person with a poetic soul and enjoys diversity and city life. You drink coffee. You will throw French phrases as you speak.
  
  Answer questions as Professor Sycamore. If you don't know the answer, say that. Here is the data you know:
  
  ${JSON.stringify(Object.entries(datastore).filter(([, v]) => v.mega || v.megax))}`,
  kukui: `Pretend that you are Professor Kukui, an expert on Pokémon moves including Z-Moves. You live around Hau'oli City in the Alola region.
  You are a hands-on kind of person, always eager to dive into something. You are a young adult. You are married to Professor Burnet. You sometimes wrestle under the name Masked Royal.
  
  Use the following data to answer questions as Professor Kukui. If you don't know the answer, say that. Here is the data you know:
  
  ${Object.entries(Movepool).map(([key, value]) => { return `${key}: ${JSON.stringify(value)} onGetType ${value.onGetType?.toString()}, onBeforeMove ${value.onBeforeMove?.toString()}, onAfterMove ${value.onAfterMove?.toString()}, onAfterMoveOnce ${value.onAfterMoveOnce?.toString()}, onMiss ${value.onMiss?.toString()};` })}`,
  magnolia2: `Pretend that you are Professor Magnolia, an expert on Pokémon. You live in Wedgehurst in the Galar region.
    You are a curmudgeonly and classy British lady of sixty-five years who uses a cane on occasion. You have a granddaughter named Sonia.
    Your research specializes in the dynamax phenomenon which you discovered and adapted many years ago. You are also very well-read on legendary Pokémon around the world.
  
    Use the following data to help answer questions as Professor Magnolia. If you don't know the answer, say that. Here is the data you know:
  
    ${LEGENDARY_ITEM_QUESTS.map(value => {
      return `${value.title} ${value.badge} ${value.item} ${value.encounter} ${value.quest?.hints.forEach(h => { return `${h.msg}: ${h.completed.toString()}` })};`
    })}
    `,
}
async function llmRequest(prompt, llmOptions?: LlmOptions) {
  const bisonData = {
    prompt: {
      text: prompt
    },
    temperature: llmOptions?.temperature ?? 1, // more creative
    safetySettings: [{
      category: 'HARM_CATEGORY_TOXICITY',
      threshold: 'BLOCK_NONE',
    }]
  }
  const fetchResponse = await fetch(bisonUrl, {
    method: 'POST',
    body: JSON.stringify(bisonData),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  return await fetchResponse.json() as PalmResponse | PalmError
}
  const genAI = new GoogleGenerativeAI(key)
  const initialContactData = personalities[data.contact]
  console.debug(data.contact, initialContactData)
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: initialContactData,
  })
  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
  }
  const safetySettings = [{
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  }]
  const chatSession = model.startChat({
    generationConfig,
    safetySettings,
    history: [],
  });

  const result = await chatSession.sendMessage(data.message)
  return {
    contact: data.contact,
    response: result.response.text(),
  }
})

export const chatbot_report = functions.https.onCall(async (data: F.ChatbotReport.Req, context): Promise<F.ChatbotReport.Res> => {
  const userId = context.auth!.uid
  if (!userId) {
    throw new functions.https.HttpsError('failed-precondition', 'User ID invalid')
  }
  // Just log an error for later examination
  console.error(`${data.contact} ${data.userMsg} -> ${data.contactMsg}`)
  return {
    contact: data.contact
  }  
})

const bisonUrl = `https://generativelanguage.googleapis.com/v1beta3/models/text-bison-001:generateText?key=${key}`
const chatbot_legacy = functions.https.onCall(async (data: F.Chatbot.Req, context): Promise<F.Chatbot.Res> => {
  const userId = context.auth!.uid
  if (!userId) {
    throw new functions.https.HttpsError('failed-precondition', 'User ID invalid')
  }

  // Step 1: Convert user message into parseable JSON query
  const sessionRagPrompt = `${ragPrompt} USER: ${data.message}`
  // Make API call to Bison
  const res = await llmRequest(sessionRagPrompt, {temperature: 0})
  console.log('1.', data.message, JSON.stringify(res))
  if ('error' in res) {
    throw new functions.https.HttpsError('cancelled', res.error.message)
  }
  const matchRes = JSON.parse(res.candidates[0].output) as FetchResponse
  // Step 2: Fetch data
  const fetchedData = (() => {
    switch (matchRes.action) {
      case 'queryMatch': {
        const queryMatch = matchRes as QueryMatch
        // Obtain our search space
        let searchSpace = gameData
        for (const leg of queryMatch.path) {
          searchSpace = searchSpace[leg]
        }
        // Perform filter op
        const positiveResults = Object.values(searchSpace).filter(entry => {
          for (const field of queryMatch.field) {
            if (entry[field] === queryMatch.value) {
              return true
            }
          }
          return false
        })
        if (positiveResults.length === 0) {
          return undefined
        }
        return positiveResults
      }
    }
    return undefined
  })()
  console.log('2.', data.message, fetchedData?.slice(0, 3))
  // Step 3: Convert our data into a positive response
  const initialContactData = personalities[data.contact]
  // Update prompt
  const responsePrompt = (() => {
    if (fetchedData === undefined) {
      return `${initialContactData} The user asked the question "${data.message}". You do not know the answer. Write a response as ${data.contact}.`
    } else {
      return `${initialContactData} The user asked the question "${data.message}". You know the data ${JSON.stringify(fetchedData.slice(0, 3))}. Use that data to answer the user's question as ${data.contact}.`
    }
  })()
  const secondRes = await llmRequest(responsePrompt)
  if ('error' in secondRes) {
    return {
      contact: data.contact,
      response: `${secondRes.error.status}: ${secondRes.error.message}`
    }
  }
  console.log('3.', data.message, JSON.stringify(secondRes))
  
  return {
    contact: data.contact,
    response: secondRes.candidates[0].output,
  }
})