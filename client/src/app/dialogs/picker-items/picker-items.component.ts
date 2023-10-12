import { ElementRef, Input, OnDestroy } from '@angular/core';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { FirebaseService } from 'src/app/service/firebase.service';
import { ITEMS, ItemId, categoryAttributes, categoryKeys } from '../../../../../shared/src/items-list';
import { ObjectEntries } from '../../../../../shared/src/object-entries';
import { Users } from '../../../../../shared/src/server-types';

interface SelectionInternal {
  item: ItemId
  index: number
}

interface Hover {
  item: ItemId
  count: number
  label: string
  description?: string
}

type Event = 'CLOSE'

@Component({
  selector: 'dialog-items',
  templateUrl: './picker-items.component.html',
  styleUrls: ['./picker-items.component.css']
})
export class DialogItemsComponent implements OnInit, OnDestroy {
  @Input('multiuse') multiuse = true
  @Input('max') max: number = 1000 // means no max
  @ViewChild('dialog') dialog?: ElementRef
  itemMap?: Users.Items
  search?: string
  bag: ItemId[] = []
  filterBag: ItemId[] = []
  _selection: SelectionInternal[] = []
  hoverTxt?: Hover
  firebaseListener?: any
  categoryAttributes = categoryAttributes
  categoryKeys = categoryKeys.filter(k => categoryAttributes[k].active !== false)
  readonly selection: Subject<ItemId[]> = new Subject()
  readonly events: Subject<Event> = new Subject()

  get selectedLabel() {
    return this._selection
      .map(item => ITEMS[item.item].label)
  }

  constructor(
    private firebase: FirebaseService
  ) { }

  ngOnInit(): void {
    this.firebaseListener = this.firebase.subscribeUser(user => {
      if (user) {
        this.bag = []
        ObjectEntries(user.items).forEach(([key, count]) => {
          if (count > 0) {
            this.bag.push(key)
          }
        })
        this.filter(this.search ?? '')
        this.itemMap = user.items
      }
    })
  }

  ngOnDestroy() {
    this.firebaseListener?.unsubscribe()
  }

  filter(text: string) {
    // this.search = text
    const tl = text.toLowerCase()
    this.filterBag = []
    for (const key of this.bag) {
      const item = ITEMS[key]
      if (!item) {
        continue
      }
      if (tl === 'battle' && item.battle) {
        this.filterBag.push(key)
        continue // Bail
      } else if (tl === 'daycare' && item.daycare) {
        this.filterBag.push(key)
        continue // Bail
      } else if (tl === 'berry') {
        if ('yield' in item) {
          // Include objects that are a berry
          // Do not include items like 'Berry Pouch'
          // Include things that are berry-like (apricorns)
          this.filterBag.push(key)
        }
        continue // Bail
      } else {
        if (key.toLowerCase().includes(tl) ||
            (item.category?.toLowerCase()?.includes(tl)) ||
            item.label?.toLowerCase()?.includes(tl)) {
          this.filterBag.push(key)
          continue
        }
      }
    }
  }

  open() {
    this.dialog!.nativeElement.showModal()
  }

  close() {
    this.dialog!.nativeElement.close()
    this.events.next('CLOSE')
  }

  hover(item: ItemId) {
    this.hoverTxt = {
      item,
      count: this.itemMap![item] ?? 0,
      description: ITEMS[item]!.description,
      label: ITEMS[item]!.label,
    }
  }

  isSelected(item: ItemId, index: number) {
    const isSelected = this._selection.findIndex(
      v => v.index === index && v.item === item
    )
    return isSelected
  }

  click(item: ItemId, index: number) {
    const isSelected = this.isSelected(item, index)
    if (isSelected > -1 && this.multiuse === false) {
      // In single-use mode, clicking on the same item de-selects it.
      this._selection.splice(isSelected, 1)
    } else if (this._selection.length < this.max) {
      this._selection.push({item, index})
    }
    this.selection.next(this._selection.map(v => v.item))
  }

  reset(index?: number) {
    if (index !== undefined) {
      this._selection.splice(index, 1)
    } else {
      this._selection = []
    }
  }
}
