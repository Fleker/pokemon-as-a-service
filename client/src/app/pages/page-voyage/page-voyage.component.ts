import { I } from '@angular/cdk/keycodes';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PokemonDialogComponent } from 'src/app/dialogs/pokemon-dialog/pokemon-dialog.component';
import { FirebaseService } from 'src/app/service/firebase.service';
import { LocationService } from 'src/app/service/location.service';
import getQuestArgs from 'src/app/to-requirements';
import { Badge } from '../../../../../shared/src/badge3';
import { ItemId } from '../../../../../shared/src/items-list';
import { Requirements } from '../../../../../shared/src/legendary-quests';
import { ObjectEntries } from '../../../../../shared/src/object-entries';
import { PokemonId } from '../../../../../shared/src/pokemon/types';
import { Users, F } from '../../../../../shared/src/server-types';
import { Doc, Voyage, Voyages, VoyageId, Leg, getScore, getBucket } from '../../../../../shared/src/voyages';
import { Event, NavigationEnd, Router } from '@angular/router';

interface Participant {
  key: string
  ldap?: string
  ready: boolean
  species: PokemonId
  mine?: boolean
}

interface VoyageEntry extends Voyage {
  key: string
}

interface PublicVoyage {
  key: string
  label: string
  item: ItemId
}

@Component({
  selector: 'app-page-voyage',
  templateUrl: './page-voyage.component.html',
  styleUrls: ['./page-voyage.component.css']
})
export class PageVoyageComponent implements OnInit, OnDestroy {
  @ViewChild('create') create?: ElementRef
  @ViewChild('error') error?: ElementRef
  @ViewChild('pokemon') pokemon?: PokemonDialogComponent
  processedVoyages = false
  processedPublicVoyages = false
  allVoyages: VoyageEntry[] = []
  availableVoyageKeys: string[] = []
  availableVoyages: VoyageEntry[] = []
  unavailableVoyages: Voyage[] = []
  publicVoyages: PublicVoyage[]
  reasons: Partial<Record<VoyageId, string>> = {}
  errorMsg: string = ''
  user: Users.Doc
  firebaseListener: any
  inVoyage = false
  voyageBadId = false
  voyage?: Voyage
  selectedVoyage?: Voyage
  voyageDoc?: Doc
  playerArray?: Participant[]
  exec = {
    claim: false,
    confirmCreation: false,
    select: false,
    startVoyage: false,
    joinVoyage: false,
    leaveVoyage: false,
    publishVoyage: false,
  }
  playerIsReady = false

  constructor(
    readonly firebase: FirebaseService,
    private snackbar: MatSnackBar,
    private locations: LocationService,
    private router: Router,
  ) {
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        if (this.voyageId) {
          console.log('listen to ', this.voyageId)
          this.inVoyage = true
          this.listenToVoyage()
        } else {
          this.inVoyage = false
        }
      }
    })
  }

  get voyageId() {
    if (!window.location.search) return undefined
    return window.location.search
      .replace('web%2Bvoyage:', '')
      .replace('//', '')
      .replace('?', '')
      .replace('=', '')
  }

  get isHost() {
    if (!this.voyageDoc) return false
    return this.voyageDoc.host === this.firebase.getUid()
  }

  get playerInVoyage() {
    if (!this.voyageDoc) return false
    return this.voyageDoc.playerList.includes(this.firebase.getUid())
  }

  get battleInfo() {
    if (!this.pokemon) return ''
    let out: string[] = []
    this.pokemon._selection.forEach((p, i) => {
      let res = new Badge(p.species).toLabel()!
      out.push(res)
    })
    return out
  }

  get voyageCount() {
    if (!this.user) return undefined
    return this.user.voyagesCompleted ?? 0
  }

  get voyagesActive() {
    if (!this.user) return {}
    return this.user.voyagesActive ?? {}
  }

  get toClaim() {
    if (!this.voyageDoc) return false
    if (!this.user) return false
    return Object.values(this.user.voyagesActive).includes(this.voyageId)
  }

  get voyageReturn() {
    if (!this.voyageDoc) return new Date()
    const date = new Date(this.voyageDoc.started)
    date.setHours(date.getHours() + 22) // T+~1D
    return date.toString()
  }

  get score() {
    if (!this.voyageDoc) return 0
    const party = Object.values(this.voyageDoc.players).map(player => player.species)
    return getScore(this.voyageDoc.vid, party)
  }

  get bucket() {
    if (!this.score) return 0
    return getBucket(this.voyage, this.score)
  }

  /** Obtains query object for routerLink */
  routerQuery(id: string) {
    return { [id]: '' }
  }

  ngOnInit(): void {
    this.firebaseListener = this.firebase.subscribeUser(async user => {
      if (!user) return
      this.user = user
      const args = await getQuestArgs(this.user, this.locations, this.firebase)
      this.availableVoyages = []
      this.unavailableVoyages = []
      this.allVoyages = []
      Object.entries(Voyages).forEach(([key, value]) => {
        const available = this.isAvailable(value, args)
        if (available === true) {
          this.availableVoyageKeys.push(key)
          this.availableVoyages.push({...value, key})
        } else {
          this.unavailableVoyages.push(value)
          this.reasons[value.label] = available // Returns unlock msg 
        }
        this.allVoyages.push({...value, key})
      })
      this.processedVoyages = true

      const allPublicVoyages = await this.firebase.dbGet(['voyages', '_public'])
      this.publicVoyages = []
      for (const [key, vid] of Object.entries(allPublicVoyages.entries)) {
        if (this.availableVoyageKeys.includes(vid as string)) {
          this.publicVoyages.push({
            key: key as string,
            item: Voyages[vid as string].rareitems[0][0],
            label: Voyages[vid as string].label
          })
        }
      }
      this.publicVoyages.sort((a, b) => a.label.localeCompare(b.label))
      this.processedPublicVoyages = true
    })
  }

  ngOnDestroy() {
    this.firebaseListener?.unsubscribe()
  }

  listenToVoyage() {
    this.firebase.dbListen(['voyages', this.voyageId], (doc => {
      if (!doc.exists()) {
        this.voyageBadId = true
        this.voyage = undefined
        return
      }
      this.voyageDoc = doc.data() as Doc
      this.voyage = Voyages[this.voyageDoc.vid]
      this.playerArray = ObjectEntries(this.voyageDoc.players).map(([key, player]) => ({
        ...player,
        key,
        species: player.species.startsWith('potw-') ?
          Badge.fromLegacy(player.species) : new Badge(player.species),
      }))
    }))
  }

  isAvailable(voyage: Voyage, args: Requirements) {
    for (const hint of voyage.unlocked.hints) {
      if (!hint.completed(args)) return hint.msg
    }
    return true
  }

  openVoyageDialog(voyage: Voyage) {
    this.selectedVoyage = voyage
    this.create.nativeElement.showModal()
  }

  confirmCreation() {
    this.exec.confirmCreation = true
    console.debug(`Creating voyage ${this.selectedVoyage.label}`)
    const vid = Object.entries(Voyages)
      .find(([key, value]) => value.label === this.selectedVoyage.label)[0] as VoyageId
    window.requestAnimationFrame(async () => {
      try {
        const res = await this.firebase.exec<F.VoyageCreate.Req, F.VoyageCreate.Res>('voyage_create', {
          voyage: vid
        })
        const docId = res.data.docId
        this.router.navigate(['/multiplayer/voyages'], {
          queryParams: {
            [docId]: docId,
          }
        })
      } catch (e) {
        this.snackbar.open(e, '', { duration: 5000 })
      } finally {
        this.close()
      }
    })
  }

  updatePath(legIndex: number, legType: number) {
    this.voyageDoc.legs[legIndex] = legType
    if (legType === Leg.RARE_ITEM) {
      // Disable the second leg.
      this.voyageDoc.legs[1] = Leg.NOTHING
    }
    window.requestAnimationFrame(async () => {
      try {
        await this.firebase.exec<F.VoyagePath.Req, F.VoyagePath.Res>('voyage_path', {
          voyageId: this.voyageId,
          legs: this.voyageDoc.legs,
        })
      } catch (e) {
        this.snackbar.open(e, '', { duration: 5000 })
      }
    })
  }

  joinVoyage() {
    this.exec.joinVoyage = true
    window.requestAnimationFrame(async () => {
      try {
        await this.firebase.exec<F.VoyageSelect.Req, F.VoyageSelect.Res>('voyage_select', {
          voyageId: this.voyageId,
          ready: false,
          species: 'first'
        })
      } catch (e) {
        this.snackbar.open(e, '', { duration: 5000 })
      } finally {
        this.exec.joinVoyage = false
      }
    })
  }

  leaveVoyage() {
    this.exec.leaveVoyage = true
    window.requestAnimationFrame(async () => {
      try {
        await this.firebase.exec<F.VoyageSelect.Req, F.VoyageSelect.Res>('voyage_select', {
          voyageId: this.voyageId,
          ready: false,
          species: 'null'
        })
      } catch (e) {
        this.snackbar.open(e, '', { duration: 5000 })
      } finally {
        this.exec.leaveVoyage = false
      }
    })
  }

  publishVoyage() {
    this.exec.publishVoyage = true
    const quickConfirm = confirm('Confirm you want to make this public')
    if (!quickConfirm) return
    window.requestAnimationFrame(async () => {
      try {
        await this.firebase.exec<F.VoyagePublicize.Req, F.VoyagePublicize.Res>('voyage_publicize', {
          voyageId: this.voyageId,
        })
      } catch (e) {
        this.snackbar.open(e, '', { duration: 5000 })
      } finally {
        this.exec.publishVoyage = false
      }
    })
  }

  select() {
    this.exec.select = true
    if (!this.playerIsReady) {
      this.playerIsReady = window.confirm('Are you ready for this voyage?')
    }
    window.requestAnimationFrame(async () => {
      try {
        await this.firebase.exec<F.VoyageSelect.Req, F.VoyageSelect.Res>('voyage_select', {
          voyageId: this.voyageId,
          ready: this.playerIsReady,
          species: this.pokemon._selection[0].species
        })
      } catch (e) {
        this.snackbar.open(e, '', { duration: 5000 })
      } finally {
        this.exec.select = false
      }
    })
  }

  startVoyage() {
    this.exec.startVoyage = true
    window.requestAnimationFrame(async () => {
      try {
        await this.firebase.exec<F.VoyageStart.Req, F.VoyageStart.Res>('voyage_start2', {
          voyageId: this.voyageId,
        })
      } catch (e) {
        this.snackbar.open(e, '', { duration: 5000 })
      } finally {
        this.exec.startVoyage = false
      }
    })
  }

  claim() {
    this.exec.claim = true
    window.requestAnimationFrame(async () => {
      try {
        await this.firebase.exec<F.VoyageClaim.Req, F.VoyageClaim.Res>('voyage_claim2', {
          voyageId: this.voyageId,
        })
        this.firebase.refreshUser()
      } catch (e) {
        this.snackbar.open(e, '', { duration: 5000 })
      } finally {
        this.exec.claim = false
      }
    })
  }

  reportError(voyage: Voyage) {
    this.errorMsg = this.reasons[voyage.label] ?? 'No error found'
    this.error.nativeElement.showModal()
  }

  /** Close all dialogs on this page. */
  close() {
    this.create.nativeElement.close()
    this.error.nativeElement.close()
  }

  async shareVoyage() {
    const shareData = {
      title: `Voyage to ${this.selectedVoyage.label}`,
      text: 'You are invited to join this voyage!',
      url: `https://pokemon-of-the-week.web.app/multiplayer/voyages?${this.voyageId}`
    }
    await navigator.share(shareData)
  }
}
