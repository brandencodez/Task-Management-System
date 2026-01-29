import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReminderList } from './reminder-list';

describe('ReminderList', () => {
  let component: ReminderList;
  let fixture: ComponentFixture<ReminderList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReminderList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReminderList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
