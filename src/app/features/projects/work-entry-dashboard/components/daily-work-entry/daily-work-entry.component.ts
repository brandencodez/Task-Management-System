import { Component, OnInit, Output, EventEmitter, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { ProjectService } from '../../../project.service';
import { EmployeeService } from '../../../../employees/employee.service';
import { UserService } from '../../../../../shared/services/user.service';
import { ProjectAssignmentService } from '../../../../../shared/services/project-assignment.service'; // ✅ Add this import
import { Project } from '../../../../../shared/models/project.model';
import { Employee } from '../../../../employees/employee.model';
import { WorkEntry, WorkEntryAttachment } from '../../../../../shared/models/work-entry.model';
import { WorkEntryService } from '../../../../../shared/services/work-entry.service';
import { forkJoin } from 'rxjs'; // ✅ Add this import

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
  selectedFiles: File[] = [];
  isDragging = false;

  entries: WorkEntry[] = [];
  private currentEmployeeId: number | null = null; // ✅ Changed to number
  private currentUserDepartmentId: number | null = null; 

  isSubmitting = false;

  constructor(
    private projectService: ProjectService,
    private employeeService: EmployeeService,
    private userService: UserService,
    private workEntryService: WorkEntryService,
    private projectAssignmentService: ProjectAssignmentService, // ✅ Add this dependency
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
          this.currentEmployeeId = employee.id; // ✅ Store as number
          this.currentUserDepartmentId = employee.department_id; 
          this.loadEntries();
          this.loadProjectsForLoggedUser(); // ✅ This will now load assigned projects only
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
   * ✅ UPDATED: Load only projects assigned to the logged-in employee
   * Uses project assignments to filter projects
   */
  private loadProjectsForLoggedUser(): void {
    if (this.currentEmployeeId === null) {
      console.warn('Cannot load projects: employeeId not available');
      return;
    }

    // Load assignments and projects in parallel
    forkJoin({
      assignments: this.projectAssignmentService.getAssignmentsByEmployee(this.currentEmployeeId),
      projects: this.projectService.getProjects()
    }).subscribe({
      next: ({ assignments, projects }) => {
        // Extract project IDs from assignments
        const assignedProjectIds = assignments.map(assignment => assignment.project_id);

        // ✅ Filter projects to only those assigned to this employee
        this.assignedProjects = projects.filter(project =>
          assignedProjectIds.includes(project.id)
        );

        console.log('✅ Assigned projects loaded:', {
          employeeId: this.currentEmployeeId,
          assignedProjectIds,
          projectCount: this.assignedProjects.length
        });

        // Manually trigger change detection after loading projects
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load assigned projects:', err);
        this.assignedProjects = [];
        this.cdr.detectChanges();
      }
    });
  }

  private loadEntries(): void {
    if (!this.currentEmployeeId) {
      console.warn('Cannot load entries: employeeId not available');
      return;
    }
    // Convert to string for the work entry service
    this.workEntryService.getEntries(String(this.currentEmployeeId)).subscribe({
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

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.addFiles(Array.from(input.files));
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files?.length) {
      this.addFiles(Array.from(event.dataTransfer.files));
    }
  }

  private addFiles(files: File[]): void {
    if (this.selectedFiles.length + files.length > 5) {
      alert(`Maximum 5 attachments allowed. You can add ${5 - this.selectedFiles.length} more file(s).`);
      return;
    }

    const validTypes = [
      'image/', 'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument', 'text/csv', 'text/plain',
      'video/mp4', 'audio/', 'application/zip', 'application/x-rar', 'application/x-7z'
    ];

    for (const file of files) {
      const isValid = validTypes.some(type => file.type.startsWith(type));
      if (!isValid) {
        alert(`Invalid file type: ${file.name}. Please upload allowed file types.`);
        return;
      }

      if (file.size > 100 * 1024 * 1024) {
        alert(`File too large: ${file.name}. Max 100MB per file.`);
        return;
      }
    }

    this.selectedFiles = [...this.selectedFiles, ...files];
    this.cdr.detectChanges();
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.cdr.detectChanges();
  }

  submitEntry(): void {
    if (!this.project || !this.description || !this.hours || !this.currentEmployeeId) {
      alert('Please fill all required fields.');
      return;
    }

    this.isSubmitting = true;

    const formData = new FormData();
    formData.append('project', this.project);
    formData.append('description', this.description);
    formData.append('hours', this.hours.toString());
    formData.append('date', this.date);
    formData.append('employeeId', this.currentEmployeeId);

    this.selectedFiles.forEach(file => {
      formData.append('attachments', file, file.name);
    });

    this.workEntryService.createEntryWithAttachments(formData).subscribe({
      next: (createdEntry) => {
        const entryWithAttachments = {
          ...createdEntry,
          attachments: createdEntry.attachments || []
        };
        
        this.entries.unshift(entryWithAttachments);
        this.emitEntries();
        this.resetForm();
        this.isSubmitting = false;
        this.cdr.detectChanges();
        alert('Work entry created successfully with attachments!');
      },
      error: (err) => {
        console.error('Failed to create work entry:', err);
        const msg = err?.error?.message || 'Failed to create work entry.';
        alert(msg);
        this.isSubmitting = false;
      }
    });
  }

  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return '📊';
    if (mimeType.includes('csv')) return '📈';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return '📦';
    if (mimeType === 'text/plain') return '📄';
    if (mimeType.includes('json')) return '📋';
    return '📎';
  }

  getAttachmentUrl(filename: string): string {
    return this.workEntryService.getAttachmentUrl(filename);
  }

  deleteEntry(id: number): void {
    if (!this.currentEmployeeId) return;

    if (!confirm('Are you sure you want to delete this work entry? All attachments will be permanently deleted.')) return;

    this.workEntryService.deleteEntry(id, this.currentEmployeeId).subscribe({
      next: () => {
        this.entries = this.entries.filter(e => e.id !== id);
        this.emitEntries();
        this.cdr.detectChanges();
        alert('Work entry deleted successfully!');
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
    this.selectedFiles = [];
    if (this.attachmentInput) {
      this.attachmentInput.nativeElement.value = '';
    }
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
}