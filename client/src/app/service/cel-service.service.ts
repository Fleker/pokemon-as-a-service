import { Injectable } from '@angular/core';
import { CelSpec, TextFormatter } from '@fleker/cel-js';
import { Subject } from 'rxjs';
import { Badge } from '../../../../shared/src/badge3';
import { get } from '../../../../shared/src/pokemon';
import { PokemonId } from '../../../../shared/src/pokemon/types';
import { MoveTypeMap } from '../../../../shared/src/gen/type-move-meta';
import FamilyTree from '../../../../shared/src/gen/type-pokemon-family';
import { FirebaseService } from './firebase.service';

type Entry = [PokemonId, number]
type Entries = Entry[]
interface Task {
  fn: (() => Promise<void>)
  runId: number
}

interface SubscriberTask {
  fn: (() => Promise<Entry>)
  runId: number
}

interface CelEvent {
  pokemon?: Entry
  pct: number
}

declare let window: {
  scheduler: {
    // eslint-disable-next-line @typescript-eslint/ban-types
    yield: Function
  },
  // eslint-disable-next-line @typescript-eslint/ban-types
  requestAnimationFrame: Function,
}

@Injectable({
  providedIn: 'root'
})
export class CelServiceService {
  customTags: string[] = []
  schedulerYield = false
  runId = -1

  constructor(private firebase: FirebaseService) {
    this.firebase.subscribeUser(user => {
      if (user) {
        this.customTags = user.customTags ?? []
        this.schedulerYield = user.settings.flagSchedulerYield
      }
    })
  }

  // Code listed below is part of Chrome's effort to improve the UI thread
  // While JS is still not multi-threaded, breaking up steps can help improve
  // performance for operations like catching and hatching.
  // See https://web.dev/optimize-long-tasks/ for future APIs.
  private yieldToMain() {
    if (this.schedulerYield && 'scheduler' in window && 'yield' in window.scheduler) {
      console.debug('using scheduler yield to perform a yield operation')
      return window.scheduler.yield()
    }
    return new Promise(resolve => {
      setTimeout(resolve, 0);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filterEntry(entry: Entry, ast: any, celSpec: CelSpec): boolean {
    // Create CEL-compatible bindings
    const badge = new Badge(entry[0])
    const pkmn = get(badge.toLegacyString())

    const species = pkmn.species.replace(/[♀]/g, 'Female').replace(/[♂]/g, 'Male')

    const tags = (() => {
      const allTags = []
      if (badge.defaultTags) {
        allTags.push(...badge.defaultTags)
      }
      if (badge.tags) {
        for (const tagId of badge.tags) {
          allTags.push(this.customTags[tagId])
        }
      }
      return allTags
    })()

    if (badge.toString() === '8y#gfY_' as PokemonId) {
      console.log(badge, pkmn)
    }

    const family = FamilyTree[pkmn.key] ?? []

    const bindings = {
      species: `"${species}"`,
      id: `${badge.id}`,
      shiny: `${badge.personality.shiny}`,
      affectionate: `${badge.personality.affectionate}`,
      // FIXME Hack for Unown
      form: badge.personality.form ? 
        `'${badge.personality.form?.replace(/[?]/, 'Question').replace(/[!]/, 'Exclamation')}'`
        : `''`,
      gender: `'${badge.personality.gender}'`,
      moves: Array.isArray(pkmn.move) ?
        `[${pkmn.move.map(m => `"${MoveTypeMap[m].name}", `).join('')}]` :
        `["${pkmn.move}"]`,
      tms: `[${pkmn.moveTMs.map(m => `"${m}", `).join('')}]`,
      family: `[${family.map(m => `"${m}", `).join('')}]`,
      types: pkmn.type2 ?
        `["${pkmn.type1}", "${pkmn.type2}"]` :
        `["${pkmn.type1}"]`,
      var: `${badge.personality.variant || null}`,
      count: `${entry[1] ?? 1}`,
      tags: `[${tags.map(t => `"${t}", `).join('')}]`,
      ball: `"${badge.personality.pokeball}"`,
      location: `"${badge.personality.location}"`,
      weight: `${pkmn.weight}`,
      egg: Array.isArray(pkmn.eggGroup) ?
        `[${pkmn.eggGroup.map(m => `"${m}", `).join('')}]` :
        `["${pkmn.eggGroup}"]`,
    }

    if (badge.toString() === '8y#gfY_' as PokemonId) {
      console.log(bindings)
    }

    const bindingsAst = (() => {
      if (!bindings) return {}
      const tf = new TextFormatter({}, bindings)
      const res = {
        form: {
          string_value: ''
        }, // Just as default
      }
      for (const [key, entry] of Object.entries(bindings)) {
        const entryAst = celSpec.toAST(`${entry}`)
        try {
          const entryCel = tf.format(entryAst)
          res[key] = entryCel
        } catch (e) {
          console.error(`Cannot CEL bind ${key} as ${entry} at ${badge.toString()}: ${e}`, res, entryAst, ast)
        }
      }
      return res
    })()
    const tf = new TextFormatter({}, bindingsAst)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cel = tf.format(ast) as any
    if (cel.bool_value) {
      return true
    }
    return false
  }

  async run(inputEntries: Entries, expr: string) {
    if (!expr || !expr.length) expr = 'true'
    this.runId = Date.now()
    const celSpec = new CelSpec()
    const ast = celSpec.toAST(expr, {});
    const tasks: Task[] = []
    const filteredEntries = []
    
    inputEntries.forEach(entry => {
      tasks.push({
        runId: this.runId,
        fn: async () => {
          if (this.filterEntry(entry, ast, celSpec)) {
            filteredEntries.push(entry)
          }
        }
      })
    })
    while (tasks.length > 0) {
      const task = tasks.shift()
      if (task.runId === this.runId) {
        await task.fn()
        if (tasks.length % 100 === 0) {
          await this.yieldToMain()
        }
      }
    }
    console.debug('CEL done')
    return filteredEntries
  }

  async runAndSubscribe(inputEntries: Entries, expr: string) {
    if (!expr || !expr.length) expr = 'true'
    this.runId = Date.now()
    const celSpec = new CelSpec()
    const ast = celSpec.toAST(expr, {});
    return this.schedulerYield ? this.execWithScheduler(ast, celSpec, inputEntries)
        : this.execWithTasks(ast, celSpec, inputEntries)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execWithTasks(ast: any, celSpec: CelSpec, inputEntries: Entries) {
    const tasks: SubscriberTask[] = []
    
    inputEntries.forEach(entry => {
      tasks.push({
        runId: this.runId,
        fn: async () => {
          if (this.filterEntry(entry, ast, celSpec)) {
            return entry
          }
          return undefined
        }
      })
    })

    const subscriber = new Subject<CelEvent>()
    const taskTotal = tasks.length
    window.requestAnimationFrame(async () => {
      while (tasks.length > 0) {
        const task = tasks.shift()
        if (task.runId === this.runId) {
          const entry = await task.fn()
          if (entry) {
            const pct = (taskTotal - tasks.length) / taskTotal * 100
            subscriber.next({
              pokemon: entry,
              pct,
            })
            // console.debug('CEL at', pct)
          } else if (tasks.length % 100 === 0) {
            const pct = (taskTotal - tasks.length) / taskTotal * 100
            subscriber.next({
              pokemon: undefined,
              pct,
            })
            await this.yieldToMain()
            // console.debug('CEL at', pct)
          }
        }
      }
      subscriber.next({
        pokemon: undefined,
        pct: 0,
      })
      // console.debug('CEL done')
    })
    return subscriber
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execWithScheduler(ast: any, celSpec: CelSpec, inputEntries: Entries) {
    const subscriber = new Subject<CelEvent>()
    let taskId = 0
    const taskTotal = inputEntries.length
    const runId = this.runId

    window.requestAnimationFrame(async () => {
      for (const entry of inputEntries) {
        if (runId === this.runId) {
          const match = this.filterEntry(entry, ast, celSpec)
          if (match) {
            const pct = taskId / taskTotal * 100
            subscriber.next({
              pokemon: entry,
              pct,
            })
            // console.debug('Scheduler Match', pct, entry[0])
            // await this.yieldToMain()
          }
          if (++taskId % 100 === 0) {
            const pct = taskId / taskTotal * 100
            subscriber.next({
              pokemon: undefined,
              pct,
            })
            console.debug('Scheduler Modul', pct)
            await this.yieldToMain()
          }
        }
      }

      subscriber.next({
        pokemon: undefined,
        pct: 0,
      })
    })
    return subscriber
  }

  stop() {
    this.runId = Date.now() // Forces existing tasks to no-op
  }
}
