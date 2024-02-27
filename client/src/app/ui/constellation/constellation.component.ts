import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';

const STAR_SMALL = 3
const STAR_LARGE = 6

@Component({
  selector: 'app-constellation',
  templateUrl: './constellation.component.html',
  styleUrls: ['./constellation.component.css']
})
export class ConstellationComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvas: ElementRef<HTMLCanvasElement>
  flicker?: any

  ngAfterViewInit() {
    let frame = 0
    this.flicker = setInterval(() => {
      this.drawConstellationCalyrex(++frame)
    }, 150)
  }

  ngOnDestroy(): void {
    clearInterval(this.flicker)
  }

  getRadius(offset: number, frame: number) {
    const modulus = (STAR_LARGE - STAR_SMALL)
    const mod2 = modulus * 2
    const starFrame = (offset + frame) % mod2
    if (starFrame > modulus) {
      return STAR_LARGE - ((offset + frame) % modulus)
    } else {
      return STAR_SMALL + starFrame
    }
  }

  star(ctx: CanvasRenderingContext2D, x: number, y: number, offset: number, frame: number) {
    const rad = this.getRadius(offset, frame)
    ctx.beginPath()
    ctx.ellipse(x, y, rad, rad, 0, 0, 360)
    ctx.closePath()
    ctx.fill()
  }

  drawConstellationCalyrex(frame: number) {
    if (!this.canvas) return
    const ctx = this.canvas!.nativeElement.getContext('2d')
    if (ctx === null) return    

    ctx.clearRect(0, 0, 480, 480)
    ctx.strokeStyle = '#ffffff'
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.moveTo(208, 8)
    ctx.lineTo(190, 31)
    ctx.lineTo(208, 52)
    ctx.lineTo(193, 68)
    ctx.lineTo(148, 81)
    ctx.lineTo(126, 108)
    ctx.lineTo(43, 158)
    ctx.lineTo(56, 236)
    ctx.lineTo(97, 279)
    ctx.lineTo(72, 274)
    ctx.lineTo(47, 254)
    ctx.lineTo(57, 286)
    ctx.lineTo(118, 324)
    ctx.lineTo(172, 329)
    ctx.lineTo(157, 347)
    ctx.lineTo(160, 378)
    ctx.lineTo(189, 385)
    ctx.lineTo(196, 395)
    ctx.lineTo(216, 395)
    ctx.lineTo(225, 385)
    ctx.lineTo(243, 378)
    ctx.lineTo(259, 347)
    ctx.lineTo(240, 324)
    ctx.lineTo(298, 320)
    ctx.lineTo(360, 279)
    ctx.lineTo(372, 254)
    ctx.lineTo(346, 272)
    ctx.lineTo(308, 291)
    ctx.lineTo(361, 239)
    ctx.lineTo(381, 177)
    ctx.lineTo(356, 130)
    ctx.lineTo(292, 107)
    ctx.lineTo(270, 83)
    ctx.lineTo(224, 68)
    ctx.lineTo(208, 52)
    ctx.lineTo(228, 31)
    ctx.lineTo(208, 8)
    ctx.stroke()
    ctx.closePath()

    this.star(ctx, 208, 8, 1, frame)
    this.star(ctx, 190, 31, 3, frame)
    this.star(ctx, 208, 52, 5, frame)
    this.star(ctx, 193, 68, 7, frame)
    this.star(ctx, 148, 81, 9, frame)
    this.star(ctx, 126, 108, 2, frame)
    this.star(ctx, 43, 158, 4, frame)
    this.star(ctx, 56, 236, 6, frame)
    this.star(ctx, 97, 279, 8, frame)
    this.star(ctx, 72, 274, 1, frame)
    this.star(ctx, 47, 254, 3, frame)
    this.star(ctx, 57, 286, 5, frame)
    this.star(ctx, 118, 324, 7, frame)
    this.star(ctx, 172, 329, 9, frame)
    this.star(ctx, 157, 347, 2, frame)
    this.star(ctx, 160, 378, 4, frame)
    this.star(ctx, 189, 385, 6, frame)
    this.star(ctx, 196, 395, 8, frame)
    this.star(ctx, 216, 395, 1, frame)
    this.star(ctx, 225, 385, 3, frame)
    this.star(ctx, 243, 378, 5, frame)
    this.star(ctx, 259, 347, 7, frame)
    this.star(ctx, 240, 324, 9, frame)
    this.star(ctx, 298, 320, 2, frame)
    this.star(ctx, 360, 279, 4, frame)
    this.star(ctx, 372, 254, 6, frame)
    this.star(ctx, 346, 272, 8, frame)
    this.star(ctx, 308, 291, 1, frame)
    this.star(ctx, 361, 239, 3, frame)
    this.star(ctx, 381, 177, 5, frame)
    this.star(ctx, 356, 130, 7, frame)
    this.star(ctx, 292, 107, 9, frame)
    this.star(ctx, 270, 83, 2, frame)
    this.star(ctx, 224, 68, 4, frame)
    this.star(ctx, 208, 52, 6, frame)
    this.star(ctx, 228, 31, 8, frame)
    this.star(ctx, 208, 8, 1, frame)
    this.star(ctx, 183, 360, 3, frame)
    this.star(ctx, 183, 360, 5, frame)
    this.star(ctx, 235, 360, 7, frame)
  }

  drawConstellationEternatus(frame: number) {
    if (!this.canvas) return
    const ctx = this.canvas!.nativeElement.getContext('2d')
    if (ctx === null) return    

    ctx.clearRect(0, 0, 480, 480)
    ctx.strokeStyle = '#ffffff'
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.moveTo(304, 303)
    ctx.lineTo(300, 260)
    ctx.lineTo(391, 164)
    ctx.lineTo(255, 233)
    ctx.lineTo(228, 212)
    ctx.lineTo(132, 89)
    ctx.lineTo(183, 229)
    ctx.lineTo(17, 224)
    ctx.lineTo(160, 261)
    ctx.lineTo(153, 293)
    ctx.lineTo(32, 356)
    ctx.lineTo(162, 329)
    ctx.lineTo(184, 324)
    ctx.lineTo(196, 350)
    ctx.lineTo(211, 330)
    ctx.lineTo(266, 340)
    ctx.lineTo(372, 428)
    ctx.lineTo(289, 315)
    ctx.lineTo(291, 303) //
    ctx.lineTo(304, 303)
    ctx.lineTo(403, 332) //
    ctx.lineTo(459, 366)
    ctx.lineTo(422, 253)
    ctx.lineTo(352, 265) //
    ctx.lineTo(248, 198)
    ctx.lineTo(325, 184) //
    ctx.lineTo(424, 196) //
    ctx.lineTo(454, 213)
    ctx.lineTo(427, 236)
    ctx.lineTo(373, 244)
    ctx.lineTo(334, 240)

    ctx.stroke()
    ctx.closePath()

    this.star(ctx, 300, 260, 1, frame)
    this.star(ctx, 391, 164, 3, frame)
    this.star(ctx, 255, 233, 5, frame)
    this.star(ctx, 228, 212, 7, frame)
    this.star(ctx, 132, 89, 2, frame)
    this.star(ctx, 183, 229, 4, frame)
    this.star(ctx, 17, 224, 6, frame)
    this.star(ctx, 160, 261, 8, frame)
    this.star(ctx, 153, 293, 1, frame)
    this.star(ctx, 32, 356, 3, frame)
    this.star(ctx, 162, 329, 5, frame)
    this.star(ctx, 184, 324, 7, frame)
    this.star(ctx, 196, 350, 2, frame)
    this.star(ctx, 211, 330, 4, frame)
    this.star(ctx, 266, 340, 6, frame)
    this.star(ctx, 372, 428, 8, frame)
    this.star(ctx, 289, 315, 1, frame)
    this.star(ctx, 304, 303, 3, frame)
    this.star(ctx, 459, 366, 5, frame)
    this.star(ctx, 422, 253, 7, frame)
    this.star(ctx, 248, 198, 2, frame)
    this.star(ctx, 454, 213, 4, frame)
    this.star(ctx, 427, 236, 6, frame)
    this.star(ctx, 373, 244, 8, frame)
    this.star(ctx, 334, 240, 1, frame)
  }

  drawConstellationPumpkaboo(frame: number) {
    if (!this.canvas) return
    const ctx = this.canvas!.nativeElement.getContext('2d')
    if (ctx === null) return    

    ctx.clearRect(0, 0, 480, 480)
    ctx.strokeStyle = '#ffffff'
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.moveTo(190, 51)
    ctx.lineTo(217, 72)
    ctx.lineTo(239, 39)
    ctx.lineTo(209, 13)
    ctx.lineTo(153, 50)
    ctx.lineTo(184, 130)
    ctx.lineTo(142, 94)
    ctx.moveTo(184, 130)
    ctx.lineTo(258, 102)
    ctx.moveTo(142, 94)
    ctx.lineTo(114, 175)
    ctx.lineTo(24, 170)
    ctx.lineTo(68, 270)
    ctx.lineTo(63, 324)
    ctx.lineTo(136, 391)
    ctx.lineTo(168, 376)
    ctx.lineTo(213, 393)
    ctx.lineTo(302, 344)
    ctx.lineTo(317, 282)
    ctx.lineTo(375, 172)
    ctx.lineTo(261, 168)
    ctx.lineTo(258, 102)
    // Mouth
    ctx.moveTo(141, 209)
    ctx.lineTo(159, 195)
    ctx.lineTo(182, 211)
    ctx.stroke()
    ctx.closePath()

    this.star(ctx, 190, 51, 1, frame)
    this.star(ctx, 217, 72, 3, frame)
    this.star(ctx, 239, 39, 5, frame)
    this.star(ctx, 209, 13, 7, frame)
    this.star(ctx, 153, 50, 9, frame)
    this.star(ctx, 184, 130, 2, frame)
    this.star(ctx, 142, 94, 4, frame)
    this.star(ctx, 258, 102, 6, frame)
    this.star(ctx, 114, 175, 8, frame)
    this.star(ctx, 24, 170, 1, frame)
    this.star(ctx, 68, 270, 3, frame)
    this.star(ctx, 63, 324, 5, frame)
    this.star(ctx, 136, 391, 7, frame)
    this.star(ctx, 168, 376, 9, frame)
    this.star(ctx, 213, 393, 2, frame)
    this.star(ctx, 302, 344, 4, frame)
    this.star(ctx, 317, 282, 6, frame)
    this.star(ctx, 375, 172, 8, frame)
    this.star(ctx, 261, 168, 1, frame)
    this.star(ctx, 258, 102, 3, frame)
    // And eyes/body
    this.star(ctx, 146, 174, 5, frame)
    this.star(ctx, 201, 181, 7, frame)
    this.star(ctx, 99, 309, 9, frame)
    this.star(ctx, 225, 315, 2, frame)
    // And mouth
    this.star(ctx, 141, 209, 4, frame)
    this.star(ctx, 159, 195, 6, frame)
    this.star(ctx, 182, 211, 8, frame)
  }

  drawConstellationArceus(frame: number) {
    if (!this.canvas) return
    const ctx = this.canvas!.nativeElement.getContext('2d')
    if (ctx === null) return

    ctx.clearRect(0, 0, 480, 480)
    ctx.strokeStyle = '#ffffff'
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()

    ctx.moveTo(298, 21)
    ctx.lineTo(235, 45)
    ctx.lineTo(174, 120)
    ctx.lineTo(173, 79)
    ctx.moveTo(174, 120)
    ctx.lineTo(149, 76)
    ctx.moveTo(174, 120)
    ctx.lineTo(133, 130)
    ctx.moveTo(174, 120)
    ctx.lineTo(185, 148)
    ctx.lineTo(156, 211)
    ctx.lineTo(118, 263)
    ctx.lineTo(71, 316)
    ctx.lineTo(169, 400)
    ctx.moveTo(118, 263)
    ctx.lineTo(89, 381)
    ctx.moveTo(118, 263)
    ctx.lineTo(197, 260)
    ctx.lineTo(223, 275)
    ctx.lineTo(241, 212)
    ctx.moveTo(223, 275)
    ctx.lineTo(300, 227)
    ctx.moveTo(223, 275)
    ctx.lineTo(191, 344)
    ctx.moveTo(223, 275)
    ctx.lineTo(258, 368)
    ctx.moveTo(223, 275)
    ctx.lineTo(272, 289)
    ctx.lineTo(222, 455)
    ctx.moveTo(265, 469)
    ctx.lineTo(336, 344)
    ctx.lineTo(272, 289)
    ctx.lineTo(405, 238)
    ctx.stroke()
    ctx.closePath()

    this.star(ctx, 298, 21, 1, frame)
    this.star(ctx, 235, 45, 3, frame)
    this.star(ctx, 174, 120, 5, frame)
    this.star(ctx, 173, 79, 7, frame)
    this.star(ctx, 146, 76, 9, frame)
    this.star(ctx, 133, 130, 2, frame)
    this.star(ctx, 185, 148, 4, frame)
    this.star(ctx, 156, 211, 6, frame)
    this.star(ctx, 118, 263, 8, frame)
    this.star(ctx, 71, 316, 1, frame)
    this.star(ctx, 169, 400, 3, frame)
    this.star(ctx, 89, 381, 5, frame)
    this.star(ctx, 197, 260, 7, frame)
    this.star(ctx, 223, 275, 9, frame)
    this.star(ctx, 241, 212, 1, frame)
    this.star(ctx, 300, 227, 3, frame)
    this.star(ctx, 191, 344, 5, frame)
    this.star(ctx, 258, 368, 7, frame)
    this.star(ctx, 272, 289, 9, frame)
    this.star(ctx, 222, 455, 2, frame)
    this.star(ctx, 336, 344, 4, frame)
    this.star(ctx, 272, 289, 6, frame)
    this.star(ctx, 405, 238, 8, frame)
    this.star(ctx, 265, 469, 1, frame)
  }
}
