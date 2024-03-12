/**
 * @fileoverview Description of this file.
 */

// ---
import { Movepool } from '../functions/lib/shared/src/battle/movepool'
import * as pokemon from '../shared/src/pokemon'
import fetch from 'node-fetch'
import { MoveId } from '../shared/src/gen/type-move-meta'
import { get } from '../shared/src/pokemon'
import { Move } from '../functions/lib/shared/src/battle/types'

const validMoveTutors3: MoveId[] = [
  'Weather Ball', 'Air Cutter', 'Heat Wave', 'Seed Bomb', 'Liquidation',
  'Electroweb', 'Ice Punch', 'Throat Chop', 'Outrage', 'Vacuum Wave',
  'Zen Headbutt', 'Signal Beam', 'Gunk Shot', 'Earth Power', 'Iron Head',
  'Power Gem',
]

const introducedGen6: MoveId[] = [
  "Aromatic Mist", "Baby-Doll Eyes", "Belch", "Boomburst", "Celebrate",
  "Confide", "Crafty Shield", "Dazzling Gleam", "Disarming Voice",
  "Draining Kiss", "Eerie Impulse", "Electric Terrain", "Electrify",
  /*"Fairy Lock",*/ "Fairy Wind", "Fell Stinger", "Flower Shield",
  "Flying Press", "Forest's Curse", "Freeze-Dry", "Geomancy",
  "Grassy Terrain", "Happy Hour", "Hold Back", "Infestation",
  "Ion Deluge", "King's Shield", "Land's Wrath", /*"Magnetic Flux",*/
  "Mat Block", "Misty Terrain", "Moonblast", "Mystical Fire", "Noble Roar",
  "Nuzzle", "Oblivion Wing", "Parabolic Charge", /*"Parting Shot",*/
  "Petal Blizzard", "Phantom Force", "Play Nice", "Play Rough", "Powder",
  "Power-Up Punch", "Rototiller", "Spiky Shield", /*"Sticky Web",*/ "Topsy-Turvy",
  "Trick-or-Treat", "Venom Drench", "Water Shuriken",
]

const hiddenMoves: MoveId[] = [
  'Cut', 'Waterfall', 'Flash', 'Rock Smash', 'Strength', 'Rock Climb', 'Surf',
  'Whirlpool', 'Fly', 'Dig', 'Defog', 'Fire Blast', 'Dive',
]

// Sans Move Tutor 3 moves
const introducedGen7: MoveId[] = [
  'Accelerock', 'Anchor Shot', 'Aurora Veil', 'Baneful Bunker',
  'Beak Blast', 'Brutal Swing', 'Burn Up', 'Clanging Scales',
  'Core Enforcer', 'Darkest Lariat', 'Dragon Hammer', 'Fire Lash',
  'First Impression', 'Fleur Cannon', 'Floral Healing', 'High Horsepower',
  'Ice Hammer', 'Laser Focus', 'Leafage', /*'Liquidation',*/
  'Lunge', 'Moongeist Beam', 'Multi-Attack', "Nature's Madness",
  ('Pollen Puff' as MoveId), 'Power Trip', 'Prismatic Laser', 'Psychic Fangs',
  'Purify', 'Revelation Dance', 'Shadow Bone', 'Shell Trap',
  'Shore Up', 'Smart Strike', 'Solar Blade', 'Sparkling Aria',
  'Spectral Thief', 'Speed Swap', 'Spirit Shackle', 'Spotlight',
  'Stomping Tantrum', 'Strength Sap', 'Sunsteel Strike', 'Tearful Look',
  /*'Throat Chop',*/ 'Toxic Thread', 'Trop Kick', 'Zing Zap',
]

// Moves added to PotW starting with 2.7.x
const potwIntroducedGen7: MoveId[] = [
  'Rage Powder', 'Follow Me', 'Icicle Spear', 'Flame Wheel', 'Withdraw',
  'Cross Chop', 'Low Kick', 'Grass Knot', 'Heat Crash', 'Heavy Slam',
  'Comet Punch', 'Sonic Boom', 'Fury Swipes', 'Mud Shot', 'Scratch',
  'Seismic Toss', 'Spike Cannon', 'Thousand Arrows', 'Thousand Waves',
  'Vise Grip', 'Psybeam', 'Absorb', 'Psybeam', 'Tail Whip', 'Leer',
  'Growl', 'Twister', 'Beat Up', 'Harden', 'Constrict', 'Meditate',
  'Natural Gift', 'Revenge', 'Trick', 'Teeter Dance', 'Retaliate',
  'Payback', 'Assurance', 'Reversal', 'Pay Day', 'Explosion',
  'Bonemerang', 'Jump Kick', 'Water Sport', 'Heart Swap', 'Bind',
  'Psycho Shift', 'Feint', 'Rage',
]

// Sans Move Tutor 6 moves
const introducedGen8: MoveId[] = [
  'Dynamax Cannon', 'Snipe Shot', 'Apple Acid', 'Body Press', 'Bolt Beak',
  'Branch Poke', 'Clangorous Soul', 'Court Change', 'Decorate', 'Dragon Darts',
  'Drum Beating', 'Eternabeam', 'Fishious Rend', 'Grav Apple', 'Jaw Lock',
  'Magic Powder', 'Meteor Assault', 'No Retreat', 'Octolock', 'Overdrive',
  'Pyro Ball', 'Steel Beam', 'Stuff Cheeks', 'Tar Shot', 'Teatime',
  'Shell Side Arm', 'Jungle Healing', 'Wicked Blow', 'Surging Strikes',
  'Thunder Cage', 'Dragon Energy', 'Freezing Glare', 'Fiery Wrath',
  'Thunderous Kick', 'Glacial Lance', 'Astral Barrage', 'Eerie Spell',
  'Snap Trap', 'Aura Wheel', 'Breaking Swipe', 'Spirit Break', 'Strange Steam',
  'Obstruct', 'False Surrender', 'Behemoth Blade', 'Behemoth Bash',
  // PLA
  'Dire Claw', 'Psyshield Bash', 'Wave Crash', 'Headlong Rush',
  'Springtide Storm', 'Bleakwind Storm', 'Wildbolt Storm', 'Sandsear Storm',
  'Victory Dance', 'Chloroblast', 'Mountain Gale', 'Barb Barrage', 'Shelter',
  'Esper Wing', 'Bitter Malice', 'Infernal Parade', 'Mystical Power',
  'Raging Fury', 'Triple Arrows', 'Lunar Blessing', 'Take Heart',
  'Ceaseless Edge', 'Stone Axe',
]

// Moves added to PotW starting with 2.8.x
const potwIntroducedGen8: MoveId[] = [
  'Spikes', 'Toxic Spikes', 'Stealth Rock', 'Sticky Web', 'Whirlwind', 'Roar',
  'Parting Shot', 'Mean Look', 'Block', 'Fairy Lock', 'Teleport', 'Spider Web',
  'U-turn', 'Volt Switch', 'Flip Turn', 'Circle Throw', 'Dragon Tail',
  'Rapid Spin', 'Memento', 'Rolling Kick', 'Super Fang',
  'Stockpile', 'Spit Up', 'Swallow', 'Hold Hands',
  'Disable', 'Mirror Move', 'Thief', 'Lock-On', 'Mind Reader',
  'Encore', 'Nightmare', 'Curse', 'Covet', 'Copycat',
  'Heal Block', 'Sucker Punch', 'Destiny Bond', 'Grudge',
  'Round', 'Ally Switch', 'Psych Up',
]

const var5: MoveId[] = [
  ...introducedGen6,
  ...hiddenMoves,
  ...introducedGen7,
  ...potwIntroducedGen7,
  ...introducedGen8,
  ...potwIntroducedGen8,
]

// Move Tutor 6
const var6: MoveId[] = [
  'Expanding Force', 'Steel Roller', 'Scale Shot', 'Meteor Beam',
  'Misty Explosion', 'Grassy Glide', 'Rising Voltage', 'Terrain Pulse',
  'Skitter Smack', 'Burning Jealousy', 'Lash Out', 'Poltergeist',
  'Corrosive Gas', 'Coaching', 'Triple Axel', 'Dual Wingbeat',
  'Scorching Sands',
  // PLA
  'Power Shift',
  // SV
  // 'Temper Flare', 'Alluring Voice', 'Dragon Cheer', 'Hard Press',
  // 'Supercell Slam', 'Psychic Noise', 'Upper Hand',
]

const introducedGen9: MoveId[] = [
  'Comeuppance', 'Flower Trick', 'Aqua Step', 'Aqua Cutter', 'Axe Kick',
  'Silk Trap', 'Jet Punch', 'Spicy Extract', 'Population Bomb',
  'Ice Spinner', 'Triple Dive', 'Fillet Away', 'Kowtow Cleave',
  'Torch Song', 'Raging Bull', 'Make It Rain', 'Pounce', 'Trailblaze',
  'Chilling Water', 'Hyper Drill', 'Twin Beam', 'Double Shock',
  'Armor Cannon', 'Bitter Blade', 'Ruination', 'Lumina Crash',
  'Blazing Torque', 'Wicked Torque', 'Combat Torque', 'Noxious Torque',
  'Magical Torque', 'Hydro Steam', 'Psyblade', 'Flip Turn',
  'Tidy Up', 'Mortal Spin', 'Snowscape', 'Chilly Reception',
  'Collision Course', 'Electro Drift', 'Order Up', 'Last Respects',
  'Spin Out', 'Salt Cure', 'Glaive Rush', 'Gigaton Hammer', 'Rage Fist',
  // DLC
  'Blood Moon', 'Syrup Bomb', 'Matcha Gotcha', 'Ivy Cudgel',
  // 'Upper Hand',
]

// Moves added to PotW starting with 3.9.x
const potwIntroducedGen9: MoveId[] = []

// ??
const var7: MoveId[] = [
  ...introducedGen8,
  ...potwIntroducedGen8,
  ...introducedGen9,
  ...potwIntroducedGen9,
]

function addMove(move) {
  if (usedMap.has(move)) {
    usedMap.set(move, usedMap.get(move) + 1)
  } else {
    usedMap.set(move, 1)
  }
}

const listOfMoves = Object.values(Movepool).map((x: Move) => x.name)
const usedMap = new Map()
listOfMoves.forEach(m => usedMap.set(m, 0))
Object.values(pokemon.datastore).forEach(pokemon => {
    if (Array.isArray(pokemon.move)) {
        pokemon.move.forEach(move => {
            addMove(move)
        })
    } else {
      addMove(pokemon.move)
    }
    pokemon.moveTMs.forEach(move => {
      addMove(move)
    })
    if (pokemon.novelMoves) {
        pokemon.novelMoves.forEach(moveset => {
            if (moveset) {
                moveset.forEach(move => {
                  addMove(move)
                })
            } else {
                console.log('No moveset for ', pokemon.species)
            }
        })
    }
})

let i = 0
listOfMoves.forEach(move => {
    if (!usedMap.has(move) && !process.argv[2]) {
        console.log(`No Pokémon has ${move}`)
        i++
    }
})
console.log(`${i} / ${listOfMoves.length}`)
console.log()

// Print usage map
usedMap[Symbol.iterator] = function* () {
  yield* [...this.entries()].sort((a, b) => a[1] - b[1]);
}

if (!process.argv[2]) {
  for (let [move, number] of usedMap) {
    console.log(`${move} (${Movepool[move].type})  ${number}`);
  }
}

const filterFn = {
  'spread': (move: Move) => ['Everyone', 'Random Opponent', 'Nearby Opponents', 'All Opponents', 'Single Ally', 'All Allies'].includes(move.aoe),
  'support': (move: Move) => move.power === 0,
  'recover': (move: Move) => move.recovery,
  'physical': (move: Move) => move.attackKey === 'attack' && move.power,
  'special': (move: Move) => move.attackKey === 'spAttack' && move.power,
  'mixed': (move: Move) => move.power,
  'tutor3': (move: Move) => validMoveTutors3.includes(move.name as MoveId),
  'var3': (move: Move) => validMoveTutors3.includes(move.name as MoveId),
  'var4': (move: Move) => ['Everyone', 'Random Opponent', 'Nearby Opponents', 'All Opponents', 'Single Ally', 'All Allies'].includes(move.aoe) || move.recovery,
  'var5': (move: Move) => var5.includes(move.name as MoveId),
  'var6': (move: Move) => var6.includes(move.name as MoveId),
  'var7': (move: Move) => var7.includes(move.name as MoveId),
  'any': () => true,
}

// node unused-moves.js 123 10 spread
//      ^ script name   ^   ^  ^________
//                      pkmn max_count  filter
// Filter: 'spread' | 'support' | 'recover' | 'special' | 'physical' | 'gen67' | 'var4'
if (process.argv[2]) {
  // Fetch related to a single Pokemon
  (async () => {
    const id = process.argv[2]
   // const species = get(`potw-${id}`)!.species
    const max = process.argv[3] === '-' ? 999 : process.argv[3]
    const pageSm = await fetch(`https://serebii.net/pokedex-sm/${id}.shtml`, {})
    const htmlSm: string = await pageSm.text()
    const pageSwSh = await fetch(`https://serebii.net/pokedex-swsh/${id}.shtml`, {}) // Redirects to canon page
    const htmlSwSh: string = await pageSwSh.text()
    const pageSv = await fetch(`https://serebii.net/pokedex-sv/${id}.shtml`, {}) // Redirects to canon page
    const htmlSv: string = await pageSv.text()
    const html = htmlSm + htmlSwSh + htmlSv
    // console.log(species)
    // console.log(`https://serebii.net/pokedex-swsh/${species}.shtml`)
    const moveCols = html.match(/<td rowspan="2" class="fooinfo"><a href="[\w\s-/.]+">[\w\s-]+<\/a>/g)
    // console.log(moveCols)
    const canonMoves = moveCols?.map(m => m.replace(/<td rowspan="2" class="fooinfo"><a href="[\w\s-/.]+">([\w\s-]+)(<br \/>)?<\/a>/, '$1'))
      .filter(m => !m.startsWith('TM') && !m.startsWith('TR'))
    // console.log(canonMoves)
    if (!canonMoves) throw new Error('Cannot get any moves for id')
    const filters = process.argv[4].split(',')
    for (let [move, number] of usedMap) {
      if (!Movepool[move] || move.startsWith('Max ') || Movepool[move].hide || Movepool[move].isZMove) {
        // console.error('Move bad', move)
        continue
      }
      // Additional filtering here
      filters.forEach(f => {
        if (filterFn[f](Movepool[move])) {
          if (number < max) {
            if (canonMoves.includes(move)) {
              console.log(move, `(${number})`)
            }
          }
        }
      })
    }
  })()
}
