import { Component, OnInit, Output, EventEmitter, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
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
  @ViewChild('attachmentInput') attachmentInput!: ElementRef<HTMLInputElement>;

  assignedProjects: Project[] = [];
  project = '';
  description = '';
  hours: number | null = null;
  date = this.today();
  selectedFile: File | null = null;
  selectedFileName: string = '';

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

  private loadProjectsForLoggedUser(): void {
    if (this.currentUserDepartmentId === null) return;

    this.projectService.getProjects().subscribe((projects: Project[]) => {
      this.assignedProjects = projects.filter((p: Project) => 
        p.department_id === this.currentUserDepartmentId
      );
      this.cdr.detectChanges();
    });
  }

  private loadEntries(): void {
    if (!this.currentEmployeeId) {
      console.warn('Cannot load entries: employeeId not available');
      return;
    }
    this.workEntryService.getEntries(this.currentEmployeeId).subscribe({
      next: (entries) => {
        this.entries = entries;
        this.emitEntries();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load work entries:', err);
        alert('Failed to load work entries. Please log in again.');
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      
      if (file.size > 10 * 1024 * 1024) {
        alert('File too large! Max 10MB allowed.');
        this.resetFileInput();
        return;
      }
      
      const validTypes = [
        'image/jpeg', 'image/png', 'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ];
      
      if (!validTypes.includes(file.type)) {
        alert('Invalid file type! Please upload JPG, PNG, PDF, DOC/X, XLS/X, or TXT.');
        this.resetFileInput();
        return;
      }
      
      this.selectedFile = file;
      this.selectedFileName = file.name;
    }
  }

  private resetFileInput(): void {
    this.selectedFile = null;
    this.selectedFileName = '';
    if (this.attachmentInput) {
      this.attachmentInput.nativeElement.value = '';
    }
  }

  addEntry(): void {
    // Validate all fields INCLUDING mandatory attachment
    if (!this.project || !this.description || !this.hours || !this.currentEmployeeId) {
      alert('Please fill all required fields and ensure you are logged in.');
      return;
    }

    if (!this.selectedFile) {
      alert('Attachment is required. Please upload a file.');
      return;
    }

    const formData = new FormData();
    formData.append('project', this.project);
    formData.append('description', this.description);
    formData.append('hours', this.hours!.toString());
    formData.append('date', this.date);
    formData.append('employeeId', this.currentEmployeeId);
    formData.append('attachment', this.selectedFile, this.selectedFile.name);

    this.workEntryService.createEntry(formData).subscribe({
      next: (createdEntry) => {
        this.entries.unshift(createdEntry); 
        this.emitEntries();
        this.resetForm();
        this.cdr.detectChanges();
        alert('Work entry added successfully!');
      },
      error: (err) => {
        console.error('Failed to create work entry:', err);
        const msg = err?.error?.message || 'Failed to save work entry. Please try again.';
        alert(msg);
      }
    });
  }

  deleteEntry(id: number): void {
    if (!this.currentEmployeeId) return;
    this.workEntryService.deleteEntry(id, this.currentEmployeeId).subscribe({
      next: () => {
        this.entries = this.entries.filter(e => e.id !== id);
        this.emitEntries();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to delete work entry:', err);
        alert('Failed to delete entry.');
      }
    });
  }

  private emitEntries(): void {
    this.entriesChange.emit([...this.entries]);
  }

  private resetForm(): void {
    this.project = '';
    this.description = '';
    this.hours = null;
    this.date = this.today();
    this.resetFileInput();
  }

  private today(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; 
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

  getAttachmentUrl(filename: string): string {
    return this.workEntryService.getAttachmentUrl(filename);
  }

  getAttachmentName(filename: string): string {
    return filename.split('-').slice(1).join('-') || filename;
  }
}