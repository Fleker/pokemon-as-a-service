import { OnChanges, ViewChild } from '@angular/core';
import { SimpleChanges } from '@angular/core';
import { Component, Input } from '@angular/core';
import { PokemonId } from '../../../../../shared/src/pokemon/types'
import {Badge} from '../../../../../shared/src/badge3'
import {pkmn} from '../../../../../shared/src/sprites'
import * as P from '../../../../../shared/src/gen/type-pokemon'
import * as I from '../../../../../shared/src/gen/type-pokemon-ids'
import { PokedexDialog } from 'src/app/dialogs/pokedex/pokedex.component';
import { ManagerService } from 'src/app/dialogs/manager.service';
import { ElementRef } from '@angular/core';
import { ITEMS, ItemId } from '../../../../../shared/src/items-list';

/**
 * A canonical list of all mega sprites I've added into the game.
 * Ideally this will include every mega at the end. Until then,
 * this will designate which sprites can be shown. Otherwise,
 * they will revert to the default Pokémon sprite rather than
 * showing undefined.
 */
const validMegas = [
  P.Venusaur,
  P.Charizard,
  P.Blastoise,
  P.Beedrill,
  P.Pidgeot,
  P.Alakazam,
  P.Slowbro,
  P.Gengar,
  P.Kangaskhan,
  P.Pinsir,
  P.Gyarados,
  P.Aerodactyl,
  P.Mewtwo,
  P.Ampharos,
  P.Steelix,
  P.Scizor,
  P.Heracross,
  P.Houndoom,
  P.Tyranitar,
  P.Sceptile,
  P.Blaziken,
  P.Swampert,
  P.Gardevoir,
  P.Sableye,
  P.Mawile,
  P.Aggron,
  P.Medicham,
  P.Manectric,
  P.Sharpedo,
  P.Camerupt,
  P.Altaria,
  P.Banette,
  P.Absol,
  P.Glalie,
  P.Salamence,
  P.Metagross,
  P.Latias,
  P.Latios,
  P.Kyogre,
  P.Groudon,
  P.Rayquaza,
  P.Lopunny,
  P.Garchomp,
  P.Lucario,
  P.Abomasnow,
  P.Gallade,
  P.Audino,
  P.Diancie,
]

const validGmax = [
  P.Venusaur,
  P.Charizard,
  P.Blastoise,
  P.Butterfree,
  P.Pikachu,
  P.Meowth,
  P.Machamp,
  P.Gengar,
  P.Kingler,
  P.Lapras,
  P.Eevee,
  P.Snorlax,
  P.Garbodor,
  P.Melmetal,
  P.Rillaboom,
  P.Cinderace,
  P.Inteleon,
  P.Corviknight,
  P.Orbeetle,
  P.Drednaw,
  P.Coalossal,
  P.Flapple,
  P.Appletun,
  P.Sandaconda,
  P.Toxtricity,
  P.Centiskorch,
  P.Hatterene,
  P.Grimmsnarl,
  P.Alcremie,
  P.Copperajah,
  P.Duraludon,
  P.Urshifu,
]

// See https://msikma.github.io/pokesprite/overview/dex-gen8.html for more icons

@Component({
  selector: 'sprite-pokemon',
  templateUrl: './sprite-pokemon.component.html',
  styleUrls: ['./sprite-pokemon.component.css']
})
export class SpritePokemonComponent implements OnChanges {
  @Input('animate') animate?: boolean = false
  @Input('badge') badge?: PokemonId | string
  @Input('held') held?: ItemId | string
  @Input('dialog') showDialog = false
  @Input('uncaught') uncaught = false
  @Input('tag') canTag = false
  @ViewChild('dialog') dialog?: ElementRef
  @ViewChild('ddex') ddex?: ElementRef<PokedexDialog>
  @ViewChild('img') img: ElementRef<HTMLImageElement>
  src?: string
  alt?: string
  var?: number
  classes?: string
  sparkles = ''

  constructor(private dialogs: ManagerService) { }

  ngOnChanges(changes: SimpleChanges) {
    if ('badge' in changes) {
      const newv = changes['badge'].currentValue
      if (this.animate) {
        this.sparkles = ''
        setTimeout(() => {
          this.sparkles = 'gone'
        }, 2817) // Remove
      }
      if (newv !== undefined && newv !== "") {
        const pkmnBadge = new Badge(newv)
        const megaPath = this.isMegaEvolution()
        const gmaxPath = this.isGmax()
        if (megaPath) {
          const path = pkmnBadge.toSprite()
          if (validMegas.includes(path.replace('-shiny', ''))) {
            /**
             * Mega sprites have the `-mega` appended to the end.
             * Examples:
             *   'potw-003-mega'
             *   'potw-003-shiny-mega'
             *   'potw-006-megax'
             */
            if (path.includes('-shiny')) {
              this.src = pkmn(path).replace('-shiny', megaPath + '-shiny')
            } else {
              this.src = pkmn(path + megaPath as any)
            }
            console.debug('Mega Sprite', path, megaPath, this.src)
          } else {
            this.src = pkmn(path)
          }
        } else if (gmaxPath) {
          const path = pkmnBadge.toSprite()
          if (validGmax.includes(path.replace('-shiny', ''))) {
            /**
             * Mega sprites have the `-mega` appended to the end.
             * Examples:
             *   'potw-003-mega'
             *   'potw-003-shiny-mega'
             *   'potw-006-megax'
             */
            if (path.includes('-shiny')) {
              this.src = pkmn(path).replace('-shiny', gmaxPath + '-shiny')
            } else {
              this.src = pkmn(path + gmaxPath as any)
            }
            console.debug('Gmax Sprite', path, gmaxPath, this.src)
          } else {
            this.src = pkmn(path)
          }
        } else if (pkmnBadge.id === I.Zacian && this.held === 'rustedsword') {
          pkmnBadge.personality.form = 'crowned_sword'
          this.src = pkmn(pkmnBadge.toSprite())
        } else if (pkmnBadge.id === I.Zamazenta && this.held === 'rustedshield') {
          pkmnBadge.personality.form = 'crowned_shield'
          this.src = pkmn(pkmnBadge.toSprite())
        } else if (pkmnBadge.id === I.Eternatus && this.held === 'beserkgene') {
          pkmnBadge.personality.form = 'eternamax'
          this.src = pkmn(pkmnBadge.toSprite())
        } else {
          this.src = pkmn(pkmnBadge.toSprite())
        }
        this.alt = pkmnBadge.toLabel()
        this.var = pkmnBadge.personality.variant
        this.classes = (() => {
          const clist = []
          if (this.var !== undefined) {
            clist.push(`var${this.var}`)
          }
          if (pkmnBadge.personality.shiny) {
            clist.push('shiny')
          }
          if (this.animate) {
            clist.push('animate')
          }
          if (pkmnBadge.size) {
            clist.push(pkmnBadge.size)
          }
          if (this.isDmax()) {
            clist.push('dynamax')
          }
          return clist.join(' ')
        })()
      } else {
        this.src = ''
        this.alt = 'N/A'
        this.var = 0
        this.classes = ''
      }
    }
  }

  isMegaEvolution() {
    if (this.held && ITEMS[this.held] && ITEMS[this.held].category === 'megastone') {
      // Let's assume people are using the right megastone
      // This is for sprite rendering only, not having any backend effect
      if (this.held.endsWith('x')) return '-megax'
      if (this.held.endsWith('y')) return '-megay'
      return '-mega'
    }
    if (['redorb', 'blueorb', 'tm-Dragon Ascent'].includes(this.held)) {
      return '-mega'
    }
    return false
  }

  isDmax() {
    if (['maxmushroom', 'maxhoney', 'dynamaxcandy'].includes(this.held)) {
      return true
    }
    return false
  }

  isGmax() {
    if (this.held === 'maxmushroom' || this.held === 'maxhoney') {
      // Let's assume people are using the right item
      // This is for sprite rendering only, not having any backend effect
      return '-gmax'
    }
    return false
  }

  openDialog() {
    if (this.showDialog) {
      this.dialogs.openPokedex({
        badge: this.badge as PokemonId,
      }, this.canTag, this.uncaught)
    }
  }
}
