/**
 * @fileoverview convert.js
 * http://rot47.net
 * https://helloacm.com
 * http://codingforspeed.com  
 * Dr Zhihua Lai
 */

const BASE10 = '0123456789'
const BASE16 = '0123456789ABCDEF'
const BASE64 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-'

/**
 * Converts base_64 string to number
 * @param src Input string
 * @returns Number
 */
export function toBase10(src: string) {
  return parseInt(convert(src, BASE64, BASE10))
}

/**
 * Converts base_64 string to base_16
 * @param src Input string
 * @returns Same string in base_16
 */
export function toBase16(src: string) {
  return convert(src, BASE64, BASE16)
}

/**
 * Converts base_16 string to base_64
 * @param src Input string
 * @returns Same string in base_64
 */
export function toBase64(src: string | number) {
  if (typeof src === 'number') {
    src = src.toString(16).toUpperCase()
  }
  return convert(src, BASE16, BASE64)
}

export function convert(src: string, srctable: string, desttable: string): string {
  const srclen = srctable.length
  const destlen = desttable.length
  // first convert to base 10
  let val = 0
  const numlen = src.length
  for (let i = 0; i < numlen; i++) {
    val = val * srclen + srctable.indexOf(src.charAt(i))
  }
  if (val < 0) return '0'
  // then covert to any base
  let r = val % destlen
  let res = desttable.charAt(r)
  let q = Math.floor(val / destlen)
  while (q) {
    r = q % destlen
    q = Math.floor(q / destlen)
    res = desttable.charAt(r) + res
  }
  return res
}