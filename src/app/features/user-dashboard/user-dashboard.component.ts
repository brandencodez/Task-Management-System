import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ProjectService } from '../projects/project.service';
import { EmployeeService } from '../employees/employee.service';
import { UserService } from '../../shared/services/user.service';
import { Project } from '../../shared/models/project.model';

interface QuickUpdate {
  label: string;
  points: number;
}

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css']
})
export class UserDashboardComponent implements OnInit {
  currentUser: string | null = null;
  userDepartmentId: number | null = null;
  userDepartmentName = '';
  hasEmployeeRecord = false;
  isLoading = true;

  departmentProjects: Project[] = [];
  upcomingProjects: Project[] = [];

  stats = {
    total: 0,
    upcoming: 0,
    ongoing: 0,
    completed: 0
  };

  points = 0;
  kudosCount = 0;
  quickUpdates: QuickUpdate[] = [];

  avatarChoice: 'male' | 'female' = 'male';
  selectedProject: Project | null = null;
  interestResponses: Record<number, 'yes' | 'no'> = {};

  constructor(
    private projectService: ProjectService,
    private employeeService: EmployeeService,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.currentUser = this.userService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/user-login']);
      return;
    }

    const savedAvatar = localStorage.getItem('employee_avatar_choice');
    if (savedAvatar === 'male' || savedAvatar === 'female') {
      this.avatarChoice = savedAvatar;
    }

    const storedResponses = localStorage.getItem('employee_project_interest');
    if (storedResponses) {
      this.interestResponses = JSON.parse(storedResponses);
    }

    this.loadDashboardData();
  }

  logout() {
    this.userService.clearCurrentUser();
    this.router.navigate(['/user-login']);
  }

  setAvatar(choice: 'male' | 'female') {
    this.avatarChoice = choice;
    localStorage.setItem('employee_avatar_choice', choice);
  }

  openProjectModal(project: Project) {
    this.selectedProject = project;
  }

  closeProjectModal() {
    this.selectedProject = null;
  }

  setInterest(response: 'yes' | 'no') {
    if (!this.selectedProject) return;
    this.interestResponses[this.selectedProject.id] = response;
    localStorage.setItem(
      'employee_project_interest',
      JSON.stringify(this.interestResponses),
    );
  }

  getInterestLabel(projectId: number): string {
    const response = this.interestResponses[projectId];
    if (!response) return '';
    return response === 'yes' ? 'Thanks for opting in.' : 'Thanks for the update.';
  }

  getInterestBadge(projectId: number): string {
    const response = this.interestResponses[projectId];
    if (!response) return '';
    return response === 'yes' ? 'Interested' : 'Not interested';
  }

  private loadDashboardData() {
    this.isLoading = true;

    forkJoin({
      employees: this.employeeService.getEmployees(),
      projects: this.projectService.getProjects(),
    }).subscribe({
      next: ({ employees, projects }) => {
        const employee = employees.find((emp) => emp.name === this.currentUser);

        if (employee) {
          this.hasEmployeeRecord = true;
          this.userDepartmentId = employee.department_id;
          this.userDepartmentName = employee.department_name || '';

          this.departmentProjects = projects.filter(
            (project) => project.department_id === this.userDepartmentId,
          );

          this.upcomingProjects = this.filterUpcomingProjects(this.departmentProjects);
          this.stats = this.computeStats(this.departmentProjects);
          this.points = this.calculatePoints(this.stats);
          this.kudosCount = this.stats.completed * 2;
          this.quickUpdates = this.buildQuickUpdates();
        } else {
          this.hasEmployeeRecord = false;
          this.departmentProjects = [];
          this.upcomingProjects = [];
          this.stats = { total: 0, upcoming: 0, ongoing: 0, completed: 0 };
          this.points = 0;
          this.kudosCount = 0;
          this.quickUpdates = [{ label: 'No updates yet', points: 0 }];
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.hasEmployeeRecord = false;
        this.departmentProjects = [];
        this.upcomingProjects = [];
        this.stats = { total: 0, upcoming: 0, ongoing: 0, completed: 0 };
        this.points = 0;
        this.kudosCount = 0;
        this.quickUpdates = [{ label: 'No updates yet', points: 0 }];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private filterUpcomingProjects(projects: Project[]): Project[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return projects.filter((project) => {
      if (project.status === 'COMPLETED') return false;
      if (project.status === 'UPCOMING') return true;

      const startDate = new Date(project.startDate);
      startDate.setHours(0, 0, 0, 0);
      return startDate > today;
    });
  }

  private computeStats(projects: Project[]) {
    return {
      total: projects.length,
      upcoming: projects.filter((project) => project.status === 'UPCOMING').length,
      ongoing: projects.filter((project) => project.status === 'ONGOING').length,
      completed: projects.filter((project) => project.status === 'COMPLETED').length,
    };
  }

  private calculatePoints(stats: {
    total: number;
    upcoming: number;
    ongoing: number;
    completed: number;
  }): number {
    return stats.completed * 30 + stats.ongoing * 12 + stats.upcoming * 6;
  }

  private buildQuickUpdates(): QuickUpdate[] {
    const updates: QuickUpdate[] = [];

    if (this.stats.completed > 0) {
      updates.push({
        label: `${this.stats.completed} project${this.stats.completed === 1 ? '' : 's'} completed`,
        points: this.stats.completed * 30,
      });
    }

    if (this.stats.ongoing > 0) {
      updates.push({
        label: `${this.stats.ongoing} active project${this.stats.ongoing === 1 ? '' : 's'}`,
        points: this.stats.ongoing * 12,
      });
    }

    if (this.stats.upcoming > 0) {
      updates.push({
        label: `${this.stats.upcoming} upcoming project${this.stats.upcoming === 1 ? '' : 's'} to prep`,
        points: this.stats.upcoming * 6,
      });
    }

    if (updates.length === 0) {
      updates.push({ label: 'No updates yet', points: 0 });
    }

    return updates.slice(0, 3);
  }

  formatDateForDisplay(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }
}
