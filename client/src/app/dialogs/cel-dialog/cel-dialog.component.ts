import { ElementRef } from '@angular/core';
import { Component, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'cel-dialog',
  templateUrl: './cel-dialog.component.html',
  styleUrls: ['./cel-dialog.component.css']
})
export class CelDialogComponent {
  @ViewChild('dialog') dialog?: ElementRef
  constructor() { }

  open() {
    this.dialog.nativeElement.showModal()
  }

  close() {
    this.dialog.nativeElement.close()
  }
}
