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
import { CATCH_CHARM_DPPT, CATCH_CHARM_GSC, CATCH_CHARM_RBY, CATCH_CHARM_RSE, COMMUNITY_ACHIEVEMENTS, LEGENDARY_ITEM_QUESTS, ONEP_ACHIEVEMENTS, POKEDOLL } from '../../../../shared/src/quests';
import { ACTIVE_RESEARCH } from '../../../../shared/src/research';
import { Users } from '../../../../shared/src/server-types';
import { Swarms } from '../../../../shared/src/platform/swarms';
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

interface Gate {
  kanto: boolean
  johto: boolean
  hoenn: boolean
  sinnoh: boolean
  farm: boolean
  bank: boolean
  eggs: boolean
  raids: boolean
  craft: boolean
  voyages: boolean
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
  ) {
    this.engagement = engagement
  }

  ngOnInit(): void {
    /* For scripting convenience */
    window['firebase'] = this.firebase
    window['badge'] = Badge
    window['Badge'] = Badge
    window['Swarms'] = Swarms
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
    this.firebase.init()
    this.firebaseListener = this.firebase.subscribeUser(async user => {
      if (user) {
        this.firestoreManual = user.settings.disableRealtime
        this.gate.kanto = user.hiddenItemsFound.includes(CATCH_CHARM_RBY)
        this.gate.johto = user.hiddenItemsFound.includes(CATCH_CHARM_GSC)
        this.gate.hoenn = user.hiddenItemsFound.includes(CATCH_CHARM_RSE)
        this.gate.sinnoh = user.hiddenItemsFound.includes(CATCH_CHARM_DPPT)
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
}
