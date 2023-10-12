import { Component, Input } from '@angular/core';
import { Type } from '../../../../../shared/src/pokemon/types';

@Component({
  selector: 'type-box',
  templateUrl: './type-box.component.html',
  styleUrls: ['./type-box.component.css']
})
export class TypeBoxComponent {
  @Input('type') type?: Type

  get typeIcon() {
    return `/images/sprites/icons/type-${this.type}.svg`
  }

  get typel() {
    return this.type.toLowerCase()
  }
}
