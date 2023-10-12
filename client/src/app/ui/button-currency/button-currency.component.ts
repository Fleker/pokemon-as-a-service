import { ElementRef } from '@angular/core';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FirebaseService } from 'src/app/service/firebase.service';
import { calculateNetWorth } from '../../../../../shared/src/events';
import { currencies, Currency, ItemId, ITEMS } from '../../../../../shared/src/items-list';

@Component({
  selector: 'button-currency',
  templateUrl: './button-currency.component.html',
  styleUrls: ['./button-currency.component.css']
})
export class ButtonCurrencyComponent implements OnInit {
  @ViewChild('dialog') dialog: ElementRef
  totalWealth: number = -1
  userCurrency: Record<Currency, number> = {
    pokeball: undefined,
    heartscale: undefined,
    redshard: undefined,
    greenshard: undefined,
    blueshard: undefined,
    yellowshard: undefined,
    shoalsalt: undefined,
    shoalshell: undefined,
    reliccopper: undefined,
    relicsilver: undefined,
    relicgold: undefined,
    soot: undefined,
    mysteriousshards: undefined,
    mysteriousshardl: undefined,
    armorite: undefined,
    dynite: undefined,
    galaricatwig: undefined,
  }
  currencyData: any[] = []

  constructor(private firebase: FirebaseService) {}

  ngOnInit(): void {
    this.firebase.subscribeUser(user => {
      if (!user) return
      this.totalWealth = calculateNetWorth(user)
      currencies.forEach(currency => {
        this.userCurrency[currency] = user.items[currency] || 0
      })
      this.currencyData = Object.entries(this.userCurrency)
    })
  }

  labelFor(item: ItemId) {
    return ITEMS[item].label
  }

  show() {
    this.dialog.nativeElement.showModal()
  }

  close() {
    this.dialog.nativeElement.close()
  }
}
