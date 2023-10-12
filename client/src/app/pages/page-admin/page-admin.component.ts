import { Component, OnInit } from '@angular/core';
import { EngagementService } from 'src/app/engagement.service';
import { FirebaseService } from 'src/app/service/firebase.service';
import { ObjectEntries } from '../../../../../shared/src/object-entries';

@Component({
  selector: 'app-page-admin',
  templateUrl: './page-admin.component.html',
  styleUrls: ['./page-admin.component.css']
})
export class PageAdminComponent {
  constructor(private engager: EngagementService) {}

  get timingMap() {
    return this.engager.timingMap
  }

  get timingArray() {
    return this.engager.timingArray
  }

  get isAdmin() {
    return this.engager.isAdmin
  }
}
