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

async function getTMsListSwSh(id) {
  console.log(`https://serebii.net/pokedex-swsh/${id}.shtml`)
  const page = await fetch(`https://serebii.net/pokedex-swsh/${id}.shtml`, {})
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

async function getTMsListSv(id) {
  console.log(`https://serebii.net/pokedex-sv/${id}.shtml`)
  const page = await fetch(`https://serebii.net/pokedex-sv/${id}.shtml`, {})
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
  const page = await fetch(`https://serebii.net/pokedex-sm/${id.toString().padStart(3, '0')}.shtml`, {})
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

const moveTmsRegex = (id) => new RegExp(`(potw-${id.toString().padStart(3, '0')}['"]?:.*?moveTMs['"]?:).*?]`, 's');

async function getTMsFor(id: number, pkmnObj: any): Promise<string[]> {
  const pid = id.toString().padStart(3, '0')
  let tmlist: Set<string> = new Set()
  if (id <= 809) {
    const x = await getTMsList(pid)
    x.forEach(tm => tmlist.add(tm))
    const y = await getTMsListSwSh(pid)
    y.forEach(tm => tmlist.add(tm))
    const z = await getTMsListSv(pid)
    z.forEach(tm => tmlist.add(tm))
  } else if (id <= 898) {
    const y = await getTMsListSwSh(id)
    y.forEach(tm => tmlist.add(tm))
    const z = await getTMsListSv(id)
    z.forEach(tm => tmlist.add(tm))
  } else if (id <= 1025) {
    const z = await getTMsListSv(id)
    z.forEach(tm => tmlist.add(tm))
  }
  return [...tmlist]
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
          const tmlist = await getTMsFor(parseInt(id), pkmnObj)
          pkmnData = pkmnData.replace(moveTmsRegex(id), `$1 ${format(tmlist, '      ')}`)
          await delay(2000)
        } catch (e) {
          console.error(`node tmlist.js ${id} replace ${region}`)
        }
      }
      fs.writeFileSync(sourcePath, pkmnData)
      return ids
    } else if (process.argv[3] === 'range') {
      // node tmlist.js 000 replaceall kanto 001 151
      const region = process.argv[4]
      const min = parseInt(process.argv[5])
      const max = parseInt(process.argv[6])
      console.log(`Fetching TM/TR list for #s ${min}-${max}`)
      const filepath = `../functions/lib/shared/src/pokemon/${region}.js`
      const datastore = require(filepath)
      const pkmnObj = datastore[`${region}Builder`]

      const sourcePath = `./shared/src/pokemon/${region}.ts`
      let pkmnData = fs.readFileSync(sourcePath, 'utf-8')

      for (let id = min; id <= max; id++) {
        try {
          console.log(`    Fetching TM/TR list for #${id}`)
          const tmlist = await getTMsFor(id, pkmnObj)
          pkmnData = pkmnData.replace(moveTmsRegex(id), `$1 ${format(tmlist, '      ')}`)
          fs.writeFileSync(sourcePath, pkmnData)
          await delay(2000)
        } catch (e) {
          // console.error(e)
          console.error(`node tmlist.js ${id} replace ${region}`)
        }
      }
      return 'ok'
    }
    return await getTMsList(process.argv[2])
  })()
  
  console.log(format(res))
})()
