import { ElementRef, OnDestroy } from '@angular/core';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FirebaseService } from 'src/app/service/firebase.service';
import { LocationId } from '../../../../../shared/src/locations-list';
import { GlobalQuest, Medal, PokedexQuest, Quest } from '../../../../../shared/src/quests';
import { quest } from '../../../../../shared/src/sprites';
import { Users } from '../../../../../shared/src/server-types'
import { LocationService } from 'src/app/service/location.service';
import getQuestArgs from 'src/app/to-requirements';

interface SubMedal {
  description: string
  count: number
  sprite: string
}

interface SubLQuest {
  completedHints: string[]
  uncompletedHint?: string
  remainingHints: any[]
  /** Percent complete, 0-100. */
  pct: number
  completed: boolean
}

@Component({
  selector: 'quest-medal',
  templateUrl: './quest-medal.component.html',
  styleUrls: ['./quest-medal.component.css']
})
export class QuestMedalComponent implements OnInit, OnDestroy {
  @Input('medal') medal?: Medal
  @Input('quest') quest?: Quest | PokedexQuest | GlobalQuest
  @ViewChild('dialog') dialog?: ElementRef
  classList: string = ''
  src?: string
  stage?: SubMedal
  medalStage?: number
  counter?: number
  nextStage?: SubMedal
  gated: boolean = false
  loaded = false
  firebaseListener?: any
  questComplete = false

  subquest?: SubLQuest

  private user?: Users.Doc

  constructor(
    private firebase: FirebaseService,
    private locations: LocationService,
  ) {}

  ngOnInit(): void {
    this.firebaseListener = this.firebase.subscribeUser(user => {
      if (user) {
        this.user = user
        if (this.medal) {
          this.src = quest(this.medal.badge)
          setTimeout(async () => {
            await this.updateCurrentStage()
            setTimeout(() => {
              this.loaded = true
            }, 17)
          }, 1000)
        } else {
          this.src = quest(this.quest.badge)
          setTimeout(async () => {
            await this.updateQuest()
            setTimeout(() => {
              this.loaded = true
            }, 17)
          }, 1000)
        }
      }
    })
  }

  ngOnDestroy() {
    this.firebaseListener?.unsubscribe()
  }

  open() {
    if (this.medal) {
      this.updateCurrentStage()
    } else {
      this.updateQuest()
    }
    this.dialog!.nativeElement.showModal()
  }

  close() {
    this.dialog!.nativeElement.close()
  }

  async updateCurrentStage() {
    const args = await getQuestArgs(this.user, this.locations, this.firebase)
    const counter = this.medal!.condition(args)
    const {medal, i} = (() => {
      let medal = this.medal!.hints[0];
      let i = 0
      for (i = 0; i < this.medal!.hints.length; i++) {
        const hint = this.medal!.hints[i]
        if (counter < hint.count) {
          break
        }
        medal = hint
      }
      return {medal, i}
    })()
    this.stage = medal
    this.counter = counter
    if (this.medal.hints.length > 1) {
      // Add this number to differentiate with increasing levels
      this.medalStage = i
    }
    this.nextStage = this.medal!.hints[i]
    this.src = quest(this.stage.sprite)
    if (counter < this.medal!.hints[0].count) {
      this.classList = 'unfound'
    }
  }

  async updateQuest() {
    this.classList = ''
    this.src = quest(this.quest!.badge)
    if (this.user?.hiddenItemsFound.includes(this.quest!.docId)) {
      return // We already have it, no need to recompute
    }
    if (this.quest!.gate) {
      if (!this.user?.hiddenItemsFound.includes(this!.quest!.gate)) {
        this.gated = true
        return // Bail early -- we don't have it
      } else {
      }
    }
    if (this.quest!.quest) {
      let endOf = false
      const questArgs = await getQuestArgs(this.user, this.locations, this.firebase)
      this.subquest = {
        completed: true,
        completedHints: [],
        remainingHints: [],
        pct: 0,
      }
      this.quest!.quest.hints.forEach(hint => {
        if (hint.completed(questArgs) && this.subquest.completed) {
          this.subquest?.completedHints.push(hint.msg)
        } else if (this.subquest.completed) {
          this.subquest.completed = false
          this.subquest.uncompletedHint = hint.msg
        }
      })
      for (let i = this.subquest?.completedHints.length; i < this.quest!.quest.hints.length - 1; i++) {
        // Push empty object
        this.subquest.remainingHints.push('')
      }
      this.subquest.pct = Math.round(100 * this.subquest.completedHints.length / this.quest!.quest.hints.length)
    }
    if ('boss' in this.quest!) {
      if (this.quest.docId !== 'available') {
        this.classList = 'unfound'
      }
    } else {
      if (!this.user!.hiddenItemsFound.includes(this.quest!.docId)) {
        this.classList = 'unfound'
        if (this.subquest?.completed) {
          this.classList = 'unfound animate'
          this.questComplete = true
        }
      }
    }
  }

  get routerQuery() {
    return { [this.quest.docId]: '' }
  }
}
