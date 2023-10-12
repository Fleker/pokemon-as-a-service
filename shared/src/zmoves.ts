import { Potw } from "./badge2"
import { BadgeId, Type } from "./pokemon/types"
import { MoveId } from "./gen/type-move-meta"
import * as P from './gen/type-pokemon'

/**
 * Simple implementation of getting Z-Move power
 * See https://bulbapedia.bulbagarden.net/wiki/Z-Move#Power
 * @param power Original move power
 */
export const zMovePower = (power: number) => {
  if (power === 0) return 0
  if (power > 0 && power <= 0.55) {
    return 1.2 // FIXME: This needs to be normalized
  } else if (power <= 0.65) {
    return 1.4
  } else if (power <= 0.75) {
    return 1.6
  } else if (power <= 0.85) {
    return 1.8
  } else if (power <= 1) {
    return 1.95
  } else if (power <= 1.2) {
    return 2
  } else if (power <= 1.3) {
    return 2.05
  } else if (power <= 1.45) {
    return 2.1
  } else if (power <= 1.5) {
    return 2.15
  } else if (power > 1.5) {
    return 2.2
  }
  return 0 // No damage
}

/**
 * Simple mapping of damaging moves to their corresponding Z-Move.
 * See https://bulbapedia.bulbagarden.net/wiki/Z-Move#For_each_type
 */
export const zMoveMapping: Record<Type, MoveId> = {
  'Normal': 'Breakneck Blitz',
  'Fighting': 'All-Out Pummeling',
  'Flying': 'Supersonic Skystrike',
  'Poison': 'Acid Downpour',
  'Ground': 'Tectonic Rage',
  'Rock': 'Continental Crush',
  'Bug': 'Savage Spin-Out',
  'Ghost': 'Never-Ending Nightmare',
  'Steel': 'Corkscrew Crash',
  'Fire': 'Inferno Overdrive',
  'Water': 'Hydro Vortex',
  'Grass': 'Bloom Doom',
  'Electric': 'Gigavolt Havoc',
  'Psychic': 'Shattered Psyche',
  'Ice': 'Subzero Slammer',
  'Dragon': 'Devastating Drake',
  'Dark': 'Black Hole Eclipse',
  'Fairy': 'Twinkle Tackle',
  'Status': 'Splash', // Lol
}

/**
 * More specialized mapping of moves for specific Pokemon/Move combinations to Z-Moves.
 * See https://bulbapedia.bulbagarden.net/wiki/Z-Move#For_specific_Pok.C3.A9mon
 */
export const specialZMoveMapping: Partial<Record<MoveId, {holder: BadgeId[], original: MoveId}>> = {
  'Catastropika': {holder: [P.Pikachu], original: 'Volt Tackle'},
  '10_000_000 Volt Thunderbolt': {holder: [P.Pikachu], original: 'Thunderbolt'},
  'Stoked Sparksurfer': {holder: [Potw(P.Raichu, {form: 'alolan'})], original: 'Thunderbolt'},
  'Extreme Evoboost': {holder: [P.Eevee], original: 'Return'}, // Last Resort not in movepool.ts
  'Pulverizing Pancake': {holder: [P.Snorlax], original: 'Giga Impact'},
  'Genesis Supernova': {holder: [P.Mew], original: 'Psychic'},
  'Sinister Arrow Raid': {holder: [P.Decidueye], original: 'Spirit Shackle'},
  'Malicious Moonsault': {holder: [P.Incineroar], original: 'Darkest Lariat'},
  'Oceanic Operetta': {holder: [P.Primarina], original: 'Sparkling Aria'},
  'Splintered Stormshards': {holder: [P.Lycanroc], original: 'Stone Edge'},
  "Let's Snuggle Forever": {holder: [P.Mimikyu], original: 'Play Rough'},
  'Clangorous Soulblaze': {holder: [P.Kommo_o], original: 'Clanging Scales'},
  'Guardian of Alola': {holder: [P.Tapu_Koko, P.Tapu_Bulu, P.Tapu_Lele, P.Tapu_Fini], original: "Nature's Madness"},
  'Searing Sunraze Smash': {holder: [P.Solgaleo, P.Necrozma], original: 'Sunsteel Strike'},
  'Menacing Moonraze Maelstrom': {holder: [P.Lunala, P.Necrozma], original: 'Moongeist Beam'},
  'Light That Burns the Sky': {holder: [P.Necrozma], original: 'Photon Geyser'},
  'Soul-Stealing 7-Star Strike': {holder: [P.Marshadow], original: 'Spectral Thief'},
}
