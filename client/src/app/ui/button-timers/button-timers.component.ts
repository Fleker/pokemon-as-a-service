import { AfterViewInit } from '@angular/core';
import { ElementRef } from '@angular/core';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FirebaseService } from 'src/app/service/firebase.service';
import { OVALCHARM } from '../../../../../shared/src/quests';
import { Users } from '../../../../../shared/src/server-types';

type Timeable = 'battle' | 'daycare' | 'research' | 'release' | 'raid' | 'gamecorner'

const icons: Record<Timeable, string> = {
  battle: '/images/sprites/icons/menu-battle.svg',
  daycare: '/images/sprites/icons/menu-daycare.svg',
  research: '/images/sprites/icons/menu-research.svg',
  release: '/images/sprites/icons/menu-release.svg',
  raid: '/images/sprites/icons/menu-raid.svg',
  gamecorner: '/images/sprites/icons/menu-games.svg',
}

@Component({
  selector: 'button-timers',
  templateUrl: './button-timers.component.html',
  styleUrls: ['./button-timers.component.css']
})
export class ButtonTimersComponent implements OnInit, AfterViewInit {
  @ViewChild('dialog') dialog: ElementRef
  hasEggCharm: boolean = false
  notify: boolean = false
  user?: Users.Doc
  notifications: Record<Timeable, boolean> = {
    battle: false, daycare: false, research: false, release: false, raid: false, gamecorner: false,
  }
  releaser?: any

  get timeUntil(): Record<Timeable, number> {
    const privateDaycareTime = this.hasEggCharm ? 30 : 60
    return {
      battle: this.toUntil(60, this.user?.lastBattleStadiumDate, 'battle'),
      daycare: this.toUntil(privateDaycareTime, this.user?.lastDayCareDate, 'daycare'),
      research: this.toUntil(60, this.user?.researchLastClaim, 'research'),
      release: this.toUntil(60, this.releaser?.releasedTime, 'release'),
      raid: this.toUntil(30, this.user?.lastRaidDate, 'raid'),
      gamecorner: this.toNextGameCorner(),
    }
  }

  get counter(): number {
    return Object.values(this.timeUntil).filter(x => x === 0).length
  }

  get tooltip(): string {
    const list: string[] = []
    for (const [key, value] of Object.entries(this.timeUntil)) {
      if (value === 0) {
        list.push(key)
      }
    }
    return list.join(', ')
  }

  constructor(private firebase: FirebaseService) {}

  ngOnInit(): void {
    this.firebase.subscribeUser(user => {
      if (user) {
        this.user = user
        this.hasEggCharm = user.hiddenItemsFound.includes(OVALCHARM)
      }
    })
    this.firebase.subscribeAuth().subscribe(user => {
      if (!user || !user.user) return
      this.firebase.dbListen(['users', user.user.uid, 'adventureLog', 'released'], (doc => {
        this.releaser = doc.data()
      }))
    })
  }

  ngAfterViewInit(): void {
    this.notify = window.localStorage.getItem('button-timer.notify') === 'true'
  }

  toMinutes(ms: number) {
    return Math.floor(ms / 1000 / 60)
  }
  
  toUntil(num: number, field: number, key: Timeable) {
    const now = Date.now()
    const until = num - this.toMinutes(now - field || 0)
    if (until <= 0) {
      if (this.notify && !this.notifications[key]) {
        new Notification(`You can now use the ${key}.`, {
          timestamp: Date.now(),
          icon: icons[key],
          tag: 'timer',
        })
      }
      this.notifications[key] = true
    } else {
      this.notifications[key] = false
    }
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

    if (gcMin <= 0) {
      if (this.notify && !this.notifications.gamecorner) {
        new Notification(`You can now use the Game Corner.`, {
          timestamp: Date.now(),
          icon: icons.gamecorner,
          tag: 'timer',
        })
      }
      this.notifications.gamecorner = true
    } else {
      this.notifications.gamecorner = false
    }

    return Math.max(gcMin, 0)
  }

  show() {
    this.dialog.nativeElement.showModal()
  }

  close() {
    this.dialog.nativeElement.close()
  }

  updateNotify() {
    window.requestAnimationFrame(() => {
      window.localStorage.setItem('button-timer.notify', this.notify ? 'true' : 'false')
    })
  }
}
