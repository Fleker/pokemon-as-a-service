import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FirebaseService } from 'src/app/service/firebase.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ObjectEntries } from '../../../../../shared/src/object-entries';
import { F } from '../../../../../shared/src/server-types';
import { LEVEL_MAX } from '../../../../../shared/src/research';

@Component({
  selector: 'app-page-research',
  templateUrl: './page-research.component.html',
  styleUrls: ['./page-research.component.css']
})
export class PageResearchComponent implements OnInit, OnDestroy {
  @ViewChild('dlevel') dlevel?: ElementRef
  researchCompleted: number = -1
  research: [string, number][] = []
  exec = {
    researchGet: false
  }
  LEVEL_MAX = LEVEL_MAX
  firebaseListener: any

  get researchLevel() {
    return Math.ceil(this.researchCompleted/30)
  }

  get researchProgress() {
    return (this.researchCompleted - 1) % 30 * 3.33
  }

  constructor(
    private firebase: FirebaseService,
    private snackbar: MatSnackBar,
  ) {
  }

  ngOnInit(): void {
    this.firebaseListener = this.firebase.subscribeUser(user => {
      if (user) {
        this.research = ObjectEntries(user.researchCurrent) as [string, number][]
        if (this.researchCompleted !== user.researchCompleted) {
          this.researchCompleted = user.researchCompleted
          if (this.researchProgress === 0) {
            // new level
            this.dlevel.nativeElement.showModal()
          }
        }
      }
    })
  }

  ngOnDestroy() {
    this.firebaseListener?.unsubscribe()
  }

  async researchGet() {
    this.exec.researchGet = true
    window.requestAnimationFrame(async () => {
      try {
        await this.firebase.exec<F.ResearchGet.Req, F.ResearchGet.Res>('research_get')
        this.snackbar.open('Here are five tasks. Thanks for helping!', '',
          {duration: 3000})
      } catch (e: any) {
        this.snackbar.open(e.message, '', {duration: 5000})
      } finally {
        this.exec.researchGet = false
      }
    })
  }

  close() {
    this.dlevel.nativeElement.close()
  }
}
