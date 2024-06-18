import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import * as Q from '../../../../../shared/src/quests'
import {questOrder, pokedexOrder} from '../../../../../shared/src/missions'
import * as Pkmn from '../../../../../shared/src/pokemon'
import { FirebaseService } from 'src/app/service/firebase.service';
import { quest } from '../../../../../shared/src/sprites';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Globe, WeatherType } from '../../../../../shared/src/locations-list';
import { LocationService } from 'src/app/service/location.service';
import { ObjectEntries } from '../../../../../shared/src/object-entries';
import { ACTIVE_RESEARCH, ResearchQuest } from '../../../../../shared/src/research';
import { F, Users } from '../../../../../shared/src/server-types';
import getQuestArgs from 'src/app/to-requirements';

interface DowsingBadge {
  src: string
  id: string
  key: boolean
}

interface NovelLocation {
  forecast: WeatherType
  label: string
}

interface Missions {
  nextQuest?: {
    q: Q.Quest
    progress: number
    step: string
  }
  nextCatch?: {
    q: Q.PokedexQuest
    progress: number
  }
  research?: {
    r: ResearchQuest
    step: number
    progress: number
  }
}

@Component({
  selector: 'app-page-quests',
  templateUrl: './page-quests.component.html',
  styleUrls: ['./page-quests.component.css']
})
export class PageQuestsComponent implements OnInit, OnDestroy {
  @ViewChild('tutorial') tutorial?: ElementRef
  dowsingQuests?: DowsingBadge[]
  missingDowsing: number = 0
  keyItemQuests: Q.Quest[] = Q.KEY_ITEM_QUESTS
  dittoQuests: Q.Quest[]
  pokedexQuests: Q.Quest[] = Q.POKEDEX_QUESTS
  catchQuests: Q.PokedexQuest[] = Q.CATCH_QUESTS
  legendaryQuests: Q.Quest[] = Q.LEGENDARY_ITEM_QUESTS
  globalQuests: Q.GlobalQuest[] = Q.GLOBAL_QUESTS
  novelLocation?: NovelLocation
  user?: Users.Doc
  missions?: Missions = {}
  /** Locale-Formatted number */
  globalQuestDonations: string = '-1';
  firebaseListener: any;

  constructor(
    private firebase: FirebaseService,
    private snackbar: MatSnackBar,
    private locations: LocationService,
  ) {
    this.dittoQuests = []
    for (const [docId, title] of Object.entries(Q.DITTOS)) {
      const badge = Object.entries(Pkmn.datastore)
        .filter(([_, species]) => species.species === title)[0][0]
      const quest = {
        docId,
        badge: `${badge}-ditto`,
        title: `Capture ${title} Ditto`,
        hint: [`There is a ${title} that does not look like the others.`]
      }
      this.dittoQuests.push(quest)
    }
  }

  ngOnInit(): void {
    this.loadDowsingItems()
    this.fetchNovelLocation()
    this.fetchGlobalQuestDonations()
    this.firebaseListener = this.firebase.subscribeUser(async user => {
      if (!user) return
      this.user = user
      this.fetchNextGoals()
    })
  }

  ngOnDestroy() {
    this.firebaseListener?.unsubscribe()
  }

  async loadDowsingItems() {
    const res = await this.firebase.exec<F.UserDowsing.Req, F.UserDowsing.Res>('user_dowsing')
    const items = res.data.data
      .filter((item) => item.badge !== null)
      .sort((itemA: { badge: string; }, itemB: { badge: any; }) => {
        return itemA.badge.localeCompare(itemB.badge)
      })
    this.dowsingQuests = items.map((item: any) => ({
      id: item.id,
      src: quest(item.badge),
      key: item.keyItem
    }))
    this.missingDowsing = res.data.totalItemsCount - res.data.data.length
  }

  async fetchNovelLocation() {
    const forecasts = await this.locations.getAllForecasts()
    const interestingLocations = Object.entries(forecasts)
      .map(([locId, locData]) => ({...locData, label: Globe[locId].label}))
      .filter(location => location.forecast !== 'Sunny')
    if (interestingLocations.length) {
      const index = Math.floor(interestingLocations.length * Math.random())
      this.novelLocation = {
        forecast: interestingLocations[index].forecast,
        label: interestingLocations[index].label,
      }
    }
  }

  async fetchGlobalQuestDonations() {
    try {
      const global = await this.firebase.dbGet(['test', 'global'])
      const quest = Q.GLOBAL_QUESTS[0].dbKey
      const current = global[quest]
      this.globalQuestDonations = current.toLocaleString()
    } catch (e) {
      console.error('Cannot fetch Global Quest data', e)
    }
  }

  async fetchNextGoals() {
    setTimeout(async () => {
      // Delay a smidge
      const nextQuests = questOrder.filter(qid => !this.user.hiddenItemsFound.includes(qid))
      const nextQuestId = nextQuests[0]
      console.debug('Found next goal', nextQuestId)
      if (nextQuestId !== undefined) {
        const nextKey = this.keyItemQuests.find(q => q.docId === nextQuestId)
        const nextLegend = this.legendaryQuests.find(q => q.docId === nextQuestId)
        if (nextKey) {
          console.log('nextkey')
          const nqh = await this.fetchNextQuestHint(nextKey)
          this.missions.nextQuest = {
            q: nextKey,
            progress: nqh.pct,
            step: nqh.uncompletedHint,
          }
        } else if (nextLegend) {
          console.log('nextlegend')
          const nqh = await this.fetchNextQuestHint(nextLegend)
          this.missions.nextQuest = {
            q: nextLegend,
            progress: nqh.pct,
            step: nqh.uncompletedHint,
          }
        }
      }

      const nextCatches = pokedexOrder.filter(pid => !this.user.hiddenItemsFound.includes(pid))
      const nextCatchId = nextCatches[0]
      if (nextCatchId) {
        const ncq = this.catchQuests.find(q => q.docId === nextCatchId)
        this.missions.nextCatch = {
          progress: this.user.pokedex[ncq.region],
          q: ncq,
        }
      }

      const myResearch = ObjectEntries(this.user.researchCurrent) as [string, number][]
      if (myResearch.length) {
        this.missions.research = {
          r: ACTIVE_RESEARCH[myResearch[0][0]],
          step: myResearch[0][1],
          progress: myResearch[0][1] / ACTIVE_RESEARCH[myResearch[0][0]].steps,
        }
      }
    }, 500)
  }

  async fetchNextQuestHint(quest: Q.Quest) {
    const questArgs = await getQuestArgs(this.user, this.locations, this.firebase)
    const subquest = {
      completed: true,
      uncompletedHint: '',
      completedHints: [],
      remainingHints: [],
      pct: 0,
    }
    quest.quest.hints.forEach(hint => {
      if (hint.completed(questArgs) && subquest.completed) {
        subquest?.completedHints.push(hint.msg)
      } else if (subquest.completed) {
        subquest.completed = false
        subquest.uncompletedHint = hint.msg
      }
    })
    subquest.pct = Math.round(100 * subquest.completedHints.length / quest.quest.hints.length)
    return subquest
  }

  tutorialOpen() {
    this.tutorial!.nativeElement.showModal()
  }

  tutorialClose() {
    this.tutorial!.nativeElement.close()
  }
}
