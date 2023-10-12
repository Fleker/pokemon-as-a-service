import { Component, Input } from '@angular/core';
import { PokeballId } from '../../../../../shared/src/items-list';
import { Type } from '../../../../../shared/src/pokemon/types';
import { LocationId } from '../../../../../shared/src/locations-list';
import { Nature } from '../../../../../shared/src/badge3';

export interface HoverSelection {
  dupCount: number
  name: string
  img: string
  t1: string
  type: Type[]
  hp: number
  attack: number
  defense: number
  spAttack: number
  spDefense: number
  speed: number
  moves: {
    name: string
    type: Type
  }[]
  key: string
  ball: string
  location: string
  nature: Nature
}

@Component({
  selector: 'info-card',
  templateUrl: './info-card.component.html',
  styleUrls: ['./info-card.component.css']
})
export class InfoCardComponent {
  @Input('hover') hover = this.getHover()
  @Input('flagPickerPro') flagPickerPro = false
  @Input('duplicate') duplicate = false

  /**
   * Resets and initializes hover fields
   * @returns Empty Hover object
   */
  getHover(): HoverSelection {
    return {
      dupCount: 0,
      name: '',
      img: '',
      t1: '',
      type: [],
      hp: 0,
      attack: 0,
      defense: 0,
      spAttack: 0,
      spDefense: 0,
      speed: 0,
      moves: [],
      key: '',
      ball: '',
      location: '',
      nature: 'Hardy',
    }
  }

  updateHover(hover?: HoverSelection) {
    if (!hover) {
      return this.reset()
    }
    this.hover = hover 
  }

  reset() {
    this.hover = this.getHover()
  }
}
