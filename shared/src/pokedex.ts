export interface Region {
  key: string
  label: string
  range: [number, number],
  total: number
}

export const regions: Region[] = [{
  key: '', label: '', range: [0, 0], total: 0
}, {
  key: 'kanto', label: 'Kanto',
  range: [1, 151], total: 151,
}, {
  key: 'johto', label: 'Johto',
  range: [152, 251], total: 100,
}, {
  key: 'hoenn', label: 'Hoenn',
  range: [252, 386], total: 135
}, {
  key: 'sinnoh', label: 'Sinnoh',
  range: [387, 493], total: 107
}, {
  key: 'unova', label: 'Unova',
  range: [494, 649], total: 156
}, {
  key: 'kalos', label: 'Kalos',
  range: [650, 721], total: 72,
}, {
  key: 'alola', label: 'Alola',
  range: [722, 807], total: 86,
}, {
  key: 'unknown', label: 'Unknown',
  range: [808, 809], total: 2,
}, {
  key: 'galar', label: 'Galar',
  range: [810, 898], total: 89,
}, {
  key: 'hisui', label: 'Hisui',
  range: [899, 905], total: 7,
}, {
  key: 'paldea', label: 'Paldea',
  range: [906, 1025], total: 120,
}]
