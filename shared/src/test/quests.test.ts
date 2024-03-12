import test from 'ava'
import { TeamsBadge } from '../badge2';
import { Badge, Pokemon, fromPersonality } from '../badge3';
import { toBase64 } from '../baseconv';
import { Requirements, requirePotw, simpleRequirePotw, simpleRequirePotwArr, complexRequirePotw, requireType } from '../legendary-quests';
import { Globe } from '../locations-list';
import { PokemonId } from '../pokemon/types';
import * as P from '../gen/type-pokemon'
import * as I from '../gen/type-pokemon-ids'

test('requirePokemon', t => {
  const pokemon = {
    [toBase64(I.Bulbasaur)]: {
      [fromPersonality({gender: '', pokeball: 'pokeball', shiny: false, affectionate: false, location: 'US-MTV'}, I.Bulbasaur)]: 1
    },
    [toBase64(I.Castform)]: {
      [fromPersonality({form: 'rainy', pokeball: 'nestball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Castform)]: 1
    },
    [toBase64(I.Shellos)]: {
      [fromPersonality({form: 'east_sea', pokeball: 'greatball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Shellos)]: 1
    },
    [toBase64(I.Wormadam)]: {
      [fromPersonality({form: 'plant', pokeball: 'netball', gender: 'female', shiny: true, affectionate: false, location: 'US-MTV'}, I.Wormadam)]: 1,
      [fromPersonality({form: 'sandy', pokeball: 'netball', gender: 'female', variant: 2, shiny: false, affectionate: false, location: 'US-MTV'}, I.Wormadam)]: 1,
      [fromPersonality({form: 'trash', pokeball: 'pokeball', gender: 'female', shiny: false, affectionate: false, location: 'US-MTV'}, I.Wormadam)]: 1,
    },
    [toBase64(I.Exeggutor)]: {
      [fromPersonality({form: 'alolan', pokeball: 'masterball', gender: '', shiny: false, affectionate: false, location: 'AE-DXB'}, I.Exeggutor)]: 1,
    },
    [toBase64(I.Marowak)]: {
      [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Marowak)]: 1
    }
  }
  t.log(pokemon)
  t.log([...myPokemon(pokemon)])
  t.log([...myPokemon(pokemon)].map(([x]) => new Badge(x).toLegacyString()))
  t.log([...myPokemon(pokemon)].map(([x]) => new Badge(x).toLabel()))
  const pokemonKeys = [...myPokemon(pokemon)].filter(([, v]) => v > 0).map(([k]) => k) as PokemonId[]
  const pokemonBadges = [...myPokemon(pokemon)]
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
