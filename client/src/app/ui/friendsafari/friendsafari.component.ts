import { Component, Input, OnInit } from '@angular/core';
import { Badge } from '../../../../../shared/src/badge3';
import { FriendSafariMap, FriendSafariTypes } from '../../../../../shared/src/friend-safari';

@Component({
  selector: 'friendsafari-selector',
  templateUrl: './friendsafari.component.html',
  styleUrls: ['./friendsafari.component.css']
})
export class FriendSafariComponent implements OnInit {
  @Input('safari') safari: string
  selected: string[] = []
  friendSafari: Record<string, boolean> = {}

  get zones() {
    return this.selected.join('')
  }

  constructor() { }

  ngOnInit(): void {
    Object.keys(FriendSafariMap).forEach(x => this.friendSafari[x] = false)
  }

  handleClick(char: string) {
    if (!this.selected.includes(char)) {
      this.selected.push(char)
    } else {
      this.selected.splice(this.selected.indexOf(char), 1)
    }
  }

  isSelected(char: string) {
    return this.selected.includes(char)
  }

  friendSafariLabels(char: string) {
    return FriendSafariMap[char].map(x => Badge.fromLegacy(x).toLabel()).join(', ')
  }

  friendSafariPkmn(char: string) {
    return FriendSafariMap[char].map(x => Badge.fromLegacy(x).toString())
  }

  friendSafariClass(char: string) {
    let classes = FriendSafariTypes[char].toLowerCase()
    if (this.isSelected(char)) {
      classes += ' selected'
    }
    return classes
  }

  safariIcon(char: string) {
    return `type-${FriendSafariTypes[char]}`
  }
}
