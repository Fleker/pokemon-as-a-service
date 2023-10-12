import test from 'ava'
import { getMaxItemsToBuy } from '../mart.utils'

test('Bazaar Max - No maxItems', t => {
  const bag = {
    pokeball: 5
  }
  const maxItems = getMaxItemsToBuy(bag, 'pokeball', 5)
  t.is(5, maxItems) 
})

test('Bazaar Max - No maxItems for undefined item', t => {
  const bag = {
    pokeball: 5
  }
  const maxItems = getMaxItemsToBuy(bag, 'greatball', 5)
  t.is(5, maxItems) 
})

test('Bazaar Max - Under maxItems', t => {
  const bag = {
    pokeball: 5,
  }
  const maxItems = getMaxItemsToBuy(bag, 'pokeball', 5, 12)
  t.is(5, maxItems) 
})

test('Bazaar Max - Over maxItems', t => {
  const bag = {
    pokeball: 5,
  }
  const maxItems = getMaxItemsToBuy(bag, 'pokeball', 5, 7)
  t.is(2, maxItems)
})

test('Bazaar Max - Already over maxItems', t => {
  const bag = {
    pokeball: 5,
  }
  const maxItems = getMaxItemsToBuy(bag, 'pokeball', 5, 1)
  t.is(0, maxItems)
})
