import { ensurePkmnBuilder } from './types'

export const hisuiBuilder = {
  'potw-058-hisuian': ensurePkmnBuilder({
    species: 'Growlithe', type1: 'Fire', type2: 'Rock', 
    tiers: ['Arceus Cup', 'Treasure Cup'], shiny: 'WILD',
    weight: 22.7,
    eggBase: 'potw-058-hisuian', eggGroup: ['Field'], eggCycles: 20,
    evolveTo: ['potw-059-hisuian'],
    pokedex: `They patrol their territory in pairs. I believe the igneous rock components in the fur of this species are the result of volcanic activity in its habitat.`,
    hp: 60, attack: 75, defense: 45, spAttack: 65, spDefense: 50, speed: 55,
    move: ['Fire Fang', 'Rock Slide'],
    moveTMs: [
      'Snore', 'Double-Edge', 'Dig', 'Bide', 'Fire Blast', 
      'Iron Tail', 'Dragon Breath', 'Swift', 'Overheat', 'Facade', 
      'Aerial Ace', 'Close Combat', 'Play Rough', 'Burn Up', 'Dragon Rage', 
      'Flame Wheel', 'Secret Power', 'Fire Spin', 'Strength', 'Rock Smash', 
      'Protect', 'Swagger', 'Mimic', 'Will-O-Wisp', 'Agility', 
      'Captivate', 'Sunny Day', 'Reflect', 'Safeguard', 'Attract', 
      'Substitute', 'Endure', 'Confide', 'Odor Sleuth', 'Double Team', 
    ],
    novelMoves: [[],
      ['Crunch', 'Howl'],
      ['Return', 'Stealth Rock'],
      ['Outrage', 'Will-O-Wisp'],
      ['Snarl', 'Morning Sun'],
    ],
  }),
  'potw-059-hisuian': ensurePkmnBuilder({
    species: 'Arcanine', type1: 'Fire', type2: 'Rock', 
    tiers: ['Traditional', 'Arceus Cup', 'Treasure Cup'], shiny: 'WILD',
    weight: 168, release: 'greatball',
    eggBase: 'potw-058-hisuian', eggGroup: ['Field'], eggCycles: 20,
    pokedex: `Snaps at its foes with fangs cloaked in blazing flame. Despite its bulk, it deftly feints every which way, leading opponents on a deceptively merry chase as it all but dances around them.`,
    hp: 95, attack: 115, defense: 80, spAttack: 95, spDefense: 80, speed: 90,
    move: ['Raging Fury', 'Rock Slide'],
    moveTMs: [
      'Hyper Beam', 'Solar Beam', 'Snore', 'Double-Edge', 'Dig', 
      'Bide', 'Fire Blast', 'Iron Tail', 'Dragon Breath', 'Swift', 
      'Overheat', 'Facade', 'Aerial Ace', 'Close Combat', 'Bulldoze', 
      'Play Rough', 'Giga Impact', 'Burn Up', 'Dragon Pulse', 'Dragon Rage', 
      'Flame Wheel', 'Secret Power', 'Superpower', 'Fire Spin', 'Strength', 
      'Rock Smash', 'Protect', 'Swagger', 'Mimic', 'Will-O-Wisp', 
      'Agility', 'Captivate', 'Sunny Day', 'Reflect', 'Safeguard', 
      'Attract', 'Substitute', 'Endure', 'Confide', 'Odor Sleuth', 
      'Laser Focus', 'Double Team', 
    ],
    novelMoves: [[],
      ['Reversal', 'Howl'],
      ['Extreme Speed', 'Stealth Rock'],
      ['Outrage', 'Will-O-Wisp'],
      ['Snarl', 'Heat Wave', 'Morning Sun'],
    ],
  }),
  'potw-100-hisuian': ensurePkmnBuilder({
    species: 'Voltorb', type1: 'Electric', type2: 'Grass', 
    tiers: ['Arceus Cup', 'Treasure Cup'], shiny: 'WILD',
    weight: 13, evolveTo: ['potw-101-hisuian'],
    eggBase: 'potw-100-hisuian', eggGroup: ['Mineral'], eggCycles: 20,
    pokedex: `An enigmatic Pokémon that happens to bear a resemblance to a Poké Ball. When excited, it discharges the electric current it has stored in its belly, then lets out a great, uproarious laugh.`,
    hp: 40, attack: 30, defense: 50, spAttack: 55, spDefense: 55, speed: 100,
    move: ['Spark', 'Energy Ball'],
    moveTMs: [
      'Snore', 'Bide', 'Thunderbolt', 'Zap Cannon', 'Rollout', 
      'Swift', 'Shock Wave', 'Facade', 'Charge Beam', 'Spark', 
      'Secret Power', 'Protect', 'Swagger', 'Mimic', 'Self-Destruct', 
      'Thunder Wave', 'Screech', 'Rain Dance', 'Reflect', 'Light Screen', 
      'Substitute', 'Endure', 'Confide', 'Flash', 'Taunt', 
      'Double Team', 
    ],
    novelMoves: [[],
      ['Ice Ball', 'Thunder Wave'],
      ['Gyro Ball', 'Grassy Terrain'],
      ['Electroweb', 'Signal Beam', 'Stun Spore'],
      ['Discharge', 'Round', 'Recycle'],
    ],
  }),
  'potw-101-hisuian': ensurePkmnBuilder({
    species: 'Electrode', type1: 'Electric', type2: 'Grass', 
    tiers: ['Traditional', 'Arceus Cup', 'Treasure Cup'], shiny: 'WILD', release: 'greatball',
    weight: 71,
    eggBase: 'potw-100-hisuian', eggGroup: ['Mineral'], eggCycles: 20,
    pokedex: `The tissue on the surface of its body is curiously similar in composition to an Apricorn. When irritated, this Pokémon lets loose an electric current equal to 20 lightning bolts.`,
    hp: 60, attack: 50, defense: 70, spAttack: 80, spDefense: 80, speed: 150,
    move: ['Thunderbolt', 'Chloroblast'],
    moveTMs: [
      'Hyper Beam', 'Snore', 'Bide', 'Thunderbolt', 'Zap Cannon', 
      'Rollout', 'Swift', 'Shock Wave', 'Facade', 'Charge Beam', 
      'Spark', 'Giga Impact', 'Secret Power', 'Protect', 'Swagger', 
      'Mimic', 'Self-Destruct', 'Thunder Wave', 'Screech', 'Rain Dance', 
      'Reflect', 'Light Screen', 'Substitute', 'Telekinesis', 'Endure', 
      'Confide', 'Flash', 'Taunt', 'Double Team', 
    ],
    novelMoves: [[],
      ['Ice Ball', 'Thunder Wave'],
      ['Gyro Ball', 'Grassy Terrain'],
      ['Electroweb', 'Signal Beam', 'Stun Spore'],
      ['Discharge', 'Explosion', 'Recycle'],
    ],
  }),
  'potw-157-hisuian': ensurePkmnBuilder({
    species: 'Typhlosion', type1: 'Fire', type2: 'Ghost', 
    tiers: ['Traditional', 'Arceus Cup', 'Treasure Cup'], shiny: 'WILD',
    weight: 69.8, release: 'ultraball',
    eggBase: 'potw-155', eggGroup: ['Field'], eggCycles: 20,
    pokedex: `Said to purify lost, forsaken souls with its flames and guide them to the afterlife. I believe its form has been influenced by the energy of the sacred mountain towering at Hisui’s center.`,
    hp: 73, attack: 84, defense: 78, spAttack: 119, spDefense: 85, speed: 95,
    move: ['Flamethrower', 'Infernal Parade'],
    moveTMs: [
      'Hyper Beam', 'Solar Beam', 'Thunder Punch', 'Fire Punch', 'Snore', 
      'Double-Edge', 'Dig', 'Fire Blast', 'Earthquake', 'Fury Cutter', 
      'Rollout', 'Dynamic Punch', 'Iron Tail', 'Swift', 'Rock Tomb', 
      'Focus Punch', 'Overheat', 'Facade', 'Aerial Ace', 'Extrasensory', 
      'Rock Slide', 'Shadow Claw', 'Bulldoze', 'Giga Impact', 'Burn Up', 
      'Flame Wheel', 'Nature Power', 'Secret Power', 'Cut', 'Strength', 
      'Rock Smash', 'Protect', 'Swagger', 'Defense Curl', 'Mimic', 
      'Will-O-Wisp', 'Blast Burn', 'Captivate', 'Sunny Day', 'Quick Attack', 
      'Attract', 'Substitute', 'Work Up', 'Endure', 'Confide', 
      'Laser Focus', 'Double Team', 
    ],
    novelMoves: [[],
      ['Rollout', 'Calm Mind'],
      ['Blast Burn', 'Extrasensory', 'Will-O-Wisp'],
      ['Fire Pledge', 'Throat Chop', 'Captivate'],
      ['Eruption', 'Swift', 'Double Team'],
    ],
  }),
  'potw-211-hisuian': ensurePkmnBuilder({
    species: 'Qwilfish', type1: 'Dark', type2: 'Poison', 
    tiers: ['Arceus Cup', 'Treasure Cup'], shiny: 'WILD',
    weight: 3.9,
    eggBase: 'potw-211-hisuian', eggGroup: ['Water 2'], eggCycles: 20,
    evolveTo: ['potw-904'],
    pokedex: `Fishers detest this troublesome Pokémon because it sprays poison from its spines, getting it everywhere. A different form of Qwilfish lives in other regions.`,
    hp: 65, attack: 95, defense: 85, spAttack: 55, spDefense: 55, speed: 85,
    move: ['Dark Pulse', 'Poison Jab'],
    moveTMs: [
      'Snore', 'Dive', 'Bubble Beam', 'Rollout', 'Shadow Ball', 
      'Icy Wind', 'Swift', 'Shock Wave', 'Facade', 'Water Pulse', 
      'Brine', 'Sludge Wave', 'Liquidation', 'Payback', 'Secret Power', 
      'Surf', 'Whirlpool', 'Waterfall', 'Protect', 'Swagger', 
      'Defense Curl', 'Mimic', 'Thunder Wave', 'Swords Dance', 'Captivate', 
      'Hail', 'Rain Dance', 'Haze', 'Attract', 'Substitute', 
      'Endure', 'Confide', 'Taunt', 'Double Team', 
    ],
    novelMoves: [[],
      ['Aqua Tail', 'Spikes'],
      ['Ice Ball', 'Minimize'],
      ['Throat Chop', 'Gunk Shot', 'Acupressure'],
      ['Sludge Wave', 'Surf', 'Haze'],
    ],
  }),
  'potw-215-hisuian': ensurePkmnBuilder({
    species: 'Sneasel', type1: 'Fighting', type2: 'Poison', 
    tiers: ['Arceus Cup', 'Treasure Cup'], shiny: 'WILD',
    weight: 27, evolveTo: ['potw-903'],
    eggBase: 'potw-215-hisuian', eggGroup: ['Field'], eggCycles: 20,
    pokedex: `Its sturdy, curved claws are ideal for traversing precipitous cliffs. From the tips of these claws drips a venom that infiltrates the nerves of any prey caught in Sneasel’s grasp.`,
    hp: 55, attack: 95, defense: 55, spAttack: 35, spDefense: 75, speed: 115,
    move: ['Rock Smash', 'Poison Jab'],
    moveTMs: [
      'Ice Punch', 'Dream Eater', 'Snore', 'Dig', 'Fury Cutter', 
      'Shadow Ball', 'Dynamic Punch', 'Iron Tail', 'Icy Wind', 'Swift', 
      'Focus Punch', 'Facade', 'Aerial Ace', 'Shadow Claw', 'Ice Shard', 
      'Double Hit', 'Beat Up', 'Payback', 'Secret Power', 'Surf', 
      'Cut', 'Strength', 'Rock Smash', 'Whirlpool', 'Dark Pulse', 
      'Protect', 'Swagger', 'Defense Curl', 'Mimic', 'Calm Mind', 
      'Swords Dance', 'Agility', 'Screech', 'Captivate', 'Hail', 
      'Sunny Day', 'Rain Dance', 'Reflect', 'Quick Attack', 'Embargo', 
      'Fake Out', 'Attract', 'Knock Off', 'Substitute', 'Hone Claws', 
      'Endure', 'Confide', 'Taunt', 'Laser Focus', 'Double Team', 
    ],
    novelMoves: [[],
      ['Quick Attack', 'Swords Dance'],
      ['Shadow Claw', 'Focus Energy'],
      ['Vacuum Wave', 'Gunk Shot', 'Hone Claws'],
      ['Rock Slide', 'Coaching'],
    ],
  }),
  'potw-503-hisuian': ensurePkmnBuilder({
    species: 'Samurott', type1: 'Water', type2: 'Dark', 
    tiers: ['Traditional', 'Arceus Cup'], shiny: 'WILD',
    weight: 58.2, release: 'ultraball',
    eggBase: 'potw-501', eggGroup: ['Field'], eggCycles: 20,
    pokedex: `Hard of heart and deft of blade, this rare form of Samurott is a product of the Pokémon’s evolution in the region of Hisui. Its turbulent blows crash into foes like ceaseless pounding waves.    `,
    hp: 90, attack: 108, defense: 80, spAttack: 100, spDefense: 65, speed: 85,
    move: ['Aqua Tail', 'Ceaseless Edge'],
    moveTMs: [
      'Hyper Beam', 'Snore', 'Dive', 'Dig', 'Fury Cutter', 
      'Iron Tail', 'Icy Wind', 'Facade', 'Aerial Ace', 'Water Pulse', 
      'Brine', 'Giga Impact', 'Liquidation', 'Razor Shell', 'Secret Power', 
      'Superpower', 'Surf', 'Cut', 'Strength', 'Rock Smash', 
      'Waterfall', 'Protect', 'Swagger', 'Hydro Cannon', 'Swords Dance', 
      'Screech', 'Hail', 'Rain Dance', 'Attract', 'Knock Off', 
      'Substitute', 'Work Up', 'Confide', 'Taunt', 'Double Team', 
    ],
    novelMoves: [[],
      ['Ice Beam', 'Focus Energy'],
      ['Megahorn', 'Swords Dance'],
      ['Hydro Cannon', 'Air Slash', 'Screech'],
      ['Surf', 'Hidden Power_Ground', 'Taunt'],
    ],
  }),
  'potw-549-hisuian': ensurePkmnBuilder({
    species: 'Lilligant', type1: 'Grass', type2: 'Fighting', 
    tiers: ['Traditional', 'Arceus Cup'], shiny: 'WILD',
    weight: 19.2, release: 'greatball',
    eggBase: 'potw-548', eggGroup: ['Grass'], eggCycles: 20,
    pokedex: `I suspect that its well-developed legs are the result of a life spent on mountains covered in deep snow. The scent it exudes from its flower crown heartens those in proximity.`,
    hp: 70, attack: 105, defense: 75, spAttack: 50, spDefense: 75, speed: 105,
    move: ['Leaf Blade', 'Close Combat'],
    moveTMs: [
      'Hyper Beam', 'Solar Beam', 'Dream Eater', 'Snore', 'Bide', 
      'Mega Drain', 'Facade', 'Leaf Storm', 'Petal Blizzard', 'Giga Impact', 
      'Nature Power', 'Secret Power', 'Cut', 'Protect', 'Swagger', 
      'Swords Dance', 'Sunny Day', 'Light Screen', 'Safeguard', 'Ingrain', 
      'Charm', 'Attract', 'Substitute', 'Leech Seed', 'Endure', 
      'Confide', 'Flash', 'Sweet Scent', 'Grass Whistle', 'Laser Focus', 
      'Double Team', 
    ],
    novelMoves: [[],
      ['Drain Punch', 'Aerial Ace', 'Victory Dance'],
      ['Axe Kick', 'Poison Jab', 'Sleep Powder'],
      ['Vacuum Wave', 'Acrobatics', 'Sunny Day'],
      ['Petal Blizzard', 'Metronome', 'Aromatherapy'],
    ],
  }),
  'potw-550-white_stripe': ensurePkmnBuilder({
    species: 'Basculin', type1: 'Water',
    tiers: ['Arceus Cup', 'Treasure Cup'], gender: ['male', 'female'],
    shiny: 'WILD', weight: 18,
    evolveTo: ['potw-902'],
    eggBase: 'potw-550', eggGroup: ['Water 2'], eggCycles: 40,
    pokedex: `Though it differs from other Basculin in several respects, including demeanor—this one is gentle—I have categorized it as a regional form given the vast array of shared qualities.`,
    hp: 70, attack: 92, defense: 65, spAttack: 80, spDefense: 55, speed: 98,
    move: ['Double-Edge'],
    moveTMs: [
      'Snore', 'Double-Edge', 'Dive', 'Bubble Beam', 'Icy Wind', 
      'Swift', 'Facade', 'Brine', 'Chip Away', 'Head Smash', 
      'Liquidation', 'Mud Shot', 'Secret Power', 'Superpower', 'Surf', 
      'Cut', 'Whirlpool', 'Waterfall', 'Protect', 'Swagger', 
      'Agility', 'Hail', 'Rain Dance', 'Endeavor', 'Attract', 
      'Substitute', 'Soak', 'Confide', 'Taunt', 'Double Team', 
    ],
    novelMoves: [[],
      ['Wave Crash', 'Scary Face'],
      ['Assurance', 'Taunt'],
      ['Liquidation', 'Head Smash', 'Rain Dance'],
      ['Uproar', 'Muddy Water', 'Tail Whip'],
    ],
  }),
  'potw-570-hisuian': ensurePkmnBuilder({
    species: 'Zorua', type1: 'Normal', type2: 'Ghost', 
    tiers: ['Arceus Cup', 'Treasure Cup'], shiny: 'WILD',
    weight: 12.5, levelAt: 30, levelTo: 'potw-571-hisuian',
    eggBase: 'potw-570-hisuian', eggGroup: ['Field'], eggCycles: 25,
    pokedex: `A once-departed soul, returned to life in Hisui. Derives power from resentment, which rises as energy atop its head and takes on the forms of foes. In this way, Zorua vents lingering malice.`,
    hp: 35, attack: 60, defense: 40, spAttack: 85, spDefense: 40, speed: 70,
    move: ['Swift', 'Bitter Malice'],
    moveTMs: [
      'Snore', 'Dig', 'Shadow Ball', 'Facade', 'Aerial Ace', 
      'Extrasensory', 'Hyper Voice', 'Payback', 'Secret Power', 'Cut', 
      'Dark Pulse', 'Protect', 'Swagger', 'Calm Mind', 'Swords Dance', 
      'Nasty Plot', 'Agility', 'Captivate', 'Sunny Day', 'Rain Dance', 
      'Embargo', 'Attract', 'Knock Off', 'Substitute', 'Hone Claws', 
      'Imprison', 'Confide', 'Taunt', 'Fake Tears', 'Double Team', 
    ],
    novelMoves: [[],
      ['Snarl', 'Nasty Plot'],
      ['Shadow Sneak', 'Foul Play', 'Curse'],
      ['Throat Chop', 'Happy Hour'],
      ['Uproar', 'Icy Wind', 'Pain Split'],
    ],
  }),
  'potw-571-hisuian': ensurePkmnBuilder({
    species: 'Zoroark', type1: 'Normal', type2: 'Ghost', 
    tiers: ['Traditional', 'Arceus Cup', 'Treasure Cup'], shiny: 'WILD',
    weight: 73, release: 'greatball',
    eggBase: 'potw-570-hisuian', eggGroup: ['Field'], eggCycles: 25,
    pokedex: `With its disheveled white fur, it looks like an embodiment of death. Heedless of its own safety, Zoroark attacks its nemeses with a bitter energy so intense, it lacerates Zoroark’s own body.`,
    hp: 55, attack: 100, defense: 60, spAttack: 125, spDefense: 60, speed: 110,
    move: ['Swift', 'Bitter Malice'],
    moveTMs: [
      'Hyper Beam', 'Snore', 'Dig', 'Shadow Ball', 'Facade', 
      'Aerial Ace', 'Extrasensory', 'Shadow Claw', 'Hyper Voice', 'Giga Impact', 
      'Payback', 'Secret Power', 'Cut', 'Rock Smash', 'Dark Pulse', 
      'Protect', 'Swagger', 'Calm Mind', 'Swords Dance', 'Nasty Plot', 
      'Agility', 'Captivate', 'Sunny Day', 'Rain Dance', 'Embargo', 
      'Attract', 'Knock Off', 'Substitute', 'Hone Claws', 'Imprison', 
      'Confide', 'Taunt', 'Fake Tears', 'Laser Focus', 'Double Team', 
    ],
    novelMoves: [[],
      ['Extrasensory', 'Nasty Plot'],
      ['Dark Pulse', 'Curse'],
      ['Throat Chop', 'Snowscape'],
      ['Hyper Voice', 'Icy Wind', 'Pain Split'],
    ],
  }),
  'potw-628-hisuian': ensurePkmnBuilder({
    species: 'Braviary', type1: 'Psychic', type2: 'Flying', 
    tiers: ['Traditional', 'Arceus Cup', 'Treasure Cup'], shiny: 'WILD',
    weight: 43.4, release: 'greatball',
    eggBase: 'potw-627', eggGroup: ['Flying'], eggCycles: 20,
    pokedex: `Screaming a bloodcurdling battle cry, this huge and ferocious bird Pokémon goes out on the hunt. It blasts lakes with shock waves, then scoops up any prey that float to the water’s surface.`,
    hp: 110, attack: 83, defense: 70, spAttack: 112, spDefense: 70, speed: 65,
    move: ['Esper Wing', 'Hurricane'],
    moveTMs: [
      'Hyper Beam', 'Snore', 'Steel Wing', 'Rock Tomb', 'Facade', 
      'Aerial Ace', 'Rock Slide', 'Shadow Claw', 'Sky Drop', 'Giga Impact', 
      'Fly', 'Secret Power', 'Superpower', 'Cut', 'Strength', 
      'Rock Smash', 'Protect', 'Swagger', 'Bulk Up', 'Defog', 
      'Sunny Day', 'Rain Dance', 'Tailwind', 'Attract', 'Substitute', 
      'Hone Claws', 'Work Up', 'Confide', 'Roost', 'Laser Focus', 
      'Double Team', 
    ],
    novelMoves: [[],
      ['Air Slash', 'Twister', 'Roost'],
      ['Snarl', 'Psychic Terrain'],
      ['Vacuum Wave', 'Rain Dance'],
      ['Psychic Noise', 'Heat Wave', 'Roost'],
    ],
  }),
  'potw-705-hisuian': ensurePkmnBuilder({
    species: 'Sliggoo', type1: 'Steel', type2: 'Dragon', 
    tiers: ['Arceus Cup', 'Treasure Cup'], shiny: 'WILD', release: 'greatball',
    weight: 68.5, levelAt: 50, levelTo: ['potw-706-hisuian'],
    eggBase: 'potw-704', eggGroup: ['Dragon'], eggCycles: 40,
    pokedex: `A creature given to melancholy. I suspect its metallic shell developed as a result of the mucus on its skin reacting with the iron in Hisui’s water.`,
    hp: 110, attack: 83, defense: 70, spAttack: 112, spDefense: 70, speed: 65,
    move: ['Iron Head', 'Dragon Pulse'],
    moveTMs: [
      'Snore', 'Bide', 'Thunderbolt', 'Iron Tail', 'Dragon Breath', 
      'Shock Wave', 'Facade', 'Water Pulse', 'Rock Slide', 'Sludge Wave', 
      'Infestation', 'Dragon Pulse', 'Secret Power', 'Protect', 'Swagger', 
      'Draco Meteor', 'Sunny Day', 'Rain Dance', 'Attract', 'Substitute', 
      'Endure', 'Confide', 'Double Team', 
    ],
    novelMoves: [[],
      ['Muddy Water', 'Protect'],
      ['Poison Tail', 'Shelter'],
      ['Weather Ball', 'Rain Dance'],
      ['Sludge Wave', 'Substitute'],
    ],
  }),
  'potw-706-hisuian': ensurePkmnBuilder({
    species: 'Goodra', type1: 'Steel', type2: 'Dragon', 
    tiers: ['Traditional', 'Arceus Cup', 'Treasure Cup'], shiny: 'WILD', release: 'ultraball',
    weight: 334.1,
    eggBase: 'potw-704', eggGroup: ['Dragon'], eggCycles: 40,
    pokedex: `Able to freely control the hardness of its metallic shell. It loathes solitude and is extremely clingy—it will fume and run riot if those dearest to it ever leave its side.`,
    hp: 80, attack: 100, defense: 100, spAttack: 110, spDefense: 150, speed: 60,
    move: ['Iron Head', 'Dragon Pulse'],
    moveTMs: [
      'Hyper Beam', 'Thunder Punch', 'Fire Punch', 'Snore', 'Bide', 
      'Thunderbolt', 'Fire Blast', 'Earthquake', 'Iron Tail', 'Dragon Breath', 
      'Focus Punch', 'Shock Wave', 'Facade', 'Water Pulse', 'Rock Slide', 
      'Sludge Wave', 'Bulldoze', 'Infestation', 'Giga Impact', 'Dragon Pulse', 
      'Secret Power', 'Superpower', 'Strength', 'Rock Smash', 'Protect', 
      'Swagger', 'Draco Meteor', 'Hail', 'Sunny Day', 'Rain Dance', 
      'Attract', 'Substitute', 'Endure', 'Confide', 'Laser Focus', 
      'Double Team', 
    ],
    novelMoves: [[],
      ['Muddy Water', 'Protect'],
      ['Power Whip', 'Shelter'],
      ['Weather Ball', 'Rain Dance'],
      ['Sludge Wave', 'Substitute'],
    ],
  }),
  'potw-713-hisuian': ensurePkmnBuilder({
    species: 'Avalugg', type1: 'Ice', type2: 'Rock', 
    tiers: ['Traditional', 'Arceus Cup', 'Treasure Cup'], shiny: 'WILD',
    weight: 262.4, release: 'greatball',
    eggBase: 'potw-712', eggGroup: ['Monster', 'Mineral'], eggCycles: 20,
    pokedex: `The armor of ice covering its lower jaw puts steel to shame and can shatter rocks with ease. This Pokémon barrels along steep mountain paths, cleaving through the deep snow.`,
    hp: 95, attack: 127, defense: 184, spAttack: 34, spDefense: 36, speed: 38,
    move: ['Mountain Gale', 'Rock Slide'],
    moveTMs: [
      'Hyper Beam', 'Snore', 'Double-Edge', 'Earthquake', 'Icy Wind', 
      'Rock Tomb', 'Facade', 'Water Pulse', 'Rock Slide', 'Stone Edge', 
      'Flash Cannon', 'Bulldoze', 'Frost Breath', 'Giga Impact', 'Secret Power', 
      'Superpower', 'Surf', 'Strength', 'Rock Smash', 'Protect', 
      'Swagger', 'Iron Defense', 'Hail', 'Rain Dance', 'Safeguard', 
      'Rock Polish', 'Attract', 'Substitute', 'Wide Guard', 'Mist', 
      'Confide', 'Flash', 'Double Team', 
    ],
    novelMoves: [[],
      ['Crunch', 'Iron Defense'],
      ['Ice Shard', 'Heavy Slam', 'Sharpen'],
      ['Iron Head', 'Aurora Veil'],
      ['Earthquake', 'Wide Guard'],
    ],
  }),
  'potw-724-hisuian': ensurePkmnBuilder({
    species: 'Decidueye', type1: 'Grass', type2: 'Fighting', 
    tiers: ['Traditional', 'Arceus Cup', 'Treasure Cup'], shiny: 'WILD',
    weight: 37, release: 'ultraball',
    eggBase: 'potw-722', eggGroup: ['Flying'], eggCycles: 20,
    pokedex: `The air stored inside the rachises of Decidueye’s feathers insulates the Pokémon against Hisui’s extreme cold. This is firm proof that evolution can be influenced by environment.`,
    hp: 88, attack: 112, defense: 80, spAttack: 95, spDefense: 95, speed: 60,
    move: ['Leaf Blade', 'Triple Arrows'],
    moveTMs: [
      'Solar Beam', 'Snore', 'Steel Wing', 'Shadow Ball', 'Facade', 
      'Leaf Storm', 'Shadow Claw', 'Giga Impact', 'Phantom Force', 'Leafage', 
      'Nature Power', 'Protect', 'Swagger', 'Confuse Ray', 'Frenzy Plant', 
      'Swords Dance', 'Nasty Plot', 'Feather Dance', 'Defog', 'Sunny Day', 
      'Light Screen', 'Haze', 'Safeguard', 'Tailwind', 'Attract', 
      'Substitute', 'Work Up', 'Confide', 'Roost', 'Laser Focus', 
      'Double Team', 
    ],
    novelMoves: [[],
      ['Brave Bird', 'Roost'],
      ['Frenzy Plant', 'Steel Wing', 'Grassy Terrain'],
      ['Seed Bomb', 'Hidden Power_Ice', 'Defog'],
      ['Swift', 'Bulk Up'],
    ],
  }),
  'potw-483-origin': ensurePkmnBuilder({
    species: 'Dialga', type1: 'Steel', type2: 'Dragon',
    tiers: ['Traditional', 'Arceus Cup', 'Treasure Cup'], shiny: 'SYNCABLE', rarity: 'LEGENDARY', release: 'ultraball',
    weight: 850,
    eggGroup: [], eggCycles: -1,
    pokedex: `Radiant light caused Dialga to take on a form bearing a striking resemblance to the creator Pokémon. Dialga now wields such colossal strength that one must conclude this is its true form.`,
    hp: 100, attack: 100, defense: 120, spAttack: 150, spDefense: 120, speed: 90,
    move: ['Flash Cannon', 'Roar of Time'],
    moveTMs: [
      'Hyper Beam', 'Snore', 'Thunderbolt', 'Fire Blast', 'Earthquake', 
      'Fury Cutter', 'Iron Tail', 'Dragon Breath', 'Swift', 'Rock Tomb', 
      'Shock Wave', 'Overheat', 'Facade', 'Aerial Ace', 'Rock Slide', 
      'Stone Edge', 'Shadow Claw', 'Flash Cannon', 'Hyper Voice', 'Bulldoze', 
      'Giga Impact', 'Dragon Pulse', 'Twister', 'Secret Power', 'Ancient Power', 
      'Cut', 'Strength', 'Rock Smash', 'Protect', 'Swagger', 
      'Thunder Wave', 'Bulk Up', 'Draco Meteor', 'Iron Defense', 'Sunny Day', 
      'Rain Dance', 'Sandstorm', 'Safeguard', 'Trick Room', 'Substitute', 
      'Hone Claws', 'Endure', 'Confide', 'Flash', 'Double Team', 
    ],
    novelMoves: [['Iron Tail', 'Megahorn', 'Earthquake'],
      ['Ice Beam', 'Magnet Rise'],
      ['Power Gem', 'Flash'],
      ['Earth Power', 'Trick Room'],
      ['Breaking Swipe', 'Hyper Voice', 'Gravity'],
    ]
  }),
  'potw-484-origin': ensurePkmnBuilder({
    species: 'Palkia', type1: 'Water', type2: 'Dragon', 
    tiers: ['Traditional', 'Arceus Cup', 'Treasure Cup'], shiny: 'SYNCABLE', rarity: 'LEGENDARY', release: 'ultraball',
    weight: 660,
    eggGroup: [], eggCycles: -1,
    pokedex: `It soars across the sky in a form that greatly resembles the creator of all things. Perhaps this imitation of appearance is Palkia’s strategy for gaining Arceus’s powers.`,
    hp: 90, attack: 100, defense: 100, spAttack: 150, spDefense: 120, speed: 120,
    move: ['Hydro Pump', 'Spacial Rend'],
    moveTMs: [
      'Hyper Beam', 'Snore', 'Dive', 'Thunderbolt', 'Fire Blast', 
      'Earthquake', 'Fury Cutter', 'Dragon Breath', 'Swift', 'Rock Tomb', 
      'Focus Punch', 'Shock Wave', 'Facade', 'Aerial Ace', 'Water Pulse', 
      'Rock Slide', 'Stone Edge', 'Brine', 'Shadow Claw', 'Hyper Voice', 
      'Bulldoze', 'Giga Impact', 'Liquidation', 'Dragon Pulse', 'Twister', 
      'Secret Power', 'Ancient Power', 'Surf', 'Cut', 'Strength', 
      'Rock Smash', 'Whirlpool', 'Protect', 'Swagger', 'Thunder Wave', 
      'Bulk Up', 'Draco Meteor', 'Hail', 'Sunny Day', 'Rain Dance', 
      'Sandstorm', 'Safeguard', 'Aqua Ring', 'Trick Room', 'Substitute', 
      'Hone Claws', 'Endure', 'Confide', 'Double Team', 
    ],
    novelMoves: [['Dragon Pulse', 'Surf', 'Aura Sphere', 'Earth Power'],
      ['Power Gem', 'Aqua Ring'],
      ['Hydro Pump', 'Ice Beam', 'Gravity'],
      ['Earth Power', 'Rain Dance'],
      ['Breaking Swipe', 'Surf', 'Hyper Voice', 'Psych Up'],
    ]
  }),
  'potw-899': ensurePkmnBuilder({
    species: 'Wyrdeer', type1: 'Normal', type2: 'Psychic', 
    tiers: ['Traditional', 'Arceus Cup', 'Treasure Cup'], shiny: 'WILD',
    weight: 95.1, release: 'greatball',
    needForm: false, syncableForms: ['alpha'],
    eggBase: 'potw-234', eggGroup: [], eggCycles: -1,
    pokedex: `The black orbs shine with an uncanny light when the Pokémon is erecting invisible barriers. The fur shed from its beard retains heat well and is a highly useful material for winter clothing.`,
    hp: 103, attack: 105, defense: 72, spAttack: 105, spDefense: 75, speed: 65,
    move: ['Double-Edge', 'Psyshield Bash'],
    moveTMs: [
      'Hyper Beam', 'Solar Beam', 'Double-Edge', 'Dig', 'Thunderbolt', 
      'Earthquake', 'Shadow Ball', 'Swift', 'Facade', 'Extrasensory', 
      'Charge Beam', 'Bulldoze', 'Psyshock', 'Giga Impact', 'Stomp', 
      'Psyshield Bash', 'Protect', 'Thunder Wave', 'Hypnosis', 'Confuse Ray', 
      'Calm Mind', 'Agility', 'Sunny Day', 'Rain Dance', 'Reflect', 
      'Light Screen', 'Trick Room', 'Substitute', 'Endure', 'Imprison', 
    ],
    novelMoves: [[],
      ['Body Slam', 'Wild Charge', 'Sand Attack'],
      ['Take Down', 'High Jump Kick', 'Confuse Ray'],
      ['Zen Headbutt', 'Hypnosis'],
      ['Swift', 'Megahorn', 'Flash'],
    ],
  }),
  'potw-900': ensurePkmnBuilder({
    species: 'Kleavor', type1: 'Bug', type2: 'Rock', 
    tiers: ['Traditional', 'Arceus Cup', 'Treasure Cup'], shiny: 'WILD', release: 'greatball',
    weight: 89, syncableForms: ['noble', 'alpha'], needForm: false,
    eggBase: 'potw-123', eggGroup: [], eggCycles: -1,
    pokedex: `A violent creature that fells towering trees with its crude axes and shields itself with hard stone. If one should chance upon this Pokémon in the wilds, one's only recourse is to flee.`,
    hp: 70, attack: 135, defense: 95, spAttack: 45, spDefense: 70, speed: 85,
    move: ['X-Scissor', 'Stone Axe'],
    moveTMs: [
      'Hyper Beam', 'Fury Cutter', 'Swift', 'Rock Tomb', 'Facade', 
      'Aerial Ace', 'Rock Slide', 'Stone Edge', 'Close Combat', 'Double Hit', 
      'Rock Blast', 'Giga Impact', 'Protect', 'Swords Dance', 'Agility', 
      'Defog', 'Sunny Day', 'Sandstorm', 'Light Screen', 'Quick Attack', 
      'Tailwind', 'Substitute', 'Quick Guard', 'Endure', 'Double Team', 
    ],
    novelMoves: [[],
      ['Night Slash', 'Focus Energy'],
      ['Quick Attack', 'Tailwind'],
      ['Vacuum Wave', 'Swords Dance'],
      ['Skull Bash', 'Roost'],
    ],
  }),
  'potw-901': ensurePkmnBuilder({
    species: 'Ursaluna', type1: 'Ground', type2: 'Normal', 
    tiers: ['Traditional', 'Arceus Cup', 'Treasure Cup'], shiny: 'WILD',
    syncableForms: ['blood_moon'], needForm: false,
    weight: 290, release: 'ultraball',
    eggBase: 'potw-216', eggGroup: ['Field'], eggCycles: 20,
    pokedex: `I believe it was Hisui's swampy terrain that gave Ursaluna its burly physique and newfound capacity to manipulate peat at will.`,
    hp: 130, attack: 140, defense: 105, spAttack: 45, spDefense: 80, speed: 50,
    move: ['Headlong Rush', 'Double-Edge'],
    moveTMs: [
      'Hyper Beam', 'Ice Punch', 'Thunder Punch', 'Fire Punch', 'Snore', 
      'Double-Edge', 'Dig', 'Earthquake', 'Fury Cutter', 'Swift', 
      'Rock Tomb', 'Facade', 'Aerial Ace', 'Rock Slide', 'Stone Edge', 
      'Close Combat', 'Shadow Claw', 'Hyper Voice', 'Bulldoze', 'Play Rough', 
      'Giga Impact', 'Body Press', 'Payback', 'Protect', 'Metronome', 
      'Bulk Up', 'Swords Dance', 'Sunny Day', 'Rain Dance', 'Belly Drum', 
      'Charm', 'Substitute', 'Endure', 'Sweet Scent', 'Taunt', 
      'Fake Tears', 
    ],
    novelMoves: [[],
      ['Hammer Arm', 'Bulk Up'],
      ['Play Rough', 'Belly Drum'],
      ['Ice Punch', 'Scary Face'],
      ['Earthquake', 'Sweet Scent'],
    ],
  }),
  'potw-902': ensurePkmnBuilder({
    species: 'Basculegion', type1: 'Water', type2: 'Ghost', 
    tiers: [], shiny: 'WILD',
    weight: 110, gender: ['male', 'female'], release: 'greatball',
    eggBase: 'potw-550-white_stripe', eggGroup: [], eggCycles: -1,
    pokedex: `Clads itself in the souls of comrades that perished before fulfilling their goals of journeying upstream. No other species throughout all Hisui's rivers is Basculegion's equal.`,
    hp: 120, attack: 112, defense: 65, spAttack: 80, spDefense: 75, speed: 78,
    move: ['Wave Crash', 'Shadow Ball'],
    moveTMs: [
      'Hyper Beam', 'Double-Edge', 'Shadow Ball', 'Icy Wind', 'Facade', 
      'Water Pulse', 'Head Smash', 'Giga Impact', 'Liquidation', 'Phantom Force', 
      'Mud Shot', 'Surf', 'Waterfall', 'Protect', 'Confuse Ray', 
      'Agility', 'Rain Dance', 'Endeavor', 'Substitute', 'Soak', 
    ],
    novelMoves: [[],
      ['Phantom Force', 'Crunch', 'Scary Face'],
      ['Psychic Fangs', 'Taunt'],
      ['Liquidation', 'Head Smash', 'Pain Split'],
      ['Outrage', 'Muddy Water', 'Calm Mind'],
      // Last Respects
    ],
  }),
  'potw-902-male': ensurePkmnBuilder({
    species: 'Basculegion', type1: 'Water', type2: 'Ghost', 
    tiers: ['Traditional', 'Arceus Cup', 'Treasure Cup'], shiny: 'WILD',
    weight: 110, release: 'greatball',
    eggBase: 'potw-550-white_stripe', eggGroup: [], eggCycles: -1,
    pokedex: `Clads itself in the souls of comrades that perished before fulfilling their goals of journeying upstream. No other species throughout all Hisui's rivers is Basculegion's equal.`,
    hp: 120, attack: 112, defense: 65, spAttack: 80, spDefense: 75, speed: 78,
    move: ['Wave Crash', 'Shadow Ball'],
    moveTMs: [
      'Hyper Beam', 'Double-Edge', 'Shadow Ball', 'Icy Wind', 'Facade', 
      'Water Pulse', 'Head Smash', 'Giga Impact', 'Liquidation', 'Phantom Force', 
      'Mud Shot', 'Surf', 'Waterfall', 'Protect', 'Confuse Ray', 
      'Agility', 'Rain Dance', 'Endeavor', 'Substitute', 'Soak', 
    ],
    novelMoves: [[],
      ['Phantom Force', 'Crunch', 'Scary Face'],
      ['Psychic Fangs', 'Taunt'],
      ['Liquidation', 'Head Smash', 'Pain Split'],
      ['Outrage', 'Muddy Water', 'Calm Mind'],
    ],
  }),
  'potw-902-female': ensurePkmnBuilder({
    species: 'Basculegion', type1: 'Water', type2: 'Ghost', 
    tiers: ['Traditional', 'Arceus Cup', 'Treasure Cup'], shiny: 'WILD',
    weight: 110, release: 'greatball',
    eggBase: 'potw-550-white_stripe', eggGroup: [], eggCycles: -1,
    pokedex: `Clads itself in the souls of comrades that perished before fulfilling their goals of journeying upstream. No other species throughout all Hisui's rivers is Basculegion's equal.`,
    hp: 120, attack: 92, defense: 65, spAttack: 100, spDefense: 75, speed: 78,
    move: ['Wave Crash', 'Shadow Ball'],
    moveTMs: [
      'Hyper Beam', 'Double-Edge', 'Shadow Ball', 'Icy Wind', 'Facade', 
      'Water Pulse', 'Head Smash', 'Giga Impact', 'Liquidation', 'Phantom Force', 
      'Mud Shot', 'Surf', 'Waterfall', 'Protect', 'Confuse Ray', 
      'Agility', 'Rain Dance', 'Endeavor', 'Substitute', 'Soak', 
    ],
    novelMoves: [[],
      ['Phantom Force', 'Crunch', 'Scary Face'],
      ['Ice Fang', 'Taunt'],
      ['Liquidation', 'Head Smash', 'Snowscape'],
      ['Outrage', 'Muddy Water', 'Calm Mind'],
    ],
  }),
  'potw-903': ensurePkmnBuilder({
    species: 'Sneasler', type1: 'Fighting', type2: 'Poison', 
    tiers: ['Traditional', 'Arceus Cup', 'Treasure Cup'], shiny: 'WILD',
    weight: 43, release: 'greatball',
    eggBase: 'potw-215-hisuian', eggGroup: [], eggCycles: -1,
    pokedex: `Because of Sneasler's virulent poison and daunting physical prowess, no other species could hope to best it on the frozen highlands. Preferring solitude, this species does not form packs.`,
    hp: 80, attack: 130, defense: 60, spAttack: 40, spDefense: 80, speed: 120,
    move: ['Close Combat', 'Dire Claw'],
    moveTMs: [
      'Hyper Beam', 'Fire Punch', 'Dig', 'Shadow Ball', 'Swift', 
      'Rock Tomb', 'Facade', 'Aerial Ace', 'Rock Slide', 'Close Combat', 
      'Shadow Claw', 'Double Hit', 'Giga Impact', 'Rock Smash', 'Protect', 
      'Bulk Up', 'Calm Mind', 'Swords Dance', 'Nasty Plot', 'Agility', 
      'Screech', 'Sunny Day', 'Rain Dance', 'Quick Attack', 'Switcheroo', 
      'Fake Out', 'Substitute', 'Hone Claws', 'Quick Guard', 'Endure', 
      'Taunt', 
    ],
    novelMoves: [[],
      ['Quick Attack', 'Swords Dance'],
      ['Shadow Claw', 'Focus Energy'],
      ['Vacuum Wave', 'Gunk Shot', 'Toxic Spikes'],
      ['Rock Slide', 'Coaching'],
    ],
  }),
  'potw-904': ensurePkmnBuilder({
    species: 'Overqwil', type1: 'Dark', type2: 'Poison', 
    tiers: ['Traditional', 'Arceus Cup', 'Treasure Cup'], shiny: 'WILD',
    weight: 60.5, release: 'greatball',
    eggBase: 'potw-211-hisuian', eggGroup: [], eggCycles: -1,
    pokedex: `Its lancelike spikes and savage temperament have earned it the nickname "sea fiend." It slurps up poison to nourish itself.`,
    hp: 85, attack: 115, defense: 95, spAttack: 65, spDefense: 65, speed: 85,
    move: ['Dark Pulse', 'Barb Barrage'],
    moveTMs: [
      'Hyper Beam', 'Bubble Beam', 'Shadow Ball', 'Icy Wind', 'Facade', 
      'Water Pulse', 'Brine', 'Giga Impact', 'Liquidation', 'Mud Shot', 
      'Surf', 'Waterfall', 'Barb Barrage', 'Dark Pulse', 'Protect', 
      'Self-Destruct', 'Swords Dance', 'Agility', 'Rain Dance', 'Haze', 
      'Acupressure', 'Substitute', 'Endure', 'Taunt', 
    ],
    novelMoves: [[],
      ['Aqua Tail', 'Toxic Spikes'],
      ['Ice Ball', 'Spikes'],
      ['Throat Chop', 'Gunk Shot', 'Acupressure'],
      ['Sludge Wave', 'Surf', 'Haze'],
    ],
  }),
  'potw-905': ensurePkmnBuilder({
    species: 'Enamorus', type1: 'Fairy', type2: 'Flying', 
    syncableForms: ['incarnate', 'therian'], needForm: 'incarnate',
    tiers: [], shiny: 'SYNCABLE', rarity: 'LEGENDARY',
    weight: 48, release: 'ultraball',
    eggGroup: [], eggCycles: -1,
    pokedex: `When it flies to this land from across the sea, the bitter winter comes to an end. According to legend, this Pokémon's love gives rise to the budding of fresh life across Hisui.`,
    hp: 74, attack: 115, defense: 70, spAttack: 135, spDefense: 80, speed: 106,
    move: ['Springtide Storm'],
    moveTMs: [
      'Hyper Beam', 'Facade', 'Extrasensory', 'Play Rough', 'Giga Impact', 
      'Dazzling Gleam', 'Fly', 'Draining Kiss', 'Twister', 'Superpower', 
      'Protect', 'Flatter', 'Calm Mind', 'Iron Defense', 'Agility', 
      'Sunny Day', 'Rain Dance', 'Tailwind', 'Substitute', 'Endure', 
      'Imprison', 'Grassy Terrain', 'Misty Terrain', 'Taunt', 
    ],
    novelMoves: [[],
      ['Extrasensory', 'Calm Mind'],
      ['Focus Blast', 'Earth Power', 'Tailwind'],
      ['Weather Ball', 'Hurricane', 'Rain Dance'],
    ],
  }),
  'potw-905-incarnate': ensurePkmnBuilder({
    species: 'Enamorus', type1: 'Fairy', type2: 'Flying', 
    tiers: ['Traditional', 'Arceus Cup', 'Treasure Cup'], shiny: 'SYNCABLE', rarity: 'LEGENDARY',
    weight: 48, release: 'ultraball',
    eggGroup: [], eggCycles: -1,
    pokedex: `When it flies to this land from across the sea, the bitter winter comes to an end. According to legend, this Pokémon's love gives rise to the budding of fresh life across Hisui.`,
    hp: 74, attack: 115, defense: 70, spAttack: 135, spDefense: 80, speed: 106,
    move: ['Springtide Storm'],
    moveTMs: [
      'Hyper Beam', 'Facade', 'Extrasensory', 'Play Rough', 'Giga Impact', 
      'Dazzling Gleam', 'Fly', 'Draining Kiss', 'Twister', 'Superpower', 
      'Protect', 'Flatter', 'Calm Mind', 'Iron Defense', 'Agility', 
      'Sunny Day', 'Rain Dance', 'Tailwind', 'Substitute', 'Endure', 
      'Imprison', 'Grassy Terrain', 'Misty Terrain', 'Taunt', 
    ],
    novelMoves: [[],
      ['Extrasensory', 'Calm Mind'],
      ['Focus Blast', 'Earth Power', 'Tailwind'],
      ['Weather Ball', 'Hurricane', 'Rain Dance'],
    ],
  }),
  'potw-905-therian': ensurePkmnBuilder({
    species: 'Enamorus', type1: 'Fairy', type2: 'Flying', 
    tiers: ['Traditional', 'Arceus Cup', 'Treasure Cup'], shiny: 'SYNCABLE', rarity: 'LEGENDARY',
    weight: 48, release: 'ultraball',
    eggGroup: [], eggCycles: -1,
    pokedex: `When it flies to this land from across the sea, the bitter winter comes to an end. According to legend, this Pokémon's love gives rise to the budding of fresh life across Hisui.`,
    hp: 74, attack: 115, defense: 110, spAttack: 135, spDefense: 100, speed: 46,
    move: ['Springtide Storm'],
    moveTMs: [
      'Hyper Beam', 'Facade', 'Extrasensory', 'Play Rough', 'Giga Impact', 
      'Dazzling Gleam', 'Fly', 'Draining Kiss', 'Twister', 'Superpower', 
      'Protect', 'Flatter', 'Calm Mind', 'Iron Defense', 'Agility', 
      'Sunny Day', 'Rain Dance', 'Tailwind', 'Substitute', 'Endure', 
      'Imprison', 'Grassy Terrain', 'Misty Terrain', 'Taunt', 
    ],
    novelMoves: [[],
      ['Extrasensory', 'Calm Mind'],
      ['Focus Blast', 'Earth Power', 'Tailwind'],
      ['Weather Ball', 'Hurricane', 'Rain Dance'],
    ],
  }),
}
