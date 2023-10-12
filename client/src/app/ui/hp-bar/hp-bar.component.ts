import { ElementRef } from '@angular/core';
import { AfterViewInit } from '@angular/core';
import { OnChanges, ViewChild } from '@angular/core';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'hp-bar',
  templateUrl: './hp-bar.component.html',
  styleUrls: ['./hp-bar.component.css']
})
export class HpBarComponent implements AfterViewInit, OnChanges {
  @Input('hp') hp: number = 0
  @Input('width') width: number = 40
  @ViewChild('outer') outer?: ElementRef<HTMLDivElement>
  @ViewChild('inner') inner?: ElementRef<HTMLDivElement>

  constructor() { }

  ngAfterViewInit(): void {
    this.recalculate()
  }

  ngOnChanges(): void {
    this.recalculate()
  }

  recalculate() {
    if (!this.outer) return
    this.outer!.nativeElement.style.width = `${this.width}px`
    const sanitizedHp = Math.max(this.hp, 0)
    const innerWidth = Math.floor(this.width * sanitizedHp)
    this.inner!.nativeElement.style.width = `${innerWidth}px`
    if (this.hp > 0.5) {
      this.inner!.nativeElement.style.backgroundColor = 'green'
    } else if (this.hp < 0.25) {
      this.inner!.nativeElement.style.backgroundColor = 'red'
    } else {
      this.inner!.nativeElement.style.backgroundColor = 'orange'
    }
  }
}
