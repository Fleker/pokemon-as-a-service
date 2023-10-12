import { ElementRef } from '@angular/core';
import { Component, OnInit, ViewChild } from '@angular/core';
import { PokemonDialogComponent } from 'src/app/dialogs/pokemon-dialog/pokemon-dialog.component';
import { FirebaseService } from 'src/app/service/firebase.service';
import {Badge} from '../../../../../shared/src/badge3'
import { ObjectEntries } from '../../../../../shared/src/object-entries';
import { PokemonId } from '../../../../../shared/src/pokemon/types';
import {F} from '../../../../../shared/src/server-types'

@Component({
  selector: 'app-page-bank',
  templateUrl: './page-bank.component.html',
  styleUrls: ['./page-bank.component.css']
})
export class PageBankComponent implements OnInit {
  @ViewChild('badge') badge?: ElementRef<HTMLInputElement>
  @ViewChild('dialog') dialog?: ElementRef
  @ViewChild('operations') operations?: ElementRef<HTMLTextAreaElement>
  @ViewChild('dpokemon') pokemonPicker?: PokemonDialogComponent
  boxNumber?: number
  converterText: string = ''
  notices: string[] = []
  pokemon: [PokemonId, number][] = []
  exec = {
    list: false,
    withdraw: false,
    deposit: false,
  }

  constructor(private firebase: FirebaseService) { }

  ngOnInit(): void {
  }

  badgeOldNew() {
    const orig = this.badge!.nativeElement.value
    const next = Badge.fromLegacy(orig)
    this.converterText = next.toString()
  }

  badgeNewOld() {
    const orig = this.badge!.nativeElement.value
    const next = new Badge(orig)
    this.converterText = `${next.toLegacyString()}  (${next.toLabel()})`
  }

  badgeParse() {
    const orig = this.badge!.nativeElement.value
    const next = new Badge(orig)
    this.converterText = JSON.stringify(next)
  }

  async list() {
    this.dialog!.nativeElement.showModal()
    this.exec.list = true
    window.requestAnimationFrame(async () => {
      const res = await this.firebase.exec('bank_list', {box: this.boxNumber})
      const {pokemon, notices} = res.data
      this.pokemonPicker.picker.customEntries = pokemon
      this.close()
      this.pokemonPicker.picker.reload()
      this.pokemonPicker.open()
      const sub = this.pokemonPicker.events.subscribe(event => {
        if (event === 'CLOSE') {
          if (this.pokemonPicker._selection.length) {
            const operations = this.pokemonPicker._selection.map(s => ([s.species, 1])) as unknown as F.Bank.BankOperation
            console.debug('Withdraw', this.pokemonPicker._selection.length, operations)
            window.requestAnimationFrame(async () => {
              this.dialog!.nativeElement.showModal()
              const res = await this.firebase.exec('bank_withdraw', { operations, box: this.boxNumber })
              const {notices} = res.data
              this.notices = notices
              this.pokemon = []
              this.exec.withdraw = false
              this.pokemonPicker.reset()
            })
          }
          sub.unsubscribe()
        }
      })
      this.exec.list = false
    })
  }

  close() {
    this.dialog!.nativeElement.close()
  }

  async deposit() {
    this.dialog!.nativeElement.showModal()
    this.exec.deposit = true
    window.requestAnimationFrame(async () => {
      const operations: F.Bank.BankOperation = JSON.parse(this.operations!.nativeElement.value)
      const res = await this.firebase.exec('bank_deposit', { operations, box: this.boxNumber })
      const {notices} = res.data
      this.notices = notices
      this.pokemon = []
      this.exec.deposit = false
    })
  }

  async withdraw() {
    this.dialog!.nativeElement.showModal()
    this.exec.withdraw = true
    window.requestAnimationFrame(async () => {
      const operations: F.Bank.BankOperation = JSON.parse(this.operations!.nativeElement.value)
      const res = await this.firebase.exec('bank_withdraw', { operations, box: this.boxNumber })
      const {notices} = res.data
      this.notices = notices
      this.pokemon = []
      this.exec.withdraw = false
    })
  }

  selectPkmn() {
    this.pokemonPicker.picker.customEntries = undefined
    this.pokemonPicker.picker.reload()
    this.pokemonPicker.open()
  }

  depositPicker() {
    this.dialog!.nativeElement.showModal()
    this.exec.deposit = true
    const selection = this.pokemonPicker?._selection
    if (!selection.length) {
      this.exec.deposit = false
      return
    }
    const operations = (() => {
      const m: Partial<Record<PokemonId, number>> = {}
      for (const {species} of selection) {
        if (m[species]) {
          m[species]++
        } else {
          m[species] = 1
        }
      }
      return Object.entries(m) as F.Bank.BankOperation[]
    })()
    window.requestAnimationFrame(async () => {
      const res = await this.firebase.exec('bank_deposit', { operations, box: this.boxNumber })
      const {notices} = res.data
      this.notices = notices
      this.pokemon = []
      this.exec.deposit = false
      this.pokemonPicker.reset()
      this.firebase.refreshUser()
    })
  }
}
