import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface OmniRes {
  url: string
  label: string
  keywords: string[]
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
  enableNavigation = false

  omniSearchListener = new Subject<boolean>()
  allSearchOptions: OmniRes[] = []

  constructor() {}

  init() {
    setTimeout(() => {
      // Async operation
      this.generateSearchOptions()
    }, 0)
    document.addEventListener('keyup', (e: KeyboardEvent) => {
      const {code} = e
      console.debug('keyvent', e.code, e.shiftKey, e.ctrlKey, e)
      if (e.target['nodeName'] === 'INPUT') return
      // Ctrl+G opens the OmniSearch
      if (code == 'KeyG' && e.shiftKey && this.enableOmniSearch) {
        this.omniSearchListener.next(true)
        e.preventDefault()
      }
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
    }, {
      label: 'Eggs',
      url: '/pokemon/eggs',
      keywords: ['eggs', 'hatch'],
    }, {
      label: 'Bank',
      url: '/pokemon/bank',
      keywords: ['bank', 'cold storage'],
    }, {
      label: 'Release',
      url: '/pokemon/release',
      keywords: ['release'],
    }, {
      label: 'Pokédex',
      url: '/pokemon/pokedex',
      keywords: ['pokedex', 'pokédex', 'dex', 'shiny dex'],
    }, {
      label: 'Catch',
      url: '/pokemon/catch',
      keywords: ['catch', 'encounters', 'lure', 'bait'],
    }, {
      label: 'Move Deleter',
      url: '/pokemon/deleter',
      keywords: ['deleter', 'move deleter', 'varundefined'],
    }, {
      label: 'Move Tutor',
      url: '/pokemon/tutor',
      keywords: ['move tutor', 'var3', 'var6'],
    }, {
      label: 'Bag',
      url: '/items/bag',
      keywords: ['bag', 'inventory'],
    }, {
      label: 'Mart',
      url: '/items/mart',
      keywords: ['mart', 'purchase', 'buy', 'sell'],
    }, {
      label: 'Bazaar',
      url: '/items/bazaar',
      keywords: ['bazaar'],
    }, {
      label: 'Craft',
      url: '/items/crafting',
      keywords: ['craft'],
    }, {
      label: 'Day Care',
      url: '/multiplayer/nursery',
      keywords: ['day care', 'nursery', 'daycare', 'breed'],
    }, {
      label: 'Global Trade System',
      url: '/multiplayer/gts',
      keywords: ['trade', 'gts', 'global trade system'],
    }, {
      label: 'Wonder Trade',
      url: '/multiplayer/wonder',
      keywords: ['wonder', 'random', 'wonder trade', 'trade'],
    }, {
      label: 'Private Trade',
      url: '/multiplayer/trade',
      keywords: ['trade', 'private trade', 'players'],
    }, {
      label: 'Battle Stadium',
      url: '/multiplayer/battle',
      keywords: ['battle', 'stadium', 'prizes'],
    }, {
      label: 'Raids',
      url: '/multiplayer/raids',
      keywords: ['raids', 'multiplayer'],
    }, {
      label: 'Voyages',
      url: '/multiplayer/voyages',
      keywords: ['adventures', 'voyages', 'journeys'],
    }, {
      label: 'Game Corner',
      url: '/base/gamecorner',
      keywords: ['prizes', 'game corner', 'lottery'],
    }, {
      label: 'Berry Farm',
      url: '/base/farm',
      keywords: ['farm', 'farming', 'berries', 'berry', 'plant'],
    }, {
      label: 'Quests',
      url: '/base/quests',
      keywords: ['quests', 'legendary', 'key items', 'missions'],
    }, {
      label: 'Achievements',
      url: '/base/achievements',
      keywords: ['achievements', 'trophies', 'nfts'],
    }, {
      label: 'Research',
      url: '/base/research',
      keywords: ['research', 'quests'],
    }, {
      label: 'Trainer Card',
      url: '/profile/trainer',
      keywords: ['trainer', 'card', 'record', 'close account', 'delete account', 'year in review']
    }, {
      label: 'Help',
      url: '/help',
      keywords: ['help', 'about'],
    }, {
      label: 'Chat',
      url: '/chat',
      keywords: ['PokéGear', 'pokegear', 'chatbot', 'llm', 'help', 'in-game help'],
    }, {
      label: 'Professor Oak',
      url: '/chat',
      keywords: ['professor oak', 'chatbot', 'llm', 'in-game help'],
    }]
    this.allSearchOptions = allSearchOptions
  }

  runSearch(query: string) {
    return this.allSearchOptions.filter(x =>
      x.keywords.filter(key => key.includes(query.toLowerCase())).length > 0)
      .slice(0, 20)
  }
}
