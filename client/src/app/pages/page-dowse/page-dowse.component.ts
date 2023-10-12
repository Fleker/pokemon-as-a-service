import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FirebaseService } from 'src/app/service/firebase.service';
import { BadgeId, PokemonId } from '../../../../../shared/src/pokemon/types';
import * as Sprite from '../../../../../shared/src/sprites'
import * as Q from '../../../../../shared/src/quests'
import { ITEMS, ItemId } from '../../../../../shared/src/items-list';
import { get } from '../../../../../shared/src/pokemon';
import { Badge } from '../../../../../shared/src/badge3';

enum DowseType {
  PENDING   = 0,
  POKEMON   = 1,
  EGG       = 2,
  ITEM      = 3,
  LEGEND    = 4,
  RADIO     = 5,
  RADIO_ANS = 6,
  MAGNET    = 7,
  ERROR     = 9,
}

interface Req {
  hiddenId: string
}

type Res = ResItem | ResEgg | ResPkmn | ResMagnet | ResRadio

interface ResItem {
  found: 'item',
  item: ItemId
  label: string
}

interface ResEgg {
  found: 'egg',
  egg: BadgeId
}

interface ResPkmn {
  species: BadgeId
}

interface ResMagnet {
  species: BadgeId
  item: ItemId
}

interface ResRadio {
  id: string
  question: string
  option: string[]
}

interface ResUi {
  api: any
  sprite?: string
  label?: string
  species?: PokemonId
  text?: string
}

@Component({
  selector: 'app-page-dowse',
  templateUrl: './page-dowse.component.html',
  styleUrls: ['./page-dowse.component.css']
})
export class PageDowseComponent implements OnInit, OnDestroy {
  DOWSING_MCHN = Sprite.DOWSING_MCHN
  dowseType: DowseType = DowseType.PENDING
  questionId?: string
  answer?: string
  res?: ResUi
  textRes: string = ''
  loaded: boolean = false
  exec = {
    submitAnswer: false,
  }
  firebaseListener: any

  constructor(
    private firebase: FirebaseService,
  ) {}

  ngOnInit(): void {
    const hiddenId = window.location.search.substring(1, window.location.search.length - 1)
    this.firebaseListener = this.firebase.subscribeUser(user => {
      if (user && !this.loaded && hiddenId) {
        this.dowse(hiddenId)
        this.loaded = true
      }
    })
    if ('launchQueue' in window && 'files' in (window as any).LaunchParams.prototype) {
      // https://web.dev/file-handling/
      console.info('The File Handling API is supported.');
      (window as any).launchQueue.setConsumer(async (params) => {
        if (!params.files.length) {
          return;
        }
        for (const handle of params.files) {
          // From here we will read the handle and perform the appropriate dowse
          console.log(handle)
          const file = await handle.getFile()
          console.log(file)
          const rawText = await file.text()
          console.log(rawText)
          const {id} = JSON.parse(rawText)
          console.log(id)
          this.dowse(id)
        }
      })
    }
  }

  ngOnDestroy() {
    this.firebaseListener?.unsubscribe()
  }

  async dowse(hiddenId: string) {
    try {
      const res = await this.firebase.exec<Req, Res>('dowse', {hiddenId})
      const {data} = res
      this.res = {
        api: data
      }
      if ('found' in data) {
        if (data.found === 'item') {
          this.dowseType = DowseType.ITEM
          this.res.label = ITEMS[data.item].label
        } else if (data.found === 'egg') {
          this.res.sprite = Sprite.egg(data.egg)
          this.dowseType = DowseType.EGG
        }
      } else if ('question' in data) {
        this.dowseType = DowseType.RADIO
        this.questionId = data.id
      } else {
        const isLegendaryQuest = Q.LEGENDARY_ITEM_QUESTS
          .filter(item => item.docId === hiddenId)
        // const isKeyItemQuest = Q.KEY_ITEM_QUESTS
        //   .filter(item => item.docId === hiddenId)
        if (hiddenId === Q.DEVONSCOPE) {
          this.dowseType = DowseType.ERROR
          this.textRes = 'Congrats! You now have the Devon Scope. This item was placed in your Key Items pocket.'
          return
        }
        if ('item' in data) {
          this.dowseType = DowseType.MAGNET
          this.res.label = get(data.species).species
          this.res.species = Badge.fromLegacy(data.species).toString()
        } else {
          if (isLegendaryQuest.length > 0) {
            this.dowseType = DowseType.LEGEND
            const {completion} = isLegendaryQuest[0]
            this.res.species = Badge.fromLegacy(data.species).toString()
            this.res.text = completion
            this.res.label = Badge.fromLegacy(data.species).toLabel()
          } else {
            if (data.species) {
              this.dowseType = DowseType.POKEMON
              this.res.label = get(data.species).species
              this.res.species = Badge.fromLegacy(data.species).toString()
            } else {
              this.dowseType = DowseType.ERROR
              this.textRes = data['html']
            }
          }
        }
      }
      this.firebase.refreshUser()
    } catch (e: any) {
      this.dowseType = DowseType.ERROR
      this.textRes = e.message
    }
  }

  async submitAnswer(question) {
    const hiddenItem = window.location.search.substring(1, window.location.search.length - 1)
    this.exec.submitAnswer = true
    window.requestAnimationFrame(async () => {
      try {
        const res = await this.firebase.exec('radio_quiz', {
          question: this.questionId,
          hiddenItem,
          answer: this.answer,
        })
        this.res.api = res.data
        this.dowseType = DowseType.RADIO_ANS
        this.firebase.refreshUser()
      } catch (e: any) {
        this.dowseType = DowseType.ERROR
        this.textRes = e.message
      } finally {
        this.exec.submitAnswer = false
      }
    })
  }
}
