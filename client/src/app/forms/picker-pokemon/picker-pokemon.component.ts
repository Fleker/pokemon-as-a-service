import { Component, Input, Output, OnDestroy, OnInit, ViewChild, EventEmitter } from '@angular/core';
import { FirebaseService } from 'src/app/service/firebase.service';
import { PokemonId } from '../../../../../shared/src/pokemon/types';
import { Subject } from 'rxjs';
import { Badge, MATCH_GTS, Tag } from '../../../../../shared/src/badge3';
import { PokemonEntries } from '../../../../../shared/src/pokemon-entries';
import { CelServiceService } from 'src/app/service/cel-service.service';
import { CelDialogComponent } from 'src/app/dialogs/cel-dialog/cel-dialog.component';
import { get } from '../../../../../shared/src/pokemon';
import * as Pkmn from '../../../../../shared/src/pokemon';
import * as Sprite from '../../../../../shared/src/sprites';
import { MoveTypeMap } from '../../../../../shared/src/gen/type-move-meta';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { ManagerService } from 'src/app/dialogs/manager.service';
import { HoverSelection } from 'src/app/ui/info-card/info-card.component';
import { Users } from '../../../../../shared/src/server-types';

export interface SelectionInternal {
  species: PokemonId
  index: number
}

export type Predicate = (pkmn: PokemonId) => boolean

@Component({
  selector: 'pokemon-picker',
  templateUrl: './picker-pokemon.component.html',
  styleUrls: ['./picker-pokemon.component.css']
})
export class PickerPokemonComponent implements OnInit, OnDestroy {
  @Input('multiple') multiple: boolean = false
  @Input('filterdefault') filterDefault = ''
  @Input('filtercel') filterCel = ''
  @Input('pageSize') pageSize = 30
  @Input('entries') customEntries?: Partial<Record<PokemonId, number>> = undefined
  @Input('xlong') xlong = false
  @Input('selectall') selectAll = false
  @ViewChild('cel') celDialog: CelDialogComponent
  @ViewChild('paginator') paginator?: MatPaginator
  @Output('peek') peek: EventEmitter<HoverSelection|undefined> = new EventEmitter()
  @Output('toggledup') toggleDup: EventEmitter<boolean> = new EventEmitter()
  readonly selection: Subject<PokemonId[]> = new Subject()
  useCel = false
  useSchedulerYield = false
  celError = ''
  duplicate = true
  entries: [PokemonId, number][] = []
  predicatedEntries: [PokemonId, number][] = []
  filteredEntries: [PokemonId, number][] = []
  filterPageBadges: [PokemonId, number][] = []
  customTags: string[] = []
  /* Hover */
  hoverSelect: HoverSelection|undefined = undefined
  flagPickerPro = false
  filter?: string = ''
  _count: number = 0
  _selection: SelectionInternal[] = []
  celPct = 0
  user?: Users.Doc
  exec = {
    runCel: false,
  }
  firebaseListener?: any

  get count() {
    if (this.duplicate) {
      if (this.filteredEntries.length === 0) return 0
      const total = Object.values(this.filteredEntries)
        .map(([_, n]) => n)
        .filter(n => !isNaN(n))
        .reduce((p, c) => p + c)
      return total
    } else {
      // Note: This is quite inefficient
      const legacySet = new Set()
      const uniqueLegacies = this.filteredEntries.filter(([key, value]) => {
        const legacy = new Badge(key).toLegacyString()
        if (legacySet.has(legacy)) return false
        legacySet.add(legacy)
        return [key, value]
      })
      return uniqueLegacies.length
    }
  }

  get countLabel() {
    return this.count.toLocaleString()
  }

  get localStorageKey() {
    return `cel-filter.${window.location.pathname}`
  }

  array(count: number) {
    return Array(count).fill(0)
  }

  dupCount(label: string) {
    if (!label || label === '') return 0
    if (this.entries.length === 0) return 0
    const array = Object.values(this.entries)
      .filter(([k, _]) => new Badge(k).toLabel() === label)
      .map(([_, n]) => n)
      .filter(n => !isNaN(n))
    if (!array || !array.length) return 0
    return array.reduce((p, c) => p + c)
  }

  constructor(
    private firebase: FirebaseService,
    private cel: CelServiceService,
    private dialogs: ManagerService,
  ) {}

  ngOnInit(): void {
    this.firebaseListener = this.firebase.subscribeUser(user => {
      if (user) {
        this.useCel = user.settings.flagSearch2
        this.useSchedulerYield = user.settings.flagSchedulerYield
        if (this.useSchedulerYield) {
          console.debug('Will get data from scheduler yield')
        }
        this.flagPickerPro = user.settings.flagPickerPro === true
        if (localStorage.getItem('pokemon-picker.component.duplicate')) {
          this.duplicate = localStorage.getItem('pokemon-picker.component.duplicate') === 'true'
        }
        this.user = user
        console.debug('init Pokemon Picker')
        this.reload()
        this.usePredicate(() => true)
      } else {
        this.entries = []
      }
    })
  }

  ngOnDestroy(): void {
    this.firebaseListener?.unsubscribe()
  }

  reload() {
    if (!this.customEntries) {
      this.entries = PokemonEntries(this.user.pokemon!) as [PokemonId, number][]
    } else {
      this.entries = PokemonEntries(this.customEntries) as [PokemonId, number][]
    }
    if (this.useCel && window.localStorage.getItem(this.localStorageKey)) {
      // Pre-load filter
      this.filter = window.localStorage.getItem(this.localStorageKey)
      this.runCel()
    } else if (this.useCel) {
      this.runCel() // FIXME
    } else {
      this.refilter()
    }
  }

  mouseOver(event: MouseEvent, species: PokemonId, index: number) {
    if (this.selectAll) {
      this.dragSelect(event, species, index)
    } else {
      this.hover(species)
    }
  }

  hover(id: string) {
    const badge = new Badge(id)
    const pokemon = Pkmn.get(badge.toLegacyString())!
    this.hoverSelect = {
      name: badge.toLabel()!,
      img: Sprite.pkmn(badge.toSprite()),
      t1: pokemon.type1,
      type: [pokemon.type1],
      hp: pokemon.hp,
      attack: pokemon.attack,
      defense: pokemon.defense,
      spAttack: pokemon.spAttack,
      spDefense: pokemon.spDefense,
      speed: pokemon.speed,
      moves: [...pokemon.move].map(m => {
        const meta = MoveTypeMap[m]
        return {
          name: meta.name,
          type: meta.type,
        }
      }),
      key: id,
      ball: badge.personality.pokeball,
      location: badge.personality.location,
      nature: badge.personality.nature,
      dupCount: this.dupCount(badge.toLabel()),
      tera: this.user.items.teraorb > 0 ? badge.personality.teraType : 'Status',
      gmax: badge.personality.gmax,
    }
    if (pokemon.type2) {
      this.hoverSelect.type[1] = pokemon.type2
    }
    this.peek.emit(this.hoverSelect)
  }

  dragSelect(event: MouseEvent, species: PokemonId, index: number) {
    if (!this.multiple) return
    if (event.buttons === 1) {
      this.handle(species, index)
    }
  }

  unhover() {
    this.peek.emit(undefined)
  }

  /** A light reset */
  clearSelection(index?: number) {
    console.log(`Clear ${index}`, this._selection)
    if (index !== undefined) {
      this._selection.splice(index, 1)
    } else {
      this._selection = []
    }
    console.log(this._selection)
    this.selection.next(this._selection.map(x => x.species))
  }

  reset() {
    this.clearSelection()
    this.filter = ''
    this.usePredicate(() => true)
    this.paginator.pageIndex = 0
    this.unhover()
    this._selection = []
  }

  isSelected(species: PokemonId, index: number) {
    const isSelected = this._selection.findIndex(
      v => v.index === index && v.species === species
    )
    return isSelected
  }

  handle(species: PokemonId, index: number) {
    if (this.multiple) {
      const isSelected = this.isSelected(species, index)
      if (isSelected > -1) {
        this._selection.splice(isSelected, 1)
      } else {
        this._selection.push({species, index})
      }
      this.selection.next(this._selection.map(v => v.species))
    } else {
      // Open dex
      this.dialogs.openPokedex({
        badge: species,
      }, true, false)
    }
  }

  spriteClass(species: PokemonId, index: number) {
    if (this.isSelected(species, index) > -1) {
      return 'selected'
    }
    return ''
  }

  match(id: PokemonId) {
    this.filter = ''
    this.filteredEntries = this.entries.filter(([p, _]) => {
      const matcher = Badge.match(id, [p], MATCH_GTS)
      return matcher.match
    })
  }

  /**
   * Runs a custom preciate for each entry to decide whether this Pokemon
   * should be filtered or not. This takes place before the user-facing
   * filter. This can be useful in contexts such as Move Deleter where the
   * Pokemon must be a variant but in a scalable way.
   *
   * @param fn The predicate function that takes in a Pokemon ID and must
   * return a boolean.
   */
  usePredicate(fn: Predicate) {
    this.predicatedEntries = this.entries.filter(([p, _]) => {
      return fn(p)
    })
    console.debug('Predicated filters', this.predicatedEntries.length)
    this.refilter()
  }

  /**
   * General non-CEL filter
   */
  refilter() {
    this.filteredEntries = this.predicatedEntries.filter(([p, _]) => {
      if (!this.filter) return true
      const badge = new Badge(p)
      const db = get(badge.toLegacyString())
      const label = badge.toLabel()
      // const family = [...getAllPreEvolutions(badge.toLegacyString()),
      //   ...getAllEvolutions(badge.toLegacyString()), badge.toLegacyString()]
      //   .map(x => get(x).species)

      // Perform filter ops
      const notHasName = !label.toLowerCase().includes(this.filter.toLowerCase())
      const notHasTag = !badge.defaultTags?.includes(this.filter.toUpperCase() as Tag)
      const notHasCustomTag = !badge.tags?.map(tag => this.customTags[tag]).includes(this.filter.toLowerCase())
      const notHasType = db.type1.toLowerCase() !== this.filter.toLowerCase() &&
          db.type2?.toLowerCase() !== this.filter.toLowerCase()
      const notIsShiny = this.filter.toLowerCase() !== 'shiny' || !badge.personality.shiny
      const notHasVar = !Number.isInteger(parseInt(this.filter)) || badge.personality.variant !== parseInt(this.filter)
      /**
       * nIF | !this.filter.includes('+') | true
       */
      // const notInFamily = /*!this.filter.includes('+') ||*/ !family.includes(db.species)
      // if (db.species === "Eevee" || db.species === "Vaporeon" || db.species === "Ditto") {
      //   console.debug(this.filter, db.species, family, notInFamily)
      // }
      if (notHasName && notHasTag && notHasCustomTag && notHasType && notIsShiny && notHasVar) {
        return false
      }
      return true
    })
    this.slice({pageIndex: 0, length: 1, pageSize: 1})
  }

  /**
   * Perform a "slice" on the larger filteredEntries array to
   * make it fit in the 30-entry page of the dialog
   * @param event Event or pseudo-event that occurs when paginator is clicked.
   */
  slice(event: PageEvent = {pageIndex: 0, length: 1, pageSize: 1}) {
      const pageIndex = event.pageIndex
      const min = pageIndex * this.pageSize // eg. 0
      const max = (pageIndex + 1) * this.pageSize // eg. 30
      const page = []
      let index = 0
  
      const map = {}
      localStorage.setItem('pokemon-dialog.component.duplicate', this.duplicate ? 'true' : 'false')
      if (this.duplicate) {
        this.filteredEntries.forEach(([key, value]) => {
          if (index > max) return
          for (let j = 0; j < value; j++) {
            index++
            if (index > min && index <= max) {
              page.push([key, 1])
            }
          }
        })
        // Reformat page to a map
        for (const [p, _] of page) {
          if (map[p]) map[p]++
          else map[p] = 1
        }
      } else {
        const legacySet = new Set()
        const uniqueLegacies = this.filteredEntries.filter(([key, value]) => {
          const legacy = new Badge(key).toLegacyString()
          if (legacySet.has(legacy)) return false
          legacySet.add(legacy)
          return [key, value]
        })
        uniqueLegacies.forEach(([key, _]) => {
          if (index > max) return
          // Fix to '1'
          for (let j = 0; j < 1; j++) {
            index++
            if (index > min && index <= max) {
              page.push([key, 1])
            }
          }
        })
        // Reformat page to a map
        for (const [p, _] of page) {
          if (map[p]) map[p]++
          else map[p] = 1
        }
      }
      this.filterPageBadges = Object.entries(map) as [PokemonId, number][]
  }

  resetDuplicate() {
    // Jump back to start.
    this.paginator!.pageIndex = 0
    this.slice() // Reset filterPageBadges
    window.requestAnimationFrame(() => {
      this.toggleDup.emit(this.duplicate)
    })
  }

  async runCel() {
    this.exec.runCel = true
    window.setTimeout(async () => {
      try {
        this.filteredEntries = []
        this.celPct = 0
        const subscriber = await this.cel.runAndSubscribe(this.predicatedEntries, this.filter)
        subscriber.subscribe(event => {
          if (event.pokemon) {
            this.filteredEntries.push(event.pokemon)
            // Reslice to a page
            this.slice()
          }
          if (event.pct > this.celPct || event.pct === 0) {
            this.celPct = Math.round(event.pct)
          }
        })
        // Save only if it worked
        window.localStorage.setItem(this.localStorageKey, this.filter)
      } catch (e) {
        this.celError = e
      } finally {
        this.exec.runCel = false
      }
    }, 15)
  }

  async cancelCel() {
    window.setTimeout(async () => {
      try {
        this.cel.stop()
        // Reset listings
        window.requestAnimationFrame(() => {
          this.filteredEntries = this.entries
          this.slice()
        })
      } catch (e) {
        throw e
      } finally {
        this.exec.runCel = false
      }
    }, 15)
  }

  async clearCelError() {
    window.setTimeout(async () => {
      this.celError = ''
    }, 15)
  }

  celDemo() {
    this.celDialog.open()
  }

  performSelectAll() {
    for (const entry of this.filterPageBadges) {
      const inflatedEntry = this.array(entry[1])
      for (let i = 0; i < inflatedEntry.length; i++) {
        this.handle(entry[0], i)
      }
    }
  }
}
