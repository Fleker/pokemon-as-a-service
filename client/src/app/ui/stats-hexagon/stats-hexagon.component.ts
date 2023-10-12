import { SimpleChanges, ViewChild } from '@angular/core';
import { AfterViewInit } from '@angular/core';
import { ElementRef } from '@angular/core';
import { OnChanges } from '@angular/core';
import { Component, Input, OnInit } from '@angular/core';
import { Nature } from '../../../../../shared/src/badge3';
import { Stat } from '../../../../../shared/src/battle/types';
import { statAdjustment } from '../../../../../shared/src/battle/natures';

@Component({
  selector: 'stats-hexagon',
  templateUrl: './stats-hexagon.component.html',
  styleUrls: ['./stats-hexagon.component.css']
})
export class StatsHexagonComponent implements OnChanges, AfterViewInit {
  @Input('hp') hp = 0
  @Input('attack') attack = 0
  @Input('defense') defense = 0
  @Input('spattack') spattack = 0
  @Input('spdefense') spdefense = 0
  @Input('speed') speed = 0
  @Input('nature') nature: Nature = 'Hardy'
  @ViewChild('hexagon') hexagon?: ElementRef<HTMLCanvasElement>
  originalStats = {
    hp: 0,
    attack: 0,
    defense: 0,
    spattack: 0,
    spdefense: 0,
    speed: 0,
  }
  previousEvents: any[] = []
  statsLabel: string = ''

  constructor() { }

  ngOnChanges(changes: SimpleChanges) {
    this.statsLabel = [
      this.hp, this.attack, this.defense, this.spattack, this.spdefense, this.speed,
    ].join(' | ')
    this.rebuildHexagon()
  }

  ngAfterViewInit() {
    this.rebuildHexagon()
  }

  adjustedStat(nature: Nature, stat: string, value: number) {
    const adj = statAdjustment[nature]
    if (adj.buff === stat) {
      return Math.floor(value*1.1)
    } else if (adj.nerf === stat) {
      return Math.floor(value*0.9)
    }
    return value
  }

  textColor(nature: Nature, stat: string) {
    const adj = statAdjustment[nature]
    if (adj.buff === stat) {
      return getComputedStyle(document.body)
        .getPropertyValue('--type-fire')
    } else if (adj.nerf === stat) {
      return getComputedStyle(document.body)
        .getPropertyValue('--type-water')
    }
    return getComputedStyle(document.body)
      .getPropertyValue('--hexagon-text-color')
  }

  textStat(nature: Nature, stat: string, value: number) {
    const val = this.adjustedStat(nature, stat, value)
    return val.toString()
  }

  rebuildHexagon() {
    if (!this.hexagon) return
    const ctx = this.hexagon!.nativeElement.getContext('2d')
    if (ctx === null) return
    this.previousEvents.forEach(x => {
      clearTimeout(x)
    })
    this.previousEvents = []

    const finalStats = {
      hp: this.adjustedStat(this.nature, 'hp', this.hp),
      attack: this.adjustedStat(this.nature, 'attack', this.attack),
      defense: this.adjustedStat(this.nature, 'defense', this.defense),
      spattack: this.adjustedStat(this.nature, 'spAttack', this.spattack),
      spdefense: this.adjustedStat(this.nature, 'spDefense', this.spdefense),
      speed: this.adjustedStat(this.nature, 'speed', this.speed),
    }

    // 17ms/frame => 289ms transition (17 iterations)
    const frames = 10
    for (let i = 0; i < frames; i++) {
      // Compute diffs to animate the hexagon over each 'frame'
      const statDelta = {
        hp: (this.hp - this.originalStats.hp) / frames,
        attack: (this.attack - this.originalStats.attack) / frames,
        defense: (this.defense - this.originalStats.defense) / frames,
        spattack: (this.spattack - this.originalStats.spattack) / frames,
        spdefense: (this.spdefense - this.originalStats.spdefense) / frames,
        speed: (this.speed - this.originalStats.speed) / frames,
      }
      this.previousEvents.push(setTimeout(() => {
        this.drawHexagon({
          hp: this.originalStats.hp + statDelta.hp * i,
          attack: this.originalStats.attack + statDelta.attack * i,
          defense: this.originalStats.defense + statDelta.defense * i,
          spattack: this.originalStats.spattack + statDelta.spattack * i,
          spdefense: this.originalStats.spdefense + statDelta.spdefense * i,
          speed: this.originalStats.speed + statDelta.speed * i,
        })
      }, i * 17, this))
    }
    this.previousEvents.push(setTimeout(() => {
      // Update our original stats for the next transition
      this.originalStats = {...finalStats}
      this.drawHexagon({
        hp: this.originalStats.hp,
        attack: this.originalStats.attack,
        defense: this.originalStats.defense,
        spattack: this.originalStats.spattack,
        spdefense: this.originalStats.spdefense,
        speed: this.originalStats.speed,
      })
    }, 17 * frames + 17, this))
  }

  drawHexagon(values: { hp: number, attack: number, defense: number, spattack: number, spdefense: number, speed: number}) {
    const ctx = this.hexagon!.nativeElement.getContext('2d')!
    // Clear
    ctx.clearRect(0, 0, 75, 75);

    ctx.fillStyle = getComputedStyle(document.body)
      .getPropertyValue('--hexagon-bg-color')
    ctx.beginPath()
    ctx.moveTo(32, 5)
    ctx.lineTo(59, 20)
    ctx.lineTo(59, 50)
    ctx.lineTo(32, 65)
    ctx.lineTo(5, 50)
    ctx.lineTo(5, 20)
    ctx.lineTo(30, 5)
    ctx.closePath()
    ctx.fill()

    // Text
    ctx.font = "7px monospace"
    ctx.fillStyle = this.textColor(this.nature, 'hp')
    ctx.fillText("HP", 28, 7)
    ctx.fillText(this.textStat(this.nature, 'hp', this.hp), 28, 14)

    ctx.fillStyle = this.textColor(this.nature, 'attack')
    ctx.fillText("ATK", 57, 15)
    ctx.fillText(this.textStat(this.nature, 'attack', this.attack), 57, 22)

    ctx.fillStyle = this.textColor(this.nature, 'defense')
    ctx.fillText("DEF", 57, 48)
    ctx.fillText(this.textStat(this.nature, 'defense', this.defense), 57, 55)

    ctx.fillStyle = this.textColor(this.nature, 'spAttack')
    ctx.fillText("SPA", 0, 15)
    ctx.fillText(this.textStat(this.nature, 'spAttack', this.spattack), 0, 22)

    ctx.fillStyle = this.textColor(this.nature, 'spDefense')
    ctx.fillText("SPD", 0, 48)
    ctx.fillText(this.textStat(this.nature, 'spDefense', this.spdefense), 0, 55)

    ctx.fillStyle = this.textColor(this.nature, 'speed')
    ctx.fillText("SPE", 25, 68)
    ctx.fillText(this.textStat(this.nature, 'speed', this.speed), 25, 75)

    // Smaller hexagon
    const divisor = 130
    const mult = 20
    const multStr = 30
    const hpp = Math.min(multStr * (values.hp/divisor), multStr)
    const attackp = Math.min(mult * (values.attack/divisor), mult)
    const defensep = Math.min(mult * (values.defense/divisor), mult)
    const spAttackp = Math.min(mult * (values.spattack/divisor), mult)
    const spDefensep = Math.min(mult * (values.spdefense/divisor), mult)
    const speedp = Math.min(multStr * (values.speed/divisor), multStr)
    ctx.fillStyle = '#09f';
    ctx.beginPath();
    ctx.moveTo(32, 35 - hpp);
    ctx.lineTo(32 + attackp, 35 - attackp);
    ctx.lineTo(32 + defensep, 35 + defensep);
    ctx.lineTo(32, 35 + speedp);
    ctx.lineTo(32 - spDefensep, 35 +  spDefensep);
    ctx.lineTo(32 - spAttackp, 35 - spAttackp);
    ctx.lineTo(32, 35 - hpp);
    ctx.closePath();
    ctx.fill();
  }
}
