import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../project.service';
import { Project, ProjectStatus } from '../../../shared/models/project.model';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.css']
})
export class ProjectListComponent implements OnInit {
  projects: Project[] = [];
  
  // single form object for both add and edit
  currentProject: Project = {
    id: 0,
    name: '',
    projectType: '',
    clientDetails: {
      companyName: '',
      contacts: [{ name: '', email: '', phone: '' }],
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

  constructor(private projectService: ProjectService) {}

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
  this.projects = this.projectService.getProjects().map(project => {
    // Type guard: check if clientDetails has the old structure
    const clientDetails = project.clientDetails as any;
    
    // Handle legacy single contact format (old structure)
    if (clientDetails && 
        typeof clientDetails === 'object' && 
        !Array.isArray(clientDetails.contacts) &&
        (clientDetails.contactPerson !== undefined || 
         clientDetails.email !== undefined || 
         clientDetails.phone !== undefined)) {
      
      return {
        ...project,
        clientDetails: {
          companyName: clientDetails.companyName || '',
          contacts: [{
            name: clientDetails.contactPerson || '',
            email: clientDetails.email || '',
            phone: clientDetails.phone || ''
          }],
          address: clientDetails.address || ''
        }
      };
    }
    
    // Return as-is for new structure
    return project;
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
        contacts: [{ name: '', email: '', phone: '' }],
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

  // OPEN EDIT FORM
  openEditForm(project: Project) {
    this.currentProject = { ...project };
    this.isEditing = true;
    this.showForm = true;
  }

  // SAVE OR UPDATE
  saveProject() {
    if (!this.currentProject.name || !this.currentProject.startDate || 
        !this.currentProject.finishDate || !this.currentProject.department ||
        !this.currentProject.clientDetails.companyName ||
        !this.currentProject.clientDetails.address) {
      alert('Please fill all required fields!');
      return;
    }

    // Validate at least one contact has a name
    const hasValidContact = this.currentProject.clientDetails.contacts.some(contact => contact.name.trim());
    if (!hasValidContact) {
      alert('Please add at least one contact with a name');
      return;
    }

    if (new Date(this.currentProject.finishDate) < new Date(this.currentProject.startDate)) {
      alert('Finish date must be after start date!');
      return;
    }
    
    if (this.isEditing) {
      // Update existing project
      this.projectService.updateProject(this.currentProject);
    } else {
      // Add new project
      const newProject: Project = {
        ...this.currentProject,
        id: Date.now()
      };
      this.projectService.addProject(newProject);
    }
    
    this.cancelForm();
    this.loadProjects();
  }

  cancelForm() {
    this.showForm = false;
    this.isEditing = false;
  }

  deleteProject(id: number) {
    if (confirm('Are you sure you want to delete this project?')) {
      this.projectService.deleteProject(id);
      this.loadProjects();
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
      email: '',
      phone: ''
    });
  }

  // REMOVE CONTACT
  removeClientContact(index: number) {
    this.currentProject.clientDetails.contacts.splice(index, 1);
  }
}