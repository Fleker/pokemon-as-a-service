import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';
import { BAZAAR, ITEMS, ItemId } from '../../../../shared/src/items-list'
import { FirebaseService } from './firebase.service';
import { Users } from '../../../../shared/src/server-types';
import { pkmn, item } from '../../../../shared/src/sprites';
import { Badge } from '../../../../shared/src/badge3';
import { myPokemon } from '../../../../shared/src/badge-inflate';

export interface OmniRes {
  url: string
  label: string
  sublabel?: string
  keywords: string[]
  /** Using mat-icon */
  svgIcon?: string
  /** Using mat-icon */
  icon?: string
  /** Using img */
  sprite?: string
}

@Injectable({
  providedIn: 'root'
})
export class KeyboardService {
  enableOmniSearch = true
  enableNavigation = true

  omniSearchListener = new Subject<boolean>()
  allSearchOptions: OmniRes[] = []

  constructor(
    private router: Router,
    private firebase: FirebaseService,
  ) {}

  init() {
    this.firebase.subscribeUser(user => {
      if (user) {
        this.generateSearchOptions(user)
      }
    })
    document.addEventListener('keyup', (e: KeyboardEvent) => {
      const {code} = e
      console.debug('keyvent', e.code, e.shiftKey, e.ctrlKey, e)
      if (e.target['className'].includes('omnisearchinput')) {
        if (e.code === 'ArrowDown') {
          console.log(document.querySelector('#omnisearchres li'))
          document.querySelector('#omnisearchres li')['focus']()
        }
        // FIXME: This is the wrong list
        //    also: does not close
        if (e.key === '1' && e.ctrlKey) {
          this.router.navigate([this.allSearchOptions[0].url])
        }
        if (e.key === '2' && e.ctrlKey) {
          this.router.navigate([this.allSearchOptions[1].url])
        }
        if (e.key === '3' && e.ctrlKey) {
          this.router.navigate([this.allSearchOptions[2].url])
        }
        if (e.key === '4' && e.ctrlKey) {
          this.router.navigate([this.allSearchOptions[3].url])
        }
        if (e.key === '5' && e.ctrlKey) {
          this.router.navigate([this.allSearchOptions[4].url])
        }
        e.preventDefault()
        return null;
      }
      if (e.target['className'].includes('omnisearchli')) {
        if (e.key === 'Enter') {
          e.target['click']()
          e.preventDefault()
        } else {
          document.querySelector('.omnisearchinput')['focus']()
          // document.querySelector('.omnisearchinput')['dispatchEvent'](new KeyboardEvent('keyup', {
          //   code: e.code,
          //   key: e.key,
          //   shiftKey: e.shiftKey,
          //   ctrlKey: e.ctrlKey,
          // }))
          document.querySelector('.omnisearchinput')['value'] += e.key
        }
      }
      if (e.target['nodeName'] === 'INPUT') return null;
      // Ctrl+G opens the OmniSearch
      if (code == 'KeyG' && e.shiftKey && this.enableOmniSearch) {
        this.omniSearchListener.next(true)
        e.preventDefault()
      }
      if (this.enableNavigation && e.shiftKey) {
        switch (code) {
          case 'KeyP':
            return this.router.navigate(['/pokemon/collection'])
          case 'KeyE':
            return this.router.navigate(['/pokemon/eggs'])
          // case 'KeyR':
          //   return this.router.navigate(['/pokemon/release'])
          case 'KeyC':
            return this.router.navigate(['/pokemon/catch'])
          case 'KeyT':
            return this.router.navigate(['/pokemon/tutor'])
          case 'KeyD':
            return this.router.navigate(['/multiplayer/daycare'])
          case 'KeyB':
            return this.router.navigate(['/multiplayer/battle'])
          case 'KeyR':
            return this.router.navigate(['/multiplayer/raids'])
          case 'KeyV':
            return this.router.navigate(['/multiplayer/voyages'])
          case 'KeyQ':
            return this.router.navigate(['/base/quests'])
          case 'KeyA':
            return this.router.navigate(['/base/achievements'])
          case 'KeyF':
            return this.router.navigate(['/base/farm'])
        }
        e.preventDefault()
      }
      return null;
    })
  }

  // Notes to change in the future:
  //  Add sprite/icon
  //  Add a subtitle for things like Pokemon IDs
  //  Use keyboard to navigate results
  //  Add a keyboard option to navigation to quick-jump to pages
  generateSearchOptions(user: Users.Doc) {
    const allSearchOptions: OmniRes[] = [{
      label: 'Pokémon',
      url: '/pokemon/collection',
      keywords: ['pokemon', 'collection', 'pokémon'],
      svgIcon: 'menu-pokeball',
      sublabel: '/pokemon/collection Shift+P',
    }, {
      label: 'Eggs',
      url: '/pokemon/eggs',
      keywords: ['eggs', 'hatch'],
      svgIcon: 'menu-egg',
      sublabel: '/pokemon/eggs Shift+E',
    }, {
      label: 'Bank',
      url: '/pokemon/bank',
      keywords: ['bank', 'cold storage'],
      svgIcon: 'menu-bank',
      sublabel: '/pokemon/bank'
    }, {
      label: 'Release',
      url: '/pokemon/release',
      keywords: ['release'],
      svgIcon: 'menu-release',
      sublabel: '/pokemon/release',
    }, {
      label: 'Pokédex',
      url: '/pokemon/pokedex',
      keywords: ['pokedex', 'pokédex', 'dex', 'shiny dex'],
      svgIcon: 'menu-pokedex',
      sublabel: '/pokemon/pokedex',
    }, {
      label: 'Catch',
      url: '/pokemon/catch',
      keywords: ['catch', 'encounters', 'lure', 'bait'],
      svgIcon: 'menu-encounters',
      sublabel: '/pokemon/catch',
    }, {
      label: 'Move Deleter',
      url: '/pokemon/deleter',
      keywords: ['deleter', 'move deleter', 'varundefined'],
      svgIcon: 'menu-deleter',
      sublabel: '/pokemon/deleter',
    }, {
      label: 'Move Tutor',
      url: '/pokemon/tutor',
      keywords: ['move tutor', 'var3', 'var6'],
      svgIcon: 'menu-tutor',
      sublabel: '/pokemon/tutor',
    }, {
      label: 'Bag',
      url: '/items/bag',
      keywords: ['bag', 'inventory'],
      svgIcon: 'menu-bag',
      sublabel: '/items/bag',
    }, {
      label: 'Mart',
      url: '/items/mart',
      keywords: ['mart', 'purchase', 'buy', 'sell'],
      svgIcon: 'menu-mart',
      sublabel: '/items/mart',
    }, {
      label: 'Bazaar',
      url: '/items/bazaar',
      keywords: ['bazaar'],
      svgIcon: 'menu-bazaar',
      sublabel: '/items/bazaar',
    }, {
      label: 'Craft',
      url: '/items/crafting',
      keywords: ['craft'],
      svgIcon: 'menu-crafting',
      sublabel: '/items/crafting',
    }, {
      label: 'Day Care',
      url: '/multiplayer/nursery',
      keywords: ['day care', 'nursery', 'daycare', 'breed'],
      svgIcon: 'menu-daycare',
      sublabel: '/multiplayer/nursery Shift+D',
    }, {
      label: 'Global Trade System',
      url: '/multiplayer/gts',
      keywords: ['trade', 'gts', 'global trade system'],
      svgIcon: 'menu-gts',
      sublabel: '/multiplayer/gts',
    }, {
      label: 'Wonder Trade',
      url: '/multiplayer/wonder',
      keywords: ['wonder', 'random', 'wonder trade', 'trade'],
      svgIcon: 'menu-wonder',
      sublabel: '/multiplayer/wonder',
    }, {
      label: 'Private Trade',
      url: '/multiplayer/trade',
      keywords: ['trade', 'private trade', 'players'],
      svgIcon: 'menu-trade',
      sublabel: '/multiplayer/trade',
    }, {
      label: 'Battle Stadium',
      url: '/multiplayer/battle',
      keywords: ['battle', 'stadium', 'prizes'],
      svgIcon: 'menu-battle',
      sublabel: '/multiplayer/battle',
    }, {
      label: 'Raids',
      url: '/multiplayer/raids',
      keywords: ['raids', 'multiplayer'],
      svgIcon: 'menu-raids',
      sublabel: '/multiplayer/raids Shift+R',
    }, {
      label: 'Voyages',
      url: '/multiplayer/voyages',
      keywords: ['adventures', 'voyages', 'journeys'],
      svgIcon: 'menu-voyages',
      sublabel: '/multiplayer/voyages Shift+V',
    }, {
      label: 'Game Corner',
      url: '/base/gamecorner',
      keywords: ['prizes', 'game corner', 'lottery'],
      svgIcon: 'menu-games',
      sublabel: '/base/gamecorner',
    }, {
      label: 'Berry Farm',
      url: '/base/farm',
      keywords: ['farm', 'farming', 'berries', 'berry', 'plant'],
      svgIcon: 'menu-farm',
      sublabel: '/base/farm Shift+F',
    }, {
      label: 'Quests',
      url: '/base/quests',
      keywords: ['quests', 'legendary', 'key items', 'missions'],
      svgIcon: 'menu-quests',
      sublabel: '/base/quests Shift+Q',
    }, {
      label: 'Achievements',
      url: '/base/achievements',
      keywords: ['achievements', 'trophies', 'nfts'],
      svgIcon: 'menu-achievements',
      sublabel: '/base/achievements Shift+A',
    }, {
      label: 'Research',
      url: '/base/research',
      keywords: ['research', 'quests'],
      svgIcon: 'menu-research',
      sublabel: '/base/research',
    }, {
      label: 'Trainer Card',
      url: '/profile/trainer',
      keywords: ['trainer', 'card', 'record', 'close account', 'delete account', 'year in review'],
      svgIcon: 'menu-trainer',
      sublabel: '/profile/trainer',
    }, {
      label: 'Help',
      url: '/help',
      keywords: ['help', 'about'],
      svgIcon: 'menu-about',
      sublabel: '/help',
    }, {
      label: 'Chat',
      url: '/chat',
      keywords: ['PokéGear', 'pokegear', 'chatbot', 'llm', 'help', 'in-game help'],
      svgIcon: 'menu-pokegear',
      sublabel: '/chat',
    }, {
      label: 'Professor Oak',
      url: '/chat',
      keywords: ['professor oak', 'chatbot', 'llm', 'in-game help'],
      svgIcon: 'menu-pokegear',
      sublabel: '/chat',
    }]
    for (const stall of Object.values(BAZAAR)) {
      allSearchOptions.push({
        label: stall.name,
        url: '/items/bazaar',
        keywords: [...stall.name.toLowerCase().split(' '), 'bazaar', stall.currency],
        icon: stall.icon,
        sublabel: 'Bazaar Stall',
      })
    }
    setTimeout(() => {
      for (const [key, value] of myPokemon(user.pokemon)) {
        try {
          const badge = new Badge(key)
          allSearchOptions.push({
            label: `${badge.toLabel()} x${value}`,
            url: '/pokemon/collection',
            keywords: [badge.toLabel().toLowerCase(), 'pokemon', badge.toString()],
            sprite: pkmn(badge.toSprite()),
            sublabel: key,
          })
        } catch (e) {
          console.error(`Cannot generate search option for ${key}: ${e}`)
        }
      }
      for (const [key, value] of Object.entries(user.items)) {
        try {
          const itemDb = ITEMS[key]
          allSearchOptions.push({
            label: `${itemDb.label} x${value}`,
            url: '/items/bag',
            keywords: [itemDb.label.toLowerCase().split(' '), itemDb.label.toLowerCase(), itemDb.category, 'item', 'inventory', key],
            sprite: item(key as ItemId),
            sublabel: key,
          })
        } catch (e) {
          console.error(`Cannot generate search option for ${key}: ${e}`)
        }
      }
      this.allSearchOptions = allSearchOptions
    }, 17)
  }

  runSearch(query: string) {
    return this.allSearchOptions.filter(x =>
      x.keywords.filter(key => key.includes(query.toLowerCase())).length > 0)
      .slice(0, 20)
  }
}
