import { ElementRef } from '@angular/core';
import { Component, Input, AfterViewInit, ViewChild } from '@angular/core';

@Component({
  selector: 'collapsible-card',
  templateUrl: './collapsible-card.component.html',
  styleUrls: ['./collapsible-card.component.css']
})
export class CollapsibleCardComponent {
  @Input('collapsed') collapsed: boolean = false
  @ViewChild('cardToggle') cardToggle?: ElementRef
  @ViewChild('title') title?: ElementRef

  constructor() { }

  toggle() {
    this.collapsed = !this.collapsed
  }
}
