import { Movepool, APPLY_STATUS, APPLY_TEMP_STATUS, BUFF_STAT, zMove } from "./movepool"
import { getCondition, removeCondition } from "./conditions"
import { logHeal, Item, Pokemon, Log, logDamage, Stat, Move, MoveInput } from "./types"
import { ConditionMap } from "./status"
import { BadgeId, Type, types } from "../pokemon/types"
import { MoveId, SupportMoves } from "../gen/type-move-meta"
import * as P from '../gen/type-pokemon'
import {BattleItemId} from '../gen/type-item'
import { ITEMS } from "../items-list"
import { typeMultiplier } from "./typeMultiplier"
import randomItem from "../random-item"
import { typeMatchup } from "./matchup"
import { get } from "../pokemon"
import { zMovePower, zMoveMapping, specialZMoveMapping } from "../zmoves"
import { maxMovePower, getMaxMoveset } from "../dynamax"
import { TeamsBadge } from '../badge2'

type Inventory = {
  [name in BattleItemId]: Item
}

const nop = () => { return new Log()}

// Sprites:
//   https://bulbapedia.bulbagarden.net/wiki/File:Bag_TM_Normal_Sprite.png
const itemTechnicalMachine = (move: MoveId) => {
  return {
    onBattleStart: (caster: Pokemon) => {
      // Check for TM compatibility
      if (caster.moveTMs === undefined || !caster.moveTMs.includes(move)) {
        return {
          msg: [`${caster.species} cannot learn the move ${move}!`]
        }
      }

      const tmMove = Movepool[move]
      let replaced = false
      for (let i = 0; i < caster.movepool.length; i++) {
        if (caster.movepool[i].type === tmMove.type) {
          caster.movepool[i] = tmMove // Replace move entirely
          replaced = true
        }
      }
      if (!replaced) {
        // Or append to the front
        caster.movepool = [Movepool[move], ...caster.movepool]
      }
      return { msg: [`${caster.species} learned the move ${move}`] }
    },
  }
}

const itemTechnicalRecord = (move: MoveId) => {
  return {
    onBattleStart: (caster: Pokemon) => {
      if (caster.moveTMs === undefined || !caster.moveTMs.includes(move)) {
        return {
          msg: [`${caster.species} cannot use the move ${move}!`]
        }
      }

      // Overwrite the move
      caster.movepool = [Movepool[move]]
      APPLY_TEMP_STATUS(caster, ConditionMap.Encore)
      return {
        msg: [`${caster.species} learned the move ${move}`]
      }
    },
  }
}

const boostType = (type: Type) => {
  return ({move}) => {
    if (move.type === type) move.power *= 1.2
    return new Log()
  }
}

const gem = (type: Type) => {
  return ({caster, move}) => {
    if (move.type === type && move.power > 0) {
      move.power *= 1.3
      caster.heldItemConsumed = true
      caster.heldItemTotallyConsumed = true
      return new Log().add(`The ${type} Gem boosted this move's power.`)
    }
    return new Log()
  }
}

const arceusType = (type: Type) => {
  return (caster) => {
    if (caster.species === 'Arceus') {
      caster.type1 = type
    }
    return new Log()
  }
}

function halvingBerry(type: Type, name: string) {
  return (_, target, move) => {
    if (move.type === type) {
      move.power /= 2
      target.heldItemConsumed = true
      target.heldItemTotallyConsumed = true
      return new Log().add(`The move's power was weakened with the ${name}`)
    }
    return new Log()
  }
}

function pinchBerry(stat: Stat, berry: string) {
  return (caster: Pokemon, consumed, field) => {
    const log = new Log()
    if (caster.currentHp / caster.totalHp < 0.25 && !consumed) {
      BUFF_STAT(caster, {
        caster,
        field,
        prefix: 'Your',
        targetPrefix: 'Opposing',
        move: Movepool.Acid, /* Placeholder */
        target: caster, /* Placeholder */
        casters: [caster], targets: [caster],
      }, stat, 1)
      caster.heldItemConsumed = true
      caster.heldItemTotallyConsumed = true
      log.add(`${caster.species}'s ${stat} rose with the ${berry}`)
    }
    return log
  }
}

function removeStatus(msg: string) {
  return ({caster}) => {
    const log = new Log()
    if (caster.currentHp <= 0) return log
    if (caster.heldItemConsumed) return log
    if (caster.status && caster.status.name) { // Any status condition
      caster.heldItemConsumed = true
      caster.heldItemTotallyConsumed = true
      if (caster.status.onDeactivation) {
        caster.status.onDeactivation(caster)
      }
      caster.status = undefined
      removeCondition(caster, 'PoisonBad')
      log.add(`${caster.species} ${msg}`)
    }
    return log
  }
}

function performMegaEvolution(holder: Pokemon, expectedSpecies: BadgeId, key: 'mega' | 'megax' | 'megay' = 'mega') {
  const log = new Log()
  const pkmn = get(expectedSpecies)!
  const {species} = pkmn
  const mega = pkmn[key]
  if (holder.species !== species) return log
  if (!mega) return log
  if (holder.heldItemConsumed) {
    log.add('Mega evolutions are not supported in this format.')
    return log
  }
  // Modify stats by a percent change of the mega buff.
  // During raids, this means that the raid buff should remain the same.
  holder.attack *= (mega.attack / pkmn.attack)
  holder.defense *= (mega.defense / pkmn.defense)
  log.debug(`Holder spAttack is ${holder.spAttack}. Multiply by ${mega.spAttack} / ${pkmn.spAttack} = ${(mega.spAttack / pkmn.spAttack)}`)
  holder.spAttack *= (mega.spAttack / pkmn.spAttack)
  log.debug(`Holder spAttack is now ${holder.spAttack}`)
  holder.spDefense *= (mega.spDefense / pkmn.spDefense)
  holder.speed *= (mega.speed / pkmn.speed)
  holder.weight *= (mega.weight / pkmn.weight)
  if (mega.type2 !== undefined && mega.type2 !== false) {
    holder.type2 = mega.type2
  }
  if (mega.type2 === false) {
    holder.type2 = undefined
  }
  // Modify & replace first few move slots
  mega.move.forEach((moveId, index) => {
    holder.move[index] = moveId
    holder.movepool[index] = Movepool[moveId]
  })
  log.add(`The mega stone has caused ${species} to Mega Evolve!`)
  return log
}

function rksMemory(type: Type): Item {
  return {
    onBattleStart: (caster) => {
      if (caster.species === 'Silvally') {
        caster.type1 = type
      }
      return new Log()
    }
  }
}

/**
 * For Pokemon that are holding a general elemental Z-Crystal, apply the
 * moveset update logic. This applies for attacks and support moves.
 * @param type Elemental type for the given Z-Crystal
 * @returns Item with appropriate callbacks for Z-Crystal
 */
export function simpleZCrystal(type: Type): Item {
  return {
    onBattleStart: (caster) => {
      const hasValidMove = (() => {
        for (let i = 0; i < caster.move.length; i++) {
          if (Movepool[caster.move[i]].type === type) {
            return caster.move[i]
          }
        }
        return undefined
      })()
      if (caster.heldItemConsumed) {
        return new Log().add('ZMoves are not supported in this format.')
      }
      if (!hasValidMove) {
        return new Log().add(`${caster.species}'s Z-Crystal failed to activate`)
      }
      if (Movepool[hasValidMove].power === 0) {
        // Question: How do we ensure this executes rather than a standard support move?
        const zMovepool = zMove({...Movepool[hasValidMove]})
        zMovepool.name = `Z-${zMovepool.name}`
        caster.move.unshift(hasValidMove)
        caster.movepool.unshift(zMovepool)
        // FIXME: We will probably turn these off in the future, but will be useful during debugging.
        return new Log().add(`${caster.species} has learned ${zMovepool.name}`)
      } else {
        const zMoveLookup = zMoveMapping[type]
        const zMovepool = {...Movepool[zMoveLookup]}
        zMovepool.power = zMovePower(Movepool[hasValidMove].power)
        // Add to the first slot of the Pokemon's move.
        // It'll activate if possible
        caster.move.unshift(zMoveLookup)
        caster.movepool.unshift(zMovepool)
        return new Log().add(`From move ${hasValidMove},`)
          .add(`${caster.species} has learned ${zMovepool.name}`)
      }
    }
  }
}

/**
 * For Pokemon/move combos in Z-Crystals, apply the moveslot update logic.
 * @param zLookup Z-Move that could be added
 * @returns Item with callbacks for Z-Crystal
 */
export function complexZCrystal(zLookup: MoveId): Item {
  return {
    onBattleStart: (caster) => {
      const entry = specialZMoveMapping[zLookup]
      if (entry === undefined) {
        return new Log().add(`${caster.species}'s Z-Crystal has no logic. This is a bug.`)
      }
      if (caster.heldItemConsumed) {
        return new Log().add('ZMoves are not supported in this format.')
      }
      // How will this handle standard v Alolan Raichu?
      const isValidHolder = (() => {
        for (const h of entry.holder) {
          const holder = new TeamsBadge(h)
          if (caster.badge.id === holder.id) {
            if (!holder.form || holder.form === caster.badge.personality.form) {
              return true
            }
          }
        }
        return false
      })()

      if (!isValidHolder) {
        return new Log().add(`${caster.species}'s Z-Crystal failed to activate`)
      }
      const hasValidMove = (() => {
        for (let i = 0; i < caster.move.length; i++) {
          if (caster.move[i] === entry.original) {
            return i
          }
        }
        return -1
      })()
      if (hasValidMove === -1) {
        return new Log().add(`${caster.species}'s Z-Crystal failed to activate`)
      }
      const zMovepool = {...Movepool[zLookup]}
      // Add to the first slot of the Pokemon's move.
      // It'll activate if possible
      caster.move.unshift(zLookup)
      caster.movepool.unshift(zMovepool)
      return new Log().add(`${caster.species} has learned ${zMovepool.name}`)
    }
  }
}

export function terastallize(teraType: Type): Item {
  return {
    onBattleStart: (caster) => {
      const tera = {...ConditionMap.Terastallized}
      tera.p = { type: teraType }
      caster.heldItemConsumed = true
      caster.heldItemTotallyConsumed = true
      return APPLY_TEMP_STATUS(caster, tera, '')
    }
  }
}

export const Inventory: Inventory = {
  /* TYPE-BOOSTING ITEMS */
  blackbelt: {
    onCasterMove: boostType('Fighting')
  },
  blackglasses: {
    onCasterMove: boostType('Dark')
  },
  charcoal: {
    onCasterMove: boostType('Fire')
  },
  dragonfang: {
    onCasterMove: boostType('Dragon')
  },
  hardstone: {
    onCasterMove: boostType('Rock')
  },
  magnet: {
    onCasterMove: boostType('Electric')
  },
  metalcoat: {
    onCasterMove: boostType('Steel')
  },
  miracleseed: {
    onCasterMove: boostType('Grass')
  },
  mysticwater: {
    onCasterMove: boostType('Water')
  },
  nevermeltice: {
    onCasterMove: boostType('Ice')
  },
  poisonbarb: {
    onCasterMove: boostType('Poison')
  },
  sharpbeak: {
    onCasterMove: boostType('Flying')
  },
  silkscarf: {
    onCasterMove: boostType('Normal')
  },
  silverpowder: {
    onCasterMove: boostType('Bug')
  },
  softsand: {
    onCasterMove: boostType('Ground')
  },
  spelltag: {
    onCasterMove: boostType('Ghost')
  },
  twistedspoon: {
    onCasterMove: boostType('Psychic')
  },
  fairyfeather: {
    onCasterMove: boostType('Fairy')
  },
  /* BERRIES */
  pomeg: {},
  kelpsy: {},
  chilan: {
    onTargetMove: halvingBerry('Normal', 'Chilan Berry'),
  },
  occa: {
    onTargetMove: halvingBerry('Fire', 'Occa Berry'),
  },
  passho: {
    onTargetMove: halvingBerry('Water', 'Passho Berry'),
  },
  wacan: {
    onTargetMove: halvingBerry('Electric', 'Wacan Berry'),
  },
  rindo: {
    onTargetMove: halvingBerry('Grass', 'Rindo Berry'),
  },
  yache: {
    onTargetMove: halvingBerry('Ice', 'Yache Berry'),
  },
  chople: {
    onTargetMove: halvingBerry('Fighting', 'Chople Berry'),
  },
  kebia: {
    onTargetMove: halvingBerry('Poison', 'Kebia Berry'),
  },
  shuca: {
    onTargetMove: halvingBerry('Ground', 'Shuca Berry'),
  },
  coba: {
    onTargetMove: halvingBerry('Flying', 'Coba Berry'),
  },
  payapa: {
    onTargetMove: halvingBerry('Psychic', 'Payapa Berry'),
  },
  tanga: {
    onTargetMove: halvingBerry('Bug', 'Tanga Berry'),
  },
  charti: {
    onTargetMove: halvingBerry('Rock', 'Charti Berry'),
  },
  kasib: {
    onTargetMove: halvingBerry('Ghost', 'Kasib Berry'),
  },
  haban: {
    onTargetMove: halvingBerry('Dragon', 'Haban Berry'),
  },
  colbur: {
    onTargetMove: halvingBerry('Dark', 'Colbur Berry'),
  },
  babiri: {
    onTargetMove: halvingBerry('Steel', 'Babiri Berry'),
  },
  liechi: {
    onTurnEnd: pinchBerry('attack', 'Liechi Berry'),
  },
  ganlon: {
    onTurnEnd: pinchBerry('defense', 'Ganlon Berry'),
  },
  salac: {
    onTurnEnd: pinchBerry('speed', 'Salac Berry'),
  },
  petaya: {
    onTurnEnd: pinchBerry('spAttack', 'Petaya Berry'),
  },
  apicot: {
    onTurnEnd: pinchBerry('spDefense', 'Apicot Berry'),
  },
  roseli: {
    onTargetMove: halvingBerry('Fairy', 'Roseli Berry'),
  },
  jaboca: {
    onTargetMove: (caster, target, move) => {
      const log = new Log()
      if (move.attackKey === 'attack') {
        log.add(`${target.species}'s Jacoba Berry activated`)
        log.add(`${caster.species} took damage`)
        if (getCondition(caster, 'Raid')) {
          log.push(logDamage(caster, caster.totalHp/32, true))
        } else {
          log.push(logDamage(caster, caster.totalHp/8, true))
        }
        target.heldItemConsumed = true
        target.heldItemTotallyConsumed = true
      }
      return log
    },
  },
  rowap: {
    onAfterTargetMove: ({caster, target, move}) => {
      const log = new Log()
      if (move.attackKey === 'spAttack') {
        log.add(`${caster.species}'s Rowap Berry activated`)
        log.add(`${target.species} took damage`)
        if (getCondition(caster, 'Raid')) {
          log.push(logDamage(target, caster.totalHp/32, true))
        } else {
          log.push(logDamage(target, caster.totalHp/8, true))
        }
        caster.heldItemConsumed = true
        caster.heldItemTotallyConsumed = true
      }
      return log
    },
  },
  lansat: {
    onAfterTargetMove: (inp, consumed) => {
      // Boost crit-hit in pinch
      if (inp.caster.currentHp / inp.caster.totalHp < 0.25 && !consumed) {
        BUFF_STAT(inp.caster, inp, 'criticalHit', 1)
        inp.caster.heldItemConsumed = true
        inp.caster.heldItemTotallyConsumed = true
        return new Log()
          .add(`${inp.caster.species}'s became fired up with the Lansat Berry`)
      }
      return new Log()
    },
  },
  starf: {
    onAfterTargetMove: ({caster}, consumed) => {
      // Boost random stat in pinch
      if (caster.currentHp / caster.totalHp < 0.25 && !consumed) {
        const stat = randomItem(['attack', 'defense', 'spAttack', 'spDefense', 'speed'])
        caster.statBuffs[stat]++
        caster.heldItemConsumed = true
        caster.heldItemTotallyConsumed = true
        return new Log()
          .add(`${caster.species}'s ${stat} rose with the Starf Berry`)
      }
      return new Log()
    },
  },
  enigma: {
    onAfterTargetMove: (inp: MoveInput, consumed: boolean) => {
      const {target, move} = inp
      const typeEffective = typeMultiplier(target, move.type)
      const log = new Log()
      if (typeEffective.mult > 1 && !consumed) {
        log.push(logHeal(target, target.totalHp / 4))
        log.add(`${target.species} healed damage with the Enigma Berry`)
        target.heldItemConsumed = true
        target.heldItemTotallyConsumed = true
      }
      return log
    },
  },
  micle: {
    onAfterTargetMove: ({caster}, consumed) => {
      // Replicate Starf Berry, as Accuracy does not exist
      // Boost random stat in pinch
      if (caster.currentHp / caster.totalHp < 0.25 && !consumed) {
        const stat = randomItem(['attack', 'defense', 'spAttack', 'spDefense', 'speed'])
        caster.statBuffs[stat]++
        caster.heldItemConsumed = true
        caster.heldItemTotallyConsumed = true
        return new Log()
          .add(`${caster.species}'s ${stat} rose with the Micle Berry`)
      }
      return new Log()
    },
  },
  cutsap: {
    onAfterTargetMove: ({caster}, consumed) => {
      if (caster.currentHp / caster.totalHp < 0.25 && !consumed) {
        APPLY_TEMP_STATUS(caster, ConditionMap.Quick)
        caster.heldItemConsumed = true
        caster.heldItemTotallyConsumed = true
        return new Log()
          .add(`${caster.species}'s priority rose with the Cutsap Berry`)
      }
      return new Log()
    },
  },
  oran: {
    onAfterTargetMove: ({caster}) => {
      if (caster.currentHp <= 0) return new Log()
      if (caster.heldItemConsumed) return new Log()
      if (caster.currentHp / caster.totalHp > 0.5) return new Log()
      const log = logHeal(caster, 10)
      log.add(`${caster.species} ate an Oran Berry. It recovered some health.`)
      caster.heldItemConsumed = true
      caster.heldItemTotallyConsumed = true
      return log
    },
  },
  aspear: {
    onAfterTargetMove: ({caster}) => {
      if (caster.currentHp <= 0) return new Log()
      if (caster.heldItemConsumed) return new Log()
      if (caster.status && caster.status.name === 'Frozen') {
        caster.heldItemConsumed = true
        caster.heldItemTotallyConsumed = true
        caster.status = undefined
        return new Log()
          .add(`${caster.species} ate an Aspear Berry. It thawed out.`)
      }
      return new Log()
    },
  },
  rawst: {
    onAfterTargetMove: ({caster}) => {
      if (caster.currentHp <= 0) return new Log()
      if (caster.heldItemConsumed) return new Log()
      if (caster.status && caster.status.name === 'Burn') {
        caster.heldItemConsumed = true
        caster.heldItemTotallyConsumed = true
        caster.status.onDeactivation!(caster)
        caster.status = undefined
        return new Log()
          .add(`${caster.species} ate a Rawst Berry. Its burn went away.`)
      }
      return new Log()
    },
  },
  chesto: {
    onAfterTargetMove: ({caster}) => {
      if (caster.currentHp <= 0) return new Log()
      if (caster.heldItemConsumed) return new Log()
      if (caster.status && caster.status.name === 'Asleep') {
        caster.heldItemConsumed = true
        caster.heldItemTotallyConsumed = true
        caster.status = undefined
        return new Log()
          .add(`${caster.species} ate a Chesto Berry. It woke up.`)
      }
      return new Log()
    },
  },
  lum: {
    onAfterTargetMove: removeStatus('ate a Lum Berry. It recovered.'),
  },
  cheri: {
    onAfterTargetMove: ({caster}) => {
      if (caster.currentHp <= 0) return new Log()
      if (caster.heldItemConsumed) return new Log()
      if (caster.status && caster.status.name === 'Paralyzed') {
        caster.heldItemConsumed = true
        caster.heldItemTotallyConsumed = true
        caster.status.onDeactivation!(caster)
        caster.status = undefined
        return new Log()
          .add(`${caster.species} ate a Cheri Berry. The paralysis faded away.`)
      }
      return new Log()
    },
  },
  pecha: {
    onAfterTargetMove: ({caster}) => {
      if (caster.currentHp <= 0) return new Log()
      if (caster.heldItemConsumed) return new Log()
      if (caster.status && caster.status.name === 'Poison') {
        caster.heldItemConsumed = true
        caster.heldItemTotallyConsumed = true
        caster.status = undefined
        removeCondition(caster, 'PoisonBad') // Remove toxic if applicable.
        return new Log()
          .add(`${caster.species} ate a Pecha Berry. The poison dissolved.`)
      }
      return new Log()
    },
  },
  persim: {
    onAfterTargetMove: ({caster}) => {
      if (caster.currentHp <= 0) return new Log()
      if (caster.heldItemConsumed) return new Log()
      const confusion = getCondition(caster, 'Confusion')
      if (confusion) {
        caster.heldItemConsumed = true
        caster.heldItemTotallyConsumed = true
        removeCondition(caster, 'Confusion')
        return new Log()
          .add(`${caster.species} ate a Persim Berry. It's no longer confused.`)
      }
      return new Log()
    },
  },
  sitrus: {
    onAfterTargetMove: ({caster}) => {
      if (caster.currentHp <= 0) return new Log()
      if (caster.currentHp / caster.totalHp > 0.5) return new Log()
      if (caster.heldItemConsumed) return new Log()
      const log = logHeal(caster, caster.totalHp / 4)
      log.add(`${caster.species} ate a Sitrus Berry. It recovered some health.`)
      caster.heldItemConsumed = true
      caster.heldItemTotallyConsumed = true
      return log
    },
  },
  figy: {
    onAfterTargetMove: ({caster}) => {
      if (caster.currentHp <= 0) return new Log()
      if (caster.currentHp / caster.totalHp > 0.5) return new Log()
      const log = logHeal(caster, caster.totalHp / 3)
      log.add(`${caster.species} ate a Figy Berry. It recovered some health.`)
      log.push(APPLY_TEMP_STATUS(caster, ConditionMap.Confusion,
          `${caster.species} became confused.`))
      caster.heldItemConsumed = true
      caster.heldItemTotallyConsumed = true
      return log
    },
  },
  /* OTHER HELD ITEMS */
  amuletcoin: {
    onAfterCasterMoveOnce: (inp) => {
      // There's no access to field at start of match.
      inp.field.sides[inp.prefix].goldCoins = true
      return new Log()
    },
  },
  brightpowder: {
    onTargetMove: (_, __, move) => {
      move.accuracy -= 0.1 // Remove 10% from accuracy
      return new Log()
    },
  },
  focusband: {
    onAfterTargetMove: ({caster}) => {
      // If the wielder of the item is about to faint, there is
      // a 20% chance the focus band activates and the Pokémon
      // survives with 1 hp
      if (!caster.fainted && caster.currentHp <= 0 && Math.random() < 0.2) {
        caster.currentHp = 1
        return new Log()
          .add(`${caster.species} held on with the Focus Band!`)
      }
      return new Log()
    },
  },
  kingsrock: {
    onCasterMove: ({target}) => {
      if (Math.random() < 0.1) {
        // Activate flinch
        APPLY_TEMP_STATUS(target, ConditionMap.Flinch)
      }
      return new Log()
    },
  },
  leek: {
    onCasterMove: ({caster, move}) => {
      // Boosts critical-hit ratio for these birds
      if (caster.species === `Farfetch'd` ||
          caster.species === `Sirfetch'd`) {
            move.criticalHit *= 3
      }
      return new Log()
    },
  },
  leftovers: {
    onTurnEnd: (caster) => {
      if (caster.currentHp <= 0) return new Log()
      if (caster.currentHp === caster.totalHp) return new Log()
      const log = logHeal(caster, caster.totalHp / 16)
      log.add(`${caster.species} restored some health with leftovers`)
      return log
    },
  },
  lifeorb: {
    onCasterMove: ({caster, move}) => {
      if (getCondition(caster, 'Raid')) return new Log()
      move.power *= 1.3
      return new Log()
    },
    onAfterCasterMoveOnce: ({caster}) => {
      return logDamage(caster, caster.totalHp / 10, true)
    },
  },
  lightball: {
    onBattleStart: (caster) => {
      // Boost Pikachu's attacks
      if (caster.species === 'Pikachu') {
        caster.attack *= 2
        caster.spAttack *= 2
      }
      return new Log()
    },
  },
  luckypunch: {
    onCasterMove: ({caster, move}) => {
      if (caster.species === 'Chansey') {
        // Doubles Chansey's critical-hit ratio
        move.criticalHit *= 3
      }
      return new Log()
    },
  },
  metalpowder: {
    onBattleStart: (caster) => {
      // Boost Ditto's defenses
      if (caster.species === 'Ditto') {
        caster.defense *= 1.5
        caster.spDefense *= 1.5
      }
      return new Log()
    },
  },
  scopelens: {
    onCasterMove: ({move}) => {
      move.criticalHit *= 2
      return new Log()
    },
  },
  thickclub: {
    onBattleStart: (caster) => {
      // Doubles attack stat of Cubone and Marowak
      if (caster.species === 'Cubone' ||
          caster.species === 'Marowak') {
            caster.attack *= 2
      }
      return new Log()
    },
  },
  quickclaw: {},
  shellbell: {
    onAfterCasterMoveOnce: ({caster}, _, damage: number) => {
      return logHeal(caster, damage / 8)
    }
  },
  souldew: {
    onCasterMove: ({caster, move}) => {
      // Increases Psychic/Dragon type moves
      if (caster.species === 'Latias' || caster.species === 'Latios') {
        if (move.type === 'Dragon' || move.type === 'Psychic') {
          move.power *= 1.2
        }
      }
      return new Log()
    },
  },
  /** Held items, RSE */
  seaincense: {
    onCasterMove: boostType('Water'),
  },
  laxincense: {
    // Same as Brightpowder
    onTargetMove: (_, __, move) => {
      move.accuracy -= 0.1 // Remove 10% from accuracy
      return new Log()
    },
  },
  deepseatooth: {
    onBattleStart: (caster) => {
      // Doubles spattack stat of Clamperl
      if (caster.species === 'Clamperl') {
        caster.spAttack *= 2
      }
      return new Log()
    },
  },
  deepseascale: {
    onBattleStart: (caster) => {
      // Doubles spdef stat of Clamperl
      if (caster.species === 'Clamperl') {
        caster.spDefense *= 2
      }
      return new Log()
    },
  },
  /** Held items, DPPt */
  rockincense: {
    onCasterMove: boostType('Rock'),
  },
  oddincense: {
    onCasterMove: boostType('Psychic'),
  },
  fullincense: {
    onBattleStart: (caster) => {
      // Should make the caster last in the priority tier
      // But let's just cut the speed to be simpler
      caster.speed /= 2
      return nop()
    },
  },
  roseincense: {
    onCasterMove: boostType('Grass'),
  },
  waveincense: {
    onCasterMove: boostType('Water'),
  },
  razorfang: {
    onCasterMove: ({target}) => {
      if (Math.random() < 0.1) {
        // Activate flinch
        APPLY_TEMP_STATUS(target, ConditionMap.Flinch)
      }
      return new Log()
    },
  },
  razorclaw: {
    onCasterMove: ({move}) => {
      move.criticalHit *= 2
      return new Log()
    },
  },
  widelens: {
    onCasterMove: ({move}) => {
      move.accuracy *= 1.1
      return new Log()
    },
  },
  pewtercrunchies: {
    onAfterTargetMove: removeStatus('ate Pewter Crunchies. It recovered.'),
  },
  ragecandybar: {
    onAfterTargetMove: removeStatus('ate a Rage Candy Bar. It recovered.'),
  },
  lavacookie: {
    onAfterTargetMove: removeStatus('ate a Lava Cookie. It recovered.'),
  },
  jubilifemuffin: {
    onAfterTargetMove: removeStatus(`ate a Jubilife Muffin. It recovered.`),
  },
  oldgateau: {
    onAfterTargetMove: removeStatus(`ate an Old Gateau. It recovered.`),
  },
  casteliacone: {
    onAfterTargetMove: removeStatus(`ate a Castelia Cone. It recovered.`),
  },
  shaloursable: {
    onAfterTargetMove: removeStatus(`ate a Shalour Sable. It recovered.`),
  },
  lumiosegalette: {
    onAfterTargetMove: removeStatus(`ate a Lumiose Galette. It recovered.`),
  },
  bigmalasada: {
    onAfterTargetMove: removeStatus(`ate a Big Malasada. It recovered.`),
  },
  choiceband: {
    onBattleStart: (caster) => {
      if (caster.movepool.length > 1) {
        caster.movepool.splice(1, caster.movepool.length - 1)
        caster.attack *= 1.5
      }
      return new Log()
      // It would not be fair to boost attack if there was only one usable move
    },
  },
  choicespecs: {
    onBattleStart: (caster) => {
      if (caster.movepool.length > 1) {
        caster.movepool.splice(1, caster.movepool.length - 1)
        caster.spAttack *= 1.5
      }
      return new Log()
      // It would not be fair to boost if there was only one usable move
    },
  },
  choicescarf: {
    onBattleStart: (caster) => {
      if (caster.movepool.length > 1) {
        caster.movepool.splice(1, caster.movepool.length - 1)
        caster.speed *= 1.5
      }
      return new Log()
      // It would not be fair to boost if there was only one usable move
    },
  },
  expertbelt: {
    onCasterMove: ({target, move}) => {
      const typeEffective = typeMultiplier(target, move.type)
      if (typeEffective.mult > 1) {
        move.power *= 1.2
      }
      return new Log()
    },
  },
  blacksludge: {
    onTurnEnd: (caster) => {
      const divisor = (() => {
        if (getCondition(caster, 'Raid')) {
          return 32
        }
        return 16
      })()
      if (caster.type1 === 'Poison' || caster.type2 === 'Poison') {
        return logHeal(caster, caster.totalHp / divisor)
      }
      return logDamage(caster, caster.totalHp / divisor, true)
    },
  },
  flameorb: {
    onTurnEnd: (caster) => {
      if (caster.type1 === 'Fire' || caster.type2 === 'Fire') {
        return new Log()
      }
      if (!caster.status) {
        return APPLY_STATUS(caster, 'Burn', `${caster.species} burned themselves!`)
      }
      return new Log()
    },
  },
  toxicorb: {
    onTurnEnd: (caster) => {
      if (caster.type1 === 'Poison' || caster.type1 === 'Steel' ||
          caster.type2 === 'Poison' || caster.type2 === 'Steel') {
            return new Log()
      }
      if (!caster.status) {
        const log = APPLY_STATUS(caster, 'Poison', `${caster.species} poisoned themselves!`)
        log.push(APPLY_TEMP_STATUS(caster, ConditionMap.PoisonBad, `${caster.species} was badly poisoned`))
        return log
      }
      return new Log()
    },
  },
  metronome: {
    onBattleStart: (caster) => {
      if (caster.movepool.length > 1) {
        caster.movepool.splice(1, caster.movepool.length - 1)
      } else {
        caster.heldItemConsumed = true
      }
      return new Log()
    },
    onTurnEnd: (caster) => {
      if (getCondition(caster, 'Switcherooed')) return new Log()
      caster.attack *= 1.1
      caster.spAttack *= 1.1
      return new Log()
    },
  },
  stickybarb: {
    onTurnEnd: (caster) => {
      const ratio = getCondition(caster, 'Raid') ? 64 : 8
      return logDamage(caster, caster.totalHp / ratio, true)
    },
    onTargetMove: (caster, target, move) => {
      const ratio = getCondition(caster, 'Raid') ? 64 : 8
      const log = new Log()
      if (move.contact) {
        log.push(logDamage(caster, caster.totalHp / ratio, true))
      }
      if (!caster.heldItem) {
        caster.heldItem = target.heldItem
        target.heldItem = undefined
        log.add(`The sticky barb detached from ${target.species} and clung to ${caster.species}.`)
      }
      return log
    },
  },
  adamantorb: {
    onCasterMove: ({caster, move}) => {
      if (caster.species === 'Dialga') {
        if (move.type === 'Steel' || move.type === 'Dragon') {
          move.power *= 1.2
        }
      }
      return new Log()
    },
  },
  griseousorb: {
    onCasterMove: ({caster, move}) => {
      if (caster.species === 'Girantina') {
        if (move.type === 'Ghost' || move.type === 'Dragon') {
          move.power *= 1.2
        }
      }
      return new Log()
    },
  },
  lustrousorb: {
    onCasterMove: ({caster, move}) => {
      if (caster.species === 'Palkia') {
        if (move.type === 'Water' || move.type === 'Dragon') {
          move.power *= 1.2
        }
      }
      return new Log()
    },
  },
  insectplate: {
    onBattleStart: arceusType('Bug'),
    onCasterMove: boostType('Bug')
  },
  dreadplate: {
    onBattleStart: arceusType('Dark'),
    onCasterMove: boostType('Dark')
  },
  dracoplate: {
    onBattleStart: arceusType('Dragon'),
    onCasterMove: boostType('Dragon')
  },
  earthplate: {
    onBattleStart: arceusType('Ground'),
    onCasterMove: boostType('Ground')
  },
  fistplate: {
    onBattleStart: arceusType('Fighting'),
    onCasterMove: boostType('Fighting')
  },
  flameplate: {
    onBattleStart: arceusType('Fire'),
    onCasterMove: boostType('Fire')
  },
  icicleplate: {
    onBattleStart: arceusType('Ice'),
    onCasterMove: boostType('Ice')
  },
  ironplate: {
    onBattleStart: arceusType('Steel'),
    onCasterMove: boostType('Steel')
  },
  meadowplate: {
    onBattleStart: arceusType('Grass'),
    onCasterMove: boostType('Grass')
  },
  mindplate: {
    onBattleStart: arceusType('Psychic'),
    onCasterMove: boostType('Psychic')
  },
  pixieplate: {
    onBattleStart: arceusType('Fairy'),
    onCasterMove: boostType('Fairy')
  },
  skyplate: {
    onBattleStart: arceusType('Flying'),
    onCasterMove: boostType('Flying')
  },
  splashplate: {
    onBattleStart: arceusType('Water'),
    onCasterMove: boostType('Water')
  },
  spookyplate: {
    onBattleStart: arceusType('Ghost'),
    onCasterMove: boostType('Ghost')
  },
  stoneplate: {
    onBattleStart: arceusType('Rock'),
    onCasterMove: boostType('Rock')
  },
  toxicplate: {
    onBattleStart: arceusType('Poison'),
    onCasterMove: boostType('Poison')
  },
  zapplate: {
    onBattleStart: arceusType('Electric'),
    onCasterMove: boostType('Electric')
  },
  airballoon: {
    onBattleStart: (caster) => {
      return new Log()
        .push(APPLY_TEMP_STATUS(caster, ConditionMap.Float))
    },
    onAfterTargetMove: ({caster}) => {
      if (caster.heldItemConsumed) return new Log()
      removeCondition(caster, 'Float')
      caster.heldItemConsumed = true
      caster.heldItemTotallyConsumed = true
      return new Log()
        .add(`${caster.species}'s balloon popped!`)
    },
  },
  floatstone: {
    onBattleStart: (caster) => {
      caster.weight /= 2
      return new Log()
    }
  },
  healthwing: {
    onTurnEnd: (caster) => {
      if (caster.heldItemConsumed) return new Log()
      caster.heldItemConsumed = true
      caster.heldItemTotallyConsumed = true
      // Heals (up to) 12.5% at end of first turn
      return new Log()
        .add!(`${caster.species} ate a feather. It's health improved.`)
        .push!(logHeal(caster, caster.totalHp / 8))
    },
  },
  musclewing: {
    onBattleStart: (caster) => {
      // Boosts one stat level
      caster.heldItemConsumed = true
      caster.heldItemTotallyConsumed = true
      caster.statBuffs.attack++
      return new Log()
        .add(`${caster.species} ate a feather. Its attack improved.`)
    },
  },
  resistwing: {
    onBattleStart: (caster) => {
      // Boosts one stat level
      caster.heldItemConsumed = true
      caster.heldItemTotallyConsumed = true
      caster.statBuffs.defense++
      return new Log()
        .add(`${caster.species} ate a feather. Its defense improved.`)
    },
  },
  geniuswing: {
    onBattleStart: (caster) => {
      // Boosts one stat level
      caster.heldItemConsumed = true
      caster.heldItemTotallyConsumed = true
      caster.statBuffs.spAttack++
      return new Log()
        .add(`${caster.species} ate a feather. Its special attack improved.`)
    },
  },
  cleverwing: {
    onBattleStart: (caster) => {
      // Boosts one stat level
      caster.heldItemConsumed = true
      caster.heldItemTotallyConsumed = true
      caster.statBuffs.spDefense++
      return new Log()
        .add(`${caster.species} ate a feather. Its special defense improved.`)
    },
  },
  swiftwing: {
    onBattleStart: (caster) => {
      // Boosts one stat level
      caster.heldItemConsumed = true
      caster.heldItemTotallyConsumed = true
      caster.statBuffs.speed++
      return new Log()
        .add(`${caster.species} ate a feather. Its speed improved.`)
    },
  },
  absorbbulb: {
    onAfterTargetMove: ({caster, move}) => {
      const log = new Log()
      if (caster.heldItemConsumed) return log
      if (move.type !== 'Water') return log
      caster.statBuffs.spAttack++
      caster.heldItemConsumed = true
      caster.heldItemTotallyConsumed = true
      return log
        .add(`${caster.species}'s bulb took the attack. Their special attack rose.`)
    }
  },
  cellbattery: {
    onAfterTargetMove: ({caster, move}) => {
      const log = new Log()
      if (caster.heldItemConsumed) return log
      if (move.type !== 'Electric') return log
      caster.statBuffs.attack++
      caster.heldItemConsumed = true
      caster.heldItemTotallyConsumed = true
      return log
        .add(`${caster.species}'s battery took the attack. Their attack rose.`)
    }
  },
  rockyhelmet: {
    onAfterTargetMove: ({caster, move}) => {
      const log = new Log()
      if (!move.contact) return log
      const dmg = (() => {
        if (getCondition(caster, 'Raid')) {
          return 128
        }
        return 16
      })()
      log.add(`${caster.species} collided with a rocky helmet`)
      log.push(logDamage(caster, caster.totalHp/dmg, true))
      return log
    },
  },
  ringtarget: {
    onTargetMove: (caster, _, move) => {
      if (caster.heldItemConsumed) return new Log()

      let mult = typeMatchup[move.type][caster.type1]
      if (caster.type2) {
        mult *= typeMatchup[move.type][caster.type2]
      }
      if (mult === 0) {
        move.type = 'Status' // Make it hit neutrally.
      }
      return new Log()
    }
  },
  bindingband: {
      },
  eviolite: {
    onTargetMove: (caster, _, move) => {
      if (caster.levelTo) {
        move.power /= 1.5
      }
      return new Log()
    }
  },
  fightinggem: {
    onCasterMove: gem('Fighting'),
  },
  darkgem: {
    onCasterMove: gem('Dark'),
  },
  dragongem: {
    onCasterMove: gem('Dragon'),
  },
  rockgem: {
    onCasterMove: gem('Rock'),
  },
  grassgem: {
    onCasterMove: gem('Grass'),
  },
  watergem: {
    onCasterMove: gem('Water'),
  },
  icegem: {
    onCasterMove: gem('Ice'),
  },
  groundgem: {
    onCasterMove: gem('Ground'),
  },
  normalgem: {
    onCasterMove: gem('Normal'),
  },
  buggem: {
    onCasterMove: gem('Bug'),
  },
  ghostgem: {
    onCasterMove: gem('Ghost'),
  },
  firegem: {
    onCasterMove: gem('Fire'),
  },
  electricgem: {
    onCasterMove: gem('Electric'),
  },
  poisongem: {
    onCasterMove: gem('Poison'),
  },
  flyinggem: {
    onCasterMove: gem('Flying'),
  },
  psychicgem: {
    onCasterMove: gem('Psychic'),
  },
  fairygem: {
    onCasterMove: gem('Fairy'),
  },
  steelgem: {
    onCasterMove: gem('Steel'),
  },
  chilldrive: {
      },
  burndrive: {
      },
  shockdrive: {
      },
  dousedrive: {
      },
  mentalherb: {
    onTurnEnd: (caster) => {
      const log = new Log()
      if (getCondition(caster, 'Infatuated')) {
        log.add(`${caster.species} used its Mental Herb`)
        removeCondition(caster, 'Infatuated')
      }
      return log
    }
  },
  whiteherb: {
    onTurnEnd: (caster) => {
      const log = new Log()
      let consume = false
      if (caster.statBuffs.attack < 0) {
        consume = true
        caster.statBuffs.attack = 0
      }
      if (caster.statBuffs.defense < 0) {
        consume = true
        caster.statBuffs.defense = 0
      }
      if (caster.statBuffs.spAttack < 0) {
        consume = true
        caster.statBuffs.spAttack = 0
      }
      if (caster.statBuffs.spDefense < 0) {
        consume = true
        caster.statBuffs.spDefense = 0
      }
      if (caster.statBuffs.speed < 0) {
        consume = true
        caster.statBuffs.speed = 0
      }
      if (consume) {
        log.add(`${caster.species} returned its stats to normal`)
        caster.heldItemConsumed = true
        caster.heldItemTotallyConsumed = true
      }
      return log
    }
  },
  powerherb: {
      },
  assaultvest: {
    onBattleStart: (caster) => {
      // Remove support moves
      const movepool: Move[] = []
      for (let i = 0; i < caster.movepool.length; i++) {
        if (!SupportMoves.includes(caster.movepool[i].name as MoveId)) {
          movepool.push(caster.movepool[i])
        }
      }
      caster.movepool = movepool
      caster.spDefense *= 1.5 // Boost sp def
      return new Log()
    },
  },
  weaknesspolicy: {
    onAfterTargetMove: (inp: MoveInput, consumed: boolean) => {
      const {caster, move} = inp
      const typeEffective = typeMultiplier(caster, move.type)
      const log = new Log()
      if (typeEffective.mult > 1 && !consumed) {
        log.add(`${caster.species}'s Weakness Policy is filing a claim!`)
        log.push(BUFF_STAT(caster, inp, 'attack', 2))
        log.push(BUFF_STAT(caster, inp, 'spAttack', 2))
        caster.heldItemConsumed = true
        caster.heldItemTotallyConsumed = true
      }
      return log
    },
  },
  ironball: {
    onBattleStart: (caster) => {
      caster.speed /= 2
      return APPLY_TEMP_STATUS(caster, ConditionMap.Grounded, 'SMACK!')
    }
  },
  luminousmoss: {
    onAfterTargetMove: (inp) => {
      if (inp.caster.heldItemConsumed) return new Log()
      if (inp.move.type === 'Water') {
        const log = BUFF_STAT(inp.caster, inp, 'spDefense', 1)
        log.add('The luminous moss liked the water.')
        inp.caster.heldItemConsumed = true
        inp.caster.heldItemTotallyConsumed = true
        return log
      }
      return new Log()
    }
  },
  snowball: {
    onAfterTargetMove: (inp) => {
      if (inp.caster.heldItemConsumed) return new Log()
      if (inp.move.type === 'Ice') {
        const log = BUFF_STAT(inp.caster, inp, 'attack', 1)
        log.add('The snowball liked the ice.')
        inp.caster.heldItemConsumed = true
        inp.caster.heldItemTotallyConsumed = true
        return log
      }
      return new Log()
    }
  },
  safetygoggles: {
      },
  gardevoirite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Gardevoir)
    },    
  },
  venusaurite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Venusaur)
    },
  },
  charizarditex: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Charizard, 'megax')
    },
  },
  charizarditey: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Charizard, 'megay')
    },
  },
  blastoiseite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Blastoise)
    },
  },
  alakazamite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Alakazam)
    },
  },
  gengarite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Gengar)
    },
  },
  absolite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Absol)
    },
  },
  aerodactylite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Aerodactyl)
    },
  },
  ampharosite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Ampharos)
    },
  },
  banetteite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Banette)
    },
  },
  blueorb: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Kyogre)
    },
  },
  gyaradosite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Gyarados)
    },
  },
  heracrossite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Heracross)
    },
  },
  lucarioite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Lucario)
    },
  },
  manectricite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Manectric)
    },
  },
  mawileite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Mawile)
    },
  },
  medichamite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Medicham)
    },
  },
  mewtwoitex: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Mewtwo, 'megax')
    },
  },
  mewtwoitey: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Mewtwo, 'megay')
    },
  },
  pinsirite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Pinsir)
    },
  },
  redorb: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Groudon)
    },
  },
  scizorite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Scizor)
    },
  },
  beedrillite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Beedrill)
    },
  },
  pidgeotite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Pidgeot)
    },
  },
  slowbroite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Slowbro)
    },
  },
  kangaskhanite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Kangaskhan)
    },
  },
  steelixite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Steelix)
    },
  },
  houndoomite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Houndoom)
    },
  },
  tyranitarite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Tyranitar)
    },
  },
  sceptileite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Sceptile)
    },
  },
  abomasnowite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Abomasnow)
    },
  },
  aggronite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Aggron)
    },
  },
  audinoite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Audino)
    },
  },
  blazikenite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Blaziken)
    },
  },
  galladeite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Gallade)
    },
  },
  garchompite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Garchomp)
    },
  },
  glalieite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Glalie)
    },
  },
  latiasite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Latias)
    },
  },
  latiosite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Latios)
    },
  },
  lopunnyite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Lopunny)
    },
  },
  metagrossite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Metagross)
    },
  },
  sableyeite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Sableye)
    },
  },
  salamenceite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Salamence)
    },
  },
  swampertite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Swampert)
    },
  },
  sharpedoite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Sharpedo)
    },
  },
  cameruptite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Camerupt)
    },
  },
  altariaite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Altaria)
    },
  },
  diancieite: {
    onBattleStart: (caster) => {
      return performMegaEvolution(caster, P.Diancie)
    },
  },
  bigroot: {},
  gripclaw: {},
  lightclay: {},
  quickpowder: {
    onBattleStart: (caster) => {
      // Boost Ditto's speed
      if (caster.species === 'Ditto') {
        caster.speed *= 2
      }
      return new Log()
    },
  },
  laggingtail: {
    onBattleStart: (caster) => {
      caster.speed = 1 // Set to lowest
      return new Log()
    },
    onTurnEnd: (caster, _, field) => {
      if (field.trickRoom) {
        caster.speed = Infinity // Remains slowest even in TR
      } else {
        caster.speed = 1
      }
      return new Log()
    }
  },
  bugmemory: rksMemory('Bug'),
  darkmemory: rksMemory('Dark'),
  dragonmemory: rksMemory('Dragon'),
  fairymemory: rksMemory('Fairy'),
  firememory: rksMemory('Fire'),
  flyingmemory: rksMemory('Flying'),
  electricmemory: rksMemory('Electric'),
  grassmemory: rksMemory('Grass'),
  fightingmemory: rksMemory('Fighting'),
  ghostmemory: rksMemory('Ghost'),
  groundmemory: rksMemory('Ground'),
  rockmemory: rksMemory('Rock'),
  icememory: rksMemory('Ice'),
  poisonmemory: rksMemory('Poison'),
  watermemory: rksMemory('Water'),
  steelmemory: rksMemory('Steel'),
  psychicmemory: rksMemory('Psychic'),
  electricseed: {
    onTurnEnd: (caster, _, field) => {
      if (field.terrain?.name === 'Electric' && !caster.heldItemConsumed) {
        caster.heldItemConsumed = true
        caster.heldItemTotallyConsumed = true
        caster.statBuffs.defense++ // Danger of overflow
        return new Log().add(`${caster.species} got a defense buff from the Electric Seed.`)
      }
      return new Log()
    }
  },
  grassyseed: {
    onTurnEnd: (caster, _, field) => {
      if (field.terrain?.name === 'Grassy' && !caster.heldItemConsumed) {
        caster.heldItemConsumed = true
        caster.heldItemTotallyConsumed = true
        caster.statBuffs.defense++ // Danger of overflow
        return new Log().add(`${caster.species} got a defense buff from the Grassy Seed.`)
      }
      return new Log()
    }
  },
  mistyseed: {
    onTurnEnd: (caster, _, field) => {
      if (field.terrain?.name === 'Misty' && !caster.heldItemConsumed) {
        caster.heldItemConsumed = true
        caster.heldItemTotallyConsumed = true
        caster.statBuffs.spDefense++ // Danger of overflow
        return new Log().add(`${caster.species} got a special defense buff from the Misty Seed.`)
      }
      return new Log()
    }
  },
  psychicseed: {
    onTurnEnd: (caster, _, field) => {
      if (field.terrain?.name === 'Psychic' && !caster.heldItemConsumed) {
        caster.heldItemConsumed = true
        caster.heldItemTotallyConsumed = true
        caster.statBuffs.spDefense++ // Danger of overflow
        return new Log().add(`${caster.species} got a special defense buff from the Psychic Seed.`)
      }
      return new Log()
    }
  },
  protectivepads: {
    onCasterMove: ({move}) => {
      move.contact = false // Always override
      return new Log()
    }
  },
  bottlecapatk: {
    onBattleStart: (caster) => {
      caster.attack += 16
      return new Log().add(`${caster.species} exchanged its bottle cap for an Attack boost`)
    }
  },
  bottlecapdef: {
    onBattleStart: (caster) => {
      caster.defense += 16
      return new Log().add(`${caster.species} exchanged its bottle cap for a Defense boost`)
    }
  },
  bottlecapspa: {
    onBattleStart: (caster) => {
      caster.spAttack += 16
      return new Log().add(`${caster.species} exchanged its bottle cap for a Special Attack boost`)
    }
  },
  bottlecapspd: {
    onBattleStart: (caster) => {
      caster.spDefense += 16
      return new Log().add(`${caster.species} exchanged its bottle cap for a Special Defense boost`)
    }
  },
  bottlecapspe: {
    onBattleStart: (caster) => {
      caster.speed += 16
      return new Log().add(`${caster.species} exchanged its bottle cap for a Speed boost`)
    }
  },
  bottlecaphp: {
    onBattleStart: (caster) => {
      caster.currentHp += 16
      caster.totalHp += 16
      return new Log().add(`${caster.species} exchanged its bottle cap for an HP boost`)
    }
  },
  bottlecapgold: {
    onBattleStart: (caster) => {
      caster.attack += 16
      caster.defense += 16
      caster.spAttack += 16
      caster.spDefense += 16
      caster.speed += 16
      caster.currentHp += 16
      caster.totalHp += 16
      return new Log().add(`${caster.species} exchanged its bottle cap for stat boosts`)
    }
  },
  // Actually terrains are always set, so this doesn't do anything...
  terrainextender: {},
  choicedumpling: {
    onBattleStart: (caster) => {
      if (caster.movepool.length > 1) {
        caster.movepool.splice(1, caster.movepool.length - 1)
        caster.attack *= 1.5
        caster.spAttack *= 1.5
        caster.defense *= 0.67
        caster.spDefense *= 0.67
        caster.heldItemConsumed = true
        caster.heldItemTotallyConsumed = true
        return new Log().add(`${caster.species} consumed the Choice Dumpling.`)
      }
      return new Log()
      // It would not be fair to boost attack if there was only one usable move
    },
  },
  swapsnack: {
    onBattleStart: (caster) => {
      const {attack, defense, spAttack, spDefense} = caster
      caster.heldItemConsumed = true
      caster.heldItemTotallyConsumed = true
      caster.attack = defense
      caster.defense = attack
      caster.spAttack = spDefense
      caster.spDefense = spAttack
      return new Log().add(`${caster.species} consumed the Swap Snack. Its offensive and defensive stats swapped.`)
    },
  },
  twicespicedradish: {
    onBattleStart: (caster) => {
      caster.heldItemConsumed = true
      caster.heldItemTotallyConsumed = true
      caster.attack *= 1.5
      caster.spAttack *= 1.5
      return new Log().add(`${caster.species} consumed the Twice-Spiced Radish. It adopted a hard-hitting stance.`)
    },
  },
  zbuginium: simpleZCrystal('Bug'),
  zdarkinium: simpleZCrystal('Dark'),
  zdragonium: simpleZCrystal('Dragon'),
  zelectrium: simpleZCrystal('Electric'),
  zfairium: simpleZCrystal('Fairy'),
  zfightinium: simpleZCrystal('Fighting'),
  zfirium: simpleZCrystal('Fire'),
  zflyinium: simpleZCrystal('Flying'),
  zghostium: simpleZCrystal('Ghost'),
  zgrassium: simpleZCrystal('Grass'),
  zgroundium: simpleZCrystal('Ground'),
  zicium: simpleZCrystal('Ice'),
  znormalium: simpleZCrystal('Normal'),
  zpoisonium: simpleZCrystal('Poison'),
  zpsychicium: simpleZCrystal('Psychic'),
  zrockium: simpleZCrystal('Rock'),
  zsteelium: simpleZCrystal('Steel'),
  zwaterium: simpleZCrystal('Water'),
  zaloraichium: complexZCrystal('Stoked Sparksurfer'),
  zdecidium: complexZCrystal('Sinister Arrow Raid'),
  zeevium: complexZCrystal('Extreme Evoboost'),
  zincinium: complexZCrystal('Malicious Moonsault'),
  zmarshadium: complexZCrystal('Soul-Stealing 7-Star Strike'),
  zmewnium: complexZCrystal('Genesis Supernova'),
  zpikanium: complexZCrystal('Catastropika'),
  zpikashunium: complexZCrystal('10_000_000 Volt Thunderbolt'),
  zprimarium: complexZCrystal('Oceanic Operetta'),
  zsnorlium: complexZCrystal('Pulverizing Pancake'),
  ztapunium: complexZCrystal('Guardian of Alola'),
  zkommonium: complexZCrystal('Clangorous Soulblaze'),
  zlunalium: complexZCrystal('Menacing Moonraze Maelstrom'),
  zlycanium: complexZCrystal('Splintered Stormshards'),
  zmimikium: complexZCrystal("Let's Snuggle Forever"),
  zsolganium: complexZCrystal('Searing Sunraze Smash'),
  zultranecrozium: complexZCrystal('Light That Burns the Sky'),
  dynamaxcandy: {
    onBattleStart: (caster) => {
      // DYNAMAX!
      if (caster.heldItemConsumed) {
        return new Log().add('Dynamax is not supported in this format.')
      }
      const log = new Log()
      log.add(`Come back for a minute, ${caster.species}`)
      log.add(`${caster.species} consumed Dynamax Candy`)
      log.add(`${caster.species} began growing!`)
      const dyna = {...ConditionMap.Dynamaxed}
      dyna.p = {
        moves: caster.move,
        movepool: caster.movepool,
      }
      const powers = caster.movepool.map(mp => {
        return maxMovePower(mp.power, mp.accuracy)        
      })
      log.push(APPLY_TEMP_STATUS(caster, dyna, `${caster.species} dynamaxed!`))
      caster.move = getMaxMoveset(caster.move)
      caster.movepool = caster.move.map((m, i) => {
        const mp = {...Movepool[m]}
        mp.power = powers[i]
        return mp
      })
      caster.heldItemConsumed = true
      caster.heldItemTotallyConsumed = true
      caster.currentHp *= 2
      caster.totalHp *= 2
      return log
    }
  },
  maxmushroom: {
    onBattleStart: (caster) => {
      // GIGANTAMAX!
      if (caster.heldItemConsumed) {
        return new Log().add('Gigantamax is not supported in this format.')
      }
      const log = new Log()
      log.add(`Come back for a minute, ${caster.species}`)
      const hasGmax = get(caster.badge.toLegacyString())?.gmax
      if (!hasGmax) {
        log.add(`${caster.species} does not like mushrooms`)
        return log
      }
      log.add(`${caster.species} consumed Max Mushrooms`)
      log.add(`${caster.species} began growing! Its form is changing!`)
      const dyna = {...ConditionMap.Dynamaxed}
      dyna.p = {
        moves: caster.move,
        movepool: caster.movepool,
      }
      const powers = caster.movepool.map(mp => {
        return maxMovePower(mp.power, mp.accuracy)        
      })
      log.push(APPLY_TEMP_STATUS(caster, dyna, `${caster.species} gigantamaxed!`))
      caster.move = getMaxMoveset(caster.move, hasGmax.gmaxMove)
      caster.movepool = caster.move.map((m, i) => {
        const mp = {...Movepool[m]}
        mp.power = powers[i]
        return mp
      })
      caster.heldItemConsumed = true
      caster.heldItemTotallyConsumed = true
      caster.currentHp *= 2
      caster.totalHp *= 2
      return log
    }
  },
  maxhoney: {
    onBattleStart: (caster) => {
      // GIGANTAMAX!
      if (caster.heldItemConsumed) {
        return new Log().add('Gigantamax is not supported in this format.')
      }
      const log = new Log()
      log.add(`Come back for a minute, ${caster.species}`)
      const hasGmax = get(caster.badge.toLegacyString())?.gmax
      if (!hasGmax) {
        log.add(`${caster.species} does not like the honey`)
        return log
      }
      log.add(`${caster.species} consumed Max Honey`)
      log.add(`${caster.species} began growing! Its form is changing!`)
      const dyna = {...ConditionMap.Dynamaxed}
      dyna.p = {
        moves: caster.move,
        movepool: caster.movepool,
      }
      const powers = caster.movepool.map(mp => {
        return maxMovePower(mp.power, mp.accuracy)        
      })
      log.push(APPLY_TEMP_STATUS(caster, dyna, `${caster.species} gigantamaxed!`))
      caster.move = getMaxMoveset(caster.move)
      caster.movepool = caster.move.map((m, i) => {
        const mp = {...Movepool[m]}
        mp.power = powers[i]
        return mp
      })
      caster.heldItemConsumed = true
      caster.heldItemTotallyConsumed = true
      caster.currentHp *= 2
      caster.totalHp *= 2
      return log
    }
  },
  blunderpolicy: {
    onMiss: (inp) => {
      const log = new Log()
      log.add(`${inp.caster.species} handed in their Blunder Policy`)
      log.push(BUFF_STAT(inp.caster, inp, 'speed', 2))
      return log
    }
  },
  ejectpack: {
    onAfterTargetMove: (inp) => {
      const {caster} = inp
      // Check whether caster stats were lowered.
      let switchOut = false
      const log = new Log()
      for (const v of Object.values(caster.statBuffs)) {
        if (v < 0) {
          switchOut = true
        }
      }
      if (switchOut) {
        log.add(`${caster.species}'s Eject Pack activated`)
        caster.heldItemConsumed = true
        caster.heldItemTotallyConsumed = true
        log.push(APPLY_TEMP_STATUS(inp.caster, {...ConditionMap['SwitchOut']},
          `${caster.species} is nope-ing out of here!`))
      }
      return log
    }
  },
  ejectbutton: {
    onAfterTargetMove: (inp) => {
      const {caster} = inp
      // Check whether caster took damage.
      const log = new Log()
      if (inp.damage && inp.damage > 0) {
        log.add(`${caster.species}'s Eject Button activated`)
        caster.heldItemConsumed = true
        caster.heldItemTotallyConsumed = true
        log.push(APPLY_TEMP_STATUS(inp.caster, {...ConditionMap['SwitchOut']},
          `${caster.species} is nope-ing out of here!`))
      }
      return log
    }
  },
  redcard: {
    onAfterTargetMove: (inp) => {
      const {caster} = inp
      // Check whether caster took damage.
      const log = new Log()
      if (inp.damage && inp.damage > 0) {
        log.add(`${caster.species}'s Red Card was raised`)
        caster.heldItemConsumed = true
        caster.heldItemTotallyConsumed = true
        log.push(APPLY_TEMP_STATUS(inp.target, {...ConditionMap['SwitchOut']},
          `${inp.target.species} is sent to a timeout!`))
      }
      return log
    }
  },
  heavydutyboots: {}, // See applyEntryHazards
  roomservice: {
    onAfterTargetMove: (inp) => {
      const log = new Log()
      if (inp.field.trickRoom) {
        log.add(`${inp.caster.species} called for Room Service`)
        log.add(`* ding ding *`)
        log.push(BUFF_STAT(inp.caster, inp, 'speed', -1))
        inp.caster.heldItemConsumed = true
        inp.caster.heldItemTotallyConsumed = true
      }
      return log
    }
  },
  throatspray: {
    onCasterMove: (inp) => {
      const log = new Log()
      if (inp.move.sound) {
        log.add(`${inp.caster.species} took a shot of Throat Spray`)
        log.push(BUFF_STAT(inp.caster, inp, 'spAttack', 1))
        inp.caster.heldItemConsumed = true
        inp.caster.heldItemTotallyConsumed = true
      }
      return log
    },
  },
  utilityumbrella: {}, // See weather.ts
  rustedsword: {
    onBattleStart: (caster) => {
      if (caster.species !== 'Zacian') {
        return new Log()
      }
      const log = new Log()
      log.add('Zacian picked up the Rusted Sword')
      log.add('Zacian is transforming!')
      // Apply stat changes
      caster.attack *= 170/130
      caster.speed *= 148/138
      log.add(`Zacian's Intrepid Sword activated`)
      caster.statBuffs.attack++
      return log
    }
  },
  rustedshield: {
    onBattleStart: (caster) => {
      if (caster.species !== 'Zamazenta') {
        return new Log()
      }
      const log = new Log()
      log.add('Zamazenta picked up the Rusted Shield')
      log.add('Zamazenta is transforming!')
      // Apply stat changes
      caster.defense *= 145/115
      caster.spDefense *= 145/115
      caster.speed *= 128/138
      log.add(`Zamazenta's Dauntless Shield activated`)
      caster.statBuffs.defense++
      return log
    }
  },
  berserkgene: {
    // Right now only applies to Eternatus as a secret way to activate its Eternamax form
    onBattleStart: (caster) => {
      if (caster.species !== 'Eternatus') {
        return new Log()
      }
      const log = new Log()
      log.add('Eternatus has starting growing')
      log.add('and growing')
      log.add('and growing')
      log.add('Oh no! It has turned into its Eternamax form!')
      caster.currentHp *= 255/140
      caster.totalHp *= 255/140
      caster.attack *= 115/85
      caster.defense *= 250/95
      caster.spAttack *= 125/145
      caster.spDefense *= 250/95
      // speed is the same: 130->130
      return log
    },
  },
  legendplate: {
    onBattleStart: (caster, target) => {
      const log = new Log()
      if (caster.species !== 'Arceus') {
        return log
      }
      // Compute ideal type to use
      let idealMultiplier = 0
      let idealType: Type = 'Normal'
      for (let i = 0; i < 18; i++) {
        const {mult} = typeMultiplier(target, types[i])
        if (mult > idealMultiplier) {
          idealType = types[i]
          idealMultiplier = mult
        }
      }
      caster.type1 = idealType
      log.add(`Arceus drew upon the power of the Legend Plate!`)
      log.add(`Arceus became ${idealType}-type!`)
      return log
    }
  },
  shedshell: {}, // See TrappedInBattle
  smokeball: {}, // See TrappedInBattle
  pokedoll: {}, // See TrappedInBattle
  teranormal: terastallize('Normal'),
  terafire: terastallize('Fire'),
  teraelectric: terastallize('Electric'),
  terawater: terastallize('Water'),
  teragrass: terastallize('Grass'),
  terabug: terastallize('Bug'),
  teraflying: terastallize('Flying'),
  terafighting: terastallize('Fighting'),
  terapoison: terastallize('Poison'),
  teraground: terastallize('Ground'),
  terarock: terastallize('Rock'),
  teradragon: terastallize('Dragon'),
  teraghost: terastallize('Ghost'),
  terapsychic: terastallize('Psychic'),
  teradark: terastallize('Dark'),
  terasteel: terastallize('Steel'),
  terafairy: terastallize('Fairy'),
  teraice: terastallize('Ice'),
  boosterenergy: {},
  abilityshield: {},
  clearamulet: {},
  mirrorherb: {},
  loadeddice: {}, // See Hit Many logic
  punchingglove: {},
  covertcloak: {},
  mochimuscle: {},
  mochiresist: {},
  mochigenius: {},
  mochiclever: {},
  mochiswift: {},
  mochihealth: {},
  mochifreshstart: {},
  maskteal: {},
  maskcornerstone: {},
  maskhearthflame: {},
  maskwellspring: {},
}

// Add in all TM/TRs
Object.entries(ITEMS).forEach(([key, item]) => {
  if (item.category === 'tms') {
    Inventory[key] = itemTechnicalMachine(key.substring(3) as MoveId)
  }
  if (item.category === 'trs') {
    Inventory[key] = itemTechnicalRecord(key.substring(3) as MoveId)
  }
})


// Rewrite what Dragon Ascent does
Inventory['tm-Dragon Ascent'] = {
  onBattleStart: (caster) => {
    return performMegaEvolution(caster, P.Rayquaza)
  },
}
