import { Component, Input, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { TeamsBadge } from '../../../../../shared/src/badge2';
import { Badge } from '../../../../../shared/src/badge3';
import * as Pkmn from '../../../../../shared/src/pokemon'
import { PokemonId } from '../../../../../shared/src/pokemon/types';
import * as P from '../../../../../shared/src/gen/type-pokemon';
import daycare from '../../../../../shared/src/platform/recommended-options.json'

/**
 * A filter will produce a subset of all Pokémon IDs
 */
type Filter =
  /** Only Pokémon who release for a PokéBall (with only a few exceptions). */
  'common' |
  /** Every Pokémon ID listed in datastore */
  'base' |
  /** Only fully-evolved Pokémon */
  'evolved' |
  /** Only Pokémon with base IDs */
  'simple' |
  /** Via recommended-options.tsv */
  'daycare'

const recommendedOptionsTmp: string[] = daycare.map(x => x.pollText)

interface Listener {
  id: PokemonId
  label: string
}

@Component({
  selector: 'pokemon-datalist',
  templateUrl: './pokemon-datalist.component.html',
  styleUrls: ['./pokemon-datalist.component.css']
})
export class PokemonDatalistComponent implements OnInit {
  @Input('filter') filter?: Filter
  availablePokemonList: {
    id: string
    label: string
  }[] = []
  map: Record<string, string> = {}
  _value: string = ''
  listener: Subject<Listener> = new Subject()

  get value() {
    return this._value
  }

  constructor() {}

  ngOnInit(): void {
    const listobj = []
    if (this.filter === 'daycare') {
      this.availablePokemonList = recommendedOptionsTmp.map(x => ({ id: x, label: x }))
      return
    }
    const entries = (() => {
      const allEntries = Object.entries(Pkmn.datastore)
      if (this.filter === 'common') {
        // Pick those who release for a Poké Ball (with some exceptions).
        return allEntries.filter(x => x[1].release === undefined)
      }
      if (this.filter === 'evolved') {
        return allEntries.filter(x => x[1].rarity === undefined && x[1].levelTo === undefined && x[1].evolveTo === undefined)
      }
      if (this.filter === 'simple') {
        return allEntries.filter(x => x[0].split('-').length === 2) // potw-XXX
      }
      return allEntries
    })()
    entries.forEach(([id, data]) => {
      const badge = new TeamsBadge(id)
      this.map[badge.toLabel()] = id
      listobj.push({
        id,
        label: badge.toLabel()
      })

      if (this.filter === undefined) {
        badge.shiny = true
        this.map[badge.toLabel()] = badge.toString()
        listobj.push({
          id: badge.toString(),
          label: badge.toLabel()
        })
      }
    })
    this.availablePokemonList = listobj
  }

  toId(label) {
    return this.map[label]
  }

  update() {
    const badge = Badge.fromLegacy(this.value)
    this.listener.next({
      id: badge.toString(),
      label: badge.toLabel(),
    })
  }
}
