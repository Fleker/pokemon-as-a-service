import { ElementRef, OnChanges, SimpleChanges, Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FirebaseService } from 'src/app/service/firebase.service';
import { BAZAAR, ITEMS, ItemId } from '../../../../../shared/src/items-list';
import { F } from '../../../../../shared/src/server-types';

@Component({
  selector: 'mart-button',
  templateUrl: './mart-button.component.html',
  styleUrls: ['./mart-button.component.css']
})
export class MartButtonComponent implements OnInit, OnChanges {
  @Input('mode') mode: 'buy' | 'sell' | string = 'buy'
  /**
   * Merchant ID
   */
  @Input('bazaar') bazaar?: string
  @Input('item') item?: ItemId | string
  @ViewChild('dialog') dialog?: ElementRef
  @ViewChild('txncount') txnCount?: ElementRef<HTMLInputElement>
  label: string = ''
  description: string = ''
  items?: {[item in ItemId]?: number}
  itemsInBag: number = -1
  currency?: ItemId
  currencyLabel?: string
  currencyUnits: number = -1
  currencyPrice: number = 1
  exec = false

  constructor(
    private firebase: FirebaseService,
    private snackbar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.firebase.subscribeUser(user => {
      if (user) {
        this.items = user.items
        this.update()
      }
    })
  }

  ngOnChanges(_: SimpleChanges) {
      this.update()
  }

  update() {
    if (!this.txnCount) return // Try later
    const count = parseInt(this.txnCount!.nativeElement.value)

    if (this.bazaar) {
      this.currency = BAZAAR[this.bazaar].currency
      this.currencyLabel = ITEMS[this.currency].label
    } else {
      this.currency = 'pokeball'
      this.currencyLabel = 'Poké Balls'
    }

    const item = ITEMS[this.item!]
    this.itemsInBag = this.items![this.item! as ItemId] ?? 0
    this.currencyUnits = this.items![this.currency] ?? 0
    this.label = item.label
    this.description = item.description ?? ''

    if (this.mode === 'buy' && this.bazaar) {
      this.currencyPrice = BAZAAR[this.bazaar].items
        .filter(i => i.name === this.item)[0].rate * count
    } else if (this.mode === 'buy') {
      this.currencyPrice = item.buy * count
    } else {
      this.currencyPrice = item.sell * count
    }
  }

  open() {
    this.dialog!.nativeElement.showModal()
    this.update()
  }
  
  close() {
    this.dialog!.nativeElement.close()
  }

  async transaction() {
    const count = parseInt(this.txnCount!.nativeElement.value)
    this.exec = true
    window.requestAnimationFrame(async () => {
      try {
        if (this.mode === 'buy' && this.bazaar) {
          await this.firebase.exec<F.ExchangeBazaar.Req, F.ExchangeBazaar.Res>('exchange_bazaar', {
            type: this.item as ItemId,
            count,
            bazaarId: this.bazaar,
          })
          this.snackbar.open('Purchase complete!', '', {
            duration: 3000,
          })
        } else if (this.mode === 'buy') {
          await this.firebase.exec<F.Exchange.Req, F.Exchange.Res>('exchange', {
            type: this.item as ItemId,
            count,
          })
          this.snackbar.open('Purchase complete!', '', {
            duration: 3000,
          })
        } else {
          await this.firebase.exec<F.ExchangeInverse.Req, F.ExchangeInverse.Res>('exchange_inverse', {
            type: this.item as ItemId,
            count,
          })
          this.snackbar.open('Selling complete!', '', {
            duration: 3000,
          })
        }
        this.firebase.refreshUser()
      } catch (e: any) {
        this.snackbar.open(e.message, '', {
          duration: 5000,
        })
      } finally {
        this.exec = false
        this.close()
      }
    })
  }
}
