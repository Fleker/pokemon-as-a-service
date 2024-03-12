import { toBase10, toBase16, toBase64 } from './baseconv'
import * as Pkmn from './pokemon'
import { BadgeId, PokemonForm, PokemonId, Type, types } from './pokemon/types'
import { PokeballId } from './items-list'
import { PokeballArr } from './gen/type-item'
import { LocationId } from './locations-list'
import { locationArray } from './gen/type-location'
import { TeamsBadge } from './badge2'
import {AbilityId} from './battle/ability'
import {RibbonMarksTable} from './ribbon-marks'
import randomItem from './random-item'

/**
 * All natures programmed in the main series. Plus Neutral for Pokémon without defined natures.
 * See https://serebii.net/games/natures.shtml
 */
export type Nature = 'Adamant' | 'Neutral'
  | 'Hardy' /*| 'Lonely' | 'Brave' */| 'Naughty' | 'Bold' | 'Docile' /*| 'Relaxed'
  | 'Impish' | 'Lax' */| 'Timid' /*| 'Hasty' */| 'Serious' | 'Jolly'/* | 'Naive'
  */| 'Modest' /*| 'Mild' | 'Quiet' */| 'Bashful' /*| 'Rash' */| 'Calm' /*| 'Gentle'
  | 'Sassy' | 'Careful' */| 'Quirky'

const NatureArr: Nature[] = ['Hardy', 'Adamant', 'Bold', 'Timid', 'Modest', 'Calm', 'Naughty', 'Jolly']

export const NatureDescription: Record<Nature, string> = {
  Hardy: 'A Pokémon with a Hardy nature will attack by balancing power and accuracy, supporting itself occasionally.',
  Neutral: 'A Pokémon with a Neutral nature will attack by balancing power and accuracy, supporting itself occasionally.',
  Quirky: 'A Pokémon with a Quirky nature will attack by balancing power and accuracy, supporting itself occasionally.',
  Bashful: 'A Pokémon with a Bashful nature will attack by balancing power and accuracy, supporting itself occasionally.',
  Serious: 'A Pokémon with a Serious nature will attack by balancing power and accuracy, supporting itself occasionally.',
  Docile: 'A Pokémon with a Docile nature will attack by balancing power and accuracy, supporting itself occasionally.',
  Adamant: 'A Pokémon with an Adamant nature has more physical attack than special attack. It wants to attack with super-effective moves that deal the most damage regardless of accuracy.',
  Bold: 'A Pokémon with a Bold nature has more physical defense than physical attack. It wants to attack the healthiest opponents with higher-power, lower-accuracy moves.',
  Timid: 'A Pokémon with a Timid nature has more speed than physical attack. It may attack defenseless opponents with high-accuracy moves, but tends to sit back and help teammates.',
  Modest: 'A Pokémon with a Modest nature has more special attack than physical attack. It strikes at slower individual opponents, but tends to sit back and help teammates.',
  Calm: 'A Pokémon with a Calm nature has more special defense than physical attack. It strikes at fast opponents with ease, but those moves tend to strike more than one target.',
  Naughty: 'A Pokémon with a Naughty nature has more attack than special defense. It strikes at weak opponents with high priority moves that have additional effects.',
  Jolly: 'A Pokémon with a Jolly nature has more speed than special attack. It strikes at bulky opponents with high priority moves that have additional effects.',
}

export interface Personality {
  nature?: Nature
  pokeball: PokeballId
  variant?: number
  gender: 'male' | 'female' | ''
  shiny: boolean
  affectionate: boolean
  /** Whether this Pokémon has the ability to Gigantamax */
  gmax?: boolean
  form?: PokemonForm
  location: LocationId
  /** The type this Pokémon will naturally become when terastallizing */
  teraType?: Type
  /** The ability this Pokémon has in battle (if this ever happens) */
  ability?: AbilityId
  /** Whether this Pokémon originally belongs to the trainer (can have very specific mechanics) */
  isOwner?: boolean
  /**
   * Optional field to store any details while
   * debugging the parsers. Do not expect this to
   * stay.
   */
  debug?: {
    byte1: string, byte2: string, byte3: string, byte4: string, byte5: string,
    number1: number, number2: number, number3: number, number4: number, number5: number,
    formIndex?: number, variantId: number,
  }
}

export function toPersonality(personality64: string, id: number): Personality {
  const pkmn = Pkmn.get(`potw-${id}`)
  if (!pkmn) throw new Error(`No Pokemon exists potw-${id} w/${personality64}`)

  // Pad the start in the case of Hardy PokeBall
  const personality16 = toBase16(personality64).padStart(10, '0')
  // Breaks up the personality into base16 strings, where every 2 characters is one byte
  // Byte 1
  const byte1 = personality16.substring(0, 2)
  const number1 = parseInt(byte1, 16)
  // | NATURE (3) | POKEBALL (5) |
  const natureIndex = number1 >> 5 // Apply mask
  const nature = NatureArr[natureIndex]
  const pokeballIndex = number1 & 31 // Apply mask
  const pokeball = PokeballArr[pokeballIndex]
  // Byte 2
  const byte2 = personality16.substring(2, 4)
  const number2 = parseInt(byte2, 16)
  // | VARIANT (4) | GENDER (2) | SHINY (1) | AFFECTIONATE (1) |
  const variantId = (number2 & 240) >> 4 // Apply mask
  const variant = (() => {
    if (variantId === 15) return undefined
    return variantId
  })()
  const genderId = (number2 & 12) >> 2 // Apply mask
  const gender = (() => {
    if (!pkmn.gender) return ''
    if (genderId === 3) return 'female'
    if (genderId === 2) return 'male'
    return ''
  })()
  const shiny = (number2 & 2) >> 1 === 1
  const affectionate = (number2 & 1) === 1
  // Byte 3
  // | GMAX (1) | UNUSED (1) | FORM (6) |
  const byte3 = personality16.substring(4, 6)
  const number3 = parseInt(byte3, 16)
  const gmaxable = pkmn.gmax !== undefined
  const gmax = (number3 & 128) !== 0 && gmaxable
    const formIndex = (() => {
    if (number3 === 63) return undefined
    return number3 & 63
     })()
  const form = (() => {
    if (formIndex !== undefined) {
      // Do datastore lookup to get forms on base
      if (!pkmn.syncableForms) return undefined
      return pkmn.syncableForms![formIndex]
    }
    return undefined
  })()
  // Byte 4 - Location
  const byte4 = personality16.substring(6, 8)
  const number4 = parseInt(byte4, 16)
  const location = locationArray[number4] ?? 'Unknown'
  // Byte 5
  // | TERA TYPE (5) | ABILITY (2) | OWNERSHIP (1) |
  const byte5 = personality16.substring(8, 10)
  const number5 = parseInt(byte5, 16)
  const teraType = (() => {
    if (isNaN(number5)) {
      // Compute default tera type in a deterministic way
      if (pkmn.type2) {
        const teraModifier = ((number1 & 31) + (number2 & 12) + (number2 & 2) + number4) % 2
        return [pkmn.type1, pkmn.type2][teraModifier]
      }
      return pkmn.type1
    }
    const teraIndex = (number5 & 248) >> 3
    return types[teraIndex] ?? pkmn.type1
  })()
  const ability = (() => {
    if (isNaN(number5)) {
      return pkmn.abilities?.[1] ?? 'PlaceholderPower'
    }
    const abilityIndex = (number5 & 6) >> 1
    return pkmn.abilities?.[abilityIndex] ?? 'PlaceholderPower'
  })()
  const isOwner = (() => {
    if (isNaN(number5)) {
      return true // We don't know for sure, so let's assume
    }
    const ownerIndex = (number5 & 1)
    return ownerIndex !== 0
  })()
   
  return {
    pokeball: pokeball as PokeballId,
    nature: nature as Nature,
    variant,
    gender,
    shiny,
    affectionate,
    gmax,
    form,
    location: location as LocationId,
    teraType,
    ability,
    isOwner,
    debug: {
      byte1, byte2, byte3, byte4, byte5,
      number1, number2, number3, number4, number5,
      formIndex, variantId,
    }
  }
}

export function fromPersonality(personality: Personality, id: number): string {
  const pkmn = Pkmn.get(`potw-${id}`)
  if (!pkmn) throw new Error(`No Pokemon exists potw-${id}`)

  // Byte 1
  const byte1 = (() => {
    const natureIndex = NatureArr.indexOf(personality.nature || 'Hardy')
    const ballIndex = PokeballArr.indexOf(personality.pokeball)
    return natureIndex << 5 | ballIndex
  })().toString(16).padStart(2, '0')
  const byte2 = (() => {
    let variant = 15
    if (personality.variant !== undefined) {
      variant = personality.variant
    }
    let gender = 0
    if (pkmn.gender) {
      if (personality.gender === 'male') {
        gender = 2
      }
      if (personality.gender === 'female') {
        gender = 3
      }
    }
    const shiny = personality.shiny ? 1 : 0
    const affection = personality.affectionate ? 1 : 0
    return variant << 4 | gender << 2 | shiny << 1 | affection
  })().toString(16).padStart(2, '0')
  const byte3 = (() => {
    const gmaxable = pkmn.gmax !== undefined
    const gmaxId = (personality.gmax === true && gmaxable ? 128 : 0)
         if (personality.form) {
           if (!pkmn.syncableForms) {
             console.error(`No Pokemon syncable forms exist for potw-${id}` +
               `/${personality.form}`)
        return 63  | gmaxId // No form
           }
           const index = pkmn.syncableForms!.indexOf(personality.form)
           if (index > -1) {
        return index | gmaxId
           }
         }
    return 63 | gmaxId
       })().toString(16).padStart(2, '0')
       const byte4 = (() => {
         const locale = locationArray.indexOf(personality.location)
         if (locale > -1) return locale
         return 0 // Unknown
       })().toString(16).padStart(2, '0')
  const byte5 = (() => {
    const teraIndex = types.indexOf(personality.teraType ?? pkmn.type1)
    const abilityIndex = pkmn.abilities?.indexOf(personality.ability!) ?? 1
    const isOwner = personality.isOwner ? 1 : 0
    return (teraIndex << 3) | (abilityIndex << 1) | isOwner
  })().toString(16).padStart(2, '0')
  return toBase64((byte1 + byte2 + byte3 + byte4 + byte5).toUpperCase())
}

export type Tag = 'FAVORITE' | 'BUDDY' | 'BATTLE' |
  'RELEASE' | 'TRADE' | 'BREED'

// Once this is in production, these tags need to be fixed. They can change
// up until this point.
export const DEFAULT_TAGS: Tag[] = [
  'FAVORITE',
  'BUDDY',
  'BATTLE',
  'RELEASE',
  'TRADE',
  'BREED',
]

export function toDefaultTags(tagStr: string) {
  // Only capture first set
  const tags64 = tagStr.substring(0, 1)
  const tags10 = toBase10(tags64)
  const defaultTags: Tag[] = []
  if (tags10 & 32) defaultTags.push('BREED')
  if (tags10 & 16) defaultTags.push('TRADE')
  if (tags10 &  8) defaultTags.push('RELEASE')
  if (tags10 &  4) defaultTags.push('BATTLE')
  if (tags10 &  2) defaultTags.push('BUDDY')
  if (tags10 &  1) defaultTags.push('FAVORITE')
  return defaultTags
}

export function fromDefaultTags(tagArr: Tag[]) {
  if (tagArr.length === 0) return ''
  let defaultTags = 0
  if (tagArr.includes('BREED'))    defaultTags += 32
  if (tagArr.includes('TRADE'))    defaultTags += 16
  if (tagArr.includes('RELEASE'))  defaultTags += 8
  if (tagArr.includes('BATTLE'))   defaultTags += 4
  if (tagArr.includes('BUDDY'))    defaultTags += 2
  if (tagArr.includes('FAVORITE')) defaultTags += 1
  return toBase64(defaultTags.toString(16).padStart(2, '0').toUpperCase())
}

export function toTags(tagStr: string) {
  // Capture everything after first
  const tags: number[] = []
  for (let i = 1; i < tagStr.length; i++) {
    tags.push(toBase10(tagStr.substr(i, 1)))
  }
  return tags
}

export function fromTags(tagArr: number[]) {
  let tag64 = ''
  tagArr.forEach(n => {
    tag64 += toBase64(n.toString(16).padStart(2, '0').toUpperCase())
  })
  return tag64
}

/**
 * Constructs serialized Pokemon badge.
 * @param id Basic Badge ID for the Pokemon.
 * @param personality JSON representation of its personality.
 * @param defaultTags List of default tags
 * @param tags List of tag indicies
 * @returns String serialization of Pokemon badge.
 */
export function Pokemon(id: number, personality: Partial<Personality> = {}, defaultTags?: Tag[], tags?: number[], ribbons?: string[]): PokemonId {
  const pkmn = new Badge()
  pkmn.id = id
  pkmn.personality = {
    gender: '',
    shiny: false,
    affectionate: false,
    pokeball: 'pokeball',
    location: 'US-MTV',
    ...personality,
  }
  if (defaultTags) {
    pkmn.defaultTags = defaultTags
  }
  if (tags) {
    pkmn.tags = tags
  }
  if (ribbons) {
    pkmn.ribbons = ribbons
  }
  return pkmn.toString() as PokemonId
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
   * Returns the canonical PokemonId from the first match.
   */
  result?: PokemonId
  /**
   * Returns the total number of matches.
   */
  count: number
}

export class Badge {
  original?: string
  id: number
  personality: Personality
  // Tags
  defaultTags?: Tag[]
  tags?: number[] /* Tag indicies */
  ribbons?: string[] /* Ribbon and mark lookup indicies */

  constructor(badgeString?: string) {
    if (typeof badgeString !== 'string') return
    if (badgeString === 'potw-000') {
      // I think I messed up Togetic
      this.id = 176
      this.personality = {
        affectionate: false,
        gender: '',
        location: 'US-MTV',
        pokeball: 'pokeball',
        shiny: false,
      }
    }
    this.original = badgeString
    const [id, personality, tags] = badgeString.split('#')
    const [, ribbons] = badgeString.split('$')
    this.id = toBase10(id)
    if (personality) {
      this.personality = toPersonality(personality, this.id)
    }
    if (tags) {
      this.defaultTags = toDefaultTags(tags)
      this.tags = toTags(tags)
    }
    if (ribbons) {
      this.ribbons = ribbons.split('')
    }
  }

  /**
   * Obtains novel size or undefined.
   */
  get size() {
    // Come up with a deterministic way* to get size
    // ID & PokeBall & gender & shiny & Location
    if (!this.personality.debug) return undefined
    const {number1, number2, number4} = this.personality.debug
    const legacyId = this.toLegacyString()
    const {eggBase} = Pkmn.get(legacyId)!
    const idMod = (() => {
      if (Array.isArray(eggBase)) {
        return parseInt(eggBase[0].substring(5))
      }
      if (eggBase) {
        return parseInt(eggBase.substring(5))
      }
      return parseInt(legacyId.substring(5))
    })()
    // No Mountain View Pokemon can be xx[s|l] as its default
    if (number4 === 0 || number4 === 132) return undefined
    const sizeModifier = (1 + idMod + (number1 & 31) + (number2 & 12) + (number2 & 2) + number4) % 64
    if (sizeModifier === 58) {
      return 's'
    } else if (sizeModifier === 59) {
      return 'l'
    } else if (sizeModifier === 60) {
      return 'xs'
    } else if (sizeModifier === 61) {
      return 'xl'
    } else if (sizeModifier === 62) {
      return 'xxs'
    } else if (sizeModifier === 63) {
      return 'xxl'
    }
    return undefined
  }

  /** Identifies whether a badge is abnormal and is automatically corrected in constructor. */
  get isAbnormal() {
    return this.original !== this.toString()
  }

  /** Split the badge string into two parts for database storage */
  get fragments() {
    return [
      toBase64(this.id.toString(16).toUpperCase()),
      this.toString().split('#').slice(1).join('#')
    ]
  }


  /**
   * Returns visual label for this badge.
   * @returns User-friendly representation of badge.
   */
   toLabel() {
    const dbRes = Pkmn.get(`potw-${this.id}`)
    if (!dbRes) {
      return undefined
    }
    let res = dbRes.species
    const {form, gender, shiny, variant, affectionate} = this.personality
    if (form && dbRes.syncableForms!.includes(form)) {
      form.split('_').forEach(f => {
        res += ' ' + f.substring(0,1).toUpperCase() + f.substring(1)
      })
    }
    if (variant !== undefined) {
      const superscripts = [
        '⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹',
        '¹⁰', '¹¹', '¹²', '¹³', '¹⁴',
      ]
      res += `${superscripts[variant]}`
    }
    if (gender === 'male') res += ' ♂'
    if (gender === 'female') res += ' ♀'
    if (affectionate) res += '♥'
    if (shiny) res += '✨'
    if (this.ribbons?.length) {
      if (RibbonMarksTable[this.ribbons[0]].title) {
        res += ` ${RibbonMarksTable[this.ribbons[0]].title}`
      }
    }
    return res
  }

  toString(): PokemonId {
    const id64 = toBase64(this.id.toString(16).toUpperCase())
    const personality64 = fromPersonality(this.personality, this.id)
    let defaultTags64 = ''
    if (this.defaultTags?.length) {
      defaultTags64 = fromDefaultTags(this.defaultTags)
    }
    let tags64 = ''
    if (this.tags?.length && defaultTags64 == '') {
      defaultTags64 = '0'
    }
    if (this.tags?.length) {
      tags64 = fromTags(this.tags)
    }
    let out = `${id64}#${personality64}`
    if (defaultTags64 === '0' && tags64 !== '') {
      out += `#${defaultTags64}${tags64}`
    }
    if (this.ribbons !== undefined) {
      out += `$${this.ribbons!.join('')}`
    }
    return out as unknown as PokemonId
  }

  toOriginalString(): PokemonId {
    return this.original! as PokemonId
  }

  /**
   * @returns Badge string that can be used in `Sprite.pkmn`.
   */
  toSprite() {
    // Encode to support `potw-201-?`
    const {form, gender, shiny} = this.personality
    return `potw-${this.id.toString().padStart(3, '0')}`
    + (form ? `-${form.replace('?', 'question')}` : '')
    + (gender !== '' ? `-${gender}` : '')
    + (shiny ? `-shiny` : '') as BadgeId
  }

  /**
   * @returns Badge string that can be used in `datastore.get`.
   */
  toDataStr() {
    // Encode to support `potw-201-?`
    const {form, gender} = this.personality
    return `potw-${this.id.toString().padStart(3, '0')}`
    + (form ? `-${form.replace('?', 'question')}` : '')
    + (gender !== '' ? `-${gender}` : '') as BadgeId
  }

  toLegacyString() {
    if (this.personality === undefined) {
      console.error('Error for B3.toLegacyString', this)
    }
    const {form, gender, shiny, variant} = this.personality
    const string = `potw-${this.id.toString().padStart(3, '0')}`
      + (form ? `-${form}` : '')
      + (gender ? `-${gender}` : '')
      + (shiny ? `-shiny` : '')
      + (variant !== undefined ? `-var${variant}` : '')
    return string as BadgeId 
  }

  /**
   * TODO: This needs to be redone as the 'simple' form will need to be
   * reconsidered.
   * @returns Simple representation of badge, only with its ID.
   */
  toSimple(): BadgeId {
    // potw-201-a
    // ^^^^^^^^
    return `potw-${this.id.toString().padStart(3, '0')}` as BadgeId
  }

  /**
   * Generates a Badge3 object from a legacy badge format.
   * @param badge Original badge ID format
   */
  static fromLegacy(badge: string) {
    const legacy = new TeamsBadge(badge)
    const pkmn = Pokemon(legacy.id, {
      affectionate: false,
      gender: legacy.gender,
      location: 'US-MTV', // Shrug for now
      pokeball: 'pokeball',
      shiny: legacy.shiny,
      form: legacy.form,
      variant: legacy.variant,
    })
    const next = new Badge(pkmn)
    return next
  }

  /**
   * Generates a new _valid_ Pokemon from scratch.
   * This will make certain assumptions about the badge format
   * - Form if not provided and it needs one (`needForm`)
   * - Gender if not provided and it needs one
   * - Will assign one of eight natures
+   * - Will assign an ability at random, preferring non-hidden abilities
+   * - Will set the user to the owner
    * 
    * This will NOT add additional properties:
    * - Shiny
    * - Location
    * - PokeBall
+   * - Tera type (default is deterministic)
+   * - Ribbons/Marks (these should be given in higher-level logic)
   * @param badgeId Optional badge ID format
   * @returns A pre-fabbed Badge object where you can add custom properties as-needed
   */
  static create(badgeId: string) {
    const badge = this.fromLegacy(badgeId)
    const dbPkmn = Pkmn.get(badgeId)!
    if (dbPkmn.gender && !badge.personality.gender) {
      badge.personality.gender = randomItem(dbPkmn.gender)
    }
    badge.personality.nature = randomItem(NatureArr)

    // For Pokemon like Burmy, this shouldn't matter if their form is pre-determined.
    // But for Pokemon like Spinda, they should have forms.
    // Also make sure that there isn't some sort of `undefined` form that can also be valid.
    if (!badge.personality.form && dbPkmn.syncableForms && dbPkmn.needForm === true) {
      // Give them a random form if necessary
      badge.personality.form = randomItem(dbPkmn.syncableForms)
    } else if (!badge.personality.form && dbPkmn.syncableForms && dbPkmn.needForm) {
      badge.personality.form = dbPkmn.needForm as PokemonForm
    }
    console.error(badge.id, badge.personality.form)
    badge.personality.ability = (() => {
      if (Math.random() < 0.45) {
        return dbPkmn.abilities?.[1] ?? 'PlaceholderPower'
      }
      if (Math.random() < 0.9) {
        return dbPkmn.abilities?.[2] ?? 'PlaceholderPower'
      }
      return dbPkmn.abilities?.[3]   ?? 'PlaceholderPower'
    })()
    badge.personality.isOwner = true
    badge.personality.gmax = false
    badge.personality.affectionate = false
    return badge
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
  static match(searchId: PokemonId | string, badgeList: PokemonId[], opts: MatchOps): MatchResult {
    let index = -1
    let count = 0
    let match = false
    let matchedBadge: (Badge | undefined)

    const searchBadge = new Badge(searchId)
    const {form, gender, shiny, variant} = searchBadge.personality
    const checkForm = form && !opts.ignoreForm
    const checkGender = gender && !opts.ignoreGender
    const checkShiny = shiny && !opts.ignoreShiny
    const checkVariant = variant !== undefined && !opts.ignoreVariant
    badgeList.forEach((badgeId, i) => {
      const badge = new Badge(badgeId)
      const bp = badge.personality
      if (badge.id !== searchBadge.id) return
      if (opts.exactOnly && badgeId === searchId) {
        if (index === -1) {
          index = i
          matchedBadge = badge
        }
        count++
        match = true
        return
      } else if (opts.exactOnly && badgeId !== searchId) {
        return
      }

      if (opts.overMatch) {
        if (bp.form && bp.form !== form && !opts.ignoreForm) {
          return
        }
        if (bp.gender && bp.gender !== gender && !opts.ignoreGender) {
          return
        }
        if (bp.shiny && bp.shiny !== shiny && !opts.ignoreShiny) {
          return
        }
        if (bp.variant && bp.variant !== variant && !opts.ignoreVariant) {
          return
        }

        if (index === -1) {
          index = i
          matchedBadge = badge
        }
        count++
        match = true
        return
      }

      if (checkForm && bp.form !== form) {
        return
      }

      if (checkGender && bp.gender !== gender) {
        return
      }

      if (checkShiny && bp.shiny !== shiny) {
        return
      }

      if (checkVariant && bp.variant !== variant) {
        return
      }

      if (index === -1) {
        index = i
        matchedBadge = badge
      }
      count++
      match = true
    })

    return {
      index, count, match,
      result: matchedBadge ? matchedBadge.toString() : undefined,
    }
  }

  private static matchPersonality(fields: Partial<Personality>, base: Personality) {
    for (const [pk, pv] of Object.entries(fields)) {
      if (base[pk] !== pv) {
        return false
      }
    }
    return true
  }

  /**
   * Searches that a specific Pokemon exists based on search results and exits quickly.
   * @param badge Badge to search for
   * @param personality Optional badge properties
   * @returns A boolean whether it was found or not in search space.
   */
  static quickMatch(pid: number, personality: Partial<Personality>, badgeList: PokemonId[]) {
    const b64 = toBase64(pid.toString(16).toUpperCase())
    for (const k of badgeList) {
      const ks = k.split('#')
      if (b64 === ks[0]) {
        const badge = new Badge(k)
        if (Badge.matchPersonality(personality, badge.personality)) {
          return true
        }
      }
    }
    return false
  }
}
