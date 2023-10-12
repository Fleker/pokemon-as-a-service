import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BadgeId, PokemonId } from '../../../../../shared/src/pokemon/types';

@Component({
  selector: 'raid-card',
  templateUrl: './raid-card.component.html',
  styleUrls: ['./raid-card.component.css']
})
export class RaidCardComponent {
  @Input('id') id: string
  @Input('boss') boss: PokemonId
  @Input('rating') rating: number
  @Input('reason') reason: string
  @Input('special') isSpecial: boolean
  @Input('exec') exec: boolean
  @Input('cancel') cancellable: boolean
  @Input('players') players: string 
  @Output('cancel') cancelEmitter = new EventEmitter<string>()

  get stars() {
    if (this.rating > 7) return `${this.rating} ☆`
    return '☆'.repeat(this.rating)
  }

  get classes() {
    if (this.isSpecial) {
      return 'special'
    }
    return ''
  }

  get routerQuery() {
    return { [this.id]: '' }
  }

  sendClear() {
    this.cancelEmitter.emit(this.id)
  }

  join() {
    window.location.href = `/raids?${this.id}`
  }
}
