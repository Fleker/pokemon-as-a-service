import { Component, OnInit } from '@angular/core';
import { Badge } from '../../../../../shared/src/badge3';
import { ItemId, PokeballId } from '../../../../../shared/src/items-list';
import { PokemonId } from '../../../../../shared/src/pokemon/types';

@Component({
  selector: 'sprite-gts-trade',
  templateUrl: './gts-trade.component.html',
  styleUrls: ['./gts-trade.component.css']
})
export class GtsTradeComponent implements OnInit {
  offerPokeball?: ItemId
  offerPkmn?: PokemonId
  receivePokeball?: ItemId
  receivePkmn?: PokemonId

  set offer(pkmn: PokemonId) {
    this.offerPkmn = pkmn
    const badge = new Badge(pkmn)
    this.offerPokeball = badge.personality.pokeball
  }

  set receive(pkmn: PokemonId) {
    this.receivePkmn = pkmn
    const badge = new Badge(pkmn)
    this.receivePokeball = badge.personality.pokeball
  }

  constructor() { }

  ngOnInit(): void {
    if (false) {
      // Sandbox logic
      setTimeout(() => {
        // this.offer = '4#Yf_4'
      }, 2000)
      setTimeout(() => {
        // this.receive = '9#Yf_4'
      }, 5000)
    }
  }
}
