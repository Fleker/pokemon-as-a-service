import { Injectable } from '@angular/core';
import { isBerryHarvestable, parsePlot } from '../../../shared/src/farming';
import { ObjectEntries } from '../../../shared/src/object-entries';
import { OVALCHARM } from '../../../shared/src/quests';
import { Users, BerryPlot } from '../../../shared/src/server-types';
import { FirebaseService } from './service/firebase.service';

export type Timeable = 'battle' | 'daycare' | 'research' |
  'release' | 'raid' | 'gamecorner' | 'wondertrade'

@Injectable({
  providedIn: 'root'
})
export class EngagementService {
  user?: Users.Doc
  hasEggCharm: boolean = false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  releaser?: any;
  timingMap: Record<string, number> = {};
  timingArray: string[][] = [];

  get isAdmin() {
    return this.firebase.getUid() === 'veXJXuNwZ7RsUXV6tQqWjboQOy03'
  }

  constructor(private firebase: FirebaseService) {
    this.firebase.subscribeUser(async user => {
      if (user) {
        this.user = user
        this.hasEggCharm = user.hiddenItemsFound.includes(OVALCHARM)
        if (this.isAdmin) {
          this.timingMap = await this.firebase.dbGet(['admin', 'cron'])
          this.timingArray = this.buildTimingArray()
        }
      }
    })
    this.firebase.subscribeAuth().subscribe(user => {
      if (!user || !user.user) return
      this.firebase.dbListen(['users', user.user.uid, 'adventureLog', 'released'], (doc => {
        this.releaser = doc.data()
      }))
    })
  }

  get timeUntil(): Record<Timeable, number> {
    const privateDaycareTime = this.hasEggCharm ? 30 : 60
    return {
      battle: this.toUntil(60, this.user?.lastBattleStadiumDate),
      daycare: this.toUntil(privateDaycareTime, this.user?.lastDayCareDate),
      research: this.toUntil(60, this.user?.researchLastClaim),
      release: this.toUntil(60, this.releaser?.releasedTime),
      raid: this.toUntil(30, this.user?.lastRaidDate),
      gamecorner: this.toNextGameCorner(),
      wondertrade: this.toUntil(60 * 23, this.user?.lastWonderTrade),
    }
  }

  get eggsToHatch(): number {
    if (!this.user) return 0
    if (!this.user.eggs) return 0
    if (!Array.isArray(this.user.eggs)) return 0
    return this.user.eggs.filter(egg => {
      // Don't support `egg.laid`
      if (egg.hatch) {
        return Math.floor((Date.now()/1000)) > egg.hatch
      }
      return false
    }).length
  }

  get berriesToPlot(): number {
    if (!this.user) return 0
    return this.user.berryPlanted?.filter(bp => {
      const parsedPlot = parsePlot(bp as BerryPlot)
      if (!parsedPlot) return false
      if (!parsedPlot.item) return false
      if (isBerryHarvestable(parsedPlot.item, parsedPlot.harvest, parsedPlot.fertilizer)) {
        return true
      }
      return false
    }).length
  }

  toMinutes(ms: number) {
    return Math.floor(ms / 1000 / 60)
  }
  
  toUntil(num: number, field: number) {
    const now = Date.now()
    const until = num - this.toMinutes(now - field || 0)
    return Math.max(until, 0)
  }

  toNextGameCorner() {
    const lastGameCorner = (() => {
      if (!this.user || !this.user.lastGameCorner) {
        return '2023-05-08'
      }
      return this.user.lastGameCorner
    })()
    const gcDate = new Date(lastGameCorner)
    const nextDate = new Date(gcDate)
    nextDate.setDate(nextDate.getDate() + 1)
    const gcMs = nextDate.getTime() - Date.now()
    const gcMin = this.toMinutes(gcMs)
    return gcMin
  }

  get isNextUi() {
    return [
      'localhost:4200',
      'next-pokemon-of-the-week.web.app',
      'next-pokemon-of-the-week.firebaseapp.com',
    ].includes(window.location.host)
  }

  buildTimingArray() {
    if (this.timingMap) {
      return ObjectEntries(this.timingMap)
        .map(([a, b]) => [a, new Date(b as number).toString()])
    }
    return []
  }
}
