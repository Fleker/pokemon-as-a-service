import { OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { AfterViewInit } from '@angular/core';
import { Component, Input, OnInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';

const LS_KEY = 'match-log.paged'

@Component({
  selector: 'match-log',
  templateUrl: './match-log.component.html',
  styleUrls: ['./match-log.component.css']
})
export class MatchLogComponent implements OnChanges, AfterViewInit {
  @Input('log') log: string = ''
  @ViewChild('paginator') paginator?: MatPaginator
  // View Modes
  paged: boolean = false
  logs: string[] = []

  get pageIndex() {
    return this.paginator?.pageIndex || 0
  }

  constructor() {
    this.paged = localStorage.getItem(LS_KEY) === 'true' || false
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.logs = this.log?.split('==========')
    if (this.logs && this.logs[0] === '') {
      this.logs.splice(0, 1)
    }
  }

  updatePaged() {
    window.requestAnimationFrame(() => {
      localStorage.setItem(LS_KEY, this.paged ? 'true' : 'false')
    })
  }

  ngAfterViewInit(): void {
    // if (this.paginator && this.paginator._intl) {
    //   this.paginator!._intl.getRangeLabel = (page, _, length) => {
    //     return `${page} of ${length}`
    //   }
    // }
  }
}
