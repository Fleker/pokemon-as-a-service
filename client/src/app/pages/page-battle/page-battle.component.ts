import { AfterViewInit, ElementRef } from '@angular/core';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DialogItemsComponent } from 'src/app/dialogs/picker-items/picker-items.component';
import { PokemonDialogComponent } from 'src/app/dialogs/pokemon-dialog/pokemon-dialog.component';
import { BattlePlayersComponent } from 'src/app/ui/battle-players/battle-players.component';
import { FirebaseService } from 'src/app/service/firebase.service';
import { LocationService } from 'src/app/service/location.service';
import { Badge } from '../../../../../shared/src/badge3';
import { BATTLE_TIERS, Tier, canBeginnersCup } from '../../../../../shared/src/battle-tiers';
import { ITEMS, ItemId } from '../../../../../shared/src/items-list';
import { Globe } from '../../../../../shared/src/locations-list';
import { BadgeId, PokemonId } from '../../../../../shared/src/pokemon/types';
import { Users, F } from '../../../../../shared/src/server-types';
import { datastore, get } from '../../../../../shared/src/pokemon';
import { battleRanking } from '../../../../../shared/src/prizes';

interface LeaderboardUser {
  ldap: string
  wins: number | string
}

interface LeaderboardRatio {
  ldap: string
  percent: number
  roundPct?: number
}

interface TierData {
  label: string
  icon: string
  topPokemon: string[]
  topWins: LeaderboardUser[]
  topWinsWeekly: LeaderboardUser[]
  topRatio: LeaderboardRatio[]
}

interface BattleResult {
  prize?: ItemId | string
  match: {
    result: number
    msg: string[]
    playerHps: number[]
    opponentHps: number[]
  }
  species?: PokemonId[]
  opponent?: PokemonId[]
  record: string
  prizeLabel?: string
}

type Leaderboard = Record<Tier, TierData>

@Component({
  selector: 'app-page-battle',
  templateUrl: './page-battle.component.html',
  styleUrls: ['./page-battle.component.css']
})
export class PageBattleComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('items') items?: DialogItemsComponent
  @ViewChild('pokemon') pokemon?: PokemonDialogComponent
  @ViewChild('leaderboardpage') paginator?: MatPaginator
  @ViewChild('battleui') battleUi?: BattlePlayersComponent
  @ViewChild('tierprizes') tierPrizes?: ElementRef
  @ViewChild('tiereligible') tierEligible?: ElementRef
  readonly tiers = BATTLE_TIERS
  readonly tierKeys: Tier[] = Object.keys(BATTLE_TIERS) as Tier[]
  readonly tierLength = this.tierKeys.length

  leaderboardData?: Leaderboard
  leaderboardCurr?: TierData
  locationsLabel?: string = 'Placeholder'
  locationsForecast?: string = 'Weather'
  user?: Users.Doc
  isPractice: boolean = false

  selectedTier: Tier = 'Traditional'
  selectedTierLevel: number = -1
  selectedTierPrizes: ItemId[] = []
  selectedTierEligible: PokemonId[] = []

  battleResult?: BattleResult

  exec = {
    startBattle: false
  }
  firebaseListener: any

  get battleStadiumRecord() {
    if (!this.user || !this.user.battleStadiumRecord) return undefined
    return `${this.user.battleStadiumRecord[1]}-${this.user.battleStadiumRecord[2]}` +
      `-${this.user.battleStadiumRecord[3]}`
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

  get isLastLeaderboard() {
    if (!this.paginator) return false
    return this.paginator.pageIndex === this.tierLength
  }

  get maxItems() {
    const mult = this.isPractice ? 2 : 1
    return BATTLE_TIERS[this.selectedTier].rules.partySize * mult
  }

  constructor(
    private firebase: FirebaseService,
    private location: LocationService,
    private snackbar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.firebaseListener = this.firebase.subscribeUser(async user => {
      if (user) {
        const userLoc = user.location
        this.locationsLabel = Globe[userLoc].label
        const forecast = await this.location.getForecast(userLoc)
        this.locationsForecast = forecast
        this.user = user
      }
    })
    this.loadLeaderboard()
  }

  ngAfterViewInit() {
    this.paginator!.page.subscribe(p => {
      if (!this.isLastLeaderboard) {
        this.populateLeaderboard(this.tierKeys[p.pageIndex])
      } else {
        this.populateLeaderboard(this.tierKeys[0])
      }
    })
  }

  ngOnDestroy() {
    this.firebaseListener?.unsubscribe()
  }

  async loadLeaderboard() {
    const res = await this.firebase.exec('battle_leaderboards', {})
    this.leaderboardData = res.data.data
    this.populateLeaderboard('Traditional')
  }

  populateLeaderboard(tier: Tier) {
    if (!this.leaderboardData || !this.leaderboardData[tier]) {
      this.snackbar.open(`Cannot load leaderboard for ${tier}`, '', {
        duration: 3000,
      })
      return
    }

    this.leaderboardCurr = this.leaderboardData[tier]
    this.leaderboardCurr.icon = BATTLE_TIERS[tier].icon
    // Make wins user-friendly
    while (this.leaderboardCurr.topWinsWeekly.length < 5) {
      this.leaderboardCurr.topWinsWeekly.push({
        ldap: '',
        wins: 0,
      })
    }
    this.leaderboardCurr.topWins = this.leaderboardCurr.topWins
      .map(x => ({...x, wins: x.wins.toLocaleString()}))
    // Make ratio user-friendly
    this.leaderboardCurr.topRatio = this.leaderboardCurr.topRatio
      .map(x => ({...x, roundPct: Math.floor(x.percent * 10000) / 100}))
    this.leaderboardCurr.label = tier
  }

  openItems() {
    this.items!.open()
    this.items!.filter('battle')
  }

  async startBattle() {
    this.exec.startBattle = true
    // Grab now, since this element will disappear
    const heldItems = this.items!._selection?.map(i => i.item)
    // Show card now
    this.battleResult = {
      match: undefined,
      record: undefined,
      prize: undefined,
    }

    window.requestAnimationFrame(async () => {
      this.battleUi.tier = this.selectedTier
      this.battleUi.players = this.pokemon!._selection.map(p => p.species)
      this.battleUi.playerItems = heldItems
      this.battleUi.beforeMatch()
      try {
        const res = await this.firebase.exec<F.BattleStadium.Req, F.BattleStadium.Res>('battle_stadium', {
          species: this.pokemon!._selection.map(p => p.species),
          heldItems,
          tier: this.selectedTier,
          practice: this.isPractice,
        })
        this.battleResult = {
          match: res.data.match,
          record: res.data.record,
          prize: res.data.prize,
        }
        if (res.data.prize && ITEMS[res.data.prize]) {
          this.battleResult!.prizeLabel = ITEMS[res.data.prize].label
        }
        this.battleResult!.species = res.data.species
          .map((x: BadgeId) => Badge.fromLegacy(x).toString())
        this.battleResult!.opponent = res.data.opponent
          .map((x: BadgeId) => Badge.fromLegacy(x).toString())
        
        this.battleUi.players = this.battleResult!.species
        this.battleUi.playerItems = res.data.heldItems
        this.battleUi.playerHps = this.battleResult!.match.playerHps
        this.battleUi.opponents = this.battleResult!.opponent
        this.battleUi.opponentItems = res.data.opponentHeldItems
        this.battleUi.opponentHps = this.battleResult!.match.opponentHps
        console.log(this.battleUi.playerItems, this.battleUi.opponentItems)
        this.battleUi.afterMatch()
        setTimeout(() => {
          this.firebase.refreshUser()
        }, 1000)
      } catch (e: any) {
        this.snackbar.open(e.message, '', {
          duration: 5000,
        })
      } finally {
        this.exec.startBattle = false
      }
    })
  }

  reset() {
    this.battleResult = undefined
    this.pokemon!.reset()
    this.items!.reset()
    this.populateLeaderboard('Traditional')
  }

  selectPkmn() {
    this.pokemon.usePredicate((x) => {
      const badge = new Badge(x)
      const lookupId = badge.toLegacyString()
      const db = get(lookupId)
      return db.tiers?.includes(this.selectedTier) ||
        (this.selectedTier === 'Beginners Cup' && canBeginnersCup(db))
    })
    this.pokemon.open()
  }

  openPrizes() {
    // TODO: This fails if you exceed a given level
    this.selectedTierLevel = battleRanking(this.user.battleStadiumRecord[1])
    this.selectedTierPrizes = this.tiers[this.selectedTier].prizes[this.selectedTierLevel].items
    this.tierPrizes!.nativeElement.showModal()
  }

  openEligible() {
    if (this.selectedTier === 'Beginners Cup') {
      this.selectedTierEligible = Object.entries(datastore)
        .filter(([k, v]) => v.tiers?.includes('Traditional') && canBeginnersCup(v))
        .map(([k, v]) => Badge.fromLegacy(k).toString())
    } else {
      this.selectedTierEligible = Object.entries(datastore)
        .filter(([k, v]) => v.tiers?.includes(this.selectedTier))
        .map(([k, v]) => Badge.fromLegacy(k).toString())
    }
    this.tierEligible!.nativeElement.showModal()
  }

  close() {
    this.tierPrizes!.nativeElement.close()
    this.tierEligible!.nativeElement.close()
  }
}
