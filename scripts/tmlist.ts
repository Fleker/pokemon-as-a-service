const fs = require('fs')
import { ITEMS } from '../shared/src/items-list'
import fetch from 'node-fetch'

const validItems = Object.entries(ITEMS)

async function getTMsList(id) {
  const page = await fetch(`https://serebii.net/pokedex-sm/${id}.shtml`, {})
  const text = await page.text()
  // console.log(text)
  const movesTM: string[] = []
  validItems.forEach(([key, item]) => {
    if (item.category === 'tms' || item.category === 'trs') {
      const label = key.substring(3)
      // <a href="...">MOVENAME</a>
      if (text.includes(`>${label}<`)) {
        movesTM.push(label)
      }
    }
  })
  return movesTM
}

async function getTMsListSwSh(rawName) {
  const name = rawName.toLowerCase().replace(' ', '')
  console.log(`https://serebii.net/pokedex-swsh/${name}/`)
  const page = await fetch(`https://serebii.net/pokedex-swsh/${name}/`, {})
  const text = await page.text()
  const movesTM: string[] = []

  // console.log(text)
  validItems.forEach(([key, item]) => {
    if (item.category === 'tms' || item.category === 'trs') {
      const label = key.substring(3)
      // <a href="...">MOVENAME</a>
      if (text.includes(`>${label}<`)) {
        movesTM.push(label)
      }
    }
  })
  return movesTM
}

async function getTMsListSv(rawName) {
  const name = rawName.toLowerCase().replace(' ', '')
  console.log(`https://serebii.net/pokedex-sv/${name}/`)
  const page = await fetch(`https://serebii.net/pokedex-sv/${name}/`, {})
  const text = await page.text()
  const movesTM: string[] = []

  // console.log(text)
  validItems.forEach(([key, item]) => {
    if (item.category === 'tms' || item.category === 'trs') {
      const label = key.substring(3)
      // <a href="...">MOVENAME</a>
      if (text.includes(`>${label}<`)) {
        movesTM.push(label)
      }
    }
  })
  return movesTM
}

async function getMoveTutors(id) {
  const page = await fetch(`https://serebii.net/pokedex-sm/${id}.shtml`, {})
  const text = await page.text()
  const validMoveTutors = [
    'Weather Ball', 'Air Cutter', 'Heat Wave', 'Seed Bomb', 'Liquidation',
    'Electroweb', 'Ice Punch', 'Throat Chop', 'Outrage', 'Vacuum Wave',
    'Zen Headbutt', 'Signal Beam', 'Gunk Shot', 'Earth Power', 'Iron Head',
    'Power Gem',
  ]
  const movesTM: string[] = []
  validMoveTutors.forEach(move => {
    if (text.includes(move)) {
      movesTM.push(move)
    }
  })
  return movesTM
}

function format(res, space = '    ') {
  let out = '[\n' + space
  res.forEach((v, i) => out += `'${v}', ${(i % 5 === 4) ? '\n' + space : ''}`)
  out += '\n' + space.substring(0, space.length - 2) + ']'
  return out
}

function delay(ms) {
  return new Promise((res, rej) => {
    setTimeout(res, ms)
  })
}

const moveTmsRegex = (id) => new RegExp(`(potw-${id}['"]?:.*?moveTMs['"]?:).*?]`, 's');

async function getTMsFor(id: number, pkmnObj: any) {
  let tmlist: string[] = []
  if (id < 810) {
    tmlist = await getTMsList(id)
  } else if (id < 899) {
    tmlist = await getTMsListSwSh(pkmnObj[`potw-${id}`].species)
  } else if (id < 1011) {
    tmlist = await getTMsListSv(pkmnObj[`potw-${id}`].species)
  }
  return tmlist
}

(async () => {
  const res = await (async () => {
    if (process.argv[3] === 'tutor') {
      // node tmlist.js 006 tutor
      console.log(`Fetching tutors list for ${process.argv[2]}`)
      return await getMoveTutors(process.argv[2])
    }
    else if (process.argv[3] === 'replace') {
      // node tmlist.js 006 replace kanto
      const id = process.argv[2]
      const region = process.argv[4]
      const filepath = `../functions/lib/shared/src/pokemon/${region}.js`
      const datastore = require(filepath)
      const pkmnObj = datastore[`${region}Builder`]

      console.log(`Fetching and replacing TM/TR list for ${id}`)
      const tmlist = await getTMsFor(parseInt(id), pkmnObj)
      const sourcePath = `./shared/src/pokemon/${region}.ts`
      const pkmnData = fs.readFileSync(sourcePath, 'utf-8')
      const newPkmnData = pkmnData.replace(moveTmsRegex(id), `$1 ${format(tmlist, '      ')}`)
      // console.log(newPkmnData)
      fs.writeFileSync(sourcePath, newPkmnData)
      return tmlist
    }
    else if (process.argv[3] === 'replaceall') {
      // node tmlist.js 000 replaceall kanto
      const region = process.argv[4]
      const filepath = `../functions/lib/shared/src/pokemon/${region}.js`
      const datastore = require(filepath)
      const pkmnObj = datastore[`${region}Builder`]
      const ids = Object.keys(pkmnObj).map(x => x.substring(5))

      const sourcePath = `./shared/src/pokemon/${region}.ts`
      let pkmnData = fs.readFileSync(sourcePath, 'utf-8')

      for (const id of ids) {
        if (id.length > 3) console.log(`TODO: ${id}`)
        try {
          const tmlist = getTMsFor(parseInt(id), pkmnObj)
          pkmnData = pkmnData.replace(moveTmsRegex(id), `$1 ${format(tmlist, '      ')}`)
          await delay(1000)
        } catch (e) {
          console.error(`node tmlist.js ${id} replace ${region}`)
        }
      }
      fs.writeFileSync(sourcePath, pkmnData)
      return ids
    }
    console.log(`Fetching TM/TR list for ${process.argv[2]}`)
    return await getTMsList(process.argv[2])
  })()
  
  console.log(format(res))
})()
