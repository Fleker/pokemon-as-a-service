import { Input, SimpleChanges } from '@angular/core';
import { OnChanges } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { item } from '../../../../../shared/src/sprites';
import { ITEMS, ItemId } from '../../../../../shared/src/items-list';

@Component({
  selector: 'sprite-item',
  templateUrl: './sprite-item.component.html',
  styleUrls: ['./sprite-item.component.css']
})
export class SpriteItemComponent implements OnChanges {
  @Input('item') item?: ItemId | string
  src: string = '#'
  alt: string = ''

  constructor() { }

  ngOnChanges(): void {
    this.src = item(this.item as ItemId)
    if (ITEMS[this.item!]) {
      this.alt = ITEMS[this.item!].label
    }
  }
}
