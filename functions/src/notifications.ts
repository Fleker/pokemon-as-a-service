import * as admin from 'firebase-admin'
import * as S from '../../shared/src/server-types'
import { Users } from './db-types'

export interface Notification {
  /**
   * General category. Can infer icon and other info.
   */
  category: S.NotificationType
  title: string
  /**
   * Image path for host
   */
  icon: string
  body: string
  link: string
}

export function sendNotification(user: Users.Doc, details: Notification) {
  if (!user) return // Bail
  if (!user.notifications) {
    user.notifications = []
  }
  const dbNotification: S.Notification = {
    msg: details.title,
    body: details.body,
    link: details.link,
    timestamp: Date.now(),
    cat: details.category,
    icon: details.icon,
  }
  if (!user.settings?.notification?.[details.category]) {
    return // Bail
  }
  const sendInAppNotification = user.settings?.notification?.[details.category].inapp ?? true
  const sendFcmNotification = user.settings?.notification?.[details.category].push ?? true
  // Inline update of user.notifications.
  // Still requires manual update on Firestore document.
  if (sendInAppNotification !== false) {
    user.notifications.push(dbNotification)
  }
  
  if (user.fcm && sendFcmNotification !== false) {
    return admin.messaging().sendToDevice(user.fcm, {
      notification: {
        title: details.title,
        tag: details.category,
        icon: `https://pokemon-of-the-week.firebaseapp.com/${details.icon}`,
        body: details.body,
      }
    })
  }
  return false
}