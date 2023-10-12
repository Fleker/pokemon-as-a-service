// Initialize Firebase
const admin = require('firebase-admin');
admin.initializeApp();

import test from 'ava'
import { TeamsBadge, Potw } from './../../../shared/src/badge2';
import { compatibleEggGroup, getEggMoveVariation, daycareItems, generateEgg, canBeShiny } from '../day-care.utils'
import * as P from './../../../shared/src/gen/type-pokemon'
import { babyProduced } from './../../../shared/src/platform/breeding-club';

test('Test one mother and one father egg group', t => {
  const result = compatibleEggGroup('Monster', 'Monster')
  t.is(result, 'MOTHER-LIKE')
})

test('Test multiple egg groups', t => {
  const motherTwoFatherOneSlotZero = compatibleEggGroup(['Monster', 'Water 1'], 'Monster')
  t.is(motherTwoFatherOneSlotZero, 'MOTHER-LIKE')

  const motherTwoFatherOneSlotOne = compatibleEggGroup(['Water 1', 'Monster'], 'Monster')
  t.is(motherTwoFatherOneSlotOne, 'MOTHER-LIKE')

  const motherOneFatherTwoSlotZero = compatibleEggGroup('Monster', ['Monster', 'Water 1'])
  t.is(motherOneFatherTwoSlotZero, 'MOTHER-LIKE')

  const motherOneFatherTwoSlotOne = compatibleEggGroup('Monster', ['Water 1', 'Monster'])
  t.is(motherOneFatherTwoSlotOne, 'MOTHER-LIKE')

  const motherTwoFatherTwo = compatibleEggGroup(['Monster', 'Water 1'], ['Water 1', 'Bug'])
  t.is(motherTwoFatherTwo, 'MOTHER-LIKE')
})

test('Test Ditto', t => {
  const mommyDitto = compatibleEggGroup('Ditto', 'Dragon')
  t.is(mommyDitto, 'FATHER-LIKE')

  const daddyDitto = compatibleEggGroup('Dragon', 'Ditto')
  t.is(daddyDitto, 'MOTHER-LIKE')

  const parentsDitto = compatibleEggGroup('Ditto', 'Ditto')
  t.is(parentsDitto, 'INVALID')
})

test('Test INVALID', t => {
  const motherInvalid = compatibleEggGroup('Undiscovered', 'Bug')
  t.is(motherInvalid, 'INVALID')

  const fatherInvalid = compatibleEggGroup('Bug', 'Undiscovered')
  t.is(fatherInvalid, 'INVALID')
})
test('Test INVALID for single-element arrays', t => {
  const incompatible = compatibleEggGroup(['Water 1'], ['Amorphous'])
  t.is(incompatible, 'INVALID')

  const compatible = compatibleEggGroup(['Bug'], ['Bug'])
  t.is(compatible, 'MOTHER-LIKE')
})

test('Test unpopulated data', t => {
  const undefinedFather = compatibleEggGroup('Bug', 'Undiscovered')
  t.is(undefinedFather, 'INVALID')
})

test('Egg moves', t => {
  // Pidgey w/o egg move
  const pidgeyPlain = getEggMoveVariation('potw-018', 'potw-018')
  t.is(undefined, pidgeyPlain)

  // Skarmory breeds Steel Wing
  const pidgeySteelWing = getEggMoveVariation('potw-018', 'potw-227')
  t.is(1, pidgeySteelWing)

  // Donphan's `move` is a string
  const phanpyPlayRough = getEggMoveVariation('potw-231', 'potw-303')
  t.is(1, phanpyPlayRough)

  // Breed variant Pokémon from variant Pokemon
  const roseliaShadowBall = getEggMoveVariation('potw-315', 'potw-315-var1')
  t.is(1, roseliaShadowBall)

  // Check var2 works as well
  const whismurDisarmingVoice = getEggMoveVariation('potw-295', 'potw-174')
  t.is(2, whismurDisarmingVoice)

  // Ensure shiny Pokémon do not break
  const shinyWhismur = getEggMoveVariation('potw-295-shiny', 'potw-174-shiny')
  t.is(2, shinyWhismur)

  // Ensure var0 Pokémon cannot be passed
  const caterpieSimple = getEggMoveVariation('potw-012-var0', 'potw-012-var0')
  t.is(undefined, caterpieSimple)

  // Ensure support moves (stored in `.moveAll` get passed along)
  const igglybuffSing = getEggMoveVariation('potw-040-var1', 'potw-040-var1')
  t.is(1, igglybuffSing)

  // Ensure this is passed to the baby
  const igglybuffBaby = generateEgg(
    Potw(P.Wigglytuff, {var: 1}),
    Potw(P.Wigglytuff, {var: 1}),
    'MOTHER-LIKE',
    {itemConsumed: false},
  )
  t.is('potw-174-var1', igglybuffBaby)
})

test('Spinda baby has random form', t => {
  const spindaUnobtainable = `${P.Spinda}-form`
  const spindaBadge = new TeamsBadge(spindaUnobtainable)
  t.is(spindaBadge.form, 'form')
  const spindaBaby = new TeamsBadge(generateEgg(P.Spinda, P.Spinda, 'MOTHER-LIKE', {itemConsumed: false}))
  t.true([...'abcdefghijkl'].includes(spindaBaby.form), `Baby Spinda has unexpected form ${spindaBaby.form}`)
})

test('generateEgg', t => {
  const caterpie = Potw(P.Caterpie, {})
  const burmyPlant = Potw(P.Burmy, {form: 'plant'})
  const babyBadge = new TeamsBadge(generateEgg(caterpie, burmyPlant, 'MOTHER-LIKE', {itemConsumed: false}))
  t.not(babyBadge.form, 'plant')

  const gastrodonWest = Potw(P.Gastrodon, {form: 'west_sea'})
  const babyBadge2 = new TeamsBadge(generateEgg(gastrodonWest, gastrodonWest, 'MOTHER-LIKE', {itemConsumed: false}))
  t.is(babyBadge2.form, 'west_sea')

  const snorunt = Potw(P.Snorunt, {})
  const babyBadge3 = new TeamsBadge(generateEgg(snorunt, snorunt, 'MOTHER-LIKE', {itemConsumed: false}))
  t.true(['male', 'female'].includes(babyBadge3.gender))

  const butterfree0 = Potw(P.Butterfree, {var: 0})
  const venonat1 = Potw(P.Venonat, {var: 1})
  const babyBadge4 = new TeamsBadge(generateEgg(butterfree0, venonat1, 'MOTHER-LIKE', {itemConsumed: false}))
  t.is(babyBadge4.variant, undefined)
})

test('Happiny through Incense', t => {
  const speciesId = P.Blissey
  const randomItem = daycareItems.charcoal!(speciesId)
  t.is(randomItem.speciesId, undefined) // No special effect

  const incense = daycareItems.luckincense!(speciesId)
  t.is(incense.speciesId, P.Happiny)

  const babyBadge = generateEgg(P.Chansey, P.Chansey, 'MOTHER-LIKE', incense)
  t.is('potw-440', babyBadge)

  const babyBadge2 = generateEgg(P.Chansey, P.Chansey, 'MOTHER-LIKE', {itemConsumed: false}, incense)
  t.is('potw-440', babyBadge2)
})

test('canBeShiny', t => {
  t.deepEqual(canBeShiny(P.Giratina), {list: false, club: false}, 'Giratina cannot be shiny')
  t.deepEqual(canBeShiny(P.Deoxys), {list: true, club: false}, 'Deoxys can be shiny but is not in club')
  t.deepEqual(canBeShiny(Potw(P.Deoxys, {var: 1})), {list: true, club: false}, 'Deoxys can be shiny but is not in club')
  t.deepEqual(canBeShiny(Potw(babyProduced[0], {})), {list: true, club: true}, 'This baby is in the club')
  t.deepEqual(canBeShiny(Potw(babyProduced[0], {var: 1})), {list: true, club: true}, 'This baby is in the club')
})

test('Breeding Kantonian & Alolan Raticates', t => {
  const aRaticate = Potw(P.Raticate, {form: 'alolan'})
  const babyARatata = new TeamsBadge(generateEgg(aRaticate, aRaticate, 'MOTHER-LIKE', {itemConsumed: false}))
  t.is(babyARatata.form, 'alolan')

  const kRaticate = Potw(P.Raticate, {})
  const babyKRatata = new TeamsBadge(generateEgg(kRaticate, kRaticate, 'MOTHER-LIKE', {itemConsumed: false}))
  t.is(babyKRatata.form, undefined)

  const babyMotherRatata = new TeamsBadge(generateEgg(aRaticate, kRaticate, 'MOTHER-LIKE', {itemConsumed: false}))
  t.is(babyMotherRatata.form, 'alolan')

  const babyFatherRatata = new TeamsBadge(generateEgg(kRaticate, aRaticate, 'FATHER-LIKE', {itemConsumed: false}))
  t.is(babyFatherRatata.form, 'alolan')

  const babyMKRatata = new TeamsBadge(generateEgg(kRaticate, aRaticate, 'MOTHER-LIKE', {itemConsumed: false}))
  t.is(babyMKRatata.form, undefined)
})

test('Breeding forms that should not carry down', t => {
  const nFurfrou = Potw(P.Furfrou, {})
  const kFurfrou = Potw(P.Furfrou, { form: 'kabuki' })
  const babyFurfrou = new TeamsBadge(generateEgg(nFurfrou, kFurfrou, 'MOTHER-LIKE', {itemConsumed: false}))
  t.is(babyFurfrou.form, 'natural')

  const nPorygon = Potw(P.Porygon, {})
  const pPorygon = Potw(P.Porygon, { form: 'page' })
  const babyPorygon = new TeamsBadge(generateEgg(nPorygon, pPorygon, 'MOTHER-LIKE', {itemConsumed: false}))
  t.is(babyPorygon.form, undefined)
})

test('Breeding Raichus & Pikachus', t => {
  const kRaichu = Potw(P.Raichu, {})
  const aRaichu = Potw(P.Raichu, {form: 'alolan'})
  const kPikachu = Potw(P.Pikachu, {})
  const babyMPichu = new TeamsBadge(generateEgg(kRaichu, aRaichu, 'MOTHER-LIKE', {itemConsumed: false}))
  t.is(babyMPichu.form, undefined)

  const babyPPichu = new TeamsBadge(generateEgg(kPikachu, aRaichu, 'MOTHER-LIKE', {itemConsumed: false}))
  t.is(babyPPichu.form, undefined)
})
