import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LinksService } from 'src/app/links.service';
import { FeedbackService } from 'src/app/service/feedback-service.service';

@Component({
  selector: 'app-page-about',
  templateUrl: './page-about.component.html',
  styleUrls: ['./page-about.component.css']
})
export class PageAboutComponent implements OnInit {
  mailing: {
    url: string
  } = {
    url: '#'
  }
  guide: {
    url: string
  } = {
    url: '#'
  }
  contact: {
    email: string
    label: string
    chatmisc: string
    chatraid: string
  } = {
    email: '#',
    label: '#',
    chatmisc: '#',
    chatraid: '#',
  }
  bugs: {
    url: string
    label: string
  } = {
    url: '#',
    label: '#'
  }

  @ViewChild('errors') dErrors: ElementRef
  report = ''

  constructor(
    private links: LinksService,
    private feedback: FeedbackService,
    private snackbar: MatSnackBar,
  ) { }

  async ngOnInit() {
    await this.links.init()
    this.mailing = this.links.mailing!
    this.guide = this.links.guide!
    this.contact = this.links.contact!
    this.bugs = this.links.bugs!
  }

  showErrors() {
    this.report = this.feedback.generateReport()
    this.dErrors.nativeElement.showModal()
  }

  copy() {
    navigator.clipboard.writeText(this.report)
    this.close()
    this.snackbar.open('Copied!', '', {duration: 3000})
  }

  close() {
    this.dErrors.nativeElement.close()
  }
}
