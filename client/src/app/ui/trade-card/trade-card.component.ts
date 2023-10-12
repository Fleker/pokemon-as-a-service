import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { ItemId } from '../../../../../shared/src/items-list';
import { BadgeId, PokemonId } from '../../../../../shared/src/pokemon/types';

// Same as GtsEntry
interface Listing {
  heldItem: ItemId
  id: string
  legacySpeciesId: BadgeId
  lookingFor: string
  lookingForId: PokemonId
  lookingForItem?: ItemId
  noteworthy?: string
  species: string
  speciesId: PokemonId
  user: string
  heldItemLabel?: string
  lookingForItemLabel?: string
}

@Component({
  selector: 'trade-card',
  templateUrl: './trade-card.component.html',
  styleUrls: ['./trade-card.component.css']
})
export class TradeCardComponent implements OnInit {
  @Input('listing') listing: Listing
  @Input('flagPickerPro') flagPickerPro = false
  @Input('active') activeTrade = false
  @Input('cancel') cancellable = false
  @Input('exec_cancel') exec_cancel = false
  @Output('inquireListing') inquireListing = new EventEmitter<Listing>()
  @Output('cancel') cancel = new EventEmitter<string>()
  @Output('makeAlert') makeAlert = new EventEmitter<string>()
  @Output('displayBagCount') displayBagCount = new EventEmitter<ItemId>()

  ngOnInit(): void {}

  sendInquireListing(listing) {
    this.inquireListing.emit(listing)
  }

  sendCancel(id) {
    this.cancel.emit(id)
  }

  sendDisplayBagCount(item) {
    this.displayBagCount.emit(item)
  }

  sendAlert(msg) {
    this.makeAlert.emit(msg)
  }
}
