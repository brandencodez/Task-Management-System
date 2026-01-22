import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EmployeeService } from '../../employees/employee.service';
import { UserService } from '../../../shared/services/user.service';

@Component({
  selector: 'app-user-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
    private employeeService: EmployeeService,
    private userService: UserService,
    private router: Router
  ) {}

  login() {
    const name = this.username.trim();
    if (!name) {
      this.errorMessage = 'Please enter your name.';
      return;
    }

    const employees = this.employeeService.getEmployees();
    const employee = employees.find(emp => 
      emp.name.toLowerCase() === name.toLowerCase()
    );

    if (!employee) {
      this.errorMessage = 'No employee found with this name.';
      return;
    }

    if (this.userService.hasPassword(name)) {
      if (this.userService.validateCredentials(name, this.password)) {
        this.userService.setCurrentUser(name);
        this.router.navigate(['/user-dashboard']);
      } else {
        this.errorMessage = 'Invalid password.';
      }
    } else {
      this.showPasswordSetup = true;
      this.errorMessage = '';
    }
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

    this.userService.setCredentials(this.username.trim(), this.newPassword);
    this.router.navigate(['/user-dashboard']);
  }

  goHome() {
    this.router.navigate(['/']);
  }
}