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
  '💫': {
    kind: 'mark',
    name: 'Absent-Minded Mark',
    icon: 'menu-raid',
    title: 'the Spacey',
    description: 'A mark for a spacey Pokémon',
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
  '😢': {
    kind: 'mark',
    name: 'Teary Mark',
    icon: 'menu-raid',
    title: 'the Teary-Eyed',
    description: 'A mark for a sad Pokémon',
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
