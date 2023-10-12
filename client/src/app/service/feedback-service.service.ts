import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sessionErrors: any[] = []

  constructor() { }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bind(window: any) {
    this.sessionErrors = []
    const _error = window.console.error
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.console.error = function(...args: any) {
      this.sessionErrors.push(args)
      _error.apply(this, args)
    }.bind(this)

    window.addEventListener('error', e => {
      this.sessionErrors.push(e)
    })
  }

  generateReport() {
    return this.sessionErrors.join('\n')
  }
}
