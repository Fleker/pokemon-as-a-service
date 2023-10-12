import { OnChanges, ViewChild } from '@angular/core';
import { Component, Input, OnInit } from '@angular/core';
import { ITEMS } from '../../../../../shared/src/items-list';
import { MartButtonComponent } from '../mart-button/mart-button.component';

@Component({
  selector: 'mart-section',
  templateUrl: './mart-section.component.html',
  styleUrls: ['./mart-section.component.css']
})
export class MartSectionComponent implements OnChanges {
  @Input('label') label: string = ''
  @Input('items') items: string = ''
  @Input('mode') mode: 'buy' | 'sell' | string = 'buy'
  @Input('bazaar') bazaarId?: string
  @ViewChild('btn') btn?: MartButtonComponent

  keys: string[] = []
  hoverTxt: string = ''
  selectedItem?: string

  constructor() {}

  ngOnChanges() {
    this.keys = this.items.split(',')
    this.selectedItem = this.keys[0]
  }

  hover(item: string) {
    this.hoverTxt = ITEMS[item].label
  }

  click(item: string) {
    this.selectedItem = item
    this.btn?.update()
  }
}
