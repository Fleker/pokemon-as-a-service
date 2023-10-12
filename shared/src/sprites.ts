import { TeamsBadge } from './badge2';
import { BadgeId } from './pokemon/types';
import { MoveId, MoveTypeMap } from './gen/type-move-meta';
import { ITEMS, ItemId } from './items-list';

export const DOWSING_MCHN = '/images/sprites/potw-dowsing.png'
export const NULL = '/images/null.png'

export function egg(species: BadgeId): string {
  if (species === 'potw-489') {
    // Phione
    return '/images/sprites/potw-egg-manaphy.png'
  }
  return '/images/sprites/potw-egg-g2.png'
}

export function item(item: ItemId): string {
  if (item?.startsWith('tm-')) {
    const move = item.substr(3) as MoveId
    // Lookup type
    // tm-Leaf Storm
    //    ^^^^^^^^^^
    if (!MoveTypeMap[move]) {
      console.error(`${item} DNE`)
      return `tm-Normal`
    }
    const {type} = MoveTypeMap[move]!
    // Should load from hosting
    return `/images/sprites/items/potw-item-tm-${type}.png`
  }
  if (item?.startsWith('tr-')) {
    // Lookup type
    // tr-Rock Polish
    //    ^^^^^^^^^^^
    const move = item.substr(3) as MoveId
    if (!MoveTypeMap[move]) {
      console.error(`${item} DNE`)
      return `tr-Normal`
    }
    const {type} = MoveTypeMap[move]!
    // Should load from hosting
    return `/images/sprites/items/potw-item-tr-${type}.png`
  }
  if (item?.startsWith('tmm_')) {
    // Most* of TM Machine matrials
    return `/images/sprites/items/potw-item-azurillfur.png`
  }
  if (ITEMS[item] && ITEMS[item].category === 'berry') {
    return `/images/sprites/berries/${item}.png`
  }
  const sprite = item
  return `/images/sprites/items/potw-item-${sprite}.png`
}

export function pkmn(poke: BadgeId): string {
  const sprite = new TeamsBadge(poke).toSprite()
  return `/images/sprites/pokemon/${sprite}.png`
}

export function pkmnBadge(poke: TeamsBadge): string {
  return poke.toSprite()
}

export function quest(questId: string): string {
  return `/images/sprites/quests/${questId}.png`
}

/**
 * @deprecated Use <sprite-*> instead
 */
export function img(url: string): string {
  return `<img src="${url}" />`
}
