import test from 'ava'
import { tradeEvolution, trainerVerify, swap } from '../gts.utils'
import { Users } from '../db-types'
import {Badge, Pokemon, fromPersonality} from '../../../shared/src/badge3'
import {toBase64} from '../../../shared/src/baseconv'
import { Bulbasaur, Graveler, Ivysaur, Machoke, Poliwhirl, Charmeleon, Machamp, Golem, Politoed } from '../../../shared/src/gen/type-pokemon-ids'
import * as P from '../../../shared/src/gen/type-pokemon'
import * as I from '../../../shared/src/gen/type-pokemon-ids';

test('Evolutions map', t => {
  const machokeEvolution = tradeEvolution('potw-067', undefined, 'potw-001')!
  t.truthy(machokeEvolution)
  t.is(68, machokeEvolution.badgeId)
  t.is('Machoke', machokeEvolution.name1)
  t.is('Machamp', machokeEvolution.name2)
  t.false(machokeEvolution.consumesItem)

  const machokeEvolution2 = tradeEvolution('potw-067', 'oran', 'potw-001')!
  t.is('Machamp', machokeEvolution2.name2)
  t.false(machokeEvolution2.consumesItem)

  const seadraEvolution = tradeEvolution('potw-117', 'oran', 'potw-001')
  t.is(undefined, seadraEvolution)

  const porygonEvolution = tradeEvolution('potw-137', 'upgrade', 'potw-001')!
  t.is('Porygon', porygonEvolution.name1)
  t.is('Porygon2', porygonEvolution.name2)
  t.true(porygonEvolution.consumesItem)

  const clampearlEvolution = tradeEvolution('potw-366', 'deepseatooth', 'potw-001')!
  t.is(367, clampearlEvolution.badgeId)
  t.is('Huntail', clampearlEvolution.name2)
  t.true(clampearlEvolution.consumesItem)

  const shelmetNoop = tradeEvolution(P.Shelmet, 'raidpass', P.Shelmet)!
  t.is(shelmetNoop, undefined)

  const shelmetEvolution = tradeEvolution(P.Shelmet, 'raidpass', P.Karrablast)!
  t.truthy(shelmetEvolution)
  t.is(617, shelmetEvolution.badgeId)
  t.is('Accelgor', shelmetEvolution.name2)
  t.false(shelmetEvolution.consumesItem)
})

test('Verify trainer data', t => {
  const trainer1 = {
    pokemon: {
      '1': {
        '3MfUhG': 1
      }
    },
    ldap: 'Test',
    items: {
      pokeball: 1,
      greatball: 0,
    }
  } as unknown as Users.Doc
  const bulbasaur = Pokemon(1)
  const ivysaur = Pokemon(2)
  t.log(new Badge(bulbasaur).toString())
  t.true(trainerVerify(trainer1, bulbasaur))
  t.true(trainerVerify(trainer1, bulbasaur, 'pokeball'))
  t.throws(() => trainerVerify(trainer1, ivysaur))
  t.throws(() => trainerVerify(trainer1, bulbasaur, 'greatball'))
  t.throws(() => trainerVerify(trainer1, bulbasaur, 'ultraball'))
})

test('Swap', t => {
  const trainer1 = {
    pokemon: {
      [toBase64(I.Bulbasaur)]: {
        [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Bulbasaur)]: 1,
      },
      [toBase64(I.Graveler)]: {
        [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Graveler)]: 1,
      },
      [toBase64(I.Poliwhirl)]: {
        [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Poliwhirl)]: 1,
      },
    },
    items: {
      pokeball: 2,
      greatball: 0,
      kingsrock: 1,
    }
  } as unknown as Users.Doc
  const trainer2 = {
    pokemon: {
      [toBase64(I.Ivysaur)]: {
        [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Ivysaur)]: 1,
      },
      [toBase64(I.Machoke)]: {
        [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Machoke)]: 1,
      },
      [toBase64(I.Charmeleon)]: {
        [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Charmeleon)]: 1,
      },
    },
    items: {
      pokeball: 0,
      greatball: 2,
      kingsrock: 0,
    }
  } as unknown as Users.Doc

  // Simple trade
  const bulbasaur = Pokemon(Bulbasaur, {pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'})
  const ivysaur = Pokemon(Ivysaur, {pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'})
  const graveler = Pokemon(Graveler, {pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'})
  const poliwhirl = Pokemon(Poliwhirl, {pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'})
  const machoke = Pokemon(Machoke, {pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'})
  swap(trainer1, trainer2, 'trainer2', bulbasaur, null, bulbasaur)
  t.deepEqual(trainer1.pokemon, {
    [toBase64(I.Graveler)]: {
      [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Graveler)]: 1,
    },
    [toBase64(I.Poliwhirl)]: {
      [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Poliwhirl)]: 1,
    },
  })
  t.deepEqual(trainer2.pokemon, {
    [toBase64(I.Ivysaur)]: {
      [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Ivysaur)]: 1,
    },
    [toBase64(I.Machoke)]: {
      [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Machoke)]: 1,
    },
    [toBase64(I.Bulbasaur)]: {
      [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Bulbasaur)]: 1,
    },
    [toBase64(I.Charmeleon)]: {
      [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Charmeleon)]: 1,
    },
  })

  swap(trainer2, trainer1, 'trainer1', ivysaur, null, bulbasaur)
  t.deepEqual(trainer1.pokemon, {
    [toBase64(I.Graveler)]: {
      [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Graveler)]: 1,
    },
    [toBase64(I.Poliwhirl)]: {
      [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Poliwhirl)]: 1,
    },
    [toBase64(I.Ivysaur)]: {
      [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Ivysaur)]: 1,
    },
  })
  t.deepEqual(trainer2.pokemon, {
    [toBase64(I.Machoke)]: {
      [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Machoke)]: 1,
    },
    [toBase64(I.Bulbasaur)]: {
      [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Bulbasaur)]: 1,
    },
    [toBase64(I.Charmeleon)]: {
      [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Charmeleon)]: 1,
    },
  })

  // Trade items and basic trade evolutions
  swap(trainer1, trainer2, 'trainer2', graveler, 'pokeball', bulbasaur)
  t.deepEqual(trainer1.pokemon, {
    [toBase64(I.Poliwhirl)]: {
      [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Poliwhirl)]: 1,
    },
    [toBase64(I.Ivysaur)]: {
      [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Ivysaur)]: 1,
    },
  })
  t.is(trainer1.items.pokeball, 1)
  t.is(trainer2.items.pokeball, 1)
  t.deepEqual(trainer2.pokemon, {
    [toBase64(I.Machoke)]: {
      [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Machoke)]: 1,
    },
    [toBase64(I.Bulbasaur)]: {
      [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Bulbasaur)]: 1,
    },
    [toBase64(I.Charmeleon)]: {
      [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Charmeleon)]: 1,
    },
    [toBase64(I.Golem)]: {
      [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Golem)]: 1,
    },
  })

  swap(trainer2, trainer1, 'trainer1', machoke, 'greatball', bulbasaur)
  t.deepEqual(trainer1.pokemon, {
    [toBase64(I.Poliwhirl)]: {
      [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Poliwhirl)]: 1,
    },
    [toBase64(I.Ivysaur)]: {
      [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Ivysaur)]: 1,
    },
    [toBase64(I.Machamp)]: {
      [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Machamp)]: 1,
    },
  })
  t.is(trainer1.items.greatball, 1)
  t.is(trainer2.items.greatball, 1)
  t.deepEqual(trainer2.pokemon, {
    [toBase64(I.Bulbasaur)]: {
      [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Bulbasaur)]: 1,
    },
    [toBase64(I.Charmeleon)]: {
      [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Charmeleon)]: 1,
    },
    [toBase64(I.Golem)]: {
      [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Golem)]: 1,
    },
  })

  // Trade evolution that consumes item
  swap(trainer1, trainer2, 'trainer2', poliwhirl, 'kingsrock', bulbasaur)
  t.deepEqual(trainer1.pokemon, {
    [toBase64(I.Ivysaur)]: {
      [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Ivysaur)]: 1,
    },
    [toBase64(I.Machamp)]: {
      [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Machamp)]: 1,
    },
  })
  t.is(trainer1.items.kingsrock, 0)
  t.is(trainer2.items.kingsrock, 0)
  t.deepEqual(trainer2.pokemon, {
    [toBase64(I.Bulbasaur)]: {
      [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Bulbasaur)]: 1,
    },
    [toBase64(I.Charmeleon)]: {
      [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Charmeleon)]: 1,
    },
    [toBase64(I.Golem)]: {
      [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Golem)]: 1,
    },
    [toBase64(I.Politoed)]: {
      [fromPersonality({pokeball: 'pokeball', gender: '', shiny: false, affectionate: false, location: 'US-MTV'}, I.Politoed)]: 1,
    },
  })
})
