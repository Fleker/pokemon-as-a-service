import { PokemonId } from '../../../../../shared/src/pokemon/types';
import { Badge } from '../../../../../shared/src/badge3';
import { get } from '../../../../../shared/src/pokemon';

export function yirCalculate(pkmn: PokemonId) {
  const badge = new Badge(pkmn)
  let score = 0
  if (['greatball', 'ultraball'].includes(badge.personality.pokeball)) {
    score += 10
  } else if (['featherball', 'jetball', 'wingball', 'gigatonball', 'leadenball'].includes(badge.personality.pokeball)) {
    score += 50
  } else if (!['pokeball', 'premierball'].includes(badge.personality.pokeball)) {
    score += 25
  } else {
    score -= 10
  }
  if (badge.personality.shiny) {
    score += 100
  }
  if (badge.personality.form) {
    score += 15
  }
  if (['totem', 'alpha', 'titan'].includes(badge.personality.form)) {
    score += 5
  }
  if (badge.personality.variant) {
    score += 10
  }
  if (badge.personality.gender) {
    score += 10
  }
  if (badge.personality.affectionate) {
    score += 3
  }
  if (badge.personality.location === 'US-MTV') {
    score -= 2
  }
  const db = get(badge.toLegacyString())
  if (db.rarity === 'LEGENDARY') {
    score += 30
  } else if (db.rarity === 'MYTHICAL') {
    score += 45
  }
  if (db.release === 'ultraball') {
    score += 3
  } else if (db.release === 'greatball') {
    score += 1
  }
  if (badge.id >= 906) { // Paldea
    score += 65
  } else if (badge.id >= 899) { // Hisui
    score += 50
  } else if (badge.id >= 810) { // Galar
    score += 45
  } else if (badge.id >= 722) { // Alola
    score += 30
  } else if (badge.id >= 650) { // Kalos
    score += 15
  } else if (badge.id >= 494) { // Unova
    score += 5
  }
  return score
}


