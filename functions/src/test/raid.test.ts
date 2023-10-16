import test from 'ava'
import { Pokemon, Badge } from '../../../shared/src/badge3';
import { BadgeId } from '../../../shared/src/pokemon/types';
import { Bulbasaur } from '../../../shared/src/gen/type-pokemon-ids';
import {violatesSpeciesClause, violatesRoomSize, raidSelectPreconditionCheck, CREATED} from '../battle-raid.utils'
import { DbRaid, Users } from '../db-types'

// Placeholders,
const boss = 'potw-130'
const host = 'placeholder'
const location = 'US-MTV'
const locationLabel = 'Mountain View'
const locationWeather = 'Rain'
const timestamp = {
  toMillis: () => Date.now() - 1000
} as unknown as FirebaseFirestore.Timestamp
const timestampLastUpdated = {
  toMillis: () => Date.now() - 1000
} as unknown as FirebaseFirestore.Timestamp

const emptyRaid = () => {
  const raid: DbRaid = {
    boss,
    host,
    location,
    locationLabel,
    locationWeather,
    playerList: [],
    timestamp,
    rating: 1,
    state: 0,
    timestampLastUpdated,
    isPublic: false,
    wishes: 0,
  }
  return raid
}

const emptyUser = () => {
  const user: Users.Doc = {
    battleStadiumRecord: [0, 0, 0, 0],
    eggs: [],
    eggsLaid: 0,
    hiddenItemsFound: [],
    items: {},
    lastPokeball: 1,
    ldap: 'nobody-else',
    location: 'US-MTV',
    moveTutors: 0,
    raidRecord: [0, 0, 0, 0],
    settings: {
      disableRealtime: false, disableSyncTeams: false,
      pokeindex: false, theme: 'dark', union: false,
      flagLocation2: false, flagSearch2: false,
      flagTag: false, flagAchievementService: false,
      notification: {
        BATTLE_LEADERBOARD: {inapp: true, push: true},
        GTS_COMPLETE: {inapp: true, push: true},
        ITEM_DISPENSE: {inapp: true, push: true},
        RAID_CLAIM: {inapp: true, push: true},
        RAID_COMPLETE: {inapp: true, push: true},
        RAID_EXPIRE: {inapp: true, push: true},
        RAID_RESET: {inapp: true, push: true},
        VOYAGE_COMPLETE: {inapp: true, push: true},
        PLAYER_EVENT: {inapp: true, push: true},
        GAME_EVENT: {inapp: true, push: true},
      }
    },
    strikes: 0,
    pokemon: {
      [Pokemon(Bulbasaur)]: 1,
    }
  }
  return user
}

test('Species Clause - Novel Pkmn', t => {
  const raid = emptyRaid()
  t.false(violatesSpeciesClause(raid, 'user123', Badge.fromLegacy('potw-001').toString()))
})

test('Species Clause - Shiny Pkmn', t => {
  const raid = emptyRaid()
  raid.players = {
    user123: {
      ldap: 'user123',
      ready: false,
      species: 'potw-001',
    }
  }
  const shinyBulb = Pokemon(1, {shiny: true})
  t.false(violatesSpeciesClause(raid, 'user456', shinyBulb))
})

test('Species Clause - Replace Pkmn', t => {
  const raid = emptyRaid()
  raid.players = {
    user123: {
      ldap: 'user123',
      ready: false,
      species: 'potw-001',
    }
  }
  const bulb1 = Pokemon(1, {variant: 1})
  t.false(violatesSpeciesClause(raid, 'user123', bulb1))
});

test('Species Clause - Same Pkmn', t => {
  const raid = emptyRaid()
  raid.players = {
    user123: {
      ldap: 'user123',
      ready: false,
      species: 'potw-001',
    }
  }
  t.true(violatesSpeciesClause(raid, 'user456', Badge.fromLegacy('potw-001').toString()))
})

test('Species Clause - Variant Pkmn', t => {
  const raid = emptyRaid()
  raid.players = {
    user123: {
      ldap: 'user123',
      ready: false,
      species: 'potw-001',
    }
  }
  const bulb1 = Pokemon(1, {variant: 1})
  t.true(violatesSpeciesClause(raid, 'user456', bulb1))
})

test('Species Clause - Form Pkmn', t => {
  const raid = emptyRaid()
  raid.players = {
    user123: {
      ldap: 'user123',
      ready: false,
      species: 'potw-025-kantonian' as BadgeId,
    },
    user124: {
      ldap: 'user123',
      ready: false,
      species: 'potw-001-shiny' as BadgeId,
    }
  }
  const pik = Pokemon(25, {})
  t.true(violatesSpeciesClause(raid, 'user456', pik))
})

test('Room Size - First Player', t => {
  const raid = emptyRaid()
  t.false(violatesRoomSize(raid, 'user123'))
})

test('Room Size - Too many players', t => {
  const raid = emptyRaid()
  raid.players = {} // Make non-undefined for testing
  raid.playerList = ['user123', 'user456', 'user789', 'userABC']
  t.true(violatesRoomSize(raid, 'userDEF'))
})

test('Room Size - Too many players sans host', t => {
  const raid = emptyRaid()
  raid.host = 'user123'
  raid.players = {} // Make non-undefined for testing
  raid.playerList = ['user456', 'user789', 'userABC']
  t.true(violatesRoomSize(raid, 'userDEF'))
})

test('Room Size - Too many players but there is the host', t => {
  const raid = emptyRaid()
  raid.host = 'user123'
  raid.players = {} // Make non-undefined for testing
  raid.playerList = ['user123', 'user456', 'user789']
  t.false(violatesRoomSize(raid, 'userABC'))
})

test('Room Size - Update selection', t => {
  const raid = emptyRaid()
  raid.playerList = ['user123', 'user456', 'user789', 'userABC']
  t.false(violatesRoomSize(raid, 'userABC'))
})

test('Room Size - Host updates selection', t => {
  const raid = emptyRaid()
  raid.host = 'user123'
  raid.playerList = ['user123', 'user456', 'user789', 'userABC']
  t.false(violatesRoomSize(raid, 'user123'))
})

test('Room Size - Host joins', t => {
  const raid = emptyRaid()
  raid.host = 'user123'
  raid.playerList = ['user456', 'user789', 'userABC']
  t.false(violatesRoomSize(raid, 'user123'))
})

test('Leave raid - User not in raid', async t => {
  const raid = emptyRaid()
  raid.host = 'user123'
  raid.players = {
    user456: {
      ldap: 'user456',
      ready: false,
      species: 'potw-001',
    },
    user789: {
      ldap: 'user456',
      ready: false,
      species: 'potw-001',
    },
    userABC: {
      ldap: 'user456',
      ready: false,
      species: 'potw-001',
    },
  }
  raid.playerList = ['user456', 'user789', 'userABC']
  const user = emptyUser()
  user.ldap = 'user123'
  await t.throwsAsync(async () => {
    await raidSelectPreconditionCheck(raid, user, 'userBCD', 'null')
  })
})

test.skip('Leave raid - User is host', async t => {
  const raid = emptyRaid()
  raid.host = 'user123'
  raid.players = {
    user456: {
      ldap: 'user456',
      ready: false,
      species: 'potw-001',
    },
    user789: {
      ldap: 'user456',
      ready: false,
      species: 'potw-001',
    },
    userABC: {
      ldap: 'user456',
      ready: false,
      species: 'potw-001',
    },
  }
  raid.playerList = ['user456', 'user789', 'userABC']
  const user = emptyUser()
  user.ldap = 'user123'
  const res = await raidSelectPreconditionCheck(raid, user, 'user123', 'null')
  t.is(res.state, 'LEAVE')
})

test('Leave raid - User partially in raid', async t => {
  // Some kind of DB glitch results in the player in playerList
  // but not in players map.
  const raid = emptyRaid()
  raid.host = 'user123'
  raid.players = {
    user456: {
      ldap: 'user456',
      ready: false,
      species: 'potw-001',
    },
    user789: {
      ldap: 'user456',
      ready: false,
      species: 'potw-001',
    },
    userABC: {
      ldap: 'user456',
      ready: false,
      species: 'potw-001',
    },
  }
  raid.playerList = ['user456', 'user789', 'userBCD']
  const user = emptyUser()
  user.ldap = 'user123'
  await t.throwsAsync(async () => {
    await raidSelectPreconditionCheck(raid, user, 'userBCD', 'null')
  })
})

test('Precondition', async t => {
  const timestamp = {
    toMillis: () => 1
  }
  const raid: DbRaid = {
    boss: 'potw-151',
    host: 'nobody',
    isPublic: false,
    location: 'US-MTV',
    locationLabel: 'Mountain View',
    locationWeather: 'Sunny',
    playerList: [],
    rating: 1,
    state: CREATED,
    timestamp: timestamp as FirebaseFirestore.Timestamp,
    timestampLastUpdated: timestamp as FirebaseFirestore.Timestamp,
    wishes: 0,
  }

  const user = emptyUser()

  await t.throwsAsync(async () => {
    await raidSelectPreconditionCheck(raid, user, 'nobody-else',
      Badge.fromLegacy('potw-001').toString())
  })
})
