import { Component, ElementRef, ViewChild } from '@angular/core';
import { PokemonId } from '../../../../../shared/src/pokemon/types';
import { AttackParams, ExecuteLog, SpeedAlignedAction, attack, buildMatchup, byPriority, endOfGame } from '../../../../../shared/src/battle/battle-controller';
import { Badge, Nature } from '../../../../../shared/src/badge3';
import { Log, Pokemon, logDamage, Field } from '../../../../../shared/src/battle/types';
import { BattlePlayersComponent } from 'src/app/ui/battle-players/battle-players.component';
import randomItem from '../../../../../shared/src/random-item';
import { getCondition } from '../../../../../shared/src/battle/conditions';
import { Weathers } from '../../../../../shared/src/battle/weather';
import { Movepool } from '../../../../../shared/src/battle/movepool';
import {pokemonForms} from '../../../../../shared/src/pokemon/types'
import { ItemId } from '../../../../../shared/src/items-list';
import { ConditionMap } from '../../../../../shared/src/battle/status';

const STATE_SETUP = 1
const STATE_MATCH = 2
const STATE_OVER = 3

type Side = 'player' | 'opponent'

@Component({
  selector: 'page-battlesim',
  templateUrl: './page-battlesim.component.html',
  styleUrls: ['./page-battlesim.component.css']
})
export class PageBattlesimComponent {
  @ViewChild('battleui') battleUi?: BattlePlayersComponent
  @ViewChild('pokemonbuilder') pokemonBuilder?: ElementRef
  state = STATE_SETUP
  players: PokemonId[] = []
  playerItems: ItemId[] = []
  playerConditions: string[] = []
  playerPokemon: Pokemon[] = []
  opponents: PokemonId[] = []
  opponentItems: ItemId[] = []
  opponentPokemon: Pokemon[] = []
  opponentConditions: string[] = []
  turnNo = 1
  actionNo = 1
  log?: Log
  actions: SpeedAlignedAction[] = []
  field?: Field
  customMove?: string
  // Builder
  builder = {
    id: 'potw-001',
    form: undefined,
    variant: undefined,
    gender: '',
    shiny: false,
    nature: 'Hardy',
    item: undefined,
    conditions: '',
  }
  builderMode: Side = 'player'

  get builderBadge() {
    if (this.builder && this.builder.id) {
      const b = Badge.fromLegacy(this.builder.id)
      b.personality.form = this.builder.form
      b.personality.variant = this.builder.variant
      b.personality.gender = this.builder.gender as any
      b.personality.shiny = this.builder.shiny
      b.personality.nature = this.builder.nature as Nature ?? 'Hardy'
      return b
    }
    return new Badge('1#Yf_4')
  }

  get builderSprite() {
    return this.builderBadge.toString()
  }
  availablePokemonFormList = pokemonForms

  enterBattle() {
    // battle-raid.ts => matchup
    const playerBadges = this.players.map(p => new Badge(p.trim()))
    const opponentBadges = this.opponents.map(p => new Badge(p.trim()))
    const {playerPokemon, opponentPokemon} = buildMatchup(playerBadges, [], opponentBadges, [], {
      fieldSize: 1, // FIXME
      partySize: 1,
      mega: true,
      zmoves: true,
      dynamax: true,
      maxWins: 0,
    })
    this.playerPokemon = playerPokemon
    this.opponentPokemon = opponentPokemon

    this.playerPokemon.forEach((p, i) => {
      const cl = this.playerConditions[i].split(',')
      for (const con of cl) {
        const condition = {...ConditionMap[con.trim()]}
        p.conditions.push(condition)
      }
    })
    this.opponentPokemon.forEach((p, i) => {
      const cl = this.opponentConditions[i].split(',')
      for (const con of cl) {
        const condition = {...ConditionMap[con.trim()]}
        p.conditions.push(condition)
      }
    })

    this.field = {
      naturePower: 'Grass',
      weather: Weathers.Cloudy,
      trickRoom: 0,
      mudSport: 0,
      waterSport: 0,
      magicRoom: 0,
      wonderRoom: 0,
      ions: false,
      sides: {
        Your: {
          reflect: 0,
          lightscreen: 0,
          mist: 0,
          tailwind: 0,
          marsh: 0,
          firefield: 0,
          rainbow: 0,
          fusionElectric: false,
          fusionFire: false,
          pledgeFire: false,
          pledgeGrass: false,
          pledgeWater: false,
          goldCoins: false,
          sharpSteel: false,
          stickyWeb: false,
          stealthRock: false,
          spikes: 0,
          toxicSpikes: 0,
        },
        Opposing: {
          reflect: 0,
          lightscreen: 0,
          mist: 0,
          tailwind: 0,
          marsh: 0,
          firefield: 0,
          rainbow: 0,
          fusionElectric: false,
          fusionFire: false,
          pledgeFire: false,
          pledgeGrass: false,
          pledgeWater: false,
          goldCoins: false,
          sharpSteel: false,
          stickyWeb: false,
          stealthRock: false,
          spikes: 0,
          toxicSpikes: 0,
        },
      },
      locationTerrain: undefined,
    }
    this.turnNo = 1
    this.actionNo = 0

    // Update UI
    this.state = STATE_MATCH

    window.requestAnimationFrame(() => {
      this.battleUi.players = playerBadges.map(p => p.toString())
      this.battleUi.playerItems = []
      this.battleUi.playerHps = playerBadges.map(_ => 1)
  
      this.battleUi.opponents = opponentBadges.map(p => p.toString())
      this.battleUi.opponentItems = []
      this.battleUi.opponentHps = playerBadges.map(_ => 1)
      this.log = new Log()
      this.log.isDebug = true // Enable debugging
      this.executeStart()
    })
  }

  getActionSubject(index) {
    if (index >= this.playerPokemon.length) {
      return this.opponentPokemon[index - this.playerPokemon.length]
    }
    return this.playerPokemon[index]
  }

  getActionTitle(index) {
    return this.getActionSubject(index).badge.toString()
  }

  getActions(index) {
    return this.getActionSubject(index).move
  }

  selectAction(index, move) {
    const oppoSide = index >= this.playerPokemon.length
    this.actionNo++
    this.actionNo = Math.min(this.actionNo, this.playerPokemon.length + this.opponentPokemon.length)
    this.actions.push({
      label: oppoSide ? 'Opposing' : 'Your',
      targets: this.opponentPokemon,
      caster: oppoSide ?
        this.opponentPokemon[index - this.playerPokemon.length] :
        this.playerPokemon[index],
      target: oppoSide ? // TODO: Make target controllable
        this.playerPokemon[index - this.playerPokemon.length] :
        this.opponentPokemon[index],
      move: {...Movepool[move]},
    })
  }

  preferredAction(index, move) {
    return false // TODO
  }

  executeStart() {
    // TODO weather
    // this.log.push!(weather.onActivation?.([...this.playerPokemon, ...this.opponentPokemon], field))

    for (const pkmn of this.playerPokemon) {
      if (pkmn.heldItem) {
        // NOTE: Will hardcoding to index 0 backfire at some point?
        this.log.push!(pkmn.heldItem.onBattleStart?.(pkmn, this.opponentPokemon[0], false))
      }
      if (pkmn.conditions) {
        pkmn.conditions.forEach(condition => {
          this.log.push(condition.onBattleStart?.(pkmn))
        })
      }
    }
    for (const pkmn of this.opponentPokemon) {
      if (pkmn.heldItem) {
        this.log.push!(pkmn.heldItem.onBattleStart?.(pkmn, this.playerPokemon[0], false))
      }
      if (pkmn.conditions) {
        pkmn.conditions.forEach(condition => {
          this.log.push(condition.onBattleStart?.(pkmn))
        })
      }
    } 
  }

  executeTurn() {
    const battlers = [...this.playerPokemon, ...this.opponentPokemon]
    // Sort our actions
    this.actions.sort(byPriority)
    // here's a ton of code copied & pasted
    this.actions.forEach(action => {
      let target = action.target
      if (action.target.currentHp === 0 || action.target.fainted) {
        target = randomItem(
          action.targets.filter(t => t.currentHp > 0)
        )
      }
  
      if (this.playerPokemon.includes(action.caster)) {
        const attackParams: AttackParams = {
          caster: action.caster,
          target,
          move: action.move,
          field: this.field,
          prefix: action.label,
          casterParty: this.playerPokemon,
          casters: this.playerPokemon.filter(c => getCondition(c, 'OnField')),
          targets: this.opponentPokemon.filter(c => getCondition(c, 'OnField')),
          targetParty: this.opponentPokemon,
        }
        this.log.debug(`${action.move.name} -> ${action.target.species}`)
        this.log.push(attack(attackParams))
        if (endOfGame(this.opponentPokemon)) {
          this.state = STATE_OVER
          // this.log.matchEnd = 'player'
        }
      } else {
        const attackParams: AttackParams = {
          caster: action.caster,
          target,
          move: action.move,
          field: this.field,
          prefix: action.label,
          casterParty: this.opponentPokemon,
          casters: this.opponentPokemon.filter(c => getCondition(c, 'OnField')),
          targets: this.playerPokemon.filter(c => getCondition(c, 'OnField')),
          targetParty: this.opponentPokemon,
        }
        this.log.debug(`${action.move.name} -> ${action.target.species}`)
        this.log.push(attack(attackParams))
        if (endOfGame(this.playerPokemon)) {
          this.state = STATE_OVER
          // this.log.matchEnd = 'opponent'
        }
      }
      this.log.add!('---')
    })

    // Here's a bunch of end-of-turn stuff
    // Turn ends
    if (this.field.weather) {
      this.log.push(this.field.weather.onTurnEnd?.(battlers))
    }
    if (this.field.terrain) {
      this.log.push(this.field.terrain.onTurnEnd?.(battlers))
    }

    // Apply Grass & Fire Pledge
    if (this.field.sides.Your.firefield) {
      this.playerPokemon.forEach(player => {
        if (player.type1 !== 'Fire' && player.type2 !== 'Fire' && !getCondition(player, 'Raid')) {
          this.log.push(logDamage(player, player.totalHp / 8))
        }
      })
    }

    if (this.field.sides.Opposing.firefield) {
      this.opponentPokemon.forEach(player => {
        if (player.type1 !== 'Fire' && player.type2 !== 'Fire' && !getCondition(player, 'Raid')) {
          this.log.push(logDamage(player, player.totalHp / 8))
        }
      })
    }

    // Reset moves like Rage Powder
    this.field.sides.Your.target = undefined
    this.field.sides.Opposing.target = undefined

    battlers.forEach(caster => {
      if (caster.heldItem && !caster.heldItemConsumed && !this.field.magicRoom) {
        this.log.push(caster.heldItem.onTurnEnd?.(caster, caster.heldItemConsumed, this.field))
      }
      if (caster.status && caster.currentHp > 0) {
        // log.add(`[D] ${caster.species} has ${caster.status?.name}`)
        this.log.push(caster.status.onTurnEnd?.(caster, caster.status, this.field))
      }
      // console.log(caster.species, caster.conditions)
      if (caster.conditions && caster.currentHp > 0) {
        caster.conditions.forEach(condition => {
          this.log.push(condition.onTurnEnd?.(caster, condition, this.field))
        })
      }
      // if (caster.ability) {
      //   log.push(caster.ability.onTurnEnd(caster))
      // }
      if (caster.currentHp < 0 && !caster.fainted) {
        // Caster fainted! But whose side are they on?
        caster.fainted = true
        if (this.playerPokemon.includes(caster) && endOfGame(this.playerPokemon)) {
          this.state = STATE_OVER
          // this.log.matchEnd = 'opponent'
        }
        if (this.opponentPokemon.includes(caster) && endOfGame(this.opponentPokemon)) {
          this.state = STATE_OVER
          // this.log.matchEnd = 'player'
        }
      }
    })

    if (this.field.mudSport) {
      this.field.mudSport--
    }
    if (this.field.waterSport) {
      this.field.waterSport--
    }
    if (this.field.trickRoom) {
      this.field.trickRoom--
    }
    if (this.field.wonderRoom) {
      this.field.wonderRoom--
    }
    if (this.field.magicRoom) {
      this.field.magicRoom--
    }
    this.field.ions = false
    this.field.round = false;
    ['Your', 'Opposing'].forEach(side => {
      // Decrement number params
      const numberParams = ['reflect', 'lightscreen', 'mist', 'tailwind', 'marsh', 'firefield', 'rainbow']
      const boolParams = ['fusionfire', 'fusionelectric', 'pledgegrass', 'pledgefire', 'pledgewater']
      numberParams.forEach(param => {
        if (this.field.sides[side][param]) {
          this.field.sides[side][param]--
        }
      })
      // Reset bool params
      boolParams.forEach(param => {
        if (this.field.sides[side][param]) {
          this.field.sides[side][param] = false
        }
      })
    })
    // Note: No `options` like in raids
    // Execute() behavior end-of-turn
    this.log.add!('==========')
    // console.log('Turn results', players, 'v', opponents)
    let playerFaint = 0
    let opponentFaint = 0
    // Default, lets scan all players
    this.opponentPokemon.forEach(pokemon => {
      if (pokemon.currentHp <= 0 && !pokemon.fainted) {
        pokemon.fainted = true
      }
      if (pokemon.fainted) {
        opponentFaint++
      }
    })
    if (opponentFaint >= this.opponentPokemon.length) {
      this.log.add!(`The opposing trainer has no Pokémon left!`)
      this.state === STATE_OVER
    }

    this.playerPokemon.forEach(pokemon => {
      if (pokemon.currentHp <= 0 && !pokemon.fainted) {
        pokemon.fainted = true
      }
      if (pokemon.fainted) {
        playerFaint++
      }
    })
    if (playerFaint >= this.playerPokemon.length) {
      this.log.add!(`All your Pokémon fainted!`)
      this.state === STATE_OVER
    }

    // Update UI
    this.playerPokemon.forEach((p, i) => {
      this.battleUi.playerHps[i] = p.currentHp / p.totalHp
    })
    this.opponentPokemon.forEach((p, i) => {
      this.battleUi.opponentHps[i] = p.currentHp / p.totalHp
    })

    // Reset for next turn
    this.turnNo++
    this.actionNo = 0
    this.actions = []
  }

  reset() {
    this.state = STATE_SETUP
  }

  openBuilder(group: Side) {
    this.builderMode = group
    this.builder = {
      id: 'potw-001',
      form: undefined,
      variant: undefined,
      gender: '',
      shiny: false,
      nature: 'Hardy',
      item: undefined,
      conditions: '',
    }
    this.pokemonBuilder.nativeElement.showModal()
  }

  saveBuilder() {
    if (this.builderMode === 'player') {
      this.players.push(this.builderBadge.toString())
      this.playerItems.push(this.builder.item)
      this.playerConditions.push(this.builder.conditions)
    } else {
      this.opponents.push(this.builderBadge.toString())
      this.opponentItems.push(this.builder.item)
      this.opponentConditions.push(this.builder.conditions)
    }
    this.closeDialog()
  }

  closeDialog() {
    this.pokemonBuilder.nativeElement.close()
  }

  deleteBattler(group: Side, index: number) {
    if (group === 'player') {
      this.players.splice(index, 1)
      this.playerItems.splice(index, 1)
      this.playerConditions.splice(index, 1)
    } else {
      this.opponents.splice(index, 1)
      this.opponentItems.splice(index, 1)
      this.opponentConditions.splice(index, 1)
    }
  }
}
