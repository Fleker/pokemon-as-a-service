import { Component, OnInit } from '@angular/core';
import { BadgeId, PokemonId } from '../../../../../shared/src/pokemon/types';
import { ITEMS, ItemId } from '../../../../../shared/src/items-list';
import { get } from '../../../../../shared/src/pokemon';
import { Badge } from '../../../../../shared/src/badge3';


interface Raid {
  state: number
  result: number
  log: string
  prizes: (ItemId | string)[]
  boss: BadgeId
}

interface Participant {
  key: string
  ldap?: string
  tank?: boolean
  ready: boolean
  species: PokemonId
  item?: ItemId
  hp?: number
  mine?: boolean
}


@Component({
  selector: 'battle-raid',
  templateUrl: './battle-raid.component.html',
  styleUrls: ['./battle-raid.component.css']
})
export class BattleRaidComponent implements OnInit {
  playerArray?: Participant[]
  raid?: Raid
  resultClass = 'secret'
  ITEMS = ITEMS
  prizes?: ItemId[]
  needClaim = false
  boss?: PokemonId
  bossItem?: ItemId
  bossHp?: number
  notInRaid = true

  get bossType() {
    if (!this.boss) return ''
    return get(new Badge(this.boss).toLegacyString()).type1
  }

  constructor() { }

  ngOnInit(): void {
    setTimeout(() => {
      this.resultClass = ''
    }, 3500)
  }
}
