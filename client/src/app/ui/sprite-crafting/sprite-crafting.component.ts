import { Component, Input, Output, AfterViewInit } from '@angular/core';
import { ItemId } from '../../../../../shared/src/items-list';

@Component({
  selector: 'sprite-crafting',
  templateUrl: './sprite-crafting.component.html',
  styleUrls: ['./sprite-crafting.component.css']
})
export class SpriteCraftingComponent implements AfterViewInit {
  @Input('input') input: ItemId[] = []
  @Input('output') output?: ItemId
  mode: 'input' | 'output' = 'input'
  lhs: ItemId[]
  rhs: ItemId[]

  constructor() {
    setTimeout(() => {
      console.log(this.input, this.lhs, this.rhs)
    }, 2500)

    setTimeout(() => {
      this.finishCrafting()
    }, 5000)
  }

  ngAfterViewInit() {
    this.lhs = this.input.filter((x, i) => i % 2 === 0)
    this.rhs = this.input.filter((x, i) => i % 2 === 1)
  }

  startCrafting() {
    this.lhs = this.input.filter((x, i) => i % 2 === 0)
    this.rhs = this.input.filter((x, i) => i % 2 === 1)
    this.mode = 'input'
  }

  finishCrafting() {
    this.mode = 'output'
  }
}
