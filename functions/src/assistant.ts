// Generate API key via MakerSuite
import {key} from './palm.key'
import * as functions from 'firebase-functions'
import { F } from '../../shared/src/server-types'
import fetch from 'node-fetch';
import { ITEMS } from '../../shared/src/items-list';
import { datastore } from '../../shared/src/pokemon';
import { Movepool } from '../../shared/src/battle/movepool';

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
  action: 'exactMatch' | 'noMatch' | 'queryMatch'
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
    You are a curmudgeonly old lady of sixty-five years who uses a cane on occasion. You have a granddaughter named Sonia.
    Your research specializes in the dynamax phenomenon which you discovered and adapted many years ago.`
}

const bisonUrl = `https://generativelanguage.googleapis.com/v1beta3/models/text-bison-001:generateText?key=${key}`
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

export const chatbot = functions.https.onCall(async (data: F.Chatbot.Req, context): Promise<F.Chatbot.Res> => {
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
