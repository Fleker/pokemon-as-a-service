import { ElementRef, ViewChild } from '@angular/core';
import { AfterViewInit, OnDestroy } from '@angular/core';
import { Component} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PokemonDialogComponent } from 'src/app/dialogs/pokemon-dialog/pokemon-dialog.component';
import { FirebaseService } from 'src/app/service/firebase.service';
import { Badge, Nature, NatureDescription } from '../../../../../shared/src/badge3';
import { ITEMS, ItemId } from '../../../../../shared/src/items-list';
import { get } from '../../../../../shared/src/pokemon';
import { PokemonId } from '../../../../../shared/src/pokemon/types';
import {getEligiblePokemonForMove, getVariantForMove} from '../../../../../shared/src/items-availablity'
import { MoveId } from '../../../../../shared/src/gen/type-move-meta';
import { F } from '../../../../../shared/src/server-types';
import { EvolutionComponent } from 'src/app/ui/evolution/evolution.component';
import { EngagementService } from 'src/app/engagement.service';

enum Mode {
  TM = 1,
  Mint = 2,
  Tutor3 = 3,
  Mushroom = 4,
  Honey = 5,
  Tutor6 = 6,
}

@Component({
  selector: 'app-page-movetutor',
  templateUrl: './page-movetutor.component.html',
  styleUrls: ['./page-movetutor.component.css']
})
export class PageMovetutorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('dialog') dialog: ElementRef
  @ViewChild('pokemon') pokemon: PokemonDialogComponent
  @ViewChild('evo') evo: EvolutionComponent
  tms?: {
    key: ItemId
    count: number
  }[]
  tmFilter: string
  filterTms?: {
    key: ItemId
    count: number
  }[]
  mints?: {
    key: ItemId
    label: string
    count: number
    nature: Nature
    description: string
  }[]
  teraShards?: {
    key: ItemId
    label: string
    count: number
    description: string
  }[]
  heartScales: number = -1
  armorite: number = -1
  maxMushroom = 0
  maxHoney = 0
  teraOrb = false

  selection?: PokemonId
  selectionLabel?: string
  selectionVar?: number
  currentMoves?: string[]
  newMoves?: string[]
  tm?: ItemId
  mint?: ItemId
  mode: Mode = Mode.Tutor3
  exec = {
    confirm: false
  }
  firebaseListener: any
  isMoveTutor6Enabled = false

  constructor(
    private firebase: FirebaseService,
    private snackbar: MatSnackBar,
    private engagement: EngagementService,
  ) { }

  ngAfterViewInit(): void {
    this.firebaseListener = this.firebase.subscribeUser(user => {
      if (user) {
        this.heartScales = user.items.heartscale || 0
        this.armorite = user.items.armorite || 0
        this.maxMushroom = user.items.maxmushroom || 0
        this.maxHoney = user.items.maxhoney || 0
        this.tms = Object.keys(user.items).sort()
          .filter(item => ITEMS[item]?.category === 'tms')
          .filter(item => user.items[item] > 0)
          .map(item => ({
            key: item as ItemId,
            count: user.items[item]
          }))
        this.filterTms = this.tms
        this.mints = Object.keys(ITEMS).sort()
          .filter(item => item.startsWith('mint'))
          .map(item => ({
            key: item as ItemId,
            label: ITEMS[item].label,
            count: user.items[item] ?? 0,
            nature: item.substring(4, 5).toUpperCase() + item.substring(5) as Nature,
          })).map(item => ({
            ...item,
            description: NatureDescription[item.nature],
          }))
        this.teraOrb = user.items.teraorb > 0 || this.engagement.isNextUi
        this.teraShards = Object.keys(ITEMS).sort()
          .filter(item => ITEMS[item].category === 'terashard')
          .map(item => ({
            key: item as ItemId,
            label: ITEMS[item].label,
            count: user.items[item] ?? 0,
            description: ITEMS[item].description,
          }))
        console.log(this.mints)
        if (user.ldap === 'fleker') {
          this.isMoveTutor6Enabled = true
        }
      }
    })

    this.pokemon.events.subscribe(ev => {
      if (ev === 'CLOSE' && this.pokemon._selection) {
        this.selection = this.pokemon._selection[0].species
        const badge = new Badge(this.selection)
        const pkmn = get(badge.toLegacyString())
        this.selectionLabel = badge.toLabel()
        this.currentMoves = pkmn.move

        if (this.mode === Mode.Tutor3) {
          badge.personality.variant = 3 // Tutor ID 3
          this.selectionVar = 3
        } else if (this.mode === Mode.TM) {
          const move = this.tm!.substring(3) as MoveId
          const variant = getVariantForMove(badge.toLegacyString(), move) // Any Tutor ID
          badge.personality.variant = variant
          this.selectionVar = variant
        }
        const tutorPkmn = get(badge.toLegacyString())
        this.newMoves = tutorPkmn.move
        this.dialog!.nativeElement.showModal()
      }
    })
  }

  ngOnDestroy() {
    this.firebaseListener?.unsubscribe()
  }

  useTutor(tutor: number) {
    this.mode = tutor
    this.pokemon.usePredicate((x) => {
      const badge = new Badge(x)
      if (badge.personality.variant === tutor) return false
      const str = badge.toLegacyString()
      const pkmn = get(str)
      return pkmn.novelMoves && pkmn.novelMoves.length >= (tutor + 1)
    })
    this.pokemon.open()
  }

  filterTmList() {
    window.requestAnimationFrame(() => {
      this.filterTms = this.tms.filter(tm =>
        tm.key.toLowerCase().includes(this.tmFilter.toLowerCase())
      )
    })
  }
  
  teachMove(tm: ItemId) {
    this.mode = Mode.TM
    this.tm = tm
    const move = tm.substring(3) as MoveId
    const eligible = getEligiblePokemonForMove(move, false)
    this.pokemon.usePredicate(x => {
      const badge = new Badge(x)
      const str = badge.toLegacyString()
      const pkmn = get(str)
      return eligible.filter.includes(pkmn.key)
    })
    this.pokemon.open()
  }

  useMint(nature: Nature, mint: ItemId) {
    this.mode = Mode.Mint
    this.mint = mint
    this.pokemon.usePredicate(x => {
      const badge = new Badge(x)
      return badge.personality.nature !== nature
    })
    this.pokemon.open()
  }

  useGMax(item: 'mushroom' | 'honey') {
    if (item === 'mushroom') {
      this.mode = Mode.Mushroom
    } else if (item === 'honey') {
      this.mode = Mode.Honey
    }
    this.pokemon.usePredicate(x => {
      const badge = new Badge(x)
      const str = badge.toLegacyString()
      const dbPkmn = get(str)!
      return dbPkmn.gmax !== undefined
    })
    this.pokemon.open()
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
          if (this.mode === Mode.Tutor3) {
            await this.firebase.exec<F.MoveTutor.Req, F.MoveTutor.Res>('move_tutor', { species: this.selection, tutorId: 3 })
            this.snackbar.open(`${this.selectionLabel} has learned novel moves.`, '', {duration: 3000})
          } else if (this.mode === Mode.TM) {
            await this.firebase.exec<F.UseTmTr.Req, F.UseTmTr.Res>('use_tmtr', { species: this.selection, item: this.tm })
            this.snackbar.open(`${this.selectionLabel} has been taught using the TM!`, '', {duration: 3000})
          } else if (this.mode === Mode.Mint) {
            await this.firebase.exec<F.UseItem.Req, F.UseItem.Res>('use_item', { target: this.selection, item: this.mint })
            this.snackbar.open(`${this.selectionLabel} consumed the mint!`, '', {duration: 3000})
          } else if (this.mode === Mode.Mushroom) {
            await this.firebase.exec<F.TrainPokemon.Req, F.TrainPokemon.Res>('use_item', { species: this.selection, item: 'maxmushroom' })
            this.snackbar.open(`${this.selectionLabel} consumed the max soup!`, '', {duration: 3000})
          } else if (this.mode === Mode.Honey) {
            await this.firebase.exec<F.TrainPokemon.Req, F.TrainPokemon.Res>('use_item', { species: this.selection, item: 'maxhoney' })
            this.snackbar.open(`${this.selectionLabel} consumed the max soup!`, '', {duration: 3000})
          }
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
