import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { UserService } from '../../../shared/services/user.service';

@Component({
  selector: 'app-user-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './user-login.html',
  styleUrls: ['./user-login.css']
})
export class UserLoginComponent {
  username = '';
  password = '';
  newPassword = '';
  confirmPassword = '';
  errorMessage = '';
  showPasswordSetup = false;
  
  // PASSWORD VISIBILITY TOGGLES
  showPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  login() {
    const name = this.username.trim();
    if (!name) {
      this.errorMessage = 'Please enter your name.';
      return;
    }

    // Direct API call 
    this.userService.login(name, this.password).subscribe(success => {
      if (success) {
        this.router.navigate(['/user-dashboard']);
      } else {
        this.errorMessage = 'Invalid credentials.';
      }
    });
  }

  setPassword() {
    if (this.newPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.userService.setPassword(this.username.trim(), this.newPassword).subscribe(success => {
      if (success) {
        this.router.navigate(['/user-dashboard']);
      } else {
        this.errorMessage = 'Failed to set password.';
      }
    });
  }

  goHome() {
    this.router.navigate(['/']);
  }
}