import fetch from 'node-fetch'
import * as MP from '../shared/src/type-move-meta'

interface MoveRow {
  name: string
  generation: string
}

function parseMoveRow(row: string): MoveRow | undefined {
  // console.log(row)
  const cols = row.split('<td')
  // console.log(cols)
  if (cols.length < 8) return
  const name = cols[2]
    .replace(/<a .*>([\w\d-\s%&#;_/,']+)<\/a>/, '$1')
    .replace('>', '')
    .replace('\n</td>\n', '')
    .replace(/<span class="explain" title=".*">[*]<\/span>/, '')
  const generation = cols[8]
    .replace('>', '')
    .replace('\n</td></tr>', '')
    .replace('\n', '')
  return {name, generation}
}

const listOfMoves = 'https://bulbapedia.bulbagarden.net/wiki/List_of_moves'
async function main() {
  const potwMoves = Object.values(MP.MoveTypeMap).map(x => x.name)
  const page = await fetch(listOfMoves, {})
  const text = await page.text()
  const indexA = text.indexOf(`List of moves</span></h2>`)
  const indexB = text.indexOf(`<h2><span class="mw-headline" id="List_of_G-Max_Moves">`)
  const tableOfInterest = text.substring(indexA, indexB)
  const rows = tableOfInterest.split('<tr>')
  for (let i = 2; i < rows.length - 1; i++) {
    const row = parseMoveRow(rows[i])
    if (row) {
      const {name, generation} = row 
      if (!potwMoves.includes(name)) {
        console.log(`${name} (Gen ${generation})`)
      }
    }
  }
}

(async () => {
  await main()
})()
