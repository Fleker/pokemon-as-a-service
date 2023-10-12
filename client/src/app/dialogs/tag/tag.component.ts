import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { map, Observable, startWith } from 'rxjs';
import { Badge, DEFAULT_TAGS } from '../../../../../shared/src/badge3';
import { PokemonId } from '../../../../../shared/src/pokemon/types';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipInputEvent } from '@angular/material/chips';
import {MatAutocompleteSelectedEvent} from '@angular/material/autocomplete'
import { FirebaseService } from 'src/app/service/firebase.service';
import {COMMA, ENTER} from '@angular/cdk/keycodes'
import { F } from '../../../../../shared/src/server-types';

@Component({
  selector: 'dialog-tag',
  templateUrl: './tag.component.html',
  styleUrls: ['./tag.component.css']
})
export class TagComponent implements OnInit, OnDestroy {
  @ViewChild('tagger') tagger?: ElementRef
  @ViewChild('tagInput') tagInput?: ElementRef<HTMLInputElement>
  separatorKeysCodes: number[] = [ENTER, COMMA]
  species: PokemonId[] = []
  tags: string[] = []
  customTagList?: string[] = []
  filteredTags: Observable<string[]>
  tagCtrl = new FormControl()
  exec = {
    applyTags: false
  }
  firebaseListener?: any

  constructor(
    private firebase: FirebaseService,
    private snackbar: MatSnackBar,
  ) {
    this.filteredTags = this.tagCtrl.valueChanges.pipe(
      startWith(null),
      map((tag: string | null) => (tag ? this._filter(tag) : DEFAULT_TAGS.slice())),
    )
  }

  get customTagListStr() {
    return this.customTagList?.join(', ') ?? ''
  }

  ngOnInit(): void {
    this.firebaseListener = this.firebase.subscribeUser(user => {
      if (user) {
        this.customTagList = user.customTags ?? []
      }
    })
  }

  ngOnDestroy() {
    this.firebaseListener?.unsubscribe()
  }

  open(species: PokemonId[]) {
    console.debug('Load tags for', species)
    this.species = species
    // We cannot use a modal here, as then the mat-autocomplete list for some
    // reason winds up in the background and it's invisible.
    // This is one reason the feature is 'alpha'.
    this.tagger.nativeElement.showModal()
    if (species.length === 1) {
      const selection = new Badge(species[0])
      this.tags = []
      if (selection.defaultTags) {
        this.tags.push(...selection.defaultTags)
      }
      if (selection.tags) {
        this.tags.push(...selection.tags.map(id => this.customTagList[id]))
      }
    }
  }

  close() {
    this.tagger.nativeElement.close()
  }

  remove(tag: string): void {
    const index = this.tags.indexOf(tag);

    if (index >= 0) {
      this.tags.splice(index, 1);
    }
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    // Add our tag
    if (value) {
      this.tags.push(value);
    }

    // Clear the input value
    event.chipInput!.clear();

    this.tagCtrl.setValue(null);
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.tags.push(event.option.viewValue);
    this.tagInput.nativeElement.value = '';
    this.tagCtrl.setValue(null);
  }

  async clearTags() {
    const selection = new Badge(this.species[0])
    this.tags = []
    if (selection.defaultTags) {
      this.tags.push(...selection.defaultTags)
    }
    if (selection.tags) {
      this.tags.push(...selection.tags.map(id => this.customTagList[id]))
    }
    await this.applyTags(false)
  }

  async applyTags(shouldTag: boolean) {
    console.log('Setting tags', this.species, this.tags)
    this.snackbar.open('Tagging...', '', {duration: 3000})
    
    this.exec.applyTags = true
    window.requestAnimationFrame(async () => {
      try {
        const tagOps = this.species.map(v => {
          return {
            species: v,
            shouldTag,
            tags: this.tags
          }
        })
        await this.firebase.exec<F.Tag.Req, F.Tag.Res>('tag', {
          operations: [...tagOps]
        })
        this.firebase.refreshUser()
      } catch (e) {
        this.snackbar.open(e.message, '', {duration: 5000})
      } finally {
        this.tags = []
        this.close()
        this.exec.applyTags = false
      }
    })
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return DEFAULT_TAGS.filter(tag => tag.toLowerCase().includes(filterValue));
  }
}
