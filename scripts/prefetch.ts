// yarn script prefetch 800 sm
// yarn script prefetch grookey swsh
import fetch from 'node-fetch'
const { exec } = require('child_process')

type Gen = 'bw' | 'xy' | 'sm' | 'usum' | 'swsh' | 'pla' | 'sv'

function parseSpecies(html: string, gen: Gen) {
  if (gen === 'bw') {
    const reg = new RegExp('fooinfo">(.*)<')
    return reg.exec(html)![1]
  } else if (gen === 'xy') {
    const reg = new RegExp('fooinfo">(.*)<')
    return reg.exec(html)![1]
  } else if (gen === 'sm') {
    const reg = new RegExp('fooinfo">(.*)<')
    return reg.exec(html)![1]
  } else if (gen === 'usum') {
    const reg = new RegExp('fooinfo">(.*)<')
    return reg.exec(html)![1]
  } else if (gen === 'swsh') {
    const reg = new RegExp('fooinfo">(.*)<')
    return reg.exec(html)![1]
  } else if (gen === 'pla') {
    const reg = new RegExp('fooinfo">(.*)<')
    return reg.exec(html)![1]
  } else if (gen === 'sv') {
    const reg = new RegExp('fooinfo">(.*)<')
    return reg.exec(html)![1]
  } 
}

function parseEggGroup(html: string, gen: Gen) {
  if (gen === 'bw') {
    const reg = new RegExp('bw/egg/.*.shtml">(.*)</a>')
    const exec = reg.exec(html)
    if (exec === null) {
      return ''
    }
    return `'${reg.exec(html)![1]}'`
  } else if (gen === 'xy') {
    const reg = new RegExp('xy/egg/.*.shtml">(.*)</a>')
    const exec = reg.exec(html)
    if (exec === null) {
      return ''
    }
    return `'${reg.exec(html)![1]}'`
  } else if (gen === 'sm' || gen === 'usum') {
    const reg = new RegExp('sm/egg/.*.shtml">(.*)</a>')
    const exec = reg.exec(html)
    if (exec === null) {
      return ''
    }
    return `'${reg.exec(html)![1]}'`
  } else if (gen === 'swsh') {
    const reg = new RegExp('sm/egg/.*.shtml">(.*)</a>')
    const exec = reg.exec(html)
    if (exec === null) {
      return ''
    }
    return `'${reg.exec(html)![1]}'`
  } else if (gen === 'pla') {
    const reg = new RegExp('sm/egg/.*.shtml">(.*)</a>')
    const exec = reg.exec(html)
    if (exec === null) {
      return ''
    }
    return `'${reg.exec(html)![1]}'`
  } else if (gen === 'sv') {
    const reg = new RegExp('sv/egg/.*.shtml">(.*)</a>')
    const exec = reg.exec(html)
    if (exec === null) {
      return ''
    }
    return `'${reg.exec(html)![1]}'`
  }
}

function parsePokedex(html: string, gen: Gen) {
  if (gen === 'bw') {
    const html2 = html.replace(/\n/g, ' ').split('fooblack">Black</td>')[2]
    // const reg = new RegExp('fooblack">Black</td><td(.*)</td>')
    // const reg = new RegExp('fooblack">Black<\/td>(.*?)<\/tr>')
    const reg = new RegExp('<td class="fooinfo">(.*?)<\/td>')
    // console.log(html)
    // return reg.exec(html)[1]
    // console.log(reg.exec(html2).length, reg.exec(html2)[1])
    return reg.exec(html2)![1]
  } else if (gen === 'xy') {
    const html2 = html.replace(/\n/g, ' ').split('foox">X</td>')[2]
    // const reg = new RegExp('fooblack">Black</td><td(.*)</td>')
    // const reg = new RegExp('fooblack">Black<\/td>(.*?)<\/tr>')
    const reg = new RegExp('<td class="fooinfo">(.*?)<\/td>')
    // console.log(html)
    // return reg.exec(html)[1]
    // console.log(reg.exec(html2).length, reg.exec(html2)[1])
    return reg.exec(html2)![1]
  } else if (gen === 'sm') {
    const html2 = html.replace(/\n/g, ' ').split('foosun">Sun</td>')[2]
    const reg = new RegExp('<td class="fooinfo">(.*?)<\/td>')
    // return reg.exec(html)[1]
    // console.log(reg.exec(html2).length, reg.exec(html2)[1])
    return reg.exec(html2)![1].replace('&#233;', 'é')
  } else if (gen === 'usum') {
    const html2 = html.replace(/\n/g, ' ').split('foousun">Ultra Sun</td>')[2]
    const reg = new RegExp('<td class="fooinfo">(.*?)<\/td>')
    // return reg.exec(html)[1]
    // console.log(reg.exec(html2).length, reg.exec(html2)[1])
    return reg.exec(html2)![1].replace('&#233;', 'é')
  } else if (gen === 'swsh') {
    const reg = new RegExp('<td class="foox"(?: colspan="2")?>Sword</td>[\s\r\t\n.]*<td class="fooinfo">(.*)</td>')
    const regres = reg.exec(html)!
    return regres[1].replace('&#233;', 'é')
  } else if (gen === 'pla') {
    const reg = new RegExp('<td class="fooeevee"(?: colspan="2")?>Legends: Arceus</td>[\s\r\t\n.]*<td class="fooinfo">(.*)</td>')
    const regres = reg.exec(html)!
    return regres[1].replace('&#233;', 'é')
  } else if (gen === 'sv') {
    const reg = new RegExp('<td class="scarlet"(?: colspan="2")?>Scarlet</td>[\s\r\t\n.]*<td class="fooinfo">(.*)</td>')
    const regres = reg.exec(html)!
    return regres[1].replace('&#233;', 'é').replace(/&eacute;/g, "é").replace('</td>', '')
  }
}

function parseStats(html: string, gen: Gen) {
  if (gen === 'bw') {
    const html2 = html.replace(/\n/g, ' ')
    const reg = new RegExp('Base Stats</td>(.*)')
    const html3 = reg.exec(html2)![1].split('<td align="center" class="fooinfo">')
    const stats = [
      html3[0].replace(/<\/td> /, ''),
      html3[1].replace(/<\/td> /, ''),
      html3[2].replace(/<\/td> /, ''),
      html3[3].replace(/<\/td> /, ''),
      html3[4].replace(/<\/td> /, ''),
      html3[5].replace(/<\/td> /, ''),
      html3[6].replace(/<\/td>.*/, ''),
    ]
    return `hp: ${stats[1]}, attack: ${stats[2]}, defense: ${stats[3]}, spAttack: ${stats[4]}, spDefense: ${stats[5]}, speed: ${stats[6]},`
  } else if (gen === 'xy') {
    const html2 = html.replace(/\n/g, ' ')
    const reg = new RegExp('Base Stats - Total:(.*)', 's')
    const html3 = reg.exec(html2)![1].split('<td align="center" class="fooinfo">')
    console.log(html3)
    const stats = [
      html3[0].replace(/<\/td>.*/s, ''),
      html3[1].replace(/<\/td>.*/s, ''),
      html3[2].replace(/<\/td>.*/s, ''),
      html3[3].replace(/<\/td>.*/s, ''),
      html3[4].replace(/<\/td>.*/s, ''),
      html3[5].replace(/<\/td>.*/s, ''),
      html3[6].replace(/<\/td>.*/s, ''),
    ]
    return `hp: ${stats[1]}, attack: ${stats[2]}, defense: ${stats[3]}, spAttack: ${stats[4]}, spDefense: ${stats[5]}, speed: ${stats[6]},`
  } else if (gen === 'sm' || gen === 'usum') {
    const html2 = html.replace(/\n/g, ' ')
    const reg = new RegExp('Base Stats - Total:(.*)', 's')
    const html3 = reg.exec(html2)![1].split('<td align="center" class="fooinfo">')
    console.log(html3)
    const stats = [
      html3[0].replace(/<\/td>.*/s, ''),
      html3[1].replace(/<\/td>.*/s, ''),
      html3[2].replace(/<\/td>.*/s, ''),
      html3[3].replace(/<\/td>.*/s, ''),
      html3[4].replace(/<\/td>.*/s, ''),
      html3[5].replace(/<\/td>.*/s, ''),
      html3[6].replace(/<\/td>.*/s, ''),
    ]
    return `hp: ${stats[1]}, attack: ${stats[2]}, defense: ${stats[3]}, spAttack: ${stats[4]}, spDefense: ${stats[5]}, speed: ${stats[6]},`
  } else if (gen === 'swsh') {
    const html2 = html.replace(/\n/g, ' ')
    const reg = new RegExp('Base Stats - Total:(.*)', 's')
    const html3 = reg.exec(html2)![1].split('<td align="center" class="fooinfo">')
    const stats = [
      html3[0].replace(/<\/td>.*/s, ''),
      html3[1].replace(/<\/td>.*/s, ''),
      html3[2].replace(/<\/td>.*/s, ''),
      html3[3].replace(/<\/td>.*/s, ''),
      html3[4].replace(/<\/td>.*/s, ''),
      html3[5].replace(/<\/td>.*/s, ''),
      html3[6].replace(/<\/td>.*/s, ''),
    ]
    return `hp: ${stats[1]}, attack: ${stats[2]}, defense: ${stats[3]}, spAttack: ${stats[4]}, spDefense: ${stats[5]}, speed: ${stats[6]},`
  } else if (gen === 'pla') {
    const html2 = html.replace(/\n/g, ' ')
    const reg = new RegExp('Base Stats - Total:(.*)', 's')
    const html3 = reg.exec(html2)![1].split('<td align="center" class="fooinfo">')
    const stats = [
      html3[0].replace(/<\/td>.*/s, ''),
      html3[1].replace(/<\/td>.*/s, ''),
      html3[2].replace(/<\/td>.*/s, ''),
      html3[3].replace(/<\/td>.*/s, ''),
      html3[4].replace(/<\/td>.*/s, ''),
      html3[5].replace(/<\/td>.*/s, ''),
      html3[6].replace(/<\/td>.*/s, ''),
    ]
    return `hp: ${stats[1]}, attack: ${stats[2]}, defense: ${stats[3]}, spAttack: ${stats[4]}, spDefense: ${stats[5]}, speed: ${stats[6]},`
  } else if (gen === 'sv') {
    const html2 = html.replace(/\n/g, ' ')
    const reg = new RegExp('Base Stats - Total:(.*)', 's')
    const html3 = reg.exec(html2)![1].split('<td align="center" class="fooinfo">')
    const stats = [
      html3[0].replace(/<\/td>.*/s, ''),
      html3[1].replace(/<\/td>.*/s, ''),
      html3[2].replace(/<\/td>.*/s, ''),
      html3[3].replace(/<\/td>.*/s, ''),
      html3[4].replace(/<\/td>.*/s, ''),
      html3[5].replace(/<\/td>.*/s, ''),
      html3[6].replace(/<\/td>.*/s, ''),
    ]
    return `hp: ${stats[1]}, attack: ${stats[2]}, defense: ${stats[3]}, spAttack: ${stats[4]}, spDefense: ${stats[5]}, speed: ${stats[6]},`
  }
}

function parseTypes(html, gen) {
  let out = ''
  if (gen === 'bw') {
    const reg = new RegExp('fooinfo" align="center">(.*)</td>')
    const links = reg.exec(html)![1].split('<a')
    // console.log(links)
    let typeNo = 1
    const reg2 = new RegExp('bw/(.+).shtml">')
    for (const link of links) {
      const types = reg2.exec(link)
      if (types !== null) {
        const titleCase = types[1].substr(0, 1).toUpperCase() + types[1].substr(1)
        out += `type${typeNo++}: '${titleCase}', `
      }
    }
  } else if (gen === 'xy') {
    const reg = new RegExp('<td class="cen">(.*)</td>')
    const links = reg.exec(html)![1].split('<a')
    // console.log(links)
    let typeNo = 1
    const reg2 = new RegExp('xy/(.+).shtml">')
    for (const link of links) {
      const types = reg2.exec(link)
      if (types !== null) {
        const titleCase = types[1].substr(0, 1).toUpperCase() + types[1].substr(1)
        out += `type${typeNo++}: '${titleCase}', `
      }
    }
  } else if (gen === 'sm' || gen === 'usum') {
    const reg = new RegExp('<td class="cen">(.*)</td>')
    const links = reg.exec(html)![1].split('<a')
    // console.log(links)
    let typeNo = 1
    const reg2 = new RegExp('sm/(.+).shtml">')
    for (const link of links) {
      const types = reg2.exec(link)
      if (types !== null) {
        const titleCase = types[1].substr(0, 1).toUpperCase() + types[1].substr(1)
        out += `type${typeNo++}: '${titleCase}', `
      }
    }
  } else if (gen === 'swsh') {
    const reg = new RegExp('<td class="cen">(.*)</td>')
    const links = reg.exec(html)![1].split('<a')
    // console.log(links)
    let typeNo = 1
    const reg2 = new RegExp('swsh/(.+).shtml">')
    for (const link of links) {
      const types = reg2.exec(link)
      if (types !== null) {
        const titleCase = types[1].substr(0, 1).toUpperCase() + types[1].substr(1)
        out += `type${typeNo++}: '${titleCase}', `
      }
    }
  } else if (gen === 'pla') {
    const reg = new RegExp('<td class="cen">(.*)</td>')
    const links = reg.exec(html)![1].split('<a')
    // console.log(links)
    let typeNo = 1
    const reg2 = new RegExp('swsh/(.+).shtml">')
    for (const link of links) {
      const types = reg2.exec(link)
      if (types !== null) {
        const titleCase = types[1].substr(0, 1).toUpperCase() + types[1].substr(1)
        out += `type${typeNo++}: '${titleCase}', `
      }
    }
  } else if (gen === 'sv') {
    const reg = new RegExp('<td class="cen">(.*)</td>')
    const links = reg.exec(html)![1].split('<a')
    // console.log(links)
    let typeNo = 1
    const reg2 = new RegExp('sv/(.+).shtml">')
    for (const link of links) {
      const types = reg2.exec(link)
      if (types !== null) {
        const titleCase = types[1].substr(0, 1).toUpperCase() + types[1].substr(1)
        out += `type${typeNo++}: '${titleCase}', `
      }
    }
  }
  return out
}

function parseDetails(html: string, gen: Gen) {
  if (gen === 'swsh') {
    const cells = html.split('<td class="fooinfo">')
    const eggCell = cells[9]
    const stepNumber = parseInt(eggCell.replace(',', ''))
    const eggCycles = {
      1280: 5,
      2560: 10,
      3840: 15,
      5120: 20,
      6400: 25,
      7680: 30,
      8960: 35,
      10240: 40,
    }[stepNumber] ?? -1
    const weightReg = html.match(/([\d.]+)kg<\/td>/)
    // console.log(weightReg?.[1])
    const weight = parseFloat(weightReg![1])
    return {
      eggCycles,
      weight,
    }
  } else if (gen === 'pla') {
    // const weightReg = html.match(/([\d.]+)kg<\/td>/)
    // console.log(weightReg?.[1])
    // const weight = parseFloat(weightReg![1])
    return {
      eggCycles: -1,
      weight: -1,
    }
  } else if (gen === 'sv') {
    const cells = html.split('<td class="fooinfo">')
    const eggCell = cells[9]
    const stepNumber = parseInt(eggCell.replace(',', ''))
    const eggCycles = {
      1280: 5,
      2560: 10,
      3840: 15,
      5120: 20,
      6400: 25,
      7680: 30,
      8960: 35,
      10240: 40,
    }[stepNumber] ?? -1
    const weightReg = html.match(/([\d.]+)kg<\/td>/)
    // console.log(weightReg?.[1])
    const weight = parseFloat(weightReg![1])
    return {
      eggCycles,
      weight,
    }
  } 
  return {
    eggCycles: -1,
    weight: -1,
  }
}

async function getPrelimInfo(id: string, gen, name?: string) {
  const genPath = (() => {
    if (gen === 'usum') return 'sm'
    return gen
  })()
  const link = (() => {
    if (gen === 'swsh') return `https://serebii.net/pokedex-${genPath}/${name}/`
    if (gen === 'pla') return `https://serebii.net/pokedex-swsh/${name}/`
    if (gen === 'sv') return `https://serebii.net/pokedex-sv/${name}/`
    return `https://serebii.net/pokedex-${genPath}/${id}.shtml` 
  })()
  const page = await fetch(link, {})
  const text = await page.text()
  console.log(text)
  // const tms = (await getTms(id)).split('\n').slice(1).join('\n')
  const tiers = (() => {
    if (gen === 'sm' || gen === 'usum') {
      return "/* 'Ultra Cup' */"
    }
    if (gen === 'swsh') {
      return "/* 'Galarian Cup', 'Crown Cup' */"
    }
    if (gen === 'pla') {
      return "'Traditional', 'Arceus Cup'"
    }
    if (gen === 'sv') {
      return "/* 'SV Cup', 'SV DLC Cup' */"
    }
  })()
  const {eggCycles, weight} = parseDetails(text, gen)
  let entry = `
  'potw-${id}': ensurePkmnBuilder({
    species: '${parseSpecies(text, gen)}', ${parseTypes(text, gen)}
    tiers: [${tiers}], shiny: 'FALSE',
    weight: ${weight},
    eggBase: FIXME, eggGroup: [${parseEggGroup(text, gen)}], eggCycles: ${eggCycles},
    levelAt: 'FIXME', levelTo: 'FIXME',
    pokedex: \`${parsePokedex(text, gen)}\`,
    ${parseStats(text, gen)}
    move: ['FIXME'],
    moveTMs: []
  }),
  `
  console.log(entry)
}

(async () => {
  // node prefetch.js 650 xy [name]
  return await getPrelimInfo(process.argv[2], process.argv[3], process.argv[4])
})()
