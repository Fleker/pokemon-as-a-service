import { ElementRef } from '@angular/core';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import spacetime, { Spacetime } from 'spacetime';
import { LinksService } from 'src/app/links.service';
import { FirebaseService } from 'src/app/service/firebase.service';
import { LocationService } from 'src/app/service/location.service';
import { Badge } from '../../../../../shared/src/badge3';
import { getMoonPhase, getTides, Globe, Location, MoonPhase, season, LocationId, Tides, WeatherType, iconMap, RegionType } from '../../../../../shared/src/locations-list';
import { BadgeId, PokemonForm, PokemonId } from '../../../../../shared/src/pokemon/types';
import { MAGNETTRAIN_PASS } from '../../../../../shared/src/quests';
import randomItem from '../../../../../shared/src/random-item';
import { F, Users } from '../../../../../shared/src/server-types';
import { Swarms } from '../../../../../shared/src/platform/swarms';
import { ENCOUNTER_CONDITION } from '../../../../../shared/src/gen/encounter-map';
import { ItemId, PokeballId } from '../../../../../shared/src/items-list';
import { Events } from '../../../../../shared/src/events';
import { PokeballArr } from '../../../../../shared/src/gen/type-item';
import { PokearthComponent } from '../pokearth/pokearth.component';
import { EngagementService } from '../../engagement.service';
import { CATCH_CHARM_XY } from '../../../../../shared/src/legendary-quests';

declare var window: any

interface BinocularPokemon {
  id: PokemonId
  animation: string
}

const binocularAnimations = [
  'hop1', 'hop2', 'hop3',
  'wiggle1', 'wiggle2', 'wiggle3',
  'none',
]

const timeOfDay = (localDate: Spacetime) => {
  if (localDate.hour() > 6 && localDate.hour() <= 18) {
    return 'Day'
  }
  return 'Night'
}

const isDusk = (localDate: Spacetime) => {
  return localDate.hour() === 19 // 7pm
}

const VivillonMap: Partial<Record<PokemonForm, any>> = {
  archipelago: '/images/sprites/icons/viv-archipelago.png',
  continental: '/images/sprites/icons/viv-continental.png',
  elegant: '/images/sprites/icons/viv-elegant.png',
  fancy: '/images/sprites/icons/viv-fancy.png',
  garden: '/images/sprites/icons/viv-garden.png',
  highplains: '/images/sprites/icons/viv-highplains.png',
  icysnow: '/images/sprites/icons/viv-icysnow.png',
  jungle: '/images/sprites/icons/viv-jungle.png',
  marine: '/images/sprites/icons/viv-marine.png',
  meadow: '/images/sprites/icons/viv-meadow.png',
  modern: '/images/sprites/icons/viv-modern.png',
  monsoon: '/images/sprites/icons/viv-monsoon.png',
  ocean: '/images/sprites/icons/viv-ocean.png',
  pokeball: '/images/sprites/icons/viv-pokeball.png',
  polar: '/images/sprites/icons/viv-polar.png',
  river: '/images/sprites/icons/viv-river.png',
  sandstorm: '/images/sprites/icons/viv-sandstorm.png',
  savanna: '/images/sprites/icons/viv-savanna.png',
  sun: '/images/sprites/icons/viv-sun.png',
  tundra: '/images/sprites/icons/viv-tundra.png',
}

@Component({
  selector: 'button-location',
  templateUrl: './button-location.component.html',
  styleUrls: ['./button-location.component.css']
})
export class ButtonLocationComponent implements OnInit {
  @ViewChild('dialog') dialog: ElementRef
  @ViewChild('pokearth') dialogPokearth: ElementRef
  @ViewChild('emap') dialogEMap: ElementRef
  @ViewChild('earth') earth: PokearthComponent
  @ViewChild('locationtitle') locationDialog?: ElementRef
  user?: Users.Doc
  pickFlag: boolean = false
  locationLabels = Object.values(Globe).map(l => l.label)
  forecast?: WeatherType
  forecastIcon: string = "wb_sunny"

  lastUserLocation: LocationId
  current?: Location
  vivillon?: {
    sprite: string,
    caught: string,
  }
  season?: string
  swarm?: string
  localTimeString?: string
  localTimeDay?: string
  moonPhase: MoonPhase
  tides: Tides

  nextLocation?: LocationId
  allLocations = Object.entries(Globe).map(([k, v]) => ({id: k, label: v.label}))

  locationFr?: string
  exec = {
    travel: false,
  }
  
  availablePokemon: Partial<Record<ItemId, BinocularPokemon[]>> = {}
  selected = 'pokeball'
  balls = PokeballArr

  get hasTransitPass() {
    return this.user?.hiddenItemsFound.includes(MAGNETTRAIN_PASS)
  }

  get tideSprite() {
    const path = this.tides === 'High Tide' ? 'high-tide' : 'low-tide'
    return path
  }

  get moonSprite() {
    const path = {
      'New Moon': 'moon-new',
      'Waxing Crescent': 'moon-xc',
      'First Quarter': 'moon-1q',
      'Waxing Gibbous': 'moon-xg',
      'Full Moon': 'moon-full',
      'Waning Gibbous': 'moon-ng',
      'Last Quarter': 'moon-3q',
      'Waning Crescent': 'moon-nc',
    }[this.moonPhase || 'New Moon']
    return path
  }

  get todSprite() {
    const path = {
      'Day': 'tod-day',
      'Dusk': 'tod-dusk',
      'Night': 'tod-night',
    }[this.localTimeDay || 'Day']
    return path
  }

  get location() {
    if (!this.user) return Globe['US-MTV']
    return Globe[this.user.location]
  }

  get hasGoggles() {
    if (!this.user) return false
    return this.user.items.gogoggles > 0
  }

  get hasXyCharm() {
    if (!this.user) return false
    return this.user.hiddenItemsFound.includes(CATCH_CHARM_XY)
  }

  get hasTownMap() {
    if (!this.user) return false
    return this.user.items.townmap > 0
  }

  get locationRegion() {
    if (!this.location) return ''
    return this.location.region.replace(/ /g, '').replace(/\//g, '')
  }

  get locationTime() {
    if (!this.location) return ''
    let loc = spacetime()
    loc = loc.goto(this.location.timezone)
    return loc.format('{time}') 
  }

  get tooltip() {
    if (!this.location) return '???'
    if (!this.user) return '???'

    return `${this.location.label} | ${this.locationTime}`
  }

  get currentMeteor() {
    if (!this.current) return undefined
    if (!this.current.meteor) return undefined
    return this.current.meteor.replace('_', ' ')
  }

  constructor(
    private firebase: FirebaseService,
    private locations: LocationService,
    private links: LinksService,
    private snackbar: MatSnackBar,
    private engagement: EngagementService,
  ) {}

  async ngOnInit() {
    await this.links.init()
    this.locationFr = this.links.templates.location
    this.firebase.subscribeUser(async user => {
      if (!user) return
      this.user = user
      this.pickFlag = user.settings.flagLocation2
      this.current = Globe[user.location]
      this.nextLocation = user.location
      const location = user.location
      const forecast = await this.locations.getForecast(location)
      this.forecast = forecast
      this.forecastIcon = iconMap[forecast]
      let loc = spacetime()
      loc = loc.goto(this.current.timezone)

      this.localTimeString = loc.format('{time}')
      this.localTimeDay = (() => {
        if (isDusk(loc)) {
          return 'Dusk'
        }
        return timeOfDay(loc)
      })()

      this.season = season(this.current, new Date())
      this.swarm = Badge.fromLegacy(Swarms[this.current.region]).toLabel()
      this.moonPhase = getMoonPhase()
      this.tides = getTides(user.location)
      this.vivillon = {
        sprite: VivillonMap[this.current.vivillon],
        caught: (() => {
          for (const [k, v] of Object.entries(this.user.pokemon)) {
            const badge = new Badge(k)
            if (badge.id !== 666) continue;
            if (badge.personality.form === this.current.vivillon) {
              return ''
            }
          }
          return 'uncaught'
        })()
      }
      this.showLocationBanner()
    })

    // We should fix this somehow
    setInterval(() => {
      if (window.travelQueue?.length) {
        const pop = window.travelQueue.pop() as LocationId
        this.travelx(pop)
      }
    }, 100)
  }

  show() {
    this.dialog!.nativeElement.showModal()
    if (this.earth) {
      this.earth!.load()
    }
  }

  close() {
    this.dialog!.nativeElement.close()
  }

  showLocationBanner() {
    if (this.lastUserLocation && this.lastUserLocation !== this.user.location) {
      this.openLocationDialog()
    }
    if (!this.lastUserLocation) {
      // Startup
      // this.openLocationDialog() // <- People didn't like this.
    }
    this.lastUserLocation = this.user.location
  }

  openEarth() {
    this.dialogPokearth!.nativeElement.showModal()
  }

  travelx(location: LocationId) {
    this.exec.travel = true
    window.requestAnimationFrame(async () => {
      try {
        await this.firebase.exec<F.UserLocation.Req, F.UserLocation.Res>('user_location', {location})
        this.firebase.refreshUser()
      } catch (e: any) {
        this.close()
        this.snackbar.open(e.message, '', {duration: 5000})
      } finally {
        this.exec.travel = false
      }
    })
  }

  travel() {
    if (!Globe[this.nextLocation] || this.pickFlag) {
      this.nextLocation = Object.entries(Globe)
        .filter(([_, value]) => value.label === this.nextLocation)[0][0] as LocationId
    }
    this.exec.travel = true
    window.requestAnimationFrame(async () => {
      try {
        await this.firebase.exec<F.UserLocation.Req, F.UserLocation.Res>('user_location', {location: this.nextLocation})
        this.firebase.refreshUser()
      } catch (e: any) {
        this.close()
        this.snackbar.open(e.message, '', {duration: 5000})
      } finally {
        setTimeout(() => {
          // Give time for UI to update
          this.exec.travel = false
        }, 1000)
      }
    })
  }

  openMap() {
    this.availablePokemon = {}
    for (const [key, methods] of Object.entries(ENCOUNTER_CONDITION)) {
      for (const method of methods) {
        // Same as encounter.ts
        const opts = method.method as any
        const willAdd = (() => {
          if (opts.gate && !this.user.hiddenItemsFound.includes(opts.gate)) {
            return false
          }
          if (opts.weather && this.location.forecast !== opts.weather) {
            return false
          }
          if (opts.terrain && this.location.terrain !== opts.terrain) {
            return false
          }
          if (opts.region && this.location.region !== opts.region) {
            return false
          }
          if (opts.event && !Events[opts.event].isActive(this.user as Users.Doc)) {
            return false
          }
          if (opts.time) {
            if (opts.time === 'Dusk' && !isDusk(spacetime())) {
              return false
            }
            if (opts.time !== timeOfDay(spacetime())) {
              return false
            }
          }
          if (opts.item) {
            for (const item of opts.item) {
              if (this.user.items[item] === undefined || this.user.items[item]! <= 0) {
                return false
              }
            }
          }
          if (opts.tide && getTides(this.user.location) !== opts.tide) {
            return false
          }
          if (opts.location && this.user.location !== opts.location) {
            return false
          }
          if (opts.souvenir && this.user.lastLocations?.includes(this.user.location)) {
            return false
          }
          if ('other' in opts || 'others' in opts) {
            return false
          }
          return true
        })()
        if (willAdd) {
          if (this.availablePokemon[method.item]) {
            this.availablePokemon[method.item].push({
              id: Badge.fromLegacy(key),
              animation: randomItem(binocularAnimations),
            })
          } else {
            this.availablePokemon[method.item] = [{
              id: Badge.fromLegacy(key),
              animation: randomItem(binocularAnimations),
            }]
          }
        }
      }
    }
    this.dialogEMap.nativeElement.showModal()
  }

  select(item: string) {
    this.selected = item
  }

  closeHelp() {
    this.dialogEMap.nativeElement.close()
  }

  openLocationDialog() {
    this.locationDialog.nativeElement.showModal()
    this.locationDialog.nativeElement.classList.add('animate')
    setTimeout(() => {
      this.locationDialog.nativeElement.classList.add('animateout')
      this.locationDialog.nativeElement.classList.remove('animate')
      setTimeout(() => {
        this.locationDialog.nativeElement.classList.remove('animateout')
        this.locationDialog.nativeElement.close()
      }, 0.6 * 1000)
    }, 2.9 * 1000)
  }
}
