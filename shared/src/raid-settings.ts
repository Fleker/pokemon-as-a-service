import { SHINY_CHARM } from "./quests"
import { ItemId } from "./items-list"
import { potentialPrizes } from "./raid-prizes"
import { requireItem, Requirements } from "./legendary-quests"
import { Type } from "./pokemon/types"
import { MoveId } from "./gen/type-move-meta"
import { Movepool } from './battle/movepool'
import { Pokemon } from "./battle/types"
import randomItem from './random-item'
import { TargetSelection, MoveSelection } from "../../shared/src/battle/natures"
import { ConditionMap } from "./battle/status"

/**
 * Start within ~3 days!
 */
export const EXPIRY_TIME = 1000 * 60 * 60 * 24 * 3.25
export const EXPIRY_TIME_11S = 1000 * 60 * 60 * 24 * 7.25
export const NEAR_EXPIRY_TIME = 1000 * 60 * 60 * 24 * 2

/**
 * Some raid bosses can select a custom raid move based on their
 * types. This is like them having Z-Moves.
 */
export const typedRaidMoves: Record<Type, MoveId> = {
  Bug: 'Raid Swarm',
  Normal: 'Raid Normalize',
  Fighting: 'Raid Sprint',
  Flying: 'Raid Headwinds',
  Fire: 'Raid Boil',
  Poison: 'Raid Haze',
  Fairy: 'Raid Sparkle',
  Ghost: 'Raid Shadow',
  Psychic: 'Raid Mind Read',
  Dark: 'Raid Thief',
  Dragon: 'Raid Rebirth',
  Steel: 'Raid Smelt',
  Water: 'Raid Rogue Wave',
  Grass: 'Raid Shroom Burst',
  Ice: 'Raid Supercool',
  Electric: 'Raid Voltage Drop',
  Ground: 'Raid High Ground',
  Rock: 'Raid Vetrification',
  Status: 'Raid Heal',
}

export interface SharedRaidSetting {
  maxMembers: number
  /**
   * Number of wishing pieces needed.
   */
  wishes: number
  /**
   * Cost in number of raid passes.
   */
  cost: number
  /** Default number of prizes to obtain */
  prizeCount: number
  /**
   * List of potential prizes that you may get from winning in common/uncommon/rare pools.
   */
  prizes: [ItemId[], ItemId[], ItemId[]]
  /**
   * Specifies eligibility to create one of these raids,
   * but does not apply to joining one.
   */
  eligible?: (quest: Requirements) => boolean
  /** If true, raid hosts can change raid boss after creation. */
  canWish: boolean
  /** Total number of MS for this raid to exist before closing. */
  expires: number
  buff: (opponent: Pokemon) => void
  moves: (self: Pokemon) => number
  targetingLogic: TargetSelection
  moveLogic: MoveSelection
}

export const raidBattleSettings: SharedRaidSetting[] = [
  // 0-Star
  {
    maxMembers: 1,
    wishes: 0,
    cost: 0,
    prizes: potentialPrizes[0],
    prizeCount: 0,
    canWish: true,
    expires: EXPIRY_TIME,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    buff: () => {},
    moves: () => 1,
    moveLogic: () => undefined,
    targetingLogic: (_, __, targets) => randomItem(targets),
  },
  // 1-Star
  {
    maxMembers: 4,
    wishes: 1,
    cost: 1,
    prizes: potentialPrizes[1],
    prizeCount: 5,
    canWish: true,
    expires: EXPIRY_TIME,
    buff: (opponent: Pokemon) => {
      opponent.conditions.push({...ConditionMap['Raid1']})
    },
    moves: (self: Pokemon) => {
      if (self.currentHp / self.totalHp < 0.5) {
        // Be more aggressive
        return 3
      }
      return 2
    },
    moveLogic: (_, __, ___, turn, inTurn) => {
      if (turn % 5 === 0 && inTurn === 0) {
        const prob = Math.random()
        if (prob < 0.5) {
          return {...Movepool['Raid Protect']}
        }
      }
      if (inTurn > 1) {
        // Use a random support move
        const prob = Math.random()
        if (prob < 0.083) { // 1/12 chance, up to 1/4 a turn
          return {...Movepool['Raid Sword']}
        } else if (prob < 0.167) { // 1/12 chance, up to 1/4 a turn
          return {...Movepool['Raid Shield']}
        } else if (prob < 0.2) { // 1/30 chance, up to 1/10 a turn
          return {...Movepool['Raid Heal']}
        }
      }
      // Use default move logic
      return undefined
    },
    targetingLogic: (_, turn, targets) => {
      if (turn === 0) {
        // Default on first turn
        return targets[0]
      }
      // Otherwise choose a random target
      return randomItem(targets)
    },
  },
  // 2-Star
  {
    maxMembers: 8,
    wishes: 2,
    cost: 1,
    prizes: potentialPrizes[2],
    prizeCount: 5,
    canWish: true,
    expires: EXPIRY_TIME,
    buff: (opponent: Pokemon) => {
      opponent.conditions.push({...ConditionMap['Raid2']})
    },
    moves: (self: Pokemon) => {
      if (self.currentHp < 100) {
        // Be more aggressive
        return 4
      }
      if (self.currentHp / self.totalHp < 0.25) {
        // Be more aggressive
        return 3
      }
      return 2
    },
    moveLogic: (_, __, ___,  turn, inTurn) => {
      if (turn % 5 === 0 && inTurn === 0) {
        const prob = Math.random()
        if (prob < 0.8) {
          return {...Movepool['Raid Protect']}
        }
      }
      if (inTurn > 1) {
        // Use a random support move
        const prob = Math.random()
        if (prob < 0.083) { // 1/12 chance, up to 1/4 a turn
          return {...Movepool['Raid Sword']}
        } else if (prob < 0.167) { // 1/12 chance, up to 1/4 a turn
          return {...Movepool['Raid Shield']}
        } else if (prob < 0.2) { // 1/30 chance, up to 1/10 a turn
          return {...Movepool['Raid Heal']}
        }
      }
      // Use default move logic
      return undefined
    },
    targetingLogic: (_, turn, targets) => {
      if (turn === 0) {
        // Default on first turn
        return targets[0]
      }
      // Otherwise choose a random target
      return randomItem(targets)
    },
  },
  // 3-Star
  {
    maxMembers: 12,
    wishes: 3,
    cost: 2,
    prizes: potentialPrizes[3],
    prizeCount: 6,
    canWish: true,
    expires: EXPIRY_TIME,
    buff: (opponent: Pokemon) => {
      opponent.conditions.push({...ConditionMap['Raid3']})
    },
    moves: (self: Pokemon) => {
      if (self.currentHp < 100) {
        // Be more aggressive
        return 4
      }
      if (self.currentHp / self.totalHp < 0.5) {
        // Be more aggressive
        return 3
      }
      return 2
    },
    moveLogic: (self: Pokemon, __, ___, turn, inTurn) => {
      if (turn % 5 === 0 && inTurn === 0) {
        return {...Movepool['Raid Protect']}
      }
      if (inTurn > 1) {
        // Use a random support move
        const prob = Math.random()
        const pct = self.currentHp / self.totalHp
        if (pct < 0.5) {
          // Different behavior when weakened
          if (prob < 0.15) {
            return {...Movepool['Raid Shield']} 
          } else if (prob < 0.3) {
            return {...Movepool['Raid Heal']}
          }
        } else {
          if (prob < 0.1) {
            return {...Movepool['Raid Sword']}
          } else if (prob < 0.2) {
            return {...Movepool['Raid Shield']}
          } else if (prob < 0.225) {
            return {...Movepool['Raid Heal']}
          }
        }
      }
      // Use default move logic
      return undefined
    },
    targetingLogic: (_, turn, targets) => {
      if (turn === 0) {
        // Default on first turn
        return targets[0]
      }
      // Otherwise choose a random target
      return randomItem(targets)
    },
  },
  // 4-Star
  {
    maxMembers: 16,
    wishes: 4,
    cost: 2,
    prizes: potentialPrizes[4],
    prizeCount: 6,
    canWish: true,
    expires: EXPIRY_TIME,
    buff: (opponent: Pokemon) => {
      opponent.conditions.push({...ConditionMap['Raid4']})
    },
    moves: (self: Pokemon) => {
      if (self.currentHp < 100) {
        return 4
      }
      if (self.currentHp / self.totalHp < 0.5) {
        // Be more aggressive
        return 4
      }
      return 3
    },
    moveLogic: (self: Pokemon, __, ___, turn, inTurn) => {
      if (turn % 5 === 0 && inTurn === 0) {
        return {...Movepool['Raid Protect']}
      }
      if (inTurn > 1) {
        // Use a random support move
        const prob = Math.random()
        const pct = self.currentHp / self.totalHp
        if (pct < 0.5) {
          // Different behavior when weakened
          if (prob < 0.15) {
            return {...Movepool['Raid Shield']} 
          } else if (prob < 0.3) {
            return {...Movepool['Raid Heal']}
          }
        } else {
          if (prob < 0.1) {
            return {...Movepool['Raid Sword']}
          } else if (prob < 0.2) {
            return {...Movepool['Raid Shield']}
          } else if (prob < 0.225) {
            return {...Movepool['Raid Heal']}
          }
        }
      }
      // Use default move logic
      return undefined
    },
    targetingLogic: (_, turn, targets) => {
      if (turn === 0) {
        // Default on first turn
        return targets[0]
      }
      // Otherwise choose a random target
      return randomItem(targets)
    },
  },
  // 5-Star
  {
    maxMembers: 20,
    wishes: 5,
    cost: 3,
    prizes: potentialPrizes[5],
    prizeCount: 6,
    canWish: true,
    expires: EXPIRY_TIME,
    buff: (opponent: Pokemon) => {
      opponent.conditions.push({...ConditionMap['Raid5']})
    },
    moves: (self: Pokemon) => {
      if (self.currentHp / self.totalHp < 0.33) {
        // Be more aggressive
        return 4
      }
      return 4
    },
    moveLogic: (self: Pokemon, __, ___, turn, inTurn) => {
      if (turn % 5 === 0 && inTurn === 0) {
        return {...Movepool['Raid Protect']}
      }
      if (inTurn > 1) {
        // Use a random support move
        const prob = Math.random()
        const pct = self.currentHp / self.totalHp
        if (pct < 0.5) {
          // Different behavior when weakened
          if (prob < 0.15) {
            return {...Movepool['Raid Shield']} 
          } else if (prob < 0.3) {
            return {...Movepool['Raid Heal']}
          } else if (prob < 0.4) {
            return {...Movepool[typedRaidMoves[self.type1]]}
          } else if (prob < 0.45) {
            return {...Movepool[typedRaidMoves[self.type2 ?? self.type1]]}
          }
        } else {
          if (prob < 0.1) {
            return {...Movepool['Raid Sword']}
          } else if (prob < 0.2) {
            return {...Movepool['Raid Shield']}
          } else if (prob < 0.225) {
            return {...Movepool['Raid Heal']}
          } else if (prob < 0.325) {
            return {...Movepool[typedRaidMoves[self.type1]]}
          } else if (prob < 0.35) {
            return {...Movepool[typedRaidMoves[self.type2 ?? self.type1]]}
          }
        }
      }
      // Use default move logic
      return undefined
    },
    targetingLogic: (_, turn, targets) => {
      if (turn === 0) {
        // Default on first turn
        return targets[0]
      }
      // Otherwise choose a random target
      return randomItem(targets)
    },
  },
  // 6-Star
  {
    maxMembers: 24,
    wishes: 5,
    cost: 3,
    prizes: potentialPrizes[6],
    prizeCount: 7,
    canWish: false,
    expires: EXPIRY_TIME,
    buff: (opponent: Pokemon) => {
      opponent.conditions.push({...ConditionMap['Raid6']})
    },
    moves: (self: Pokemon) => {
      if (self.currentHp / self.totalHp < 0.15) {
        // Be more aggressive
        return 5
      }
      return 4
    },
    moveLogic: (self: Pokemon, __, ___, turn, inTurn) => {
      if (turn % 5 === 0 && inTurn === 0) {
        return {...Movepool['Raid Protect']}
      }
      if (inTurn > 1) {
        // Use a random support move
        const prob = Math.random()
        const pct = self.currentHp / self.totalHp
        if (pct < 0.5) {
          // Different behavior when weakened
          if (prob < 0.15) {
            return {...Movepool['Raid Shield']} 
          } else if (prob < 0.3) {
            return {...Movepool['Raid Heal']}
          } else if (prob < 0.4) {
            return {...Movepool[typedRaidMoves[self.type1]]}
          } else if (prob < 0.45) {
            return {...Movepool[typedRaidMoves[self.type2 ?? self.type1]]}
          }
        } else {
          if (prob < 0.1) {
            return {...Movepool['Raid Sword']}
          } else if (prob < 0.2) {
            return {...Movepool['Raid Shield']}
          } else if (prob < 0.225) {
            return {...Movepool['Raid Heal']}
          } else if (prob < 0.325) {
            return {...Movepool[typedRaidMoves[self.type1]]}
          } else if (prob < 0.35) {
            return {...Movepool[typedRaidMoves[self.type2 ?? self.type1]]}
          }
        }
      }
      // Use default move logic
      return undefined
    },
    targetingLogic: (_, turn, targets) => {
      if (turn === 0) {
        // Default on first turn
        return targets[0]
      }
      // Otherwise choose a random target
      return randomItem(targets)
    },
  },
  // 7-Star (Tiny Raids)
  {
    /**
     * Requires more than 50 raid victories
     */
    eligible: (quest) => quest.raidRecord && quest.raidRecord[1] > 50,
    maxMembers: 4,
    wishes: 2,
    cost: 2,
    prizes: potentialPrizes[7],
    prizeCount: 6,
    canWish: true,
    expires: EXPIRY_TIME,
    buff: (opponent: Pokemon) => {
      opponent.conditions.push({...ConditionMap['Raid7']})
    },
    moves: (self) => {
      if (self.currentHp / self.totalHp < 0.5) {
        // Be more aggressive
        return 3
      }
      return 2
    },
    moveLogic: (self: Pokemon, __, ___, turn, inTurn) => {
      if (turn % 5 === 0 && inTurn === 0 && Math.random() < 0.5) {
        // 50% odds
        return {...Movepool['Raid Protect']}
      }
      if (inTurn > 1) {
        // Use a random support move
        const prob = Math.random()
        const pct = self.currentHp / self.totalHp
        if (pct < 0.5) {
          // Different behavior when weakened
          if (prob < 0.15) {
            return {...Movepool['Raid Shield']} 
          } else if (prob < 0.25) {
            return {...Movepool['Raid Heal']}
          }
        } else {
          if (prob < 0.1) {
            return {...Movepool['Raid Shield']}
          } else if (prob < 0.125) {
            return {...Movepool['Raid Heal']}
          }
        }
      }
      // Use default move logic
      return undefined
    },
    targetingLogic: (_, turn, targets) => {
      if (turn === 0) {
        // Default on first turn
        return targets[0]
      }
      // Otherwise choose a random target
      return randomItem(targets)
    },
  },
  // 8-Star (Expert Raids)
  {
    /**
     * Requires the shiny charm to be able to create these raids.
     */
    eligible: (quest) => quest.hiddenItemsFound.includes(SHINY_CHARM),
    maxMembers: 4,
    wishes: 2,
    cost: 2,
    prizes: potentialPrizes[8],
    prizeCount: 8,
    canWish: true,
    expires: EXPIRY_TIME,
    buff: (opponent: Pokemon) => {
      opponent.conditions.push({...ConditionMap['Raid8']})
    },
    moves: (self: Pokemon) => {
      if (self.currentHp < 100) {
        return 4
      }
      if (self.currentHp / self.totalHp < 0.5) {
        // Be more aggressive
        return 4
      }
      return 3
    },
    moveLogic: (self: Pokemon, __, ___, turn, inTurn) => {
      if (turn % 5 === 0 && inTurn === 0) {
        return {...Movepool['Raid Protect']}
      }
      if (inTurn > 1) {
        // Use a random support move
        const prob = Math.random()
        const pct = self.currentHp / self.totalHp
        if (pct < 0.5) {
          // Different behavior when weakened
          if (prob < 0.15) {
            return {...Movepool['Raid Shield']} 
          } else if (prob < 0.3) {
            return {...Movepool['Raid Heal']}
          }
        } else {
          if (prob < 0.1) {
            return {...Movepool['Raid Sword']}
          } else if (prob < 0.2) {
            return {...Movepool['Raid Shield']}
          } else if (prob < 0.225) {
            return {...Movepool['Raid Heal']}
          }
        }
      }
      // Use default move logic
      return undefined
    },
    targetingLogic: (_, __, targets) => {
      // Go after the Pokemon with the least current HP.
      // This is a direct number, not pct.
      // Blissey may be at 10% but still not be picked.
      const weakerTargets = targets.sort((a, b) => {
        return a.currentHp - b.currentHp
      })
      return weakerTargets[0]
    },
  },
  // 9-Star (Grand Underground Raids)
  {
    /**
     * Requires the explorer kit to be able to create these raids.
     */
    eligible: requireItem('explorerkit'),
    maxMembers: 4,
    wishes: 2,
    cost: 2,
    prizes: potentialPrizes[9],
    prizeCount: 8,
    canWish: true,
    expires: EXPIRY_TIME,
    buff: (opponent: Pokemon) => {
      opponent.conditions.push({...ConditionMap['Raid9']})
    },
    moves: (self: Pokemon) => {
      const pct = self.currentHp / self.totalHp
      if (pct < 0.1) {
        return 4
      } else if (pct < 0.67) {
        // Be more aggressive
        return 3
      }
      return 2
    },
    moveLogic: (self: Pokemon, __, ___, turn, inTurn) => {
      if (turn % 5 === 0 && inTurn === 0) {
        return {...Movepool['Raid Protect']}
      }
      if (inTurn > 1) {
        // Use a random support move
        const prob = Math.random()
        const pct = self.currentHp / self.totalHp
        if (pct < 0.33) {
          // Different behavior when weakened
          if (prob < 0.2) {
            return {...Movepool['Raid Shield']} 
          } else if (prob < 0.25) {
            return {...Movepool['Raid Heal']}
          }
        } else if (pct < 0.67) {
          if (prob < 0.2) {
            return {...Movepool['Raid Sword']} 
          } else if (prob < 0.25) {
            return {...Movepool['Raid Heal']}
          }
        } else {
          if (prob < 0.1) {
            return {...Movepool['Raid Sword']}
          } else if (prob < 0.2) {
            return {...Movepool['Raid Shield']}
          } else if (prob < 0.225) {
            return {...Movepool['Raid Heal']}
          }
        }
      }
      // Use default move logic
      return undefined
    },
    targetingLogic: (_, __, targets) => {
      // Go after the Pokemon with the least current HP.
      // This is a direct number, not pct.
      // Blissey may be at 10% but still not be picked.
      const weakerTargets = targets.sort((a, b) => {
        return a.currentHp - b.currentHp
      })
      return weakerTargets[0]
    },
  },
  // 10-Star (Legendary Raids)
  {
    /**
     * Requires the enigma stone to be able to create these raids.
     */
    eligible: requireItem('enigmastone'),
    maxMembers: 4,
    wishes: 2,
    cost: 2,
    prizes: potentialPrizes[10],
    prizeCount: 8,
    canWish: true,
    expires: EXPIRY_TIME,
    buff: (opponent: Pokemon) => {
      opponent.conditions.push({...ConditionMap['Raid10']})
    },
    moves: (self: Pokemon) => {
      const pct = self.currentHp / self.totalHp
      if (pct < 0.33) {
        return 3
      } else if (pct < 0.5) {
        // Be more aggressive
        return 3
      }
      return 2
    },
    moveLogic: (self: Pokemon, __, ___, turn, inTurn) => {
      if (turn % 5 === 0 && inTurn === 0) {
        return {...Movepool['Raid Protect']}
      }
      if (inTurn > 1) {
        // Use a random support move
        const prob = Math.random()
        const pct = self.currentHp / self.totalHp
        if (pct < 0.33) {
          // Different behavior when weakened
          if (prob < 0.2) {
            return {...Movepool['Raid Shield']} 
          } else if (prob < 0.3) {
            return {...Movepool['Raid Heal']}
          }
        } else if (pct < 0.67) {
          if (prob < 0.2) {
            return {...Movepool['Raid Sword']} 
          } else if (prob < 0.25) {
            return {...Movepool['Raid Heal']}
          }
        } else {
          if (prob < 0.1) {
            return {...Movepool['Raid Sword']}
          } else if (prob < 0.2) {
            return {...Movepool['Raid Shield']}
          } else if (prob < 0.225) {
            return {...Movepool['Raid Heal']}
          }
        }
      }
      // Use default move logic
      return undefined
    },
    targetingLogic: (_, __, targets) => {
      // Go after the Pokemon with the least current HP.
      // This is a direct number, not pct.
      // Blissey may be at 10% but still not be picked.
      const weakerTargets = targets.sort((a, b) => {
        return a.currentHp - b.currentHp
      })
      return weakerTargets[0]
    },
  },
  // 11-Star (Voyage Raids)
  {
    eligible: () => false, // Users are preset and cannot change.
    maxMembers: 4,
    wishes: 0, // Cannot wish.
    cost: 0, // Cannot join.
    prizes: potentialPrizes[1], // A lot of prizes will be pulled
    prizeCount: 8,
    canWish: false,
    expires: EXPIRY_TIME_11S,
    buff: (opponent: Pokemon) => {
      opponent.conditions.push({...ConditionMap['Raid11']})
    },
    moves: (self: Pokemon) => {
      const pct = self.currentHp / self.totalHp
      if (pct < 0.33) {
        return 3
      } else if (pct < 0.5) {
        // Be more aggressive
        return 3
      }
      return 2
    },
    moveLogic: (self: Pokemon, __, ___, turn, inTurn) => {
      if (turn % 5 === 0 && inTurn === 0) {
        return {...Movepool['Raid Protect']}
      }
      if (inTurn > 1) {
        // Use a random support move
        const prob = Math.random()
        const pct = self.currentHp / self.totalHp
        if (pct < 0.33) {
          // Different behavior when weakened
          if (prob < 0.2) {
            return {...Movepool['Raid Shield']} 
          } else if (prob < 0.3) {
            return {...Movepool['Raid Heal']}
          }
        } else if (pct < 0.67) {
          if (prob < 0.2) {
            return {...Movepool['Raid Sword']} 
          } else if (prob < 0.25) {
            return {...Movepool['Raid Heal']}
          }
        } else {
          if (prob < 0.1) {
            return {...Movepool['Raid Sword']}
          } else if (prob < 0.2) {
            return {...Movepool['Raid Shield']}
          } else if (prob < 0.225) {
            return {...Movepool['Raid Heal']}
          }
        }
      }
      // Use default move logic
      return undefined
    },
    targetingLogic: (_, __, targets) => {
      // Go after the Pokemon with the least current HP.
      // This is a direct number, not pct.
      // Blissey may be at 10% but still not be picked.
      const weakerTargets = targets.sort((a, b) => {
        return a.currentHp - b.currentHp
      })
      return weakerTargets[0]
    },
  },
]
