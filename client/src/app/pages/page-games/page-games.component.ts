import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FirebaseService } from 'src/app/service/firebase.service';
import { ITEMS, ItemId } from '../../../../../shared/src/items-list';
import { F } from '../../../../../shared/src/server-types';

type LotteryOut = F.DrawLotto.Res & {
  prizeLabel?: string
  ticketArray?: number[]
}

const MAX_DRAWS = 50

@Component({
  selector: 'app-page-games',
  templateUrl: './page-games.component.html',
  styleUrls: ['./page-games.component.css']
})
export class PageGamesComponent implements OnInit {
  lottery?: LotteryOut
  exec = {
    drawTicket: false,
  }

  get iterations() {
    if (this.lottery) {
      const weighedIterations = this.lottery.iterations / 0.6
      if (weighedIterations >= MAX_DRAWS) {
        return `You've traded with over ${MAX_DRAWS} trainers! Amazing! We're no longer counting all your trades for ticket draws.`
      } else if (weighedIterations > 1) {
        return `You've traded with ${Math.round(weighedIterations)} trainers. You can always visit the GTS to trade more.`
      } else if (weighedIterations === 1) {
        return `You have one ticket. You can always visit the GTS to trade more.`
      }
      return 'No tickets are being drawn. This is probably a bug.'
    }
    return undefined
  }

  constructor(
    private firebase: FirebaseService,
    private snackbar: MatSnackBar
  ) { }

  ngOnInit(): void {
  }

  async drawTicket() {
    try {
      this.exec.drawTicket = true
      const res = await this.firebase.exec<F.DrawLotto.Req, F.DrawLotto.Res>('draw_lotto')
      this.lottery = res.data
      if (this.lottery!.item) {
        this.lottery!.prizeLabel = ITEMS[this.lottery!.item].label
        this.lottery!.ticketArray = this.lottery.ticket.split(' ').map(x => Number(x))
      }
      setTimeout(() => {
        this.firebase.refreshUser()
      }, 4500)
    } catch (e: any) {
      this.snackbar.open(e.message, '', {
        duration: 5000,
      })
    }
  }

}
