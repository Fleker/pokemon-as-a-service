import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import * as Q from '../../../../../shared/src/quests'
import * as Pkmn from '../../../../../shared/src/pokemon'
import { FirebaseService } from 'src/app/service/firebase.service';
import { quest } from '../../../../../shared/src/sprites';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Globe, WeatherType } from '../../../../../shared/src/locations-list';
import { LocationService } from 'src/app/service/location.service';
import { ObjectEntries } from '../../../../../shared/src/object-entries';
import { F } from '../../../../../shared/src/server-types';

interface DowsingBadge {
  src: string
  id: string
  key: boolean
}

interface NovelLocation {
  forecast: WeatherType
  label: string
}

@Component({
  selector: 'app-page-quests',
  templateUrl: './page-quests.component.html',
  styleUrls: ['./page-quests.component.css']
})
export class PageQuestsComponent implements OnInit, OnDestroy {
  @ViewChild('tutorial') tutorial?: ElementRef
  dowsingQuests?: DowsingBadge[]
  missingDowsing: number = 0
  keyItemQuests: Q.Quest[] = Q.KEY_ITEM_QUESTS
  dittoQuests: Q.Quest[]
  pokedexQuests: Q.Quest[] = Q.POKEDEX_QUESTS
  legendaryQuests: Q.Quest[] = Q.LEGENDARY_ITEM_QUESTS
  globalQuests: Q.GlobalQuest[] = Q.GLOBAL_QUESTS
  novelLocation?: NovelLocation
  /** Locale-Formatted number */
  globalQuestDonations: string = '-1';
  firebaseListener: any;

  constructor(
    private firebase: FirebaseService,
    private snackbar: MatSnackBar,
    private locations: LocationService,
  ) {
    this.dittoQuests = []
    for (const [docId, title] of Object.entries(Q.DITTOS)) {
      const badge = Object.entries(Pkmn.datastore)
        .filter(([_, species]) => species.species === title)[0][0]
      const quest = {
        docId,
        badge: `${badge}-ditto`,
        title: `Capture ${title} Ditto`,
        hint: [`There is a ${title} that does not look like the others.`]
      }
      this.dittoQuests.push(quest)
    }
  }

  ngOnInit(): void {
    this.loadDowsingItems()
    this.fetchNovelLocation()
    this.fetchGlobalQuestDonations()
  }

  ngOnDestroy() {
    this.firebaseListener?.unsubscribe()
  }

  async loadDowsingItems() {
    const res = await this.firebase.exec<F.UserDowsing.Req, F.UserDowsing.Res>('user_dowsing')
    const items = res.data.data
      .filter((item) => item.badge !== null)
      .sort((itemA: { badge: string; }, itemB: { badge: any; }) => {
        return itemA.badge.localeCompare(itemB.badge)
      })
    this.dowsingQuests = items.map((item: any) => ({
      id: item.id,
      src: quest(item.badge),
      key: item.keyItem
    }))
    this.missingDowsing = res.data.totalItemsCount - res.data.data.length
  }

  async fetchNovelLocation() {
    const forecasts = await this.locations.getAllForecasts()
    const interestingLocations = Object.entries(forecasts)
      .map(([locId, locData]) => ({...locData, label: Globe[locId].label}))
      .filter(location => location.forecast !== 'Sunny')
    if (interestingLocations.length) {
      const index = Math.floor(interestingLocations.length * Math.random())
      this.novelLocation = {
        forecast: interestingLocations[index].forecast,
        label: interestingLocations[index].label,
      }
    }
  }

  async fetchGlobalQuestDonations() {
    try {
      const global = await this.firebase.dbGet(['test', 'global'])
      const quest = Q.GLOBAL_QUESTS[0].dbKey
      const current = global[quest]
      this.globalQuestDonations = current.toLocaleString()
    } catch (e) {
      console.error('Cannot fetch Global Quest data', e)
    }
  }

  tutorialOpen() {
    this.tutorial!.nativeElement.showModal()
  }

  tutorialClose() {
    this.tutorial!.nativeElement.close()
  }
}
