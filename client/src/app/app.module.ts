import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatBadgeModule} from '@angular/material/badge'
import {MatIconModule} from '@angular/material/icon';
import {MatSidenavModule} from '@angular/material/sidenav'
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatCardModule} from '@angular/material/card';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatTabsModule} from '@angular/material/tabs'
import {MatSlideToggleModule} from '@angular/material/slide-toggle'
import {MatPaginatorModule} from '@angular/material/paginator'
import {MatGridListModule} from '@angular/material/grid-list'
import {MatStepperModule} from '@angular/material/stepper'
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import {MatChipsModule} from '@angular/material/chips'
import {MatAutocompleteModule} from '@angular/material/autocomplete'
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatMenuModule} from '@angular/material/menu';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatAutocompleteModule,
    MatBadgeModule,
    MatCardModule,
    MatChipsModule,
    MatGridListModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    MatSidenavModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatStepperModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    MatMenuModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
  ],
  providers:  [
    {provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: {hasBackdrop: false}}
 ],
  bootstrap: [AppComponent]
})
export class AppModule { }
