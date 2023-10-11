import { Potw } from './badge2'
import { BadgeId, Type } from './pokemon/types'
import * as P from './gen/type-pokemon'

type FriendSafariMapping = Record<string, BadgeId[]>

export const FriendSafariTypes: Record<string, Type> = {
  0: 'Bug',
  1: 'Dark',
  2: 'Dragon',
  3: 'Electric',
  4: 'Fairy',
  5: 'Fighting',
  6: 'Fire',
  7: 'Flying',
  8: 'Ghost',
  9: 'Grass',
  a: 'Ground',
  b: 'Ice',
  c: 'Normal',
  d: 'Poison',
  e: 'Psychic',
  f: 'Rock',
  g: 'Steel',
  h: 'Water',
  i: 'Bug',
  j: 'Dark',
  k: 'Dragon',
  l: 'Electric',
  m: 'Fairy',
  n: 'Fighting',
  o: 'Fire',
  p: 'Flying',
  q: 'Ghost',
  r: 'Grass',
  s: 'Ground',
  t: 'Ice',
  u: 'Normal',
  v: 'Poison',
  w: 'Psychic',
  x: 'Rock',
  y: 'Steel',
  z: 'Water',
  A: 'Bug',
  B: 'Dark',
  C: 'Dragon',
  D: 'Electric',
  E: 'Fairy',
  F: 'Fighting',
  G: 'Fire',
  H: 'Flying',
  I: 'Ghost',
  J: 'Grass',
  K: 'Ground',
  L: 'Ice',
  M: 'Normal',
  N: 'Poison',
  O: 'Psychic',
  P: 'Rock',
  Q: 'Steel',
  R: 'Water',
  S: 'Bug',
  T: 'Electric',
  U: 'Fighting',
  V: 'Fire',
  W: 'Flying',
  X: 'Grass',
  Y: 'Normal',
  Z: 'Water',  
}

export const FriendSafariMap: FriendSafariMapping = {
  0: [P.Butterfree, P.Paras, P.Ledian, P.Combee], // Bug
  1: [P.Mightyena, P.Nuzleaf, P.Pawniard, P.Vullaby], // Dark
  2: [P.Dratini, P.Gabite, P.Fraxure, P.Shelgon], // Dragon
  3: [P.Electrode, P.Pachirisu, P.Emolga, P.Dedenne], // Electric
  4: [P.Togepi, P.Snubbull, P.Kirlia, P.Dedenne], // Fairy
  5: [P.Mankey, P.Machoke, P.Meditite, P.Mienfoo], // Fighting
  6: [P.Growlithe, P.Ponyta, P.Magmar, P.Pansear], // Fire
  7: [P.Pidgey, P.Spearow, P.Farfetchd, P.Doduo], // Flying
  8: [P.Shuppet, P.Misdreavus, P.Haunter, P.Duskull], // Ghost
  9: [P.Oddish, P.Tangela, P.Bellsprout, P.Sunkern], // Grass
  a: [P.Sandshrew, P.Wooper, P.Phanpy, P.Trapinch], // Ground
  b: [P.Delibird, P.Snorunt, P.Spheal, P.Spheal], // Ice
  c: [P.Aipom, P.Dunsparce, P.Teddiursa, P.Lillipup], // Normal
  d: [P.Beedrill, P.Gloom, P.Cascoon, P.Seviper], // Poison
  e: [P.Girafarig, P.Gothorita, P.Duosion, P.Chimecho], // Psychic
  f: [P.Nosepass, P.Boldore, P.Graveler, P.Dwebble], // Rock
  g: [P.Magneton, P.Mawile, P.Ferroseed, P.Klang], // Steel
  h: [P.Krabby, P.Remoraid, P.Bibarel, P.Panpour], // Water
  i: [P.Beautifly, P.Dustox, P.Masquerain, P.Heracross], // Bug
  j: [P.Sneasel, P.Cacturne, P.Crawdaunt, P.Sandile], // Dark
  k: [P.Noibat, P.Druddigon, P.Vibrava, P.Sliggoo], // Dragon
  l: [P.Pikachu, P.Electabuzz, P.Stunfisk, P.Helioptile], // Electric
  m: [P.Jigglypuff, P.Mawile, P.Spritzee, P.Swirlix], // Fairy
  n: [P.Throh, P.Sawk, P.Pancham, P.Riolu], // Fighting
  o: [P.Charmeleon, P.Slugma, P.Larvesta, P.Pyroar], // Fire
  p: [P.Hoothoot, P.Tranquill, P.Woobat, P.Swanna], // Flying
  q: [P.Phantump, P.Pumpkaboo, P.Drifloon, P.Golett], // Ghost
  r: [P.Pansage, P.Ivysaur, P.Swadloon, P.Petilil], // Grass
  s: [P.Rhyhorn, P.Diglett, P.Cubone, P.Nincada], // Ground
  t: [P.Sneasel, P.Cubchoo, P.Bergmite, P.Smoochum], // Ice
  u: [P.Loudred, P.Kecleon, P.Audino, P.Minccino], // Normal
  v: [P.Venomoth, P.Ariados, P.Swalot, P.Trubbish], // Poison
  w: [P.Abra, P.Drowzee, P.Spoink, P.Munna], // Psychic
  x: [P.Onix, P.Magcargo, P.Corsola, P.Pupitar], // Rock
  y: [P.Metang, P.Skarmory, P.Bronzor, P.Drilbur], // Steel
  z: [P.Wartortle, P.Frogadier, P.Magikarp, P.Wooper], // Water
  A: [P.Volbeat, P.Illumise, P.Pinsir, P.Venomoth], // Bug
  B: [P.Sableye, P.Absol, P.Liepard, P.Inkay], // Dark
  C: [P.Seadra, P.Swablu, P.Deino, P.Skrelp], // Dragon
  D: [P.Manectric, P.Luxio, P.Zebstrika, P.Galvantula], // Electric
  E: [P.Clefairy, Potw(P.Floette, {form: 'white'}), P.Carbink, P.Cottonee], // Fairy
  F: [P.Makuhita, P.Breloom, P.Tyrogue, P.Croagunk], // Fighting
  G: [P.Vulpix, P.Braixen, P.Fletchinder, P.Houndour], // Fire
  H: [P.Tropius, P.Rufflet, P.Fletchinder, P.Hawlucha], // Flying
  I: [P.Sableye, P.Yamask, P.Frillish, P.Honedge], // Ghost
  J: [P.Maractus, P.Quilladin, P.Bayleef, P.Gogoat], // Grass
  K: [P.Gastrodon, P.Palpitoad, P.Diggersby, P.Baltoy], // Ground
  L: [P.Dewgong, P.Shellder, P.Lapras, P.Piloswine], // Ice
  M: [P.Chansey, P.Ditto, P.Eevee, P.Smeargle], // Normal
  N: [P.Muk, P.Drapion, P.Toxicroak, P.Whirlipede], // Poison
  O: [P.Wobbuffet, P.Sigilyph, P.Espurr, P.Xatu], // Psychic
  P: [P.Rhyhorn, P.Shuckle, P.Barbaracle, P.Bonsly], // Rock
  Q: [P.Pineco, P.Klefki, P.Lairon, P.Durant], // Steel
  R: [P.Floatzel, P.Poliwhirl, P.Azumarill, P.Tentacool], // Water
  S: [P.Yanma, P.Whirlipede, P.Swadloon, P.Durant], // Bug
  T: [P.Plusle, P.Minun, P.Flaaffy, P.Eelektrik], // Electric
  U: [P.Gurdurr, P.Scraggy, P.Hawlucha, P.Heracross], // Fighting
  V: [P.Numel, P.Darumaka, P.Lampent, P.Quilava], // Fire
  W: [P.Natu, P.Skiploom, P.Gligar, P.Taillow], // Flying
  X: [P.Exeggcute, P.Lombre, P.Cacnea, P.Foongus], // Grass
  Y: [P.Raticate, P.Lickitung, P.Persian, P.Furret], // Normal
  Z: [P.Slowpoke, P.Staryu, P.Seaking, P.Mantine], // Water
}

export function updateFriendSafari(safariStr: string, uid: string) {
  const safari = safariStr.split('') // Split into each char
  const set = new Set(safari)
  set.add(uid.substring(0, 1)) // Append first ID of other user
  return [...set].join('') // Update our string and return
}
