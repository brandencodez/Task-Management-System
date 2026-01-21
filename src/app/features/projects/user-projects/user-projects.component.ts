import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../projects/project.service';
import { UserService } from '../../../shared/services/user.service';
import { EmployeeService } from '../../employees/employee.service';
import { Project } from '../../../shared/models/project.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-projects',
  standalone: true,
  imports: [CommonModule],
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

  ngOnInit() {
    this.currentUser = this.userService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/user-login']);
      return;
    }
    this.loadUserProjects();
  }

  loadUserProjects() {
    const employees = this.employeeService.getEmployees();
    const employee = employees.find(emp => emp.name === this.currentUser);
    
    if (employee) {
      this.userDepartment = employee.department;
      this.projects = this.projectService.getProjects()
        .filter(project => project.department === this.userDepartment);
    }
  }

  logout() {
    this.userService.clearCurrentUser();
    this.router.navigate(['/user-login']);
  }
}