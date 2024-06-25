import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextIndicatorComponent } from './text-indicator.component';

describe('TextIndicatorComponent', () => {
  let component: TextIndicatorComponent;
  let fixture: ComponentFixture<TextIndicatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextIndicatorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TextIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
