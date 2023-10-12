import { Component, Input, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Voyage, VoyageId } from '../../../../../shared/src/voyages';
import { Badge } from '../../../../../shared/src/badge3';
import { PokemonId, Type } from '../../../../../shared/src/pokemon/types';
import randomItem from '../../../../../shared/src/random-item';
import { ItemId } from '../../../../../shared/src/items-list';

const binocularAnimations = [
  'hop1', 'hop2', 'hop3',
  'wiggle1', 'wiggle2', 'wiggle3',
  'none',
]

interface BinocularPokemon {
  id: PokemonId
  animation: string
}

@Component({
  selector: 'voyage-header',
  templateUrl: './voyage-header.component.html',
  styleUrls: ['./voyage-header.component.css']
})
export class VoyageHeaderComponent implements AfterViewInit {
  @Input('voyage') voyage?: Voyage
  @Input('vid') vid?: VoyageId
  @ViewChild('expect') expect?: ElementRef
  pkmnRegular: [PokemonId, string][]
  pkmnWeather: [PokemonId, string][]
  pkmnBoss: PokemonId[] = []
  itemsCommon: ItemId[] = []
  itemsRare: ItemId[] = []

  ngAfterViewInit() {
    if (this.voyage) {
      this.load()
    } else {
      setTimeout(() => {
        this.ngAfterViewInit()
      }, 50)
    }
  }

  load() {
    const regularMap: Partial<Record<PokemonId, string>> = {}

    this.voyage.pokemon.forEach(arr => {
      arr.forEach(p => {
        regularMap[Badge.fromLegacy(p).toString()] = randomItem(binocularAnimations)
      })
    })

    const weatherMap: Partial<Record<PokemonId, string>> = {}
    Object.values(this.voyage.weatherPokemon).forEach(arr => {
      arr.forEach(p => {
        weatherMap[Badge.fromLegacy(p).toString()] = randomItem(binocularAnimations)
      })
    })

    this.pkmnRegular = Object.entries(regularMap) as [PokemonId, string][]
    this.pkmnWeather = Object.entries(weatherMap) as [PokemonId, string][]
    this.pkmnBoss = this.voyageListPkmn3 as PokemonId[]
    this.itemsCommon = this.voyageListItems as ItemId[]
    this.itemsRare = this.voyageListItems2 as ItemId[]
  }

  get voyageListPkmn3() {
    if (!this.voyage) return []
    const s = new Set()
    this.voyage.bosses.forEach(arr => {
      arr.forEach(p => {
        s.add(Badge.fromLegacy(p).toString())
      })
    })
    return [...s]
  }

  get voyageListItems() {
    if (!this.voyage) return []
    const s = new Set()
    Object.values(this.voyage.items).forEach(arr => {
      arr.forEach(i => {
        s.add(i)
      })
    })
    return [...s]
  }

  get voyageListItems2() {
    if (!this.voyage) return []
    const s = new Set()
    Object.values(this.voyage.rareitems).forEach(arr => {
      arr.forEach(i => {
        s.add(i)
      })
    })
    return [...s]
  }

  expectDialog() {
    this.expect.nativeElement.showModal()
  }

  /** Close all dialogs on this page. */
  close() {
    this.expect.nativeElement.close()
  }

  typeIcon(type: Type) {
    return `/images/sprites/icons/type-${type}.svg`
  }
}
