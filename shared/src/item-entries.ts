import { ITEMS, ItemId } from "./items-list"

/**
 * Iterator for an item map but in the right order
 * @param obj Object in key-value pairs
 * @returns Items in a sorted order
 */
 export function ItemEntries(obj): [ItemId, number][] {
  const sortedKeys = Object.keys(obj).sort()
  const itemLabelMap = {}
  sortedKeys.forEach(key => {
    if (!ITEMS[key]) {
      console.warn(`You have an item ${key} that should not exist`)
      itemLabelMap[key] = key // Dummy
      return
    }
    itemLabelMap[ITEMS[key].label] = key
  })
  const sortedLabels = Object.keys(itemLabelMap).sort()
  return sortedLabels.map(label => [itemLabelMap[label], obj[itemLabelMap[label]]])
}