
import { ElementRef } from '@angular/core';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { FirebaseService } from 'src/app/service/firebase.service';
import { inflate } from '../../../../../shared/src/badge-inflate';
import { Badge, MATCH_REQS } from '../../../../../shared/src/badge3';
import { ITEMS } from '../../../../../shared/src/items-list';
import { requirePotw } from '../../../../../shared/src/legendary-quests';
import { Globe } from '../../../../../shared/src/locations-list';
import { get } from '../../../../../shared/src/pokemon';
import { PokemonId } from '../../../../../shared/src/pokemon/types';
import { battleRanking } from '../../../../../shared/src/prizes';
import { Users, F, notificationTypes } from '../../../../../shared/src/server-types';
import { egg, quest } from '../../../../../shared/src/sprites';
import { calculateNetWorth } from '../../../../../shared/src/events';
import {yirCalculate} from './yearInReview';

declare var window: any;

@Component({
  selector: 'app-page-trainer',
  templateUrl: './page-trainer.component.html',
  styleUrls: ['./page-trainer.component.css']
})
export class PageTrainerComponent implements OnInit, OnDestroy {
  @ViewChild('dforbes') dialogForbes?: ElementRef
  @ViewChild('dyir') dialogYir?: ElementRef
  forbes: string[] = []
  user?: Users.Doc
  settings: Record<string, any> = {}
  localSettings: Record<string, any> = {}
  notificationTypes = notificationTypes
  exec = {
    getForbes: false,
    closeAccount: false,
    clearFcm: false,
    requestHistory: false,
  }
  firebaseListener: any
  yir?: any;
  enableYir = false

  constructor(
    private firebase: FirebaseService,
    private snackbar: MatSnackBar,
  ) { }

  get battleBoxRecord() {
    if (!this.user || !this.user.battleBoxRecord) return undefined
    return `${this.user.battleBoxRecord[1]}-${this.user.battleBoxRecord[2]}` +
      `-${this.user.battleBoxRecord[3]}`
  }

  get battleStadiumRecord() {
    if (!this.user || !this.user.battleStadiumRecord) return undefined
    return `${this.user.battleStadiumRecord[1]}-${this.user.battleStadiumRecord[2]}` +
      `-${this.user.battleStadiumRecord[3]}`
  }

  get battleLevel() {
    if (!this.user || !this.user.battleStadiumRecord) return 0
    return battleRanking(this.user.battleStadiumRecord[1])
  }

  get raidRecord() {
    if (!this.user || !this.user.raidRecord) return undefined
    return `${this.user.raidRecord[1]}-${this.user.raidRecord[2]}` +
      `-${this.user.raidRecord[3]}`
  }

  get voyageCount() {
    if (!this.user) return undefined
    return this.user.voyagesCompleted ?? 0
  }

  get docSize() {
    return Math.ceil(JSON.stringify(this.user || {}).length / 1024)
  }

  get docPercent() {
    if (!this.user) return '??'
    return Math.ceil(this.docSize / 1024 * 100)
  }

  get ldap() {
    return this.user?.ldap
  }

  ngOnInit(): void {
    this.firebaseListener = this.firebase.subscribeUser(user => {
      if (user) {
        this.user = user
        console.debug(user.settings)
        this.settings = user.settings || {}
        for (const n of notificationTypes) {
          if (!(n in this.settings.notification)) {
            // Preset UI
            this.settings.notification[n] = {inapp: false, push: false}
          }
        }
        this.updateTheme()
        // TODO: Get localSettings too
        this.computeYir()
      }
    })
  }

  ngOnDestroy() {
    this.firebaseListener?.unsubscribe()
  }

  async closeAccount() {
    this.exec.closeAccount = true
    window.requestAnimationFrame(async () => {
      if (confirm('Delete your account? This cannot be reverted.')) {
        if (confirm('Are you really sure you want to delete your account?')) {
          try {
            await this.firebase.exec('npc')
            window.location.href = 'https://pokemon.com'
          } catch (e: any) {
            this.snackbar.open(e.message, '', {
              duration: 5000,
            })
          }
        }
      }
    })
  }

  async getForbes() {
    this.exec.getForbes = true
    window.requestAnimationFrame(async () => {
      this.dialogForbes!.nativeElement.showModal()
      const data = await this.firebase.dbGet(['test', 'forbes'])
      const {peeps} = data!
      this.forbes = peeps.map((p: any) => p.ldap)
      this.exec.getForbes = false
    })
  }

  async updateSetting(key: string) {
    window.requestAnimationFrame(async () => {
      const path = key.split('.')
      let keyValue = this.settings
      for (const p of path) {
        if (keyValue[p] !== undefined) {
          keyValue = keyValue[p]
        }
      }
      try {
        await this.firebase.exec<F.Settings.Req, F.Settings.Res>('settings', {
          [key]: (keyValue as unknown as boolean|string) ?? false
        })
        this.snackbar.open('Your setting was updated', '', {
          duration: 3000,
        })
        if (key === 'theme') {
          this.updateTheme()
        }
        await this.firebase.refreshUser()
      } catch (e: any) {
        this.snackbar.open(e.message, '', {
          duration: 5000,
        })
      }
    })
  }

  updateLocalSetting(key: string) {
    window.requestAnimationFrame(async () => {
      try {
        localStorage.setItem(`localSetting_${key}`, this.localSettings![key] ?? false)
      } catch (e: any) {
        this.snackbar.open(e.message, '', {
          duration: 5000,
        })
      }
    })
  }

  async clearFcm() {
    try {
      this.exec.clearFcm = true
      await this.firebase.exec<F.FcmManage.Req, F.FcmManage.Res>('fcm_manage', {
        action: 'CLEAR'
      })
    } catch (e) {
      this.snackbar.open(e.message, '', {duration: 5000})
    } finally {
      this.exec.clearFcm = false
    }
  }

  async requestHistory() {
    try {
      this.exec.requestHistory = true
      // Data is deposited solely in DevTools Network tab.
      // This is a temporary output.
      const res = await this.firebase.exec<F.UserHistory.Req, F.UserHistory.Res>('user_history', {})
      this.download(JSON.stringify(res.data))
    } catch (e) {
      this.snackbar.open(e.message, '', {duration: 5000})
    } finally {
      this.exec.requestHistory = false
    }
  }

  async updateLdap() {
    try {
      const newLdap = window.prompt('Select a new username')
      if (!newLdap || !newLdap.length) return;
      const letsBeSure = window.confirm(`Are you sure you want to change your username to ${newLdap}?`)
      if (!letsBeSure) return;
      const letsBeNice = window.confirm('Confirm you are doing the right thing and not trying to impersonate someone else or use an impolite name. Doing so will result in penalities up to a ban.')
      if (!letsBeNice) return;
      await this.firebase.exec<F.UserSyncLdap.Req, F.UserSyncLdap.Res>('user_sync_ldap', {newLdap})
      this.snackbar.open(`Welcome to the world of Pokémon, ${newLdap}!`, '', {duration: 3000})
    } catch (e) {
      this.snackbar.open(e.message, '', {duration: 5000})
    }
  }

  download(data: string) {
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data))
    element.setAttribute('download', `${this.user!.ldap}.json`)
  
    element.style.display = 'none'
    document.body.appendChild(element)
  
    element.click()
  
    document.body.removeChild(element)
  }

  updateTheme() {
    if (this.settings!.theme === 'dark') {
      localStorage.setItem('darktheme', 'true')
      window.setDarkMode(true)
    } else  if (this.settings!.theme === 'light') {
      localStorage.setItem('darktheme', 'false')
      window.setDarkMode(false)
    } else {
      localStorage.setItem('darktheme', 'false')
      const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
      window.setDarkMode(dark)
    }
  }

  registerProtocolHandlers() {
    navigator.registerProtocolHandler('web+raid', '/raids?%s')
    navigator.registerProtocolHandler('web+trade', '/trade?%s')
    navigator.registerProtocolHandler('web+voyage', '/multiplayer/voyages?%s')
  }

  close() {
    this.dialogForbes!.nativeElement.close()
    this.dialogYir!.nativeElement.close()
  }

  launchYir() {
    this.dialogYir!.nativeElement.showModal()
  }

  /**
   * 2023 recap:
   * - Shiny Shaymin
   * - Shut down legacy domain
   * - Wonder Trade
   * - GMax
   * - XXL/XXS
   * - Natures
   * - Field effects/switching
   * - Ultra Beasts
   * - Meltan
   * - Much of Alola + Galar + Hisui
   * - Open source
   * - PokéGear
   */
  computeYir() {
    const pkmnKeys = Object.keys(this.user.pokemon) as PokemonId[]
    this.yir = {
      ...this.user.yearInReview22,
      battleItem: (() => {
        if (this.user.items.dynamaxband) {
          return 'dynamaxband'
        } else if (this.user.items.zpowerring) {
          return 'zpowerring'
        } else if (this.user.items.sausages) {
          return 'sausages'
        } else if (this.user.items.throatspray) {
          return 'throatspray'
        } else if (this.user.items.dynamaxcandy) {
          return 'dynamaxcandy'
        }
        return undefined
      })(),
      mega: this.user.items.megabracelet,
      zring: this.user.items.zpowerring,
      dmax: this.user.items.dynamaxband,
      rb: (() => {
        if (Badge.match('7I#YL_4', pkmnKeys, MATCH_REQS)) {
          return {sprite: '7I#YL_4', label: 'Shiny Shaymin'}
        } else if (Badge.match('cx#YL_4', pkmnKeys, MATCH_REQS)) {
          return {sprite: 'cx#YL_4', label: 'Shiny Magearna'}
        } else if (Badge.match('cy#YL_4', pkmnKeys, MATCH_REQS)) {
          return {sprite: 'cy#YL_4', label: 'Shiny Marshadow'}
        } else if (Badge.match('cD#YL_4', pkmnKeys, MATCH_REQS)) {
          return {sprite: 'cD#YL_4', label: 'Shiny Zeraora'}
        } else if (Badge.match('cE#YL_4', pkmnKeys, MATCH_REQS)) {
          return {sprite: 'cE#YL_4', label: 'Shiny Meltan'}
          // Or evolved to Melmetal
        } else if (Badge.match('cF#YL_4', pkmnKeys, MATCH_REQS)) {
          return {sprite: 'cE#YL_4', label: 'Shiny Meltan'}
        } else if (Badge.match('dZ#YL_4', pkmnKeys, MATCH_REQS)) {
          return {sprite: 'dZ#YL_4', label: 'Shiny Zarude'}
        }
        return undefined
      })(),
      egg: egg('potw-001'),
      ovalcharm: this.user.hiddenItemsFound.includes('OVALCHARM'),
      favoriteBerry: (() => {
        const berryKeys = Object.entries(ITEMS)
          .filter(([, value]) => value.category === 'berry')
          .map(([key]) => key)
        let favoriteBerry = 'oran'
        let favoriteCount = -1
        for (const b of berryKeys) {
          if (this.user.items[b] > favoriteCount) {
            favoriteBerry = b
            favoriteCount = this.user.items[b]
          }
        }
        return {
          key: favoriteBerry,
          count: favoriteCount,
          label: ITEMS[favoriteBerry].label
        }
      })(),
      curry: (() => {
        for (const k of Object.keys(this.user.items)) {
          if (k.startsWith('curry')) {
            const i = ITEMS[k]
            if (i.consumption !== undefined) {
              return true
            }
          }
        }
        return false
      })(),
      alcremie: (() => {
        for (const k of Object.keys(this.user.pokemon)) {
          if (k.startsWith('dB')) return true
        }
        return false
      })(),
      oak: quest('birch3'),
      zcrystals: (() => {
        const cry = ['zgrassium', 'zfirium', 'zwaterium', 'zflyinium', 'znormalium']
        for (const c of cry) {
          if (this.user.items[c]) return c
        }
        return undefined
      })(),
      wealth23: calculateNetWorth(this.user),
      pkmnCaught: inflate(this.user.pokemon).length,
      pkmnTop: (() => {
        const topPkmn = pkmnKeys.sort((a, b) =>
          yirCalculate(b) - yirCalculate(a))
        console.log(topPkmn)
        const top = new Badge(topPkmn[0])
        return {
          sprite: top.toString(),
          ball: top.personality.pokeball,
          label: top.toLabel(),
          location: Globe[top.personality.location]?.label,
        }
      })(),
      newDex: (() => {
        const {pokedex} = this.user
        if (pokedex.galar === 89 && this.user.yearInReview22?.pokedex.galar < 89) {
          return 'Galar'
        }
        if (pokedex.alola === 86 && this.user.yearInReview22?.pokedex.alola < 86) {
          return 'Alola'
        }
        if (pokedex.kalos === 72 && this.user.yearInReview22?.pokedex.kalos < 72) {
          return 'Kalos'
        }
        if (pokedex.unova === 156 && this.user.yearInReview22?.pokedex.unova < 156) {
          return 'Unova'
        }
        if (pokedex.sinnoh === 107 && this.user.yearInReview22?.pokedex.sinnoh < 107) {
          return 'Sinnoh'
        }
        if (pokedex.hoenn === 135 && this.user.yearInReview22?.pokedex.hoenn < 135) {
          return 'Hoenn'
        }
        if (pokedex.johto === 100 && this.user.yearInReview22?.pokedex.johto < 100) {
          return 'Johto'
        }
        if (pokedex.kanto === 151 && this.user.yearInReview22?.pokedex.kanto < 151) {
          return 'Kanto'
        }
        return undefined
      })()
    }
  }
}
