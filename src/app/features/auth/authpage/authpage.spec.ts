import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Authpage } from './authpage';

describe('Authpage', () => {
  let component: Authpage;
  let fixture: ComponentFixture<Authpage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Authpage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Authpage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
