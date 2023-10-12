import { Component, OnInit, OnChanges, Input, SimpleChanges } from '@angular/core';
import { BATTLE_TIERS } from '../../../../../shared/src/battle-tiers';
import { PokemonId } from '../../../../../shared/src/pokemon/types';
import { ItemId } from '../../../../../shared/src/items-list';
import { Badge } from '../../../../../shared/src/badge3';

@Component({
  selector: 'battle-players',
  templateUrl: './battle-players.component.html',
  styleUrls: ['./battle-players.component.css']
})
export class BattlePlayersComponent implements OnInit, OnChanges {
  @Input('tier') tier: string /* BattleTier */
  @Input('players') players: (PokemonId | string)[]
  playerPokeballs: ItemId[]
  @Input('playeritems') playerItems: ItemId[] = []
  @Input('playerhps') playerHps: number[] = []
  @Input('opponents') opponents: (PokemonId | string)[] = []
  opponentPokeballs: ItemId[]
  @Input('opponentitems') opponentItems: ItemId[] = []
  @Input('opponenthps') opponentHps: number[] = []

  constructor() { }

  get barwidth() {
    if (!this.tier) return '0px'
    const slots = BATTLE_TIERS[this.tier].rules.partySize
    return `${slots*80}px`
  }
  
  get marginleft() {
    if (!this.tier) return '0px'
    const slots = BATTLE_TIERS[this.tier].rules.partySize
    return `${(slots-1)*-40}px`
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['tier']?.currentValue) {
      // Prepopulate all the Pokémon
      const slots = BATTLE_TIERS[this.tier].rules.slots
      if (!this.players || !this.players.length) {
        this.playerPokeballs = Array(slots).fill('pokeball')
      }
    }
  }

  beforeMatch() {
    // Match in-progress
    const slots = BATTLE_TIERS[this.tier].rules.slots
    this.playerPokeballs = this.players.slice(0, slots).map(badge =>
      new Badge(badge).personality.pokeball)
    this.opponentPokeballs = Array(slots).fill('pokeball')
    // this.players = this.players.slice(0, slots) // For practice
    this.players = []

    this.playerHps = Array(slots).fill(1)
    this.opponentHps = Array(slots).fill(1)
  }

  afterMatch() {
    const slots = BATTLE_TIERS[this.tier].rules.slots
    // Match is done
    this.playerPokeballs = []
    this.opponentPokeballs = []
    if (!this.playerItems) {
      this.playerItems = Array(slots).fill('oran')
    }
    if (!this.opponentItems) {
      this.opponentItems = Array(slots).fill('oran')
    }

  }
}
