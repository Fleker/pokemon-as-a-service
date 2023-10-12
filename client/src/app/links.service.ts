import { Injectable } from '@angular/core';
import { FirebaseService } from './service/firebase.service';

@Injectable({
  providedIn: 'root'
})
export class LinksService {
  bugs?: {
    url: string
    label: string
  }
  contact?: {
    email: string
    label: string
    chatmisc: string
    chatraid: string
  }
  guide?: {
    url: string
  }
  mailing?: {
    url: string
  }
  templates?: {
    location: string
    variants: string
    moves: string
    achievements: string
    events: string
  }
  quests?: {
    Chonkorita: string
  }

  constructor(private firebase: FirebaseService) {}

  async init() {
    if (this.bugs === undefined) {
      const res = await this.firebase.exec('about_info', {})
      console.debug('Links service initiated')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const {data} = res as any
      this.bugs = data.bugs
      this.contact = data.contact
      this.guide = data.guide
      this.mailing = data.mailing
      this.templates = data.templates
      this.quests = data.quests
    }
  }
}
