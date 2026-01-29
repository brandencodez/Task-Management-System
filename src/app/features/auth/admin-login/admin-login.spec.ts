import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminLoginComponent } from './admin-login';
import { AdminService } from '../../admins/admin.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

describe('AdminLoginComponent', () => {
  let component: AdminLoginComponent;
  let fixture: ComponentFixture<AdminLoginComponent>;
  let adminService: any;
  let router: any;

  beforeEach(async () => {
    // Create spy objects
    adminService = {
      adminExists: jasmine.createSpy('adminExists'),
      validateCredentials: jasmine.createSpy('validateCredentials'),
      setCurrentAdmin: jasmine.createSpy('setCurrentAdmin'),
      registerAdmin: jasmine.createSpy('registerAdmin')
    };

    router = {
      navigate: jasmine.createSpy('navigate')
    };

    await TestBed.configureTestingModule({
      imports: [AdminLoginComponent, FormsModule],
      providers: [
        { provide: AdminService, useValue: adminService },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle between login and registration modes', () => {
    expect(component.isRegistering).toBe(false);
    component.toggleMode();
    expect(component.isRegistering).toBe(true);
    component.toggleMode();
    expect(component.isRegistering).toBe(false);
  });

  it('should validate login form and show error for empty fields', () => {
    component.loginEmail = '';
    component.loginPassword = '';
    component.login();
    expect(component.errorMessage).toBe('Please enter both email and password.');
  });

  it('should successfully login with valid credentials', () => {
    component.loginEmail = 'admin@test.com';
    component.loginPassword = 'password123';
    
    adminService.adminExists.and.returnValue(true);
    adminService.validateCredentials.and.returnValue(true);
    
    component.login();
    
    expect(adminService.setCurrentAdmin).toHaveBeenCalledWith('admin@test.com');
    expect(router.navigate).toHaveBeenCalledWith(['/admin-dashboard']);
  });

  it('should show error for non-existent admin', () => {
    component.loginEmail = 'nonexistent@test.com';
    component.loginPassword = 'password123';
    
    adminService.adminExists.and.returnValue(false);
    
    component.login();
    
    expect(component.errorMessage).toBe('No admin account found with this email.');
  });

  it('should show error for invalid password', () => {
    component.loginEmail = 'admin@test.com';
    component.loginPassword = 'wrongpassword';
    
    adminService.adminExists.and.returnValue(true);
    adminService.validateCredentials.and.returnValue(false);
    
    component.login();
    
    expect(component.errorMessage).toBe('Invalid password. Please try again.');
  });

  it('should validate registration form for empty fields', () => {
    component.isRegistering = true;
    component.registerName = '';
    component.register();
    expect(component.errorMessage).toBe('Please fill in all required fields.');
  });

  it('should validate email format in registration', () => {
    component.isRegistering = true;
    component.registerName = 'John Doe';
    component.registerEmail = 'invalid-email';
    component.registerPassword = 'password123';
    component.registerConfirmPassword = 'password123';
    
    component.register();
    
    expect(component.errorMessage).toBe('Please enter a valid email address.');
  });

  it('should validate minimum password length in registration', () => {
    component.isRegistering = true;
    component.registerName = 'John Doe';
    component.registerEmail = 'john@test.com';
    component.registerPassword = '12345'; // Less than 6 characters
    component.registerConfirmPassword = '12345';
    
    component.register();
    
    expect(component.errorMessage).toBe('Password must be at least 6 characters long.');
  });

  it('should validate password match in registration', () => {
    component.isRegistering = true;
    component.registerName = 'John Doe';
    component.registerEmail = 'john@test.com';
    component.registerPassword = 'password123';
    component.registerConfirmPassword = 'different';
    
    component.register();
    
    expect(component.errorMessage).toBe('Passwords do not match.');
  });

  it('should show error if admin email already exists', () => {
    component.isRegistering = true;
    component.registerName = 'John Doe';
    component.registerEmail = 'john@test.com';
    component.registerPassword = 'password123';
    component.registerConfirmPassword = 'password123';
    
    adminService.adminExists.and.returnValue(true);
    
    component.register();
    
    expect(component.errorMessage).toBe('An admin account with this email already exists.');
  });

  it('should successfully register a new admin', (done) => {
    component.isRegistering = true;
    component.registerName = 'John Doe';
    component.registerEmail = 'john@test.com';
    component.registerPassword = 'password123';
    component.registerConfirmPassword = 'password123';
    
    adminService.adminExists.and.returnValue(false);
    adminService.registerAdmin.and.returnValue(true);
    
    component.register();
    
    expect(component.successMessage).toBe('Registration successful! Please login with your credentials.');
    expect(adminService.registerAdmin).toHaveBeenCalledWith(
      'John Doe',
      'john@test.com',
      'password123'
    );

    // Wait for timeout to complete
    setTimeout(() => {
      expect(component.isRegistering).toBe(false);
      expect(component.loginEmail).toBe('john@test.com');
      done();
    }, 2100);
  });

  it('should toggle password visibility for login password', () => {
    expect(component.showLoginPassword).toBe(false);
    component.showLoginPassword = true;
    expect(component.showLoginPassword).toBe(true);
  });

  it('should toggle password visibility for registration password', () => {
    expect(component.showRegisterPassword).toBe(false);
    component.showRegisterPassword = true;
    expect(component.showRegisterPassword).toBe(true);
  });

  it('should toggle password visibility for confirm password', () => {
    expect(component.showConfirmPassword).toBe(false);
    component.showConfirmPassword = true;
    expect(component.showConfirmPassword).toBe(true);
  });

  it('should clear messages when toggling mode', () => {
    component.errorMessage = 'Some error';
    component.successMessage = 'Some success';
    
    component.toggleMode();
    
    expect(component.errorMessage).toBe('');
    expect(component.successMessage).toBe('');
  });

  it('should reset forms when toggling mode', () => {
    component.loginEmail = 'test@test.com';
    component.loginPassword = 'password';
    component.registerName = 'Test User';
    
    component.toggleMode();
    
    expect(component.loginEmail).toBe('');
    expect(component.loginPassword).toBe('');
    expect(component.registerName).toBe('');
  });

  it('should navigate back when goBack is called', () => {
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/authpage']);
  });
});