import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TaskService } from '../../tasks/task.service';
import { UserService } from '../../../shared/services/user.service';

@Component({
  selector: 'app-user-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './user-login.html', 
  styleUrls: ['./user-login.css']
})
export class UserLoginComponent {
  username = '';
  password = '';
  newPassword = '';
  confirmPassword = '';
  errorMessage = '';
  passwordError = '';
  showPasswordSetup = false;

  constructor(
    private taskService: TaskService,
    private userService: UserService,
    private router: Router
  ) {}

   goHome() {
    this.router.navigate(['/']);
  }

  login() {
    const name = this.username.trim();
    if (!name) {
      this.errorMessage = 'Please enter your name.';
      return;
    }

    const tasks = this.taskService.getTasks();
    const isAssigned = tasks.some(task => 
      task.assignedTo.toLowerCase() === name.toLowerCase()
    );

    if (!isAssigned) {
      this.errorMessage = 'No tasks assigned to this name.';
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
      this.passwordError = 'Password must be at least 6 characters.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'Passwords do not match.';
      return;
    }

    this.userService.setCredentials(this.username.trim(), this.newPassword);
    this.router.navigate(['/user-dashboard']);
  }
}