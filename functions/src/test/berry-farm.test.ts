import test from 'ava'
import { Users } from '../db-types'
import * as F from '../../../shared/src/farming'
import {BerryPlot} from '../../../shared/src/server-types'
import { Berry, ITEMS, FertilizerId } from '../../../shared/src/items-list'
import * as Pkmn from '../../../shared/src/pokemon'

test('Checking plots', t => {
  const user = {
    eggs: [],
    hiddenItemsFound: [],
    items: {},
    lastPokeball: 0,
    ldap: 'nobody',
    berryPlots: 2,
    battleStadiumRecord: [],
    eggsLaid: 0,
    location: 'US-MTV',
    moveTutors: 0,
    raidRecord: [],
    settings: {
      disableRealtime: false,
      disableSyncTeams: false,
      pokeindex: false,
      theme: 'dark',
      union: false,
      flagLocation2: false, flagSearch2: false,
      flagTag: false, flagAchievementService: false,
      notification: {
        BATTLE_LEADERBOARD: {inapp: true, push: true},
        GTS_COMPLETE: {inapp: true, push: true},
        ITEM_DISPENSE: {inapp: true, push: true},
        RAID_CLAIM: {inapp: true, push: true},
        RAID_COMPLETE: {inapp: true, push: true},
        RAID_EXPIRE: {inapp: true, push: true},
        RAID_RESET: {inapp: true, push: true},
        VOYAGE_COMPLETE: {inapp: true, push: true},
        PLAYER_EVENT: {inapp: true, push: true},
        GAME_EVENT: {inapp: true, push: true},
      }
    },
    strikes: 0,
    pokemon: {},
  } as Users.Doc
  t.is(12, F.getTotalPlots(user.berryPlots))
  t.is(200, F.getNextPlotCost(user.berryPlots))
  t.is(50, F.getNextPlotCost(0))
})

/*
0.5176324619
0.5358867313
0.554784736
0.5743491775
0.5946035575
*/
test('Check encounter rate', t => {
  t.is(0.5 / 5, F.encounterRate(0))
  t.is(0.5176324619206888 / 5, F.encounterRate(1)) // ~3/5 expected
  t.is(0.5358867312681466 / 5, F.encounterRate(2)) // ~6/5 expected
  t.is(0.5547847360339225 / 5, F.encounterRate(3)) // ~10/5 expected
  t.is(0.5743491774985174 / 5, F.encounterRate(4)) // ~14/5 expected
})

test('Berry yield makes sense', t => {
  const pomeg = ITEMS.pomeg as Berry
  const pomegYield = F.getYield(pomeg)
  t.true(pomegYield >= pomeg.yield.min)
  t.true(pomegYield <= pomeg.yield.max)
  t.true(pomegYield === Math.floor(pomegYield), `Yield is not a whole number: ${pomegYield}`)

  const oran = ITEMS.oran as Berry
  const oranYield = F.getYield(oran, 'stablemulch')
  t.true(oranYield >= oran.yield.min)
  t.true(oranYield <= oran.yield.max)
  t.true(oranYield === Math.floor(oranYield), `Yield is not a whole number: ${oranYield}`)
})

test('Berry harvest time makes sense', t => {
  const testStart = Date.now()
  const HOUR = 1000 * 60 * 60
  const pomegTime = F.getHarvestTime('pomeg', testStart)
  t.not(pomegTime, testStart, 'The harvest time should not be the same as when we started!')
  t.is(pomegTime, testStart + 48 * HOUR)

  const oranTime = F.getHarvestTime('oran', testStart, 'boostmulch')
  t.is(oranTime, testStart + 36 * HOUR - 24 * HOUR)
})

test('isEmptyPlot', t => {
  const berryPlots: (BerryPlot | undefined)[] = [
    undefined,
    {oran: 123},
    {},
    {sitrus: 234, fertilizer: 'growthmulch'},
    {fertilizer: 'amazemulch'},
  ]
  t.true(F.isEmptyPlot(berryPlots[0]))
  t.false(F.isEmptyPlot(berryPlots[1]))
  t.true(F.isEmptyPlot(berryPlots[2]))
  t.false(F.isEmptyPlot(berryPlots[3]))
  t.true(F.isEmptyPlot(berryPlots[4]))
})

test('randomVariant', t => {
  t.is(F.randomVariant(Pkmn.get('potw-1010')!), undefined)
  t.true(F.randomVariant(Pkmn.get('potw-001')!)! > 0) // Bulbasaur
})

test('fertilizerVariant', t => {
  const realBulbasaur = F.getFertilizerPokemon('growthmulch')!
  t.not(realBulbasaur.id, undefined)

  const nothing = F.getFertilizerPokemon('adamantorb' as FertilizerId)
  t.is(nothing, undefined)
})
