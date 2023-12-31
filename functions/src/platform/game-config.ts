import { SHINY_CHARM } from '../../../shared/src/quests';
import { ItemId } from '../../../shared/src/items-list';
import { weeklyId } from '../../../shared/src/platform/weekly';

export const GROUP_BADGE_ID = weeklyId

export const MAIL_BADGES = {
  'potw-270': 'Lotad',
  'potw-271': 'Lombre',
  'potw-272': 'Ludicolo',
  'potw-273': 'Seedot',
  'potw-274': 'Nuzleaf',
  'potw-275': 'Shiftry',
  'potw-276': 'Taillow',
}

export const STADIUM_REWARDS: {tm: ItemId, tr: ItemId} = {
  tm: 'tm-Twister',
  tr: 'tr-Charm',
}

export const adminIds = [
  'veXJXuNwZ7RsUXV6tQqWjboQOy03' // fleker@
]

export const isAdmin = (uid: string) => {
  return adminIds.includes(uid)
}

export type EncounterType = 'throw' | 'daycare' | 'masuda' | 'dowsing' | 'farm'

export const shinyRate = (type: EncounterType, hiddenItemsFound: string[]) => {
  const rateMap: {[t in EncounterType]: number} = {
    throw: 1024,
    daycare: 512,
    masuda: 256, // Public daycare, like Masuda method.
    dowsing: 256,
    farm: 512,
  }
  const numerator = (() => {
    return hiddenItemsFound.includes(SHINY_CHARM) ? 3 : 1
  })()
  return numerator / rateMap[type]
}
