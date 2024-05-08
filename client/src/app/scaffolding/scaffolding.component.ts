/**
 * @fileoverview Main Angular module laying out the content on the page.
 *
 * Equivalent to the earlier 'my-app.js'
 */
import { AfterViewInit, OnDestroy } from '@angular/core';
import { ElementRef, ViewChild } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { Badge } from '../../../../shared/src/badge3';
import { datastore, get } from '../../../../shared/src/pokemon';
import { babyProduced } from '../../../../shared/src/platform/breeding-club';
import { PokemonEntries } from '../../../../shared/src/pokemon-entries';
import { PokemonId } from '../../../../shared/src/pokemon/types';
import { CATCH_CHARM_DPPT, CATCH_CHARM_GSC, CATCH_CHARM_RBY, CATCH_CHARM_RSE, CATCH_CHARM_XY, COMMUNITY_ACHIEVEMENTS, LEGENDARY_ITEM_QUESTS, ONEP_ACHIEVEMENTS, POKEDOLL } from '../../../../shared/src/quests';
import { ACTIVE_RESEARCH } from '../../../../shared/src/research';
import { Users } from '../../../../shared/src/server-types';
import { MassiveOutbreaks, Swarms } from '../../../../shared/src/platform/swarms';
import { ManagerService } from '../dialogs/manager.service';
import { FirebaseService } from '../service/firebase.service';
import { forecastBoss, regionBoss, standardBosses, terrainBoss, timeBoss } from '../../../../shared/src/raid-bosses';
import { AchievementEvent, AchievementsService } from '../service/achievements.service';
import { ENCOUNTER_MAP, ENCOUNTER_CONDITION, HOLD_ITEMS } from '../../../../shared/src/gen/encounter-map';
import { FriendSafariMap } from '../../../../shared/src/friend-safari';
import { BAZAAR, ITEMS } from '../../../../shared/src/items-list';
import { MatDrawerMode } from '@angular/material/sidenav';
import { Globe, Location, LocationId } from '../../../../shared/src/locations-list';
import { Voyages } from '../../../../shared/src/voyages';
import { Recipes } from '../../../../shared/src/crafting';
import { EngagementService } from '../engagement.service';
import { LocationService } from '../service/location.service';
import { KeyboardService } from '../service/keyboard.service';
import { MoveTypeMap, SupportMoves } from '../../../../shared/src/gen/type-move-meta';
import randomItem from '../../../../shared/src/random-item';
import { FeedbackService } from '../service/feedback-service.service';
import * as BNatures from '../../../../shared/src/battle/natures'
import * as BMovepool from '../../../../shared/src/battle/movepool'
import * as BController from '../../../../shared/src/battle/battle-controller'
import * as BConditions from '../../../../shared/src/battle/conditions'
import * as BInventory from '../../../../shared/src/battle/inventory'
import * as BMatchup from '../../../../shared/src/battle/matchup'
import * as BStatus from '../../../../shared/src/battle/status'
import * as BTerrain from '../../../../shared/src/battle/terrain'
import * as BType from '../../../../shared/src/battle/typeMultiplier'
import * as BWeather from '../../../../shared/src/battle/weather'
import * as BTypes from '../../../../shared/src/battle/types'
import { raidBattleSettings } from '../../../../shared/src/raid-settings'
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from "@angular/platform-browser";
import { myPokemon } from '../../../../shared/src/badge-inflate';
declare var window: any;

interface Gate {
  kanto: boolean
  johto: boolean
  hoenn: boolean
  sinnoh: boolean
  kalos: boolean
  farm: boolean
  bank: boolean
  eggs: boolean
  raids: boolean
  craft: boolean
  voyages: boolean
}

interface OmniRes {
  url: string
  label: string
}

@Component({
  selector: 'app-scaffolding',
  templateUrl: './scaffolding.component.html',
  styleUrls: ['./scaffolding.component.css']
})
export class ScaffoldingComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('drawer') drawer?: ElementRef
  @ViewChild('refresh') refresh?: ElementRef
  @ViewChild('dialog') dialogPokedex?: ElementRef
  @ViewChild('ddex') ddex?: ElementRef
  @ViewChild('movedialog') movedialog?: ElementRef
  @ViewChild('dmove') dmove?: ElementRef
  @ViewChild('omnisearch') omni?: ElementRef
  @ViewChild('atoast') atoast?: ElementRef<HTMLDivElement>
  firestoreManual: boolean = false
  buddy?: PokemonId
  buddyEmotion = ''
  drawerOpen?: string = 'true'
  drawerMode?: MatDrawerMode = 'side'
  drawerCollapsed = true
  pwaClass = ''
  gate: Gate = {
    kanto: false,
    johto: false,
    hoenn: false,
    sinnoh: false,
    kalos: false,
    farm: false,
    bank: false,
    eggs: false,
    raids: false,
    craft: false,
    voyages: false,
  }
  achievementEvents: AchievementEvent[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  firebaseListener?: any
  engagement: EngagementService
  cronsViolatingSlo: number
  lastUserLocation: LocationId
  location: Location
  locationForecast: string = 'wb_sunny'
  completedUnclaimedRaids = 0
  completedUnclaimedVoyages = 0
  omniSearch = ''
  omniRes: OmniRes[] = []

  get questLabel() {
    const d = new Date()
    if (d.getDate() === 1 && d.getMonth() === 3) return 'NFTs' // April Fools!
    return 'Achievements'
  }

  get completedUnclaimedQuests() {
    return this.achievements.completedUnclaimedQuests
  }

  get completedUnclaimedResearch() {
    return this.achievements.completedUnclaimedResearch
  }

  constructor(
    private firebase: FirebaseService,
    private dialogs: ManagerService,
    private achievements: AchievementsService,
    private locations: LocationService,
    engagement: EngagementService,
    private feedback: FeedbackService,
    private iconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private keyboard: KeyboardService,
  ) {
    this.engagement = engagement
    this.loadCustomIcons()
  }

  ngOnInit(): void {
    /* For scripting convenience */
    window['firebase'] = this.firebase
    window['badge'] = Badge
    window['Badge'] = Badge
    window['Swarms'] = Swarms
    window['MassiveOutbreaks'] = MassiveOutbreaks
    window['babyProduced'] = babyProduced
    window['ACTIVE_RESEARCH'] = ACTIVE_RESEARCH
    window['datastore'] = datastore
    window['datastoreGet'] = get
    window['LEGENDARY_ITEM_QUESTS'] = LEGENDARY_ITEM_QUESTS
    window['ONEP_ACHIEVEMENTS'] = ONEP_ACHIEVEMENTS
    window['COMMUNITY_ACHIEVEMENTS'] = COMMUNITY_ACHIEVEMENTS
    window['HOLD_ITEMS'] = HOLD_ITEMS
    window['ENCOUNTER_MAP'] = ENCOUNTER_MAP
    window['ENCOUNTER_CONDITION'] = ENCOUNTER_CONDITION
    window['ITEMS'] = ITEMS
    window['BAZAAR'] = BAZAAR
    window['FriendSafariMap'] = FriendSafariMap
    window['Globe'] = Globe
    window['Recipes'] = Recipes
    window['Voyages'] = Voyages
    window['MoveTypeMap'] = MoveTypeMap
    window['SupportMoves'] = SupportMoves
    window['bosses'] = {
      regionBoss: regionBoss,
      terrainBoss: terrainBoss,
      standardBosses: standardBosses,
      forecastBoss: forecastBoss,
      timeBoss: timeBoss,
    }
    window['battle'] = {
      natures: BNatures,
      movepool: BMovepool,
      controller: BController,
      conditions: BConditions,
      inventory: BInventory,
      matchup: BMatchup,
      status: BStatus,
      terrain: BTerrain,
      typeMultiplier: BType,
      weather: BWeather,
      types: BTypes,
      raids: raidBattleSettings,
    }
    window['myPokemon'] = myPokemon
    this.firebase.init()
    this.firebaseListener = this.firebase.subscribeUser(async user => {
      if (user) {
        this.firestoreManual = user.settings.disableRealtime
        this.gate.kanto = user.hiddenItemsFound.includes(CATCH_CHARM_RBY)
        this.gate.johto = user.hiddenItemsFound.includes(CATCH_CHARM_GSC)
        this.gate.hoenn = user.hiddenItemsFound.includes(CATCH_CHARM_RSE)
        this.gate.sinnoh = user.hiddenItemsFound.includes(CATCH_CHARM_DPPT)
        this.gate.kalos = user.hiddenItemsFound.includes(CATCH_CHARM_XY)
        this.gate.farm = user.items['berrypouch'] > 0 || this.gate.sinnoh
        this.gate.bank = user.items['pokemonboxlink'] > 0
        this.gate.eggs = user.hiddenItemsFound.includes(CATCH_CHARM_GSC) || user.eggs.length > 0
        this.gate.raids = user.hiddenItemsFound.includes(POKEDOLL)
        this.gate.craft = user.items['craftingkit'] > 0
        this.gate.voyages = user.items['voyagepass'] > 0

        this.cronsViolatingSlo = Object.entries(this.engagement.timingMap)
          .filter(([, v]) => v > 0 && Date.now() - v > 1000 * 60 * 60 * 24 * 7)
          .length
        this.processBuddy(user)
        this.completedUnclaimedRaids = user.notifications ?
          user.notifications.filter(n => n.cat === 'RAID_CLAIM').length
          : 0
        this.completedUnclaimedVoyages = user.notifications ?
          user.notifications.filter(n => n.cat === 'VOYAGE_COMPLETE').length
          : 0
        this.updateTheme(user)
        if (user.settings.flagKeyboard || this.engagement.isNextUi) {
          this.keyboard.init()
          this.keyboard.omniSearchListener.subscribe(shouldOpen => {
            if (!shouldOpen) return
            this.omni.nativeElement!.showModal()
          })
        }
      } else {
        this.firestoreManual = false
      }
      // Apply PWA overlay
      if ('windowControlsOverlay' in navigator && localStorage.getItem('localSetting_overlay') === 'true') {
        // this.pwaClass = 'pwa'
      }
    })
    if (window.innerWidth < 600) {
      this.drawerOpen = 'false'
      this.drawerMode = 'over'
    }
    window.navigator.serviceWorker.register('/assets/cel.js')
    this.feedback.bind(window)
  }

  ngOnDestroy() {
    this.firebaseListener?.unsubscribe()
  }

  ngAfterViewInit() {
    this.dialogs.init(
      this.dialogPokedex!,
      this.ddex!,
      this.movedialog!,
      this.dmove!,
    )
    this.achievements.attach(this.atoast, this.achievementEvents)
  }

  /**
   * Gets the first buddy by sorted Pokemon map.
   * @param user User doc
   * @returns
   */
  processBuddy(user: Users.Doc) {
    this.buddy = undefined
    for (const [key] of PokemonEntries(user.pokemon)) {
      const b = new Badge(key)
      if (b.defaultTags?.includes('BUDDY')) {
        this.buddy = key
        this.buddyEmotion = randomItem(['😀', '😁', '😆', '🙃', '😊', '🤨'])
        console.debug('You have a buddy!', key)
        return
      }
    }
  }

  async refreshUser() {
    await this.firebase.refreshUser()
  }

  async logout() {
    await this.firebase.logout()
    window.location.href = 'https://pokemon.com' // Bye
  }

  loadCustomIcons() {
    const icons = {
      // Battle Icons
      'battle-traditional': 'images/sprites/icons/menu-battle2.svg',
      'battle-red': 'images/sprites/icons/battle-red.svg',
      'battle-crystal': 'images/sprites/icons/battle-crystal.svg',
      'battle-emerald': 'images/sprites/icons/battle-emerald.svg',
      'battle-platinum': 'images/sprites/icons/battle-platinum.svg',
      'battle-plasma': 'images/sprites/icons/battle-plasma.svg',
      'battle-kalos': 'images/sprites/icons/battle-kalos.svg',
      'battle-sky': 'images/sprites/icons/battle-sky.svg',
      'battle-alolan': 'images/sprites/icons/battle-alolan.svg',
      'battle-ultra': 'images/sprites/icons/battle-ultra.svg',
      'battle-galar': 'images/sprites/icons/battle-galar.svg',
      'battle-galardlc': 'images/sprites/icons/battle-galardlc.svg',
      'battle-arceus': 'images/sprites/icons/battle-arceus.svg',
      'battle-paldea': 'images/sprites/icons/battle-paldea.svg',
      'battle-paldeadlc': 'images/sprites/icons/battle-paldeadlc.svg',
      'battle-tiny': 'images/sprites/icons/battle-tiny.svg',
      'battle-beginner': 'images/sprites/icons/battle-beginner.svg',
      // Menu Icons
      'menu-about': 'images/sprites/icons/menu-about.svg',
      'menu-achievements': 'images/sprites/icons/menu-achievements.svg',
      'menu-admin': 'images/sprites/icons/menu-admin.svg',
      'menu-bag': 'images/sprites/icons/menu-bag.svg',
      'menu-bank': 'images/sprites/icons/menu-bank.svg',
      'menu-battle': 'images/sprites/icons/menu-battle2.svg',
      'menu-bazaar': 'images/sprites/icons/menu-bazaar.svg',
      'menu-crafting': 'images/sprites/icons/menu-crafting.svg',
      'menu-daycare': 'images/sprites/icons/menu-daycare.svg',
      'menu-deleter': 'images/sprites/icons/menu-deleter.svg',
      'menu-egg': 'images/sprites/icons/menu-egg.svg',
      'menu-encounters': 'images/sprites/icons/menu-encounters.svg',
      'menu-farm': 'images/sprites/icons/menu-farm.svg',
      'menu-games': 'images/sprites/icons/menu-games.svg',
      'menu-gts': 'images/sprites/icons/menu-gts.svg',
      'menu-mart': 'images/sprites/icons/menu-mart.svg',
      'menu-pokeball': 'images/sprites/icons/menu-pokeball.svg',
      'menu-pokedex': 'images/sprites/icons/menu-pokedex.svg',
      'menu-pokegear': 'images/sprites/icons/menu-pokegear.svg',
      'menu-quests': 'images/sprites/icons/menu-quests.svg',
      'menu-raids': 'images/sprites/icons/menu-raids.svg',
      'menu-release': 'images/sprites/icons/menu-release.svg',
      'menu-research': 'images/sprites/icons/menu-research.svg',
      'menu-trade': 'images/sprites/icons/menu-trade.svg',
      'menu-trainer': 'images/sprites/icons/menu-trainer.svg',
      'menu-tutor': 'images/sprites/icons/menu-tutor.svg',
      'menu-voyages': 'images/sprites/icons/menu-voyages.svg',
      'menu-wonder': 'images/sprites/icons/menu-wonder.svg',
      'menu-wonder2': 'images/sprites/icons/menu-wonder.svg',
      // Map Icons
      'moon-1q': 'images/sprites/icons/moon-1q.svg',
      'moon-3q': 'images/sprites/icons/moon-3q.svg',
      'moon-full': 'images/sprites/icons/moon-full.svg',
      'moon-nc': 'images/sprites/icons/moon-nc.svg',
      'moon-new': 'images/sprites/icons/moon-new.svg',
      'moon-ng': 'images/sprites/icons/moon-ng.svg',
      'moon-xc': 'images/sprites/icons/moon-xc.svg',
      'moon-xg': 'images/sprites/icons/moon-xg.svg',
      'tod-day': 'images/sprites/icons/tod-day.svg',
      'tod-dusk': 'images/sprites/icons/tod-dusk.svg',
      'tod-night': 'images/sprites/icons/tod-night.svg',
      'high-tide': 'images/sprites/icons/high-tide.svg',
      'low-tide': 'images/sprites/icons/low-tide.svg',
      'map-flower': 'images/sprites/icons/map-flower.svg',
      'map-icy': 'images/sprites/icons/map-icy.svg',
      'map-magnetic': 'images/sprites/icons/map-magnetic.svg',
      'map-meteor': 'images/sprites/icons/map-meteor.svg',
      'map-moss': 'images/sprites/icons/map-moss.svg',
      // Types
      'type-Normal': 'images/sprites/icons/type-Normal.svg',
      'type-Ice': 'images/sprites/icons/type-Ice.svg',
      'type-Grass': 'images/sprites/icons/type-Grass.svg',
      'type-Poison': 'images/sprites/icons/type-Poison.svg',
      'type-Bug': 'images/sprites/icons/type-Bug.svg',
      'type-Water': 'images/sprites/icons/type-Water.svg',
      'type-Fire': 'images/sprites/icons/type-Fire.svg',
      'type-Flying': 'images/sprites/icons/type-Flying.svg',
      'type-Fighting': 'images/sprites/icons/type-Fighting.svg',
      'type-Electric': 'images/sprites/icons/type-Electric.svg',
      'type-Ground': 'images/sprites/icons/type-Ground.svg',
      'type-Rock': 'images/sprites/icons/type-Rock.svg',
      'type-Ghost': 'images/sprites/icons/type-Ghost.svg',
      'type-Psychic': 'images/sprites/icons/type-Psychic.svg',
      'type-Dragon': 'images/sprites/icons/type-Dragon.svg',
      'type-Dark': 'images/sprites/icons/type-Dark.svg',
      'type-Steel': 'images/sprites/icons/type-Steel.svg',
      'type-Fairy': 'images/sprites/icons/type-Fairy.svg',
      'gmax': 'images/sprites/icons/gmax.svg',
    }
    for (const [name, url] of Object.entries(icons)) {
      this.iconRegistry.addSvgIcon(name, this.domSanitizer.bypassSecurityTrustResourceUrl(url))
    }
    console.debug('Icon Registry is configured')
  }

  omniFilter() {
    // Here's our initial collection of search results
    // Notes to change in the future:
    //  Consolidate 'label' entries
    //  Add a keywords feature
    //  Move into keyboard.service
    //  Add sprite/icon
    //  Improve UI, remove the dialog background, make input bigger
    //  Improve dynamism. Put all bazaar labels into Bazaar keywords
    //  Add a subtitle for things like Pokemon IDs
    //  Use keyboard to navigate results
    //  Add a keyboard option to navigation to quick-jump to pages
    //  When result is clicked, close dialog
    const allSearchOptions: OmniRes[] = [{
      label: 'Pokémon',
      url: '/pokemon/collection',
    }, {
      label: 'Pokemon',
      url: '/pokemon/collection'
    }, {
      label: 'Eggs',
      url: '/pokemon/eggs'
    }, {
      label: 'Hatch',
      url: '/pokemon/eggs'
    }, {
      label: 'Bank',
      url: '/pokemon/bank'
    }, {
      label: 'Cold Storage',
      url: '/pokemon/bank'
    }, {
      label: 'Release',
      url: '/pokemon/release'
    }, {
      label: 'Pokédex',
      url: '/pokemon/pokedex'
    }, {
      label: 'Pokedex',
      url: '/pokemon/pokedex'
    }, {
      label: 'Catch',
      url: '/pokemon/catch'
    }, {
      label: 'Move Deleter',
      url: '/pokemon/deleter'
    }, {
      label: 'Move Tutor',
      url: '/pokemon/tutor'
    }, {
      label: 'Bag',
      url: '/items/bag'
    }, {
      label: 'Mart',
      url: '/items/mart'
    }, {
      label: 'Bazaar',
      url: '/items/bazaar'
    }, {
      label: 'Craft',
      url: '/items/crafting'
    }, {
      label: 'Day Care',
      url: '/multiplayer/nursery'
    }, {
      label: 'Global Trade System',
      url: '/multiplayer/gts'
    }, {
      label: 'Wonder Trade',
      url: '/multiplayer/wonder'
    }, {
      label: 'Private Trade',
      url: '/multiplayer/trade'
    }, {
      label: 'Battle Stadium',
      url: '/multiplayer/battle'
    }, {
      label: 'Raids',
      url: '/multiplayer/raids'
    }, {
      label: 'Voyages',
      url: '/multiplayer/voyages'
    }, {
      label: 'Game Corner',
      url: '/base/gamecorner'
    }, {
      label: 'Berry Farm',
      url: '/base/farm'
    }, {
      label: 'Quests',
      url: '/base/quests'
    }, {
      label: 'Achievements',
      url: '/base/achievements'
    }, {
      label: 'Research',
      url: '/base/research'
    }, {
      label: 'Trainer Card',
      url: '/profile/trainer'
    }, {
      label: 'Close Account',
      url: '/profile/trainer'
    }, {
      label: 'Delete Account',
      url: '/profile/trainer'
    }, {
      label: 'Help',
      url: '/help'
    }, {
      label: 'Chat',
      url: '/chat'
    }, {
      label: 'PokéGear',
      url: '/chat'
    }, {
      label: 'Professor Oak',
      url: '/chat'
    }]
    window.requestAnimationFrame(() => {
      this.omniRes = allSearchOptions.filter(x =>
          x.label.toLowerCase().includes(this.omniSearch.toLowerCase()))
          .slice(0, 5)
    })
  }

  updateTheme(user: Users.Doc) {
    if (user.settings!.theme === 'dark') {
      localStorage.setItem('darktheme', 'true')
      window.setDarkMode(true)
    } else  if (user.settings!.theme === 'light') {
      localStorage.setItem('darktheme', 'false')
      window.setDarkMode(false)
    } else {
      localStorage.setItem('darktheme', 'false')
      const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
      window.setDarkMode(dark)
    }
  }
}
