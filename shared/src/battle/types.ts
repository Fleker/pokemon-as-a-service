import { Type, PokemonDoc } from "../pokemon/types"
import { TargetSelection, MoveSelection } from "./natures"
import { WeatherEvent } from "./weather"
import { TerrainType } from "../locations-list"
import { getCondition } from "./conditions"
import { ZMoveStatus } from "./zmoves"
import { MoveId } from "../gen/type-move-meta"
import { TerrainEvent } from "./terrain"
import { ItemId } from "../items-list"
import { Badge } from "../badge3"

export interface Pokemon extends PokemonDoc {
  badge: Badge
  ability?: Ability
  heldItem?: Item
  heldItemKey?: ItemId
  heldItemConsumed: boolean
  heldItemTotallyConsumed: boolean
  currentHp: number
  totalHp: number
  status?: Status
  /**
   * Temporary conditions that are not considered major status effects, like
   * Flinch.
   */
  conditions: Status[]
  movepool: Move[]
  fainted: boolean
  statBuffs: Record<Stat, number>
  targetingLogic?: TargetSelection,
  moveLogic?: MoveSelection,
}

export const statBuff = (counter: number) => {
  return {
    [-6]: .25,
    [-5]: .28,
    [-4]: .33,
    [-3]: .4,
    [-2]: .5,
    [-1]: .66,
    0: 1,
    1: 1.5,
    2: 2,
    3: 2.5,
    4: 3,
    5: 3.5,
    6: 4,
  }[counter] || 1
}

export type Stat = 'attack' | 'defense' | 'spAttack' | 'spDefense' | 'speed' | 'evasiveness' | 'accuracy' | 'criticalHit'

export interface MoveInput {
  /**
   * Your Pokemon
   */
  caster: Pokemon
  /**
   * The target Pokemon (your opponent)
   */
  target: Pokemon
  /**
   * Your Pokemon and ally Pokemon, in order
   */
  casters: Pokemon[]
  /**
   * All of your opponents
   */
  targets: Pokemon[]
  /**
   * The Move being used
   */
  move: Move
  /**
   * Current metadata about the battlefield
   */
  field: Field
  /**
   * Prefix of your side of the field (as opposed to the opponent)
   */
  prefix: Prefix
  /**
   * Prefix of the opponent's side of the field
   */
  targetPrefix: Prefix
  /**
   * Amount of damage done by the move, not avaialble until after move is used
   */
  damage?: number
}

/**
 * The Pokemon which will be impacted by the move.
 */
export type AreaOfEffect = 'Random Opponent' | 'Single Opponent' |
  'Nearby Opponents' | 'All Opponents' | 'All Allies' | 'Single Ally' |
  'Self' | 'Everyone'

/**
 * Represents all of the information pertaining to a Move
 */
export interface Move {
  /**
   * User-friendly label for the move
   */
  name: string
  /**
   * The type that this move is. Mostly useful for type-effectiveness
   * calculations.
   */
  type: Type
  /**
   * Percentage where 1 is the norm.
   */
  power: number
  /**
   * Percentage where 1 is the norm.
   */
  accuracy: number
  /**
   * Percentage where 1 is the norm.
   */
  criticalHit: number
  attackKey: 'attack' | 'spAttack' | 'defense'
  defenseKey: 'defense' | 'spDefense'
  /**
   * Set `failed` to true if move will fail somehow. This does not
   * create any logged messages, so one will need to be done in
   * onBeforeMove.
   */
  failed?: boolean
  /**
   * Use with 'Throat Chop' or sound spray.
   */
  sound?: boolean
  /**
   * Moves can go before others at the top of each turn.
   */
  priority?: number
  /**
   * Whether the move actually makes contact, for use with Sticky Barb
   * and Rocky Helmet.
   */
  contact?: boolean
  /**
   * Specifies whether this move will recover health as its primary function.
   * This field is used for move selection purposes.
   */
  recovery?: boolean
  /**
   * 
   * Specifies whether or not this is a 'punching' move. Used with Punching
   * Glove item and Iron Fist ability.
   */
  punching?: boolean
  /**
   * The Pokemon that will be impacted by the use of this move.
   */
  aoe: AreaOfEffect
  /**
   * User-friendly description of the move.
   */
  flavor: string
  /**
   * Property to hide from Movedex. This move is for testing or otherwise not a
   * 'legitimate' move.
   */
  hide?: boolean
  /**
   * Internal property marking Z-Moves.
   * These should not appear in the Movedex.
   */
  isZMove?: boolean
  /**
   * Logic to run which should just return the type.
   * This should be implemented in contexts where the move's type may change.
   * This should be run in the move selection to make it more reliable.
   */
  onGetType?: (caster: Pokemon, field: Field, move: Move) => Type
  /**
   * Logic to run before the move is used.
   */
  onBeforeMove?: (input: MoveInput) => Log
  /**
   * Logic to run after the move successfully is used for every target.
   */
  onAfterMove?: (input: MoveInput) => Log
  /**
   * Logic that runs once after the move successfully is used for the fa.
   */
  onAfterMoveOnce?: (input: MoveInput) => Log
  /**
   * Logic to run if the move misses the target.
   */
  onMiss?: (input: MoveInput) => Log
  /** Logic to run during a Z-Move. Useful for Z-<Status> moves. Uses ZMoveFx lookup. */
  zMoveFx?: ZMoveStatus
}

/**
 * Represents an item held by a Pokemon during battle.
 */
export interface Item {
  /**
   * Logic to run at the start of the battle.
   */
  onBattleStart?: (caster: Pokemon, target: Pokemon, consumed: boolean) => Log
  /**
   * Logic to run when this Pokémon is first sent out.
   */
  onEnterBattle?: (caster: Pokemon) => Log
  /**
   * Logic to run right before you use a move.
   */
  onCasterMove?:  (input: MoveInput, consumed: boolean) => Log
  /**
   * Logic to run right before a move will hit you.
   */
  onTargetMove?:  (caster: Pokemon, target: Pokemon, move: Move, consumed: boolean) => Log
  /**
   * Logic to run after you use a move, for each target hit.
   */
  onAfterCasterMove?:  (input: MoveInput, consumed: boolean, damage: number) => Log
  /**
   * Logic to run after you use a move, once after all targets hit.
   */
  onAfterCasterMoveOnce?:  (input: MoveInput, consumed: boolean, damage: number) => Log
  /**
   * Logic to run right after a move hits you.
   */
  onAfterTargetMove?:  (input: MoveInput, consumed: boolean, damage: number) => Log
  /**
   * Logic to run if the move misses the target.
   */
  onMiss?: (input: MoveInput) => Log
  /**
   * Logic to run at the end of each turn.
   */
  onTurnEnd?:     (caster: Pokemon, consumed: boolean, field: Field) => Log
}

interface StatusField {
  dmg?: number
  longer?: boolean
  Roost?: boolean
  Rest?: boolean
  caster?: Pokemon
  type?: Type
  rageFist?: number
  stockpile?: number
  criticalHits?: number
  selectedMove?: Move
  moves?: MoveId[]
  movepool?: Move[]
  stabTera?: boolean
}

/**
 * Represents a status effect or condition in battle.
 */
export interface Status {
  /**
   * The name of the status effect. Does not need to be user-friendly.
   */
  name: string
  /**
   * Number of turns this status has been on this Pokemon.
   */
  turnsActive: number
  /**
   * A mapping of various status-specific parameters.
   */
  p?: StatusField
  /**
   * Logic to run when the status effect is applied.
   */
  onActivation?: (battler: Pokemon, status: Status) => Log
  /**
   * Logic to run when the status effect is removed.
   */
  onDeactivation?: (battler: Pokemon) => Log
  /** Logic to run at the start of a battle. */
  onBattleStart?: (battler: Pokemon) => Log
  /**
   * Logic to run at the start of each turn.
   */
  onTurnStart?:  (status: Status, battler: Pokemon, move: Move) => Log
  /**
   * Logic to run before when the move is about to hit you.
   */
  onTargetMove?: (input: MoveInput) => Log
  /**
   * Logic to run after the move hits you.
   */
  onAfterTargetMove?: (input: MoveInput) => Log
  /**
   * Logic to run at the end of each turn.
   */
  onTurnEnd?:    (battler: Pokemon, status: Status, field: Field) => Log
}

/**
 * Represents an ability considered innate to a Pokemon.
 * This isn't implemented.
 */
export interface Ability {
  name: string
  turn: number
  onBattleStart?: (caster: Pokemon, target: Pokemon) => Log
  onCasterMove?:  (input: MoveInput) => Log
  onTargetMove?:  (input: MoveInput) => Log
  onMoveHit?:     (caster: Pokemon, target: Pokemon, input: MoveInput) => Log
  onTurnEnd?:     (caster: Pokemon) => Log
  onItemUsed?:    (caster: Pokemon, item: Item) => Log
}

/**
 * Represents a side of the field in a battle.
 */
export type Prefix = 'Your' | 'Opposing'

/**
 * Represents a side of the field in a battle.
 */
export interface SideField {
  /**
   * Number of turns remaining for Reflect.
   */
  reflect: number
  /**
   * Number of turns remaining for Light Screen.
   */
  lightscreen: number
  /**
   * Number of turns remaining for Mist.
   */
  mist: number
  /**
   * Number of turns remaining for Tailwind.
   */
  tailwind: number
  /**
   * Whether Grass Pledge has been used this turn.
   */
  pledgeGrass: boolean
  /**
   * Whether Fire Pledge has been used this turn.
   */
  pledgeFire: boolean
  /**
   * Whether Water Pledge has been used this turn.
   */
  pledgeWater: boolean
  /**
   * Number of turns remaining for Marsh (Grass + Water Pledge).
   */
  marsh: number
  /**
   * Number of turns remaining for Fire Field (Grass + Fire Pledge).
   */
  firefield: number
  /**
   * Number of turns remaining for Rainbow (Water + Fire Pledge).
   */
  rainbow: number
  /**
   * Whether Fusion Flare has been used this turn.
   */
  fusionFire: boolean
  /**
   * Whether Fusion Bolt has been used this turn.
   */
  fusionElectric: boolean
  /**
   * For moves like Rage Powder, Follow Me, Spotlight, a given target will
   * be forced to become the `target`.
   */
  target?: Pokemon
  /**
   * Moves like "Pay Day", "Make it Rain", or the "Amulet Coin" will set this
   * field to true.
   */
  goldCoins: boolean
  stealthRock: boolean
  spikes: 0 | 1 | 2 | 3
  toxicSpikes: 0 | 1 | 2
  stickyWeb: boolean
  sharpSteel: boolean
}

/**
 * Represents the entirety of the battle field.
 */
export interface Field {
  /**
   * Current weather on the battle field.
   */
  weather: WeatherEvent
  /**
   * The terrain on the battlefield. Used for some moves.
   */
  locationTerrain: TerrainType
  /**
   * For 'Terrain' moves. Not implemented.
   */
  terrain?: TerrainEvent
  /**
   * The current type for Nature Power.
   */
  naturePower: Type
  /**
   * Number of turns remaining for Mud Sport.
   */
  mudSport: number
  /**
   * Number of turns remaining for Water Sport.
   */
  waterSport: number
  /**
   * Number of turns remaining for Trick Room.
   */
  trickRoom: number
  /**
   * Number of turns remaining for Wonder Room.
   */
  wonderRoom: number
  /**
   * Number of turns remaining for Magic Room.
   */
  magicRoom: number
  /**
   * Whether there are ions on the field (See Ion Deluge).
   */
  ions: boolean
  /**
   * Whether a round of music has started.
   */
  round?: boolean
  /**
   * The conditions that exist on a part of the battle field.
   */
  sides: {
    [key in Prefix]: SideField
  }
}

/**
 * Represents a chronological order of events in the battle. This log
 * can be extended to pass other values throughout the course of the battle.
 */
export interface ILog {
  /**
   * Whether to actually print debug messages
   */
  isDebug: boolean
  /**
   * An ordered list of battle statements.
   */
  msg: string[]
  /**
   * Adds a single new string to the battle log.
   */
  add: (msg: string) => ILog
  /**
   * Adds a single new debug string to the battle log.
   */
  debug: (msg: string) => ILog
  /**
   * Merges a smaller set of logs into the larger battle log.
   */
  push: (log?: Log) => ILog
}

/**
 * Creates a new, empty Log object
 */
export class Log implements ILog {
  isDebug = false
  msg: string[] = []

  add(text?: string) {
    if (text) {
      if (text.startsWith('[D]') && !this.isDebug) return this
      this.msg.push(text)
    }
    return this
  }
  debug(text?: string) {
    if (this.isDebug) {
      this.msg.push(`[D] ${text}`)
    }
    return this
  }
  push (log?: ILog) {
    if (log) {
      this.msg.push(...log.msg)
    }
    // Return log param in cases where Log is of a type that extends Log.
    return log || this
  }
}

/**
 * Creates a log message with damage. If the damage is greater than the
 * current number of hit points, it will hit 0.
 * @param target Pokemon being damaged
 * @param damage Number of hitpoints to remove
 * @param force Deal damage even while protected (weather, for example)
 * @returns A log with the damage removed.
 */
export const logDamage = (target: Pokemon, damage: number, force?: boolean) => {
  const log = new Log()
  if (target.fainted) return log // Don't beat a dead horse
  if (getCondition(target, 'Protect') && !force) return log // Can't deal damage while protected
  const hpCurrent = Math.floor(target.currentHp)
  target.currentHp = Math.min(Math.max(Math.floor(target.currentHp - damage), 0), target.totalHp)
  log.add(`${target.species}: ${hpCurrent} -> ${target.currentHp}`)
  return log
}

/**
 * Creates a log message with a heal. If the amount to heal is greater than
 * the maximum number of hit points, it will go with `totalHp`.
 * @param target Pokemon being healed.
 * @param damage Number of hit points to add.
 * @returns A log with heal.
 */
export const logHeal = (target: Pokemon, damage: number) => {
  const heal = -damage
  const log = new Log()
  if (target.fainted) return log // Don't beat a dead horse
  if (getCondition(target, 'HealBlocked')) return log
  const hpCurrent = Math.floor(target.currentHp)
  target.currentHp = Math.min(Math.max(Math.floor(target.currentHp - heal), 0), target.totalHp)
  log.add(`${target.species}: ${hpCurrent} -> ${target.currentHp}`)
  return log
}
