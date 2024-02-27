import { ElementRef } from '@angular/core';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'collapsible-card',
  templateUrl: './collapsible-card.component.html',
  styleUrls: ['./collapsible-card.component.css']
})
export class CollapsibleCardComponent {
  @Input('collapsed') collapsed: boolean = false
  @Output('change') change: EventEmitter<boolean> = new EventEmitter()
  @ViewChild('cardToggle') cardToggle?: ElementRef
  @ViewChild('title') title?: ElementRef

  constructor() { }

  toggle() {
    this.collapsed = !this.collapsed
    this.change.emit(this.collapsed)
    console.debug(this.collapsed)
  }
}
