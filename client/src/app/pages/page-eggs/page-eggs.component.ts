import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { FirebaseService } from 'src/app/service/firebase.service';
import { BadgeId, PokemonId } from '../../../../../shared/src/pokemon/types';
import * as Sprite from '../../../../../shared/src/sprites'
import * as Pkmn from '../../../../../shared/src/pokemon'
import {Users} from '../../../../../shared/src/server-types'
import { Badge } from '../../../../../shared/src/badge3';
import { MatSnackBar } from '@angular/material/snack-bar';
import {F} from '../../../../../shared/src/server-types'
import { EngagementService } from 'src/app/engagement.service';
import { HttpsCallableResult } from 'firebase/functions';

const eggDuration = 60 * 60 * 24 * 7; // 1 week in seconds

interface Egg {
  sprite: string
  isHatching: boolean
  status: string
  species: BadgeId
}

@Component({
  selector: 'app-page-eggs',
  templateUrl: './page-eggs.component.html',
  styleUrls: ['./page-eggs.component.css']
})
export class PageEggsComponent implements OnInit, OnDestroy {
  @ViewChild('dialog') dialog?: ElementRef
  eggs: Egg[] = []
  // Next
  eggMap: [string, Egg[]][] = []
  firebaseListener: any

  // Hatch service
  hatchSpecies?: PokemonId[]
  hatchLabel: string = ''
  hatchStatus: 'before' | 'after' = 'before'

  // Spriting
  // Note: This will not be entirely correct in the case of Manaphy, but that's not too bad.
  defaultSprite = Sprite.egg('potw-001')

  get isNext() {
    return this.engager.isNextUi
  }

  get toHatch() {
    return this.eggs.filter(e => e.isHatching).length
  }

  constructor(
    private firebase: FirebaseService,
    private snackbar: MatSnackBar,
    private engager: EngagementService,
  ) {}

  ngOnInit(): void {
    this.firebaseListener = this.firebase.subscribeUser(user => {
      if (user) {
        const {eggs} = user
        this.refreshEggs(eggs)
      }
    })
  }

  ngOnDestroy() {
    this.firebaseListener?.unsubscribe()
  }

  refreshEggs(eggs: Users.Egg[]) {
    this.eggs = eggs.map(egg => {
      const status = (() => {
        if (egg.laid) {
          const age = Math.floor((new Date().getTime()/1000) - egg.laid);
          if (age < 60 * 60) {
            return `Laid ${Math.floor(age/60)} minutes ago`
          } else if (age < 60 * 60 * 24) {
            return `Laid ${Math.floor(age/3600)} hours ago`
          } else {
            return `Laid ${Math.floor(age/3600/24)} days ago`
          }
        } else if (egg.hatch) {
          const {hatch} = egg
          const hatchTime = hatch - (new Date().getTime() / 1000)
          if (hatchTime < 60 * 60) {
            return 'It is moving quite a bit.'
          } else if (hatchTime < 60 * 60 * 24) {
            return 'It is moving a little bit.'
          } else if (hatchTime < 60 * 60 * 48) {
            return 'It is moving sometimes.'
          } else if (hatchTime < 60 * 60 * 72) {
            return 'It is moving occasionally.'
          } else if (hatchTime < 60 * 60 * 96) {
            return 'It is moving infrequently.'
          } else if (hatchTime < 60 * 60 * 120) {
            return 'It is moving rarely.'
          } else {
            return 'It is not moving much right now.'
          }
        } else {
          return 'It is not moving at all.'
        }
      })()

      const isHatching = (() => {
        if (egg.laid) {
          const age = Math.floor((new Date().getTime()/1000) - egg.laid);
          return age > eggDuration
        } else if (egg.hatch) {
          const {hatch} = egg
          return  Math.floor((new Date().getTime()/1000)) > hatch
        }
        return false
      })()
      const sprite = Sprite.egg(egg.species)

      return {
        status,
        isHatching,
        sprite,
        species: egg.species,
      }
    })

    const eggMap: Record<string, Egg[]> = {}
    for (const e of this.eggs) {
      if (eggMap[e.status]) {
        eggMap[e.status].push(e)
      } else {
        eggMap[e.status] = [e]
      }
    }
    this.eggMap = Object.entries(eggMap)
  }

  async hatch(key: BadgeId) {
    console.log('Hatching', key)
    this.dialog!.nativeElement.showModal()
    this.hatchStatus = 'before'
    try {
      const res = await this.firebase.exec<F.Hatch.Req, F.Hatch.Res>('hatch', {key})
      const species = res.data.species
      this.hatchStatus = 'after'
      this.hatchSpecies = [Badge.fromLegacy(species).toString()]
      this.hatchLabel = Pkmn.get(species)!.species
      await this.firebase.refreshUser()
    } catch (e) {
      this.dialog!.nativeElement.close()
      this.snackbar.open(e.message, '', {duration: 5000})
    }
  }

  /** Hatches every single egg at once, but txn issues may mean some fail */
  async hatchAll() {
    const eggs = this.eggs.filter(e => e.isHatching)
    this.dialog!.nativeElement.showModal()
    this.hatchStatus = 'before'
    try {
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled
      const responses = await Promise.allSettled(eggs.map(e => this.firebase.exec<F.Hatch.Req, F.Hatch.Res>('hatch', {key: e.species})))
      const species: PokemonId[] = responses
        .filter(r => r.status === 'fulfilled')
        .map((r: PromiseFulfilledResult<HttpsCallableResult<F.Hatch.Res>>) => r.value.data.badge)
      species.forEach(s => console.log(s))
      this.hatchSpecies = species.map(s => new Badge(s).toString())
      this.hatchLabel = species.map(s => new Badge(s).toLabel()).join(', ')
      console.log(this.hatchSpecies, this.hatchLabel)
      this.hatchStatus = 'after'
      await this.firebase.refreshUser()
    } catch (e) {
      this.dialog!.nativeElement.close()
      this.snackbar.open(e.message, '', {duration: 5000})
    }
  }

  close() {
    this.dialog!.nativeElement.close()
  }
}
