import { Component, Input, AfterViewInit } from '@angular/core';

const DRAW_MS = 500
const DRAW_START = 1000

@Component({
  selector: 'lotto-draw',
  templateUrl: './lotto-draw.component.html',
  styleUrls: ['./lotto-draw.component.css']
})
export class LottoDrawComponent implements AfterViewInit {
  @Input('ticket') ticket?: number[]
  @Input('winner') winner?: number[]
  display: boolean[] = Array(6).fill(0)
  rng: number[] = Array(6).fill(0)

  ngAfterViewInit() {
    this.display = Array(6).fill(false)
    for (let i = 0; i < 6; i++) {
      setTimeout((i) => {
        this.display[i] = true 
      }, DRAW_START + i * DRAW_MS, i)
    }
    const drawInterval = setInterval(() => {
      for (let i = 0; i < 6; i++) {
        this.rng[i] = Math.floor(Math.random() * 10)
      }
    }, 17)
    setTimeout(() => {
      clearInterval(drawInterval)
    }, DRAW_START + 6 * DRAW_MS)
  }
}
