import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProjectService } from '../project.service';
import { Project, ProjectStatus } from '../../../shared/models/project.model';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.css']
})
export class ProjectListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  isLoading = false;
  projects: Project[] = [];
  
  // single form object for both add and edit
  currentProject: Project = {
    id: 0,
    name: '',
    projectType: '',
    clientDetails: {
      companyName: '',
      contacts: [{ name: '', designation: '', 'contact for': '', email: '', phone: '' }],
      address: ''
    },
    projectBrief: '',
    startDate: '',
    finishDate: '',
    department: '',
    status: 'UPCOMING'
  };
  
  showForm = false;
  isEditing = false;
  isSaving = false;
  statuses: ProjectStatus[] = ['UPCOMING', 'ONGOING', 'COMPLETED'];

  projectTypesByDepartment: { [key: string]: string[] } = {
    'Development': [
      'Web Application',
      'Mobile App',
      'API Development', 
      'System Integration',
      'DevOps Setup',
      'Database Design',
      'UI/UX Design',
      'Quality Assurance'
    ],
    'HR': [
      'Recruitment Campaign',
      'Employee Onboarding',
      'Training Program',
      'Performance Review',
      'Policy Development',
      'Employee Engagement',
      'Compliance Audit',
      'Benefits Management'
    ],
    'Marketing': [
      'Digital Marketing Campaign',
      'Social Media Strategy',
      'Content Creation',
      'Brand Development',
      'Market Research',
      'Email Marketing',
      'SEO Optimization',
      'Event Planning'
    ],
    'Sales': [
      'Lead Generation',
      'Client Acquisition',
      'Sales Pipeline',
      'Customer Retention',
      'Account Management',
      'Sales Training',
      'CRM Implementation',
      'Revenue Growth'
    ],
    'Finance': [
      'Budget Planning',
      'Financial Analysis',
      'Tax Preparation',
      'Audit Process',
      'Investment Strategy',
      'Cost Reduction',
      'Financial Reporting',
      'Risk Assessment'
    ]
  };

  constructor(
    private projectService: ProjectService,
    private router: Router,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit() {
    // Load projects immediately on component initialization
    this.loadProjects();

    // Also reload when navigating back to this route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event) => {
      // Only reload if we're on the projects route and not showing the form
      if (this.router.url.includes('/projects') && !this.showForm) {
        this.loadProjects();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProjects() {
    this.isLoading = true;
    console.log('🔄 Loading projects...');
    
    this.projectService.getProjects()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (projects) => {
          this.projects = [...projects];
          this.isLoading = false;
          console.log('✅ Projects loaded successfully:', this.projects.length, 'projects');
          // ✅ Force change detection
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('❌ Failed to load projects:', err);
          this.isLoading = false;
          this.projects = []; // Ensure projects is always an array
          alert('Failed to load projects. Please refresh the page.');
          this.cdr.detectChanges(); // ✅ Force change detection
        }
      });
  }

  // OPEN ADD FORM
  openAddForm() {
    this.currentProject = {
      id: 0,
      name: '',
      projectType: '',
      clientDetails: {
        companyName: '',
        contacts: [{ name: '', designation: '', 'contact for': '', email: '', phone: '' }],
        address: ''
      },
      projectBrief: '',
      startDate: '',
      finishDate: '',
      department: '',
      status: 'UPCOMING'
    };
    this.isEditing = false;
    this.showForm = true;
  }

 
  openEditForm(project: Project) {
    // Deep copy the project to avoid reference issues
    this.currentProject = {
      ...project,
      clientDetails: {
        ...project.clientDetails,
        contacts: project.clientDetails.contacts.map(contact => ({ ...contact }))
      }
    };
    this.isEditing = true;
    this.showForm = true;
  }

  // SAVE OR UPDATE
  saveProject() {
    // Prevent double submission
    if (this.isSaving) return;

    if (!this.currentProject.name || !this.currentProject.startDate || 
        !this.currentProject.finishDate || !this.currentProject.department ||
        !this.currentProject.clientDetails.companyName) {
      alert('Please fill all required fields!');
      return;
    }

    const hasValidContact = this.currentProject.clientDetails.contacts.some(contact => contact.name.trim());
    if (!hasValidContact) {
      alert('Please add at least one contact with a name');
      return;
    }

    if (new Date(this.currentProject.finishDate) < new Date(this.currentProject.startDate)) {
      alert('Finish date must be after start date!');
      return;
    }

    this.isSaving = true;

    if (this.isEditing) {
      // Update existing project
      this.projectService.updateProject(this.currentProject)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('✅ Project updated successfully');
            this.isSaving = false;
            this.cancelForm();
            this.loadProjects(); // Reload to show updated data
            setTimeout(() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 100);
          },
          error: (err) => {
            console.error('❌ Failed to update project:', err);
            alert('Failed to update project. Please try again.');
            this.isSaving = false;
          }
        });
    } else {
      // Add new project
      this.projectService.addProject(this.currentProject)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('✅ Project added successfully');
            this.isSaving = false;
            this.cancelForm();
            this.loadProjects(); // Reload to show new project
            setTimeout(() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 100);
          },
          error: (err) => {
            console.error('❌ Failed to add project:', err);
            alert('Failed to add project. Please try again.');
            this.isSaving = false;
          }
        });
    }
  }

  cancelForm() {
    this.showForm = false;
    this.isEditing = false;
  }

  deleteProject(id: number) {
    if (confirm('Are you sure you want to delete this project?')) {
      this.projectService.deleteProject(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('✅ Project deleted successfully');
            this.loadProjects(); // Reload to reflect deletion
          },
          error: (err) => {
            console.error('❌ Failed to delete project:', err);
            alert('Failed to delete project. Please try again.');
          }
        });
    }
  }

  getProjectsByStatus(status: ProjectStatus) {
    return this.projects.filter(p => p.status === status);
  }

  // METHOD FOR DYNAMIC PROJECT TYPES
  getProjectTypes(): string[] {
    if (this.currentProject.department && this.projectTypesByDepartment[this.currentProject.department]) {
      return this.projectTypesByDepartment[this.currentProject.department];
    }
    return [];
  }

  // ADD NEW CONTACT
  addClientContact() {
    this.currentProject.clientDetails.contacts.push({
      name: '',
      designation: '',
      'contact for': '' ,
      email: '',
      phone: ''
    });
  }

  // REMOVE CONTACT
  removeClientContact(index: number) {
    if (this.currentProject.clientDetails.contacts.length > 1) {
      this.currentProject.clientDetails.contacts.splice(index, 1);
    }
  }
}