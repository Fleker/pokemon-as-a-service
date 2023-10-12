import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovedexComponent } from './movedex.component';

describe('MovedexComponent', () => {
  let component: MovedexComponent;
  let fixture: ComponentFixture<MovedexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MovedexComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MovedexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
