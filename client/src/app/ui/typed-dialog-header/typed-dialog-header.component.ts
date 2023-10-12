import { Component, Input } from '@angular/core';
import { Type } from '../../../../../shared/src/pokemon/types';

@Component({
  selector: 'typed-dialog-header',
  templateUrl: './typed-dialog-header.component.html',
  styleUrls: ['./typed-dialog-header.component.css']
})
export class TypedDialogHeaderComponent {
  @Input('type') primaryType?: Type
  @Input('title') title: string = ''

  get icon() {
    return `url("/images/sprites/icons/type-${this.primaryType}.svg")`
  }
}
