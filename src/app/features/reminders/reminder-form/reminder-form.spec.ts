import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReminderForm } from './reminder-form';

describe('ReminderForm', () => {
  let component: ReminderForm;
  let fixture: ComponentFixture<ReminderForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReminderForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReminderForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
