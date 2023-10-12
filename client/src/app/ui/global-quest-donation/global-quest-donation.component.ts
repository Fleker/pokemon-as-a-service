import { ElementRef } from '@angular/core';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FirebaseService } from 'src/app/service/firebase.service';
import { GLOBAL_QUESTS } from '../../../../../shared/src/quests';
import { F } from '../../../../../shared/src/server-types';

@Component({
  selector: 'global-quest-donation',
  templateUrl: './global-quest-donation.component.html',
  styleUrls: ['./global-quest-donation.component.css']
})
export class GlobalQuestDonationComponent implements OnInit {
  @ViewChild('dialog') dialog?: ElementRef
  donations: number = 1
  donationList?: string[]
  currentDonations: string = ''
  _rawDonationList?: string[]

  constructor(
    private firebase: FirebaseService,
    private snackbar: MatSnackBar,
  ) { }

  async ngOnInit() {
    try {
      const global = await this.firebase.dbGet(['test', 'global'])
      console.log('Globa', global)
      const quest = GLOBAL_QUESTS[0].dbKey
      const current = global![quest]
      this.currentDonations = `${current.toLocaleString()} donations`
    } catch (e: any) {
      this.snackbar.open(`Cannot fetch Global Quest data: ${e.message}`, '', {
        duration: 5000,
      })
    }
  }

  async getCurrentDonations() {
    try {
      const res = await this.firebase.exec<F.QuestDonate.Req, F.QuestDonate.Res>('quest_donate', {
        donations: 0,
        anonymous: true,
      })
      this.donations = 1
      this._rawDonationList = res.data.list
      this.generateDonationList()
    } catch (e: any) {
      this.snackbar.open(e.message, '', {
        duration: 5000,
      })
    }
  }

  async donate() {
    try {
      const res = await this.firebase.exec<F.QuestDonate.Req, F.QuestDonate.Res>('quest_donate', {
        donations: this.donations,
      })
      this.donations = 1
      this._rawDonationList = res.data.list
      this.generateDonationList()
    } catch (e: any) {
      this.snackbar.open(e.message, '', {
        duration: 5000,
      })
    }
  }

  async donateAnon() {
    try {
      const res = await this.firebase.exec<F.QuestDonate.Req, F.QuestDonate.Res>('quest_donate', {
        donations: this.donations,
        anonymous: true,
      })
      this.donations = 1
      this._rawDonationList = res.data.list
      this.generateDonationList()
    } catch (e: any) {
      this.snackbar.open(e.message, '', {
        duration: 5000,
      })
    }
  }

  open() {
    this.dialog!.nativeElement.showModal()
  }

  close() {
    this.dialog!.nativeElement.close()
  }

  generateDonationList() {
    // Reformat the list to be user-friendly
    const map: Record<string, number> = {}
    let i = 0
    this._rawDonationList!.forEach(donation => {
      const [ldap, value] = donation.split(' - ')
      if (parseInt(value) > 0) {
        if (ldap === 'Anonymous') {
          // Don't group all these together
          map[`Anonymous ${i}`] = Number(value)
        } else {
          if (map[ldap]) {
            map[ldap] += Number(value)
          } else {
            map[ldap] = Number(value)
          }
        }
      }
    })
    this.donationList = Object.entries(map)
      .sort(([_, val1], [__, val2]) => {
        // Sort from most -> least
        return val2 - val1
      })
      .map(([ldap, value]) => {
        return `${ldap}: ${value}`
      })
  }
}
