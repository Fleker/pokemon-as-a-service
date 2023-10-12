import test from 'ava'
import { EvolutionEntry, EvolutionEntryFunction, ItemAvailability, useItem, getPokemonLevel, getVariantForMove, getEligiblePokemonForMove, DirectMap } from '../items-availablity'
import * as P from '../gen/type-pokemon-ids'
import * as Pkmn from '../pokemon'
import { Globe } from '../locations-list'
import { Item, ItemId, ITEMS } from '../items-list'
import { Badge, Pokemon } from '../badge3'
import { TPokemon } from '../badge-inflate'
import { Recipes } from '../crafting'

const gyroZ = 0 // Default

test('Eevee hours', t => {
  const friendship = ItemAvailability.kelpsy!
  const eevee = Pokemon(P.Eevee)
  const eeveeStr = new Badge(eevee).toLegacyString()
  const eeveeData = Pkmn.get(eeveeStr)!
  const umbreon = new Badge(Pokemon(P.Umbreon)).toLegacyString()
  const espeon = new Badge(Pokemon(P.Espeon)).toLegacyString()
  const evolution = friendship.pokemon[eeveeStr] as EvolutionEntryFunction
  t.is(evolution(6, eeveeData).badge, umbreon)
  t.is(evolution(7, eeveeData).badge, espeon)
  t.is(evolution(17, eeveeData).badge, espeon)
  t.is(evolution(18, eeveeData).badge, umbreon)
  t.is(evolution(19, eeveeData).badge, umbreon)
})

test('Chingling hours', t => {
  const friendship = ItemAvailability.kelpsy!
  const chingling = Pokemon(P.Chingling)
  const chinglingStr = new Badge(chingling).toLegacyString()
  const chinglingData = Pkmn.get(chinglingStr)!
  const chimechoStr = new Badge(Pokemon(P.Chimecho)).toLegacyString()
  const evolution = friendship.pokemon[chinglingStr] as EvolutionEntryFunction
  t.is(evolution(6, chinglingData).badge,  chimechoStr)
  t.is(evolution(7, chinglingData).badge,  chinglingStr)
  t.is(evolution(17, chinglingData).badge, chinglingStr)
  t.is(evolution(18, chinglingData).badge, chimechoStr)
  t.is(evolution(19, chinglingData).badge, chimechoStr)
})

test('Alolan Meowth hours', t => {
  const friendship = ItemAvailability.kelpsy!
  const meow = Pokemon(P.Meowth, {form: 'alolan'})
  const meowStr = new Badge(meow).toLegacyString()
  const meowData = Pkmn.get(meowStr)!
  const persianStr = new Badge(Pokemon(P.Persian, {form: 'alolan'})).toLegacyString()
  const evolution = friendship.pokemon[meowStr] as EvolutionEntryFunction
  t.is(evolution(6, meowData).badge,  persianStr)
  t.is(evolution(7, meowData).badge,  meowStr)
  t.is(evolution(17, meowData).badge, meowStr)
  t.is(evolution(18, meowData).badge, persianStr)
  t.is(evolution(19, meowData).badge, persianStr)

  // And verify the Kantonian Meowth doesn't evolve.
  const kMeow = Pokemon(P.Meowth)
  const kMeowStr = new Badge(kMeow).toLegacyString()
  t.is(friendship.pokemon[kMeowStr], undefined)
})

test('Gligar and razor fang', t => {
  const razorfang = ItemAvailability.razorfang!
  const gligarBadge = Pokemon(P.Gligar)
  const gligar = new Badge(gligarBadge)
  const gligarStr = gligar.toLegacyString()
  const evolution = razorfang.pokemon[gligarStr] as EvolutionEntry
  const gliscorStr = new Badge(Pokemon(P.Gliscor)).toLegacyString()
  const currentPokemon: TPokemon = {}
  t.is(evolution.badge, gliscorStr)
  t.false(razorfang.usable({target: gligar, hours: 15, currentPokemon, quantity: 1}))
  t.true(razorfang.usable({target: gligar, hours: 18, currentPokemon, quantity: 1}))
})

test('Use item fail precondition', t => {
  const pokemon = {}
  const location = Globe['US-MTV']
  const hours = 1
  const items = {
    pokeball: 1
  } as Record<ItemId, number>

  // Cannot use Poké Ball
  t.throws(() => useItem({
    target: Pokemon(P.Abomasnow),
    item: 'pokeball',
    location, pokemon, hours, items, gyroZ,
  }))

  // Abomasnow does not evolve
  t.throws(() => useItem({
    target: Pokemon(P.Abomasnow),
    item: 'rarecandy',
    location, pokemon, hours, items, gyroZ,
  }))

  // Cannot use item at this time
  t.throws(() => useItem({
    target: Pokemon(P.Riolu),
    item: 'kelpsy',
    location, pokemon, hours, items, gyroZ,
  }))
})

test('Location evolutions', t => {
  const Nosepass = Pokemon(P.Nosepass, {variant: 1})
  const Magneton = Pokemon(P.Magneton, {shiny: true})
  const Eevee2 = Pokemon(P.Eevee, {variant: 1, shiny: true})
  const pokemon = {
    [Pokemon(P.Eevee)]: 1,
    [Nosepass]: 1,
    [Magneton]: 1,
    [Eevee2]: 1,
  }
  const hours = 1
  const items = {
    pokeball: 1
  } as Record<ItemId, number>

  t.deepEqual(useItem({
    target: Pokemon(P.Eevee),
    item: 'rarecandy',
    location: Globe['BR-GRU'],
    pokemon, hours, items, gyroZ,
  }), {
    consumedItem: true,
    output: new Badge(Pokemon(P.Leafeon)).toString(),
    changeType: 'EVO',
  })

  t.deepEqual(useItem({
    target: Pokemon(P.Eevee),
    item: 'rarecandy',
    location: Globe['FI-HEL'],
    pokemon, hours, items, gyroZ,
  }), {
    consumedItem: true,
    output: new Badge(Pokemon(P.Glaceon)).toString(),
    changeType: 'EVO',
  })

  t.deepEqual(useItem({
    target: Nosepass,
    item: 'rarecandy',
    location: Globe['US-BLD'],
    pokemon, hours, items,  gyroZ,
  }), {
    consumedItem: true,
    output: new Badge(Pokemon(P.Probopass, {variant: 1})).toString(),
    changeType: 'EVO',
  })

  t.deepEqual(useItem({
    target: Magneton,
    item: 'rarecandy',
    location: Globe['US-BLD'],
    pokemon, hours, items, gyroZ,
  }), {
    consumedItem: true,
    output: new Badge(Pokemon(P.Magnezone, {shiny: true})).toString(),
    changeType: 'EVO',
  })

  t.throws(() => useItem({
    target: Pokemon(P.Eevee),
    item: 'rarecandy',
    location: Globe['US-MTV'],
    pokemon, hours, items, gyroZ,
  }))

  t.deepEqual(useItem({
    target: Eevee2,
    item: 'rarecandy',
    location: Globe['FI-HEL'],
    pokemon, hours, items, gyroZ,
  }), {
    consumedItem: true,
    output: new Badge(Pokemon(P.Glaceon, {shiny: true, variant: 1})).toString(),
    changeType: 'EVO',
  })
})

test('Basic evolutions', t => {
  const pokemon = {
    [Pokemon(P.Eevee)]: 1,
    [Pokemon(P.Metapod)]: 1,
    [Pokemon(P.Magneton)]: 1,
    [Pokemon(P.Snorunt, {gender: 'female'})]: 1,
    [Pokemon(P.Bidoof, {gender: 'female'})]: 1,
    [Pokemon(P.Cherubi)]: 1,
    [Pokemon(P.Kirlia, {gender: 'male'})]: 1,
  }
  const hours = 1
  const location = Globe['US-MTV']
  const items = {
    pokeball: 1
  } as Record<ItemId, number>

  t.deepEqual(useItem({
    target: Pokemon(P.Eevee),
    item: 'firestone',
    location, pokemon, hours, items, gyroZ,
  }), {
    consumedItem: true,
    output: new Badge(Pokemon(P.Flareon)).toString(),
    changeType: 'EVO',
  })

  t.deepEqual(useItem({
    target: Pokemon(P.Metapod),
    item: 'expcandyxl',
    location, pokemon, hours, items, gyroZ,
  }), {
    consumedItem: true,
    output: new Badge(Pokemon(P.Butterfree)).toString(),
    changeType: 'EVO',
  })

  t.deepEqual(useItem({
    target: Pokemon(P.Snorunt, {gender: 'female'}),
    item: 'dawnstone',
    location, pokemon, hours, items, gyroZ,
  }), {
    consumedItem: true,
    output: new Badge(Pokemon(P.Froslass, {gender: 'female'})).toString(),
    changeType: 'EVO',
  })

  t.deepEqual(useItem({
    target: Pokemon(P.Bidoof, {gender: 'female'}),
    item: 'rarecandy',
    location, pokemon, hours, items, gyroZ,
  }), {
    consumedItem: true,
    output: new Badge(Pokemon(P.Bibarel, {gender: 'female'})).toString(),
    changeType: 'EVO',
  })

  const unformedCherubiToFormedCherrim = useItem({
    target: Pokemon(P.Cherubi),
    item: 'rarecandy',
    location, pokemon, hours, items, gyroZ,
  })
  const cherrim = new Badge(unformedCherubiToFormedCherrim.output)
  t.true(['overcast', 'sunshine'].includes(cherrim.personality.form!),
    `Cherrim has form ${cherrim.personality.form}`)

  t.deepEqual(useItem({
    target: Pokemon(P.Kirlia, {gender: 'male'}),
    item: 'dawnstone',
    location, pokemon, hours, items, gyroZ,
  }), {
    consumedItem: true,
    output: new Badge(Pokemon(P.Gallade, {gender: 'male'})).toString(),
    changeType: 'EVO',
  })
})

test('Form shifts', t => {
  const pokemon = {
    [Pokemon(P.Eevee)]: 1,
    [Pokemon(P.Metapod)]: 1,
    [Pokemon(P.Castform)]: 1,
    [Pokemon(P.Castform, {form: 'rainy'})]: 1,
    [Pokemon(P.Rotom, {form: 'fan'})]: 1,
    [Pokemon(P.Cherrim, {form: 'overcast', shiny: true, variant: 1})]: 1,
  }
  const hours = 1
  const location = Globe['US-MTV']
  const items = {
    pokeball: 1
  } as Record<ItemId, number>

  t.deepEqual(useItem({
    target: Pokemon(P.Castform),
    item: 'tr-Sunny Day',
    location, pokemon, hours, items, gyroZ,
  }), {
    consumedItem: false,
    output: new Badge(Pokemon(P.Castform, {form: 'sunny'})).toString(),
    changeType: 'FORM',
  })

  t.deepEqual(useItem({
    target: Pokemon(P.Castform, {form: 'rainy'}),
    item: 'tr-Sunny Day',
    location, pokemon, hours, items, gyroZ,
  }), {
    consumedItem: false,
    output: new Badge(Pokemon(P.Castform, {form: 'sunny'})).toString(),
    changeType: 'FORM',
  })

  t.deepEqual(useItem({
    target: Pokemon(P.Castform, {form: 'rainy'}),
    item: 'tr-Defog',
    location, pokemon, hours, items, gyroZ,
  }), {
    consumedItem: false,
    output: new Badge(Pokemon(P.Castform)).toString(),
    changeType: 'FORM',
  })

  t.deepEqual(useItem({
    target: Pokemon(P.Rotom, {form: 'fan'}),
    item: 'brokenlight',
    location, pokemon, hours, items, gyroZ,
  }), {
    consumedItem: false,
    output: new Badge(Pokemon(P.Rotom)).toString(),
    changeType: 'FORM',
  })

  t.deepEqual(useItem({
    target: Pokemon(P.Cherrim, {form: 'overcast', shiny: true, variant: 1}),
    item: 'tr-Sunny Day',
    location, pokemon, hours, items, gyroZ,
  }), {
    consumedItem: false,
    output: new Badge(Pokemon(P.Cherrim, {form: 'sunshine', shiny: true, variant: 1})).toString(),
    changeType: 'FORM',
  })

  t.deepEqual(useItem({
    target: Pokemon(P.Cherrim, {form: 'sunshine', variant: 4}),
    item: 'tr-Defog',
    location, pokemon, hours, items, gyroZ,
  }), {
    consumedItem: false,
    output: new Badge(Pokemon(P.Cherrim, {form: 'overcast', variant: 4})).toString(),
    changeType: 'FORM',
  })
})

test('Functional evolutions', t => {
  const pokemon = {
    [Pokemon(P.Riolu)]: 1,
    [Pokemon(P.Nincada)]: 1,
    [Pokemon(P.Abomasnow)]: 1,
    [Pokemon(P.Abra)]: 1,
    [Pokemon(P.Aerodactyl)]: 1,
  }
  const hours = 1
  const location = Globe['US-MTV']
  const items = {
    pokeball: 1
  } as Record<ItemId, number>

  // t.notDeepEqual(useItem({
  //   target: Pokemon(P.Riolu),
  //   item: 'kelpsy',
  //   hours: 12,
  //   location, pokemon, items, gyroZ,
  // }), {
  //   consumedItem: true,
  //   output: new Badge(Pokemon(P.Lucario)).toString(),
  //   changeType: 'EVO',
  // }, 'Pokemon is not affectionate right now')

  t.deepEqual(useItem({
    target: Pokemon(P.Riolu, {affectionate: true}),
    item: 'kelpsy',
    hours: 12,
    location, pokemon, items, gyroZ,
  }), {
    consumedItem: true,
    output: new Badge(Pokemon(P.Lucario, {affectionate: true})).toString(),
    changeType: 'EVO',
  }, 'Pokemon should be affectionate enough')

  t.throws(() => {
    // Noop evolution b/c it's too late at night
    useItem({
      target: Pokemon(P.Riolu),
      item: 'kelpsy',
      hours: 24,
      location, pokemon, items, gyroZ,
    })
  })

  t.deepEqual(useItem({
    target: Pokemon(P.Nincada),
    item: 'rarecandy',
    hours, location, pokemon, items, gyroZ,
  }), {
    consumedItem: true,
    output: new Badge(Pokemon(P.Ninjask)).toString(),
    others: [new Badge(Pokemon(P.Shedinja)).toString()],
    changeType: 'EVO',
  })
})

test('Burmy evolution', t => {
  const pokemon = {
    [Pokemon(P.Burmy, {gender: 'male'})]: 1,
    [Pokemon(P.Burmy, {form: 'plant', gender: 'female'})]: 1,
    [Pokemon(P.Burmy, {form: 'sandy', gender: 'female'})]: 1,
    [Pokemon(P.Burmy, {form: 'trash', gender: 'female'})]: 1,
    [Pokemon(P.Burmy)]: 1,
    [Pokemon(P.Burmy, {gender: 'male', form: 'plant'})]: 1,
    [Pokemon(P.Burmy, {gender: 'male', form: 'plant', variant: 1})]: 1,
  }
  const hours = 1
  const location = Globe['US-MTV']
  const items = {
    pokeball: 1
  } as Record<ItemId, number>

  t.deepEqual(useItem({
    target: Pokemon(P.Burmy, {gender: 'male'}),
    item: 'rarecandy',
    hours, location, pokemon, items, gyroZ,
  }), {
    consumedItem: true,
    output: new Badge(Pokemon(P.Mothim, {gender: 'male'})).toString(),
    changeType: 'EVO',
  })

  t.deepEqual(useItem({
    target: Pokemon(P.Burmy),
    item: 'rarecandy',
    hours, location, pokemon, items, gyroZ,
  }), {
    consumedItem: true,
    output: new Badge(Pokemon(P.Mothim)).toString(),
    changeType: 'EVO',
  })

  t.deepEqual(useItem({
    target: Pokemon(P.Burmy, {form: 'trash', gender: 'female'}),
    item: 'rarecandy',
    hours, location, pokemon, items, gyroZ,
  }), {
    consumedItem: true,
    output: new Badge(Pokemon(P.Wormadam, {form: 'trash', gender: 'female'})).toString(),
    changeType: 'EVO',
  })

  t.deepEqual(useItem({
    target: Pokemon(P.Burmy, {gender: 'male', form: 'plant'}),
    item: 'expcandym',
    hours, location, pokemon, items, gyroZ,
  }), {
    consumedItem: true,
    output: new Badge(Pokemon(P.Mothim, {gender:'male'})).toString(),
    changeType: 'EVO',
  })

  t.deepEqual(useItem({
    target: Pokemon(P.Burmy, {gender: 'male', form: 'plant', variant: 1}),
    item: 'expcandym',
    hours, location, pokemon, items, gyroZ,
  }), {
    consumedItem: true,
    output: new Badge(Pokemon(P.Mothim, {gender:'male', variant: 1})).toString(),
    changeType: 'EVO',
  })
})

test('Combee evo', t => {
  const pokemon = {
    [Pokemon(P.Combee, {gender: 'female'})]: 1,
    [Pokemon(P.Combee, {gender: 'male'})]: 1,
  }
  const hours = 1
  const location = Globe['US-MTV']
  const items = {
    pokeball: 1
  } as Record<ItemId, number>

  t.deepEqual(useItem({
    target: Pokemon(P.Combee, {gender: 'female'}),
    item: 'rarecandy',
    hours, location, pokemon, items, gyroZ,
  }), {
    consumedItem: true,
    output: new Badge(Pokemon(P.Vespiquen, {gender: 'female'})).toString(),
    changeType: 'EVO',
  })

  t.throws(() => {
    useItem({
      target: Pokemon(P.Combee, {gender: 'male'}),
      item: 'rarecandy',
      hours, location, pokemon, items, gyroZ,
    })
  })
})

test('getPokemonLevel', t => {
  const twenty = getPokemonLevel(21)
  const combee = Pokemon(P.Combee, {})
  t.false(twenty.includes(new Badge(combee).toLegacyString()), 'Male/Undefined Combee has an evolution')
  const combeeF = Pokemon(P.Combee, {gender: 'female'})
  t.log(combeeF)
  t.log(twenty)
  t.true(twenty.includes(new Badge(combeeF).toLegacyString()), 'Female Combee has no evolutions')
})

test('getEligiblePokemonForMove', t => {
  const filterOutrage = getEligiblePokemonForMove('Outrage', false)
  t.true(filterOutrage.filter.includes('potw-001'))
  t.false(filterOutrage.filter.includes('potw-129'))
})

test('getVariantForMove', t => {
  t.is(getVariantForMove(Pokemon(P.Bulbasaur), 'Mud-Slap'), 1)
  t.is(getVariantForMove(Pokemon(P.Bulbasaur), 'Growth'), 2)
  t.is(getVariantForMove(Pokemon(P.Bulbasaur), 'Outrage'), 3)
  t.is(getVariantForMove(Pokemon(P.Bulbasaur), 'Flamethrower'), undefined)
  t.is(getVariantForMove(Pokemon(P.Bulbasaur), 'Flamethrower'), undefined)
  t.is(getVariantForMove(Pokemon(P.Butterfree), 'Confusion'), undefined)
})

test('Cosplay Pikachu', t => {
  const pokemon = {
    [Pokemon(P.Pikachu, {form: 'belle'})]: 10,
  }
  const hours = 1
  const location = Globe['US-MTV']
  const items = {
    pokeball: 1
  } as Record<ItemId, number>

  // Cosplay Pikachus cannot evolve
  t.throws(() => useItem({
    target: Pokemon(P.Pikachu, {form: 'belle'}),
    item: 'thunderstone',
    hours, location, pokemon, items, gyroZ,
  }))
})

test('Alolan evos', t => {
  const pokemon = {
    [Pokemon(P.Pikachu, {})]: 10,
    [Pokemon(P.Vulpix, {})]: 10,
    [Pokemon(P.Vulpix, {form: 'alolan'})]: 10,
    [Pokemon(P.Sandshrew, {form: 'alolan'})]: 10,
    [Pokemon(P.Minior, {form: 'blue_meteor'})]: 10,
    [Pokemon(P.Minior, {form: 'blue_core'})]: 10,
  }
  const hours = 1
  const location = Globe['US-MTV']
  const items = {
    pokeball: 1,
  } as Record<ItemId, number>

  // Verify Pikachu + TStone = Raichu
  t.deepEqual(useItem({
    target: Pokemon(P.Pikachu, {}),
    item: 'thunderstone',
    hours, location, pokemon, items, gyroZ,
  }), {
    consumedItem: true,
    output: new Badge(Pokemon(P.Raichu, {})).toString(),
    changeType: 'EVO',
  })
  // Verify Pikachu + Souvenir = A-Raichu
  t.deepEqual(useItem({
    target: Pokemon(P.Pikachu, {}),
    item: 'strangesouvenir',
    hours, location, pokemon, items, gyroZ,
  }), {
    consumedItem: true,
    output: new Badge(Pokemon(P.Raichu, {form: 'alolan'})).toString(),
    changeType: 'EVO',
  })

  // Verify Vulpix + Fire Stone = Ninetales
  t.deepEqual(useItem({
    target: Pokemon(P.Vulpix, {}),
    item: 'firestone',
    hours, location, pokemon, items, gyroZ,
  }), {
    consumedItem: true,
    output: new Badge(Pokemon(P.Ninetales, {})).toString(),
    changeType: 'EVO',
  })

  // Verify A-Vulpix + Ice Stone = A-Ninetales
  t.deepEqual(useItem({
    target: Pokemon(P.Vulpix, {form: 'alolan'}),
    item: 'icestone',
    hours, location, pokemon, items, gyroZ,
  }), {
    consumedItem: true,
    output: new Badge(Pokemon(P.Ninetales, {form: 'alolan'})).toString(),
    changeType: 'EVO',
  })

  // Verify Vulpix + Ice Stone = Nothing
  t.throws(() => useItem({
    target: Pokemon(P.Vulpix, {}),
    item: 'icestone',
    hours, location, pokemon, items, gyroZ,
  }))

  // Verify A-Vulix + Fire Stone = Nothing
  t.throws(() => useItem({
    target: Pokemon(P.Vulpix, {form: 'alolan'}),
    item: 'firestone',
    hours, location, pokemon, items, gyroZ,
  }))

  // Verify A-Sandshrew cannot evolve with candy
  t.throws(() => useItem({
    target: Pokemon(P.Sandshrew, {form: 'alolan'}),
    item: 'rarecandy',
    hours, location, pokemon, items, gyroZ,
  }))

  // Verify Miniors can crack open
  t.deepEqual(useItem({
    target: Pokemon(P.Minior, {form: 'blue_meteor'}),
    item: 'tr-Shell Smash',
    hours, location, pokemon, items, gyroZ,
  }), {
    consumedItem: false,
    output: new Badge(Pokemon(P.Minior, {form: 'blue_core'})).toString(),
    changeType: 'FORM',
  })

  // Verify Miniors can repair
  t.deepEqual(useItem({
    target: Pokemon(P.Minior, {form: 'blue_core'}),
    item: 'tr-Iron Defense',
    hours, location, pokemon, items, gyroZ,
  }), {
    consumedItem: false,
    output: new Badge(Pokemon(P.Minior, {form: 'blue_meteor'})).toString(),
    changeType: 'FORM',
  })
})

test('Verify ItemAvailabilty keys are marked as functional', t => {
  for (const key of Object.keys(ItemAvailability)) {
    const item: Item = ITEMS[key]
    t.truthy(item, `Item ${key} does not exist`)
    t.true(item.functional, `Item ${key} is not marked as functional`)
  }

  // Go inverse too
  for (const [key, entry] of Object.entries(ITEMS)) {
    if ('functional' in entry && entry.functional) {
      t.true(key in ItemAvailability, `Item ${key} is marked as functional but has no ItemAvailability entry`)
    }
  }
})

test('Verify DirectMap keys are marked as direct', t => {
  for (const key of Object.keys(DirectMap)) {
    const item: Item = ITEMS[key]
    t.truthy(item, `Item ${key} does not exist`)
    t.true(item.direct, `Item ${key} is not marked as directly functional`)
  }

  // Go inverse too
  for (const [key, entry] of Object.entries(ITEMS)) {
    if ('direct' in entry && entry.direct) {
      t.true(key in DirectMap, `Item ${key} is marked as direct but has no DirectMap entry`)
    }
  }
})

test('Every cooking ingredient is used in at least one crafting recipe', t => {
  const craftingComponents = Object.entries(ITEMS)
    .filter(([, i]) => i.category === 'cooking' || i.category === 'crafting')
  for (const [key] of craftingComponents) {
    let craftUseful = false
    for (const recipe of Object.values(Recipes)) {
      const recipeCallsFor = Object.keys(recipe.input)
      if (recipeCallsFor.includes(key)) {
        craftUseful = true
      }
    }
    t.true(craftUseful, `Item ${key} is not used anywhere`)
  }
})
