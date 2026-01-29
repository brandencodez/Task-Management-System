import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { ProjectService } from '../../../project.service';
import { EmployeeService } from '../../../../employees/employee.service';
import { UserService } from '../../../../../shared/services/user.service';
import { Project } from '../../../../../shared/models/project.model';
import { Employee } from '../../../../employees/employee.model';
export interface WorkEntry {
  id: number;
  project: string;
  description: string;
  hours: number;
  progress: number;
  date: string;
}

@Component({
  selector: 'app-daily-work-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './daily-work-entry.component.html',
  styleUrls: ['./daily-work-entry.component.css']
})
export class DailyWorkEntryComponent implements OnInit {

  @Output() entriesChange = new EventEmitter<WorkEntry[]>();

  /* ===============================
     PROJECTS (USER BASED)
  ================================ */
  assignedProjects: Project[] = [];

  /* ===============================
     FORM STATE
  ================================ */
  project = '';
  description = '';
  hours: number | null = null;
  progress = 0;
  date = this.today();

  /* ===============================
     EDIT MODE
  ================================ */
  isEditing = false;
  editingId: number | null = null;

  entries: WorkEntry[] = [];

  constructor(
    private projectService: ProjectService,
    private employeeService: EmployeeService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadProjectsForLoggedUser();
  }

  /* ===============================
     LOAD PROJECTS FOR LOGGED USER
  ================================ */
  private loadProjectsForLoggedUser(): void {
    const currentUser = this.userService.getCurrentUser();
    if (!currentUser) return;

    this.employeeService.getEmployees().subscribe((employees: Employee[]) => { 
      const employee = employees.find((emp: Employee) => 
        emp.name.toLowerCase() === currentUser.toLowerCase()
      );

      if (!employee) return;

      const department = employee.department.toLowerCase();

      this.projectService.getProjects().subscribe((projects: Project[]) => { 
        this.assignedProjects = projects.filter((p: Project) => 
          p.department?.toLowerCase() === department
        );
      });
    });
  }

  /* ===============================
     ADD / UPDATE ENTRY
  ================================ */
  addEntry(): void {
    if (!this.project || !this.description || !this.hours) return;
    this.resetForm();
  }

  editEntry(entry: WorkEntry): void {
    this.isEditing = true;
    this.editingId = entry.id;

    this.project = entry.project;
    this.description = entry.description;
    this.hours = entry.hours;
    this.progress = entry.progress;
    this.date = entry.date;
  }

  deleteEntry(id: number): void {
    if (this.editingId === id) {
      this.resetForm();
    }
  }

  private resetForm(): void {
    this.project = '';
    this.description = '';
    this.hours = null;
    this.progress = 0;
    this.date = this.today();
    this.isEditing = false;
    this.editingId = null;
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }
}
