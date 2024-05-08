import { assert } from '@fleker/gents'
import spacetime from "spacetime"
import { PokemonForm } from "./pokemon/types"
import { Users } from "./server-types"
import * as SunCalc from 'suncalc'

export type TerrainType = 'Bay' | 'Beach' | 'Mountain' | 'Tropical' | 'Rural' |
  'Desert' | 'Grasslands' | 'Gardens' | 'Forest' | 'Urban' | 'Rainforest' |
  'Oceanic'

export type RegionType = 'North America' | 'South America' | 'North Europe' |
  'Mediterranean' | 'Africa / Middle East' | 'Asia' | 'Pacific Islands' |
  'Australia / New Zealand'

export type WeatherType = 'Rain' | 'Thunderstorm' | 'Cloudy' | 'Sunny' | 'Heat Wave' |
  'Snow' | 'Diamond Dust' | 'Sandstorm' | 'Fog' | 'Windy'

export type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter'

export type TimeOfDay = 'Day' | 'Night' | 'Dusk'

export interface Location {
  label: string
  /**
   * ID to use for `badge3.ts` identifier.
   * As more locations get added, ensure order remains constant
   * while keeping the map alphabetical.
   */
  id: number
  terrain: TerrainType
  region: RegionType
  weatherSpring: {[weather in WeatherType]?: number}
  weatherSummer: {[weather in WeatherType]?: number}
  weatherAutumn: {[weather in WeatherType]?: number}
  weatherWinter: {[weather in WeatherType]?: number}
  hemiLat: 'North' | 'South'
  hemiLong: 'West' | 'East'
  timezone: Timezone
  latitude: number
  longitude: number
  /**
   * Emoji flag.
   */
  flag: string
  mossyRock?: boolean
  icyRock?: boolean
  magneticField?: boolean
  /**
   * The form that Spewpa will evolve into based on location.
   * @see https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_with_form_differences#Vivillon
   */
  vivillon: PokemonForm
  /**
   * The form of Flabebe and Oricorio that will appear.
   * Where blue => purple and white/red => pink
   */
  flower?: 'red' | 'yellow' | 'orange' | 'blue' | 'white'
  /**
   * A fun fact about this office which will appear when an Unown is catchable
   * at this location.
   */
  fact: string
  /**
   * Current weather. Changes daily.
   */
  forecast?: WeatherType
  /**
   * Whether you can catch Feebas here. Changes daily.
   */
  feebas?: boolean
  /**
   * Whether you can catch Regice here. Changes daily.
   */
  regice?: boolean
  /**
   * Whether you can catch Regirock here. Changes daily.
   */
  regirock?: boolean
  /**
   * Whether you can catch Registeel here. Changes daily.
   */
  registeel?: boolean
  /**
   * Whether you can catch wild Unown here. Changes daily. Value is its form.
   */
  unown?: PokemonForm
  /**
   * For Minior, what kind of form can be found here.
   * This should be applied to locations of type 'Mountain'.
   */
  meteor?: PokemonForm
}

export const iconMap: Record<WeatherType, string> = {
  Cloudy: 'wb_cloudy',
  'Diamond Dust': 'flare',
  Fog: 'reorder',
  'Heat Wave': 'whatshot',
  Rain: 'water_drop',
  Sandstorm: 'blur_on',
  Snow: 'ac_unit',
  Sunny: 'wb_sunny',
  Thunderstorm: 'thunderstorm',
  Windy: 'air',
}

// Try to put timezone strings here for type-safety
export type Timezone =
  'Africa/Accra' |
  'Africa/Cairo' |
  'Africa/Johannesburg' |
  'Africa/Lagos' /* Africa/West */ |
  'Africa/Nairobi' /* Africa/East */ |
  'America/Argentina/Buenos_Aires' |
  'America/Bogota' |
  'America/Chicago' /* US/Central */ |
  'America/Denver' /* US/Mountain */ |
  'America/Edmonton' |
  'America/Los_Angeles' /* US/Pacific */ |
  'America/Montreal' |
  'America/New_York' /* US/Eastern */ |
  'America/Lima' |
  'America/Santiago' |
  'America/Sao_Paulo' |
  'America/Toronto' |
  'America/Vancouver' |
  'Asia/Bangkok' |
  'Asia/Dubai' |
  'Asia/Hong_Kong' |
  'Asia/Jakarta' |
  'Asia/Jerusalem' |
  'Asia/Kolkata' |
  'Asia/Kuala_Lumpur' |
  'Asia/Manila' |
  'Asia/Seoul' |
  'Asia/Shanghai' /* China Standard Time */ |
  'Asia/Singapore' |
  'Asia/Taipei' |
  'Asia/Tokyo' |
  'Australia/Melbourne' |
  'Australia/Sydney' |
  'Etc/GMT' |
  'Europe/Athens' /* Europe/Eastern */ |
  'Europe/Berlin' |
  'Europe/Bratislava' |
  'Europe/Brussels' |
  'Europe/Bucharest' |
  'Europe/Budapest' |
  'Europe/Copenhagen' |
  'Europe/Dublin' |
  'Europe/Helsinki' |
  'Europe/Istanbul' |
  'Europe/Lisbon' |
  'Europe/London' /* Europe/Western */ |
  'Europe/Madrid' |
  'Europe/Moscow' |
  'Europe/Oslo' |
  'Europe/Paris' |
  'Europe/Prague' |
  'Europe/Rome' |
  'Europe/Stockholm' |
  'Europe/Vienna' /* Europe/Central */ |
  'Europe/Vilnius' |
  'Europe/Warsaw' |
  'Europe/Zagreb' |
  'Europe/Zurich' |
  'Pacific/Auckland' |
  'US/Mountain'

const qToSeason = {
  North: {
    Q1: 'Winter',
    Q2: 'Spring',
    Q3: 'Summer',
    Q4: 'Autumn',
  },
  South: {
    Q1: 'Summer',
    Q2: 'Autumn',
    Q3: 'Winter',
    Q4: 'Spring',
  },
}

export const season = (location: Location, date: Date) => {
  const compareDates = (date1, date2) => {
    if (date1.getMonth() < date2.getMonth()) return -1
    else if (date1.getMonth() > date2.getMonth()) return 1
    else if (date1.getDate() < date2.getDate()) return -1
    else if (date1.getDate() > date2.getDate()) return 1
    else return 0;
  }

  const quarter = (() => {
    if (compareDates(date, new Date('Mar 20')) < 0) return 'Q1'
    else if (compareDates(date, new Date('Jun 21')) < 0) return 'Q2'
    else if (compareDates(date, new Date('Sep 22')) < 0) return 'Q3'
    else if (compareDates(date, new Date('Dec 21')) < 0) return 'Q4'
    else return 'Q1'
  })()

  return qToSeason[location.hemiLat][quarter]
}

export function getLocalTime(user: Users.Doc) {
  if (!user || !user.location) return spacetime()
  if (!user.location) {
    console.error(`User ${user.ldap} has no canonical location`)
  }
  if (!Globe[user.location]) {
    console.error(`Cannot get timezone of undefined location ${user.location} for ${user.ldap}`)
    return spacetime()
  }
  const {timezone} = Globe[user.location]
  let st = spacetime()
  st = st.goto(timezone)
  return st
}

export const timeOfDay = (location?: Location) => {
  if (!location) return 'Day'
  const {timezone} = location
  let st = spacetime()
  st = st.goto(timezone)
  if (st.hour() > 6 && st.hour() <= 18) {
    return 'Day'
  }
  return 'Night'
}

export const isDusk = (location?: Location) => {
  if (!location) return false
  const {timezone} = location
  let st = spacetime()
  st = st.goto(timezone)
  return st.hour() === 19 // 7pm
}

export type MoonPhase = 'New Moon' | 'Waxing Crescent' | 'First Quarter' |
  'Waxing Gibbous' | 'Full Moon' | 'Waning Gibbous' | 'Last Quarter' |
  'Waning Crescent'

export function getMoonPhase(): MoonPhase {
  const {phase} = SunCalc.getMoonIllumination(new Date())
  if (phase > 0.0625 && phase <= 0.1875) {
    return 'Waxing Crescent'
  } else if (phase > 0.1875 && phase <= 0.3125) {
    return 'First Quarter'
  } else if (phase > 0.3125 && phase <= 0.4375) {
    return 'Waxing Gibbous'
  } else if (phase > 0.4375 && phase <= 0.5625) {
    return 'Full Moon'
  } else if (phase > 0.5625 && phase <= 0.6875) {
    return 'Waxing Gibbous'
  } else if (phase > 0.6875 && phase <= 0.8125) {
    return 'Last Quarter'
  } else if (phase > 0.8125 && phase <= 0.9375) {
    return 'Waning Crescent'
  }
  return 'New Moon'
}

export type Tides = 'Low Tide' | 'High Tide'

export function getTides(location: LocationId): Tides {
  const {timezone} = Globe[location]
  let st = spacetime()
  st = st.goto(timezone)
  const hours = st.hour()
  // Simplification
  if (hours < 6 || (hours >= 12 && hours < 18)) {
    return 'Low Tide'
  }
  return 'High Tide'
}

export function getTidesByLocation(location?: Location): Tides {
  if (!location) return 'Low Tide'
  const {timezone} = location
  let st = spacetime()
  st = st.goto(timezone)
  const hours = st.hour()
  // Simplification
  if (hours < 6 || (hours >= 12 && hours < 18)) {
    return 'Low Tide'
  }
  return 'High Tide'
}

export function isLocationMassiveOutbreak(location: Location, forecast?: WeatherType): boolean {
  if (forecast) {
    location.forecast = forecast
  }
  if (location.forecast === undefined || location.forecast === 'Sunny') return false
  let st = spacetime()
  st = st.goto(location.timezone)
  const hours = st.hour()
  const minutes = st.minute()
  if (minutes < 25 || minutes > 35) return false
  const lonDecade = Math.floor(location.latitude / 10)
  // Corresponds the longitude decade to the time-of-day hour where that longitude operates
  const hourLatArray = [
    -13, // longitude -130 to -120.01
    -12, -11, -10, -9, -8,    // 6 hours
    -6, -5, -1, 0, 1, 2,      // 12 hours
    3, 5, 7, 10, 11, 12,      // 18 hours
    13, 14, 15, 17,           // 22 hours
    0, -1,                    // Overlap
  ]
  return lonDecade === hourLatArray[hours]
}

/**
 * In this game, a solar eclipse will occur every full moon but in different
 * locations. Technically this isn't how it happens in real life, but can lead
 * to different and interesting gameplay.
 * 
 * When there is a full moon, then the latitude also needs to be computed. The
 * latitude decade combined with a synthetic timing metric determines if the
 * eclipse can be spotted in that location.
 *
 * As there are huge gaps in land, like the oceans, it's possible eclipses may
 * not occur in any given month. In PotW, latitudes techincally just go between
 * -41 and 61 (decades -5 to 6).
 * 
 * Also, an eclipse needs to happen during the day or you wouldn't notice it
 * in the first place lol.
 */
export function isEclipse(location: Location): boolean {
  if (timeOfDay(location) !== 'Day') return false
  const lonDecade = Math.floor(location.longitude / 10)
  let st = spacetime()
  st = st.goto(location.timezone)
  const year = st.year()
  const month = st.month()
  const eclipsePeriod = (year - 1) * 12 + month
  const eclipseOverflow = eclipsePeriod % 36 // Divided into 36 longitude decades
  return lonDecade === eclipseOverflow
}

export const Globe = {
  'AE-DXB': assert<Location>({
    label: 'Dubai', region: 'Africa / Middle East', terrain: 'Desert', flag: '🇦🇪', id: 1,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Asia/Dubai', vivillon: 'sandstorm',
    latitude: 25.20, longitude: 55.27,
    fact: 'This city has a Nol card to take the train.',
    weatherSpring: {Cloudy: 0.125, Fog: 0.1, 'Heat Wave': 0.1, Rain: 0.025, Sandstorm: 0.125, Windy: 0.025},
    weatherSummer: {Cloudy: 0.125, Fog: 0.1, 'Heat Wave': 0.2, Rain: 0.025, Sandstorm: 0.125, Thunderstorm: 0.025, Windy: 0.025},
    weatherAutumn: {Cloudy: 0.125, Fog: 0.125, 'Heat Wave': 0.1, Rain: 0.025, Sandstorm: 0.125, Windy: 0.025},
    weatherWinter: {Cloudy: 0.125, Fog: 0.15, 'Heat Wave': 0.05, Rain: 0.025, Sandstorm: 0.125, Windy: 0.025},
  }),
  'AR-BUE': assert<Location>({
    label: 'Buenos Aires', region: 'South America', terrain: 'Oceanic', flag: '🇦🇷', id: 2,
    hemiLat: 'South', hemiLong: 'West', timezone: 'America/Argentina/Buenos_Aires', vivillon: 'continental',
    latitude: -34.60, longitude: -58.38,
    fact: "This city gives you a wonderful view of the Dique.",
    weatherAutumn: {Cloudy:0.175, 'Heat Wave':0.025, Rain:0.1, Fog:0.125, Thunderstorm:0.05, Snow:0.01},
    weatherWinter: {Cloudy:0.2, "Diamond Dust":0.0015, Snow:0.175, Fog:0.15, Rain:0.125},
    weatherSpring: {Cloudy:0.175, Rain:0.1, Snow:0.025, Thunderstorm:0.05, Fog:0.125, 'Heat Wave':0.025},
    weatherSummer: {Cloudy:0.175, 'Heat Wave':0.1, Thunderstorm:0.1, Fog:0.1, Rain:0.075},
  }),
  'AT-VIE': assert<Location>({
    label:"Vienna", region:"North Europe", terrain:"Urban", flag: '🇦🇹', id: 3,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Vienna', vivillon: 'polar',
    latitude: 48.21, longitude: 16.37,
    fact: "This city is notable for its old coffee houses.",
    weatherSpring:{Thunderstorm:0.05,Fog:0.025,Cloudy:0.2,Rain:0.15, Windy: 0.025},
    weatherSummer:{Cloudy:0.2,Thunderstorm:0.1,Rain:0.1,Fog:0.01, Windy: 0.025},
    weatherAutumn:{Cloudy:0.2,Thunderstorm:0.01,Snow:0.025,Fog:0.025,Rain:0.1, Windy: 0.025},
    weatherWinter:{Rain:0.1,Fog:0.075,"Diamond Dust":0.0025,Snow:0.175,Cloudy:0.2, Windy: 0.025},
  }),
  'AU-MEL': assert<Location>({
    label:"Melbourne", region:"Australia / New Zealand", terrain:"Oceanic", flag: '🇦🇺', id: 4,
    hemiLat: 'South', hemiLong: 'East', timezone: 'Australia/Melbourne', vivillon: 'river',
    latitude: -37.81, longitude: 144.96,
    fact: "This city lets you grab breakfast and lunch with Vic.",
    weatherAutumn:{'Heat Wave':0.025,Thunderstorm:0.05,Fog:0.1,Cloudy:0.1,Rain:0.05, Windy: 0.05},
    weatherWinter:{Fog:0.15,"Diamond Dust":0.005,Snow:0.1,Rain:0.075,Cloudy:0.15, Windy: 0.05},
    weatherSpring:{Rain:0.1,Fog:0.1,Thunderstorm:0.05,Cloudy:0.1, Windy: 0.05},
    weatherSummer:{'Heat Wave':0.05,Cloudy:0.075,Fog:0.075,Thunderstorm:0.125,Rain:0.025, Windy: 0.05},
  }),
  'AU-SYD': assert<Location>({
    label:"Sydney", region:"Australia / New Zealand", terrain:"Oceanic", flag: '🇦🇺', id: 5,
    hemiLat: 'South', hemiLong: 'East', timezone: 'Australia/Sydney', vivillon: 'river',
    latitude: -33.87, longitude: 151.21,
    fact: "This is the oldest city on the continent.",
    weatherAutumn:{Fog:0.1,Cloudy:0.15,Rain:0.1,Thunderstorm:0.1, Windy: 0.05},
    weatherWinter:{Rain:0.05,Thunderstorm:0.05,Fog:0.1,Snow:0.15,Cloudy:0.15, Windy: 0.05},
    weatherSpring:{Rain:0.1,Thunderstorm:0.1,Snow:0.025,Fog:0.1,Cloudy:0.15, Windy: 0.05},
    weatherSummer:{Fog:0.1,Rain:0.1,Cloudy:0.15,'Heat Wave':0.15,Thunderstorm:0.2, Windy: 0.05},
  }),
  'BE-BRU': assert<Location>({
    label:"Brussels", region:"North Europe", terrain:"Urban", flag: '🇧🇪', id: 6,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Brussels', vivillon: 'polar',
    latitude: 50.85, longitude: 4.36,
    fact: 'Get some chocolate while visiting this city, home of two famed choclatiers.',
    weatherSpring:{Cloudy:0.25, Rain:0.1, Snow:0.025},
    weatherSummer:{Thunderstorm:0.1,'Heat Wave':0.025,Rain:0.05,Cloudy:0.25},
    weatherAutumn:{Cloudy:0.25,Snow:0.025,Rain:0.1},
    weatherWinter:{"Diamond Dust":0.005,Cloudy:0.25,Rain:0.05,Snow:0.175}
  }),
  'BE-GBL': assert<Location>({
    label:"Baudour", region:"North Europe", terrain:"Grasslands", flag: '🇧🇪', id: 7,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Brussels', vivillon: 'polar',
    latitude: 50.48, longitude: 3.84,
    fact: "One famed industry is its lacemaking, dating back centuries.",
    weatherSpring:{Cloudy:0.2,'Heat Wave':0.01,Rain:0.15},
    weatherSummer:{Rain:0.05,'Heat Wave':0.075,Cloudy:0.2,Thunderstorm:0.125},
    weatherAutumn:{Snow:0.025,Rain:0.15,'Heat Wave':0.025,Cloudy:0.2},
    weatherWinter:{"Diamond Dust":0.005,Rain:0.05,Snow:0.175,Cloudy:0.225},
  }),
  'BR-BHZ': assert<Location>({
    label:"Belo Horizonte", region:"South America", terrain:"Rainforest", mossyRock: true, flag: '🇧🇷', id: 8,
    hemiLat: 'South', hemiLong: 'West', timezone: 'America/Sao_Paulo', vivillon: 'marine',
    latitude: -19.92, longitude: -43.94,
    fact: 'Where else but this city can you visit a beauty salon before the ball pit?',
    weatherAutumn:{Cloudy:0.1,Thunderstorm:0.1,Rain:0.1,Fog:0.1},
    weatherWinter:{Rain:0.175,Cloudy:0.1,Thunderstorm:0.025,Fog:0.1,'Heat Wave':0.025},
    weatherSpring:{Thunderstorm:0.05,Rain:0.125,'Heat Wave':0.025,Cloudy:0.1},
    weatherSummer:{'Heat Wave':0.1,Thunderstorm:0.15,Cloudy:0.1,Rain:0.05},
  }),
  'BR-GRU': assert<Location>({
    label:"Guarulhos", region:"South America", terrain:"Rainforest", mossyRock: true, flag: '🇧🇷', id: 9,
    hemiLat: 'South', hemiLong: 'West', timezone: 'America/Sao_Paulo', vivillon: 'marine',
    latitude: -23.45, longitude: -46.53,
    fact: "This city has a data center on an unnamed road.",
    weatherAutumn:{Fog:0.15,Rain:0.125,Thunderstorm:0.125,'Heat Wave':0.025,Cloudy:0.225},
    weatherWinter:{Thunderstorm:0.025,Rain:0.175,Fog:0.175,Cloudy:0.225,'Heat Wave':0.025},
    weatherSpring:{Cloudy:0.225,'Heat Wave':0.025,Thunderstorm:0.1,Fog:0.15,Rain:0.15},
    weatherSummer:{Rain:0.1,Cloudy:0.225,Thunderstorm:0.15,Fog:0.125,'Heat Wave':0.125},
  }),
  'BR-PRA': assert<Location>({
    label:"Praja Grande", region:"South America", terrain:"Rainforest", mossyRock: true, flag: '🇧🇷', id: 10,
    hemiLat: 'South', hemiLong: 'West', timezone: 'America/Sao_Paulo', vivillon: 'marine',
    latitude: -24.01, longitude: -46.41,
    fact: "While ships may enter a port, this city is where cables land.",
    weatherAutumn:{Fog:0.15,Cloudy:0.225,Rain:0.125,'Heat Wave':0.05,Thunderstorm:0.125},
    weatherWinter:{Cloudy:0.225,Thunderstorm:0.05,Fog:0.175,Rain:0.175,'Heat Wave':0.025},
    weatherSpring:{Thunderstorm:0.1,Fog:0.15,Rain:0.15,Cloudy:0.225,'Heat Wave':0.025},
    weatherSummer:{Cloudy:0.225,'Heat Wave':0.1,Rain:0.1,Fog:0.125,Thunderstorm:0.175},
  }),
  'BR-RIO': assert<Location>({
    label:"Rio de Janeiro", region:"South America", terrain:"Rainforest", mossyRock: true, flag: '🇧🇷', id: 11,
    hemiLat: 'South', hemiLong: 'West', timezone: 'America/Sao_Paulo', vivillon: 'marine',
    latitude: -22.91, longitude: -43.17,
    fact: "This city has a YouTube space overlooking a bay.",
    weatherAutumn:{Cloudy:0.225,'Heat Wave':0.025,Fog:0.125,Rain:0.175,Thunderstorm:0.125},
    weatherWinter:{Cloudy:0.225,Fog:0.125,Thunderstorm:0.05,Rain:0.2,'Heat Wave':0.025},
    weatherSpring:{Thunderstorm:0.125,Fog:0.125,Cloudy:0.225,Rain:0.175,'Heat Wave':0.025},
    weatherSummer:{Fog:0.075,'Heat Wave':0.125,Thunderstorm:0.175,Cloudy:0.2,Rain:0.1}
  }),
  'BR-SAO': assert<Location>({
    label:"Sao Paulo", region:"South America", terrain:"Rainforest", mossyRock: true, flag: '🇧🇷', id: 12,
    hemiLat: 'South', hemiLong: 'West', timezone: 'America/Sao_Paulo', vivillon: 'marine',
    latitude: -23.56, longitude: -46.64,
    fact: "You cannot digitize food, but this city has gigabytes of it.",
    weatherAutumn:{Rain:0.15,Cloudy:0.15,Fog:0.1},
    weatherWinter:{Cloudy:0.15,Snow:0.025,Fog:0.1,Rain:0.125,'Heat Wave':0.025},
    weatherSpring:{Rain:0.125,Fog:0.1,'Heat Wave':0.025,Thunderstorm:0.025,Cloudy:0.15},
    weatherSummer:{Cloudy:0.15,Rain:0.075,Thunderstorm:0.125,Fog:0.1,'Heat Wave':0.1},
  }),
  'CA-CAL': assert<Location>({
    label:"Calgary", region:"North America", terrain:"Mountain", magneticField: true, flag: '🇨🇦', id: 13,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Denver', vivillon: 'icysnow', meteor: 'blue_meteor',
    latitude: 51.04, longitude: -114.07,
    fact: "This city has an Ursaring proof garbage bin.",
    weatherSpring:{Rain:0.1,Cloudy:0.15,Snow:0.075,Fog:0.125, Windy: 0.05},
    weatherSummer:{Rain:0.075,Fog:0.1,'Heat Wave':0.01,Thunderstorm:0.075,Cloudy:0.15, Windy: 0.05},
    weatherAutumn:{Fog:0.125,Rain:0.125,Cloudy:0.175, Snow: 0.075, Windy: 0.05},
    weatherWinter:{Fog:0.15,Snow:0.25,Cloudy:0.225,Rain:0.05,"Diamond Dust":0.01, Windy: 0.05},
  }),
  'CA-MON': assert<Location>({
    label:"Montreal", region:"North America", terrain:"Rural", flag: '🇨🇦', id: 14,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Montreal', vivillon: 'icysnow',
    latitude: 45.50, longitude: -73.57,
    fact: "People from this city use a distinct rubber tire subway system.",
    weatherSpring:{Rain:0.1,Snow:0.05,Fog:0.05,Cloudy:0.15,Thunderstorm:0.05, Windy: 0.025},
    weatherSummer:{Fog:0.05,Rain:0.1,Thunderstorm:0.1,Cloudy:0.15, Windy: 0.025},
    weatherAutumn:{Rain:0.15,Snow:0.05,Fog:0.05,Cloudy:0.15, Windy: 0.025},
    weatherWinter:{"Diamond Dust":0.01,Rain:0.05,Fog:0.05,Cloudy:0.15,Snow:0.2, Windy: 0.025},
  }),
  'CA-OTT': assert<Location>({
    label:"Ottawa", region:"North America", terrain:"Grasslands", flag: '🇨🇦', id: 15,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/New_York', vivillon: 'icysnow',
    latitude: 45.42, longitude: -75.70,
    fact: "Do you like skating? This place features the world's longest rink.",
    weatherSpring:{Fog:0.05,Cloudy:0.2,Rain:0.1,Snow:0.05, Windy: 0.025},
    weatherSummer:{Cloudy:0.175,Rain:0.1,Thunderstorm:0.05,'Heat Wave':0.025,Fog:0.025, Windy: 0.025},
    weatherAutumn:{Cloudy:0.2,Snow:0.05,Fog:0.075,Rain:0.1, Windy: 0.025},
    weatherWinter:{Cloudy:0.225,Snow:0.225,"Diamond Dust":0.008,Fog:0.125, Windy: 0.025},
  }),
  'CA-TOR': assert<Location>({
    label:"Toronto", region:"North America", terrain:"Bay", flag: '🇨🇦', id: 16,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Toronto', vivillon: 'icysnow',
    latitude: 43.65, longitude: -79.38,
    fact: "This city was given its name for being the place where trees stand in the water.",
    weatherWinter:{Rain:0.025,"Diamond Dust":0.0075,Fog:0.175,Cloudy:0.25,Snow:0.225, Windy: 0.025},
    weatherAutumn:{Rain:0.125,Cloudy:0.225,Snow:0.05,Fog:0.125, Windy: 0.025},
    weatherSpring:{Rain:0.15,Fog:0.125,Snow:0.05,Cloudy:0.2, Windy: 0.025},
    weatherSummer:{'Heat Wave':0.025,Rain:0.1,Cloudy:0.2,Fog:0.1,Thunderstorm:0.075, Windy: 0.025}
  }),
  'CA-VAN': assert<Location>({
    label:"Vancouver", region:"North America", terrain:"Bay", flag: '🇨🇦', id: 17,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Vancouver', vivillon: 'icysnow',
    latitude: 49.28, longitude: -123.12,
    fact: 'This city has a large park with an aquarium and petting zoo.',
    weatherSpring:{Fog:0.2,Cloudy:0.25,Rain:0.125,Snow:0.05, Windy: 0.025},
    weatherSummer:{'Heat Wave':0.025,Thunderstorm:0.15,Fog:0.15,Cloudy:0.25,Rain:0.1, Windy: 0.025},
    weatherAutumn:{Snow:0.05,Cloudy:0.275,Rain:0.125,Fog:0.175, Windy: 0.025},
    weatherWinter:{Snow:0.175,"Diamond Dust":0.005,Rain:0.05,Cloudy:0.3,Fog:0.225, Windy: 0.025},
  }),
  'CA-WAT': assert<Location>({
    label:"Waterloo", region:"North America", terrain:"Grasslands", flag: '🇨🇦', id: 18,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/New_York', vivillon: 'icysnow',
    latitude: 43.46, longitude: -80.52,
    fact: "This city hosts a big Oktoberfest and maple syrup festival. Don't get the two confused!",
    weatherSpring:{Snow:0.025,Fog:0.075,Cloudy:0.2,Rain:0.1, Windy: 0.025},
    weatherSummer:{Cloudy:0.2,Thunderstorm:0.075,Rain:0.075,Fog:0.05,'Heat Wave':0.075, Windy: 0.025},
    weatherAutumn:{Cloudy:0.225,Rain:0.1,Snow:0.025,Thunderstorm:0.025,Fog:0.075, Windy: 0.025},
    weatherWinter:{"Diamond Dust":0.0075,Cloudy:0.25,Fog:0.1,Rain:0.075,Snow:0.2, Windy: 0.025},
  }),
  'CA-YEG': assert<Location>({
    label:"Edmonton", region:"North America", terrain:"Rural", flag: '🇨🇦', id: 19,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Edmonton', vivillon: 'icysnow',
    latitude: 53.55, longitude: -113.49,
    fact: "This city's sole cafe is named after a famous astronomer.",
    weatherSpring:{Fog:0.025,Cloudy:0.125,"Diamond Dust":0.001,Rain:0.075,Snow:0.075, Windy: 0.025},
    weatherSummer:{Fog:0.01,Rain:0.075,Thunderstorm:0.05,Cloudy:0.15, Windy: 0.025},
    weatherAutumn:{Rain:0.075,Fog:0.025,Snow:0.075,Cloudy:0.15, Windy: 0.025},
    weatherWinter:{Fog:0.05,Cloudy:0.175,"Diamond Dust":0.01,Snow:0.275,Rain:0.05, Windy: 0.025},
  }),
  'CH-ZRH': assert<Location>({
    label:"Zürich", region:"North Europe", terrain:"Mountain", flag: '🇨🇭', id: 20,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Zurich', vivillon: 'polar', meteor: 'green_meteor',
    latitude: 47.38, longitude: 8.54,
    fact: "This city has a cafe without spoons or knives.",
    weatherSpring:{Cloudy:0.25,Rain:0.1,Fog:0.1,"Diamond Dust":0.001,Snow:0.1, Windy: 0.05},
    weatherSummer:{Cloudy:0.25,Rain:0.1,Fog:0.1,Thunderstorm:0.1,'Heat Wave':0.05, Windy: 0.05},
    weatherAutumn:{Cloudy:0.25,Rain:0.1,Snow:0.075,Thunderstorm:0.05,Fog:0.1,"Diamond Dust":0.001, Windy: 0.05},
    weatherWinter:{Cloudy:0.2,"Diamond Dust":0.025,Fog:0.1,Snow:0.25, Windy: 0.05},
  }),
  'CL-SCL': assert<Location>({
    label:"Santiago", region:"South America", terrain:"Mountain", flag: '🇨🇱', id: 21,
    hemiLat: 'South', hemiLong: 'West', timezone: 'America/Santiago', vivillon: 'marine', meteor: 'indigo_meteor',
    latitude: -33.45, longitude: -70.67,
    fact: "This city has a cafe named after a Nobel Prize-winning poet.",
    weatherAutumn:{Fog:0.125,Rain:0.1,Thunderstorm:0.05,Cloudy:0.2, Snow: 0.01, Windy: 0.025},
    weatherWinter:{Snow:0.125,Rain:0.075,Fog:0.15,"Diamond Dust":0.001,Cloudy:0.225, Windy: 0.025},
    weatherSpring:{Snow:0.025,Cloudy:0.15,Rain:0.125,Fog:0.125,'Heat Wave':0.01, Windy: 0.025},
    weatherSummer:{Rain:0.075,Fog:0.1,Cloudy:0.175,'Heat Wave':0.075,Thunderstorm:0.15, Windy: 0.025},
  }),
  'CN-GUA': assert<Location>({
    label:"Guangzhou", region:"Asia", terrain:"Urban", flag: '🇨🇳', id: 22,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Asia/Shanghai', vivillon: 'continental',
    latitude: 23.13, longitude: 113.26,
    fact: 'This city is known as the "City of Flowers".',
    weatherSpring:{'Heat Wave':0.025,Rain:0.1,Thunderstorm:0.025,Cloudy:0.15,Fog:0.15},
    weatherSummer:{Fog:0.175,Thunderstorm:0.1,Cloudy:0.15,'Heat Wave':0.1,Rain:0.05},
    weatherAutumn:{Thunderstorm:0.025,Rain:0.125,Fog:0.15,'Heat Wave':0.025,Cloudy:0.15},
    weatherWinter:{Rain:0.125,Snow:0.125,Cloudy:0.175,Fog:0.175,"Diamond Dust":0.0025},
  }),
  'CN-PEK': assert<Location>({
    label:"Beijing", region:"Asia", terrain:"Urban", flag: '🇨🇳', id: 23,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Asia/Shanghai', vivillon: 'continental',
    latitude: 39.9, longitude: 116.41,
    fact: "This city includes a smaller, forbidden city.",
    weatherSpring:{'Heat Wave':0.025,Snow:0.025,Rain:0.1,Fog:0.2,Cloudy:0.2},
    weatherSummer:{'Heat Wave':0.1,Fog:0.25,Thunderstorm:0.1,Cloudy:0.2,Rain:0.075},
    weatherAutumn:{Thunderstorm:0.025,Snow:0.025,Cloudy:0.2,Fog:0.2,Rain:0.1},
    weatherWinter:{Snow:0.15,Cloudy:0.225,"Diamond Dust":0.0025,Rain:0.05,Fog:0.2},
  }),
  'CN-SHA': assert<Location>({
    label:"Shanghai", region:"Asia", terrain:"Urban", flag: '🇨🇳', id: 24,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Asia/Shanghai', vivillon: 'continental',
    latitude: 31.23, longitude: 121.47,
    fact: "This coastal city literally means 'Upon the Sea'.",
    weatherSpring:{'Heat Wave':0.025,Cloudy:0.2,Rain:0.1,Fog:0.15},
    weatherSummer:{'Heat Wave':0.125,Cloudy:0.2,Thunderstorm:0.1,Rain:0.1,Fog:0.2},
    weatherAutumn:{Fog:0.2,Thunderstorm:0.025,Cloudy:0.2,Rain:0.1},
    weatherWinter:{Fog:0.225,Snow:0.1,Cloudy:0.2,Rain:0.05}
  }),
  'CN-SZX': assert<Location>({
    label:"Shenzhen", region:"Asia", terrain:"Urban", flag: '🇨🇳', id: 25,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Asia/Shanghai', vivillon: 'continental',
    latitude: 22.54, longitude: 114.06,
    fact: "This city has Pearly water at its beaches.",
    weatherSpring:{Rain:0.125,Cloudy:0.175,'Heat Wave':0.025,Fog:0.15},
    weatherSummer:{Fog:0.15,Thunderstorm:0.1,Rain:0.1,'Heat Wave':0.1,Cloudy:0.175},
    weatherAutumn:{Cloudy:0.175,'Heat Wave':0.01,Rain:0.125,Fog:0.15,Thunderstorm:0.025},
    weatherWinter:{Fog:0.175,"Diamond Dust":0.0025,Snow:0.1,Cloudy:0.2,Rain:0.1},
  }),
  'CO-BOG': assert<Location>({
    label:"Bogota", region:"South America", terrain:"Rainforest", flag: '🇨🇴', id: 26,
    hemiLat: 'South', hemiLong: 'West', timezone: 'America/Bogota', vivillon: 'archipelago',
    latitude: 4.70, longitude: -74.07,
    fact: "Take advantage of the largest cable car system in the world here.",
    weatherAutumn:{Rain:0.1,Cloudy:0.15,Thunderstorm:0.2,"Sunny":0.5},
    weatherWinter:{Thunderstorm:0.25,"Sunny":0.5,Rain:0.05,Snow:0.01,'Heat Wave':0.05},
    weatherSpring:{Rain:0.1,"Sunny":0.5,'Heat Wave':0.05,Thunderstorm:0.2,Cloudy:0.1},
    weatherSummer:{Thunderstorm:0.25,'Heat Wave':0.2,Rain:0.1,Cloudy:0.1,"Sunny":0.35},
  }),
  'CZ-PRG': assert<Location>({
    label:"Prague", region: "North Europe", terrain:"Grasslands", flag: '🇨🇿', id: 27,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Prague', vivillon: 'polar',
    latitude: 50.10, longitude: 14.42,
    fact: "This city is known for its hundred spires.",
    weatherSpring:{Cloudy:0.25,Thunderstorm:0.025,Rain:0.125, Snow: 0.01, Windy: 0.025},
    weatherSummer:{Rain:0.1,'Heat Wave':0.025,Thunderstorm:0.1,Cloudy:0.25, Windy: 0.025},
    weatherAutumn:{Cloudy:0.275,Rain:0.125,Thunderstorm:0.025, Snow: 0.01, Windy: 0.025},
    weatherWinter:{"Diamond Dust":0.005,Cloudy:0.275,Snow:0.125,Rain:0.075, Windy: 0.025},
  }),
  'DE-BER': assert<Location>({
    label:"Berlin", region:"North Europe", terrain:"Urban", flag: '🇩🇪', id: 28,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Berlin', vivillon: 'continental',
    latitude: 51.52, longitude: 13.40,
    fact: "This city is known for not having a wall.",
    weatherSpring:{Cloudy:0.225,Rain:0.1,Snow:0.025},
    weatherSummer:{'Heat Wave':0.025,Rain:0.075,Thunderstorm:0.075,Cloudy:0.225},
    weatherAutumn:{Rain:0.1,Snow:0.025,Cloudy:0.225},
    weatherWinter:{"Diamond Dust":0.005,Rain:0.1,Cloudy:0.25,Snow:0.2},
  }),
  'DE-FRA': assert<Location>({
    label:"Frankfurt", region:"North Europe", terrain:"Grasslands", flag: '🇩🇪', id: 29,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Berlin', vivillon: 'continental',
    latitude: 50.12, longitude: 8.70,
    fact: "This city's name comes from 'Franks Ford'.",
    weatherSpring:{Cloudy:0.25,Fog:0.05,Thunderstorm:0.01,Rain:0.15, Snow: 0.01, Windy: 0.03},
    weatherSummer:{Cloudy:0.25,Thunderstorm:0.1,'Heat Wave':0.075,Rain:0.075, Windy: 0.03},
    weatherAutumn:{Fog:0.075,Rain:0.1,Cloudy:0.25,Snow:0.025,Thunderstorm:0.025, Windy: 0.03},
    weatherWinter:{Cloudy:0.275,"Diamond Dust":0.005,Rain:0.05,Snow:0.175,Fog:0.125, Windy: 0.03},
  }),
  'DE-HAM': assert<Location>({
    label:"Hamburg", region:"North Europe", terrain:"Bay", flag: '🇩🇪', id: 30,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Berlin', vivillon: 'continental',
    latitude: 53.58, longitude: 9.99,
    fact: "If you like small trains, you sould visit this city.",
    weatherSpring:{Snow:0.025,Fog:0.1,Cloudy:0.15,Rain:0.1, Windy: 0.025},
    weatherSummer:{Fog:0.1,Cloudy:0.15,Rain:0.05,Thunderstorm:0.1, Windy: 0.025},
    weatherAutumn:{Rain:0.1,Thunderstorm:0.05,Fog:0.1,Cloudy:0.15, Snow: 0.05, Windy: 0.025},
    weatherWinter:{Cloudy:0.15,Fog:0.1,"Diamond Dust":0.005,Snow:0.2,Rain:0.05, Windy: 0.025},
  }),
  'DE-MUC': assert<Location>({
    label:"Munich", region:"North Europe", terrain:"Urban", flag: '🇩🇪', id: 31,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Berlin', vivillon: 'continental',
    latitude: 48.14, longitude: 11.59,
    fact: "Monks named this city and have generously shared their beverages.",
    weatherSpring:{Cloudy:0.15,Rain:0.1,Thunderstorm:0.05,Fog:0.025},
    weatherSummer:{Fog:0.025,Thunderstorm:0.125,'Heat Wave':0.075,Rain:0.05,Cloudy:0.15},
    weatherAutumn:{Fog:0.025,Rain:0.1,Cloudy:0.15, Snow: 0.025},
    weatherWinter:{Fog:0.05,Rain:0.05,Cloudy:0.15,Snow:0.1}
  }),
  'DK-AAR': assert<Location>({
    label:"Aarhus", region:"North Europe", terrain:"Bay", flag: '🇩🇰', id: 32,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Vienna', vivillon: 'continental',
    latitude: 55.68, longitude: 9.27,
    fact: "This city's sole cafe is named after a Tolkein geographical place or an art museum",
    weatherSpring:{Fog:0.15,Rain:0.175,Cloudy:0.25,Snow:0.075, Windy: 0.03},
    weatherSummer:{Rain:0.15,Fog:0.1,Thunderstorm:0.05,Cloudy:0.25, Windy: 0.03},
    weatherAutumn:{Thunderstorm:0.01,Snow:0.075,Rain:0.15,Fog:0.15,Cloudy:0.25, Windy: 0.03},
    weatherWinter:{Snow:0.25,"Diamond Dust":0.0085,Fog:0.2,Cloudy:0.25,Rain:0.05, Windy: 0.03},
  }),
  'DK-BLL': assert<Location>({
    label:"Fredericia", region:"North Europe", terrain:"Bay", flag: '🇩🇰', id: 33,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Vienna', vivillon: 'continental',
    latitude: 55.70, longitude: 9.27,
    fact: "This city's data center is not next to the foot soldier but you can get there on foot",
    weatherSpring:{Fog:0.15,Rain:0.18,Cloudy:0.25,Snow:0.07, Windy: 0.03},
    weatherSummer:{Rain:0.16,Fog:0.1,Thunderstorm:0.06,Cloudy:0.25, Windy: 0.03},
    weatherAutumn:{Thunderstorm:0.02,Snow:0.07,Rain:0.16,Fog:0.15,Cloudy:0.25, Windy: 0.03},
    weatherWinter:{Snow:0.225,"Diamond Dust":0.008,Fog:0.2,Cloudy:0.25,Rain:0.065, Windy: 0.03},
  }),
  'DK-CPH': assert<Location>({
    label:"Copenhagen", region:"North Europe", terrain:"Bay", flag: '🇩🇰', id: 34,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Copenhagen', vivillon: 'continental',
    latitude: 55.75, longitude: 9.32,
    fact: "If you are visiting this city, take some time to see oldest open air museum",
    weatherSpring:{Rain:0.15,Fog:0.1,Cloudy:0.2,Snow:0.05, Windy: 0.03},
    weatherSummer:{'Heat Wave':0.01,Rain:0.125,Cloudy:0.2,Fog:0.075,Thunderstorm:0.1, Windy: 0.03},
    weatherAutumn:{Thunderstorm:0.025,Rain:0.125,Snow:0.05,Fog:0.075,Cloudy:0.2, Windy: 0.03},
    weatherWinter:{"Diamond Dust":0.0075,Cloudy:0.25,Fog:0.125,Rain:0.05,Snow:0.2, Windy: 0.03},
  }),
  'EG-CAI': assert<Location>({
    label:"Cairo", region:"Mediterranean", terrain:"Bay", flag: '🇪🇬', id: 35,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Africa/Cairo', vivillon: 'marine',
    latitude: 29.83, longitude: 31.12,
    fact: "A city that's both to the north and downriver.",
    weatherSpring:{Fog:0.1,Sandstorm:0.125,Cloudy:0.15,'Heat Wave':0.025,Rain:0.05, Windy: 0.075},
    weatherSummer:{Sandstorm:0.125,Cloudy:0.175,Rain:0.05,Fog:0.1,'Heat Wave':0.075, Windy: 0.075},
    weatherAutumn:{Rain:0.05,Cloudy:0.15,Sandstorm:0.125,Fog:0.1,'Heat Wave':0.025, Windy: 0.075},
    weatherWinter:{Cloudy:0.15,Fog:0.15,Sandstorm:0.125,Rain:0.05,Snow:0.01, Windy: 0.075},
  }),
  'ES-MAD': assert<Location>({
    label:"Madrid", region:"North Europe", terrain:"Rural", flag: '🇪🇸', id: 36,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Madrid', vivillon: 'marine',
    latitude: 40.42, longitude: -3.66,
    fact: "When you get food here, take a look for famous paintings from the namesake.",
    weatherSpring:{Rain:0.15,'Heat Wave':0.025,Thunderstorm:0.025,Cloudy:0.15, Snow: 0.01, Windy: 0.025},
    weatherSummer:{Cloudy:0.15,Thunderstorm:0.1,Rain:0.075,'Heat Wave':0.1, Windy: 0.025},
    weatherAutumn:{Thunderstorm:0.025,Rain:0.1,Cloudy:0.15, Snow: 0.01, Windy: 0.025},
    weatherWinter:{Rain:0.075,"Diamond Dust":0.004,Cloudy:0.175,Snow:0.125, Windy: 0.025},
  }),
  'ES-MLG': assert<Location>({
    label:"Malaga", region:"Mediterranean", terrain:"Beach", flag: '🇪🇸', id: 37,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Vienna', vivillon: 'marine',
    latitude: 36.45, longitude: -5.09,
    fact: "This city may be look futuristic, but it is one of the oldest cities in Europe.",
    weatherSpring:{Thunderstorm:0.01,Cloudy:0.1,'Heat Wave':0.01,Fog:0.11,Rain:0.1, Sandstorm: 0.05, Windy: 0.05},
    weatherSummer:{'Heat Wave':0.125,Thunderstorm:0.1,Fog:0.075,Cloudy:0.1,Rain:0.075, Sandstorm: 0.05, Windy: 0.05},
    weatherAutumn:{'Heat Wave':0.01,Cloudy:0.125,Thunderstorm:0.05,Rain:0.075,Fog:0.1, Sandstorm: 0.05, Windy: 0.05},
    weatherWinter:{Rain:0.125,Fog:0.125,Cloudy:0.15,Snow:0.025, Sandstorm: 0.05, Windy: 0.05},
  }),
  'ES-REMOTE-GEN': assert<Location>({
    label:"Spain (Remote)", region:"North Europe", terrain:"Grasslands", flag: '🇪🇸', id: 38,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Vienna', vivillon: 'meadow',
    latitude: 36.55, longitude: -4.99,
    fact: "For those who live in autonomous regions, their office is also autonomous",
    weatherSpring:{Cloudy:0.15,Thunderstorm:0.05,Rain:0.15,Fog:0.1},
    weatherSummer:{Rain:0.1,Cloudy:0.15,'Heat Wave':0.05,Thunderstorm:0.15,Fog:0.1},
    weatherAutumn:{Thunderstorm:0.025,Fog:0.1,Cloudy:0.15,Rain:0.15},
    weatherWinter:{Rain:0.05,Fog:0.15,Snow:0.15,Cloudy:0.2},
  }),
  'FI-HEL': assert<Location>({
    label:"Helsinki", region:"North Europe", terrain:"Bay", icyRock: true, flag: '🇫🇮', id: 39,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Helsinki', vivillon: 'icysnow',
    latitude: 60.17, longitude: 24.94,
    fact: "This city was named after its magnificent sea cape.",
    weatherSpring:{Fog:0.1,Snow:0.05,Rain:0.1,Cloudy:0.2},
    weatherSummer:{Cloudy:0.2,Rain:0.1,Fog:0.075,Thunderstorm:0.1},
    weatherAutumn:{Cloudy:0.2,Snow:0.05,Rain:0.1,Thunderstorm:0.05,Fog:0.125},
    weatherWinter:{Fog:0.15,Cloudy:0.2,"Diamond Dust":0.005,Snow:0.2,Rain:0.05},
  }),
  'FI-LPP': assert<Location>({
    label:"Hamina", region:"North Europe", terrain:"Bay", icyRock: true, flag: '🇫🇮', id: 40,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Athens', vivillon: 'icysnow',
    latitude: 60.57, longitude: 27.19,
    fact: "This city's data center started with the purchase of a paper mill.",
    weatherSpring:{Rain:0.15,Cloudy:0.225,Fog:0.125,Snow:0.075},
    weatherSummer:{Cloudy:0.2,Thunderstorm:0.1,Fog:0.1,Rain:0.125},
    weatherAutumn:{Thunderstorm:0.025,Cloudy:0.2,Snow:0.05,Rain:0.15,Fog:0.125},
    weatherWinter:{Fog:0.175,"Diamond Dust":0.008,Rain:0.05,Snow:0.225,Cloudy:0.25},
  }),
  'FR-GNB': assert<Location>({
    label:"Grenoble", region:"North Europe", terrain: "Mountain", flag: '🇫🇷', id: 41,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Vienna', vivillon: 'meadow', meteor: 'orange_meteor',
    latitude: 45.80, longitude: 5.80,
    fact: "If you're into synchrontron radiation, you'll really enjoy this city.",
    weatherSpring:{Rain:0.125,Thunderstorm:0.01,Snow:0.05,Cloudy:0.2, Windy: 0.05},
    weatherSummer:{Rain:0.1,Thunderstorm:0.1,Cloudy:0.2,'Heat Wave':0.1, Windy: 0.05},
    weatherAutumn:{Rain:0.15,Thunderstorm:0.025,Snow:0.05,Cloudy:0.2, Windy: 0.05},
    weatherWinter:{Cloudy:0.2,Snow:0.2,"Diamond Dust":0.005,Rain:0.05, Windy: 0.05},
  }),
  'FR-PAR': assert<Location>({
    label:"Paris", region:"North Europe", terrain:"Gardens", flag: '🇫🇷', id: 42,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Paris', vivillon: 'meadow', flower: 'blue',
    latitude: 48.86, longitude: 2.35,
    fact: "From its churches, museums, and towers, this city is globally renowned for its romantic flair.",
    weatherSpring:{Cloudy:0.1,Thunderstorm:0.1,Rain:0.1, Snow: 0.01},
    weatherSummer:{'Heat Wave':0.1,Rain:0.1,Thunderstorm:0.15,Cloudy:0.1},
    weatherAutumn:{Rain:0.1,Thunderstorm:0.1,Cloudy:0.1,'Heat Wave':0.05, Snow: 0.025},
    weatherWinter:{"Diamond Dust":0.01,Rain:0.05,Cloudy:0.15,Snow:0.1,},
  }),
  'FR-RNS': assert<Location>({
    label:"Rennes", region:"North Europe", terrain:"Gardens", flag: '🇫🇷', id: 43,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Vienna', vivillon: 'meadow', flower: 'orange',
    latitude: 48.13, longitude: -1.63,
    fact: "This city has a prestigious art school that ironically teaches painting in more colors than 'Red'.",
    weatherSpring:{Thunderstorm:0.025,Rain:0.1,Cloudy:0.2, Snow: 0.01},
    weatherSummer:{Rain:0.05,Thunderstorm:0.1,Cloudy:0.2,'Heat Wave':0.05},
    weatherAutumn:{Rain:0.075,Thunderstorm:0.025,Cloudy:0.2,Snow:0.025},
    weatherWinter:{Cloudy:0.2,"Diamond Dust":0.0025,Rain:0.05,Snow:0.15},
  }),
  'GH-ACC': assert<Location>({
    label:"Accra", region:"Africa / Middle East", terrain:"Grasslands", flag: '🇬🇭', id: 44,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Africa/Accra', vivillon: 'jungle',
    latitude: 5.67, longitude: -0.16,
    fact: "This country's first president now resides in a mausoleum in the downtown of this city.",
    weatherSpring:{'Heat Wave':0.1,Cloudy:0.15,Fog:0.15,Rain:0.1,Thunderstorm:0.1, Windy: 0.05},
    weatherSummer:{Cloudy:0.15,Rain:0.01,Fog:0.15,'Heat Wave':0.2,Thunderstorm:0.2, Windy: 0.05},
    weatherAutumn:{Fog:0.15,Rain:0.1,Thunderstorm:0.1,'Heat Wave':0.1,Cloudy:0.15, Windy: 0.05},
    weatherWinter:{Fog:0.15,'Heat Wave':0.05,Thunderstorm:0.025,Cloudy:0.15,Rain:0.15, Windy: 0.05},
  }),
  'GR-ATH': assert<Location>({
    label:"Athens", region:"Mediterranean", terrain:"Bay", flag: '🇬🇷', id: 45,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Athens', vivillon: 'polar',
    latitude: 37.98, longitude: 23.74,
    fact: "This city was historically renowned for its democratic process.",
    weatherSpring:{Cloudy:0.2,Fog:0.1,Rain:0.125,Thunderstorm:0.05,'Heat Wave':0.05, Windy: 0.05},
    weatherSummer:{Rain:0.1,Cloudy:0.2,'Heat Wave':0.125,Thunderstorm:0.125,Fog:0.075, Windy: 0.05},
    weatherAutumn:{Fog:0.1,Rain:0.1,Cloudy:0.2,Thunderstorm:0.025, Windy: 0.05},
    weatherWinter:{Cloudy:0.225,Rain:0.1,Fog:0.15,"Diamond Dust":0.005,Snow:0.125, Windy: 0.05},
  }),
  'HK-HKG': assert<Location>({
    label:"Hong Kong", region:"Asia", terrain:"Urban", flag: '🇭🇰', id: 46,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Asia/Hong_Kong', vivillon: 'monsoon',
    latitude: 22.28, longitude: 114.16,
    fact: "This city has a Times Square. No, not that one.",
    weatherSpring:{'Heat Wave':0.025,Rain:0.1,Fog:0.15,Thunderstorm:0.025,Cloudy:0.15},
    weatherSummer:{Fog:0.125,'Heat Wave':0.075,Thunderstorm:0.1,Rain:0.05,Cloudy:0.15},
    weatherAutumn:{Rain:0.1,Fog:0.15,Cloudy:0.15,Thunderstorm:0.025},
    weatherWinter:{Rain:0.1,Fog:0.175,Snow:0.125,Cloudy:0.175,"Diamond Dust":0.001},
  }),
  'HR-ZAG': assert<Location>({
    label:"Zagreb", terrain:"Grasslands", region: "Mediterranean", flag: '🇭🇷', id: 47,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Zagreb', vivillon: 'polar',
    latitude: 45.71, longitude: 16.09,
    fact: "This city's name dates back to the twelfth century",
    weatherSpring:{Rain:0.1,Cloudy:0.15,Thunderstorm:0.05,Fog:0.1, Windy: 0.025},
    weatherSummer:{Cloudy:0.15,'Heat Wave':0.125,Fog:0.05,Rain:0.1,Thunderstorm:0.125, Windy: 0.025},
    weatherAutumn:{Cloudy:0.15,Rain:0.15,Fog:0.1, Windy: 0.025},
    weatherWinter:{"Diamond Dust":0.001,Cloudy:0.15,Fog:0.125,Snow:0.125,Rain:0.075, Windy: 0.025},
  }),
  'HU-BUD': assert<Location>({
    label:"Budapest", region:"North Europe", terrain:"Rural", flag: '🇭🇺', id: 48,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Budapest', vivillon: 'polar',
    latitude: 47.50, longitude: 19.05,
    fact: "When you visit this city you should bolt around to its many old bathhouses",
    weatherSpring:{Rain:0.125,'Heat Wave':0.025,Cloudy:0.2,Thunderstorm:0.025, Windy: 0.025},
    weatherSummer:{Cloudy:0.2,Thunderstorm:0.1,Rain:0.1,'Heat Wave':0.1, Windy: 0.025},
    weatherAutumn:{Thunderstorm:0.025,Cloudy:0.2,Rain:0.1, Snow: 0.025, Windy: 0.025},
    weatherWinter:{"Diamond Dust":0.0025,Cloudy:0.2,Snow:0.15,Rain:0.05, Windy: 0.025},
  }),
  'ID-CGK': assert<Location>({
    label:"Jakarta", region:"Pacific Islands", terrain:"Tropical", flag: '🇮🇩', id: 49,
    hemiLat: 'South', hemiLong: 'East', timezone: 'Asia/Jakarta', vivillon: 'sun',
    latitude: -6.13, longitude: 106.87,
    fact: "This city is among the oldest in the Southeast Asian region.",
    weatherAutumn:{Cloudy:0.1,'Heat Wave':0.1,Fog:0.15,Thunderstorm:0.05,Rain:0.15, Windy: 0.01},
    weatherWinter:{Thunderstorm:0.05,Fog:0.15,Cloudy:0.1,Rain:0.2, Windy: 0.01},
    weatherSpring:{Rain:0.15,Fog:0.15,'Heat Wave':0.05,Cloudy:0.1,Thunderstorm:0.1, Windy: 0.01},
    weatherSummer:{Rain:0.1,'Heat Wave':0.15,Thunderstorm:0.2,Cloudy:0.1,Fog:0.15, Windy: 0.01},
  }),
  'IE-DUB': assert<Location>({
    label:"Dublin", region:"North Europe", terrain:"Grasslands", flag: '🇮🇪', id: 50,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Dublin', vivillon: 'garden',
    latitude: 53.34, longitude: -8.87,
    fact: "This city's name originally means 'Black Pool'.",
    weatherSpring:{Fog:0.05,Thunderstorm:0.15,Cloudy:0.2,Rain:0.15, Snow: 0.025, Windy: 0.025},
    weatherSummer:{Fog:0.05,Cloudy:0.2,Thunderstorm:0.2,'Heat Wave':0.1,Rain:0.1, Windy: 0.025},
    weatherAutumn:{Cloudy:0.2,Snow:0.075,Fog:0.1,Thunderstorm:0.15,Rain:0.15, Windy: 0.025},
    weatherWinter:{Rain:0.05,Cloudy:0.2,"Diamond Dust":0.01,Fog:0.1,Snow:0.25,Thunderstorm:0.05, Windy: 0.025},
  }),
  'IL-HFA': assert<Location>({
    label:"Haifa", region:"Africa / Middle East", terrain:"Desert", flag: '🇮🇱', id: 51,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Asia/Jerusalem', vivillon: 'sandstorm',
    latitude: 32.79, longitude: 34.99,
    fact: "Take the 101 to this city. No, the other one.",
    weatherSpring:{Sandstorm:0.125,Fog:0.025,Cloudy:0.05,Rain:0.025, Windy: 0.03},
    weatherSummer:{Cloudy:0.05,Sandstorm:0.125,Fog:0.025,Thunderstorm:0.05,Rain:0.01,'Heat Wave':0.05, Windy: 0.03},
    weatherAutumn:{Sandstorm:0.125,Cloudy:0.05,Rain:0.025,Fog:0.025,'Heat Wave':0.025, Windy: 0.03},
    weatherWinter:{Fog:0.025,Rain:0.025,Cloudy:0.05,Sandstorm:0.125, Windy: 0.03}
  }),
  'IL-TLV': assert<Location>({
    label:"Tel Aviv", region:"Africa / Middle East", terrain:"Desert", flag: '🇮🇱', id: 52,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Asia/Jerusalem', vivillon: 'sandstorm',
    latitude: 32.09, longitude: 34.78,
    fact: "This city's name originally means 'Hill of Spring'.",
    weatherSpring:{'Heat Wave':0.1,Sandstorm:0.125,Fog:0.05,Cloudy:0.05,Rain:0.01, Windy: 0.05},
    weatherSummer:{Sandstorm:0.125,Cloudy:0.05,'Heat Wave':0.25,Fog:0.05,Rain:0.05, Windy: 0.05},
    weatherAutumn:{Sandstorm:0.125,'Heat Wave':0.1,Cloudy:0.05,Fog:0.05,Rain:0.05, Windy: 0.05},
    weatherWinter:{Rain:0.01,Fog:0.05,Cloudy:0.05,Sandstorm:0.125, Windy: 0.05}
  }),
  'IN-BLR': assert<Location>({
    label:"Bangalore", region:"Asia", terrain:"Urban", flag: '🇮🇳', id: 53,
    hemiLat: 'South', hemiLong: 'East', timezone: 'Asia/Kolkata', vivillon: 'monsoon',
    latitude: 12.97, longitude: 77.69,
    fact: "This place is known as Silicon Valley. No, the other one.",
    weatherSpring:{Rain:0.1,Cloudy:0.075,Fog:0.075},
    weatherSummer:{Cloudy:0.075,Rain:0.05,Fog:0.075, 'Heat Wave': 0.025, 'Thunderstorm': 0.1},
    weatherAutumn:{Cloudy:0.075,Rain:0.1,Fog:0.075,'Heat Wave':0.05, 'Thunderstorm': 0.1},
    weatherWinter:{'Heat Wave':0.15,Rain:0.05,Cloudy:0.075,Fog:0.075}
  }),
  'IN-HYD': assert<Location>({
    label:"Hyderabad", region:"Asia", terrain:"Urban", flag: '🇮🇳', id: 54,
    hemiLat: 'South', hemiLong: 'East', timezone: 'Asia/Kolkata', vivillon: 'monsoon',
    latitude: 16.77, longitude: 78.42,
    fact: "If this city's lake had a 'u', it would be very sweet.",
    weatherSpring:{Rain:0.125,Cloudy:0.075,Fog:0.075},
    weatherSummer:{Cloudy:0.075,Rain:0.05,Fog:0.075, 'Thunderstorm': 0.1, 'Heat Wave':0.1},
    weatherAutumn:{Cloudy:0.075,Rain:0.05,Fog:0.075,'Heat Wave':0.025, 'Thunderstorm': 0.05},
    weatherWinter:{Rain:0.1,Cloudy:0.075,Fog:0.075}
  }),
  'IT-MIL': assert<Location>({
    label:"Milan", region:"North Europe", terrain:"Grasslands", flag: '🇮🇹', id: 55,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Vienna', vivillon: 'marine',
    latitude: 45.69, longitude: 9.11,
    fact: "This city is notable for its high fashion that draws in many from around the world.",
    weatherSpring:{Thunderstorm:0.05,'Heat Wave':0.025,Cloudy:0.125,Rain:0.125, Snow: 0.01, Windy: 0.05},
    weatherSummer:{Thunderstorm:0.1,Cloudy:0.125,'Heat Wave':0.1,Rain:0.125, Windy: 0.05},
    weatherAutumn:{Cloudy:0.125,'Heat Wave':0.025,Rain:0.15, Snow: 0.025, Windy: 0.05},
    weatherWinter:{Rain:0.1,Snow:0.175,Cloudy:0.175,"Diamond Dust":0.005, Windy: 0.05},
  }),
  'IT-ROM': assert<Location>({
    label:"Rome", region:"Mediterranean", terrain:"Gardens", flag: '🇮🇹', id: 56,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Rome', vivillon: 'marine', flower: 'red',
    latitude: 41.45, longitude: 12.50,
    fact: "This city was not built in a day.",
    weatherSpring:{'Heat Wave':0.05,Thunderstorm:0.05,Rain:0.1,Cloudy:0.15, Windy: 0.05},
    weatherSummer:{Rain:0.1,Cloudy:0.15,Thunderstorm:0.15,'Heat Wave':0.15, Windy: 0.05},
    weatherAutumn:{Cloudy:0.15,Thunderstorm:0.1,Rain:0.1,'Heat Wave':0.05, Snow: 0.025, Windy: 0.05},
    weatherWinter:{Snow:0.1,Rain:0.05,Thunderstorm:0.05,Cloudy:0.15, Windy: 0.05},
  }),
  'JP-FUK': assert<Location>({
    label:"Fukuoka", region:"Asia", terrain:"Beach", flag: '🇯🇵', id: 57,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Asia/Tokyo', vivillon: 'elegant',
    latitude: 33.59, longitude: 130.60,
    fact: "This city gives you a view across the sea to another country",
    weatherSpring:{Rain:0.15,Snow:0.025,Cloudy:0.15,Fog:0.1, Sandstorm: 0.025},
    weatherSummer:{Rain:0.1,Thunderstorm:0.1,Fog:0.075,'Heat Wave':0.05,Cloudy:0.15, Sandstorm: 0.025},
    weatherAutumn:{Rain:0.125,Snow:0.025,Fog:0.1,Cloudy:0.15, Sandstorm: 0.025},
    weatherWinter:{Cloudy:0.2,"Diamond Dust":0.0025,Snow:0.15,Rain:0.05,Fog:0.15, Sandstorm: 0.025},
  }),
  'JP-KIX': assert<Location>({
    label:"Sanda", region:"Asia", terrain:"Rural", flag: '🇯🇵', id: 58,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Asia/Tokyo', vivillon: 'elegant',
    latitude: 34.34, longitude: 139.60,
    fact: "This city is named after its numerous plots of crops",
    weatherSpring:{Snow:0.025,Rain:0.1,Fog:0.01,Cloudy:0.125},
    weatherSummer:{Thunderstorm:0.1,Fog:0.01,Rain:0.1,Cloudy:0.1},
    weatherAutumn:{Rain:0.125,Cloudy:0.125,Snow:0.025,Fog:0.02},
    weatherWinter:{"Diamond Dust":0.0025,Snow:0.15,Rain:0.075,Fog:0.025,Cloudy:0.15},
  }),
  'JP-NRT': assert<Location>({
    label:"Chiba", region:"Asia", terrain:"Urban", flag: '🇯🇵', id: 59,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Asia/Tokyo', vivillon: 'elegant',
    latitude: 35.67, longitude: 141.63,
    fact: "This minor capital city has the longest monorail in the world",
    weatherSpring:{Snow:0.01,Cloudy:0.15,Rain:0.125,Fog:0.1},
    weatherSummer:{Fog:0.075,Rain:0.1,Thunderstorm:0.1,Cloudy:0.15,'Heat Wave':0.05},
    weatherAutumn:{Cloudy:0.175,Fog:0.1,Rain:0.125,Snow:0.025},
    weatherWinter:{"Diamond Dust":0.004,Snow:0.15,Fog:0.125,Cloudy:0.2,Rain:0.075},
  }),
  'JP-OSA': assert<Location>({
    label:"Osaka", region:"Asia", terrain:"Beach", flag: '🇯🇵', id: 60,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Asia/Tokyo', vivillon: 'elegant',
    latitude: 34.53, longitude: 135.59,
    fact: "This city is known for its athletic buffaloes and tigers",
    weatherSpring:{Snow:0.025,Rain:0.125,Fog:0.1,Cloudy:0.175, Sandstorm: 0.025},
    weatherSummer:{Rain:0.1,Thunderstorm:0.1,Cloudy:0.175,'Heat Wave':0.025,Fog:0.1, Sandstorm: 0.025},
    weatherAutumn:{Fog:0.125,Rain:0.125,Cloudy:0.2,Thunderstorm:0.025,Snow:0.03, Sandstorm: 0.025},
    weatherWinter:{Snow:0.125,"Diamond Dust":0.002,Fog:0.15,Cloudy:0.25,Rain:0.1, Sandstorm: 0.025},
  }),
  'JP-TOK': assert<Location>({
    label:"Tokyo", region:"Asia", terrain:"Urban", flag: '🇯🇵', id: 61,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Asia/Tokyo', vivillon: 'elegant',
    latitude: 35.69, longitude: 139.68,
    fact: "Topping 100,000, this city has the most restaurants than any other.",
    weatherSpring:{Thunderstorm:0.05,Rain:0.05,Snow:0.05,Fog:0.05,Cloudy:0.2},
    weatherSummer:{Cloudy:0.2,Thunderstorm:0.1,'Heat Wave':0.1,Rain:0.1,Fog:0.05},
    weatherAutumn:{Cloudy:0.2,Thunderstorm:0.05,Snow:0.05,Fog:0.05,Rain:0.1},
    weatherWinter:{Rain:0.05,Snow:0.2,Thunderstorm:0.05,Cloudy:0.2,Fog:0.05,"Diamond Dust":0.01},
  }),
  'KE-NBO': assert<Location>({
    label:"Nairobi", region:"Africa / Middle East", terrain:"Grasslands", flag: '🇰🇪', id: 62,
    hemiLat: 'South', hemiLong: 'East', timezone: 'Africa/Nairobi', vivillon: 'river',
    latitude: 1.29, longitude: 36.82,
    fact: 'This city is green in the day and its color at night is to be determined',
    weatherAutumn:{Thunderstorm:0.075,Rain:0.1,Cloudy:0.15,'Heat Wave':0.025, Windy: 0.025},
    weatherWinter:{Thunderstorm:0.125,Cloudy:0.2,'Heat Wave':0.1,Rain:0.075, Windy: 0.025},
    weatherSpring:{Cloudy:0.175,'Heat Wave':0.025,Rain:0.1,Thunderstorm:0.025, Windy: 0.025},
    weatherSummer:{Cloudy:0.2,Rain:0.1,Snow:0.05, Windy: 0.025},
  }),
  'KR-ICN': assert<Location>({
    label:"Anyang-Si", region:"Asia", terrain:"Beach", flag: '🇰🇷', id: 63,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Asia/Seoul', vivillon: 'continental',
    latitude: 37.4, longitude: 126.93,
    fact: "This city is livable, something that makes its citizens proud",
    weatherSpring:{Cloudy:0.175,Snow:0.025,Fog:0.1,Rain:0.175,Thunderstorm:0.05, Sandstorm: 0.025},
    weatherSummer:{Cloudy:0.15,Thunderstorm:0.125,Rain:0.1,Fog:0.075,'Heat Wave':0.05, Sandstorm: 0.025},
    weatherAutumn:{Snow:0.025,Fog:0.1,Rain:0.125,Cloudy:0.175,Thunderstorm:0.025, Sandstorm: 0.025},
    weatherWinter:{Fog:0.15,Rain:0.05,Cloudy:0.2,Snow:0.15,"Diamond Dust":0.0025, Sandstorm: 0.025},
  }),
  'KR-SEO': assert<Location>({
    label:"Seoul", region:"Asia", terrain:"Beach", flag: '🇰🇷', id: 64,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Asia/Seoul', vivillon: 'continental',
    latitude: 37.57, longitude: 126.98,
    fact: "This city's famed palace is over six hundred years old.",
    weatherSpring:{Thunderstorm:0.05,Cloudy:0.1,Rain:0.1,Snow:0.025,Fog:0.1, Sandstorm: 0.025},
    weatherSummer:{Fog:0.1,'Heat Wave':0.075,Thunderstorm:0.125,Rain:0.025,Cloudy:0.1, Sandstorm: 0.025},
    weatherAutumn:{Fog:0.1,Rain:0.075,Thunderstorm:0.075,Cloudy:0.1, Snow: 0.05, Sandstorm: 0.025},
    weatherWinter:{Fog:0.1,Cloudy:0.1,"Diamond Dust":0.005,Rain:0.05,Snow:0.15, Sandstorm: 0.025},
  }),
  'LT-VNO': assert<Location>({
    label:"Vilnius", region:"North Europe", terrain:"Rural", flag: '🇱🇹', id: 65,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Vilnius', vivillon: 'polar',
    latitude: 54.69, longitude: 25.28,
    fact: "In its old town days this city held a large Jewish population",
    weatherSpring:{Cloudy:0.2,Rain:0.1,Snow:0.025, Windy: 0.025},
    weatherSummer:{Rain:0.1,Cloudy:0.2,Thunderstorm:0.05, Windy: 0.025},
    weatherAutumn:{Cloudy:0.225,Snow:0.025,Rain:0.125, Windy: 0.025},
    weatherWinter:{"Diamond Dust":0.005,Rain:0.075,Cloudy:0.25,Snow:0.2, Windy: 0.025},
  }),
  'MX-MEX': assert<Location>({
    label:"Mexico City", region:"North America", terrain:"Desert", flag: '🇲🇽', id: 66,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Chicago', vivillon: 'archipelago',
    latitude: 19.42, longitude: -99.13,
    fact: "Not far from this city are the ruins of an ancient city now uninhabited.",
    weatherSpring:{Cloudy:0.15,Rain:0.025,Sandstorm:0.125,'Heat Wave':0.025, Windy: 0.1},
    weatherSummer:{Sandstorm:0.125,'Heat Wave':0.15,Thunderstorm:0.05,Cloudy:0.15,Rain:0.025, Windy: 0.1},
    weatherAutumn:{Sandstorm:0.125,'Heat Wave':0.05,Rain:0.025,Cloudy:0.15, Windy: 0.1},
    weatherWinter:{Cloudy:0.15,Rain:0.05,Sandstorm:0.125, Windy: 0.1},
  }),
  'MY-KUL': assert<Location>({
    label:"Kuala Lumpur", region:"Pacific Islands", terrain:"Tropical", flag: '🇲🇾', id: 67,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Asia/Kuala_Lumpur', vivillon: 'jungle',
    latitude: 3.16, longitude: 101.71,
    fact: "Two rivers join in this city, though it is no longer muddy",
    weatherSpring:{Rain:0.1,Fog:0.05, Thunderstorm:0.15,Cloudy:0.1,'Heat Wave':0.05},
    weatherSummer:{Thunderstorm:0.1,Cloudy:0.1,Fog:0.05,Rain:0.15},
    weatherAutumn:{Thunderstorm:0.15,Fog:0.05,Rain:0.15,'Heat Wave':0.05,Cloudy:0.1},
    weatherWinter:{Cloudy:0.1,'Heat Wave':0.15,Thunderstorm:0.2,Fog:0.05,Rain:0.1},
  }),
  'NE-AKL': assert<Location>({
    label: "Auckland", region:"Australia / New Zealand", terrain:"Oceanic", flag: '🇳🇿', id: 159,
    hemiLat: 'South', hemiLong: 'East', timezone: 'Australia/Sydney', vivillon: 'river',
    latitude: -36.85, longitude: 174.76,
    fact: "This is known as the City of Sails.",
    weatherAutumn:{Fog:0.125,Cloudy:0.1,Rain:0.15,Thunderstorm:0.125, Windy: 0.1},
    weatherWinter:{Rain:0.075,Thunderstorm:0.10,Fog:0.125,Cloudy:0.10, Windy: 0.1},
    weatherSpring:{Rain:0.125,Thunderstorm:0.1,Fog:0.125,Cloudy:0.10, Windy: 0.1},
    weatherSummer:{Fog:0.125,Rain:0.10,Cloudy:0.05,'Heat Wave':0.15,Thunderstorm:0.2, Windy: 0.1},
  }),
  'NG-LAG': assert<Location>({
    label:"Lagos", region:"Africa / Middle East", terrain:"Beach", flag: '🇳🇬', id: 68,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Africa/Lagos', vivillon: 'river',
    latitude: 6.52, longitude: 3.38,
    fact: "This coastal city has a park where you're free to listen to concerts",
    weatherSpring:{Fog:0.1,Rain:0.15,Cloudy:0.175,Thunderstorm:0.05,'Heat Wave':0.05, Sandstorm: 0.025},
    weatherSummer:{Rain:0.075,Thunderstorm:0.2,'Heat Wave':0.25,Fog:0.1,Cloudy:0.175, Sandstorm: 0.025},
    weatherAutumn:{Fog:0.125,Cloudy:0.175,Thunderstorm:0.1,Rain:0.1,'Heat Wave':0.1, Sandstorm: 0.025},
    weatherWinter:{Rain:0.125,Fog:0.15,Thunderstorm:0.025,Cloudy:0.175,'Heat Wave':0.025, Sandstorm: 0.025}
  }),
  'NL-AMS': assert<Location>({
    label:"Amsterdam", region:"North Europe", terrain:"Bay", flag: '🇳🇱', id: 158,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Vienna', vivillon: 'polar',
    latitude: 52.36, longitude: 4.90,
    fact: "This city is known for its museum of a famed painter",
    weatherSpring:{Rain:0.10,Fog:0.15,Snow:0.125,Cloudy:0.175,"Diamond Dust":0.0025},
    weatherSummer:{Rain:0.125,Fog:0.125,'Heat Wave':0.025,Cloudy:0.2,Thunderstorm:0.025},
    weatherAutumn:{Fog:0.15,Rain:0.10,Cloudy:0.175,Snow:0.075},
    weatherWinter:{Cloudy:0.2,"Diamond Dust":0.008,Snow:0.25,Rain:0.025,Fog:0.175},
  }),
  'NL-GRQ': assert<Location>({
    label:"Groningen", region:"North Europe", terrain:"Bay", flag: '🇳🇱', id: 69,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Vienna', vivillon: 'polar',
    latitude: 52.92, longitude: 5.97,
    fact: "This city is known for its film festival of bikers",
    weatherSpring:{Rain:0.125,Fog:0.15,Snow:0.1,Cloudy:0.175,"Diamond Dust":0.0025},
    weatherSummer:{Rain:0.1,Fog:0.125,'Heat Wave':0.025,Cloudy:0.175,Thunderstorm:0.025},
    weatherAutumn:{Fog:0.15,Rain:0.125,Cloudy:0.175,Snow:0.05},
    weatherWinter:{Cloudy:0.2,"Diamond Dust":0.0075,Snow:0.225,Rain:0.05,Fog:0.175},
  }),
  'NO-OSL': assert<Location>({
    label:"Oslo", region:"North Europe", terrain:"Bay", flag: '🇳🇴', id: 70,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Oslo', vivillon: 'tundra',
    latitude: 59.96, longitude: 10.46,
    fact: "Visiting the city's muesums will make you want to scream.",
    weatherSpring:{Fog:0.125,Cloudy:0.15,Snow:0.1,"Diamond Dust":0.001,Rain:0.075},
    weatherSummer:{Fog:0.1,Cloudy:0.175,Rain:0.125},
    weatherAutumn:{Snow:0.075,Rain:0.1,Fog:0.125,"Diamond Dust":0.001,Cloudy:0.2},
    weatherWinter:{Cloudy:0.225,Snow:0.25,Fog:0.15,"Diamond Dust":0.0085,Rain:0.025},
  }),
  'NZ-AKL': assert<Location>({
    label:"Auckland", region:"Australia / New Zealand", terrain:"Oceanic", flag: '🇳🇿', id: 71,
    hemiLat: 'South', hemiLong: 'East', timezone: 'Pacific/Auckland', vivillon: 'garden',
    latitude: -36.90, longitude: 174.81,
    fact: "This city has been constructed on top of over fifty volcanoes.",
    weatherAutumn:{Fog:0.125,Thunderstorm:0.075,Cloudy:0.15,Rain:0.125, Windy: 0.05},
    weatherWinter:{Fog:0.15,Rain:0.075,Snow:0.05,"Diamond Dust":0.001,Cloudy:0.175, Windy: 0.05},
    weatherSpring:{Rain:0.15,Fog:0.125,Cloudy:0.15,Thunderstorm:0.025, Windy: 0.05},
    weatherSummer:{Thunderstorm:0.1,Cloudy:0.15,Fog:0.1,Rain:0.1, Windy: 0.05},
  }),
  'NZ-WLG': assert<Location>({
    label:"Wellington", region:"Australia / New Zealand", terrain:"Oceanic", flag: '🇳🇿', id: 72,
    hemiLat: 'South', hemiLong: 'East', timezone: 'Pacific/Auckland', vivillon: 'garden',
    latitude: -41.28, longitude: 174.81,
    fact: "Lawmakers in this city meet inside a beehive, despite the fact they're people.",
    weatherAutumn:{Fog:0.15,Cloudy:0.125,Thunderstorm:0.05,Rain:0.1, Windy: 0.05},
    weatherWinter:{Fog:0.175,"Diamond Dust":0.002,Snow:0.075,Cloudy:0.15,Rain:0.075, Windy: 0.05},
    weatherSpring:{Cloudy:0.125,Thunderstorm:0.025,Rain:0.125,Snow:0.01,Fog:0.15, Windy: 0.05},
    weatherSummer:{Thunderstorm:0.1,Cloudy:0.125,Rain:0.075,Fog:0.125, Windy: 0.05},
  }),
  'PE-LIM': assert<Location>({
    label:"Lima", region:"South America", terrain:"Mountain", flag: '🇵🇪', id: 73,
    hemiLat: 'South', hemiLong: 'West', timezone: 'America/Lima', vivillon: 'savanna', meteor: 'red_meteor',
    latitude: -12.80, longitude: -77.00,
    fact: "When you're in this country, take a chance to visit a landmark not named after a Pokémon",
    weatherAutumn:{'Heat Wave':0.05,Rain:0.2,Thunderstorm:0.1,Cloudy:0.2,Fog:0.15},
    weatherWinter:{Snow:0.025,Cloudy:0.225,Thunderstorm:0.025,Fog:0.1,Rain:0.2},
    weatherSpring:{Cloudy:0.225,Fog:0.125,'Heat Wave':0.025,Rain:0.15,Thunderstorm:0.1},
    weatherSummer:{'Heat Wave':0.125,Fog:0.125,Rain:0.1,Thunderstorm:0.2,Cloudy:0.225},
  }),
  'PH-CEB': assert<Location>({
    label:"Cebu City", region:"Pacific Islands", terrain:"Beach", flag: '🇵🇭', id: 74,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Asia/Manila', vivillon: 'ocean',
    latitude: 10.65, longitude: 103.93,
    fact: "This old trading city is great place to get creative as you stare into the sea",
    weatherSpring:{Rain:0.1,Cloudy:0.15,Fog:0.05,'Heat Wave':0.1,Thunderstorm:0.1, Sandstorm: 0.025},
    weatherSummer:{Fog:0.05,'Heat Wave':0.15,Rain:0.025,Thunderstorm:0.2,Cloudy:0.15, Sandstorm: 0.025},
    weatherAutumn:{Rain:0.1,Thunderstorm:0.1,'Heat Wave':0.1,Fog:0.05,Cloudy:0.15, Sandstorm: 0.025},
    weatherWinter:{Fog:0.075,Cloudy:0.175,Rain:0.15,Thunderstorm:0.025, Sandstorm: 0.025},
  }),
  'PH-MNL': assert<Location>({
    label:"Manila", region:"Pacific Islands", terrain:"Beach", flag: '🇵🇭', id: 75,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Asia/Manila', vivillon: 'ocean',
    latitude: 14.59, longitude: 121.00,
    fact: "This queen city has grown plants that yield a colorful dye",
    weatherSpring:{Thunderstorm:0.1,Fog:0.05,Cloudy:0.15,'Heat Wave':0.05,Rain:0.075, Sandstorm: 0.025},
    weatherSummer:{Rain:0.05,Fog:0.05,'Heat Wave':0.125,Thunderstorm:0.125,Cloudy:0.15, Sandstorm: 0.025},
    weatherAutumn:{Thunderstorm:0.125,Fog:0.05,Cloudy:0.15,'Heat Wave':0.025,Rain:0.075, Sandstorm: 0.025},
    weatherWinter:{Fog:0.1,Cloudy:0.175,Rain:0.15, Sandstorm: 0.025},
  }),
  'PH-QZT': assert<Location>({
    label:"Quezon City", region:"Pacific Islands", terrain:"Beach", flag: '🇵🇭', id: 76,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Asia/Manila', vivillon: 'ocean',
    latitude: 16.46, longitude: 121.06,
    fact: "When in this city, you can really see the stars",
    weatherSpring:{Fog:0.05,Rain:0.125,Thunderstorm:0.075,'Heat Wave':0.075,Cloudy:0.15, Sandstorm: 0.025},
    weatherSummer:{Fog:0.025,Thunderstorm:0.125,'Heat Wave':0.15,Rain:0.075,Cloudy:0.15, Sandstorm: 0.025},
    weatherAutumn:{'Heat Wave':0.05,Fog:0.05,Cloudy:0.15,Rain:0.125,Thunderstorm:0.075, Sandstorm: 0.025},
    weatherWinter:{Rain:0.2,Fog:0.075,Cloudy:0.175, Sandstorm: 0.025},
  }),
  'PL-KRK': assert<Location>({
    label:"Krakow", region:"North Europe", terrain:"Grasslands", flag: '🇵🇱', id: 77,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Vienna', vivillon: 'polar',
    latitude: 50.09, longitude: 19.19,
    fact: "This city is said to have been build over a dragon's cave",
    weatherSpring:{Rain:0.15,Snow:0.03,Cloudy:0.225,Thunderstorm:0.025, Windy: 0.05},
    weatherSummer:{Cloudy:0.225,'Heat Wave':0.075,Rain:0.1,Thunderstorm:0.1, Windy: 0.05},
    weatherAutumn:{Cloudy:0.225,Snow:0.03,Rain:0.125,Thunderstorm:0.025, Windy: 0.05},
    weatherWinter:{Rain:0.1,"Diamond Dust":0.005,Snow:0.15,Cloudy:0.25, Windy: 0.05},
  }),
  'PL-WAW': assert<Location>({
    label:"Warsaw", region:"North Europe", terrain:"Grasslands", flag: '🇵🇱', id: 78,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Warsaw', vivillon: 'polar',
    latitude: 52.25, longitude: 21.06,
    fact: "This city has the nickname 'Phoenix City'.",
    weatherSpring:{Thunderstorm:0.05,Fog:0.05,Cloudy:0.25,Rain:0.1, Snow: 0.025, Windy: 0.05},
    weatherSummer:{Fog:0.05,Cloudy:0.25,'Heat Wave':0.025,Rain:0.05,Thunderstorm:0.1, Windy: 0.05},
    weatherAutumn:{Fog:0.075,Snow:0.025,Rain:0.1,Cloudy:0.25, Windy: 0.05},
    weatherWinter:{"Diamond Dust":0.002,Rain:0.025,Cloudy:0.25,Fog:0.075,Snow:0.15, Windy: 0.05}
  }),
  'PL-WRO': assert<Location>({
    label:"Wroclaw", region:"North Europe", terrain:"Rural", flag: '🇵🇱', id: 79,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Vienna', vivillon: 'polar',
    latitude: 51.12, longitude: 19.96,
    fact: "When walking around this city, look out for bronze dwarves",
    weatherSpring:{Cloudy:0.225,Rain:0.15,Thunderstorm:0.05,Snow:0.025, Windy: 0.025},
    weatherSummer:{'Heat Wave':0.05,Cloudy:0.225,Rain:0.075,Thunderstorm:0.1, Windy: 0.025},
    weatherAutumn:{Cloudy:0.225,Thunderstorm:0.025,Snow:0.025,Rain:0.125, Windy: 0.025},
    weatherWinter:{Rain:0.15,Snow:0.125,Cloudy:0.225,"Diamond Dust":0.0025, Windy: 0.025},
  }),
  'PT-LIS': assert<Location>({
    label:"Lisbon", region:"North Europe", terrain:"Beach", flag: '🇵🇹', id: 80,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Lisbon', vivillon: 'marine',
    latitude: 38.72, longitude: -9.18,
    fact: 'This city is in west Europe. But like, very west.',
    weatherSpring:{Fog:0.1,Rain:0.1,Thunderstorm:0.01,Cloudy:0.15,'Heat Wave':0.01, Sandstorm: 0.025},
    weatherSummer:{Thunderstorm:0.075,Fog:0.1,'Heat Wave':0.1,Cloudy:0.125,Rain:0.075, Sandstorm: 0.025},
    weatherAutumn:{Fog:0.125,Rain:0.1,Cloudy:0.15,Thunderstorm:0.01, Sandstorm: 0.025},
    weatherWinter:{Cloudy:0.175,Rain:0.1,Fog:0.15,Snow:0.15,"Diamond Dust":0.001, Sandstorm: 0.025}
  }),
  'RO-BUH': assert<Location>({
    label:"Bucharest", region:"North Europe", terrain:"Rural", flag: '🇷🇴', id: 81,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Bucharest', vivillon: 'polar',
    latitude: 47.18, longitude: 26.03,
    fact: "This city's famous palace contains the burial place of a famed prince",
    weatherSpring:{Rain:0.125,Thunderstorm:0.025,Fog:0.025,Cloudy:0.2, Windy: 0.025},
    weatherSummer:{Cloudy:0.175,Rain:0.075,'Heat Wave':0.1,Thunderstorm:0.1, Windy: 0.025},
    weatherAutumn:{Thunderstorm:0.025,Fog:0.025,Cloudy:0.2,Rain:0.1, Snow: 0.025, Windy: 0.025},
    weatherWinter:{Fog:0.05,Snow:0.15,"Diamond Dust":0.0025,Cloudy:0.225,Rain:0.1, Windy: 0.025},
  }),
  'RU-MSK': assert<Location>({
    label:"Moscow", region:"North Europe", terrain:"Urban", flag: '🇷🇺', id: 82,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Moscow', vivillon: 'icysnow',
    latitude: 55.76, longitude: 37.62,
    fact: "When you visit the city, look out for the world's largest chandelier.",
    weatherSpring:{Cloudy:0.2,Rain:0.1,Snow:0.05},
    weatherSummer:{Cloudy:0.2,'Heat Wave':0.01,Rain:0.075,Thunderstorm:0.075},
    weatherAutumn:{Cloudy:0.225,Snow:0.05,Rain:0.15},
    weatherWinter:{"Diamond Dust":0.0075,Snow:0.225,Rain:0.025,Cloudy:0.25},
  }),
  'SE-STO': assert<Location>({
    label:"Stockholm", region:"North Europe", terrain:"Bay", flag: '🇸🇪', id: 83,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Stockholm', vivillon: 'polar',
    latitude: 59.28, longitude: 18.06,
    fact: "Visit the an art gallery in this city but bring sneakers. It's the world's longest.",
    weatherSpring:{Snow:0.05,Fog:0.15,Cloudy:0.15,Rain:0.125},
    weatherSummer:{Thunderstorm:0.05,Rain:0.1,Fog:0.125,Cloudy:0.15},
    weatherAutumn:{Snow:0.05,Fog:0.15,Cloudy:0.175,Rain:0.125},
    weatherWinter:{Cloudy:0.2,Snow:0.2,Rain:0.075,Fog:0.175,"Diamond Dust":0.0075},
  }),
  'SG-SIN': assert<Location>({
    label:"Singapore", region:"Pacific Islands", terrain:"Tropical", flag: '🇸🇬', id: 84,
    hemiLat: 'South', hemiLong: 'East', timezone: 'Asia/Singapore', vivillon: 'sun',
    latitude: 1.35, longitude: 103.82,
    fact: "This city has the world's first indoor rainforest.",
    weatherAutumn:{Rain:0.15,Thunderstorm:0.15,Fog:0.15,Cloudy:0.15},
    weatherWinter:{'Heat Wave':0.2,Rain:0.1,Fog:0.15,Cloudy:0.15,Thunderstorm:0.2},
    weatherSpring:{Fog:0.15,Cloudy:0.15,Thunderstorm:0.15,'Heat Wave':0.05,Rain:0.15},
    weatherSummer:{Rain:0.2,Thunderstorm:0.2,Fog:0.15,Cloudy:0.15},
  }),
  'SK-BTS': assert<Location>({
    label:"Bratislava", region:"North Europe", terrain:"Rural", flag: '🇸🇰', id: 85,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Bratislava', vivillon: 'polar',
    latitude: 48.11, longitude: 18.02,
    fact: "This is the most stary city",
    weatherSpring:{'Heat Wave':0.025,Thunderstorm:0.025,Cloudy:0.2,Rain:0.125,Fog:0.025, Windy: 0.025},
    weatherSummer:{Cloudy:0.2,Rain:0.1,Thunderstorm:0.125,'Heat Wave':0.125, Windy: 0.025},
    weatherAutumn:{Fog:0.075,Cloudy:0.2,Rain:0.1,Snow:0.025, Windy: 0.025},
    weatherWinter:{Rain:0.1,Cloudy:0.2,Fog:0.125,"Diamond Dust":0.003,Snow:0.175, Windy: 0.025},
  }),
  'SV-SAL': assert<Location>({
    label: 'San Salvador', region: 'South America', terrain: 'Rainforest', flag: '🇸🇻', id: 160,
    // 13.6913228,-89.2414301,
    hemiLat: 'South', hemiLong: 'West', timezone: 'America/Chicago', vivillon: 'sun',
    latitude: 13.69, longitude: -89.24,
    fact: 'This city is in the center of the central.',
    weatherSpring: {'Heat Wave': 0.1,Thunderstorm:0.2,Cloudy:0.05,Rain:0.1,Fog:0.01,Windy:0.01},
    weatherSummer: {'Heat Wave': 0.2,Thunderstorm:0.25,Cloudy:0.05,Rain:0.025,Fog:0.01,Windy:0.01},
    weatherAutumn: {'Heat Wave': 0.1,Thunderstorm:0.1,Cloudy:0.075,Rain:0.125,Fog:0.025,Windy:0.025},
    weatherWinter: {'Heat Wave': 0.05,Thunderstorm:0.1,Cloudy:0.1,Rain:0.15,Fog:0.025,Windy:0.025},
  }),
  'TH-BKK': assert<Location>({
    label:"Bangkok", region:"Asia", terrain:"Grasslands", flag: '🇹🇭', id: 86,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Asia/Bangkok', vivillon: 'sun',
    latitude: 13.76, longitude: 100.52,
    fact: "This city started as a trading post in the fifteenth century and continues to be a popular place for tourists", // TODO Might be too vague
    weatherSpring:{Fog:0.05,Rain:0.1,Cloudy:0.1,Thunderstorm:0.1},
    weatherSummer:{Thunderstorm:0.05,Rain:0.1,Fog:0.075,Cloudy:0.15},
    weatherAutumn:{Rain:0.075,Thunderstorm:0.125,Fog:0.05,'Heat Wave':0.05,Cloudy:0.1},
    weatherWinter:{Rain:0.05,'Heat Wave':0.15,Cloudy:0.1,Fog:0.05,Thunderstorm:0.15},
  }),
  'TR-IST': assert<Location>({
    label:"Istanbul", region:"Mediterranean", terrain:"Bay", flag: '🇹🇷', id: 87,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Istanbul', vivillon: 'sandstorm',
    latitude: 41.00, longitude: 28.98,
    fact: "Many places have bazaars, but only the one in this city can be called great.",
    weatherSpring:{Cloudy:0.2,Rain:0.15,Fog:0.175,'Heat Wave':0.05,Thunderstorm:0.05},
    weatherSummer:{Thunderstorm:0.15,'Heat Wave':0.15,Fog:0.15,Cloudy:0.2,Rain:0.1},
    weatherAutumn:{Fog:0.175,Cloudy:0.2,'Heat Wave':0.025,Thunderstorm:0.025,Rain:0.125, Snow: 0.025},
    weatherWinter:{Cloudy:0.225,Snow:0.125,"Diamond Dust":0.001,Rain:0.1,Fog:0.2}
  }),
  'TW-CHG': assert<Location>({
    label:"Changhua", region:"Pacific Islands", terrain:"Beach", flag: '🇹🇼', id: 88,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Asia/Taipei', vivillon: 'monsoon',
    latitude: 23.66, longitude: 120.93,
    fact: "This island city was among the first to have offshore wind farms",
    weatherSpring:{Fog:0.1,'Heat Wave':0.025,Rain:0.1,Thunderstorm:0.025,Cloudy:0.15, Sandstorm: 0.025},
    weatherSummer:{Thunderstorm:0.125,Fog:0.1,'Heat Wave':0.125,Cloudy:0.15,Rain:0.075, Sandstorm: 0.025},
    weatherAutumn:{'Heat Wave':0.025,Thunderstorm:0.025,Cloudy:0.175,Fog:0.125,Rain:0.1, Sandstorm: 0.025},
    weatherWinter:{Fog:0.15,Snow:0.1,Cloudy:0.2,Rain:0.1, Sandstorm: 0.025},
  }),
  'TW-NTC': assert<Location>({
    label:"New Taipei City", region:"Pacific Islands", terrain:"Urban", flag: '🇹🇼', id: 89,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Asia/Taipei', vivillon: 'monsoon',
    latitude: 25.02, longitude: 121.46,
    fact: "This city has a green line and a blue line near its riverside park",
    weatherSpring:{Cloudy:0.15,'Heat Wave':0.05,Fog:0.05,Rain:0.125,Thunderstorm:0.05},
    weatherSummer:{Fog:0.025,Rain:0.05,Cloudy:0.15,Thunderstorm:0.125,'Heat Wave':0.1},
    weatherAutumn:{Rain:0.125,Fog:0.05,Cloudy:0.175},
    weatherWinter:{Fog:0.1,Cloudy:0.2,Snow:0.125,"Diamond Dust":0.005},
  }),
  'TW-TAO': assert<Location>({
    label:"Taoyuan City", region:"Pacific Islands", terrain:"Gardens", flag: '🇹🇼', id: 90,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Asia/Taipei', vivillon: 'monsoon', flower: 'white',
    latitude: 24.94, longitude: 121.68,
    fact: "This city is known as the 'Peach Garden' city.",
    weatherSpring:{Rain:0.125,Thunderstorm:0.025,Fog:0.125,Cloudy:0.15,'Heat Wave':0.025},
    weatherSummer:{Cloudy:0.15,Rain:0.05,Thunderstorm:0.125,'Heat Wave':0.1,Fog:0.1},
    weatherAutumn:{Fog:0.125,Cloudy:0.15,Thunderstorm:0.05,Rain:0.1},
    weatherWinter:{Fog:0.15,Cloudy:0.15,Rain:0.1,Snow:0.05},
  }),
  'TW-TNN': assert<Location>({
    label:"Tainan City", region:"Pacific Islands", terrain:"Beach", flag: '🇹🇼', id: 91,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Asia/Taipei', vivillon: 'monsoon',
    latitude: 23.56, longitude: 121.03,
    fact: "This city houses the nation's literature museum",
    weatherSpring:{Cloudy:0.15,'Heat Wave':0.025,Thunderstorm:0.025,Fog:0.1,Rain:0.1, Sandstorm: 0.025},
    weatherSummer:{Thunderstorm:0.1,Fog:0.1,'Heat Wave':0.1,Cloudy:0.15,Rain:0.05, Sandstorm: 0.025},
    weatherAutumn:{Rain:0.125,Thunderstorm:0.025,Fog:0.125,Cloudy:0.15, Sandstorm: 0.025},
    weatherWinter:{Snow:0.075,Rain:0.075,Cloudy:0.15,Fog:0.15, Sandstorm: 0.025},
  }),
  'TW-TPE': assert<Location>({
    label:"Taipei", region:"Pacific Islands", terrain:"Beach", flag: '🇹🇼', id: 92,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Asia/Taipei', vivillon: 'monsoon',
    latitude: 25.03, longitude: 121.57,
    fact: "The city is known as the 'City of Blue and Green'.",
    weatherSpring:{Cloudy:0.175,'Heat Wave':0.05,Fog:0.175,Thunderstorm:0.05,Rain:0.125, Sandstorm: 0.025},
    weatherSummer:{'Heat Wave':0.125,Fog:0.15,Cloudy:0.2,Rain:0.05,Thunderstorm:0.125, Sandstorm: 0.025},
    weatherAutumn:{Thunderstorm:0.075,Fog:0.175,Rain:0.075,Cloudy:0.2, Sandstorm: 0.025},
    weatherWinter:{Rain:0.085,Cloudy:0.225,Fog:0.2,Snow:0.1,"Diamond Dust":0.001, Sandstorm: 0.025},
  }),
  'TW-ZBC': assert<Location>({
    label:"Zhubei City", region:"Pacific Islands", terrain:"Beach", flag: '🇹🇼', id: 93,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Asia/Taipei', vivillon: 'monsoon',
    latitude: 24.92, longitude: 121.60,
    fact: "The opposite of the full moon, go to the beach in this city",
    weatherSpring:{Thunderstorm:0.025,Cloudy:0.15,'Heat Wave':0.025,Rain:0.125,Fog:0.125, Sandstorm: 0.025},
    weatherSummer:{Fog:0.1,Cloudy:0.15,'Heat Wave':0.1,Thunderstorm:0.1,Rain:0.1, Sandstorm: 0.025},
    weatherAutumn:{Cloudy:0.175,Fog:0.125,Thunderstorm:0.025,Rain:0.125, Sandstorm: 0.025},
    weatherWinter:{Cloudy:0.2,Snow:0.05,Fog:0.15,Rain:0.125, Sandstorm: 0.025},
  }),
  'UA-KIE': assert<Location>({
    label:"Kyiv", region:"North Europe", terrain:"Urban", flag: '🇺🇦', id: 94,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/Athens', vivillon: 'icysnow',
    latitude: 50.45, longitude: 30.52,
    fact: "This city has managed to contain its chimaeras inside.",
    weatherSpring:{Fog:0.125,Thunderstorm:0.025,Cloudy:0.175,'Heat Wave':0.025,Rain:0.125, Snow: 0.025, Windy: 0.02},
    weatherSummer:{'Heat Wave':0.1,Thunderstorm:0.125,Cloudy:0.175,Fog:0.1,Rain:0.1, Windy: 0.02},
    weatherAutumn:{Thunderstorm:0.025,Cloudy:0.2,Rain:0.125,Snow:0.05,Fog:0.125, Windy: 0.02},
    weatherWinter:{Rain:0.1,Fog:0.15,Cloudy:0.225,Snow:0.15,"Diamond Dust":0.0025, Windy: 0.02},
  }),
  'UK-CBG': assert<Location>({
    label:"Cambridge, UK", region:"North Europe", terrain:"Gardens", flag: '🇬🇧', id: 95,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/London', vivillon: 'garden', flower: 'yellow',
    latitude: 52.77, longitude: 0.13,
    fact: "This city was the birthplace of the computer.",
    weatherSpring:{Rain:0.2,Thunderstorm:0.1,Fog:0.15,Cloudy:0.2, Snow: 0.025},
    weatherSummer:{Rain:0.15,Thunderstorm:0.15,Fog:0.15,Cloudy:0.2,'Heat Wave':0.05},
    weatherAutumn:{Fog:0.15,Rain:0.15,Snow:0.05,Cloudy:0.2,Thunderstorm:0.1},
    weatherWinter:{Cloudy:0.25,Thunderstorm:0.05,Fog:0.15,"Diamond Dust":0.01,Rain:0.05,Snow:0.225},
  }),
  'UK-LON': assert<Location>({
    label:'London', region:"North Europe", terrain:"Urban", flag: '🇬🇧', id: 96,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/London', vivillon: 'garden',
    latitude: 51.5, longitude: -0.09,
    fact: "This city is known for its clock tower.",
    weatherSpring:{Thunderstorm:0.1,Cloudy:0.25,Rain:0.2,Fog:0.25, Snow: 0.025},
    weatherSummer:{Rain:0.15,Fog:0.25,Cloudy:0.25,Thunderstorm:0.25},
    weatherAutumn:{Cloudy:0.25,Rain:0.15,Fog:0.25,Thunderstorm:0.15, Snow: 0.05},
    weatherWinter:{Fog:0.25,Snow:0.175,Thunderstorm:0.05,Rain:0.05,"Diamond Dust":0.01,Cloudy:0.2},
  }),
  'UK-MAN': assert<Location>({
    label:"Manchester", region:"North Europe", terrain:"Grasslands", flag: '🇬🇧', id: 97,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/London', vivillon: 'garden',
    latitude: 53.45, longitude: -2.41,
    fact: "A place that should be united is ironically known for first splitting",
    weatherSpring:{Cloudy:0.2,Rain:0.2,Thunderstorm:0.05,Snow: 0.025,Fog:0.15},
    weatherSummer:{Rain:0.2,Thunderstorm:0.2,Cloudy:0.2,'Heat Wave':0.05,Fog:0.15},
    weatherAutumn:{Cloudy:0.2,Thunderstorm:0.1,Rain:0.17,Snow:0.03,Fog:0.15},
    weatherWinter:{Rain:0.05,Thunderstorm:0.05,"Diamond Dust":0.005,Cloudy:0.2,Snow:0.2,Fog:0.15},
  }),
  'UK-OXF': assert<Location>({
    label:"Oxford", region:"North Europe", terrain:"Grasslands", flag: '🇬🇧', id: 98,
    hemiLat: 'North', hemiLong: 'East', timezone: 'Europe/London', vivillon: 'garden',
    latitude: 51.75, longitude: 1.26,
    fact: "This city has among the oldest universities in the world",
    weatherSpring:{Fog:0.15,Snow:0.01,Cloudy:0.2,Rain:0.1},
    weatherSummer:{Rain:0.075,Fog:0.15,Cloudy:0.175,'Heat Wave':0.05,Thunderstorm:0.125},
    weatherAutumn:{Cloudy:0.2,Snow:0.025,Rain:0.1,Thunderstorm:0.05,Fog:0.15},
    weatherWinter:{Snow:0.15,Cloudy:0.225,Fog:0.15,"Diamond Dust":0.005,Rain:0.125},
  }),
  'US-ARB': assert<Location>({
    label:"Ann Arbor", region:"North America", terrain:"Urban", flag: '🇺🇸', id: 99,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/New_York', vivillon: 'polar',
    latitude: 42.28, longitude: -83.74,
    fact: "This city is a special place to a cofounder",
    weatherSpring:{Rain:0.15,Thunderstorm:0.05,Cloudy:0.15, Snow: 0.025},
    weatherSummer:{'Heat Wave':0.05,Rain:0.1,Thunderstorm:0.15,Cloudy:0.15},
    weatherAutumn:{Rain:0.15,Cloudy:0.15,Thunderstorm:0.05, Snow: 0.025},
    weatherWinter:{Cloudy:0.15,Snow:0.15,Rain:0.1,"Diamond Dust":0.005}
  }),
  'US-AST': assert<Location>({
    label:"Lithia Springs", region:"North America", terrain:"Rural", flag: '🇺🇸', id: 100,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/New_York', vivillon: 'polar',
    latitude: 33.95, longitude: -84.44,
    fact: "This data center has a dungeon ironically not underground",
    weatherSpring:{Thunderstorm:0.1,Cloudy:0.2,'Heat Wave':0.05,Rain:0.1, Windy: 0.025},
    weatherSummer:{Thunderstorm:0.2,Rain:0.05,'Heat Wave':0.15,Cloudy:0.2, Windy: 0.025},
    weatherAutumn:{Rain:0.15,Cloudy:0.2,Thunderstorm:0.05,'Heat Wave':0.05, Windy: 0.025},
    weatherWinter:{Rain:0.2,Snow:0.01,Cloudy:0.2, Windy: 0.025},
  }),
  'US-ATL': assert<Location>({
    label:"Atlanta", region:"North America", terrain:"Urban", flag: '🇺🇸', id: 101,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/New_York', vivillon: 'modern',
    latitude: 33.76, longitude: -84.50,
    fact: "The city is known for its Georgian food. No, the other Georgia.",
    weatherSpring:{Rain:0.1,Thunderstorm:0.05,Cloudy:0.2,'Heat Wave':0.05},
    weatherSummer:{Cloudy:0.2,'Heat Wave':0.15,Rain:0.05,Thunderstorm:0.15},
    weatherAutumn:{Rain:0.1,Thunderstorm:0.05,'Heat Wave':0.025,Cloudy:0.2},
    weatherWinter:{Cloudy:0.25,Snow:0.01,Rain:0.2},
  }),
  'US-AUS': assert<Location>({
    label:"Austin", region:"North America", terrain:"Grasslands", flag: '🇺🇸', id: 102,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Chicago', vivillon: 'modern',
    latitude: 30.27, longitude: -97.73,
    fact: "As you walk over in this city, you may not realize how many bats are underneath.",
    weatherSpring:{'Heat Wave':0.025,Cloudy:0.1,Sandstorm:0.1,Rain:0.05, Windy: 0.025},
    weatherSummer:{Thunderstorm:0.075,Sandstorm:0.1,'Heat Wave':0.125,Rain:0.025,Cloudy:0.1, Windy: 0.025},
    weatherAutumn:{Rain:0.05,Thunderstorm:0.025,'Heat Wave':0.025,Sandstorm:0.1,Cloudy:0.1, Windy: 0.025},
    weatherWinter:{Cloudy:0.15,Snow:0.05,Sandstorm:0.1,Rain:0.05, Windy: 0.025},
  }),
  'US-BEV': assert<Location>({
    label:"Beverly Hills", region:"North America", terrain:"Mountain", flag: '🇺🇸', id: 103,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Los_Angeles', vivillon: 'highplains', meteor: 'violet_meteor',
    latitude: 34.43, longitude: -118.41,
    fact: "This city is known for how many celebrities live here.",
    weatherSpring:{Cloudy:0.15,Rain:0.1,'Heat Wave':0.01,Fog:0.05, Windy: 0.05},
    weatherSummer:{Fog:0.05,'Heat Wave':0.125,Rain:0.05,Cloudy:0.15,Thunderstorm:0.1, Windy: 0.05},
    weatherAutumn:{Cloudy:0.175,Rain:0.075,Fog:0.075,Thunderstorm:0.01,'Heat Wave':0.025, Windy: 0.05},
    weatherWinter:{Rain:0.125,Cloudy:0.2,Fog:0.125, Windy: 0.05},
  }),
  'US-BLD': assert<Location>({
    label:"Boulder", region:"North America", terrain:"Mountain", magneticField: true, flag: '🇺🇸', id: 104,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Denver', vivillon: 'highplains', meteor: 'yellow_meteor',
    latitude: 40.03, longitude: -105.66,
    fact: "When you're in this city, be sure to visit the Flatirons.",
    weatherSpring:{Rain:0.1,Thunderstorm:0.1,Snow:0.075,Fog:0.05, Windy: 0.05},
    weatherSummer:{Rain:0.1,'Heat Wave':0.2,Thunderstorm:0.1,Fog:0.05,Snow:0.03, Windy: 0.05},
    weatherAutumn:{Fog:0.05,Thunderstorm:0.1,Rain:0.1,Snow:0.1,Cloudy:0.05, Windy: 0.05},
    weatherWinter:{Thunderstorm:0.05,Snow:0.275,Cloudy:0.3,Rain:0.01,"Diamond Dust":0.01, Windy: 0.05},
  }),
  'US-BNA': assert<Location>({
    label:"Nashville", region:"North America", terrain:"Rural", flag: '🇺🇸', id: 105,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Chicago', vivillon: 'modern',
    latitude: 36.22, longitude: -86.77,
    fact: "This city sang with joy with the introduction of Google Fiber",
    weatherSpring:{'Heat Wave':0.05,Cloudy:0.15,Thunderstorm:0.05,Rain:0.1, Windy: 0.075},
    weatherSummer:{Rain:0.05,Cloudy:0.15,'Heat Wave':0.1,Thunderstorm:0.125, Windy: 0.125},
    weatherAutumn:{Rain:0.15,Cloudy:0.15, Windy: 0.075},
    weatherWinter:{Snow:0.01,Cloudy:0.15,Rain:0.15, Windy: 0.025},
  }),
  'US-BOS': assert<Location>({
    label:"Boston", region:"North America", terrain:"Urban", flag: '🇺🇸', id: 106,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/New_York', vivillon: 'polar',
    latitude: 42.36, longitude: -71.06,
    fact: "This city is where you can get an aptly-named beer where a founding father was buried",
    weatherSpring:{Cloudy:0.1,Rain:0.1,Thunderstorm:0.1, Snow: 0.025},
    weatherSummer:{Cloudy:0.1,Rain:0.1,Thunderstorm:0.1},
    weatherAutumn:{Rain:0.1,Snow:0.05,Thunderstorm:0.1,Cloudy:0.15},
    weatherWinter:{Rain:0.05,Cloudy:0.2,"Diamond Dust":0.005,Thunderstorm:0.05,Snow:0.25},
  }),
  'US-BOT': assert<Location>({
    label:"Bothell", region:"North America", terrain:"Bay", flag: '🇺🇸', id: 107,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Los_Angeles', vivillon: 'highplains',
    latitude: 47.76, longitude: -122.21,
    fact: "This city has a park which sounds like a theme park",
    weatherSpring:{Cloudy:0.15,Rain:0.15,Snow:0.025,Fog:0.15, Windy: 0.025},
    weatherSummer:{Fog:0.125,'Heat Wave':0.01,Rain:0.1,Cloudy:0.175,Thunderstorm:0.1, Windy: 0.025},
    weatherAutumn:{Fog:0.15,Rain:0.125,Thunderstorm:0.025,Cloudy:0.2, Snow: 0.025, Windy: 0.025},
    weatherWinter:{Fog:0.2,Rain:0.075,"Diamond Dust":0.005,Cloudy:0.225,Snow:0.2, Windy: 0.025},
  }),
  'US-BVE': assert<Location>({
    label:"Bellevue", region:"North America", terrain:"Bay", flag: '🇺🇸', id: 108,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Los_Angeles', vivillon: 'highplains',
    latitude: 47.61, longitude: -122.20,
    fact: "Check out this city's beautiful view of the lake",
    weatherSpring:{Cloudy:0.25,Rain:0.1,Thunderstorm:0.025,Fog:0.125,Snow:0.01, Windy: 0.025},
    weatherSummer:{Fog:0.1,Thunderstorm:0.1,Cloudy:0.25,'Heat Wave':0.025,Rain:0.075, Windy: 0.025},
    weatherAutumn:{Thunderstorm:0.025,Cloudy:0.25,Snow:0.025,Fog:0.125,Rain:0.1,'Heat Wave':0.01, Windy: 0.025},
    weatherWinter:{Rain:0.1,"Diamond Dust":0.009,Snow:0.2,Cloudy:0.25,Fog:0.2, Windy: 0.025},
  }),
  'US-CAM': assert<Location>({
    label:"Cambridge, MA", region:"North America", terrain:"Urban", flag: '🇺🇸', id: 109,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/New_York', vivillon: 'polar',
    latitude: 42.37, longitude: -71.11,
    fact: "The city is known for its higher education.",
    weatherSpring:{Snow:0.025,Fog:0.15,Cloudy:0.15,Rain:0.15},
    weatherSummer:{Thunderstorm:0.1,Fog:0.15,Cloudy:0.15,Rain:0.1,'Heat Wave':0.05},
    weatherAutumn:{Rain:0.125,Thunderstorm:0.025,Snow:0.025,Fog:0.15,Cloudy:0.15},
    weatherWinter:{"Diamond Dust":0.005,Fog:0.15,Rain:0.1,Snow:0.2,Cloudy:0.15},
  }),
  'US-CBF': assert<Location>({
    label:"Council Bluffs", region:"North America", terrain:"Rural", flag: '🇺🇸', id: 110,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Chicago', vivillon: 'polar',
    latitude: 41.01, longitude: -95.86,
    fact: "This city was the start of a famous American expedition.",
    weatherSpring:{Thunderstorm:0.05,'Heat Wave':0.05,Rain:0.15,Cloudy:0.15, Snow: 0.01, Windy: 0.025},
    weatherSummer:{Thunderstorm:0.25,Rain:0.1,Cloudy:0.15,'Heat Wave':0.1, Windy: 0.05},
    weatherAutumn:{Cloudy:0.15,Rain:0.1,Thunderstorm:0.1,'Heat Wave':0.025, Snow: 0.01, Windy: 0.025},
    weatherWinter:{Snow:0.15,"Diamond Dust":0.005,Rain:0.1,Cloudy:0.2, Windy: 0.025},
  }),
  'US-CHAP': assert<Location>({
    label:"Chapel Hill", region:"North America", terrain:"Rural", flag: '🇺🇸', id: 111,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/New_York', vivillon: 'modern',
    latitude: 35.87, longitude: -79.12,
    fact: "This city is often likened to Berkeley, but it's a different city.",
    weatherSpring:{Cloudy:0.2,Thunderstorm:0.05,Rain:0.1, Windy: 0.025},
    weatherSummer:{Cloudy:0.2,Rain:0.05,'Heat Wave':0.1,Thunderstorm:0.15, Windy: 0.05},
    weatherAutumn:{Thunderstorm:0.05,Cloudy:0.2,Rain:0.1, Windy: 0.025},
    weatherWinter:{Cloudy:0.2,Snow:0.025,Rain:0.15, Windy: 0.025},
  }),
  'US-CHD': assert<Location>({
    label:"Chandler", region:"North America", terrain:"Desert", flag: '🇺🇸', id: 112,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Denver', vivillon: 'highplains',
    latitude: 33.31, longitude: -111.84,
    fact: "This city was started by a veterinary surgeon. Today the surgery would be autonomous.",
    weatherSpring:{Sandstorm:0.2,'Heat Wave':0.05,Rain:0.01, Windy: 0.1},
    weatherSummer:{Sandstorm:0.2,Rain:0.01,'Heat Wave':0.2,Thunderstorm:0.04, Windy: 0.1},
    weatherAutumn:{Rain:0.01,'Heat Wave':0.1,Sandstorm:0.2, Windy: 0.1},
    weatherWinter:{Rain:0.01,Sandstorm:0.2, Windy: 0.1},
  }),
  'US-CHI': assert<Location>({
    label:"Chicago", region:"North America", terrain:"Bay", flag: '🇺🇸', id: 113,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Chicago', vivillon: 'polar',
    latitude: 41.93, longitude: -87.62,
    fact: "While not the Emerald Isles, something similar does happen annually here",
    weatherSpring:{Rain:0.15,Snow:0.025,Cloudy:0.2,Fog:0.1,Thunderstorm:0.05},
    weatherSummer:{Thunderstorm:0.15,Rain:0.05,Cloudy:0.2,'Heat Wave':0.025,Fog:0.1},
    weatherAutumn:{Snow:0.025,Thunderstorm:0.05,Cloudy:0.2,Fog:0.1,Rain:0.15},
    weatherWinter:{Fog:0.1,Rain:0.1,"Diamond Dust":0.01,Cloudy:0.2,Snow:0.25},
  }),
  'US-CKV': assert<Location>({
    label:"Clarksville", region:"North America", terrain:"Rural", flag: '🇺🇸', id: 114,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Chicago', vivillon: 'polar',
    latitude: 36.00, longitude: -88.45,
    fact: "This majestic city is the top spot both culturally and geographically",
    weatherSpring:{'Heat Wave':0.025,Thunderstorm:0.025,Cloudy:0.15,Rain:0.1, Windy: 0.05},
    weatherSummer:{'Heat Wave':0.075,Thunderstorm:0.1,Cloudy:0.15,Rain:0.05, Windy: 0.075},
    weatherAutumn:{Cloudy:0.15,Rain:0.125, Windy: 0.05},
    weatherWinter:{Rain:0.125,Snow:0.05,Cloudy:0.15, Windy: 0.05},
  }),
  'US-CLT': assert<Location>({
    label:"Charlotte", region:"North America", terrain:"Forest", flag: '🇺🇸', id: 115,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/New_York', vivillon: 'modern',
    latitude: 35.28, longitude: -80.80,
    fact: "This majestic city has housed Google Fiber since 2015",
    weatherSpring:{Thunderstorm:0.05,Cloudy:0.15,'Heat Wave':0.01,Rain:0.15,Fog:0.05, Windy: 0.05},
    weatherSummer:{Cloudy:0.15,'Heat Wave':0.1,Fog:0.05,Rain:0.1,Thunderstorm:0.15, Windy: 0.05},
    weatherAutumn:{Fog:0.1,'Heat Wave':0.01,Rain:0.15,Thunderstorm:0.05,Cloudy:0.15, Windy: 0.05},
    weatherWinter:{Fog:0.1,Rain:0.2,Cloudy:0.15,Snow:0.01, Windy: 0.05},
  }),
  'US-CMH': assert<Location>({
    label: 'Columbus', region: 'North America', terrain: 'Forest', flag: '🇺🇸', id: 116,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Chicago', vivillon: 'polar',
    latitude: 39.96, longitude: -83.00,
    fact: "This city is a great place to visit for fans of jazz and ribs.",
    weatherSpring: {'Cloudy': 0.1, 'Heat Wave': 0.01, Rain: 0.1, Thunderstorm: 0.05, Snow: 0.01, Fog: 0.025},
    weatherSummer: {Cloudy: 0.1, 'Heat Wave': 0.075, Rain: 0.05, Thunderstorm: 0.125, Fog: 0.025},
    weatherAutumn: {Cloudy: 0.1, 'Heat Wave': 0.025, Rain: 0.075, Thunderstorm: 0.075, Snow: 0.01, Fog: 0.025},
    weatherWinter: {Cloudy: 0.1, Rain: 0.05, Snow: 0.1, 'Diamond Dust': 0.005, Fog: 0.025},
  }),
  'US-CMH-NBY': assert<Location>({
    label: 'New Albany', region: 'North America', terrain: 'Forest', flag: '🇺🇸', id: 117,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Chicago', vivillon: 'polar',
    latitude: 38.85, longitude: -85.46,
    fact: "This is a new city, but its pedestrianism is classic",
    weatherSpring: {'Cloudy': 0.1, 'Heat Wave': 0.01, Rain: 0.1, Thunderstorm: 0.05, Snow: 0.01, Fog: 0.025},
    weatherSummer: {Cloudy: 0.1, 'Heat Wave': 0.075, Rain: 0.05, Thunderstorm: 0.125, Fog: 0.025},
    weatherAutumn: {Cloudy: 0.1, 'Heat Wave': 0.025, Rain: 0.075, Thunderstorm: 0.075, Snow: 0.01, Fog: 0.025},
    weatherWinter: {Cloudy: 0.1, Rain: 0.05, Snow: 0.1, 'Diamond Dust': 0.005, Fog: 0.025},
  }),
  'US-DAL': assert<Location>({
    label:"Dallas", region:"North America", terrain:"Urban", flag: '🇺🇸', id: 118,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Chicago', vivillon: 'modern',
    latitude: 32.78, longitude: -96.80,
    fact: "This is where the cowboys play.",
    weatherSpring:{Thunderstorm:0.05,Rain:0.075,'Heat Wave':0.05,Cloudy:0.15, Windy: 0.05},
    weatherSummer:{Rain:0.05,Thunderstorm:0.1,Cloudy:0.15,'Heat Wave':0.1, Windy: 0.075},
    weatherAutumn:{'Heat Wave':0.05,Rain:0.125,Cloudy:0.15,Thunderstorm:0.05, Windy: 0.05},
    weatherWinter:{Cloudy:0.15,Snow:0.01,Rain:0.15, Windy: 0.05},
  }),
  'US-DEN': assert<Location>({
    label:"Denver", region:"North America", terrain:"Mountain", magneticField: true, flag: '🇺🇸', id: 119,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Denver', vivillon: 'highplains', meteor: 'blue_meteor',
    latitude: 39.72, longitude: -104.99,
    fact: "You can take a plane to this city. You don't need to climb a mile.",
    weatherSpring:{Fog:0.05,Cloudy:0.2,Rain:0.1,Snow:0.075, Windy: 0.075},
    weatherSummer:{Cloudy:0.175,Rain:0.075,Fog:0.025,'Heat Wave':0.075,Thunderstorm:0.1,Snow:0.03, Windy: 0.075},
    weatherAutumn:{Fog:0.05,Rain:0.075,Thunderstorm:0.05,Cloudy:0.2,Snow:0.075, Windy: 0.075},
    weatherWinter:{"Diamond Dust":0.005,Snow:0.175,Rain:0.1,Fog:0.075,Cloudy:0.2, Windy: 0.075},
  }),
  'US-DFW': assert<Location>({
    label:"Midlothian", region:"North America", terrain:"Rural", flag: '🇺🇸', id: 120,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Chicago', vivillon: 'polar',
    latitude: 37.72, longitude: -77.12,
    fact: "Those aren't southern stars, they are servers.",
    weatherSpring:{Rain:0.05,Thunderstorm:0.1,'Heat Wave':0.05,Cloudy:0.1, Windy: 0.05},
    weatherSummer:{'Heat Wave':0.1,Thunderstorm:0.1,Cloudy:0.1, Windy: 0.075},
    weatherAutumn:{Rain:0.1,Cloudy:0.1,'Heat Wave':0.025, Windy: 0.05},
    weatherWinter:{Rain:0.15,Cloudy:0.15,Snow:0.01, Windy: 0.05},
  }),
  'US-DTW': assert<Location>({
    label:"Detroit", region:"North America", terrain:"Bay", flag: '🇺🇸', id: 121,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Chicago', vivillon: 'polar',
    latitude: 42.34, longitude: -83.06,
    fact: "This city drove motown to prominence",
    weatherSpring:{Cloudy:0.2,Rain:0.15,Fog:0.1,Thunderstorm:0.1, Snow: 0.01},
    weatherSummer:{Fog:0.1,Rain:0.05,Thunderstorm:0.15,Cloudy:0.2,'Heat Wave':0.05},
    weatherAutumn:{Fog:0.1,Rain:0.1,Cloudy:0.2,Thunderstorm:0.1, Snow: 0.025},
    weatherWinter:{Snow:0.2,Cloudy:0.15,Rain:0.05,Fog:0.1,"Diamond Dust":0.005},
  }),
  'US-HEN': assert<Location>({
    label:"Henderson", region:"North America", terrain:"Urban", flag: '🇺🇸', id: 122,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Los_Angeles', vivillon: 'highplains',
    latitude: 37.18, longitude: -115.18,
    fact: "You can eat like a Californian here, despite being in a state away",
    weatherSpring:{Sandstorm:0.1,Rain:0.025,Cloudy:0.075,'Heat Wave':0.05,Thunderstorm:0.025},
    weatherSummer:{Cloudy:0.075,'Heat Wave':0.1,Thunderstorm:0.05,Sandstorm:0.1},
    weatherAutumn:{Sandstorm:0.1,'Heat Wave':0.075,Cloudy:0.075,Thunderstorm:0.025,Rain:0.025},
    weatherWinter:{'Heat Wave':0.075,Cloudy:0.075,Rain:0.075,Sandstorm:0.1},
  }),
  'US-IAD': assert<Location>({
    label:"Ashburn, Leesburg, Sterling", region:"North America", terrain:"Rural", flag: '🇺🇸', id: 123,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/New_York', vivillon: 'modern',
    latitude: 39.18, longitude: -77.60,
    fact: "If you don't strike a bullseye, you can get silver or third place",
    weatherSpring:{Cloudy:0.2,Rain:0.1,Thunderstorm:0.1,'Heat Wave':0.05, Windy: 0.05},
    weatherSummer:{Thunderstorm:0.175,Rain:0.025,Cloudy:0.2,'Heat Wave':0.15, Windy: 0.075},
    weatherAutumn:{Thunderstorm:0.1,Cloudy:0.2,Rain:0.05,'Heat Wave':0.025, Windy: 0.05},
    weatherWinter:{Cloudy:0.2,Rain:0.15,Snow:0.01, Windy: 0.05},
  }),
  'US-IRV': assert<Location>({
    label:"Irvine", region:"North America", terrain:"Beach", flag: '🇺🇸', id: 124,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Los_Angeles', vivillon: 'highplains',
    latitude: 33.73, longitude: -117.83,
    fact: "This is the site of Applied Schematics which Google acquired in 2003",
    weatherSpring:{Cloudy:0.05,Rain:0.05,'Heat Wave':0.05, Sandstorm: 0.02},
    weatherSummer:{'Heat Wave':0.1,Cloudy:0.05,Rain:0.05, Sandstorm: 0.02},
    weatherAutumn:{Rain:0.05,'Heat Wave':0.05,Cloudy:0.05, Sandstorm: 0.02},
    weatherWinter:{Rain:0.075,Cloudy:0.075, Sandstorm: 0.02},
  }),
  'US-KCI': assert<Location>({
    label:"Kansas City", region:"North America", terrain:"Rural", flag: '🇺🇸', id: 125,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Chicago', vivillon: 'polar',
    latitude: 39.12, longitude: -94.81,
    fact: "This city is fountainous!",
    weatherSpring:{Cloudy:0.15,'Heat Wave':0.025,Rain:0.15,Thunderstorm:0.05, Windy: 0.075},
    weatherSummer:{'Heat Wave':0.1,Thunderstorm:0.15,Cloudy:0.15,Rain:0.05, Windy: 0.1},
    weatherAutumn:{'Heat Wave':0.025,Cloudy:0.15,Thunderstorm:0.1,Rain:0.1, Windy: 0.075},
    weatherWinter:{Rain:0.15,Cloudy:0.2,Snow:0.05, Windy: 0.075},
  }),
  'US-KIR': assert<Location>({
    label:"Kirkland", region:"North America", terrain:"Bay", flag: '🇺🇸', id: 126,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Los_Angeles', vivillon: 'highplains',
    latitude: 47.68, longitude: -122.21,
    fact: "In this city, you travel on whales",
    weatherSpring:{Rain:0.15,Thunderstorm:0.025,Fog:0.1,Cloudy:0.2, Snow: 0.025},
    weatherSummer:{Rain:0.1,Cloudy:0.2,'Heat Wave':0.05,Thunderstorm:0.1,Fog:0.1},
    weatherAutumn:{Cloudy:0.2,Thunderstorm:0.05,Fog:0.1,Snow:0.025,Rain:0.1},
    weatherWinter:{Snow:0.15,"Diamond Dust":0.005,Cloudy:0.2,Fog:0.1,Rain:0.05},
  }),
  'US-LAX': assert<Location>({
    label:"Los Angeles", region:"North America", terrain:"Beach", flag: '🇺🇸', id: 127,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Los_Angeles', vivillon: 'highplains',
    latitude: 34.05, longitude: -118.24,
    fact: "No, the other Venice",
    weatherSpring:{Rain:0.05,Cloudy:0.05,'Heat Wave':0.05, Sandstorm: 0.03},
    weatherSummer:{Cloudy:0.05,Rain:0.05,'Heat Wave':0.15, Sandstorm: 0.03},
    weatherAutumn:{'Heat Wave':0.05,Rain:0.075,Cloudy:0.05, Sandstorm: 0.03},
    weatherWinter:{Cloudy:0.05,Rain:0.075, Sandstorm: 0.03},
  }),
  'US-LNR': assert<Location>({
    label:"Lenoir", region:"North America", terrain:"Forest", flag: '🇺🇸', id: 128,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/New_York', vivillon: 'modern',
    latitude: 35.78, longitude: -80.07,
    fact: "This city's founder built defiantly",
    weatherSpring:{Rain:0.15,Thunderstorm:0.1,Cloudy:0.2, Fog: 0.025},
    weatherSummer:{Cloudy:0.2,'Heat Wave':0.1,Rain:0.1,Thunderstorm:0.15, Fog: 0.025},
    weatherAutumn:{Thunderstorm:0.15,Rain:0.1,Cloudy:0.2, Fog: 0.025},
    weatherWinter:{Rain:0.1,Snow:0.05,Cloudy:0.2,Thunderstorm:0.1, Fog: 0.025},
  }),
  'US-MIA': assert<Location>({
    label:"Miami", region:"North America", terrain:"Beach", flag: '🇺🇸', id: 129,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/New_York', vivillon: 'modern',
    latitude: 25.73, longitude: -80.19,
    fact: "A keys city alongside the coast",
    weatherSpring:{'Heat Wave':0.15,Rain:0.15,Thunderstorm:0.15,Sandstorm: 0.035},
    weatherSummer:{'Heat Wave':0.2,Thunderstorm:0.2,Rain:0.1,Sandstorm: 0.035},
    weatherAutumn:{'Heat Wave':0.1,Rain:0.1,Thunderstorm:0.15,Sandstorm: 0.035},
    weatherWinter:{Snow:0.001,Rain:0.1,Thunderstorm:0.15,Sandstorm: 0.035},
  }),
  'US-MNK': assert<Location>({
    label:"Moncks Corner", region:"North America", terrain:"Forest", flag: '🇺🇸', id: 130,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/New_York', vivillon: 'modern',
    latitude: 33.06, longitude: -80.04,
    fact: "Ironically this city is in the center of its region",
    weatherSpring:{Fog:0.1,Cloudy:0.15,Rain:0.15},
    weatherSummer:{'Heat Wave':0.1,Thunderstorm:0.15,Cloudy:0.15,Rain:0.05,Fog:0.1},
    weatherAutumn:{Fog:0.1,Rain:0.05,Cloudy:0.15,Thunderstorm:0.05},
    weatherWinter:{Fog:0.15,Rain:0.1,Cloudy:0.15,Snow:0.05},
  }),
  'US-MSN': assert<Location>({
    label:"Madison", region:"North America", terrain:"Gardens", flag: '🇺🇸', id: 131,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Chicago', vivillon: 'modern', flower: 'blue',
    latitude: 43.07, longitude: -89.22,
    fact: "Bratwurst is the city's great taste.",
    weatherSpring:{Rain:0.15,Cloudy:0.15,Fog:0.15,Snow:0.05,Thunderstorm:0.025},
    weatherSummer:{Fog:0.15,Cloudy:0.15,Thunderstorm:0.15,Rain:0.05},
    weatherAutumn:{Snow:0.05,Thunderstorm:0.025,Fog:0.15,Cloudy:0.15,Rain:0.075},
    weatherWinter:{"Diamond Dust":0.005,Cloudy:0.15,Fog:0.05,Snow:0.2,Rain:0.05},
  }),
  'US-MTV': assert<Location>({
    label:"Mountain View", region:"North America", terrain:"Bay", flag: '🇺🇸', id: 132,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Los_Angeles', vivillon: 'highplains',
    latitude: 37.41, longitude: -122.07,
    fact: "This city serves as the headquarters for a big tech company.",
    weatherSpring:{Thunderstorm:0.01,Cloudy:0.05,'Heat Wave':0.05,Rain:0.01},
    weatherSummer:{Cloudy:0.05,Thunderstorm:0.01,'Heat Wave':0.05,Rain:0.01,Fog:0.05},
    weatherAutumn:{Rain:0.02,Cloudy:0.05,'Heat Wave':0.05,Thunderstorm:0.02},
    weatherWinter:{Thunderstorm:0.1,Cloudy:0.1,Rain:0.1},
  }),
  'US-NYC': assert<Location>({
    label:"New York City", region:"North America", terrain:"Urban", flag: '🇺🇸', id: 133,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/New_York', vivillon: 'modern',
    latitude: 40.71, longitude: -74.00,
    fact: "Part of this city's campus spans three entire city blocks.",
    weatherSpring:{Cloudy:0.175,'Heat Wave':0.01,Rain:0.125,Fog:0.15,Thunderstorm:0.05, Snow: 0.03},
    weatherSummer:{Fog:0.125,'Heat Wave':0.1,Rain:0.1,Thunderstorm:0.1,Cloudy:0.175},
    weatherAutumn:{Thunderstorm:0.05,Fog:0.15,'Heat Wave':0.01,Cloudy:0.175,Rain:0.125, Snow: 0.025},
    weatherWinter:{Fog:0.175,Cloudy:0.25,Rain:0.05,"Diamond Dust":0.0075,Snow:0.15},
  }),
  'US-PCT': assert<Location>({
    label:"Princeton", region:"North America", terrain:"Urban", flag: '🇺🇸', id: 134,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/New_York', vivillon: 'polar',
    latitude: 40.36, longitude: -74.67,
    fact: "This city has a train known as the 'Dinky'.",
    weatherSpring:{Thunderstorm:0.05,Rain:0.1,Cloudy:0.1, Snow: 0.01},
    weatherSummer:{'Heat Wave':0.1,Thunderstorm:0.1,Rain:0.1,Cloudy:0.15},
    weatherAutumn:{Rain:0.1,Cloudy:0.15,"Sunny":0.64,Thunderstorm:0.1,Snow:0.01},
    weatherWinter:{"Diamond Dust":0.001,Rain:0.05,Snow:0.125,Cloudy:0.2},
  }),
  'US-PIT': assert<Location>({
    label:"Pittsburgh", region:"North America", terrain:"Forest", flag: '🇺🇸', id: 135,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/New_York', vivillon: 'polar',
    latitude: 40.44, longitude: -80,
    fact: "This city has over 100 bike share stations for a 'Healthy Ride'.",
    weatherSpring:{Thunderstorm:0.05,Snow:0.05,Fog:0.025,Cloudy:0.2,Rain:0.15},
    weatherSummer:{Fog:0.025,Rain:0.05,'Heat Wave':0.1,Thunderstorm:0.15,Cloudy:0.2},
    weatherAutumn:{Fog:0.025,Cloudy:0.2,'Heat Wave':0.025,Snow:0.05,Rain:0.1},
    weatherWinter:{Cloudy:0.2,Rain:0.05,Snow:0.2,Fog:0.025,"Diamond Dust":0.005},
  }),
  'US-PLV': assert<Location>({
    label:"Playa Vista", region:"North America", terrain:"Beach", flag: '🇺🇸', id: 136,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Los_Angeles', vivillon: 'highplains',
    latitude: 33.98, longitude: -118.42,
    fact: "This city's home to the 'Spruce Goose' hangar.",
    weatherSpring:{Thunderstorm:0.05,Cloudy:0.1,'Heat Wave':0.025,Rain:0.025,Fog:0.1, Sandstorm: 0.035},
    weatherSummer:{'Heat Wave':0.125,Cloudy:0.1,Fog:0.1,Thunderstorm:0.075, Sandstorm: 0.035},
    weatherAutumn:{Cloudy:0.125,Fog:0.125,'Heat Wave':0.01,Rain:0.05, Sandstorm: 0.035},
    weatherWinter:{Fog:0.15,Cloudy:0.15,Rain:0.075, Sandstorm: 0.035}
  }),
  'US-PRY': assert<Location>({
    label:"Pryor Creek", region:"North America", terrain:"Rural", flag: '🇺🇸', id: 137,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Chicago', vivillon: 'polar',
    latitude: 36.31, longitude: -95.32,
    fact: 'This city is an OK datacenter.',
    weatherSpring:{Cloudy:0.1,Rain:0.05,'Heat Wave':0.05,Thunderstorm:0.15, Snow: 0.01, Windy: 0.075},
    weatherSummer:{Thunderstorm:0.2,Rain:0.025,Cloudy:0.1,'Heat Wave':0.1, Windy: 0.1},
    weatherAutumn:{Cloudy:0.1,'Heat Wave':0.025,Thunderstorm:0.1,Rain:0.075, Snow: 0.01, Windy: 0.075},
    weatherWinter:{Rain:0.05,Cloudy:0.15,Snow:0.075, Windy: 0.075},
  }),
  'US-PVU': assert<Location>({
    label:"Provo", region:"North America", terrain:"Mountain", magneticField: true, flag: '🇺🇸', id: 138,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Denver', vivillon: 'highplains', meteor: 'green_meteor',
    latitude: 40.23, longitude: -111.66,
    fact: 'This city is full of fiber and Olympic spirit.',
    weatherSpring:{Cloudy:0.125,Rain:0.15,Snow:0.01,Thunderstorm:0.025,Fog:0.125, Windy: 0.05},
    weatherSummer:{Fog:0.125,Cloudy:0.125,Rain:0.05,Thunderstorm:0.15,'Heat Wave':0.05, Windy: 0.05},
    weatherAutumn:{Fog:0.15,Snow:0.025,Thunderstorm:0.025,Cloudy:0.15,Rain:0.125, Windy: 0.05},
    weatherWinter:{Cloudy:0.175,Fog:0.175,"Diamond Dust":0.005,Rain:0.1,Snow:0.15, Windy: 0.05},
  }),
  'US-RDU': assert<Location>({
    label:"Durham", region:"North America", terrain:"Forest", flag: '🇺🇸', id: 139,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/New_York', vivillon: 'modern',
    latitude: 37.51, longitude: -78.88,
    fact: 'This city has mor engineers.',
    weatherSpring:{Cloudy:0.2,Rain:0.15,Thunderstorm:0.1, Fog: 0.05},
    weatherSummer:{'Heat Wave':0.1,Thunderstorm:0.15,Cloudy:0.2,Rain:0.05, Fog: 0.05},
    weatherAutumn:{Cloudy:0.2,'Heat Wave':0.05,Rain:0.15,Thunderstorm:0.05, Fog: 0.05},
    weatherWinter:{Rain:0.15,Snow:0.05,Cloudy:0.2, Fog: 0.05},
  }),
  'US-RES': assert<Location>({
    label:"Reston", region:"North America", terrain:"Gardens", flag: '🇺🇸', id: 140,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/New_York', vivillon: 'modern', flower: 'red',
    latitude: 38.96, longitude: -77.36,
    fact: 'This city was the first planned community of its kind from the 1960s.',
    weatherSpring:{'Heat Wave':0.025,Thunderstorm:0.05,Rain:0.15,Cloudy:0.15},
    weatherSummer:{Thunderstorm:0.1,Cloudy:0.125,Rain:0.1,'Heat Wave':0.075},
    weatherAutumn:{Rain:0.125,Cloudy:0.175,'Heat Wave':0.025,Thunderstorm:0.025},
    weatherWinter:{Rain:0.15,Cloudy:0.2},
  }),
  'US-RMD': assert<Location>({
    label:"Redmond", region:"North America", terrain:"Bay", flag: '🇺🇸', id: 141,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Los_Angeles', vivillon: 'highplains',
    latitude: 47.67, longitude: -122.12,
    fact: "This city is the Bicycle Capital of its given region.",
    weatherSpring:{Rain:0.1,Fog:0.125,Cloudy:0.15,Snow:0.01},
    weatherSummer:{Thunderstorm:0.1,Cloudy:0.175,Rain:0.1,Fog:0.1,'Heat Wave':0.01},
    weatherAutumn:{Rain:0.125,Fog:0.15,Cloudy:0.2,Snow:0.025,Thunderstorm:0.025},
    weatherWinter:{Fog:0.2,"Diamond Dust":0.005,Snow:0.2,Rain:0.075,Cloudy:0.2},
  }),
  'US-SAN': assert<Location>({
    label:"San Diego", region:"North America", terrain:"Mountain", flag: '🇺🇸', id: 142,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Los_Angeles', vivillon: 'highplains', meteor: 'indigo_meteor',
    latitude: 32.92, longitude: -117.25,
    fact: "This city's FunCo hosts regular social events.",
    weatherSpring:{Rain:0.025,Fog:0.05,'Heat Wave':0.025,Thunderstorm:0.05,Cloudy:0.2},
    weatherSummer:{Fog:0.05,'Heat Wave':0.1,Thunderstorm:0.075,Cloudy:0.2},
    weatherAutumn:{Cloudy:0.2,Fog:0.05,Rain:0.05,'Heat Wave':0.05,Thunderstorm:0.025},
    weatherWinter:{Cloudy:0.2,Rain:0.1,Fog:0.05},
  }),
  'US-SAT': assert<Location>({
    label:"San Antonio", region:"North America", terrain:"Grasslands", flag: '🇺🇸', id: 143,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Chicago', vivillon: 'modern',
    latitude: 29.65, longitude: -98.45,
    fact: "This city's Pearl District is a place that should be remembered.",
    weatherSpring:{Rain:0.1,'Heat Wave':0.075,Cloudy:0.15,Thunderstorm:0.05},
    weatherSummer:{Cloudy:0.15,Thunderstorm:0.1,'Heat Wave':0.125,Rain:0.05},
    weatherAutumn:{Rain:0.1,Cloudy:0.15,'Heat Wave':0.05,Thunderstorm:0.05},
    weatherWinter:{Rain:0.15,Cloudy:0.2},
  }),
  'US-SBO': assert<Location>({
    label:"San Bruno", region:"North America", terrain:"Bay", flag: '🇺🇸', id: 144,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Los_Angeles', vivillon: 'highplains',
    latitude: 37.63, longitude: -122.41,
    fact: 'This city is home to YouTube.',
    weatherSpring:{Rain:0.025,Fog:0.1,Cloudy:0.15},
    weatherSummer:{Fog:0.1,Thunderstorm:0.025,Cloudy:0.15,Rain:0.025,'Heat Wave':0.05},
    weatherAutumn:{Fog:0.1,Cloudy:0.15,Rain:0.025},
    weatherWinter:{Fog:0.1,Cloudy:0.15,Rain:0.075}
  }),
  'US-SEA': assert<Location>({
    label:"Seattle", region:"North America", terrain:"Bay", flag: '🇺🇸', id: 145,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Los_Angeles', vivillon: 'highplains',
    latitude: 47.60, longitude: -122.33,
    fact: 'This city has an iconic space-era tower.',
    weatherSpring:{Rain:0.3,Fog:0.15,Cloudy:0.3,Thunderstorm:0.1, Snow: 0.025},
    weatherSummer:{'Heat Wave':0.025,Rain:0.2,Thunderstorm:0.2,Cloudy:0.3,Fog:0.15},
    weatherAutumn:{Fog:0.15,Cloudy:0.3,Thunderstorm:0.05,Snow:0.05,Rain:0.3},
    weatherWinter:{Fog:0.15,Cloudy:0.35,Rain:0.15,"Diamond Dust":0.0025,Snow:0.2},
  }),
  'US-SFO': assert<Location>({
    label:"San Francisco", region:"North America", terrain:"Bay", flag: '🇺🇸', id: 146,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Los_Angeles', vivillon: 'highplains',
    latitude: 37.78, longitude: -122.47,
    fact: "The coldest winter ever experienced was a summer in this city.",
    weatherSpring:{Thunderstorm:0.01,Rain:0.01,Cloudy:0.05,Fog:0.2},
    weatherSummer:{Rain:0.01,Cloudy:0.05,'Heat Wave':0.1,Fog:0.25,Thunderstorm:0.01},
    weatherAutumn:{Fog:0.25,Cloudy:0.05,Thunderstorm:0.01,Rain:0.05},
    weatherWinter:{Cloudy:0.1,Rain:0.05,Fog:0.2,Snow:0.005,Thunderstorm:0.1},
  }),
  'US-SLC': assert<Location>({
    label:"Salt Lake City", region:"North America", terrain:"Mountain", magneticField: true, flag: '🇺🇸', id: 147,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Denver', vivillon: 'highplains', meteor: 'orange_meteor',
    latitude: 40.76, longitude: -111.89,
    fact: 'This city are quite healthy, with moderate amounts of fiber and sodium.',
    weatherSpring:{Fog:0.2,Thunderstorm:0.025,Rain:0.125,Cloudy:0.15, Snow: 0.01, Windy: 0.05},
    weatherSummer:{'Heat Wave':0.1,Rain:0.1,Fog:0.2,Thunderstorm:0.1,Cloudy:0.15, Windy: 0.05},
    weatherAutumn:{Cloudy:0.175,Thunderstorm:0.025,Rain:0.125,Snow:0.025,Fog:0.2, Windy: 0.05},
    weatherWinter:{"Diamond Dust":0.005,Rain:0.05,Cloudy:0.2,Fog:0.2,Snow:0.2, Windy: 0.05}
  }),
  'US-SJC': assert<Location>({
    label: 'San Jose', region: 'North America', terrain: 'Urban', flag: '🇺🇸', id: 157,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Los_Angeles', vivillon: 'highplains',
    latitude: 33.34, longitude: -121.89,
    fact: 'The first radio broadcasting station was placed in this city.',
    weatherSpring:{Thunderstorm:0.05,Rain:0.025,Cloudy:0.125,'Heat Wave':0.05},
    weatherSummer:{Cloudy:0.1,Rain:0.01,Thunderstorm:0.06,'Heat Wave':0.075},
    weatherAutumn:{Rain:0.025,'Heat Wave':0.05,Cloudy:0.1},
    weatherWinter:{Thunderstorm:0.075,Rain:0.05,Cloudy:0.1},
  }),
  'US-SVL': assert<Location>({
    label:"Sunnyvale", region:"North America", terrain:"Bay", flag: '🇺🇸', id: 148,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Los_Angeles', vivillon: 'highplains',
    latitude: 37.37, longitude: -122.04,
    fact: "This city features the first Google owned, Cloud occupied building.",
    weatherSpring:{Thunderstorm:0.025,Rain:0.025,Cloudy:0.1},
    weatherSummer:{Fog:0.025,Cloudy:0.05,Rain:0.01,Thunderstorm:0.04,'Heat Wave':0.05},
    weatherAutumn:{Rain:0.025,'Heat Wave':0.025,Cloudy:0.05},
    weatherWinter:{Thunderstorm:0.075,Rain:0.05,Cloudy:0.1},
  }),
  'US-THN': assert<Location>({
    label:"Thornton", region:"North America", terrain:"Mountain", magneticField: true, flag: '🇺🇸', id: 149,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/Denver', vivillon: 'highplains', meteor: 'red_meteor',
    latitude: 39.87, longitude: -104.97,
    fact: "A chemical weapons plant here has been converted into a wildlife refuge.",
    weatherSpring:{Rain:0.15,Thunderstorm:0.05,Cloudy:0.1,Fog:0.1,Snow:0.05, Windy: 0.05},
    weatherSummer:{Thunderstorm:0.15,Rain:0.05,'Heat Wave':0.05,Cloudy:0.1,Fog:0.1, Windy: 0.05},
    weatherAutumn:{Fog:0.075,Rain:0.15,Snow:0.05,Thunderstorm:0.05,Cloudy:0.125, Windy: 0.05},
    weatherWinter:{Fog:0.05,Cloudy:0.15,Rain:0.1,"Diamond Dust":0.002,Snow:0.2, Windy: 0.05},
  }),
  'US-UOS': assert<Location>({
    label:"Bridgeport", region:"North America", terrain:"Forest", flag: '🇺🇸', id: 150,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/New_York', vivillon: 'polar',
    latitude: 41.28, longitude: -73.19,
    fact: "This city is named after two types of infrastructure.",
    weatherSpring:{Cloudy:0.2,Thunderstorm:0.05,Fog:0.1,Rain:0.1},
    weatherSummer:{Cloudy:0.2,Thunderstorm:0.125,Fog:0.1,Rain:0.05,'Heat Wave':0.1},
    weatherAutumn:{Cloudy:0.2,Rain:0.1,Thunderstorm:0.05,Fog:0.1},
    weatherWinter:{Fog:0.1,Cloudy:0.2,Snow:0.025,Rain:0.15},
  }),
  'US-WAS': assert<Location>({
    label:"Washington, DC", region:"North America", terrain:"Urban", flag: '🇺🇸', id: 151,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/New_York', vivillon: 'polar',
    latitude: 38.9, longitude: -77.02,
    fact: "Many places in the US honor Abraham Lincoln, but the memorial here is larger than life.",
    weatherSpring:{Cloudy:0.15,Thunderstorm:0.1,'Heat Wave':0.025,Rain:0.1},
    weatherSummer:{'Heat Wave':0.15,Rain:0.1,Cloudy:0.1,Thunderstorm:0.15},
    weatherAutumn:{Cloudy:0.1,'Heat Wave':0.05,Rain:0.125,Thunderstorm:0.075},
    weatherWinter:{Snow:0.025,Cloudy:0.2,Rain:0.15},
  }),
  'US-WCK': assert<Location>({
    label:"Widow's Creek", region:"North America", terrain:"Forest", flag: '🇺🇸', id: 156,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/New_York', vivillon: 'polar',
    latitude: 34.91, longitude: -85.75,
    fact: "This city's name is partially shared with a spider.",
    weatherSpring:{Cloudy:0.25,Thunderstorm:0.075,Fog:0.075,Rain:0.125},
    weatherSummer:{Cloudy:0.25,Thunderstorm:0.15,Fog:0.075,Rain:0.075,'Heat Wave':0.125},
    weatherAutumn:{Cloudy:0.25,Rain:0.125,Thunderstorm:0.075,Fog:0.075},
    weatherWinter:{Fog:0.125,Cloudy:0.25,Snow:0.05,Rain:0.175},
  }),
  'US-WRJ': assert<Location>({
    label:"White River Junction", region:"North America", terrain:"Rural", flag: '🇺🇸', id: 152,
    hemiLat: 'North', hemiLong: 'West', timezone: 'America/New_York', vivillon: 'polar',
    latitude: 44.61, longitude: -72.35,
    fact: "This city is Tiptop and Cooler.",
    weatherSpring:{Cloudy:0.1,Rain:0.1,Snow:0.05,Thunderstorm:0.05,"Diamond Dust":0.001, Windy: 0.05},
    weatherSummer:{Thunderstorm:0.125,Cloudy:0.1,Rain:0.05, Windy: 0.075},
    weatherAutumn:{"Diamond Dust":0.001,Cloudy:0.1,Rain:0.05,Thunderstorm:0.05,Snow:0.15, Windy: 0.05},
    weatherWinter:{Thunderstorm:0.05,Rain:0,"Diamond Dust":0.01,Snow:0.35,Cloudy:0.15, Windy: 0.05},
  }),
  'ZA-JNB': assert<Location>({
    label:"Johannesburg", region:"Africa / Middle East", terrain:"Grasslands", flag: '🇿🇦', id: 153,
    hemiLat: 'South', hemiLong: 'East', timezone: 'Africa/Johannesburg', vivillon: 'river',
    latitude: -25.73, longitude: 28.05,
    fact: "This city of gold lies at the tip of its landmass.",
    weatherAutumn:{Cloudy:0.2,'Heat Wave':0.025,Rain:0.125,Thunderstorm:0.025, Windy: 0.025},
    weatherWinter: {Snow:0.075,Rain:0.15,Cloudy:0.2, Windy: 0.025},
    weatherSpring:{Rain:0.1,Cloudy:0.2,'Heat Wave':0.075,Thunderstorm:0.1, Windy: 0.025},
    weatherSummer:{Thunderstorm:0.125,Cloudy:0.2,Rain:0.075,'Heat Wave':0.15, Windy: 0.05},
  }),
}

export type LocationId = (keyof typeof Globe) | 'Unknown' | 'Hatched' | 'Restored'