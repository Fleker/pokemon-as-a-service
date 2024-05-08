import { SHINY_CHARM } from '../../../shared/src/quests';
import { ItemId } from '../../../shared/src/items-list';
import { weeklyId } from '../../../shared/src/platform/weekly';

export const GROUP_BADGE_ID = weeklyId
export const MAIL_BADGES = {
  'potw-290': 'Nincada',
  'potw-291': 'Ninjask',
  'potw-292': 'Shedinja',
  'potw-293': 'Whismur',
  'potw-294': 'Loudred',
  'potw-295': 'Exploud',
  'potw-296': 'Makuhita',
  'potw-297': 'Hariyama',
  'potw-298': 'Azurill',
}

export const STADIUM_REWARDS: {tm: ItemId, tr: ItemId} = {
  tm: 'tm-Rage Fist',
  tr: 'tr-Quick Guard',
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