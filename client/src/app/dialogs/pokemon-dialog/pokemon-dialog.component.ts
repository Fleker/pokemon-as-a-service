import { ElementRef, OnDestroy } from '@angular/core';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FirebaseService } from 'src/app/service/firebase.service';
import { Badge } from '../../../../../shared/src/badge3';
import { PokemonId } from '../../../../../shared/src/pokemon/types';
import { Subject } from 'rxjs';
import { Predicate, SelectionInternal, PickerPokemonComponent } from 'src/app/forms/picker-pokemon/picker-pokemon.component';
import { HoverSelection } from 'src/app/ui/info-card/info-card.component';

type Event = 'CLOSE'

@Component({
  selector: 'pokemon-dialog',
  templateUrl: './pokemon-dialog.component.html',
  styleUrls: ['./pokemon-dialog.component.css']
})
export class PokemonDialogComponent implements OnInit, OnDestroy {
  @Input('show') show: string = 'true'
  @Input('max') max: number = 1000 // means no max
  @ViewChild('dialog') dialog?: ElementRef
  @ViewChild('picker') picker?: PickerPokemonComponent
  flagPickerPro = false
  duplicate = false
  celPct = 0
  readonly events: Subject<Event> = new Subject()
  hoverSelect: HoverSelection;
  exec = {
    runCel: false,
  }
  firebaseListener?: any

  get selectedLabel() {
    return this._selection?.map(x => new Badge(x.species).toLabel())
  }

  get _selection() {
    if (this.picker) return this.picker._selection
    return []
  }

  set _selection(preset: SelectionInternal[]) {
    if (this.picker) {
      this.picker._selection = preset
    }
  }

  get selection() {
    if (this.picker) return this.picker.selection
    return undefined
  }


  constructor(
    private firebase: FirebaseService,
  ) {}

  ngOnInit(): void {
    this.firebaseListener = this.firebase.subscribeUser(user => {
      if (user) {
        this.flagPickerPro = user.settings.flagPickerPro === true
        if (localStorage.getItem('pokemon-picker.component.duplicate')) {
          this.duplicate = localStorage.getItem('pokemon-picker.component.duplicate') === 'true'
        }
      }
    })
  }

  ngOnDestroy() {
    this.firebaseListener?.unsubscribe()
  }

  open() {
    this.dialog!.nativeElement.showModal()
    this.picker.reload()
  }

  close() {
    this.dialog!.nativeElement.close()
    this.picker.cancelCel() // Stop if we haven't already
    if (this._selection.length === 0) {
      // Clear all
      this.picker.reset()
    }
    this.events.next('CLOSE')
  }

  /** A light reset */
  clearSelection(index?: number) {
    console.log(`Clear ${index}`, this._selection)
    this.picker.clearSelection(index)
    console.log(this._selection)
    this.selection.next(this._selection.map(x => x.species))
  }

  isSelected(species: PokemonId, index: number) {
    const isSelected = this._selection.findIndex(
      v => v.index === index && v.species === species
    )
    return isSelected
  }

  reset() {
    this.picker.reset()
  }

  usePredicate(fn: Predicate) {
    console.debug('Request filter', fn)
    this.picker.usePredicate(fn)
  }

  match(id: PokemonId) {
    return this.picker.match(id)
  }

  peek(event: HoverSelection) {
    this.hoverSelect = event
  }

  toggleDup(event: boolean) {
    this.duplicate = event
  }
}
