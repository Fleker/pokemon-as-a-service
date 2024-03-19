import { ElementRef, Injectable } from '@angular/core';
import { Badge } from '../../../../shared/src/badge3';
import { ItemId, ITEMS } from '../../../../shared/src/items-list';
import { Requirements } from '../../../../shared/src/legendary-quests';
import { get } from '../../../../shared/src/pokemon';
import { PokemonId } from '../../../../shared/src/pokemon/types';
import { CATCH_TYPE_ACHIEVEMENTS, COMMUNITY_ACHIEVEMENTS, KEY_ITEM_QUESTS, LEGENDARY_ITEM_QUESTS, Medal, ONEP_ACHIEVEMENTS, POKEDEX_ACHIEVEMENTS, Quest } from '../../../../shared/src/quests';
import { ACTIVE_RESEARCH } from '../../../../shared/src/research';
import { Users } from '../../../../shared/src/server-types';
import getQuestArgs from '../to-requirements';
import { FirebaseService } from './firebase.service';
import { LocationService } from './location.service';
import { TPokemon, myPokemon } from '../../../../shared/src/badge-inflate';

export type AchievementEvent = {
  item?: ItemId
  pokemon?: PokemonId
  label: string
  description: string
  count?: number
  new?: boolean
}

@Injectable({
  providedIn: 'root'
})
export class AchievementsService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  timer: any
  user: Users.Doc
  currentStats: Record<string, number> = {}
  currentItems?: Partial<Record<string, number>>
  currentPokemon?: TPokemon
  toast?: ElementRef<HTMLDivElement>
  events: AchievementEvent[]
  requirements?: Requirements;
  completedUnclaimedQuests = 0
  completedUnclaimedResearch = 0

  constructor(
    private firebase: FirebaseService,
    private locations: LocationService,
  ) {
    this.firebase.subscribeUser(async user => {
      if (!user) return
      this.user = user
      this.requirements = await getQuestArgs(this.user, this.locations, this.firebase)
      if (user.settings.flagAchievementService) return // Turn off
      if (!this.currentItems) {
        this.currentItems = this.user.items
      }
      if (!this.currentPokemon) {
        this.currentPokemon = this.user.pokemon
      }
      const progress = []

      await this.fetchProgress(this.user, this.requirements, progress)
      await this.fetchEvents(this.user, this.events)

      console.debug('Achievements Service', progress.length, progress)
      const msg = (() => {
        if (progress.length === 1) {
          return `Progress! ${progress[0]}`
        } else if (progress.length > 1) {
          return `Progress! ${progress[0]} + ${progress.length - 1} more!`
        }
        return ''
      })()
      const body = progress.join(', ')
      if (progress.length) {
        this.toast.nativeElement.innerText = msg
        this.toast.nativeElement.title = body // Show all
        this.toast.nativeElement.classList.add('show')
        clearTimeout(this.timer) // Cancel previous hides
        this.toast.nativeElement.addEventListener('mouseover', () => {
          clearTimeout(this.timer)
        })
        this.toast.nativeElement.addEventListener('mouseout', () => {
          this.timer = setTimeout(() => {
            this.toast.nativeElement.classList.remove('show')
          }, 3000)
        })
        this.timer = setTimeout(() => {
          this.toast.nativeElement.classList.remove('show')
        }, 9000)
      }
      if (this.events.length) {
        for (let i = 0; i < this.events.length; i++) {
          setTimeout(() => {
            this.events.shift() // Pop first element out of queue
          }, 9000 + i * 500)
        }
      }
    })
  }

  private getCurrentStage(medal: Medal, counter: number) {
    const {stage, i} = (() => {
      let stage = medal.hints[0];
      let i = 0
      for (i = 0; i < medal.hints.length; i++) {
        const hint = medal.hints[i]
        if (counter < hint.count) {
          break
        }
        stage = hint
      }
      return {stage, i}
    })()
    return {
      currentStage: stage,
      nextStage: medal.hints[i],
    }
  }

  // Modified from quest-medal
  private async getCompletedSteps(quest: Quest, r: Requirements) {
    const res = {
      completed: true,
      steps: 0,
    }
    if (!quest.quest) return res
    quest.quest.hints.forEach(hint => {
      if (!res.completed) return
      if (hint.completed(r)) {
        res.steps++
      } else {
        res.completed = false
      }
    })
    return res
  }

  attach(toast: ElementRef<HTMLDivElement>, achievementEvents: AchievementEvent[]) {
    this.toast = toast
    this.events = achievementEvents
  }

  // Code listed below is part of Chrome's effort to improve the UI thread
  // While JS is still not multi-threaded, breaking up steps can help improve
  // performance for operations like catching and hatching.
  // See https://web.dev/optimize-long-tasks/ for future APIs.
  private yieldToMain() {
    return new Promise(resolve => {
      setTimeout(resolve, 0);
    });
  }

  private async fetchProgress(user: Users.Doc, r: Requirements, progress: string[]) {
    const tasks: (() => Promise<void>)[] = []
    // RESEARCH
    this.completedUnclaimedResearch = 0
    for (const [research, steps] of Object.entries(this.user.researchCurrent)) {
      const rquest = ACTIVE_RESEARCH[research]
      if (this.currentStats[research]) {
        if (this.currentStats[research] < steps) {
          if (steps >= rquest.steps) {
            progress.push(`${rquest.title}: Completed!`)
          } else {
            progress.push(`${rquest.title}: (${steps}/${rquest.steps})`)
          }
        }
      }
      this.currentStats[research] = steps
      if (steps >= rquest.steps) {
        this.completedUnclaimedResearch++
      }
    }

    // QUESTS
    this.completedUnclaimedQuests = 0
    for (const lquest of KEY_ITEM_QUESTS) {
      if (this.user.hiddenItemsFound.includes(lquest.docId)) continue // Already done
      if (!this.user.hiddenItemsFound.includes(lquest.gate)) continue // Ignore
      tasks.push((async () => {
        const stats = await this.getCompletedSteps(lquest, r)
        if (this.currentStats[lquest.badge]) {
          if (this.currentStats[lquest.badge] < stats.steps) {
            if (stats.completed) {
              progress.push(`${lquest.title}: Completed!`)
            } else {
              progress.push(`${lquest.title}: (${stats.steps}/${lquest.quest.hints.length})`)
            }
          }
        }
        this.currentStats[lquest.badge] = stats.steps
        if (stats.completed) {
          this.completedUnclaimedQuests++
        }
      }))
    }

    for (const lquest of LEGENDARY_ITEM_QUESTS) {
      if (this.user.hiddenItemsFound.includes(lquest.docId)) continue // Already done
      if (!this.user.hiddenItemsFound.includes(lquest.gate)) continue // Ignore
      tasks.push((async () => {
        const stats = await this.getCompletedSteps(lquest, r)
        if (this.currentStats[lquest.badge]) {
          if (this.currentStats[lquest.badge] < stats.steps) {
            if (stats.completed) {
              progress.push(`${lquest.title}: Completed!`)
            } else {
              progress.push(`${lquest.title}: (${stats.steps}/${lquest.quest.hints.length})`)
            }
          }
        }
        this.currentStats[lquest.badge] = stats.steps
        if (stats.completed) {
          this.completedUnclaimedQuests++
        }
      }))
    }

    // ONEP_ACHIEVEMENTS
    for (const onep of POKEDEX_ACHIEVEMENTS) {
      tasks.push((async () => {
        const nextVal = onep.condition(r)
        if (this.currentStats[onep.badge]) {
          if (this.currentStats[onep.badge] < nextVal) {
            const ns = this.getCurrentStage(onep, nextVal).nextStage
            if (ns && ns.count) {
              const nsc = ns.count
              progress.push(`${onep.title}: (${nextVal}/${nsc})`)
            } /*else { // Already done with this quest. No more progress can be made.
              progress.push(`${onep.title}: (${nextVal})`)
            }*/
          }
        }
        this.currentStats[onep.badge] = nextVal
      }))
    }

    // ONEP_ACHIEVEMENTS
    for (const onep of ONEP_ACHIEVEMENTS) {
      tasks.push((async () => {
        const nextVal = onep.condition(r)
        if (this.currentStats[onep.badge]) {
          if (this.currentStats[onep.badge] < nextVal) {
            const ns = this.getCurrentStage(onep, nextVal).nextStage
            if (ns && ns.count) {
              const nsc = ns.count
              progress.push(`${onep.title}: (${nextVal}/${nsc})`)
            } /*else { // Already done with this quest. No more progress can be made.
              progress.push(`${onep.title}: (${nextVal})`)
            }*/
          }
        }
        this.currentStats[onep.badge] = nextVal
      }))
    }

    for (const onep of CATCH_TYPE_ACHIEVEMENTS) {
      tasks.push((async () => {
        const nextVal = onep.condition(r)
        if (this.currentStats[onep.badge]) {
          if (this.currentStats[onep.badge] < nextVal) {
            const ns = this.getCurrentStage(onep, nextVal).nextStage
            if (ns && ns.count) {
              const nsc = ns.count
              progress.push(`${onep.title}: (${nextVal}/${nsc})`)
            } /*else { // Already done with this quest. No more progress can be made.
              progress.push(`${onep.title}: (${nextVal})`)
            }*/
          }
        }
        this.currentStats[onep.badge] = nextVal
      }))
    }

    for (const medal of COMMUNITY_ACHIEVEMENTS) {
      tasks.push((async () => {
        const nextVal = medal.condition(r)
        if (this.currentStats[medal.badge]) {
          if (this.currentStats[medal.badge] < nextVal) {
            const ns =  this.getCurrentStage(medal, nextVal).nextStage
            if (ns && ns.count) {
              const nsc = ns.count
              progress.push(`${medal.title}: (${nextVal}/${nsc})`)
            } /*else {
              progress.push(`${medal.title}: (${nextVal})`)
            }*/
          }
        }
        this.currentStats[medal.badge] = nextVal
      }))
    }

    while (tasks.length > 0) {
      const task = tasks.shift()
      await task()
      await this.yieldToMain()
    }
  }

  private async fetchEvents(user: Users.Doc, events: AchievementEvent[]) {
    for (const [key, value] of Object.entries(user.items)) {
      const db = ITEMS[key]
      if (!db) continue
      if (this.currentItems[key] && this.currentItems[key] < value) {
        events.push({ item: key as ItemId, label: db.label, description: db.description, count: value - this.currentItems[key] })
      } else if (!(key in this.currentItems)) {
        events.push({ item: key as ItemId, label: db.label, description: db.description, count: value, new: true })
      }
    }
    this.currentItems = user.items

    for (const [key, value] of myPokemon(user.pokemon)) {
      const badge = new Badge(key)
      const [id, personality] = badge.fragments
      const db = get(badge.toLegacyString())
      if (!db) continue
      if (this.currentPokemon[id] === undefined) {
        events.push({ pokemon: key as PokemonId, label: badge.toLabel(), description: 'Added to your Pokédex', new: true})
      } else if (this.currentPokemon[id][personality] === undefined) {
        events.push({ pokemon: key as PokemonId, label: badge.toLabel(), description: 'Sent to your boxes', new: true})
      } else if (this.currentPokemon[id][personality] !== undefined && this.currentPokemon[id][personality] < value) {
        events.push({ pokemon: key as PokemonId, label: badge.toLabel(), description: 'Sent to your boxes', new: true})
      }
    }
    this.currentPokemon = user.pokemon
  }
}
