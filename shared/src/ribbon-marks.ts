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
}