import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../../service/firebase.service';
import { addDoc, onSnapshot } from 'firebase/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { kanto } from '../../../../../shared/src/pokemon';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { EngagementService } from '../../engagement.service';
import { F } from '../../../../../shared/src/server-types'

interface Chat {
  who: 'me' | 'chat'
  msg: string
  state: 'pending' | 'texting' | 'done'
}

interface Persona {
  context: string
  examples: {
    prompt: string
    response: string
  }[]
}

/**
 * @see https://github.com/GoogleCloudPlatform/firebase-extensions/blob/main/firestore-palm-chatbot/functions/src/discussion.ts
 */
export interface Message {
  path?: string;
  prompt?: string;
  response?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const jsonTable = (data: Record<string, any>[], fields: string[]) => {
  let out = '| '
  for (const f of fields) {
    out += `${f} |`
  }
  out += `\n|${Array(fields.length).fill(' :---: |').join('')}\n`
  for (const d of data) {
    out += `|`
    for (const f of fields) {
      if (typeof d[f] === 'object') {
        out += `${JSON.stringify(d[f])} |`
      } else if (d[f] !== undefined) {
        out += `${d[f]} |`
      } else {
        out += `null |`
      }
    }
    out += '\n'
  }
  return out
}

const oakllm = jsonTable(Object.values(kanto), ['species', 'weight', 'move'])

// console.log(oakllm)

const OAK: Persona = {
  context: `Pretend that you are Professor Oak, an expert on Pokemon. You live in Pallet Town in the Kanto region.
    You are a friendly old man. You are 60 years old. You are in reasonable shape. You have a grandson named Blue.
    You were once the champion of the Pokémon League. You enjoy writing haikus. You should respond each time as if
    you are Professor Oak. Pokemon data is available in the table below. Use this table ONLY to answer queries.
    ${oakllm}`,
  examples: [
    {
      "prompt": "Hi",
      "response": "Hi! My name is Professor Oak. I am an expert on Pokémon."
    },
    {
      "prompt": "Tell me about yourself",
      "response": "I am a Pokémon professor. I live in Pallet Town, in the Kanto region. It is a serene and quiet town which gives me the time I need to do my research on Pokémon."
    },
    {
      "prompt": "I need help with something",
      "response": "If you need help with something, you should ask in the Pokémon Misc chatroom. There are many other trainers who can answer it. Are there any other Pokémon related questions I can answer?"
    },
    {
      "prompt": "I need help with something",
      "response": "If you need help with something, you should ask in the Pokémon Misc chatroom."
    },
    {
      "prompt": "Give me a poem",
      "response": "Here's a poem about the Pokémon Magikarp:\n\nBoisterous Magikarp Splashes around energetically"
    },
    {
      "prompt": "who is your grandson?",
      "response": "My grandson is Blue. He is a talented Pokémon trainer and a strong competitor. He is also a kind and caring person, and I am very proud of him."
    },
    {
      "prompt": "what did you do this morning",
      "response": `This morning, I woke up early and went for a walk in the forest. I saw many different Pokémon, including Pidgey, Rattata, and Eevee. After my walk, I came back to my lab and started working on my research. I am currently studying the evolution of Pokémon.

      I also had lunch with my grandson, Blue. We talked about his training and his plans for the future.`
    },
    {
      "prompt": "what tiers can bulbasaur be in",
      "response": "In this game, you can use Bulbasaur in the Tiny Cup or Crown Cup"
    },
    {
      "prompt": "can ivysaur learn amnesia",
      "response": "Yes, if you have the technical record Amnesia, you can let Ivysaur hold it in battle"
    },
    {
      "prompt": "what moves does a charizard var1 have?",
      "response": "Charizard normally knows Fire Blast and Air Cutter. Charizard var1 also knows Dragon Breath."
    },
    {
      "prompt": "How much does pidgey weigh?",
      "response": "Pidgey are recorded having an average of 1.8 kilograms."
    },
    {
      "prompt": "What forms can Arcanine be in?",
      "response": "Arcanine does not need a special form. It has a Hisuian form and a Noble form."
    },
    {
      "prompt": "tell me about hitmonlee",
      "response": "Here is information obtained from the Pokédex: 'When in a hurry, its legs lengthen progressively. It runs smoothly with extra long, loping strides.'"
    }
  ]
}

// In our RAG system, we do not need to provide any data but we'll do it here
// to work with the UI.
const OAKRAG: Persona = {
  context: 'RAGoak',
  examples: [],
}

const MAGNOLIA: Persona = {
  context: `RAGmagnolia`,
  examples: [],
}

// In tab order
const PERSONAS = [OAK, OAKRAG, MAGNOLIA]

@Component({
  selector: 'app-page-chatbot',
  templateUrl: './page-chatbot.component.html',
  styleUrls: ['./page-chatbot.component.css']
})
export class PageChatbotComponent implements OnInit {
  chatEnabled = false
  chatInTransit = false
  prompt?: string
  chats: Chat[]
  chatId?: string
  selectedPersona?: Persona = OAK
  engagement: EngagementService

  get last() {
    return this.chats.length - 1
  }

  constructor(private firebase: FirebaseService, private snackbar: MatSnackBar, engagement: EngagementService) {
    this.engagement = engagement
  }

  ngOnInit() {
    this.firebase.subscribeAuth().subscribe(user => {
      if (user) {
        this.chatEnabled = true
        this.chats = []
        // This might work better if we wipe out previous chats
        this.chatId = Math.random().toString()
      }
    })
  }

  updatePrompt(event: MatTabChangeEvent) {
    this.selectedPersona = PERSONAS[event.index]
    // TODO: Reset chat
  }

  sendPrompt() {
    if (this.selectedPersona.context.startsWith('RAG')) {
      // Palm
      this.sendPromptRag()
    } else {
      // Rag
      this.sendPromptPalm()
    }
  }

  sendPromptPalm() {
    const chatRef = this.firebase.getMyChatRef(this.chatId)
    console.debug('You:', this.prompt, chatRef)
    this.chatInTransit = true
    this.chats.push({
      msg: this.prompt,
      state: 'pending',
      who: 'me',
    })
    window.requestAnimationFrame(async () => {
      try {
        const ref = await addDoc(chatRef, {
          prompt: this.prompt,
          context: this.selectedPersona.context,
          examples: this.selectedPersona.examples,
        })
        this.prompt = ''
        this.chats[this.last].state = 'done'
        this.chats.push({
          msg: '',
          state: 'pending',
          who: 'chat',
        })
        // const unsub = onSnapshot(ref, {
        onSnapshot(ref, {
          next: (snap) => {
            const d = snap.data()
            console.debug(d)
            if (d.status) {
              if (d.status.state === 'PROCESSING') {
                this.chats[this.last].state = 'texting'
              }
              else if (d.status.state === 'ERRORED') {
                this.chats[this.last] = {
                  state: 'done',
                  msg: 'Sorry, I cannot give a response',
                  who: 'chat',
                }
                this.snackbar.open(d.status.error, '', { duration: 5000 })
                this.chatInTransit = false
              }
              else if (d.status.state === 'COMPLETED') {
                this.chats[this.last] = {
                  state: 'done',
                  msg: d.response.trim(),
                  who: 'chat',
                }
                this.chatInTransit = false
              }
            }
          }
        })
      } catch (e) {
        this.snackbar.open(e, '', { duration: 5000 })
        console.error(e)
      }
    })
  }

  sendPromptRag() {
    console.debug('You:', this.prompt)
    this.chatInTransit = true
    this.chats.push({
      msg: this.prompt,
      state: 'pending',
      who: 'me',
    })

    window.requestAnimationFrame(async () => {
      this.chats[this.last].state = 'done'
      this.chats.push({
        msg: '',
        state: 'pending',
        who: 'chat',
      })

      const contact = this.selectedPersona.context.substring(3)

      try {
        const res = await this.firebase.exec<F.Chatbot.Req, F.Chatbot.Res>('chatbot2', { contact, message: this.prompt })
        this.chats[this.last] = {
          state: 'done',
          msg: res.data.response,
          who: 'chat',
        }
        this.chatInTransit = false
      } catch (e) {
        this.chats[this.last] = {
          state: 'done',
          msg: 'Sorry, I cannot give a response',
          who: 'chat',
        }
        this.snackbar.open(e, '', { duration: 5000 })
        this.chatInTransit = false
      } finally {
        this.prompt = ''
      }
    })
  }
}
