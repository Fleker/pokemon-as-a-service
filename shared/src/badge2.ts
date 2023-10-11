/**
 * @deprecated Use Badge3
 * @fileoverview Performs serialization and deserialization.
 */
import * as Pkmn from './pokemon'
import { BadgeId, PokemonForm, pokemonForms, PokemonGender } from './pokemon/types'

export interface IBadge {
  id: number
  form?: PokemonForm
  gender?: PokemonGender
  shiny?: boolean
  var?: number
}

/**
 * Only match Pokemon IDs.
 */
export const MATCH_SIMPLE: MatchOps = {
  exactOnly: false,
  overMatch: false,
  ignoreForm: true,
  ignoreGender: true,
  ignoreShiny: true,
  ignoreVariant: true,
}

/**
 * Match strings exactly.
 */
export const MATCH_EXACT: MatchOps = {
  exactOnly: true,
  overMatch: false,
  ignoreForm: false,
  ignoreGender: false,
  ignoreShiny: false,
  ignoreVariant: false,
}

/**
 * Match on a best-effort (if search string has it, look for it).
 */
export const MATCH_REQS: MatchOps = {
  exactOnly: false,
  overMatch: false,
  ignoreForm: false,
  ignoreGender: false,
  ignoreShiny: false,
  ignoreVariant: false,
}

/**
 * Match on a best-effort (which is same as `MATCH_REQS` but may change later).
 */
export const MATCH_GTS: MatchOps = {
  exactOnly: false,
  overMatch: false,
  ignoreForm: false,
  ignoreGender: false,
  ignoreShiny: false,
  ignoreVariant: false,
}

/**
 * Match a Pokemon in a filter list, such as for using candy on a Pokemon
 * with a specific expected gender. Alternatively, may be used to evolve
 * a Pokemon with a form that does not strictly appear in the Pokemon
 * datastore.
 */
export const MATCH_FILTER: MatchOps = {
  exactOnly: false,
  overMatch: true,
  ignoreForm: false,
  ignoreGender: false,
  ignoreShiny: false,
  ignoreVariant: false,
}

/**
 * Represents options during a Badge.match operation.
 */
export interface MatchOps {
  /**
   * Matches strings exactly.
   */
  exactOnly: boolean
  /**
   * Matches target if it meets at least all the requirements of the array.
   * `potw-412-plant-male` would match `potw-412`, `potw-412-plant`,
   * and `potw-412-male`.
   */
  overMatch: boolean
  /**
   * Ignores gender value.
   */
  ignoreGender: boolean
  /**
   * Ignores shiny value.
   */
  ignoreShiny: boolean
  /**
   * Ignores form value.
   */
  ignoreForm: boolean
  /**
   * Ignores variant.
   */
  ignoreVariant: boolean
}

/**
 * Represents the result of a Badge.match operation.
 */
export interface MatchResult {
  /**
   * True if there is at least one match.
   */
  match: boolean
  /**
   * Returns the first index this match occurs.
   */
  index: number
  /**
   * Returns the total number of matches.
   */
  count: number
}

/**
 * Constructs serailized Pokemon badge.
 * @param id Basic Badge ID for the Pokemon.
 * @param other JSON representation of other parts.
 * @returns String serialization of Pokemon badge.
 */
// export function Pokemon(id: BadgeId, other: Partial<IBadge> = {}): BadgeId {
export function Potw(id: BadgeId, other: Partial<IBadge> = {}): BadgeId {
  const pkmn = new TeamsBadge(id)
  pkmn.gender = other.gender || ''
  pkmn.variant = other.var
  pkmn.shiny = other.shiny || false
  if (other.form) {
    pkmn.form = other.form
  }
  return pkmn.toString() as BadgeId
}

/**
 * Represents a Pokemon badge in its various parts.
 */
export class TeamsBadge implements IBadge {
  badgeId: BadgeId
  id: number
  form: PokemonForm
  gender: 'male' | 'female' | ''
  shiny: boolean
  variant?: number

  /**
   * Creates a new badge.
   * @param badgeString Pre-existing badge string.
   * @returns Badge object.
   */
  constructor(badgeString: BadgeId | string) {
    if (typeof badgeString !== 'string') {
      return
    }
    const [, id, ...params] = badgeString.split('-')
    this.badgeId = badgeString as BadgeId
    this.id = parseInt(id)
    this.form = params.filter(param => { 
      return param !== 'shiny'
          && param !== 'male'
          && param !== 'female'
          && param.substring(0, 3) !== 'var'
    })[0] as PokemonForm || undefined
    this.gender = params.includes('male') ? 'male' : params.includes('female') ? 'female' : ''
    this.shiny = params.includes('shiny')
    const variations = params.filter(param => { 
      return param.substring(0, 3) === 'var'
    })[0]
    if (variations) {
      this.variant = parseInt(variations.substring(3)) // "var0" -> 0
    }
  }

  /**
   * Creates a badge from its composite components.
   * @param json JSON properties of badge.
   * @returns Badge object.
   */
  static fromJson(json: IBadge): TeamsBadge {
    const badge = new TeamsBadge(`potw-001`) // Default
    badge.id = json.id
    if (json.form) {
      badge.form = json.form
    }
    if (json.gender) {
      badge.gender = json.gender
    }
    if (json.shiny) {
      badge.shiny = json.shiny
    }
    if (json.var !== undefined) {
      badge.variant = json.var
    }
    return badge
  }

  /**
   * @returns JSON representation of badge components.
   */
  toJson() {
    const json: IBadge = {
      id: this.id
    }
    if (this.form) {
      json.form = this.form
    }
    if (this.gender) {
      json.gender = this.gender
    }
    if (this.shiny) {
      json.shiny = this.shiny
    }
    if (this.variant !== undefined) {
      json.var = this.variant
    }
    return json
  }

  /**
   * Returns visual label for this badge.
   * @returns User-friendly representation of badge.
   */
  toLabel() {
    const dbRes = Pkmn.get(this.badgeId)
    if (!dbRes) {
      return undefined
    }
    let res = dbRes.species
    if (this.form && pokemonForms.includes(this.form)) {
      res += ' ' + this.form.substring(0,1).toUpperCase() + this.form.substring(1)
    }
    if (this.variant !== undefined) {
      const superscripts = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']
      res += `${superscripts[this.variant]}`
    }
    if (this.gender === 'male') res += ' Male'
    if (this.gender === 'female') res += ' Female'
    if (this.shiny) res += ' (Shiny)'
    return res
  }

  /**
   * @returns Badge string that can be used in `Sprite.pkmn`.
   */
  toSprite() {
    return (`potw-${this.id.toString().padStart(3, '0')}`
    + (this.form ? `-${this.form}` : '')
    + (this.gender ? `-${this.gender}` : '')
    + (this.shiny ? `-shiny` : '')).replace('?', 'question') as BadgeId
  }

  /**
   * @returns Simple representation of badge, only with its ID.
   */
  toSimple(): BadgeId {
    // potw-201-a
    // ^^^^^^^^
    return `potw-${this.id.toString().padStart(3, '0')}` as BadgeId
  }

  /**
   * @returns String serialization of badge components.
   */
  toString(): BadgeId {
    const string = `potw-${this.id.toString().padStart(3, '0')}`
      + (this.form ? `-${this.form}` : '')
      + (this.gender ? `-${this.gender}` : '')
      + (this.shiny ? `-shiny` : '')
      + (this.variant !== undefined ? `-var${this.variant}` : '')
    return string as BadgeId
  }

  /**
   * Searches through a list of badges for a particular one.
   *
   * This is a major revamp of the previous badge class methods to consolidate
   * all matching capabilities in one function. It accepts a variety of params
   * and is designed to be future proof as the game develops. It also provides
   * many response types depending if you want the count, the index, or just a
   * boolean.
   *
   * @example
   * ```typescript
   * // For legendary quests:
   * //   Want to see if I have a particular Pokémon.
   * const {match} = Badge.match('potw-413-plant', currentBadges, MATCH_REQS)
   * if (!match) throw new Error('You need Wormadam (Plant)')
   * ```
   *
   * @param searchId Badge to search for in the list.
   * @param badgeList List of badges, potentially `currentBadges`.
   * @param opts Search options, or use pre-existing `MATCH_*` constant.
   * @returns A set of match properties with `index`, `count`, and `match`.
   */
  static match(searchId: BadgeId | string, badgeList: BadgeId[] | string[], opts: MatchOps): MatchResult {
    let index = -1
    let count = 0
    let match = false

    const searchBadge = new TeamsBadge(searchId)
    const checkForm = searchBadge.form && !opts.ignoreForm
    const checkGender = searchBadge.gender && !opts.ignoreGender
    const checkShiny = searchBadge.shiny && !opts.ignoreShiny
    const checkVariant = searchBadge.variant !== undefined && !opts.ignoreVariant
    badgeList.forEach((badgeId, i) => {
      const badge = new TeamsBadge(badgeId)
      if (badge.id !== searchBadge.id) return
      if (opts.exactOnly && badgeId === searchId) {
        if (index === -1) index = i
        count++
        match = true
        return
      } else if (opts.exactOnly && badgeId !== searchId) {
        return
      }

      if (opts.overMatch) {
        if (badge.form && badge.form !== searchBadge.form && !opts.ignoreForm) {
          return
        }
        if (badge.gender && badge.gender !== searchBadge.gender && !opts.ignoreGender) {
          return
        }
        if (badge.shiny && badge.shiny !== searchBadge.shiny && !opts.ignoreShiny) {
          return
        }
        if (badge.variant && badge.variant !== searchBadge.variant && !opts.ignoreVariant) {
          return
        }

        if (index === -1) index = i
        count++
        match = true
        return
      }

      if (checkForm && badge.form !== searchBadge.form) {
        return
      }

      if (checkGender && badge.gender !== searchBadge.gender) {
        return
      }

      if (checkShiny && badge.shiny !== searchBadge.shiny) {
        return
      }

      if (checkVariant && badge.variant !== searchBadge.variant) {
        return
      }

      if (index === -1) index = i
      count++
      match = true
    })

    return {
      index, count, match
    }
  }
}
