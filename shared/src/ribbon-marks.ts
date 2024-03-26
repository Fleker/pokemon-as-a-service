/**
 * @fileoverview A lookup table for ribbons and marks that a Pokémon might have
 * @see Ribbons on Bulbapedia - https://bulbapedia.bulbagarden.net/wiki/List_of_Ribbons_in_the_games
 * @see Marks on Bulbapedia - https://bulbapedia.bulbagarden.net/wiki/Mark#List_of_marks
 */
import { Location, WeatherType, Timezone } from "./locations-list"
import spacetime from 'spacetime'
import randomItem from '../../shared/src/random-item';

type Kind = 'ribbon' | 'mark'

interface RibbonMark {
  kind: Kind
  name: string
  icon?: string
  title?: string
  description: string
  conditions: string
}

export const RibbonMarksTable: Record<string, RibbonMark> = {
  '👑': {
    kind: 'mark',
    name: 'Mightiest Mark',
    icon: 'menu-raid',
    title: 'the Unrivaled',
    description: 'A mark given to a formidable Pokémon',
    conditions: 'Defeating a Pokémon in a six-star raid',
  },
  '☁️': {
    kind: 'mark',
    name: 'Cloudy Mark',
    icon: 'menu-raid',
    title: 'the Cloud Watcher',
    description: 'A mark for a cloud-watching Pokémon',
    conditions: 'Found on a Pokémon during cloudy weather',
  },
  '🌩️': {
    kind: 'mark',
    name: 'Stormy Mark',
    icon: 'menu-raid',
    title: 'the Thunderstruck',
    description: 'A mark for a thunderstruck Pokémon',
    conditions: 'Found on a Pokémon during a thunderstorm',
  },
  '🌧️': {
    kind: 'mark',
    name: 'Rainy Mark',
    icon: 'menu-raid',
    title: 'the Sodden',
    description: 'A mark for a sodden Pokémon',
    conditions: 'Found on a Pokémon during the rain',
  },
  '☃️': {
    kind: 'mark',
    name: 'Snowy Mark',
    icon: 'menu-raid',
    title: 'the Snow Frolicker',
    description: 'A mark for a snow-frolicking Pokémon',
    conditions: 'Found on a Pokémon during a snowstorm',
  },
  '☀️': {
    kind: 'mark',
    name: 'Dry Mark',
    icon: 'menu-raid',
    title: 'the Parched',
    description: 'A mark for a parched Pokémon',
    conditions: 'Found on a Pokémon during harsh sunlight',
  },
  '⏳': {
    kind: 'mark',
    name: 'Sandstorm Mark',
    icon: 'menu-raid',
    title: 'the Sandswept',
    description: 'A mark for a sandswept Pokémon',
    conditions: 'Found on a Pokémon in the midst of a sandstorm',
  },
  '🌫️': {
    kind: 'mark',
    name: 'Misty Mark',
    icon: 'menu-raid',
    title: 'the Mist Drifter',
    description: 'A mark for for a mist-drifting Pokémon',
    conditions: 'Found on a Pokémon in the mist',
  },
  '🍴': {
    kind: 'mark',
    name: 'Lunchtime Mark',
    icon: 'menu-raid',
    title: 'the Peckish',
    description: 'A mark for a peckish Pokémon',
    conditions: 'Found on a Pokémon during the afternoon',
  },
  '💤': {
    kind: 'mark',
    name: 'Sleepy-Time Mark',
    icon: 'menu-raid',
    title: 'the Sleepy',
    description: 'A mark for a sleepy Pokémon',
    conditions: 'Found on a Pokémon during the night',
  },
  '🌅': {
    kind: 'mark',
    name: 'Dawn Mark',
    icon: 'menu-raid',
    title: 'the Early Riser',
    description: 'A mark for an early-to-rise Pokémon',
    conditions: 'Found on a Pokémon during the morning',
  },
  '🌇': {
    kind: 'mark',
    name: 'Dusk Mark',
    icon: 'menu-raid',
    title: 'the Dozy',
    description: 'A mark for a dozy Pokémon',
    conditions: 'Found on a Pokémon during the evening',
  },
  '😍': {
    kind: 'mark',
    name: 'Rowdy Mark',
    title: 'the Rowdy',
    description: 'A mark for a rowdy Pokémon',
    conditions: 'Found on a Pokémon in the wild',
  },
  '💫': {
    kind: 'mark',
    name: 'Absent-Minded Mark',
    icon: 'menu-raid',
    title: 'the Spacey',
    description: 'A mark for a spacey Pokémon',
    conditions: 'Found on a Pokémon in the wild',
  },
  '😬': {
    kind: 'mark',
    name: 'Jittery Mark',
    title: 'the Anxious',
    description: 'A mark for an anxious Pokémon',
    conditions: 'Found on a Pokémon in the wild',
  },
  '😂': {
    kind: 'mark',
    name: 'Excited Mark',
    title: 'the Giddy',
    description: 'A mark for a giddy Pokémon',
    conditions: 'Found on a Pokémon in the wild',
  },
  '😇': {
    kind: 'mark',
    name: 'Charismatic Mark',
    title: 'the Radiant',
    description: 'A mark for a radiant Pokémon',
    conditions: 'Found on a Pokémon in the wild',
  },
  '😌': {
    kind: 'mark',
    name: 'Calmness Mark',
    title: 'the Serene',
    description: 'A mark for a serene Pokémon',
    conditions: 'Found on a Pokémon in the wild',
  },
  '🤪': {
    kind: 'mark',
    name: 'Intense Mark',
    title: 'the Feisty',
    description: 'A mark for a feisty Pokémon',
    conditions: 'Found on a Pokémon in the wild',
  },
  '🥱': {
    kind: 'mark',
    name: 'Zoned-Out Mark',
    title: 'the Daydreamer',
    description: 'A mark for a daydreaming Pokémon',
    conditions: 'Found on a Pokémon in the wild',
  },
  '🥰': {
    kind: 'mark',
    name: 'Joyful Mark',
    title: 'the Joyful',
    description: 'A mark for a joyful Pokémon',
    conditions: 'Found on a Pokémon in the wild',
  },
  '💢': {
    kind: 'mark',
    name: 'Angry Mark',
    icon: 'menu-raid',
    title: 'the Furious',
    description: 'A mark for a furious Pokémon',
    conditions: 'Found on a Pokémon in the wild',
  },
  '😄': {
    kind: 'mark',
    name: 'Smiley Mark',
    title: 'the Beaming',
    description: 'A mark for a smiley Pokémon',
    conditions: 'Found on a Pokémon in the wild',
  },
  '😢': {
    kind: 'mark',
    name: 'Teary Mark',
    icon: 'menu-raid',
    title: 'the Teary-Eyed',
    description: 'A mark for a sad Pokémon',
    conditions: 'Found on a Pokémon in the wild',
  },
  '😁': {
    kind: 'mark',
    name: 'Upbeat Mark',
    title: 'the Chipper',
    description: 'A mark for a chipper Pokémon',
    conditions: 'Found on a Pokémon in the wild',
  },
  '😖': {
    kind: 'mark',
    name: 'Peeved Mark',
    title: 'the Grumpy',
    description: 'A mark for a grumpy Pokémon',
    conditions: 'Found on a Pokémon in the wild',
  },
  '🤓': {
    kind: 'mark',
    name: 'Intellectual Mark',
    title: 'the Scholar',
    description: 'A mark for a scholarly Pokémon',
    conditions: 'Found on a Pokémon in the wild',
  },
  '🤬': {
    kind: 'mark',
    name: 'Ferocious Mark',
    title: 'the Rampaging',
    description: 'A mark for a rampaging Pokémon',
    conditions: 'Found on a Pokémon in the wild',
  },
  '🥸': {
    kind: 'mark',
    name: 'Crafty Mark',
    title: 'the Opportunist',
    description: 'A mark for an opportunistic Pokémon',
    conditions: 'Found on a Pokémon in the wild',
  },
  '😡': {
    kind: 'mark',
    name: 'Scowling Mark',
    title: 'the Stern',
    description: 'A mark for a stern Pokémon',
    conditions: 'Found on a Pokémon in the wild',
  },
  '🫡': {
    kind: 'mark',
    name: 'Kindly Mark',
    title: 'the Kindhearted',
    description: 'A mark for a kindhearted Pokémon',
    conditions: 'Found on a Pokémon in the wild',
  },
  '🫨': {
    kind: 'mark',
    name: 'Flustered Mark',
    title: 'the Easily Flustered',
    description: 'A mark for an easily flustered Pokémon',
    conditions: 'Found on a Pokémon in the wild',
  },
  '😤': {
    kind: 'mark',
    name: 'Pumped-Up Mark',
    title: 'the Driven',
    description: 'A mark for a driven Pokémon',
    conditions: 'Found on a Pokémon in the wild',
  },
  '😑': {
    kind: 'mark',
    name: 'Zero Energy Mark',
    title: 'the Apathetic',
    description: 'A mark for an apathetic Pokémon',
    conditions: 'Found on a Pokémon in the wild',
  },
  '🤗': {
    kind: 'mark',
    name: 'Prideful Mark',
    title: 'the Arrogant',
    description: 'A mark for an arrogant Pokémon',
    conditions: 'Found on a Pokémon in the wild',
  },
  '😨': {
    kind: 'mark',
    name: 'Unsure Mark',
    title: 'the Reluctant',
    description: 'A mark for an unsure Pokémon',
    conditions: 'Found on a Pokémon in the wild',
  },
  '💬': {
    kind: 'mark',
    name: 'Hmuble Mark',
    title: 'the Humble',
    description: 'A mark for a humble Pokémon',
    conditions: 'Found on a Pokémon in the wild',
  },
  '🌹': {
    kind: 'mark',
    name: 'Thorny Mark',
    title: 'the Pompous',
    description: 'A mark for a pompous Pokémon',
    conditions: 'Found on a Pokémon in the wild',
  },
  '💪': {
    kind: 'mark',
    name: 'Vigor Mark',
    title: 'the Lively',
    description: 'A mark for a lively Pokémon',
    conditions: 'Found on a Pokémon in the wild',
  },
  '🤕': {
    kind: 'mark',
    name: 'Slump Mark',
    icon: 'menu-raid',
    title: 'the Worn-Out',
    description: 'A mark for a worn-out Pokémon',
    conditions: 'Found on a Pokémon in the wild',
  },
  '‼️': {
    kind: 'mark',
    name: 'Rare Mark',
    icon: 'menu-raid',
    title: 'the Recluse',
    description: 'A mark for a reclusive Pokémon',
    conditions: 'Found rarely on a Pokémon in the wild',
  },
  '❗': {
    kind: 'mark',
    name: 'Uncommon Mark',
    icon: 'menu-raid',
    title: 'the Sociable',
    description: 'A mark for a sociable Pokémon',
    conditions: 'Found occasionally on a Pokémon in the wild',
  },
  '~': {
    kind: 'ribbon',
    name: 'Marine Ribbon',
    icon: 'menu-raid',
    description: 'A deprecated ribbon with no title',
    conditions: 'You cannot obtain this ribbon',
  }
}

export type RibbonMarks = keyof typeof RibbonMarksTable

export type EncounterMethod = 'wild' | 'hatch' | 'raid' | 'voyage' | 'dowsing' | 'quest' | 'farm'

export function assignMarks(location: {forecast: WeatherType, timezone: Timezone}, encounterMethod: EncounterMethod) {
  const ribbons: RibbonMarks[] = []
  const hasWeatherMark = Math.random() < 0.02 // 1/50
  if (hasWeatherMark) {
    if (location.forecast === 'Cloudy') {
      ribbons.push('☁️')
    } else if (location.forecast === 'Thunderstorm') {
      ribbons.push('🌩️')
    }  else if (location.forecast === 'Rain') {
      ribbons.push('🌧️')
    } else if (location.forecast === 'Snow') {
      ribbons.push('☃️')
    } else if (location.forecast === 'Heat Wave') {
      ribbons.push('☀️')
    } else if (location.forecast === 'Sandstorm') {
      ribbons.push('⏳')
    } else if (location.forecast === 'Fog') {
      ribbons.push('🌫️')
    }
  } else {
    const hasToDMark = Math.random() < 0.19 && encounterMethod === 'wild' // ~1/52
    if (hasToDMark) {
      const date = spacetime(new Date(), location.timezone)
      if (date.hour() < 6) {
        ribbons.push('💤')
      } else if (date.hour() < 12) {
        ribbons.push('🌅')
      } else if (date.hour() < 19) {
        ribbons.push('🍴')
      } else if (date.hour() < 20) {
        ribbons.push('🌇')
      } else {
        ribbons.push('💤')
      }
    } else {
      const p = Math.random()
      const hasWildMark = p < 0.00035 && encounterMethod === 'wild' // ~1/2800
      if (hasWildMark) {
        ribbons.push(randomItem([
          '💫',
          '💢',
          '😢',
          '🤕',
          '🌹',
          '💪',
          '💬',
          '😨',
          '😤',
          '😑',
          '🤗',
          '😁',
          '😡',
          '🤓',
          '🤬',
          '🥸',
          '🫡',
          '🫨',
          '😖',
          '😄',
          '😍',
          '😂',
          '😇',
          '😬',
          '🤪',
          '😌',
          '🥱',
          '🥰',
        ]))
      } else if (p < 0.001) {
        ribbons.push('‼️')
      } else if (p < 0.02) {
        ribbons.push('❗')
      }
    }
  }
  return ribbons
}
