import { ElementRef } from '@angular/core';
import { AfterViewInit } from '@angular/core';
import { Component, OnInit, ViewChild } from '@angular/core';
import { PickerPokemonComponent } from 'src/app/forms/picker-pokemon/picker-pokemon.component';
import { Badge } from '../../../../../shared/src/badge3';
import { PokemonId } from '../../../../../shared/src/pokemon/types';
import * as Pkmn from '../../../../../shared/src/pokemon'
import { FirebaseService } from 'src/app/service/firebase.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { F } from '../../../../../shared/src/server-types';

@Component({
  selector: 'app-page-release',
  templateUrl: './page-release.component.html',
  styleUrls: ['./page-release.component.css']
})
export class PageReleaseComponent implements AfterViewInit {
  @ViewChild('dialog') dialog?: ElementRef
  @ViewChild('picker') picker?: PickerPokemonComponent
  @ViewChild('tutorial') tutorial?: ElementRef
  selection: PokemonId[] = []
  dialogState: 'before' | 'after' | 'intermediate' = 'before'
  releaseSpecies: number = 0
  releaseShiny: number = 0
  releaseShinyVar: number = 0
  releaseEvent: number = 0
  confirmSwitch = true
  res: {
    pokeball: number
    greatball: number
    ultraball: number
  } = {
    pokeball: 0, greatball: 0, ultraball: 0,
  }

  constructor(private firebase: FirebaseService, private snackbar: MatSnackBar) {}

  get releaseTitle() {
    if (this.selection.length === 1) {
      return new Badge(this.selection[0]).toLabel()
    } else {
      return `Release ${this.selection.length.toLocaleString()} Pokémon?`
    }
  }

  get releaseText() {
    if (this.selection.length === 1) {
      return 'Does this Pokémon spark joy?'
    } else if (this.selection.length <= 5) {
      return this.selection.slice(0, 5).map(s => new Badge(s).toLabel()).join(', ')
    } else {
      return this.selection.slice(0, 5).map(s => new Badge(s).toLabel()).join(', ') +
        ' and others'
    }
  }

  ngAfterViewInit(): void {
    this.picker?.selection.subscribe(selection => {
      this.selection = selection
      this.releaseSpecies = this.selection.length
      this.releaseShiny = 0
      this.releaseShinyVar = 0
      this.releaseEvent = 0
      this.confirmSwitch = true

      this.selection.forEach(selection => {
        const badge = new Badge(selection)
        if (badge.personality.shiny) {
          this.releaseShiny++
          this.confirmSwitch = false
          if (badge.personality.variant) {
            this.releaseShinyVar++
          }
        }
        if (badge.personality.pokeball === 'cherishball') {
          this.confirmSwitch = false
          this.releaseEvent++
        }
      })
    })
  }

  openDialog() {
    this.dialogState = 'before'
    this.dialog?.nativeElement.showModal()
  }

  close() {
    this.dialog?.nativeElement.close()
  }

  async release() {
    try {
      this.dialogState = 'intermediate'
      const res = await this.firebase.exec<F.Release.Req, F.Release.Res>('release', {
        operations: this.selection.map(pkmn => ([pkmn, 1]))
      })
      this.dialogState = 'after'
      this.res = res.data.itemMap
      this.firebase.refreshUser()
      this.selection = [] // Reset
    } catch (e: any) {
      this.dialog?.nativeElement.close()
      this.snackbar.open(e.message, '', {
        duration: 5000,
      })
    }
  }

  tutorialOpen() {
    this.tutorial!.nativeElement.showModal()
  }

  tutorialClose() {
    this.tutorial!.nativeElement.close()
  }
}
