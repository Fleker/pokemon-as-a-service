import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';
import { BAZAAR } from '../../../../shared/src/items-list'

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
    private router: Router
  ) {}

  init() {
    setTimeout(() => {
      // Async operation
      this.generateSearchOptions()
    }, 0)
    document.addEventListener('keyup', (e: KeyboardEvent) => {
      const {code} = e
      console.debug('keyvent', e.code, e.shiftKey, e.ctrlKey, e)
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
  //  Improve dynamism. Put all bazaar labels into Bazaar keywords
  //  Add a subtitle for things like Pokemon IDs
  //  Use keyboard to navigate results
  //  Add a keyboard option to navigation to quick-jump to pages
  generateSearchOptions() {
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
        keywords: [...stall.name.split(' '), 'bazaar', stall.currency],
        icon: stall.icon,
        sublabel: 'Bazaar Stall',
      })
    }
  }

  runSearch(query: string) {
    return this.allSearchOptions.filter(x =>
      x.keywords.filter(key => key.includes(query.toLowerCase())).length > 0)
      .slice(0, 20)
  }
}
