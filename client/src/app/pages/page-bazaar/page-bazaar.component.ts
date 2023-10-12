import { Component, OnInit, OnDestroy } from '@angular/core';
import { FirebaseService } from 'src/app/service/firebase.service';
import { LocationService } from 'src/app/service/location.service';
import getQuestArgs from 'src/app/to-requirements';
import { BAZAAR, ItemId } from '../../../../../shared/src/items-list';
import { Users } from '../../../../../shared/src/server-types';

interface Merchant {
  key: string
  name: string
  items: ItemId[]
  currency: ItemId
  icon?: string
}

@Component({
  selector: 'app-page-bazaar',
  templateUrl: './page-bazaar.component.html',
  styleUrls: ['./page-bazaar.component.css']
})
export class PageBazaarComponent implements OnInit, OnDestroy {
  merchants: Merchant[] = []
  user?: Users.Doc;
  items?: Record<ItemId, number>
  firebaseListener: any

  constructor(
    private firebase: FirebaseService,
    private locations: LocationService,
  ) {}

  ngOnInit() {
    this.firebaseListener = this.firebase.subscribeUser(async user => {
      if (user) {
        this.user = user
        this.items = user.items as Record<ItemId, number>
        await this.refresh()
      }
    })
  }

  ngOnDestroy() {
    this.firebaseListener?.unsubscribe()
  }

  async refresh() {
    const requirements = await getQuestArgs(this.user!, this.locations, this.firebase)
    const bazaarItems = Object.entries(BAZAAR)
      .filter(([_, merchant]) => !merchant.isOpen(Date.now(), this.items!, requirements))
    this.merchants = bazaarItems.map(b => {
      const items = (() => {
        if (typeof b[1].items === 'function') {
          return b[1].items()
        }
        return b[1].items
      })()
      return {
        key: b[0],
        currency: b[1].currency,
        icon: b[1].icon,
        items: items.map(i => i.name),
        name: b[1].name
      }
    })
  }
}
