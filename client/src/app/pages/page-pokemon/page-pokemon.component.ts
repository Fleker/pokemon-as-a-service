import { Component, ViewChild, OnDestroy, ElementRef } from '@angular/core';
import { PickerPokemonComponent } from 'src/app/forms/picker-pokemon/picker-pokemon.component';
import { FirebaseService } from 'src/app/service/firebase.service';
import { PokemonEntries } from '../../../../../shared/src/pokemon-entries';
import { PokemonId } from '../../../../../shared/src/pokemon/types';
import { Badge } from '../../../../../shared/src/badge3';
import { weekly } from '../../../../../shared/src/platform/weekly';
import { TagComponent } from 'src/app/dialogs/tag/tag.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { F } from '../../../../../shared/src/server-types';
import { LinksService } from 'src/app/links.service';
import { myPokemon } from '../../../../../shared/src/badge-inflate';

@Component({
  selector: 'page-pokemon',
  templateUrl: './page-pokemon.component.html',
  styleUrls: ['./page-pokemon.component.css']
})
export class PagePokemonComponent implements OnDestroy {
  @ViewChild('picker') picker?: PickerPokemonComponent
  @ViewChild('tagger') tagger?: TagComponent
  @ViewChild('tutorial') tutorial?: ElementRef
  selectMultiple: boolean = false
  enableTag = false
  customTags?: string[] = []
  pokemon: [PokemonId, number][] = []
  locationBroken = false
  abnormalBadges: Badge[] = []
  firebaseListener: any

  get isHome() {
    return ['/', ''].includes(window.location.pathname)
  }

  get selection() {
    return this.picker?._selection || []
  }

  get weeklyLabel() {
    return Badge.fromLegacy(weekly).toLabel()
  }

  constructor(
    private firebase: FirebaseService,
    private snackbar: MatSnackBar,
    readonly links: LinksService,
  ) {
    this.firebaseListener = this.firebase.subscribeUser(user => {
      if (user) {
        this.enableTag = user.settings.flagTag
        // This should never happen, but it might.
        // The lack of a location may cause NPEs throughout the app.
        // This can be added manually.
        this.locationBroken = user.location === undefined
        // For Map view
        this.pokemon = PokemonEntries(user.pokemon) as [PokemonId, number][]
        this.abnormalBadges = []
        for (const [k] of myPokemon(user.pokemon)) {
          const b = new Badge(k)
          if (b.isAbnormal) {
            this.abnormalBadges.push(b)
          }
        }
        // Quick compute sum
        this.customTags = user.customTags
        // Open tutorial
        if (Object.keys(user.pokemon).length <= 3) {
          this.tutorial?.nativeElement?.showModal()
        }
      }
    })
    console.debug(this.firebaseListener)
    this.links.init()
  }

  ngOnDestroy() {
    console.debug('Destroy page-pokemon')
    this.firebaseListener?.unsubscribe()
  }

  getLabel(pkmn: PokemonId) {
    return new Badge(pkmn).toLabel()
  }

  tag() {
    this.tagger.open(this.picker._selection.map(x => x.species))
  }

  close() {
    this.tagger.close()
  }

  reset() {
    this.picker.reset()
  }

  async tagAdd() {
    const tagName = prompt("Name this tag")
    if (tagName === null) return
    try {
      await this.firebase.exec<F.TagManage.Req, F.TagManage.Res>('tag_manage', {
        tags: [tagName],
        action: 'PUSH'
      })
      this.snackbar.open(`Tag '${tagName}' added`, '', {duration: 5000})
      this.firebase.refreshUser()
    } catch (e) {
      this.snackbar.open(e, '', {duration: 5000})
    }
  }

  async tagRename(index) {
    const tagName = prompt("Rename this tag", this.customTags[index])
    if (tagName === null) return
    try {
      await this.firebase.exec<F.TagManage.Req, F.TagManage.Res>('tag_manage', {
        tags: [tagName],
        index,
        action: 'UPDATE'
      })
      this.snackbar.open(`Tag '${tagName}' renamed`, '', {duration: 5000})
      this.firebase.refreshUser()
    } catch (e) {
      this.snackbar.open(e, '', {duration: 5000})
    }
  }

  async tagRemove(tagName) {
    try {
      await this.firebase.exec<F.TagManage.Req, F.TagManage.Res>('tag_manage', {
        tags: [tagName],
        action: 'REMOVE'
      })
      this.snackbar.open(`Tag '${tagName}' removed`, '', {duration: 5000})
      this.firebase.refreshUser()
    } catch (e) {
      this.snackbar.open(e, '', {duration: 5000})
    }
  }

  tutorialOpen(event: Event) {
    this.tutorial!.nativeElement.showModal()
    event.stopPropagation()
  }

  tutorialClose() {
    this.tutorial!.nativeElement.close()
  }
}
