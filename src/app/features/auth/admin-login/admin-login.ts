import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../admins/admin.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css',
})
export class AdminLoginComponent {

  // Toggle between login and registration
  isRegistering = false;

  // Login fields
  loginEmail = '';
  loginPassword = '';

  // Registration fields
  registerName = '';
  registerEmail = '';
  registerPassword = '';
  registerConfirmPassword = '';

  errorMessage = '';
  successMessage = '';

  // Password visibility toggles
  showLoginPassword = false;
  showRegisterPassword = false;
  showConfirmPassword = false;

  constructor(
    private adminService: AdminService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  // Switch between login and registration
  toggleMode(): void {
    this.isRegistering = !this.isRegistering;
    this.clearMessages();
    this.resetForms();
  }

  // ✅ LOGIN (API based)
  login(): void {
    this.clearMessages();

    if (!this.loginEmail || !this.loginPassword) {
      this.errorMessage = 'Please enter both email and password.';
      return;
    }

    this.adminService.login(this.loginEmail, this.loginPassword).subscribe({
      next: () => {
        this.router.navigate(['/admin-dashboard']);
      },
      error: (err) => {
        console.error('Login error:', err);
        this.errorMessage =
          err?.error?.message || err?.error?.error || err?.message || 'Invalid email or password.';
        this.cdr.detectChanges();
      }
    });
  }

  // ✅ REGISTER (API based)
  register(): void {
    this.clearMessages();

    if (!this.validateRegistrationForm()) {
      return;
    }

    this.adminService.registerAdmin(
      this.registerName,
      this.registerEmail,
      this.registerPassword
    ).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
        this.successMessage =
          'Registration successful! Please login with your credentials.';
        
        // Force change detection to show success message
        this.cdr.detectChanges();

        // Store email for auto-fill on login form
        const emailToFill = this.registerEmail;

        // Wait 2 seconds, then switch to login mode
        setTimeout(() => {
          this.isRegistering = false;
          this.loginEmail = emailToFill;
          this.resetForms();
          // Clear success message after switching to login
          this.successMessage = '';
          
          // Force change detection after timeout changes
          this.cdr.detectChanges();
        }, 1500);
      },
      error: (err) => {
        console.error('Registration error:', err);
        console.error('Error status:', err.status);
        console.error('Error body:', err.error);
        
        // Handle all possible error response formats
        let message = 'Registration failed. Please try again.';
        
        if (err.status === 409) {
          message = 'An admin account with this email already exists.';
        } else if (err.error) {
          // Try different possible error message locations
          message = err.error.message || err.error.error || err.error.msg || message;
        } else if (err.message) {
          message = err.message;
        }
        
        this.errorMessage = message;
        
        // Force change detection to show error message
        this.cdr.detectChanges();
      }
    });
  }

  // Validate registration form
  private validateRegistrationForm(): boolean {
    if (!this.registerName || !this.registerEmail || !this.registerPassword) {
      this.errorMessage = 'Please fill in all required fields.';
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.registerEmail)) {
      this.errorMessage = 'Please enter a valid email address.';
      return false;
    }

    if (this.registerPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long.';
      return false;
    }

    if (this.registerPassword !== this.registerConfirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return false;
    }

    return true;
  }

  // Reset forms
  private resetForms(): void {
    // Don't reset loginEmail here - it's set separately in register()
    this.loginPassword = '';

    this.registerName = '';
    this.registerEmail = '';
    this.registerPassword = '';
    this.registerConfirmPassword = '';

    this.showLoginPassword = false;
    this.showRegisterPassword = false;
    this.showConfirmPassword = false;
  }

  // Clear messages
  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Navigate back
  goBack(): void {
    this.router.navigate(['/authpage']);
  }
}