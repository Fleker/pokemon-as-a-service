import test from 'ava'
import { ITEMS } from '../items-list'
import { Potw } from '../badge2'
import { Item, MegaStone } from '../items-list'
import * as Pkmn from '../pokemon'
import * as P from '../gen/type-pokemon'
import { getValidBadges } from '../valid-badges'
import { MoveTypeMap, SupportMoves } from '../gen/type-move-meta'

test('Get', t => {
  const chespin = Pkmn.get('potw-650')!
  t.is(chespin.species, 'Chespin')
})

test('Get default Pokémon if form', t => {
  const unownAny = Pkmn.get(P.Unown)!
  t.is(unownAny.hp, 48)

  const unownA = Pkmn.get('potw-201-a')!
  t.is(unownA.hp, 48)

  const spindaA = Pkmn.get('potw-327-a')!
  t.is(spindaA.hp, 60)

  const darmanNonZen = Pkmn.get('potw-555-ordinary')!
  t.is(darmanNonZen.attack, 140)

  // Test inverse
  const castformSun = Pkmn.get(P.Castform_Sunny)!
  t.is(castformSun.type1, 'Fire')

  const castformRain = Pkmn.get(P.Castform_Rainy)!
  t.is(castformRain.type1, 'Water')
})

test('Gender lookup', t => {
  const kirlia = Pkmn.get('potw-281-male-shiny-var1')!
  t.is(kirlia!.key, 'potw-281-male', 'Male Kirlia is a canonical datastore entry')
})

test('Replace moves in variant', t => {
  const murkrow = Pkmn.get(P.Murkrow)!
  t.deepEqual(murkrow.move, ['Foul Play', 'Wing Attack'])

  const murkrow1 = Pkmn.get(`${P.Murkrow}-var1`)!
  // Should replace Wing Attack; and add Heat Wave
  t.deepEqual(murkrow1.move, ['Foul Play', 'Brave Bird', 'Heat Wave'])

  const mamoswine1 = Pkmn.get(`${P.Mamoswine}-var1`)!
  // Should replace third move Ancient Power; and add Stone Edge
  t.deepEqual(mamoswine1.move, ['Ice Fang', 'High Horsepower', 'Stone Edge'])

  const unfezant4 = Pkmn.get(`${P.Unfezant}-var4`)!
  t.log(unfezant4.move)
  t.log(unfezant4.moveAll)
  t.log(unfezant4.novelMoves![4])
  let moveArray = ['Return', 'Sky Attack']
  unfezant4.novelMoves![4].forEach(move => {
    if (SupportMoves.includes(move)) {
      // This is a support move, add there instead
      moveArray.push(move)
    } else {
      const moveDetails = MoveTypeMap[move]
      const oldMoves = moveArray.map(m => MoveTypeMap[m])
      let replaceSlot = false
      for (let i = 0; i < oldMoves.length; i++) {
        if (oldMoves[i]!.type === moveDetails?.type) {
          t.log(`Replace at ${i} - ${oldMoves[i].type} - ${move}`)
          moveArray[i] = move
          replaceSlot = true
          t.log(moveArray)
        }
      }
      if (!replaceSlot) {
        moveArray = [...moveArray, move]
      }
    }
  })
  // Should replace third move Ancient Power; and add Stone Edge
  t.deepEqual(unfezant4.move, ['Uproar', 'Air Cutter', 'Defog', 'Roost'])

  const pikachuPhd = Pkmn.get(`${P.Pikachu}-phd-var4`)!
  t.is(pikachuPhd.move[1], 'Electric Terrain')
})

test('Variants have four moves', t => {
  for (const key of Object.keys(Pkmn.datastore)) {
    const pkmn = Pkmn.get(key)!
    t.true(pkmn.move.length <= 4)
    if (!pkmn.novelMoves) continue
    for (let i = 0; i < pkmn.novelMoves.length; i++) {
      // t.log(`${key}-var${i}`)
      const pkmn = Pkmn.get(`${key}-var${i}`)!
      t.true(pkmn.move.length <= 4, `${key}-var${i} has ${pkmn.move.length} moves! ${pkmn.move.join(', ')}`)
    }
  }
})

test('Support moves go into secondary slot', t => {
  const weezing1 = Pkmn.get(`${P.Weezing}-var1`)!
  t.deepEqual(weezing1.move, ['Sludge Bomb', 'Flamethrower', 'Will-O-Wisp'])
})

test('Support moves that are status', t => {
  const latias1 = Pkmn.get(`${P.Latias}-var1`)!
  t.deepEqual(latias1.move, ['Dragon Breath', 'Mist Ball', 'Energy Ball', 'Calm Mind'])
  t.deepEqual(latias1.moveAll, [
    'Dragon Breath',
    'Mist Ball',
    'Energy Ball',
    'Calm Mind',
    'Dragon Pulse',
    'Thunder',
    'Thunder Wave',
    'Draco Meteor',
    'Zen Headbutt',
    'Shadow Claw',
    'Magic Room',
    'Breaking Swipe',
    'Surf',
    'Recover',
  ], 'Latias should only know these moves. If more are added, include them here.')
})

test('var0 get novel moves', t => {
  const butterfree0 = Pkmn.get(`${P.Butterfree}-var0`)!
  t.deepEqual(butterfree0.move, ['Bug Buzz', 'Wing Attack', 'Electroweb', 'Confusion'])
})

test('Burmy getter', t => {
  const burmyMale = Pkmn.get(Potw(P.Burmy, {gender: 'male'}))!
  t.is(burmyMale.levelTo, P.Mothim)

  t.log(Potw(P.Burmy, {gender: 'female', form: 'sandy'}))
  const burmyFemale = Pkmn.get(Potw(P.Burmy, {gender: 'female', form: 'sandy'}))!
  t.is(burmyFemale.levelTo, Potw(P.Wormadam_Sandy, {form: 'sandy'}))

  const burmyFemaleShiny = Pkmn.get(Potw(P.Burmy, {gender: 'female', form: 'sandy', shiny: true}))!
  t.is(burmyFemaleShiny.levelTo, Potw(P.Wormadam_Sandy, {form: 'sandy'}))
})

test('Combee', t => {
  const combeeMale = Pkmn.get(Potw(P.Combee, {gender: 'male'}))!
  t.falsy(combeeMale.levelTo)

  const combeeFemale = Pkmn.get(Potw(P.Combee, {gender: 'female'}))!
  t.is(combeeFemale.levelTo, 'potw-416')


  const combeeFemale1 = Pkmn.get(Potw(P.Combee, {gender: 'female', var: 1}))!
  t.is(combeeFemale1.levelTo, 'potw-416')
})

test('Ghouldengo', t => {
  const ghouldengo = Pkmn.get(Potw('potw-1000', {}))
  t.truthy(ghouldengo)

  const ghouldengoShiny = Pkmn.get(Potw('potw-1000', {shiny: true}))
  t.truthy(ghouldengoShiny)
})

test('getValidBadges', t => {
  const badgeList = getValidBadges()
  // Test for Garchomp
  t.true(badgeList.includes('potw-445-female'))
  t.true(badgeList.includes('potw-445-male'))
  t.true(badgeList.includes('potw-445-male-shiny'))
  // Test for Frillish
  t.true(badgeList.includes('potw-592-female'))
  t.true(badgeList.includes('potw-592-male'))
})

test('Dex indicies', t => {
  t.deepEqual(Pkmn.getDexIndicies(P.Bulbasaur), {
    prev: undefined,
    next: 'potw-002',
  })
  t.deepEqual(Pkmn.getDexIndicies(P.Ivysaur), {
    prev: 'potw-001',
    next: 'potw-003',
  })
  t.deepEqual(Pkmn.getDexIndicies(Potw(P.Ivysaur, {var: 1})), {
    prev: 'potw-001',
    next: 'potw-003',
  })
})

test('Dex evolutions', t => {
  t.deepEqual(Pkmn.getAllPreEvolutions(P.Bulbasaur),
    []
  )
  t.deepEqual(Pkmn.getAllPreEvolutions(P.Venusaur),
    [P.Ivysaur]
  )
  t.deepEqual(Pkmn.getAllPreEvolutions(Potw(P.Charmeleon, {var: 2})),
    [P.Charmander]
  )
  t.deepEqual(Pkmn.getAllEvolutions(P.Wurmple),
    [P.Silcoon, P.Cascoon]
  )
})

test('Every Mega Evolution has Mega Stats', t => {
  for (const value of (Object.values(ITEMS) as Item[])) {
    if (value.category !== 'megastone') {
      continue
    }
    const {badge} = value as MegaStone
    const db = Pkmn.get(badge)!
    if (!db.mega && !db.megax) {
      t.fail(`${db.species}/${badge} has no mega stats`)
    }
  }
  t.pass()
})

test('Alolan forms', t => {
  const kantonian = Pkmn.get('potw-020')!
  t.truthy(kantonian)
  t.is(kantonian.type1, 'Normal')
  t.true(kantonian.tiers!.includes('Red Cup'))

  const alolan = Pkmn.get('potw-020-alolan')!
  t.truthy(alolan)
  t.is(alolan.type1, 'Dark')
  t.false(alolan.tiers!.includes('Red Cup'))
})

test('Duplicate novel moves are not TM-able', t => {
  const tms = Object.keys(ITEMS)
    .filter(x => x.startsWith('tm-'))
    .map(x => x.substring(3))
  const overlaps: {id: string, move: string}[] = []
  for (const key of Object.keys(Pkmn.datastore)) {
    const pkmn = Pkmn.get(key)!
    if (!pkmn.novelMoves) continue
    const allMoves: string[] = []
    for (let i = 1; i < pkmn.novelMoves.length; i++) {
      for (let j = 0; j < pkmn.novelMoves[i].length; j++) {
        if (allMoves.includes(pkmn.novelMoves[i][j])) {
          overlaps.push({id: key, move: pkmn.novelMoves[i][j]})
        }
        allMoves.push(pkmn.novelMoves[i][j])
      }
    }
  }

  for (const o of overlaps) {
    if (tms.includes(o.move)) {
      t.fail(`${o.id} has the same TM move ${o.move} in many places`)
    }
  }
  t.pass()
})

test('Dex entries are properly encoded', t => {
  for (const key of Object.keys(Pkmn.datastore)) {
    const pkmn = Pkmn.get(key)!
    if (pkmn.pokedex.includes('&#233;')) {
      t.fail(`Pokédex error at ${pkmn.species} (${key}): Includes &#233; -- should be é.`)
    }
    if (pkmn.pokedex.includes('é F')) {
      t.fail(`Pokédex error at ${pkmn.species} (${key}): Includes é F -- should be °`)
    }
    if (pkmn.pokedex.includes('</tr>')) {
      t.fail(`Pokédex error at ${pkmn.species} (${key}): Includes </tr>`)
    }
  }
  t.pass()
})
