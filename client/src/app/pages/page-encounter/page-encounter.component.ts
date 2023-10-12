import { AfterViewInit, Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FirebaseService } from 'src/app/service/firebase.service';
import { LocationService } from 'src/app/service/location.service';
import { ITEMS, ItemId, PokeballId } from '../../../../../shared/src/items-list';
import { Swarms } from '../../../../../shared/src/platform/swarms';
import { Globe, WeatherType, iconMap } from '../../../../../shared/src/locations-list';
import { ENCOUNTER_CONDITION} from '../../../../../shared/src/gen/encounter-map';
import { get } from '../../../../../shared/src/pokemon';
import { F } from '../../../../../shared/src/server-types';
import { CATCH_CHARM_BW, CATCH_CHARM_DPPT, CATCH_CHARM_GSC, CATCH_CHARM_RBY, CATCH_CHARM_RSE, SHINY_CHARM, SWARMS_UNLOCK, CATCH_CHARM_SM, CATCH_CHARM_XY, CATCH_CHARM_SWSH } from '../../../../../shared/src/quests';
import { Users } from '../../../../../shared/src/server-types';
import { LureId } from '../../../../../shared/src/gen/type-item';
import { BadgeId, PokemonId } from '../../../../../shared/src/pokemon/types';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Badge } from '../../../../../shared/src/badge3';
import { PokemonDatalistComponent } from 'src/app/ui/pokemon-datalist/pokemon-datalist.component';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { FriendSafariComponent } from 'src/app/ui/friendsafari/friendsafari.component';
import { BinocularsComponent } from 'src/app/ui/binoculars/binoculars.component';

interface Catch {
  html: string
  pokedex: string
  selectedPokemon: BadgeId
  duplicates: boolean
  holdItem?: ItemId
  speciesId?: PokemonId
  species?: string
  hold?: string
  entry?: string
  size?: string
  ditto?: PokemonId
  zorua?: PokemonId
  zoroark?: PokemonId
  baitEaten?: ItemId
}

@Component({
  selector: 'app-page-encounter',
  templateUrl: './page-encounter.component.html',
  styleUrls: ['./page-encounter.component.css']
})
export class PageEncounterComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('voter') voter: PokemonDatalistComponent
  @ViewChild('dcatching') dialogCharm: ElementRef
  @ViewChild('dswarm') dialogSwarm: ElementRef
  @ViewChild('dunown') dialogUnown: ElementRef
  @ViewChild('dsoot') dialogSoot: ElementRef
  @ViewChild('dkeystone') dialogKeystone: ElementRef
  @ViewChild('dzygarde') dialogZygarde: ElementRef
  @ViewChild('dforage') dialogForage: ElementRef
  @ViewChild('ditemfinder') dialogItemFinder: ElementRef
  @ViewChild('dmeltanox') dialogMeltanBox: ElementRef
  @ViewChild('dbait') dialogBait: ElementRef
  @ViewChild('tutorial') tutorial: ElementRef
  @ViewChild('binoculars') binoculars?: BinocularsComponent
  @ViewChild('fs') friendSafariSelector: FriendSafariComponent
  user?: Users.Doc
  balls: PokeballId[] = []
  bait: ItemId[] = []
  _events?: string
  _season?: string
  _forecast?: WeatherType
  selected?: PokeballId
  selectionLabel?: string
  selectedBait?: ItemId = undefined
  selectedLure?: LureId = undefined
  duplicates = false
  shouldRefreshUser = true
  catch?: Catch
  unownHint?: string
  dialogs: Record<string, ElementRef> = {}
  exec = {
    throw: false,
    swarmVote: false,
  }
  binocularsList: BadgeId[] = []
  firebaseListener: any

  get charms() {
    if (!this.user) {
      return {
        rby: false, gsc: false, rse: false, dppt: false, bw: false, xy: false, sm: false, swsh: false,
        shiny: false, swarm: false, campinggear: false,
        backlot: false, friendsafari: false,
        sootsack: false, unownreport: false, oddkeystone: false, zygardecube: false, meltanbox: false,
      }
    }
    return {
      rby: this.user.hiddenItemsFound.includes(CATCH_CHARM_RBY),
      gsc: this.user.hiddenItemsFound.includes(CATCH_CHARM_GSC),
      rse: this.user.hiddenItemsFound.includes(CATCH_CHARM_RSE),
      dppt: this.user.hiddenItemsFound.includes(CATCH_CHARM_DPPT),
      bw: this.user.hiddenItemsFound.includes(CATCH_CHARM_BW),
      xy: this.user.hiddenItemsFound.includes(CATCH_CHARM_XY),
      sm: this.user.hiddenItemsFound.includes(CATCH_CHARM_SM),
      swsh: this.user.hiddenItemsFound.includes(CATCH_CHARM_SWSH),
      shiny: this.user.hiddenItemsFound.includes(SHINY_CHARM),
      swarm: this.user.hiddenItemsFound.includes(SWARMS_UNLOCK),
      backlot: this.user.items.trophygardenkey > 0,
      friendsafari: this.user.items.friendsafaripass > 0,
      grotto: this.user.items['colressmchn'] > 0,
      sootsack: this.user.items.sootsack > 0,
      sos: this.user.items.adrenalineorb > 0,
      wildarea: this.user.items.rotombike > 0,
      unownreport: this.user.items.unownreport > 0,
      oddkeystone: this.user.items.oddkeystone > 0,
      zygardecube: this.user.items.zygardecube > 0,
      foragebag: this.user.items.foragebag > 0,
      itemfinder: this.user.items.itemfinder > 0,
      meltanbox: this.user.items.meltanbox > 0,
      campinggear: this.user.items.campinggear > 0 || this.user.ldap === 'fleker',
    }
  }

  get currentSwarming() {
    if (!this.user) return ''
    if (!this.user.location) return ''
    const swarm = Swarms[Globe[this.user.location].region]
    if (!swarm) return ''
    return get(swarm).species
  }

  get events() {
    // TODO: Array?
    return this._events
  }

  get season() {
    return this._season
  }

  get forecast() {
    return this._forecast
  }

  get location() {
    if (!this.user) return Globe['US-MTV']
    return Globe[this.user.location]
  }

  get selectionCount() {
    return this.user.items[this.selected] || 0
  }

  get ballString() {
    return Object.entries(ITEMS)
      .filter(([, v]) => v.category === 'balls')
      .filter(([, v]) => v.buy > 0)
      .map(([k]) => k)
      .join(',')
  }

  get souvenirClass() {
    if (!this.user) return ''
    if (!this.user.lastLocations) return ''
    if (this.user.lastLocations.includes(this.user.location)) {
      return 'disabled'
    }
    return ''
  }

  get hasGoggles() {
    if (!this.user) return false
    return this.user.items.gogoggles > 0
  }

  constructor(
    private firebase: FirebaseService,
    private locations: LocationService,
    private snackbar: MatSnackBar,
  ) { }

  ngOnInit(): void {
    this.locations.getEvents()
      .then(events => this._events = events)
    this.locations.getSeason()
      .then(s => this._season = s)
    this.getUnownHint().then(f => this.unownHint = f)
    
    this.firebaseListener = this.firebase.subscribeUser(user => {
      if (user) {
        this.user = user
        this.locations.getForecast(this.user.location)
          .then(forecast => this._forecast = forecast)
        this.balls = Object.entries(ITEMS)
          .filter(([_, value]) => value.category === 'balls')
          .filter(([key, _]) => this.user.items[key] && this.user.items[key] > 0)
          .map(([key, _]) => key as PokeballId)
        this.bait = Object.entries(ITEMS)
          .filter(([_, value]) => 'consumption' in value)
          .filter(([key, _]) => this.user.items[key] && this.user.items[key] > 0)
          .map(([key, _]) => key as ItemId)
        console.debug(this.balls, this.bait)
      }
    })
  }

  ngAfterViewInit(): void {
    this.dialogs = {
      'charm': this.dialogCharm,
      'swarm': this.dialogSwarm,
      'unown': this.dialogUnown,
      'soot': this.dialogSoot,
      'keystone': this.dialogKeystone,
      'zygarde': this.dialogZygarde,
      'forage': this.dialogForage,
      'itemfinder': this.dialogItemFinder,
      'meltanbox': this.dialogMeltanBox,
      'bait': this.dialogBait,
    }
  }

  ngOnDestroy() {
    this.firebaseListener?.unsubscribe()
  }

  select(item: PokeballId) {
    this.selected = item
    this.selectionLabel = ITEMS[item].label
  }

  selectBait(item?: ItemId) {
    this.selectedBait = item
  }

  async getUnownHint() {
    const locations = await this.locations.getAllForecasts()
    for (const [key, value] of Object.entries(locations)) {
      if (!!value.unown) {
        // We know the 'label' of the Unown location
        // Now we need to use that to lookup the fact of the day.
        const {fact} = Globe[key]
        console.debug("Today's Unown:", value.label, value.unown, fact)
        return fact
      }
    }
    return 'No hint found. This may be a bug.'
  }

  async throw() {
    this.exec.throw = true
    window.requestAnimationFrame(async () => {
      try {
        const res = await this.firebase.exec<F.Throw.Req, F.Throw.Res>('throw', {
          pokeball: this.selected,
          duplicates: this.duplicates,
          lure: this.selectedLure,
          friendSafari: this.friendSafariSelector?.zones,
          bait: this.selectedBait,
        })

        const badge = Badge.fromLegacy(res.data.selectedPokemon)
        this.catch = res.data
        this.catch.speciesId = badge.toString()
        this.catch.species = badge.toLabel()
        this.catch.size = badge.size
        this.catch.hold = this.catch.holdItem ?
          ITEMS[this.catch.holdItem].label : undefined
        this.catch.entry = get(this.catch.selectedPokemon).pokedex
        this.catch.baitEaten = res.data.bait?.remaining < this.user.items[res.data.bait?.item] ?
          ITEMS[res.data.bait?.item].label : undefined 
        if (this.shouldRefreshUser) {
          this.firebase.refreshUser()
        }
        this.user.items[this.selected] = res.data.balls
        this.user.lastLocations = res.data.lastLocations
      } catch (e: any) {
        this.snackbar.open(e.message, '', { duration: 5000 })
      } finally {
        this.exec.throw = false
      }
    })
  }

  async swarmVote() {
    this.exec.swarmVote = true
    window.requestAnimationFrame(async () => {
      try {
        await this.firebase.exec<F.SwarmVote.Req, F.SwarmVote.Res>('swarm_vote', {
          species: this.voter._value as BadgeId,
          position: 'swarm',
        })
        this.snackbar.open('Thanks for voting!', '', {duration: 3000})
      } catch (e: any) {
        this.snackbar.open(e.message, '', {duration: 5000})
      } finally {
        this.exec.swarmVote = false
      }
    })
  }

  selectLure(event: MatTabChangeEvent) {
    // Need to use a map of title => item
    // Since we can have multiple unlocks, we cannot guarantee which position
    // the current tab corresponds to the lure.
    this.selectedLure = {
      "Backlot's Trophy Garden": 'trophygardenkey' as LureId,
      'Friend Safari': 'friendsafaripass' as LureId,
      'Hidden Grotto': 'colressmchn' as LureId,
      'SOS Encounters': 'adrenalineorb' as LureId,
      'Wild Area': 'rotombike' as LureId,
    }[event.tab.textLabel] || undefined
    console.debug(`Move to ${this.selectedLure}`)
  }

  toastUnown() {
    this.closeHelp()
    this.snackbar.open(this.unownHint, 'Dismiss', {})
    this.snackbar._openedSnackBarRef.onAction().subscribe(() => {
      this.snackbar.dismiss()
    })
  }

  openDialog(type: string) {
    console.debug('Open', type)
    this.dialogs[type].nativeElement.showModal()
  }

  closeHelp() {
    for (const d of Object.values(this.dialogs)) {
      d?.nativeElement?.close()
    }
  }

  checkBinoculars(pokeball: ItemId, bait: ItemId) {
    this.binocularsList = []
    Object.entries(ENCOUNTER_CONDITION).forEach(([key, encounters]) => {
      encounters.forEach(encounter => {
        if ('bait' in encounter.method) {
          if (this.user.hiddenItemsFound.includes(encounter.method.gate)) {
            if (encounter.method.item.includes(pokeball)) {
              if (encounter.method.bait === bait) {
                this.binocularsList.push(key as BadgeId)
              }
            }
          }
        }
      })
    })
    console.log(pokeball, bait, this.binocularsList)
    this.binoculars.available = this.binocularsList
    this.binoculars.selected = bait
    this.binoculars.forecast = this._forecast
    this.binoculars.forecastIcon = iconMap[this._forecast]
    this.binoculars.load()
    this.dialogBait.nativeElement.showModal()
  }

  tutorialOpen() {
    this.tutorial!.nativeElement.showModal()
  }

  tutorialClose() {
    this.tutorial!.nativeElement.close()
  }
}
