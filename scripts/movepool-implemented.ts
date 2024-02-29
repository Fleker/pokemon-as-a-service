import fetch from 'node-fetch'
import * as MP from '../shared/src/gen/type-move-meta'

interface MoveRow {
  name: string
  generation: string
}

function parseMoveRow(row: string): MoveRow | undefined {
  // console.log(row)
  const cols = row.split('<td')
  // console.log(cols)
  // if (cols.length < 8) return
  const name = cols[1]
    .replace(/.*<a .*>([\w\d-\s%&#;_/,']+)<\/a>/, '$1')
       .replace('>', '')
    .replace(/<\/td.*/, '')
    .trim()
  // console.log('^', row, '=>', cols, '=>', cols[1], '=>', name, '$')
  return {name, generation: '0'}
}

const listOfMoves = 'https://www.serebii.net/attackdex-sv/languages.shtml'
async function main() {
  const potwMoves = Object.values(MP.MoveTypeMap).map(x => x.name)
  const page = await fetch(listOfMoves, {})
  const text = await page.text()
  const indexA = text.indexOf(`<table class="dextable">`)
  const indexB = text.indexOf(`</table>`, indexA)
  // console.log(indexA, indexB)
  const tableOfInterest = text.substring(indexA, indexB)
  const rows = tableOfInterest.split('<tr>')
  console.log(rows.length, 'total rows')
  let counter = 0
  for (let i = 3; i < rows.length - 1; i++) {
    // console.log(rows[i])
    const row = parseMoveRow(rows[i])
    if (row) {
      const {name, generation} = row 
      if (!potwMoves.includes(name)) {
        console.log(`${name}`)
        counter++
      }
    }
  }
  console.log(counter, 'unimplemented')
}

(async () => {
  await main()
})()
