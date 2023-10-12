/**
 * @fileoverview A listing of souvenirs that can be returned as the held item
 * during encounters. Souvenirs require something that they can go inside first
 * such as soot being placed in a soot sack. These items can be collected as
 * the player travels around and used at a particular threshold.
 */

import { Globe, LocationId, WeatherType } from "./locations-list";
import randomItem from "./random-item";
import { SouvenirContainerId, SouvenirId } from "./gen/type-item";

/**
 * A representation of a souvenir, some atomic item that can be collected as
 * a held item during encounters.
 */
export interface Souvenir {
  /**
   * The item being given.
   */
  item: SouvenirId | ((location: LocationId) => SouvenirId)
  /**
   * The number of this item that will be found.
   */
  quantity: (weather: WeatherType, item: SouvenirId) => number
}

/**
 * A map of souvenirs in the form of `collector: souvenir`,
 * eg. `'sootsack': {soot}`
 */
export const Souvenirs: Record<SouvenirContainerId, Souvenir> = {
  sootsack: {
    item: 'soot',
    quantity: (weather) => {
      const p = Math.random()
      if (weather === 'Rain' || weather === 'Thunderstorm') {
        return 1
      }
      if (weather === 'Sandstorm') {
        return p > 0.45 ? 3 : 1
      }
      return p > 0.85 ? 3 : 1
    }
  },
  zygardecube: {
    item: 'zygardecell',
    quantity: () => 1,
  },
  oddkeystone: {
    item: 'wisp',
    quantity: (weather) => {
      const p = Math.random()
      if (weather === 'Fog') {
        return p > 0.75 ? 2 : 1
      }
      return 1
    }
  },
  foragebag: {
    item: (location) => {
      const globe = Globe[location]
      if (globe.flower === 'red' || globe.flower === 'orange') {
        return 'rednectar'
      } else if (globe.flower === 'yellow') {
        return 'yellownectar'
      } else if (globe.flower === 'white') {
        return 'pinknectar'
      } else if (globe.flower === 'blue') {
        return 'purplenectar'
      }
      return randomItem(['rednectar', 'yellownectar', 'pinknectar', 'purplenectar']) // All nectar
    },
    quantity: () => {
      const p = Math.random()
      if (p < 0.1) return 3
      if (p < 0.3) return 2
      return 1
    },
  },
  itemfinder: {
    item: () => {
      const p = Math.random()
      if (p < 0.03) return 'strangesouvenir' // 3%
      if (p < 0.06) return 'gimmighoulcoin' // 3%
      if (p < 0.11) return 'bottlecapgold' // 5%
      if (p < 0.25) return 'bottlecaphp' // 14%
      if (p < 0.4) return 'bottlecapatk' // 15%
      if (p < 0.55) return 'bottlecapdef'
      if (p < 0.7) return 'bottlecapspa'
      if (p < 0.85) return 'bottlecapspd'
      return 'bottlecapspe'
    },
    quantity: (_, item) => {
      const p = Math.random()
      if (item === 'gimmighoulcoin') {
        if (p < 0.001) return 777
        if (p < 0.01) return 75
        if (p < 0.1) return 10
        if (p < 0.3) return 6
        if (p < 0.6) return 3
        return 1
      }
      if (p < 0.01) return 3
      if (p < 0.3) return 2
      return 1
    },
  },
}