import test from 'ava'
import { TeamsBadge } from '../badge2';
import { Badge, Pokemon } from '../badge3';
import { toBase64 } from '../baseconv';
import { Requirements, requirePotw, simpleRequirePotw, simpleRequirePotwArr, complexRequirePotw, requireType } from '../legendary-quests';
import { Globe } from '../locations-list';
import { PokemonId } from '../pokemon/types';
import * as P from '../gen/type-pokemon'
import * as I from '../gen/type-pokemon-ids'

test('requirePokemon', t => {
  const pokemon = {
    [Pokemon(I.Bulbasaur)]: 1,
    [Pokemon(I.Castform, {form: 'rainy'})]: 1,
    [Pokemon(I.Shellos, {form: 'east_sea'})]: 1,
    [Pokemon(I.Wormadam, {form: 'plant', gender: 'female', shiny: true})]: 1,
    [Pokemon(I.Wormadam, {form: 'sandy', gender: 'female', variant: 2})]: 1,
    [Pokemon(I.Wormadam, {form: 'trash'})]: 1,
    [Pokemon(I.Exeggutor, {form: 'alolan'})]: 1,
    [Pokemon(I.Marowak, {})]: 1,
  }
  const pokemonKeys = Object.entries(pokemon).filter(([, v]) => v > 0).map(([k]) => k) as PokemonId[]
  const pokemonBadges = Object.entries(pokemon)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => [new Badge(k), v]) as [Badge, number][]
  const teamsBadges = pokemonBadges
    .map(([k, v]) => [new TeamsBadge(k.toLegacyString()), v]) as [TeamsBadge, number][]
  const badgeKeys = teamsBadges.map(([k]) => k.toString())

  const r: Requirements = {
    battleStadiumRecord: [0, 0, 0, 0],
    berryGrown: 0,
    pokemon,
    badgeKeys,
    pokemonBadges,
    pokemonKeys,
    teamsBadges,
    hiddenItemsFound: [],
    id: '',
    items: {},
    location: Globe['US-MTV'],
    raidRecord: [0, 0, 0, 0],
    researchCompleted: 0,
    userJoinedDate: -1,
    totalTrades: 5+10,
    pokedex: {
      kanto: 1, johto: 1, hoenn: 1, sinnoh: 1, unova: 1, kalos: 1, alola: 1, galar: 1, hisui: 1, paldea: 1,
    },
    eggsLaid: 0,
    moveTutors: 0,
    friendSafari: 'ABC',
    itemsCrafted: 0,
    voyagesCompleted: 0,
    evolutions: 1,
    forms: 1,
    restorations: 1,
  }
  t.true(simpleRequirePotw(P.Bulbasaur)(r))
  const ftt = 422
  t.log('potw-422', new TeamsBadge('potw-422').id, toBase64(ftt.toString(16).toUpperCase()))
  t.log(Object.keys(r.pokemon))
  t.true(simpleRequirePotw(P.Shellos)(r))
  t.true(simpleRequirePotw(P.Castform)(r))
  t.true(complexRequirePotw(P.Castform, {form: 'rainy'})(r))
  t.true(complexRequirePotw(P.Exeggutor, {form: 'alolan'})(r))
  t.true(requirePotw([
    [P.Wormadam, {form: 'plant'}],
    [P.Wormadam, {form: 'sandy'}],
    [P.Wormadam, {form: 'trash'}]
  ])(r))
  t.true(requireType('Bug', 3)(r))
  
  t.false(requirePotw([
    [P.Bulbasaur, {}],
    [P.Caterpie, {}],
  ])(r))
  t.false(simpleRequirePotwArr([P.Castform, P.Chimecho])(r))
  t.false(complexRequirePotw(P.Castform, {form: 'snowy'})(r))
  t.false(complexRequirePotw(P.Marowak, {form: 'alolan'})(r))
  t.false(requireType('Bug', 100)(r))
})
