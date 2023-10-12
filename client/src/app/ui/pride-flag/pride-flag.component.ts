import { Component, Input, OnInit } from '@angular/core';

/**
 * A pixelated self-contained pride flag which can be embedded in pages.
 * @see https://www.joshwcomeau.com/animation/pride-flags/
 */
@Component({
  selector: 'pride-flag',
  templateUrl: './pride-flag.component.html',
  styleUrls: ['./pride-flag.component.css']
})
export class PrideFlagComponent implements OnInit {
  @Input('columns') columns: number = 10
  @Input('width') segWidth: number = 20
  @Input('delay') delay: number = 100
  cols: number[] = []

  ngOnInit() {
    this.cols = []
    for (let i = 0; i < this.columns; i++) {
      this.cols.push(i)
    }
  }
}
