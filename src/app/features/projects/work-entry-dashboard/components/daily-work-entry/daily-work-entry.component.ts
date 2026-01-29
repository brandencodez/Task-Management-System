import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ProjectService } from '../../../project.service';
import { EmployeeService } from '../../../../employees/employee.service';
import { UserService } from '../../../../../shared/services/user.service';
import { Project } from '../../../../../shared/models/project.model';

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
  imports: [CommonModule, FormsModule],
  templateUrl: './daily-work-entry.component.html',
  styleUrls: ['./daily-work-entry.component.css']
})
export class DailyWorkEntryComponent implements OnInit {

  private STORAGE_KEY = 'daily_work_entries';

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

  entries: WorkEntry[] = [];

  constructor(
    private projectService: ProjectService,
    private employeeService: EmployeeService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadEntries();
    this.loadProjectsForLoggedUser();
    this.emitEntries();
  }

  /* ===============================
     LOAD PROJECTS FOR LOGGED USER
  ================================ */
  private loadProjectsForLoggedUser(): void {
    const currentUser = this.userService.getCurrentUser();
    if (!currentUser) return;

    const employee = this.employeeService
      .getEmployees()
      .find((emp: any) =>
        emp.name.toLowerCase() === currentUser.toLowerCase()
      );

    if (!employee) return;

    const department = employee.department.toLowerCase();

    this.assignedProjects = this.projectService
      .getProjects()
      .filter((p: Project) =>
        p.department?.toLowerCase() === department
      );
  }

  /* ===============================
     ADD ENTRY (ONLY ADD)
  ================================ */
  addEntry(): void {
    if (!this.project || !this.description || !this.hours) return;

    this.entries.unshift({
      id: Date.now(),
      project: this.project,
      description: this.description,
      hours: this.hours,
      progress: this.progress,
      date: this.date
    });

    this.save();
    this.emitEntries();
    this.resetForm();
  }

  /* ===============================
     DELETE ENTRY
  ================================ */
  deleteEntry(id: number): void {
    this.entries = this.entries.filter(e => e.id !== id);
    this.save();
    this.emitEntries();
  }

  /* ===============================
     STORAGE
  ================================ */
  private loadEntries(): void {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (data) {
      this.entries = JSON.parse(data);
    }
  }

  private save(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.entries));
  }

  private emitEntries(): void {
    this.entriesChange.emit([...this.entries]);
  }

  private resetForm(): void {
    this.project = '';
    this.description = '';
    this.hours = null;
    this.progress = 0;
    this.date = this.today();
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }
}
