import { ElementRef } from '@angular/core';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FirebaseService } from 'src/app/service/firebase.service';
import { Notification, F } from '../../../../../shared/src/server-types';
import { Router } from '@angular/router';

declare var navigator: any;

@Component({
  selector: 'button-notifications',
  templateUrl: './button-notifications.component.html',
  styleUrls: ['./button-notifications.component.css']
})
export class ButtonNotificationsComponent implements OnInit {
  @ViewChild('dialog') dialog: ElementRef
  notifications: Notification[] = []
  invNotifications: Notification[] = []
  ackedNotificationCount = 0
  notificationIcon = {
    GTS_COMPLETE: '/images/sprites/items/potw-item-linkingcord.png',
    RAID_RESET: '/images/sprites/items/potw-item-raidpass.png',
    RAID_COMPLETE: '/images/sprites/items/potw-item-raidpass.png',
    RAID_EXPIRE: '/images/sprites/items/potw-item-raidpass.png',
    VOYAGE_COMPLETE: '/images/sprites/items/potw-item-voyagepass.png',
    BATTLE_LEADERBOARD: '/images/sprites/items/potw-item-tm-Normal.png',
  }
  exec = false

  get newNotifications() {
    return this.notifications.length - this.ackedNotificationCount
  }

  get tooltip() {
    // Do a 'peek' effect
    if (!this.invNotifications) return 'No Notifications'
    if (!this.invNotifications.length) return 'No Notifications'

    return this.invNotifications[0].msg
  }

  constructor(
    private firebase: FirebaseService,
    private snackbar: MatSnackBar,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.firebase.subscribeUser(user => {
      if (!user) return
      if (!user.notifications) return
      this.notifications = user.notifications
      this.invNotifications = [...this.notifications].reverse()
      if (this.ackedNotificationCount > this.notifications.length) {
        this.ackedNotificationCount = this.notifications.length
      }
      // See https://www.w3.org/TR/badging/
      if ('setAppBadge' in navigator) {
        // Async process
        (navigator.setAppBadge as Function)(this.notifications.length)
      }
    })
  }

  /**
   * Computes quick info on when the notification occurred.
   * @param ts Timestamp of notification
   * @returns Language-sensitive relative time formatting
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat
   */
  timeAgo(ts: number): string {
    const rtf = new Intl.RelativeTimeFormat('en', { style: 'narrow' });
    const diff = Math.ceil((ts - Date.now()) / 1000)
    if (diff >= -60) {
      return rtf.format(diff, 'second')
    } 
    if (diff >= -3600) {
      return rtf.format(Math.ceil(diff / 60), 'minute')
    }
    if (diff >= -86400) {
      return rtf.format(Math.ceil(diff / 3600), 'hour')
    }
    return rtf.format(Math.ceil(diff / 86400), 'day')
  }

  showNotifications() {
    this.dialog.nativeElement.showModal()
    this.ackedNotificationCount = this.notifications.length
    // Request permission to show notifications via platform
    Notification.requestPermission() // async
  }

  close() {
    this.dialog.nativeElement.close()
  }

  navigate(link) {
    window.location.href = link;
  }

  async clear(item?: Notification) {
    let index = undefined
    if (item) {
      index = this.notifications.findIndex(x => x.body === item.body && x.msg === item.msg)
      console.log(this.notifications, index)
      if (index === -1) { return }
    }
    this.exec = true
    const data = (() => {
      if (index !== undefined) return {index}
      return {}
    })()
    try {
      // Directly refresh
      const res = await this.firebase.exec<F.NotificationsClear.Req, F.NotificationsClear.Res>('notifications_clear', data)
      this.notifications = res.data
      this.invNotifications = [...this.notifications].reverse()
    } catch (e: any) {
      this.snackbar.open(e.message, '', {duration: 5000})
    } finally {
      this.exec = false
      if (index === undefined) {
        // Clear All
        this.close()
      }
    }
  }

  async launch(item?: Notification) {
    await this.clear(item)
    this.router.navigateByUrl(item.link)
  }
}
