import { ElementRef } from '@angular/core';
import { AfterViewInit } from '@angular/core';
import { Component, OnDestroy, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PokemonDialogComponent } from 'src/app/dialogs/pokemon-dialog/pokemon-dialog.component';
import { FirebaseService } from 'src/app/service/firebase.service';
import { EvolutionComponent } from 'src/app/ui/evolution/evolution.component';
import { Badge } from '../../../../../shared/src/badge3';
import { get } from '../../../../../shared/src/pokemon';
import { PokemonId } from '../../../../../shared/src/pokemon/types';
import { F } from '../../../../../shared/src/server-types';

@Component({
  selector: 'app-page-movedeleter',
  templateUrl: './page-movedeleter.component.html',
  styleUrls: ['./page-movedeleter.component.css']
})
export class PageMovedeleterComponent implements AfterViewInit, OnDestroy {
  @ViewChild('dialog') dialog: ElementRef
  @ViewChild('pokemon') pokemon: PokemonDialogComponent
  @ViewChild('evo') evo: EvolutionComponent
  selection?: PokemonId
  selectionLabel?: string
  currentMoves?: string[]
  newMoves?: string[]
  exec = {
    confirm: false
  }
  firebaseListener: any

  constructor(
    private firebase: FirebaseService,
    private snackbar: MatSnackBar,
  ) { }

  ngAfterViewInit(): void {
    this.firebaseListener = this.firebase.subscribeUser(user => {
      if (user) {
        this.pokemon.usePredicate((x) =>
          new Badge(x).personality.variant !== undefined)
      }
    })

    this.pokemon.events.subscribe(ev => {
      if (ev === 'CLOSE' && this.pokemon._selection) {
        this.selection = this.pokemon._selection[0].species
        const badge = new Badge(this.selection)
        const pkmn = get(badge.toLegacyString())
        this.selectionLabel = badge.toLabel()
        this.currentMoves = pkmn.move
        badge.personality.variant = undefined
        const barePkmn = get(badge.toLegacyString())
        this.newMoves = barePkmn.move
        this.dialog!.nativeElement.showModal()
      }
    })
  }

  ngOnDestroy() {
    this.firebaseListener?.unsubscribe()
  }

  close() {
    this.dialog!.nativeElement.close()
  }

  async confirm() {
    this.exec.confirm = true
    window.requestAnimationFrame(async () => {
      setTimeout(async () => {
        this.evo.to = this.selection
        this.evo.finishEvolution()
        try {
          await this.firebase.exec<F.MoveDeleter.Req, F.MoveDeleter.Res>('move_deleter', { species: this.selection })
          this.snackbar.open(`${this.selectionLabel} has lost its novel moves.`, '', {duration: 3000})
          this.firebase.refreshUser()
        } catch (e: any) {
          this.snackbar.open(e.message, '', {duration: 3000})
        } finally {
          this.exec.confirm = false
          this.pokemon.reset()
          this.close()
        }
      }, 1100) // Need a brief delay to trigger animation correctly
    })
  }
}
