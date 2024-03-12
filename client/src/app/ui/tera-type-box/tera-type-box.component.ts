import { Component, Input } from '@angular/core';
import { Type } from '../../../../../shared/src/pokemon/types';

@Component({
  selector: 'tera-type-box',
  templateUrl: './tera-type-box.component.html',
  styleUrls: ['./tera-type-box.component.css']
})
export class TeraTypeBoxComponent {
  @Input('type') type?: Type

  get typeIcon() {
    return `type-${this.type}`
  }

  get typel() {
    return this.type.toLowerCase()
  }
}
