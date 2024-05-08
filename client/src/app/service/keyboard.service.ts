import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KeyboardService {
  enableOmniSearch = true
  enableNavigation = false

  omniSearchListener = new Subject<boolean>()

  constructor() {}

  init() {
    document.addEventListener('keyup', (e: KeyboardEvent) => {
      const {code} = e
      console.debug('keyvent', e.code, e.shiftKey, e.ctrlKey)
      // Ctrl+G opens the OmniSearch
      if (code == 'KeyG' && e.shiftKey && this.enableOmniSearch) {
        this.omniSearchListener.next(true)
        e.preventDefault()
      }
    })
  }
}