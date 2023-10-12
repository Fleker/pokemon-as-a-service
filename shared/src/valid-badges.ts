import { datastore } from "./pokemon"

/*
 * Creates an array of all valid badge IDs
 * @returns An array of all valid badge IDs for syncing
 */
export function getValidBadges() {
 const validBadges = new Set()

 for (const [key, value] of Object.entries(datastore)) {
   if (value.syncableForms) {
     for (const form of value.syncableForms) {
       validBadges.add(`${key}-${form}`)
       validBadges.add(`${key}-${form}-shiny`)
     }
   }
   if (value.gender) {
     for (const form of value.gender) {
       validBadges.add(`${key}-${form}`)
       validBadges.add(`${key}-${form}-shiny`)
     }
   }
 }

 for (let i = 1; i <= 1010; i++) {
   validBadges.add(`potw-${i.toString().padStart(3, '0')}`)
 }
 return [...validBadges]
}
