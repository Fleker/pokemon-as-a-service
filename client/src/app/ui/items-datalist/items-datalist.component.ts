import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { ITEMS } from '../../../../../shared/src/items-list';

interface AvailableItem {
  id: string
  label: string
}

@Component({
  selector: 'items-datalist',
  templateUrl: './items-datalist.component.html',
  styleUrls: ['./items-datalist.component.css']
})
export class ItemsDatalistComponent implements OnInit {
  availableItemsList: AvailableItem[] = []
  map: Record<string, string> = {}
  _value: string = ''
  listener: Subject<AvailableItem> = new Subject()

  get value() {
    return this._value
  }

  constructor() { }

  ngOnInit(): void {
    const listobj = []
    Object.entries(ITEMS).forEach(([id, data]) => {
      this.map[data.label] = id
      listobj.push({
        label: data.label,
        id,
      })
    })
    this.availableItemsList = listobj
  }

  toId(label) {
    return this.map[label]
  }

  update() {
    const item = ITEMS[this.value]
    this.listener.next({
      id: this.value,
      label: item.label,
    })
  }
}
