import { TeamsBadge, MATCH_REQS } from '../../shared/src/badge2'
import { ItemId } from '../../shared/src/items-list'
import { BadgeId } from '../../shared/src/pokemon/types'
import { KEY_ITEM_QUESTS, LEGENDARY_ITEM_QUESTS } from '../../shared/src/quests'

const legendarySpeciesKeyMap: {[key in BadgeId]?: string} = {}
for (const q of LEGENDARY_ITEM_QUESTS) {
  if (q.recyclable) {
    legendarySpeciesKeyMap[q.encounter!] = q.docId
  }
}

const keyItemKeyMap: {[key in BadgeId]?: string} = {}
for (const q of KEY_ITEM_QUESTS) {
  if (q.recyclable) {
    keyItemKeyMap[q.item!] = q.docId
  }
}

export function optionallyRecycle(hiddenItemsFound: string[], badges: BadgeId[], items: Partial<Record<ItemId, number>>) {
  let needsUpdate = false
  for (const [badgeId, questId] of Object.entries(legendarySpeciesKeyMap)) {
    // Force Shaymin-Sky to 'Shaymin' so that people can't just convert their
    // Shaymin and keep getting them for free.
    const simple = new TeamsBadge(badgeId).toSimple()
    const hasPokemon = TeamsBadge.match(simple, badges, MATCH_REQS).match
    if (!hasPokemon && hiddenItemsFound.includes(questId!)) {
      needsUpdate = true
      hiddenItemsFound.splice(hiddenItemsFound.indexOf(questId!), 1)
    }
  }
  for (const [itemId, questId] of Object.entries(keyItemKeyMap)) {
    if (!hiddenItemsFound.includes(questId!)) continue;
    if (items[itemId] === undefined || items[itemId] <= 0) {
      needsUpdate = true
      hiddenItemsFound.splice(hiddenItemsFound.indexOf(questId!), 1)
    }
  }
  return {
    needsUpdate,
    hiddenItemsFound,
  }
}
