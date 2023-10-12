import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FirebaseService } from 'src/app/service/firebase.service';
import { Users, F } from '../../../../../shared/src/server-types';
import {fertilizerPokemon, getHarvestTime, getNextPlotCost, getTotalPlots, isBerryHarvestable} from '../../../../../shared/src/farming'
import * as Sprite from '../../../../../shared/src/sprites';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BadgeId, PokemonId } from '../../../../../shared/src/pokemon/types';
import { ElementRef } from '@angular/core';
import { ITEMS, BerryId, FertilizerId, ItemId } from '../../../../../shared/src/items-list';
import { get } from '../../../../../shared/src/pokemon';
import { DialogItemsComponent } from 'src/app/dialogs/picker-items/picker-items.component';
import { Badge } from '../../../../../shared/src/badge3';
import { BinocularsComponent } from 'src/app/ui/binoculars/binoculars.component';

interface Plot {
  berry?: BerryId
  fertilizer?: FertilizerId
  canFertilize: boolean
  empty: boolean
  ready: boolean
  /** Timestamp when planted */
  planted: number
  /** A frontend field to state whether an operation is running on this plot. */
  exec: boolean
}

interface Harvest {
  harvest: {
    label: string
    item: ItemId
    yield: number
  }[]
  weeds: {
    label: string
    item: ItemId
  }[]
  pokemon: {
    pkmn: PokemonId
    species: string
  }[]
}

// https://archives.bulbagarden.net/wiki/Category:Berry_plant_sprites
const dancing: BerryId[] = [
  'aguav', 'apicot', 'aspear', 'babiri', 'belue',
  'bluk', 'charti', 'cheri', 'chesto', 'chilan',
  'chople', 'coba', 'colbur', 'cornn', 'cutsap',
  'durin', 'enigma', 'figy', 'ganlon', 'grepa',
  'haban', 'hondew', 'iapapa', 'jaboca', 'kasib',
  'kebia', 'kelpsy', 'lansat', 'leppa', 'liechi',
  'lum', 'magost', 'mago', 'nanab', 'nomel',
  'occa', 'oran', 'pamtre', 'passho', 'payapa',
  'pecha', 'persim', 'petaya', 'pinap', 'pomeg',
  'qualot', 'rabuta', 'rawst', 'razz', 'rindo',
  'rowap', 'salac', 'shuca', 'sitrus', 'spelon',
  'starf', 'tamato', 'tanga', 'wacan', 'watmel',
  'wepear', 'wiki', 'yache',
  'kee', 'maranga', 'roseli', // Using enigma
]

@Component({
  selector: 'app-page-farm',
  templateUrl: './page-farm.component.html',
  styleUrls: ['./page-farm.component.css']
})
export class PageFarmComponent implements OnInit, OnDestroy {
  @ViewChild('dialog') dialog?: ElementRef
  @ViewChild('dfertilizer') fertilizerDialog?: ElementRef
  @ViewChild('binoculars') binoculars?: BinocularsComponent
  @ViewChild('items') items?: DialogItemsComponent
  private user?: Users.Doc
  plots?: Plot[] = []
  harvestRes: Harvest = {
    harvest: [],
    weeds: [],
    pokemon: [],
  }
  exec = {
    expand: false
  }
  binocularsList: BadgeId[] = []
  firebaseListener: any
  
  get berryGrown() {
    return this.user?.berryGrown?.toLocaleString() || '0'
  }

  get nextPlotCost() {
    return getNextPlotCost(this.user?.berryPlots || 0)
  }

  get plotNum() {
    return this.user?.berryPlots?.toLocaleString() || '0'
  }

  get fertilizerString() {
    return Object.entries(ITEMS)
      .filter(([, v]) => v.category === 'fertilizer')
      .map(([k]) => k)
      .join(',')
  }

  /**
   * Returns an array of all plots that are ready, with the value
   * corresponding to the index of each plot.
   */
  get plotsReady() {
    if (!this.plots) return []
    return this.plots
      .map((v, i) => v.ready ? i : -1)
      .filter(i => i > -1)
  }

  /**
   * Returns an array of all plots that have no berries in them.
   */
  get plotsToPlant() {
    if (!this.plots) return []
    return this.plots
      .map((v, i) => v.empty ? i : -1)
      .filter(i => i > -1)
  }

  /**
   * Returns an array of all plots that have berries but are not fertilized.
   */
  get plotsToFertilize() {
    if (!this.plots) return []
    return this.plots
      .map((v, i) => v.canFertilize ? i : -1)
      .filter(i => i > -1)
  }

  get showMassPlant() {
    return this.plotsToPlant.length > 1 && this.plots.length >= 18
  }

  get showMassFertilize() {
    return this.plotsToFertilize.length > 1 && this.plots.length >= 18
  }

  constructor(
    private firebase: FirebaseService,
    private snackbar: MatSnackBar,
  ) { }

  ngOnInit(): void {
    this.firebaseListener = this.firebase.subscribeUser(user => {
      if (user) {
        this.user = user
        this.refreshPlots()
      }
    })
  }

  ngOnDestroy() {
    this.firebaseListener?.unsubscribe()
  }

  getBerrySprite(plot: Plot) {
    if (!plot.ready) {
      // First determine age in hours
      // If rT = 1000, p.p = 500, D.n = 750:
      // ratio_1 = (rT - p.p) // <- 500
      // ratio_2 = (D.n - p.p) // <- 250
      // ratio_3 = ratio_2 / ratio_1 // <- 0.5
      // ie. ratio_3 = (D.n - p.p) / (Rt - p.p)
      const readyTime = getHarvestTime(plot.berry, plot.planted, plot.fertilizer)
      const ratio = (Date.now() - plot.planted) / (readyTime - plot.planted)
      if (ratio < 0.15) {
        return '/images/sprites/farm/AllTreeSeedIII.png'
      } else if (ratio < 0.25) {
        return '/images/sprites/farm/AllTreeSprout.png'
      } else if (ratio < 0.5 && dancing.includes(plot.berry)) {
        // Use TreeTaller
        return `/images/sprites/farm/${plot.berry}TreeTaller.png`
      } else if (!plot.ready && dancing.includes(plot.berry)) {
        // Use TreeBloom
        return `/images/sprites/farm/${plot.berry}TreeBloom.png`
      }
    }
    // Use TreeBerry
    if (dancing.includes(plot.berry)) {
      return `/images/sprites/farm/${plot.berry}TreeBerry.png`
    }
    return Sprite.item(plot.berry)
  }

  /**
   * @param plot Berry plot
   * @returns Appropriate alt text
   */
  getBerryInfo(plot: Plot) {
    if (!plot.ready) {
      const readyTime = getHarvestTime(plot.berry, plot.planted, plot.fertilizer)
      const ratio = (Date.now() - plot.planted) / (readyTime - plot.planted)
      if (ratio < 0.15) {
        return `The ${plot.berry} seed has been planted.`
      } else if (ratio < 0.25) {
        return `There is something sprouting from the earth where you planted the ${plot.berry}.`
      } else if (ratio < 0.5) {
        return `The ${plot.berry} plant is coming up.`
      } else if (!plot.ready) {
        return `The ${plot.berry} is starting to bloom.`
      }
    }
    return `The ${plot.berry} has produced berries!`
  }

  async expand() {
    const quickPrompt = confirm('Confirm purchase of land')
    if (!quickPrompt) return // Exit early
    this.exec.expand = true
    window.requestAnimationFrame(async () => {
      try {
        await this.firebase.exec<F.BerryPlot.Req, F.BerryPlot.Res>('berry_plot')
        this.snackbar.open('More land has been acquired!', '', {
          duration: 3000,
        })
        this.firebase.refreshUser()
      } catch (e: any) {
        this.snackbar.open(e.message, '', {
          duration: 5000,
        })
      } finally {
        this.exec.expand = false
      }
    })
  }

  async plant(index: number) {
    this.items!.open()
    this.items!.max = (() => {
      let c = 0
      for (let i = index; i < this.plots.length; i++) {
        if (this.plots[i].empty) c++
        else break
      }
      return c
    })()
    this.items!.filter('berry')
    const subscription = this.items!.events.subscribe(async e => {
      if (e === 'CLOSE') {
        if (this.items!._selection.length) {
          // We can select multiple indexes here
          const berry = (() => {
            return this.items!._selection.map(sel => sel.item)
          })() as BerryId[]
          const indexArray = (() => {
            const arr = []
            for (let i = 0; i < berry.length; i++) {
              arr.push(index + i)
            }
            return arr
          })()
          console.debug(`Plant ${berry} in plot ${index}`)
          for (const i of indexArray) {
            this.plots[i].exec = true
          }
          window.requestAnimationFrame(async () => {
            try {
              this.items!.reset()
              await this.firebase.exec<F.BerryPlant.Req, F.BerryPlant.Res>('berry_plant', {
                berry,
                index: indexArray,
              })
              this.snackbar.open('You dropped the seed in the empty hole.', '', {
                duration: 3000,
              })
              this.firebase.refreshUser()
            } catch (e: any) {
              this.snackbar.open(e.message, '', {
                duration: 5000,
              })
            } finally {
              for (const i of indexArray) {
                this.plots[i].exec = false
              }
            }  
          })
        }
        subscription.unsubscribe()
      }
    })
  }

  async fertilize(index: number) {
    this.items!.open()
    this.items!.max = (() => {
      let c = 0
      for (let i = index; i < this.plots.length; i++) {
        if (this.plots[i].canFertilize) c++
        else break
      }
      return c
    })()
    this.items!.filter('fertilizer')
    const subscription = this.items!.events.subscribe(async e => {
      if (e === 'CLOSE') {
        if (this.items!._selection.length) {
          // We can select multiple indexes here
          // But we can only select one of each fertilizer (picker limitation)
          const fertilizer = (() => {
            return this.items!._selection.map(sel => sel.item)
          })() as FertilizerId[]
          const indexArray = (() => {
            const arr = []
            for (let i = 0; i < fertilizer.length; i++) {
              arr.push(index + i)
            }
            return arr
          })()
          console.log(`Fertilize ${fertilizer} in plot ${index}`)
          for (const i of indexArray) {
            this.plots[i].exec = true
          }
          window.requestAnimationFrame(async () => {
            try {
              await this.firebase.exec<F.BerryFertilize.Req, F.BerryFertilize.Res>('berry_fertilize', {
                fertilizer,
                index: indexArray,
              })
              this.snackbar.open('You sprinkled the fertilizer on your plant.', '', {
                duration: 3000,
              })
              this.firebase.refreshUser()
            } catch (e: any) {
              this.snackbar.open(e.message, '', {
                duration: 5000,
              })
            } finally {
              this.items!.reset()
              for (const i of indexArray) {
                this.plots[i].exec = false
              }
            }
          })
        }
        subscription.unsubscribe()
      }
    })
  }

  async harvest(index: number) {
    this.plots[index].exec = true
    window.requestAnimationFrame(async () => {
      try {
        const res = await this.firebase.exec<F.BerryHarvest.Req, F.BerryHarvest.Res>('berry_harvest', {index})
        this.dialog!.nativeElement.showModal()
        const {badge, species, berry, berryYield, weed} = res.data
        // Although we can return an array of elements, the client only shows
        // the first. People may write scripts to run things quicker, but the
        // client only works one at a time.
        this.harvestRes = {
          harvest: berry.map((b, i) => ({
            item: b,
            yield: berryYield[i],
            label: ITEMS[b]?.label,
          })),
          weeds: weed.filter(w => w).map(w => ({
            item: w,
            label: ITEMS[w]?.label,
          })),
          pokemon: species.map(s => ({
            pkmn: s,
            species: new Badge(s).toLabel(),
          })),
        }
        this.firebase.refreshUser()
      } catch (e: any) {
        this.dialog!.nativeElement.close()
        this.snackbar.open(e.message, '', {
          duration: 5000,
        })
      } finally {
        this.plots[index].exec = false
      }
    })
  }

  async harvestAll() {
    for (const index of this.plotsReady) {
      this.plots[index].exec = true
    }
    window.requestAnimationFrame(async () => {
      try {
        const res = await this.firebase.exec<F.BerryHarvest.Req, F.BerryHarvest.Res>('berry_harvest', {
          index: this.plotsReady
        })
        const {species, berry, berryYield, weed} = res.data
        this.harvestRes = {
          harvest: berry.map((b, i) => ({
            item: b,
            yield: berryYield[i],
            label: ITEMS[b]?.label,
          })),
          weeds: weed.filter(w => w).map(w => ({
            item: w,
            label: ITEMS[w]?.label,
          })),
          pokemon: species.map(s => ({
            pkmn: s,
            species: new Badge(s).toLabel(),
          })),
        }
        console.debug('HarvestRes -- All', this.harvestRes)
        this.dialog!.nativeElement.showModal()
        this.firebase.refreshUser()
      } catch (e: any) {
        this.snackbar.open(e.message, '', {
          duration: 5000,
        })
      } finally {
        for (let i = 0; i < this.plots.length; i++) {
          this.plots[i].exec = false
        }
      }
    })
  }

  plantAll() {
    this.items!.open()
    this.items!.max = 1 // Get one item, use for all
    this.items!.filter('berry')
    const subscription = this.items!.events.subscribe(async e => {
      if (e === 'CLOSE') {
        if (this.items!._selection.length) {
          const selectedBerry = this.items!._selection[0].item as BerryId
          // We can select multiple indexes here
          // But we can only select one of each fertilizer (picker limitation)
          const arrayLength = Math.min(this.user.items[selectedBerry], this.plotsToPlant.length)
          const berry: BerryId[] = Array(arrayLength).fill(selectedBerry)
          for (const i of this.plotsToPlant) {
            this.plots[i].exec = true
          }
          window.requestAnimationFrame(async () => {
            try {
              this.items!.reset()
              await this.firebase.exec<F.BerryPlant.Req, F.BerryPlant.Res>('berry_plant', {
                berry,
                index: this.plotsToPlant,
              })
              this.snackbar.open('You dropped the seeds in the empty holes.', '', {
                duration: 3000,
              })
              this.firebase.refreshUser()
            } catch (e: any) {
              this.snackbar.open(e.message, '', {
                duration: 5000,
              })
            } finally {
              for (const i of this.plotsToPlant) {
                this.plots[i].exec = false
              }
            }  
          })
        }
        subscription.unsubscribe()
      }
    })
  }

  async fertilizeAll() {
    this.items!.open()
    this.items!.max = 1 // Get one item, use for all
    this.items!.filter('fertilizer')
    const subscription = this.items!.events.subscribe(async e => {
      if (e === 'CLOSE') {
        if (this.items!._selection.length) {
          const selectedFertilizer = this.items!._selection[0].item as FertilizerId
          // We can select multiple indexes here
          // But we can only select one of each fertilizer (picker limitation)
          const arrayLength = Math.min(this.user.items[selectedFertilizer], this.plotsToFertilize.length)
          const fertilizer: FertilizerId[] = Array(arrayLength).fill(selectedFertilizer)
          for (const i of this.plotsToFertilize) {
            this.plots[i].exec = true
          }
          window.requestAnimationFrame(async () => {
            try {
              await this.firebase.exec<F.BerryFertilize.Req, F.BerryFertilize.Res>('berry_fertilize', {
                fertilizer,
                index: this.plotsToFertilize,
              })
              this.snackbar.open('You sprinkled the fertilizer on your plants.', '', {
                duration: 3000,
              })
              this.firebase.refreshUser()
            } catch (e: any) {
              this.snackbar.open(e.message, '', {
                duration: 5000,
              })
            } finally {
              this.items!.reset()
              for (const i of this.plotsToFertilize) {
                this.plots[i].exec = false
              }
            }
          })
        }
        subscription.unsubscribe()
      }
    })
  }

  openFertilizerDialog(fertilizer: FertilizerId) {
    this.binocularsList = fertilizerPokemon[fertilizer] ?? []
    this.binoculars.available = this.binocularsList
    this.binoculars.selected = fertilizer
    this.binoculars.load()
    this.fertilizerDialog.nativeElement.showModal()
  }

  close() {
    this.dialog!.nativeElement.close()
    this.fertilizerDialog!.nativeElement.close()
    this.harvestRes = undefined
  }

  refreshPlots() {
    const {berryPlots, berryPlanted} = this.user!
    const plots = getTotalPlots(berryPlots) || 0
    const array: Plot[] = []
    for (let i = 0; i < plots; i++) {
      if (berryPlanted && berryPlanted[i] && JSON.stringify(berryPlanted[i]) !== "{}") {
        // Parse entry
        const entries = Object.entries(berryPlanted[i]!)
        let berry: BerryId
        let harvest: number = -1;
        let fertilizer: FertilizerId | undefined = undefined
        for (const entry of entries) {
          if (entry[0] === 'fertilizer') {
            fertilizer = entry[1] as FertilizerId
          } else {
            berry = entry[0] as BerryId
            harvest = entry[1] as number
          }
        }
        array.push({
          berry: berry!,
          fertilizer: fertilizer,
          canFertilize: fertilizer === undefined,
          empty: false,
          ready: isBerryHarvestable(berry!, harvest, fertilizer),
          exec: false,
          planted: harvest,
        })
      } else {
        array.push({ empty: true, ready: false, canFertilize: false, exec: false, planted: -1 })
      }
    }
    this.plots = array
  }
}
