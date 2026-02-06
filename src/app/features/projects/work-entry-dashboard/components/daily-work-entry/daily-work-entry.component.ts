import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { ProjectService } from '../../../project.service';
import { EmployeeService } from '../../../../employees/employee.service';
import { UserService } from '../../../../../shared/services/user.service';
import { WorkEntryService } from '../../../../../shared/services/work-entry.service';
import { AttendanceService } from '../../../../../shared/services/attendance.service';
import { Project } from '../../../../../shared/models/project.model';
<<<<<<< HEAD
import { Employee } from '../../../../employees/employee.model';
import { WorkEntry } from '../../../../../shared/models/work-entry.model';
import { WorkEntryService } from '../../../../../shared/services/work-entry.service';
=======
import { WorkEntry } from '../../../../../shared/models/work-entry.model';
>>>>>>> adf6076 (update User Attendance)

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
  workDetails: string = '';

<<<<<<< HEAD
  entries: WorkEntry[] = [];
  private currentEmployeeId: string | null = null;
=======
  /* ===============================
     EDIT MODE
  ================================ */
  isEditing = false;
  editingId: string | null = null;

  entries: WorkEntry[] = [];
  currentEmployeeId: string = '';
  currentEmployeeName: string = '';
>>>>>>> adf6076 (update User Attendance)

  constructor(
    private projectService: ProjectService,
    private employeeService: EmployeeService,
    private userService: UserService,
<<<<<<< HEAD
    private workEntryService: WorkEntryService
    
  ) {}

  ngOnInit(): void {
=======
    private workEntryService: WorkEntryService,
    private attendanceService: AttendanceService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadEntries();
>>>>>>> adf6076 (update User Attendance)
    this.loadProjectsForLoggedUser();
    this.loadEmployeeId();
  }

  /* ===============================
     LOAD CURRENT USER
  ================================ */
  private loadCurrentUser(): void {
    const currentUser = this.userService.getCurrentUser();
    const employees = this.employeeService.getEmployees();
    
    if (currentUser && employees) {
      const employee = employees.find((emp: any) =>
        emp.name.toLowerCase() === currentUser.toLowerCase()
      );
      
      if (employee) {
        this.currentEmployeeId = employee.id;
        this.currentEmployeeName = employee.name;
      }
    }
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

const departmentId = employee.department_id;

      this.projectService.getProjects().subscribe((projects: Project[]) => { 
        this.assignedProjects = projects.filter((p: Project) => 
          p.department_name?.toLowerCase() === departmentId.toString()
        );
      });
    });
  }
   /* ===============================
     LOAD EMPLOYEE ID
  ================================ */

  private loadEmployeeId(): void {
  const currentUser = this.userService.getCurrentUser();
  if (!currentUser) return;

  const cleanCurrentUser = currentUser.trim().toLowerCase();

  this.employeeService.getEmployees().subscribe({
    next: (employees: Employee[]) => {
      const employee = employees.find(emp =>
        emp.name?.trim().toLowerCase() === cleanCurrentUser
      );

      if (employee) {
        this.currentEmployeeId = String(employee.id); // Ensure string
        this.loadEntries();
        this.loadProjectsForLoggedUser();
      } else {
        console.warn('Employee not found for current user:', currentUser, 'Available employees:', employees.map(e => e.name));
        alert('Your employee record was not found. Please contact admin.');
      }
    },
    error: (err) => {
      console.error('Failed to load employee for work entries:', err);
      alert('Failed to load your profile. Please log in again.');
    }
  });
}

  /* ===============================
     LOAD ENTRIES FROM API
  ================================ */
 private loadEntries(): void {
  if (!this.currentEmployeeId) {
    console.warn('Cannot load entries: employeeId not available');
    return;
  }
  this.workEntryService.getEntries(this.currentEmployeeId).subscribe({
    next: (entries) => {
      this.entries = entries;
      this.emitEntries();
    },
    error: (err) => {
      console.error('Failed to load work entries:', err);
      alert('Failed to load work entries. Please log in again.');
    }
  });
}

  /* ===============================
     ADD ENTRY
  ================================ */
  addEntry(): void {
<<<<<<< HEAD
  if (!this.project || !this.description || !this.hours || !this.currentEmployeeId) {
    alert('Please fill all required fields and ensure you are logged in.');
    return;
=======
    if (!this.project || !this.description || !this.hours) return;
    if (!this.currentEmployeeId) {
      alert('No user logged in. Please login first.');
      return;
    }

    if (this.isEditing && this.editingId !== null) {
      // Update existing entry
      this.workEntryService.update(this.editingId, {
        employeeId: this.currentEmployeeId,
        employeeName: this.currentEmployeeName,
        project: this.project,
        description: this.description,
        hours: this.hours,
        progress: this.progress,
        date: this.date,
        workDetails: this.workDetails
      });
    } else {
      // Add new entry
      this.workEntryService.add({
        employeeId: this.currentEmployeeId,
        employeeName: this.currentEmployeeName,
        project: this.project,
        description: this.description,
        hours: this.hours,
        progress: this.progress,
        date: this.date,
        workDetails: this.workDetails
      });
    }

    // Update attendance with work entry details
    this.updateAttendanceFromWorkEntry();

    this.loadEntries();
    this.emitEntries();
    this.resetForm();
>>>>>>> adf6076 (update User Attendance)
  }

  const newEntry: WorkEntry & { employeeId: string } = {
    id: Date.now(),
    project: this.project,
    description: this.description,
    hours: this.hours,
    progress: this.progress,
    date: this.date,
    employeeId: this.currentEmployeeId // ✅ added
  };

<<<<<<< HEAD
  this.workEntryService.createEntry(newEntry).subscribe({
    next: (createdEntry) => {
      this.entries.unshift(createdEntry);
      this.emitEntries();
=======
    this.project = entry.project;
    this.description = entry.description;
    this.hours = entry.hours;
    this.progress = entry.progress;
    this.date = entry.date;
    this.workDetails = entry.workDetails || '';
  }

  deleteEntry(id: string): void {
    this.workEntryService.delete(id);
    this.loadEntries();
    this.emitEntries();

    if (this.editingId === id) {
>>>>>>> adf6076 (update User Attendance)
      this.resetForm();
    },
    error: (err) => {
      console.error('Failed to create work entry:', err);
      alert('Failed to save work entry. Please try again.');
    }
  });
}

<<<<<<< HEAD
  /* ===============================
     DELETE ENTRY
  ================================ */
 deleteEntry(id: number): void {
  if (!this.currentEmployeeId) return;
  this.workEntryService.deleteEntry(id, this.currentEmployeeId).subscribe({
    next: () => {
      this.entries = this.entries.filter(e => e.id !== id);
      this.emitEntries();
    },
    error: (err) => {
      console.error('Failed to delete work entry:', err);
      alert('Failed to delete entry.');
    }
  });
}

  /* ===============================
     EMIT CHANGES
  ================================ */
=======
  private loadEntries(): void {
    // Load entries for current employee
    if (this.currentEmployeeId) {
      this.entries = this.workEntryService.getByEmployeeId(this.currentEmployeeId);
    }
  }

>>>>>>> adf6076 (update User Attendance)
  private emitEntries(): void {
    this.entriesChange.emit([...this.entries]);
  }

  private resetForm(): void {
    this.project = '';
    this.description = '';
    this.hours = null;
    this.progress = 0;
    this.date = this.today();
<<<<<<< HEAD
=======
    this.workDetails = '';
    this.isEditing = false;
    this.editingId = null;
>>>>>>> adf6076 (update User Attendance)
  }

  /**
   * Update attendance record from work entry
   */
  private updateAttendanceFromWorkEntry(): void {
    if (!this.currentEmployeeId || !this.date) return;

    // Mark or update attendance based on work entry
    this.attendanceService.updateAttendanceWithWorkEntry(
      this.currentEmployeeId,
      this.date,
      {
        workDetails: this.workDetails,
        project: this.project,
        hours: this.hours
      }
    );
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }
}