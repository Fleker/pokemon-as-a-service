import { assert } from '@fleker/gents'
import { BadgeId } from "./pokemon/types";
import { Users } from "./server-types";
import * as P from './gen/type-pokemon'
import { getLocalTime } from "./locations-list";
import { ITEMS, ItemId } from "./items-list";

export interface Event {
  /** Title of the event */
  title: string
  /** More about the event like how to trigger */
  description: string
  /** Multiplier for standard (non-raid) shiny encounters */
  shinyRate: number
  /** List of items that may be obtained from wild Pokémon at 20% rate */
  encounterHoldItems: ItemId[]
  /** Pokémon involved in this event. */
  frequentSpecies: BadgeId[]
  /** Other tangible benefits as a series of strings. */
  other?: string[]
  /** Function that returns true if it is active */
  isActive: (user: Users.Doc) => boolean
}

export const calculateNetWorth = (user: Users.Doc) => {
  if (!user) return -1
  const {items} = user
  let netWorth = 0
  for (const [item, count] of Object.entries(items)) {
    if (!count) {
      continue
    }
    if (ITEMS[item] && !isNaN(count!)) {
      const itemEntry = ITEMS[item]
      netWorth += itemEntry.sell * (count as number)
    }
  }
  netWorth += items.pokeball || 0 // Add Poké Balls though they sell for 0
  netWorth += items.raidpass || 0 // Add Raid Passes though they sell for 0
  return netWorth
}

export const Events = {
  'MOON_STONE': assert<Event>({
    title: 'Clefairy Dance',
    description: 'In the mountains there appear to be a group of Pokémon coming together.',
    encounterHoldItems: [],
    frequentSpecies: [P.Cleffa, P.Clefairy],
    other: [
      'Cleffa may appear in Poké Balls',
      'Clefable may appear in Ultra Balls',
      'Cleffa/Clefairy are guaranteed to hold Moon Stone',
    ],
    shinyRate: 1,
    isActive: () => {
      const date = new Date()
      const dow = date.getUTCDay()
      const hours = date.getUTCHours()
      /* Mondays 8PM - 12AM UTC only */
      return dow === 1 && hours >= 20
    }
  }),
  'BUG_CATCHING': assert<Event>({
    title: 'Bug Catching Contest',
    description: 'Today is a good day to catch bugs at the National Park.',
    frequentSpecies: [P.Scyther, P.Pinsir, P.Yanma],
    other: [
      'Pokémon guaranteed to hold Tiny Mushroom in Sport Ball',
      'Forretress guaranteed to hold Big Mushroom in Sport Ball',
    ],
    encounterHoldItems: [],
    shinyRate: 1,
    isActive: (user) => {
      const dow = getLocalTime(user).day()
      return dow === 2 || dow === 4
    }
  }),
  'HAPPY_FRIDAY': assert<Event>({
    title: 'Happy Friday',
    description: 'Today is Friday, the end of the week.',
    encounterHoldItems: [],
    frequentSpecies: [P.Lapras, P.Drifloon, P.Drifblim],
    shinyRate: 1,
    isActive: (user) => {
      /* Friday */
      return getLocalTime(user).day() === 5
    }
  }),
  'CATCH_RALLY': assert<Event>({
    title: 'Catch Rally for New Players',
    description: 'Welcome to the game! Catch some Pokémon for extra rewards.',
    encounterHoldItems: ['nugget', 'bigmushroom', 'starpiece'],
    shinyRate: 1,
    frequentSpecies: [],
    isActive: (user) => {
      return calculateNetWorth(user) < 10_000
    }
  }),
  'FRIDAY_THIRTEEN': assert<Event>({
    title: 'Friday the Thirteenth',
    description: 'Today is not a day for good luck.',
    encounterHoldItems: ['apricorncompost'], // Something awful
    frequentSpecies: [P.Misdreavus],
    shinyRate: 0.25, // Very bad luck
    isActive: (user) => {
      const date = getLocalTime(user)
      return date.day() === 5 && date.date() === 13
    }
  }),
  'THREE_KINGS': assert<Event>({
    title: 'Three Kings Day',
    description: 'Three Kings have traveled from far away. Perhaps they will share their riches.',
    frequentSpecies: [],
    encounterHoldItems: ['kingsrock', 'kingsleaf'],
    other: [
      'Nidoking may be found with Ultra Balls.',
      'Slowking may be found with Ultra Balls.',
      'Kingdra may be found with Ultra Balls.',
    ],
    shinyRate: 1,
    isActive: (user) => {
      const date = getLocalTime(user)
      return date.month() === 0 && date.date() === 6
    }
  }),
  'LUNAR_NY': assert<Event>({
    title: 'Lunar New Year',
    description: 'Another year over, the new one just the same (except with Rabbits)',
    frequentSpecies: [P.Bunnelby],
    encounterHoldItems: ['stardust'],
    shinyRate: 1.25, // Moderate increase
    isActive: (user) => {
      const date = getLocalTime(user)
      // Officially on the 22nd but celebrations start on Friday.
      return date.month() === 0 && date.date() <= 22 && date.date() >= 20
    }
  }),
  'MEWTWO_BIRTHDAY': assert<Event>({
    title: 'The Birthday of Mewtwo',
    description: 'On this day, long ago, Mewtwo was born.',
    frequentSpecies: [P.Abra],
    encounterHoldItems: ['twistedspoon'],
    other: [
      'Mewtwo appears in raids.',
      'Alakazam may be found with Ultra Balls.'
    ],
    shinyRate: 1,
    isActive: (user) => {
      const date = getLocalTime(user)
      return date.month() === 1 && date.date() === 6
    }
  }),
  'VALENTINES_DAY': assert<Event>({
    title: "Valentine's Day",
    description: 'Today is a day to celebrate with your loved ones: your Pokémon!',
    encounterHoldItems: ['heartscale'],
    frequentSpecies: [P.Luvdisc, P.Alomomola],
    other: [],
    shinyRate: 1,
    isActive: (user) => {
      const date = getLocalTime(user)
      return date.month() === 1 && date.date() === 14
    }
  }),
  'POKEMON_DAY': assert<Event>({
    title: 'Pokémon Day',
    description: 'Pokémon Red and Green came out on this day in 1996.',
    frequentSpecies: [P.Pikachu],
    encounterHoldItems: [],
    other: [],
    shinyRate: 2,
    isActive: (user) => {
      const date = getLocalTime(user)
      return date.month() === 1 && date.date() === 27
    }
  }),
  'ST_PATRICKS': assert<Event>({
    title: 'St. Patricks',
    description: 'Are you feeling the luck of the Irish?',
    frequentSpecies: [P.Petilil],
    encounterHoldItems: ['powerherb'],
    other: [],
    shinyRate: 1.5,
    isActive: (user) => {
      const date = getLocalTime(user)
      return date.month() === 2 && date.date() === 17
    }
  }),
  'SPRING': assert<Event>({
    title: 'Spring Equinox',
    description: 'In the northern hemisphere, days will be getting longer and warmer.',
    frequentSpecies: [P.Cherubi],
    encounterHoldItems: ['miracleseed'],
    other: [],
    shinyRate: 1,
    isActive: (user) => {
      const date = getLocalTime(user)
      return date.month() === 2 && date.date() === 21
    }
  }),
  'MARDI_GRAS': assert<Event>({
    title: 'Mardi Gras',
    description: 'Today is a good day to chill and eat some food.',
    frequentSpecies: [P.Munchlax],
    encounterHoldItems: ['lavacookie'],
    other: [],
    shinyRate: 1,
    isActive: (user) => {
      const date = getLocalTime(user)
      return date.month() === 1 && date.date() === 21
    }
  }),
  'APRIL_FOOLS': assert<Event>({
    title: 'April Fools',
    description: 'Trololol',
    frequentSpecies: [],
    encounterHoldItems: [],
    other: ['Something strange is happening.'],
    shinyRate: 1,
    isActive: (user) => {
      const date = getLocalTime(user)
      return date.month() === 3 && date.date() === 1
    }
  }),
  'EASTER': assert<Event>({
    title: 'EASTER',
    description: 'Pastel eggs are everywhere, but chocolate is inside??',
    frequentSpecies: [P.Buneary],
    encounterHoldItems: ['ragecandybar'],
    other: ['Lopunny may be found in Ultra Balls.'],
    shinyRate: 1,
    isActive: (user) => {
      const date = getLocalTime(user)
      return date.month() === 3 && date.date() === 9
    }
  }),
  'EARTH_DAY': assert<Event>({
    title: 'Earth Day',
    description: 'Today let us celebrate the planet and all it has given us, for life has no Ctrl-Z.',
    frequentSpecies: [P.Corsola],
    encounterHoldItems: ['blacksludge'],
    other: [],
    shinyRate: 1,
    isActive: (user) => {
      const date = getLocalTime(user)
      return date.month() === 3 && date.date() === 22
    }
  }),
  'ARBOR_DAY': assert<Event>({
    title: 'Arbor Day',
    description: 'Celebrate the planting of trees!.',
    frequentSpecies: [P.Bonsly],
    encounterHoldItems: ['miracleseed'],
    other: [],
    shinyRate: 1,
    isActive: (user) => {
      const date = getLocalTime(user)
      return date.month() === 3 && date.date() === 28
    }
  }),
  'STARWARS_DAY': assert<Event>({
    title: 'Star Wars Day',
    description: 'May the Fourth be with you.',
    frequentSpecies: [P.Elgyem, P.Beheeyem],
    encounterHoldItems: ['stardust'],
    other: [],
    shinyRate: 1,
    isActive: (user) => {
      const date = getLocalTime(user)
      return date.month() === 4 && date.date() === 4
    }
  }),
  'GOOGLE_IO': assert<Event>({
    title: 'Google I/O Developer Conference',
    description: "Learn about the latest news from Google. Keep this tab open, just listen to the audio.",
    frequentSpecies: [],
    encounterHoldItems: ['cellbattery'],
    other: [],
    shinyRate: 1.25,
    isActive: (user) => {
      const date = getLocalTime(user)
      return date.month() === 4 && date.date() >= 10 && date.date() <= 11
    }
  }),
  'MOTHERS_DAY': assert<Event>({
    title: "Mother's Day",
    description: "Celebrate the Queens in your life.",
    frequentSpecies: [P.Nidoqueen],
    encounterHoldItems: ['pearl'],
    other: [],
    shinyRate: 1,
    isActive: (user) => {
      const date = getLocalTime(user)
      return date.day() === 0 && // Sunday
        date.month() === 4 && // May
        date.date() > 7 && date.date() <= 14 // 2nd Sunday
    }
  }),
  'WINE_DAY': assert<Event>({
    title: "International Wine Day",
    description: "A glass of fermented fruit juice can make for a cozy way to spend the day.",
    frequentSpecies: [P.Shuckle],
    encounterHoldItems: ['grepa'],
    other: [],
    shinyRate: 1,
    isActive: (user) => {
      const date = getLocalTime(user)
      return date.month() === 4 && // May
        date.date() === 25 // May 25th
    }
  }),
  'FATHERS_DAY': assert<Event>({
    title: "Father's Day",
    description: "Celebrate the Kings in your life.",
    frequentSpecies: [P.Nidoking],
    encounterHoldItems: ['stardust'],
    other: [],
    shinyRate: 1,
    isActive: (user) => {
      const date = getLocalTime(user)
      return date.day() === 0 && // Sunday
        date.month() === 5 && // June
        date.date() > 7 && date.date() <= 14 // 2nd Sunday
    }
  }),
  'SUMMER': assert<Event>({
    title: 'Summer Solstice',
    description: 'In the northern hemisphere, we have reached peak summer.',
    frequentSpecies: [P.Cottonee],
    encounterHoldItems: ['watmel'],
    other: [
      'Whimsicott may appear in Ultra Balls',
    ],
    shinyRate: 1,
    isActive: (user) => {
      const date = getLocalTime(user)
      return date.month() === 5 && date.date() === 21
    }
  }),
  'ICE_CREAM_DAY': assert<Event>({
    title: 'National Ice Cream Day',
    description: 'A day to grab a cold treat.',
    frequentSpecies: [P.Vanillite, P.Vanillish, P.Vanilluxe],
    encounterHoldItems: ['casteliacone'],
    other: [],
    shinyRate: 1,
    isActive: (user) => {
      const date = getLocalTime(user)
      return date.month() === 6 && date.day() === 0 /* Sunday */
        && date.date() < 21 && date.date() >= 14 /* Third Sunday */
    }
  }),
  'INTERN_DAY': assert<Event>({
    title: 'International Intern Day',
    description: "If you're an intern, way to go!",
    frequentSpecies: [P.Azurill],
    encounterHoldItems: ['lavacookie'],
    other: [],
    shinyRate: 1,
    isActive: (user) => {
      // America celebrates National Intern Day on the last Thursday in July.
      const date = getLocalTime(user)
      return date.month() === 6 && date.day() === 5 /* Thursday */
        && date.date() < 28 && date.date() >= 21 /* Fourth Thursday */
    }
  }),
  'POTW_ANNIVERSARY': assert<Event>({
    title: 'Pokémon of the Week Anniversary',
    description: 'Several years ago this game started. Wow, how things have changed.',
    frequentSpecies: [],
    encounterHoldItems: [],
    other: [
      'There are special raids happening',
    ],
    shinyRate: 3,
    isActive: (user) => {
      const date = getLocalTime(user)
      return date.month() === 7 && date.day() === 3 /* August & Wednesday */
        && date.date() < 14 && date.date() >= 7 /* Second Wed */
    }
  }),
  'ELEPHANT_DAY': assert<Event>({
    title: 'World Elephant Day',
    description: 'These animals always make me smile. They really tickle my ivories.',
    frequentSpecies: [P.Phanpy],
    encounterHoldItems: ['razorfang'],
    shinyRate: 1,
    isActive: (user) => {
      const date = getLocalTime(user)
      // August 12th
      return date.month() === 7 && date.date() === 12
    }
  }),
  'YOUTH_DAY': assert<Event>({
    title: 'International Youth Day',
    description: 'Kids have it easy. Wow I wish I was still a kid so I could play Pokémon instead of working.',
    frequentSpecies: [P.Cleffa, P.Togepi, P.Pichu, P.Igglybuff],
    encounterHoldItems: ['expcandyxs', 'expcandys'],
    shinyRate: 1,
    isActive: (user) => {
      const date = getLocalTime(user)
      return date.month() === 7 && date.date() === 12
    }
  }),
  'VULTURE_AWARENESS': assert<Event>({
    title: 'Vulture Awareness Day',
    description: 'Acknowledge the vultures in our lives.',
    frequentSpecies: [P.Mandibuzz],
    encounterHoldItems: ['rarebone'],
    shinyRate: 1,
    isActive: (user) => {
      const date = getLocalTime(user)
      // First Saturday of September
      return date.month() === 8 && date.date() <= 7 && date.day() === 6
    }
  }),
  'SOFTWARE_FREEDOM_DAY': assert<Event>({
    title: 'Software Freedom Day',
    description: 'What does it mean for software to be free? Free as in beer, or as in speech? Let us celebrate the free software underpinning global infrastructure.',
    frequentSpecies: [P.Porygon],
    encounterHoldItems: ['upgrade'],
    shinyRate: 1,
    isActive: (user) => {
      const date = getLocalTime(user)
      return date.month() === 8 && date.date() === 15
    }
  }),
  'MONTREAL_PROTOCOL': assert<Event>({
    title: 'Montreal Protocol Anniversary',
    description: 'The Montreal Protocols were signed on this day in 1987, providing a path forward to ending the depletion of the ozone layer.',
    frequentSpecies: [],
    encounterHoldItems: ['smokeball'],
    other: [
      'Galarian Weezing can be found in Ultra Balls.'
    ],
    shinyRate: 1,
    isActive: (user) => {
      const date = getLocalTime(user)
      return date.month() === 8 && date.date() === 16
    }
  }),
  'PIRATE_DAY': assert<Event>({
    title: 'Talk Like a Pirate Day',
    description: 'Arr matey.',
    frequentSpecies: [P.Chatot],
    encounterHoldItems: ['rarebone'],
    shinyRate: 1,
    isActive: (user) => {
      const date = getLocalTime(user)
      return date.month() === 8 && date.date() === 19
    }
  }),
  'AUTUMN': assert<Event>({
    title: 'Autumn Equinox',
    description: 'In the northern hemisphere days will grow colder and darker.',
    frequentSpecies: [P.Sunkern],
    encounterHoldItems: ['cornn'],
    other: [
      'Sunflora may appear in Ultra Balls',
    ],
    shinyRate: 1,
    isActive: (user) => {
      const date = getLocalTime(user)
      return date.month() === 8 && date.date() === 21
    }
  }),
  'LOBSTER': assert<Event>({
    title: 'National Lobster Day',
    description: 'Time to celebrate our favorite crustaceans.',
    frequentSpecies: [P.Corphish, P.Crawdaunt],
    encounterHoldItems: ['heartscale'],
    shinyRate: 1,
    isActive: (user) => {
      const date = getLocalTime(user)
      return date.month() === 8 && date.date() === 25
    }
  }),
  'HALLOWEEN': assert<Event>({
    title: 'Halloween',
    description: 'On this eve, our connection to the ghost world becomes eerily close.',
    frequentSpecies: [P.Gastly, P.Haunter, P.Gengar],
    encounterHoldItems: ['spelltag', 'reapercloth'],
    other: [
      'Gengar may appear in Ultra Balls',
    ],
    shinyRate: 1,
    isActive: (user) => {
      const date = getLocalTime(user)
      return date.month() === 9 && date.date() === 31
    }
  }),
  'THANKSGIVING': assert<Event>({
    title: 'Thanksgiving',
    description: 'Take a day to be grateful for what you have, and share with those close to you.',
    frequentSpecies: [P.Unfezant],
    encounterHoldItems: ['leftovers'],
    shinyRate: 1,
    isActive: (user) => {
      const date = getLocalTime(user)
      return date.month() === 10 && date.day() === 4
        && date.date() >= 21 && date.date() < 28
    }
  }),
  'WINTER': assert<Event>({
    title: 'Winter Solstice',
    description: 'We have reached peak Winter.',
    frequentSpecies: [P.Snover],
    encounterHoldItems: ['snowball'],
    shinyRate: 1,
    isActive: (user) => {
      const date = getLocalTime(user)
      return date.month() === 11 && date.date() === 21
    }
  }),
  'CHRISTMAS': assert<Event>({
    title: 'Christmas',
    description: 'We have reached peak Winter.',
    frequentSpecies: [P.Delibird],
    encounterHoldItems: ['charcoal'],
    shinyRate: 1,
    isActive: (user) => {
      const date = getLocalTime(user)
      return date.month() === 11 &&
        date.date() >= 23 && date.date() <= 26
    }
  }),
  'NEW_YEARS_EVE': assert<Event>({
    title: "New Year's Eve",
    description: 'Another year over -- The new one just the same.',
    frequentSpecies: [],
    encounterHoldItems: ['wishingpiece'],
    shinyRate: 2,
    isActive: (user) => {
      const date = getLocalTime(user)
      return date.month() === 11 &&
        date.date() >= 30
    }
  }),
}

export type EventId = keyof typeof Events
