
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { randomItem } from './utils'
import { Location, WeatherType, Globe, season } from '../../shared/src/locations-list'
import { babyProduced, parents } from '../../shared/src/platform/breeding-club'
import { GLOBAL_QUEST_DATE } from '../../shared/src/quests'
import { Swarms } from '../../shared/src/platform/swarms'
import { get } from '../../shared/src/pokemon'
import { PokemonForm } from '../../shared/src/pokemon/types'
const db = admin.firestore()
const DAY = 1000 * 60 * 60 * 24
const THREE_HOUR = 1000 * 60 * 60 * 3 + 1000 * 60 * 5 // 3hr, 5min
const lastDayTimestamp = () => {
  const now = Date.now() - THREE_HOUR
  return now - (now % DAY)
}
/**
 * A datatype that hosts daily-changing information on a location.
 * Storing this data in cache can reduce DB lookups.
 */
interface CacheLocation {
  /**
   * Forecast-only datatype
   */
  forecast: WeatherType
  /**
   * If we have only read the daily forecasts and not the doc itself,
   * we may be missing optional data
   */
  readDoc: boolean
  // Other optional data
  feebas?: boolean
  registeel?: boolean
  regirock?: boolean
  regice?: boolean
  /** A string representing the form that will be caught. */
  unown?: PokemonForm | null
}
interface ILocationCache {
  lastDay: number
  forecasts: {[locId: string]: CacheLocation}
}
const locationCache: ILocationCache = {
  lastDay: 0,
  forecasts: {}
}
export async function getLocation(locId = 'US-MTV'): Promise<Location> {
  const staticData = Globe[locId]
  const isCacheFresh = locationCache.lastDay === lastDayTimestamp()
  const isCacheComplete = locationCache.forecasts[locId]?.readDoc
  if (isCacheFresh && isCacheComplete) {
    // Check cache
    if (locationCache.forecasts[locId]) {
      return {...staticData, ...locationCache.forecasts[locId]} as Location
    }
  }
  if (isCacheFresh) {
    // Our location weather is updated but maybe not every parameter for the location ID
    const locationDoc = await db.collection('locations').doc(locId).get()
    const location = locationDoc.data() as Location
    locationCache.forecasts[locId] = {
      forecast: location.forecast ?? 'Sunny',
      feebas: location.feebas,
      registeel: location.registeel,
      regirock: location.regirock,
      regice: location.regice,
      readDoc: true,
    }
  }
  // Refresh cached data and our doc
  const forecastsDoc = await db.collection('locations').doc('_forecasts').get()
  const forecasts = forecastsDoc.data() as Record<string, Record<"forecast", WeatherType>>
  for (const [lid, value] of Object.entries(forecasts)) {
    locationCache.forecasts[lid] = {
      forecast: value.forecast ?? 'Sunny',
      readDoc: false,
    }
  }
  // Now do a second fetch for the location in question
  const locationDoc = await db.collection('locations').doc(locId).get()
  const location = locationDoc.data() as Location
  locationCache.forecasts[locId] = {
    forecast: location.forecast ?? 'Sunny',
    feebas: location.feebas,
    registeel: location.registeel,
    regirock: location.regirock,
    regice: location.regice,
    readDoc: true,
  }
    
  locationCache.lastDay = lastDayTimestamp()
  return {...staticData, ...location} as Location
}
export async function getForecast (locId: string): Promise<WeatherType> {
  const location = await getLocation(locId)
  return location.forecast!
}
const genForecast = (stats: {[weather: string]: number}): WeatherType => {
  // Iterate through every potential weather.
  // If a weather is not defined at all for that season, it should
  // not throw an issue and should never happen.
  if (!stats) {
    console.info('Stats are not defined')
    return 'Sunny'
  }
  const p = Math.random();
  let cummulativeOdds = 0;
  for (const [weather, odds] of Object.entries(stats)) {
    cummulativeOdds += odds;
    if (p < cummulativeOdds) return weather as WeatherType;
  }
  return 'Sunny';
}
// Run every night overnight (3am)
export const location_cron = functions.pubsub.schedule('0 3 */1 * *').onRun(async () => {
  // Get all locations
  const locations = Object.entries(Globe)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const locationDocPromises: Promise<any>[] = []
  const locationMap = {}
  const thunderstormLocations: string[] = []
  const sandstormLocations: string[] = []
  const snowLocations: string[] = []
  console.log(`Process ${locations.length} weathers`)
  // For each weather, compute its forecast
  locations.forEach(([locId, locDoc]) => {
    if (locId === '_forecasts') return
    const location = locDoc as Location
    // Potential weather for today
    const todaySeason = season(locDoc, new Date())
    const weatherMap = location[`weather${todaySeason}`]
    // Weather prediction
    const forecast = genForecast(weatherMap)
    if (forecast === 'Thunderstorm') {
      thunderstormLocations.push(locId)
    }
    if (forecast === 'Sandstorm') {
      sandstormLocations.push(locId)
    }
    if (forecast === 'Snow') {
      snowLocations.push(locId)
    }
    console.log(locId, forecast)
    locationMap[locId] = { forecast }
    locationCache.forecasts[locId] = {
      forecast,
      readDoc: false,
    }
  })
  const feebasLocation = randomItem(thunderstormLocations)
  const registeelLocation = randomItem(thunderstormLocations)
  const regiceLocation = randomItem(snowLocations)
  const regirockLocation = randomItem(sandstormLocations)
  const unownLocation = randomItem(Object.keys(locationMap))
  const unownForm = randomItem(get('potw-201')!.syncableForms!)
  console.log(`You will find Unown ${unownForm} in ${unownLocation}`)
  if (feebasLocation) {
    locationMap[feebasLocation].feebas = true
  }
  if (registeelLocation) {
    locationMap[registeelLocation].registeel = true
  }
  if (regirockLocation) {
    locationMap[regirockLocation].regirock = true
  }
  if (regiceLocation) {
    locationMap[regiceLocation].regice = true
  }
  locationMap[unownLocation].unown = unownForm
  for (const [locId, locData] of Object.entries(locationMap)) {
    console.log('Location Map:', locId)
    // Apply additional logic for niche events
    // Update document
    const forecast = (() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ('forecast' in (locData as any)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (locData as any).forecast
      }
      // New locations may not have a pre-determined forecast
      return 'Sunny'
    })()
    locationCache.forecasts[locId].forecast = forecast
    locationCache.forecasts[locId].feebas = locId === feebasLocation,
    locationCache.forecasts[locId].registeel = locId === registeelLocation,
    locationCache.forecasts[locId].regirock = locId === regirockLocation,
    locationCache.forecasts[locId].regice = locId === regiceLocation,
    locationCache.forecasts[locId].unown = locId === unownLocation ? unownForm : null,
    // All of our data is up to date now
    locationCache.forecasts[locId].readDoc = true
    locationDocPromises.push(
      // eslint-disable-next-line no-async-promise-executor
      new Promise(async (res) => {
        const ref = db.collection('locations').doc(locId)
        console.log(`Try to get doc locations/${locId}`, forecast)
        const document = await ref.get()
        if (document.exists) {
          console.log(`Update doc locations/${locId}`)
          await ref.update({
            forecast,
            feebas: locId === feebasLocation,
            registeel: locId === registeelLocation,
            regirock: locId === regirockLocation,
            regice: locId === regiceLocation,
            unown: locId === unownLocation ? unownForm : null,
          })
          res(locId)
        } else {
          console.log(`Set doc locations/${locId}`)
          await ref.set({
            forecast,
            feebas: locId === feebasLocation,
            registeel: locId === registeelLocation,
            regirock: locId === regirockLocation,
            regice: locId === regiceLocation,
            unown: locId === unownLocation ? unownForm : null,
          })
          res(locId)
        }
      })
    )
  }
  try {
    await Promise.all(locationDocPromises)
  } catch (e) {
    console.error('Cannot update all of the locations', e)
    throw new functions.https.HttpsError('cancelled', e)
  }
  // Update forecast in a single doc for cache purposes
  await db.collection('locations').doc('_forecasts').set(locationMap)
  // Report to admin console
  await db.collection('admin').doc('cron').update({
    locationCron: Date.now()
  })
  locationCache.lastDay = lastDayTimestamp() // Complete
})
export const location_list = functions.https.onCall(async (_, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('not-found', '')
  }
  if (!context.auth!.uid) {
    throw new functions.https.HttpsError('not-found', 'Not found')
  }
  const forecasts = await db.collection('locations').doc('_forecasts').get()
  const data = forecasts.data()!
  const keys = Object.keys(data).sort()
  const locations = {}
  keys.forEach(key => {
    locations[key] = {
      terrain: Globe[key].terrain,
      region: Globe[key].region,
      label: Globe[key].label,
      forecast: data[key].forecast,
      regirock: data[key].regirock,
      regice: data[key].regice,
      registeel: data[key].registeel,
      feebas: data[key].feebas,
      unown: data[key].unown,
    }
  })
  console.log('Ordered keys', keys)
  return {
    // Note: This will be limited in usefulness.
    season: season(Globe['US-MTV'], new Date()),
    events: {
      'Happy Friday': new Date().getDay() === 5,
      'Catch Rally for New Players': new Date().getDay() === 3,
      'Shiny Legendary Raids': GLOBAL_QUEST_DATE(),
      'Three-Year Anniversary': new Date().getMonth() === 7, // August
      'Pokémon Day Celebration': new Date().getMonth() === 1, // Feb
    },
    /* Stick here for now */
    breedingClub: {
      babyProduced,
      parents,
    },
    swarms: Swarms,
    locations,
  }
})