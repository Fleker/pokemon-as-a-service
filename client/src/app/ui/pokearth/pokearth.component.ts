import { Component, ElementRef, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { getMoonPhase, getTides, Globe, Location, MoonPhase, season, LocationId, Tides, WeatherType, iconMap, TerrainType, RegionType } from '../../../../../shared/src/locations-list';
import { BadgeId, PokemonForm, PokemonId } from '../../../../../shared/src/pokemon/types';
import spacetime, { Spacetime } from 'spacetime';
import { pkmn } from '../../../../../shared/src/sprites';
import { get } from '../../../../../shared/src/pokemon';
import { regionBoss, terrainBoss, forecastBoss } from '../../../../../shared/src/raid-bosses';
import { Swarms, MassiveOutbreaks } from '../../../../../shared/src/platform/swarms';
import { LocationService } from 'src/app/service/location.service';

// eslint-disable-next-line no-var
declare var window: {
  L: any
  travelQueue: string[]
}

const timeOfDay = (localDate: Spacetime) => {
  if (localDate.hour() > 6 && localDate.hour() <= 18) {
    return 'Day'
  }
  return 'Night'
}

const isDusk = (localDate: Spacetime) => {
  return localDate.hour() === 19 // 7pm
}

@Component({
  selector: 'widget-pokearth',
  templateUrl: './pokearth.component.html',
  styleUrls: ['./pokearth.component.css']
})
export class PokearthComponent {
  @ViewChild('earth') earth: ElementRef
  hasLoaded = false

  constructor(
    private locations: LocationService,
  ) {}

  load(): void {
    // if (this.hasLoaded) return;
    const {L} = window
    window.travelQueue = []
    setTimeout(async () => {
      console.log('load')
      // Define base layer
      const base = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 17,
          attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      })
      // Define iconsets: https://leafletjs.com/examples/custom-icons/
      const SvgLeafIcon = L.Icon.extend({
        options: {
            iconSize:     [24, 24],
            iconAnchor:   [22, 22],
            popupAnchor:  [-3, -22],
            className: 'icon',
        }
      });
      const PngLeafIcon = L.Icon.extend({
        options: {
            iconSize:     [30, 30],
            iconAnchor:   [22, 22],
            popupAnchor:  [-3, -22],
            className: '',
        }
      });
      const Icons: Record<WeatherType, any> = {
        Cloudy: new SvgLeafIcon({iconUrl: '/images/sprites/icons/weather-cloudy.svg'}),
        'Diamond Dust': new SvgLeafIcon({iconUrl: '/images/sprites/icons/weather-diamonddust.svg'}),
        Fog: new SvgLeafIcon({iconUrl: '/images/sprites/icons/weather-fog.svg'}),
        Sunny: new SvgLeafIcon({iconUrl: '/images/sprites/icons/weather-sunny.svg'}),
        Windy: new SvgLeafIcon({iconUrl: '/images/sprites/icons/weather-windy.svg'}),
        'Heat Wave': new SvgLeafIcon({iconUrl: '/images/sprites/icons/weather-heatwave.svg'}),
        Rain: new SvgLeafIcon({iconUrl: '/images/sprites/icons/weather-rainy.svg'}),
        Thunderstorm: new SvgLeafIcon({iconUrl: '/images/sprites/icons/weather-thunderstorm.svg'}),
        Sandstorm: new SvgLeafIcon({iconUrl: '/images/sprites/icons/weather-sandstorm.svg'}),
        Snow: new SvgLeafIcon({iconUrl: '/images/sprites/icons/weather-snow.svg'}),
      }
      const MiscIcons: Record<string, any> = {
        Flower: new SvgLeafIcon({iconUrl: '/images/sprites/icons/map-flower.svg'}),
        Mossy: new SvgLeafIcon({iconUrl: '/images/sprites/icons/map-moss.svg'}),
        Icy: new SvgLeafIcon({iconUrl: '/images/sprites/icons/map-icy.svg'}),
        Magnetic: new SvgLeafIcon({iconUrl: '/images/sprites/icons/map-magnetic.svg'}),
        Meteor: new SvgLeafIcon({iconUrl: '/images/sprites/icons/map-meteor.svg'}),
        Day: new SvgLeafIcon({iconUrl: '/images/sprites/icons/tod-day.svg'}),
        Dusk: new SvgLeafIcon({iconUrl: '/images/sprites/icons/tod-dusk.svg'}),
        Night: new SvgLeafIcon({iconUrl: '/images/sprites/icons/tod-night.svg'}),
        'High Tide': new SvgLeafIcon({iconUrl: '/images/sprites/icons/high-tide.svg'}),
        'Low Tide': new SvgLeafIcon({iconUrl: '/images/sprites/icons/low-tide.svg'}),
        Feebas: new PngLeafIcon({iconUrl: '/images/sprites/pokemon/potw-349.png'}),
        Regirock: new PngLeafIcon({iconUrl: '/images/sprites/quests/potw-encounter-regii.png'}),
        Regice: new PngLeafIcon({iconUrl: '/images/sprites/quests/potw-encounter-regir.png'}),
        Registeel: new PngLeafIcon({iconUrl: '/images/sprites/quests/potw-encounter-regis.png'}),
      }
      const Vivillon: Partial<Record<PokemonForm, any>> = {
        archipelago: new PngLeafIcon({iconUrl: '/images/sprites/icons/viv-archipelago.png'}),
        continental: new PngLeafIcon({iconUrl: '/images/sprites/icons/viv-continental.png'}),
        elegant: new PngLeafIcon({iconUrl: '/images/sprites/icons/viv-elegant.png'}),
        fancy: new PngLeafIcon({iconUrl: '/images/sprites/icons/viv-fancy.png'}),
        garden: new PngLeafIcon({iconUrl: '/images/sprites/icons/viv-garden.png'}),
        highplains: new PngLeafIcon({iconUrl: '/images/sprites/icons/viv-highplains.png'}),
        icysnow: new PngLeafIcon({iconUrl: '/images/sprites/icons/viv-icysnow.png'}),
        jungle: new PngLeafIcon({iconUrl: '/images/sprites/icons/viv-jungle.png'}),
        marine: new PngLeafIcon({iconUrl: '/images/sprites/icons/viv-marine.png'}),
        meadow: new PngLeafIcon({iconUrl: '/images/sprites/icons/viv-meadow.png'}),
        modern: new PngLeafIcon({iconUrl: '/images/sprites/icons/viv-modern.png'}),
        monsoon: new PngLeafIcon({iconUrl: '/images/sprites/icons/viv-monsoon.png'}),
        ocean: new PngLeafIcon({iconUrl: '/images/sprites/icons/viv-ocean.png'}),
        pokeball: new PngLeafIcon({iconUrl: '/images/sprites/icons/viv-pokeball.png'}),
        polar: new PngLeafIcon({iconUrl: '/images/sprites/icons/viv-polar.png'}),
        river: new PngLeafIcon({iconUrl: '/images/sprites/icons/viv-river.png'}),
        sandstorm: new PngLeafIcon({iconUrl: '/images/sprites/icons/viv-sandstorm.png'}),
        savanna: new PngLeafIcon({iconUrl: '/images/sprites/icons/viv-savanna.png'}),
        sun: new PngLeafIcon({iconUrl: '/images/sprites/icons/viv-sun.png'}),
        tundra: new PngLeafIcon({iconUrl: '/images/sprites/icons/viv-tundra.png'}),
      }
      const SwarmIcons: Partial<Record<RegionType, any>> = {}
      const SwarmLabels: Partial<Record<RegionType, string>> = {}
      for (const [r, pk] of Object.entries(Swarms)) {
        SwarmIcons[r] = new PngLeafIcon({iconUrl: pkmn(pk)})
        SwarmLabels[r] = get(pk).species
      }
      const MmoIcons: Partial<Record<WeatherType, any>> = {}
      const MmoLabels: Partial<Record<WeatherType, string>> = {}
      for (const [r, pk] of Object.entries(MassiveOutbreaks)) {
        MmoIcons[r] = new PngLeafIcon({iconUrl: pkmn(pk)})
        MmoLabels[r] = get(pk).species
      }
      const BossRegionIcons: Partial<Record<RegionType, any>> = {}
      const BossRegionLabels: Partial<Record<RegionType, string>> = {}
      for (const [r, arr] of Object.entries(regionBoss)) {
        const pk0 = arr[3][0].species
        const pk1 = arr[3][1].species
        BossRegionIcons[r] = [new PngLeafIcon({iconUrl: pkmn(pk0)}), new PngLeafIcon({iconUrl: pkmn(pk1)})];
        BossRegionLabels[r] = [get(pk0).species, get(pk1).species];
      }
      const BossTerrainIcons: Partial<Record<TerrainType, any>> = {}
      const BossTerrainLabels: Partial<Record<TerrainType, string>> = {}
      for (const [r, arr] of Object.entries(terrainBoss)) {
        const pk0 = arr[4][0].species
        const pk1 = arr[4][1].species
        BossTerrainIcons[r] = [new PngLeafIcon({iconUrl: pkmn(pk0)}), new PngLeafIcon({iconUrl: pkmn(pk1)})];
        BossTerrainLabels[r] = [get(pk0).species, get(pk1).species];
      }
      const BossWeatherIcons: Partial<Record<WeatherType, any>> = {}
      const BossWeatherLabels: Partial<Record<WeatherType, string>> = {}
      for (const [r, arr] of Object.entries(forecastBoss)) {
        const pk0 = arr[4][0].species
        const pk1 = arr[4][1].species
        BossWeatherIcons[r] = [new PngLeafIcon({iconUrl: pkmn(pk0)}), new PngLeafIcon({iconUrl: pkmn(pk1)})];
        BossWeatherLabels[r] = [get(pk0).species, get(pk1).species];
      }
      // const BossTerrainIcons: Partial<Record<TerrainType, any>> = {}
      // const BossTerrainLabels: Partial<Record<TerrainType, string>> = {}
      // for (const [r, pk] of Object.entries(MassiveOutbreaks)) {
      //   BossTerrainIcons[r] = new PngLeafIcon({iconUrl: pkmn(pk)})
      //   BossTerrainLabels[r] = get(pk).species
      // }
      // const BossForecastIcons: Partial<Record<WeatherType, any>> = {}
      // const BossForecastLabels: Partial<Record<WeatherType, string>> = {}
      // for (const [r, pk] of Object.entries(MassiveOutbreaks)) {
      //   BossForecastIcons[r] = new PngLeafIcon({iconUrl: pkmn(pk)})
      //   BossForecastLabels[r] = get(pk).species
      // }
      // Load our layers: https://leafletjs.com/examples/layers-control/
      const locations = await this.locations.getAllForecasts()
      console.debug(locations)
      const citiesLayerGroup = []
      const vivillonLayerGroup = []
      const swarmsLayerGroup = []
      const mmosLayerGroup = []
      const worldFeaturesLayerGroup = []
      const clockLayerGroup = []
      const tidesLayerGroup = []
      const bossesLayerGroup = []
      const secretsLayerGroup = []
      let loc = spacetime()

      const raidOffset = 0.06
      for (const [key, value] of Object.entries(locations)) {
        const entry = Globe[key] as Location
        if (entry.latitude) {
          // console.log(key, entry.latitude, entry.longitude)
          const popupLabel = `<b>${entry.flag} ${entry.label}</b><br><em>${key}</em><br>${entry.terrain}` 
          const popupBtn = `<button mat-button onclick="window.travelQueue.push('${key}')">Go Here</button>`

          const city = L.marker([entry.latitude, entry.longitude], {icon: Icons[value.forecast]})
            .bindPopup(`${popupLabel}<br><br>${value.forecast}<br><br>${popupBtn}`)
          citiesLayerGroup.push(city)

          const vivillon = L.marker([entry.latitude, entry.longitude], {icon: Vivillon[entry.vivillon]})
            .bindPopup(`${popupLabel}<br><br>${entry.vivillon} Vivillon<br><br>${popupBtn}`)
          vivillonLayerGroup.push(vivillon)

          const swarm = L.marker([entry.latitude, entry.longitude], {icon: SwarmIcons[entry.region]})
            .bindPopup(`${popupLabel}<br><br>There is a mass outbreak of ${SwarmLabels[entry.region]}!<br><br>${popupBtn}`)
          swarmsLayerGroup.push(swarm)

          if (value.forecast !== 'Sunny') {
            const mmo = L.marker([entry.latitude, entry.longitude], {icon: MmoIcons[value.forecast]})
              .bindPopup(`${popupLabel}<br><br>There is a mass outbreak of ${MmoLabels[value.forecast]}!<br><br>${popupBtn}`)
            mmosLayerGroup.push(mmo)
          }

          const br0 = L.marker([entry.latitude - raidOffset, entry.longitude - raidOffset], {icon: BossRegionIcons[entry.region][0]})
            .bindPopup(`${popupLabel}<br><br>Formidable ${BossRegionLabels[entry.region][0]} are appearing in raids!<br><br>${popupBtn}`)
          const br1 = L.marker([entry.latitude - raidOffset, entry.longitude + raidOffset], {icon: BossRegionIcons[entry.region][1]})
            .bindPopup(`${popupLabel}<br><br>Formidable ${BossRegionLabels[entry.region][1]} are appearing in raids!<br><br>${popupBtn}`)
          const br2 = L.marker([entry.latitude, entry.longitude - raidOffset], {icon: BossTerrainIcons[entry.terrain][0]})
            .bindPopup(`${popupLabel}<br><br>Formidable ${BossTerrainLabels[entry.terrain][0]} are appearing in raids!<br><br>${popupBtn}`)
          const br3 = L.marker([entry.latitude, entry.longitude + raidOffset], {icon: BossTerrainIcons[entry.terrain][1]})
            .bindPopup(`${popupLabel}<br><br>Formidable ${BossTerrainLabels[entry.terrain][1]} are appearing in raids!<br><br>${popupBtn}`)
          const br4 = L.marker([entry.latitude + raidOffset, entry.longitude - raidOffset], {icon: BossWeatherIcons[value.forecast][0]})
            .bindPopup(`${popupLabel}<br><br>Formidable ${BossWeatherLabels[value.forecast][0]} are appearing in raids!<br><br>${popupBtn}`)
          const br5 = L.marker([entry.latitude + raidOffset, entry.longitude + raidOffset], {icon: BossWeatherIcons[value.forecast][1]})
            .bindPopup(`${popupLabel}<br><br>Formidable ${BossWeatherLabels[value.forecast][1]} are appearing in raids!<br><br>${popupBtn}`)
          bossesLayerGroup.push(br0, br1, br2, br3, br4, br5)

          loc = loc.goto(entry.timezone)
          const todStr = (() => {
            if (isDusk(loc)) {
              return 'Dusk'
            }
            return timeOfDay(loc)
          })()
          const localTimeString = loc.format('{time}')
          const tod = L.marker([entry.latitude + 0.1, entry.longitude + 0.1], {icon: MiscIcons[todStr]})
            .bindPopup(`${popupLabel}<br><br>${localTimeString}<br><br>${popupBtn}`)
          clockLayerGroup.push(tod)

          const tideStr = getTides(key as LocationId)
          const tide = L.marker([entry.latitude - 0.1, entry.longitude - 0.1], {icon: MiscIcons[tideStr]})
            .bindPopup(`${popupLabel}<br><br>It is currently ${tideStr}<br><br>${popupBtn}`)
          tidesLayerGroup.push(tide)

          if (entry.flower) {
            const flower = L.marker([entry.latitude, entry.longitude], {icon: MiscIcons.Flower})
              .bindPopup(`${popupLabel}<br><br>${entry.flower} flowers<br><br>${popupBtn}`)
            worldFeaturesLayerGroup.push(flower)
          }
          if (entry.icyRock) {
            const flower = L.marker([entry.latitude, entry.longitude], {icon: MiscIcons.Icy})
              .bindPopup(`${popupLabel}<br><br>Icy Rocks<br><br>${popupBtn}`)
            worldFeaturesLayerGroup.push(flower)
          }
          if (entry.mossyRock) {
            const flower = L.marker([entry.latitude, entry.longitude], {icon: MiscIcons.Mossy})
              .bindPopup(`${popupLabel}<br><br>Mossy Rocks<br><br>${popupBtn}`)
            worldFeaturesLayerGroup.push(flower)
          }
          if (entry.magneticField) {
            const flower = L.marker([entry.latitude + 0.1, entry.longitude + 0.1], {icon: MiscIcons.Magnetic})
              .bindPopup(`${popupLabel}<br><br>Magnetic Field<br><br>${popupBtn}`)
            worldFeaturesLayerGroup.push(flower)
          }
          if (entry.meteor) {
            const flower = L.marker([entry.latitude - 0.1, entry.longitude - 0.1], {icon: MiscIcons.Meteor})
              .bindPopup(`${popupLabel}<br><br>${entry.meteor} meteor shards<br><br>${popupBtn}`)
            worldFeaturesLayerGroup.push(flower)
          }
          if (value.feebas) {
            console.log(entry.label, 'feebas')
            const feebas = L.marker([entry.latitude + 0.1, entry.longitude + 0.1], {icon: MiscIcons.Feebas})
            .bindPopup(`${popupLabel}<br><br>Feebas were spotted here today<br><br>${popupBtn}`)
            secretsLayerGroup.push(feebas)
          }
          if (value.regirock) {
            console.log(entry.label, 'regirock')
            const regirock = L.marker([entry.latitude + 0.1, entry.longitude + 0.1], {icon: MiscIcons.Regirock})
            .bindPopup(`${popupLabel}<br><br>A strange rocky cavern was spotted here today<br><br>${popupBtn}`)
            secretsLayerGroup.push(regirock)
          }
          if (value.regice) {
            console.log(entry.label, 'regice')
            const regice = L.marker([entry.latitude + 0.1, entry.longitude + 0.1], {icon: MiscIcons.Regice})
            .bindPopup(`${popupLabel}<br><br>A strange icy cavern was spotted here today<br><br>${popupBtn}`)
            secretsLayerGroup.push(regice)
          }
          if (value.registeel) {
            console.log(entry.label, 'registeel')
            const registeel = L.marker([entry.latitude + 0.1, entry.longitude + 0.1], {icon: MiscIcons.Registeel})
              .bindPopup(`${popupLabel}<br><br>A strange iron cavern was spotted here today<br><br>${popupBtn}`)
            secretsLayerGroup.push(registeel)
          }
        }
      }
      const cities = window.L.layerGroup(citiesLayerGroup)
      const vivillon = window.L.layerGroup(vivillonLayerGroup)
      const swarms = window.L.layerGroup(swarmsLayerGroup)
      const mmos = window.L.layerGroup(mmosLayerGroup)
      const clock = window.L.layerGroup(clockLayerGroup)
      const tides = window.L.layerGroup(tidesLayerGroup)
      const worldFeatures = window.L.layerGroup(worldFeaturesLayerGroup)
      const bosses = window.L.layerGroup(bossesLayerGroup)
      const secrets = window.L.layerGroup(secretsLayerGroup)
  
      // Load map with default layers
      const map = window.L.map(this.earth!.nativeElement, {layers: [base, cities]})
        .setView([51.505, -0.09], 3);
      map.on('click', (e) => {
        console.debug('leaflett', e)
      })
  
      // Populate layers
      L.control.layers({'World': base}, {
        "Weather": cities,
        'Vivillon': vivillon,
        'Mass Outbreaks': swarms,
        'Massive Mass Outbreaks': mmos,
        'World Clock': clock,
        'Tides': tides,
        'Raid Bosses': bosses,
        // 'Mirages': secrets,
        'Landmarks': worldFeatures,
      })
      .addTo(map)
      this.hasLoaded = true
    }, 1)
  }
}
