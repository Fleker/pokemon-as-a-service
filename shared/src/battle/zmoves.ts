import { assert } from "@fleker/gents"
import {Log, logHeal, MoveInput} from './types'
import {BUFF_STAT, BUFF_ALL, APPLY_TEMP_STATUS} from './movepool'
import { ConditionMap } from "./status"

type ZMoveFx = (inp: MoveInput) => Log

/**
 * Status effects as quick actions that can be added to Movepool.
 * @see https://serebii.net/sunmoon/zmoves.shtml
 */
export const ZMoveEffects = {
  AtkBuff1: assert<ZMoveFx>((inp) => BUFF_STAT(inp.caster, inp, 'attack', 1)),
  AtkBuff2: assert<ZMoveFx>((inp) => BUFF_STAT(inp.caster, inp, 'attack', 2)),
  AtkBuff3: assert<ZMoveFx>((inp) => BUFF_STAT(inp.caster, inp, 'attack', 3)),
  DefBuff1: assert<ZMoveFx>((inp) => BUFF_STAT(inp.caster, inp, 'defense', 1)),
  SpAtkBuff1: assert<ZMoveFx>((inp) => BUFF_STAT(inp.caster, inp, 'spAttack', 1)),
  SpAtkBuff2: assert<ZMoveFx>((inp) => BUFF_STAT(inp.caster, inp, 'spAttack', 2)),
  SpDefBuff1: assert<ZMoveFx>((inp) => BUFF_STAT(inp.caster, inp, 'spDefense', 1)),
  SpDefBuff2: assert<ZMoveFx>((inp) => BUFF_STAT(inp.caster, inp, 'spDefense', 2)),
  SpdBuff1: assert<ZMoveFx>((inp) => BUFF_STAT(inp.caster, inp, 'speed', 1)),
  SpdBuff2: assert<ZMoveFx>((inp) => BUFF_STAT(inp.caster, inp, 'speed', 2)),
  AccBuff1: assert<ZMoveFx>((inp) => BUFF_STAT(inp.caster, inp, 'accuracy', 1)),
  EvaBuff1: assert<ZMoveFx>((inp) => BUFF_STAT(inp.caster, inp, 'evasiveness', 1)),
  BuffAll1: assert<ZMoveFx>((inp) => BUFF_ALL(inp, 1, 1)),
  CriticalHit: assert<ZMoveFx>((inp) => APPLY_TEMP_STATUS(inp.caster, ConditionMap['Energized'],
    `${inp.caster.species} became intensely focused.`)),
  ResetStat: assert<ZMoveFx>((inp) => {
    inp.caster.statBuffs = {
      accuracy: Math.max(inp.caster.statBuffs.accuracy, 0),
      attack: Math.max(inp.caster.statBuffs.attack, 0),
      defense: Math.max(inp.caster.statBuffs.defense, 0),
      evasiveness: Math.max(inp.caster.statBuffs.evasiveness, 0),
      spAttack: Math.max(inp.caster.statBuffs.spAttack, 0),
      spDefense: Math.max(inp.caster.statBuffs.spDefense, 0),
      speed: Math.max(inp.caster.statBuffs.speed, 0),
      criticalHit: inp.caster.statBuffs.criticalHit,
    }
    return new Log().add(`${inp.caster.species} reset their stat drops`)
  }),
  Heal: assert<ZMoveFx>((inp) => logHeal(inp.caster, inp.caster.totalHp / 2)),
  Spotlight: assert<ZMoveFx>((inp) => {
    inp.field.sides[inp.prefix].target = inp.caster
    return new Log().add(`${inp.caster.species} became the center of attention`)
  })
}

export type ZMoveStatus = keyof typeof ZMoveEffects;
