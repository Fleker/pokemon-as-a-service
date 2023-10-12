import test from 'ava'
import * as S from '../sprites'
import * as fs from 'fs'
import { ITEMS, ItemId } from '../items-list'
import { datastore } from '../pokemon'
import { TeamsBadge } from '../badge2'
import { BadgeId } from '../pokemon/types'
import { LEGENDARY_ITEM_QUESTS, GLOBAL_QUESTS, KEY_ITEM_QUESTS, ONEP_ACHIEVEMENTS } from '../quests'
import { Badge } from '../badge3'

test('Get item correctly', t => {
  t.is(
    '/images/sprites/items/potw-item-pokeball.png',
    S.item('pokeball')
  )
})

test('Generate img tag', t => {
  t.is(
    '<img src="/images/sprites/items/potw-item-pokeball.png" />',
    S.img(S.item('pokeball'))
  )
})

test('Get item sprite correct with indirection', t => {
  t.is(
    '/images/sprites/items/potw-item-tm-Grass.png',
    S.item('tm-Leaf Storm')
  )
  t.is(
    '/images/sprites/items/potw-item-tr-Electric.png',
    S.item('tr-Thunder Wave')
  )
  t.is(
    '/images/sprites/berries/cheri.png',
    S.item('cheri')
  )
  t.is(
    '/images/sprites/items/potw-item-dawnstone.png',
    S.item('dawnstone')
  )
})

test('Check all items', t => {
  const items = Object.keys(ITEMS)
  let pass = true
  items.forEach(item => {
    const sprite = S.item(item as ItemId)
    const found = fs.existsSync(`../${sprite}`)
    if (!found) {
      pass = false
      t.log(`Cannot find sprite ${sprite}`)
    }
  })
  t.true(pass)
})

test('Verify dancing berry sprites', t => {
  const items = Object.entries(ITEMS)
  const suffixes = ['TreeTaller', 'TreeBloom', 'TreeBerry']
  items.forEach(([key, item]) => {
    if (item.category !== 'berry') return
    if (key === 'hopo') return // PLA-exclusive berry w/o grow sprites
    suffixes.forEach(suffix => {
      t.true(fs.existsSync(`../images/sprites/farm/${key}${suffix}.png`), `Cannot find sprite ${key}${suffix}.png`)
    })
  })
})

test('Verify quest sprites', t => {
  Object.values(LEGENDARY_ITEM_QUESTS).forEach(q => {
    if (!q.badge) {
      t.fail(`Quest ${q.title} has no badge`)
    }
    const sprite = S.quest(q.badge)
    t.true(fs.existsSync(`../${sprite}`), `Cannot find sprite ${sprite}`)
  })

  Object.values(KEY_ITEM_QUESTS).forEach(q => {
    if (!q.badge) {
      t.fail(`Quest ${q.title} has no badge`)
    }
    const sprite = S.quest(q.badge)
    t.true(fs.existsSync(`../${sprite}`), `Cannot find sprite ${sprite}`)
  })

  Object.values(GLOBAL_QUESTS).forEach(q => {
    if (!q.badge) {
      t.fail(`Quest ${q.title} has no badge`)
    }
    const sprite = S.quest(q.badge)
    t.true(fs.existsSync(`../${sprite}`), `Cannot find sprite ${sprite}`)
  })

  Object.values(ONEP_ACHIEVEMENTS).forEach(q => {
    if (!q.badge) {
      t.fail(`Quest ${q.title} has no badge`)
    }
    q.hints.forEach(h => {
      const sprite = S.quest(h.sprite)
      t.true(fs.existsSync(`../${sprite}`), `Cannot find sprite ${sprite}`)
    })
  })
})

test('Verify strange Pkmn cases', t => {
  // None of these Pokemon should exist. We should handle them appropriately.
  const legacyList = [
    'potw-351-female',
    'potw-550-blue_stripe-female',
    'potw-550-female-blue_stripe',
  ]
  for (const bid of legacyList) {
    const badge = Badge.fromLegacy(bid)
    const key = badge.toSprite()
    const sprite = S.pkmn(key as BadgeId)
    t.true(fs.existsSync(`../${sprite}`), `Cannot find sprite ${sprite}`)
  }
})

test('Check all Pkmn', t => {
  const pkmn = Object.entries(datastore)
  let checkFail = false
  pkmn.forEach(([key, p]) => {
    const badge = new TeamsBadge(key as BadgeId)
    const sprite = S.pkmn(key as BadgeId)
    badge.shiny = true
    const sprite2 = S.pkmn(badge.toSprite())
    if (!fs.existsSync(`../${sprite}`)) {
      checkFail = true
      t.log(`Cannot find sprite ${sprite}`)
    }
    if (!fs.existsSync(`../${sprite2}`)) {
      checkFail = true
      t.log(`Cannot find sprite ${sprite2}`)
    }
    if (p.gender) {
      p.gender.forEach(g => {
        badge.gender = g
        badge.shiny = false
        const sprite = S.pkmn(badge.toString())
        badge.shiny = true
        const sprite2 = S.pkmn(badge.toString())
        if (!fs.existsSync(`../${sprite}`)) {
          checkFail = true
          t.log(`Cannot find sprite ${sprite}`)
        }
        if (!fs.existsSync(`../${sprite2}`)) {
          checkFail = true
          t.log(`Cannot find sprite ${sprite2}`)
        }
      })
    }
    if (p.syncableForms) {
      p.syncableForms.forEach(f => {
        badge.gender = ''
        badge.form = f
        badge.shiny = false
        const sprite = S.pkmn(badge.toString())
        badge.shiny = true
        const sprite2 = S.pkmn(badge.toString())
        if (!fs.existsSync(`../${sprite}`)) {
          checkFail = true
          t.log(`Cannot find sprite ${sprite}`)
        }
        if (!fs.existsSync(`../${sprite2}`)) {
          checkFail = true
          t.log(`Cannot find sprite ${sprite2}`)
        }
      })
    }
    if (p.mega) {
      t.true(fs.existsSync(`../images/sprites/pokemon/${key}-mega.png`), `Cannot find sprite Mega ${p.species} ${key}-mega.png`)
      t.true(fs.existsSync(`../images/sprites/pokemon/${key}-mega-shiny.png`), `Cannot find shiny sprite Mega ${p.species} ${key}-mega-shiny.png`)
    }
    if (p.gmax) {
      t.true(fs.existsSync(`../images/sprites/pokemon/${key}-gmax.png`), `Cannot find sprite GMax ${p.species} ${key}-gmax.png`)
      t.true(fs.existsSync(`../images/sprites/pokemon/${key}-gmax-shiny.png`), `Cannot find shiny sprite GMax ${p.species} ${key}-gmax-shiny.png`)
    }
  })
  t.false(checkFail)
})
