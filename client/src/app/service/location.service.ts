import { Injectable } from '@angular/core';
import { Location, Season, LocationId } from '../../../../shared/src/locations-list';
import { FirebaseService } from './firebase.service';

const DAY = 1000 * 60 * 60 * 24

const lastDayTimestamp = () => {
  return Date.now() - Date.now() % DAY
}

interface Cache {
  lastDay: number
  forecasts?: Record<LocationId, Location>
  eventsString: string
  season: Season
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private locationCache: Cache = {
    lastDay: 0,
    eventsString: '',
    season: 'Spring'
  }

  constructor(private firbase: FirebaseService) {}

  private async fetchForecastsOrCache() {
    if (this.locationCache.lastDay === lastDayTimestamp()) {
      if (this.locationCache) {
        return // Already obtained
      }
    }
    // Refresh cached data
    const res = await this.firbase.exec('location_list')
    const {locations, season, events} = res.data
    this.locationCache.forecasts = locations
    this.locationCache.season = season
    this.locationCache.eventsString = Object.entries(events)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(', ')
    this.locationCache.lastDay = lastDayTimestamp()
  }

  async getForecast(location: LocationId) {
    await this.fetchForecastsOrCache()
    return this.locationCache.forecasts![location].forecast
  }

  async getLocation(location: LocationId) {
    await this.fetchForecastsOrCache()
    return this.locationCache.forecasts![location]
  }

  async getAllForecasts() {
    await this.fetchForecastsOrCache()
    return this.locationCache.forecasts!
  }

  async getEvents() {
    await this.fetchForecastsOrCache()
    return this.locationCache.eventsString
  }

  async getSeason() {
    await this.fetchForecastsOrCache()
    return this.locationCache.season
  }
}
