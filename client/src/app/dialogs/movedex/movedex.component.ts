import { Component } from '@angular/core';
import { MoveId, MoveTypeMap, MoveUsers } from '../../../../../shared/src/gen/type-move-meta';
import { ManagerService } from '../manager.service';
import { zMovePower, zMoveMapping } from '../../../../../shared/src/zmoves'
import { maxMovePower, maxMoveMapping } from '../../../../../shared/src/dynamax'
import { FirebaseService } from 'src/app/service/firebase.service';
import { PokemonId } from '../../../../../shared/src/pokemon/types';
import { Badge } from '../../../../../shared/src/badge3';

@Component({
  selector: 'dialog-movedex',
  templateUrl: './movedex.component.html',
  styleUrls: ['./movedex.component.css']
})
export class MovedexComponent {
  move?: MoveId
  attackKey?: string
  power?: string
  metadata?: any
  accuracy?: string
  showZMove = false
  showDynamax = false
  firebaseListener: any
  users: {
    badge: PokemonId
    uncaught: boolean
  }[]

  get zpower() {
    const zpower = zMovePower(this.metadata?.power ?? 0)
    if (zpower) {
      return Math.round(zpower * 100 - 20)
    }
    return 0
  }

  get zmoveName() {
    if (!this.metadata) return 'Z-Null'
    if (this.metadata.power === 0) return `Z-${this.metadata.name}`
    return zMoveMapping[this.metadata.type]
  }

  get zmoveFlavor() {
    const m = this.zmoveName
    if (MoveTypeMap[m]) {
      return MoveTypeMap[m].flavor
    }
    return ''
  }

  get dynamaxPower() {
    const zpower = maxMovePower(this.metadata?.power ?? 0, this.metadata?.accuracy ?? 1)
    if (zpower) {
      return Math.round(zpower * 100 - 20)
    }
    return 0
  }

  get dynamaxName() {
    if (!this.metadata) return 'Max Null'
    if (this.metadata.power === 0) return `Max Guard`
    return maxMoveMapping[this.metadata.type]
  }

  get dynamaxFlavor() {
    const m = this.dynamaxName
    if (MoveTypeMap[m]) {
      return MoveTypeMap[m].flavor
    }
    return ''
  }

  get moveIcon() {
    if (!this.metadata) return ''
    if (!this.metadata.power) return 'pending'
    if (this.attackKey === 'Physical') return 'flare'
    return 'visibility'
  }

  constructor(
    private dialogs: ManagerService,
    private firebase: FirebaseService,
  ) { }

  openDialog(move: MoveId) {
    this.move = move
    this.metadata = MoveTypeMap[move]!
    this.attackKey = this.metadata.attackKey === 'attack' ?
      'Physical' :
      'Special'
    this.power = this.metadata.power === 0 ?
      '--' :
      Math.round(this.metadata.power * 100 - 20).toString()
    this.accuracy = this.metadata.accuracy === Infinity ?
      '--' :
      `${Math.round(this.metadata.accuracy * 100)}%`
    this.firebaseListener = this.firebase.subscribeUser(user => {
      if (!user) return
      this.showZMove = false
      this.showDynamax = false
      if (user && user.items.zpowerring && !this.isDynamaxMove(move)) {
        this.showZMove = true
      }
      if (user && user.items.dynamaxband && !this.isDynamaxMove(move)) {
        this.showDynamax = true
      }
      if (user.ldap === 'fleker') {
        this.showDynamax = true
      }

      const potentialUsers = MoveUsers[move] ?? []
      this.users = []
      const userPkmn = Object.keys(user.pokemon) as PokemonId[]
      for (const p of potentialUsers) {
        const pid = Badge.fromLegacy(p)
        if (Badge.quickMatch(pid.id, {variant: pid.personality.variant, form: pid.personality.form}, userPkmn)) {
          this.users.push({ badge: pid.toString(), uncaught: false })
        } else {
          this.users.push({ badge: pid.toString(), uncaught: true })
        }
      }
      console.log(this.users)
    })
  }

  isDynamaxMove(name: string) {
    return name.startsWith('G-Max') || name.startsWith('Max ')
  }

  close() {
    this.dialogs.closeMovedex()
    this.firebaseListener?.unsubscribe()
  }
}
