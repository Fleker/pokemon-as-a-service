/**
 * @fileoverview Available quiz questions for players
 */
export interface RadioQuestion {
  id: string
  question: string
  options: string[]
  answer: string
}

export interface RadioFirestoreDoc {
  correct: number
  wrong: number
}

export const Questions: RadioQuestion[] = [{
  // Legacy questions
  id: '0T9582zU8kNpMjDqPWwa',
  options: ['Attack', 'Defense', 'Speed'],
  answer: 'Speed',
  question: 'The move Bulldoze decreases which stat of the target?',
}, {
  id: '6qHSIsM08xuzfOaaPAN7',
  options: ['Marill', 'Raichu', 'Gorochu'],
  question: 'Which Pokemon does Pikachu evolve into?',
  answer: 'Raichu'
}, {
  id: '85CM9XXxXTVVAS4O36G4',
  question: 'When catching this Pokemon in the wild, which one may sometimes be holding a Magnet?',
  options: ['Pikachu', 'Steelix', 'Magneton'],
  answer: 'Magneton'
}, {
  id: 'A4oVgCJSUqPR7ggIITWb',
  options: ['Quebec', 'Dubai', 'Mountain View'],
  answer: 'Dubai',
  question: 'In which location may there be a sandstorm?'
}, {
  id: 'ARgru71tU3CxzegkHJWC',
  options: ['Magmar', 'Togepi', 'Pichu'],
  question: 'What Pokemon does not hatch from an egg?',
  answer: 'Magmar',
}, {
  id: 'Bl6j6nTuG18pg1F0CAIy',
  answer: 'Flamethrower',
  question: 'What move can Celebi NOT use?',
  options: ['Psychic', 'Flamethrower', 'Energy Ball'],
}, {
  id: 'CZbFJRAo51Diac2UM0Lw',
  options: ['Sun Stone', 'Fire Stone', 'Leaf Stone'],
  answer: 'Fire Stone',
    question: 'Which stone has no effect on a Gloom?'
}, {
  id: 'DNxKePLkuWBhzbqVC2WG',
  question: 'How often does it snow in Rio de Janeiro in the winter?',
  options: ['2.5%', '1%', 'Never'],
  answer: 'Never'
}, {
  id: 'EMRbhFsqYg3W1JmUZrZO',
  question: 'How many legs does a Hoothoot have?',
  answer: 'Two',
  options: ['One', 'Two', 'Zero']
}, {
  id: 'FzEDGy75o4ESSPjKoktZ',
  question: 'The move Tri-Attack has a chance to Poison the target?',
  options: ['True', 'False'],
  answer: 'False'
}, {
  id: 'GMIKTynS2mSmlYEyxLhx',
  options: ['True', 'False'],
  question: 'Onix can learn String Shot',
  answer: 'False'
}, {
  id: 'GSONVkuo3ucYB9TMwUun',
  question: 'A Pokemon can use the move Hyper Beam twice in a row without recharging?',
  options: ['True', 'False'],
  answer: 'False'
}, {
  id: 'MydIrPaApyNIieNSfvoA',
  question: 'Which move may Articuno have?',
  options: ['Shadow Ball', 'Steel Wing', 'Thunder Wave'],
  answer: 'Steel Wing',
}, {
  id: 'NJKTJTTyDBHEDyfev0Kr',
  answer: 'Caterpie',
  options: ['Caterpie', 'Dragonair', 'Pidgey'],
  question: 'Which of these Pokemon evolves the soonest?',
}, {
  id: 'PFzOridlJjvoCHnkunas',
  options: ['Trade a Slowpoke with a Kings Rock', 'Trade a Slowbro with a Kings Rock', 'Use a Moon Stone on a Slowpoke', 'Trade a Slowpoke for a Shellder'],
  answer: 'Trade a Slowpoke with a Kings Rock',
  question: 'What is the method to get a Slowking?',
}, {
  id: 'PwrDNzYrN4fpJngtxd3J',
  options: ['Poison Barb', 'Nugget', 'Black Sludge'],
  answer: 'Nugget',
  question: 'When catching Muk in the wild, which item may it sometimes be holding?'
}, {
  id: 'SsIpoNw7FUWDbxuqRMjL',
  options: ['Steelix', 'Snorlax', 'Caterpie', 'Tyranitar'],
  question: 'Which of these Pokemon is tallest?',
  answer: 'Steelix'
}, {
  id: 'U07RwNN6M4q5gKudSZEt',
  answer: 'Machamp',
  options: ['Magikarp', 'Koffing', 'Machamp'],
  question: 'Which of these Pokemon knows the move Strength?'
}, {
  id: 'VvZFEbXlOMOv5Hu8epkt',
  question: 'What makes it easier to catch Pokemon that have a high speed?',
  options: ['Sticky goo', 'Fastball', 'Escape rope'],
  answer: 'Fastball'
}, {
  id: 'Wpawe7BN26tounRWGLU4',
  options: ['Twisted Spoon', 'Bent Spoon', 'Misaligned Fork'],
  answer: 'Twisted Spoon',
  question: 'Which item boosts the power of Psychic-type moves?'
}, {
  id: 'ZTyPnZDrN78hDoUrkgSB',
  answer: 'Qwilfish',
  question: 'Which of these Pokemon CANNOT learn Hyper Beam?',
  options: ['Larvitar', 'Qwilfish', 'Beedrill']
}, {
  id: 'aKMxUDRbpNpxQd1e3lvm',
  question: 'How many times can a Technical Record (TR) be used?',
  options: ['Once', 'Twice', 'Unlimited'],
  answer: 'Once',
}, {
  id: 'dyJUfar2RInaQj7G2iT8',
  options: ['The first day of the month', 'Never', 'Fridays'],
  question: 'When can you catch a Lapras with a Greatball?',
  answer: 'Fridays'
}, {
  id: 'k9ljaRdehirbQvfSeuqo',
  options: ['101.5', '10.5', '251'],
  answer: '10.5',
  question: `What is this radio station's frequency?`
}, {
  id: 'nF1c31Rx8Q1Kc9KraYZx',
  answer: 'No',
  options: ['Yes', 'No'],
  question: 'Is the haircut shop open on Mondays?'
}, {
  id: 'qdxyPd3S8zuvz3NlaPxr',
  answer: '3 Moves',
  options: ['1 Move', '2 Moves', '3 Moves', '4 Moves'],
  question: 'How many moves can a 5-star raid boss use each turn?'
}, {
  id: 'qx9skUnq70k6Gr3oJGrq',
  answer: 'Octazooka',
  options: ['Octazooka', 'Water Pistol', 'Water Pulse'],
  question: 'What is the signature move of Octillery?'
}, {
  id: 'rjV9ZjTnKr87wJwZaVIh',
  question: 'What type of moves does the item Hard Stone boost?',
  options: ['Ground', 'Dragon', 'Rock'],
  answer: 'Rock'
}, {
  id: 'rwEIGGphMvcVQgRQG52R',
  answer: 'No',
  options: ['Yes', 'No'],
  question: 'Is Earthquake super-effective on Zapdos?'
}, {
  id: 'xU9sR3IbuQehvUyzWEdr',
  answer: 'True',
  options: ['True', 'False'],
  question: 'The move Thunder can potentially paralyze the target?',
}, {
  id: 'yfb6D1sOoFQIkkbosLgu',
  answer: 'Suicune',
  options: ['Entei', 'Raikou', 'Suicune'],
  question: 'Which Pokemon is said to be a reincarnation of the north winds?'
}, {
  id: 'zS0SSQXqLmeR1hnaS8WN',
  answer: 'Head Smash',
  options: ['Giga Impact', 'Head Smash', 'Flash Cannon'],
  question: 'Which move will do recoil damage to the user?',
}, {
  // Gen 3 Questions
  id: 'gen3.regice',
  question: 'How cold is the air around Regice?',
  options: ['-328F', '-328C', '0K'],
  answer: '-328F'
}, {
  id: 'gen3.regirock',
  question: 'Which of these is the highest stat of Regirock?',
  options: ['Attack', 'Defense', 'Special Attack'],
  answer: 'Defense'
}, {
  id: 'gen3.registeel',
  question: 'What does Registeel eat?',
  options: ['Cooled magma', 'Nobody knows', 'Iron ore deep in mountains'],
  answer: 'Nobody knows'
}, {
  id: 'gen3.jirachi',
  question: 'How often does Jirachi awaken?',
  options: ['Every thousand years', 'Every hundred years', 'Every shooting star'],
  answer: 'Every thousand years',
}, {
  id: 'gen4.froslass',
  question: 'What causes Snorunt to evolve into Froslass?',
  options: ['Dusk Stone', 'Ice Stone', 'Dawn Stone'],
  answer: 'Dawn Stone'
}, {
  id: 'gen4.platinumcup',
  question: 'Which of these Pokémon is ineligible for Platinum Cup?',
  options: ['Staraptor', 'Muk', 'Snorlax'],
  answer: 'Muk'
}, {
  id: 'gen4.berry',
  question: 'The Colbur berry reduces damage when hit by what type move?',
  options: ['Rock', 'Grass', 'Dark'],
  answer: 'Dark'
}, {
  id: 'gen4.berry2',
  question: 'The Salac berry boosts which stat in a pinch?',
  options: ['Attack', 'Special Defense', 'Speed'],
  answer: 'Speed'
}, {
  id: 'gen4.toxic',
  question: 'The Toxic Orb will poison whoever holds it, even if they are a Poison-type.',
  options: ['True', 'False'],
  answer: 'False'
}, {
  id: 'gen4.gateau',
  question: 'The Old Gateau will treat any status condition when eaten, just like what other item?',
  options: ['Pewter Crunchies', 'Oran Berry', 'Shell Bell'],
  answer: 'Pewter Crunchies',
}, {
  id: 'gen5.philosophy',
  question: 'What is the best way to live in the world?',
  options: ['Pursuit of ideals', 'Pursuit of truth'],
  answer: 'Neither', // NEED TO HANDLE
}, {
  id: 'gen6.megaflygon',
  question: 'True or false: Flygon has a mega evolution.',
  options: ['True', 'False'],
  answer: 'False', // :(
}, {
  id: 'gen5.genesect',
  question: 'What type is the move Techno Blast?',
  options: ['Steel', 'Bug', 'It depends'],
  answer: 'It depends',
}, {
  id: 'gen6.hawlucha',
  question: 'What type is the move Flying Press?',
  options: ['Fighting', 'Flying', 'Both'],
  answer: 'Both',
}, {
  id: 'gen7.lycanroc',
  question: 'Which is not a form of Lycanroc?',
  options: ['Midday', 'Dusk', 'Midnight', 'Dawn'],
  answer: 'Dawn',
}, {
  id: 'gen7.kartana',
  question: 'The Pokémon known as Kartana is known as what?',
  options: ['Mythical', 'Legendary', 'Ultra Beast'],
  answer: 'Ultra Beast',
}, {
  id: 'gen7.komala',
  question: 'What status condition does Komala exhibit?',
  options: ['Sleep', 'Paralysis', 'Burn'],
  answer: 'Sleep',
}, {
  id: 'gen7.sunflute',
  question: 'When you play the Sun Flute, what does Cosmomen evolve into?',
  options: ['Solgaleo', 'Lunala', 'Necrozma'],
  answer: 'Solgaleo',
}, {
  id: 'gen7.nature',
  question: 'What is a nature your Pokémon might have?',
  options: ['Mopey', 'Adamant', 'Envigorated'],
  answer: 'Adamant',
}, {
  id: 'gen7.grassy',
  question: 'True or false: Damage from Earthquake is dampened on Grassy Terrain?',
  options: ['True', 'False'],
  answer: 'True',
}, {
  id: 'gen7.electric',
  question: 'True or false: Pokémon can fall asleep on Electric Terrain?',
  options: ['True', 'False'],
  answer: 'False',
}, {
  id: 'gen7.aether',
  question: 'What is the name of the shop that sells Beast Balls?',
  options: ['Skull Island', 'Aether Foundation', 'Silph Corp'],
  answer: 'Aether Foundation',
}, {
  id: 'gen7.weight',
  question: 'What metric is used to calculate damage for Grass Knot?',
  options: ['Weight', 'Speed', 'Dex number'],
  answer: 'Weight',
}, {
  id: 'gen7.meanlook',
  question: 'Which move will keep a Pokémon trapped in battle?',
  options: ['Volt Switch', 'Stealth Rock', 'Mean Look', 'Pursuit'],
  answer: 'Mean Look',
}, {
  id: 'gen7.mint',
  question: 'What item should you use to give your Pikachu a Bold nature?',
  options: ['Carbos', 'Bold Mint', 'Bold Protein Shake', 'Tomato Berry'],
  answer: 'Bold Mint',
}, {
  id: 'gen7.souvenir',
  question: 'Which of these items is not a souvenir that Pokémon may hold?',
  options: ['Pink Nectar', 'Wisp', 'Red Shard'],
  answer: 'Red Shard',
}, {
  id: 'gen7.meltan',
  question: 'How do you evolve Meltan?',
  options: ['Use 400 Meltan Candies', 'Use a Meltan Candy', 'Use a Rare Candy'],
  answer: 'Use 400 Meltan Candies',
}, {
  id: 'gen7.oricorio',
  question: 'Which is not a form of Oricorio?',
  options: ['Baile', 'Tap', 'Sensu', 'Pom-Pom', ],
  answer: 'Tap',
}]
