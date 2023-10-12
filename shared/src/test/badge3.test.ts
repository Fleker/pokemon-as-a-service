import test from 'ava'
import { MATCH_SIMPLE } from '../badge3'
import * as B from '../badge3'
import {Badge, Pokemon} from '../badge3'
import { toBase16 } from '../baseconv'
import { PokemonId } from '../pokemon/types'
import { LocationId } from '../locations-list'
import { get } from '../pokemon'
import * as P from '../gen/type-pokemon'

const BASCULIN = 550
const SNORUNT =  361

test('Verify base conversion', t => {
  t.is('51800103', toBase16('1hw043'))
})

test('Verify full encode/decode', t => {
  const basculin = new Badge(B.Pokemon(BASCULIN, {
    pokeball: 'repeatball',
    variant: 1,
    gender: '',
    shiny: false,
    affectionate: false,
    form: 'blue_stripe',
    location: 'AT-VIE',
  }))
  t.is(basculin.toString(), '8C#h4043')

  const snorunt = new Badge(B.Pokemon(SNORUNT, {
    affectionate: false,
    gender: 'female', // 12 -> B
    pokeball: 'premierball', // 18 -> 12
    location: 'AT-VIE',
    shiny: true, // 2
    variant: undefined, // F
    form: undefined, // FF
  }))
  // This string is as long as 'potw-361' but encodes much more
  // information.
  // An analog would be 'potw-361-female-shiny', nearly 3x as long
  // while containing less data.
  t.is(snorunt.toString(), '5F#i-LY3')

  const bulbPkmn = B.Pokemon(1, {
    affectionate: false,
    gender: '',
    pokeball: 'pokeball',
    location: 'Unknown' as LocationId,
    shiny: false, // 2
    variant: undefined, // F
    form: undefined, // FF
  })
  const bulbasaur = new Badge(bulbPkmn)
  t.is(bulbasaur.toString(), '1#YfY0')
})

test('Verify Furfrou does not change with bad location', t => {
  /**
   * Furfrou Diamond: aA#1Y0bN
   * Furfrou Star: aA#1Y07N
   * Furfrou Heart: aA#1Y03N
   * Furfrou Natural: aA#1X--N
   * Furfrou¹⁴✨: aA#1U-XN // Should never happen
   */
  const printPersonality = (str) => {
    const personality16 = toBase16(str).padStart(8, '0')
    t.log(str, personality16)
    const byte3 = personality16.substring(4, 6)
    t.log(byte3)
    const number3 = parseInt(byte3, 16)
    t.log(number3)
  }
  printPersonality('1Y0fN')
  printPersonality('1Y0c0')
  printPersonality('1Y0bN')
  // Instead of '1Y0fN' we get '1Y0bN'
  const furfrou = get(`potw-676`)!
  const index = furfrou.syncableForms!.indexOf('diamond')
  t.is(3, index)
  t.deepEqual(B.toPersonality('1Y0fN', 676), {
    form: 'diamond',
    pokeball: 'greatball',
    affectionate: false,
    gender: '',
    shiny: false,
    location: 'Unknown',
    variant: undefined,
    nature: 'Hardy',
    debug: {
      byte1: '01',
      byte2: 'F0',
      byte3: '03',
      byte4: 'F1',
      formIndex: 3,
      number1: 1,
      number2: 240,
      number3: 3,
      number4: 241,
      variantId: 15,
    },
  })
  t.is(B.fromPersonality({
    form: 'diamond',
    pokeball: 'greatball',
    affectionate: false,
    gender: '',
    shiny: false,
    location: 'Unknown',
  }, 676), '1Y0c0')
  t.is(new Badge('aA#1Y0fN').personality.form, 'diamond', 'toPersonality fail')
  t.is(new Badge('aA#1Y0fN').toString(), 'aA#1Y0c0')
  t.is(new Badge('aA#1Y07N').toString(), 'aA#1Y040')
  t.is(new Badge('aA#1Y03N').toString(), 'aA#1Y000')
  t.is(new Badge('aA#1X--N').toString(), 'aA#1U-Y0')
  t.is(new Badge('aA#1Y0fN').toOriginalString(), 'aA#1Y0fN', 'Should preserve bad ID')
})

test('Personality parsing', t => {
  const basculin = B.toPersonality('h4043', 550)
  t.is('repeatball', basculin.pokeball)
  t.is(1, basculin.variant)
  t.is('', basculin.gender)
  t.false(basculin.shiny)
  t.false(basculin.affectionate)
  t.is('blue_stripe', basculin.form)
  t.is('AT-VIE', basculin.location)

  const femaleSnorunt = B.toPersonality('i-LY3', 361)
  t.log(femaleSnorunt)
  t.is('premierball', femaleSnorunt.pokeball)
  t.falsy(femaleSnorunt.variant)
  t.is('female', femaleSnorunt.gender)
  t.true(femaleSnorunt.shiny)

  const bulbasaur = B.toPersonality('YfY0', 1)
  t.is('pokeball', bulbasaur.pokeball)

  const kyurem = B.toPersonality('AYf_4', 646)
  // t.log('AYf_4', 646)
  // t.log(toBase16('AYf_4').padStart(8, '0'))
  // t.log('24F0FF84'.substring(0, 2))
  // t.log(parseInt('24', 16))
  t.is('safariball', kyurem.pokeball)

  // Castform shouldn't have a gender
  const femaleCastform = B.toPersonality('i-LY3', 351)
  t.is('', femaleCastform.gender, 'Castform should clear out gender')

  const maleCastform = B.fromPersonality({
    gender: 'male',
    pokeball: 'premierball',
    shiny: true,
    variant: undefined,
    location: 'AT-VIE',
    affectionate: false,
  }, 351)
  t.is('iYLY3', maleCastform, 'Castform gender should not matter')

  const femaleBlueShinyBasculin3 = B.fromPersonality({
    gender: 'female',
    pokeball: 'pokeball',
    shiny: true,
    variant: 3,
    location: 'US-MTV',
    affectionate: false,
    form: 'blue_stripe',
  }, 550)
  t.is('cw64', femaleBlueShinyBasculin3, 'Basculin should parse')
  const inversedBlueShinyBasculin3 = B.toPersonality('cw64', 550)
  t.is('blue_stripe', inversedBlueShinyBasculin3.form)
  t.is(3, inversedBlueShinyBasculin3.variant)
  t.is(true, inversedBlueShinyBasculin3.shiny)
  t.is('', inversedBlueShinyBasculin3.gender, 'Basculin does not have a gender')
})

test('Personality encoding', t => {
  const basculin: B.Personality = {
    affectionate: false,
    form: 'blue_stripe',
    location: 'AT-VIE',
    pokeball: 'repeatball',
    gender: '',
    shiny: false,
    variant: 1,
  }
  t.is(B.fromPersonality(basculin, 550), 'h4043')

  const femaleSnorunt: B.Personality = {
    affectionate: false,
    gender: 'female', // 12 -> B
    pokeball: 'premierball', // 18 -> 12
    location: 'AT-VIE',
    shiny: true, // 2
    variant: undefined, // F
    form: undefined, // FF
  }
  // 12_FE_FF_03
  t.is(B.fromPersonality(femaleSnorunt, 361), 'i-LY3')

  const safariBallKyurem: B.Personality = {
    affectionate: false,
    gender: '',
    pokeball: 'safariball',
    location: 'US-MTV',
    shiny: false,
    variant: undefined,
    form: undefined,
  }
  t.log(toBase16(''))
  t.is(B.fromPersonality(safariBallKyurem, 646), '4Yf_4')
})

test('Default tags I/O', t => {
  // K_64 -> 46_10
  t.deepEqual(B.toDefaultTags('K'), [
    'BREED', 'RELEASE', 'BATTLE', 'BUDDY'
  ], 'Decode example 1')
  t.is(B.fromDefaultTags([
    'BREED', 'RELEASE', 'BATTLE', 'BUDDY'
  ]), 'K', 'Encode example 1')
})

test('Tags I/O', t => {
  // Represents tag indicies only
  t.deepEqual(B.toTags('x2a_D'), [2, 10, 62, 39], 'Decode example 1')
  t.deepEqual(B.fromTags([2, 10, 62, 39]), /*x*/'2a_D', 'Encode example 1')
})

test('Tag string', t => {
  const bulb = '1#Yf_4'
  const badge = new Badge(bulb)
  badge.tags = [2, 10]
  t.is(badge.toString(), '1#Yf_4#02a')
})

test('toLabel', t => {
  const basculin = new Badge(B.Pokemon(BASCULIN, {
    pokeball: 'repeatball',
    variant: 1,
    gender: '',
    shiny: false,
    affectionate: false,
    form: 'blue_stripe',
    location: 'AT-VIE',
  }))
  t.is(basculin.toLabel(), 'Basculin Blue Stripe¹')

  const snorunt = new Badge(B.Pokemon(SNORUNT, {
    affectionate: false,
    gender: 'female', // 12 -> B
    pokeball: 'premierball', // 18 -> 12
    location: 'AT-VIE',
    shiny: true, // 2
    variant: undefined, // F
    form: undefined, // FF
  }))
  t.is(snorunt.toLabel(), 'Snorunt ♀✨')
})

test('fromLegacy', t => {
  // This won't work.
  // I can fix by adding in Mothim's syncableForms, but that breaks the
  // Burmy evolution test in items.test.ts.
  // So let's leave this as an open issue for now.
  // FIXME
  //
  // const sandyMothimLegacy = 'potw-414-sandy-male-shiny'
  // const sandyMothim = Badge.fromLegacy(sandyMothimLegacy)
  // t.is(sandyMothim.personality.form, 'sandy')
  // t.is(sandyMothim.personality.gender, 'male')
  // t.true(sandyMothim.personality.shiny)
  // FIXME: Darmanitan has issues with a default form and extra form
  // Will this break those parsers?
  const darmanNoFormId = 'potw-555'
  const darmanNoForm = Badge.fromLegacy(darmanNoFormId)
  t.falsy(darmanNoForm.personality.form)
  const darmanOrdId = 'potw-555-ordinary'
  const darmanOrd = Badge.fromLegacy(darmanOrdId)
  t.truthy(darmanOrd.personality.form)

  const fanRotomLegacy = 'potw-479-fan-shiny'
  const fanRotom = Badge.fromLegacy(fanRotomLegacy)
  t.is(fanRotom.personality.form, 'fan')
  t.true(fanRotom.personality.shiny)

  const washRotomLegacy = 'potw-479-wash-var1'
  const washRotom = Badge.fromLegacy(washRotomLegacy)
  t.is(washRotom.personality.form, 'wash')
  t.is(washRotom.personality.variant, 1)
  t.false(washRotom.personality.shiny)
})

test('Badge.toSprite', t => {
  t.is(Badge.fromLegacy('potw-201-?').toSprite(), 'potw-201-question')
  t.is(new Badge('39#Y1K4').toSprite(), 'potw-201-question')
})

test('Badge.match (simple)', t => {
  const expected: [string, string[], string][] = [
    [Pokemon(1), [Pokemon(1)], Pokemon(1)],
    [Pokemon(1), [Pokemon(1, {shiny: true})], Pokemon(1, {shiny: true})],
    [Pokemon(201, {form: 'a'}), [Pokemon(201)], Pokemon(201)],
    [Pokemon(201, {pokeball: 'greatball'}), [Pokemon(201, {pokeball: 'repeatball'})], Pokemon(201, {pokeball: 'repeatball'})],
  ]
  for (const [badge, list, res] of expected) {
    const {match, result} = Badge.match(badge, list as unknown as PokemonId[], MATCH_SIMPLE)
    t.true(match)
    t.is(result, res, `Result ${result} doesn't match expected ${res}`)
  }

  const unexpected: [string, string[]][] = [
    [Pokemon(2), [Pokemon(1)]],
  ]
  for (const [badge, list] of unexpected) {
    const {match, result} = Badge.match(badge, list as unknown as PokemonId[], MATCH_SIMPLE)
    t.false(match)
    t.falsy(result)
  }
})

test('Badge.match (predicates)', t => {
  const {match} = Badge.match('o#4L_4', ['o#Yf_4', '6#Yf_4', 'n#Yf_4'], B.MATCH_FILTER)
  t.true(match, 'Shiny Arbok does not fit requirement for Arbok')
})

test('Handle unknown forms', t => {
  const badge = Badge.fromLegacy('potw-025-zen')
  t.log(badge)
  t.is(badge.personality.location, 'US-MTV')
  t.is(badge.personality.shiny, false)
  t.is(badge.personality.form, undefined)
  t.is(badge.personality.variant, undefined)
  const bstr = badge.toString()
  t.is(bstr, 'p#Yf_4')
  t.is(badge.toLabel(), 'Pikachu')
})

test('Nature parsing', t => {
  const badge = Badge.fromLegacy('potw-025')
  t.is(badge.personality.nature, 'Hardy', 'Hardy should be default')

  const naturesToTest = [
    ['Hardy', 'p#Yf_4'],
    ['Adamant', 'p#wYf_4'],
    ['Bold', 'p#10Yf_4'],
    ['Timid', 'p#1wYf_4'],
    ['Modest', 'p#20Yf_4'],
    ['Calm', 'p#2wYf_4'],
    ['Naughty', 'p#30Yf_4'],
    ['Jolly', 'p#3wYf_4'],
  ]
  for (const [nature, pokemonId] of naturesToTest) {
    badge.personality.nature = nature as B.Nature
    const restring = badge.toString()
    t.is(restring, pokemonId)
    const rebadge = new Badge(restring)
    t.is(rebadge.personality.nature, nature)
  }
})

test('Badge.create', t => {
  const gible = Badge.create(P.Gible)
  t.not(gible.personality.gender, '', 'Gible needs a gender!')

  const furfrou = Badge.create(P.Furfrou)
  t.is(furfrou.personality.form, 'natural', 'Furfrou needs a form')

  const burmy = Badge.create(P.Burmy)
  t.truthy(burmy.personality.gender)
  t.truthy(burmy.personality.form)

  const basculinWhite = Badge.create('potw-550-white_stripe')
  t.not(basculinWhite.personality.gender, '', 'Basculin White Stripe needs a gender')
})

test('Badge sizes', t => {
  const squirtleFromDenver = new Badge('7#1YfZT')
  const monfernoFromDenver = new Badge('67#1YfZT')
  const gulpinFromMtv = new Badge('4Y#4f_4')
  t.is(squirtleFromDenver.size, 'xxl')
  t.is(monfernoFromDenver.size, 'xxs')
  t.is(gulpinFromMtv.size, undefined)
})
