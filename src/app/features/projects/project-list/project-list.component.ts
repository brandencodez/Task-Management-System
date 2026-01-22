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
    clientDetails: '',
    projectBrief: '',
    startDate: '',
    finishDate: '',
    department: '',
    status: 'UPCOMING'
  };
  
  showForm = false;
  isEditing = false;
  statuses: ProjectStatus[] = ['UPCOMING', 'ONGOING', 'COMPLETED'];

  constructor(private projectService: ProjectService) {}

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.projects = this.projectService.getProjects();
  }

  //  OPEN ADD FORM
  openAddForm() {
    this.currentProject = {
      id: 0,
      name: '',
      projectType: '',
      clientDetails: '',
      projectBrief: '',
      startDate: '',
      finishDate: '',
      department: '',
      status: 'UPCOMING'
    };
    this.isEditing = false;
    this.showForm = true;
  }

  //  OPEN EDIT FORM
  openEditForm(project: Project) {
    this.currentProject = { ...project }; // Create a copy
    this.isEditing = true;
    this.showForm = true;
  }

  //  SAVE OR UPDATE
  saveProject() {
    if (!this.currentProject.name || !this.currentProject.startDate || 
        !this.currentProject.finishDate || !this.currentProject.department) {
      alert('All fields are required!');
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
}