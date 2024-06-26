import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';

const STAR_SMALL = 3
const STAR_LARGE = 6

@Component({
  selector: 'app-constellation',
  templateUrl: './constellation.component.html',
  styleUrls: ['./constellation.component.css']
})
export class ConstellationComponent implements AfterViewInit, OnDestroy {
  @Input('uid') uid?: string
  @ViewChild('canvas') canvas: ElementRef<HTMLCanvasElement>
  flicker?: any

  ngAfterViewInit() {
    let frame = 0
    this.flicker = setInterval(() => {
      this.drawConstellationTurtonator(++frame)
      this.dotUserStars(this.uid)
    }, 140)
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

  /**
   * Add stars in the background of the constellation based on the user ID.
   * Every user will have a slightly different constellation.
   */
  dotUserStars(uid: string = '') {
    let row = 0
    let col = 0
    // Firebase UIDs have 64 possibilities
    const firebaseUids = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-_'
    if (!this.canvas) return
    const ctx = this.canvas!.nativeElement.getContext('2d')
    if (ctx === null) return

    for (const char of uid) {
      // Iterate through each character
      const offset = firebaseUids.indexOf(char)
      const radius = offset % 3 + 1
      ctx.fillStyle = '#ffffff99'
      ctx.strokeStyle = '#ffffff99'
      ctx.beginPath()
      ctx.ellipse(Math.min(col * 64 + offset, 477), row * 120 + offset * 2, radius, radius, 0, 0, 360)
      ctx.closePath()
      ctx.fill()
      // See 'veXJXuNwZ7RsUXV6tQqWjboQOy03'
      //     ^--- 28 characters
      //     4 rows of 7
      //     480/7 ~= 64
      //     480/4 = 120
      if (col >= 7 /* 64 * 7 = 448 */) {
        col = 0
        row++
      } else {
        col++
      }
    }
  }

  drawConstellationTurtonator(frame: number) {
    if (!this.canvas) return
    const ctx = this.canvas!.nativeElement.getContext('2d')
    if (ctx === null) return

    ctx.clearRect(0, 0, 480, 480)
    ctx.strokeStyle = '#ffffff'
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    
    ctx.moveTo(379, 19)
    ctx.lineTo(331, 28)
    ctx.lineTo(304, 21)
    ctx.lineTo(305, 31)
    ctx.lineTo(263, 36)
    ctx.lineTo(310, 58)
    ctx.lineTo(305, 73)
    ctx.lineTo(271, 119)
    ctx.lineTo(242, 49)
    ctx.lineTo(178, 78)
    ctx.lineTo(125, 50)
    ctx.lineTo(94, 118)
    ctx.lineTo(45, 160)
    ctx.lineTo(62, 220)
    ctx.lineTo(44, 297)
    ctx.lineTo(100, 315)
    ctx.lineTo(130, 377)
    ctx.lineTo(106, 370)
    ctx.lineTo(109, 394)
    ctx.lineTo(60, 404)
    ctx.lineTo(60, 464)
    ctx.lineTo(140, 461)
    ctx.lineTo(136, 419)
    ctx.lineTo(169, 418)
    ctx.lineTo(171, 390)
    ctx.lineTo(215, 388)
    ctx.lineTo(187, 358)
    ctx.lineTo(240, 395)
    ctx.lineTo(265, 313)
    ctx.lineTo(318, 289)
    ctx.lineTo(300, 218)
    ctx.lineTo(331, 146)
    ctx.lineTo(367, 115)
    ctx.lineTo(383, 137)
    ctx.lineTo(417, 101)
    ctx.lineTo(448, 100)
    ctx.lineTo(439, 78)
    ctx.lineTo(461, 74)
    ctx.lineTo(431, 54)
    ctx.lineTo(428, 41)
    ctx.lineTo(411, 40)
    ctx.lineTo(379, 19)

    ctx.moveTo(318, 289)
    ctx.lineTo(323, 336)
    ctx.lineTo(341, 368)
    ctx.lineTo(330, 381)
    ctx.lineTo(330, 403)
    ctx.lineTo(292, 392)
    ctx.lineTo(261, 403)
    ctx.lineTo(252, 385)

    ctx.stroke()
    ctx.closePath()

    this.star(ctx, 185, 54, 1, frame)
    this.star(ctx, 49, 69, 3, frame)
    this.star(ctx, 27, 162, 5, frame)
    this.star(ctx, 4, 294, 7, frame)
    this.star(ctx, 95, 351, 9, frame)
    this.star(ctx, 174, 376, 2, frame)
    this.star(ctx, 257, 288, 4, frame)
    this.star(ctx, 268, 134, 6, frame)
    // this.star(ctx, 348, 86, 8, frame)
    // this.star(ctx, 396, 95, 1, frame)
  }

  drawConstellationTyranitar(frame: number) {
    if (!this.canvas) return
    const ctx = this.canvas!.nativeElement.getContext('2d')
    if (ctx === null) return

    ctx.clearRect(0, 0, 480, 480)
    ctx.strokeStyle = '#ffffff'
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    
    ctx.moveTo(71, 43)
    ctx.lineTo(102,105)
    ctx.lineTo(122,126)
    ctx.lineTo(116,171)
    ctx.lineTo(42,216)
    ctx.lineTo(26,225)
    ctx.lineTo(35, 233)
    ctx.lineTo(33,244)
    ctx.lineTo(45,241)
    ctx.lineTo(109,235)
    ctx.lineTo(108,329)
    ctx.lineTo(103,367)
    ctx.lineTo(144,416)
    ctx.lineTo(176,435)
    ctx.lineTo(142,452)
    ctx.lineTo(149,460)
    ctx.lineTo(176,458)
    ctx.lineTo(177, 469)
    ctx.lineTo(218,468)
    ctx.lineTo(220,474)
    ctx.lineTo(247,469)
    ctx.lineTo(289,464)
    ctx.lineTo(268,441)
    ctx.lineTo(268,428)
    ctx.lineTo(368,437)
    ctx.lineTo(415,453)
    ctx.lineTo(403,432)
    ctx.lineTo(441,408)
    ctx.lineTo(450,390)
    ctx.lineTo(407,385)
    ctx.lineTo(414,368)
    ctx.lineTo(377,383)
    ctx.lineTo(318,349)
    ctx.lineTo(290,271)
    ctx.lineTo(278,221)
    ctx.lineTo(292,207)
    ctx.lineTo(292,186)
    ctx.lineTo(313,169)
    ctx.lineTo(281,167)
    ctx.lineTo(330,124)
    ctx.lineTo(260,137)
    ctx.lineTo(282,100)
    ctx.lineTo(232,117)
    ctx.lineTo(300,113)
    ctx.lineTo(209,79)
    ctx.lineTo(270,76)
    ctx.lineTo(185,46)
    ctx.lineTo(180,39)
    ctx.lineTo(217,21)
    ctx.lineTo(71,43)

    ctx.moveTo(109,235)
    ctx.lineTo(134,182)
    ctx.lineTo(187,247)
    ctx.lineTo(137,336)
    ctx.lineTo(109,235)
    ctx.stroke()
    ctx.closePath()

    this.star(ctx, 115, 46, 1, frame)
    this.star(ctx, 26, 225, 1, frame)
    this.star(ctx, 35, 233, 1, frame)
    this.star(ctx, 140, 452, 1, frame)
    this.star(ctx, 150, 460, 1, frame)
    this.star(ctx, 170, 462, 1, frame)
    this.star(ctx, 177, 473, 1, frame)
    this.star(ctx, 219, 475, 1, frame)
    // this.star(ctx, , 1, frame)
    // this.star(ctx, 115, 46, 1, frame)
  }

  drawConstellationHeracross(frame: number) {
    if (!this.canvas) return
    const ctx = this.canvas!.nativeElement.getContext('2d')
    if (ctx === null) return

    ctx.clearRect(0, 0, 480, 480)
    ctx.strokeStyle = '#ffffff'
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    
    ctx.moveTo(190, 81)
    ctx.lineTo(170, 25)
    ctx.lineTo(154, 75)
    ctx.lineTo(146, 87)
    ctx.lineTo(181, 106)
    ctx.lineTo(190, 179)
    ctx.lineTo(175, 162)
    ctx.lineTo(176, 142)
    ctx.lineTo(157, 140)
    ctx.lineTo(154, 159)
    ctx.lineTo(168, 165)
    ctx.lineTo(181, 187)
    ctx.lineTo(170, 245)
    ctx.lineTo(145, 284)
    ctx.lineTo(123, 296)
    ctx.lineTo(49, 317)
    ctx.lineTo(43, 341)
    ctx.lineTo(27, 357)
    ctx.lineTo(46, 389)
    ctx.lineTo(47, 379)
    ctx.lineTo(56, 381)
    ctx.lineTo(62, 356)
    ctx.lineTo(75, 372)
    ctx.lineTo(100, 343)
    ctx.lineTo(107, 359)
    ctx.lineTo(138, 305)
    ctx.lineTo(155, 292)
    ctx.lineTo(181, 290)
    ctx.lineTo(192, 322)
    ctx.lineTo(175, 334)
    ctx.lineTo(167, 318)
    ctx.lineTo(158, 353)
    ctx.lineTo(159, 381)
    ctx.lineTo(129, 416)
    ctx.lineTo(201, 395)
    ctx.lineTo(197, 383)
    ctx.lineTo(216, 371)
    ctx.lineTo(258, 386)
    ctx.lineTo(307, 381)
    ctx.lineTo(342, 395)
    ctx.lineTo(348, 419)
    ctx.lineTo(374, 436)
    ctx.lineTo(404, 452)
    ctx.lineTo(400, 432)
    ctx.lineTo(376, 403)
    ctx.lineTo(369, 361)
    ctx.lineTo(366, 320)
    ctx.lineTo(338, 325)
    ctx.lineTo(331, 286)
    ctx.lineTo(354, 294)
    ctx.lineTo(373, 305)
    ctx.lineTo(388, 381)
    ctx.lineTo(398, 392)
    ctx.lineTo(397, 413)
    ctx.lineTo(415, 403)
    ctx.lineTo(417, 420)
    ctx.lineTo(432, 397)
    ctx.lineTo(437, 384)
    ctx.lineTo(451, 378)
    ctx.lineTo(429, 352)
    ctx.lineTo(439, 346)
    ctx.lineTo(402, 306)
    ctx.lineTo(377, 295)
    ctx.lineTo(367, 281)
    ctx.lineTo(325, 233)
    ctx.lineTo(283, 163)
    ctx.lineTo(296, 146)
    ctx.lineTo(284, 129)
    ctx.lineTo(270, 143)
    ctx.lineTo(271, 155)
    ctx.lineTo(216, 162)
    ctx.lineTo(204, 101)
    ctx.lineTo(240, 102)
    ctx.lineTo(237, 66)
    ctx.lineTo(238, 22)

    ctx.lineTo(190, 81)
    ctx.stroke()
    ctx.closePath()

    this.star(ctx, 190, 81, 1, frame)
    this.star(ctx, 168, 21, 3, frame)
    this.star(ctx, 238, 22, 5, frame)
    this.star(ctx, 155, 139, 7, frame)
    this.star(ctx, 52, 374, 9, frame)
    this.star(ctx, 40, 384, 2, frame)
    this.star(ctx, 129, 414, 4, frame)
    this.star(ctx, 406, 453, 6, frame)
    this.star(ctx, 396, 412, 8, frame)
    this.star(ctx, 418, 417, 1, frame)
    this.star(ctx, 257, 387, 3, frame)
    this.star(ctx, 214, 369, 5, frame)
    this.star(ctx, 308, 378, 7, frame)
    this.star(ctx, 364, 319, 9, frame)
    this.star(ctx, 166, 320, 2, frame)
    this.star(ctx, 283, 125, 4, frame)
  }

  drawConstellationPidgey(frame: number) {
    if (!this.canvas) return
    const ctx = this.canvas!.nativeElement.getContext('2d')
    if (ctx === null) return

    ctx.clearRect(0, 0, 480, 480)
    ctx.strokeStyle = '#ffffff'
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()

    ctx.moveTo(161, 3)
    ctx.lineTo(100, 43)
    ctx.lineTo(103, 24)
    ctx.lineTo(82, 49)
    ctx.lineTo(84, 30)
    ctx.lineTo(63, 89)
    ctx.lineTo(28, 109)
    ctx.lineTo(63, 139)
    ctx.lineTo(47, 164)
    ctx.lineTo(69, 171)
    ctx.lineTo(37, 261)
    ctx.lineTo(44, 317)
    ctx.lineTo(153, 388)
    ctx.lineTo(115, 404)
    ctx.lineTo(55, 432)
    ctx.lineTo(90, 441)
    ctx.lineTo(94, 442)
    ctx.lineTo(136, 429)
    ctx.lineTo(120, 465)
    ctx.lineTo(156, 448)
    ctx.lineTo(154, 475)
    ctx.lineTo(210, 459)
    ctx.lineTo(232, 438)
    ctx.lineTo(287, 441)
    ctx.lineTo(238, 412)
    ctx.lineTo(237, 399)
    ctx.lineTo(283, 378)
    ctx.lineTo(345, 402)
    ctx.lineTo(353, 367)
    ctx.lineTo(347, 313)
    ctx.lineTo(467, 291)
    ctx.lineTo(454, 266)
    ctx.lineTo(473, 265)
    ctx.lineTo(394, 228)
    ctx.lineTo(361, 255)
    ctx.lineTo(331, 262)
    ctx.lineTo(310, 230)
    ctx.lineTo(231, 175)
    ctx.lineTo(203, 92)
    ctx.lineTo(232, 95)
    ctx.lineTo(194, 61)
    ctx.lineTo(204, 49)
    ctx.lineTo(172, 47)
    ctx.lineTo(190, 22)
    ctx.lineTo(150, 28)
    ctx.lineTo(161, 3)
    ctx.stroke()
    ctx.closePath()

    this.star(ctx, 106, 92, 1, frame)
    this.star(ctx, 161, 3, 3, frame)
    this.star(ctx, 63, 89, 5, frame)
    this.star(ctx, 28, 109, 7, frame)
    this.star(ctx, 63, 139, 2, frame)
    this.star(ctx, 44, 317, 4, frame)
    this.star(ctx, 47, 164, 9, frame)
    this.star(ctx, 153, 388, 6, frame)
    this.star(ctx, 115, 404, 8, frame)
    this.star(ctx, 94, 442, 1, frame)
    this.star(ctx, 120, 465, 3, frame)
    this.star(ctx, 154, 475, 5, frame)
    this.star(ctx, 287, 441, 7, frame)
    this.star(ctx, 283, 378, 9, frame)
    this.star(ctx, 345, 402, 2, frame)
    this.star(ctx, 347, 313, 4, frame)
    this.star(ctx, 454, 266, 6, frame)
    this.star(ctx, 394, 228, 8, frame)
    this.star(ctx, 232, 95, 1, frame)
    this.star(ctx, 194, 61, 3, frame)
    this.star(ctx, 190, 22, 5, frame)
  }

  drawConstellationLuvdisc(frame: number) {
    if (!this.canvas) return
    const ctx = this.canvas!.nativeElement.getContext('2d')
    if (ctx === null) return    

    ctx.clearRect(0, 0, 480, 480)
    ctx.strokeStyle = '#ffffff'
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()

    ctx.moveTo(289, 9)
    ctx.lineTo(219, 53)
    ctx.lineTo(167, 165)
    ctx.lineTo(146, 224)
    ctx.lineTo(118, 255)
    ctx.lineTo(151, 250)
    ctx.lineTo(118, 255)
    ctx.lineTo(143, 296)
    ctx.lineTo(171, 354)
    ctx.lineTo(223, 452)
    ctx.lineTo(283, 472)
    ctx.lineTo(346, 421)
    ctx.lineTo(350, 312)
    ctx.lineTo(337, 247)
    ctx.lineTo(353, 196)
    ctx.lineTo(363, 79)
    ctx.lineTo(289, 9)

    // Mouth
    ctx.moveTo(118, 255)
    ctx.lineTo(151, 250)
    ctx.moveTo(118, 255)
    ctx.lineTo(146, 224)
    ctx.lineTo(190, 255)
    ctx.lineTo(143, 296)

    // Eye
    ctx.moveTo(237, 187)
    ctx.lineTo(255, 215)
    ctx.lineTo(237, 250)
    ctx.lineTo(218, 215)
    ctx.lineTo(237, 187)
    ctx.stroke()
    ctx.closePath()

    // Lil dot
    this.star(ctx, 263, 263, 1, frame)
    this.star(ctx, 289, 9, 3, frame)
    this.star(ctx, 219, 53, 5, frame)
    this.star(ctx, 167, 165, 7, frame)
    this.star(ctx, 146, 224, 9, frame)
    this.star(ctx, 118, 255, 2, frame)
    this.star(ctx, 151, 250, 4, frame)
    this.star(ctx, 143, 296, 6, frame)
    this.star(ctx, 171, 354, 8, frame)
    this.star(ctx, 223, 452, 1, frame)
    this.star(ctx, 283, 472, 3, frame)
    this.star(ctx, 346, 421, 5, frame)
    this.star(ctx, 350, 312, 7, frame)
    this.star(ctx, 337, 247, 9, frame)
    this.star(ctx, 353, 196, 2, frame)
    this.star(ctx, 363, 79, 4, frame)
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
