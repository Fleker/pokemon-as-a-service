import { AfterViewInit, ElementRef } from '@angular/core';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DialogItemsComponent } from 'src/app/dialogs/picker-items/picker-items.component';
import { PokemonDialogComponent } from 'src/app/dialogs/pokemon-dialog/pokemon-dialog.component';
import { FirebaseService } from 'src/app/service/firebase.service';
import { Badge } from '../../../../../shared/src/badge3';
import { ITEMS, ItemId } from '../../../../../shared/src/items-list';
import { PokemonId } from '../../../../../shared/src/pokemon/types';
import dowseBadges from '../../../../../shared/src/platform/dowsing-badges';
import { GtsTradeComponent } from 'src/app/ui/gts-trade/gts-trade.component';
import { Event, NavigationEnd, Router } from '@angular/router';

interface TradeOffer {
  id?: string
  species?: PokemonId
  item?: ItemId
  speciesLabel?: string
  itemLabel?: string
  ldap?: string
  confirmed?: boolean
  role?: Role
}

type Role = 'host' | 'player' | 'INVALID'

@Component({
  selector: 'app-page-trade',
  templateUrl: './page-trade.component.html',
  styleUrls: ['./page-trade.component.css']
})
export class PageTradeComponent implements OnInit, AfterViewInit {
  @ViewChild('pokemon') pokemon: PokemonDialogComponent
  @ViewChild('items') items: DialogItemsComponent
  @ViewChild('gtsdialog') gtsDialog: ElementRef
  @ViewChild('gtstrade') gtsSprites: GtsTradeComponent
  activeTradeRooms: [string, any][] = []
  roomId?: string
  yourOffer?: TradeOffer = {}
  otherOffer?: TradeOffer = {}
  tradesCompleted: number = -1
  validHiddenItems: any[] = []
  exec = {
    create: false,
    close: false,
    confirm: false,
  }

  get coreRoomId() {
    if (!window.location.search) return undefined
    return window.location.search
      .replace('web%2Btrade:', '')
      .replace('//', '')
      .replace('?', '')
      .replace('=', '')
  }

  constructor(
    private firebase: FirebaseService,
    private snackbar: MatSnackBar,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.router.events.subscribe(() => {
      if (this.coreRoomId) {
        this.roomId = this.coreRoomId
        console.debug(`Found room ID ${this.roomId}`)
        this.hostOrJoin(this.roomId)
      }

      this.firebase.subscribeUser(user => {
        if (user) {
          this.firebase.dbSearch('trades', {
            ops: [
              ['host.id', '==', this.firebase.getUid()],
              ['active', '==', true]
            ]
          }, (snapshot) => {
            const docs = snapshot.docs
            this.activeTradeRooms = docs.map(doc => [doc.id, doc.data()])
            console.log(`Found ${docs.length} open trade rooms`, this.activeTradeRooms)
          })
        }
      })
    })
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.pokemon?.events.subscribe(event => {
        if (event === 'CLOSE') {
          this.updateOffer()
        }
      })
      this.items?.events.subscribe(event => {
        if (event === 'CLOSE') {
          this.updateOffer()
        }
      })
    }, 1000)
  }

  async updateOffer() {
    console.debug(this.pokemon._selection)
    try {
      await this.firebase.exec('trade_offer', {
        species: this.pokemon._selection[0].species,
        item: this.items._selection[0]?.item,
        roomId: this.roomId,
      })
    } catch (e: any) {
      console.error(e)
      this.snackbar.open(e.message, '', {duration: 5000})
    }
  }

  async create() {
    this.exec.create = true
    window.requestAnimationFrame(async () => {
      try {
        const res = await this.firebase.exec('trade_room_create')
        const {roomId} = res.data
        this.roomId = roomId
        this.router.navigate(['/multiplayer/trade'], {
          queryParams: {
            [roomId]: '',
          }
        })
        console.log(res.data)
      } catch (e: any) {
        this.snackbar.open(e.message, '', {duration: 5000})
      } finally {
        this.exec.create = false
      }
    })
  }

  async close() {
    if (!this.roomId) {
      this.snackbar.open('Error: No Room ID', '', {duration: 5000})
      return
    }

    this.exec.close = true
    window.requestAnimationFrame(async () => {
      try {
        await this.firebase.exec('trade_close', {roomId: this.roomId})
        this.roomId = undefined
        this.snackbar.open('Room is now closed', '', {duration: 5000})
      } catch (e: any) {
        this.snackbar.open(e.message, '', {duration: 5000})
      } finally {
        this.exec.close = false
      }
    })
  }

  openItems() {
    this.items!.open()
  }

  async confirm() {
    if (!this.roomId) {
      this.snackbar.open('Error: No Room ID', '', {duration: 5000})
      return
    }

    this.exec.confirm = true
    window.requestAnimationFrame(async () => {
      try {
        await this.firebase.exec('trade_confirm', {
          roomId: this.roomId,
          confirmed: true,
        })
      } catch (e: any) {
        this.snackbar.open(e.message, '', {duration: 5000})
      } finally {
        this.exec.confirm = false
      }
    })
  }

  hostOrJoin(roomId) {
    // Either you're the host or you can join (or you cannot join)
    this.firebase.dbListen(['trades', roomId], doc => {
      if (!doc.exists) {
        this.snackbar.open('This trade room does not exist', '', {duration: 5000})
        return
      }
      const data = doc.data()
      if (!data.active) {
        this.snackbar.open('This trade room has been closed', '', {duration: 5000})
        return
      }
      // Get a 'role'
      const uid = this.firebase.getUid()
      if (data.host.id === uid) {
        this.yourOffer.role = 'host'
        this.otherOffer.role = 'player'
      } else if (data.player === undefined) {
        this.yourOffer.role = 'player'
        this.otherOffer.role = 'host'
        this.joinTradeRoom(roomId)
        return // Wait for join and then update data
      } else if (data.player.id === uid) {
        this.yourOffer.role = 'player'
        this.otherOffer.role = 'host'
      } else {
        this.yourOffer.role = 'INVALID'
        this.snackbar.open('Trade room in an invalid state', '', {duration: 5000})
        return
      }

      if (data.trades > this.tradesCompleted && this.tradesCompleted >= 0) {
        const yourOffer = this.yourOffer.species
        const theirOffer = this.otherOffer.species
        this.gtsDialog.nativeElement!.showModal()
        this.gtsSprites.offer = yourOffer
        setTimeout(() => {
          this.gtsSprites.receive = theirOffer
        }, 1500)
        // We have completed a trade
        this.tradesCompleted = data.trades
        console.log('Recorded a trade')
      } else if (data.trades > this.tradesCompleted) {
        this.tradesCompleted = data.trades
        console.log('Trades have client reset')
      }

      const yours = data[this.yourOffer.role]
      console.log(yours)
      this.yourOffer = {
        id: yours.id.substring(0, 1),
        role: this.yourOffer.role,
        species: yours.offerSpecies,
        speciesLabel: new Badge(yours.offerSpecies).toLabel(),
        item: yours.offerItem,
        itemLabel: ITEMS[yours.offerItem]?.label,
        confirmed: yours.offerConfirmed,
        ldap: yours.ldap
      }

      const others = data[this.otherOffer.role]
      this.otherOffer = {
        id: others.id?.substring(0, 1), // friend safari
        role: this.otherOffer.role,
        species: others.offerSpecies,
        speciesLabel: new Badge(others.offerSpecies).toLabel(),
        item: others.offerItem,
        itemLabel: ITEMS[others.offerItem]?.label,
        confirmed: others.offerConfirmed,
        ldap: others.ldap
      }

      this.validHiddenItems = []
      if (others.hiddenItems) {
        for (const id of others.hiddenItems) {
          const index = dowseBadges.filter(b => !b.keyItem).find(b => b.id === id)
          if (index) {
            const playerHas = data[this.yourOffer.role].hiddenItems.includes(id)
            this.validHiddenItems.push({
              id,
              badge: index.badge,
              have: !playerHas ? 'shake' : ''
            })
          }
        }
      }
    })
  }

  async joinTradeRoom(roomId) {
    try {
      await this.firebase.exec('trade_room_join', {
        roomId,
      })
    } catch (e: any) {
      this.snackbar.open(e.message, '', {duration: 5000})
    }
  }

  dialogClose() {
    this.gtsDialog.nativeElement!.close()
  }
}
