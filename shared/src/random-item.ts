// eslint-disable-next-line
export default function randomItem<T>(array: T[]) {
  return array[Math.floor(array.length * Math.random())]
}
