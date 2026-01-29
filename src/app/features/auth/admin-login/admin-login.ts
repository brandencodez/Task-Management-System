import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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
  
  // Registration fields (simplified)
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
    private router: Router
  ) {}

  // Switch between login and registration forms
  toggleMode(): void {
    this.isRegistering = !this.isRegistering;
    this.clearMessages();
    this.resetForms();
  }

  // Handle login
  login(): void {
    this.clearMessages();
    
    if (!this.loginEmail || !this.loginPassword) {
      this.errorMessage = 'Please enter both email and password.';
      return;
    }

    // Check if admin exists
    if (!this.adminService.adminExists(this.loginEmail)) {
      this.errorMessage = 'No admin account found with this email.';
      return;
    }

    // Validate credentials
    if (this.adminService.validateCredentials(this.loginEmail, this.loginPassword)) {
      this.adminService.setCurrentAdmin(this.loginEmail);
      this.router.navigate(['/admin-dashboard']);
    } else {
      this.errorMessage = 'Invalid password. Please try again.';
    }
  }

  // Handle registration
  register(): void {
    this.clearMessages();
    
    // Validation
    if (!this.validateRegistrationForm()) {
      return;
    }

    // Check if admin already exists
    if (this.adminService.adminExists(this.registerEmail)) {
      this.errorMessage = 'An admin account with this email already exists.';
      return;
    }

    // Register the admin (simplified - only name, email, password)
    const success = this.adminService.registerAdmin(
      this.registerName,
      this.registerEmail,
      this.registerPassword
    );

    if (success) {
      this.successMessage = 'Registration successful! Please login with your credentials.';
      setTimeout(() => {
        this.isRegistering = false;
        this.loginEmail = this.registerEmail;
        this.resetForms();
        this.clearMessages();
      }, 2000);
    } else {
      this.errorMessage = 'Registration failed. Please try again.';
    }
  }

  // Validate registration form
  private validateRegistrationForm(): boolean {
    if (!this.registerName || !this.registerEmail || !this.registerPassword) {
      this.errorMessage = 'Please fill in all required fields.';
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.registerEmail)) {
      this.errorMessage = 'Please enter a valid email address.';
      return false;
    }

    // Password validation
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
    // Login form
    this.loginEmail = '';
    this.loginPassword = '';
    
    // Registration form
    this.registerName = '';
    this.registerEmail = '';
    this.registerPassword = '';
    this.registerConfirmPassword = '';
    
    // Password visibility
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