import { AfterViewInit } from '@angular/core';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DialogItemsComponent } from 'src/app/dialogs/picker-items/picker-items.component';
import { PokemonDialogComponent } from 'src/app/dialogs/pokemon-dialog/pokemon-dialog.component';
import { FirebaseService } from 'src/app/service/firebase.service';
import { TeamsBadge } from '../../../../../shared/src/badge2';
import { Badge, MATCH_FILTER, MATCH_REQS } from '../../../../../shared/src/badge3';
import * as Club from '../../../../../shared/src/platform/breeding-club'
import {F} from '../../../../../shared/src/server-types'
import { get } from '../../../../../shared/src/pokemon';
import { PokemonDatalistComponent } from 'src/app/ui/pokemon-datalist/pokemon-datalist.component';
import { BadgeId, PokemonId, Type } from '../../../../../shared/src/pokemon/types';

@Component({
  selector: 'app-page-daycare',
  templateUrl: './page-daycare.component.html',
  styleUrls: ['./page-daycare.component.css']
})
export class PageDaycareComponent implements AfterViewInit {
  @ViewChild('pokemon') pokemon?: PokemonDialogComponent
  @ViewChild('items') items?: DialogItemsComponent
  @ViewChild('voter') voter?: PokemonDatalistComponent
  isPrivate: boolean = false
  parents: string[]
  _selection: PokemonId[] = []
  selection?: string
  heldItem?: string
  exec = {
    send: false,
    clubVote: false,
  }
  res?: F.Daycare.Res

  get maxItems() {
    return this.isPrivate ? 2 : 1
  }

  constructor(
    private firebase: FirebaseService,
    private snackbar: MatSnackBar
  ) {
    this.parents = Club.parents.map(badgeId => new TeamsBadge(badgeId).toLabel()!)
  }

  ngAfterViewInit() {
    this.pokemon!.selection.subscribe(pkmn => {
      this._selection = pkmn.slice(0, this.isPrivate ? 2 : 1)
      this.selection = this._selection.map(x => new Badge(x).toLabel()).join(', ')
    })
  }

  async send() {
    this.exec.send = true
    window.requestAnimationFrame(async () => {
      try {
        const res = await this.firebase.exec<F.Daycare.Req, F.Daycare.Res>('daycare', {
          species: this._selection,
          isPrivate: this.isPrivate,
          heldItem: this.items._selection ?
            this.items._selection.map(x => x.item) : undefined,
        })
        this.res = res.data
        this.firebase.refreshUser()
      } catch (e: any) {
        this.snackbar.open(e.message, '', {
          duration: 5000
        })
      } finally {
        this.pokemon!.clearSelection()
        this.exec.send = false
      }
    })
  }

  openPkmn() {
    this.pokemon!.usePredicate(x => {
      const db = get(new Badge(x).toLegacyString())
      // Hide any non-breedable Pokemon
      return db.eggBase !== undefined && db.eggCycles > 0
    })
    this.pokemon!.open()
  }

  openItems() {
    this.items.open()
    this.items.filter('daycare')
  }

  openBreedingClub() {
    this.pokemon.open()
    const parents = Club.parents.map(p => Badge.fromLegacy(p).toString())
    this.pokemon.usePredicate(pkmn => {
      return Badge.match(pkmn, parents, MATCH_FILTER).match
    })
    const subscription = this.pokemon.events.subscribe(ev => {
      if (ev === 'CLOSE') {
        this.pokemon.usePredicate(x => true)
      }
    })
  }

  async clubVote() {
    this.exec.clubVote = true
    window.requestAnimationFrame(async () => {
      try {
        await this.firebase.exec<F.SwarmVote.Req, F.SwarmVote.Res>('swarm_vote', {
          species: this.voter._value as BadgeId,
          position: 'daycare',
        })
        this.snackbar.open('Thanks for voting!', '', {duration: 3000})
      } catch (e: any) {
        this.snackbar.open(e.message, '', {duration: 5000})
      } finally {
        this.exec.clubVote = false
      }
    })
  }
}
