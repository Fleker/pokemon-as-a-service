import { OnDestroy, ViewChild } from '@angular/core';
import {Component } from '@angular/core';
import { BadgeId, PokemonDoc, PokemonId } from '../../../../../shared/src/pokemon/types';
import * as Pkmn from '../../../../../shared/src/pokemon';
import { Badge, MATCH_REQS, NatureDescription } from '../../../../../shared/src/badge3';
import { pkmn } from '../../../../../shared/src/sprites';
import { MoveId } from '../../../../../shared/src/gen/type-move-meta';
import { FirebaseService } from 'src/app/service/firebase.service';
import {ENCOUNTER_MAP, HOLD_ITEMS} from '../../../../../shared/src/gen/encounter-map'
import { ITEMS, ItemId, PokeballId } from '../../../../../shared/src/items-list';
import { ManagerService } from '../manager.service';
import { Globe } from '../../../../../shared/src/locations-list';
import { OnInit } from '@angular/core';
import { CATCH_CHARM_BW, CATCH_CHARM_DPPT, CATCH_CHARM_GSC, CATCH_CHARM_RBY, CATCH_CHARM_RSE } from '../../../../../shared/src/quests';
import { TagComponent } from '../tag/tag.component';
import { Users } from '../../../../../shared/src/server-types';
import { getMaxMoveset } from '../../../../../shared/src/dynamax';
import { MatMenuTrigger } from '@angular/material/menu';
import { ItemAvailability } from '../../../../../shared/src/items-availablity';
import { MatSnackBar } from '@angular/material/snack-bar';
import { F } from '../../../../../shared/src/server-types';
import { BATTLE_TIERS } from '../../../../../shared/src/battle-tiers';


export interface PokedexData {
  badge: PokemonId
}

@Component({
  selector: 'dialog-pokedex',
  templateUrl: './pokedex.component.html',
  styleUrls: ['./pokedex.component.css']
})
export class PokedexDialog implements OnInit, OnDestroy {
  @ViewChild('tagger') tagger?: TagComponent
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger
  user?: Users.Doc
  badge?: Badge
  canTag: boolean = false
  uncaught: boolean = false
  pokemon?: PokemonDoc & { key: string }
  eggGroup: string[]
  eggBase: string[]
  key?: BadgeId
  natDexNo: number = -1
  sprite: string = ''
  movesNative: MoveId[] = []
  movesMega: MoveId[] = []
  movesMegaX: MoveId[] = []
  movesMegaY: MoveId[] = []
  movesGmax: MoveId[] = []
  movesVariant: MoveId[] = []
  movesTmTr: MoveId[] = []
  criteria?: {
    pokemon: BadgeId
    rarity: number
    method: string[]
    item: PokeballId
  }[]
  held?: ItemId[]
  pokemonEvoPrev?: PokemonId[]
  pokemonEvoNext?: PokemonId[]
  pokemonOneMinus?: PokemonId
  pokemonOnePlus?: PokemonId
  caughtForms?: PokemonId[]
  novelSize?: 'xxs' | 'xs' | 's' | 'l' | 'xl' | 'xxl'
  unlocked = {
    moves: false,
    areas: false,
    tiers: false,
    items: false,
    release: false,
    forms: false,
    daycare: false,
    mega: false,
    gmax: false,
  }
  customTags: string[] = []
  tags: string[] = []
  hasMega = false
  hasGmax = false
  firebaseListener?: any
  natureDescription?: string
  weight: number = -1
  battleTiers = BATTLE_TIERS
  actionMenu = {
    open: false,
    exec: false,
    useItem: [],
  }

  get caughtLocation() {
    const location = this.badge.personality.location
    if (location) {
      if (Globe[location]) {
        return `Caught in ${Globe[location].label}`
      } else if (location === 'Hatched') {
        return 'Hatched'
      }
    }
    return ''
  }

  get badgeForm() {
    if (!this.badge) return undefined
    if (this.badge.personality.form) {
      return this.badge.personality.form.split('_').map(f => {
        return ' ' + f.substring(0,1).toUpperCase() + f.substring(1)
      }).join('')
    }
    return undefined
  }

  constructor(
    private firebase: FirebaseService,
    private dialogs: ManagerService,
    private snackbar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.firebaseListener = this.firebase.subscribeUser(user => {
      if (user) {
        this.user = user
        this.unlocked = {
          moves: user.hiddenItemsFound.includes(CATCH_CHARM_RBY),
          tiers: user.hiddenItemsFound.includes(CATCH_CHARM_RBY),
          release: user.hiddenItemsFound.includes(CATCH_CHARM_GSC),
          areas: user.hiddenItemsFound.includes(CATCH_CHARM_RSE),
          items: user.hiddenItemsFound.includes(CATCH_CHARM_RSE),
          forms: user.hiddenItemsFound.includes(CATCH_CHARM_DPPT),
          daycare: user.hiddenItemsFound.includes(CATCH_CHARM_BW),
          mega: user.items.megabracelet > 0,
          gmax: user.ldap === "fleker", // FIXME
        }
        this.customTags = user.customTags
      }
    })
  }

  ngOnDestroy() {
    this.firebaseListener?.unsubscribe()
  }

  openDex(pkmnId: PokemonId, canTag: boolean = false, uncaught: boolean = false) {
    this.badge = new Badge(pkmnId)
    console.debug('Open badge', this.badge.personality?.form)
    this.canTag = canTag
    this.uncaught = uncaught
    const lookupId = this.badge.toLegacyString()
    console.debug('lookupId', lookupId)
    this.pokemon = Pkmn.get(lookupId)!
    const size = this.badge.size
    this.weight = Math.round(this.pokemon.weight * 10 * Pkmn.weightModifier[size ?? 'n']) / 10
    this.key = (this.pokemon as any)['key'] as BadgeId
    console.debug('pkmn key', this.key)
    if (Array.isArray(this.pokemon.eggBase)) {
      this.eggBase = [...this.pokemon.eggBase]
    } else {
      this.eggBase = [this.pokemon.eggBase]
    }
    // Now convert for sprites
    // Remove all undefineds (like for legendaries)
    this.eggBase = this.eggBase.filter(x => x).map(x => Badge.fromLegacy(x).toString())
    if (Array.isArray(this.pokemon.eggGroup)) {
      this.eggGroup = [...this.pokemon.eggGroup]
    } else {
      this.eggGroup = [this.pokemon.eggGroup]
    }
    this.natDexNo = this.badge.id
    this.sprite = pkmn(this.badge.toSprite())
    this.movesNative = [...this.pokemon.move]
    this.movesVariant = (() => {
      const alts = this.pokemon.moveAll!
        .filter(m => !this.movesNative.includes(m))
      if (alts.length) {
        return alts
      } else {
        return []
      }
    })()
    this.movesTmTr = (() => {
      if (this.pokemon.moveTMs) {
        return this.pokemon.moveTMs
      }
      return []
    })()

    this.criteria = (ENCOUNTER_MAP as any)[this.key]
    this.held = (HOLD_ITEMS as any)[this.key]

    // Calculate shortcuts
    const {prev, next} = Pkmn.getDexIndicies(lookupId)
    this.pokemonOneMinus = (() => {
      if (!prev) return undefined
      return Badge.fromLegacy(prev).toString()
    })()
    this.pokemonOnePlus = (() => {
      if (!next) return undefined
      return Badge.fromLegacy(next).toString()
    })()

    this.pokemonEvoPrev = Pkmn.getAllPreEvolutions(lookupId)
      .map(x => Badge.fromLegacy(x).toString())
    this.pokemonEvoNext = Pkmn.getAllEvolutions(lookupId)
      .map(x => Badge.fromLegacy(x).toString())
    this.hasMega = this.pokemon.mega !== undefined || this.pokemon.megax !== undefined
    if (this.pokemon.mega) {
      this.movesMega = [...this.pokemon.move]
      for (let i = 0; i < this.pokemon.mega.move.length; i++) {
        this.movesMega[i] = this.pokemon.mega.move[i]
      }
    }
    if (this.pokemon.megax) {
      this.movesMegaX = [...this.pokemon.move]
      for (let i = 0; i < this.pokemon.megax.move.length; i++) {
        this.movesMegaX[i] = this.pokemon.megax.move[i]
      }
    }
    if (this.pokemon.megay) {
      this.movesMegaY = [...this.pokemon.move]
      for (let i = 0; i < this.pokemon.megay.move.length; i++) {
        this.movesMegaY[i] = this.pokemon.megay.move[i]
      }
    }
    this.hasGmax = this.pokemon.gmax !== undefined
    if (this.hasGmax) {
      this.movesGmax = getMaxMoveset(this.pokemon.move, this.pokemon.gmax.gmaxMove)
    }

    this.tags = [...(this.badge.defaultTags || [])]
    if (this.badge.tags) {
      // Add custom tags
      for (const tagId of this.badge.tags) {
        this.tags.push(this.customTags[tagId])
      }
    }

    const {pokemon} = this.user
    const badgeSet: Set<PokemonId> = new Set(Object.keys(pokemon) as PokemonId[])
    const allCaughtForms = []
    // Need to find the simplest form, but then reconvert that to a canonical badge
    const simple = Badge.fromLegacy(this.badge.toSimple()).toString()
    badgeSet.forEach(setId => {
      const {match} = Badge.match(simple, [setId], MATCH_REQS)
      if (match) {
        allCaughtForms!.push(setId)
      }
    })
    this.caughtForms = [...new Set(allCaughtForms
        .map(p => new Badge(p).toLegacyString())
        .map(p => Badge.fromLegacy(p).toString()))]
    this.caughtForms.sort()
    const sizeModifier = this.badge.size
    if (sizeModifier) {
      this.novelSize = sizeModifier
    } else {
      this.novelSize = undefined // Clear out
    }
    this.natureDescription = NatureDescription[this.badge.personality.nature]

    // Compute actions
    // We don't know here whether the item will be actually useable, but we can use the filters
    this.actionMenu.useItem = []
    for (const [key, value] of Object.entries(ItemAvailability)) {
      console.debug(key, value, this.pokemon.key, value.filter.includes(this.pokemon.key as any))
      if (value.filter.includes(this.pokemon.key as any)) {
        this.actionMenu.useItem.push({
          item: key,
          label: ITEMS[key].label,
        })
      }
    }
  }

  close() {
    this.dialogs.closePokedex()
  }

  openTagModal() {
    this.tagger.open([this.badge.toString()])
  }

  async removeTag(tagName: string) {
    const alphaConfirm = confirm(`Delete tag ${tagName} (alpha)`)
    if (!alphaConfirm) return
    const tagOps = [{
      species: this.badge.toString(),
      shouldTag: false,
      tags: [tagName]
    }]
    await this.firebase.exec('tag', {
      operations: tagOps
    })
    alert('Removed tag')
    this.close()
    this.firebase.refreshUser()
  }

  async actionTutor() {
    this.actionMenu.exec = true
    try {
      await this.firebase.exec<F.MoveTutor.Req, F.MoveTutor.Res>('move_tutor', {
        species: this.badge.toString(), tutorId: 3
      })
      this.close()
      this.snackbar.open(`Your ${this.badge.toLabel()} has learned novel moves.`, '', {duration: 3000})
    } catch (e) {
      this.close()
      this.snackbar.open(e, '', { duration: 5000 })
    } finally {
      this.actionMenu.exec = false
    }
  }

  async actionDelete() {
    this.actionMenu.exec = true

    try {
      await this.firebase.exec<F.MoveDeleter.Req, F.MoveDeleter.Res>('move_deleter', {
        species: this.badge.toString()
      })
      this.close()
      this.snackbar.open(`Your ${this.badge.toLabel()} has lost its novel moves.`, '', {duration: 3000})
    } catch (e) {
      this.close()
      this.snackbar.open(e, '', { duration: 5000 })
    } finally {
      this.actionMenu.exec = false
    }
  }

  async actionUseItem(item: ItemId) {
    // Note: This isn't perfect since the underlying widget doesn't exist
    this.actionMenu.exec = true
    try {
      const res = await this.firebase.exec<F.UseItem.Req, F.UseItem.Res>('use_item', {
        item,
        target: this.badge.toString(),
        hours: new Date().getHours(),
        gyroZ: 0, // FIXME
      })
      this.close()
      switch (res.data.changeType) {
        case 'EVO': {
          this.snackbar.open(`Your Pokémon evolved into ${new Badge(res.data.species).toLabel()}`, '', { duration: 5000 })
          break;
        }
        case 'FORM': {
          this.snackbar.open(`Your Pokémon changed into ${new Badge(res.data.species).toLabel()}`, '', { duration: 5000 })
          break;
        }
        case 'RESTORED': {
          this.snackbar.open(`Your Pokémon was restored into ${new Badge(res.data.species).toLabel()}`, '', { duration: 5000 })
          break;
        }
      }
    } catch (e) {
      this.close()
      this.snackbar.open(e, '', { duration: 5000 })
    } finally {
      this.actionMenu.exec = false
    }
  }
}
