import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';

import { ProjectService } from '../../projects/project.service';
import { UserService } from '../../../shared/services/user.service';
import { EmployeeService } from '../../employees/employee.service';
import { Project } from '../../../shared/models/project.model';

@Component({
  selector: 'app-user-projects',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet   // ✅ REQUIRED FOR <router-outlet>
  ],
  templateUrl: './user-projects.component.html',
  styleUrls: ['./user-projects.component.css']
})
export class UserProjectsComponent implements OnInit {

  projects: Project[] = [];
  currentUser: string | null = null;
  userDepartment: string | null = null;

  constructor(
    private projectService: ProjectService,
    private userService: UserService,
    private employeeService: EmployeeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.userService.getCurrentUser();

    if (!this.currentUser) {
      this.router.navigate(['/user-login']);
      return;
    }

    this.loadUserProjects();
  }

  private loadUserProjects(): void {
    const employees = this.employeeService.getEmployees();
    const employee = employees.find(
      emp => emp.name === this.currentUser
    );

    if (!employee) return;

    this.userDepartment = employee.department;

    this.projects = this.projectService
      .getProjects()
      .filter(project => project.department === this.userDepartment);
  }

  logout(): void {
    this.userService.clearCurrentUser();
    this.router.navigate(['/user-login']);
  }
}
