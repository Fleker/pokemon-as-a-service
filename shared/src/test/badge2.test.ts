import test from 'ava'
import { TeamsBadge, MATCH_SIMPLE, MATCH_REQS, MATCH_FILTER, Potw } from '../badge2'
import { BadgeId } from '../pokemon/types'
import * as P from '../gen/type-pokemon'

const expected = {
  'potw-001': {id: 1},
  'potw-012': {id: 12},
  'potw-012-shiny': {id: 12, shiny: true},
  'potw-201-a': {id: 201, form: 'a'},
  'potw-415-female': {id: 415, gender: 'female'},
  'potw-004-var0': {id: 4, var: 0},
  'potw-007-var1': {id: 7, var: 1},
  'potw-012-shiny-var0': {id: 12, shiny: true, var: 0},
}

test('Deserialize correctly', t => {
  for (const badgeId of Object.keys(expected)) {
    const expectedBadge = expected[badgeId]
    const badge = new TeamsBadge(badgeId as BadgeId)
    t.deepEqual(expectedBadge, badge.toJson())
  }
})

test('Serialize correctly', t => {
  for (const badgeId of Object.keys(expected)) {
    const badge = expected[badgeId]
    const expectedId = TeamsBadge.fromJson(badge).toString() 
    t.deepEqual(expectedId, badgeId)
  }
})

test('Badge.toLabel', t => {
  t.is(new TeamsBadge('potw-001').toLabel(), 'Bulbasaur')
  t.is(new TeamsBadge('potw-001-shiny').toLabel(), 'Bulbasaur (Shiny)')
  t.is(new TeamsBadge('potw-001-female').toLabel(), 'Bulbasaur Female')
  t.is(new TeamsBadge('potw-001-a').toLabel(), 'Bulbasaur A')
  t.is(new TeamsBadge('potw-001-sunny').toLabel(), 'Bulbasaur Sunny')
  t.is(new TeamsBadge('potw-001-var0').toLabel(), 'Bulbasaur⁰')
  t.is(new TeamsBadge('potw-001-cloudy-male-shiny-var1' as BadgeId).toLabel(), 'Bulbasaur¹ Male (Shiny)')
  t.is(new TeamsBadge('potw-001-sunny-male-shiny-var1').toLabel(), 'Bulbasaur Sunny¹ Male (Shiny)')
  t.is(new TeamsBadge('potw-649').toLabel(), 'Genesect')
  t.is(new TeamsBadge('potw-650').toLabel(), 'Chespin')
})

test('Badge.toSimpleString', t => {
  t.is(new TeamsBadge('potw-001').toSimple(), 'potw-001')
  t.is(new TeamsBadge('potw-012-shiny').toSimple(), 'potw-012')
  t.is(new TeamsBadge('potw-415-female').toSimple(), 'potw-415')
  t.is(new TeamsBadge('potw-201-a').toSimple(), 'potw-201')
})

test('Badge.toSprite', t => {
  t.is(new TeamsBadge('potw-201-?').toSprite(), 'potw-201-question')
})

test('TeamsBadge.match (simple)', t => {
  const expected: [string, string[]][] = [
    ['potw-001', ['potw-001']],
    ['potw-001', ['potw-001-shiny']],
    ['potw-201-a', ['potw-201']],
  ]
  for (const [badge, list] of expected) {
    const {match} = TeamsBadge.match(badge, list, MATCH_SIMPLE)
    t.true(match)
  }

  const unexpected: [BadgeId, string[]][] = [
    ['potw-002', ['potw-001']],
  ]
  for (const [badge, list] of unexpected) {
    const {match} = TeamsBadge.match(badge, list, MATCH_SIMPLE)
    t.false(match)
  }
})

test('TeamsBadge.match (reqs)', t => {
  const expected: [string, string[]][] = [
    ['potw-001', ['potw-001']],
    ['potw-001', ['potw-001-shiny']],
    ['potw-201-a', ['potw-201-a']],
    ['potw-001-var1', ['potw-001-var1']],
    ['potw-001', ['potw-001-var1']],
    ['potw-001', ['potw-001', 'potw-201-a', 'potw-001-shiny-var1', 'potw-001-shiny']],
    ['potw-001-shiny', ['potw-001', 'potw-201-a', 'potw-001-shiny-var1']],
    ['potw-145-shiny', ['potw-145', 'potw-145-shiny-var1', 'potw-145-var1', 'potw-146']],
    ['potw-145', ['potw-145-male']],
    ['potw-145-male', ['potw-145-male']],
    ['potw-413-plant', ['potw-413-plant-female-shiny']],
    ['potw-413-sandy', ['potw-413-sandy-female-var2']],
    ['potw-413-trash', ['potw-413-trash']],
  ]
  for (const [badge, list] of expected) {
    const {match} = TeamsBadge.match(badge, list, MATCH_REQS)
    t.true(match)
  }

  const unexpected: [string, string[]][] = [
    ['potw-002', ['potw-001']],
    ['potw-201-a', ['potw-201']],
    ['potw-201-a', ['potw-201-j']],
    ['potw-001-shiny', ['potw-001-var1']],
    ['potw-001-var1', ['potw-001']],
    ['potw-145-shiny-var1', ['potw-145-shiny']],
    ['potw-145-female', ['potw-145-male']],
  ]
  for (const [badge, list] of unexpected) {
    const {match} = TeamsBadge.match(badge, list, MATCH_REQS)
    t.log(badge, match)
    t.false(match)
  }
})

test('TeamsBadge.match (index, simple)', t => {
  const expected: [number, string, string[]][] = [
    [0, 'potw-001', ['potw-001']],
    [1, 'potw-001', ['potw-002', 'potw-001']],
    [1, 'potw-001', ['potw-002', 'potw-001-shiny']],
    [0, 'potw-001-shiny', ['potw-001', 'potw-201-a', 'potw-001-shiny-var1', 'potw-001-shiny']],
    [-1, 'potw-001', ['potw-002', 'potw-002-shiny']],
  ]

  for (const [i, badge, list] of expected) {
    const {index} = TeamsBadge.match(badge, list, MATCH_SIMPLE)
    t.is(index, i)
  }
})

test('TeamsBadge.match (index, reqs)', t => {
  const expected: [number, string, string[]][] = [
    [0, 'potw-001', ['potw-001']],
    [1, 'potw-001', ['potw-002', 'potw-001']],
    [1, 'potw-001', ['potw-002', 'potw-001-shiny']],
    [2, 'potw-001-shiny', ['potw-001', 'potw-201-a', 'potw-001-shiny-var1', 'potw-001-shiny']],
    [1, 'potw-145-shiny', ['potw-145', 'potw-145-shiny-var1', 'potw-145-var1', 'potw-146']],
    [2, 'potw-185-shiny', ['potw-184', 'potw-185', 'potw-185-shiny', 'potw-185-var1', 'potw-185-shiny']],
    [1, 'potw-185', ['potw-184', 'potw-185-shiny', 'potw-185', 'potw-185-var1', 'potw-185-shiny']],
    [-1, 'potw-001-shiny', ['potw-002', 'potw-001']],
    [-1, 'potw-001', ['potw-002', 'potw-002-shiny']],
    [-1, 'potw-145-shiny', ['potw-145', 'potw-145-var1', 'potw-145-var1', 'potw-146']],
  ]

  for (const [i, badge, list] of expected) {
    const {index} = TeamsBadge.match(badge, list, MATCH_REQS)
    t.is(index, i)
  }
})

test('TeamsBadge.match (count, simple)', t => {
  const expected: [number, string, string[]][] = [
    [1, 'potw-001', ['potw-001']],
    [2, 'potw-001', ['potw-001', 'potw-001']],
    [2, 'potw-001', ['potw-001', 'potw-001-shiny']],
    [1, 'potw-001', ['potw-002', 'potw-001-shiny']],
    [0, 'potw-001', ['potw-002', 'potw-002-shiny']],
  ]

  for (const [i, badge, list] of expected) {
    const {count} = TeamsBadge.match(badge, list, MATCH_SIMPLE)
    t.is(count, i)
  }
})

test('TeamsBadge.match (count, reqs)', t => {
  const expected: [number, string, string[]][] = [
    [1, 'potw-001', ['potw-001']],
    [2, 'potw-001', ['potw-001', 'potw-001']],
    [2, 'potw-001', ['potw-001', 'potw-001-shiny']],
    [1, 'potw-001-shiny', ['potw-001', 'potw-001-shiny']],
    [0, 'potw-001-shiny', ['potw-002', 'potw-001']],
    [0, 'potw-001', ['potw-002', 'potw-002-shiny']],
  ]

  for (const [i, badge, list] of expected) {
    const {count} = TeamsBadge.match(badge, list, MATCH_REQS)
    t.is(count, i, `Badge ${badge} does not match expected count of ${i}`)
  }
})

test('TeamsBadge.match (count, filter)', t => {
  const expected: [number, string, string[]][] = [
    [1, 'potw-001-male', ['potw-001']],
    [2, 'potw-001-shiny', ['potw-001', 'potw-001']],
    [1, 'potw-001-var1', ['potw-001', 'potw-001-shiny']],
    [2, 'potw-001-shiny-var0', ['potw-001', 'potw-001-shiny']],
    [0, 'potw-001-shiny-var0', ['potw-002', 'potw-001-male']],
    [0, 'potw-001', ['potw-002', 'potw-002-shiny']],
  ]

  for (const [i, badge, list] of expected) {
    const {count} = TeamsBadge.match(badge, list, MATCH_FILTER)
    t.is(count, i, `Badge ${badge} does not match expected count of ${i}`)
  }
})

test('TeamsBadge.match (dawnstone)', t => {
  const filter = [
    Potw(P.Snorunt, {gender: 'female'}),
    Potw(P.Kirlia, {gender: 'male'}),
    Potw(P.Kirlia, {gender: 'male', shiny: true}),
  ]
  t.true(TeamsBadge.match('potw-281-male', filter, MATCH_FILTER).match)
  t.true(TeamsBadge.match('potw-281-male-shiny', filter, MATCH_FILTER).match)
  t.false(TeamsBadge.match('potw-281-female', filter, MATCH_FILTER).match)
  t.false(TeamsBadge.match('potw-281', filter, MATCH_FILTER).match)
})
