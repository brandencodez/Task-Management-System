import { Component, OnInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { ProjectService } from '../../../project.service';
import { EmployeeService } from '../../../../employees/employee.service';
import { UserService } from '../../../../../shared/services/user.service';
import { Project } from '../../../../../shared/models/project.model';
import { Employee } from '../../../../employees/employee.model';
import { WorkEntry } from '../../../../../shared/models/work-entry.model';
import { WorkEntryService } from '../../../../../shared/services/work-entry.service';

@Component({
  selector: 'app-daily-work-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './daily-work-entry.component.html',
  styleUrls: ['./daily-work-entry.component.css']
})
export class DailyWorkEntryComponent implements OnInit {

  @Output() entriesChange = new EventEmitter<WorkEntry[]>();

  assignedProjects: Project[] = [];
  project = '';
  description = '';
  hours: number | null = null;
  date = this.today();

  entries: WorkEntry[] = [];
  private currentEmployeeId: string | null = null;
  private currentUserDepartmentId: number | null = null; 

  constructor(
    private projectService: ProjectService,
    private employeeService: EmployeeService,
    private userService: UserService,
    private workEntryService: WorkEntryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadEmployeeInfo();
  }

  /**
   * Load current logged-in employee information
   * Gets employee ID and department ID for filtering projects
   */
  private loadEmployeeInfo(): void {
    const currentUser = this.userService.getCurrentUser();
    if (!currentUser) return;

    const cleanCurrentUser = currentUser.trim().toLowerCase();

    this.employeeService.getEmployees().subscribe({
      next: (employees: Employee[]) => {
        const employee = employees.find(emp =>
          emp.name?.trim().toLowerCase() === cleanCurrentUser
        );

        if (employee) {
          this.currentEmployeeId = String(employee.id);
          this.currentUserDepartmentId = employee.department_id; 
          this.loadEntries();
          this.loadProjectsForLoggedUser();
        } else {
          console.warn('Employee not found for current user:', currentUser);
          alert('Your employee record was not found. Please contact admin.');
        }
      },
      error: (err) => {
        console.error('Failed to load employee info:', err);
        alert('Failed to load your profile. Please log in again.');
      }
    });
  }

  /**
   * Load projects assigned to the logged-in user's department
   * Filters projects based on department_id match
   */
  private loadProjectsForLoggedUser(): void {
    if (this.currentUserDepartmentId === null) return;

    this.projectService.getProjects().subscribe((projects: Project[]) => {
      this.assignedProjects = projects.filter((p: Project) => 
        p.department_id === this.currentUserDepartmentId
      );
      // Manually trigger change detection after loading projects
      this.cdr.detectChanges();
    });
  }

  /**
   * Load all work entries for the current employee
   */
  private loadEntries(): void {
    if (!this.currentEmployeeId) {
      console.warn('Cannot load entries: employeeId not available');
      return;
    }
    this.workEntryService.getEntries(this.currentEmployeeId).subscribe({
      next: (entries) => {
        this.entries = entries;
        this.emitEntries();
        // Trigger change detection after loading entries
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load work entries:', err);
        alert('Failed to load work entries. Please log in again.');
      }
    });
  }

  /**
   * Add a new work entry
   * Validates all required fields before submitting
   */
  addEntry(): void {
    if (!this.project || !this.description || !this.hours || !this.currentEmployeeId) {
      alert('Please fill all required fields and ensure you are logged in.');
      return;
    }

    const newEntry = {
      project: this.project,
      description: this.description,
      hours: this.hours,
      date: this.date,
      employeeId: this.currentEmployeeId 
    };

    console.log('Sending to server:', newEntry);

    this.workEntryService.createEntry(newEntry).subscribe({
      next: (createdEntry) => {
        this.entries.unshift(createdEntry); 
        this.emitEntries();
        this.resetForm();
        // Trigger change detection after adding entry
        this.cdr.detectChanges();
        alert('Work entry added successfully!');
      },
      error: (err) => {
        console.error('Failed to create work entry:', err);
        console.error('Error details:', err.error);
        alert('Failed to save work entry. Please try again.');
      }
    });
  }

  /**
   * Delete a work entry by ID
   * Only deletes if it belongs to the current employee
   */
  deleteEntry(id: number): void {
    if (!this.currentEmployeeId) return;
    this.workEntryService.deleteEntry(id, this.currentEmployeeId).subscribe({
      next: () => {
        this.entries = this.entries.filter(e => e.id !== id);
        this.emitEntries();
        // Trigger change detection after deleting entry
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to delete work entry:', err);
        alert('Failed to delete entry.');
      }
    });
  }

  /**
   * Emit entries to parent component
   */
  private emitEntries(): void {
    this.entriesChange.emit([...this.entries]);
  }

  /**
   * Reset form fields to default values
   */
  private resetForm(): void {
    this.project = '';
    this.description = '';
    this.hours = null;
    this.date = this.today();
  }

  /**
   * Get today's date in YYYY-MM-DD format
   */
  private today(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; 
  }

  /**
   * Format date for display in DD-MM-YYYY format
   */
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