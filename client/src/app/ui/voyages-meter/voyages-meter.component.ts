import { Component, Input } from '@angular/core';
import { getBucket, VoyageId, Voyages } from '../../../../../shared/src/voyages';

@Component({
  selector: 'voyages-meter',
  templateUrl: './voyages-meter.component.html',
  styleUrls: ['./voyages-meter.component.css']
})
export class VoyagesMeterComponent {
  @Input('score') score: number
  @Input('vid') vid: VoyageId

  get bucket() {
    if (!this.score || !this.vid) return 0
    return getBucket(Voyages[this.vid], this.score)
  }

  get width() {
    if (!this.score || !this.vid) return '0px'
    const w = 158 * (this.score / Voyages[this.vid].buckets[3])
    return `${Math.min(w, 158)}px`
  }

  get type() {
    if (!this.score || !this.vid) return '0px'
    return Voyages[this.vid].typePrimary
  }
}
