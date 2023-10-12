import * as Pkmn from '../../shared/src/pokemon'

export const getPokemonDetails = (key: string) => {
  const pkmn = Pkmn.get(key)
  if (pkmn) {
    const {species, pokedex} = pkmn
    return {species, pokedex}
  }
  throw new Error(`Pkmn ${key} does not exist`)
}

export const middleware = (res) => {
  res.set('Access-Control-Allow-Origin', "*")
  res.set('Access-Control-Allow-Methods', 'POST')
}

export function randomItem<T>(array: T[]) {
  return array[Math.floor(array.length * Math.random())]
}

export const delay = async function(length: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, length)
  })
}
