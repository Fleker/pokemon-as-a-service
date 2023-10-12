import { AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { PokemonId } from '../../../../../shared/src/pokemon/types';

@Component({
  selector: 'sprite-evolution',
  templateUrl: './evolution.component.html',
  styleUrls: ['./evolution.component.css']
})
export class EvolutionComponent implements AfterViewInit, OnChanges {
  @Input('from') from: PokemonId
  @Input('to') to?: PokemonId
  @ViewChild('from') fromEl: ElementRef<HTMLImageElement>
  @ViewChild('to') toEl: ElementRef<HTMLImageElement>
  fromClass = ''
  toClass = ''

  ngOnChanges(changes: SimpleChanges): void {
    console.log('chages', changes)
    if (changes['to']?.currentValue) {
      this.finishEvolution()
    }
  }

  finishEvolution() {
    this.fromClass = 'done'
    this.toClass = 'animate'
    setTimeout(() => {
      this.toClass = 'done'
    }, 500)
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.fromClass = 'animate'
    }, 1000)
    setTimeout(() => {
      // this.finishEvolution()
    }, 3000)
  }
}
