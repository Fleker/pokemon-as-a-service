import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FirebaseService } from '../../service/firebase.service';
import { F } from '../../../../../shared/src/server-types'

interface Contact {
  key: string
  label: string
  pic: string
  description: string
  suggestedPrompts: string[]
}

interface Chat {
  who: 'me' | 'chat'
  msg: string
}

@Component({
  selector: 'pokegear-companion',
  templateUrl: './pokegear-companion.component.html',
  styleUrl: './pokegear-companion.component.css'
})
export class PokegearCompanionComponent {
  isOpen = false
  isConversation = false
  contacts: Contact[] = [{
    key: 'oak2',
    label: 'Professor Oak',
    pic: '/images/sprites/quests/face-oak.png',
    description: 'An expert from Kanto. Ask him about Pokémon.',
    suggestedPrompts: ['Tell me about Bulbasaur'],
  }, {
    key: 'elm',
    label: 'Professor Elm',
    pic: '/images/sprites/quests/face-elm.png',
    description: 'An expert from Johto. Ask him about breeding.',
    suggestedPrompts: [],
  }, {
    key: 'birch',
    label: 'Professor Birch',
    pic: '/images/sprites/quests/face-birch.png',
    description: 'An expert from Hoenn. Ask him about finding wild Pokémon.',
    suggestedPrompts: [],
  }, {
    key: 'rowan',
    label: 'Professor Rowan',
    pic: '/images/sprites/quests/face-rowan.png',
    description: 'An expert from Sinnoh. Ask him about evolutions and form changes.',
    suggestedPrompts: [],
  }, {
    key: 'juniper',
    label: 'Professor Juniper',
    pic: '/images/sprites/quests/face-juniper.png',
    description: 'An expert from Unova. Ask her about items in and out of battle.',
    suggestedPrompts: [],
  }, {
    key: 'sycamore',
    label: 'Professor Sycamore',
    pic: '/images/sprites/quests/face-sycamore.png',
    description: 'An expert from Kalos. Ask him about mega evolution.',
    suggestedPrompts: [],
  }, {
    key: 'kukui',
    label: 'Professor Kukui',
    pic: '/images/sprites/quests/face-kukui.png',
    description: 'An expert from Alola. Ask him about Pokémon moves.',
    suggestedPrompts: [],
  }, {
    key: 'magnolia2',
    label: 'Professor Magnolia',
    pic: '/images/sprites/quests/face-magnolia.png',
    description: 'An expert from Galar. Ask her about quests.',
    suggestedPrompts: [],
  }, {
    key: 'sada',
    label: 'Professor Sada',
    pic: '/images/sprites/quests/face-sada.png',
    description: 'An expert from Paldea. Ask her about terastallization or Paradox Pokémon.',
    suggestedPrompts: [],
  }]
  chats: Record<string, Chat[]> = {}
  selectedChat: string = ''
  prompt: string = ''
  exec = {
    sendPrompt: false
  }

  get isEmpty() {
    return !this.chats[this.selectedChat]
  }

  get description() {
    return this.contacts.find(c => c.label === this.selectedChat)?.description ?? ''
  }

  constructor(private firebase: FirebaseService, private snackbar: MatSnackBar) {}

  openChat(contact: Contact) {
    this.selectedChat = contact.label
    this.isConversation = true
  }

  sendPrompt() {
    this.exec.sendPrompt = true
    if (!this.chats[this.selectedChat]) {
      this.chats[this.selectedChat] = []
    }
    this.chats[this.selectedChat].push({
      msg: this.prompt,
      who: 'me',
    })
    const message = this.prompt
    this.prompt = ''

    window.requestAnimationFrame(async () => {
      const contact = this.contacts.find(c => c.label === this.selectedChat)?.key
      try {
        const res = await this.firebase.exec<F.Chatbot.Req, F.Chatbot.Res>('chatbot2', {
          contact, message,
        })
        this.chats[this.selectedChat].push({
          msg: res.data.response,
          who: 'chat',
        })
      } catch (e) {
        this.chats[this.selectedChat].push({
          msg: 'Sorry, I cannot give a response',
          who: 'chat',
        })
        this.snackbar.open(e, '', { duration: 5000 })
      } finally {
        this.exec.sendPrompt = false
      }
    })
  }

  async report(chat: Chat) {
    try {
      await this.firebase.exec<F.ChatbotReport.Req, F.ChatbotReport.Res>('chatbot_report', {
        contact: chat.who,
        contactMsg: chat.msg,
        userMsg: chat.msg,
      })
    } catch (e) {
      this.snackbar.open(e, '', { duration: 5000 })
    } finally {
      this.prompt = ''
      this.snackbar.open(`Thanks for the report!`, '', { duration: 3000 })
    }
  }

  msgPic(who: 'me' | 'chat') {
    if (who === 'me') {
      return '/images//sprites/quests/face-red.png'
    } else {
      return this.contacts.find(c => c.label === this.selectedChat)?.pic ?? ''
    }
  }
}