import { TeamsBadge } from "./badge2"
import { MoveTypeMap, SupportMoves } from "./gen/type-move-meta"
import { BadgeId, PokemonDoc, PokemonDocBuilder } from "./pokemon/types"
import { kantoBuilder } from "./pokemon/kanto"
import { johtoBuilder } from "./pokemon/johto"
import { hoennBuilder } from "./pokemon/hoenn"
import { sinnohBuilder } from "./pokemon/sinnoh"
import { unovaBuilder } from "./pokemon/unova"
import { kalosBuilder } from "./pokemon/kalos"
import { alolaBuilder } from "./pokemon/alola"
import { galarBuilder } from "./pokemon/galar"
import { hisuiBuilder } from "./pokemon/hisui"
import { paldeaBuilder } from "./pokemon/paldea"

export const datastoreBuilder = {
  ...kantoBuilder,
  ...johtoBuilder,
  ...hoennBuilder,
  ...sinnohBuilder,
  ...unovaBuilder,
  ...kalosBuilder,
  ...alolaBuilder,
  ...galarBuilder,
  ...hisuiBuilder,
  ...paldeaBuilder,
}

function getArray<T>(val: T[] | T | undefined): T[] {
  return val === undefined ? [] :
    Array.isArray(val) ? val :
    [val];
}
function assertIsBadgeId(val: string, source: string): asserts val is BadgeId {
  if (datastoreBuilder[val] === undefined && val !== 'potw-555-ordinary') {
    throw new Error(`${val} is not a BadgeId in ${source}`);
  }
}
function assertIsMaybeBadgeId(val: undefined|string|string[], source: string): asserts val is undefined|BadgeId|BadgeId[] {
  for (const s of getArray(val)) {
    assertIsBadgeId(s, source);
  }
}
// We can't refer to BadgeId in the PokemonDocBuilder definition because BadgeId is derived from
// its key.  Instead we do a small amount of runtime validation so that we're still exporting the
// more specific type
export function assertPkmnDocs<K extends string>(obj: {[key in K]: PokemonDocBuilder}) {
  for (const entry of Object.values<PokemonDocBuilder>(obj)) {
    assertIsMaybeBadgeId(entry.eggBase, `${entry.species} Egg Base`);
    assertIsMaybeBadgeId(entry.levelTo, `${entry.species} Level To`);
  }
  return obj as {[key in K]: PokemonDoc};
}

export const weightModifier: Record<string, number> = {
  'xxs': 0.8,
  'xs': 0.925,
  's': 0.95,
  'n': 1,
  'l': 1.05,
  'xl': 1.075,
  'xxl': 1.2,
}

export const kanto = assertPkmnDocs(kantoBuilder);
export const johto = assertPkmnDocs(johtoBuilder);
export const hoenn = assertPkmnDocs(hoennBuilder);
export const sinnoh = assertPkmnDocs(sinnohBuilder);
export const unova = assertPkmnDocs(unovaBuilder);
export const kalos = assertPkmnDocs(kalosBuilder);
export const alola = assertPkmnDocs(alolaBuilder);
export const galar = assertPkmnDocs(galarBuilder);
export const hisui = assertPkmnDocs(hisuiBuilder);
export const paldea = assertPkmnDocs(paldeaBuilder);
export const datastore = assertPkmnDocs(datastoreBuilder);

type GottenPokemon = (PokemonDoc & {key: BadgeId});

export const get = (id: string): (GottenPokemon | undefined) => {
  const badge = new TeamsBadge(id.trim() as BadgeId)
  id = id.replace(/-var\d/, '') // Remove variant in ID
  const simpleId = badge.toSimple()
  const formId = `${simpleId}-${badge.form}`
  const genderId = `${simpleId}-${badge.gender}`
  const genderFormId = `${simpleId}-${badge.form}-${badge.gender}`
  const lookupOrder = [id, genderFormId, formId, genderId, simpleId]
  const baseDoc = ((): (GottenPokemon)|undefined => {
    for (const pid of lookupOrder) {
      if (pid in datastore) {
        return {...datastore[pid], key: pid as BadgeId}
      }
    }
    return undefined
  })()
  if (!baseDoc) return undefined
  // Now we are guaranteeing baseDoc.move is an array
  let moveArray = [...(Array.isArray(baseDoc.move) ? [...baseDoc.move] : [baseDoc.move])]

  baseDoc.moveAll = [...moveArray]
  if (baseDoc.novelMoves) {
    baseDoc.novelMoves.forEach(variant => {
      if (variant) {
        baseDoc.moveAll = [...baseDoc.moveAll!, ...variant]
      }
    })
  }

  if (badge.variant !== undefined) {
    if (baseDoc.novelMoves && baseDoc.novelMoves[badge.variant]) {
      baseDoc.novelMoves[badge.variant].forEach(move => {
        if (SupportMoves.includes(move)) {
          // This is a support move, add there instead
          moveArray.push(move)
        } else {
          const moveDetails = MoveTypeMap[move]
          const oldMoves = moveArray.map(m => MoveTypeMap[m])
          let replaceSlot = false
          for (let i = 0; i < oldMoves.length; i++) {
            // Only replace damaging moves
            if (oldMoves[i]!.type === moveDetails?.type && oldMoves[i].power) {
              moveArray[i] = move
              replaceSlot = true
            }
          }
          if (!replaceSlot) {
            moveArray = [...moveArray, move]
          }
        }
      })
    }
  }
  baseDoc.move = moveArray
  if (!baseDoc.release) {
    baseDoc.release = 'pokeball'
  }
  return baseDoc
}

export function getDexIndicies(currentBadge: BadgeId) {
  const dataKeys = Object.keys(datastore)
  const datastoreKey = get(currentBadge)!.key
  const thisIndex = dataKeys.findIndex(k => k === datastoreKey)
  const prev = (() => {
    if (thisIndex < 1) {
      // Pokemon 0 or not found
      return undefined
    }
    return dataKeys[thisIndex - 1]
  })()
  const next = (() => {
    if (thisIndex === dataKeys.length) {
      // Last Pokemon
      return undefined
    } else {
      return dataKeys[thisIndex + 1]
    }
  })()
  return {
    prev, next
  }
}

export function getAllPreEvolutions(currentBadge: BadgeId): BadgeId[] {
  const datastoreKey = get(currentBadge)!.key as BadgeId

  return Object.entries(datastore)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .filter(([key, p]) => (p.levelTo as BadgeId) === datastoreKey || p.evolveTo?.includes(datastoreKey))
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(([key, p]) => key as BadgeId)
}

export function getAllEvolutions(currentBadge: BadgeId): BadgeId[] {
  const pkmn = get(currentBadge)!
  const evos: BadgeId[] = []

  if (Array.isArray(pkmn.levelTo)) {
    evos.push(...pkmn.levelTo)
  } else if (pkmn.levelTo) {
    evos.push(pkmn.levelTo as BadgeId)
  }

  if (pkmn.evolveTo) {
    evos.push(...(pkmn.evolveTo as unknown as BadgeId[]))
  }

  return evos
}
