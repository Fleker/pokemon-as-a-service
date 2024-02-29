import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { LinksService } from 'src/app/links.service';
import { FirebaseService, FirebaseListener } from 'src/app/service/firebase.service';
import { ITEMS, ItemId, categoryKeys, categoryAttributes, Category } from '../../../../../shared/src/items-list';
import { ItemEntries } from '../../../../../shared/src/item-entries';
import { PokemonDialogComponent } from 'src/app/dialogs/pokemon-dialog/pokemon-dialog.component';
import { Availability, DirectMap, ItemAvailability, UserSpin } from '../../../../../shared/src/items-availablity';
import { Badge, MATCH_FILTER } from '../../../../../shared/src/badge3';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ElementRef } from '@angular/core';
import { F } from '../../../../../shared/src/server-types';
import { Subject } from 'rxjs';
import { ManagerService } from 'src/app/dialogs/manager.service';
import { MoveId } from '../../../../../shared/src/gen/type-move-meta';
import { Gyroscope } from '../../service/w3c-generic-sensor';

declare var window;

const milcerySweets: ItemId[] = [
  'sweetribbon', 'sweetstar', 'sweetstrawberry', 'sweetberry',
  'sweetlove', 'sweetclover', 'sweetflower',
]

interface Item {
  key: string
  label: string
  count: number
  description: string
  functional: 'functional' | ''
}

@Component({
  selector: 'app-page-bag',
  templateUrl: './page-bag.component.html',
  styleUrls: ['./page-bag.component.css']
})
export class PageBagComponent implements OnInit, OnDestroy {
  @ViewChild('dialog') dialog: ElementRef
  @ViewChild('tutorial') tutorial: ElementRef
  @ViewChild('spin') dialogSpin: ElementRef
  @ViewChild('pokemon') pokemon: PokemonDialogComponent
  movesFr: string = ''
  loaded: boolean = false
  bag: Partial<Record<Category, Item[]>> = {}
  itemUse?: F.UseItem.Res
  action: string
  /** Capture Gyroscope data for Inkay */
  gyroscope: Gyroscope
  firebaseListener: FirebaseListener
  categories = categoryKeys
  categoryAttributes = categoryAttributes
  spinSubject: Subject<UserSpin> = new Subject()

  constructor(
    private firebase: FirebaseService,
    private links: LinksService,
    private snackbar: MatSnackBar,
    private dialogs: ManagerService,
  ) {
    for (const c of this.categories) {
      this.bag[c] = []
    }
  }

  ngOnInit(): void {
    this.links.init().then(() => {
      this.movesFr = this.links.templates!.moves
    })
    this.firebaseListener = this.firebase.subscribeUser(user => {
      if (user) {
        for (const c of this.categories) {
          this.bag[c] = []
        }
        // Now repull
        const {items} = user
        for (const [key, count] of ItemEntries(items)) {
          if (count <= 0 || isNaN(count)) {
            continue;
          }
    
          if (items[key] && ITEMS[key]) {
            const {category, label, functional, direct} = ITEMS[key]
            // const id = key.replace(/ /g, '-')
            this.bag[category].push({
              count,
              key,
              label,
              description: ITEMS[key].description ?? '',
              functional: functional || direct ? 'functional' : '',
            })
          } else if (ITEMS[key]) {
            const {category, label, functional, direct} = ITEMS[key]
            if (!category) continue
            this.bag[category].push({
              count,
              key,
              label,
              description: ITEMS[key].description ?? '',
              functional: functional || direct ? 'functional' : '',
            })
          } else {
            console.warn('You have an item', key, 'that is not a canonical item')
          }
        }
      }
    })

    if (!('Gyroscope' in window)) {
      console.warn('No gyroscope detected')
    } else {
      this.gyroscope = new window.Gyroscope({frequency: 5})
      this.gyroscope.addEventListener('reading', e => {
        console.debug('Started gyroscope', this.gyroscope.z)
      })
      this.gyroscope.addEventListener('error', e => {
        console.debug('Error loading gyroscope', e.error)
      })
      this.gyroscope.start()
    }
  }

  ngOnDestroy() {
    this.firebaseListener?.unsubscribe()
  }

  useItem(itemId: ItemId | string) {
    const availability = ItemAvailability[itemId as ItemId]
    const direct = DirectMap[itemId as ItemId]
    if (!availability && !direct) return // Nothing doing
    console.log('Open a picker for', itemId)
    if (availability) {
      this.useViaPicker(itemId as ItemId, availability)
    } else if (direct) {
      this.useDirect(itemId as ItemId)
    }
  }

  confirmMilcerySpin(spin: string) {
    this.spinSubject.next(spin as UserSpin)
  }

  pickMilcerySpin(): Promise<UserSpin> {
    this.dialogSpin.nativeElement.showModal()
    return new Promise((res, rej) => {
      const sub = this.spinSubject.subscribe({
        next: (spin) => {
          sub.unsubscribe()
          res(spin)
        }
      })
    })
  }

  async useViaPicker(itemId: ItemId, availability: Availability) {
    let spin = undefined
    if (milcerySweets.includes(itemId)) {
      spin = await this.pickMilcerySpin()
      this.dialogSpin.nativeElement.close()
      console.debug('Selected sweet/spin/hrs', itemId, spin, new Date().getHours())
    }
    const filter = availability.filter.map(potw => Badge.fromLegacy(potw).toString())
    this.pokemon.usePredicate(x => {
      const {match} = Badge.match(x, filter, MATCH_FILTER)
      return match
    })
    this.pokemon.open()
    const subscription = this.pokemon.events.subscribe(async event => {
      if (event === 'CLOSE') {
        if (this.pokemon._selection.length === 1) {
          // Evolve or something
          try {
            this.snackbar.open('Giving item', '', {duration: 3000})
            this.itemUse = {
              target: this.pokemon._selection[0].species,
              changeType: undefined,
              species: undefined,
              transform: undefined,
              name2: undefined,
            }
            console.log(this.itemUse)
            this.dialog.nativeElement!.showModal()

            const res = await this.firebase.exec<F.UseItem.Req, F.UseItem.Res>('use_item', {
              item: itemId,
              target: this.pokemon._selection[0].species,
              hours: new Date().getHours(),
              gyroZ: this.gyroscope ? this.gyroscope.z : 0,
              spin,
            })
            this.itemUse = res.data
            if (res.data.changeType === 'EVO') {
              this.action = 'evolved'
            } else if (res.data.changeType === 'FORM') {
              this.action = 'changed'
            } else if (res.data.changeType === 'RESTORED') {
              this.action = 'restored'
            }
          } catch (e: any) {
            this.dialog.nativeElement!.close()
            this.snackbar.open(e.message, '', {duration: 5000})
          } finally {
            this.pokemon.reset()
          }
        } else {
          this.pokemon.reset()
          this.snackbar.open('Need to only select one', '', {duration: 5000})
        }
        subscription.unsubscribe()
      }
    })
  }

  async useDirect(itemId: ItemId) {
    try {
      this.snackbar.open('Using item directly', '', {duration: 3000})
      this.itemUse = {
        target: undefined,
        changeType: undefined,
        species: undefined,
        transform: undefined,
        name2: undefined,
      }
      this.dialog.nativeElement!.showModal()

      const res = await this.firebase.exec<F.UseItem.Req, F.UseItem.Res>('use_item', {
        item: itemId,
        hours: new Date().getHours(),
        gyroZ: this.gyroscope ? this.gyroscope.z : 0,
      })
      this.itemUse = res.data
      if (res.data.raidId) {
        this.dialog.nativeElement!.close()
        this.snackbar.open('The mysterious item activated!', '', {duration: 5000})
        window.setTimeout(() => {
          window.location.href = `/multiplayer/raids?${res.data.raidId}`
        }, 1000)
        return;
      }
      if (res.data.changeType === 'EVO') {
        this.action = 'evolved'
      } else if (res.data.changeType === 'FORM') {
        this.action = 'changed'
      } else if (res.data.changeType === 'RESTORED') {
        this.action = 'restored'
      }
    } catch (e: any) {
      this.dialog.nativeElement!.close()
      this.snackbar.open(e.message, '', {duration: 5000})
    }
  }

  openMoveDialog(itemLabel: string) {
    const moveName = itemLabel.split('-').slice(1).join(' ')
    console.debug(itemLabel, '>', moveName)
    this.dialogs.openMovedex(moveName as MoveId)
  }

  close() {
    this.dialog.nativeElement!.close()
    this.dialogSpin.nativeElement!.close()
  }

  tutorialOpen(event: Event) {
    this.tutorial!.nativeElement.showModal()
    event.stopPropagation()
  }

  tutorialClose() {
    this.tutorial!.nativeElement.close()
  }
}
