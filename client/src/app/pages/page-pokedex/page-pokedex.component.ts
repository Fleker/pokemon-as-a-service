import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FirebaseService } from 'src/app/service/firebase.service';
import {Region, regions} from '../../../../../shared/src/pokedex'
import {Pokemon, Badge, MATCH_REQS, Personality} from '../../../../../shared/src/badge3'
import { PokemonForm, PokemonGender, PokemonId } from '../../../../../shared/src/pokemon/types';
import { F } from '../../../../../shared/src/server-types';
import * as Pkmn from '../../../../../shared/src/pokemon';
import {TPokemon} from '../../../../../shared/src/badge-inflate';
import {ObjectEntries} from '../../../../../shared/src/object-entries';
import { LinksService } from 'src/app/links.service';
import { MoveId, MoveTypeMap } from '../../../../../shared/src/gen/type-move-meta';
import { CATCH_CHARM_BW, CATCH_CHARM_GSC, CATCH_CHARM_RBY, KEY_ITEM_QUESTS, LEGENDARY_ITEM_QUESTS, PokedexQuest, POKEDEX_QUESTS, SHINY_CHARM, CAMPINGGEAR } from '../../../../../shared/src/quests';
import { ITEMS, ItemId } from '../../../../../shared/src/items-list';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EngagementService } from 'src/app/engagement.service';

interface DexRegion {
  label: string
  total: number
  count: number
  sprites: Sprite[]
  emoji: string
}

interface Sprite {
  badge: PokemonId
  registered: boolean
  hold?: string
}

interface MoveDex {
  name: string
  registered: boolean
}

interface BerryDex {
  name: string
  label: string
  description?: string
  registered: boolean
}

interface Gate {
  movedex: boolean
  berrydex: boolean
  currydex: boolean
}

const LAZY_LOAD_MS = 50

@Component({
  selector: 'app-page-pokedex',
  templateUrl: './page-pokedex.component.html',
  styleUrls: ['./page-pokedex.component.css']
})
export class PagePokedexComponent implements OnInit, OnDestroy {
  @ViewChild('charmdialog') charmDialog?: ElementRef
  pokedexBadges: number[] = []
  registered: DexRegion[] = []
  living: DexRegion[] = []
  shiny: DexRegion[] = []
  unown: DexRegion = {
    count: -1,
    label: '',
    sprites: [],
    total: 0,
    emoji: '',
  }
  variants: DexRegion = {
    count: -1,
    label: '',
    sprites: [],
    total: 0,
    emoji: '',
  }
  variantsFr: string = ''
  userPokemon?: TPokemon
  userItems?: Record<ItemId, number>
  /** TODO: Do not show Z-Moves because they cannot be registered. */
  moves: MoveDex[] = Object.keys(MoveTypeMap)
    .map(name => ({name, registered: false}))
  berries: BerryDex[] = Object.entries(ITEMS)
    .filter(([_, value]) => value.category === 'berry')
    .map(([key, v]) => ({name: key, registered: false, label: v.label}))
  cooking: BerryDex[] = Object.entries(ITEMS)
    .filter(([_, value]) => value.category === 'bait')
    .map(([key, v]) => ({name: key, registered: false, label: v.label, description: v.description}))
  gate: Gate = {
    movedex: false,
    berrydex: false,
    currydex: false,
  }
  loaded: boolean = false
  firebaseListener: any
  maxRegions = 10 // Galar + Hisui + Unknown
  dialog = {
    title: '',
    sprite: '',
    modes: [], // string[]
    nextQuests: [], // string[]
  }

  get registeredMoves() {
    return this.moves.filter(m => m.registered).length
  }

  get registeredBerries() {
    return this.berries.filter(m => m.registered).length
  }

  get registeredCooking() {
    return this.cooking.filter(m => m.registered).length
  }

  constructor(
    private firebase: FirebaseService,
    private links: LinksService,
    private snackbar: MatSnackBar,
    private engager: EngagementService,
  ) { }

  ngOnInit(): void {
    this.links.init().then(() => {
      this.variantsFr = this.links.templates!.variants
    })
    if (this.engager.isNextUi) {
      this.maxRegions = 11 // Paldea + Unknown + Hisui
    }
    this.firebaseListener = this.firebase.subscribeUser(async user => {
      if (user && !this.loaded) {
        this.loaded = true
        this.loadRegisteredDex() // Run in parallel

        this.userPokemon = user.pokemon
        this.userItems = user.items as unknown as Record<ItemId, number>
        this.gate.movedex = user.hiddenItemsFound.includes(CATCH_CHARM_BW)
        this.gate.berrydex = user.berryGrown > 200
        this.gate.currydex = user.hiddenItemsFound.includes(CAMPINGGEAR)
      }
    })
  }

  ngOnDestroy() {
    this.firebaseListener?.unsubscribe()
  }

  getRegionEmoji(r: Region, curr: number) {
    if (r.total === curr) {
      return '🎉' // Is complete
    }
    if (r.total * 0.4 <= curr) {
      return '🎈' // Catching charm worthy
    }
    return '' // Nothing yet
  }

  async loadRegisteredDex() {
    await this.pullPokedexSprites()
    this.registered = regions.slice(1, this.maxRegions+1).map(r => {
      const sprites = this.getPokedexSprites(r.range, r.key)
      return {
        label: r.label,
        total: r.total,
        count: sprites.filter(r => r.registered).length,
        sprites,
        emoji: this.getRegionEmoji(r, sprites.filter(r => r.registered).length)
      }
    })
  }

  // Code listed below is part of Chrome's effort to improve the UI thread
  // While JS is still not multi-threaded, breaking up steps can help improve
  // performance for operations like catching and hatching.
  // See https://web.dev/optimize-long-tasks/ for future APIs.
  private yieldToMain() {
    return new Promise(resolve => {
      setTimeout(resolve, 0);
    });
  }

  lazyLoad(event: MatTabChangeEvent) {
    const regionalForms: PokemonForm[] = ['alolan', 'galarian', 'hisuian', 'paldean']

    console.debug('Load', event.index)
    switch (event.index) {
      case 1: // Living Dex
        if (this.living.length > 0) return // Already done
        setTimeout(async () => {
          const tasks = regions.slice(1, this.maxRegions+1).map(r => () => {
            const sprites = this.getSprites(r.range, 'living', this.userPokemon)
            return {
              label: r.label,
              total: r.total,
              count: sprites.filter(r => r.registered).length,
              sprites,
              emoji: this.getRegionEmoji(r, sprites.filter(r => r.registered).length)
            }
          })
          // Provide empty to start with
          this.living = regions.slice(1, this.maxRegions+1).map(r => {
            return {
              label: r.label,
              total: r.total,
              count: 0,
              sprites: [],
              emoji: '',
            }
          })
          this.living.push({
            label: 'Forms',
            total: 0,
            count: 0,
            sprites: [],
            emoji: '',
          })
          this.living.push({
            label: 'Mega Evolutions',
            total: 0,
            count: 0,
            sprites: [],
            emoji: '',
          })
          this.living.push({
            label: 'Gigantamax',
            total: 0,
            count: 0,
            sprites: [],
            emoji: '',
          })
          let livingIndex = 0
          while (tasks.length > 0) {
            const task = tasks.shift()
            const res = task()
            this.living[livingIndex++] = res
            await this.yieldToMain()
          }

          // Living Dex+
          for (const regionalForm of regionalForms) {
            const formSpritesSet = new Set<Sprite>()
            const keys = Object.keys(this.userPokemon) as PokemonId[]
            for (const [badgeId, pokemon] of ObjectEntries(Pkmn.datastore)) {
              const id = parseInt(badgeId.substring(5))
              let badge;
              if (pokemon.syncableForms) {
                for (const form of pokemon.syncableForms) {
                  if (form !== regionalForm) continue
                  badge = Pokemon(id, {form})
                  this.processVariantSprite(formSpritesSet, keys, id, {form})
                  console.log(formSpritesSet)
                }
              }
              if (id % 50 === 0) {
                // Take a step back
                await this.yieldToMain()
              }
            }
            const formSprites = [...formSpritesSet]
            this.living[livingIndex++] = {
              label: `${regionalForm.substring(0, 1).toUpperCase()}${regionalForm.substring(1)} Forms`,
              total: formSprites.length,
              count: formSprites.filter(r => r.registered).length,
              sprites: formSprites,
              emoji: '',
            }
            await this.yieldToMain()
          }

          // All other possible forms
          const formSpritesSet = new Set<Sprite>()
          const keys = Object.keys(this.userPokemon) as PokemonId[]
          for (const [badgeId, pokemon] of ObjectEntries(Pkmn.datastore)) {
            const id = parseInt(badgeId.substring(5))
            let badge;
            if (pokemon.syncableForms) {
              for (const form of pokemon.syncableForms) {
                if (regionalForms.includes(form)) continue
                badge = Pokemon(id, {form})
                this.processVariantSprite(formSpritesSet, keys, id, {form})
              }
            }
            if (id % 50 === 0) {
              // Take a step back
              await this.yieldToMain()
            }
          }
          const formSprites = [...formSpritesSet]
          this.living[livingIndex++] = {
            label: 'Forms',
            total: formSprites.length,
            count: formSprites.filter(r => r.registered).length,
            sprites: formSprites,
            emoji: '',
          }
          await this.yieldToMain()

          // Megas
          const megaSpritesSet = new Set<Sprite>()
          const items = Object.keys(this.userItems) as ItemId[]
          for (const [badgeId, pokemon] of ObjectEntries(Pkmn.datastore)) {
            const id = parseInt(badgeId.substring(5))
            if (id === 382) {
              const badge = Pokemon(id)
              const registered = items.includes('blueorb')
              megaSpritesSet.add({ badge, registered, hold: 'venusaurite' })
              continue
            }
            if (id === 383) {
              const badge = Pokemon(id)
              const registered = items.includes('redorb')
              megaSpritesSet.add({ badge, registered, hold: 'venusaurite' })
              continue
            }
            if (id === 384) {
              const badge = Pokemon(id)
              const registered = items.includes('tm-Dragon Ascent')
              megaSpritesSet.add({ badge, registered, hold: 'venusaurite' })
              continue
            }
            // Any megastone will do
            if (pokemon.mega) {
              const megastone = `${pokemon.species.toLowerCase()}ite` as ItemId
              // const badge = `${badgeId}-mega`
              const badge = Pokemon(id)
              const registered = items.includes(megastone)
              megaSpritesSet.add({ badge, registered, hold: 'venusaurite' })
            }
            if (pokemon.megax) {
              const megastone = `${pokemon.species.toLowerCase()}itex` as ItemId
              // const badge = `${badgeId}-megax`
              const badge = Pokemon(id)
              const registered = items.includes(megastone)
              megaSpritesSet.add({ badge, registered, hold: 'charizarditex' })
            }
            if (pokemon.megay) {
              const megastone = `${pokemon.species.toLowerCase()}itey` as ItemId
              // const badge = `${badgeId}-megay`
              const badge = Pokemon(id)
              const registered = items.includes(megastone)
              megaSpritesSet.add({ badge, registered, hold: 'charizarditey' })
            }
            if (id % 50 === 0) {
              // Take a step back
              await this.yieldToMain()
            }
          }
          const megaSprites = [...megaSpritesSet]
          this.living[livingIndex++] = {
            label: 'Mega Evolutions',
            total: megaSprites.length,
            count: megaSprites.filter(r => r.registered).length,
            sprites: megaSprites,
            emoji: '',
          }
          await this.yieldToMain()

          // GMax
          const gmaxSpritesSet = new Set<Sprite>()
          for (const [badgeId, pokemon] of ObjectEntries(Pkmn.datastore)) {
            const id = parseInt(badgeId.substring(5))
            if (pokemon.gmax) {
              const registered = Badge.quickMatch(id, {}, keys)
              gmaxSpritesSet.add({ badge: Pokemon(id), registered, hold: 'maxmushroom' })
            }
            if (id % 50 === 0) {
              // Take a step back
              await this.yieldToMain()
            }
          }
          const gmaxSprites = [...gmaxSpritesSet]
          this.living[livingIndex++] = {
            label: 'Gigantamax',
            total: gmaxSprites.length,
            count: gmaxSprites.filter(r => r.registered).length,
            sprites: gmaxSprites,
            emoji: '',
          }
          await this.yieldToMain()
        }, LAZY_LOAD_MS) // Jump to tab, then run.
        break;
      case 2: // Shiny Dex
        if (this.shiny.length > 0) return // Already done
        setTimeout(async () => {
          const tasks = regions.slice(1, this.maxRegions+1).map(r => () => {
            const sprites = this.getSprites(r.range, 'shiny', this.userPokemon)
            return {
              label: r.label,
              total: r.total,
              count: sprites.filter(r => r.registered).length,
              sprites,
              emoji: this.getRegionEmoji(r, sprites.filter(r => r.registered).length)
            }
          })
          // Provide empty to start with
          this.shiny = regions.slice(1, this.maxRegions+1).map(r => {
            return {
              label: r.label,
              total: r.total,
              count: 0,
              sprites: [],
              emoji: '',
            }
          })
          this.shiny.push({
            label: 'Forms',
            total: 0,
            count: 0,
            sprites: [],
            emoji: '',
          })
          // this.shiny.push({
          //   label: 'Mega Evolutions',
          //   total: 0,
          //   count: 0,
          //   sprites: [],
          //   emoji: '',
          // })
          let shinyIndex = 0
          while (tasks.length > 0) {
            const task = tasks.shift()
            const res = task()
            this.shiny[shinyIndex++] = res
            await this.yieldToMain()
          }

          // Shiny Dex+
          for (const regionalForm of regionalForms) {
            const formSpritesSet = new Set<Sprite>()
            const keys = Object.keys(this.userPokemon) as PokemonId[]
            for (const [badgeId, pokemon] of ObjectEntries(Pkmn.datastore)) {
              const id = parseInt(badgeId.substring(5))
              let badge;
              if (pokemon.syncableForms) {
                for (const form of pokemon.syncableForms) {
                  if (form !== regionalForm) continue
                  badge = Pokemon(id, {form})
                  this.processVariantSprite(formSpritesSet, keys, id, {form, shiny: true})
                }
              }
              if (id % 50 === 0) {
                // Take a step back
                await this.yieldToMain()
              }
            }
            const formSprites = [...formSpritesSet]
            this.shiny[shinyIndex++] = {
              label: `${regionalForm.substring(0, 1).toUpperCase()}${regionalForm.substring(1)} Forms`,
              total: formSprites.length,
              count: formSprites.filter(r => r.registered).length,
              sprites: formSprites,
              emoji: '',
            }
            await this.yieldToMain()
          }

          // All other possible forms
          const formSpritesSet = new Set<Sprite>()
          const keys = Object.keys(this.userPokemon) as PokemonId[]
          for (const [badgeId, pokemon] of ObjectEntries(Pkmn.datastore)) {
            const id = parseInt(badgeId.substring(5))
            let badge;
            if (pokemon.syncableForms) {
              for (const form of pokemon.syncableForms) {
                if (regionalForms.includes(form)) continue
                badge = Pokemon(id, {form, shiny: true})
                this.processVariantSprite(formSpritesSet, keys, id, {form, shiny: true})
              }
            }
            if (id % 50 === 0) {
              // Take a step back
              await this.yieldToMain()
            }
          }
          const formSprites = [...formSpritesSet]
          this.shiny[shinyIndex++] = {
            label: 'Forms',
            total: formSprites.length,
            count: formSprites.filter(r => r.registered).length,
            sprites: formSprites,
            emoji: '',
          }
          await this.yieldToMain()

          // Megas
          const megaSpritesSet = new Set<Sprite>()
          const items = Object.keys(this.userItems) as ItemId[]
          for (const [badgeId, pokemon] of ObjectEntries(Pkmn.datastore)) {
            const id = parseInt(badgeId.substring(5))
            if (id === 382) {
              const badge = Pokemon(id, {shiny: true})
              const registered = items.includes('blueorb') && Badge.quickMatch(id, {shiny: true}, keys)
              megaSpritesSet.add({ badge, registered, hold: 'venusaurite' })
              continue
            }
            if (id === 383) {
              const badge = Pokemon(id, {shiny: true})
              const registered = items.includes('redorb') && Badge.quickMatch(id, {shiny: true}, keys)
              megaSpritesSet.add({ badge, registered, hold: 'venusaurite' })
              continue
            }
            if (id === 384) {
              const badge = Pokemon(id, {shiny: true})
              const registered = items.includes('tm-Dragon Ascent') && Badge.quickMatch(id, {shiny: true}, keys)
              megaSpritesSet.add({ badge, registered, hold: 'venusaurite' })
              continue
            }
            // Any megastone will do
            if (pokemon.mega) {
              const megastone = `${pokemon.species.toLowerCase()}ite` as ItemId
              // const badge = `${badgeId}-mega`
              const badge = Pokemon(id, {shiny: true})
              const registered = items.includes(megastone) && Badge.quickMatch(id, {shiny: true}, keys)
              megaSpritesSet.add({ badge, registered, hold: 'venusaurite' })
            }
            if (pokemon.megax) {
              const megastone = `${pokemon.species.toLowerCase()}itex` as ItemId
              // const badge = `${badgeId}-megax`
              const badge = Pokemon(id, {shiny: true})
              const registered = items.includes(megastone) && Badge.quickMatch(id, {shiny: true}, keys)
              megaSpritesSet.add({ badge, registered, hold: 'charizarditex' })
            }
            if (pokemon.megay) {
              const megastone = `${pokemon.species.toLowerCase()}itey` as ItemId
              // const badge = `${badgeId}-megay`
              const badge = Pokemon(id, {shiny: true})
              const registered = items.includes(megastone) && Badge.quickMatch(id, {shiny: true}, keys)
              megaSpritesSet.add({ badge, registered, hold: 'charizarditey' })
            }
            if (id % 50 === 0) {
              // Take a step back
              await this.yieldToMain()
            }
          }
          const megaSprites = [...megaSpritesSet]
          this.shiny[shinyIndex++] = {
            label: 'Mega Evolutions',
            total: megaSprites.length,
            count: megaSprites.filter(r => r.registered).length,
            sprites: megaSprites,
            emoji: '',
          }
          await this.yieldToMain()

          // GMax
          const gmaxSpritesSet = new Set<Sprite>()
          for (const [badgeId, pokemon] of ObjectEntries(Pkmn.datastore)) {
            const id = parseInt(badgeId.substring(5))
            if (pokemon.gmax) {
              const registered = Badge.quickMatch(id, {shiny: true}, keys)
              gmaxSpritesSet.add({ badge: Pokemon(id, {shiny: true}), registered, hold: 'maxmushroom' })
            }
            if (id % 50 === 0) {
              // Take a step back
              await this.yieldToMain()
            }
          }
          const gmaxSprites = [...gmaxSpritesSet]
          this.shiny[shinyIndex++] = {
            label: 'Gigantamax',
            total: gmaxSprites.length,
            count: gmaxSprites.filter(r => r.registered).length,
            sprites: gmaxSprites,
            emoji: '',
          }
        }, LAZY_LOAD_MS)
        break;
      case 3: // Unown
        if (this.unown.sprites.length > 0) return // Already done
        setTimeout(() => {
          const unownSprites = this.getUnownSprites(this.userPokemon)
          this.unown = {
            label: 'Unown',
            total: 28,
            count: unownSprites.filter(r => r.registered).length,
            sprites: unownSprites,
            emoji: ''
          }
        }, LAZY_LOAD_MS)
        break;
      case 4: // Variants
        if (this.variants.sprites.length > 0) return // Already done
        setTimeout(async () => {
          const variantSprites = await this.getVariantSprites(this.userPokemon)
          this.variants = {
            label: 'Variants',
            total: variantSprites.size,
            count: [...variantSprites].filter(r => r.registered).length,
            sprites: [...variantSprites],
            emoji: '',
          }
        }, LAZY_LOAD_MS)
        break;
      case 5: // Moves
        this.hasMoves()
        break;
      case 6: // Berries
        this.hasBerries()
        break;
      case 7: // Cooking
        this.hasCooking()
        break;
    }
  }

  showLevelUpDialog(charmsAdded: string[]) {
    // No shiny charm dialog right now
    if (charmsAdded.length === 1 && charmsAdded[0] === SHINY_CHARM) return

    const questsForLevel = (level: string) => {
      let arr: string[] = []
      arr.push(...KEY_ITEM_QUESTS.filter(q => q.gate === level).map(x => x.title))
      arr.push(...LEGENDARY_ITEM_QUESTS.filter(q => q.gate === level).map(x => x.title))
      return arr
    }

    for (const charm of charmsAdded) {
      if (charm === SHINY_CHARM) continue
      // else get charm data directly from Pokedex Quests
      const charmData = POKEDEX_QUESTS.find(x => x.docId === charm) as PokedexQuest
      if (!charmData) continue // Okay
      this.dialog = {
        title: charmData.title,
        sprite: charmData.sprite,
        modes: charmData.modes,
        nextQuests: questsForLevel(charmData.docId),
      }
      // If the dialog would be empty, do not show a dialog!
      this.charmDialog.nativeElement!.showModal()
      break // If the user has gotten many catch charms, that's too bad
    }
  }

  close() {
    this.charmDialog.nativeElement!.close()
  }

  async pullPokedexSprites() {
    if (this.pokedexBadges.length) return this.pokedexBadges // Cache!
    try {
      const res = await this.firebase.exec<F.UserPokedex.Req, F.UserPokedex.Res>('user_pokedex')
      if (res.data.charmsAdded.length) {
        this.showLevelUpDialog(res.data.charmsAdded)
      }
      this.pokedexBadges = [...Object.values(res.data).flat()] as number[]
    } catch (e) {
      console.error(e)
      this.snackbar.open(`Cannot read your PokéDex registrations: ${e}`, '', {duration: 5000})
    }
    return []
  }

  getPokedexSprites(range: [number, number], region: string) {
    const sprites: Sprite[] = []
    for (let i = range[0]; i <= range[1]; i++) {
      sprites.push({
        badge: Pokemon(i),
        registered: this.pokedexBadges.includes(i),
      })
    }
    return sprites
  }

  getSprites(range: [number, number], filter: 'living' | 'shiny', pokemon: TPokemon) {
    const sprites: Sprite[] = []
    const keys = Object.keys(pokemon) as PokemonId[]

    for (let i = range[0]; i <= range[1]; i++) {
      let registered = false
      const badge = new Badge(Pokemon(i))
      if (filter === 'living') {
        registered = Badge.quickMatch(i, {}, keys)
      } else if (filter === 'shiny') {
        badge.personality.shiny = true
        registered = Badge.quickMatch(i, {shiny: true}, keys)
      }
      sprites.push({
        badge: badge.toString(),
        registered,
      })
    }
    return sprites
  }

  getUnownSprites(pokemon: TPokemon) {
    const forms = Pkmn.get('potw-201')!.syncableForms!.slice(0, 28)
    const keys = Object.keys(pokemon) as PokemonId[]
    const sprites: Sprite[] = []
    forms!.forEach(form => {
      const badge = Pokemon(201, {form})
      sprites.push({
        badge,
        registered: Badge.quickMatch(201, {form}, keys)
      })
    })
    return sprites
  }

  processVariantSprite(sprites: Set<Sprite>, keys: PokemonId[], id: number, personality: Partial<Personality>) {
    const registered = Badge.quickMatch(id, personality, keys)
    const badge = Pokemon(id, personality)
    const alreadyAdded = [...sprites].map(s => s.badge).includes(badge)
    if (!alreadyAdded) {
      sprites.add({badge, registered})
    }
  }

  async getVariantSprites(pokemon: TPokemon) {
    const sprites: Set<Sprite> = new Set()
    const keys = Object.keys(pokemon) as PokemonId[]

    for (const [badgeId, pokemon] of ObjectEntries(Pkmn.datastore)) {
      if (!pokemon.novelMoves || !pokemon.novelMoves.length) continue;
      // Skip var0 Pokémon
      const [potw, dexno, misc] = badgeId.split('-')
      if (misc) continue; // Skip forms and genders since they'll be handled.
      for (let i = 1; i < pokemon.novelMoves.length; i++) {
        const id = parseInt(dexno)
        let badge;
        if (pokemon.gender) {
          for (const gender of new Set(pokemon.gender)) {
            badge = Pokemon(id, {gender: gender as PokemonGender, variant: i})
            this.processVariantSprite(sprites, keys, id, {gender: gender as PokemonGender, variant: i})
            // badge = Pokemon(id, {gender: gender as PokemonGender, variant: i, shiny: true})
            // this.processVariantSprite(sprites, keys, badge)
          }
        }
        if (pokemon.syncableForms) {
          badge = Pokemon(id, {variant: i}) // Empty-case
          this.processVariantSprite(sprites, keys, id, {variant: i})
          for (const form of pokemon.syncableForms) {
            badge = Pokemon(id, {form, variant: i})
            if (id === 479) {
              console.debug(badge)
            }
            this.processVariantSprite(sprites, keys, id, {form, variant: i})
            // badge = Pokemon(id, {form, variant: i, shiny: true})
            // this.processVariantSprite(sprites, keys, badge)
          }
        } else {
          badge = Pokemon(id, {variant: i})
          this.processVariantSprite(sprites, keys, id, {variant: i})
          // badge = Pokemon(id, {variant: i, shiny: true})
          // this.processVariantSprite(sprites, keys, badge)
        }
        // 6000pkmn -> ~80s, 75pkmn/s
        if (id % 75 === 0) {
          // Take a step back
          await this.yieldToMain()
        }
      }
    }

    return sprites
  }

  hasMoves() {
    if (!this.userPokemon) return
    const moveBool: Partial<Record<MoveId, boolean>> = {}
    for (const [key] of Object.entries(this.userPokemon)) {
      const badge = new Badge(key)
      const pkmn = Pkmn.get(badge.toLegacyString())
      pkmn.move.forEach(m => moveBool[m] = true)
    }
    for (let i = 0; i < this.moves.length; i++) {
      this.moves[i].registered = moveBool[this.moves[i].name] ?? false
    }
  }

  hasBerries() {
    if (!this.userItems) return
    for (let i = 0; i < this.berries.length; i++) {
      const {name} = this.berries[i]
      if (this.userItems[name]) {
        this.berries[i].registered = true
      }
    }
  }

  hasCooking() {
    if (!this.userItems) return
    for (let i = 0; i < this.cooking.length; i++) {
      const {name} = this.cooking[i]
      if (this.userItems[name]) {
        this.cooking[i].registered = true
      }
    }
  }
}
