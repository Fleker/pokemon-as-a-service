import { Component, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PokemonDialogComponent } from 'src/app/dialogs/pokemon-dialog/pokemon-dialog.component';
import { FirebaseService } from 'src/app/service/firebase.service';
import {F} from '../../../../../shared/src/server-types'
import { Badge } from '../../../../../shared/src/badge3';

@Component({
  selector: 'app-page-wondertrade',
  templateUrl: './page-wondertrade.component.html',
  styleUrls: ['./page-wondertrade.component.css']
})
export class PageWondertradeComponent {
  @ViewChild('pokemon') pokemon: PokemonDialogComponent
  exec = {
    confirm: false
  }

  get selection() {
    if (!this.pokemon) return []
    return this.pokemon._selection
  }

  get label() {
    if (!this.selection) return undefined
    if (!this.selection.length) return undefined
    return new Badge(this.selection[0].species).toLabel()
  }

  constructor(
    private firebase: FirebaseService,
    private snackbar: MatSnackBar,
  ) {}
  
  confirm() {
    this.exec.confirm = true
    window.requestAnimationFrame(async () => {
      try {
        await this.firebase.exec<F.WonderTradeUpload.Req, F.WonderTradeUpload.Res>('wonder_trade_upload', {
          species: this.pokemon._selection[0].species,
        })
        this.snackbar.open('Your Pokémon has been sent to the Wonder Trade. Check back later!', '', { duration: 5000 })
      } catch (e) {
        this.snackbar.open(e.message, '', { duration: 5000 })
      } finally {
        this.exec.confirm = false
      }
    })
  }
}
