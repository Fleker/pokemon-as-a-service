import { ElementRef } from '@angular/core';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FirebaseService } from 'src/app/service/firebase.service';
import { ObjectEntries } from '../../../../../shared/src/object-entries';
import { Users } from '../../../../../shared/src/server-types';
import { Event, Events, EventId } from '../../../../../shared/src/events';
import { Badge } from '../../../../../shared/src/badge3';
import { ITEMS } from '../../../../../shared/src/items-list';
import { LinksService } from 'src/app/links.service';

@Component({
  selector: 'button-events',
  templateUrl: './button-events.component.html',
  styleUrls: ['./button-events.component.css']
})
export class ButtonEventsComponent implements OnInit {
  @ViewChild('list') list?: ElementRef
  @ViewChild('details') details?: ElementRef
  user?: Users.Doc
  selected?: Event
  activeEvents: (Event & {key: EventId})[] = []

  get activeEventsSize() {
    return this.activeEvents.length
  }

  get hideBadge() {
    return this.activeEventsSize === 0
  }

  get eventSpawns() {
    if (!this.selected) return ''
    return this.selected.frequentSpecies
      .map(x => Badge.fromLegacy(x).toLabel())
      .join(', ')
  }

  get itemSpawns() {
    if (!this.selected) return ''
    return this.selected.encounterHoldItems
      .map(x => ITEMS[x].label)
      .join(', ')
  }

  get fr() {
    if (this.links.templates) {
      return this.links.templates.events
    }
    return undefined
  }

  get tooltip(): string {
    if (this.activeEvents.length === 0) {
      return 'Nothing'
    }
    return this.activeEvents.map(x => x.title).join(', ')
  }

  constructor(
    private firebase: FirebaseService,
    private links: LinksService,
  ) { }

  ngOnInit(): void {
    this.firebase.subscribeUser(async user => {
      if (user) {
        this.user = user
        await this.links.init()
        this.refreshEvents()
      }
    })
  }

  refreshEvents() {
    this.activeEvents = ObjectEntries(Events)
      .filter(([_, value]) => {
        return value.isActive(this.user)
      })
      .map(([key, value]) => {
        return {
          ...value, key
        }
      })
  }

  show() {
    this.refreshEvents()
    this.list.nativeElement.showModal()
  }

  closeList() {
    this.list.nativeElement.close()
  }

  showDetails(e: EventId) {
    console.debug('Second dialog', e)
    this.selected = Events[e]
    this.details.nativeElement.showModal()
  }

  closeDetails() {
    this.details.nativeElement.close()
  }
}
