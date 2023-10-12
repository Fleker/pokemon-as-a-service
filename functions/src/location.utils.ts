import {Spacetime} from 'spacetime'

/**
 * @deprecated Use shared version
 */
export const timeOfDay = (localDate: Spacetime) => {
  if (localDate.hour() > 6 && localDate.hour() <= 18) {
    return 'Day'
  }
  return 'Night'
}

/**
 * @deprecated Use shared version
 */
export const isDusk = (localDate: Spacetime) => {
  return localDate.hour() === 19 // 7pm
}
