import { ElementRef } from '@angular/core';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FirebaseService } from 'src/app/service/firebase.service';
import { Badge } from '../../../../../shared/src/badge3';
import { BadgeId, PokemonId, Type } from '../../../../../shared/src/pokemon/types';
import * as RB from '../../../../../shared/src/raid-bosses'
import * as Sprite from '../../../../../shared/src/sprites'
import * as Pkmn from '../../../../../shared/src/pokemon'
import { ObjectEntries } from '../../../../../shared/src/object-entries';
import { ITEMS, ItemId } from '../../../../../shared/src/items-list';
import { DialogItemsComponent } from 'src/app/dialogs/picker-items/picker-items.component';
import { PokemonDialogComponent } from 'src/app/dialogs/pokemon-dialog/pokemon-dialog.component';
import { BattleRaidComponent } from 'src/app/ui/battle-raid/battle-raid.component';
import { Users, F, PublicRaidsDoc } from '../../../../../shared/src/server-types';
import { getAvailableBosses, bossPrizes, RaidBoss } from '../../../../../shared/src/raid-bosses';
import { LocationService } from 'src/app/service/location.service';
import { Globe, LocationId, iconMap } from '../../../../../shared/src/locations-list';
import { PokemonDatalistComponent } from 'src/app/ui/pokemon-datalist/pokemon-datalist.component';
import {raidBattleSettings} from '../../../../../shared/src/raid-settings'
import { potentialPrizes, allTypePrizes } from '../../../../../shared/src/raid-prizes';
import getQuestArgs from 'src/app/to-requirements';
import randomItem from '../../../../../shared/src/random-item';
import { Event, NavigationEnd, Router } from '@angular/router';
import * as Config from '../../../../../shared/src/vendor/example-config';

interface Raid {
  state: number
  result: number
  log: string
  prizes: (ItemId | string)[]
  boss: BadgeId
  isPublic: boolean
}

interface ListedRaid {
  rating: number
  title?: string
  boss: PokemonId
  id: string
  isSpecial?: boolean
  reason?: string
  players?: number
  playerMax?: number
  query?: {
    [id: string]: undefined
  }
}

interface Participant {
  key: string
  ldap?: string
  tank?: boolean
  ready: boolean
  species: PokemonId
  item?: ItemId
  hp?: number
  mine?: boolean
}

interface ValidRaid {
  id: BadgeId
  label: string
}

function flatten(obj:  {[key: string]: {[rating: number]: RaidBoss[]}}) {
  return Object.values(obj)
    .map(x => Object.values(x))
    .flat()
    .flat()
    .map(x => x.species)
    .map(x => Badge.fromLegacy(x).toString())
}

@Component({
  selector: 'app-page-raid',
  templateUrl: './page-raid.component.html',
  styleUrls: ['./page-raid.component.css'],
  // encapsulation: ViewEncapsulation.None,
})
export class PageRaidComponent implements OnDestroy, OnInit {
  @ViewChild('bosses') dialogBosses: ElementRef
  @ViewChild('dprizes') dialogPrizes: ElementRef
  @ViewChild('publish') dialogPublish: ElementRef
  @ViewChild('wish') dialogWish: ElementRef
  @ViewChild('wishselect') dialogWishPicker: ElementRef
  @ViewChild('start') dialogStart: ElementRef
  @ViewChild('items') items?: DialogItemsComponent
  @ViewChild('pokemon') pokemon?: PokemonDialogComponent
  @ViewChild('voter') voter?: PokemonDatalistComponent
  @ViewChild('battleui') battleUi?: BattleRaidComponent
  raidFull = false
  raidBadId = false
  raid?: Raid
  user?: Users.Doc
  locBossList = {
    time: [...new Set(flatten(RB.timeBoss))],
    terrain: [...new Set(flatten(RB.terrainBoss))],
    region: [...new Set(flatten(RB.regionBoss))],
    forecast: [...new Set(flatten(RB.forecastBoss))],
  }
  raidPrizes = potentialPrizes
  allTypePrizes = allTypePrizes
  bossPrizes = Object.values(bossPrizes)
  MONTH_THEME = RB.MONTH_THEME

  myRaids: ListedRaid[] = []
  joinedRaids: ListedRaid[] = []
  publicRaids: ListedRaid[] = []
  publicRaidFilter: string = ''

  passDebt?: number
  wishingpiece?: number
  needToBuyRaidPass = false
  playerIsReady = false
  stats: string[]

  wishId?: BadgeId
  validRaids: ValidRaid[] = []
  willPity = false

  boss?: PokemonId
  bossHp?: number
  host?: string
  bossSprite?: string
  expireDate?: string
  expireDateIso?: string
  types?: Type[]
  rating?: number
  stars?: string
  locationKey?: LocationId
  location?: string
  weather?: string
  playerArray?: Participant[]
  notInRaid = true
  hosting = false
  needClaim = false
  raidPlayers?: number
  raidMax?: number
  resultClass = 'secret'
  prizes?: ItemId[]
  ITEMS = ITEMS
  Config = Config

  RB = RB
  bossList = (arr) => {
    // return arr
    //   .map(boss => Badge.fromLegacy(boss.species).toLabel() + (boss.condition ? "*" : ""))
    //   .join(', ')
    const bosses = new Set<PokemonId>()
    arr.map(boss => Badge.fromLegacy(boss.species).toString())
      .forEach(b => bosses.add(b))
    return [...bosses]
  }
  iconMap = iconMap

  exec = {
    claimPrizes: false,
    clear: false,
    createRaid: false,
    leave: false,
    select: false,
    tank: false,
    raidJoin: false,
    raidPublishConfirm: false,
    raidVote: false,
    raidWishConfirm: false,
  }

  firebaseListener: any

  get raidId() {
    if (!window.location.search) return undefined
    return window.location.search
      .replace('web%2Braid:', '')
      .replace('//', '')
      .replace('?', '')
      .replace('=', '')
  }

  get lastRaidDate() {
    if (!this.user) return -1
    return this.user.lastRaidDate
  }

  get wishingPieces() {
    if (!this.user) return -1
    return this.user.items['wishingpiece'].toLocaleString()
  }

  get passPrice() {
    return raidBattleSettings[this.rating || 1].cost
  }

  get passCount() {
    if (!this.user.items) return -1
    return ('raidpass' in this.user.items) ? this.user.items['raidpass'] : 5
  }

  get passCountStr() {
    return this.passCount?.toLocaleString()
  }

  get filteredPublicRaids() {
    if (!this.publicRaids) return []
    if (this.publicRaidFilter === '') return this.publicRaids
    return this.publicRaids.filter((raid) => {
      const badge = new Badge(raid.boss)
      if (this.publicRaidFilter === raid.rating.toString()) return true
      if (this.publicRaidFilter === badge.id.toString()) return true
      if (badge.toLabel().toLowerCase().includes(this.publicRaidFilter.toLowerCase())) return true
      return false
    })
  }

  get battleInfo() {
    if (!this.pokemon) return ''
    let out: string[] = []
    this.pokemon._selection.forEach((p, i) => {
      let res = new Badge(p.species).toLabel()!
      if (this.items?._selection[i]) {
        res += ` holding ${ITEMS[this.items!._selection[i].item].label}`
      }
      out.push(res)
    })
    return out
  }

  get raidIsWishable() {
    if (!this.raid) return false
    return raidBattleSettings[this.rating].canWish
  }

  constructor(
    readonly firebase: FirebaseService,
    private snackbar: MatSnackBar,
    private locationService: LocationService,
    private router: Router
  ) {
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        if (this.raidId) {
          console.log('listen to ', this.raidId)
          this.listenToRaid()
        }
    
        this.firebase.subscribeAuth().subscribe(user => {
          if (user && this.publicRaids.length === 0) {
            this.populateRaidsList()
          }
        })
    
        if (!this.raidId) {
          this.loadStats() // Is async
        }
      }
    })
  }

  ngOnInit(): void {
    console.log(RB.regionBoss)
    this.firebaseListener = this.firebase.subscribeUser(user => {
      this.user = user
    })
  }

  ngOnDestroy() {
    this.firebaseListener?.unsubscribe()
  }

  listenToRaid() {
    this.firebase.dbListen(['raids', this.raidId], (doc => {
      if (!doc.exists()) {
        this.raidBadId = true
        this.raid = undefined
        return
      }
      this.raidBadId = false
      const uid = this.firebase.getUid()
      const data = doc.data()
      this.raid = data as Raid
      this.boss = Badge.fromLegacy(this.raid.boss).toString()
      this.host = (() => {
        if (!data.players) {
          return undefined
        }
        if (!data.host) {
          return undefined
        }
        if (!data.players[data.host]) {
          return undefined
        }
        return data.players[data.host].ldap
      })()
      this.bossSprite = Sprite.pkmn(this.raid.boss)
      const expireDateMs = data.timestamp.toMillis() + raidBattleSettings[data.rating].expires
      const expirationDate = new Date(expireDateMs)
      this.expireDate = `${expirationDate.toLocaleString()} local time`
      this.expireDateIso = expirationDate.toISOString()
      this.notInRaid = data.players[uid] === undefined
      console.debug('d.p', data.prizes)
      this.handlePasses()

      if (data.state === 0 || data.state === 2 || data.state === 4) {
        const p = Pkmn.get(this.raid.boss)
        this.types = [p.type1, p.type2]
        this.rating = data.rating
        this.stars = '☆'.repeat(this.rating)

        this.locationKey = data.location
        this.location = data.locationLabel
        this.weather = data.locationWeather || 'Sunny'
        this.playerArray = ObjectEntries(data.players).map(([key, player]) => ({
          ...player,
          key,
          species: player.species.startsWith('potw-') ?
            Badge.fromLegacy(player.species).toString() :
            new Badge(player.species).toString(),
        }))
        this.hosting = uid === data.host

        // Enforce species clause
        if (data.rating === 7) {
          // Enforce Tiny clause
          setTimeout(() => {
            // this.pokemon.match(BATTLE_TIERS['Tiny Cup'].eligible[0])
          }, 500)
        }

        // Check room capacity
        this.raidFull = false
        const capacity = raidBattleSettings[data.rating].maxMembers
        if (!data.players[uid] &&
          data.host !== uid &&
          Object.values(data.players).length > capacity - 1) {
            this.raidFull = true
        }
        this.raidPlayers = Object.values(data.players).length
        this.raidMax = capacity

        // Update pickers selection between page loads
        for (const player of this.playerArray) {
          if (player.key === uid) {
            setTimeout(() => {
              // Wait for UI load
              console.debug('Found mine', player.item, player.species)
              console.debug('tis', this.items._selection)
              if (player.item && !this.items._selection.length) {
                this.items._selection = [{index: 0, item: player.item}]
              }
              if (player.species && !this.pokemon._selection.length) {
                this.pokemon._selection = [{index: 0, species: player.species}]
              }
              console.debug('tis2', this.items._selection)
            }, 1000)
          }
        }

      } else if (data.state === 1) {
        setTimeout(() => {
          this.resultClass = ''
        }, 3000)
        if (!data.log) {
          return // Exit listener now, wait for next cycle
        }
        this.bossHp = data.matchState.opponentHps[0]
        const players = [
          ...Object.keys(data.players).sort()
            .filter(key => data.players[key].tank),
          ...Object.keys(data.players).sort()
            .filter(key => !data.players[key].tank),
        ]
        this.playerArray = players.map((_, i) => ({
          key: players[i],
          ...data.players[players[i]],
          hp: data.matchState.playerHps[i],
          mine: players[i] === uid,
          species: data.players[players[i]].species.startsWith('potw-') ?
            Badge.fromLegacy(data.players[players[i]].species) :
            new Badge(data.players[players[i]].species),
        }))

        if (data.prizes) {
          this.prizes = data.prizes[uid]
          if (this.prizes && this.prizes.filter(p => p.startsWith('Prize allocation failed')).length) {
            this.needClaim = true
          } else {
            this.needClaim = false
          }
        } else {
          this.prizes = undefined
        }
        // Here we post our UI updates
        window.requestAnimationFrame(() => {
          this.battleUi.playerArray = this.playerArray
          this.battleUi.raid  = this.raid
          this.battleUi.prizes  = this.prizes
          this.battleUi.needClaim = this.needClaim
          this.battleUi.boss  = this.boss
          this.battleUi.bossHp  = this.bossHp
          this.battleUi.bossItem = RB.bossHeldItem[this.raid.boss]
          this.battleUi.notInRaid  = this.notInRaid
          console.debug('Posted battle UI', this.boss, RB.bossHeldItem[this.raid.boss], this.raid)
        })
      } else if (data.state === 2) {
        console.warn('Raid already in progress')
      } else if (data.state === 3) {
        console.warn('Raid has expired')
      }
    }))
  }

  async populateRaidsList() {
    await this.firebase.dbSearch('raids', {
      ops: [
        ['host', '==', this.firebase.getUid()],
        ['state', '==', 0]
      ],
      max: 10,
    }, res => {
      if (!res.empty) {
        console.debug('User is hosting', res.docs.length, 'raids')
        this.myRaids = res.docs.map(doc => {
          const data = doc.data()
          const capacity = raidBattleSettings[data.rating].maxMembers
          return {
            id: doc.id,
            url: `/raids?${doc.id}`,
            boss: Badge.fromLegacy(data.boss).toString(),
            rating: data.rating,
            players: Object.keys(data.players).length,
            playerMax: capacity,
            query: {[data.id]: undefined},
          }
        }).sort((a, b) => {
          if (a.rating === b.rating) {
            return a.boss.localeCompare(b.boss)
          }
          return a.rating - b.rating // Sort by ID
        })
      } else {
        console.debug('User is not hosting any active raids')
      }
    })

    // Get public raids
    const publicSearch = await this.firebase.dbGet(['raids', '_public']) as PublicRaidsDoc
    const publicRaidMap = publicSearch.list.map(data => {
      // console.log(data.boss, RB.specialRaids.includes(data.boss), RB.specialRaids)
      return {
        url: `/raids?${data.id}`,
        id: data.id,
        boss: Badge.fromLegacy(data.boss).toString(),
        rating: data.rating,
        query: {[data.id]: undefined},
        isSpecial: RB.specialRaids.includes(data.boss),
        players: data.players ?? undefined,
        playerMax: raidBattleSettings[data.rating].maxMembers
      }
    })
    this.publicRaids = publicRaidMap.filter(d => d.isSpecial)
      .sort((a, b) => {
        if (a.rating === b.rating) {
          return a.boss.localeCompare(b.boss)
        }
        return a.rating - b.rating // Sort by ID
      })
    this.publicRaids.push(...publicRaidMap.filter(d => !d.isSpecial)
      .sort((a, b) => {
        if (a.rating === b.rating) {
          return a.boss.localeCompare(b.boss)
        }
        return a.rating - b.rating // Sort by ID
      })
    )
    

    // Get joined raids
    const raidList = await this.firebase.exec('raid_list')
    this.joinedRaids = raidList.data.map(data => {
      return {
        url: `/raids?${data.id}`,
        id: data.id,
        boss: Badge.fromLegacy(data.boss).toString(),
        rating: data.rating,
        reason: data.reason,
        query: {[data.id]: data.id},
      }
    }).sort((a, b) => {
      if (a.rating === b.rating) {
        return a.boss.localeCompare(b.boss)
      }
      return a.rating - b.rating // Sort by ID
    })
  }

  openBosses() {
    this.dialogBosses.nativeElement.showModal()
  }

  closeBosses() {
    this.dialogBosses.nativeElement.close()
  }

  openPrizes() {
    this.dialogPrizes.nativeElement.showModal()
  }

  closePrizes() {
    this.dialogPrizes.nativeElement.close()
  }

  reset() {
    this.raid = undefined
  }

  async clearAll() {
    this.exec.clear = true
    window.requestAnimationFrame(async () => {
      try {
        await this.firebase.exec('raid_active_clear')
        this.snackbar.open('Your list of raids has been cleared.', '', {duration: 3000})
      } catch (e: any) {
        this.snackbar.open(e.message, '', {duration: 5000})
      } finally {
        this.exec.clear = false
      }
    })
  }

  async clear(raidId: string) {
    this.exec.clear = true
    window.requestAnimationFrame(async () => {
      try {
        await this.firebase.exec('raid_active_clear', {id: raidId})
        this.snackbar.open('This raid has been cleared.', '', {duration: 3000})
      } catch (e: any) {
        this.snackbar.open(e.message, '', {duration: 5000})
      } finally {
        this.exec.clear = false
      }
    })
  }

  async tank(playerId: string, isTank: boolean) {
    this.exec.tank = true
    window.requestAnimationFrame(async () => {
      try {
        await this.firebase.exec('raid_tank', {
          playerId,
          isTank,
          raidId: this.raidId
        })
      } catch (e: any) {
        this.snackbar.open(e.message, '', {duration: 5000})
      } finally {
        this.exec.tank = false
      }
    })
  }

  async createRaid(rating: number) {
    this.exec.createRaid = true
    window.requestAnimationFrame(async () => {
      try {
        const res = await this.firebase.exec('raid_create', {rating})
        const {raidId} = res.data
        this.router.navigate(['/raids'], {
          queryParams: {
            [raidId]: raidId,
          }
        })
      } catch (e: any) {
        this.snackbar.open(e.message, '', {duration: 5000})
      } finally {
        this.exec.createRaid = false
      }
    })
  }

  async raidWish() {
    if (this.willPity) {
      const validRaids = await this.getRaidBoss(this.rating)
      if (Array.isArray(validRaids)) {
        this.validRaids = validRaids.map(x => ({
          id: x.species,
          label: Badge.fromLegacy(x.species).toLabel()
        }))
      } else {
        this.validRaids = [{
          id: validRaids.species as BadgeId,
          label: Badge.fromLegacy(validRaids.species).toLabel()
        }]
      }
      this.dialogWishPicker.nativeElement.show()
    } else {
      this.dialogWish.nativeElement.showModal()
    }
  }

  raidWishCancel() {
    this.dialogWish.nativeElement.close()
    this.dialogWishPicker.nativeElement.close()
  }

  async raidWishConfirm() {
    this.dialogWish.nativeElement.close()
    this.dialogWishPicker.nativeElement.close()
    this.exec.raidWishConfirm = true
    window.requestAnimationFrame(async () => {
      try {
        const res = await this.firebase.exec('raid_wish', {
          raidId: this.raidId,
          wishForBoss: this.willPity ?
            this.wishId : undefined
        })
        this.bossSprite = '' // Reset image
        this.willPity = res.data.willPity || false
      } catch (e: any) {
        this.snackbar.open(e.message, '', {duration: 5000})
      } finally {
        this.exec.raidWishConfirm = false
      }
    })
  }

  async raidJoin() {
    this.exec.raidJoin = true
    window.requestAnimationFrame(async () => {
      try {
        await this.firebase.exec('raid_select', {
          raidId: this.raidId,
          ready: false,
          item: null,
          species: 'first', // To select first and confirm slot
        })
      } catch (e: any) {
        this.snackbar.open(e.message, '', {duration: 5000})
      } finally {
        this.exec.raidJoin = false
      }
    })
  }

  async select() {
    this.exec.select = true
    if (!this.playerIsReady) {
      this.playerIsReady = window.confirm('Are you ready for this raid?')
    }
    window.requestAnimationFrame(async () => {
      try {
        await this.firebase.exec('raid_select', {
          raidId: this.raidId,
          ready: this.playerIsReady,
          item: this.items._selection?.[0]?.item ?? null,
          species: this.pokemon._selection[0].species
        })
      } catch (e: any) {
        this.snackbar.open(e.message, '', {duration: 5000})
      } finally {
        this.exec.select = false
      }
    })
  }

  raidStart() {
    this.dialogStart.nativeElement.showModal()
  }

  raidStartCancel() {
    this.dialogStart.nativeElement.close()
  }

  async raidStartConfirm() {
    try {
      this.dialogStart.nativeElement.close()
      this.snackbar.open('Raid is starting.', '', {duration: 3000})
      await this.firebase.exec('raid_start', {
        raidId: this.raidId,
        override: true, // Not implemented
      }, {
        timeout: 180 * 1000 // 3m
      })
    } catch (e: any) {
      this.snackbar.open(e.message, '', {duration: 5000})
    }
  }

  async leave() {
    this.exec.leave = true
    window.requestAnimationFrame(async () => {
      try {
        const actually = confirm('Actually leave this raid?')
        if (!actually) return // Misclick
        await this.firebase.exec('raid_select', {
          raidId: this.raidId,
          species: 'null' // To remove entry
        })
      } catch (e) {
        this.snackbar.open(e.message, '', {duration: 5000})
      } finally {
        this.exec.leave = false
      }
    })
  }

  raidPublish() {
    this.dialogPublish.nativeElement.showModal()
  }

  raidPublishCancel() {
    this.dialogPublish.nativeElement.close()
  }

  async raidPublishConfirm() {
    this.exec.raidPublishConfirm = true
    window.requestAnimationFrame(async () => {
      try {
        await this.firebase.exec('raid_publicize', {raidId: this.raidId})
        this.raidPublishCancel()
      } catch (e: any) {
        this.snackbar.open(e.message, '', {duration: 5000})
      } finally {
        this.exec.raidPublishConfirm = false
      }
    })
  }

  handlePasses() {
    if (!this.items) return
    this.passDebt = this.passPrice - this.passCount
    this.wishingpiece = this.user.items['wishingpiece'] || 0
    this.needToBuyRaidPass = this.passPrice > this.passCount
  }

  async claimPrizes() {
    this.exec.claimPrizes = true
    window.requestAnimationFrame(async () => {
      try {
        const res = await this.firebase.exec('raid_claim', {
          raidId: this.raidId
        })
        this.snackbar.open(`You received ${res.data.prizes.length} items!`, '', {duration: 3000})
      } catch (e: any) {
        this.snackbar.open(e.message, '', {duration: 5000})
      } finally {
        this.exec.claimPrizes = false
      }
    })
  }

  openItems() {
    this.items!.open()
    this.items!.filter('battle')
  }

  async getRaidBoss(rating: number) {
    const location = Globe[this.locationKey]
    const forecast = await this.locationService.getForecast(this.locationKey)
    location.forecast = forecast
    const questArgs = await getQuestArgs(this.user, this.locationService, this.firebase)
    const allBosses = getAvailableBosses(rating, location, this.user.hiddenItemsFound, questArgs)

    if (!allBosses || !allBosses.length) {
      console.error(`Error trying to get bosses for a ${rating}-star raid`)
      return {
        species: 'potw-129'
      }
    }

    return allBosses
  }

  async raidVote() {
    this.exec.raidVote = true
    window.requestAnimationFrame(async () => {
      try {
        await this.firebase.exec<F.SwarmVote.Req, F.SwarmVote.Res>('swarm_vote', {
          species: this.voter._value as BadgeId,
          position: 'raid',
        })
        this.snackbar.open('Thanks for voting!', '', {duration: 3000})
      } catch (e: any) {
        this.snackbar.open(e.message, '', {duration: 5000})
      } finally {
        this.closeBosses()
        this.exec.raidVote = false
      }
    })
  }

  async loadStats() {
    const res = await this.firebase.exec('battle_leaderboards', {})
    const json = res.data
    this.stats = json.raids.ratio
  }

  async shareRaid() {
    const shareData = {
      title: `${this.rating} ☆ Raid against ${new Badge(this.boss).toLabel()}`,
      text: 'You are invited to join this raid!',
      url: `https://pokemon-of-the-week.web.app/multiplayer/raids?${this.raidId}`
    }
    await navigator.share(shareData)
  }

  joinAny() {
    // Join random raid
    if (this.publicRaids.length) {
      const randomRaid = randomItem(this.publicRaids)
      window.location.href = `/raids?${randomRaid.id}`
    }
  }

  /**
   * Calculates an imperfect average of win success.
   * @param star Raid difficulty.
   */
  avgRatio(star: number) {
    if (!this.stats) return 0
    const ratioByPlayers = this.stats[star].split(',')
    if (ratioByPlayers?.length) {
      let sum = 0
      for (const ratio of ratioByPlayers) {
        sum += parseInt(ratio)
      }
      return Math.floor(100 * sum/ratioByPlayers.length)
    }
    return 0
  }

  typeIcon(type: Type) {
    return `/images/sprites/icons/type-${type}.svg`
  }
}
