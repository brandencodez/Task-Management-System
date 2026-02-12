import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { ProjectService } from '../project.service';
import { Project, ProjectStatus } from '../../../shared/models/project.model';
import { Router, NavigationEnd } from '@angular/router';
import { DepartmentService } from '../../department/department.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.css'],
})
export class ProjectListComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  isLoading = false;
  isSaving = false;
  showForm = false;
  isEditing = false;

  projects: Project[] = [];
  departments: { id: number; name: string }[] = [];
  statuses: ProjectStatus[] = ['UPCOMING', 'ONGOING', 'COMPLETED'];

  currentProject: Project = this.getEmptyProject();

  constructor(
    private projectService: ProjectService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private departmentService: DepartmentService
  ) {}

  // ================= INIT =================

  ngOnInit() {
    this.loadProjects();
    this.loadDepartments();

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.router.url.includes('/projects') && !this.showForm) {
          this.loadProjects();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ================= HELPERS =================

  private getEmptyProject(): Project {
    return {
      id: 0,
      name: '',
      projectType: '',
      clientDetails: {
        companyName: '',
        contacts: [{
          name: '',
          designation: '',
          'contact for': '',
          email: '',
          phone: ''
        }],
        address: '',
      },
      projectBrief: '',
      startDate: '',
      finishDate: '',
      department_id: 0,
      department_name: '',
      status: 'UPCOMING',
    };
  }

  private validatePhone(phone: string | undefined): boolean {
    if (!phone) return false;
    return phone.replace(/\D/g, '').length === 10;
  }

  // ================= DATE FORMATTERS =================

  // For displaying in cards (DD-MM-YYYY)
  formatDateForDisplay(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }

  // For edit form (yyyy-MM-dd)
  private formatDateForInput(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // ================= LOAD DATA =================

  loadDepartments() {
    this.departmentService.getActiveDepartments().subscribe({
      next: data => {
        this.departments = data;
        this.cdr.detectChanges();
      },
      error: err => console.error('Failed to load departments', err)
    });
  }

  loadProjects() {
    this.isLoading = true;

    this.projectService.getProjects()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: projects => {
          this.projects = [...projects];
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: err => {
          console.error('Failed to load projects', err);
          this.projects = [];
          this.isLoading = false;
        }
      });
  }

  // ================= FORM CONTROL =================

  openAddForm() {
    this.currentProject = this.getEmptyProject();
    this.isEditing = false;
    this.showForm = true;

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }

  openEditForm(project: Project) {
    this.currentProject = {
      ...project,
      clientDetails: {
        ...project.clientDetails,
        contacts: project.clientDetails.contacts.map(c => ({ ...c }))
      },
      startDate: this.formatDateForInput(project.startDate),
      finishDate: this.formatDateForInput(project.finishDate),
    };

    this.isEditing = true;
    this.showForm = true;
  }

  cancelForm() {
    this.showForm = false;
    this.isEditing = false;
  }

  // ================= SAVE =================

  saveProject() {
    if (this.isSaving) return;

    if (
      !this.currentProject.name ||
      !this.currentProject.startDate ||
      !this.currentProject.finishDate ||
      !this.currentProject.department_id ||
      !this.currentProject.clientDetails.companyName
    ) {
      alert('Please fill all required fields!');
      return;
    }

    const hasValidContact = this.currentProject.clientDetails.contacts.some(c =>
      c.name.trim() && this.validatePhone(c.phone)
    );

    if (!hasValidContact) {
      alert('Please add at least one valid contact with 10 digit phone.');
      return;
    }

    if (new Date(this.currentProject.finishDate) < new Date(this.currentProject.startDate)) {
      alert('Finish date must be after start date!');
      return;
    }

    this.isSaving = true;

    const request$ = this.isEditing
      ? this.projectService.updateProject(this.currentProject)
      : this.projectService.addProject(this.currentProject);

    request$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert(this.isEditing ? 'Project updated!' : 'Project added!');
          this.isSaving = false;
          this.cancelForm();
          this.loadProjects();
        },
        error: err => {
          console.error('Save failed', err);
          alert('Failed to save project.');
          this.isSaving = false;
        }
      });
  }

  // ================= DELETE =================

  deleteProject(id: number) {
    if (!confirm('Are you sure you want to delete this project?')) return;

    this.projectService.deleteProject(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert('Project deleted!');
          this.loadProjects();
        },
        error: err => {
          console.error('Delete failed', err);
          alert('Failed to delete project.');
        }
      });
  }

  // ================= FILTER =================

  getProjectsByStatus(status: ProjectStatus) {
    return this.projects.filter(p => p.status === status);
  }

  // ================= CONTACT =================

  addClientContact() {
    this.currentProject.clientDetails.contacts.push({
      name: '',
      designation: '',
      'contact for': '',
      email: '',
      phone: '',
    });
  }

  removeClientContact(index: number) {
    if (this.currentProject.clientDetails.contacts.length > 1) {
      this.currentProject.clientDetails.contacts.splice(index, 1);
    }
  }
}