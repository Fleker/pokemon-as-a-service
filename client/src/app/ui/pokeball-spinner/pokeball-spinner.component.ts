import { Component, Input } from '@angular/core';

@Component({
  selector: 'pokeball-spinner',
  templateUrl: './pokeball-spinner.component.html',
  styleUrls: ['./pokeball-spinner.component.css']
})
export class PokeballSpinnerComponent {
  @Input('diameter') diameter: number = 50;
}
