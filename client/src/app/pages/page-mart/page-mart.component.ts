import { ElementRef, OnDestroy } from '@angular/core';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { FirebaseService } from 'src/app/service/firebase.service';
import { MartButtonComponent } from 'src/app/ui/mart-button/mart-button.component';
import asLiterals from '../../../../../shared/src/as-literals';
import { Category, ITEMS, ItemId, Item } from '../../../../../shared/src/items-list';
import { Users, F } from '../../../../../shared/src/server-types';

interface Mart {
  [category: string]: string[]
}

const martModes = asLiterals(['buy', 'sell', 'toss'])

type MartMode = keyof {[K in (typeof martModes)[number]]: string}

@Component({
  selector: 'app-page-mart',
  templateUrl: './page-mart.component.html',
  styleUrls: ['./page-mart.component.css']
})
export class PageMartComponent implements OnInit, OnDestroy {
  @ViewChild('buybtn') buyBtn?: MartButtonComponent
  @ViewChild('buytxt') buyTxt?: ElementRef<HTMLSpanElement>
  @ViewChild('sellbtn') sellBtn?: MartButtonComponent
  @ViewChild('selltxt') sellTxt?: ElementRef<HTMLSpanElement>
  @ViewChild('tutorial') tutorial?: ElementRef

  buy: Mart = {}
  sell: Mart = {}
  categories: {[c in Category]?: string} = {
    'balls': 'Poké Balls',
    'items': 'Other Items',
    hold: 'Hold Items',
    berry: 'Berries',
    fertilizer: 'Fertilizers',
    battle: 'Battle Items',
    material: 'Crafting Materials',
    tms: 'TMs',
    trs: 'TRs',
    treasure: 'Treasure',
    zcrystal: 'Z-Crystals',
    megastone: 'Mega Stones',
    fossil: 'Fossils',
    key: 'Key Items',
  }
  buyCategories: Category[] = [
    'balls', 'items', 'hold', 'berry', 'fertilizer', 'battle', 'tms', 'trs',
    'material',
  ]
  sellCategories: Category[] = [
    'balls', 'items', 'hold', 'berry', 'fertilizer', 'battle', 'tms', 'trs',
    'material', 'treasure', 'megastone', 'zcrystal', 'cooking', 'bait', 'terashard',
  ]

  flagMart3 = false
  martMode: MartMode = 'buy'
  user: Users.Doc
  inHoverMode = false
  inQuantityMode = false
  selectedItem: ItemId
  selectedItemDb: Item
  cartQuantity: number = 1
  firebaseListener: any
  batch: {
    type: ItemId
    count: number
    toss?: boolean
  }[] = []
  toss: Mart = {}
  tossCategories: Category[] = [
    'balls', 'items',
    /*'hold', 'berry', 'fertilizer',*/'battle',
    /* 'tms', 'trs', 'material',*/
    'treasure',
    /* 'megastone', 'zcrystal', */ 'key',
    'cooking', 'bait',
  ]

  exec = {
    confirm: false,
    gpay: false,
  }

  get buyPrice() {
    if (!this.batch.length) return 0
    return this.batch
      .map(b => ITEMS[b.type].buy * b.count)
      .reduce((p, c) => p + c)
  }

  get buyEnabled() {
    return this.buyPrice <= this.user.items.pokeball
  }

  get sellPrice() {
    if (!this.batch.length) return 0
    return this.batch
      .map(b => ITEMS[b.type].sell * b.count)
      .reduce((p, c) => p + c)
  }

  get sellEnabled() {
    for (const b of this.batch) {
      if (b.count > this.user.items[b.type]) return false
    }
    return true
  }

  get aprilFools() {
    const d = new Date()
    if (this.user?.ldap === 'fleker') return true
    return (d.getMonth() === 3 && d.getDate() === 1) || (d.getMonth() === 2 && d.getDate() === 31)
  }

  constructor(
    private firebase: FirebaseService,
    private snackbar: MatSnackBar,
  ) {
    for (const [key, value] of Object.entries(ITEMS)) {
      const {category, buy, sell} = value
      if (buy > 0) {
        if (this.buy[category]) {
          this.buy[category].push(key)
        } else {
          this.buy[category] = [key]
        }
      }
      if (sell > 0) {
        if (this.sell[category]) {
          this.sell[category].push(key)
        } else {
          this.sell[category] = [key]
        }
      }
      if (sell === 0) {
        if (this.toss[category]) {
          this.toss[category].push(key)
        } else {
          this.toss[category] = [key]
        }
      }
    }
  }

  ngOnInit(): void {
    this.firebaseListener = this.firebase.subscribeUser(async user => {
      if (user) {
        this.user = user
        this.flagMart3 = user.settings.flagMart3 as boolean
      }
    })
  }

  ngOnDestroy() {
    this.firebaseListener?.unsubscribe()
  }

  hover(i: ItemId | string, mode: 'buy' | 'sell') {
    const {label} = ITEMS[i]
    if (mode === 'buy') {
      this.buyTxt!.nativeElement.innerText = label
    } else {
      this.sellTxt!.nativeElement.innerText = label
    }
  }

  click(i: ItemId | string, mode: 'buy' | 'sell') {
    if (mode === 'buy') {
      this.buyBtn!.item = i
      this.buyBtn!.update()
    } else {
      this.sellBtn!.item = i
      this.sellBtn!.update()
    }
  }

  switchMartMode(event: MatTabChangeEvent) {
    const {index} = event
    this.martMode = martModes[index] 
  }

  openMetadata(item: string) {
    // Don't override
    if (this.inQuantityMode) return
    this.inHoverMode = true
    this.selectedItem = item as ItemId
    this.selectedItemDb = ITEMS[item]
  }

  openQuantity(item: string) {
    this.inHoverMode = false
    this.inQuantityMode = true
    this.selectedItem = item as ItemId
    this.selectedItemDb = ITEMS[item]
  }

  addToCart() {
    // Actually add item to a cart
    this.batch.push({
      type: this.selectedItem,
      count: this.cartQuantity,
    })
    this.cancelAddToCart()
  }

  cancelAddToCart() {
    // Reset
    this.inQuantityMode = false
    this.inHoverMode = false
    this.selectedItem = undefined
    this.cartQuantity = 1
  }

  cartRemove(index: number) {
    this.batch.splice(index, 1)
  }

  confirm(mode: MartMode) {
    this.exec.confirm = true
    window.requestAnimationFrame(async () => {
      try {
        if (mode === 'buy') {
          await this.firebase.exec<F.Exchange.Req, F.Exchange.Res>('exchange', {
            batch: this.batch as {
              type: ItemId
              count: number | string
            }[] // Ignore `toss` field
          })
        } else if (mode === 'sell') {
          await this.firebase.exec<F.ExchangeInverse.Req, F.ExchangeInverse.Res>('exchange_inverse', {
            batch: this.batch
          })
        } else if (mode === 'toss') {
          await this.firebase.exec<F.ExchangeInverse.Req, F.ExchangeInverse.Res>('exchange_inverse', {
            batch: this.batch.map(x => ({...x, toss: true}))
          })
        }
        this.snackbar.open('Pleasure doing business with you!', '', {duration: 3000})
        this.batch = []
        this.firebase.refreshUser()
      } catch (e) {
        this.snackbar.open(e, '', {duration: 5000})
      } finally {
        this.exec.confirm = false
      }
    })
  }

  tutorialOpen(event: Event) {
    this.tutorial!.nativeElement.showModal()
    event.stopPropagation()
  }

  tutorialClose() {
    this.tutorial!.nativeElement.close()
  }

  aprilFoolToast() {
    this.exec.gpay = true
    setTimeout(() => {
      this.exec.gpay = false
      this.snackbar.open('Error: INTERNAL', '', {duration: 5000})
    }, 750)
  }
}