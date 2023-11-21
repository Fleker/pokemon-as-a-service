import * as Pkmn from './pokemon'
import { BadgeId, PokemonForm, PokemonGender, pokemonForms } from './pokemon/types'

/**
 * @deprecated Use badge2.
 */
export interface IBadge {
  id: number
  form?: PokemonForm
  gender: PokemonGender
  shiny: boolean
  variant?: number
}

/**
 * Abstraction of a Pokemon badge and static methods within.
 * @deprecated Use badge2.
 */
export class Badge implements IBadge {
  id: number
  form: PokemonForm
  gender: 'male' | 'female' | ''
  shiny: boolean
  variant?: number
  static toBadge(badgeString: string): IBadge {
    const [, id, ...params] = badgeString.split('-')
    const badge: IBadge = {
      id: parseInt(id),
      form: params.filter(param => { 
        return param !== 'shiny'
            && param !== 'male'
            && param !== 'female'
            && param.substring(0, 3) !== 'var'
      })[0] as PokemonForm || undefined,
      gender: params.includes('male') ? 'male' : params.includes('female') ? 'female' : '',
      shiny: params.includes('shiny'),
    }
    const variations = params.filter(param => { 
      return param.substring(0, 3) === 'var'
    })[0]
    if (variations) {
      badge.variant = parseInt(variations.substring(3)) // "var0" -> 0
    }
    return badge
  }
  static toLabel(key: string) {
    const species = Pkmn.get(key)
    if (!species) {
      return undefined
    }
    const badge = Badge.toBadge(key)
    let res = Pkmn.get(key)!.species
    if (badge.form && pokemonForms.includes(badge.form)) {
      res += ' ' + badge.form.substring(0,1).toUpperCase() + badge.form.substring(1)
    }
    if (badge.variant !== undefined) {
      const superscripts = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']
      res += `${superscripts[badge.variant]}`
    }
    if (badge.gender === 'male') res += ' Male'
    if (badge.gender === 'female') res += ' Female'
    if (badge.shiny) res += ' (Shiny)'
    return res
  }
  static toSimpleString(badge: string): BadgeId {
    // potw-201-a
    // ^^^^^^^^
    return badge.substring(0, 8) as BadgeId
  }
  static toString(badge: IBadge): BadgeId {
    const string = `potw-${badge.id.toString().padStart(3, '0')}`
      + (badge.form ? `-${badge.form}` : '')
      + (badge.gender ? `-${badge.gender}` : '')
      + (badge.shiny ? `-shiny` : '')
      + (badge.variant !== undefined ? `-var${badge.variant}` : '')
    return string as BadgeId
  }
  static toSprite(id: string) {
    const badge = Badge.toBadge(id)
    // Encode to support `potw-201-?`
    return encodeURIComponent(`potw-${badge.id.toString().padStart(3, '0')}`
    + (badge.form ? `-${badge.form}` : '')
    + (badge.gender ? `-${badge.gender}` : '')
    + (badge.shiny ? `-shiny` : ''))
  }
}