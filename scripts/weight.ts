import { datastore } from "../shared/src/pokemon";

/*
 * Sky Drop - 200
 * Grass Knot - 10, 25, 50, 100, 200
 */

let wsc = 0
let wlc = 0
for (const p of Object.values(datastore)) {
  const w = p.weight
  const ws = w * 0.8
  const wl = w * 1.2
  const keypoints = [10, 25, 50, 100, 200]
  for (const k of keypoints) {
    if (w > k && ws < k) {
      wsc++
      console.log('XXS', w, ws, k, p.species)
    }
    if (w < k && wl > k) {
      wlc++
      console.log('XXL', w, wl, k, p.species)
    }
  }
}
console.log('XXS Implications', wsc) // 201 (gen 7)
console.log('XXL Implications', wlc) // 143 (gen 7)
