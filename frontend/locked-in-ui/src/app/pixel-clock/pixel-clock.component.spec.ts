import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PixelClockComponent } from './pixel-clock.component';

describe('PixelClockComponent', () => {
  let component: PixelClockComponent;
  let fixture: ComponentFixture<PixelClockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PixelClockComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PixelClockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
