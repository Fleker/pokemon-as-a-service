import { season, Location, Globe, WeatherType } from '../../../shared/src/locations-list';
import test from "ava";
import spacetime from 'spacetime'
import { timeOfDay, isDusk } from '../location.utils';

export const PLACEHOLDER_SANDSTORM: Location = {
  feebas: false,
  forecast: 'Sandstorm',
  label: 'Placeholder', flag: '',
  region: 'Asia', terrain: 'Bay',
  regice: false, regirock: false, registeel: false,
  hemiLat: 'North', hemiLong: 'East', timezone: 'America/New_York',
  weatherSpring: {},
  weatherSummer: {},
  weatherAutumn: {},
  weatherWinter: {},
  vivillon: 'sandstorm',
  id: -1,
  fact: 'Did you know that this place is not a real place?'
}

test('Placeholder', t => {
  t.false(PLACEHOLDER_SANDSTORM.feebas)
})

test('Timezones', t => {
  // Verify my priors
  const morning = spacetime('2020-01-01T08:00:00', 'America/New_York')
  const earlyMorning = morning.goto('America/Los_Angeles')
  t.is(earlyMorning.time().toString(), '5:00am')
  t.is(season(Globe['US-MTV'], morning.toLocalDate()), 'Winter')
})

test('Globe Timezones', t => {
  const nowKinda = spacetime('2020-01-01T00:00:00', 'Etc/GMT') // Default
  const locationWest = nowKinda.goto(Globe['US-NYC'].timezone)
  t.is(locationWest.date(), 31) // December 31st
  t.is(locationWest.hour(), 19) // 7pm
  t.true(isDusk(locationWest))
  t.is(timeOfDay(locationWest), 'Night')

  const locationEast = nowKinda.goto(Globe['JP-TOK'].timezone)
  t.is(locationEast.date(), 1) // January 1st
  t.is(locationEast.hour(), 9) // 9:00am
  t.is(timeOfDay(locationEast), 'Day')
})

test('Weather percentage makes sense', t => {
  const lteHundred = (weather: {[weather in WeatherType]?: number}) => {
    const percentages = Object.values(weather)
    const sum = percentages.reduce((acc, curr) => acc! + curr!)!
    return sum <= 1
  }
  const locations = Object.values(Globe)
  for (const location of locations) {
    const {weatherSpring, weatherSummer, weatherAutumn, weatherWinter} = location
    t.true(lteHundred(weatherSpring), `${location.label} weatherSpring is too high`)
    t.true(lteHundred(weatherSummer), `${location.label} weatherSummer is too high`)
    t.true(lteHundred(weatherAutumn), `${location.label} weatherAutumn is too high`)
    t.true(lteHundred(weatherWinter), `${location.label} weatherWinter is too high`)
  }
})

test('Garden locations have flowers', t => {
  const locations = Object.values(Globe)
  for (const location of locations) {
    if (location.terrain === 'Gardens') {
      t.truthy(location.flower, `${location.label} is a Garden without flowers`)
    }
  }
})

test('Mountain locations have meteor shards', t => {
  const locations = Object.values(Globe)
  for (const location of locations) {
    if (location.terrain === 'Mountain') {
      t.truthy(location.meteor, `${location.label} is a Mountain without Meteors`)
    }
  }
})

test('No two locations have the same ID', t => {
  const locations = Object.values(Globe)

  for (let i = 0; i < 255; i++) {
    const locationsWithId = locations.filter(l => l.id === i)
    t.true(locationsWithId.length < 2, `${locationsWithId.join(', ')} have same id ${i}`)
  }
})

test('No two locations have same geocoordinates', t => {
  const locations = Object.values(Globe)
  const latSet = new Set<number>()
  const longSet = new Set<number>()
  let hasFailed = false

  for (const location of locations) {
    if (!location.latitude) continue
    if (latSet.has(location.latitude)) {
      hasFailed = true
      t.log(`Location ${location.label} has non-unique latitude ${location.latitude}`)
    }
    latSet.add(location.latitude)
    
    if (longSet.has(location.longitude!)) {
      hasFailed = true
      t.log(`Location ${location.label} has non-unique longitude ${location.longitude}`)
    }
    longSet.add(location.latitude)
  }
  if (hasFailed) {
    t.fail('Found location errors')
  }
  t.pass()
})
