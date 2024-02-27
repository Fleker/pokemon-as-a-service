import asLiterals from "../as-literals"
import { Tier } from "../battle-tiers"
import { CanBeShiny } from "../shiny"
import { MoveId } from "../gen/type-move-meta"
import {datastoreBuilder} from '../pokemon'
export const types = asLiterals([
  'Bug', 'Normal', 'Fighting', 'Flying', 'Fire', 'Poison', 'Fairy', 'Ghost',
    'Psychic', 'Dark', 'Dragon', 'Steel', 'Water', 'Grass', 'Ice', 'Electric',
    'Ground', 'Rock', 'Status'
])
export type Type = keyof {[K in (typeof types)[number]]: string}
export type EggGroup = 'Monster' | 'Water 1' | 'Bug' | 'Flying' | 'Field' | 'Fairy' | 'Grass'
    | 'Human-Like' | 'Water 3' | 'Mineral' | 'Amorphous' | 'Water 2' | 'Ditto' | 'Dragon'
    | 'Undiscovered'
export type PokemonGender = 'male' | 'female' | ''
interface Mega {
  attack: number
  defense: number
  spAttack: number
  spDefense: number
  speed: number
  type2?: Type | false
  move: MoveId[]
  weight: number
  pokedex: string
}
interface Gigantamax {
  gmaxMove: MoveId
  pokedex: string
}
export interface PokemonDocBuilder {
  species: string
  pokedex: string
  abilityName?: string
  type1: Type
  type2?: Type
  hp: number
  attack: number
  defense: number
  spAttack: number
  spDefense: number
  speed: number
  move: MoveId[]
  moveTMs: MoveId[]
  moveAll?: MoveId[]
  // For variations
  novelMoves?: MoveId[][]
  // Day Care
  eggBase?: string | string[]
  eggGroup?: EggGroup[]
  levelAt?: number
  levelTo?: string | string[]
  /**
   * Evolutions for this Pokemon that it cannot get to via level-up.
   */
  evolveTo?: string[]
  // Other metadata
  /**
   * Whether a base form of this Pokémon makes sense.
   */
  needForm?: boolean | PokemonForm
  /**
   * Other valid forms this may have but cannot breed. Used for syncing badges.
   */
  syncableForms?: PokemonForm[]
  /**
   * Optional list of genders. Randomly selected. Ratios can be specified
   * by setting more of one gender than the other.
   */
  gender?: PokemonGender[]
  /**
   * Current shiny availability.
   */
  shiny: CanBeShiny
  /**
   * List of tiers this Pokémon is eligible to compete in.
   */
  tiers?: Tier[]
  /**
   * Gift given when Pokémon is released. Poké Ball is implied at default.
   */
  release?: 'pokeball' | 'greatball' | 'ultraball'
  mega?: Mega
  megax?: Mega
  megay?: Mega
  gmax?: Gigantamax
  rarity?: 'COMMON' | 'LEGENDARY' | 'MYTHICAL'
  /** Weight of the Pokémon in kilograms. See https://pokemondb.net/pokedex/stats/height-weight */
  weight: number
  /**
   * Number of 'cycles' a given Pokémon needs to hatch.
   * This corresponds to some number of real-world days TBD.
   * Legendary Pokémon have this number too, but set very high (80/120). Use -1 for these.
   *
   * See https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_base_Egg_cycles
   */
  eggCycles: 5 | 10 | 15 | 20 | 25 | 30 | 35 | 40 | -1
}
export interface PokemonDoc extends PokemonDocBuilder {
  eggBase?: BadgeId | BadgeId[]
  levelTo?: BadgeId | BadgeId[]
}
export const pokemonForms = asLiterals(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h',
  'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u',
  'v', 'w', 'x', 'y', 'z', '?', '!',
  'sunny', 'rainy', 'snowy', 'attack', 'defense', 'speed',
  'plant', 'sandy', 'trash', 'overcast', 'sunshine',
  'west_sea', 'east_sea', 'altered', 'origin', 'land', 'sky',
  'fan', 'frost', 'heat', 'mow', 'wash',
  'red_stripe', 'blue_stripe', 'zen', 'spring', 'summer', 'autumn', 'winter',
  'incarnate', 'therian', 'aria', 'pirouette', 'ordinary', 'resolute',
  'black', 'white',
  'archipelago', 'continental', 'elegant', 'garden', 'highplains', 'icysnow',
  'jungle', 'marine', 'meadow', 'modern', 'monsoon', 'ocean', 'polar', 'river',
  'sandstorm', 'savanna', 'sun', 'tundra', 'pokeball', 'fancy',
  'natural', 'heart', 'star', 'diamond', 'debutante', 'matron', 'dandy',
  'lareine', 'kabuki', 'pharaoh',
  'red', 'yellow', 'orange', 'blue', 'eternal',
  'blade', 'shield', 'small', 'average', 'large', 'super',
  'confined', 'unbound', 'ash',
  'fifty', 'ten', 'complete',
  'belle', 'libre', 'phd', 'pop_star', 'rock_star',
  'page', 'brin', 'spiky',
  'kantonian', 'johtoian', 'hoennian', 'sinnohian', 'unovan', 'kalosian', 'alolan', 'galarian', 'hisuian', 'paldean',
  'baile', 'pom_pom', 'pau', 'sensu', 'midday', 'midnight', 'dusk',
  'school', 'original', 'dusk_mane', 'dawn_wings', 'ultra_burst',
  'blue_core', 'green_core', 'indigo_core', 'orange_core', 'red_core', 'violet_core', 'yellow_core', 
  'blue_meteor', 'green_meteor', 'indigo_meteor', 'orange_meteor', 'red_meteor', 'violet_meteor', 'yellow_meteor', 
  'totem', 'alpha', 'noble', 'titan',
  'galarian_zen', 'gulping', 'gorging', 'amped', 'low_key', 'phony', 'antique', 'ice_face', 'noice_face',
  'full_belly', 'hangry', 'hero_of_many_battles', 'crowned_sword', 'crowned_shield', 'eternamax',
  'strawberry_vanilla_cream', 'berry_vanilla_cream', 'love_vanilla_cream', 'star_vanilla_cream', 'clover_vanilla_cream', 'flower_vanilla_cream', 'ribbon_vanilla_cream',
  'strawberry_ruby_cream', 'berry_ruby_cream', 'love_ruby_cream', 'star_ruby_cream', 'clover_ruby_cream', 'flower_ruby_cream', 'ribbon_ruby_cream',
  'strawberry_matcha_cream', 'berry_matcha_cream', 'love_matcha_cream', 'star_matcha_cream', 'clover_matcha_cream', 'flower_matcha_cream', 'ribbon_matcha_cream',
  'strawberry_mint_cream', 'berry_mint_cream', 'love_mint_cream', 'star_mint_cream', 'clover_mint_cream', 'flower_mint_cream', 'ribbon_mint_cream',
  'strawberry_lemon_cream', 'berry_lemon_cream', 'love_lemon_cream', 'star_lemon_cream', 'clover_lemon_cream', 'flower_lemon_cream', 'ribbon_lemon_cream',
  'strawberry_salted_cream', 'berry_salted_cream', 'love_salted_cream', 'star_salted_cream', 'clover_salted_cream', 'flower_salted_cream', 'ribbon_salted_cream',
  'strawberry_ruby_swirl', 'berry_ruby_swirl', 'love_ruby_swirl', 'star_ruby_swirl', 'clover_ruby_swirl', 'flower_ruby_swirl', 'ribbon_ruby_swirl',
  'strawberry_caramel_swirl', 'berry_caramel_swirl', 'love_caramel_swirl', 'star_caramel_swirl', 'clover_caramel_swirl', 'flower_caramel_swirl', 'ribbon_caramel_swirl',
  'strawberry_rainbow_swirl', 'berry_rainbow_swirl', 'love_rainbow_swirl', 'star_rainbow_swirl', 'clover_rainbow_swirl', 'flower_rainbow_swirl', 'ribbon_rainbow_swirl',
  'single_strike', 'rapid_strike', 'ice_rider', 'shadow_rider', 'dada',
  'blaze_breed', 'aqua_breed', 'combat_breed', 'zero', 'hero', 'white_stripe',
  'two_segment', 'three_segment', 'family_of_three', 'family_of_four', 'curly', 'stretchy', 'droopy',
  'green_plumage', 'yellow_plumage', 'blue_plumage', 'white_plumage', 'chest', 'roaming',
  'blood_moon', 'counterfeit', 'unremarkable', 'artisan', 'masterpiece', 'wellspring', 'hearthflame', 'cornerstone',
  // https://www.serebii.net/magikarpjump/magikarp.shtml
  'skelly', 'orange_and_white_calico', 'orange_white_and_black_calico', 'white_and_orange_calico',
  'orange_and_gold_calico', 'orange_two_tone', 'orange_orca', 'orange_dapples',
  'pink_two_tone', 'pink_orca', 'pink_dapples', 'gray_bubbles', 'gray_diamonds', 'gray_patches',
  'purple_bubbles', 'purple_diamonds', 'purple_patches',
  'apricot_tiger', 'apricot_zebra', 'apricot_stripes',
  'brown_tiger', 'brown_zebra', 'brown_stripes', 'orange_forehead', 'orange_mask',
  'black_forehead', 'black_mask', 'saucy_blue',
  'blue_raindrop', 'violet_blue', 'violet_raindrop', 'gold',
  'terastal', 'stellar',
])
export type PokemonForm = keyof {[K in (typeof pokemonForms)[number]]: string}
// type BadgePartShiny = `-shiny` | ''
// type BadgePartForm = `-${PokemonForm}` | ''
// type BadgePartVariant = '-var0' | '-var1' | '-var2' | '-var3' | ''
// type BadgePartGender = '-male' | '-female' | ''
/**
 * Expression produces a union type that is too complex to represent.
 */
// type N = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
// export type BadgeId = `potw-${N}${N}${N}${BadgePartForm}${BadgePartGender}${BadgePartShiny}${BadgePartVariant}`
// export type BadgeId = `potw-${number}` | `potw-${number}-${string}`
// export type BadgeId = `potw-${N}${N}${N}${BadgePartVariant}${BadgePartGender}${BadgePartShiny}`
// export type BadgeId = `potw-${N}${N}${N}${N}`
export type BadgeId = keyof typeof datastoreBuilder;
type A64 = '' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' |
  'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' |
  'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'x' | 'y' | 'z' |
  'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' |
  'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'X' | 'Y' | 'Z' |
  '-' | '_'
type B64 = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' |
  'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' |
  'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'x' | 'y' | 'z' |
  'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' |
  'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'X' | 'Y' | 'Z' |
  '-' | '_'
export type PokemonId = `${A64}${B64}#Yf_4`
export function ensurePkmnBuilder(obj: PokemonDocBuilder) {
  return obj;
}