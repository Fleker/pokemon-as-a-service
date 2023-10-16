import test from 'ava'
import { optionallyRecycle } from '../recycler'
import { Potw } from '../../../shared/src/badge2'
import { AZELF, SHAYMIN, UXIE } from '../../../shared/src/legendary-quests'
import { BadgeId } from '../../../shared/src/pokemon/types'
import * as P from '../../../shared/src/gen/type-pokemon'
import { ItemId } from '../../../shared/src/items-list'

const items: Partial<Record<ItemId, number>> = {
  pokeball: 1,
}

test('Nothing to be recycled', t => {
  const obtained = [AZELF, UXIE]
  const currentBadges: BadgeId[] = [P.Azelf, P.Uxie]
  const {needsUpdate, hiddenItemsFound} = optionallyRecycle(obtained, currentBadges, items)
  t.false(needsUpdate)
  t.deepEqual(hiddenItemsFound, [AZELF, UXIE])
})

test('Reset a pixie', t => {
  const obtained = [AZELF, UXIE]
  const currentBadges: BadgeId[] = [P.Azelf]
  const {needsUpdate, hiddenItemsFound} = optionallyRecycle(obtained, currentBadges, items)
  t.true(needsUpdate)
  t.deepEqual(hiddenItemsFound, [AZELF])
})

test('Do not reset formed Shaymin', t => {
  const obtained = [SHAYMIN]
  const currentBadges: BadgeId[] = [Potw(P.Shaymin, {form: 'sky'})]
  const {needsUpdate, hiddenItemsFound} = optionallyRecycle(obtained, currentBadges, items)
  t.false(needsUpdate)
  t.deepEqual(hiddenItemsFound, [SHAYMIN])
})
