import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserLogin } from './user-login';

describe('UserLogin', () => {
  let component: UserLogin;
  let fixture: ComponentFixture<UserLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserLogin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserLogin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
