import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SplashscreenComponent } from './splashscreen.component';

describe('SplashscreenComponent', () => {
  let component: SplashscreenComponent;
  let fixture: ComponentFixture<SplashscreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SplashscreenComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SplashscreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
