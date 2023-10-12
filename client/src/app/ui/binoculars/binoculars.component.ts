import { Component, Input, OnInit } from '@angular/core';
import { getMoonPhase, getTides, Globe, Location, MoonPhase, season, LocationId, Tides, WeatherType, iconMap, RegionType } from '../../../../../shared/src/locations-list';
import { ItemId, PokeballId } from '../../../../../shared/src/items-list';
import { BadgeId, PokemonForm, PokemonId } from '../../../../../shared/src/pokemon/types';
import { ENCOUNTER_CONDITION } from '../../../../../shared/src/gen/encounter-map';
import { F, Users } from '../../../../../shared/src/server-types';
import { Badge } from '../../../../../shared/src/badge3';
import randomItem from '../../../../../shared/src/random-item';
import { Events } from '../../../../../shared/src/events';
import spacetime, { Spacetime } from 'spacetime';
import { PokeballArr } from '../../../../../shared/src/gen/type-item';
import { FirebaseService } from 'src/app/service/firebase.service';

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

@Component({
  selector: 'widget-binoculars',
  templateUrl: './binoculars.component.html',
  styleUrls: ['./binoculars.component.css']
})
export class BinocularsComponent implements OnInit {
  @Input('forecast') forecast: WeatherType = 'Sunny'
  @Input('forecastIcon') forecastIcon = 'wb_sunny'
  /** Override field. Otherwise go with pre-defined `availablePokemon` */
  @Input('available') available?: BadgeId[]
  balls = PokeballArr
  user?: Users.Doc
  availablePokemon: Partial<Record<ItemId, BinocularPokemon[]>> = {}
  selected = 'pokeball'

  constructor(private firebase: FirebaseService) {}

  get location(): Location {
    if (!this.user) return Globe['US-MTV']
    const w = Globe[this.user.location]
    w.forecast = this.forecast
    return w
  }

  get landmark() {
    if (this.location.mossyRock) {
      return '/images/sprites/icons/map-moss.svg'
    }
    if (this.location.icyRock) {
      return '/images/sprites/icons/map-icy.svg'
    }
    if (this.location.magneticField) {
      return '/images/sprites/icons/map-magnetic.svg'
    }
    return undefined
  }

  get meteor() {
    if (this.location.meteor) {
      return '/images/sprites/icons/map-meteor.svg'
    }
    return undefined
  }

  get flower() {
    if (this.location.flower) {
      return '/images/sprites/icons/map-flower.svg'
    }
    return undefined
  }

  ngOnInit(): void {
    this.firebase.subscribeUser(async user => {
      if (!user) return
      this.user = user
      this.load()
    })
  }

  select(item: string) {
    this.selected = item
  }

  load() {
    if (this.available !== undefined) {
      return this.loadPredefined()
    }
    this.availablePokemon = {}
    const date = spacetime(Date.now(), Globe[this.user.location].timezone)
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
            if (opts.time === 'Dusk' && !isDusk(date)) {
              return false
            }
            if (opts.time !== timeOfDay(date)) {
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
  }

  loadPredefined() {
    this.availablePokemon = {[this.selected]: []}
    this.available.forEach(key => {
      console.debug(key)
      this.availablePokemon[this.selected].push({
        id: Badge.fromLegacy(key).toString(),
        animation: randomItem(binocularAnimations),
      })
    })
  }
}
