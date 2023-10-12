import test from 'ava'
import {Voyages} from '../voyages'

test('Every voyage has buckets', t => {
  for (const voyage of Object.values(Voyages)) {
    t.true(voyage.buckets[1] > 0, `Voyage ${voyage.label} needs buckets`)
  }
})
