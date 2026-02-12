import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { Department } from '../department/department.model';
import { Project } from '../../shared/models/project.model';
import { Employee } from '../employees/employee.model';
import { DepartmentService } from '../department/department.service';
import { ProjectService } from '../projects/project.service';
import { EmployeeService } from '../employees/employee.service';
import { ProjectAssignment } from '../../shared/models/project-assignment.model';
import { ProjectAssignmentService } from '../../shared/services/project-assignment.service';

interface AssignmentEmployee {
  id: number;
  name: string;
  position?: string;
}

interface AssignmentGroup {
  project_id: number;
  project_name: string;
  department_id: number;
  department_name?: string;
  latest_assigned_at: string;
  employees: AssignmentEmployee[];
}

@Component({
  selector: 'app-assigning-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './assigning-projects.component.html',
  styleUrls: ['./assigning-projects.component.css']
})
export class AssigningProjectsComponent implements OnInit {
  departments: Department[] = [];
  selectedDepartmentId: number | null = null;

  projects: Project[] = [];
  employees: Employee[] = [];

  filteredProjects: Project[] = [];
  filteredEmployees: Employee[] = [];

  activeProjectId: number | null = null;
  stagedEmployeeIds: number[] = [];

  assignmentRows: ProjectAssignment[] = [];
  assignmentGroups: AssignmentGroup[] = [];

  draggedEmployeeId: number | null = null;
  isSaving = false;

  constructor(
    private departmentService: DepartmentService,
    private projectService: ProjectService,
    private employeeService: EmployeeService,
    private assignmentService: ProjectAssignmentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDepartments();
  }

  loadDepartments(): void {
    this.departmentService.getActiveDepartments().subscribe({
      next: (departments) => {
        this.departments = departments;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load departments:', error);
        alert('Failed to load departments');
      }
    });
  }

  onDepartmentChange(): void {
    if (!this.selectedDepartmentId) {
      this.resetDepartmentData();
      return;
    }

    this.loadDepartmentData(this.selectedDepartmentId);
  }

  loadDepartmentData(departmentId: number): void {
    forkJoin({
      projects: this.projectService.getProjects(),
      employees: this.employeeService.getEmployees(),
      assignments: this.assignmentService.getAssignmentsByDepartment(departmentId)
    }).subscribe({
      next: ({ projects, employees, assignments }) => {
        this.projects = projects;
        this.employees = employees;
        this.filteredProjects = projects.filter((project) => project.department_id === departmentId);
        this.filteredEmployees = employees.filter((employee) => employee.department_id === departmentId);
        this.assignmentRows = assignments;
        this.assignmentGroups = this.groupAssignments(assignments);

        if (!this.filteredProjects.some((project) => project.id === this.activeProjectId)) {
          this.activeProjectId = null;
          this.stagedEmployeeIds = [];
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load department data:', error);
        alert('Failed to load department data');
      }
    });
  }

  resetDepartmentData(): void {
    this.projects = [];
    this.employees = [];
    this.filteredProjects = [];
    this.filteredEmployees = [];
    this.assignmentRows = [];
    this.assignmentGroups = [];
    this.activeProjectId = null;
    this.stagedEmployeeIds = [];
  }

  setActiveProject(projectId: number | null): void {
    this.activeProjectId = projectId;
    if (!projectId) {
      this.stagedEmployeeIds = [];
      return;
    }
    this.loadAssignmentsForProject(projectId);
  }

  loadAssignmentsForProject(projectId: number): void {
    this.assignmentService.getAssignmentsByProject(projectId).subscribe({
      next: (assignments) => {
        this.stagedEmployeeIds = assignments.map((assignment) => assignment.employee_id);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load project assignments:', error);
        alert('Failed to load project assignments');
      }
    });
  }

  addEmployeeToProject(employee: Employee): void {
    if (!this.activeProjectId) {
      alert('Select a project first');
      return;
    }

    if (this.stagedEmployeeIds.includes(employee.id)) {
      return;
    }

    this.stagedEmployeeIds = [...this.stagedEmployeeIds, employee.id];
  }

  removeEmployeeFromProject(employeeId: number): void {
    this.stagedEmployeeIds = this.stagedEmployeeIds.filter((id) => id !== employeeId);
  }

  isEmployeeAssigned(employeeId: number): boolean {
    return this.stagedEmployeeIds.includes(employeeId);
  }

  onDragStart(employee: Employee): void {
    this.draggedEmployeeId = employee.id;
  }

  allowDrop(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (!this.draggedEmployeeId) {
      return;
    }

    const employee = this.filteredEmployees.find((emp) => emp.id === this.draggedEmployeeId);
    if (employee) {
      this.addEmployeeToProject(employee);
    }

    this.draggedEmployeeId = null;
  }

  saveAssignments(): void {
    if (!this.activeProjectId) {
      alert('Select a project first');
      return;
    }

    this.isSaving = true;
    this.assignmentService
      .replaceAssignments(this.activeProjectId, this.stagedEmployeeIds)
      .subscribe({
        next: () => {
          this.isSaving = false;
          if (this.selectedDepartmentId) {
            this.loadDepartmentData(this.selectedDepartmentId);
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Failed to save assignments:', error);
          alert(error.error?.error || 'Failed to save assignments');
          this.isSaving = false;
          this.cdr.detectChanges();
        }
      });
  }

  editAssignmentGroup(group: AssignmentGroup): void {
    this.activeProjectId = group.project_id;
    this.stagedEmployeeIds = group.employees.map((employee) => employee.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getAssignedEmployees(): AssignmentEmployee[] {
    return this.filteredEmployees
      .filter((employee) => this.stagedEmployeeIds.includes(employee.id))
      .map((employee) => ({
        id: employee.id,
        name: employee.name,
        position: employee.position
      }));
  }

  getActiveProjectName(): string {
    const project = this.filteredProjects.find((p) => p.id === this.activeProjectId);
    return project ? project.name : 'Select a project';
  }

  formatDate(dateValue: string): string {
    if (!dateValue) {
      return '';
    }
    const date = new Date(dateValue);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
  }

  private groupAssignments(assignments: ProjectAssignment[]): AssignmentGroup[] {
    const grouped = new Map<number, AssignmentGroup>();

    assignments.forEach((assignment) => {
      const existing = grouped.get(assignment.project_id);
      const employee = {
        id: assignment.employee_id,
        name: assignment.employee_name,
        position: assignment.employee_position
      };

      if (!existing) {
        grouped.set(assignment.project_id, {
          project_id: assignment.project_id,
          project_name: assignment.project_name,
          department_id: assignment.department_id,
          department_name: assignment.department_name,
          latest_assigned_at: assignment.assigned_at,
          employees: [employee]
        });
        return;
      }

      existing.employees.push(employee);
      if (new Date(assignment.assigned_at) > new Date(existing.latest_assigned_at)) {
        existing.latest_assigned_at = assignment.assigned_at;
      }
    });

    return Array.from(grouped.values()).sort((a, b) => {
      return new Date(b.latest_assigned_at).getTime() - new Date(a.latest_assigned_at).getTime();
    });
  }
}
