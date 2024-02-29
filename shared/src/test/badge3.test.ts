import test from 'ava'
import { MATCH_SIMPLE } from '../badge3'
import * as B from '../badge3'
import {Badge, Pokemon, toPersonality} from '../badge3'
import { toBase16 } from '../baseconv'
import { PokemonId } from '../pokemon/types'
import { LocationId } from '../locations-list'
import { get } from '../pokemon'
import { types } from '../pokemon/types'
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
  t.is(basculin.toString(), '8C#14g0gdy')

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
  t.is(snorunt.toString(), '5F#1b_fMdO')

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
  t.is(bulbasaur.toString(), '1#3MfM1G')

  const legacyCaterpie = Badge.fromLegacy('potw-010-shiny')
  const caterpie: B.Personality = {
    affectionate: false,
    gender: '',
    pokeball: 'pokeball',
    location: 'US-MTV',
    shiny: true,
    variant: undefined,
    form: undefined,
    nature: 'Hardy',
    ability: 'PlaceholderPower',
    gmax: false,
    isOwner: false,
    teraType: 'Bug',
    debug: {
      byte1: '00',
      byte2: 'F2',
      byte3: '3F',
      byte4: '84',
      byte5: '02',
      formIndex: undefined,
      number1: 0,
      number2: 242,
      number3: 63,
      number4: 132,
      number5: 2,
      variantId: 15,
    },
  }
  t.deepEqual(legacyCaterpie.personality, caterpie)
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
  t.log(Pokemon(676, {
    form: 'diamond',
    pokeball: 'greatball',
    affectionate: false,
    gender: '',
    shiny: false,
    location: 'Unknown',
    variant: undefined,
    nature: 'Hardy',
  }))
  t.deepEqual(B.toPersonality('7M0M0a', 676), {
    form: 'diamond',
    pokeball: 'greatball',
    affectionate: false,
    gender: '',
    shiny: false,
    location: 'Unknown',
    variant: undefined,
    nature: 'Hardy',
    ability: 'PlaceholderPower',
    gmax: false,
    isOwner: false,
    teraType: 'Normal',
    debug: {
      byte1: '01',
      byte2: 'F0',
      byte3: '03',
      byte4: '00',
      byte5: '0A',
      formIndex: 3,
      number1: 1,
      number2: 240,
      number3: 3,
      number4: 0,
      number5: 10,
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
  }, 676), '7M0M0a')
  t.is(new Badge('aA#7M0M0a').personality.form, 'diamond', 'toPersonality fail')
  t.is(new Badge('aA#7M0M0a').toString(), 'aA#7M0M0a')
  t.is(new Badge('aA#1Y07N').toString(), 'aA#1fM4b')
  t.is(new Badge('aA#1Y03N').toString(), 'aA#1fM0b')
  t.is(new Badge('aA#1X--N').toString(), 'aA#1fM0b')
  t.is(new Badge('aA#1Y0fN').toOriginalString(), 'aA#1Y0fN', 'Should preserve bad ID')
})

test('Personality parsing', t => {
  t.log(Pokemon(550, {
    pokeball: 'repeatball',
    variant: 1,
    gender: '',
    shiny: false,
    affectionate: false,
    form: 'blue_stripe',
    location: 'AT-VIE',
  }))
  const basculin = B.toPersonality('14g0gdy', 550)
  t.is('repeatball', basculin.pokeball)
  t.is(1, basculin.variant)
  t.is('', basculin.gender)
  t.false(basculin.shiny)
  t.false(basculin.affectionate)
  t.is('blue_stripe', basculin.form)
  t.is('AT-VIE', basculin.location)

  t.log(Pokemon(361, {
    pokeball: 'premierball',
    variant: undefined,
    gender: 'female',
    shiny: true,
    affectionate: false,
    location: 'AT-VIE',
  }))
  const femaleSnorunt = B.toPersonality('1b_fMdO', 361)
  t.log(femaleSnorunt)
  t.is('premierball', femaleSnorunt.pokeball)
  t.falsy(femaleSnorunt.variant)
  t.is('female', femaleSnorunt.gender)
  t.true(femaleSnorunt.shiny)

  const bulbasaur = B.toPersonality('YfY0', 1)
  t.is('pokeball', bulbasaur.pokeball)

  t.log('~Kyurem')
  t.log(Pokemon(646, {
    pokeball: 'safariball',
    variant: undefined,
    gender: '',
    shiny: false,
    affectionate: false,
    location: 'AT-VIE',
  }))
  const kyurem = B.toPersonality('jMfMdi', 646)
  // t.log('AYf_4', 646)
  // t.log(toBase16('AYf_4').padStart(8, '0'))
  // t.log('24F0FF84'.substring(0, 2))
  // t.log(parseInt('24', 16))
  t.is('safariball', kyurem.pokeball)

  // Castform shouldn't have a gender
  t.log(Pokemon(351, {
    pokeball: 'premierball',
    variant: undefined,
    gender: 'female',
    shiny: true,
    affectionate: false,
    location: 'AT-VIE',
  }))
  const femaleCastform = B.toPersonality('1bOfMca', 351)
  t.is('', femaleCastform.gender, 'Castform should clear out gender')

  const maleCastform = B.fromPersonality({
    gender: 'male',
    pokeball: 'premierball',
    shiny: true,
    variant: undefined,
    location: 'AT-VIE',
    affectionate: false,
  }, 351)
  t.is('1bOfMca', maleCastform, 'Castform gender should not matter')

  const femaleBlueShinyBasculin3 = B.fromPersonality({
    gender: 'female',
    pokeball: 'pokeball',
    shiny: true,
    variant: 3,
    location: 'US-MTV',
    affectionate: false,
    form: 'blue_stripe',
  }, 550)
  t.is('O0ohy', femaleBlueShinyBasculin3, 'Basculin should parse')
  const inversedBlueShinyBasculin3 = B.toPersonality('O0ohy', 550)
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
  t.is(B.fromPersonality(basculin, 550), '14g0gdy')

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
  t.is(B.fromPersonality(femaleSnorunt, 361), '1b_fMdO')

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
  t.is(B.fromPersonality(safariBallKyurem, 646), 'jMfUhi')

  const lastFormAlcremie: B.Personality = {
    form: 'ribbon_rainbow_swirl',
    affectionate: false,
    gender: '',
    pokeball: 'safariball',
    location: 'US-MTV',
    shiny: false,
    variant: undefined,
  }

  const noFormAlcremie: B.Personality = {
    form: undefined,
    affectionate: false,
    gender: '',
    pokeball: 'safariball',
    location: 'US-MTV',
    shiny: false,
    variant: undefined,
  }

  t.not(B.fromPersonality(lastFormAlcremie, 869), B.fromPersonality(noFormAlcremie, 869))
})

test('Badge Gigantamax encoding', t => {
  const gmaxAlcremie: B.Personality = {
    form: 'berry_vanilla_cream',
    affectionate: false,
    gender: '',
    pokeball: 'cherishball',
    location: 'US-MTV',
    shiny: false,
    variant: undefined,
    gmax: true,
  }
  const nomaxAlcremie: B.Personality = {
    form: 'berry_vanilla_cream',
    affectionate: false,
    gender: '',
    pokeball: 'cherishball',
    location: 'US-MTV',
    shiny: false,
    variant: undefined,
    gmax: false,
  }
  t.is(B.fromPersonality(gmaxAlcremie, 869), '1vMwogO')

  const pkmn = get('potw-869')!
  t.truthy(pkmn)
  const gmaxByte3 = (() => {
    const gmaxable = pkmn.gmax !== undefined
    const gmaxId = (gmaxAlcremie.gmax === true && gmaxable ? 128 : 0)
    t.true(gmaxable)
    t.true(gmaxAlcremie.gmax)
    t.is(gmaxId, 128)

    if (gmaxAlcremie.form) {
      const index = pkmn.syncableForms!.indexOf(gmaxAlcremie.form)
      if (index > -1) {
        return index | gmaxId
      }
    }

    return 63 | gmaxId
  })().toString(16).padStart(2, '0')
  t.log(gmaxByte3)

  const nomaxByte3 = (() => {
    const gmaxable = pkmn.gmax !== undefined
    const gmaxId = (nomaxAlcremie.gmax === true && gmaxable ? 128 : 0)
    t.false(nomaxAlcremie.gmax)
    t.is(gmaxId, 0)

    if (nomaxAlcremie.form) {
      const index = pkmn.syncableForms!.indexOf(nomaxAlcremie.form)
      if (index > -1) {
        return index | gmaxId
      }
    }

    return 63 | gmaxId
  })().toString(16).padStart(2, '0')
  t.log(nomaxByte3)
  t.not(gmaxByte3, nomaxByte3)

  t.not(B.fromPersonality(nomaxAlcremie, 869), '1vMwogO')
  t.log(new Badge(Pokemon(869, gmaxAlcremie)))
  t.log(new Badge(Pokemon(869, nomaxAlcremie)))
  t.not(B.fromPersonality(gmaxAlcremie, 869), B.fromPersonality(nomaxAlcremie, 869))
})

test('Badge: Falinks cannot Gigantamax', t => {
  const gmaxFalinks: B.Personality = {
    form: undefined,
    affectionate: false,
    gender: '',
    pokeball: 'cherishball',
    location: 'US-MTV',
    shiny: false,
    variant: undefined,
    gmax: true,
  }
  const nomaxFalinks: B.Personality = {
    form: undefined,
    affectionate: false,
    gender: '',
    pokeball: 'cherishball',
    location: 'US-MTV',
    shiny: false,
    variant: undefined,
    gmax: true,
  }
  t.is(B.fromPersonality(gmaxFalinks, 869), '1vMLUgO')
  t.is(B.fromPersonality(gmaxFalinks, 869), B.fromPersonality(nomaxFalinks, 869))
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
  t.is(badge.toString(), '1#fM22#02a')
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
  t.log(Pokemon(201, {form: '?'}))
  t.is(new Badge('39#3M6Uh2').toSprite(), 'potw-201-question')
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
  t.is(bstr, 'p#3MfUhW')
  t.is(badge.toLabel(), 'Pikachu')
})

test('Nature parsing', t => {
  const badge = Badge.fromLegacy('potw-025')
  t.is(badge.personality.nature, 'Hardy', 'Hardy should be default')

  const naturesToTest = [
    ['Hardy', 'p#3MfUhW'],
    ['Adamant', 'p#23MfUhW'],
    ['Bold', 'p#43MfUhW'],
    ['Timid', 'p#63MfUhW'],
    ['Modest', 'p#83MfUhW'],
    ['Calm', 'p#a3MfUhW'],
    ['Naughty', 'p#c3MfUhW'],
    ['Jolly', 'p#e3MfUhW'],
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
  t.log(furfrou)
  t.log(furfrou.toString())
  t.log(furfrou.toString().substring(8, 10))
  t.is(furfrou.personality.form, 'natural', 'Furfrou needs a form')

  const burmy = Badge.create(P.Burmy)
  t.truthy(burmy.personality.gender)
  t.truthy(burmy.personality.form)
  t.truthy(burmy.personality.isOwner)
  t.truthy(burmy.personality.ability)

  const basculinWhite = Badge.create('potw-550-white_stripe')
  t.not(basculinWhite.personality.gender, '', 'Basculin White Stripe needs a gender')
  t.is('Water', basculinWhite.personality.teraType)
  t.falsy(basculinWhite.ribbons)
})

test('Badge: Provide default Tera types', t => {
  const squirt = get('potw-007')!
  const teraIndex = types.indexOf(squirt.type1)
  const byte5 = (teraIndex << 3).toString(16).padStart(2, '0')
  t.is(byte5, '60')
})

test('Badge: Provide correct Tera types', t => {
  const squirt = new Badge(Pokemon(7))
  
  // Should be guaranteed Water-tera
  t.log(squirt.toString())
  t.is('7#3MfUhy', squirt.toString())
  const personality = '3MfUhy'
  const squirtPerson = toPersonality(personality, 7)
  const personality16 = toBase16(personality).padStart(10, '0')

  const byte5 = personality16.substring(8, 10)
  const number5 = parseInt(byte5, 16)
  const teraIndex = (number5 & 248) >> 3

  t.is(personality16, '00F03F8462')
  t.is(12, teraIndex)

  t.is('Water', squirt.personality.teraType)
  t.is('Water', squirtPerson.teraType)
})

test('Badge sizes', t => {
  // const squirtleFromDenverStr = new Badge('7#1YfZT')
  const squirtleFromDenverPkmn = Pokemon(7, {
    location: 'US-DEN',
    // teraType: 'Water',
  })
  const squirtleFromDenver = new Badge(squirtleFromDenverPkmn)
  const {eggBase} = get('potw-007')!
  const legacyId = squirtleFromDenver.toLegacyString()
  t.is(legacyId, 'potw-007')
  const idMod = (() => {
    if (Array.isArray(eggBase)) {
      return parseInt(eggBase[0].substring(5))
    }
    if (eggBase) {
      return parseInt(eggBase.substring(5))
    }
    return parseInt(legacyId.substring(5))
  })()
  t.is(idMod, 7)
  t.log(squirtleFromDenver.personality)
  const {number1, number2, number4} = squirtleFromDenver.personality.debug
  const squirtMod = (1 + idMod + (number1 & 31) + (number2 & 12) + (number2 & 2) + number4) % 64
  t.is(number1, 0)
  t.is(number2, 240)
  t.is(number4, 119)
  t.is(squirtMod, 63)

  const monfernoFromDenver = new Badge(Pokemon(391, { location: 'US-DEN' }))
  const gulpinFromMtv = new Badge(Pokemon(316, { location: 'US-MTV' }))
  t.is(squirtleFromDenver.size, 'xxl')
  t.is(monfernoFromDenver.size, 'xxs')
  t.is(gulpinFromMtv.size, undefined)
})
