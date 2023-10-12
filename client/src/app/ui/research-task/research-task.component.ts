import { Component, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FirebaseService } from 'src/app/service/firebase.service';
import { ITEMS } from '../../../../../shared/src/items-list';
import {ACTIVE_RESEARCH} from '../../../../../shared/src/research'
import {F} from '../../../../../shared/src/server-types'

@Component({
  selector: 'research-task',
  templateUrl: './research-task.component.html',
  styleUrls: ['./research-task.component.css']
})
export class ResearchTaskComponent implements OnInit {
  @Input('id') researchId: string
  @Input('count') researchCount: number
  exec = {
    claim: false,
    remove: false,
  }

  get research() {
    return ACTIVE_RESEARCH[this.researchId]
  }

  get isComplete() {
    if (!this.research) {
      console.error(`Research with ID "${this.researchId}" is not found`)
      return false
    }
    return this.research.steps <= this.researchCount
  }

  constructor(
    private firebase: FirebaseService,
    private snackbar: MatSnackBar,
  ) {}

  ngOnInit(): void {
  }

  async claim() {
    this.exec.claim = true
    setTimeout(async () => {
      try {
        const res = await this.firebase.exec<F.ResearchClaim.Req, F.ResearchClaim.Res>('research_claim', {researchId: this.researchId})
        const {prize} = res.data
        const {label} = ITEMS[prize]
        this.firebase.refreshUser()
        this.snackbar.open(`You have received a ${label}`, '', {duration: 3000})
      } catch (e: any) {
        this.snackbar.open(e.message, '', {duration: 5000})
      } finally {
        this.exec.claim = false
      }
    }, 15)
  }

  async remove() {
    this.exec.remove = true
    setTimeout(async () => {
      try {
        await this.firebase.exec<F.ResearchGet.Req, F.ResearchGet.Res>('research_get', {key: this.researchId})
        this.firebase.refreshUser()
        this.snackbar.open('That task has been replaced', '', {duration: 3000})
      } catch (e: any) {
        this.snackbar.open(e.message, '', {duration: 5000})
      } finally {
        this.exec.remove = false
      }
    }, 15)
  }
}
