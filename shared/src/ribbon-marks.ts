/**
 * @fileoverview A lookup table for ribbons and marks that a Pokémon might have
 * @see Ribbons on Bulbapedia - https://bulbapedia.bulbagarden.net/wiki/List_of_Ribbons_in_the_games
 * @see Marks on Bulbapedia - https://bulbapedia.bulbagarden.net/wiki/Mark#List_of_marks
 */

type Kind = 'ribbon' | 'mark'

interface RibbonMark {
  kind: Kind
  name: string
  icon: string
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
    description: 'A mark r for a mist-drifting Pokémon',
    conditions: 'Found on a Pokémon in the mist',
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
